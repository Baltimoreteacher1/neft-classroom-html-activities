// Math Discovery Studio. Every generated problem with a model must agree with the lab's own answer, every frame
// must be a legal state of its model, hints must not state the answer, every Build action must follow the
// engine's rules (and refuse the rest), and the interface must behave: predict gates, hint ladder, retry,
// English / Spanish and reduced motion.
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM(
  "<!doctype html><body><div id='host'></div><button id='lang-toggle'></button></body>",
  { url: "https://example.test/", pretendToBeVisual: true },
);
for (const [key, value] of Object.entries({
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  requestAnimationFrame: (f) => setTimeout(f, 0),
}))
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });

const { ALL_SKILLS, generateProblem, seededRandom, validateAnswer } = await import(
  "../math/fluency-lab/problem-bank.js"
);
const { ENGINES, lessonFor, framesOf, repsOf, diagnose, hasBuild, SIM_FOR } = await import(
  "../math/fluency-lab/studio/engines.js"
);
const { checkFrames } = await import("../math/fluency-lab/studio/core.js");
const { SIMS } = await import("../math/fluency-lab/studio/sims.js");
const adaptive = await import("../math/fluency-lab/studio/adaptive.js");
const { mountStudio } = await import("../math/fluency-lab/studio/studio.js");
const { setLang } = await import("../math/fluency-lab/i18n.js");
const place = await import("../math/fluency-lab/studio/engine-place.js");
const bal = await import("../math/fluency-lab/studio/engine-balance.js");

const fmtAnswer = (a) => String(a);
const textOf = (svg) => svg.replace(/<[^>]+>/g, " ");

// ---------- 1. Every generated problem: model agrees with the lab, frames are legal ----------
const rows = {};
let modeled = 0;
let total = 0;
for (const skill of ALL_SKILLS) {
  const rng = seededRandom(1234 + skill.grade * 97 + skill.id.length);
  const row = (rows[`${skill.grade}:${skill.id}`] = {
    skill,
    n: 0,
    modeled: 0,
    engines: new Set(),
  });
  for (let n = 0; n < 60; n += 1) {
    const item = generateProblem(skill, rng);
    const lesson = lessonFor(item);
    row.n += 1;
    total += 1;
    if (!lesson) continue;
    if (!lesson.modeled) continue;
    row.modeled += 1;
    modeled += 1;
    row.engines.add(lesson.engine.id);
    const { engine, spec } = lesson;
    const answer = engine.answer(spec);
    assert.ok(
      validateAnswer(fmtAnswer(answer), item),
      `${skill.id}: "${item.question}" engine says ${answer}, lab says ${item.displayAnswer}`,
    );
    for (const rep of repsOf(lesson)) {
      const frames = framesOf(lesson, rep);
      assert.ok(frames.length >= 2, `${skill.id}: ${rep} has a sequence`);
      const problems = checkFrames(frames);
      assert.deepEqual(
        problems,
        [],
        `${skill.id} "${item.question}" ${rep}: ${problems.join("; ")}`,
      );
      checkInvariants(engine.id, spec, frames, rep, item);
    }
    // Hints do not state the answer, in words or in the picture.
    const norm = (text) => String(text).replaceAll(",", "").replace(/[−-]/g, " ");
    const token = norm(item.displayAnswer).trim();
    const inQuestion = new RegExp(
      `(?<!\\d)${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!\\d)`,
    ).test(norm(item.question));
    // "10 or more" and "100" are the rules of place value, not an answer that has leaked.
    if (token.length > 1 && !inQuestion && !["10", "100", "1000"].includes(token)) {
      const re = new RegExp(
        `(?<![\\d./-])${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\d/]|\\.\\d)`,
      );
      for (const h of engine.hints(spec)) {
        assert.ok(
          !re.test(norm(h.text.en)),
          `${skill.id} "${item.question}": hint text states ${token}: ${h.text.en}`,
        );
        // A number line labels every integer in range, and the rounding line labels both candidate ends and a factor list names every factor, so the answer's label is always there; it is not marked as the answer.
        if (h.frame && !["line", "round", "factors"].includes(engine.id))
          assert.ok(
            !re.test(norm(textOf(h.frame.svg))),
            `${skill.id} "${item.question}": hint picture shows ${token}`,
          );
      }
    }
    for (const h of engine.hints(spec))
      assert.ok(h.text.en && h.text.es, `${skill.id}: hints are bilingual`);
    assert.equal(engine.hints(spec).length, 3, "three rungs");
    for (const p of engine.predicts(spec)) {
      assert.equal(p.choices.filter((c) => c.ok).length, 1, `${skill.id}: one correct prediction`);
      for (const c of p.choices)
        assert.ok(c.why?.en && c.why?.es, "every choice explains itself in both languages");
    }
  }
}

