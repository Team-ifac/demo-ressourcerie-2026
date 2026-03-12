import * as StripeSDK from "stripe";
import type Stripe from "stripe";
const StripeCtor: any = (StripeSDK as any).default ?? StripeSDK;
import { getDb } from './db';
import { sql } from 'drizzle-orm';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY?.trim();
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID?.trim();

const stripe = STRIPE_SECRET_KEY
  ? new StripeCtor(STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    })
  : null;

if (!stripe) {
  console.warn('[Stripe] STRIPE_SECRET_KEY is missing -> Stripe disabled (local dev mode).');
}
function unwrapRows(result: any): any[] {
  if (!result) return [];

  // Cas mysql2 classique : [rows, fields]
  if (Array.isArray(result)) {
    if (Array.isArray(result[0])) {
      return result[0];
    }

    // Cas tuple mysql2 sans rows
    if (
      result.length === 2 &&
      Array.isArray(result[1]) &&
      result[1].length > 0 &&
      typeof result[1][0] === "object" &&
      result[1][0] !== null &&
      "name" in result[1][0]
    ) {
      return [];
    }

    if (result.length === 0) return [];

    if (typeof result[0] === "object" && result[0] !== null) {
      return result as any[];
    }

    return [];
  }

  if (typeof result === "object") {
    const anyRes: any = result;

    if (Array.isArray(anyRes.rows)) return anyRes.rows;
    if (Array.isArray(anyRes[0])) return anyRes[0];
    if (Array.isArray(anyRes.result)) return anyRes.result;
  }

  return [];
}

function toStripeDate(value: unknown): Date {
  if (value instanceof Date) return value;

  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 1000);
  }

  if (typeof value === "string" && value.trim()) {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      return new Date(asNumber * 1000);
    }

    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) {
      return asDate;
    }
  }

  throw new Error(`Invalid Stripe date value: ${String(value)}`);
}
/**
 * Créer une session de checkout Stripe
 */
export async function createCheckoutSession(
  userId: number,
  userEmail: string,
  userName: string,
  successUrl: string,
  cancelUrl: string
) {
  if (!stripe) {
    throw new Error("Stripe is disabled: missing STRIPE_SECRET_KEY");
  }

  if (!STRIPE_PRICE_ID) {
    throw new Error("Stripe is misconfigured: missing STRIPE_PRICE_ID");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: userEmail,
      client_reference_id: userId.toString(),
      metadata: {
        user_id: userId.toString(),
        customer_email: userEmail,
        customer_name: userName,
      },
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });

    return session.url;
  } catch (error) {
    console.error("[Stripe] Error creating checkout session:", error);
    throw error;
  }
}

/**
 * Récupérer ou créer une subscription
 */
export async function getOrCreateSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.execute(
    sql`
      SELECT *
      FROM subscriptions
      WHERE userId = ${userId}
        AND status IN ('active', 'trialing')
      ORDER BY currentPeriodEnd DESC
      LIMIT 1
    `
  );

  const rows = unwrapRows(result);
  return rows[0] ?? null;
}

/**
 * Vérifier si un utilisateur a une adhésion active
 */
export async function hasActiveSubscription(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.execute(
    sql`
      SELECT id
      FROM subscriptions
      WHERE userId = ${userId}
        AND status IN ('active', 'trialing')
        AND currentPeriodEnd > NOW()
      LIMIT 1
    `
  );

  const rows = unwrapRows(result);
  return rows.length > 0;
}

/**
 * Créer une subscription en base de données
 */
