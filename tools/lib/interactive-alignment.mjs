/**
 * interactive-alignment.mjs — read every interactive element a lesson mounts,
 * with enough context to judge whether it belongs there.
 *
 * WHAT THIS IS FOR. Lesson 1-4 ("Math is Explaining and Sharing", 5.MD.C.5)
 * shipped a trapezoid AREA explorer labelled "Garden footprint: the 6 ft bed and
 * the 4 ft bed share a 2 ft width", in a lesson whose entire mathematical content
 * is arguing about the VOLUME of cereal boxes. The widget worked perfectly. It
 * was in the registry, it had a catalog entry, it rendered, it passed every gate
 * the repo had — because every gate asked "does this tool function?" and none
 * asked "is this the right tool for this lesson's mathematics?".
 *
 * A machine cannot answer that question in general. It CAN answer three specific,
 * checkable parts of it, and those three turn out to catch the defect:
 *
 *   1. NUMBERS. A tool configured with quantities that appear nowhere in its own
 *      lesson is drawing a different problem from the one on the page. 1-4's
 *      trapezoid is 6/4/2; the lesson's numbers are 8, 3, 10, 240, 720, 400, 800.
 *   2. CONTEXT. A tool label naming a scenario the lesson never mentions ("Garden
 *      footprint" in a cereal-box lesson) is a label copied from another lesson.
 *   3. DOMAIN. A tool whose mathematical domain (area / volume / ratio / data /
 *      equations / number) disagrees with the lesson's standard is teaching
 *      different mathematics.
 *
 * Each is EVIDENCE, not a verdict. The module reports; a human classifies, and
 * the classification is recorded in data/interactive-alignment-review.json.
 * That split is deliberate — see §13 of the audit brief. Automation gives the
 * structural guarantee; the review artifact carries the instructional judgement.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/* The slots engine/core/tools-mode.js actually reads. Kept in step with it by
 * assertion rather than by comment — see toolsModeSlots() below. */
export const SECTION_ORDER = ["explore", "practice", "connect", "launch", "reflect"];
export const VISUAL_KEYS = ["diagram", "visual", "simulator", "lab"];

/** Read SECTION_ORDER/VISUAL_KEYS out of the shipped collector so this module
 *  cannot drift from the code that decides what students actually see. */
export function toolsModeSlots(root) {
  const src = readFileSync(join(root, "engine/core/tools-mode.js"), "utf8");
  const grab = (name) => {
    const m = src.match(new RegExp(`const ${name} = \\[([^\\]]*)\\]`));
    return m ? [...m[1].matchAll(/"([a-z]+)"/g)].map((x) => x[1]) : [];
  };
  return { sections: grab("SECTION_ORDER"), visualKeys: grab("VISUAL_KEYS") };
}

/* ── Extraction ────────────────────────────────────────────────────────────── */

/**
 * The name this audit knows a mounted element by.
 *
 * `kind: "manip"` is a BRIDGE, not a tool: engine/core/interactive-visual.js
 * routes it to whichever `shared/projects/manip-<name>.js` widget the sibling
 * `manip` field names, so every one of them arrived here as the single key
 * "manip" — absent from TOOL_TOPICS, therefore domain-neutral, therefore never
 * flagged on topic grounds. That hole is not hypothetical: lesson 5-10
 * ("Volume of Rectangular Prisms", 6.GR.2, fractional edges, base area ×
 * height) shipped `manip:cube-builder` in TANK mode, whose steppers truncate to
 * whole numbers and whose readout prints the open-top SURFACE AREA of five
 * glass faces — 6.GR.4 mathematics the lesson does not teach and cannot use.
 * The topic detector could not see it, because the tool never told it its name.
 */
export function elementKey(node) {
  if (node.kind === "manip" && typeof node.manip === "string") return `manip:${node.manip}`;
  return node.kind;
}

