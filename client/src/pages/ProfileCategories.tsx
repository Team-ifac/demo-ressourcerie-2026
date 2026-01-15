import { useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PROFILE_CATEGORIES, ProfileType } from "../../../shared/categories";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

const PROFILE_INFO: Record<
  ProfileType,
  { title: string; description: string; image: string }
> = {
  animateur: {
    title: "Animateur·rice",
    description: "Explorez les ressources par catégorie pour enrichir vos animations",
    image: "/profil-animateur.png",
  },
  formateur: {
    title: "Formateur·rice",
    description: "Accédez aux supports de formation et approfondissements",
    image: "/profil-formateur.png",
  },
  directeur: {
    title: "Directeur·rice",
    description: "Trouvez les outils de gestion et management adaptés",
    image: "/profil-directeur.png",
  },
  stagiaire: {
    title: "Stagiaire BAFA/BAFD",
    description: "Découvrez les ressources pour réussir votre formation",
    image: "/profil-stagiaire.png",
  },
  decouvrir: {
    title: "Découvrir",
    description: "Explorez l'univers de l'animation pédagogique",
    image: "/profil-decouvrir.png",
  },
};

// Map des alias URL -> ProfileType canonique
const PROFILE_ALIASES: Record<string, ProfileType> = {
  animateur: "animateur",
  formateur: "formateur",
  directeur: "directeur",
  stagiaire: "stagiaire",

  // Alias probables pour "stagiaire"
  stagiaire_bafa: "stagiaire",
  "stagiaire-bafa": "stagiaire",
  stagiairebafa: "stagiaire",
  stagiaire_bafd: "stagiaire",
  "stagiaire-bafd": "stagiaire",

  decouvrir: "decouvrir",
};

function normalizeProfileSlug(slug: string | undefined): ProfileType | null {
  if (!slug) return null;

  const raw = String(slug).trim().toLowerCase();

  if (raw in PROFILE_ALIASES) return PROFILE_ALIASES[raw];

  const cleaned = raw.replace(/\s+/g, "_");
  if (cleaned in PROFILE_ALIASES) return PROFILE_ALIASES[cleaned];

  return null;
}

export default function ProfileCategories() {
  const params = useParams();
  const [, navigate] = useLocation();

  // Source fiable côté serveur : si pas connecté => me = null/undefined
  const { data: me, isLoading: meLoading } = trpc.auth.me.useQuery();

  // ✅ Règle : si pas connecté, on renvoie vers la page “Bienvenue”
  useEffect(() => {
    if (!meLoading && !me) {
      navigate("/auth/choice");
    }
  }, [meLoading, me, navigate]);

  // Pendant le chargement, on affiche rien (évite un flash de contenu)
  if (meLoading) return null;

  // Si pas connecté, on ne rend pas la page (la redirection est en cours)
  if (!me) return null;

  const profileId = normalizeProfileSlug(params.profile);

  if (!profileId || !(profileId in PROFILE_CATEGORIES)) {
    return (
      <div className="container py-12">
        <p className="text-center text-muted-foreground">Profil non trouvé</p>
      </div>
    );
  }

  const profileInfo = PROFILE_INFO[profileId];
  const categories = PROFILE_CATEGORIES[profileId];

  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: profileInfo.title },
        ]}
      />

      {/* Hero Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-48 h-48 rounded-lg overflow-hidden shadow-elegant flex-shrink-0">
              <img
                src={profileInfo.image}
                alt={profileInfo.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-4">{profileInfo.title}</h1>
              <p className="text-xl text-muted-foreground">
                {profileInfo.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12 px-4">
        <div className="container max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Choisissez une catégorie
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/categorie/profil/${profileId}/${encodeURIComponent(
                  category
                )}`}
              >
                <Card className="h-full hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                  <CardContent className="p-6 flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-lg flex-1">{category}</h3>
                    <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/ressources">
              <button className="text-primary hover:underline">
                Voir toutes les ressources sans filtre →
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
