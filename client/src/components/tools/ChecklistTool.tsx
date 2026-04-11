import { useMemo, useState } from "react";

type ActivityType = "sortie" | "piscine" | "grand-jeu" | "veillee";
type AgeGroup = "maternel" | "elementaire" | "ados";
type GroupSize = "petit" | "moyen" | "grand";

type ChecklistItem = {
  id: string;
  label: string;
};

const baseChecklists: Record<ActivityType, ChecklistItem[]> = {
  sortie: [
    { id: "sortie-1", label: "Liste des enfants à jour" },
    { id: "sortie-2", label: "Trousse de secours prête" },
    { id: "sortie-3", label: "Eau / gourdes prévues" },
    { id: "sortie-4", label: "Autorisations vérifiées" },
    { id: "sortie-5", label: "Point de rendez-vous défini" },
    { id: "sortie-6", label: "Comptage au départ prévu" },
    { id: "sortie-7", label: "Comptage au retour prévu" },
    { id: "sortie-8", label: "Consignes de sécurité annoncées" },
  ],
  piscine: [
    { id: "piscine-1", label: "Maillots et serviettes vérifiés" },
    { id: "piscine-2", label: "Changes prévus" },
    { id: "piscine-3", label: "Trousse de secours prête" },
    { id: "piscine-4", label: "Comptage avant entrée prévu" },
    { id: "piscine-5", label: "Comptage à la sortie prévu" },
    { id: "piscine-6", label: "Consignes vestiaires rappelées" },
    { id: "piscine-7", label: "Crème solaire disponible si besoin" },
    { id: "piscine-8", label: "Répartition des adultes claire" },
  ],
  "grand-jeu": [
    { id: "grand-jeu-1", label: "Règles du jeu prêtes et claires" },
    { id: "grand-jeu-2", label: "Matériel installé ou vérifié" },
    { id: "grand-jeu-3", label: "Zones de jeu définies" },
    { id: "grand-jeu-4", label: "Consignes de sécurité annoncées" },
    { id: "grand-jeu-5", label: "Répartition des rôles dans l’équipe" },
    { id: "grand-jeu-6", label: "Temps de jeu estimé" },
    { id: "grand-jeu-7", label: "Solution de repli prévue" },
    { id: "grand-jeu-8", label: "Temps de bilan prévu en fin d’activité" },
  ],
  veillee: [
    { id: "veillee-1", label: "Déroulé de la veillée prêt" },
    { id: "veillee-2", label: "Ambiance / installation préparée" },
    { id: "veillee-3", label: "Matériel utile vérifié" },
    { id: "veillee-4", label: "Consignes de sécurité rappelées" },
    { id: "veillee-5", label: "Temps calme de retour prévu" },
    { id: "veillee-6", label: "Transitions entre temps préparées" },
    { id: "veillee-7", label: "Répartition des adultes claire" },
    { id: "veillee-8", label: "Fin de veillée anticipée" },
  ],
};

const ageAdditions: Record<AgeGroup, ChecklistItem[]> = {
  maternel: [
    { id: "age-maternel-1", label: "Repères visuels simples prévus" },
    { id: "age-maternel-2", label: "Pauses fréquentes anticipées" },
    { id: "age-maternel-3", label: "Changes ou vêtements de rechange prévus" },
    { id: "age-maternel-4", label: "Consignes très courtes préparées" },
  ],
  elementaire: [
    { id: "age-elementaire-1", label: "Rôles simples possibles pour impliquer les enfants" },
    { id: "age-elementaire-2", label: "Consignes reformulables si besoin" },
    { id: "age-elementaire-3", label: "Temps de regroupement identifié" },
  ],
  ados: [
    { id: "age-ados-1", label: "Règles de cadre clairement posées" },
    { id: "age-ados-2", label: "Marge d’autonomie prévue" },
    { id: "age-ados-3", label: "Répartition des responsabilités possible" },
  ],
};

const sizeAdditions: Record<GroupSize, ChecklistItem[]> = {
  petit: [
    { id: "size-petit-1", label: "Temps de parole individuel possible" },
    { id: "size-petit-2", label: "Ajustements rapides prévus si besoin" },
  ],
  moyen: [
    { id: "size-moyen-1", label: "Répartition de la vigilance entre adultes pensée" },
    { id: "size-moyen-2", label: "Organisation des transitions anticipée" },
  ],
  grand: [
    { id: "size-grand-1", label: "Sous-groupes ou binômes prévus" },
    { id: "size-grand-2", label: "Répartition claire des adultes sur le groupe" },
    { id: "size-grand-3", label: "Consignes collectives + rappel en petits groupes prévus" },
    { id: "size-grand-4", label: "Comptages intermédiaires anticipés" },
  ],
};

