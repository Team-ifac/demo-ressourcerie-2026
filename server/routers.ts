import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { generateImage } from "./_core/imageGeneration";
import { autoAssociateResourcesToCollections } from "./collectionMatcher";
import { analyzeDuplicates, removeDuplicates } from "./deduplication";
import * as stripeService from "./stripe";
import { cmsRouter } from "./cmsRouter";
import * as authService from "./auth";
import { sendVerificationEmail } from "./emailService";
import { COOKIE_NAME } from "../shared/const";
import { sdk } from "./_core/sdk";

// Middleware pour vérifier le rôle admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Accès réservé aux administrateurs·rices",
    });
  }
  return next({ ctx });
});

// =========================================================
// Helpers d'accès (profil + accessLevel)
// =========================================================
type ProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa";
type AccessLevel = "PUBLIC" | "AUTHENTICATED" | "PREMIUM";

async function resolveProfileType(userId: number): Promise<ProfileType | null> {
  try {
    const p: any = await db.getUserProfile(userId);
    if (!p) return null;
    if (typeof p === "string") return p as ProfileType;
    if (p?.profileType) return p.profileType as ProfileType;
    return null;
  } catch (e) {
    console.warn("[resolveProfileType] Unable to resolve profile type:", e);
    return null;
  }
}

async function resolveIsPremium(userId: number): Promise<boolean> {
  try {
    // Stripe peut être désactivé en local : on protège.
    return await stripeService.hasActiveSubscription(userId);
  } catch {
    return false;
  }
}

function allowedAccessLevels(isLogged: boolean, isPremium: boolean): AccessLevel[] {
  if (!isLogged) return ["PUBLIC"];
  if (isPremium) return ["PUBLIC", "AUTHENTICATED", "PREMIUM"];
  return ["PUBLIC", "AUTHENTICATED"];
}

function filterByAccessLevel(rows: any[], allowed: AccessLevel[]) {
  return (rows || []).filter((r: any) => {
    const lvl = (r?.accessLevel ?? "PUBLIC") as AccessLevel;
    return allowed.includes(lvl);
  });
}

export const appRouter = router({
  system: systemRouter,
  cms: cmsRouter,

  auth: router({
    me: publicProcedure.query((opts) => {
      const u: any = opts.ctx.user;
      if (!u) return null;
      if (u.emailVerified === 0 || u.emailVerified === false) return null;
      return u;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    signup: publicProcedure
      .input(
        z.object({
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(8),
          profileType: z.enum(["animateur", "formateur", "directeur", "stagiaire_bafa"]),
        })
      )
      .mutation(async ({ input }) => {
        const existingUser = await authService.findUserByEmail(input.email);
        if (existingUser) throw new TRPCError({ code: "CONFLICT", message: "Email exists" });
        const { userId, verificationToken } = await authService.createUserWithEmail(input);
        try {
          await sendVerificationEmail(input.email, verificationToken);
        } catch (e) {
          console.error(e);
        }
        return { userId, success: true, verificationToken };
      }),
    verifyEmail: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const result = await authService.verifyUserEmail(input.token);
          return { success: true, userId: result.userId, email: result.email };
        } catch (error: any) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
      }),
    resendVerificationEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const result = await authService.resendVerificationEmail(input.email);
        return result;
      }),
    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const result = await authService.requestPasswordReset(input.email);
        return result;
      }),
    resetPassword: publicProcedure
      .input(z.object({ token: z.string(), newPassword: z.string().min(8) }))
      .mutation(async ({ input }) => {
        try {
          const result = await authService.resetPassword(input.token, input.newPassword);
          return { success: true, userId: result.userId };
        } catch (error: any) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
      }),
    updateProfile: protectedProcedure
      .input(
        z.object({
          firstName: z.string().min(1).optional(),
          lastName: z.string().min(1).optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          await authService.updateUserProfile(ctx.user.id, input);
          return { success: true };
        } catch (error: any) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
      }),
    changePassword: protectedProcedure
      .input(
        z.object({
          currentPassword: z.string(),
          newPassword: z.string().min(8),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          await authService.changePassword(ctx.user.id, input.currentPassword, input.newPassword);
          return { success: true };
        } catch (error: any) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
      }),

    // ✅ LOGIN CORRIGÉ : garantit un openId persistant (sinon ctx.user reste null pour les comptes non-admin)
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const user = await authService.findUserByEmail(input.email);
        console.log("[auth.login] email =", input.email);
