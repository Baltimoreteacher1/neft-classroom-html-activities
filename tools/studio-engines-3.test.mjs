// Unit tests for the escape-challenge, vocab-quest and argument-builder logic and their gold activities.
//   node --test tools/studio-engines-3.test.mjs
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { createItemLoop } from "../bcpss-teachers/studio/engines/engine-core.js";
import * as E from "../bcpss-teachers/studio/engines/escape/escape-logic.js";
import { validateEscape } from "../bcpss-teachers/studio/engines/escape/escape-validate.js";

const STUDIO = resolve(new URL("..", import.meta.url).pathname, "bcpss-teachers/studio");
const load = async (rel) => (await import(pathToFileURL(resolve(STUDIO, rel)).href)).default;

// ---------------------------------------------------------------- escape-challenge
const escape = await load("data/activities/gold-escape-challenge.js");

test("rational parsing is exact", () => {
  const c = (s) => E.canon(E.parseRational(s));
  assert.equal(c("0.75"), "3/4");
  assert.equal(c("6/8"), "3/4");
  assert.equal(c("7 1/2"), "15/2");
  assert.equal(c("$12"), "12");
  assert.equal(c("1,200"), "1200");
  assert.equal(c(" -1/2 "), "-1/2");
  assert.equal(c(0.1), "1/10");
  assert.equal(E.parseRational("0.7").n === 3n, false);
  for (const bad of ["", "abc", "3/0", "1/2/3", "12 dollars", "1.2.3", null])
    assert.equal(E.parseRational(bad), null, `"${bad}"`);
  assert.equal(E.canon(E.evalCalc("(1/3 + 1/6) * 4")), "2");
  assert.equal(E.canon(E.evalCalc("0.1 + 0.2")), "3/10");
  assert.throws(() => E.evalCalc("2 ** 3"));
});

test("gold escape challenge validates (structure, arithmetic, no leaked answers)", () => {
  assert.deepEqual(validateEscape(escape), []);
  assert.ok(escape.rooms.length >= 3 && escape.rooms.length <= 5);
});

test("validator catches a numeric calc that disagrees and a hint that leaks", () => {
  const bad = structuredClone(escape);
  bad.rooms[0].puzzle.calc = "9/13";
  assert.ok(validateEscape(bad).some((m) => /calc/.test(m)));
  const leak = structuredClone(escape);
  leak.rooms[0].puzzle.hints[2] = "The answer is 3/4 of a dollar.";
  assert.ok(validateEscape(leak).some((m) => /contains the answer/.test(m)));
  const noTransfer = structuredClone(escape);
  delete noTransfer.rooms[1].puzzle.transfer;
  assert.ok(validateEscape(noTransfer).length > 0);
});

const perms = (arr) =>
  arr.length <= 1
    ? [arr]
    : arr.flatMap((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [x, ...p]));
function* allMatches(p) {
  const ids = p.rights.map((r) => r.id);
  const rec = function* (i, acc) {
    if (i === p.lefts.length) return yield { ...acc };
    for (const r of ids) yield* rec(i + 1, { ...acc, [p.lefts[i].id]: r });
  };
  yield* rec(0, {});
}
function wrongResponses(p) {
  const out = [];
  if (p.type === "numeric") {
    for (const s of [
      "0",
      "1",
      "2",
      "3",
      "4/3",
      "108",
      "0.7",
      "0.76",
      "-3/4",
      "12",
      "9",
      "1/12",
      "75/100 1",
      "3/5",
      "5/4",
    ])
      out.push(s);
  } else if (p.type === "choice" || p.type === "explain") {
    p.choices.forEach((_, i) => out.push(i));
  } else if (p.type === "order") {
    out.push(...perms(p.items.map((x) => x.id)));
  } else if (p.type === "match") {
    out.push(...allMatches(p));
  } else if (p.type === "sort") {
    const rec = (i, acc) =>
      i === p.cards.length
        ? [{ ...acc }]
        : p.bins.flatMap((b) => rec(i + 1, { ...acc, [p.cards[i].id]: b.id }));
    out.push(...rec(0, {}));
  }
  return out.filter((r) => !E.isCorrect(p, r));
}

