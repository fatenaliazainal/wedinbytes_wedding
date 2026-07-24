# WedInBytes

Malaysian wedding e-invitation SaaS platform. Buyers register, customise their card, and share a unique invite link. Admins manage designs and view RSVPs.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server
- `pnpm --filter @workspace/wedding-invite run dev` — Frontend
- `pnpm --filter @workspace/db run push` — Push DB schema changes (dev)
- `pnpm run typecheck` — Full typecheck
- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API hooks from OpenAPI spec

Required env vars: `DATABASE_URL`, `SESSION_SECRET`, `CF_R2_ACCOUNT_ID`, `CF_R2_ACCESS_KEY_ID`, `CF_R2_SECRET_ACCESS_KEY`, `CF_R2_BUCKET_NAME`

Optional env vars: `VITE_R2_DOMAIN_URL` — public base URL for R2 images (e.g. `https://pub-xxx.r2.dev`). Leave empty to serve local/public assets only.

## Seed accounts (auto-created on first startup)

- **Admin**: `admin@wedinbytes.com` / password = value of `SEED_SECRET` env var (currently `wedding-seed-2025`)
- **Demo invitation**: token `demo`, token `ain-hidayat-2025`

## Stack

- **Monorepo**: pnpm workspaces, TypeScript 5.9, Node 24
- **Frontend**: React + Vite, Tailwind CSS, wouter, framer-motion, sonner
- **Backend**: Express 5, Pino logger
- **Database**: PostgreSQL + Drizzle ORM + drizzle-zod
- **Auth**: express-session + connect-pg-simple (session table via Drizzle)
- **Build**: esbuild (CJS bundle for API)

## Where things live

- `artifacts/wedding-invite/src/` — React frontend
  - `pages/` — DashboardPage, EditorPage, InvitationPage, AdminPage, LoginPage, RegisterPage, HomePage
  - `hooks/use-design.ts` — Global design tokens + per-invitation DesignOverrides
  - `context/AuthContext.tsx` — Session-based auth
- `artifacts/api-server/src/routes/` — Express routes (auth, invitation, design, rsvp)
- `lib/db/src/schema/` — Drizzle schema: `invitation.ts`, `user.ts`
- `lib/api-zod/` — Zod schemas auto-generated from OpenAPI

## Architecture decisions

- **Per-invitation design overrides**: Buyer customisations (colours, font, animation, button text) are stored on `invitationTable`, NOT the global `card_design` table — so the `/invite/demo` is never affected by buyer changes.
- **Global design is read-only from buyer side**: Only admins write to `card_design`; buyers patch their own invitation record only.
- **Colors stored as HSL strings**: e.g. `"142 45% 35%"` — consumed as `hsl(...)` in CSS.
- **Session persistence**: `sessionTable` created via Drizzle push (not `table.sql`); `createTableIfMissing: false` in connect-pg-simple.
- **BASE_URL prefix**: All fetch calls use `import.meta.env.BASE_URL.replace(/\/$/, "")` for Replit path-based routing.

## Product

- **Public**: `/` (token lookup), `/invite/:token` (live invitation for guests), `/invite/demo` (demo card)
- **Buyer**: `/register`, `/login`, `/dashboard` (order list, profile), `/editor` (customise card)
- **Admin**: `/admin` (RSVP dashboard, design management)
- **Envelope (doors mode)**: Pink door panels, CSS/SVG rose florals, gold ribbon bow, large pearl oval frame, pearl necklace ring around badge, green badge + BUKA button. `cardMaxWidth` constrains the column; background shows on sides on desktop.
- **Editor tabs**: Content editing categories in English: Design, Cover, Invitation Text, Date & Location, Programme, Prayer, Countdown, Gallery, RSVP, Wishes. These are kept for editing organization only.
- **Published invitation structure**: Only 2 main pages:
  1. **Main Invitation / Cover** — full-screen cover with couple names, date, and opening experience.
  2. **Wedding Details** — one long scrollable page combining Invitation Text, Date & Location, Programme, Prayer, Countdown, RSVP, Wishes/Guestbook, Contact, and Gallery.
- **Language separation**: Editor UI is always in English. Only the published invitation card content is translated based on the customer's selected language (`language` field: `ms` or `en`). Card labels (Date, Time, Location, etc.) and default text switch automatically; user-entered text is preserved as-is.

## User preferences

- Malay UI labels (Bahasa Malaysia) throughout the buyer-facing UI
- Brand name: **WedInBytes** (not KadKahwin.my)

## Gotchas

- Demo token is `"demo"` — hardcoded in seed; never assign to a real user
- `ALLOWED_FIELDS` in `invitation.ts` route must include any new invitation columns or PATCH silently ignores them
- After adding DB columns, restart API server (push-force runs on startup)
- `Grid2X2` icon from lucide-react used in DashboardPage (not `Grid`)

## Pointers

- Drizzle schema: `lib/db/src/schema/invitation.ts`, `lib/db/src/schema/user.ts`
- Design override columns: see `invitationTable` in schema above
- Skills: `react-vite`, `database`, `pnpm-workspace`, `environment-secrets`
