---
name: ToyyibPay payment integration
description: Sandbox-first gateway flow and verification boundaries for invitation payments
---

ToyyibPay payments use the existing order and invitation records for both Buyers and Business Accounts. The server creates fixed-amount bills from the persisted pricing package, redirects to ToyyibPay, validates callback MD5 hashes, independently checks bill transactions, and only then marks the order paid and invitation purchased.

**Why:** Payment status and amount must never be trusted from the browser or an unverified callback; invitation activation is the product access boundary.

**How to apply:** Keep the user secret in Replit Secrets, keep the category code/mode/public callback base URL in environment configuration, use the Dev host while sandbox testing, and retain pending/failed states in read-only Payment History.