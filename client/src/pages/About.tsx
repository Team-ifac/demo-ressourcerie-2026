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
      toast.success("Message envoyé !", {
        description: "Nous vous répondrons dans les plus brefs délais.",
      });
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
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src="/about-page-bg.jpg"
          alt=""
          className="h-full w-full object-cover opacity-30 scale-110"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-background/82" />

      <main className="relative z-10 flex-1 py-8 md:py-10">
        <div className="container space-y-14">
          <Breadcrumb items={[{ label: "À propos" }]} />

          {/* Hero Section */}
          <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y bg-muted/20">
            <div className="relative mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20 xl:py-24">
              <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="space-y-6 rounded-[32px] border bg-background/88 p-8 shadow-sm backdrop-blur-sm md:p-10 xl:p-12">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm">
                    <BookOpen className="h-10 w-10" />
                  </div>

                  <h1 className="text-5xl font-bold tracking-tight md:text-6xl xl:text-7xl">
                    À propos de l'IFAC
                  </h1>

                  <p className="max-w-3xl text-xl leading-relaxed text-foreground/90 md:text-2xl">
                    L'Institut de Formation, d'Animation et de Conseil accompagne depuis plus de 40 ans
                    les acteurs·rices de l'éducation populaire et de l'animation socioculturelle dans
                    leur développement professionnel et personnel.
                  </p>
                </div>

                <div className="flex items-center justify-center">
                  <img
                    src="/about-hero.jpg"
                    alt="Visuel IFAC 50 ans"
                    className="max-h-[520px] w-auto max-w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Mission + Histoire */}
          <section className="max-w-6xl mx-auto grid gap-8">
            <Card className="rounded-[32px] border border-border/60 bg-card/95 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <CardHeader className="px-6 pb-3 pt-6 md:px-8 md:pt-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                    <Target className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-3xl md:text-4xl tracking-tight">Notre mission</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 px-6 pb-6 md:px-8 md:pb-8 text-foreground">
                <p className="text-lg leading-relaxed md:text-[1.15rem]">
                  L'IFAC s'engage à former des professionnel·les compétent·es et engagé·es, capables 
                  d'accompagner les publics dans leur épanouissement personnel et collectif. Notre mission 
                  s'articule autour de trois axes fondamentaux : la formation initiale et continue, 
                  l'accompagnement des structures éducatives, et la production de ressources pédagogiques 
                  innovantes et accessibles.
                </p>
                <p className="text-lg leading-relaxed md:text-[1.15rem]">
                  La Ressourcerie IFAC s'inscrit dans cette démarche en offrant un espace numérique 
                  collaboratif où formateurs·rices, animateurs·rices, directeurs·rices et stagiaires 
                  peuvent accéder à des contenus de qualité, partager leurs pratiques et enrichir 
                  collectivement le patrimoine pédagogique de l'animation socioculturelle.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border border-border/60 bg-card/95 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <CardHeader className="px-6 pb-3 pt-6 md:px-8 md:pt-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-3xl md:text-4xl tracking-tight">Notre histoire</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 px-6 pb-6 md:px-8 md:pb-8 text-foreground">
                <p className="text-lg leading-relaxed md:text-[1.15rem]">
                  Fondé dans les années 1980, l'IFAC est né de la volonté de professionnel·les de 
                  l'animation de structurer et de professionnaliser le secteur de l'éducation populaire. 
                  Depuis sa création, l'institut a formé des milliers d'animateurs·rices et de 
                  directeurs·rices, contribuant ainsi au développement d'une animation de qualité sur 
                  l'ensemble du territoire.
                </p>
                <p className="text-lg leading-relaxed md:text-[1.15rem]">
                  Au fil des décennies, l'IFAC a su évoluer pour répondre aux transformations de la 
                  société et aux nouveaux enjeux de l'éducation. L'institut a développé une expertise 
                  reconnue dans les domaines de la petite enfance, de l'accueil de loisirs, des séjours 
                  de vacances, et de l'animation socioculturelle. La création de la Ressourcerie IFAC 
                  en 2025 marque une nouvelle étape dans notre engagement pour la diffusion des savoirs 
                  et le partage des pratiques professionnelles.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Valeurs Section */}
          <section className="max-w-6xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Nos valeurs</h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Les principes qui guident notre action quotidienne et inspirent notre pédagogie
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="rounded-[28px] border border-border/60 bg-card/95 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="space-y-4 px-6 pt-6 pb-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl tracking-tight">Éducation populaire</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <p className="text-muted-foreground leading-relaxed text-base">
                    Nous croyons en une éducation émancipatrice qui valorise les savoirs de chacun·e 
                    et favorise l'engagement citoyen et la transformation sociale.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border border-border/60 bg-card/95 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="space-y-4 px-6 pt-6 pb-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                    <Heart className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl tracking-tight">Inclusion et diversité</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <p className="text-muted-foreground leading-relaxed text-base">
                    Nous promouvons une animation inclusive qui accueille et valorise la diversité 
                    des publics, des cultures et des parcours de vie.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border border-border/60 bg-card/95 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="space-y-4 px-6 pt-6 pb-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                    <Lightbulb className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl tracking-tight">Innovation pédagogique</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <p className="text-muted-foreground leading-relaxed text-base">
                    Nous encourageons l'expérimentation et la créativité dans les pratiques 
                    pédagogiques pour répondre aux défis contemporains de l'éducation.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border border-border/60 bg-card/95 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="space-y-4 px-6 pt-6 pb-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl tracking-tight">Excellence et qualité</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <p className="text-muted-foreground leading-relaxed text-base">
                    Nous nous engageons à offrir des formations et des ressources de haute qualité, 
                    régulièrement actualisées et adaptées aux réalités du terrain.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border border-border/60 bg-card/95 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="space-y-4 px-6 pt-6 pb-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl tracking-tight">Coopération</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <p className="text-muted-foreground leading-relaxed text-base">
                    Nous valorisons le travail collaboratif, le partage d'expériences et la 
                    construction collective des savoirs professionnels.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border border-border/60 bg-card/95 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="space-y-4 px-6 pt-6 pb-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl tracking-tight">Engagement</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <p className="text-muted-foreground leading-relaxed text-base">
                    Nous formons des professionnel·les engagé·es, conscient·es de leur rôle social 
                    et de leur responsabilité éducative auprès des publics.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Équipe Section */}
          <section className="max-w-6xl mx-auto">
            <Card className="rounded-[32px] border border-border/60 bg-card/95 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <CardHeader className="px-6 pb-3 pt-6 md:px-8 md:pt-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                    <Users className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-3xl md:text-4xl tracking-tight">Notre équipe</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 px-6 pb-6 md:px-8 md:pb-8 text-foreground">
                <p className="text-lg leading-relaxed md:text-[1.15rem]">
                  L'équipe de l'IFAC est composée de formateurs·rices et de professionnel·les 
                  expérimenté·es, issu·es de parcours variés dans les domaines de l'animation, de 
                  l'éducation, du travail social et de la formation d'adultes. Chaque membre de 
                  l'équipe apporte son expertise spécifique et son engagement pour accompagner au 
                  mieux les stagiaires et les structures partenaires.
                </p>
                <p className="text-lg leading-relaxed md:text-[1.15rem]">
                  Notre équipe pédagogique intervient sur l'ensemble des formations proposées par 
                  l'institut : BAFA (Formation Générale et Approfondissements), BAFD, formations 
                  professionnelles continues, et accompagnement de projets éducatifs. Nous travaillons 
                  en étroite collaboration avec un réseau de formateurs·rices associé·es et de 
                  partenaires institutionnels pour garantir la qualité et la pertinence de nos actions.
                </p>
                <div className="rounded-[24px] border bg-muted/30 p-6 md:p-8">
                  <h4 className="font-semibold text-xl mb-3">Rejoignez notre équipe</h4>
                  <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                    L'IFAC recrute régulièrement des formateurs·rices et des animateurs·rices pour 
                    renforcer son équipe. Si vous partagez nos valeurs et souhaitez contribuer à la 
                    formation des professionnel·les de l'animation, n'hésitez pas à nous contacter.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Contribuer Section */}
          <section className="max-w-6xl mx-auto">
            <Card className="rounded-[32px] border border-primary/20 bg-card/95 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <CardHeader className="px-6 pb-3 pt-6 md:px-8 md:pt-8">
                <CardTitle className="text-3xl md:text-4xl tracking-tight">Contribuer à la Ressourcerie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 px-6 pb-6 md:px-8 md:pb-8">
                <p className="text-lg leading-relaxed md:text-[1.15rem]">
                  La Ressourcerie IFAC est un projet collaboratif qui s'enrichit grâce aux 
                  contributions de la communauté. Vous pouvez participer à son développement de 
                  plusieurs manières :
                </p>

                <div className="space-y-5">
                  <div className="flex gap-4 rounded-[24px] bg-muted/20 p-5">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-xl mb-1">Partager vos ressources</p>
                      <p className="text-muted-foreground leading-relaxed text-base">
                        Proposez vos fiches d'activités, vos supports de formation, vos projets 
                        pédagogiques ou vos outils d'animation. Chaque contribution est évaluée 
                        par notre équipe avant publication pour garantir la qualité des contenus.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 rounded-[24px] bg-muted/20 p-5">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-xl mb-1">Donner votre avis</p>
                      <p className="text-muted-foreground leading-relaxed text-base">
                        Commentez les ressources que vous avez utilisées, partagez vos retours 
                        d'expérience et suggérez des améliorations. Vos retours nous aident à 
                        améliorer continuellement la plateforme.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 rounded-[24px] bg-muted/20 p-5">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-xl mb-1">Signaler des besoins</p>
                      <p className="text-muted-foreground leading-relaxed text-base">
                        Vous recherchez une ressource spécifique qui n'existe pas encore ? 
                        Faites-nous part de vos besoins pour orienter la production de nouveaux 
                        contenus adaptés aux réalités du terrain.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border bg-primary/5 p-6 md:p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-3xl font-semibold">Contactez-nous</h3>
                    <p className="text-muted-foreground text-base md:text-lg">
                      Vous souhaitez contribuer ou en savoir plus sur l'IFAC ? Échangeons sur vos projets, 
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
                          className="h-12 rounded-xl"
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
                          className="h-12 rounded-xl"
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
                        className="h-12 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="Votre message (minimum 10 caractères)"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={6}
                        disabled={isSubmitting}
                        className="resize-none rounded-xl"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full gap-2 rounded-xl"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin">⏳</span>
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
          </section>

          {/* Footer Info */}
          <section className="max-w-6xl mx-auto">
            <Card className="rounded-[32px] border border-border/60 bg-muted/20 shadow-sm backdrop-blur-sm">
              <CardContent className="py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="rounded-[24px] bg-background/70 px-4 py-6 shadow-sm">
                    <p className="text-4xl font-bold text-primary mb-2">40+</p>
                    <p className="text-sm text-muted-foreground">Années d'expérience</p>
                  </div>
                  <div className="rounded-[24px] bg-background/70 px-4 py-6 shadow-sm">
                    <p className="text-4xl font-bold text-primary mb-2">1000+</p>
                    <p className="text-sm text-muted-foreground">Professionnel·les formé·es chaque année</p>
                  </div>
                  <div className="rounded-[24px] bg-background/70 px-4 py-6 shadow-sm">
                    <p className="text-4xl font-bold text-primary mb-2">50+</p>
                    <p className="text-sm text-muted-foreground">Formateurs·rices expert·es</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}