# Padre Pio Medical Centre — Labelled Repository Map

**Purpose:** current target-specific map for the Padre Pio Digital Reception clone. Source code and actual workflow configuration win over this document.

## Product boundary
A concise patient-facing site/PWA plus private reception queue. The public experience uses the real entrance video as a location cue and only publishes verified clinic facts. Initial data scope is appointment requests; no EMR, diagnosis, prescriptions, payments, uploads, loyalty, community, retail catalogue, or push notifications.

## Current target paths
- **A01** `src/app/page.tsx` — patient-facing landing page; location and entrance recognition.
- **A02** `src/app/layout.tsx` — app metadata, canonical base URL (only when configured), icons and root PWA controller.
- **A03** `src/app/globals.css` — inherited styles plus scoped Padre Pio responsive visual system.
- **A04** `src/app/manifest.ts` and `public/manifest.webmanifest` — parallel manifest definitions; keep aligned.
- **A05** `public/padre-pio-mark.svg` — custom interim app mark; not verified official clinic artwork.
- **A06** `public/sw.js` — isolated cache namespace and public-shell/offline strategy; never cache appointment/admin routes or video.
- **A07** `src/app/pwa-register.tsx` — native install prompt and platform fallback; website remains usable without installation.
- **A08** `src/app/offline/page.tsx` — truthful offline message.
- **B01** `src/app/appointments/request/page.tsx` — appointment request form; validates minimal admin details and writes only when dedicated Firebase web config exists.
- **B02** `firestore.rules` — default-deny rules; patient can create/read own request, authorized staff can read/update queue.
- **B03** `firestore.indexes.json` — currently empty; queue query is ordered by creation time only.
- **C01** `src/app/admin/page.tsx` — staff sign-in and private reception queue; role gate plus Firestore rules.
- **C02** `src/lib/firebase/client.ts` — inherited Firebase initialization; placeholder config remains build-only and must never be treated as a connected service.
- **C03** `storage.rules` — default deny; no upload workflow in initial scope.
- **D01** `scripts/identity.config.json` and `scripts/verify-identity.mjs` — identity contract/verifier; must be adapted to the target and pass on exact candidate SHA.
- **D02** `.env.example` — dedicated clinic environment variable names only; values intentionally blank.
- **D03** `public/videos/padre.mp4` — clinic entrance video, approximately 23 MB; codec, duration, poster and mobile bandwidth behavior not verified here.

## Inheritance decisions
- KEEP/ADAPT: Next.js/React/TypeScript base, scoped PWA install mechanics, accessible design patterns, Firebase SDK plumbing after dedicated project setup.
- REPLACE: all patient-facing retail copy/layout, app identity, offline copy, appointment workflow, admin queue, database rules/indexes, storage policy.
- EXCLUDE: sourcing/catalogue, Saved Finds, offers/community, retail orders, product uploads, old food-ordering/retail scheduled jobs, push/analytics not justified by brief.
- BLOCKED pending inspection: removal/quarantine of every inherited route/API/component and all legacy environment/deployment references; full identity verifier and readiness audit; actual package install/build; real Firebase project/rules and device PWA/icon checks.

## Acceptance traces
1. Visitor opens site → recognizes entrance → sees clinic location → starts appointment request.
2. Form validates name/phone/date/time/category/note → anonymous Firebase identity only when real config exists → write returns reference → confirmation explicitly says request received, not appointment confirmed.
3. Authorized staff signs in → role document verified → queue reads persisted requests → status/internal note saved → queue reflects persisted update after refresh.
4. Unauthenticated/non-admin direct reads and writes are denied by Firestore rules.
5. PWA native prompt is called from explicit user action when browser exposes `beforeinstallprompt`; fallback is platform-specific; app remains usable without installation.

## Verification evidence
No local dependency installation, typecheck, lint, build, emulator rules test, browser/device test, Firebase integration, or deployment test has been run by the assistant in this repository checkpoint. Do not infer a pass from source edits.
