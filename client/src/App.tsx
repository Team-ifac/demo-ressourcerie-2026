import AdminCategories from "./pages/AdminCategories";
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
import Subscription from "./pages/Subscription";
import FAQ from "./pages/FAQ";
import Legal from "./pages/Legal";
import APIDocumentation from "@/pages/APIDocumentation";
import { SubscriptionDashboard } from "./pages/SubscriptionDashboard";
import { AuthChoice } from "./pages/AuthChoice";
import { AuthSignup } from "./pages/AuthSignup";
import { AuthLogin } from "./pages/AuthLogin";
import { AuthVerifyEmail } from "./pages/AuthVerifyEmail";
import AdminModeration from "./pages/AdminModeration";
import AdminIntegrations from "./pages/AdminIntegrations";
import AdminImport from "./pages/AdminImport";
import AdminImportsZip from "./pages/AdminImportsZip";
import AdminThumbnails from "./pages/AdminThumbnails";
import AdminCMS from "./pages/AdminCMS";
import { AuthCheckEmail } from "./pages/AuthCheckEmail";
import AuthSetPassword from "./pages/AuthSetPassword";
import AdminImportFormateurs from "./pages/AdminImportFormateurs";
import AdminSendFormateursEmails from "./pages/AdminSendFormateursEmails";
import AdminResourcesManagement from "./pages/AdminResourcesManagement";
import AdminCollectionsManagement from "./pages/AdminCollectionsManagement";
import { AdminImportPDFs } from "./pages/AdminImportPDFs";
import Help from "./pages/Help";
import LearningPaths from "./pages/LearningPaths";
import AdminLearningPaths from "./pages/AdminLearningPaths";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminAccessLevels from "./pages/AdminAccessLevels";
import AdminIfacALaUne from "@/pages/AdminIfacALaUne";
import { trpc } from "@/lib/trpc";

/* =========================================================
   ADMIN GUARD — VERSION PROPRE (sans appel tRPC de test)
   ========================================================= */
function AdminGuard({ children }: { children?: React.ReactNode }) {
  const { data: me, isLoading } = trpc.auth.me.useQuery();
  const [location, navigate] = useLocation();

  const isAdmin = (me as any)?.role === "admin";
  const isAdminPath = location === "/admin" || location.startsWith("/admin/");

  useEffect(() => {
    if (!isAdminPath) return;
    if (isLoading) return;
    if (!isAdmin) navigate("/");
  }, [isAdminPath, isLoading, isAdmin, navigate]);

  if (isLoading) return <>{children ?? null}</>;

  if (isAdminPath && !isAdmin) return <Redirect to="/" />;

  return <>{children ?? null}</>;
}

/* =========================================================
   ROUTER
   ========================================================= */
function Router() {
  return (
    <Switch>
      {/* Pages publiques */}
      <Route path="/" component={Home} />
      <Route path="/resources" component={ResourcesReorganized} />
      <Route path="/resources/:id" component={ResourceDetail} />
      <Route path="/ressources" component={ResourcesReorganized} />
      <Route path="/ressources/:id" component={ResourceDetail} />
      <Route path="/about" component={About} />

      {/* Auth */}
      <Route path="/auth/choice" component={AuthChoice} />
      <Route path="/auth/signup" component={AuthSignup} />
      <Route path="/auth/login" component={AuthLogin} />
      <Route path="/auth/verify-email" component={AuthVerifyEmail} />
      <Route path="/auth/check-email" component={AuthCheckEmail} />
      <Route path="/auth/set-password/:token" component={AuthSetPassword} />

      {/* Navigation */}
      <Route path="/profil/:profile" component={ProfileCategories} />
      <Route path="/besoin/:need" component={NeedCategories} />
      <Route path="/categorie/:type/:key/:category" component={CategoryResources} />

      {/* Utilisateur (actifs) */}
      <Route path="/bibliotheque" component={Library} />
      <Route path="/adhesion" component={Subscription} />
      <Route path="/gestion-adhesion" component={SubscriptionDashboard} />

      {/* ADMIN (actifs) */}
      <Route path="/admin/import">
        <AdminGuard>
          <AdminImport />
        </AdminGuard>
      </Route>
            <Route path="/admin/import-zip">
        <AdminGuard>
          <AdminImportsZip />
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
            <Route path="/admin/collections">
        <AdminGuard>
          <AdminCollectionsManagement />
        </AdminGuard>
      </Route>
      <Route path="/admin/collections">
  <AdminGuard>
    <AdminCollectionsManagement />
  </AdminGuard>
</Route>

      {/* ✅ Bonus : si quelqu’un tape /admin/resources (anglais ancien), on redirige vers la bonne page */}
      <Route path="/admin/resources">
        <Redirect to="/admin/resources-management" />
      </Route>

      {/* Thématiques */}
      <Route path="/admin/thematiques">
        <AdminGuard>
          <AdminThemes />
        </AdminGuard>
      </Route>

      {/* Taxonomie */}
      <Route path="/admin/categories">
        <AdminGuard>
          <AdminCategories />
        </AdminGuard>
      </Route>

      {/* ✅ Tolérance : ancienne faute de frappe -> route officielle */}
      <Route path="/admin/access-levelset">
        <Redirect to="/admin/access-levels" />
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
      <Route path="/admin/ifac-a-la-une">
        <AdminGuard>
          <AdminIfacALaUne />
        </AdminGuard>
      </Route>
      <Route path="/admin/parcours">
        <AdminGuard>
          <AdminLearningPaths />
        </AdminGuard>
      </Route>

      {/* ✅ Pages admin ressources (FR) */}
      <Route path="/admin/ressources">
        <AdminGuard>
          <AdminResources />
        </AdminGuard>
      </Route>

      {/* ✅ IMPORTANT : route explicite AVANT :id */}
      <Route path="/admin/ressources/nouvelle">
        <AdminGuard>
          <AdminResourceForm />
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

      {/* Divers */}
      <Route path="/faq" component={FAQ} />
      <Route path="/aide" component={Help} />
      <Route path="/parcours" component={LearningPaths} />
      <Route path="/legal" component={Legal} />
      <Route path="/api" component={APIDocumentation} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

/* =========================================================
   APP
   ========================================================= */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
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
