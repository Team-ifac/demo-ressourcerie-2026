import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileDown, Loader, Calendar } from "lucide-react";
import html2pdf from "html2pdf.js";

interface MonthlyReportProps {
  month?: string;
  year?: number;
}

export function MonthlyReport({ month = "Juin", year = 2024 }: MonthlyReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(month);

  const reportData = {
    period: `${selectedMonth} ${year}`,
    summary: {
      totalViews: 15234,
      totalDownloads: 3421,
      newUsers: 234,
      engagement: 68,
      avgRating: 4.2,
    },
    topResources: [
      { title: "Jeu des 5 sens", views: 2341, downloads: 456 },
      { title: "Gestion des conflits", views: 1876, downloads: 234 },
      { title: "Activités en groupe", views: 1654, downloads: 198 },
    ],
    trends: {
      viewsTrend: "+12%",
      downloadsTrend: "+8%",
      usersTrend: "+15%",
      engagementTrend: "+3%",
    },
    recommendations: [
      "Augmenter la promotion des ressources avec les meilleurs taux d'engagement",
      "Créer plus de contenu dans la catégorie 'Gestion de groupe' (tendance haussière)",
      "Optimiser les ressources avec un taux de rebond élevé",
      "Encourager les utilisateurs à laisser des avis et commentaires",
    ],
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const element = document.createElement("div");
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; background: white;">
          <!-- En-tête -->
          <div style="border-bottom: 3px solid #2563eb; padding-bottom: 30px; margin-bottom: 40px;">
            <h1 style="margin: 0; color: #1e40af; font-size: 32px;">Rapport Mensuel</h1>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 16px;">Ressourcerie IFAC - ${reportData.period}</p>
          </div>

          <!-- Résumé exécutif -->
          <div style="margin-bottom: 40px;">
            <h2 style="color: #1e40af; font-size: 20px; margin-top: 0;">Résumé exécutif</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; margin-top: 20px;">
              <div style="padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
                <p style="margin: 0; color: #666; font-size: 12px; font-weight: bold;">VUES TOTALES</p>
                <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #1e40af;">
                  ${reportData.summary.totalViews.toLocaleString()}
                </p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #10b981;">${reportData.trends.viewsTrend}</p>
              </div>
              <div style="padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
                <p style="margin: 0; color: #666; font-size: 12px; font-weight: bold;">TÉLÉCHARGEMENTS</p>
                <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #1e40af;">
                  ${reportData.summary.totalDownloads.toLocaleString()}
                </p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #10b981;">${reportData.trends.downloadsTrend}</p>
              </div>
              <div style="padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
                <p style="margin: 0; color: #666; font-size: 12px; font-weight: bold;">NOUVEAUX UTILISATEURS</p>
                <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #1e40af;">
                  ${reportData.summary.newUsers}
                </p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #10b981;">${reportData.trends.usersTrend}</p>
              </div>
              <div style="padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
                <p style="margin: 0; color: #666; font-size: 12px; font-weight: bold;">ENGAGEMENT</p>
                <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #1e40af;">
                  ${reportData.summary.engagement}%
                </p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #10b981;">${reportData.trends.engagementTrend}</p>
              </div>
            </div>
          </div>

          <!-- Top ressources -->
          <div style="margin-bottom: 40px; page-break-inside: avoid;">
            <h2 style="color: #1e40af; font-size: 20px; margin-top: 0;">Top 3 ressources</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e5e7eb;">Ressource</th>
                  <th style="padding: 12px; text-align: center; font-weight: bold; border-bottom: 2px solid #e5e7eb;">Vues</th>
                  <th style="padding: 12px; text-align: center; font-weight: bold; border-bottom: 2px solid #e5e7eb;">Téléchargements</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.topResources
                  .map(
                    (resource) => `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; text-align: left;">${resource.title}</td>
                    <td style="padding: 12px; text-align: center;">${resource.views}</td>
                    <td style="padding: 12px; text-align: center;">${resource.downloads}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <!-- Recommandations -->
          <div style="margin-bottom: 40px;">
            <h2 style="color: #1e40af; font-size: 20px; margin-top: 0;">Recommandations</h2>
            <ul style="margin-top: 20px; padding-left: 20px;">
              ${reportData.recommendations
                .map(
                  (rec) => `
                <li style="margin-bottom: 12px; line-height: 1.6;">${rec}</li>
              `
                )
                .join("")}
            </ul>
          </div>

          <!-- Pied de page -->
          <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #999;">
            <p style="margin: 0;">Rapport généré automatiquement - Ressourcerie IFAC</p>
            <p style="margin: 5px 0 0 0;">${new Date().toLocaleDateString("fr-FR")}</p>
          </div>
        </div>
      `;

      const options = {
        margin: 15,
        filename: `rapport-${selectedMonth.toLowerCase()}-${year}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait" as const, unit: "mm" as const, format: "a4" },
      };

      html2pdf().set(options as any).from(element).save();
    } catch (error) {
      console.error("Erreur lors de la génération du rapport:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Rapport mensuel</CardTitle>
            <CardDescription>Téléchargez le rapport d'activité du mois</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Janvier">Janvier</SelectItem>
                <SelectItem value="Février">Février</SelectItem>
                <SelectItem value="Mars">Mars</SelectItem>
                <SelectItem value="Avril">Avril</SelectItem>
                <SelectItem value="Mai">Mai</SelectItem>
                <SelectItem value="Juin">Juin</SelectItem>
                <SelectItem value="Juillet">Juillet</SelectItem>
                <SelectItem value="Août">Août</SelectItem>
                <SelectItem value="Septembre">Septembre</SelectItem>
                <SelectItem value="Octobre">Octobre</SelectItem>
                <SelectItem value="Novembre">Novembre</SelectItem>
                <SelectItem value="Décembre">Décembre</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generatePDF} disabled={isGenerating} className="gap-2">
              {isGenerating ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  Télécharger PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">Période du rapport</p>
              <p className="text-lg font-bold text-blue-700 mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {selectedMonth} {year}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-900">Format</p>
              <p className="text-lg font-bold text-green-700 mt-1">PDF avec graphiques</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Le rapport inclut un résumé exécutif, les top ressources, les tendances et des recommandations pour optimiser la plateforme.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
