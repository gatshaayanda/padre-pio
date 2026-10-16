# Padre Pio Medical Centre — Agent Operating Contract

## Product and owner
- Product: patient-facing website/PWA and digital reception workflow for Padre Pio Medical Centre.
- Location supplied for the brief: Plot 16739, Gaborone West Phase 1, Gaborone, Botswana.
- User is product owner and final reviewer; GitHub is the source of truth.
- Mandatory foundation: clone of `gatshaayanda/the-plug`, audited branch `docs/flagship-repo-audit-2026-10-12`. The foundation's actual `CLONING.md`, `AGENTS_REPO_LABELED.md`, app-factory SOP, clone-reset checklist, and PWA contract govern the process.

## Customer outcome
Help visitors recognize the real entrance, find the clinic, understand verified patient information, request an appointment, and know that reception must confirm the booking. The website must work without installing the PWA.

## Product direction — patient continuity and useful reception
- Build for Padre Pio's patients and doctors, not as a generic feature showcase or a copy of another client app. Each account feature must solve a concrete patient or reception problem.
- The primary journey stays guest-first: understand the clinic → request a visit → receive a reference and truthful next steps → optionally secure a patient identity → return to check reception's latest saved status and past request references.
- Account setup is optional but intentionally encouraged after the first successful request. Explain its real current benefits: retain access to this patient's request history, retrieve it on another device after linking Google, and check reception's latest saved status without searching for an old confirmation screen. Do not imply push alerts, clinical records, saved medical history, automatic booking, or faster care unless those capabilities exist and are verified.
- Do not ask patients to create an account before they can request care. A guest request must remain valid if the patient declines setup or Google sign-in fails.
- Keep patient accounts administrative, not clinical: appointment references, preferred timing, broad request category, and clinic-recorded request status only. No EMR, symptom tracking, diagnosis, prescription, or unverified service claims.
- Reception's useful workflow is a reliable queue: identify the patient request, contact the patient using the supplied phone, record the actual review/confirmation/cancellation status, and preserve a concise internal administrative note. A status saved in the dashboard is not a patient notification; make that distinction explicit.
- Competitive reference review (public pages checked 2026-10-15): Good Health 360 uses a preferred-date/time enquiry and explains its data use; Middle Star Clinic offers online booking alongside WhatsApp/phone access; Botsogo Jwame describes patient appointment access linked to staff scheduling. Use these as workflow evidence, not as a mandate to copy their full platforms. Sources: https://goodhealth.co.bw/ ; https://www.middlestarclinic.com/about/ ; https://botsogojwame.co.bw/ .

## Reception outcome
Authorized staff can sign in, review requests, and persist truthful status changes and internal notes. UI visibility is not authorization; Firebase rules must enforce the same boundary.

