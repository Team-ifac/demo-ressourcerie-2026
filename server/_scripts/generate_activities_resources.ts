import fs from "fs";
import path from "path";

// 👉 Source de vérité du générateur : version enrichie
const INPUT_PATH = path.join(process.cwd(), "activities.enriched.json");
const OUTPUT_PATH = path.join(process.cwd(), "generated_resources.json");

type Activity = {
  id: string;
  titre: string;
  ages: string[];
  type: string;
  lieu: string[];
  encadrement: string;
  dureeMinutes: number;
  dureeFormat: string;
  energie: number;
  creneau?: string;
  categorie?: string;
};

function generateResource(activity: Activity, creneau: string, categorie: string) {
  const effectiveCreneau = activity.creneau ?? creneau;
  const effectiveCategorie = activity.categorie ?? categorie;

  return {
    title: activity.titre,

    summary: `Activité ${activity.type} (${effectiveCreneau}) idéale pour ${activity.ages.join(", ")}.`,

    content: `
🎯 Objectif :
Proposer une activité ${activity.type} adaptée au temps ${effectiveCreneau}.

👥 Public :
${activity.ages.join(", ")}

⏱️ Durée :
${activity.dureeMinutes} minutes (${activity.dureeFormat})

🔥 Niveau d’énergie :
${activity.energie}/5

📍 Lieu :
${activity.lieu.join(", ")}

👨‍👩‍👧 Encadrement :
${activity.encadrement} animateur(s)

🧠 Déroulé :
1. Présentation rapide de l’activité
2. Mise en action du groupe
3. Ajustement selon l’énergie du groupe
4. Retour au calme ou transition

💡 Astuce ifac :
Adapter le rythme selon l’état du groupe et favoriser la participation de tous.
    `.trim(),

    category: `${effectiveCreneau}/${effectiveCategorie}`,

    tags: [
      ...activity.ages,
      activity.type,
      ...activity.lieu,
      `energie-${activity.energie}`,
      effectiveCreneau,
      effectiveCategorie,
    ],

    duration: activity.dureeFormat,
    ageRange: activity.ages.join(", "),
    type: activity.type,
    energy: activity.energie,
    accessLevel: "PUBLIC",
  };
}

function main() {
  const raw = fs.readFileSync(INPUT_PATH, "utf-8");
  const json = JSON.parse(raw);

  const resources: any[] = [];

  for (const creneauKey of Object.keys(json.base)) {
    const creneau = json.base[creneauKey];

    for (const categorieKey of Object.keys(creneau)) {
      const activites = creneau[categorieKey];

      for (const activity of activites) {
        const resource = generateResource(activity, creneauKey, categorieKey);
        resources.push(resource);
      }
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(resources, null, 2));

  console.log("✅ Génération terminée :", resources.length, "ressources créées");
}

main();