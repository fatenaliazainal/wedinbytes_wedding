# User Flow Document — Wedding Invitation SaaS

---

**Version:** 1.0
**Last updated:** 2026-08-03
**Status:** Draft
**Owner:** Product / fatenaliaza

### Changelog

| Version | Date | Author | Change summary |
|---------|------|--------|----------------|
| 1.0 | 2026-08-03 | Agent | Initial draft — all four user types |

---

## Overview

The platform serves four distinct user types, each with their own entry points, flows, and permissions.

| User Type | Entry Point | Core Goal |
|-----------|-------------|-----------|
| **Guest / Public** | `/` | Discover the product, view invitations, submit RSVPs |
| **Buyer** | `/register` → `/dashboard` | Create, pay for, and share a personalised wedding invitation |
| **Business Account** | `/register/business` → `/business/dashboard` | Manage a portfolio of client invitations under one brand |
| **Admin** | `/admin/login` → `/admin` | Manage platform content, users, orders, and design assets |

---

## 1. Guest / Public Flow

Unauthenticated visitors — potential buyers and wedding guests.

```
Landing (/)
├── Navigation: Catalog / Pricing / FAQ / Reviews / For Business
│
├── [A] Discover & Browse
│   ├── /weddingcards/home        → card catalog (all designs)
│   │   └── /weddingcards/home/:slug → design detail / preview
│   │       └── "Choose This Design" ──────────────────────────┐
│   ├── /pricing                  → package comparison          │
│   ├── /faq                      → frequently asked questions  │
│   └── /reviews                  → public testimonials         │
│                                                               ▼
├── [B] View a Public Invitation                     Login / Register
│   ├── /invite/:dateCode/:slug   → full invitation (SEO URL)
│   │   ├── View: cover, details, gallery, schedule, map
│   │   ├── Submit RSVP (modal) → stored, visible to buyer
│   │   ├── View wishes carousel
│   │   └── View gift registry / QR code (Premium only)
│   └── /invite/:token            → token-protected preview
│
├── [C] Submit RSVP (from invitation page)
│   ├── Fill: name, attendance, guest count, message
│   ├── Submit → confirmation shown inline
│   └── View public RSVP list at /rsvp-share/:token
│
└── [D] Auth Entry Points
    ├── /login          → buyer or business login
    ├── /register       → new buyer account
    ├── /register/business → new business account
    └── /forgot-password   → password reset request
```

---

## 2. Buyer Flow

Registered individual customer creating a personal wedding invitation.

### 2a. Registration & Onboarding

```
/register
├── Fill: name, email, password
├── Submit → account created (role: buyer)
└── Redirect → /dashboard
```

### 2b. Dashboard Overview

```
/dashboard
├── My Invitations list
│   ├── [Create New] → /editor?new=1 (or design picker first)
│   ├── [Edit]       → /editor (loads existing invitation)
│   ├── [Preview]    → /invite/:token
│   ├── [Share]      → copy public URL
│   └── [Delete]     → confirmation → removed
│
├── Payment History section
│   ├── View paid / pending / expired orders
│   ├── [Retry Payment] → re-initiates bill (if expired/failed)
│   └── [Download Receipt] → PDF
│
├── RSVP Dashboard → /rsvp
│   ├── RSVP list, counts, wishes
│   └── Copy RSVP share link → /rsvp-share/:token
│
└── Profile / Password
    └── PATCH /auth/profile, /auth/change-password
```

### 2c. Editor Flow

```
/editor  (or /editor?new=1&designCode=...)
│
├── Step: Choose / Confirm Package
│   ├── Basic / Standard / Premium
│   └── Package locks/unlocks feature sections below
│
├── Step: Wedding Details
│   ├── Groom & Bride names (cover names used in public URL)
│   ├── Event date, time, venue
│   └── Dress code + colour palette
│
├── Step: Design & Theme
│   ├── Select active card design (from admin-managed catalog)
│   ├── Customize: colours, fonts, template accents
│   └── Preview updates live
│
├── Step: Content Sections
│   ├── Photos / gallery upload        (Standard+)
│   ├── Music / background audio       (Standard+)
│   ├── Schedule / timeline            (Standard+)
│   ├── Maps & directions
│   ├── Social links
│   ├── Wishes section toggle
│   └── Wax seal selection             (optional)
│
├── Step: Premium Features             (Premium only)
│   ├── Gift registry items            (CRUD)
│   ├── Gift QR code upload (max 2)
│   └── Order initials artwork upload
│
├── [Save] → PATCH /invitation/:token
│
└── [Proceed to Payment]
    └── → Payment Flow (2d)
```

