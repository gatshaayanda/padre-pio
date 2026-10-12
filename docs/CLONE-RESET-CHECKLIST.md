# Clone and Reset Checklist — Admin Hub App Factory

This is the executable working procedure for a fresh agent. Complete gates in order; record **PASS**, **FAIL**, **NOT RUN**, or **BLOCKED** with the exact evidence. A failed or assumed gate blocks dependent work. This document is a process contract, not proof that any runtime system works.

## Gate 0 — Establish reality before touching files

**Prerequisites:** correct repository and target business are known.

**Inspect**
- Confirm the current branch, commit, clean/dirty status, remotes, recent history, open PRs, CI state and actual deployment project/production alias.
- Read `AGENTS.md`, `AGENTS_REPO_LABELED.md`, `CLONING.md`, this checklist, the app-factory SOP, and the PWA contract when applicable.
- Inspect the complete repository tree. Trace customer journeys, admin workflows, routes, components, APIs, data helpers, rules, indexes, storage, environment-variable reads, CI/workflows, service workers, cache keys and deployment configuration.

**Commands**
```sh
git status --short
git branch --show-current
git log -5 --oneline --decorate
git remote -v
git diff --check
node --version
npm --version
```

**PASS:** the exact source SHA and destination are known; every pre-existing change is accounted for; no important system is documented only by assumption. The local Node major matches `.nvmrc` and the CI workflow.

**STOP:** unexpected dirty files, unknown remote, ambiguous production target, inaccessible source, unreviewed deployment/rules state, or an unexplained mismatch between docs and code. Inspect and reconcile first; do not reset, overwrite or deploy.

## Gate 1 — Baseline and behavior inventory

Before cloning/refactoring, create a short inventory with one row per journey/system and classify it:

- **KEEP** — portable behavior with evidence and no source identity/business coupling.
- **ADAPT** — reusable mechanism whose policy, copy, schema, permissions or integration changes.
- **REPLACE** — source-business workflow/data model must be rebuilt for the target.
- **EXCLUDE** — deliberately not part of the target, with callers/links/data implications checked.

Trace at least:
1. First visit → primary customer action → saved/confirmed result → returning customer.
2. Admin authentication → role boundary → queue/CRUD → persisted change → customer-visible outcome.
3. Upload and download, if applicable.
4. Notification preference/token/send/failure, if applicable.
5. Install/embedded-browser handoff/offline/reconnect, if a PWA.
6. Every old/legacy route, schema, storage prefix, scheduled workflow and external integration.

**PASS:** each item has source paths, data/rule boundaries, failure paths and an explicit disposition.

**STOP:** a route appears dead only because no in-repo link was found; historical links, scheduled jobs, deployed data and external callers have not been checked. Do not delete inherited code to make a scan quiet.

## Gate 2 — Create an isolated clone

1. Choose The Plug only when its inspected capabilities match the target. Preserve the original repository and source branch.
2. Clone into a new, empty target directory/repository; verify the destination remote and default branch explicitly.
3. Preserve a baseline commit before changes. Never copy secrets, production records, service-account files, Firebase project IDs or deployment bindings blindly.
4. Keep the source project's Git history only if that is a deliberate product decision; otherwise create a clean target history after the source snapshot is reviewed.
5. Keep the first changes limited to identity/configuration and verification scaffolding. Do not add target features before the baseline gates pass.

**PASS:** source and target remotes are distinct as intended, the initial checkpoint is recoverable, and no production target has been changed.

**STOP:** target points to the source repo, existing work would be overwritten, or copied secrets/backend bindings are present.

## Gate 3 — Full identity reset

Changing the package name or page title is not an identity reset.

