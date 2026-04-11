import { useState } from "react";
import { terrainActivities, type TerrainActivityCategory } from "@/components/tools/data/terrainActivities";

export default function TerrainModeTool() {
  const [result, setResult] = useState<string | null>(null);

  const handleClick = (type: TerrainActivityCategory) => {
    const list = terrainActivities.filter((activity) => activity.category === type);

    if (list.length === 0) {
      setResult("Aucune activité disponible pour cette catégorie.");
      return;
    }

    const choice = list[Math.floor(Math.random() * list.length)];

    setResult(
      `${choice.title} — ${choice.instruction} (${choice.duration}, ${choice.equipment}, ${choice.age})`
    );
  };

  return (
    <div className="rounded-[28px] border border-border/50 bg-white/80 p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Mode terrain</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Clique et lance directement une activité adaptée.
          </p>
        </div>

        <div className="grid gap-3">
          <button
            className="rounded-xl bg-primary px-4 py-3 text-white font-semibold"
            onClick={() => handleClick("rapide")}
          >
            ⚡ Activité rapide
          </button>

          <button
            className="rounded-xl bg-primary px-4 py-3 text-white font-semibold"
            onClick={() => handleClick("calme")}
          >
            😌 Calmer le groupe
          </button>

          <button
            className="rounded-xl bg-primary px-4 py-3 text-white font-semibold"
            onClick={() => handleClick("sansMateriel")}
          >
            🎒 Sans matériel
          </button>

          <button
            className="rounded-xl bg-primary px-4 py-3 text-white font-semibold"
            onClick={() => handleClick("groupeAgite")}
          >
            🔥 Groupe agité
          </button>
        </div>

        <div className="rounded-2xl border border-border/50 bg-primary/5 p-4 text-center">
          <p className="text-xs text-muted-foreground">Suggestion</p>
          <div className="mt-2 text-lg font-bold text-primary">
            {result ?? "Clique sur un bouton"}
          </div>
        </div>
      </div>
    </div>
  );
}