## Clinical, privacy, and truth boundaries
- Do not invent hours, services, practitioner credentials, prices, medical-aid acceptance, contact channels, or emergency capabilities.
- Directory phone/email details are unverified leads and must not be published as verified contact details without clinic confirmation.
- Appointment request is not an appointment confirmation. Never claim confirmation until authorized staff records it.
- Collect only name, phone, preferred date/time, broad administrative category, and optional short non-clinical note. Explicitly discourage detailed symptoms, medical history, ID numbers, and sensitive health data.
- This is not an EMR, diagnostic/AI doctor, prescription service, or clinical decision-support tool.
- Keep patient records private and default-deny data access. The server may provision the fixed reception account and its `admins/{uid}` role only after validating the server-held one-word access secret; never let the public client create admin roles.
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
- Reception login requirement: one access word, then entry to the admin dashboard. No email, Google sign-in, separately configured admin UID, or manual role-document provisioning. The browser posts the word to the server; the server checks `ADMIN_PASSWORD`, ensures the fixed `padre-pio-reception` Firebase identity exists, creates/sets its `admins/{uid}` owner role only after the correct word is verified, and issues a Firebase custom token. The client still verifies the resulting role.
- `FIREBASE_ADMIN_KEY` is a server-only Firebase service credential required by the private patient-history API and custom-token issuance; it is infrastructure configuration, not a second login factor or another word the user must enter. Keep it out of source control and ensure its project matches `NEXT_PUBLIC_FIREBASE_PROJECT_ID`. Never expose either server secret with a `NEXT_PUBLIC_` prefix.
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
- Added optional `/account` patient space. It keeps guest access available, offers Google linking to secure the existing anonymous identity, and shows only the signed-in UID's request history through a server endpoint. A separate Google identity is not silently merged. The account page explains cross-device continuity and lets a signed-in patient refresh reception statuses explicitly; it does not claim push notifications.
- Appointment success offers `Set up my patient account` after the request succeeds. Copy recommends setup and states its concrete benefit—returning to request history on another device and checking reception's latest saved status—while making clear that setup is optional and does not confirm a booking.
- Added `src/lib/firebase/admin.ts`, which uses the server-only Firebase Admin SDK and rejects service credentials whose project differs from the configured public Firebase project.
- Added `/api/customer/appointments` to verify the Firebase ID token and query only `appointments.patientUid == token.uid`; response is private/no-store and omits patient notes and admin notes.
- Added `/api/customer/appointments/claim` for the existing-Google-account edge case. It requires both a verified Google account token and the original verified anonymous-session token, then moves only appointment records belonging to that anonymous UID to the Google UID. It rejects other provider combinations and never returns appointment details. Runtime security testing remains required.
- Added `/api/admin-login` for one-word access. After validating `ADMIN_PASSWORD`, it provisions the fixed `padre-pio-reception` Firebase identity and its `owner` role automatically, then mints a custom token. No separately configured UID or manual role setup is required. Admin UI still rechecks the role after sign-in.
- Added the required environment variable names to `.env.example`; no secrets were added.
- GitHub Actions quality run #64 (`https://github.com/gatshaayanda/padre-pio/actions/runs/38682826277`) PASS on the final PR head: dependency install, identity verification, Padre Pio readiness, TypeScript, ESLint, and production build. The earlier readiness failure exposed an outdated assertion that forbade all `/account` routes; the check now verifies the Padre Pio-specific account route while still rejecting inherited retail routes. Vercel's status check remains failed because of the platform build-rate limit, not a reported source/build failure. Live Firebase credentials/rules, Google account linking, private-history authorization, one-word login, and real-device QA remain NOT RUN.

## Appointment and engagement acceptance criteria for QA
1. Guest path: submit a request with no account; only successful Firestore write shows a reference and success screen; the screen states the request is not confirmed.
2. Optional onboarding: `Set up my patient account` opens `/account` after successful submission; dismissing/ignoring setup does not affect the saved request. The invitation explains cross-device history and checking saved reception status without implying notifications.
3. Account linking: on the same browser, link Google to the anonymous identity and confirm the same request appears in history. If Google already belongs to another identity, signing into that Google account must submit both the verified original anonymous token and new Google token to the claim API; only the original guest UID's appointment records move to the Google UID. Verify missing/invalid tokens, wrong providers, and unrelated UIDs are rejected, then confirm the request appears exactly once in history.
4. Patient usefulness: after reception changes a request status, the patient can return to `/account` or use Refresh request status and see the saved value; no push notification is implied. Authorization: unauthenticated API request returns 401; signed-in patient sees only records with their own `patientUid`; response never includes phone, patient note, or admin note; responses use `Cache-Control: private, no-store`.
5. Reception login: missing server configuration returns a clear setup error; incorrect access word is rejected; correct access word provisions the fixed reception identity/owner role automatically and signs in without a manually configured UID; successful custom-token sign-in passes the client role check.
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

- Release handoff (2026-10-15): reception access PR #8 and patient-account PR #9 are merged. The latest production deployment inspected is still commit `d91d3f4c5e130a0a845da14a72f51cdb1a204d11`; the latest merged `main` code commit is `fa82eeeaed2b20f14ad0450aaf57b7d0a26a863f`. Direct Vercel Production deployment creation was rejected with HTTP 403 (insufficient permission). A successful deployment and runtime QA are NOT RUN; do not report the preview as production or claim live Firebase workflows passed.

