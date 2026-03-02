import * as fs from "fs";
import * as path from "path";
import * as db from "../db";

type Row = {
  id: number;
  title?: string | null;
  storageKey?: string | null;
  fileUrl?: string | null;
  thumbnailUrl?: string | null;
  thumbnailKey?: string | null;
  createdAt?: any;
  updatedAt?: any;
};

function pick(v: any): string | null {
  const s = v == null ? "" : String(v).trim();
  return s.length > 0 ? s : null;
}

function isHttpUrl(v: string) {
  return /^https?:\/\//i.test(v);
}

function isImportedPath(v: string) {
  return v.startsWith("/imported/");
}

function isImportedThumbPath(v: string) {
  return v.startsWith("/imported_thumbs/");
}

async function main() {
  console.log("🔎 Audit pro — fichiers & vignettes (resources)");
  const dbConn = await db.getDb();
  if (!dbConn) {
    console.error("❌ Database not available");
    process.exit(1);
  }

  // On récupère la table resources depuis drizzle/schema, quel que soit son nom
  const schema = await import("../../drizzle/schema");
  const table =
    (schema as any).resourcesTable ||
    (schema as any).resources ||
    (schema as any).resources_table;

  if (!table) {
    console.error("❌ Table resources introuvable dans drizzle/schema");
    process.exit(1);
  }

  const rows: Row[] = (await dbConn
    .select({
      id: table.id,
      title: table.title,
      storageKey: table.storageKey,
      fileUrl: table.fileUrl,
      thumbnailUrl: table.thumbnailUrl,
      thumbnailKey: table.thumbnailKey,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
    })
    .from(table)) as any;

  console.log(`📦 ${rows.length} ressources trouvées`);

  // Buckets
  const legacyOnly: Row[] = [];        // fileUrl sans storageKey
  const canonicalOnly: Row[] = [];     // storageKey sans fileUrl
  const bothSet: Row[] = [];           // storageKey + fileUrl (anormal)
  const noFile: Row[] = [];            // aucun fichier

  const importedFile: Row[] = [];      // fileUrl /imported/...
  const httpFile: Row[] = [];          // fileUrl http(s)...
  const otherFile: Row[] = [];         // fileUrl non vide mais ni http ni /imported/

  const thumbUrlNoKey: Row[] = [];     // thumbnailUrl mais pas thumbnailKey (ok en local, à surveiller)
  const thumbKeyNoUrl: Row[] = [];     // thumbnailKey mais pas thumbnailUrl (souvent bug)
  const thumbImportedMismatch: Row[] = []; // thumbnailUrl /imported/ pdf etc (suspect)

  for (const r of rows) {
    const storageKey = pick((r as any).storageKey);
    const fileUrl = pick((r as any).fileUrl);
    const thumbnailUrl = pick((r as any).thumbnailUrl);
    const thumbnailKey = pick((r as any).thumbnailKey);

    // Fichier principal
    if (storageKey && fileUrl) bothSet.push(r);
    else if (storageKey && !fileUrl) canonicalOnly.push(r);
    else if (!storageKey && fileUrl) legacyOnly.push(r);
    else noFile.push(r);

    // Analyse fileUrl
    if (fileUrl) {
      if (isImportedPath(fileUrl)) importedFile.push(r);
      else if (isHttpUrl(fileUrl)) httpFile.push(r);
      else otherFile.push(r);
    }

    // Vignettes
    if (thumbnailUrl && !thumbnailKey) thumbUrlNoKey.push(r);
    if (thumbnailKey && !thumbnailUrl) thumbKeyNoUrl.push(r);

    if (thumbnailUrl) {
      // Cas suspect : thumbnailUrl pointe vers /imported/ (pdf) au lieu /imported_thumbs/
      if (isImportedPath(thumbnailUrl) && thumbnailUrl.toLowerCase().endsWith(".pdf")) {
        thumbImportedMismatch.push(r);
      }
      // Cas suspect : thumbnailUrl /imported/ non pdf (rare) -> on le note aussi
      if (isImportedPath(thumbnailUrl) && !thumbnailUrl.toLowerCase().endsWith(".pdf")) {
        thumbImportedMismatch.push(r);
      }
      // Cas OK : /imported_thumbs/...
      if (isImportedThumbPath(thumbnailUrl)) {
        // ok
      }
    }
  }

  const report = {
    totals: {
      total: rows.length,
      canonicalOnly: canonicalOnly.length,
      legacyOnly: legacyOnly.length,
      bothSet: bothSet.length,
      noFile: noFile.length,
      importedFile: importedFile.length,
      httpFile: httpFile.length,
      otherFile: otherFile.length,
      thumbUrlNoKey: thumbUrlNoKey.length,
      thumbKeyNoUrl: thumbKeyNoUrl.length,
      thumbImportedMismatch: thumbImportedMismatch.length,
    },
    lists: {
      bothSet: bothSet.map((r) => ({ id: r.id, title: r.title, storageKey: (r as any).storageKey, fileUrl: (r as any).fileUrl })),
      legacyOnly: legacyOnly.map((r) => ({ id: r.id, title: r.title, fileUrl: (r as any).fileUrl })),
      thumbKeyNoUrl: thumbKeyNoUrl.map((r) => ({ id: r.id, title: r.title, thumbnailKey: (r as any).thumbnailKey })),
      thumbImportedMismatch: thumbImportedMismatch.map((r) => ({ id: r.id, title: r.title, thumbnailUrl: (r as any).thumbnailUrl })),
    },
  };

  const outJson = path.resolve(process.cwd(), "AUDIT_RESOURCE_FILES.json");
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), "utf-8");

  const outTxt = path.resolve(process.cwd(), "AUDIT_RESOURCE_FILES.txt");
  const lines: string[] = [];
  lines.push("AUDIT_RESOURCE_FILES");
  lines.push("========================================");
  lines.push(`Total: ${report.totals.total}`);
  lines.push("");
  lines.push(`✅ Canonique (storageKey only): ${report.totals.canonicalOnly}`);
  lines.push(`🟡 Legacy (fileUrl only):     ${report.totals.legacyOnly}`);
  lines.push(`🚨 Anormal (both set):        ${report.totals.bothSet}`);
  lines.push(`ℹ️  Aucun fichier:            ${report.totals.noFile}`);
  lines.push("");
  lines.push(`/imported/:                  ${report.totals.importedFile}`);
  lines.push(`http(s):                     ${report.totals.httpFile}`);
  lines.push(`autres fileUrl:              ${report.totals.otherFile}`);
  lines.push("");
  lines.push(`thumbUrl sans thumbKey:      ${report.totals.thumbUrlNoKey}`);
  lines.push(`thumbKey sans thumbUrl:      ${report.totals.thumbKeyNoUrl}`);
  lines.push(`thumbUrl suspect (imported): ${report.totals.thumbImportedMismatch}`);
  lines.push("");
  lines.push("Détails (IDs) :");
  lines.push(`- bothSet: ${bothSet.map((r) => r.id).join(", ") || "aucun"}`);
  lines.push(`- legacyOnly: ${legacyOnly.map((r) => r.id).join(", ") || "aucun"}`);
  lines.push(`- thumbKeyNoUrl: ${thumbKeyNoUrl.map((r) => r.id).join(", ") || "aucun"}`);
  lines.push(`- thumbImportedMismatch: ${thumbImportedMismatch.map((r) => r.id).join(", ") || "aucun"}`);

  fs.writeFileSync(outTxt, lines.join("\n"), "utf-8");

  console.log("✅ Audit terminé");
  console.log("📄 Rapports générés :");
  console.log(" - AUDIT_RESOURCE_FILES.txt");
  console.log(" - AUDIT_RESOURCE_FILES.json");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erreur audit:", err);
  process.exit(1);
});
