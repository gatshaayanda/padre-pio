import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const warnings = [];
const checks = [];

function check(label, condition, detail = "") {
  checks.push({ label, passed: Boolean(condition), detail });
  if (!condition) failures.push(label + (detail ? " — " + detail : ""));
}
function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}
function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}
function warn(label, detail) {
  warnings.push({ label, detail });
}

check("Repository instructions exist", exists("AGENTS.md"));
check("Labelled source map exists", exists("AGENTS_REPO_LABELED.md"));
check("Reusable app-factory SOP exists", exists("docs/ADMIN-HUB-APP-FACTORY-SOP.md"));
check("Ordered clone/reset checklist exists", exists("docs/CLONE-RESET-CHECKLIST.md"));
check("PWA foundation notes exist", exists("docs/PWA-FOUNDATION.md"));
check("Identity verification script exists", exists("scripts/verify-identity.mjs"));
check("Per-project identity configuration exists", exists("scripts/identity.config.json"));
check("Identity verifier reads per-project configuration", exists("scripts/verify-identity.mjs") && /identity\.config\.json/.test(read("scripts/verify-identity.mjs")));
check("Firestore rules file exists", exists("firestore.rules"));
check("Storage rules file exists", exists("storage.rules"));
check("Firebase configuration exists", exists("firebase.json"));
check("Firestore indexes file exists", exists("firestore.indexes.json"));
const indexesConfig = JSON.parse(read("firestore.indexes.json"));
check("Firestore indexes file has valid Firebase CLI structure", Array.isArray(indexesConfig.indexes) && Array.isArray(indexesConfig.fieldOverrides));

const packageJson = JSON.parse(read("package.json"));
const scripts = packageJson.scripts ?? {};
check("Identity verification is a package script", typeof scripts["verify:identity"] === "string");
check("Clone-readiness verification is a package script", typeof scripts["verify:clone-readiness"] === "string");
check("Production build invokes identity verification", /verify:identity/.test(scripts.build ?? ""));
check("Lint script exists", typeof scripts.lint === "string");
const localNodeMajor = read(".nvmrc").trim().replace(/^v/, "").split(".")[0];
const qualityWorkflow = read(".github/workflows/quality.yml");
const ciNodeMajor = qualityWorkflow.match(/node-version:.*?(\d+)/)?.[1];
check("Local Node major matches CI Node major", Boolean(localNodeMajor && ciNodeMajor && localNodeMajor === ciNodeMajor), "local=" + localNodeMajor + ", CI=" + (ciNodeMajor ?? "not detected"));
check("CI runs identity and clone-readiness gates explicitly", /run: npm run verify:identity/.test(qualityWorkflow) && /run: npm run verify:clone-readiness/.test(qualityWorkflow));

