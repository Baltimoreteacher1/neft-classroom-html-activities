// Living Math Canvas + Isomorphic Lens: exact picture math, highlight sync, scene data contract, the stage flow in jsdom.
//   node tools/ewl-canvas.test.mjs
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEwl } from "./lib/ewl-vm.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const data = JSON.parse(read("data/ewl/canvas-scenes.json"));
const manifest = JSON.parse(read("data/curriculum-launch-manifest.json"));
const standards = JSON.parse(read("data/ccss-standards.json"));
const labs = {};
for (const d of readdirSync(join(ROOT, "curriculum/learning-labs"))) {
  const f = join(ROOT, "curriculum/learning-labs", d, "content.json");
  if (existsSync(f)) labs[d] = JSON.parse(readFileSync(f, "utf8")).lessons.map((l) => l.id);
}

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
const ctx = loadEwl({ only: MODULES });
const { EWL } = ctx;
const { Rat, Lens, Canvas: C, Reason } = EWL;
const validate = (d) => C.validate(d, { manifest, standards, labs });
const clone = (o) => JSON.parse(JSON.stringify(o));
let checks = 0;
const ok = (c, m) => {
  checks += 1;
  assert.ok(c, m);
};

// ---- 1. every picture of every scene preset reads back the same exact amount --------------------------------
for (const s of data.scenes) {
  const kind = C.kinds[s.kind];
  for (const p of s.presets) {
    const spec = kind.spec(kind.init(p.params), s);
    const bad = C.roundTrip(spec);
    ok(bad.length === 0, `${s.id}/${p.id}: ${bad.join("; ")}`);
    const m = Lens.model(spec, "en");
    if (p.id === s.defaultPreset)
      ok(
        m.reps.length === s.reps.length,
        `${s.id}: default preset draws all ${s.reps.length} pictures`,
      );
  }
}
// 400 random amounts: the rational family reads back exactly, in every picture it can draw
let seed = 20261015;
const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32;
let drawn = 0;
for (let i = 0; i < 400; i++) {
  const d = Math.floor(rnd() * 24) + 1;
  const n = Math.floor(rnd() * d * 2.4);
  const spec = { family: "rational", value: `${n}/${d}` };
  const bad = C.roundTrip(spec);
  ok(bad.length === 0, `${spec.value}: ${bad.join("; ")}`);
  drawn += Lens.model(spec, "en").reps.length;
}
// the amount can be typed in any form and lands on the same exact value
for (const text of ["3/5", "6/10", "60/100", "0.6", ".6", "60%", "0.60"]) {
  const m = Lens.model(Lens.reg.rational.setText({ family: "rational", value: "1/2" }, text), "en");
  ok(m.value.eq(Rat.of(3, 5)), `${text} is 3/5`);
}
ok(
  Lens.reg.rational.setText({ family: "rational", value: "1/2" }, "abc") === null,
  "unreadable text is refused",
);
ok(
  Lens.reg.rational.setText({ family: "rational", value: "1/2" }, "-1/2") === null,
  "negative is refused",
);
ok(Lens.model({ family: "rational", value: "1 1/2" }, "en").value.eq(Rat.of(3, 2)), "1 1/2");
ok(
  Lens.model({ family: "rational", value: "150%" }, "en").reps.every((r) =>
    r.read().eq(Rat.of(3, 2)),
  ),
  "150% in every picture",
);
// re-partitioning keeps the amount: 3/5 -> 6/10 -> 60/100
for (const den of [5, 10, 20, 100]) {
  const m = Lens.model({ family: "rational", value: "3/5", den, reps: ["strip"] }, "en");
  ok(m.reps[0].read().eq(Rat.of(3, 5)) && m.reps[0].D === den, `strip in ${den}ths`);
}
ok(
  Lens.reg.rational.denOptions(Rat.of(1, 3)).options.indexOf(100) < 0,
  "thirds cannot be cut into 100ths",
);
ok(
  Lens.model({ family: "rational", value: "1/3" }, "en").unavailable.some((u) => u.id === "grid"),
  "no 100-grid for 1/3",
);
// ratio / equation / scale
ok(
  Lens.reg.ratio.setText({ family: "ratio", a: "1", b: "1" }, "3 to 5").b === "5",
  "ratio text '3 to 5'",
);
ok(Lens.reg.ratio.setText({ family: "ratio", a: "1", b: "1" }, "0:4") === null, "zero is refused");
const eqs = Lens.reg.equation;
for (const t of ["2x+3=11", "x + 7 = 19", "3x=12", "3 + 2x = 11"]) {
  const n = eqs.setText({ family: "equation", p: "1", q: "0", r: "1" }, t);
  ok(n && Lens.model(n, "en").value.isInt(), t);
}
ok(
  eqs.setText({ family: "equation", p: "1", q: "0", r: "1" }, "x+9=4") === null,
  "a negative answer is refused",
);
ok(
  Lens.model({ family: "equation", p: "2", q: "3", r: "11" }, "en").value.eq(4),
  "2x+3=11 gives 4",
);
// doing the same thing to both sides never changes x
for (const [a, b] of [
  ["2x+3=11", "2x=8"],
  ["2x=8", "x=4"],
  ["x+7=19", "x=12"],
]) {
  const va = Lens.model(eqs.setText({ family: "equation", p: "1", q: "0", r: "1" }, a), "en").value;
  const vb = Lens.model(eqs.setText({ family: "equation", p: "1", q: "0", r: "1" }, b), "en").value;
  ok(va.eq(vb), `${a} and ${b} have the same x`);
}
for (const k of [1, 2, 3, 4, 5]) {
  const m = Lens.model({ family: "scale", k: String(k) }, "en");
  const table = m.reps.filter((r) => r.id === "table")[0];
  ok(
    table.rows[1].times.eq(Rat.of(k * k)) && table.rows[2].times.eq(Rat.of(k ** 3)),
    `scale ${k}: area x${k * k}, volume x${k ** 3}`,
  );
}
ok(!Lens.reg.scale.setText({ family: "scale", k: "2" }, "9"), "scale 9 is refused");