/** Every interactive element in a lesson config, with where it came from. */
export function extractElements(config) {
  const out = [];
  const seen = new Set();

  const push = (node, slot, source) => {
    if (!node || typeof node !== "object" || typeof node.kind !== "string") return;
    // De-duplicate the way collectTools() does: kind + serialized config. A tool
    // authored into two slots is ONE tool to a student.
    const fingerprint = `${slot}|${node.kind}|${JSON.stringify(node)}`;
    if (seen.has(fingerprint)) return;
    seen.add(fingerprint);
    out.push({ slot, key: elementKey(node), source, config: node });
  };

  for (const section of SECTION_ORDER) {
    const block = config?.[section];
    if (!block || typeof block !== "object") continue;
    for (const key of VISUAL_KEYS) push(block[key], `${section}.${key}`, "authored");
    // launch.conceptIntro.interactiveVisual is the Learn It slot.
    if (block.conceptIntro?.interactiveVisual) {
      push(block.conceptIntro.interactiveVisual, `${section}.conceptIntro`, "authored");
    }
  }
  // The warm-up is NOT collected. It carries a `kind` ("spiral") but it is a
  // prerequisite quiz block, not a mounted manipulative: engine/core/tools-mode.js
  // never reads it, so it does not appear in the tools drawer, and it is
  // deliberately about EARLIER mathematics than the lesson. Auditing it for
  // alignment with the lesson objective would flag every spiral review on the
  // site for doing exactly its job.
  for (const key of ["interactiveVisual", "visualModel"]) {
    push(config?.[key], key, "authored");
  }
  return out;
}

/**
 * The Learn It tool a student is ACTUALLY handed, resolved through the same
 * module the browser runs.
 *
 * extractElements() above sees only what a lesson AUTHORED, and almost no
 * lesson authors its Learn It tool — that one is chosen by the standard/keyword
 * ladder in engine/core/lesson-tool-resolver.js. So the tool most students
 * spend the most time with was the one thing this audit could not see, and
 * lesson 5-10's cube-with-a-net came from exactly there.
 *
 * `source: "resolved"` distinguishes it from an authored element, and
 * `fallback: true` marks a lesson the ladder could not identify at all — it
 * matched no standard and no keyword and was handed the default anyway.
 * Returns [] when the lesson declares it wants no interactive.
 */
export async function resolvedLearnItElement(config) {
  const { resolveInteractiveToolForLesson } = await import(
    "../../engine/core/lesson-tool-resolver.js"
  );
  const tool = resolveInteractiveToolForLesson(config);
  if (!tool || typeof tool !== "object" || typeof tool.kind !== "string") return [];
  return [
    {
      slot: "launch.conceptIntro:resolved",
      key: elementKey(tool),
      source: tool.fallback ? "fallback" : "resolved",
      config: tool,
    },
  ];
}

/* ── Evidence 1: the numbers the lesson actually uses ──────────────────────── */

/**
 * A copy of the lesson with every interactive element removed.
 *
 * THIS IS THE WHOLE TRICK, and getting it wrong makes the audit useless. The
 * first version of this module compared each tool's numbers against "every
 * number in the lesson" — computed by walking the config, which CONTAINS the
 * tool. So the trapezoid's 6, 4 and 2 were found in the lesson, by finding
 * themselves, and the detector reported a clean fleet on the very defect it was
 * written for. Same for the label: "Garden footprint" appeared in the lesson
 * text because the label is part of the lesson text.
 *
 * Evidence about a tool has to come from everything EXCEPT that tool.
 */
export function withoutInteractives(config) {
  const strip = (node) => {
    if (Array.isArray(node)) return node.map(strip);
    if (!node || typeof node !== "object") return node;
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      // A nested object carrying a `kind` string is a mounted interactive.
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        typeof value.kind === "string"
      ) {
        continue;
      }
      out[key] = strip(value);
    }
    return out;
  };
  return strip(config);
}

