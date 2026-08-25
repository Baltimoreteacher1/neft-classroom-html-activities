#!/usr/bin/env node
/* =============================================================================
 * validate-planning.mjs — gate for /curriculum/planning/
 * -----------------------------------------------------------------------------
 * Scaffolded by scripts/new-surface.mjs. Wired into `npm run validate`, so it
 * gates every deploy. Add checks specific to what this surface promises — the
 * ones below are the classes that have actually broken surfaces in this repo:
 *
 *   1. Every file this surface owns still exists (a clobber deletes, it does
 *      not corrupt — and existsSync on the wrong path passes silently, so the
 *      list is explicit).
 *   2. The page's scripts parse, and every inline on* handler resolves to a
 *      function that is actually defined.
 *   3. No unscoped selector in the stylesheet.
 *   4. No dark-mode block — this is a light-only site.
 *   5. The discouraged label does not appear.
 * ========================================================================== */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

const OWNED_FILES = [
  "curriculum/planning/index.html",
  "curriculum/planning/planning.css",
  "curriculum/planning/planning.js",
  "curriculum/planning/planning-store.js",
  "curriculum/planning/planning-views.js",
  "curriculum/planning/planning-resources.js",
  "curriculum/planning/planning-export.js",
  "shared/pacing/engine.js",
  "shared/pacing/sections.js",
  "shared/pacing/xlsx.js",
  "functions/_lib/pacing-schema.js",
  "functions/api/pacing/[[path]].js",
  "data/pacing-baseline-2026-27.json",
  "tools/validate-planning.mjs",
];

const failures = [];
const fail = (m) => failures.push(m);
const check = (cond, m) => {
  if (!cond) fail(m);
};

/* --- 1. Owned files present and non-trivial -------------------------------- */
const files = new Map();
for (const rel of OWNED_FILES) {
  try {
    const body = read(rel);
    check(body.length > 200, `${rel} is only ${body.length} bytes — possible clobber or stub`);
    files.set(rel, body);
  } catch {
    fail(`missing owned file: ${rel}`);
  }
}
if (failures.length) {
  console.error("validate-planning: " + failures.join("\n  "));
  process.exit(1);
}

const html = files.get("curriculum/planning/index.html");
const css = files.get("curriculum/planning/planning.css");
const js = files.get("curriculum/planning/planning.js");

/* --- 2. Scripts parse; inline handlers resolve ------------------------------ */
for (const [i, block] of [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].entries()) {
  const src = block[1].trim();
  if (!src) continue;
  try {
    new Function(src);
  } catch (e) {
    fail(`inline <script> #${i + 1} in index.html does not parse: ${e.message}`);
  }
}

