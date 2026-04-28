import { useMemo, useState } from "react";
import { Dices, RotateCw, Sparkles } from "lucide-react";

const MAX_DICE = 6;
const DICE_THEMES = [
  {
    bg: "from-blue-500 to-cyan-400",
    border: "border-blue-300",
    pip: "bg-white",
    glow: "shadow-[0_18px_40px_rgba(59,130,246,0.35)]",
    label: "text-blue-700",
  },
  {
    bg: "from-violet-500 to-fuchsia-400",
    border: "border-violet-300",
    pip: "bg-white",
    glow: "shadow-[0_18px_40px_rgba(139,92,246,0.35)]",
    label: "text-violet-700",
  },
  {
    bg: "from-emerald-500 to-lime-400",
    border: "border-emerald-300",
    pip: "bg-white",
    glow: "shadow-[0_18px_40px_rgba(16,185,129,0.35)]",
    label: "text-emerald-700",
  },
  {
    bg: "from-amber-400 to-orange-500",
    border: "border-amber-300",
    pip: "bg-white",
    glow: "shadow-[0_18px_40px_rgba(245,158,11,0.35)]",
    label: "text-orange-700",
  },
  {
    bg: "from-rose-500 to-pink-400",
    border: "border-rose-300",
    pip: "bg-white",
    glow: "shadow-[0_18px_40px_rgba(244,63,94,0.35)]",
    label: "text-rose-700",
  },
  {
    bg: "from-indigo-500 to-sky-500",
    border: "border-indigo-300",
    pip: "bg-white",
    glow: "shadow-[0_18px_40px_rgba(99,102,241,0.35)]",
    label: "text-indigo-700",
  },
];
function getRandomDiceValues(count: number) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
}

function getPipPositions(value: number) {
  const positions = {
    topLeft: false,
    topCenter: false,
    topRight: false,
    middleLeft: false,
    center: false,
    middleRight: false,
    bottomLeft: false,
    bottomCenter: false,
    bottomRight: false,
  };

  if (value === 1) {
    positions.center = true;
  }

  if (value === 2) {
    positions.topLeft = true;
    positions.bottomRight = true;
  }

  if (value === 3) {
    positions.topLeft = true;
    positions.center = true;
    positions.bottomRight = true;
  }

  if (value === 4) {
    positions.topLeft = true;
    positions.topRight = true;
    positions.bottomLeft = true;
    positions.bottomRight = true;
  }

  if (value === 5) {
    positions.topLeft = true;
    positions.topRight = true;
    positions.center = true;
    positions.bottomLeft = true;
    positions.bottomRight = true;
  }

  if (value === 6) {
    positions.topLeft = true;
    positions.topRight = true;
    positions.middleLeft = true;
    positions.middleRight = true;
    positions.bottomLeft = true;
    positions.bottomRight = true;
  }

  return positions;
}

function DiceFace({
  value,
  rolling,
  themeIndex,
}: {
  value: number;
  rolling: boolean;
  themeIndex: number;
}) {
  const pips = getPipPositions(value);
  const theme = DICE_THEMES[themeIndex % DICE_THEMES.length];
  const pipClassName = `h-4 w-4 rounded-full ${theme.pip}`;

  return (
    <div
      className={`relative grid h-28 w-28 grid-cols-3 grid-rows-3 rounded-[28px] border bg-gradient-to-br p-4 transition duration-200 ${theme.bg} ${theme.border} ${theme.glow} ${
        rolling ? "scale-[1.03] animate-pulse" : ""
      }`}
    >
      <div className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_40%)] pointer-events-none" />

      <div className="flex items-start justify-start">
        {pips.topLeft ? <span className={pipClassName} /> : null}
      </div>
      <div className="flex items-start justify-center">
        {pips.topCenter ? <span className={pipClassName} /> : null}
      </div>
      <div className="flex items-start justify-end">
        {pips.topRight ? <span className={pipClassName} /> : null}
      </div>

      <div className="flex items-center justify-start">
        {pips.middleLeft ? <span className={pipClassName} /> : null}
      </div>
      <div className="flex items-center justify-center">
        {pips.center ? <span className={pipClassName} /> : null}
      </div>
      <div className="flex items-center justify-end">
        {pips.middleRight ? <span className={pipClassName} /> : null}
      </div>

      <div className="flex items-end justify-start">
        {pips.bottomLeft ? <span className={pipClassName} /> : null}
      </div>
      <div className="flex items-end justify-center">
        {pips.bottomCenter ? <span className={pipClassName} /> : null}
      </div>
      <div className="flex items-end justify-end">
        {pips.bottomRight ? <span className={pipClassName} /> : null}
      </div>
    </div>
  );
}

