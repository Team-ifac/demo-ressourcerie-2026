import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ParcoursSectionEditor } from "@/components/SectionEditors/ParcoursSectionEditor";

type SectionType = "hero" | "text" | "image" | "cta" | "features" | "testimonials" | "parcours";

interface PageData {
  slug: string;
  title: string;
  description?: string;
  sections: Array<{
    id: string;
    name: string;
    type: SectionType;
    order: number;
    content: Record<string, any>;
  }>;
}

export default function AdminCMS() {
  const [selectedPage, setSelectedPage] = useState<string>("home");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingPageInfo, setEditingPageInfo] = useState(false);
  const [newSectionType, setNewSectionType] = useState<SectionType>("text");
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [localTitle, setLocalTitle] = useState("");
  const [localDescription, setLocalDescription] = useState("");

  // Récupérer la page CMS
  const utils = trpc.useUtils();

  const { data: page, isLoading, refetch } = trpc.cms.getPage.useQuery({
    slug: selectedPage,
  });

  // Mutations
  const savePage = trpc.cms.savePage.useMutation({
    onSuccess: async () => {
      toast.success("✅ Page sauvegardée avec succès !");
      if (pageData) {
        setPageData({
          ...pageData,
          title: localTitle,
          description: localDescription,
        });
      }
      setEditingPageInfo(false);
      await utils.cms.getPage.invalidate({ slug: selectedPage });
      await refetch();
    },
    onError: (error) => {
      toast.error("❌ Erreur : " + error.message);
    },
  });

  const updateSection = trpc.cms.updateSection.useMutation({
    onSuccess: () => {
      toast.success("✅ Section mise à jour !");
      refetch();
      setEditingSection(null);
    },
    onError: (error) => {
      toast.error("❌ Erreur : " + error.message);
    },
  });

  const deleteSection = trpc.cms.deleteSection.useMutation({
    onSuccess: () => {
      toast.success("✅ Section supprimée !");
      refetch();
    },
    onError: (error) => {
      toast.error("❌ Erreur : " + error.message);
    },
  });

  const pages = ["home", "about", "help", "parcours"];

  // Synchroniser les données quand la page change
  useEffect(() => {
    setPageData(null);
    setLocalTitle("");
    setLocalDescription("");
    setEditingPageInfo(false);
    setEditingSection(null);
  }, [selectedPage]);

  useEffect(() => {
    if (page) {
      setPageData(page);
      setLocalTitle(page.title);
      setLocalDescription(page.description || "");
    }
  }, [page]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Chargement...</p>
        </div>
      </div>
    );
  }

  const handleSavePageInfo = () => {
    if (!pageData) return;
    
    savePage.mutate({
      slug: pageData.slug,
      title: localTitle,
      description: localDescription,
      sections: pageData.sections,
    });
  };

  const handleAddSection = () => {
    if (!pageData) return;

    const newSection = {
      id: `section-${Date.now()}`,
      name: `Nouvelle section ${newSectionType}`,
      type: newSectionType,
      order: pageData.sections.length + 1,
      content: {},
    };

    updateSection.mutate({
      pageSlug: pageData.slug,
      section: newSection,
    });
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!pageData) return;
    if (!confirm("Êtes-vous sûr·e de vouloir supprimer cette section ?")) return;

    deleteSection.mutate({
      pageSlug: pageData.slug,
      sectionId,
    });
  };

  const handleUpdateSection = (sectionId: string, newContent: any) => {
    if (!pageData) return;
    const section = pageData.sections.find((s) => s.id === sectionId);
    if (section) {
      updateSection.mutate({
        pageSlug: pageData.slug,
        section: {
          ...section,
          content: newContent,
        },
      });
    }
  };

  const getSectionTypeIcon = (type: SectionType) => {
    const icons: Record<SectionType, string> = {
      hero: "🎯",
      text: "📝",
      image: "🖼️",
      cta: "🔘",
      features: "⭐",
      testimonials: "💬",
      parcours: "📚",
    };
    return icons[type] || "📦";
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🎨 Gestion du CMS</h1>
        <p className="text-gray-600 text-lg">Modifiez le contenu de vos pages facilement, sans toucher au code</p>
      </div>

      {/* Sélection de la page */}
      <Card className="mb-6 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📄 Sélectionner une page
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {pages.map((p) => (
              <Button
                key={p}
                variant={selectedPage === p ? "default" : "outline"}
                onClick={() => {
                  setSelectedPage(p);
                  setEditingPageInfo(false);
                  setEditingSection(null);
                }}
                className="text-base py-2 h-auto"
              >
                {p === "home" && "🏠"}
                {p === "about" && "ℹ️"}
                {p === "help" && "❓"}
                {p === "parcours" && "📚"}
                {" "}
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Informations de la page */}
      {pageData && (
        <Card className="mb-6 border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{pageData.title}</CardTitle>
              <CardDescription className="text-base mt-2">{pageData.description}</CardDescription>
            </div>
            <Button
              variant={editingPageInfo ? "destructive" : "outline"}
              onClick={() => setEditingPageInfo(!editingPageInfo)}
              size="lg"
              className="h-auto py-2"
            >
              {editingPageInfo ? (
                <>
                  <X className="w-5 h-5 mr-2" />
                  Annuler
                </>
              ) : (
                <>
                  <Edit2 className="w-5 h-5 mr-2" />
                  Modifier
                </>
              )}
            </Button>
          </CardHeader>

          {editingPageInfo && (
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Titre de la page</label>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2">
                    <p className="text-xs text-blue-700">
                      <strong>Texte actuel :</strong> <span className="font-mono">{pageData?.title}</span>
                    </p>
                  </div>
                  <Input
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    placeholder="Titre de la page"
                    autoFocus
                    onFocus={(e) => e.currentTarget.select()}
                    className="border-2 text-base py-2 h-auto"
                  />
                  <p className="text-xs text-gray-500 mt-2">💡 Le texte est automatiquement sélectionné. Tapez pour remplacer.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Description</label>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2">
                    <p className="text-xs text-blue-700">
                      <strong>Texte actuel :</strong> <span className="font-mono">{pageData?.description}</span>
                    </p>
                  </div>
                  <Textarea
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    placeholder="Description de la page"
                    rows={3}
                    onFocus={(e) => e.currentTarget.select()}
                    className="border-2 text-base"
                  />
                  <p className="text-xs text-gray-500 mt-2">💡 Le texte est automatiquement sélectionné. Tapez pour remplacer.</p>
                </div>
                <Button
                  onClick={handleSavePageInfo}
                  disabled={savePage.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 h-auto text-base"
                >
                  <Save className="w-5 h-5 mr-2" />
                  ✅ Sauvegarder les modifications
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Sections */}
      <Card className="mb-6 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            📚 Les sections de cette page
          </CardTitle>
          <CardDescription className="text-base">
            {pageData?.sections.length || 0} section{(pageData?.sections.length || 0) > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pageData?.sections && pageData.sections.length > 0 ? (
              pageData.sections.map((section) => (
                <div key={section.id} className="border-2 rounded-lg p-4 hover:border-blue-300 transition">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">
                        {getSectionTypeIcon(section.type)} {section.name}
                      </h3>
                      <Badge variant="outline" className="mt-2">
                        {section.type}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setEditingSection(editingSection === section.id ? null : section.id)
                        }
                        className="py-2 h-auto"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteSection(section.id)}
                        disabled={deleteSection.isPending}
                        className="py-2 h-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>

                  {editingSection === section.id && (
                    <div className="mt-4 pt-4 border-t-2">
                      {section.type === "parcours" ? (
                        <ParcoursSectionEditor
                          content={section.content}
                          onSave={(content) => handleUpdateSection(section.id, content)}
                          onCancel={() => setEditingSection(null)}
                        />
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-3">
                            Éditeur pour le type "{section.type}" - Bientôt disponible
                          </p>
                          <Textarea
                            value={JSON.stringify(section.content, null, 2)}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                // Juste pour la validation
                              } catch (err) {
                                // Ignorer les erreurs de parsing
                              }
                            }}
                            placeholder="Contenu en JSON"
                            rows={8}
                            className="border-2 font-mono text-sm"
                          />
                          <div className="flex gap-2 mt-4">
                            <Button
                              onClick={() => setEditingSection(null)}
                              variant="outline"
                              className="flex-1"
                            >
                              Fermer
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-lg">Aucune section pour cette page</p>
                <p className="text-gray-400 text-sm mt-2">Ajoutez votre première section ci-dessous</p>
              </div>
            )}

            {/* Ajouter une section */}
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 mt-6 bg-blue-50">
              <h3 className="font-bold text-lg mb-4">➕ Ajouter une nouvelle section</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Type de section</label>
                  <Select value={newSectionType} onValueChange={(value: any) => setNewSectionType(value)}>
                    <SelectTrigger className="border-2 text-base py-2 h-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">🎯 Hero (Grande bannière)</SelectItem>
                      <SelectItem value="text">📝 Texte (Contenu simple)</SelectItem>
                      <SelectItem value="parcours">📚 Parcours (Étapes et formation)</SelectItem>
                      <SelectItem value="image">🖼️ Image</SelectItem>
                      <SelectItem value="cta">🔘 CTA (Bouton d'action)</SelectItem>
                      <SelectItem value="features">⭐ Fonctionnalités</SelectItem>
                      <SelectItem value="testimonials">💬 Témoignages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddSection}
                  disabled={updateSection.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 h-auto text-base"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Ajouter une section
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
