# Invitation Package Logic

> Dokumen ini menerangkan pakej semasa dalam prod, feature yang disokong, dan bagaimana ia mengawal paparan section dalam invitation.

---

## 1. Pakej Semasa (Production)

Pakej di-seed secara automatik semasa server start (`autoSeed.ts`) — hanya dibuat kalau jadual kosong.

> ⚠️ **Harga diurus oleh Admin dalam DB** — nilai di bawah hanya seed defaults (first-time only). Harga sebenar semasa boleh berbeza; semak terus dalam Admin → Packages.

| Pakej | id | Harga Default (Seed) | Badge |
|---|---|---|---|
| **Standard** | 1 | RM 55 *(admin-managed)* | — |
| **Premium** | 2 | RM 65 *(admin-managed)* | More Features |
| **Signature** | 4 | RM 85 *(admin-managed)* | Best Value |

### Features per Pakej (confirmed dari production DB)

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

---

## 2. Sections yang TIDAK di-gate oleh package

Sections berikut muncul untuk **semua pakej** tanpa semakan package:

| Section | Kenapa |
|---|---|
| Prayer (Doa) | Tiada syarat render — sentiasa dipapar |
| Programme (Atur Cara) | Dipapar jika `itinerary` ada data — tiada package check |
| Countdown | Sentiasa dipapar |
| Invitation Text | Sentiasa dipapar |
| Event Details | Sentiasa dipapar |
| RSVP | Dipapar jika `rsvpEnabled !== false` |
| Wishes / Guestbook | Dipapar jika ada wishes dalam DB |
| Footer | Dipapar jika `showFooter !== false` |

> **Jika ingin gate Prayer atau Programme kepada Premium/Signature**, perlu:
> 1. Tambah `pricing_feature` record dalam DB
> 2. Tambah strip block dalam `publicInvitation()` di `routes/invitation.ts`
> 3. Tambah render condition dalam `WeddingCard.tsx`

---

## 3. Bagaimana Package → Section Invitation (3 Lapisan)

```
┌─────────────────────────────────────────────────┐
│  LAPISAN 1 — WRITE GATE (Server)                │
│                                                 │
│  invitationHasFeature(invitation, featureName)  │
│  → semak pricing_feature table                  │
│  → kalau feature tiada dalam pakej buyer,       │
│    server BLOCK save / upload field tersebut    │
│    → return HTTP 403                            │
│                                                 │
│  Bypassed for: demo tokens only                 │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│  LAPISAN 2 — READ STRIP (Server)                │
│                                                 │
│  publicInvitation(row, ownerView)               │
│  → kalau !isDemoToken && !ownerView (guest)     │
│    → strip gated fields dari response           │
│    → gallery = [], dresscode = null,            │
│      giftDisplay = false, dll.                  │
│                                                 │
│  Bypassed for: demo tokens + owner/admin view   │
│  Tujuan: protect even if old data exists in DB  │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│  LAPISAN 3 — FRONTEND RENDER (WeddingCard.tsx)  │
│                                                 │
│  Section HANYA dipapar kalau DATA ada           │
│  → WeddingCard.tsx TIDAK semak packageId        │
│  → Ia semak sama ada field tu ada nilai atau tak│
│                                                 │
│  Contoh:                                        │
│  Gallery → hanya render jika galleryImages > 0  │
│  Dress Code → hanya render jika dresscode != null│
│  Gift nav → hanya render jika giftDisplay=true  │
│                                                 │
│  Bergantung pada Lapisan 2 untuk keputusan akhir│
└─────────────────────────────────────────────────┘
```

> **Ringkasan:** Lapisan 1 cegah data gated masuk DB. Lapisan 2 protect jika data lama ada dalam DB (cth: selepas package downgrade). Lapisan 3 adalah last defense — papar apa yang server bagi.

---

## 4. Logic Display Per Section (WeddingCard.tsx)

| Section | Syarat Paparan | Gated by Package? |
|---|---|---|
| **Invitation Text** | Sentiasa dipapar | ❌ Semua pakej |
| **Event Details** | Sentiasa dipapar | ❌ Semua pakej |
| **Programme** | `inv.itinerary.length > 0` ATAU `schedule` ada nilai | ❌ Semua pakej |
| **Prayer (Doa)** | **Sentiasa dipapar** | ❌ **Semua pakej** |
| **Countdown** | Sentiasa dipapar | ❌ Semua pakej |
| **Dress Code** | `inv.dresscode \|\| inv.dresscodeTheme \|\| inv.dresscodeColors.length > 0` | ✅ Strip oleh server |
| **RSVP** | `inv.rsvpEnabled !== false` | ❌ Semua pakej |
| **Wishes / Guestbook** | `guestWishes.length > 0` | ❌ Semua pakej |
| **Photo Gallery** | `inv.galleryImages.length > 0` | ✅ Strip oleh server |
| **Gift (bottom nav)** | `isDemoInvitation \|\| inv.giftDisplay === true \|\| registryItems.length > 0` | ✅ Strip oleh server |
| **Footer** | `inv.showFooter !== false` | ❌ Semua pakej |