const activityLabels: Record<ActivityType, string> = {
  sortie: "Sortie",
  piscine: "Piscine",
  "grand-jeu": "Grand jeu",
  veillee: "Veillée",
};

const ageLabels: Record<AgeGroup, string> = {
  maternel: "Maternel",
  elementaire: "Élémentaire",
  ados: "Ados",
};

const sizeLabels: Record<GroupSize, string> = {
  petit: "Petit groupe",
  moyen: "Groupe moyen",
  grand: "Grand groupe",
};

export default function ChecklistTool() {
  const [activityType, setActivityType] = useState<ActivityType>("sortie");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("elementaire");
  const [groupSize, setGroupSize] = useState<GroupSize>("moyen");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const generatedChecklist = useMemo(() => {
    return [
      ...baseChecklists[activityType],
      ...ageAdditions[ageGroup],
      ...sizeAdditions[groupSize],
    ];
  }, [activityType, ageGroup, groupSize]);

  const toggleItem = (id: string) => {
    setCheckedItems((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const resetChecklist = () => {
    setCheckedItems({});
  };

  const checkedCount = generatedChecklist.filter((item) => checkedItems[item.id]).length;

  return (
    <div className="rounded-[28px] border border-border/50 bg-white/80 p-6 shadow-sm md:col-span-2 xl:col-span-2">
      <div className="flex h-full flex-col gap-5">
        <div>
          <p className="text-sm font-semibold text-foreground">Checklist intelligente</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Choisis un contexte et génère une checklist adaptée à l’activité, à l’âge
            et à la taille du groupe.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Type d’activité
            </label>
            <select
              className="h-11 rounded-2xl border border-border/50 bg-white px-3 text-sm shadow-sm"
              value={activityType}
              onChange={(e) => {
                setActivityType(e.target.value as ActivityType);
                setCheckedItems({});
              }}
            >
              <option value="sortie">Sortie</option>
              <option value="piscine">Piscine</option>
              <option value="grand-jeu">Grand jeu</option>
              <option value="veillee">Veillée</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Tranche d’âge
            </label>
            <select
              className="h-11 rounded-2xl border border-border/50 bg-white px-3 text-sm shadow-sm"
              value={ageGroup}
              onChange={(e) => {
                setAgeGroup(e.target.value as AgeGroup);
                setCheckedItems({});
              }}
            >
              <option value="maternel">Maternel</option>
              <option value="elementaire">Élémentaire</option>
              <option value="ados">Ados</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Taille du groupe
            </label>
            <select
              className="h-11 rounded-2xl border border-border/50 bg-white px-3 text-sm shadow-sm"
              value={groupSize}
              onChange={(e) => {
                setGroupSize(e.target.value as GroupSize);
                setCheckedItems({});
              }}
            >
              <option value="petit">Petit groupe</option>
              <option value="moyen">Groupe moyen</option>
              <option value="grand">Grand groupe</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-slate-50/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Checklist générée
          </p>
          <p className="mt-2 text-sm text-slate-700">
            {activityLabels[activityType]} · {ageLabels[ageGroup]} · {sizeLabels[groupSize]}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {checkedCount} / {generatedChecklist.length} élément
            {generatedChecklist.length > 1 ? "s" : ""} coché
            {generatedChecklist.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="grid gap-3">
          {generatedChecklist.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 rounded-2xl border border-border/50 bg-white px-4 py-3 shadow-sm"
            >
              <input
                type="checkbox"
                checked={!!checkedItems[item.id]}
                onChange={() => toggleItem(item.id)}
                className="mt-1 h-4 w-4"
              />
              <span className="text-sm text-slate-700">{item.label}</span>
            </label>
          ))}
        </div>

        <button
          className="rounded-xl bg-primary px-4 py-3 text-white text-sm font-semibold hover:opacity-90"
          onClick={resetChecklist}
        >
          Réinitialiser la checklist
        </button>
      </div>
    </div>
  );
}