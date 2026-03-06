import { getDb } from "./db";
import { resources } from "../drizzle/schema";
import Papa from "papaparse";
import { parseZipContent, type AccessLevel, type ResourceStatus } from "./importZip";

type Visibility = "PUBLIC" | "INTERNAL_IFAC";

export interface ResourceImportData {
  title: string;
  description: string;
  content?: string;
  thematic?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  authorName?: string;
  tags?: string[];
  isPublic?: boolean;

  /**
   * ZIP intelligent (optionnel)
   * - accessLevel / status peuvent être fournis par l’arborescence
   * - visibility est un ENUM limité (PUBLIC | INTERNAL_IFAC)
   */
  accessLevel?: AccessLevel;
  visibility?: Visibility;
  status?: ResourceStatus;

  /** Métadonnées utiles (optionnel) */
  profileKey?: string;
  zipPath?: string;
}

export class ResourceImporter {
  private static async getDatabase() {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    return db;
  }

  /**
   * Import resources from CSV format
   */
  static async importFromCSV(csvContent: string): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const errors: Array<{ row: number; error: string }> = [];
    let success = 0;
    let failed = 0;

    const parsed = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (h) => (h ?? "").trim().toLowerCase(),
      transform: (v) => (typeof v === "string" ? v.trim() : v),
    });

    if (parsed.errors?.length) {
      for (const e of parsed.errors) {
        failed++;
        errors.push({
          row: (e.row ?? 0) + 1,
          error: e.message || "CSV parsing error",
        });
      }
    }

    const rows = parsed.data ?? [];
    if (!rows.length) {
      return { success: 0, failed: 0, errors: [] };
    }

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i] || {};

        const importData: ResourceImportData = {
          title: row.title || "",
          description: row.description || "",
          content: row.content || "",
          thematic: row.thematic || "",
          fileUrl: row.file_url || row.fileurl || "",
          fileName: row.file_name || row.filename || "",
          fileType: row.file_type || row.filetype || "",
          authorName: row.author_name || row.authorname || "",
          tags: row.tags ? String(row.tags).split(";").map((t) => t.trim()).filter(Boolean) : [],
          isPublic: String(row.is_public ?? "").toLowerCase() === "true" || String(row.is_public ?? "") === "1",
        };

        const vErrors = this.validateData(importData);
        if (vErrors.length) throw new Error(vErrors.join(" | "));

        await this.importResource(importData);
        success++;
      } catch (error) {
        failed++;
        errors.push({
          row: i + 2,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { success, failed, errors };
  }

  /**
   * Import resources from JSON format
   */
  static async importFromJSON(jsonContent: string): Promise<{
    success: number;
    failed: number;
    errors: Array<{ index: number; error: string }>;
  }> {
    let resourceList: ResourceImportData[];

    try {
      const parsed = JSON.parse(jsonContent);
      resourceList = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      throw new Error("Invalid JSON format");
    }

    const errors: Array<{ index: number; error: string }> = [];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < resourceList.length; i++) {
      try {
        const importData: ResourceImportData = {
          title: resourceList[i].title || "",
          description: resourceList[i].description || "",
          content: resourceList[i].content || "",
          thematic: resourceList[i].thematic || "",
          fileUrl: resourceList[i].fileUrl || "",
          fileName: resourceList[i].fileName || "",
          fileType: resourceList[i].fileType || "",
          authorName: resourceList[i].authorName || "",
          tags: resourceList[i].tags || [],
          isPublic: resourceList[i].isPublic !== false,
        };

        if (!importData.title) throw new Error("Title is required");

        await this.importResource(importData);
        success++;
      } catch (error) {
        failed++;
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { success, failed, errors };
  }

  /**
   * PILIER 2 — Import ZIP intelligent
   */
  static async importFromZip(
    zipBuffer: Buffer,
    opts?: { allowedProfiles?: string[] }
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ path: string; error: string }>;
  }> {
    const errors: Array<{ path: string; error: string }> = [];
    let success = 0;
    let failed = 0;

    const parsed = parseZipContent(zipBuffer, { allowedProfiles: opts?.allowedProfiles });

    for (const e of parsed.errors) {
      failed++;
      errors.push({ path: e.zipPath, error: e.error });
    }

    if (!parsed.entries.length) {
      return { success, failed, errors };
    }

    for (const entry of parsed.entries) {
      try {
        const baseTitle = entry.fileName.replace(/\.[^.]+$/, "");

        // ✅ visibility ne peut pas être PREMIUM (ENUM DB)
        const visibility: Visibility =
          entry.accessLevel === "PUBLIC" ? "PUBLIC" : "INTERNAL_IFAC";

        const importData: ResourceImportData = {
          title: baseTitle,
          description: "",
          content: "",
          fileName: entry.fileName,
          fileType: entry.fileType,
          fileUrl: "", // stockage réel: pilier Multi-formats / Storage
          isPublic: entry.accessLevel === "PUBLIC",

          accessLevel: entry.accessLevel,
          visibility,
          status: entry.status,

          profileKey: entry.profileKey,
          zipPath: entry.zipPath,
        };

        const vErrors = this.validateData(importData);
        if (vErrors.length) throw new Error(vErrors.join(" | "));

        await this.importResource(importData);
        success++;
      } catch (error) {
        failed++;
        errors.push({
          path: entry.zipPath,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { success, failed, errors };
  }

  /**
   * Import a single resource
   */
  static async importResource(data: ResourceImportData): Promise<number> {
    const db = await this.getDatabase();

    try {
      const isPublic = data.isPublic !== false;

      const accessLevel = (data.accessLevel ?? (isPublic ? "PUBLIC" : "INTERNAL_IFAC")) as any;

      // ✅ visibility doit rester PUBLIC | INTERNAL_IFAC
      const visibility: Visibility =
        data.visibility ?? (accessLevel === "PUBLIC" ? "PUBLIC" : "INTERNAL_IFAC");

      const status = (data.status ?? ("draft" as any)) as any;

      const result = await db.insert(resources).values({
        title: data.title,
        summary: data.description || "",
        content: data.content || data.description || "",
        type: "Fiche",
        ageRange: "",
        duration: "",
        level: "",
        prepTime: "",
        visibility: visibility as any,
        status,
        category: data.thematic ? JSON.stringify([data.thematic]) : JSON.stringify(["Général"]),
        thumbnailUrl: "",
        fileUrl: data.fileUrl && data.fileUrl.trim() !== "" ? data.fileUrl : null,
        accessLevel,
      });

      const insertId =
        (result as any)?.insertId ??
        (Array.isArray(result) ? (result as any)[0]?.insertId : undefined) ??
        (Array.isArray(result) ? (result as any)[0] : undefined);

      if (insertId === undefined || insertId === null || insertId === 0) {
        throw new Error("Insert succeeded but insertId is missing (driver mismatch)");
      }

      return Number(insertId);
    } catch (error) {
      console.error("[Import] Error importing resource:", error);
      throw error;
    }
  }

  /**
   * Validate import data
   */
  static validateData(data: ResourceImportData): string[] {
    const errors: string[] = [];

    const title = (data.title ?? "").trim();
    const description = (data.description ?? "").trim();
    const fileType = (data.fileType ?? "").trim().toLowerCase();

    if (!title) errors.push("Title is required");

    if (title && title.length > 255) {
      errors.push("Title must be less than 255 characters");
    }

    if (description && description.length > 1000) {
      errors.push("Description must be less than 1000 characters");
    }

    if (fileType) {
      const allowed = new Set([
        "pdf",
        "doc",
        "docx",
        "ppt",
        "pptx",
        "xls",
        "xlsx",
        "csv",
        "txt",
        "jpg",
        "jpeg",
        "png",
        "gif",
        "mp3",
        "wav",
        "mp4",
        "mov",
        "zip",
      ]);
      if (!allowed.has(fileType)) errors.push("Invalid file type");
    }

    if (data.fileUrl && data.fileUrl.trim() !== "" && !this.isValidUrl(data.fileUrl)) {
      errors.push("Invalid file URL");
    }

    return errors;
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static generateCSVTemplate(): string {
    return `title,description,content,thematic,file_url,file_name,file_type,author_name,tags,is_public
"Animation pour tous","Description de la ressource","Contenu détaillé","Animation","https://example.com/file.pdf","file.pdf","pdf","John Doe","animation;enfants;jeux","true"
"Formation développement","Ressource de formation","Contenu détaillé","Formation","https://example.com/file2.pdf","file2.pdf","pdf","Jane Smith","formation;développement","true"`;
  }

  static generateJSONTemplate(): string {
    return JSON.stringify(
      [
        {
          title: "Animation pour tous",
          description: "Description de la ressource",
          content: "Contenu détaillé",
          thematic: "Animation",
          fileUrl: "https://example.com/file.pdf",
          fileName: "file.pdf",
          fileType: "pdf",
          authorName: "John Doe",
          tags: ["animation", "enfants", "jeux"],
          isPublic: true,
        },
        {
          title: "Formation développement",
          description: "Ressource de formation",
          content: "Contenu détaillé",
          thematic: "Formation",
          fileUrl: "https://example.com/file2.pdf",
          fileName: "file2.pdf",
          fileType: "pdf",
          authorName: "Jane Smith",
          tags: ["formation", "développement"],
          isPublic: true,
        },
      ],
      null,
      2
    );
  }
}