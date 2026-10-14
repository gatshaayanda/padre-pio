# Padre Pio Medical Centre — Digital Reception

A mobile-first patient reception website and installable PWA for Padre Pio Medical Centre, Plot 16739, Gaborone West Phase 1, Gaborone, Botswana.

## Product boundary

Patients can understand the visit-request process, find the clinic, and submit an appointment request. A request is not a booked or confirmed appointment; reception must review it and contact the patient. This app is not an electronic medical record, diagnostic tool, prescription system, or emergency service.

The entrance video in public/videos/padre.mp4 shows the real place and is loaded only when motion preferences and data-saving settings allow it. A lightweight illustration remains as the fallback.

## Operations

The admin queue uses Firebase Authentication and a server-verified role document at admins/{uid}. Allowed roles are owner, staff, doctor, and reception. Every appointment read or status change is verified server-side. Firestore client rules are default-deny; the server uses a dedicated Firebase Admin service account.

## Local setup

Use Node 22, install from the lockfile with npm ci, and copy .env.example to .env.local. Configure a dedicated Firebase project before expecting appointment submissions or admin sign-in to work.

Required server configuration:
- FIREBASE_PROJECT_ID — the dedicated clinic Firebase project ID.
- FIREBASE_ADMIN_KEY — service-account JSON for that same project.

Required browser configuration for admin sign-in:
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_APP_ID

Set NEXT_PUBLIC_BASE_URL only when the canonical domain is known. Never reuse another app's credentials or production data. Create authorized Firebase Authentication users and their admins/{uid} role documents through a trusted administrative process.

## Verification

Run npm run verify:identity, npm run verify:clone-readiness, npx tsc --noEmit, npm run lint, npm run build, and git diff --check. These are code checks only; they do not prove Firebase is configured, appointments persist in a live project, rules are deployed, or the PWA works on physical devices.

## Launch checks still required

Clinic approval is needed for the contact number, official service categories, opening hours, privacy/retention contact, appointment handling process, canonical domain, and administrator accounts. The phone number currently shown is from public directory listings and has not been verified directly with the clinic. The 23 MB entrance video has not yet been transcoded; data-saving and reduced-motion visitors receive the illustration fallback.