test("every wrong answer to every puzzle is rejected and never grants a code piece", () => {
  for (const room of escape.rooms) {
    for (const p of [room.puzzle, room.puzzle.transfer]) {
      const good = E.correctResponse(p);
      assert.ok(E.isCorrect(p, good), `${room.id} correct response accepted`);
      const goodToken = E.tokenOf(p, good);
      const wrong = wrongResponses(p);
      assert.ok(wrong.length >= 2, `${room.id}: enough wrong responses to test (${wrong.length})`);
      for (const w of wrong) {
        assert.equal(E.isCorrect(p, w), false);
        const t = E.tokenOf(p, w);
        if (t != null)
          assert.notEqual(t, goodToken, `${room.id}: a wrong response derives the right piece`);
      }
    }
    const session = E.createSession(escape);
    for (const w of wrongResponses(room.puzzle)) {
      const r = session.submit(room.id, w);
      assert.equal(r.ok, false);
      assert.equal(r.piece, null);
    }
    assert.deepEqual(session.pieces, {}, `${room.id}: no piece after only wrong answers`);
  }
});

test("tokens are injective over all complete responses of order and match puzzles", () => {
  for (const room of escape.rooms) {
    const p = room.puzzle;
    if (p.type !== "order" && p.type !== "match") continue;
    const seen = new Map();
    const all = p.type === "order" ? perms(p.items.map((x) => x.id)) : [...allMatches(p)];
    for (const r of all) {
      const t = E.tokenOf(p, r);
      const key = JSON.stringify(r);
      if (seen.has(t))
        assert.fail(`${room.id}: ${key} and ${seen.get(t)} derive the same piece ${t}`);
      seen.set(t, key);
    }
  }
});

test("the code is derived from the learner's accepted answers, not stored", () => {
  const s = E.createSession(escape);
  // equivalent numeric spellings are all accepted and derive the same piece
  for (const spelling of ["3/4", "0.75", "6/8", "$0.75"]) {
    const t = E.createSession(escape);
    assert.equal(t.submit("supply", spelling).ok, true, spelling);
    assert.equal(t.pieces.supply, "3/4");
  }
  assert.equal(s.code(), null);
  for (const room of escape.rooms) {
    assert.equal(s.code(), null);
    s.submit(room.id, E.correctResponse(room.puzzle));
  }
  assert.equal(E.normalizeCode(s.code()), "LAMP3/4KELPTIDE");
  assert.equal(s.displayCode(), "L.A.M.P · 3/4 · K.E.L.P · TIDE");
});

test("the code is unavailable when any single room was answered wrong", () => {
  for (const skip of escape.rooms) {
    const s = E.createSession(escape);
    for (const room of escape.rooms) {
      if (room.id === skip.id) {
        const w = wrongResponses(room.puzzle)[0];
        assert.equal(s.submit(room.id, w).ok, false);
      } else s.submit(room.id, E.correctResponse(room.puzzle));
    }
    assert.equal(s.code(), null, `skipping ${skip.id}`);
    assert.equal(s.allSolved(), false);
    assert.equal(
      s.checkDoor("LAMP3/4KELPTIDE").ok,
      false,
      "typing the known code does not open the door early",
    );
  }
});

test("door: right code opens; order and missing pieces are diagnosed without values", () => {
  const s = E.createSession(escape);
  for (const room of escape.rooms) s.submit(room.id, E.correctResponse(room.puzzle));
  assert.equal(s.checkDoor("lamp 3/4 - kelp - tide").ok, true);
  assert.equal(s.checkDoor("L.A.M.P.3/4.K.E.L.P.TIDE").ok, true);
  const wrongOrder = s.checkDoor("TIDE LAMP 3/4 KELP");
  assert.equal(wrongOrder.ok, false);
  assert.equal(wrongOrder.orderOnly, true);
  const missing = s.checkDoor("LAMP KELP TIDE");
  assert.equal(missing.ok, false);
  assert.deepEqual(missing.missing, ["supply"]);
  assert.equal(s.checkDoor("").ok, false);
  assert.equal(s.checkDoor("OPEN SESAME").ok, false);
  const json = JSON.stringify(missing);
  assert.ok(!json.includes("3/4"), "diagnosis never reveals a piece");
});

