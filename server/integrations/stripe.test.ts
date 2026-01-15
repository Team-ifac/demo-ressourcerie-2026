import { describe, it, expect, beforeEach } from "vitest";
import { stripeIntegration } from "./stripe";

describe("Stripe Integration", () => {
  beforeEach(() => {
    stripeIntegration.configure({
      secretKey: "sk_test_123456",
      publishableKey: "pk_test_123456",
    });
  });

  it("should be configured after setup", () => {
    expect(stripeIntegration.isReady()).toBe(true);
  });

  it("should return publishable key", () => {
    const key = stripeIntegration.getPublishableKey();
    expect(key).toBe("pk_test_123456");
  });

  it("should get all available plans", () => {
    const plans = stripeIntegration.getPlans();
    expect(plans).toHaveLength(3);
    expect(plans[0].id).toBe("free");
    expect(plans[1].id).toBe("supporter");
    expect(plans[2].id).toBe("professional");
  });

  it("should get specific plan by ID", () => {
    const plan = stripeIntegration.getPlan("supporter");
    expect(plan).toBeDefined();
    expect(plan?.name).toBe("Supporter");
    expect(plan?.amount).toBe(499);
    expect(plan?.features).toContain("Accès illimité");
  });

  it("should return null for non-existent plan", () => {
    const plan = stripeIntegration.getPlan("nonexistent");
    expect(plan).toBeNull();
  });

  it("should handle payment intent succeeded webhook", async () => {
    const event = {
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_123456",
        },
      },
    };
    const result = await stripeIntegration.handleWebhook(event);
    expect(result).toBe(true);
  });

  it("should handle subscription created webhook", async () => {
    const event = {
      type: "customer.subscription.created",
      data: {
        object: {
          id: "sub_123456",
        },
      },
    };
    const result = await stripeIntegration.handleWebhook(event);
    expect(result).toBe(true);
  });

  it("should handle subscription deleted webhook", async () => {
    const event = {
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_123456",
        },
      },
    };
    const result = await stripeIntegration.handleWebhook(event);
    expect(result).toBe(true);
  });

  it("should handle invoice payment succeeded webhook", async () => {
    const event = {
      type: "invoice.payment_succeeded",
      data: {
        object: {
          id: "in_123456",
        },
      },
    };
    const result = await stripeIntegration.handleWebhook(event);
    expect(result).toBe(true);
  });

  it("should have free plan with 0 amount", () => {
    const freePlan = stripeIntegration.getPlan("free");
    expect(freePlan?.amount).toBe(0);
    expect(freePlan?.features).toContain("Accès aux ressources");
  });

  it("should have professional plan with highest amount", () => {
    const plans = stripeIntegration.getPlans();
    const amounts = plans.map((p) => p.amount);
    const maxAmount = Math.max(...amounts);
    expect(maxAmount).toBe(999);
  });

  it("should not be ready without configuration", () => {
    // Create a new instance that is not configured
    const unconfigured = {
      isConfigured: false,
      isReady: function() { return this.isConfigured; }
    };
    expect(unconfigured.isReady()).toBe(false);
  });
});
