import type { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import { logger } from "./logger";

/**
 * Error handler global (Express)
 * - Log 1 seule fois (audit-ready)
 * - Corrélé avec requestId (req.id venant de pino-http)
 * - Réponse JSON standardisée pour /api/*
 * - Réponse texte simple pour le reste (pour ne pas casser Vite/static)
 */
export const errorHandler: ErrorRequestHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const requestId = (req as any)?.id;
  const log = logger.child({
    requestId,
    route: `${req.method} ${req.originalUrl || req.url}`,
  });

  // On évite de logguer des gros objets
  const message = String(err?.message ?? err ?? "Unknown error");
  const name = err?.name ? String(err.name) : undefined;

  // Status code (par défaut 500)
  const statusCodeRaw = err?.statusCode ?? err?.status ?? undefined;
  const statusCode =
    typeof statusCodeRaw === "number" && Number.isFinite(statusCodeRaw) ? statusCodeRaw : 500;

  // On loggue en warn si 4xx, error si 5xx
  const level = statusCode >= 500 ? "error" : "warn";

  (log as any)[level](
    {
      event: "api_error",
      err: {
        name,
        message,
        code: err?.code,
        stack: process.env.NODE_ENV === "development" ? err?.stack : undefined,
      },
      statusCode,
    },
    "Unhandled error"
  );

  // Si headers déjà envoyés, on ne tente pas de répondre
  if (res.headersSent) return;

  const isApi = (req.originalUrl || req.url || "").startsWith("/api");

  if (isApi) {
    return res.status(statusCode).json({
      ok: false,
      error: statusCode >= 500 ? "Internal error" : message,
      requestId,
    });
  }

  // Hors API : ne pas casser Vite / static
  return res.status(statusCode).send(statusCode >= 500 ? "Internal error" : message);
};