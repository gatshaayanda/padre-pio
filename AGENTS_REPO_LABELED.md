# The Plug — Labelled Repository Engineering Map

**Purpose:** source-linked blueprint for The Plug and the reference map for future Admin Hub clones.

**Audit baseline:** repository gatshaayanda/the-plug, default branch main, latest commit observed in commit search: b9b347f4d700342e0375ada1e3d408b0e526de95 (12 October 2026). Re-check current main before relying on this snapshot.

**Evidence vocabulary:** SOURCE-VERIFIED = file inspected. REPOSITORY-DOCUMENTED = README/AGENTS states behavior. NOT-RUNTIME-VERIFIED = source alone cannot prove deployed behavior. FOLLOW-UP = evidence still required.

## 00 — Mandatory reading order for every new chat

1. Read AGENTS.md for agent behavior, product rules and non-negotiable behavior.
2. Read this map for exact subsystem labels and flow traces.
3. Read docs/ADMIN-HUB-APP-FACTORY-SOP.md for the end-to-end production algorithm.
4. Read docs/CLONE-RESET-CHECKLIST.md for the ordered operational checklist.
5. For a new app, read CLONING.md and complete all clone gates in sequence.
6. Confirm current branch/head, Git status, recent commits, open PRs, CI and exact deployment status.
7. Inspect all named files in the relevant label and follow callers, writes, readers, rules, indexes and error paths before editing.
8. State the requested outcome, affected flows, smallest change, relevant tests and recovery point.
9. Make the smallest controlled change. Run checks that actually exist. Update the map when code paths, schemas, rules or evidence change.
10. Mark each check PASS, FAIL, NOT RUN or BLOCKED. Never infer runtime success from source inspection.

If the source contradicts this map, source wins. Update the map in the same checkpoint as a material implementation change.

## 01 — System silhouette

### 01.1 Runtime and stack

