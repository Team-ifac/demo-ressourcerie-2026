import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveImportedAssets, serveStatic, setupVite } from "./vite";
import { canDownloadResource } from "./policies/resourceAccess";
import * as db from "../db";
import { storageGet } from "../storage";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { logger, httpLogger } from "./logger";
import { errorHandler } from "./errorHandler";
import * as StripeSDK from "stripe";
import {
  handleCheckoutSessionCompleted,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} from "../stripe";

// ✅ FIX ESM : __dirname / __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function normalizeLeadingSlash(p: string) {
  if (!p) return p;
  return p.startsWith("/") ? p : `/${p}`;
}
const resourceViewRegisterThrottle = new Map<string, number>();
const RESOURCE_VIEW_REGISTER_TTL_MS = 30 * 60 * 1000; // 30 minutes

function buildRegisterViewThrottleKey(req: express.Request, userId: number | null, resourceId: number): string {
  if (userId) {
    return `user:${userId}:resource:${resourceId}`;
  }

  const xf = req.headers["x-forwarded-for"];
  const ip =
    (typeof xf === "string" ? xf.split(",")[0].trim() : null) ||
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown";

  const userAgent = String(req.headers["user-agent"] ?? "unknown")
    .slice(0, 200)
    .trim();

  return `anon:${ip}:${userAgent}:resource:${resourceId}`;
}

function shouldRegisterResourceView(
  req: express.Request,
  userId: number | null,
  resourceId: number
): boolean {
  const now = Date.now();
  const key = buildRegisterViewThrottleKey(req, userId, resourceId);
  const lastSeenAt = resourceViewRegisterThrottle.get(key);

  if (lastSeenAt && now - lastSeenAt < RESOURCE_VIEW_REGISTER_TTL_MS) {
    return false;
  }

  resourceViewRegisterThrottle.set(key, now);

  if (resourceViewRegisterThrottle.size > 5000) {
    resourceViewRegisterThrottle.forEach((ts, entryKey) => {
      if (now - ts > RESOURCE_VIEW_REGISTER_TTL_MS) {
        resourceViewRegisterThrottle.delete(entryKey);
      }
    });
  }

  return true;
}
/**
 * Résolution PRO du fileUrl:
 * - http(s)://...                 => redirect direct
 * - /imported/... ou imported/...  => fichier local dans client/public/imported
 * - clé relative (ex: resources/..) => storageGet() => redirect url signée
 */
async function resolveDownloadTarget(fileUrlRaw: string): Promise<
  | { kind: "redirect"; url: string }
  | { kind: "localFile"; absPath: string; filename: string }
> {
  const fileUrl = (fileUrlRaw || "").trim();
  if (!fileUrl) {
    throw new Error("EMPTY_FILEURL");
  }

  // 1) URL externe => redirect
  if (isHttpUrl(fileUrl)) {
    return { kind: "redirect", url: fileUrl };
  }

  const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
  const publicRoot = path.join(PROJECT_ROOT, "client", "public");

  // 2) Cas local public (multi-formats)
  // Accepte par exemple :
  // - /imported/xxx.pdf
  // - /imported/xxx.zip
  // - /documents/xxx.pptx
  // - /media/xxx.mp3
  // - /images/xxx.png
  // - /client/public/imported/xxx.pdf (tolérance legacy)
  const decodedPath = normalizeLeadingSlash(decodeURIComponent(fileUrl));

  const isLocalPublicPath =
    decodedPath.startsWith("/imported/") ||
    decodedPath.startsWith("/documents/") ||
    decodedPath.startsWith("/media/") ||
    decodedPath.startsWith("/images/") ||
    decodedPath.startsWith("/client/public/");

  if (isLocalPublicPath) {
    let rel = decodedPath;

    if (rel.startsWith("/client/public/")) {
      rel = rel.slice("/client/public".length);
    }

    if (rel === "/" || rel.trim() === "") {
      throw new Error("EMPTY_LOCAL_PUBLIC_PATH");
    }

    const absPath = path.resolve(publicRoot, "." + rel);
    const publicRootResolved = path.resolve(publicRoot) + path.sep;
    const resolvedAbsPath = path.resolve(absPath);

    if (!resolvedAbsPath.startsWith(publicRootResolved)) {
      throw new Error("INVALID_PATH_TRAVERSAL");
    }

    const filename = path.basename(resolvedAbsPath);
    if (!filename) {
      throw new Error("EMPTY_LOCAL_PUBLIC_FILENAME");
    }

    return { kind: "localFile", absPath: resolvedAbsPath, filename };
  }

  // 3) Sinon => on traite comme "storage key"
  // ex: "resources/xxx.pdf" ou "uploads/xxx.pptx"
  const key = fileUrl.replace(/^\/+/, "");
  const { url } = await storageGet(key);
  return { kind: "redirect", url };
}