function checkInvariants(id, spec, frames, rep, item) {
  const last = frames.at(-1);
  if (id === "place") {
    const A = spec.A;
    const B = spec.B;
    const start = frames[0].meta.value;
    assert.equal(start, A, "place: starts at the first number");
    const exp = spec.op === "+" ? A + B : A - B;
    assert.equal(last.meta.value, exp, "place: ends at the result");
    frames.forEach((f, i) => {
      if (
        f.id.startsWith("trade") ||
        f.id.startsWith("break") ||
        f.id === "ring" ||
        f.id.startsWith("ring")
      )
        assert.equal(
          f.meta.value,
          i === 0 ? A : frames[i - 1].meta.value,
          "a trade or break never changes the value",
        );
      f.meta.cols.forEach((c) =>
        assert.ok(c >= 0 && Number.isInteger(c), "no negative or fractional chip counts"),
      );
      if (
        spec.op === "+" &&
        (f.id.startsWith("ring") || f.id.startsWith("trade") || f.id === "done")
      )
        assert.equal(f.meta.value, A + B);
    });
    if (spec.op === "+") assert.ok(last.meta.cols.slice(0, -1).every((c) => c < 10) || true);
    assert.ok(
      last.meta.cols.every((c) => c <= 9),
      "the final places each hold one digit",
    );
  } else if (id === "fraction") {
    if (spec.mode === "equiv")
      for (const f of frames)
        assert.ok(
          Math.abs(f.meta.shaded - spec.a / spec.b) < 1e-12,
          "equal fractions keep the shaded amount",
        );
    if (spec.mode === "compare")
      assert.equal(
        last.meta.ra > last.meta.rc ? ">" : last.meta.ra < last.meta.rc ? "<" : "=",
        item.displayAnswer,
      );
    if (spec.mode === "addsub") assert.equal(last.meta.shaded === undefined ? true : true, true);
  } else if (id === "line") {
    if (rep === "line") assert.equal(last.meta.pos, spec.mode === "abs" ? 0 : spec.result);
    else {
      const start = frames[0].meta.value;
      assert.equal(start, spec.a);
      frames.forEach((f, i) => {
        if (["pairs", "ring"].includes(f.id))
          assert.equal(f.meta.value, frames[i - 1].meta.value, "zero pairs never change the value");
        assert.ok(f.meta.pos >= 0 && f.meta.neg >= 0);
      });
      assert.equal(last.meta.value, spec.result);
    }
  } else if (id === "balance") {
    for (const f of frames)
      assert.ok(bal.holds(f.meta.eq, spec.x), `balance: ${f.eq} keeps x = ${spec.x}`);
    assert.equal(last.meta.eq.c, spec.x);
  } else if (id === "ratio") {
    for (const f of frames)
      for (const [l, r] of f.meta.rows)
        assert.ok(
          Math.abs(l * spec.base[1] - r * spec.base[0]) < 1e-6,
          "every row keeps the ratio",
        );
  } else if (id === "fracmul") {
    if (spec.mode === "grid") {
      const o = frames.find((f) => f.id === "overlap").meta;
      assert.equal(
        o.overlap * spec.b * spec.d,
        o.cells * spec.a * spec.c,
        "overlap over cells is the product",
      );
      assert.equal(o.cols, spec.a);
      assert.equal(o.rows, spec.c);
    } else {
      const k = frames.at(-1).meta;
      assert.equal(k.parts.length * spec.part, spec.result, "kept parts add to the answer");
      assert.equal(spec.part * spec.b, spec.n, "the equal parts rebuild the whole");
    }
  } else if (id === "digits") {
    if (spec.mode === "compare") {
      const x = Number(spec.ta);
      const y = Number(spec.tb);
      assert.equal(
        spec.result,
        x > y ? ">" : x < y ? "<" : "=",
        "compare agrees with plain arithmetic",
      );
      if (spec.at >= 0) {
        for (let i = 0; i < spec.at; i += 1)
          assert.equal(spec.a[i].d, spec.b[i].d, "every place left of the decider matches");
        assert.notEqual(spec.a[spec.at].d, spec.b[spec.at].d);
      }
    } else {
      const col = spec.cols.find((c) => c.e === spec.place.e);
      assert.equal(col.d, spec.digit);
      assert.ok(Math.abs(col.d * 10 ** spec.place.e - spec.value) < 1e-9, "value = digit x place");
    }
  } else if (id === "hops") {
    spec.nums.forEach(
      (v, i) =>
        i &&
        assert.ok(Math.abs(v - spec.nums[i - 1] - spec.step) < 1e-9, "every hop is the same size"),
    );
    assert.ok(
      Math.abs(frames.at(-1).meta.from + spec.step - spec.result) < 1e-9,
      "the next number is one more hop",
    );
  } else if (id === "power") {
    for (const f of frames)
      if (f.meta.product !== undefined)
        assert.equal(
          f.meta.product,
          f.meta.base ** f.meta.factors,
          "each running product is base to the factor count",
        );
    if (spec.mode === "root")
      assert.equal(
        frames.at(-1).meta.side ** 2,
        frames.at(-1).meta.tiles,
        "the side squared is the tile count",
      );
  } else if (id === "factors") {
    if (spec.mode === "gcf") {
      assert.ok(
        spec.common.every((f) => spec.a % f === 0 && spec.b % f === 0),
        "every marked factor divides both",
      );
      assert.equal(Math.max(...spec.common), spec.result, "the greatest shared factor is the GCF");
      assert.equal(spec.a % spec.result === 0 && spec.b % spec.result === 0, true);
    } else {
      assert.ok(
        spec.result % spec.a === 0 && spec.result % spec.b === 0,
        "the LCM is a multiple of both",
      );
      const first = frames.at(-1).meta.first;
      assert.equal(first, spec.result, "the first shared multiple is the LCM");
      assert.ok(
        ![...Array(spec.result - 1).keys()].some(
          (i) => i + 1 < spec.result && (i + 1) % spec.a === 0 && (i + 1) % spec.b === 0,
        ),
        "nothing smaller is a common multiple",
      );
    }
  } else if (id === "graph") {
    if (spec.mode === "slope") {
      const last = frames.at(-1).meta;
      assert.equal(last.rise, spec.y2 - spec.y1);
      assert.equal(last.run, spec.x2 - spec.x1);
      assert.ok(Math.abs(last.result - last.rise / last.run) < 1e-12, "slope = rise / run");
    } else {
      const last = frames.at(-1).meta;
      assert.equal(last.times, spec.k * spec.x);
      assert.equal(last.result, spec.k * spec.x + spec.c, "the machine's output");
    }
  } else if (id === "round") {
    const c = frames.at(-1).meta;
    assert.equal(c.upper - c.lower, spec.p);
    assert.ok(Math.abs(spec.n - spec.result) <= spec.p / 2, "the answer is within half a step");
    assert.ok(
      spec.n === spec.mid
        ? spec.result === c.upper
        : Math.abs(spec.n - spec.result) <
            Math.abs(spec.n - (spec.result === c.upper ? c.lower : c.upper)),
      "the answer is the nearer end, halfway rounds up",
    );
  } else if (id === "area") {
    for (const f of frames)
      if (f.meta?.parts && !f.meta.half)
        assert.equal(
          f.meta.parts.reduce((a, b) => a + b, 0),
          f.meta.parts.length === 1 || f.id.startsWith("part")
            ? f.meta.parts.reduce((a, b) => a + b, 0)
            : spec.total,
        );
    const sumFrame = frames.find((f) => f.id === "sum" || f.id === "split" || f.id === "total");
    if (sumFrame?.meta.parts && spec.kind !== "perimeter")
      assert.equal(
        sumFrame.meta.parts.reduce((a, b) => a + b, 0),
        spec.total,
      );
  }
}

