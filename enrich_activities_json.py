import json
from pathlib import Path

INPUT_FILE = Path("activities.json")
OUTPUT_FILE = Path("activities.enriched.json")


def enrich_activity(activity: dict, creneau: str, categorie: str) -> dict:
    enriched = dict(activity)

    if "creneau" not in enriched:
        enriched["creneau"] = creneau

    if "categorie" not in enriched:
        enriched["categorie"] = categorie

    return enriched


def main() -> None:
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Fichier introuvable : {INPUT_FILE}")

    with INPUT_FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if "base" not in data or not isinstance(data["base"], dict):
        raise ValueError("Structure invalide : clé 'base' absente ou incorrecte.")

    enriched_count = 0

    for creneau, categories in data["base"].items():
        if not isinstance(categories, dict):
            continue

        for categorie, activities in categories.items():
            if not isinstance(activities, list):
                continue

            new_activities = []
            for activity in activities:
                if not isinstance(activity, dict):
                    new_activities.append(activity)
                    continue

                before_has_creneau = "creneau" in activity
                before_has_categorie = "categorie" in activity

                enriched_activity = enrich_activity(activity, creneau, categorie)
                new_activities.append(enriched_activity)

                if not before_has_creneau or not before_has_categorie:
                    enriched_count += 1

            data["base"][creneau][categorie] = new_activities

    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Terminé : {enriched_count} activité(s) enrichie(s).")
    print(f"Fichier généré : {OUTPUT_FILE}")


if __name__ == "__main__":
    main()