export async function createSubscription(
  userId: number,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1) Historique abonnement Stripe
  await db.execute(
    sql`
      INSERT INTO subscriptions (
        userId,
        stripeCustomerId,
        stripeSubscriptionId,
        status,
        currentPeriodStart,
        currentPeriodEnd
      )
      VALUES (
        ${userId},
        ${stripeCustomerId},
        ${stripeSubscriptionId},
        'active',
        ${currentPeriodStart},
        ${currentPeriodEnd}
      )
      ON DUPLICATE KEY UPDATE
        stripeCustomerId = VALUES(stripeCustomerId),
        status = 'active',
        currentPeriodStart = VALUES(currentPeriodStart),
        currentPeriodEnd = VALUES(currentPeriodEnd)
    `
  );

  // 2) Source de vérité legacy encore utilisée par resolveIsPremium()
  await db.execute(
    sql`
      INSERT INTO user_entitlements (
        userId,
        premium,
        premiumSince,
        premiumUntil
      )
      VALUES (
        ${userId},
        1,
        ${currentPeriodStart},
        ${currentPeriodEnd}
      )
      ON DUPLICATE KEY UPDATE
        premium = 1,
        premiumSince = VALUES(premiumSince),
        premiumUntil = VALUES(premiumUntil)
    `
  );

  // 3) Source de vérité canonique cible : entitlements
  await db.execute(
    sql`
      INSERT INTO entitlements (
        userId,
        type,
        isActive,
        startsAt,
        endsAt
      )
      VALUES (
        ${userId},
        'PREMIUM',
        1,
        ${currentPeriodStart},
        ${currentPeriodEnd}
      )
      ON DUPLICATE KEY UPDATE
        isActive = 1,
        startsAt = VALUES(startsAt),
        endsAt = VALUES(endsAt)
    `
  );
}

/**
 * Mettre à jour une subscription
 */
export async function updateSubscription(
  stripeSubscriptionId: string,
  status: string,
  currentPeriodStart?: Date,
  currentPeriodEnd?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const isActivePremium =
    status === "active" ||
    status === "trialing";

  const effectiveStart = isActivePremium ? (currentPeriodStart ?? null) : null;
  const effectiveEnd = isActivePremium ? (currentPeriodEnd ?? null) : new Date();

  // 1) Mettre à jour la table subscriptions
  if (currentPeriodStart && currentPeriodEnd) {
    await db.execute(
      sql`
        UPDATE subscriptions
        SET
          status = ${status},
          currentPeriodStart = ${currentPeriodStart},
          currentPeriodEnd = ${currentPeriodEnd}
        WHERE stripeSubscriptionId = ${stripeSubscriptionId}
      `
    );
  } else {
    await db.execute(
      sql`
        UPDATE subscriptions
        SET status = ${status}
        WHERE stripeSubscriptionId = ${stripeSubscriptionId}
      `
    );
  }

  // 2) Retrouver le userId lié à cette subscription
  const result = await db.execute(
    sql`
      SELECT userId
      FROM subscriptions
      WHERE stripeSubscriptionId = ${stripeSubscriptionId}
      LIMIT 1
    `
  );

  const rows = unwrapRows(result);
  const userId = rows[0]?.userId ? Number(rows[0].userId) : null;

  if (!userId) {
    return;
  }

  // 3) Synchroniser user_entitlements (legacy compat)
  await db.execute(
    sql`
      INSERT INTO user_entitlements (
        userId,
        premium,
        premiumSince,
        premiumUntil
      )
      VALUES (
        ${userId},
        ${isActivePremium ? 1 : 0},
        ${effectiveStart},
        ${effectiveEnd}
      )
      ON DUPLICATE KEY UPDATE
        premium = VALUES(premium),
        premiumSince = VALUES(premiumSince),
        premiumUntil = VALUES(premiumUntil)
    `
  );

  // 4) Synchroniser entitlements (source canonique)
  await db.execute(
    sql`
      INSERT INTO entitlements (
        userId,
        type,
        isActive,
        startsAt,
        endsAt
      )
      VALUES (
        ${userId},
        'PREMIUM',
        ${isActivePremium ? 1 : 0},
        ${effectiveStart},
        ${effectiveEnd}
      )
      ON DUPLICATE KEY UPDATE
        isActive = VALUES(isActive),
        startsAt = VALUES(startsAt),
        endsAt = VALUES(endsAt)
    `
  );
}

