import { getDb } from "./db";
import { resourceThemes, resources, themes } from "../drizzle/schema";
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

export interface ImportAuditReport {
  summary: {
    totalFilesDetected: number;
    validEntries: number;
    parserErrors: number;
    unknownProfilesInDb: number;
    duplicatesInZip: number;
    existingInDatabase: number;
    toCreate: number;
  };
  breakdown: {
    profiles: Record<string, number>;
    accessLevels: Record<AccessLevel, number>;
    statuses: Record<ResourceStatus, number>;
    fileTypes: Record<string, number>;
  };
  entries: Array<{
    zipPath: string;
    fileName: string;
    title: string;
    fileType: string;
    profileKey: string;
    accessLevel: AccessLevel;
    visibility: Visibility;
    status: ResourceStatus;
    existsInDatabase: boolean;
    duplicateInZip: boolean;
    profileExistsInDb: boolean;
    warnings: string[];
  }>;
  errors: Array<{ path: string; error: string }>;
}

export class ResourceImporter {
  private static async getDatabase() {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    return db;
  }

  private static escapeSql(value: string): string {
    return String(value ?? "").replace(/'/g, "''");
  }

  private static async queryRows<T = any>(query: string): Promise<T[]> {
    const db = await this.getDatabase();
    const result = await db.execute(query as any);

    // Selon le driver, db.execute peut renvoyer :
    // 1) { rows: [...] }
    // 2) [rows, fields]
    // 3) rows direct
    if (Array.isArray(result)) {
      if (Array.isArray(result[0])) {
        return result[0] as unknown as T[];
      }
      return result as unknown as T[];
    }

    return ((result as any)?.rows ?? []) as unknown as T[];
  }

  private static async getProfileTypeIdByKey(profileKey: string): Promise<number | null> {
    const key = this.escapeSql(profileKey.trim().toLowerCase());

    const rows = await this.queryRows<{ id: number }>(
      `SELECT id FROM profile_types WHERE \`key\` = '${key}' AND isActive = 1 LIMIT 1`
    );

    const row = rows[0];
    if (!row?.id) return null;

    return Number(row.id);
  }

  private static async getExistingProfileKeys(profileKeys: string[]): Promise<Set<string>> {
    const normalized = Array.from(
      new Set(profileKeys.map((k) => (k ?? "").trim().toLowerCase()).filter(Boolean))
    );

    if (!normalized.length) {
      return new Set<string>();
    }

    const inClause = normalized.map((k) => `'${this.escapeSql(k)}'`).join(", ");

    const rows = await this.queryRows<{ key: string }>(
      `SELECT \`key\` FROM profile_types WHERE isActive = 1 AND \`key\` IN (${inClause})`
    );

    return new Set(
      rows
        .map((r) => String(r.key ?? "").trim().toLowerCase())
        .filter(Boolean)
    );
  }

  private static async getExistingResourceTitles(titles: string[]): Promise<Set<string>> {
    const normalized = Array.from(
      new Set(titles.map((t) => (t ?? "").trim()).filter(Boolean))
    );

    if (!normalized.length) {
      return new Set<string>();
    }

    const inClause = normalized.map((t) => `'${this.escapeSql(t)}'`).join(", ");

    const rows = await this.queryRows<{ title: string }>(
      `SELECT title FROM resources WHERE title IN (${inClause})`
    );

    return new Set(
      rows
        .map((r) => String(r.title ?? "").trim())
        .filter(Boolean)
    );
  }

  private static async attachProfileToResource(resourceId: number, profileTypeId: number): Promise<void> {
    const db = await this.getDatabase();

    await db.execute(
      `INSERT IGNORE INTO resource_profiles (resourceId, profileTypeId, addedAt)
       VALUES (${Number(resourceId)}, ${Number(profileTypeId)}, NOW())` as any
    );
  }

  private static detectThemeNamesFromText(text: string): string[] {
    const normalized = String(text ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, " ");

    const rules: Array<{ themeName: string; keywords: string[] }> = [
      {
        themeName: "Harcèlement et prévention",
        keywords: [
          "harcelement",
          "harceler",
          "intimidation",
          "moquerie",
          "moqueries",
          "racket",
          "exclusion",
          "violence verbale",
          "violences verbales",
        ],
      },
      {
        themeName: "Vivre ensemble",
        keywords: [
          "vivre ensemble",
          "respect",
          "regles de vie",
          "regle de vie",
          "vie collective",
          "groupe",
          "cohesion",
        ],
      },
      {
        themeName: "Inclusion et handicap",
        keywords: [
          "inclusion",
          "handicap",
          "accessibilite",
          "difference",
          "differences",
        ],
      },
      {
        themeName: "Émotions et expression",
        keywords: [
          "emotion",
          "emotions",
          "colere",
          "peur",
          "joie",
          "tristesse",
          "expression",
          "ressenti",
        ],
      },
      {
        themeName: "Coopération et entraide",
        keywords: [
          "cooperation",
          "coopération",
          "entraide",
          "ensemble",
          "solidaire",
          "solidarite",
          "defi collectif",
        ],
      },
      {
        themeName: "Citoyenneté",
        keywords: [
          "citoyennete",
          "citoyenneté",
          "citoyen",
          "citoyens",
          "droits",
          "devoirs",
          "republique",
          "democratie",
        ],
      },
      {
        themeName: "Environnement",
        keywords: [
          "environnement",
          "nature",
          "ecologie",
          "écologie",
          "recyclage",
          "developpement durable",
          "développement durable",
        ],
      },
      {
        themeName: "Jeux et dynamisation",
        keywords: [
          "jeu",
          "jeux",
          "dynamique",
          "energizer",
          "brise glace",
          "icebreaker",
          "animation",
        ],
      },
      {
        themeName: "Activités artistiques",
        keywords: [
          "artistique",
          "art",
          "peinture",
          "dessin",
          "theatre",
          "théâtre",
          "musique",
          "creation",
          "création",
        ],
      },
      {
        themeName: "Activités sportives",
        keywords: [
          "sport",
          "sports",
          "sportif",
          "sportive",
          "motricite",
          "motricité",
          "physique",
        ],
      },
    ];

    const detected = new Set<string>();

    for (const rule of rules) {
      const hasMatch = rule.keywords.some((keyword) =>
        normalized.includes(
          keyword
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, " ")
        )
      );

      if (hasMatch) {
        detected.add(rule.themeName);
      }
    }

    return Array.from(detected);
  }

