import { useMemo, useState } from "react";

export default function DrawTool() {
  const [input, setInput] = useState("Lina\nNoah\nCamille");
  const [result, setResult] = useState<string | null>(null);

  const items = useMemo(() => {
    return input
      .split("\n")
      .map((i) => i.trim())
      .filter(Boolean);
  }, [input]);

  const runDraw = () => {
    if (items.length === 0) {
      setResult("Ajoute au moins un élément");
      return;
    }

    const index = Math.floor(Math.random() * items.length);
    setResult(items[index]);
  };

  return (
    <div className="rounded-[28px] border border-border/50 bg-white/80 p-6 shadow-sm">
      <p className="text-sm font-semibold text-foreground">Tirage au sort</p>

      <textarea
        className="mt-4 w-full min-h-[120px] rounded-xl border p-2"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="mt-4 text-center text-lg font-bold text-primary">
        {result ?? "Aucun tirage"}
      </div>

      <button
        className="mt-4 w-full rounded-xl bg-primary px-4 py-2 text-white"
        onClick={runDraw}
      >
        Lancer le tirage
      </button>
    </div>
  );
}