// Lesson Companion print twin + export: every unit's first and last generated lesson renders clean HTML, a Word file builds,
// and the answer key is derived from the payloads. No network.
// Run: node functions/_lib/bcpss/lesson-print.test.mjs   (or node --test)

import assert from "node:assert/strict";
import test from "node:test";
import { onRequest } from "../../api/bcpss/lessons/[lessonId]/export.js";
import { BCPSS_UNITS } from "../../../data/bcpss-curriculum-seed.mjs";
import { renderLessonDocx } from "./lesson-docx.js";
import {
  buildLessonDocument,
  DISCLAIMER,
  LEVELS,
  lessonFilename,
  normalizeLevel,
  renderLessonHtml,
} from "./lesson-doc.js";
import { loadLessons } from "./lessons.js";

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const body = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, "");
const KEY_HEADING = "Answer key</h1>";

// ---- sample: first and last lesson of every unit ------------------------------------------------
const sample = [];
for (const unit of BCPSS_UNITS) {
  const set = await loadLessons(unit.id);
  if (!set?.lessons?.length) continue;
  sample.push(set.lessons[0]);
  if (set.lessons.length > 1) sample.push(set.lessons.at(-1));
}

// Every multiple-choice style item in a lesson: { correct, why } as printed in the key.
function mcItems(lesson) {
  const acts = [
    ...lesson.arc.map((s) => s.activity),
    ...lesson.newcomer_path,
    lesson.extension,
    lesson.exit_check,
  ].filter(Boolean);
  const out = [];
  for (const a of acts) {
    const p = a.payload;
    if (a.kind === "quiz" || a.kind === "error_analysis" || a.kind === "exit_check")
      for (const it of p.items) out.push({ kind: a.kind, correct: it.options[it.answer], why: it.why });
    if (a.kind === "read_annotate")
      for (const it of p.questions) out.push({ kind: a.kind, correct: it.options[it.answer], why: it.why });
    if (a.kind === "listen_and_show")
      for (const it of p.items)
        out.push({ kind: a.kind, correct: it.options[it.answer].label, why: it.why });
  }
  return out;
}

test("sample covers every unit and every arc kind", () => {
  assert.ok(sample.length >= BCPSS_UNITS.length, "at least one lesson per unit");
  const kinds = new Set(sample.flatMap((l) => l.arc.map((s) => s.activity.kind)));
  for (const k of ["flash_retrieval", "listen_and_show", "sentence_xray", "speak_and_record", "exit_check"])
    assert.ok(kinds.has(k), `kind ${k} appears in the sample`);
});

