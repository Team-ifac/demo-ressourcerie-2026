import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";

interface TextSectionContent {
  title: string;
  content: string;
  alignment?: "left" | "center" | "right";
}

interface TextSectionEditorProps {
  content: Record<string, any>;
  onSave: (content: TextSectionContent) => void;
  onCancel: () => void;
}

export function TextSectionEditor({
  content,
  onSave,
  onCancel,
}: TextSectionEditorProps) {
  const initialContent: TextSectionContent = {
    title: content.title || "",
    content: content.content || "",
    alignment: content.alignment || "left",
  };

  const [formData, setFormData] = useState(initialContent);

  return (
    <div className="bg-gray-50 p-6 rounded-lg space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Titre</label>
        <Input
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          placeholder="Titre de la section"
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Contenu</label>
        <Textarea
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          placeholder="Contenu de la section"
          rows={8}
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Alignement</label>
        <div className="flex gap-2">
          {(["left", "center", "right"] as const).map((align) => (
            <Button
              key={align}
              variant={formData.alignment === align ? "default" : "outline"}
              onClick={() => setFormData({ ...formData, alignment: align })}
              className="flex-1"
            >
              {align.charAt(0).toUpperCase() + align.slice(1)}
            </Button>
          ))}
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
