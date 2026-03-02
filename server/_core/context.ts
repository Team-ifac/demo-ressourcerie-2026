import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { sdk } from "./sdk";
import { getUserProfile } from "../db"; // ✅ ajuste si ton chemin diffère (voir note)
import { getUserEntitlements } from "../db";

type User = any;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];

  // user "brut" (compat)
  user: any | null;

  // me "enrichi" (nouvelle source de vérité)
  me: any | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    // Authentication is optional for public procedures.
    user = null;
  }

  // ✅ Enrichissement avec le profil métier stocké en DB
  let me: any | null = user;

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
      me = {
        ...user,
        profileTypeId,
        // (prévu plus tard) entitlements: { premium: ... }
      };
    } catch {
      // Si la DB a un souci, on ne bloque pas tout : on retombe sur user brut
      me = user;
    }
  }

  return {
  req: opts.req,
  res: opts.res,
  user: me, // alias volontaire : tout le code existant utilise le user enrichi
  me,
};
}
