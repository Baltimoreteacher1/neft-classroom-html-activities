// Graded interactive answers (math/fluency-lab/response-*.js): every maker's key passes its own check and a corrupted
// key fails, steps never state the answer before the last one, Spanish stems keep the same numbers, every nudge and
// control label has Spanish, saved responses are cleaned, and each widget, mounted in JSDOM and driven by keyboard
// or clicks only, builds a value the checker accepts.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>", { pretendToBeVisual: true });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
});
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {}, removeItem() {} },
});

const { RESPONSE_I18N_KEYS, checkResponse, cleanResponse, fiveNumber, readNumber } = await import(
  "../math/fluency-lab/response-check.js"
);
const { MAKERS, RESPONSE_SKILLS, makeResponseItem } = await import(
  "../math/fluency-lab/response-items.js"
);
const { mountResponse } = await import("../math/fluency-lab/response-widgets.js");
const { ES_ITEMS } = await import("../math/fluency-lab/i18n-es-items.js");
const { ES } = await import("../math/fluency-lab/i18n-es.js");
const { ALL_SKILLS, seededRandom, validateAnswer } = await import(
  "../math/fluency-lab/problem-bank.js"
);
const { leakCap } = await import("../math/fluency-lab/step-leak.js");
const { builtAnswerItem } = await import("../math/fluency-lab/adaptive-item.js");
const { setLang, t } = await import("../math/fluency-lab/i18n.js");

let checks = 0;
const ok = (cond, msg) => {
  checks += 1;
  assert.ok(cond, msg);
};
const numbers = (text) =>
  (
    String(text)
      .replaceAll("−", "-")
      .match(/-?\d+(?:\.\d+)?/g) || []
  ).join(" ");

// A wrong value of the same shape as the key.
function corrupt(item) {
  const r = item.response;
  switch (r.type) {
    case "point":
      return `(${r.target[0] + 1}, ${r.target[1]})`;
    case "numberLine":
      return String(r.target + 1 / (r.den || 1));
    case "inequality":
      return `${r.target.op} ${r.target.value + 1}`;
    case "dotPlot":
      return r.target.map((n, i) => (i === 0 ? n + 1 : n)).join(",");
    case "boxPlot":
      return r.target.map((n, i) => (i === 2 ? n + 1 : n)).join(",");
    case "fractionShade":
      return `1/${r.parts}` === item.answers[0] ? `2/${r.parts}` : `1/${r.parts}`;
    case "tenFrame":
      return String(r.target === 1 ? 2 : r.target - 1);
    case "baseTen":
      return item.answers[0].replace(/\d$/, (d) => String((Number(d) + 1) % 10));
    case "work":
      return `${item.answers[0]} + 1`;
  }
}

const nudges = new Set();
for (const [name, maker] of Object.entries(MAKERS)) {
  const optionSets = [{}, { frames: 2 }, { hundreds: true }, { quadrant1: true }];
  for (let seed = 1; seed <= 300; seed += 1) {
    const item = maker(seededRandom(seed * 7919), optionSets[seed % optionSets.length]);
    ok(item.response && item.kind === "response", `${name}: response item`);
    ok(
      validateAnswer(item.answers[0], item),
      `${name} seed ${seed}: key passes (${item.question} -> ${item.answers[0]})`,
    );
    const bad = corrupt(item);
    const verdict = checkResponse(bad, item);
    ok(
      !verdict.ok && !validateAnswer(bad, item),
      `${name} seed ${seed}: corrupted key fails (${bad})`,
    );
    nudges.add(verdict.nudge);
    nudges.add(checkResponse("", item).nudge);
    ok(
      leakCap(item) >= item.steps.length - 1,
      `${name} seed ${seed}: no step before the last states the answer`,
    );
    ok(
      typeof item.questionEs === "string" && item.questionEs !== item.question,
      `${name}: Spanish stem`,
    );
    ok(
      numbers(item.questionEs) === numbers(item.question),
      `${name} seed ${seed}: Spanish keeps the numbers (${item.question} | ${item.questionEs})`,
    );
    ok(
      !/timer|seconds|hurry|fast/i.test(item.question + item.hint + item.steps.join(" ")),
      `${name}: no speed language`,
    );
    ok(
      JSON.stringify(cleanResponse(item.response)) === JSON.stringify(item.response),
      `${name}: cleanResponse keeps a real response`,
    );
    for (const nudge of [verdict.nudge, checkResponse("", item).nudge])
      ok(!item.answers.some((a) => nudge.includes(a)), `${name}: nudge never states the key`);
  }
}
for (const nudge of nudges)
  ok(
    ES_ITEMS[nudge] && ES[nudge] === ES_ITEMS[nudge] && RESPONSE_I18N_KEYS.includes(nudge),
    `Spanish nudge, listed for the i18n test: ${nudge}`,
  );

