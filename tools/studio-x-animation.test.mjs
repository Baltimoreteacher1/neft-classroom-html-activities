// Studio X wave 2 (W2): the `animation` block. The block stores a PRESET and plain values, never markup or a
// timeline; x/animations.js expands them into ordered frames (a still scene plus a caption in both languages), computed
// deterministically, so every renderer (player, printed filmstrip, Word list, validator, editor) agrees.
//   node --test tools/studio-x-animation.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import JSZip from "jszip";
import {
  ANIMATION_LIMITS,
  ANIMATION_PRESETS,
  BLOCK_TYPES,
  cleanAnimationParams,
  normalizeActivity,
} from "../access-practice-lab/src/studio/core/schema.js";
import { studentCopyFor } from "../access-practice-lab/src/studio/core/student-copy.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";
import { createStore } from "../access-practice-lab/src/studio/editor/store.js";
import { renderWorksheetHtml } from "../access-practice-lab/src/studio/print/worksheet.js";
import {
  checkAnimation,
  expandAnimation,
  explainAnimation,
} from "../access-practice-lab/src/studio/x/animations.js";
import { AN_TINT } from "../access-practice-lab/src/studio/x/animations-kit.js";
import { COLOR, contrastRatio } from "../access-practice-lab/src/studio/x/diagram-kit.js";
import { buildDocx } from "../functions/_lib/studio/docx.js";
import { makeWindow } from "./studio-player-helpers.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** One valid set of values per preset. */
const PARAMS = {
  process: {
    stages: [
      { label: "Evaporation", text: "The sun heats water." },
      { label: "Condensation", text: "Vapor cools into clouds." },
      { label: "Precipitation", text: "" },
    ],
  },
  timeline: {
    events: [
      { year: 1865, label: "War ends" },
      { year: 1776, label: "Declaration signed" },
      { year: 1803, label: "Louisiana Purchase" },
    ],
  },
  "word-build": {
    word: "unhappiness",
    meaning: "the state of not being happy",
    parts: [
      { kind: "prefix", text: "un", meaning: "not" },
      { kind: "root", text: "happy", meaning: "feeling joy" },
      { kind: "suffix", text: "ness", meaning: "state of being" },
    ],
  },
  "sentence-expand": {
    base: "The dog barked.",
    additions: [
      { adds: "because", text: "because it saw a cat" },
      { adds: "when", text: "when the mail came" },
    ],
  },
  "cause-effect": {
    pairs: [
      { cause: "Heavy rain", effect: "The river rose" },
      { cause: "The river rose", effect: "Fields flooded" },
    ],
  },
  "ratio-change": {
    a: { label: "cups of flour", value: 2 },
    b: { label: "cups of sugar", value: "3" },
    scales: [2, 3, "1/2"],
  },
  "geometry-dims": {
    shape: "prism",
    unit: "cm",
    dims: [
      { l: 4, w: 2, h: 3 },
      { l: 4, w: 2, h: 6 },
      { l: "2 1/2", w: 2, h: 6 },
    ],
  },
};
const FRACTIONS = { shape: "fraction", denominator: 4, numerators: [1, 3, 5] };
const block = (preset, params, over = {}) => ({
  id: "a1",
  type: "animation",
  preset,
  params,
  ...over,
});
const activity = (blocks, over = {}) =>
  normalizeActivity({ id: "act1", title: "Animations", kind: "worksheet", blocks, ...over });