---

## 5. Server-Side Feature Check

Fungsi di `artifacts/api-server/src/lib/pricing-features.ts`:

```ts
invitationHasFeature(invitation, featureName)
```

- Input: `invitation.packageId` + nama feature (e.g. `"Photo Gallery"`)
- Output: `true` kalau feature wujud dalam `pricing_feature` table untuk pakej tersebut
- Digunakan dalam route API untuk block save/upload + strip read response

### Call sites dalam API routes:

| Route | Feature check | Gate type |
|---|---|---|
| `PATCH /invitation/:token` — galleryImages | `"Photo Gallery"` | Write gate |
| `PATCH /invitation/:token` — dresscode* | `"Dress Code"` | Write gate |
| `PATCH /invitation/:token` — gift* | `"Money Gift"` | Write gate |
| `POST /gallery-upload` | `"Photo Gallery"` | Upload gate |
| `POST /gift-qr-upload` | `"Money Gift"` | Upload gate |
| `publicInvitation()` — guest GET | `"Photo Gallery"`, `"Dress Code"`, `"Money Gift"`, `"Gift Registry"` | Read strip |
| `GET /registry/:token` | `"Gift Registry"` | Read gate |
| `POST/PATCH/DELETE /registry/:token` | `"Gift Registry"` | Write gate |

---

## 6. Demo Invitation — Semua Feature Terbuka

Demo invitations (`token = "demo"` atau `"demo-en"`) bypass **semua** package gates:

- Semua gated features dipapar — Gallery, Dress Code, Gift, Registry
- Semua write gates skip untuk demo token
- Tujuan: tunjuk semua features kepada bakal pelanggan

---

## 7. Package Downgrade Behavior

Jika invitation diturunkan dari Premium → Standard (admin change):

| Layer | Behavior |
|---|---|
| Write gate | Standard buyer tak boleh save gated fields baru |
| Read strip (server) | Gated fields di-strip dari public response — **data lama dalam DB tidak dipadam** |
| Editor view | Owner/admin masih nampak data lama dalam editor (`ownerView=true`) |
| Guest view | Section gated tidak muncul kerana data di-strip oleh server |

> **Data tidak dipadam.** Jika dikembalikan ke Premium, data lama muncul semula.

---

## 8. Browser Cache — Nota Penting

API response menggunakan `cache-control: private` + ETag. Selepas deploy:

- Pelanggan dengan cache lama mungkin nampak versi lama sementara
- **Bukan bug server** — fresh visitor atau hard refresh akan nampak response betul
- Hard refresh: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
- Atau buka dalam incognito window untuk verify tanpa cache

---

## 9. Rumusan Flow Lengkap

```
Buyer pilih pakej → Bayar → Invitation dibuat dengan packageId

  Editor cuba save field gated (cth: galleryImages)
        │
        ▼
  LAPISAN 1: API semak invitationHasFeature()
        │
   ┌────┴────┐
   │ Ada?    │
   └────┬────┘
   Ya   │   Tidak
        │        └──→ HTTP 403 — field tidak disimpan
        ▼
  Data disimpan dalam DB
        │
        ▼
  Guest buka invitation (public URL)
        │
        ▼
  LAPISAN 2: publicInvitation() strip gated fields
  (skip kalau demo token atau owner/admin)
        │
        ▼
  WeddingCard.tsx terima data dari API
        │
        ▼
  LAPISAN 3: Section dicek — ada data? → Papar
                             tiada data? → Sembunyi
```

---

## Changelog

| Tarikh | Perubahan |
|---|---|
| 2026-08-18 | Dokumen dibuat — packages, features, display logic |
| 2026-08-18 | Tambah Lapisan 2 (read strip) selepas HIGH fixes deployed |
| 2026-08-18 | Tambah senarai sections tidak di-gate (Prayer, Programme, dll.) |
| 2026-08-18 | Tambah package downgrade behavior + browser cache note |
| 2026-08-18 | Tambah demo invitation bypass documentation |
| 2026-08-18 | Confirmed production DB package IDs: Standard=1, Premium=2, Signature=4 |
