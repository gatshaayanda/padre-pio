# Padre Pio Digital Reception — Source Map and Evidence Ledger

## Baseline
- Foundation repository: gatshaayanda/the-plug.
- Source branch: docs/flagship-repo-audit-2026-10-12.
- Target repository: gatshaayanda/padre-pio.
- Target branch baseline: main.
- First target checkpoint includes public/videos/padre.mp4 (23,440,877 bytes).
- The initial foundation's retail routes, scheduled reminders, shared-word operations login, messaging, and automatic Firebase rules deployment were not target requirements. The inherited reminder and Firebase deployment workflows were removed before feature work.

## Product scope
Patient: home → understand appointment request → enter minimal contact/preference details → consent → submit → receive request reference and non-confirmation notice → wait for reception.
Admin: Firebase email/password authentication → server verifies ID token and admins/{uid} role → list requests → update status/admin note → audit event persisted.

## Inheritance decisions
- KEEP/ADAPT: Next.js App Router, React, TypeScript, lint/build/CI structure, native PWA install-event capture, service-worker/offline approach, Firebase SDK/Admin SDK dependencies.
- REPLACE: storefront/homepage, appointment request model, admin UI, authentication flow, Firebase rules, manifests, icons, cache names, error/offline copy, metadata and app identity.
- EXCLUDE: sourcing requests, products, saved finds, retail orders, community feed, messaging, FCM, UploadThing, shared operations-word login, scheduled pickup reminders, analytics tied to retail behavior.
- BLOCKED until configured: Firebase project, service-account credentials, Firebase Authentication providers/admin users, deployed rules, canonical domain, clinic-approved contact details/hours/service catalogue/privacy retention policy.

## Source map
- src/app/page.tsx: patient-facing homepage and appointment request form.
- src/app/layout.tsx: metadata, install-event capture and PWA controller.
- src/app/pwa-register.tsx: service-worker registration, install prompt/fallback, online/offline feedback.
- public/sw.js: app-specific public shell/offline cache; no private route/API caching.
- src/app/api/appointments/route.ts: public request submission plus server-authorized admin listing/status changes.
- src/lib/server/firebase-admin.ts: dedicated project validation, Admin SDK, token/role verification.
- src/app/admin/page.tsx: admin sign-in and request queue.
- firestore.rules and storage.rules: client default-deny.
- scripts/identity.config.json, scripts/verify-identity.mjs, scripts/verify-clone-readiness.mjs: target-specific identity and static readiness checks.

## Verification ledger
- PASS — The target repository is pushed to GitHub main; initial commit ca237b650709ab25d42bf0e5632d1a86f34f8eb3 contains public/videos/padre.mp4.
- PASS — Removed inherited scheduled pickup-reminder workflow from main (commit e79662d1095b14afa5d1fcd13529e319f25f2b16).
- PASS — Removed inherited Firebase rules deployment workflow from main (commit 0427f441719d593f9d6d9fc2bb9c8598b1123d68).
- PASS — GitHub Actions quality run 38554693993 on commit 5625a55bd6bd04c79aef16b078afe56b1d78a8b9: npm ci, identity verification, target readiness, TypeScript, lint, and production build all passed.
- PASS — The subsequent commits fb36a25f2b3797b72c40d4652a67dc3c25ee4f1c and f7d9c1d8cbf857f9f8bd62af164dde11d42cbedf change only product research/continuity documentation; application source remains as tested in 5625a55.
- BLOCKED — live request persistence/admin workflow until the clinic's dedicated Firebase project, service account, Firebase Auth users, and role documents are configured.
- NOT RUN — video transcode, Android/iOS physical-device PWA, offline/reconnect, deployed behavior.
