# WedInBytes — System Functionality and Logic

## 1. Purpose of this document

This document explains the current WedInBytes wedding e-invitation system:

- who can use the system;
- what each user type can do;
- which pages and URLs exist;
- how invitation editing, saving, previewing, publishing, locking, RSVP and artwork uploads work;
- how admin-managed designs differ from buyer-owned invitation data;
- which features are fully implemented and which are still placeholders.

This document describes the behavior currently implemented in the codebase. It is not a product roadmap and should not be used to assume that a visible button is connected to a completed backend feature.

---

## 2. Product overview

WedInBytes is a Malaysian wedding e-invitation platform. The normal flow is:

1. A buyer registers or logs in.
2. The buyer creates one or more invitation cards.
3. The buyer edits the content, design overrides and invitation settings.
4. The buyer previews the envelope and invitation.
5. The buyer shares the invitation URL with guests.
6. Guests open the public invitation and submit RSVP responses if RSVP is enabled.
7. Admin manages catalogue designs, pricing, customers, orders, invitation status, reviews and the demo invitation.

The system keeps shared catalogue designs separate from buyer invitation data. A buyer's changes are stored on that buyer's invitation and do not overwrite the global design template.

---

## 3. User types and permissions

### 3.1 Guest / public visitor

A guest does not need an account. A guest can:

- view the marketing pages;
- browse wedding card catalogue entries;
- open a public invitation using its token URL or readable public URL;
- enter a four-digit PIN if the invitation owner protected the invitation;
- open the envelope by clicking the central circular badge;
- view the invitation's cover and long details page;
- play or mute invitation music when configured;
- view programme, prayer, location, gallery, contact, countdown and other published sections;
- submit an RSVP when the owner has enabled RSVP and the submission satisfies all invitation limits;
- leave a message/wish through the RSVP form when that field is available;
- view approved public reviews;
- submit a review, which enters `pending` status for admin moderation.

A guest cannot:

- edit an invitation;
- upload a logo or initials artwork;
- view the buyer dashboard;
- manage pricing, designs, customers or orders;
- view unapproved reviews;
- bypass an invitation PIN.

### 3.2 Buyer

A buyer is a registered user whose account role is `buyer`.

A buyer can:

- register and log in;
- own multiple invitation cards;
- create a new invitation;
- edit only invitations belonging to the buyer;
- edit invitation content and buyer-specific design overrides;
- upload a transparent PNG logo/initial artwork before an order exists;
- adjust logo scale;
- remove the logo and return to text initials;
- adjust text initials size;
- save invitation changes;
- preview the card;
- copy and share an invitation link;
- open their invitation;
- view their invitation's RSVP dashboard;
- protect an invitation with a four-digit PIN;
- remove the PIN lock;
- log out.

The buyer's saved changes are invitation-specific. They do not modify the shared `card_design` catalogue record.

The following buyer UI actions exist but are not fully connected to a payment/QR implementation:

- `PAY NOW` currently displays “Payment coming soon!”;
- `QR` currently displays “Coming soon!”.

### 3.3 Admin

An admin is a user whose session role is `admin`. Admin access is established by the admin login flow and checked by admin-only backend routes.

An admin can:

- log in through the admin login page;
- manage shared card designs;
- upload card/envelope design artwork to R2;
- create, edit, activate and delete catalogue designs;
- manage raw card records;
- manage the demo invitation and admin editor;
- manage pricing packages and package features;
- review customer accounts and owned websites;
- view and filter orders;
- view order statistics and revenue totals;
- change an invitation website status between `ACTIVE` and `DISABLED`;
- moderate reviews by approving, rejecting or returning them to pending;
- delete reviews;
- manage central footer branding through the admin/demo invitation.

Admin-only server checks are enforced on pricing, order, review, catalogue design and raw-card administration routes. Buyer invitation mutations are checked against the owning session user, while admin sessions can manage catalogue and invitation administration.

---

## 4. Frontend routes

The frontend uses Wouter routing.

