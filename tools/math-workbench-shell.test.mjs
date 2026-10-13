#!/usr/bin/env node
/**
 * Behaviour of the Math Workbench shell layer (wb-*.js), driven in jsdom:
 * the Spanish engine (translate, keep translating, restore exactly), the calculator's
 * exact fraction/percent arithmetic, the reference bank's suggestions, the Teacher
 * Mode gate, the lesson starter's problem picking, and the spoken object model.
 * The live page is driven separately by validate:math-workbench-browser.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const WB = "curriculum/math-workbench";
const src = (f) => readFileSync(`${WB}/${f}`, "utf8");

function page(html, { url = "https://eduwonderlab.com/curriculum/math-workbench/" } = {}) {
  const dom = new JSDOM(
    `<!doctype html><html lang="en"><head><title>Math Workbench — Mr. Neft's Math Class</title></head><body>${html}</body></html>`,
    {
      url,
      runScripts: "outside-only",
      pretendToBeVisual: true,
    },
  );
  return dom.window;
}
const load = (win, ...files) => files.forEach((f) => win.eval(src(f)));
const frame = (win) => new Promise((resolve) => win.requestAnimationFrame(() => resolve()));

/* ── Spanish engine ─────────────────────────────────────────────────────────────── */
{
  const win = page(
    `<button id="b" title="Undo (Ctrl+Z)"><span class="txt">Undo</span></button>
     <p id="mixed"><b>Keep your work.</b> It saves automatically on this device. Use <b>Save / Print</b> to make a PDF or paper copy.</p>
     <div id="overlay"><span id="mine">Undo</span></div>
     <textarea id="t">Undo</textarea>
     <ul id="pages"><li id="pg">Page 2 added</li></ul>`,
  );
  load(win, "wb-i18n-es.js", "wb-i18n-es-panels.js", "wb-i18n.js");
  const i18n = win.MWBI18n;
  assert.equal(i18n.lang(), "en");
  assert.equal(i18n.t("Undo"), "Undo", "English mode returns the text unchanged");
  const before = win.document.body.innerHTML;
  i18n.apply("es");
  assert.equal(win.document.documentElement.lang, "es");
  assert.equal(win.document.title, "Math Workbench — Clase de matemáticas del Sr. Neft");
  assert.equal(win.document.querySelector("#b .txt").textContent, "Deshacer");
  assert.equal(win.document.getElementById("b").title, "Deshacer (Ctrl+Z)");
  assert.match(
    win.document.getElementById("mixed").textContent,
    /Guarda tu trabajo/,
    "mixed-content paragraph translates whole",
  );
  assert.equal(
    win.document.getElementById("pg").textContent,
    "Página 2 agregada",
    "numbered strings use patterns",
  );
  assert.equal(
    win.document.getElementById("mine").textContent,
    "Undo",
    "what a student built is never translated",
  );
  assert.equal(win.document.getElementById("t").value, "Undo", "text areas are never translated");
  assert.equal(i18n.f("Number line from {a} to {b}", { a: -5, b: 5 }), "Recta numérica de -5 a 5");

  // later additions are translated while Spanish is on
  const late = win.document.createElement("p");
  late.textContent = "Reconnecting…";
  win.document.body.appendChild(late);
  await frame(win);
  await frame(win);
  assert.equal(late.textContent, "Reconectando…", "content built after the switch is translated");
  late.textContent = "Connected.";
  await frame(win);
  await frame(win);
  assert.equal(late.textContent, "Conectado.", "changed text is translated again");

  // back to English restores every original string exactly
  i18n.apply("en");
  late.remove();
  assert.equal(
    win.document.body.innerHTML.replace(/ data-wbx-title="[^"]*"/g, ""),
    before,
    "English restores byte-for-byte",
  );
  assert.equal(win.document.title, "Math Workbench — Mr. Neft's Math Class");
  assert.equal(i18n.lang(), "en");
}

