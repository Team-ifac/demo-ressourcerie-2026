import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Step {
  title: string;
  description: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  duration: string;
  level: string;
  steps: Step[];
}

const DEFAULT_PATHS: LearningPath[] = [
  {
    id: "animator-beginner",
    title: "Débuter en animation",
    description: "Parcours complet pour les nouveaux animateurs",
    icon: "Users",
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
    icon: "BookOpen",
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
    icon: "Briefcase",
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
    icon: "GraduationCap",
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

export default function AdminLearningPaths() {
  const [paths, setPaths] = useState<LearningPath[]>(DEFAULT_PATHS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null);
  const [newStep, setNewStep] = useState({ title: "", description: "" });

  const handleEdit = (path: LearningPath) => {
    setEditingId(path.id);
    setEditingPath({ ...path });
    setNewStep({ title: "", description: "" });
  };

  const handleSave = () => {
    if (!editingPath) return;
    
    setPaths(paths.map(p => p.id === editingPath.id ? editingPath : p));
    setEditingId(null);
    setEditingPath(null);
    toast.success("Parcours modifié avec succès !");
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingPath(null);
    setNewStep({ title: "", description: "" });
  };

  const handleAddStep = () => {
    if (!editingPath || !newStep.title || !newStep.description) {
      toast.error("Veuillez remplir tous les champs de l'étape");
      return;
    }

    setEditingPath({
      ...editingPath,
      steps: [...editingPath.steps, { ...newStep }]
    });
    setNewStep({ title: "", description: "" });
    toast.success("Étape ajoutée !");
  };

  const handleRemoveStep = (index: number) => {
    if (!editingPath) return;
    setEditingPath({
      ...editingPath,
      steps: editingPath.steps.filter((_, i) => i !== index)
    });
  };

  const handleDelete = (id: string) => {
    setPaths(paths.filter(p => p.id !== id));
    toast.success("Parcours supprimé !");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🎓 Administration des Parcours</h1>
          <p className="text-muted-foreground">
            Modifiez les titres, descriptions, durées et étapes des parcours d'apprentissage
          </p>
        </div>

        <div className="space-y-6">
          {paths.map((path) => (
            <Card key={path.id} className="overflow-hidden">
              {editingId === path.id && editingPath ? (
                // Mode édition
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Titre du parcours</label>
                      <Input
                        value={editingPath.title}
                        onChange={(e) => setEditingPath({ ...editingPath, title: e.target.value })}
                        placeholder="Ex: Devenir formateur expert"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <Textarea
                        value={editingPath.description}
                        onChange={(e) => setEditingPath({ ...editingPath, description: e.target.value })}
                        placeholder="Description du parcours"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Niveau</label>
                        <Input
                          value={editingPath.level}
                          onChange={(e) => setEditingPath({ ...editingPath, level: e.target.value })}
                          placeholder="Ex: Avancé"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Durée</label>
                        <Input
                          value={editingPath.duration}
                          onChange={(e) => setEditingPath({ ...editingPath, duration: e.target.value })}
                          placeholder="Ex: 8-10 semaines"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Étapes */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">Étapes du parcours ({editingPath.steps.length})</h3>
                    
                    <div className="space-y-3 mb-6">
                      {editingPath.steps.map((step, index) => (
                        <div key={index} className="flex gap-3 p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{index + 1}. {step.title}</p>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStep(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Ajouter une étape */}
                    <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-medium text-sm">➕ Ajouter une nouvelle étape</h4>
                      <Input
                        value={newStep.title}
                        onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
                        placeholder="Titre de l'étape"
                      />
                      <Textarea
                        value={newStep.description}
                        onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                        placeholder="Description de l'étape"
                        rows={2}
                      />
                      <Button
                        onClick={handleAddStep}
                        className="w-full"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter cette étape
                      </Button>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex gap-3 border-t pt-6">
                    <Button onClick={handleSave} className="flex-1 gap-2">
                      <Save className="h-4 w-4" />
                      Sauvegarder les changements
                    </Button>
                    <Button onClick={handleCancel} variant="outline" className="flex-1 gap-2">
                      <X className="h-4 w-4" />
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              ) : (
                // Mode affichage
                <>
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{path.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{path.description}</p>
                      </div>
                      <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-semibold">
                        {path.level}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Durée</p>
                        <p className="font-medium">{path.duration}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Étapes</p>
                        <p className="font-medium">{path.steps.length} étapes</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(path)}
                        className="flex-1 gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Modifier
                      </Button>
                      <Button
                        onClick={() => handleDelete(path.id)}
                        variant="destructive"
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ <strong>Note :</strong> Les modifications sont sauvegardées localement. Pour persister les changements après rechargement, une intégration avec la base de données est nécessaire.
          </p>
        </div>
      </div>
    </div>
  );
}