| Route | Purpose | Access |
|---|---|---|
| `/` | Marketing home page | Public |
| `/invite` | Invitation landing/token lookup page | Public |
| `/weddingcards/home` | Card catalogue | Public |
| `/weddingcards/home/:slug` | Card catalogue detail page | Public |
| `/pricing` | Public pricing page | Public |
| `/faq` | Frequently asked questions | Public |
| `/reviews` | Approved reviews and review submission | Public |
| `/page-2-design-guide` | Page 2 design guide/reference | Public |
| `/invite/:token` | Invitation opened by internal token | Public |
| `/invite/:dateCode/:slug` | Human-readable public invitation URL | Public |
| `/register` | Buyer registration | Public |
| `/login` | Buyer login | Public |
| `/dashboard` | Buyer's cards, links, RSVP and profile | Buyer |
| `/editor` | Buyer invitation editor | Buyer |
| `/rsvp` | Buyer's RSVP dashboard | Buyer |
| `/planner/dashboard` | Assigned invitations, planner statistics and profile shortcut | Event Planner |
| `/planner/profile` | Event Planner public profile editor | Event Planner |
| `/planner/:slug` | Public Event Planner profile | Public |
| `/admin/login` | Admin login | Public entry point |
| `/admin` | Admin management dashboard | Admin |
| `/admin/editor` | Admin editor | Admin |
| `/admin/demo` | Demo invitation editor | Admin/demo |

If a route is not matched, the app renders the not-found page.

---

## 5. Authentication and sessions

### Registration

`POST /api/auth/register`:

1. Requires email, password and name.
2. Requires a password of at least six characters.
3. Normalizes the email to lowercase.
4. Rejects an existing email.
5. Hashes the password with bcrypt.
6. Creates the user with role `buyer`.
7. Stores `userId` and `role` in the server session.

### Buyer login

`POST /api/auth/login`:

1. Looks up the lowercase email.
2. Compares the password with the stored bcrypt hash.
3. Stores `userId` and `role` in the session.
4. Returns basic user information.

### Admin login

`POST /api/auth/admin-login`:

1. Reads an admin user.
2. Compares the submitted password with the admin bcrypt hash.
3. Stores the admin's `userId` and `role` in the session.

The admin login page is separate from buyer login, but both use the same session mechanism.

### Current user and logout

- `GET /api/auth/me` returns the logged-in user or `401`.
- `POST /api/auth/logout` destroys the session.

The session is backed by PostgreSQL using `express-session` and `connect-pg-simple`.

### Event Planner role

Public registration always creates a `buyer` account. An admin promotes an existing non-admin account from the Admin **Customers** section; the allowed account roles are `buyer` and `event_planner`. The admin-only endpoint is `PATCH /api/admin/users/:id/role`.

Event Planner accounts can:

- edit their own planner profile through `GET/PATCH /api/planner/me`;
- view only invitations assigned to their planner profile through `GET /api/planner/invitations`;
- appear in active planner search and on a public `/planner/:slug` page.

They cannot become invitation owners, delete invitations, or assign/remove planners.

---

## 6. Invitation ownership and lifecycle

### Creating an invitation

`POST /api/invitation` requires a logged-in buyer.

The server:

1. creates a random 16-character token;
2. assigns the current session user as `userId`;
3. applies defaults for basic wedding fields;
4. stores optional package, itinerary and RSVP settings;
5. returns the new invitation.

Each create request intentionally creates a separate invitation. One buyer can own multiple cards.

### Listing a buyer's invitations

`GET /api/invitations-by-user/:userId`:

- requires a session;
- requires the path `userId` to equal the session `userId`;
- returns only invitations owned by that buyer;
- returns the invitations ordered by creation time.

This endpoint prevents a buyer from listing another user's cards by changing the URL parameter.

### Reading an invitation

`GET /api/invitation/:token` returns the invitation by its internal token.

The public response:

- removes `lockPinHash`;
- exposes `isLocked` as a boolean;
- includes buyer invitation fields;
- includes the invitation-owned logo key;
- applies central demo footer branding to non-demo invitations.

### Public readable URL

`GET /api/invitation/public/:dateCode/:slug` searches invitations by:

- a date code derived from `eventDate`;
- a slug derived primarily from groom and bride short names;
- a legacy slug derived from names/initials for compatibility.

The response includes the internal token so the frontend can fetch the same invitation record for rendering.

### Updating an invitation

`PATCH /api/invitation/:token`:

1. accepts only fields listed in `ALLOWED_FIELDS`;
2. ignores unknown fields;
3. limits `galleryImages` to four entries;
4. converts a valid RSVP deadline string into a `Date`;
5. updates the invitation record;
6. returns the updated public-safe invitation.

Important: the route currently checks that the invitation exists, but the general PATCH route does not enforce buyer ownership before updating. The editor UI is separated by mode, but this endpoint should receive an ownership/admin authorization hardening pass before production use.

