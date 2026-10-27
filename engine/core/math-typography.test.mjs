#!/usr/bin/env node
/**
 * math-typography.test.mjs — the render-time formatter changes how math LOOKS and
 * nothing else.
 *
 * Lesson data stays plain text (hyphen-minus, a letter x, an ordinary space before
 * "ft") so authors can type it and so answer keys compare as plain text. The
 * formatter (engine/core/math-typography.js) turns that into the minus sign, the
 * times sign and no-break spaces on screen. The danger is the same in both
 * directions, and both are pinned here:
 *
 *   1. it must never alter an answer: engine/core/answer-match.js still accepts
 *      what a student types on a plain keyboard (hyphen-minus, x, *, /), and an
 *      answer written with the typeset signs;
 *   2. it must actually reach the screen through the two entry points the engine
 *      uses (renderMathText, stackContent) without touching which choice is right.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { isRight, numericValue } from "./answer-match.js";
import { renderMathText, typesetPlain } from "./math-typography.js";

const MINUS = "−";
const TIMES = "×";
const DIVIDE = "÷";
const NBSP = " ";

// ---- the formatter ---------------------------------------------------------

test("a spaced hyphen between operands becomes the minus sign", () => {
  assert.equal(typesetPlain("36 - 20 = 16"), `36 ${MINUS} 20 = 16`);
  assert.equal(typesetPlain("x - 3 = 7"), `x ${MINUS} 3 = 7`);
  assert.equal(typesetPlain("|6 - (-4)| = 10"), `|6 ${MINUS} (${MINUS}4)| = 10`);
});

test("a hyphen that signs a number or variable becomes the minus sign", () => {
  assert.equal(typesetPlain("-5 is left of 0"), `${MINUS}5 is left of 0`);
  assert.equal(typesetPlain("Point (-2, -4)"), `Point (${MINUS}2, ${MINUS}4)`);
  assert.equal(typesetPlain("x = -3"), `x = ${MINUS}3`);
});

test("hyphens that are not minus signs are left alone", () => {
  for (const keep of [
    "Plot it on the x-axis",
    "a 3-digit number",
    "pages 5-10",
    "2026-10-27",
    "well-known, one-step equations",
    "call 555-0123",
  ]) {
    assert.equal(typesetPlain(keep), keep, keep);
  }
});

test("x and * between numbers become the times sign, variables do not", () => {
  assert.equal(typesetPlain("3 x 4 = 12"), `3 ${TIMES} 4 = 12`);
  assert.equal(typesetPlain("3 * 4 = 12"), `3 ${TIMES} 4 = 12`);
  assert.equal(typesetPlain("(2 + 1) x 5"), `(2 + 1) ${TIMES} 5`);
  for (const keep of ["Find 2x + 1 when x = 4", "the x-axis", "x and y", "2x"]) {
    assert.equal(typesetPlain(keep), keep, keep);
  }
});

test("a spaced slash is division only inside an equation", () => {
  assert.equal(typesetPlain("24 / 4 = 6"), `24 ${DIVIDE} 4 = 6`);
  assert.equal(typesetPlain("n / 4 = 6"), `n ${DIVIDE} 4 = 6`);
  // "in" is a preposition, so it is not glued to the number; the unit after "=" is.
  assert.equal(typesetPlain("48 in / 12 = 4 ft"), `48 in ${DIVIDE} 12 = 4${NBSP}ft`);
  assert.equal(typesetPlain("$7 / 10%"), "$7 / 10%", "a point label is not division");
  assert.equal(typesetPlain("3/4 of a pizza"), "3/4 of a pizza", "an unspaced fraction is structure, not division");
});

test("a number and its unit are joined by a no-break space", () => {
  assert.equal(typesetPlain("a 12 ft fence"), `a 12${NBSP}ft fence`);
  assert.equal(typesetPlain("540 meters and 3 cups"), `540${NBSP}meters and 3${NBSP}cups`);
  assert.equal(typesetPlain("84 cm²"), `84${NBSP}cm²`);
  assert.equal(typesetPlain("about 35 % of them"), `about 35${NBSP}% of them`);
});

test("a number is not joined to a word that only looks like a unit", () => {
  for (const keep of [
    "Put 5 in a row",
    "1/3 mile of trail",
    "más cerca de −2, más cerca de −3",
    "Take 2 more steps",
  ]) {
    assert.equal(typesetPlain(keep), keep, keep);
  }
});

test("thousands get a comma, calendar years and labels do not", () => {
  assert.equal(typesetPlain("1500 ÷ 25 = 60"), "1,500 ÷ 25 = 60");
  assert.equal(typesetPlain("It costs $12500."), "It costs $12,500.");
  assert.equal(typesetPlain("(5, 6000)"), "(5, 6,000)");
  assert.equal(typesetPlain("in 2024 and since 1999"), "in 2024 and since 1999");
  assert.equal(typesetPlain("Room 1204"), "Room 1204");
  assert.equal(typesetPlain("1,344 and 7.560"), "1,344 and 7.560");
});

test("it is idempotent and never changes a digit", () => {
  const samples = [
    "36 - 20 = 16, 3 x 4 = 12, 24 / 4 = 6 in 12 ft, 1500 people, -5 + -3, 35 %",
    "Plot (-2, 1) and (3, -4) on the x-axis in 2024",
    "",
    "no numbers here",
  ];
  for (const s of samples) {
    const once = typesetPlain(s);
    assert.equal(typesetPlain(once), once, `idempotent: ${s}`);
    const digits = (t) => (t.replace(/,/g, "").match(/\d+/g) || []).join("|");
    assert.equal(digits(once), digits(s), `digits unchanged: ${s}`);
  }
});

// ---- structure -------------------------------------------------------------

test("renderMathText typesets, then adds structure", () => {
  const html = renderMathText("Area = 1/2 x 14 x 6 = 42 sq ft & x^2");
  assert.ok(html.includes(TIMES), "times sign");
  assert.ok(html.includes('class="math-frac"'), "stacked fraction");
  assert.ok(html.includes('class="math-exp"'), "exponent");
  assert.ok(html.includes("&amp;"), "markup is still escaped");
  assert.ok(/class="math-run" style="[^"]*white-space:nowrap[^"]*tabular-nums/.test(html), "equation stays on one line with tabular numerals");
});

test("an equation too long to keep on one line is allowed to wrap", () => {
  const long = "2(60) + 2(45) + 2(12) + 2(60) + 2(45) + 2(12) + 2(60) = 585";
  assert.ok(!renderMathText(long).includes("math-run"), "a long equation must not force a 375px column wider");
});

test("markup in lesson text is escaped, not interpreted", () => {
  const html = renderMathText("<img src=x onerror=alert(1)> 3 x 4");
  assert.ok(!html.includes("<img"), html);
  assert.ok(html.includes("&lt;img"), html);
});

// ---- answers are untouched -------------------------------------------------

test("a student who types plain characters is still marked right", () => {
  // The lesson DISPLAYS the typeset signs; the student types what the keyboard has.
  const cases = [
    [`${MINUS}5`, "-5"],
    ["-5", `${MINUS}5`],
    [`3 ${TIMES} 4`, "3 x 4"],
    [`3 ${TIMES} 4`, "3 * 4"],
    ["3 x 4", `3 ${TIMES} 4`],
    [`24 ${DIVIDE} 4`, "24 / 4"],
    ["24 / 4", `24 ${DIVIDE} 4`],
    [`12${NBSP}ft`, "12 ft"],
    ["12 ft", "12"],
    ["1,344", "1344"],
    ["1344", "1,344"],
    [`x = ${MINUS}3`, "x=-3"],
    [`${MINUS}3.5`, "-3.5"],
  ];
  for (const [authored, typed] of cases) {
    assert.ok(isRight(typed, authored), `${JSON.stringify(typed)} must match ${JSON.stringify(authored)}`);
  }
});

test("typesetting an answer does not change what it is worth", () => {
  for (const answer of ["-5", "3 x 4", "24 / 4", "1500", "-3.5", "12 ft"]) {
    const shown = typesetPlain(answer);
    assert.ok(isRight(answer, shown), `${answer} vs ${shown}`);
    assert.ok(isRight(shown, answer), `${shown} vs ${answer}`);
  }
  assert.equal(numericValue("-5"), numericValue(`${MINUS}5`));
});

test("a different answer is still wrong after typesetting", () => {
  assert.ok(!isRight("5", `${MINUS}5`));
  assert.ok(!isRight("3 x 5", `3 ${TIMES} 4`));
  assert.ok(!isRight("4 / 24", `24 ${DIVIDE} 4`));
});

// ---- the entry points the engine uses --------------------------------------

const dom = new JSDOM("<!doctype html><body></body>", { url: "https://eduwonderlab.com/" });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
globalThis.HTMLElement = dom.window.HTMLElement;

const { stackContent } = await import("./i18n.js");
const { renderMultipleChoice } = await import("../components/multiple-choice.js");

test("stackContent (bilingual text everywhere) typesets both lanes", () => {
  const html = stackContent("8 - 3 = 5 and 3 x 4", "8 - 3 = 5 y 3 x 4");
  const en = html.match(/class="i18n-en"[^>]*>([^<]*)</)[1];
  const es = html.match(/class="i18n-es"[^>]*>([^<]*)</)[1];
  assert.equal(en, `8 ${MINUS} 3 = 5 and 3 ${TIMES} 4`);
  assert.equal(es, `8 ${MINUS} 3 = 5 y 3 ${TIMES} 4`);
});

test("a multiple-choice card shows typeset choices but keeps the same right answer", () => {
  const host = document.createElement("div");
  document.body.append(host);
  const picks = [];
  renderMultipleChoice(host, {
    stem: "What is 2 - 7?",
    choices: ["-5", "5", "-9", "9"],
    correctIndex: 0,
    explanation: "2 - 7 = -5 because you move 7 left of 2.",
    onAnswer: (ok, i) => picks.push([ok, i]),
  });
  const shown = host.textContent;
  assert.ok(shown.includes(`${MINUS}5`), `choices are typeset: ${shown.slice(0, 200)}`);
  assert.ok(!/(^|[\s(])-5/.test(shown), "no hyphen-minus sign survives on screen");
  const labels = [...host.querySelectorAll("label, [role=radio], button")].filter((el) => /5|9/.test(el.textContent));
  assert.ok(labels.length >= 4, "all four choices render");
  const right = labels.find((el) => el.textContent.trim().endsWith(`${MINUS}5`) || el.textContent.includes(`${MINUS}5`));
  right.click();
  const check = [...host.querySelectorAll("button")].find((b) => /check answer/i.test(b.textContent));
  assert.ok(check, "the check button is sentence case: 'Check answer'");
  assert.equal(check.textContent, "Check answer");
  check.click();
  assert.ok(host.querySelector(".is-correct"), "picking the choice at correctIndex is still scored right");
});
