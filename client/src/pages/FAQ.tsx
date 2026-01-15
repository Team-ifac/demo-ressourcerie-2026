import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: "1",
    category: "Général",
    question: "Qu'est-ce que la Ressourcerie IFAC ?",
    answer:
      "La Ressourcerie IFAC est une plateforme collaborative qui centralise les ressources pédagogiques pour l'animation, la formation et l'éducation. Elle permet aux professionnels de découvrir, partager et améliorer collectivement les contenus d'animation.",
  },
  {
    id: "2",
    category: "Général",
    question: "Qui peut accéder à la Ressourcerie IFAC ?",
    answer:
      "La Ressourcerie IFAC est accessible à tous les professionnels de l'éducation, de l'animation et de la formation. Vous pouvez consulter les ressources publiques sans créer de compte, mais la création d'un compte vous permet d'accéder à des fonctionnalités supplémentaires.",
  },
  {
    id: "3",
    category: "Ressources",
    question: "Comment trouver une ressource spécifique ?",
    answer:
      "Vous pouvez utiliser la barre de recherche avancée pour chercher par mots-clés, tags, thématiques ou catégories. Vous pouvez également parcourir les collections ou consulter les ressources recommandées selon votre profil.",
  },
  {
    id: "4",
    category: "Ressources",
    question: "Comment télécharger une ressource ?",
    answer:
      "Chaque ressource dispose d'un bouton de téléchargement. Vous pouvez télécharger la ressource au format PDF ou l'exporter dans d'autres formats selon les options disponibles.",
  },
  {
    id: "5",
    category: "Contribution",
    question: "Comment proposer une nouvelle ressource ?",
    answer:
      "Cliquez sur le bouton 'Contribuer' dans le menu principal. Remplissez le formulaire de soumission avec les informations de votre ressource. Votre contribution sera examinée par notre équipe de modération avant d'être publiée.",
  },
  {
    id: "6",
    category: "Contribution",
    question: "Quels types de ressources puis-je partager ?",
    answer:
      "Vous pouvez partager des fiches d'activités, des guides de formation, des projets pédagogiques, des outils d'animation, des articles, des vidéos et tout autre contenu pertinent pour les professionnels de l'éducation.",
  },
  {
    id: "7",
    category: "Compte",
    question: "Comment créer un compte ?",
    answer:
      "Cliquez sur le bouton 'Se connecter' en haut à droite et sélectionnez 'Créer un compte'. Vous pouvez vous inscrire avec votre email ou via Manus OAuth.",
  },
  {
    id: "8",
    category: "Compte",
    question: "Comment modifier mon profil ?",
    answer:
      "Cliquez sur votre avatar en haut à droite et sélectionnez 'Paramètres'. Vous pouvez modifier vos informations personnelles, vos préférences de notification et vos paramètres de sécurité.",
  },
  {
    id: "9",
    category: "Sécurité",
    question: "Comment activer l'authentification 2FA ?",
    answer:
      "Allez dans Paramètres > Sécurité et cliquez sur 'Activer 2FA'. Scannez le code QR avec votre application d'authentification (Google Authenticator, Authy, etc.) et entrez le code généré.",
  },
  {
    id: "10",
    category: "Données",
    question: "Comment exporter mes données personnelles ?",
    answer:
      "Allez dans Paramètres > Données et cliquez sur 'Exporter mes données'. Vous recevrez un fichier ZIP contenant toutes vos informations personnelles et vos ressources favorites.",
  },
];

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = Array.from(new Set(faqItems.map((item) => item.category)));

  const filteredItems = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedItems = categories.reduce(
    (acc, category) => {
      acc[category] = filteredItems.filter((item) => item.category === category);
      return acc;
    },
    {} as Record<string, FAQItem[]>
  );

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">Questions fréquemment posées</h1>
          <p className="text-muted-foreground mt-2">
            Trouvez les réponses aux questions les plus courantes sur la Ressourcerie IFAC
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Input
            type="search"
            placeholder="Rechercher une question..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* FAQ Items */}
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-2xl font-bold mb-4">{category}</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="w-full text-left"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="text-lg">{item.question}</CardTitle>
                          <ChevronDown
                            className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
                              expandedId === item.id ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </CardHeader>
                    </button>

                    {expandedId === item.id && (
                      <CardContent className="pt-0">
                        <p className="text-muted-foreground">{item.answer}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Aucune question trouvée pour votre recherche.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact Section */}
        <div className="mt-16 bg-primary/5 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Vous n'avez pas trouvé votre réponse ?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            N'hésitez pas à nous contacter. Notre équipe est là pour vous aider et répondre à vos questions.
          </p>
          <Button size="lg">Nous contacter</Button>
        </div>
      </div>
    </div>
  );
}
