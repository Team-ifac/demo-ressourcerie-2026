import { useAuth } from "@/_core/hooks/useAuth";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Shield, User } from "lucide-react";
import { Redirect } from "wouter";
import { toast } from "sonner";

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

  const utils = trpc.useUtils();

  const { data: users = [], isLoading } = trpc.admin.users.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const updateRoleMutation = trpc.admin.users.updateRole.useMutation({
    onSuccess: () => {
      utils.admin.users.list.invalidate();
      toast.success("Rôle mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du rôle");
    },
  });

  const updateProfileMutation = trpc.admin.users.updateProfile.useMutation({
    onSuccess: () => {
      utils.admin.users.list.invalidate();
      toast.success("Profil mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du profil");
    },
  });

  const handleRoleChange = (userId: number, role: Role) => {
    if (userId === user?.id) {
      toast.error("Vous ne pouvez pas modifier votre propre rôle");
      return;
    }
    updateRoleMutation.mutate({ userId, role });
  };

  const handleProfileChange = (userId: number, profileType: ProfileType) => {
    updateProfileMutation.mutate({ userId, profileType });
  };

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
              { label: "Gestion des utilisateurs·rices" },
            ]}
          />

          <div>
            <h1 className="text-4xl font-bold">Gestion des utilisateurs·rices</h1>
            <p className="text-muted-foreground mt-2">
              {users.length} utilisateur{users.length > 1 ? "·rice·s" : "·rice"} enregistré
              {users.length > 1 ? "·e·s" : "·e"}
            </p>
          </div>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Liste des utilisateurs·rices</CardTitle>
              <CardDescription>Gérez les rôles et le profil métier des utilisateurs·rices</CardDescription>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Aucun·e utilisateur·rice enregistré·e
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Méthode de connexion</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Profil</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {users.map((u: any) => {
                        const currentProfile = (u.profileType ?? "") as ProfileType | "";
                        const isSelf = u.id === user.id;

                        return (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">
                              {u.name || <span className="text-muted-foreground">Non renseigné</span>}
                            </TableCell>

                            <TableCell>
                              {u.email || <span className="text-muted-foreground">Non renseigné</span>}
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline">{u.loginMethod || "Inconnu"}</Badge>
                            </TableCell>

                            <TableCell>
                              <Badge variant={u.role === "admin" ? "default" : "secondary"} className="gap-1">
                                {u.role === "admin" ? (
                                  <>
                                    <Shield className="h-3 w-3" />
                                    Admin
                                  </>
                                ) : (
                                  <>
                                    <User className="h-3 w-3" />
                                    Utilisateur·rice
                                  </>
                                )}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <Select
                                value={currentProfile}
                                onValueChange={(p: ProfileType) => handleProfileChange(u.id, p)}
                                disabled={updateProfileMutation.isPending}
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue placeholder="Non défini" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="animateur">{PROFILE_LABELS.animateur}</SelectItem>
                                  <SelectItem value="formateur">{PROFILE_LABELS.formateur}</SelectItem>
                                  <SelectItem value="directeur">{PROFILE_LABELS.directeur}</SelectItem>
                                  <SelectItem value="stagiaire_bafa">{PROFILE_LABELS.stagiaire_bafa}</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>

                            <TableCell className="text-right">
                              <Select
                                value={u.role as Role}
                                onValueChange={(r: Role) => handleRoleChange(u.id, r)}
                                disabled={isSelf || updateRoleMutation.isPending}
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
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="py-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Rôles vs Profil</p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Rôle</strong> (user/admin) = permissions techniques.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Profil</strong> (animateur/formateur/directeur/stagiaire) = filtrage métier des contenus.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