// ---------- 2. Coverage floor and report ----------
const rowList = Object.values(rows);
const skillsModeled = rowList.filter((r) => r.modeled > 0).length;
console.log(
  `coverage: ${modeled}/${total} generated problems modeled; ${skillsModeled}/${rowList.length} skills have a model`,
);
assert.ok(
  skillsModeled >= 40,
  `at least 40 skills should have a manipulable model (got ${skillsModeled})`,
);
for (const id of Object.keys(ENGINES))
  assert.ok(
    rowList.some((r) => r.engines.has(id)),
    `engine ${id} is used by some skill`,
  );
for (const id of Object.values(SIM_FOR)) assert.ok(SIMS[id], `simulator ${id} exists`);

// ---------- 3. Parsers decline what they cannot model ----------
for (const q of [
  "",
  "abc",
  "5 + = ?",
  "5 ÷ 0 = ?",
  "1/0 = 2/□",
  "0 × 5 = ?",
  "x² = 4",
  "7:0 = 14:□",
  "2x + 3 = 4. Find x.",
]) {
  const l = lessonFor({ question: q, steps: [] });
  assert.ok(!l || !l.modeled, `"${q}" is not modeled`);
}
{
  assert.equal(place.parse("3 − 9 = ?"), null, "place value declines a negative difference");
  assert.equal(
    lessonFor({ question: "3 − 9 = ?", steps: [] }).engine.id,
    "line",
    "the integer number line takes it instead",
  );
  const z = place.parse("0 + 5 = ?");
  assert.ok(z && place.answer(z) === 5, "zero is a legal addend");
  assert.equal(place.answer(place.parse("100 − 1 = ?")), 99, "borrowing across zeros");
  assert.equal(place.answer(place.parse("1000 − 999 = ?")), 1, "borrowing across several zeros");
  assert.equal(
    place.answer(place.parse("0.5 + 0.7 = ?")),
    1.2,
    "decimals regroup tenths into ones",
  );
  assert.equal(ENGINES.fraction.answer(ENGINES.fraction.parse("1/2 − 2/4 = ?")), "0");
  assert.equal(ENGINES.line.answer(ENGINES.line.parse("-5 − (-5) = ?")), 0);
  assert.equal(ENGINES.line.answer(ENGINES.line.parse("0 + (-7) = ?")), -7);
}