async function startServer() {
  const app = express();
const server = createServer(app);

// ✅ Nécessaire pour lire la session (COOKIE_NAME) dans createContext()
// Sans ça : req.cookies = undefined => me=null => download => NOT_FOUND
app.use(cookieParser());

    // ✅ Trust proxy (important pour récupérer la vraie IP derrière proxy)
  app.set("trust proxy", 1);
    // ✅ Cookies (session auth)
  app.use(cookieParser());
  // ✅ Cookies (OBLIGATOIRE pour que createContext puisse lire la session)
  app.use(cookieParser());
  // =========================================================
  // ✅ OBSERVABILITÉ — Logger HTTP (centralisé)
  // - Toute la config vit dans server/_core/logger.ts
  // - Ici on ne fait qu’utiliser le logger unique
  // =========================================================
  app.use(httpLogger);

  // Petit helper pratique pour nos logs “app”
  (app as any).logger = logger;

  // ✅ Security headers (PRO)
// IMPORTANT: en DEV, Vite + React utilisent des scripts inline (preamble) => CSP casse tout.
if (process.env.NODE_ENV !== "development") {
  app.use(helmet());
} else {
  // Dev mode: on garde helmet mais on neutralise ce qui bloque Vite/React
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );

  // Par sécurité: si jamais un CSP traîne, on le supprime explicitement en DEV
  app.use((_req, res, next) => {
    res.removeHeader("Content-Security-Policy");
    res.removeHeader("Content-Security-Policy-Report-Only");
    next();
  });
}

  // ✅ CORS (propre pour dev local)
  const allowedOrigins = new Set<string>([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);

  app.use(
    cors({
      origin(
  origin: string | undefined,
  cb: (err: Error | null, allow?: boolean) => void
) {
  if (!origin) return cb(null, true);
  if (allowedOrigins.has(origin)) return cb(null, true);
  return cb(null, false);
},

      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // =========================================================
  // ✅ Stripe webhook (PRO)
  // IMPORTANT :
  // - doit être AVANT express.json()
  // - Stripe exige le body brut pour vérifier la signature
  // =========================================================
  const StripeWebhookCtor: any = (StripeSDK as any).default ?? StripeSDK;
  const stripeWebhookClient = process.env.STRIPE_SECRET_KEY?.trim()
    ? new StripeWebhookCtor(process.env.STRIPE_SECRET_KEY.trim(), {
        apiVersion: "2025-12-15.clover",
      })
    : null;

  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const requestId = (req as any)?.id;
      const log = logger.child({ requestId, route: "POST /api/stripe/webhook" });

      if (!stripeWebhookClient || !STRIPE_WEBHOOK_SECRET) {
        log.warn(
          { event: "stripe_webhook_disabled" },
          "Stripe webhook disabled: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET"
        );
        return res.status(503).send("Stripe webhook not configured");
      }

      const signature = req.headers["stripe-signature"];
      if (!signature || typeof signature !== "string") {
        log.warn(
          { event: "stripe_webhook_missing_signature" },
          "Missing Stripe signature"
        );
        return res.status(400).send("Missing stripe-signature header");
      }

      let event: StripeSDK.Stripe.Event;

      try {
        event = stripeWebhookClient.webhooks.constructEvent(
          req.body,
          signature,
          STRIPE_WEBHOOK_SECRET
        );
      } catch (err: any) {
        log.warn(
          {
            event: "stripe_webhook_invalid_signature",
            details: String(err?.message ?? err),
          },
          "Invalid Stripe webhook signature"
        );
        return res.status(400).send(`Webhook Error: ${String(err?.message ?? err)}`);
      }

      try {
        switch (event.type) {
          case "checkout.session.completed":
            await handleCheckoutSessionCompleted(
              event.data.object as StripeSDK.Stripe.Checkout.Session
            );
            break;

          case "customer.subscription.updated":
            await handleSubscriptionUpdated(
              event.data.object as StripeSDK.Stripe.Subscription
            );
            break;

          case "customer.subscription.deleted":
            await handleSubscriptionDeleted(
              event.data.object as StripeSDK.Stripe.Subscription
            );
            break;

          default:
            log.info(
              { event: "stripe_webhook_ignored", stripeEventType: event.type },
              "Unhandled Stripe event ignored"
            );
            break;
        }

        log.info(
          {
            event: "stripe_webhook_processed",
            stripeEventType: event.type,
            stripeEventId: event.id,
          },
          "Stripe webhook processed"
        );

        return res.json({ received: true });
      } catch (err: any) {
        log.error(
          {
            event: "stripe_webhook_handler_failed",
            stripeEventType: event.type,
            stripeEventId: event.id,
            err,
          },
          "Stripe webhook handler failed"
        );
        return res.status(500).send("Webhook handler failed");
      }
    }
  );

  // ✅ Body parser
  // Important : les uploads admin passent en base64 dans tRPC JSON,
  // donc il faut une limite plus haute que 10mb.
  app.use(express.json({ limit: "120mb" }));
  app.use(express.urlencoded({ limit: "120mb", extended: true }));

  // Long URL warning
    // =========================================================
  // ✅ Rate limiting (PRO)
  // - En DEV (localhost), on désactive le rate limit pour ne jamais casser la démo
  // - En PROD, on limite uniquement les endpoints API sensibles
  // =========================================================
  const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
  // ✅ En DEV : aucun rate limit (sinon Vite / React / tRPC explosent)
  skip: () => process.env.NODE_ENV === "development",
});

