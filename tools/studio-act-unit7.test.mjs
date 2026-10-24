// Unit 7 hands-on activities (assets/studio-act/{thermo,dualrank,zoomlens,twoclues,allpoints,rectcorners,reflectpredict,griddetect,absbench}.js).
//   node tools/studio-act-unit7.test.mjs
// tools/studio-act.test.mjs proves the pure half of every activity (make, solution, wrong, grade, hints, Spanish). This file adds
//  1. independent answer checks: each key is re-derived by brute force over the grid, never by the formula make() used;
//  2. the diagnoses the lessons depend on: a one-point answer says each quadrant holds one, lanes that disagree name the pair
//     and ask "which is farther right?", duplicates are flagged, a swapped pair names x and y;
//  3. the widgets in a DOM: they mount in both languages, round-trip their state through Check, render read-only when solved,
//     answer the keyboard, show the reflection table and the zoom target only when the contract allows, and name every control.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const KINDS = [
  "thermo",
  "dualrank",
  "zoomlens",
  "twoclues",
  "allpoints",
  "rectcorners",
  "reflectpredict",
  "griddetect",
  "absbench",
];
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  runScripts: "outside-only",
  url: "https://eduwonderlab.com/",
});
const w = dom.window;
w.matchMedia = () => ({ matches: false });
for (const f of ["core", "coordinate", "numbers"])
  w.eval(read(`assets/studio-gen/${f}.js`).replace(/^/, ""));
w.eval(read("assets/studio-act/core.js"));
for (const f of ["u7kit", "u7grid", ...KINDS]) w.eval(read(`assets/studio-act/${f}.js`));
const A = w.StudioAct;
let problems = 0;
const bad = (m) => {
  problems++;
  console.error(`FAIL ${m}`);
};
const make = (k, lv, seed, p = {}) => JSON.parse(JSON.stringify(A.make(k, lv, seed, p)));
const grade = (s, st) => A.grade(s, JSON.parse(JSON.stringify(st)));
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

