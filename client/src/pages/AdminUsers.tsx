// ⚠️ VERSION UX PREMIUM CLARIFIÉE — PROJET RESSOURCERIE IFAC

import { useAuth } from "@/_core/hooks/useAuth";
import { useMemo, useState } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

type Role = "user" | "admin";
type ProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa";

const PROFILE_LABELS: Record<ProfileType, string> = {
  animateur: "Animateur·rice",
  formateur: "Formateur·rice",
  directeur: "Directeur·rice",
  stagiaire_bafa: "Stagiaire BAFA",
};

export default function AdminUsers() {
  const { user, loading } = useAuth();

  const [premiumState, setPremiumState] = useState<Record<number, boolean>>({});
  const [premiumPending, setPremiumPending] = useState<Record<number, boolean>>({});
  const [profilePending, setProfilePending] = useState<Record<number, boolean>>({});
  const [rolePending, setRolePending] = useState<Record<number, boolean>>({});

  const utils = trpc.useUtils();

  const { data: users = [], isLoading } = trpc.admin.users.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const updateRole = trpc.admin.users.updateRole.useMutation({
    onSuccess: (_d, v) => {
      setRolePending((p) => ({ ...p, [v.userId]: false }));
      utils.admin.users.list.invalidate();
      toast.success("Rôle mis à jour");
    },
    onError: (_e, v) => {
      setRolePending((p) => ({ ...p, [v.userId]: false }));
      toast.error("Erreur lors de la mise à jour du rôle");
    },
  });

  const updateProfile = trpc.admin.users.updateProfile.useMutation({
    onSuccess: (_d, v) => {
      setProfilePending((p) => ({ ...p, [v.userId]: false }));
      utils.admin.users.list.invalidate();
      toast.success("Profil mis à jour");
    },
    onError: (_e, v) => {
      setProfilePending((p) => ({ ...p, [v.userId]: false }));
      toast.error("Erreur lors de la mise à jour du profil");
    },
  });

  const setPremium = trpc.admin.users.setPremium.useMutation({
    onSuccess: async (_d, v) => {
      setPremiumPending((p) => ({ ...p, [v.userId]: false }));
      setPremiumState((p) => {
        const next = { ...p };
        delete next[v.userId];
        return next;
      });
      await utils.admin.users.list.invalidate();
      toast.success("Accès Premium mis à jour");
    },
    onError: (_e, v) => {
      setPremiumPending((p) => ({ ...p, [v.userId]: false }));
      setPremiumState((p) => ({ ...p, [v.userId]: !v.premium }));
      toast.error("Erreur lors de la mise à jour du Premium");
    },
  });

  const handlePremiumChange = (targetId: number, next: boolean) => {
    if (targetId === user?.id) {
      toast.error("Vous ne pouvez pas modifier votre propre accès Premium");
      return;
    }
    setPremiumState((p) => ({ ...p, [targetId]: next }));
    setPremiumPending((p) => ({ ...p, [targetId]: true }));
    setPremium.mutate({ userId: targetId, premium: next });
  };

  const usersLabel = useMemo(() => {
    const n = users.length;
    return `${n} utilisateur${n > 1 ? "·rice·s" : "·rice"} enregistré${n > 1 ? "·e·s" : "·e"}`;
  }, [users.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return <Redirect to="/" />;

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-6xl py-8 space-y-8">
        <Breadcrumb items={[{ label: "Administration", href: "/admin" }, { label: "Utilisateurs·rices" }]} />

        <div>
          <h1 className="text-4xl font-bold">Gestion des utilisateurs·rices</h1>
          <p className="text-muted-foreground mt-2">{usersLabel}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des utilisateurs·rices</CardTitle>
            <CardDescription>
              Rôles techniques, profil métier et droits Premium
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Connexion</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Profil</TableHead>
                    <TableHead>Accès Premium</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {users.map((u: any) => {
                    const isSelf = u.id === user.id;
                    const premiumFromApi =
  u.entitlements?.premium === true ||
  u.entitlements?.isPremium === true ||
  u.premiumOverride === 1 ||
  u.premiumOverride === true;

const premium =
  premiumState[u.id] !== undefined
    ? premiumState[u.id]
    : premiumFromApi;


                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex gap-2 items-center">
                            <span>{u.name || "Non renseigné"}</span>
                            {isSelf && <Badge variant="outline">vous</Badge>}
                          </div>
                        </TableCell>

                        <TableCell>{u.email}</TableCell>

                        <TableCell>
                          <Badge variant="outline">{u.loginMethod}</Badge>
                        </TableCell>

                        <TableCell>
                          <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                            {u.role === "admin" ? "Admin" : "Utilisateur·rice"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Select
                            value={u.profileType ?? ""}
                            onValueChange={(p: ProfileType) => {
                              setProfilePending((x) => ({ ...x, [u.id]: true }));
                              updateProfile.mutate({ userId: u.id, profileType: p });
                            }}
                            disabled={profilePending[u.id]}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Non défini" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(PROFILE_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>
                                  {v}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell>
                          <div
                            className="flex items-center gap-2"
                            title="Autorise le téléchargement des ressources Premium lorsque l’accès est restreint. Les administrateurs et formateurs y ont accès automatiquement."
                          >
                            <Switch
                              checked={premium}
                              disabled={isSelf || premiumPending[u.id]}
                              onCheckedChange={(v) => handlePremiumChange(u.id, v)}
                            />
                            <span className="text-xs text-muted-foreground">
                              {premium ? "Autorisé" : "Non autorisé"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <Select
                            value={u.role}
                            onValueChange={(r: Role) => {
                              if (isSelf) {
                                toast.error("Vous ne pouvez pas modifier votre propre rôle");
                                return;
                              }
                              setRolePending((x) => ({ ...x, [u.id]: true }));
                              updateRole.mutate({ userId: u.id, role: r });
                            }}
                            disabled={isSelf || rolePending[u.id]}
                          >
                            <SelectTrigger className="w-40 ml-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Utilisateur·rice</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
