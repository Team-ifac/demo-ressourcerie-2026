import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintableVersionProps {
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
    duration?: string;
    difficulty?: string;
    ageGroup?: string;
  };
}

export function PrintableVersion({
  resourceId,
  resourceTitle,
  resourceContent,
}: PrintableVersionProps) {
  const escapeHtml = (value: string | undefined | null) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const escapeHtmlWithLineBreaks = (value: string | undefined | null) =>
    escapeHtml(value).replace(/\n/g, "<br />");

  const handlePrint = () => {
    // Créer une nouvelle fenêtre avec le contenu imprimable
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(resourceContent.title)}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          
          .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .header h1 {
            color: #1e40af;
            font-size: 28px;
            margin-bottom: 10px;
          }
          
          .header p {
            color: #666;
            font-size: 14px;
          }
          
          .metadata {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f3f4f6;
            border-radius: 8px;
          }
          
          .metadata-item {
            display: flex;
            flex-direction: column;
          }
          
          .metadata-item label {
            font-weight: bold;
            color: #666;
            font-size: 12px;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          
          .metadata-item value {
            font-size: 14px;
            color: #333;
          }
          
          .tags {
            margin-bottom: 30px;
          }
          
          .tags label {
            font-weight: bold;
            color: #666;
            font-size: 12px;
            margin-bottom: 10px;
            display: block;
            text-transform: uppercase;
          }
          
          .tag {
            display: inline-block;
            background-color: #dbeafe;
            color: #1e40af;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            margin-right: 8px;
            margin-bottom: 8px;
          }
          
          .section {
            margin-bottom: 30px;
          }
          
          .section h2 {
            color: #1e40af;
            font-size: 18px;
            margin-bottom: 15px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
          }
          
          .section p {
            line-height: 1.8;
            text-align: justify;
          }
          
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 11px;
            color: #999;
          }
          
          @media print {
            body {
              padding: 20px;
            }
            
            .no-print {
              display: none;
            }
            
            .section {
              page-break-inside: avoid;
            }
          }
          
          @page {
            margin: 2cm;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${escapeHtml(resourceContent.title)}</h1>
          <p>Ressourcerie ifac - Ressource pédagogique</p>
        </div>
        
        <div class="metadata">
          ${resourceContent.category ? `
            <div class="metadata-item">
              <label>Catégorie</label>
              <value>${escapeHtml(resourceContent.category)}</value>
            </div>
          ` : ""}
          ${resourceContent.author ? `
            <div class="metadata-item">
              <label>Auteur</label>
              <value>${escapeHtml(resourceContent.author)}</value>
            </div>
          ` : ""}
          ${resourceContent.difficulty ? `
            <div class="metadata-item">
              <label>Difficulté</label>
              <value>${escapeHtml(resourceContent.difficulty)}</value>
            </div>
          ` : ""}
          ${resourceContent.duration ? `
            <div class="metadata-item">
              <label>Durée</label>
              <value>${escapeHtml(resourceContent.duration)}</value>
            </div>
          ` : ""}
          ${resourceContent.ageGroup ? `
            <div class="metadata-item">
              <label>Public</label>
              <value>${escapeHtml(resourceContent.ageGroup)}</value>
            </div>
          ` : ""}
          ${resourceContent.createdAt ? `
            <div class="metadata-item">
              <label>Date</label>
              <value>${new Date(resourceContent.createdAt).toLocaleDateString("fr-FR")}</value>
            </div>
          ` : ""}
        </div>
        
        ${resourceContent.tags && resourceContent.tags.length > 0 ? `
          <div class="tags">
            <label>Tags</label>
            <div>
              ${resourceContent.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
            </div>
          </div>
        ` : ""}
        
        ${resourceContent.description ? `
          <div class="section">
            <h2>Description</h2>
            <p>${escapeHtmlWithLineBreaks(resourceContent.description)}</p>
          </div>
        ` : ""}
        
        ${resourceContent.content ? `
          <div class="section">
            <h2>Contenu</h2>
            <div>${escapeHtmlWithLineBreaks(resourceContent.content)}</div>
          </div>
        ` : ""}
        
        <div class="footer">
          <p>Document téléchargé depuis la Ressourcerie ifac</p>
          <p>Ressource ID: ${resourceId}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Attendre que le contenu soit chargé avant d'imprimer
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <Button
      onClick={handlePrint}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Printer className="h-4 w-4" />
      Imprimer
    </Button>
  );
}