### Invitation lock

`POST /api/invitation/:token/lock`:

- requires the invitation owner;
- accepts `protect: true|false`;
- when enabling protection, requires exactly four digits;
- stores a bcrypt hash of the PIN;
- never returns the raw PIN.

`POST /api/invitation/:token/unlock`:

- accepts exactly four digits;
- compares the submitted PIN with the stored hash;
- returns `{ unlocked: true }` on success.

The frontend blocks the invitation UI behind a PIN screen while `isLocked` is true and the current browser has not successfully unlocked it.

---

## 7. Buyer editor logic

The buyer editor is the main invitation preparation workspace.

### Editor data model

The editor keeps two conceptual groups of state:

1. **Invitation content**
   - couple names and initials;
   - cover title and date text;
   - invitation wording and prayer;
   - event date, time, venue and map;
   - parents, contacts and dress code;
   - programme/itinerary;
   - gallery;
   - RSVP settings;
   - logo/initials settings.

2. **Buyer design overrides**
   - selected design code;
   - colors;
   - fonts;
   - name sizes and colors;
   - opening animation;
   - music;
   - card width.

The editor loads a catalogue template as the base and then applies the buyer's invitation overrides on top.

### Editor tabs

The editor organizes fields into:

- Design;
- Muka Depan/Cover;
- Invitation Text;
- Date & Location;
- Programme;
- Prayer;
- Countdown;
- Gallery;
- RSVP;
- Wishes/guestbook-related settings and content areas.

These tabs are an editing organization mechanism. The published card itself has two main visual pages:

1. the cover/opening experience;
2. one long, scrollable details page.

### Save logic

When the buyer presses Save:

1. the editor ensures there is an invitation token, creating an invitation when the flow is creating a new card;
2. it builds one invitation PATCH payload;
3. optional blank fields are sent as `null` where the field should be cleared;
4. the selected design and buyer overrides are stored on the invitation;
5. the global catalogue design is not overwritten;
6. logo URL, logo scale and text initials size are sent together;
7. the API returns the updated record;
8. the editor reloads the data so the saved server state replaces local state.

The logo scale is stored in `initials_image_scale` and clamped to 50–140 on save. The text initials size is stored in `envelope_initials_size` and defaults to 24px when blank/invalid.

### Preview behavior

The editor preview is interactive. It can open the envelope and reveal the card behind it.

For an unpaid invitation, the preview watermark is shown only after the preview has been opened. The watermark is a horizontal translucent `PREVIEW` band.

### Design isolation

Buyer changes are written to the invitation table. Shared `card_design` rows are catalogue data controlled by admin. This prevents one buyer's colors, fonts, logo or content from leaking into another buyer's invitation or into the demo.

---

## 8. Envelope and cover logic

The app supports two opening animation variants:

### Doors animation

`EnvelopeDoors`:

- shows left and right frosted door panels;
- rotates the panels outward when opened;
- shows a central white circular badge;
- makes the central circle clickable;
- pulses the circle while idle;
- hides the circle after opening;
- reveals the invitation content behind the doors.

### Envelope flap animation

`EnvelopeAnimation`:

- shows a rectangular envelope body;
- animates the top flap;
- shows a central white circular badge;
- makes the central circle clickable;
- pulses the circle while idle;
- starts the envelope opening sequence when clicked;
- then calls the parent `onOpen` callback.

There is no separate `BUKA` button. The circle is the only open trigger.

### Text initials fallback

If no logo exists:

- the white circle remains visible;
- `envelopeInitials` is rendered inside it;
- `envelopeInitialsSize` controls its text size;
- the editor exposes an Initial cover size slider from 12px to 48px.

### Logo precedence

If `initialsImageUrl` exists:

- the logo is rendered inside the circle;
- the logo is scaled using `initialsImageScale`;
- the text initials are not rendered.

If the logo is removed:

- the local editor state clears the URL;
- Save sends `initialsImageUrl: null`;
- after reload, the text initials fallback is used again.

### Logo scale

The editor's logo scale slider ranges from 50% to 140%.

- 100% is the default;
- lower values shrink the logo inside its image area;
- higher values enlarge it;
- the value is saved on the invitation;
- the same value is used in editor preview and public invitation.

---

## 9. Buyer logo/initial artwork logic

### Upload UI

The buyer sees **Upload your logo** in the Cover section.

