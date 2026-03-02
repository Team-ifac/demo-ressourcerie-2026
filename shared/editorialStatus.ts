export type StatusValue = "draft" | "pending" | "approved" | "rejected";

export const STATUS_LABELS: Record<StatusValue, string> = {
  draft: "Brouillon",
  pending: "En attente",
  approved: "Publiée",
  rejected: "Rejetée",
};

export const isStatusValue = (raw: unknown): raw is StatusValue => {
  return raw === "draft" || raw === "pending" || raw === "approved" || raw === "rejected";
};

export const normalizeStatus = (raw: unknown): StatusValue => {
  const s = String(raw ?? "").trim().toLowerCase();

  // ✅ Legacy → nouveau modèle (statut uniquement)
  // IMPORTANT : ne jamais confondre avec l’accès ("PUBLIC") / la visibilité.
  if (s === "approved" || s === "published" || s === "publiée" || s === "publie") return "approved";
  if (s === "pending" || s === "en attente" || s === "awaiting") return "pending";
  if (s === "rejected" || s === "rejetée" || s === "rejete") return "rejected";
  if (s === "draft" || s === "brouillon") return "draft";

  // ✅ Fallback sûr
  return "draft";
};

export const allowedNextStatuses = (current: StatusValue): StatusValue[] => {
  // ⚠️ Doit matcher la gouvernance backend (transitions strictes)
  switch (current) {
    case "draft":
      return ["draft", "pending"];
    case "pending":
      return ["pending", "approved", "rejected"];
    case "approved":
      return ["approved", "pending"];
    case "rejected":
      return ["rejected", "pending", "draft"];
    default:
      return [current];
  }
};
