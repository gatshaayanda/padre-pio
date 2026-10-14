# Padre Pio Digital Reception — Source Map and Evidence Ledger

## Baseline
- Foundation repository: gatshaayanda/the-plug.
- Source branch: docs/flagship-repo-audit-2026-10-12.
- Target repository: gatshaayanda/padre-pio.
- Target branch baseline: main.
- Initial target checkpoint included public/videos/padre.mp4 (23,440,877 bytes).
- Current public/videos/padre.mp4 is 5,968,032 bytes (9.291667 seconds, H.264, 1080×1920, 24 fps); public/videos/padre-poster.webp is 162,432 bytes and was extracted from the real entrance video. The video is 74.5% smaller than the original.
- The initial foundation's retail routes, scheduled reminders, shared-word operations login, messaging, and automatic Firebase rules deployment were not target requirements. The inherited scheduled reminder workflow was removed from main; the automatic Firebase rules deployment workflow was replaced on main by a manual-only no-op guard, and neither workflow is included in the Padre Pio feature branch.

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
- PASS — The target repository was initialized from the mandatory The Plug audited branch and pushed to GitHub; the original entrance video was included in the initial target commit.
- PASS — Removed the inherited scheduled pickup-reminder workflow from main (commit e79662d1095b14afa5d1fcd13529e319f25f2b16).
- PASS — Main's automatic Firebase rules deployment was neutralized with a manual-only no-op guard; no Firebase deployment is performed by that workflow.
- PASS — GitHub Actions run 38558095574 on source code commit 1f52994de754ec2ba043e4c514b3282607d82be0 passed: diff whitespace check, npm ci, identity verification, target readiness, TypeScript, lint, production build, dependency audit summary, and the high/critical production audit gate. Earlier checks on fe1f99b56f8b130f5244f78bb62ee6b6d6dda716 also passed.
- PASS — Production dependency audit: `npm audit --omit=dev --audit-level=high` reports zero vulnerabilities. Full dependency audit reports five high findings in the development-only ESLint dependency chain (braces/fast-glob/micromatch); no critical or moderate findings remain. The currently suggested remediation downgrades eslint-config-next to an incompatible major, so this remains a documented dev-tooling risk until a compatible patch is available.
- PASS — Entrance video optimized from 23,440,877 bytes to 5,968,032 bytes (74.5% reduction); generated a 162,432-byte WebP poster from the actual entrance frame. Portrait rendering preserves the full frame instead of cropping it into a landscape hero.
- BLOCKED — Live request persistence/admin workflow until the clinic's dedicated Firebase project, service-account credentials, Firebase Authentication users, and role documents are configured.
- BLOCKED — Clinic confirmation of the phone number, official services, practitioners/credentials, opening hours/walk-in policy, privacy contact/retention policy, and canonical domain. The unverified directory number is not shown as a public call action; no call/WhatsApp action is shown until the clinic confirms its channel.
- NOT RUN — Firebase emulator/integration tests, real patient/admin workflow against a configured project, Android/iOS physical-device PWA installation, offline/reconnect recovery, and deployed behavior.
- NOT DEPLOYED — No Vercel deployment, production service change, or Firebase rules deployment has been performed. The feature branch is still a draft PR for product-owner review.
