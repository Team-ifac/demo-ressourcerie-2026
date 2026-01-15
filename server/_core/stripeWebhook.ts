import Stripe from 'stripe';
import express, { Express, Request, Response } from 'express';
import * as stripeService from '../stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Register Stripe webhook endpoint
 * Must be called BEFORE express.json() middleware
 */
export function registerStripeWebhook(app: Express) {
  app.post(
    '/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      const sig = req.headers['stripe-signature'] as string;

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (error) {
        console.error('[Stripe Webhook] Signature verification failed:', error);
        return res.status(400).send(`Webhook Error: ${error}`);
      }

      // Handle test events
      if (event.id.startsWith('evt_test_')) {
        console.log('[Stripe Webhook] Test event detected, returning verification response');
        return res.json({ verified: true });
      }

      try {
        switch (event.type) {
          case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            await stripeService.handleCheckoutSessionCompleted(session);
            break;

          case 'customer.subscription.updated':
            const updatedSubscription = event.data.object as Stripe.Subscription;
            await stripeService.handleSubscriptionUpdated(updatedSubscription);
            break;

          case 'customer.subscription.deleted':
            const deletedSubscription = event.data.object as Stripe.Subscription;
            await stripeService.handleSubscriptionDeleted(deletedSubscription);
            break;

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
      } catch (error) {
        console.error('[Stripe Webhook] Error processing event:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  );
}