The file requirements are:

- PNG only;
- transparent background required;
- the PNG must contain an alpha channel;
- maximum size is 2 MB.

The UI rejects non-PNG files before sending them to the API.

### Upload API

The frontend sends:

`POST /api/order-initials-upload`

with:

- multipart field `file`;
- multipart field `invitationToken`;
- session credentials.

Despite the legacy route name, the current behavior does **not** require an order. The asset belongs to the invitation.

The server:

1. verifies R2 is configured;
2. verifies a file exists;
3. verifies the invitation token exists;
4. verifies the current user owns that invitation;
5. verifies MIME type `image/png`;
6. checks the PNG signature and IHDR color type for an alpha channel;
7. uploads to `initials/{invitationToken}/initials.png`;
8. saves the R2 key in `invitation.initials_image_url`;
9. returns the invitation ID and key.

This prevents a buyer from attaching artwork to another buyer's invitation and prevents opaque artwork from being accepted as “transparent.”

### Remove logo

The **Remove logo** button only clears the invitation field in the editor until Save is pressed. On Save, the editor sends a null logo URL and the public invitation no longer renders that uploaded logo.

Invitation Save removes replaced gallery and initials objects from R2 after the database update, using only invitation-owned storage prefixes. Deterministic replacement uploads reuse the active object key.

---

## 10. Public invitation logic

The public invitation page:

1. resolves the internal token directly, or resolves a readable date/slug URL into a token;
2. loads the invitation;
3. loads catalogue designs;
4. applies invitation color overrides over the matched template;
5. resolves envelope/card image keys through the R2 URL helper;
6. loads public RSVP counts and the limited public wishes feed; full RSVP rows remain owner/admin-only;
7. checks invitation lock status;
8. renders the envelope;
9. after opening, renders the long invitation details page.

### Published content

The long page combines:

- invitation text;
- date and time;
- venue and map;
- programme;
- prayer;
- countdown;
- RSVP;
- wishes/guestbook messages;
- contact;
- gallery;
- footer branding.

### Language

The invitation `language` controls built-in card labels and default copy. User-entered content is kept as entered. The editor interface itself remains in English even when the published card uses Malay or English labels.

### Music

Music is resolved from invitation overrides, then design/template defaults.

- Direct audio URLs are played through an `Audio` object after opening.
- YouTube URLs are detected and rendered through a hidden autoplay iframe.
- The public card has mute state handling.

### Replay

Replay resets:

- opened state;
- active detail tab;
- mute state;
- audio;
- envelope animation key.

---

## 11. RSVP and wishes logic

### Enabling RSVP

A buyer/admin can configure:

- RSVP enabled/disabled;
- introduction text;
- form note;
- deadline;
- maximum total guests;
- maximum guests per response;
- optional time slots.

### Submitting RSVP

`POST /api/rsvp` validates and enforces:

1. invitation token exists;
2. RSVP is enabled;
3. deadline has not passed;
4. attending responses do not exceed the per-invitation guest maximum;
5. selected time slot is one of the configured slots, if slots exist;
6. total attending guests do not exceed the invitation-wide maximum;
7. the same guest name is upserted rather than duplicated.

The uniqueness rule is `(invitationToken, name)`. Submitting the same name again updates the existing RSVP.

### Guest limit calculation

When updating an existing guest:

1. current total guests are read;
2. the guest's previous attending count is subtracted;
3. the new attending count is added;
4. the result is compared with `rsvpMaxOverallGuests`.

This avoids rejecting a guest who is editing their own response without increasing the actual total.

### RSVP reads

- `GET /api/rsvp?invitationToken=...` lists responses for a card and is restricted to its owner/admin.
- `GET /api/rsvp/count?invitationToken=...` returns attending count, not-attending count and total guests.
- `GET /api/rsvp/wishes?invitationToken=...` returns only non-empty guest names, messages and timestamps for the public guestbook.
- `GET /api/rsvp/buyer` returns all cards owned by the logged-in buyer with each card's responses.

The invitation page uses the dedicated public wishes feed. Attendance, guest counts and time slots are not exposed through that feed.

---

## 12. Orders, payments and website status

### Order data

An order stores:

- buyer ID;
- invitation ID;
- package ID;
- payment status;
- payment reference and gateway;
- amount;
- payment timestamps;
- update timestamp.

The order table still has a legacy `initialsImageUrl` field from an earlier design. The current buyer logo flow stores the active logo on the invitation, not on the order.

