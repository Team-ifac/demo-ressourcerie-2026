import { useEffect, useMemo, useState } from "react";

type LockMode = "numbers" | "letters" | "mixed" | "colors" | "musical";

type ModeCard = {
  id: LockMode;
  title: string;
  description: string;
  badge: string;
};

const MODE_CARDS: ModeCard[] = [
  {
    id: "numbers",
    title: "Code chiffres",
    description:
      "Un cadenas à combinaison numérique, parfait pour un coffre, une mission ou une énigme classique.",
    badge: "Clavier",
  },
  {
    id: "letters",
    title: "Code lettres",
    description:
      "Un mot ou une suite de lettres à retrouver, idéal pour un mot secret ou une énigme à thème.",
    badge: "Alphabet",
  },
  {
    id: "mixed",
    title: "Code mixte",
    description:
      "Un mélange de lettres et de chiffres pour augmenter la difficulté et varier les mécaniques.",
    badge: "Niveau +",
  },
  {
    id: "colors",
    title: "Code couleurs",
    description:
      "Une séquence de couleurs à mémoriser ou à retrouver, très adaptée aux enfants et aux défis visuels.",
    badge: "Fun",
  },
  {
    id: "musical",
    title: "Code musical",
    description:
      "Une séquence sonore à jouer ou à reconnaître, idéale pour une animation originale et mémorable.",
    badge: "Sonore",
  },
];

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

type ColorOption = {
  key: string;
  label: string;
  bgClass: string;
};

