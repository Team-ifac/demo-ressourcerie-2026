export type TerrainActivityCategory =
  | "rapide"
  | "calme"
  | "sansMateriel"
  | "groupeAgite";

export type TerrainActivity = {
  id: string;
  title: string;
  category: TerrainActivityCategory;
  age: string;
  duration: string;
  equipment: string;
  instruction: string;
};

export const terrainActivities: TerrainActivity[] = [
  {
    id: "rapide-1",
    title: "1, 2, 3 soleil",
    category: "rapide",
    age: "Tous âges",
    duration: "5 à 10 min",
    equipment: "Sans matériel",
    instruction:
      "Une personne se place face au mur. Le groupe avance quand elle ne regarde pas. Dès qu’elle se retourne, tout le monde doit s’immobiliser.",
  },
  {
    id: "rapide-2",
    title: "Jacques a dit",
    category: "rapide",
    age: "Tous âges",
    duration: "5 à 10 min",
    equipment: "Sans matériel",
    instruction:
      "Le groupe ne doit exécuter que les consignes précédées de “Jacques a dit”. Idéal pour relancer rapidement l’attention.",
  },
  {
    id: "rapide-3",
    title: "Statue musicale sans musique",
    category: "rapide",
    age: "Tous âges",
    duration: "5 à 10 min",
    equipment: "Sans matériel",
    instruction:
      "Les enfants se déplacent librement. Au signal, ils doivent se figer comme des statues dans la position où ils se trouvent.",
  },
  {
    id: "rapide-4",
    title: "Le chef d’orchestre",
    category: "rapide",
    age: "6 ans et +",
    duration: "10 min",
    equipment: "Sans matériel",
    instruction:
      "Une personne sort. Pendant ce temps, un meneur est désigné. Le groupe imite ses gestes. La personne revenue doit trouver qui dirige.",
  },
  {
    id: "rapide-5",
    title: "Ni oui ni non",
    category: "rapide",
    age: "6 ans et +",
    duration: "5 à 10 min",
    equipment: "Sans matériel",
    instruction:
      "Pose des questions rapides. Les joueurs doivent répondre sans dire “oui” ni “non”.",
  },
  {
    id: "rapide-6",
    title: "La chaîne des prénoms",
    category: "rapide",
    age: "Tous âges",
    duration: "5 à 10 min",
    equipment: "Sans matériel",
    instruction:
      "Chacun dit son prénom accompagné d’un geste. Le groupe répète avant de passer au suivant.",
  },
  {
    id: "rapide-7",
    title: "Le ballon imaginaire",
    category: "rapide",
    age: "Tous âges",
    duration: "5 min",
    equipment: "Sans matériel",
    instruction:
      "Un ballon imaginaire circule. Celui qui le reçoit change sa taille, son poids ou sa matière avant de l’envoyer à quelqu’un d’autre.",
  },
  {
    id: "rapide-8",
    title: "Couleurs express",
    category: "rapide",
    age: "Tous âges",
    duration: "5 min",
    equipment: "Sans matériel",
    instruction:
      "Annonce une couleur. Les enfants doivent toucher rapidement un objet de cette couleur dans l’espace.",
  },
  {
    id: "rapide-9",
    title: "Le compte collectif",
    category: "rapide",
    age: "8 ans et +",
    duration: "5 à 10 min",
    equipment: "Sans matériel",
    instruction:
      "Le groupe doit compter jusqu’à 10, 20 ou 30 sans ordre défini. Si deux personnes parlent en même temps, on recommence.",
  },
  {
    id: "rapide-10",
    title: "Le mot interdit",
    category: "rapide",
    age: "8 ans et +",
    duration: "5 à 10 min",
    equipment: "Sans matériel",
    instruction:
      "Choisis un mot interdit. Pendant un échange rapide, personne ne doit le prononcer.",
  },
  {
    id: "rapide-11",
    title: "Les statues émotions",
    category: "rapide",
    age: "Tous âges",
    duration: "5 à 10 min",
    equipment: "Sans matériel",
    instruction:
      "Annonce une émotion. Les enfants doivent prendre une pose de statue qui la représente.",
  },
  {
    id: "rapide-12",
    title: "Top chrono gestes",
    category: "rapide",
    age: "Tous âges",
    duration: "5 min",
    equipment: "Sans matériel",
    instruction:
      "En 30 secondes, chacun doit inventer un geste original. Puis tout le groupe essaye de les reproduire.",
  },
  {
    id: "calme-1",
    title: "Jeu du silence",
    category: "calme",
    age: "Tous âges",
    duration: "3 à 5 min",
    equipment: "Sans matériel",
    instruction:
      "Le groupe essaie de rester silencieux pendant un temps donné. On peut ajouter un défi : entendre un son précis dans la pièce ou dehors.",
  },
  {
    id: "calme-2",
    title: "Le miroir",
    category: "calme",
    age: "Tous âges",
    duration: "5 à 10 min",
    equipment: "Sans matériel",
    instruction:
      "Par deux, une personne bouge lentement et l’autre imite exactement comme dans un miroir. Puis on inverse.",
  },
  {
    id: "calme-3",
    title: "Respiration ballon",
    category: "calme",
    age: "Tous âges",
    duration: "3 à 5 min",
    equipment: "Sans matériel",
    instruction:
      "Les enfants posent les mains sur le ventre et imaginent gonfler un ballon en inspirant, puis le dégonfler lentement en expirant.",
  },
  {
    id: "calme-4",
    title: "Histoire minute",
    category: "calme",
    age: "Tous âges",
    duration: "5 min",
    equipment: "Sans matériel",
    instruction:
      "Lis ou raconte une très courte histoire en demandant au groupe de fermer les yeux et d’écouter jusqu’au bout sans parler.",
  },
  {
    id: "calme-5",
    title: "Écoute des sons",
    category: "calme",
    age: "Tous âges",
    duration: "3 à 5 min",
    equipment: "Sans matériel",
    instruction:
      "Pendant une minute, le groupe écoute les sons autour de lui. Ensuite chacun partage un son qu’il a entendu.",
  },
  {
    id: "calme-6",
    title: "Dessiner dans l’air",
    category: "calme",
    age: "Tous âges",
    duration: "5 min",
    equipment: "Sans matériel",
    instruction:
      "Les enfants dessinent lentement des formes ou des lettres dans l’air avec un doigt ou avec tout le bras.",
  },
  {
    id: "calme-7",
    title: "La plume imaginaire",
    category: "calme",
    age: "Tous âges",
    duration: "3 à 5 min",
    equipment: "Sans matériel",
    instruction:
      "Chacun imagine une plume posée sur sa main et doit souffler doucement dessus sans faire de bruit.",
  },
  {
    id: "calme-8",
    title: "Massage des épaules en cercle",
    category: "calme",
    age: "6 ans et +",
    duration: "5 min",
    equipment: "Sans matériel",
    instruction:
      "En cercle, chacun masse doucement les épaules de la personne devant lui, puis on inverse le sens.",
  },
  {
    id: "calme-9",
    title: "La météo intérieure",
    category: "calme",
    age: "6 ans et +",
    duration: "5 à 10 min",
    equipment: "Sans matériel",
    instruction:
      "Chaque enfant décrit son humeur du moment comme une météo : soleil, nuage, vent, pluie…",
  },
  {
    id: "calme-10",
    title: "Étirements guidés",
    category: "calme",
    age: "Tous âges",
    duration: "5 min",
    equipment: "Sans matériel",
    instruction:
      "Propose quelques étirements lents : bras vers le ciel, épaules, dos, respiration lente entre chaque mouvement.",
  },
  {
    id: "sans-materiel-1",
    title: "Pierre feuille ciseaux géant",
    category: "sansMateriel",
    age: "Tous âges",
    duration: "5 à 10 min",
    equipment: "Sans matériel",
    instruction:
      "Deux équipes choisissent ensemble pierre, feuille ou ciseaux puis viennent se confronter au centre.",
  },
  {
    id: "sans-materiel-2",
    title: "Mime collectif",
    category: "sansMateriel",
    age: "Tous âges",
    duration: "10 min",
    equipment: "Sans matériel",
    instruction:
      "Une personne mime un objet, un métier ou un animal pendant que le groupe essaie de deviner.",
  },
  {
    id: "sans-materiel-3",
    title: "Chef d’orchestre",
    category: "sansMateriel",
    age: "6 ans et +",
    duration: "10 min",
    equipment: "Sans matériel",
    instruction:
      "Le groupe imite un meneur secret pendant qu’un joueur doit le retrouver.",
  },
  {
    id: "sans-materiel-4",
    title: "Béret sans objet",
    category: "sansMateriel",
    age: "6 ans et +",
    duration: "10 à 15 min",
    equipment: "Sans matériel",
    instruction:
      "Deux numéros identiques sont appelés, les joueurs doivent atteindre une zone centrale puis revenir avant l’autre.",
  },
  {
    id: "sans-materiel-5",
    title: "Le facteur n’est pas passé",
    category: "sansMateriel",
    age: "Tous âges",
    duration: "10 min",
    equipment: "Sans matériel",
    instruction:
      "En ronde, un joueur tourne autour et dépose discrètement un objet imaginaire derrière quelqu’un qui doit partir en poursuite.",
  },
  {
    id: "sans-materiel-6",
    title: "Chat glacé",
    category: "sansMateriel",
    age: "Tous âges",
    duration: "10 min",
    equipment: "Sans matériel",
    instruction:
      "Les joueurs touchés deviennent immobiles jusqu’à ce qu’un camarade les délivre.",
  },
  {
    id: "sans-materiel-7",
    title: "Le ninja",
    category: "sansMateriel",
    age: "8 ans et +",
    duration: "5 à 10 min",
    equipment: "Sans matériel",
    instruction:
      "En cercle, chacun tente à tour de rôle de toucher la main d’un autre en un seul mouvement rapide.",
  },
  {
    id: "sans-materiel-8",
    title: "Le téléphone arabe",
    category: "sansMateriel",
    age: "Tous âges",
    duration: "5 à 10 min",
    equipment: "Sans matériel",
    instruction:
      "Une phrase est murmurée de personne en personne jusqu’au dernier qui la dit à voix haute.",
  },
  {
    id: "sans-materiel-9",
    title: "Le gardien du trésor",
    category: "sansMateriel",
    age: "6 ans et +",
    duration: "10 min",
    equipment: "Sans matériel",
    instruction:
      "Un gardien ferme les yeux pendant qu’un joueur essaie d’approcher sans bruit pour récupérer le trésor imaginaire.",
  },
  {
    id: "sans-materiel-10",
    title: "Qui manque ?",
    category: "sansMateriel",
    age: "Tous âges",
    duration: "5 min",
    equipment: "Sans matériel",
    instruction:
      "Un joueur ferme les yeux. Quelqu’un se cache. Il doit deviner qui manque quand il rouvre les yeux.",
  },
  {
    id: "groupe-agite-1",
    title: "Retour au calme en cercle",
    category: "groupeAgite",
    age: "Tous âges",
    duration: "3 à 5 min",
    equipment: "Sans matériel",
    instruction:
      "Fais asseoir ou mettre debout le groupe en cercle, demande le silence progressif, puis donne une consigne simple et rassurante.",
  },
  {
    id: "groupe-agite-2",
    title: "Jeu du miroir",
    category: "groupeAgite",
    age: "Tous âges",
    duration: "5 min",
    equipment: "Sans matériel",
    instruction:
      "Par deux, les mouvements doivent être lents et synchronisés. Très utile pour faire redescendre l’énergie.",
  },
  {
    id: "groupe-agite-3",
    title: "Respiration 4 temps",
    category: "groupeAgite",
    age: "6 ans et +",
    duration: "3 min",
    equipment: "Sans matériel",
    instruction:
      "Inspirer sur 4 temps, bloquer 2 temps, expirer sur 4 temps. Refaire 3 à 5 fois avec le groupe.",
  },
  {
    id: "groupe-agite-4",
    title: "Les statues lentes",
    category: "groupeAgite",
    age: "Tous âges",
    duration: "5 min",
    equipment: "Sans matériel",
    instruction:
      "Au signal, tout le monde se transforme en statue. Puis chacun reprend ses mouvements très lentement.",
  },
  {
    id: "groupe-agite-5",
    title: "Le chef du calme",
    category: "groupeAgite",
    age: "Tous âges",
    duration: "5 min",
    equipment: "Sans matériel",
    instruction:
      "Une personne fait des gestes lents, le groupe les reproduit en silence.",
  },
  {
    id: "groupe-agite-6",
    title: "Marche silencieuse",
    category: "groupeAgite",
    age: "Tous âges",
    duration: "5 min",
    equipment: "Sans matériel",
    instruction:
      "Les enfants marchent dans l’espace en essayant de ne faire aucun bruit. Variante : s’arrêter dès qu’ils entendent un signal.",
  },
  {
    id: "groupe-agite-7",
    title: "Le cercle des prénoms calmes",
    category: "groupeAgite",
    age: "Tous âges",
    duration: "5 min",
    equipment: "Sans matériel",
    instruction:
      "Chacun dit son prénom avec une voix très douce et un geste lent, repris par le groupe.",
  },
  {
    id: "groupe-agite-8",
    title: "L’objet imaginaire fragile",
    category: "groupeAgite",
    age: "Tous âges",
    duration: "5 min",
    equipment: "Sans matériel",
    instruction:
      "Le groupe se passe un objet imaginaire très fragile, en silence, avec beaucoup de délicatesse.",
  },
  {
    id: "groupe-agite-9",
    title: "Compte à rebours collectif",
    category: "groupeAgite",
    age: "8 ans et +",
    duration: "3 à 5 min",
    equipment: "Sans matériel",
    instruction:
      "Le groupe doit compter à rebours ensemble, calmement, sans crier et sans se couper.",
  },
  {
    id: "groupe-agite-10",
    title: "Ligne imaginaire",
    category: "groupeAgite",
    age: "Tous âges",
    duration: "5 min",
    equipment: "Sans matériel",
    instruction:
      "Demande au groupe de se replacer en silence sur une ligne selon un critère simple : taille, mois de naissance, ordre alphabétique.",
  },
];