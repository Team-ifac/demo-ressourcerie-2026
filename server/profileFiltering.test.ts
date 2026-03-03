import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import * as db from "./db";
import { resources, resourceProfiles, profileTypes } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

describe("Profile Filtering System", () => {
  let testResourceId: number | null = null;

  beforeAll(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // ✅ 1) Récupère l'id du profile "animateur" sans dépendre d'un champ TS (slug/name/code…)
        // ✅ Récupère l'id du profileType "animateur" via Drizzle (colonne key)
    const animateurRows = await database
      .select({ id: profileTypes.id })
      .from(profileTypes)
      .where(eq(profileTypes.key, "animateur"))
      .limit(1);

    const animateurProfileTypeId = animateurRows[0]?.id;

    if (!animateurProfileTypeId) {
      throw new Error(
        'ProfileType "animateur" introuvable dans la table profile_types (colonne key).'
      );
    }

    // ✅ 2) Insert ressource : IMPORTANT -> contrainte SQL
    // chk_resources_visibility_matches_accessLevel :
    // - accessLevel = PUBLIC => visibility = PUBLIC
    // - accessLevel != PUBLIC => visibility = INTERNAL_IFAC
    const inserted = await database
      .insert(resources)
      .values({
        title: "Test Resource for Profile Filtering",
        summary: "Testing profile filtering",
        content: "Test content",
        type: "activity",

        // ✅ Important : getAllResources filtre souvent sur approved
        status: "approved",

        // ✅ Doit rester cohérent avec le CHECK SQL
        accessLevel: "INTERNAL_IFAC",
        visibility: "INTERNAL_IFAC",
      } as any)
      .$returningId();

    const insertedId = Array.isArray(inserted)
      ? inserted[0]?.id
      : (inserted as any)?.id;

    if (!insertedId) throw new Error("Failed to create test resource");
    testResourceId = insertedId;

    // ✅ 3) Lier la ressource au profileType animateur
    await database.insert(resourceProfiles).values({
      resourceId: testResourceId,
      profileTypeId: animateurProfileTypeId,
    } as any);
  });

  afterAll(async () => {
    const database = await getDb();
    if (!database) return;
    if (!testResourceId) return;

    await database
      .delete(resourceProfiles)
      .where(eq(resourceProfiles.resourceId, testResourceId));

    await database.delete(resources).where(eq(resources.id, testResourceId));
  });

  describe("getAllResources with profileType filter", () => {
    it("should return resources for animateur profile", async () => {
      const animateurResources = await db.getAllResources({
        profileType: "animateur",
        includeInternal: true,
      });

      expect(Array.isArray(animateurResources)).toBe(true);
      expect(animateurResources.some((r) => r.id === testResourceId)).toBe(true);
    });

    it("should not return resources for other profiles", async () => {
      const formateurResources = await db.getAllResources({
        profileType: "formateur",
        includeInternal: true,
      });

      expect(Array.isArray(formateurResources)).toBe(true);
      expect(formateurResources.some((r) => r.id === testResourceId)).toBe(false);
    });

    it("should filter by profileType and accessLevel", async () => {
      const list = await db.getAllResources({
        profileType: "animateur",
        includeInternal: true,
      });

      list.forEach((r) => {
        expect(["PUBLIC", "INTERNAL_IFAC", "PREMIUM"]).toContain(r.accessLevel);
      });
    });

    it("should return empty array or a valid array for profile with no resources", async () => {
      const directorResources = await db.getAllResources({
        profileType: "directeur",
        includeInternal: true,
      });

      expect(Array.isArray(directorResources)).toBe(true);
    });
  });

  describe("getAllResources without profileType filter", () => {
    it("should return all PUBLIC resources when no profile specified and includeInternal=false", async () => {
      const publicResources = await db.getAllResources({
        includeInternal: false,
      });

      expect(publicResources.length).toBeGreaterThan(0);

      publicResources.forEach((r) => {
        expect(r.accessLevel).toBe("PUBLIC");
      });
    });

    it("should return PUBLIC + INTERNAL_IFAC when includeInternal=true", async () => {
      const authenticatedResources = await db.getAllResources({
        includeInternal: true,
      });

      expect(authenticatedResources.length).toBeGreaterThan(0);

      const hasInternal = authenticatedResources.some(
        (r) => r.accessLevel === "INTERNAL_IFAC"
      );
      expect(hasInternal).toBe(true);
    });
  });

  describe("Profile filtering with other filters", () => {
    it("should combine profileType with search filter", async () => {
      const list = await db.getAllResources({
        profileType: "animateur",
        search: "test",
        includeInternal: true,
      });

      expect(Array.isArray(list)).toBe(true);

      list.forEach((r) => {
        const hay = `${r.title ?? ""} ${r.summary ?? ""} ${r.content ?? ""}`.toLowerCase();
        expect(hay.includes("test")).toBe(true);
      });
    });

    it("should combine profileType with type filter", async () => {
      const list = await db.getAllResources({
        profileType: "animateur",
        type: "activity",
        includeInternal: true,
      });

      expect(Array.isArray(list)).toBe(true);
      list.forEach((r) => {
        expect(r.type).toBe("activity");
      });
    });
  });
});