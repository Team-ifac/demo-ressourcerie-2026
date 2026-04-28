import {
  ClipboardList,
  Compass,
  Dices,
  Grid2x2,
  Sparkles,
  Target,
  Users,
  Wand2,
} from "lucide-react";

type ToolCard = {
  title: string;
  description: string;
  href?: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  isAvailable?: boolean;
};

const TOOL_CARDS: ToolCard[] = [
  {
    title: "Générateur de programme",
    description:
      "Construis un programme d’animation à partir de tes paramètres, de ta semaine type et d’une base riche d’activités.",
    href: "/tools/program-generator",
    badge: "Disponible",
    icon: Grid2x2,
    isAvailable: true,
  },
  {
    title: "Mode terrain",
    description:
      "Trouve rapidement une idée d’activité selon ton contexte, ton groupe et ton niveau d’énergie.",
    href: "/tools/terrain-mode",
    badge: "Disponible",
    icon: Compass,
    isAvailable: true,
  },
  {
    title: "Feu tricolore",
    description:
      "Lance un départ visuel rouge → orange → vert avec compte à rebours et signal final.",
    href: "/tools/traffic-light",
    badge: "Disponible",
    icon: Target,
    isAvailable: true,
  },
  {
    title: "Sablier",
    description:
      "Affiche un sablier animé pour rythmer un défi, une transition ou un temps court en animation.",
    href: "/tools/hourglass",
    badge: "Disponible",
    icon: Target,
    isAvailable: true,
  },
  {
    title: "Créateur d’équipes",
    description:
      "Constitue des équipes équilibrées en quelques secondes pour lancer une activité sans perdre de temps.",
    href: "/tools/team-generator",
    badge: "Disponible",
    icon: Users,
    isAvailable: true,
  },
  {
    title: "Générateur de binômes",
    description:
      "Crée des binômes rapidement pour les temps en duo, les échanges ou les mises en activité.",
    href: "/tools/binome-generator",
    badge: "Disponible",
    icon: Sparkles,
    isAvailable: true,
  },
  {
    title: "Défis / brise-glace",
    description:
      "Pioche des idées pour lancer un groupe, dynamiser un temps ou créer une ambiance conviviale.",
    href: "/tools/challenge-generator",
    badge: "Disponible",
    icon: Target,
    isAvailable: true,
  },
  {
    title: "Checklist intelligente",
    description:
      "Prépare ton matériel et sécurise ton organisation avec une checklist adaptée à la situation.",
    href: "/tools/checklist",
    badge: "Disponible",
    icon: ClipboardList,
    isAvailable: true,
  },
  {
    title: "Tirage dessin",
    description:
      "Lance rapidement une consigne ou un thème de dessin pour animer un temps créatif, un défi ou une mise en activité.",
    href: "/tools/draw",
    badge: "Disponible",
    icon: Wand2,
    isAvailable: true,
  },
  {
    title: "Lanceur de dés",
    description:
      "Utilise un lanceur de dés rapide pour des mécaniques de jeu, des choix ou des mini-défis.",
    href: "/tools/dice",
    badge: "Disponible",
    icon: Dices,
    isAvailable: true,
  },
  {
    title: "Roue aléatoire",
    description:
      "Fais tourner une roue de choix pour animer un tirage, répartir ou introduire une consigne.",
    href: "/tools/wheel",
    badge: "Disponible",
    icon: Wand2,
    isAvailable: true,
  },
  {
    title: "Générateur de code",
    description:
      "Crée des codes et des indices pour tes jeux, enquêtes et chasses au trésor avec un système de cadenas interactif.",
    href: "/tools/code-generator",
    badge: "Nouveau",
    icon: Sparkles,
    isAvailable: true,
  },
];

export default function AnimationTools() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-7xl px-6 py-12">
        <section className="rounded-[32px] border border-border/50 bg-background/70 px-8 py-10 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-[6px]">
          <div className="max-w-3xl space-y-4">
            <p className="w-fit rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Boîte à outils animation
            </p>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Des outils concrets pour préparer, construire et animer
              </h1>

              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                Cette page rassemble progressivement les outils pratiques de la
                ressourcerie. Chaque outil dispose de son propre espace pour offrir
                une utilisation plus claire, plus confortable et plus professionnelle.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {TOOL_CARDS.map((tool) => {
            const Icon = tool.icon;

            const cardContent = (
              <div className="flex h-full flex-col rounded-[28px] border border-border/50 bg-white/80 p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                      tool.isAvailable
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {tool.badge}
                  </span>
                </div>

                <div className="mt-5 flex-1 space-y-3">
                  <h2 className="text-lg font-semibold text-foreground">
                    {tool.title}
                  </h2>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-6">
                  {tool.isAvailable ? (
                    <span className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">
                      Ouvrir l’outil
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-border/60 bg-white px-4 py-2 text-sm font-medium text-slate-600">
                      Disponible bientôt
                    </span>
                  )}
                </div>
              </div>
            );

            if (tool.isAvailable && tool.href) {
              return (
            <a
            key={tool.title}
            href={tool.href}
            className="block"
            >
                  {cardContent}
                </a>
              );
            }

            return <div key={tool.title}>{cardContent}</div>;
          })}
        </section>
      </main>
    </div>
  );
}