- Install-banner copy correction (2026-10-15): commit `9d5090d1863bf09d611b406fde07bfb1a279146f` introduces the concise Tripple S-style install copy, then follow-up commit `c60ac599a48ef3273a8349e235abf46e27d8cb3b` removes unintended literal quotation marks from the rendered text: “Install Padre Pio Medical Centre” / “Keep the clinic one tap away.” It preserves the existing native `beforeinstallprompt` invocation, platform fallback behavior, and dismiss control. Automated build and live/device verification for this copy change remain pending.


## Appointment clarity and reception workflow update — 2026-10-15

- The preferred-date/time step now uses a prominent amber notice: **this is a request, not a booking; the preferred timing is not reserved; reception will contact the patient to confirm a suitable appointment**. Repeat the same point on the success screen after the request is saved. This is a copy/layout change only; it does not create a slot reservation or change request submission semantics.
- The reception queue remains the source for staff review. It now supports client-side search by patient name, phone or request reference and filtering by review-needed/current status across the bounded latest 100 records.
- The status selector exposes only transitions permitted by the current Firestore rules, reducing avoidable rejected updates. Saving status/internal notes is explicitly described as an internal record update; it does not send a patient notification.
- CRUD boundary: patients create their own request; authorised staff read the private queue and update status/internal note; owner-only deletion exists in Firestore rules but is intentionally not exposed as a routine UI action because these are patient administrative records and no retention/deletion workflow has been approved. Do not add permanent deletion without an explicit retention policy and an audit/recovery plan.
- Account relationship inspected against Tripple S: Padre Pio already submits anonymously, then optionally links Google on `/account` after the request. Successful `linkWithPopup` preserves the anonymous UID, so the original request remains associated; if Google already belongs to another UID, the explicit claim endpoint verifies both tokens and moves only that anonymous session's requests. No histories are silently merged. `/api/customer/appointments` verifies the ID token and returns only the signed-in UID's bounded request history, omitting phone and notes. Status refresh is manual; no notification delivery is claimed.
- Tripple S additionally persists a `profileConnected` flag after Google linking and surfaces it to staff. Padre Pio does not currently persist/show that flag; adding it requires a deliberately designed data/rules migration and should not be implied by the current account UI. Google account linking, claim edge cases, admin authorization and real Firestore behavior remain runtime QA items.
- Official references reviewed: Firebase account linking https://firebase.google.com/docs/auth/web/account-linking and anonymous authentication https://firebase.google.com/docs/auth/web/anonymous-auth; server-side ID-token verification https://firebase.google.com/docs/auth/admin/verify-id-tokens.
- This checkpoint changes only the appointment request messaging, reception queue usability and project documentation. Automated checks and deployed/runtime QA must be recorded from actual results for the new commit; source inspection alone is not a PASS.

## Responsive navigation checkpoint — 2026-10-16
- Source inspection found the homepage navigation was hidden below 560px without a mobile replacement. The mobile breakpoint now wraps the same three anchor links into a second header row so clinic location, care enquiries, and the visit process remain discoverable without horizontal overflow.
- The static clone-readiness gate checks that the mobile breakpoint keeps .padreNav visible. This is source-level protection, not a substitute for real viewport/browser testing.
- Reception one-word login is already implemented at /admin via POST /api/admin-login: ADMIN_PASSWORD is checked server-side, then the fixed padre-pio-reception Firebase identity/owner role is provisioned and a custom token is issued. No UID or manual role document is required. Actual access remains BLOCKED until the dedicated Firebase web config, matching server-only FIREBASE_ADMIN_KEY, and chosen ADMIN_PASSWORD are configured in the runtime environment. Never hard-code the access word or commit credentials.

## Reception sign-in simplification — 2026-10-16
- Commit `d379e8ceb3a215fb61b510453fda9a3b9c301df7` updates `src/app/api/admin-login/route.ts` to follow the established Tripple S one-word flow: validate the server-held access word, read/create the fixed Firestore admin role, refuse unexpected existing roles, then issue a custom token without the separate Firebase Auth `getUser` / `createUser` calls.
- The route retains server-side access-word verification, role checks, no-store responses, and a generic client-facing failure message. No secrets or Firebase data were changed by the source commit.
- Source inspection only. Automated checks and deployed reception login are NOT RUN; verify from actual CI and runtime evidence before claiming the live sign-in is fixed.
