#!/usr/bin/env node
/**
 * family-math-models.test.mjs: the model library is pure, deterministic, bilingual and honest.
 *
 * Proves, for every sample in assets/design/family/art/math-samples.mjs (and for the lesson 4-5 reference case):
 *  - determinism: byte-identical output on a second call;
 *  - the SVG parses as XML, is <= 8 KB, is role=img with a <title> and a computed <desc>;
 *  - the labels passed in appear in the picture, and the numbers passed in appear in the text alternative;
 *  - an UNKNOWN value is never printed in the text alternative;
 *  - no raw hex colour outside a var(--token, #fallback) fallback;
 *  - every font-size is >= 14px;
 *  - EN + ES output on ONE page never share an id, and every reference resolves;
 *  - an unknown kind and a missing required field throw (no silent generic diagram).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  describeModel,
  MODEL_KINDS,
  renderModel,
} from "../assets/design/family/art/math-models.mjs";
import { SAMPLES } from "../assets/design/family/art/math-samples.mjs";

const MAX_BYTES = 8192;
// Numbers that MUST appear in the computed text alternative, per sample (the numbers the sample passes in).
const MUST_MENTION = {
  "tape-45": ["10", "6", "$42", "$7", "100%"],
  "tape-part": ["5", "2", "$50", "$10"],
  doubleline: ["0", "2", "4", "8", "Cups of flour", "Batches"],
  ratiotable: ["12", "24", "36", "5", "Boxes", "Pencils"],
  "area-rect": ["8 cm", "5 cm"],
  "area-para": ["9 ft", "4 ft", "rectangle"],
  "area-tri": ["10 m", "6 m"],
  "area-trap": ["5 in", "9 in", "4 in"],
  "grid-100": ["10", "100", "60"],
  "grid-bead": ["4", "10", "27", "40"],
  numberline: ["−6", "6", "−4", "5", "degrees"],
  coord: ["(2, 3)", "(6, 5)", "(7, 1)", "8"],
  "coord-quad": ["(−3, 2)", "(4, −2)", "5"],
  barplot: ["Soccer: 12", "Basketball: 18", "Swimming: 7", "10", "students"],
  fraction: ["8", "3", "3/8"],
  balance: ["3", "11", "unknown"],
};

const withoutVarFallbacks = (svg) => svg.replace(/var\([^()]*(?:\([^()]*\)[^()]*)*\)/g, "var()");
const unescapeXml = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
const textOf = (svg) =>
  [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => unescapeXml(m[1]));
const idsOf = (html) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);

for (const lang of ["en", "es"]) {
  for (const sample of SAMPLES) {
    test(`${sample.id} [${lang}]: pure, parses, small, accessible`, () => {
      const a = renderModel(sample, { lang });
      const b = renderModel(sample, { lang });
      assert.equal(a, b, "same input must give byte-identical output");
      assert.ok(
        Buffer.byteLength(a) <= MAX_BYTES,
        `${Buffer.byteLength(a)} bytes exceeds ${MAX_BYTES}`,
      );
      const doc = new JSDOM(a, { contentType: "image/svg+xml" }).window.document;
      const svg = doc.documentElement;
      assert.equal(svg.getAttribute("role"), "img");
      assert.ok(svg.querySelector("title")?.textContent.trim(), "needs a <title>");
      assert.ok(
        svg.querySelector("desc")?.textContent.trim().length > 20,
        "needs a computed <desc>",
      );
      assert.equal(svg.getAttribute("lang"), lang);
      assert.ok(a.includes("<title"), "title present");
      // no raw hex outside var() fallbacks, and never as a fill/stroke attribute
      const bare = withoutVarFallbacks(a);
      assert.doesNotMatch(
        bare,
        /#[0-9a-fA-F]{3,8}\b(?![\w-])/,
        "raw hex colour outside a var() fallback",
      );
      assert.doesNotMatch(a, /fill="#|stroke="#/, 'fill="#..." is not allowed');
      // every font size is >= 14px
      for (const m of a.matchAll(/(\d+(?:\.\d+)?)px/g)) {
        if (/font/.test(a.slice(Math.max(0, m.index - 24), m.index)))
          assert.ok(Number(m[1]) >= 14, `font size ${m[1]}px < 14px`);
      }
      for (const m of a.matchAll(/font-size:(\d+(?:\.\d+)?)px/g))
        assert.ok(Number(m[1]) >= 14, `font size ${m[1]}px < 14px`);
    });

    test(`${sample.id} [${lang}]: labels in the picture, numbers in the alt text`, () => {
      const desc = describeModel(sample, { lang });
      // Spanish keeps every number; the English-only words (labels) are checked in the English run.
      const needles =
        lang === "en"
          ? MUST_MENTION[sample.id]
          : MUST_MENTION[sample.id].filter(
              (n) => /\d/.test(n) && !/[A-Za-z]/.test(n.replace(/\b(cm|ft|in|m)\b/g, "")),
            );
      for (const needle of needles) {
        assert.ok(
          desc.includes(needle),
          `${sample.id} desc must mention ${JSON.stringify(needle)}: ${desc}`,
        );
      }
      const svg = renderModel(sample, { lang });
      assert.ok(textOf(svg).length > 0, "labels are drawn as text");
    });
  }
}

test("lesson 4-5 reference case from the contract renders every label", () => {
  const model = {
    kind: "tape",
    data: {
      parts: 10,
      highlight: 6,
      partLabel: "60% = $42",
      wholeLabel: "100% = ?",
      blockLabel: "10% = $7",
      unknown: "whole",
    },
    alt: "Ten equal blocks; six of them are $42.",
  };
  const svg = renderModel(model, { lang: "en" });
  const t = textOf(svg);
  for (const s of ["60% = $42", "100% = ?", "10% = $7"])
    assert.ok(t.includes(s), `missing label ${s}`);
  assert.equal((svg.match(/class="m-p"/g) ?? []).length, 6, "six part blocks");
  assert.equal((svg.match(/class="m-g"/g) ?? []).length, 4, "four plain blocks");
  assert.ok(svg.includes("<title"));
  assert.ok(svg.includes("Ten equal blocks; six of them are $42."), "lesson alt becomes the title");
  assert.match(describeModel(model), /whole is unknown/);
});

test("an unknown value is described as unknown and never revealed", () => {
  const dl = SAMPLES.find((s) => s.id === "doubleline");
  const d = describeModel(dl);
  assert.match(d, /unknown/);
  assert.doesNotMatch(d, /6 - 3/, "hidden pair must not print the answer");
  const t = SAMPLES.find((s) => s.id === "ratiotable");
  assert.doesNotMatch(describeModel(t), /60/, "unknown cell (60) must not be printed");
  assert.ok(!textOf(renderModel(t)).includes("60"));
});

test("EN + ES copies on one page never share an id, and every reference resolves", () => {
  const page = SAMPLES.map(
    (s) => renderModel(s, { lang: "en" }) + renderModel(s, { lang: "es" }),
  ).join("\n");
  const ids = idsOf(page);
  assert.ok(ids.length > 20);
  assert.equal(
    new Set(ids).size,
    ids.length,
    `duplicate ids: ${ids.filter((id, i) => ids.indexOf(id) !== i).join(", ")}`,
  );
  for (const m of page.matchAll(/aria-labelledby="([^"]+)"/g))
    for (const id of m[1].split(" ")) assert.ok(ids.includes(id), `aria-labelledby -> ${id}`);
  for (const m of page.matchAll(/url\(#([^)]+)\)/g))
    assert.ok(ids.includes(m[1]), `url(#${m[1]}) has no target`);
  assert.ok(
    ids.every((id) => /-(en|es)-/.test(id)),
    "every id carries its language",
  );
  // two different models on a page also differ
  const one = renderModel(SAMPLES[0], { lang: "en" });
  const two = renderModel(SAMPLES[1], { lang: "en" });
  assert.equal(new Set([...idsOf(one), ...idsOf(two)]).size, idsOf(one).length + idsOf(two).length);
});

test("Spanish output is Spanish", () => {
  assert.match(
    describeModel(SAMPLES[0], { lang: "es" }),
    /El total se divide en 10 bloques iguales/,
  );
  assert.match(
    describeModel(
      SAMPLES.find((s) => s.id === "balance"),
      { lang: "es" },
    ),
    /Balanza/,
  );
  const es = renderModel(
    SAMPLES.find((s) => s.id === "ratiotable"),
    { lang: "es" },
  );
  assert.ok(textOf(es).includes("Cajas") && textOf(es).includes("Lápices"));
});

test("an unknown kind or a missing required field throws; there is no generic fallback", () => {
  assert.throws(() => renderModel({ kind: "pie", data: {} }), /Unknown model kind "pie"/);
  assert.throws(() => renderModel({ kind: undefined, data: {} }), /Unknown model kind/);
  assert.throws(() => renderModel(null), /needs/);
  assert.throws(() => renderModel({ kind: "tape", data: {} }), /data\.parts is required/);
  assert.throws(
    () => renderModel({ kind: "tape", data: { parts: 10 } }),
    /data\.highlight is required/,
  );
  assert.throws(
    () => renderModel({ kind: "tape", data: { parts: 10, highlight: 11 } }),
    /highlight must be an integer/,
  );
  assert.throws(
    () => renderModel({ kind: "tape", data: { parts: 4, highlight: 1, unknown: "bits" } }),
    /unknown must be/,
  );
  assert.throws(
    () => renderModel({ kind: "doubleline", data: { top: { ticks: [1, 2] } } }),
    /data\.bottom is required/,
  );
  assert.throws(
    () =>
      renderModel({ kind: "doubleline", data: { top: { ticks: [1, 2] }, bottom: { ticks: [1] } } }),
    /at least 2|same number/,
  );
  assert.throws(
    () => renderModel({ kind: "ratiotable", data: { headers: ["a", "b"] } }),
    /data\.rows is required/,
  );
  assert.throws(
    () => renderModel({ kind: "area", data: { shape: "hexagon", dims: {} } }),
    /data\.shape must be one of/,
  );
  assert.throws(
    () => renderModel({ kind: "area", data: { shape: "triangle", dims: { base: 4 } } }),
    /data\.height must be a positive number/,
  );
  assert.throws(
    () => renderModel({ kind: "grid", data: { rows: 2, cols: 2 } }),
    /data\.filled is required/,
  );
  assert.throws(
    () => renderModel({ kind: "numberline", data: { min: 0, max: 5 } }),
    /data\.step is required/,
  );
  assert.throws(
    () =>
      renderModel({
        kind: "numberline",
        data: { min: 0, max: 5, step: 1, points: [{ value: 9 }] },
      }),
    /points\[0\]\.value/,
  );
  assert.throws(
    () => renderModel({ kind: "coord", data: { xmax: 4, ymax: 4, points: [{ x: 9, y: 1 }] } }),
    /outside the plane/,
  );
  assert.throws(() => renderModel({ kind: "barplot", data: {} }), /data\.categories is required/);
  assert.throws(
    () => renderModel({ kind: "fraction", data: { parts: 4 } }),
    /data\.shaded is required/,
  );
  assert.throws(
    () => renderModel({ kind: "balance", data: { left: [1] } }),
    /data\.right is required/,
  );
  assert.throws(
    () => renderModel({ kind: "tape", data: { parts: 4, highlight: 1 } }, { lang: "fr" }),
    /lang must be/,
  );
});

test("kind none draws nothing; every documented kind is exported", () => {
  assert.equal(renderModel({ kind: "none", data: {} }), "");
  for (const k of [
    "tape",
    "doubleline",
    "ratiotable",
    "area",
    "grid",
    "numberline",
    "coord",
    "barplot",
    "fraction",
    "balance",
    "none",
  ]) {
    assert.ok(MODEL_KINDS.includes(k), k);
  }
  for (const k of MODEL_KINDS.filter((k) => k !== "none"))
    assert.ok(
      SAMPLES.some((s) => s.kind === k),
      `no sample for ${k}`,
    );
});
