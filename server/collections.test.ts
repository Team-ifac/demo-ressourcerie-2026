import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

/**
 * IMPORTANT
 * - Ce fichier est un test "scénario" (étapes dépendantes)
 * - On force donc l'exécution séquentielle pour éviter les flaky tests.
 */

// Mock context pour utilisateur·rice 1
const user1Context: Context = {
  user: {
    id: 1,
    openId: "user1-test",
    name: "User 1 Test",
    email: "user1@test.com",
    role: "user",
    loginMethod: "test",
    lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
  },
  // ✅ TrpcContext exige aussi "me"
  me: {
    id: 1,
    openId: "user1-test",
    name: "User 1 Test",
    email: "user1@test.com",
    role: "user",
    loginMethod: "test",
    lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
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
    lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
  },
  me: {
    id: 2,
    openId: "user2-test",
    name: "User 2 Test",
    email: "user2@test.com",
    role: "user",
    loginMethod: "test",
    lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
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
    lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
  },
  me: {
    id: 3,
    openId: "admin-test",
    name: "Admin Test",
    email: "admin@test.com",
    role: "admin",
    loginMethod: "test",
    lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
  },
  req: {} as any,
  res: {} as any,
};

// Mock context pour visiteur·euse non connecté·e
const guestContext: Context = {
  user: null,
  me: null,
  req: {} as any,
  res: {} as any,
};

