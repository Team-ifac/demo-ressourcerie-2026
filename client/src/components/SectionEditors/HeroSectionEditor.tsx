import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";

interface HeroSectionContent {
  title: string;
  subtitle: string;
  image?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundColor?: string;
}

interface HeroSectionEditorProps {
  content: Record<string, any>;
  onSave: (content: HeroSectionContent) => void;
  onCancel: () => void;
}

export function HeroSectionEditor({
  content,
  onSave,
  onCancel,
}: HeroSectionEditorProps) {
  const initialContent: HeroSectionContent = {
    title: content.title || "",
    subtitle: content.subtitle || "",
    image: content.image || "",
    ctaText: content.ctaText || "",
    ctaLink: content.ctaLink || "",
    backgroundColor: content.backgroundColor || "#3B82F6",
  };

  const [formData, setFormData] = useState(initialContent);

  return (
    <div className="bg-gray-50 p-6 rounded-lg space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Titre principal</label>
        <Textarea
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          placeholder="Ex: Bienvenue sur la Ressourcerie IFAC"
          rows={2}
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Sous-titre</label>
        <Textarea
          value={formData.subtitle}
          onChange={(e) =>
            setFormData({ ...formData, subtitle: e.target.value })
          }
          placeholder="Description courte"
          rows={2}
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">URL de l'image</label>
        <Input
          value={formData.image}
          onChange={(e) =>
            setFormData({ ...formData, image: e.target.value })
          }
          placeholder="https://..."
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Couleur de fond</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={formData.backgroundColor}
            onChange={(e) =>
              setFormData({ ...formData, backgroundColor: e.target.value })
            }
            className="w-12 h-10 rounded cursor-pointer"
          />
          <Input
            value={formData.backgroundColor}
            onChange={(e) =>
              setFormData({ ...formData, backgroundColor: e.target.value })
            }
            placeholder="#3B82F6"
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Texte du bouton</label>
          <Input
            value={formData.ctaText}
            onChange={(e) =>
              setFormData({ ...formData, ctaText: e.target.value })
            }
            placeholder="Ex: Commencer"
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Lien du bouton</label>
          <Input
            value={formData.ctaLink}
            onChange={(e) =>
              setFormData({ ...formData, ctaLink: e.target.value })
            }
            placeholder="Ex: /ressources"
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          onClick={() => onSave(formData)}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          Sauvegarder
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          <X className="w-4 h-4 mr-2" />
          Annuler
        </Button>
      </div>
    </div>
  );
}
