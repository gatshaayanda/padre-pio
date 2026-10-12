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
check("PWA foundation notes exist", exists("docs/PWA-FOUNDATION.md"));
check("Identity verification script exists", exists("scripts/verify-identity.mjs"));
check("Firestore rules file exists", exists("firestore.rules"));
check("Storage rules file exists", exists("storage.rules"));
check("Firebase configuration exists", exists("firebase.json"));
check("Firestore indexes file exists", exists("firestore.indexes.json"));

const packageJson = JSON.parse(read("package.json"));
const scripts = packageJson.scripts ?? {};
check("Identity verification is a package script", typeof scripts["verify:identity"] === "string");
check("Clone-readiness verification is a package script", typeof scripts["verify:clone-readiness"] === "string");
check("Production build invokes identity verification", /verify:identity/.test(scripts.build ?? ""));
check("Lint script exists", typeof scripts.lint === "string");

const manifest = JSON.parse(read("public/manifest.webmanifest"));
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
check("Notification endpoints expose attempted/successful/failed push counts", ["src/app/api/notifications/message-created/route.ts", "src/app/api/notifications/sourcing-request/route.ts"].every((file) => /attemptedCount/.test(read(file)) && /failedCount/.test(read(file)) && /status/.test(read(file))));
check("Notification endpoints return a failure status when no push is delivered", ["src/app/api/notifications/message-created/route.ts", "src/app/api/notifications/sourcing-request/route.ts"].every((file) => /status:sent===0\?503:200/.test(read(file))));
check("UploadThing request attachments require a verified Firebase ID token", exists("src/app/api/uploadthing/core.ts") && /verifyIdToken/.test(read("src/app/api/uploadthing/core.ts")) && /\.middleware\(/.test(read("src/app/api/uploadthing/core.ts")) && /headers:\{Authorization:/.test(read("src/app/request/request-form.tsx")));
check("Reminder cron secret comparison is timing-safe", exists("src/app/api/notifications/reminders/route.ts") && /timingSafeEqual/.test(read("src/app/api/notifications/reminders/route.ts")) && /matchesSecret/.test(read("src/app/api/notifications/reminders/route.ts")));
check("Operations login has persistent attempt throttling", exists("src/app/api/operations-login/route.ts") && /LOGIN_MAX_ATTEMPTS\s*=\s*5/.test(read("src/app/api/operations-login/route.ts")) && /operationsLoginRateLimits/.test(read("src/app/api/operations-login/route.ts")) && /status:429/.test(read("src/app/api/operations-login/route.ts")));
check("Storefront source exists", exists("src/components/StorefrontFeed.tsx"));

const firebaseConfig = JSON.parse(read("firebase.json"));
check("Firebase config points to Firestore rules", firebaseConfig.firestore?.rules === "firestore.rules");
check("Firebase config points to Storage rules", firebaseConfig.storage?.rules === "storage.rules");
const firestoreRules = read("firestore.rules");
check("Firestore rules contain final deny-all fallback", /match\s+\/\{document=\*\*\}\s*\{[\s\S]*?allow\s+read,\s*write\s*:\s*if\s+false\s*;?/.test(firestoreRules));
const storageRules = read("storage.rules");
check("Storage rules contain deny-all fallback", /match\s+\/\{allPaths=\*\*\}\s*\{\s*allow\s+read,\s*write\s*:\s*if\s+false\s*;?\s*\}/.test(storageRules));

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
