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
      className={`h-full hover:shadow-lg transition-shadow ${
        isLocked ? 'opacity-95 cursor-default' : 'cursor-pointer'
      }`}
    >
      <div className="relative h-48 bg-muted overflow-hidden rounded-t-lg">
        <img
          src={thumbnailSrc}
          alt={resource.title || 'Ressource'}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src.endsWith('/thumbnails/default-document.png')) return;
            img.src = '/thumbnails/default-document.png';
          }}
        />

        {isLocked && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Lock className="w-8 h-8 text-white" />
              <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">
                Ressource premium
              </span>
            </div>
          </div>
        )}
      </div>

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>

          <div className="flex gap-1 flex-shrink-0">
            {getAccessBadge(resource)}
          </div>
        </div>

        <CardDescription className="line-clamp-2">
          {resource.summary || 'Aucun résumé disponible'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-2">
          {resource.type && (
            <Badge variant="secondary" className="text-xs">
              {resource.type}
            </Badge>
          )}

          {resource.ageRange && (
            <Badge variant="secondary" className="text-xs">
              {resource.ageRange}
            </Badge>
          )}

          {resource.duration && (
            <Badge variant="secondary" className="text-xs">
              {resource.duration}
            </Badge>
          )}
        </div>

        {isLocked && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md space-y-3">
            <p className="text-sm text-amber-900">
              <strong>Ressource réservée aux adhérents ifac.</strong>
            </p>
            <p className="text-sm text-amber-800">
              Adhérez pour débloquer l’accès aux contenus premium de la ressourcerie.
            </p>

            <a
              href="https://adhesion.ifac.asso.fr/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex"
            >
              <Badge className="px-3 py-2 text-sm gap-2 cursor-pointer">
                Adhérer à ifac
                <ExternalLink className="w-4 h-4" />
              </Badge>
            </a>
          </div>
        )}

        {!isLocked && requiresAuth && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
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