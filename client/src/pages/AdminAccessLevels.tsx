import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Check, AlertCircle, Star } from "lucide-react";
import { toast } from "sonner";

import {

  RESOURCE_TYPES,
  PREP_TIMES,
  DURATIONS,
  AGE_RANGES,
  type ResourceType,
  type PrepTime,
  type Duration,
  type AgeRange,
} from "@shared/resourceMeta";


type AccessLevel = "PUBLIC" | "INTERNAL_IFAC" | "PREMIUM";

const ACCESS_LEVEL_COLORS: Record<AccessLevel, string> = {
  PUBLIC: "bg-green-100 text-green-800",
  INTERNAL_IFAC: "bg-blue-100 text-blue-800",
  PREMIUM: "bg-purple-100 text-purple-800",
};

const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  PUBLIC: "🌍 Public",
  INTERNAL_IFAC: "👤 Connectés",
  PREMIUM: "⭐ Premium",
};

function safeStr(v: unknown) {
  return String(v ?? "");
}

// ✅ Option B : Admin tout-puissant (UI)
// L’admin peut forcer n’importe quel statut.
// Le backend garde les règles critiques (ex: PUBLIC interdit si status != approved).
const ALLOWED_STATUS_TRANSITIONS = {
  draft: ["draft", "pending", "approved", "rejected"],
  pending: ["draft", "pending", "approved", "rejected"],
  approved: ["draft", "pending", "approved", "rejected"],
  rejected: ["draft", "pending", "approved", "rejected"],
} as const;

type EditorialStatus = keyof typeof ALLOWED_STATUS_TRANSITIONS;

function normalizeEditorialStatus(v: any): EditorialStatus {
  const s = String(v ?? "draft").toLowerCase();
  return (s === "draft" || s === "pending" || s === "approved" || s === "rejected")
    ? s
    : "draft";
}

function allowedNextStatuses(current: EditorialStatus): EditorialStatus[] {
  return [...ALLOWED_STATUS_TRANSITIONS[current]];
}

const FEATURED_COLLECTION_NAME = "ifac à la une";

function normalizeCollectionName(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function getFeaturedSwitchLabel(isFeatured: boolean) {
  return isFeatured ? "À la une" : "Hors sélection";
}

export default function AdminAccessLevels() {
  const resourcesQuery = trpc.resources.getAllResourcesForAdmin.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 0,
  });



  const updateOneMutation = trpc.resources.update.useMutation();
  const bulkDeleteMutation = trpc.resources.bulkDelete.useMutation();

  const collectionsQuery = trpc.collections.getAllCollections.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const createCollectionMutation = trpc.collections.create.useMutation();
  const addResourceAsAdminMutation = trpc.collections.addResourceAsAdmin.useMutation();
  const removeResourceAsAdminMutation = trpc.collections.removeResourceAsAdmin.useMutation();

  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<AccessLevel | "ALL">("ALL");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkLevel, setBulkLevel] = useState<AccessLevel | "KEEP">("KEEP");
  const [bulkStatus, setBulkStatus] = useState<
    "draft" | "pending" | "approved" | "rejected"
  >("draft");

  // ✅ Bulk “Tranche d’âge”
  // - KEEP : ne change rien
  // - CLEAR : efface la valeur
  // - sinon : définit la valeur
  const [bulkAgeRange, setBulkAgeRange] = useState<
  "KEEP" | "CLEAR" | "3-5 ans" | "6-11 ans" | "12-18 ans" | "Tous âges"
>("KEEP");

  // ✅ Bulk “Durée”
  const [bulkDuration, setBulkDuration] = useState<
  "KEEP" | "CLEAR" | "30 min" | "1-2h" | "Demi-journée" | "Journée"
>("KEEP");

const [bulkPrepTime, setBulkPrepTime] = useState<
  "KEEP" | "CLEAR" | PrepTime
>("KEEP");

const [bulkResourceType, setBulkResourceType] = useState<
  "KEEP" | "CLEAR" | ResourceType
