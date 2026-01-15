import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";
import * as db from "./db";

// Mock context pour admin
const adminContext: Context = {
  user: {
    id: 1,
    openId: "admin-test",
    name: "Admin Test",
    email: "admin@test.com",
    role: "admin",
    loginMethod: "test",
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

// Mock context pour utilisateur·rice standard
const userContext: Context = {
  user: {
    id: 2,
    openId: "user-test",
    name: "User Test",
    email: "user@test.com",
    role: "user",
    loginMethod: "test",
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

// Mock context pour visiteur·euse non connecté·e
const guestContext: Context = {
  user: undefined,
  req: {} as any,
  res: {} as any,
};

describe("Tags API", () => {
  it("should allow admin to create a tag", async () => {
    const caller = appRouter.createCaller(adminContext);
    const timestamp = Date.now();
    const result = await caller.tags.create({
      name: `Test Tag Create ${timestamp}`,
      slug: `test-tag-create-${timestamp}`,
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should list all tags (public access)", async () => {
    const caller = appRouter.createCaller(guestContext);
    const tags = await caller.tags.list();

    expect(Array.isArray(tags)).toBe(true);
  });

  it("should get a tag by ID", async () => {
    const caller = appRouter.createCaller(adminContext);
    const timestamp = Date.now();
    
    // Créer un tag pour ce test
    const createResult = await caller.tags.create({
      name: `Test Tag GetById ${timestamp}`,
      slug: `test-tag-getbyid-${timestamp}`,
    });
    
    const tag = await caller.tags.getById({ id: createResult.id });
    expect(tag).toBeDefined();
    expect(tag?.name).toBe(`Test Tag GetById ${timestamp}`);
    expect(tag?.slug).toBe(`test-tag-getbyid-${timestamp}`);
  });

  it("should allow admin to update a tag", async () => {
    const caller = appRouter.createCaller(adminContext);
    const timestamp = Date.now();
    
    // Créer un tag pour ce test
    const createResult = await caller.tags.create({
      name: `Test Tag Update ${timestamp}`,
      slug: `test-tag-update-${timestamp}`,
    });
    
    const result = await caller.tags.update({
      id: createResult.id,
      name: "Updated Tag",
    });

    expect(result.success).toBe(true);

    // Vérifier la mise à jour
    const updatedTag = await caller.tags.getById({ id: createResult.id });
    expect(updatedTag?.name).toBe("Updated Tag");
  });

  it("should prevent non-admin from creating tags", async () => {
    const caller = appRouter.createCaller(userContext);
    const timestamp = Date.now();
    
    await expect(
      caller.tags.create({
        name: `Unauthorized Tag ${timestamp}`,
        slug: `unauthorized-tag-${timestamp}`,
      })
    ).rejects.toThrow();
  });

  it("should allow admin to delete a tag", async () => {
    const caller = appRouter.createCaller(adminContext);
    const timestamp = Date.now();
    
    // Créer un tag pour ce test
    const createResult = await caller.tags.create({
      name: `Test Tag Delete ${timestamp}`,
      slug: `test-tag-delete-${timestamp}`,
    });
    
    const result = await caller.tags.delete({ id: createResult.id });
    expect(result.success).toBe(true);

    // Vérifier la suppression
    const deletedTag = await caller.tags.getById({ id: createResult.id });
    expect(deletedTag).toBeUndefined();
  });
});

describe("Resource Tags Association", () => {
  let tagId: number;
  let resourceId: number;

  beforeAll(async () => {
    const timestamp = Date.now();
    // Créer un tag de test
    const caller = appRouter.createCaller(adminContext);
    const tagResult = await caller.tags.create({
      name: `Association Test Tag ${timestamp}`,
      slug: `association-test-tag-${timestamp}`,
    });
    tagId = tagResult.id;

    // Créer une ressource de test
    const resourceResult = await caller.resources.create({
      title: `Ressource pour test tags ${timestamp}`,
      summary: "Une ressource de test",
      content: "Contenu de test",
      type: "Fiche d'activité",
      visibility: "PUBLIC",
      themeIds: [],
    });
    resourceId = resourceResult.id;
  });

  it("should add a tag to a resource", async () => {
    const caller = appRouter.createCaller(adminContext);
    const result = await caller.tags.addToResource({
      resourceId,
      tagId,
    });

    expect(result.success).toBe(true);
  });

  it("should list tags for a resource", async () => {
    const caller = appRouter.createCaller(guestContext);
    const tags = await caller.tags.getResourceTags({ resourceId });

    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
    
    const associatedTag = tags.find(t => t.id === tagId);
    expect(associatedTag).toBeDefined();
    expect(associatedTag?.name).toContain("Association Test Tag");
  });

  it("should remove a tag from a resource", async () => {
    const caller = appRouter.createCaller(adminContext);
    const result = await caller.tags.removeFromResource({
      resourceId,
      tagId,
    });

    expect(result.success).toBe(true);

    // Vérifier la suppression
    const tags = await caller.tags.getResourceTags({ resourceId });
    const removedTag = tags.find(t => t.id === tagId);
    expect(removedTag).toBeUndefined();
  });

  it("should set multiple tags for a resource", async () => {
    const caller = appRouter.createCaller(adminContext);
    const timestamp = Date.now();
    
    // Créer un deuxième tag
    const tag2Result = await caller.tags.create({
      name: `Second Test Tag ${timestamp}`,
      slug: `second-test-tag-${timestamp}`,
    });
    const tag2Id = tag2Result.id;

    // Définir les tags de la ressource
    const result = await caller.tags.setResourceTags({
      resourceId,
      tagIds: [tagId, tag2Id],
    });

    expect(result.success).toBe(true);

    // Vérifier que les deux tags sont associés
    const tags = await caller.tags.getResourceTags({ resourceId });
    expect(tags.length).toBe(2);
    expect(tags.some(t => t.id === tagId)).toBe(true);
    expect(tags.some(t => t.id === tag2Id)).toBe(true);
  });
});
