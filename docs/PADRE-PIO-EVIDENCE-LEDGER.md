# Padre Pio — Evidence Ledger

Updated: 2026-10-14

| Gate | Status | Evidence / limitation | Next action |
|---|---|---|---|
| 0. Source and target checkpoint | PASS | Repository: `gatshaayanda/padre-pio`. Initial video commit: `ca237b650709ab25d42bf0e5632d1a86f34f8eb3`. Candidate branch: `work/padre-pio-identity-reset`; draft PR #2 targets `main`. Main remains the video-seed checkpoint. | Continue on candidate branch; do not merge or deploy without authorization. |
| 1. Brief and inheritance decisions | PASS | Product contract and inheritance map are recorded in `AGENTS.md` and `AGENTS_REPO_LABELED.md`. The Plug's `CLONING.md`, labelled map, factory SOP, and reset checklist were inspected on `docs/flagship-repo-audit-2026-10-12`. | Revisit any unresolved route/data dependencies before removing more inherited code. |
| 2. Identity reset | NOT RUN | Candidate branch contains Padre Pio metadata, two aligned manifest definitions, a dedicated `padre-pio-` cache prefix, Padre Pio icon assets, and removal of retail-specific routes/assets/workflows in the PR diff. The identity verifier and actual PNG/install identity have not been executed/verified in this runtime. | Run identity/readiness gates on the candidate SHA; inspect remaining diff and assets. |
| 3. Infrastructure isolation | BLOCKED | Owner supplied dedicated web Firebase configuration for project `padre-pio-36c62`. This confirms intended client project values only; no evidence yet that values were applied to local/hosted runtime, Anonymous Auth and Email/Password Auth are enabled, Firestore is provisioned, rules/indexes are deployed, staff role documents exist, or canonical domain is known. No service-account credentials were supplied. | Apply public web values to local `.env.local`; verify Firebase Console settings and authorized domains; test rules in emulator or isolated project before any deployment. |
| 4. Customer/admin workflow | NOT RUN | Candidate source implements appointment request creation in Firestore and a staff reception queue. The request form currently writes directly through the Firebase Web SDK; Firestore rules are therefore the critical write boundary. No live write/read, staff login, status update, or post-refresh persistence has been tested. Requests are not represented as confirmed bookings on submission. | Verify request schema against rules, run emulator rules tests for anonymous/owner/staff/non-staff cases, then test request → queue → status update → refresh. |
| 5. Static gates | NOT RUN for current PR #2 head | Earlier candidate commit `1f52994de754ec2ba043e4c514b3282607d82be0` and its docs-only follow-up `11e17be7d5a8a403fab63957485ce0e986ceba3f` have recorded successful GitHub Actions runs (38558095574 and 38558286328). Those results do not prove the separate PR #2 candidate passed. The current runtime cannot reach GitHub from a local shell, so no local npm command was executed here. | Check CI against the exact PR #2 head after this checkpoint; do not reuse the other branch's green result. |
| 6. Browser/device/PWA | BLOCKED | The entrance video is present at `public/videos/padre.mp4`; reduced-motion/data-saver behavior and metadata preload are implemented in source. Android Chrome native install behavior, iOS Safari, real installed icon, offline/reconnect, and video codec/network performance are NOT RUN. | Test desktop/mobile browser and physical devices; installation remains optional. |
| 7. Candidate/release | NOT RUN | PR #2 is a draft review checkpoint. No merge, Vercel deployment, Firebase rules/index deployment, production data mutation, or real-device test is claimed. | Keep PR draft until required code gates and security checks have evidence; product owner handles Vercel shipping. |

## First customer flow and design rationale

Target flow: landing page → recognise the real entrance/location → choose “Request an appointment” → enter only administrative contact/preference details → receive a truthful request reference → reception reviews the private queue → authorised staff records a status → refresh and confirm the persisted status.

- Reduce cognitive load: one dominant next action, a short form, broad administrative categories, clear field labels, and helpful validation. Do not ask patients to recall or disclose detailed medical history in this first contact flow.
- Earn trust through real context and honest state: use the supplied entrance video as a recognition cue with a still/fallback path; clearly state that a request is not a confirmed booking.
- Make privacy legible: collect only the minimum data needed to contact the patient and coordinate a preferred time; warn users not to enter symptoms, medical history, identity numbers, or other sensitive clinical details. Keep reception records private and server/database authorization authoritative.
- Preserve access: the website works without installation; native installation is an optional return path, not a prerequisite. Respect reduced motion and data-saving settings.

