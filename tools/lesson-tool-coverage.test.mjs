/* ==========================================================================
 * lesson-tool-coverage.test.mjs — pins the INTERACTIVE TOOL COVERAGE contract
 * across the whole lesson fleet.
 *
 * `tools/interactive-tools.test.mjs` already guards that no tool ships nameless
 * and that the in-lesson drawer stays non-invasive. What nothing guarded was the
 * property Joel actually asks for — that the manipulatives are woven THROUGH the
 * lessons rather than parked in one spot:
 *
 *   1. COVERAGE. Every lesson exposes at least one tool in a slot `collectTools()`
 *      actually reads, and — the real contract — at least one in Explore AND at
 *      least one in Practice. A tool authored into a slot the collector never
 *      looks at is invisible to `?mode=tools` and to the in-lesson drawer, so it
 *      may as well not exist. The fleet is at 222/222 on all three; this test
 *      keeps it there.
 *
 *   2. REGISTRY ↔ CATALOG, BOTH DIRECTIONS. An authored `kind` that is not in the
 *      interactive-visual REGISTRY renders NOTHING, with no console warning at
 *      all (`mountInteractiveVisuals` only reaches its catch block for kinds it
 *      recognises). A registered kind with no `tool-catalog.js` entry shows a
 *      title-cased slug to a student. Both directions are checked here.
 *
 *   3. REQUIRED FIELDS. Each entry in REQUIRED_FIELDS is the condition under
 *      which that component produces NO DOM — read off the component source, not
 *      guessed. `tape-diagram` and `coordinate-plane` `return null` on empty
 *      data; `percent-grid` returns null outside 0–100; `box-plot` sets
 *      `host.textContent = ""` when any of the five summary numbers is missing.
 *      Source gates are the ONLY gates that catch this class cheaply:
 *      `mountInteractiveVisuals` stamps `data-iv-mounted` BEFORE it runs the
 *      factory, so a widget that mounts to a blank box still looks mounted to
 *      every DOM probe, and `validate:lesson-visuals` (which would catch it in a
 *      real browser) runs weekly, not per-push.
 *
 * The sweep FAILS LOUDLY on zero matches. A reader that quietly stops matching
 * lessons would otherwise report a perfectly clean fleet — the failure mode this
 * repo has been bitten by repeatedly. The field detectors are self-tested against
 * positive AND negative fixtures before the sweep runs, for the same reason.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const url = (p) => new URL(p, import.meta.url);
const read = (p) => readFileSync(url(p), "utf8");

// ── The real collector, booted the way the lesson page boots it ────────────
// Importing `collectTools` (rather than reimplementing its slot list here) is
// deliberate: a test that carried its own copy of SECTION_ORDER/VISUAL_KEYS
// would keep passing if the collector were narrowed, which is exactly the
// regression that would silently hide tools from students.
const dom = new JSDOM('<!doctype html><html lang="en"><body></body></html>', {
  url: "https://eduwonderlab.com/lessons/1-1/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
globalThis.URLSearchParams = dom.window.URLSearchParams;

const { collectTools } = await import("../engine/core/tools-mode.js");
const { catalogKey, TOOL_CATALOG } = await import("../engine/core/tool-catalog.js");

// ── REGISTRY, read from source ─────────────────────────────────────────────
const registrySrc = read("../engine/core/interactive-visual.js");
const registryBlock = registrySrc.slice(
  registrySrc.indexOf("const REGISTRY = {"),
  registrySrc.indexOf("\n};", registrySrc.indexOf("const REGISTRY = {")),
);
const REGISTRY_KINDS = new Set(
  [...registryBlock.matchAll(/^ {2}"?([a-z0-9-]+)"?:\s*(async\s*)?\(/gm)].map((m) => m[1]),
);
assert.ok(
  REGISTRY_KINDS.size > 25,
  `the REGISTRY reader matched ${REGISTRY_KINDS.size} kinds — it has stopped parsing interactive-visual.js`,
);

// Widgets reachable through the generic `manip` bridge. A `manip` naming a file
// that does not exist loads nothing and leaves an empty host.
const MANIP_WIDGETS = new Set(
  readdirSync(url("../shared/projects"))
    .filter((f) => f.startsWith("manip-") && f.endsWith(".js"))
    .map((f) => f.slice("manip-".length, -".js".length)),
);
assert.ok(MANIP_WIDGETS.size > 10, "the manip widget reader found almost nothing");

// ── Required fields: the condition for producing ANY DOM ───────────────────
const num = (v) => Number.isFinite(Number(v));
const someNum = (a) => Array.isArray(a) && a.some(num);
const presets = (v, pred) => Array.isArray(v.presets) && v.presets.some((p) => p && pred(p));

/** @type {Record<string, {need: string, ok: (v: any) => boolean}>} */
const REQUIRED_FIELDS = {
  "tape-diagram": {
    need: "rows[] whose entries carry parts[]",
    ok: (v) =>
      Array.isArray(v.rows) && v.rows.some((r) => Array.isArray(r?.parts) && r.parts.length),
  },
  "coordinate-plane": {
    need: "points[] with numeric x and y",
    ok: (v) => Array.isArray(v.points) && v.points.some((p) => num(p?.x) && num(p?.y)),
  },
  "percent-grid": {
    need: "percent between 0 and 100",
    ok: (v) => num(v.percent) && Number(v.percent) >= 0 && Number(v.percent) <= 100,
  },
  "factor-tree": { need: "value greater than 1", ok: (v) => num(v.value) && Number(v.value) > 1 },
  "box-plot": {
    need: "all five of min/q1/median/q3/max",
    ok: (v) => ["min", "q1", "median", "q3", "max"].every((k) => num(v[k])),
  },
  "dot-plot": { need: "values[]", ok: (v) => someNum(v.values) },
  histogram: {
    need: "bars[] with numeric values (or values[])",
    ok: (v) => (Array.isArray(v.bars) && v.bars.some((b) => num(b?.value))) || someNum(v.values),
  },
  "bar-chart": {
    need: "bars[] with numeric values",
    ok: (v) => Array.isArray(v.bars) && v.bars.some((b) => num(b?.value)),
  },
  "histogram-builder": { need: "data[]", ok: (v) => someNum(v.data) },
  "box-plot-builder": { need: "data[]", ok: (v) => someNum(v.data) },
  "stats-data-lab": { need: "values[] or data[]", ok: (v) => someNum(v.values) || someNum(v.data) },
  "stat-towers": { need: "values[]", ok: (v) => someNum(v.values) },
  "decimal-columns": {
    need: "numeric a and b, or presets[]",
    ok: (v) => (num(v.a) && num(v.b)) || presets(v, (p) => num(p.a) && num(p.b)),
  },
  "decimal-product": {
    need: "numeric a and b, or presets[]",
    ok: (v) => (num(v.a) && num(v.b)) || presets(v, (p) => num(p.a) && num(p.b)),
  },
  "decimal-quotient": {
    need: "numeric dividend and non-zero divisor, or presets[]",
    ok: (v) =>
      (num(v.dividend) && num(v.divisor) && Number(v.divisor) !== 0) ||
      presets(v, (p) => num(p.dividend) && num(p.divisor)),
  },
  "long-division-builder": {
    need: "numeric dividend and non-zero divisor, or presets[]",
    ok: (v) =>
      (num(v.dividend) && num(v.divisor) && Number(v.divisor) !== 0) ||
      (Array.isArray(v.presets) && v.presets.length > 0),
  },
  "fraction-divide": {
    need: "dividend and divisor, or presets[]",
    ok: (v) =>
      (v.dividend != null && v.divisor != null) ||
      presets(v, (p) => p.dividend != null && p.divisor != null),
  },
  "combine-like-terms": {
    need: "expr, or presets[] carrying expr",
    ok: (v) => (typeof v.expr === "string" && v.expr.trim() !== "") || presets(v, (p) => p.expr),
  },
  "step-solver": {
    need: "start, or presets[] carrying start",
    ok: (v) => (typeof v.start === "string" && v.start.trim() !== "") || presets(v, (p) => p.start),
  },
  "algebra-expand": {
    need: "a and c, or presets[]",
    ok: (v) => (v.a != null && v.c != null) || presets(v, (p) => p.a != null && p.c != null),
  },
  manip: {
    need: "a manip name matching a shared/projects/manip-<name>.js widget",
    ok: (v) =>
      typeof v.manip === "string" && /^[a-z0-9-]+$/.test(v.manip) && MANIP_WIDGETS.has(v.manip),
  },
};