// ✅ Le rate limit ne s’applique qu’à l’API
app.use("/api", apiLimiter);

  app.use((req, _res, next) => {
    if (req.url.length > 8000) {
      console.warn(`[WARNING] Long URL detected: ${req.url.length} chars`);
    }
    next();
  });

  server.headersTimeout = 60000;
  server.requestTimeout = 60000;

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

    // =========================================================
  // ✅ DEV ONLY — route de test pour valider le global error handler
  // (à supprimer plus tard, ou à laisser DEV-only)
  // =========================================================
  if (process.env.NODE_ENV === "development") {
    app.get("/api/__debug/crash", (_req, _res) => {
      throw new Error("DEBUG_CRASH");
    });
  }

  // =========================================================
  // ✅ Import ZIP Option B (PRO) — upload depuis l'admin
  // + ✅ Logs métier audit-ready (outil national)
  // - Upload ZIP (binaire)
  // - Dézip dans un dossier safe
  // - Lance le script Option B existant (dry-run / audit / import)
  // =========================================================
  app.post(
    "/api/admin/import-zip-optionb",
    express.raw({
      type: ["application/zip", "application/octet-stream"],
      limit: "1024mb",
    }),
    async (req, res) => {
      const requestId = (req as any)?.id;
      const log = logger.child({ requestId, route: "POST /api/admin/import-zip-optionb" });

      // helpers
      const safeLen = (s: string, max = 4000) => (s.length > max ? s.slice(0, max) + "…(truncated)" : s);

      try {
        // ✅ Auth admin via le même context que tRPC
        const ctx = await createContext({ req, res } as any);
        const me: any = (ctx as any)?.me ?? (ctx as any)?.user ?? null;

        // ✅ Mode
        const dryRun = String(req.query.dryRun ?? "") === "1";
        const audit = String(req.query.audit ?? "") === "1";

        // Log attempt (avant de toucher au disque)
        log.info(
          {
            event: "admin_import_zip_attempt",
            actor: me ? { id: me.id, role: me.role } : null,
            flags: { dryRun, audit },
          },
          "Import ZIP attempt"
        );

        if (!me || me.role !== "admin") {
          log.warn(
            { event: "admin_import_zip_forbidden", actor: me ? { id: me.id, role: me.role } : null },
            "Forbidden import ZIP"
          );
          return res.status(403).json({ ok: false, error: "Forbidden" });
        }

        // ✅ Payload
        const buf = req.body as Buffer;
        if (!buf || !Buffer.isBuffer(buf) || buf.length === 0) {
          log.warn(
            { event: "admin_import_zip_empty_body", actor: { id: me.id, role: me.role } },
            "Empty ZIP body"
          );
          return res.status(400).json({ ok: false, error: "Empty ZIP body" });
        }

        log.info(
          {
            event: "admin_import_zip_payload_ok",
            actor: { id: me.id, role: me.role },
            zipBytes: buf.length,
            flags: { dryRun, audit },
          },
          "ZIP payload received"
        );

        const { spawn } = await import("child_process");

        // ✅ Dossiers safe
        const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
        const importTmp = path.join(PROJECT_ROOT, "import_tmp");
        const uploadsDir = path.join(importTmp, "_uploads_zip");
        const extractDirBase = path.join(importTmp, "_extract_zip");

        fs.mkdirSync(uploadsDir, { recursive: true });
        fs.mkdirSync(extractDirBase, { recursive: true });

        const stamp = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const zipPath = path.join(uploadsDir, `import_${stamp}.zip`);
        const extractRoot = path.join(extractDirBase, `extract_${stamp}`);

        fs.mkdirSync(extractRoot, { recursive: true });
        fs.writeFileSync(zipPath, buf);

        log.info(
          {
            event: "admin_import_zip_written",
            actor: { id: me.id, role: me.role },
            zipPath: path.basename(zipPath),
            extractRoot: path.basename(extractRoot),
          },
          "ZIP written to disk"
        );

        const run = (cmd: string, args: string[]) =>
          new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
            const child = spawn(cmd, args, { stdio: "pipe" });
            let stdout = "";
            let stderr = "";
            child.stdout.on("data", (d) => (stdout += d.toString()));
            child.stderr.on("data", (d) => (stderr += d.toString()));
            child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
          });

        // ✅ 1) Dézip (Mac: ditto)
        log.info(
          { event: "admin_import_zip_unzip_start", actor: { id: me.id, role: me.role } },
          "Unzip start"
        );

        const unzipRes = await run("ditto", ["-x", "-k", zipPath, extractRoot]);
        if (unzipRes.code !== 0) {
          log.error(
            {
              event: "admin_import_zip_unzip_failed",
              actor: { id: me.id, role: me.role },
              code: unzipRes.code,
              details: safeLen(unzipRes.stderr || unzipRes.stdout || ""),
            },
            "Unzip failed"
          );
          return res.status(500).json({
            ok: false,
            error: "Unzip failed",
            details: unzipRes.stderr || unzipRes.stdout,
          });
        }

        log.info(
          {
            event: "admin_import_zip_unzip_ok",
            actor: { id: me.id, role: me.role },
            extractRoot,
          },
          "Unzip ok"
        );

        // ✅ 2) Lance le moteur Option B existant
        const scriptPath = path.resolve(PROJECT_ROOT, "server/_scripts/import_zip_optionB.ts");

        const args = [
          "-s",
          "tsx",
          "-r",
          "dotenv/config",
          scriptPath,
          "--extract-root",
          extractRoot,
        ];

        if (dryRun) args.push("--dry-run");
        if (audit) args.push("--audit");

        log.info(
          {
            event: "admin_import_zip_script_start",
            actor: { id: me.id, role: me.role },
            flags: { dryRun, audit },
          },
          "Import script start"
        );

        const importRes = await run("pnpm", args);

        if (importRes.code !== 0) {
          log.error(
            {
              event: "admin_import_zip_script_failed",
              actor: { id: me.id, role: me.role },
              code: importRes.code,
              stderr: safeLen(importRes.stderr || ""),
              stdout: safeLen(importRes.stdout || ""),
            },
            "Import Option B failed"
          );
          return res.status(500).json({
            ok: false,
            error: "Import Option B failed",
            details: importRes.stderr || importRes.stdout,
          });
        }

        log.info(
          {
            event: "admin_import_zip_script_ok",
            actor: { id: me.id, role: me.role },
            stdout: safeLen(importRes.stdout || ""),
          },
          "Import script ok"
        );

        let auditResult: any = null;

        if (audit) {
          const startMarker = "AUDIT_RESULT_JSON_START";
          const endMarker = "AUDIT_RESULT_JSON_END";

          const stdout = String(importRes.stdout || "");
          const startIndex = stdout.indexOf(startMarker);
          const endIndex = stdout.indexOf(endMarker);

          if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            const jsonText = stdout
              .slice(startIndex + startMarker.length, endIndex)
              .trim();

            try {
              auditResult = JSON.parse(jsonText);
            } catch (parseError: any) {
              log.warn(
                {
                  event: "admin_import_zip_audit_json_parse_failed",
                  actor: { id: me.id, role: me.role },
                  details: String(parseError?.message ?? parseError),
                },
                "Audit JSON parse failed"
              );
            }
          }
        }

        const stdoutText = String(importRes.stdout || "");

        const extractCount = (label: string) => {
          const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const match = stdoutText.match(new RegExp(`${escaped}\\s*:\\s*(\\d+)`, "i"));
          return match ? Number(match[1]) : 0;
        };

        const actionType: "AUDIT" | "DRY_RUN" | "WRITE" = audit
          ? "AUDIT"
          : dryRun
          ? "DRY_RUN"
          : "WRITE";

        try {
          await db.addImportHistory({
            userId: Number(me.id),
            actionType,
            zipFileName: path.basename(zipPath),
            extractRoot,
            detectedPdfs: auditResult?.detectedPdfs ?? extractCount("PDFs détectés"),
            inDb: auditResult?.inDb ?? 0,
            wouldImport: auditResult?.wouldImport ?? 0,
            wouldUpdate: auditResult?.wouldUpdate ?? 0,
            imported: extractCount("Importés (nouveaux)"),
            updated: extractCount("Mis à jour (PDF remplacés)"),
            skipped: extractCount("Skippés (inchangés)"),
            failed: extractCount("Échecs"),
            rawOutput: stdoutText,
          });
        } catch (historyError: any) {
          log.warn(
            {
              event: "admin_import_zip_history_write_failed",
              actor: { id: me.id, role: me.role },
              details: String(historyError?.message ?? historyError),
            },
            "Import history write failed"
          );
        }

        log.info(
          {
            event: "admin_import_zip_completed",
            actor: { id: me.id, role: me.role },
            extractRoot,
            flags: { dryRun, audit },
            auditJsonDetected: !!auditResult,
            actionType,
          },
          "Import ZIP completed"
        );

        return res.json({
          ok: true,
          extractRoot,
          output: importRes.stdout,
          auditResult,
        });
      } catch (err: any) {
        log.error(
          {
            event: "admin_import_zip_failed",
            err,
            query: { dryRun: req.query.dryRun, audit: req.query.audit },
          },
          "Import ZIP Option B failed (unhandled)"
        );

        return res.status(500).json({
          ok: false,
          error: "Internal error",
          details: String(err?.message ?? err),
        });
      }
    }
  );

  // =========================================================
  // ✅ Route sécurisée PRO de téléchargement des ressources
  // + ✅ Logs métier audit-ready (outil national)
  // =========================================================
  app.get("/api/resources/download/:id", async (req, res) => {
    // ✅ Logger métier "garanti visible" + requestId pour audit
    const requestId = (req as any)?.id;
    const log = logger.child({ requestId, route: "GET /api/resources/download/:id" });

    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        log.warn({ event: "resource_download_invalid_id", resourceIdRaw: req.params.id }, "Invalid resource id");
        return res.status(400).send("Invalid resource id");
      }

      // Recrée le même context que tRPC (auth optionnelle)
      const ctx = await createContext({ req, res } as any);
      const me: any = (ctx as any)?.me ?? (ctx as any)?.user ?? null;

      // ✅ Source de vérité : DB
      const resource: any = await db.getResourceById(id, {
        includeInternal: true,
        includePremium: true,
        isAdmin: true,
      });

      if (!resource) {
        log.info(
          {
            event: "resource_download_not_found",
            resourceId: id,
            actor: me ? { id: me.id, role: me.role } : null,
          },
          "Resource not found"
        );
        return res.status(404).send("Not found");
      }

      const incrementResourceDownloadCountOnly = async (resourceId: number) => {
        try {
          const dbConn = await db.getDb();
          if (!dbConn) return;

          const schema = await import("../../drizzle/schema");
          const resourcesTable =
            (schema as any).resources ||
            (schema as any).resourcesTable ||
            (schema as any).resources_table;

          if (!resourcesTable?.id || !resourcesTable?.downloadCount) {
            return;
          }

          const { eq, sql } = await import("drizzle-orm");

          await dbConn
            .update(resourcesTable)
            .set({
              downloadCount: sql`COALESCE(${resourcesTable.downloadCount}, 0) + 1`,
            } as any)
            .where(eq(resourcesTable.id, resourceId as any));
        } catch (e) {
          logger.warn(
            {
              event: "resource_download_count_increment_skipped",
              resourceId,
              details: String((e as any)?.message ?? e),
            },
            "Download count increment skipped"
          );
        }
      };

      // Log de tentative (audit)
      log.info(
        {
          event: "resource_download_attempt",
          resourceId: id,
          actor: me ? { id: me.id, role: me.role } : null,
          resource: {
            accessLevel: resource.accessLevel,
            status: resource.status,
          },
        },
        "Download attempt"
      );

      // ✅ Entitlements canonique (audit-proof) — module partagé (outil national)
      // Objectif : même logique partout, sans import depuis "../routers" (évite les dépendances circulaires)
      const { buildEntitlementsForUser } = await import("./entitlements");
      const entState = await buildEntitlementsForUser(me);

      const isLogged = entState.isLogged;
      const isAdmin = entState.isAdmin;
      const isStaff = entState.entitlements.isStaff;   // ✅ formateur => staff
      const isPremium = entState.entitlements.isPremium;

      // injecte entitlements dans me pour que la policy soit 100% fiable
const meWithEntitlements = me
  ? { ...me, entitlements: entState.entitlements }
  : null;

// ✅ SÉCURITÉ DOWNLOAD : appliquée côté serveur (source de vérité = policy)
if (!canDownloadResource({ resource, me: meWithEntitlements })) {
        log.warn(
          {
            event: "resource_download_forbidden",
            resourceId: id,
            actor: me ? { id: me.id, role: me.role } : null,
            resource: { accessLevel: resource.accessLevel, status: resource.status },
          },
          "Download forbidden"
        );

        // ✅ NOT_FOUND pour éviter toute fuite d'existence
        return res.status(404).send("Not found");
      }

      // ✅ Source de vérité : storageKey (fallback fileUrl)
      const storageKeyRaw: string | undefined = (resource as any)?.storageKey ?? undefined;
      const fileUrlRaw: string | undefined = (resource as any)?.fileUrl ?? undefined;

      const pick = (v?: string) => (v && String(v).trim().length > 0 ? String(v).trim() : undefined);
      const chosen = pick(storageKeyRaw) ?? pick(fileUrlRaw);

      if (!chosen) {
        log.info(
          { event: "resource_download_no_file", resourceId: id, actor: me ? { id: me.id, role: me.role } : null },
          "No file for this resource"
        );
        return res.status(404).send("No file for this resource");
      }

      // On loggue le “type” de source sans exposer d’URL signée ou de chemin exact
      const chosenType =
        isHttpUrl(chosen) ? "external_url" : normalizeLeadingSlash(decodeURIComponent(chosen)).startsWith("/imported/") ? "imported_local" : "storage_key";

      const target = await resolveDownloadTarget(chosen);

      log.info(
        {
          event: "resource_download_resolved",
          resourceId: id,
          actor: me ? { id: me.id, role: me.role } : null,
          chosenType,
          targetKind: target.kind,
          filename: target.kind === "localFile" ? target.filename : undefined,
        },
        "Download resolved"
      );

      // 1) redirect (http(s) direct OU storageGet)
      if (target.kind === "redirect") {
        await incrementResourceDownloadCountOnly(id);

        try {
          await db.addResourceHistory({
            resourceId: id,
            userId: me?.id ?? null,
            action: "downloaded",
            changes: `Téléchargement effectué (redirect)`,
          });
        } catch (historyError) {
          log.warn(
            {
              event: "resource_download_history_failed",
              resourceId: id,
              actor: me ? { id: me.id, role: me.role } : null,
              details: String((historyError as any)?.message ?? historyError),
            },
            "Download history write failed"
          );
        }

        // ⚠️ On ne loggue pas l’URL (peut être signée)
        log.info(
          {
            event: "resource_download_completed",
            resourceId: id,
            outcome: "redirect",
            actor: me ? { id: me.id, role: me.role } : null,
          },
          "Download completed"
        );
        return res.redirect(302, target.url);
      }

      // 2) local file
      const resolvedAbsPath = target.absPath;

      if (!fs.existsSync(resolvedAbsPath)) {
        log.warn(
          { event: "resource_download_file_missing", resourceId: id, filename: target.filename, actor: me ? { id: me.id, role: me.role } : null },
          "File missing on server"
        );
        return res.status(404).send("File not found on server");
      }

      const filename = target.filename;
      const lowerFilename = filename.toLowerCase();

      const getContentType = (name: string): string => {
        if (name.endsWith(".pdf")) return "application/pdf";
        if (name.endsWith(".zip")) return "application/zip";
        if (name.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
        if (name.endsWith(".pptx")) {
          return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        }
        if (name.endsWith(".xls")) return "application/vnd.ms-excel";
        if (name.endsWith(".xlsx")) {
          return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        }
        if (name.endsWith(".doc")) return "application/msword";
        if (name.endsWith(".docx")) {
          return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        if (name.endsWith(".webp")) return "image/webp";
        if (name.endsWith(".gif")) return "image/gif";
        if (name.endsWith(".svg")) return "image/svg+xml";
        if (name.endsWith(".mp3")) return "audio/mpeg";
        if (name.endsWith(".wav")) return "audio/wav";
        if (name.endsWith(".ogg")) return "audio/ogg";
        if (name.endsWith(".mp4")) return "video/mp4";
        if (name.endsWith(".webm")) return "video/webm";
        if (name.endsWith(".txt")) return "text/plain; charset=utf-8";
        return "application/octet-stream";
      };

      const canInline = (name: string): boolean => {
        return (
          name.endsWith(".pdf") ||
          name.endsWith(".png") ||
          name.endsWith(".jpg") ||
          name.endsWith(".jpeg") ||
          name.endsWith(".webp") ||
          name.endsWith(".gif") ||
          name.endsWith(".svg") ||
          name.endsWith(".mp3") ||
          name.endsWith(".wav") ||
          name.endsWith(".ogg") ||
          name.endsWith(".mp4") ||
          name.endsWith(".webm") ||
          name.endsWith(".txt")
        );
      };

      const contentType = getContentType(lowerFilename);
      const disposition = canInline(lowerFilename) ? "inline" : "attachment";

      // ✅ Headers explicites multi-formats
      res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);
      res.setHeader("Content-Type", contentType);
      res.setHeader("X-Content-Type-Options", "nosniff");

      await incrementResourceDownloadCountOnly(id);

      const stream = fs.createReadStream(resolvedAbsPath);
      stream.on("error", (e) => {
        log.error(
          {
            event: "resource_download_stream_error",
            resourceId: id,
            filename,
            err: e,
            actor: me ? { id: me.id, role: me.role } : null,
          },
          "Error reading file"
        );
        res.status(500).send("Error reading file");
      });

      stream.on("close", async () => {
        try {
          await db.addResourceHistory({
            resourceId: id,
            userId: me?.id ?? null,
            action: "downloaded",
            changes: `Téléchargement effectué (${disposition === "inline" ? "lecture directe" : "téléchargement fichier"})`,
          });
        } catch (historyError) {
          log.warn(
            {
              event: "resource_download_history_failed",
              resourceId: id,
              actor: me ? { id: me.id, role: me.role } : null,
              details: String((historyError as any)?.message ?? historyError),
            },
            "Download history write failed"
          );
        }

        log.info(
          {
            event: "resource_download_completed",
            resourceId: id,
            outcome: disposition === "inline" ? "stream_inline" : "stream_attachment",
            contentType,
            filename,
            actor: me ? { id: me.id, role: me.role } : null,
          },
          "Download completed"
        );
      });

      stream.pipe(res);
    } catch (err: any) {
      const msg = String(err?.message || "");
      const code = err?.code || err?.name;

      // erreurs “propres”
      if (msg === "EMPTY_FILEURL" || msg === "EMPTY_IMPORTED_PATH") {
        log.info({ event: "resource_download_no_file", err, resourceIdRaw: req.params.id }, "No file for this resource");
        return res.status(404).send("No file for this resource");
      }
      if (msg === "INVALID_PATH_TRAVERSAL") {
        log.warn({ event: "resource_download_invalid_path", err, resourceIdRaw: req.params.id }, "Invalid path traversal");
        return res.status(400).send("Invalid path");
      }

      // erreurs d’accès côté tRPC/policy (si jamais)
      if (code === "FORBIDDEN" || msg.includes("Accès non autorisé")) {
        log.warn(
          { event: "resource_download_forbidden_error", err, resourceIdRaw: req.params.id },
          "Forbidden (masked as NOT_FOUND)"
        );
        // ✅ Standard anti-fuite : jamais FORBIDDEN, toujours NOT_FOUND
        return res.status(404).send("Not found");
      }
      if (code === "NOT_FOUND" || msg.includes("non trouvée")) {
        log.info({ event: "resource_download_not_found_error", err, resourceIdRaw: req.params.id }, "Not found");
        return res.status(404).send("Not found");
      }

      log.error({ event: "resource_download_error", err, resourceIdRaw: req.params.id }, "Internal error");
      return res.status(500).send("Internal error");
    }
  });
  app.post("/api/resources/register-view/:id", async (req, res) => {
    const requestId = (req as any)?.id;
    const log = logger.child({ requestId, route: "POST /api/resources/register-view/:id" });

    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ ok: false, error: "Invalid resource id" });
      }

      const ctx = await createContext({ req, res } as any);
      const me: any = (ctx as any)?.me ?? (ctx as any)?.user ?? null;

      const resource: any = await db.getResourceById(id, {
        includeInternal: true,
        includePremium: true,
        isAdmin: true,
      });

      if (!resource) {
        return res.status(404).json({ ok: false, error: "Not found" });
      }

      const { buildEntitlementsForUser } = await import("./entitlements");
      const entState = await buildEntitlementsForUser(me);

      const meWithEntitlements = me
        ? { ...me, entitlements: entState.entitlements }
        : null;

      if (!canDownloadResource({ resource, me: meWithEntitlements })) {
        return res.status(404).json({ ok: false, error: "Not found" });
      }

      const shouldRegister = shouldRegisterResourceView(req, me?.id ?? null, id);

      if (!shouldRegister) {
        log.info(
          {
            event: "resource_view_register_throttled",
            resourceId: id,
            actor: me ? { id: me.id, role: me.role } : null,
          },
          "Resource view throttled"
        );

        return res.json({ ok: true, throttled: true });
      }

      const dbConn = await db.getDb();
      if (!dbConn) {
        return res.status(500).json({ ok: false, error: "Database not available" });
      }

      const schema = await import("../../drizzle/schema");
      const resourcesTable =
        (schema as any).resources ||
        (schema as any).resourcesTable ||
        (schema as any).resources_table;

      if (!resourcesTable?.id || !resourcesTable?.viewCount) {
        return res.status(500).json({ ok: false, error: "viewCount column not available" });
      }

      const { eq, sql } = await import("drizzle-orm");

      await dbConn
        .update(resourcesTable)
        .set({
          viewCount: sql`COALESCE(${resourcesTable.viewCount}, 0) + 1`,
        } as any)
        .where(eq(resourcesTable.id, id as any));

      try {
        await db.addResourceHistory({
          resourceId: id,
          userId: me?.id ?? null,
          action: "viewed",
          changes: "Consultation de la ressource",
        });
      } catch (historyError) {
        log.warn(
          {
            event: "resource_view_history_failed",
            resourceId: id,
            actor: me ? { id: me.id, role: me.role } : null,
            details: String((historyError as any)?.message ?? historyError),
          },
          "View history write failed"
        );
      }

      log.info(
        {
          event: "resource_view_registered",
          resourceId: id,
          actor: me ? { id: me.id, role: me.role } : null,
        },
        "Resource view registered"
      );

      return res.json({ ok: true });
    } catch (err: any) {
      log.error(
        {
          event: "resource_view_register_error",
          resourceIdRaw: req.params.id,
          err,
        },
        "Register view failed"
      );

      return res.status(500).json({ ok: false, error: "Internal error" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // =========================================================
  // ✅ API 404 (PRO)
  // - Si une route /api/* n'existe pas, on répond en JSON
  // - Important : AVANT Vite/static sinon React répond 200
  // =========================================================
  app.use("/api", (_req, res) => {
    return res.status(404).json({ ok: false, error: "Not found" });
  });

  // Static imported assets
  serveImportedAssets(app);

  // dev mode uses Vite, prod uses static
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  // =========================================================
  // ✅ Error handler global (audit-ready)
  // - doit être après toutes les routes/middlewares
  // =========================================================
  app.use(errorHandler);

  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
