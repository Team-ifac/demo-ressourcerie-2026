import { useMemo, useRef } from "react";

type GeneratedActivity = {
  id: number;
  title: string;
  summary?: string | null;
  content?: string | null;
  category?: string | null;
  ageRange?: string | null;
  duration?: string | null;
};

type DaySlot = {
  key: string;
  label: string;
  activities?: GeneratedActivity[];
  activity?: string;
};

type DayPlan = {
  label: string;
  slots: DaySlot[];
};

type SelectedActivitiesMap = Record<string, { id: number; isManual?: boolean }>;

type SlotDisplay = {
  title: string;
  summary: string;
  category: string;
  ageRange: string;
  duration: string;
};

type WeekGroup = {
  weekIndex: number;
  days: DayPlan[];
};
type SelectedRuleActivity = {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  ageRange: string;
  duration: string;
};
function buildSlotSelectionKey(dayLabel: string, slotKey: string) {
  return `${dayLabel}__${slotKey}`;
}

function formatActivityCategoryLabel(category?: string | null) {
  const raw = String(category ?? "").trim();
  if (!raw) return "";

  const [slotKey, categoryKey] = raw.split("/");

  const slotLabelMap: Record<string, string> = {
    matin: "Matin",
    midi: "Midi",
    apresMidi: "Après-midi",
    veillee: "Veillée",
  };

  const categoryLabelMap: Record<string, string> = {
    activitesCalmes: "Activités calmes",
    activitesReveil: "Activités réveil",
    activitesManuelles: "Activités manuelles",
    activitesArtistiques: "Activités artistiques",
    activitesExpression: "Activités d’expression",
    petitsJeuxCollectifs: "Petits jeux collectifs",
    tempsLibreEncadre: "Temps libre encadré",
    jeuxCalmes: "Jeux calmes",
    jeuxDeCour: "Jeux de cour",
    tempsCalme: "Temps calme",
    petitsAteliersAutonomes: "Petits ateliers autonomes",
    activitesSportives: "Activités sportives",
    jeuxExterieurs: "Jeux extérieurs",
    grandsJeux: "Grands jeux",
    activitesCulturelles: "Activités culturelles",
    sorties: "Sorties",
    projets: "Projets",
    jeuxCollectifs: "Jeux collectifs",
    jeuxAmbiance: "Jeux d’ambiance",
    jeuxMusicaux: "Jeux musicaux",
    spectaclesExpression: "Spectacles / expression",
    veilleesThematiques: "Veillées thématiques",
  };

  const slotLabel = slotLabelMap[slotKey ?? ""] ?? "";
  const categoryLabel = categoryLabelMap[categoryKey ?? ""] ?? categoryKey ?? raw;

  if (slotLabel && categoryLabel) {
    return `${slotLabel} · ${categoryLabel}`;
  }

  return categoryLabel || raw;
}

function formatPrintCategoryShort(category?: string | null) {
  const raw = String(category ?? "").trim();
  if (!raw) return "";

  const [, categoryKey] = raw.split("/");

  const categoryLabelMap: Record<string, string> = {
    activitesCalmes: "Activités calmes",
    activitesReveil: "Activités réveil",
    activitesManuelles: "Activités manuelles",
    activitesArtistiques: "Activités artistiques",
    activitesExpression: "Expression",
    petitsJeuxCollectifs: "Petits jeux collectifs",
    tempsLibreEncadre: "Temps libre encadré",
    jeuxCalmes: "Jeux calmes",
    jeuxDeCour: "Jeux de cour",
    tempsCalme: "Temps calme",
    petitsAteliersAutonomes: "Ateliers autonomes",
    activitesSportives: "Activités sportives",
    jeuxExterieurs: "Jeux extérieurs",
    grandsJeux: "Grands jeux",
    activitesCulturelles: "Activités culturelles",
    sorties: "Sorties",
    projets: "Projets",
    jeuxCollectifs: "Jeux collectifs",
    jeuxAmbiance: "Jeux d’ambiance",
    jeuxMusicaux: "Jeux musicaux",
    spectaclesExpression: "Spectacles / expression",
    veilleesThematiques: "Veillées thématiques",
  };

  return categoryLabelMap[categoryKey ?? ""] ?? categoryKey ?? raw;
}

