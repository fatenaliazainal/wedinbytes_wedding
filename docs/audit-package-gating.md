# Package Gating Audit Report

> Audit dijalankan: 2026-08-18
> Status: **DEPLOYED TO PRODUCTION ✅ — PACKAGE ENTITLEMENT AUDIT: PASS**
> Tujuan: Kenal pasti dan betulkan mismatch antara intended behavior dan actual implementation.

---

## A. Apa yang dokumentasi katakan

| Feature | Standard | Premium | Signature |
|---|:---:|:---:|:---:|
| RSVP / Wishes | ✅ | ✅ | ✅ |
| Contact | ✅ | ✅ | ✅ |
| Location & Navigation | ✅ | ✅ | ✅ |
| Calendar | ✅ | ✅ | ✅ |
| Countdown | ✅ | ✅ | ✅ |
| Background Music | ✅ | ✅ | ✅ |
| Photo Gallery | ❌ | ✅ | ✅ |
| Money Gift | ❌ | ✅ | ✅ |
| Dress Code | ❌ | ✅ | ✅ |
| Gift Registry | ❌ | ❌ | ✅ |

**Expected behavior:**
- Server blocks save/upload for gated fields
- Server strips gated fields from public GET response (guest view)
- Frontend hides gated sections from guests
- Package downgrade: gated section hidden, data preserved in DB

---

## B. Production Database — Actual Package Records

> Verified 2026-08-18 via read-only production DB query.

### Package records (`pricing_package`)

| id | name | is_active |
|---|---|---|
| 1 | Standard | ✅ |
| 2 | Premium | ✅ |
| 4 | Signature | ✅ |

### Feature mapping (`pricing_feature`) — confirmed matches expected entitlement

| Feature | Standard (id:1) | Premium (id:2) | Signature (id:4) |
|---|:---:|:---:|:---:|
| RSVP / Wishes | ✅ | ✅ | ✅ |
| Contact | ✅ | ✅ | ✅ |
| Location & Navigation | ✅ | ✅ | ✅ |
| Calendar | ✅ | ✅ | ✅ |
| Countdown | ✅ | ✅ | ✅ |
| Background Music | ✅ | ✅ | ✅ |
| Photo Gallery | ❌ | ✅ | ✅ |
| Money Gift | ❌ | ✅ | ✅ |
| Dress Code | ❌ | ✅ | ✅ |
| Gift Registry | ❌ | ❌ | ✅ |

**DB feature mapping matches expected entitlement table exactly. ✅**

### Invitation distribution (production, excluding demo)

| Package | Count | Notes |
|---|---|---|
| Standard | 12 | |
| Premium | 7 | |
| Signature | 2 | |
| null package | 2 | Both `is_purchased = false` — old unpurchased records predating package system |

### Gated data in DB — Standard invitations

| Token | giftDisplay | dresscode stored | gallery | is_purchased |
|---|---|---|---|---|
| `9b17e4d2fd0a469a` | **true** | Hijau Sage & Pink | 0 | **paid** |
| 8 others | false | Hijau Sage & Pink | 0 | mixed |

> ⚠️ `9b17e4d2fd0a469a` (eza-akmal) has `gift_display=true` stored in DB from before write gate existed.
> After deploy: public API response correctly strips it. DB value unchanged.

---

## C. Apa yang production code sebenarnya buat (post-fix)

### Server-side — `invitationHasFeature()` call sites

| Route | Feature Checked | Gate Type |
|---|---|---|
| `PATCH /invitation/:token` | `"Money Gift"` | Write gate ✅ |
| `PATCH /invitation/:token` | `"Photo Gallery"` | Write gate ✅ |
| `PATCH /invitation/:token` | `"Dress Code"` | Write gate ✅ |
| `POST /gift-qr-upload` | `"Money Gift"` | Upload gate ✅ |
| `POST /gallery-upload` | `"Photo Gallery"` | Upload gate ✅ |
| `publicInvitation()` (guest GET) | `"Dress Code"` | Read strip ✅ |
| `publicInvitation()` (guest GET) | `"Photo Gallery"` | Read strip ✅ |
| `publicInvitation()` (guest GET) | `"Money Gift"` | Read strip ✅ |
| `publicInvitation()` (guest GET) | `"Gift Registry"` | Read strip ✅ |
| `GET /registry/:token` | `"Gift Registry"` | Read gate ✅ |
| `POST /registry/:token` | `"Gift Registry"` | Write gate ✅ |
| `PATCH /registry/:token` | `"Gift Registry"` | Write gate ✅ |
| `DELETE /registry/:token` | `"Gift Registry"` | Write gate ✅ |
| `POST /registry-thumbnail-upload` | `"Gift Registry"` | Upload gate ✅ |

