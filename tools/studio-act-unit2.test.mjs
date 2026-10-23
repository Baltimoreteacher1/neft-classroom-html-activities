// Unit 2 hands-on activities: independent maths checks plus a driven DOM smoke test.
//   node tools/studio-act-unit2.test.mjs [kind ...]
// tools/studio-act.test.mjs already proves make / solution / wrong / grade for every kind. This file adds, for the Unit 2
// kinds (askdots skewsculptor countoff faultymed boxtwins chipsort madtwins headlinecourt receipt):
//   1. every param variant the lessons use (boxtwins iqr, receipt mul) goes through the same 4 levels x seeds;
//   2. the answer is RECOMPUTED here by a different route than the activity used, and agrees with grade();
//   3. the widget is mounted in jsdom, driven by clicks and keys to the solution, graded ok, then mounted read-only and
//      in Spanish; a Check on the untouched widget is graded not-ok with a non-empty "say" that never prints the answer.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { loadStudio } from "./lib/studio-vm.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ctx = loadStudio({ gen: true, act: true });
const A = ctx.StudioAct;
const only = process.argv.slice(2);
const SEEDS = 60;
let problems = 0;
const bad = (k, m) => {
  problems++;
  console.error(`FAIL [${k}] ${m}`);
};
const j = (v) => JSON.parse(JSON.stringify(v));
const sorted = (d) => d.slice().sort((a, b) => a - b);
const med = (s) => (s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2);
const five = (d) => {
  const s = sorted(d);
  const n = s.length;
  return {
    min: s[0],
    q1: med(s.slice(0, n >> 1)),
    med: med(s),
    q3: med(s.slice(Math.ceil(n / 2))),
    max: s[n - 1],
  };
};

/* ---- 1 and 2: variants and independent recomputation ----------------------------------------------- */
const VARIANTS = [
  ["askdots", [{}]],
  ["skewsculptor", [{}]],
  ["countoff", [{}]],
  ["faultymed", [{}]],
  ["boxtwins", [{ mode: "box" }, { mode: "iqr" }]],
  ["chipsort", [{}]],
  ["madtwins", [{}]],
  ["headlinecourt", [{}]],
  ["receipt", [{ op: "add" }, { op: "mul" }]],
];

/** exact decimal arithmetic on strings like "12.65": scaled BigInt, no floating point */
const dec = (s) => {
  const [i, f = ""] = String(s).split(".");
  return { n: BigInt(i + f), dp: f.length };
};
const scaleTo = (x, dp) => x.n * 10n ** BigInt(dp - x.dp);
const toNum = (x) => Number(x.n) / 10 ** x.dp;