function getDayNameFromLabel(dayLabel: string) {
  const parts = dayLabel.split("—");
  return parts[1]?.trim() ?? dayLabel;
}

function sanitizePdfText(value?: string | null) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[•◦▪■□▶►●]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/[^\n\r\t -~À-ÿŒœŸ]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitDaysIntoWeeks(days: DayPlan[]) {
  const weeks: WeekGroup[] = [];
  let currentWeek: DayPlan[] = [];

  days.forEach((day, index) => {
    const isMonday = day.label.includes("Lundi");

    if (index > 0 && isMonday && currentWeek.length > 0) {
      weeks.push({
        weekIndex: weeks.length + 1,
        days: currentWeek,
      });
      currentWeek = [];
    }

    currentWeek.push(day);
  });

  if (currentWeek.length > 0) {
    weeks.push({
      weekIndex: weeks.length + 1,
      days: currentWeek,
    });
  }

  return weeks;
}

export default function ProgramResultPage() {
  const { generatedDays, selectedActivities } = useMemo(() => {
    const stored = sessionStorage.getItem("programResult");

    if (!stored) {
      return {
        generatedDays: [] as DayPlan[],
        selectedActivities: {} as SelectedActivitiesMap,
      };
    }

    try {
      const parsed = JSON.parse(stored);

      return {
        generatedDays: Array.isArray(parsed?.generatedDays)
          ? (parsed.generatedDays as DayPlan[])
          : [],
        selectedActivities:
          parsed?.selectedActivities && typeof parsed.selectedActivities === "object"
            ? (parsed.selectedActivities as SelectedActivitiesMap)
            : ({} as SelectedActivitiesMap),
      };
    } catch {
      return {
        generatedDays: [] as DayPlan[],
        selectedActivities: {} as SelectedActivitiesMap,
      };
    }
  }, []);

  const weeks = useMemo(() => splitDaysIntoWeeks(generatedDays), [generatedDays]);
  const printExportRef = useRef<HTMLDivElement>(null);

  const selectedRuleActivities = useMemo<SelectedRuleActivity[]>(() => {
    const uniqueActivities = new Map<number, SelectedRuleActivity>();

    generatedDays.forEach((day) => {
      day.slots.forEach((slot) => {
        if (slot.activity || !slot.activities?.length) {
          return;
        }

        const selectionKey = buildSlotSelectionKey(day.label, slot.key);
        const selectedId = selectedActivities[selectionKey]?.id;

        const selectedActivity =
          slot.activities.find((activity) => activity.id === selectedId) ??
          slot.activities[0];

        if (!selectedActivity || uniqueActivities.has(selectedActivity.id)) {
          return;
        }

        uniqueActivities.set(selectedActivity.id, {
          id: selectedActivity.id,
          title: selectedActivity.title,
          summary: selectedActivity.summary ?? "",
          content: selectedActivity.content ?? "",
          category: selectedActivity.category ?? "",
          ageRange: selectedActivity.ageRange ?? "",
          duration: selectedActivity.duration ?? "",
        });
      });
    });

    return Array.from(uniqueActivities.values());
  }, [generatedDays, selectedActivities]);

  const getSlotDisplay = (day: DayPlan, slotKey: string): SlotDisplay => {
    const slot = day.slots.find((item) => item.key === slotKey);

    if (!slot) {
      return {
        title: "Aucune activité",
        summary: "",
        category: "",
        ageRange: "",
        duration: "",
      };
    }

    if (slot.activity) {
      return {
        title: slot.activity,
        summary: "",
        category: "",
        ageRange: "",
        duration: "",
      };
    }

    const selectionKey = buildSlotSelectionKey(day.label, slotKey);
    const selectedId = selectedActivities[selectionKey]?.id;

    const selectedActivity =
      slot.activities?.find((activity) => activity.id === selectedId) ??
      slot.activities?.[0];

    if (!selectedActivity) {
      return {
        title: "Aucune activité",
        summary: "",
        category: "",
        ageRange: "",
        duration: "",
      };
    }

    return {
      title: selectedActivity.title,
      summary: selectedActivity.summary ?? "",
      category: selectedActivity.category ?? "",
      ageRange: selectedActivity.ageRange ?? "",
      duration: selectedActivity.duration ?? "",
    };
  };

  const handleCopyProgram = async () => {
    try {
      const text = generatedDays
        .map((day) => {
          const lines = day.slots.map((slot) => {
            if (slot.activity) {
              return `${slot.label} : ${slot.activity}`;
            }

            const selectionKey = buildSlotSelectionKey(day.label, slot.key);
            const selectedId = selectedActivities[selectionKey]?.id;
            const selectedActivity =
              slot.activities?.find((activity) => activity.id === selectedId) ??
              slot.activities?.[0];

            return `${slot.label} : ${selectedActivity?.title ?? "Aucune activité"}`;
          });

          return `${day.label}\n${lines.join("\n")}`;
        })
        .join("\n\n");

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      alert("Programme copié.");
    } catch (error) {
      console.error("Erreur copie :", error);
      alert("La copie a échoué.");
    }
  };

const handleDownloadPdf = async () => {
  try {
    const mod = await import("jspdf");
    const jsPDF = mod.jsPDF;

    const logoDataUrl = await new Promise<string>((resolve, reject) => {
      fetch("/logo-ifac.png")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Impossible de charger le logo ifac.");
          }
          return response.blob();
        })
        .then((blob) => {
          const reader = new FileReader();

          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result);
            } else {
              reject(new Error("Conversion du logo en data URL impossible."));
            }
          };

          reader.onerror = () => {
            reject(new Error("Lecture du logo impossible."));
          };

          reader.readAsDataURL(blob);
        })
        .catch(reject);
    });

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 10;
    const startY = 18;
    const tableTopY = 44;
    const tableWidth = pageWidth - marginX * 2;
    const hasEveningSlot = generatedDays.some((day) =>
      day.slots.some((slot) => slot.key === "veillee")
    );

    const slots = [
      {
        key: "matin",
        label: "Matin",
        fill: [239, 246, 255] as const,
        accent: [59, 130, 246] as const,
      },
      {
        key: "midi",
        label: "Midi",
        fill: [249, 250, 251] as const,
        accent: [107, 114, 128] as const,
      },
      {
        key: "apresMidi",
        label: "Après-midi",
        fill: [240, 253, 244] as const,
        accent: [34, 197, 94] as const,
      },
      ...(hasEveningSlot
        ? [
            {
              key: "veillee",
              label: "Veillée",
              fill: [245, 243, 255] as const,
              accent: [139, 92, 246] as const,
            },
          ]
        : []),
    ];

    const truncateLines = (lines: string[], maxLines: number) => {
      if (lines.length <= maxLines) return lines;

      const kept = lines.slice(0, maxLines);
      const lastLine = kept[maxLines - 1] ?? "";
      kept[maxLines - 1] = lastLine.length > 2 ? `${lastLine.slice(0, -2)}…` : `${lastLine}…`;
      return kept;
    };

    weeks.forEach((week, weekIndex) => {
      if (weekIndex > 0) doc.addPage();

      const dayCount = Math.max(week.days.length, 1);
      const isSevenDays = dayCount === 7;

      const firstColWidth = isSevenDays ? 20 : 26;
      const dayColWidth = (tableWidth - firstColWidth) / dayCount;
      const headerHeight = isSevenDays ? 13 : 15;
      const rowHeight = isSevenDays ? 32 : 38;
      const slotLabelFontSize = isSevenDays ? 7.6 : 8.8;
      const dayHeaderFontSize = isSevenDays ? 7.4 : 8.5;
      const titleFontSize = isSevenDays ? 6.1 : 7.2;
      const metaFontSize = isSevenDays ? 5.1 : 5.8;
      const titleMaxLines = isSevenDays ? 2 : 3;
      const metaMaxLines = isSevenDays ? 2 : 3;
      const titleLineHeight = isSevenDays ? 2.9 : 3.4;
      const titleStartY = isSevenDays ? 5.4 : 6.2;
      const metaGap = isSevenDays ? 0.7 : 1;

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(marginX, startY - 10, tableWidth, 19, 4, 4, "F");

      doc.addImage(logoDataUrl, "PNG", marginX + 3, startY - 7.5, 18, 13.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.setTextColor(15, 23, 42);
      doc.text(`Programme d’animation — Semaine ${week.weekIndex}`, pageWidth / 2, startY - 1, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Ressourcerie ifac · planning hebdomadaire", pageWidth / 2, startY + 5, {
        align: "center",
      });

      let y = tableTopY;

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(marginX, y, firstColWidth, headerHeight, 2, 2, "FD");

      week.days.forEach((day, i) => {
        const x = marginX + firstColWidth + i * dayColWidth;

        doc.setFillColor(226, 232, 240);
        doc.roundedRect(x, y, dayColWidth, headerHeight, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(dayHeaderFontSize);
        doc.setTextColor(30, 41, 59);
        doc.text(String(getDayNameFromLabel(day.label) || ""), x + dayColWidth / 2, y + headerHeight / 2 + 1, {
          align: "center",
        });
      });

      y += headerHeight + 1.5;

      slots.forEach((slot, rowIndex) => {
        const rowY = y + rowIndex * rowHeight;

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(marginX, rowY, firstColWidth, rowHeight - 1, 2, 2, "FD");

        doc.setFillColor(slot.accent[0], slot.accent[1], slot.accent[2]);
        doc.roundedRect(marginX + 1.5, rowY + 1.5, 1.6, rowHeight - 4, 0.8, 0.8, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(slotLabelFontSize);
        doc.setTextColor(30, 41, 59);
        doc.text(slot.label, marginX + 4.5, rowY + (isSevenDays ? 7 : 8));

        week.days.forEach((day, i) => {
          const x = marginX + firstColWidth + i * dayColWidth;
          const data = getSlotDisplay(day, slot.key);

          doc.setFillColor(slot.fill[0], slot.fill[1], slot.fill[2]);
          doc.roundedRect(x, rowY, dayColWidth, rowHeight - 1, 2, 2, "FD");

          const titleLines = truncateLines(
            doc.splitTextToSize(String(data.title || ""), dayColWidth - 4),
            titleMaxLines,
          );

          const metaParts = [
            formatPrintCategoryShort(data.category),
            data.duration ? `Durée : ${data.duration}` : "",
            data.ageRange ? `Âge : ${data.ageRange}` : "",
          ].filter(Boolean);

          const metaText = metaParts.join(" · ");
          const metaLines = metaText
            ? truncateLines(doc.splitTextToSize(metaText, dayColWidth - 4), metaMaxLines)
            : [];

          doc.setFont("helvetica", "bold");
          doc.setFontSize(titleFontSize);
          doc.setTextColor(15, 23, 42);
          doc.text(titleLines, x + 2, rowY + titleStartY);

          if (metaLines.length > 0) {
            const metaStartY = rowY + titleStartY + titleLines.length * titleLineHeight + metaGap;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(metaFontSize);
            doc.setTextColor(100, 116, 139);
            doc.text(metaLines, x + 2, metaStartY);
          }
        });
      });
    });

    doc.save("programme-ifac.pdf");
  } catch (error) {
    console.error("Erreur export PDF détaillée :", error);
    alert("Erreur PDF : " + String(error));
  }
};