const COLOR_OPTIONS: ColorOption[] = [
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

export default function CodeGeneratorTool() {
  const [lockMode, setLockMode] = useState<LockMode>("numbers");
  const [lockName, setLockName] = useState("");
  const [savedLink, setSavedLink] = useState("");

  const [introText, setIntroText] = useState("");
  const [hint1, setHint1] = useState("");
  const [hint2, setHint2] = useState("");
  const [hint3, setHint3] = useState("");

  const [sequence, setSequence] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSequence([]);
    setSavedLink("");
    setCopied(false);
  }, [lockMode]);

  const activeMode = useMemo(() => {
    return MODE_CARDS.find((mode) => mode.id === lockMode) ?? MODE_CARDS[0];
  }, [lockMode]);

  const normalizedCode = useMemo(() => {
    if (lockMode === "colors" || lockMode === "musical") {
      return sequence.join("-");
    }
    return sequence.join("");
  }, [lockMode, sequence]);

  const previewSlots = useMemo(() => {
    return sequence.length > 0 ? sequence.length : 4;
  }, [sequence]);

  const previewLabel = useMemo(() => {
    if (lockMode === "numbers") return "Cadenas numérique";
    if (lockMode === "letters") return "Cadenas lettres";
    if (lockMode === "mixed") return "Cadenas mixte";
    if (lockMode === "colors") return "Cadenas couleurs";
    return "Cadenas musical";
  }, [lockMode]);

  const qrCodeUrl = useMemo(() => {
    if (!savedLink) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
      savedLink
    )}`;
  }, [savedLink]);

  const pushValue = (value: string) => {
    setSequence((prev) => [...prev, value]);
    setSavedLink("");
    setCopied(false);
  };

  const removeLastValue = () => {
    setSequence((prev) => prev.slice(0, -1));
    setSavedLink("");
    setCopied(false);
  };

  const resetSequence = () => {
    setSequence([]);
    setSavedLink("");
    setCopied(false);
  };

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

  const handleMusicalPress = (note: MusicalOption) => {
    playTone(note.frequency);
    pushValue(note.key);
  };

  const handleSave = () => {
    if (!lockName.trim() || !normalizedCode) {
      return;
    }

    const id = Date.now().toString();

    const lockData = {
      id,
      name: lockName.trim(),
      code: normalizedCode,
      type: lockMode,
      length: sequence.length,
      intro: introText,
      hints: [hint1, hint2, hint3].filter(Boolean),
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(`lock_${id}`, JSON.stringify(lockData));

    const link = `${window.location.origin}/tools/code-play/${id}`;
    setSavedLink(link);
    setCopied(false);
  };

  const handleCopyLink = async () => {
    if (!savedLink) return;

    try {
      await navigator.clipboard.writeText(savedLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const renderPreviewSlots = () => {
    if (lockMode === "colors") {
      return Array.from({ length: previewSlots }).map((_, index) => {
        const current = sequence[index];
        const color = COLOR_OPTIONS.find((item) => item.key === current);

        return (
          <div
            key={index}
            className={`h-12 w-12 rounded-full border-2 shadow-sm ${
              color ? color.bgClass : "bg-white"
            } ${current === "BLANC" ? "border-slate-300" : "border-slate-200"}`}
          />
        );
      });
    }

    if (lockMode === "musical") {
      return Array.from({ length: previewSlots }).map((_, index) => {
        const current = sequence[index];

        return (
          <div
            key={index}
            className="flex h-14 min-w-[52px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-2 text-sm font-bold text-slate-700 shadow-sm"
          >
            {current || "♪"}
          </div>
        );
      });
    }

    return Array.from({ length: previewSlots }).map((_, index) => {
      const current = sequence[index];

      return (
        <div
          key={index}
          className="flex h-14 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-bold text-slate-800 shadow-sm"
        >
          {current || "?"}
        </div>
      );
    });
  };

  const renderCreatorPad = () => {
    if (lockMode === "numbers") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-5">
            {NUMBER_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => pushValue(key)}
                className="h-14 rounded-2xl border border-slate-200 bg-white text-xl font-bold text-slate-800 shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (lockMode === "letters") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 xl:grid-cols-7">
            {LETTER_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => pushValue(key)}
                className="h-12 rounded-2xl border border-slate-200 bg-white text-base font-bold text-slate-800 shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (lockMode === "mixed") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 xl:grid-cols-8">
            {MIXED_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => pushValue(key)}
                className="h-12 rounded-2xl border border-slate-200 bg-white text-base font-bold text-slate-800 shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (lockMode === "colors") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.key}
                type="button"
                onClick={() => pushValue(color.key)}
                className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`h-12 w-12 rounded-full border-2 ${
                      color.bgClass
                    } ${color.key === "BLANC" ? "border-slate-300" : "border-transparent"}`}
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    {color.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

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
                <span className="text-xs text-slate-500">Écouter</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <div className="space-y-8">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
              Outil animation
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Studio de création de cadenas
            </h1>

            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Crée un cadenas à faire résoudre à un groupe, choisis son mode,
              compose la combinaison en cliquant sur les éléments, ajoute un
              contexte de jeu, des indices et partage le tout avec un lien et un QR code.
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Choisir le mode du cadenas
            </h2>
            <p className="text-sm text-muted-foreground">
              Chaque mode correspond à une manière différente de faire jouer les
              participants.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {MODE_CARDS.map((mode) => {
              const isActive = lockMode === mode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setLockMode(mode.id)}
                  className={`rounded-[24px] border p-5 text-left shadow-sm transition-all ${
                    isActive
                      ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                      : "border-slate-200 bg-white hover:border-primary/30 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-foreground">
                      {mode.title}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                        isActive
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {mode.badge}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {mode.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Paramètres du cadenas
              </h2>
              <p className="text-sm text-muted-foreground">
                Tu configures ici le cadenas que les joueurs devront résoudre.
              </p>
            </div>

            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-slate-700">
              <span className="font-semibold">{activeMode.title}</span> —{" "}
              {activeMode.description}
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Nom du cadenas
                </label>
                <input
                  type="text"
                  value={lockName}
                  onChange={(e) => setLockName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  placeholder="Ex : coffre du capitaine"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Mise en situation
                </label>
                <textarea
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  placeholder="Ex : Le coffre du pirate est verrouillé... Retrouvez la bonne combinaison avant la fin du temps."
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Composer la combinaison
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                  <div className="flex flex-wrap justify-center gap-2">
                    {renderPreviewSlots()}
                  </div>

                  <div className="text-center text-xs text-muted-foreground">
                    {normalizedCode
                      ? `Combinaison enregistrée : ${normalizedCode}`
                      : "Clique sur les éléments ci-dessous pour construire la combinaison"}
                  </div>

                  {renderCreatorPad()}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={removeLastValue}
                      className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Effacer le dernier élément
                    </button>

                    <button
                      type="button"
                      onClick={resetSequence}
                      className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Réinitialiser la combinaison
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Indices progressifs
                </label>

                <input
                  type="text"
                  value={hint1}
                  onChange={(e) => setHint1(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  placeholder="Indice 1"
                />

                <input
                  type="text"
                  value={hint2}
                  onChange={(e) => setHint2(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  placeholder="Indice 2"
                />

                <input
                  type="text"
                  value={hint3}
                  onChange={(e) => setHint3(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  placeholder="Indice 3"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Enregistrer le cadenas
              </button>

              <button
                type="button"
                onClick={() => {
                  setLockName("");
                  setSavedLink("");
                  setIntroText("");
                  setHint1("");
                  setHint2("");
                  setHint3("");
                  setSequence([]);
                  setCopied(false);
                }}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Réinitialiser tout
              </button>
            </div>

            {savedLink && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-4">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-emerald-700">
                    Cadenas enregistré
                  </div>
                  <div className="text-sm text-emerald-800 break-all">
                    {savedLink}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                  >
                    {copied ? "Lien copié" : "Copier le lien"}
                  </button>

                  <a
                    href={savedLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                  >
                    Ouvrir la page joueur
                  </a>
                </div>

                {qrCodeUrl ? (
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="mb-3 text-sm font-semibold text-slate-800">
                      QR code de partage
                    </div>

                    <div className="flex justify-center">
                      <img
                        src={qrCodeUrl}
                        alt="QR code du cadenas"
                        className="h-56 w-56 rounded-xl border border-slate-200"
                      />
                    </div>

                    <p className="mt-3 text-center text-xs text-slate-500">
                      Scanne ce QR code pour ouvrir directement l’expérience joueur.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Aperçu du cadenas
              </h2>
              <p className="text-sm text-muted-foreground">
                Cet aperçu te montre l’ambiance générale du cadenas côté joueur.
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 space-y-5">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                  {previewLabel}
                </div>

                <h3 className="text-lg font-bold text-foreground">
                  {lockName.trim() || "Nom du cadenas"}
                </h3>

                <p className="text-sm text-muted-foreground">
                  {normalizedCode
                    ? `${sequence.length} élément${sequence.length > 1 ? "s" : ""} à trouver`
                    : "Le nombre d’éléments s’adaptera automatiquement à ta combinaison"}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {renderPreviewSlots()}
              </div>

              <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                {introText.trim()
                  ? introText
                  : `Les joueurs devront résoudre ce cadenas en utilisant le mode ${activeMode.title}.`}
              </div>

              {(hint1 || hint2 || hint3) && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Indices enregistrés
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {hint1 ? <li>• {hint1}</li> : null}
                    {hint2 ? <li>• {hint2}</li> : null}
                    {hint3 ? <li>• {hint3}</li> : null}
                  </ul>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Ce qui arrive ensuite
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Historique des cadenas créés</li>
                <li>• Gestion de plusieurs cadenas pour un même jeu</li>
                <li>• Mise en ambiance encore plus immersive</li>
                <li>• Fiches prêtes à imprimer pour l’animateur</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}