/** Every number that appears anywhere in a lesson's own prose and answers. */
export function lessonNumbers(config) {
  const found = new Set();
  const walk = (node) => {
    if (typeof node === "number" && Number.isFinite(node)) {
      found.add(node);
      return;
    }
    if (typeof node === "string") {
      for (const m of node.matchAll(/-?\d+(?:\.\d+)?/g)) found.add(Number(m[0]));
      // Fractions read as their parts AND their value: "3/4" is evidence for a
      // tool configured with 3, with 4, or with 0.75.
      for (const m of node.matchAll(/(\d+)\s*\/\s*(\d+)/g)) {
        const value = Number(m[1]) / Number(m[2]);
        if (Number.isFinite(value)) found.add(Number(value.toFixed(4)));
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === "object") Object.values(node).forEach(walk);
  };
  walk(config);
  return found;
}

/** The numbers a tool's own configuration asserts about the problem.
 *  Cosmetic and structural fields are excluded: a tool is not claiming anything
 *  about the mathematics by having a width of 400 pixels or a step of 1. */
const COSMETIC_FIELDS = new Set([
  // Axis bounds are SCALE, not claims about the problem — the same reasoning
  // validate:learn-figures uses to exempt axis ticks from its measurement check.
  // A coordinate plane drawn to max 22 so an 18-foot courtyard fits on it is not
  // asserting that 22 is a quantity in the lesson.
  "min",
  "max",
  "width",
  "height",
  "size",
  "step",
  "steps",
  "duration",
  "speed",
  "precision",
  "decimals",
  "rows",
  "cols",
  "columns",
  "version",
]);

export function toolNumbers(toolConfig) {
  const found = new Map();
  for (const [field, value] of Object.entries(toolConfig || {})) {
    if (field === "kind" || COSMETIC_FIELDS.has(field)) continue;
    if (typeof value === "number" && Number.isFinite(value)) found.set(field, value);
    if (typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value.trim())) {
      found.set(field, Number(value));
    }
  }
  return found;
}

/* ── Evidence 2: the words the lesson actually uses ────────────────────────── */

