import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  audienceRecord,
  readAudience,
  roleOrder,
  TEACHER_ROLES,
} from "../access-practice-lab/src/audience.js";
import {
  move,
  newGame,
  roundFor,
  segment,
  TEMPLATE_IDS,
} from "../access-practice-lab/src/reading-path/games/engine.js";
import {
  clampReel,
  isRealWord,
  machineWord,
  REAL_WORDS,
  REELS,
} from "../access-practice-lab/src/reading-path/games/machine.js";
import {
  choose,
  cleanProgress,
  nextUnit,
  seededOrder,
  unitDone,
} from "../access-practice-lab/src/reading-path/model.js";
import { paginateWordCards } from "../access-practice-lab/src/reading-path/view.js";

const scope = JSON.parse(
  readFileSync(
    new URL("../access-practice-lab/content/reading-path/phonics-scope.json", import.meta.url),
  ),
);
for (const template of TEMPLATE_IDS)
  test(`${template}: a wrong move commits nothing; there is no clock`, () => {
    const unit = scope.units.find((u) => u.items.some((i) => i.template === template));
    const round = roundFor(unit, template);
    const state = newGame();
    const before = JSON.stringify(state);
    const result = move(round, state, {
      tile: "invalid",
      value: "invalid",
      word: "invalid",
      bin: "invalid",
      a: "invalid",
      b: "invalid",
    });
    assert.equal(result.state, state);
    assert.equal(JSON.stringify(state), before);
    assert.ok(result.replay);
    const source = readFileSync(
      new URL("../access-practice-lab/src/reading-path/games/engine.js", import.meta.url),
      "utf8",
    );
    assert.doesNotMatch(source, /Date\.|performance\.|setInterval|setTimeout/);
  });
test("all units, games and seeds are deterministic and completable", () => {
  for (const unit of scope.units)
    for (const item of unit.items.filter((i) => i.kind === "game")) {
      const r = roundFor(unit, item.template, { seed: 3, cards: 12 });
      assert.deepEqual(r, roundFor(unit, item.template, { seed: 3, cards: 12 }));
      let s = newGame();
      const act = (a) => {
        s = move(r, s, a).state;
      };
      if (item.template === "build") {
        for (const sound of r.sounds)
          act({ tile: r.tiles.find((t) => t.s === sound && !s.placed.includes(t.id)).id });
      }
      if (item.template === "switch") act({ value: "e" });
      if (item.template === "machine") act({ value: "done" });
      if (item.template === "sentence") for (const value of r.sentence.split(" ")) act({ value });
      if (item.template === "sight") act({ value: r.sight[0] });
      if (item.template === "sort")
        for (const word of r.words) {
          const bin = r.sortPatterns.find((p) => word.includes(p));
          if (bin) act({ word, bin });
        }
      if (item.template === "match")
        for (const a of r.pairs.filter((x) => x.id.endsWith("-a")))
          act({ a: a.id, b: a.id.replace(/a$/, "b") });
      if (item.template === "hunt")
        for (const [word] of r.pictures.filter((p) => p[2])) act({ word });
      assert.ok(s.complete, `${unit.id}/${item.id}`);
    }
});
test("bookmark progress accepts only completed known items, preserves open units", () => {
  assert.deepEqual(
    cleanProgress({ bad: true, "short-a/build": true, "short-a/machine": false }, scope.units),
    { "short-a/build": true },
  );
  assert.equal(nextUnit(scope.units, {}).id, "short-a");
  const progress = Object.fromEntries(scope.units[0].items.map((i) => [`short-a/${i.id}`, true]));
  assert.ok(unitDone(scope.units[0], progress));
  assert.equal(nextUnit(scope.units, progress).id, "short-e");
  assert.deepEqual(seededOrder([1, 2, 3, 4], 7), seededOrder([1, 2, 3, 4], 7));
});
test("role preference keeps legacy audience and reorders exactly the first three cards", () => {
  assert.equal(
    readAudience(() => "family"),
    "family",
  );
  assert.equal(
    readAudience(() => '{"audience":"teacher","role":"coach"}'),
    "teacher",
  );
  assert.equal(audienceRecord("broken").role, "");
  for (const role of TEACHER_ROLES) {
    const cards = ["find", "plan", "create", "analyze", "data", "prepare"].map((id) => ({ id }));
    assert.deepEqual(roleOrder(cards, role.id).slice(3), cards.slice(3));
    assert.deepEqual(
      roleOrder(cards, role.id)
        .slice(0, 3)
        .map((c) => c.id),
      role.order,
    );
  }
});

