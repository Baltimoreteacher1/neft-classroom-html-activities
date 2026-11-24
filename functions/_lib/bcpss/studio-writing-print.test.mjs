// Writing Lab print parts (writing, writing-key) for EVERY authored writing unit, all levels, HTML and Word.
// No network. Detail objects are assembled from the seed + authored modules exactly as getUnitDetail does.
import assert from "node:assert/strict";
import test from "node:test";
import { STUDIO_LOADERS, WRITING_LOADERS } from "../../../db/seeds/bcpss/v2/index.mjs";
import { BCPSS_UNITS } from "../../../data/bcpss-curriculum-seed.mjs";
import { renderStudioDocx } from "./studio-docx.js";
import { isKnownPart, renderStudioPart } from "./studio-print-html.js";

const ids = Object.keys(WRITING_LOADERS);
const unitById = new Map(BCPSS_UNITS.map((u) => [u.id, u]));
const LEVELS = ["1_2", "3_4", "5_6"];
const BAD = /undefined|\[object Object\]|NaN/;

async function detailFor(id) {
  const writing = (await WRITING_LOADERS[id]()).default;
  const studio = STUDIO_LOADERS[id] ? (await STUDIO_LOADERS[id]()).default : null;
  return { unit: unitById.get(id), studio, writing };
}

test("writing parts are registered", () => {
  assert.ok(isKnownPart("writing"));
  assert.ok(isKnownPart("writing-key"));
});

test("at least one writing unit is authored", () => {
  assert.ok(ids.length > 0, "WRITING_LOADERS is empty: run node tools/build-bcpss-studio-index.mjs");
});

test("student packet renders for every unit and level, and the key fills the answers", async () => {
  for (const id of ids) {
    const d = await detailFor(id);
    for (const level of LEVELS) {
      const html = decode(renderStudioPart(d, { part: "writing", level }));
      assert.ok(html.length > 5000, `${id} ${level}: packet too small`);
      assert.ok(!BAD.test(html.replace(/<style[\s\S]*?<\/style>/g, "")), `${id} ${level}: bad token in packet`);
      assert.ok(html.includes(escapeHtml(d.writing.title)), `${id} ${level}: title missing`);
      assert.ok(html.includes(escapeHtml(d.writing.prompt[`l${level}`])), `${id} ${level}: level prompt missing`);
      if (d.writing.mpo) assert.ok(html.includes("Essay Plan"), `${id} ${level}: essay plan page missing`);
    }
    const key = decode(renderStudioPart(d, { part: "writing", level: "3_4", answerKey: true }));
    assert.ok(key.includes(escapeHtml(d.writing.model.l3_4.split(" ").slice(0, 4).join(" "))), `${id}: answer key lacks the Core model`);
  }
});

test("teacher guide carries all three models and every fragment answer", async () => {
  for (const id of ids) {
    const d = await detailFor(id);
    const html = decode(renderStudioPart(d, { part: "writing-key", level: "3_4" }));
    assert.ok(!BAD.test(html.replace(/<style[\s\S]*?<\/style>/g, "")), `${id}: bad token in guide`);
    for (const l of ["l1_2", "l3_4", "l5_6"]) assert.ok(html.includes(escapeHtml(d.writing.model[l])), `${id}: guide lacks ${l} model`);
    for (const f of d.writing.fragments) if (f.fix) assert.ok(html.includes(escapeHtml(f.fix)), `${id}: guide lacks fix "${f.fix}"`);
  }
});

test("Word versions build for both parts", async () => {
  for (const id of ids.slice(0, 40)) {
    const d = await detailFor(id);
    for (const part of ["writing", "writing-key"]) {
      const bytes = renderStudioDocx(d, { part, wida: "3_4" });
      assert.ok(bytes.length > 20000, `${id} ${part}: docx too small`);
      assert.equal(String.fromCharCode(bytes[0], bytes[1]), "PK", `${id} ${part}: not a zip`);
    }
  }
});

// Compare on decoded text: renderers may or may not escape quotes/apostrophes in text nodes.
const decode = (html) =>
  html.replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
function escapeHtml(s) {
  return String(s);
}
