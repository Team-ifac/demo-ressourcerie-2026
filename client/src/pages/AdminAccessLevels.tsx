import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Check, AlertCircle } from 'lucide-react';

type AccessLevel = 'PUBLIC' | 'AUTHENTICATED' | 'PREMIUM';

const ACCESS_LEVEL_COLORS: Record<AccessLevel, string> = {
  PUBLIC: 'bg-green-100 text-green-800',
  AUTHENTICATED: 'bg-blue-100 text-blue-800',
  PREMIUM: 'bg-purple-100 text-purple-800',
};

const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  PUBLIC: '🌍 Public (Tous)',
  AUTHENTICATED: '👤 Authentifié (Compte)',
  PREMIUM: '⭐ Premium (Adhésion)',
};

export function AdminAccessLevels() {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterLevel, setFilterLevel] = useState<AccessLevel | 'ALL'>('ALL');
  const [bulkLevel, setBulkLevel] = useState<AccessLevel>('PUBLIC');
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: resources, isLoading, refetch } = trpc.resources.list.useQuery({});
  const updateLevelMutation = trpc.accessLevels.updateLevel.useMutation();
  const updateMultipleMutation = trpc.accessLevels.updateMultiple.useMutation();
  const statsQuery = trpc.accessLevels.getStats.useQuery();

  // Filtrer les ressources
  const filteredResources = useMemo(() => {
    if (!resources) return [];
    
    return resources.filter((resource) => {
      const matchesSearch = resource.title.toLowerCase().includes(search.toLowerCase()) ||
        resource.summary.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterLevel === 'ALL' || resource.accessLevel === filterLevel;
      return matchesSearch && matchesFilter;
    });
  }, [resources, search, filterLevel]);

  // Gérer la sélection
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredResources.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredResources.map((r) => r.id));
    }
  };

  // Mettre à jour un niveau
  const handleUpdateLevel = async (resourceId: number, level: AccessLevel) => {
    setIsUpdating(true);
    try {
      await updateLevelMutation.mutateAsync({
        resourceId,
        accessLevel: level,
      });
      refetch();
    } finally {
      setIsUpdating(false);
    }
  };

  // Mettre à jour plusieurs niveaux
  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) return;
    
    setIsUpdating(true);
    try {
      await updateMultipleMutation.mutateAsync({
        resourceIds: selectedIds,
        accessLevel: bulkLevel,
      });
      setSelectedIds([]);
      refetch();
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestion des niveaux d'accès</h1>
        <p className="text-gray-600">
          Gérez qui peut accéder à chaque ressource
        </p>
      </div>

      {/* Statistiques */}
      {statsQuery.data && (
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(ACCESS_LEVEL_LABELS).map(([level, label]) => {
            const count = statsQuery.data?.find((s) => s.level === level)?.count || 0;
            return (
              <Card key={level} className="p-4">
                <div className="text-sm text-gray-600">{label}</div>
                <div className="text-2xl font-bold mt-2">{String(count)}</div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Chercher une ressource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select value={filterLevel} onValueChange={(v) => setFilterLevel(v as AccessLevel | 'ALL')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les niveaux</SelectItem>
              <SelectItem value="PUBLIC">Public</SelectItem>
              <SelectItem value="AUTHENTICATED">Authentifié</SelectItem>
              <SelectItem value="PREMIUM">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk update */}
        {selectedIds.length > 0 && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <strong>{selectedIds.length}</strong> ressource(s) sélectionnée(s)
              </div>
              <div className="flex gap-2">
                <Select value={bulkLevel} onValueChange={(v) => setBulkLevel(v as AccessLevel)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Choisir un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="AUTHENTICATED">Authentifié</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleBulkUpdate}
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Appliquer
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Liste des ressources */}
      <div className="space-y-2">
        {/* Header avec checkbox */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg font-semibold">
          <Checkbox
            checked={selectedIds.length === filteredResources.length && filteredResources.length > 0}
            onChange={toggleSelectAll}
          />
          <div className="flex-1">Ressource</div>
          <div className="w-40">Niveau actuel</div>
          <div className="w-48">Actions</div>
        </div>

        {/* Ressources */}
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="p-4">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedIds.includes(resource.id)}
                onChange={() => toggleSelect(resource.id)}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{resource.title}</div>
                <div className="text-sm text-gray-600 truncate">{resource.summary}</div>
              </div>
              <div className="w-40">
                <Badge className={ACCESS_LEVEL_COLORS[resource.accessLevel as AccessLevel]}>
                  {ACCESS_LEVEL_LABELS[resource.accessLevel as AccessLevel]}
                </Badge>
              </div>
              <div className="w-48 flex gap-2">
                {(['PUBLIC', 'AUTHENTICATED', 'PREMIUM'] as const).map((level) => (
                  <Button
                    key={level}
                    size="sm"
                    variant={resource.accessLevel === level ? 'default' : 'outline'}
                    onClick={() => handleUpdateLevel(resource.id, level)}
                    disabled={isUpdating}
                    className="text-xs"
                  >
                    {level === 'PUBLIC' ? '🌍' : level === 'AUTHENTICATED' ? '👤' : '⭐'}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        ))}

        {filteredResources.length === 0 && (
          <Card className="p-8 text-center text-gray-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Aucune ressource trouvée
          </Card>
        )}
      </div>
    </div>
  );
}
