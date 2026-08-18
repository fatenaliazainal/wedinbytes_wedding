# Invitation Layout — Spacing & Colour Reference

> Kemaskini fail ini setiap kali ada perubahan spacing atau warna pada `WeddingCard.tsx`.

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

### Spacing

| Elemen | Nilai |
|---|---|
| Min height | 100dvh |
| Padding atas/bawah | 40px (`py-10`) |
| Padding kiri/kanan | 28px (`px-7`) |
| Eyebrow → Nama gap | 40px (`mt-10`) |
| Nama → Date gap | 36px (`mt-9`) |
| Hari ↔ Tarikh gap | 4px (`space-y-1`) |
| Date → Hashtag gap | 20px (`mt-5`) |

### Warna Teks

| Elemen | Colour Property |
|---|---|
| Eyebrow text | `text-foreground/75` |
| Nama Pengantin Lelaki | `var(--name-color, hsl(var(--foreground)))` |
| Nama Pengantin Perempuan | `var(--name-color, hsl(var(--foreground)))` |
| `&` separator | `var(--name-color)` + `opacity: 0.62` |
| Hari (eventDay) | `text-foreground/58` |
| Tarikh (eventDate) | `text-foreground/78` |
| Hashtag | `text-foreground/62` |

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
│  │ ── [Ornament] ── │ ← 48px  │
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

### Spacing

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

### Warna Teks — Per Section

#### Section Title (semua section)
| Elemen | Colour Property |
|---|---|
| Section title | `var(--color-heading, hsl(var(--primary)))` |
| Detail label (DATE / TIME / LOCATION) | `var(--color-muted, hsl(var(--foreground)/0.5))` |

---

#### 1. Invitation Text

```
┌─────────────────────────────────────────────┐
│                                             │
│  Container : w-full max-w-sm text-center    │
│              flex flex-col                  │
│             (spacing explicit per element)  │
│                                             │
│  [Greeting text]                            │
│  ↕ mt-2 = 8px                              │
│  [OrnamentDivider]                          │
│  ↕ mt-3 = 12px                             │
│  ┌─ Parents block (space-y-[6px]) ────────┐ │
│  │  [Parents Lelaki]                       │ │
│  │  ↕ 6px                                  │ │
│  │  [&]                                    │ │
│  │  ↕ 6px                                  │ │
│  │  [Parents Perempuan]                    │ │
│  └─────────────────────────────────────────┘ │
│  ↕ mt-10 = 40px                             │
│  [Invitation message]                       │
│  ↕ mt-10 = 40px                            │
│  ┌─ Couple names (space-y-1 = 4px) ───────┐ │
│  │  [Nama Pengantin Lelaki]                │ │
│  │  ↕ 4px                                  │ │
│  │  [&]                                    │ │
│  │  ↕ 4px                                  │ │
│  │  [Nama Pengantin Perempuan]             │ │
│  └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

| Elemen | Colour Property |
|---|---|
| Greeting text | `var(--greeting-color, hsl(var(--primary)))` |
| Parents (bapa/ibu) | `var(--greeting-color, hsl(var(--primary)))` |
| `&` antara parents | `var(--greeting-color, hsl(var(--primary)))` |
| Invitation message | `text-foreground/80` |
| Nama pengantin (secondary) | `var(--greeting-color, hsl(var(--primary)))` |
| `&` antara nama pengantin | `text-foreground/60` |

**Font Size (per-field, dikontrol editor)**

Greeting text, Parents, dan Invitation message menggunakan saiz yang dikontrol oleh slider berasingan dalam editor (Invitation Text tab). Saiz disimpan sebagai `<span style="font-size:Xpx">` wrapper dalam HTML field. Fallback: `var(--greeting-font-size, 1rem)` dari Design tab.

| Field | CSS Fallback | Slider (Editor) |
|---|---|---|
| Greeting text | `var(--greeting-font-size, 1rem)` | Greeting Text — Npx |
| Parents (bapa/ibu) | `var(--greeting-font-size, 1rem)` | Groom's/Bride's Parents — Npx |
| Invitation message | `var(--greeting-font-size, 1rem)` | Invitation Text — Npx |
| Nama pengantin | `var(--greeting-font-size, 1rem)` | Design tab slider |

---

#### 2. Event Details

```
┌─────────────────────────────────────────────┐
│                                             │
│  Container : detailBlock                    │
│              (space-y-1 = 4px per child)    │
│                                             │
│  [Section title]                            │
│  ↕ space-y-1 = 4px                         │
│  [OrnamentDivider]                          │
│  ↕ space-y-1 = 4px                         │
│  ┌─ DATE block (space-y-1 = 4px) ─────────┐ │
│  │  [Label DATE]                           │ │
│  │  ↕ 4px                                  │ │
│  │  [Tarikh value]                         │ │
│  │  ↕ 4px                                  │ │
│  │  [Tarikh Hijri] (optional)              │ │
│  └─────────────────────────────────────────┘ │
│  ↕ marginTop = 8px  ← (override space-y-1) │
│  ┌─ TIME block (space-y-1 = 4px) ─────────┐ │
│  │  [Label TIME]                           │ │
│  │  ↕ 4px                                  │ │
│  │  [Masa value]                           │ │
│  └─────────────────────────────────────────┘ │
│  ↕ marginTop = 8px  ← (override space-y-1) │
│  ┌─ LOCATION block (space-y-1 = 4px) ─────┐ │
│  │  [Label LOCATION]                       │ │
│  │  ↕ 4px                                  │ │
│  │  [Nama venue]                           │ │
│  │  ↕ 4px                                  │ │
│  │  [Alamat venue] (optional)              │ │
│  │  ↕ 4px                                  │ │
│  │  [Bandar, Negeri]                       │ │
│  └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

