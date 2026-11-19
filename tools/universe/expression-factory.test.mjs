// Expression Factory — the line is the expression. Mathematics recomputed with
// an independent evaluator, every order solvable within its slots, every room
// played through the rules, and the slips recognised.
import assert from "node:assert/strict";
import {
  createWorld,
  LEVELS,
  STATION_X,
  TRUCK_X,
} from "../../math/games/universe/games/expression-factory/levels.js";
import {
  equivalent,
  evaluate,
  linear,
  sameChain,
  simplest,
  write,
} from "../../math/games/universe/games/expression-factory/math.js";
import { rules } from "../../math/games/universe/games/expression-factory/rules.js";
import { Simulation } from "../../math/games/universe/runtime/sim.js";
import { Timeline } from "../../math/games/universe/runtime/timeline.js";

const M = (op, k) => (k === undefined ? { op } : { op, k });
// Independent evaluator over plain numbers.
const ref = (line, x) =>
  line.reduce(
    (v, m) =>
      ({ "+": v + m.k, "-": v - m.k, "*": v * m.k, "/": v / m.k, "+x": v + x, "-x": v - x })[m.op],
    x,
  );

// ---------- mathematics ----------
for (let x = -5; x <= 9; x++)
  for (const line of [
    [M("*", 3), M("+", 2)],
    [M("+", 1), M("*", 4)],
    [M("+x"), M("+", 2), M("+x"), M("+", 3)],
    [M("+", 3), M("*", 4), M("-x")],
    [M("+", 4), M("/", 2)],
  ]) {
    const v = evaluate(line, x);
    assert.ok(Math.abs(v.n / v.d - ref(line, x)) < 1e-12);
  }
assert.equal(write([M("*", 3), M("+", 2)]), "3x + 2");
assert.equal(write([M("+", 1), M("*", 4)]), "4(x + 1)");
assert.equal(write([M("+", 4), M("/", 2)]), "(x + 4) ÷ 2");
assert.equal(simplest([M("+x"), M("+", 2), M("+x"), M("+", 3)]), "3x + 5");
assert.equal(simplest([M("+", 3), M("*", 4), M("-x")]), "3x + 12");
assert.equal(simplest([M("*", 2), M("-", 1)]), "2x − 1");
assert.ok(equivalent([M("+", 3), M("*", 2)], [M("*", 2), M("+", 6)]));
assert.ok(!equivalent([M("+", 3), M("*", 2)], [M("*", 2), M("+", 3)]));
// x can go in a box: x + x is 2x, x times x is x squared, and a line with x² is not linear.
assert.equal(write([M("*x")]), "x²");
assert.equal(write([M("*", 3), M("*x")]), "3x²");
assert.equal(simplest([M("+x"), M("+x")]), "3x");
assert.ok(equivalent([M("+x"), M("+x")], [M("*", 3)]));
assert.ok(
  !equivalent([M("*x")], [M("*", 2)]),
  "x times x is not 2x, though they agree at x = 0 and x = 2",
);
assert.ok(equivalent([M("*", 3), M("+", 5)], [M("+x"), M("+", 2), M("+x"), M("+", 3)]));
assert.deepEqual(linear([M("+", 2), M("*", 3)]), { a: { n: 3, d: 1 }, b: { n: 6, d: 1 } });

// ---------- every order is solvable within its slots, and twin rooms have a DIFFERENT answer ----------
const KS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
for (const L of LEVELS)
  for (const r of L.rooms) {
    if (r.kind === "quiz") continue;
    // Each box takes an operation with a number or with x ("+" with x is the "+x" machine).
    const machines = r.ops.flatMap((op) => [M(`${op}x`), ...KS.map((k) => M(op, k))]);
    let found = 0;
    for (const a of machines)
      for (const b of machines) {
        const line = [a, b].slice(0, r.slots);
        if (equivalent(line, r.target) && (r.kind !== "twin" || !sameChain(line, r.target)))
          found++;
      }
    assert.ok(found > 0, `${L.id}: an order (${write(r.target)}) can be built in ${r.slots} slots`);
    if (r.kind === "streamline")
      assert.ok(r.target.length > r.slots, "streamline rooms start with too many machines");
  }

