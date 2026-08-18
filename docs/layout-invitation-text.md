# Invitation Text — Layout

```
┌─────────────────────────────────────────────┐
│                                             │
│  Container : detailBlock                    │
│  max-width : max-w-sm                       │
│  align     : text-center                    │
│  gap       : space-y-1 = 8px               │
│             (antara setiap direct child)    │
│                                             │
│  [Greeting text]                            │
│  ↕ space-y-1 = 8px                         │
│  [OrnamentDivider]                          │
│  ↕ space-y-1 = 8px                         │
│  ┌─ Parents block (space-y-1 = 8px) ──────┐ │
│  │  [Parents Lelaki]                       │ │
│  │  ↕ space-y-1 = 8px                     │ │
│  │  [&]                                    │ │
│  │  ↕ space-y-1 = 8px                     │ │
│  │  [Parents Perempuan]                    │ │
│  └─────────────────────────────────────────┘ │
│  ↕ space-y-1 = 8px                         │
│  [Invitation message]                       │
│  ↕ space-y-1 = 8px                         │
│  ┌─ Couple names (space-y-0.5 = 2px) ─────┐ │
│  │  [Nama Pengantin Lelaki]                │ │
│  │  ↕ space-y-0.5 = 2px                   │ │
│  │  [&]                                    │ │
│  │  ↕ space-y-0.5 = 2px                   │ │
│  │  [Nama Pengantin Perempuan]             │ │
│  └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```
