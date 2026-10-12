# Admin Hub Global — Standard App Production Algorithm

Version 1.0 · Pilot foundation: The Plug · 12 October 2026

## Purpose

Deliver apps by reusing proven systems, reducing repeated discovery and avoidable defects, and controlling database/deployment consumption. This is a repeatable procedure, not a mandate to give every product the same features.

## The four-document contract

1. Universal Project Instructions: roles, work discipline, source-of-truth rules and general algorithm.
2. Repository AGENTS.md: product requirements, security, current state, commands, known issues and behavior that must not regress.
3. Repository labelled map: exact paths, architecture, flow traces, data contracts, boundaries, verification and clone decisions.
4. `docs/CLONE-RESET-CHECKLIST.md`: ordered clone gates, commands, expected results and stop conditions.
5. `CLONING.md`: complete, step-by-step conversion of a clean The Plug clone into an independently branded and configured Admin Hub app; use this as the end-to-end execution guide.

The project brief supplies only product, user, required workflow, target directory, destination repo and special constraints.

## Algorithm: START → INSPECT → RESEARCH → SELECT → CLONE → RESET → PROVE → BUILD → VERIFY → CHECKPOINT

### 1. START — define outcome

Record product/user, primary customer outcome, primary admin outcome, explicit exclusions, target directory/repository, integrations, data sensitivity and deployment constraints. Completion normally requires one real customer flow and one real admin flow end to end.

### 2. INSPECT — establish reality

Read AGENTS and the labelled map. Inspect code/routes/components/APIs/schemas/rules/indexes, environment variable names, scripts, CI, Git status/history/remotes, PRs and deployment. Compare with last verified checkpoint. Identify working, broken and unknown behavior. Never overwrite a non-empty target or invent a file tree when local/repository access is incomplete.

Deliver a factual baseline and exact scope.

### 3. RESEARCH — only when it changes a decision

Use current official docs for framework APIs, browser/PWA behavior, database rules, integrations and accessibility. Research industry/behavioral context where it informs the journey; treat it as a hypothesis, not proof of local conversion. Record source, decision and limitations. Avoid research that does not affect implementation.

### 4. SELECT FOUNDATION — compare actual systems

Choose by demonstrated workflow fit, not familiarity:
- BOEMO: candidate for verified order/operations/notification infrastructure.
- The Plug: candidate for curated retail, sourcing, member journeys, analytics and newer PWA/offline patterns.
- Namane Tyres / Atlas: candidate for service/job workflows.
- Admin Hub Games: candidate for games and interactive systems.
- Other repositories only after inspecting them and proving a better fit.

For each subsystem classify KEEP / ADAPT / REPLACE / EXCLUDE. Record paths, dependencies, data boundaries and tests. Never copy source credentials, database data, brand, cache namespaces or business logic blindly.

### 5. CLONE — safe checkpoint

Verify target path and remote. Protect existing work. Clone/init from the selected foundation. Set destination remote/branch deliberately. Create a coherent initial checkpoint before refactoring. Prefer local checks and PR CI; respect Vercel deployment-rate limits and avoid deploying every iteration.

### 6. RESET — identity and environment

