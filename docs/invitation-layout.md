# Invitation Layout — Spacing Reference

> Kemaskini fail ini setiap kali ada perubahan spacing pada `WeddingCard.tsx`.

---

## PAGE 1 — Cover (Group 1)

```
┌────────────────────────────────┐
│  Min height : 100dvh           │
│  Padding kiri/kanan : 28px (px-7)
│  Padding atas/bawah : 40px (py-10)
│                                │
│  [Eyebrow text]                │
│  ↕ mt-10 = 40px               │
│  [Nama Pengantin Lelaki]       │
│  [&]                           │
│  [Nama Pengantin Perempuan]    │
│  ↕ mt-9 = 36px                │
│  [Hari]      ← space-y-1 = 4px│
│  [Tarikh]                      │
│  ↕ mt-5 = 20px                │
│  [Hashtag]                     │
└────────────────────────────────┘
```

| Elemen | Nilai |
|---|---|
| Min height | 100dvh |
| Padding atas/bawah | 40px (`py-10`) |
| Padding kiri/kanan | 28px (`px-7`) |
| Eyebrow → Nama gap | 40px (`mt-10`) |
| Nama → Date gap | 36px (`mt-9`) |
| Hari ↔ Tarikh gap | 4px (`space-y-1`) |
| Date → Hashtag gap | 20px (`mt-5`) |

---

## PAGE 2 — Details / Scroll (Group 2)

```
┌────────────────────────────────┐
│  Padding kiri/kanan : 60px     │
│  Padding atas : 64px           │
│                                │
│  ┌──── Section ─────┐          │
│  │ [Title]          │          │
│  │ ↕ 4px (space-y-1)          │
│  │ ── [Ornament] ── │ ← 54px  │
│  │ ↕ 4px (space-y-1)          │
│  │ [Content]        │          │
│  │ ↕ 4px            │          │
│  │ [Content]        │          │
│  └──────────────────┘          │
│                                │
│  ↕ gap = 50px                  │
│                                │
│  ┌──── Section ─────┐          │
│  │ ...              │          │
│  └──────────────────┘          │
│                                │
│  Padding bawah : 112px         │
└────────────────────────────────┘
```

| Elemen | Nilai |
|---|---|
| Padding atas | 64px (`pt-16`) |
| Padding bawah | 112px (`pb-28`) |
| Padding kiri/kanan | 60px (`px-[60px]`) |
| **Gap antara sections** | **50px** (`gap-[50px]`) |
| Space dalam section | 4px (`space-y-1`) |
| **Ornament height** | **48px** |
| Ornament width | 160px |
| Ornament margin atas/bawah | 0px (removed) |
| Gap antara itinerary items | 16px (`space-y-4`) |
| Gap dalam itinerary item | 2px (`space-y-0.5`) |

---

## Changelog

| Tarikh | Perubahan |
|---|---|
| 2026-08-18 | Gap antara sections: `gap-14` (56px) → `gap-[50px]` (50px) |
| 2026-08-18 | detailBlock spacing: `space-y-4` (16px) → `space-y-1` (4px) |
| 2026-08-18 | Ornament height: 80px → 20px → 32px → 60px → 54px → 48px |
| 2026-08-18 | Ornament margin (`my-1`) removed |
