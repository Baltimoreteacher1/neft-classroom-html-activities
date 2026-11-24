// Writing Lab customization (shared/bcpss/writing-custom.js): the one format the page and the printed packets share.
import assert from "node:assert/strict";
import test from "node:test";
import { BCPSS_UNITS } from "../data/bcpss-curriculum-seed.mjs";
import { STUDIO_LOADERS, WRITING_LOADERS } from "../db/seeds/bcpss/v2/index.mjs";
import { renderStudioDocx } from "../functions/_lib/bcpss/studio-docx.js";
import { renderStudioPart } from "../functions/_lib/bcpss/studio-print-html.js";
import {
  applyCustom,
  decodeCustom,
  encodeCustom,
  sanitizeCustom,
} from "../shared/bcpss/writing-custom.js";

const unitId = "g4-sci-u2";
const load = async () => ({
  unit: BCPSS_UNITS.find((u) => u.id === unitId),
  studio: (await STUDIO_LOADERS[unitId]()).default,
  writing: (await WRITING_LOADERS[unitId]()).default,
});

test("round-trips through the URL code, Spanish and symbols included", () => {
  const c = {
    title: "Señales del faro",
    note: "Use 3 details → then revise.",
    transitions: ["First,", "Después,"],
    words: ["foghorn"],
  };
  const back = decodeCustom(encodeCustom(c));
  assert.equal(back.title, "Señales del faro");
  assert.equal(back.note, "Use 3 details → then revise.");
  assert.deepEqual(back.transitions, ["First,", "Después,"]);
  assert.match(encodeCustom(c), /^[A-Za-z0-9_-]+$/);
});

test("sanitizes: unknown keys, control characters, lengths, duplicates, empty input", () => {
  const c = sanitizeCustom({
    evil: "<script>",
    title: `\u0000Lighthouse\u0007 ${"x".repeat(200)}`,
    prompt: { l1_2: "  Draw it.  ", l9: "nope" },
    words: ["crest", "Crest", "", 5, ...Array.from({ length: 40 }, (_, i) => `w${i}`)],
  });
  assert.equal(c.evil, undefined);
  assert.ok(c.title.startsWith("Lighthouse ") && c.title.length <= 60, c.title);
  assert.deepEqual(c.prompt, { l1_2: "Draw it." });
  assert.equal(c.words.length, 20);
  assert.equal(c.words.filter((w) => w.toLowerCase() === "crest").length, 1);
  assert.equal(sanitizeCustom({}), null);
  assert.equal(sanitizeCustom("x"), null);
  assert.equal(decodeCustom("not base64 !!"), null);
  assert.equal(decodeCustom("e30"), null); // "{}" carries nothing
  assert.equal(decodeCustom("A".repeat(7000)), null);
});

test("applies without mutating the authored content", async () => {
  const d = await load();
  const before = JSON.stringify(d.writing);
  const w = applyCustom(d.writing, {
    prompt: { l3_4: "Explain the foghorn." },
    starters: ["Have you ever seen a lighthouse?"],
  });
  assert.equal(JSON.stringify(d.writing), before);
  assert.equal(w.prompt.l3_4, "Explain the foghorn.");
  assert.equal(w.prompt.l1_2, d.writing.prompt.l1_2);
  assert.deepEqual(w.spo.starters, [{ type: "teacher", text: "Have you ever seen a lighthouse?" }]);
  assert.equal(applyCustom(d.writing, null), d.writing);
});

test("a customized packet prints the teacher's task, note, starters and words (HTML and Word)", async () => {
  const d = await load();
  const writing = applyCustom(d.writing, {
    note: "Bring your outline to Friday's conference.",
    prompt: { l3_4: "Explain how the foghorn warns boats at Thomas Point." },
    starters: ["Have you ever heard a foghorn at night?"],
    words: ["foghorn"],
  });
  const html = renderStudioPart({ ...d, writing }, { part: "writing", level: "3_4" });
  for (const s of [
    "Bring your outline to Friday",
    "Explain how the foghorn warns boats",
    "From your teacher",
    "Have you ever heard a foghorn at night?",
    "foghorn",
  ])
    assert.ok(html.includes(s), `packet lacks "${s}"`);
  assert.ok(!html.includes("<script>"), "no script in packet");
  const bytes = renderStudioDocx({ ...d, writing }, { part: "writing", wida: "3_4" });
  assert.equal(String.fromCharCode(bytes[0], bytes[1]), "PK");
});

test("markup typed by a teacher prints as text, never as HTML", async () => {
  const d = await load();
  const writing = applyCustom(d.writing, { note: '<img src=x onerror="alert(1)"> hi' });
  const html = renderStudioPart({ ...d, writing }, { part: "writing", level: "3_4" });
  assert.ok(!html.includes("<img src=x"), "raw markup leaked into the packet");
  assert.ok(html.includes("&lt;img"), "note should appear escaped");
});