### publicInvitation() strip logic

Strip block runs ONLY when: `!isDemoToken(token) && !ownerView`

- Demo tokens (`demo`, `demo-en`) → bypass — all features shown (for marketing)
- Owner/admin view (`ownerView=true`) → bypass — editor always gets full data
- Guest public view → strip runs → gated fields set to null/empty/false

| Field stripped (guest, non-entitled package) |
|---|
| `dresscode → null` |
| `dresscodeTheme → null` |
| `dresscodeColors → []` |
| `galleryImages → []` |
| `giftDisplay → false` |
| `giftTitle → null` |
| `giftRecipient → null` |
| `giftBankName → null` |
| `giftAccountNumber → null` |
| `giftQrCodes → null` |
| `registryRecipientName → null` |
| `registryRecipientAddress → null` |

### Frontend — WeddingCard.tsx section render conditions

| Section | Render Condition | Gated? |
|---|---|---|
| Invitation Text | Always | ❌ Semua pakej |
| Event Details | Always | ❌ Semua pakej |
| Programme | `inv.itinerary.length > 0` ATAU `schedule` ada nilai | ❌ Semua pakej |
| **Prayer (Doa)** | **Sentiasa dipapar — tiada syarat** | ❌ **Semua pakej** |
| Countdown | Always | ❌ Semua pakej |
| **Dress Code** | `dresscode \|\| dresscodeTheme \|\| dresscodeColors.length > 0` | ✅ Strip by server |
| RSVP | `inv.rsvpEnabled !== false` | ❌ Semua pakej |
| Wishes | `guestWishes.length > 0` | ❌ Semua pakej |
| **Photo Gallery** | `inv.galleryImages.length > 0` | ✅ Strip by server |
| Money Gift (nav) | `isDemoInvitation \|\| inv.giftDisplay === true \|\| registryItems.length > 0` | ✅ Strip by server |
| Footer | `inv.showFooter !== false` | ❌ Semua pakej |

> **Nota:** Programme dan Prayer tidak di-gate oleh package. Kedua-duanya muncul untuk semua pakej.
> Jika ingin gate, perlu tambah `pricing_feature` record + strip block + render condition.

### Frontend — Editor (EditorPage.tsx) tab gating

| Tab | Feature Required |
|---|---|
| Dress Code | `"Dress Code"` |
| Gallery | `"Photo Gallery"` |
| Gift | `"Money Gift"` |
| Gift Registry | `"Gift Registry"` |
| RSVP | `"RSVP / Wishes"` |
| Contact | `"Contact"` |
| Location | `"Location & Navigation"` |

---

## D. Database — autoSeed.ts behavior

| Package | Seed condition |
|---|---|
| Standard | Created only when `pricing_package` table is empty |
| Premium | Created only when `pricing_package` table is empty |
| Signature | Idempotent — created if name `"Signature"` not found |
| Signature → Gift Registry feature | Backfilled if missing on existing Signature record |

> ✅ autoSeed.ts will NOT overwrite existing Standard/Premium records.
> ✅ Modifying autoSeed.ts is safe for Standard/Premium — only affects first-time seeding.

---

## E. Mismatches Found (original audit)

### HIGH — All CLOSED ✅

| # | Issue | Status |
|---|---|---|
| 1 | Gallery write not gated on server | ✅ FIXED |
| 2 | Dress Code write not gated on server | ✅ FIXED |
| 3 | WeddingCard renders gated sections based on data (package downgrade leak) | ✅ RESOLVED via server strip |
| 4 | GET /invitation returns all gated fields regardless of package | ✅ FIXED |

### MEDIUM — Cancelled

| # | Issue | Status |
|---|---|---|
| 5 | Business route: Dress Code not gated during customer creation | 🚫 Cancelled |
| 6 | Gift nav icon uses data presence, not package (downgrade scenario) | 🚫 Cancelled |
| 7 | Dress Code READ strip inconsistent for owner view (borderline LOW) | 🚫 Cancelled |

> Owner/editor gets full data by design — this is intentional so saved values are not lost in editor.

### LOW / INFO

