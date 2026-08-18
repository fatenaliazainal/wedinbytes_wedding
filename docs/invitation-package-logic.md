# Invitation Package Logic

> **Purpose:** Dokumen ini ialah **single source of truth** untuk package entitlement dan package-gated features dalam WEDinstudio production.
>
> Sebelum membuat sebarang perubahan berkaitan package, feature, invitation section, pricing entitlement, upgrade/downgrade atau API gating, **rujuk dokumen ini terlebih dahulu dan audit code + production DB sebelum membuat perubahan.**
>
> **Last verified:** 18 August 2026
> **Production status:** Live
> **Package Entitlement Audit:** PASS
> **Production Safety Review:** PASS
> **Deployment Smoke Test:** PASS

---

# 1. Production Packages

Package records semasa dalam production:

| Package       | ID | Status |
| ------------- | -: | ------ |
| **Standard**  |  1 | Active |
| **Premium**   |  2 | Active |
| **Signature** |  4 | Active |

### Pricing

Harga **bukan source of truth dalam dokumen ini**.

Harga diurus oleh Admin melalui database / Admin → Packages.

`autoSeed.ts` hanya menyediakan **seed defaults ketika table kosong**. Ia tidak digunakan untuk update harga atau feature entitlement pada existing production records.

> ⚠️ Jangan assume harga daripada `autoSeed.ts` sebagai harga semasa production.

---

# 2. Current Production Feature Matrix

Feature entitlement berikut telah disahkan daripada production DB:

| Feature               | Standard | Premium | Signature |
| --------------------- | :------: | :-----: | :-------: |
| RSVP / Wishes         |     ✅    |    ✅    |     ✅     |
| Contact               |     ✅    |    ✅    |     ✅     |
| Location & Navigation |     ✅    |    ✅    |     ✅     |
| Calendar              |     ✅    |    ✅    |     ✅     |
| Countdown             |     ✅    |    ✅    |     ✅     |
| Background Music      |     ✅    |    ✅    |     ✅     |
| Photo Gallery         |     ❌    |    ✅    |     ✅     |
| Money Gift            |     ❌    |    ✅    |     ✅     |
| Dress Code            |     ❌    |    ✅    |     ✅     |
| Gift Registry         |     ❌    |    ❌    |     ✅     |

### Important

Package entitlement ditentukan oleh:

```text
invitation.packageId
        ↓
pricing_package
        ↓
pricing_feature
```

**Jangan hardcode package name seperti:**

```ts
if (packageName === "Premium")
```

atau:

```ts
if (packageId === 2)
```

untuk menentukan feature access.

Gunakan:

```ts
invitationHasFeature(invitation, featureName)
```

Feature mapping dalam DB ialah **source of truth untuk entitlement**.

---

# 3. Architecture — Package → Feature → Invitation

Package logic menggunakan 3 protection layers:

```text
┌─────────────────────────────────────────────────┐
│  LAYER 1 — SERVER WRITE GATE                    │
│                                                 │
│  invitationHasFeature()                         │
│  → check package → feature entitlement         │
│  → block save/upload if feature unavailable     │
│  → HTTP 403                                     │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│  LAYER 2 — SERVER PUBLIC READ STRIP             │
│                                                 │
│  publicInvitation(row, ownerView)               │
│  → guest/public request                         │
│  → strip gated fields if package lacks feature  │
│  → existing DB data is NOT deleted              │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│  LAYER 3 — FRONTEND PRESENTATION                │
│                                                 │
│  WeddingCard.tsx                                │
│  → renders based on available data              │
│  → does NOT act as security boundary             │
└─────────────────────────────────────────────────┘
```

### Core principle

> **Server controls entitlement. Frontend controls presentation.**

Frontend visibility alone **must never** be treated as package security.

---

# 4. Layer 1 — Server Write Gates

Main helper:

```text
artifacts/api-server/src/lib/pricing-features.ts

invitationHasFeature(invitation, featureName)
```

It checks:

```text
invitation.packageId
        ↓
pricing_feature
        ↓
feature entitlement
```

If the package does not have the required feature:

```text
API request
   ↓
feature check
   ↓
NOT ENTITLED
   ↓
HTTP 403
   ↓
data is NOT saved
```

