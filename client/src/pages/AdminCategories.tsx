import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";

type ProfileType = "animateur" | "directeur" | "stagiaire_bafa" | "formateur";

type Node = {
  id: number;
  profileType: ProfileType;
  parentId: number | null;
  parentIdKey: string;
  slug: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  isActive: number;
  createdAt: string;
  children: Node[];
};

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

// ✅ tri "pro" : actifs d'abord, puis sortOrder
function sortNodes(a: Node, b: Node) {
  const aActive = a.isActive === 1 ? 1 : 0;
  const bActive = b.isActive === 1 ? 1 : 0;
  if (aActive !== bActive) return bActive - aActive; // actifs en premier
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
}

function TreeNode({
  node,
  level,
  expanded,
  toggle,
  onToggleActive,
  togglingId,
}: {
  node: Node;
  level: number;
  expanded: Set<number>;
  toggle: (id: number) => void;
  onToggleActive: (id: number, nextActive: number) => void;
  togglingId: number | null;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const active = node.isActive === 1;
  const isTogglingThis = togglingId === node.id;

  return (
    <div style={{ paddingLeft: level * 16 }} className="py-1">
      <div
        className={[
          "flex items-center gap-2 rounded-md px-2 py-1",
          active ? "" : "opacity-50",
          active ? "" : "bg-gray-50",
        ].join(" ")}
      >
        {hasChildren ? (
          <button
            className="text-xs px-2 py-1 rounded border"
            onClick={() => toggle(node.id)}
            type="button"
            title={isOpen ? "Replier" : "Déplier"}
          >
            {isOpen ? "−" : "+"}
          </button>
        ) : (
          <span className="w-[28px]" />
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{node.title}</span>
          <span className="text-xs opacity-60">({node.slug})</span>

          {active ? (
            <span className="text-xs px-2 py-0.5 rounded bg-green-100 border border-green-200">
              actif
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 border border-gray-300">
              inactif
            </span>
          )}

          {/* ✅ Soft delete : Désactiver / Réactiver */}
          <button
            className="text-xs px-2 py-1 rounded border"
            type="button"
            onClick={() => onToggleActive(node.id, active ? 0 : 1)}
            disabled={isTogglingThis}
            title={active ? "Désactiver (soft delete)" : "Réactiver"}
          >
            {isTogglingThis ? "..." : active ? "Désactiver" : "Réactiver"}
          </button>

          <span className="text-xs opacity-50">id: {node.id}</span>
          <span className="text-xs opacity-50">ordre: {node.sortOrder ?? 0}</span>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="mt-1">
          {node.children
            .slice()
            .sort(sortNodes)
            .map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                level={level + 1}
                expanded={expanded}
                toggle={toggle}
                onToggleActive={onToggleActive}
                togglingId={togglingId}
              />
            ))}
        </div>
      )}
    </div>
  );
}

const PROFILE_OPTIONS: { value: ProfileType; label: string }[] = [
  { value: "animateur", label: "animateur" },
  { value: "directeur", label: "directeur" },
  { value: "stagiaire_bafa", label: "stagiaire_bafa" },
  { value: "formateur", label: "formateur" },
];

