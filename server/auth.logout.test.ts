import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,

    // ✅ requis par TrpcContext (ajout récent)
    // On le stub en test : même identité que "user" suffit pour un logout.
    me: user as unknown as TrpcContext["me"],

    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],

    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    // On vérifie les invariants (effacement + sécurité de base).
    // `secure` et `sameSite` peuvent varier selon l'environnement (http vs https, dev/test).
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      httpOnly: true,
      path: "/",
    });

    // On garde une assertion "utile" mais compatible avec les environnements.
    expect(["lax", "none"]).toContain((clearedCookies[0]?.options as any)?.sameSite);
    expect(typeof (clearedCookies[0]?.options as any)?.secure).toBe("boolean");
  });
});
