/**
 * Service de matching automatique entre ressources et collections thématiques
 * Associe les ressources aux collections basées sur leurs tags, type et catégorie
 */

import * as db from "./db";

/**
 * Définition des collections thématiques et leurs critères de matching
 */
const COLLECTION_DEFINITIONS = [
  {
    id: "jeux-collectifs",
    name: "Jeux collectifs",
    description: "Jeux et activités favorisant la coopération et l'esprit d'équipe",
    keywords: ["jeux", "collectif", "coopération", "équipe", "groupe", "parachute", "olympiades", "jeu", "activité"],
    types: ["Fiche", "Projet", "Kit clé en main"],
    categories: ["Jeux sportifs", "Grands jeux"],
  },
  {
    id: "activites-manuelles",
    name: "Activités manuelles",
    description: "Ateliers créatifs et activités manuelles pour tous les âges",
    keywords: ["manuel", "créatif", "atelier", "fabrication", "cerf-volant", "recyclage", "création", "activité", "fiche"],
    types: ["Fiche", "Kit clé en main"],
    categories: ["Activités manuelles et créatives"],
  },
  {
    id: "formation-bafa",
    name: "Formation BAFA",
    description: "Ressources et supports pour la formation BAFA/BAFD",
    keywords: ["bafa", "bafd", "formation", "enfant", "développement", "pédagogie", "connaissance", "module", "théorique"],
    types: ["Kit clé en main", "Article"],
    categories: [],
  },
  {
    id: "environnement-nature",
    name: "Environnement et nature",
    description: "Activités et projets axés sur la nature et l'environnement",
    keywords: ["nature", "environnement", "écologie", "découverte", "séjour", "photographie", "extérieur", "projet", "activité"],
    types: ["Projet", "Fiche", "Article"],
    categories: ["Environnement et nature"],
  },
  {
    id: "expression-artistique",
    name: "Expression artistique",
    description: "Activités d'expression et de création artistique",
    keywords: ["théâtre", "expression", "artistique", "improvisation", "chants", "musique", "photographie", "créatif", "activité"],
    types: ["Fiche", "Article"],
    categories: ["Expression artistique", "Chants et musique"],
  },
  {
    id: "gestion-conflits",
    name: "Gestion des conflits",
    description: "Outils et méthodes pour gérer les situations conflictuelles",
    keywords: ["conflit", "gestion", "situation", "comportement", "discipline", "communication", "méthode", "outil"],
    types: ["Article", "Fiche"],
    categories: ["Citoyenneté et vivre ensemble"],
  },
  {
    id: "vie-quotidienne",
    name: "Vie quotidienne",
    description: "Activités et ressources pour la vie quotidienne en ACM",
    keywords: ["quotidien", "repas", "hygiène", "sommeil", "routine", "conseil", "activité", "fiche"],
    types: ["Fiche", "Article"],
    categories: ["Vie quotidienne"],
  },
];

/**
 * Calcule un score de matching entre une ressource et une collection
 * @param resource Ressource à évaluer
 * @param collectionDef Définition de la collection
 * @param tags Tags associés à la ressource
 * @returns Score de matching (0-100)
 */
export function calculateMatchScore(
  resource: {
    title: string;
    summary: string;
    type: string;
    category?: string | null;
  },
  collectionDef: (typeof COLLECTION_DEFINITIONS)[0],
  tags: Array<{ name: string; slug: string }>
): number {
  let score = 0;
  const text = `${resource.title} ${resource.summary}`.toLowerCase();

  // Matching par type (30 points)
  if (collectionDef.types.includes(resource.type)) {
    score += 30;
  }

  // Matching par catégorie (25 points)
  if (resource.category && collectionDef.categories.includes(resource.category)) {
    score += 25;
  }

  // Matching par keywords dans le titre et résumé (40 points - augmenté)
  const matchedKeywords = collectionDef.keywords.filter(
    (keyword) => text.includes(keyword.toLowerCase())
  );
  if (matchedKeywords.length > 0) {
    score += Math.min(40, matchedKeywords.length * 8);
  }

  // Matching par tags (20 points)
  const matchedTags = tags.filter((tag) =>
    collectionDef.keywords.includes(tag.name.toLowerCase()) ||
    collectionDef.keywords.includes(tag.slug.toLowerCase())
  );
  if (matchedTags.length > 0) {
    score += Math.min(20, matchedTags.length * 5);
  }

  return Math.min(100, score);
}

