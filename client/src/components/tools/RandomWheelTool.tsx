import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, RotateCw, Sparkles, Trash2 } from "lucide-react";

const DEFAULT_ITEMS = [
  "Jeu du prénom",
  "Défi mime",
  "Question surprise",
  "Mini challenge",
  "Jeu coopératif",
  "Ambiance musicale",
];

const WHEEL_COLORS = [
  "#4f46e5",
  "#7c3aed",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
];

type SpinState = {
  startRotation: number;
  targetRotation: number;
  startTime: number;
  duration: number;
  selectedIndex: number;
};

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function normalizeAngle(angle: number) {
  const full = Math.PI * 2;
  return ((angle % full) + full) % full;
}

export default function RandomWheelTool() {
  const [items, setItems] = useState<string[]>(DEFAULT_ITEMS);
  const [newItem, setNewItem] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const spinStateRef = useRef<SpinState | null>(null);

  const canSpin = items.length >= 2 && !isSpinning;

  const segments = useMemo(() => {
    const count = Math.max(items.length, 1);
    const angleSize = (Math.PI * 2) / count;

    return items.map((label, index) => ({
      label,
      color: WHEEL_COLORS[index % WHEEL_COLORS.length],
      startAngle: index * angleSize - Math.PI / 2,
      endAngle: (index + 1) * angleSize - Math.PI / 2,
      midAngle: index * angleSize + angleSize / 2 - Math.PI / 2,
      angleSize,
    }));
  }, [items]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = 520;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const center = size / 2;
    const outerRadius = 200;
    const innerRadius = 38;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(rotation);

    segments.forEach((segment, index) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, outerRadius, segment.startAngle, segment.endAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.stroke();

      ctx.save();
      ctx.rotate(segment.midAngle);

      const labelRadius = outerRadius * 0.62;
      ctx.translate(labelRadius, 0);

      const flipText =
        segment.midAngle > Math.PI / 2 || segment.midAngle < -Math.PI / 2;

      ctx.rotate(flipText ? Math.PI : 0);

      const pillHeight = 28;
      const maxTextWidth = 126;
      const pillWidth = 136;

      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.beginPath();
      const x = -pillWidth / 2;
      const y = -pillHeight / 2;
      const r = 14;

      ctx.moveTo(x + r, y);
      ctx.lineTo(x + pillWidth - r, y);
      ctx.quadraticCurveTo(x + pillWidth, y, x + pillWidth, y + r);
      ctx.lineTo(x + pillWidth, y + pillHeight - r);
      ctx.quadraticCurveTo(
        x + pillWidth,
        y + pillHeight,
        x + pillWidth - r,
        y + pillHeight
      );
      ctx.lineTo(x + r, y + pillHeight);
      ctx.quadraticCurveTo(x, y + pillHeight, x, y + pillHeight - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#1e293b";
      ctx.font = "600 12px Inter, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const text = segment.label;
      let displayText = text;

      while (ctx.measureText(displayText).width > maxTextWidth && displayText.length > 4) {
        displayText = `${displayText.slice(0, -2)}…`;
      }

      ctx.fillText(displayText, 0, 0);

      ctx.restore();

      if (index === 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.16)";
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.restore();
      }
    });

    const shine = ctx.createRadialGradient(-60, -80, 10, 0, 0, outerRadius);
    shine.addColorStop(0, "rgba(255,255,255,0.22)");
    shine.addColorStop(0.35, "rgba(255,255,255,0.08)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 5;
    ctx.strokeStyle = "white";
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "700 28px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦", 0, 2);

    ctx.restore();

    ctx.save();
    ctx.translate(center, center);

    ctx.beginPath();
    ctx.moveTo(0, -outerRadius - 16);
    ctx.lineTo(-16, -outerRadius + 10);
    ctx.lineTo(16, -outerRadius + 10);
    ctx.closePath();
    ctx.fillStyle = "#0f172a";
    ctx.fill();

    ctx.restore();
  }, [segments, rotation]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleAddItem = () => {
    const value = newItem.trim();
    if (!value) return;

    setItems((prev) => [...prev, value]);
    setNewItem("");
    setResult(null);
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setItems((prev) => prev.filter((_, index) => index !== indexToRemove));
    setResult(null);
  };

  const handleReset = () => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    spinStateRef.current = null;
    setItems(DEFAULT_ITEMS);
    setNewItem("");
    setResult(null);
    setIsSpinning(false);
    setRotation(0);
  };

  const handleSpin = () => {
    if (!canSpin) return;

    const selectedIndex = Math.floor(Math.random() * items.length);
    const sliceSize = (Math.PI * 2) / items.length;

    const targetCenterAngle = selectedIndex * sliceSize + sliceSize / 2;
    const normalizedCurrent = normalizeAngle(rotation);
    const targetNormalized = normalizeAngle(-targetCenterAngle);
    const extraTurns = Math.PI * 2 * 6;

    let delta = targetNormalized - normalizedCurrent;
    if (delta < 0) delta += Math.PI * 2;

    const finalTarget = rotation + delta + extraTurns;

    const startTime = performance.now();
    const duration = 4600;

    spinStateRef.current = {
      startRotation: rotation,
      targetRotation: finalTarget,
      startTime,
      duration,
      selectedIndex,
    };

    setIsSpinning(true);
    setResult(null);

    const animate = (now: number) => {
      const spinState = spinStateRef.current;
      if (!spinState) return;

      const elapsed = now - spinState.startTime;
      const progress = Math.min(elapsed / spinState.duration, 1);
      const eased = easeOutCubic(progress);

      const nextRotation =
        spinState.startRotation +
        (spinState.targetRotation - spinState.startRotation) * eased;

      setRotation(nextRotation);

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
        setIsSpinning(false);
        setRotation(spinState.targetRotation);
        setResult(items[spinState.selectedIndex]);
        spinStateRef.current = null;
      }
    };

    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = window.requestAnimationFrame(animate);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-7xl px-6 py-10">
        <section className="rounded-[32px] border border-border/50 bg-background/70 px-8 py-10 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-[6px]">
          <div className="max-w-3xl space-y-4">
            <p className="w-fit rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Boîte à outils animation
            </p>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Roue aléatoire
              </h1>

              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                Crée une roue personnalisée pour lancer un tirage, répartir une
                consigne, choisir un jeu ou dynamiser un temps d’animation.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[28px] border border-border/60 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Tirage visuel
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  Lance la roue
                </h2>
              </div>

              <button
                type="button"
                onClick={handleSpin}
                disabled={!canSpin}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCw className={`h-4 w-4 ${isSpinning ? "animate-spin" : ""}`} />
                {isSpinning ? "Rotation en cours..." : "Lancer la roue"}
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  className="max-w-full"
                  aria-label="Roue aléatoire"
                />
              </div>

              <div className="mt-8 w-full rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Résultat
                </p>

                <div className="mt-3 min-h-[88px] rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-4">
                  {result ? (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-500">La roue a sélectionné :</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{result}</p>
                      </div>

                      <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
                        Choix final
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[56px] items-center justify-center text-sm text-slate-500">
                      {isSpinning
                        ? "La roue tourne... suspense..."
                        : "Lance la roue pour afficher un résultat."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-border/60 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                Paramétrage
              </p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">
                Gérer les choix de la roue
              </h2>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddItem();
                  }
                }}
                placeholder="Ajouter un élément"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary"
              />

              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {items.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: WHEEL_COLORS[index % WHEEL_COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-slate-800">{item}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Réinitialiser
              </button>

              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                {items.length} élément{items.length > 1 ? "s" : ""}
              </div>
            </div>

            {items.length < 2 ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Ajoute au moins 2 éléments pour pouvoir lancer la roue.
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}