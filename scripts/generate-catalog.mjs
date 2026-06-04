#!/usr/bin/env node
/**
 * generate-catalog.mjs
 *
 * Scans the repo and writes data/catalog.json — a canonical, curated catalog of
 * the NAVIGABLE pages/tools on the deployed static site (not every asset).
 *
 * NON-DESTRUCTIVE: this script only READS the repo and WRITES data/catalog.json.
 * It never moves, renames, or deletes anything.
 *
 * Sources:
 *   1. Lessons      — lessons/<id>/config.json (skip *-flagship, _template)
 *   2. Readiness    — lessons/<id>/readiness/index.html
 *   3. Unit hubs    — math/unit-<n>/index.html
 *   4. Unit projects— math/unit-<n>/projects/index.html
 *   5. Math tools   — math/<sub>/index.html
 *   6. Top-level    — first-level dirs containing index.html
 *
 * Output is idempotent: entries are sorted by a stable key so re-runs produce
 * byte-identical JSON when the repo is unchanged.
 */

import {
  readdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

/* ------------------------------------------------------------------ helpers */

function readText(p) {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&middot;/g, "·")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&rarr;/g, "→")
    .replace(/&times;/g, "×")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/** Pull a human title from an HTML file: prefer <title>, fall back to <h1>. */
