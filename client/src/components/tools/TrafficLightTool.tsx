import { useEffect, useMemo, useState } from "react";
import { Play, RotateCcw, Timer } from "lucide-react";
type LightColor = "green" | "orange" | "red";
type SequenceStep = "idle" | "red" | "orange" | "green";

const LIGHT_CONFIG: Record<
  LightColor,
  {
    label: string;
    subtitle: string;
    bg: string;
    soft: string;
    border: string;
    text: string;
    instruction: string;
  }
> = {
  green: {
    label: "VERT",
    subtitle: "Départ",
    bg: "bg-emerald-500",
    soft: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    instruction: "C’est parti. Le groupe peut démarrer l’action.",
  },
  orange: {
    label: "ORANGE",
    subtitle: "Préparez-vous",
    bg: "bg-amber-400",
    soft: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    instruction: "On se prépare. Le départ approche.",
  },
  red: {
    label: "ROUGE",
    subtitle: "Attente",
    bg: "bg-rose-500",
    soft: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    instruction: "On attend le signal. Pas encore de départ.",
  },
};

function formatSeconds(value: number) {
  return `${value}s`;
}

function TrafficLightLamp({
  color,
  active,
}: {
  color: LightColor;
  active: boolean;
}) {
  const config = LIGHT_CONFIG[color];

  return (
    <div className="relative flex items-center justify-center">
      {active ? (
        <div
          className={`absolute h-28 w-28 rounded-full blur-2xl opacity-60 ${config.bg}`}
        />
      ) : null}

      <div
        className={`relative h-24 w-24 rounded-full border-[6px] transition-all duration-500 ${
          active
            ? `${config.bg} border-white shadow-[inset_0_-6px_12px_rgba(0,0,0,0.3),inset_0_6px_12px_rgba(255,255,255,0.25),0_8px_25px_rgba(0,0,0,0.35)] scale-105`
            : "bg-slate-300 border-slate-400 shadow-inner opacity-40"
        }`}
      >
        <div className="absolute inset-2 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.9),transparent_45%)]" />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.25))]" />
      </div>
    </div>
  );
}

export default function TrafficLightTool() {
  const [selectedDuration, setSelectedDuration] = useState<number>(3);
  const [remaining, setRemaining] = useState<number>(3);
  const [sequenceStep, setSequenceStep] = useState<SequenceStep>("idle");
  const [isRunning, setIsRunning] = useState(false);

  const beepSound = useMemo(() => new Audio("/sounds/beep.mp3"), []);
  const goSound = useMemo(() => new Audio("/sounds/go.mp3"), []);

  const currentColor: LightColor = useMemo(() => {
    if (sequenceStep === "idle") return "red";
    return sequenceStep;
  }, [sequenceStep]);

  const currentConfig = useMemo(() => {
    return LIGHT_CONFIG[currentColor];
  }, [currentColor]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    if (remaining > 0) return;

    if (sequenceStep === "red") {
      beepSound.currentTime = 0;
      void beepSound.play();

      setSequenceStep("orange");
      setRemaining(selectedDuration);
      return;
    }

    if (sequenceStep === "orange") {
      goSound.currentTime = 0;

      window.setTimeout(() => {
        void goSound.play();
      }, 120);

      setSequenceStep("green");
      setIsRunning(false);
      setRemaining(0);
    }
  }, [remaining, isRunning, sequenceStep, selectedDuration, beepSound, goSound]);

  const handleStart = () => {
    beepSound.currentTime = 0;
    void beepSound.play();

    setSequenceStep("red");
    setRemaining(selectedDuration);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSequenceStep("idle");
    setRemaining(selectedDuration);
  };

  const handleDurationChange = (value: number) => {
    setSelectedDuration(value);
    setIsRunning(false);
    setSequenceStep("idle");
    setRemaining(value);
  };

  const messageTitle =
    sequenceStep === "idle"
      ? "Prêt au lancement"
      : currentColor === "green"
      ? "GO !"
      : currentConfig.label;

  const messageText =
    sequenceStep === "idle"
      ? "Choisis une durée, puis lance la séquence rouge → orange → vert."
      : currentConfig.instruction;

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
                Feu tricolore
              </h1>

              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                Un feu de départ visuel pour lancer une animation, un jeu, une
                course ou un temps collectif avec une séquence automatique
                rouge → orange → vert.
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
                  Séquence du feu
                </h2>
              </div>

              <div
                className={`rounded-full px-4 py-2 text-sm font-semibold ${currentConfig.soft} ${currentConfig.text}`}
              >
                {sequenceStep === "idle"
                  ? "EN ATTENTE"
                  : `${currentColor === "green" ? "GO !" : currentConfig.label} · ${currentConfig.subtitle}`}
              </div>
            </div>

            <div
              className={`rounded-[32px] border p-8 transition-all duration-500 ${
                currentConfig.soft
              } ${currentConfig.border} ${
                currentColor === "green"
                  ? "scale-[1.02] shadow-[0_0_80px_rgba(16,185,129,0.35)]"
                  : ""
              }`}
            >
              <div className="mx-auto flex w-full max-w-[240px] flex-col items-center rounded-[36px] bg-gradient-to-b from-slate-800 to-slate-950 px-8 py-10 shadow-[inset_0_4px_12px_rgba(255,255,255,0.05),0_25px_60px_rgba(0,0,0,0.45)]">
                <div className="space-y-6">
                  <TrafficLightLamp color="red" active={currentColor === "red"} />
                  <TrafficLightLamp
                    color="orange"
                    active={currentColor === "orange"}
                  />
                  <TrafficLightLamp
                    color="green"
                    active={currentColor === "green"}
                  />
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-white/60 bg-white/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  État de la séquence
                </p>

                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {messageTitle}
                </p>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {messageText}
                </p>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Timer className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Compte à rebours
                      </span>
                    </div>

                    <span className="text-lg font-bold text-slate-900">
                      {formatSeconds(remaining)}
                    </span>
                  </div>
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
                Durée de chaque couleur
              </h2>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[3, 4, 5, 6, 7, 8, 9, 10].map((value) => {
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
                    {value}s
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
                  Lancer la séquence
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

            <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">
                Fonctionnement
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Quand tu lances, le feu passe automatiquement au rouge, puis à
                l’orange, puis au vert. Le vert est le signal final de départ.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}