### Current write/upload gates

| Route / Operation                                                               | Feature       |
| ------------------------------------------------------------------------------- | ------------- |
| `PATCH /invitation/:token` — `galleryImages`                                    | Photo Gallery |
| `PATCH /invitation/:token` — `dresscode` / `dresscodeTheme` / `dresscodeColors` | Dress Code    |
| `PATCH /invitation/:token` — gift fields                                        | Money Gift    |
| `POST /gallery-upload`                                                          | Photo Gallery |
| `POST /gift-qr-upload`                                                          | Money Gift    |
| `POST/PATCH/DELETE /registry/:token`                                            | Gift Registry |

### Rule for future features

Any new package-gated field **must have a server-side write gate**.

Do not rely on:

* hidden buttons
* disabled UI
* frontend package checks
* editor tabs being hidden

A user should not be able to bypass entitlement by calling the API directly.

---

# 5. Layer 2 — Public API Read Protection

Main function:

```text
publicInvitation(row, ownerView)
```

For public/guest requests:

```text
!isDemoToken && !ownerView
```

the API checks package entitlement and strips gated data that the package is not entitled to receive.

### Important reason

Write gates prevent new invalid data from entering the DB.

Read stripping protects against:

* old data
* legacy data
* package downgrade
* data saved before a gate existed
* unexpected DB inconsistencies

### Critical principle

> **Existing gated data must not be deleted simply because the package no longer has the feature.**

The DB may retain the data while the public API hides it.

---

# 6. Public GET — Gated Fields

Current production behavior:

| Feature       | Fields protected           | Non-entitled package | Entitled package |
| ------------- | -------------------------- | -------------------- | ---------------- |
| Photo Gallery | `galleryImages`            | `[]`                 | Original data    |
| Dress Code    | `dresscode`                | `null`               | Original data    |
| Dress Code    | `dresscodeTheme`           | `null`               | Original data    |
| Dress Code    | `dresscodeColors`          | `[]`                 | Original data    |
| Money Gift    | `giftDisplay`              | `false`              | Original value   |
| Money Gift    | `giftTitle`                | `null`               | Original value   |
| Money Gift    | `giftRecipient`            | `null`               | Original value   |
| Money Gift    | `giftBankName`             | `null`               | Original value   |
| Money Gift    | `giftAccountNumber`        | `null`               | Original value   |
| Money Gift    | `giftQrCodes`              | `null`               | Original value   |
| Gift Registry | `registryRecipientName`    | `null`               | Original value   |
| Gift Registry | `registryRecipientAddress` | `null`               | Original value   |

Gift Registry items themselves use a separate endpoint:

```text
GET /registry/:token
```

and are gated by:

```text
invitationHasFeature(invitation, "Gift Registry")
```

Non-entitled packages receive no registry items.

### Important

Read stripping only changes the **response object**.

It does **not**:

* update the DB
* delete data
* modify package assignment
* modify customer invitation data

---

# 7. Owner / Editor Access

Public guest access and owner/editor access are intentionally different.

### Public guest

```text
ownerView = false
```

→ package-gated fields are stripped.

### Owner / Admin

```text
ownerView = true
```

→ existing data remains available to the owner/editor.

This is important for downgrade behaviour.

Example:

```text
Premium
→ customer has Gallery + Dress Code
→ package downgraded to Standard
```

Expected:

```text
DB:
Gallery data      = preserved
Dress Code data   = preserved

Owner/editor:
data remains accessible

Public guest:
Gallery           = hidden
Dress Code        = hidden
```

---

# 8. Layer 3 — Frontend Section Rendering

Main frontend:

```text
WeddingCard.tsx
```

The frontend currently renders most sections based on whether relevant data exists.

It **does not use packageId as its primary security mechanism**.

### Current section behaviour