function flattenNodes(nodes: Node[]): Node[] {
  const out: Node[] = [];
  const walk = (n: Node) => {
    out.push(n);
    (n.children || []).forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}

export default function AdminCategories() {
  const [profileType, setProfileType] = useState<ProfileType>("animateur");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // ✅ toggle UI : afficher/masquer les inactifs
  const [showInactive, setShowInactive] = useState(true);

  // Ajout catégorie (UI)
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // ✅ pour éviter de bloquer tous les boutons quand on toggle
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const query = trpc.adminCategoryNodes.listTreeByProfile.useQuery(
    { profileType, includeInactive: showInactive },
    { retry: false }
  );

  const roots = useMemo(
    () => (Array.isArray(query.data) ? (query.data as Node[]) : []),
    [query.data]
  );

  const allNodesFlat = useMemo(() => flattenNodes(roots), [roots]);

  const parentOptions = useMemo(() => {
    return allNodesFlat
      .slice()
      .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
      .map((n) => ({
        id: n.id,
        label: `${n.title} (id: ${n.id})${n.isActive === 1 ? "" : " — INACTIF"}`,
        isActive: n.isActive,
      }));
  }, [allNodesFlat]);

  const createMutation = trpc.adminCategoryNodes.create.useMutation();
  const setActiveMutation = trpc.adminCategoryNodes.setActive.useMutation();

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    const allIds: number[] = [];
    const walk = (n: Node) => {
      allIds.push(n.id);
      (n.children || []).forEach(walk);
    };
    roots.forEach(walk);
    setExpanded(new Set(allIds));
  }

  function collapseAll() {
    setExpanded(new Set());
  }

  function resetCreateForm() {
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setDescription("");
    setParentId(null);
    setFormError(null);
  }

  async function submitCreate() {
    setFormError(null);

    const cleanTitle = title.trim();
    const cleanSlug = slug.trim();
    const cleanDesc = description.trim();

    if (!cleanTitle) {
      setFormError("Le titre est obligatoire.");
      return;
    }

    const finalSlug = cleanSlug ? cleanSlug : slugify(cleanTitle);

    try {
      await createMutation.mutateAsync({
        profileType,
        title: cleanTitle,
        slug: finalSlug,
        description: cleanDesc ? cleanDesc : null,
        parentId: parentId ?? null,
      });

      setShowCreate(false);
      resetCreateForm();
      await query.refetch();
    } catch (e: any) {
      setFormError(e?.message ?? "Erreur lors de la création.");
    }
  }

  async function toggleActiveCategory(id: number, nextActive: number) {
    try {
      setTogglingId(id);
      await setActiveMutation.mutateAsync({ id, isActive: nextActive });
      await query.refetch();
    } catch (e: any) {
      alert(e?.message ?? "Erreur lors du changement actif/inactif.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Taxonomie (category_nodes)</h1>
        <p className="text-sm opacity-70">
          Vue arborescente par profil. Ici on gère les catégories (structure). La gestion des accès
          Public / Connectés / Premium se fait ailleurs.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="border rounded px-3 py-1"
          type="button"
          onClick={() => {
            setShowCreate((v) => !v);
            setFormError(null);
            if (!showCreate) resetCreateForm();
          }}
        >
          + Ajouter une catégorie
        </button>

        <label className="text-sm font-medium ml-2">Profil :</label>

        <select
          className="border rounded px-2 py-1"
          value={profileType}
          onChange={(e) => {
            setProfileType(e.target.value as ProfileType);
            setExpanded(new Set());
            resetCreateForm();
          }}
        >
          {PROFILE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* ✅ Toggle inactifs */}
        <label className="ml-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => {
              setShowInactive(e.target.checked);
              setExpanded(new Set());
            }}
          />
          Afficher les inactifs
        </label>

        <button className="border rounded px-3 py-1" onClick={() => query.refetch()} type="button">
          Rafraîchir
        </button>

        <button
          className="border rounded px-3 py-1"
          onClick={expandAll}
          type="button"
          disabled={roots.length === 0}
          title={roots.length === 0 ? "Aucune donnée" : "Tout déplier"}
        >
          Tout déplier
        </button>

        <button
          className="border rounded px-3 py-1"
          onClick={collapseAll}
          type="button"
          disabled={expanded.size === 0}
          title={expanded.size === 0 ? "Déjà replié" : "Tout replier"}
        >
          Tout replier
        </button>
      </div>

      {showCreate && (
        <div className="border rounded p-4 space-y-3">
          <div className="font-medium">Nouvelle catégorie (profil : {profileType})</div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Titre *</label>
              <input
                className="border rounded px-2 py-1 w-full"
                value={title}
                onChange={(e) => {
                  const nextTitle = e.target.value;
                  setTitle(nextTitle);
                  if (!slugTouched) setSlug(slugify(nextTitle));
                }}
                placeholder="Ex: Hygiène et santé"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Slug (optionnel — auto si vide)</label>
              <input
                className="border rounded px-2 py-1 w-full"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="Ex: hygiene-et-sante"
              />
              <div className="text-xs opacity-60">
                Par défaut, il se remplit tout seul à partir du titre. Si tu le modifies à la main,
                on ne le touche plus.
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Parent (optionnel)</label>
              <select
                className="border rounded px-2 py-1 w-full"
                value={parentId == null ? "" : String(parentId)}
                onChange={(e) => {
                  const v = e.target.value;
                  setParentId(v ? Number(v) : null);
                }}
              >
                <option value="">(Racine / pas de parent)</option>
                {parentOptions.map((p) => (
                  <option
                    key={p.id}
                    value={String(p.id)}
                    disabled={p.isActive !== 1}
                    title={p.isActive !== 1 ? "Impossible : parent inactif" : undefined}
                  >
                    {p.label}
                  </option>
                ))}
              </select>
              <div className="text-xs opacity-60">
                Si tu laisses vide, la catégorie sera au niveau 1 (racine).
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Description (optionnel)</label>
              <textarea
                className="border rounded px-2 py-1 w-full"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Une phrase pour expliquer la catégorie (facultatif)"
                rows={3}
              />
            </div>
          </div>

          {formError && <div className="text-red-600 text-sm">Erreur : {formError}</div>}

          <div className="flex gap-2">
            <button
              className="border rounded px-3 py-1"
              type="button"
              onClick={submitCreate}
              disabled={createMutation.isPending}
              title={createMutation.isPending ? "Création..." : "Créer"}
            >
              {createMutation.isPending ? "Création..." : "Créer"}
            </button>

            <button
              className="border rounded px-3 py-1"
              type="button"
              onClick={() => {
                setShowCreate(false);
                resetCreateForm();
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="border rounded p-4">
        {query.isLoading && <div>Chargement…</div>}

        {query.error && (
          <div className="text-red-600">
            Erreur : {(query.error as any)?.message ?? "Erreur inconnue"}
            <div className="text-sm opacity-70 mt-1">Vérifie que tu es bien connecté en admin.</div>
          </div>
        )}

        {!query.isLoading && !query.error && roots.length === 0 && (
          <div className="opacity-70">Aucune catégorie trouvée pour ce profil.</div>
        )}

        {!query.isLoading && !query.error && roots.length > 0 && (
          <div className="space-y-1">
            {roots
              .slice()
              .sort(sortNodes)
              .map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  level={0}
                  expanded={expanded}
                  toggle={toggle}
                  onToggleActive={toggleActiveCategory}
                  togglingId={togglingId}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
