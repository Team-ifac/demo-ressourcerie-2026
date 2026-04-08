import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  Download,
  EyeOff,
  FilePlus2,
  FileSpreadsheet,
  PackageSearch,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { Link, useLocation } from "wouter";

import {
  accessLabel,
  visibilityLabel,
  readingLabel,
  readingBadgeClass,
} from "@/lib/resourcePolicy";

import { STATUS_LABELS, allowedNextStatuses, normalizeStatus, type StatusValue } from "@shared/editorialStatus";
import { historyActionLabel } from "@shared/historyActions";

type ResourceAdminRow = {
  id: number;
  title?: string | null;
  type?: string | null;

  summary?: string | null;
  description?: string | null;

  url?: string | null;
  fileUrl?: string | null;
  thumbnailUrl?: string | null;
  thumbnailKey?: string | null;

  accessLevel?: "PUBLIC" | "INTERNAL_IFAC" | "PREMIUM" | string | null;
  visibility?: "PUBLIC" | "INTERNAL_IFAC" | string | null;

  status?: "draft" | "approved" | string | null;

  profiles?: ProfileType[] | null;
  collections?: { name?: string | null }[] | null;

  // ✅ audit (liste)
  historyCount?: number | null;
  lastActionAt?: string | null;
  lastAction?: string | null;
  lastActorName?: string | null;
};

type AnyResource = ResourceAdminRow;

type AccessValue = "PUBLIC" | "INTERNAL_IFAC" | "PREMIUM";

type ProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa";
const PROFILE_TYPES: ProfileType[] = ["animateur", "formateur", "directeur", "stagiaire_bafa"];

function isProfileType(v: any): v is ProfileType {
  return PROFILE_TYPES.includes(v);
}

type EditForm = {
  id: number;
  title: string;
  summary: string;
  url: string;

  // ✅ Vignette
  thumbnailUrl: string;
  thumbnailKey: string;

  accessLevel: AccessValue;
  status: StatusValue; // ← vient de @shared/editorialStatus

  // ✅ Profils de la ressource (multi)
  profileTypes: ProfileType[];
};

function toCsvValue(v: any) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  const escaped = s.replace(/"/g, '""');
  return `"${escaped}"`;
}

function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function normalizeUrl(url?: string | null) {
  const raw = (url ?? "").trim();
  if (!raw) return "";

  // ✅ Cas "data:" (base64) : ne jamais toucher
  // ✅ Cas bug existant : "https://data:..." → on répare
  const u = raw.replace(/^https?:\/\/(data:)/i, "$1");
  if (/^data:/i.test(u)) return u;

  // ✅ Cas "blob:" (aperçus navigateur) : ne jamais toucher
  if (/^blob:/i.test(u)) return u;

  // Si déjà une URL http(s), on garde
  if (/^https?:\/\//i.test(u)) return u;

  // Sinon, on considère que c’est un chemin relatif (ex: /imported/...)
  return u.startsWith("/") ? u : `/${u}`;
}

function visibilityBadgeClass(v?: string | null) {
  if (v === "PUBLIC") return "bg-green-100 text-green-800";
  if (v === "INTERNAL_IFAC") return "bg-blue-100 text-blue-800";
  return "bg-gray-200 text-gray-700";
}

function statusBadgeClass(v: StatusValue) {
  if (v === "approved") return "bg-green-50 text-green-800";
  if (v === "pending") return "bg-orange-50 text-orange-800";
  if (v === "rejected") return "bg-red-50 text-red-800";
  return "bg-gray-100 text-gray-800";
}

function getAdminThumbnailSrc(r: AnyResource) {
  const thumbnailUrl = normalizeUrl(r.thumbnailUrl ?? "");
  const fileUrl = normalizeUrl(r.fileUrl ?? r.url ?? "");

  // 1) vignette explicite enregistrée en base
  if (thumbnailUrl) {
    return thumbnailUrl;
  }

  // 2) fallback PDF importé -> image générée dans /imported_thumbs
  if (
    fileUrl &&
    fileUrl.startsWith("/imported/") &&
    fileUrl.toLowerCase().endsWith(".pdf")
  ) {
    return fileUrl
      .replace("/imported/", "/imported_thumbs/")
      .replace(/\.pdf$/i, ".png");
  }

  return "";
}

function getDownloadCount(r: AnyResource) {
  return Number((r as any)?.downloadCount ?? 0);
}



export default function AdminResourcesManagement() {
  const [location, navigate] = useLocation();

  const [search, setSearch] = useState("");
  const [onlyUnused, setOnlyUnused] = useState(false);
  const [onlyDrafts, setOnlyDrafts] = useState(false);
  const [onlyNeverViewed, setOnlyNeverViewed] = useState(false);
  const [onlyTrulyUnused, setOnlyTrulyUnused] = useState(false);

  const [openId, setOpenId] = useState<number | null>(null);
const openRowRef = React.useRef<HTMLTableRowElement | null>(null);
  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
    );

    const filter = String(searchParams.get("filter") ?? "").trim().toLowerCase();

    setOnlyDrafts(false);
    setOnlyUnused(false);
    setOnlyNeverViewed(false);
    setOnlyTrulyUnused(false);

    if (filter === "never-downloaded") {
      setOnlyUnused(true);
    } else if (filter === "never-viewed") {
      setOnlyNeverViewed(true);
    } else if (filter === "unused") {
      setOnlyTrulyUnused(true);
    }
  }, [location]);
