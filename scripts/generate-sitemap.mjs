// Regenerates sitemap.xml from the navigable catalog (data/catalog.json),
// grouped/ordered logically with XML comments labeling each section:
//   home + hubs, then per-unit blocks (lesson, readiness, projects, unit hub),
//   then global tools / practice / games.
// Run after generate-catalog.mjs:
//   node scripts/generate-sitemap.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isTeacherSurface } from "../functions/_lib/teacher-surface.js";
import { HEAD_BYTES, robotsMetaNoindex } from "./lib/robots-meta.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The host every URL in the sitemap is declared on.
 *
 * MUST match the `<link rel="canonical">` every page already advertises, which
 * is the apex `eduwonderlab.com`. It read
 * `https://neft-classroom-html-activities.pages.dev` until 2026-09-07, so all
 * 267 entries named the Pages preview host while all 2,784 canonical tags named
 * the apex — a sitemap and a canonical tag are both canonicalization signals,
 * and every single URL had them disagreeing. Google Search Console reported it
 * as "Duplicate, Google chose different canonical than user": a sitemap entry
 * is a request to index THAT url, the page it serves says "index the apex
 * instead", and Google resolves the contradiction by picking one itself.
 *
 * `*.pages.dev` is deliberately NOT redirected to the apex (preview deployments
 * must keep serving themselves, and ship.sh smoke-checks them), so the two
 * hosts really do serve the same site — which is exactly why the sitemap must
 * not advertise the non-canonical one.
 */
const BASE = "https://eduwonderlab.com";

const cat = JSON.parse(readFileSync(join(root, "data", "catalog.json"), "utf8"));
const entries = Array.isArray(cat) ? cat : cat.entries || [];

// Track which paths have been emitted so nothing is duplicated.
const emitted = new Set();
// Paths the catalog offers that the teacher gate would refuse. Reported, not
// silently dropped — a catalog entry moving behind the gate is worth seeing.
const refused = new Set();
// Paths whose own page says noindex. Reported for the same reason.
const noindexed = new Set();
const lines = [];

function comment(text) {
  lines.push(`  <!-- ${text} -->`);
}

/**
 * Does the page served at this path ask not to be indexed?
 *
 * The robots-meta parse itself lives in scripts/lib/robots-meta.mjs, shared
 * with tools/validate-seo.mjs: the generator that excludes these pages and the
 * gate that fails when one slips in must not hold two different opinions about
 * what "noindex" means. Read from the page, never from a list here — a list is
 * one more thing to go stale, and the page is the only authority on its own
 * robots meta.
 */
function declaresNoindex(p) {
  const rel = p.replace(/^\/+/, "");
  const candidates = rel.endsWith(".html")
    ? [rel]
    : [join(rel, "index.html"), `${rel.replace(/\/$/, "")}.html`];
  for (const candidate of candidates) {
    const file = join(root, candidate);
    if (!existsSync(file)) continue;
    return robotsMetaNoindex(readFileSync(file, "utf8").slice(0, HEAD_BYTES));
  }
  return false;
}

function url(p) {
  if (!p || emitted.has(p)) return;
  // A sitemap entry asks Google to index that URL. A teacher surface answers
  // an anonymous crawler with 401 and never a page, so submitting one asks for
  // an indexing error and nothing else — Search Console reports the whole set
  // back as blocked. /dashboard/, /teacher-data-dashboard/ and /teacher-tools/
  // were all submitted this way. The predicate is imported from the gate rather
  // than re-spelled here, so a new teacher surface leaves the sitemap the day
  // it is gated, not the day someone remembers this file.
  if (isTeacherSurface(p)) {
    refused.add(p);
    return;
  }
  // A page carrying <meta name="robots" content="noindex"> has asked not to be
  // indexed. Submitting it in the sitemap asks for the opposite, and that is
  // the same defect as the host mismatch above — two signals about one URL,
  // disagreeing, resolved by Google rather than by us. 24 paths arrived this
  // way the moment the sitemap started reading the whole catalog, 16 of them
  // the /personal/ family pages, which are marked noindex, nofollow because
  // they are nobody's business but the family's.
  if (declaresNoindex(p)) {
    noindexed.add(p);
    return;
  }
  emitted.add(p);
  lines.push(`  <url><loc>${BASE}${p}</loc><changefreq>monthly</changefreq></url>`);
}
function byCat(cats, filter) {
  return entries
    .filter((e) => e.path && cats.includes(e.category) && (!filter || filter(e)))
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
byCat(["Hub"]).sort().forEach(url);

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
  if (!lessons.length && !readiness.length && !projects.length && !hub.length) continue;
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
byCat(["Practice", "Game"]).sort().forEach(url);

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

function reportRefused() {
  if (refused.size) {
    console.log(`Excluded ${refused.size} teacher-gated path(s) (they answer 401):`);
    for (const p of [...refused].sort()) console.log(`  ${p}`);
  }
  if (noindexed.size) {
    console.log(`Excluded ${noindexed.size} path(s) whose page declares noindex:`);
    for (const p of [...noindexed].sort()) console.log(`  ${p}`);
  }
}

const target = join(root, "sitemap.xml");

/*
 * `--check` compares instead of writing, the same shape as
 * `generate-plan-vocab --check` and `import-pacing-baseline --check`.
 *
 * WHY IT EXISTS. Nothing regenerates this file. It is not a build step, so
 * `build-injectors-idempotent` cannot see it drift, and until validate:seo was
 * written no gate read it at all — which is how it reached 267 URLs against a
 * catalog of 1,242 and spent months submitting the wrong host. Correcting the
 * content fixed the symptom; a file with a generator, no build wiring and no
 * freshness check drifts again the moment the catalog moves, and it did:
 * publishing new pages on main left the committed sitemap 2 entries short of
 * the site within a day.
 *
 * The counted difference is printed rather than a diff: a sitemap regenerates
 * whole, so a one-page change rewrites every line after it and a diff says
 * nothing useful about what actually changed.
 */
if (process.argv.includes("--check")) {
  const current = existsSync(target) ? readFileSync(target, "utf8") : "";
  if (current === xml) {
    console.log(`sitemap.xml is current — ${emitted.size} URLs on ${BASE}.`);
    reportRefused();
  } else {
    const was = (current.match(/<loc>/g) || []).length;
    console.error(
      `FAIL sitemap.xml is stale: committed ${was} URL(s), the catalog now yields ${emitted.size}.\n` +
        "  Run `node scripts/generate-sitemap.mjs` and commit the result.",
    );
    process.exit(1);
  }
} else {
  writeFileSync(target, xml);
  console.log(`Wrote sitemap.xml with ${emitted.size} URLs on ${BASE}.`);
  reportRefused();
}
