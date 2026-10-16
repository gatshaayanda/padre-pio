# Padre Pio Medical Centre — Project Operating Notes

## Product and workflow
- This is an existing Padre Pio project, not a new app. Preserve the working clinic site and patient request form; make the smallest verified changes.
- Customer-first journey: discover care enquiries, submit a request, receive a truthful receipt, then let reception review and contact the patient. A preferred date/time is not a reserved slot.
- The patient form deliberately discourages symptoms, medical history, ID numbers, and other sensitive health information. Do not weaken this copy or expand collection without a clear approved need.
- Reception access is a one-word login using the server-only `ADMIN_PASSWORD`; no email login, Google login, manually supplied admin UID, or hard-coded secret.
- Use the dedicated Firebase project and server-only `FIREBASE_ADMIN_KEY`. Keep secrets out of source control and never use a `NEXT_PUBLIC_` prefix for secrets. The Admin service-account `project_id` must match `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.
- Do not claim appointment confirmation or patient notification until the relevant action actually happens. Saving status/notes is an internal record update.
- Do not deploy, mutate live services/data, or change production configuration without explicit authorization. A push to `main` may trigger the configured Vercel Git deployment; do not manually deploy unless asked.

## Reception sign-in implementation
- `POST /api/admin-login` compares the supplied word against `ADMIN_PASSWORD` server-side using a constant-time digest comparison.
- After a correct word, it checks `admins/padre-pio-reception`. If missing, it creates the `owner` role; if an existing role is neither `owner` nor `staff`, access is refused rather than overwriting it.
- It issues a Firebase custom token for the fixed UID. The browser signs in with that token and rechecks the role before showing the private queue.
- This follows the established Tripple S one-word flow: do not add an unnecessary Firebase Auth `getUser` / `createUser` round-trip before issuing the custom token.
- `FIREBASE_ADMIN_KEY` is still needed for server-side Firestore access and custom-token issuance; this is not another access word. The server helper validates that the service account project matches the configured public Firebase project.
- One-word login currently has no persistent rate limiter; treat abuse protection as pre-production hardening and do not describe the endpoint as fully production-hardened.

## Clinical, privacy, and security boundaries
- This is not an EMR, diagnostic/AI doctor, prescription service, or clinical decision-support tool.
- Collect only name, phone, preferred date/time, broad administrative category, and optional short non-clinical note. Do not solicit detailed symptoms, medical history, or IDs.
- Keep patient records private and default-deny data access. Public clients must never create admin roles. Only the server may provision the fixed reception role after validating the access word.
- Do not expose secrets in logs or responses. Error logs may include the error message for authorized operators, but never credential values or submitted access words.
- Do not add permanent patient-record deletion without an approved retention policy and audit/recovery plan.
- Verify Firebase rules and authorization independently; a hidden button or visible login page is not a security boundary.

## PWA and UX
- Keep the native `beforeinstallprompt` event and invoke it directly from the user's explicit install click when supported. Platform instructions are fallback only; installation is optional.
- Cache only public shell assets. Never serve appointment forms, admin pages, or private patient data from cache.
- Keep mobile navigation discoverable and test narrow viewports, contrast, keyboard focus, reduced motion, loading/empty/error states, and readable form controls.
- Do not precache the 23 MB entrance video; use metadata preload and respect reduced-motion/data constraints.

## Verification and checkpoint discipline
- Inspect current Git branch/head/status/remotes and relevant source before editing.
- Run applicable checks and report only those actually executed: `npm run verify:identity`, adapted `npm run verify:clone-readiness`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`.
- Distinguish source inspection, automated checks, local runtime testing, deployed integration testing, and real-device testing. A build or deployment status does not prove Firebase login works.
- Verify the real journey: patient request submitted and persisted → request appears in reception → reception status persists after refresh. Test incorrect access word, correct access word, missing/invalid server credentials, unauthorized reads/writes, and role verification.
- Use PASS / FAIL / NOT RUN / BLOCKED with the expected behavior, procedure, environment, observation, and remaining gap.

## Checkpoint — reception sign-in simplification (2026-10-16)
- Commit `d379e8ceb3a215fb61b510453fda9a3b9c301df7` updates `src/app/api/admin-login/route.ts` to match the proven Tripple S one-word pattern: validate the server-held word, read/create the fixed Firestore admin role, refuse unexpected existing roles, then issue a custom token without the separate Auth `getUser` / `createUser` calls.
- The route retains the server-side access-word check, role boundary, no-store responses, and generic client-facing failure message. No secrets or Firebase data were changed by the source commit.
- Source-level implementation checkpoint only. Automated checks and deployed reception login are NOT RUN in this checkpoint; confirm them from actual CI and runtime evidence before claiming the live sign-in is fixed.