useEffect(() => {
  if (openRowRef.current) {
    openRowRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}, [openId]);

  // ✅ Option 2 : onglets dans le panneau (Détails / Historique)
  const [openTab, setOpenTab] = useState<"details" | "history">("details");

  // ✅ Filtres Historique (audit-proof)
  // - historyAction : filtre par type d’action (ALL = tout)
  // - historyText : recherche dans action / acteur / contenu changes
  const [historyAction, setHistoryAction] = useState<string>("ALL");
  const [historyText, setHistoryText] = useState<string>("");

  // ✅ Audit-proof : quand on change de ressource, on reset les filtres Historique
  useEffect(() => {
    setHistoryAction("ALL");
    setHistoryText("");
  }, [openId]);

  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState<EditForm | null>(null);

  // ✅ Pagination (client) : pro et simple
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25);
  const [sort, setSort] = useState<{ key: "id" | "title" | "download"; dir: "asc" | "desc" }>({
    key: "id",
    dir: "desc",
  });

  // ✅ Admin : on récupère tout
  const resourcesQuery = trpc.resources.getAllResourcesForAdmin.useQuery(undefined, {
  staleTime: 0,
  refetchOnWindowFocus: false,
});

  // ✅ Option 2 : historique de la ressource ouverte (audit trail)
  const historyQuery = trpc.history.getByResource.useQuery(
    { resourceId: openId ?? 0 },
    {
      // ✅ On ne charge l’historique QUE quand l’onglet "Historique" est ouvert
      enabled: !!openId && openTab === "history",
      staleTime: 0,
      refetchOnWindowFocus: false,
    }
  );

  const createTestMutation = trpc.resources.createTestResource.useMutation();

  // ✅ Standard PRO : un seul endpoint (typé) pour supprimer
  const deleteOneMutation = trpc.resources.delete.useMutation();

  // ✅ update admin (existe dans ton router resources)
  const updateMutation = trpc.resources.update.useMutation();
  const setProfilesMutation = trpc.resources.setProfiles.useMutation();

    const uploadThumbnailMutation = trpc.resources.uploadFile.useMutation();

  function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = String(reader.result ?? "");
        // res = "data:xxx;base64,AAAA"
        const base64 = res.includes(",") ? res.split(",")[1] : res;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  const utils = trpc.useUtils();

  const resources: AnyResource[] = resourcesQuery.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return resources.filter((r: AnyResource) => {
      const downloadCount = getDownloadCount(r);
      const viewCount = Number((r as any)?.viewCount ?? 0);

      // ✅ filtre "Jamais téléchargées"
      if (onlyUnused && downloadCount !== 0) {
        return false;
      }

      // ✅ filtre "Jamais vues"
      if (onlyNeverViewed && viewCount !== 0) {
        return false;
      }

      // ✅ filtre "Totalement inutilisées" = ni vues ni téléchargements
      if (onlyTrulyUnused && !(viewCount === 0 && downloadCount === 0)) {
        return false;
      }

      // ✅ filtre "Brouillons"
      if (onlyDrafts) {
        const st = String(r.status ?? "").toLowerCase();
        if (st !== "draft") return false;
      }

      // ✅ recherche texte
      if (!q) return true;

      const title = (r.title ?? "").toLowerCase();
      const type = (r.type ?? "").toLowerCase();
      const access = (r.accessLevel ?? "").toLowerCase();
      const status = (r.status ?? "").toLowerCase();
      const summary = (r.summary ?? "").toLowerCase();
      const fileUrl = normalizeUrl(r.fileUrl ?? r.url ?? "").toLowerCase();
      const thumbnailUrl = normalizeUrl(r.thumbnailUrl ?? "").toLowerCase();
      const storageKey = String((r as any)?.storageKey ?? "").toLowerCase();

      const collections = Array.isArray(r.collections)
        ? r.collections.map((c: any) => (c?.name ?? "")).join(" ").toLowerCase()
        : "";

      const profils = Array.isArray(r.profiles)
        ? r.profiles.join(" ").toLowerCase()
        : "";

      return (
        title.includes(q) ||
        type.includes(q) ||
        access.includes(q) ||
        status.includes(q) ||
        summary.includes(q) ||
        fileUrl.includes(q) ||
        thumbnailUrl.includes(q) ||
        storageKey.includes(q) ||
        collections.includes(q) ||
        profils.includes(q)
      );
    });
  }, [
    resources,
    search,
    onlyDrafts,
    onlyUnused,
    onlyNeverViewed,
    onlyTrulyUnused,
  ]);

    const total = filtered.length;

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  // Si la recherche réduit la liste, on évite d’être sur une page vide
  const safePage = Math.min(page, totalPages);

    const paginated = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
  if (sort.key === "download") {
    const ad = Number((a as any)?.downloadCount ?? 0);
    const bd = Number((b as any)?.downloadCount ?? 0);
    return sort.dir === "asc" ? ad - bd : bd - ad;
  }

  if (sort.key === "title") {
    const at = String(a.title ?? "").toLowerCase();
    const bt = String(b.title ?? "").toLowerCase();
    const cmp = at.localeCompare(bt, "fr");
    return sort.dir === "asc" ? cmp : -cmp;
  }

  return sort.dir === "asc"
    ? Number(a.id) - Number(b.id)
    : Number(b.id) - Number(a.id);
});

    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return sorted.slice(start, end);
    }, [filtered, safePage, pageSize, sort]);

  const rangeLabel = useMemo(() => {
    if (total === 0) return "0";
    const start = (safePage - 1) * pageSize + 1;
    const end = Math.min(total, safePage * pageSize);
    return `${start}–${end} sur ${total}`;
  }, [safePage, pageSize, total]);

  const activeFilterCount = [
    Boolean(search.trim()),
    onlyDrafts,
    onlyUnused,
    onlyNeverViewed,
    onlyTrulyUnused,
  ].filter(Boolean).length;

  const topStats = useMemo(() => {
    const drafts = resources.filter(
      (r: AnyResource) => normalizeStatus(r.status) === "draft"
    ).length;

    const neverDownloaded = resources.filter(
      (r: AnyResource) => getDownloadCount(r) === 0
    ).length;

    const neverViewed = resources.filter(
      (r: AnyResource) => Number((r as any)?.viewCount ?? 0) === 0
    ).length;

    const trulyUnused = resources.filter((r: AnyResource) => {
      const dl = getDownloadCount(r);
      const views = Number((r as any)?.viewCount ?? 0);
      return dl === 0 && views === 0;
    }).length;

    return [
      {
        label: "Ressources",
        value: resources.length,
        hint: "volume total pilotable",
        icon: PackageSearch,
        wrapClassName:
          "border-blue-200/70 bg-blue-50/80 text-blue-700",
      },
      {
        label: "Brouillons",
        value: drafts,
        hint: "contenus à finaliser",
        icon: FileSpreadsheet,
        wrapClassName:
          "border-orange-200/70 bg-orange-50/80 text-orange-700",
      },
      {
        label: "Jamais vues",
        value: neverViewed,
        hint: "aucune consultation",
        icon: EyeOff,
        wrapClassName:
          "border-violet-200/70 bg-violet-50/80 text-violet-700",
      },
      {
        label: "Totalement inutilisées",
        value: trulyUnused,
        hint: "ni vues ni téléchargées",
        icon: Download,
        wrapClassName:
          "border-emerald-200/70 bg-emerald-50/80 text-emerald-700",
      },
      {
        label: "Jamais téléchargées",
        value: neverDownloaded,
        hint: "consultées sans téléchargement",
        icon: ArrowUpDown,
        wrapClassName:
          "border-slate-200/70 bg-slate-50 text-slate-700",
      },
    ];
  }, [resources]);

  async function refresh() {
    await utils.resources.getAllResourcesForAdmin.invalidate();
    await resourcesQuery.refetch();
  }

  async function onCreateTest() {
    try {
      await createTestMutation.mutateAsync();
      await refresh();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la création de la ressource de test (voir console).");
    }
  }

  async function onDeleteOne(id: number, title?: string | null) {
    const safeTitle = String(title ?? "Sans titre").trim() || "Sans titre";

    const confirmed = confirm(
      `⚠️ Suppression définitive\n\nTu es sur le point de supprimer la ressource :\n« ${safeTitle} » (ID ${id})\n\nCette action est irréversible.\n\nConfirmer la suppression ?`
    );

    if (!confirmed) return;

    try {
      await deleteOneMutation.mutateAsync({ id });
      if (openId === id) {
        setOpenId(null);
      }
      await refresh();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la suppression (voir console).");
    }
  }

  function safeIso(v?: any) {
  try {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "" : d.toISOString();
  } catch {
    return "";
  }
}

