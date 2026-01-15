import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import * as db from './db';
import { resources } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Access Levels System', () => {
  let testResourceId: number;

  beforeAll(async () => {
    // Create a test resource
    const database = await getDb();
    if (!database) throw new Error('Database not available');

    const result = await database.insert(resources).values({
      title: 'Test Resource for Access Levels',
      summary: 'Testing access level filtering',
      content: 'Test content',
      type: 'activity',
      visibility: 'PUBLIC',
      accessLevel: 'PUBLIC',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get the inserted ID
    const inserted = await database
      .select()
      .from(resources)
      .where(eq(resources.title, 'Test Resource for Access Levels'))
      .limit(1);

    if (inserted.length > 0) {
      testResourceId = inserted[0].id;
    } else {
      throw new Error('Failed to create test resource');
    }
  });

  afterAll(async () => {
    // Clean up test resource
    const database = await getDb();
    if (!database) return;

    await database.delete(resources).where(eq(resources.id, testResourceId));
  });

  describe('updateResourceAccessLevel', () => {
    it('should update resource access level to AUTHENTICATED', async () => {
      await db.updateResourceAccessLevel(testResourceId, 'AUTHENTICATED');

      const database = await getDb();
      if (!database) throw new Error('Database not available');

      const resource = await database
        .select()
        .from(resources)
        .where(eq(resources.id, testResourceId))
        .limit(1);

      expect(resource[0].accessLevel).toBe('AUTHENTICATED');
    });

    it('should update resource access level to PREMIUM', async () => {
      await db.updateResourceAccessLevel(testResourceId, 'PREMIUM');

      const database = await getDb();
      if (!database) throw new Error('Database not available');

      const resource = await database
        .select()
        .from(resources)
        .where(eq(resources.id, testResourceId))
        .limit(1);

      expect(resource[0].accessLevel).toBe('PREMIUM');
    });

    it('should update resource access level back to PUBLIC', async () => {
      await db.updateResourceAccessLevel(testResourceId, 'PUBLIC');

      const database = await getDb();
      if (!database) throw new Error('Database not available');

      const resource = await database
        .select()
        .from(resources)
        .where(eq(resources.id, testResourceId))
        .limit(1);

      expect(resource[0].accessLevel).toBe('PUBLIC');
    });
  });

  describe('getResourcesByAccessLevel', () => {
    it('should return PUBLIC resources', async () => {
      await db.updateResourceAccessLevel(testResourceId, 'PUBLIC');

      const publicResources = await db.getResourcesByAccessLevel('PUBLIC');

      expect(publicResources.length).toBeGreaterThan(0);
      expect(publicResources.some((r) => r.id === testResourceId)).toBe(true);
    });

    it('should return AUTHENTICATED resources', async () => {
      await db.updateResourceAccessLevel(testResourceId, 'AUTHENTICATED');

      const authenticatedResources = await db.getResourcesByAccessLevel('AUTHENTICATED');

      expect(authenticatedResources.some((r) => r.id === testResourceId)).toBe(true);
    });

    it('should return PREMIUM resources', async () => {
      await db.updateResourceAccessLevel(testResourceId, 'PREMIUM');

      const premiumResources = await db.getResourcesByAccessLevel('PREMIUM');

      expect(premiumResources.some((r) => r.id === testResourceId)).toBe(true);
    });
  });

  describe('getAccessLevelStats', () => {
    it('should return statistics for all access levels', async () => {
      const stats = await db.getAccessLevelStats();

      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);

      // Check that we have stats for different levels
      const levels = stats.map((s) => s.level);
      expect(levels.includes('PUBLIC')).toBe(true);
    });

    it('should have correct count format', async () => {
      const stats = await db.getAccessLevelStats();

      stats.forEach((stat) => {
        expect(stat.level).toBeDefined();
        expect(typeof stat.count).toBe('number');
        expect(stat.count).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getAllResources filtering', () => {
    it('should filter PUBLIC resources for anonymous users', async () => {
      await db.updateResourceAccessLevel(testResourceId, 'PUBLIC');

      const resources = await db.getAllResources({
        includeInternal: false,
      });

      expect(resources.some((r) => r.id === testResourceId)).toBe(true);
    });

    it('should not include PREMIUM resources for anonymous users', async () => {
      await db.updateResourceAccessLevel(testResourceId, 'PREMIUM');

      const resources = await db.getAllResources({
        includeInternal: false,
      });

      expect(resources.some((r) => r.id === testResourceId)).toBe(false);
    });

    it('should include AUTHENTICATED resources for authenticated users', async () => {
      await db.updateResourceAccessLevel(testResourceId, 'AUTHENTICATED');

      const resources = await db.getAllResources({
        includeInternal: true,
      });

      expect(resources.some((r) => r.id === testResourceId)).toBe(true);
    });

    it('should not include PREMIUM resources for authenticated users', async () => {
      await db.updateResourceAccessLevel(testResourceId, 'PREMIUM');

      const resources = await db.getAllResources({
        includeInternal: true,
      });

      expect(resources.some((r) => r.id === testResourceId)).toBe(false);
    });
  });
});