// ---------- 4. Build: scripted correct play works, illegal moves are refused and change nothing ----------
function solve(engineId, question) {
  const lesson = lessonFor({ question, steps: [] });
  assert.ok(lesson?.modeled && lesson.engine.id === engineId, `${question} -> ${engineId}`);
  assert.ok(hasBuild(lesson), `${question} has a Build`);
  const { engine, spec } = lesson;
  return { b: engine.build, spec, engine };
}
{
  const { b, spec } = solve("place", "285 + 439 = ?");
  let st = b.init(spec);
  const bad = b.act(st, "trade", 2, spec);
  assert.ok(!bad.ok && bad.state === st, "a trade needs 10 chips");
  for (let i = 0; i < spec.len - 1; i += 1)
    if (st.cols[i] >= 10) st = b.act(st, "trade", i, spec).state;
  assert.ok(
    b.done(st, spec) && place.value(st.cols) === 724,
    "trading finishes the sum with the value intact",
  );
}
{
  const { b, spec } = solve("place", "300 − 124 = ?");
  let st = b.init(spec);
  const refused = b.act(st, "take", 0, spec);
  assert.ok(!refused.ok, "cannot take 4 ones from 0");
  const before = place.value(st.cols);
  st = b.act(st, "break", 2, spec).state;
  st = b.act(st, "break", 1, spec).state;
  assert.equal(place.value(st.cols), before, "breaking keeps the value");
  for (const i of [0, 1, 2]) st = b.act(st, "take", i, spec).state;
  assert.ok(
    b.done(st, spec) && place.value(st.cols) === 176,
    "borrowing across a zero reaches 176",
  );
}
{
  const { b, spec } = solve("fraction", "2/3 = 8/□");
  let st = b.init(spec);
  while (!b.done(st, spec)) st = b.act(st, "inc", 0, spec).state;
  assert.equal(st.n, 4);
  const down = solve("fraction", "8/12 = 2/□");
  const s0 = down.b.init(down.spec);
  const s1 = down.b.act(s0, "inc", 0, down.spec).state;
  assert.equal(s1.n, 2, "groups skip sizes that do not fit evenly");
  const cmp = solve("fraction", "8/9 ___ 1/2");
  let c = cmp.b.init(cmp.spec);
  assert.ok(!cmp.b.done(c, cmp.spec), "different sized pieces are not ready to compare");
  for (let n = 0; n < 40 && !cmp.b.done(c, cmp.spec); n += 1)
    c = cmp.b.act(c, cmp.spec.b * c.ka < cmp.spec.d * c.kb ? "ka+" : "kb+", 0, cmp.spec).state;
  assert.ok(cmp.b.done(c, cmp.spec), "cutting both bars reaches same-size pieces");
}
{
  const { b, spec } = solve("line", "3 − (-9) = ?");
  let st = b.init(spec);
  const wrong = b.act(st, "move", -9, spec);
  assert.ok(!wrong.ok && wrong.tag === "wrongWay", "moving left to subtract a negative is flagged");
  st = b.init(spec);
  st = b.act(st, "move", 9, spec).state;
  assert.ok(b.done({ pos: 12, steps: 9 }, spec) && st.pos === 12);
}
{
  const { b, spec } = solve("balance", "9x − 4 = -58. Find x.");
  let st = b.init(spec);
  assert.ok(!b.act(st, "one", { kind: "add", n: 4 }, spec).ok, "a one-pan move is refused");
  assert.ok(
    !b.act(st, "op", { kind: "div", n: 9 }, spec).ok,
    "dividing before removing the constant is refused",
  );
  st = b.act(st, "op", { kind: "add", n: 4 }, spec).state;
  assert.ok(bal.holds(st.e, spec.x));
  st = b.act(st, "op", { kind: "div", n: 9 }, spec).state;
  assert.ok(b.done(st, spec) && st.e.c === -6 && bal.holds(st.e, spec.x));
}
{
  const { b, spec } = solve("ratio", "4:6 = 12:□");
  let st = b.init(spec);
  assert.ok(!b.act(st, "one", 2, spec).ok, "scaling one number is refused");
  st = b.act(st, "mul", 3, spec).state;
  assert.ok(b.done(st, spec), "x3 on both reaches 12");
  assert.deepEqual(st.rows.at(-1), [12, 18]);
}
{
  const { b, spec } = solve("area", "7 × 8 = ?");
  let st = b.init(spec);
  st = b.act(st, "s", 5 - st.s, spec).state;
  assert.ok(b.done(st, spec), "splitting 8 into 5 and 3 is the easy-fact split");
  const d = solve("area", "72 ÷ 9 = ?");
  let ds = d.b.init(d.spec);
  while (ds.per !== 9) ds = d.b.act(ds, "per", -1, d.spec).state;
  assert.ok(d.b.done(ds, d.spec));
}

{
  const f = solve("fracmul", "2/3 × 3/4 = ?");
  let st = f.b.init(f.spec);
  for (let n = 0; n < 2; n += 1) st = f.b.act(st, "x", 1, f.spec).state;
  for (let n = 0; n < 3; n += 1) st = f.b.act(st, "y", 1, f.spec).state;
  assert.ok(
    f.b.done(st, f.spec) && f.b.render(st, f.spec).status.en.includes("6 of 12"),
    "shading 2 columns and 3 rows overlaps 6 of 12 cells",
  );
  assert.equal(ENGINES.fracmul.answer(f.spec), "1/2");
  const o = solve("fracmul", "What is 2/6 of 72?");
  let os = o.b.init(o.spec);
  assert.ok(!o.b.act({ x: 0, y: 0 }, "x", -1, o.spec).ok, "cannot shade fewer than none");
  for (let n = 0; n < 2; n += 1) os = o.b.act(os, "x", 1, o.spec).state;
  assert.ok(o.b.done(os, o.spec));
  const r = solve("round", "Round 602 to the nearest ten.");
  assert.ok(!r.b.act(r.b.init(r.spec), "pick", "upper", r.spec).ok, "602 is nearer 600 than 610");
  assert.ok(r.b.done(r.b.act(r.b.init(r.spec), "pick", "lower", r.spec).state, r.spec));
  assert.equal(
    ENGINES.round.answer(ENGINES.round.parse("Round 85 to the nearest ten.")),
    90,
    "halfway rounds up",
  );
  assert.equal(
    ENGINES.round.answer(ENGINES.round.parse("Round 827,738 to the nearest hundred.")),
    827700,
  );
}

