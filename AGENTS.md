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


## Locked visual and access conventions
- Keep the approved compact floating forest-green/gold PWA install surface, direct native prompt on supported browsers, dismiss control, and platform guidance only as fallback. Do not restore a permanent homepage install card or substitute instructions for the native prompt.
- Keep staff entry discreet in the homepage, appointment-request, and patient-account footers. Footer navigation is not an authorization boundary.
- Padre Pio reception login uses the Tripple S one-word access pattern only as a technical reference: the browser posts the access word to a server route, the server checks a secret from environment configuration, issues a Firebase custom token, and the existing client/admin role check remains in force.
- Unlike Tripple S's current implementation, Padre Pio's endpoint must never create or promote an `admins/{uid}` document from a public request. It requires `PADRE_PIO_ADMIN_UID` to point at an already-provisioned `admins/{uid}` with role `owner` or `staff`. Set `ADMIN_PASSWORD`, `FIREBASE_ADMIN_KEY`, and `PADRE_PIO_ADMIN_UID` only in the dedicated server environment; never commit secret values. The Admin SDK project must match `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.
- The one-word endpoint has no persistent rate limiter yet. Treat rate limiting/abuse protection as a pre-production hardening item; do not represent the login as production-hardened until verified.

## Tripple S repository inspection — reusable patterns and limits
Inspected Tripple S's `AGENTS.md`, `firestore.rules`, `src/app/book/book-form.tsx`, `src/app/api/bookings/route.ts`, `src/app/api/availability/route.ts`, `src/app/account/page.tsx`, `src/app/api/customer/bookings/route.ts`, `src/app/api/customer/profile/route.ts`, `src/app/api/customer/notifications/route.ts`, `src/components/NotificationSettings.tsx`, `src/lib/firebase/admin.ts`, and `src/app/admin/admin-gate.tsx` / `src/app/api/admin-login/route.ts`.
- Reuse conceptually: guest-first booking; anonymous Firebase identity; an optional post-submit account invitation; explicit Google account linking; server-side ID-token verification for private customer history; customer queries scoped to the authenticated UID; no silent merging when a Google identity already exists; separate opt-in for appointment updates versus marketing; status copy that distinguishes request received from confirmed.
- Do not copy Tripple S's product-specific wellness journal, garden/check-ins, offers, payment, treatment durations, or service catalogue into Padre Pio.
- Tripple S availability is built on configured opening hours, duration-aware slot generation, `slotReservations` occupancy documents, and server-side transactional reservation checks. Padre Pio has no verified operating hours, appointment durations, provider capacity, or approved live calendar yet. Keep the current preferred-date + broad-time request as a request, not a reserved slot. Only add actual selectable times after the clinic confirms its hours, slot interval, appointment types/durations, capacity, exceptions, and who owns the calendar. Never invent availability.
- Tripple S server routes use Firebase Admin SDK and validate customer identity from a verified bearer token. Padre Pio now uses the same separation for reading a patient's own request history; the API returns only reference, preferred timing, broad category, creation time and status—not phone, patient note, or reception-only notes.
- Tripple S uses `linkWithPopup` to preserve an anonymous UID when a customer secures the same guest session with Google. If the Google credential already belongs to another Firebase identity, histories are not silently merged. Padre Pio follows that truth boundary. Patients can still request visits without creating an account.
- Push notifications are a separate capability from account access. Do not add push/SMS reminders until delivery infrastructure, patient consent, message wording, opt-out, and real-device receipt can be verified. A status stored in Firestore does not prove a notification reached a patient.

## Implemented customer/reception changes on branch `feat/padre-footer-admin-and-patient-onboarding`
- Added discreet `Admin access` footer links on the homepage, appointment request page, and patient account page.
- Added optional `/account` patient space. It keeps guest access available, offers Google linking to secure the existing anonymous identity, and shows only the signed-in UID's request history through a server endpoint. A separate Google identity is not silently merged.
- Appointment success now offers `Keep my request with me`, leading to optional account setup; no account is required to submit a request.
- Added `src/lib/firebase/admin.ts`, which uses the server-only Firebase Admin SDK and rejects service credentials whose project differs from the configured public Firebase project.
- Added `/api/customer/appointments` to verify the Firebase ID token and query only `appointments.patientUid == token.uid`; response is private/no-store and omits patient notes and admin notes.
- Added `/api/admin-login` for the one-word access flow. It checks `ADMIN_PASSWORD` server-side, checks a pre-existing authorized role at `admins/{PADRE_PIO_ADMIN_UID}`, and mints a custom token only after that check. It does not create roles. Admin UI still rechecks the role after sign-in.
- Added the required environment variable names to `.env.example`; no secrets were added.
- GitHub Actions quality run #64 (`https://github.com/gatshaayanda/padre-pio/actions/runs/38682826277`) PASS on the final PR head: dependency install, identity verification, Padre Pio readiness, TypeScript, ESLint, and production build. The earlier readiness failure exposed an outdated assertion that forbade all `/account` routes; the check now verifies the Padre Pio-specific account route while still rejecting inherited retail routes. Vercel's status check remains failed because of the platform build-rate limit, not a reported source/build failure. Live Firebase credentials/rules, Google account linking, private-history authorization, one-word login, and real-device QA remain NOT RUN.

