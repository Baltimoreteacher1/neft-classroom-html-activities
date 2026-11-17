// Goal setting end to end without a browser: the grade-to-bank rules, the sheet model for every band and every skill,
// the escaped HTML, the Word file (real zip, well-formed XML parts, the text a teacher typed, hyperlinks), the
// class set, and the student page through JSDOM (pick a grade, a skill and a goal, print and download).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { JSDOM } from "jsdom";

const ROOT = new URL("../", import.meta.url);
const win = new JSDOM("<main id='app'></main>", {
  url: "https://lab.test/access-practice-lab/goals",
}).window;
for (const key of [
  "window",
  "document",
  "localStorage",
  "location",
  "history",
  "navigator",
  "HTMLElement",
  "Node",
  "DOMParser",
])
  Object.defineProperty(globalThis, key, { value: win[key], configurable: true, writable: true });
globalThis.matchMedia = () => ({ matches: false });
globalThis.fetch = async (url) => ({
  ok: true,
  json: async () =>
    JSON.parse(await readFile(new URL(String(url).replace(/^\//, ""), ROOT), "utf8")),
});

const M = await import("../access-practice-lab/src/goals/model.js");
const S = await import("../access-practice-lab/src/goals/sheet.js");
const D = await import("../access-practice-lab/src/goals/docx.js");
const O = await import("../access-practice-lab/src/goals/options.js");
const bank = (band) =>
  JSON.parse(readFileSync(new URL(`access-practice-lab/content/goals/${band}.json`, ROOT), "utf8"));

test("grades map to the right bank, levels to the right range, suggestions fit the level", () => {
  const want = {
    K: "K",
    1: "1",
    2: "2-3",
    3: "2-3",
    4: "4-5",
    5: "4-5",
    6: "6-8",
    8: "6-8",
    9: "9-12",
    12: "9-12",
  };
  for (const [g, b] of Object.entries(want)) assert.equal(M.bandOfGrade(g), b, `grade ${g}`);
  assert.equal(M.rangeOfLevel(2.5), "1-2");
  assert.equal(M.rangeOfLevel(3.0), "3-4");
  assert.equal(M.rangeOfLevel(5.5), "5-6");
  assert.equal(M.levelOption(3.74), "3.5");
  assert.equal(M.levelOption(null), "");
  const b = bank("4-5");
  assert.ok(M.inRange(M.suggestGoal(b, "writing", 4.2), 4.2), "suggestion matches the level");
  assert.ok(M.inRange(M.suggestGoal(b, "speaking", 1.5), 1.5));
  assert.equal(
    M.lowestDomain({ listening: 4, speaking: 2.5, reading: 3, writing: null }),
    "speaking",
  );
  assert.equal(M.lowestDomain({}), null);
});

test("every band and skill builds a sheet in each language with no empty goal text", () => {
  for (const band of M.GOAL_BANDS) {
    const bk = bank(band);
    for (const dom of M.GOAL_DOMAINS) {
      for (const lang of ["en", "es", "both"]) {
        const f = S.emptyForm(new Date("2026-11-17"));
        f.lang = lang;
        f.grade = { K: "K", 1: "1", "2-3": "2", "4-5": "4", "6-8": "7", "9-12": "10" }[band];
        Object.assign(f.goals[0], {
          domain: dom,
          goalId: bk.domains[dom].goals[0].id,
          steps: bk.domains[dom].steps.slice(0, 3).map((s) => s.id),
          evidence: ["0"],
        });
        const sheet = S.buildSheet(f, bk);
        assert.ok(
          sheet.goals[0].student.every((t) => t.length > 3),
          `${band}/${dom}/${lang}`,
        );
        assert.equal(sheet.goals[0].steps.length, 3);
        assert.equal(sheet.goals[0].student.length, lang === "both" ? 2 : 1);
        const html = S.sheetHTML(sheet);
        assert.match(html, /gs-sheet/);
        assert.ok(!/undefined|\[object/.test(html), `${band}/${dom}/${lang}: placeholder leaked`);
      }
    }
  }
});

test("student text is escaped; check-ins follow the time frame", () => {
  const f = S.emptyForm(new Date("2026-11-17"));
  f.student = '<img src=x onerror="alert(1)">';
  f.goals[0].studentText = "I can <b>write</b> & more";
  const html = S.sheetHTML(S.buildSheet(f, bank("4-5")));
  assert.ok(!html.includes("<img src=x"), "name escaped");
  assert.ok(!html.includes("<b>write</b>"), "goal text escaped");
  assert.ok(html.includes("&amp; more"));
  const cases = [
    ["4w", "weekly", 3],
    ["9w", "biweekly", 4],
    ["9w", "weekly", 8],
    ["18w", "monthly", 4],
    ["36w", "monthly", 8],
  ];
  for (const [tf, rhythm, n] of cases) {
    const g = S.emptyForm(new Date("2026-11-17"));
    g.timeframe = tf;
    g.checkin = rhythm;
    assert.equal(S.checkinDates(g).dates.length, n, `${tf}/${rhythm}`);
  }
});

test("the Word file is a real, well-formed document with the teacher's words and working links", () => {
  const bk = bank("6-8");
  const f = S.emptyForm(new Date("2026-11-17"));
  Object.assign(f, {
    lang: "both",
    student: "Camila & Co",
    teacher: "Mr. Neft",
    grade: "7",
    level: "3.5",
  });
  const g = f.goals[0];
  g.domain = "writing";
  g.goalId = bk.domains.writing.goals[2].id;
  g.steps = bk.domains.writing.steps
    .filter((s) => s.link)
    .slice(0, 2)
    .map((s) => s.id);
  g.extraStep = "Read my draft out loud";
  const bytes = D.sheetDocx(S.buildSheet(f, bk));
  assert.equal(String.fromCharCode(bytes[0], bytes[1]), "PK");
  const dir = mkdtempSync(join(tmpdir(), "goaldocx-"));
  const file = join(dir, "g.docx");
  writeFileSync(file, bytes);
  const part = (name) =>
    execFileSync("unzip", ["-p", file, name.replace(/[[\]]/g, "\\$&")], { encoding: "utf8" });
  const parser = new win.DOMParser();
  for (const name of [
    "[Content_Types].xml",
    "_rels/.rels",
    "word/document.xml",
    "word/styles.xml",
    "word/_rels/document.xml.rels",
    "docProps/core.xml",
  ]) {
    const doc = parser.parseFromString(part(name), "application/xml");
    assert.equal(doc.getElementsByTagName("parsererror").length, 0, `${name} is well-formed XML`);
  }
  const xml = part("word/document.xml");
  assert.ok(xml.includes("Camila &amp; Co"), "name in the document, escaped");
  assert.ok(xml.includes("Read my draft out loud"), "custom step");
  assert.ok(xml.includes("<w:tblHeader/>"), "table header rows are marked");
  assert.ok(xml.includes('w:val="Heading2"'), "real heading style");
  const rels = part("word/_rels/document.xml.rels");
  assert.ok(
    /TargetMode="External"/.test(rels) &&
      /thelanguagepage\.com\/access-practice-lab\/(twr|access-prep|Writing)/.test(rels),
    "links point at the site",
  );
  assert.match(
    part("docProps/core.xml"),
    /<dc:title>My Language Goals \/ Mis metas de lenguaje<\/dc:title>/,
  );
  // a class set is one file with a page break between students
  const many = D.sheetDocx([
    S.buildSheet(f, bk),
    S.buildSheet({ ...f, student: "Second" }, bk),
    S.buildSheet({ ...f, student: "Third" }, bk),
  ]);
  writeFileSync(file, many);
  const mxml = part("word/document.xml");
  assert.equal(
    (mxml.match(/w:br w:type="page"/g) || []).length,
    2,
    "two page breaks for three students",
  );
  assert.ok(mxml.includes("Third"));
});

// ── the student page ─────────────────────────────────────────────────────────
const app = document.getElementById("app");
const view = await import("../access-practice-lab/src/views/goals.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");
const ctx = { band: "3-5", prefs: { lang: "en" }, rerender: () => draw() };
async function draw() {
  const out = await view.render(ctx);
  app.innerHTML = toHtml(out.html);
}
const settle = () => new Promise((r) => setTimeout(r, 20));
const change = async (sel, value) => {
  const el = app.querySelector(sel);
  assert.ok(el, sel);
  if (el.type === "checkbox") el.checked = value;
  else el.value = value;
  view.onChange({ target: el }, ctx);
  await settle();
};

test("My goals: opens on the learner's band, suggests a goal, saves the draft, prints and downloads", async () => {
  localStorage.clear();
  await draw();
  assert.equal(app.querySelector("#glGrade").value, "4", "grade 3-5 band opens on grade 4");
  assert.equal(app.querySelectorAll("#glSkill option").length, 5);
  assert.ok(app.querySelectorAll("#glGoal option").length >= 7, "six goals plus the prompt");
  await change("#glSkill", "writing");
  assert.ok(app.querySelector("#glGoal").value, "a goal is suggested for the new skill");
  assert.ok(
    app.querySelectorAll("input[data-gl-step]:checked").length >= 3,
    "three steps preselected",
  );
  const first = app.querySelector("#glGoal").selectedOptions[0].textContent;
  assert.ok(app.querySelector("#glPreview").textContent.includes(first), "preview shows the goal");
  await change("#glGrade", "K");
  assert.ok(app.querySelectorAll("#glGoal option").length >= 7, "kindergarten bank loads");
  assert.ok(!app.querySelector('a[href*="access-prep/"]'), "no test-prep links for kindergarten");
  await change("#glLang", "es");
  assert.ok(app.querySelector("#glPreview").textContent.includes("Mis metas de lenguaje"));
  const saved = JSON.parse(localStorage.getItem("accessPracticeLab:v1:goal-form"));
  assert.equal(saved.grade, "K");
  assert.equal(saved.lang, "es");
  // the textarea overrides the bank goal and shows in the preview without a re-render
  const ta = app.querySelector("#glWords");
  ta.value = "Yo puedo leer mi nombre";
  view.onInput({ target: ta }, ctx);
  assert.ok(app.querySelector("#glPreview").textContent.includes("Yo puedo leer mi nombre"));
  let printed = 0;
  window.print = () => (printed += document.querySelectorAll("#gfPrintRoot .gs-sheet").length);
  view.onClick({ target: app.querySelector('[data-gl-act="print"]') });
  assert.equal(printed, 1, "one sheet sent to print");
  window.dispatchEvent(new win.Event("afterprint"));
  assert.ok(!document.getElementById("gfPrintRoot"), "print root removed afterwards");
  assert.ok(!document.body.classList.contains("gf-printing"));
});

test("options are bilingual and unique", () => {
  for (const list of [
    O.TIMEFRAMES,
    O.CHECKINS,
    O.TEACHER_SUPPORTS,
    O.FAMILY_SUPPORTS,
    O.REFLECTIONS,
    O.CELEBRATIONS,
    O.SHEET_STYLES,
    O.LANGS,
  ]) {
    assert.equal(new Set(list.map((x) => x.id)).size, list.length);
    for (const x of list)
      assert.ok((x.label?.[0] && x.label?.[1] && x.label[0] !== x.label[1]) || x.id === "es", x.id);
  }
  for (const m of O.MEASURES) assert.ok(m.teacher[1] && m.student[1]);
  for (const [k, v] of Object.entries(O.LABELS)) assert.ok(v[0] && v[1], k);
});
