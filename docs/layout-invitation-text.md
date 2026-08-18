# Invitation Text — Layout

```
┌─────────────────────────────────────────────┐
│                                             │
│  Container : detailBlock                    │
│  max-width : max-w-sm                       │
│  align     : text-center                    │
│  gap       : space-y-1 = 4px               │
│             (antara setiap direct child)    │
│                                             │
│  [Greeting text]                            │
│  ↕ space-y-1 = 4px                         │
│  [OrnamentDivider]                          │
│  ↕ space-y-1 = 4px                         │
│  ┌─ Parents block (space-y-1 = 4px) ──────┐ │
│  │  [Parents Lelaki]                       │ │
│  │  ↕ space-y-1 = 4px                     │ │
│  │  [&]                                    │ │
│  │  ↕ space-y-1 = 4px                     │ │
│  │  [Parents Perempuan]                    │ │
│  └─────────────────────────────────────────┘ │
│  ↕ space-y-1 = 4px                         │
│  [Invitation message]                       │
│  ↕ space-y-1 = 4px                         │
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