### Website status logic

The admin order view derives invitation status as:

```text
if invitation does not exist:
  DISABLED
else if invitation.websiteStatus is not ACTIVE:
  use invitation.websiteStatus
else if invitation.isPurchased is true:
  ACTIVE
else:
  PREVIEW
```

Therefore:

- an unpaid invitation is normally `PREVIEW`;
- a purchased invitation with an active website status is `ACTIVE`;
- an admin-disabled invitation remains `DISABLED`;
- a missing invitation is also treated as `DISABLED`.

### Current payment limitation

The buyer dashboard displays a `PAY NOW` action for unpaid cards, but the current implementation only shows a “Payment coming soon!” toast. No payment gateway checkout is currently completed in this codebase.

Admin order pages can read order records and payment statuses that exist in the database, but the payment creation/confirmation flow is not represented by a completed buyer checkout in the current UI.

### Admin order functions

Admin endpoints support:

- listing orders;
- searching by order ID, customer name, email or payment reference;
- filtering by payment status;
- filtering by invitation website status;
- reading order statistics;
- reading one order;
- listing customers with order totals and owned websites;
- setting an invitation to `ACTIVE` or `DISABLED`.

---

## 13. Designs and catalogue management

### Design template data

A shared design can contain:

- design name and code;
- active flag;
- envelope artwork;
- card artwork;
- music;
- primary/secondary/accent/background/card colors;
- heading/body/name fonts;
- name sizes and color;
- card max width;
- opening animation;
- legacy open button text.

The open button text remains in the data model for backward compatibility but is no longer rendered in the envelope UI. The central circle is now the open interaction.

### Public design reads

- `GET /api/design/active` returns the active design.
- `GET /api/design` returns all designs.

### Admin design operations

- `POST /api/design` creates a design and generates a design code when missing.
- `PATCH /api/design/:id` updates allowed design fields.
- `POST /api/design/:id/activate` makes one design active and clears the active flag from all others.
- `DELETE /api/design/:id` deletes a design.

### Design artwork upload

`POST /api/upload` accepts:

- JPEG, PNG, WebP or GIF;
- maximum 20 MB;
- design code;
- asset type `card` or `envelope`.

The R2 object key is deterministic:

```text
wed_card_design/{DESIGN_CODE}-{card|envelope}.{extension}
```

This allows the design record to refer to durable storage rather than the API container filesystem.

### R2 image serving

When a stored value is an R2 object key, the frontend resolves it through the same-origin `/api/r2` proxy unless a public R2 domain is configured.

`GET /api/r2?key=...`:

- rejects empty, absolute or path traversal keys;
- downloads from R2;
- returns the original content type;
- applies a public one-hour cache header.

---

## 14. Pricing and review logic

### Public pricing

`GET /api/pricing` returns active pricing packages with their features ordered by package and feature sort order.

### Admin pricing

Admin can:

- list all pricing packages;
- create packages;
- edit package details;
- delete packages and their features;
- add package features;
- edit package features;
- delete package features.

Package deletion first deletes its features and then the package.

### Reviews

Public users can:

- read approved reviews and average rating;
- submit a review with name, integer rating 1–5, review text and optional wedding date.

New reviews are always `pending`.

Admin can:

- list all reviews;
- filter by `pending`, `approved` or `rejected`;
- update review status;
- delete a review.

Only approved reviews appear in the public reviews response.

---

## 15. Admin dashboard sections

The admin page organizes management into:

- **Designs** — shared catalogue design records and activation;
- **Raw Card** — raw uploaded card assets/records;
- **Reviews** — review moderation;
- **Demo** — demo invitation content;
- **Editor** — admin-side invitation editor;
- **Pricing** — packages and features;
- **Orders** — order list, filters and details;
- **Customers** — buyer accounts and their websites.

Admin/demo changes are separate from normal buyer editing. The demo invitation is seeded with token `demo` and must not be assigned to a real buyer.

---

## 16. Database model summary

### `user`

Stores account identity, password hash, name and role.

Important roles:

- `buyer`;
- `event_planner`;
- `admin`.

### `invitation`

Stores the complete buyer-owned card:

- ownership and token;
- purchase/website status;
- wedding content;
- cover initials and size;
- invitation-owned logo URL;
- logo scale;
- gallery;
- RSVP settings;
- design overrides;
- music;
- footer/branding fields;
- nullable `eventPlannerId` collaboration reference;
- optional lock hash.

