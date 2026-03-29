import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader } from "lucide-react";
import html2pdf from "html2pdf.js";

interface ExportPDFProps {
  resourceId: number;
  resourceTitle: string;
  resourceContent: {
    title: string;
    description?: string;
    author?: string;
    category?: string;
    tags?: string[];
    content?: string;
    downloadUrl?: string;
    createdAt?: Date;
  };
}

export function ExportPDF({
  resourceId,
  resourceTitle,
  resourceContent,
}: ExportPDFProps) {
  const [isExporting, setIsExporting] = useState(false);

  const escapeHtml = (value: string | undefined | null) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const escapeHtmlWithLineBreaks = (value: string | undefined | null) =>
    escapeHtml(value).replace(/\n/g, "<br />");

  const safeFileName = `${resourceTitle}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Créer un élément HTML temporaire avec le contenu
      const element = document.createElement("div");
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <div style="border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px;">
            <h1 style="margin: 0; color: #1e40af; font-size: 28px;">${escapeHtml(resourceContent.title)}</h1>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
              Ressourcerie ifac
            </p>
          </div>

          ${resourceContent.description ? `
            <div style="margin-bottom: 20px;">
              <h2 style="color: #1e40af; font-size: 16px; margin-top: 0;">Description</h2>
              <p style="line-height: 1.6;">${escapeHtmlWithLineBreaks(resourceContent.description)}</p>
            </div>
          ` : ""}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            ${resourceContent.category ? `
              <div>
                <p style="margin: 0; color: #666; font-size: 12px; font-weight: bold;">CATÉGORIE</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">${escapeHtml(resourceContent.category)}</p>
              </div>
            ` : ""}
            ${resourceContent.author ? `
              <div>
                <p style="margin: 0; color: #666; font-size: 12px; font-weight: bold;">AUTEUR</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">${escapeHtml(resourceContent.author)}</p>
              </div>
            ` : ""}
          </div>

          ${resourceContent.tags && resourceContent.tags.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <p style="margin: 0; color: #666; font-size: 12px; font-weight: bold;">TAGS</p>
              <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;">
                ${resourceContent.tags.map((tag) => `
                  <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                    ${escapeHtml(tag)}
                  </span>
                `).join("")}
              </div>
            </div>
          ` : ""}

          ${resourceContent.content ? `
            <div style="margin-bottom: 20px;">
              <h2 style="color: #1e40af; font-size: 16px; margin-top: 0;">Contenu</h2>
              <div style="line-height: 1.8; font-size: 13px;">
                ${escapeHtmlWithLineBreaks(resourceContent.content)}
              </div>
            </div>
          ` : ""}

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #999;">
            <p style="margin: 0;">Téléchargé depuis la Ressourcerie ifac</p>
            <p style="margin: 5px 0 0 0;">
              ${resourceContent.createdAt ? new Date(resourceContent.createdAt).toLocaleDateString("fr-FR") : ""}
            </p>
          </div>
        </div>
      `;

      // Configuration de html2pdf
      const options = {
        margin: 10,
        filename: `${safeFileName || "ressource"}-${resourceId}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait" as const, unit: "mm" as const, format: "a4" },
      };

      // Générer le PDF
      html2pdf().set(options as any).from(element).save();
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExportPDF}
      disabled={isExporting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Loader className="h-4 w-4 animate-spin" />
          Export en cours...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Télécharger PDF
        </>
      )}
    </Button>
  );
}
