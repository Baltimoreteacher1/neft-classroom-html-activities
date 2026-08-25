#!/usr/bin/env node
/* =============================================================================
 * validate-lesson-supports.mjs — gate for the lesson ADAPTATION layer.
 *
 * The adaptation layer's whole claim is that a support a teacher switches on
 * corresponds to behaviour that actually happens. Every check here defends one
 * way that claim can quietly stop being true:
 *
 *   1. Every catalogue support names capabilities the ENGINE really has —
 *      `profiles`/`tools` must exist in learning-supports.js's key lists, and
 *      `adapt` keys must exist in supports-schema.js's taxonomy AND be wired to
 *      a mode in supports-adaptations.js. A support that names a capability
 *      nobody implements is the "Extended time enabled" lie this project
 *      forbids, and it is invisible at runtime: the toggle renders, the label
 *      reads correctly, and nothing happens.
 *   2. Exactly one impact class per support, and no preset smuggles a
 *      MODIFICATION into a bundle a teacher reads as an accommodation.
 *   3. Supports attach to SEMANTIC element names, never CSS selectors — an
 *      adaptation anchored to a selector dies at the next layout change.
 *   4. The stored profile shape carries no curriculum content and no student
 *      field. Deltas only, so a curriculum correction flows through.
 *   5. The manifest carries variant/intrinsic data, which is what makes
 *      small-group inheritance and de-duplication possible at all.
 *   6. The authored override file is well-formed and references real lessons
 *      and real support keys.
 *
 * Self-tests its own detectors first: a gate that has stopped firing reports a
 * clean system, which is worse than no gate.
 * ========================================================================== */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildOverrides } from "../scripts/generate-support-overrides.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODULE_PATH = join(ROOT, "shared", "supports", "lesson-supports.js");
const LS_PATH = join(ROOT, "assets", "learning-supports", "learning-supports.js");
const SCHEMA_PATH = join(ROOT, "assets", "learning-supports", "supports-schema.js");
const ADAPT_PATH = join(ROOT, "assets", "learning-supports", "supports-adaptations.js");
const MANIFEST_PATH = join(ROOT, "assets", "learning-supports", "manifest.json");
const OVERRIDES_PATH = join(ROOT, "data", "lesson-support-overrides.json");
const REVIEW_PATH = join(ROOT, "data", "lesson-support-applicability-review.json");

/* The generated print surfaces. Each must stamp the lesson id, load the print
 * support layer, and emit at least one semantic slot — otherwise a teacher who
 * configured supports gets a packet that silently ignores them. */
const PRINT_GENERATORS = [
  ["scripts/generate-printable-lesson.mjs", "the printable lesson packet"],
  ["scripts/generate-worksheets.mjs", "practice worksheets"],
  ["scripts/generate-handout-html.mjs", "the student handout"],
  ["scripts/generate-notes.mjs", "the guided-notes packet"],
];

const errors = [];
const fail = (msg) => errors.push(msg);

/* -- capability inventories, read from the files that own them ------------- */

/** Names in a `const X = [ "a", "b" ]` declaration. */
function stringArrayConst(source, name) {
  const re = new RegExp(`(?:const|var)\\s+${name}\\s*=\\s*\\[([^\\]]*)\\]`);
  const m = re.exec(source);
  if (!m) return null;
  return Array.from(m[1].matchAll(/"([^"]+)"/g)).map((x) => x[1]);
}

function loadModule() {
  // The module is a UMD that assigns module.exports under Node.
  const src = readFileSync(MODULE_PATH, "utf8");
  const sandbox = { module: { exports: {} } };
  // eslint-disable-next-line no-new-func -- a gate that reads the real file is
  // the point; importing it would also work but would tie this gate to ESM
  // interop details rather than to the shipped bytes.
  new Function("module", "globalThis", src)(sandbox.module, {});
  return sandbox.module.exports;
}