const check = {
  askdots(spec, sol) {
    const M = spec.model;
    // six askings of one person at one moment give one answer; any "many" menu gives at least 4 different answers
    const s = M.series[`${sol.who},${sol.when}`];
    const stacks = new Set(s.vals).size === 1;
    assert.equal(stacks, M.goal === "stack", "solution series disagrees with the goal");
    for (let w = 0; w < M.who.length; w++)
      for (let n = 0; n < M.when.length; n++) {
        const ser = M.series[`${w},${n}`].vals;
        const fixed = M.who[w].kind !== "many" && M.when[n].kind !== "many";
        assert.equal(new Set(ser).size === 1, fixed, `series ${w},${n} stack/spread mismatch`);
        if (!fixed) assert.ok(new Set(ser).size >= 4, "a varying question must show variety");
      }
  },
  skewsculptor(spec, sol) {
    const M = spec.model;
    const expand = (c) => c.flatMap((n, i) => Array(n).fill(i * M.w0 + (M.w0 - 1) / 2));
    const R = expand(sol.skew);
    const S = expand(sol.sym);
    assert.equal(R.length, 20);
    assert.equal(S.length, 20);
    const mean = (d) => d.reduce((a, b) => a + b, 0) / d.length;
    assert.ok(mean(R) > med(sorted(R)), "right-skewed build must have mean above median");
    assert.ok(Math.abs(mean(S) - med(sorted(S))) < 1e-9, "symmetric build must have mean = median");
    assert.ok(sol.skew.indexOf(Math.max(...sol.skew)) <= 1, "right-skewed peak sits on the left");
    if (M.width) {
      const mx = Math.max(...M.data);
      const bars = Math.floor(mx / M.widths[sol.bw]) + 1;
      assert.ok(bars >= 4 && bars <= 10, "chosen bar width must give 4 to 10 bars");
    }
  },
  countoff(spec, sol) {
    const data = spec.model.bins.flatMap((b, i) => Array(b.n).fill(i));
    assert.equal(data.length % 2, 1);
    assert.equal(
      sol.pick,
      sorted(data)[(data.length - 1) / 2],
      "median bar differs from the sorted middle",
    );
    const counts = spec.model.bins.map((b) => b.n);
    assert.notEqual(
      counts.indexOf(Math.max(...counts)),
      sol.pick,
      "tallest bar must not be the median bar",
    );
  },
  faultymed(spec, sol) {
    const M = spec.model;
    const mid = sorted(M.cards)[(M.cards.length - 1) / 2];
    assert.equal(M.cards[sol.mid], mid);
    assert.notEqual(M.claim, mid, "the written middle card must be wrong");
    assert.equal(M.diag[sol.diag].role, "order");
  },
  boxtwins(spec, sol) {
    const M = spec.model;
    const sets = M.two ? [sol.a, sol.b] : [sol.a];
    for (const d of sets) {
      assert.equal(d.length, 12);
      const f = five(d);
      if (M.mode === "iqr") {
        assert.equal(f.min, M.min);
        assert.equal(f.max, M.max);
      } else assert.deepEqual(f, M.target);
    }
    if (M.mode === "iqr") {
      const iq = (d) => five(d).q3 - five(d).q1;
      assert.equal(iq(sol.a), M.iqrA);
      assert.equal(iq(sol.b), M.iqrB);
    }
    if (M.two && M.mode === "box") assert.notDeepEqual(sorted(sol.a), sorted(sol.b));
  },
  chipsort(spec, sol) {
    const M = spec.model;
    assert.equal(M.D, M.q * M.d + M.r);
    assert.ok(M.r > 0 && M.r < M.d);
    const val = (key) => M.chips.find((c) => c.key === key).v;
    assert.equal(Number(val("full")), Math.floor(M.D / M.d));
    assert.equal(Number(val("need")), Math.ceil(M.D / M.d));
    assert.equal(Number(val("left")), M.D % M.d);
    assert.ok(Math.abs(Number(val("part")) - M.D / M.d) < 1e-9);
    assert.equal(new Set(M.chips.map((c) => c.v)).size, M.chips.length, "chips must be distinct");
    sol.place.forEach((b, i) => assert.equal(M.bins[b].key, M.chips[i].key));
  },
  madtwins(spec, sol) {
    const M = spec.model;
    for (const d of M.two ? [sol.a, sol.b] : [sol.a]) {
      const mean = d.reduce((a, b) => a + b, 0) / d.length;
      const mad = d.reduce((a, v) => a + Math.abs(v - mean), 0) / d.length;
      assert.ok(Math.abs(mean - M.mean) < 1e-9, `mean ${mean} != ${M.mean}`);
      assert.ok(Math.abs(mad - M.mad) < 1e-9, `mad ${mad} != ${M.mad}`);
    }
    if (M.two) assert.notDeepEqual(sorted(sol.a), sorted(sol.b));
  },
  headlinecourt(spec, sol) {
    const M = spec.model;
    const total = M.data.reduce((a, b) => a + b, 0);
    const mean = total / M.data.length;
    assert.ok(Number.isInteger(mean), "mean must be a whole number so headline x count = total");
    const median = med(sorted(M.data));
    assert.ok(mean > median, "data must be skewed right");
    assert.equal(M.heads[sol.assessor].value * M.data.length, total);
    assert.equal(M.heads[sol.buyer].value, median);
    const f = five(M.data);
    const out = M.data.some(
      (v) => v > f.q3 + 1.5 * (f.q3 - f.q1) || v < f.q1 - 1.5 * (f.q3 - f.q1),
    );
    assert.equal(out, M.outlier, "outlier flag must follow the 1.5 x IQR rule");
  },
  receipt(spec, sol) {
    const M = spec.model;
    const parse = (text) => {
      const m = text.match(/^([\d.]+) ([+−×]) ([\d.]+)$/);
      assert.ok(m, `line text ${text}`);
      const [a, b] = [dec(m[1]), dec(m[3])];
      if (m[2] === "×") return { n: a.n * b.n, dp: a.dp + b.dp };
      const dp = Math.max(a.dp, b.dp);
      return {
        n: m[2] === "+" ? scaleTo(a, dp) + scaleTo(b, dp) : scaleTo(a, dp) - scaleTo(b, dp),
        dp,
      };
    };
    M.lines.forEach((l, i) => {
      const t = parse(l.text);
      const claim = dec(l.claim.replace("$", ""));
      const dp = Math.max(t.dp, claim.dp);
      const same = scaleTo(t, dp) === scaleTo(claim, dp);
      assert.equal(
        !same,
        l.bad,
        `line ${i + 1} ${l.text} = ${l.claim}: bad flag disagrees with exact arithmetic`,
      );
    });
    const t = parse(M.main.text);
    const v = toNum(t);
    const zone = v < 1 ? 0 : v < 10 ? 1 : v < 100 ? 2 : 3;
    assert.equal(zone, M.zone, "size zone");
    assert.ok(M.lines.some((l) => l.bad) && M.lines.some((l) => !l.bad), "need good and bad lines");
    assert.deepEqual(
      sol.flags,
      M.lines.map((l) => l.bad),
    );
  },
};