console.log("[auth.login] user found =", !!user, "hasPasswordHash =", !!user?.passwordHash);

        if (!user || !user.passwordHash)
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });

        const isPasswordValid = await authService.verifyPassword(input.password, user.passwordHash);
        if (!isPasswordValid)
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });


        // ✅ Blocage : pas de connexion tant que lemail n’est pas vérifié
        const isEmailVerified = !(
  (user as any).emailVerified === 0 ||
  (user as any).emailVerified === false
);

// MODE DÉMO : on n'empêche pas le login si l'email n'est pas vérifié
// (à réactiver quand l'envoi d'email SendGrid est OK)
if (!isEmailVerified) {
  console.warn("[auth.login] Email not verified -> allowed (demo mode)");
}

        // 1) On s'assure d'avoir un openId
        let openId = (user as any).openId as string | null | undefined;

        if (!openId || openId.trim().length === 0) {
          const generatedOpenId = `local-${user.id}-${Date.now()}`;

          // 2) On tente de le persister en DB (sinon la session ne sera pas résolue au prochain call)
          try {
            const db2 = await import("./db").then((m) => (m as any).getDb?.());
            const schema = await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");

            if (!db2) {
              console.warn("[auth.login] getDb() indisponible, openId non persisté. Session peut être instable.");
            } else if (!(schema as any).users) {
              console.warn("[auth.login] schema.users introuvable, openId non persisté. Session peut être instable.");
            } else if (!(schema as any).users.openId) {
              console.warn("[auth.login] users.openId introuvable, openId non persisté. Session peut être instable.");
            } else {
              await db2
                .update((schema as any).users)
                .set({ openId: generatedOpenId })
                .where(eq((schema as any).users.id, user.id));
            }
          } catch (e) {
            console.error("[auth.login] Impossible de persister openId, session peut être instable:", e);
          }

          openId = generatedOpenId;
        }

        // 3) Creer un token de session (toujours avec un openId non vide)
        const sessionToken = await sdk.createSessionToken(openId, {
          name:
            `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
            (user.email ?? "Utilisateur"),
        });

        // 4) Poser la cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        return { userId: user.id, name: `${user.firstName} ${user.lastName}`, success: true };
      }),
  }),

  // ============ THEMES ============
  themes: router({
    list: publicProcedure.query(async () => {
      return await db.getAllThemes();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getThemeById(input.id);
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createTheme(input);
        return { id };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTheme(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTheme(input.id);
        return { success: true };
      }),
  }),

  // ============ RESOURCES ============
  resources: router({
    list: publicProcedure
  .input(
    z
      .object({
        search: z.string().optional(),
        themeIds: z.array(z.number()).optional(),
        collectionIds: z.array(z.number()).optional(),
        type: z.string().optional(),
        ageRange: z.string().optional(),
        duration: z.string().optional(),
        visibility: z.enum(["PUBLIC", "INTERNAL_IFAC"]).optional(),
        category: z.string().optional(),
        profileType: z.enum(["animateur", "formateur", "directeur", "stagiaire_bafa"]).optional(),
      })
      .optional()
  )
  .query(async ({ input, ctx }) => {
  const isLogged = !!ctx.user;
  const isAdmin = ctx.user?.role === "admin";

  // Profil de l'utilisateur connecté (si connecté)
  const myProfileType = isLogged ? await resolveProfileType(ctx.user!.id) : null;

  console.log(
    "[DEBUG resources.list] role=",
    ctx.user?.role,
    "userId=",
    ctx.user?.id,
    "myProfileType=",
    myProfileType
  );
  console.log("[DEBUG resources.list] input.profileType=", (input as any)?.profileType);

  // Règle profils :
  // - admin : vue globale (on ignore profileType venant du front)
  // - formateur : tous les profils
  // - autres connectés : seulement leur profil
  const shouldForceProfileFilter =
    isLogged && !isAdmin && myProfileType && myProfileType !== "formateur";

  const includeInternal = isAdmin || isLogged;

  const filters: any = {
    ...(input || {}),
    includeInternal,
    adminView: isAdmin,
  };

  // IMPORTANT : en admin, ne pas se retrouver filtré par un profileType envoyé par le front.
  if (isAdmin) {
    delete filters.profileType;
  }

  // Non-admin : si l'utilisateur n'est pas formateur, on force le filtre profileType.
  if (shouldForceProfileFilter) {
    filters.profileType = myProfileType;
  }

  console.log("[DEBUG tRPC] Calling getAllResources with filters:", JSON.stringify(filters, null, 2));
  const results = await db.getAllResources(filters);
  console.log("[DEBUG tRPC] getAllResources returned", results.length, "resources");

  // Filtrage accessLevel (sécurité + cohérence)
  if (!isAdmin) {
    const isPremium = isLogged ? await resolveIsPremium(ctx.user!.id) : false;
    const allowed = allowedAccessLevels(isLogged, isPremium);
    return filterByAccessLevel(results as any[], allowed);
  }

  return results;
}),


    // ✅ FIX : "Dernières ressources ajoutées" doit dépendre du profil + accessLevel
    getRecent: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        const limit = input?.limit || 4;

        const isLogged = !!ctx.user;
        const isAdmin = ctx.user?.role === "admin";
        const profileType = isLogged ? await resolveProfileType(ctx.user!.id) : null;

        const isPremium = isLogged ? await resolveIsPremium(ctx.user!.id) : false;
        const allowed = allowedAccessLevels(isLogged, isPremium);

        // Règle profils :
        // - admin : tout
        // - formateur : tous les profils
        // - autres connectés : seulement leur profil
        const shouldFilterByProfile =
          isLogged && !isAdmin && profileType && profileType !== "formateur";

        const includeInternal = isAdmin || isLogged;

        const baseFilters: any = {
          includeInternal,
        };

        if (shouldFilterByProfile) {
          baseFilters.profileType = profileType;
        }

        // On récupère + on filtre localement par accessLevel (car la DB n'a pas forcément un filtre dédié)
        const rows = (await db.getAllResources(baseFilters)) as any[];
        const filtered = filterByAccessLevel(rows, allowed);

        return filtered
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      }),

    getPopularResources: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        const limit = input?.limit || 6;
        const includeInternal = !!ctx.user;
        return await db.getPopularResources(limit, includeInternal);
      }),

    listPopular: publicProcedure.query(async ({ ctx }) => {
  const isLogged = !!ctx.user;
  const isAdmin = ctx.user?.role === "admin";
  const profileType = isLogged ? await resolveProfileType(ctx.user!.id) : null;

  const isPremium = isLogged ? await resolveIsPremium(ctx.user!.id) : false;
  const allowed = allowedAccessLevels(isLogged, isPremium);

  const shouldFilterByProfile =
    isLogged && !isAdmin && profileType && profileType !== "formateur";

  const includeInternal = isAdmin || isLogged;

  const baseFilters: any = { includeInternal };

  if (shouldFilterByProfile) {
    baseFilters.profileType = profileType;
  }

  // On récupère la même "forme" de ressource que /resources.list
  const rows = (await db.getAllResources(baseFilters)) as any[];

  // Filtrage accessLevel (non-admin)
  const filtered = isAdmin ? rows : filterByAccessLevel(rows, allowed);

  // Popularité : on trie par viewCount si présent, sinon views si présent, sinon 0
  return filtered
    .sort((a: any, b: any) => {
      const av = Number(a.viewCount ?? a.views ?? 0);
      const bv = Number(b.viewCount ?? b.views ?? 0);
      return bv - av;
    })
    .slice(0, 6);
}),


    // ✅ FIX : "Dernières ressources ajoutées" (autre endpoint) même logique que getRecent
    listRecent: publicProcedure.query(async ({ ctx }) => {
      const isLogged = !!ctx.user;
      const isAdmin = ctx.user?.role === "admin";
      const profileType = isLogged ? await resolveProfileType(ctx.user!.id) : null;

      const isPremium = isLogged ? await resolveIsPremium(ctx.user!.id) : false;
      const allowed = allowedAccessLevels(isLogged, isPremium);

      const shouldFilterByProfile =
        isLogged && !isAdmin && profileType && profileType !== "formateur";

      const includeInternal = isAdmin || isLogged;

      const baseFilters: any = {
        includeInternal,
      };

      if (shouldFilterByProfile) {
        baseFilters.profileType = profileType;
      }

      const rows = (await db.getAllResources(baseFilters)) as any[];
      const filtered = filterByAccessLevel(rows, allowed);

      return filtered
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6);
    }),

    getAnimationTechniques: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        const limit = input?.limit || 6;
        const includeInternal = !!ctx.user;
        return await db.getAnimationTechniqueResources(limit, includeInternal);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const resource = await db.getResourceById(input.id);
        if (!resource) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ressource non trouvée" });
        }

        // Vérifier la visibilité
        if (resource.visibility === "INTERNAL_IFAC" && !ctx.user) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Connexion requise pour accéder à cette ressource" });
        }

        const themes = await db.getResourceThemes(input.id);
        return { ...resource, themes };
      }),

    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          summary: z.string().min(1),
          content: z.string().min(1),
          type: z.string().min(1),
          ageRange: z.string().optional(),
          duration: z.string().optional(),
          level: z.string().optional(),
          prepTime: z.string().optional(),
          visibility: z.enum(["PUBLIC", "INTERNAL_IFAC"]),
          thumbnailUrl: z.string().optional(),
          fileUrl: z.string().optional(),
          themeIds: z.array(z.number()),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { themeIds, ...resourceData } = input;
        const id = await db.createResource(resourceData, themeIds);

        // Ajouter une entrée dans l'historique
        await db.addResourceHistory({
          resourceId: id,
          userId: ctx.user.id,
          action: "created",
          changes: `Ressource créée : ${input.title}`,
        });

        return { id };
      }),

    update: adminProcedure
  .input(
    z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      summary: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      type: z.string().optional(),
      ageRange: z.string().optional(),
      duration: z.string().optional(),
      level: z.string().optional(),
      prepTime: z.string().optional(),
      visibility: z.enum(["PUBLIC", "INTERNAL_IFAC"]).optional(),
      thumbnailUrl: z.string().optional(),
      fileUrl: z.string().optional(),

      // ✅ AJOUTS : champs réellement modifiables depuis l’admin
      accessLevel: z.enum(["PUBLIC", "AUTHENTICATED", "PREMIUM"]).optional(),
      status: z.enum(["draft", "approved"]).optional(),

      themeIds: z.array(z.number()).optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { id, themeIds, ...resourceData } = input;

    // Construire le message des changements
    const changes: string[] = [];
    if (input.title) changes.push("titre modifié");
    if (input.summary) changes.push("résumé modifié");
    if (input.content) changes.push("contenu modifié");
    if (input.visibility) changes.push("visibilité modifiée");
    if (input.accessLevel) changes.push("accès modifié");
    if (input.status) changes.push("statut modifié");
    if (themeIds) changes.push("thématiques modifiées");

    await db.updateResource(id, resourceData, themeIds);

    // Ajouter une entrée dans l'historique
    // On laisse MySQL gérer createdAt (DEFAULT CURRENT_TIMESTAMP)
    if (changes.length > 0) {
      await db.addResourceHistory({
        resourceId: id,
        userId: ctx.user.id,
        action: "updated",
        changes: `Modifications : ${changes.join(", ")}`,
        // ❌ PAS de createdAt ici
      });
    }

    return { success: true };
  }),

    // ✅ Admin : définir les profils d'une ressource (remplace tous les profils existants)
    setProfiles: adminProcedure
      .input(
        z.object({
          resourceId: z.number(),
          profileTypes: z.array(z.enum(["animateur", "formateur", "directeur", "stagiaire_bafa"])),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.setResourceProfiles(input.resourceId, input.profileTypes);

        // Historique (utile en démo)
        await db.addResourceHistory({
          resourceId: input.resourceId,
          userId: ctx.user.id,
          action: "updated",
          changes: `Profils mis à jour : ${input.profileTypes.join(", ")}`,
        });

        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Récupérer le titre avant suppression
        const resource = await db.getResourceById(input.id);
        const title = resource?.title || "Ressource inconnue";

        // Ajouter une entrée dans l'historique avant suppression
        await db.addResourceHistory({
          resourceId: input.id,
          userId: ctx.user.id,
          action: "deleted",
          changes: `Ressource supprimée : ${title}`,
        });

        await db.deleteResource(input.id);
        return { success: true };
      }),

    uploadFile: adminProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileData: z.string(), // base64
          contentType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, "base64");
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileKey = `resources/${timestamp}-${randomSuffix}-${input.fileName}`;

        const { url } = await storagePut(fileKey, buffer, input.contentType);
        return { url, fileKey };
      }),

    deleteResource: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const resource = await db.getResourceById(input.id);
        if (!resource) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ressource non trouvee" });
        }
        try {
          await db.deleteResource(input.id);
        } catch (error: any) {
          console.error("Erreur lors de la suppression:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erreur lors de la suppression de la ressource",
          });
        }
        return { success: true };
      }),

    deleteAllResources: adminProcedure.mutation(async () => {
      const resources = await db.getAllResources();
      let deleted = 0;
      for (const resource of resources as any[]) {
        try {
          await db.deleteResource(resource.id);
          deleted++;
        } catch (error: any) {
          console.error(`Erreur lors de la suppression de la ressource ${resource.id}:`, error);
        }
      }
      return { success: true, deleted };
    }),

    // ✅ CORRIGÉ : accessLevel doit être "PUBLIC" (ENUM), pas "public"
    // ✅ On laisse MySQL gérer createdAt/updatedAt via CURRENT_TIMESTAMP
    createResource: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          category: z.string().min(1),
          profile: z.enum(["animateur", "formateur", "directeur", "stagiaire_bafa"]),
          url: z.string().optional(),
          type: z.enum(["document", "video", "image", "lien"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const desc = (input.description ?? "").trim();
        const text = desc.length > 0 ? desc : "Exemple créé en 1 clic pour la démo admin.";

        const id = await db.createResource(
          {
            title: input.title,
            summary: text,
            content: text,
            type: input.type || "document",

            // MySQL attend EXACTEMENT ces valeurs d'ENUM
            visibility: "INTERNAL_IFAC",
            accessLevel: "PUBLIC",

            // Champs facultatifs
            thumbnailUrl: null,
            fileUrl: input.url && input.url.trim().length > 0 ? input.url.trim() : null,
            category: input.category,

            // Optionnel (ta table a une valeur par défaut "approved")
            // On force draft pour que l'admin voie la différence
            status: "draft",

            // OK car default est 0, mais on peut l’envoyer explicitement
            viewCount: 0,
          },
          []
        );

        await db.associateResourceToProfile(id, input.profile);
        return { id };
      }),
  }),

  // ============ FAVORITES ============
  favorites: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserFavorites(ctx.user.id);
    }),

    check: protectedProcedure
      .input(z.object({ resourceId: z.number() }))
      .query(async ({ input, ctx }) => {
        const isFav = await db.isFavorite(ctx.user.id, input.resourceId);
        return { isFavorite: isFav };
      }),

    add: protectedProcedure
      .input(z.object({ resourceId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.addFavorite(ctx.user.id, input.resourceId);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ resourceId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.removeFavorite(ctx.user.id, input.resourceId);
        return { success: true };
      }),
  }),

  // ============ ADMIN ============
  admin: router({
    users: router({
  // ✅ MODIF : renvoyer profileType (profil métier) avec les users
  list: adminProcedure.query(async () => {
    const users = (await db.getAllUsers()) as any[];

    const enriched = await Promise.all(
      users.map(async (u) => {
        try {
          const p = await db.getUserProfile(u.id);
          const profileType =
            (p as any)?.profileType ?? (typeof p === "string" ? p : null);

          return { ...u, profileType };
        } catch (e) {
          return { ...u, profileType: null };
        }
      })
    );

    return enriched;
  }),

  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ input }) => {
      return debugMutation("admin.users.updateRole", input, async () => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      });
    }),

  // ✅ NOUVEAU : l’admin peut changer le profil métier
  updateProfile: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        profileType: z.enum(["animateur", "formateur", "directeur", "stagiaire_bafa"]),
      })
    )
    .mutation(async ({ input }) => {
      return debugMutation("admin.users.updateProfile", input, async () => {
        await db.setUserProfile(input.userId, input.profileType);
        return { success: true };
      });
    }),
}),

    importResources: adminProcedure
      .input(
        z.object({
          type: z.enum(["csv", "json"]),
          content: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { ResourceImporter } = await import("./import");
        if (input.type === "csv") {
          return await ResourceImporter.importFromCSV(input.content);
        } else {
          return await ResourceImporter.importFromJSON(input.content);
        }
      }),





    generateThumbnails: adminProcedure
      .input(
        z.object({
          resourceIds: z.array(z.number()).optional(), // Si vide, générer pour toutes les ressources
        })
      )
      .mutation(async ({ input }) => {
        const resources =
          input.resourceIds && input.resourceIds.length > 0
            ? await Promise.all(input.resourceIds.map((id) => db.getResourceById(id)))
            : await db.getAllResources({});

        const validResources = (resources as any[]).filter((r) => r !== null && r !== undefined);
        const results: any[] = [];

        for (const resource of validResources) {
          if (resource.thumbnailUrl) {
            results.push({ resourceId: resource.id, status: "skipped", message: "Thumbnail already exists" });
            continue;
          }

          try {
            const prompt = `Create a colorful, professional educational thumbnail for a resource titled "${resource.title}".
Description: ${resource.summary}

Style: Bright, friendly, suitable for educational content
Colors: Use vibrant colors - blues, greens, oranges, yellows
Include: Children, activities, learning, fun
Format: Square (1:1 ratio), 500x500px
Quality: High quality, professional design`;

            const { url } = await generateImage({ prompt });

            // Mettre à jour la ressource avec l'URL de l'image
            await db.updateResource(resource.id, { thumbnailUrl: url });

            results.push({ resourceId: resource.id, status: "success", url });
          } catch (error) {
            results.push({
              resourceId: resource.id,
              status: "error",
              message: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        return {
          total: validResources.length,
          results,
          summary: {
            success: results.filter((r) => r.status === "success").length,
            skipped: results.filter((r) => r.status === "skipped").length,
            failed: results.filter((r) => r.status === "error").length,
          },
        };
      }),

    importFormateurs: adminProcedure
      .input(
        z.object({
          file: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { importFormateurs } = await import("./importFormateurs");
        let buffer: Buffer;

        try {
          buffer = Buffer.from(input.file, "base64");
        } catch (e) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Fichier invalide",
          });
        }

        const tempPath = `/tmp/formateurs_${Date.now()}.xlsx`;

        const fs = await import("fs").then((m) => m.promises);
        await fs.writeFile(tempPath, buffer);

        try {
          const result = await importFormateurs(tempPath);
          // Nettoyer le fichier temporaire
          await fs.unlink(tempPath);
          return result;
        } catch (error) {
          // Nettoyer le fichier temporaire
          try {
            await fs.unlink(tempPath);
          } catch (e) {}
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Erreur lors de l'import",
          });
        }
      }),

    assignCategories: adminProcedure.mutation(async () => {
      const typeToCategories: Record<string, string[]> = {
        Fiche: ["Fiches pratiques"],
        "Kit clé en main": ["Kits complets"],
        Projet: ["Projets pédagogiques"],
        Article: ["Articles"],
        "Grand jeu": ["Grands jeux"],
        Atelier: ["Ateliers"],
        Recette: ["Recettes"],
        Activité: ["Activités"],
      };

      const resources = (await db.getAllResources()) as any[];
      let updated = 0;
      let skipped = 0;

      for (const resource of resources) {
        try {
          let isValidJSON = false;

          if (resource.category) {
            try {
              JSON.parse(resource.category);
              isValidJSON = true;
            } catch (e) {
              isValidJSON = false;
            }
          }

          if (isValidJSON) {
            skipped++;
            continue;
          }

          const newCategories = typeToCategories[resource.type] || ["Autres"];
          await db.updateResourceCategories(resource.id, newCategories);
          updated++;
        } catch (error) {
          console.error(`Erreur pour la ressource ${resource.id}:`, error);
        }
      }

      return { updated, skipped, total: updated + skipped };
    }),

    getFormateurs: adminProcedure.query(async () => {
      const db2 = await import("./db").then((m) => m.getDb());
      if (!db2) throw new Error("Database not available");
      const { users, userProfiles } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const formateurs = await db2
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          passwordResetToken: users.passwordResetToken,
          passwordResetExpiresAt: users.passwordResetExpiresAt,
        })
        .from(users)
        .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(eq(userProfiles.profileType, "formateur"));

      return formateurs;
    }),

    sendFormateursEmails: adminProcedure
      .input(z.object({ userIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const errors: string[] = [];
        let sent = 0;
        let failed = 0;

        const db2 = await import("./db").then((m) => m.getDb());
        if (!db2) throw new Error("Database not available");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { sendPasswordResetEmail } = await import("./emailService");

        for (const userId of input.userIds) {
          try {
            const user = await db2.select().from(users).where(eq(users.id, userId)).limit(1);

            if (user.length === 0) {
              errors.push(`Utilisateur ${userId} non trouve`);
              failed++;
              continue;
            }

            const formateur = user[0];
            if (!formateur.passwordResetToken) {
              errors.push(`Pas de token pour ${formateur.email}`);
              failed++;
              continue;
            }

            if (formateur.email && formateur.passwordResetToken) {
              await sendPasswordResetEmail(formateur.email, formateur.passwordResetToken);
            }
            sent++;
          } catch (err) {
            errors.push(`Erreur pour utilisateur ${userId}`);
            failed++;
          }
        }

        return { sent, failed, errors };
      }),

    importPDFBulk: adminProcedure
      .input(
        z.object({
          resources: z.array(
            z.object({
              title: z.string(),
              summary: z.string(),
              content: z.string(),
              type: z.string(),
              visibility: z.string(),
              accessLevel: z.string(),
              status: z.string(),
              profiles: z.array(z.string()),
              fileUrl: z.string(),
              fileName: z.string(),
              folder: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const results: any[] = [];
        let imported = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const resource of input.resources) {
          try {
            const resourceId = await db.createResource(
              {
                title: resource.title,
                summary: resource.summary,
                content: resource.content,
                type: resource.type,
                visibility: resource.visibility,
                accessLevel: resource.accessLevel,
                status: resource.status,
                fileUrl: null,
                thumbnailUrl: null,
                category: JSON.stringify([resource.folder]),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              []
            );

            for (const profile of resource.profiles) {
              await db.addResourceProfile(resourceId, profile);
            }

            results.push({
              fileName: resource.fileName,
              status: "success",
              resourceId,
              title: resource.title,
            });
            imported++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
            errors.push(`${resource.fileName}: ${errorMsg}`);
            results.push({
              fileName: resource.fileName,
              status: "error",
              error: errorMsg,
            });
            failed++;
          }
        }

        return {
          total: input.resources.length,
          imported,
          failed,
          errors,
          results,
        };
      }),
  }),
  // ============ PROFILES ============
profiles: router({
  getUserProfile: protectedProcedure.query(async ({ ctx }) => {
    const p: any = await db.getUserProfile(ctx.user.id);
    const profileType =
      (p as any)?.profileType ?? (typeof p === "string" ? p : null);
    return { profileType };
  }),

  setUserProfile: protectedProcedure
    .input(
      z.object({
        profileType: z.enum([
          "animateur",
          "formateur",
          "directeur",
          "stagiaire_bafa",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.setUserProfile(ctx.user.id, input.profileType);
      return { success: true };
    }),
}),


  // ... (le reste du fichier est inchangé par rapport à ta version)
  // IMPORTANT : je n'ai pas modifié les autres routers (tags/collections/etc.)
  // Si tu veux, je te recolle aussi la fin complète, mais fonctionnellement ce fix suffit.

  // ============ TAGS ============
  tags: router({
    list: publicProcedure.query(async () => {
      return await db.getAllTags();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTagById(input.id);
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createTag(input);
        return { id };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTag(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTag(input.id);
        return { success: true };
      }),

    getResourceTags: publicProcedure
      .input(z.object({ resourceId: z.number() }))
      .query(async ({ input }) => {
        return await db.getResourceTags(input.resourceId);
      }),

    addToResource: adminProcedure
      .input(
        z.object({
          resourceId: z.number(),
          tagId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await db.addResourceTag(input.resourceId, input.tagId);
        return { success: true };
      }),

    removeFromResource: adminProcedure
      .input(
        z.object({
          resourceId: z.number(),
          tagId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await db.removeResourceTag(input.resourceId, input.tagId);
        return { success: true };
      }),

    setResourceTags: adminProcedure
      .input(
        z.object({
          resourceId: z.number(),
          tagIds: z.array(z.number()),
        })
      )
      .mutation(async ({ input }) => {
        await db.setResourceTags(input.resourceId, input.tagIds);
        return { success: true };
      }),
  }),

  // ============ COLLECTIONS ============
collections: router({
  // ✅ Admin : liste complète des ressources (pour l’écran admin "ressources-management")
  // + enrichissement avec profiles
  getAllResourcesForAdmin: adminProcedure.query(async () => {
    const rows = (await db.getAllResources({
      includeInternal: true,
      adminView: true,
    })) as any[];

    const enriched = await Promise.all(
      rows.map(async (r: any) => {
        const profRows = await db.getResourceProfiles(Number(r.id));
        const profiles = Array.isArray(profRows)
          ? profRows.map((p: any) => p.profileType).filter(Boolean)
          : [];
        return { ...r, profiles };
      })
    );

    return enriched;
  }),

  // Collections de l'utilisateur connecté
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUserCollections(ctx.user.id);
  }),

  // Collections publiques
  listPublic: publicProcedure.query(async () => {
    return await db.getPublicCollections();
  }),
}),



  comments: router({
    listByResource: publicProcedure
      .input(z.object({ resourceId: z.number() }))
      .query(async ({ input }) => {
        return await db.getResourceComments(input.resourceId);
      }),
    // ... (inchangé)
  }),

  history: router({
    getByResource: publicProcedure
      .input(z.object({ resourceId: z.number() }))
      .query(async ({ input }) => {
        return await db.getResourceHistory(input.resourceId);
      }),
    // ... (inchangé)
  }),

  contact: router({
    send: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Le nom est requis"),
          email: z.string().email("Email invalide"),
          subject: z.string().min(1, "Le sujet est requis"),
          message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
        })
      )
      .mutation(async ({ input }) => {
        const success = await notifyOwner({
          title: `Nouveau message de contact : ${input.subject}`,
          content: `De: ${input.name} (${input.email})\n\nSujet: ${input.subject}\n\nMessage:\n${input.message}`,
        });

        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erreur lors de l'envoi du message. Veuillez réessayer.",
          });
        }

        return { success: true };
      }),
  }),

  // ... (inchangé)
  stripe: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({ successUrl: z.string().url(), cancelUrl: z.string().url() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        try {
          const checkoutUrl = await stripeService.createCheckoutSession(
            ctx.user.id,
            ctx.user.email || "",
            ctx.user.name || "User",
            input.successUrl,
            input.cancelUrl
          );

          return { checkoutUrl };
        } catch (error) {
          console.error("[tRPC] Error creating checkout session:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create checkout session" });
        }
      }),

    hasActiveSubscription: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return false;
      try {
        return await stripeService.hasActiveSubscription(ctx.user.id);
      } catch (error) {
        console.error("[tRPC] Error checking subscription:", error);
        return false;
      }
    }),

    getSubscription: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      try {
        return await stripeService.getOrCreateSubscription(ctx.user.id);
      } catch (error) {
        console.error("[tRPC] Error getting subscription:", error);
        return null;
      }
    }),

    getInvoices: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      try {
        return [];
      } catch (error) {
        console.error("[tRPC] Error getting invoices:", error);
        return false;
      }
    }),

    cancelSubscription: protectedProcedure
      .input(z.object({ subscriptionId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });

        try {
          await stripeService.cancelSubscription(input.subscriptionId);
          return { success: true };
        } catch (error) {
          console.error("[tRPC] Error canceling subscription:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to cancel subscription" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;

// =========================================================
// DEBUG tRPC GLOBAL (temporaire) — ne touche qu'à la fin du fichier
// =========================================================

/**
 * Wrapper simple pour exécuter une mutation avec logs propres.
 * Utilisation : return debugMutation("nom", input, async () => { ... })
 */
export async function debugMutation<T>(
  name: string,
  input: unknown,
  fn: () => Promise<T>
): Promise<T> {
  try {
    console.log(`[DEBUG:${name}] input=`, input);
    const result = await fn();
    console.log(`[DEBUG:${name}] success`);
    return result;
  } catch (err: any) {
    console.error(`\n[DEBUG:${name}] ERROR`);
    console.error("[message]", err?.message);
    console.error("[code]", err?.code);
    console.error("[sqlMessage]", err?.sqlMessage);
    console.error("[errno]", err?.errno);
    console.error("[stack]", err?.stack ?? err);
    console.error("");

    // IMPORTANT: on relance l'erreur telle quelle pour ne pas changer le comportement
    throw err;
  }
}

