import { describe, it, expect, beforeEach } from "vitest";
import AdmZip from "adm-zip";
import { ResourceImporter } from "./import";
import { getDb } from "./db";
import { resources } from "../drizzle/schema";

function makeZip(entries: Array<{ path: string; content?: string }>): Buffer {
  const zip = new AdmZip();
  for (const e of entries) {
    zip.addFile(e.path, Buffer.from(e.content ?? "x", "utf-8"));
  }
  return zip.toBuffer();
}

async function fetchByTitle(title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db.execute(`SELECT * FROM resources WHERE title = '${title}' LIMIT 1`);

  // Cas possibles selon driver :
  // 1) { rows: [...] }
  // 2) [rows, fields]
  // 3) rows direct
  const rows = Array.isArray(result)
    ? (Array.isArray(result[0]) ? result[0] : result)
    : ((result as any)?.rows ?? []);

  return (rows as any[])[0] ?? null;
}

describe("ResourceImporter.importFromZip (integration)", () => {
  beforeEach(async () => {
    // Nettoyage minimal : on supprime ce qu’on crée dans ce test (par titre).
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const titles = ["fiche1", "doc1", "brouillon1"];
    for (const t of titles) {
      // drizzle where helpers diffèrent selon setup; on utilise une requête brute simple
      await db.execute(`DELETE FROM resources WHERE title = '${t}'`);
    }
  });

  it("should create resources with mapped accessLevel + status", async () => {
    const zipBuffer = makeZip([
      { path: "animateur/premium/fiche1.pdf" }, // => PREMIUM + approved
      { path: "directeur/interne/doc1.docx" },  // => INTERNAL_IFAC + approved
      { path: "formateur/brouillon/brouillon1.txt" }, // => INTERNAL_IFAC + draft
    ]);

    const res = await ResourceImporter.importFromZip(zipBuffer, {
      allowedProfiles: ["animateur", "formateur", "directeur"],
    });

    console.log("[ZIP import result]", res);

    expect(res.errors).toEqual([]);
    expect(res.failed).toBe(0);
    expect(res.success).toBe(3);

    const r1 = await fetchByTitle("fiche1");
    expect(r1).toBeTruthy();
    expect(r1.accessLevel).toBe("PREMIUM");
    expect(r1.visibility).toBe("INTERNAL_IFAC");
    expect(r1.status).toBe("approved");

    const r2 = await fetchByTitle("doc1");
    expect(r2).toBeTruthy();
    expect(r2.accessLevel).toBe("INTERNAL_IFAC");
    expect(r2.visibility).toBe("INTERNAL_IFAC");
    expect(r2.status).toBe("approved");

    const r3 = await fetchByTitle("brouillon1");
    expect(r3).toBeTruthy();
    expect(r3.accessLevel).toBe("INTERNAL_IFAC");
    expect(r3.visibility).toBe("INTERNAL_IFAC");
    expect(r3.status).toBe("draft");
  });
});