const handleDownloadRulesPdf = async () => {
  try {
    if (!selectedRuleActivities.length) {
      alert("Aucune activité avec règles n’a été trouvée dans ce programme.");
      return;
    }

    const mod = await import("jspdf");
    const jsPDF = mod.jsPDF;

    const logoDataUrl = await new Promise<string>((resolve, reject) => {
      fetch("/logo-ifac.png")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Impossible de charger le logo ifac.");
          }
          return response.blob();
        })
        .then((blob) => {
          const reader = new FileReader();

          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result);
            } else {
              reject(new Error("Conversion du logo en data URL impossible."));
            }
          };

          reader.onerror = () => {
            reject(new Error("Lecture du logo impossible."));
          };

          reader.readAsDataURL(blob);
        })
        .catch(reject);
    });

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 16;
    const marginTop = 18;
    const marginBottom = 16;
    const contentWidth = pageWidth - marginX * 2;

    const ensureSpace = (neededHeight: number) => {
      if (cursorY + neededHeight <= pageHeight - marginBottom) {
        return;
      }

      doc.addPage();
      drawPageHeader();
      cursorY = 44;
    };

    const drawPageHeader = () => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(marginX, marginTop - 8, contentWidth, 20, 4, 4, "F");

      doc.addImage(logoDataUrl, "PNG", marginX + 2, marginTop - 5, 16, 12);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("Règles des jeux sélectionnés", pageWidth / 2, marginTop + 1, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Programme d’animation · sélection sans doublons", pageWidth / 2, marginTop + 6, {
        align: "center",
      });
    };

    let cursorY = 44;

    drawPageHeader();

    selectedRuleActivities.forEach((activity, index) => {
      const safeTitle = sanitizePdfText(activity.title) || "Activité sans titre";
      const safeCategory = sanitizePdfText(formatPrintCategoryShort(activity.category));
      const safeDuration = sanitizePdfText(activity.duration);
      const safeAgeRange = sanitizePdfText(activity.ageRange);
      const safeSummary = sanitizePdfText(activity.summary);
      const safeContent = sanitizePdfText(activity.content);

      const titleLines = doc.splitTextToSize(safeTitle, contentWidth - 8);

      const metaParts = [
        safeCategory,
        safeDuration ? `Durée : ${safeDuration}` : "",
        safeAgeRange ? `Âge : ${safeAgeRange}` : "",
      ].filter(Boolean);

      const metaText = metaParts.join(" · ");
      const metaLines = metaText ? doc.splitTextToSize(metaText, contentWidth - 8) : [];

      const summaryLines = safeSummary
        ? doc.splitTextToSize(safeSummary, contentWidth - 8)
        : [];

      const rulesSource = safeContent || safeSummary || "Règles non renseignées.";
      const ruleLines = doc.splitTextToSize(rulesSource, contentWidth - 8);

      const blockHeight =
        10 +
        titleLines.length * 4.4 +
        (metaLines.length ? metaLines.length * 3.8 + 2 : 0) +
        (summaryLines.length ? summaryLines.length * 3.8 + 3 : 0) +
        ruleLines.length * 4 +
        10;

      ensureSpace(blockHeight);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(marginX, cursorY, contentWidth, blockHeight, 3, 3, "FD");

      let innerY = cursorY + 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(titleLines, marginX + 4, innerY);
      innerY += titleLines.length * 4.4;

      if (metaLines.length) {
        innerY += 2;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(metaLines, marginX + 4, innerY);
        innerY += metaLines.length * 3.8;
      }

      if (summaryLines.length) {
        innerY += 4;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(summaryLines, marginX + 4, innerY);
        innerY += summaryLines.length * 3.8;
      }

      innerY += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text("Règles", marginX + 4, innerY);

      innerY += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(ruleLines, marginX + 4, innerY);

      cursorY += blockHeight + 6;

      if (index < selectedRuleActivities.length - 1) {
        ensureSpace(12);
      }
    });

    doc.save("regles-jeux-ifac.pdf");
  } catch (error) {
    console.error("Erreur export PDF règles :", error);
    alert("Erreur PDF règles : " + String(error));
  }
};

  return (
    <>
      <style>
        {`
          @media print {
            @page {
              size: A4 landscape;
              margin: 8mm;
            }

            html, body {
              background: white !important;
            }

            body * {
              visibility: hidden;
            }

            .print-root,
            .print-root * {
              visibility: visible;
            }

            .print-root {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              max-width: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            .screen-only {
              display: none !important;
            }

            .print-only {
              display: block !important;
            }

            .print-shell {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              border-radius: 0 !important;
              background: white !important;
            }

            .print-week {
              break-inside: avoid;
              page-break-inside: avoid;
              margin: 0 !important;
              padding: 0 !important;
            }

            .print-week-break {
              break-after: page;
              page-break-after: always;
            }

            .print-week-header {
              margin-bottom: 2.5mm !important;
            }

            .print-week-title {
              font-size: 13pt !important;
              font-weight: 700 !important;
              color: black !important;
              margin: 0 !important;
              line-height: 1.1 !important;
            }

            .print-week-subtitle {
              font-size: 7.5pt !important;
              color: black !important;
              margin-top: 1mm !important;
              line-height: 1.1 !important;
            }

            .print-table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: fixed !important;
            }

            .print-table th,
            .print-table td {
              border: 1px solid #d4d4d8 !important;
              vertical-align: top !important;
              padding: 1.4mm !important;
              color: black !important;
            }

            .print-table th {
              background: #f5f5f5 !important;
              font-size: 7pt !important;
              font-weight: 700 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.03em !important;
              line-height: 1 !important;
            }

            .print-row-label {
              width: 13mm !important;
              font-size: 6.5pt !important;
              font-weight: 700 !important;
              text-transform: uppercase !important;
              background: #fafafa !important;
              line-height: 1 !important;
            }

            .print-cell-title {
              font-size: 7.2pt !important;
              font-weight: 700 !important;
              line-height: 1.05 !important;
              margin: 0 0 0.6mm 0 !important;
            }

            .print-cell-meta {
              font-size: 6pt !important;
              line-height: 1.05 !important;
              margin: 0 0 0.4mm 0 !important;
            }

            .print-cell-summary {
              font-size: 6pt !important;
              line-height: 1.08 !important;
              margin: 0 !important;
            }

            .print-empty {
              color: #666 !important;
            }
          }
        `}
      </style>

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="screen-only relative z-[9999] flex flex-wrap gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/tools/program-generator";
            }}
            className="pointer-events-auto rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Modifier le programme
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="pointer-events-auto rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Télécharger le PDF
          </button>

          <button
            type="button"
            onClick={handleDownloadRulesPdf}
            className="pointer-events-auto rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Télécharger les règles des jeux
          </button>

          <button
            type="button"
            onClick={handleCopyProgram}
            className="pointer-events-auto rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Copier
          </button>
        </div>
      </div>

      <div className="print-root mx-auto max-w-7xl p-6">
        <div className="print-shell rounded-[28px] border border-border/60 bg-white p-6 shadow-sm">
          <div className="screen-only print-title">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Programme généré
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-foreground">
                Mon programme d’animation
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                Version finale du planning, lisible à l’écran et optimisée pour l’impression.
              </p>
            </div>
          </div>

          {!generatedDays.length ? (
            <div className="mt-6 rounded-2xl border border-border bg-slate-50 p-6 text-sm text-slate-600">
              Aucun programme reçu.
            </div>
          ) : (
            <>
              <div className="screen-only mt-6 grid gap-4">
                {generatedDays.map((day) => {
                  const morning = getSlotDisplay(day, "matin");
                  const midi = getSlotDisplay(day, "midi");
                  const afternoon = getSlotDisplay(day, "apresMidi");
                  const evening = getSlotDisplay(day, "veillee");

                  const cardClassName =
                    "rounded-2xl border border-border/60 bg-slate-50/70 p-4";

                  const badgeClassName =
                    "inline-flex rounded-full border border-border/60 bg-white px-2 py-1 text-[10px] font-medium text-slate-600";

                  return (
                    <div
                      key={day.label}
                      className="rounded-[24px] border border-border/60 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold text-foreground">
                          {day.label}
                        </h2>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-4">
                        <div className={cardClassName}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                            Matin
                          </p>

                          <p className="mt-3 text-base font-semibold text-foreground">
                            {morning.title}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {morning.category ? (
                              <span className={badgeClassName}>
                                {formatActivityCategoryLabel(morning.category)}
                              </span>
                            ) : null}

                            {morning.duration ? (
                              <span className={badgeClassName}>
                                Durée : {morning.duration}
                              </span>
                            ) : null}

                            {morning.ageRange ? (
                              <span className={badgeClassName}>
                                Âge : {morning.ageRange}
                              </span>
                            ) : null}
                          </div>

                          {morning.summary ? (
                            <p className="mt-3 text-sm leading-relaxed text-slate-600">
                              {morning.summary}
                            </p>
                          ) : null}
                        </div>

                        <div className={cardClassName}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                            Midi
                          </p>

                          <p className="mt-3 text-base font-semibold text-foreground">
                            {midi.title}
                          </p>
                        </div>

                        <div className={cardClassName}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                            Après-midi
                          </p>

                          <p className="mt-3 text-base font-semibold text-foreground">
                            {afternoon.title}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {afternoon.category ? (
                              <span className={badgeClassName}>
                                {formatActivityCategoryLabel(afternoon.category)}
                              </span>
                            ) : null}

                            {afternoon.duration ? (
                              <span className={badgeClassName}>
                                Durée : {afternoon.duration}
                              </span>
                            ) : null}

                            {afternoon.ageRange ? (
                              <span className={badgeClassName}>
                                Âge : {afternoon.ageRange}
                              </span>
                            ) : null}
                          </div>

                          {afternoon.summary ? (
                            <p className="mt-3 text-sm leading-relaxed text-slate-600">
                              {afternoon.summary}
                            </p>
                          ) : null}
                        </div>

                        <div className={cardClassName}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                            Veillée
                          </p>

                          <p className="mt-3 text-base font-semibold text-foreground">
                            {evening.title}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {evening.category ? (
                              <span className={badgeClassName}>
                                {formatActivityCategoryLabel(evening.category)}
                              </span>
                            ) : null}

                            {evening.duration ? (
                              <span className={badgeClassName}>
                                Durée : {evening.duration}
                              </span>
                            ) : null}

                            {evening.ageRange ? (
                              <span className={badgeClassName}>
                                Âge : {evening.ageRange}
                              </span>
                            ) : null}
                          </div>

                          {evening.summary ? (
                            <p className="mt-3 text-sm leading-relaxed text-slate-600">
                              {evening.summary}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div ref={printExportRef} className="print-only hidden bg-white">
                {weeks.map((week) => {
                  const slotRows = [
                    { key: "matin", label: "Matin" },
                    { key: "midi", label: "Midi" },
                    { key: "apresMidi", label: "Après-midi" },
                    { key: "veillee", label: "Veillée" },
                  ];

                  return (
                    <section
                      key={`week-${week.weekIndex}`}
                      className={`print-week ${
                        week.weekIndex < weeks.length ? "print-week-break" : ""
                      }`}
                    >
                      <div className="print-week-header">
                        <h1 className="print-week-title">
                          Programme d’animation — Semaine {week.weekIndex}
                        </h1>
                        <p className="print-week-subtitle">
                          Version impression compacte · 1 semaine par page
                        </p>
                      </div>

                      <table className="print-table">
                        <thead>
                          <tr>
                            <th></th>
                            {week.days.map((day) => (
                              <th key={`head-${day.label}`}>{getDayNameFromLabel(day.label)}</th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {slotRows.map((row) => (
                            <tr key={`row-${row.key}`}>
                              <td className="print-row-label">{row.label}</td>

                              {week.days.map((day) => {
                                const slot = getSlotDisplay(day, row.key);

                                return (
                                  <td key={`cell-${day.label}-${row.key}`}>
                                    <div className="print-cell-title">{slot.title}</div>

                                    {slot.category ? (
                                      <div className="print-cell-meta">
                                        {formatPrintCategoryShort(slot.category)}
                                      </div>
                                    ) : null}

                                    {slot.duration || slot.ageRange ? (
                                      <div className="print-cell-meta">
                                        {slot.duration ? `Durée : ${slot.duration}` : ""}
                                        {slot.duration && slot.ageRange ? " · " : ""}
                                        {slot.ageRange ? `Âge : ${slot.ageRange}` : ""}
                                      </div>
                                    ) : null}

                                    {row.key !== "midi" && slot.summary ? (
                                      <div className="print-cell-summary">{slot.summary}</div>
                                    ) : null}

                                    {!slot.title ? (
                                      <div className="print-empty">—</div>
                                    ) : null}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}