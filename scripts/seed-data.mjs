import { drizzle } from "drizzle-orm/mysql2";
import { themes, resources, resourceThemes } from "../drizzle/schema.ts";
import mysql from "mysql2/promise";
import "dotenv/config";

const THEMES_DATA = [
  { name: "Jeux sportifs", slug: "jeux-sportifs" },
  { name: "Activités manuelles", slug: "activites-manuelles" },
  { name: "Grands jeux", slug: "grands-jeux" },
  { name: "Chants et musique", slug: "chants-musique" },
  { name: "Expression artistique", slug: "expression-artistique" },
  { name: "Vie quotidienne", slug: "vie-quotidienne" },
  { name: "Environnement et nature", slug: "environnement-nature" },
  { name: "Citoyenneté et vivre ensemble", slug: "citoyennete-vivre-ensemble" },
];

const RESOURCES_DATA = [
  {
    title: "Le jeu du parachute",
    summary: "Activité collective dynamique favorisant la coopération et la motricité globale",
    content: "Le jeu du parachute est une activité ludique et coopérative qui permet de développer la motricité globale, la coordination et l'esprit d'équipe. Les participant·es tiennent les bords d'un grand parachute en tissu et réalisent ensemble différents mouvements rythmés.\n\nObjectifs pédagogiques :\n- Développer la coordination motrice\n- Favoriser la coopération et l'entraide\n- Créer une dynamique de groupe positive\n- Travailler le rythme et la synchronisation\n\nDéroulement :\n1. Installation : Les participant·es forment un cercle et tiennent le parachute à deux mains\n2. Échauffement : Mouvements simples (lever, baisser, vagues)\n3. Jeux variés : champignon, échange de places, ballon prisonnier\n4. Retour au calme : mouvements lents et respirations\n\nVariantes possibles selon l'âge et les objectifs pédagogiques.",
    type: "Fiche",
    ageRange: "6-12 ans",
    duration: "30 min",
    level: "Débutant",
    prepTime: "5 min",
    visibility: "PUBLIC",
    themeNames: ["Jeux sportifs", "Vie quotidienne"],
  },
  {
    title: "Atelier fabrication de cerf-volant",
    summary: "Construction d'un cerf-volant avec des matériaux simples et accessibles",
    content: "Cet atelier permet aux participant·es de fabriquer leur propre cerf-volant à partir de matériaux recyclés et peu coûteux. Une activité manuelle qui allie créativité, apprentissage technique et plaisir du vol.\n\nMatériel nécessaire :\n- Sacs plastiques ou papier léger\n- Baguettes de bois ou bambou\n- Ficelle solide\n- Ruban adhésif\n- Ciseaux\n- Décorations (feutres, autocollants)\n\nÉtapes de fabrication :\n1. Découpe de la voilure selon le gabarit\n2. Assemblage de l'armature en croix\n3. Fixation de la voilure sur l'armature\n4. Installation de la bride et de la queue\n5. Décoration personnalisée\n6. Test et ajustements\n\nConseils de sécurité et conditions météo optimales pour le vol.",
    type: "Kit clé en main",
    ageRange: "6-12 ans",
    duration: "1-2h",
    level: "Intermédiaire",
    prepTime: "30 min",
    visibility: "PUBLIC",
    themeNames: ["Activités manuelles", "Environnement et nature"],
  },
  {
    title: "Grand jeu : La quête des éléments",
    summary: "Jeu d'aventure par équipes sur le thème des quatre éléments naturels",
    content: "Un grand jeu d'aventure immersif où les équipes doivent collecter les quatre éléments (Terre, Eau, Feu, Air) en relevant des défis variés. Idéal pour une après-midi complète en extérieur.\n\nPrincipe du jeu :\nLes équipes parcourent un territoire balisé et rencontrent des gardien·nes des éléments qui leur proposent des épreuves. Chaque épreuve réussie permet d'obtenir un fragment d'élément. La première équipe à réunir les quatre éléments complets remporte la partie.\n\nTypes d'épreuves :\n- Terre : épreuves de force et d'adresse\n- Eau : énigmes et défis logiques\n- Feu : épreuves de rapidité et d'agilité\n- Air : défis créatifs et artistiques\n\nOrganisation :\n- Durée : 2-3 heures\n- Nombre de participant·es : 20 à 60\n- Encadrement : 1 adulte pour 8-10 enfants\n- Matériel : cartes, jetons, déguisements pour les gardien·nes\n\nVariantes et adaptations selon l'âge et l'effectif.",
    type: "Projet",
    ageRange: "12-18 ans",
    duration: "Demi-journée",
    level: "Avancé",
    prepTime: "1h",
    visibility: "PUBLIC",
    themeNames: ["Grands jeux", "Environnement et nature"],
  },
  {
    title: "Répertoire de chants pour veillées",
    summary: "Collection de 25 chants traditionnels et modernes adaptés aux veillées",
    content: "Ce répertoire rassemble une sélection de chants faciles à apprendre et à animer lors des veillées. Chaque chant est accompagné de ses paroles complètes, de suggestions de gestes et d'indications pour l'animation.\n\nContenu du répertoire :\n- 10 chants traditionnels (Alouette, À la claire fontaine, etc.)\n- 10 chants à gestes (La danse des canards, Jean Petit qui danse, etc.)\n- 5 chants modernes adaptés (versions simplifiées)\n\nPour chaque chant :\n- Paroles complètes\n- Niveau de difficulté\n- Tranche d'âge recommandée\n- Suggestions de gestes et chorégraphies simples\n- Conseils d'animation\n- Variantes possibles\n\nConseils pour animer une veillée chantée :\n- Créer une ambiance chaleureuse\n- Alterner chants calmes et dynamiques\n- Impliquer les participant·es dans le choix\n- Adapter le rythme à l'énergie du groupe",
    type: "Article",
    ageRange: "Tous âges",
    duration: "1-2h",
    level: "Débutant",
    prepTime: "15 min",
    visibility: "PUBLIC",
    themeNames: ["Chants et musique", "Vie quotidienne"],
  },
  {
    title: "Formation BAFA : Connaissance de l'enfant",
    summary: "Module théorique sur le développement de l'enfant de 3 à 12 ans",
    content: "Ce module de formation aborde les fondamentaux du développement de l'enfant, indispensables pour adapter son animation aux besoins et capacités de chaque tranche d'âge.\n\nContenu du module :\n\n1. Développement physique et moteur\n- Évolution de la motricité globale et fine\n- Besoins en sommeil et alimentation\n- Développement sensoriel\n\n2. Développement cognitif\n- Stades de développement selon Piaget\n- Capacités d'attention et de concentration\n- Apprentissage et mémorisation\n\n3. Développement affectif et social\n- Construction de l'identité\n- Relations aux pairs et aux adultes\n- Gestion des émotions\n\n4. Implications pour l'animation\n- Adapter les activités à l'âge\n- Comprendre les comportements\n- Favoriser l'autonomie progressive\n- Gérer les conflits\n\nSupports pédagogiques :\n- Diaporama de présentation\n- Fiches récapitulatives par tranche d'âge\n- Études de cas pratiques\n- Bibliographie recommandée\n\nDurée : 3 heures\nPublic : Stagiaires BAFA en formation générale",
    type: "Kit clé en main",
    ageRange: "Tous âges",
    duration: "Demi-journée",
    level: "Intermédiaire",
    prepTime: "1h",
    visibility: "INTERNAL_IFAC",
    themeNames: ["Vie quotidienne", "Citoyenneté et vivre ensemble"],
  },
  {
    title: "Projet pédagogique : Séjour nature et découverte",
    summary: "Cadre complet pour organiser un séjour de 5 jours axé sur l'environnement",
    content: "Ce document propose un cadre méthodologique complet pour concevoir et mettre en œuvre un séjour nature et découverte de 5 jours pour un groupe de 24 enfants de 8 à 12 ans.\n\nStructure du projet :\n\n1. Présentation générale\n- Objectifs pédagogiques\n- Public visé et effectif\n- Lieu et période\n- Budget prévisionnel\n\n2. Organisation pratique\n- Planning type des journées\n- Répartition des chambres\n- Organisation des repas\n- Gestion du linge et de l'hygiène\n- Trousse de secours et protocoles\n\n3. Programme d'activités\n- Activités de découverte de la nature\n- Ateliers scientifiques\n- Grands jeux thématiques\n- Veillées\n- Temps calmes et autonomes\n\n4. Équipe d'encadrement\n- Composition et rôles\n- Réunions de préparation\n- Répartition des tâches\n- Communication interne\n\n5. Communication avec les familles\n- Réunion d'information préalable\n- Trousseau et documents\n- Nouvelles pendant le séjour\n- Bilan de fin de séjour\n\n6. Évaluation\n- Grilles d'évaluation des activités\n- Bilan avec les enfants\n- Bilan d'équipe\n- Retour aux familles\n\nAnnexes :\n- Modèles de documents (autorisation parentale, fiche sanitaire, etc.)\n- Fiches d'activités détaillées\n- Liste de matériel\n- Contacts utiles",
    type: "Projet",
    ageRange: "6-12 ans",
    duration: "Journée",
    level: "Avancé",
    prepTime: "1h",
    visibility: "INTERNAL_IFAC",
    themeNames: ["Environnement et nature", "Vie quotidienne"],
  },
  {
    title: "Atelier théâtre d'improvisation",
    summary: "Exercices progressifs pour initier les enfants au théâtre d'improvisation",
    content: "Cet atelier propose une progression pédagogique pour découvrir le théâtre d'improvisation de manière ludique et bienveillante.\n\nObjectifs :\n- Développer la confiance en soi\n- Stimuler la créativité et l'imagination\n- Travailler l'écoute et la réactivité\n- Favoriser l'expression orale et corporelle\n\nDéroulement de l'atelier (1h30) :\n\n1. Échauffement (20 min)\n- Exercices de désinhibition\n- Jeux de voix et d'articulation\n- Occupation de l'espace\n\n2. Exercices d'improvisation (40 min)\n- Improvisations courtes en binôme\n- Jeux avec contraintes (lieu, personnage, émotion)\n- Improvisations collectives\n\n3. Match d'improvisation (20 min)\n- Formation de deux équipes\n- Règles du match\n- Improvisation sur thèmes proposés\n\n4. Retour et partage (10 min)\n- Ressenti des participant·es\n- Points positifs observés\n- Encouragements\n\nConseils d'animation :\n- Créer un climat de confiance\n- Valoriser toutes les propositions\n- Adapter les exercices au niveau du groupe\n- Respecter le rythme de chacun·e",
    type: "Fiche",
    ageRange: "12-18 ans",
    duration: "1-2h",
    level: "Intermédiaire",
    prepTime: "15 min",
    visibility: "INTERNAL_IFAC",
    themeNames: ["Expression artistique", "Citoyenneté et vivre ensemble"],
  },
  {
    title: "Gestion des conflits entre enfants",
    summary: "Méthodes et outils pour gérer les situations conflictuelles en ACM",
    content: "Ce guide pratique propose des stratégies éprouvées pour prévenir et gérer les conflits entre enfants dans le cadre des accueils collectifs de mineurs.\n\nComprendre les conflits :\n- Origines fréquentes des conflits\n- Signes avant-coureurs\n- Rôle du développement de l'enfant\n- Distinction conflit / violence\n\nPrévention :\n- Établir un cadre clair et cohérent\n- Favoriser la communication bienveillante\n- Proposer des espaces de parole réguliers\n- Valoriser la coopération\n\nIntervention en situation de conflit :\n1. Sécuriser l'espace et les personnes\n2. Écouter chaque partie séparément\n3. Faciliter l'expression des émotions\n4. Aider à identifier le problème\n5. Chercher des solutions ensemble\n6. Accompagner la mise en œuvre\n7. Assurer un suivi\n\nOutils pratiques :\n- La météo des émotions\n- Le bâton de parole\n- Les messages \"Je\"\n- La médiation par les pairs\n- Le conseil d'enfants\n\nCas particuliers :\n- Conflits récurrents\n- Harcèlement\n- Violence physique\n- Implication des familles\n\nRessources complémentaires et formations recommandées.",
    type: "Article",
    ageRange: "Tous âges",
    duration: "30 min",
    level: "Avancé",
    prepTime: "5 min",
    visibility: "INTERNAL_IFAC",
    themeNames: ["Vie quotidienne", "Citoyenneté et vivre ensemble"],
  },
  {
    title: "Activités autour du recyclage créatif",
    summary: "15 idées d'ateliers pour sensibiliser au recyclage par la création artistique",
    content: "Cette ressource propose 15 ateliers créatifs utilisant des matériaux recyclés pour sensibiliser les enfants à l'environnement tout en développant leur créativité.\n\nPrincipes pédagogiques :\n- Valoriser les déchets comme ressources\n- Développer l'imagination et la créativité\n- Sensibiliser à l'écologie\n- Favoriser la motricité fine\n\nAteliers proposés :\n\n1. Instruments de musique (bouteilles, boîtes)\n2. Animaux en rouleaux de papier toilette\n3. Mobiles avec bouchons et capsules\n4. Cadres photo en carton\n5. Bijoux en papier magazine\n6. Pots à crayons décorés\n7. Marionnettes en chaussettes\n8. Mangeoires à oiseaux\n9. Décorations de Noël\n10. Masques en assiettes carton\n11. Voitures en briques de lait\n12. Fleurs en bouteilles plastique\n13. Tableaux en bouchons\n14. Jeux de société personnalisés\n15. Cabanes en carton\n\nPour chaque atelier :\n- Liste du matériel nécessaire\n- Étapes de réalisation illustrées\n- Durée et niveau de difficulté\n- Conseils et variantes\n\nConseils de collecte et de stockage des matériaux.",
    type: "Kit clé en main",
    ageRange: "6-12 ans",
    duration: "1-2h",
    level: "Débutant",
    prepTime: "30 min",
    visibility: "INTERNAL_IFAC",
    themeNames: ["Activités manuelles", "Environnement et nature", "Expression artistique"],
  },
  {
    title: "Organisation d'une journée olympiades",
    summary: "Kit complet pour organiser une journée sportive multi-épreuves",
    content: "Ce kit fournit tous les éléments nécessaires pour organiser une journée olympiades réussie, avec 12 épreuves variées adaptables selon l'âge et l'effectif.\n\nPrincipes d'organisation :\n- Rotation des équipes sur les ateliers\n- Système de points équitable\n- Valorisation de la participation\n- Esprit olympique et fair-play\n\nÉpreuves proposées :\n\n1. Course en sac\n2. Lancer de précision\n3. Parcours d'obstacles\n4. Relais avec objets\n5. Tir à la corde\n6. Course à trois jambes\n7. Chamboule-tout\n8. Slalom\n9. Saut en longueur\n10. Épreuve d'équilibre\n11. Lancer de poids (ballons)\n12. Course de vitesse\n\nMatériel nécessaire :\n- Liste complète par épreuve\n- Alternatives avec matériel simple\n- Système de balisage\n\nOrganisation pratique :\n- Planning de la journée\n- Constitution des équipes\n- Rotation sur les ateliers\n- Système de comptage des points\n- Cérémonie de remise des médailles\n\nEncadrement :\n- Rôles et responsabilités\n- Briefing de l'équipe\n- Gestion de la sécurité\n\nDocuments fournis :\n- Feuilles de scores\n- Diplômes et médailles à imprimer\n- Planning vierge à compléter",
    type: "Projet",
    ageRange: "6-12 ans",
    duration: "Journée",
    level: "Intermédiaire",
    prepTime: "1h",
    visibility: "INTERNAL_IFAC",
    themeNames: ["Jeux sportifs", "Grands jeux"],
  },
  {
    title: "Initiation à la photographie nature",
    summary: "Atelier découverte de la photographie en extérieur pour sensibiliser à l'environnement",
    content: "Cet atelier combine initiation à la photographie et découverte de la nature, permettant aux participant·es de porter un nouveau regard sur leur environnement.\n\nObjectifs :\n- Découvrir les bases de la photographie\n- Observer la nature avec attention\n- Développer la sensibilité artistique\n- Sensibiliser à la protection de l'environnement\n\nMatériel :\n- Appareils photo numériques ou smartphones\n- Carnet de notes\n- Guides d'identification (facultatif)\n\nDéroulement (2h) :\n\n1. Introduction (15 min)\n- Présentation des bases : cadrage, lumière, focus\n- Consignes de sécurité et respect de la nature\n- Présentation des thématiques\n\n2. Sortie photo (1h15)\nThématiques proposées :\n- Macro : insectes, fleurs, détails\n- Paysages et panoramas\n- Arbres et végétation\n- Jeux de lumière et d'ombre\n- Couleurs et textures\n\n3. Retour et partage (30 min)\n- Visionnage collectif des photos\n- Échanges sur les découvertes\n- Sélection des meilleures photos\n- Création d'une exposition éphémère\n\nProlongements possibles :\n- Création d'un herbier photographique\n- Réalisation d'un carnet nature\n- Exposition permanente\n- Concours photo\n\nConseils pour l'animateur·rice :\n- Préparer le parcours en amont\n- Identifier les sujets intéressants\n- Encourager l'observation patiente\n- Valoriser toutes les productions",
    type: "Fiche",
    ageRange: "12-18 ans",
    duration: "1-2h",
    level: "Intermédiaire",
    prepTime: "30 min",
    visibility: "INTERNAL_IFAC",
    themeNames: ["Environnement et nature", "Expression artistique"],
  },
  {
    title: "Conseil d'enfants : mise en place et animation",
    summary: "Guide méthodologique pour instaurer un conseil d'enfants participatif",
    content: "Ce guide accompagne les équipes dans la mise en place d'un conseil d'enfants, outil essentiel de participation et d'éducation à la citoyenneté.\n\nQu'est-ce qu'un conseil d'enfants ?\nLe conseil d'enfants est un temps de parole collectif où les participant·es peuvent s'exprimer sur la vie du groupe, proposer des idées, résoudre des problèmes et prendre des décisions ensemble.\n\nObjectifs pédagogiques :\n- Développer l'expression orale et l'écoute\n- Apprendre la démocratie par la pratique\n- Favoriser la coopération et la responsabilisation\n- Réguler la vie collective\n\nMise en place :\n\n1. Préparation\n- Définir le cadre et les règles\n- Choisir le moment et le lieu\n- Préparer le matériel (bâton de parole, cahier, etc.)\n\n2. Déroulement type (30-45 min)\n- Ouverture et rappel des règles\n- Tour de parole : \"Quoi de neuf ?\"\n- Points à l'ordre du jour\n- Propositions et décisions\n- Clôture et synthèse\n\n3. Rôles tournants\n- Président·e de séance\n- Secrétaire\n- Gardien·ne du temps\n- Gardien·ne des règles\n\nRègles de fonctionnement :\n- Respect de la parole de chacun·e\n- Utilisation du bâton de parole\n- Pas de jugement ni de moquerie\n- Confidentialité si nécessaire\n- Décisions prises collectivement\n\nThèmes abordables :\n- Organisation des activités\n- Résolution de conflits\n- Amélioration de la vie quotidienne\n- Projets collectifs\n- Règles de vie\n\nConseils pour l'animateur·rice :\n- Adopter une posture de facilitateur·rice\n- Garantir l'équité de parole\n- Aider à formuler sans imposer\n- Assurer le suivi des décisions\n- Évaluer régulièrement le dispositif\n\nVariantes selon l'âge :\n- 3-6 ans : conseil très court, ritualisé\n- 6-12 ans : conseil structuré avec rôles\n- 12-18 ans : conseil autonome avec adulte ressource",
    type: "Article",
    ageRange: "Tous âges",
    duration: "30 min",
    level: "Avancé",
    prepTime: "15 min",
    visibility: "INTERNAL_IFAC",
    themeNames: ["Citoyenneté et vivre ensemble", "Vie quotidienne"],
  },
];

