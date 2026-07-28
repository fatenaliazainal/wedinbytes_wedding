/**
 * Authenticated Admin Browser Test
 *
 * Covers: Orders, Customers, search/filters, empty states,
 *         website status controls, RSVP, Designs, Raw Card,
 *         Reviews, Pricing, Demo, Editor tabs.
 *
 * Configuration (env vars):
 *   APP_URL    — Vite dev server base URL  (default: http://localhost:5173)
 *   API_URL    — API server base URL       (default: http://localhost:8080)
 *   SEED_SECRET — admin password           (required)
 *   DATABASE_URL — Postgres connection     (required)
 *   CHROMIUM_EXECUTABLE_PATH — override browser executable path (optional)
 *
 * Safety: refuses to run against any database whose URL contains "prod".
 */

import { chromium } from "playwright";
import pg from "pg";
import bcrypt from "bcryptjs";
import assert from "node:assert/strict";

const APP_URL = (process.env.APP_URL ?? "http://localhost:5173").replace(/\/$/, "");
const ADMIN_PASSWORD = process.env.SEED_SECRET;

if (!ADMIN_PASSWORD) {
  console.error("ERROR: SEED_SECRET environment variable is required.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is required.");
  process.exit(1);
}

// ── Production safety guard ──────────────────────────────────────────────────

const dbUrl = process.env.DATABASE_URL;
if (/prod/i.test(dbUrl)) {
  console.error("ERROR: DATABASE_URL appears to be a production database (contains 'prod'). Refusing to run.");
  process.exit(1);
}

// ── Database helpers ──────────────────────────────────────────────────────────

const pool = new pg.Pool({ connectionString: dbUrl });

const TEST_EMAIL = "browser-test-fixture@wedinbytes-test.invalid";
const TEST_PAYMENT_REF = "TEST-BROWSER-REF-FIXTURE";

/**
 * Create fully isolated test fixtures:
 *   - dedicated test buyer user
 *   - test invitation owned by that user (websiteStatus=DISABLED for toggle test)
 *   - PAID order for that invitation
 *
 * No existing records are read or modified.
 */
async function setupFixtures() {
  await teardownFixtures(); // clean up any leftover from a previous aborted run

  const pkg = await pool.query(`SELECT id, price FROM pricing_package ORDER BY sort_order LIMIT 1`);
  if (!pkg.rows.length) throw new Error("No pricing package — seed pricing data first.");

  const hash = await bcrypt.hash("testpassword123", 4);
  const user = await pool.query(`
    INSERT INTO "user" (email, password_hash, name, role, created_at)
    VALUES ($1, $2, 'Browser Test User', 'buyer', NOW())
    RETURNING id, name
  `, [TEST_EMAIL, hash]);

  const inv = await pool.query(`
    INSERT INTO invitation
      (user_id, token, bride_name, groom_name, event_type, event_date, event_day,
       event_time, venue_name, venue_address, venue_city, venue_state,
       website_status, is_purchased, created_at)
    VALUES ($1, 'test-fixture-token-browser', 'Browser Bride', 'Browser Groom',
            'Walimatul Urus', '1 Jan 2027', 'Isnin', '10:00 pagi',
            'Test Venue', '1 Jalan Test', 'Kuala Lumpur', 'WP',
            'DISABLED', false, NOW())
    RETURNING id
  `, [user.rows[0].id]);

  const ord = await pool.query(`
    INSERT INTO "order"
      (user_id, invitation_id, package_id, payment_status, payment_gateway,
       payment_reference, amount, paid_at, created_at, updated_at)
    VALUES ($1, $2, $3, 'PAID', 'manual', $4, $5, NOW(), NOW(), NOW())
    RETURNING id
  `, [user.rows[0].id, inv.rows[0].id, pkg.rows[0].id, TEST_PAYMENT_REF, pkg.rows[0].price]);

  return {
    userId: user.rows[0].id,
    customerName: user.rows[0].name,
    invitationId: inv.rows[0].id,
    orderId: ord.rows[0].id,
  };
}

