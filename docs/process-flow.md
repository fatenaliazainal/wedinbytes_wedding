# WedInBytes — Complete Process Flow Document

---

**Version:** 1.0
**Date:** 2026-08-03
**Status:** Draft
**Scope:** Full platform — all modules, all user types
**Purpose:** Documentation only. No code was modified during this analysis.

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Database Schema Reference](#2-database-schema-reference)
3. [Module: Landing Page](#3-module-landing-page)
4. [Module: Authentication](#4-module-authentication)
5. [Module: Dashboard](#5-module-dashboard)
6. [Module: Create Invitation](#6-module-create-invitation)
7. [Module: Invitation Editor](#7-module-invitation-editor)
   - 7a. Theme & Design Selection
   - 7b. Cover
   - 7c. Invitation Text
   - 7d. Date & Location
   - 7e. Event Programme
   - 7f. Dress Code
   - 7g. Doa
   - 7h. Gallery Upload
   - 7i. Gift (Money Gift)
   - 7j. Gift Registry
   - 7k. RSVP Settings
   - 7l. Contact
   - 7m. Footer (Admin only)
   - 7n. Background Upload
   - 7o. Music (YouTube URL)
8. [Module: Preview](#8-module-preview)
9. [Module: Save Draft](#9-module-save-draft)
10. [Module: Publish Invitation](#10-module-publish-invitation)
11. [Module: Public Invitation View](#11-module-public-invitation-view)
12. [Module: RSVP](#12-module-rsvp)
13. [Module: Wishes](#13-module-wishes)
14. [Module: Gift Fund / Money Gift](#14-module-gift-fund--money-gift)
15. [Module: Gift Registry](#15-module-gift-registry)
16. [Module: Location & Contact](#16-module-location--contact)
17. [Module: Countdown](#17-module-countdown)
18. [Module: Subscription / Pricing](#18-module-subscription--pricing)
19. [Module: Payment (ToyyibPay)](#19-module-payment-toyyibpay)
20. [Module: User Profile & Billing](#20-module-user-profile--billing)
21. [Module: Admin Panel](#21-module-admin-panel)
22. [End-to-End Process Flow](#22-end-to-end-process-flow)
23. [Findings: Missing Flows, Inconsistencies & Potential Bugs](#23-findings-missing-flows-inconsistencies--potential-bugs)

---

## 1. System Architecture Overview

```
Browser (React + Vite SPA)
        │
        │  HTTP (same-origin or proxied)
        ▼
Express API Server (Node.js)
        │
        ├── Session auth (express-session + connect-pg-simple)
        ├── Routes: auth, invitation, rsvp, gift-registry,
        │          business, orders, toyyibpay, pricing,
        │          cards, design, reviews, wax-seals, health
        │
        ├── PostgreSQL (Drizzle ORM — schema in lib/db/src/schema/)
        │
        ├── Cloudflare R2 (image/asset storage — proxied via /api/r2/*)
        │
        └── ToyyibPay API (payment gateway — sandbox or live)
```

**Key conventions:**
- All API routes are prefixed `/api`
- Authentication is cookie-based session (`connect.sid`; `sameSite: "none"`, `secure: true`)
- No foreign-key constraints in the DB; all relationships are application-enforced
- R2 objects are never served directly from a public domain — all browser reads go through the same-origin API proxy
- Demo invitations use token `"demo"` (Malay) or `"demo-en"` (English); both bypass all package feature gates

---

## 2. Database Schema Reference

### 2.1 `user`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| email | text | NOT NULL, UNIQUE |
| passwordHash | text | NOT NULL |
| passwordResetTokenHash | text | nullable |
| passwordResetExpiresAt | timestamp | nullable |
| name | text | NOT NULL |
| role | text | NOT NULL, DEFAULT `'buyer'` |
| createdAt | timestamp | NOT NULL, DEFAULT now() |

**Roles:** `buyer`, `business_account`

---

### 2.2 `admin`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| email | text | NOT NULL, UNIQUE |
| passwordHash | text | NOT NULL |
| name | text | NOT NULL |
| role | text | NOT NULL, DEFAULT `'admin'` |
| createdAt | timestamp | NOT NULL, DEFAULT now() |

Separate table from `user`; admin has its own login route.

---

### 2.3 `session`
Standard connect-pg-simple session table. `sid` (varchar PK), `sess` (JSON), `expire` (timestamp).

---

### 2.4 `invitation`
| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| id | serial PK | — | NOT NULL |
| token | text UNIQUE | — | NOT NULL |
| userId | integer | — | nullable |
| businessId | integer | — | nullable |
| packageId | integer | — | nullable |
| isPurchased | boolean | false | NOT NULL |
| purchasedAt | timestamp | — | nullable |
| purchasedPackageId | integer | — | nullable |
| isLocked | boolean | false | NOT NULL |
| lockPinHash | text | — | nullable |
| language | text | — | nullable |
| coverTitle | text | — | nullable |
| groomName | text | — | nullable |
| brideName | text | — | nullable |
| coverGroomName | text | — | nullable |
| coverBrideName | text | — | nullable |
| envelopeInitials | text | — | nullable |
| envelopeInitialsSize | integer | — | nullable |
| page2Initials | text | — | nullable |
| logoInitialsUrl | text | — | nullable |
| initialsImageUrl | text | — | nullable |
| initialsImageScale | integer | — | nullable |
| hashtag | text | — | nullable |
| showFrontText | boolean | — | nullable |
| greetingText | text | — | nullable |
| doaText | text | — | nullable |
| invitationText | text | — | nullable |
| groomParents | text | — | nullable |
| brideParents | text | — | nullable |
| hostName | text | — | nullable |
| hostCount | integer | — | nullable |
| eventType | text | — | nullable |
| eventDate | text | — | nullable |
| eventDay | text | — | nullable |
| eventTime | text | — | nullable |
| eventStartDateTime | text | — | nullable |
| eventEndDateTime | text | — | nullable |
| eventStartTime | text | — | nullable |
| eventEndTime | text | — | nullable |
| venueName | text | — | nullable |
| venueAddress | text | — | nullable |
| venueCity | text | — | nullable |
| venueState | text | — | nullable |
| venueHijriDate | text | — | nullable |
| venueMapUrl | text | — | nullable |
| venueWazeUrl | text | — | nullable |
| itinerary | jsonb | — | nullable |
| schedule | jsonb | — | nullable |
| coverDateText | text | — | nullable |
| additionalInfo | text | — | nullable |
| contacts | jsonb | — | nullable |
| contactPhone | text | — | nullable |
| dresscode | text | — | nullable |
| dresscodeTheme | text | — | nullable |
| dresscodeColors | jsonb | — | nullable |
| message | text | — | nullable |
| galleryImages | jsonb | — | nullable |
| giftDisplay | boolean | — | nullable |
| giftTitle | text | — | nullable |
| giftRecipient | text | — | nullable |
| giftBankName | text | — | nullable |
| giftAccountNumber | text | — | nullable |
| giftQrCodes | jsonb | — | nullable |
| shortCoupleName | text | — | nullable |
| groomShortName | text | — | nullable |
| brideShortName | text | — | nullable |
| coupleCount | integer | — | nullable |
| groomInitial | text | — | nullable |
| brideInitial | text | — | nullable |
| registryRecipientName | text | — | nullable |
| registryRecipientAddress | text | — | nullable |
| rsvpEnabled | boolean | — | nullable |
| rsvpAdditionalInfo | text | — | nullable |
| rsvpDeadline | text | — | nullable |
| rsvpIntroText | text | — | nullable |
| rsvpFormNote | text | — | nullable |
| rsvpMaxOverallGuests | integer | — | nullable |
| rsvpMaxGuestsPerInvitation | integer | — | nullable |
| rsvpTimeSlots | text | — | nullable |
| designCode | text | — | nullable |
| openingAnimation | text | — | nullable |
| openButtonText | text | — | nullable |
| colorPrimary…colorMuted | text (×10) | — | nullable |
| nameFontFamily, bodyFontFamily | text | — | nullable |
| nameFontSize, badgeFontSize, greetingFontSize | text | — | nullable |
| nameColor, greetingColor | text | — | nullable |
| waxSealId | integer | — | nullable |
| musicUrl | text | — | nullable |
| musicTitle | text | — | nullable |
| musicArtist | text | — | nullable |
| overlayEnabled | boolean | true | NOT NULL |
| showFooter | boolean | true | NOT NULL |
| footerText | text | — | nullable |
| footerUrl | text | — | nullable |
| socialLinks | jsonb | — | nullable |
| createdAt | timestamp | now() | NOT NULL |

---

### 2.5 `order`
| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| id | serial PK | — | NOT NULL |
| userId | integer | — | nullable |
| invitationId | integer | — | nullable |
| packageId | integer | — | nullable |
| paymentStatus | text | `'PENDING'` | NOT NULL |
| paymentReference | text | — | nullable |
| paymentGateway | text | — | nullable |
| amount | text | `'0'` | NOT NULL |
| initialsImageUrl | text | — | nullable |
| gatewayRefNo | text | — | nullable |
| billCode | text | — | nullable |
| billCodeCreatedAt | timestamp | — | nullable |
| paidAt | timestamp | — | nullable |
| createdAt | timestamp | now() | NOT NULL |
| updatedAt | timestamp | now() | NOT NULL |

**paymentStatus values:** `PENDING`, `PAID`, `FAILED`, `EXPIRED`

---

### 2.6 `rsvp`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial PK | — |
| invitationToken | text | NOT NULL, DEFAULT `'unknown'` |
| name | text | NOT NULL |
| attending | boolean | NOT NULL |
| numberOfGuests | integer | NOT NULL, DEFAULT 1 |
| side | text | nullable |
| timeSlot | text | nullable |
| message | text | nullable |
| createdAt | timestamp | NOT NULL, DEFAULT now() |

UNIQUE constraint on `(invitationToken, name)` — one RSVP per guest name per invitation.

---

### 2.7 `gift_registry_item`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial PK | NOT NULL |
| invitationToken | text | NOT NULL |
| name | text | NOT NULL |
| url | text | nullable |
| thumbnailUrl | text | nullable |
| notes | text | nullable |
| sortOrder | integer | NOT NULL, DEFAULT 0 |
| createdAt | timestamp | nullable |

---

### 2.8 `pricing_package`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| name | text | NOT NULL |
| price | text | stored as string |
| description | text | |
| badgeText | text | |
| showBadge | boolean | |
| isFeatured | boolean | |
| isActive | boolean | DEFAULT true |
| sortOrder | integer | |
| formConfig | jsonb | business order form field config |
| businessPrice | text | nullable — B2B price override |
| promoPrice | text | nullable |
| promoStartDate | text | nullable |
| promoEndDate | text | nullable |

---

### 2.9 `pricing_feature`
Feature rows linked to a package. `packageId`, `name`, `icon`, `sortOrder`.

---

### 2.10 `card_design`
Central design template. Holds all default theme values (colors, fonts, images, opening animation, overlay, wax seal ID). The `isActive` flag designates the currently active design. `designCode` links to invitations.

---

### 2.11 `business_profile`, `business_client`, `business_form_share`
See Section 1 overview. `business_profile` is a 1:1 extension of `user` for business accounts. `business_client` tracks individual end-customers; `business_form_share` is a shareable order-form token tied to a package.

---

### 2.12 `wax_seal`
Admin-managed decorative seal images. `imageUrl` served via R2 proxy. Linked by ID to `invitation` and `card_design`.

---

### 2.13 `card`
Catalog asset table. `name`, `path`, `category`. No schema-level links to other tables — used only as design catalog metadata.

---

### 2.14 `review`
Public testimonial. `customerName`, `rating` (1–5), `reviewText`, `weddingDate`, `status` (`pending`/`approved`/`rejected`).

---

## 3. Module: Landing Page

### 3.1 User Journey
1. Visitor arrives at `/`
2. Sees hero, feature highlights, card catalog preview, collaboration logos, testimonials, pricing teaser
3. Can navigate to: Catalog (`/weddingcards/home`), Pricing (`/pricing`), FAQ (`/faq`), Reviews (`/reviews`), For Business (`/for-business`)
4. Can login, register, or go directly to dashboard if already authenticated

### 3.2 Frontend Components
- `MarketingHomePage.tsx` — main page
- `SiteHeader.tsx` / `SharedNavDrawer.tsx` — auth-aware navigation
- `SiteFooter.tsx`
- Business collaboration carousel

### 3.3 Backend / API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/business/collaborations` | Loads verified business profiles for carousel |

### 3.4 Database
- `business_profile` — reads `isVerified=true`, `isActive=true` rows for collaboration logos

### 3.5 Validation
None — read-only public page.

### 3.6 Success Flow
Page loads, carousel populates if verified businesses exist.

### 3.7 Error Handling
Carousel silently fails/hides if API returns empty or errors.

### 3.8 Dependencies
None. Fully public.

---

## 4. Module: Authentication

### 4.1 User Journey

#### Register (Buyer)
1. Visit `/register`
2. Fill: Name, Email, Password, Confirm Password
3. Submit → account created → redirect to `/dashboard`

#### Register (Business)
1. Visit `/register/business` (from `/for-business` CTAs or nav)
2. Fill: Business/Contact Name, Email, Password
3. Submit with `accountType: "business_account"` → redirect to `/business/dashboard`

#### Login
1. Visit `/login`
2. Fill: Email, Password
3. Submit → role-based redirect: `buyer` → `/dashboard`, `business_account` → `/business/dashboard`

#### Forgot Password
1. Visit `/forgot-password`
2. Enter email → generic success shown regardless of match
3. In non-production: reset URL is returned in response (⚠️ security note)
4. User clicks link → enters new password

#### Logout
1. Click logout in nav
2. POST `/auth/logout` → session destroyed → redirect to `/`

#### Admin Login
1. Visit `/admin/login`
2. Enter password (admin email is looked up from first admin record)
3. POST `/auth/admin-login` → admin session → redirect to `/admin`

---

### 4.2 Frontend Components
- `RegisterPage.tsx`
- `BusinessRegisterPage.tsx`
- `LoginPage.tsx`
- `ForgotPasswordPage.tsx`

### 4.3 Backend / API
| Method | Endpoint | Auth Guard | Key Logic |
|--------|----------|-----------|-----------|
| POST | `/auth/register` | rate-limit | validates email unique, bcrypt hash, INSERT user, session |
| POST | `/auth/login` | rate-limit | bcrypt compare, session regenerate |
| POST | `/auth/forgot-password` | rate-limit | generates reset token hash + expiry, UPDATE user |
| POST | `/auth/reset-password` | rate-limit | validates token/expiry, UPDATE password hash |
| GET | `/auth/me` | session required | returns current user shape |
| PATCH | `/auth/profile` | session required | UPDATE name/email with uniqueness check |
| POST | `/auth/change-password` | session required | verifies current, bcrypt new |
| POST | `/auth/admin-login` | rate-limit | separate admin table lookup |
| POST | `/auth/logout` | — | destroy session, clearCookie |

### 4.4 Database
- `user` — INSERT on register, SELECT on login/me, UPDATE on profile/password/reset
- `session` — managed by connect-pg-simple
- `admin` — SELECT on admin login

### 4.5 Validation Rules
| Field | Rule |
|-------|------|
| email | required, valid format, max 254 chars, UNIQUE in DB |
| password | required, minimum 6 characters |
| name | required, max 120 chars |
| confirmPassword | must match password (frontend only) |
| reset token | must exist in DB and not be expired |
| pin (lock/unlock) | exactly 4 digits |

### 4.6 Success Flow
- Register: 201 → session established → role dashboard
- Login: 200 → session established → role dashboard
- Password reset: 200 → redirect to login

### 4.7 Error Handling
| Scenario | Response |
|----------|----------|
| Email already registered | 409 Conflict |
| Wrong password | 401 Unauthorized |
| Expired reset token | 400 Bad Request |
| Rate limit exceeded | 429 Too Many Requests |

### 4.8 Dependencies
- Session is required for all authenticated modules
- Role in `user.role` determines dashboard routing and feature access

---

## 5. Module: Dashboard

### 5.1 User Journey (Buyer)
1. Login → `/dashboard`
2. See list of own invitations with status, public URL, action buttons
3. Create new invitation, edit existing, preview, delete, or go to payment history
4. Switch to RSVP dashboard via `/rsvp`
5. Edit profile / change password

### 5.2 User Journey (Business Account)
1. Login → `/business/dashboard`
2. See all client invitations in compact table rows
3. Create new invitation for a client, edit, preview
4. Manage clients (CRUD)
5. Copy RSVP share links per invitation
6. View/manage order form shares

### 5.3 Frontend Components
- `DashboardPage.tsx` (buyer)
- `BusinessDashboardPage.tsx` (business)
- `RsvpDashboardPage.tsx`

### 5.4 Backend / API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/invitations-by-user/:userId` | Load all buyer invitations |
| GET | `/api/business/invitations` | Load business account invitations |
| GET | `/api/business/clients` | Load client list |
| GET | `/api/buyer/payment-history` | Load buyer orders |
| GET | `/api/business/payment-history` | Load business orders |
| GET | `/api/rsvp/buyer` | Load buyer RSVP invitation list |
| DELETE | `/api/invitation/:token` | Delete invitation |

### 5.5 Database
- `invitation` — SELECT by userId / businessId
- `order` — SELECT by userId for payment history
- `rsvp` — COUNT by invitationToken
- `business_client` — SELECT by businessId

### 5.6 Validation
- `/invitations-by-user/:userId`: session userId must equal param (ownership)
- DELETE: ownership check (⚠️ see Findings §23)

### 5.7 Success Flow
Invitations listed. Paid invitations show "Active" badge. Unpaid show "Pending Payment" with retry option.

### 5.8 Error Handling
- Not authenticated → redirect to `/login`
- Wrong role → redirect to correct dashboard

### 5.9 Dependencies
- `isPurchased` on invitation drives UI state (edit lock after event date, active badge)
- Payment history status comes from `order.paymentStatus`

---

## 6. Module: Create Invitation

### 6.1 User Journey
1. From dashboard, click "Create New" or select a design from `/weddingcards/home`
2. Editor opens at `/editor?new=1` (buyer) or `/business/editor?new=1`
3. If `designCode` is in query string, it is pre-applied
4. A blank invitation is created on first save (POST `/invitation`)
5. From that point, all saves are PATCH

### 6.2 Frontend Components
- `EditorPage.tsx` — the single monolithic editor page (also used by business via `mode=business`)
- `AdminEditorPage.tsx` — thin wrapper around EditorPage for `/admin/demo`
- `WeddingCardsHomePage.tsx` — design selection entry point
- `WeddingCardDetailPage.tsx` — individual design detail before entering editor

### 6.3 Backend / API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/invitation` | Create a new invitation row |
| GET | `/api/invitation/:token` | Load existing invitation |
| GET | `/api/design/active` | Load default design template |

### 6.4 Database
- `invitation` — INSERT (POST), SELECT (GET by token)
- `card_design` — SELECT active record for template defaults
- `pricing_package` — linked on creation if packageId supplied

### 6.5 Validation
- Session required
- Business role → business profile is auto-created if missing
- Token is generated server-side (UUID-style)
- `designCode` applied to invitation at creation if provided

### 6.6 Success Flow
New invitation row created → editor loaded with blank form populated from active card design defaults.

### 6.7 Error Handling
- Unauthenticated → 401
- Business profile creation failure → 500

### 6.8 Dependencies
- Active `card_design` must exist for template defaults
- `pricing_package` must be seeded for package selection in editor

---

## 7. Module: Invitation Editor

The editor (`EditorPage.tsx`) is a **single monolithic page** with tabbed sections. Tab visibility is controlled by `TAB_FEATURE_MAP` based on the invitation's active package features. Demo tokens (`demo`, `demo-en`) bypass all feature gates.

---

### 7a. Theme & Design Selection

**Tab:** DESIGN (`reka-bentuk`)

**Fields:**
- Package selector (Basic / Standard / Premium)
- Language: Malay / English
- Design Code (non-demo only — select from active designs)
- Opening animation style: `doors` / `envelope` / `window`
- Overlay toggle (boolean)
- Wax seal selector (non-demo only)
- Name script font family
- Body font family
- Font size sliders: name (20–70px), section title (12–60px), greeting/detail (10–40px)
- Theme color pickers (10 fields): nameColor, greetingColor, colorHeading, colorForeground, colorMuted, colorPrimary, colorSecondary, colorAccent, colorBackground, colorCard
- YouTube music URL (with iframe preview)

**API:**
- `GET /api/design/active` — loads default theme values
- `GET /api/wax-seals` — loads available wax seal options
- Music preview extracts YouTube ID client-side from URL string

**Package gating:** Font and color customization may be restricted by package tier. Opening style and wax seal hidden in demo editor.

**Validation:**
- Color pickers enforce #RRGGBB hex format
- Font size sliders have hard min/max bounds
- YouTube URL is validated by `extractYouTubeId()` client-side; invalid URLs show no preview but are still saved

---

### 7b. Cover

**Tab:** COVER (`muka-depan`)

**Fields:**
- Cover title (text)
- Groom full name / Bride full name
- Cover Groom Name / Cover Bride Name (used to generate public URL slug)
- Envelope initials text
- Envelope initials font size (12–48px slider)
- Optional PNG upload: initials/logo image
- Logo scale (50–140% slider)
- Remove logo button
- Hashtag
- Show front-page text toggle (boolean)

**API:**
- `POST /api/upload` (with type `order-initials`) — uploads logo PNG to R2
- Served back via `/api/r2/:key`

**Validation:**
- Logo upload: JPEG/PNG/WebP accepted
- Logo scale: 50–140 range
- Cover names are required for generating the public URL (`/invite/:dateCode/:slug`)

---

### 7c. Invitation Text

**Tab:** INVITATION TEXT (`ayat-undangan`)

**Fields:**
- Greeting (rich text — sanitized HTML)
- Groom parents (rich text)
- Bride parents (rich text)
- Invitation body text (rich text)
- Groom full name / Bride full name (duplicate of Cover tab fields, synced in state)
- Page 2 initials

**Components:**
- `RichTextEditor.tsx` — contentEditable with toolbar; sanitizes dangerous HTML nodes/attributes before `onChange`

**Validation:**
- HTML is sanitized client-side before storing; dangerous tags/attributes stripped

---

### 7d. Date & Location

**Tab:** DATE & LOCATION (`tarikh-lokasi`)
**Feature gate:** Requires `Location & Navigation` OR `Calendar` feature in package

**Fields:**
- Event date (date picker)
- Auto-derived day name (read-only, computed from date + language)
- Start time / End time
- Read-only formatted time display
- Venue name
- Venue address (rich text)
- Hijri date
- Google Maps URL
- Waze URL

**Validation:**
- Date picker enforces valid date format
- Map URLs: no server-side URL format validation found

---

### 7e. Event Programme

**Tab:** PROGRAMME (`aturcara`)

**Fields:**
- Repeatable itinerary rows: time + event description
- Default: 4 rows
- Add row / Remove row buttons

**Data structure:** `itinerary: [{time: string, event: string}]` stored as JSONB

---

### 7f. Dress Code

**Tab:** DRESS CODE (`dresscode`)

**Fields:**
- Theme text (max 120 chars)
- Up to 4 hex colour swatches (add/remove)
- Legacy `dresscode` text field (hidden in UI, retained in state/save)

**Validation:**
- Theme: maxLength 120
- Colours: #RRGGBB hex format

---

### 7g. Doa

**Tab:** DOA (`doa`)

**Fields:**
- Doa text (rich text — sanitized HTML via `RichTextEditor`)

---

### 7h. Gallery Upload

**Tab:** GALLERY (`galeri`)
**Feature gate:** Requires `Photo Gallery` OR `Money Gift` feature in package

**Fields:**
- Image upload slots — max 4 images
- Accepted formats: JPEG/PNG/WebP/GIF
- UI states max 10MB per image
- Preview thumbnails with remove buttons

**API:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/gallery-upload` | Upload image to R2, returns object key |
| (PATCH on save) | `/api/invitation/:token` | Saves `galleryImages` array of R2 keys |
| (async DELETE) | Background on PATCH | Removes deleted R2 keys from storage |

**Validation:**
- Max 4 slots enforced on client
- Server enforces gallery array cap on PATCH
- File type/size validation is primarily UI-side; server upload route should enforce but exact server-side limits are in the upload route handler

---

### 7i. Gift (Money Gift)

**Tab:** GIFT (`gift`)
**Feature gate:** Requires `Money Gift` feature in package

**Fields:**
- Display toggle (show/hide gift section)
- Gift section title
- Recipient name
- Bank name
- Account number
- Up to 2 QR code images (JPEG/PNG/WebP, UI states max 5MB)
- Remove QR buttons

**API:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/gift-qr-upload` | Upload QR image to R2 |
| (PATCH on save) | `/api/invitation/:token` | Saves `giftQrCodes` array of R2 keys |

**Validation:**
- Max 2 QR slots enforced server-side on PATCH (`giftQrCodes.length <= 2`)
- Upload buttons disabled until invitation token exists (i.e., cannot upload before first save)
- Server verifies R2 key ownership on PATCH before accepting new QR keys

---

### 7j. Gift Registry

**Tab:** GIFT REGISTRY (`registry`)
**Feature gate:** Requires `Gift Registry` feature in package

**Fields:**
- Registry recipient name
- Recipient delivery address
- Up to 20 products per invitation
- Per product: name (required), purchase URL (optional), notes (optional), thumbnail image (optional)
- Add / Edit / Remove / Reorder (up/down) controls

**API (separate from invitation save):**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/registry/:token` | Load all registry items |
| POST | `/api/registry/:token` | Add new item |
| PATCH | `/api/registry/:token/:id` | Edit item |
| DELETE | `/api/registry/:token/:id` | Delete item |
| POST | `/api/registry-thumbnail-upload` | Upload product thumbnail to R2 |

**Validation:**
- Product name is required (save button disabled without it)
- Max 20 products enforced server-side
- Feature gate checked on all registry endpoints (except for demo tokens `"demo"` and `"demo-en"`)

---

### 7k. RSVP Settings

**Tab:** RSVP (`kehadiran`)
**Feature gate:** Requires `RSVP / Wishes` feature in package

**Fields:**
- RSVP enabled toggle
- RSVP intro text (rich text)
- Deadline (datetime-local)
- Max overall guests (numeric, min 1)
- Max guests per invitation (numeric, min 1)

**Note:** Fields `rsvpFormNote` and `rsvpTimeSlots` exist in the DB schema and ALLOWED_FIELDS list but have **no visible input controls** in the editor UI. They can only be set programmatically or via direct API.

---

### 7l. Contact

**Tab:** CONTACT (`hubungi`)
**Feature gate:** Requires `Contact` feature in package

**Fields:**
- Repeatable contact entries: name + phone number
- Add / Remove contact buttons
- Legacy single `contactPhone` field (retained in save payload)

**Validation:**
- No phone number format validation in editor UI
- No required marker on individual contact fields

---

### 7m. Footer (Admin/Demo Only)

**Tab:** FOOTER (`footer`)
**Visibility:** Admin and demo sessions only; buyer saves explicitly exclude footer fields

**Fields:**
- Show footer toggle
- Footer text
- Footer URL
- Repeatable social links: platform (Instagram/TikTok/Threads/Website) + URL

---

### 7n. Background Upload

Background images are stored as part of the **card design** (`card_design.envelopeImageUrl`, `card_design.cardImageUrl`), not per-invitation. The buyer selects a design (`designCode`) which carries its own background. Per-invitation background customisation is **not available** to buyers — only admin can change design backgrounds via the Admin Panel.

---

### 7o. Music (YouTube URL)

**Location:** DESIGN tab, at the bottom

**Fields:**
- YouTube URL input
- Iframe preview shown when valid YouTube ID is extracted
- `musicTitle` and `musicArtist` fields exist in schema and ALLOWED_FIELDS but have **no editor UI controls**

**Validation:**
- `extractYouTubeId()` parses standard YouTube URL formats client-side
- Invalid URL: preview not shown, but field is still saved
- No server-side YouTube URL validation

---

## 8. Module: Preview

### 8.1 User Journey
1. From the editor, click "Preview" button
2. New tab opens at `/invite/:token` — the actual public invitation view
3. The preview is identical to the public view (no draft-only mode)
4. Buyer can also preview from dashboard via "Preview" link per invitation

### 8.2 Frontend Components
- `InvitationPage.tsx` / `WeddingCard.tsx`
- Envelope opening animation (`EnvelopeAnimation.tsx`, `EnvelopeDoors.tsx`)

### 8.3 Backend / API
- `GET /api/invitation/:token` — same endpoint as public view

### 8.4 Notes
- There is **no separate preview mode**. The preview IS the live token-based URL.
- An unpaid invitation can still be previewed via token — it will render fully; there is no paywall on the invitation view itself.

---

## 9. Module: Save Draft

### 9.1 User Journey
1. User edits fields in any tab
2. Clicks "Save" button
3. PATCH request sent with all ALLOWED_FIELDS from current editor state
4. Success toast shown; invitation row updated

### 9.2 Backend / API
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| PATCH | `/api/invitation/:token` | session + canManageInvitation | Save all editable fields |

### 9.3 Key Server-side Logic on Save
1. Confirm session user can manage this invitation (`canManageInvitation`)
2. Admin-only fields (footer) are stripped for non-admin saves
3. Dress code fields validated (colors must be valid hex)
4. Gift QR keys validated (max 2, R2 key ownership verified)
5. Package/feature gates applied if invitation is already purchased
6. ALLOWED_FIELDS whitelist applied — unknown fields silently ignored
7. Async R2 cleanup: keys removed from `galleryImages` or `giftQrCodes` are deleted from R2 storage
8. `rsvpDeadline` is parsed and stored as ISO string

### 9.4 Validation Rules (Server-side)
| Rule | Detail |
|------|--------|
| Ownership | `userId === session.userId` or `businessId === session.userId` or admin |
| After event date | Invitation is read-only; PATCH returns 403 |
| isPurchased | Package cannot be downgraded; gated features cannot be added beyond package |
| dresscodeColors | Each entry must be valid CSS hex |
| giftQrCodes | Max 2 entries; each must be a valid R2 key owned by this invitation |
| galleryImages | Capped at package limit |
| ALLOWED_FIELDS | Unknown top-level fields silently dropped |

### 9.5 Error Handling
| Scenario | Response |
|----------|----------|
| Not owner | 403 Forbidden |
| After event date | 403 Forbidden |
| Invalid hex color | 400 Bad Request |
| Invalid QR key | 400 Bad Request |
| Server error | 500 |

---

## 10. Module: Publish Invitation

"Publishing" in this system means **paying for a package**. There is no separate "publish" button that makes an invitation public — invitations are accessible via their token URL at any time. The payment activates the invitation and marks `isPurchased = true`.

### 10.1 User Journey
1. In editor or dashboard, user selects a package and clicks "Pay"
2. System creates a bill via ToyyibPay
3. User is redirected to ToyyibPay payment gateway
4. On payment success, invitation is marked `isPurchased = true`, `purchasedAt`, `purchasedPackageId` are set
5. User is redirected to `/payment/toyyibpay/return` → success screen → dashboard

See **Module 19** for the full payment flow.

---

## 11. Module: Public Invitation View

### 11.1 User Journey
1. Guest receives URL: `/invite/:dateCode/:slug` (SEO/share URL) or `/invite/:token` (direct token)
2. Lands on envelope animation (doors/envelope/window style)
3. Clicks "Open" button → envelope opens → invitation content revealed
4. Scrolls through: cover, couple names, countdown, event details, programme, gallery, parents, RSVP, wishes, gift/QR, registry, contact, location, social links
5. Can submit RSVP, leave a wish, view/reserve gift registry items

### 11.2 Frontend Components
- `InvitationPage.tsx` — route handler, loads invitation data
- `WeddingCard.tsx` — full rendered invitation
- `EnvelopeAnimation.tsx` / `EnvelopeDoors.tsx` — opening animation
- `DetailPanel.tsx` — tabbed detail panel (music/calendar/location/contact/gift)
- `WaxSeal.tsx` — decorative seal on envelope
- `RsvpModal.tsx` — RSVP submission form

### 11.3 Backend / API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/invitation/public/:dateCode/:slug` | Load by SEO URL |
| GET | `/api/invitation/:token` | Load by token |
| GET | `/api/rsvp` | Load RSVPs for this invitation |
| GET | `/api/rsvp/wishes` | Load wishes |
| GET | `/api/rsvp/count` | Load RSVP counts |
| GET | `/api/registry/:token` | Load gift registry items |
| POST | `/api/rsvp` | Submit RSVP (rate-limited) |

### 11.4 Database
- `invitation` — SELECT by token or (dateCode, slug)
- `rsvp` — SELECT by invitationToken
- `gift_registry_item` — SELECT by invitationToken

### 11.5 Expiry Logic
- If `invitation.eventDate` is more than **3 calendar months** in the past, the server returns **410 Gone**
- Demo tokens (`demo`, `demo-en`) are exempt from expiry
- Frontend receives 410 and redirects guest to `/` (home)

### 11.6 Sanitization
The public GET endpoint returns a **sanitized** invitation object that **omits**:
- `userId`, `businessId` (ownership)
- `lockPinHash`
- `isPurchased`, `purchasedAt`, `purchasedPackageId`
- Private RSVP management fields

### 11.7 Error Handling
| Scenario | Response |
|----------|----------|
| Token not found | 404 Not Found |
| Invitation expired | 410 Gone → frontend redirects to `/` |
| Server error | 500 |

---

## 12. Module: RSVP

### 12.1 User Journey (Guest — Submitting)
1. Guest opens public invitation, scrolls to RSVP section or clicks RSVP button
2. `RsvpModal` opens
3. Fills: full name, attendance (yes/no), number of guests, phone/email, optional message
4. Submit → POST `/api/rsvp`
5. Success confirmation shown inline

### 12.2 User Journey (Buyer — Managing)
1. Login → `/rsvp`
2. See list of own invitations
3. Select invitation → view RSVP list (attendees, not attending, counts, messages)
4. Copy public RSVP share link (`/rsvp-share/:token`)

### 12.3 User Journey (Public Share Page)
1. Anyone with `/rsvp-share/:token`
2. Sees: event summary tiles (attending/not attending/total), full RSVP respondent table
3. Can submit RSVP via modal

### 12.4 Frontend Components
- `RsvpModal.tsx` — form with react-hook-form validation
- `RsvpDashboardPage.tsx` — buyer management view
- `RsvpPublicPage.tsx` — public share page

### 12.5 Backend / API
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/rsvp` | rate-limited | Submit RSVP |
| GET | `/api/rsvp` | invitation token | Load RSVPs for invitation |
| GET | `/api/rsvp/wishes` | invitation token | Load wishes |
| GET | `/api/rsvp/count` | invitation token | RSVP counts |
| GET | `/api/rsvp/buyer` | session required | Buyer's invitation list for RSVP management |
| GET | `/api/rsvp/public/:token` | none | Public RSVP page data |

### 12.6 Database
- `rsvp` table — INSERT on submit, SELECT on read
- UNIQUE constraint `(invitationToken, name)` prevents duplicate RSVPs per guest name

### 12.7 Validation Rules
| Field | Rule |
|-------|------|
| name | required |
| attending | required (boolean) |
| numberOfGuests | min 1; capped by `rsvpMaxGuestsPerInvitation` |
| Total guests | capped by `rsvpMaxOverallGuests` |
| Deadline | submissions blocked after `rsvpDeadline` if set |
| Duplicate name | DB UNIQUE constraint → 409 Conflict |

### 12.8 Error Handling
- Duplicate name → 409
- RSVP disabled (`rsvpEnabled = false`) → 403
- Over guest limit → 400
- Rate limit → 429

---

## 13. Module: Wishes

Wishes are stored in the **RSVP table** — specifically the `message` field on RSVP records where the guest left a message. There is no separate wishes table.

### 13.1 User Journey
1. Guest submits RSVP with a message → message stored in `rsvp.message`
2. On public invitation, wishes display in a **responsive single-card swipe carousel** with arrows, dot indicators, and 6-second auto-advance
3. Empty state shown if no wishes yet

### 13.2 Backend / API
- `GET /api/rsvp/wishes` — returns RSVPs that have a non-null `message`, ordered by `createdAt`

### 13.3 Database
- `rsvp` — SELECT WHERE `message IS NOT NULL`

---

## 14. Module: Gift Fund / Money Gift

### 14.1 User Journey
1. Buyer (with Money Gift package feature) enables gift section in editor
2. Fills: recipient name, bank, account number, optional QR code images (max 2)
3. Guest opens public invitation → sees gift section with bank details and/or QR images
4. Guest makes payment externally (no in-app payment processing for gift fund)
5. Guest can see `DetailPanel` gift tab with bank/account info

### 14.2 Frontend Components
- Editor Gift tab (`EditorPage.tsx` lines 2730–2862)
- `WeddingCard.tsx` — gift section render
- `DetailPanel.tsx` — gift/QR tab

### 14.3 Backend / API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/gift-qr-upload` | Upload QR image to R2 |
| PATCH | `/api/invitation/:token` | Save `giftDisplay`, `giftRecipient`, `giftBankName`, `giftAccountNumber`, `giftQrCodes` |

### 14.4 Database
- `invitation` — fields: `giftDisplay`, `giftTitle`, `giftRecipient`, `giftBankName`, `giftAccountNumber`, `giftQrCodes` (JSONB array of R2 keys)

### 14.5 Validation
- Max 2 QR images (server-enforced)
- R2 key ownership verified server-side
- Upload disabled until invitation token exists

---

## 15. Module: Gift Registry

### 15.1 User Journey
1. Buyer (with Gift Registry feature) adds products in the Registry editor tab
2. Sets recipient name + delivery address
3. Adds up to 20 products with name, URL, notes, thumbnail
4. Guest opens public invitation → sees registry section
5. Guest can "reserve" an item (client-side reservation state — see Findings §23)
6. Buyer can view registry state in editor

### 15.2 Backend / API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/registry/:token` | Load items |
| POST | `/api/registry/:token` | Add item |
| PATCH | `/api/registry/:token/:id` | Edit item |
| DELETE | `/api/registry/:token/:id` | Delete item |
| POST | `/api/registry-thumbnail-upload` | Upload thumbnail to R2 |

### 15.3 Database
- `gift_registry_item` — full CRUD

### 15.4 Validation
- Name required per item
- Max 20 items (server-enforced)
- Feature gate on all endpoints (bypassed for `demo` and `demo-en` tokens)

---

## 16. Module: Location & Contact

### 16.1 Location
- Stored in `invitation`: `venueName`, `venueAddress`, `venueCity`, `venueState`, `venueMapUrl`, `venueWazeUrl`, `venueHijriDate`
- Public invitation shows venue details with **Google Maps** and **Waze** deep-link buttons
- `DetailPanel.tsx` Location tab renders map links
- No map embed — only external URL links

### 16.2 Contact
- Stored in `invitation.contacts` (JSONB array) and legacy `invitation.contactPhone`
- Public invitation shows contact list in detail panel
- WhatsApp deep-links generated from phone numbers in `DetailPanel.tsx`
- No phone format validation on server

---

## 17. Module: Countdown

- Countdown is computed **entirely client-side** in `WeddingCard.tsx`
- Source field: `invitation.eventDate` + `invitation.eventStartTime`
- `useState` + `useEffect` with a 1-second interval
- Displays: days, hours, minutes, seconds until event
- After event date: countdown shows zeroes or is hidden (exact behavior in component)

No backend involvement. No separate module or API.

---

## 18. Module: Subscription / Pricing

### 18.1 User Journey
1. Visitor views `/pricing` — public pricing page
2. Sees all active packages with names, prices, features listed
3. Can click "Choose" → routed to `/editor` (if logged in) or `/register` (if not)
4. In editor, DESIGN tab shows package selector with current prices
5. Admin manages packages via Admin Panel

### 18.2 Frontend Components
- `PriceListPage.tsx` — public pricing display
- `PricingTab.tsx` (admin) — package/feature CRUD

### 18.3 Backend / API
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/pricing` | none | Public package list with features |
| GET | `/api/admin/pricing` | admin | Admin package list |
| POST | `/api/admin/pricing` | admin | Create package |
| PATCH | `/api/admin/pricing/:id` | admin | Edit package |
| DELETE | `/api/admin/pricing/:id` | admin | Delete package |
| POST | `/api/admin/pricing/:id/features` | admin | Add feature to package |
| PATCH | `/api/admin/pricing/:id/features/:featureId` | admin | Edit feature |
| DELETE | `/api/admin/pricing/:id/features/:featureId` | admin | Delete feature |

### 18.4 Database
- `pricing_package` — SELECT (public), full CRUD (admin)
- `pricing_feature` — linked to package, drives `TAB_FEATURE_MAP` in editor

### 18.5 Package Immutability After Payment
- Once an invitation is paid (`isPurchased = true`), its `purchasedPackageId` is locked
- The package cannot be changed via PATCH
- Feature-gated content remains accessible even if the admin later deactivates a package

### 18.6 Promotion Pricing
- `pricing_package` has `promoPrice`, `promoStartDate`, `promoEndDate` columns
- **No server-side logic currently applies promo prices automatically during bill creation** (⚠️ see Findings §23 and existing task #54)

---

## 19. Module: Payment (ToyyibPay)

### 19.1 User Journey
1. User selects package in editor or dashboard, clicks "Pay"
2. `POST /api/payment/toyyibpay/create-bill` → bill created
3. User redirected to ToyyibPay checkout URL (sandbox: `dev.toyyibpay.com`, live: `toyyibpay.com`)
4. User completes payment on ToyyibPay
5. ToyyibPay fires **async callback** `POST /api/payment/toyyibpay/callback`
6. ToyyibPay redirects browser to `/payment/toyyibpay/return?orderReference=...&billCode=...`
7. Frontend calls `GET /api/payment/toyyibpay/return-status` — server-side re-verification
8. Status shown: PAID / PENDING / FAILED

### 19.2 Bill Creation Detail

**`POST /api/payment/toyyibpay/create-bill`**

Auth: `buyer` or `business_account` session required.

Steps:
1. Validate `invitationId` and `orderId` (if supplied)
2. Confirm ownership of invitation
3. Confirm invitation is NOT already purchased
4. Resolve pricing package
5. If existing PENDING order < 3 days old → attempt to reuse bill:
   - Query ToyyibPay transactions for existing billCode
   - If no status 1 (paid) or 3 (failed) found → reuse existing payment URL
6. If order is > 3 days old → mark EXPIRED, create new order
7. If no reusable order → INSERT new order (status: PENDING)
8. Call ToyyibPay `createBill` API
9. On success: save `billCode` + `billCodeCreatedAt` to order → return `{orderId, paymentUrl, billCode}`
10. On ToyyibPay API failure: mark order FAILED → return 502

**ToyyibPay bill payload:**
| Field | Value |
|-------|-------|
| billName | `Wedinbytes <package>` (max 30 chars) |
| billDescription | `<package> wedding invitation` (max 100 chars) |
| billAmount | package price in cents |
| billReturnUrl | `<domain>/payment/toyyibpay/return` |
| billCallbackUrl | `<domain>/api/payment/toyyibpay/callback` |
| billExternalReferenceNo | `WIB-<unique>` (order.paymentReference) |
| billExpiryDays | 3 |
| billPaymentChannel | 0 (all channels) |
| enableDuitNowQR | 1 (if DuitNow activated) |

### 19.3 Callback Detail

**`POST /api/payment/toyyibpay/callback`** (called by ToyyibPay server, not browser)

Steps:
1. Parse: `status`, `order_id`, `refno`, `hash`, `billcode`
2. Verify HMAC: `MD5(secretKey + status + order_id + refno + "ok")` must match `hash`
3. Find order by `paymentReference = order_id`
4. Call `verifyAndApplyOrder`:
   - Query ToyyibPay `getBillTransactions(billcode)`
   - Find transaction matching `paymentReference` and `amount`
   - Also check stored `billCode` if different from callback `billcode`
   - Map status: `1` → PAID, `3` → FAILED, else → PENDING
5. If PAID: UPDATE order `paymentStatus=PAID`, `paidAt=now()`, `gatewayRefNo`; UPDATE invitation `isPurchased=true`, `purchasedAt`, `purchasedPackageId`
6. Respond 200 (PAID/FAILED) or 202 (PENDING)

### 19.4 Return Status Detail

**`GET /api/payment/toyyibpay/return-status`**

- Requires auth + `orderReference` + `billCode` query params
- Finds order by `paymentReference`
- Verifies ownership
- Runs `verifyAndApplyOrder` (same as callback — server-side re-check, not trusting browser params)
- Returns `{status: "PAID"|"PENDING"|"FAILED", message}`

### 19.5 Frontend Return Page

`ToyyibPayReturnPage.tsx`:
- Calls `return-status` on mount
- PAID: shows success message → links to dashboard / payment history
- PENDING: shows pending message with retry/check option
- FAILED: shows failure message with retry from dashboard

### 19.6 Database
- `order` — INSERT (create-bill), UPDATE (callback/return-status)
- `invitation` — UPDATE `isPurchased`, `purchasedAt`, `purchasedPackageId` on PAID

### 19.7 Error Handling
| Scenario | Response |
|----------|----------|
| Already purchased | 400 |
| Invalid HMAC on callback | 400 |
| ToyyibPay API down | 502 (order marked FAILED) |
| Order not found | 404 |
| Ownership mismatch | 403 |

---

## 20. Module: User Profile & Billing

### 20.1 User Profile

**Page:** `/dashboard` (profile section) or `/business/profile`

**Fields editable:**
- Name (max 120 chars)
- Email (valid format, max 254 chars, must be unique)
- Password change (requires current password, min 6 chars)

**API:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/auth/me` | Load current user |
| PATCH | `/auth/profile` | Update name/email |
| POST | `/auth/change-password` | Change password |

**Business profile additionally:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/business/me` | Load business profile |
| PATCH | `/api/business/me` | Edit business profile fields |
| POST | `/api/business/me/logo` | Upload logo to R2 |

### 20.2 Billing / Payment History

**No subscription management.** Payments are one-time per invitation.

**Buyer history:** `GET /api/buyer/payment-history`
- Returns all orders linked to the buyer's `userId`
- Fields: orderId, package name, amount, status, paidAt, gatewayRefNo

**Business history:** `GET /api/business/payment-history`
- Returns all orders linked to invitations owned by this business account

**Receipt download:**
- Generated client-side as a PDF using browser-side PDF generation
- Not a server-issued document

**No features for:**
- Subscription management (cancel, upgrade, downgrade)
- Invoice download from server
- Refund initiation

---

## 21. Module: Admin Panel

### 21.1 Access
- Route: `/admin/login` → `/admin`
- Separate admin credential table (`admin` table)
- All admin API routes protected by `requireAdmin` middleware

### 21.2 Admin Sections

#### Dashboard / Revenue Stats
- `GET /api/admin/orders/stats`
- Shows: total revenue (PAID orders), order volume, customer count
- Revenue grouped by Malaysia payment month (`paidAt`)
- Order volume grouped by order creation month

#### Orders Management
- `GET /api/admin/orders` — all orders with buyer/invitation summary
- `GET /api/admin/orders/:id` — single order detail
- `PATCH /api/admin/orders/:id` — manually update order status
- Can override `paymentStatus`, mark as PAID/FAILED/PENDING
- Can update `invitationId`, `packageId` links

#### Customer / User Management
- `GET /api/admin/customers` — all users (buyers + business accounts)
- `PATCH /api/admin/users/:id/role` — change user role
- Can promote buyer to business_account and vice versa

#### Invitation Management
- `PATCH /api/admin/invitations/:id/status` — toggle invitation status
- Admin can activate/deactivate invitations

#### Pricing & Packages
- Full CRUD via `PricingTab.tsx`
- Create packages with `formConfig` JSONB for business order forms
- Add/reorder/delete features per package
- Set `promoPrice`, `promoStartDate`, `promoEndDate`
- `businessPrice` override for B2B pricing

#### Card Designs
- Upload design images (cardImageUrl, envelopeImageUrl, thumbnailImageUrl)
- Set default fonts, colors, animation style, overlay settings
- Activate a design (`isActive = true`) — only one active at a time
- Active design cascades as default template to all new invitations

#### Wax Seals
- Upload seal images to R2
- Create/edit/delete seal records
- Sort order management
- Seals appear in editor for buyers/businesses to choose

#### Reviews Moderation
- `GET /api/admin/reviews` — all pending/approved/rejected reviews
- `PATCH /api/admin/reviews/:id` — approve or reject
- `DELETE /api/admin/reviews/:id` — delete
- Only approved reviews appear on public `/reviews` page

#### Demo Editor
- Route: `/admin/demo`
- Full EditorPage with token `demo` (Malay) or `demo-en` (English)
- All tabs visible, all features unlocked
- Used to preview design changes live
- Footer tab visible (admin-only)

---

## 22. End-to-End Process Flow

```
VISITOR
│
│  Browses / (Landing Page)
│  Optionally views /weddingcards/home catalog
│  Optionally views /pricing
│
▼
REGISTER  (/register or /register/business)
│  POST /auth/register
│  Session created
│
▼
LOGIN (auto after register)  (/login)
│  POST /auth/login
│  Session cookie set
│
▼
DASHBOARD  (/dashboard or /business/dashboard)
│  GET /api/invitations-by-user/:userId
│  Sees empty invitation list
│
▼
SELECT DESIGN (optional)  (/weddingcards/home)
│  Browse catalog → select design
│  GET /api/cards, /api/design/active
│  Click "Choose Design" → /editor?new=1&designCode=...
│
▼
CREATE INVITATION  (/editor?new=1)
│  POST /api/invitation
│  Invitation row created with token
│  Editor loads with design template defaults
│
▼
EDIT INVITATION (multi-step, same page)
│
│  ┌─ DESIGN TAB
│  │  Select package, language, opening style
│  │  Customise fonts, colors
│  │  Add YouTube music URL
│  │
│  ├─ COVER TAB
│  │  Enter groom/bride names, initials
│  │  Upload logo (POST /api/upload)
│  │
│  ├─ INVITATION TEXT TAB
│  │  Rich text: greeting, parents, body text
│  │
│  ├─ DATE & LOCATION TAB
│  │  Event date/time, venue, map URLs
│  │
│  ├─ PROGRAMME TAB
│  │  Itinerary rows
│  │
│  ├─ DRESS CODE TAB
│  │  Theme text, up to 4 color swatches
│  │
│  ├─ GALLERY TAB  (Standard/Premium)
│  │  Upload up to 4 photos (POST /api/gallery-upload)
│  │
│  ├─ GIFT TAB  (Premium)
│  │  Bank details, up to 2 QR codes (POST /api/gift-qr-upload)
│  │
│  ├─ REGISTRY TAB  (Premium)
│  │  CRUD gift items (POST/PATCH/DELETE /api/registry/:token)
│  │
│  ├─ RSVP TAB  (Standard/Premium)
│  │  Toggle RSVP, set deadline, max guests
│  │
│  └─ CONTACT TAB  (Standard/Premium)
│     Add contact names and phone numbers
│
▼
SAVE DRAFT
│  PATCH /api/invitation/:token
│  All ALLOWED_FIELDS saved to DB
│  Async R2 cleanup for removed images
│
▼
PREVIEW
│  Open /invite/:token in new tab
│  GET /api/invitation/:token (public endpoint)
│  Full invitation renders with envelope animation
│
▼
PURCHASE PACKAGE / PAYMENT
│  Click "Pay" in editor or dashboard
│
│  POST /api/payment/toyyibpay/create-bill
│  ├─ Order created (status: PENDING)
│  └─ ToyyibPay bill created → paymentUrl returned
│
│  Browser redirected to ToyyibPay checkout
│  │
│  ├─ [User Pays]
│  │   ToyyibPay async callback → POST /api/payment/toyyibpay/callback
│  │   HMAC verified → verifyAndApplyOrder
│  │   Order → PAID, invitation.isPurchased = true
│  │
│  └─ [User Returns to App]
│      /payment/toyyibpay/return
│      GET /api/payment/toyyibpay/return-status
│      Server re-verifies with ToyyibPay API
│      PAID → success screen
│
▼
DASHBOARD (post-payment)
│  Invitation shows "Active" status
│  Public URL displayed
│  Package locked; content still editable
│
▼
SHARE INVITATION
│  Copy public URL: /invite/:dateCode/:slug
│  Copy RSVP link: /rsvp-share/:token
│
▼
GUEST ACCESS  (/invite/:dateCode/:slug)
│  GET /api/invitation/public/:dateCode/:slug
│  Expiry check (410 if > 3 months old)
│  Envelope animation plays
│  Guest opens invitation
│
▼
GUEST: RSVP
│  RsvpModal opens
│  Fill: name, attendance, guests, message
│  POST /api/rsvp (rate-limited)
│  UNIQUE(invitationToken, name) enforced
│  Success confirmation shown
│
▼
GUEST: WISHES
│  Message submitted with RSVP (rsvp.message)
│  Displayed in wishes carousel on invitation
│
▼
GUEST: GIFT FUND
│  Views bank details / QR code in DetailPanel
│  Makes external bank transfer (no in-app payment)
│
▼
GUEST: GIFT REGISTRY  (Premium)
│  GET /api/registry/:token → view items
│  POST /api/registry/:token → reserve item
│  ⚠️ Reservation is stored in DB but there is
│     no buyer-facing view of who reserved what
```

---

## 23. Findings: Missing Flows, Inconsistent Logic, Duplicated Functionality & Potential Bugs

This section documents only what was observed during analysis. **No code was changed.**

---

### 23.1 Missing Flows

#### MF-1: No Separate "Publish" / Visibility Toggle
The concept of "publishing" an invitation (making it visible to guests) does not exist as a distinct step. An invitation is accessible via its token URL even before payment. There is no "draft only" vs. "live" state beyond `isPurchased`. A guest who guesses or receives a token link to an unpaid invitation will see the full content.

#### MF-2: No Confirmation Email to Buyer After Payment
After a successful payment callback, the invitation is activated but no confirmation email is sent to the buyer. Email infrastructure for password reset exists, but payment confirmation email is absent. (This is an existing tracked task.)

#### MF-3: No Email to Guest After RSVP Submission
Guests submit RSVPs but receive no email confirmation of their attendance. This is a gap in the guest experience.

#### MF-4: No Buyer View of Gift Registry Reservations
Guests can "reserve" gift registry items (POST `/api/registry/:token` creates/updates an item), but the buyer has no UI to see which items have been reserved or by whom. The reservation state exists in the DB (likely via `sortOrder` mutation or a status field) but has no dedicated buyer-facing display.

#### MF-5: No Invitation Sharing / Direct Send from App
After payment, there is no in-app flow to send the invitation link to guests directly (WhatsApp, email, etc.). Users must manually copy and share the URL. (This is an existing tracked task.)

#### MF-6: Password Reset Has No Dedicated Route
`POST /auth/reset-password` exists on the server. The `ForgotPasswordPage.tsx` presumably handles the token in a query parameter, but there is no dedicated `/reset-password` route in `App.tsx`. The reset token flow is entirely contained within `ForgotPasswordPage.tsx` — this is functional but makes the URL less clear.

#### MF-7: No In-App Account Deletion
Users cannot delete their own accounts. No `DELETE /user/:id` or self-service account removal flow exists.

#### MF-8: `musicTitle` and `musicArtist` Have No Editor Controls
These fields exist in the DB schema, in `ALLOWED_FIELDS`, and in the save payload, but have no visible input fields in the DESIGN tab. Values can only be set via direct API call. This means the public invitation cannot display a "Now Playing: [Song Name] – [Artist]" attribution through normal user workflow.

#### MF-9: `rsvpFormNote` and `rsvpTimeSlots` Have No Editor Controls
Same situation as MF-8. Fields in schema and ALLOWED_FIELDS but no editor UI.

---

### 23.2 Inconsistent Logic

#### IL-1: Preview IS the Live URL
There is no draft-only preview mode. Clicking "Preview" in the editor opens the actual public token URL (`/invite/:token`). This means:
- An unpaid invitation is fully visible to anyone with the token
- There is no way to preview without technically "publishing" to token-holders

#### IL-2: `isPurchased` Is Not Required for Invitation Visibility
The public invitation view (`GET /api/invitation/:token` and `GET /api/invitation/public/:dateCode/:slug`) does not check `isPurchased`. Unpaid invitations are fully accessible to anyone with the token or URL.

#### IL-3: DELETE Invitation Rejects Admin
The DELETE invitation handler has a condition that rejects the request if the user role is `admin` OR if they cannot manage the invitation. This means **admin cannot delete invitations** via the API, despite admin having override authority on other endpoints. This appears to be an accidental inversion.

#### IL-4: Promotion Pricing Not Applied at Bill Creation
`pricing_package` has `promoPrice`, `promoStartDate`, `promoEndDate` fields. The bill creation flow reads the package price from `pricing_package.price` (the base price) and does not check whether a promotion is active at the time of payment. Buyers always pay the base price even during a promotional period. (This is an existing tracked task.)

#### IL-5: `businessPrice` Not Applied for Business Accounts
Similarly, `pricing_package.businessPrice` exists as a B2B price override, but it is unclear from the bill creation flow whether it is used when a `business_account` user initiates payment, or whether the standard `price` is always used.

#### IL-6: Design Code Is Not Validated Against Existing Designs on Save
`PATCH /invitation/:token` accepts any string value for `designCode`. There is no server-side check that the provided `designCode` corresponds to an actual `card_design` record. An invalid or deleted `designCode` would silently render with missing design assets on the public invitation.

#### IL-7: `eventDay` Is Stored, Not Derived
`invitation.eventDay` (e.g., "Saturday") is stored as a writable field and is included in ALLOWED_FIELDS. The editor auto-derives it from the date + language client-side, but it can be overwritten via direct API call, creating a mismatch between `eventDate` and `eventDay`.

#### IL-8: `rsvp.invitationToken` Defaults to `'unknown'`
The `rsvp` table has `invitationToken NOT NULL DEFAULT 'unknown'`. This means if an RSVP is ever inserted without a proper token (e.g., a bug in the insert path), it silently stores under the token `'unknown'` rather than failing. A query on `invitationToken = 'unknown'` could return unexpected results.

#### IL-9: `order.amount` Stored as Text, Not Numeric
Payment amount is stored as type `text` in the `order` table (e.g., `"150"` not `150`). Revenue calculations in the admin stats route must perform string-to-number casting. Inconsistent formatting (e.g., `"150.00"` vs `"150"`) could affect aggregation accuracy.

#### IL-10: No Constraints on `order.userId` or `order.invitationId`
Both are nullable with no foreign-key constraints. An order can exist with no user or no invitation. The bill creation flow requires both, but manual admin order edits can set these to null.

---

### 23.3 Duplicated Functionality

#### DF-1: Two Separate Public Invitation Routes
- `GET /api/invitation/:token` — by internal token
- `GET /api/invitation/public/:dateCode/:slug` — by SEO URL

Both return the same sanitized invitation object. The frontend uses the token route for preview (from editor) and the dateCode/slug route for public sharing. The same sanitization and expiry logic is duplicated in both handlers.

#### DF-2: `groomName`/`brideName` Appear in Both Cover and Invitation Text Tabs
Both tabs in the editor show full name fields for groom and bride. They are the same state fields — editing in one tab updates the other. This is functional but could confuse users who see the same field in two places with different labels.

#### DF-3: `contactPhone` (Legacy) and `contacts[]` (Current)
Both `contactPhone` (single string) and `contacts` (JSONB array of `{name, phone}`) are stored in the invitation. The editor UI only shows the repeatable contacts array. `contactPhone` is still included in ALLOWED_FIELDS and saved. The public invitation likely reads one or both. This is a legacy dual-field situation.

#### DF-4: `schedule` and `itinerary` Both Exist
`invitation` has both `itinerary` (JSONB) and `schedule` (JSONB). The editor only uses `itinerary`. `schedule` is in ALLOWED_FIELDS. Both are sent to the public view. The distinction between these two fields is unclear.

#### DF-5: Two Admin Editor Routes
- `/admin/demo` — primary admin demo editor (uses token `demo` / `demo-en`)
- `/admin/editor` — redirects to `/admin/demo`

The redirect is clean but the existence of both routes could cause confusion.

#### DF-6: `/invite/:token` Used for Both Preview and Lockable Guest Access
The same route serves both the owner's preview (before payment) and a guest-shared protected invitation (after payment with optional PIN lock). There is no visual or behavioral distinction in the URL itself.

---

### 23.4 Potential Bugs

#### PB-1: Race Condition on Double Payment (PENDING → PAID)
If a buyer clicks "Pay" twice in quick succession, two `create-bill` calls could both check "no existing PENDING order" at the same moment and insert two PENDING orders. No DB-level locking or transaction isolation is documented for this path. (Related to existing tracked task.)

#### PB-2: Callback Before Return — Invitation May Appear Unpaid on Return
If the ToyyibPay async callback fires and marks the order PAID before the user's browser reaches the return URL, the return-status call should see PAID. However, if the callback is delayed (common in async systems), the return-status check runs `verifyAndApplyOrder` independently — this is a correct mitigation. But if ToyyibPay's transaction API itself is slow, `return-status` may return PENDING even though payment succeeded, leading the user to believe their payment failed. (Related to existing tracked task.)

#### PB-3: R2 Images Lost If PATCH Partially Fails
When saving an invitation with new gallery images, the R2 upload happens first (separate call), then the token is added to `galleryImages`, then PATCH is called. If PATCH fails, the R2 object exists but is never referenced. There is no cleanup mechanism for "orphaned" R2 uploads.

#### PB-4: Gift Registry Thumbnail Upload Returns Before Invitation Save
The thumbnail upload for registry items (`POST /api/registry-thumbnail-upload`) stores to R2 independently. If the user then closes the editor without saving the registry item that references this thumbnail, the R2 object is orphaned.

#### PB-5: RSVP Unique Constraint Allows Bypass via Name Variation
The DB UNIQUE constraint is `(invitationToken, name)`. A guest can RSVP multiple times by using slightly different name variations (e.g., "Ali" vs "Ali bin Ahmad"). There is no fuzzy deduplication.

#### PB-6: `resetUrl` Returned in Non-Production Response
`POST /auth/forgot-password` returns the reset URL in the response body when not in production. If the staging/development environment is publicly accessible, an attacker who triggers a password reset for any user can immediately use the returned URL to take over the account.

#### PB-7: Admin Delete Invitation Is Blocked
As noted in IL-3, the DELETE invitation route has logic that blocks admin users from deleting invitations. This is likely unintentional and means admin has no API-level way to delete invitation records.

#### PB-8: `card` Table Has No Relation to `card_design`
The `card` catalog table (uploaded design assets) and the `card_design` table (active design templates) are separate with no declared relationship. A design asset uploaded to `card` may not correspond to any active `card_design`, and vice versa. Admin UI manages both separately.

#### PB-9: `gift_registry_item.createdAt` Defaults to `null`
Despite being a `timestamp` type column, `createdAt` in `gift_registry_item` has no `DEFAULT now()` — it defaults to `null`. New items inserted without explicitly providing `createdAt` will have a null timestamp, breaking any sort-by-creation-date logic.

#### PB-10: No Server-Side YouTube URL Validation
The `musicUrl` field accepts any string. A non-YouTube or malformed URL will be saved and rendered in an iframe on the public invitation, potentially loading unexpected content or throwing a broken-iframe error.

#### PB-11: Business Account Registration Does Not Verify Business Identity
Any user can register as a `business_account` by POSTing `accountType: "business_account"` to `/auth/register`. There is no verification, approval step, or admin review. The `isVerified` field on `business_profile` exists but is not set during registration — a business must be manually verified by admin to appear in the homepage collaboration carousel.

---

*End of WedInBytes Process Flow Document — v1.0*
