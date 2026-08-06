/**
 * End-to-end test for design colors/category save + filter pipeline.
 * Run: cd artifacts/api-server && npx tsx scripts/test-design-filters.ts
 */
import { config } from "dotenv";
config({ path: "../../.env" });

const BASE = "http://localhost:8080";
const ADMIN_EMAIL = "admin@wedinstudio.com";
const ADMIN_PASSWORD = process.env.SEED_SECRET ?? "";

if (!ADMIN_PASSWORD) {
  console.error("❌ SEED_SECRET not set — cannot login as admin");
  process.exit(1);
}

let sessionCookie = "";

async function req(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) sessionCookie = setCookie.split(";")[0];
  const text = await res.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}

function pass(msg: string) { console.log(`  ✅ ${msg}`); }
function fail(msg: string, detail?: unknown) {
  console.error(`  ❌ ${msg}`, detail ?? "");
  process.exitCode = 1;
}

async function main() {
  console.log("\n=== Design filter & save test ===\n");

  // ── 1. Login ───────────────────────────────────────────────────────────────
  console.log("1. Admin login");
  const login = await req("POST", "/api/auth/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (login.status === 200) {
    pass(`Logged in (${login.status})`);
  } else {
    fail(`Login failed (${login.status})`, login.body);
    return;
  }

  // ── 2. List all designs (baseline) ────────────────────────────────────────
  console.log("\n2. Baseline GET /api/design");
  const all = await req("GET", "/api/design");
  const designs = all.body as Array<{ id: number; designCode: string; colors?: string[] | null; category?: string | null }>;
  if (!Array.isArray(designs)) { fail("Not an array", designs); return; }
  pass(`Got ${designs.length} designs`);
  if (designs.length < 1) { fail("Need at least 1 design to test PATCH"); return; }

  const target = designs[0];
  console.log(`   Using design id=${target.id} code=${target.designCode}`);

  // ── 3. PATCH colors + category ────────────────────────────────────────────
  console.log("\n3. PATCH colors + category onto design");
  const patch = await req("PATCH", `/api/design/${target.id}`, {
    colors: ["Sage", "Green"],
    category: "Floral",
  });
  if (patch.status === 200) {
    const updated = patch.body as Record<string, unknown>;
    const savedColors = updated.colors;
    const savedCategory = updated.category;
    if (Array.isArray(savedColors) && savedColors.includes("Sage") && savedColors.includes("Green")) {
      pass(`colors saved: ${JSON.stringify(savedColors)}`);
    } else {
      fail(`colors not saved correctly`, savedColors);
    }
    if (savedCategory === "Floral") {
      pass(`category saved: ${savedCategory}`);
    } else {
      fail(`category not saved correctly`, savedCategory);
    }
  } else {
    fail(`PATCH failed (${patch.status})`, patch.body);
    return;
  }

  // ── 4. GET with ?color=Sage (should return 1) ─────────────────────────────
  console.log("\n4. GET ?color=Sage");
  const byColor = await req("GET", "/api/design?color=Sage");
  const colorResults = byColor.body as unknown[];
  if (Array.isArray(colorResults) && colorResults.length === 1) {
    pass(`color=Sage → ${colorResults.length} result (correct)`);
  } else {
    fail(`color=Sage → expected 1, got ${Array.isArray(colorResults) ? colorResults.length : "non-array"}`, colorResults);
  }

  // ── 5. GET with ?category=Floral (should return 1) ────────────────────────
  console.log("\n5. GET ?category=Floral");
  const byCat = await req("GET", "/api/design?category=Floral");
  const catResults = byCat.body as unknown[];
  if (Array.isArray(catResults) && catResults.length === 1) {
    pass(`category=Floral → ${catResults.length} result (correct)`);
  } else {
    fail(`category=Floral → expected 1, got ${Array.isArray(catResults) ? catResults.length : "non-array"}`, catResults);
  }

  // ── 6. GET with ?color=Sage&category=Floral (should return 1) ─────────────
  console.log("\n6. GET ?color=Sage&category=Floral");
  const combo = await req("GET", "/api/design?color=Sage&category=Floral");
  const comboResults = combo.body as unknown[];
  if (Array.isArray(comboResults) && comboResults.length === 1) {
    pass(`combined filter → ${comboResults.length} result (correct)`);
  } else {
    fail(`combined filter → expected 1, got ${Array.isArray(comboResults) ? comboResults.length : "non-array"}`);
  }

  // ── 7. GET with mismatched filter (should return 0) ───────────────────────
  console.log("\n7. GET ?category=Traditional (no matches)");
  const noMatch = await req("GET", "/api/design?category=Traditional");
  const noMatchResults = noMatch.body as unknown[];
  if (Array.isArray(noMatchResults) && noMatchResults.length === 0) {
    pass(`category=Traditional → 0 results (correct)`);
  } else {
    fail(`expected 0, got ${Array.isArray(noMatchResults) ? noMatchResults.length : "non-array"}`);
  }

  // ── 8. GET ?search= (search by design code) ───────────────────────────────
  console.log("\n8. GET ?search=FL0 (code prefix)");
  const bySearch = await req("GET", "/api/design?search=FL0");
  const searchResults = bySearch.body as unknown[];
  if (Array.isArray(searchResults) && searchResults.length >= 1) {
    pass(`search=FL0 → ${searchResults.length} result(s) (correct)`);
  } else {
    fail(`search failed`, searchResults);
  }

  // ── 9. PATCH clear colors/category ────────────────────────────────────────
  console.log("\n9. PATCH clear colors + category");
  const clear = await req("PATCH", `/api/design/${target.id}`, {
    colors: null,
    category: null,
  });
  if (clear.status === 200) {
    const cleared = clear.body as Record<string, unknown>;
    // stripNulls strips null values from response
    const hasColors = "colors" in cleared && cleared.colors !== null;
    const hasCat = "category" in cleared && cleared.category !== null;
    if (!hasColors && !hasCat) {
      pass("colors and category cleared (stripped from response)");
    } else {
      fail("colors/category not cleared", { colors: cleared.colors, category: cleared.category });
    }
  } else {
    fail(`Clear PATCH failed (${clear.status})`, clear.body);
  }

  // ── 10. Confirm filter returns 0 after clearing ───────────────────────────
  console.log("\n10. GET ?color=Sage after clearing (should return 0)");
  const afterClear = await req("GET", "/api/design?color=Sage");
  const afterClearResults = afterClear.body as unknown[];
  if (Array.isArray(afterClearResults) && afterClearResults.length === 0) {
    pass(`color=Sage after clear → 0 results (correct)`);
  } else {
    fail(`expected 0, got ${Array.isArray(afterClearResults) ? afterClearResults.length : "non-array"}`);
  }

  // ── 11. Total design count unchanged ──────────────────────────────────────
  console.log("\n11. Total design count unchanged");
  const finalAll = await req("GET", "/api/design");
  const finalDesigns = finalAll.body as unknown[];
  if (Array.isArray(finalDesigns) && finalDesigns.length === designs.length) {
    pass(`Still ${finalDesigns.length} designs — no rows created or deleted`);
  } else {
    fail(`Count changed: was ${designs.length}, now ${Array.isArray(finalDesigns) ? finalDesigns.length : "unknown"}`);
  }

  console.log(`\n${ process.exitCode ? "❌ Some tests FAILED" : "✅ All tests PASSED" }\n`);
}

main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