| Section                  | Current condition                                               |     Package gated?     |
| ------------------------ | --------------------------------------------------------------- | :--------------------: |
| Invitation Text          | Always rendered                                                 |            ❌           |
| Event Details            | Always rendered                                                 |            ❌           |
| Programme                | `itinerary.length > 0` OR `schedule` has value                  |            ❌           |
| Prayer / Doa             | Always rendered                                                 |            ❌           |
| Countdown                | Always rendered                                                 |            ❌           |
| Dress Code               | `dresscode` OR `dresscodeTheme` OR `dresscodeColors.length > 0` |     ✅ Server strip     |
| RSVP                     | `rsvpEnabled !== false`                                         |            ❌           |
| Wishes / Guestbook       | `guestWishes.length > 0`                                        |            ❌           |
| Photo Gallery            | `galleryImages.length > 0`                                      |     ✅ Server strip     |
| Gift / Bottom Navigation | Demo OR `giftDisplay === true` OR registry items exist          | ✅ Server/registry gate |
| Footer                   | `showFooter !== false`                                          |            ❌           |

### Important

Do not assume:

```text
Frontend hides section
=
Feature is secure
```

The security boundary is the server.

---

# 9. Sections Currently NOT Package-Gated

The following are available across packages:

* Invitation Text
* Event Details
* Programme
* Prayer / Doa
* Countdown
* RSVP
* Wishes / Guestbook
* Footer
* Contact
* Location & Navigation
* Calendar
* Background Music

If any of these are to become package-gated in future, they require **all relevant layers** to be reviewed.

---

# 10. Demo Invitations

Demo invitations:

```text
demo
demo-en
```

bypass package gating.

Purpose:

> Demonstrate the full WEDinstudio feature set to potential customers.

Demo behaviour includes:

* Gallery
* Dress Code
* Money Gift
* Gift Registry
* other gated features

Demo write gates are also bypassed.

### Important

Do not accidentally remove the demo bypass when modifying package gating.

---

# 11. Package Downgrade Behaviour

Example:

```text
Signature
      ↓
Premium
      ↓
Standard
```

### Expected behaviour

| Layer            | Expected result                          |
| ---------------- | ---------------------------------------- |
| DB               | Existing gated data preserved            |
| Write API        | New gated data blocked                   |
| Public GET       | Non-entitled data stripped               |
| Owner/editor     | Existing data retained                   |
| Guest invitation | Gated sections hidden                    |
| Upgrade later    | Existing data may become available again |

### NEVER do this automatically

Do not implement:

```text
Package downgrade
→ DELETE gallery
→ DELETE dress code
→ DELETE gift data
```

unless explicitly requested as a separate data migration.

---

# 12. Package Upgrade Behaviour

Example:

```text
Standard
   ↓
Premium
```

Expected:

* Package assignment changes only through the appropriate package/purchase flow.
* Existing invitation data is preserved.
* Newly entitled features become available.
* Existing stored gated data should not need to be recreated.
* Public API can return the newly entitled data.

For:

```text
Premium
   ↓
Signature
```

Gift Registry becomes available.

---

# 13. Production Package / Feature Change Rules

Before changing package entitlement:

### DO

* Check production DB package IDs.
* Check `pricing_feature`.
* Check existing invitations using the package.
* Check existing gated data.
* Review server write gates.
* Review public GET stripping.
* Review frontend rendering.
* Review editor access.
* Test upgrade behaviour.
* Test downgrade behaviour.
* Test existing customers.
* Review exact git diff before deployment.

### DO NOT

* Hardcode package names for entitlement.
* Assume package IDs without checking production.
* Delete existing gated data automatically.
* Modify customer package assignments without explicit instruction.
* Change prices through seed code.
* Assume `autoSeed.ts` updates existing production records.
* Rely only on frontend hiding.
* Deploy a package entitlement change without testing existing invitations.

---

# 14. Adding a New Package-Gated Feature

When adding a new feature, use this checklist:

* [ ] Define the feature name.
* [ ] Add/verify feature in `pricing_feature`.
* [ ] Assign feature to the correct packages.
* [ ] Add server-side write gate.
* [ ] Add upload gate if the feature involves files.
* [ ] Add public GET/read strip.
* [ ] Identify every field belonging to the feature.
* [ ] Update frontend section rendering.
* [ ] Update editor visibility/controls.
* [ ] Check owner/admin behaviour.
* [ ] Check demo invitation behaviour.
* [ ] Test Standard.
* [ ] Test Premium.
* [ ] Test Signature.
* [ ] Test public guest view.
* [ ] Test owner/editor view.
* [ ] Test upgrade.
* [ ] Test downgrade.
* [ ] Test existing invitations containing legacy data.
* [ ] Update this document.
* [ ] Review git diff.
* [ ] Build and run functional tests.
* [ ] Only then deploy.