test("misconception diagnosis maps wrong answers to named tags", () => {
  const [supply, , rope, oil] = escape.rooms.map((r) => r.puzzle);
  assert.equal(E.diagnose(supply, "4/3").tag, "inverted-rate");
  assert.equal(E.diagnose(supply, "3").tag, "subtracted-instead-of-divided");
  assert.equal(E.diagnose(supply, "7"), null);
  assert.equal(E.diagnose(rope, ["d", "c", "b", "a"]).tag, "highest-first");
  assert.equal(E.diagnose(rope, ["a", "c", "b", "d"]).tag, "ordered-by-total-price");
  assert.equal(
    E.diagnose(oil, { l1: "r5", l2: "r2", l3: "r3", l4: "r4" }).tag,
    "subtracted-instead-of-divided",
  );
  assert.equal(
    E.diagnose(oil, { l1: "r1", l2: "r2", l3: "r6", l4: "r4" }).tag,
    "swapped-rate-units",
  );
  assert.equal(E.diagnose(supply, ""), null, "incomplete responses are not diagnosed");
});

test("stuck path: hint ladder, worked example on try 3, parallel puzzle on try 4, model stays after", () => {
  const room = escape.rooms[0];
  const loop = createItemLoop(E.loopItem(room));
  const kinds = [];
  const wrongs = ["4/3", "7", "3", "108", "9"];
  for (const w of wrongs) {
    const diag = E.diagnose(room.puzzle, w);
    kinds.push(loop.submit({ ok: false, tag: diag?.tag }).kind);
  }
  assert.deepEqual(kinds, ["retry", "retry", "model", "transfer", "model"]);
  assert.ok(loop.state.tags.includes("inverted-rate"));
  assert.equal(loop.nextHint(), room.puzzle.hints[0]);
  assert.equal(loop.nextHint(), room.puzzle.hints[1]);
  const r = loop.submit({ ok: true });
  assert.equal(r.kind, "right");
  assert.equal(loop.record().ok, true);
  assert.equal(loop.record().tries, 6);
});

test("debrief separates secure ideas from ones that needed support", () => {
  const rec = {
    supply: { ok: true, tries: 1, hints: 0, tags: [] },
    signal: { ok: true, tries: 3, hints: 2, tags: ["additive-reasoning"], model: true },
    rope: { ok: true, tries: 1, hints: 1, tags: [] },
    oil: { ok: true, tries: 5, hints: 0, tags: [], model: true, transfer: true },
  };
  const rows = E.debrief(escape.rooms, rec);
  assert.deepEqual(
    rows.map((r) => r.secure),
    [true, false, false, false],
  );
  assert.ok(rows[1].used.includes("2 hints") && rows[1].used.includes("a worked example"));
  assert.ok(rows[3].used.includes("a related puzzle"));
  assert.equal(rows[0].concept, "Finding a unit rate by dividing");
});

test("order puzzles never start in the answer order", () => {
  const p = escape.rooms[2].puzzle;
  const shuffle = (list) => [...list];
  for (let i = 0; i < 20; i++) assert.notDeepEqual(E.startOrder(p, shuffle, `s${i}`), p.answer);
});

test("sort and multi-select explain types work (fixture)", () => {
  const sort = {
    type: "sort",
    bins: [
      { id: "b1", label: "Better buy" },
      { id: "b2", label: "Costs more" },
    ],
    cards: [
      { id: "c1", bin: "b1", token: "A" },
      { id: "c2", bin: "b2", token: "B" },
      { id: "c3", bin: "b1", token: "C" },
      { id: "c4", bin: "b2", token: "D" },
    ],
  };
  assert.ok(E.isCorrect(sort, { c1: "b1", c2: "b2", c3: "b1", c4: "b2" }));
  assert.equal(E.tokenOf(sort, { c1: "b1", c2: "b2", c3: "b1", c4: "b2" }), "A.C|B.D");
  assert.equal(E.isCorrect(sort, { c1: "b2", c2: "b2", c3: "b1", c4: "b2" }), false);
  assert.equal(E.isCorrect(sort, { c1: "b1" }), false);
  const multi = {
    type: "explain",
    choices: ["a", "b", "c", "d"],
    answer: [0, 2],
    tokens: ["W", "X", "Y", "Z"],
  };
  assert.ok(E.isCorrect(multi, [2, 0]));
  assert.equal(E.tokenOf(multi, [2, 0]), "W+Y");
  assert.equal(E.isCorrect(multi, [0]), false);
  assert.equal(E.isCorrect(multi, [0, 1, 2]), false);
  assert.equal(
    E.diagnose({ ...multi, misconceptions: [{ tag: "x", has: ["1"], hint: "h" }] }, [0, 1])?.tag,
    "x",
  );
});