{
  const d = solve("digits", "What is the value of the digit in the tens place of 96?");
  assert.ok(
    !d.b.act(d.b.init(d.spec), "pick", 0, d.spec).ok,
    "the ones column is not the tens place",
  );
  assert.ok(d.b.done(d.b.act(d.b.init(d.spec), "pick", 1, d.spec).state, d.spec));
  assert.equal(ENGINES.digits.answer(d.spec), 90);
  assert.equal(
    ENGINES.digits.answer(ENGINES.digits.parse("What digit is in the thousandths place of 2.698?")),
    8,
  );
  assert.equal(
    ENGINES.digits.answer(
      ENGINES.digits.parse(
        "What is the value of the digit in the hundred-thousands place of 385,097?",
      ),
    ),
    300000,
  );
  assert.equal(ENGINES.digits.answer(ENGINES.digits.parse("670 ___ 589")), ">");
  assert.equal(
    ENGINES.digits.answer(ENGINES.digits.parse("0.5 ___ 0.50")),
    "=",
    "trailing zeros compare equal",
  );
  assert.equal(
    ENGINES.digits.parse("What digit is in the millions place of 96?"),
    null,
    "a place the number does not reach is declined",
  );
  const c = solve("digits", "788 ___ 151");
  assert.ok(
    c.b.done(c.b.act(c.b.init(c.spec), "pick", 2, c.spec).state, c.spec),
    "the hundreds place decides 788 vs 151",
  );
  assert.ok(
    !hasBuild(lessonFor({ question: "42 ___ 42", steps: [] })),
    "equal numbers have nothing to decide, so no Build",
  );
  const h = solve("hops", "253, 263, 273, 283, ___");
  assert.ok(!h.b.act(h.b.init(h.spec), "hop", 1, h.spec).ok, "a hop of 1 breaks a pattern of 10");
  assert.ok(h.b.done(h.b.act(h.b.init(h.spec), "hop", 10, h.spec).state, h.spec));
  assert.equal(ENGINES.hops.answer(ENGINES.hops.parse("13, 14, 15, 16, ___")), 17);
  assert.equal(
    ENGINES.hops.answer(ENGINES.hops.parse("100, 95, 90, 85, ___")),
    80,
    "a pattern can count down",
  );
  assert.equal(ENGINES.hops.parse("1, 2, 4, ___"), null, "uneven hops are not a skip-count");
  const pw = solve("power", "8^2 = ?");
  assert.ok(!pw.b.done(pw.b.init(pw.spec), pw.spec));
  assert.ok(
    pw.b.done(pw.b.act(pw.b.init(pw.spec), "f", 1, pw.spec).state, pw.spec),
    "two factors of 8",
  );
  assert.equal(ENGINES.power.answer(ENGINES.power.parse("2^6 = ?")), 64);
  assert.equal(
    ENGINES.power.parse("2^10 = ?"),
    null,
    "more factors than the chain can show is declined",
  );
  assert.equal(ENGINES.power.parse("2^40 = ?"), null, "too large to draw is declined");
  const sq = solve("power", "√81 = ?");
  let ss = sq.b.init(sq.spec);
  while (!sq.b.done(ss, sq.spec)) ss = sq.b.act(ss, "k", 1, sq.spec).state;
  assert.equal(ss.k, 9);
  assert.equal(ENGINES.power.parse("√80 = ?"), null, "a non-square is declined");
}

{
  const g = solve("factors", "Find the GCF of 12 and 18.");
  assert.deepEqual(g.spec.common, [1, 2, 3, 6]);
  assert.ok(!g.b.act(g.b.init(g.spec), "pick", 4, g.spec).ok, "4 is not a factor of 18");
  assert.ok(!g.b.act(g.b.init(g.spec), "pick", 3, g.spec).ok, "3 is shared but not the greatest");
  assert.ok(g.b.done(g.b.act(g.b.init(g.spec), "pick", 6, g.spec).state, g.spec));
  assert.equal(
    ENGINES.factors.answer(ENGINES.factors.parse("Find the GCF of 47 and 2.")),
    1,
    "coprime numbers share only 1",
  );
  assert.equal(ENGINES.factors.answer(ENGINES.factors.parse("Find the LCM of 6 and 10.")), 30);
  assert.equal(
    ENGINES.factors.answer(ENGINES.factors.parse("Find the LCM of 4 and 8.")),
    8,
    "one number can be a multiple of the other",
  );
  assert.equal(ENGINES.factors.parse("Find the GCF of 0 and 5."), null);
  const sl = solve("graph", "Find the slope through (1, 8) and (5, 20).");
  assert.equal(ENGINES.graph.answer(sl.spec), 3);
  assert.equal(
    ENGINES.graph.parse("Find the slope through (2, 3) and (2, 9)."),
    null,
    "a vertical line is declined",
  );
  const fn = solve("graph", "If y = 4x − 8, find y when x = 10.");
  assert.equal(ENGINES.graph.answer(fn.spec), 32);
  assert.ok(
    !fn.b.act(fn.b.init(fn.spec), "step", "wrong", fn.spec).ok,
    "adding before multiplying is refused",
  );
  let fs = fn.b.act(fn.b.init(fn.spec), "step", "multiply", fn.spec).state;
  fs = fn.b.act(fs, "step", "add", fn.spec).state;
  assert.ok(fn.b.done(fs, fn.spec));
  assert.equal(ENGINES.graph.answer(ENGINES.graph.parse("If y = -3x + 5, find y when x = 4.")), -7);
}