  private static async attachThemesToResource(resourceId: number, themeNames: string[]): Promise<void> {
    const db = await this.getDatabase();

    const normalizedNames = Array.from(
      new Set(themeNames.map((name) => String(name ?? "").trim()).filter(Boolean))
    );

    if (!normalizedNames.length) return;

    const rows = await db
      .select({
        id: themes.id,
        name: themes.name,
      })
      .from(themes);

    const themeIds = rows
      .filter((row) => normalizedNames.includes(String(row.name ?? "").trim()))
      .map((row) => Number(row.id));

    if (!themeIds.length) return;

    for (const themeId of themeIds) {
      try {
        await db.insert(resourceThemes).values({
          resourceId: Number(resourceId),
          themeId: Number(themeId),
        } as any);
      } catch {
        // ignore doublon éventuel
      }
    }
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
   * PILIER 3 — Audit / prévisualisation avant import ZIP
   * Ne modifie pas la base.
   * Produit un rapport professionnel avant écriture.
   */
  static async auditZip(
    zipBuffer: Buffer,
    opts?: { allowedProfiles?: string[] }
  ): Promise<ImportAuditReport> {
    const parsed = parseZipContent(zipBuffer, { allowedProfiles: opts?.allowedProfiles });

    const titles = parsed.entries.map((entry) => entry.fileName.replace(/\.[^.]+$/, ""));
    const profileKeys = parsed.entries.map((entry) => entry.profileKey);

    const existingTitles = await this.getExistingResourceTitles(titles);
    const existingProfileKeys = await this.getExistingProfileKeys(profileKeys);

    const titleOccurrences = new Map<string, number>();
    for (const title of titles) {
      titleOccurrences.set(title, (titleOccurrences.get(title) ?? 0) + 1);
    }

    const profileCounts: Record<string, number> = {};
    const accessLevelCounts: Record<AccessLevel, number> = {
      PUBLIC: 0,
      PREMIUM: 0,
      INTERNAL_IFAC: 0,
    };
    const statusCounts: Record<ResourceStatus, number> = {
      approved: 0,
      draft: 0,
    };
    const fileTypeCounts: Record<string, number> = {};

    let unknownProfilesInDb = 0;
    let duplicatesInZip = 0;
    let existingInDatabase = 0;
    let toCreate = 0;

    const entries: ImportAuditReport["entries"] = parsed.entries.map((entry) => {
      const title = entry.fileName.replace(/\.[^.]+$/, "");
      const visibility: Visibility =
        entry.accessLevel === "PUBLIC" ? "PUBLIC" : "INTERNAL_IFAC";

      const existsInDatabase = existingTitles.has(title);
      const duplicateInZip = (titleOccurrences.get(title) ?? 0) > 1;
      const profileExistsInDb = existingProfileKeys.has(entry.profileKey);

      profileCounts[entry.profileKey] = (profileCounts[entry.profileKey] ?? 0) + 1;
      accessLevelCounts[entry.accessLevel] = (accessLevelCounts[entry.accessLevel] ?? 0) + 1;
      statusCounts[entry.status] = (statusCounts[entry.status] ?? 0) + 1;

      const normalizedFileType = String(entry.fileType ?? "").trim().toLowerCase() || "unknown";
      fileTypeCounts[normalizedFileType] = (fileTypeCounts[normalizedFileType] ?? 0) + 1;

      const warnings: string[] = [];

      if (existsInDatabase) {
        warnings.push("Resource title already exists in database");
        existingInDatabase++;
      } else {
        toCreate++;
      }

      if (duplicateInZip) {
        warnings.push("Duplicate title detected inside ZIP");
        duplicatesInZip++;
      }

      if (!profileExistsInDb) {
        warnings.push("Profile key not found in database");
        unknownProfilesInDb++;
      }

      return {
        zipPath: entry.zipPath,
        fileName: entry.fileName,
        title,
        fileType: entry.fileType,
        profileKey: entry.profileKey,
        accessLevel: entry.accessLevel,
        visibility,
        status: entry.status,
        existsInDatabase,
        duplicateInZip,
        profileExistsInDb,
        warnings,
      };
    });

    return {
      summary: {
        totalFilesDetected: parsed.entries.length + parsed.errors.length,
        validEntries: parsed.entries.length,
        parserErrors: parsed.errors.length,
        unknownProfilesInDb,
        duplicatesInZip,
        existingInDatabase,
        toCreate,
      },
      breakdown: {
        profiles: profileCounts,
        accessLevels: accessLevelCounts,
        statuses: statusCounts,
        fileTypes: fileTypeCounts,
      },
      entries,
      errors: parsed.errors.map((e) => ({
        path: e.zipPath,
        error: e.error,
      })),
    };
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

        const visibility: Visibility =
          entry.accessLevel === "PUBLIC" ? "PUBLIC" : "INTERNAL_IFAC";

        const profileTypeId = await this.getProfileTypeIdByKey(entry.profileKey);
        if (!profileTypeId) {
          throw new Error(`Unknown profile key in database: "${entry.profileKey}"`);
        }

        const importData: ResourceImportData = {
          title: baseTitle,
          description: "",
          content: "",
          fileName: entry.fileName,
          fileType: entry.fileType,
          fileUrl: "",
          isPublic: entry.accessLevel === "PUBLIC",

          accessLevel: entry.accessLevel,
          visibility,
          status: entry.status,

          profileKey: entry.profileKey,
          zipPath: entry.zipPath,
        };

        const vErrors = this.validateData(importData);
        if (vErrors.length) throw new Error(vErrors.join(" | "));

        const resourceId = await this.importResource(importData);
        await this.attachProfileToResource(resourceId, profileTypeId);

        const autoDetectedThemeNames = this.detectThemeNamesFromText(
          [baseTitle, entry.fileName, entry.zipPath].filter(Boolean).join(" ")
        );

        await this.attachThemesToResource(resourceId, autoDetectedThemeNames);

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