function formatFr(v?: any) {
  try {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "" : d.toLocaleString("fr-FR");
  } catch {
    return "";
  }
}

function yesNo(v: any) {
  return v ? "oui" : "non";
}

function toJsonLine(obj: any) {
  try {
    return JSON.stringify(obj);
  } catch {
    return JSON.stringify({ error: "serialize_failed" });
  }
}

  function computeExportMeta() {
    const now = new Date();

    return {
      exportedAtIso: now.toISOString(),
      exportedAtFr: now.toLocaleString("fr-FR"),
      filters: {
        search: search.trim(),
        onlyDrafts,
        onlyUnused,
        onlyNeverViewed,
        onlyTrulyUnused,
        pageSize,
        sort,
      },
      counts: {
        totalAll: resources.length,
        totalFiltered: filtered.length,
      },
    };
  }

// ✅ Export traçabilité (audit-proof)
// - export simple en CSV
function onExportTrails() {
  try {
    const meta = computeExportMeta();
    const rows = filtered;

    const header = [
      "ID",
      "Titre",
      "Type",
      "Profils",
      "Collections",
      "Visibilité",
      "Accès",
      "Statut",
      "Téléchargeable",
      "URL",
      "HistoryCount",
      "DernièreAction",
      "DernierActeur",
      "DernièreActionAt (ISO)",
      "DernièreActionAt (FR)",
      "ExportedAt (ISO)",
      "Filtres (search)",
      "Filtres (onlyDrafts)",
      "Filtres (onlyUnused)",
      "Filtres (onlyNeverViewed)",
      "Filtres (onlyTrulyUnused)",
    ];

    const lines: string[] = [header.map(toCsvValue).join(",")];

    rows.forEach((r: AnyResource) => {
      const collections = Array.isArray(r.collections)
        ? r.collections.map((c: any) => c?.name).filter(Boolean).join(" | ")
        : "";

      const profils = Array.isArray(r.profiles) ? r.profiles.join(" | ") : "";

      const url = (r as any)?.fileUrl ?? (r as any)?.url ?? "";
      const downloadable = !!String(url || "").trim();

      const historyCount = Number((r as any)?.historyCount ?? 0);
      const lastAction = String((r as any)?.lastAction ?? "");
      const lastActorName = String((r as any)?.lastActorName ?? "");
      const lastActionAtIso = safeIso((r as any)?.lastActionAt);
      const lastActionAtFr = formatFr((r as any)?.lastActionAt);

              const line = [
          r.id ?? "",
          r.title ?? "",
          r.type ?? "",
          profils,
          collections,
          visibilityLabel(r.visibility),
          accessLabel(r.accessLevel),
          r.status ?? "",
          yesNo(downloadable),
          url,
          isNaN(historyCount) ? 0 : historyCount,
          historyActionLabel(lastAction || ""),
          lastActorName || "",
          lastActionAtIso,
          lastActionAtFr,
          meta.exportedAtIso,
          meta.filters.search,
          yesNo(meta.filters.onlyDrafts),
          yesNo(meta.filters.onlyUnused),
          yesNo(meta.filters.onlyNeverViewed),
          yesNo(meta.filters.onlyTrulyUnused),
        ];
      lines.push(line.map(toCsvValue).join(","));
    });

    const csvContent = lines.join("\n");
    const filename = `ressources-tracabilite-${new Date().toISOString().slice(0, 10)}.csv`;

    downloadTextFile(filename, csvContent, "text/csv;charset=utf-8");
  } catch (e) {
    console.error(e);
    alert("Erreur lors de l'export de traçabilité (voir console).");
  }
}