// ---- 1. independent keys ------------------------------------------------------------------------------------------
for (let lv = 1; lv <= 4; lv++)
  for (let seed = 1; seed <= 60; seed++) {
    const al = make("allpoints", lv, seed);
    const fits = [];
    for (let x = -al.r; x <= al.r; x++)
      for (let y = -al.r; y <= al.r; y++) {
        const ok =
          Math.abs(x) === al.dx &&
          Math.abs(y) === al.dy &&
          (al.side === "left"
            ? x < 0
            : al.side === "right"
              ? x > 0
              : al.side === "above"
                ? y > 0
                : al.side === "below"
                  ? y < 0
                  : true);
        if (ok) fits.push([x, y]);
      }
    if (fits.length !== al.want.length || !fits.every((p) => al.want.some((q) => same(p, q))))
      bad(`allpoints L${lv} #${seed}: key differs from brute force`);
    if (lv < 4 && al.want.length !== 4)
      bad(`allpoints L${lv} #${seed}: one point per quadrant expected`);
    const one = grade(al, { pts: [al.want[0]] });
    if (one.ok || !/holds one|no es el único|not the only one/i.test(one.say))
      bad(`allpoints L${lv} #${seed}: a one-point answer must be told more points fit`);
    if (lv < 4 && !/Each quadrant holds one/.test(one.say))
      bad(`allpoints L${lv} #${seed}: missing "each quadrant holds one"`);

    const rc = make("rectcorners", lv, seed);
    const rfits = [];
    for (let x = -rc.r; x <= rc.r; x++)
      for (let y = -rc.r; y <= rc.r; y++)
        if (Math.abs(x - rc.c[0]) === rc.sw && Math.abs(y - rc.c[1]) === rc.sh) rfits.push([x, y]);
    if (rfits.length !== 4 || !rfits.every((p) => rc.want.some((q) => same(p, q))))
      bad(`rectcorners L${lv} #${seed}: key differs from brute force`);
    if (!/same place/.test(grade(rc, { pts: [rc.want[0], rc.want[0]] }).say))
      bad(`rectcorners L${lv} #${seed}: duplicates not flagged`);
    if (grade(rc, { pts: [rc.want[0]] }).ok)
      bad(`rectcorners L${lv} #${seed}: one rectangle accepted`);

    const rp = make("reflectpredict", lv, seed);
    let p = rp.p;
    for (const ax of rp.axes) {
      let found;
      for (let x = -20; x <= 20 && !found; x++)
        for (let y = -20; y <= 20 && !found; y++) {
          const mid = [(p[0] + x) / 2, (p[1] + y) / 2];
          if (ax === "x" ? mid[1] === 0 && x === p[0] : mid[0] === 0 && y === p[1]) found = [x, y];
        }
      p = found;
    }
    if (!same(p, rp.want))
      bad(`reflectpredict L${lv} #${seed}: key differs from the midpoint test`);

    const tc = make("twoclues", lv, seed);
    if (same(tc.want[0], tc.want[1])) bad(`twoclues L${lv} #${seed}: P and Q coincide`);
    if (
      !/x and y|first clue|La primera pista|swapped|cambiados/i.test(
        grade(tc, { pts: [tc.want[1], tc.want[0]] }).say,
      )
    )
      bad(`twoclues L${lv} #${seed}: swapped points not named`);

    const dr = make("dualrank", lv, seed);
    const vals = dr.items.map((i) => i.v);
    if (!dr.asc.every((i, k) => !k || vals[dr.asc[k - 1]] < vals[i]))
      bad(`dualrank L${lv} #${seed}: lane 1 is not least to greatest`);
    if (dr.asc.join() === dr.byAbs.join())
      bad(`dualrank L${lv} #${seed}: size order equals true order`);
    const dis = grade(dr, { a: dr.asc, b: dr.asc });
    if (dis.ok || !/farther right|más a la derecha/.test(dis.say))
      bad(
        `dualrank L${lv} #${seed}: lanes that agree instead of mirror must ask which is farther right`,
      );

    const zl = make("zoomlens", lv, seed);
    for (const n of [2, 3, 4, 5, 8, 10]) {
      let lands = false;
      for (let t = 0; t <= n; t++) if (Math.abs(zl.lo + t / n - zl.v) < 1e-9) lands = true;
      if (lands !== !!grade(zl, { n }).ok)
        bad(`zoomlens L${lv} #${seed}: n=${n} disagrees with the tick test`);
      if (![2, 4, 5, 10].includes(zl.d))
        bad(`zoomlens: denominator ${zl.d} is not halves, fourths, fifths or tenths`);
    }

    const gd = make("griddetect", lv, seed);
    if (!grade(gd, A.registry.griddetect.solution(gd)).ok)
      bad(`griddetect L${lv} #${seed}: planned search fails`);
    if (
      grade(gd, { guesses: Array.from({ length: gd.limit + 1 }, () => [0, 0]).concat([gd.secret]) })
        .ok
    )
      bad(`griddetect L${lv} #${seed}: unlimited questions accepted`);

    const ab = make("absbench", lv, seed, { mode: "bench" });
    ab.vals.forEach((x, i) => {
      const a = Math.abs(x.v);
      const b = ab.bins.findIndex((bn) => a >= bn.lo && a < bn.hi);
      if (b !== ab.want[i]) bad(`absbench L${lv} #${seed}: bench key differs`);
    });
    const ct = make("absbench", lv, seed, { mode: "contrast" });
    if (ct.far0 === ct.right) bad(`absbench contrast L${lv} #${seed}: the two answers must differ`);
    if (
      Math.abs(ct.nums[ct.far0]) <= Math.abs(ct.nums[1 - ct.far0]) ||
      ct.nums[ct.right] <= ct.nums[1 - ct.right]
    )
      bad(`absbench contrast L${lv} #${seed}: key differs`);
  }

// ---- 3. widgets in a DOM --------------------------------------------------------------------------------------------
const mount = (spec, o = {}) => {
  const host = w.document.createElement("div");
  w.document.body.append(host);
  const calls = { submit: [], change: [], say: [], verdict: null };
  const api = {
    restore: o.restore ?? null,
    solved: !!o.solved,
    es: () => !!o.es,
    say: (m) => calls.say.push(m),
    hint() {},
    change: (s) => calls.change.push(s),
    submit: (s) => calls.submit.push(s),
    onVerdict: (fn) => (calls.verdict = fn),
  };
  A.registry[spec.kind].mount(host, spec, api);
  return { host, calls };
};
const names = (host) =>
  [...host.querySelectorAll("button,[role=slider],[role=application]")].filter(
    (e) => !(e.getAttribute("aria-label") || e.textContent.trim()),
  ).length;