// ---- 2. highlight sync: pointing at a part lights the same quantity in every other picture ------------------
function parts(rep) {
  return rep.parts;
}
let syncChecks = 0;
for (const s of data.scenes) {
  const kind = C.kinds[s.kind];
  const spec = kind.spec(kind.init(s.presets.filter((p) => p.id === s.defaultPreset)[0].params), s);
  const m = Lens.model(spec, "en");
  for (const rep of m.reps) {
    for (const p of parts(rep)) {
      const own = rep.hits(p.id);
      if (m.family === "rational") {
        const q = Lens.parsePid(p.id);
        if (!q || q.to.cmp(q.from) <= 0 || q.from.cmp(m.value) >= 0) continue; // empty or beyond the amount
      }
      if (m.family === "ratio" && rep.id === "tape") {
        const mm = Rat.parse(p.id.slice(1));
        if (!m.steps.some((st) => st.eq(mm))) continue;
      }
      ok(own.indexOf(p.id) >= 0, `${s.id}/${rep.id}: ${p.id} lights itself`);
      for (const other of m.reps) {
        if (other === rep) continue;

        if (
          (m.family === "equation" || m.family === "scale") &&
          !other.parts.some((q) => q.id === p.id)
        )
          continue; // not every picture shows every part (squares have no volume)
        if (m.family === "ratio" && other.id === "tape" && !Rat.parse(p.id.slice(1)).isInt())
          continue; // a part of a copy is not a copy
        ok(other.hits(p.id).length > 0, `${s.id}: ${p.id} in ${rep.id} reaches ${other.id}`);
        syncChecks += 1;
      }
    }
  }
}
// a stretch beyond the amount reaches the pictures that show it and none that do not
const g = Lens.model(
  { family: "rational", value: "3/5", reps: ["strip", "table", "percent"] },
  "en",
);
ok(
  g.reps[1].hits("4/5~1").length === 0 && g.reps[0].hits("4/5~1").length === 1,
  "unshaded piece lights only pictures that show it",
);
ok(
  g.reps[0].hits("not-an-id").length === 0 && g.reps[0].hits(null).length === 0,
  "bad ids hit nothing",
);
ok(
  g.reps[2].hits("1/10~1/5").indexOf("1/10~1/5") >= 0 && g.reps[0].hits("1/10~1/5").length === 1,
  "a tenth lights its fifth",
);