describe.sequential("Collections API", () => {
  let collectionId: number;
  let resourceId: number;
  let newCollectionId: number;

  // Anti-collisions DB (tests relancés, exécution parallèle d'autres fichiers, etc.)
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const collectionName1 = `Ma première collection (${runId})`;
  const updatedName = `Collection mise à jour (${runId})`;
  const protectedName = `Collection à protéger (${runId})`;

  beforeAll(async () => {
    // Créer une ressource de test (admin)
    const caller = appRouter.createCaller(adminContext);

    const resourceResult = await caller.resources.create({
      title: `Ressource pour test collections (${runId})`,
      summary: "Une ressource de test",
      content: "Contenu de test",
      type: "Fiche",
      // ✅ Ton router attend "visibility" (d'après l'erreur TS)
      visibility: "PUBLIC",
      themeIds: [],
    });

    resourceId = resourceResult.id;
  });

  afterAll(async () => {
    // Best-effort cleanup (ne doit pas faire échouer la suite si déjà supprimé)
    const adminCaller = appRouter.createCaller(adminContext);

    // Supprime la ressource test si la route existe.
    try {
      await (adminCaller.resources as any).delete?.({ id: resourceId });
    } catch {
      // ignore
    }

    // Supprime la collection "protected" si elle existe encore
    if (newCollectionId) {
      try {
        const user1Caller = appRouter.createCaller(user1Context);
        await (user1Caller.collections as any).delete?.({ id: newCollectionId });
      } catch {
        // ignore
      }
    }
  });

  it("should require authentication to create a collection", async () => {
    const caller = appRouter.createCaller(guestContext);

    await expect(
      (caller.collections as any).create({
        name: `Ma collection (${runId})`,
        description: "Description de test",
        isPublic: false,
      })
    ).rejects.toThrow();
  });

  it("should allow authenticated user to create a collection", async () => {
    const caller = appRouter.createCaller(user1Context);

    const result = await (caller.collections as any).create({
      name: collectionName1,
      description: "Une collection de test",
      isPublic: false,
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
    collectionId = result.id;
  });

  it("should list user's collections", async () => {
    const caller = appRouter.createCaller(user1Context);

    const collections = await (caller.collections as any).list();

    expect(Array.isArray(collections)).toBe(true);
    expect(collections.length).toBeGreaterThan(0);

    const createdCollection = collections.find((c: any) => c.id === collectionId);
    expect(createdCollection).toBeDefined();
    expect(createdCollection?.name).toBe(collectionName1);
  });

  it("should get a collection by ID (owner)", async () => {
    const caller = appRouter.createCaller(user1Context);

    const collection = await (caller.collections as any).getById({ id: collectionId });

    expect(collection).toBeDefined();
    expect(collection?.name).toBe(collectionName1);
    expect(collection?.userId).toBe(1);
  });

  it("should prevent non-owner from accessing private collection", async () => {
    const caller = appRouter.createCaller(user2Context);

    await expect((caller.collections as any).getById({ id: collectionId })).rejects.toThrow();
  });

  it("should allow owner to update their collection", async () => {
    const caller = appRouter.createCaller(user1Context);

    const result = await (caller.collections as any).update({
      id: collectionId,
      name: updatedName,
      isPublic: true,
    });

    expect(result.success).toBe(true);

    // Vérifier la mise à jour
    const updatedCollection = await (caller.collections as any).getById({ id: collectionId });
    expect(updatedCollection?.name).toBe(updatedName);
    expect(updatedCollection?.isPublic).toBe(true);
  });

  it("should allow non-owner to access public collection", async () => {
    const caller = appRouter.createCaller(user2Context);

    const collection = await (caller.collections as any).getById({ id: collectionId });

    expect(collection).toBeDefined();
    expect(collection?.name).toBe(updatedName);
  });

  it("should prevent non-owner from updating collection", async () => {
    const caller = appRouter.createCaller(user2Context);

    await expect(
      (caller.collections as any).update({
        id: collectionId,
        name: `Tentative de modification (${runId})`,
      })
    ).rejects.toThrow();
  });

  it("should add a resource to collection", async () => {
    const caller = appRouter.createCaller(user1Context);

    const result = await (caller.collections as any).addResource({
      collectionId,
      resourceId,
    });

    expect(result.success).toBe(true);
  });

  it("should list resources in collection", async () => {
    const caller = appRouter.createCaller(user1Context);

    const resources = await (caller.collections as any).getResources({ collectionId });

    expect(Array.isArray(resources)).toBe(true);
    expect(resources.length).toBe(1);
    expect(resources[0].id).toBe(resourceId);
    expect(resources[0].title).toBe(`Ressource pour test collections (${runId})`);
  });

  it("should check if resource is in collection", async () => {
    const caller = appRouter.createCaller(user1Context);

    const result = await (caller.collections as any).checkResource({
      collectionId,
      resourceId,
    });

    expect(result.isInCollection).toBe(true);
  });

  it("should remove a resource from collection", async () => {
    const caller = appRouter.createCaller(user1Context);

    const result = await (caller.collections as any).removeResource({
      collectionId,
      resourceId,
    });

    expect(result.success).toBe(true);

    // Vérifier la suppression
    const checkResult = await (caller.collections as any).checkResource({
      collectionId,
      resourceId,
    });
    expect(checkResult.isInCollection).toBe(false);
  });

  it("should allow owner to delete their collection", async () => {
    const caller = appRouter.createCaller(user1Context);

    const result = await (caller.collections as any).delete({ id: collectionId });

    expect(result.success).toBe(true);

    // Vérifier que la collection n'existe plus
    await expect((caller.collections as any).getById({ id: collectionId })).rejects.toThrow();
  });

  it("should prevent non-owner from deleting collection", async () => {
    // Créer une nouvelle collection (owner = user1)
    const caller1 = appRouter.createCaller(user1Context);

    const createResult = await (caller1.collections as any).create({
      name: protectedName,
      isPublic: true,
    });

    newCollectionId = createResult.id;

    // Tenter de supprimer avec un autre utilisateur
    const caller2 = appRouter.createCaller(user2Context);
    await expect((caller2.collections as any).delete({ id: newCollectionId })).rejects.toThrow();

    // Cleanup best-effort (owner supprime)
    await expect((caller1.collections as any).delete({ id: newCollectionId })).resolves.toMatchObject({
      success: true,
    });
  });
});