import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle2, ArrowRight, BookOpen, Users, Briefcase, GraduationCap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

// Icônes par niveau
const iconMap: Record<string, any> = {
  "Débutant": Users,
  "Avancé": BookOpen,
  "Expert": Briefcase,
};

// Couleurs par niveau
const colorMap: Record<string, string> = {
  "Débutant": "from-blue-500 to-blue-600",
  "Avancé": "from-purple-500 to-purple-600",
  "Expert": "from-orange-500 to-orange-600",
};

export default function LearningPaths() {
  // Charger les données depuis le CMS
  const { data: cmsPage, isLoading, error } = trpc.cms.getPage.useQuery({ slug: "parcours" });

  // Données par défaut si le CMS n'a pas de données
  const defaultPaths = [
    {
      id: "animator-beginner",
      title: "Débuter en animation",
      description: "Parcours complet pour les nouveaux animateurs",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      steps: [
        { title: "Les bases de l'animation", description: "Comprendre les principes fondamentaux" },
        { title: "Gérer un groupe", description: "Techniques de gestion de groupe" },
        { title: "Animer des activités", description: "Créer et animer des activités engageantes" },
        { title: "Évaluer et adapter", description: "Mesurer l'impact et adapter votre approche" }
      ],
      duration: "4-6 semaines",
      level: "Débutant"
    },
    {
      id: "trainer-advanced",
      title: "Devenir formateur expert",
      description: "Parcours avancé pour les formateurs confirmés",
      icon: BookOpen,
      color: "from-purple-500 to-purple-600",
      steps: [
        { title: "Pédagogie avancée", description: "Approches pédagogiques innovantes" },
        { title: "Conception de formations", description: "Créer des formations efficaces" },
        { title: "Outils numériques", description: "Intégrer le digital dans vos formations" },
        { title: "Évaluation et certification", description: "Certifier les apprentissages" }
      ],
      duration: "8-10 semaines",
      level: "Avancé"
    },
    {
      id: "director-management",
      title: "Gestion et leadership",
      description: "Parcours pour les directeurs et managers",
      icon: Briefcase,
      color: "from-orange-500 to-orange-600",
      steps: [
        { title: "Leadership stratégique", description: "Développer votre vision stratégique" },
        { title: "Gestion d'équipe", description: "Motiver et développer votre équipe" },
        { title: "Gestion financière", description: "Budgets et ressources" },
        { title: "Qualité et conformité", description: "Standards et certifications" }
      ],
      duration: "10-12 semaines",
      level: "Expert"
    },
    {
      id: "intern-start",
      title: "Débuter mon BAFA/BAFD",
      description: "Parcours pour les stagiaires en formation",
      icon: GraduationCap,
      color: "from-green-500 to-green-600",
      steps: [
        { title: "Préparation au BAFA", description: "Tout ce qu'il faut savoir avant de commencer" },
        { title: "Fondamentaux de l'animation", description: "Les bases essentielles" },
        { title: "Ressources par thème", description: "Thèmes spécifiques du BAFA" },
        { title: "Conseils et astuces", description: "Réussir votre formation" }
      ],
      duration: "3-4 semaines",
      level: "Débutant"
    }
  ];

  // Transformer les sections du CMS en format de parcours
  const getPaths = () => {
    if (!cmsPage || !cmsPage.sections) {
      return defaultPaths;
    }

    const parcoursSections = cmsPage.sections.filter((s: any) => s.type === "parcours");
    
    if (parcoursSections.length === 0) {
      return defaultPaths;
    }

    return parcoursSections.map((section, index) => {
      const content = section.content as any;
      const level = content.level || "Débutant";
      
      return {
        id: section.id,
        title: content.title || "Sans titre",
        description: content.subtitle || "Description du parcours",
        icon: iconMap[level] || Users,
        color: colorMap[level] || "from-blue-500 to-blue-600",
        steps: (content.steps || []).map((step: any) => ({
          title: step.title || "Étape sans titre",
          description: step.description || "Description de l'étape"
        })),
        duration: content.duration || "Durée non spécifiée",
        level: level,
        buttonText: content.buttonText || "Commencer le parcours",
        buttonLink: content.buttonLink || "#"
      };
    });
  };

  const paths = getPaths();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto py-12 px-4">
          <div className="space-y-12">
            <div className="space-y-4">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-6 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-96" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-12 px-4">
        <Breadcrumb items={[{ label: "Parcours recommandés" }]} />

        <div className="space-y-12">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold">{cmsPage?.title || "Parcours d'apprentissage"}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              {cmsPage?.description || "Suivez un parcours structuré adapté à votre profil et vos objectifs"}
            </p>
          </div>

          {/* Paths Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {paths.map((path) => {
              const IconComponent = path.icon;
              return (
                <Card key={path.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden">
                  {/* Header with gradient */}
                  <div className={`bg-gradient-to-r ${path.color} p-6 text-white`}>
                    <div className="flex items-start justify-between mb-4">
                      <IconComponent className="h-8 w-8" />
                      <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
                        {path.level}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{path.title}</h3>
                    <p className="text-white/90">{path.description}</p>
                  </div>

                  <CardContent className="p-6">
                    {/* Duration */}
                    <div className="mb-6 pb-6 border-b">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Durée estimée :</span> {path.duration}
                      </p>
                    </div>

                    {/* Steps */}
                    <div className="space-y-4 mb-6">
                      <h4 className="font-semibold text-lg">Étapes du parcours</h4>
                      <div className="space-y-3">
                        {path.steps.map((step: any, index: number) => (
                          <div key={index} className="flex gap-3">
                            <div className="flex-shrink-0">
                              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{step.title}</p>
                              <p className="text-xs text-muted-foreground">{step.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <Button className="w-full gap-2">
                      Commencer le parcours
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional Info */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Comment utiliser ces parcours ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Suivez à votre rythme</h4>
                    <p className="text-sm text-muted-foreground">
                      Complétez les étapes dans l'ordre qui vous convient
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Accédez aux ressources</h4>
                    <p className="text-sm text-muted-foreground">
                      Chaque étape propose des ressources sélectionnées
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Progressez et célébrez</h4>
                    <p className="text-sm text-muted-foreground">
                      Suivez votre progression et obtenez des badges
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