// ---- 3. scene data contract ----------------------------------------------------------------------------------
const problems = validate(data);
assert.equal(problems.length, 0, problems.join("\n"));
ok(data.scenes.length >= 9, "at least 9 scenes");
for (const need of [
  "equivalent-names",
  "percent-of-quantity",
  "successive-discounts",
  "equivalent-ratios",
  "unit-rate-and-price",
  "y-equals-kx",
  "balance-equations",
  "scale-factor",
  "fraction-division-fit",
]) {
  ok(
    data.scenes.some((s) => s.id === need),
    `required scene ${need}`,
  );
}
ok(
  data.scenes.every((s) => s.unit !== 10),
  "no Unit 10 scene",
);

// ---- 4. negative controls: the validator must reject each of these ------------------------------------------
function mutated(fn) {
  const d = clone(data);
  fn(d.scenes[0], d);
  return validate(d);
}
const rejects = (name, fn, re) => {
  const p = mutated(fn);
  ok(
    p.length > 0 && p.some((x) => re.test(x)),
    `negative control "${name}" should be rejected; got ${JSON.stringify(p.slice(0, 3))}`,
  );
};
rejects(
  "a lesson id that is not in the manifest",
  (s) => s.lessons.push("4-99"),
  /4-99.*not in the launch manifest/,
);
rejects("a lesson from another unit", (s) => s.lessons.push("3-3"), /3-3 is in unit 3/);
rejects("a missing Spanish title", (s) => delete s.titleEs, /titleEs/);
rejects(
  "a missing Spanish sentence in a nested statement",
  (s) => delete s.observe.statements[0].textEs,
  /textEs/,
);
rejects("Spanish copied from English", (s) => (s.blurbEs = s.blurb), /identical to the English/);
rejects("a sentence starter without Spanish", (s) => delete s.explain.frames[0].es, /no es/);
rejects(
  "an activity id that does not match the scene",
  (s) => (s.activity = "ewl.canvas.something-else"),
  /activity must be/,
);
rejects("a standard that does not exist", (s) => (s.standard = "9.ZZ.9"), /not in ccss-standards/);
rejects(
  "a standard that belongs to no listed lesson",
  (s) => (s.standard = "6.GR.2"),
  /not the standard of any listed lesson/,
);
rejects("Unit 10", (s) => (s.unit = 10), /Unit 10|unit 4|is in unit/);
rejects(
  "a picture the family does not have",
  (s) => s.reps.push("hologram"),
  /no picture called hologram/,
);
rejects(
  "a task kind with no misconception rule",
  (s) => s.taskKinds.push("not-a-kind"),
  /no misconception rule/,
);
rejects("a task that does not build", (s) => (s.predict.task.kind = "nope"), /task does not build/);
rejects("a lab that does not exist", (s) => s.extends.push("no-such-lab"), /unknown lab/);
rejects(
  "two correct generalize choices",
  (s) => (s.generalize.choices[1].ok = true),
  /exactly one correct/,
);
rejects(
  "a wrong generalize choice with no question",
  (s) => delete s.generalize.choices[1].ask,
  /needs ask/,
);
rejects(
  "too few transfer sets",
  (s) => (s.transfer.sets = s.transfer.sets.slice(0, 2)),
  /at least 6/,
);
rejects(
  "a preset whose value cannot be drawn",
  (s) => (s.presets[0].params.value = "oops"),
  /cannot build|does not build/,
);
rejects(
  "a control that would draw nothing",
  (s) => s.manipulate.controls[1].options.push({ v: "-3" }),
  /cannot be drawn/,
);
rejects(
  "an observe list with no false statement",
  (s) => s.observe.statements.forEach((x) => (x.true = true)),
  /some true and some false/,
);
rejects("fewer than 9 scenes", (_s, d) => (d.scenes = d.scenes.slice(0, 4)), /at least 9 scenes/);
// a preset whose pictures disagree: corrupt one picture's read() and the round trip must say so
{
  const strip = Lens.reg.rational.reps.strip;
  const real = strip.build;
  strip.build = (m) => {
    const rep = real(m);
    rep.read = () => Rat.of(Number(m.value.n) + 1, Number(m.value.d));
    return rep;
  };
  const p = validate(data);
  strip.build = real;
  ok(
    p.some((x) => /rational\/strip reads/.test(x)),
    "a picture that disagrees with the amount is rejected",
  );
  assert.equal(validate(data).length, 0, "validator is clean again after restoring");
}
ok(validate(clone(data)).length === 0, "an untouched copy validates");

