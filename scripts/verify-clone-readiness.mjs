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
function pngDimensions(relativePath) {
  try {
    const bytes = fs.readFileSync(path.join(root, relativePath));
    if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return null;
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  } catch {
    return null;
  }
}

for (const file of [
  "AGENTS.md", "AGENTS_REPO_LABELED.md", "CLONING.md",
  "docs/ADMIN-HUB-APP-FACTORY-SOP.md", "docs/CLONE-RESET-CHECKLIST.md",
  "docs/PWA-FOUNDATION.md", "docs/PADRE-PIO-EVIDENCE-LEDGER.md",
  "scripts/identity.config.json", "scripts/verify-identity.mjs",
  "scripts/verify-clone-readiness.mjs", "package.json", "package-lock.json",
  "src/app/page.tsx", "src/app/layout.tsx", "src/app/manifest.ts",
  "src/app/appointments/request/page.tsx", "src/app/admin/page.tsx",
  "src/app/offline/page.tsx", "src/lib/firebase/client.ts",
  "public/manifest.webmanifest", "public/padre-pio-mark.svg",
  "public/padre-pio-icon-192.png", "public/padre-pio-icon-512.png",
  "public/sw.js", "public/videos/padre.mp4", "firestore.rules",
  "firestore.indexes.json", "storage.rules", "firebase.json",
  ".env.example", ".nvmrc", ".github/workflows/quality.yml"
]) check("Required target file exists: " + file, exists(file));

const packageJson = JSON.parse(read("package.json"));
const lockJson = JSON.parse(read("package-lock.json"));
const scripts = packageJson.scripts ?? {};
const config = JSON.parse(read("scripts/identity.config.json"));
const manifest = JSON.parse(read("public/manifest.webmanifest"));
const generatedManifest = read("src/app/manifest.ts");
const layout = read("src/app/layout.tsx");
const sw = read("public/sw.js");
const rules = read("firestore.rules");
const storageRules = read("storage.rules");
const quality = read(".github/workflows/quality.yml");
const envExample = read(".env.example");