---

# 15. Moving a Feature Between Packages

Example:

```text
Current:
Photo Gallery → Premium + Signature

New:
Photo Gallery → Signature only
```

Do not simply change the DB mapping and deploy.

Check:

### Database

* Package → feature mapping
* Existing invitations
* Existing Gallery data

### Server

* Write gate
* Upload gate
* Public read strip

### Frontend

* Editor visibility
* Section rendering
* Navigation/icon behaviour

### Existing customers

Specifically test:

* existing Premium invitations with Gallery
* existing Signature invitations with Gallery
* Standard invitations
* downgraded invitations

### Expected downgrade behaviour

Existing Gallery data should remain stored but should no longer be publicly exposed if the new package no longer has the feature.

---

# 16. Production Safety Checklist

For any package-related production change:

* [ ] Audit current production DB first.
* [ ] Confirm actual package IDs.
* [ ] Confirm actual package → feature mapping.
* [ ] Count existing invitations per package.
* [ ] Search for existing gated data in non-entitled invitations.
* [ ] Review all affected API routes.
* [ ] Review public GET behaviour.
* [ ] Review owner/editor behaviour.
* [ ] Review frontend rendering.
* [ ] Do not delete customer data.
* [ ] Do not change customer package assignments.
* [ ] Do not change prices.
* [ ] Do not run DB migration unless explicitly approved.
* [ ] Run build.
* [ ] Run functional tests.
* [ ] Test public invitation.
* [ ] Test editor.
* [ ] Test at least one existing invitation from each package.
* [ ] Review exact git diff.
* [ ] Confirm deployment commit.
* [ ] Smoke-test production after deployment.

### Golden rule

> **Audit first. Change second. Deploy last.**

---

# 17. Current Production Audit

As of **18 August 2026**:

### Package records

```text
Standard   = ID 1
Premium    = ID 2
Signature  = ID 4
```

### Production invitation distribution at audit

```text
Standard    = 12
Premium     = 7
Signature   = 2
```

Two unpaid legacy invitations have `packageId = null`.

They are not customer-facing purchased invitations and safely default to no gated feature entitlement.

### Audit status

| Check                                 |  Status  |
| ------------------------------------- | :------: |
| Package records verified              |     ✅    |
| Feature mapping verified              |     ✅    |
| Existing customer invitations audited |     ✅    |
| Standard gated data audited           |     ✅    |
| Premium data integrity verified       |     ✅    |
| Signature data integrity verified     |     ✅    |
| Public GET gating verified            |     ✅    |
| Write gates verified                  |     ✅    |
| Owner/editor access verified          |     ✅    |
| No DB migration required              |     ✅    |
| No customer data deleted              |     ✅    |
| Production smoke test                 |     ✅    |
| Package Entitlement Audit             | **PASS** |
| Production Safety Review              | **PASS** |

### Known production legacy data

At the time of audit, one paid Standard invitation contained legacy Money Gift data from before the current write gate.

Expected behaviour:

```text
DB:
Money Gift data preserved

Public:
Money Gift hidden

Owner/editor:
Existing data retained
```

This is intentional and should not be treated as a data deletion issue.

---

# 18. Legacy `Gift Corner` Feature

Production DB contains a legacy feature record:

```text
Gift Corner
```

Current implementation uses:

```text
Gift Registry
```

instead.

Audit confirmed:

* No active `invitationHasFeature("Gift Corner")` check.
* No active frontend entitlement check.
* No active API entitlement check.
* It does not affect current package gating.
* It is an orphaned legacy DB feature.

### Rule

Do not rename or delete this production DB record as part of normal package changes.

If cleanup is required, handle it separately as an explicit DB cleanup task.

---

# 19. Browser Cache / Deployment Note

API responses use cache controls / ETag behaviour.

After a deployment, an existing browser may temporarily display an older response.

For verification:

