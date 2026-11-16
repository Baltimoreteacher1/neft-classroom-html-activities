// Think it through: the logic (equivalence, targeted feedback, new equivalent problems, build-to-target) and the flow in a DOM, with real figures.
import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { registered } from "../curriculum/learning-labs/shared/models/index.mjs";
import { FIGURES, figureFor } from "../shared/motion/figures/index.mjs";
import {
  answerOk,
  buildCheck,
  judge,
  newProblem,
  order,
  problemAt,
} from "../shared/motion/figures/think-logic.mjs";
import { mountThink } from "../shared/motion/figures/think-ui.mjs";
import { blueprints } from "./learning-labs/blueprints.mjs";

const dom = new JSDOM("<!doctype html><body></body>", {
  pretendToBeVisual: true,
  url: "http://localhost/",
});
for (const k of [
  "window",
  "document",
  "HTMLElement",
  "Node",
  "localStorage",
  "KeyboardEvent",
  "Event",
])
  Object.defineProperty(globalThis, k, {
    value: dom.window[k],
    configurable: true,
    writable: true,
  });

const startOf = (key) => {
  const bp = blueprints.find((b) => `${b.model.kind}:${b.model.mode}` === key)?.model;
  if (bp) return bp.values;
  const [kind, mode] = key.split(":");
  return (
    registered({ kind, mode })?.values ??
    FIGURES.find((f) => f.keys.includes(key))?.standalone?.values
  );
};

test("answers are judged by value, approximate headlines by rounding, never by string", () => {
  assert.ok(answerOk({ value: "5/2" }, "2.50"));
  assert.ok(answerOk({ value: "5/2" }, "2 1/2"));
  assert.ok(answerOk({ value: "14.94" }, "14.94"));
  assert.ok(!answerOk({ value: "14.94" }, "14.9"));
  assert.ok(answerOk({ value: "0.6667", approx: true }, "0.66667"));
  assert.ok(answerOk({ value: "0.6667", approx: true }, "2/3"));
  assert.ok(!answerOk({ value: "0.6667", approx: true }, "0.67"));
  assert.ok(!answerOk({ value: "12" }, "twelve"));
});

test("a wrong answer is diagnosed, never answered", () => {
  const fig = figureFor("fraction:servings");
  const p = problemAt(fig, "fraction:servings", [3, 1, 2], "en");
  assert.equal(p.head.value, "6");
  assert.equal(judge(p, "6").kind, "right");
  assert.equal(judge(p, "").kind, "empty");
  assert.equal(judge(p, "six").kind, "not-a-number");
  const w = judge(p, p.wrong.value);
  assert.equal(w.kind, "wrong-move");
  assert.ok(
    w.say && !w.say.includes(p.head.value + " "),
    "the diagnosis does not print the right answer",
  );
  assert.equal(judge(p, "99").kind, "other");
});

test("new equivalent problems are deterministic, legal and different", () => {
  for (const fig of FIGURES) {
    for (const key of fig.keys) {
      const base = startOf(key);
      const a = newProblem(fig, key, base, "t|1", { avoid: [] });
      const b = newProblem(fig, key, base, "t|1", { avoid: [] });
      assert.deepEqual(a.values, b.values, `${key} deterministic`);
      const start = problemAt(fig, key, base, "en").head.value;
      const c = newProblem(fig, key, base, "t|2", { avoid: [start] });
      assert.ok(c && c.problem.head.value !== start, `${key} differs from the one already seen`);
      const cs = fig.controls(key);
      c.values.forEach((v, i) =>
        assert.ok(v >= cs[i].min && v <= cs[i].max, `${key} control ${i} in range`),
      );
    }
  }
});

test("build-to-target says too high or too low, and accepts any setting that works", () => {
  const fig = figureFor("fraction:servings");
  const key = "fraction:servings";
  assert.deepEqual(buildCheck(fig, key, [3, 1, 2], "6"), { ok: true, got: "6" });
  assert.equal(buildCheck(fig, key, [2, 1, 2], "6").relation, "low");
  assert.equal(buildCheck(fig, key, [4, 1, 2], "6").relation, "high");
  assert.ok(
    buildCheck(fig, key, [6, 1, 4], "24").ok && buildCheck(fig, key, [3, 1, 8], "24").ok,
    "two different settings reach 24",
  );
  assert.ok(buildCheck(fig, key, [999, 1, 2], "6").invalid);
});

test("seeded order is a permutation and stable", () => {
  const o = order(4, "x");
  assert.deepEqual([...o].sort(), [0, 1, 2, 3]);
  assert.deepEqual(o, order(4, "x"));
});