SOURCE-VERIFIED:
- Next.js 15 App Router, React 19, strict TypeScript. `.nvmrc` and the GitHub Actions quality workflow both target Node 22.
- npm package scripts: dev, build, start, lint, verify:identity, verify:clone-readiness. The build invokes identity verification before Next build.
- Firebase Web SDK 11.9, Firebase Admin 13.4, UploadThing v7, Lucide React, Vercel Analytics and Speed Insights.
- The observed `npm ci` CI log reported 27 npm audit findings (1 low, 9 moderate, 17 high); individual advisories have not been triaged in this foundation pass. Do not run a blind `npm audit fix`; schedule a focused lockfile/advisory review and test compatibility.
- Tailwind CSS 4 dependencies, plus substantial app-specific CSS.
- tsconfig path alias maps @/* to ./src/*.
- Firebase client initializes persistent Firestore local cache.
- CI workflow .github/workflows/quality.yml runs npm ci, npx tsc --noEmit, npm run lint and npm run build for main pushes and PRs.

Key files: package.json, tsconfig.json, next.config.ts, src/app/layout.tsx, .github/workflows/quality.yml.

NOT-RUNTIME-VERIFIED: the source inspection used repository file access, not a local clone. GitHub Actions separately installs from the lockfile and runs identity/static gates, TypeScript, lint and production build on the candidate SHA; those checks do not exercise live Firebase, UploadThing, push delivery, production aliases or real-device customer/admin/PWA journeys.

### 01.2 Product boundary

The Plug is a Botswana sneaker/apparel discovery and sourcing experience. Its curated storefront is not a complete mirror of the WhatsApp catalogue and is not online payment checkout. A request is purchase intent, not a confirmed order.

Keep distinct:
- Public featured finds and active deals.
- Browser/device-local Saved Finds.
- Private customer requests and conversations.
- Admin operations and private records.
- Community activity with explicit audience and consent.
- Journey analytics events.
- Authoritative commercial outcomes: quote, approval, deposit receipt, fulfilment and revenue.

## 02 — Labelled source map

### A — Entry, layout and metadata

| Label | Source path | Responsibility / coupling |
|---|---|---|
| A01 | src/app/page.tsx | Home composition; StorefrontFeed and CommunityFeed; account/saved links; member-benefits disclosure; dispatches install event. |
| A02 | src/app/layout.tsx | Root metadata, manifest/icon references, analytics, early install capture, server-side embedded-browser classification and PWA controller. |
| A03 | src/app/globals.css | Global/storefront CSS; inspect cascade before visual changes. |
| A04 | src/app/pwa.css | PWA/install/offline styles and responsive states. |
| A05 | src/app/offline/page.tsx | Offline route and honest freshness/submission limitations. |
| A06 | public/manifest.webmanifest | App name, short name, description, theme, start URL, scope, standalone display and icon declarations. |
| A07 | public/plug-icon.svg, public/plug-icon-192.png, public/plug-icon-512.png | Identity assets declared by metadata/manifest; verify URLs and actual dimensions. |
| A08 | next.config.ts | Remote image configuration; Firebase Storage host is allowed. |

Identity changes must also inspect `scripts/identity.config.json`, `scripts/verify-identity.mjs`, `public/sw.js`, cache namespaces, social metadata, environment configuration and all visible product strings. The verifier config is the per-project contract for expected manifest name, short name, theme color, canonical icon, service-worker cache prefix and forbidden source-identity patterns. A title change alone does not reset installed PWA identity or cached assets.

**Verified source caveat:** both `src/app/manifest.ts` and `public/manifest.webmanifest` define overlapping manifest identity/installability fields. The generated App Router route is intended to be canonical; deployed response precedence has not been independently checked here. Keep them aligned and verify the real `GET /manifest.webmanifest` before consolidating either file. Canonical URL fallbacks are inconsistent: `src/app/layout.tsx` defaults to `https://the-plug.vercel.app`, while `src/app/robots.ts`, `src/app/sitemap.ts`, notification links and reminder links default to `https://the-plug-pearl.vercel.app`. The last inspected production alias was `https://the-plug-pearl.vercel.app`. Set `NEXT_PUBLIC_BASE_URL` explicitly in each environment and verify canonical, Open Graph, robots, sitemap and push links together; do not assume these fallbacks agree.

### B — PWA, embedded browser, install and offline

| Label | Source path | Responsibility / coupling |
|---|---|---|
| B01 | src/app/layout.tsx | Server-derived embedded-browser hint; early beforeinstallprompt capture. |
| B02 | src/app/pwa-register.tsx | Shared client controller: install state, embedded gate, native prompt/fallback, installed state, connectivity feedback. |
| B03 | public/sw.js | Service worker; Firebase Messaging, background notification behavior, shell/public-page/media caching, cache cleanup and click navigation. |
| B04 | src/app/offline/page.tsx | Offline message and return navigation. |
| B05 | public/manifest.webmanifest | Install identity and scope. |
| B06 | scripts/verify-identity.mjs | Residual-brand/domain/color scan and explicit ignore policy. |
| B07 | docs/PWA-FOUNDATION.md | Portable PWA clone contract. Read before adapting the system to another app. |

Cache facts at the observed baseline: shell cache theplug-shell-v15; media cache theplug-media-v1; local public storefront snapshot key theplug:public-storefront:v1; Saved Finds key theplug-saved-finds-v1. Treat these names as migration-sensitive. Inspect cache deletion, staleness, scope and old-cache cleanup before changes. The service worker now caches only image requests to the configured Firebase Storage bucket in a separate bounded media cache (80 entries), with cached fallback when offline. This is source-level behavior; real device/offline image retrieval remains NOT-RUNTIME-VERIFIED.

Offline boundary: public storefront snapshots and eligible public media may remain available offline. This does not mean requests, account changes, messages or uploads were delivered. The UI must distinguish stale cached data from fresh data and never duplicate a write on retry.

FOLLOW-UP: test WhatsApp/Instagram handoff, normal-browser arrival, native install prompt, iOS manual steps, standalone suppression, old-cache cleanup, offline images, reconnect and physical-device installation. Source inspection cannot prove these.

### C — Storefront, finds, deals and saved items

| Label | Source path | Responsibility / coupling |
|---|---|---|
| C01 | src/components/StorefrontFeed.tsx | Public Firestore query, live eligibility, find/deal cards, detail dialogs, save/share/request actions, offline snapshot fallback. |
| C02 | src/app/page.tsx | Homepage section hierarchy. |
| C03 | src/lib/saved-finds.ts | Browser-local Saved Finds data shape, storage key and change event. |
| C04 | src/app/saved/page.tsx | Saved Finds list, removal and navigation. |
| C05 | src/app/request/request-form.tsx | Receives item context from URL/query and submits a private sourcing request. |
| C06 | firestore.rules | Public storefront reads and admin write boundary. |
| C07 | storage.rules | Storefront media permissions. |
| C08 | firestore.indexes.json | Composite indexes for supported queries. |

Observed storefront shape includes ID, type find/deal, category, title, description, image URL, optional current/original price, status, audience, start/end timestamps, CTA label, sort order and update timestamp. Public live checks require published status, everyone audience, valid current price, non-empty image URL and active date bounds. Inspect actual component and rules before changing schema.

No fake products, stock, prices, discounts, urgency or activity. Draft, paused, scheduled, expired and archived records must not appear live. A valid deal must have regular price greater than offer price. A request is not a payment or stock reservation.

### D — Customer sourcing request

| Label | Source path | Responsibility / coupling |
|---|---|---|
| D01 | src/app/request/page.tsx | Route wrapper and metadata. |
| D02 | src/app/request/request-form.tsx | Form, validation, anonymous-auth attempt at submit, attachment workflow, Firestore write and error/success behavior. |
| D03 | src/app/api/uploadthing/route.ts | UploadThing route documented in AGENTS; verify current file before edits. |
| D04 | src/app/api/uploadthing/core.ts | UploadThing router and constraints documented in AGENTS; verify current file before edits. |
| D05 | src/lib/uploadthing.ts | Typed upload helper documented in AGENTS; verify current file before edits. |
| D06 | firestore.rules | Request ownership, schema and admin access. |
| D07 | storage.rules | Attachment access where Firebase Storage is used. |
| D08 | src/app/account/page.tsx | Customer request history/tracking, private conversations, account linking and settings. |
| D09 | src/components/PlugAdminDashboard.tsx | Admin-side request operations and commercial workflow. |
| D10 | src/app/admin/admin-gate.tsx | Admin identity and role gate. |

Required sequence: browse real finds/offers → open request with item context → enter details and optional reference → submit once → confirm only after authoritative save → arrive at My Plug/account with the saved request → later view recorded status/quote and private replies.

Failure cases: missing Firebase config, anonymous-auth failure, network loss, upload rejection/timeout, Firestore permission denial, double submit/retry, interrupted navigation, customer cannot read own request, admin cannot see authorized request, unrelated user can read private data.

AGENTS documents UploadThing v7, images/PDF only, one file and 4 MB maximum. Keep client and server constraints aligned. Failed upload must preserve form data and block silent submission without an attachment the customer thought was included. Production image and PDF upload must be tested with deployed credentials.

Commercial boundary: request is not an order; quote is not customer approval; approval is not proof of deposit; deposit is not fulfilment; a status is not delivery proof unless recorded.

### E — Account, identity and local state

| Label | Source path | Responsibility / coupling |
|---|---|---|
| E01 | src/lib/firebase/client.ts | Firebase client init, real-config predicate, persistent Firestore cache. |
| E02 | src/app/account/page.tsx | Auth state/persistence, anonymous-session linking, requests, private conversations, preferences and community controls. |
| E03 | src/lib/firebase/journey-analytics.ts | Client event union, bounded event details, optional authenticated identity and bearer-token POST. |
| E04 | src/lib/saved-finds.ts | Device-local saved item snapshots. |
| E05 | firestore.rules | Owner-scoped access and admin boundaries. |

Anonymous Firebase auth is still authenticated for owner-scoped data, but is not verified phone/email identity and never makes a user an admin. Link Google credentials to the existing anonymous UID where possible. If the credential belongs to a different UID, do not silently merge records or claim guest history moved; explain the conflict and require a deliberate choice.

Saved Finds are browser/device-local and not synced across devices. Public offline snapshot is also local. Do not market either as durable cross-device account sync.

### F — Admin and publishing operations

| Label | Source path | Responsibility / coupling |
|---|---|---|
| F01 | src/app/admin/page.tsx | Composes AdminGate and PlugAdminDashboard. |
| F02 | src/app/admin/admin-gate.tsx | Auth and role gate. |
| F03 | src/components/PlugAdminDashboard.tsx | Operations, content studio and analytics UI. |
| F04 | src/app/api/analytics/journey/route.ts | Server analytics event acceptance and identity checks. |
| F05 | firestore.rules | Database authorization. |
| F06 | storage.rules | Media upload/read rules. |
| F07 | firestore.indexes.json | Query index definitions. |

Admin acceptance: authorized owner/staff signs in → non-admin denied at route and data boundaries → records/content load → CRUD and lifecycle states work → saved values survive refresh → only eligible content appears publicly → customer sees only their own updates → analytics is described as activity, not sales.

A hidden admin link or client role check is not security. Privileged server routes, Firestore and Storage must enforce authorization independently.

### G — Analytics and customer intelligence

| Label | Source path | Responsibility / coupling |
|---|---|---|
| G01 | src/lib/firebase/journey-analytics.ts | Client event contract and bounded metadata. |
| G02 | src/app/api/analytics/journey/route.ts | Server token verification, event allow-list, detail filtering and event write. |
| G03 | src/components/StorefrontFeed.tsx | Find/offer opened, request clicked, bookmark and share events. |
| G04 | src/app/page.tsx | Entry and community context. |
| G05 | src/components/PlugAdminDashboard.tsx | Reporting and demand signals. |
| G06 | firestore.rules | Analytics event access. |

Client event names observed: request_flow_opened, account_confirmed, notification_enabled, friend_invite_created, request_submitted, storefront_find_opened, storefront_offer_opened, product_request_clicked, community_feed_opened, catalogue_opened, instagram_opened, product_share_clicked, product_shared, product_bookmarked and product_unbookmarked.

When changing event names, update the client helper, server allow-list, Firestore rules and dashboard aggregation together. Event count is not unique people, qualified leads, accepted quotes, purchases, revenue or causal lift. Commercial outcomes must come from authoritative business records.

### H — Notifications and messaging

| Label | Source path | Responsibility / coupling |
|---|---|---|
| H01 | src/app/pwa-register.tsx | Shared browser PWA state; inspect current notification-related code before edits. |
| H02 | public/sw.js | Firebase Messaging background behavior and click navigation. |
| H03 | src/app/api/firebase/messaging-sw-config/route.ts | Client-safe runtime Firebase config for the service worker; must never return private server credentials. |
| H04 | src/app/account/page.tsx | Customer notification preferences and opt-in. |
| H05 | src/components/PlugAdminDashboard.tsx | Admin operations and related controls where implemented. |
| H06 | firestore.rules | Token ownership and privileged writes. |

Notification proof ladder: browser support → permission → service worker → token created → token stored for correct owner → server accepts send request → provider accepts message → device displays it. These are separate states. Permission or HTTP success is not proof of delivery. Keep in-app history useful when push is unsupported, denied or misconfigured.

### I — Firebase, security and resource use

| Label | Source path | Responsibility / coupling |
|---|---|---|
| I01 | src/lib/firebase/client.ts | Client SDK, real config detection and persistent cache. |
| I02 | firestore.rules | Firestore authorization and schema constraints. |
| I03 | storage.rules | Storage authorization. |
| I04 | firestore.indexes.json | Composite indexes. |
| I05 | firebase.json | Rule/index paths and emulator ports: Auth 9099, Firestore 8080, Storage 9199. |
| I06 | .github/workflows/quality.yml | Typecheck, lint and build. |
| I07 | scripts/verify-identity.mjs | Config-driven clone identity residue guard. |
| I08 | .github/workflows/firebase-rules-deploy.yml | Firestore rules deployment; Storage rules and Firestore indexes deploy only when their respective files change on push. |

Firebase web config uses `NEXT_PUBLIC_FIREBASE_*` values. Client code has build placeholders so prerender/build can work without production config; `hasFirebaseWebConfig` prevents auth actions when required values are absent. A successful build with placeholders does not prove production Firebase works. `.env.example` documents client config, `FIREBASE_ADMIN_KEY`, `UPLOADTHING_TOKEN`, `NEXT_PUBLIC_BASE_URL`, `THE_PLUG_OPERATIONS_WORD`, and the legacy `BOEMO_REMINDER_CRON_SECRET`. GitHub rules deployment separately expects `FIREBASE_SERVICE_ACCOUNT_JSON` plus `FIREBASE_PROJECT_ID`; these are not interchangeable with the Vercel server credential.

Cost discipline:
- Filter, paginate and bound queries.
- Limit real-time listeners to the active view and detach them on unmount.
- Avoid repeated reads, polling and duplicate writes on retry.
- Cache only explicitly public data; never service-worker-cache private requests, messages, account or admin pages.
- Use Firebase emulators for repeatable auth/rules tests where supported.
- Review current plan quotas and consumption before adding reads, writes, storage, egress or analytics.
- Separate independent client apps by Firebase project by default. Shared multi-tenant data requires explicit tenant isolation and cross-tenant negative tests.

Before adding a collection/field, define owner, audience, trusted writer, readers, schema, validation, index, deletion/retention, retry/idempotency, offline behavior, cost and negative security tests. Update rules/indexes with the schema change.

### J — Quality gates and identity

| Label | Command/path | Purpose |
|---|---|---|
| J01 | package.json | Canonical scripts. |
| J02 | npx tsc --noEmit | TypeScript check. |
| J03 | npm run lint | ESLint. |
| J04 | npm run verify:identity | Brand/config residue check. |
| J05 | npm run build | Identity verifier followed by Next production build. |
| J06 | .github/workflows/quality.yml | Node 22, npm ci, explicit identity and static foundation gates, typecheck, lint, build. |
| J07 | scripts/verify-identity.mjs | Config-driven clone identity residue guard. |
| J08 | scripts/identity.config.json | Per-project identity expectations and explicitly allowlisted legacy strings. |
| J09 | docs/CLONE-RESET-CHECKLIST.md | Ordered clone/reset checkpoints, commands, expected results and stop conditions. |

Important gap: inspected package scripts do not define a test runner. README has manual acceptance checklists. Do not tell a new chat to run npm test, Playwright or Firebase rules tests unless it verifies they exist. Add a focused low-maintenance test harness deliberately rather than pretending one already exists.

## 03 — Flow traces

### FLOW-01: Storefront to request

1. src/app/layout.tsx supplies metadata, analytics and root PWA handling.
2. src/app/page.tsx mounts StorefrontFeed and CommunityFeed.
3. src/components/StorefrontFeed.tsx reads eligible published public records and renders actions.
4. Request action carries item title, optional listed price and item type to /request.
5. src/app/request/page.tsx mounts RequestForm in src/app/request/request-form.tsx.
6. Form validates input and optional attachment; anonymous auth is attempted at submit where configured.
7. UploadThing handles supplied attachments; Firestore write is authoritative for the request.
8. Success leads to My Plug/account with saved request visible.
9. src/components/PlugAdminDashboard.tsx exposes the operational record to authorized admin.
10. Quote, approval, deposit and fulfilment must follow explicit recorded states.

### FLOW-02: Account continuity

1. Account page observes Firebase auth state.
2. Guest remains an anonymous Firebase user for owner-scoped records.
3. Google linking preserves UID and records when credential linking succeeds.
4. Different-UID credential conflict is explained; no silent merge.
5. Requests, messages, attachments and profile remain owner-scoped.
6. External catalogue/contact utilities are low priority and gated by product policy.
7. Explain the risk of losing unlinked guest history when browser data is cleared or device changes.

### FLOW-03: Admin and publishing

1. /admin composes AdminGate and PlugAdminDashboard.
2. Auth gate checks Firebase identity and admins/{uid} role.
3. Privileged APIs independently verify identity and role.
4. Firestore and Storage rules independently restrict access.
5. Draft creation/edit stays private.
6. Publishing validates audience, status, dates and pricing.
7. Public queries and live checks expose only eligible records.
8. Pause/archive/expiry removes content from live display; cached content is marked stale.
9. Test authorized roles and unauthorized negative cases.

### FLOW-04: PWA and offline

1. Root layout classifies embedded browsers and captures install event early.
2. src/app/pwa-register.tsx owns install and connection UI.
3. Explicit install click uses native prompt if retained, otherwise accurate platform guidance.
4. Standalone state suppresses install promotion.
5. public/sw.js handles shell/public/media caches and Firebase Messaging.
6. StorefrontFeed saves a bounded public snapshot in localStorage.
7. Offline route explains stale data and that writes need a connection and confirmation.
8. Reconnect revalidates data without duplicate writes or private cache exposure.

### FLOW-05: Analytics

1. UI action calls trackPlugJourney from journey-analytics.ts.
2. Helper uses configured Firebase identity and bearer-token POST.
3. /api/analytics/journey verifies token, event and bounded details, then writes.
4. Admin dashboard aggregates activity.
5. Sales/revenue outcomes must come from authoritative business records.
6. Event contract changes across helper, route, rules and dashboard together.

### FLOW-06: Push

1. Customer explicitly opts in after seeing a relevant benefit.
2. Support/permission and service worker are checked.
3. Messaging config route returns only client-safe config.
4. Token is saved to the correct owner under rules.
5. Protected server path sends message.
6. Service worker handles background behavior/click navigation without duplicate display.
7. UI reports exact stage; actual device display is separately verified.

## 04 — Data boundaries

| Surface | Boundary | Clone rule |
|---|---|---|
| Public storefront | Published, active, everyone audience | Never expose drafts or Circle-only records publicly. |
| Saved Finds | Browser/device local | Do not promise cross-device sync. |
| Requests/profile | Owner + authorized admin | Test owner, unrelated user and anonymous cases. |
| Private conversations/files | Owner + authorized admin | Never include in public cache/community. |
| Admin records | Role-controlled | Secure route, API, database and storage. |
| Analytics | Authenticated submitter, server allow-list | Bound payloads; events are not sales. |
| Community | Explicit consent and audience | Only eligible completed records; no private transaction details. |
| Notification tokens | User-owned / admin-authorized | Do not leak tokens; permission is not delivery. |
| Offline cache | Explicitly eligible public content | Bound/version/expire; disclose staleness. |

## 05 — Clone/reset runbook

### CLONE-01 Protect source and target
Inspect target directory and remote before writing. Select foundation based on actual workflow fit. Record source SHA, target repo/branch and intended deployment. Protect existing work. Do not copy .env, service account keys, Firebase project IDs, production data, Vercel linkage or service-worker namespaces blindly.

### CLONE-02 Decide reuse
For each subsystem classify KEEP / ADAPT / REPLACE / EXCLUDE: identity, customer routes, admin/roles, database/schema/rules/indexes, upload/storage, notifications, PWA/offline, analytics, CI/scripts/docs. Record exact paths and assumptions before broad edits.

### CLONE-03 Reset identity
Reset app name, titles, descriptions, canonical URL/domain, manifest, icons/Apple metadata, OG/Twitter, visible copy, contact details, cache namespaces, analytics labels, Firebase project and environment. Run identity verifier; inspect false positives. Add source-brand tokens to verifier rather than ignoring whole directories. Confirm no credentials or business data are reused.

### CLONE-04 Prove infrastructure
Set correct environment variables; confirm Firebase project and deployment target; inspect rules/indexes; run typecheck/lint/identity/build; verify admin bootstrap; set up emulator fixtures where supported. Build with placeholders proves buildability only, not production integration.

### CLONE-05 Complete customer flow
Test direct arrival, embedded browser handoff where applicable, browse, primary action, validation, upload, authoritative save, confirmation, customer history, account continuity, retry/error, mobile keyboard/touch and return visit.

### CLONE-06 Complete admin flow
Test admin login, non-admin denial, CRUD/lifecycle, uploads, customer communication, notifications, reporting, refresh persistence and unauthorized data denial.

### CLONE-07 Verify PWA/offline
Test handoff and install separately; manifest/icons, service-worker scope/update, standalone suppression, cache cleanup, offline content, stale notice, reconnect and write truthfulness. Private data must not enter public cache.

### CLONE-08 Release checkpoint
Run available checks, inspect diff/status, update AGENTS and map, commit coherently, push to intended branch when authorized, check CI, check exact Vercel SHA/status, and separately verify Firebase rules/index deployment. Avoid unnecessary production deployments during iteration.

## 06 — Verification matrix

| ID | Area | Minimum evidence |
|---|---|---|
| V01 | Identity | Script passes; title, manifest, icons, cache, domain and old-brand scan inspected. |
| V02 | Build | Typecheck, lint and build pass on exact candidate SHA. |
| V03 | Public content | Published/in-date appears; draft, paused, future and expired do not. |
| V04 | Request | Saves once; owner/admin can see it; failure preserves input and says not sent. |
| V05 | Privacy | Other customer cannot read request, conversation, file, token or profile. |
| V06 | Admin | Owner/staff allowed; unauthorized users denied at UI/API/database/storage. |
| V07 | Upload | File constraints, rejection, URL persistence, rules and production credentials verified. |
| V08 | Analytics | Event allow-list/payload bounds; no PII leak; event not counted as sale. |
| V09 | PWA | Manifest, icons, service worker, handoff, install/fallback and installed state checked. |
| V10 | Offline | Public snapshot after online load; stale notice; no private cache; writes not falsely confirmed. |
| V11 | Push | Permission, token, send, service worker and actual device display recorded separately. |
| V12 | Firebase deploy | Active project and deployed rules/indexes confirmed; source is insufficient. |
| V13 | Deployment | Exact source SHA has READY deployment; deployed routes checked. |
| V14 | Recovery | Retry/idempotency, missing config, network failure, stale cache and interrupted flow tested. |

Use PASS / FAIL / NOT RUN / BLOCKED with exact evidence. NOT RUN never becomes PASS because source looks correct.

## 07 — Baseline findings and open work

### Source-confirmed
- package.json defines dev/build/start/lint/verify:identity; build runs identity verification.
- CI runs npm ci, typecheck, lint and build.
- firebase.json declares Firestore rules/indexes, Storage rules, and Auth/Firestore/Storage emulator ports.
- PWA source has shell/public/media cache versioning and a local public storefront snapshot.
- Request, account, saved finds, storefront, admin, analytics API, messaging-config API and rules/index files have identifiable paths.
- README explicitly states Saved Finds are device-local and requests are not online payment checkout.

### Not established
- Whether live Vercel deployment is READY and matches the latest commit.
- Whether Firestore/Storage rules and indexes are deployed to the intended Firebase project.
- Whether current production environment variables support all API, upload, auth and notification flows.
- Whether Android/iOS/desktop install, handoff and offline behavior pass on physical devices.
- Whether push is displayed on a real device.
- Whether UploadThing image/PDF uploads work in production.
- Whether a formal automated unit/rules/browser test suite exists beyond inspected scripts/workflow.
- Actual conversion, retention, revenue or causal campaign impact.

### Priority
1. Re-check main SHA and deployment. At audit baseline b9b347f, the combined status returned a Vercel failure linking to a build-rate-limit upgrade page; this is not a successful production deployment.
2. Identify and inspect the actual Firebase rules deployment workflow and latest run.
3. Run checks against the exact candidate SHA in a local checkout or CI.
4. Execute V01–V14 and record real evidence.
5. Treat The Plug as flagship candidate, not a certified template, until verification gaps are closed.

## 08 — Map maintenance rules

- Update labels and paths when files/routes change.
- Any new API, collection, field, Storage path, env variable, cache namespace or privileged role must document callers, readers, writers, rules, cost and tests.
- Never store secrets, tokens or private customer data here.
- AGENTS.md remains the behavior contract; this file is the source map and traceability layer.
- A clone needs a destination-specific map: remove The Plug business policy, retain generic workflow and verification method.


## 09 — Supplemental trace: server routes, shared data helpers and inherited BOEMO footprint

This section records a deeper source scan completed after the initial map draft. It is especially important when deciding whether The Plug is safe to clone without importing unrelated behavior.

### K — Server/API route inventory

| Label | Route source | Purpose / caller |
|---|---|---|
| K01 | src/app/api/operations-login/route.ts | Server-side operations login; validates credentials/role before issuing the custom-auth result used by AdminGate. Inspect rate limiting, secret handling and failure responses before modifying. |
| K02 | src/app/api/sourcing-request/route.ts | Authenticated server-side sourcing-request operation, using Firebase Admin and sourcingRequests records. |
| K03 | src/app/api/sourcing-request/approve-quote/route.ts | Customer quote approval endpoint; ownership and request state are security-critical. |
| K04 | src/app/api/analytics/journey/route.ts | Authenticated analytics event acceptance. |
| K05 | src/app/api/firebase/messaging-sw-config/route.ts | Dynamic client-safe Firebase config for service worker. |
| K06 | src/app/api/notifications/sourcing-request/route.ts | Notification path associated with a new sourcing request. |
| K07 | src/app/api/notifications/request-updated/route.ts | Notification path associated with request status changes. |
| K08 | src/app/api/notifications/message-created/route.ts | Notification path associated with new conversation messages. |
| K09 | src/app/api/notifications/test/route.ts | Admin/customer notification test path; inspect role and token handling. |
| K10 | src/app/api/uploadthing/route.ts | UploadThing Next route adapter. |
| K11 | src/app/api/uploadthing/core.ts | UploadThing router and constraints. |

For every privileged route, inspect: HTTP method, authentication token source, token verification, role/ownership checks, request schema, allowed state transition, idempotency, response semantics, logs/PII, and which Firebase project credentials initialize Firebase Admin. A client call receiving HTTP success is not necessarily proof that a notification displayed or that a business operation completed as intended.

**Operations login follow-up:** the shared access-word endpoint now applies a Firestore-backed per-source-address limit (five attempts per 15 minutes), emits HTTP 429 with `Retry-After`, rejects oversized declared bodies, and prunes expired limiter records in bounded batches. This is defense in depth; it does not replace migrating to individual admin identities or configuring platform-level edge rate limiting.

The message-created endpoint also claims a deterministic `notificationDeliveries` record before sending and suppresses duplicate retries for five minutes; successful deliveries are marked sent. The customer-triggered sourcing-request notification uses the same five-minute claim pattern and only sends to current owner/staff recipients; both routes prune tokens only when Firebase reports them invalid.

**Notification maintenance:** the scheduled reminder endpoint now compares its bearer secret using a constant-time digest comparison. Conversation notifications delete Firebase Messaging tokens only when Firebase explicitly reports them invalid/unregistered; transient delivery failures are not treated as invalid tokens.

**UploadThing attachment boundary:** the request attachment route now requires a valid Firebase ID token before it issues an upload URL; the request form sends the current anonymous-or-registered user's token. Server-side file limits remain one image or PDF up to 4 MB. Unauthenticated uploads are rejected before the file upload is authorized. Runtime upload verification is still pending.

**Notification test ownership check:** `/api/notifications/test` must only send to a device token already registered beneath the authenticated UID. The route has been hardened to verify this relationship before calling Firebase Messaging. This adds one bounded token lookup only when a user explicitly requests a notification test; it does not send messages or read customer records during static checks. The conversation-message notification API also verifies that customer messages belong to the conversation's customer UID, that admin replies come from a current owner/staff account, and that recipient IDs come from the conversation record rather than client input.

**K01 follow-up (source-verified):** `src/app/admin/admin-gate.tsx` is the only observed UI caller. The route currently accepts a shared `THE_PLUG_OPERATIONS_WORD`, issues a custom token for fixed UID `the-plug-temporary-operations`, and merges `role: owner` into `admins/{uid}`. Persistent throttling is not implemented in the route. A targeted gate fix on branch `docs/flagship-repo-audit-2026-10-12` now clears authorization on every auth transition, ignores stale role-listener callbacks, and denies access when role verification fails. This reduces stale authorization risk but does **not** solve brute-force protection or the shared-owner-identity design. Do not claim the operations login is fully hardened until rate limiting, secret strength, identity recovery, and direct API/rules boundaries have been tested.

### L — Supporting UI and data modules

| Label | Source path | Responsibility / coupling |
|---|---|---|
| L01 | src/lib/firebase/data.ts | Shared customer/profile/conversation/notification helpers, but also exports food-order, menu, business settings and daily reconciliation helpers inherited from BOEMO. |
| L02 | src/lib/firebase/plug-data.ts | The Plug-specific sourcingRequests data contract and subscriptions; includes a server API interaction. |
| L03 | src/components/StorefrontPublishing.tsx | Admin editor for storefront content; route wrapper is src/app/admin/storefront/page.tsx. |
| L04 | src/app/admin/storefront/page.tsx | AdminGate-protected storefront publishing route. |
| L05 | src/app/admin/community/page.tsx | AdminGate-protected community publishing route. |
| L06 | src/app/admin/community/admin-community-dashboard.tsx | Admin community operations UI; verify exact path and role/data boundaries before edits. |
| L07 | src/components/AdminConversations.tsx | Admin conversation list, selected conversation, messages, attachments and message-created notification path. |
| L08 | src/components/CustomerConversations.tsx | Customer-side private conversation list. |
| L09 | src/components/ConversationPanel.tsx | Shared conversation interaction surface; inspect before changing message semantics or attachment behavior. |
| L10 | src/components/NotificationSettings.tsx | Notification opt-in, Firebase Messaging token flow, preferences and test notification action. |
| L11 | src/lib/firebase/notifications.ts | Client messaging initialization helper (verify current file before edits). |
| L12 | src/components/MemberCircle.tsx | Friend invites and connections. |
| L13 | src/components/MemberPrivacySettings.tsx | Member privacy preferences and activity cleanup/batch behavior. |
| L14 | src/components/MemberActivityFeed.tsx | Friend connections, member feed preferences and community activity reads. |
| L15 | src/components/MemberPrivacySettings.tsx + src/components/MemberActivityFeed.tsx | These must be reviewed together with Firestore rules; UI filters are not an authorization boundary. |

### M — Firestore collection map observed in rules and helpers

| Collection/path | Purpose | Clone decision |
|---|---|---|
| admins/{uid} | Admin role records | Preserve role boundary; recreate only through controlled admin bootstrap. |
| customers/{uid} | Customer profile | Adapt schema and privacy policy to destination. |
| sourcingRequests/{requestId} | The Plug customer requests and quote/status flow | Core Plug domain; reuse only when the new app has sourcing-like workflow. |
| storefrontContent/{contentId} | Curated public finds/offers | Reuse for retail/editorial catalog only. |
| conversations/{conversationId}/messages/{messageId} | Private messages | Reuse only after owner/admin rules and attachment behavior are tested. |
| notificationPreferences/{uid} | Notification preferences | Adapt event/setting schema; keep opt-in explicit. |
| notificationTokens/{uid}/tokens/{tokenId} | Device/browser tokens | Never copy token data; bind tokens to destination users/project. |
| customerJourneyEvents/{eventId} | Behavioral analytics | Reuse event discipline, not Plug-specific event names or assumed outcomes. |
| memberSettings/{uid} | Member/privacy settings | Plug-specific; enable only when destination needs these controls. |
| memberFeedPreferences/{uid} | Feed audience preferences | Plug-specific; keep audience enforcement in rules. |
| friendInvites/{inviteId} | Invitation state | Plug-specific; acceptance must be explicit and authorized. |
| friendConnections/{connectionId} | Confirmed relationships | Plug-specific; test ownership and removal. |
| communityActivity/{activityId} | Published community activity | Plug-specific; consent and completed-record rules matter. |
| memberships/{uid} | Membership/benefit state | Never infer membership from login or request submission. |
| orders/{orderId}, menu/{itemId}, dailyReconciliations/{date} | Legacy food-order/menu/reconciliation model in Firestore rules and shared data helper | Treat as inherited BOEMO footprint; do not carry into a new product without a documented need and end-to-end test. |
| businessSettings/{settingId} | Shared settings plus storefront disclaimer configuration | Inspect each document's purpose; do not delete wholesale because some settings may be Plug-specific. |

Storage rules also include **boemoMedia/{fileName}** in addition to storefrontMedia and conversationAttachments. That is a confirmed inherited brand-specific path. Do not assume it is unused until all references and deployed data are checked; for a new clone, either remove it with a coordinated code/rules migration or explicitly document why it remains.

### N — Important inherited-code finding

SOURCE-VERIFIED: src/lib/firebase/data.ts exports food-specific types/functions such as FoodOrder, MenuItem, DailyReconciliation, createFoodOrder, subscribeToFoodOrders, menu seeding and daily reconciliation. firestore.rules still has rules for orders, menu and dailyReconciliations. storage.rules still contains boemoMedia. The Plug also has Plug-specific sourcingRequests, storefrontContent, community, conversation and analytics data.

**Interpretation:** this is an inherited BOEMO code/rules footprint. It is not automatically a live vulnerability or proof that the old collections are used in production; those conclusions require call-site and deployed-data verification. It is, however, a clone-risk and maintenance risk. New chats must not copy these collections into a destination merely because they exist in the foundation.

**Required follow-up before certifying The Plug as a reusable foundation:**
1. Trace every export from src/lib/firebase/data.ts to all call sites. Classify each export as USED BY THE PLUG, UNUSED/LEGACY, or UNCERTAIN.
2. Inspect Firestore rules for every match block, including the final catch-all deny. Confirm each collection has least-privilege read/write semantics.
3. Trace every Storage path from source references and rules. Confirm whether boemoMedia has any current writer/reader or retained customer asset.
4. Determine whether orders/menu/dailyReconciliations are queried or written by mounted Plug routes, admin components or API handlers.
5. Do not delete legacy code/rules until usage, live data, indexes and deployed-project effects are understood. Then remove or isolate in a dedicated reviewed change, with rules tests and rollback.
6. Ensure businessSettings documents needed for the editable storefront disclaimer remain supported if legacy food settings are removed.
7. Record the final disposition and test evidence in this map.

This finding should be addressed before describing The Plug as a clean, generic starter. The correct goal is a reusable core plus explicitly optional domain modules—not accidental inheritance of a food-order system.

### O — Routes and component dependencies worth tracing next

- src/components/PlugAdminDashboard.tsx → src/lib/firebase/plug-data.ts, src/components/AdminConversations.tsx, customerJourneyEvents and request-updated notification endpoint.
- src/app/request/request-form.tsx → src/lib/firebase/plug-data.ts, src/lib/firebase/data.ts, UploadThing helper, analytics helper and sourcing-request notification endpoint.
- src/app/account/page.tsx → src/lib/firebase/data.ts, plug-data.ts, NotificationSettings, CustomerConversations, MemberCircle, MemberPrivacySettings and MemberActivityFeed.
- src/components/StorefrontFeed.tsx → storefrontContent, businessSettings/storefrontDisclaimer, saved-finds helper, analytics helper and request route.
- src/components/NotificationSettings.tsx → Firebase messaging helper, notification preferences/token helpers, analytics and notification-test API.
- src/components/MemberCircle.tsx / MemberPrivacySettings.tsx / MemberActivityFeed.tsx → friendInvites, friendConnections, memberSettings, memberFeedPreferences and communityActivity plus corresponding rules.
- src/components/AdminConversations.tsx → conversation helpers, Storage attachment uploads and message-created notification endpoint.

When changing one of these flows, read all named modules and the associated Firestore/Storage rules together. Avoid fixing one UI component while leaving a conflicting API, data helper or rule behind.

## 10 — Executable clone-readiness gates

### Command

\`npm run verify:clone-readiness\`

Implementation: \`scripts/verify-clone-readiness.mjs\`; package command is declared in \`package.json\`; GitHub quality workflow invokes it before TypeScript/lint/build.

This is deliberately a zero-network, zero-Firebase-cost static audit. It checks:
- Required project instructions, labelled map, app-factory SOP and PWA foundation notes exist.
- Identity/readiness scripts and required package commands exist.
- Manifest has product identity and valid local icon paths; service worker has a versioned The Plug cache namespace and an app-shell caching strategy.
- Canonical customer, admin, sourcing-request, quote-approval and analytics paths exist.
- Firebase config points at the committed Firestore/Storage rules and rules files contain deny-all fallback matches.
- The source map contains the expected label set and accurately records the legacy footprint.
- The Firebase rules deployment workflow and expected secret *names* are wired without printing secret values.
- Known inherited food-order/menu/reconciliation symbols, historical order routes, the old BOEMO storage path and BOEMO-named cron secret are reported as warnings, not silently deleted.

### Run order for local work

\`\`\`bash
npm ci
npm run verify:identity
npm run verify:clone-readiness
npx tsc --noEmit
npm run lint
npm run build
\`\`\`

No test runner is currently declared in the inspected package.json. Do not call these static gates “end-to-end tests.” Add focused tests using existing Node tooling or a deliberately selected no-cost local emulator only after inspecting the actual behavior to cover.

## 11 — Explicit legacy disposition and route findings

### Source-verified observations

- `src/app/order/page.tsx` redirects the canonical `/order` route to `/request`; `/book` also redirects to `/request`.
- `src/app/products/[id]/product-detail.tsx` still loads `MenuItem` records through legacy `getMenuItems` / `readCachedMenuItems` from `src/lib/firebase/data.ts`, not the current `storefrontContent` feed. Treat it as a legacy public route until callers, historical links and deployed data are checked.
- \`src/app/order/order-form.tsx\` still imports and uses the food-menu/order data helpers, but that file is not the canonical \`/order\` route implementation. Do not infer global dead-code status from that observation alone.
- \`src/app/orders/[id]/page.tsx\` still implements order tracking against the legacy \`orders\` collection and local same-device fallback. A direct/historical tracking URL may still be used even though the current order route redirects elsewhere.
- \`src/lib/firebase/data.ts\` combines Plug-relevant customer profile, conversation and notification helpers with legacy food order, menu and daily reconciliation exports. It is not safe to delete the module as a whole.
- \`src/app/api/notifications/order-created/route.ts\` remains present and authenticates a Firebase ID token before invoking the old order-notification path.
- \`firestore.rules\` still contains order/menu/reconciliation rules; \`storage.rules\` still contains a public-read \`boemoMedia\` path. Source presence does not establish deployed use, and public-read access does not by itself prove sensitive content is stored there.
- \`.github/workflows/pickup-reminders.yml\` and \`src/app/api/notifications/reminders/route.ts\` use \`BOEMO_REMINDER_CRON_SECRET\`. This inherited environment-variable name is an operational dependency; renaming it requires a coordinated secret/config change and is not an identity-only rename.

### Required classification before any removal

For every legacy symbol/path, add one disposition and evidence:

| Disposition | Evidence required |
|---|---|
| ACTIVE / KEEP | Current caller or scheduled workflow, intended behavior, rules and runtime evidence |
| HISTORICAL / PRESERVE | Customer-facing old links, required record access, or business records that must remain readable |
| DEAD / REMOVE | Repository-wide caller scan plus route/cron check and authorized read-only evidence that no required live data depends on it |
| MIGRATE | Destination schema, data mapping, rollback, emulator tests, rules/index changes and a scheduled deployment plan |
| UNCERTAIN / HOLD | Any missing evidence; default disposition until investigated |

### Safe next engineering step

Do not strip legacy data or rules in the documentation PR. Complete a caller matrix for every export in \`src/lib/firebase/data.ts\`, identify every reader/writer of the old collections and Storage prefix, inspect historical links and scheduled jobs, and verify the Firebase project ID/rules deployment state without exposing credentials. Then make a separate, tightly scoped code/rules change with emulator evidence. Preserve existing customer history unless a verified migration or retention decision says otherwise.

## 12 — Evidence still outstanding

The following are not certified by the static audit or documentation PR:
- Firebase configuration was explicitly confirmed as handled by the user on 2026-10-12. Do not reopen the prior workflow-secret failure unless fresh evidence shows a current problem. This PR does not deploy rules or independently verify the currently deployed rules.
- Firebase project identity and current data presence for legacy collections/prefixes.
- Request creation → admin view → quote → customer approval → request status → conversation → customer notification as one end-to-end journey.
- Actual FCM token registration, notification delivery and failure handling on supported devices.
- UploadThing now requires a verified Firebase ID token before authorizing a 4 MB image/PDF upload. Actual upload/download, access behavior and unauthenticated rejection still require runtime verification.
- WhatsApp/in-app browser handoff and normal-browser destination preservation on real devices.
- Native install event and fallback instructions on Android/iOS/desktop.
- Offline shell/content behavior, cache invalidation and recovery after reconnect.
- Admin authorization at UI, API, Firestore and Storage boundaries.
- Production deployment SHA and current production smoke tests.

For every row, update status only with an evidence link, exact SHA/environment, date, test action and result. “Not tested” is an acceptable honest status; an invented PASS is not.

## 13 — Privileged API and data-cost findings from source review

This is source inspection, not penetration testing. Findings below require careful handling because the product is live and admin/request workflows must be preserved.

### K01 — Operations login is a high-priority security review

Source: `src/app/api/operations-login/route.ts`.

SOURCE-VERIFIED behavior:
- Accepts the shared `THE_PLUG_OPERATIONS_WORD` and compares it using a timing-safe hash comparison.
- Uses Firestore-backed per-source-address throttling: five attempts per 15-minute window, HTTP 429 with `Retry-After`, oversized declared-body rejection, and bounded cleanup of expired limiter records.
- Still issues a custom token for fixed UID `the-plug-temporary-operations` and writes/merges `{role: "owner", temporaryAccess: true}` into `admins/{uid}` after a successful shared-word login.

Risk interpretation: the new throttle is defense in depth, not proof of brute-force resistance against distributed sources. Anyone who obtains the shared word receives the same owner-level identity, so individual operators are not attributable. Individual authenticated admin identities, least-privilege roles, and platform edge rate limiting remain preferred.

Required follow-up:
1. Verify the limiter with repeated and concurrent attempts against a non-production environment.
2. Verify secret strength/rotation policy without revealing the secret.
3. Plan a migration to individual authenticated admin identities with least privilege.
4. Preserve and test an owner recovery path before changing the login.
5. Test wrong-word responses, repeated attempts, valid login, session expiry, direct API calls and non-admin access.
6. Do not silently remove or rotate `THE_PLUG_OPERATIONS_WORD`; it can lock the operator out. Do not certify the admin surface until role boundaries and unauthorized direct API/database access have been tested.

### K02 — Sourcing request API

Source: \`src/app/api/sourcing-request/route.ts\`.

Observed safeguards: verifies a Firebase ID token; validates an explicit field allowlist, required fields, field lengths and delivery method; verifies \`customerId\` matches the token UID; creates the record transactionally; checks an existing request ID for an apparent same-customer retry.

Follow-up: test invalid/missing tokens, oversized JSON/body handling, malicious attachment URLs/metadata, conflicting request-ID reuse, concurrent retries and actual Firestore rules. Do not treat the transaction's duplicate response as proof that every field in the retry matches the original.

### K03 — Quote approval API

Source: \`src/app/api/sourcing-request/approve-quote/route.ts\`.

Observed safeguards: verifies Firebase ID token, checks request ownership, requires a finite non-negative quote, restricts approval to the expected statuses, and records price/time/UID inside a transaction.

Follow-up: test owner mismatch, missing/negative/non-finite quote, stale status, duplicate approval, concurrent status changes and admin/customer notifications. The source review is not a concurrency or live-data test.

### K04 — Journey analytics write cost

Source: \`src/app/api/analytics/journey/route.ts\`.

Each accepted event currently performs an admin-document lookup before writing the event; customer events then add a \`customerJourneyEvents\` document. That is at least one Firestore document read per accepted event plus a write, excluding token verification and retries. This is a deliberate current cost profile, not a bill estimate. Avoid replaying event requests in production; test using local fixtures/emulator or a controlled low-volume QA account. Future optimization must preserve the rule that admin activity is excluded from customer analytics.

### K05 — Firebase credentials are two distinct operational paths

- Vercel server APIs use \`FIREBASE_ADMIN_KEY\` in inspected routes.
- The GitHub rules deployment workflow expects \`FIREBASE_SERVICE_ACCOUNT_JSON\` and \`FIREBASE_PROJECT_ID\`.

Do not assume setting one configures the other. Never expose either secret. Confirm the project identity each credential targets before deploying rules or testing writes.

### Required security verification before certification

- Individual admin attribution or documented, time-bounded shared access risk acceptance.
- Rate-limit/brute-force protection for the privileged login.
- Admin route, API, Firestore and Storage denial tests for unauthenticated and wrong-role identities.
- Customer request ownership and quote-approval negative tests.
- Confirmation that public Storage paths contain only intentionally public assets.
- Redacted logs and no credentials/customer private content in CI artifacts.