### 2d. Payment Flow

```
/editor → "Pay & Activate"
│
├── POST /payment/toyyibpay/create-bill
│   └── Bill created with package price
│
├── Redirect → ToyyibPay payment gateway (external)
│   ├── [Pay] → gateway processes payment
│   └── Redirect back → /payment/toyyibpay/return?orderReference=...&billCode=...
│
├── /payment/toyyibpay/return  (ToyyibPayReturnPage)
│   ├── GET /payment/toyyibpay/return-status
│   │   ├── PAID    → invitation activated, show success
│   │   │             "View Invitation" → /invite/:token
│   │   │             "Go to Dashboard" → /dashboard
│   │   ├── PENDING → polling / manual check
│   │   └── FAILED  → show error, retry from dashboard
│   │
│   └── POST /payment/toyyibpay/callback (server-side, async)
│       └── Verifies with ToyyibPay API → marks order PAID
│           → invitation status set to active
│           → confirmation email sent to buyer
│
└── Paid invitation:
    ├── Package is locked (cannot downgrade)
    ├── Content remains editable until event date
    └── After event date → read-only lock
```

### 2e. Post-Payment — Sharing

```
/dashboard → paid invitation row
├── Copy public link  → https://domain/invite/:dateCode/:slug
├── Copy RSVP link    → https://domain/rsvp-share/:token
└── Download receipt  → PDF via browser
```

---

## 3. Business Account Flow

Registered business (photographer, planner, etc.) managing client invitations.

### 3a. Registration & Onboarding

```
/for-business          → marketing/proposal page
└── "Register as Business" → /register/business
    ├── Fill: business/contact name, email, password
    ├── Submit → account created (role: business_account)
    └── Redirect → /business/dashboard
```

### 3b. Business Dashboard

```
/business/dashboard
├── Client invitations list (compact rows)
│   ├── Status: Active / Pending
│   ├── [Edit]    → /business/editor (loads invitation)
│   ├── [Preview] → /invite/:token
│   └── [RSVP Link] → copy /rsvp-share/:token
│
├── Clients list → CRUD
│   ├── Add client manually
│   ├── Assign / create invitation for client
│   └── Edit / delete client
│
├── Order Form Shares
│   ├── Share /business/:slug/customer-form/:token with buyer
│   └── Client fills form → auto-creates invitation draft
│
└── Collaborations / public business profile
    └── /business/:slug  → public profile page
```

### 3c. Client Order Form (self-serve entry)

```
/business/:slug/customer-form/:token  (or /customer-form/:token)
│
├── Customer fills: wedding details, preferences, file uploads
├── POST /business/form-shares/:token/submit
└── Business sees new draft invitation in dashboard
    └── Business edits & publishes → payment flow (same as Buyer 2d)
```

### 3d. Business Editor

```
/business/editor  (role-aware EditorPage with mode=business)
└── Same steps as Buyer Editor (2c)
    ├── Design, content, premium features
    └── On save → PATCH /invitation/:token
```

### 3e. Business Profile & Logo

```
/business/profile
├── Edit business name, description, social links
├── Upload logo → POST /business/me/logo (R2 proxy)
└── Logo appears on collaborations carousel on marketing homepage
```

---

## 4. Admin Flow

Platform owner managing the entire system.

### 4a. Authentication

```
/admin/login
├── POST /auth/admin-login  (separate admin credential check)
└── Redirect → /admin
```

### 4b. Admin Console Overview

```
/admin
├── Dashboard: revenue stats, order volume, active invitations
│
├── Orders & Customers
│   ├── All orders list: filter by status/date
│   ├── Order detail: buyer info, package, amount, status
│   ├── PATCH order status (manual override)
│   └── Customers list + role management
│       └── PATCH /admin/users/:id/role
│
├── Invitations
│   ├── All invitations, filter/search
│   └── PATCH invitation status (activate/deactivate)
│
├── Pricing & Packages
│   ├── List all packages: GET /admin/pricing
│   ├── Create / edit / delete packages
│   └── Manage features per package (on/off, limits)
│
├── Card Designs & Assets
│   ├── Upload design images → POST /upload
│   ├── Create / edit / delete card design records
│   ├── Activate a design (sets as default template)
│   └── Design cascades into all invitations using that card
│
├── Wax Seals
│   ├── Upload seal image → POST /admin/wax-seals/upload
│   ├── Create / edit / delete seal records
│   └── Seals appear as options in buyer/business editor
│
├── Reviews Moderation
│   ├── All submitted reviews
│   ├── Approve / reject / delete
│   └── Approved reviews appear on /reviews page
│
└── Demo Editor
    └── /admin/demo  → full editor in demo mode
        ├── Token: "demo" (EN) / "demo-en"
        ├── All premium features unlocked, no payment required
        └── Used to preview/test design changes live
```

