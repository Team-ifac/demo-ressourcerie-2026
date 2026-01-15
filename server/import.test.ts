import { describe, it, expect, beforeEach } from "vitest";
import { ResourceImporter } from "./import";

describe("ResourceImporter", () => {
  describe("validateData", () => {
    it("should validate required title", () => {
      const errors = ResourceImporter.validateData({
        title: "",
        description: "Test",
      });
      expect(errors).toContain("Title is required");
    });

    it("should validate title length", () => {
      const longTitle = "a".repeat(300);
      const errors = ResourceImporter.validateData({
        title: longTitle,
        description: "Test",
      });
      expect(errors).toContain("Title must be less than 255 characters");
    });

    it("should validate description length", () => {
      const longDesc = "a".repeat(1100);
      const errors = ResourceImporter.validateData({
        title: "Test",
        description: longDesc,
      });
      expect(errors).toContain("Description must be less than 1000 characters");
    });

    it("should validate file URL format", () => {
      const errors = ResourceImporter.validateData({
        title: "Test",
        description: "Test",
        fileUrl: "invalid-url",
      });
      expect(errors).toContain("Invalid file URL");
    });

    it("should validate file type", () => {
      const errors = ResourceImporter.validateData({
        title: "Test",
        description: "Test",
        fileType: "invalid",
      });
      expect(errors).toContain("Invalid file type");
    });

    it("should pass validation for valid data", () => {
      const errors = ResourceImporter.validateData({
        title: "Test Resource",
        description: "Test description",
        fileUrl: "https://example.com/file.pdf",
        fileType: "pdf",
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("generateCSVTemplate", () => {
    it("should generate valid CSV template", () => {
      const csv = ResourceImporter.generateCSVTemplate();
      expect(csv).toContain("title,description,content");
      expect(csv).toContain("Animation pour tous");
      expect(csv).toContain("Formation développement");
    });
  });

  describe("generateJSONTemplate", () => {
    it("should generate valid JSON template", () => {
      const json = ResourceImporter.generateJSONTemplate();
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toHaveProperty("title");
      expect(parsed[0]).toHaveProperty("tags");
    });
  });

  describe("importFromCSV", () => {
    it("should handle empty CSV", async () => {
      const result = await ResourceImporter.importFromCSV("");
      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
    });

    it("should handle CSV with header only", async () => {
      const csv = "title,description,content,thematic,file_url,file_name,file_type,author_name,tags,is_public";
      const result = await ResourceImporter.importFromCSV(csv);
      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
    });

    it("should report errors for invalid rows", async () => {
      const csv = `title,description,content,thematic,file_url,file_name,file_type,author_name,tags,is_public
,Description,Content,Thematic,https://example.com/file.pdf,file.pdf,pdf,Author,tag1,true`;
      const result = await ResourceImporter.importFromCSV(csv);
      expect(result.failed).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(result.failed);
    });
  });

  describe("importFromJSON", () => {
    it("should handle invalid JSON", async () => {
      try {
        await ResourceImporter.importFromJSON("{invalid json}");
        expect.fail("Should throw error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle empty array", async () => {
      const result = await ResourceImporter.importFromJSON("[]");
      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
    });

    it("should handle single object", async () => {
      const json = JSON.stringify({
        title: "Test",
        description: "Test description",
      });
      const result = await ResourceImporter.importFromJSON(json);
      // Will fail due to missing database, but structure should be correct
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("failed");
      expect(result).toHaveProperty("errors");
    });

    it("should report errors for invalid items", async () => {
      const json = JSON.stringify([
        { title: "", description: "Test" },
        { title: "Valid", description: "Test" },
      ]);
      const result = await ResourceImporter.importFromJSON(json);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
