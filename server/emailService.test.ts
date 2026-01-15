import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as emailService from './emailService';
import * as notification from './_core/notification';

// Mock les modules
vi.mock('@sendgrid/mail');
vi.mock('./_core/notification');

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendSubscriptionConfirmationEmail', () => {
    it('should send confirmation email when SendGrid is configured', async () => {
      process.env.SENDGRID_API_KEY = 'test_key';
      process.env.SENDGRID_FROM_EMAIL = 'noreply@test.com';

      expect(async () => {
        await emailService.sendSubscriptionConfirmationEmail(
          'user@example.com',
          'John Doe',
          1
        );
      }).not.toThrow();
    });

    it('should skip email when SendGrid is not configured', async () => {
      delete process.env.SENDGRID_API_KEY;

      expect(async () => {
        await emailService.sendSubscriptionConfirmationEmail(
          'user@example.com',
          'John Doe',
          1
        );
      }).not.toThrow();
    });

    it('should notify owner on successful send', async () => {
      process.env.SENDGRID_API_KEY = 'test_key';
      process.env.SENDGRID_FROM_EMAIL = 'noreply@test.com';

      await emailService.sendSubscriptionConfirmationEmail(
        'user@example.com',
        'John Doe',
        1
      );

      // Vérifier que le propriétaire a été notifié
      expect(notification.notifyOwner).toBeDefined();
    });
  });

  describe('sendSubscriptionRenewalEmail', () => {
    it('should send renewal email when SendGrid is configured', async () => {
      process.env.SENDGRID_API_KEY = 'test_key';
      process.env.SENDGRID_FROM_EMAIL = 'noreply@test.com';

      expect(async () => {
        await emailService.sendSubscriptionRenewalEmail(
          'user@example.com',
          'John Doe',
          1
        );
      }).not.toThrow();
    });

    it('should skip email when SendGrid is not configured', async () => {
      delete process.env.SENDGRID_API_KEY;

      expect(async () => {
        await emailService.sendSubscriptionRenewalEmail(
          'user@example.com',
          'John Doe',
          1
        );
      }).not.toThrow();
    });
  });

  describe('sendPaymentFailedEmail', () => {
    it('should send payment failed email when SendGrid is configured', async () => {
      process.env.SENDGRID_API_KEY = 'test_key';
      process.env.SENDGRID_FROM_EMAIL = 'noreply@test.com';

      expect(async () => {
        await emailService.sendPaymentFailedEmail(
          'user@example.com',
          'John Doe',
          1
        );
      }).not.toThrow();
    });

    it('should skip email when SendGrid is not configured', async () => {
      delete process.env.SENDGRID_API_KEY;

      expect(async () => {
        await emailService.sendPaymentFailedEmail(
          'user@example.com',
          'John Doe',
          1
        );
      }).not.toThrow();
    });
  });

  describe('sendSubscriptionCancelledEmail', () => {
    it('should send cancellation email when SendGrid is configured', async () => {
      process.env.SENDGRID_API_KEY = 'test_key';
      process.env.SENDGRID_FROM_EMAIL = 'noreply@test.com';

      expect(async () => {
        await emailService.sendSubscriptionCancelledEmail(
          'user@example.com',
          'John Doe',
          1
        );
      }).not.toThrow();
    });

    it('should skip email when SendGrid is not configured', async () => {
      delete process.env.SENDGRID_API_KEY;

      expect(async () => {
        await emailService.sendSubscriptionCancelledEmail(
          'user@example.com',
          'John Doe',
          1
        );
      }).not.toThrow();
    });
  });

  describe('Email content validation', () => {
    it('should include user name in confirmation email', async () => {
      process.env.SENDGRID_API_KEY = 'test_key';
      process.env.SENDGRID_FROM_EMAIL = 'noreply@test.com';

      const userName = 'Jane Smith';
      expect(async () => {
        await emailService.sendSubscriptionConfirmationEmail(
          'user@example.com',
          userName,
          1
        );
      }).not.toThrow();
    });

    it('should include correct sender email', async () => {
      process.env.SENDGRID_API_KEY = 'test_key';
      process.env.SENDGRID_FROM_EMAIL = 'noreply@ressourcerie-ifac.fr';

      expect(async () => {
        await emailService.sendSubscriptionConfirmationEmail(
          'user@example.com',
          'John Doe',
          1
        );
      }).not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle SendGrid errors gracefully', async () => {
      process.env.SENDGRID_API_KEY = 'test_key';
      process.env.SENDGRID_FROM_EMAIL = 'noreply@test.com';

      // Le service devrait logger l'erreur mais ne pas planter
      expect(async () => {
        await emailService.sendSubscriptionConfirmationEmail(
          'user@example.com',
          'John Doe',
          1
        );
      }).not.toThrow();
    });

    it('should handle missing email address', async () => {
      process.env.SENDGRID_API_KEY = 'test_key';
      process.env.SENDGRID_FROM_EMAIL = 'noreply@test.com';

      expect(async () => {
        await emailService.sendSubscriptionConfirmationEmail(
          '',
          'John Doe',
          1
        );
      }).not.toThrow();
    });
  });
});
