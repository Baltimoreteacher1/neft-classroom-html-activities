// Generate a canonical activity registry by reading real on-disk sources only.
// No fabricated metadata: structured fields come from lessons/<id>/config.json;
// every other activity contributes its real page <title> and derived URL.
// Output: data/registry.json  (run: npm run generate-registry)
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  statSync,
  mkdirSync,
} from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".claude",
  ".serena",
  "dist",
  "scripts",
  "assets",
  "engine",
  "data",
  "docs",
]);

// Build/VCS dirs that must be skipped at ANY depth, not just the repo root —
// e.g. a standalone Vite sub-app's gitignored `neft-math-lab-studio/dist/`
// should never be indexed (it isn't committed, so it 404s in production).
const SKIP_DIRS_ANY_DEPTH = new Set(["node_modules", "dist"]);

// Coarse activity type inferred from the top-level directory. Conservative:
// anything we can't classify is left as "Activity".
function typeFor(topDir, urlPath) {
  if (topDir === "lessons") return "Lesson";
  if (topDir === "games") return "Game";
  if (topDir.startsWith("mcap")) return "Assessment";
  if (topDir === "spiral-review" || topDir.includes("review")) return "Review";
  if (topDir === "teacher-tools" || topDir === "dashboard") return "Tool";
  if (topDir === "summer-bridge" || topDir === "bridge-to-grade-6")
    return "Bridge";
  if (topDir === "end-of-year") return "Hub";
  if (
    /project|world-architect|statistics-of-my-life|webquests|hyperdocs/.test(
      topDir + urlPath,
    )
  )
    return "Project";
  return "Activity";
}

// Pull the <title> from an HTML file (first <title>...</title>).
function readTitle(file) {
  try {
    const html = readFileSync(file, "utf8");
    const m = html.match(/<title>([\s\S]*?)<\/title>/i);
    if (!m) return null;
    return m[1].replace(/\s+/g, " ").trim();
  } catch {
    return null;
  }
}

// Pull a Common Core-style standard code out of a title, e.g. "6.RP.A.1".
function standardFrom(title) {
  const m = title && title.match(/\b6\.[A-Z]{1,3}(?:\.[A-Z0-9]+)*\b/);
  return m ? m[0] : null;
}

// URL for an index.html (folder URL) or a standalone .html file.
function urlFor(file) {
  const rel = "/" + relative(ROOT, file).replace(/\\/g, "/");
  return rel.replace(/\/index\.html$/, "/");
}

const entries = [];

// 1) Lessons: structured metadata from config.json (source of truth).
const lessonsDir = join(ROOT, "lessons");
if (existsSync(lessonsDir)) {
  for (const id of readdirSync(lessonsDir)) {
    const cfgPath = join(lessonsDir, id, "config.json");
    if (!existsSync(cfgPath)) continue;
    try {
      const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
      entries.push({
        title: cfg.title || `Lesson ${cfg.lesson || id}`,
        url: `/lessons/${id}/`,
        activityType: "Lesson",
        unit: cfg.unit ?? null,
        lesson: cfg.lesson ?? null,
        standard: cfg.standard ?? null,
        source: "config",
      });
    } catch {
      /* skip malformed config */
    }
  }
}

// 2) Everything else: walk for index.html + top-level standalone .html, read
//    the real <title>. (Lessons already covered above.)
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const full = join(dir, name);
    const st = statSync(full);
    const rel = relative(ROOT, full).replace(/\\/g, "/");
    const top = rel.split("/")[0];
    if (st.isDirectory()) {
      if (SKIP_DIRS_ANY_DEPTH.has(name)) continue;
      if (SKIP_DIRS.has(name) && dir === ROOT) continue;
      if (top === "lessons") continue; // handled via config.json
      walk(full);
    } else if (name === "index.html" || (dir !== ROOT && name.endsWith(".html"))) {
      if (name !== "index.html") continue; // only index.html inside subdirs
      const title = readTitle(full);
      if (!title) continue;
      const url = urlFor(full);
      entries.push({
        title,
        url,
        activityType: typeFor(top, url),
        standard: standardFrom(title),
        source: "title",
      });
    }
  }
}
walk(ROOT);

// Also catch top-level standalone game .html files (2D Phaser editions).
for (const name of readdirSync(join(ROOT, "games"))) {
  if (name.endsWith(".html")) {
    const full = join(ROOT, "games", name);
    const title = readTitle(full);
    if (title)
      entries.push({
        title,
        url: `/games/${name}`,
        activityType: "Game",
        standard: standardFrom(title),
        source: "title",
      });
  }
}

// De-dupe by URL, sort by type then title for a stable, reviewable file.
const byUrl = new Map();
for (const e of entries) if (!byUrl.has(e.url)) byUrl.set(e.url, e);
const list = [...byUrl.values()].sort(
  (a, b) =>
    a.activityType.localeCompare(b.activityType) ||
    a.title.localeCompare(b.title),
);

const counts = {};
for (const e of list) counts[e.activityType] = (counts[e.activityType] || 0) + 1;

const out = {
  generated: "run `npm run generate-registry` to refresh",
  note: "Auto-derived from lessons/*/config.json and on-disk page <title> tags. Optional fields (level, status, exports, tags) are intentionally omitted rather than guessed.",
  total: list.length,
  counts,
  activities: list,
};

const dataDir = join(ROOT, "data");
if (!existsSync(dataDir)) mkdirSync(dataDir);
writeFileSync(join(dataDir, "registry.json"), JSON.stringify(out, null, 2));
console.log(`registry: ${list.length} activities`, counts);
