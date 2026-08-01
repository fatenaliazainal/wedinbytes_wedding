---
name: Wax seal component coverage
description: waxSealImageUrl must reach every opening-animation component — missing it in one causes silent fallback to initials circle for that style.
---

# Wax Seal Component Coverage

## Rule
Every opening-animation component must accept and render `waxSealImageUrl`. The wax seal is a **background layer** (absolute inset-0); the uploaded initials/logo image and text initials render on top of it (relative z-10). All three are composited, not mutually exclusive.

**Why:** InvitationPage fetches the seal once and passes it as a prop. If a component doesn't declare the prop, the data is silently discarded and the initials circle renders instead. This affected `EnvelopeDoors` (doors/window styles) while `EnvelopeAnimation` (envelope style) was already correct. Logo/initials must overlay the seal so both are visible simultaneously.

## How to apply
When adding a new opening-animation component, or reviewing why a seal isn't showing for a specific animation style, check that:
1. The component interface declares `waxSealImageUrl?: string`
2. The component destructures and renders it at higher priority than `initialsImageUrl`
3. `InvitationPage.tsx` passes `waxSealImageUrl={waxSealImageUrl}` to the component in the JSX

## Affected files
- `artifacts/wedding-invite/src/components/EnvelopeDoors.tsx`
- `artifacts/wedding-invite/src/components/EnvelopeAnimation.tsx`
- `artifacts/wedding-invite/src/pages/InvitationPage.tsx` (passes the prop)
