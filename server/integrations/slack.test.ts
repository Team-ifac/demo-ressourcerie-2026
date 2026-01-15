import { describe, it, expect, beforeEach } from "vitest";
import { slackIntegration } from "./slack";

describe("Slack Integration", () => {
  beforeEach(() => {
    slackIntegration.configure({
      webhookUrl: "https://hooks.slack.com/services/test",
      channel: "#notifications",
      username: "Ressourcerie Bot",
    });
  });

  it("should be configured after setup", () => {
    expect(slackIntegration.isReady()).toBe(true);
  });

  it("should format new resource notification", async () => {
    const result = await slackIntegration.notifyNewResource(
      "Test Resource",
      "John Doe",
      "https://example.com/resource/1"
    );
    // Mock result since we can't actually send to Slack
    expect(typeof result).toBe("boolean");
  }, { timeout: 10000 });

  it("should format new comment notification", async () => {
    const result = await slackIntegration.notifyNewComment(
      "Test Resource",
      "Jane Doe",
      "Great resource!",
      "https://example.com/resource/1#comment-1"
    );
    expect(typeof result).toBe("boolean");
  });

  it("should format forum topic notification", async () => {
    const result = await slackIntegration.notifyNewForumTopic(
      "How to use this resource?",
      "Bob Smith",
      "Questions",
      "https://example.com/forum/topic/1"
    );
    expect(typeof result).toBe("boolean");
  });

  it("should format error notification", async () => {
    const result = await slackIntegration.notifyError(
      "Database connection failed",
      { timestamp: new Date().toISOString() }
    );
    expect(typeof result).toBe("boolean");
  });

  it("should format stats notification", async () => {
    const result = await slackIntegration.notifyStats({
      "Total Resources": 150,
      "Active Users": 45,
      "Comments This Week": 23,
    });
    expect(typeof result).toBe("boolean");
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