// ---- 5. tasks: deterministic, misconception-aware, forms of the same answer all accepted --------------------
for (const s of data.scenes) {
  const t = C.task(s.predict.task.kind, s.predict.task.args);
  ok(C.check(t, t.answer.frac()).state === "ok", `${s.id}: the true answer is accepted`);
  ok(C.check(t, "banana").state === "unreadable", `${s.id}: nonsense is unreadable, not wrong`);
  const rules = Reason.rules().filter((r) => r.kinds.indexOf(t.kind) >= 0);
  ok(rules.length > 0, `${s.id}: ${t.kind} has misconception rules`);
  let diagnosed = 0;
  for (const r of rules) {
    const w = r.wrong(t);
    if (!w) continue;
    ok(!w.eq(t.answer), `${s.id}: rule ${r.id} disagrees with the answer`);
    ok(
      C.check(t, w.frac()).rule && C.check(t, w.frac()).rule.id === r.id,
      `${s.id}: ${w.frac()} is matched to ${r.id}`,
    );
    const lad = [0, 1, 2].map((st) => Reason.ladder(t, { value: w.frac() }, st, "en").text);
    ok(
      lad.every((x) => (x && x.indexOf(t.answer.frac()) < 0) || t.answer.frac().length < 2),
      `${s.id}: help steps 0-2 do not state the answer`,
    );
    diagnosed += 1;
  }
  ok(diagnosed >= 1, `${s.id}: at least one misconception is diagnosable`);
  const seenSets = new Set();
  for (let n = 0; n < 100; n++) {
    const tr = C.makeTransfer(s, n);
    ok(
      C.check(tr.task, tr.task.answer.frac()).state === "ok" && C.distinct(tr.task),
      `${s.id}: transfer ${n} is solvable and distinct`,
    );
    ok(!/[{}]/.test(tr.prompt + tr.promptEs), `${s.id}: transfer ${n} has no placeholder`);
    ok(tr.prompt === C.makeTransfer(s, n).prompt, `${s.id}: transfer ${n} is seeded`);
    seenSets.add(tr.prompt);
  }
  ok(seenSets.size >= 4, `${s.id}: transfer varies`);
  const reveal = C.revealText(s.predict.answer, t, "en");
  ok(typeof reveal === "string" && reveal.length > 0, `${s.id}: checked result text`);
}
const names = C.task("names", ["3/5"]);
for (const form of ["3/5", "6/10", "60/100", "0.6", "60%", ".60"])
  ok(C.check(names, form).state === "ok", `3/5 accepted as ${form}`);
ok(
  C.check(names, "0.35").rule.id === "canvas-names-side-by-side",
  "0.35 is the side-by-side misconception",
);
ok(C.task("percentStack", ["20%", "10%"]).answer.percent() === "28%", "20% then 10% is 28% off");
ok(
  C.check(C.task("percentStack", ["20%", "10%"]), "30%").rule.id === "percent-stack",
  "30% is the adding misconception",
);
ok(
  C.check(C.task("eqSolve", ["2", "3", "11"]), "7").rule.id === "canvas-eq-wrong-inverse",
  "7 is the wrong-inverse misconception",
);
ok(
  C.check(C.task("eqSolve", ["2", "3", "11"]), "8").rule.id === "canvas-eq-skip-divide",
  "8 is the stopped-before-dividing misconception",
);
ok(
  C.check(C.task("ratioScale", ["2", "3", "8"]), "9").rule.id === "canvas-ratio-additive",
  "9 is the additive misconception",
);
ok(
  C.check(C.task("ratioK", ["2", "6"]), "1/3").rule.id === "canvas-k-flipped",
  "1/3 is the flipped-rate misconception",
);
// a corrupted answer key must not pass
const wrongKey = C.task("percentOf", ["25%", "80"]);
wrongKey.answer = Rat.of(25);
ok(
  C.check(wrongKey, "20").state === "wrong",
  "a corrupted key rejects the right answer (so the key, not the check, is what a test must guard)",
);

console.log(
  `ewl-canvas: ${data.scenes.length} scenes, ${drawn} random pictures, ${syncChecks} highlight links, ${checks} checks ok.`,
);
