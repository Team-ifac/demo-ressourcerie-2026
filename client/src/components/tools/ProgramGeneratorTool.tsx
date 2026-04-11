import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const DAY_NAMES = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const DAYS_PER_WEEK_OPTIONS = [
  { label: "Lundi → Vendredi", value: 5 },
  { label: "Lundi → Samedi", value: 6 },
  { label: "Lundi → Dimanche", value: 7 },
];

const DURATION_OPTIONS = [
  { label: "1 semaine", value: 1 },
  { label: "2 semaines", value: 2 },
  { label: "3 semaines", value: 3 },
];

const AGE_OPTIONS = ["Maternel", "Élémentaire", "Ados"];

const STAFF_OPTIONS = [
  "1 animateur·trice",
  "2 animateur·trices",
  "3 animateur·trices et plus",
];

const EVENING_OPTIONS = [
  { label: "Avec veillée", value: "with" },
  { label: "Sans veillée", value: "without" },
];
const ACTIVITY_CATEGORY_OPTIONS = [
  {
    label: "Activités calmes",
    value: "activitesCalmes",
    keywords: ["activitescalmes", "activités calmes", "calme"],
  },
  {
    label: "Activités réveil",
    value: "activitesReveil",
    keywords: ["activitesreveil", "activités réveil", "reveil", "réveil"],
  },
  {
    label: "Activités manuelles",
    value: "activitesManuelles",
    keywords: ["activitesmanuelles", "activités manuelles", "manuel", "manuelle"],
  },
  {
    label: "Activités artistiques",
    value: "activitesArtistiques",
    keywords: ["activitesartistiques", "activités artistiques", "artistique"],
  },
  {
    label: "Activités d’expression",
    value: "activitesExpression",
    keywords: ["activitesexpression", "activités d’expression", "expression"],
  },
  {
    label: "Petits jeux collectifs",
    value: "petitsJeuxCollectifs",
    keywords: ["petitsjeuxcollectifs", "petits jeux collectifs", "jeu collectif"],
  },
  {
    label: "Temps libre encadré",
    value: "tempsLibreEncadre",
    keywords: ["tempslibreencadre", "temps libre encadré", "temps libre encadre"],
  },
  {
    label: "Jeux calmes",
    value: "jeuxCalmes",
    keywords: ["jeuxcalmes", "jeux calmes", "jeu calme"],
  },
  {
    label: "Jeux de cour",
    value: "jeuxDeCour",
    keywords: ["jeuxdecour", "jeux de cour", "cour"],
  },
  {
    label: "Temps calme",
    value: "tempsCalme",
    keywords: ["tempscalme", "temps calme"],
  },
  {
    label: "Petits ateliers autonomes",
    value: "petitsAteliersAutonomes",
    keywords: ["petitsateliersautonomes", "petits ateliers autonomes", "autonome"],
  },
  {
    label: "Activités sportives",
    value: "activitesSportives",
    keywords: ["activitessportives", "activités sportives", "sportive", "sport"],
  },
  {
    label: "Jeux extérieurs",
    value: "jeuxExterieurs",
    keywords: ["jeuxexterieurs", "jeux extérieurs", "exterieur", "extérieur"],
  },
  {
    label: "Grands jeux",
    value: "grandsJeux",
    keywords: ["grandsjeux", "grands jeux", "grand jeu"],
  },
  {
    label: "Activités culturelles",
    value: "activitesCulturelles",
    keywords: ["activitesculturelles", "activités culturelles", "culturelle"],
  },
  {
    label: "Sorties",
    value: "sorties",
    keywords: ["sorties", "sortie"],
  },
  {
    label: "Projets",
    value: "projets",
    keywords: ["projets", "projet"],
  },
  {
    label: "Jeux collectifs",
    value: "jeuxCollectifs",
    keywords: ["jeuxcollectifs", "jeux collectifs"],
  },
  {
    label: "Jeux d’ambiance",
    value: "jeuxAmbiance",
    keywords: ["jeuxambiance", "jeux d’ambiance", "ambiance"],
  },
  {
    label: "Jeux musicaux",
    value: "jeuxMusicaux",
    keywords: ["jeuxmusicaux", "jeux musicaux", "musical"],
  },
  {
    label: "Spectacles / expression",
    value: "spectaclesExpression",
    keywords: ["spectaclesexpression", "spectacles expression", "spectacle", "expression"],
  },
  {
    label: "Veillées thématiques",
    value: "veilleesThematiques",
    keywords: ["veilleesthematiques", "veillées thématiques", "veillee", "veillée"],
  },
];
type GeneratedActivity = {
  id: number;
  title: string;
  summary?: string | null;
  content?: string | null;
  type?: string | null;
  ageRange?: string | null;
  duration?: string | null;
  category?: string | null;
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

type InlineSelectorState = {
  slotSelectionKey: string;
  category: string;
};

function getCategoryLabel(categoryValue: string) {
  return (
    ACTIVITY_CATEGORY_OPTIONS.find((option) => option.value === categoryValue)?.label ??
    categoryValue
  );
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

  const slotLabel = slotLabelMap[slotKey ?? ""] ?? slotKey ?? "";
  const categoryLabel = categoryKey ? getCategoryLabel(categoryKey) : raw;

  if (slotLabel && categoryLabel) {
    return `${slotLabel} · ${categoryLabel}`;
  }

  return categoryLabel || raw;
}

function getInlineActivitiesByCategory(
  activities: GeneratedActivity[],
  categoryValue: string
) {
  const categoryOption = ACTIVITY_CATEGORY_OPTIONS.find(
    (option) => option.value === categoryValue
  );

  if (!categoryOption) return activities.slice(0, 50);

  const normalizedCategoryValue = normalizeText(categoryOption.value);
  const normalizedKeywords = categoryOption.keywords.map((keyword) =>
    normalizeText(keyword)
  );

  const strictCategoryMatches = activities.filter((activity) => {
    const normalizedActivityCategory = normalizeText(
  activity.category?.split("/")[1]
);

    return (
      normalizedActivityCategory === normalizedCategoryValue ||
      normalizedActivityCategory.includes(normalizedCategoryValue) ||
      normalizedKeywords.some(
        (keyword) =>
          normalizedActivityCategory === keyword ||
          normalizedActivityCategory.includes(keyword) ||
          keyword.includes(normalizedActivityCategory)
      )
    );
  });

  if (strictCategoryMatches.length > 0) {
    return strictCategoryMatches;
  }

  const strictKeywordMatches = activities.filter((activity) => {
    const haystack = normalizeText(
      `${activity.title} ${activity.type} ${activity.category}`
    );

    return normalizedKeywords.some((keyword) => haystack.includes(keyword));
  });

  if (strictKeywordMatches.length > 0) {
    return strictKeywordMatches;
  }

  const extendedKeywordMatches = activities.filter((activity) => {
    const haystack = normalizeText(
      `${activity.title} ${activity.summary} ${activity.type} ${activity.category} ${activity.content}`
    );

    return normalizedKeywords.some((keyword) => haystack.includes(keyword));
  });

  if (extendedKeywordMatches.length > 0) {
    return extendedKeywordMatches;
  }

  return activities.slice(0, 50);
}
function buildSlotSelectionKey(dayLabel: string, slotKey: string) {
  return `${dayLabel}__${slotKey}`;
}

function getSlotRefreshKey(dayLabel: string, slotKey: string) {
  return `${dayLabel}__${slotKey}`;
}

function getWrappedActivitiesForSlot(
  activities: GeneratedActivity[],
  slotSeed: number,
  pageIndex: number,
  excludedIds: number[] = [],
  pageSize = 3
) {
  if (!activities.length) return [];

  const result: GeneratedActivity[] = [];
  const total = activities.length;
  const start = (slotSeed * pageSize + pageIndex * pageSize) % total;
  const excludedSet = new Set(excludedIds);
  const addedIds = new Set<number>();

  for (let i = 0; i < total && result.length < pageSize; i += 1) {
    const activity = activities[(start + i) % total];
    if (!activity) continue;
    if (excludedSet.has(activity.id)) continue;
    if (addedIds.has(activity.id)) continue;

    result.push(activity);
    addedIds.add(activity.id);
  }

  if (result.length < pageSize) {
    for (let i = 0; i < total && result.length < pageSize; i += 1) {
      const activity = activities[(start + i) % total];
      if (!activity) continue;
      if (addedIds.has(activity.id)) continue;

      result.push(activity);
      addedIds.add(activity.id);
    }
  }

  return result;
}
function normalizeText(value?: string | null) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function prioritizeActivitiesByCategories(
  activities: GeneratedActivity[],
  selectedCategories: string[]
) {
  if (!selectedCategories.length) return activities;

  const selectedCategoryDefinitions = ACTIVITY_CATEGORY_OPTIONS.filter((option) =>
    selectedCategories.includes(option.value)
  );

  const strictFiltered = activities.filter((activity) => {
    const normalizedCategory = normalizeText(activity.category);
    const haystack = normalizeText(
      `${activity.title} ${activity.summary} ${activity.type} ${activity.category} ${activity.content}`
    );

    return selectedCategoryDefinitions.some((categoryOption) => {
      const matchesCategory =
        normalizedCategory === normalizeText(categoryOption.value);

      const matchesKeywords = categoryOption.keywords.some((keyword) =>
        haystack.includes(normalizeText(keyword))
      );

      return matchesCategory || matchesKeywords;
    });
  });

  const baseList = strictFiltered.length > 0 ? strictFiltered : activities;

  const scoredActivities = baseList.map((activity) => {
    const normalizedCategory = normalizeText(activity.category);
    const haystack = normalizeText(
      `${activity.title} ${activity.summary} ${activity.type} ${activity.category} ${activity.content}`
    );

    const score = selectedCategoryDefinitions.reduce((total, categoryOption) => {
      let nextTotal = total;

      if (normalizedCategory === normalizeText(categoryOption.value)) {
        nextTotal += 8;
      }

      const keywordMatches = categoryOption.keywords.reduce((keywordTotal, keyword) => {
        return keywordTotal + (haystack.includes(normalizeText(keyword)) ? 2 : 0);
      }, 0);

      return nextTotal + keywordMatches;
    }, 0);

    return {
      activity,
      score,
    };
  });

  const matchedActivities = scoredActivities
    .sort((a, b) => b.score - a.score)
    .map((item) => item.activity);

  return matchedActivities;
}

function pushRecentActivityIds(
  recentIds: number[],
  activities: GeneratedActivity[],
  maxRecentIds = 20
) {
  const nextIds = [...recentIds, ...activities.map((activity) => activity.id)];
  return nextIds.slice(-maxRecentIds);
}
export default function ProgramGeneratorTool() {
  const [durationWeeks, setDurationWeeks] = useState(1);
  const [ageGroup, setAgeGroup] = useState("Élémentaire");
  const [staffCount, setStaffCount] = useState("3 animateur·trices et plus");
  const [includesEvening, setIncludesEvening] = useState(true);
  const [generated, setGenerated] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<
    Record<string, { id: number; isManual?: boolean }>
  >({});
  const [slotRefreshIndexes, setSlotRefreshIndexes] = useState<
    Record<string, number>
  >({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState(7);
  const [manualSelectionSlotKey, setManualSelectionSlotKey] = useState<string | null>(null);
  const [inlineSelector, setInlineSelector] = useState<InlineSelectorState | null>(null);
  const [manualSearchTerm, setManualSearchTerm] = useState("");
  const [manualDisplayCount, setManualDisplayCount] = useState(24);
  const manualSectionRef = useRef<HTMLDivElement | null>(null);
  const [, setLocation] = useLocation();
  const totalDays = durationWeeks * daysPerWeek;

  const activitiesPerPage = 3;
  const refreshPagesPerDay = 12;
  const queryLimit = 200;

  const morningActivitiesQuery = trpc.resources.getGeneratedActivities.useQuery(
    {
      limit: queryLimit,
    },
    {
      enabled: generated,
      refetchOnWindowFocus: false,
    }
  );

  const afternoonActivitiesQuery = trpc.resources.getGeneratedActivities.useQuery(
    {
      limit: queryLimit,
    },
    {
      enabled: generated,
      refetchOnWindowFocus: false,
    }
  );

  const eveningActivitiesQuery = trpc.resources.getGeneratedActivities.useQuery(
    {
      limit: queryLimit,
    },
    {
      enabled: generated && includesEvening,
      refetchOnWindowFocus: false,
    }
  );

  const isLoading =
    generated &&
    (
      morningActivitiesQuery.isLoading ||
      afternoonActivitiesQuery.isLoading ||
      (includesEvening && eveningActivitiesQuery.isLoading)
    );

  const hasError =
    generated &&
    (
      morningActivitiesQuery.isError ||
      afternoonActivitiesQuery.isError ||
      (includesEvening && eveningActivitiesQuery.isError)
    );

  const generatedDays = useMemo<DayPlan[]>(() => {
    if (!generated) return [];

    const applySlotBoost = (activities: GeneratedActivity[], slotKey: string) => {
      const isPreferredForSlot = (activity: GeneratedActivity) => {
        const category = normalizeText(activity.category);

        if (slotKey === "matin") {
          return (
            category.includes("reveil") ||
            category.includes("petitsjeux") ||
            category.includes("activitescalmes") ||
            category.includes("activitesmanuelles") ||
            category.includes("petitsateliersautonomes")
          );
        }

        if (slotKey === "apresMidi") {
          return (
            category.includes("grandsjeux") ||
            category.includes("sportives") ||
            category.includes("exterieurs") ||
            category.includes("projets") ||
            category.includes("sorties") ||
            category.includes("culturelles")
          );
        }

        if (slotKey === "veillee") {
          return (
            category.includes("ambiance") ||
            category.includes("musicaux") ||
            category.includes("spectacles") ||
            category.includes("expression") ||
            category.includes("jeuxcalmes") ||
            category.includes("veilleesthematiques") ||
            category.includes("jeuxcollectifs")
          );
        }

        return false;
      };

      const preferredActivities = activities.filter(isPreferredForSlot);
      const baseActivities =
        preferredActivities.length >= 6 ? preferredActivities : activities;

      return [...baseActivities].sort((a, b) => {
        const scoreActivity = (activity: GeneratedActivity) => {
          const category = normalizeText(activity.category);
          let score = 0;

          if (slotKey === "matin") {
            if (category.includes("reveil")) score += 6;
            if (category.includes("petitsjeux")) score += 4;
            if (category.includes("activitescalmes")) score += 3;
            if (category.includes("activitesmanuelles")) score += 2;
            if (category.includes("petitsateliersautonomes")) score += 2;

            if (category.includes("veillee")) score -= 6;
            if (category.includes("musicaux")) score -= 4;
            if (category.includes("ambiance")) score -= 4;
            if (category.includes("spectacles")) score -= 4;
            if (category.includes("sorties")) score -= 3;
            if (category.includes("grandsjeux")) score -= 2;
          }

          if (slotKey === "apresMidi") {
            if (category.includes("grandsjeux")) score += 6;
            if (category.includes("sportives")) score += 5;
            if (category.includes("exterieurs")) score += 5;
            if (category.includes("projets")) score += 4;
            if (category.includes("sorties")) score += 4;
            if (category.includes("culturelles")) score += 3;

            if (category.includes("veillee")) score -= 7;
            if (category.includes("musicaux")) score -= 4;
            if (category.includes("ambiance")) score -= 4;
            if (category.includes("spectacles")) score -= 4;
            if (category.includes("petitsjeux")) score -= 3;
            if (category.includes("reveil")) score -= 3;
          }

          if (slotKey === "veillee") {
            if (category.includes("ambiance")) score += 6;
            if (category.includes("musicaux")) score += 6;
            if (category.includes("spectacles")) score += 5;
            if (category.includes("expression")) score += 4;
            if (category.includes("jeuxcalmes")) score += 3;
            if (category.includes("veilleesthematiques")) score += 5;
            if (category.includes("jeuxcollectifs")) score += 3;

            if (category.includes("sportives")) score -= 5;
            if (category.includes("exterieurs")) score -= 4;
            if (category.includes("grandsjeux")) score -= 4;
            if (category.includes("sorties")) score -= 5;
            if (category.includes("projets")) score -= 3;
            if (category.includes("reveil")) score -= 4;
          }

          return score;
        };

        return scoreActivity(b) - scoreActivity(a);
      });
    };

const morningActivities = applySlotBoost(
  prioritizeActivitiesByCategories(
    morningActivitiesQuery.data ?? [],
    selectedCategories
  ),
  "matin"
);

const afternoonActivities = applySlotBoost(
  prioritizeActivitiesByCategories(
    afternoonActivitiesQuery.data ?? [],
    selectedCategories
  ),
  "apresMidi"
);

const eveningActivities = applySlotBoost(
  prioritizeActivitiesByCategories(
    eveningActivitiesQuery.data ?? [],
    selectedCategories
  ),
  "veillee"
);

    return Array.from({ length: totalDays }, (_, index) => {
      const dayLabel = `Jour ${index + 1} — ${DAY_NAMES[index % daysPerWeek]}`;

      const morningRefreshIndex =
        slotRefreshIndexes[getSlotRefreshKey(dayLabel, "matin")] ?? 0;
      const afternoonRefreshIndex =
        slotRefreshIndexes[getSlotRefreshKey(dayLabel, "apresMidi")] ?? 0;
      const eveningRefreshIndex =
        slotRefreshIndexes[getSlotRefreshKey(dayLabel, "veillee")] ?? 0;

      const morningActivitiesSet = getWrappedActivitiesForSlot(
        morningActivities,
        index,
        morningRefreshIndex,
        [],
        activitiesPerPage
      );

      const afternoonActivitiesSet = getWrappedActivitiesForSlot(
        afternoonActivities,
        index + totalDays,
        afternoonRefreshIndex,
        [],
        activitiesPerPage
      );

      const eveningActivitiesSet = getWrappedActivitiesForSlot(
        eveningActivities,
        index + totalDays * 2,
        eveningRefreshIndex,
        [],
        activitiesPerPage
      );

      return {
        label: dayLabel,
        slots: [
          {
            key: "matin",
            label: "Matin",
            activities: morningActivitiesSet,
          },
          {
            key: "midi",
            label: "Midi",
            activity: "Repas / temps libre",
          },
          {
            key: "apresMidi",
            label: "Après-midi",
            activities: afternoonActivitiesSet,
          },
          ...(includesEvening
            ? [
                {
                  key: "veillee",
                  label: "Veillée",
                  activities: eveningActivitiesSet,
                },
              ]
            : []),
        ],
      };
    });
  }, [
    generated,
    totalDays,
    daysPerWeek,
    includesEvening,
    slotRefreshIndexes,
    selectedCategories,
    morningActivitiesQuery.data,
    afternoonActivitiesQuery.data,
    eveningActivitiesQuery.data,
  ]);

  useEffect(() => {
    if (!generatedDays.length) {
      setSelectedActivities({});
      setSlotRefreshIndexes({});
      return;
    }

    setSelectedActivities((current) => {
      const nextSelections = { ...current };

      const allActivities = [
        ...(morningActivitiesQuery.data ?? []),
        ...(afternoonActivitiesQuery.data ?? []),
        ...(eveningActivitiesQuery.data ?? []),
      ];

      generatedDays.forEach((day) => {
        day.slots.forEach((slot) => {
          if (!slot.activities || slot.activities.length === 0) return;

          const selectionKey = buildSlotSelectionKey(day.label, slot.key);
          const currentSelection = nextSelections[selectionKey];
          const currentSelectionId = currentSelection?.id;

          const stillExistsInVisibleSlot = slot.activities.some(
            (activity) => activity.id === currentSelectionId
          );

          const stillExistsGlobally = allActivities.some(
            (activity) => activity.id === currentSelectionId
          );

          if (currentSelection?.isManual && stillExistsGlobally) {
            return;
          }

          if (!stillExistsInVisibleSlot) {
            nextSelections[selectionKey] = {
              id: slot.activities[0].id,
              isManual: false,
            };
          }
        });
      });

      return nextSelections;
    });
  }, [
    generatedDays,
    morningActivitiesQuery.data,
    afternoonActivitiesQuery.data,
    eveningActivitiesQuery.data,
  ]);

  const handleGenerate = () => {
    setSelectedActivities({});
    setSlotRefreshIndexes({});
    setGenerated(true);
  };

  const handleSelectActivity = (
    dayLabel: string,
    slotKey: string,
    activityId: number,
    isManual = false
  ) => {
    const selectionKey = buildSlotSelectionKey(dayLabel, slotKey);

    setSelectedActivities((current) => ({
      ...current,
      [selectionKey]: { id: activityId, isManual },
    }));
  };

  const handleRefreshSlotIdeas = (dayLabel: string, slotKey: string) => {
    const refreshKey = getSlotRefreshKey(dayLabel, slotKey);

    setSlotRefreshIndexes((current) => {
      const currentIndex = current[refreshKey] ?? 0;
      const nextIndex = (currentIndex + 1) % refreshPagesPerDay;

      return {
        ...current,
        [refreshKey]: nextIndex,
      };
    });
  };

  const getManualActivitiesForSlot = (dayLabel: string, slotKey: string) => {
    let sourceActivities: GeneratedActivity[] = [];

    if (slotKey === "matin") {
      sourceActivities = prioritizeActivitiesByCategories(
        morningActivitiesQuery.data ?? [],
        selectedCategories
      );
    } else if (slotKey === "apresMidi") {
      sourceActivities = prioritizeActivitiesByCategories(
        afternoonActivitiesQuery.data ?? [],
        selectedCategories
      );
    } else if (slotKey === "veillee") {
      sourceActivities = prioritizeActivitiesByCategories(
        eveningActivitiesQuery.data ?? [],
        selectedCategories
      );
    }

    const slotRules: Record<string, string[]> = {
  matin: [
    "reveil",
    "accueil",
    "mise en route",
    "energie",
    "parcours",
    "activites reveil",
    "petits jeux",
    "atelier",
    "manuel",
    "collectif",
  ],
  apresMidi: [
    "grand jeu",
    "jeu",
    "defi",
    "challenge",
    "mission",
    "activites sportives",
    "jeux exterieurs",
    "projet",
    "sortie",
    "atelier",
    "nature",
  ],
  veillee: [
    "veillee",
    "soir",
    "nuit",
    "conte",
    "chant",
    "jeux ambiance",
    "jeux musicaux",
    "spectacle",
    "expression",
    "calme",
    "observation",
  ],
};
    const selectedIdsForDay = generatedDays
      .find((day) => day.label === dayLabel)
      ?.slots.filter((slot) => slot.key !== "midi" && slot.key !== slotKey)
      .map((slot) => {
        const selectionKey = buildSlotSelectionKey(dayLabel, slot.key);
        return selectedActivities[selectionKey]?.id;
      })
      .filter((id): id is number => typeof id === "number") ?? [];

    const currentSelectionKey = buildSlotSelectionKey(dayLabel, slotKey);
    const currentSelectedId = selectedActivities[currentSelectionKey]?.id;

    const uniqueActivities = sourceActivities.filter(
      (activity, index, array) =>
        array.findIndex((item) => item.id === activity.id) === index
    );

    const scoredActivities = uniqueActivities
      .filter(
        (activity) =>
          !selectedIdsForDay.includes(activity.id) ||
          activity.id === currentSelectedId
      )
      .map((activity) => {
        const haystack = normalizeText(
          `${activity.title} ${activity.summary} ${activity.type} ${activity.category} ${activity.content}`
        );

        let score = (slotRules[slotKey] ?? []).reduce((total, rule) => {
          const keyword = normalizeText(rule);
          return total + (haystack.includes(keyword) ? 1 : 0);
        }, 0);

        const category = normalizeText(activity.category);

        if (slotKey === "matin") {
          if (category.includes("reveil")) score += 5;
          if (category.includes("petitsjeux")) score += 3;
          if (category.includes("atelier")) score += 2;
          if (category.includes("activitescalmes")) score += 1;
        }

        if (slotKey === "apresMidi") {
          if (category.includes("grandsjeux")) score += 5;
          if (category.includes("sportives")) score += 4;
          if (category.includes("exterieurs")) score += 4;
          if (category.includes("projets")) score += 3;
          if (category.includes("sorties")) score += 3;
          if (category.includes("culturelles")) score += 2;
        }

        if (slotKey === "veillee") {
          if (category.includes("ambiance")) score += 5;
          if (category.includes("musicaux")) score += 5;
          if (category.includes("spectacles")) score += 4;
          if (category.includes("expression")) score += 3;
          if (category.includes("jeuxcalmes")) score += 2;
          if (category.includes("veilleesthematiques")) score += 4;
        }

        return {
          activity,
          score,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.activity.title.localeCompare(b.activity.title, "fr");
      });

    return scoredActivities.slice(0, 500).map((item) => item.activity);
  };

  const toggleManualSelection = (dayLabel: string, slotKey: string) => {
    const nextKey = buildSlotSelectionKey(dayLabel, slotKey);

    setInlineSelector((current) => {
      if (current?.slotSelectionKey === nextKey) {
        return null;
      }

      return {
        slotSelectionKey: nextKey,
        category: "",
      };
    });

    setManualSelectionSlotKey(null);
    setManualSearchTerm("");
    setManualDisplayCount(24);
  };

  const findActivityById = (activityId?: number) => {
    if (!activityId) return undefined;

    const allActivities = [
      ...(morningActivitiesQuery.data ?? []),
      ...(afternoonActivitiesQuery.data ?? []),
      ...(eveningActivitiesQuery.data ?? []),
    ];

    return allActivities.find((activity) => activity.id === activityId);
  };

  return (
    <div className="rounded-[28px] border border-border/50 bg-white/80 p-6 shadow-sm">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Générateur de programme
          </p>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Prépare un planning d’animation structuré selon la durée, l’âge du
            groupe, les créneaux de la journée et le nombre d’animateurs.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Durée
            </label>

            <select
              className="h-11 rounded-2xl border border-border/50 bg-white px-3 text-sm shadow-sm"
              value={durationWeeks}
              onChange={(e) => {
                setDurationWeeks(Number(e.target.value));
                setGenerated(false);
              }}
            >
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Tranche d’âge
            </label>

            <select
              className="h-11 rounded-2xl border border-border/50 bg-white px-3 text-sm shadow-sm"
              value={ageGroup}
              onChange={(e) => {
                setAgeGroup(e.target.value);
                setGenerated(false);
              }}
            >
              {AGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Nombre d’animateur·trices
            </label>

            <select
              className="h-11 rounded-2xl border border-border/50 bg-white px-3 text-sm shadow-sm"
              value={staffCount}
              onChange={(e) => {
                setStaffCount(e.target.value);
                setGenerated(false);
              }}
            >
              {STAFF_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Semaine type
            </label>

            <select
              className="h-11 rounded-2xl border border-border/50 bg-white px-3 text-sm shadow-sm"
              value={daysPerWeek}
              onChange={(e) => {
                setDaysPerWeek(Number(e.target.value));
                setGenerated(false);
              }}
            >
              {DAYS_PER_WEEK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Veillée
            </label>

            <select
              className="h-11 rounded-2xl border border-border/50 bg-white px-3 text-sm shadow-sm"
              value={includesEvening ? "with" : "without"}
              onChange={(e) => {
                setIncludesEvening(e.target.value === "with");
                setGenerated(false);
              }}
            >
              {EVENING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bloc masqué volontairement (créneaux + catégories) */}
        </div>

        <div className="rounded-2xl border border-dashed border-border/60 bg-slate-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Programme
          </p>

          {!generated ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Clique sur “Générer le programme” pour construire une première
              trame à partir de la base d’activités.
            </p>
          ) : isLoading ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Génération en cours...
            </p>
          ) : hasError ? (
            <p className="mt-2 text-sm leading-relaxed text-red-600">
              Une erreur est survenue pendant la génération du programme.
            </p>
          ) : null}

          {/* ===== PLANNING VALIDÉ ===== */}
          {generated && !isLoading && !hasError ? (
            <div className="rounded-2xl border border-border/60 bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Mon programme
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGenerated(false)}
                    className="rounded-lg border border-border px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                  >
                    Recommencer
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem(
                        "programResult",
                        JSON.stringify({
                          generatedDays,
                          selectedActivities,
                        })
                      );
                      setLocation("/programme/resultat");
                    }}
                    className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:opacity-90"
                  >
                    Continuer
                  </button>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="border border-border/60 bg-slate-100 px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 rounded-tl-xl">
                        Jour
                      </th>
                      <th className="border border-border/60 bg-slate-100 px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                        Matin
                      </th>
                      <th className="border border-border/60 bg-slate-100 px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                        Midi
                      </th>
                      <th
                        className={`border border-border/60 bg-slate-100 px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 ${
                          includesEvening ? "" : "rounded-tr-xl"
                        }`}
                      >
                        Après-midi
                      </th>
                      {includesEvening ? (
                        <th className="rounded-tr-xl border border-border/60 bg-slate-100 px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                          Veillée
                        </th>
                      ) : null}
                    </tr>
                  </thead>

                  <tbody>
                    {generatedDays.map((day) => {
                      const morningSelectionKey = buildSlotSelectionKey(
                        day.label,
                        "matin"
                      );
                      const afternoonSelectionKey = buildSlotSelectionKey(
                        day.label,
                        "apresMidi"
                      );
                      const eveningSelectionKey = buildSlotSelectionKey(
                        day.label,
                        "veillee"
                      );

                      const morningSelectedId =
                        selectedActivities[morningSelectionKey]?.id;
                      const afternoonSelectedId =
                        selectedActivities[afternoonSelectionKey]?.id;
                      const eveningSelectedId =
                        selectedActivities[eveningSelectionKey]?.id;

                      const morningSlot = day.slots.find((slot) => slot.key === "matin");
                      const midiSlot = day.slots.find((slot) => slot.key === "midi");
                      const afternoonSlot = day.slots.find(
                        (slot) => slot.key === "apresMidi"
                      );
                      const eveningSlot = day.slots.find((slot) => slot.key === "veillee");

                      const morningSelectedActivity =
                        morningSlot?.activities?.find((a) => a.id === morningSelectedId) ??
                        findActivityById(morningSelectedId);

                      const afternoonSelectedActivity =
                        afternoonSlot?.activities?.find((a) => a.id === afternoonSelectedId) ??
                        findActivityById(afternoonSelectedId);

                      const eveningSelectedActivity =
                        eveningSlot?.activities?.find((a) => a.id === eveningSelectedId) ??
                        findActivityById(eveningSelectedId);

                      return (
                        <tr key={`final-${day.label}`}>
                          <td className="border border-border/50 bg-white px-5 py-4 align-top text-sm font-semibold text-foreground">
                            {day.label}
                          </td>

                          <td className="border border-border/50 bg-white px-5 py-4 align-top text-sm">
                            <div className="space-y-3 rounded-xl border border-border/60 bg-white p-4">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                                  Matin
                                </p>

                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleRefreshSlotIdeas(day.label, "matin")}
                                    className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-slate-600 border border-border/60 hover:bg-slate-100"
                                  >
                                    Autres idées
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => toggleManualSelection(day.label, "matin")}
                                    className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-slate-600 border border-border/60 hover:bg-slate-100"
                                  >
                                    Choisir
                                  </button>
                                </div>
                              </div>

                              {morningSelectedActivity ? (
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold text-foreground">
                                    {morningSelectedActivity.title}
                                  </p>

                                  <div className="flex flex-wrap gap-2">
                                    {morningSelectedActivity.category ? (
                                      <span className="rounded-full border border-border/60 bg-white px-2 py-1 text-[10px] font-medium text-slate-600">
                                        {formatActivityCategoryLabel(morningSelectedActivity.category)}
                                      </span>
                                    ) : null}

                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400">Aucune activité</span>
                              )}

                              {inlineSelector?.slotSelectionKey === morningSelectionKey ? (
                                <div className="mt-3 space-y-2 rounded-lg border border-dashed border-border/60 bg-white p-3">
                                  <select
                                    className="h-10 w-full rounded-xl border border-border/50 bg-white px-3 text-sm shadow-sm"
                                    value={inlineSelector.category}
                                    onChange={(e) =>
                                      setInlineSelector((current) =>
                                        current?.slotSelectionKey === morningSelectionKey
                                          ? {
                                              ...current,
                                              category: e.target.value,
                                            }
                                          : current
                                      )
                                    }
                                  >
                                    <option value="">Choisir une catégorie</option>
                                    {ACTIVITY_CATEGORY_OPTIONS.map((categoryOption) => (
                                      <option
                                        key={categoryOption.value}
                                        value={categoryOption.value}
                                      >
                                        {categoryOption.label}
                                      </option>
                                    ))}
                                  </select>

                                  {inlineSelector.category ? (
                                    <select
                                      className="h-10 w-full rounded-xl border border-border/50 bg-white px-3 text-sm shadow-sm"
                                      defaultValue=""
                                      onChange={(e) => {
                                        const selectedId = Number(e.target.value);
                                        if (!selectedId) return;

                                        handleSelectActivity(
                                          day.label,
                                          "matin",
                                          selectedId,
                                          true
                                        );

                                        setInlineSelector(null);
                                      }}
                                    >
                                      <option value="">Choisir une activité</option>
                                      {getInlineActivitiesByCategory(
                                        getManualActivitiesForSlot(day.label, "matin"),
                                        inlineSelector.category
                                      ).map((activity) => (
                                        <option key={activity.id} value={activity.id}>
                                          {activity.title}
                                        </option>
                                      ))}
                                    </select>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </td>

                          <td className="border border-border/50 bg-white px-5 py-4 align-top text-sm text-slate-700">
                            {midiSlot?.activity ?? "Repas / temps libre"}
                          </td>

                          <td className="border border-border/50 bg-white px-5 py-4 align-top text-sm">
                            <div className="space-y-3 rounded-xl border border-border/60 bg-white p-4">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                                  Après-midi
                                </p>

                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleRefreshSlotIdeas(day.label, "apresMidi")}
                                    className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-slate-600 border border-border/60 hover:bg-slate-100"
                                  >
                                    Autres idées
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => toggleManualSelection(day.label, "apresMidi")}
                                    className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-slate-600 border border-border/60 hover:bg-slate-100"
                                  >
                                    Choisir
                                  </button>
                                </div>
                              </div>

                              {afternoonSelectedActivity ? (
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold text-foreground">
                                    {afternoonSelectedActivity.title}
                                  </p>

                                  <div className="flex flex-wrap gap-2">
                                    {afternoonSelectedActivity.category ? (
                                      <span className="rounded-full border border-border/60 bg-white px-2 py-1 text-[10px] font-medium text-slate-600">
                                        {formatActivityCategoryLabel(afternoonSelectedActivity.category)}
                                      </span>
                                    ) : null}
                               
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400">Aucune activité</span>
                              )}

                              {inlineSelector?.slotSelectionKey === afternoonSelectionKey ? (
                                <div className="mt-3 space-y-2 rounded-lg border border-dashed border-border/60 bg-white p-3">
                                  <select
                                    className="h-10 w-full rounded-xl border border-border/50 bg-white px-3 text-sm shadow-sm"
                                    value={inlineSelector.category}
                                    onChange={(e) =>
                                      setInlineSelector((current) =>
                                        current?.slotSelectionKey === afternoonSelectionKey
                                          ? {
                                              ...current,
                                              category: e.target.value,
                                            }
                                          : current
                                      )
                                    }
                                  >
                                    <option value="">Choisir une catégorie</option>
                                    {ACTIVITY_CATEGORY_OPTIONS.map((categoryOption) => (
                                      <option
                                        key={categoryOption.value}
                                        value={categoryOption.value}
                                      >
                                        {categoryOption.label}
                                      </option>
                                    ))}
                                  </select>

                                  {inlineSelector.category ? (
                                    <select
                                      className="h-10 w-full rounded-xl border border-border/50 bg-white px-3 text-sm shadow-sm"
                                      defaultValue=""
                                      onChange={(e) => {
                                        const selectedId = Number(e.target.value);
                                        if (!selectedId) return;

                                        handleSelectActivity(
                                          day.label,
                                          "apresMidi",
                                          selectedId,
                                          true
                                        );

                                        setInlineSelector(null);
                                      }}
                                    >
                                      <option value="">Choisir une activité</option>
                                      {getInlineActivitiesByCategory(
                                        getManualActivitiesForSlot(day.label, "apresMidi"),
                                        inlineSelector.category
                                      ).map((activity) => (
                                        <option key={activity.id} value={activity.id}>
                                          {activity.title}
                                        </option>
                                      ))}
                                    </select>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </td>

                          {includesEvening ? (
                            <td className="border border-border/50 bg-white px-5 py-4 align-top text-sm">
                              <div className="space-y-3 rounded-xl border border-border/60 bg-white p-4">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                                    Veillée
                                  </p>

                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleRefreshSlotIdeas(day.label, "veillee")}
                                      className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-slate-600 border border-border/60 hover:bg-slate-100"
                                    >
                                      Autres idées
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => toggleManualSelection(day.label, "veillee")}
                                      className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-slate-600 border border-border/60 hover:bg-slate-100"
                                    >
                                      Choisir
                                    </button>
                                  </div>
                                </div>

                                {eveningSelectedActivity ? (
                                  <div className="space-y-2">
                                    <p className="text-sm font-semibold text-foreground">
                                      {eveningSelectedActivity.title}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                      {eveningSelectedActivity.category ? (
                                        <span className="rounded-full border border-border/60 bg-white px-2 py-1 text-[10px] font-medium text-slate-600">
                                          {formatActivityCategoryLabel(eveningSelectedActivity.category)}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">Aucune activité</span>
                                )}

                                {inlineSelector?.slotSelectionKey === eveningSelectionKey ? (
                                  <div className="mt-3 space-y-2 rounded-lg border border-dashed border-border/60 bg-white p-3">
                                    <select
                                      className="h-10 w-full rounded-xl border border-border/50 bg-white px-3 text-sm shadow-sm"
                                      value={inlineSelector.category}
                                      onChange={(e) =>
                                        setInlineSelector((current) =>
                                          current?.slotSelectionKey === eveningSelectionKey
                                            ? {
                                                ...current,
                                                category: e.target.value,
                                              }
                                            : current
                                        )
                                      }
                                    >
                                      <option value="">Choisir une catégorie</option>
                                      {ACTIVITY_CATEGORY_OPTIONS.map((categoryOption) => (
                                        <option
                                          key={categoryOption.value}
                                          value={categoryOption.value}
                                        >
                                          {categoryOption.label}
                                        </option>
                                      ))}
                                    </select>

                                    {inlineSelector.category ? (
                                      <select
                                        className="h-10 w-full rounded-xl border border-border/50 bg-white px-3 text-sm shadow-sm"
                                        defaultValue=""
                                        onChange={(e) => {
                                          const selectedId = Number(e.target.value);
                                          if (!selectedId) return;

                                          handleSelectActivity(
                                            day.label,
                                            "veillee",
                                            selectedId,
                                            true
                                          );

                                          setInlineSelector(null);
                                        }}
                                      >
                                        <option value="">Choisir une activité</option>
                                        {getInlineActivitiesByCategory(
                                          getManualActivitiesForSlot(day.label, "veillee"),
                                          inlineSelector.category
                                        ).map((activity) => (
                                          <option key={activity.id} value={activity.id}>
                                            {activity.title}
                                          </option>
                                        ))}
                                      </select>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {manualSelectionSlotKey ? (
                <div
                  ref={manualSectionRef}
                  className="mt-4 rounded-2xl border border-border/60 bg-slate-50/70 p-4"
                >
                  {(() => {
                    const [selectedDayLabel, selectedSlotKey] =
                      manualSelectionSlotKey.split("__");

                    const slotLabelMap: Record<string, string> = {
                      matin: "Matin",
                      apresMidi: "Après-midi",
                      veillee: "Veillée",
                    };

                    const manualActivities = getManualActivitiesForSlot(
                      selectedDayLabel,
                      selectedSlotKey
                    );

                    const normalizedSearchTerm = normalizeText(manualSearchTerm);

                    const filteredManualActivities =
                      normalizedSearchTerm.trim().length === 0
                        ? manualActivities
                        : manualActivities.filter((activity) =>
                            normalizeText(
                              `${activity.title} ${activity.summary} ${activity.type} ${activity.category} ${activity.content}`
                            ).includes(normalizedSearchTerm)
                          );

                    const PAGE_SIZE = 24;

                    const displayedActivities = filteredManualActivities.slice(
                      0,
                      manualDisplayCount
                    );

                    const groupedManualActivities = displayedActivities.reduce<
                      Record<string, GeneratedActivity[]>
                    >((groups, activity) => {
                      const groupLabel =
                        activity.category?.trim() ||
                        activity.type?.trim() ||
                        "Autres activités";

                      if (!groups[groupLabel]) {
                        groups[groupLabel] = [];
                      }

                      groups[groupLabel].push(activity);
                      return groups;
                    }, {});

                    const orderedGroupEntries = Object.entries(
                      groupedManualActivities
                    ).sort(([groupA], [groupB]) =>
                      groupA.localeCompare(groupB, "fr")
                    );

                    const totalResults = filteredManualActivities.length;
                    const hasMore = totalResults > manualDisplayCount;

                    return (
                      <>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              Choix manuel
                            </p>

                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {selectedDayLabel} · {slotLabelMap[selectedSlotKey] ?? selectedSlotKey}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setManualSelectionSlotKey(null);
                              setManualSearchTerm("");
                              setManualDisplayCount(24);
                            }}
                            className="rounded-lg border border-border/60 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            Retour
                          </button>
                        </div>

                        <p className="mt-3 text-[11px] leading-relaxed text-slate-600">
                          Choisis une activité pour cette case du planning.
                        </p>

                        <div className="mt-3">
                          <input
                            type="text"
                            value={manualSearchTerm}
                            onChange={(e) => setManualSearchTerm(e.target.value)}
                            placeholder="Rechercher une activité, un mot-clé, un type..."
                            className="h-11 w-full rounded-2xl border border-border/50 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none"
                          />
                        </div>

                        {filteredManualActivities.length === 0 ? (
                          <div className="mt-4 rounded-2xl border border-border/50 bg-white p-4 text-sm text-slate-600">
                            Aucun résultat pour cette recherche.
                          </div>
                        ) : (
                          <div className="mt-4 space-y-4">
                            {orderedGroupEntries.map(([groupLabel, activities]) => (
                              <div
                                key={`${selectedSlotKey}-${groupLabel}`}
                                className="rounded-2xl border border-border/50 bg-white p-3"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">
                                    {groupLabel}
                                  </p>

                                  <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">
                                    {activities.length} activité
                                    {activities.length > 1 ? "s" : ""}
                                  </span>
                                </div>

                                <div className="mt-3 grid gap-3">
                                  {activities.map((activity) => {
                                    const selectionKey = buildSlotSelectionKey(
                                      selectedDayLabel,
                                      selectedSlotKey
                                    );
                                    const isSelected =
                                      activity.id === selectedActivities[selectionKey]?.id;

                                    return (
                                      <button
                                        key={`grid-manual-${selectedSlotKey}-${activity.id}`}
                                        type="button"
                                        onClick={() => {
                                          handleSelectActivity(
                                            selectedDayLabel,
                                            selectedSlotKey,
                                            activity.id,
                                            true
                                          );
                                          setManualSelectionSlotKey(null);
                                          setManualSearchTerm("");
                                          setManualDisplayCount(24);
                                        }}
                                        className={`w-full rounded-2xl border px-4 py-3 text-left text-xs transition ${
                                          isSelected
                                            ? "border-primary bg-primary/10 text-foreground shadow-sm"
                                            : "border-border/50 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-foreground">
                                              {activity.title}
                                            </p>

                                            {activity.summary ? (
                                              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                                                {activity.summary}
                                              </p>
                                            ) : null}

                                            <div className="mt-2 flex flex-wrap gap-2">
                                              {activity.category ? (
                                                <span className="rounded-full border border-border/60 bg-white px-2 py-1 text-[10px] font-medium text-slate-600">
                                                  Catégorie : {formatActivityCategoryLabel(activity.category)}
                                                </span>
                                              ) : null}

                                              {activity.duration ? (
                                                <span className="rounded-full border border-border/60 bg-white px-2 py-1 text-[10px] font-medium text-slate-600">
                                                  Durée : {activity.duration}
                                                </span>
                                              ) : null}

                                              {activity.ageRange ? (
                                                <span className="rounded-full border border-border/60 bg-white px-2 py-1 text-[10px] font-medium text-slate-600">
                                                  Âge : {activity.ageRange}
                                                </span>
                                              ) : null}
                                            </div>
                                          </div>

                                          <div className="flex shrink-0 flex-col items-end gap-2">
                                            {null}

                                            {null}
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}

                            {hasMore ? (
                              <div className="flex flex-col items-center gap-3 pt-2">
                                <p className="text-xs text-slate-500">
                                  {displayedActivities.length} / {totalResults} activités affichées
                                </p>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setManualDisplayCount((current) => current + PAGE_SIZE)
                                  }
                                  className="rounded-xl border border-border/50 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                >
                                  Voir plus d’activités
                                </button>
                              </div>
                            ) : totalResults > 24 ? (
                              <div className="pt-2 text-center text-xs text-slate-500">
                                Toutes les activités disponibles sont affichées ({totalResults}).
                              </div>
                            ) : null}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          Générer le programme
        </button>
      </div>
    </div>
  );
}