/**
 * Service de déduplication des ressources
 * Identifie et supprime les ressources dupliquées basées sur le titre
 */

import { getDb } from "./db";
import { resources, collectionResources } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import * as db from "./db";

export interface DuplicateGroup {
  title: string;
  count: number;
  ids: number[];
  contentLengths: Array<{
    id: number;
    titleLength: number;
    summaryLength: number;
    contentLength: number;
    totalLength: number;
  }>;
}

export interface DeduplicationReport {
  totalResources: number;
  uniqueResources: number;
  totalDuplicates: number;
  duplicateGroups: DuplicateGroup[];
  success: boolean;
  message: string;
}

/**
 * Analyse les ressources dupliquées
 */
export async function analyzeDuplicates(): Promise<DeduplicationReport> {
  try {
    // 🔒 Sécurité "outil national" :
    // Ce service est uniquement destiné à l'admin/maintenance.
    // On force un mode "adminView" explicite pour éviter toute réutilisation accidentelle.
    const allResources = await db.getAllResources({
      adminView: db.ADMIN_VIEW_TOKEN,
      includeInternal: true,
      includePremium: true,
    });
    
    // Grouper par titre (case-insensitive)
    const grouped = new Map<string, typeof allResources>();
    allResources.forEach(resource => {
      const key = resource.title.toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(resource);
    });

    // Identifier les doublons
    const duplicateGroups: DuplicateGroup[] = [];
    grouped.forEach((items, title) => {
      if (items.length > 1) {
        const contentLengths = items.map(r => ({
          id: r.id,
          titleLength: r.title.length,
          summaryLength: r.summary?.length || 0,
          contentLength: r.content?.length || 0,
          totalLength: (r.title.length || 0) + (r.summary?.length || 0) + (r.content?.length || 0),
        }));

        duplicateGroups.push({
          title,
          count: items.length,
          ids: items.map(r => r.id),
          contentLengths,
        });
      }
    });

    // Trier par nombre de doublons
    duplicateGroups.sort((a, b) => b.count - a.count);

    return {
      totalResources: allResources.length,
      uniqueResources: grouped.size,
      totalDuplicates: allResources.length - grouped.size,
      duplicateGroups,
      success: true,
      message: `Analyse complétée: ${allResources.length} ressources, ${grouped.size} uniques, ${allResources.length - grouped.size} doublons`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      totalResources: 0,
      uniqueResources: 0,
      totalDuplicates: 0,
      duplicateGroups: [],
      success: false,
      message: `Erreur lors de l'analyse: ${errorMsg}`,
    };
  }
}

/**
 * Supprime les doublons en gardant la ressource la plus complète
 */
export async function removeDuplicates(options?: {
  dryRun?: boolean;
  keepBest?: boolean;
}): Promise<{
  success: boolean;
  message: string;
  resourcesDeleted: number;
  errors: string[];
}> {
  const dryRun = options?.dryRun ?? true;
  const keepBest = options?.keepBest ?? true;

  try {
    const report = await analyzeDuplicates();
    
    if (!report.success || report.duplicateGroups.length === 0) {
      return {
        success: true,
        message: "Aucun doublon trouvé",
        resourcesDeleted: 0,
        errors: [],
      };
    }

    let resourcesDeleted = 0;
    const errors: string[] = [];

    for (const group of report.duplicateGroups) {
      try {
        // Déterminer quelle ressource garder
        let idToKeep = group.ids[0];
        
        if (keepBest) {
          // Garder la ressource avec le contenu le plus complet
          const bestIndex = group.contentLengths.reduce((bestIdx, current, idx) => {
            return current.totalLength > group.contentLengths[bestIdx].totalLength ? idx : bestIdx;
          }, 0);
          idToKeep = group.contentLengths[bestIndex].id;
        }

        // Identifier les IDs à supprimer
        const idsToDelete = group.ids.filter(id => id !== idToKeep);

        if (!dryRun && idsToDelete.length > 0) {
          // Supprimer les associations aux collections
          const database = await getDb();
          if (database) {
            await database.delete(collectionResources)
              .where(inArray(collectionResources.resourceId, idsToDelete));

            // Supprimer les ressources
            await database.delete(resources)
              .where(inArray(resources.id, idsToDelete));
          }

          resourcesDeleted += idsToDelete.length;
        }

        console.log(
          `[Dedup] "${group.title}": Garder ID ${idToKeep}, supprimer ${idsToDelete.length} copies`
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Erreur pour "${group.title}": ${errorMsg}`);
      }
    }

    return {
      success: true,
      message: dryRun 
        ? `Simulation: ${resourcesDeleted} ressources seraient supprimées`
        : `${resourcesDeleted} ressources supprimées`,
      resourcesDeleted,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Erreur lors de la suppression: ${errorMsg}`,
      resourcesDeleted: 0,
      errors: [errorMsg],
    };
  }
}
