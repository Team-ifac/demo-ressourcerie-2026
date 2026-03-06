import AdmZip from "adm-zip";
import path from "node:path";

export type AccessLevel = "PUBLIC" | "INTERNAL_IFAC" | "PREMIUM";
export type ResourceStatus = "approved" | "draft";

export type ZipFolderKey = "public" | "interne" | "premium" | "brouillon";

export interface ZipMappedEntry {
  /** Chemin complet dans le ZIP (normalisé en /) */
  zipPath: string;

  /** Nom de fichier (sans dossier) */
  fileName: string;

  /** Extension sans point (ex: pdf) */
  fileType: string;

  /** Données du fichier */
  buffer: Buffer;

  /** Profil (ex: animateur, formateur, directeur) */
  profileKey: string;

  /** AccessLevel déduit de l’arborescence */
  accessLevel: AccessLevel;

  /** Status déduit de l’arborescence */
  status: ResourceStatus;

  /** Dossier clé de mapping (public/interne/premium/brouillon) */
  folderKey: ZipFolderKey;
}

export interface ZipParseResult {
  entries: ZipMappedEntry[];
  errors: Array<{ zipPath: string; error: string }>;
}

/**
 * Règles de mapping arborescence ZIP -> accessLevel + status
 *
 * Attendu:
 *  <profileKey>/<folderKey>/.../<file>
 *
 * folderKey:
 *  - public   -> accessLevel PUBLIC,        status approved
 *  - interne  -> accessLevel INTERNAL_IFAC, status approved
 *  - premium  -> accessLevel PREMIUM,       status approved
 *  - brouillon-> accessLevel INTERNAL_IFAC, status draft
 */
export function parseZipContent(
  zipBuffer: Buffer,
  opts?: { allowedProfiles?: string[] }
): ZipParseResult {
  const allowedProfiles =
    opts?.allowedProfiles?.map((p) => p.trim().toLowerCase()).filter(Boolean) ?? null;

  const zip = new AdmZip(zipBuffer);
  const zipEntries = zip.getEntries();

  const result: ZipParseResult = { entries: [], errors: [] };

  for (const e of zipEntries) {
    // adm-zip renvoie entryName avec / même sur Windows, mais on normalise au cas où.
    const raw = (e.entryName ?? "").replace(/\\/g, "/").trim();

    // Ignore les entrées vides / dossiers / artefacts Mac
    if (!raw) continue;
    if (e.isDirectory) continue;
    if (raw.startsWith("__MACOSX/") || raw.includes("/.DS_Store")) continue;

    const parts = raw.split("/").filter(Boolean);
    if (parts.length < 3) {
      result.errors.push({
        zipPath: raw,
        error: "Invalid ZIP path. Expected: <profile>/<folder>/<file>",
      });
      continue;
    }

    const profileKey = (parts[0] ?? "").trim();
    const folderKeyRaw = (parts[1] ?? "").trim().toLowerCase();

    if (!profileKey) {
      result.errors.push({ zipPath: raw, error: "Missing profile folder" });
      continue;
    }

    if (allowedProfiles && !allowedProfiles.includes(profileKey.toLowerCase())) {
      result.errors.push({
        zipPath: raw,
        error: `Unknown profile folder "${profileKey}"`,
      });
      continue;
    }

    const folderKey = folderKeyRaw as ZipFolderKey;
    const mapping = mapFolderKey(folderKey);

    if (!mapping) {
      result.errors.push({
        zipPath: raw,
        error: `Unknown folder "${parts[1]}". Allowed: public, interne, premium, brouillon`,
      });
      continue;
    }

    const fileName = parts[parts.length - 1] ?? "";
    const ext = path.extname(fileName).replace(".", "").toLowerCase();

    // On laisse l’extension vide possible (cas rare), mais on la remonte.
    const buffer = e.getData();

    result.entries.push({
      zipPath: raw,
      fileName,
      fileType: ext,
      buffer,
      profileKey,
      accessLevel: mapping.accessLevel,
      status: mapping.status,
      folderKey,
    });
  }

  return result;
}

function mapFolderKey(folderKey: ZipFolderKey): { accessLevel: AccessLevel; status: ResourceStatus } | null {
  switch (folderKey) {
    case "public":
      return { accessLevel: "PUBLIC", status: "approved" };
    case "interne":
      return { accessLevel: "INTERNAL_IFAC", status: "approved" };
    case "premium":
      return { accessLevel: "PREMIUM", status: "approved" };
    case "brouillon":
      return { accessLevel: "INTERNAL_IFAC", status: "draft" };
    default:
      return null;
  }
}