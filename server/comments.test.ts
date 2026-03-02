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
  me: {
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
  me: {
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
  me: {
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
  user: null,
  me: null,
  req: {} as any,
  res: {} as any,
};

describe("Comments API", () => {
  let resourceId: number;
  let commentId: number;

  beforeAll(async () => {
    // ✅ IMPORTANT :
    // Ton backend interdit une ressource PUBLIC si status != "approved"
    // Donc ici on crée une ressource APPROVED + PUBLIC pour permettre l’accès invité.
    const caller = appRouter.createCaller(adminContext);

    const resourceResult = await caller.resources.create({
      title: "Ressource pour test commentaires",
      summary: "Une ressource de test",
      content: "Contenu de test",
      type: "Fiche",
      status: "approved",
      visibility: "PUBLIC",
      themeIds: [],
    });

    resourceId = resourceResult.id;
  });

  it("should require authentication to create a comment", async () => {
    const caller = appRouter.createCaller(guestContext);

    await expect(
      caller.comments.create({
        resourceId,
        content: "Commentaire non autorisé",
      })
    ).rejects.toThrow();
  });

  it("should allow authenticated user to create a comment", async () => {
    const caller = appRouter.createCaller(user1Context);

    const result = await caller.comments.create({
      resourceId,
      content: "Excellent contenu, très utile !",
      rating: 5,
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");

    commentId = result.id;
  });

  it("should list comments for a resource (public access)", async () => {
    const caller = appRouter.createCaller(guestContext);

    const comments = await caller.comments.listByResource({ resourceId });

    expect(Array.isArray(comments)).toBe(true);
    expect(comments.length).toBeGreaterThan(0);

    const createdComment = comments.find((c) => c.id === commentId);
    expect(createdComment).toBeDefined();
    expect(createdComment?.content).toBe("Excellent contenu, très utile !");
    expect(createdComment?.rating).toBe(5);
    expect(createdComment?.userName).toBeDefined();
    expect(typeof createdComment?.userName).toBe("string");
  });

  it("should create comment without rating", async () => {
    const caller = appRouter.createCaller(user2Context);

    const result = await caller.comments.create({
      resourceId,
      content: "Merci pour cette ressource !",
    });

    expect(result).toHaveProperty("id");

    const comments = await caller.comments.listByResource({ resourceId });
    const newComment = comments.find((c) => c.id === result.id);

    expect(newComment?.content).toBe("Merci pour cette ressource !");
    expect(newComment?.rating).toBeNull();
  });

  it("should list user's own comments", async () => {
    const caller = appRouter.createCaller(user1Context);

    const comments = await caller.comments.listByUser();

    expect(Array.isArray(comments)).toBe(true);
    expect(comments.length).toBeGreaterThan(0);

    const userComment = comments.find((c) => c.id === commentId);
    expect(userComment).toBeDefined();
    expect(userComment?.resourceTitle).toBe("Ressource pour test commentaires");
  });

  it("should allow owner to update their comment", async () => {
    const caller = appRouter.createCaller(user1Context);

    const result = await caller.comments.update({
      id: commentId,
      content: "Commentaire mis à jour",
      rating: 4,
    });

    expect(result.success).toBe(true);

    const comments = await caller.comments.listByResource({ resourceId });
    const updatedComment = comments.find((c) => c.id === commentId);

    expect(updatedComment?.content).toBe("Commentaire mis à jour");
    expect(updatedComment?.rating).toBe(4);
  });

  it("should prevent non-owner from updating comment", async () => {
    const caller = appRouter.createCaller(user2Context);

    await expect(
      caller.comments.update({
        id: commentId,
        content: "Tentative de modification",
      })
    ).rejects.toThrow();
  });

  it("should prevent non-owner from deleting comment", async () => {
    const caller = appRouter.createCaller(user2Context);

    await expect(caller.comments.delete({ id: commentId })).rejects.toThrow();
  });

  it("should allow admin to delete any comment", async () => {
    const caller2 = appRouter.createCaller(user2Context);

    const createResult = await caller2.comments.create({
      resourceId,
      content: "Commentaire à supprimer par admin",
    });

    const commentToDelete = createResult.id;

    const adminCaller = appRouter.createCaller(adminContext);

    const result = await adminCaller.comments.delete({ id: commentToDelete });

    expect(result.success).toBe(true);

    const comments = await adminCaller.comments.listByResource({ resourceId });
    const deletedComment = comments.find((c) => c.id === commentToDelete);

    expect(deletedComment).toBeUndefined();
  });

  it("should allow owner to delete their own comment", async () => {
    const caller = appRouter.createCaller(user1Context);

    const result = await caller.comments.delete({ id: commentId });

    expect(result.success).toBe(true);

    const comments = await caller.comments.listByResource({ resourceId });
    const deletedComment = comments.find((c) => c.id === commentId);

    expect(deletedComment).toBeUndefined();
  });

  it("should validate rating range", async () => {
    const caller = appRouter.createCaller(user1Context);

    // Rating trop bas
    await expect(
      caller.comments.create({
        resourceId,
        content: "Test rating invalide",
        rating: 0,
      })
    ).rejects.toThrow();

    // Rating trop haut
    await expect(
      caller.comments.create({
        resourceId,
        content: "Test rating invalide",
        rating: 6,
      })
    ).rejects.toThrow();
  });

  it("should create history entry when comment is added", async () => {
    const caller = appRouter.createCaller(user1Context);

    // Créer un commentaire
    await caller.comments.create({
      resourceId,
      content: "Commentaire pour tester l'historique",
      rating: 5,
    });

    // Vérifier l'historique
    const history = await caller.history.getByResource({ resourceId });
    const commentHistory = history.find((h) => h.action === "comment_added");

    expect(commentHistory).toBeDefined();
    expect(commentHistory?.changes).toContain("avec note 5/5");
  });
});