import { describe, it, expect } from "vitest";
import AdmZip from "adm-zip";
import { parseZipContent } from "./importZip";

function makeZip(entries: Array<{ path: string; content?: string }>): Buffer {
  const zip = new AdmZip();
  for (const e of entries) {
    zip.addFile(e.path, Buffer.from(e.content ?? "x", "utf-8"));
  }
  return zip.toBuffer();
}

describe("importZip parser", () => {
  it("should map folders to accessLevel + status", () => {
    const zipBuffer = makeZip([
      { path: "animateur/public/fiche1.pdf" },
      { path: "directeur/interne/doc1.docx" },
      { path: "animateur/premium/p1.zip" },
      { path: "formateur/brouillon/brouillon1.txt" },
    ]);

    const res = parseZipContent(zipBuffer);

    expect(res.errors).toEqual([]);

    const byPath = new Map(res.entries.map((e) => [e.zipPath, e]));

    const e1 = byPath.get("animateur/public/fiche1.pdf")!;
    expect(e1.profileKey).toBe("animateur");
    expect(e1.folderKey).toBe("public");
    expect(e1.accessLevel).toBe("PUBLIC");
    expect(e1.status).toBe("approved");
    expect(e1.fileType).toBe("pdf");

    const e2 = byPath.get("directeur/interne/doc1.docx")!;
    expect(e2.profileKey).toBe("directeur");
    expect(e2.folderKey).toBe("interne");
    expect(e2.accessLevel).toBe("INTERNAL_IFAC");
    expect(e2.status).toBe("approved");
    expect(e2.fileType).toBe("docx");

    const e3 = byPath.get("animateur/premium/p1.zip")!;
    expect(e3.profileKey).toBe("animateur");
    expect(e3.folderKey).toBe("premium");
    expect(e3.accessLevel).toBe("PREMIUM");
    expect(e3.status).toBe("approved");
    expect(e3.fileType).toBe("zip");

    const e4 = byPath.get("formateur/brouillon/brouillon1.txt")!;
    expect(e4.profileKey).toBe("formateur");
    expect(e4.folderKey).toBe("brouillon");
    expect(e4.accessLevel).toBe("INTERNAL_IFAC");
    expect(e4.status).toBe("draft");
    expect(e4.fileType).toBe("txt");
  });

  it("should report invalid paths and unknown folders", () => {
    const zipBuffer = makeZip([
      { path: "fiche1.pdf" }, // invalide (pas profile/folder)
      { path: "animateur/toto/fiche2.pdf" }, // folder inconnu
      { path: "__MACOSX/._trash" }, // ignoré
      { path: "animateur/public/.DS_Store" }, // ignoré
    ]);

    const res = parseZipContent(zipBuffer);

    // 2 erreurs attendues (ordre non garanti)
    expect(res.errors.length).toBe(2);

    const byZipPath = new Map(res.errors.map((e) => [e.zipPath, e.error]));

    expect(byZipPath.get("fiche1.pdf")).toContain("Invalid ZIP path");
    expect(byZipPath.get("animateur/toto/fiche2.pdf")).toContain("Unknown folder");

    // et aucune entrée importable
    expect(res.entries.length).toBe(0);
  });

  it("should reject unknown profile when allowedProfiles is provided", () => {
    const zipBuffer = makeZip([{ path: "inconnu/public/a.pdf" }]);

    const res = parseZipContent(zipBuffer, { allowedProfiles: ["animateur", "formateur", "directeur"] });

    expect(res.entries.length).toBe(0);
    expect(res.errors.length).toBe(1);
    expect(res.errors[0]?.error).toContain('Unknown profile folder "inconnu"');
  });
});