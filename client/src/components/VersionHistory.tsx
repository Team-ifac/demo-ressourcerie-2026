import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Download, RotateCcw, Eye } from "lucide-react";

interface VersionEntry {
  versionNumber: number;
  title: string;
  changedBy: string;
  changeReason?: string;
  createdAt: string;
  isDraft: boolean;
  changes?: string[];
}

interface VersionHistoryProps {
  resourceId: string;
  versions: VersionEntry[];
  onRestore?: (versionNumber: number) => void;
  onView?: (versionNumber: number) => void;
}

export default function VersionHistory({ resourceId, versions, onRestore, onView }: VersionHistoryProps) {
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  const getStatusBadge = (isDraft: boolean) => {
    return isDraft ? (
      <Badge variant="outline" className="bg-yellow-50">
        Brouillon
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-green-50">
        Publié
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Historique des versions</h3>
        <span className="text-sm text-muted-foreground">{versions.length} version(s)</span>
      </div>

      <div className="space-y-2">
        {versions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Aucune version disponible</p>
            </CardContent>
          </Card>
        ) : (
          versions.map((version, index) => (
            <Card
              key={version.versionNumber}
              className={`cursor-pointer transition-all hover:shadow-md ${
                expandedVersion === version.versionNumber ? "ring-2 ring-primary" : ""
              }`}
            >
              <button
                onClick={() =>
                  setExpandedVersion(expandedVersion === version.versionNumber ? null : version.versionNumber)
                }
                className="w-full text-left"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-base">
                          Version {version.versionNumber}
                          {index === 0 && <Badge className="ml-2">Actuelle</Badge>}
                        </CardTitle>
                        {getStatusBadge(version.isDraft)}
                      </div>
                      <CardDescription className="text-sm">
                        <div className="space-y-1">
                          <p>
                            <span className="font-semibold">Titre :</span> {version.title}
                          </p>
                          <p>
                            <span className="font-semibold">Modifié par :</span> {version.changedBy}
                          </p>
                          <p>
                            <span className="font-semibold">Date :</span> {formatDate(version.createdAt)}
                          </p>
                          {version.changeReason && (
                            <p>
                              <span className="font-semibold">Raison :</span> {version.changeReason}
                            </p>
                          )}
                        </div>
                      </CardDescription>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
                        expandedVersion === version.versionNumber ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </CardHeader>
              </button>

              {expandedVersion === version.versionNumber && (
                <CardContent className="pt-0 space-y-4">
                  {version.changes && version.changes.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Modifications</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {version.changes.map((change, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    {onView && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(version.versionNumber)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Voir
                      </Button>
                    )}

                    {index !== 0 && onRestore && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRestore(version.versionNumber)}
                        className="gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restaurer
                      </Button>
                    )}

                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Télécharger
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {versions.length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3">
          <p>
            <strong>Note :</strong> Vous pouvez restaurer une version antérieure en cliquant sur le bouton "Restaurer".
            Cela créera une nouvelle version avec le contenu de l'ancienne version.
          </p>
        </div>
      )}
    </div>
  );
}