function openEditModal(r: AnyResource) {
  const id = Number(r.id);
  const currentUrl = normalizeUrl(r.fileUrl ?? r.url ?? "");
  const currentThumb = normalizeUrl(r.thumbnailUrl ?? "");
  const currentThumbKey = String(r.thumbnailKey ?? "");
  const currentAccess = String(r.accessLevel ?? "PUBLIC").toUpperCase() as AccessValue;

  // ✅ Profils actuels de la ressource
  const currentProfiles: ProfileType[] = Array.isArray(r.profiles)
    ? r.profiles.filter(isProfileType)
    : [];

  setEdit({
    id,
    title: String(r.title ?? ""),
    summary: String(r.summary ?? r.description ?? ""),
    url: currentUrl,

    // ✅ Vignette
    thumbnailUrl: currentThumb,
    thumbnailKey: currentThumbKey,

    accessLevel: (currentAccess === "PREMIUM" || currentAccess === "INTERNAL_IFAC"
      ? currentAccess
      : "PUBLIC") as AccessValue,
    status: normalizeStatus(r.status),
    profileTypes: currentProfiles,
  });

  setEditOpen(true);
}

  function closeEditModal() {
    setEditOpen(false);
    setEdit(null);
  }

  async function onSaveEdit() {
    if (!edit) return;

    const title = edit.title.trim();
    if (!title) {
      alert("Le titre est obligatoire.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: edit.id,
        title: title,
        summary: (edit.summary ?? "").trim() || "—",
      

        // ✅ VIGNETTE : URL + KEY (si on a uploadé)
        thumbnailUrl: (edit.thumbnailUrl ?? "").trim()
          ? normalizeUrl(edit.thumbnailUrl)
          : undefined,

        thumbnailKey: (edit.thumbnailKey ?? "").trim()
          ? String(edit.thumbnailKey).trim()
          : undefined,

        accessLevel: edit.accessLevel,
        status: edit.status as any,
      } as any);

      await setProfilesMutation.mutateAsync({
        resourceId: edit.id,
        profileTypes: edit.profileTypes,
      });

      await refresh();
      closeEditModal();
    } catch (e: any) {
      console.error(e);

      // ✅ tRPC : on remonte le message métier serveur si présent
      const serverMessage =
        e?.data?.zodError?.fieldErrors
          ? "Champs invalides : " + JSON.stringify(e.data.zodError.fieldErrors)
          : e?.shape?.message || e?.message || "Erreur lors de l’enregistrement.";

      alert(serverMessage);
    }
  }

  if (resourcesQuery.isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold">Admin · Ressources</h1>
        <p className="mt-4 text-gray-600">Chargement…</p>
      </div>
    );
  }

  if (resourcesQuery.error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold">Admin · Ressources</h1>
        <p className="mt-4 text-red-600">Erreur : {resourcesQuery.error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_26%),linear-gradient(to_bottom,rgba(248,250,252,0.9),rgba(255,255,255,0.98))]" />

            <div className="relative grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:p-8">
              <div className="space-y-5">
                <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Administration · Ressources
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                    Ressources · Vue d’ensemble
                  </h1>

                  <p className="max-w-4xl text-sm leading-7 text-slate-600 md:text-base">
                    Interface centrale pour piloter <span className="font-semibold text-slate-900">une ressource à la fois</span> :
                    consultation, modification rapide, contrôle de l’historique, vérification éditoriale
                    et ouverture du fichier. Pour les changements collectifs, utilise l’espace dédié
                    <span className="font-semibold text-slate-900"> Modifications en masse</span>.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                    Vue d’ensemble = 1 ressource à la fois
                  </span>
                  <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-orange-700">
                    Modifications en masse = plusieurs ressources
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                    Contrôle éditorial
                  </span>
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-violet-700">
                    Historique & traçabilité
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                  {topStats.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className={`rounded-2xl border p-4 shadow-sm ${item.wrapClassName}`}
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {item.label}
                            </p>
                            <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                              {item.value}
                            </div>
                          </div>

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-current/10 bg-white/70">
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>

                        <p className="text-xs leading-5 text-slate-500">
                          {item.hint}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
                <div className="space-y-4">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">
                      Actions rapides
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Les deux entrées les plus utiles pour naviguer dans l’administration des ressources.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <Link
                      href="/admin/access-levels"
                      className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-orange-700"
                      title="Ouvrir l’outil de modifications en masse"
                    >
                      Modifications en masse
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
                      Cette vue sert au <span className="font-medium text-slate-800">pilotage fin</span> :
                      ouvrir une ressource, contrôler son statut, son accès, sa lecture, sa traçabilité et agir rapidement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* MODAL EDIT */}
      {editOpen && edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Modifier la ressource</div>
                <div className="text-sm text-gray-600">ID: {edit.id}</div>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <label className="grid gap-1">
                <span className="text-sm text-gray-700">Titre *</span>
                <input
                  className="rounded-lg border px-3 py-2"
                  value={edit.title}
                  onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-gray-700">Description</span>
                <textarea
                  className="min-h-[120px] rounded-lg border px-3 py-2"
                  value={edit.summary}
                  onChange={(e) => setEdit({ ...edit, summary: e.target.value })}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-gray-700">URL (facultatif)</span>
                <input
                  className="rounded-lg border px-3 py-2"
                  value={edit.url}
                  onChange={(e) => setEdit({ ...edit, url: e.target.value })}
                  placeholder="https://..."
                />
              </label>

 <label className="grid gap-1">
  <span className="text-sm text-gray-700">URL vignette (facultatif)</span>
  <input
    className="rounded-lg border px-3 py-2"
    value={edit.thumbnailUrl}
    onChange={(e) =>
      setEdit({ ...edit, thumbnailUrl: e.target.value, thumbnailKey: "" })
    }
    placeholder="https://..."
  />

  <div className="mt-2 flex flex-wrap items-center gap-3">
    <label className="inline-flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
  Choisir une image…
  <input
    type="file"
    accept="image/*"
    className="hidden"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        // ✅ MODE LOCAL : pas d’upload serveur
        // On stocke l’image en dataURL directement, ça marche sans storagePut.
        const dataUrl: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result ?? ""));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        setEdit({
          ...edit,
          thumbnailUrl: dataUrl,
          thumbnailKey: "", // pas de storageKey en local
        });
      } catch (err) {
        console.error(err);
        alert("Lecture de l'image échouée (voir console).");
      } finally {
        if (e.currentTarget) e.currentTarget.value = "";
      }
    }}
  />
