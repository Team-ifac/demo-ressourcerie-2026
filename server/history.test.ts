import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

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

describe("Resource History API", () => {
  let resourceId: number;

  beforeAll(async () => {
    // Créer une ressource de test
    const caller = appRouter.createCaller(adminContext);
    const resourceResult = await caller.resources.create({
      title: "Ressource pour test historique",
      summary: "Une ressource de test",
      content: "Contenu de test",
      type: "Fiche d'activité",
      visibility: "PUBLIC",
      themeIds: [],
    });
    resourceId = resourceResult.id;
  });

  it("should create history entry on resource creation", async () => {
    const caller = appRouter.createCaller(guestContext);
    const history = await caller.history.getByResource({ resourceId });

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    
    const creationEntry = history.find(h => h.action === "created");
    expect(creationEntry).toBeDefined();
    expect(creationEntry?.changes).toContain("Ressource pour test historique");
    expect(creationEntry?.userName).toBe("Admin Test");
  });

  it("should create history entry on resource update", async () => {
    const caller = appRouter.createCaller(adminContext);
    
    // Mettre à jour la ressource
    await caller.resources.update({
      id: resourceId,
      title: "Titre mis à jour",
      summary: "Résumé mis à jour",
    });

    // Vérifier l'historique
    const history = await caller.history.getByResource({ resourceId });
    const updateEntry = history.find(h => h.action === "updated");
    
    expect(updateEntry).toBeDefined();
    expect(updateEntry?.changes).toContain("titre modifié");
    expect(updateEntry?.changes).toContain("résumé modifié");
  });

  it("should create history entry on resource deletion", async () => {
    const caller = appRouter.createCaller(adminContext);
    
    // Créer une ressource temporaire
    const tempResult = await caller.resources.create({
      title: "Ressource temporaire",
      summary: "Pour test suppression",
      content: "Contenu temporaire",
      type: "Fiche d'activité",
      visibility: "PUBLIC",
      themeIds: [],
    });
    const tempResourceId = tempResult.id;

    // Supprimer la ressource
    await caller.resources.delete({ id: tempResourceId });

    // Vérifier l'historique
    const history = await caller.history.getByResource({ resourceId: tempResourceId });
    const deleteEntry = history.find(h => h.action === "deleted");
    
    expect(deleteEntry).toBeDefined();
    expect(deleteEntry?.changes).toContain("Ressource temporaire");
  });

  it("should allow public access to resource history", async () => {
    const caller = appRouter.createCaller(guestContext);
    const history = await caller.history.getByResource({ resourceId });

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it("should order history entries by date (most recent first)", async () => {
    const caller = appRouter.createCaller(adminContext);
    
    // Faire plusieurs modifications
    await caller.resources.update({
      id: resourceId,
      content: "Premier changement",
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    await caller.resources.update({
      id: resourceId,
      content: "Deuxième changement",
    });

    // Vérifier l'ordre
    const history = await caller.history.getByResource({ resourceId });
    const updateEntries = history.filter(h => h.action === "updated");
    
    expect(updateEntries.length).toBeGreaterThanOrEqual(2);
    
    // Le plus récent doit être en premier
    if (updateEntries.length >= 2) {
      const firstDate = new Date(updateEntries[0].createdAt).getTime();
      const secondDate = new Date(updateEntries[1].createdAt).getTime();
      expect(firstDate).toBeGreaterThanOrEqual(secondDate);
    }
  });

  it("should require admin role to access all history", async () => {
    const caller = appRouter.createCaller(userContext);
    
    await expect(
      caller.history.getAll()
    ).rejects.toThrow();
  });

  it("should allow admin to access all history", async () => {
    const caller = appRouter.createCaller(adminContext);
    const allHistory = await caller.history.getAll();

    expect(Array.isArray(allHistory)).toBe(true);
    expect(allHistory.length).toBeGreaterThan(0);
    
    // Vérifier que les entrées contiennent les informations de ressource
    const firstEntry = allHistory[0];
    expect(firstEntry).toHaveProperty("resourceTitle");
    expect(firstEntry).toHaveProperty("action");
    expect(firstEntry).toHaveProperty("userName");
  });

  it("should respect limit parameter for all history", async () => {
    const caller = appRouter.createCaller(adminContext);
    const limitedHistory = await caller.history.getAll({ limit: 5 });

    expect(Array.isArray(limitedHistory)).toBe(true);
    expect(limitedHistory.length).toBeLessThanOrEqual(5);
  });

  it("should track comment additions in history", async () => {
    const caller = appRouter.createCaller(userContext);
    
    // Ajouter un commentaire
    await caller.comments.create({
      resourceId,
      content: "Commentaire pour tester l'historique",
      rating: 4,
    });

    // Vérifier l'historique
    const history = await caller.history.getByResource({ resourceId });
    const commentEntry = history.find(h => h.action === "comment_added");
    
    expect(commentEntry).toBeDefined();
    expect(commentEntry?.changes).toContain("Nouveau commentaire ajouté");
    expect(commentEntry?.changes).toContain("note 4/5");
  });

  it("should include user information in history entries", async () => {
    const caller = appRouter.createCaller(guestContext);
    const history = await caller.history.getByResource({ resourceId });

    const entryWithUser = history.find(h => h.userId !== null);
    expect(entryWithUser).toBeDefined();
    expect(entryWithUser?.userName).toBeDefined();
    expect(typeof entryWithUser?.userName).toBe("string");
  });
});