const fig = figureFor("fraction:servings");
const KEY = "fraction:servings";
const mount = (mode, lang = "en") => {
  localStorage.clear();
  const host = document.createElement("div");
  document.body.append(host);
  let cur = lang;
  const calls = { set: [], watch: 0 };
  const t = mountThink(host, {
    fig,
    key: KEY,
    mode,
    lang: () => cur,
    base: startOf(KEY),
    setValues: (v) => calls.set.push(v),
    watch: () => calls.watch++,
  });
  return { host, t, calls, setLang: (l) => ((cur = l), t.update()) };
};
const press = (host, text) =>
  [...host.querySelectorAll("button")].find((b) => b.textContent.includes(text))?.click();
const type = (host, sel, v) => {
  const i = host.querySelector(sel);
  i.value = v;
  return i;
};

test("standard flow: see, try (miss, revise, solve), explain, apply, with no answer shown on a miss", () => {
  const { host, calls } = mount("standard");
  assert.match(host.textContent, /See one/);
  press(host, "Next");
  assert.match(host.querySelector(".mc-step.is-active").textContent, /Try one/);
  const numbers = host.querySelector(".mc-numbers").textContent;
  type(host, ".mc-step.is-active input[type=text]", "0");
  press(host, "Check");
  const miss = host.querySelector(".mc-fb").textContent;
  assert.match(miss, /Not yet/);
  assert.equal(
    calls.set.length,
    0,
    "the picture does not change on a miss, so it cannot reveal the answer",
  );
  assert.equal(
    host.querySelector(".mc-numbers").textContent,
    numbers,
    "same problem after a miss: revise, do not skip",
  );

  // solve with the true value, found independently of the UI
  const seen = numbers.match(/= ([\d.]+)/g).map((s) => Number(s.slice(2)));
  const prob = newProblem(fig, KEY, startOf(KEY), "standard|try|0", {
    avoid: [problemAt(fig, KEY, startOf(KEY), "en").head.value],
  });
  assert.ok(seen.length > 0 && prob);
  type(host, ".mc-step.is-active input[type=text]", prob.problem.head.value);
  press(host, "Check");
  assert.equal(calls.set.length, 1, "solving shows the new picture");
  assert.deepEqual(calls.set[0], prob.values);
  assert.equal(calls.watch, 1);
  assert.match(host.querySelector(".mc-fb-ok").textContent, /Yes/);
  press(host, "Next");
  assert.match(host.querySelector(".mc-step.is-active").textContent, /Explain/);
  type(host, "textarea", "short");
  press(host, "Save");
  assert.match(host.querySelector(".mc-fb-miss").textContent, /little more/);
  type(host, "textarea", "I counted how many groups of the share fit in the supply.");
  press(host, "Save");
  assert.match(host.querySelector(".mc-step.is-active").textContent, /Apply/);
});

test("progress and the student's own sentence survive a reload, and a damaged save falls back to the start", () => {
  const { host } = mount("standard");
  press(host, "Next");
  const raw = localStorage.getItem(`neft_think_v1:${KEY}:standard`);
  assert.ok(raw);
  const again = document.createElement("div");
  mountThink(again, {
    fig,
    key: KEY,
    mode: "standard",
    lang: () => "en",
    base: startOf(KEY),
    setValues() {},
    watch() {},
  });
  assert.match(again.querySelector(".mc-step.is-active").textContent, /Try one/);
  localStorage.setItem(`neft_think_v1:${KEY}:standard`, '{"stage":99,"seed":{"try":-4},"done":1}');
  const bad = document.createElement("div");
  mountThink(bad, {
    fig,
    key: KEY,
    mode: "standard",
    lang: () => "en",
    base: startOf(KEY),
    setValues() {},
    watch() {},
  });
  assert.match(bad.querySelector(".mc-step.is-active").textContent, /See one/);
});

test("challenge flow: spot the slip, then build to a target; Spanish switches every word", () => {
  const { host, calls, setLang } = mount("challenge");
  assert.match(host.querySelector(".mc-step.is-active").textContent, /Spot the slip/);
  assert.equal(host.querySelectorAll("input[type=radio]").length, 4);
  const radios = [...host.querySelectorAll("input[type=radio]")];
  const labels = radios.map((r) => r.parentElement.textContent);
  const wrongSay = problemAt(
    fig,
    KEY,
    newProblem(fig, KEY, startOf(KEY), "challenge|spot|0", {
      avoid: [problemAt(fig, KEY, startOf(KEY), "en").head.value],
      needWrong: true,
    }).values,
    "en",
  ).wrong.say;
  const good = radios[labels.indexOf(wrongSay)];
  const bad = radios.find((r) => r !== good);
  bad.checked = true;
  bad.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  assert.match(host.querySelector(".mc-fb-miss").textContent, /Not quite/);
  assert.equal(calls.set.length, 0);
  setLang("es");
  assert.match(host.querySelector(".mc-step.is-active").textContent, /Encuentra el error/);
  assert.match(host.textContent, /Un estudiante resolvió esto/);
});
