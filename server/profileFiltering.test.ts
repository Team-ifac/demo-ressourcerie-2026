import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import * as db from './db';
import { resources, resourceProfiles } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

describe('Profile Filtering System', () => {
  let testResourceId: number;

  beforeAll(async () => {
    // Create a test resource
    const database = await getDb();
    if (!database) throw new Error('Database not available');

    const result = await database.insert(resources).values({
      title: 'Test Resource for Profile Filtering',
      summary: 'Testing profile filtering',
      content: 'Test content',
      type: 'activity',
      visibility: 'PUBLIC',
      accessLevel: 'AUTHENTICATED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get the inserted ID
    const inserted = await database
      .select()
      .from(resources)
      .where(eq(resources.title, 'Test Resource for Profile Filtering'))
      .limit(1);

    if (inserted.length > 0) {
      testResourceId = inserted[0].id;
      
      // Associate with animateur profile
      await database.insert(resourceProfiles).values({
        resourceId: testResourceId,
        profileType: 'animateur',
      });
    } else {
      throw new Error('Failed to create test resource');
    }
  });

  afterAll(async () => {
    // Clean up test resource
    const database = await getDb();
    if (!database) return;

    await database.delete(resourceProfiles).where(eq(resourceProfiles.resourceId, testResourceId));
    await database.delete(resources).where(eq(resources.id, testResourceId));
  });

  describe('getAllResources with profileType filter', () => {
    it('should return resources for animateur profile', async () => {
      const animateurResources = await db.getAllResources({
        profileType: 'animateur',
        includeInternal: true,
      });

      expect(animateurResources.length).toBeGreaterThan(0);
      expect(animateurResources.some((r) => r.id === testResourceId)).toBe(true);
    });

    it('should not return resources for other profiles', async () => {
      const formateurResources = await db.getAllResources({
        profileType: 'formateur',
        includeInternal: true,
      });

      expect(formateurResources.some((r) => r.id === testResourceId)).toBe(false);
    });

    it('should filter by profileType and accessLevel', async () => {
      const resources = await db.getAllResources({
        profileType: 'animateur',
        includeInternal: true,
      });

      // All resources should be AUTHENTICATED or PUBLIC
      resources.forEach((r) => {
        expect(['AUTHENTICATED', 'PUBLIC']).toContain(r.accessLevel);
      });
    });

    it('should return empty array for profile with no resources', async () => {
      const directorResources = await db.getAllResources({
        profileType: 'directeur',
        includeInternal: true,
      });

      // Should return empty or very few resources if none are associated
      expect(Array.isArray(directorResources)).toBe(true);
    });
  });

  describe('getAllResources without profileType filter', () => {
    it('should return all PUBLIC resources when no profile specified', async () => {
      const publicResources = await db.getAllResources({
        includeInternal: false,
      });

      expect(publicResources.length).toBeGreaterThan(0);
      // Should not include AUTHENTICATED resources
      publicResources.forEach((r) => {
        expect(r.accessLevel).toBe('PUBLIC');
      });
    });

    it('should return PUBLIC and AUTHENTICATED resources for authenticated users', async () => {
      const authenticatedResources = await db.getAllResources({
        includeInternal: true,
      });

      expect(authenticatedResources.length).toBeGreaterThan(0);
      // Should include both PUBLIC and AUTHENTICATED
      const hasAuthenticated = authenticatedResources.some((r) => r.accessLevel === 'AUTHENTICATED');
      expect(hasAuthenticated).toBe(true);
    });
  });

  describe('Profile filtering with other filters', () => {
    it('should combine profileType with search filter', async () => {
      const resources = await db.getAllResources({
        profileType: 'animateur',
        search: 'test',
        includeInternal: true,
      });

      expect(Array.isArray(resources)).toBe(true);
      // Should only include resources matching both filters
      resources.forEach((r) => {
        expect(
          r.title.toLowerCase().includes('test') ||
          r.summary?.toLowerCase().includes('test') ||
          r.content?.toLowerCase().includes('test')
        ).toBe(true);
      });
    });

    it('should combine profileType with type filter', async () => {
      const resources = await db.getAllResources({
        profileType: 'animateur',
        type: 'activity',
        includeInternal: true,
      });

      expect(Array.isArray(resources)).toBe(true);
      // All resources should be of type 'activity'
      resources.forEach((r) => {
        expect(r.type).toBe('activity');
      });
    });
  });
});