test("silent-e words split as onset, split vowel grapheme, coda", () => {
  assert.deepEqual(segment("cake"), ["c", "a_e", "k"]);
  assert.deepEqual(segment("smile"), ["s", "m", "i_e", "l"]);
  assert.deepEqual(segment("phone"), ["ph", "o_e", "n"]);
  assert.deepEqual(segment("use"), ["u_e", "s"]);
  assert.deepEqual(segment("three"), ["th", "r", "ee"]);
  assert.deepEqual(segment("clock"), ["c", "l", "o", "ck"]);
  for (const unit of scope.units)
    for (const w of [...unit.exampleWords, ...unit.olderWords])
      assert.equal(
        segment(w).join("").replace(/_e/, "") + (/_e/.test(segment(w).join("")) ? "e" : ""),
        w,
        `${w} segments back to its spelling`,
      );
});
test("a silent-e Build round is completable only by placing the split grapheme", () => {
  const unit = scope.units.find((u) => u.id === "long-a");
  const r = roundFor(unit, "build", { seed: 2 });
  assert.ok(r.sounds.includes("a_e"));
  let s = newGame();
  const plain = r.tiles.find((t) => t.s === "a");
  if (plain) assert.equal(move(r, s, { tile: plain.id }).state, s);
  for (const sound of r.sounds)
    s = move(r, s, {
      tile: r.tiles.find((t) => t.s === sound && !s.placed.includes(t.id)).id,
    }).state;
  assert.ok(s.complete);
});
test("Silent-e Switch supplies a before/after picture and speaks both words", () => {
  const unit = scope.units.find((u) => u.n === 6);
  const r = roundFor(unit, "switch");
  assert.deepEqual(r.switchPair, ["cap", "cape"]);
  assert.equal(r.switchPictures.length, 2);
  const done = move(r, newGame(), { value: "e" });
  assert.equal(done.state.complete, true);
  assert.equal(done.replay, "cap. cape");
});
test("Word Machine: every listed word is reachable; non-words are not listed", () => {
  const reachable = [];
  for (const a of REELS[0])
    for (const b of REELS[1]) for (const c of REELS[2]) reachable.push(a + b + c);
  for (const w of REAL_WORDS) assert.ok(reachable.includes(w), `${w} is not reachable`);
  for (const w of ["cat", "sit", "sun", "men", "cup", "mop"]) assert.ok(isRealWord(w));
  for (const w of ["cet", "sup", "mip", "cin"]) assert.ok(!isRealWord(w));
  assert.equal(machineWord([0, 0, 0]), "cat");
  assert.equal(machineWord([-1, 6, 4]), "sep");
  assert.equal(clampReel(1, -1), 4);
  assert.equal(clampReel(9, 0), 0);
});
test("round, card and stage choices accept only listed values", () => {
  assert.equal(choose("12", [6, 8, 12]), 12);
  assert.equal(choose("13", [6, 8, 12]), 6);
  assert.equal(choose("<b>", ["A", "B", "C"]), "A");
  const unit = scope.units.find((u) => u.id === "short-u");
  const r = roundFor(unit, "match", { cards: 9999, stage: "Z" });
  assert.equal(r.pairs.length, 6);
});
test("adult word-card print output paginates in exact six-card sheets", () => {
  assert.deepEqual(paginateWordCards(["a", "b", "c", "d", "e", "f", "g", "h"]), [
    ["a", "b", "c", "d", "e", "f"],
    ["g", "h"],
  ]);
  assert.deepEqual(paginateWordCards([]), []);
  assert.deepEqual(paginateWordCards(null), []);
});
