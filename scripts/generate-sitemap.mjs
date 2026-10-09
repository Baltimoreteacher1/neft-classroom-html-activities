// Regenerates sitemap.xml for the canonical site (https://eduwonderlab.com).
//
// Sources:
//   - lessons and their public companion pages: data/curriculum-launch-manifest.json
//     (the curriculum's own list — data/catalog.json lagged it and dropped 26 lessons);
//   - public Curriculum surfaces: every /curriculum/** index page in the build;
//   - everything else (hubs, unit hubs, tools, practice, games): data/catalog.json.
// Every candidate then has to pass the rules in scripts/lib/sitemap.mjs (exists
// in dist/, canonical extensionless form, not teacher-gated, not redirected, not
// noindex). <lastmod> is the latest git commit date of the page's source file
// (and, for a lesson, its config.json), falling back to the file's mtime.
//
// Requires a build (dist/). Run:
//   npm run build && npm run generate-sitemap
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalPath,
  exclusionReason,
  fileForPath,
  redirectMatcher,
  SITE_ORIGIN,
  sitemapProblems,
} from "./lib/sitemap.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "dist");
if (!existsSync(join(outDir, "index.html"))) {
  console.error("generate-sitemap: dist/ is missing — run `npm run build` first.");
  process.exit(1);
}

const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), "utf8"));
const launch = readJson("data/curriculum-launch-manifest.json");
const catalog = readJson("data/catalog.json");
const catalogEntries = Array.isArray(catalog) ? catalog : catalog.entries || [];
const ctx = {
  outDir,
  isRedirected: redirectMatcher(readFileSync(join(root, "_redirects"), "utf8")),
};

/** @type {{ path: string, sources: string[] }[][]} */
const sections = [];
const emitted = new Set();
const skipped = new Map();

function section(label) {
  const list = [];
  list.label = label;
  sections.push(list);
  return list;
}

/** Queue a path for `list` if it passes every rule. `extra` = more source files for lastmod. */
function add(list, rawPath, extra = []) {
  if (!rawPath) return;
  const path = canonicalPath(rawPath);
  if (emitted.has(path)) return;
  const why = exclusionReason(path, ctx);
  if (why) {
    skipped.set(why, (skipped.get(why) || 0) + 1);
    return;
  }
  emitted.add(path);
  list.push({ path, sources: [fileForPath(outDir, path), ...extra] });
}

const lessonKey = (id) => {
  const [u, l] = String(id).split("-").map(Number);
  return u * 1000 + l;
};
const byUnitThenLesson = (a, b) => a.unit - b.unit || lessonKey(a.id) - lessonKey(b.id);

/* 1. Home & hubs */
const hubs = section("Home & hubs");
["/", "/math/", "/directory/"].forEach((p) => add(hubs, p));
catalogEntries
  .filter((e) => e.category === "Hub")
  .map((e) => e.path)
  .sort()
  .forEach((p) => add(hubs, p));

/* 2. Per unit: unit hub, lessons (+ readiness, homework, family, student help),
      Part 2, catch-ups, end-of-unit project, unit assessments, unit resources. */
const units = [...new Set(launch.lessons.map((l) => l.unit))].sort((a, b) => a - b);
for (const u of units) {
  const list = section(`Unit ${u}`);
  catalogEntries
    .filter((e) => e.category === "Unit Hub" && e.unit === u)
    .forEach((e) => add(list, e.path));
  for (const l of launch.lessons.filter((x) => x.unit === u).sort(byUnitThenLesson)) {
    const r = l.resources || {};
    const config = `lessons/${l.id}/config.json`;
    add(list, r.lesson, [config]);
    for (const key of ["readiness", "homework", "familyPage", "studentHelp"])
      add(list, r[key], [config]);
  }
  for (const key of ["partTwo", "catchUps"]) {
    for (const l of launch[key].filter((x) => x.unit === u).sort(byUnitThenLesson)) {
      add(list, l.resources?.lesson, [`lessons/${l.id}/config.json`]);
    }
  }
  for (const key of ["endOfUnit", "unitAssessments", "unitResources"]) {
    for (const l of launch[key].filter((x) => x.unit === u)) add(list, l.resources?.lesson);
  }
}

/* 3. Curriculum surfaces (student-facing pages under /curriculum/). */
const curriculum = section("Curriculum");
(function walk(dir, depth) {
  const abs = join(outDir, dir);
  if (existsSync(join(abs, "index.html"))) add(curriculum, `/${dir}/`);
  if (depth >= 3) return;
  for (const d of readdirSync(abs, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (d.isDirectory()) walk(`${dir}/${d.name}`, depth + 1);
  }
})("curriculum", 1);

/* 4. Everything else the catalog lists, grouped by category. Lesson-shaped
      categories come from the launch manifest above, not from here. */
const FROM_MANIFEST = new Set([
  "Lesson",
  "Apply · Part 2",
  "Small Group",
  "Catch-Up",
  "Readiness",
  "Homework",
  "Hub",
  "Unit Hub",
]);
const byCategory = new Map();
for (const e of catalogEntries) {
  if (!e.path || FROM_MANIFEST.has(e.category)) continue;
  if (!byCategory.has(e.category)) byCategory.set(e.category, []);
  byCategory.get(e.category).push(e.path);
}
for (const cat of [...byCategory.keys()].sort()) {
  const list = section(cat);
  byCategory
    .get(cat)
    .sort()
    .forEach((p) => add(list, p));
}

/* lastmod: newest commit touching any source file, in one git pass. */
const sourceFiles = new Set(
  sections.flat().flatMap((u) => u.sources.filter((s) => s && existsSync(join(root, s)))),
);
const commitDate = new Map();
try {
  const log = execFileSync(
    "git",
    ["log", "--pretty=format:@%cs", "--name-only", "--", ...sourceFiles],
    { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  );
  let date = "";
  for (const line of log.split("\n")) {
    if (line.startsWith("@")) date = line.slice(1);
    else if (line && !commitDate.has(line)) commitDate.set(line, date);
  }
} catch {
  // No git (e.g. a source tarball): every date falls back to mtime below.
}
function lastmod(sources) {
  let best = "";
  for (const s of sources) {
    if (!s) continue;
    const d =
      commitDate.get(s) ||
      (existsSync(join(root, s)) ? statSync(join(root, s)).mtime.toISOString().slice(0, 10) : "") ||
      statSync(join(outDir, s)).mtime.toISOString().slice(0, 10);
    if (d > best) best = d;
  }
  return best;
}

const lines = [];
for (const list of sections) {
  if (!list.length) continue;
  lines.push(`  <!-- ${list.label} -->`);
  for (const { path, sources } of list) {
    lines.push(
      `  <url><loc>${SITE_ORIGIN}${path}</loc><lastmod>${lastmod(sources)}</lastmod></url>`,
    );
  }
}
const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  lines.join("\n") +
  `\n</urlset>\n`;

const problems = sitemapProblems(xml, ctx);
if (problems.length) {
  console.error(`generate-sitemap: refusing to write — ${problems.length} problem(s):`);
  for (const p of problems.slice(0, 20)) console.error(`  ${p}`);
  process.exit(1);
}
writeFileSync(join(root, "sitemap.xml"), xml);
console.log(`Wrote sitemap.xml with ${emitted.size} URLs.`);
for (const [why, n] of [...skipped].sort()) console.log(`  skipped ${n}: ${why}`);
