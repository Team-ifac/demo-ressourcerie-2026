import React, { useMemo, useState } from "react";
import { trpc } from "../lib/trpc";

type AnyResource = any;

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
  const u = (url ?? "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) return `https://${u}`;
  return u;
}

type StatusValue = "draft" | "approved";
type AccessValue = "PUBLIC" | "AUTHENTICATED" | "PREMIUM";

type ProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa";

type EditForm = {
  id: number;
  title: string;
  summary: string;
  url: string;
  accessLevel: AccessValue;
  status: StatusValue;

  // ✅ Profils de la ressource (multi)
  profileTypes: ProfileType[];
};


function normalizeStatus(v: any): StatusValue {
  const s = String(v ?? "draft").toLowerCase();
  if (s === "approved") return "approved";
  return "draft";
}

function statusLabel(v: any) {
  return normalizeStatus(v) === "approved" ? "Publiée" : "Brouillon";
}

function statusBadgeClass(v: any) {
  // On reste sobre : 2 états
  return normalizeStatus(v) === "approved"
    ? "bg-green-50 text-green-800"
    : "bg-gray-100 text-gray-800";
}

function accessLabel(v: any) {
  const s = String(v ?? "PUBLIC").toUpperCase();
  if (s === "PREMIUM") return "Premium";
  if (s === "AUTHENTICATED") return "Connectés";
  return "Public";
}

