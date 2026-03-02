import "dotenv/config";
import * as db from "../db";

function countByAccessLevel(rows: any[]) {
  const counts: Record<string, number> = {};
  for (const r of rows) {
    const lvl = String(r?.accessLevel ?? "UNKNOWN");
    counts[lvl] = (counts[lvl] ?? 0) + 1;
  }
  return counts;
}

function assertNoPremium(rows: any[], label: string) {
  const hasPremium = rows.some((r) => String(r?.accessLevel) === "PREMIUM");
  if (hasPremium) {
    console.log("❌ LEAK DETECTED:", label, "-> PREMIUM présent alors que includePremium=false");
    const examples = rows.filter((r) => String(r?.accessLevel) === "PREMIUM").slice(0, 5);
    console.log("Examples (max 5):", examples.map((r) => ({ id: r?.id, title: r?.title, accessLevel: r?.accessLevel })));
    process.exitCode = 1;
  } else {
    console.log("✅ OK: aucun PREMIUM");
  }
}

async function run() {
  console.log("=== AUDIT PREMIUM HOME (getHomePopularResources) ===");

  const dbConn = await db.getDb();
  if (!dbConn) {
    console.log("❌ DB connection failed");
    process.exit(1);
  }
  console.log("✅ DB connection OK\n");

  // Scenario A: visitor
  console.log("--- Scenario A: visitor (includeInternal=false, includePremium=false, isAdmin=false) ---");
  const a = await db.getHomePopularResources({
    includeInternal: false,
    includePremium: false,
    isAdmin: false,
  });
  console.log("Total:", a.length);
  console.log("Counts:", countByAccessLevel(a));
  assertNoPremium(a, "Scenario A");

  // Scenario B: logged non-premium
  console.log("\n--- Scenario B: logged non-premium (includeInternal=true, includePremium=false, isAdmin=false) ---");
  const b = await db.getHomePopularResources({
    includeInternal: true,
    includePremium: false,
    isAdmin: false,
  });
  console.log("Total:", b.length);
  console.log("Counts:", countByAccessLevel(b));
  assertNoPremium(b, "Scenario B");

  // Scenario C: premium
  console.log("\n--- Scenario C: premium (includeInternal=true, includePremium=true, isAdmin=false) ---");
  const c = await db.getHomePopularResources({
    includeInternal: true,
    includePremium: true,
    isAdmin: false,
  });
  console.log("Total:", c.length);
  console.log("Counts:", countByAccessLevel(c));

  // Scenario D: admin
  console.log("\n--- Scenario D: admin (includeInternal=true, includePremium=true, isAdmin=true) ---");
  const d = await db.getHomePopularResources({
    includeInternal: true,
    includePremium: true,
    isAdmin: true,
  });
  console.log("Total:", d.length);
  console.log("Counts:", countByAccessLevel(d));

  if (process.exitCode === 1) {
    console.log("\n❌ AUDIT FAILED: fuite premium détectée sur Home.");
  } else {
    console.log("\n✅ AUDIT PASSED: aucune fuite premium détectée sur Home.");
  }
}

run().catch((e) => {
  console.error("❌ AUDIT ERROR:", e);
  process.exit(1);
});