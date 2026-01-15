import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronDown, Mail, Phone, MessageSquare, Search } from "lucide-react";
import { useState } from "react";

export default function Help() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      id: 1,
      question: "Comment créer un compte ?",
      answer: "Cliquez sur 'Se connecter' en haut à droite de la page d'accueil. Vous serez redirigé vers la page de connexion Manus où vous pourrez créer un nouveau compte avec votre email."
    },
    {
      id: 2,
      question: "Comment choisir mon profil ?",
      answer: "Une fois connecté, cliquez sur 'Choisir votre profil' sur la page d'accueil. Sélectionnez le profil qui correspond à votre rôle (Animateur, Formateur, Directeur ou Stagiaire) pour accéder aux ressources adaptées."
    },
    {
      id: 3,
      question: "Quelles ressources puis-je accéder ?",
      answer: "Les ressources disponibles dépendent de votre profil. Chaque profil a accès à des ressources spécifiquement sélectionnées pour ses besoins. Vous pouvez aussi utiliser la barre de recherche pour trouver des ressources spécifiques."
    },
    {
      id: 4,
      question: "Comment ajouter une ressource à ma bibliothèque ?",
      answer: "Sur chaque ressource, cliquez sur l'icône cœur (❤️) pour l'ajouter à votre bibliothèque. Vous pouvez accéder à votre bibliothèque en cliquant sur 'Ma bibliothèque' en haut à droite."
    },
    {
      id: 5,
      question: "Comment rechercher une ressource ?",
      answer: "Utilisez la barre de recherche sur la page d'accueil ou dans votre profil. Vous pouvez chercher par titre, description, ou mots-clés. Les résultats s'afficheront instantanément."
    },
    {
      id: 6,
      question: "Puis-je télécharger les ressources ?",
      answer: "Certaines ressources peuvent être téléchargées directement. Consultez les détails de chaque ressource pour voir les options de téléchargement disponibles."
    },
    {
      id: 7,
      question: "Comment contacter le support ?",
      answer: "Vous pouvez nous contacter via le formulaire de contact en bas de cette page, par email à contact@ifac.asso.fr, ou via les réseaux sociaux. Notre équipe répondra à vos questions dans les meilleurs délais."
    },
    {
      id: 8,
      question: "Les ressources sont-elles gratuites ?",
      answer: "Oui, toutes les ressources de la Ressourcerie IFAC sont gratuites pour les utilisateurs enregistrés. L'accès est réservé aux membres de la communauté IFAC."
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-12 px-4">
        <Breadcrumb items={[{ label: "Aide & FAQ" }]} />

        <div className="space-y-12">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold">Centre d'aide</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Trouvez les réponses à vos questions sur la Ressourcerie IFAC
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <CardTitle>Contactez-nous</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Une question ? Envoyez-nous un message directement.
                </p>
                <Button asChild className="w-full">
                  <a href="mailto:contact@ifac.asso.fr">Envoyer un email</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Phone className="h-6 w-6 text-primary" />
                  <CardTitle>Appelez-nous</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Préférez parler directement ? Appelez notre équipe.
                </p>
                <p className="font-semibold text-lg">À venir</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Mail className="h-6 w-6 text-primary" />
                  <CardTitle>Newsletter</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Recevez les mises à jour et nouvelles ressources.
                </p>
                <Button variant="outline" className="w-full">
                  S'abonner
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Search FAQ */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-4">Questions fréquemment posées</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <input
                  type="text"
                  placeholder="Chercher dans les FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* FAQ List */}
            <div className="space-y-3">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq) => (
                  <Card
                    key={faq.id}
                    className="cursor-pointer hover:shadow-md transition-all duration-300"
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{faq.question}</CardTitle>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                            expandedFaq === faq.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </CardHeader>
                    {expandedFaq === faq.id && (
                      <CardContent className="pt-0">
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </CardContent>
                    )}
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Aucune FAQ ne correspond à votre recherche. Veuillez réessayer ou nous contacter.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Form */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Vous n'avez pas trouvé la réponse ?</CardTitle>
              <CardDescription>
                Envoyez-nous votre question et notre équipe vous répondra au plus vite.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Votre nom"
                    className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="email"
                    placeholder="Votre email"
                    className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <textarea
                  placeholder="Votre message..."
                  rows={5}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button size="lg" className="w-full">
                  Envoyer le message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
