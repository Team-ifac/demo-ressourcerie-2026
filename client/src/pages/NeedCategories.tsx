import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/Breadcrumb";
import { NEED_CATEGORIES, NeedType } from "../../../shared/categories";
import { ArrowRight } from "lucide-react";

const NEED_INFO: Record<NeedType, { title: string; description: string; image: string }> = {
  preparer: {
    title: "Préparer rapidement",
    description: "Trouvez des solutions express pour vos animations",
    image: "/besoin-preparer.png",
  },
  projet: {
    title: "Monter un projet",
    description: "Construisez des projets complets et structurés",
    image: "/besoin-projet.png",
  },
  gerer: {
    title: "Gérer une situation",
    description: "Trouvez des outils pour gérer les situations délicates",
    image: "/besoin-gerer.png",
  },
  competences: {
    title: "Monter en compétences",
    description: "Développez vos connaissances et votre expertise",
    image: "/besoin-competences.png",
  },
};

export default function NeedCategories() {
  const params = useParams();
  const needId = params.need as NeedType;

  if (!needId || !(needId in NEED_CATEGORIES)) {
    return (
      <div className="container py-12">
        <p className="text-center text-muted-foreground">Besoin non trouvé</p>
      </div>
    );
  }

  const needInfo = NEED_INFO[needId];
  const categories = NEED_CATEGORIES[needId];

  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: needInfo.title },
        ]}
      />

      {/* Hero Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-48 h-48 rounded-lg overflow-hidden shadow-elegant flex-shrink-0">
              <img
                src={needInfo.image}
                alt={needInfo.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-4">{needInfo.title}</h1>
              <p className="text-xl text-muted-foreground">{needInfo.description}</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/categorie/besoin/${needId}/${encodeURIComponent(category)}`}
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