const defined = new Set([...js.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
for (const m of html.matchAll(/\son[a-z]+="([A-Za-z_$][\w$]*)\s*\(/g)) {
  check(defined.has(m[1]), `inline handler calls ${m[1]}(), which planning.js does not define`);
}

/* --- 3. Stylesheet stays scoped -------------------------------------------- */
for (const line of css.split("\n")) {
  const sel = line.match(/^\s*([a-z][\w-]*)\s*(?:,|\{)/);
  if (sel && !["from", "to"].includes(sel[1])) {
    fail(`unscoped selector "${sel[1]}" in planning.css — it must live under .planning-wrap`);
  }
}

/* --- 4 & 5. Light-only, and the label ------------------------------------- */
for (const [rel, body] of files) {
  check(
    !/prefers-color-scheme\s*:\s*dark/.test(body),
    `${rel} emits a dark-mode block; this is a light-only site`,
  );
  check(
    !/\bESOL\b/.test(body),
    `${rel} uses the discouraged label; say "support" or "Level 1" instead`,
  );
}

/* --- 6. One vocabulary, three places ---------------------------------------
 * The day types live in the engine, in the API's allow-list, and in the Edit
 * Day form. A type added to one and not the others is invisible in review and
 * shows up as a save that 400s, or a day the form cannot describe. */
{
  const engine = files.get("shared/pacing/engine.js");
  const api = files.get("functions/api/pacing/[[path]].js");
  const controller = files.get("curriculum/planning/planning.js");
  const list = (body, label) => {
    const block = body.match(new RegExp(`${label}[\\s\\S]*?\\[([\\s\\S]*?)\\]`));
    return block ? [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];
  };
  const engineTypes = list(engine, "DAY_TYPES");
  const apiTypes = list(api, "ALLOWED_DAY_TYPES");
  check(engineTypes.length > 5, "could not read DAY_TYPES out of the engine");
  for (const t of engineTypes) {
    check(apiTypes.includes(t), `day type "${t}" is in the engine but not in the API allow-list`);
  }
  for (const t of apiTypes) {
    check(
      engineTypes.includes(t),
      `day type "${t}" is in the API allow-list but not in the engine`,
    );
  }
  const formTypes = list(controller, "dayType");
  for (const t of formTypes) {
    check(
      engineTypes.includes(t),
      `the Edit Day form offers "${t}", which the engine does not know`,
    );
  }

  const engineStatuses = list(engine, "ACTUAL_STATUSES");
  const apiStatuses = list(api, "ALLOWED_ACTUAL");
  for (const s of engineStatuses) {
    check(apiStatuses.includes(s), `actual status "${s}" is in the engine but not in the API`);
  }
}

/* --- 7. The baseline is the ORIGINAL plan, not a copy of the curriculum -----
 * If a lesson title ever gets stored here, the planner starts showing names the
 * curriculum has since changed. The importer drops them; this proves it. */
{
  const baseline = JSON.parse(files.get("data/pacing-baseline-2026-27.json"));
  check(baseline.schoolYear === "2026-2027", "the baseline is not the SY26-27 plan");
  check(
    baseline.days.length === 210,
    `the baseline holds ${baseline.days.length} dates, expected 210`,
  );
  check(
    baseline.days.filter((d) => d.schoolStatus === "school").length === 180,
    "the baseline no longer holds 180 instructional days",
  );
  const launch = JSON.parse(read("data/curriculum-launch-manifest.json"));
  const titles = new Set(launch.lessons.map((l) => l.title));
  for (const d of baseline.days) {
    if (d.plan.planTitle && titles.has(d.plan.planTitle)) {
      fail(
        `${d.date} stores a curriculum lesson title ("${d.plan.planTitle}") — derive it instead`,
      );
    }
  }
  const ids = new Set(
    [...launch.lessons, ...launch.smallGroups, ...launch.catchUps, ...launch.endOfUnit].map(
      (e) => e.id,
    ),
  );
  for (const d of baseline.days) {
    if (d.plan.lessonId && !ids.has(d.plan.lessonId)) {
      fail(`${d.date} schedules ${d.plan.lessonId}, which no longer exists in the curriculum`);
    }
  }
}

/* --- 8. The planner is a teacher surface ----------------------------------- */
{
  const gate = read("functions/_lib/teacher-surface.js");
  check(
    gate.includes('p.startsWith("/curriculum/planning")'),
    "/curriculum/planning is not behind the teacher gate in functions/_lib/teacher-surface.js",
  );
}

/* --- 8b. The planner is reachable from the Curriculum Hub ------------------
 * A planner nobody can find is a planner nobody uses, and the failure is silent:
 * every file below still passes, the route still 200s for a teacher, and the
 * card is simply gone from /curriculum/. These are structural checks against the
 * hub markup — the link, the heading, and the one-authoritative-card rule —
 * rather than a full-page text match, so ordinary copy edits do not trip them. */
{
  const hub = read("curriculum/index.html");

  const links = hub.match(/href="\/curriculum\/planning\/?(?:\?[^"]*)?"/g) || [];
  check(links.length > 0, "/curriculum/ no longer links to /curriculum/planning/ at all");

  // The primary entry: a Pacing Planner heading with a CTA into the planner.
  const primary = /<h2[^>]*id="cns-planning-feature-title"[^>]*>\s*Pacing Planner\s*<\/h2>/.test(
    hub,
  );
  check(
    primary,
    'the hub\'s primary planning card (h2#cns-planning-feature-title, "Pacing Planner") is gone or renamed',
  );
  check(
    /<a[^>]+class="mf-btn solid"[^>]+href="\/curriculum\/planning\/"/.test(hub),
    "the primary planning card no longer carries an Open-the-planner CTA to /curriculum/planning/",
  );

  // Exactly one card may present itself as the live planning system. The static
  // year view is allowed to exist, but not to compete: it is titled as the
  // reference view it is. Two equally-authoritative cards is the state this
  // whole section exists to prevent.
  const planningHeadings = [
    ...hub.matchAll(/<h2[^>]*>([^<]*(?:Pacing|Scope|Planning)[^<]*)<\/h2>/g),
  ]
    .map((m) => m[1].trim())
    .filter(Boolean);
  const authoritative = planningHeadings.filter((h) => /^Pacing Planner$/.test(h));
  check(
    authoritative.length === 1,
    `expected exactly one authoritative "Pacing Planner" card on the hub, found ${authoritative.length}: ${planningHeadings.join(" | ")}`,
  );
  const legacy = planningHeadings.find((h) => /Scope/.test(h));
  check(
    !legacy || /^Original Scope/.test(legacy),
    `the static year view is titled "${legacy}" — title it "Original Scope & Sequence" so it reads as reference, not as a second planning system`,
  );

  // Every planner deep link the hub emits must name a view the planner renders.
  const views = [
    ...(
      files
        .get("curriculum/planning/planning.js")
        .match(/^const RENDERERS = \{([\s\S]*?)\};/m)?.[1] || ""
    ).matchAll(/^\s*(\w+):/gm),
  ].map((m) => m[1]);
  check(views.length === 5, `could not read the planner's view list (found ${views.length})`);
  for (const link of links) {
    const requested = link.match(/[?&]view=([^"&]+)/)?.[1];
    check(
      !requested || views.includes(requested),
      `the hub deep-links to ?view=${requested}, which the planner does not render (${views.join(", ")})`,
    );
  }
}

/* --- 9. No student data may be stored -------------------------------------- */
{
  const api = files.get("functions/api/pacing/[[path]].js");
  for (const word of ["student_name", "studentName", "student_id", "studentId", "iep", "wida"]) {
    check(
      !new RegExp(`\\b${word}\\b`, "i").test(api.replace(/\/\*[\s\S]*?\*\//g, "")),
      `the pacing endpoint references ${word}; this store holds curriculum pacing only`,
    );
  }
}

/* ── Class awareness ───────────────────────────────────────────────────────────
 * Three properties that, if they broke, would each be invisible from any single
 * file and expensive in exactly the way a planner must never be.
 */
{
  const api = files.get("functions/api/pacing/[[path]].js");
  const store = files.get("curriculum/planning/planning-store.js");
  const sections = files.get("shared/pacing/sections.js");
  const schema = files.get("functions/_lib/pacing-schema.js");

  /* 1. ONE PACING ENGINE. Class awareness is composed into the overlay BEFORE
   * resolveYear sees it; the engine must never learn what a section is, or the
   * ripple/absorber/lock behaviour would have to be re-validated per class. */
  const engine = files.get("shared/pacing/engine.js");
  check(
    !/\bsection\b/i.test(engine.replace(/\/\*[\s\S]*?\*\//g, "")),
    "shared/pacing/engine.js mentions a section — the engine must stay class-agnostic, " +
      "with classes composed into the overlay before resolveYear()",
  );

  /* 2. EVERY QUERY IS SCOPED. An unscoped SELECT or upsert against pacing_day is
   * how one class's plan becomes another's, and it reads as a correct query. */
  for (const m of api.matchAll(/FROM pacing_(day|op|change)\b([\s\S]{0,120})/g)) {
    /* `GROUP BY section` counts as scoped: an aggregate that reports per-section
     * totals (the health route) is answering about every layer on purpose, and
     * cannot leak one class's plan into another's view. */
    const tail = m[2];
    check(
      /section\s*(=|IN)/.test(tail) || /GROUP BY section/.test(tail),
      `an unscoped query against pacing_${m[1]} in the pacing endpoint — every read must ` +
        "name a section, or one class will see another's plan",
    );
  }
  check(
    /INSERT INTO pacing_day \(school_year, section, date/.test(api),
    "pacing_day writes do not carry a section",
  );

  /* 3. THE SECTION LIST IS NOT RETYPED. supports-schema.js is the roster source;
   * sections.js pins a copy; nothing else may invent a fourth list. */
  const roster = read("assets/learning-supports/supports-schema.js").match(
    /var SECTIONS = \[([^\]]*)\]/,
  );
  check(Boolean(roster), "could not read SECTIONS out of supports-schema.js");
  if (roster) {
    const canonical = [...roster[1].matchAll(/"(\d+)"/g)].map((x) => x[1]);
    const pinned = [
      ...(sections.match(/SECTIONS = Object\.freeze\(\[([^\]]*)\]/)?.[1] || "").matchAll(
        /"(\d+)"/g,
      ),
    ].map((x) => x[1]);
    check(
      canonical.join(",") === pinned.join(","),
      `shared/pacing/sections.js lists [${pinned}] but the roster says [${canonical}]`,
    );
  }
  for (const [label, source] of [
    ["planning.js", js],
    ["planning-store.js", store],
  ]) {
    check(
      !/\[\s*"601"\s*,\s*"602"/.test(source),
      `${label} hardcodes the class list — import SECTIONS from shared/pacing/sections.js`,
    );
  }

  /* 4. THE MIGRATION FAILS CLOSED. A future schema must be refused, not read
   * with older assumptions, and the endpoint must turn that into a 503. */
  check(
    /Refusing to read it/.test(schema),
    "the schema module no longer refuses a future version — an old reader would misinterpret it",
  );
  check(
    /error: "schema"/.test(api),
    "the pacing endpoint does not fail closed when the schema cannot be brought up to date",
  );

  /* 5. THE OUTBOX CARRIES ITS OWN SCOPE. An offline edit must replay into the
   * class it was made in, not the class selected when the network returns. */
  check(
    /section: op\.section/.test(store),
    "the outbox drains without the section recorded on each queued operation — " +
      "an offline 601 edit would replay into whichever class is selected later",
  );
}

/* -------------------------------------------------------------------------- */
if (failures.length) {
  console.error("validate-planning FAILED:");
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`✓ /curriculum/planning/ lock passed (${OWNED_FILES.length} owned files).`);
