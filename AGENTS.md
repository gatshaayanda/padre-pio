# Padre Pio Digital Reception — Agent Contract

## Product and workflow
The product owner is the final reviewer. The repository is the source of truth. Follow UNDERSTAND → INSPECT → PLAN → IMPLEMENT → VERIFY → CHECKPOINT. For this new app, the mandatory foundation was cloned from gatshaayanda/the-plug on docs/flagship-repo-audit-2026-10-12. The foundation is not proof that inherited workflows or services are safe to reuse.

Customer outcome: find the clinic, understand how to request an appointment, submit a minimal request, and receive an honest acknowledgement. Admin outcome: authorized reception staff review the persisted queue, update statuses, and record an audit trail.

## Non-negotiable boundaries
- An appointment request is not a confirmed appointment. Only authorized staff can set CONFIRMED.
- Do not invent clinic services, practitioners, credentials, prices, opening hours, emergency capabilities, testimonials, or medical outcomes.
- Do not collect medical history, symptoms, diagnoses, medication details, or attachments in the public form. Ask patients not to submit sensitive medical information.
- This is not an EMR, diagnostic tool, prescribing system, or emergency service.
- Never reuse another app's Firebase project, credentials, private records, domain, cache namespace, or operator access.
- Admin authorization must be verified server-side from Firebase ID token plus admins/{uid} role. Hiding the admin link is not authorization.
- Firestore and Storage client rules remain default-deny unless a separately reviewed requirement needs access.
- Do not deploy, change production services, deploy Firebase rules, or deploy to Vercel without explicit authorization.
- Installation is optional. Preserve the native beforeinstallprompt flow when supported; platform guidance is a fallback after an explicit install action, never a blocking replacement.
- The real entrance video is a recognition aid, not the whole design. Respect reduced motion and data-saving settings.
- Keep the interface concise, readable, responsive, accessible, and warm. Avoid generic stock medical imagery and unverified claims.

## Verification discipline
Distinguish source inspection, static checks, build, Firebase emulator/integration, physical-device PWA tests, and production behavior. Mark each criterion PASS, FAIL, NOT RUN, or BLOCKED. Never claim a build or live integration test unless actually run. After material changes, inspect the diff, update the labelled map, and record exact commit and unresolved blockers.


## Current checkpoint — 14 October 2026
- Candidate implementation is on `feat/padre-pio-digital-reception`, in draft PR #1. The product owner reviews before merge; no Vercel deployment or Firebase rules deployment has been performed.
- Current stack: Node 22, Next.js 15.5.27, Firebase JS SDK 12.19.0, Firebase Admin SDK 14.5.0. Keep the modular Firebase APIs; the server verifies Firebase ID tokens and `admins/{uid}` roles.
- The entrance video is a 9.29-second portrait H.264 asset (1080×1920, 24 fps), reduced from 23,440,877 to 5,968,032 bytes. The 162,432-byte WebP poster is extracted from the real entrance video. Playback is skipped for reduced-motion, save-data, and 2G connections.
- The patient journey includes an appointment request, truthful non-confirmation acknowledgement, concise FAQ/emergency guidance, location actions, privacy notice, and native PWA install prompt/fallback. Public service, hours, practitioner and contact details remain subject to clinic confirmation.
- CI on source commit `fe1f99b56f8b130f5244f78bb62ee6b6d6dda716` passed diff whitespace check, identity/readiness checks, TypeScript, lint, production build, and the production dependency audit gate.
- The production audit gate reports zero high/critical production vulnerabilities. The full audit still reports five high findings in the development-only ESLint dependency chain through `braces`/ `fast-glob`/ `micromatch`; the available suggested fix downgrades the Next lint config to an incompatible major. Review this again when a compatible patched dependency is published.
- Do not claim live appointment persistence, staff authorization, device installation, offline recovery, or deployed behavior until the clinic Firebase project/credentials/roles are configured and those workflows are tested.
