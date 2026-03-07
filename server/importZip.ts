import AdmZip from "adm-zip";
import path from "node:path";

export type AccessLevel = "PUBLIC" | "INTERNAL_IFAC" | "PREMIUM";
export type ResourceStatus = "approved" | "draft";

export type ZipFolderKey = "public" | "interne" | "premium" | "brouillon" | "connecte";
export type ZipPublishKey = "publie" | "brouillon";

export interface ZipMappedEntry {
  zipPath: string;
  fileName: string;
  fileType: string;
  buffer: Buffer;
  profileKey: string;
  accessLevel: AccessLevel;
  status: ResourceStatus;
  folderKey: ZipFolderKey;
}

export interface ZipParseResult {
  entries: ZipMappedEntry[];
  errors: Array<{ zipPath: string; error: string }>;
}

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
    const raw = (e.entryName ?? "").replace(/\\/g, "/").trim();

    if (!raw) continue;
    if (e.isDirectory) continue;
    if (raw.startsWith("__MACOSX/") || raw.includes("/.DS_Store")) continue;

    let parts = raw.split("/").filter(Boolean);

    // Ignore un dossier racine générique comme "ressources/"
    if ((parts[0] ?? "").trim().toLowerCase() === "ressources") {
      parts = parts.slice(1);
    }

    if (parts.length < 3) {
      result.errors.push({
        zipPath: raw,
        error: "Invalid ZIP path. Expected a resource file inside a structured ZIP tree",
      });
      continue;
    }

    const fileName = parts[parts.length - 1] ?? "";
    const ext = path.extname(fileName).replace(".", "").toLowerCase();
    const lowerParts = parts.map((p) => p.trim().toLowerCase());

    const accessIndex = lowerParts.findIndex((p) =>
      ["public", "interne", "premium", "brouillon", "connecte"].includes(p)
    );

    if (accessIndex === -1) {
      result.errors.push({
        zipPath: raw,
        error: 'No access folder found. Allowed: public, interne, premium, brouillon, connecte',
      });
      continue;
    }

    if (accessIndex === 0) {
      result.errors.push({
        zipPath: raw,
        error: "Missing profile folder before access folder",
      });
      continue;
    }

    const profileRaw = parts[0] ?? "";
    const profileKey = normalizeProfileKey(profileRaw);

    if (!profileKey) {
      result.errors.push({
        zipPath: raw,
        error: `Unknown profile folder "${profileRaw}"`,
      });
      continue;
    }

    if (allowedProfiles && !allowedProfiles.includes(profileKey)) {
      result.errors.push({
        zipPath: raw,
        error: `Unknown profile folder "${profileRaw}"`,
      });
      continue;
    }

    const folderKey = lowerParts[accessIndex] as ZipFolderKey;
    const publishKeyRaw = lowerParts[accessIndex + 1] ?? null;

    const mapping = mapFolderKey(folderKey, publishKeyRaw);

    if (!mapping) {
      result.errors.push({
        zipPath: raw,
        error: `Invalid access/status combination near "${parts[accessIndex]}"`,
      });
      continue;
    }

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

function normalizeProfileKey(profileRaw: string): string | null {
  const p = profileRaw.trim().toLowerCase();

  if (["animateur", "animateur.trice", "animateur·trice"].includes(p)) return "animateur";
  if (["formateur", "formateur.trice", "formateur·trice"].includes(p)) return "formateur";
  if (["directeur", "directeur.trice", "directeur·trice"].includes(p)) return "directeur";
  if (["stagiaire bafa", "stagiaire_bafa", "stagiaire-bafa"].includes(p)) return "stagiaire_bafa";

  return null;
}

function mapFolderKey(
  folderKey: ZipFolderKey,
  publishKeyRaw?: string | null
): { accessLevel: AccessLevel; status: ResourceStatus } | null {
  const publishKey = (publishKeyRaw ?? "").trim().toLowerCase() as ZipPublishKey | "";

  switch (folderKey) {
    case "public":
      return { accessLevel: "PUBLIC", status: publishKey === "brouillon" ? "draft" : "approved" };
    case "premium":
      return { accessLevel: "PREMIUM", status: publishKey === "brouillon" ? "draft" : "approved" };
    case "interne":
    case "connecte":
      return {
        accessLevel: "INTERNAL_IFAC",
        status: publishKey === "brouillon" ? "draft" : "approved",
      };
    case "brouillon":
      return { accessLevel: "INTERNAL_IFAC", status: "draft" };
    default:
      return null;
  }
}