function titleFromHtml(htmlPath, fallback) {
  const html = readText(htmlPath);
  if (html) {
    const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (t && t[1].trim()) {
      // Drop a trailing " | Neft Teacher" / " · Grade 6 Math" style suffix.
      let title = decodeEntities(t[1].replace(/\s+/g, " "));
      title = title.split(/\s+[|·–—-]\s+/)[0].trim() || title;
      if (title) return title;
    }
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1) {
      const clean = decodeEntities(h1[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
      if (clean) return clean;
    }
  }
  return fallback;
}

function titleCase(slug) {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const entries = [];
function add(e) {
  entries.push(e);
}

/* ----------------------------------------------------------- 1. lessons */

const lessonsDir = resolve(ROOT, "lessons");
if (existsSync(lessonsDir)) {
  for (const d of readdirSync(lessonsDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const name = d.name;
    if (name.startsWith("_") || name.endsWith("-flagship")) continue;

    const cfgPath = resolve(lessonsDir, name, "config.json");
    let title = `Lesson ${name}`;
    let lessonTitle = null;
    let standard = null;
    let unit = null;
    if (existsSync(cfgPath)) {
      try {
        const cfg = JSON.parse(readText(cfgPath));
        lessonTitle = cfg.title || null;
        title = cfg.title ? `${name} ${cfg.title}` : title;
        standard = cfg.standard ?? null;
        unit = cfg.unit ?? null;
      } catch {
        /* ignore malformed config */
      }
    } else if (!existsSync(resolve(lessonsDir, name, "index.html"))) {
      // No config and no page — not a navigable lesson.
      continue;
    }

    add({
      title,
      path: `/lessons/${name}/`,
      category: "Lesson",
      audience: "student",
      unit,
      standard,
    });

    // Readiness pre-lesson, if present.
    const readinessIdx = resolve(lessonsDir, name, "readiness", "index.html");
    if (existsSync(readinessIdx)) {
      const rTitle = lessonTitle
        ? `${name} Get Ready: ${lessonTitle}`
        : titleFromHtml(readinessIdx, `${name} Readiness Pre-Lesson`);
      add({
        title: rTitle,
        path: `/lessons/${name}/readiness/`,
        category: "Readiness",
        audience: "student",
        unit,
        standard,
      });
    }
  }
}

/* --------------------------------------------------------- 2. math tools */

// math subdirs that are hubs/routers rather than single tools.
const MATH_HUBS = new Set([
  "get-ready",
  "catch-up",
  "my-path",
  "number-talks",
  "unit-map",
]);

// Best-guess unit number from a "unit-N" math subdir name.
function unitFromName(name) {
  const m = name.match(/^unit-(\d+)$/);
  return m ? Number(m[1]) : null;
}

const mathDir = resolve(ROOT, "math");
if (existsSync(mathDir)) {
  for (const d of readdirSync(mathDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const name = d.name;
    const idx = resolve(mathDir, name, "index.html");
    const unit = unitFromName(name);

    // 3. Unit hubs — math/unit-<n>/  (per-unit landing page)
    if (unit != null) {
      if (existsSync(idx)) {
        const title = titleFromHtml(idx, `Unit ${unit} Hub`);
        add({
          title,
          path: `/math/${name}/`,
          category: "Unit Hub",
          audience: "student",
          unit,
          standard: null,
        });
      }

      // 4. Unit projects — math/unit-<n>/projects/
      const projIdx = resolve(mathDir, name, "projects", "index.html");
      if (existsSync(projIdx)) {
        const title = titleFromHtml(projIdx, `Unit ${unit} Projects`);
        add({
          title,
          path: `/math/${name}/projects/`,
          category: "Project",
          audience: "student",
          unit,
          standard: null,
        });
      }
      continue;
    }

    // 5. Other math tools / hubs (get-ready, unit-map, etc.)
    if (!existsSync(idx)) continue;
    const title = titleFromHtml(idx, titleCase(name));
    const category = MATH_HUBS.has(name) ? "Hub" : "Math Tool";
    add({
      title,
      path: `/math/${name}/`,
      category,
      audience: "student",
      unit: null,
      standard: null,
    });
  }
}

/* ----------------------------------------------------- 3. top-level apps */

// Dirs that are NOT navigable apps (infra, build output, source, excluded).
const TOP_SKIP = new Set([
  "assets",
  "engine",
  "scripts",
  "docs",
  "data",
  "directory", // the master directory page itself — don't list it inside itself
  "dist",
  "node_modules",
  "functions",
  "workers",
  "curriculum", // data/generator inputs, not a student page
  "math", // handled above
  "lessons", // handled above
  // Excluded by task constraints / another process touches these:
  "noam-school-v10",
]);

/**
 * Curated category + audience map for known top-level apps.
 * category: Lesson | Math Tool | Tool | Game | Hub | Practice | Readiness
 * audience: student | teacher | family
 */
const TOP_META = {
  "activity-studio": { category: "Tool", audience: "teacher" },
  "blood-on-the-river": { category: "Tool", audience: "student" },
  "bridge-to-grade-6": { category: "Practice", audience: "student" },
  "cartesian-odyssey": { category: "Game", audience: "student" },
  "correlation-playground": { category: "Tool", audience: "student" },
  dashboard: { category: "Tool", audience: "teacher" },
  "ecology-noam": { category: "Tool", audience: "student" },
  esol: { category: "Tool", audience: "student" },
  "esol-reading-writing": { category: "Tool", audience: "student" },
  "esol-study-guide": { category: "Tool", audience: "student" },
  "expressions-equations": { category: "Practice", audience: "student" },
  "fix-it-design-challenge": { category: "Game", audience: "student" },
  "forecast-engine": { category: "Tool", audience: "student" },
  "fractions-soccer": { category: "Game", audience: "student" },
  "geometry-prep": { category: "Practice", audience: "student" },
  "graphic-novels": { category: "Tool", audience: "student" },
  hyperdocs: { category: "Tool", audience: "student" },
  "math-lab-missions": { category: "Tool", audience: "student" },
  "mcap-review": { category: "Practice", audience: "student" },
  "misconception-lab": { category: "Tool", audience: "student" },
  "misconception-museum": { category: "Tool", audience: "student" },
  "neft-data-studio": { category: "Tool", audience: "teacher" },
  "neft-school-hub": { category: "Hub", audience: "student" },
  "netfold-pro": { category: "Game", audience: "student" },
  "noam-bar-mitzvah": { category: "Tool", audience: "family" },
  "number-system": { category: "Practice", audience: "student" },
  personal: { category: "Tool", audience: "family" },
  "practice-engine": { category: "Practice", audience: "student" },
  ratiolab: { category: "Tool", audience: "student" },
  "ratios-proportions": { category: "Practice", audience: "student" },
  refugee: { category: "Tool", audience: "student" },
  "reveal-evidence-studio": { category: "Tool", audience: "student" },
  "spiral-review": { category: "Practice", audience: "student" },
  "sports-analytics": { category: "Tool", audience: "student" },
  "statistics-data": { category: "Practice", audience: "student" },
  "summer-bridge": { category: "Practice", audience: "student" },
  "surface-area-review": { category: "Practice", audience: "student" },
  "teacher-data-dashboard": { category: "Tool", audience: "teacher" },
  "teacher-tools": { category: "Tool", audience: "teacher" },
  "unit-1": { category: "Practice", audience: "student" },
  "unit-4": { category: "Practice", audience: "student" },
  "unit-5": { category: "Practice", audience: "student" },
  "unit-5-practice": { category: "Practice", audience: "student" },
  "vocab-hub": { category: "Tool", audience: "student" },
  webquests: { category: "Tool", audience: "student" },
  "wida-access": { category: "Practice", audience: "student" },
  "word-to-equations": { category: "Tool", audience: "student" },
  "world-architect-math-project": { category: "Tool", audience: "student" },
};

for (const d of readdirSync(ROOT, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const name = d.name;
  if (name.startsWith(".")) continue;
  if (TOP_SKIP.has(name)) continue;
  const idx = resolve(ROOT, name, "index.html");
  if (!existsSync(idx)) continue;

  const meta = TOP_META[name] || { category: "Tool", audience: "student" };
  const title = titleFromHtml(idx, titleCase(name));
  add({
    title,
    path: `/${name}/`,
    category: meta.category,
    audience: meta.audience,
    unit: null,
    standard: null,
  });
}

/* --------------------------------------------------- stable sort + write */

const CATEGORY_ORDER = [
  "Lesson",
  "Readiness",
  "Project",
  "Unit Hub",
  "Math Tool",
  "Hub",
  "Tool",
  "Practice",
  "Game",
];

function lessonSortKey(path) {
  // /lessons/3-12/ -> [3, 12] for natural numeric ordering.
  const m = path.match(/\/lessons\/(\d+)-(\d+)/);
  if (m) return Number(m[1]) * 1000 + Number(m[2]);
  return Number.MAX_SAFE_INTEGER;
}

entries.sort((a, b) => {
  const ca = CATEGORY_ORDER.indexOf(a.category);
  const cb = CATEGORY_ORDER.indexOf(b.category);
  if (ca !== cb) return (ca === -1 ? 99 : ca) - (cb === -1 ? 99 : cb);
  if (a.category === "Lesson" || a.category === "Readiness") {
    const la = lessonSortKey(a.path);
    const lb = lessonSortKey(b.path);
    if (la !== lb) return la - lb;
  }
  return a.path.localeCompare(b.path);
});

const byCategory = {};
for (const e of entries) {
  byCategory[e.category] = (byCategory[e.category] || 0) + 1;
}

const out = {
  generated: "scripts/generate-catalog.mjs",
  note: "Canonical catalog of navigable pages/tools. Regenerate with: node scripts/generate-catalog.mjs",
  total: entries.length,
  byCategory,
  entries,
};

const outPath = resolve(ROOT, "data", "catalog.json");
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");

console.log(`Wrote ${entries.length} entries to data/catalog.json`);
for (const [cat, n] of Object.entries(byCategory)) {
  console.log(`  ${cat}: ${n}`);
}
