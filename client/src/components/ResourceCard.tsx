import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Star, Globe, User, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';

interface ResourceCardProps {
  resource: any;
  hasSubscription?: boolean;
}

function getThumbnailUrl(resource: any): string {
  // 1) Image spécifique à la ressource si présente
  if (resource?.thumbnailUrl && typeof resource.thumbnailUrl === 'string' && resource.thumbnailUrl.trim()) {
    return resource.thumbnailUrl;
  }

  // 2) Fallback par profil
  const rawProfile =
    resource?.profileType ??
    resource?.profile ??
    resource?.profileName ??
    resource?.audience ??
    resource?.targetProfile ??
    resource?.ownerProfileType ??
    null;

  const profile = typeof rawProfile === 'string' ? rawProfile.toLowerCase() : '';

  if (profile.includes('animateur')) return '/thumbnails/profile-animateur.png';
  if (profile.includes('formateur')) return '/thumbnails/profile-formateur.png';
  if (profile.includes('directeur')) return '/thumbnails/profile-directeur.png';
  if (profile.includes('stagiaire')) return '/thumbnails/profile-stagiaire_bafa.png';
  if (profile.includes('bafa')) return '/thumbnails/profile-stagiaire_bafa.png';

  // 3) Fallback global
  return '/thumbnails/default-document.png';
}

function getAccessBadge(resource: any) {
  const level = String(resource?.accessLevel ?? 'PUBLIC').toUpperCase();

  if (level === 'PREMIUM') {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
        <Star className="w-3 h-3 mr-1" />
        Premium
      </Badge>
    );
  }

  if (level === 'INTERNAL_IFAC' || level === 'AUTHENTICATED') {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <User className="w-3 h-3 mr-1" />
        Connectés ifac
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
      <Globe className="w-3 h-3 mr-1" />
      Public
    </Badge>
  );
}

export function ResourceCard({ resource, hasSubscription = false }: ResourceCardProps) {
  const accessLevel = String(resource?.accessLevel ?? 'PUBLIC').toUpperCase();
  const isLocked = accessLevel === 'PREMIUM' && !hasSubscription;
  const requiresAuth = accessLevel === 'INTERNAL_IFAC' || accessLevel === 'AUTHENTICATED';

  const thumbnailSrc = getThumbnailUrl(resource);
  const targetHref = `/resources/${resource.id}`;

  const cardContent = (
    <Card
      className={`group h-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 ${
        isLocked
          ? "opacity-95 cursor-default"
          : "cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:border-border"
      }`}
    >
      <div className="relative h-52 overflow-hidden bg-muted/50">
        <img
          src={thumbnailSrc}
          alt={resource.title || "Ressource"}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src.endsWith("/thumbnails/default-document.png")) return;
            img.src = "/thumbnails/default-document.png";
          }}
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-2">
            {getAccessBadge(resource)}
          </div>
        </div>

        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2 rounded-xl bg-black/45 px-4 py-3 text-center">
              <Lock className="h-8 w-8 text-white" />
              <span className="text-xs font-medium text-white">
                Ressource premium
              </span>
            </div>
          </div>
        )}
      </div>

      <CardHeader className="space-y-3 p-5 pb-3">
        <CardTitle className="line-clamp-2 text-lg leading-snug text-foreground">
          {resource.title}
        </CardTitle>

        <CardDescription className="line-clamp-3 text-sm leading-6 text-muted-foreground">
          {resource.summary || "Aucun résumé disponible"}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 pt-0">
        <div className="flex flex-wrap gap-2">
          {resource.type && (
            <Badge variant="secondary" className="rounded-full text-xs">
              {resource.type}
            </Badge>
          )}

          {resource.ageRange && (
            <Badge variant="secondary" className="rounded-full text-xs">
              {resource.ageRange}
            </Badge>
          )}

          {resource.duration && (
            <Badge variant="secondary" className="rounded-full text-xs">
              {resource.duration}
            </Badge>
          )}
        </div>

        {isLocked && (
          <div className="mt-5 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">
              <strong>Ressource réservée aux adhérents ifac.</strong>
            </p>
            <p className="text-sm leading-6 text-amber-800">
              Adhérez pour débloquer l’accès aux contenus premium de la ressourcerie.
            </p>

            <a
              href="https://adhesion.ifac.asso.fr/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex"
            >
              <Badge className="gap-2 px-3 py-2 text-sm cursor-pointer">
                Adhérer à ifac
                <ExternalLink className="h-4 w-4" />
              </Badge>
            </a>
          </div>
        )}

        {!isLocked && requiresAuth && (
          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm leading-6 text-blue-800">
              <strong>Connexion requise</strong> pour ouvrir cette ressource.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLocked) {
    return cardContent;
  }

  return <Link href={targetHref}>{cardContent}</Link>;
}