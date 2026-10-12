# CLONING.md — Turn The Plug into a new Admin Hub app

**Purpose:** repeatable, evidence-led instructions for turning a clean clone of `gatshaayanda/the-plug` into a separately branded and independently configured Admin Hub app.

This guide is based on the current repository. It does **not** claim every subsystem is business-neutral or production-verified. The Plug contains product-specific routes, data schemas, legacy food-ordering code, Firebase rules, scheduled workflows and a shared operations-login design. A successful build is not proof that those can safely be reused unchanged.

## Non-negotiable rules

- Start from a clean clone and a known branch/commit. Never overwrite a working project or reset a dirty tree.
- Treat `AGENTS.md` as the coding-agent contract and `AGENTS_REPO_LABELED.md` as the source-linked map. Read both before making decisions.
- Classify every inherited subsystem as **KEEP**, **ADAPT**, **REPLACE**, or **EXCLUDE**, with source paths and a reason. Do not copy features just because they compile.
- A new app gets its own brand, canonical URL, Firebase project, service credentials, UploadThing configuration where needed, operator access, cache namespace and deployment target. Never reuse The Plug's production credentials or data.
- Never delete a legacy route, collection, field, Storage path, scheduled job or environment variable until its callers, historical links, deployed rules, jobs and live data have been checked.
- Do not deploy, mutate production data, or deploy Firebase rules/indexes as part of local verification. Release actions require explicit authorization.
- Mark each gate **PASS**, **FAIL**, **NOT RUN**, or **BLOCKED** and attach evidence. Never promote an assumption into a pass.

## Gate 0 — Establish the exact source

1. Clone the repository and enter it:
   ```bash
   git clone https://github.com/gatshaayanda/the-plug.git new-adminhub-app
   cd new-adminhub-app
   ```
2. Inspect reality before edits:
   ```bash
   git status --short --branch
   git log -5 --oneline --decorate
   git remote -v
   git rev-parse HEAD
   ```
