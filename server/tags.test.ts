// CHECKPOINT_TAGS_REPLACE_OK
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

// --------------------
// Contexts
// ⚠️ IMPORTANT : si ton Context réel contient db/logger/storage,
// il faut les fournir ici. Cette version garde ton modèle,
// mais stabilise surtout le cleanup + évite les champs risqués.
// --------------------
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
    email: "admin@test.com",
    role: "admin",
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
    email: "user@test.com",
    role: "user",
  } as any,
  req: {} as any,
  res: {} as any,
} as any;

const guestContext: Context = {
  user: undefined,
  me: undefined as any,
  req: {} as any,
  res: {} as any,
} as any;

const makeAdminCaller = () => appRouter.createCaller(adminContext);
const makeUserCaller = () => appRouter.createCaller(userContext);
const makeGuestCaller = () => appRouter.createCaller(guestContext);

// --------------------
// Helpers + cleanup (GLOBAL)
// --------------------
const createdTagIds: number[] = [];
const createdResourceIds: number[] = [];

afterAll(async () => {
  const caller = makeAdminCaller();

  // ✅ Cleanup robuste :
  // 1) supprimer d'abord les ressources (et donc leurs associations)
  //    -> souvent plus safe côté FK (resource_tags)
  for (const id of createdResourceIds) {
    try {
      // adapte si ton router n'a pas resources.delete
      await (caller as any).resources.delete({ id });
    } catch {
      // ignore
    }
  }

  // 2) ensuite supprimer les tags
  for (const id of createdTagIds) {
    try {
      await caller.tags.delete({ id });
    } catch {
      // ignore
    }
  }
});

// --------------------
// Tests
// --------------------
describe.sequential("Tags API", () => {
  it("should allow admin to create a tag", async () => {
    const caller = makeAdminCaller();
    const ts = Date.now();

    const result = await caller.tags.create({
      name: `Test Tag Create ${ts}`,
      slug: `test-tag-create-${ts}`,
    });

    createdTagIds.push(result.id);

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should list all tags (public access)", async () => {
    const caller = makeGuestCaller();
    const tags = await caller.tags.list();
    expect(Array.isArray(tags)).toBe(true);
  });

  it("should get a tag by ID", async () => {
    const caller = makeAdminCaller();
    const ts = Date.now();

    const createResult = await caller.tags.create({
      name: `Test Tag GetById ${ts}`,
      slug: `test-tag-getbyid-${ts}`,
    });

    createdTagIds.push(createResult.id);

    const tag = await caller.tags.getById({ id: createResult.id });
    expect(tag).toBeDefined();
    expect(tag?.name).toBe(`Test Tag GetById ${ts}`);
    expect(tag?.slug).toBe(`test-tag-getbyid-${ts}`);
  });

  it("should allow admin to update a tag", async () => {
    const caller = makeAdminCaller();
    const ts = Date.now();

    const createResult = await caller.tags.create({
      name: `Test Tag Update ${ts}`,
      slug: `test-tag-update-${ts}`,
    });

    createdTagIds.push(createResult.id);

    const result = await caller.tags.update({
      id: createResult.id,
      name: "Updated Tag",
    });

    expect(result.success).toBe(true);

    const updatedTag = await caller.tags.getById({ id: createResult.id });
    expect(updatedTag?.name).toBe("Updated Tag");
  });

  it("should prevent non-admin from creating tags", async () => {
    const caller = makeUserCaller();
    const ts = Date.now();

    await expect(
      caller.tags.create({
        name: `Unauthorized Tag ${ts}`,
        slug: `unauthorized-tag-${ts}`,
      })
    ).rejects.toThrow();
  });

  it("should allow admin to delete a tag", async () => {
    const caller = makeAdminCaller();
    const ts = Date.now();

    const createResult = await caller.tags.create({
      name: `Test Tag Delete ${ts}`,
      slug: `test-tag-delete-${ts}`,
    });

    createdTagIds.push(createResult.id);

    const result = await caller.tags.delete({ id: createResult.id });
    expect(result.success).toBe(true);

    const deletedTag = await caller.tags.getById({ id: createResult.id });
    expect(deletedTag).toBeUndefined();
  });
});

describe.sequential("Resource Tags Association", () => {
  let tagId: number;
  let resourceId: number;

  beforeAll(async () => {
    const ts = Date.now();
    const caller = makeAdminCaller();

    const tagResult = await caller.tags.create({
      name: `Association Test Tag ${ts}`,
      slug: `association-test-tag-${ts}`,
    });
    tagId = tagResult.id;
    createdTagIds.push(tagId);

    // ⚠️ Ici on évite "visibility" (souvent source de mismatch).
    // Si ton router exige d'autres champs, on ajustera après le 1er run de test.
    const resourceResult = await caller.resources.create({
  title: `Ressource pour test tags ${ts}`,
  summary: "Une ressource de test",
  content: "Contenu de test",
  type: "Fiche",

  // ✅ On force approved pour éviter le blocage "draft + PUBLIC interdit"
  status: "approved",

  // (optionnel mais OK) : tu peux laisser, même si le router reconstruit la valeur
  visibility: "PUBLIC",

  accessLevel: "PUBLIC",
  themeIds: [],
} as any);

resourceId = resourceResult.id;
createdResourceIds.push(resourceId);
});

  it("should add a tag to a resource", async () => {
    const caller = makeAdminCaller();
    const result = await caller.tags.addToResource({ resourceId, tagId });
    expect(result.success).toBe(true);
  });

  it("should list tags for a resource", async () => {
    const caller = makeGuestCaller();
    const tags = await caller.tags.getResourceTags({ resourceId });

    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);

    const associatedTag = tags.find((t) => t.id === tagId);
    expect(associatedTag).toBeDefined();
    expect(associatedTag?.name).toContain("Association Test Tag");
  });

  it("should remove a tag from a resource", async () => {
    const caller = makeAdminCaller();
    const result = await caller.tags.removeFromResource({ resourceId, tagId });
    expect(result.success).toBe(true);

    const tags = await caller.tags.getResourceTags({ resourceId });
    expect(tags.find((t) => t.id === tagId)).toBeUndefined();
  });

  it("should set multiple tags for a resource", async () => {
    const caller = makeAdminCaller();
    const ts = Date.now();

    const tag2Result = await caller.tags.create({
      name: `Second Test Tag ${ts}`,
      slug: `second-test-tag-${ts}`,
    });

    const tag2Id = tag2Result.id;
    createdTagIds.push(tag2Id);

    const result = await caller.tags.setResourceTags({
      resourceId,
      tagIds: [tagId, tag2Id],
    });

    expect(result.success).toBe(true);

    const tags = await caller.tags.getResourceTags({ resourceId });
    expect(tags.length).toBe(2);
    expect(tags.some((t) => t.id === tagId)).toBe(true);
    expect(tags.some((t) => t.id === tag2Id)).toBe(true);
  });
});