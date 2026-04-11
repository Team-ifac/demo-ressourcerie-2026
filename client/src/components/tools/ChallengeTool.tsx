import { useMemo, useState } from "react";

const DEFAULT_CHALLENGES = [
  "Faire une grimace",
  "Imiter un animal",
  "Danser pendant 10 secondes",
  "Dire un mot rigolo",
  "Faire une statue",
  "Raconter une mini-histoire",
];

export default function ChallengeTool() {
  const [input, setInput] = useState(DEFAULT_CHALLENGES.join("\n"));
  const [result, setResult] = useState<string | null>(null);

  const challenges = useMemo(() => {
    return input
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [input]);

  const pickChallenge = () => {
    if (challenges.length === 0) {
      setResult("Ajoute au moins un défi.");
      return;
    }

    const index = Math.floor(Math.random() * challenges.length);
    setResult(challenges[index]);
  };

  return (
    <div className="rounded-[28px] border border-border/50 bg-white/80 p-6 shadow-sm">
      <div className="flex h-full flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Défis / brise-glace</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Saisis un défi par ligne puis lance un tirage aléatoire.
          </p>
        </div>

        <textarea
          className="min-h-[160px] rounded-2xl border border-border/50 bg-white px-3 py-3 text-sm shadow-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <div className="rounded-2xl border border-border/50 bg-primary/5 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Défi sélectionné
          </p>
          <div className="mt-2 text-lg font-bold text-primary">
            {result ?? "Aucun défi sélectionné"}
          </div>
        </div>

        <button
          className="rounded-xl bg-primary px-4 py-3 text-white text-sm font-semibold hover:opacity-90"
          onClick={pickChallenge}
        >
          Lancer un défi
        </button>
      </div>
    </div>
  );
}