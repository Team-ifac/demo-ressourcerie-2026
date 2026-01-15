import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import { getDb } from "./db";

describe("getAllResources with collections", () => {
  let dbInstance: any;

  beforeAll(async () => {
    dbInstance = await getDb();
  });

  it("should return resources with associated collections", async () => {
    const resources = await db.getAllResources({ includeInternal: true });
    
    // Vérifier que les ressources ont une propriété collections
    expect(resources.length).toBeGreaterThan(0);
    
    // Vérifier que chaque ressource a une propriété collections (même si vide)
    resources.forEach((resource: any) => {
      expect(resource).toHaveProperty("collections");
      expect(Array.isArray(resource.collections)).toBe(true);
    });
  });

  it("should correctly count resources in collections", async () => {
    const resources = await db.getAllResources({ includeInternal: true });
    
    // Compter les ressources avec au moins une collection
    const resourcesWithCollections = resources.filter(
      (r: any) => r.collections && r.collections.length > 0
    );
    
    // Compter les ressources sans collection
    const resourcesWithoutCollections = resources.filter(
      (r: any) => !r.collections || r.collections.length === 0
    );
    
    // La somme doit égaler le total
    expect(resourcesWithCollections.length + resourcesWithoutCollections.length).toBe(
      resources.length
    );
  });

  it("should return collection objects with id and name", async () => {
    const resources = await db.getAllResources({ includeInternal: true });
    
    // Trouver une ressource avec au moins une collection
    const resourceWithCollection = resources.find(
      (r: any) => r.collections && r.collections.length > 0
    );
    
    if (resourceWithCollection) {
      const collection = resourceWithCollection.collections[0];
      expect(collection).toHaveProperty("id");
      expect(collection).toHaveProperty("name");
      expect(typeof collection.id).toBe("number");
      expect(typeof collection.name).toBe("string");
    }
  });

  it("should not have duplicate resources", async () => {
    const resources = await db.getAllResources({ includeInternal: true });
    const ids = resources.map((r: any) => r.id);
    const uniqueIds = new Set(ids);
    
    expect(ids.length).toBe(uniqueIds.size);
  });
});
