# Invitation Package Logic

> Dokumen ini menerangkan pakej semasa dalam prod, feature yang disokong, dan bagaimana ia mengawal paparan section dalam invitation.

---

## 1. Pakej Semasa (Production)

Pakej di-seed secara automatik semasa server start (`autoSeed.ts`) — hanya dibuat kalau jadual kosong.

| Pakej | Harga (Buyer) | Harga (Business) | Badge |
|---|---|---|---|
| **Standard** | RM 55 | — | — |
| **Premium** | RM 65 | — | More Features |
| **Signature** | RM 85 | — | Best Value |

### Features per Pakej

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

## 2. Bagaimana Package → Section Invitation

### Cara kerjanya (2 lapisan)

```
┌─────────────────────────────────────────────────┐
│  LAPISAN 1 — SERVER (API)                       │
│                                                 │
│  invitationHasFeature(invitation, featureName)  │
│  → semak pricing_feature table                  │
│  → kalau feature tiada dalam pakej buyer,       │
│    server BLOCK save / upload field tersebut    │
│                                                 │
│  Result: field gated akan kosong / null dalam DB│
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│  LAPISAN 2 — FRONTEND (WeddingCard.tsx)         │
│                                                 │
│  Section HANYA dipapar kalau DATA ada           │
│  → WeddingCard.tsx TIDAK semak packageId        │
│  → Ia semak sama ada field tu ada nilai atau tak│
│                                                 │
│  Result: kalau server block → data kosong       │
│          → section tidak muncul dalam invitation│
└─────────────────────────────────────────────────┘
```

> **Ringkasan:** Server kawal apa yang boleh disimpan. Frontend papar apa yang ada. Dua lapisan ini bekerja sama supaya section premium tidak muncul untuk pakej bawah.

---

## 3. Logic Display Per Section (WeddingCard.tsx)

Semua section dalam **Page 2 (Group 2)** dipapar mengikut syarat data berikut:

| Section | Syarat Paparan | Gated by Package? |
|---|---|---|
| **Invitation Text** | Sentiasa dipapar | ❌ Semua pakej |
| **Event Details** | Sentiasa dipapar | ❌ Semua pakej |
| **Programme** | `inv.itinerary.length > 0` ATAU `schedule` ada nilai | ❌ Semua pakej |
| **Prayer (Doa)** | Sentiasa dipapar | ❌ Semua pakej |
| **Countdown** | Sentiasa dipapar | ❌ Semua pakej |
| **Dress Code** | `inv.dresscode` ATAU `inv.dresscodeTheme` ATAU `inv.dresscodeColors.length > 0` | ✅ Premium & Signature |
| **RSVP** | `inv.rsvpEnabled !== false` | ❌ Semua pakej |
| **RSVP Count** | `rsvpCount.attending > 0` ATAU `rsvpCount.notAttending > 0` | ❌ Semua pakej |
| **Wishes / Guestbook** | `guestWishes.length > 0` | ❌ Semua pakej |
| **Photo Gallery** | `inv.galleryImages.length > 0` | ✅ Premium & Signature |
| **Money Gift** | `inv.giftEnabled` (Premium/Signature feature gate) | ✅ Premium & Signature |
| **Footer** | `inv.showFooter !== false` | ❌ Semua pakej |

---

## 4. Server-Side Feature Check

Fungsi di `artifacts/api-server/src/lib/pricing-features.ts`:

```ts
invitationHasFeature(invitation, featureName)
```

- Input: `invitation.packageId` + nama feature (e.g. `"Photo Gallery"`)
- Output: `true` kalau feature wujud dalam `pricing_feature` table untuk pakej tersebut
- Digunakan dalam route API untuk block save/upload kalau feature tiada

### Contoh penggunaan dalam API routes:

| Route | Feature check |
|---|---|
| Save gallery images | `"Photo Gallery"` |
| Save dress code | `"Dress Code"` |
| Save gift / QR | `"Money Gift"` |
| Save gift registry | `"Gift Registry"` |

---

## 5. Rumusan Flow Lengkap

```
Buyer pilih pakej → Bayar → Invitation dibuat dengan packageId

  Editor cuba save field gated (cth: gallery)
        │
        ▼
  API semak invitationHasFeature()
        │
   ┌────┴────┐
   │ Ada?    │
   └────┬────┘
   Ya   │   Tidak
        │        └──→ API tolak save → field kekal kosong
        ▼
  Data disimpan dalam DB
        │
        ▼
  WeddingCard.tsx fetch invitation data
        │
        ▼
  Section dicek — ada data? → Papar
                 tiada data? → Sembunyi
```

---

## Changelog

| Tarikh | Perubahan |
|---|---|
| 2026-08-18 | Dokumen dibuat — packages, features, display logic |
