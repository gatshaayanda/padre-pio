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
