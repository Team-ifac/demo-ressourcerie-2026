import { useEffect, useMemo, useState } from "react";
import { Play, RotateCcw, Timer } from "lucide-react";

const DURATIONS = [15, 30, 45, 60, 90, 120];

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  if (rest === 0) return `${minutes} min`;
  return `${minutes} min ${rest}s`;
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export default function HourglassTool() {
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [remaining, setRemaining] = useState<number>(30);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    if (remaining <= 0) {
      setIsRunning(false);
      return;
    }

    const interval = window.setInterval(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, remaining]);

  const progress = useMemo(() => {
    if (selectedDuration <= 0) return 0;
    return (selectedDuration - remaining) / selectedDuration;
  }, [remaining, selectedDuration]);

  const topSandHeight = `${Math.max(0, 100 - progress * 100)}%`;
  const bottomSandHeight = `${Math.min(100, progress * 100)}%`;

  const handleStart = () => {
    if (remaining <= 0) {
      setRemaining(selectedDuration);
    }
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemaining(selectedDuration);
  };

  const handleDurationChange = (value: number) => {
    setSelectedDuration(value);
    setRemaining(value);
    setIsRunning(false);
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
                Sablier
              </h1>

              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                Un repère visuel simple pour rythmer un défi, une transition, un
                temps calme ou une activité courte avec un groupe.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-border/60 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Affichage visuel
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  Sablier en cours
                </h2>
              </div>

              <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                {remaining > 0 ? "Temps en cours" : "Temps écoulé"}
              </div>
            </div>

            <div className="rounded-[32px] border border-amber-200 bg-[radial-gradient(circle_at_top,_rgba(255,251,235,1),_rgba(254,243,199,0.92)_45%,_rgba(255,237,213,0.9)_100%)] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_40px_rgba(245,158,11,0.12)]">
              <div className="mx-auto flex w-full max-w-[280px] flex-col items-center">
                <div className="relative h-[420px] w-[220px]">
                  <div className="absolute left-1/2 top-0 h-[28px] w-[176px] -translate-x-1/2 rounded-full bg-gradient-to-b from-slate-600 via-slate-800 to-slate-950 shadow-[inset_0_2px_4px_rgba(255,255,255,0.25),0_8px_18px_rgba(15,23,42,0.3)]" />
                  <div className="absolute bottom-0 left-1/2 h-[28px] w-[176px] -translate-x-1/2 rounded-full bg-gradient-to-t from-slate-600 via-slate-800 to-slate-950 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_-4px_16px_rgba(15,23,42,0.22)]" />

                  <div className="absolute left-1/2 top-[16px] h-[388px] w-[12px] -translate-x-1/2 rounded-full bg-gradient-to-b from-slate-500 via-slate-700 to-slate-950 shadow-[0_0_10px_rgba(15,23,42,0.15)]" />

                  <div className="absolute left-[18px] top-[28px] h-[364px] w-[16px] rounded-full bg-gradient-to-b from-slate-500 via-slate-700 to-slate-950 shadow-[inset_1px_0_2px_rgba(255,255,255,0.15)]" />
                  <div className="absolute right-[18px] top-[28px] h-[364px] w-[16px] rounded-full bg-gradient-to-b from-slate-500 via-slate-700 to-slate-950 shadow-[inset_-1px_0_2px_rgba(255,255,255,0.15)]" />

                  <div className="absolute left-1/2 top-[42px] h-[150px] w-[150px] -translate-x-1/2 overflow-hidden rounded-t-full border-4 border-white/80 bg-white/30 shadow-[inset_0_16px_30px_rgba(255,255,255,0.38),inset_0_-8px_18px_rgba(255,255,255,0.12),0_10px_24px_rgba(255,255,255,0.18)] backdrop-blur-[2px]">
                    <div
                      className="absolute bottom-0 left-0 w-full bg-gradient-to-b from-amber-200 via-orange-300 to-orange-500 transition-all duration-700"
                      style={{ height: topSandHeight }}
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_42%)]" />
                  </div>

                  <div className="absolute left-1/2 top-[186px] h-[34px] w-[10px] -translate-x-1/2 overflow-hidden rounded-full bg-white/55 shadow-[0_0_10px_rgba(255,255,255,0.35)]">
                    {remaining > 0 && isRunning ? (
                      <div className="h-full w-full animate-pulse bg-gradient-to-b from-yellow-200 via-amber-300 to-orange-500" />
                    ) : null}
                  </div>

                  <div className="absolute left-1/2 bottom-[42px] h-[150px] w-[150px] -translate-x-1/2 overflow-hidden rounded-b-full border-4 border-white/80 bg-white/30 shadow-[inset_0_-16px_30px_rgba(255,255,255,0.38),inset_0_8px_18px_rgba(255,255,255,0.12),0_10px_24px_rgba(255,255,255,0.18)] backdrop-blur-[2px]">
                    <div
                      className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-orange-600 via-amber-400 to-amber-200 transition-all duration-700"
                      style={{ height: bottomSandHeight }}
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_42%)]" />
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-white/80 bg-white/80 px-6 py-4 text-center shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-[3px]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Temps restant
                  </p>
                  <p className="mt-2 text-4xl font-bold text-slate-900">
                    {formatClock(remaining)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-border/60 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                Réglages
              </p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">
                Choisir une durée
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {DURATIONS.map((value) => {
                const active = selectedDuration === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleDurationChange(value)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {formatDuration(value)}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Contrôle
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={isRunning}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  Lancer
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Réinitialiser
                </button>
              </div>
            </div>

                          <div className="mt-6 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
                  <Timer className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Utilisation terrain
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Idéal pour un défi minute, un temps de rangement, une
                    transition, un débat court ou une activité autonome à durée
                    visible.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}