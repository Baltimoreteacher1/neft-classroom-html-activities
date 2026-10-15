// Living Math Canvas in a real DOM (jsdom): pictures, keyboard, synchronized highlight, and the six-stage flow for every scene.
//   node tools/ewl-canvas-dom.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { loadEwl } from "./lib/ewl-vm.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const data = JSON.parse(read("data/ewl/canvas-scenes.json"));
const MODULES = [
  "rational.js",
  "state-store.js",
  "reasoning.js",
  "ui.js",
  "lens.js",
  "lens-rational.js",
  "lens-rational-line.js",
  "lens-rational-fit.js",
  "lens-ratio.js",
  "lens-ratio-plane.js",
  "lens-equation.js",
  "lens-scale.js",
  "canvas-kinds.js",
  "canvas-validate.js",
];
const { EWL } = loadEwl({ only: MODULES });
const { Rat } = EWL;
let checks = 0;
const ok = (c, m) => {
  checks += 1;
  assert.ok(c, m);
};

// ---- 6. the real DOM: pictures, keyboard, sync and the stage flow in jsdom -------------------------------------
const dom = new JSDOM('<!doctype html><html lang="en"><body><div id="root"></div></body></html>', {
  url: "https://eduwonderlab.com/curriculum/math-canvas/",
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
const w = dom.window;
w.NeftSaveResume = undefined;
for (const f of [
  ...MODULES,
  "canvas-ui.js",
  "canvas-panels.js",
  "canvas-controls.js",
  "canvas-flow.js",
])
  w.eval(read(`assets/ewl/${f}`));
const E = w.EWL;
const doc = w.document;
const host = doc.getElementById("root");
let figures = 0;
let focusMoves = 0;
for (const s of data.scenes) {
  const kind = E.Canvas.kinds[s.kind];
  const spec = kind.spec(kind.init(s.presets.filter((p) => p.id === s.defaultPreset)[0].params), s);
  const box = doc.createElement("div");
  host.appendChild(box);
  const lens = E.Lens.mount(box, spec);
  const reps = lens.reps();
  ok(reps.length === s.reps.length, `${s.id}: ${s.reps.length} pictures drawn`);
  ok(
    reps.every((r) => E.Rat.parse(r.value).eq(lens.value())),
    `${s.id}: lens.reps() values all equal the amount`,
  );
  for (const fig of box.querySelectorAll(".lens-rep")) {
    const svg = fig.querySelector("svg");
    const table = fig.querySelector("table");
    const label = (svg || table).getAttribute("aria-label");
    ok(label && label.length > 20, `${s.id}/${fig.dataset.rep}: has a text alternative`);
    if (svg)
      ok(
        svg.querySelector("title") && svg.querySelector("desc"),
        `${s.id}/${fig.dataset.rep}: <title> and <desc>`,
      );
    const ps = fig.querySelectorAll(".lens-part");
    ok(
      [...ps].every((p) => p.getAttribute("role") === "button" && p.getAttribute("aria-label")),
      `${s.id}/${fig.dataset.rep}: every part is a labelled button`,
    );
    ok(
      [...ps].filter((p) => p.getAttribute("tabindex") === "0").length === 1,
      `${s.id}/${fig.dataset.rep}: one tab stop`,
    );
    figures += 1;
  }
  // pointing at one part lights something in at least two pictures
  const all = [...box.querySelectorAll(".lens-part")];
  const first = all.filter((p) => p.closest("[data-rep]").dataset.rep === s.reps[0])[0];
  first.dispatchEvent(new w.Event("focus"));
  const lit = [...box.querySelectorAll("[data-hl]")].map(
    (e) => e.closest("[data-rep]").dataset.rep,
  );
  ok(
    new Set(lit).size >= Math.min(2, s.reps.length),
    `${s.id}: focus lights ${new Set(lit).size} pictures`,
  );
  ok(
    box.querySelector(".lens-caption").textContent.length > 0,
    `${s.id}: caption names the amount`,
  );
  // keyboard: arrows move the tab stop, Enter pins
  const rep0 = box.querySelector(`[data-rep="${s.reps[0]}"]`);
  const ps0 = [...rep0.querySelectorAll(".lens-part")];
  if (ps0.length > 1) {
    ps0[0].dispatchEvent(
      new w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }),
    );
    ok(
      ps0[1].getAttribute("tabindex") === "0" && ps0[0].getAttribute("tabindex") === "-1",
      `${s.id}: ArrowRight moves the roving tab stop`,
    );
    focusMoves += 1;
  }
  ps0[0].dispatchEvent(
    new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
  );
  ok(ps0[0].getAttribute("aria-pressed") === "true", `${s.id}: Enter pins a part`);
  lens.highlight(null);
  lens.destroy();
}
// external highlight, set(), compare and destroy
{
  const box = doc.createElement("div");
  host.appendChild(box);
  const lens = E.Lens.mount(box, {
    family: "rational",
    value: "3/5",
    reps: ["strip", "grid", "percent"],
  });
  const seen = [];
  lens.onChange((e) => seen.push(e.type));
  lens.highlight("0~3/5");
  ok(
    box.querySelectorAll("[data-hl]").length > 60,
    "highlighting the shaded amount lights strip, grid and percent",
  );
  ok(lens.set("1 1/2") && lens.value().eq(E.Rat.of(3, 2)), "set('1 1/2')");
  ok(lens.set("150%") && lens.value().eq(E.Rat.of(3, 2)), "set('150%')");
  ok(
    !lens.set("banana") && lens.value().eq(E.Rat.of(3, 2)),
    "an unreadable amount leaves the lens as it was",
  );
  ok(
    seen.indexOf("value") >= 0 && seen.indexOf("highlight") >= 0,
    "onChange reports value and highlight",
  );
  lens.destroy();
  const box2 = doc.createElement("div");
  host.appendChild(box2);
  const cmp = E.Lens.compare(
    box2,
    { family: "rational", value: "3/5", reps: ["strip"] },
    { family: "rational", value: "6/10", den: 10, reps: ["strip"] },
  );
  cmp.a.highlight("1/5~2/5");
  const cell = box2.querySelectorAll(".lens-side")[1].querySelectorAll(".lens-part")[2];
  cmp.b.highlight("1/5~2/5");
  ok(
    cell.getAttribute("data-hl") === "1" ||
      box2.querySelectorAll(".lens-side")[1].querySelectorAll("[data-hl]").length === 2,
    "compare: the shared highlight reaches both sides",
  );
  cmp.destroy();
}

