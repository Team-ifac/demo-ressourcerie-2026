import { useMemo, useState } from "react";
import { useRoute } from "wouter";

type SavedLock = {
  id: string;
  name: string;
  code: string;
  type?: "numbers" | "letters" | "mixed" | "colors" | "musical";
  length?: number;
  createdAt?: string;
  intro?: string;
  hints?: string[];
};

type ColorKey =
  | "ROUGE"
  | "BLEU"
  | "VERT"
  | "JAUNE"
  | "VIOLET"
  | "ORANGE"
  | "ROSE"
  | "NOIR"
  | "BLANC"
  | "GRIS";

const NUMBER_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const LETTER_KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MIXED_KEYS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

const COLOR_OPTIONS: Array<{
  key: ColorKey;
  label: string;
  bgClass: string;
}> = [
  { key: "ROUGE", label: "Rouge", bgClass: "bg-red-500" },
  { key: "BLEU", label: "Bleu", bgClass: "bg-blue-500" },
  { key: "VERT", label: "Vert", bgClass: "bg-emerald-500" },
  { key: "JAUNE", label: "Jaune", bgClass: "bg-yellow-400" },
  { key: "ORANGE", label: "Orange", bgClass: "bg-orange-500" },
  { key: "VIOLET", label: "Violet", bgClass: "bg-violet-500" },
  { key: "ROSE", label: "Rose", bgClass: "bg-pink-500" },
  { key: "NOIR", label: "Noir", bgClass: "bg-black" },
  { key: "BLANC", label: "Blanc", bgClass: "bg-white" },
  { key: "GRIS", label: "Gris", bgClass: "bg-slate-400" },
];

type MusicalOption = {
  key: string;
  label: string;
  frequency: number;
};

const MUSICAL_OPTIONS: MusicalOption[] = [
  { key: "DO", label: "Do", frequency: 261.63 },
  { key: "RE", label: "Ré", frequency: 293.66 },
  { key: "MI", label: "Mi", frequency: 329.63 },
  { key: "FA", label: "Fa", frequency: 349.23 },
  { key: "SOL", label: "Sol", frequency: 392.0 },
  { key: "LA", label: "La", frequency: 440.0 },
  { key: "SI", label: "Si", frequency: 493.88 },
];

