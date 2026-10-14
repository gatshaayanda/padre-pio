import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const checks = [];
function check(label, condition, detail = "") {
  checks.push({ label, passed: Boolean(condition), detail });
  if (!condition) failures.push(label + (detail ? " — " + detail : ""));
}
function exists(relative) { return fs.existsSync(path.join(root, relative)); }
function read(relative) { return fs.readFileSync(path.join(root, relative), "utf8"); }

for (const file of ["AGENTS.md", "AGENTS_REPO_LABELED.md", "CLONING.md", "docs/ADMIN-HUB-APP-FACTORY-SOP.md", "docs/CLONE-RESET-CHECKLIST.md", "docs/PWA-FOUNDATION.md", "scripts/identity.config.json", "scripts/verify-identity.mjs", "scripts/verify-clone-readiness.mjs"]) {
  check("Project instructions exist: " + file, exists(file));
}
for (const file of ["src/app/page.tsx", "src/app/layout.tsx", "src/app/manifest.ts", "src/app/pwa-register.tsx", "src/app/admin/page.tsx", "src/app/api/appointments/route.ts", "src/lib/server/firebase-admin.ts", "public/sw.js", "public/manifest.webmanifest", "public/padre-pio-icon.svg", "public/padre-pio-icon-192.png", "public/padre-pio-icon-512.png", "public/videos/padre.mp4", "public/videos/padre-poster.webp", "firestore.rules", "storage.rules", "firestore.indexes.json"]) {
  check("Required target file exists: " + file, exists(file));
}
const pkg = JSON.parse(read("package.json"));
const scripts = pkg.scripts || {};
check("Identity verifier is wired to build", /verify:identity/.test(scripts.build || ""));
check("Target readiness script is wired", typeof scripts["verify:clone-readiness"] === "string");
check("Lint script exists", typeof scripts.lint === "string");
check("Project name is target-specific", pkg.name === "padre-pio-digital-reception");
const publicManifest = JSON.parse(read("public/manifest.webmanifest"));
const appManifest = read("src/app/manifest.ts");
const identity = JSON.parse(read("scripts/identity.config.json"));
check("Public manifest matches identity contract", publicManifest.name === identity.manifestName && publicManifest.short_name === identity.shortName && publicManifest.theme_color === identity.themeColor);
check("Generated manifest matches public manifest", appManifest.includes('name: "' + publicManifest.name + '"') && appManifest.includes('short_name: "' + publicManifest.short_name + '"') && appManifest.includes('theme_color: "' + publicManifest.theme_color + '"'));
check("Service worker uses a unique app cache namespace", read("public/sw.js").includes('"' + identity.serviceWorkerCachePrefix + 'shell-v1"'));
check("Appointment endpoint does not expose a client-side write path", /requireClinicAdmin/.test(read("src/app/api/appointments/route.ts")) && /verifyIdToken/.test(read("src/lib/server/firebase-admin.ts")));
check("Firestore client rules are default-deny", /allow read, write: if false/.test(read("firestore.rules")));
check("Storage client rules are default-deny", /allow read, write: if false/.test(read("storage.rules")));
check("Inherited scheduled workflow is absent", !exists(".github/workflows/pickup-reminders.yml"));
check("Inherited auto-deploy workflow is absent", !exists(".github/workflows/firebase-rules-deploy.yml"));
check("No inherited retail routes remain", !exists("src/app/order") && !exists("src/app/products") && !exists("src/app/saved") && !exists("src/components/StorefrontFeed.tsx"));
check("Video is present and has non-trivial size", exists("public/videos/padre.mp4") && fs.statSync(path.join(root, "public/videos/padre.mp4")).size > 1000000);
check("Node major matches CI", read(".nvmrc").trim().split(".")[0] === (read(".github/workflows/quality.yml").match(/node-version:\s*(\d+)/)?.[1] || ""));
if (failures.length) {
  console.error("PADRE PIO READINESS FAILED");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}
console.log("PADRE PIO STATIC READINESS PASSED (" + checks.length + " checks). This does not prove live Firebase or device behavior.");
