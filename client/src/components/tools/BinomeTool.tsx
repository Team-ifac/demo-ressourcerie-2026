import { useMemo, useState } from "react";

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export default function BinomeTool() {
  const [input, setInput] = useState("Lina\nNoah\nCamille\nYanis\nSarah");
  const [pairs, setPairs] = useState<string[][]>([]);

  const participants = useMemo(() => {
    return input
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [input]);

  const generatePairs = () => {
    if (participants.length === 0) {
      setPairs([]);
      return;
    }

    const shuffled = shuffleArray(participants);
    const result: string[][] = [];

    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        result.push([shuffled[i], shuffled[i + 1]]);
      } else {
        // cas impair → on ajoute au dernier groupe
        if (result.length > 0) {
          result[result.length - 1].push(shuffled[i]);
        } else {
          result.push([shuffled[i]]);
        }
      }
    }

    setPairs(result);
  };

  return (
    <div className="rounded-[28px] border border-border/50 bg-white/80 p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Générateur de binômes</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Saisis un prénom par ligne puis génère des binômes aléatoires.
          </p>
        </div>

        <textarea
          className="min-h-[140px] rounded-2xl border border-border/50 bg-white px-3 py-3 text-sm shadow-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button
          className="rounded-xl bg-primary px-4 py-3 text-white text-sm font-semibold hover:opacity-90"
          onClick={generatePairs}
        >
          Générer les binômes
        </button>

        <div className="grid gap-3">
          {pairs.length > 0 ? (
            pairs.map((pair, index) => (
              <div
                key={index}
                className="rounded-xl border border-border/50 bg-primary/5 p-3"
              >
                <p className="text-sm font-semibold text-foreground">
                  Binôme {index + 1}
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {pair.join(" / ")}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun binôme généré
            </p>
          )}
        </div>
      </div>
    </div>
  );
}