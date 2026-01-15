import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Heart, LogOut, Settings, User, Moon, Sun, Search } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/resources?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/";
  };

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-ifac.png" alt="Logo IFAC" className="h-10 w-auto" />
            <span className="font-semibold text-xl">Ressourcerie IFAC</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link href="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                size="sm"
                className="text-base"
              >
                Accueil
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant={isActive("/about") ? "default" : "ghost"}
                size="sm"
                className="text-base"
              >
                À propos
              </Button>
            </Link>
            <Link href="/aide">
              <Button
                variant={isActive("/aide") ? "default" : "ghost"}
                size="sm"
                className="text-base"
              >
                Aide
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
            <form onSubmit={handleSearch} className="ml-4 flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                />
              </div>
            </form>
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
                      <span className="hidden sm:inline">{user.name || user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/parametres">
                        <Settings className="mr-2 h-4 w-4" />
                        Parametres
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
