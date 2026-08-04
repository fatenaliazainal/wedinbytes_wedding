# WedInBytes — Comprehensive Manual Test Cases

---

**Version:** 1.0
**Date:** 2026-08-03
**Prepared by:** QA Engineering
**Project:** WedInBytes (wedinstudio.com)
**Status:** Draft
**Scope:** Full platform — all modules, all user types

---

## Test Case Priority & Severity Legend

| Priority | Meaning |
|----------|---------|
| P1 | Must test before every release |
| P2 | High importance, test every sprint |
| P3 | Medium, test on major releases |
| P4 | Low, test on regression cycles |

| Severity | Meaning |
|----------|---------|
| Critical | App unusable / data loss |
| High | Major feature broken |
| Medium | Feature partially broken, workaround exists |
| Low | Minor UI/UX issue |

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Dashboard](#2-dashboard)
3. [Invitation CRUD](#3-invitation-crud)
4. [Invitation Editor — General](#4-invitation-editor--general)
5. [Theme & Design](#5-theme--design)
6. [Background](#6-background)
7. [Gallery](#7-gallery)
8. [Music](#8-music)
9. [Countdown](#9-countdown)
10. [Calendar / Date & Location](#10-calendar--date--location)
11. [Programme](#11-programme)
12. [Location & Google Maps](#12-location--google-maps)
13. [Contact](#13-contact)
14. [Gift Fund](#14-gift-fund)
15. [RSVP](#15-rsvp)
16. [Wishes](#16-wishes)
17. [Preview](#17-preview)
18. [Publish](#18-publish)
19. [Public Invitation View](#19-public-invitation-view)
20. [Subscription / Pricing](#20-subscription--pricing)
21. [Payment (ToyyibPay)](#21-payment-toyyibpay)
22. [Profile](#22-profile)
23. [Admin Panel](#23-admin-panel)
24. [Logout](#24-logout)
25. [Mobile Responsive](#25-mobile-responsive)
26. [Browser Compatibility](#26-browser-compatibility)
27. [Performance](#27-performance)
28. [File Upload Validation](#28-file-upload-validation)
29. [Security](#29-security)
30. [Session Timeout](#30-session-timeout)
31. [Broken Links](#31-broken-links)
32. [API Error Handling](#32-api-error-handling)
33. [Empty States](#33-empty-states)
34. [Network Failure](#34-network-failure)
35. [Duplicate Submission](#35-duplicate-submission)
36. [Smoke Test Checklist](#36-smoke-test-checklist)
37. [Regression Test Checklist](#37-regression-test-checklist)
38. [UAT Checklist](#38-uat-checklist)
39. [Release Checklist](#39-release-checklist)

---

## 1. Authentication

### TC-AUTH-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-AUTH-001 |
| **Module** | Authentication |
| **Feature** | Buyer Registration |
| **Objective** | Verify a new buyer can register successfully |
| **Preconditions** | User is not logged in; email not previously registered |
| **Test Steps** | 1. Navigate to `/register` 2. Enter valid name, email, password 3. Click Register |
| **Test Data** | Name: Ali Hassan, Email: ali@test.com, Password: test1234 |
| **Expected Result** | Account created, session established, redirected to `/dashboard` |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-AUTH-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-AUTH-002 |
| **Module** | Authentication |
| **Feature** | Business Registration |
| **Objective** | Verify a business account can register via `/register/business` |
| **Preconditions** | User is not logged in |
| **Test Steps** | 1. Navigate to `/register/business` 2. Enter business name, email, password 3. Click Register |
| **Test Data** | Name: Studio Bahagia, Email: studio@test.com, Password: test1234 |
| **Expected Result** | Account created with role `business_account`, redirected to `/business/dashboard` |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-AUTH-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-AUTH-003 |
| **Module** | Authentication |
| **Feature** | Registration — Duplicate Email |
| **Objective** | Verify system rejects registration with an already-registered email |
| **Preconditions** | Email ali@test.com already exists in the system |
| **Test Steps** | 1. Navigate to `/register` 2. Enter name, duplicate email, password 3. Click Register |
| **Test Data** | Email: ali@test.com (duplicate) |
| **Expected Result** | Error message shown: email already registered. No new account created. |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-AUTH-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-AUTH-004 |
| **Module** | Authentication |
| **Feature** | Registration — Weak Password |
| **Objective** | Verify system rejects password shorter than 6 characters |
| **Preconditions** | None |
| **Test Steps** | 1. Navigate to `/register` 2. Enter valid name, email, password "abc" (3 chars) 3. Click Register |
| **Test Data** | Password: abc |
| **Expected Result** | Validation error: password must be at least 6 characters |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-AUTH-005
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-AUTH-005 |
| **Module** | Authentication |
| **Feature** | Registration — Invalid Email Format |
| **Objective** | Verify system rejects malformed email |
| **Preconditions** | None |
| **Test Steps** | 1. Navigate to `/register` 2. Enter email "notanemail" 3. Click Register |
| **Test Data** | Email: notanemail |
| **Expected Result** | Validation error: invalid email format |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Medium |

### TC-AUTH-006
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-AUTH-006 |
| **Module** | Authentication |
| **Feature** | Registration — Empty Fields |
| **Objective** | Verify system blocks submission with missing required fields |
| **Preconditions** | None |
| **Test Steps** | 1. Navigate to `/register` 2. Leave all fields blank 3. Click Register |
| **Test Data** | All fields empty |
| **Expected Result** | Validation errors shown for each required field; no API call made |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-AUTH-007
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-AUTH-007 |
| **Module** | Authentication |
| **Feature** | Buyer Login |
| **Objective** | Verify buyer can log in with valid credentials |
| **Preconditions** | Buyer account exists |
| **Test Steps** | 1. Navigate to `/login` 2. Enter registered email and password 3. Click Login |
| **Test Data** | Email: ali@test.com, Password: test1234 |
| **Expected Result** | Logged in, redirected to `/dashboard` |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-AUTH-008
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-AUTH-008 |
| **Module** | Authentication |
| **Feature** | Business Login |
| **Objective** | Verify business account user is redirected to business dashboard on login |
| **Preconditions** | Business account exists |
| **Test Steps** | 1. Navigate to `/login` 2. Enter business email/password 3. Click Login |
| **Test Data** | Email: studio@test.com, Password: test1234 |
| **Expected Result** | Redirected to `/business/dashboard` |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-AUTH-009
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-AUTH-009 |
| **Module** | Authentication |
| **Feature** | Login — Wrong Password |
| **Objective** | Verify system rejects login with incorrect password |
| **Preconditions** | Buyer account exists |
| **Test Steps** | 1. Navigate to `/login` 2. Enter correct email, wrong password 3. Click Login |
| **Test Data** | Email: ali@test.com, Password: wrongpass |
| **Expected Result** | Error: invalid email or password. Session not created. |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-AUTH-010
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-AUTH-010 |
| **Module** | Authentication |
| **Feature** | Login — Non-existent Email |
| **Objective** | Verify system rejects login for unregistered email |
| **Preconditions** | None |
| **Test Steps** | 1. Navigate to `/login` 2. Enter email that doesn't exist 3. Click Login |
| **Test Data** | Email: nobody@test.com |
| **Expected Result** | Error message shown, no session created |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-AUTH-011
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-AUTH-011 |
| **Module** | Authentication |
| **Feature** | Admin Login |
| **Objective** | Verify admin can log in via `/admin/login` |
| **Preconditions** | Admin account seeded in DB |
| **Test Steps** | 1. Navigate to `/admin/login` 2. Enter admin password 3. Click Login |
| **Test Data** | Admin password from SEED_SECRET |
| **Expected Result** | Admin session created, redirected to `/admin` |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-AUTH-012
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-AUTH-012 |
| **Module** | Authentication |
| **Feature** | Forgot Password — Valid Email |
| **Objective** | Verify password reset flow is triggered for valid email |
| **Preconditions** | Buyer account exists |
| **Test Steps** | 1. Navigate to `/forgot-password` 2. Enter registered email 3. Click Send |
| **Test Data** | Email: ali@test.com |
| **Expected Result** | Generic success message shown (no email confirmation of whether account exists) |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-AUTH-013
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-AUTH-013 |
| **Module** | Authentication |
| **Feature** | Forgot Password — Non-existent Email |
| **Objective** | Verify same generic message shown for non-existent email (no user enumeration) |
| **Preconditions** | None |
| **Test Steps** | 1. Navigate to `/forgot-password` 2. Enter unregistered email 3. Click Send |
| **Test Data** | Email: ghost@test.com |
| **Expected Result** | Same generic success message as valid email — no indication account doesn't exist |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-AUTH-014
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-AUTH-014 |
| **Module** | Authentication |
| **Feature** | Rate Limiting |
| **Objective** | Verify login is rate-limited after repeated failures |
| **Preconditions** | None |
| **Test Steps** | 1. Navigate to `/login` 2. Submit wrong password 10+ times rapidly |
| **Test Data** | Any credentials |
| **Expected Result** | 429 Too Many Requests error returned after threshold |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-AUTH-015
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-AUTH-015 |
| **Module** | Authentication |
| **Feature** | Protected Route Redirect |
| **Objective** | Verify unauthenticated user is redirected when accessing `/dashboard` |
| **Preconditions** | User is not logged in |
| **Test Steps** | 1. Navigate directly to `/dashboard` without logging in |
| **Test Data** | None |
| **Expected Result** | Redirected to `/login` |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

---

## 2. Dashboard

### TC-DASH-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-DASH-001 |
| **Module** | Dashboard |
| **Feature** | Buyer Dashboard — Load |
| **Objective** | Verify buyer dashboard loads all invitations correctly |
| **Preconditions** | Buyer logged in with at least one invitation |
| **Test Steps** | 1. Login as buyer 2. Navigate to `/dashboard` |
| **Test Data** | Buyer with 2 invitations |
| **Expected Result** | All invitations listed with name, status badge, and action buttons |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-DASH-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-DASH-002 |
| **Module** | Dashboard |
| **Feature** | Buyer Dashboard — Empty State |
| **Objective** | Verify appropriate message when buyer has no invitations |
| **Preconditions** | Buyer logged in, no invitations created |
| **Test Steps** | 1. Login as new buyer 2. Navigate to `/dashboard` |
| **Test Data** | New buyer account |
| **Expected Result** | Empty state message and "Create Invitation" CTA displayed |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-DASH-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-DASH-003 |
| **Module** | Dashboard |
| **Feature** | Business Dashboard — Load |
| **Objective** | Verify business dashboard loads client invitation list |
| **Preconditions** | Business account logged in |
| **Test Steps** | 1. Login as business account 2. Navigate to `/business/dashboard` |
| **Test Data** | Business account with clients |
| **Expected Result** | Client invitations listed in compact table rows with status, edit, preview, RSVP link buttons |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-DASH-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-DASH-004 |
| **Module** | Dashboard |
| **Feature** | Payment History — Load |
| **Objective** | Verify buyer payment history section loads correctly |
| **Preconditions** | Buyer with at least one PAID order |
| **Test Steps** | 1. Login as buyer 2. Navigate to `/dashboard` 3. Scroll to payment history section |
| **Test Data** | Buyer with one PAID order |
| **Expected Result** | Order listed with package name, amount, status PAID, date, receipt download button |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-DASH-005
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-DASH-005 |
| **Module** | Dashboard |
| **Feature** | Paid Invitation Badge |
| **Objective** | Verify paid invitations show "Active" status badge |
| **Preconditions** | Buyer has a paid (isPurchased=true) invitation |
| **Test Steps** | 1. Login as buyer 2. View dashboard invitation list |
| **Test Data** | Invitation with isPurchased=true |
| **Expected Result** | "Active" badge visible on paid invitation row |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-DASH-006
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-DASH-006 |
| **Module** | Dashboard |
| **Feature** | Unpaid Invitation — Retry Payment |
| **Objective** | Verify "Retry Payment" button appears for unpaid invitations |
| **Preconditions** | Buyer has an invitation with PENDING/FAILED order |
| **Test Steps** | 1. Login as buyer 2. View dashboard |
| **Test Data** | Invitation with PENDING payment order |
| **Expected Result** | "Retry Payment" or "Pay Now" button visible on the invitation row |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-DASH-007
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-DASH-007 |
| **Module** | Dashboard |
| **Feature** | Receipt Download |
| **Objective** | Verify PDF receipt can be downloaded for paid order |
| **Preconditions** | Buyer has at least one PAID order |
| **Test Steps** | 1. Login as buyer 2. Go to payment history 3. Click Download Receipt |
| **Test Data** | PAID order |
| **Expected Result** | PDF file downloaded in browser with order details |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Medium |

---

## 3. Invitation CRUD

### TC-INV-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-INV-001 |
| **Module** | Invitation CRUD |
| **Feature** | Create New Invitation |
| **Objective** | Verify buyer can create a new invitation from dashboard |
| **Preconditions** | Buyer logged in |
| **Test Steps** | 1. Login as buyer 2. Click "Create New" on dashboard 3. Editor opens |
| **Test Data** | None |
| **Expected Result** | New invitation row created in DB; editor loads with blank form |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-INV-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-INV-002 |
| **Module** | Invitation CRUD |
| **Feature** | Create Invitation from Catalog |
| **Objective** | Verify design is pre-applied when entering editor from catalog |
| **Preconditions** | Buyer logged in |
| **Test Steps** | 1. Navigate to `/weddingcards/home` 2. Select a card design 3. Click "Choose Design" |
| **Test Data** | Any active design |
| **Expected Result** | Editor opens with selected `designCode` pre-applied |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-INV-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-INV-003 |
| **Module** | Invitation CRUD |
| **Feature** | Edit Existing Invitation |
| **Objective** | Verify buyer can open and edit an existing invitation |
| **Preconditions** | Buyer has at least one invitation |
| **Test Steps** | 1. Login as buyer 2. Click "Edit" on an invitation 3. Modify groom name 4. Save |
| **Test Data** | Modified name: Ahmad Razif |
| **Expected Result** | Changes saved; updated name visible on reload |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-INV-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-INV-004 |
| **Module** | Invitation CRUD |
| **Feature** | Delete Invitation |
| **Objective** | Verify buyer can delete an unpaid invitation |
| **Preconditions** | Buyer has an unpaid invitation |
| **Test Steps** | 1. Login as buyer 2. Click "Delete" on invitation 3. Confirm deletion |
| **Test Data** | Unpaid invitation |
| **Expected Result** | Invitation removed from list; no longer accessible via token |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-INV-005
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-INV-005 |
| **Module** | Invitation CRUD |
| **Feature** | Edit Lock After Event Date |
| **Objective** | Verify paid invitation cannot be edited after event date passes |
| **Preconditions** | Paid invitation with event date in the past |
| **Test Steps** | 1. Login as buyer 2. Open editor for invitation with past event date |
| **Test Data** | Event date: yesterday |
| **Expected Result** | Editor shows read-only state or save button disabled; PATCH returns 403 |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-INV-006
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-INV-006 |
| **Module** | Invitation CRUD |
| **Feature** | Invitation Lock with PIN |
| **Objective** | Verify buyer can lock invitation with a 4-digit PIN |
| **Preconditions** | Buyer has a paid invitation |
| **Test Steps** | 1. Login as buyer 2. Open invitation settings 3. Enable lock 4. Enter PIN "1234" 5. Save |
| **Test Data** | PIN: 1234 |
| **Expected Result** | Invitation locked; public access requires PIN entry |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Medium |

### TC-INV-007
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-INV-007 |
| **Module** | Invitation CRUD |
| **Feature** | Invitation Unlock — Correct PIN |
| **Objective** | Verify invitation unlocks with correct PIN |
| **Preconditions** | Invitation is locked with PIN "1234" |
| **Test Steps** | 1. Visit locked invitation URL 2. Enter PIN "1234" 3. Submit |
| **Test Data** | PIN: 1234 |
| **Expected Result** | Invitation content revealed |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | High |

### TC-INV-008
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-INV-008 |
| **Module** | Invitation CRUD |
| **Feature** | Invitation Unlock — Wrong PIN |
| **Objective** | Verify invitation stays locked with wrong PIN |
| **Preconditions** | Invitation is locked with PIN "1234" |
| **Test Steps** | 1. Visit locked invitation URL 2. Enter PIN "9999" 3. Submit |
| **Test Data** | PIN: 9999 |
| **Expected Result** | Error shown; invitation remains locked |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | High |

### TC-INV-009
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-INV-009 |
| **Module** | Invitation CRUD |
| **Feature** | Invitation Expiry |
| **Objective** | Verify expired invitation redirects guest to home |
| **Preconditions** | Invitation with event date more than 3 months ago |
| **Test Steps** | 1. Visit public URL of expired invitation |
| **Test Data** | Invitation event date: 4 months ago |
| **Expected Result** | 410 returned by API; user redirected to `/` |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

---

## 4. Invitation Editor — General

### TC-EDITOR-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-EDITOR-001 |
| **Module** | Invitation Editor |
| **Feature** | Tab Visibility — Basic Package |
| **Objective** | Verify tabs hidden for Basic package (Gallery, RSVP, Contact, Gift) |
| **Preconditions** | Invitation with Basic package |
| **Test Steps** | 1. Open editor for Basic package invitation 2. Observe tab list |
| **Test Data** | Basic package invitation |
| **Expected Result** | Only Design, Cover, Invitation Text, Programme, Dress Code, Doa tabs visible |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-EDITOR-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-EDITOR-002 |
| **Module** | Invitation Editor |
| **Feature** | Tab Visibility — Premium Package |
| **Objective** | Verify all tabs visible for Premium package |
| **Preconditions** | Premium package invitation |
| **Test Steps** | 1. Open editor for Premium invitation 2. Observe tab list |
| **Test Data** | Premium package invitation |
| **Expected Result** | All tabs including Gift, Gift Registry, RSVP, Gallery, Contact visible |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-EDITOR-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-EDITOR-003 |
| **Module** | Invitation Editor |
| **Feature** | Save — All Tabs |
| **Objective** | Verify all editable fields persist after save |
| **Preconditions** | Buyer logged in with a Standard invitation |
| **Test Steps** | 1. Open editor 2. Fill in all visible fields 3. Click Save 4. Reload editor |
| **Test Data** | Various field values |
| **Expected Result** | All saved values reload correctly; no data lost |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-EDITOR-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-EDITOR-004 |
| **Module** | Invitation Editor |
| **Feature** | Package Selector |
| **Objective** | Verify user can change package in editor before payment |
| **Preconditions** | Unpaid invitation open in editor |
| **Test Steps** | 1. Open editor 2. Go to Design tab 3. Change package from Basic to Standard |
| **Test Data** | None |
| **Expected Result** | Package updates; additional tabs become visible |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-EDITOR-005
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-EDITOR-005 |
| **Module** | Invitation Editor |
| **Feature** | Package Lock After Payment |
| **Objective** | Verify package cannot be changed after payment |
| **Preconditions** | Paid invitation |
| **Test Steps** | 1. Open editor for paid invitation 2. Go to Design tab 3. Attempt to change package |
| **Test Data** | Paid invitation |
| **Expected Result** | Package selector disabled or change blocked with error |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-EDITOR-006
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-EDITOR-006 |
| **Module** | Invitation Editor |
| **Feature** | Demo Editor — All Features Unlocked |
| **Objective** | Verify admin demo editor shows all tabs and features regardless of package |
| **Preconditions** | Logged in as admin |
| **Test Steps** | 1. Login as admin 2. Navigate to `/admin/demo` |
| **Test Data** | None |
| **Expected Result** | All tabs visible including Footer; all premium features accessible |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

---

## 5. Theme & Design

### TC-THEME-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-THEME-001 |
| **Module** | Theme & Design |
| **Feature** | Design Code Selection |
| **Objective** | Verify selecting a design code applies the template |
| **Preconditions** | Unpaid invitation, multiple card designs active |
| **Test Steps** | 1. Open editor 2. Go to Design tab 3. Select a different design from dropdown |
| **Test Data** | Any available design code |
| **Expected Result** | Live preview updates with new design colors, fonts, and backgrounds |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-THEME-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-THEME-002 |
| **Module** | Theme & Design |
| **Feature** | Name Font Selection |
| **Objective** | Verify selected name font renders in preview |
| **Preconditions** | Open invitation editor |
| **Test Steps** | 1. Go to Design tab 2. Change Name Font to "Sacramento" 3. Observe preview |
| **Test Data** | Font: Sacramento |
| **Expected Result** | Couple names in preview render in Sacramento font |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-THEME-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-THEME-003 |
| **Module** | Theme & Design |
| **Feature** | Body Font Selection |
| **Objective** | Verify selected body font applies to invitation body text |
| **Preconditions** | Open invitation editor |
| **Test Steps** | 1. Go to Design tab 2. Change Body Font to "Montserrat" 3. Observe preview |
| **Test Data** | Font: Montserrat |
| **Expected Result** | Body text, dates, and labels render in Montserrat font |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-THEME-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-THEME-004 |
| **Module** | Theme & Design |
| **Feature** | Color Picker — Valid Hex |
| **Objective** | Verify valid hex color is applied and saved |
| **Preconditions** | Open invitation editor |
| **Test Steps** | 1. Go to Design tab 2. Click primary color picker 3. Enter #E8C4A0 4. Save |
| **Test Data** | Color: #E8C4A0 |
| **Expected Result** | Primary color updates in preview; saved to DB |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-THEME-005
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-THEME-005 |
| **Module** | Theme & Design |
| **Feature** | Opening Animation — Doors |
| **Objective** | Verify doors opening animation plays on public invitation |
| **Preconditions** | Invitation with opening animation set to "doors" |
| **Test Steps** | 1. Set opening animation to "doors" 2. Save 3. Visit public invitation URL |
| **Test Data** | openingAnimation: doors |
| **Expected Result** | Two-door envelope opening animation plays on arrival |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-THEME-006
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-THEME-006 |
| **Module** | Theme & Design |
| **Feature** | Wax Seal Selection |
| **Objective** | Verify selected wax seal appears on envelope |
| **Preconditions** | Admin has uploaded at least one wax seal |
| **Test Steps** | 1. Open editor 2. Go to Design tab 3. Select a wax seal 4. Save 5. Preview |
| **Test Data** | Any available wax seal |
| **Expected Result** | Wax seal image visible on the envelope in public invitation |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Low |

### TC-THEME-007
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-THEME-007 |
| **Module** | Theme & Design |
| **Feature** | Language Toggle |
| **Objective** | Verify switching language changes UI labels on invitation |
| **Preconditions** | Open invitation editor |
| **Test Steps** | 1. Go to Design tab 2. Switch language from Malay to English 3. Save 4. Preview |
| **Test Data** | Language: English |
| **Expected Result** | Invitation labels (Tarikh → Date, Masa → Time, Venue, etc.) shown in English |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-THEME-008
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-THEME-008 |
| **Module** | Theme & Design |
| **Feature** | Font Size Slider — Boundary |
| **Objective** | Verify name font size slider enforces min (20) and max (70) bounds |
| **Preconditions** | Open invitation editor, Design tab |
| **Test Steps** | 1. Drag name font size slider to maximum 70 2. Attempt to exceed 70 |
| **Test Data** | Size: 70, then 71 |
| **Expected Result** | Slider stops at 70; preview shows font at max size |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Low |

---

## 6. Background

### TC-BG-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-BG-001 |
| **Module** | Background |
| **Feature** | Background Derived from Design |
| **Objective** | Verify background images come from selected card design, not per-invitation |
| **Preconditions** | Active card design with background images set |
| **Test Steps** | 1. Open editor 2. Select a design code 3. Preview invitation |
| **Test Data** | Active design with cardImageUrl and envelopeImageUrl |
| **Expected Result** | Design backgrounds appear on Group 1 (cover) and Group 2 (details) sections |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-BG-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-BG-002 |
| **Module** | Background |
| **Feature** | Sticky Background Scroll |
| **Objective** | Verify background image remains fixed as guest scrolls through invitation |
| **Preconditions** | Invitation with long content open in browser |
| **Test Steps** | 1. Visit public invitation 2. Open envelope 3. Scroll through entire invitation |
| **Test Data** | Long invitation with gallery and programme |
| **Expected Result** | Background image stays fixed/sticky behind content; does not scale with scroll |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-BG-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-BG-003 |
| **Module** | Background |
| **Feature** | Overlay Toggle |
| **Objective** | Verify overlay can be toggled on/off |
| **Preconditions** | Open invitation editor, Design tab |
| **Test Steps** | 1. Toggle overlay off 2. Save 3. Preview |
| **Test Data** | overlayEnabled: false |
| **Expected Result** | No dark/light overlay on invitation content; background fully visible |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Low |

---

## 7. Gallery

### TC-GAL-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-GAL-001 |
| **Module** | Gallery |
| **Feature** | Upload Image — Valid |
| **Objective** | Verify JPEG image uploads successfully to gallery |
| **Preconditions** | Standard or Premium invitation open in editor |
| **Test Steps** | 1. Go to Gallery tab 2. Click upload 3. Select a valid JPEG under 10MB |
| **Test Data** | File: photo.jpg, Size: 2MB |
| **Expected Result** | Image uploaded, thumbnail preview shown, R2 key stored |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-GAL-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-GAL-002 |
| **Module** | Gallery |
| **Feature** | Upload Image — PNG |
| **Objective** | Verify PNG uploads successfully |
| **Preconditions** | Standard or Premium invitation open in editor |
| **Test Steps** | 1. Go to Gallery tab 2. Upload valid PNG |
| **Test Data** | File: image.png, Size: 1MB |
| **Expected Result** | Image uploaded successfully |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-GAL-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-GAL-003 |
| **Module** | Gallery |
| **Feature** | Max 4 Images Limit |
| **Objective** | Verify only 4 gallery images allowed |
| **Preconditions** | Gallery already has 4 images |
| **Test Steps** | 1. Attempt to upload a 5th image |
| **Test Data** | 5th image file |
| **Expected Result** | Upload button disabled or error shown; 5th image not saved |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-GAL-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-GAL-004 |
| **Module** | Gallery |
| **Feature** | Remove Image |
| **Objective** | Verify image can be removed from gallery |
| **Preconditions** | Gallery has at least 1 image |
| **Test Steps** | 1. Go to Gallery tab 2. Click remove on an image 3. Save |
| **Test Data** | Existing gallery image |
| **Expected Result** | Image removed from preview; R2 object deleted; galleryImages array updated |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-GAL-005
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-GAL-005 |
| **Module** | Gallery |
| **Feature** | Gallery Visible on Public Invitation |
| **Objective** | Verify uploaded gallery images appear on public invitation |
| **Preconditions** | Invitation with 2 gallery images, publicly accessible |
| **Test Steps** | 1. Upload 2 images 2. Save 3. Visit public URL |
| **Test Data** | 2 uploaded gallery images |
| **Expected Result** | Both gallery images visible in the gallery section of the invitation |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-GAL-006
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-GAL-006 |
| **Module** | Gallery |
| **Feature** | Gallery Hidden for Basic Package |
| **Objective** | Verify gallery tab is hidden for Basic package |
| **Preconditions** | Invitation with Basic package |
| **Test Steps** | 1. Open editor for Basic invitation 2. Check tab list |
| **Test Data** | Basic package |
| **Expected Result** | Gallery tab not visible; gallery section not shown on public invitation |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

---

## 8. Music

### TC-MUS-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-MUS-001 |
| **Module** | Music |
| **Feature** | Valid YouTube URL |
| **Objective** | Verify valid YouTube URL saves and previews correctly |
| **Preconditions** | Open invitation editor, Design tab |
| **Test Steps** | 1. Paste YouTube URL into music field 2. Observe preview |
| **Test Data** | URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ |
| **Expected Result** | YouTube iframe preview rendered below input; URL saved on Save |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-MUS-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-MUS-002 |
| **Module** | Music |
| **Feature** | Invalid YouTube URL |
| **Objective** | Verify invalid URL shows no preview but is still accepted |
| **Preconditions** | Open invitation editor, Design tab |
| **Test Steps** | 1. Enter "https://notayoutube.com/video" 2. Observe |
| **Test Data** | URL: https://notayoutube.com/video |
| **Expected Result** | No iframe preview shown; field still saves the string without error |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Low |

### TC-MUS-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-MUS-003 |
| **Module** | Music |
| **Feature** | Music on Public Invitation |
| **Objective** | Verify music plays (or muted toggle appears) when guest opens invitation |
| **Preconditions** | Invitation with valid YouTube URL, publicly accessible |
| **Test Steps** | 1. Visit public invitation URL 2. Open envelope 3. Observe music behavior |
| **Test Data** | Valid YouTube URL saved |
| **Expected Result** | Music plays (or muted by browser policy); mute/unmute toggle visible |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-MUS-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-MUS-004 |
| **Module** | Music |
| **Feature** | Mute/Unmute Toggle |
| **Objective** | Verify guest can mute and unmute music |
| **Preconditions** | Invitation with music, guest has opened it |
| **Test Steps** | 1. Open invitation 2. Click mute button 3. Click unmute button |
| **Test Data** | None |
| **Expected Result** | Music mutes when mute clicked; resumes when unmute clicked |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Low |

---

## 9. Countdown

### TC-CTD-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-CTD-001 |
| **Module** | Countdown |
| **Feature** | Countdown Display — Future Date |
| **Objective** | Verify countdown shows correct days/hours/minutes/seconds for future event |
| **Preconditions** | Invitation with event date 30 days in the future |
| **Test Steps** | 1. Visit public invitation 2. Open envelope 3. View countdown section |
| **Test Data** | Event date: 30 days from today |
| **Expected Result** | Countdown shows ~30 days, correct hours/minutes/seconds ticking down |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-CTD-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-CTD-002 |
| **Module** | Countdown |
| **Feature** | Countdown — Past Event |
| **Objective** | Verify countdown handles past event date gracefully |
| **Preconditions** | Invitation with event date yesterday |
| **Test Steps** | 1. Visit public invitation with past event date |
| **Test Data** | Event date: yesterday |
| **Expected Result** | Countdown shows zeroes or a "ceremony has started" message; no negative values |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-CTD-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-CTD-003 |
| **Module** | Countdown |
| **Feature** | Countdown — No Date Set |
| **Objective** | Verify countdown section handles missing event date |
| **Preconditions** | Invitation with no eventDate set |
| **Test Steps** | 1. Visit invitation with empty eventDate |
| **Test Data** | eventDate: null |
| **Expected Result** | Countdown section hidden or shows placeholder; no crash |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Medium |

---

## 10. Calendar / Date & Location

### TC-CAL-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-CAL-001 |
| **Module** | Calendar |
| **Feature** | Event Date Save |
| **Objective** | Verify event date saves and displays correctly |
| **Preconditions** | Invitation editor open, Date & Location tab |
| **Test Steps** | 1. Select event date 2. Save 3. Preview |
| **Test Data** | Date: 2026-12-25 |
| **Expected Result** | Date shown correctly on public invitation as "25 December 2026" |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-CAL-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-CAL-002 |
| **Module** | Calendar |
| **Feature** | Event Day Auto-derive |
| **Objective** | Verify day name auto-derives from selected date |
| **Preconditions** | Invitation editor open, Date & Location tab |
| **Test Steps** | 1. Select date 2026-12-25 (Friday) 2. Observe auto-derived day field |
| **Test Data** | Date: 2026-12-25 |
| **Expected Result** | Day field auto-shows "Jumaat" (Malay) or "Friday" (English) |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-CAL-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-CAL-003 |
| **Module** | Calendar |
| **Feature** | Hijri Date Field |
| **Objective** | Verify Hijri date saves and displays correctly |
| **Preconditions** | Invitation editor open, Date & Location tab |
| **Test Steps** | 1. Enter Hijri date "2 Rejab 1448" 2. Save 3. Preview |
| **Test Data** | venueHijriDate: 2 Rejab 1448 |
| **Expected Result** | Hijri date displayed below Gregorian date on public invitation |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Low |

### TC-CAL-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-CAL-004 |
| **Module** | Calendar |
| **Feature** | Add to Calendar — DetailPanel |
| **Objective** | Verify "Add to Calendar" button opens calendar deep-link |
| **Preconditions** | Public invitation with event date and venue set |
| **Test Steps** | 1. Visit public invitation 2. Click Calendar tab in detail panel 3. Click "Add to Calendar" |
| **Test Data** | Event date and venue set |
| **Expected Result** | Calendar app deep-link opens (Google Calendar / device calendar) |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Low |

---

## 11. Programme

### TC-PROG-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PROG-001 |
| **Module** | Programme |
| **Feature** | Add Itinerary Row |
| **Objective** | Verify user can add itinerary rows |
| **Preconditions** | Invitation editor open, Programme tab |
| **Test Steps** | 1. Click "Add Row" 2. Fill time and event 3. Save |
| **Test Data** | Time: 10:00 AM, Event: Solemnization |
| **Expected Result** | New row saved; appears on public invitation programme section |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-PROG-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PROG-002 |
| **Module** | Programme |
| **Feature** | Remove Itinerary Row |
| **Objective** | Verify user can remove itinerary row |
| **Preconditions** | Programme tab with at least 2 rows |
| **Test Steps** | 1. Click remove on second row 2. Save |
| **Test Data** | Existing itinerary |
| **Expected Result** | Row removed; public invitation shows updated programme |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-PROG-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PROG-003 |
| **Module** | Programme |
| **Feature** | Default 4 Rows |
| **Objective** | Verify new invitation starts with 4 default programme rows |
| **Preconditions** | New invitation created |
| **Test Steps** | 1. Open editor for new invitation 2. Navigate to Programme tab |
| **Test Data** | New invitation |
| **Expected Result** | 4 empty itinerary rows pre-populated |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Low |

---

## 12. Location & Google Maps

### TC-LOC-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-LOC-001 |
| **Module** | Location |
| **Feature** | Venue Details Save |
| **Objective** | Verify venue name and address save and display on public invitation |
| **Preconditions** | Invitation editor open, Date & Location tab |
| **Test Steps** | 1. Enter venue name and address 2. Save 3. Preview |
| **Test Data** | Venue: Masjid Negara, Address: Jalan Perdana, KL |
| **Expected Result** | Venue name and address displayed on public invitation |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-LOC-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-LOC-002 |
| **Module** | Location |
| **Feature** | Google Maps Link |
| **Objective** | Verify Google Maps button opens correct map URL |
| **Preconditions** | Invitation with Google Maps URL saved |
| **Test Steps** | 1. Visit public invitation 2. Open Location tab in detail panel 3. Click Google Maps button |
| **Test Data** | venueMapUrl: https://maps.google.com/?q=Masjid+Negara |
| **Expected Result** | Google Maps opens in new tab at correct location |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-LOC-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-LOC-003 |
| **Module** | Location |
| **Feature** | Waze Link |
| **Objective** | Verify Waze button opens correct navigation URL |
| **Preconditions** | Invitation with Waze URL saved |
| **Test Steps** | 1. Visit public invitation 2. Open Location tab 3. Click Waze button |
| **Test Data** | venueWazeUrl: https://waze.com/ul?q=Masjid+Negara |
| **Expected Result** | Waze opens (or Waze app on mobile) at correct location |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-LOC-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-LOC-004 |
| **Module** | Location |
| **Feature** | Location Hidden When Empty |
| **Objective** | Verify location section is hidden when no venue details are set |
| **Preconditions** | Invitation with no venue fields set |
| **Test Steps** | 1. Visit public invitation with empty venue fields |
| **Test Data** | venueName: null, venueAddress: null |
| **Expected Result** | Location section/tab hidden or shows no content; no crash |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Medium |

---

## 13. Contact

### TC-CON-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-CON-001 |
| **Module** | Contact |
| **Feature** | Add Contact |
| **Objective** | Verify user can add a contact with name and phone |
| **Preconditions** | Standard/Premium invitation editor open |
| **Test Steps** | 1. Go to Contact tab 2. Enter name and phone 3. Save |
| **Test Data** | Name: Siti Rahimah, Phone: 0123456789 |
| **Expected Result** | Contact saved and displayed on public invitation |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-CON-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-CON-002 |
| **Module** | Contact |
| **Feature** | WhatsApp Deep-Link |
| **Objective** | Verify WhatsApp link opens chat to contact's number |
| **Preconditions** | Invitation with contact phone saved |
| **Test Steps** | 1. Visit public invitation 2. Open Contact tab 3. Click WhatsApp icon |
| **Test Data** | Phone: 60123456789 |
| **Expected Result** | WhatsApp opens (or wa.me link navigates) with pre-filled number |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-CON-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-CON-003 |
| **Module** | Contact |
| **Feature** | Multiple Contacts |
| **Objective** | Verify multiple contacts can be added and all display on invitation |
| **Preconditions** | Standard/Premium invitation editor open |
| **Test Steps** | 1. Add 3 contacts with different names/phones 2. Save 3. Preview |
| **Test Data** | 3 contacts |
| **Expected Result** | All 3 contacts visible in contact section with WhatsApp links |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

---

## 14. Gift Fund

### TC-GIFT-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-GIFT-001 |
| **Module** | Gift Fund |
| **Feature** | Enable Gift Section |
| **Objective** | Verify gift section shows when enabled with bank details |
| **Preconditions** | Premium invitation with Money Gift feature |
| **Test Steps** | 1. Go to Gift tab 2. Toggle display ON 3. Enter bank name and account number 4. Save 5. Preview |
| **Test Data** | Bank: Maybank, Account: 1234567890 |
| **Expected Result** | Gift section visible on public invitation with bank details |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-GIFT-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-GIFT-002 |
| **Module** | Gift Fund |
| **Feature** | Upload QR Code |
| **Objective** | Verify QR code image uploads and displays |
| **Preconditions** | Premium invitation, gift section enabled |
| **Test Steps** | 1. Go to Gift tab 2. Upload QR code image 3. Save 4. Preview |
| **Test Data** | File: qr.png, Size: 500KB |
| **Expected Result** | QR code image displayed in gift section on public invitation |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-GIFT-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-GIFT-003 |
| **Module** | Gift Fund |
| **Feature** | Max 2 QR Codes |
| **Objective** | Verify only 2 QR code images allowed |
| **Preconditions** | Gift tab with 2 QR codes already uploaded |
| **Test Steps** | 1. Attempt to upload 3rd QR code |
| **Test Data** | 3rd QR image file |
| **Expected Result** | Upload button disabled or error shown; 3rd QR not saved |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-GIFT-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-GIFT-004 |
| **Module** | Gift Fund |
| **Feature** | Gift Tab Hidden for Basic Package |
| **Objective** | Verify Gift tab not accessible for Basic package |
| **Preconditions** | Basic invitation editor open |
| **Test Steps** | 1. Open editor 2. Check tabs |
| **Test Data** | Basic package |
| **Expected Result** | Gift tab not visible |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

---

## 15. RSVP

### TC-RSVP-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-RSVP-001 |
| **Module** | RSVP |
| **Feature** | Guest RSVP — Attending |
| **Objective** | Verify guest can submit RSVP as attending |
| **Preconditions** | Public invitation with RSVP enabled |
| **Test Steps** | 1. Visit public invitation 2. Open RSVP form 3. Fill: name, attending=Yes, guests=2 4. Submit |
| **Test Data** | Name: Zara, Attending: Yes, Guests: 2 |
| **Expected Result** | RSVP recorded; success confirmation shown to guest |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-RSVP-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-RSVP-002 |
| **Module** | RSVP |
| **Feature** | Guest RSVP — Not Attending |
| **Objective** | Verify guest can submit RSVP as not attending |
| **Preconditions** | Public invitation with RSVP enabled |
| **Test Steps** | 1. Open RSVP form 2. Select attending=No 3. Submit |
| **Test Data** | Name: Budi, Attending: No |
| **Expected Result** | RSVP recorded as not attending |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-RSVP-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-RSVP-003 |
| **Module** | RSVP |
| **Feature** | Duplicate RSVP |
| **Objective** | Verify same name cannot RSVP twice for same invitation |
| **Preconditions** | Guest "Zara" has already RSVPed |
| **Test Steps** | 1. Submit RSVP again with same name "Zara" |
| **Test Data** | Name: Zara (duplicate) |
| **Expected Result** | Error shown: name already registered or RSVP updated |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-RSVP-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-RSVP-004 |
| **Module** | RSVP |
| **Feature** | Max Guest Limit |
| **Objective** | Verify RSVP is blocked when overall max guests reached |
| **Preconditions** | Invitation with rsvpMaxOverallGuests = 10, already 10 guests RSVP'd |
| **Test Steps** | 1. Attempt to RSVP with 2 more guests |
| **Test Data** | New RSVP with numberOfGuests=2 |
| **Expected Result** | Error: guest limit reached; RSVP not saved |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-RSVP-005
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-RSVP-005 |
| **Module** | RSVP |
| **Feature** | RSVP After Deadline |
| **Objective** | Verify RSVP is blocked after deadline |
| **Preconditions** | Invitation with rsvpDeadline = yesterday |
| **Test Steps** | 1. Visit invitation 2. Attempt to submit RSVP |
| **Test Data** | Deadline: yesterday |
| **Expected Result** | RSVP form disabled or error: deadline has passed |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-RSVP-006
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-RSVP-006 |
| **Module** | RSVP |
| **Feature** | Buyer RSVP Dashboard |
| **Objective** | Verify buyer sees all RSVPs with counts |
| **Preconditions** | Buyer with invitation having RSVPs |
| **Test Steps** | 1. Login as buyer 2. Navigate to `/rsvp` 3. Select invitation |
| **Test Data** | Invitation with 5 attending, 2 not attending |
| **Expected Result** | RSVP list shown; counts correct; total guest count displayed |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-RSVP-007
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-RSVP-007 |
| **Module** | RSVP |
| **Feature** | Public RSVP Share Page |
| **Objective** | Verify `/rsvp-share/:token` shows correct RSVP data |
| **Preconditions** | Invitation with RSVPs |
| **Test Steps** | 1. Copy RSVP share link from dashboard 2. Open in incognito 3. View page |
| **Test Data** | Valid RSVP share token |
| **Expected Result** | Attending/not attending/total tiles shown; respondent table visible |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-RSVP-008
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-RSVP-008 |
| **Module** | RSVP |
| **Feature** | RSVP Disabled |
| **Objective** | Verify RSVP section hidden when rsvpEnabled = false |
| **Preconditions** | Invitation with rsvpEnabled = false |
| **Test Steps** | 1. Visit public invitation with RSVP disabled |
| **Test Data** | rsvpEnabled: false |
| **Expected Result** | RSVP section and button not visible on invitation |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

---

## 16. Wishes

### TC-WISH-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-WISH-001 |
| **Module** | Wishes |
| **Feature** | Submit Wish with RSVP |
| **Objective** | Verify wishes are saved when guest includes message in RSVP |
| **Preconditions** | Public invitation with RSVP enabled |
| **Test Steps** | 1. Open RSVP form 2. Fill name, attendance, add message "Selamat Pengantin Baru!" 3. Submit |
| **Test Data** | Message: Selamat Pengantin Baru! |
| **Expected Result** | Message saved as wish; appears in wishes carousel on invitation |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-WISH-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-WISH-002 |
| **Module** | Wishes |
| **Feature** | Wishes Carousel Navigation |
| **Objective** | Verify carousel arrow and dot navigation works |
| **Preconditions** | Invitation with 3+ wishes |
| **Test Steps** | 1. Visit public invitation 2. Scroll to wishes 3. Click next arrow 4. Click dots |
| **Test Data** | 3 wishes |
| **Expected Result** | Carousel advances to next wish; dots show current position |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Low |

### TC-WISH-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-WISH-003 |
| **Module** | Wishes |
| **Feature** | Auto-advance Carousel |
| **Objective** | Verify carousel auto-advances every 6 seconds |
| **Preconditions** | Invitation with 2+ wishes |
| **Test Steps** | 1. Visit public invitation 2. Scroll to wishes 3. Wait 6 seconds |
| **Test Data** | 2 wishes |
| **Expected Result** | Carousel automatically moves to next wish after 6 seconds |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Low |

### TC-WISH-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-WISH-004 |
| **Module** | Wishes |
| **Feature** | Empty Wishes State |
| **Objective** | Verify appropriate display when no wishes yet |
| **Preconditions** | Invitation with no RSVP messages |
| **Test Steps** | 1. Visit public invitation 2. Scroll to wishes section |
| **Test Data** | 0 wishes |
| **Expected Result** | Empty state message shown; no broken carousel |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Low |

---

## 17. Preview

### TC-PREV-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PREV-001 |
| **Module** | Preview |
| **Feature** | Preview from Editor |
| **Objective** | Verify Preview button opens the invitation in a new tab |
| **Preconditions** | Buyer logged in with invitation open in editor |
| **Test Steps** | 1. Open editor 2. Click "Preview" button |
| **Test Data** | Any saved invitation |
| **Expected Result** | New tab opens at `/invite/:token` showing full invitation |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-PREV-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PREV-002 |
| **Module** | Preview |
| **Feature** | Preview Reflects Latest Save |
| **Objective** | Verify preview shows the most recently saved changes |
| **Preconditions** | Buyer has saved changes |
| **Test Steps** | 1. Change groom name 2. Save 3. Open preview |
| **Test Data** | New groom name: Hafiz |
| **Expected Result** | Preview shows "Hafiz" as groom name |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-PREV-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PREV-003 |
| **Module** | Preview |
| **Feature** | Unpaid Invitation Preview |
| **Objective** | Verify unpaid invitation is fully viewable via token URL |
| **Preconditions** | Unpaid invitation exists |
| **Test Steps** | 1. Copy token URL of unpaid invitation 2. Open in incognito |
| **Test Data** | Unpaid invitation token |
| **Expected Result** | Full invitation renders (no paywall on token URL) |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

---

## 18. Publish

### TC-PUB-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PUB-001 |
| **Module** | Publish |
| **Feature** | Initiate Payment / Publish |
| **Objective** | Verify "Pay & Activate" flow creates a bill and redirects to ToyyibPay |
| **Preconditions** | Buyer with unpaid invitation and a package selected |
| **Test Steps** | 1. Login as buyer 2. Open editor 3. Click "Pay" or "Activate" button |
| **Test Data** | Standard package |
| **Expected Result** | 201 response with paymentUrl; browser redirected to ToyyibPay checkout |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-PUB-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PUB-002 |
| **Module** | Publish |
| **Feature** | Invitation Activated After Payment |
| **Objective** | Verify invitation isPurchased=true after successful payment |
| **Preconditions** | Payment completed in sandbox |
| **Test Steps** | 1. Complete full payment flow in sandbox 2. Return to dashboard |
| **Test Data** | Sandbox payment |
| **Expected Result** | Invitation shows "Active" badge; isPurchased=true in DB; public URL accessible |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-PUB-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PUB-003 |
| **Module** | Publish |
| **Feature** | Public URL Generated from Cover Names |
| **Objective** | Verify public URL slug is derived from Cover Groom + Cover Bride name |
| **Preconditions** | Invitation with coverGroomName and coverBrideName set |
| **Test Steps** | 1. Set coverGroomName: "Ahmad", coverBrideName: "Siti" 2. Save 3. Check public URL |
| **Test Data** | Groom: Ahmad, Bride: Siti |
| **Expected Result** | Public URL contains "ahmad" and "siti" in slug e.g. `/invite/20261225/ahmad-siti` |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

---

## 19. Public Invitation View

### TC-PUB-INV-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PUB-INV-001 |
| **Module** | Public Invitation |
| **Feature** | Envelope Opening Animation |
| **Objective** | Verify envelope animation plays and invitation is revealed |
| **Preconditions** | Public invitation accessible |
| **Test Steps** | 1. Visit public invitation URL 2. Click "Open" button |
| **Test Data** | Any active invitation |
| **Expected Result** | Envelope animation plays; invitation content revealed |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-PUB-INV-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PUB-INV-002 |
| **Module** | Public Invitation |
| **Feature** | All Sections Render |
| **Objective** | Verify all content sections render correctly on public invitation |
| **Preconditions** | Premium invitation with all fields filled |
| **Test Steps** | 1. Visit public invitation 2. Scroll through all sections |
| **Test Data** | Fully filled Premium invitation |
| **Expected Result** | Cover, details, countdown, gallery, programme, RSVP, wishes, gift, registry, contact, map all visible |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-PUB-INV-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PUB-INV-003 |
| **Module** | Public Invitation |
| **Feature** | Sensitive Fields Not Exposed |
| **Objective** | Verify ownership fields are not in public API response |
| **Preconditions** | Any public invitation |
| **Test Steps** | 1. Open browser dev tools 2. Visit public invitation 3. Inspect API response from GET /api/invitation/public/:dateCode/:slug |
| **Test Data** | Any invitation |
| **Expected Result** | Response does NOT contain userId, businessId, lockPinHash, isPurchased, purchasedAt |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-PUB-INV-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PUB-INV-004 |
| **Module** | Public Invitation |
| **Feature** | Expired Invitation Redirect |
| **Objective** | Verify expired invitation redirects to home page |
| **Preconditions** | Invitation with event date > 3 months ago |
| **Test Steps** | 1. Visit public URL of expired invitation |
| **Test Data** | Invitation with event date 4 months ago |
| **Expected Result** | 410 response; user redirected to `/` (home) |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

---

## 20. Subscription / Pricing

### TC-PRICE-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PRICE-001 |
| **Module** | Subscription |
| **Feature** | Public Pricing Page |
| **Objective** | Verify pricing page displays all active packages with correct prices |
| **Preconditions** | Admin has seeded pricing packages |
| **Test Steps** | 1. Navigate to `/pricing` as guest |
| **Test Data** | Active packages in DB |
| **Expected Result** | All active packages shown with name, price, features list |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-PRICE-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PRICE-002 |
| **Module** | Subscription |
| **Feature** | Pricing CTA — Guest |
| **Objective** | Verify guest is redirected to register when clicking package CTA |
| **Preconditions** | Not logged in |
| **Test Steps** | 1. Visit `/pricing` 2. Click "Choose" on any package |
| **Test Data** | None |
| **Expected Result** | Redirected to `/register` |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-PRICE-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PRICE-003 |
| **Module** | Subscription |
| **Feature** | Pricing CTA — Logged In |
| **Objective** | Verify logged-in buyer is taken to editor when clicking package |
| **Preconditions** | Buyer logged in |
| **Test Steps** | 1. Visit `/pricing` 2. Click "Choose" on Standard package |
| **Test Data** | None |
| **Expected Result** | Redirected to `/editor?new=1` with Standard package pre-selected |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

---

## 21. Payment (ToyyibPay)

### TC-PAY-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PAY-001 |
| **Module** | Payment |
| **Feature** | Create Bill — Sandbox |
| **Objective** | Verify bill is created in ToyyibPay sandbox |
| **Preconditions** | TOYYIBPAY_SANDBOX=true; buyer with invitation and package |
| **Test Steps** | 1. Login as buyer 2. Select package 3. Click "Pay" 4. Observe response |
| **Test Data** | Standard package |
| **Expected Result** | 201 response with paymentUrl pointing to dev.toyyibpay.com |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-PAY-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PAY-002 |
| **Module** | Payment |
| **Feature** | Payment Success Return |
| **Objective** | Verify return page shows PAID status after successful payment |
| **Preconditions** | Payment completed in sandbox |
| **Test Steps** | 1. Complete payment in ToyyibPay sandbox 2. Return to app 3. View return page |
| **Test Data** | Sandbox successful payment |
| **Expected Result** | Return page shows success message; invitation activated |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-PAY-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PAY-003 |
| **Module** | Payment |
| **Feature** | Payment Failed Return |
| **Objective** | Verify return page shows FAILED status when payment is cancelled/failed |
| **Preconditions** | User cancels payment in sandbox |
| **Test Steps** | 1. Initiate payment 2. Cancel at ToyyibPay checkout 3. Return |
| **Test Data** | Cancelled payment |
| **Expected Result** | Return page shows failure message with retry option from dashboard |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-PAY-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PAY-004 |
| **Module** | Payment |
| **Feature** | Expired Order Replaced |
| **Objective** | Verify orders older than 3 days are marked EXPIRED and replaced |
| **Preconditions** | Buyer has a PENDING order created 4 days ago |
| **Test Steps** | 1. Login as buyer 2. Attempt to pay for invitation with old pending order |
| **Test Data** | Pending order created 4+ days ago |
| **Expected Result** | Old order marked EXPIRED; new order created; response includes replacedExpired:true |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-PAY-005
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PAY-005 |
| **Module** | Payment |
| **Feature** | Already Paid — Block Repayment |
| **Objective** | Verify already-paid invitation cannot be paid again |
| **Preconditions** | Paid invitation (isPurchased=true) |
| **Test Steps** | 1. Login as buyer 2. Attempt to create bill for paid invitation via API |
| **Test Data** | isPurchased=true invitation |
| **Expected Result** | 400 error: invitation already purchased |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-PAY-006
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PAY-006 |
| **Module** | Payment |
| **Feature** | Return Status — Pending |
| **Objective** | Verify PENDING status shown when ToyyibPay has not processed yet |
| **Preconditions** | Payment initiated but not yet processed |
| **Test Steps** | 1. Initiate payment 2. Immediately return to app before processing completes |
| **Test Data** | In-progress payment |
| **Expected Result** | Return page shows PENDING status; retry/check option available |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

---

## 22. Profile

### TC-PROF-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PROF-001 |
| **Module** | Profile |
| **Feature** | Update Name |
| **Objective** | Verify buyer can update their display name |
| **Preconditions** | Buyer logged in |
| **Test Steps** | 1. Navigate to profile section 2. Change name to "Ahmad Razif" 3. Save |
| **Test Data** | New name: Ahmad Razif |
| **Expected Result** | Name updated in DB; displayed with new name on reload |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-PROF-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PROF-002 |
| **Module** | Profile |
| **Feature** | Update Email — Valid |
| **Objective** | Verify buyer can change email to a new unique address |
| **Preconditions** | Buyer logged in; new email not in use |
| **Test Steps** | 1. Change email to "new@test.com" 2. Save |
| **Test Data** | New email: new@test.com |
| **Expected Result** | Email updated; can login with new email |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-PROF-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PROF-003 |
| **Module** | Profile |
| **Feature** | Update Email — Duplicate |
| **Objective** | Verify system rejects email change to an already-registered email |
| **Preconditions** | Two buyer accounts exist |
| **Test Steps** | 1. Login as buyer A 2. Try to change email to buyer B's email |
| **Test Data** | Email of buyer B |
| **Expected Result** | 409 Conflict error; email not changed |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-PROF-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PROF-004 |
| **Module** | Profile |
| **Feature** | Change Password — Valid |
| **Objective** | Verify buyer can change password with correct current password |
| **Preconditions** | Buyer logged in |
| **Test Steps** | 1. Navigate to change password 2. Enter current + new passwords 3. Save |
| **Test Data** | Current: test1234, New: newpass123 |
| **Expected Result** | Password changed; can login with new password |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-PROF-005
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PROF-005 |
| **Module** | Profile |
| **Feature** | Change Password — Wrong Current |
| **Objective** | Verify system rejects password change with wrong current password |
| **Preconditions** | Buyer logged in |
| **Test Steps** | 1. Navigate to change password 2. Enter wrong current password |
| **Test Data** | Wrong current password |
| **Expected Result** | Error: current password incorrect; password not changed |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

---

## 23. Admin Panel

### TC-ADMIN-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-ADMIN-001 |
| **Module** | Admin |
| **Feature** | Admin Login |
| **Objective** | Verify only admin password grants admin access |
| **Preconditions** | Admin account seeded |
| **Test Steps** | 1. Navigate to `/admin/login` 2. Enter admin password 3. Submit |
| **Test Data** | Correct admin password |
| **Expected Result** | Admin session; redirected to `/admin` |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-ADMIN-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-ADMIN-002 |
| **Module** | Admin |
| **Feature** | Revenue Stats |
| **Objective** | Verify admin revenue stats show correct totals |
| **Preconditions** | Admin logged in; PAID orders exist |
| **Test Steps** | 1. Navigate to `/admin` 2. View revenue section |
| **Test Data** | 3 PAID orders (RM150, RM200, RM300) |
| **Expected Result** | Total revenue shown as RM650; order count = 3 |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-ADMIN-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-ADMIN-003 |
| **Module** | Admin |
| **Feature** | Change User Role |
| **Objective** | Verify admin can change user role from buyer to business_account |
| **Preconditions** | Admin logged in; buyer user exists |
| **Test Steps** | 1. Navigate to customers 2. Find buyer 3. Change role to business_account 4. Save |
| **Test Data** | Buyer user |
| **Expected Result** | Role updated in DB; user now sees business dashboard on next login |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-ADMIN-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-ADMIN-004 |
| **Module** | Admin |
| **Feature** | Create Pricing Package |
| **Objective** | Verify admin can create a new pricing package |
| **Preconditions** | Admin logged in |
| **Test Steps** | 1. Navigate to Pricing 2. Click "Add Package" 3. Fill name, price, description 4. Save |
| **Test Data** | Name: Gold, Price: 299, Description: All features |
| **Expected Result** | New package appears in admin list and on public `/pricing` page |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-ADMIN-005
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-ADMIN-005 |
| **Module** | Admin |
| **Feature** | Activate Card Design |
| **Objective** | Verify activating a design makes it the default template |
| **Preconditions** | Admin logged in; multiple card designs exist |
| **Test Steps** | 1. Navigate to Card Designs 2. Click "Activate" on a design |
| **Test Data** | Inactive design |
| **Expected Result** | Selected design isActive=true; previous active design isActive=false; new invitations use this design |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-ADMIN-006
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-ADMIN-006 |
| **Module** | Admin |
| **Feature** | Approve Review |
| **Objective** | Verify admin can approve a pending review |
| **Preconditions** | Admin logged in; pending review exists |
| **Test Steps** | 1. Navigate to Reviews 2. Find pending review 3. Click Approve |
| **Test Data** | Pending review |
| **Expected Result** | Review status = approved; appears on public `/reviews` page |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Medium |

### TC-ADMIN-007
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-ADMIN-007 |
| **Module** | Admin |
| **Feature** | Upload Wax Seal |
| **Objective** | Verify admin can upload a new wax seal image |
| **Preconditions** | Admin logged in |
| **Test Steps** | 1. Navigate to Wax Seals 2. Upload image 3. Enter name 4. Save |
| **Test Data** | PNG seal image |
| **Expected Result** | New seal available in editor for buyers/business users to select |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Medium |

### TC-ADMIN-008
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-ADMIN-008 |
| **Module** | Admin |
| **Feature** | Buyer Cannot Access Admin |
| **Objective** | Verify buyer session cannot access admin routes |
| **Preconditions** | Buyer logged in |
| **Test Steps** | 1. Login as buyer 2. Navigate to `/admin` |
| **Test Data** | Buyer session |
| **Expected Result** | Redirected or 401/403 error; admin data not accessible |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-ADMIN-009
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-ADMIN-009 |
| **Module** | Admin |
| **Feature** | Manual Order Status Override |
| **Objective** | Verify admin can manually mark an order as PAID |
| **Preconditions** | Admin logged in; PENDING order exists |
| **Test Steps** | 1. Navigate to Orders 2. Find PENDING order 3. Change status to PAID 4. Save |
| **Test Data** | PENDING order |
| **Expected Result** | Order status updated to PAID; invitation activated |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

---

## 24. Logout

### TC-LOGOUT-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-LOGOUT-001 |
| **Module** | Logout |
| **Feature** | Buyer Logout |
| **Objective** | Verify buyer logout destroys session and redirects to home |
| **Preconditions** | Buyer logged in |
| **Test Steps** | 1. Click Logout in navigation |
| **Test Data** | Active buyer session |
| **Expected Result** | Session destroyed; cookie cleared; redirected to `/` |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-LOGOUT-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-LOGOUT-002 |
| **Module** | Logout |
| **Feature** | Post-Logout Protected Route |
| **Objective** | Verify accessing dashboard after logout redirects to login |
| **Preconditions** | User just logged out |
| **Test Steps** | 1. Log out 2. Try to navigate to `/dashboard` |
| **Test Data** | None |
| **Expected Result** | Redirected to `/login`; dashboard not accessible |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-LOGOUT-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-LOGOUT-003 |
| **Module** | Logout |
| **Feature** | Admin Logout |
| **Objective** | Verify admin logout clears admin session |
| **Preconditions** | Admin logged in |
| **Test Steps** | 1. Logout from admin panel 2. Try to access `/admin` |
| **Test Data** | Admin session |
| **Expected Result** | Admin session cleared; redirected to `/admin/login` |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

---

## 25. Mobile Responsive

### TC-MOB-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-MOB-001 |
| **Module** | Mobile Responsive |
| **Feature** | Landing Page — Mobile |
| **Objective** | Verify landing page renders correctly on 375px width (iPhone SE) |
| **Preconditions** | Chrome DevTools: 375×667 viewport |
| **Test Steps** | 1. Open DevTools 2. Set viewport 375×667 3. Navigate to `/` |
| **Test Data** | Device: iPhone SE |
| **Expected Result** | No horizontal overflow; nav hamburger visible; content readable |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-MOB-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-MOB-002 |
| **Module** | Mobile Responsive |
| **Feature** | Public Invitation — Mobile |
| **Objective** | Verify public invitation is usable on mobile |
| **Preconditions** | Mobile viewport (375px) |
| **Test Steps** | 1. Visit public invitation on 375px 2. Open envelope 3. Scroll through all sections |
| **Test Data** | Any complete invitation |
| **Expected Result** | All sections fit within viewport; text readable; buttons tappable |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-MOB-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-MOB-003 |
| **Module** | Mobile Responsive |
| **Feature** | Editor — Mobile |
| **Objective** | Verify invitation editor is usable on tablet (768px) |
| **Preconditions** | Tablet viewport (768px) |
| **Test Steps** | 1. Open editor on 768px viewport 2. Navigate through all tabs |
| **Test Data** | None |
| **Expected Result** | All tabs accessible; form fields visible and usable |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-MOB-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-MOB-004 |
| **Module** | Mobile Responsive |
| **Feature** | RSVP Form — Mobile |
| **Objective** | Verify RSVP form is fully usable on mobile |
| **Preconditions** | Mobile viewport |
| **Test Steps** | 1. Visit invitation on mobile 2. Tap RSVP button 3. Fill and submit form |
| **Test Data** | Mobile device simulation |
| **Expected Result** | Modal fully visible; keyboard doesn't cover inputs; submit works |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-MOB-005
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-MOB-005 |
| **Module** | Mobile Responsive |
| **Feature** | Dashboard — Mobile |
| **Objective** | Verify buyer dashboard is usable on mobile |
| **Preconditions** | Mobile viewport, buyer logged in |
| **Test Steps** | 1. Login on 375px viewport 2. View dashboard |
| **Test Data** | Mobile viewport |
| **Expected Result** | Invitation list readable; action buttons accessible; no overflow |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

---

## 26. Browser Compatibility

### TC-BROWSER-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-BROWSER-001 |
| **Module** | Browser Compatibility |
| **Feature** | Chrome — Full Smoke Test |
| **Objective** | Verify core flows work in Chrome (latest) |
| **Preconditions** | Chrome latest version |
| **Test Steps** | Run Smoke Test Checklist in Chrome |
| **Test Data** | Chrome latest |
| **Expected Result** | All smoke test items pass |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-BROWSER-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-BROWSER-002 |
| **Module** | Browser Compatibility |
| **Feature** | Safari — Invitation View |
| **Objective** | Verify invitation opens and plays music in Safari |
| **Preconditions** | Safari on macOS or iOS |
| **Test Steps** | 1. Visit public invitation in Safari 2. Open envelope 3. Check music behavior |
| **Test Data** | Safari latest |
| **Expected Result** | Invitation renders; envelope animates; music autoplay follows Safari policy |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-BROWSER-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-BROWSER-003 |
| **Module** | Browser Compatibility |
| **Feature** | Firefox — RSVP Submission |
| **Objective** | Verify RSVP form works in Firefox |
| **Preconditions** | Firefox latest version |
| **Test Steps** | 1. Visit invitation in Firefox 2. Submit RSVP |
| **Test Data** | Firefox latest |
| **Expected Result** | RSVP submits successfully |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-BROWSER-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-BROWSER-004 |
| **Module** | Browser Compatibility |
| **Feature** | Edge — Login & Dashboard |
| **Objective** | Verify login and dashboard work in Edge |
| **Preconditions** | Edge latest version |
| **Test Steps** | 1. Login in Edge 2. View dashboard |
| **Test Data** | Edge latest |
| **Expected Result** | Session works; dashboard loads correctly |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

---

## 27. Performance

### TC-PERF-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PERF-001 |
| **Module** | Performance |
| **Feature** | Landing Page Load Time |
| **Objective** | Verify landing page loads within acceptable time |
| **Preconditions** | Network: Regular 4G simulation in DevTools |
| **Test Steps** | 1. Open DevTools → Network tab 2. Simulate 4G 3. Load `/` 4. Note DOMContentLoaded |
| **Test Data** | 4G network |
| **Expected Result** | DOMContentLoaded < 3 seconds; LCP < 2.5 seconds |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-PERF-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PERF-002 |
| **Module** | Performance |
| **Feature** | Public Invitation Load Time |
| **Objective** | Verify invitation loads quickly for guests |
| **Preconditions** | Complete invitation with gallery |
| **Test Steps** | 1. Clear cache 2. Open public invitation 3. Measure time to interactive |
| **Test Data** | Invitation with 4 gallery images |
| **Expected Result** | Invitation interactive within 4 seconds on 4G |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-PERF-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-PERF-003 |
| **Module** | Performance |
| **Feature** | Editor Save Response Time |
| **Objective** | Verify save operation completes in reasonable time |
| **Preconditions** | Invitation editor open |
| **Test Steps** | 1. Modify several fields 2. Click Save 3. Measure response time |
| **Test Data** | Standard invitation |
| **Expected Result** | Save completes and success toast appears within 2 seconds |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Medium |

---

## 28. File Upload Validation

### TC-UPLOAD-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-UPLOAD-001 |
| **Module** | File Upload |
| **Feature** | Invalid File Type |
| **Objective** | Verify non-image file types are rejected |
| **Preconditions** | Gallery tab open |
| **Test Steps** | 1. Try to upload a .pdf or .exe file |
| **Test Data** | File: document.pdf |
| **Expected Result** | Error shown: invalid file type. Upload rejected. |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-UPLOAD-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-UPLOAD-002 |
| **Module** | File Upload |
| **Feature** | File Too Large — Gallery |
| **Objective** | Verify files exceeding the size limit are rejected |
| **Preconditions** | Gallery tab open |
| **Test Steps** | 1. Try to upload a 15MB JPEG |
| **Test Data** | File: large.jpg, 15MB |
| **Expected Result** | Error shown: file too large; upload rejected |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-UPLOAD-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-UPLOAD-003 |
| **Module** | File Upload |
| **Feature** | Logo Upload — Valid PNG |
| **Objective** | Verify transparent PNG logo uploads correctly |
| **Preconditions** | Cover tab open |
| **Test Steps** | 1. Upload a transparent PNG logo 2. Save |
| **Test Data** | File: logo.png, 300KB |
| **Expected Result** | Logo displayed on invitation cover |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-UPLOAD-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-UPLOAD-004 |
| **Module** | File Upload |
| **Feature** | Upload Before Token Exists |
| **Objective** | Verify QR/logo upload buttons are disabled before first save |
| **Preconditions** | Brand new invitation not yet saved |
| **Test Steps** | 1. Create new invitation (unsaved) 2. Go to Gift tab 3. Try to upload QR |
| **Test Data** | New unsaved invitation |
| **Expected Result** | Upload button disabled with tooltip "Save invitation first" |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-UPLOAD-005
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-UPLOAD-005 |
| **Module** | File Upload |
| **Feature** | Zero-byte File |
| **Objective** | Verify empty/zero-byte files are rejected |
| **Preconditions** | Gallery tab open |
| **Test Steps** | 1. Try to upload a 0-byte file |
| **Test Data** | File: empty.jpg (0 bytes) |
| **Expected Result** | Upload rejected with error |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Medium |

---

## 29. Security

### TC-SEC-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-SEC-001 |
| **Module** | Security |
| **Feature** | IDOR — Edit Another User's Invitation |
| **Objective** | Verify user cannot edit another user's invitation |
| **Preconditions** | Two buyer accounts; each has an invitation |
| **Test Steps** | 1. Login as Buyer A 2. Note Buyer B's invitation token 3. Try PATCH /api/invitation/:buyerB_token |
| **Test Data** | Buyer B's token |
| **Expected Result** | 403 Forbidden; invitation not modified |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-SEC-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-SEC-002 |
| **Module** | Security |
| **Feature** | Admin Route Access by Buyer |
| **Objective** | Verify buyer cannot access admin API endpoints |
| **Preconditions** | Buyer logged in |
| **Test Steps** | 1. Login as buyer 2. Call GET /api/admin/orders directly |
| **Test Data** | Buyer session |
| **Expected Result** | 401 or 403 returned; no order data exposed |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-SEC-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-SEC-003 |
| **Module** | Security |
| **Feature** | XSS in Rich Text Fields |
| **Objective** | Verify stored XSS payload in rich text is sanitized |
| **Preconditions** | Invitation editor open |
| **Test Steps** | 1. Enter `<script>alert('xss')</script>` in greeting rich text 2. Save 3. Preview |
| **Test Data** | Payload: `<script>alert('xss')</script>` |
| **Expected Result** | Script tag stripped; no alert fires on preview |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-SEC-004
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-SEC-004 |
| **Module** | Security |
| **Feature** | CSRF — State-changing API Call |
| **Objective** | Verify cross-origin state-changing requests are blocked |
| **Preconditions** | Active buyer session |
| **Test Steps** | 1. From a different origin, attempt POST /api/invitation with session cookie |
| **Test Data** | Cross-origin POST |
| **Expected Result** | CORS policy blocks or rejects the request |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-SEC-005
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-SEC-005 |
| **Module** | Security |
| **Feature** | Unauthenticated API Access |
| **Objective** | Verify protected endpoints return 401 without a session |
| **Preconditions** | No active session |
| **Test Steps** | 1. Without logging in, call GET /api/auth/me |
| **Test Data** | No cookie |
| **Expected Result** | 401 Unauthorized |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-SEC-006
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-SEC-006 |
| **Module** | Security |
| **Feature** | SQL Injection in Login |
| **Objective** | Verify SQL injection payload in login does not bypass auth |
| **Preconditions** | None |
| **Test Steps** | 1. Enter email: `admin'--` and any password 2. Submit login |
| **Test Data** | Email: `admin'--` |
| **Expected Result** | Login fails normally; no SQL error exposed; no bypass |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

---

## 30. Session Timeout

### TC-SESSION-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-SESSION-001 |
| **Module** | Session Timeout |
| **Feature** | Session Persistence |
| **Objective** | Verify session persists on page refresh |
| **Preconditions** | Buyer logged in |
| **Test Steps** | 1. Login 2. Refresh the page |
| **Test Data** | Active session |
| **Expected Result** | Still logged in after refresh; dashboard loads without re-login |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | High |

### TC-SESSION-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-SESSION-002 |
| **Module** | Session Timeout |
| **Feature** | Session Cookie Security |
| **Objective** | Verify session cookie has correct security attributes |
| **Preconditions** | Any logged-in user |
| **Test Steps** | 1. Login 2. Inspect cookies in DevTools 3. Check connect.sid cookie attributes |
| **Test Data** | Active session |
| **Expected Result** | Cookie has: HttpOnly=true, Secure=true, SameSite=None |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-SESSION-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-SESSION-003 |
| **Module** | Session Timeout |
| **Feature** | Cookie Cleared on Logout |
| **Objective** | Verify session cookie is cleared after logout |
| **Preconditions** | Buyer logged in |
| **Test Steps** | 1. Inspect cookies pre-logout (note connect.sid) 2. Logout 3. Inspect cookies again |
| **Test Data** | Active session |
| **Expected Result** | `connect.sid` cookie removed or expired after logout |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

---

## 31. Broken Links

### TC-LINKS-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-LINKS-001 |
| **Module** | Broken Links |
| **Feature** | Navigation Links — Marketing Pages |
| **Objective** | Verify all nav links on marketing pages navigate correctly |
| **Preconditions** | None |
| **Test Steps** | 1. Navigate to `/` 2. Click each nav item: Catalog, Pricing, FAQ, Reviews, For Business |
| **Test Data** | None |
| **Expected Result** | Each link navigates to the correct page without 404 |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-LINKS-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-LINKS-002 |
| **Module** | Broken Links |
| **Feature** | 404 Page |
| **Objective** | Verify navigating to unknown URL shows 404 page |
| **Preconditions** | None |
| **Test Steps** | 1. Navigate to `/nonexistent-page` |
| **Test Data** | Route: /nonexistent-page |
| **Expected Result** | 404 Not Found page displayed with home navigation link |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Low |

---

## 32. API Error Handling

### TC-API-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-API-001 |
| **Module** | API Error Handling |
| **Feature** | Server 500 — Editor Save |
| **Objective** | Verify editor handles server error gracefully on save |
| **Preconditions** | Editor open; simulate server error (disable DB) |
| **Test Steps** | 1. Make edit 2. Click Save during server downtime |
| **Test Data** | Simulated 500 error |
| **Expected Result** | Error toast shown; data not lost (state retained in editor) |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-API-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-API-002 |
| **Module** | API Error Handling |
| **Feature** | ToyyibPay Unavailable |
| **Objective** | Verify payment flow handles ToyyibPay API failure |
| **Preconditions** | ToyyibPay API unreachable (mock/simulate) |
| **Test Steps** | 1. Initiate payment when ToyyibPay is down |
| **Test Data** | API unavailable |
| **Expected Result** | 502 returned; error message shown to user; order marked FAILED |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-API-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-API-003 |
| **Module** | API Error Handling |
| **Feature** | RSVP Submit — 429 Rate Limit |
| **Objective** | Verify user sees friendly message on rate limit |
| **Preconditions** | RSVP endpoint rate limit active |
| **Test Steps** | 1. Submit multiple RSVPs rapidly |
| **Test Data** | Rapid repeated submits |
| **Expected Result** | User-friendly error message "Too many attempts, try again later" |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

---

## 33. Empty States

### TC-EMPTY-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-EMPTY-001 |
| **Module** | Empty States |
| **Feature** | Dashboard — No Invitations |
| **Objective** | Verify empty state shown on dashboard with no invitations |
| **Preconditions** | New buyer account |
| **Test Steps** | 1. Login as new buyer 2. View dashboard |
| **Test Data** | Zero invitations |
| **Expected Result** | Empty state illustration/message and "Create" CTA shown |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | Medium |

### TC-EMPTY-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-EMPTY-002 |
| **Module** | Empty States |
| **Feature** | RSVP List — No RSVPs |
| **Objective** | Verify empty state when no RSVPs submitted |
| **Preconditions** | Invitation with RSVP enabled, 0 RSVPs |
| **Test Steps** | 1. View RSVP dashboard for invitation with 0 RSVPs |
| **Test Data** | 0 RSVPs |
| **Expected Result** | Empty state message shown; no broken table/list |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Low |

### TC-EMPTY-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-EMPTY-003 |
| **Module** | Empty States |
| **Feature** | Payment History — No Orders |
| **Objective** | Verify empty state when no payment orders exist |
| **Preconditions** | New buyer with no orders |
| **Test Steps** | 1. Login as new buyer 2. View payment history |
| **Test Data** | 0 orders |
| **Expected Result** | Empty state message; no error or broken UI |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Low |

---

## 34. Network Failure

### TC-NET-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-NET-001 |
| **Module** | Network Failure |
| **Feature** | Offline — Dashboard Load |
| **Objective** | Verify app shows appropriate message when offline on dashboard |
| **Preconditions** | Buyer logged in; then go offline |
| **Test Steps** | 1. Login 2. Disable network in DevTools 3. Navigate to dashboard |
| **Test Data** | Network: Offline |
| **Expected Result** | Error state or cached content; no unhandled crash |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Medium |

### TC-NET-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-NET-002 |
| **Module** | Network Failure |
| **Feature** | Offline — RSVP Submit |
| **Objective** | Verify RSVP submit fails gracefully when offline |
| **Preconditions** | Offline network |
| **Test Steps** | 1. Go offline 2. Attempt to submit RSVP |
| **Test Data** | Network: Offline |
| **Expected Result** | Network error shown; form data preserved; user prompted to retry |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Medium |

### TC-NET-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-NET-003 |
| **Module** | Network Failure |
| **Feature** | Slow Network — Image Loading |
| **Objective** | Verify gallery images show loading state on slow connection |
| **Preconditions** | Slow 3G network simulation |
| **Test Steps** | 1. Simulate Slow 3G 2. Visit public invitation with gallery |
| **Test Data** | Slow 3G, 4 gallery images |
| **Expected Result** | Loading skeleton or spinner shown while images load; no layout shift crash |
| **Actual Result** | |
| **Status** | |
| **Priority** | P3 |
| **Severity** | Low |

---

## 35. Duplicate Submission

### TC-DUP-001
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-DUP-001 |
| **Module** | Duplicate Submission |
| **Feature** | RSVP — Double Submit |
| **Objective** | Verify double-clicking RSVP submit does not create duplicate entries |
| **Preconditions** | RSVP form open |
| **Test Steps** | 1. Fill RSVP form 2. Double-click Submit rapidly |
| **Test Data** | Same RSVP data |
| **Expected Result** | Only one RSVP created; DB UNIQUE constraint prevents duplicates |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

### TC-DUP-002
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-DUP-002 |
| **Module** | Duplicate Submission |
| **Feature** | Payment — Double Bill Creation |
| **Objective** | Verify double-clicking "Pay" does not create two orders |
| **Preconditions** | Unpaid invitation, payment form visible |
| **Test Steps** | 1. Click "Pay" 2. Quickly click "Pay" again before redirect |
| **Test Data** | Unpaid invitation |
| **Expected Result** | Only one order created; second request reuses existing PENDING bill or returns error |
| **Actual Result** | |
| **Status** | |
| **Priority** | P1 |
| **Severity** | Critical |

### TC-DUP-003
| Field | Detail |
|-------|--------|
| **Test Case ID** | TC-DUP-003 |
| **Module** | Duplicate Submission |
| **Feature** | Register — Double Submit |
| **Objective** | Verify double-submitting register form does not create duplicate accounts |
| **Preconditions** | Register form with valid data |
| **Test Steps** | 1. Fill register form 2. Double-click Register |
| **Test Data** | Valid registration data |
| **Expected Result** | Only one account created; second request gets 409 or is de-duped |
| **Actual Result** | |
| **Status** | |
| **Priority** | P2 |
| **Severity** | High |

---

## 36. Smoke Test Checklist

> **Purpose:** Minimal set of tests to verify the build is stable enough to proceed with full testing. Run after every deployment.

| # | Test | Pass / Fail |
|---|------|-------------|
| 1 | Landing page (`/`) loads without errors | |
| 2 | New buyer can register at `/register` | |
| 3 | Buyer can login at `/login` | |
| 4 | Buyer dashboard (`/dashboard`) loads | |
| 5 | New invitation can be created | |
| 6 | Invitation editor opens and loads design | |
| 7 | Save draft works (PATCH 200) | |
| 8 | Preview opens public invitation | |
| 9 | Public invitation envelope animation plays | |
| 10 | RSVP form opens and submits | |
| 11 | Payment bill creation returns paymentUrl | |
| 12 | Admin can login at `/admin/login` | |
| 13 | Admin dashboard (`/admin`) loads | |
| 14 | Logout clears session | |
| 15 | Unauthenticated access to `/dashboard` redirects to `/login` | |

---

## 37. Regression Test Checklist

> **Purpose:** Full feature regression after code changes. Run before any release.

### Authentication
- [ ] TC-AUTH-001 Buyer registration
- [ ] TC-AUTH-002 Business registration
- [ ] TC-AUTH-003 Duplicate email blocked
- [ ] TC-AUTH-007 Buyer login
- [ ] TC-AUTH-008 Business login
- [ ] TC-AUTH-009 Wrong password rejected
- [ ] TC-AUTH-011 Admin login
- [ ] TC-AUTH-015 Protected route redirect

### Dashboard
- [ ] TC-DASH-001 Buyer dashboard loads
- [ ] TC-DASH-003 Business dashboard loads
- [ ] TC-DASH-004 Payment history loads
- [ ] TC-DASH-005 Paid invitation badge

### Invitation CRUD
- [ ] TC-INV-001 Create invitation
- [ ] TC-INV-003 Edit invitation
- [ ] TC-INV-004 Delete invitation
- [ ] TC-INV-005 Edit lock after event date
- [ ] TC-INV-009 Expired invitation redirect

### Editor
- [ ] TC-EDITOR-001 Tab visibility Basic
- [ ] TC-EDITOR-002 Tab visibility Premium
- [ ] TC-EDITOR-003 Save all fields
- [ ] TC-EDITOR-005 Package lock after payment

### Theme
- [ ] TC-THEME-001 Design code selection
- [ ] TC-THEME-002 Name font renders
- [ ] TC-THEME-003 Body font renders
- [ ] TC-THEME-007 Language toggle

### Gallery
- [ ] TC-GAL-001 Upload JPEG
- [ ] TC-GAL-003 Max 4 images limit
- [ ] TC-GAL-005 Gallery visible on public invitation
- [ ] TC-GAL-006 Gallery hidden for Basic

### Music
- [ ] TC-MUS-001 Valid YouTube URL
- [ ] TC-MUS-003 Music on public invitation

### RSVP
- [ ] TC-RSVP-001 Guest attending RSVP
- [ ] TC-RSVP-002 Guest not attending
- [ ] TC-RSVP-003 Duplicate RSVP
- [ ] TC-RSVP-004 Max guest limit
- [ ] TC-RSVP-006 Buyer RSVP dashboard

### Gift
- [ ] TC-GIFT-001 Enable gift section
- [ ] TC-GIFT-002 Upload QR code
- [ ] TC-GIFT-003 Max 2 QR codes

### Payment
- [ ] TC-PAY-001 Create bill sandbox
- [ ] TC-PAY-002 Payment success
- [ ] TC-PAY-003 Payment failed
- [ ] TC-PAY-005 Block repayment

### Admin
- [ ] TC-ADMIN-001 Admin login
- [ ] TC-ADMIN-008 Buyer cannot access admin

### Security
- [ ] TC-SEC-001 IDOR blocked
- [ ] TC-SEC-002 Admin route by buyer blocked
- [ ] TC-SEC-003 XSS sanitized
- [ ] TC-SEC-005 Unauthenticated API 401

### Session
- [ ] TC-LOGOUT-001 Logout clears session
- [ ] TC-LOGOUT-002 Post-logout redirect
- [ ] TC-SESSION-002 Cookie security attributes

---

## 38. UAT Checklist

> **Purpose:** User Acceptance Testing — verify the platform meets business requirements from an end-user perspective.

### Guest / Public User
- [ ] Can discover the platform via landing page
- [ ] Can browse invitation catalog without login
- [ ] Can view pricing page
- [ ] Can visit a public invitation link
- [ ] Envelope animation plays smoothly
- [ ] Can RSVP with name, attendance, and message
- [ ] Receives confirmation after RSVP
- [ ] Can view gift fund bank details
- [ ] Can view wishes carousel
- [ ] Can see location and open Google Maps / Waze
- [ ] Expired invitation redirects gracefully

### Buyer
- [ ] Can register as buyer
- [ ] Can login and reach dashboard
- [ ] Can create new invitation
- [ ] Can select a design from catalog
- [ ] Can fill all invitation content in editor
- [ ] Can upload gallery photos
- [ ] Can add music via YouTube URL
- [ ] Can configure RSVP settings
- [ ] Can add contact info
- [ ] Can preview invitation before payment
- [ ] Can complete payment via ToyyibPay sandbox
- [ ] Invitation shows Active after payment
- [ ] Can copy public invitation link
- [ ] Can copy RSVP share link
- [ ] Can view RSVPs from dashboard
- [ ] Can download payment receipt
- [ ] Can edit profile and change password

### Business Account
- [ ] Can register as business account
- [ ] Can login and reach business dashboard
- [ ] Can view client invitations
- [ ] Can copy RSVP share links per invitation
- [ ] Can upload business logo

### Admin
- [ ] Can login to admin panel
- [ ] Can view revenue statistics
- [ ] Can manage user roles
- [ ] Can create and edit pricing packages
- [ ] Can activate a card design
- [ ] Can moderate reviews
- [ ] Can upload wax seals
- [ ] Can use demo editor to preview designs

---

## 39. Release Checklist

> **Purpose:** Final checks before deploying to production.

### Code & Build
- [ ] All P1 test cases passed
- [ ] No critical or high severity open bugs
- [ ] Regression test suite completed
- [ ] No console errors on major pages

### Database
- [ ] Schema migrations applied to production
- [ ] Seed data verified (admin account, default pricing, active design)
- [ ] No orphaned DB records from migration

### Configuration
- [ ] `TOYYIBPAY_USER_SECRET_KEY` set in production secrets
- [ ] `SESSION_SECRET` set in production secrets
- [ ] `SEED_SECRET` set in production secrets
- [ ] `CF_R2_*` secrets set for image storage
- [ ] `TOYYIBPAY_SANDBOX` set to `false` for production
- [ ] `TOYYIBPAY_PUBLIC_BASE_URL` set to production domain

### Payment
- [ ] ToyyibPay callback URL updated to production domain
- [ ] ToyyibPay return URL updated to production domain
- [ ] End-to-end payment tested in sandbox before go-live

### Security
- [ ] Session cookie attributes verified (HttpOnly, Secure, SameSite=None)
- [ ] Admin login tested with production credentials
- [ ] No debug endpoints exposed in production
- [ ] XSS sanitization confirmed on rich text fields

### Performance
- [ ] Landing page loads < 3 seconds on 4G
- [ ] Public invitation loads < 4 seconds on 4G

### Monitoring
- [ ] Health endpoint (`/api/healthz`) returns 200
- [ ] Error logging confirmed working
- [ ] Deployment logs reviewed — no startup errors

### Post-Deploy
- [ ] Smoke test checklist run on production
- [ ] Custom domain (wedinstudio.com) resolves correctly
- [ ] HTTPS certificate valid
- [ ] One full E2E flow tested on production (register → pay → share → RSVP)

---

*End of WedInBytes Test Case Document — v1.0*
*Total Test Cases: 140+*
*Checklists: Smoke (15 items), Regression (50+ items), UAT (40+ items), Release (25+ items)*
