import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Loader2, Upload, X } from "lucide-react";
import { Redirect } from "wouter";
import { toast } from "sonner";

export default function AdminResourceForm() {
  const [, params] = useRoute("/admin/ressources/:id");
  const [, navigate] = useLocation();
  const resourceId = params?.id === "nouvelle" ? null : parseInt(params?.id || "0");
  const isEdit = resourceId !== null && resourceId > 0;

  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [duration, setDuration] = useState("");
  const [level, setLevel] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "INTERNAL_IFAC">("PUBLIC");
  const [selectedThemes, setSelectedThemes] = useState<number[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const { data: themes = [] } = trpc.themes.list.useQuery();
  const { data: resource, isLoading: resourceLoading } = trpc.resources.getById.useQuery(
    { id: resourceId! },
    { enabled: isEdit }
  );

  const createMutation = trpc.resources.create.useMutation({
    onSuccess: () => {
      toast.success("Ressource créée avec succès");
      navigate("/admin/ressources");
    },
    onError: () => {
      toast.error("Erreur lors de la création");
    },
  });

  const updateMutation = trpc.resources.update.useMutation({
    onSuccess: () => {
      toast.success("Ressource mise à jour avec succès");
      navigate("/admin/ressources");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const uploadFileMutation = trpc.resources.uploadFile.useMutation();

  useEffect(() => {
    if (resource) {
      setTitle(resource.title);
      setSummary(resource.summary);
      setContent(resource.content);
      setType(resource.type || "");
      setAgeRange(resource.ageRange || "");
      setDuration(resource.duration || "");
      setLevel(resource.level || "");
      setPrepTime(resource.prepTime || "");
      setVisibility(resource.visibility);
      setThumbnailUrl(resource.thumbnailUrl || "");
      setFileUrl(resource.fileUrl || "");
      setSelectedThemes(resource.themes?.map(t => t.id) || []);
    }
  }, [resource]);

  const handleFileUpload = async (file: File, isThumbnail: boolean) => {
    if (isThumbnail) setUploadingThumbnail(true);
    else setUploadingFile(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result?.toString().split(',')[1];
        if (!base64) throw new Error("Erreur de lecture du fichier");

        const result = await uploadFileMutation.mutateAsync({
          fileName: file.name,
          fileData: base64,
          contentType: file.type,
        });

        if (isThumbnail) {
          setThumbnailUrl(result.url);
          toast.success("Vignette uploadée");
        } else {
          setFileUrl(result.url);
          toast.success("Fichier uploadé");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Erreur lors de l'upload");
    } finally {
      if (isThumbnail) setUploadingThumbnail(false);
      else setUploadingFile(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !summary || !content) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!type) {
      toast.error("Veuillez sélectionner un type de ressource");
      return;
    }

    const data = {
      title,
      summary,
      content,
      type,
      ageRange: ageRange || undefined,
      duration: duration || undefined,
      level: level || undefined,
      prepTime: prepTime || undefined,
      visibility,
      thumbnailUrl: thumbnailUrl || undefined,
      fileUrl: fileUrl || undefined,
      themeIds: selectedThemes,
    };

    if (isEdit) {
      updateMutation.mutate({ id: resourceId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleTheme = (themeId: number) => {
    setSelectedThemes(prev =>
      prev.includes(themeId)
        ? prev.filter(id => id !== themeId)
        : [...prev, themeId]
    );
  };

  if (authLoading || (isEdit && resourceLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      
      <main className="flex-1 py-8">
        <div className="container max-w-4xl space-y-8">
          <Breadcrumb 
            items={[
              { label: "Administration", href: "/admin" },
              { label: "Gestion des ressources", href: "/admin/ressources" },
              { label: isEdit ? "Modifier la ressource" : "Nouvelle ressource" }
            ]} 
          />

          <div>
            <h1 className="text-4xl font-bold">
              {isEdit ? "Modifier la ressource" : "Nouvelle ressource"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isEdit ? "Modifiez les informations de la ressource" : "Créez une nouvelle ressource pédagogique"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>Les champs marqués d'un * sont obligatoires</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Titre de la ressource"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Résumé *</Label>
                  <Textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Résumé court de la ressource"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Contenu détaillé *</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Description complète de la ressource"
                    rows={8}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Caractéristiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type de ressource</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fiche">Fiche</SelectItem>
                        <SelectItem value="Kit clé en main">Kit clé en main</SelectItem>
                        <SelectItem value="Projet">Projet</SelectItem>
                        <SelectItem value="Article">Article</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ageRange">Tranche d'âge</Label>
                    <Select value={ageRange} onValueChange={setAgeRange}>
                      <SelectTrigger id="ageRange">
                        <SelectValue placeholder="Sélectionner une tranche" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3-6 ans">3-6 ans</SelectItem>
                        <SelectItem value="6-12 ans">6-12 ans</SelectItem>
                        <SelectItem value="12-18 ans">12-18 ans</SelectItem>
                        <SelectItem value="Tous âges">Tous âges</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Durée</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger id="duration">
                        <SelectValue placeholder="Sélectionner une durée" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30 min">30 min</SelectItem>
                        <SelectItem value="1-2h">1-2h</SelectItem>
                        <SelectItem value="Demi-journée">Demi-journée</SelectItem>
                        <SelectItem value="Journée">Journée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prepTime">Temps de préparation</Label>
                    <Select value={prepTime} onValueChange={setPrepTime}>
                      <SelectTrigger id="prepTime">
                        <SelectValue placeholder="Sélectionner un temps" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5 min">5 min</SelectItem>
                        <SelectItem value="15 min">15 min</SelectItem>
                        <SelectItem value="30 min">30 min</SelectItem>
                        <SelectItem value="1h">1h</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Niveau</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger id="level">
                        <SelectValue placeholder="Sélectionner un niveau" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Débutant">Débutant</SelectItem>
                        <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                        <SelectItem value="Avancé">Avancé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibilité</Label>
                    <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                      <SelectTrigger id="visibility">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="INTERNAL_IFAC">Interne IFAC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Thématiques</CardTitle>
                <CardDescription>Sélectionnez les thématiques associées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {themes.map((theme) => (
                    <div key={theme.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`theme-${theme.id}`}
                        checked={selectedThemes.includes(theme.id)}
                        onCheckedChange={() => toggleTheme(theme.id)}
                      />
                      <Label
                        htmlFor={`theme-${theme.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {theme.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Fichiers</CardTitle>
                <CardDescription>Ajoutez une vignette et un fichier téléchargeable</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Vignette (image)</Label>
                  {thumbnailUrl ? (
                    <div className="relative inline-block">
                      <img src={thumbnailUrl} alt="Vignette" className="w-48 h-32 object-cover rounded-lg" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setThumbnailUrl("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], true)}
                        disabled={uploadingThumbnail}
                        className="hidden"
                        id="thumbnail-upload"
                      />
                      <Label htmlFor="thumbnail-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {uploadingThumbnail ? "Upload en cours..." : "Cliquer pour uploader une image"}
                        </p>
                      </Label>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fichier PDF (ressource téléchargeable)</Label>
                  {fileUrl ? (
                    <div className="flex items-center gap-2 p-3 border rounded-lg">
                      <span className="text-sm flex-1 truncate">{fileUrl.split('/').pop()}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFileUrl("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], false)}
                        disabled={uploadingFile}
                        className="hidden"
                        id="file-upload"
                      />
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {uploadingFile ? "Upload en cours..." : "Cliquer pour uploader un PDF"}
                        </p>
                      </Label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? "Mettre à jour" : "Créer la ressource"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/ressources")}
              >
                Annuler
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