/* ── Calculator arithmetic ──────────────────────────────────────────────────────── */
{
  const win = page("");
  load(win, "wb-calc.js");
  const { combine, reduce, mixed, decimal } = win.MWBCalcMath;
  const plain = (x) => JSON.parse(JSON.stringify(x));
  const f = (n, d) => reduce(n, d);
  assert.deepEqual(plain(combine(f(2, 3), "÷", f(1, 4))), { n: 8, d: 3 }, "2/3 ÷ 1/4 = 8/3");
  assert.equal(mixed({ n: 8, d: 3 }), "2 2/3");
  assert.equal(decimal({ n: 8, d: 3 }), "2.666667");
  assert.deepEqual(plain(combine(f(1, 2), "+", f(1, 3))), { n: 5, d: 6 });
  assert.deepEqual(plain(combine(f(3, 4), "−", f(1, 4))), { n: 1, d: 2 }, "results are reduced");
  assert.deepEqual(plain(combine(f(2, 3), "×", f(3, 4))), { n: 1, d: 2 });
  assert.equal(combine(f(1, 2), "÷", f(0, 5)), null, "dividing by zero is refused, not computed");
  assert.deepEqual(plain(reduce(-3, -6)), { n: 1, d: 2 }, "signs are normalised");
  assert.equal(mixed({ n: -7, d: 2 }), "-3 1/2");
  assert.equal(win.MWBCalcMath.round(0.1 + 0.2), "0.3");
}

/* ── Reference suggestions + pins ───────────────────────────────────────────────── */
{
  const win = page("");
  load(win, "wb-reference.js");
  const { suggestFor, SUGGEST, isPinned, togglePin } = win.MWBRef;
  const s = suggestFor(["ratiotable", "dblnumline"]);
  assert.ok(s.some((x) => x.topic === "ratio" && x.name === "Unit rate"));
  assert.equal(new Set(s.map((x) => `${x.topic}::${x.name}`)).size, s.length, "no duplicates");
  assert.equal(
    suggestFor(["text", "line"]).length,
    0,
    "objects with no matching card suggest nothing",
  );
  assert.equal(isPinned("ratio", "Unit rate"), false);
  assert.equal(togglePin("ratio", "Unit rate"), true);
  assert.equal(isPinned("ratio", "Unit rate"), true);
  assert.equal(togglePin("ratio", "Unit rate"), false);
  // every suggested card name exists in the real bank
  const html = src("index.html");
  for (const rules of Object.values(SUGGEST)) {
    for (const [topic, names] of Object.entries(rules)) {
      for (const n of names) {
        assert.ok(html.includes(`name: "${n}"`), `suggested card "${n}" (${topic}) is in the bank`);
      }
    }
  }
}

/* ── Teacher Mode gate ──────────────────────────────────────────────────────────── */
{
  const win = page("");
  load(win, "wb-teacher.js");
  const t = win.MWBTeacher;
  assert.equal(t.isTeacher(), false, "a student device is not in Teacher Mode");
  let ran = false;
  assert.equal(
    t.require("Only teachers.", () => (ran = true)),
    false,
  );
  assert.equal(ran, false, "locked: the action does not run");
  assert.ok(win.document.querySelector(".wbx-gate"), "locked: the reason is explained");
  assert.match(win.document.querySelector(".wbx-gate").textContent, /Teacher Mode/);
  assert.equal(
    t.setCalcOff(true),
    false,
    "a student cannot switch the calculator off for everyone",
  );
  win.localStorage.setItem("nt-teacher-mode", "1");
  assert.equal(t.isTeacher(), true);
  assert.equal(
    t.require("x", () => (ran = true)),
    true,
  );
  assert.equal(ran, true);
  assert.equal(t.setCalcOff(true), true);
  assert.equal(t.calcOff(), true);
  t.setCalcOff(false);
  assert.equal(t.calcOff(), false);
  const off = page("", { url: "https://eduwonderlab.com/curriculum/math-workbench/?calc=off" });
  load(off, "wb-teacher.js");
  assert.equal(off.MWBTeacher.calcOff(), true, "?calc=off switches the calculator off for the tab");
}

