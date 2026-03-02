import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";
import { and, eq } from "drizzle-orm";

import { getDb } from "../server/db";
import { categoryNodes } from "../drizzle/schema";

dotenv.config();

/* =======================
   CONFIG
======================= */

const ROOT_PARENT_KEY = "__ROOT__";

const IGNORE_DIR_NAMES = new Set([
  ".DS_Store",
  "__MACOSX",
]);

type ProfileType =
  | "animateur"
  | "formateur"
  | "directeur"
  | "stagiaire_bafa"
  | "public";

/**
 * MAPPING (dossier disque -> enum DB)
 */
const PROFILE_DIR_TO_DB: Record<string, ProfileType> = {
  // Canonique
  "animateur": "animateur",
  "formateur": "formateur",
  "directeur": "directeur",
  "stagiaire_bafa": "stagiaire_bafa",
  "public": "public",

  // Variantes observées
  "animateur.trice": "animateur",
  "directeur.trice": "directeur",
  "formateur.trice": "formateur",
  "stagiaire bafa": "stagiaire_bafa",

  // Variantes préventives
  "stagiaire-bafa": "stagiaire_bafa",
  "stagiaire": "stagiaire_bafa",
};

function normalizeProfileDirName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* =======================
   TYPES
======================= */

type PlannedNode = {
  profileType: ProfileType;
  slug: string;
  title: string;
  diskPath: string;         // clé stable
  parentDiskPath: string | null;
};

type DbNode = {
  id: number;
  profileType: ProfileType;
  parentId: number | null;
  parentIdKey: string;
  slug: string;
  title: string | null;
};

/* =======================
   UTILS
======================= */

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleFromFolder(name: string): string {
  return name.replace(/[_-]+/g, " ").trim();
}

function uniqueKey(profileType: ProfileType, parentIdKey: string, slug: string) {
  return `${profileType}::${parentIdKey}::${slug}`;
}

function listDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => !IGNORE_DIR_NAMES.has(name));
}

function stableDiskPath(p: string): string {
  // Normalisation stable multi-OS
  return path.resolve(p).replace(/\\/g, "/");
}

/* =======================
   PLAN
======================= */

function buildPlan(baseDir: string): PlannedNode[] {
  const absBase = path.isAbsolute(baseDir)
    ? baseDir
    : path.join(process.cwd(), baseDir);

  const plan: PlannedNode[] = [];

  for (const profileRaw of listDirs(absBase)) {
    const normalized = normalizeProfileDirName(profileRaw);
    const mapped = PROFILE_DIR_TO_DB[normalized];

    if (!mapped) {
      console.warn(
        `[WARN] Dossier profil ignoré (aucun mapping vers enum DB): "${profileRaw}"`
      );
      continue;
    }

    const profileType = mapped;
    const profilePath = path.join(absBase, profileRaw);

    for (const cat of listDirs(profilePath)) {
      walkFolder({
        profileType,
        folderName: cat,
        folderPath: path.join(profilePath, cat),
        parentDiskPath: null, // catégorie top-level sous profil
        out: plan,
      });
    }
  }

  return plan;
}

function walkFolder(opts: {
  profileType: ProfileType;
  folderName: string;
  folderPath: string;
  parentDiskPath: string | null;
  out: PlannedNode[];
}) {
  const slug = slugify(opts.folderName);
  const title = titleFromFolder(opts.folderName);
  const diskPath = stableDiskPath(opts.folderPath);

  opts.out.push({
    profileType: opts.profileType,
    slug,
    title,
    diskPath,
    parentDiskPath: opts.parentDiskPath,
  });

  for (const child of listDirs(opts.folderPath)) {
    walkFolder({
      profileType: opts.profileType,
      folderName: child,
      folderPath: path.join(opts.folderPath, child),
      parentDiskPath: diskPath,
      out: opts.out,
    });
  }
}

/* =======================
   RUN
======================= */

async function run() {
  const apply = process.argv.includes("--apply");
  const baseDir = "import_tmp/_extract_all_v2/ressources";

  console.log("=== IMPORT TAXONOMY ===");
  console.log("Mode :", apply ? "APPLY" : "DRY-RUN");
  console.log("Dir  :", baseDir);

  const plan = buildPlan(baseDir);

  const db = await getDb();
  if (!db) {
    throw new Error("getDb() a renvoyé null. Vérifie la config DB (.env / server/db).");
  }

  // Typage Drizzle actuel ne connaît pas parentIdKey => cast localisé
  const categoryNodesAny = categoryNodes as any;

  const existingRows = await db.select().from(categoryNodesAny);
  const existing = new Map<string, DbNode>();

  for (const r of existingRows as any[]) {
    existing.set(
      uniqueKey(r.profileType as ProfileType, String(r.parentIdKey), String(r.slug)),
      {
        id: Number(r.id),
        profileType: r.profileType as ProfileType,
        parentId: r.parentId === null || r.parentId === undefined ? null : Number(r.parentId),
        parentIdKey: String(r.parentIdKey),
        slug: String(r.slug),
        title: r.title === null || r.title === undefined ? null : String(r.title),
      }
    );
  }

  // diskPath -> id (id factice en DRY, id réel en APPLY/existant)
  const diskPathToId = new Map<string, number>();
  let fakeId = -1;

  for (const node of plan) {
    const parentIdKey =
      node.parentDiskPath === null
        ? ROOT_PARENT_KEY
        : String(diskPathToId.get(node.parentDiskPath));

    if (node.parentDiskPath !== null && !diskPathToId.has(node.parentDiskPath)) {
      throw new Error(
        `Parent introuvable pour slug="${node.slug}" (profil=${node.profileType}). parentDiskPath="${node.parentDiskPath}"`
      );
    }

    const key = uniqueKey(node.profileType, parentIdKey, node.slug);
    const found = existing.get(key);

    if (!found) {
      console.log(`[CREATE] ${key}`);

      if (!apply) {
        // DRY-RUN: assignation factice stable pour les enfants
        diskPathToId.set(node.diskPath, fakeId--);
        continue;
      }

      await db
        .insert(categoryNodesAny)
        .values({
          profileType: node.profileType,
          parentId: parentIdKey === ROOT_PARENT_KEY ? null : Number(parentIdKey),
          parentIdKey,
          slug: node.slug,
          title: node.title,
        })
        .onDuplicateKeyUpdate({
          set: { title: node.title },
        });

      const rows = await db
        .select()
        .from(categoryNodesAny)
        .where(
          and(
            eq(categoryNodesAny.profileType, node.profileType),
            eq(categoryNodesAny.parentIdKey, parentIdKey),
            eq(categoryNodesAny.slug, node.slug)
          )
        );

      if (!rows || rows.length !== 1) {
        throw new Error(
          `Après upsert, impossible de relire le noeud: profile=${node.profileType}, parentIdKey=${parentIdKey}, slug=${node.slug}`
        );
      }

      diskPathToId.set(node.diskPath, Number(rows[0].id));
    } else {
      diskPathToId.set(node.diskPath, found.id);
    }
  }

  console.log("=== TERMINÉ ===");
  if (!apply) console.log("DRY-RUN terminé. Pour appliquer: ajoute --apply");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