export default function DiceTool() {
  const [diceCount, setDiceCount] = useState(2);
  const [values, setValues] = useState<number[]>([1, 1]);
  const [isRolling, setIsRolling] = useState(false);

  const total = useMemo(
    () => values.reduce((sum, value) => sum + value, 0),
    [values]
  );

  const handleRoll = () => {
    if (isRolling) return;

    setIsRolling(true);

    let ticks = 0;
    const interval = window.setInterval(() => {
      setValues(getRandomDiceValues(diceCount));
      ticks += 1;

      if (ticks >= 10) {
        window.clearInterval(interval);
        setValues(getRandomDiceValues(diceCount));
        setIsRolling(false);
      }
    }, 90);
  };

  const handleDiceCountChange = (count: number) => {
    setDiceCount(count);
    setValues(getRandomDiceValues(count));
    setIsRolling(false);
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
                Lanceur de dés
              </h1>

              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                Lance rapidement un ou plusieurs dés pour animer un jeu, faire un
                choix, attribuer des points ou créer une mécanique aléatoire simple.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-border/60 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Tirage visuel
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  Lance les dés
                </h2>
              </div>

              <button
                type="button"
                onClick={handleRoll}
                disabled={isRolling}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCw className={`h-4 w-4 ${isRolling ? "animate-spin" : ""}`} />
                {isRolling ? "Lancer en cours..." : "Lancer les dés"}
              </button>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 shadow-inner">
              <div className="flex min-h-[320px] flex-wrap items-center justify-center gap-8 rounded-[24px] border border-white/60 bg-gradient-to-br from-white/80 to-slate-100/60 p-8 backdrop-blur-sm shadow-[inset_0_8px_30px_rgba(0,0,0,0.05)]">
                {values.map((value, index) => {
                  const theme = DICE_THEMES[index % DICE_THEMES.length];

                  return (
                    <div
                      key={`${index}-${value}`}
                      className="flex flex-col items-center gap-2"
                    >
                      <DiceFace
                        value={value}
                        rolling={isRolling}
                        themeIndex={index}
                      />
                      <span
                        className={`text-xs font-semibold uppercase tracking-[0.08em] ${theme.label}`}
                      >
                        Dé {index + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Résultat détaillé
                </p>
                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {values.join(" · ")}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Total
                    </p>
                    <p className="mt-3 text-4xl font-bold text-slate-900">{total}</p>
                  </div>

                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
                    Résultat
                  </div>
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
                Choisir le nombre de dés
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: MAX_DICE }, (_, index) => {
                const count = index + 1;
                const isActive = diceCount === count;

                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleDiceCountChange(count)}
                    className={`rounded-2xl border px-4 py-4 text-sm font-semibold transition ${
                      isActive
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {count} dé{count > 1 ? "s" : ""}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                  <Dices className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Utilisation terrain
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Idéal pour attribuer des rôles, choisir une consigne,
                    départager, distribuer des points ou créer une petite
                    mécanique de hasard pendant une animation.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-violet-100 p-2 text-violet-700">
                  <Sparkles className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Conseil animation
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Utilise ce lanceur pour créer un départage rapide, choisir un
                    ordre de passage, attribuer un nombre d’actions ou lancer un mini-défi.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Le résultat est aléatoire. L’animation sert à rendre le tirage plus
              vivant visuellement.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}