3. Confirm the selected source commit and target branch with the product owner. If the work is based on an unmerged PR, explicitly clone/fetch that PR branch; a default-branch clone does not include unmerged foundation changes.
4. Read, in order:
   - `AGENTS.md`
   - `AGENTS_REPO_LABELED.md`
   - `docs/ADMIN-HUB-APP-FACTORY-SOP.md`
   - `docs/CLONE-RESET-CHECKLIST.md`
   - this `CLONING.md`
   - `README.md`, `package.json`, `.env.example`, `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `public/sw.js`, both manifest definitions, identity config/verifiers and CI/deployment workflows.
5. Capture the starting commit, status, source URL and any local changes in the evidence ledger. Stop if the source state is ambiguous or dirty.

**Gate passes when:** the source revision is recorded, the working tree is clean, and the agent can explain the source architecture and outstanding verification limits without guessing.

## Gate 1 — Decide what the new app actually is

Before renaming or editing code, write a one-page project brief containing:

- business, audience, launch locations and owner/operator roles;
- primary customer journey and primary admin workflow;
- content/entities and their lifecycle (draft, publish, pause, archive, complete);
- authentication requirements and what guests can do;
- messaging, upload, push, offline/PWA and analytics requirements;
- payment boundary (for example, request-only versus real checkout);
- integrations, budget constraints and deployment owner;
- explicit out-of-scope items and acceptance tests.

Then build an inheritance table:

| Subsystem | Decision | Evidence required |
|---|---|---|
| Storefront and page composition | KEEP / ADAPT / REPLACE / EXCLUDE | Actual page and component call sites |
| Customer request/account flows | KEEP / ADAPT / REPLACE / EXCLUDE | UI → API/helper → persisted schema → rules |
| Admin and operator access | KEEP / ADAPT / REPLACE / EXCLUDE | Route guards, server checks, admin records, rules |
| Firebase Auth/Firestore/Storage | KEEP / ADAPT / REPLACE / EXCLUDE | Client/admin initialization, schemas, rules, indexes |
| UploadThing | KEEP / ADAPT / REPLACE / EXCLUDE | Token, verified identity middleware, upload consumers |
| FCM and scheduled notifications | KEEP / ADAPT / REPLACE / EXCLUDE | Token lifecycle, endpoints, workflows, secrets, delivery evidence |
| PWA/install/offline/cache | KEEP / ADAPT / REPLACE / EXCLUDE | Layout, both manifests, service worker, offline route, device tests |
| Analytics | KEEP / ADAPT / REPLACE / EXCLUDE | Event writers, schema, privacy boundary, dashboard readers |
| Legacy routes/jobs/data | KEEP / ADAPT / REPLACE / EXCLUDE | All references plus live/deployed data and scheduled jobs |
| CI/deployment | KEEP / ADAPT / REPLACE / EXCLUDE | Workflow triggers, project IDs, secrets and branch conditions |

Do not proceed on any subsystem whose decision depends on unknown live data or deployment state. Record it as BLOCKED and design a safe non-destructive investigation.

## Gate 2 — Reset application identity completely

Update the following as one coherent change; a logo/title-only rename is not an identity reset.

1. **Package and visible identity:** `package.json` name; `src/app/layout.tsx` title, description, application name, canonical metadata, Open Graph/Twitter metadata and icon references; visible product copy, contact links and business-specific strings.
2. **Install identity:** `public/manifest.webmanifest` and `src/app/manifest.ts` must agree on name, short name, description, theme/background colors, start URL, scope and icon declarations. Do not assume one manifest replaces the other; the current repository defines both.
3. **Assets:** replace the app icon assets referenced by metadata and both manifests, including browser, Apple and installed-PWA icons. Check actual files, dimensions and MIME types.
4. **Service worker and caches:** update `public/sw.js` cache prefixes to a unique namespace for the new app, including shell and media caches. Ensure the canonical icon and offline assets belong to the new app. Never share a cache namespace with The Plug or another clone.
5. **Routing and canonical URLs:** inspect `src/app/robots.ts`, sitemap generation, notification/deep links and all base-URL fallbacks. Set one explicit production `NEXT_PUBLIC_BASE_URL`; eliminate contradictory defaults.
6. **Identity verifier:** edit `scripts/identity.config.json` for the new manifest name, short name, theme color, canonical icon, unique cache prefix, forbidden source identities and narrowly scoped legacy exceptions. Keep exceptions explicit and documented; do not weaken checks to make them pass.
7. **Source residue:** search all tracked text/configuration for The Plug's name, BOEMO/other client names, old domains, project IDs, contact details, colors, routes, collection names, icon paths, cache keys and secrets. Separate harmless historical documentation from executable residue; document any retained compatibility surface.
8. **App-specific verifier:** adapt `scripts/verify-clone-readiness.mjs` for the new app's real routes, schema and workflows. Its existing checks are The Plug-specific, not a universal app template.

Run the identity gate and fix every failure rather than bypassing it:

```bash
npm run verify:identity
```

**Gate passes when:** both manifest definitions, metadata, icon assets, cache namespace and forbidden-identity scan agree, and every retained old identity is a justified, narrowly scoped exception.

## Gate 3 — Separate infrastructure and secrets

1. Create or select a **dedicated Firebase project** for the new app. Do not point it at The Plug's Firebase project.
2. Register the new web app and populate a local `.env.local` from the documented `.env.example`. Keep secrets out of Git, logs, screenshots and client-side variables.
3. Review `src/lib/firebase` and server-side Firebase Admin initialization. Confirm exactly which public Firebase settings and server credentials each path consumes. Do not assume a variable is unused because it appears legacy.
4. Configure Firebase Authentication providers and authorized domains for the intended customer journey. Preserve guest-first access only if it is part of the new brief. Test account linking/collision behavior if identity linking is retained.
5. Review `firestore.rules`, `firestore.indexes.json`, `storage.rules` and `firebase.json` against the new schema and user roles. Rules must enforce access; hiding admin links is not authorization. Keep deny-all fallbacks.
6. If using UploadThing, configure its own token and preserve verified Firebase identity middleware for private uploads. Test unauthorized upload rejection and actual transfer separately.
7. If using FCM, configure VAPID and server credentials, review token ownership/cleanup, notification routes and scheduled jobs. A successful HTTP response or permission prompt does not prove device delivery.
8. Review `.github/workflows/firebase-rules-deploy.yml` and other workflows. Ensure project IDs, secret names, branch filters and trigger paths point to the new app. Keep deployment separate from test/preview branches.
9. Configure the new Vercel project and domain independently. Set environment variables per environment; verify the deployed alias and commit before calling it live.
10. Rotate/remove unused inherited secrets in the actual hosting/GitHub settings as a separately verified operation. Editing `.env.example` does not remove a configured secret.

Never paste secret values into chat or commit them. Record variable **names and purpose**, not values.

**Gate passes when:** the intended infrastructure/project IDs are documented, no inherited production credentials are reused, local configuration is present without committed secrets, and security rules/workflows have been reviewed against the new schema. Deployment is still a separate gate.

## Gate 4 — Adapt behavior and data deliberately

For every KEEP/ADAPT/REPLACE/EXCLUDE decision:

1. Trace the whole path: visible UI → event/form → API/server action/helper → authentication/authorization → database/storage write → reader/subscriber/admin view → error/retry path.
2. Name every collection/document schema, storage path, index, environment variable, cron trigger, external link and notification consumer touched by the flow.
3. Update customer and admin journeys together. A form that writes a record is not complete if the admin cannot process it or the customer cannot see its truthful status.
4. Keep request, quote, payment, order and fulfilment semantics honest. Do not imply that a request is paid, stock-reserved or accepted unless the system records that outcome.
5. Adapt analytics event names and payloads with their writers, readers, rules and privacy boundaries together.
6. Remove unused inherited features only after repository callers, historic URLs, scheduled jobs, deployed rules and live data have been accounted for. Prefer a compatibility redirect/migration plan where external links or records may exist.
7. Replace The Plug-specific assertions in the clone-readiness script with tests that express the new app's actual architecture. Add negative authorization checks and tests for empty, invalid, stale, duplicate and retry states where relevant.
8. Update `AGENTS_REPO_LABELED.md`, `AGENTS.md`, `README.md` and this guide if the foundation contract or procedure materially changes.

## Gate 5 — Prove locally before external systems

Install exactly from the lockfile and run the repository's available checks:

```bash
npm ci
npm run verify:identity
npm run verify:clone-readiness
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

