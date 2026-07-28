/**
 * Authenticated Admin API Test
 *
 * Covers all admin endpoints via direct HTTP calls:
 *   Auth, RSVP, Orders (list/filter/single/stats), Website status controls,
 *   Customers (list/search), Reviews (list/filter), Designs, Raw Cards, Pricing.
 *
 * Configuration (env vars):
 *   API_URL     — API server base URL  (default: http://localhost:8080)
 *   SEED_SECRET — admin password       (required)
 *   DATABASE_URL — Postgres connection  (required)
 *
 * Safety: refuses to run against any database whose name contains "prod".
 */

import assert from "node:assert/strict";
import pg from "pg";
import bcrypt from "bcryptjs";

const API_URL = (process.env.API_URL ?? "http://localhost:8080").replace(/\/$/, "");
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

const TEST_EMAIL = "admin-test-fixture@wedinbytes-test.invalid";
const TEST_PAYMENT_REF = "TEST-API-REF-FIXTURE";

/**
 * Create fully isolated test fixtures:
 *   - a dedicated test buyer user
 *   - a test invitation owned by that user
 *   - a PAID order for that invitation
 *
 * Returns all created record IDs for cleanup.
 * No existing records are modified.
 */
async function setupFixtures() {
  // Clean up any leftover fixtures from a previous aborted run
  await teardownFixtures();

  // First pricing package (read-only, not modified)
  const pkg = await pool.query(`SELECT id, price FROM pricing_package ORDER BY sort_order LIMIT 1`);
  if (!pkg.rows.length) throw new Error("No pricing package found — seed pricing data first.");

  // Create test buyer
  const hash = await bcrypt.hash("testpassword123", 4); // low cost for speed
  const user = await pool.query(`
    INSERT INTO "user" (email, password_hash, name, role, created_at)
    VALUES ($1, $2, 'Test Fixture User', 'buyer', NOW())
    RETURNING id, name
  `, [TEST_EMAIL, hash]);

  // Create test invitation (all NOT NULL fields included)
  const inv = await pool.query(`
    INSERT INTO invitation
      (user_id, token, bride_name, groom_name, event_type, event_date, event_day,
       event_time, venue_name, venue_address, venue_city, venue_state,
       website_status, is_purchased, created_at)
    VALUES ($1, 'test-fixture-token-api', 'Test Bride', 'Test Groom',
            'Walimatul Urus', '1 Jan 2027', 'Isnin', '10:00 pagi',
            'Test Venue', '1 Jalan Test', 'Kuala Lumpur', 'WP',
            'DISABLED', false, NOW())
    RETURNING id
  `, [user.rows[0].id]);

  // Create PAID order
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

/** Remove all test fixtures created by setupFixtures. */
async function teardownFixtures() {
  await pool.query(`DELETE FROM "order" WHERE payment_reference = $1`, [TEST_PAYMENT_REF]);
  await pool.query(`DELETE FROM invitation WHERE token = 'test-fixture-token-api'`);
  await pool.query(`DELETE FROM "user" WHERE email = $1`, [TEST_EMAIL]);
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

let cookie = "";

async function api(method, path, body, extra = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...extra,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const sc = res.headers.get("set-cookie");
  if (sc) cookie = sc.split(";")[0];
  return res;
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
    console.log(`  ✅ Created isolated fixtures: order #${fix.orderId}, invitation #${fix.invitationId}, user #${fix.userId}`);
  } catch (err) {
    console.error(`  ❌ Setup failed: ${err.message}`);
    await pool.end();
    process.exit(1);
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    console.log("\n── Authentication ──");

    await check("Admin login with correct password sets session", async () => {
      const res = await api("POST", "/auth/admin-login", { password: ADMIN_PASSWORD });
      assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
      const body = await res.json();
      assert.equal(body.role, "admin");
      assert.ok(cookie, "Session cookie must be set");
    });

    await check("Admin login rejects wrong password", async () => {
      const saved = cookie;
      const res = await api("POST", "/auth/admin-login", { password: "wrongpassword" });
      assert.equal(res.status, 401);
      cookie = saved;
    });

    await check("/auth/me returns admin when logged in", async () => {
      const res = await api("GET", "/auth/me");
      assert.equal(res.status, 200);
      assert.equal((await res.json()).role, "admin");
    });

    // ── RSVP ─────────────────────────────────────────────────────────────────
    console.log("\n── RSVP ──");

    await check("GET /rsvp returns array", async () => {
      const res = await api("GET", "/rsvp");
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(await res.json()));
    });

    await check("GET /rsvp/count returns attending/notAttending/totalGuests", async () => {
      const res = await api("GET", "/rsvp/count");
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok("attending" in body && "notAttending" in body && "totalGuests" in body);
    });

    // ── Orders ────────────────────────────────────────────────────────────────
    console.log("\n── Orders ──");

    await check("GET /admin/orders returns array containing fixture order", async () => {
      const res = await api("GET", "/admin/orders");
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body));
      assert.ok(body.some(o => o.id === fix.orderId), "Fixture order must be in list");
    });

    let fixtureOrder = null;
    await check("Fixture order has customer, package, invitation, amount fields", async () => {
      const res = await api("GET", "/admin/orders");
      const body = await res.json();
      fixtureOrder = body.find(o => o.id === fix.orderId);
      assert.ok(fixtureOrder, "Fixture order not found");
      assert.ok(fixtureOrder.customer?.name, "Missing customer.name");
      assert.ok(fixtureOrder.package?.name, "Missing package.name");
      assert.ok(fixtureOrder.invitation?.websiteStatus, "Missing invitation.websiteStatus");
      assert.ok(fixtureOrder.amount, "Missing amount");
      assert.ok(fixtureOrder.createdAt, "Missing createdAt");
    });

    await check("GET /admin/orders/stats returns summary with >= 1 PAID order", async () => {
      const res = await api("GET", "/admin/orders/stats");
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.totalOrders >= 1, "totalOrders should be >= 1");
      assert.ok(body.successfulPayments >= 1, "successfulPayments should be >= 1");
      assert.ok("pendingPayments" in body && "failedPayments" in body && "activeWebsites" in body);
      assert.ok(Array.isArray(body.recentOrders));
    });

    await check("GET /admin/orders?paymentStatus=PAID includes fixture order", async () => {
      const res = await api("GET", "/admin/orders?paymentStatus=PAID");
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.every(o => o.paymentStatus === "PAID"), "All results should be PAID");
      assert.ok(body.some(o => o.id === fix.orderId), "Fixture order must appear in PAID filter");
    });

    await check("GET /admin/orders?paymentStatus=FAILED returns no fixture order", async () => {
      const res = await api("GET", "/admin/orders?paymentStatus=FAILED");
      assert.equal(res.status, 200);
      const body = await res.json();
      // Fixture order is PAID, not FAILED
      assert.ok(!body.some(o => o.id === fix.orderId), "Fixture PAID order must not appear in FAILED filter");
    });

    await check("GET /admin/orders?search matches fixture customer name", async () => {
      const term = fix.customerName.split(" ")[0];
      const res = await api("GET", `/admin/orders?search=${encodeURIComponent(term.toLowerCase())}`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.some(o => o.id === fix.orderId), "Fixture order must match search");
    });

    await check("GET /admin/orders?search=zzznomatch returns empty", async () => {
      const res = await api("GET", "/admin/orders?search=zzznomatch");
      assert.equal(res.status, 200);
      assert.equal((await res.json()).length, 0);
    });

    await check("GET /admin/orders/:id returns single fixture order", async () => {
      const res = await api("GET", `/admin/orders/${fix.orderId}`);
      assert.equal(res.status, 200);
      assert.equal((await res.json()).id, fix.orderId);
    });

    await check("GET /admin/orders/:id returns 404 for unknown id", async () => {
      const res = await api("GET", "/admin/orders/999999");
      assert.equal(res.status, 404);
    });

    // ── Website Status Controls ───────────────────────────────────────────────
    console.log("\n── Website Status Controls ──");

    await check("PATCH /admin/invitations/:id/status sets ACTIVE", async () => {
      const res = await api("PATCH", `/admin/invitations/${fix.invitationId}/status`, { status: "ACTIVE" });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.id, fix.invitationId);
      // Computed status: PREVIEW when isPurchased=false, ACTIVE when true
      assert.ok(["ACTIVE", "PREVIEW"].includes(body.websiteStatus),
        `Unexpected websiteStatus: ${body.websiteStatus}`);
    });

    await check("PATCH /admin/invitations/:id/status sets DISABLED", async () => {
      const res = await api("PATCH", `/admin/invitations/${fix.invitationId}/status`, { status: "DISABLED" });
      assert.equal(res.status, 200);
      assert.equal((await res.json()).websiteStatus, "DISABLED");
    });

    await check("PATCH /admin/invitations/:id/status rejects invalid status value", async () => {
      const res = await api("PATCH", `/admin/invitations/${fix.invitationId}/status`, { status: "INVALID" });
      assert.equal(res.status, 400);
    });

    await check("PATCH /admin/invitations/:id/status returns 404 for unknown id", async () => {
      const res = await api("PATCH", "/admin/invitations/999999/status", { status: "ACTIVE" });
      assert.equal(res.status, 404);
    });

    // ── Customers ─────────────────────────────────────────────────────────────
    console.log("\n── Customers ──");

    await check("GET /admin/customers includes fixture customer", async () => {
      const res = await api("GET", "/admin/customers");
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body) && body.length >= 1);
      assert.ok(body.some(c => c.id === fix.userId), "Fixture customer must appear in list");
      // Admin user must not appear
      assert.ok(!body.some(c => c.email === "admin@wedinbytes.com"),
        "Admin user must not appear in customer list");
    });

    await check("Customer record has required fields", async () => {
      const res = await api("GET", "/admin/customers");
      const body = await res.json();
      const c = body.find(c => c.id === fix.userId);
      assert.ok(c, "Fixture customer not found");
      assert.ok(c.id && c.name && c.email, "Missing basic customer fields");
      assert.ok("totalOrders" in c && "totalPaid" in c, "Missing totals");
      assert.ok(Array.isArray(c.websites), "websites must be array");
    });

    await check("GET /admin/customers?search filters to fixture customer by name", async () => {
      const term = fix.customerName.split(" ")[0];
      const res = await api("GET", `/admin/customers?search=${encodeURIComponent(term.toLowerCase())}`);
      const body = await res.json();
      assert.ok(body.some(c => c.id === fix.userId), "Fixture customer must match search");
    });

    await check("GET /admin/customers?search=zzznomatch returns empty", async () => {
      const res = await api("GET", "/admin/customers?search=zzznomatch");
      assert.equal((await res.json()).length, 0);
    });

    // ── Auth guard ────────────────────────────────────────────────────────────
    console.log("\n── Auth guard ──");

    await check("Admin endpoint returns 403 without session", async () => {
      const saved = cookie;
      cookie = "";
      const res = await api("GET", "/admin/orders");
      assert.equal(res.status, 403, `Expected 403, got ${res.status}`);
      cookie = saved;
    });

    // ── Reviews ───────────────────────────────────────────────────────────────
    console.log("\n── Reviews ──");

    await check("GET /admin/reviews returns reviews array", async () => {
      const res = await api("GET", "/admin/reviews");
      assert.equal(res.status, 200);
      assert.ok(Array.isArray((await res.json()).reviews));
    });

    await check("GET /admin/reviews?status=approved only returns approved reviews", async () => {
      const res = await api("GET", "/admin/reviews?status=approved");
      const body = await res.json();
      assert.ok(body.reviews.every(r => r.status === "approved"));
    });

    await check("GET /admin/reviews?status=pending only returns pending reviews", async () => {
      const res = await api("GET", "/admin/reviews?status=pending");
      const body = await res.json();
      assert.ok(body.reviews.every(r => r.status === "pending"));
    });

    // ── Designs ───────────────────────────────────────────────────────────────
    console.log("\n── Designs ──");

    await check("GET /design returns array of designs", async () => {
      const res = await api("GET", "/design");
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body) && body.length >= 1);
    });

    await check("Seeded design has id, name, isActive, designCode", async () => {
      const res = await api("GET", "/design");
      const d = (await res.json())[0];
      assert.ok(d.id && d.name && "isActive" in d && d.designCode);
    });

    // ── Raw Cards ─────────────────────────────────────────────────────────────
    console.log("\n── Raw Cards ──");

    await check("GET /cards returns array", async () => {
      const res = await api("GET", "/cards");
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(await res.json()));
    });

    // ── Pricing ───────────────────────────────────────────────────────────────
    console.log("\n── Pricing ──");

    await check("GET /pricing returns packages with features", async () => {
      const res = await api("GET", "/pricing");
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body) && body.length >= 2, `Expected >= 2 packages, got ${body.length}`);
      assert.ok(body.every(p => Array.isArray(p.features)), "Each package must have features array");
      const pkg = body[0];
      assert.ok(pkg.id && pkg.name && pkg.price, "Missing basic package fields");
      assert.ok("isActive" in pkg && "isFeatured" in pkg, "Missing status fields");
    });

  } finally {
    await teardownFixtures();
    await pool.end();
    console.log("\n── Teardown ──");
    console.log("  ✅ All fixture records removed");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
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