/** All prose in a lesson, lowercased, for context comparison. */
export function lessonText(config) {
  const parts = [];
  const walk = (node) => {
    if (typeof node === "string") {
      parts.push(node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === "object") Object.values(node).forEach(walk);
  };
  walk(config);
  return parts.join(" ").toLowerCase();
}

/** Content words in a tool's label that the lesson never mentions.
 *  Stop-words and mathematical vocabulary are excluded — a label saying "area"
 *  in an area lesson is not evidence of anything. What this looks for is a
 *  CONTEXT noun: garden, cereal, canoe, pizza. */
const STOP = new Set(
  (
    "the a an and or of in on at to for with is are be it its this that each every " +
    "interactive tool lab explorer builder model diagram chart plot grid table line " +
    "your you use using make made show shows see find how what which one two three " +
    "step steps drag slide click tap try change set up down left right same different " +
    "beside share shares shared width height length side sides unit units number numbers"
  )
    .split(" ")
    .filter(Boolean),
);

export function labelContextMisses(toolConfig, text) {
  // `label` only. A section block's `title` is the heading above the tool, not
  // the tool's own caption, and reading it made every spiral warm-up report its
  // own heading words as foreign context.
  const raw = toolConfig?.label;
  const label = typeof raw === "string" ? raw.toLowerCase() : "";
  if (!label) return [];
  const misses = [];
  for (const token of label.split(/[^a-z]+/)) {
    const word = token.trim();
    if (word.length < 4 || STOP.has(word)) continue;
    // Match on the stem so "boxes" in the label finds "box" in the lesson.
    const stem = word.replace(/(ies|es|s)$/, "");
    if (!stem || stem.length < 3) continue;
    if (!text.includes(stem)) misses.push(word);
  }
  return misses;
}

/* ── Evidence 3: mathematical domain ───────────────────────────────────────── */

/**
 * The domain each tool kind teaches. Read off what the component DOES, not off
 * its name — `cross-section` slices a solid, so it is volume/solid geometry even
 * though "section" sounds generic.
 *
 * A kind absent from this table is domain-neutral (a calculator, a spiral
 * warm-up, a generic chart) and is never flagged on domain grounds. Silence here
 * means "no opinion", never "aligned".
 */
/**
 * The topics each tool kind can legitimately serve.
 *
 * KEYED TO data/ccss-standards.json's own `topic` field, which is the
 * curriculum's single source of truth for what a standard is about. Two earlier
 * versions of this table invented their own taxonomy from the shape of the
 * standard code and were wrong both times — the first read 6.GR.2 as plane area
 * when lesson 5-5 under it is "Determine the Volume of Rectangular Prisms", the
 * second lumped every 6.AT.* code into "equations" when 6.AT.1-4 are the ratio
 * and percent standards of Units 3 and 4. Between them they flagged over 150
 * correct tools. Reading the registry removes the guess entirely.
 *
 * A SET per kind, because most of these representations genuinely serve several
 * topics, and every widening below was made only after reading the lessons that
 * use it:
 *
 *   - `tape-diagram` is a part-whole model, not a ratio instrument. It is THE
 *     canonical picture for "how many 1/2s are in 3/4?" (6.NOS.1, fractions).
 *   - `number-line` graphs an inequality; 6.AT.8/9 are the inequality standards
 *     and lessons 8-4 through 8-7 use it for exactly that.
 *   - `bar-chart` is a DECOMPOSITION display here far more often than a
 *     statistics one: 5-6's bars are the three doubled face pairs that add to
 *     the 568 in² of wrapping paper the lesson is about.
 *   - `coordinate-plane` belongs in an AREA lesson because 6.GR.1 says, in the
 *     standard's own words, to draw polygons in the coordinate plane.
 *
 * A kind absent from this table is domain-neutral and never flagged. Silence
 * means "no opinion", never "aligned".
 */
export const TOOL_TOPICS = {
  // Kinds the RESOLVER produces. Before lesson-tool-resolver.js was extracted,
  // nothing outside a browser could ask which tool a lesson actually gets, so
  // these nine were never audited at all — the topic detector only ever saw
  // tools a lesson had authored, and most lessons author none. Each topic below
  // was read off the lessons the resolver routes to it, not off the tool's name.
  "equation-balance-lab": ["inequalities", "expressions"],
  "stats-data-lab": ["statistics"],
  "box-plot-builder": ["statistics"],
  "unit-rate-builder": ["ratios"],
  "percent-builder": ["ratios"],
  "lcm-lab": ["factors"],
  "factor-tree-lab": ["factors"],
  "combine-like-terms": ["expressions"],
  "distributive-builder": ["expressions"],
  // Exponents AND expressions: 6-4 is "Write and Evaluate Numerical Expressions
  // WITH EXPONENTS" (6.AT.6c, whose standard topic is "expressions") and its
  // objective says "including powers". The tool is right; the standard's topic
  // field is coarser than the lesson, as it was for 4-2's fraction bar.
  "power-builder": ["exponents", "expressions"],

  // Volume as base area × height, with half-unit edges and NO surface area.
  // Narrow on purpose — see engine/components/prism-volume.js.
  "prism-volume": ["volume"],
  // The `shared/projects/manip-*.js` widgets, reached through the `kind:"manip"`
  // bridge and keyed here by elementKey(). Until 2026-08-16 they all arrived as
  // the single key "manip" and were therefore invisible to this detector.
  "manip:cube-builder": ["volume", "surface-area"],
  "manip:composite-split": ["area"],
  "manip:frac-divide": ["fractions"],
  // A part-whole bar. Tagged for ratios as well as fractions because 4-2
  // ("Relate Fractions, Decimals, and Percentages", 6.AT.4, whose standard topic
  // is "ratios") shades one half beside two fourths — the tool is exactly right
  // and the standard's topic field is simply coarser than the lesson.
  "manip:fraction-bar": ["fractions", "ratios"],
  "manip:percent-bar": ["ratios"],
  "manip:ratio-build": ["ratios"],
  "manip:dot-plot": ["statistics"],
  "area-morph": ["area"],
  "shape-area": ["area"],
  "composite-area": ["area"],
  "cross-section": ["volume", "surface-area"],
  "volume-builder": ["volume", "surface-area"],
  "surface-net": ["volume", "surface-area"],
  "net-folder": ["volume", "surface-area"],
  "solid-3d": ["volume", "surface-area", "measurement"],
  // + coordinate-plane: 7-7 tapes the perimeter 7+7+3+3 it read off the vertex
  // coordinates, which is a part-whole sum drawn as a tape.
  "tape-diagram": [
    "ratios",
    "fractions",
    "decimals",
    "expressions",
    "inequalities",
    "coordinate-plane",
  ],
  "ratio-table": ["ratios", "patterns", "expressions"],
  "ratio-table-builder": ["ratios", "patterns", "expressions"],
  "double-number-line": ["ratios", "number-line"],
  "percent-grid": ["ratios", "fractions"],
  "equation-balance": ["expressions", "inequalities"],
  "inequality-line": ["inequalities", "number-line"],
  "expression-builder": ["expressions", "exponents"],
  "step-solver": ["expressions", "exponents", "decimals", "inequalities"],
  // + ratios: 3-4's objective IS "graph the values from a ratio table as points
  // on the coordinate plane". + number-line: the registry tags 6.NOS.6 as
  // number-line, but the lesson under it is "Represent Rational Numbers on the
  // Coordinate Plane" — the two topics are adjacent, not exclusive.
  "coordinate-plane": [
    "coordinate-plane",
    "area",
    "patterns",
    "expressions",
    "ratios",
    "number-line",
  ],
  // + ratios: the DOUBLE number line is the canonical percent and unit-conversion
  // model (4-5 dollars-to-percent, 3-6 litres-to-millilitres). + factors: 6-12
  // finds the LCM by counting 4s and 6s along one line until they land together.
  "number-line": [
    "number-line",
    "coordinate-plane",
    "fractions",
    "decimals",
    "inequalities",
    "ratios",
    "factors",
  ],
  "number-line-explorer": ["number-line", "coordinate-plane", "fractions", "decimals"],
  "fraction-divide": ["fractions"],
  "long-division-builder": ["decimals", "fractions"],
  "decimal-product": ["decimals"],
  "decimal-quotient": ["decimals"],
  // + fractions: 1-2 needs 100 + 5.76 to compare fractional parts of a whole,
  // and the column tool is access to that arithmetic, not a change of subject.
  "decimal-columns": ["decimals", "fractions"],
  "factor-tree": ["factors"],
  "dot-plot": ["statistics"],
  "box-plot": ["statistics"],
  "histogram-builder": ["statistics"],
  "bar-chart": [
    "statistics",
    "area",
    "volume",
    "surface-area",
    "ratios",
    "expressions",
    "inequalities",
    "number-line",
    "patterns",
    "exponents",
    "decimals",
  ],
};

/**
 * The topic a standard is about, straight out of the registry.
 *
 * `practices` (MPP.*) returns null on purpose: a mathematical-practice standard
 * says how students should reason, not which representation the mathematics
 * needs, so it can never be evidence that a tool is wrong. Lesson 10-1 is MPP.3
 * — "Math is Everywhere" — and it is legitimately free to mount whatever the
 * situation it discusses calls for.
 */
export function loadStandardTopics(root) {
  const registry = JSON.parse(
    readFileSync(join(root, "data/ccss-standards.json"), "utf8"),
  ).standards;
  const topics = new Map();
  for (const [code, entry] of Object.entries(registry || {})) {
    if (!entry?.topic || entry.topic === "practices") continue;
    topics.set(code.toUpperCase(), entry.topic);
  }
  return topics;
}

/** True when a tool's topics include the lesson's. Unknown either side = no
 *  opinion, reported as agreeing: this check catches a tool teaching
 *  demonstrably different mathematics, not a missing taxonomy row. */
export function topicAgrees(toolKey, standard, standardTopics) {
  const allowed = TOOL_TOPICS[toolKey];
  const topic = standardTopics.get(String(standard || "").toUpperCase());
  if (!allowed || !topic) return true;
  return allowed.includes(topic);
}

/* ── Fleet walk ────────────────────────────────────────────────────────────── */

// A lesson directory that is a VARIANT of a core lesson rather than a lesson in
// its own right: it inherits the parent's standard, title and interactive
// decision, so resolving a tool for it would report one mapping four times.
// `part2` is here for a stronger reason than inheritance — it renders no
// Learn-It tool at all, so every mapping the resolver produced for it was for a
// tool that is not on the page.
const VARIANT = /-(group[12]|catchup|part2)$/;

export function readFleet(root) {
  const dir = join(root, "lessons");
  const lessons = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = join(dir, entry.name, "config.json");
    if (!existsSync(path)) continue;
    let config;
    try {
      config = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      continue;
    }
    const variant = VARIANT.exec(entry.name);
    lessons.push({
      id: entry.name,
      parent: variant ? entry.name.replace(VARIANT, "") : null,
      variant: variant ? variant[1] : null,
      canonical: !variant,
      config,
      path,
    });
  }
  return lessons.sort((a, b) => a.id.localeCompare(b.id));
}
