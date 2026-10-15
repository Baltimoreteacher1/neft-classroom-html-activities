// Fluency Spiral: seeded class sprints, the 60/25/15 mix, exact judging, and pictures that build instantly.
//   node tools/ewl-fluency.test.mjs
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { loadEwl } from "./lib/ewl-vm.mjs";

const dom = new JSDOM("<!doctype html><body><div id=h></div></body>");
const ctx = loadEwl({
  only: ["rational.js", "state-store.js", "reasoning.js", "ui.js", "fluency.js"],
  extra: { document: dom.window.document },
});
const { Fluency: F, Rat } = ctx.EWL;

// quotas: exact, add up, and give 12/5/3 for 20
assert.equal(JSON.stringify(F.quotas(20)), JSON.stringify({ new: 12, review: 5, stretch: 3 }));
for (let n = 3; n <= 60; n++) {
  const q = F.quotas(n);
  assert.equal(q.new + q.review + q.stretch, n, `quotas add to ${n}`);
  assert.ok(q.new >= q.review && q.review >= q.stretch, `spiral order at n=${n}`);
}
// codes
assert.ok(F.parseCode("kite-4821") && F.parseCode(" KITE-4821 "));
for (const bad of ["", "KITE4821", "KITE-48", "12-3456", "KITE-4821x", null])
  assert.equal(F.parseCode(bad), null, String(bad));
assert.throws(
  () => F.plan("nope", 20, 4),
  (e) => e.name === "RangeError",
);
for (let i = 0; i < 40; i++)
  assert.ok(F.parseCode(F.newCode(ctx.EWL.rng(i))), "generated codes parse");

// determinism: same code+unit = same sprint; different code or unit differs; plan is stable across calls
const sig = (p) => p.map((x) => `${x.tier}:${x.prompt}`).join("|");
assert.equal(sig(F.plan("KITE-4821", 20, 4)), sig(F.plan("KITE-4821", 20, 4)));
assert.equal(sig(F.plan("KITE-4821", 20, 4)), sig(F.plan("kite-4821", 20, 4)));
assert.notEqual(sig(F.plan("KITE-4821", 20, 4)), sig(F.plan("KITE-4822", 20, 4)));
assert.notEqual(sig(F.plan("KITE-4821", 20, 4)), sig(F.plan("KITE-4821", 20, 6)));