// Every t("…") literal in the widget module has Spanish with the same placeholders.
const widgetSource = readFileSync(
  new URL("../math/fluency-lab/response-widgets.js", import.meta.url),
  "utf8",
);
for (const [, key] of widgetSource.matchAll(/\bt\("([^"]+)"/g)) {
  ok(ES[key], `Spanish label: ${key}`);
  const holes = (text) =>
    [...text.matchAll(/\{(\w+)\}/g)]
      .map((m) => m[1])
      .sort()
      .join();
  ok(holes(ES[key]) === holes(key), `placeholders match: ${key}`);
}
for (const label of ["Minimum", "Q1", "Median", "Q3", "Maximum", "Hundreds", "Tens", "Ones"])
  ok(ES[label], `Spanish label: ${label}`);

// Quartiles: the Grade 6 median-of-halves rule.
assert.deepEqual(fiveNumber([1, 2, 3, 4, 5, 6, 7]), [1, 2, 4, 6, 7]);
assert.deepEqual(fiveNumber([1, 2, 3, 4, 5, 6, 7, 8]), [1, 2.5, 4.5, 6.5, 8]);
ok(
  readNumber("−1 1/2") === -1.5 && readNumber("3/4") === 0.75 && Number.isNaN(readNumber("abc")),
  "readNumber",
);

// Saved responses are rebuilt from known fields only.
ok(cleanResponse({ type: "script", target: 1 }) === null, "unknown type dropped");
ok(cleanResponse({ type: "tenFrame", target: "<img>" }) === null, "bad target dropped");
ok(
  cleanResponse({ type: "numberLine", min: 0, max: 5000, target: 1 }) === null,
  "oversized line dropped",
);
ok(
  !("onclick" in (cleanResponse({ type: "tenFrame", target: 3, onclick: "x" }) || {})),
  "extra fields dropped",
);

// Every skill named in RESPONSE_SKILLS exists, and practice mixes its built answers in.
for (const key of Object.keys(RESPONSE_SKILLS)) {
  const skill = ALL_SKILLS.find((s) => `${s.grade}:${s.id}` === key);
  ok(skill, `RESPONSE_SKILLS names a real skill: ${key}`);
  const rng = seededRandom(42);
  const built = Array.from({ length: 60 }, () => builtAnswerItem(skill, rng, 3)).filter(Boolean);
  ok(
    built.length >= 8 && built.length <= 40,
    `${key}: about one in three practice problems is built (${built.length}/60)`,
  );
  ok(
    built.every((item) => item.skill === skill && item.tier === 3),
    `${key}: built items carry skill and tier`,
  );
}
const typedOnly = ALL_SKILLS.find((s) => s.grade === 4 && s.id === "division");
ok(
  Array.from({ length: 30 }, () => builtAnswerItem(typedOnly, Math.random, 3)).every(
    (x) => x === null,
  ),
  "a skill without built answers stays typed",
);
ok(makeResponseItem(typedOnly) === null, "makeResponseItem: null for typed skills");

// ---- widgets, mounted and driven ---------------------------------------------------------------------------------
const key = (el, k) =>
  el.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: k, bubbles: true }));