Research informing these choices:
- Atherton et al., *Investigating Patient Use and Experience of Online Appointment Booking in Primary Care: Mixed Methods Study*, Journal of Medical Internet Research (2024): https://www.jmir.org/2024/1/e51931 — usability, awareness, practice processes, and digital-access differences affect uptake.
- Clarke et al., *Usability and cognitive load in the design of a personal health record*, Health Policy and Technology (2020): https://doi.org/10.1016/j.hlpt.2019.10.002 — recall-heavy intake tasks can raise cognitive load.
- Zhang, Luximon & Li, *Seeking medical advice in mobile applications: How social cue design and privacy concerns influence trust...*, Computers in Human Behavior (2022): https://doi.org/10.1016/j.chb.2021.107178 — privacy concerns can undermine trust, while appropriate social/context cues can support trust.

These are design inputs, not evidence that this interface has passed usability testing. Research conducted in other healthcare settings should not be assumed to predict outcomes in Botswana without local testing.

## Additional inspection — 2026-10-14

- **Security/design review:** The current `work/padre-pio-identity-reset` request form, admin queue, and `firestore.rules` use the same `patientName`/`patientNote` schema, so the basic client-side schema is aligned. Public request creation requires Firebase Authentication (the form signs in anonymously), limits field sizes, fixes initial status to `NEW`, and does not permit patients to read appointment records. Staff reads/updates require a role document. These are source-inspection findings, not emulator proof.
- **Release risk still open:** direct browser-to-Firestore submission has no server-side rate limit, idempotency key, or durable appointment event trail in this candidate. Anonymous authentication alone does not prevent scripted request flooding. A separate older branch (`feat/padre-pio-digital-reception`) has a server-side Admin SDK endpoint with request validation, hashed-address throttling, idempotent IDs, and appointment event records, but it uses a different appointment schema and admin UI/API contract. Copying only that route would break the candidate; do not mix the implementations piecemeal. Resolve this as one coherent implementation, then test it.

## PWA-to-first-request implementation checkpoint — 2026-10-14

- Branch: `fix/padre-pio-native-install-prompt`; PR #4 targets `main`; latest recorded code checkpoint `210f870e8368f3de31e7c3ff8c64db5784d0bf34`.
- Added a pre-hydration `beforeinstallprompt` capture and an install action that uses the native prompt when available, with embedded-browser handoff and platform fallback instructions. Website use remains available without installation.
- Replaced the empty patient-information placeholder with six care enquiry routes: general consultation, follow-up, health check/screening, child health/immunisation, women's health, and tests/wound-care. These are clearly presented as common primary-care enquiry types, not claims that Padre Pio provides each service. Reception must confirm availability.
- The selected enquiry type is carried into the appointment form. The form explains the three-step reception process and what happens after submission. The Firestore create-rule allowlist and staff queue labels were updated to use the same category enum.
- Static verification and preview for the latest code commit were running at the time of this note. Live Firebase submission, authorized queue visibility, status persistence after refresh, rules deployment, and physical-device PWA behavior remain NOT RUN.
- **Branch reconciliation:** `main` is five commits ahead of the shared video-seed base and the candidate is 56 commits ahead of that base. The five main-only changes are confined to `.github/workflows/firebase-rules-deploy.yml` and removal of `.github/workflows/pickup-reminders.yml`; no application source conflicts were shown by the compare summary. Still, do not force-push or merge blindly; preserve the main workflow changes when reconciling.
- **CI evidence:** GitHub Actions run `38558095574` passed on older branch commit `1f52994de754ec2ba043e4c514b3282607d82be0`. No workflow run was returned for current candidate checkpoint `d978f24a59f0fc843c832b1c3067bba7d89d4f38`. Therefore current candidate static gates remain NOT RUN, not PASS.

## Source-only observations

- The location shown in the interface was supplied in the project brief.
- Public directory phone/email details remain unverified and are not published as verified contact channels.
- No clinic-owned official logo, website, opening hours, service catalogue, or staff credentials have been verified.
- The Firebase web configuration supplied by the owner is public client configuration, not proof of Firebase service readiness. Never commit private service-account credentials.
