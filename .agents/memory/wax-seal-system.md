---
name: Wax seal system
description: How the configurable wax seal feature is structured across DB, API, admin, editor, and public invitation.
---

## Rule
The wax seal is an **optional admin-managed image** that replaces the default initials circle on the envelope opening screen. Only applies when `openingAnimation === "envelope"`.

**Why:** The wax seal is the click trigger to open the envelope. The click handler lives on the parent wrapper div in EnvelopeAnimation.tsx, not on the seal itself — so swapping the circle with an image preserves all existing animation behavior without touching the trigger.

**How to apply:**
- When `waxSealImageUrl` is provided to `EnvelopeAnimation`, the `motion.div` renders WITHOUT `rounded-full bg-white shadow` classes — just a plain container holding the image.
- When not provided, the default circle (bg-white, rounded-full, shadow) is rendered exactly as before, with initials image or text fallback.

## Schema
- `wax_seal` table: `id`, `name`, `image_url`, `is_active`, `sort_order`, `created_at`
- `invitation.wax_seal_id` (integer, nullable) — FK to wax_seal.id (soft reference, no DB FK constraint)

## API routes (via `artifacts/api-server/src/routes/wax-seals.ts`)
- `GET /api/wax-seals` — active seals only (customer dropdown)
- `GET /api/wax-seals/:id` — any seal by ID regardless of active status (for rendering existing invitations)
- `GET /api/admin/wax-seals` — all seals (admin list)
- `POST /api/admin/wax-seals/upload` — upload to R2 folder `wax_seals`
- `POST /api/admin/wax-seals` — create record
- `PATCH /api/admin/wax-seals/:id` — update name/isActive/sortOrder
- `DELETE /api/admin/wax-seals/:id` — delete

## Invitation saving
`waxSealId` is in `ALLOWED_FIELDS` in `invitation.ts`. Saved as integer from editor via `parseInt(design.waxSealId, 10) || null`.

## Image resolution
InvitationPage fetches `/api/wax-seals/:id` on mount when `waxSealId` is set, then passes the resolved URL through `resolveImageUrl()` to EnvelopeAnimation. Handles disabled seals gracefully (they still render from the public `:id` endpoint).

## Admin UI
WaxSealsTab function added to AdminPage. Uses `BASE + /api/admin/wax-seals` with session credentials.
