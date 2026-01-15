import { useState } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Upload, CheckCircle, AlertCircle, Loader } from "lucide-react";

export default function Contribute() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    type: "",
    ageRange: "",
    duration: "",
    category: "",
    themeIds: [] as number[],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const { data: themes = [] } = trpc.themes.list.useQuery();
  const createResourceMutation = trpc.resources.create.useMutation();
  const notifyOwnerMutation = trpc.system.notifyOwner.useMutation();

  const categories = [
    "Jeux et activités ludiques",
    "Outils pédagogiques",
    "Guides pratiques",
    "Fiches techniques",
    "Supports de formation",
    "Recettes de cuisine",
    "Activités manuelles",
    "Jeux de société",
    "Activités sportives",
    "Sorties et découvertes",
    "Gestion d'équipe",
    "Développement professionnel",
    "Outils de planification",
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleThemeToggle = (themeId: number) => {
    setFormData((prev) => ({
      ...prev,
      themeIds: prev.themeIds.includes(themeId)
        ? prev.themeIds.filter((id) => id !== themeId)
        : [...prev.themeIds, themeId],
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Validation
      if (!formData.title || !formData.summary || !formData.type || !formData.category) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      // Créer la ressource
      const resource = await createResourceMutation.mutateAsync({
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        type: formData.type,
        ageRange: formData.ageRange || undefined,
        duration: formData.duration || undefined,
        visibility: "INTERNAL_IFAC", // Les contributions sont internes par défaut
        themeIds: formData.themeIds,
      });

      // Notifier le propriétaire
      await notifyOwnerMutation.mutateAsync({
        title: "Nouvelle ressource soumise",
        content: `${user?.name || "Un utilisateur"} a soumis une nouvelle ressource : "${formData.title}". Veuillez la valider dans l'interface d'administration.`,
      });

      setSubmitStatus("success");
      setSubmitMessage("Votre ressource a été soumise avec succès ! Elle sera validée par l'équipe IFAC.");
      
      // Réinitialiser le formulaire
      setFormData({
        title: "",
        summary: "",
        content: "",
        type: "",
        ageRange: "",
        duration: "",
        category: "",
        themeIds: [],
      });
      setSelectedFile(null);
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(
        error instanceof Error ? error.message : "Une erreur est survenue lors de la soumission"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-8">
          <div className="container">
            <Breadcrumb items={[{ label: "Espace contributeur" }]} />
            <div className="mt-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Authentification requise</h1>
              <p className="text-muted-foreground mb-6">
                Vous devez être connecté pour soumettre une ressource.
              </p>
              <Button>Se connecter</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          <Breadcrumb items={[{ label: "Espace contributeur" }]} />

          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Espace contributeur</h1>
            <p className="text-lg text-muted-foreground">
              Partagez vos ressources pédagogiques avec la communauté IFAC. Vos contributions seront validées par notre équipe avant publication.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Formulaire */}
            <div className="lg:col-span-2">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle>Soumettre une ressource</CardTitle>
                  <CardDescription>
                    Remplissez le formulaire ci-dessous pour proposer une nouvelle ressource
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Titre */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Titre de la ressource *
                      </label>
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Ex: Jeu des 5 sens pour enfants"
                        required
                      />
                    </div>

                    {/* Résumé */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Résumé *
                      </label>
                      <Textarea
                        name="summary"
                        value={formData.summary}
                        onChange={handleInputChange}
                        placeholder="Décrivez brièvement votre ressource"
                        rows={3}
                        required
                      />
                    </div>

                    {/* Contenu détaillé */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Description détaillée
                      </label>
                      <Textarea
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        placeholder="Fournissez une description complète, les objectifs, le déroulement, etc."
                        rows={5}
                      />
                    </div>

                    {/* Type de ressource */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Type de ressource *
                      </label>
                      <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fiche">Fiche</SelectItem>
                          <SelectItem value="Kit clé en main">Kit clé en main</SelectItem>
                          <SelectItem value="Projet">Projet</SelectItem>
                          <SelectItem value="Article">Article</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Catégorie */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Catégorie *
                      </label>
                      <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tranche d'âge */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tranche d'âge recommandée
                      </label>
                      <Select value={formData.ageRange} onValueChange={(value) => handleSelectChange("ageRange", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une tranche d'âge" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3-6 ans">3-6 ans</SelectItem>
                          <SelectItem value="6-9 ans">6-9 ans</SelectItem>
                          <SelectItem value="9-12 ans">9-12 ans</SelectItem>
                          <SelectItem value="12-15 ans">12-15 ans</SelectItem>
                          <SelectItem value="15+ ans">15+ ans</SelectItem>
                          <SelectItem value="Adultes">Adultes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Durée */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Durée estimée
                      </label>
                      <Select value={formData.duration} onValueChange={(value) => handleSelectChange("duration", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une durée" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Moins de 15 min">Moins de 15 min</SelectItem>
                          <SelectItem value="15-30 min">15-30 min</SelectItem>
                          <SelectItem value="30 min - 1h">30 min - 1h</SelectItem>
                          <SelectItem value="1-2h">1-2h</SelectItem>
                          <SelectItem value="Plus de 2h">Plus de 2h</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Thématiques */}
                    <div>
                      <label className="block text-sm font-medium mb-3">
                        Thématiques associées
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {themes.map((theme) => (
                          <Badge
                            key={theme.id}
                            variant={formData.themeIds.includes(theme.id) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => handleThemeToggle(theme.id)}
                          >
                            {theme.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Upload de fichier */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Fichier PDF (optionnel)
                      </label>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-input"
                        />
                        <label htmlFor="file-input" className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {selectedFile ? selectedFile.name : "Cliquez pour sélectionner un fichier PDF"}
                          </p>
                          <p className="text-xs text-muted-foreground">ou glissez-déposez</p>
                        </label>
                      </div>
                    </div>

                    {/* Message de statut */}
                    {submitStatus === "success" && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-900">{submitMessage}</p>
                        </div>
                      </div>
                    )}

                    {submitStatus === "error" && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-900">{submitMessage}</p>
                        </div>
                      </div>
                    )}

                    {/* Boutons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Soumission en cours...
                          </>
                        ) : (
                          "Soumettre la ressource"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFormData({
                            title: "",
                            summary: "",
                            content: "",
                            type: "",
                            ageRange: "",
                            duration: "",
                            category: "",
                            themeIds: [],
                          });
                          setSelectedFile(null);
                        }}
                      >
                        Réinitialiser
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Barre latérale - Conseils */}
            <div className="space-y-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base">Conseils pour une bonne ressource</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-blue-900">📝 Titre clair</p>
                    <p className="text-blue-700">Utilisez un titre descriptif et accrocheur</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">🎯 Objectifs explicites</p>
                    <p className="text-blue-700">Décrivez clairement les objectifs pédagogiques</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">👥 Public cible</p>
                    <p className="text-blue-700">Précisez la tranche d'âge et le contexte d'utilisation</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">⏱️ Durée réaliste</p>
                    <p className="text-blue-700">Estimez le temps de réalisation de manière réaliste</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">📚 Thématiques pertinentes</p>
                    <p className="text-blue-700">Sélectionnez les thématiques qui correspondent</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Processus de validation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Soumission</p>
                      <p className="text-muted-foreground text-xs">Vous soumettez votre ressource</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Vérification</p>
                      <p className="text-muted-foreground text-xs">L'équipe IFAC examine votre ressource</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Publication</p>
                      <p className="text-muted-foreground text-xs">Votre ressource est publiée</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
