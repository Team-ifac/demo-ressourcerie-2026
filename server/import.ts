import { getDb } from "./db";
import { resources } from "../drizzle/schema";

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
    const lines = csvContent.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const errors: Array<{ row: number; error: string }> = [];
    let success = 0;
    let failed = 0;

    // Parse CSV and import
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map((v) => v.trim());
        const row: Record<string, string> = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });

        const importData: ResourceImportData = {
          title: row.title || "",
          description: row.description || "",
          content: row.content || "",
          thematic: row.thematic || "",
          fileUrl: row.file_url || "",
          fileName: row.file_name || "",
          fileType: row.file_type || "",
          authorName: row.author_name || "",
          tags: row.tags ? row.tags.split(";").map((t) => t.trim()) : [],
          isPublic: row.is_public === "true" || row.is_public === "1",
        };

        // Validate required fields
        if (!importData.title) {
          throw new Error("Title is required");
        }

        await this.importResource(importData);
        success++;
      } catch (error) {
        failed++;
        errors.push({
          row: i + 1,
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
    } catch (error) {
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

        // Validate required fields
        if (!importData.title) {
          throw new Error("Title is required");
        }

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
   * Import a single resource
   */
  static async importResource(data: ResourceImportData): Promise<number> {
    const db = await this.getDatabase();
    
    try {
      // Create resource with correct schema
      const result = await db.insert(resources).values({
        title: data.title,
        summary: data.description || "",
        content: data.content || data.description || "",
        type: "Fiche", // Default type
        ageRange: "", // Not provided in import
        duration: "", // Not provided in import
        level: "", // Not provided in import
        prepTime: "", // Not provided in import
        visibility: (data.isPublic !== false ? "PUBLIC" : "INTERNAL_IFAC") as any,
        status: "approved" as any,
        category: data.thematic ? JSON.stringify([data.thematic]) : JSON.stringify(["Général"]),
        thumbnailUrl: "", // Not provided in import
        fileUrl: data.fileUrl || "",
        accessLevel: "PUBLIC" as any,
      });

      return (result as any).insertId;
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

    if (!data.title || data.title.trim().length === 0) {
      errors.push("Title is required");
    }

    if (data.title && data.title.length > 500) {
      errors.push("Title must be less than 500 characters");
    }

    if (data.description && data.description.length > 5000) {
      errors.push("Description must be less than 5000 characters");
    }

    if (data.fileUrl && !this.isValidUrl(data.fileUrl)) {
      errors.push("Invalid file URL");
    }

    return errors;
  }

  /**
   * Check if URL is valid
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate sample CSV template
   */
  static generateCSVTemplate(): string {
    return `title,description,content,thematic,file_url,file_name,file_type,author_name,tags,is_public
"Animation pour tous","Description de la ressource","Contenu détaillé","Animation","https://example.com/file.pdf","file.pdf","pdf","John Doe","animation;enfants;jeux","true"
"Formation développement","Ressource de formation","Contenu détaillé","Formation","https://example.com/file2.pdf","file2.pdf","pdf","Jane Smith","formation;développement","true"`;
  }

  /**
   * Generate sample JSON template
   */
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
