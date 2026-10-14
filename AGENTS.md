# Padre Pio Medical Centre — Agent Operating Contract

## Product and owner
- Product: patient-facing website/PWA and digital reception workflow for Padre Pio Medical Centre.
- Location supplied for the brief: Plot 16739, Gaborone West Phase 1, Gaborone, Botswana.
- User is product owner and final reviewer; GitHub is the source of truth.
- Mandatory foundation: clone of `gatshaayanda/the-plug`, audited branch `docs/flagship-repo-audit-2026-10-12`. The foundation's actual `CLONING.md`, `AGENTS_REPO_LABELED.md`, app-factory SOP, clone-reset checklist, and PWA contract govern the process.

## Customer outcome
Help visitors recognize the real entrance, find the clinic, understand verified patient information, request an appointment, and know that reception must confirm the booking. The website must work without installing the PWA.

## Reception outcome
Authorized staff can sign in, review requests, and persist truthful status changes and internal notes. UI visibility is not authorization; Firebase rules must enforce the same boundary.

## Clinical, privacy, and truth boundaries
- Do not invent hours, services, practitioner credentials, prices, medical-aid acceptance, contact channels, or emergency capabilities.
- Directory phone/email details are unverified leads and must not be published as verified contact details without clinic confirmation.
- Appointment request is not an appointment confirmation. Never claim confirmation until authorized staff records it.
- Collect only name, phone, preferred date/time, broad administrative category, and optional short non-clinical note. Explicitly discourage detailed symptoms, medical history, ID numbers, and sensitive health data.
- This is not an EMR, diagnostic/AI doctor, prescription service, or clinical decision-support tool.
- Keep patient records private, default-deny data access, and restrict staff actions to authenticated accounts with an explicit `admins/{uid}` role. Never create admin roles from the public client.
- Use a dedicated Firebase project and separate credentials. Never reuse source-project data, credentials, service workers, cache keys, or operational identity.
- Do not deploy, connect production services, deploy rules/indexes, mutate production data, or deploy hosting without explicit authorization.

## PWA and visual behavior
- Entrance video `public/videos/padre.mp4` is a muted, looping recognition cue; do not precache the 23 MB file. Use metadata preload and respect reduced-motion/data constraints in follow-up work.
- Keep a native `beforeinstallprompt` event and invoke it directly from the user's explicit install click. Platform instructions are fallback only. Installation is optional.
- Cache only public shell assets; never serve appointment forms, admin pages, or private patient data from cache.
- Both manifest definitions and metadata must agree. The SVG mark is a custom interim application mark, not a claim to be the clinic's official logo.
- Check contrast, focus, mobile layout, reduced motion, loading/empty/error states, and readable form controls.

## Workflow and verification
1. Inspect actual Git branch/head/status/remotes and source files.
2. Read The Plug's required clone documents; classify inherited systems KEEP / ADAPT / REPLACE / EXCLUDE with evidence.
3. Reset identity and isolate infrastructure before expanding workflows.
4. Make the smallest coherent change; inspect the diff and source callers.
5. Run only checks actually executed: `npm ci`, `npm run verify:identity`, adapted `npm run verify:clone-readiness`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`.
6. Verify customer submission → persisted record → admin review → persisted status after refresh. Test unauthorized reads/writes and PWA behavior independently.
7. Mark every gate PASS / FAIL / NOT RUN / BLOCKED. Source inspection and a build do not prove Firebase, PWA, device, or deployed behavior.

## Current checkpoint
- Initial clone/video commit: `ca237b650709ab25d42bf0e5632d1a86f34f8eb3`.
- Current implementation branch: `fix/padre-pio-native-install-prompt` (PR #4 to `main`); latest code checkpoint before documentation updates: `210f870e8368f3de31e7c3ff8c64db5784d0bf34`.
- The branch captures `beforeinstallprompt` before hydration, invokes the native prompt from the header action when available, and provides embedded-browser handoff/fallback instructions. The home page now offers common care-enquiry categories, explicitly labelled as enquiries rather than verified Padre Pio services; the request form preselects the chosen category, explains reception follow-up, and Firestore rules/admin labels accept the same categories.
- GitHub Actions quality workflow and Vercel preview are running for the latest code commit. No live Firebase request/read/update, Firebase rules deployment, real-device installation, or production deployment has been performed by the assistant.
- Dedicated Firebase project configuration, canonical domain, verified clinic contacts/services/hours, and real-device PWA/icon checks remain unresolved.
