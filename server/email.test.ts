import { describe, it, expect } from "vitest";
import {
  sendEmail,
  sendCommentNotification,
  sendForumReplyNotification,
  sendResourceApprovedEmail,
  sendResourceRejectedEmail,
  sendWelcomeEmail,
  sendCollectionSharedEmail,
  sendDailyDigest,
} from "./email";

describe("Email Service", () => {
  it("should send email with template", async () => {
    const result = await sendEmail({
      to: "user@example.com",
      template: "welcome_email",
      data: {
        name: "John",
        platformUrl: "https://ressourcerie-ifac.fr",
      },
    });
    expect(result).toBe(true);
  });

  it("should send comment notification", async () => {
    const result = await sendCommentNotification(
      "user@example.com",
      "Ma ressource",
      "Alice",
      "Excellente ressource!",
      "https://ressourcerie-ifac.fr/resources/123"
    );
    expect(result).toBe(true);
  });

  it("should send forum reply notification", async () => {
    const result = await sendForumReplyNotification(
      "user@example.com",
      "Sujet du forum",
      "Bob",
      "Bonne question!",
      "https://ressourcerie-ifac.fr/forum/123"
    );
    expect(result).toBe(true);
  });

  it("should send resource approved email", async () => {
    const result = await sendResourceApprovedEmail(
      "user@example.com",
      "Ma ressource",
      "https://ressourcerie-ifac.fr/resources/123"
    );
    expect(result).toBe(true);
  });

  it("should send resource rejected email", async () => {
    const result = await sendResourceRejectedEmail(
      "user@example.com",
      "Ma ressource",
      "Contenu incomplet"
    );
    expect(result).toBe(true);
  });

  it("should send welcome email", async () => {
    const result = await sendWelcomeEmail(
      "user@example.com",
      "John",
      "https://ressourcerie-ifac.fr"
    );
    expect(result).toBe(true);
  });

  it("should send collection shared email", async () => {
    const result = await sendCollectionSharedEmail(
      "user@example.com",
      "Ma collection",
      "Une collection de ressources intéressantes",
      "Alice",
      "https://ressourcerie-ifac.fr/collections/123"
    );
    expect(result).toBe(true);
  });

  it("should send daily digest", async () => {
    const result = await sendDailyDigest(
      "user@example.com",
      "<ul><li>Ressource 1</li></ul>",
      "<ul><li>Discussion 1</li></ul>",
      "https://ressourcerie-ifac.fr"
    );
    expect(result).toBe(true);
  });

  it("should handle invalid template", async () => {
    const result = await sendEmail({
      to: "user@example.com",
      template: "invalid_template",
      data: {},
    });
    expect(result).toBe(false);
  });
});