1. Update `scripts/identity.config.json`: target manifest name, short name, theme color, canonical icon path, unique service-worker cache prefix, and forbidden patterns for the source app's names/domains/project IDs/brand colors.
2. Replace/update both manifest definitions currently used by this foundation: `src/app/manifest.ts` and `public/manifest.webmanifest`. Keep identity-bearing fields and icon declarations aligned until the project intentionally consolidates the duplicate source.
3. Update `src/app/layout.tsx` metadata: title/template, application name, canonical/base URL, Open Graph/Twitter, favicon/icon, Apple web-app title, manifest reference and theme color.
4. Replace the actual icon/image assets. Check SVG/PNG contents and dimensions; filename changes alone do not replace artwork. Update every metadata, manifest, service-worker and shortcut reference.
5. Replace identity in install prompts, embedded-browser handoff, offline/error/loading states, customer/admin copy, emails/notification payloads, social/contact links, robots/sitemap/canonical URLs and analytics labels.
6. Change all service-worker shell/media cache namespaces, legacy-cache deletion prefixes, localStorage/IndexedDB keys and any identity-scoped browser state. Preserve safe offline policy; avoid reading or copying customer caches.
7. Update package/repository/readme/project names, favicon and any hosted-domain references.
8. Search source, text assets, configuration, Firestore/Storage rules and workflows for the old identity. The identity verifier intentionally excludes engineering instructions that discuss the source foundation and masks only the exact strings listed in `allowedLegacyStrings`; each exception must have an explicit KEEP/ADAPT/REPLACE decision and be removed from that list when no longer needed. Do not broadly exclude product files or entire directories.

**Commands**
```sh
npm run verify:identity
git diff --check
```

**PASS:** identity verifier passes; generated and static manifest fields agree; all declared icons exist; cache namespaces are unique; a repository-wide manual/search review finds no unintended source identity residue.

**STOP:** a verifier fails, an inherited brand appears in a customer-facing asset, metadata disagrees, an icon URL is missing, or a cache namespace can collide with source/other apps. Do not weaken the scan by ignoring whole directories.

## Gate 4 — Isolate services, configuration and environments

Inventory every `process.env`, `NEXT_PUBLIC_*`, GitHub Actions secret, Vercel environment and scheduled-workflow secret from source and workflows. Update `.env.example` and target deployment settings together. Do not print secret values.

Typical The Plug variables are examples, not a copy-and-paste requirement:
- Client Firebase: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, optional measurement ID and VAPID key.
- Server Firebase Admin: `FIREBASE_ADMIN_KEY`.
- UploadThing: `UPLOADTHING_TOKEN`.
- Canonical URL: `NEXT_PUBLIC_BASE_URL`.
- Current shared operations gate: `THE_PLUG_OPERATIONS_WORD`.
- Current scheduled reminder secret is still named `BOEMO_REMINDER_CRON_SECRET`; preserve it until the route, workflow and secret are deliberately renamed together.
- GitHub rules deployment separately expects `FIREBASE_SERVICE_ACCOUNT_JSON` and `FIREBASE_PROJECT_ID`; these are not the same credential as Vercel's `FIREBASE_ADMIN_KEY`.

For the target:
1. Create/select a dedicated Firebase project by default. Configure Auth providers/domains, Firestore, Storage, messaging/VAPID, rules and indexes for that project.
2. Configure separate development/preview/production environments and verify each project's ID before any write or rules deployment.
3. Create new UploadThing credentials if the target uses UploadThing.
4. Connect the intended Vercel project/domain and configure canonical URL; verify GitHub repository/workflows/secrets and scheduled jobs.
5. Remove or replace source-project IDs, secret names, endpoints and provider integrations. Never treat a successful local build with blank config as proof of service readiness.

**PASS:** all required variables are inventoried with purpose and environment; values exist in the intended target without being exposed; the target service IDs and deploy destination are confirmed.

**STOP:** missing/ambiguous credential, source/target project mismatch, accidental production write, shared backend not deliberately designed, or a secret is only present in one of multiple independent paths.

## Gate 5 — Business workflows and data model

1. Define the target's real primary customer journey and completion condition.
2. Define the admin workflow that receives, reviews and completes that journey.
3. Map each collection/document, storage path, API, status enum and notification to owner, trusted writer, reader/audience, schema validation, indexes, retention/deletion, retry/idempotency, offline behavior and expected cost.
4. Replace business-specific records and status transitions. Reusable UI does not make source data or rules reusable.
5. Audit all legacy routes and callers, including dynamic routes, redirects, bookmarks, external links, scheduled jobs, API callers and persisted records. Mark each KEEP/ADAPT/REPLACE/EXCLUDE and cite evidence.
6. Update Firestore/Storage rules and indexes in the same controlled change as schema changes. Preserve default deny. Never point test mutations at production.

**PASS:** customer and admin flow diagrams match code; rules authorize the intended roles and deny unrelated users; indexes/config align with actual queries; legacy dispositions are evidence-backed.

