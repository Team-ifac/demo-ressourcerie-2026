import { describe, expect, it } from "vitest";
import * as db from "../db";

describe("PILIER PREMIUM — Anti-fuite (audit-proof)", () => {
  it("getAllResources: ne doit JAMAIS exposer PREMIUM quand includePremium=false", async () => {
    const rowsVisitor = (await db.getAllResources({
      includeInternal: false,
      includePremium: false,
    })) as any[];

    expect(Array.isArray(rowsVisitor)).toBe(true);
    expect(rowsVisitor.some((r) => String(r?.accessLevel).toUpperCase() === "PREMIUM")).toBe(false);

    const rowsLoggedNonPremium = (await db.getAllResources({
      includeInternal: true,
      includePremium: false,
    })) as any[];

    expect(Array.isArray(rowsLoggedNonPremium)).toBe(true);
    expect(rowsLoggedNonPremium.some((r) => String(r?.accessLevel).toUpperCase() === "PREMIUM")).toBe(false);
  });

  it("getHomePopularResources: ne doit JAMAIS exposer PREMIUM quand includePremium=false", async () => {
    const rowsVisitor = (await db.getHomePopularResources({
      includeInternal: false,
      includePremium: false,
      isAdmin: false,
      autoLimit: 6,
      editorialLimit: 2,
    })) as any[];

    expect(Array.isArray(rowsVisitor)).toBe(true);
    expect(rowsVisitor.some((r) => String(r?.accessLevel).toUpperCase() === "PREMIUM")).toBe(false);

    const rowsLoggedNonPremium = (await db.getHomePopularResources({
      includeInternal: true,
      includePremium: false,
      isAdmin: false,
      autoLimit: 6,
      editorialLimit: 2,
    })) as any[];

    expect(Array.isArray(rowsLoggedNonPremium)).toBe(true);
    expect(rowsLoggedNonPremium.some((r) => String(r?.accessLevel).toUpperCase() === "PREMIUM")).toBe(false);
  });
});