const clean = (preset, params) => activity([block(preset, params)]).blocks[0];
const dom = (svg) => new JSDOM(svg, { contentType: "image/svg+xml" }).window.document;
const frames = (preset, params, lang = "en") => {
  const r = expandAnimation(clean(preset, params), { lang, suffix: "t" });
  assert.ok(r.ok, `${preset}: ${JSON.stringify(r.say)}`);
  return r.frames;
};
const refused = (preset, params) => expandAnimation(clean(preset, params));
const plain = (say) => {
  for (const l of ["en", "es"]) {
    assert.ok(say[l] && say[l].length > 12, `${l} message is a sentence: ${say[l]}`);
    assert.ok(
      !/undefined|null|NaN|\[object|\.\w+\[/.test(say[l]),
      `${l} message is plain: ${say[l]}`,
    );
  }
  assert.notEqual(say.en, say.es);
};
const qn = (n) => ({
  id: `q${n}`,
  type: "question",
  format: "choice",
  prompt: `Question ${n}?`,
  options: [
    { id: "a", text: "Yes" },
    { id: "b", text: "No" },
  ],
  answer: "a",
});

// ── schema ───────────────────────────────────────────────────────────────────

test("animation is a block type with seven presets, and every preset survives normalization twice", () => {
  assert.ok(BLOCK_TYPES.includes("animation"));
  assert.deepEqual([...ANIMATION_PRESETS].sort(), [
    "cause-effect",
    "geometry-dims",
    "process",
    "ratio-change",
    "sentence-expand",
    "timeline",
    "word-build",
  ]);
  for (const [preset, params] of Object.entries(PARAMS)) {
    const a = activity([block(preset, params)]);
    assert.equal(a.blocks.length, 1, preset);
    assert.equal(a.blocks[0].preset, preset);
    assert.deepEqual(normalizeActivity(a).blocks[0], a.blocks[0], `${preset}: idempotent`);
    assert.deepEqual(a.blocks[0].explanation, { en: "", es: "" });
    assert.deepEqual(a.blocks[0].alt, { en: "", es: "" });
    assert.equal(a.blocks[0].title, "");
  }
  assert.equal(clean("geometry-dims", FRACTIONS).params.shape, "fraction");
});

test("an unknown preset is rejected (the block is dropped), never kept", () => {
  for (const preset of ["spin", "__proto__", "", "PROCESS", null, undefined, 7])
    assert.equal(activity([block(preset, { stages: [] })]).blocks.length, 0, String(preset));
  assert.equal(cleanAnimationParams("spin", {}), null);
});

test("sizes are capped small", () => {
  const many = (n, make) => Array.from({ length: n }, (_, i) => make(i));
  const len = (preset, params, key) => clean(preset, params).params[key].length;
  assert.equal(len("process", { stages: many(30, (i) => ({ label: `s${i}` })) }, "stages"), 8);
  assert.equal(
    len("timeline", { events: many(30, (i) => ({ year: i, label: "e" })) }, "events"),
    8,
  );
  assert.equal(len("word-build", { parts: many(30, () => ({ text: "a" })) }, "parts"), 5);
  assert.equal(
    len("sentence-expand", { additions: many(30, () => ({ text: "a" })) }, "additions"),
    6,
  );
  assert.equal(
    len("cause-effect", { pairs: many(30, () => ({ cause: "a", effect: "b" })) }, "pairs"),
    6,
  );
  assert.equal(len("ratio-change", { scales: many(30, () => 2) }, "scales"), 6);
  assert.equal(len("geometry-dims", { dims: many(30, () => ({ l: 1, w: 1, h: 1 })) }, "dims"), 6);
  assert.equal(
    len(
      "geometry-dims",
      { shape: "fraction", denominator: 4, numerators: many(30, () => 1) },
      "numerators",
    ),
    6,
  );
  assert.equal(ANIMATION_LIMITS.stages, 8);
});

test("text is one plain line, extra fields are stripped, numbers are finite or null", () => {
  const b = activity([
    {
      ...block("process", {
        stages: [{ label: "A\u0000\u0007\nB\tC", text: "x", html: "<b>", svg: "<svg onload=1>" }],
        script: "alert(1)",
      }),
      svg: "<svg/>",
      title: "T\u0003itle\n",
      explanation: "Just English",
      alt: { en: "Alt\u0000", es: "Texto" },
    },
  ]).blocks[0];
  assert.equal(b.params.stages[0].label, "A B C");
  assert.deepEqual(Object.keys(b.params.stages[0]).sort(), ["label", "text"]);
  assert.deepEqual(Object.keys(b.params), ["stages"]);
  assert.equal(b.svg, undefined);
  assert.equal(b.title, "T itle");
  assert.deepEqual(b.explanation, { en: "Just English", es: "" });
  assert.deepEqual(b.alt, { en: "Alt", es: "Texto" });
  const ratio = (v) =>
    clean("ratio-change", { a: { label: "x", value: v }, b: { label: "y", value: 1 }, scales: [v] })
      .params;
  assert.equal(ratio("12").a.value, 12);
  assert.equal(ratio("1/2").a.value, "1/2");
  assert.equal(ratio("2  1/2").a.value, "2 1/2");
  for (const bad of [
    "",
    "abc",
    null,
    undefined,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    1e12,
    [],
    {},
    true,
    "<b>",
  ])
    assert.equal(ratio(bad).a.value, null, String(bad));
  assert.equal(
    clean("word-build", { parts: [{ kind: "oops", text: "x" }] }).params.parts[0].kind,
    "root",
  );
  assert.equal(
    clean("sentence-expand", { additions: [{ adds: "oops", text: "x" }] }).params.additions[0].adds,
    "detail",
  );
});

// ── frames ───────────────────────────────────────────────────────────────────

test("every preset expands to ordered frames with both captions, a real figure and a reader description", () => {
  const all = { ...PARAMS, "geometry-fraction": FRACTIONS };
  for (const [name, params] of Object.entries(all)) {
    const preset = name === "geometry-fraction" ? "geometry-dims" : name;
    for (const lang of ["en", "es"]) {
      const fs = frames(preset, params, lang);
      assert.ok(fs.length >= 2 && fs.length <= 9, `${name}: ${fs.length} frames`);
      for (const f of fs) {
        assert.ok(f.caption.en.length > 5 && f.caption.es.length > 5, `${name}: captions`);
        const svg = dom(f.svg).documentElement;
        assert.equal(svg.getAttribute("role"), "img", name);
        assert.ok(svg.querySelector("title")?.textContent.length > 5, `${name}: title`);
        assert.ok(!svg.querySelector("script,foreignObject,a"), `${name}: only drawing`);
        assert.ok(
          ![...svg.querySelectorAll("*")].some((e) =>
            [...e.attributes].some((a) => /^on/i.test(a.name)),
          ),
          name,
        );
        assert.ok(f.alt.length > 5, name);
      }
      const ids = fs.flatMap((f) => [...f.svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
      assert.equal(
        new Set(ids).size,
        ids.length,
        `${name}/${lang}: ids unique across the frames of one animation`,
      );
    }
    assert.notDeepEqual(
      frames(preset, params, "en")[0].caption.en,
      frames(preset, params, "en")[0].caption.es,
      `${name}: es differs`,
    );
  }
});

test("frames are deterministic: the same values always give identical frames", () => {
  for (const [preset, params] of Object.entries(PARAMS)) {
    const a = expandAnimation(clean(preset, params), { lang: "en", suffix: "x" });
    const b = expandAnimation(clean(preset, params), { lang: "en", suffix: "x" });
    assert.deepEqual(a, b, preset);
  }
});

test("two animations on one page never share an element id", () => {
  const one = expandAnimation(clean("ratio-change", PARAMS["ratio-change"]), { suffix: "a1" });
  const two = expandAnimation(clean("ratio-change", PARAMS["ratio-change"]), { suffix: "a2" });
  const ids = (r) =>
    r.frames.flatMap((f) => [...f.svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  assert.equal(ids(one).filter((id) => ids(two).includes(id)).length, 0);
});

test("process: one frame per stage, the highlight advances and earlier stages are ticked", () => {
  const fs = frames("process", PARAMS.process);
  assert.equal(fs.length, 3);
  assert.match(fs[0].caption.en, /^Stage 1 of 3: Evaporation\. The sun heats water\.$/);
  assert.match(fs[2].caption.es, /^Etapa 3 de 3: Precipitation\.$/);
  fs.forEach((f, i) => {
    const doc = dom(f.svg);
    assert.equal(
      doc.querySelectorAll('rect[stroke-width="3.5"]').length,
      1,
      "exactly one highlighted stage",
    );
    assert.equal(doc.querySelectorAll("path[stroke-linecap]").length, i, `${i} ticks`);
  });
  assert.equal(
    new Set(fs.map((f) => /viewBox="([^"]+)"/.exec(f.svg)[1])).size,
    1,
    "every frame has one size",
  );
});

test("timeline: events come oldest first and the figure follows their years", () => {
  const fs = frames("timeline", PARAMS.timeline);
  assert.equal(fs.length, 3);
  assert.match(fs[0].caption.en, /Event 1 of 3: 1776\. Declaration signed/);
  assert.match(fs[2].caption.en, /1865\. War ends/);
  const dots = (f) => dom(f.svg).querySelectorAll("rect[data-event]").length;
  assert.deepEqual([dots(fs[1]), dots(fs[2])], [2, 3]);
  assert.match(
    frames("timeline", {
      events: [
        { year: -500, label: "A" },
        { year: 10, label: "B" },
      ],
    })[0].caption.es,
    /500 a\. C\./,
  );
  const r = refused("timeline", {
    events: [
      { year: 5, label: "A" },
      { year: 5, label: "B" },
    ],
  });
  assert.equal(r.code, "one-year");
  plain(r.say);
});

test("word-build: the parts join into the teacher's word; meanings are only the teacher's", () => {
  const fs = frames("word-build", PARAMS["word-build"]);
  assert.equal(fs.length, 4);
  assert.match(fs[0].caption.en, /Prefix: .un-.\. Meaning: not\./);
  assert.match(fs[1].caption.es, /Raíz: .happy.\. Significado: feeling joy\./);
  assert.match(
    fs[3].caption.en,
    /un- \+ happy \+ -ness = unhappiness\. Meaning: the state of not being happy\./,
  );
  const noMeaning = frames("word-build", {
    word: "redo",
    parts: [
      { kind: "prefix", text: "re" },
      { kind: "root", text: "do" },
    ],
  });
  assert.ok(!/Meaning/.test(noMeaning[0].caption.en), "no meaning is invented");
});

test("sentence-expand: the sentence grows by exactly the typed phrase, punctuation kept", () => {
  const fs = frames("sentence-expand", PARAMS["sentence-expand"]);
  assert.equal(fs.length, 3);
  assert.match(fs[0].caption.en, /“The dog barked\.”$/);
  assert.match(
    fs[1].caption.en,
    /Add a reason \(because\): “because it saw a cat”\. Now the sentence says: “The dog barked because it saw a cat\.”$/,
  );
  assert.match(fs[2].caption.en, /“The dog barked because it saw a cat when the mail came\.”$/);
  assert.match(fs[1].caption.es, /Agrega una razón \(porque\)/);
  const marked = (f) =>
    [...dom(f.svg).querySelectorAll('tspan[font-weight="700"]')]
      .map((t) => t.textContent)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  assert.equal(marked(fs[0]), "", "the base sentence alone has nothing marked");
  assert.equal(marked(fs[1]), "because it saw a cat.", "only the newest phrase is marked");
  assert.equal(marked(fs[2]), "when the mail came.");
});

test("cause-effect: one more linked pair per frame, the newest highlighted", () => {
  const fs = frames("cause-effect", PARAMS["cause-effect"]);
  assert.equal(fs.length, 2);
  assert.match(fs[1].caption.en, /^Cause: The river rose\. Effect: Fields flooded\.$/);
  assert.equal(dom(fs[0].svg).querySelectorAll("polygon").length, 1);
  assert.equal(dom(fs[1].svg).querySelectorAll("polygon").length, 2);
});

test("ratio-change: exact rational math, frame by frame", () => {
  const r = expandAnimation(clean("ratio-change", PARAMS["ratio-change"]), { lang: "en" });
  assert.deepEqual(r.table.rows, [
    ["× 1", "2", "3"],
    ["× 2", "4", "6"],
    ["× 3", "6", "9"],
    ["× 0.5", "1", "1.5"],
  ]);
  assert.match(
    r.frames[3].caption.en,
    /Multiply both quantities by 0\.5: cups of flour = 1 and cups of sugar = 1\.5\./,
  );
  // decimals and fractions never go through floating point: 0.1 x 3 is 0.3, 1/3 x 3 is 1, 2 1/2 x 2 is 5.
  const exact = expandAnimation(
    clean("ratio-change", {
      a: { label: "a", value: 0.1 },
      b: { label: "b", value: "1/3" },
      scales: [3, 6],
    }),
    { lang: "en" },
  );
  assert.deepEqual(exact.table.rows.slice(1), [
    ["× 3", "0.3", "1"],
    ["× 6", "0.6", "2"],
  ]);
  const mixed = expandAnimation(
    clean("ratio-change", {
      a: { label: "a", value: "2 1/2" },
      b: { label: "b", value: 1 },
      scales: [2],
    }),
    { lang: "es" },
  );
  assert.deepEqual(mixed.table.rows[1], ["× 2", "5", "2"]);
  const comma = expandAnimation(
    clean("ratio-change", {
      a: { label: "a", value: 1.5 },
      b: { label: "b", value: 1 },
      scales: [2],
    }),
    { lang: "es" },
  );
  assert.equal(comma.table.rows[0][1], "1,5", "Spanish decimal comma");
  // the bars are drawn to one scale, so the same quantity is longer after it is multiplied
  const widths = (f) =>
    [...dom(f.svg).querySelectorAll("rect[stroke-width='2']")].map((e) =>
      Number(e.getAttribute("width")),
    );
  const [w0, w1] = [widths(r.frames[0]), widths(r.frames[1])];
  assert.ok(
    Math.abs(w1[0] / w0[0] - 2) < 0.01 && Math.abs(w1[1] / w0[1] - 2) < 0.01,
    "×2 doubles each bar",
  );
  assert.ok(Math.abs(w0[1] / w0[0] - 1.5) < 0.01, "3 is 1.5 times 2");
});

test("ratio-change: non-positive, non-numeric and missing input is refused in plain words", () => {
  const base = { a: { label: "flour", value: 2 }, b: { label: "sugar", value: 3 }, scales: [2] };
  const cases = {
    "zero quantity": { ...base, a: { label: "flour", value: 0 } },
    "negative quantity": { ...base, b: { label: "sugar", value: -3 } },
    "blank quantity": { ...base, a: { label: "flour", value: "" } },
    "text quantity": { ...base, a: { label: "flour", value: "lots" } },
    "zero multiplier": { ...base, scales: [0] },
    "negative multiplier": { ...base, scales: [2, -1] },
    "blank multiplier": { ...base, scales: [""] },
    "no multipliers": { ...base, scales: [] },
    "no name": { ...base, a: { label: "", value: 2 } },
    "too far apart": { ...base, a: { label: "flour", value: 1 }, scales: [100000] },
  };
  for (const [name, params] of Object.entries(cases)) {
    const r = refused("ratio-change", params);
    assert.equal(r.ok, false, name);
    plain(r.say);
    assert.equal(checkAnimation(clean("ratio-change", params))?.code, r.code, name);
  }
  assert.equal(
    refused("ratio-change", { ...base, a: { label: "flour", value: 0 } }).code,
    "not-positive",
  );
  assert.match(
    refused("ratio-change", { ...base, scales: [0] }).say.en,
    /Multiplier 1 must be a number greater than 0/,
  );
});

test("geometry-dims: exact volume in every frame, units cubed, changes named", () => {
  const r = expandAnimation(clean("geometry-dims", PARAMS["geometry-dims"]), { lang: "en" });
  assert.match(
    r.frames[0].caption.en,
    /^Length 4 cm, width 2 cm, height 3 cm\. Volume = 4 × 2 × 3 = 24 cm³\.$/,
  );
  assert.match(r.frames[1].caption.en, /^Changed: height 3 → 6\./);
  assert.match(r.frames[1].caption.en, /Volume = 4 × 2 × 6 = 48 cm³\.$/);
  assert.match(r.frames[2].caption.en, /Changed: length 4 → 2\.5\./);
  assert.match(
    r.frames[2].caption.en,
    /Volume = 2\.5 × 2 × 6 = 30 cm³\.$/,
    "2 1/2 x 2 x 6 is exactly 30",
  );
  assert.deepEqual(
    r.table.rows.map((x) => x.at(-1)),
    ["24 cm³", "48 cm³", "30 cm³"],
  );
  const es = expandAnimation(clean("geometry-dims", PARAMS["geometry-dims"]), { lang: "es" });
  assert.match(es.frames[1].caption.es, /^Cambió: alto 3 → 6\./);
  const noUnit = frames("geometry-dims", {
    shape: "prism",
    unit: "",
    dims: [
      { l: 1, w: 1, h: 1 },
      { l: 2, w: 1, h: 1 },
    ],
  });
  assert.match(noUnit[1].caption.en, /= 2 cubic units\.$/);
  assert.match(noUnit[1].caption.es, /= 2 unidades cúbicas\.$/);
  // three eighths x two x three = nine eighths: exact, not 1.125 rounded
  const tiny = frames("geometry-dims", {
    shape: "prism",
    unit: "in",
    dims: [
      { l: "1/8", w: "3/4", h: 2 },
      { l: "3/8", w: 2, h: 3 },
    ],
  });
  assert.match(tiny[1].caption.en, /Volume = 0\.375 × 2 × 3 = 2\.25 in³\.$/);
  const figure = dom(r.frames[1].svg);
  assert.ok(figure.querySelector("polygon[data-face]"), "the real prism figure");
});

test("geometry-dims fraction model: the numerators go through the fraction bar", () => {
  const fs = frames("geometry-dims", FRACTIONS);
  assert.equal(fs.length, 3);
  assert.match(fs[0].caption.en, /^1\/4 of a whole: 1 of 4 equal parts are shaded\.$/);
  assert.match(
    fs[2].caption.en,
    /5\/4 of a whole: 5 of 4 equal parts are shaded\. That is 1 1\/4 wholes\.$/,
  );
  const shaded = (f) => dom(f.svg).querySelectorAll('rect[data-cell="shaded"]').length;
  assert.deepEqual(fs.map(shaded), [1, 3, 5]);
});

test("geometry-dims: bad numbers are refused in plain words", () => {
  const bad = {
    "zero edge": {
      shape: "prism",
      unit: "",
      dims: [
        { l: 0, w: 1, h: 1 },
        { l: 1, w: 1, h: 1 },
      ],
    },
    "blank edge": {
      shape: "prism",
      unit: "",
      dims: [
        { l: 1, w: null, h: 1 },
        { l: 1, w: 1, h: 1 },
      ],
    },
    "one set": { shape: "prism", unit: "", dims: [{ l: 1, w: 1, h: 1 }] },
    "too uneven": {
      shape: "prism",
      unit: "",
      dims: [
        { l: 1, w: 1, h: 1 },
        { l: 100, w: 1, h: 1 },
      ],
    },
    "bad unit": {
      shape: "prism",
      unit: "<b>",
      dims: [
        { l: 1, w: 1, h: 1 },
        { l: 1, w: 1, h: 2 },
      ],
    },
    "denominator 0": { shape: "fraction", denominator: 0, numerators: [1, 2] },
    "denominator 17": { shape: "fraction", denominator: 17, numerators: [1, 2] },
    "numerator too big": { shape: "fraction", denominator: 4, numerators: [1, 17] },
    "fraction numerator": { shape: "fraction", denominator: 4, numerators: [1, 1.5] },
    "one numerator": { shape: "fraction", denominator: 4, numerators: [1] },
  };
  for (const [name, params] of Object.entries(bad)) {
    const r = refused("geometry-dims", params);
    assert.equal(r.ok, false, name);
    plain(r.say);
  }
});

test("text presets refuse missing words and too few steps in plain words", () => {
  const bad = [
    ["process", { stages: [{ label: "Only one" }] }],
    ["process", { stages: [{ label: "A" }, { label: "" }] }],
    [
      "timeline",
      {
        events: [
          { year: null, label: "A" },
          { year: 1, label: "B" },
        ],
      },
    ],
    [
      "timeline",
      {
        events: [
          { year: 1, label: "" },
          { year: 2, label: "B" },
        ],
      },
    ],
    ["word-build", { word: "", parts: [{ text: "a" }, { text: "b" }] }],
    ["word-build", { word: "ab", parts: [{ text: "a" }] }],
    ["word-build", { word: "ab", parts: [{ text: "a" }, { text: "" }] }],
    ["sentence-expand", { base: "", additions: [{ text: "x" }] }],
    ["sentence-expand", { base: "Hi.", additions: [] }],
    ["sentence-expand", { base: "Hi.", additions: [{ text: "" }] }],
    ["cause-effect", { pairs: [{ cause: "a", effect: "b" }] }],
    [
      "cause-effect",
      {
        pairs: [
          { cause: "a", effect: "" },
          { cause: "a", effect: "b" },
        ],
      },
    ],
  ];
  for (const [preset, params] of bad) {
    const r = refused(preset, params);
    assert.equal(r.ok, false, `${preset} ${JSON.stringify(params)}`);
    plain(r.say);
  }
  assert.equal(expandAnimation({ preset: "spin", params: {} }).code, "unknown-preset");
});

test("scene colors: ink on the highlight tint passes WCAG AA", () => {
  assert.ok(contrastRatio(COLOR.ink, AN_TINT) >= 7);
  assert.ok(contrastRatio(COLOR.blue, "#ffffff") >= 4.5);
});

test("hostile text stays text in every figure", () => {
  const evil = '<img src=x onerror=alert(1)> & "q"';
  const r = expandAnimation(
    clean("process", {
      stages: [
        { label: evil, text: evil },
        { label: "b", text: "" },
      ],
    }),
    { lang: "en" },
  );
  assert.ok(r.ok);
  const doc = dom(r.frames[0].svg);
  assert.equal(doc.querySelectorAll("img").length, 0);
  assert.ok(doc.documentElement.textContent.includes("<img"));
});

// ── validate, student copy ───────────────────────────────────────────────────

test("validateActivity: a valid animation passes; an invalid one is an error in plain words with the block id", () => {
  const ok = validateActivity(activity([block("process", PARAMS.process), qn(1)]));
  assert.equal(ok.errors.filter((e) => e.code === "bad-animation").length, 0);
  const a = activity([
    block("ratio-change", { ...PARAMS["ratio-change"], scales: [0] }, { id: "an1" }),
    qn(1),
  ]);
  const bad = validateActivity(a).errors.find((e) => e.code === "bad-animation");
  assert.ok(bad, "reported");
  assert.equal(bad.blockId ?? bad.id ?? bad.block, "an1");
  assert.match(
    bad.message,
    /^An animation cannot be played yet\. Multiplier 1 must be a number greater than 0\.$/,
  );
  assert.equal(explainAnimation({ say: { en: "x", es: "y" } }).es, "y");
});

test("student copy keeps the animation untouched and exposes nothing teacher-only", () => {
  const a = activity([
    block("process", PARAMS.process),
    qn(1),
    { id: "n1", type: "note", text: "secret" },
  ]);
  for (const kind of ["worksheet", "interactive"]) {
    const copy = studentCopyFor({ ...a, kind, notes: { teacher: "tea", misconceptions: ["m"] } });
    const an = copy.blocks.find((b) => b.type === "animation");
    assert.deepEqual(an, a.blocks[0]);
    assert.ok(!JSON.stringify(copy).includes("secret"));
  }
});

// ── player (jsdom: structure; the e2e drives Play/Pause with a real clock) ───

const mountAnimations = (blocks, opts = {}) => {
  const w = makeWindow();
  w.mount(activity(blocks, { supports: { spanish: true } }), opts);
  return w;
};

test("player: figure, live caption, real buttons, counter and the steps as a numbered list", () => {
  const w = mountAnimations(
    [
      block("process", PARAMS.process, {
        title: "Water cycle",
        explanation: { en: "Watch the water move.", es: "Mira cómo se mueve el agua." },
      }),
    ],
    { lang: "en" },
  );
  const root = w.$(".sp-block-animation section.sp-anim");
  assert.ok(root, "rendered");
  assert.equal(root.querySelector("h3").textContent, "Water cycle");
  assert.match(root.querySelector("p.sp-anim-explain").textContent, /Watch the water move/);
  const svg = root.querySelector(".sp-anim-art svg");
  assert.equal(svg.getAttribute("role"), "img");
  const live = root.querySelector(".sp-anim-caption");
  assert.equal(live.getAttribute("aria-live"), "polite");
  assert.equal(live.getAttribute("role"), "status");
  assert.match(live.textContent, /Stage 1 of 3: Evaporation/);
  const names = [...root.querySelectorAll(".sp-anim-controls button")].map((b) =>
    b.textContent.trim(),
  );
  assert.deepEqual(names, ["Replay", "Back", "Play", "Next"]);
  assert.ok(
    root.querySelector(".sp-anim-controls button:disabled"),
    "Back is disabled on the first frame",
  );
  assert.equal(root.querySelector(".sp-anim-count").textContent, "Step 1 of 3");
  const items = [...root.querySelectorAll("details.sp-anim-steps ol li")].map((l) => l.textContent);
  assert.equal(items.length, 3);
  assert.match(items[2], /Precipitation/);
  assert.equal(w.$$("script,foreignObject").length, 0);
});

test("player: Next and Back step through the frames; nothing advances by itself", () => {
  const w = mountAnimations([block("process", PARAMS.process)], { lang: "en" });
  const btn = (name) =>
    [...w.$$(".sp-anim-controls button")].find((b) => b.textContent.trim() === name);
  const caption = () => w.$(".sp-anim-caption").textContent;
  btn("Next").click();
  assert.match(caption(), /Stage 2 of 3/);
  assert.equal(w.$(".sp-anim-count").textContent, "Step 2 of 3");
  btn("Next").click();
  assert.ok(btn("Next").disabled, "Next is disabled on the last frame");
  assert.match(caption(), /Stage 3 of 3/);
  btn("Back").click();
  assert.match(caption(), /Stage 2 of 3/);
  btn("Replay").click();
  assert.match(caption(), /Stage 1 of 3/);
  assert.equal(
    btn("Pause").textContent.trim(),
    "Pause",
    "Replay starts playing, so Pause is offered",
  );
  btn("Pause").click();
  assert.equal(btn("Play").textContent.trim(), "Play", "Pause stops it, so Play is offered again");
  assert.match(caption(), /Stage 1 of 3/);
});

test("player: Spanish and bilingual modes; an invalid animation shows a calm note", () => {
  const es = mountAnimations([block("process", PARAMS.process)], { lang: "es" });
  assert.match(es.$(".sp-anim-caption").textContent, /Etapa 1 de 3/);
  assert.deepEqual(
    [...es.$$(".sp-anim-controls button")].map((b) => b.textContent.trim()),
    ["Repetir", "Atrás", "Reproducir", "Siguiente"],
  );
  assert.equal(es.$(".sp-anim-count").textContent.trim(), "Paso 1 de 3");
  const bi = mountAnimations(
    [block("process", PARAMS.process, { explanation: { en: "One", es: "Uno" } })],
    { lang: "bi" },
  );
  assert.equal(bi.$(".sp-anim-caption .sp-es").textContent.slice(0, 8), "Etapa 1 ");
  assert.equal(bi.$("p.sp-es.sp-anim-explain").textContent, "Uno");
  const bad = mountAnimations([block("ratio-change", { ...PARAMS["ratio-change"], scales: [0] })]);
  assert.ok(!bad.$(".sp-anim"));
  assert.match(bad.$(".sp-block-animation").textContent, /could not be shown/);
});

test("player: the data table of a number preset is a real table", () => {
  const w = mountAnimations([block("ratio-change", PARAMS["ratio-change"])], { lang: "en" });
  const cells = [...w.$$(".sp-anim-steps tbody td")].map((c) => c.textContent);
  assert.deepEqual(cells.slice(0, 6), ["× 1", "2", "3", "× 2", "4", "6"]);
  assert.ok(w.$('.sp-anim-steps th[scope="col"]'));
});

// ── print ────────────────────────────────────────────────────────────────────

test("printed worksheet: a numbered filmstrip, one figure and caption per frame, only on the student sheet", () => {
  const a = activity([
    block("ratio-change", PARAMS["ratio-change"], { title: "Scaling a recipe" }),
    qn(1),
  ]);
  const html = renderWorksheetHtml(a, { part: "student", lang: "en" });
  const doc = new JSDOM(html).window.document;
  const li = [...doc.querySelectorAll("section.anim li.anim-frame")];
  assert.equal(li.length, 4);
  li.forEach((f, i) => {
    assert.equal(f.querySelectorAll("svg").length, 1);
    assert.equal(f.querySelector(".anim-no").textContent, `${i + 1}.`);
    assert.ok(f.querySelector(".anim-words").textContent.length > 20);
  });
  assert.equal(doc.querySelector("section.anim h2").textContent, "Scaling a recipe");
  assert.match(html, /li\.anim-frame\{[^}]*break-inside:avoid/);
  assert.equal(
    doc.querySelectorAll("section.anim table.datatable").length,
    1,
    "the data as a table",
  );
  const key = renderWorksheetHtml(a, { part: "key", lang: "en" });
  assert.ok(
    !/anim-frame"/.test(key.replace(/<style>[\s\S]*?<\/style>/, "")),
    "no filmstrip on the teacher copy",
  );
  const bi = new JSDOM(renderWorksheetHtml(a, { part: "student", lang: "bi" })).window.document;
  assert.ok(bi.querySelector("li.anim-frame .es"), "bilingual caption");
});

test("printed worksheet: an invalid animation prints a placeholder, not a broken figure", () => {
  const html = renderWorksheetHtml(
    activity([block("ratio-change", { ...PARAMS["ratio-change"], scales: [0] })]),
    { part: "student", lang: "en" },
  );
  assert.match(html, /Animation could not be built/);
  assert.ok(!/<li class="anim-frame/.test(html));
});

// ── Word ─────────────────────────────────────────────────────────────────────

test("Word: title, explanation, an editable numbered list of the frames, a real table and alt text; no picture", async () => {
  const a = activity([
    block("ratio-change", PARAMS["ratio-change"], {
      title: "Scaling",
      explanation: { en: "Both numbers grow together.", es: "" },
      alt: { en: "A ratio scaled four ways", es: "" },
    }),
    block("process", PARAMS.process, { id: "a2" }),
    qn(1),
  ]);
  const zip = await JSZip.loadAsync(await buildDocx(a, { part: "student", lang: "en" }));
  const xml = await zip.file("word/document.xml").async("string");
  const text = [...xml.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(" ");
  assert.match(text, /Scaling/);
  assert.match(text, /Animation \(the steps are listed below/);
  assert.match(text, /A ratio scaled four ways/);
  assert.match(text, /Both numbers grow together/);
  assert.match(text, /Start with cups of flour = 2 and cups of sugar = 3/);
  assert.match(text, /Stage 3 of 3: Precipitation/);
  assert.ok(/<w:tbl>/.test(xml));
  assert.ok(!/<w:drawing>/.test(xml), "no picture is embedded");
  const numbering = await zip.file("word/numbering.xml").async("string");
  assert.match(numbering, /<w:numFmt w:val="decimal"/);
  const listed = [
    ...xml.matchAll(/<w:numPr><w:ilvl w:val="0"\/><w:numId w:val="(\d+)"\/><\/w:numPr>/g),
  ].map((m) => m[1]);
  const frameIds = new Set(listed);
  assert.ok(frameIds.size >= 3, `two animations restart their numbering (${[...frameIds]})`);
  const key = await JSZip.loadAsync(await buildDocx(a, { part: "key", lang: "en" }));
  assert.ok(
    !/Stage 1 of 3/.test(await key.file("word/document.xml").async("string")),
    "not on the key",
  );
});

// ── bundle ───────────────────────────────────────────────────────────────────

test("the committed player bundle is current and carries the animation block", () => {
  const r = spawnSync("node", ["tools/build-studio-player.mjs", "--check"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stderr);
  const js = spawnSync(
    "grep",
    ["-c", "function animationBlock", "access-practice-lab/player/studio-player.js"],
    { cwd: ROOT, encoding: "utf8" },
  );
  assert.equal(js.stdout.trim(), "1");
});

// ── editor (jsdom) ───────────────────────────────────────────────────────────

async function editorFor(preset, params, { es = false } = {}) {
  const win = new JSDOM("<!doctype html><body></body>", { pretendToBeVisual: true }).window;
  Object.assign(globalThis, { document: win.document, Node: win.Node, DOMParser: win.DOMParser });
  const { animationBlockEditor, blankAnimationFields } = await import(
    "../access-practice-lab/src/studio/editor/animation-editor.js"
  );
  const start = params ? { preset, params } : blankAnimationFields(preset);
  const store = createStore(activity([block(start.preset, start.params, { id: "an1" })]));
  const S = (en, esText) => (es ? esText : en);
  const el = animationBlockEditor(store.get().blocks[0], { store, S });
  win.document.body.append(el);
  const type = (input, value) => {
    input.value = value;
    input.dispatchEvent(new win.Event("input", { bubbles: true }));
  };
  const byLabel = (text) =>
    [...el.querySelectorAll("input,select,textarea")].find(
      (c) => (c.getAttribute("aria-label") || c.labels?.[0]?.textContent) === text,
    );
  return { win, store, el, type, byLabel, block: () => store.get().blocks[0] };
}

test("editor: every preset starts from valid blank fields; text presets are empty, number presets hold numbers", async () => {
  const { blankAnimationFields } = await import(
    "../access-practice-lab/src/studio/editor/animation-editor.js"
  );
  for (const preset of ANIMATION_PRESETS) {
    const f = blankAnimationFields(preset);
    const a = activity([{ id: "x", type: "animation", ...f }]);
    assert.equal(a.blocks.length, 1, preset);
    assert.deepEqual(normalizeActivity(a).blocks[0], a.blocks[0], preset);
  }
  assert.equal(
    checkAnimation({ id: "x", type: "animation", ...blankAnimationFields("process") }),
    null,
    "process works at once",
  );
  assert.equal(
    checkAnimation({ id: "x", type: "animation", ...blankAnimationFields("geometry-dims") }),
    null,
    "geometry works at once",
  );
  assert.ok(
    checkAnimation({ id: "x", type: "animation", ...blankAnimationFields("cause-effect") }),
    "nothing is invented for text presets",
  );
  assert.ok(checkAnimation({ id: "x", type: "animation", ...blankAnimationFields("word-build") }));
});

test("editor: typing lands in the store as plain values, add/remove keep focus, a bad value is explained", async () => {
  const e = await editorFor("process");
  assert.equal(e.el.querySelector("p.st-warn").hidden, true, "a working default shows no problem");
  e.type(e.byLabel("Step 1: Step name"), "Heat");
  assert.equal(e.block().params.stages[0].label, "Heat");
  e.byLabel("Step 1: Step name").dispatchEvent(new e.win.Event("input", { bubbles: true }));
  [...e.el.querySelectorAll("button")].find((b) => b.textContent === "Add a step").click();
  assert.equal(e.block().params.stages.length, 4);
  assert.equal(e.win.document.activeElement.getAttribute("aria-label"), "Step 4: Step name");
  e.el.querySelector('button[aria-label="Remove Step 4"]').click();
  assert.equal(e.block().params.stages.length, 3);
  e.type(e.byLabel("Step 2: Step name"), "");
  await new Promise((r) => setTimeout(r, 600));
  const note = e.el.querySelector("p.st-warn");
  assert.equal(note.hidden, false);
  assert.match(note.textContent, /Stage 2 needs a name/);
  assert.deepEqual(
    Object.keys(e.block()).sort(),
    ["alt", "explanation", "id", "params", "preset", "title", "type"],
    "no picture, no markup",
  );
});

test("editor: preset switch, ratio numbers, Spanish wording", async () => {
  const e = await editorFor("ratio-change", PARAMS["ratio-change"]);
  e.type(e.byLabel("Multiplier 1: Multiply both by"), "1/2");
  assert.equal(e.block().params.scales[0], "1/2");
  e.type(e.byLabel("First quantity: number"), "0");
  await new Promise((r) => setTimeout(r, 600));
  assert.match(
    e.el.querySelector("p.st-warn").textContent,
    /The first number \(cups of flour\) must be a number greater than 0/,
  );
  const sel = e.byLabel("What does this animation explain?");
  sel.value = "geometry-dims";
  sel.dispatchEvent(new e.win.Event("change", { bubbles: true }));
  assert.equal(e.block().preset, "geometry-dims");
  assert.equal(e.block().params.shape, "prism");
  const es = await editorFor("process", undefined, { es: true });
  assert.ok(es.byLabel("Paso 1: Nombre del paso"));
  assert.match(es.el.textContent, /Escriba los valores/);
});
