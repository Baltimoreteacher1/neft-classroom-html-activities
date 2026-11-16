/**
 * Teacher Tour 2.0 engine, exhaustively and without a browser (access-practice-lab/src/intro/tour/):
 *   - the registry is built from content/index.json: every Grades 3–5 and 6–8 constructed Speaking/Writing activity;
 *   - every registry row has a real activity record, a student link that fits the QR encoder, and the finder returns
 *     one to three rows for every band x skill x purpose;
 *   - for EVERY activity x length x support approach the lesson blocks add up to the requested minutes, the text has no
 *     broken punctuation or missing words, the learning goal is identical across the three support profiles, and
 *     different lengths and activities produce different text;
 *   - the PDF and DOCX writers produce real files (pdftotext and a zip directory are checked when available);
 *   - the quick-reference links all point at pages the lab answers; saved state is normalized.
 *   node --test tools/access-tour2.test.mjs
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const R = new URL("../access-practice-lab/", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, R), "utf8"));
const M = await import("../access-practice-lab/src/intro/tour/model.js");
const L = await import("../access-practice-lab/src/intro/tour/lesson.js");
const P = await import("../access-practice-lab/src/intro/tour/export-pdf.js");
const D = await import("../access-practice-lab/src/intro/tour/export-docx.js");
const Q = await import("../access-practice-lab/src/intro/tour/quickref.js");
const { MAX_BYTES } = await import("../shared/qr/qr-code.mjs");
const { ROUTES } = await import("../access-practice-lab/src/intro/data.js");

const index = read("content/index.json");
const rows = M.buildRegistry(index);
const cap = (d) => d[0].toUpperCase() + d.slice(1);
const doms = {};
for (const b of M.BANDS) for (const d of M.DOMAINS) doms[`${b.id}/${d.id}`] = read(`content/g${b.id}/${cap(d.id)}.json`);
const actOf = (r) => doms[`${r.band}/${r.domain}`].levels[r.level].activities.find((a) => a.id === r.id);

test("registry: both bands, both skills, every level, constructed items only", () => {
  assert.ok(rows.length > 150, `${rows.length} rows`);
  for (const b of M.BANDS) for (const d of M.DOMAINS) for (const lv of ["A", "B", "C"])
    assert.ok(rows.some((r) => r.band === b.id && r.domain === d.id && r.level === lv), `${b.id} ${d.id} ${lv}`);
  assert.equal(new Set(rows.map((r) => r.key)).size, rows.length, "unique keys");
});

test("every row is a real activity with the fields the lesson needs, and a student link a QR code can hold", () => {
  for (const r of rows) {
    const a = actOf(r);
    assert.ok(a, r.key);
    assert.equal(a.type, "constructed", r.key);
    for (const f of ["prompt", "directions", "skill", "successCriteria", "frames", "hint", "correct"]) assert.ok(a[f]?.length, `${r.key} has ${f}`);
    const url = M.studentUrl(r);
    assert.match(url, /^https:\/\/thelanguagepage\.com\/access-practice-lab\/(Speaking|Writing)\/[ABC]\/[\w-]+\?grades=(3-5|6-8)$/, url);
    assert.ok(new TextEncoder().encode(url).length <= MAX_BYTES, `${r.key}: link fits a QR code`);
  }
});

test("finder: one to three activities for every band x skill x purpose, best fit first, distinct skills", () => {
  for (const b of M.BANDS) for (const d of M.DOMAINS) for (const p of M.PURPOSES) {
    const rec = M.recommend(rows, { band: b.id, domain: d.id, purpose: p.id });
    assert.ok(rec.length >= 1 && rec.length <= 3, `${b.id} ${d.id} ${p.id}: ${rec.length}`);
    assert.equal(new Set(rec.map((r) => r.focus)).size, rec.length);
    assert.ok(rec.every((r) => r.band === b.id && r.domain === d.id));
  }
  const warm = M.recommend(rows, { band: "6-8", domain: "speaking", purpose: "warmup" });
  const indep = M.recommend(rows, { band: "6-8", domain: "speaking", purpose: "independent" });
  assert.ok(warm[0].minutes <= indep[0].minutes + 3 && indep[0].level === "C", "independent prefers stretching support");
});

test("lessons: for every activity x length x approach the blocks add up, text is clean, and the goal never changes", () => {
  const seen = new Map();
  for (const r of rows) {
    const act = actOf(r);
    for (const minutes of M.MINUTES) for (const approach of M.APPROACHES.map((a) => a.id)) {
      const les = L.buildLesson({ res: r, act, minutes, approach });
      assert.equal(L.totalMinutes(les), minutes, `${r.key} ${minutes}`);
      const text = L.lessonText(les, Q.quickRows());
      assert.doesNotMatch(text, /undefined|null|NaN|\[object|\?\.|(?<!\.)\.\.(?!\.)|\?\?|!\.|I can (using|describing|writing|explaining)/, `${r.key} ${minutes} ${approach}`);
      assert.match(les.target, /^I can /);
      assert.ok(les.evidence.length >= 2 && les.blocks.every((b) => b.steps.length >= 1 && b.minutes >= 1));
      assert.ok(text.includes(les.student.url) && text.includes(r.title), "names the real activity and link");
      if (approach === "mixed") seen.set(`${r.key}|${minutes}`, text);
    }
    const goals = new Set(L.profilesFor(act).map((p) => p.goal));
    assert.equal(goals.size, 1, `${r.key}: one learning goal across Starting, Growing, Expanding`);
    const ps = L.profilesFor(act);
    assert.equal(new Set(ps.map((p) => JSON.stringify(p.items))).size, 3, `${r.key}: supports differ`);
  }
  const r0 = rows[0];
  assert.notEqual(seen.get(`${r0.key}|5`), seen.get(`${r0.key}|20`), "5 and 20 minutes differ");
  assert.notEqual(seen.get(`${rows[0].key}|10`).replace(rows[0].title, ""), seen.get(`${rows[40].key}|10`).replace(rows[40].title, ""), "different activities differ");
});

test("a five-minute lesson is a micro-lesson and a twenty-minute lesson a fuller cycle", () => {
  const r = rows.find((x) => x.domain === "writing" && x.band === "6-8");
  const a = actOf(r);
  const five = L.buildLesson({ res: r, act: a, minutes: 5, approach: "growing" });
  const twenty = L.buildLesson({ res: r, act: a, minutes: 20, approach: "growing" });
  assert.deepEqual(five.blocks.map((b) => b.id), ["launch", "practice", "feedback", "close"]);
  assert.deepEqual(twenty.blocks.map((b) => b.id), ["launch", "model", "practice", "feedback", "close"]);
  assert.ok(twenty.blocks.flatMap((b) => b.steps).length > five.blocks.flatMap((b) => b.steps).length);
});

test("edits: the teacher's target and launch directions survive a change of length or approach", () => {
  const r = rows[3];
  const a = actOf(r);
  const les = L.buildLesson({ res: r, act: a, minutes: 15, approach: "expanding", edits: { target: "I can try my own words.", launch: "Gather on the rug." } });
  assert.equal(les.target, "I can try my own words.");
  assert.ok(les.blocks[0].steps[0] === "Gather on the rug.");
  assert.ok(L.lessonText(les).includes("I can try my own words."));
});

test("PDF: a real multi-page file with links, a QR code, and every kit part", () => {
  const r = rows.find((x) => x.band === "3-5" && x.domain === "speaking");
  const les = L.buildLesson({ res: r, act: actOf(r), minutes: 10, approach: "mixed" });
  const bytes = P.kitPdf(les);
  const text = Buffer.from(bytes).toString("latin1");
  assert.ok(text.startsWith("%PDF-1.4") && text.trimEnd().endsWith("%%EOF"));
  assert.ok(text.includes(`/URI (${les.student.url})`));
  assert.ok((text.match(/\/Type \/Page /g) || []).length >= 5, "five or more pages");
  const dir = mkdtempSync(join(tmpdir(), "t2pdf-"));
  const file = join(dir, "kit.pdf");
  writeFileSync(file, bytes);
  try {
    const out = execFileSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8" });
    for (const s of ["My First Lesson with The Language Page", "STUDENT ACTIVITY CARD", "CLASSROOM PROJECTION VIEW", "LANGUAGE SUPPORT AND FEEDBACK CARD", "Your Quick Guide to The Language Page", les.target]) assert.ok(out.includes(s), s);
  } catch (e) {
    if (e.code !== "ENOENT") throw e; // pdftotext not installed: the structural checks above still ran
  }
});

test("DOCX: a stored zip with the Word parts, escaped text and one hyperlink per link", () => {
  const r = rows.find((x) => x.band === "6-8" && x.domain === "writing");
  const les = L.buildLesson({ res: r, act: actOf(r), minutes: 20, approach: "mixed", edits: { target: 'I can use "quotes" & <tags>.' } });
  const bytes = D.kitDocx(les);
  const s = Buffer.from(bytes).toString("utf8");
  assert.equal(String.fromCharCode(bytes[0], bytes[1]), "PK");
  for (const part of ["[Content_Types].xml", "_rels/.rels", "word/document.xml", "word/styles.xml", "word/_rels/document.xml.rels"]) assert.ok(s.includes(part), part);
  assert.ok(s.includes("I can use &quot;quotes&quot; &amp; &lt;tags&gt;."), "text is escaped");
  assert.ok(s.includes(`Target="${les.student.url}"`));
  assert.equal(D.crc32(new TextEncoder().encode("123456789")), 0xcbf43926, "CRC-32 check value");
  const dir = mkdtempSync(join(tmpdir(), "t2docx-"));
  const file = join(dir, "kit.docx");
  writeFileSync(file, bytes);
  try {
    assert.match(execFileSync("unzip", ["-t", file], { encoding: "utf8" }), /No errors detected/);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
});

test("quick reference: seven tasks, every link a page the lab answers", async () => {
  const { DEST_BY_ID } = await import("../access-practice-lab/src/sitemap.js");
  assert.equal(Q.QUICK_TASKS.length, 7);
  const known = new Set([...Object.values(ROUTES), ...Object.values(DEST_BY_ID).map((d) => `/${d.href}`)]);
  for (const t of [...Q.QUICK_TASKS.flatMap((q) => q.links), ...Q.MORE_RESOURCES]) assert.ok(known.has(t.route), `${t.label}: ${t.route}`);
  assert.ok(Q.quickRows().every((q) => q.url.startsWith("https://thelanguagepage.com/access-practice-lab/")));
});

test("saved state: damaged or old records become a complete, valid state", () => {
  assert.equal(M.normalizeState(null).step, "welcome");
  assert.equal(M.normalizeState({ v: 2 }).step, "welcome");
  const s = M.normalizeState({ v: 1, step: "kit", furthest: 99, band: "9-12", tab: "x", profile: "?", pick: { band: "6-8", domain: "speaking", level: "Z", id: "a" }, lesson: { minutes: 7, approach: "no", edits: 5 } });
  assert.equal(s.step, "implement", "a kit with no activity goes back to choosing one");
  assert.equal(s.band, "6-8");
  assert.equal(s.pick, null);
  assert.equal(s.lesson.minutes, 10);
  assert.deepEqual(s.lesson.edits, {});
  assert.equal(M.tourStatus({ tour2: { v: 1, step: "prepare", furthest: 4 } }).state, "continue");
  assert.equal(M.tourStatus({ tour2: { v: 1, step: "kit", furthest: 6 } }).state, "again");
  assert.equal(M.tourStatus({}).state, "start");
});

test("Mr. Neft speaks on every screen", () => {
  for (const id of [...M.STEP_IDS, "gate"]) assert.ok(M.NEFT[id]?.say?.length > 20 && M.NEFT[id].chips.length >= 3, id);
});