const manifest = JSON.parse(read("public/manifest.webmanifest"));
const generatedManifest = read("src/app/manifest.ts");
const identityConfig = JSON.parse(read("scripts/identity.config.json"));
check("Identity config matches public manifest", manifest.name === identityConfig.manifestName && manifest.short_name === identityConfig.shortName && manifest.theme_color === identityConfig.themeColor && manifest.icons?.some((icon) => icon.src === identityConfig.canonicalIcon));
check("Generated and public manifests keep identity fields aligned", generatedManifest.includes('name: "' + manifest.name + '"') && generatedManifest.includes('short_name: "' + manifest.short_name + '"') && generatedManifest.includes('theme_color: "' + manifest.theme_color + '"') && generatedManifest.includes('src: "' + identityConfig.canonicalIcon + '"'));
check("Clone checklist documents explicit stop conditions", /STOP:/.test(read("docs/CLONE-RESET-CHECKLIST.md")) && /PASS:/.test(read("docs/CLONE-RESET-CHECKLIST.md")));
check("Manifest has product name", typeof manifest.name === "string" && manifest.name.trim().length > 0);
check("Manifest has short name", typeof manifest.short_name === "string" && manifest.short_name.trim().length > 0);
check("Manifest has icons", Array.isArray(manifest.icons) && manifest.icons.length > 0);
for (const icon of manifest.icons ?? []) {
  check("Manifest icon exists: " + icon.src, typeof icon.src === "string" && exists(path.join("public", icon.src.replace(/^\/+/, ""))));
}
check("Service worker exists", exists("public/sw.js"));
if (exists("public/sw.js")) {
  const sw = read("public/sw.js");
  check("Service worker has versioned cache namespace", /theplug-shell-v\d+/.test(sw));
  check("Service worker uses installable app shell", /addAll|cache\.add|cache\.put/.test(sw));
  check("Service worker caches configured Firebase Storage images separately", /isConfiguredStorefrontImage/.test(sw) && /cacheStorefrontImage/.test(sw) && /MEDIA_LIMIT\s*=\s*80/.test(sw));
}
check("Root app route exists", exists("src/app/page.tsx"));
check("Customer request route exists", exists("src/app/request/page.tsx"));
check("Customer account route exists", exists("src/app/account/page.tsx"));
check("Admin route exists", exists("src/app/admin/page.tsx"));
check("Admin gate clears stale authorization on auth changes", exists("src/app/admin/admin-gate.tsx") && /setAuthorized\(false\)/.test(read("src/app/admin/admin-gate.tsx")));
check("Admin gate ignores stale role-listener callbacks", exists("src/app/admin/admin-gate.tsx") && /generation\s*!==\s*authGeneration/.test(read("src/app/admin/admin-gate.tsx")));
check("Admin gate fails closed when role verification fails", exists("src/app/admin/admin-gate.tsx") && /setAuthorized\(false\);[\s\S]{0,180}setOffline\(true\)/.test(read("src/app/admin/admin-gate.tsx")));
check("Sourcing-request API exists", exists("src/app/api/sourcing-request/route.ts"));
check("Quote-approval API exists", exists("src/app/api/sourcing-request/approve-quote/route.ts"));
check("Analytics API exists", exists("src/app/api/analytics/journey/route.ts"));
check("Notification test API checks registered device-token ownership", exists("src/app/api/notifications/test/route.ts") && /notificationTokens/.test(read("src/app/api/notifications/test/route.ts")) && /registered\.empty/.test(read("src/app/api/notifications/test/route.ts")));
check("Conversation notification API enforces sender role and conversation ownership", exists("src/app/api/notifications/message-created/route.ts") && /uid!==customerId/.test(read("src/app/api/notifications/message-created/route.ts")) && /senderAdmin\.exists/.test(read("src/app/api/notifications/message-created/route.ts")) && /Invalid message sender role/.test(read("src/app/api/notifications/message-created/route.ts")));
check("Conversation push notification retries are idempotency-guarded", exists("src/app/api/notifications/message-created/route.ts") && /notificationDeliveries/.test(read("src/app/api/notifications/message-created/route.ts")) && /duplicate:true/.test(read("src/app/api/notifications/message-created/route.ts")) && /claimedAtMs/.test(read("src/app/api/notifications/message-created/route.ts")));
check("Sourcing request push notifications are ownership-checked and idempotency-guarded", exists("src/app/api/notifications/sourcing-request/route.ts") && /decoded\.uid/.test(read("src/app/api/notifications/sourcing-request/route.ts")) && /notificationDeliveries/.test(read("src/app/api/notifications/sourcing-request/route.ts")) && /duplicate:true/.test(read("src/app/api/notifications/sourcing-request/route.ts")));
check("Sourcing request API validates ownership and request data", /verifyIdToken/.test(read("src/app/api/sourcing-request/route.ts")) && /validRequestData/.test(read("src/app/api/sourcing-request/route.ts")) && /data.customerId!==uid/.test(read("src/app/api/sourcing-request/route.ts")));
check("Quote approval validates request IDs and customer ownership", /A-Za-z0-9_-\]\{10,128\}/.test(read("src/app/api/sourcing-request/approve-quote/route.ts")) && /data.customerId!==token.uid/.test(read("src/app/api/sourcing-request/approve-quote/route.ts")) && /status:404 as const/.test(read("src/app/api/sourcing-request/approve-quote/route.ts")));
check("Request APIs return generic server errors instead of raw unexpected exceptions", /Check My requests before retrying/.test(read("src/app/api/sourcing-request/route.ts")) && /Refresh My Plug and try again/.test(read("src/app/api/sourcing-request/approve-quote/route.ts")) && /status:500/.test(read("src/app/api/sourcing-request/route.ts")) && /status:500/.test(read("src/app/api/sourcing-request/approve-quote/route.ts")));
check("Notification endpoints expose attempted/successful/failed push counts", ["src/app/api/notifications/message-created/route.ts", "src/app/api/notifications/sourcing-request/route.ts"].every((file) => /attemptedCount/.test(read(file)) && /failedCount/.test(read(file)) && /status/.test(read(file))));
check("Notification endpoints return a failure status when no push is delivered", ["src/app/api/notifications/message-created/route.ts", "src/app/api/notifications/sourcing-request/route.ts"].every((file) => /status:sent===0\?503:200/.test(read(file))));
check("UploadThing request attachments require a verified Firebase ID token", exists("src/app/api/uploadthing/core.ts") && /verifyIdToken/.test(read("src/app/api/uploadthing/core.ts")) && /\.middleware\(/.test(read("src/app/api/uploadthing/core.ts")) && /headers:\{Authorization:/.test(read("src/app/request/request-form.tsx")));
check("Reminder cron secret comparison is timing-safe", exists("src/app/api/notifications/reminders/route.ts") && /timingSafeEqual/.test(read("src/app/api/notifications/reminders/route.ts")) && /matchesSecret/.test(read("src/app/api/notifications/reminders/route.ts")));
check("Operations login has persistent attempt throttling", exists("src/app/api/operations-login/route.ts") && /LOGIN_MAX_ATTEMPTS\s*=\s*5/.test(read("src/app/api/operations-login/route.ts")) && /operationsLoginRateLimits/.test(read("src/app/api/operations-login/route.ts")) && /status:429/.test(read("src/app/api/operations-login/route.ts")));
check("Storefront source exists", exists("src/components/StorefrontFeed.tsx"));

const firebaseConfig = JSON.parse(read("firebase.json"));
check("Firebase config points to Firestore rules", firebaseConfig.firestore?.rules === "firestore.rules");
check("Firebase config points to Firestore indexes", firebaseConfig.firestore?.indexes === "firestore.indexes.json");
check("Firebase config points to Storage rules", firebaseConfig.storage?.rules === "storage.rules");
const firestoreRules = read("firestore.rules");
check("Firestore rules contain final deny-all fallback", /match\s+\/\{document=\*\*\}\s*\{[\s\S]*?allow\s+read,\s*write\s*:\s*if\s+false\s*;?/.test(firestoreRules));
const storageRules = read("storage.rules");
check("Storage rules contain deny-all fallback", /match\s+\/\{allPaths=\*\*\}\s*\{\s*allow\s+read,\s*write\s*:\s*if\s+false\s*;?\s*\}/.test(storageRules));

const envExample = read(".env.example");
for (const variable of ["NEXT_PUBLIC_BASE_URL", "NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "NEXT_PUBLIC_FIREBASE_APP_ID", "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", "NEXT_PUBLIC_FIREBASE_VAPID_KEY", "FIREBASE_ADMIN_KEY", "UPLOADTHING_TOKEN", "THE_PLUG_OPERATIONS_WORD", "BOEMO_REMINDER_CRON_SECRET", "FIREBASE_PROJECT_ID"]) {
  check("Environment example documents " + variable, new RegExp("^" + variable + "=", "m").test(envExample));
}
check("Root agent instructions link the clone/reset checklist", /docs\/CLONE-RESET-CHECKLIST\.md/.test(read("AGENTS.md")));
check("Root agent instructions require the end-to-end CLONING.md guide", /CLONING\.md/.test(read("AGENTS.md")) && exists("CLONING.md"));
check("CLONING.md documents all ordered gates", ["Gate 0", "Gate 1", "Gate 2", "Gate 3", "Gate 4", "Gate 5", "Gate 6", "Gate 7"].every((gate) => read("CLONING.md").includes(gate)));

const sourceMap = read("AGENTS_REPO_LABELED.md");
for (const requiredLabel of ["## 00", "## 01", "## 02", "## 03", "## 04", "## 05", "## 06", "## 07", "## 08", "## 09", "## 10", "## 11", "## 12", "## 13"]) {
  check("Source map includes " + requiredLabel, sourceMap.includes(requiredLabel));
}
check("Source map states runtime evidence limitations", /NOT-RUNTIME-VERIFIED/.test(sourceMap));
check("Source map records BOEMO legacy footprint", /boemoMedia/.test(sourceMap) && /dailyReconciliations/.test(sourceMap));

const legacyFiles = [
  ["src/lib/firebase/data.ts", /FoodOrder|MenuItem|DailyReconciliation|dailyReconciliations|collection\(db,\s*["']orders["']\)/],
  ["src/app/order/order-form.tsx", /createFoodOrder|getMenuItems/],
  ["src/app/orders/[id]/page.tsx", /getFoodOrder|subscribeToFoodOrder/],
  ["firestore.rules", /match\s+\/orders\/|match\s+\/menu\/|dailyReconciliations/],
  ["storage.rules", /boemoMedia/],
  [".github/workflows/pickup-reminders.yml", /BOEMO_REMINDER_CRON_SECRET/],
];
for (const [file, pattern] of legacyFiles) {
  if (exists(file) && pattern.test(read(file))) {
    warn("Inherited/legacy footprint still present", file + " matches " + pattern + ". Do not delete until call sites, live data, historical links, scheduled jobs, and deployed rules have been checked.");
  }
}

const rulesWorkflow = ".github/workflows/firebase-rules-deploy.yml";
check("Firebase rules deployment workflow exists", exists(rulesWorkflow));
check("Firebase deploy workflow covers Firestore index changes", exists(rulesWorkflow) && /firestore\.indexes\.json/.test(read(rulesWorkflow)) && /firebase deploy --only firestore:indexes/.test(read(rulesWorkflow)) && /indexes-changed/.test(read(rulesWorkflow)));
if (exists(rulesWorkflow)) {
  const workflow = read(rulesWorkflow);
  check("Rules deployment is restricted to main pushes/manual dispatch", /branches:\s*\n\s+-\s+"?main"?/.test(workflow) && /workflow_dispatch/.test(workflow));
  if (!/secrets\.FIREBASE_SERVICE_ACCOUNT_JSON/.test(workflow) || !/secrets\.FIREBASE_PROJECT_ID/.test(workflow)) {
    warn("Firebase deploy credentials need review", "The workflow does not reference both expected secret names. Check configuration without printing secret values.");
  }
}

console.log("\nThe Plug clone-readiness audit — " + checks.filter((item) => item.passed).length + "/" + checks.length + " static checks passed.");
for (const item of checks.filter((item) => !item.passed)) console.error("FAIL  " + item.label + (item.detail ? " — " + item.detail : ""));
for (const item of warnings) console.warn("WARN  " + item.label + ": " + item.detail);
console.log("\nThis is a local/static repository audit. It does not read Firebase, spend database reads, deploy rules, test push delivery, inspect Vercel production, or prove real-device PWA/customer/admin behavior.");
if (failures.length) {
  console.error("\nClone-readiness audit failed with " + failures.length + " blocking check(s).");
  process.exit(1);
}
console.log("\nCLONE-READINESS STATIC GATES PASSED WITH " + warnings.length + " documented warning(s).");