### 4c. Revenue Reporting

```
/admin → Revenue section
├── Grouped by Malaysia payment month (PAID orders only)
├── Order volume grouped by order creation month
└── Customer acquisition over time
```

---

## 5. Cross-Cutting Flows

### Password Reset

```
/forgot-password
├── Enter email → POST /auth/forgot-password
├── Email sent with reset token
└── /forgot-password?token=... → POST /auth/reset-password
    └── Redirect → /login
```

### Invitation Expiry

```
Public invitation /invite/:dateCode/:slug
├── If invitation is older than 3 calendar months:
│   └── Redirect → / (home) — no expired data exposed
└── If active:
    └── Full invitation rendered normally
```

### Invitation Lock

```
After event date:
├── Buyer/Business: editor becomes read-only
├── Upload endpoints return 403
└── Admin can still override status
```

### RSVP Share (public, no auth)

```
/rsvp-share/:token
├── GET /rsvp/public/:token → { invitation summary, rsvp list }
├── Show: attending / not attending / total tiles
└── Full RSVP table with names and messages
```

---

## 6. Route → Page → API Map (Quick Reference)

| Route | Page | Key API Calls |
|-------|------|--------------|
| `/` | MarketingHomePage | GET /business/collaborations |
| `/weddingcards/home` | WeddingCardsHomePage | GET /cards, /design/active |
| `/weddingcards/home/:slug` | WeddingCardDetailPage | GET /cards |
| `/pricing` | PriceListPage | GET /pricing |
| `/invite/:dateCode/:slug` | InvitationPage | GET /invitation/public/:dateCode/:slug |
| `/invite/:token` | InvitationPage | GET /invitation/:token |
| `/editor` | EditorPage | GET+PATCH /invitation/:token |
| `/dashboard` | DashboardPage | GET /invitations-by-user, /buyer/payment-history |
| `/rsvp` | RsvpDashboardPage | GET /rsvp/buyer, /rsvp/wishes |
| `/rsvp-share/:token` | RsvpPublicPage | GET /rsvp/public/:token |
| `/business/dashboard` | BusinessDashboardPage | GET /business/invitations, /business/clients |
| `/business/editor` | EditorPage (business) | GET+PATCH /invitation/:token |
| `/business/profile` | BusinessProfilePage | GET+PATCH /business/me |
| `/business/:slug` | BusinessPublicPage | GET /business/:slug |
| `/business/:slug/customer-form/:token` | CustomerFormPage | GET+POST /business/form-shares/:token |
| `/payment/toyyibpay/return` | ToyyibPayReturnPage | GET /payment/toyyibpay/return-status |
| `/for-business` | BusinessProposalPage | — |
| `/register/business` | BusinessRegisterPage | POST /auth/register |
| `/admin` | AdminConsolePage | GET /admin/orders, /admin/pricing, … |
| `/admin/demo` | EditorPage (demo) | All editor APIs, demo token bypass |

---

## 7. Key Business Rules

| Rule | Scope | Detail |
|------|-------|--------|
| Package lock after payment | Buyer, Business | Package cannot be downgraded once paid; content stays editable |
| Edit lock after event date | Buyer, Business | Invitation becomes read-only server-side after the event date |
| Invitation expiry | Public | Invitations older than 3 months redirect guests home |
| Demo token bypass | Admin | Tokens `"demo"` and `"demo-en"` skip feature-gate checks on all premium routes |
| Cover name → public URL | All | Public slug is derived from Cover Groom Name + Cover Bride Name |
| Design cascade | All | Active card design is the base template; buyer saves layer on top |
| Gift QR limit | Premium | Maximum 2 gift QR uploads per invitation |
| Business logo via R2 proxy | Business | Logo keys must route through the same-origin R2 API proxy |
| RSVP rate limit | Public | POST /rsvp is rate-limited to prevent spam |
| Admin one-approver | Admin | Only one admin role per platform; role upgrades via PATCH /admin/users/:id/role |
