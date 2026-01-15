import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import { useEffect } from "react";
import { useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import Home from "./pages/Home";
import ResourcesReorganized from "./pages/ResourcesReorganized";
import ResourceDetail from "./pages/ResourceDetail";
import Library from "./pages/Library";
import About from "./pages/About";
import Admin from "./pages/Admin";
import AdminResources from "./pages/AdminResources";
import AdminResourceForm from "./pages/AdminResourceForm";
import AdminThemes from "./pages/AdminThemes";
import AdminUsers from "./pages/AdminUsers";
import ProfileCategories from "./pages/ProfileCategories";
import NeedCategories from "./pages/NeedCategories";
import CategoryResources from "./pages/CategoryResources";
import Contribute from "./pages/Contribute";
import Collections from "./pages/Collections";
import ThematicCollections from "./pages/ThematicCollections";
import Forum from "@/pages/Forum";
import UserProfile from "@/pages/UserProfile";
import AdminAnalytics from "@/pages/AdminAnalytics";
import Settings from "@/pages/Settings";
import AdminModeration from "./pages/AdminModeration";
import AdminIntegrations from "./pages/AdminIntegrations";
import AdminImport from "./pages/AdminImport";
import AdminThumbnails from "./pages/AdminThumbnails";
import { AdminCollections } from "./pages/AdminCollections";
import AdminCollectionAssociation from "@/pages/AdminCollectionAssociation";
import AdminDeduplication from "@/pages/AdminDeduplication";
import AdminAutoClassify from "@/pages/AdminAutoClassify";
import AdminCollectionsManagement from "./pages/AdminCollectionsManagement";
import AdminProfiles from "./pages/AdminProfiles";
import { AdminAccessLevels } from "./pages/AdminAccessLevels";
import { ProfileSelection } from "./pages/ProfileSelection";
import Subscription from "./pages/Subscription";
import UserProfileManagement from "./pages/UserProfileManagement";
import FAQ from "./pages/FAQ";
import Legal from "./pages/Legal";
import APIDocumentation from "@/pages/APIDocumentation";
import { SubscriptionDashboard } from "./pages/SubscriptionDashboard";
import { AuthChoice } from "./pages/AuthChoice";
import { AuthSignup } from "./pages/AuthSignup";
import { AuthLogin } from "./pages/AuthLogin";
import { AuthVerifyEmail } from "./pages/AuthVerifyEmail";
import AdminCMS from "./pages/AdminCMS";
import { AuthCheckEmail } from "./pages/AuthCheckEmail";
import AuthSetPassword from "./pages/AuthSetPassword";
import AdminImportFormateurs from "./pages/AdminImportFormateurs";
import AdminSendFormateursEmails from "./pages/AdminSendFormateursEmails";
import AdminResourcesManagement from "./pages/AdminResourcesManagement";
import { AdminImportPDFs } from "./pages/AdminImportPDFs";
import Help from "./pages/Help";
import LearningPaths from "./pages/LearningPaths";
import AdminLearningPaths from "./pages/AdminLearningPaths";
import { trpc } from "@/lib/trpc";

function AdminGuard({ children }: { children: React.ReactNode }) {
  // On se base sur la source de vérité serveur (cookie)
  const { data: me, isLoading } = trpc.auth.me.useQuery();
  const [location, navigate] = useLocation();

  const isAdmin = (me as any)?.role === "admin";

  // Si quelqu'un tape /admin... à la main, on redirige proprement
  useEffect(() => {
    const isAdminPath = location === "/admin" || location.startsWith("/admin/");
    if (!isAdminPath) return;

    // Pendant le chargement, on ne fait rien (évite un flash/redirect inutile)
    if (isLoading) return;

    // Pas admin (y compris non connecté) -> dehors
    if (!isAdmin) {
      navigate("/");
    }
  }, [location, isLoading, isAdmin, navigate]);

  // Pendant le chargement, on laisse passer (ou tu peux afficher un loader si tu veux)
  if (isLoading) return <>{children}</>;

  // Si on est sur /admin... et pas admin, on évite de rendre l'UI admin (démo propre)
  const isAdminPath = location === "/admin" || location.startsWith("/admin/");
  if (isAdminPath && !isAdmin) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Pages publiques */}
      <Route path="/" component={Home} />

      {/* ✅ Route principale (anglais) */}
      <Route path="/resources" component={ResourcesReorganized} />
      <Route path="/resources/:id" component={ResourceDetail} />

      {/* ✅ Alias FR pour éviter les liens cassés */}
      <Route path="/ressources" component={ResourcesReorganized} />
      <Route path="/ressources/:id" component={ResourceDetail} />

      <Route path="/about" component={About} />

      {/* Pages d'authentification */}
      <Route path="/auth/choice" component={AuthChoice} />
      <Route path="/auth/signup" component={AuthSignup} />
      <Route path="/auth/login" component={AuthLogin} />
      <Route path="/auth/verify-email" component={AuthVerifyEmail} />
      <Route path="/auth/check-email" component={AuthCheckEmail} />
      <Route path="/auth/set-password/:token" component={AuthSetPassword} />

      {/* Navigation par profil et besoin */}
      <Route path="/selection-profil" component={ProfileSelection} />
      <Route path="/profil/:profile" component={ProfileCategories} />
      <Route path="/besoin/:need" component={NeedCategories} />
      <Route path="/categorie/:type/:key/:category" component={CategoryResources} />

      {/* Pages utilisateur authentifié */}
      <Route path="/bibliotheque" component={Library} />
      <Route path="/contribuer" component={Contribute} />
      <Route path="/collections" component={Collections} />
      <Route path="/collections-thematiques" component={ThematicCollections} />
      <Route path="/forum" component={Forum} />
      <Route path="/profil" component={UserProfile} />
      <Route path="/gestion-profil" component={UserProfileManagement} />
      <Route path="/parametres" component={Settings} />
      <Route path="/adhesion" component={Subscription} />
      <Route path="/gestion-adhesion" component={SubscriptionDashboard} />

      {/* Pages administration (protégées globalement) */}
      <Route path="/admin/import">
        <AdminGuard>
          <AdminImport />
        </AdminGuard>
      </Route>
      <Route path="/admin/import-formateurs">
        <AdminGuard>
          <AdminImportFormateurs />
        </AdminGuard>
      </Route>
      <Route path="/admin/send-formateurs-emails">
        <AdminGuard>
          <AdminSendFormateursEmails />
        </AdminGuard>
      </Route>
      <Route path="/admin/import-pdfs">
        <AdminGuard>
          <AdminImportPDFs />
        </AdminGuard>
      </Route>
      <Route path="/admin/cms">
        <AdminGuard>
          <AdminCMS />
        </AdminGuard>
      </Route>
      <Route path="/admin/thumbnails">
        <AdminGuard>
          <AdminThumbnails />
        </AdminGuard>
      </Route>
      <Route path="/admin/collections">
        <AdminGuard>
          <AdminCollections />
        </AdminGuard>
      </Route>
      <Route path="/admin/collection-association">
        <AdminGuard>
          <AdminCollectionAssociation />
        </AdminGuard>
      </Route>
      <Route path="/admin/deduplication">
        <AdminGuard>
          <AdminDeduplication />
        </AdminGuard>
      </Route>
      <Route path="/admin/auto-classify">
        <AdminGuard>
          <AdminAutoClassify />
        </AdminGuard>
      </Route>
      <Route path="/admin/collections-management">
        <AdminGuard>
          <AdminCollectionsManagement />
        </AdminGuard>
      </Route>
      <Route path="/admin/integrations">
        <AdminGuard>
          <AdminIntegrations />
        </AdminGuard>
      </Route>
      <Route path="/admin/resources-management">
        <AdminGuard>
          <AdminResourcesManagement />
        </AdminGuard>
      </Route>
      <Route path="/admin/thematiques">
        <AdminGuard>
          <AdminThemes />
        </AdminGuard>
      </Route>
      <Route path="/admin/profils">
        <AdminGuard>
          <AdminProfiles />
        </AdminGuard>
      </Route>
      <Route path="/admin/access-levels">
        <AdminGuard>
          <AdminAccessLevels />
        </AdminGuard>
      </Route>
      <Route path="/admin/utilisateurs">
        <AdminGuard>
          <AdminUsers />
        </AdminGuard>
      </Route>
      <Route path="/admin/moderation">
        <AdminGuard>
          <AdminModeration />
        </AdminGuard>
      </Route>
      <Route path="/admin/analytics">
        <AdminGuard>
          <AdminAnalytics />
        </AdminGuard>
      </Route>
      <Route path="/admin/parcours">
        <AdminGuard>
          <AdminLearningPaths />
        </AdminGuard>
      </Route>

      <Route path="/admin/ressources">
        <AdminGuard>
          <AdminResources />
        </AdminGuard>
      </Route>

      <Route path="/admin/ressources/:id">
        <AdminGuard>
          <AdminResourceForm />
        </AdminGuard>
      </Route>

      <Route path="/admin">
        <AdminGuard>
          <Admin />
        </AdminGuard>
      </Route>

      {/* Contenu public / pages diverses */}
      <Route path="/faq" component={FAQ} />
      <Route path="/aide" component={Help} />
      <Route path="/parcours" component={LearningPaths} />
      <Route path="/legal" component={Legal} />
      <Route path="/api" component={APIDocumentation} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Header />
          <Router />
          <Footer />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