</label>

    <span className="text-xs text-gray-500">
      {edit.thumbnailUrl?.trim() ? "Image sélectionnée" : "Aucun fichier choisi"}
    </span>

    {uploadThumbnailMutation.isPending && (
      <span className="text-xs text-gray-500">Upload en cours…</span>
    )}
  </div>

  <div className="mt-2 flex items-center gap-3">
    {edit.thumbnailUrl?.trim() ? (
      <img
        src={normalizeUrl(edit.thumbnailUrl)}
        alt="Aperçu vignette"
        className="h-16 w-16 rounded-md object-cover border"
      />
    ) : (
      <div className="h-16 w-16 rounded-md bg-gray-200 border" />
    )}

    <div className="text-xs text-gray-500">
      Aperçu de la vignette. {edit.thumbnailKey?.trim() ? `Key: ${edit.thumbnailKey}` : ""}
    </div>
  </div>
</label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm text-gray-700">Accès</span>
                  <select
                    className="rounded-lg border px-3 py-2"
                    value={edit.accessLevel}
                    onChange={(e) => setEdit({ ...edit, accessLevel: e.target.value as AccessValue })}
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="INTERNAL_IFAC">Connectés</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-sm text-gray-700">Statut</span>
                 <select
  className="rounded-lg border px-3 py-2"
  value={edit.status}
  onChange={(e) => setEdit({ ...edit, status: e.target.value as StatusValue })}
>
  {(() => {
    const allowed = new Set(allowedNextStatuses(edit.status));
    return (
      <>
        <option value="draft" disabled={!allowed.has("draft")}>
          Brouillon
        </option>
        <option value="pending" disabled={!allowed.has("pending")}>
          En attente
        </option>
        <option value="approved" disabled={!allowed.has("approved")}>
          Publiée
        </option>
        <option value="rejected" disabled={!allowed.has("rejected")}>
          Rejetée
        </option>
      </>
    );
  })()}
