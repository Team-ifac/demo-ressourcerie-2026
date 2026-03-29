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

import {
  RESOURCE_TYPES,
  AGE_RANGES,
  DURATIONS,
  PREP_TIMES,
  type ResourceType,
  type AgeRange,
  type Duration,
  type PrepTime,
} from "@shared/resourceMeta";

import { STATUS_LABELS, allowedNextStatuses, normalizeStatus, type StatusValue } from "@shared/editorialStatus";

type CategoryNode = {
  id: number;
  parentId: number | null;
  parentIdKey: string;
  slug: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  isActive: number;
  createdAt: string;
  children: CategoryNode[];
};

export default function AdminResourceForm() {
  const [, params] = useRoute("/admin/ressources/:id");
  const [, navigate] = useLocation();
  const resourceId = params?.id === "nouvelle" ? null : parseInt(params?.id || "0");
  const isEdit = resourceId !== null && resourceId > 0;

  const { user, loading: authLoading } = useAuth();
  const isInList = <T extends readonly string[]>(
    list: T,
    value: string
  ): value is T[number] => (list as readonly string[]).includes(value);

  const handleTypeChange = (value: string) => {
    setType(isInList(RESOURCE_TYPES, value) ? value : "");
  };

  const handleAgeRangeChange = (value: string) => {
    setAgeRange(isInList(AGE_RANGES, value) ? value : "");
  };

  const handleDurationChange = (value: string) => {
    setDuration(isInList(DURATIONS, value) ? value : "");
  };

  const handlePrepTimeChange = (value: string) => {
    setPrepTime(isInList(PREP_TIMES, value) ? value : "");
  };



  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<ResourceType | "">("");
  const [ageRange, setAgeRange] = useState<AgeRange | "">("");
  const [duration, setDuration] = useState<Duration | "">("");
  const [level, setLevel] = useState("");
  const [prepTime, setPrepTime] = useState<PrepTime | "">("");
  const [status, setStatus] = useState<StatusValue>("draft");

  // (Épuré) Visibilité & statut gérés via l'admin en masse (/admin/access-levels)
  const [selectedThemes, setSelectedThemes] = useState<number[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailKey, setThumbnailKey] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [storageKey, setStorageKey] = useState("");

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
      navigate("/admin/resources-management");
    },
    onError: () => {
      toast.error("Erreur lors de la création");
    },
  });

  const updateMutation = trpc.resources.update.useMutation({
    onSuccess: () => {
      toast.success("Ressource mise à jour avec succès");
      navigate("/admin/access-levels");
    },
    onError: (err: any) => {
      console.error("[AdminResourceForm] update error =", err);

      const message =
        err?.data?.zodError
          ? "Erreur de validation (Zod). Voir console."
          : err?.message || err?.data?.code || "Erreur inconnue";

      toast.error(`Erreur lors de la mise à jour : ${message}`);
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
      // (Épuré) Visibilité & statut gérés via l'admin en masse (/admin/access-levels)
      setThumbnailUrl(resource.thumbnailUrl || "");
      setThumbnailKey((resource as any).thumbnailKey || "");
      setFileUrl((resource as any).fileUrl || "");
      setStorageKey((resource as any).storageKey || "");
      setSelectedThemes(resource.themes?.map((t: any) => t.id) || []);
      setStatus(normalizeStatus((resource as any).status));


    }
  }, [resource]);

  const handleFileUpload = async (file: File, isThumbnail: boolean) => {
    if (isThumbnail) setUploadingThumbnail(true);
    else setUploadingFile(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          const result = e.target?.result?.toString() || "";
          const encoded = result.split(",")[1];

          if (!encoded) {
            reject(new Error("Erreur de lecture du fichier"));
            return;
          }

          resolve(encoded);
        };

        reader.onerror = () => {
          reject(new Error("Erreur de lecture du fichier"));
        };

        reader.readAsDataURL(file);
      });

              const result = await uploadFileMutation.mutateAsync({
          fileName: file.name,
          fileData: base64,
          contentType: file.type,
          target: isThumbnail ? "thumbnail" : "resource",
        });

      if (isThumbnail) {
        setThumbnailUrl(result.url);
        setThumbnailKey((result as any).storageKey || (result as any).fileKey || "");
        toast.success("Vignette uploadée");
      } else {
        // ✅ Pilier 12 bis : url pour affichage, storageKey pour DB
        setFileUrl(result.url);
        setStorageKey((result as any).storageKey || (result as any).fileKey || "");
        toast.success("Fichier uploadé");
      }
    } catch (error) {
      console.error("[AdminResourceForm] upload error =", error);
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

    // ✅ Type obligatoire uniquement en création
    if (!isEdit && !type) {
      toast.error("Veuillez sélectionner un type de ressource");
      return;
    }

    const common = {
      title,
      summary,
      content,

      // ✅ Obligatoire côté API (types). Piloté via /admin/access-levels.
      // ✅ Gouvernance UI : si pas "approved", interdit d’être PUBLIC → on force INTERNAL_IFAC
      visibility: isEdit
        ? status === "approved"
          ? (resource?.visibility ?? "INTERNAL_IFAC")
          : "INTERNAL_IFAC"
        : "INTERNAL_IFAC",

      status: isEdit ? status : "draft",

      thumbnailUrl: thumbnailUrl ? thumbnailUrl : undefined,
      thumbnailKey: thumbnailKey ? thumbnailKey : undefined,

      // ✅ Pilier 12 bis : canonique = storageKey (et jamais fileUrl)
      storageKey: storageKey ? storageKey : undefined,

      themeIds: selectedThemes,
    };

    // ✅ Blindage PRO : ne JAMAIS envoyer fileUrl (même undefined)
    delete (common as any).fileUrl;

    if (isEdit) {
      // ✅ En édition : on ne touche pas aux caractéristiques via l’UI,
      // mais on les renvoie quand même pour satisfaire les types et éviter tout "undefined"
      const safeType =
  type && RESOURCE_TYPES.includes(type as any)
    ? type
    : RESOURCE_TYPES.includes(resource?.type as any)
    ? (resource?.type as any)
    : undefined;

const updateData = {
  ...common,
  type: safeType,
  ageRange: ageRange || undefined,
  duration: duration || undefined,
  prepTime: prepTime || undefined,
  level: level || undefined,
};


      updateMutation.mutate({ id: resourceId, ...updateData });
      return;
    }

    // ✅ En création : caractéristiques pilotées par ce formulaire
    const createData = {
      ...common,
      type, // obligatoire ici (validé par le if)
      ageRange: ageRange || undefined,
      duration: duration || undefined,
      prepTime: prepTime || undefined,
      level: level || undefined,
    };

    createMutation.mutate(createData);
  };

  const toggleTheme = (themeId: number) => {
    setSelectedThemes((prev) =>
      prev.includes(themeId) ? prev.filter((id) => id !== themeId) : [...prev, themeId]
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
              { label: isEdit ? "Modifier la ressource" : "Nouvelle ressource" },
            ]}
          />

          <div>
            <h1 className="text-4xl font-bold">{isEdit ? "Modifier la ressource" : "Nouvelle ressource"}</h1>
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

                        {!isEdit && (
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle>Caractéristiques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type de ressource</Label>
                      <Select value={type} onValueChange={handleTypeChange}>
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          {RESOURCE_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ageRange">Tranche d'âge</Label>
                      <Select value={ageRange} onValueChange={handleAgeRangeChange}>                        <SelectTrigger id="ageRange">
                          <SelectValue placeholder="Sélectionner une tranche" />
                        </SelectTrigger>
                        <SelectContent>
                          {AGE_RANGES.map((a) => (
                            <SelectItem key={a} value={a}>
                              {a}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Durée</Label>
                      <Select value={duration} onValueChange={handleDurationChange}>
                        <SelectTrigger id="duration">
                          <SelectValue placeholder="Sélectionner une durée" />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATIONS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prepTime">Temps de préparation</Label>
                      <Select value={prepTime} onValueChange={handlePrepTimeChange}>
                        <SelectTrigger id="prepTime">
                          <SelectValue placeholder="Sélectionner un temps" />
                        </SelectTrigger>
                        <SelectContent>
                          {PREP_TIMES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="level">Niveau</Label>
                      <Select value={level} onValueChange={(value) => setLevel(value)}>
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

                    {/* (Épuré) Visibilité & statut gérés via l'admin en masse (/admin/access-levels) */}
                  </div>
                </CardContent>
              </Card>
            )}

{isEdit && (
  <Card className="shadow-elegant">
    <CardHeader>
      <CardTitle>Statut éditorial</CardTitle>
      <CardDescription>Pilotez le cycle éditorial de la ressource</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">Statut</Label>

        <Select value={status} onValueChange={(value) => setStatus(value as StatusValue)}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Sélectionner un statut" />
          </SelectTrigger>

          <SelectContent>
            {(["draft", "pending", "approved", "rejected"] as StatusValue[]).map((s) => {
              const allowed = new Set(allowedNextStatuses(status));
              const disabled = !allowed.has(s);

              return (
                <SelectItem key={s} value={s} disabled={disabled}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <div className="text-xs text-muted-foreground">
          Transitions autorisées depuis <b>{STATUS_LABELS[status]}</b> :{" "}
          {allowedNextStatuses(status).map((s) => STATUS_LABELS[s]).join(", ")}
        </div>
      </div>
    </CardContent>
  </Card>
)}



            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Thématiques</CardTitle>
                <CardDescription>Sélectionnez les thématiques associées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {themes.map((theme: any) => (
                    <div key={theme.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`theme-${theme.id}`}
                        checked={selectedThemes.includes(theme.id)}
                        onCheckedChange={() => toggleTheme(theme.id)}
                      />
                      <Label htmlFor={`theme-${theme.id}`} className="text-sm font-normal cursor-pointer">
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
                        onClick={() => {
                          setThumbnailUrl("");
                          setThumbnailKey("");
                        }}
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
                      <span className="text-sm flex-1 truncate">{fileUrl.split("/").pop()}</span>
                                            <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFileUrl("");
                          setStorageKey("");
                        }}
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
  disabled={
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadingThumbnail ||
    uploadingFile
  }
  className="flex-1"
>
  {(createMutation.isPending ||
    updateMutation.isPending ||
    uploadingThumbnail ||
    uploadingFile) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {uploadingThumbnail
    ? "Upload vignette..."
    : uploadingFile
    ? "Upload fichier..."
    : isEdit
    ? "Mettre à jour"
    : "Créer la ressource"}
</Button>

              <Button type="button" variant="outline" onClick={() => navigate("/admin/access-levels")}>
                Annuler
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
