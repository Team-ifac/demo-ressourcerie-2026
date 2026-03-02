import React, { useEffect, useMemo, useState } from "react";
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

export default function AdminResourcesManagement() {
  const [, navigate] = useLocation();

  const [search, setSearch] = useState("");
  const [onlyDrafts, setOnlyDrafts] = useState(false);
  const [onlyImports, setOnlyImports] = useState(false);

  const [openId, setOpenId] = useState<number | null>(null);

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
  const [sort, setSort] = useState<{ key: "id" | "title"; dir: "asc" | "desc" }>({
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

  const createTestMutation = trpc.resources.create.useMutation();

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
    // ✅ filtre "Imports"
    if (onlyImports) {
      const s = String(r.summary ?? "").toLowerCase();
      if (!s.startsWith("import (option b)")) return false;
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
      collections.includes(q) ||
      profils.includes(q)
    );
  });
}, [resources, search, onlyDrafts, onlyImports]);

    const total = filtered.length;

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  // Si la recherche réduit la liste, on évite d’être sur une page vide
  const safePage = Math.min(page, totalPages);

    const paginated = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
  if (sort.key === "title") {
    const at = String(a.title ?? "").toLowerCase();
    const bt = String(b.title ?? "").toLowerCase();
    const cmp = at.localeCompare(bt, "fr");
    return sort.dir === "asc" ? cmp : -cmp;
  }
  // default: id
  return sort.dir === "asc" ? Number(a.id) - Number(b.id) : Number(b.id) - Number(a.id);
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


  async function refresh() {
    await utils.resources.getAllResourcesForAdmin.invalidate();
    await resourcesQuery.refetch();
  }

  async function onCreateTest() {
    try {
      const now = new Date();
      const title = `Ressource test (${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)})`;

      await createTestMutation.mutateAsync({
        title,
        summary: "Exemple créé en 1 clic pour la démo admin.",
        content: "Exemple créé en 1 clic pour la démo admin.",
        type: "document",
        visibility: "INTERNAL_IFAC",
        themeIds: [],
        status: "draft",
      });

      await refresh();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la création de la ressource de test (voir console).");
    }
  }

  async function onDeleteOne(id: number) {
    if (!confirm(`Supprimer la ressource ID ${id} ?`)) return;
    try {
      await deleteOneMutation.mutateAsync({ id });
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
      onlyImports,
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
// - CSV lisible (humain)
// - JSONL (1 ligne = 1 ressource) (machine / archive / audit)
function onExportTrails() {
  const meta = computeExportMeta();

  const rows = filtered;

  // =========================
  // CSV (lisible)
  // =========================
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
    "Filtres (onlyImports)",
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
      yesNo(meta.filters.onlyImports),
    ];

    lines.push(line.map(toCsvValue).join(","));
  });

  const csvContent = lines.join("\n");
  const csvFilename = `ressources-tracabilite-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadTextFile(csvFilename, csvContent, "text/csv;charset=utf-8");

  // =========================
  // JSONL (archive / audit)
  // =========================
  // 1 ligne = 1 record (facile à ingérer et versionner)
  const jsonlLines: string[] = [];

  // Meta en 1ère ligne (type=meta)
  jsonlLines.push(
    toJsonLine({
      type: "meta",
      ...meta,
    })
  );

  // Chaque ressource (type=resource)
  rows.forEach((r: AnyResource) => {
    const payload = {
      type: "resource",
      exportedAtIso: meta.exportedAtIso,

      // Identité
      id: r.id,
      title: r.title ?? null,
      resourceType: r.type ?? null,

      // Gouvernance
      visibility: r.visibility ?? null,
      accessLevel: r.accessLevel ?? null,
      status: r.status ?? null,
      profiles: Array.isArray(r.profiles) ? r.profiles : [],
      collections: Array.isArray(r.collections)
        ? r.collections.map((c: any) => c?.name).filter(Boolean)
        : [],

      // Fichier (info admin, pas de sécurité)
      url: (r as any)?.url ?? null,
      fileUrl: (r as any)?.fileUrl ?? null,
      thumbnailUrl: (r as any)?.thumbnailUrl ?? null,
      thumbnailKey: (r as any)?.thumbnailKey ?? null,
      storageKey: (r as any)?.storageKey ?? null,

      // Audit liste
      historyCount: (r as any)?.historyCount ?? 0,
      lastAction: (r as any)?.lastAction ?? null,
      lastActionLabel: historyActionLabel(String((r as any)?.lastAction ?? "")),
      lastActorName: (r as any)?.lastActorName ?? null,
      lastActionAtIso: safeIso((r as any)?.lastActionAt),

      // Contexte export (filtres)
      filters: meta.filters,
    };

    jsonlLines.push(toJsonLine(payload));
  });

  const jsonlContent = jsonlLines.join("\n");
  const jsonlFilename = `ressources-tracabilite-${new Date().toISOString().slice(0, 10)}.jsonl`;
  downloadTextFile(jsonlFilename, jsonlContent, "application/json;charset=utf-8");
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
    <div className="p-6">
      <div className="rounded-xl border bg-blue-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ressources · Vue d’ensemble</h1>
            <p className="mt-1 text-gray-700">
              Ici, tu gères <span className="font-medium">une ressource à la fois</span> (voir, modifier, ouvrir la page complète).
              Pour changer <span className="font-medium">plusieurs ressources d’un coup</span>, utilise “Modifications en masse”.
            </p>

            {/* Mini légende */}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md bg-blue-600 px-2 py-1 text-white">
                🔵 Vue d’ensemble = 1 ressource à la fois
              </span>
              <span className="rounded-md bg-orange-600 px-2 py-1 text-white">
                🟠 Modifications en masse = plusieurs ressources
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/access-levels"
              className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
              title="Ouvrir l’outil de modifications en masse"
            >
              🟠 Modifications en masse
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50"
              title="Retour au tableau de bord admin"
            >
              Retour admin
            </Link>
          </div>
        </div>
      </div>

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
                className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
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

      <div className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
  onClick={() => navigate("/admin/ressources/nouvelle")}
  type="button"
>
  + Ajouter
</button>

            <button
              className="rounded-lg border px-4 py-2 hover:bg-gray-50"
              onClick={onCreateTest}
              disabled={createTestMutation.isPending}
              type="button"
            >
              Créer une ressource de test
            </button>

          <button className="rounded-lg border px-4 py-2 hover:bg-gray-50" onClick={onExportTrails} type="button">
            Export traçabilité (CSV + JSONL)
          </button>
          </div>

          <div className="mb-3 flex items-center gap-6 text-sm">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={onlyImports}
      onChange={(e) => {
        setOnlyImports(e.target.checked);
        setPage(1);
      }}
    />
    <span>Imports Option B</span>
  </label>

  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={onlyDrafts}
      onChange={(e) => {
        setOnlyDrafts(e.target.checked);
        setPage(1);
      }}
    />
    <span>Brouillons</span>
  </label>
</div>

          <input
            className="w-full rounded-lg border px-3 py-2 md:w-[420px]"
            placeholder="Rechercher (titre, type, profil, collection...)"
            value={search}
            onChange={(e) => {
  setSearch(e.target.value);
  setPage(1);
}}
          />
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Ressources</h2>
          <div className="text-sm text-gray-600">{rangeLabel}</div>
        </div>

        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <span>Par page :</span>
    <select
      className="rounded-md border px-2 py-1"
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
      className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
      onClick={() => setPage((p) => Math.max(1, p - 1))}
      disabled={safePage <= 1}
      type="button"
    >
      ← Précédent
    </button>

    <span className="text-sm text-gray-600">
      Page {safePage} / {totalPages}
    </span>

    <button
      className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
      onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
      disabled={safePage >= totalPages}
      type="button"
    >
      Suivant →
    </button>
  </div>
</div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="px-3">
  <button
    type="button"
    className="inline-flex items-center gap-1 hover:underline"
    onClick={() =>
      setSort((s) =>
        s.key === "title"
          ? { key: "title", dir: s.dir === "asc" ? "desc" : "asc" }
          : { key: "title", dir: "asc" }
      )
    }
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
                    <tr className="rounded-lg border bg-white shadow-sm">
                      <td className="px-3 py-3">
  <button
  type="button"
  className="text-left"
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
    const thumbnailUrl = r.thumbnailUrl;
    const fileUrl = r.fileUrl;

    let src = "";

    // 1) thumbnailUrl prioritaire
    if (typeof thumbnailUrl === "string" && thumbnailUrl.trim() !== "") {
      if (thumbnailUrl.startsWith("data:image/")) {
        src = thumbnailUrl;
      } else if (
        thumbnailUrl.startsWith("http://") ||
        thumbnailUrl.startsWith("https://") ||
        thumbnailUrl.startsWith("/imported_thumbs/")
      ) {
        src = thumbnailUrl;
      } else if (
        thumbnailUrl.startsWith("/imported/") &&
        thumbnailUrl.toLowerCase().endsWith(".pdf")
      ) {
        src = thumbnailUrl
          .replace("/imported/", "/imported_thumbs/")
          .replace(/\.pdf$/i, ".png");
      }
    }

    // 2) fallback pdf -> png via fileUrl
    if (!src && typeof fileUrl === "string") {
      if (fileUrl.startsWith("/imported/") && fileUrl.toLowerCase().endsWith(".pdf")) {
        src = fileUrl
          .replace("/imported/", "/imported_thumbs/")
          .replace(/\.pdf$/i, ".png");
      }
    }

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

          // Déjà tenté une alternative -> placeholder neutre (plus de logo ifac)
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

          // 1er échec -> on tente une URL "slugifiée" (dossiers/fichier)
          if (img.dataset.fallbackApplied !== "1") {
            img.dataset.fallbackApplied = "1";

            const slugify = (s: string) =>
              s
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .toLowerCase();

            try {
              const raw = decodeURIComponent(img.src);
              const u = new URL(raw, window.location.origin);

              // si ce n’est pas /imported_thumbs/... on ne tente rien
              if (!u.pathname.startsWith("/imported_thumbs/")) {
                img.dataset.fallbackApplied = "2";
                img.style.display = "none";
                return;
              }

              // slugifier chaque segment (sauf le préfixe vide)
              const parts = u.pathname.split("/").filter(Boolean);
              const slugged = parts.map((p) => slugify(p));

              // on reconstruit une URL candidate
              const candidatePath = "/" + slugged.join("/");
              const candidate = candidatePath + (u.search || "") + (u.hash || "");

              img.dataset.fallbackApplied = "2";
              img.src = candidate;
              return;
            } catch {
              img.dataset.fallbackApplied = "2";
              img.style.display = "none";
              return;
            }
          }

          // sécurité
          img.dataset.fallbackApplied = "2";
          img.style.display = "none";
        }}
      />
    );
  })()}
</div>

  <div className="font-medium hover:underline">{r.title ?? "Sans titre"}</div>
</div>

    <div className="text-xs text-gray-500">ID: {id}</div>
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
  className={`rounded-md px-2 py-1 text-sm ${statusBadgeClass(normalizeStatus(r.status))}`}
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
      <span className={`rounded-md px-2 py-1 text-sm ${cls}`}>
        {count}
      </span>
    );
  })()}
</td>

<td className="px-3 py-3">
  <span className="rounded-md bg-gray-100 px-2 py-1 text-sm">
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
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
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
  className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
  onClick={() => openEditModal(r)}
  type="button"
  title="Modifier (édition rapide)"
>
  ✏️
</button>
                          <button
                            className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
                            onClick={() => onDeleteOne(id)}
                            type="button"
                            title="Supprimer"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isOpen && (
  <tr>
    <td colSpan={12} className="px-3 pb-4">
      <div className="rounded-lg border bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold">Ressource #{id}</div>

          {/* Onglets */}
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

        {/* CONTENU */}
        {openTab === "details" ? (
          <div className="mt-3 text-sm">
            <div className="text-gray-600">Description :</div>
            <div className="mt-1">{(r.summary ?? r.description ?? "—") as string}</div>

            <div className="mt-3 text-gray-600">Profils :</div>
            <div className="mt-1">
              {Array.isArray(r.profiles) && r.profiles.length > 0 ? r.profiles.join(", ") : "—"}
            </div>

            <div className="mt-3 text-gray-600">Fichier :</div>
            <div className="mt-1">
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
                <span className="text-gray-400 text-sm">Aucun fichier associé</span>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3">
  {(() => {
    const raw = ([...(historyQuery.data ?? [])] as any[]).sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta; // ✅ plus récent d’abord
    });

    const prettyChanges = (v: any) => {
      if (v === null || v === undefined) return "";
      if (typeof v === "string") {
        // Si c’est déjà une string JSON, on tente de la “jolifier”
        try {
          const parsed = JSON.parse(v);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return v;
        }
      }
      try {
        return JSON.stringify(v, null, 2);
      } catch {
        return String(v);
      }
    };

    const actionLabel = (a: string) => historyActionLabel(a);

    // ✅ Actions réellement présentes (auto)
    const actionOptions = Array.from(
      new Set(raw.map((h) => String(h?.action ?? "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "fr"));

    // ✅ Filtrage (action + texte)
    const q = historyText.trim().toLowerCase();

    const filteredHistory = raw.filter((h) => {
      const action = String(h?.action ?? "").trim();
      if (historyAction !== "ALL" && action !== historyAction) return false;

      if (!q) return true;

      const when = h?.createdAt ? new Date(h.createdAt).toLocaleString("fr-FR") : "";
      const who = h?.userName ? String(h.userName) : h?.userId ? `User#${h.userId}` : "";
      const changes = prettyChanges(h?.changes);

      const hay = `${action} ${actionLabel(action)} ${who} ${when} ${changes}`.toLowerCase();
      return hay.includes(q);
    });

    return (
      <>
        {/* ✅ Filtres Historique (audit-proof) */}
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <label className="text-xs text-gray-600">Type d’action</label>
            <select
              className="rounded-md border px-2 py-1 text-sm"
              value={historyAction}
              onChange={(e) => setHistoryAction(e.target.value)}
            >
              <option value="ALL">Toutes</option>
              {actionOptions.map((a) => (
                <option key={a} value={a}>
                  {actionLabel(a)} ({a})
                </option>
              ))}
            </select>
          </div>

          <input
            className="w-full rounded-md border px-3 py-2 text-sm md:w-[420px]"
            placeholder="Rechercher (action, acteur, date, contenu)…"
            value={historyText}
            onChange={(e) => setHistoryText(e.target.value)}
          />
        </div>

        {historyQuery.isLoading ? (
          <div className="text-sm text-gray-600">Chargement de l’historique…</div>
        ) : historyQuery.error ? (
          <div className="text-sm text-red-600">Erreur historique : {historyQuery.error.message}</div>
        ) : raw.length === 0 ? (
          <div className="text-sm text-gray-600">Aucune entrée d’historique pour cette ressource.</div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-sm text-gray-600">Aucun résultat avec ces filtres.</div>
        ) : (
          <div className="grid gap-2">
            {filteredHistory.map((h: any) => {
              const action = String(h?.action ?? "").trim();
              const when = h?.createdAt ? new Date(h.createdAt).toLocaleString("fr-FR") : "—";
              const who =
              h?.userName ??
              h?.actorName ??
              h?.lastActorName ??
              (h?.actor?.name ? String(h.actor.name) : null) ??
              (h?.userId ? `User#${h.userId}` : "—");
              const changes = prettyChanges(h?.changes);

              // ✅ Interprétation "métier" (audit-proof)
              const rawAction = String(h?.action ?? "").trim();
              const label = actionLabel(rawAction);

              const changesStrRaw = typeof h?.changes === "string" ? h.changes : "";
              const changesStr = changesStrRaw.trim();

              // On exploite changesJson si le backend l'a fourni (sinon null)
              const cj = (h as any)?.changesJson ?? null;

              // Helpers UI
              const pillClass = (() => {
                if (rawAction === "STATUS_CHANGE") return "bg-orange-50 text-orange-800";
                if (rawAction === "DELETE_RESOURCE") return "bg-red-50 text-red-800";
                if (/profil/i.test(changesStr)) return "bg-blue-50 text-blue-800";
                if (/acc[eè]s|access/i.test(changesStr)) return "bg-purple-50 text-purple-800";
                return "bg-gray-100 text-gray-800";
              })();

              // On construit une “headline” + une liste de points lisibles
              let headline = label;
              const bullets: string[] = [];

              // 1) Changement de statut (log JSON canonique côté server/db.ts)
              if (rawAction === "STATUS_CHANGE" && cj && typeof cj === "object") {
                const from = String((cj as any)?.from ?? "").trim();
                const to = String((cj as any)?.to ?? "").trim();

                if (from && to) {
                  headline = "Changement de statut";
                  const fromLabel = STATUS_LABELS[normalizeStatus(from as any)];
                  const toLabel = STATUS_LABELS[normalizeStatus(to as any)];
                  bullets.push(`Statut : ${fromLabel} → ${toLabel}`);
                }
              }

              // 2) Profils mis à jour (log setProfiles)
              if (bullets.length === 0 && /profils\s+mis\s+à\s+jour/i.test(changesStr)) {
                headline = "Profils mis à jour";
                const afterColon = changesStr.split(":")[1]?.trim();
                if (afterColon) bullets.push(`Profils : ${afterColon}`);
                else bullets.push(changesStr);
              }

              // 3) Suppression ressource (log DELETE_RESOURCE avec snapshot JSON)
              if (bullets.length === 0 && rawAction === "DELETE_RESOURCE") {
                headline = "Suppression de la ressource";
                if (cj && typeof cj === "object") {
                  const t = (cj as any)?.title ? String((cj as any).title) : "";
                  const al = (cj as any)?.accessLevel ? String((cj as any).accessLevel) : "";
                  const st = (cj as any)?.status ? String((cj as any).status) : "";
                  if (t) bullets.push(`Titre : ${t}`);
                  if (al) bullets.push(`Accès : ${al}`);
                  if (st) bullets.push(`Statut : ${st}`);
                } else if (changesStr) {
                  bullets.push(changesStr);
                }
              }

              // 4) “updated” générique (ex: "titre modifié, résumé modifié, accès modifié...")
              if (bullets.length === 0 && changesStr) {
                // Cas connu : liste séparée par virgules
                const parts = changesStr
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean);

                // Si ça ressemble à une liste, on la met en bullets
                if (parts.length >= 2) {
                  headline = "Modification";
                  parts.forEach((p: string) => bullets.push(p));
                } else {
                  // Sinon, on laisse une seule ligne
                  bullets.push(changesStr);
                }
              }

              // 5) Fallback brut (si rien du tout)
              const fallbackPretty = prettyChanges(h?.changes);

              return (
                <div key={h.id} className="rounded-lg border bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md px-2 py-1 text-xs ${pillClass}`}>
                        {headline}
                      </span>
                      <span className="text-xs text-gray-500">({rawAction || "—"})</span>
                    </div>

                    <div className="text-xs text-gray-500">{when}</div>
                  </div>

                  <div className="mt-1 text-xs text-gray-600">Par : {who}</div>

                  {bullets.length > 0 ? (
                    <ul className="mt-2 list-disc pl-5 text-xs text-gray-800 space-y-1">
                      {bullets.map((b: string, idx: number) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  ) : fallbackPretty ? (
                    <pre className="mt-2 max-h-56 overflow-auto rounded-md bg-gray-50 p-2 text-xs text-gray-800">
{fallbackPretty}
                    </pre>
                  ) : (
                    <div className="mt-2 text-xs text-gray-500">—</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  })()}
</div>
        )}
      </div>
    </td>
  </tr>
)}

                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