function main() {
  for (const p of [
    MODULE_PATH,
    LS_PATH,
    SCHEMA_PATH,
    ADAPT_PATH,
    MANIFEST_PATH,
    OVERRIDES_PATH,
    REVIEW_PATH,
  ]) {
    if (!existsSync(p)) {
      console.error(`FAIL validate:lesson-supports — missing ${p}`);
      process.exit(1);
    }
  }

  const lsSource = readFileSync(LS_PATH, "utf8");
  const schemaSource = readFileSync(SCHEMA_PATH, "utf8");
  const adaptSource = readFileSync(ADAPT_PATH, "utf8");

  const profileKeys = stringArrayConst(lsSource, "PROFILE_KEYS");
  const toolKeys = stringArrayConst(lsSource, "TOOL_KEYS");
  if (!profileKeys || !toolKeys) {
    console.error(
      "FAIL validate:lesson-supports — could not read PROFILE_KEYS/TOOL_KEYS from learning-supports.js. " +
        "The inventory moved; update this gate rather than removing the check.",
    );
    process.exit(1);
  }

  // Taxonomy keys, harvested the same way validate-learning-supports.mjs does.
  const taxonomyKeys = new Set(
    Array.from(schemaSource.matchAll(/\{\s*key:\s*"([^"]+)"/g)).map((m) => m[1]),
  );
  // Adaptation keys that are actually wired to a behaviour mode.
  const wiredAdaptKeys = new Set();
  const modeBlock = /var MODE_KEYS = \{([\s\S]*?)\n  \};/.exec(adaptSource);
  if (modeBlock) {
    for (const m of modeBlock[1].matchAll(/"([^"]+)"/g)) wiredAdaptKeys.add(m[1]);
  }
  if (!wiredAdaptKeys.size) {
    fail("Could not read MODE_KEYS from supports-adaptations.js — the capability check is blind.");
  }

  const LS = loadModule();
  const manifestForReview = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));

  /* -- 1. capability reality ---------------------------------------------- */
  const seen = new Set();
  for (const s of LS.CATALOG) {
    if (seen.has(s.key)) fail(`Duplicate support key: ${s.key}`);
    seen.add(s.key);
    if (!s.label || !s.category || !s.contract)
      fail(`Support ${s.key} is missing label/category/contract`);
    for (const p of s.profiles || []) {
      if (!profileKeys.includes(p))
        fail(`Support ${s.key} names profile "${p}", which learning-supports.js does not define`);
    }
    for (const t of s.tools || []) {
      if (!toolKeys.includes(t))
        fail(`Support ${s.key} names tool "${t}", which learning-supports.js does not define`);
    }
    for (const a of s.adapt || []) {
      if (!taxonomyKeys.has(a))
        fail(`Support ${s.key} names adaptation key "${a}", absent from the supports taxonomy`);
      else if (!wiredAdaptKeys.has(a)) {
        fail(
          `Support ${s.key} names adaptation key "${a}", which no MODE_KEYS entry implements — it would change nothing`,
        );
      }
    }
    const caps = (s.profiles || []).length + (s.tools || []).length + (s.adapt || []).length;
    if (!caps)
      fail(`Support ${s.key} names no capability at all — it would be a control that does nothing`);

    /* -- 2. impact ---------------------------------------------------------- */
    if (!["access", "scaffold", "modification"].includes(s.impact)) {
      fail(`Support ${s.key} has impact "${s.impact}"; must be access | scaffold | modification`);
    }

    /* -- 3. semantic anchors ------------------------------------------------ */
    if (!Array.isArray(s.elements) || !s.elements.length)
      fail(`Support ${s.key} declares no elements`);
    for (const el of s.elements || []) {
      if (!LS.ELEMENTS.includes(el)) fail(`Support ${s.key} attaches to unknown element "${el}"`);
      if (/[.#[\]>:]/.test(el))
        fail(`Support ${s.key} attaches to a CSS selector ("${el}") instead of a semantic element`);
    }
    if (typeof s.requires !== "function") fail(`Support ${s.key} has no applicability rule`);
  }

  for (const p of LS.PRESETS) {
    if (!p.keys.length) fail(`Preset ${p.key} selects nothing`);
    for (const k of p.keys) {
      if (!LS.byKey[k]) fail(`Preset ${p.key} names unknown support "${k}"`);
      else if (LS.byKey[k].impact === "modification") {
        fail(
          `Preset ${p.key} bundles the MODIFICATION "${k}" — a teacher choosing a preset is choosing access`,
        );
      }
    }
  }

  /* -- 4. the stored profile carries no content and no student ------------- */
  const profile = LS.normalizeProfile(
    {
      keys: ["word-bank", "not-a-real-support"],
      lessonId: "5-3",
      title: "Determine the Area of Trapezoids",
      studentName: "should never survive",
      href: "/lessons/5-3/",
    },
    "5-3",
  );
  const allowed = new Set(["schemaVersion", "lessonId", "keys", "preset"]);
  for (const k of Object.keys(profile)) {
    if (!allowed.has(k)) fail(`Stored profile carries the extra field "${k}" — deltas only`);
  }
  if (profile.keys.includes("not-a-real-support"))
    fail("normalizeProfile kept an unknown support key");
  if (profile.keys.length !== 1) fail("normalizeProfile did not reduce to the one valid key");

  /* -- 5. manifest variant data -------------------------------------------- */
  const manifest = manifestForReview;
  const lessonIds = Object.keys(manifest);
  let variantCount = 0;
  for (const id of lessonIds) {
    const entry = manifest[id];
    if (!entry.variants || typeof entry.variants !== "object") {
      fail(`Manifest entry ${id} has no variants map — small-group inheritance cannot resolve`);
      continue;
    }
    for (const [name, v] of Object.entries(entry.variants)) {
      variantCount++;
      if (v.id !== `${id}-${name}`) fail(`Variant ${id}/${name} claims id "${v.id}"`);
      if (!LS.parseLessonId(v.id)) fail(`Variant id "${v.id}" is outside the canonical id space`);
      for (const k of v.intrinsic || []) {
        if (!LS.byKey[k])
          fail(`Variant ${v.id} claims intrinsic support "${k}", which is not in the catalogue`);
      }
    }
  }
  if (!variantCount) {
    fail(
      "The manifest records ZERO variants. Every generated small-group lesson would fall back to no supports.",
    );
  }

  /* -- 6a. MODALITY: every support declares what it does on every surface ---
   *
   * This is the check that makes the print surface trustworthy. A support with
   * no modality rule would be free to be active on screen and simply absent
   * from the printed packet — the exact divergence this feature exists to
   * remove — and nothing else in the build could see it. */
  for (const s of LS.CATALOG) {
    const m = LS.MODALITY[s.key];
    if (!m) {
      fail(
        `Support ${s.key} has no MODALITY rule — screen and print are free to disagree about it silently`,
      );
      continue;
    }
    for (const surface of LS.SURFACES) {
      const v = m[surface];
      if (!["active", "teacher-note", "n/a"].includes(v)) {
        fail(
          `Support ${s.key} declares modality "${v}" for ${surface}; must be active | teacher-note | n/a`,
        );
      }
    }
    // A teacher-note modality without the note is a promise with nothing behind it.
    const needsNote = LS.SURFACES.some((x) => m[x] === "teacher-note");
    if (needsNote && !m.note) {
      fail(`Support ${s.key} degrades to a teacher note on some surface but records no note text`);
    }
    if (m.screen !== "active") {
      fail(`Support ${s.key} is offered to teachers but is not active on screen`);
    }
  }
  for (const key of Object.keys(LS.MODALITY)) {
    if (!LS.byKey[key]) fail(`MODALITY names "${key}", which is not in the catalogue`);
  }

  /* -- 6b. every modification states its consequence in teacher language ---- */
  for (const s of LS.CATALOG) {
    if (s.impact !== "modification") continue;
    if (!LS.MODIFICATION_CONSEQUENCE[s.key]) {
      fail(
        `Modification ${s.key} has no recorded consequence — a teacher would not be told what changes`,
      );
    }
  }

  /* -- 6c. the derived override file matches the authored review ------------ */
  const review = JSON.parse(readFileSync(REVIEW_PATH, "utf8"));
  const derived = buildOverrides(review);
  const onDisk = JSON.parse(readFileSync(OVERRIDES_PATH, "utf8"));
  if (JSON.stringify(derived.lessons) !== JSON.stringify(onDisk.lessons)) {
    fail(
      "data/lesson-support-overrides.json is stale — run node scripts/generate-support-overrides.mjs. " +
        "A suppression that exists only in the derived file has no reason and no evidence behind it.",
    );
  }
  for (const r of review.reviews || []) {
    if (!manifestForReview[r.lessonId])
      fail(`Review names lesson "${r.lessonId}", which has no manifest entry`);
    if (!LS.byKey[r.support])
      fail(`Review names support "${r.support}", which is not in the catalogue`);
    if (!["suppress", "allow", "pin"].includes(r.decision)) {
      fail(`Review for ${r.lessonId}/${r.support} has decision "${r.decision}"`);
    }
    if (!r.reason || r.reason.length < 25) {
      fail(`Review for ${r.lessonId}/${r.support} has no substantive reason recorded`);
    }
    if (!Array.isArray(r.evidence) || !r.evidence.length) {
      fail(`Review for ${r.lessonId}/${r.support} cites no evidence`);
    }
    if (!["reviewed", "teacher-review"].includes(r.status)) {
      fail(`Review for ${r.lessonId}/${r.support} has status "${r.status}"`);
    }
    // Titles are not evidence. An earlier pass suppressed a support on 6-7 by
    // reading its title, and was wrong; this keeps that class of mistake out.
    if (r.evidence.every((e) => /^title[: ]/i.test(String(e)))) {
      fail(`Review for ${r.lessonId}/${r.support} cites only the lesson TITLE as evidence`);
    }
  }

  /* -- 6d. print surfaces are wired ---------------------------------------- */
  for (const [file, what] of PRINT_GENERATORS) {
    const src = readFileSync(join(ROOT, file), "utf8");
    if (!src.includes("data-ewl-supports-lesson")) {
      fail(
        `${file} does not stamp data-ewl-supports-lesson — ${what} would print without supports`,
      );
    }
    if (!src.includes("/shared/supports/print-supports.js")) {
      fail(`${file} does not load the print support layer — ${what} would print without supports`);
    }
    if (!src.includes("data-support-slot")) {
      fail(`${file} emits no semantic support slot — support blocks would have nowhere to attach`);
    }
  }
  const printLayer = readFileSync(join(ROOT, "shared", "supports", "print-supports.js"), "utf8");
  if (!printLayer.includes("resolveEffectiveSupports")) {
    fail(
      "print-supports.js does not call resolveEffectiveSupports — a second adaptation implementation for print is exactly what must not exist",
    );
  }
  for (const banned of ["applicableSupports(", "MODE_KEYS", "PROFILE_KEYS"]) {
    if (printLayer.includes(banned)) {
      fail(
        `print-supports.js reaches for ${banned} — it must consume the resolver's result, not re-derive it`,
      );
    }
  }

  /* -- 7. overrides -------------------------------------------------------- */
  const overrides = JSON.parse(readFileSync(OVERRIDES_PATH, "utf8"));
  for (const [id, o] of Object.entries(overrides.lessons || {})) {
    if (!manifest[id]) fail(`Override names lesson "${id}", which has no manifest entry`);
    for (const k of o.pin || [])
      if (!LS.byKey[k]) fail(`Override ${id} pins unknown support "${k}"`);
    for (const e of o.exclude || []) {
      const k = e.key || e;
      if (!LS.byKey[k]) fail(`Override ${id} excludes unknown support "${k}"`);
      if (!e.reason) fail(`Override ${id} excludes "${k}" with no reason recorded`);
    }
  }

  /* -- self-test: prove the detectors still fire --------------------------- */
  const selfTests = [
    ["unknown profile", () => !profileKeys.includes("no-such-profile")],
    ["unknown element rejected", () => !LS.ELEMENTS.includes(".lesson div")],
    ["unknown support key rejected", () => !LS.byKey["no-such-support"]],
    ["adapt inventory non-empty", () => wiredAdaptKeys.size > 0],
    ["taxonomy inventory non-empty", () => taxonomyKeys.size > 20],
    [
      "variant parses to its parent",
      () => LS.parentLessonId("5-3-group1") === "5-3" && LS.parentLessonId("nonsense") === null,
    ],
    [
      "future schema version reads as empty",
      () => LS.normalizeProfile({ keys: ["word-bank"] }, "5-3").schemaVersion === LS.SCHEMA_VERSION,
    ],
  ];
  for (const [name, fn] of selfTests) {
    let ok = false;
    try {
      ok = !!fn();
    } catch {
      ok = false;
    }
    if (!ok) fail(`Self-test failed: ${name} — this gate is no longer checking what it claims`);
  }

  if (errors.length) {
    console.error(`FAIL validate:lesson-supports — ${errors.length} problem(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  /* Surfaced on every build rather than gated. An unresolved decision is a
   * legitimate state — the alternative to flagging one is guessing — but it
   * should never be able to sit unnoticed for a term. */
  const awaiting = (review.reviews || []).filter((r) => r.status === "teacher-review");
  if (awaiting.length) {
    console.log(
      `  ${awaiting.length} instructional decision(s) awaiting teacher review: ` +
        awaiting.map((r) => `${r.lessonId}/${r.support}`).join(", ") +
        " — /teacher-tools/support-audit/?decision=teacher-review",
    );
  }
  console.log(
    `PASS validate:lesson-supports — ${LS.CATALOG.length} supports, ${LS.PRESETS.length} presets, ` +
      `${lessonIds.length} lessons, ${variantCount} variants, ${LS.NOT_IMPLEMENTED.length} documented non-capabilities, ` +
      `${(review.reviews || []).length} reviewed decisions (${awaiting.length} awaiting review).`,
  );
}

main();
