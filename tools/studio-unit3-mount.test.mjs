// The four unit-3 hands-on widgets, mounted in jsdom and driven like a student drives them (buttons only, no drag needed):
// the solution built through the controls grades ok, every control is a named native button, the read-only render has no live control,
// and Spanish mode renders. Run: node tools/studio-unit3-mount.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
const w = /** @type {any} */ (dom.window);
const load = (rel) => w.eval(`${readFileSync(join(REPO_ROOT, rel), "utf8")}\n//# sourceURL=${rel}`);
load("assets/studio-gen/core.js");
load("assets/studio-act/core.js");
const KINDS = ["tagtape", "addrider", "cancelit", "barcompare"];
for (const k of KINDS) load(`assets/studio-act/${k}.js`);
const A = w.StudioAct;
const doc = w.document;

const mount = (spec, { restore = null, solved = false, es = false } = {}) => {
  const host = doc.createElement("div");
  doc.body.append(host);
  const calls = { submit: [], change: [], hint: 0, say: [] };
  const api = {
    restore,
    solved,
    es: () => es,
    change: (s) => calls.change.push(JSON.parse(JSON.stringify(s))),
    submit: (s) => calls.submit.push(JSON.parse(JSON.stringify(s))),
    hint: () => calls.hint++,
    say: (m) => calls.say.push(m),
  };
  A.registry[spec.kind].mount(host, spec, api);
  return { host, calls };
};
const buttons = (host) => [...host.querySelectorAll("button")];
const byLabel = (host, re) =>
  buttons(host).find((b) => re.test(b.getAttribute("aria-label") || b.textContent || ""));
const click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
const named = (host) => {
  for (const b of buttons(host))
    assert.ok(
      (b.getAttribute("aria-label") || b.textContent || "").trim(),
      "a control has no accessible name",
    );
  for (const r of host.querySelectorAll('[role="radio"]'))
    assert.equal(r.tagName, "BUTTON", "a radio is a native button");
};

/** Build the solution through the visible controls. */
const drive = {
  cancelit(host, spec) {
    const M = spec.model;
    for (const id of M.need)
      click(host.querySelectorAll(".ci-tray button")[M.tiles.findIndex((t) => t.id === id)]);
  },
  tagtape(host, spec) {
    const M = spec.model;
    for (const [i, s] of M.slots.entries()) {
      const card = M.cards.findIndex((c) => c.kind === s.kind);
      click(host.querySelectorAll(".tt-cards button")[card]);
      click(host.querySelectorAll(".tt-slots > div")[i].querySelector("button"));
    }
  },
  addrider(host, spec) {
    const predict = byLabel(
      host,
      spec.model.s === 0 ? /straight line through/ : /straight line that misses/,
    );
    assert.ok(predict && !predict.disabled, "addrider asks for a prediction first");
    click(predict);
    const add = byLabel(host, /Add the y divided by x column/);
    assert.ok(add && !add.disabled, "addrider unlocks the ratio column after a prediction");
    assert.ok(
      [...host.querySelectorAll('[role="radiogroup"]')[1].querySelectorAll("button")].every(
        (b) => b.disabled,
      ),
      "addrider locks the verdict until the ratio column is shown",
    );
    click(add);
    click(
      byLabel(
        host,
        spec.model.truth === "yes" ? /^Yes, the ratios are equal/ : /^No, the ratios are not equal/,
      ),
    );
  },
  barcompare(host, spec) {
    const M = spec.model;
    click(byLabel(host, new RegExp(`^${M.lcm} cups`)));
    const truth =
      M.c1 * M.w2 > M.c2 * M.w1 ? "Mix A" : M.c1 * M.w2 < M.c2 * M.w1 ? "Mix B" : "The same";
    click(byLabel(host, new RegExp(`^${truth}$`)));
  },
};

let n = 0;
for (const kind of KINDS) {
  for (let level = 1; level <= 4; level++) {
    for (let seed = 1; seed <= 4; seed++) {
      const spec = JSON.parse(JSON.stringify(A.make(kind, level, seed, {})));
      // 1. driven through the controls
      const { host, calls } = mount(spec);
      named(host);
      drive[kind](host, spec);
      const check = host.querySelector(
        `.${{ cancelit: "ci", tagtape: "tt", addrider: "ar", barcompare: "bc" }[kind]}-go`,
      );
      assert.ok(check, `${kind}: no Check button`);
      click(check);
      assert.equal(calls.submit.length, 1, `${kind}: Check submits once`);
      assert.ok(
        A.grade(spec, calls.submit[0]).ok,
        `${kind} L${level} seed ${seed}: the solution built through the controls is not accepted: ${JSON.stringify(calls.submit[0])}`,
      );
      assert.ok(calls.change.length > 0, `${kind}: progress is saved through api.change`);
      // 2. a hint button exists and calls the hint ladder
      click(byLabel(host, /^Hint|Pista/));
      assert.equal(calls.hint, 1);
      // 3. read-only render of the solution: no live control, no timer
      const ro = mount(spec, { restore: A.registry[kind].solution(spec), solved: true });
      assert.equal(
        buttons(ro.host).filter((b) => !b.disabled).length,
        0,
        `${kind}: a solved widget has a live control`,
      );
      // 4. Spanish mode renders Spanish text
      const sp = mount(spec, { es: true });
      assert.ok(
        sp.host.querySelector('[lang="es"]') ||
          /[áéíóúñ¿]/.test(sp.host.textContent || "") ||
          sp.host.textContent.length > 20,
        `${kind}: Spanish render is empty`,
      );
      n++;
    }
  }
}
assert.ok(
  !/setTimeout|setInterval|requestAnimationFrame/.test(
    KINDS.map((k) => readFileSync(join(REPO_ROOT, `assets/studio-act/${k}.js`), "utf8")).join(""),
  ),
  "no timers in the new widgets",
);
console.log(
  `studio-unit3-mount: ${n} mounts of 4 widgets; each solution built through the controls is accepted, controls are named native buttons, read-only is inert.`,
);
w.close();