export default function CodePlayTool() {
  const [, params] = useRoute("/tools/code-play/:id");

  const [attempt, setAttempt] = useState("");
  const [colorAttempt, setColorAttempt] = useState<ColorKey[]>([]);
  const [musicalAttempt, setMusicalAttempt] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const lockId = params?.id ?? "";

  const savedLock = useMemo(() => {
    if (!lockId) return null;
    const raw = localStorage.getItem(`lock_${lockId}`);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as SavedLock;
    } catch {
      return null;
    }
  }, [lockId]);

  const expectedLength = savedLock?.length ?? savedLock?.code.length ?? 0;

  const typeLabel =
    savedLock?.type === "numbers"
      ? "Code chiffres"
      : savedLock?.type === "letters"
      ? "Code lettres"
      : savedLock?.type === "mixed"
      ? "Code mixte"
      : savedLock?.type === "colors"
      ? "Code couleurs"
      : savedLock?.type === "musical"
      ? "Code musical"
      : "Cadenas";

  const colorCode = useMemo(() => {
    if (savedLock?.type !== "colors") return [];
    return savedLock.code
      .split("-")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean) as ColorKey[];
  }, [savedLock]);

  const musicalCode = useMemo(() => {
    if (savedLock?.type !== "musical") return [];
    return savedLock.code
      .split("-")
      .map((n) => n.trim().toUpperCase())
      .filter(Boolean);
  }, [savedLock]);

  const normalizedAttempt = useMemo(() => {
    return attempt.trim().toUpperCase();
  }, [attempt]);

  const playTone = (frequency: number) => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gainNode.gain.value = 0.08;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();

      window.setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 250);
    } catch {
      // ignore audio errors
    }
  };

  const handleCheck = () => {
    if (!savedLock) return;

    if (savedLock.type === "colors") {
      const proposed = colorAttempt.join("-");
      const expected = colorCode.join("-");
      setStatus(proposed === expected ? "success" : "error");
      return;
    }

    if (savedLock.type === "musical") {
      const proposed = musicalAttempt.join("-");
      const expected = musicalCode.join("-");
      setStatus(proposed === expected ? "success" : "error");
      return;
    }

    setStatus(
      normalizedAttempt === savedLock.code.trim().toUpperCase()
        ? "success"
        : "error"
    );
  };

  const handleReset = () => {
    setAttempt("");
    setColorAttempt([]);
    setMusicalAttempt([]);
    setStatus("idle");
  };

  const revealNextHint = () => {
    if (!savedLock?.hints) return;
    if (revealedHints < savedLock.hints.length) {
      setRevealedHints((prev) => prev + 1);
    }
  };

  const handleNumberPress = (value: string) => {
    if (!savedLock) return;
    if ((savedLock.type ?? "numbers") !== "numbers") return;
    if (attempt.length >= expectedLength) return;

    setPressedKey(value);
    setAttempt((prev) => prev + value);
    setStatus("idle");

    window.setTimeout(() => {
      setPressedKey((current) => (current === value ? null : current));
    }, 120);
  };

  const handleLetterPress = (value: string) => {
    if (!savedLock) return;
    if (savedLock.type !== "letters") return;
    if (attempt.length >= expectedLength) return;

    setPressedKey(value);
    setAttempt((prev) => prev + value);
    setStatus("idle");

    window.setTimeout(() => {
      setPressedKey((current) => (current === value ? null : current));
    }, 120);
  };

  const handleMixedPress = (value: string) => {
    if (!savedLock) return;
    if (savedLock.type !== "mixed") return;
    if (attempt.length >= expectedLength) return;

    setPressedKey(value);
    setAttempt((prev) => prev + value);
    setStatus("idle");

    window.setTimeout(() => {
      setPressedKey((current) => (current === value ? null : current));
    }, 120);
  };

  const handleDelete = () => {
    setAttempt((prev) => prev.slice(0, -1));
    setStatus("idle");
  };

  const handleColorPress = (color: ColorKey) => {
    if (!savedLock) return;
    if (savedLock.type !== "colors") return;
    if (colorAttempt.length >= expectedLength) return;

    setColorAttempt((prev) => [...prev, color]);
    setStatus("idle");
  };

  const handleColorDelete = () => {
    setColorAttempt((prev) => prev.slice(0, -1));
    setStatus("idle");
  };

  const handleMusicalPress = (note: MusicalOption) => {
    if (!savedLock) return;
    if (savedLock.type !== "musical") return;
    if (musicalAttempt.length >= expectedLength) return;

    playTone(note.frequency);
    setMusicalAttempt((prev) => [...prev, note.key]);
    setStatus("idle");
  };

  const handleMusicalDelete = () => {
    setMusicalAttempt((prev) => prev.slice(0, -1));
    setStatus("idle");
  };

  const renderCodeSlots = () => {
    if (savedLock?.type === "colors") {
      return Array.from({ length: expectedLength }).map((_, index) => {
        const currentColor = colorAttempt[index];
        const colorConfig = COLOR_OPTIONS.find((item) => item.key === currentColor);

        return (
          <div
            key={index}
            className={`flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-sm transition-all ${
              colorConfig
                ? `${colorConfig.bgClass} ${
                    currentColor === "BLANC"
                      ? "border-slate-300"
                      : "border-transparent"
                  }`
                : status === "success"
                ? "border-emerald-300 bg-emerald-50"
                : status === "error"
                ? "border-red-300 bg-red-50"
                : "border-slate-200 bg-white"
            }`}
          >
            {!colorConfig ? <span className="text-slate-400 text-lg">?</span> : null}
          </div>
        );
      });
    }

    if (savedLock?.type === "musical") {
      return Array.from({ length: expectedLength }).map((_, index) => {
        const current = musicalAttempt[index];

        return (
          <div
            key={index}
            className={`flex h-14 min-w-[56px] items-center justify-center rounded-2xl border px-2 text-sm font-bold shadow-sm transition-all ${
              status === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : status === "error"
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-slate-200 bg-white text-slate-800"
            }`}
          >
            {current || "♪"}
          </div>
        );
      });
    }

    return Array.from({ length: expectedLength }).map((_, index) => {
      const char = normalizedAttempt[index] ?? "";

      return (
        <div
          key={index}
          className={`flex h-14 w-12 items-center justify-center rounded-2xl border text-xl font-bold shadow-sm transition-all ${
            status === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : status === "error"
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-slate-200 bg-white text-slate-800"
          }`}
        >
          {char || "•"}
        </div>
      );
    });
  };

  const renderNumericPad = () => {
    const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {keys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleNumberPress(key)}
              className={`h-16 rounded-2xl border text-2xl font-bold shadow-sm transition-all active:scale-[0.98] ${
                pressedKey === key
                  ? "border-primary bg-primary text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-800 hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex h-14 min-w-[90px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            Effacer
          </button>

          <button
            type="button"
            onClick={() => handleNumberPress("0")}
            className={`inline-flex h-16 w-20 items-center justify-center rounded-2xl border text-2xl font-bold shadow-sm transition-all active:scale-[0.98] ${
              pressedKey === "0"
                ? "border-primary bg-primary text-white shadow-md"
                : "border-slate-200 bg-white text-slate-800 hover:border-primary/40 hover:bg-primary/5"
            }`}
          >
            0
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-14 min-w-[90px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    );
  };

  const renderLettersPad = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 xl:grid-cols-7">
          {LETTER_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleLetterPress(key)}
              className={`h-12 rounded-2xl border text-base font-bold shadow-sm transition-all active:scale-[0.98] ${
                pressedKey === key
                  ? "border-primary bg-primary text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-800 hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Effacer
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    );
  };

  const renderMixedPad = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 xl:grid-cols-8">
          {MIXED_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleMixedPress(key)}
              className={`h-12 rounded-2xl border text-base font-bold shadow-sm transition-all active:scale-[0.98] ${
                pressedKey === key
                  ? "border-primary bg-primary text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-800 hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Effacer
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    );
  };

  const renderColorPad = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color.key}
              type="button"
              onClick={() => handleColorPress(color.key)}
              className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-col items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-full border-2 ${color.bgClass} ${
                    color.key === "BLANC" ? "border-slate-300" : "border-transparent"
                  }`}
                />
                <span className="text-sm font-semibold text-slate-700">
                  {color.label}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleColorDelete}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Effacer la dernière couleur
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    );
  };

  const renderMusicalPad = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {MUSICAL_OPTIONS.map((note) => (
            <button
              key={note.key}
              type="button"
              onClick={() => handleMusicalPress(note)}
              className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
                  ♪
                </div>
                <span className="text-base font-semibold text-slate-800">
                  {note.label}
                </span>
                <span className="text-xs text-slate-500">Jouer</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleMusicalDelete}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Effacer la dernière note
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    );
  };

  if (!savedLock) {
    return <div className="p-6 text-center">❌ Cadenas introuvable</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] space-y-8">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            {typeLabel}
          </div>

          <h1 className="text-3xl font-bold">
            🔐 {savedLock.name || "Cadenas"}
          </h1>

          {savedLock.intro ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
              {savedLock.intro}
            </div>
          ) : null}

          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Entre la bonne combinaison pour ouvrir le cadenas. Chaque tentative
            doit contenir exactement {expectedLength} élément
            {expectedLength > 1 ? "s" : ""}.
          </p>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap justify-center gap-2">{renderCodeSlots()}</div>

          {savedLock.type === "colors" ? (
            <div className="mx-auto max-w-xl space-y-4">
              {renderColorPad()}
              <button
                type="button"
                onClick={handleCheck}
                className="w-full rounded-2xl bg-black px-4 py-4 text-base font-semibold text-white transition hover:opacity-90"
              >
                Tester la séquence
              </button>
            </div>
          ) : savedLock.type === "musical" ? (
            <div className="mx-auto max-w-xl space-y-4">
              {renderMusicalPad()}
              <button
                type="button"
                onClick={handleCheck}
                className="w-full rounded-2xl bg-black px-4 py-4 text-base font-semibold text-white transition hover:opacity-90"
              >
                Tester la séquence
              </button>
            </div>
          ) : savedLock.type === "letters" ? (
            <div className="mx-auto max-w-2xl space-y-4">
              {renderLettersPad()}
              <button
                type="button"
                onClick={handleCheck}
                className="w-full rounded-2xl bg-black px-4 py-4 text-base font-semibold text-white transition hover:opacity-90"
              >
                Tester le code
              </button>
            </div>
          ) : savedLock.type === "mixed" ? (
            <div className="mx-auto max-w-2xl space-y-4">
              {renderMixedPad()}
              <button
                type="button"
                onClick={handleCheck}
                className="w-full rounded-2xl bg-black px-4 py-4 text-base font-semibold text-white transition hover:opacity-90"
              >
                Tester le code
              </button>
            </div>
          ) : (
            <div className="mx-auto max-w-sm space-y-4">
              {renderNumericPad()}
              <button
                type="button"
                onClick={handleCheck}
                className="w-full rounded-2xl bg-black px-4 py-4 text-base font-semibold text-white transition hover:opacity-90"
              >
                Tester le code
              </button>
            </div>
          )}
        </div>

        {status === "success" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-700 font-semibold shadow-sm">
            ✅ Bravo, le cadenas est ouvert.
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-red-700 font-semibold shadow-sm">
            ❌ Mauvaise combinaison. Essaie encore.
          </div>
        )}

        {savedLock.hints && savedLock.hints.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground">
                🧩 Indices
              </h2>

              {revealedHints < savedLock.hints.length && (
                <button
                  type="button"
                  onClick={revealNextHint}
                  className="rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-primary transition hover:bg-primary/15"
                >
                  Demander un indice
                </button>
              )}
            </div>

            {revealedHints === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun indice révélé pour le moment.
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-700">
                {savedLock.hints.slice(0, revealedHints).map((hint, index) => (
                  <li key={index} className="rounded-xl bg-slate-50 px-4 py-3">
                    • {hint}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}