```text
Ctrl + Shift + R
```

or:

```text
Cmd + Shift + R
```

or use an Incognito/Private window.

Do not immediately assume a cached invitation is a server regression.

---

# 20. Troubleshooting Guide

### Feature appears for Standard

Check in this order:

```text
1. Standard package has feature in pricing_feature?
        ↓
2. Is the write API gated?
        ↓
3. Is publicInvitation() stripping the feature?
        ↓
4. Is the data coming from another endpoint?
        ↓
5. Is the frontend receiving cached data?
        ↓
6. Is this a demo invitation?
```

### Feature disappears for Premium/Signature

Check:

```text
1. packageId
        ↓
2. pricing_feature mapping
        ↓
3. invitationHasFeature()
        ↓
4. publicInvitation() ownerView
        ↓
5. API response
        ↓
6. frontend rendering condition
```

### Data disappears after downgrade

First check whether it is actually deleted.

Expected downgrade behaviour is:

```text
DB data remains
+
Public response hides it
```

Do not restore/delete data until DB state has been verified.

---

# 21. Future Change Request Template

Before asking an AI agent/developer to make a package-related change, provide:

```text
Feature:
Current package entitlement:
New package entitlement:

Reason for change:

Database changes required:
Server write changes:
Server public GET changes:
Upload changes:
Frontend changes:
Editor changes:
Demo behaviour:

Upgrade behaviour:
Downgrade behaviour:

Existing customer impact:

Production invitations affected:

Tests required:

Deployment considerations:
```

### Required instruction to developer/AI

For production changes, always instruct:

```text
Audit the current production implementation and DB first.
Do not assume this documentation is newer than the code.
Do not change code until the affected files, routes and DB mappings are identified.
Do not delete existing customer data.
Review the exact diff before deployment.
```

---

# 22. Source of Truth Hierarchy

When documentation, code and assumptions conflict, use this order:

```text
1. Production DB
       ↓
2. Production code
       ↓
3. Current API behaviour
       ↓
4. Current frontend behaviour
       ↓
5. This documentation
       ↓
6. Old assumptions / previous conversations
```

This document should be updated whenever production behaviour intentionally changes.

**Never update the document to describe an unverified assumption.**

---

# 23. Changelog

| Date       | Change                                                               |
| ---------- | -------------------------------------------------------------------- |
| 2026-08-18 | Package logic documentation created                                  |
| 2026-08-18 | Production package IDs confirmed: Standard=1, Premium=2, Signature=4 |
| 2026-08-18 | Added server write-gate documentation                                |
| 2026-08-18 | Added public GET read-strip layer                                    |
| 2026-08-18 | Added Gallery and Dress Code write gates                             |
| 2026-08-18 | Added Money Gift and Gift Registry public read protection            |
| 2026-08-18 | Added package downgrade behaviour                                    |
| 2026-08-18 | Added demo invitation bypass documentation                           |
| 2026-08-18 | Added production safety rules                                        |
| 2026-08-18 | Added upgrade/downgrade testing guidance                             |
| 2026-08-18 | Production Package Entitlement Audit — **PASS**                      |
| 2026-08-18 | Production Safety Review — **PASS**                                  |
| 2026-08-18 | Production deployment smoke test — **PASS**                          |

---

# 24. Quick Reference

If making a future package change, remember:

```text
PACKAGE CHANGE
     ↓
Check production DB
     ↓
Check pricing_feature
     ↓
Check invitationHasFeature()
     ↓
Check WRITE gates
     ↓
Check PUBLIC READ stripping
     ↓
Check upload routes
     ↓
Check WeddingCard.tsx
     ↓
Check editor/ownerView
     ↓
Check demo bypass
     ↓
Check existing customer data
     ↓
Test Standard
     ↓
Test Premium
     ↓
Test Signature
     ↓
Test upgrade
     ↓
Test downgrade
     ↓
Review git diff
     ↓
Build + functional tests
     ↓
Deploy
     ↓
Production smoke test
     ↓
Update this MD
```

> **Core rule:** Package entitlement belongs to the server/database. The frontend displays what the server allows it to receive. Existing customer data should be preserved unless an explicit data migration is approved.
