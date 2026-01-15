import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Target, Heart, Award, Lightbulb, Globe, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

export default function About() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendContactMutation = trpc.contact.send.useMutation({
    onSuccess: () => {
      toast.success("Message envoy\u00e9 !", {
        description: "Nous vous r\u00e9pondrons dans les plus brefs d\u00e9lais.",
      });
      // R\u00e9initialiser le formulaire
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast.error("Erreur lors de l'envoi", {
        description: error.message,
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    sendContactMutation.mutate({ name, email, subject, message });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8">
        <div className="container space-y-12">
          <Breadcrumb items={[{ label: "À propos" }]} />

          {/* Hero Section */}
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">À propos de l'IFAC</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              L'Institut de Formation, d'Animation et de Conseil accompagne depuis plus de 40 ans 
              les acteurs·rices de l'éducation populaire et de l'animation socioculturelle dans 
              leur développement professionnel et personnel.
            </p>
          </div>

          {/* Mission Section */}
          <div className="max-w-5xl mx-auto">
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Target className="h-8 w-8 text-primary" />
                  <CardTitle className="text-3xl">Notre mission</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-foreground">
                <p className="text-lg leading-relaxed">
                  L'IFAC s'engage à former des professionnel·les compétent·es et engagé·es, capables 
                  d'accompagner les publics dans leur épanouissement personnel et collectif. Notre mission 
                  s'articule autour de trois axes fondamentaux : la formation initiale et continue, 
                  l'accompagnement des structures éducatives, et la production de ressources pédagogiques 
                  innovantes et accessibles.
                </p>
                <p className="text-lg leading-relaxed">
                  La Ressourcerie IFAC s'inscrit dans cette démarche en offrant un espace numérique 
                  collaboratif où formateurs·rices, animateurs·rices, directeurs·rices et stagiaires 
                  peuvent accéder à des contenus de qualité, partager leurs pratiques et enrichir 
                  collectivement le patrimoine pédagogique de l'animation socioculturelle.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Histoire Section */}
          <div className="max-w-5xl mx-auto">
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <CardTitle className="text-3xl">Notre histoire</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-foreground">
                <p className="text-lg leading-relaxed">
                  Fondé dans les années 1980, l'IFAC est né de la volonté de professionnel·les de 
                  l'animation de structurer et de professionnaliser le secteur de l'éducation populaire. 
                  Depuis sa création, l'institut a formé des milliers d'animateurs·rices et de 
                  directeurs·rices, contribuant ainsi au développement d'une animation de qualité sur 
                  l'ensemble du territoire.
                </p>
                <p className="text-lg leading-relaxed">
                  Au fil des décennies, l'IFAC a su évoluer pour répondre aux transformations de la 
                  société et aux nouveaux enjeux de l'éducation. L'institut a développé une expertise 
                  reconnue dans les domaines de la petite enfance, de l'accueil de loisirs, des séjours 
                  de vacances, et de l'animation socioculturelle. La création de la Ressourcerie IFAC 
                  en 2025 marque une nouvelle étape dans notre engagement pour la diffusion des savoirs 
                  et le partage des pratiques professionnelles.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Valeurs Section */}
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Nos valeurs</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Les principes qui guident notre action quotidienne et inspirent notre pédagogie
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Éducation populaire</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Nous croyons en une éducation émancipatrice qui valorise les savoirs de chacun·e 
                    et favorise l'engagement citoyen et la transformation sociale.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader>
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Heart className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Inclusion et diversité</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Nous promouvons une animation inclusive qui accueille et valorise la diversité 
                    des publics, des cultures et des parcours de vie.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader>
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Lightbulb className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Innovation pédagogique</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Nous encourageons l'expérimentation et la créativité dans les pratiques 
                    pédagogiques pour répondre aux défis contemporains de l'éducation.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader>
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Award className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Excellence et qualité</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Nous nous engageons à offrir des formations et des ressources de haute qualité, 
                    régulièrement actualisées et adaptées aux réalités du terrain.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader>
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Globe className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Coopération</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Nous valorisons le travail collaboratif, le partage d'expériences et la 
                    construction collective des savoirs professionnels.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader>
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Target className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Nous formons des professionnel·les engagé·es, conscient·es de leur rôle social 
                    et de leur responsabilité éducative auprès des publics.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Équipe Section */}
          <div className="max-w-5xl mx-auto">
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-8 w-8 text-primary" />
                  <CardTitle className="text-3xl">Notre équipe</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-foreground">
                <p className="text-lg leading-relaxed">
                  L'équipe de l'IFAC est composée de formateurs·rices et de professionnel·les 
                  expérimenté·es, issu·es de parcours variés dans les domaines de l'animation, de 
                  l'éducation, du travail social et de la formation d'adultes. Chaque membre de 
                  l'équipe apporte son expertise spécifique et son engagement pour accompagner au 
                  mieux les stagiaires et les structures partenaires.
                </p>
                <p className="text-lg leading-relaxed">
                  Notre équipe pédagogique intervient sur l'ensemble des formations proposées par 
                  l'institut : BAFA (Formation Générale et Approfondissements), BAFD, formations 
                  professionnelles continues, et accompagnement de projets éducatifs. Nous travaillons 
                  en étroite collaboration avec un réseau de formateurs·rices associé·es et de 
                  partenaires institutionnels pour garantir la qualité et la pertinence de nos actions.
                </p>
                <div className="bg-muted/30 p-6 rounded-lg">
                  <h4 className="font-semibold text-lg mb-3">Rejoignez notre équipe</h4>
                  <p className="text-muted-foreground mb-4">
                    L'IFAC recrute régulièrement des formateurs·rices et des animateurs·rices pour 
                    renforcer son équipe. Si vous partagez nos valeurs et souhaitez contribuer à la 
                    formation des professionnel·les de l'animation, n'hésitez pas à nous contacter.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contribuer Section */}
          <div className="max-w-5xl mx-auto">
            <Card className="shadow-elegant border-primary/30">
              <CardHeader>
                <CardTitle className="text-3xl">Contribuer à la Ressourcerie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg leading-relaxed">
                  La Ressourcerie IFAC est un projet collaboratif qui s'enrichit grâce aux 
                  contributions de la communauté. Vous pouvez participer à son développement de 
                  plusieurs manières :
                </p>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-lg mb-1">Partager vos ressources</p>
                      <p className="text-muted-foreground">
                        Proposez vos fiches d'activités, vos supports de formation, vos projets 
                        pédagogiques ou vos outils d'animation. Chaque contribution est évaluée 
                        par notre équipe avant publication pour garantir la qualité des contenus.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-lg mb-1">Donner votre avis</p>
                      <p className="text-muted-foreground">
                        Commentez les ressources que vous avez utilisées, partagez vos retours 
                        d'expérience et suggérez des améliorations. Vos retours nous aident à 
                        améliorer continuellement la plateforme.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-lg mb-1">Signaler des besoins</p>
                      <p className="text-muted-foreground">
                        Vous recherchez une ressource spécifique qui n'existe pas encore ? 
                        Faites-nous part de vos besoins pour orienter la production de nouveaux 
                        contenus adaptés aux réalités du terrain.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 p-8 rounded-lg space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-semibold">Contactez-nous</h3>
                    <p className="text-muted-foreground">
                      Vous souhaitez contribuer ou en savoir plus sur l'IFAC ? \u00c9changeons sur vos projets, 
                      vos questions ou vos propositions de collaboration.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom complet *</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Votre nom"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="votre.email@exemple.fr"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Sujet *</Label>
                      <Input
                        id="subject"
                        type="text"
                        placeholder="Objet de votre message"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="Votre message (minimum 10 caract\u00e8res)"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={6}
                        disabled={isSubmitting}
                        className="resize-none"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin">\u23f3</span>
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Envoyer le message
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Info */}
          <div className="max-w-5xl mx-auto">
            <Card className="shadow-elegant bg-muted/20">
              <CardContent className="py-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-3xl font-bold text-primary mb-2">40+</p>
                    <p className="text-sm text-muted-foreground">Années d'expérience</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary mb-2">1000+</p>
                    <p className="text-sm text-muted-foreground">Professionnel·les formé·es chaque année</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary mb-2">50+</p>
                    <p className="text-sm text-muted-foreground">Formateurs·rices expert·es</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