// every unit: tier counts honor the mix, items are readable, answers are independently correct
const indep = (it) => {
  const p = it.prompt;
  let m;
  if ((m = /^(\d+) × (\d+)$/.exec(p))) return Rat.of(+m[1] * +m[2]);
  if ((m = /^(\d+) ÷ (\d+)$/.exec(p))) return Rat.of(+m[1], +m[2]);
  if ((m = /^(-?\d+) \+ \(?(-?\d+)\)?$/.exec(p))) return Rat.of(+m[1] + +m[2]);
  if ((m = /^(\d+)(²|³)$/.exec(p))) return Rat.of(Math.pow(+m[1], m[2] === "²" ? 2 : 3));
  if ((m = /^(\d+)% of (\d+)$/.exec(p))) return Rat.of(+m[1] * +m[2], 100);
  if ((m = /^1\/(\d+) of (\d+)$/.exec(p))) return Rat.of(+m[2], +m[1]);
  if ((m = /^(\d+)\/(\d+) \+ (\d+)\/(\d+)$/.exec(p)))
    return Rat.of(+m[1], +m[2]).add(Rat.of(+m[3], +m[4]));
  if ((m = /^(\d+)\/(\d+) = \?\/(\d+)/.exec(p))) return Rat.of((+m[1] * +m[3]) / +m[2]);
  if ((m = /^([\d.]+) × (\d+)$/.exec(p))) return Rat.parse(m[1]).mul(+m[2]);
  if ((m = /^x \+ (\d+) = (\d+),/.exec(p))) return Rat.of(+m[2] - +m[1]);
  if ((m = /^\$(\d+) for (\d+) items/.exec(p))) return Rat.of(+m[1], +m[2]);
  if ((m = /^Area of a (\d+) by (\d+)/.exec(p))) return Rat.of(+m[1] * +m[2]);
  throw new Error(`no independent solver for: ${p}`);
};
const kindsSeen = new Set();
let total = 0;
for (let unit = 1; unit <= 9; unit++)
  for (const code of ["KITE-0001", "COMET-4242", "ORBIT-9999"]) {
    const plan = F.plan(code, 20, unit);
    const counts = { new: 0, review: 0, stretch: 0 };
    for (const it of plan) {
      counts[it.tier]++;
      kindsSeen.add(it.kind);
      assert.ok(
        indep(it).eq(it.answer),
        `unit ${unit} ${code}: ${it.prompt} keyed ${it.answer} not ${indep(it)}`,
      );
      assert.ok(it.promptEs && it.visual && it.id, "item is bilingual and has a picture");
      assert.ok(F.judge(it, it.answer.frac()).ok, "its own answer is accepted");
      assert.ok(
        F.judge(it, it.answer.decimal(12).text).ok || !it.answer.isTerminating(),
        "decimal form accepted",
      );
      assert.ok(!F.judge(it, it.answer.add(1).frac()).ok, "a wrong answer is rejected");
      total++;
    }
    assert.equal(
      JSON.stringify(counts),
      JSON.stringify({ new: 12, review: 5, stretch: 3 }),
      `mix at unit ${unit}`,
    );
    assert.equal(
      new Set(plan.map((x) => x.prompt)).size >= 14,
      true,
      "sprint is not one repeated question",
    );
  }
assert.ok(kindsSeen.size >= 10, `variety of kinds: ${kindsSeen.size}`);
// forms: 3/5 = 6/10 = 0.6 = 60%
const probe = { answer: Rat.of(3, 5) };
for (const f of ["3/5", "6/10", "0.6", ".6", "60%", " 0.60 "]) assert.ok(F.judge(probe, f).ok, f);
for (const f of ["3/6", "0.5", "6", "abc", ""]) assert.ok(!F.judge(probe, f).ok, f);
assert.equal(F.judge(probe, "abc").readable, false);

// pictures: every kind builds as valid SVG with a text alternative, synchronously, far under 200ms
let worst = 0;
for (let unit = 1; unit <= 9; unit++)
  for (const it of F.plan("KITE-1234", 30, unit)) {
    const t0 = Date.now();
    const fig = F.drawVisual(it.visual);
    worst = Math.max(worst, Date.now() - t0);
    const svg = fig.querySelector("svg");
    assert.ok(
      svg &&
        svg.getAttribute("viewBox") &&
        svg.getAttribute("aria-label") &&
        svg.querySelector("title"),
      `figure for ${it.prompt}`,
    );
    assert.ok(
      !/NaN|undefined|Infinity/.test(fig.outerHTML),
      `no bad values in the picture for ${it.prompt}`,
    );
  }
assert.ok(worst < 200, `slowest picture ${worst}ms`);

// mount: the session runs to the end with the keyboard path and records state
const host = dom.window.document.getElementById("h");
const s = ctx.EWL.Fluency.mount(host, { unit: 4, code: "KITE-4821", n: 3 });
assert.equal(s.items.length, 3);
assert.ok(host.querySelector("input") && host.querySelector("button"));
const hud = dom.window.document.createElement("div");
const off = F.hud(hud);
assert.match(hud.textContent, /Streak/);
assert.match(hud.textContent, /60\/25\/15/);
off();
for (const t of ctx.EWL.selfTests) assert.ok(t.run(), t.name);
console.log(
  `ewl-fluency: ${total} items across 9 units keyed independently; ${kindsSeen.size} kinds; slowest picture ${worst}ms.`,
);
