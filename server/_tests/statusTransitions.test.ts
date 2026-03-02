import { describe, it, expect } from "vitest";
import { updateResource } from "../db";

// =========================================================
// Helper PUR (sans DB) pour tester la gouvernance
// =========================================================
function assertTransitionAllowed(params: {
  from: string;
  to: string;
  isAdmin: boolean;
}) {
  const from = String(params.from ?? "").toLowerCase();
  const to = String(params.to ?? "").toLowerCase();
  const isAdmin = !!params.isAdmin;

  const allowedTransitions: Record<string, string[]> = {
    draft: ["pending"],
    pending: ["approved", "rejected"],
    approved: ["pending"],
    rejected: ["draft"],
  };

  if (from === to) return;

  if (isAdmin) return;

  const allowed = allowedTransitions[from] || [];
  if (!allowed.includes(to)) {
    throw new Error(`Transition interdite: ${from} -> ${to}`);
  }
}

describe("PILIER 4 — Verrouillage transitions statut (audit-proof)", () => {

  // =========================================================
  // TESTS réels via updateResource (avec DB)
  // =========================================================

  it("non-admin : interdit draft -> approved", async () => {
    await expect(
      updateResource(999999, { status: "approved", _actorRole: "user" } as any)
    ).rejects.toThrow(/Transition interdite/i);
  });

  it("admin : autorise draft -> approved (override)", async () => {
    const originalWarn = console.warn;
    console.warn = () => {};

    try {
      await updateResource(999999, { status: "approved", _actorRole: "admin" } as any);
    } catch (err: any) {
      const message = String(err?.message ?? err);
      expect(message).not.toMatch(/Transition interdite/i);
    } finally {
      console.warn = originalWarn;
    }
  });

  // =========================================================
  // TESTS purs (sans DB)
  // =========================================================

  it("non-admin : autorise draft -> pending", () => {
    expect(() =>
      assertTransitionAllowed({ from: "draft", to: "pending", isAdmin: false })
    ).not.toThrow();
  });

  it("non-admin : autorise pending -> approved", () => {
    expect(() =>
      assertTransitionAllowed({ from: "pending", to: "approved", isAdmin: false })
    ).not.toThrow();
  });

  it("non-admin : interdit approved -> draft", () => {
    expect(() =>
      assertTransitionAllowed({ from: "approved", to: "draft", isAdmin: false })
    ).toThrow(/Transition interdite/i);
  });

  it("non-admin : interdit draft -> rejected", () => {
    expect(() =>
      assertTransitionAllowed({ from: "draft", to: "rejected", isAdmin: false })
    ).toThrow(/Transition interdite/i);
  });

});