Reset app name/title/description, canonical URL/domain, both manifest definitions, icons, Apple/social metadata, brand colors, cache namespaces and cleanup prefixes, browser storage keys, route labels, customer copy, contact details, analytics labels, Firebase project and environment. Update `scripts/identity.config.json` (or the target's equivalent) and the identity verifier's forbidden source-identity patterns. Run the verifier; review false positives. Never weaken it by ignoring whole directories. The current identity verifier deliberately checks `src/app/manifest.ts`, `public/manifest.webmanifest`, `src/app/layout.tsx`, icon assets and service-worker cache names.

Default to separate Firebase projects for independent client apps. Separate development/test data from production. Keep secrets out of Git and client bundles. Verify the active backend/deployment target before production writes.

### 7. PROVE FOUNDATION before new features

Run `npm ci`, `npm run verify:identity`, `npm run verify:clone-readiness`, `npx tsc --noEmit`, `npm run lint`, `npm run build` and `git diff --check` where those scripts exist. Then run the target-specific auth/admin bootstrap, Firestore/Storage rules/index, manifest/icon/service-worker and integration checks. The existing `verify:clone-readiness` is The Plug-specific and must be adapted for a different product; a green foundation audit is not a green target-app audit. Use Firebase Emulator Suite for auth/Firestore/Storage/rules tests where supported. If no test harness exists, do not claim one ran; add a focused low-maintenance harness after checking framework compatibility. Build with placeholders proves buildability, not production integration.

### 8. BUILD CUSTOMER FLOW FIRST

Trace the chain, not just the screen:

DISCOVER → OPEN → UNDERSTAND → PRIMARY ACTION → VALIDATE → SAVE/PROCESS → CONFIRM → RETURN → REOPEN.

For applicable PWAs, separately verify embedded-browser detection, browser handoff, intended route preservation, native install/fallback, installed-state suppression, offline public content/stale messaging, online retry/idempotency, mobile accessibility, and loading/empty/error/permission states. Installation never gates ordinary use. Cached content never proves a server write succeeded.

### 9. BUILD ADMIN FLOW SECOND

Trace:

AUTHENTICATE → AUTHORIZE → LOAD → CREATE/EDIT → VALIDATE → SAVE → VERIFY AFTER REFRESH → CUSTOMER-VISIBLE RESULT → REPORT.

Test authorized and unauthorized roles at UI, API, database and storage boundaries. Include CRUD/lifecycle, upload, empty/error, deletion/archive, auditability, notifications and reporting where applicable. Do not build unnecessary ERP features.

### 10. DATABASE AND RESOURCE DISCIPLINE

For every collection/query/listener/upload/event define owner, readers/writers, schema, validation, indexes, expected frequency, listener need, offline/cache behavior, retry/idempotency, retention/deletion, privacy and cost.

Defaults:
- Query only what the active screen needs; filter, paginate and bound results.
- Detach listeners when views/workflows end.
- Avoid repeated reads, polling, unbounded listeners and duplicate writes.
- Cache only explicitly public content; do not service-worker-cache private data.
- Make retryable writes idempotent.
- Keep analytics minimal, bounded and low-PII.
- Separate behavior events from authoritative commercial outcomes.
- Check current free-tier quotas and billing terms before adding workload; free is not unlimited.

### 11. VERIFY with evidence levels

Mark each requirement:
- PASS: specified test ran and passed with evidence.
- FAIL: test ran and failed.
- NOT RUN: no execution evidence.
- BLOCKED: named dependency, permission or rate limit prevented testing.

Separate source inspection, automated checks, emulator/integration checks, real device/browser checks and production behavior. Never describe source as runtime-verified, an event as a sale, permission as delivery, build as integration, or source rules as deployed rules.

### 12. CHECKPOINT truthfully

Inspect diff/status. Run checks on exact candidate SHA. Update AGENTS and labelled map for material changes. Commit coherently and push to intended branch when authorized. Check CI and exact deployment SHA/status. Verify Firebase rules/index deployment separately. Avoid unnecessary pushes/deployments. Report commit, changed files, checks run, CI, deployment, live tests, gaps and next action.

## Reusable profiles

Choose only relevant modules:
- Client PWA: customer flow, admin, database, notifications, PWA/offline and operational records.
- Retail/sourcing: curated content, offers, saved items, requests, quotes, follow-up and sales outcomes.
- Local service: leads, jobs/bookings, status changes, customer updates and necessary financial records.
- Education/community: enrollment, participation, progress, moderation and consent-bound social features.
- Game: game loop, controls, scenes, assets, progression and optional persistence/rankings.
- Marketing: campaign IDs, landing flow, lead capture, attribution and outcomes; never promise ROI before measurement.

A profile is configuration, not a reason to add every module.

## Minimum release acceptance

- Customer flow completes on a supported mobile browser.
- Admin flow completes for an authorized role.
- Unauthorized access is denied by server and database rules.
- Identity/configuration matches destination.
- Typecheck, lint, build and available tests pass.
- PWA/offline paths are checked where applicable.
- Database reads/writes/retries/cache/cost reviewed.
- Exact source SHA is identified.
- Deployment and backend rules deployment independently verified.
- Untested behavior documented.

## Current pilot rule

The Plug is the flagship candidate, not automatically a certified template. Close its verification gaps, maintain its labelled map, then extract reusable scripts/templates. Reuse behavior only after its operation and security boundaries are verified; otherwise reuse the design pattern and mark it unverified.

## 13. ZERO-COST LOCAL GATES AND DATABASE BUDGET

The standard first-line checks must use tools already in the repository and Node/npm already required by the project. Do not add a paid test platform, hosted browser grid, observability vendor, database, or plugin merely to satisfy the workflow.

For The Plug, run:

1. \`npm ci\` — deterministic install from the committed lockfile.
2. \`npm run verify:identity\` — inherited identity guard.
3. \`npm run verify:clone-readiness\` — static architecture, manifest, rules-file wiring, route and documentation checks. It performs no network calls and no Firebase reads/writes.
4. \`npx tsc --noEmit\` — type check.
5. \`npm run lint\` — lint.
6. \`npm run build\` — production compilation with identity verification.
7. Run focused Node built-in tests or existing test commands if present. Do not claim tests exist until you inspect package scripts and the actual test files.

These gates do not replace Firebase Rules Emulator tests, upload tests, push-delivery tests, browser/device QA or production smoke tests. Label those NOT RUN or BLOCKED until executed.

### Data and service-cost policy

- Source inspection, static checks, TypeScript, lint, and local builds should not call Firebase or mutate production.
- Prefer Firebase Emulator Suite for rules and integration tests when available; do not point destructive tests at production.
- Before running a production smoke test, name the exact reads/writes/events/uploads it may create and obtain authorization when it can mutate customer-visible state or spend money.
- Avoid repeated production probes and polling. One deliberate verification run is better than a loop of refreshes.
- Never dump customer records, tokens, service-account JSON, environment values, or private messages into logs or PRs.
- Record which service is touched, whether the operation is read-only, its expected cost/risk, and how test data will be removed.
- A free tier is a quota, not an unlimited resource. Confirm current quotas only when a planned feature or test could materially increase usage; do not research pricing as busywork.
- Keep the clone-readiness script deterministic and offline. Any check requiring credentials, network access, or external service state belongs in a separately labelled integration/production gate.

### Legacy disposition rule

The Plug's old order/menu/reconciliation symbols, old order-tracking route and BOEMO storage path are warnings, not automatic deletion targets. Some route files may be historical/dead while customer bookmarks or deployed data can still exist. Before deleting or migrating any footprint, produce a call-site matrix and inspect deployed collection/bucket usage with a read-only, authorized method. Then preserve/ migrate any required records, update rules and callers atomically, test in emulator, and only then deploy. Never infer that a collection is empty from lack of code references.

The static audit reports these findings without touching Firebase. Its success means repository wiring is present, not that the product is certified safe or production-ready.