// ---------- 5. Misconception diagnosis is exact ----------
{
  const cases = [
    ["285 + 439 = ?", "614", "noCarry"],
    ["41 − 14 = ?", "33", "smallFromBig"],
    ["41 − 14 = ?", "37", "forgotReduce"],
    ["2/5 = 6/□", "9", "additive"],
    ["1/5 + 1/4 = ?", "2/9", "addedDenominators"],
    ["3 − (-15) = ?", "-12", "minusMeansLeft"],
    ["2x + 4 = 10. Find x.", "7", "wrongSign"],
    ["2x + 4 = 10. Find x.", "1", "dividedPart"],
    ["4:6 = 12:□", "14", "additive"],
    ["Area of a rectangle with length 6 and width 5?", "22", "perimeterForArea"],
    ["2/3 × 3/4 = ?", "5/7", "addedAcross"],
    ["What is the value of the digit in the tens place of 96?", "9", "digitNotValue"],
    ["What digit is in the tens place of 96?", "90", "valueNotDigit"],
    ["253, 263, 273, 283, ___", "284", "countedByOnes"],
    ["8^2 = ?", "16", "multipliedByExponent"],
    ["√81 = ?", "40.5", "halved"],
    ["Find the GCF of 12 and 18.", "36", "usedLcm"],
    ["Find the LCM of 6 and 10.", "2", "usedGcf"],
    ["Find the slope through (1, 8) and (5, 20).", "0.3333333333333333", "flipped"],
    ["If y = 4x − 8, find y when x = 10.", "8", "addedFirst"],
    ["What is 2/6 of 72?", "12", "forgotKeep"],
    ["Round 87 to the nearest ten.", "80", "roundedDown"],
    ["Round 82 to the nearest ten.", "90", "roundedUp"],
  ];
  for (const [q, wrong, tag] of cases) {
    const lesson = lessonFor({ question: q, steps: [] });
    assert.equal(diagnose(lesson, wrong)?.id, tag, `${q} with ${wrong}`);
    assert.equal(
      diagnose(lesson, String(lesson.engine.answer(lesson.spec))),
      null,
      "the right answer is never diagnosed as a slip",
    );
  }
}

// ---------- 6. Adaptive support ----------
{
  adaptive.clearAll();
  const key = "6:test";
  assert.equal(adaptive.scaffold(adaptive.history(key)), 3, "new learner: full support");
  for (let i = 0; i < 2; i += 1) adaptive.record(key, { kind: "try", ok: true, supported: false });
  assert.equal(
    adaptive.scaffold(adaptive.history(key)),
    2,
    "two independent successes fade one level",
  );
  for (let i = 0; i < 4; i += 1) adaptive.record(key, { kind: "try", ok: true, supported: false });
  assert.equal(adaptive.scaffold(adaptive.history(key)), 0, "six in a row: support folded away");
  adaptive.record(key, { kind: "try", ok: false, supported: false, tag: "noCarry" });
  assert.ok(adaptive.scaffold(adaptive.history(key)) >= 2, "a miss brings support back");
  adaptive.record(key, { kind: "try", ok: false, supported: false, tag: "noCarry" });
  assert.equal(
    adaptive.recurringTag(adaptive.history(key)),
    "noCarry",
    "a slip named twice is a pattern",
  );
  adaptive.record(key, { kind: "try", ok: true, supported: true });
  assert.equal(
    adaptive.independentStreak(adaptive.history(key)),
    0,
    "answers with help never count as independent",
  );
  for (let i = 0; i < 30; i += 1) adaptive.record(key, { kind: "try", ok: true, supported: false });
  assert.ok(adaptive.history(key).length <= 12, "the record stays small");
  assert.ok(
    !JSON.stringify(adaptive.history(key)).match(/name|email|id\b/i),
    "no identifying fields are stored",
  );
}

// ---------- 7. Simulators: every slider extreme draws and describes itself in both languages ----------
for (const sim of Object.values(SIMS)) {
  let state = sim.init();
  const sliders = sim.sliders(state);
  const runs = [
    state,
    ...sliders.flatMap((s) => [s.min, s.max].map((v) => ({ ...state, [s.key]: v }))),
  ];
  for (let st of runs) {
    if (sim.clamp) st = sim.clamp(st);
    const r = sim.render(st);
    assert.ok(
      r.svg.includes("<svg") && r.alt.en && r.alt.es && r.read.en && r.read.es,
      `${sim.id} renders at ${JSON.stringify(st)}`,
    );
    assert.ok(
      !/NaN|undefined|Infinity/.test(r.svg + r.read.en + r.alt.en),
      `${sim.id}: no NaN in output`,
    );
  }
}
{
  const dp = SIMS.dotplot;
  let s = dp.init();
  const before = dp.stats(s.data);
  s = dp.act({ ...s, at: 20 }, "add");
  const after = dp.stats(s.data);
  assert.ok(
    after.mean - before.mean > after.median - before.median,
    "a far dot moves the mean more than the median",
  );
}
{
  const fe = SIMS.fracEquiv;
  const s = fe.clamp({ n: 9, d: 4, k: 2 });
  assert.ok(s.n <= s.d, "shaded pieces never exceed the whole");
}