</select>

                </label>
              </div>
            </div>
<label className="grid gap-1">
  <span className="text-sm text-gray-700">Profils</span>

  <div className="grid gap-2 rounded-lg border p-3">
    {(["animateur", "directeur", "stagiaire_bafa", "formateur"] as const).map((p) => {
      const checked = edit.profileTypes.includes(p);
      const label =
        p === "stagiaire_bafa" ? "Stagiaire BAFA" : p.charAt(0).toUpperCase() + p.slice(1);

      return (
        <label key={p} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              const next = e.target.checked
                ? Array.from(new Set([...edit.profileTypes, p]))
                : edit.profileTypes.filter((x) => x !== p);

              setEdit({ ...edit, profileTypes: next });
            }}
          />
          <span>{label}</span>
        </label>
      );
    })}
  </div>

  <div className="text-xs text-gray-500">Tu peux cocher plusieurs profils.</div>
</label>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" className="rounded-lg border px-4 py-2 hover:bg-gray-50" onClick={closeEditModal}>
                Annuler
              </button>

              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                onClick={onSaveEdit}
                disabled={updateMutation.isPending}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                    onClick={() => navigate("/admin/ressources/nouvelle")}
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </button>

                  <button
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    onClick={onCreateTest}
                    disabled={createTestMutation.isPending}
                    type="button"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Créer une ressource de test
                  </button>

                  <button
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => {
                      void onExportTrails();
                    }}
                    type="button"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export traçabilité (CSV)
                  </button>

                  <button
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    type="button"
                    onClick={() => {
                      navigate("/admin/resources-management");
                      setSearch("");
                      setOnlyDrafts(false);
                      setOnlyUnused(false);
                      setOnlyNeverViewed(false);
                      setOnlyTrulyUnused(false);
                      setSort({ key: "download", dir: "desc" });
                      setPage(1);
                    }}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    Top téléchargements
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                      onlyDrafts
                        ? "border-orange-200 bg-orange-50 text-orange-700"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                    onClick={() => {
                      setOnlyDrafts(!onlyDrafts);
                      setPage(1);
                    }}
                  >
                    Brouillons
                  </button>

                  <button
                    type="button"
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                      onlyUnused
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                    onClick={() => {
                      setOnlyUnused(!onlyUnused);
                      setOnlyNeverViewed(false);
                      setOnlyTrulyUnused(false);
                      setPage(1);
                    }}
                  >
                    Jamais téléchargées
                  </button>

                  <button
                    type="button"
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                      onlyNeverViewed
                        ? "border-violet-200 bg-violet-50 text-violet-700"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                    onClick={() => {
                      setOnlyNeverViewed(!onlyNeverViewed);
                      setOnlyUnused(false);
                      setOnlyTrulyUnused(false);
                      setPage(1);
                    }}
                  >
                    Jamais vues
                  </button>

                  <button
                    type="button"
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                      onlyTrulyUnused
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                    onClick={() => {
                      setOnlyTrulyUnused(!onlyTrulyUnused);
                      setOnlyUnused(false);
                      setOnlyNeverViewed(false);
                      setPage(1);
                    }}
                  >
                    Totalement inutilisées
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                    {total} ressource{total > 1 ? "s" : ""} après filtrage
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                    {activeFilterCount} filtre{activeFilterCount > 1 ? "s" : ""} actif{activeFilterCount > 1 ? "s" : ""}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                    Tri actuel : {sort.key === "download" ? "téléchargements" : sort.key === "title" ? "titre" : "ID"} · {sort.dir === "asc" ? "croissant" : "décroissant"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
                    placeholder="Rechercher (titre, type, profil, collection...)"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Utilisation recommandée
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Utilise la recherche pour isoler une ressource précise, puis ouvre sa ligne pour
                    consulter les détails, l’historique ou lancer une édition rapide.
                  </p>
                </div>
              </div>
            </div>
          </section>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Ressources</h2>
            <p className="mt-1 text-sm text-slate-500">
              Vue liste, consultation rapide et contrôle éditorial.
            </p>
          </div>

          <div className="text-sm font-medium text-slate-600">{rangeLabel}</div>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Par page :</span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5"
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
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              type="button"
            >
              ← Précédent
            </button>

            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600">
              Page {safePage} / {totalPages}
            </span>

            <button
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              type="button"
            >
              Suivant →
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full border-separate border-spacing-y-2 text-sm">
            <thead className="sticky top-0 z-10 bg-white text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <tr className="text-left text-sm text-slate-600">
                <th className="px-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:underline"
                    onClick={() => {
                      setSort((s) =>
                        s.key === "title"
                          ? { key: "title", dir: s.dir === "asc" ? "desc" : "asc" }
                          : { key: "title", dir: "asc" }
                      );
                      setPage(1);
                    }}
                    title="Trier par titre"
                  >
                    Titre
                    <span className="text-xs text-gray-400">
                      {sort.key === "title" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                    </span>
                  </button>
                </th>

                <th className="px-3">Type</th>
                <th className="px-3">Profils</th>
                <th className="px-3">Collections</th>
                <th className="px-3">Visibilité</th>
                <th className="px-3">Accès</th>
                <th className="px-3">Lecture</th>
                <th className="px-3">Statut</th>
                <th className="px-3">Hist.</th>
                <th className="px-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:underline"
                    onClick={() => {
                      setSort((s) =>
                        s.key === "download"
                          ? { key: "download", dir: s.dir === "asc" ? "desc" : "asc" }
                          : { key: "download", dir: "desc" }
                      );
                      setPage(1);
                    }}
                    title="Trier par téléchargements"
                  >
                    DL
                    <span className="text-xs text-gray-400">
                      {sort.key === "download" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                    </span>
                  </button>
                </th>
                <th className="px-3">Tél</th>
                <th className="px-3">Dernière action</th>
                <th className="px-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((r: AnyResource) => {
const id = Number(r.id);

// ✅ logique PRO : vrai fichier si storageKey OU fileUrl/url non vide
const hasFile =
  Boolean((r as any)?.storageKey) ||
  Boolean(String(r.fileUrl ?? r.url ?? "").trim());


                const collections = Array.isArray(r.collections) ? r.collections : [];
                const collectionsLabel =
                  collections.length > 0 ? collections.map((c: any) => c?.name).filter(Boolean).join(", ") : "—";

                const profilsLabel =
  Array.isArray(r.profiles) && r.profiles.length > 0
    ? r.profiles
        .map((p: string) => (p === "stagiaire_bafa" ? "Stagiaire BAFA" : p))
        .join(", ")
    : "—";

                const isOpen = openId === id;

                return (
                  <React.Fragment key={id}>
                    <tr
  ref={isOpen ? openRowRef : null}
  className="bg-white align-top transition hover:bg-slate-50/80 shadow-sm rounded-xl border border-slate-200"
>
                      <td className="px-3 py-4">
  <button
  type="button"
  className="text-left transition hover:opacity-90"
  onClick={() => {
    const next = isOpen ? null : id;
    setOpenId(next);
    setOpenTab("details"); // reset onglet à l’ouverture
  }}
  title="Voir les détails"
>

<div className="flex items-center gap-3">
<div className="h-10 w-10 rounded-md border overflow-hidden bg-gray-100 flex items-center justify-center">
  {(() => {
    const src = getAdminThumbnailSrc(r);

    if (!src) {
      return <div className="text-[10px] text-gray-400">IMG</div>;
    }

    return (
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        onError={(e) => {
          const img = e.currentTarget;

          if (img.dataset.fallbackApplied === "2") {
            img.style.display = "none";
            const parent = img.parentElement;
            if (parent && !parent.querySelector('[data-thumb-placeholder="1"]')) {
              const ph = document.createElement("div");
              ph.setAttribute("data-thumb-placeholder", "1");
              ph.className = "text-[10px] text-gray-400";
              ph.textContent = "IMG";
              parent.appendChild(ph);
            }
            return;
          }

          if (img.dataset.fallbackApplied !== "1") {
            img.dataset.fallbackApplied = "1";

            const fileFallback = normalizeUrl(r.fileUrl ?? r.url ?? "");
            if (
              fileFallback &&
              fileFallback.startsWith("/imported/") &&
              fileFallback.toLowerCase().endsWith(".pdf")
            ) {
              img.dataset.fallbackApplied = "2";
              img.src = fileFallback
                .replace("/imported/", "/imported_thumbs/")
                .replace(/\.pdf$/i, ".png");
              return;
            }
          }

          img.dataset.fallbackApplied = "2";
          img.style.display = "none";
        }}
      />
    );
  })()}
</div>

  <div className="font-semibold text-slate-900 leading-tight hover:underline text-[15px]">
  {r.title ?? "Sans titre"}
</div>
</div>

    <div className="text-[11px] text-slate-400 mt-0.5">ID {id}</div>
  </button>
</td>

                      <td className="px-3 py-3">
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-sm">{r.type ?? "—"}</span>
                      </td>

                      <td className="px-3 py-3">
                        <span className="rounded-md bg-blue-50 px-2 py-1 text-sm">{profilsLabel}</span>
                      </td>

                      <td className="px-3 py-3">
                        <span className="rounded-md bg-green-50 px-2 py-1 text-sm">{collectionsLabel}</span>
                      </td>

                      <td className="px-3 py-3">
  <span className={`rounded-md px-2 py-1 text-sm ${visibilityBadgeClass(r.visibility)}`}>
    {visibilityLabel(r.visibility)}
  </span>
</td>


                      <td className="px-3 py-3">
                        <span className="rounded-md bg-orange-50 px-2 py-1 text-sm">{accessLabel(r.accessLevel)}</span>
                      </td>

<td className="px-3 py-3">
  {(() => {
    const label = readingLabel({ visibility: r.visibility, accessLevel: r.accessLevel });
    const cls = readingBadgeClass(label);
    return <span className={`rounded-md px-2 py-1 text-sm ${cls}`}>{label}</span>;
  })()}
</td>

                      <td className="px-3 py-3">
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(
      normalizeStatus(r.status)
    )}`}
  >
    {STATUS_LABELS[normalizeStatus(r.status)]}
  </span>
</td>

<td className="px-3 py-3">
  {(() => {
    const count = (r as any)?.historyCount ?? 0;

    let cls = "bg-gray-100 text-gray-700";
    if (count >= 10) cls = "bg-red-100 text-red-800";
    else if (count >= 5) cls = "bg-orange-100 text-orange-800";
    else if (count >= 1) cls = "bg-blue-100 text-blue-800";

    return (
      <span
        className={`inline-flex min-w-[32px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}
      >
        {count}
      </span>
    );
  })()}
