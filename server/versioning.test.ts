import { describe, it, expect } from "vitest";
import {
  createResourceVersion,
  compareVersions,
  generateChangesSummary,
  getResourceVersions,
  getResourceVersion,
  restoreResourceVersion,
  exportVersionHistory,
} from "./versioning";

describe("Versioning Service", () => {
  const mockResource = {
    id: "resource_1",
    title: "Ma ressource",
    description: "Description",
    content: "Contenu",
    tags: ["animation", "enfants"],
    status: "approved",
  };

  it("should create a resource version", async () => {
    const version = await createResourceVersion(
      "resource_1",
      1,
      mockResource,
      "user_1",
      "Création initiale"
    );

    expect(version.resourceId).toBe("resource_1");
    expect(version.versionNumber).toBe(1);
    expect(version.title).toBe("Ma ressource");
    expect(version.changedBy).toBe("user_1");
  });

  it("should compare two versions", async () => {
    const version1 = await createResourceVersion(
      "resource_1",
      1,
      mockResource,
      "user_1"
    );

    const modifiedResource = {
      ...mockResource,
      title: "Ma ressource modifiée",
      description: "Nouvelle description",
    };

    const version2 = await createResourceVersion(
      "resource_1",
      2,
      modifiedResource,
      "user_2"
    );

    const diffs = compareVersions(version1, version2);

    expect(diffs.length).toBeGreaterThan(0);
    expect(diffs.some((d) => d.field === "title")).toBe(true);
    expect(diffs.some((d) => d.field === "description")).toBe(true);
  });

  it("should generate changes summary", async () => {
    const version1 = await createResourceVersion(
      "resource_1",
      1,
      mockResource,
      "user_1"
    );

    const modifiedResource = {
      ...mockResource,
      title: "Titre modifié",
    };

    const version2 = await createResourceVersion(
      "resource_1",
      2,
      modifiedResource,
      "user_2"
    );

    const diffs = compareVersions(version1, version2);
    const summary = generateChangesSummary(diffs);

    expect(summary).toContain("Titre modifié");
  });

  it("should get resource versions", async () => {
    const versions = await getResourceVersions("resource_1");
    expect(Array.isArray(versions)).toBe(true);
  });

  it("should get specific resource version", async () => {
    const version = await getResourceVersion("resource_1", 1);
    // Version peut être null si non trouvée
    expect(version === null || version.versionNumber === 1).toBe(true);
  });

  it("should restore resource version", async () => {
    const result = await restoreResourceVersion("resource_1", 1, "user_1");
    expect(result).toBe(true);
  });

  it("should export version history", async () => {
    const history = await exportVersionHistory("resource_1");
    expect(typeof history).toBe("string");
    expect(history).toContain("resource_1");
  });

  it("should handle empty changes", async () => {
    const version1 = await createResourceVersion(
      "resource_1",
      1,
      mockResource,
      "user_1"
    );

    const diffs = compareVersions(version1, version1);
    const summary = generateChangesSummary(diffs);

    expect(summary).toBe("Aucune modification");
  });
});
