import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';
import type { ProfileType } from '../drizzle/schema';

describe('Profile Management', () => {
  const testUserId = 1; // Utilisateur admin existant
  const testFormateurEmail = 'test-formateur-' + Date.now() + '@example.com';
  const testPassword = 'TestPassword123!';

  beforeAll(async () => {
    // Cleanup avant les tests
    try {
      const formateur = await db.getFormateurByEmail(testFormateurEmail);
      if (formateur) {
        await db.deactivateFormateur(formateur.id);
      }
    } catch (e) {
      // Ignore if doesn't exist
    }
  });

  afterAll(async () => {
    // Cleanup après les tests
    try {
      const formateur = await db.getFormateurByEmail(testFormateurEmail);
      if (formateur) {
        await db.deactivateFormateur(formateur.id);
      }
    } catch (e) {
      // Ignore if doesn't exist
    }
  });

  describe('User Profiles', () => {
    it('should set user profile', async () => {
      const profileType: ProfileType = 'animateur';
      await db.setUserProfile(testUserId, profileType);
      
      const profile = await db.getUserProfile(testUserId);
      expect(profile).toBeDefined();
      expect(profile?.profileType).toBe(profileType);
    });

    it('should update user profile', async () => {
      const profileType1: ProfileType = 'animateur';
      const profileType2: ProfileType = 'directeur';
      
      await db.setUserProfile(testUserId, profileType1);
      let profile = await db.getUserProfile(testUserId);
      expect(profile?.profileType).toBe(profileType1);
      
      await db.setUserProfile(testUserId, profileType2);
      profile = await db.getUserProfile(testUserId);
      expect(profile?.profileType).toBe(profileType2);
    });

    it('should return null for non-existent user profile', async () => {
      const profile = await db.getUserProfile(99999);
      expect(profile).toBeNull();
    });
  });

  describe('Formateur Management', () => {
    it('should create a formateur', async () => {
      await db.createFormateur(
        testFormateurEmail,
        testPassword,
        'John',
        'Doe'
      );
      
      const formateur = await db.getFormateurByEmail(testFormateurEmail);
      expect(formateur).toBeDefined();
      expect(formateur?.email).toBe(testFormateurEmail);
      expect(formateur?.firstName).toBe('John');
      expect(formateur?.lastName).toBe('Doe');
      expect(formateur?.isActive).toBe('true');
    });

    it('should authenticate formateur with correct password', async () => {
      const formateur = await db.authenticateFormateur(
        testFormateurEmail,
        testPassword
      );
      expect(formateur).toBeDefined();
      expect(formateur?.email).toBe(testFormateurEmail);
    });

    it('should not authenticate formateur with wrong password', async () => {
      const formateur = await db.authenticateFormateur(
        testFormateurEmail,
        'WrongPassword123!'
      );
      expect(formateur).toBeNull();
    });

    it('should not authenticate non-existent formateur', async () => {
      const formateur = await db.authenticateFormateur(
        'nonexistent@example.com',
        'AnyPassword123!'
      );
      expect(formateur).toBeNull();
    });

    it('should deactivate formateur', async () => {
      const formateur = await db.getFormateurByEmail(testFormateurEmail);
      if (formateur) {
        await db.deactivateFormateur(formateur.id);
        
        const result = await db.authenticateFormateur(
          testFormateurEmail,
          testPassword
        );
        expect(result).toBeNull();
      }
    });

    it('should activate formateur', async () => {
      const formateur = await db.getFormateurByEmail(testFormateurEmail);
      if (formateur) {
        await db.activateFormateur(formateur.id);
        
        const result = await db.authenticateFormateur(
          testFormateurEmail,
          testPassword
        );
        expect(result).toBeDefined();
      }
    });

    it('should update formateur password', async () => {
      const formateur = await db.getFormateurByEmail(testFormateurEmail);
      if (formateur) {
        const newPassword = 'NewPassword123!';
        await db.updateFormateurPassword(formateur.id, newPassword);
        
        const result = await db.authenticateFormateur(
          testFormateurEmail,
          newPassword
        );
        expect(result).toBeDefined();
      }
    });

    it('should get all formateurs', async () => {
      const formateurs = await db.getAllFormateurs();
      expect(Array.isArray(formateurs)).toBe(true);
    });
  });
});
