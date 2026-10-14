import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const config = JSON.parse(fs.readFileSync(path.join(root, "scripts/identity.config.json"), "utf8"));
const failures = [];
const ignoredDirs = new Set([".git", "node_modules", ".next", "coverage"]);
const ignoredFiles = new Set(["AGENTS.md", "AGENTS_REPO_LABELED.md", "CLONING.md", "scripts/verify-identity.mjs", "scripts/verify-clone-readiness.mjs", "scripts/identity.config.json"]);
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".css", ".json", ".webmanifest", ".md", ".yml", ".yaml", ".txt", ".html", ".svg", ".rules", ".example", ".toml", ".xml"]);

function walk(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (path.relative(root, full).split(path.sep)[0] === "docs") continue;
      result.push(...walk(full));
    } else result.push(full);
  }
  return result;
}
function failIf(condition, message) { if (condition) failures.push(message); }
function read(relative) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) { failures.push(relative + ": required file missing"); return ""; }
  return fs.readFileSync(file, "utf8");
}

const packageJson = JSON.parse(read("package.json"));
const manifest = JSON.parse(read("public/manifest.webmanifest"));
const appManifest = read("src/app/manifest.ts");
const layout = read("src/app/layout.tsx");
const sw = read("public/sw.js");
failIf(packageJson.name !== "padre-pio-digital-reception", "package.json: project name is incorrect");
failIf(manifest.name !== config.manifestName, "public manifest name does not match identity config");
failIf(manifest.short_name !== config.shortName, "public manifest short name does not match identity config");
failIf(manifest.theme_color !== config.themeColor, "public manifest theme color does not match identity config");
failIf(!manifest.icons?.some(icon => icon.src === config.canonicalIcon), "public manifest canonical icon is missing");
failIf(!manifest.icons?.some(icon => icon.src === "/padre-pio-icon-192.png" && icon.sizes === "192x192"), "192px PNG icon is missing from the manifest");
failIf(!manifest.icons?.some(icon => icon.src === "/padre-pio-icon-512.png" && icon.sizes === "512x512"), "512px PNG icon is missing from the manifest");
failIf(!appManifest.includes('name: "' + config.manifestName + '"'), "generated manifest name is incorrect");
failIf(!appManifest.includes('short_name: "' + config.shortName + '"'), "generated manifest short name is incorrect");
failIf(!appManifest.includes('theme_color: "' + config.themeColor + '"'), "generated manifest theme color is incorrect");
failIf(!layout.includes("Padre Pio Medical Centre"), "root metadata is missing the app identity");
failIf(!sw.includes(config.serviceWorkerCachePrefix), "service worker cache namespace is incorrect");
failIf(fs.existsSync(path.join(root, ".github/workflows/pickup-reminders.yml")), "inherited scheduled reminder workflow still exists");
failIf(fs.existsSync(path.join(root, ".github/workflows/firebase-rules-deploy.yml")), "inherited automatic Firebase deployment workflow still exists");

for (const iconPath of ["/padre-pio-icon.svg", "/padre-pio-icon-192.png", "/padre-pio-icon-512.png"]) {
  const file = path.join(root, "public", iconPath.slice(1));
  failIf(!fs.existsSync(file), "manifest icon asset is missing: " + iconPath);
  if (fs.existsSync(file) && iconPath.endsWith(".png")) {
    const bytes = fs.readFileSync(file);
    failIf(bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a", iconPath + " is not a valid PNG");
    if (bytes.length >= 24) {
      const expected = iconPath.includes("192") ? 192 : 512;
      failIf(bytes.readUInt32BE(16) !== expected || bytes.readUInt32BE(20) !== expected, iconPath + " has incorrect dimensions");
    }
  }
}

const patterns = (config.forbiddenPatterns || []).map(source => {
  try { return new RegExp(source, "i"); }
  catch { failures.push("Invalid forbidden identity pattern: " + source); return null; }
}).filter(Boolean);
for (const file of walk(root)) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  if (ignoredFiles.has(relative) || !textExtensions.has(path.extname(file).toLowerCase())) continue;
  let content = fs.readFileSync(file, "utf8");
  for (const allowed of config.allowedLegacyStrings || []) if (typeof allowed === "string" && allowed) content = content.replaceAll(allowed, "");
  for (const pattern of patterns) if (pattern.test(content)) failures.push(relative + ": inherited identity found (" + pattern + ")");
}

if (failures.length) {
  console.error("IDENTITY VERIFICATION FAILED");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}
console.log("IDENTITY VERIFICATION PASSED — metadata, manifests, icons, cache namespace, and source identity are aligned.");