>("KEEP");

  const [isUpdating, setIsUpdating] = useState(false);

  const resources: any[] = resourcesQuery.data ?? [];
  const collections: any[] = collectionsQuery.data ?? [];

  const featuredCollection =
    [...collections]
      .filter((c: any) => {
        const candidate = c?.name ?? c?.title ?? "";
        return (
          normalizeCollectionName(candidate) ===
          normalizeCollectionName(FEATURED_COLLECTION_NAME)
        );
      })
      .sort((a: any, b: any) => Number(b?.id ?? 0) - Number(a?.id ?? 0))[0] ?? null;

  const featuredCollectionId = featuredCollection ? Number(featuredCollection.id) : null;

  const featuredResourcesQuery = trpc.collections.getCollectionWithResources.useQuery(
    featuredCollectionId ? { collectionId: featuredCollectionId } : undefined!,
    {
      enabled: !!featuredCollectionId,
      refetchOnWindowFocus: false,
    }
  );

  const featuredResourceIds = new Set<number>(
    ((featuredResourcesQuery.data as any)?.resources ?? []).map((r: any) =>
      Number(r?.id ?? r?.resourceId ?? r?.resource?.id)
    )
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources.filter((r) => {
      const title = safeStr(r?.title).toLowerCase();
      const summary = safeStr(r?.summary ?? r?.description).toLowerCase();
      const matchesSearch = !q || title.includes(q) || summary.includes(q);

      const lvl = String(r?.accessLevel ?? "PUBLIC");
      const matchesFilter = filterLevel === "ALL" || lvl === filterLevel;

      return matchesSearch && matchesFilter;
    });
  }, [resources, search, filterLevel]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const rangeLabel =
    total === 0
      ? "0"
      : `${(safePage - 1) * pageSize + 1}–${Math.min(
          safePage * pageSize,
          total
        )} sur ${total}`;

  const pageIds = pageItems.map((r) => Number(r.id));
  const allSelectedOnPage =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectPage = () => {
    setSelectedIds((prev) =>
      allSelectedOnPage
        ? prev.filter((id) => !pageIds.includes(id))
        : Array.from(new Set([...prev, ...pageIds]))
    );
  };

  const clearSelection = () => setSelectedIds([]);

  async function refresh() {
    await resourcesQuery.refetch();
    await collectionsQuery.refetch();
    if (featuredCollectionId) {
      await featuredResourcesQuery.refetch();
    }
  }

  async function handleCreateFeaturedCollection(): Promise<number | null> {
    try {
      const existingCollection =
        [...(collectionsQuery.data ?? [])]
          .filter(
            (c: any) =>
              String(c?.name ?? "").trim().toLowerCase() === FEATURED_COLLECTION_NAME
          )
          .sort((a: any, b: any) => Number(b?.id ?? 0) - Number(a?.id ?? 0))[0] ?? null;

      if (existingCollection) {
        return Number(existingCollection.id);
      }

      const created = await createCollectionMutation.mutateAsync({
        name: FEATURED_COLLECTION_NAME,
        description: "Sélection éditoriale affichée sur la page d’accueil",
        isPublic: false,
      });

      await collectionsQuery.refetch();

      const createdId = Number((created as any)?.id ?? 0) || null;

      toast.success(`Collection "${FEATURED_COLLECTION_NAME}" créée.`);
      return createdId;
    } catch (error) {
      console.error("[AdminAccessLevels] create featured collection error", error);
      toast.error("Erreur lors de la création de la collection éditoriale.");
      return null;
    }
  }

  async function handleToggleFeatured(resourceId: number, nextChecked: boolean) {
    try {
      let activeCollectionId = featuredCollectionId;

      if (nextChecked && !activeCollectionId) {
        activeCollectionId = await handleCreateFeaturedCollection();

        if (!activeCollectionId) {
          toast.error(`Impossible de créer "${FEATURED_COLLECTION_NAME}".`);
          return;
        }
      }

      if (!activeCollectionId) {
        toast.error(`La collection "${FEATURED_COLLECTION_NAME}" est introuvable.`);
        return;
      }

      if (nextChecked) {
        await addResourceAsAdminMutation.mutateAsync({
          collectionId: activeCollectionId,
          resourceId,
        });
        toast.success("Ressource ajoutée à ifac à la une.");
      } else {
        await removeResourceAsAdminMutation.mutateAsync({
          collectionId: activeCollectionId,
          resourceId,
        });
        toast.success("Ressource retirée de ifac à la une.");
      }

      await refresh();
    } catch (error) {
      console.error("[AdminAccessLevels] toggle featured error", error);
      toast.error("Erreur lors de la mise à jour de ifac à la une.");
    }
  }

  async function handleBulkUpdate() {
  if (selectedIds.length === 0) return;

  const ageRangePatch =
    bulkAgeRange === "KEEP"
      ? undefined
      : bulkAgeRange === "CLEAR"
        ? null
        : bulkAgeRange;

  const durationPatch =
    bulkDuration === "KEEP"
      ? undefined
      : bulkDuration === "CLEAR"
        ? null
        : bulkDuration;

  const prepTimePatch =
    bulkPrepTime === "KEEP"
      ? undefined
      : bulkPrepTime === "CLEAR"
        ? null
        : bulkPrepTime;

  const resourceTypePatch =
    bulkResourceType === "KEEP"
      ? undefined
      : bulkResourceType === "CLEAR"
        ? null
        : bulkResourceType;

  // ✅ Map id -> ressource (pour connaître le statut actuel)
  const byId = new Map<number, any>(resources.map((r) => [Number(r.id), r]));

  setIsUpdating(true);

  let applied = 0;
  let skipped = 0;
  let failed = 0;
  let autoFixedPublic = 0;

  try {
    for (const id of selectedIds) {
      const r = byId.get(id);
      const current = normalizeEditorialStatus(r?.status);

      // ✅ garde-fou : transitions statut autorisées (même règles que l’UI)
      const allowed = new Set(allowedNextStatuses(current));
      const wantsStatus = normalizeEditorialStatus(bulkStatus);

      
      if (!allowed.has(wantsStatus)) {
        skipped++;
        continue;
      }

      // ✅ Access bulk pro : KEEP = ne pas toucher à l’accès
const wantsAccessLevel: AccessLevel | undefined =
  bulkLevel === "KEEP" ? undefined : (bulkLevel as AccessLevel);

// ✅ Lecture de l’accès actuel (si la ressource est déjà PUBLIC)
const currentAccessLevel = String(r?.accessLevel ?? "PUBLIC").toUpperCase() as AccessLevel;

// ✅ Règle serveur (Pilier 10) : status != approved => interdit PUBLIC
// Cas 1) l’admin demande explicitement PUBLIC -> on auto-corrige
// Cas 2) KEEP mais la ressource est déjà PUBLIC -> on auto-corrige aussi (sinon le serveur rejettera)
let safeAccessLevel: AccessLevel | undefined = wantsAccessLevel;

if (wantsStatus !== "approved") {
  if (safeAccessLevel === "PUBLIC") {
    safeAccessLevel = "INTERNAL_IFAC";
    autoFixedPublic++;
  } else if (safeAccessLevel === undefined && currentAccessLevel === "PUBLIC") {
    safeAccessLevel = "INTERNAL_IFAC";
    autoFixedPublic++;
  }
}

try {
  await updateOneMutation.mutateAsync({
    id,
    ...(safeAccessLevel === undefined ? {} : { accessLevel: safeAccessLevel }),
    status: wantsStatus,
    ...(ageRangePatch === undefined ? {} : { ageRange: ageRangePatch }),
    ...(durationPatch === undefined ? {} : { duration: durationPatch }),
    ...(prepTimePatch === undefined ? {} : { prepTime: prepTimePatch }),
    ...(resourceTypePatch === undefined ? {} : { type: resourceTypePatch }),
  } as any);

  applied++;
} catch (e) {

        console.error("[AdminAccessLevels] bulk update error id=", id, e);
        failed++;
        continue;
      }
    }

    clearSelection();
    await refresh();

    // Feedback pro : on explique l’auto-correction
    if (failed === 0 && skipped === 0) {
      if (autoFixedPublic > 0) {
        toast.message(
          `Modifs appliquées : ${applied} ressource(s). Note : ${autoFixedPublic} ressource(s) non publiée(s) ont été basculées en "Connectés" (PUBLIC interdit hors "Publiée").`
        );
      } else {
        toast.success(`Modifs appliquées : ${applied} ressource(s).`);
      }
    } else {
      toast.message(
        `Bulk terminé : ${applied} appliquée(s), ${skipped} ignorée(s) (transition interdite), ${failed} en erreur.`
      );
    }
  } finally {
    setIsUpdating(false);
  }
}


  if (resourcesQuery.isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (resourcesQuery.error) {
    return (
      <div className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
  <div>
    <h1 className="text-3xl font-bold">
      Ressources · Modifications en masse
    </h1>
    <p className="mt-1 text-gray-600">
      Ici : modifier plusieurs ressources en même temps (accès, statut, etc.).
      Pour éditer une ressource individuellement, utilise la vue d’ensemble.
    </p>

    <div className="mt-2 text-xs text-gray-500 leading-relaxed">
      <div>🟠 <span className="font-medium">Modifications en masse</span> : changements groupés.</div>
      <div>🔵 <span className="font-medium">Vue d’ensemble</span> : édition détaillée ressource par ressource.</div>
    </div>
  </div>

  <div className="flex flex-wrap gap-2">
    <Link
      href="/admin/resources-management"
      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      title="Ouvrir la vue d’ensemble"
    >
      🔵 Vue d’ensemble
    </Link>

    <Link
      href="/admin"
      className="inline-flex items-center justify-center rounded-lg border px-4 py-2 hover:bg-gray-50"
      title="Retour au tableau de bord admin"
    >
      Retour admin
    </Link>
  </div>
</div>

        <p className="mt-4 text-red-600">
          Erreur : {resourcesQuery.error.message}
        </p>
      </div>
    );
  }

  return (
  <div className="space-y-6 p-6">
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_26%),linear-gradient(to_bottom,rgba(248,250,252,0.95),rgba(255,255,255,0.98))]" />

        <div className="relative grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              Modifications en masse
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                Ressources · Modifications en masse
              </h1>

              <p className="max-w-4xl text-sm leading-7 text-slate-600 md:text-base">
                Interface de pilotage groupé pour modifier plusieurs ressources en une seule opération :
                accès, statut, tranche d’âge, durée, préparation et type.
                Pour une édition détaillée ressource par ressource
                <span className="font-semibold text-slate-900">, utilise la vue d’ensemble</span>.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-orange-700">
                Changements groupés
              </span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                Édition rapide
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                Gestion des accès
              </span>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-violet-700">
                Pilotage éditorial
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Recherche
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Isole rapidement un lot de ressources par titre ou résumé.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Sélection
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Coche plusieurs ressources pour appliquer une modification commune.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Action
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Mets à jour les métadonnées sans entrer dans la fiche détaillée.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="space-y-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  Accès rapides
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Utilise ces entrées pour basculer immédiatement entre pilotage groupé et édition détaillée.
                </p>
              </div>

              <div className="grid gap-3">
                <Link
                  href="/admin/resources-management"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                  title="Ouvrir la vue d’ensemble (édition détaillée)"
                >
                  Vue d’ensemble
                </Link>

                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  title="Retour au tableau de bord admin"
                >
                  Retour admin
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Lecture immédiate
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Cette vue sert à modifier plusieurs ressources à la fois.
                  Pour les champs détaillés comme l’URL, les profils ou le contenu complet, passe par la vue d’ensemble.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

