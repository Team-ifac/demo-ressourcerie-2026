import "dotenv/config";
import * as db from "../db";

// Audit “zéro fuite premium” (PILIER 1)
// Objectif : vérifier que les requêtes DB utilisées par le router ne renvoient
// pas de ressources PREMIUM quand includePremium=false.
async function main() {
  console.log("=== AUDIT PREMIUM LEAKS ===");

  // 1) Connexion DB dispo ?
  const dbConn = await db.getDb();
  if (!dbConn) {
    console.error("❌ DB not available (db.getDb() a renvoyé null/undefined)");
    process.exit(1);
  }
  console.log("✅ DB connection OK");

  // Helper
  const countByAccessLevel = (rows: any[]) => {
    const acc: Record<string, number> = {};
    for (const r of rows || []) {
      const k = String(r?.accessLevel ?? "PUBLIC");
      acc[k] = (acc[k] ?? 0) + 1;
    }
    return acc;
  };

  // 2) Scénario A : visiteur (PUBLIC uniquement attendu)
  const rowsPublicOnly = (await db.getAllResources({
    includeInternal: false,
    includePremium: false,

  })) as any[];

  const countsA = countByAccessLevel(rowsPublicOnly);
  const leakedA = (countsA["PREMIUM"] ?? 0) > 0;

  console.log("\n--- Scenario A: visitor (includeInternal=false, includePremium=false) ---");
  console.log("Total:", rowsPublicOnly?.length ?? 0);
  console.log("Counts:", countsA);

  if (leakedA) {
    console.log("❌ LEAK DETECTED: PREMIUM présent alors que includePremium=false");
  } else {
    console.log("✅ OK: aucun PREMIUM");
  }

  // 3) Scénario B : connecté non-premium (PUBLIC + INTERNAL_IFAC attendus)
  const rowsInternal = (await db.getAllResources({
    includeInternal: true,
    includePremium: false,

  })) as any[];

  const countsB = countByAccessLevel(rowsInternal);
  const leakedB = (countsB["PREMIUM"] ?? 0) > 0;

  console.log("\n--- Scenario B: logged non-premium (includeInternal=true, includePremium=false) ---");
  console.log("Total:", rowsInternal?.length ?? 0);
  console.log("Counts:", countsB);

  if (leakedB) {
    console.log("❌ LEAK DETECTED: PREMIUM présent alors que includePremium=false");
  } else {
    console.log("✅ OK: aucun PREMIUM");
  }

  // 4) Scénario C : premium (PUBLIC + INTERNAL_IFAC + PREMIUM attendus)
  const rowsPremium = (await db.getAllResources({
    includeInternal: true,
    includePremium: true,
  })) as any[];

  const countsC = countByAccessLevel(rowsPremium);

  console.log("\n--- Scenario C: premium (includeInternal=true, includePremium=true) ---");
  console.log("Total:", rowsPremium?.length ?? 0);
  console.log("Counts:", countsC);

  // Résultat final (fail fast)
  if (leakedA || leakedB) {
    console.log("\n❌ AUDIT FAILED: fuite premium détectée dans les requêtes DB (getAllResources).");
    process.exit(2);
  }

  console.log("\n✅ AUDIT PASSED: aucune fuite premium détectée via getAllResources().");
}

main().catch((e) => {
  console.error("❌ AUDIT CRASH:", e);
  process.exit(1);
});