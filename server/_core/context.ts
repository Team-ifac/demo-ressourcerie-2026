import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { sdk } from "./sdk";
import { getUserProfile, getUserEntitlements } from "../db";

type User = any;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];

  // user "brut" (compat)
  user: any | null;

  // me "enrichi" (source de vérité côté policies)
  me: any | null;
};

// ✅ Alias pro pour compat tests / anciens imports
export type Context = TrpcContext;

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    // Auth optionnelle pour les procédures publiques
    user = null;
  }

  // Base : user brut
  let me: any | null = user;

  // ✅ Enrichissement DB (profil + entitlements)
  if (user?.id) {
    try {
      const profile = await getUserProfile(Number(user.id));
      const profileTypeId = profile?.profileTypeId ?? null;

      const ent = await getUserEntitlements(Number(user.id));

      me = {
        ...user,
        profileTypeId,
        entitlements: {
          premium: !!ent?.premium,
        },
      };
    } catch {
      // Si la DB a un souci, on ne bloque pas : on retombe sur user brut
      me = user;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user: me, // alias volontaire : le code existant utilise le user enrichi
    me,
  };
}