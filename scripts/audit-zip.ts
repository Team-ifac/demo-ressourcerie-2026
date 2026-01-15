import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

/**
 * Audit du ZIP sans DB :
 * - ignore __MACOSX
 * - ignore la racine "ressources/"
 * - déduit : profileType / type / collectionName (thématique) / accessLevel / status
 * - écrit un CSV : import_tmp/audit_import.csv
 */

const ZIP_PATH = "/Users/rav/Desktop/ressourcerie-ifac/import_tmp/ressources.zip";
const OUT_CSV = "/Users/rav/Desktop/ressourcerie-ifac/import_tmp/audit_import.csv";

type AccessLevel = "PUBLIC" | "AUTHENTICATED" | "PREMIUM" | "UNKNOWN";
type Status = "published" | "draft" | "unknown";
type ProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa" | "a_classer" | "unknown";

function normalizeSegment(s: string) {
  return (s || "").trim().normalize("NFC");
}

function cleanCollectionName(raw: string) {
  const s = normalizeSegment(raw)
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // capitalisation simple, mais on garde les petits mots en minuscules
  const small = new Set(["de", "du", "des", "et", "à", "a", "en", "d"]);

  return s
    .split(" ")
    .map((w) => {
      const wl = w.toLowerCase();
      if (small.has(wl)) return wl;
      if (w.length <= 2) return wl;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function mapProfile(seg: string): ProfileType {
  const s = normalizeSegment(seg).toLowerCase();
  if (s === "animateur") return "animateur";
  if (s === "formateur") return "formateur";
  if (s === "directeur") return "directeur";
  if (s === "stagiaire_bafa" || s === "stagiaire-bafa" || s === "stagiairebafa") return "stagiaire_bafa";
  if (s === "_a_classer" || s === "a_classer" || s === "a classer" || s === "a_classer/") return "a_classer";
  return "unknown";
}

function mapAccess(seg: string): AccessLevel {
  const s = normalizeSegment(seg).toLowerCase();
  if (s === "public") return "PUBLIC";
  if (s === "connecte" || s === "connecté" || s === "connectes" || s === "connectés") return "AUTHENTICATED";
  if (s === "premium") return "PREMIUM";
  return "UNKNOWN";
}

function mapStatus(seg: string): Status {
  const s = normalizeSegment(seg).toLowerCase();
  if (s === "publie" || s === "publié" || s === "publies" || s === "publiés") return "published";
  if (s === "brouillon" || s === "draft") return "draft";
  return "unknown";
}

function isProbablyFile(p: string) {
  // Un fichier dans la liste unzip -Z1 = une entrée qui ne finit pas par "/"
  return !p.endsWith("/");
}

function listZipEntries(zipPath: string): string[] {
  if (!fs.existsSync(zipPath)) throw new Error(`ZIP introuvable: ${zipPath}`);
  const out = execSync(`unzip -Z1 "${zipPath}"`, { encoding: "utf8" });
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

type Row = {
  zipPath: string;
  fileName: string;
  profileType: ProfileType;
  resourceType: string; // ex: document
  collectionName: string; // thématique
  accessLevel: AccessLevel;
  status: Status;
};

function stripRoot(parts: string[]) {
  // ignore __MACOSX
  if (parts[0] === "__MACOSX") return null;

  // ignore la racine "ressources"
  if (parts[0] === "ressources") return parts.slice(1);

  return parts;
}

function parseEntry(entry: string): Row | null {
  const p = normalizeSegment(entry);

  // ignorer __MACOSX et fichiers AppleDouble
  if (p.startsWith("__MACOSX/")) return null;
  if (p.includes("/._")) return null;

  if (!isProbablyFile(p)) return null;

  let parts = p.split("/").map(normalizeSegment).filter(Boolean);
  const stripped = stripRoot(parts);
  if (!stripped) return null;
  parts = stripped;

  // maintenant on attend : profile / type / (thématique...) / (access?) / (status?) / file
  const fileName = parts[parts.length - 1];

  const profileType = mapProfile(parts[0] || "");
  const resourceType = normalizeSegment(parts[1] || "unknown") || "unknown";

  // access / status peuvent être absents ou présents en fin de chemin
  let accessLevel: AccessLevel = "UNKNOWN";
  let status: Status = "unknown";
  let accessIndex = -1;
  let statusIndex = -1;

  for (let i = 0; i < parts.length; i++) {
    const a = mapAccess(parts[i]);
    if (a !== "UNKNOWN") {
      accessLevel = a;
      accessIndex = i;
      break;
    }
  }

  for (let i = 0; i < parts.length; i++) {
    const st = mapStatus(parts[i]);
    if (st !== "unknown") {
      status = st;
      statusIndex = i;
      break;
    }
  }

  // Thématique = segments entre (profile,type) et (access/status/file)
  const start = 2; // index après profile + type
  const end = accessIndex > -1 ? accessIndex : statusIndex > -1 ? statusIndex : parts.length - 1;

  const thematicParts = parts.slice(start, Math.max(start, end));

  const collectionName =
    thematicParts.length > 0 ? cleanCollectionName(thematicParts.join(" / ")) : "Sans thématique";

  return {
    zipPath: p,
    fileName,
    profileType,
    resourceType,
    collectionName,
    accessLevel,
    status,
  };
}

function csvEscape(v: string) {
  const s = String(v ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function main() {
  const entries = listZipEntries(ZIP_PATH);

  const rows: Row[] = [];
  for (const e of entries) {
    const r = parseEntry(e);
    if (r) rows.push(r);
  }

  const byCollection = new Map<string, number>();
  const byProfile = new Map<string, number>();
  const byAccess = new Map<string, number>();
  const byStatus = new Map<string, number>();

  for (const r of rows) {
    byCollection.set(r.collectionName, (byCollection.get(r.collectionName) || 0) + 1);
    byProfile.set(r.profileType, (byProfile.get(r.profileType) || 0) + 1);
    byAccess.set(r.accessLevel, (byAccess.get(r.accessLevel) || 0) + 1);
    byStatus.set(r.status, (byStatus.get(r.status) || 0) + 1);
  }

  const header = ["zipPath", "fileName", "profileType", "resourceType", "collectionName", "accessLevel", "status"];
  const lines = [header.join(",")];

  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.zipPath),
        csvEscape(r.fileName),
        csvEscape(r.profileType),
        csvEscape(r.resourceType),
        csvEscape(r.collectionName),
        csvEscape(r.accessLevel),
        csvEscape(r.status),
      ].join(",")
    );
  }

  fs.mkdirSync(path.dirname(OUT_CSV), { recursive: true });
  fs.writeFileSync(OUT_CSV, lines.join("\n"), "utf8");

  console.log("=== AUDIT ZIP TERMINÉ ===");
  console.log("ZIP:", ZIP_PATH);
  console.log("Fichiers détectés:", rows.length);
  console.log("CSV créé:", OUT_CSV);

  const topCollections = Array.from(byCollection.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  console.log("\nTop 15 collections (thématiques) :");
  for (const [name, count] of topCollections) console.log(`- ${name}: ${count}`);

  console.log("\nRépartition profils:", Object.fromEntries(byProfile));
  console.log("Répartition accès:", Object.fromEntries(byAccess));
  console.log("Répartition statuts:", Object.fromEntries(byStatus));
}

main();