| # | Issue | Status |
|---|---|---|
| 8 | Gift Registry display is bottom sheet (not WeddingCard) | ✅ By design, no action |
| 9 | No hardcoded package name comparisons found | ✅ OK |

---

## F. Fixes Applied

| # | Fix | File | Commit |
|---|---|---|---|
| 1 | Gallery write gate in `PATCH /invitation/:token` | `routes/invitation.ts` | `1329983` |
| 2 | Gallery upload gate in `POST /gallery-upload` | `routes/cards.ts` | `1329983` |
| 3 | Dress Code write gate in `PATCH /invitation/:token` | `routes/invitation.ts` | `1329983` |
| 4a | Strip `galleryImages` from guest GET (no Photo Gallery) | `routes/invitation.ts` | `1329983` |
| 4b | Strip Dress Code fields from guest GET (no Dress Code) | `routes/invitation.ts` | `1329983` |
| 4c | Strip all Money Gift fields from guest GET (no Money Gift) | `routes/invitation.ts` | `bc919a7` |
| 4d | Strip Gift Registry fields from guest GET (no Gift Registry) | `routes/invitation.ts` | `bc919a7` |

**All 4 gated features protected on both WRITE and PUBLIC READ.**
**No existing data deleted. No DB migration. No package reassignments.**

---

## G. Production Deployment & Smoke Tests

> Deployed: 2026-08-18 via commit `a5217dd` (Published your App)
> Production URL: `https://wedinstudio.com`
> Deployment type: Autoscale — public

### Smoke test results (tested against live production)

| Test | Expected | Result |
|---|---|---|
| Standard `9b17e4d2fd0a469a` — `giftDisplay` | `false` | ✅ PASS |
| Standard `9b17e4d2fd0a469a` — `giftTitle`, `giftRecipient`, `giftBankName` | `null` | ✅ PASS |
| Standard `9b17e4d2fd0a469a` — `dresscode`, `dresscodeTheme`, `dresscodeColors` | `null/[]` | ✅ PASS |
| Standard `9b17e4d2fd0a469a` — `galleryImages` | `[]` | ✅ PASS |
| Standard — non-gated (RSVP, venue, music, date) | all present | ✅ PASS |
| Premium `6b2ccd98256948b3` — gallery | 4 images returned | ✅ PASS |
| Signature `21aa240e66624e6c` — `giftDisplay`, `dresscode`, gallery | all returned | ✅ PASS |
| Registry endpoint — Standard token | `[]` returned | ✅ PASS |

### DB integrity post-deploy — Standard affected customer

| field | DB value | Notes |
|---|---|---|
| `gift_display` | `true` | Unchanged in DB ✅ |
| `gift_title` | `eGift` | Unchanged in DB ✅ |
| `gift_recipient` | `Nama Penerima` | Unchanged in DB ✅ |
| `gift_bank_name` | `Maybank` | Unchanged in DB ✅ |
| `gift_account_number` | `1234567890` | Unchanged in DB ✅ |

> Data preserved in DB. Only public API response strips it for Standard guests.
> Owner/editor still sees full data via `ownerView=true`.

### Browser cache note

Post-deploy, the gift section may still appear on existing Standard invitations if the user's browser has cached the old API response (`cache-control: private` + ETag). This is **not a server bug** — a fresh visitor or hard refresh (`Ctrl+Shift+R`) or incognito window will show the correct stripped response immediately.

---

## H. Additional finding: "Gift Corner" in production DB

During verification, production DB shows `pricing_feature` IDs for Signature jump from id:25 (Dress Code) to id:27 (Gift Registry). **id:26 does not appear** — "Gift Corner" referenced in previous dev audit was not present in production.

- `"Gift Registry"` (id:27) — used by `routes/gift-registry.ts` for all CRUD gates ✅
- `"Gift Corner"` — absent from production DB; may have only existed in development
- No action taken.

---

## Changelog

| Tarikh | Perubahan |
|---|---|
| 2026-08-18 | Audit report dibuat |
| 2026-08-18 | HIGH fixes 1–4 implemented dan verified |
| 2026-08-18 | Nota: "Gift Corner" feature found in dev, absent from prod DB |
| 2026-08-18 | Production entitlement audit: PASS — DB feature mapping confirmed correct |
| 2026-08-18 | Deployment confirmed live — all smoke tests passed |
| 2026-08-18 | MEDIUM tasks #117, #118, #119 cancelled |
| 2026-08-18 | Browser cache behaviour documented (cache-control: private + ETag) |
