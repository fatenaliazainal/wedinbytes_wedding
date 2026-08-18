# Package Gating Audit Report

> Audit dijalankan: 2026-08-18
> Status: **AUDIT ONLY — tiada kod diubah**
> Tujuan: Kenal pasti mismatch antara intended behavior dan actual implementation.

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
- Frontend hides gated sections from guests
- Package downgrade: gated section hidden, data preserved in DB

---

## B. Apa yang production code sebenarnya buat

### Server-side — `invitationHasFeature()` call sites

| Route | Feature Checked | Gate Type |
|---|---|---|
| `PATCH /invitation/:token` | `"Money Gift"` | Write gate ✅ |
| `POST /gift-qr-upload` | `"Money Gift"` | Upload gate ✅ |
| `GET /invitation/:token` | `"Dress Code"` | Read strip (guests only) ⚠️ |
| `GET /registry/:token` | `"Gift Registry"` | Read gate ✅ |
| `POST /registry/:token` | `"Gift Registry"` | Write gate ✅ |
| `PATCH /registry/:token` | `"Gift Registry"` | Write gate ✅ |
| `DELETE /registry/:token` | `"Gift Registry"` | Write gate ✅ |
| `POST /registry-thumbnail-upload` | `"Gift Registry"` | Upload gate ✅ |
| Gallery — `PATCH /invitation/:token` | *(none)* | **NO GATE ❌** |
| Gallery — `POST /gallery-upload` | *(none)* | **NO GATE ❌** |
| Dress Code — `PATCH /invitation/:token` | *(none)* | **NO GATE ❌** |

### Frontend — WeddingCard.tsx section render conditions

| Section | Render Condition | Checks Package? |
|---|---|---|
| Invitation Text | Always | ❌ No |
| Event Details | Always | ❌ No |
| Programme | `inv.itinerary.length > 0 \|\| schedule` | ❌ Data only |
| Prayer | Always | ❌ No |
| Countdown | Always (even without date) | ❌ No |
| **Dress Code** | `dresscode \|\| dresscodeTheme \|\| dresscodeColors.length > 0` | ❌ **Data only** |
| RSVP | `inv.rsvpEnabled !== false` | ❌ Data only |
| Wishes | `guestWishes.length > 0` | ❌ Data only |
| **Photo Gallery** | `inv.galleryImages.length > 0` | ❌ **Data only** |
| Money Gift / Registry (nav) | `isDemoInvitation \|\| inv.giftDisplay === true \|\| registryItems.length > 0` | ❌ **Data only** |

### Frontend — Editor (EditorPage.tsx) tab gating

Editor DOES gate tabs by package via `visibleTabs` at line 497-510. Feature mapping:

| Tab | Feature Required |
|---|---|
| Dress Code | `"Dress Code"` |
| Gallery | `"Photo Gallery"` or `"Money Gift"` |
| Gift | `"Money Gift"` |
| Gift Registry | `"Gift Registry"` |
| RSVP | `"RSVP / Wishes"` |
| Contact | `"Contact"` |
| Location | `"Location & Navigation"` |

> Editor tab gating is **correct** — Standard buyers cannot see/edit Premium tabs.
> But server does not enforce the same gates on save.

---

## C. Database — autoSeed.ts behavior

| Package | Seed condition |
|---|---|
| Standard | Created only when `pricing_package` table is empty |
| Premium | Created only when `pricing_package` table is empty |
| Signature | Idempotent — created if name `"Signature"` not found |
| Signature → Gift Registry feature | Backfilled if missing on existing Signature record |

> ✅ **autoSeed.ts will NOT overwrite existing Standard/Premium records.**
> ✅ Modifying autoSeed.ts is safe for Standard/Premium — only affects first-time seeding.
> ⚠️ Signature is idempotent but only adds, never modifies existing Signature row.

---

## D. Mismatches Found

---

### MISMATCH 1 — Gallery write not gated on server
**Severity: `HIGH`**

| | Detail |
|---|---|
| **Expected** | Standard invitation cannot upload or save gallery images |
| **Actual** | `PATCH /invitation/:token` saves `galleryImages` with no feature check (line 454-477) |
| **Actual** | `POST /gallery-upload` uploads image with no package check (cards.ts line 267-328) |
| **Files** | `routes/invitation.ts:454-477`, `routes/cards.ts:267-328` |
| **Impact** | Standard buyer who calls the API directly can upload and save gallery images |
| **Data risk** | None — existing data safe, issue is write access |