</td>

<td className="px-3 py-3">
  {(() => {
    const dl = getDownloadCount(r);

    let cls = "bg-gray-100 text-gray-700";
    if (dl >= 50) cls = "bg-green-100 text-green-800";
    else if (dl >= 10) cls = "bg-blue-100 text-blue-800";
    else if (dl >= 1) cls = "bg-orange-100 text-orange-800";

    return (
      <span
        className={`inline-flex min-w-[32px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}
      >
        {dl}
      </span>
    );
  })()}
</td>
<td className="px-3 py-3">
  <span
    className={`inline-flex min-w-[40px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${
      hasFile ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
    }`}
  >
    {hasFile ? "oui" : "non"}
  </span>
</td>

<td className="px-3 py-3">
  {(() => {
    const when = r.lastActionAt ? new Date(r.lastActionAt).toLocaleString("fr-FR") : "—";
    const who = r.lastActorName ? String(r.lastActorName) : "—";
    const act = r.lastAction ? String(r.lastAction) : "—";

    const actLabel = historyActionLabel(act);

    return (
      <div className="text-sm">
        <div className="font-medium">{actLabel}</div>
        <div className="text-xs text-gray-500">
          {who} · {when}
        </div>
      </div>
    );
  })()}
</td>

                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-2">
 <button
  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
  onClick={() => {
    const next = isOpen ? null : id;
    setOpenId(next);
    setOpenTab("details");
  }}
  type="button"
  title="Voir détails"
>
  Voir
</button>

                          <button
  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
  onClick={() => {
  setOpenId(id);
  setOpenTab("details");
  openEditModal(r);
}}
  type="button"
  title="Modifier (édition rapide)"
>
  ✏️
</button>
                          <button
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                            onClick={() => onDeleteOne(id, r.title)}
                            type="button"
                            title="Supprimer"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>

 {isOpen && (
  <>
    <tr>
      <td colSpan={13} className="px-4 pb-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-3">
            <div className="font-semibold text-slate-800">
              Ressource #{id}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`rounded-md border px-3 py-1 text-sm ${
                  openTab === "details" ? "bg-white" : "bg-transparent hover:bg-white/60"
                }`}
                onClick={() => setOpenTab("details")}
              >
                Détails
              </button>

              <button
                type="button"
                className={`rounded-md border px-3 py-1 text-sm ${
                  openTab === "history" ? "bg-white" : "bg-transparent hover:bg-white/60"
                }`}
                onClick={() => setOpenTab("history")}
              >
                Historique
              </button>
            </div>
          </div>

          {openTab === "details" ? (
            <div className="mt-3 text-sm space-y-3">
              <div>
                <div className="text-gray-600">Description :</div>
                <div>{(r.summary ?? r.description ?? "—") as string}</div>
              </div>

              <div>
                <div className="text-gray-600">Profils :</div>
                <div>
                  {Array.isArray(r.profiles) && r.profiles.length > 0
                    ? r.profiles
                        .map((p: string) =>
                          p === "stagiaire_bafa"
                            ? "Stagiaire BAFA"
                            : p.charAt(0).toUpperCase() + p.slice(1)
                        )
                        .join(", ")
                    : "—"}
                </div>
              </div>

              <div>
                <div className="text-gray-600">Fichier :</div>
                <div>
                  {hasFile ? (
                    <a
                      href={`/api/resources/download/${id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 text-sm"
                    >
                      📄 Ouvrir le fichier
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">
                      Aucun fichier associé
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 text-sm">
              {historyQuery.isLoading ? (
                <div className="text-gray-600">Chargement…</div>
              ) : historyQuery.error ? (
                <div className="text-red-600">
                  Erreur : {historyQuery.error.message}
                </div>
              ) : (historyQuery.data ?? []).length === 0 ? (
                <div className="text-gray-600">
                  Aucun historique.
                </div>
              ) : (
                <div className="space-y-2">
                  {[...(historyQuery.data ?? [])]
                    .sort((a, b) => {
                      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
                      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
                      return tb - ta;
                    })
                    .map((h: any) => {
                      const when = h?.createdAt
                        ? new Date(h.createdAt).toLocaleString("fr-FR")
                        : "—";

                      const who =
                        h?.userName ??
                        h?.actorName ??
                        h?.lastActorName ??
                        (h?.userId ? `User#${h.userId}` : "—");

                      const label = historyActionLabel(String(h?.action ?? ""));

                      return (
                        <div key={h.id} className="rounded-md border p-2">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{label}</span>
                            <span>{when}</span>
                          </div>

                          <div className="text-xs text-gray-600">
                            Par : {who}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

        </div>
      </td>
    </tr>
  </>
)}

                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  );
}
