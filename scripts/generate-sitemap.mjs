// Regenerates sitemap.xml from the navigable catalog (data/catalog.json),
// grouped/ordered logically with XML comments labeling each section:
//   home + hubs, then per-unit blocks (lesson, readiness, projects, unit hub),
//   then global tools / practice / games.
// Run after generate-catalog.mjs:
//   node scripts/generate-sitemap.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://neft-classroom-html-activities.pages.dev";

const cat = JSON.parse(readFileSync(join(root, "data", "catalog.json"), "utf8"));
const entries = Array.isArray(cat) ? cat : cat.entries || [];

// Track which paths have been emitted so nothing is duplicated.
const emitted = new Set();
const lines = [];

function comment(text) {
  lines.push(`  <!-- ${text} -->`);
}
function url(p) {
  if (!p || emitted.has(p)) return;
  emitted.add(p);
  lines.push(
    `  <url><loc>${BASE}${p}</loc><changefreq>monthly</changefreq></url>`,
  );
}
function byCat(cats, filter) {
  return entries
    .filter(
      (e) => e.path && cats.includes(e.category) && (!filter || filter(e)),
    )
    .map((e) => e.path);
}

// Natural-numeric sort for lesson ids like 3-12.
function lessonKey(p) {
  const m = p.match(/\/lessons\/(\d+)-(\d+)/);
  return m ? Number(m[1]) * 1000 + Number(m[2]) : 1e9;
}

/* ---------------------------------------------------- 1. Home + hubs */
comment("Home & hubs");
["/", "/math/", "/directory/"].forEach(url);
byCat(["Hub"])
  .sort()
  .forEach(url);

/* ------------------------------------------------- 2. Per-unit blocks */
for (let u = 1; u <= 10; u++) {
  const lessons = byCat(["Lesson"], (e) => e.unit === u).sort(
    (a, b) => lessonKey(a) - lessonKey(b),
  );
  const readiness = byCat(["Readiness"], (e) => e.unit === u).sort(
    (a, b) => lessonKey(a) - lessonKey(b),
  );
  const projects = byCat(["Project"], (e) => e.unit === u).sort();
  const hub = byCat(["Unit Hub"], (e) => e.unit === u).sort();
  if (!lessons.length && !readiness.length && !projects.length && !hub.length)
    continue;
  comment(`Unit ${u} — lessons, readiness, projects, hub`);
  hub.forEach(url);
  lessons.forEach(url);
  readiness.forEach(url);
  projects.forEach(url);
}

/* --------------------------------------------- 3. Student math tools */
comment("Student math tools");
byCat(["Math Tool", "Tool"], (e) => e.audience === "student")
  .sort()
  .forEach(url);

/* ----------------------------------------------------- 4. Teacher tools */
comment("Teacher tools");
byCat(["Tool"], (e) => e.audience === "teacher")
  .sort()
  .forEach(url);

/* ------------------------------------------------- 5. Practice & games */
comment("Practice & games");
byCat(["Practice", "Game"])
  .sort()
  .forEach(url);

/* --------------------------------------------------- 6. Family / personal */
comment("Family / personal");
["/personal/"].forEach(url);
byCat(["Tool"], (e) => e.audience === "family")
  .sort()
  .forEach(url);

/* --------------------------------------------- catch any uncategorized */
const leftover = entries
  .map((e) => e.path)
  .filter((p) => p && !emitted.has(p))
  .sort();
if (leftover.length) {
  comment("Other");
  leftover.forEach(url);
}

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  lines.join("\n") +
  `\n</urlset>\n`;

writeFileSync(join(root, "sitemap.xml"), xml);
console.log(`Wrote sitemap.xml with ${emitted.size} URLs.`);