// the whole path, for every scene, with the keyboard-equivalent controls
function drive(scene) {
  w.localStorage.clear();
  E.state.reset();
  const root = doc.createElement("div");
  host.appendChild(root);
  const flow = E.Canvas.Flow.mount(root, scene, {});
  const q = (sel) => root.querySelector(sel);
  const click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  const type = (el, v) => {
    el.value = v;
  };
  const stageName = () => q(".cv-steps [aria-current]").textContent;
  const pAns = scene.predict.answer;
  const task = E.Canvas.task(scene.predict.task.kind, scene.predict.task.args);
  const answer = (t, a) => {
    if (a.type === "choice") {
      const r = [...root.querySelectorAll(".cv-ask input[type=radio]")].filter((i) =>
        E.Rat.parse(i.value).eq(t.answer),
      )[0];
      r.checked = true;
      r.dispatchEvent(new w.Event("change", { bubbles: true }));
    } else type(q(".cv-ask .cv-input"), t.answer.frac());
  };
  const checkBtn = () =>
    [...root.querySelectorAll(".cv-ask .ewl-btn")].filter((b) =>
      /^(Check|Comprobar)$/.test(b.textContent),
    )[0];
  ok(/Predict/.test(stageName()), `${scene.id}: starts at Predict`);
  ok(!q(".cv-lens"), `${scene.id}: the picture is hidden before the prediction`);
  // two wrong tries -> question, picture; the checked result is only offered after two attempts
  let wrong = E.Rat.of(7919);
  const rule = E.Reason.rules().filter((r) => r.kinds.indexOf(task.kind) >= 0 && r.wrong(task))[0];
  if (pAns.type === "choice") {
    const r = [...root.querySelectorAll(".cv-ask input[type=radio]")].filter(
      (i) => !E.Rat.parse(i.value).eq(task.answer),
    )[0];
    r.checked = true;
    r.dispatchEvent(new w.Event("change", { bubbles: true }));
  } else type(q(".cv-ask .cv-input"), rule ? rule.wrong(task).frac() : wrong.frac());
  click(checkBtn());
  ok(
    q(".cv-fb .ewl-msg") && q(".cv-fb .ewl-msg").dataset.kind === "warn",
    `${scene.id}: a wrong prediction gets a question`,
  );
  ok(
    ![...root.querySelectorAll(".cv-ask .ewl-btn")].some(
      (b) => /Show checked result/.test(b.textContent) && !b.hidden,
    ),
    `${scene.id}: no checked result after one attempt`,
  );
  ok(!q(".cv-lens"), `${scene.id}: picture still hidden after one wrong try`);
  click(checkBtn());
  ok(q(".cv-lens"), `${scene.id}: picture appears at the second try`);
  ok(
    [...root.querySelectorAll(".cv-ask .ewl-btn")].some(
      (b) => /Show checked result/.test(b.textContent) && !b.hidden,
    ),
    `${scene.id}: checked result offered after two attempts`,
  );
  ok(
    !/Here is the checked result/.test(q(".cv-fb").textContent),
    `${scene.id}: help does not reveal the result`,
  );
  // now get it right
  answer(task, pAns);
  if (pAns.type === "choice") answer(task, pAns);
  click(checkBtn());
  const next1 = [...root.querySelectorAll(".cv-ask .ewl-btn")].filter(
    (b) => !b.hidden && /Next/.test(b.textContent),
  )[0];
  ok(next1, `${scene.id}: correct prediction offers the next stage`);
  click(next1);
  ok(/Try it/.test(stageName()), `${scene.id}: Manipulate`);
  ok(q(".cv-lens svg, .cv-lens table"), `${scene.id}: pictures mounted`);
  // try settings until enough
  let guard = 0;
  const nextBtn = () =>
    [...root.querySelectorAll(".cv-panel .cv-actions .ewl-btn")].filter((b) =>
      /Next/.test(b.textContent),
    )[0];
  while (nextBtn().hasAttribute("disabled") && guard++ < 40) {
    const cands = [
      ...root.querySelectorAll(
        '.cv-panel .cv-chips .ewl-chip[aria-pressed="false"], .cv-panel .cv-step:not([disabled]), .cv-panel .cv-actions-row .ewl-btn',
      ),
    ];
    const pick = cands[guard % cands.length];
    if (!pick) break;
    click(pick);
  }
  ok(!nextBtn().hasAttribute("disabled"), `${scene.id}: enough settings tried`);
  click(nextBtn());
  ok(/Observe/.test(stageName()), `${scene.id}: Observe`);
  ok(q(".cv-facts").textContent.length > 5, `${scene.id}: live readout`);
  scene.observe.statements.forEach((s, i) => {
    const cb = root.querySelectorAll(".cv-panel input[type=checkbox]")[i];
    cb.checked = s.true;
  });
  click(
    [...root.querySelectorAll(".cv-panel .ewl-btn")].filter((b) =>
      /^Check$/.test(b.textContent),
    )[0],
  );
  click(
    [...root.querySelectorAll(".cv-panel .ewl-btn")].filter(
      (b) => /Next: explain/.test(b.textContent) && !b.hidden,
    )[0],
  );
  ok(/Explain/.test(stageName()), `${scene.id}: Explain`);
  const words = scene.explain.spec.vocab[0];
  const num = scene.explain.spec.numbers[0];
  type(
    q(".cv-panel textarea"),
    `The answer is ${num} because we use ${words} and show the work with a picture, so it makes sense. But it would not work if the numbers change.`,
  );
  click(
    [...root.querySelectorAll(".cv-panel .ewl-btn")].filter((b) =>
      /Check my explanation/.test(b.textContent),
    )[0],
  );
  ok(q(".cv-rubric li"), `${scene.id}: rubric shown`);
  const nextExplain = [...root.querySelectorAll(".cv-panel .ewl-btn")].filter((b) =>
    /Next: find the rule/.test(b.textContent),
  )[0];
  for (let k = 0; k < 3 && nextExplain.hidden; k++)
    click(
      [...root.querySelectorAll(".cv-panel .ewl-btn")].filter((b) =>
        /Check my explanation/.test(b.textContent),
      )[0],
    );
  click(nextExplain);
  ok(/Generalize/.test(stageName()), `${scene.id}: Generalize`);
  const radios = [...root.querySelectorAll(".cv-ask input[type=radio]")];
  const correctText = scene.generalize.choices.filter((c) => c.ok)[0].text;
  const right = radios.filter((r) => r.parentElement.textContent === correctText)[0];
  const wrongR = radios.filter((r) => r !== right)[0];
  wrongR.checked = true;
  wrongR.dispatchEvent(new w.Event("change", { bubbles: true }));
  click(checkBtn());
  ok(q(".cv-fb .ewl-msg").dataset.kind === "warn", `${scene.id}: wrong rule gets a question`);
  right.checked = true;
  right.dispatchEvent(new w.Event("change", { bubbles: true }));
  click(checkBtn());
  click(
    [...root.querySelectorAll(".cv-ask .ewl-btn")].filter(
      (b) => !b.hidden && /Next/.test(b.textContent),
    )[0],
  );
  ok(/Transfer/.test(stageName()), `${scene.id}: Transfer`);
  const tr = E.Canvas.makeTransfer(scene, 0);
  ok(
    q(".cv-transfer .cv-prompt").textContent === tr.prompt,
    `${scene.id}: transfer prompt is the seeded problem`,
  );
  if (tr.answer.type === "choice") answer(tr.task, tr.answer);
  else type(q(".cv-transfer .cv-input"), tr.task.answer.frac());
  click(checkBtn());
  ok(q(".cv-finish"), `${scene.id}: finished`);
  const saved = E.state.get();
  ok(
    saved.canvas[scene.id] &&
      saved.canvas[scene.id].done === true &&
      saved.canvas[scene.id].stage === "transfer",
    `${scene.id}: progress saved`,
  );
  const ev = saved.evidence[scene.activity] || [];
  ok(
    ev.length >= 6 &&
      ev.some((e) => e.prediction) &&
      ev.some((e) => e.argument) &&
      ev.some((e) => e.claim),
    `${scene.id}: evidence saved (${ev.length} entries)`,
  );
  ok(
    ev.every((e) => !("name" in e) && !("student" in e)),
    `${scene.id}: no student identity in evidence`,
  );
  ok(
    E.ID_RE.test(scene.activity) && Object.keys(saved.evidence).every((k) => E.ID_RE.test(k)),
    `${scene.id}: evidence keys are valid activity ids`,
  );
  flow.destroy();
  root.remove();
}
for (const s of data.scenes) drive(s);

