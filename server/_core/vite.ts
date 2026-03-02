import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server/_core -> server -> project root
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

const IMPORTED_PREFIX = "/imported";
const IMPORTED_THUMBS_PREFIX = "/imported_thumbs";

function isImportedRequestPath(url: string) {
  return (
    url === IMPORTED_PREFIX ||
    url.startsWith(IMPORTED_PREFIX + "/") ||
    url === IMPORTED_THUMBS_PREFIX ||
    url.startsWith(IMPORTED_THUMBS_PREFIX + "/")
  );
}

function safeDecodeURIComponent(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function stripDiacritics(s: string) {
  // NFD splits accents; remove combining marks; keep base letters
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeFilenameKey(filename: string) {
  // Goal: stable key even with accents/apostrophes/spacing differences
  // Example: "Critères d'évaluations BAFD.pdf" -> "criteres d evaluations bafd.pdf"
  return stripDiacritics(filename)
    .replace(/['’]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Canonical alias table (minimal, explicit, scalable).
 * Keys are normalized by normalizeFilenameKey().
 *
 * IMPORTANT:
 * - Keep this list short.
 * - Each alias must point to a REAL file on disk under:
 *   /imported/<profile>/PUBLIC/_A_CLASSER/...
 */
const LEGACY_FORMATEUR_ALIASES: Record<string, string> = {
  // Legacy DB request observed in logs:
  // /imported/formateur/Crite%CC%80res%20d'e%CC%81valuations%20BAFD.pdf
  // Desired canonical on disk:
  // /imported/formateur/PUBLIC/_A_CLASSER/Criteres BAFD.pdf
  "criteres d evaluations bafd.pdf": "Criteres BAFD.pdf",
};

function createImportedPathMapper(importedDirAbs: string) {
  return function mapImportedPath(
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) {
    const original = req.url;

    // 1) decode
    let decoded = safeDecodeURIComponent(original);

    // 2) drop legacy "/publie" segments
    if (decoded.includes("/publie/")) {
      decoded = decoded.replace(/\/publie(?=\/)/g, "");
    }

    // 3) normalize Unicode NFC for stable filesystem checks
    const normalized = decoded.normalize("NFC");

    const existsOnDisk = (urlPathInsideImported: string) => {
      const abs = path.join(importedDirAbs, urlPathInsideImported);
      try {
        return fs.existsSync(abs) && fs.statSync(abs).isFile();
      } catch {
        return false;
      }
    };

    // Attempt 0: exact
    if (existsOnDisk(normalized)) {
      if (original !== normalized) {
        console.log("[imported rewrite]", original, "->", normalized);
      }
      req.url = normalized;
      return next();
    }

    const parts = normalized.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const profile = parts[0]; // e.g. "formateur"
      const hasVisibilitySegment = parts[1] === "PUBLIC" || parts[1] === "PREMIUM";

      // Attempt 1 (structural): formateur + no visibility segment => try PUBLIC/_A_CLASSER
      if (profile === "formateur" && !hasVisibilitySegment) {
        const candidate = "/formateur/PUBLIC/_A_CLASSER/" + parts.slice(1).join("/");
        if (existsOnDisk(candidate)) {
          console.log("[imported map]", original, "->", candidate);
          req.url = candidate;
          return next();
        }

        // Attempt 2 (canonical aliases): map legacy filenames -> canonical filenames
        const requestedFilename = parts[parts.length - 1]; // last segment
        const key = normalizeFilenameKey(requestedFilename);

        const aliased = LEGACY_FORMATEUR_ALIASES[key];
        if (aliased) {
          const aliasCandidate = "/formateur/PUBLIC/_A_CLASSER/" + aliased;
          if (existsOnDisk(aliasCandidate)) {
            console.log("[imported alias]", original, "->", aliasCandidate);
            req.url = aliasCandidate;
            return next();
          }
        }
      }
    }

    // No candidate found: keep normalized for stable logs, let static 404 directly.
    req.url = normalized;
    return next();
  };
}

export function serveImportedAssets(app: Express) {
  const importedDir = path.join(PROJECT_ROOT, "client", "public", "imported");
  const importedThumbsDir = path.join(PROJECT_ROOT, "client", "public", "imported_thumbs");

  // Fallback thumbnail (doit exister)
  const fallbackThumbAbs = path.join(
    PROJECT_ROOT,
    "client",
    "public",
    "thumbnails",
    "default-document.png"
  );

  // ---- /imported ----
  if (fs.existsSync(importedDir)) {
    const mapImportedPath = createImportedPathMapper(importedDir);

    app.use(
      IMPORTED_PREFIX,
      mapImportedPath,
      express.static(importedDir, {
        fallthrough: false, // ✅ critical: do NOT pass to Vite if missing
      })
    );
  } else {
    console.warn(`[WARN] imported directory not found: ${importedDir}`);
    app.use(IMPORTED_PREFIX, (_req, res) => {
      res.status(404).send("Not Found");
    });
  }

  // ---- /imported_thumbs ----
  // Objectif PRO :
  // - Si la vignette existe -> on la sert
  // - Si elle n'existe pas -> on sert un fallback existant (zéro ENOENT / zéro bruit)
  app.get(IMPORTED_THUMBS_PREFIX + "/*", (req, res) => {
    try {
      const rel = safeDecodeURIComponent(req.path.replace(IMPORTED_THUMBS_PREFIX, "")).normalize("NFC");

      // empêche les traversées de répertoires
      const safeRel = rel
        .split("/")
        .filter(Boolean)
        .join(path.sep);

      const abs = path.join(importedThumbsDir, safeRel);

      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
        return res.sendFile(abs);
      }

      if (fs.existsSync(fallbackThumbAbs) && fs.statSync(fallbackThumbAbs).isFile()) {
        return res.sendFile(fallbackThumbAbs);
      }

      return res.status(404).send("Not Found");
    } catch {
      // en cas de souci (chemin invalide, etc.) -> fallback silencieux
      if (fs.existsSync(fallbackThumbAbs)) return res.sendFile(fallbackThumbAbs);
      return res.status(404).send("Not Found");
    }
  });

  // Note: on garde aussi express.static pour permettre le cache et les headers standards
  if (fs.existsSync(importedThumbsDir)) {
    app.use(
      IMPORTED_THUMBS_PREFIX,
      express.static(importedThumbsDir, {
        fallthrough: false,
      })
    );
  } else {
    // si le dossier n'existe pas, on sert quand même le fallback ci-dessus
    console.warn(`[WARN] imported_thumbs directory not found: ${importedThumbsDir}`);
  }
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  // SPA fallback (dev) — never for /imported/*
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    if (isImportedRequestPath(url)) {
      return res.status(404).send("Not Found");
    }

    try {
      const clientTemplate = path.resolve(PROJECT_ROOT, "client", "index.html");
      const template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(PROJECT_ROOT, "dist", "public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
