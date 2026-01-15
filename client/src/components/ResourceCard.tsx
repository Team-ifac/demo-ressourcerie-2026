import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Star } from 'lucide-react';
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
  // On essaie plusieurs champs possibles pour être robuste.
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

export function ResourceCard({ resource, hasSubscription = false }: ResourceCardProps) {
  const isLocked = resource.accessLevel === 'PREMIUM' && !hasSubscription;
  const requiresAuth = resource.accessLevel === 'AUTHENTICATED';

  const thumbnailSrc = getThumbnailUrl(resource);

  return (
    <Link href={isLocked ? '#' : `/resources/${resource.id}`}>
      <Card
        className={`h-full hover:shadow-lg transition-shadow cursor-pointer ${
          isLocked ? 'opacity-75' : ''
        }`}
      >
        {/* Thumbnail (toujours affiché avec fallback) */}
        <div className="relative h-48 bg-muted overflow-hidden rounded-t-lg">
          <img
            src={thumbnailSrc}
            alt={resource.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src.endsWith('/thumbnails/default-document.png')) return;
              img.src = '/thumbnails/default-document.png';
            }}
          />
          {isLocked && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>

            <div className="flex gap-1 flex-shrink-0">
              {resource.accessLevel === 'PUBLIC' && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Gratuit
                </Badge>
              )}
              {resource.accessLevel === 'AUTHENTICATED' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Compte
                </Badge>
              )}
              {resource.accessLevel === 'PREMIUM' && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <Star className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
          </div>

          <CardDescription className="line-clamp-2">{resource.summary}</CardDescription>
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
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <strong>Adhésion requise</strong> pour accéder à cette ressource premium
              </p>
            </div>
          )}

          {requiresAuth && !isLocked && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Compte requis</strong> pour accéder à cette ressource
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
