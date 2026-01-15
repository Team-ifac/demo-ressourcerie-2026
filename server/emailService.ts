import sgMail from "@sendgrid/mail";
import { notifyOwner } from "./_core/notification";

/**
 * Helpers
 */
function getAppUrl() {
  return (process.env.APP_URL || "http://localhost:3000").trim();
}

function getKey(): string {
  return (process.env.SENDGRID_API_KEY || "").trim();
}

function getFrom(): string {
  return (process.env.SENDGRID_FROM_EMAIL || "").trim();
}

function safeFromEmail() {
  return getFrom() || "noreply@ressourcerie-ifac.fr";
}

function maskKey(key: string) {
  if (!key) return "MISSING";
  const start = key.slice(0, 6); // ex: SG.xxxx
  const end = key.slice(-4);
  return `${start}...${end} (len=${key.length})`;
}

/**
 * On considère SendGrid "ready" si :
 * - clé non vide, commence par SG., longueur raisonnable
 * - from non vide
 *
 * (On TRIM pour éviter le piège classique : " SG...." ou espaces en fin de ligne)
 */
function sendGridReady() {
  const key = getKey();
  const from = getFrom();

  const keyLooksValid = key.startsWith("SG.") && key.length >= 40;
  const fromLooksValid = from.length > 3 && from.includes("@");

  return keyLooksValid && fromLooksValid;
}

function initSendGrid() {
  sgMail.setApiKey(getKey());
}

/**
 * Logs explicites (sans dévoiler la clé)
 */
function logNotConfigured(to: string, subject: string, link?: string) {
  console.warn("[Email] SendGrid not configured -> email NOT sent.");
  console.warn(`[Email] Diagnostic: KEY=${maskKey(getKey())} | FROM=${getFrom() || "MISSING"} | APP_URL=${getAppUrl()}`);
  console.warn(`[Email] To: ${to}`);
  console.warn(`[Email] Subject: ${subject}`);
  if (link) console.warn(`[Email] Link: ${link}`);
  console.warn(
    "[Email] Fix: check .env has NO SPACES around '=' and the key starts with SG. Then restart pnpm dev."
  );
}

function logSendGridError(prefix: string, err: any) {
  const status = err?.response?.statusCode;
  const body = err?.response?.body;
  console.error(prefix, err?.message || err);
  if (status) console.error("[Email] SendGrid status:", status);
  if (body) console.error("[Email] SendGrid body:", JSON.stringify(body, null, 2));
}

/**
 * Envoyer un email de confirmation d'adhésion
 */
export async function sendSubscriptionConfirmationEmail(
  email: string,
  userName: string,
  userId: number
): Promise<void> {
  const subject = "Bienvenue sur la Ressourcerie IFAC - Adhésion confirmée";

  try {
    if (!sendGridReady()) {
      logNotConfigured(email, subject, "https://ressourcerie-ifac.fr/resources");
      return;
    }

    initSendGrid();

    const msg = {
      to: email,
      from: safeFromEmail(),
      subject,
      html: `
        <p>Bonjour ${userName},</p>
        <p>Votre adhésion à la Ressourcerie IFAC a été confirmée avec succès.</p>
        <p><a href="https://ressourcerie-ifac.fr/resources">Commencer l'exploration</a></p>
      `,
    };

    await sgMail.send(msg);
    console.log(`[Email] Subscription confirmation sent to ${email}`);

    await notifyOwner({
      title: `Nouvelle adhésion - ${userName}`,
      content: `Un nouvel utilisateur (ID: ${userId}) vient de s'abonner avec l'email: ${email}`,
    });
  } catch (error) {
    logSendGridError("[Email] Error sending subscription confirmation:", error);
    throw error;
  }
}

/**
 * Envoyer un email de renouvellement d'adhésion
 */
