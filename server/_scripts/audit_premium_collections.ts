/* eslint-disable no-console */
import "dotenv/config";
import * as db from "../db";

function countByAccessLevel(rows: any[]) {
  return rows.reduce((acc: Record<string, number>, r: any) => {
    const k = String(r?.accessLevel ?? "UNKNOWN");
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

async function main() {
  console.log("=== AUDIT PREMIUM COLLECTIONS (getCollectionResources) ===");

  // 1) DB check
  const all = await db.getAllResources({
    adminView: true,
    includeInternal: true,
    includePremium: true,
  } as any);

  console.log("✅ DB connection OK");
  console.log(`Total resources (adminView): ${all.length}`);

  // 2) On prend les collections publiques "approved"
  const collections = await db.getPublicCollections();
  const usable = (collections || []).filter((c: any) => c?.id != null);

  if (!usable.length) {
    console.log("⚠️ Aucun collection PUBLIC approved trouvée -> audit ignoré");
    process.exit(0);
  }

  // On limite pour éviter un audit trop long (propre pour CI/local)
  const sample = usable.slice(0, 10);
  console.log(`Collections testées: ${sample.length}/${usable.length}`);

  // helper scenario
  async function runScenario(label: string, opts: { includeInternal: boolean; includePremium: boolean; isAdmin: boolean }) {
    console.log(`\n--- ${label} (includeInternal=${opts.includeInternal}, includePremium=${opts.includePremium}, isAdmin=${opts.isAdmin}) ---`);

    let totalRows = 0;
    let leaks = 0;

    for (const c of sample) {
      const rows = await db.getCollectionResources(Number(c.id), {
        includeInternal: opts.includeInternal,
        includePremium: opts.includePremium,
        isAdmin: opts.isAdmin,
      });

      totalRows += rows.length;

      // fuite premium si NON premium et NON admin
      if (!opts.includePremium && !opts.isAdmin) {
        const hasPremium = rows.some((r: any) => String(r?.accessLevel) === "PREMIUM");
        if (hasPremium) {
          leaks++;
          console.log(`❌ LEAK: collectionId=${c.id} name="${c.name}" contient PREMIUM alors que non autorisé`);
        }
      }

      // drafts ne doivent jamais sortir si non-admin
      if (!opts.isAdmin) {
        const hasNonApproved = rows.some((r: any) => String((r as any)?.status ?? "") !== "" && String((r as any)?.status) !== "approved");
        // note: getCollectionResources ne select pas status actuellement; donc on ne peut pas le tester ici.
        // On laisse le hook ci-dessus si tu ajoutes status dans le select plus tard.
        void hasNonApproved;
      }
    }

    console.log("Total rows (somme sur l’échantillon):", totalRows);
    console.log("Leaks détectées:", leaks);
    if (leaks === 0) console.log("✅ OK: aucune fuite PREMIUM via getCollectionResources()");
    return leaks;
  }

  const leaksA = await runScenario("Scenario A: visitor", {
    includeInternal: false,
    includePremium: false,
    isAdmin: false,
  });

  const leaksB = await runScenario("Scenario B: logged non-premium", {
    includeInternal: true,
    includePremium: false,
    isAdmin: false,
  });

  const leaksC = await runScenario("Scenario C: premium", {
    includeInternal: true,
    includePremium: true,
    isAdmin: false,
  });

  const leaksD = await runScenario("Scenario D: admin", {
    includeInternal: true,
    includePremium: true,
    isAdmin: true,
  });

  const totalLeaks = leaksA + leaksB;
  if (totalLeaks === 0) {
    console.log("\n✅ AUDIT PASSED: aucune fuite premium détectée via collections.");
    process.exit(0);
  } else {
    console.log("\n❌ AUDIT FAILED: fuites détectées via collections.");
    process.exit(1);
  }

  // note: C & D ne sont pas “bloquants”, c’est normal d’y voir PREMIUM.
  void leaksC;
  void leaksD;
}

main().catch((err) => {
  console.error("❌ AUDIT ERROR:", err);
  process.exit(1);
});