export default function AdminResourcesManagement() {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState<EditForm | null>(null);

  // ✅ Admin : on récupère tout
  const resourcesQuery = trpc.collections.getAllResourcesForAdmin.useQuery(undefined, {
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const createTestMutation = trpc.resources.createResource.useMutation();
  const deleteAllMutation = trpc.resources.deleteAllResources.useMutation();
  const deleteOneMutation =
    (trpc.resources as any).deleteResource?.useMutation?.() ?? trpc.resources.delete.useMutation();

  // ✅ update admin (existe dans ton router resources)
  const updateMutation = trpc.resources.update.useMutation();
  const setProfilesMutation = trpc.resources.setProfiles.useMutation();

  const utils = trpc.useUtils();

  const resources: AnyResource[] = resourcesQuery.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return resources;

    return resources.filter((r: AnyResource) => {
      const title = (r.title ?? "").toLowerCase();
      const type = (r.type ?? "").toLowerCase();
      const access = (r.accessLevel ?? "").toLowerCase();
      const status = (r.status ?? "").toLowerCase();

      const collections = Array.isArray(r.collections)
        ? r.collections.map((c: any) => (c?.name ?? "")).join(" ").toLowerCase()
        : "";

      const profils = Array.isArray(r.profiles) ? r.profiles.join(" ").toLowerCase() : "";

      return (
        title.includes(q) ||
        type.includes(q) ||
        access.includes(q) ||
        status.includes(q) ||
        collections.includes(q) ||
        profils.includes(q)
      );
    });
  }, [resources, search]);

  async function refresh() {
    await utils.collections.getAllResourcesForAdmin.invalidate();
    await resourcesQuery.refetch();
  }

  async function onCreateTest() {
    try {
      const now = new Date();
      const title = `Ressource test (${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)})`;

      await createTestMutation.mutateAsync({
        title,
        description: "Exemple créé en 1 clic pour la démo admin.",
        category: "Autres",
        profile: "animateur",
        url: "https://example.com",
        type: "document",
      });

      await refresh();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la création de la ressource de test (voir console).");
    }
  }

  async function onDeleteAll() {
    if (!confirm("Confirmer : supprimer TOUTES les ressources ?")) return;
    try {
      await deleteAllMutation.mutateAsync();
      await refresh();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la suppression (voir console).");
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
function accessLevelLabel(v: any) {
  const lvl = String(v ?? "PUBLIC").toUpperCase();
  if (lvl === "PREMIUM") return "Premium";
  if (lvl === "AUTHENTICATED") return "Connectés";
  return "Public";
}

  function onExportCsv() {
    const rows = filtered;

    const header = ["ID", "Titre", "Type", "Profils", "Collections", "Accès", "Statut", "Téléchargeable", "URL"];

    const lines = [header.map(toCsvValue).join(",")];

    rows.forEach((r: AnyResource) => {
      const collections = Array.isArray(r.collections)
        ? r.collections.map((c: any) => c?.name).filter(Boolean).join(" | ")
        : "";

      const profils = Array.isArray(r.profiles) ? r.profiles.join(" | ") : "";

      const url = r.fileUrl ?? r.url ?? "";
      const downloadable = !!url ? "oui" : "non";

      const line = [
        r.id ?? "",
        r.title ?? "",
        r.type ?? "",
        profils,
        collections,
        accessLevelLabel(r.accessLevel),
        r.status ?? "",
        downloadable,
        url,
      ];
      lines.push(line.map(toCsvValue).join(","));
    });

    const content = lines.join("\n");
    const filename = `ressources-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadTextFile(filename, content, "text/csv;charset=utf-8");
  }

  function openEditModal(r: AnyResource) {
  const id = Number(r.id);
  const currentUrl = normalizeUrl(r.fileUrl ?? r.url ?? "");
  const currentAccess = String(r.accessLevel ?? "PUBLIC").toUpperCase() as AccessValue;

  // ✅ Profils actuels de la ressource
  const currentProfiles = Array.isArray(r.profiles) ? r.profiles : [];

  setEdit({
    id,
    title: String(r.title ?? ""),
    summary: String(r.summary ?? r.description ?? ""),
    url: currentUrl,
    accessLevel: (currentAccess === "PREMIUM" || currentAccess === "AUTHENTICATED"
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
        fileUrl: (edit.url ?? "").trim() ? normalizeUrl(edit.url) : undefined,
        accessLevel: edit.accessLevel,
        status: edit.status as any,
      } as any);
      await setProfilesMutation.mutateAsync({
        resourceId: edit.id,
        profileTypes: edit.profileTypes,
      });

      await refresh();
      closeEditModal();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l’enregistrement (voir console).");
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
      <h1 className="text-3xl font-bold">Admin · Ressources</h1>
      <p className="mt-1 text-gray-600">Liste simple et actions rapides : ajouter, voir, modifier, supprimer, exporter.</p>

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

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm text-gray-700">Accès</span>
                  <select
                    className="rounded-lg border px-3 py-2"
                    value={edit.accessLevel}
                    onChange={(e) => setEdit({ ...edit, accessLevel: e.target.value as AccessValue })}
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="AUTHENTICATED">Connectés</option>
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
                    <option value="draft">Brouillon</option>
                    <option value="approved">Publiée</option>
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
              onClick={() => alert("Bouton 'Ajouter' : à relier à ton vrai formulaire plus tard.")}
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

            <button className="rounded-lg border px-4 py-2 hover:bg-gray-50" onClick={onExportCsv} type="button">
              Export CSV
            </button>

            <button
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-600"
              onClick={onDeleteAll}
              disabled={true}
              type="button"
            >
              Supprimer tout
            </button>
          </div>

          <input
            className="w-full rounded-lg border px-3 py-2 md:w-[420px]"
            placeholder="Rechercher (titre, type, profil, collection...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Ressources</h2>
          <div className="text-sm text-gray-600">{filtered.length} ressource(s) affichée(s)</div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="px-3">Titre</th>
                <th className="px-3">Type</th>
                <th className="px-3">Profils</th>
                <th className="px-3">Collections</th>
                <th className="px-3">Accès</th>
                <th className="px-3">Statut</th>
                <th className="px-3">Tél</th>
                <th className="px-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r: AnyResource) => {
                const id = Number(r.id);
                const url = normalizeUrl(r.fileUrl ?? r.url ?? "");
                const downloadable = !!url ? "oui" : "non";

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
                        <div className="font-medium">{r.title ?? "Sans titre"}</div>
                        <div className="text-xs text-gray-500">ID: {id}</div>
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
                        <span className="rounded-md bg-orange-50 px-2 py-1 text-sm">{accessLabel(r.accessLevel)}</span>
                      </td>

                      <td className="px-3 py-3">
                        <span className={`rounded-md px-2 py-1 text-sm ${statusBadgeClass(r.status)}`}>
                          {statusLabel(r.status)}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-sm">{downloadable}</span>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
                            onClick={() => setOpenId(isOpen ? null : id)}
                            type="button"
                            title="Voir détails"
                          >
                            Voir
                          </button>

                          <button
                            className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
                            onClick={() => openEditModal(r)}
                            type="button"
                            title="Modifier"
                          >
                            ✏️
                          </button>

                          {url ? (
                            <a
                              className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              title="Ouvrir le lien"
                            >
                              ↗
                            </a>
                          ) : (
                            <button
                              className="rounded-md border px-2 py-1 text-sm text-gray-400"
                              type="button"
                              disabled
                              title="Pas d’URL"
                            >
                              ↗
                            </button>
                          )}

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
                        <td colSpan={8} className="px-3 pb-4">
                          <div className="rounded-lg border bg-gray-50 p-4">
                            <div className="font-semibold">Détails</div>
                            <div className="mt-2 text-sm">
                              <div className="text-gray-600">Description :</div>
                              <div className="mt-1">{(r.summary ?? r.description ?? "—") as string}</div>
<div className="mt-3 text-gray-600">Profils :</div>
<div className="mt-1">
  {Array.isArray(r.profiles) && r.profiles.length > 0 ? r.profiles.join(", ") : "—"}
</div>

                              <div className="mt-3 text-gray-600">URL :</div>
                              <div className="mt-1">
                                {url ? (
                                  <a href={url} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                                    {url}
                                  </a>
                                ) : (
                                  "—"
                                )}
                              </div>
                            </div>
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
