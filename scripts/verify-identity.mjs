import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "scripts/identity.config.json");
const failures = [];
const ignoredDirs = new Set([".git", "node_modules", ".next", "coverage"]);
const ignoredFiles = new Set([
  "AGENTS.md",
  "AGENTS_REPO_LABELED.md",
  "scripts/verify-identity.mjs",
  "scripts/verify-clone-readiness.mjs",
  "scripts/identity.config.json",
  "docs/PWA-FOUNDATION.md",
  "docs/ADMIN-HUB-APP-FACTORY-SOP.md",
  "docs/CLONE-RESET-CHECKLIST.md",
  "CLONING.md"
]);
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".css", ".json", ".webmanifest", ".md", ".yml", ".yaml", ".txt", ".html", ".svg", ".rules", ".example", ".toml", ".xml"]);

function read(relativePath) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) {
    failures.push(relativePath + ": required file missing");
    return "";
  }
  return fs.readFileSync(full, "utf8");
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

let config;
try {
  config = JSON.parse(read("scripts/identity.config.json"));
} catch {
  console.error("IDENTITY VERIFICATION FAILED — scripts/identity.config.json is missing or invalid JSON.");
  process.exit(1);
}

for (const key of ["manifestName", "shortName", "themeColor", "canonicalIcon", "serviceWorkerCachePrefix"]) {
  if (typeof config[key] !== "string" || !config[key].trim()) failures.push("identity.config.json: missing " + key);
}
if (!Array.isArray(config.forbiddenPatterns) || config.forbiddenPatterns.length === 0) {
  failures.push("identity.config.json: add source/foundation identity patterns that must not remain in product files");
}
if (!Array.isArray(config.allowedLegacyStrings)) failures.push("identity.config.json: allowedLegacyStrings must be an array");

let forbiddenPatterns = [];
try {
  forbiddenPatterns = (config.forbiddenPatterns ?? []).map((source) => new RegExp(source, "i"));
} catch (error) {
  failures.push("identity.config.json: invalid forbidden pattern (" + (error instanceof Error ? error.message : "unknown error") + ")");
}

for (const file of walk(root)) {
  const rel = path.relative(root, file).replaceAll(path.sep, "/");
  if (ignoredFiles.has(rel) || !textExtensions.has(path.extname(file).toLowerCase())) continue;
  let content = fs.readFileSync(file, "utf8");
  for (const allowed of config.allowedLegacyStrings ?? []) {
    if (typeof allowed === "string" && allowed) content = content.replaceAll(allowed, "__DOCUMENTED_LEGACY_STRING__");
  }
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) failures.push(rel + ": inherited identity match " + pattern);
  }
}

let publicManifest;
try {
  publicManifest = JSON.parse(read("public/manifest.webmanifest"));
} catch {
  failures.push("public/manifest.webmanifest: invalid JSON");
  publicManifest = {};
}
const appManifest = read("src/app/manifest.ts");
const layout = read("src/app/layout.tsx");
const sw = read("public/sw.js");

if (publicManifest.name !== config.manifestName) failures.push("public/manifest.webmanifest: name does not match identity.config.json");
if (publicManifest.short_name !== config.shortName) failures.push("public/manifest.webmanifest: short_name does not match identity.config.json");
if (publicManifest.theme_color !== config.themeColor) failures.push("public/manifest.webmanifest: theme_color does not match identity.config.json");
if (!publicManifest.icons?.some((icon) => icon.src === config.canonicalIcon)) failures.push("public/manifest.webmanifest: canonical icon missing");
if (!appManifest.includes('name: "' + config.manifestName + '"')) failures.push("src/app/manifest.ts: generated manifest name does not match identity.config.json");
if (!appManifest.includes('short_name: "' + config.shortName + '"')) failures.push("src/app/manifest.ts: generated short_name does not match identity.config.json");
if (!appManifest.includes('theme_color: "' + config.themeColor + '"')) failures.push("src/app/manifest.ts: generated theme_color does not match identity.config.json");
if (!appManifest.includes('src: "' + config.canonicalIcon + '"')) failures.push("src/app/manifest.ts: canonical icon missing");
if (!layout.includes('title:{default:"' + config.manifestName + '"')) failures.push("src/app/layout.tsx: metadata title does not match identity.config.json");
if (!layout.includes('applicationName:"' + config.shortName + '"')) failures.push("src/app/layout.tsx: applicationName does not match identity.config.json");
if (!layout.includes('icons:{icon:"' + config.canonicalIcon + '",apple:"' + config.canonicalIcon + '"}')) failures.push("src/app/layout.tsx: browser/Apple icon references do not match identity.config.json");
if (!layout.includes('manifest:"/manifest.webmanifest"')) failures.push("src/app/layout.tsx: manifest link is missing");
const iconPath = path.join(root, "public", String(config.canonicalIcon ?? "").replace(/^\/+/, ""));
if (!config.canonicalIcon?.startsWith("/") || !fs.existsSync(iconPath)) failures.push("identity.config.json: canonical icon must be an existing public asset path");
for (const icon of publicManifest.icons ?? []) {
  if (typeof icon.src !== "string" || !fs.existsSync(path.join(root, "public", icon.src.replace(/^\/+/, "")))) {
    failures.push("public/manifest.webmanifest: missing icon asset " + String(icon.src));
  }
}
const prefix = String(config.serviceWorkerCachePrefix ?? "").replace(/[.*+?^{}()|[\]\\]/g, "\\$&");
if (!new RegExp('["\\x27]' + prefix + 'shell-v\\d+["\\x27]').test(sw)) failures.push("public/sw.js: versioned shell cache does not use configured namespace");
if (!new RegExp('["\\x27]' + prefix + 'media-v\\d+["\\x27]').test(sw)) failures.push("public/sw.js: media cache does not use configured namespace");
if (!sw.includes(config.canonicalIcon)) failures.push("public/sw.js: canonical notification/app-shell icon is missing");

if (failures.length) {
  console.error("IDENTITY VERIFICATION FAILED — " + failures.length + " issue(s).");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}
console.log("IDENTITY VERIFIED — " + config.manifestName + " metadata, manifests, icons, cache namespace and configured legacy scan agree.");