test("first and last lesson of every unit render clean, complete HTML", () => {
  for (const lesson of sample) {
    const tag = lesson.id;
    const html = renderLessonHtml(lesson, { level: "l3_4" });
    const text = body(html);
    assert.ok(html.length > 8000, `${tag}: non-empty`);
    assert.match(html, /^<!DOCTYPE html>/, tag);
    assert.ok(html.includes(DISCLAIMER), `${tag}: footer line`);
    assert.ok(/Teacher card/.test(text), `${tag}: teacher card heading`);
    for (const label of ["The 3 moves", "What to listen for", "Watch-outs", "Materials", "Language objective", "Content objective", "language demand"])
      assert.ok(text.includes(label), `${tag}: teacher card "${label}"`);
    assert.ok(text.includes(KEY_HEADING), `${tag}: answer key heading`);
    assert.ok(!/undefined|\[object|NaN/.test(text), `${tag}: undefined / [object / NaN`);
    assert.ok(!/\{[a-z_0-9]+\}/i.test(text), `${tag}: unresolved {token}`);
    assert.ok(!/<script/i.test(text), `${tag}: no scripts`);
    assert.ok(!/\bESOL\b/i.test(text), `${tag}: no ESOL label`);
    // footer on every printed page (margin box) and every screen page (one per section)
    const sections = (text.match(/<section class="sec/g) || []).length;
    assert.equal((text.match(/class="pfoot"/g) || []).length, sections, `${tag}: footer per section`);
    // sections in order: teacher card first, answer key last
    assert.ok(text.indexOf("Teacher card") < text.indexOf(KEY_HEADING), `${tag}: key is last`);
    // every arc step appears (check step is the exit page)
    for (const s of lesson.arc) {
      assert.ok(text.includes(esc(s.activity.title)), `${tag}: step ${s.step} "${s.activity.title}"`);
    }
    for (const a of lesson.newcomer_path)
      assert.ok(text.includes(esc(a.title)), `${tag}: newcomer "${a.title}"`);
    // exit check self-rating row
    for (const label of ["With help", "By myself", "And I can teach it"])
      assert.ok(text.includes(label), `${tag}: self-rating "${label}"`);
    if (lesson.source === "draft_standards_based")
      assert.ok(/Draft notice/.test(text), `${tag}: draft notice`);
  }
});

test("answer key has an entry for every mcq / exit item, derived from the payload", () => {
  for (const lesson of sample) {
    const html = renderLessonHtml(lesson, { level: "l3_4" });
    const key = html.slice(html.indexOf(KEY_HEADING));
    const items = mcItems(lesson);
    assert.ok(items.some((x) => x.kind === "exit_check"), `${lesson.id}: has exit items`);
    for (const it of items) {
      assert.ok(key.includes(esc(it.correct)), `${lesson.id} ${it.kind}: answer "${it.correct}"`);
      assert.ok(key.includes(esc(it.why)), `${lesson.id} ${it.kind}: why for "${it.correct}"`);
    }
    for (const s of lesson.arc) assert.ok(key.includes(esc(s.activity.title)), `${lesson.id}: key entry ${s.step}`);
  }
});

test("changing a payload answer changes the key (derived, not typed)", () => {
  const lesson = structuredClone(sample[0]);
  const it = lesson.exit_check.payload.items[0];
  it.options[(it.answer + 1) % it.options.length] = "ZZ-SENTINEL-ANSWER";
  it.answer = (it.answer + 1) % it.options.length;
  const html = renderLessonHtml(lesson);
  assert.ok(html.slice(html.indexOf(KEY_HEADING)).includes("ZZ-SENTINEL-ANSWER"));
});

test("payload strings are HTML-escaped everywhere", () => {
  const lesson = structuredClone(sample[0]);
  const evil = `<img src=x onerror=alert(1)> & "quoted"`;
  lesson.title = evil;
  lesson.content_objective = evil;
  lesson.arc[0].activity.mission = evil;
  lesson.arc[0].activity.title = evil;
  lesson.exit_check.payload.items[0].q = evil;
  lesson.exit_check.payload.items[0].why = evil;
  lesson.exit_check.payload.can_do = evil;
  const text = body(renderLessonHtml(lesson, { level: "all" }));
  assert.ok(!text.includes("<img"), "raw tag must not survive");
  assert.ok(text.includes("&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quoted&quot;"));
});

test("levels, parts and validation", () => {
  const lesson = sample[0];
  assert.equal(normalizeLevel("3_4"), "l3_4");
  assert.equal(normalizeLevel("L5_6"), "l5_6");
  assert.equal(normalizeLevel("all"), "all");
  assert.equal(normalizeLevel("l9_9"), null);
  const sections = (opts) => buildLessonDocument(lesson, opts).sections.length;
  assert.ok(sections({ level: "all" }) > sections({ level: "l3_4" }), "all levels adds student pages");
  assert.ok(sections({ part: "teacher" }) === 1);
  assert.ok(sections({ part: "key" }) === 1);
  assert.ok(sections({ part: "exit" }) === 1);
  assert.ok(sections({ part: "newcomer" }) >= 1);
  // stretch page only for levels 5-6
  const l56 = renderLessonHtml(lesson, { level: "l5_6" });
  const l12 = renderLessonHtml(lesson, { level: "l1_2" });
  if (lesson.extension) {
    assert.ok(body(l56).includes(esc(lesson.extension.title)));
    assert.ok(!body(l12).split(KEY_HEADING)[0].includes("Stretch:"));
  }
  assert.throws(() => buildLessonDocument(lesson, { level: "x" }));
  assert.throws(() => buildLessonDocument(lesson, { part: "nope" }));
  assert.match(lessonFilename(lesson, { level: "all" }), /^BCPSS-.*-all-levels\.html$/);
  assert.match(lessonFilename(lesson, { level: "l3_4", part: "key" }, "docx"), /WIDA-3-4-key\.docx$/);
  assert.equal(LEVELS.length, 3);
});


// ---- every kind, including the ones no generated lesson uses yet, with small (2-3 item) payloads ----------------
const FIXTURES = {
  cognate_detective: {
    items: [
      { term: "ratio", es: "razón", status: "none", why: "Look different." },
      { term: "equivalent", es: "equivalente", status: "true", why: "Same meaning." },
      { term: "actual", es: "actual", status: "false_friend", why: "Actual means real; actual in Spanish means current." },
      { term: "rate", es: "tasa", status: "none", why: "No look-alike." },
    ],
  },
  morph_lab: {
    items: [
      { word: "unscientific", parts: ["un", "scient", "ific"], meaning: "not based on science" },
      { word: "rebuild", parts: ["re", "build", "ing"], meaning: "build again" },
      { word: "unfair", parts: ["un", "fair", "ly"], meaning: "not fair" },
    ],
  },
  paragraph_builder: {
    klu: "Explain",
    slots: [
      { label: "Claim", frame: "A ratio is ___." },
      { label: "Reason", frame: "I know because [evidence]." },
    ],
    connectors: ["because", "so"],
    checklist: ["I used because.", "I wrote a claim."],
    model: "A ratio compares two amounts because it shows how many of each.",
  },
  match: { left_label: "Word", right_label: "Meaning", pairs: [{ l: "ratio", r: "compares two amounts" }, { l: "rate", r: "compares different units" }] },
  clue_game: { cards: [{ term: "ratio", clues: ["It compares.", "It has two numbers."] }, { term: "rate", clues: ["It has units.", "It says per."] }] },
  cloze: { text: "A {1} compares two {2}.", answers: ["ratio", "amounts"], bank: ["ratio", "amounts", "unit"] },
  sequence: { title: "Find a unit rate", steps: ["Read the problem.", "Divide.", "Write the rate."], signals: ["First,", "Next,", "Finally,"] },
  quiz: { items: [{ q: "Which is a ratio?", options: ["3 to 5", "cat", "red"], answer: 0, why: "A ratio compares two numbers." }, { q: "Which is a rate?", options: ["5 per 2", "dog", "blue"], answer: 0, why: "A rate uses per." }] },
  write_scaffold: { prompt: "Explain ratio.", structure: [{ part: "Claim", frame: "A ratio is ___." }, { part: "Reason", frame: "Because ___." }], word_bank: ["ratio", "because"], checklist: ["I used ratio.", "I used because.", "I wrote a claim.", "I gave a reason."], model: "A ratio is a comparison because it uses two numbers." },
  point_and_say: { items: [{ term: "ratio", icon: "ratio-icon", cue: "Two groups.", say: "A ratio compares two groups.", es: "razón" }, { term: "rate", icon: "🚌", cue: "A bus.", say: "A rate has units." }] },
  home_language_bridge: { items: [{ term: "ratio", es: "razón", note: "True cognate." }, { term: "rate", es: "tasa", note: "Not a cognate." }] },
  tpr_cards: { items: [{ command: "Point to the bigger group.", icon: "👉" }, { command: "Hold up two fingers.", icon: "✌️" }, { command: "Clap three times.", icon: "👏" }] },
};

test("every kind prints a twin and a key from small payloads, in html and docx", () => {
  const base = structuredClone(sample[0]);
  for (const [kind, payload] of Object.entries(FIXTURES)) {
    const lesson = structuredClone(base);
    const activity = { ...lesson.arc[3].activity, kind, title: `Fixture ${kind}`, payload };
    lesson.arc[3] = { ...lesson.arc[3], activity };
    const html = renderLessonHtml(lesson, { level: "all" });
    const text = body(html);
    assert.ok(text.includes(`Fixture ${kind}`), `${kind}: on the page`);
    assert.ok(!/undefined|\[object|NaN/.test(text), `${kind}: undefined`);
    assert.ok(!/\{[a-z_0-9]+\}/i.test(text), `${kind}: unresolved token`);
    const key = text.slice(text.indexOf(KEY_HEADING));
    assert.ok(key.includes(`Fixture ${kind}`), `${kind}: key entry`);
    assert.ok(renderLessonDocx(lesson, { level: "l1_2" }).length > 5000, `${kind}: docx`);
  }
  const quizKey = (() => {
    const lesson = structuredClone(base);
    lesson.arc[3].activity = { ...lesson.arc[3].activity, kind: "quiz", payload: FIXTURES.quiz };
    const h = renderLessonHtml(lesson);
    return h.slice(h.indexOf(KEY_HEADING));
  })();
  assert.ok(quizKey.includes("A ratio compares two numbers.") && quizKey.includes("5 per 2"));
});

// ---- docx --------------------------------------------------------------------------------------
function readZip(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = bytes.length - 22;
  while (eocd >= 0 && dv.getUint32(eocd, true) !== 0x06054b50) eocd--;
  assert.ok(eocd >= 0, "zip end record");
  const count = dv.getUint16(eocd + 10, true);
  let at = dv.getUint32(eocd + 16, true);
  const files = {};
  for (let k = 0; k < count; k++) {
    const size = dv.getUint32(at + 24, true);
    const nameLen = dv.getUint16(at + 28, true);
    const extra = dv.getUint16(at + 30, true);
    const comment = dv.getUint16(at + 32, true);
    const local = dv.getUint32(at + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLen));
    const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
    files[name] = new TextDecoder().decode(bytes.subarray(start, start + size));
    at += 46 + nameLen + extra + comment;
  }
  return files;
}

test("docx builds for 5 sampled lessons with footer, key and no leaked markup", () => {
  const picks = [0, 1, Math.floor(sample.length / 2), sample.length - 2, sample.length - 1].map((k) => sample[k]);
  for (const lesson of picks) {
    const bytes = renderLessonDocx(lesson, { level: "l3_4" });
    assert.ok(bytes.length > 5000, `${lesson.id}: non-empty`);
    assert.equal(bytes[0], 0x50);
    assert.equal(bytes[1], 0x4b);
    const files = readZip(bytes);
    const doc = files["word/document.xml"];
    assert.ok(doc?.includes("Answer key"), `${lesson.id}: key in docx`);
    assert.ok(doc.includes("Teacher card") || doc.includes("TEACHER CARD"), `${lesson.id}: teacher card in docx`);
    assert.ok(!/undefined|\[object/.test(doc), `${lesson.id}: leaked values`);
    assert.ok(!doc.includes("&lt;w:r"), `${lesson.id}: raw run xml`);
    assert.ok(files["word/footerP.xml"].includes(esc(DISCLAIMER)), `${lesson.id}: footer`);
  }
  const all = renderLessonDocx(sample[0], { level: "all" });
  assert.ok(all.length > renderLessonDocx(sample[0], { level: "l1_2" }).length);
});

// ---- endpoint ----------------------------------------------------------------------------------
const call = (id, qs = "") =>
  onRequest({
    request: new Request(`https://x.test/api/bcpss/lessons/${id}/export${qs}`),
    params: { lessonId: id },
    env: {},
  });

test("export endpoint validates params and serves html / docx / pdf fallback", async () => {
  const id = sample[0].id;
  assert.equal((await call("nope")).status, 400);
  assert.equal((await call("g6-math-u2-l99")).status, 404);
  assert.equal((await call(id, "?format=exe")).status, 400);
  assert.equal((await call(id, "?level=l9_9")).status, 400);
  assert.equal((await call(id, "?part=zzz")).status, 400);
  const html = await call(id, "?format=html&level=all");
  assert.equal(html.status, 200);
  assert.match(html.headers.get("Content-Type"), /text\/html/);
  assert.match(html.headers.get("Cache-Control"), /s-maxage=3600/);
  assert.ok((await html.text()).includes(DISCLAIMER));
  const docx = await call(id, "?format=docx&level=l5_6");
  assert.equal(docx.status, 200);
  assert.match(docx.headers.get("Content-Disposition"), /\.docx"$/);
  assert.ok((await docx.arrayBuffer()).byteLength > 5000);
  const pdf = await call(id, "?format=pdf");
  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers.get("X-BCPSS-PDF-Fallback"), "print-html");
  const dl = await call(id, "?download=1&part=key");
  assert.match(dl.headers.get("Content-Disposition"), /key\.html/);
});