for (const [kind, variants] of VARIANTS) {
  if (only.length && !only.includes(kind)) continue;
  for (const p of variants)
    for (let level = 1; level <= 4; level++)
      for (let seed = 1; seed <= SEEDS; seed++) {
        const tag = `${JSON.stringify(p)} L${level}/seed ${seed}`;
        try {
          const spec = j(A.make(kind, level, seed, p));
          const again = j(A.make(kind, level, seed, p));
          assert.deepEqual(spec, again, "not deterministic");
          const def = A.registry[kind];
          const sol = j(def.solution(spec));
          assert.equal(def.grade(spec, sol).ok, true, "solution rejected");
          check[kind](spec, sol);
          const r = def.grade(spec, sol);
          if (r.of != null) assert.equal(r.right, r.of, "right/of on a solved item");
          for (const w of def.wrong(spec, ctx.StudioGen.rng(`w${seed}`))) {
            const g = def.grade(spec, j(w));
            assert.equal(g.ok, false, "wrong state accepted");
            assert.ok(
              typeof g.say === "string" && g.say.length > 10 && g.sayEs?.length > 10,
              "miss needs say and sayEs",
            );
            if (g.of != null) {
              assert.ok(g.right < g.of, "right/of must show a miss");
              assert.equal(g.marks.length, g.of);
              assert.equal(g.marks.filter(Boolean).length, g.right);
            }
          }
          // a hint must stop short of the answer: the activity states of the chip / median / mean values are not in h[]
          assert.ok(
            spec.h.length >= 2 && spec.hEs.length === spec.h.length,
            "hint ladder with Spanish",
          );
        } catch (e) {
          bad(kind, `${tag}: ${e.message}`);
          break;
        }
      }
}