// ---------- identify and match rooms: one right card, and no grouped (distributive) forms in 6-5 ----------
for (const r of LEVELS[1].rooms) {
  assert.ok(!write(r.target).includes("("), `6-5 stays simple: ${write(r.target)}`);
  if (r.kind !== "identify" && r.kind !== "match") continue;
  for (const o of r.options) assert.ok(!write(o).includes("("), `6-5 stays simple: ${write(o)}`);
  assert.equal(
    r.options.filter((o) => equivalent(o, r.target)).length,
    1,
    `${write(r.target)}: exactly one card is right`,
  );
  assert.equal(new Set(r.options.map(write)).size, r.options.length, "no two cards read the same");
}

// ---------- Word Crates (6-5): every card set has one right answer, recomputed independently ----------
const num = (text, vars) =>
  Function(
    `return (${text
      .replace(/(\d)([a-z])/g, "$1*$2")
      .replace(/[a-z]/g, (v) => `(${vars[v]})`)
      .replaceAll("×", "*")
      .replaceAll("÷", "/")
      .replaceAll("−", "-")})`,
  )();
assert.equal(LEVELS[0].id, "word-crates", "6-5 opens on Word Crates");
let crates = 0;
for (const r of LEVELS[0].rooms)
  for (const it of r.items) {
    crates++;
    for (const st of it.steps) {
      assert.equal(new Set(st.choices).size, st.choices.length, "no two cards read the same");
      assert.equal(st.choices.filter((c) => c === st.answer).length, 1, "exactly one right card");
      for (const c of Object.keys(st.slips || {}))
        assert.ok(st.choices.includes(c), `slip ${c} is a card`);
    }
    const text = [it.show, ...it.steps.map((x) => x.answer)].join(" ");
    assert.ok(!/\(/.test(text), `no grouped forms in 6-5: ${text}`);
    if (it.phrase) {
      assert.ok(it.phrase.en && it.phrase.es && it.phrase.en !== it.phrase.es);
      continue;
    }
    // Every step's right card has the value of the expression at the given values.
    const vars = Object.fromEntries(it.when.split(",").map((p) => p.trim().split(" = ")));
    const value = num(it.show, vars);
    for (const st of it.steps)
      assert.equal(num(st.answer, {}), value, `${it.show}, ${it.when}: ${st.answer}`);
    assert.ok(
      it.steps
        .slice(0, -1)
        .every((st) => st.choices.every((c) => c === st.answer || num(c, {}) !== value)),
      `${it.show}: a wrong substitution card is not secretly right`,
    );
  }
assert.ok(crates >= 35, "lots of practice");
// Words cards: the right card means the phrase (checked at n = 10 against the phrase's own operation).
const WORDS = {
  "3 more than y": 13,
  "The sum of m and 5": 15,
  "p increased by 6": 16,
  "Take away 5 from c": 5,
  "w fewer than 7": -3,
  "A number plus 9": 19,
  "A number decreased by 6": 4,
  "The difference between z and 12": -2,
  "The product of 6 and k": 60,
  "Triple b": 30,
  "Double a number": 20,
  "t divided by 9": 10 / 9,
  "d split into 4 equal groups": 2.5,
  "Half of j": 5,
  "5 times r": 50,
  "8 less than q": 2,
  "The quotient of h and 3": 10 / 3,
  "Twice g": 20,
  "The total of s and 11": 21,
};
for (const r of LEVELS[0].rooms)
  for (const it of r.items.filter((x) => x.phrase)) {
    const want = WORDS[it.phrase.en];
    assert.ok(want !== undefined, `phrase checked: ${it.phrase.en}`);
    const ten = (c) => num(c, new Proxy({}, { get: () => 10 }));
    assert.ok(
      Math.abs(ten(it.steps[0].answer) - want) < 1e-9,
      `${it.phrase.en} → ${it.steps[0].answer}`,
    );
    assert.equal(
      it.steps[0].choices.filter((c) => Math.abs(ten(c) - want) < 1e-9).length,
      1,
      `${it.phrase.en}: one card means it`,
    );
  }

// ---------- play through the rules ----------
function play(index) {
  const sim = new Simulation(rules, createWorld(index, 9));
  const tl = new Timeline(sim);
  const log = [];
  const act = (a) => {
    tl.mark("x", { en: a.type, es: a.type }, a);
    sim.drain(log);
  };
  const run = (room) => {
    act({ type: "run", room });
    for (let i = 0; i < 1200 && sim.world.rooms[room].run; i++) {
      tl.step(0);
      sim.drain(log);
    }
    return log.filter((e) => e.type === "outcome").at(-1);
  };
  const set = (room, slots) => slots.forEach((m, slot) => act({ type: "set", room, slot, m }));
  return { sim, tl, log, act, run, set, w: () => sim.world };
}

// Level 1: Word Crates, played through the rules.
{
  const g = play(0);
  const answer = (room, choice) => {
    g.act({ type: "answer", room, choice });
    return g.log.filter((e) => e.type === "outcome").at(-1);
  };
  let o = answer(0, "3y");
  assert.deepEqual([o.ok, o.key], [false, "quizMiss"]);
  assert.equal(g.w().rooms[0].at, 0, "a wrong card packs nothing");
  o = answer(0, "y + 3");
  assert.deepEqual([o.ok, o.key, o.mechanic], [true, "quizCrate", "words-to-symbols"]);
  assert.equal(g.w().rooms[0].firstTry, 0, "a crate missed once is not first try");
  for (let k = 0; k < 3; k++) answer(0, g.w().rooms[0].items[g.w().rooms[0].at].steps[0].answer);
  o = answer(0, "w − 7");
  assert.equal(o.misconception, "op-reversed-subtraction", "w fewer than 7 is not w − 7");
  // Every room, every crate, every step, right card: the gates open.
  for (const r of g.w().rooms) while (!r.done) answer(r.i, r.items[r.at].steps[r.step].answer);
  assert.ok(g.w().rooms.every((r) => g.w().solids[r.gate].open));
  assert.equal(
    g.w().rooms[4].firstTry,
    g.w().rooms[4].items.length,
    "a clean room is all first try",
  );
  assert.equal(
    g.w().rooms[4].best,
    g.w().rooms[4].items.length,
    "the streak counts crates in a row",
  );
  const g2 = play(0);
  for (let k = 0; k < 3; k++) {
    const r = g2.w().rooms[3];
    g2.act({ type: "answer", room: 3, choice: r.items[0].steps[r.step].answer });
  }
  const r3 = g2.w().rooms[3];
  assert.equal(r3.at, 1);
  for (let i = 0; i < 200; i++) g2.tl.step(0);
  assert.equal(r3.pos[0], TRUCK_X, "a packed crate rides into the truck");
  assert.equal(r3.pos[1], STATION_X, "the next crate comes to the station");
}

// Level 2: building expressions, easy first; the reversed order is the classic slip.
{
  const g = play(1);
  g.set(0, [M("+", 4)]);
  assert.equal(g.run(0).ok, true, "x + 4 in one box");
  g.set(2, [M("+", 2)]);
  assert.equal(g.run(2).ok, false, "x + 2 is not 2x");
  g.set(2, [M("*", 2)]);
  assert.equal(g.run(2).ok, true);
  g.set(4, [M("+", 2), M("*", 3)]);
  let o = g.run(4);
  assert.deepEqual(
    [o.ok, o.misconception],
    [false, "order-of-operations-left-to-right"],
    "the reversed order is not 3x + 2",
  );
  assert.equal(o.vars.misses, "1, 2, 3, 4", "every crate is rejected");
  assert.equal(
    g.log.filter((e) => e.type === "stamp" && e.room === 4).length,
    8,
    "two stamps per crate",
  );
  g.set(4, [M("*", 3), M("+", 2)]);
  o = g.run(4);
  assert.equal(o.ok, true);
  assert.equal(g.w().solids[g.w().rooms[4].gate].open, 1);
  g.set(6, [M("*", 2), M("-", 1)]);
  assert.equal(g.run(6).ok, true);
}

// Level 2, identify and match rooms: wrong cards show the crates they fail, the right one fills the order.
{
  const g = play(1);
  const pick = (room, i) => {
    g.act({ type: "pick", room, i });
    for (let k = 0; k < 1200 && g.w().rooms[room].run; k++) {
      g.tl.step(0);
      g.sim.drain(g.log);
    }
    return g.log.filter((e) => e.type === "outcome").at(-1);
  };
  const right = (room) =>
    g.w().rooms[room].options.findIndex((o) => equivalent(o, g.w().rooms[room].target));
  assert.equal(
    g
      .w()
      .rooms[5].line.map((m) => `${m.op}${m.k}`)
      .join(),
    "*2,+5",
    "an identify line is pre-built",
  );
  let o = pick(5, 0);
  assert.deepEqual([o.ok, o.key], [false, "cratesRejected"], "5x + 2 is not 2x + 5");
  assert.equal(g.w().rooms[5].done, 0);
  o = pick(5, right(5));
  assert.deepEqual([o.ok, o.key], [true, "identifyOk"]);
  assert.equal(g.w().solids[g.w().rooms[5].gate].open, 1);
  o = pick(7, 1);
  assert.equal(o.ok, false, "4x + 3 is not 4x − 3");
  assert.equal(
    g
      .w()
      .rooms[7].line.map((m) => `${m.op}${m.k}`)
      .join(),
    "*4,+3",
    "a match card is installed on the belt",
  );
  o = pick(7, right(7));
  assert.deepEqual([o.ok, o.key, o.mechanic], [true, "matchOk", "match-expression"]);
  o = pick(1, right(1));
  assert.equal(o.ok, true);
  assert.equal(pick(3, right(3)).ok, true);
  g.act({ type: "set", room: 1, slot: 0, m: { op: "+", k: 1 } });
  assert.deepEqual(
    g.w().rooms[1].line[0],
    { op: "*", k: 3 },
    "a built identify line cannot be edited",
  );
}

// Level 3: twin lines must differ from the reference and still match every crate.
{
  const g = play(2);
  g.set(0, [M("+", 3), M("*", 2)]);
  let o = g.run(0);
  assert.deepEqual(
    [o.ok, o.key],
    [false, "twinSame"],
    "a copy of the reference line is not a new expression",
  );
  g.set(0, [M("*", 2), M("+", 3)]);
  o = g.run(0);
  assert.deepEqual(
    [o.ok, o.misconception],
    [false, "algebra-distributive-partial"],
    "2x + 3 for 2(x + 3)",
  );
  g.set(0, [M("*", 2), M("+", 6)]);
  assert.equal(g.run(0).ok, true);
  g.set(1, [M("+", 2), M("*", 4)]);
  assert.equal(g.run(1).ok, true);
  g.set(2, [M("*", 5), M("-", 5)]);
  assert.equal(g.run(2).ok, true);
}

// Level 4: streamline into two machines.
{
  const g = play(3);
  g.set(0, [M("*", 3), M("+", 5)]);
  assert.equal(g.run(0).ok, true);
  g.set(1, [M("*", 3), M("+", 2)]);
  const o = g.run(1);
  assert.equal(o.ok, false);
  g.set(1, [M("+", 2), M("*", 3)]);
  assert.equal(g.run(1).ok, true, "3(x + 2) streamlines 2x + 6 + x");
  g.set(2, [M("+", 4), M("*", 3)]);
  assert.equal(g.run(2).ok, true);
  const r = g.tl.replay(g.tl.head);
  while (r.pump());
  assert.ok(r.verify());
  r.end();
}

console.log(
  "PASS expression factory: mathematics, every order solvable, four levels played (Word Crates first), slips recognised",
);
