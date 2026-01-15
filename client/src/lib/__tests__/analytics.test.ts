import { describe, it, expect, beforeEach, vi } from "vitest";
import { analytics } from "../analytics";

describe("Analytics Service", () => {
  beforeEach(() => {
    analytics.reset();
  });

  it("should track resource view", () => {
    analytics.trackResourceView("res-1", "Test Resource", "Education");
    const events = analytics.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe("view_resource");
    expect(events[0].params?.resource_id).toBe("res-1");
  });

  it("should track resource download", () => {
    analytics.trackResourceDownload("res-1", "Test Resource", "pdf");
    const events = analytics.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe("download_resource");
    expect(events[0].params?.file_type).toBe("pdf");
  });

  it("should track resource share", () => {
    analytics.trackResourceShare("res-1", "Test Resource", "twitter");
    const events = analytics.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe("share_resource");
    expect(events[0].params?.platform).toBe("twitter");
  });

  it("should track comment added", () => {
    analytics.trackCommentAdded("res-1", "Test Resource");
    const events = analytics.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe("add_comment");
  });

  it("should track resource submission", () => {
    analytics.trackResourceSubmission("New Resource", "Education");
    const events = analytics.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe("submit_resource");
  });

  it("should track forum participation", () => {
    analytics.trackForumParticipation("Topic Title", "Questions");
    const events = analytics.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe("forum_participation");
  });

  it("should track collection creation", () => {
    analytics.trackCollectionCreation("My Collection", 5);
    const events = analytics.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe("create_collection");
    expect(events[0].params?.resource_count).toBe(5);
  });

  it("should track search", () => {
    analytics.trackSearch("animation", 15, { category: "education" });
    const events = analytics.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe("search");
    expect(events[0].params?.search_term).toBe("animation");
    expect(events[0].params?.result_count).toBe(15);
  });

  it("should track engagement", () => {
    analytics.trackEngagement("reading", 300);
    const events = analytics.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe("engagement");
    expect(events[0].params?.duration_seconds).toBe(300);
  });

  it("should track PWA install", () => {
    analytics.trackPWAInstall();
    const events = analytics.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe("pwa_install");
  });

  it("should track error", () => {
    analytics.trackError("NetworkError", "Failed to fetch data", { url: "/api/test" });
    const events = analytics.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe("error");
    expect(events[0].params?.error_name).toBe("NetworkError");
  });

  it("should export events data", () => {
    analytics.trackResourceView("res-1", "Test Resource");
    const exported = analytics.export();
    expect(exported.events).toHaveLength(1);
    expect(exported.measurementId).toBeDefined();
    expect(exported.timestamp).toBeDefined();
  });

  it("should reset events", () => {
    analytics.trackResourceView("res-1", "Test Resource");
    expect(analytics.getEvents()).toHaveLength(1);
    analytics.reset();
    expect(analytics.getEvents()).toHaveLength(0);
  });
});