const click = (el) => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
function mount(item) {
  const host = document.createElement("div");
  document.body.append(host);
  let value = "";
  const handle = mountResponse(host, item, { onChange: (v) => (value = v) });
  return {
    host,
    get value() {
      return value;
    },
    handle,
  };
}
function drive(item) {
  const w = mount(item);
  const r = item.response;
  const q = (sel) => w.host.querySelector(sel);
  ok(w.value === "", `${r.type}: nothing is pre-built`);
  ok(q(".rw-readout")?.getAttribute("aria-live") === "polite", `${r.type}: polite readout`);
  const moveSlider = (sel, from, to, den = 1) => {
    key(q(sel), "Home");
    for (let v = from; v < to - 1e-9; v += 1 / den) key(q(sel), "ArrowRight");
  };
  switch (r.type) {
    case "numberLine":
      ok(q(".rw-line").getAttribute("role") === "slider", "number line is a slider");
      moveSlider(".rw-line", r.min, r.target, r.den);
      break;
    case "inequality":
      moveSlider(".rw-line", r.min, r.target.value);
      click(q(`[data-closed="${r.target.op.length === 2 ? 1 : 0}"]`));
      click(q(`[data-side="${r.target.op[0] === "<" ? "left" : "right"}"]`));
      break;
    case "point": {
      key(q(".rw-grid-wrap"), "ArrowUp"); // the first key places the point at the origin
      ok(w.value === "(0, 0)", "first key places the origin");
      const [x, y] = r.target;
      for (let i = 0; i < Math.abs(x); i += 1)
        key(q(".rw-grid-wrap"), x > 0 ? "ArrowRight" : "ArrowLeft");
      for (let i = 0; i < Math.abs(y); i += 1)
        key(q(".rw-grid-wrap"), y > 0 ? "ArrowUp" : "ArrowDown");
      break;
    }
    case "dotPlot":
      r.target.forEach((n, i) => {
        for (let k = 0; k < n; k += 1) click(q(`[data-add="${i}"]`));
      });
      break;
    case "boxPlot":
      r.target.forEach((v, i) => moveSlider(`[data-slider="${i}"]`, r.min, v, r.den));
      break;
    case "fractionShade": {
      const want = Number(item.answers[0].split("/")[0]);
      for (let i = 0; i < want; i += 1) click(q(`[data-part="${i}"]`));
      ok(q('[data-part="0"]').getAttribute("aria-pressed") === "true", "shaded part is pressed");
      break;
    }
    case "tenFrame":
      for (let i = 0; i < r.target; i += 1) click(q(`[data-cell="${i}"]`));
      break;
    case "work": {
      const lines = item.answers[0].split("; ");
      lines.forEach((line, i) => {
        const input = q(`[data-line="${i}"]`);
        input.value = line;
        input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
        if (i < lines.length - 1) key(input, "Enter");
      });
      ok(
        w.host.querySelectorAll("[data-line]").length === lines.length,
        "Enter adds one line per step",
      );
      w.handle.showVerdict(checkResponse(w.value, item));
      ok(
        [...w.host.querySelectorAll("[data-mark]")].every((m) => m.dataset.state === "ok"),
        "every correct line is marked as following",
      );
      break;
    }
    case "baseTen":
      for (const [place, n] of [
        ["hundreds", Math.floor(r.target / 100)],
        ["tens", Math.floor(r.target / 10) % 10],
        ["ones", r.target % 10],
      ])
        for (let i = 0; i < n; i += 1) click(q(`[data-more="${place}"]`));
      break;
  }
  ok(
    validateAnswer(w.value, item),
    `${r.type}: building the answer by keyboard/clicks passes (${item.question} -> "${w.value}")`,
  );
  ok(
    [...w.host.querySelectorAll("button")].every(
      (b) => b.getAttribute("aria-label") || /[a-záéíóúñ]{3}/i.test(b.textContent),
    ),
    `${r.type}: every button has a name in words`,
  );
  w.handle.destroy();
  ok(w.host.hidden && !w.host.innerHTML, `${r.type}: destroy clears the host`);
}
for (const [name, maker] of Object.entries(MAKERS)) {
  for (let seed = 1; seed <= 25; seed += 1)
    drive(maker(seededRandom(seed * 104729), seed % 2 ? {} : { hundreds: true, frames: 2 }));
  ok(true, `${name}: driven`);
}

// Line-by-line work: other correct paths pass, a wrong middle line is named, unfinished work is not marked right.
{
  const item = {
    response: { type: "work", mode: "equation", start: "3x + 4 = 19", variable: "x" },
  };
  ok(checkResponse("x = 5", item).ok, "skipping straight to the answer is not penalised");
  ok(
    checkResponse("3x + 4 − 4 = 19 − 4; 3x = 15; 15/3 = x", item).ok,
    "a different correct path passes",
  );
  const wrong = checkResponse("3x = 23; x = 23/3", item);
  ok(!wrong.ok && wrong.vars.n === 2 && wrong.lines[1] === false, "the first wrong line is named");
  ok(
    !checkResponse("3x = 15", item).ok && /Keep going/.test(checkResponse("3x = 15", item).nudge),
    "correct but unfinished work asks to keep going",
  );
  const expr = {
    response: { type: "work", mode: "expression", start: "4(x + 2) + 3x", variable: "x" },
  };
  ok(
    checkResponse("4x + 8 + 3x; 7x + 8", expr).ok && checkResponse("8 + 7x", expr).ok,
    "equivalent expressions in any order pass",
  );
  ok(
    !checkResponse("4x + 2 + 3x; 7x + 2", expr).ok,
    "distributing to only the first term is caught",
  );
  ok(!checkResponse("7x + 8 + 0x", expr).ok, "like terms must be combined");
  ok(!checkResponse("x^2 + 1", expr).ok, "a different expression fails");
  const num = { response: { type: "work", mode: "numeric", start: "2 + 3 × 4", variable: "x" } };
  ok(
    checkResponse("2 + 12; 14", num).ok && !checkResponse("5 × 4; 20", num).ok,
    "order of operations by line",
  );
  ok(
    cleanResponse({ type: "work", mode: "equation", start: "<script>" }) === null,
    "unsafe start rejected",
  );
}

// Spanish rendering of a control.
setLang("es", { persist: false });
const esWidget = mount(MAKERS.inequality(seededRandom(5)));
ok(
  esWidget.host.textContent.includes("Círculo abierto") &&
    esWidget.host.textContent.includes("Sombrear a la derecha"),
  "Spanish controls",
);
setLang("en", { persist: false });
ok(t("Open circle") === "Open circle", "English stays English");

console.log(`fluency response items: ${checks} checks passed`);