**STOP:** a collection has no clear owner/writer, the UI assumes authorization the rules do not enforce, a status implies a commercial outcome that is not recorded, or live-data impact is unknown.

## Gate 6 — Prove the inherited infrastructure before adding features

Run the applicable gates against the candidate target. The existing `verify:clone-readiness` script is a **The Plug foundation audit** with The Plug-specific assertions; adapt its assertions and documented route/schema expectations for a new business instead of treating its green result as universal certification.

```sh
npm ci
npm run verify:identity
npm run verify:clone-readiness
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

**PASS:** each command exits successfully on the exact candidate commit; identity/readiness output has no unexplained failure; the diff is reviewed. Confirm local and CI Node majors match; do not dismiss environment-version drift.

**STOP:** any command fails. Fix the cause and rerun the failed gate plus downstream gates. Do not mark a command PASS because CI is queued or because another branch passed.

Then, when applicable, run rules/auth/API/upload tests against emulators or an isolated non-production project. Record environment, test identity/role, request, expected denial/success and observed result. These integration tests are separate from zero-cost static checks.

## Gate 7 — Verify customer/admin/PWA behavior

Run explicit acceptance tests appropriate to the product:

- **Customer:** first visit, primary action, validation, submit once, authoritative persisted result, private history, return path, refresh and retry after failure.
- **Admin:** signed-in authorized operator, wrong-role denial, direct route/API/database denial, queue/read, create/update/delete, status/lifecycle transitions, persisted refresh, and customer-visible result.
- **Identity/config:** correct domain/title/icon/metadata/manifest/cache keys in browser and installed app; no source service IDs.
- **Authorization:** unauthenticated, owner, unrelated owner, staff/admin and invalid-role cases; Firestore and Storage rules tested independently of UI.
- **Uploads:** supported type/size, auth/role, upload success, persisted URL, read permission, invalid type/size, expired session, network failure and retry.
- **Notifications:** unsupported/denied/missing config, token ownership, intended recipient, invalid token, provider failure, duplicate request and actual device receipt. Permission or API success is not proof of device delivery.
- **PWA/offline:** WhatsApp/Instagram embedded-browser handoff; ordinary browser opened from a share link; native install and platform fallback; standalone launch; offline public shell/media; stale-content label; private pages network-only; reconnect; no duplicate writes; update/cache cleanup.
- **Accessibility:** keyboard-only use, visible focus, semantic labels, dialog focus/escape policy, screen-reader names, WCAG AA contrast, reduced motion and narrow viewport states.

**PASS:** each applicable test has a recorded result and evidence. **NOT RUN** and **BLOCKED** remain visible; neither counts as PASS.

**STOP:** private data leaks, unrelated user can read/write, a write is claimed without server confirmation, offline retry duplicates a write, install/handoff traps the customer, or a critical path is untested but described as production-ready.

## Gate 8 — Release and checkpoint

1. Inspect final diff, staged changes, repository status and exact commit SHA.
2. Rerun applicable static checks after the last edit and verify CI against that exact SHA.
3. Confirm GitHub PR/branch status and deployment budget. Do not merge or deploy without owner authorization.
4. If explicitly authorized to deploy, verify the deployment project, target environment, exact source SHA, build state and production alias independently. Check Firebase rules/index deployment separately from web deployment.
5. Perform post-deployment smoke tests on the exact live URL/device; never infer release success from a source commit or READY build alone.
6. Record the checkpoint: commit, PR, CI run, deployment ID/URL if any, customer/admin/PWA tests actually run, unresolved gaps and recovery path.

**PASS:** evidence is complete for the claims being made and limitations are stated.

**STOP:** deployment points to a different SHA/project, rules deployment is ambiguous, release limits are reached, or a critical runtime test is unverified.

## Evidence ledger template

| Gate / behavior | Status | Exact SHA/environment | Evidence / command | Remaining gap |
|---|---|---|---|---|
| Source and target identity | NOT RUN | | | |
| Static identity/readiness | NOT RUN | | | |
| TypeScript/lint/build | NOT RUN | | | |
| Customer journey | NOT RUN | | | |
| Admin and authorization | NOT RUN | | | |
| Uploads/notifications | NOT RUN | | | |
| PWA/install/offline/reconnect | NOT RUN | | | |
| Deployment and rules | NOT RUN | | | |

Do not remove a row because the system does not support that feature; mark it **NOT APPLICABLE** with the reason and evidence.
