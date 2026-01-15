import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

// Mock context pour utilisateur·rice 1
const user1Context: Context = {
  user: {
    id: 1,
    openId: "user1-test",
    name: "User 1 Test",
    email: "user1@test.com",
    role: "user",
    loginMethod: "test",
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

// Mock context pour utilisateur·rice 2
const user2Context: Context = {
  user: {
    id: 2,
    openId: "user2-test",
    name: "User 2 Test",
    email: "user2@test.com",
    role: "user",
    loginMethod: "test",
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

// Mock context pour admin
const adminContext: Context = {
  user: {
    id: 3,
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

// Mock context pour visiteur·euse non connecté·e
const guestContext: Context = {
  user: undefined,
  req: {} as any,
  res: {} as any,
};

describe("Collections API", () => {
  let collectionId: number;
  let resourceId: number;

  beforeAll(async () => {
    // Créer une ressource de test
    const caller = appRouter.createCaller(adminContext);
    const resourceResult = await caller.resources.create({
      title: "Ressource pour test collections",
      summary: "Une ressource de test",
      content: "Contenu de test",
      type: "Fiche d'activité",
      visibility: "PUBLIC",
      themeIds: [],
    });
    resourceId = resourceResult.id;
  });

  it("should require authentication to create a collection", async () => {
    const caller = appRouter.createCaller(guestContext);
    
    await expect(
      caller.collections.create({
        name: "Ma collection",
        description: "Description de test",
        isPublic: false,
      })
    ).rejects.toThrow();
  });

  it("should allow authenticated user to create a collection", async () => {
    const caller = appRouter.createCaller(user1Context);
    const result = await caller.collections.create({
      name: "Ma première collection",
      description: "Une collection de test",
      isPublic: false,
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
    collectionId = result.id;
  });

  it("should list user's collections", async () => {
    const caller = appRouter.createCaller(user1Context);
    const collections = await caller.collections.list();

    expect(Array.isArray(collections)).toBe(true);
    expect(collections.length).toBeGreaterThan(0);
    
    const createdCollection = collections.find(c => c.id === collectionId);
    expect(createdCollection).toBeDefined();
    expect(createdCollection?.name).toBe("Ma première collection");
  });

  it("should get a collection by ID (owner)", async () => {
    const caller = appRouter.createCaller(user1Context);
    const collection = await caller.collections.getById({ id: collectionId });

    expect(collection).toBeDefined();
    expect(collection?.name).toBe("Ma première collection");
    expect(collection?.userId).toBe(1);
  });

  it("should prevent non-owner from accessing private collection", async () => {
    const caller = appRouter.createCaller(user2Context);
    
    await expect(
      caller.collections.getById({ id: collectionId })
    ).rejects.toThrow();
  });

  it("should allow owner to update their collection", async () => {
    const caller = appRouter.createCaller(user1Context);
    const result = await caller.collections.update({
      id: collectionId,
      name: "Collection mise à jour",
      isPublic: true,
    });

    expect(result.success).toBe(true);

    // Vérifier la mise à jour
    const updatedCollection = await caller.collections.getById({ id: collectionId });
    expect(updatedCollection?.name).toBe("Collection mise à jour");
    expect(updatedCollection?.isPublic).toBe("true");
  });

  it("should allow non-owner to access public collection", async () => {
    const caller = appRouter.createCaller(user2Context);
    const collection = await caller.collections.getById({ id: collectionId });

    expect(collection).toBeDefined();
    expect(collection?.name).toBe("Collection mise à jour");
  });

  it("should prevent non-owner from updating collection", async () => {
    const caller = appRouter.createCaller(user2Context);
    
    await expect(
      caller.collections.update({
        id: collectionId,
        name: "Tentative de modification",
      })
    ).rejects.toThrow();
  });

  it("should add a resource to collection", async () => {
    const caller = appRouter.createCaller(user1Context);
    const result = await caller.collections.addResource({
      collectionId,
      resourceId,
    });

    expect(result.success).toBe(true);
  });

  it("should list resources in collection", async () => {
    const caller = appRouter.createCaller(user1Context);
    const resources = await caller.collections.getResources({ collectionId });

    expect(Array.isArray(resources)).toBe(true);
    expect(resources.length).toBe(1);
    expect(resources[0].id).toBe(resourceId);
    expect(resources[0].title).toBe("Ressource pour test collections");
  });

  it("should check if resource is in collection", async () => {
    const caller = appRouter.createCaller(user1Context);
    const result = await caller.collections.checkResource({
      collectionId,
      resourceId,
    });

    expect(result.isInCollection).toBe(true);
  });

  it("should remove a resource from collection", async () => {
    const caller = appRouter.createCaller(user1Context);
    const result = await caller.collections.removeResource({
      collectionId,
      resourceId,
    });

    expect(result.success).toBe(true);

    // Vérifier la suppression
    const checkResult = await caller.collections.checkResource({
      collectionId,
      resourceId,
    });
    expect(checkResult.isInCollection).toBe(false);
  });

  it("should allow owner to delete their collection", async () => {
    const caller = appRouter.createCaller(user1Context);
    const result = await caller.collections.delete({ id: collectionId });

    expect(result.success).toBe(true);

    // Vérifier que la collection n'existe plus
    await expect(
      caller.collections.getById({ id: collectionId })
    ).rejects.toThrow();
  });

  it("should prevent non-owner from deleting collection", async () => {
    // Créer une nouvelle collection
    const caller1 = appRouter.createCaller(user1Context);
    const createResult = await caller1.collections.create({
      name: "Collection à protéger",
      isPublic: true,
    });
    const newCollectionId = createResult.id;

    // Tenter de supprimer avec un autre utilisateur
    const caller2 = appRouter.createCaller(user2Context);
    await expect(
      caller2.collections.delete({ id: newCollectionId })
    ).rejects.toThrow();
  });
});
