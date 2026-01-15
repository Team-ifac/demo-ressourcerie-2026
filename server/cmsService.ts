import { storagePut, storageGet } from "./storage";

export interface CMSPage {
  slug: string;
  title: string;
  description?: string;
  sections: CMSSection[];
}

export interface CMSSection {
  id: string;
  name: string;
  type: "hero" | "text" | "image" | "cta" | "features" | "testimonials";
  order: number;
  content: Record<string, any>;
}

const CMS_BUCKET = "cms-pages";

/**
 * Crée les pages par défaut avec du contenu initial
 */
function getDefaultPages(): Record<string, CMSPage> {
  return {
    home: {
      slug: "home",
      title: "Accueil",
      description: "Page d'accueil de la Ressourcerie IFAC",
      sections: [
        {
          id: "hero-1",
          name: "Hero Section",
          type: "hero",
          order: 1,
          content: {
            title: "Bienvenue sur la Ressourcerie IFAC",
            subtitle: "Comprendre, animer, transmettre à portée de clic",
          },
        },
      ],
    },
    about: {
      slug: "about",
      title: "À propos",
      description: "Page à propos de l'IFAC",
      sections: [
        {
          id: "text-1",
          name: "Présentation",
          type: "text",
          order: 1,
          content: {
            text: "L'IFAC est une association de formation depuis plus de 50 ans.",
          },
        },
      ],
    },
    help: {
      slug: "help",
      title: "Aide",
      description: "Page d'aide et FAQ",
      sections: [
        {
          id: "text-1",
          name: "FAQ",
          type: "text",
          order: 1,
          content: {
            text: "Consultez notre FAQ pour obtenir de l'aide.",
          },
        },
      ],
    },
    parcours: {
      slug: "parcours",
      title: "Parcours",
      description: "Parcours d'apprentissage",
      sections: [
        {
          id: "text-1",
          name: "Parcours disponibles",
          type: "text",
          order: 1,
          content: {
            text: "Découvrez nos parcours d'apprentissage personnalisés.",
          },
        },
      ],
    },
  };
}

/**
 * Récupère une page CMS
 */
export async function getCMSPage(slug: string): Promise<CMSPage | null> {
  try {
    const { url } = await storageGet(`${CMS_BUCKET}/${slug}.json`);
    const response = await fetch(url);
    if (!response.ok) {
      const defaults = getDefaultPages();
      return defaults[slug] || null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Erreur lors de la récupération de la page CMS ${slug}:`, error);
    const defaults = getDefaultPages();
    return defaults[slug] || null;
  }
}

/**
 * Sauvegarde une page CMS
 */
export async function saveCMSPage(page: CMSPage): Promise<boolean> {
  try {
    const data = JSON.stringify(page, null, 2);
    await storagePut(
      `${CMS_BUCKET}/${page.slug}.json`,
      data,
      "application/json"
    );
    return true;
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde de la page CMS ${page.slug}:`, error);
    return false;
  }
}

/**
 * Ajoute ou met à jour une section
 */
export function updateSection(
  page: CMSPage,
  section: CMSSection
): CMSPage {
  const existingIndex = page.sections.findIndex((s) => s.id === section.id);

  if (existingIndex >= 0) {
    page.sections[existingIndex] = section;
  } else {
    page.sections.push(section);
  }

  // Réordonner les sections
  page.sections.sort((a, b) => a.order - b.order);

  return page;
}

/**
 * Supprime une section
 */
export function deleteSection(page: CMSPage, sectionId: string): CMSPage {
  page.sections = page.sections.filter((s) => s.id !== sectionId);
  return page;
}

/**
 * Réorganise les sections
 */
export function reorderSections(
  page: CMSPage,
  sectionIds: string[]
): CMSPage {
  const sectionMap = new Map(page.sections.map((s) => [s.id, s]));
  page.sections = sectionIds
    .map((id, index) => {
      const section = sectionMap.get(id);
      if (section) {
        section.order = index;
        return section;
      }
      return null;
    })
    .filter((s) => s !== null) as CMSSection[];

  return page;
}

/**
 * Crée une page CMS vierge
 */
export function createEmptyPage(slug: string, title: string): CMSPage {
  return {
    slug,
    title,
    description: "",
    sections: [],
  };
}
