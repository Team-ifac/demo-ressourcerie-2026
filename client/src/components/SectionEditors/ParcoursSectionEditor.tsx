import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp } from "lucide-react";

interface Step {
  id: string;
  title: string;
  description: string;
}

interface ParcoursSectionContent {
  title: string;
  subtitle: string;
  duration: string;
  level?: string;
  steps: Step[];
  ctaText?: string;
  ctaLink?: string;
}

interface ParcoursSectionEditorProps {
  content: Record<string, any>;
  onSave: (content: ParcoursSectionContent) => void;
  onCancel: () => void;
}

export function ParcoursSectionEditor({
  content,
  onSave,
  onCancel,
}: ParcoursSectionEditorProps) {
  const initialContent: ParcoursSectionContent = {
    title: content.title || "",
    subtitle: content.subtitle || "",
    duration: content.duration || "",
    level: content.level || "",
    steps: content.steps || [],
    ctaText: content.ctaText || "Commencer le parcours",
    ctaLink: content.ctaLink || "#",
  };

  const [formData, setFormData] = useState(initialContent);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepDesc, setNewStepDesc] = useState("");
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const handleAddStep = () => {
    if (newStepTitle.trim()) {
      setFormData({
        ...formData,
        steps: [
          ...formData.steps,
          {
            id: `step-${Date.now()}`,
            title: newStepTitle,
            description: newStepDesc,
          },
        ],
      });
      setNewStepTitle("");
      setNewStepDesc("");
    }
  };

  const handleRemoveStep = (stepId: string) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((s) => s.id !== stepId),
    });
  };

  const handleUpdateStep = (stepId: string, field: string, value: string) => {
    setFormData({
      ...formData,
      steps: formData.steps.map((s) =>
        s.id === stepId ? { ...s, [field]: value } : s
      ),
    });
  };

  const toggleStepExpanded = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const moveStep = (stepId: string, direction: "up" | "down") => {
    const index = formData.steps.findIndex((s) => s.id === stepId);
    if (
      (direction === "up" && index > 0) ||
      (direction === "down" && index < formData.steps.length - 1)
    ) {
      const newSteps = [...formData.steps];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
      setFormData({ ...formData, steps: newSteps });
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-blue-200 p-6 space-y-6">
      {/* En-tête avec instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📝 Modifier ce parcours</h3>
        <p className="text-sm text-blue-800">
          Remplissez les champs ci-dessous pour mettre à jour le contenu. Les changements s'afficheront immédiatement.
        </p>
      </div>

      {/* Titre du parcours */}
      <div>
        <label className="block text-sm font-bold mb-2 text-gray-700">
          🎯 Titre du parcours
        </label>
        <Input
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          placeholder="Ex: Devenir formateur expert"
          className="text-lg font-semibold border-2"
          onFocus={(e) => e.currentTarget.select()}
        />
        <p className="text-xs text-gray-500 mt-1">C'est le titre principal que les gens verront</p>
      </div>

      {/* Sous-titre */}
      <div>
        <label className="block text-sm font-bold mb-2 text-gray-700">
          📌 Sous-titre (description courte)
        </label>
        <Textarea
          value={formData.subtitle}
          onChange={(e) =>
            setFormData({ ...formData, subtitle: e.target.value })
          }
          placeholder="Ex: Parcours avancé pour les formateurs confirmés"
          rows={2}
          className="border-2"
          onFocus={(e) => e.currentTarget.select()}
        />
        <p className="text-xs text-gray-500 mt-1">Une courte description pour attirer l'attention</p>
      </div>

      {/* Niveau et Durée */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-700">
            ⭐ Niveau
          </label>
          <Input
            value={formData.level}
            onChange={(e) =>
              setFormData({ ...formData, level: e.target.value })
            }
            placeholder="Ex: Avancé"
            className="border-2"
            onFocus={(e) => e.currentTarget.select()}
          />
          <p className="text-xs text-gray-500 mt-1">Débutant, Intermédiaire, Avancé...</p>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-700">
            ⏱️ Durée
          </label>
          <Input
            value={formData.duration}
            onChange={(e) =>
              setFormData({ ...formData, duration: e.target.value })
            }
            placeholder="Ex: 8-10 semaines"
            className="border-2"
            onFocus={(e) => e.currentTarget.select()}
          />
          <p className="text-xs text-gray-500 mt-1">Combien de temps ça prend?</p>
        </div>
      </div>

      {/* Étapes du parcours */}
      <div className="border-t-2 pt-6">
        <label className="block text-sm font-bold mb-4 text-gray-700">
          📚 Les étapes du parcours ({formData.steps.length})
        </label>
        
        <div className="space-y-2">
          {formData.steps.map((step, index) => (
            <div
              key={step.id}
              className="bg-gray-50 border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition"
            >
              {/* En-tête de l'étape */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                onClick={() => toggleStepExpanded(step.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="bg-blue-500 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{step.title || "Sans titre"}</p>
                    <p className="text-xs text-gray-500 truncate">{step.description || "Pas de description"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {expandedSteps.has(step.id) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Contenu de l'étape (expandable) */}
              {expandedSteps.has(step.id) && (
                <div className="bg-white border-t-2 border-gray-200 p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-gray-700">Titre de l'étape</label>
                    <Input
                      value={step.title}
                      onChange={(e) =>
                        handleUpdateStep(step.id, "title", e.target.value)
                      }
                      placeholder="Ex: Pédagogie avancée"
                      className="border-2"
                      onFocus={(e) => e.currentTarget.select()}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-gray-700">Description</label>
                    <Textarea
                      value={step.description}
                      onChange={(e) =>
                        handleUpdateStep(step.id, "description", e.target.value)
                      }
                      placeholder="Ex: Approches pédagogiques innovantes"
                      rows={2}
                      className="border-2"
                      onFocus={(e) => e.currentTarget.select()}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveStep(step.id, "up")}
                      disabled={index === 0}
                      className="flex-1"
                    >
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Monter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveStep(step.id, "down")}
                      disabled={index === formData.steps.length - 1}
                      className="flex-1"
                    >
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Descendre
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveStep(step.id)}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Ajouter une nouvelle étape */}
        <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
          <h4 className="font-bold text-blue-900">➕ Ajouter une nouvelle étape</h4>
          <Input
            value={newStepTitle}
            onChange={(e) => setNewStepTitle(e.target.value)}
            placeholder="Titre de la nouvelle étape"
            className="border-2"
            onKeyPress={(e) => {
              if (e.key === "Enter") handleAddStep();
            }}
          />
          <Textarea
            value={newStepDesc}
            onChange={(e) => setNewStepDesc(e.target.value)}
            placeholder="Description de la nouvelle étape"
            rows={2}
            className="border-2"
          />
          <Button
            onClick={handleAddStep}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter cette étape
          </Button>
        </div>
      </div>

      {/* Bouton CTA */}
      <div className="border-t-2 pt-6 space-y-4">
        <label className="block text-sm font-bold text-gray-700">
          🔘 Bouton d'action
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700">Texte du bouton</label>
            <Input
              value={formData.ctaText}
              onChange={(e) =>
                setFormData({ ...formData, ctaText: e.target.value })
              }
              placeholder="Ex: Commencer le parcours"
              className="border-2"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700">Lien du bouton</label>
            <Input
              value={formData.ctaLink}
              onChange={(e) =>
                setFormData({ ...formData, ctaLink: e.target.value })
              }
              placeholder="Ex: /parcours/expert"
              className="border-2"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-3 pt-6 border-t-2">
        <Button
          onClick={() => onSave(formData)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 h-auto"
        >
          <Save className="w-5 h-5 mr-2" />
          ✅ Sauvegarder les changements
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 border-2 font-bold py-2 h-auto"
        >
          <X className="w-5 h-5 mr-2" />
          ❌ Annuler
        </Button>
      </div>
    </div>
  );
}
