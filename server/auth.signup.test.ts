import { describe, it, expect, beforeEach } from 'vitest';
import * as authService from './auth';

describe('Authentication Service', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);
      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
    });

    it('should verify a correct password', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);
      const isValid = await authService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hash = await authService.hashPassword(password);
      const isValid = await authService.verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Email Verification Token', () => {
    it('should generate a unique verification token', () => {
      const token1 = authService.generateEmailVerificationToken();
      const token2 = authService.generateEmailVerificationToken();
      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
    });

    it('should generate a token with sufficient length', () => {
      const token = authService.generateEmailVerificationToken();
      expect(token.length).toBeGreaterThan(32);
    });
  });
});