// ── Detector self-test ─────────────────────────────────────────────────────
// A detector that always returns true reports a clean fleet forever. Each one is
// proved to accept a good config and reject the empty case before the sweep.
const GOOD = {
  "tape-diagram": { rows: [{ parts: [{ value: 3 }] }] },
  "coordinate-plane": { points: [{ x: 2, y: 5 }] },
  "percent-grid": { percent: 40 },
  "factor-tree": { value: 84 },
  "box-plot": { min: 1, q1: 3, median: 5, q3: 8, max: 12 },
  "dot-plot": { values: [1, 2, 3] },
  histogram: { bars: [{ label: "0–9", value: 5 }] },
  "bar-chart": { bars: [{ label: "A", value: 2 }] },
  "histogram-builder": { data: [4, 9, 12] },
  "box-plot-builder": { data: [4, 9, 12] },
  "stats-data-lab": { values: [4, 9] },
  "stat-towers": { values: [3, 7] },
  "decimal-columns": { a: 4.5, b: 2.25 },
  "decimal-product": { a: 0.4, b: 1.2 },
  "decimal-quotient": { dividend: 16.8, divisor: 2.4 },
  "long-division-builder": { dividend: 144, divisor: 12 },
  "fraction-divide": { dividend: "3/4", divisor: "1/2" },
  "combine-like-terms": { expr: "5x + 2 + 3x - 4" },
  "step-solver": { start: "x + 7 = 15" },
  "algebra-expand": { a: 3, c: 5 },
  manip: { manip: [...MANIP_WIDGETS][0] },
};
for (const [kind, rule] of Object.entries(REQUIRED_FIELDS)) {
  assert.ok(GOOD[kind], `${kind}: detector self-test is missing a positive fixture`);
  assert.equal(rule.ok(GOOD[kind]), true, `${kind}: detector rejects a VALID config`);
  assert.equal(rule.ok({}), false, `${kind}: detector accepts an EMPTY config — it cannot fail`);
}
// And a couple of near-miss negatives, where a shape looks right but renders blank.
assert.equal(REQUIRED_FIELDS["box-plot"].ok({ min: 1, q1: 3, median: 5, q3: 8 }), false);
assert.equal(REQUIRED_FIELDS["tape-diagram"].ok({ rows: [{ parts: [] }] }), false);
assert.equal(REQUIRED_FIELDS["percent-grid"].ok({ percent: 140 }), false);
assert.equal(REQUIRED_FIELDS.manip.ok({ manip: "no-such-widget" }), false);
assert.equal(REQUIRED_FIELDS["long-division-builder"].ok({ dividend: 10, divisor: 0 }), false);