async function cancelSubscriptionInDatabase(stripeSubscriptionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();

  // 1) Marquer la subscription comme annulée en base
  await db.execute(
    sql`
      UPDATE subscriptions
      SET
        status = 'canceled',
        canceledAt = ${now}
      WHERE stripeSubscriptionId = ${stripeSubscriptionId}
    `
  );

  // 2) Retrouver le userId lié à cette subscription
  const result = await db.execute(
    sql`
      SELECT userId
      FROM subscriptions
      WHERE stripeSubscriptionId = ${stripeSubscriptionId}
      LIMIT 1
    `
  );

  const rows = unwrapRows(result);
  const userId = rows[0]?.userId ? Number(rows[0].userId) : null;

  if (!userId) {
    return;
  }

  // 3) Désactiver la source legacy encore utilisée par resolveIsPremium()
  await db.execute(
    sql`
      INSERT INTO user_entitlements (
        userId,
        premium,
        premiumSince,
        premiumUntil
      )
      VALUES (
        ${userId},
        0,
        null,
        ${now}
      )
      ON DUPLICATE KEY UPDATE
        premium = 0,
        premiumSince = null,
        premiumUntil = ${now}
    `
  );

  // 4) Désactiver la source canonique cible
  await db.execute(
    sql`
      INSERT INTO entitlements (
        userId,
        type,
        isActive,
        startsAt,
        endsAt
      )
      VALUES (
        ${userId},
        'PREMIUM',
        0,
        null,
        ${now}
      )
      ON DUPLICATE KEY UPDATE
        isActive = 0,
        startsAt = null,
        endsAt = ${now}
    `
  );
}

/**
 * Annuler une subscription Stripe + synchroniser la base locale
 */
export async function cancelSubscription(stripeSubscriptionId: string) {
  if (!stripe) {
    throw new Error("Stripe is disabled: missing STRIPE_SECRET_KEY");
  }

  try {
    await stripe.subscriptions.cancel(stripeSubscriptionId);
  } catch (error: any) {
    // Si Stripe répond que la subscription n'existe plus ou est déjà annulée,
    // on continue quand même la synchro locale.
    const code = String(error?.code ?? "");
    const statusCode = Number(error?.statusCode ?? 0);

    const isAlreadyGone =
      code === "resource_missing" ||
      statusCode === 404;

    if (!isAlreadyGone) {
      console.error("[Stripe] Error canceling subscription on Stripe:", error);
      throw error;
    }
  }

  await cancelSubscriptionInDatabase(stripeSubscriptionId);
}

/**
 * Gérer l'événement checkout.session.completed
 */
export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = parseInt(session.client_reference_id || '0');
    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    if (!userId || !stripeCustomerId || !stripeSubscriptionId) {
      console.error('[Stripe] Missing required fields in checkout session');
      return;
    }

    // Récupérer les détails de la subscription
    if (!stripe) {
  throw new Error("Stripe not configured (missing STRIPE_SECRET_KEY).");
}
const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    await createSubscription(
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      toStripeDate((subscription as any).current_period_start),
      toStripeDate((subscription as any).current_period_end)
    );

    console.log(`[Stripe] Subscription created for user ${userId}`);
  } catch (error) {
    console.error('[Stripe] Error handling checkout.session.completed:', error);
    throw error;
  }
}

/**
 * Gérer l'événement customer.subscription.updated
 */
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    await updateSubscription(
      subscription.id,
      subscription.status,
      toStripeDate((subscription as any).current_period_start),
      toStripeDate((subscription as any).current_period_end)
    );

    console.log(`[Stripe] Subscription ${subscription.id} updated to ${subscription.status}`);
  } catch (error) {
    console.error('[Stripe] Error handling customer.subscription.updated:', error);
    throw error;
  }
}

/**
 * Gérer l'événement customer.subscription.deleted
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await cancelSubscriptionInDatabase(subscription.id);
    console.log(`[Stripe] Subscription ${subscription.id} deleted`);
  } catch (error) {
    console.error("[Stripe] Error handling customer.subscription.deleted:", error);
    throw error;
  }
}
