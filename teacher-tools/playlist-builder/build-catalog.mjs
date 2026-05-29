#!/usr/bin/env node
/**
 * Neft Teacher · Playlist Builder — catalog builder (READ-ONLY)
 *
 * Scans the repository's student-facing activity directories and compiles
 * teacher-tools/playlist-builder/catalog.json with entries shaped:
 *   { id, title, type, unit?, standard?, href, category }
 *
 * It NEVER modifies any source file. It only reads:
 *   - directory listings
 *   - lessons/<id>/config.json  (title / standard / unit / lesson)
 *   - <title> tags inside activity index.html / *.html files
 *
 * Categories: Lessons, Games, Post-Tests, WIDA/ESOL, Review, Other.
 *
 * Run from anywhere:  node teacher-tools/playlist-builder/build-catalog.mjs
 */

import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// repo root is two levels up from teacher-tools/playlist-builder/
const REPO = join(__dirname, "..", "..");

// ---------- small read-only helpers ----------------------------------------
function safeDirs(rel) {
  const abs = join(REPO, rel);
  if (!existsSync(abs)) return [];
  try {
    return readdirSync(abs, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
      .map((d) => d.name)
      .sort(natCompare);
  } catch {
    return [];
  }
}
function safeFiles(rel, ext) {
  const abs = join(REPO, rel);
  if (!existsSync(abs)) return [];
  try {
    return readdirSync(abs, { withFileTypes: true })
      .filter((d) => d.isFile() && (!ext || d.name.endsWith(ext)))
      .map((d) => d.name)
      .sort(natCompare);
  } catch {
    return [];
  }
}
function hasIndex(rel) {
  return existsSync(join(REPO, rel, "index.html"));
}
function readText(rel) {
  try {
    return readFileSync(join(REPO, rel), "utf8");
  } catch {
    return "";
  }
}
function titleTag(rel) {
  const html = readText(rel);
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!m) return "";
  return decodeEntities(m[1].trim());
}
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&rsquo;/g, "’")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}
/** Strip site-suffix decorations like " | Neft Teacher", " — Math Lab Missions". */
function cleanTitle(t) {
  if (!t) return "";
  return t
    .replace(/\s*[|·]\s*(Neft (Teacher|Hub)|Neft Classroom|Math Lab Missions|Neft).*$/i, "")
    .trim();
}
/** Turn a slug / filename stem into Title Case words. */
function humanize(stem) {
  return stem
    .replace(/\.html?$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\blevel\s*(\d)\b/gi, "(Level $1)")
    .replace(/\bunit(\d+)\b/gi, "Unit $1:")
    .replace(/\bv2\b/gi, "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
function natCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}
function pushUnique(list, seen, entry) {
  if (seen.has(entry.id)) return;
  seen.add(entry.id);
  list.push(entry);
}

// ---------- main scan --------------------------------------------------------
const items = [];
const seen = new Set();

// 1) LESSONS — lessons/<id>/index.html, metadata from config.json -------------
for (const id of safeDirs("lessons")) {
  const rel = `lessons/${id}`;
  if (!hasIndex(rel)) continue;
  let title = "";
  let standard;
  let unit;
  if (existsSync(join(REPO, rel, "config.json"))) {
    try {
      const cfg = JSON.parse(readText(`${rel}/config.json`));
      if (cfg.title) title = String(cfg.title).trim();
      if (cfg.standard) standard = String(cfg.standard).trim();
      if (cfg.unit != null) unit = String(cfg.unit).trim();
    } catch {
      /* ignore malformed config */
    }
  }
  if (!title) title = cleanTitle(titleTag(`${rel}/index.html`));
  const lessonLabel = id.replace(/-flagship$/, "");
  if (!title || title === "Neft Teacher Activity") title = `Lesson ${lessonLabel}`;
  const flagship = id.endsWith("-flagship");
  pushUnique(items, seen, {
    id: `lesson-${id}`,
    title: `${lessonLabel}${flagship ? " ★" : ""} · ${title}`,
    type: flagship ? "Flagship Lesson" : "Lesson",
    unit,
    standard,
    href: `/lessons/${id}/`,
    category: "Lessons",
  });
}

// 2) GAMES — games/3d/unit-N/index.html + top-level games/3d/*.html -----------
for (const id of safeDirs("games/3d")) {
  if (!/^unit-\d+$/.test(id)) continue;
  const rel = `games/3d/${id}`;
  if (!hasIndex(rel)) continue;
  const unitNum = id.replace("unit-", "");
  let title = cleanTitle(titleTag(`${rel}/index.html`));
  if (!title) title = humanize(id);
  pushUnique(items, seen, {
    id: `game-3d-${id}`,
    title: `Unit ${unitNum} · ${title}`,
    type: "3D Game",
    unit: unitNum,
    href: `/games/3d/${id}/`,
    category: "Games",
  });
}
for (const f of safeFiles("games/3d", ".html")) {
  const stem = f.replace(/\.html$/, "");
  const um = stem.match(/unit(\d+)/i);
  let title = cleanTitle(titleTag(`games/3d/${f}`));
  if (!title) title = humanize(stem);
  pushUnique(items, seen, {
    id: `game-3d-file-${stem}`,
    title,
    type: "3D Game",
    unit: um ? um[1] : undefined,
    href: `/games/3d/${f}`,
    category: "Games",
  });
}

// 3) POST-TESTS — post-test/*.html -------------------------------------------
for (const f of safeFiles("post-test", ".html")) {
  if (f === "index.html") continue;
  const stem = f.replace(/\.html$/, "");
  const um = stem.match(/unit(\d+)/i);
  let title = cleanTitle(titleTag(`post-test/${f}`));
  if (!title) title = humanize(stem);
  if (/level-1$/i.test(stem)) title += " (Level 1)";
  else if (/level-2$/i.test(stem)) title += " (Level 2)";
  pushUnique(items, seen, {
    id: `posttest-${stem}`,
    title,
    type: "Post-Test",
    unit: um ? um[1] : undefined,
    href: `/post-test/${f}`,
    category: "Post-Tests",
  });
}

// 4) WIDA / ESOL --------------------------------------------------------------
for (const id of safeDirs("wida-access")) {
  const rel = `wida-access/${id}`;
  if (!hasIndex(rel)) continue;
  let title = cleanTitle(titleTag(`${rel}/index.html`));
  if (!title) title = `WIDA ${humanize(id)}`;
  pushUnique(items, seen, {
    id: `wida-${id}`,
    title,
    type: "WIDA ACCESS",
    href: `/wida-access/${id}/`,
    category: "WIDA/ESOL",
  });
}
for (const id of safeDirs("esol-reading-writing")) {
  const rel = `esol-reading-writing/${id}`;
  if (!hasIndex(rel)) continue;
  let title = cleanTitle(titleTag(`${rel}/index.html`));
  if (!title) title = humanize(id);
  pushUnique(items, seen, {
    id: `esol-${id}`,
    title,
    type: "ESOL Reading/Writing",
    href: `/esol-reading-writing/${id}/`,
    category: "WIDA/ESOL",
  });
}

// 5) REVIEW — spiral-review, math-lab-missions, mcap-review, practice,
//    surface-area-review, unit-5-practice, geometry-prep, *-review tools ------
// Math Lab Missions (mission-N dirs)
for (const id of safeDirs("math-lab-missions")) {
  if (!/^mission-\d+$/.test(id)) continue;
  const rel = `math-lab-missions/${id}`;
  if (!hasIndex(rel)) continue;
  let title = cleanTitle(titleTag(`${rel}/index.html`));
  if (!title) title = humanize(id);
  pushUnique(items, seen, {
    id: `mathlab-${id}`,
    title,
    type: "Math Lab Mission",
    href: `/math-lab-missions/${id}/`,
    category: "Review",
  });
}
// Single-page review tools that live as a dir with index.html at repo root.
const REVIEW_ROOT_DIRS = [
  "spiral-review",
  "mcap-review",
  "surface-area-review",
  "geometry-prep",
  "unit-5-practice",
  "practice",
  "practice-engine",
];
for (const dir of REVIEW_ROOT_DIRS) {
  if (hasIndex(dir)) {
    let title = cleanTitle(titleTag(`${dir}/index.html`));
    if (!title) title = humanize(dir);
    pushUnique(items, seen, {
      id: `review-${dir}`,
      title,
      type: "Review",
      href: `/${dir}/`,
      category: "Review",
    });
  }
  // also any *.html activities directly inside
  for (const f of safeFiles(dir, ".html")) {
    if (f === "index.html") continue;
    const stem = f.replace(/\.html$/, "");
    let title = cleanTitle(titleTag(`${dir}/${f}`));
    if (!title) title = humanize(stem);
    pushUnique(items, seen, {
      id: `review-${dir}-${stem}`,
      title,
      type: "Review",
      href: `/${dir}/${f}`,
      category: "Review",
    });
  }
}

// 6) OTHER — additional standalone student activity dirs at repo root ---------
const OTHER_ROOT_DIRS = [
  "expressions-equations",
  "number-system",
  "ratios-proportions",
  "statistics-data",
  "functions",
  "geometry-prep",
  "correlation-playground",
  "fractions-soccer",
  "misconception-museum",
  "fix-it-design-challenge",
  "math-lab-missions",
];
// (math-lab-missions index itself, expression/topic hubs, etc. — only if index)
for (const dir of OTHER_ROOT_DIRS) {
  if (!hasIndex(dir)) continue;
  // skip ones already represented as their own category root
  if (REVIEW_ROOT_DIRS.includes(dir)) continue;
  let title = cleanTitle(titleTag(`${dir}/index.html`));
  if (!title) title = humanize(dir);
  pushUnique(items, seen, {
    id: `other-${dir}`,
    title,
    type: "Activity",
    href: `/${dir}/`,
    category: "Other",
  });
}

// ---------- write catalog.json ----------------------------------------------
const CATEGORY_ORDER = ["Lessons", "Games", "Post-Tests", "WIDA/ESOL", "Review", "Other"];
items.sort((a, b) => {
  const ca = CATEGORY_ORDER.indexOf(a.category);
  const cb = CATEGORY_ORDER.indexOf(b.category);
  if (ca !== cb) return ca - cb;
  return natCompare(a.title, b.title);
});

const counts = {};
for (const it of items) counts[it.category] = (counts[it.category] || 0) + 1;

const catalog = {
  generatedAt: new Date().toISOString(),
  brand: "Neft Teacher",
  categories: CATEGORY_ORDER,
  counts,
  total: items.length,
  items,
};

const outPath = join(__dirname, "catalog.json");
writeFileSync(outPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");

console.log(`Wrote ${outPath}`);
console.log(`Total activities: ${items.length}`);
for (const c of CATEGORY_ORDER) {
  if (counts[c]) console.log(`  ${c}: ${counts[c]}`);
}
