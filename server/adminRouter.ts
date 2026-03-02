import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import { users, userProfiles } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { sendPasswordResetEmail } from "./emailService";

/**
 * Admin guard (canon)
 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Accès réservé aux administrateurs·rices",
    });
  }
  return next({ ctx });
});

/**
 * =========================================================
 * Imports (socle pour Import ZIP autonome)
 * =========================================================
 *
 * On commence par un historique minimal "read-only".
 * Ensuite, on branchera:
 * - upload ZIP -> extraction batch
 * - audit preview
 * - run import write
 * - logs + statut
 *
 * IMPORTANT: pour l’instant, on ne fait pas d’upload dans tRPC
 * (on le fera proprement via un endpoint dédié).
 */

const importJobStatus = z.enum(["pending", "running", "success", "failed"]);

type ImportJob = {
  id: number;
  createdAt: string;
  createdByUserId: number;
  status: z.infer<typeof importJobStatus>;
  mode: "AUDIT" | "WRITE";
  extractRoot?: string | null;
  detectedPdfs?: number | null;
  imported?: number | null;
  updated?: number | null;
  skipped?: number | null;
  failed?: number | null;
  logPath?: string | null;
  notes?: string | null;
};

// ⚠️ Stub temporaire: on retournera des jobs DB plus tard.
// Pour l’UI, on renvoie une liste vide stable.
const importsRouter = router({
  list: adminProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(200).default(50),
          offset: z.number().int().min(0).default(0),
        })
        .default({ limit: 50, offset: 0 })
    )
    .query(async ({ input, ctx }) => {
      try {
        // TODO (prochaine étape): table import_jobs + select order by createdAt desc
        // On renvoie un tableau vide pour commencer, afin d’intégrer l’UI sans risque.
        const _userId = ctx.user.id;
        void _userId;

        const rows: ImportJob[] = [];
        return rows;
      } catch (error) {
        console.error("[Admin][Imports] Error listing import jobs:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});

export const adminRouter = router({
  /**
   * Sous-router imports (NOUVEAU)
   */
  imports: importsRouter,

  getSubscriptionStats: adminProcedure
    .input(z.object({ dateRange: z.enum(["week", "month", "year"]).default("month") }))
    .query(async () => {
      try {
        return {
          activeSubscriptions: 0,
          monthlyRevenue: 0,
          conversionRate: 0,
          retentionRate: 85,
          activeSubscriptionsChange: 0,
          monthlyRevenueChange: 0,
          chartData: [{ date: "01 Jan", subscriptions: 0, revenue: 0 }],
        };
      } catch (error) {
        console.error("[Admin] Error getting subscription stats:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  getSubscriptions: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async () => {
      try {
        return [];
      } catch (error) {
        console.error("[Admin] Error getting subscriptions:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  getFormateurs: adminProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const formateurs = await db
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
        .where(eq(userProfiles.profileTypeId, 2));

      return formateurs;
    } catch (error) {
      console.error("[Admin] Error getting formateurs:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  sendFormateursEmails: adminProcedure
    .input(z.object({ userIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const errors: string[] = [];
      let sent = 0;
      let failed = 0;

      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        for (const userId of input.userIds) {
          try {
            const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

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
      } catch (error) {
        console.error("[Admin] Error sending formateurs emails:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'envoi des emails",
        });
      }
    }),
});

// Export pour utilisation dans routers.ts (inchangé)
export const subscriptionProcedures = {
  getSubscriptionStats: {
    input: z.object({ dateRange: z.enum(["week", "month", "year"]).default("month") }),
    query: async () => ({
      activeSubscriptions: 0,
      monthlyRevenue: 0,
      conversionRate: 0,
      retentionRate: 85,
      activeSubscriptionsChange: 0,
      monthlyRevenueChange: 0,
      chartData: [{ date: "01 Jan", subscriptions: 0, revenue: 0 }],
    }),
  },
  getSubscriptions: {
    input: z.object({ limit: z.number().default(50), offset: z.number().default(0) }),
    query: async () => [],
  },
};
