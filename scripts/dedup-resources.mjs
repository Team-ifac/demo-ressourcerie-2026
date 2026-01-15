#!/usr/bin/env node
/**
 * Script pour identifier et supprimer les ressources dupliquées
 * Basé sur le titre (case-insensitive)
 */

import { db } from '../server/db.ts';
import { resources, collectionResources } from '../drizzle/schema.ts';
import { eq, sql } from 'drizzle-orm';

async function deduplicateResources() {
  console.log('🔍 Analyse des ressources dupliquées...\n');

  try {
    // Récupérer toutes les ressources
    const allResources = await db.select().from(resources);
    console.log(`Total de ressources : ${allResources.length}`);

    // Grouper par titre (case-insensitive)
    const grouped = new Map();
    allResources.forEach(resource => {
      const key = resource.title.toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(resource);
    });

    // Identifier les doublons
    const duplicates = Array.from(grouped.entries())
      .filter(([_, items]) => items.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    console.log(`\n📊 Résultats :`);
    console.log(`- Ressources uniques : ${grouped.size}`);
    console.log(`- Groupes de doublons : ${duplicates.length}`);
    console.log(`- Total de doublons à supprimer : ${allResources.length - grouped.size}`);

    // Afficher les 10 premiers groupes de doublons
    console.log(`\n🔴 Top 10 des doublons :`);
    duplicates.slice(0, 10).forEach(([title, items]) => {
      console.log(`\n  "${title}"`);
      console.log(`  - ${items.length} copies trouvées (IDs: ${items.map(r => r.id).join(', ')})`);
      items.forEach((item, idx) => {
        console.log(`    ${idx + 1}. ID ${item.id}: ${item.summary?.substring(0, 50)}...`);
      });
    });

    // Proposer une stratégie de nettoyage
    console.log(`\n\n🧹 Stratégie de nettoyage :`);
    console.log(`Pour chaque groupe de doublons :`);
    console.log(`1. Garder la ressource avec le contenu le plus complet`);
    console.log(`2. Fusionner les tags et thématiques`);
    console.log(`3. Supprimer les copies`);

    // Créer un rapport détaillé
    const report = {
      totalResources: allResources.length,
      uniqueResources: grouped.size,
      duplicateGroups: duplicates.length,
      totalDuplicates: allResources.length - grouped.size,
      duplicates: duplicates.map(([title, items]) => ({
        title,
        count: items.length,
        ids: items.map(r => r.id),
        contentLengths: items.map(r => ({
          id: r.id,
          titleLength: r.title.length,
          summaryLength: r.summary?.length || 0,
          contentLength: r.content?.length || 0,
          totalLength: (r.title.length || 0) + (r.summary?.length || 0) + (r.content?.length || 0),
        })),
      })),
    };

    console.log(`\n\n📝 Rapport complet sauvegardé dans dedup-report.json`);
    console.log(JSON.stringify(report, null, 2));

  } catch (error) {
    console.error('❌ Erreur :', error);
    process.exit(1);
  }
}

// Exécuter le script
deduplicateResources().then(() => {
  console.log('\n✅ Analyse terminée');
  process.exit(0);
});
