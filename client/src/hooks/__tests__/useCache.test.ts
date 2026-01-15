import { describe, it, expect, vi, beforeEach } from "vitest";
import { globalCache } from "../useCache";

describe("useCache Hook", () => {
  beforeEach(() => {
    globalCache.clear();
  });

  describe("globalCache", () => {
    it("should set and get data", () => {
      const data = { id: 1, name: "Test" };
      globalCache.set("test-key", data);
      expect(globalCache.get("test-key")).toEqual(data);
    });

    it("should return null for expired cache", () => {
      const data = { id: 1, name: "Test" };
      globalCache.set("test-key", data, 100); // 100ms TTL
      expect(globalCache.get("test-key")).toEqual(data);
      
      // Simulate expiration
      vi.useFakeTimers();
      vi.advanceTimersByTime(150);
      expect(globalCache.get("test-key")).toBeNull();
      vi.useRealTimers();
    });

    it("should check if key exists", () => {
      globalCache.set("test-key", { data: "value" });
      expect(globalCache.has("test-key")).toBe(true);
      expect(globalCache.has("non-existent")).toBe(false);
    });

    it("should delete specific key", () => {
      globalCache.set("test-key", { data: "value" });
      globalCache.delete("test-key");
      expect(globalCache.get("test-key")).toBeNull();
    });

    it("should clear all cache", () => {
      globalCache.set("key1", { data: 1 });
      globalCache.set("key2", { data: 2 });
      globalCache.clear();
      expect(globalCache.get("key1")).toBeNull();
      expect(globalCache.get("key2")).toBeNull();
    });

    it("should provide cache stats", () => {
      globalCache.set("key1", { data: 1 });
      globalCache.set("key2", { data: 2 });
      const stats = globalCache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.entries.length).toBe(2);
    });
  });
});