/**
 * Trouve la meilleure collection pour une ressource
 * @param resource Ressource à associer
 * @param tags Tags de la ressource
 * @param minScore Score minimum requis (par défaut 40)
 * @returns Collection correspondante ou undefined
 */
export function findBestCollection(
  resource: {
    title: string;
    summary: string;
    type: string;
    category?: string | null;
  },
  tags: Array<{ name: string; slug: string }>,
  minScore: number = 40
): (typeof COLLECTION_DEFINITIONS)[0] | undefined {
  let bestCollection: (typeof COLLECTION_DEFINITIONS)[0] | undefined;
  let bestScore = minScore;

  for (const collectionDef of COLLECTION_DEFINITIONS) {
    const score = calculateMatchScore(resource, collectionDef, tags);
    if (score > bestScore) {
      bestScore = score;
      bestCollection = collectionDef;
    }
  }

  return bestCollection;
}

/**
 * Associe automatiquement les ressources aux collections
 * @param options Options de configuration
 * @returns Résumé de l'association
 */
export async function autoAssociateResourcesToCollections(options?: {
  minScore?: number;
  overwrite?: boolean;
}): Promise<{
  success: boolean;
  message: string;
  associationsCreated: number;
  associationsSkipped: number;
  errors: string[];
}> {
  const minScore = options?.minScore ?? 40;
  const overwrite = options?.overwrite ?? false;

  let associationsCreated = 0;
  let associationsSkipped = 0;
  const errors: string[] = [];

  try {
    // Récupérer toutes les ressources
    const allResources = await db.getAllResources();
    console.log(`[AutoAssociate] Traitement de ${allResources.length} ressources`);

    for (const resource of allResources) {
      try {
        // Récupérer les tags de la ressource
        const tags = await db.getResourceTags(resource.id);

        // Trouver la meilleure collection
        const bestCollection = findBestCollection(resource, tags, minScore);

        if (!bestCollection) {
          associationsSkipped++;
          continue;
        }

        // Trouver ou créer la collection
        const publicCollections = await db.getPublicCollections();
        let collection = publicCollections.find((c) => c.name === bestCollection.name);

        if (!collection) {
          // Créer la collection si elle n'existe pas
          const collectionId = await db.createCollection({
            userId: 1, // Admin user
            name: bestCollection.name,
            description: bestCollection.description,
            isPublic: true,
          });

          collection = {
            id: collectionId,
            userId: 1,
            name: bestCollection.name,
            description: bestCollection.description,
            imageUrl: null,
            isPublic: "true",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          console.log(`[AutoAssociate] Collection créée: ${bestCollection.name}`);
        }

        // Vérifier si la ressource est déjà dans la collection
        if (collection) {
          const isAlreadyInCollection = await db.isResourceInCollection(collection.id, resource.id);

          if (isAlreadyInCollection && !overwrite) {
            associationsSkipped++;
            continue;
          }

          // Ajouter la ressource à la collection
          if (!isAlreadyInCollection) {
              await db.addResourceToCollection(collection.id, resource.id);
            associationsCreated++;
            console.log(
              `[AutoAssociate] Ressource "${resource.title}" associée à "${bestCollection.name}"`
            );
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Erreur pour ressource ${resource.id}: ${errorMsg}`);
        console.error(`[AutoAssociate] Erreur pour ressource ${resource.id}:`, error);
      }
    }

    return {
      success: true,
      message: `Association automatique complétée: ${associationsCreated} créées, ${associationsSkipped} ignorées`,
      associationsCreated,
      associationsSkipped,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Erreur lors de l'association automatique: ${errorMsg}`,
      associationsCreated,
      associationsSkipped,
      errors: [...errors, errorMsg],
    };
  }
}

/**
 * Récupère les définitions des collections pour l'affichage
 */
export function getCollectionDefinitions() {
  return COLLECTION_DEFINITIONS;
}