check("Package and lockfile names match", packageJson.name === lockJson.name && packageJson.name === lockJson.packages?.[""]?.name);
check("Lockfile root dependencies match package.json", JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(lockJson.packages?.[""]?.dependencies ?? {}), "Run npm install to reconcile if this fails.");
check("Identity and readiness scripts are configured", typeof scripts["verify:identity"] === "string" && typeof scripts["verify:clone-readiness"] === "string");
check("Production build runs identity verification", /verify:identity/.test(scripts.build ?? ""));
check("Local Node major matches CI", read(".nvmrc").trim().replace(/^v/, "").split(".")[0] === (quality.match(/node-version:\s*['"]?(\d+)/)?.[1] ?? ""));
check("CI invokes both static gates", /run: npm run verify:identity/.test(quality) && /run: npm run verify:clone-readiness/.test(quality));

check("Public manifest identity matches config", manifest.name === config.manifestName && manifest.short_name === config.shortName && manifest.theme_color === config.themeColor);
check("Generated manifest matches public identity", generatedManifest.includes('name: "' + manifest.name + '"') && generatedManifest.includes('short_name: "' + manifest.short_name + '"') && generatedManifest.includes('theme_color: "' + manifest.theme_color + '"'));
check("Metadata identity matches config", layout.includes('default: "' + config.manifestName + '"') && layout.includes('applicationName: "' + config.shortName + '"'));
check("Metadata icon and manifest references match", layout.includes('icon: "' + config.canonicalIcon + '"') && layout.includes('apple: "/padre-pio-icon-192.png"') && layout.includes('manifest: "/manifest.webmanifest"'));
check("Canonical icon exists in public assets and both manifests", exists(path.join("public", config.canonicalIcon.replace(/^\/+/, ""))) && manifest.icons?.some(icon => icon.src === config.canonicalIcon) && generatedManifest.includes('src: "' + config.canonicalIcon + '"'));

const icon192 = pngDimensions("public/padre-pio-icon-192.png");
const icon512 = pngDimensions("public/padre-pio-icon-512.png");
check("192 icon is a valid 192x192 PNG", icon192?.width === 192 && icon192?.height === 192, JSON.stringify(icon192));
check("512 icon is a valid 512x512 PNG", icon512?.width === 512 && icon512?.height === 512, JSON.stringify(icon512));
check("Both manifests declare PNG install icons", manifest.icons?.some(icon => icon.src === "/padre-pio-icon-192.png" && icon.sizes === "192x192" && icon.type === "image/png") && manifest.icons?.some(icon => icon.src === "/padre-pio-icon-512.png" && icon.sizes === "512x512" && icon.type === "image/png") && generatedManifest.includes('src: "/padre-pio-icon-192.png"') && generatedManifest.includes('src: "/padre-pio-icon-512.png"'));

check("Service worker has isolated versioned shell cache", new RegExp(config.serviceWorkerCachePrefix + "shell-v\\d+").test(sw));
check("Service worker has isolated media cache namespace", new RegExp(config.serviceWorkerCachePrefix + "media-v\\d+").test(sw));
check("Service worker includes the canonical app mark", sw.includes(config.canonicalIcon));
check("Service worker does not precache the large entrance video", !sw.includes("videos/padre.mp4"));
check("Service worker keeps appointment/admin routes network-only", /admin\|appointments/.test(sw) && /fetch\(request\)\.catch/.test(sw));

check("Firestore rules include private appointment records", /match \/appointments\//.test(rules));
check("Firestore rules enforce an admin role for queue access", /function isAdmin\(\)/.test(rules) && /allow read: if isAdmin\(\)/.test(rules));
check("Firestore rules retain default-deny catch-all", /match \/\{document=\*\*\}/.test(rules) && /allow read, write: if false/.test(rules));
check("Storage remains default deny", /allow read, write: if false/.test(storageRules));
check("Firebase rules are not automatically deployed by an inherited workflow", !exists(".github/workflows/firebase-rules-deploy.yml"));
check("Inherited scheduled retail workflow is absent", !exists(".github/workflows/pickup-reminders.yml"));

check("Legacy retail routes and APIs are removed", !exists("src/app/account/page.tsx") && !exists("src/app/request/page.tsx") && !exists("src/app/saved/page.tsx") && !exists("src/app/api/sourcing-request/route.ts"));
check("Legacy retail dashboard and integrations are removed", !exists("src/components/PlugAdminDashboard.tsx") && !exists("src/lib/uploadthing.ts") && !exists("src/lib/firebase/plug-data.ts"));
check("No inherited source icon assets remain", !exists("public/plug-icon.svg") && !exists("public/plug-icon-192.png") && !exists("public/plug-icon-512.png"));
check("Entrance video is present and is not an empty placeholder", exists("public/videos/padre.mp4") && fs.statSync(path.join(root, "public/videos/padre.mp4")).size > 1000000);
check("No Firebase project IDs or secrets are prefilled in .env.example", !/^NEXT_PUBLIC_FIREBASE_(?:API_KEY|AUTH_DOMAIN|PROJECT_ID|STORAGE_BUCKET|MESSAGING_SENDER_ID|APP_ID)=.+$/m.test(envExample) && !/^FIREBASE_ADMIN_KEY=.+$/m.test(envExample));

if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) warn("Dedicated Firebase configuration is not present in this static environment", "This is expected before a clinic-owned project is configured; runtime requests must remain disabled.");
if (!process.env.NEXT_PUBLIC_BASE_URL) warn("Canonical production domain is not configured", "Do not invent a domain or publish canonical metadata until it is confirmed.");
if (failures.length) {
  console.error("PADRE PIO READINESS FAILED — " + failures.length + " issue(s).");
  for (const failure of failures) console.error(" - " + failure);
} else {
  console.log("PADRE PIO STATIC READINESS PASSED — " + checks.length + " checks.");
}
for (const warning of warnings) console.warn("WARN — " + warning.label + ": " + warning.detail);
console.log(checks.map(item => (item.passed ? "PASS" : "FAIL") + " — " + item.label + (item.detail ? " (" + item.detail + ")" : "")).join("\n"));
if (failures.length) process.exit(1);