---

### MISMATCH 2 — Dress Code write not gated on server
**Severity: `HIGH`**

| | Detail |
|---|---|
| **Expected** | Standard invitation cannot save dress code |
| **Actual** | `PATCH /invitation/:token` saves `dresscode`, `dresscodeTheme`, `dresscodeColors` with no feature check |
| **Actual** | Editor tab is hidden for Standard, but API endpoint is unprotected |
| **Files** | `routes/invitation.ts:393-411, 454-477` |
| **Impact** | Standard buyer who calls the API directly can save dress code data |
| **Data risk** | None — existing data safe |

---

### MISMATCH 3 — WeddingCard.tsx renders gated sections based on data, not package
**Severity: `HIGH`**

| | Detail |
|---|---|
| **Expected** | Package downgrade: Standard invitation should not show Gallery or Dress Code |
| **Actual** | WeddingCard.tsx checks `galleryImages.length > 0` and `dresscode \|\| dresscodeTheme` — no package check |
| **Scenario** | Premium invitation → downgraded to Standard → gallery data still in DB → gallery section STILL SHOWS on public invitation |
| **Files** | `WeddingCard.tsx:930-960` (Dress Code), `WeddingCard.tsx:1015-1024` (Gallery) |
| **Fix approach** | Pass `activeFeatureNames` or `packageFeatures` to WeddingCard and add feature check before rendering |
| **Data risk** | None — do NOT delete old data; just hide the section |

---

### MISMATCH 4 — GET /invitation/:token returns all gated fields regardless of package
**Severity: `HIGH`**

| | Detail |
|---|---|
| **Expected** | Guests on Standard invitation should not receive Premium fields |
| **Actual** | `galleryImages`, `giftEnabled`, gift fields all returned regardless of package |
| **Actual** | Only `dresscode/dresscodeTheme/dresscodeColors` are stripped — and only for non-demo, non-owner guests |
| **Files** | `routes/invitation.ts:91-164` (`publicInvitation` function) |
| **Impact** | Standard invitation returns gallery URLs, gift data in API response even if section is hidden |
| **Note** | Frontend currently doesn't display them (data-presence gating), but data is still exposed in API |

---

### MISMATCH 5 — Business route: Dress Code not gated
**Severity: `MEDIUM`**

| | Detail |
|---|---|
| **Expected** | Business customer creation should not include dress code for Standard package |
| **Actual** | `routes/business.ts:663-665` gates gallery via `packageAllowsFeature(selectedPackage.id, "Photo Gallery")` |
| **Actual** | No equivalent gate for `dresscode*` fields during business customer creation |
| **Files** | `routes/business.ts:643-698` |
| **Impact** | Business account admin can include dress code in customer invitation form for Standard package |

---

### MISMATCH 6 — Gift nav visibility uses data, not package
**Severity: `MEDIUM`**

| | Detail |
|---|---|
| **Expected** | Gift icon in bottom nav should only appear for Premium/Signature invitations |
| **Actual** | `InvitationPage.tsx:760-769`: `showGift = isDemoInvitation \|\| inv?.giftDisplay === true \|\| registryItems.length > 0` |
| **Actual** | No package check — if old gift data exists on a downgraded invitation, nav icon still shows |
| **Files** | `artifacts/wedding-invite/src/pages/InvitationPage.tsx:760-769` |

---

### MISMATCH 7 — Dress Code READ strip is inconsistent
**Severity: `MEDIUM`**

| | Detail |
|---|---|
| **Expected** | Dress code stripped for unauthorized packages |
| **Actual** | Strip only happens for non-demo, non-owner **guest** reads (`routes/invitation.ts:154-162`) |
| **Actual** | Owner/admin reads receive dress code data even if package doesn't have the feature |
| **Note** | Owner reading their own data is probably acceptable — this is borderline LOW |

---

### MISMATCH 8 — Gift Registry: Fully implemented but frontend does NOT show in WeddingCard.tsx
**Severity: `LOW`**

| | Detail |
|---|---|
| **Expected** | Gift Registry items shown in invitation |
| **Actual** | API, DB schema, editor tab all exist and are gated correctly |
| **Actual** | Guest display is via `DetailPanel.tsx` and `InvitationPage.tsx` (bottom sheet) — NOT in WeddingCard.tsx scroll sections |
| **Conclusion** | This is by design — Gift Registry is a bottom sheet feature, not a scroll section |
| **No action needed** | ✅ |

---