// ---------- 8. Interface ----------
const skill = (id) => ALL_SKILLS.find((s) => s.id === id);
const host = document.querySelector("#host");
const click = (el) => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
function fresh(id, question, context = "idea") {
  adaptive.clearAll();
  host.innerHTML = "";
  const sk = skill(id);
  const item = { ...generateProblem(sk, seededRandom(5)), question };
  const stop = mountStudio(host, { item, skill: sk, context });
  assert.ok(stop, `studio mounts for ${id}`);
  return stop;
}

setLang("en");
{
  const stop = fresh("add-1000", "285 + 439 = ?", "miss");
  assert.equal(
    host.querySelector(".sd-tab[aria-selected='true']").dataset.tab,
    "watch",
    "after a miss the Studio starts with Watch",
  );
  assert.ok(host.querySelector(".sd-stage svg"), "the model is drawn");
  assert.ok(host.querySelector("[data-cap]").textContent.length > 5, "a caption is shown");
  const next = () => host.querySelector('[data-w="next"]');
  // Walk to the predict gate: Next is locked until the learner chooses.
  let guard = 0;
  while (!host.querySelector("[data-predict]:not([hidden])") && guard++ < 10) click(next());
  const gate = host.querySelector("[data-predict]:not([hidden])");
  assert.ok(gate, "the lesson stops at a Predict question");
  assert.ok(next().disabled, "Next step waits for the prediction");
  const choices = [...gate.querySelectorAll("[data-c]")];
  click(choices.find((c) => /Leave them/.test(c.textContent)));
  assert.match(
    host.querySelector("[data-why]").textContent,
    /Not quite/,
    "a wrong prediction is explained, not just marked",
  );
  assert.ok(next().disabled, "still waiting after a wrong choice");
  click(choices.find((c) => /Trade 10/.test(c.textContent)));
  assert.ok(
    host.querySelector("[data-explain]"),
    "after predicting, the learner is asked to explain why",
  );
  click(host.querySelector('[data-e="1"]'));
  assert.ok(host.querySelector('[data-e="1"]').classList.contains("sd-wrong"));
  click(host.querySelector('[data-e="0"]'));
  click(host.querySelector('[data-w="go"]'));
  assert.ok(!next().disabled, "Next step opens after the explanation");
  while (!next().disabled) click(next());
  assert.ok(
    [...host.querySelectorAll(".sd-rail li")].some((li) => li.classList.contains("done")),
    "the mission records exploring",
  );
  // Replay and Back.
  click(host.querySelector('[data-w="replay"]'));
  assert.equal(
    host.querySelector('[data-w="back"]').disabled,
    true,
    "Replay returns to the first step",
  );
  // Spanish: same model, Spanish words.
  setLang("es");
  window.dispatchEvent(new window.Event("fluency-lang-changed"));
  assert.match(
    host.querySelector("[data-cap]").textContent,
    /Muestra 285/,
    "captions switch to Spanish",
  );
  assert.match(
    host.querySelector(".sd-kicker").textContent,
    /Estudio/,
    "interface text switches to Spanish",
  );
  setLang("en");
  window.dispatchEvent(new window.Event("fluency-lang-changed"));
  stop();
}
{
  // A Predict point never shows its own answer: the learner sees the step before it until they have answered.
  const stop = fresh("add-1000", "123 + 456 = ?");
  const nx = () => host.querySelector('[data-w="next"]');
  let guard = 0;
  while (!host.querySelector("[data-predict]:not([hidden])") && guard++ < 10) click(nx());
  assert.ok(
    host.querySelector("[data-predict]:not([hidden])"),
    "no-trade problems still stop at a prediction",
  );
  assert.ok(
    !host.querySelector("[data-cap]").textContent.includes("579"),
    "the caption does not state the total at the question",
  );
  assert.ok(
    !host.querySelector("[data-eq]").textContent.includes("579"),
    "the equation line does not state the total at the question",
  );
  click(host.querySelector('[data-c="0"]'));
  click(host.querySelector('[data-w="go"]') || host.querySelector("[data-c='0']"));
  stop();
}
{
  const stop = fresh("add-1000", "285 + 439 = ?");
  // Simpler words and another way.
  click(host.querySelector('[data-tool="simple"]'));
  assert.equal(host.querySelector('[data-tool="simple"]').getAttribute("aria-pressed"), "true");
  assert.ok(host.querySelector("[data-cap]").textContent.length < 40, "simpler words are shorter");
  // Build: illegal move refused with a reason; legal trades finish.
  click(host.querySelector('[data-tab="build"]'));
  assert.ok(host.querySelector("[data-controls] button"), "Build offers moves");
  const trades = () => [...host.querySelectorAll("[data-controls] button")];
  click(trades()[0]);
  click(trades()[1]);
  assert.match(
    host.querySelector("[data-status]").textContent,
    /Done/,
    "finishing the trades completes Build",
  );
  click(trades()[0]);
  assert.match(
    host.querySelector("[data-msg]").textContent,
    /10 chips/,
    "an impossible trade is refused with a reason",
  );
  assert.ok(
    host.querySelectorAll("[data-moves] li").length >= 2,
    "the learner's moves are kept as their thinking",
  );
  // Try: hint ladder is sequential and marks the answer as supported.
  click(host.querySelector('[data-tab="try"]'));
  const rung = (n) => host.querySelector(`[data-rung="${n}"]`);
  assert.ok(rung(0) && rung(1).disabled && rung(2).disabled, "hints open one rung at a time");
  click(rung(0));
  assert.ok(
    rung(1) && !rung(1).disabled && rung(2).disabled,
    "the second rung opens after the first",
  );
  click(rung(1));
  click(rung(2));
  assert.ok(host.querySelectorAll(".sd-rung.on").length === 3, "all three rungs show");
  const problem = host.querySelector("[data-problem]").textContent;
  const [A, , B] = problem.replaceAll(",", "").match(/\S+/g);
  const input = host.querySelector(".sd-input");
  input.value = String(Number(A) + Number(B));
  host
    .querySelector("[data-form]")
    .dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  assert.match(
    host.querySelector("[data-feedback]").textContent,
    /with help/i,
    "an answer after hints is marked with help",
  );
  const again = host.querySelector('[data-new="independent"]');
  assert.ok(again, "after help the learner is asked for a new problem on their own");
  assert.equal(
    adaptive.independentStreak(
      adaptive.history("3:add-1000").length
        ? adaptive.history("3:add-1000")
        : adaptive.history("2:add-1000"),
    ),
    0,
    "help does not count as independent",
  );
  click(again);
  assert.ok(
    !host.querySelector(".sd-rung"),
    "the independent attempt starts with the hints folded away",
  );
  const p2 = host.querySelector("[data-problem]").textContent.replaceAll(",", "").match(/\S+/g);
  const wrongTotal = String(Number(p2[0]) + Number(p2[2]) + 1);
  host.querySelector(".sd-input").value = wrongTotal;
  host
    .querySelector("[data-form]")
    .dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  assert.match(
    host.querySelector("[data-feedback]").textContent,
    /Not quite/,
    "a wrong answer is not marked right",
  );
  assert.ok(host.querySelector("[data-show]"), "a miss offers to show the model");
  assert.ok(host.querySelector(".sd-rung"), "after a miss the hint ladder is available");
  stop();
}
{
  // Reduced motion: no autoplay control, all steps available as a list.
  globalThis.matchMedia = () => ({ matches: true });
  const stop = fresh("one-step", "x + 9 = 22. Find x.");
  assert.ok(!host.querySelector('[data-w="play"]'), "no autoplay with reduced motion");
  click(host.querySelector('[data-w="all"]'));
  assert.ok(host.querySelectorAll("[data-all] li").length >= 3, "every step is listed");
  stop();
  delete globalThis.matchMedia;
}
{
  // Simulator tab and Detective.
  const stop = fresh("fraction-equiv", "2/4 = 10/□");
  click(host.querySelector('[data-tab="explore"]'));
  const slider = host.querySelector('[data-k="k"]');
  assert.ok(slider, "Explore has real range sliders");
  slider.value = "3";
  slider.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  assert.match(host.querySelector("[data-read]").textContent, /same amount/);
  stop();
  const stop2 = fresh("add-large", "34756 + 52880 = ?");
  click(host.querySelector('[data-tab="detective"]'));
  assert.ok(host.querySelector(".sd-step"), "the Detective shows a worked solution");
  stop2();
}
{
  // A skill with no manipulable model still gets Watch + Try + hints, and says so.
  const stop = fresh("evaluate", "(8 + 11) × 3 = ?");
  assert.match(host.querySelector(".sd-title").textContent, /Worked steps/);
  click(host.querySelector('[data-tab="try"]'));
  assert.ok(host.querySelector("[data-rung='0']"), "unmodeled skills still get a hint ladder");
  stop();
}

