import { useMemo, useState } from "react";

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export default function TeamTool() {
  const [input, setInput] = useState("Lina\nNoah\nCamille\nYanis\nSarah\nAdam");
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState<string[][]>([]);

  const participants = useMemo(() => {
    return input
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [input]);

  const generateTeams = () => {
    if (participants.length === 0) {
      setTeams([]);
      return;
    }

    const shuffled = shuffleArray(participants);
    const nextTeams = Array.from({ length: teamCount }, () => [] as string[]);

    shuffled.forEach((person, index) => {
      nextTeams[index % teamCount].push(person);
    });

    setTeams(nextTeams);
  };

  return (
    <div className="rounded-[28px] border border-border/50 bg-white/80 p-6 shadow-sm md:col-span-2 xl:col-span-2">
      <div className="flex h-full flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Créateur d’équipes</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Saisis un prénom par ligne, choisis le nombre d’équipes, puis lance
            une répartition aléatoire.
          </p>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Participants
          </label>

          <textarea
            className="min-h-[180px] rounded-2xl border border-border/50 bg-white px-3 py-3 text-sm shadow-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"Exemple :\nLina\nNoah\nCamille\nYanis"}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border/50 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Participants détectés
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {participants.length} participant{participants.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Nombre d’équipes
            </label>

<select
  className="h-11 rounded-2xl border border-border/50 bg-white px-3 text-sm shadow-sm"
  value={teamCount}
  onChange={(e) => setTeamCount(Number(e.target.value))}
>
  {Array.from({ length: 11 }, (_, i) => {
    const value = i + 2;
    return (
      <option key={value} value={value}>
        {value} équipes
      </option>
    );
  })}
</select>
          </div>
        </div>

        <button
          className="rounded-xl bg-primary px-4 py-3 text-white text-sm font-semibold hover:opacity-90"
          onClick={generateTeams}
        >
          Créer les équipes
        </button>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.length > 0 ? (
            teams.map((team, index) => (
              <div
                key={index}
                className="rounded-2xl border border-border/50 bg-primary/5 p-4"
              >
                <p className="text-sm font-semibold text-foreground">
                  Équipe {index + 1}
                </p>

                {team.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {team.map((member) => (
                      <li
                        key={member}
                        className="rounded-xl border border-border/40 bg-white px-3 py-2"
                      >
                        {member}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Aucun participant
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-slate-50/70 p-4 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
              Aucune équipe générée pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}