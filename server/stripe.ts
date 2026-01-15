import Stripe from 'stripe';
import { getDb } from './db';
import { sql } from 'drizzle-orm';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY?.trim();

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    })
  : null;

if (!stripe) {
  console.warn('[Stripe] STRIPE_SECRET_KEY is missing -> Stripe disabled (local dev mode).');
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
    throw new Error('Stripe is disabled: missing STRIPE_SECRET_KEY');
  }

  try {


    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: userEmail,
      client_reference_id: userId.toString(),
      metadata: {
        user_id: userId.toString(),
        customer_email: userEmail,
        customer_name: userName,
      },
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID || 'price_1234567890', // À configurer
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });

    return session.url;
  } catch (error) {
    console.error('[Stripe] Error creating checkout session:', error);
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
    sql`SELECT * FROM subscriptions WHERE userId = ${userId} AND status = 'active' LIMIT 1`
  );

  return result[0] || null;
}

/**
 * Vérifier si un utilisateur a une adhésion active
 */
export async function hasActiveSubscription(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.execute(
    sql`SELECT id FROM subscriptions WHERE userId = ${userId} AND status = 'active' AND currentPeriodEnd > NOW() LIMIT 1`
  );

  return result.length > 0;
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
  if (!db) throw new Error('Database not available');

  await db.execute(
    sql`INSERT INTO subscriptions (userId, stripeCustomerId, stripeSubscriptionId, status, currentPeriodStart, currentPeriodEnd)
        VALUES (${userId}, ${stripeCustomerId}, ${stripeSubscriptionId}, 'active', ${currentPeriodStart}, ${currentPeriodEnd})`
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
  if (!db) throw new Error('Database not available');

  let query = sql`UPDATE subscriptions SET status = ${status}`;

  if (currentPeriodStart && currentPeriodEnd) {
    query = sql`UPDATE subscriptions SET status = ${status}, currentPeriodStart = ${currentPeriodStart}, currentPeriodEnd = ${currentPeriodEnd}`;
  }

  query = sql`${query} WHERE stripeSubscriptionId = ${stripeSubscriptionId}`;

  await db.execute(query);
}

/**
 * Annuler une subscription
 */
export async function cancelSubscription(stripeSubscriptionId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.execute(
    sql`UPDATE subscriptions SET status = 'canceled', canceledAt = NOW() WHERE stripeSubscriptionId = ${stripeSubscriptionId}`
  );
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
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    await createSubscription(
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      new Date((subscription as any).current_period_start * 1000),
      new Date((subscription as any).current_period_end * 1000)
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
      new Date((subscription as any).current_period_start * 1000),
      new Date((subscription as any).current_period_end * 1000)
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
    await cancelSubscription(subscription.id);
    console.log(`[Stripe] Subscription ${subscription.id} deleted`);
  } catch (error) {
    console.error('[Stripe] Error handling customer.subscription.deleted:', error);
    throw error;
  }
}