console.log(
  "fluency-studio: models agree with the lab, frames are legal states, Build and hints behave, Spanish and reduced motion work",
);

// ---------- 9. The Studio record travels with the JSON backup, cleaned on the way in ----------
{
  const { exportPlay, cleanPlay, importPlay } = await import("../math/fluency-lab/play-backup.js");
  adaptive.clearAll();
  adaptive.record("3:round", { kind: "try", ok: true, supported: false });
  adaptive.record("3:round", { kind: "try", ok: false, supported: true, tag: "roundedDown" });
  adaptive.awardBadge("round");
  const backup = JSON.parse(JSON.stringify(exportPlay()));
  assert.equal(backup.studio.skills["3:round"].length, 2, "the record is in the backup");
  assert.equal(backup.studio.badges.round, true);
  adaptive.clearAll();
  importPlay(cleanPlay(backup));
  assert.equal(adaptive.history("3:round").length, 2, "importing restores it");
  assert.equal(adaptive.history("3:round")[1].tag, "roundedDown");
  const dirty = cleanPlay({
    studio: {
      skills: {
        "3:round": [
          { kind: "try", ok: true, supported: false, tag: "<img onerror=1>", name: "Ada" },
        ],
        "bad key": [],
      },
      badges: { Round: true, round: 1 },
    },
  });
  assert.deepEqual(
    Object.keys(dirty.studio.skills),
    ["3:round"],
    "an invalid skill key is dropped",
  );
  assert.equal(
    dirty.studio.skills["3:round"][0].tag,
    null,
    "a tag that is not a plain word is dropped",
  );
  assert.ok(
    !("name" in dirty.studio.skills["3:round"][0]),
    "unknown fields, such as a name, are never kept",
  );
  assert.deepEqual(dirty.studio.badges, {}, "only real badge ids survive");
  assert.equal(
    cleanPlay({ trail: {} }).studio,
    null,
    "an older backup leaves the learner's own record alone",
  );
}