// ── Fleet sweep ────────────────────────────────────────────────────────────
const lessonIds = readdirSync(url("../lessons"), { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== "_template")
  .map((e) => e.name)
  .sort();

const noTools = [];
const noExplore = [];
const noPractice = [];
const unregistered = [];
const uncatalogued = [];
const blankRisk = [];
let lessonsSwept = 0;
let toolsSeen = 0;
let fieldChecks = 0;

for (const id of lessonIds) {
  let config;
  try {
    config = JSON.parse(readFileSync(url(`../lessons/${id}/config.json`), "utf8"));
  } catch {
    continue; // not a lesson folder
  }
  lessonsSwept += 1;

  const tools = collectTools(config);
  toolsSeen += tools.length;
  if (!tools.length) noTools.push(id);
  const sections = new Set(tools.map((t) => t.section));
  if (!sections.has("explore")) noExplore.push(id);
  if (!sections.has("practice")) noPractice.push(id);

  for (const { v, section } of tools) {
    const where = `${id} (${section}) ${v.kind}`;
    if (!REGISTRY_KINDS.has(v.kind)) unregistered.push(where);
    const key = catalogKey(v);
    if (!TOOL_CATALOG[key]) uncatalogued.push(`${where} → catalog key "${key}"`);
    const rule = REQUIRED_FIELDS[v.kind];
    if (rule) {
      fieldChecks += 1;
      if (!rule.ok(v)) blankRisk.push(`${where}: needs ${rule.need}`);
    }
  }
}

// Zero-match guards. Each of these reporting "clean" while matching nothing is
// the exact failure this block exists to prevent.
assert.ok(lessonsSwept > 200, `swept only ${lessonsSwept} lessons — the fleet reader is broken`);
assert.ok(toolsSeen > 400, `collected only ${toolsSeen} tools — collectTools() matched nothing`);
assert.ok(
  fieldChecks > 300,
  `ran only ${fieldChecks} field checks — the detectors matched nothing`,
);

assert.deepEqual(
  noTools,
  [],
  "every lesson must expose at least one interactive tool in a slot collectTools() reads " +
    "(explore|practice|connect|launch|reflect × diagram|visual|simulator|lab); " +
    "a tool authored anywhere else is invisible to ?mode=tools and to the in-lesson drawer",
);
assert.deepEqual(
  noExplore,
  [],
  "every lesson needs a tool in EXPLORE — that is where the concept is built. " +
    "If a figure is parked in a legacy back-compat slot (explore.histogram), promote it to " +
    "explore.diagram with an explicit `kind`, the way connect.diagram already is",
);
assert.deepEqual(
  noPractice,
  [],
  "every lesson needs a tool in PRACTICE — that is where it is used",
);
assert.deepEqual(
  unregistered,
  [],
  "an authored kind missing from the interactive-visual REGISTRY renders NOTHING and warns NOTHING",
);
assert.deepEqual(
  uncatalogued,
  [],
  "every authored tool needs a tool-catalog.js entry, or students see a title-cased slug",
);
assert.deepEqual(
  blankRisk,
  [],
  "these tool configs are missing the fields their component needs, so they mount to a BLANK box " +
    "(data-iv-mounted is stamped before the factory runs, so no DOM probe would notice)",
);

// Registry → catalog, the other direction: nothing may be mountable but nameless.
for (const kind of REGISTRY_KINDS) {
  if (kind === "manip") continue; // a bridge; its widgets are catalogued as manip:<name>
  assert.ok(TOOL_CATALOG[kind], `registered kind "${kind}" has no tool-catalog entry`);
}
// Every catalogued manip must still have a widget file behind it.
for (const key of Object.keys(TOOL_CATALOG)) {
  if (!key.startsWith("manip:")) continue;
  assert.ok(
    MANIP_WIDGETS.has(key.slice("manip:".length)),
    `catalog lists "${key}" but shared/projects/manip-${key.slice(6)}.js does not exist`,
  );
}

// ── Every lesson type reaches the tools surface ────────────────────────────
// Core lessons and flagship boot through lesson-renderer (mountToolsMenuItem +
// the ?mode=tools branch); small-group and catch-up boot through
// small-group-renderer (which adds the in-lesson drawer as well). Flagship wraps
// bootLesson in a mission-briefing overlay, so it must short-circuit to the
// engine in tools mode or its 🧰 link lands on a story screen instead.
const lessonRenderer = read("../engine/core/lesson-renderer.js");
assert.match(
  lessonRenderer,
  /mountToolsMenuItem\(config\)/,
  "core lessons need the tools menu item",
);
assert.match(lessonRenderer, /if \(isToolsMode\(\)\)/, "core lessons need the ?mode=tools branch");

const smallGroup = read("../engine/core/small-group-renderer.js");
assert.match(
  smallGroup,
  /mountToolsMenuItem\(config\)/,
  "small-group lessons need the tools menu item",
);
assert.match(
  smallGroup,
  /mountToolDrawer\(config/,
  "small-group lessons need the in-lesson drawer",
);

const flagship = read("../engine/templates/flagship/flagship.js");
assert.match(flagship, /isToolsMode/, "flagship must detect tools mode");
assert.ok(
  flagship.indexOf("if (isToolsMode())") < flagship.indexOf("showMissionIntro("),
  "flagship must hand off to the engine BEFORE showing the mission briefing, or ?mode=tools is " +
    "gated behind a story screen for a lesson the student is not starting",
);

console.log(
  `lesson tool coverage: ${lessonsSwept} lessons, ${toolsSeen} tools collected, ` +
    `${fieldChecks} field checks, ${REGISTRY_KINDS.size} registered kinds — ` +
    `all lessons carry an Explore and a Practice tool`,
);