export async function sendSubscriptionRenewalEmail(
  email: string,
  userName: string,
  userId: number
): Promise<void> {
  const subject = "Votre adhésion à la Ressourcerie IFAC a été renouvelée";

  try {
    if (!sendGridReady()) {
      logNotConfigured(email, subject);
      return;
    }

    initSendGrid();

    await sgMail.send({
      to: email,
      from: safeFromEmail(),
      subject,
      html: `<p>Bonjour ${userName}, votre adhésion a été renouvelée.</p>`,
    });

    console.log(`[Email] Subscription renewal email sent to ${email}`);

    await notifyOwner({
      title: `Renouvellement d'adhésion - ${userName}`,
      content: `L'utilisateur (ID: ${userId}) vient de renouveler son adhésion (email: ${email})`,
    });
  } catch (error) {
    logSendGridError("[Email] Error sending subscription renewal email:", error);
    throw error;
  }
}

/**
 * Envoyer un email d'échec de paiement
 */
export async function sendPaymentFailedEmail(
  email: string,
  userName: string,
  userId: number
): Promise<void> {
  const subject = "Problème de paiement - Action requise";

  try {
    if (!sendGridReady()) {
      logNotConfigured(email, subject);
      return;
    }

    initSendGrid();

    await sgMail.send({
      to: email,
      from: safeFromEmail(),
      subject,
      html: `<p>Bonjour ${userName}, nous avons rencontré un problème de paiement.</p>`,
    });

    console.log(`[Email] Payment failed email sent to ${email}`);

    await notifyOwner({
      title: `⚠️ Échec de paiement - ${userName}`,
      content: `Le paiement de l'utilisateur (ID: ${userId}) a échoué (email: ${email}).`,
    });
  } catch (error) {
    logSendGridError("[Email] Error sending payment failed email:", error);
    throw error;
  }
}

/**
 * Envoyer un email d'annulation d'adhésion
 */
export async function sendSubscriptionCancelledEmail(
  email: string,
  userName: string,
  userId: number
): Promise<void> {
  const subject = "Votre adhésion à la Ressourcerie IFAC a été annulée";

  try {
    if (!sendGridReady()) {
      logNotConfigured(email, subject);
      return;
    }

    initSendGrid();

    await sgMail.send({
      to: email,
      from: safeFromEmail(),
      subject,
      html: `<p>Bonjour ${userName}, votre adhésion a été annulée.</p>`,
    });

    console.log(`[Email] Subscription cancelled email sent to ${email}`);

    await notifyOwner({
      title: `Annulation d'adhésion - ${userName}`,
      content: `L'utilisateur (ID: ${userId}) a annulé son adhésion (email: ${email})`,
    });
  } catch (error) {
    logSendGridError("[Email] Error sending subscription cancelled:", error);
    throw error;
  }
}

/**
 * Envoyer un email de vérification d'email
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string
): Promise<void> {
  const subject = "Vérifiez votre adresse email - Ressourcerie IFAC";
  const verificationUrl = `${getAppUrl()}/auth/verify-email?token=${verificationToken}`;

  try {
    if (!sendGridReady()) {
      logNotConfigured(email, subject, verificationUrl);
      return;
    }

    initSendGrid();

    await sgMail.send({
      to: email,
      from: safeFromEmail(),
      subject,
      html: `<p>Clique ici pour vérifier ton email :</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
    });

    console.log(`[Email] Verification email sent to ${email}`);
  } catch (error) {
    logSendGridError("[Email] Failed to send verification email:", error);
    throw error;
  }
}

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const subject = "Réinitialiser votre mot de passe - Ressourcerie IFAC";
  const resetUrl = `${getAppUrl()}/auth/reset-password?token=${resetToken}`;

  try {
    if (!sendGridReady()) {
      logNotConfigured(email, subject, resetUrl);
      return;
    }

    initSendGrid();

    await sgMail.send({
      to: email,
      from: safeFromEmail(),
      subject,
      html: `<p>Lien de réinitialisation :</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });

    console.log(`[Email] Password reset email sent to ${email}`);
  } catch (error) {
    logSendGridError("[Email] Failed to send password reset email:", error);
    throw error;
  }
}