async function seedDatabase() {
  console.log("🌱 Démarrage du seed de la base de données...\n");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    // 1. Insérer les thématiques
    console.log("📚 Insertion des thématiques...");
    const themeMap = new Map();
    
    for (const themeData of THEMES_DATA) {
      const result = await db.insert(themes).values(themeData);
      const themeId = Number(result[0].insertId);
      themeMap.set(themeData.name, themeId);
      console.log(`  ✓ ${themeData.name} (ID: ${themeId})`);
    }
    console.log(`\n✅ ${THEMES_DATA.length} thématiques insérées\n`);

    // 2. Insérer les ressources
    console.log("📖 Insertion des ressources...");
    let publicCount = 0;
    let internalCount = 0;

    for (const resourceData of RESOURCES_DATA) {
      const { themeNames, ...resourceFields } = resourceData;
      
      const result = await db.insert(resources).values(resourceFields);
      const resourceId = Number(result[0].insertId);

      // Associer les thématiques
      for (const themeName of themeNames) {
        const themeId = themeMap.get(themeName);
        if (themeId) {
          await db.insert(resourceThemes).values({
            resourceId,
            themeId,
          });
        }
      }

      if (resourceData.visibility === "PUBLIC") {
        publicCount++;
      } else {
        internalCount++;
      }

      console.log(`  ✓ ${resourceData.title} (${resourceData.visibility})`);
    }

    console.log(`\n✅ ${RESOURCES_DATA.length} ressources insérées`);
    console.log(`   - ${publicCount} ressources publiques`);
    console.log(`   - ${internalCount} ressources internes IFAC\n`);

    console.log("🎉 Seed terminé avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors du seed :", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedDatabase();
