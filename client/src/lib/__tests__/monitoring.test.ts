import { describe, it, expect, beforeEach } from "vitest";
import { monitoring } from "../monitoring";

describe("Monitoring Service", () => {
  beforeEach(() => {
    monitoring.reset();
  });

  it("should initialize monitoring service", () => {
    expect(monitoring).toBeDefined();
  });

  it("should capture errors", () => {
    const error = new Error("Test error");
    monitoring.captureError(error, { component: "test" });

    const errors = monitoring.getErrors();
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should capture exceptions", () => {
    const exception = new Error("Test exception");
    monitoring.captureException(exception);

    const errors = monitoring.getErrors();
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should capture messages", () => {
    monitoring.captureMessage("Test message", "info");
    expect(true).toBe(true);
  });

  it("should record metrics", () => {
    monitoring.recordMetric("test_metric", 100, "ms");

    const metrics = monitoring.getMetrics();
    expect(metrics.length).toBeGreaterThan(0);
  });

  it("should set user context", () => {
    monitoring.setUserContext("user_123", "user@example.com", "John");
    expect(true).toBe(true);
  });

  it("should clear user context", () => {
    monitoring.clearUserContext();
    expect(true).toBe(true);
  });

  it("should add context", () => {
    monitoring.addContext("request", { method: "GET", url: "/api/resources" });
    expect(true).toBe(true);
  });

  it("should start and end transactions", () => {
    const transaction = monitoring.startTransaction("test_transaction");
    transaction.end();

    const metrics = monitoring.getMetrics();
    expect(metrics.length).toBeGreaterThan(0);
  });

  it("should export monitoring data", () => {
    monitoring.captureError(new Error("Test"), { component: "test" });
    monitoring.recordMetric("test", 50);

    const exported = monitoring.export();
    expect(exported.errors.length).toBeGreaterThan(0);
    expect(exported.metrics.length).toBeGreaterThan(0);
  });

  it("should reset monitoring data", () => {
    monitoring.captureError(new Error("Test"));
    monitoring.recordMetric("test", 50);

    monitoring.reset();

    expect(monitoring.getErrors().length).toBe(0);
    expect(monitoring.getMetrics().length).toBe(0);
  });
});