<Card className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <Input
          placeholder="Rechercher une ressource (titre ou résumé)…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-10 border-slate-200 bg-white text-sm"
        />

        <Select
          value={filterLevel}
          onValueChange={(v) => {
            setFilterLevel(v as any);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-10 w-52 border-slate-200 bg-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les accès</SelectItem>
            <SelectItem value="PUBLIC">🌍 Public</SelectItem>
            <SelectItem value="INTERNAL_IFAC">👤 Connectés</SelectItem>
            <SelectItem value="PREMIUM">⭐ Premium</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm font-medium text-slate-600">
        {rangeLabel}
      </div>
    </div>

    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span className="font-medium">Affichage :</span>

        <select
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value) as 25 | 50 | 100);
            setPage(1);
          }}
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        <span>résultats / page</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={safePage <= 1}
          type="button"
        >
          ←
        </button>

        <span className="text-sm font-medium text-slate-600">
          {safePage} / {totalPages}
        </span>

        <button
          className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={safePage >= totalPages}
          type="button"
        >
          →
        </button>
      </div>
    </div>
  </div>
</Card>

{selectedIds.length > 0 && (
      <Card className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">
                {selectedIds.length}
              </span>{" "}
              ressource(s) sélectionnée(s)
            </div>

            <Button
              variant="destructive"
              disabled={isUpdating || bulkDeleteMutation.isPending}
              onClick={async () => {
                const confirmed = window.confirm(
                  `Confirmer la suppression de ${selectedIds.length} ressource(s) ? Cette action est irréversible.`
                );

                if (!confirmed) return;

                try {
                  const result = await bulkDeleteMutation.mutateAsync({
                    ids: selectedIds,
                  });

                  clearSelection();
                  await refresh();

                  toast.success(
                    `Suppression terminée : ${result.deleted} supprimée(s), ${result.notFound} introuvable(s), ${result.failed} en erreur.`
                  );
                } catch (error) {
                  console.error("[AdminAccessLevels] bulk delete error", error);
                  toast.error("Erreur lors de la suppression multiple.");
                }
              }}
              className="h-9"
            >
              {bulkDeleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "🗑️ Supprimer la sélection"
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={bulkLevel}
              onValueChange={(v) => setBulkLevel(v as AccessLevel | "KEEP")}
            >
              <SelectTrigger className="h-9 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KEEP">Accès : ne pas changer</SelectItem>
                <SelectItem value="PUBLIC">🌍 Public</SelectItem>
                <SelectItem value="INTERNAL_IFAC">👤 Connectés</SelectItem>
                <SelectItem value="PREMIUM">⭐ Premium</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={bulkStatus}
              onValueChange={(v) =>
                setBulkStatus(v as "draft" | "pending" | "approved" | "rejected")
              }
            >
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">📝 Brouillon</SelectItem>
                <SelectItem value="pending">⏳ En attente</SelectItem>
                <SelectItem value="approved">✅ Publiée</SelectItem>
                <SelectItem value="rejected">⛔ Rejetée</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={bulkAgeRange}
              onValueChange={(v) =>
                setBulkAgeRange(
                  v as
                    | "KEEP"
                    | "CLEAR"
                    | "3-5 ans"
                    | "6-11 ans"
                    | "12-18 ans"
                    | "Tous âges"
                )
              }
            >
              <SelectTrigger className="h-9 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KEEP">Âge : ne pas changer</SelectItem>
                <SelectItem value="CLEAR">Effacer</SelectItem>
                <SelectItem value="3-5 ans">3-5 ans</SelectItem>
                <SelectItem value="6-11 ans">6-11 ans</SelectItem>
                <SelectItem value="12-18 ans">12-18 ans</SelectItem>
                <SelectItem value="Tous âges">Tous âges</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={bulkDuration}
              onValueChange={(v) =>
                setBulkDuration(
                  v as
                    | "KEEP"
                    | "CLEAR"
                    | "30 min"
                    | "1-2h"
                    | "Demi-journée"
                    | "Journée"
                )
              }
            >
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KEEP">Durée : ne pas changer</SelectItem>
                <SelectItem value="CLEAR">Effacer</SelectItem>
                <SelectItem value="30 min">30 min</SelectItem>
                <SelectItem value="1-2h">1–2h</SelectItem>
                <SelectItem value="Demi-journée">Demi-journée</SelectItem>
                <SelectItem value="Journée">Journée</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={bulkPrepTime}
              onValueChange={(v) => setBulkPrepTime(v as "KEEP" | "CLEAR" | PrepTime)}
            >
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KEEP">Prépa : ne pas changer</SelectItem>
                <SelectItem value="CLEAR">Effacer</SelectItem>
                {PREP_TIMES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={bulkResourceType}
              onValueChange={(v) =>
                setBulkResourceType(v as "KEEP" | "CLEAR" | ResourceType)
              }
            >
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Type de ressource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KEEP">Type : ne pas changer</SelectItem>
                <SelectItem value="CLEAR">Effacer</SelectItem>
                {RESOURCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleBulkUpdate}
              disabled={isUpdating || bulkDeleteMutation.isPending}
              className="h-9 bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Appliquer
            </Button>
          </div>
        </div>
      </Card>
    )}

    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
<thead className="bg-slate-50 border-b text-xs uppercase tracking-wide text-slate-500">
  <tr>
    <th className="w-10 px-3 py-3 text-left">
      <Checkbox
        checked={allSelectedOnPage}
        onCheckedChange={toggleSelectPage}
      />
    </th>

    <th className="px-3 py-3 text-left font-semibold">Ressource</th>
    <th className="w-40 px-3 py-3 text-left font-semibold">Accès</th>
    <th className="w-40 px-3 py-3 text-left font-semibold">Statut</th>
    <th className="w-48 px-3 py-3 text-left font-semibold">Âge</th>
    <th className="w-40 px-3 py-3 text-left font-semibold">Durée</th>
    <th className="w-44 px-3 py-3 text-left font-semibold">Prépa</th>
    <th className="w-56 px-3 py-3 text-left font-semibold">Type</th>
    <th className="w-40 px-3 py-3 text-left font-semibold">À la une</th>
    <th className="w-32 px-3 py-3 text-left font-semibold">Actions</th>
  </tr>
</thead>

        <tbody>
          {pageItems.map((r) => {
            const id = Number(r.id);
            const lvl = String(r.accessLevel ?? "PUBLIC") as AccessLevel;

            return (
              <tr
  key={id}
  className="border-t hover:bg-slate-50/60 transition align-middle"
>
                <td className="px-3 py-2">
                  <Checkbox
                    checked={selectedIds.includes(id)}
                    onCheckedChange={() => toggleSelect(id)}
                  />
                </td>

                <td className="px-3 py-2">
  <div className="flex flex-col gap-1 max-w-[320px]">
    
    <div className="font-semibold text-slate-900 leading-snug">
      {r.title ?? "Sans titre"}
    </div>

    <div className="text-xs text-slate-500 line-clamp-2">
      {r.summary ?? r.description ?? "—"}
    </div>

  </div>
</td>

                <td className="px-3 py-2">
                  <Select
                    value={lvl}
                    onValueChange={async (value) => {
                      await updateOneMutation.mutateAsync({
                        id,
                        accessLevel: value as AccessLevel,
                      } as any);
                      await refresh();
                    }}
                  >
                    <SelectTrigger className="h-9 w-40 bg-white border-slate-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">🌍 Public</SelectItem>
                      <SelectItem value="INTERNAL_IFAC">👤 Connectés</SelectItem>
                      <SelectItem value="PREMIUM">⭐ Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </td>

                <td className="px-3 py-2">
                  {(() => {
                    const value = normalizeEditorialStatus(r.status);
                    const allowed = new Set(allowedNextStatuses(value));

                    return (
                      <Select
                        value={value}
                        onValueChange={async (next) => {
                          await updateOneMutation.mutateAsync({
                            id,
                            status: next,
                          } as any);
                          await refresh();
                        }}
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft" disabled={!allowed.has("draft")}>
                            📝 Brouillon
                          </SelectItem>
                          <SelectItem value="pending" disabled={!allowed.has("pending")}>
                            ⏳ En attente
                          </SelectItem>
                          <SelectItem value="approved" disabled={!allowed.has("approved")}>
                            ✅ Publiée
                          </SelectItem>
                          <SelectItem value="rejected" disabled={!allowed.has("rejected")}>
                            ⛔ Rejetée
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    );
                  })()}
                </td>

                <td className="px-3 py-2">
                  {(() => {
                    const raw = String(r.ageRange ?? "").trim();
                    const value = AGE_RANGES.includes(raw as any) ? raw : "—";

                    return (
                      <Select
                        value={value}
                        onValueChange={async (next) => {
                          await updateOneMutation.mutateAsync({
                            id,
                            ageRange: next === "—" ? null : next,
                          } as any);
                          await refresh();
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="—">— (non renseigné)</SelectItem>
                          {AGE_RANGES.map((a) => (
                            <SelectItem key={a} value={a}>
                              {a}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  })()}
                </td>

                <td className="px-3 py-2">
                  {(() => {
                    const raw = String(r.duration ?? "").trim();
                    const value = DURATIONS.includes(raw as any) ? raw : "—";

                    return (
                      <Select
                        value={value}
                        onValueChange={async (next) => {
                          await updateOneMutation.mutateAsync({
                            id,
                            duration: next === "—" ? null : next,
                          } as any);
                          await refresh();
                        }}
                      >
                        <SelectTrigger className="h-9 w-40 bg-white border-slate-200 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="—">— (non renseigné)</SelectItem>
                          {DURATIONS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d === "1-2h" ? "1–2h" : d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  })()}
                </td>

                <td className="px-3 py-2">
                  {(() => {
                    const raw = String(r.prepTime ?? "").trim();
                    const value = PREP_TIMES.includes(raw as any) ? raw : "—";

                    return (
                      <Select
                        value={value}
                        onValueChange={async (next) => {
                          await updateOneMutation.mutateAsync({
                            id,
                            prepTime: next === "—" ? null : next,
                          } as any);
                          await refresh();
                        }}
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="—">— (non renseigné)</SelectItem>
                          {PREP_TIMES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  })()}
                </td>

                <td className="px-3 py-2">
                  {(() => {
                    const raw = String(r.type ?? "").trim();
                    const value = RESOURCE_TYPES.includes(raw as any) ? raw : "—";

                    return (
                      <Select
                        value={value}
                        onValueChange={async (next) => {
                          await updateOneMutation.mutateAsync({
                            id,
                            type: next === "—" ? null : next,
                          } as any);
                          await refresh();
                        }}
                      >
                        <SelectTrigger className="w-56">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="—">— (non renseigné)</SelectItem>
                          {RESOURCE_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  })()}
                </td>

                <td className="px-3 py-2">
                  {(() => {
                    const isFeatured = featuredResourceIds.has(id);
                    const isBusy =
                      createCollectionMutation.isPending ||
                      addResourceAsAdminMutation.isPending ||
                      removeResourceAsAdminMutation.isPending;

                    return (
                      <div className="flex min-w-[190px] items-center justify-between gap-3">
                        <Switch
                          checked={isFeatured}
                          disabled={isBusy}
                          onCheckedChange={(checked) =>
                            handleToggleFeatured(id, Boolean(checked))
                          }
                          aria-label={
                            isFeatured
                              ? "Retirer de ifac à la une"
                              : "Ajouter à ifac à la une"
                          }
                        />

                        <span
  className={
    isFeatured
      ? "text-xs font-semibold text-yellow-700 bg-yellow-50 px-2 py-1 rounded-md"
      : "text-xs text-gray-500"
  }
>
                          {getFeaturedSwitchLabel(isFeatured)}
                        </span>

                        {isBusy && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                      </div>
                    );
                  })()}
                </td>

               <td className="px-3 py-2">
  <Button
    asChild
    variant="outline"
    size="sm"
    className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
  >
    <Link href={`/admin/ressources/${id}`}>
      Éditer
    </Link>
  </Button>
</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {pageItems.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
          Aucune ressource trouvée
        </div>
      )}
    </div>
  </div>
  );
}
