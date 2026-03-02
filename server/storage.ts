// Storage helpers
// - Prod: uses Forge/Biz storage proxy (Authorization: Bearer <token>)
// - Local dev: fallback -> return a directly usable URL (no proxy needed)

import { ENV } from "./_core/env";

type StorageConfig =
  | { mode: "forge"; baseUrl: string; apiKey: string }
  | { mode: "local" };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  // ✅ Prod / remote mode (Forge proxy configured)
  if (baseUrl && apiKey) {
    return { mode: "forge", baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
  }

  // ✅ Local dev mode: do NOT throw — we will return direct URLs
  return { mode: "local" };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));

  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage downloadUrl failed (${response.status} ${response.statusText}): ${message}`
    );
  }

  const json = (await response.json()) as any;
  const url = json?.url;
  if (!url || typeof url !== "string") {
    throw new Error(`Storage downloadUrl invalid response: missing "url"`);
  }
  return url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function ensureLeadingSlash(value: string): string {
  return value.startsWith("/") ? value : `/${value}`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const cfg = getStorageConfig();
  const key = normalizeKey(relKey);

  // Local dev: we don't upload anywhere (no proxy). Keep it explicit.
  if (cfg.mode === "local") {
    throw new Error(
      `storagePut disabled in local dev (missing BUILT_IN_FORGE_API_URL/KEY). Tried to store key="${key}".`
    );
  }

  const uploadUrl = buildUploadUrl(cfg.baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(cfg.apiKey),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }

  const json = (await response.json()) as any;
  const url = json?.url;
  if (!url || typeof url !== "string") {
    throw new Error(`Storage upload invalid response: missing "url"`);
  }

  return { key, url };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const cfg = getStorageConfig();
  const key = normalizeKey(relKey);

  // ✅ Local dev: return a directly usable URL.
  // Works for keys like "imported_thumbs/..." or "thumbnails/..."
  if (cfg.mode === "local") {
    return { key, url: ensureLeadingSlash(key) };
  }

  return {
    key,
    url: await buildDownloadUrl(cfg.baseUrl, key, cfg.apiKey),
  };
}