## Appointment and engagement acceptance criteria for QA
1. Guest path: submit a request with no account; only successful Firestore write shows a reference and success screen; the screen states the request is not confirmed.
2. Optional onboarding: `Keep my request with me` opens `/account`; dismissing/ignoring account setup does not affect the submitted request.
3. Account linking: on the same browser, link Google to the anonymous identity and confirm the same request appears in history. If Google is already linked to a different identity, the UI must explain that histories are not merged automatically.
4. Authorization: unauthenticated API request returns 401; signed-in patient sees only records with their own `patientUid`; response never includes phone, patient note, or admin note; responses use `Cache-Control: private, no-store`.
5. Reception login: missing server configuration returns a clear setup error; incorrect access word is rejected; correct word still fails unless the configured UID already has `owner` or `staff` role; successful custom-token sign-in must pass the existing role check.
6. Footer: homepage, request form, success state, and account page provide discreet navigation to `/admin`; footer visibility never grants access.
7. Availability: keep date/time as preferences until authoritative clinic hours/capacity and a conflict-safe calendar are supplied. No test may describe a requested time as reserved or confirmed.
8. Consent/retention: do not send marketing or push reminders without separate opt-in and verified send/receipt evidence.

## Current checkpoint
- Initial clone/video commit: `ca237b650709ab25d42bf0e5632d1a86f34f8eb3`.
- Baseline commit before the install correction: `3afce456771f3f4fbf7c51787f57e4711e0f999e`. Floating-install correction PR #6 (`https://github.com/gatshaayanda/padre-pio/pull/6`) was merged to `main` as `07556bf900b1741209199a21da341c1e9fd26dda`.
- Current `main` source inspection confirms `src/app/layout.tsx` renders `PwaRegister`; `src/app/pwa-register.tsx` renders `.padreFloatingInstall` after client initialization and calls the retained native `beforeinstallprompt` event from the explicit Install button click when available. `src/app/globals.css` contains the floating surface styles. Platform-specific help remains fallback behavior; installation is optional.
- The Vercel preview URL previously supplied for commit `26e099550c2e44ee7f9986f922d3b60dd6896fad` was built from an earlier revision whose component had the CSS but lacked the floating markup. That preview is not evidence of the merged `main` implementation. A fresh deployment from `main` and the resulting visible prompt still need verification.
- The home page offers common care-enquiry categories, explicitly labelled as enquiries rather than verified Padre Pio services; the request form preselects the chosen category, explains reception follow-up, and Firestore rules/admin labels accept the same categories.
- Verification: source inspection PASS for floating markup, layout mount, CSS, and native prompt handler. Automated checks on the latest `main` commit, a fresh Vercel deployment, and physical Android/iPhone installation remain NOT RUN. No Firebase data/rules changes or production service configuration changes have been made.
- Dedicated Firebase project configuration, canonical domain, verified clinic contacts/services/hours, and real-device PWA/icon checks remain unresolved.