// resume: a saved stage is where the scene opens
{
  w.localStorage.clear();
  E.state.reset();
  E.state.setCanvas("equivalent-names", { stage: "explain", done: false });
  const root = doc.createElement("div");
  host.appendChild(root);
  const flow = E.Canvas.Flow.mount(root, data.scenes[0], {});
  ok(
    /Explain/.test(root.querySelector(".cv-steps [aria-current]").textContent),
    "resumes at the saved stage",
  );
  ok(
    root.querySelector(".cv-steps li:nth-child(5) button").hasAttribute("disabled"),
    "later stages stay locked",
  );
  flow.destroy();
}
// Spanish
{
  w.localStorage.setItem("ewl_lang", "es");
  const root = doc.createElement("div");
  host.appendChild(root);
  const flow = E.Canvas.Flow.mount(root, data.scenes[0], {});
  ok(
    /Una cantidad, muchos nombres/.test(root.textContent) && /Predice/.test(root.textContent),
    "?lang=es shows Spanish",
  );
  ok(!/Predict\b/.test(root.querySelector(".cv-steps").textContent), "stage names are Spanish");
  flow.destroy();
  w.localStorage.removeItem("ewl_lang");
}
// self tests registered for ?diag=1
{
  const results = E.selfTests.filter((t) => /^canvas:/.test(t.name)).map((t) => t.run());
  ok(
    results.length >= 3 && results.every((r) => r === true),
    `canvas self tests: ${results.join(",")}`,
  );
}

console.log(
  `ewl-canvas-dom: ${data.scenes.length} scenes, ${figures} figures, ${focusMoves} keyboard moves, ${checks} checks ok.`,
);
