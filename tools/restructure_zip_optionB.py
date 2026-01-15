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
    if len(parts) > 0 and parts[0].lower() == "ressources":
        return parts[1:]
    return parts

def is_pdf(path: str) -> bool:
    return path.lower().endswith(".pdf")

def clean_segment(seg: str) -> str:
    seg = seg.strip()
    seg = seg.replace("\\", "/")
    seg = seg.strip("/")
    seg = re.sub(r"\s+", " ", seg)
    return seg

def detect_access_level(parts):
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
    ap.add_argument("--input", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--max_category_depth", type=int, default=3)
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

            status_folder = "publie"
            profile = None
            rel_parts = parts

            if rel_parts[0] == "_A_CLASSER":
                status_folder = "_A_CLASSER"
                rel_parts = rel_parts[1:]
                if len(rel_parts) > 0 and rel_parts[0] in PROFILES:
                    profile = rel_parts[0]
                    rel_parts = rel_parts[1:]
                else:
                    profile = aclasser_root_routed_to

            if profile is None:
                if rel_parts[0] in PROFILES:
                    profile = rel_parts[0]
                    rel_parts = rel_parts[1:]
                else:
                    profile = "formateur"
                    status_folder = "_A_CLASSER"

            rel_parts = remove_tokens(rel_parts, {"document"})

            access = detect_access_level(rel_parts)
            rel_parts = remove_tokens(rel_parts, {"premium", "public", "connecte", "authenticated"})

            filename = rel_parts[-1] if len(rel_parts) > 0 else path.name
            folder_parts = rel_parts[:-1] if len(rel_parts) > 1 else []

            folder_parts = folder_parts[: max(0, args.max_category_depth)]
            folder_parts = [p for p in folder_parts if p]

            out_parts = [profile, status_folder, access] + folder_parts + [filename]
            out_name = "/".join(out_parts)

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