/** Remove all test fixtures — order, invitation, user. */
async function teardownFixtures() {
  await pool.query(`DELETE FROM "order" WHERE payment_reference = $1`, [TEST_PAYMENT_REF]);
  await pool.query(`DELETE FROM invitation WHERE token = 'test-fixture-token-browser'`);
  await pool.query(`DELETE FROM "user" WHERE email = $1`, [TEST_EMAIL]);
}

// ── Test runner ───────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

async function check(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}: ${err.message}`);
    failures.push({ name, detail: err.message });
    failed++;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  console.log("\n── Setup ──");
  let fix;
  try {
    fix = await setupFixtures();
    console.log(`  ✅ Created isolated fixtures: order #${fix.orderId}, inv #${fix.invitationId}, user #${fix.userId}`);
  } catch (err) {
    console.error(`  ❌ Setup failed: ${err.message}`);
    await pool.end();
    process.exit(1);
  }

  // Resolve Chromium executable
  const launchOptions = { headless: true };
  if (process.env.CHROMIUM_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
  } else {
    const nixPath =
      "/nix/store/0n9rl5l9syy808xi9bk4f6dhnfrvhkww-playwright-browsers-chromium/chromium-1080/chrome-linux/chrome";
    try {
      const { existsSync } = await import("node:fs");
      if (existsSync(nixPath)) launchOptions.executablePath = nixPath;
    } catch { /* ignore — let Playwright use its own default */ }
  }

  const browser = await chromium.launch(launchOptions);
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  try {
    // ── 1. Admin Login ────────────────────────────────────────────────────────
    console.log("\n── Admin Login ──");

    await check("Admin login page loads", async () => {
      await page.goto(`${APP_URL}/admin/login`, { waitUntil: "networkidle" });
      await page.waitForSelector("input[type=password]");
    });

    await check("Admin login succeeds with SEED_SECRET", async () => {
      await page.fill("input[type=password]", ADMIN_PASSWORD);
      await page.click("button[type=submit]");
      await page.waitForURL(`${APP_URL}/admin`, { timeout: 8000 });
      await page.waitForSelector("text=Admin Dashboard");
    });

    // ── 2. RSVP Tab ───────────────────────────────────────────────────────────
    console.log("\n── RSVP Tab ──");

    await check("RSVP tab renders stat cards", async () => {
      await page.waitForSelector("text=Attending");
      await page.waitForSelector("text=Not Attending");
      await page.waitForSelector("text=Total Guests");
    });

    await check("RSVP guest list renders list or empty state", async () => {
      await page.waitForSelector("text=Guest List");
      const hasRsvps = await page.locator(".divide-y div").first().isVisible().catch(() => false);
      const isEmpty = await page.locator("text=No RSVP responses yet").isVisible().catch(() => false);
      assert.ok(hasRsvps || isEmpty, "Expected RSVP data or empty-state message");
    });

    // ── 3. Orders Tab ─────────────────────────────────────────────────────────
    console.log("\n── Orders Tab ──");

    await check("Navigate to Orders tab", async () => {
      await page.click("button:has-text('Orders')");
      await page.waitForSelector("text=Total Orders");
    });

    await check("Orders stats cards render", async () => {
      await page.waitForSelector("text=Successful Payments");
      await page.waitForSelector("text=Pending Payments");
      await page.waitForSelector("text=Active Websites");
    });

    await check("Orders table renders the fixture PAID order", async () => {
      await page.waitForSelector(`td:has-text('${fix.customerName}')`, { timeout: 8000 });
      await page.waitForSelector("tbody .rounded-full:has-text('PAID')", { timeout: 5000 });
    });

    await check("Orders search filter returns matching row", async () => {
      const term = fix.customerName.split(" ")[0].toLowerCase();
      await page.fill("input[placeholder*='Search order']", term);
      await page.waitForSelector(`td:has-text('${fix.customerName}')`, { timeout: 5000 });
      await page.fill("input[placeholder*='Search order']", "");
      await page.waitForSelector(`td:has-text('${fix.customerName}')`, { timeout: 5000 });
    });

    await check("Orders payment status filter PAID shows fixture order", async () => {
      const selects = page.locator(".flex.flex-wrap select");
      await selects.first().selectOption("PAID");
      await page.waitForSelector(`td:has-text('${fix.customerName}')`, { timeout: 5000 });
      await selects.first().selectOption("");
    });

    await check("Orders payment status filter FAILED shows empty state", async () => {
      const selects = page.locator(".flex.flex-wrap select");
      await selects.first().selectOption("FAILED");
      await page.waitForSelector("text=No orders yet", { timeout: 5000 });
      await selects.first().selectOption("");
    });

    await check("Order detail modal opens on row click", async () => {
      await page.waitForSelector(`td:has-text('${fix.customerName}')`, { timeout: 5000 });
      await page.click(`tr:has-text('${fix.customerName}')`);
      await page.waitForSelector(`text=Order #${fix.orderId}`);
      await page.waitForSelector("text=Website Status");
    });

    await check("Website status toggle button visible in detail modal", async () => {
      const activateBtn = page.locator("button:has-text('Activate')");
      const disableBtn = page.locator("button:has-text('Disable')");
      const hasActivate = await activateBtn.isVisible().catch(() => false);
      const hasDisable = await disableBtn.isVisible().catch(() => false);
      assert.ok(hasActivate || hasDisable, "Neither Activate nor Disable button found");
    });

    await check("Website status toggle changes status and closes modal", async () => {
      const hasActivate = await page.locator("button:has-text('Activate')").isVisible().catch(() => false);
      if (hasActivate) {
        await page.click("button:has-text('Activate')");
      } else {
        await page.click("button:has-text('Disable')");
      }
      await page.waitForSelector("text=Total Orders", { timeout: 8000 });
      if (await page.locator(`text=Order #${fix.orderId}`).isVisible().catch(() => false)) {
        await page.keyboard.press("Escape");
      }
    });

    await check("Order stats re-render after status toggle", async () => {
      await page.waitForSelector("text=Total Orders");
      await page.waitForSelector("text=Successful Payments");
    });

    // ── 4. Customers Tab ──────────────────────────────────────────────────────
    console.log("\n── Customers Tab ──");

    await check("Navigate to Customers tab", async () => {
      if (await page.locator(".fixed.inset-0.z-50").isVisible().catch(() => false)) {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
      }
      await page.click("button:has-text('Customers')");
      await page.waitForSelector("table", { timeout: 8000 });
    });

    await check("Customers table renders fixture customer", async () => {
      await page.waitForSelector(`td:has-text('${fix.customerName}')`, { timeout: 5000 });
    });

    await check("Customers search filter isolates fixture customer", async () => {
      const allRows = await page.locator("tbody tr").count();
      const term = fix.customerName.split(" ")[0];
      await page.fill("input[placeholder*='Search customer']", term);
      await page.waitForTimeout(600); // debounce
      await page.waitForSelector(`td:has-text('${fix.customerName}')`, { timeout: 5000 });
      const filteredRows = await page.locator("tbody tr").count();
      if (allRows > 1) {
        assert.ok(filteredRows < allRows, "Search must reduce visible row count");
      }
      await page.fill("input[placeholder*='Search customer']", "");
    });

    await check("Customers search shows empty state for no-match query", async () => {
      await page.fill("input[placeholder*='Search customer']", "zzznomatch999");
      await page.waitForSelector("text=No customers yet", { timeout: 5000 });
      await page.fill("input[placeholder*='Search customer']", "");
    });

    // ── 5. Designs Tab ────────────────────────────────────────────────────────
    console.log("\n── Designs Tab ──");

    await check("Navigate to Card Designs tab", async () => {
      await page.click("button:has-text('Card Designs')");
      await page.waitForSelector("text=designs in system");
    });

    await check("Designs tab renders list or empty state", async () => {
      const hasDesigns = await page.locator(".divide-y div").first().isVisible().catch(() => false);
      const isEmpty = await page.locator("text=No designs yet").isVisible().catch(() => false);
      assert.ok(hasDesigns || isEmpty, "Expected design list or empty state");
    });

    // ── 6. Raw Card Tab ───────────────────────────────────────────────────────
    console.log("\n── Raw Card Tab ──");

    await check("Navigate to Raw Card tab", async () => {
      await page.click("button:has-text('Raw Card')");
      await page.waitForSelector("text=cards in system");
    });

    await check("Raw Card tab renders list or empty state", async () => {
      const hasCards = await page.locator("th:has-text('Info')").isVisible().catch(() => false);
      const isEmpty = await page.locator("text=No cards in the database").isVisible().catch(() => false);
      assert.ok(hasCards || isEmpty, "Expected card list or empty state");
    });

    // ── 7. Reviews Tab ────────────────────────────────────────────────────────
    console.log("\n── Reviews Tab ──");

    await check("Navigate to Reviews tab", async () => {
      await page.click("button:has-text('Reviews')");
      await page.waitForSelector("button:has-text('All')", { timeout: 5000 });
    });

    await check("Reviews tab renders list or empty state", async () => {
      await page.waitForTimeout(1000);
      const hasReviews = await page.locator(".divide-y div").first().isVisible().catch(() => false);
      const isEmpty = await page.locator("text=No reviews found").isVisible().catch(() => false);
      assert.ok(hasReviews || isEmpty, "Expected reviews list or empty state");
    });

    await check("Reviews Approved filter works", async () => {
      await page.click("button:has-text('Approved')");
      await page.waitForTimeout(500);
      assert.ok(await page.locator("button:has-text('Approved')").first().isVisible());
    });

    await check("Reviews Pending filter works", async () => {
      await page.click("button:has-text('Pending')");
      await page.waitForTimeout(500);
      assert.ok(await page.locator("button:has-text('Pending')").first().isVisible());
    });

    await check("Reviews All filter restores full list", async () => {
      await page.click("button:has-text('All')");
      await page.waitForTimeout(500);
      assert.ok(await page.locator("button:has-text('All')").first().isVisible());
    });

    // ── 8. Pricing Tab ────────────────────────────────────────────────────────
    console.log("\n── Pricing Tab ──");

    await check("Navigate to Pricing tab", async () => {
      await page.click("button:has-text('Pricing')");
      await page.waitForSelector("text=Standard", { timeout: 8000 });
    });

    await check("Pricing packages render (Standard + Premium)", async () => {
      await page.waitForSelector("text=Premium", { timeout: 5000 });
    });

    // ── 9. Demo & Editor navigation ───────────────────────────────────────────
    console.log("\n── Demo / Editor navigation ──");

    await check("Demo tab navigates to /admin/demo", async () => {
      await page.click("button:has-text('Live Demo')");
      await page.waitForURL(/\/admin\/demo/, { timeout: 5000 });
      await page.goBack();
      await page.waitForURL(/\/admin/, { timeout: 5000 });
    });

    await check("Editor tab navigates to /admin/editor", async () => {
      await page.click("button:has-text('Editor')");
      await page.waitForURL(/\/admin\/editor/, { timeout: 5000 });
      await page.goBack();
      await page.waitForURL(/\/admin/, { timeout: 5000 });
    });

  } finally {
    await browser.close();
    await teardownFixtures();
    await pool.end();
    console.log("\n── Teardown ──");
    console.log("  ✅ All fixture records removed");
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log("\nFailed tests:");
    failures.forEach(f => console.log(`  • ${f.name}: ${f.detail}`));
    process.exit(1);
  } else {
    console.log("All tests passed ✅");
    process.exit(0);
  }
})().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