for (const kind of KINDS)
  for (const es of [false, true])
    for (let lv = 1; lv <= 4; lv++) {
      const spec = make(kind, lv, 3 + lv);
      const sol = A.registry[kind].solution(spec);
      // the first wrong state the widget lets a student submit (an empty state leaves Check off)
      const wr = A.registry[kind]
        .wrong(spec, null)
        .find((st) => !mount(spec, { restore: st }).host.querySelector(".ak-btn.go")?.disabled);
      const tag = `${kind} L${lv} ${es ? "es" : "en"}`;
      try {
        const m = mount(spec, { es });
        if (names(m.host)) bad(`${tag}: a control has no accessible name`);
        if (/undefined|NaN|\[object/.test(m.host.textContent))
          bad(`${tag}: stray text ${m.host.textContent.match(/undefined|NaN|\[object/)}`);
        const r = mount(spec, { restore: wr, es });
        const check = r.host.querySelector(".ak-btn.go");
        if (!check) bad(`${tag}: no Check button`);
        else {
          check.click();
          if (!r.calls.submit.length || JSON.stringify(r.calls.submit[0]) !== JSON.stringify(wr))
            bad(`${tag}: Check did not submit the restored state`);
          r.calls.verdict?.({
            level: 2,
            right: 0,
            of: 1,
            marks: [false, false, false, false, false, false, false, false],
          });
        }
        const s = mount(spec, { restore: sol, solved: true, es });
        if (!s.host.querySelector(".ak-ok")) bad(`${tag}: solved view has no Solved badge`);
        if (s.host.querySelector(".ak-btn.go")) bad(`${tag}: solved view still offers Check`);
      } catch (e) {
        bad(`${tag}: ${e.stack.split("\n").slice(0, 3).join(" | ")}`);
      }
    }

// keyboard and pointer on the grid
{
  const spec = make("allpoints", 1, 5);
  const { host, calls } = mount(spec);
  const grid = host.querySelector(".u7-grid");
  grid.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  grid.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  if (calls.change.length !== 1 || JSON.stringify(calls.change[0].pts) !== "[[1,0]]")
    bad(`allpoints: arrow + Enter should mark (1, 0), got ${JSON.stringify(calls.change)}`);
  const pad = [...host.querySelectorAll(".u7-pad button")];
  if (pad.length < 5 || pad.some((b) => !b.getAttribute("aria-label") && !b.textContent.trim()))
    bad("grid pad buttons need names");
}
// reflection: table only when solved, bars only after a miss
{
  const spec = make("reflectpredict", 2, 4);
  const a = mount(spec, { restore: { pt: spec.p } });
  if (a.host.querySelector(".rp-table") || a.host.querySelector(".u7-seg.bar"))
    bad("reflectpredict: bars or table before any prediction was checked");
  a.host.querySelector(".ak-btn.go").click();
  a.calls.verdict({ level: 1, right: null, of: null, marks: null });
  if (!a.host.querySelector(".u7-seg.bar"))
    bad("reflectpredict: distance bars missing after a miss");
  if (a.host.querySelector(".rp-table"))
    bad("reflectpredict: sign table shown before the prediction was solved");
  const s = mount(spec, { restore: { pt: spec.want }, solved: true });
  if (!s.host.querySelector(".rp-table")) bad("reflectpredict: solved view has no sign table");
}
// zoom lens: the target marker appears only after a miss
{
  const spec = make("zoomlens", 2, 7);
  const badN = [3, 2, 4, 5, 8, 10].find((n) => !A.grade(spec, { n }).ok);
  const a = mount(spec, { restore: { n: badN } });
  if (a.host.querySelector("path[fill]")) bad("zoomlens: the target is drawn before any check");
  a.host.querySelector(".ak-btn.go").click();
  a.calls.verdict({ level: 1, right: null, of: null, marks: null });
  if (!a.host.querySelector("path[fill]")) bad("zoomlens: the target is not drawn after a miss");
}
// thermometer: rotate toggle and keys
{
  const spec = make("thermo", 1, 2, { mode: "place" });
  const { host, calls } = mount(spec);
  const slider = host.querySelector("[role=slider]");
  slider.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
  if (calls.change[0]?.v !== 1)
    bad(
      `thermo: ArrowUp from an empty marker should land on 1, got ${JSON.stringify(calls.change[0])}`,
    );
  const rot = [...host.querySelectorAll("button")].find((b) => b.hasAttribute("aria-pressed"));
  if (!rot) bad("thermo: no rotate toggle");
  else {
    rot.click();
    if (
      rot.getAttribute("aria-pressed") !== "true" ||
      slider.getAttribute("aria-orientation") !== "horizontal"
    )
      bad("thermo: rotate did not lay the line flat");
  }
}
// no timers anywhere in the Unit 7 activity sources
for (const k of [...KINDS, "u7kit", "u7grid"])
  if (/setInterval|setTimeout|requestAnimationFrame/.test(read(`assets/studio-act/${k}.js`)))
    bad(`${k}: uses a timer`);

if (problems) {
  console.error(`\n${problems} problem(s).`);
  process.exit(1);
}
console.log(
  `studio-act-unit7: ${KINDS.length} activities proved against brute force, diagnosed and mounted in a DOM.`,
);