### MISMATCH 9 — autoSeed.ts: No hardcoded package name comparisons found
**Severity: `LOW` / INFO**

| | Detail |
|---|---|
| **Expected** | Entitlement through `invitationHasFeature()` only |
| **Actual** | ✅ No `packageName === "Premium"` style comparisons found anywhere in routes or frontend |
| **Actual** | All entitlement logic uses `invitationHasFeature()` or `packageAllowsFeature()` |
| **Conclusion** | No hardcoded name comparisons — system is feature-driven as intended |

---

## E. Summary by severity

| # | Issue | Severity | Files | Data Risk | DB Migration? |
|---|---|---|---|---|---|
| 1 | Gallery write not gated on server | **HIGH** | `routes/invitation.ts`, `routes/cards.ts` | None | No |
| 2 | Dress Code write not gated on server | **HIGH** | `routes/invitation.ts` | None | No |
| 3 | WeddingCard renders gated sections by data (package downgrade leak) | **HIGH** | `WeddingCard.tsx` | None | No |
| 4 | GET /invitation returns all gated fields | **HIGH** | `routes/invitation.ts` | None | No |
| 5 | Business route: Dress Code not gated | **MEDIUM** | `routes/business.ts` | None | No |
| 6 | Gift nav visibility uses data, not package | **MEDIUM** | `InvitationPage.tsx` | None | No |
| 7 | Dress Code READ strip inconsistent | **MEDIUM** | `routes/invitation.ts` | None | No |
| 8 | Gift Registry display is bottom sheet (not WeddingCard) | **LOW/INFO** | — | None | No |
| 9 | No hardcoded package name comparisons | **INFO / OK** | — | None | No |

---

## F. Fixes applied (HIGH issues — closed)

| # | Fix | Files changed | Status |
|---|---|---|---|
| 1 | Gallery write gate in `PATCH /invitation/:token` | `routes/invitation.ts` | ✅ DONE |
| 2 | Gallery upload gate in `POST /gallery-upload` | `routes/cards.ts` | ✅ DONE |
| 3 | Dress Code write gate in `PATCH /invitation/:token` | `routes/invitation.ts` | ✅ DONE |
| 4a | Strip `galleryImages` from guest GET when package lacks "Photo Gallery" | `routes/invitation.ts` (`publicInvitation()`) | ✅ DONE |
| 4b | Strip all Money Gift fields from guest GET when package lacks "Money Gift" | `routes/invitation.ts` (`publicInvitation()`) | ✅ DONE |
| 4c | Strip Gift Registry fields from guest GET when package lacks "Gift Registry" | `routes/invitation.ts` (`publicInvitation()`) | ✅ DONE |

**Fix 3 (WeddingCard display)** — resolved via Fix 4a: server strips `galleryImages = []` from guest GET response for non-entitled packages. WeddingCard's existing `galleryImages.length > 0` check naturally hides the section. No WeddingCard code changes required. Owner/editor view still receives full data (data preserved, editor tab already hidden by package gating).

**All 4 gated features now protected on both WRITE and PUBLIC READ.**
**No existing data deleted. No DB migration. No package reassignments.**

---

## G. Remaining open (MEDIUM — not yet actioned, awaiting approval)

| # | Issue | Severity |
|---|---|---|
| 5 | Business route: Dress Code not gated during customer creation | MEDIUM |
| 6 | Gift nav icon uses data presence, not package (downgrade scenario) | MEDIUM |
| 7 | Dress Code READ strip inconsistent for owner view | MEDIUM |

---

## H. Additional finding: "Gift Corner" in production DB

During verification, Signature package has **11 features** in prod including both `"Gift Corner"` and `"Gift Registry"`. This is not in the documentation.

```
Signature features (actual prod DB):
RSVP / Wishes, Contact, Location & Navigation, Calendar, Countdown,
Background Music, Photo Gallery, Money Gift, Dress Code,
Gift Corner, Gift Registry
```

- `"Gift Registry"` — used by `routes/gift-registry.ts` for all CRUD gates ✅
- `"Gift Corner"` — no code currently checks for this name; likely a legacy/duplicate entry
- **Not renamed** — per safety requirement. No action taken.

---

## Changelog

| Tarikh | Perubahan |
|---|---|
| 2026-08-18 | Audit report dibuat |
| 2026-08-18 | HIGH fixes 1–4 implemented dan verified |
| 2026-08-18 | Nota: "Gift Corner" feature found in prod Signature package (legacy entry, no rename) |
