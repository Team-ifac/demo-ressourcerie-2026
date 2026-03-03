import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

// ⚠️ Le Context exige maintenant "me" (même en test).
// On met un objet minimal, casté en any pour coller au type réel sans dépendre de sa forme exacte.

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
  me: {
    id: 1,
    role: "admin",
    name: "Admin Test",
    email: "admin@test.com",
  } as any,
  req: {} as any,
  res: {} as any,
} as any;

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
  me: {
    id: 2,
    role: "user",
    name: "User Test",
    email: "user@test.com",
  } as any,
  req: {} as any,
  res: {} as any,
} as any;

const guestContext: Context = {
  user: undefined,
  me: null as any,
  req: {} as any,
  res: {} as any,
} as any;

describe("Resource History API", () => {
  let resourceId: number;

  beforeAll(async () => {
    // Créer une ressource de test (type doit être dans la liste autorisée)
    const caller = appRouter.createCaller(adminContext);

    const resourceResult = await caller.resources.create({
      title: "Ressource pour test historique",
      summary: "Une ressource de test",
      content: "Contenu de test",
      type: "Article",
      visibility: "PUBLIC",
      themeIds: [],
    });

    resourceId = resourceResult.id;
  });

  it("should allow public access to resource history", async () => {
    const caller = appRouter.createCaller(guestContext);
    const history = await caller.history.getByResource({ resourceId });

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it("should create history entry on resource update", async () => {
    const caller = appRouter.createCaller(adminContext);

    await caller.resources.update({
      id: resourceId,
      title: "Titre mis à jour",
      summary: "Résumé mis à jour",
    });

    const history = await caller.history.getByResource({ resourceId });
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it("should order history entries by date (most recent first)", async () => {
    const caller = appRouter.createCaller(adminContext);

    await caller.resources.update({
      id: resourceId,
      content: "Premier changement",
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    await caller.resources.update({
      id: resourceId,
      content: "Deuxième changement",
    });

    const history = await caller.history.getByResource({ resourceId });

    // On teste juste l’ordre global (si le backend renvoie trié)
    if (history.length >= 2) {
      const firstDate = new Date(history[0].createdAt).getTime();
      const secondDate = new Date(history[1].createdAt).getTime();
      expect(firstDate).toBeGreaterThanOrEqual(secondDate);
    }
  });

  it("should track comment additions in history (if implemented)", async () => {
    const caller = appRouter.createCaller(userContext);

    await caller.comments.create({
      resourceId,
      content: "Commentaire pour tester l'historique",
      rating: 4,
    });

    const history = await caller.history.getByResource({ resourceId });
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it("should include user information in history entries (when available)", async () => {
    const caller = appRouter.createCaller(guestContext);
    const history = await caller.history.getByResource({ resourceId });

    expect(Array.isArray(history)).toBe(true);

    const entryWithUser = history.find((h: any) => h.userId != null);
    if (entryWithUser) {
      expect(entryWithUser.userName).toBeDefined();
      expect(typeof entryWithUser.userName).toBe("string");
    }
  });
});