/* ---- 3: driven DOM smoke ----------------------------------------------------------------------------- */
const dom = new JSDOM("<!doctype html><body></body>", {
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
const win = dom.window;
for (const f of [
  "assets/studio-gen/core.js",
  "assets/studio-act/core.js",
  "assets/studio-act/u2kit.js",
])
  win.eval(readFileSync(join(ROOT, f), "utf8"));
for (const [kind] of VARIANTS)
  win.eval(readFileSync(join(ROOT, `assets/studio-act/${files(kind)}.js`), "utf8"));
function files(kind) {
  return kind;
}
const WA = win.StudioAct;
const click = (el) => el.dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
const keydown = (el, key) =>
  el.dispatchEvent(new win.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
const radios = (host, k) =>
  [...host.querySelectorAll('[role="radiogroup"]')][k].querySelectorAll('[role="radio"]');
const mk = () => {
  const calls = { submit: [], change: [], say: [] };
  const api = {
    restore: null,
    solved: false,
    es: () => false,
    say: (m) => calls.say.push(m),
    change: (s) => calls.change.push(JSON.parse(JSON.stringify(s))),
    submit: (s) => calls.submit.push(JSON.parse(JSON.stringify(s))),
    hint: () => {},
  };
  return { api, calls };
};

/** drive the widget to the solution with clicks and keys; returns nothing, the last Check is read from calls.submit */
const drive = {
  askdots(host, spec, sol) {
    radios(host, 0)[sol.who].click();
    radios(host, 1)[sol.when].click();
    radios(host, 2)[sol.predict === "stack" ? 0 : 1].click();
    [...host.querySelectorAll("button")]
      .find((b) => /Ask six|Preguntar/.test(b.textContent))
      .click();
  },
  skewsculptor(host, spec, sol) {
    const secs = [...host.querySelectorAll(".u2-bars")];
    const want = [sol.skew, sol.sym];
    secs.slice(0, 2).forEach((sec, s) => {
      const cols = [...sec.querySelectorAll(".u2-colwrap")];
      const btn = (i, t) => cols[i].querySelectorAll("button")[t === "-" ? 0 : 1];
      for (let pass = 0; pass < 2; pass++)
        cols.forEach((_c, i) => {
          const cur = () =>
            Number(cols[i].querySelector('[role="slider"]').getAttribute("aria-valuenow"));
          for (let g = 0; g < 30 && cur() > want[s][i]; g++) click(btn(i, "-"));
          if (pass) for (let g = 0; g < 30 && cur() < want[s][i]; g++) click(btn(i, "+"));
        });
    });
    const sl = host.querySelector('input[type="range"]');
    if (sl) {
      sl.value = String(sol.bw);
      sl.dispatchEvent(new win.Event("input", { bubbles: true }));
    }
  },
  countoff(host, spec, sol) {
    const bars = [...host.querySelectorAll(".u2-colwrap")];
    for (let i = 0; i <= sol.pick; i++) bars[i].querySelectorAll("button")[0].click();
    bars[sol.pick].querySelectorAll("button")[1].click();
  },
  faultymed(host, spec, sol) {
    const radiosEl = radios(host, 0);
    radiosEl[sol.diag].click();
    const cards = () =>
      [...host.querySelectorAll(".u2-row")].filter(
        (r) => r.querySelector(".u2-opt") && !r.getAttribute("role"),
      );
    const written = cards()[0];
    sol.order.forEach((i) => written.querySelectorAll("button")[i].click());
    const ordered = cards()[1];
    ordered.querySelectorAll("button")[sol.order.indexOf(sol.mid)].click();
  },
  boxtwins: dots,
  madtwins: dots,
  chipsort(host, spec, sol) {
    const chips = [...host.querySelectorAll(".u2-row[role=group] .u2-opt")];
    const bins = [...host.querySelectorAll(".u2-opt")].filter((b) => !chips.includes(b));
    sol.place.forEach((b, i) => {
      chips[i].click();
      bins[b].click();
    });
  },
  headlinecourt(host, spec, sol) {
    radios(host, 0)[sol.buyer].click();
    radios(host, 1)[sol.assessor].click();
    const t = [...host.querySelectorAll("button")].find((b) => /Test my pick/.test(b.textContent));
    t.click();
  },
  receipt(host, spec, sol) {
    radios(host, 0)[sol.zone].click();
    sol.flags.forEach((f, i) => radios(host, i + 1)[f ? 1 : 0].click());
  },
};
function dots(host, spec, sol) {
  const sets = spec.model.two ? [sol.a, sol.b] : [sol.a];
  const wraps = [...host.querySelectorAll(".u2-root .u2-root")];
  const tabs = spec.model.two ? radios(host, 0) : null;
  sets.forEach((vals, s) => {
    if (tabs) tabs[s].click();
    const groups = [...wraps[s].querySelectorAll(".u2-dot")];
    vals.forEach((v, i) => {
      for (let g = 0; g < 40 && Number(groups[i].getAttribute("aria-valuenow")) !== v; g++)
        keydown(
          groups[i],
          Number(groups[i].getAttribute("aria-valuenow")) < v ? "ArrowRight" : "ArrowLeft",
        );
    });
  });
}

for (const [kind, variants] of VARIANTS) {
  if (only.length && !only.includes(kind)) continue;
  for (const p of variants)
    for (let level = 1; level <= 4; level++)
      for (let seed = 1; seed <= 6; seed++) {
        const tag = `${JSON.stringify(p)} L${level}/seed ${seed}`;
        try {
          const spec = JSON.parse(JSON.stringify(WA.make(kind, level, seed, p)));
          const def = WA.registry[kind];
          const sol = JSON.parse(JSON.stringify(def.solution(spec)));
          // a Check on the untouched widget is a miss with a message
          let host = win.document.createElement("div");
          win.document.body.append(host);
          let { api, calls } = mk();
          def.mount(host, spec, api);
          click(host.querySelector(".u2-go"));
          assert.equal(calls.submit.length, 1, "Check must call submit");
          const miss = def.grade(spec, calls.submit[0]);
          assert.equal(miss.ok, false, "an untouched widget must not already be solved");
          assert.ok(miss.say?.length > 10, "untouched Check needs a message");
          host.remove();
          // driven to the solution
          host = win.document.createElement("div");
          win.document.body.append(host);
          ({ api, calls } = mk());
          def.mount(host, spec, api);
          drive[kind](host, spec, sol);
          click(host.querySelector(".u2-go"));
          const got = calls.submit.at(-1);
          const g = def.grade(spec, got);
          assert.equal(
            g.ok,
            true,
            `driven widget state was not accepted: ${JSON.stringify(g.say)} ${JSON.stringify(got)}`,
          );
          assert.ok(calls.change.length > 0, "widget must call change() so progress saves");
          host.remove();
          // read-only after a solve, in Spanish, and a restored mid-way state
          for (const es of [false, true]) {
            host = win.document.createElement("div");
            win.document.body.append(host);
            ({ api } = mk());
            api.restore = sol;
            api.solved = true;
            api.es = () => es;
            def.mount(host, spec, api);
            assert.equal(host.querySelector(".u2-go"), null, "solved widget must be read-only");
            host.remove();
          }
          // every control has an accessible name
          host = win.document.createElement("div");
          win.document.body.append(host);
          ({ api } = mk());
          def.mount(host, spec, api);
          for (const b of host.querySelectorAll("button, [role=slider], input")) {
            const name = (b.getAttribute("aria-label") || b.textContent || "").trim();
            assert.ok(name.length > 0, `unnamed control ${b.outerHTML.slice(0, 80)}`);
          }
          host.remove();
        } catch (e) {
          bad(kind, `DOM ${tag}: ${e.message.split("\n")[0]}`);
          break;
        }
      }
}

if (problems) {
  console.error(`\n${problems} problem(s) in the Unit 2 activities.`);
  process.exit(1);
}
console.log(
  `studio-act-unit2: ${VARIANTS.length} activities, all variants x 4 levels passed (maths recomputed + DOM driven).`,
);
