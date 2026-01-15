#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import os
import re
import zipfile
from pathlib import PurePosixPath

PROFILES = {"animateur", "formateur", "directeur", "stagiaire_bafa"}
SKIP_PREFIXES = ("__MACOSX/", ".DS_Store")

def normalize_root(parts):
    """
    Ton zip contient souvent un dossier racine "ressources/".
    On le retire si présent.
    """
    if len(parts) > 0 and parts[0].lower() == "ressources":
        return parts[1:]
    return parts

def is_pdf(path: str) -> bool:
    return path.lower().endswith(".pdf")

def clean_segment(seg: str) -> str:
    seg = seg.strip()
    seg = seg.replace("\\", "/")
    seg = seg.strip("/")
    # Nettoyage léger (on garde accents)
    seg = re.sub(r"\s+", " ", seg)
    return seg

def detect_access_level(parts):
    # Pour l'instant, on met tout en PUBLIC, mais si un jour tu as des dossiers
    # premium/connecte/public, ce bloc pourra les détecter.
    lowered = [p.lower() for p in parts]
    for token in lowered:
        if token in ("premium",):
            return "PREMIUM"
        if token in ("connecte", "authenticated"):
            return "AUTHENTICATED"
        if token in ("public",):
            return "PUBLIC"
    return "PUBLIC"

def remove_tokens(parts, tokens_lower):
    out = []
    for p in parts:
        if p.lower() in tokens_lower:
            continue
        out.append(p)
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="Chemin vers le ZIP source (ex: /Users/rav/Desktop/ressources.zip)")
    ap.add_argument("--output", required=True, help="Chemin du ZIP structuré à générer")
    ap.add_argument("--max_category_depth", type=int, default=3, help="Profondeur max des catégories (défaut 3)")
    args = ap.parse_args()

    src_zip = args.input
    out_zip = args.output

    if not os.path.exists(src_zip):
        raise SystemExit(f"ZIP introuvable: {src_zip}")

    total_files = 0
    written_files = 0
    skipped = 0
    aclasser_root_routed_to = "formateur"  # choix pragmatique pour demain

    with zipfile.ZipFile(src_zip, "r") as zin, zipfile.ZipFile(out_zip, "w", compression=zipfile.ZIP_DEFLATED) as zout:
        for info in zin.infolist():
            name = info.filename

            if not name or name.endswith("/"):
                continue
            if any(name.startswith(pref) for pref in SKIP_PREFIXES):
                skipped += 1
                continue
            if not is_pdf(name):
                # on ignore tout sauf PDF pour la démo
                skipped += 1
                continue

            total_files += 1

            path = PurePosixPath(name)
            parts = [clean_segment(p) for p in path.parts]
            parts = [p for p in parts if p not in ("", ".", "..")]

            parts = normalize_root(parts)

            if len(parts) == 0:
                skipped += 1
                continue

            # Cas 1 : _A_CLASSER à la racine
            status_folder = "publie"
            profile = None
            rel_parts = parts

            if rel_parts[0] == "_A_CLASSER":
                status_folder = "_A_CLASSER"
                rel_parts = rel_parts[1:]  # après _A_CLASSER
                # Si le zip est _A_CLASSER/<profil>/... on le prend
                if len(rel_parts) > 0 and rel_parts[0] in PROFILES:
                    profile = rel_parts[0]
                    rel_parts = rel_parts[1:]
                else:
                    # sinon on route par défaut vers formateur (pragmatique démo)
                    profile = aclasser_root_routed_to

            # Cas 2 : profil à la racine
            if profile is None:
                if rel_parts[0] in PROFILES:
                    profile = rel_parts[0]
                    rel_parts = rel_parts[1:]
                else:
                    # fichier hors structure connue → on le met en formateur/_A_CLASSER
                    profile = "formateur"
                    status_folder = "_A_CLASSER"

            # Nettoyage tokens inutiles dans le zip d'origine
            # ex: "document" n'est pas une catégorie métier utile
            rel_parts = remove_tokens(rel_parts, {"document"})

            # Détection access level (par défaut PUBLIC)
            access = detect_access_level(rel_parts)
            # Si un jour tu as "premium/public/connecte" dans les dossiers, on les retire des catégories
            rel_parts = remove_tokens(rel_parts, {"premium", "public", "connecte", "authenticated"})

            # Catégories = sous-dossiers (limités en profondeur)
            # rel_parts contient encore le nom du fichier en fin
            filename = rel_parts[-1] if len(rel_parts) > 0 else path.name
            folder_parts = rel_parts[:-1] if len(rel_parts) > 1 else []

            folder_parts = folder_parts[: max(0, args.max_category_depth)]
            folder_parts = [p for p in folder_parts if p]

            # Chemin final dans le ZIP structuré
            out_parts = [profile, status_folder, access] + folder_parts + [filename]
            out_name = "/".join(out_parts)

            # Écrit dans le nouveau ZIP
            with zin.open(info, "r") as fsrc:
                data = fsrc.read()
                zout.writestr(out_name, data)
                written_files += 1

    print("=== ZIP restructuré généré ===")
    print("Source :", src_zip)
    print("Sortie :", out_zip)
    print("PDF trouvés :", total_files)
    print("PDF écrits  :", written_files)
    print("Ignorés     :", skipped)
    print("Note : les PDFs de _A_CLASSER à la racine ont été routés vers :", aclasser_root_routed_to)

if __name__ == "__main__":
    main()
