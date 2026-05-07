import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Heart,
  LogOut,
  Settings,
  User,
  Moon,
  Sun,
  ExternalLink,
  BookOpen,
  ChevronDown,
  Home,
  CircleHelp,
  Route,
  Info,
  Wrench,
} from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";

export function Header() {
  const { user, isAuthenticated, loading } = useAuth();
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/";
  };

  const isActive = (path: string) => location === path;

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "";

  const navItems = [
    {
      href: "/",
      label: "Accueil",
      icon: Home,
    },
    {
      href: "/resources",
      label: "Catalogue",
      icon: BookOpen,
    },
    {
      href: "/tools",
      label: "Outils",
      icon: Wrench,
    },
    {
      href: "/aide",
      label: "FAQ",
      icon: CircleHelp,
    },
    {
      href: "/parcours",
      label: "Parcours",
      icon: Route,
    },
    {
      href: "/about",
      label: "À propos",
      icon: Info,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-[1880px]">
        <div className="flex min-h-[82px] items-center justify-between rounded-[30px] border border-white/50 bg-background/82 px-4 shadow-[0_14px_40px_rgba(15,23,42,0.10)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/72 sm:px-5 lg:px-6">
          {/* Zone gauche */}
          <div className="flex min-w-0 items-center gap-4 lg:gap-6">
            <Link href="/" className="flex shrink-0 items-center">
              <div className="flex h-13 items-center rounded-[22px] border border-border/60 bg-white/80 px-3.5 py-2 shadow-sm transition-all hover:shadow-md">
                <img src="/logo-ifac.png" alt="Logo ifac" className="h-10 w-auto" />
              </div>
            </Link>

            <nav className="hidden items-center gap-2 xl:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      className={`inline-flex h-12 items-center gap-2.5 rounded-full border px-5 text-[15px] font-semibold transition-all duration-300 ${
                        active
                          ? "border-primary/30 bg-gradient-to-r from-sky-400/50 via-blue-400/45 to-violet-400/50 text-primary shadow-md ring-1 ring-white/40"
                          : "border-primary/15 bg-gradient-to-r from-sky-200/50 via-blue-100/45 to-violet-200/50 text-foreground/85 shadow-sm hover:border-primary/25 hover:from-sky-300/60 hover:via-blue-200/55 hover:to-violet-300/60 hover:text-foreground hover:shadow-md"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          active ? "text-primary" : "text-foreground/70"
                        }`}
                      />
                      <span>{item.label}</span>
                    </button>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Zone droite */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">

            {toggleTheme && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-12 w-12 rounded-full border border-border/50 bg-white/55 text-foreground/75 shadow-sm hover:bg-white/85 hover:text-foreground"
                title={theme === "light" ? "Mode sombre" : "Mode clair"}
              >
                {theme === "light" ? (
                  <Moon className="h-4.5 w-4.5" />
                ) : (
                  <Sun className="h-4.5 w-4.5" />
                )}
              </Button>
            )}

            {loading ? (
              <div className="h-12 w-32 animate-pulse rounded-full bg-muted" />
            ) : isAuthenticated && user ? (
              <>
                <Link href="/bibliotheque">
                  <button className="hidden h-12 items-center gap-2.5 rounded-full border border-border/40 bg-white/55 px-4 text-[15px] font-medium text-foreground/80 shadow-sm transition-all hover:bg-white/85 hover:text-foreground xl:inline-flex">
                    <Heart className="h-4 w-4" />
                    <span>Ma bibliothèque</span>
                  </button>
                </Link>

                <div className="hidden xl:block">
                  <NotificationCenter />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex h-12 items-center gap-3 rounded-full border border-border/60 bg-white/80 px-3.5 shadow-sm transition-all hover:bg-white hover:shadow-md">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-sm font-bold text-primary">
                        {(displayName?.charAt(0) || "U").toUpperCase()}
                      </div>

                      <div className="hidden min-w-0 sm:block">
                        <div className="max-w-[180px] truncate text-sm font-semibold text-foreground">
                          {displayName}
                        </div>
                      </div>

                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="mt-2 w-64 rounded-2xl border border-border/60 bg-background/95 p-2 shadow-xl backdrop-blur-xl"
                  >
                    <div className="px-2 py-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link href="/bibliotheque">
                        <Heart className="mr-2 h-4 w-4" />
                        Ma bibliothèque
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link href="/gestion-adhesion">
                        <Settings className="mr-2 h-4 w-4" />
                        Gérer mon adhésion
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="rounded-xl lg:hidden">
                      <a
                        href="https://adhesion.ifac.asso.fr/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Adhérer à ifac
                      </a>
                    </DropdownMenuItem>

                    {user.role === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="rounded-xl">
                          <Link href="/admin">
                            <User className="mr-2 h-4 w-4" />
                            Administration
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="rounded-xl text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <a
                  href="https://adhesion.ifac.asso.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden lg:block"
                >
                  <Button className="h-12 rounded-full px-5 text-[15px] font-semibold shadow-sm shadow-primary/20">
                    Adhérer à ifac
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>

                <Link href="/auth/choice">
                  <Button
                    variant="outline"
                    className="h-12 rounded-full border-border/60 bg-white/80 px-5 text-[15px] font-semibold shadow-sm"
                  >
                    Connexion
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}