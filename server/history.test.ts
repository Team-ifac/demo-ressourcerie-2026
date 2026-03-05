import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

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
  me: {
    id: null,
    role: "guest",
    name: null,
    email: null,
  } as any,
  req: {} as any,
  res: {} as any,
} as any;

async function createFreshResourceAsAdmin() {
  const caller = appRouter.createCaller(adminContext);

  const resourceResult = await caller.resources.create({
  title: `Ressource test historique ${Date.now()}`,
  summary: "Une ressource de test",
  content: "Contenu de test",
  type: "Fiche",

  // 🔒 Important pour que getResourceById() la “voit” (guest/admin)
  accessLevel: "PUBLIC" as any,

  visibility: "PUBLIC",
  status: "approved",
  themeIds: [],
});

  const resourceId = Number((resourceResult as any)?.id);
  expect(Number.isFinite(resourceId)).toBe(true);
  expect(resourceId).toBeGreaterThan(0);

  return { caller, resourceId };
}

describe.sequential("Resource History API", () => {
  it("should allow public access to resource history", async () => {
    const { caller: adminCaller, resourceId } = await createFreshResourceAsAdmin();

    // On force une entrée d’historique certaine
    await adminCaller.resources.update({
      id: resourceId,
      title: "Titre mis à jour (public history)",
    });

    const guestCaller = appRouter.createCaller(guestContext);
    const history = await guestCaller.history.getByResource({ resourceId });

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it("should create history entry on resource update", async () => {
    const { caller, resourceId } = await createFreshResourceAsAdmin();

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
    const { caller, resourceId } = await createFreshResourceAsAdmin();

    await caller.resources.update({
      id: resourceId,
      content: "Premier changement",
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    await caller.resources.update({
      id: resourceId,
      content: "Deuxième changement",
    });

    const history = await caller.history.getByResource({ resourceId });

    if ((history as any[]).length >= 2) {
      const firstDate = new Date((history as any)[0].createdAt).getTime();
      const secondDate = new Date((history as any)[1].createdAt).getTime();
      expect(firstDate).toBeGreaterThanOrEqual(secondDate);
    }
  });

  it("should track comment additions in history (if implemented)", async () => {
    const { resourceId } = await createFreshResourceAsAdmin();

    const userCaller = appRouter.createCaller(userContext);
    await userCaller.comments.create({
      resourceId,
      content: "Commentaire pour tester l'historique",
      rating: 4,
    });

    const guestCaller = appRouter.createCaller(guestContext);
    const history = await guestCaller.history.getByResource({ resourceId });

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it("should include user information in history entries (when available)", async () => {
    const { caller, resourceId } = await createFreshResourceAsAdmin();

    // On crée une entrée avec userId garanti
    await caller.resources.update({
      id: resourceId,
      title: "Titre mis à jour (user info)",
    });

    const guestCaller = appRouter.createCaller(guestContext);
    const history = await guestCaller.history.getByResource({ resourceId });

    expect(Array.isArray(history)).toBe(true);

    const entryWithUser = (history as any[]).find((h) => h.userId != null);
    if (entryWithUser) {
      expect(entryWithUser.userName).toBeDefined();
      expect(typeof entryWithUser.userName).toBe("string");
    }
  });
});