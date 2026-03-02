export const HISTORY_ACTION_LABELS: Record<string, string> = {
  created: "Création",
  updated: "Modification",
  deleted: "Suppression",
  bulk_updated: "Modif. en masse",
  comment_added: "Commentaire ajouté",
  status_changed: "Changement de statut",
  access_changed: "Changement d’accès",
  profiles_updated: "Profils mis à jour",
};

export function historyActionLabel(action?: string | null) {
  const a = String(action ?? "").trim();
  if (!a) return "—";
  return HISTORY_ACTION_LABELS[a] ?? a;
}