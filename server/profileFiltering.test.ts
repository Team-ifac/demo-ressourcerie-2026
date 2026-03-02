import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import * as db from "./db";
import { resources, resourceProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Profile Filtering System", () => {
  let testResourceId: number | null = null;

  beforeAll(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // ✅ Insert + get id reliably (no title re-select)
    const inserted = await database
      .insert(resources)
      .values({
        title: "Test Resource for Profile Filtering",
        summary: "Testing profile filtering",
        content: "Test content",
        type: "activity",

        // ⚠️ Align with Ressourcerie ifac model
        // PUBLIC = visible to everyone
        // INTERNAL_IFAC = visible to connected (non-premium) if includeInternal = true
        accessLevel: "INTERNAL_IFAC",

        // Keep these only if they exist in your schema; otherwise remove them.
        // If your schema doesn't have `visibility`, delete this line.
        visibility: "PUBLIC",

        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: resources.id });

    if (!inserted?.length) throw new Error("Failed to create test resource");

    testResourceId = inserted[0].id;

    await database.insert(resourceProfiles).values({
      resourceId: testResourceId,
      profileType: "animateur",
    });
  });

  afterAll(async () => {
    const database = await getDb();
    if (!database) return;

    // ✅ Avoid crashing cleanup if beforeAll failed
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

      // ✅ In our model: connected (includeInternal) can see PUBLIC + INTERNAL_IFAC (and maybe PREMIUM depending on user context)
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

      // ✅ Only PUBLIC when includeInternal=false
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