---
name: Billplz callback format
description: Billplz server-to-server callback uses flat keys; return-URL uses billplz[key] bracketed keys. Both must be handled.
---

## Rule
Billplz sends **two different key formats** depending on the endpoint:

- **Server-to-server callback (POST)** → flat keys: `id`, `paid`, `state`, `amount`, `x_signature`, `reference_1`, etc.
- **Return-URL redirect (GET)** → bracketed keys: `billplz[id]`, `billplz[paid]`, `billplz[x_signature]`, etc.

## Why
Discovered via production callback log showing `debugParams: {}` (empty) while `rawBodyKeys` had flat keys. Our parser only handled bracketed/nested format, silently discarding all flat-key callbacks → X-Signature always "invalid" → every paid order stayed PENDING.

## How to apply
- `parseBillplzCallbackParams` detects format by checking if any key starts with `billplz[` and passes flat keys through as-is.
- `isValidBillplzSignature` detects format via `isBracketed` flag:
  - Bracketed: exclude `billplz[x_signature]`, sign with `billplz[key]|value` pairs.
  - Flat: exclude `x_signature`, sign with `key|value` pairs.
- Callback route handler: extract `billId`, `paidStr`, `orderReference`, `state` using `isBracketed` guard on `params`.
