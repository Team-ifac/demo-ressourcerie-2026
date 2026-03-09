import { useEffect, useMemo, useState } from "react";
import { Redirect } from "wouter";
import { Loader2, FolderTree, RefreshCw, Folder, FolderOpen } from "lucide-react";

import { useAuth } from "@/_core/hooks/useAuth";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProfileType = "public" | "animateur" | "formateur" | "directeur" | "stagiaire_bafa";

type CategoryNode = {
  id: number;
  profileType: ProfileType;
  parentId: number | null;
  parentIdKey: string;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isActive: number;
  createdAt?: string;
  children: CategoryNode[];
};

const PROFILE_OPTIONS: Array<{ key: ProfileType; label: string }> = [
  { key: "public", label: "Public" },
  { key: "animateur", label: "Animateur" },
  { key: "formateur", label: "Formateur" },
  { key: "directeur", label: "Directeur" },
  { key: "stagiaire_bafa", label: "Stagiaire BAFA" },
];

function countNodes(nodes: CategoryNode[]): number {
  return nodes.reduce((acc, node) => acc + 1 + countNodes(node.children || []), 0);
}

function maxDepth(nodes: CategoryNode[], depth = 1): number {
  if (!nodes.length) return 0;
  return Math.max(
    ...nodes.map((node) =>
      node.children?.length ? maxDepth(node.children, depth + 1) : depth
    )
  );
}

function NodeRow({
  node,
  level = 0,
}: {
  node: CategoryNode;
  level?: number;
}) {
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <div className="space-y-3">
      <div
        className="rounded-lg border p-4"
        style={{ marginLeft: `${level * 20}px` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}

              <div className="font-medium break-words">{node.title}</div>

              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                  node.isActive === 1
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {node.isActive === 1 ? "Actif" : "Inactif"}
              </span>
            </div>

            <div className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
              <div>
                <span className="font-medium text-foreground">Slug :</span>{" "}
                <span className="break-all">{node.slug}</span>
              </div>
              <div>
                <span className="font-medium text-foreground">ID :</span> {node.id}
              </div>
              <div>
                <span className="font-medium text-foreground">Ordre :</span>{" "}
                {node.sortOrder}
              </div>
            </div>

            {node.description ? (
              <div className="mt-2 text-sm text-muted-foreground">
                {node.description}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {hasChildren ? (
        <div className="space-y-3">
          {node.children.map((child) => (
            <NodeRow key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminTaxonomyPage() {
  const { user, loading } = useAuth();

  const [profileType, setProfileType] = useState<ProfileType>("animateur");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [tree, setTree] = useState<CategoryNode[]>([]);

  const totalNodes = useMemo(() => countNodes(tree), [tree]);
  const treeDepth = useMemo(() => maxDepth(tree), [tree]);

  async function loadTree(nextProfileType = profileType, nextIncludeInactive = includeInactive) {
    setIsLoadingTree(true);
    setTreeError(null);

    try {
      const input = encodeURIComponent(
        JSON.stringify({
          profileType: nextProfileType,
          includeInactive: nextIncludeInactive,
        })
      );

      const resp = await fetch(
        `/api/trpc/adminCategoryNodes.listTreeByProfile?input=${input}`,
        {
          credentials: "include",
        }
      );

      const payload = await resp.json();

      if (!resp.ok) {
        throw new Error(`Erreur HTTP ${resp.status}`);
      }

      const rows =
        payload?.result?.data?.json ??
        payload?.result?.data ??
        payload?.json ??
        payload ??
        [];

      setTree(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      setTreeError(String(e?.message ?? e ?? "Erreur de chargement"));
      setTree([]);
    } finally {
      setIsLoadingTree(false);
    }
  }

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    void loadTree(profileType, includeInactive);
  }, [user, profileType, includeInactive]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8">
        <div className="container max-w-6xl space-y-8">
          <Breadcrumb
            items={[
              { label: "Administration", href: "/admin" },
              { label: "Taxonomie" },
            ]}
          />

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold">Taxonomie</h1>
              <p className="text-muted-foreground mt-2">
                Vue admin de l’arborescence des catégories par profil métier.
              </p>
            </div>
          </div>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5" />
                Pilotage
              </CardTitle>
              <CardDescription>
                Choisis un profil pour afficher sa structure de catégories.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {PROFILE_OPTIONS.map((option) => (
                  <Button
                    key={option.key}
                    type="button"
                    variant={profileType === option.key ? "default" : "outline"}
                    onClick={() => setProfileType(option.key)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={includeInactive}
                    onChange={(e) => setIncludeInactive(e.target.checked)}
                  />
                  Afficher aussi les catégories inactives
                </label>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void loadTree(profileType, includeInactive)}
                  disabled={isLoadingTree}
                >
                  {isLoadingTree ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="text-base">Profil affiché</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {PROFILE_OPTIONS.find((x) => x.key === profileType)?.label ?? profileType}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="text-base">Nombre total de nœuds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalNodes}</div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="text-base">Profondeur max</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{treeDepth}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Arborescence</CardTitle>
              <CardDescription>
                Lecture structurée des catégories enregistrées en base.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingTree ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement de l’arborescence…
                </div>
              ) : treeError ? (
                <div className="text-sm text-destructive">{treeError}</div>
              ) : tree.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Aucune catégorie trouvée pour ce profil.
                </div>
              ) : (
                <div className="space-y-4">
                  {tree.map((node) => (
                    <NodeRow key={node.id} node={node} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}