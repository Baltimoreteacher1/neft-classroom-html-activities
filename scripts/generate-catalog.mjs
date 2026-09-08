#!/usr/bin/env node
/**
 * generate-catalog.mjs
 *
 * Scans the repo and writes data/catalog.json — the canonical index of every
 * NAVIGABLE page on the deployed static site. It is the single source of truth
 * behind /directory/ (the "find anything" surface).
 *
 * NON-DESTRUCTIVE: this script only READS the repo and WRITES data/catalog.json.
 * It never moves, renames, or deletes anything, and it never invents URLs — a
 * path is emitted only when the file backing it exists on disk.
 *
 * Coverage (was 557 entries / 34% of navigable pages before 2026-09-06):
 *   1. lessons/<id>/            — whole-group, Part 2, small group, catch-up
 *   2. lessons/<id>/readiness/  — Get Ready pre-lessons
 *   3. math/unit-<n>/**         — unit hubs, on-ramps, enrichment, games,
 *                                 reviews, study guides, supplemental, projects
 *   4. math/<tool>/**           — student math tools, the games arcade
 *   5. teacher-tools/**         — harvested from the hub's card metadata
 *                                 (data-title / data-category / description)
 *   6. curriculum/<sub>/        — planning, studio, and student-launch hubs
 *   7. families/**              — family homework surfaces
 *   8. every other top-level dir with an index.html
 *
 * Entry shape:
 *   { title, path, section, category, audience, unit, standard,
 *     lesson, variant, keywords }
 *
 * `lesson` + `variant` let /directory/ collapse the five surfaces of one lesson
 * (core / part2 / group1 / group2 / catchup / readiness) into a single row
 * instead of six competing search hits.
 *
 * Output is idempotent: entries are sorted by a stable key so re-runs produce
 * byte-identical JSON when the repo is unchanged. `npm run validate:catalog`
 * fails the build when data/catalog.json drifts from the repo.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
    .replace(/&rsquo;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A trailing site-brand suffix on a <title>, e.g. " | Neft Teacher".
 * Anchored to the end and limited to the brands this site actually uses, so a
 * dash inside a real title is left alone. Repeated to catch stacked suffixes
 * ("… · Neft Teacher Grade 6 Math").
 */
const BRAND_SUFFIX =
  /(\s*[|·–—-]\s*(Neft Teacher|EduWonderLab|Grade 6 Math|Neft Teacher Grade 6 Math))+\s*$/i;

/** Pull a human title from an HTML file: prefer <title>, fall back to <h1>. */
function titleFromHtml(htmlPath, fallback) {
  const html = readText(htmlPath);
  if (html) {
    const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (t && t[1].trim()) {
      let title = decodeEntities(t[1]);
      // Drop a trailing " | Neft Teacher" / " · Grade 6 Math" style suffix.
      //
      // Strip only a KNOWN trailing brand, and only from the end. Splitting on
      // the first separator instead — dashes included — truncated every title
      // that uses a dash as punctuation rather than as a brand separator: 953
      // titles on the site contain one, and "Unit 3 — Ratios & Rates" reached
      // the directory as the bare, useless "Unit 3".
      title = title.replace(BRAND_SUFFIX, "").trim() || title;
      if (title) return title;
    }
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1) {
      const clean = decodeEntities(h1[1].replace(/<[^>]+>/g, " "));
      if (clean) return clean;
    }
  }
  return fallback;
}

/**
 * True when a page is only an alias — a meta-refresh / location.replace stub
 * that bounces somewhere else. 18 of these exist (/games/3d/unit-1/ →
 * /math/unit-3/recipe-factory-line/, the moved Hebrew pages, …). Listing them
 * gives the directory two rows for one destination, and the row a reader
 * clicks first is the one that bounces. The alias keeps working; it just does
 * not get its own entry.
 */