| Elemen | Colour Property |
|---|---|
| Section title | `var(--color-heading, hsl(var(--primary)))` |
| Label DATE / TIME / LOCATION | `var(--color-muted, hsl(var(--foreground)/0.5))` |
| Tarikh (value) | `text-foreground` |
| Tarikh Hijri | `text-foreground/60` |
| Masa (value) | `text-foreground` |
| Nama venue | `text-foreground` |
| Alamat venue | `text-foreground/70` |
| Bandar, Negeri | `text-foreground/60` |

---

#### 3. Programme / Itinerary

```
┌─────────────────────────────────────────────┐
│                                             │
│  Container : detailBlock                    │
│              (space-y-1 = 4px per child)    │
│                                             │
│  [Section title]                            │
│  ↕ space-y-1 = 4px                         │
│  [OrnamentDivider]                          │
│  ↕ space-y-1 = 4px                         │
│  ┌─ Itinerary list (space-y-4 = 16px) ────┐ │
│  │  ┌─ Item (space-y-0.5 = 2px) ────────┐ │ │
│  │  │  [Masa / Time]                    │ │ │
│  │  │  ↕ 2px                            │ │ │
│  │  │  [Acara / Event]                  │ │ │
│  │  └───────────────────────────────────┘ │ │
│  │  ↕ 16px                               │ │
│  │  ┌─ Item ────────────────────────────┐ │ │
│  │  │  ...                              │ │ │
│  │  └───────────────────────────────────┘ │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  (Fallback jika tiada itinerary:            │
│   legacy schedule text — text-xs)           │
│                                             │
└─────────────────────────────────────────────┘
```

| Elemen | Class / Style |
|---|---|
| Section title | `var(--color-heading, hsl(var(--primary)))` |
| Masa / Time | `text-sm font-semibold text-foreground` |
| Acara / Event | `text-sm text-foreground/80` |
| Legacy schedule (fallback) | `text-xs text-foreground/75 leading-relaxed` |
| Font (semua) | `bodyFontFamily` |

---

#### 4. Prayer (Doa)
| Elemen | Colour Property |
|---|---|
| Doa text | `text-foreground/80` |

---

#### 5. Countdown
| Elemen | Colour Property |
|---|---|
| Section title | `var(--color-heading, hsl(var(--primary)))` |
| Fallback text | `text-foreground/70` |

---

#### 6. Dress Code
| Elemen | Colour Property |
|---|---|
| Section title | `var(--color-heading, hsl(var(--primary)))` |
| Label "Theme" | `var(--color-muted, hsl(var(--foreground)/0.5))` |
| Theme value | `text-primary` |
| Colour swatches | `backgroundColor: <hex value>` |

---

#### 7. RSVP
| Elemen | Colour Property |
|---|---|
| Section title | `var(--color-heading, hsl(var(--primary)))` |
| Count numbers | `text-primary` |
| Count labels | `var(--color-heading, hsl(var(--primary)))` |
| Prompt text | `text-foreground/70` |
| Button | `bg-primary text-primary-foreground` |

---

## Changelog

| Tarikh | Perubahan |
|---|---|
| 2026-08-18 | Gap antara sections: `gap-14` (56px) → `gap-[50px]` (50px) |
| 2026-08-18 | detailBlock spacing: `space-y-4` (16px) → `space-y-1` (4px) |
| 2026-08-18 | Ornament height: 80px → 20px → 32px → 60px → 54px → 48px |
| 2026-08-18 | Ornament margin (`my-1`) removed |
| 2026-08-18 | Tambah rujukan warna teks untuk semua section |
| 2026-08-18 | Invitation Text — Parents block: `space-y-1` (4px) → `space-y-2` (8px) |
| 2026-08-18 | Tambah layout diagram untuk section Invitation Text |
| 2026-08-18 | Event Details — DATE→TIME dan TIME→LOCATION gap: `space-y-1` (4px) → `marginTop: 8px` |
| 2026-08-18 | Invitation Text — Parents + Invitation message font size: hardcoded `text-sm` → `var(--greeting-font-size, 1rem)` dengan per-field slider override |
| 2026-08-18 | Tambah nota font size per-field (wrapper `<span style="font-size:Xpx">`) dalam section Invitation Text |
