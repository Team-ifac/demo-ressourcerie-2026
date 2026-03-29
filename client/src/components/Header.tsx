import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Heart, LogOut, Settings, User, Moon, Sun, ExternalLink, BookOpen } from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";
import { AdvancedSearch } from "@/components/AdvancedSearch";
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

  const displayInitial = (displayName?.charAt(0) || "U").toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <img src="/logo-ifac.png" alt="Logo ifac" className="h-10 w-auto" />
          </Link>

          <nav className="flex items-center gap-1">
            <Link href="/">
              <Button
                variant={isActive("/") ? "secondary" : "ghost"}
                size="sm"
                className="text-base"
              >
                Accueil
              </Button>
            </Link>

            <Link href="/resources">
              <Button
                variant={isActive("/resources") ? "default" : "ghost"}
                size="sm"
                className="text-base gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Catalogue
              </Button>
            </Link>

            <Link href="/aide">
              <Button
                variant={isActive("/aide") ? "default" : "ghost"}
                size="sm"
                className="text-base"
              >
                FAQ
              </Button>
            </Link>

            <Link href="/parcours">
              <Button
                variant={isActive("/parcours") ? "default" : "ghost"}
                size="sm"
                className="text-base"
              >
                Parcours
              </Button>
            </Link>

            <a
              href="https://adhesion.ifac.asso.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2"
            >
              <Button size="sm" className="text-base gap-2">
                Adhérer à ifac
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>

            <Link href="/about">
              <Button
                variant={isActive("/about") ? "default" : "ghost"}
                size="sm"
                className="ml-1 text-base"
              >
                À propos
              </Button>
            </Link>

            <div className="ml-4 flex items-center">
              <AdvancedSearch compact placeholder="Rechercher..." />
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {toggleTheme && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="gap-2"
              title={theme === "light" ? "Mode sombre" : "Mode clair"}
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
          )}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-9 w-24 animate-pulse bg-muted rounded-md" />
            ) : isAuthenticated && user ? (
              <>
                <Link href="/bibliotheque">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Heart className="h-4 w-4" />
                    <span className="hidden sm:inline">Ma bibliothèque</span>
                  </Button>
                </Link>

                <NotificationCenter />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{displayName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm">
                      <p className="font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/gestion-adhesion">
                        <Settings className="mr-2 h-4 w-4" />
                        Gérer mon adhésion
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <Settings className="mr-2 h-4 w-4" />
                            Administration
                          </Link>
                        </DropdownMenuItem>

                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/auth/choice">
                <Button size="sm">Connexion</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