function isRedirectStub(htmlPath) {
  const html = readText(htmlPath);
  if (!html) return false;
  if (/<meta[^>]+http-equiv=["']refresh["']/i.test(html)) return true;
  if (/(location\.replace|location\.href\s*=)/i.test(html) && html.length < 2500) return true;
  return false;
}

/** <meta name="description"> — the best available search text for a page. */
function descFromHtml(htmlPath) {
  const html = readText(htmlPath);
  const m = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  return m ? decodeEntities(m[1]) : "";
}

function titleCase(slug) {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => (/^\d+$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/* ------------------------------------------------------- the site's shape */

/**
 * SECTION_META is the information architecture, in one place. /directory/
 * renders these in order, grouped by lane, and ships them inside catalog.json
 * so the page never has to keep its own copy of the taxonomy.
 *
 * lane: teach (teacher) | learn (student) | family
 */
const SECTION_META = [
  {
    id: "curriculum",
    lane: "teach",
    label: "Curriculum & Planning",
    blurb: "The daily hub, unit sequence, pacing, and planning surfaces.",
  },
  {
    id: "teacher-tools",
    lane: "teach",
    label: "Plan & Create",
    blurb: "Generators and builders: lessons, Do Nows, differentiation, playlists.",
  },
  {
    id: "teach-live",
    lane: "teach",
    label: "Teach Live",
    blurb: "Projector-ready boards, pacing, and in-the-moment facilitation.",
  },
  {
    id: "data",
    lane: "teach",
    label: "Data & Evidence",
    blurb: "Dashboards, mastery, standards heatmaps, gradebook, and analysis.",
  },
  {
    id: "canvas",
    lane: "teach",
    label: "Canvas & Publishing",
    blurb: "SCORM, cartridges, rosters, and everything that ships to Canvas.",
  },
  {
    id: "about",
    lane: "teach",
    label: "Hubs & About",
    blurb: "Top-level entry points and this directory.",
  },

  {
    id: "lessons",
    lane: "learn",
    label: "Lessons",
    blurb: "Every lesson and its surfaces: whole-group, Apply, small group, catch-up, Get Ready.",
  },
  {
    id: "unit-resources",
    lane: "learn",
    label: "Unit Practice & Review",
    blurb: "Per-standard on-ramps, enrichment, reviews, study guides, and projects.",
  },
  {
    id: "math-tools",
    lane: "learn",
    label: "Math Tools",
    blurb: "Workbench, manipulatives, models, and calculators.",
  },
  {
    id: "arcade",
    lane: "learn",
    label: "Games & Arcade",
    blurb: "Every unit game, 3D game, and arcade.",
  },
  {
    id: "test-prep",
    lane: "learn",
    label: "Test Prep & Bridges",
    blurb: "MCAP, MSTAR, WIDA ACCESS, pre/post tests, and summer bridges.",
  },
  {
    id: "reading",
    lane: "learn",
    label: "Reading & Language",
    blurb: "ESOL supports, vocabulary, graphic novels, and novel studies.",
  },
  {
    id: "activities",
    lane: "learn",
    label: "Practice & Activities",
    blurb: "Spiral review, hyperdocs, webquests, and practice sets.",
  },
  {
    id: "labs",
    lane: "learn",
    label: "Labs & Projects",
    blurb: "Missions, simulations, and project-based extras.",
  },

  {
    id: "family",
    lane: "family",
    label: "Family & Homework",
    blurb: "Homework companions and family-facing pages.",
  },
  {
    id: "personal",
    lane: "family",
    label: "Personal",
    blurb: "Family pages that are not part of the classroom.",
  },
];

/** teacher-tools task family (data-category's first word) -> directory section. */
const TT_SECTION = {
  plan: "teacher-tools",
  teach: "teach-live",
  data: "data",
  canvas: "canvas",
  curriculum: "curriculum",
};

const entries = [];
const seen = new Set();

/**
 * Paths that must never reach the directory. /directory/ is student-reachable
 * (and /games/, /activities/ and /practice/ all 301 into it), so an answer key
 * listed here is an answer key handed out. Teacher access to these stays where
 * it already is: linked from inside the lesson or project page.
 */
const NEVER_INDEX = /(^|\/|-)(answer-keys?|answers|solutions|_incoming-decks|_template)(\/|$)/i;

function add(e) {
  if (NEVER_INDEX.test(e.path)) return;
  if (seen.has(e.path)) return;
  if (e.path.endsWith("/")) {
    const idx = resolve(ROOT, e.path.replace(/^\//, ""), "index.html");
    if (existsSync(idx) && isRedirectStub(idx)) return;
  }
  seen.add(e.path);
  entries.push({
    title: e.title,
    path: e.path,
    section: e.section,
    category: e.category,
    audience: e.audience,
    unit: e.unit ?? null,
    standard: e.standard ?? null,
    lesson: e.lesson ?? null,
    variant: e.variant ?? null,
    keywords: (e.keywords || "").replace(/\s+/g, " ").trim().slice(0, 320),
  });
}

/* ----------------------------------------------------------------- 1. lessons */

// A lesson id decomposes into a parent lesson and the surface it is.
const VARIANTS = [
  [/^(\d+-\d+)-part2$/, "part2", "Apply · Part 2"],
  [/^(\d+-\d+)-group1$/, "group1", "Small Group"],
  [/^(\d+-\d+)-group2$/, "group2", "Small Group"],
  [/^(\d+-\d+)-catchup$/, "catchup", "Catch-Up"],
  [/^(\d+-\d+)$/, "core", "Lesson"],
];

function classifyLessonDir(name) {
  for (const [re, variant, category] of VARIANTS) {
    const m = name.match(re);
    if (m) return { lesson: m[1], variant, category };
  }
  return { lesson: null, variant: "other", category: "Lesson" };
}

const VARIANT_LABEL = {
  core: "",
  part2: "Apply · Part 2",
  group1: "Small Group · Group 1",
  group2: "Small Group · Group 2",
  catchup: "Catch-Up",
  readiness: "Get Ready",
};

const lessonsDir = resolve(ROOT, "lessons");
if (existsSync(lessonsDir)) {
  for (const d of readdirSync(lessonsDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const name = d.name;
    if (name.startsWith("_") || name.endsWith("-flagship")) continue;

    const { lesson, variant, category } = classifyLessonDir(name);

    // Prefer the PARENT lesson's config for title/standard/unit so every
    // surface of lesson 6-2 shares one human name and one standard.
    const ownCfg = resolve(lessonsDir, name, "config.json");
    const parentCfg = lesson ? resolve(lessonsDir, lesson, "config.json") : ownCfg;
    let cfg = null;
    for (const p of [ownCfg, parentCfg]) {
      if (cfg) break;
      if (!existsSync(p)) continue;
      try {
        cfg = JSON.parse(readText(p));
      } catch {
        /* malformed config — fall through to the HTML title */
      }
    }
    const idx = resolve(lessonsDir, name, "index.html");
    if (!cfg && !existsSync(idx)) continue; // not navigable

    const base = cfg?.title || titleFromHtml(idx, titleCase(name));

    // A lesson folder with no launcher is not a student lesson — it is a config
    // that exists so a generator can emit ONE family page (the Unit 1 practice
    // test is the first). Cataloguing it at `/lessons/<name>/` would publish a
    // URL that 404s, so the row names the page that is actually on disk, in the
    // section whose audience it is written for.
    if (!existsSync(idx)) {
      const familyHomework = resolve(lessonsDir, name, "homework.html");
      if (!existsSync(familyHomework)) continue; // nothing navigable to name
      add({
        title: `${name} ${base} — Family Homework`,
        path: `/lessons/${name}/homework.html`,
        section: "family",
        category: "Homework",
        audience: "family",
        unit: cfg?.unit ?? null,
        standard: cfg?.standard ?? null,
        lesson: name,
        variant: "family",
        keywords: `family homework ${name} ${base} ${cfg?.standard || ""}`,
      });
      continue;
    }

    const suffix = VARIANT_LABEL[variant];
    const title = suffix ? `${lesson || name} ${base} — ${suffix}` : `${lesson || name} ${base}`;

    add({
      title,
      path: `/lessons/${name}/`,
      section: "lessons",
      category,
      audience: "student",
      unit: cfg?.unit ?? null,
      standard: cfg?.standard ?? null,
      lesson: lesson || name,
      variant,
      keywords: [name, base, cfg?.standard || "", cfg?.topic || ""].join(" "),
    });

    // Get Ready pre-lesson, if present.
    const readinessIdx = resolve(lessonsDir, name, "readiness", "index.html");
    if (existsSync(readinessIdx)) {
      add({
        title: `${lesson || name} ${base} — Get Ready`,
        path: `/lessons/${name}/readiness/`,
        section: "lessons",
        category: "Readiness",
        audience: "student",
        unit: cfg?.unit ?? null,
        standard: cfg?.standard ?? null,
        lesson: lesson || name,
        variant: "readiness",
        keywords: `readiness get ready pre-lesson ${name} ${base}`,
      });
    }
  }
}

/* -------------------------------------------------------------------- 2. math */

// math/ subdirs that are routers/hubs rather than a single activity.
const MATH_HUBS = new Set([
  "get-ready",
  "catch-up",
  "my-path",
  "number-talks",
  "unit-map",
  "games",
  "finder",
  "review-arcade",
  "projects",
  "supplemental",
  "remediation",
]);

const MATH_TEACHER = new Set([
  "command-center",
  "student-board",
  "student-tracker",
  "brain-demo",
  "choice-boards",
  "bridge-remediation-models",
]);

/** Classify a page under math/unit-<n>/ from its directory name. */
function classifyUnitPage(name) {
  const n = name.toLowerCase();
  if (n === "projects") return "Project";
  if (n === "supplemental") return "Practice";
  if (n === "study-guide" || n.endsWith("-study") || n.endsWith("study")) return "Study Guide";
  if (n.endsWith("-onramp") || n.endsWith("onramp")) return "On-Ramp";
  if (n.endsWith("-enrichment") || n.endsWith("enrichment")) return "Enrichment";
  if (n.includes("game")) return "Game";
  if (n.includes("review")) return "Review";
  return "Activity";
}

function unitFromName(name) {
  const m = name.match(/^unit-(\d+)$/);
  return m ? Number(m[1]) : null;
}

/** Recursively collect index.html directories under `dir`, up to `maxDepth`. */
function collectIndexDirs(dir, maxDepth, depth = 0) {
  const out = [];
  if (depth > maxDepth) return out;
  let items;
  try {
    items = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const it of items) {
    if (!it.isDirectory() || it.name.startsWith(".") || it.name.startsWith("_")) continue;
    const sub = resolve(dir, it.name);
    if (existsSync(resolve(sub, "index.html"))) out.push({ name: it.name, dir: sub, depth });
    out.push(...collectIndexDirs(sub, maxDepth, depth + 1));
  }
  return out;
}

/**
 * The lesson titles the curriculum manifest places in a unit, as search text.
 * The manifest is the source of truth for which lessons belong to which unit;
 * a unit hub's own <title> is not, and for three units it disagrees.
 */
const lessonWordsByUnit = new Map();

/**
 * Maryland standard domain codes, spelled out. Lesson titles alone are not
 * enough: unit 2's lessons say "Statistical", so a search for "statistics"
 * still missed the statistics unit. The domain its standards actually carry
 * (6.DS.*) supplies the word the reader types.
 *
 * Only the domain NAME. The lesson titles in the same bucket already supply the
 * topic words ("Understand Ratios", "Determine the Volume of…"), so listing
 * those here as well only spread false matches: every algebraic-thinking unit
 * started answering to "equations", including the ratios and percent units.
 */
const DOMAIN_WORDS = {
  DS: "data statistics",
  NOS: "number sense operations",
  AT: "algebraic thinking",
  GR: "geometry measurement",
};

try {
  const manifest = JSON.parse(readText(resolve(ROOT, "data", "curriculum-manifest.json")));
  for (const lesson of manifest.lessons || []) {
    if (lesson.unit == null) continue;
    const bucket = lessonWordsByUnit.get(lesson.unit) || new Set();
    if (lesson.title) bucket.add(lesson.title);
    if (lesson.topic) bucket.add(String(lesson.topic).replace(/-/g, " "));
    const domain = (String(lesson.standard || "").match(/^6\.([A-Z]+)/) || [])[1];
    if (domain && DOMAIN_WORDS[domain]) bucket.add(DOMAIN_WORDS[domain]);
    lessonWordsByUnit.set(lesson.unit, bucket);
  }
} catch {
  // No manifest (or malformed): hubs simply keep their title-derived keywords.
}
function unitLessonWords(unit) {
  return [...(lessonWordsByUnit.get(unit) || [])].join(" ");
}

const mathDir = resolve(ROOT, "math");
if (existsSync(mathDir)) {
  for (const d of readdirSync(mathDir, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith(".")) continue;
    const name = d.name;
    const sub = resolve(mathDir, name);
    const idx = resolve(sub, "index.html");
    const unit = unitFromName(name);

    if (unit != null) {
      if (existsSync(idx)) {
        add({
          title: titleFromHtml(idx, `Unit ${unit} Hub`),
          path: `/math/${name}/`,
          section: "unit-resources",
          category: "Unit Hub",
          audience: "student",
          unit,
          // Seed the hub's search text from the lessons the manifest actually
          // places in this unit, not just its own <title>.
          //
          // Three unit hubs carry a title from before the district resequenced:
          // unit-1 says "Number Sense", unit-2 says "Fraction Division" and
          // unit-10 says "Volume and Surface Area", while their lessons are the
          // "Math is…" identity unit, Statistics, and "Math Is…" respectively.
          // Searching "statistics" therefore returned 63 results and NOT the
          // statistics unit hub, while "number sense" surfaced a unit that has
          // none. Renaming those pages is a labelling decision that belongs with
          // the unit-numbering work, not with search — so this only widens what
          // matches. No displayed title changes.
          keywords: `unit ${unit} hub ${descFromHtml(idx)} ${unitLessonWords(unit)}`,
        });
      }
      // Everything inside the unit: on-ramps, enrichment, games, reviews,
      // study guides, supplemental practice, and projects.
      for (const child of collectIndexDirs(sub, 1)) {
        const category = classifyUnitPage(child.name);
        const childIdx = resolve(child.dir, "index.html");
        // The folder slug carries the OLD CCSS code (6-ns-b-2) while the page
        // title carries the current Maryland code (6.NOS.B.2). Showing the
        // slug-derived one next to the title contradicts it, so it goes into
        // keywords — searchable either way, displayed never.
        const slugStandard = (child.name.match(/6-[a-z]{2,3}-[a-z]-\d+[a-z]?/i) || [null])[0] || "";
        add({
          title: titleFromHtml(childIdx, titleCase(child.name)),
          path: `/math/${name}/${child.dir.slice(sub.length + 1).replace(/\\/g, "/")}/`,
          section: "unit-resources",
          category,
          audience: "student",
          unit,
          keywords: `unit ${unit} ${child.name} ${slugStandard.toUpperCase().replace(/-/g, ".")} ${descFromHtml(childIdx)}`,
        });
      }
      continue;
    }

    const isHub = MATH_HUBS.has(name);
    const audience = MATH_TEACHER.has(name) ? "teacher" : "student";
    // math/pre-unit/ has no index.html of its own; its projects still need to
    // be findable, so walk the children either way rather than skipping.
    if (existsSync(idx)) {
      add({
        title: titleFromHtml(idx, titleCase(name)),
        path: `/math/${name}/`,
        section: name === "games" ? "arcade" : "math-tools",
        category: isHub ? "Hub" : "Math Tool",
        audience,
        keywords: `${name} ${descFromHtml(idx)}`,
      });
    }
    // One level in: the arcade's games, statistics labs, intervention paths…
    for (const child of collectIndexDirs(sub, 1)) {
      const childIdx = resolve(child.dir, "index.html");
      const relPath = child.dir.slice(sub.length + 1).replace(/\\/g, "/");
      add({
        title: titleFromHtml(childIdx, titleCase(child.name)),
        path: `/math/${name}/${relPath}/`,
        section: name === "games" ? "arcade" : "math-tools",
        category: name === "games" ? "Game" : "Math Tool",
        audience,
        unit: (child.name.match(/^u(\d+)-/) || [null, null])[1]
          ? Number(child.name.match(/^u(\d+)-/)[1])
          : null,
        keywords: `${name} ${child.name} ${descFromHtml(childIdx)}`,
      });
    }
  }
}

/* ----------------------------------------------------- 3. teacher tools hub */

// The hub's cards already carry curated metadata (data-title, data-category
// keywords, a kind label, and a description). Harvest it rather than guessing
// from <title>, so directory search matches the same words the hub matches.
const TT_HUB = resolve(ROOT, "teacher-tools", "index.html");
if (existsSync(TT_HUB)) {
  const html = readText(TT_HUB);
  const cardRe = /<a\b([^>]*\bdata-tool-card\b[^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = cardRe.exec(html))) {
    const attrs = m[1];
    const body = m[2];
    const href = (attrs.match(/href=["']([^"']+)["']/i) || [])[1];
    if (!href || !href.startsWith("/")) continue;
    const dataTitle = (attrs.match(/data-title=["']([^"']+)["']/i) || [])[1];
    const dataCat = (attrs.match(/data-category=["']([^"']+)["']/i) || [])[1] || "";
    const dataAud = (attrs.match(/data-audience=["']([^"']+)["']/i) || [])[1] || "teacher";
    const kind = decodeEntities(
      ((body.match(/<span class="tool-kind">([\s\S]*?)<\/span>/i) || [])[1] || "").replace(
        /<[^>]+>/g,
        " ",
      ),
    );
    const heading = decodeEntities(
      ((body.match(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/i) || [])[1] || "").replace(/<[^>]+>/g, " "),
    );
    const blurb = decodeEntities(
      ((body.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || "").replace(/<[^>]+>/g, " "),
    );
    const family = dataCat.split(/\s+/)[0] || "plan";
    add({
      title: dataTitle || heading || titleCase(href.split("/").filter(Boolean).pop() || "Tool"),
      path: href.endsWith("/") || href.includes(".") ? href : href + "/",
      section: TT_SECTION[family] || "teacher-tools",
      category: "Tool",
      audience: dataAud.includes("student") && !dataAud.includes("teacher") ? "student" : "teacher",
      keywords: `${dataCat} ${dataAud} ${kind} ${blurb}`,
    });
  }
}

// The hub itself, then any teacher-tools/<dir> the hub does not card (the
// Canvas suite, the projector, the award kit) — a tool with no card on the hub
// is exactly the tool nobody can find, so it must still reach the directory.
const TT_DIR = resolve(ROOT, "teacher-tools");
if (existsSync(resolve(TT_DIR, "index.html"))) {
  add({
    title: "Teacher Tools",
    path: "/teacher-tools/",
    section: "about",
    category: "Hub",
    audience: "teacher",
    keywords: "teacher tools hub professional dashboards generators",
  });
  for (const d of readdirSync(TT_DIR, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith(".") || d.name === "assets") continue;
    const idx = resolve(TT_DIR, d.name, "index.html");
    if (!existsSync(idx)) continue;
    add({
      title: titleFromHtml(idx, titleCase(d.name)),
      path: `/teacher-tools/${d.name}/`,
      section: d.name.startsWith("canvas") ? "canvas" : "teacher-tools",
      category: "Tool",
      audience: "teacher",
      keywords: `teacher tool ${d.name} ${descFromHtml(idx)}`,
    });
  }
}

/* --------------------------------------------------- 4. curriculum sub-hubs */

// Student-facing surfaces that live under /curriculum/ but are not teacher tools.
const CURRICULUM_STUDENT = new Set([
  "my-progress",
  "student-launch",
  "student-digital-mailbox",
  "math-workbench",
  "manipulatives",
  "monster-math-academy",
  "arcade",
  "showcase",
  "class-boss",
  "study-pack",
]);
const CURRICULUM_FAMILY = new Set(["family-connections", "family-letter"]);

const curriculumDir = resolve(ROOT, "curriculum");
if (existsSync(curriculumDir)) {
  for (const d of readdirSync(curriculumDir, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith(".") || d.name === "runtime") continue;
    const idx = resolve(curriculumDir, d.name, "index.html");
    if (!existsSync(idx)) continue;
    const audience = CURRICULUM_FAMILY.has(d.name)
      ? "family"
      : CURRICULUM_STUDENT.has(d.name)
        ? "student"
        : "teacher";
    const section =
      audience === "family" ? "family" : audience === "student" ? "math-tools" : "curriculum";
    add({
      title: titleFromHtml(idx, titleCase(d.name)),
      path: `/curriculum/${d.name}/`,
      section,
      category: "Hub",
      audience,
      keywords: `curriculum ${d.name} ${descFromHtml(idx)}`,
    });
    for (const child of collectIndexDirs(resolve(curriculumDir, d.name), 1)) {
      const childIdx = resolve(child.dir, "index.html");
      const rel = child.dir.slice(resolve(curriculumDir, d.name).length + 1).replace(/\\/g, "/");
      add({
        title: titleFromHtml(childIdx, titleCase(child.name)),
        path: `/curriculum/${d.name}/${rel}/`,
        section,
        category: "Activity",
        audience,
        keywords: `curriculum ${d.name} ${child.name} ${descFromHtml(childIdx)}`,
      });
    }
  }
  add({
    title: "Curriculum Hub",
    path: "/curriculum/",
    section: "curriculum",
    category: "Hub",
    audience: "teacher",
    keywords: "curriculum hub lessons units plan today weekly pacing",
  });
}

/* --------------------------------------------------------------- 5. families */

const familiesDir = resolve(ROOT, "families");
if (existsSync(familiesDir)) {
  if (existsSync(resolve(familiesDir, "index.html"))) {
    add({
      title: "Family Homework Hub",
      path: "/families/",
      section: "family",
      category: "Hub",
      audience: "family",
      keywords: "family homework parents guardians practice at home",
    });
  }
  const lessonsHome = resolve(familiesDir, "lessons");
  if (existsSync(lessonsHome)) {
    for (const d of readdirSync(lessonsHome, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const idx = resolve(lessonsHome, d.name, "index.html");
      if (!existsSync(idx)) continue;
      const parentCfg = resolve(lessonsDir, d.name, "config.json");
      let cfg = null;
      try {
        cfg = JSON.parse(readText(parentCfg));
      } catch {
        /* no config — fall back to the page title */
      }
      const base = cfg?.title || titleFromHtml(idx, titleCase(d.name));
      add({
        title: `${d.name} ${base} — Family Homework`,
        path: `/families/lessons/${d.name}/`,
        section: "family",
        category: "Homework",
        audience: "family",
        unit: cfg?.unit ?? null,
        standard: cfg?.standard ?? null,
        lesson: d.name,
        variant: "family",
        keywords: `family homework ${d.name} ${base}`,
      });
    }
  }
}

/* --------------------------------------------------- 6. top-level sections */

const TOP_SKIP = new Set([
  "assets",
  "canvas-packages",
  "curriculum",
  "data",
  "directory",
  "dist",
  "docs",
  "engine",
  "families",
  "functions",
  "images",
  "lessons",
  "lti-worker",
  "math",
  "migrations",
  "night-shift",
  "node_modules",
  "public",
  "reports",
  "research",
  "results-worker",
  "scorm-packages",
  "scripts",
  "shared",
  "src",
  "teacher-tools",
  "test",
  "tests",
  "tools",
  "types",
  "workbench-live",
  "workers",
]);

/**
 * Curated section + category + audience for the top-level apps. `section` is
 * what the directory groups by, so this map is the site's information
 * architecture in one place. Anything not listed defaults to a student Tool in
 * "Labs & Extras" — visible, never hidden, but explicitly uncategorised so the
 * gap shows up rather than silently disappearing.
 */
/**
 * Sections whose pages sit two folders deep (/games/3d/unit-1/,
 * /activities/architect/unit-3/, /personal/CW/american/) rather than one.
 */
const NESTED_SECTIONS = new Set([
  "games",
  "activities",
  "personal",
  "esol",
  "practice",
  "mcap-review",
  "esol-reading-writing",
]);

/** Sections with no index.html of their own; /directory/ is their landing page. */
const INDEXLESS_SECTIONS = new Set(["games", "activities", "practice"]);

const TOP_META = {
  about: { s: "about", c: "Hub", a: "teacher" },
  "access-practice-lab": { s: "test-prep", c: "Practice", a: "student" },
  "access-teacher": { s: "test-prep", c: "Tool", a: "teacher" },
  activities: { s: "activities", c: "Practice", a: "student" },
  "activity-studio": { s: "teacher-tools", c: "Tool", a: "teacher" },
  "algebra-balance-scale": { s: "math-tools", c: "Math Tool", a: "student" },
  "ar-measure": { s: "math-tools", c: "Math Tool", a: "student" },
  "blood-on-the-river": { s: "reading", c: "Reading", a: "student" },
  "bridge-to-grade-6": { s: "test-prep", c: "Practice", a: "student" },
  "card-builder": { s: "teacher-tools", c: "Tool", a: "teacher" },
  "cartesian-odyssey": { s: "arcade", c: "Game", a: "student" },
  "class-manip": { s: "math-tools", c: "Math Tool", a: "student" },
  "correlation-playground": { s: "math-tools", c: "Math Tool", a: "student" },
  "cosmic-gravity-lab": { s: "labs", c: "Game", a: "student" },
  dashboard: { s: "data", c: "Tool", a: "teacher" },
  directory: { s: "about", c: "Hub", a: "teacher" },
  "double-line-racer": { s: "arcade", c: "Game", a: "student" },
  "ecology-noam": { s: "personal", c: "Tool", a: "family" },
  "end-of-year": { s: "test-prep", c: "Practice", a: "student" },
  esol: { s: "reading", c: "Hub", a: "student" },
  "esol-reading-writing": { s: "reading", c: "Practice", a: "student" },
  "esol-study-guide": { s: "reading", c: "Practice", a: "student" },
  "esol-vocab-scrambler": { s: "reading", c: "Game", a: "student" },
  evidence: { s: "data", c: "Tool", a: "teacher" },
  "expressions-equations": { s: "unit-resources", c: "Practice", a: "student" },
  "fix-it-design-challenge": { s: "labs", c: "Game", a: "student" },
  "focus-school": { s: "personal", c: "Tool", a: "family" },
  "forecast-engine": { s: "data", c: "Tool", a: "teacher" },
  "fractions-soccer": { s: "arcade", c: "Game", a: "student" },
  futures: { s: "labs", c: "Tool", a: "student" },
  games: { s: "arcade", c: "Hub", a: "student" },
  "games-live": { s: "arcade", c: "Game", a: "student" },
  "geometry-prep": { s: "unit-resources", c: "Practice", a: "student" },
  "graphic-novels": { s: "reading", c: "Reading", a: "student" },
  hyperdocs: { s: "activities", c: "Practice", a: "student" },
  "infinite-practice": { s: "activities", c: "Practice", a: "student" },
  "living-school": { s: "labs", c: "Tool", a: "student" },
  "mad-balance-sandbox": { s: "math-tools", c: "Math Tool", a: "student" },
  "math-lab-missions": { s: "labs", c: "Practice", a: "student" },
  "math-rpg": { s: "arcade", c: "Game", a: "student" },
  "math-sims": { s: "math-tools", c: "Math Tool", a: "student" },
  "mcap-review": { s: "test-prep", c: "Practice", a: "student" },
  "mentor-lab": { s: "labs", c: "Tool", a: "student" },
  "misconception-lab": { s: "teacher-tools", c: "Tool", a: "teacher" },
  "misconception-museum": { s: "labs", c: "Tool", a: "student" },
  "mstar-practice": { s: "test-prep", c: "Practice", a: "student" },
  "neft-data-studio": { s: "data", c: "Tool", a: "teacher" },
  "neft-math-lab-studio": { s: "labs", c: "Tool", a: "student" },
  "neft-school-hub": { s: "about", c: "Hub", a: "teacher" },
  "netfold-3d": { s: "labs", c: "Game", a: "student" },
  "netfold-pro": { s: "labs", c: "Game", a: "student" },
  "noam-bar-mitzvah": { s: "personal", c: "Tool", a: "family" },
  "number-system": { s: "unit-resources", c: "Practice", a: "student" },
  "osamr-case-clinic": { s: "labs", c: "Tool", a: "student" },
  personal: { s: "personal", c: "Hub", a: "family" },
  "post-test": { s: "test-prep", c: "Practice", a: "student" },
  practice: { s: "activities", c: "Practice", a: "student" },
  "practice-engine": { s: "activities", c: "Practice", a: "student" },
  "pre-test": { s: "test-prep", c: "Practice", a: "student" },
  "ratio-color-mixer": { s: "unit-resources", c: "Game", a: "student" },
  ratiolab: { s: "unit-resources", c: "Math Tool", a: "student" },
  "ratios-proportions": { s: "unit-resources", c: "Practice", a: "student" },
  refugee: { s: "reading", c: "Reading", a: "student" },
  "reveal-evidence-studio": { s: "teacher-tools", c: "Tool", a: "teacher" },
  "reveal-math": { s: "curriculum", c: "Hub", a: "teacher" },
  "shai-school": { s: "personal", c: "Tool", a: "family" },
  "small-group-level-3": { s: "curriculum", c: "Hub", a: "teacher" },
  "spectral-waves-lab": { s: "labs", c: "Game", a: "student" },
  "spiral-review": { s: "activities", c: "Practice", a: "student" },
  "sports-analytics": { s: "labs", c: "Tool", a: "student" },
  "starfield-coordinate-defender": { s: "arcade", c: "Game", a: "student" },
  "statistics-data": { s: "unit-resources", c: "Practice", a: "student" },
  "summer-bridge": { s: "test-prep", c: "Practice", a: "student" },
  "surface-area-review": { s: "unit-resources", c: "Practice", a: "student" },
  "teacher-data-dashboard": { s: "data", c: "Tool", a: "teacher" },
  today: { s: "curriculum", c: "Hub", a: "teacher" },
  "vocab-hub": { s: "reading", c: "Practice", a: "student" },
  webquests: { s: "activities", c: "Practice", a: "student" },
  "wida-access": { s: "test-prep", c: "Practice", a: "student" },
  "word-to-equations": { s: "math-tools", c: "Math Tool", a: "student" },
  "work-coach": { s: "labs", c: "Tool", a: "student" },
  "world-architect-math-project": { s: "labs", c: "Tool", a: "student" },
  "write-math": { s: "math-tools", c: "Math Tool", a: "student" },
};

for (const d of readdirSync(ROOT, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const name = d.name;
  if (name.startsWith(".") || TOP_SKIP.has(name)) continue;
  const idx = resolve(ROOT, name, "index.html");
  const meta = TOP_META[name] || { s: "labs", c: "Tool", a: "student" };

  // /games/, /activities/ and /practice/ have no index page of their own — they
  // 301 to /directory/ (data/routes.json). Their contents still have to be in
  // the catalog, or the redirect lands on a page that cannot answer the
  // question it was sent to answer.
  if (!existsSync(idx) && !INDEXLESS_SECTIONS.has(name)) continue;

  if (existsSync(idx)) {
    add({
      title: titleFromHtml(idx, titleCase(name)),
      path: `/${name}/`,
      section: meta.s,
      category: meta.c,
      audience: meta.a,
      keywords: `${name} ${descFromHtml(idx)}`,
    });
  }

  // Into the multi-page sections (mcap-review, mstar-practice, graphic-novels,
  // webquests, hyperdocs, esol, games, activities, personal…). Most are one
  // level deep; NESTED_SECTIONS wrap their pages in another folder
  // (/games/3d/unit-1/, /activities/architect/unit-1/) so they need two.
  const depth = NESTED_SECTIONS.has(name) ? 1 : 0;
  for (const child of collectIndexDirs(resolve(ROOT, name), depth)) {
    const childIdx = resolve(child.dir, "index.html");
    const rel = child.dir.slice(resolve(ROOT, name).length + 1).replace(/\\/g, "/");
    const unitMatch = child.name.match(/^unit-(\d+)$/);
    add({
      title: titleFromHtml(childIdx, titleCase(child.name)),
      path: `/${name}/${rel}/`,
      section: meta.s,
      category: meta.c === "Hub" ? "Practice" : meta.c,
      audience: meta.a,
      unit: unitMatch ? Number(unitMatch[1]) : null,
      keywords: `${name} ${rel.replace(/\//g, " ")} ${descFromHtml(childIdx)}`,
    });
  }
}

/* ------------------------------------------------ disambiguate titles */

/**
 * 115 entries shared a title with a sibling ("Blood on the River" x27,
 * "WebQuest" x10, "R1" x5): identical rows in a list whose whole job is telling
 * you which one to click. Where a page's own <title> does not distinguish it,
 * append the part of its path that does.
 */
{
  const groups = new Map();
  for (const e of entries) {
    const key = e.section + "|" + e.title.toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    for (const e of group) {
      const parts = e.path.split("/").filter(Boolean);
      // Prefer the last segment; if that repeats too (unit-1/lesson-1), take
      // the last two so the qualifier is actually unique.
      const tail = parts.slice(-1)[0] || "";
      const dupTail = group.filter(
        (o) => (o.path.split("/").filter(Boolean).slice(-1)[0] || "") === tail,
      ).length;
      const qualifier = titleCase((dupTail > 1 ? parts.slice(-2) : parts.slice(-1)).join(" "));
      if (qualifier && !e.title.toLowerCase().includes(qualifier.toLowerCase()))
        e.title = `${e.title} · ${qualifier}`;
    }
  }
}

/* --------------------------------------------------- stable sort + write */

const CATEGORY_ORDER = [
  "Lesson",
  "Apply · Part 2",
  "Small Group",
  "Catch-Up",
  "Readiness",
  "Homework",
  "Project",
  "Unit Hub",
  "On-Ramp",
  "Enrichment",
  "Review",
  "Study Guide",
  "Activity",
  "Math Tool",
  "Hub",
  "Tool",
  "Practice",
  "Reading",
  "Game",
];

function lessonSortKey(path) {
  const m = path.match(/\/(?:lessons|families\/lessons)\/(\d+)-(\d+)/);
  if (m) return Number(m[1]) * 1000 + Number(m[2]);
  return Number.MAX_SAFE_INTEGER;
}

entries.sort((a, b) => {
  const ca = CATEGORY_ORDER.indexOf(a.category);
  const cb = CATEGORY_ORDER.indexOf(b.category);
  if (ca !== cb) return (ca === -1 ? 99 : ca) - (cb === -1 ? 99 : cb);
  const la = lessonSortKey(a.path);
  const lb = lessonSortKey(b.path);
  if (la !== lb) return la - lb;
  return a.path.localeCompare(b.path);
});

const byCategory = {};
const bySection = {};
const byAudience = {};
for (const e of entries) {
  byCategory[e.category] = (byCategory[e.category] || 0) + 1;
  bySection[e.section] = (bySection[e.section] || 0) + 1;
  byAudience[e.audience] = (byAudience[e.audience] || 0) + 1;
}

const out = {
  generated: "scripts/generate-catalog.mjs",
  note: "Canonical index of navigable pages. Regenerate with: npm run generate-catalog. Checked by: npm run validate:catalog.",
  total: entries.length,
  byAudience,
  bySection,
  byCategory,
  sections: SECTION_META,
  entries,
};

const outPath = resolve(ROOT, "data", "catalog.json");
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");

console.log(`Wrote ${entries.length} entries to data/catalog.json`);
for (const [sec, n] of Object.entries(bySection).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${sec}: ${n}`);
}
