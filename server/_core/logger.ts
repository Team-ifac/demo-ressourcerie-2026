import pino from "pino";
import pinoHttp from "pino-http";

const isProd = process.env.NODE_ENV === "production";

// Niveau de log configurable (par défaut "info")
const level = process.env.LOG_LEVEL ?? (isProd ? "info" : "debug");

export const logger = pino({
  level,
  base: undefined, // évite pid/hostname par défaut (logs plus lisibles)
  timestamp: pino.stdTimeFunctions.isoTime,

  // ✅ PRO: évite de logger des secrets (headers/cookies potentiellement sensibles)
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers.set-cookie",
      "headers.authorization",
      "headers.cookie",
      "headers.set-cookie",
    ],
    remove: true,
  },

  // Logger standard, JSON en prod, pretty en dev
  transport: !isProd
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

// =========================================================
// ✅ HTTP Logger centralisé (outil national)
// - Génère un requestId
// - Loggue uniquement les succès (2xx/3xx)
// - Les 4xx/5xx sont loggués par errorHandler (log métier unique)
// =========================================================
export const httpLogger = pinoHttp({
  // ✅ Fix TS: pino-http attend un type de logger plus large
  logger: logger as any,

  genReqId: (req: any, res: any) => {
    const existing = req.headers?.["x-request-id"];
    const id =
      (Array.isArray(existing) ? existing[0] : existing) ??
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    res.setHeader("x-request-id", id);
    return id;
  },

  customLogLevel: (_req: any, res: any, err: any) => {
    if (err) return "silent" as any;
    if (res.statusCode >= 400) return "silent" as any;
    return "info";
  },

  serializers: {
    req(req: any) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res: any) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});