/* ── Lesson starter picks only the lesson's own problems ────────────────────────── */
{
  const win = page("");
  load(win, "wb-lesson.js");
  const config = {
    revealWordProblem: { text: "Some students will make 50 bags of granola." },
    practice: {
      onLevel: [
        { stem: "Prep Bowl A: 7 cups of flour with 4 cups of water. Ratio of flour to water?" },
      ],
      optional: [
        { stem: "Prep Bowl A: 7 cups of flour with 4 cups of water. Ratio of flour to water?" },
        { stem: "Another one." },
      ],
      extending: [{ stem: "Stretch it." }],
    },
  };
  const picks = win.MWBLesson.problemsFrom(config);
  assert.equal(picks.length, 3, "at most three offers");
  assert.equal(
    picks.map((p) => p.kind).join("|"),
    "Word problem|Practice problem|Challenge problem",
  );
  assert.equal(
    new Set(picks.map((p) => p.text)).size,
    3,
    "an item both onLevel and optional is offered once",
  );
  assert.equal(win.MWBLesson.problemsFrom({}).length, 0, "a lesson with no problem offers none");
}

/* ── Spoken object model, in both languages ─────────────────────────────────────── */
{
  const win = page('<div id="overlay"></div><div id="flyout"></div>');
  win.MWBShell = {
    objects: () => [],
    inkPalettes: () => ({ pen: [], hi: [] }),
    setInkPalettes() {},
    pageInfo: () => ({ page: 1, count: 1 }),
    focusObject() {},
  };
  load(win, "wb-i18n-es.js", "wb-i18n-es-panels.js", "wb-i18n.js", "wb-access.js");
  const { describe } = win.MWBAccess;
  const board = { id: "o1", type: "ratiotable", top: ["2", "4"], bottom: ["3", "6"] };
  assert.equal(describe(board), "Ratio table, top row 2, 4, bottom row 3, 6");
  assert.equal(describe({ type: "coordgrid", min: -5, max: 5 }), "Coordinate plane from -5 to 5");
  assert.equal(
    describe({ type: "fracbar", parts: 8, shaded: [0, 1] }),
    "Fraction bar with 8 parts, 2 shaded",
  );
  win.MWBI18n.apply("es");
  assert.equal(describe(board), "Tabla de razones, fila de arriba 2, 4, fila de abajo 3, 6");
  assert.equal(describe({ type: "angle", deg: 60 }), "Ángulo de 60 grados");
  assert.ok(
    typeof describe({ type: "something-new" }) === "string",
    "an unknown object type still has a name",
  );
}

/* ── Spanish table integrity ────────────────────────────────────────────────────── */
{
  const win = page("");
  load(win, "wb-i18n-es.js", "wb-i18n-es-panels.js", "wb-reference-es.js");
  const es = win.MWB_ES;
  assert.ok(Object.keys(es).length > 400, "the interface table is not a stub");
  for (const [k, v] of Object.entries(es)) {
    assert.ok(typeof v === "string" && v.trim(), `value for "${k}"`);
    assert.equal(
      (k.match(/<b>/g) || []).length,
      (v.match(/<b>/g) || []).length,
      `markup parity for "${k.slice(0, 40)}"`,
    );
  }
  for (const [re, fn] of win.MWB_ES_PATTERNS) {
    assert.ok(re instanceof win.RegExp || re instanceof RegExp, "patterns are regular expressions");
    assert.equal(typeof fn, "function");
  }
  assert.equal(win.MWBRefES.byName("Unit rate"), "Tasa unitaria");
  assert.equal(win.MWBRefES.item("frac", "Divide fractions", "name"), "Dividir fracciones");
}

console.log("Math Workbench shell: all assertions passed");