If a command is missing or the app uses another package manager, stop and update the instructions based on repository evidence instead of pretending it ran. Record exact command, exit status and commit. Review the final diff and search for secrets and source identity residue.

Then run a local/manual test matrix for the actual brief:

- guest entry and primary customer journey;
- validation, retry and network failure without losing entered data;
- customer ownership boundaries and account linking/collision, if supported;
- admin allowed path and unauthorized/non-admin denied path;
- CRUD lifecycle and persistence after refresh;
- uploads, file restrictions, replacement and removal, if supported;
- push preference, server send outcome and actual receipt, if supported;
- PWA install prompt/handoff, installed name/icon, offline cached shell, offline limitations, reconnect and update behavior;
- responsive mobile/desktop layout, readable contrast, keyboard/focus and error/empty/loading states.

Automated/static gates are not substitutes for manual or live-system tests.

## Gate 6 — Verify staging/live integrations separately

Only use a dedicated non-production/staging environment unless production verification is explicitly authorized.

- Verify the deployed URL resolves to the intended commit and correct domain.
- Fetch the deployed manifest response and confirm its identity; do not infer it from source files.
- Test actual sign-in/guest session, database writes/reads, authorization denials and Storage rules with test accounts/data.
- Perform a real upload and verify both the stored object and the user-facing result.
- Send a test push and verify receipt on a real device; log outcomes without exposing device tokens.
- Test WhatsApp/social in-app browser handoff, native install prompt where available, iOS Add to Home Screen guidance where applicable, installed icon/name, offline navigation and reconnect/update behavior on physical devices.
- Verify scheduled workflows, secrets, indexes and deployed rules independently. A source change or green CI run does not deploy these systems.
- Clean up test records/files/tokens only when safe and authorized; record what was removed.

For anything not tested, write **NOT RUN** or **BLOCKED**, with the reason and exact next action.

## Gate 7 — Review, checkpoint and handoff

Before committing:

```bash
git status --short
git diff --stat
git diff --check
git diff
```

Search the diff for inherited brand names, domains, Firebase project IDs, collection paths, secrets and stale documentation. Confirm the changes are limited to the agreed brief and that unrelated working behavior was preserved.

Commit a focused, descriptive change. Push only to the intended feature branch. Confirm the remote head equals the tested commit, inspect CI for that exact SHA, and update the evidence ledger.

The handoff must state:

- source and candidate commit SHAs;
- files and behaviors changed;
- inheritance decisions still unresolved;
- each verification gate as PASS / FAIL / NOT RUN / BLOCKED with evidence;
- CI result and any dependency/security findings;
- staging/live runtime checks actually performed;
- whether any deploy, Firebase rules/index deployment or data mutation occurred;
- the next concrete action and owner.

Do not merge or deploy merely because the guide is complete. The reusable foundation is ready for a new project only when its identity, infrastructure, security, customer/admin journey and verification gates have evidence appropriate to that project's scope.

## Evidence ledger template

Copy this table into the project brief or PR description for each clone. Replace placeholders with actual results; do not leave a green status without evidence.

| Gate | Status | Evidence / command / URL | Unresolved issue | Owner / next action |
|---|---|---|---|---|
| 0. Source revision and clean working tree | NOT RUN |  |  |  |
| 1. Product brief and KEEP/ADAPT/REPLACE/EXCLUDE inventory | NOT RUN |  |  |  |
| 2. Identity reset and `npm run verify:identity` | NOT RUN |  |  |  |
| 3. Independent infrastructure, secrets, rules and deployment configuration | NOT RUN |  |  |  |
| 4. Customer/admin behavior and schema adaptation | NOT RUN |  |  |  |
| 5. Install, static gates, TypeScript, lint, build and diff review | NOT RUN |  |  |  |
| 6. Staging/live integrations and physical-device checks | NOT RUN |  |  |  |
| 7. Candidate commit, CI, PR and handoff | NOT RUN |  |  |  |

**Status definitions:** PASS = evidence was observed for the stated acceptance condition; FAIL = observed behavior violates it; NOT RUN = no attempt was made; BLOCKED = attempted or planned but prevented by a named dependency, permission or unavailable environment. “CI passed” applies only to the exact SHA and checks shown in that run. Never use it as evidence of live Firebase, uploads, push receipt, deployment, offline behavior or physical-device QA.