### `event_planner_profile`

Stores the public business profile for an Event Planner. The profile is linked one-to-one to a user account and contains company identity, slug, contact/social links, branding URLs, address, hours, verification and active flags.

Buyer and Admin sessions may assign or remove an active planner from an invitation. The Buyer remains the invitation owner. Public invitation responses expose only safe planner profile fields and never expose planner user IDs.

### `card_design`

Stores shared admin-managed catalogue templates.

### `order`

Stores purchase/order and payment metadata.

### `rsvp`

Stores one response per invitation token and guest name.

### `pricing_package` and `pricing_feature`

Store public/admin pricing data.

### `review`

Stores public submissions and moderation status.

### session storage

Stores Express sessions in PostgreSQL.

---

## 17. Security and ownership rules currently implemented

Implemented:

- passwords are bcrypt hashed;
- session identity is stored server-side;
- buyer invitation listing checks session ownership;
- logo and gallery uploads check invitation ownership;
- invitation lock PINs are bcrypt hashed;
- lock PIN hash is omitted from invitation responses;
- RSVP submissions validate invitation and configured limits;
- admin order/pricing/review/design/raw-card routes have admin guards;
- R2 proxy rejects path traversal-style keys and only serves application-owned prefixes;
- login, registration, admin login, PIN unlock, RSVP and review submissions are rate limited;
- successful authentication regenerates the session ID;
- uploaded image signatures and dimensions are validated server-side;
- public invitations omit ownership and lock-hash fields; full RSVP rows are owner/admin-only.

Important hardening items:

1. The old `/api/order-initials-upload` route name and legacy order artwork column remain for backward compatibility.
2. Readable public URLs still select the first matching invitation when duplicate names and dates collide.
3. R2 cleanup is asynchronous after Save; a failed object deletion is logged and can require operational retry.

---

## 18. Current limitations and placeholders

The following are visible or represented in the current product but are not fully implemented:

- payment checkout (`PAY NOW`);
- QR generation (`QR`);
- some catalogue/navigation items marked “Coming soon”;
- legacy public slug collisions remain possible for duplicate names and dates;
- legacy open button text fields remain in database/API but are no longer shown or rendered;
- old order initials field remains for compatibility but is not the active logo storage location.

---

## 19. Recommended operational rules

For support/admin users:

1. Treat each invitation token as a separate card and ownership boundary.
2. Do not edit `card_design` to fix one buyer's invitation; edit the buyer invitation instead.
3. Use the admin/demo invitation for central footer branding.
4. Use `ACTIVE`/`DISABLED` status to control website availability.
5. Treat `PREVIEW` as the normal unpaid state.
6. Ask buyers to upload a transparent PNG under 2 MB for the cover logo.
7. Tell buyers to press Save after changing logo scale, initials size or removing the logo.
8. If a guest cannot see an uploaded image, check the invitation key, R2 configuration and `/api/r2` response.
9. For RSVP capacity issues, check both per-response and total guest limits, plus the deadline and configured time slots.

For developers:

1. Add every new invitation field to the Drizzle schema and `ALLOWED_FIELDS`.
2. Rebuild DB declarations after schema changes.
3. Keep buyer overrides on `invitation`, not `card_design`.
4. Keep public invitation responses free of lock hashes and secrets.
5. Use relative API paths in frontend code.
6. Restart the API workflow after schema or API route changes.

---

## 20. Quick end-to-end examples

### Buyer creates and publishes a card

```text
Register → Login → Dashboard → Create New Card
→ Edit cover/content/design → Save
→ Optionally upload transparent PNG logo
→ Adjust logo scale or initials size → Save
→ Copy invitation link → Share with guests
```

### Buyer removes a logo

```text
Open editor → Cover → Remove logo
→ Enter/confirm Cover Initials
→ Adjust Initial cover size
→ Save
→ Reload/public invitation shows text initials instead of logo
```

### Guest submits RSVP

```text
Open shared invitation link
→ Enter PIN if protected
→ Click central circle to open envelope
→ Open RSVP section
→ Submit name, attendance, guest count, slot and message
→ Server validates deadline, slots and capacity
→ Response is inserted or updated by invitation + name
```

### Admin publishes a design

```text
Admin login → Admin → Designs
→ Create or edit design
→ Upload card/envelope artwork
→ Save design
→ Activate one design
→ New/default invitations use the active catalogue design
```
