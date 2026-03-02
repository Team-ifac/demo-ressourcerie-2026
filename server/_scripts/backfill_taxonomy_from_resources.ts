/**
 * PILIER 3 — Backfill taxonomy depuis resources.category (categoryKey)
 *
 * Objectif:
 * - Remplir category_nodes + resource_category_nodes pour toutes les ressources importées
 * - Idempotent (relançable sans risque)
 *
 * Usage (Terminal TRAVAIL):
 *   pnpm -s tsx -r dotenv/config server/_scripts/backfill_taxonomy_from_resources.ts --dry-run
 *   pnpm -s tsx -r dotenv/config server/_scripts/backfill_taxonomy_from_resources.ts --limit 50
 *   pnpm -s tsx -r dotenv/config server/_scripts/backfill_taxonomy_from_resources.ts
 */

import dotenv from "dotenv";
dotenv.config();

import * as db from "../db";

type ProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa" | "public";

function readArgValue(args: string[], name: string): string | null {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  const v = args[idx + 1];
  if (!v || v.startsWith("--")) return null;
  return v;
}

function slugifySegment(input: string): string {
  const s = (input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();

  return s || "autre";
}

function titleFromSlug(slug: string): string {
  // "techniques-danimation" -> "Techniques danimation"
  const words = String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return words.join(" ") || "Autre";
}

async function upsertCategoryNode(
  profileType: ProfileType,
  parentId: number | null,
  slug: string,
  title: string
): Promise<number | null> {
  const db2 = await (db as any).getDb?.();
  if (!db2) return null;

  const schema = await import("../../drizzle/schema").catch(() =>
    import("../drizzle/schema" as any)
  );
  const { eq, and } = await import("drizzle-orm");

  const categoryNodes =
    (schema as any).categoryNodes ?? (schema as any).category_nodes;
  if (!categoryNodes) return null;

  // ✅ parentIdKey est NOT NULL dans ta DB
  const parentIdKey = parentId === null ? "ROOT" : String(parentId);

  const rows: Array<{ id: number }> = (await db2
    .select({ id: categoryNodes.id })
    .from(categoryNodes)
    .where(
      and(
        eq(categoryNodes.profileType, profileType as any),
        eq(categoryNodes.parentIdKey, parentIdKey as any),
        eq(categoryNodes.slug, slug)
      )
    )
    .limit(1)) as any;

  if (rows.length > 0) return Number(rows[0].id);

  // insert (✅ on renseigne parentIdKey)
  await db2.insert(categoryNodes).values({
    profileType: profileType as any,
    parentId: parentId as any,
    parentIdKey: parentIdKey as any,
    slug,
    title,
    description: null,
    sortOrder: 0,
    isActive: 1,
  } as any);

  const created: Array<{ id: number }> = (await db2
    .select({ id: categoryNodes.id })
    .from(categoryNodes)
    .where(
      and(
        eq(categoryNodes.profileType, profileType as any),
        eq(categoryNodes.parentIdKey, parentIdKey as any),
        eq(categoryNodes.slug, slug)
      )
    )
    .limit(1)) as any;

  return created.length > 0 ? Number(created[0].id) : null;
}

async function linkResourceToLeaf(resourceId: number, leafId: number): Promise<boolean> {
  const db2 = await (db as any).getDb?.();
  if (!db2) return false;

  const schema = await import("../../drizzle/schema").catch(() =>
    import("../drizzle/schema" as any)
  );
  const resourceCategoryNodes =
    (schema as any).resourceCategoryNodes ?? (schema as any).resource_category_nodes;
  if (!resourceCategoryNodes) return false;

  try {
    await db2.insert(resourceCategoryNodes).values({
      resourceId,
      categoryNodeId: leafId,
    } as any);
    return true;
  } catch {
    // duplicate => already linked
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitRaw = readArgValue(args, "--limit");
  const limit = limitRaw ? Math.max(1, Number(limitRaw)) : null;

  console.log("=== PILIER 3 — Backfill taxonomy depuis resources.category ===");
  console.log("MODE:", dryRun ? "DRY_RUN" : "WRITE");
  if (limit) console.log("LIMIT:", limit);

  const db2 = await (db as any).getDb?.();
  if (!db2) {
    console.error("ERREUR: DB indisponible (getDb).");
    process.exit(1);
  }

  const schema = await import("../../drizzle/schema").catch(() =>
    import("../drizzle/schema" as any)
  );
  const { like, eq } = await import("drizzle-orm");

  const resourcesTable = (schema as any).resources;
  if (!resourcesTable) {
    console.error("ERREUR: table resources introuvable dans drizzle/schema.");
    process.exit(1);
  }

  // On cible les importés (fileUrl /imported/...) qui ont un categoryKey
  const rows = await db2
    .select({
      id: resourcesTable.id,
      fileUrl: resourcesTable.fileUrl,
      category: resourcesTable.category,
    })
    .from(resourcesTable)
    .where(like(resourcesTable.fileUrl, "/imported/%"));

  const items = (rows as any[]).slice(0, limit ?? rows.length);

  let processed = 0;
  let nodesCreatedOrFound = 0;
  let linksCreated = 0;
  let skippedNoCategory = 0;

  for (const r of items) {
    processed++;
    const id = Number(r.id);
    const categoryKey = String(r.category || "").trim(); // ex: "techniques-danimation/jeux-de-plein-air"
    const fileUrl = String(r.fileUrl || "").trim();

    if (!categoryKey) {
      skippedNoCategory++;
      continue;
    }

    // profileType depuis le fileUrl: /imported/<profile>/...
    const parts = fileUrl.replace(/^\/+/, "").split("/");
    const profileType = (parts[1] || "public") as ProfileType;

    const slugs = categoryKey
      .split("/")
      .map((s: string) => slugifySegment(s))
      .filter(Boolean);

    const chain = slugs.length > 0 ? slugs : ["autre"];

    let parentId: number | null = null;
    let leafId: number | null = null;

    for (const slug of chain) {
      const title = titleFromSlug(slug);

      if (dryRun) {
        // on simule le parcours
        nodesCreatedOrFound++;
        // leaf simulé
        leafId = 1;
        parentId = 1;
      } else {
        const nodeId = await upsertCategoryNode(profileType, parentId, slug, title);
        if (!nodeId) continue;
        nodesCreatedOrFound++;
        parentId = nodeId;
        leafId = nodeId;
      }
    }

    if (!leafId) continue;

    if (dryRun) {
      // simulate link
      linksCreated++;
      continue;
    }

    const linked = await linkResourceToLeaf(id, leafId);
    if (linked) linksCreated++;
  }

  console.log("=== SUMMARY ===");
  console.log("Resources scanned:", items.length);
  console.log("Processed:", processed);
  console.log("Nodes created/found:", nodesCreatedOrFound);
  console.log("Links created:", linksCreated);
  console.log("Skipped (no category):", skippedNoCategory);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
