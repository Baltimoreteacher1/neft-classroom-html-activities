// Writing checkers: sentence building accepts equivalent valid constructions (not a brittle string compare), and the
// Language Upgrade check cannot be passed by length or repetition alone. Pure logic; no DOM.
//   node --test tools/access-writing-checkers.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

const LAB = "../access-practice-lab/src";
const engine = await import(`${LAB}/lang/craft-sentence.js`);
const sent = await import(`${LAB}/content/craft-sentences.js`);
const scaffold = await import(`${LAB}/lang/scaffold-check.js`);
const items = await import(`${LAB}/content/scaffold-items.js`);

const run = (dsl, placedText, alt = []) => {
  const parsed = engine.parseSentence(dsl);
  const tiles = engine.tilesFor({ kind: "x", lv: 4 }, parsed);
  return engine.checkBuild(parsed, tiles, alt, placedText);
};

test("build: the answer order passes, including with different capitalisation", () => {
  const dsl = "S[We] V[played] M[at the park] M[after lunch] .";
  assert.equal(run(dsl, ["We", "played", "at the park", "after lunch", "."]).ok, true);
  assert.equal(run(dsl, ["we", "played", "at the park", "after lunch", "."]).ok, true);
});

test("build: details that can move may come in either order", () => {
  const dsl = "S[We] V[played] M[at the park] M[after lunch] .";
  const res = run(dsl, ["We", "played", "after lunch", "at the park", "."]);
  assert.equal(res.ok, true);
  assert.equal(res.equivalent, true);
  assert.equal(
    run("S[He] V[ate] O[lunch] M[quickly] M[in the cafeteria] .", [
      "He",
      "quickly",
      "ate",
      "lunch",
      "in the cafeteria",
      ".",
    ]).ok,
    true,
  );
});

test("build: an object or complement is never moved in front of the verb", () => {
  const dsl = "S[It] V[was] M[cold] M[today] .";
  assert.equal(run(dsl, ["It", "was", "today", "cold", "."]).ok, false);
  assert.equal(
    run("S[We] V[played] M[at the park] .", ["We", "at the park", "played", "."]).ok,
    false,
  );
});

test("build: 'and' / 'or' clauses can swap; 'so' / 'but' cannot change meaning by swapping", () => {
  const and = "S[Maya] V[reads] O[comics] , and/c S[Leo] V[draws] .";
  assert.equal(run(and, ["Leo", "draws", ",", "and", "Maya", "reads", "comics", "."]).ok, true);
  const so = "S[It] V[rained] , so/c S[we] V[stayed] M[inside] .";
  assert.equal(run(so, ["We", "stayed", "inside", ",", "so", "it", "rained", "."]).ok, false);
});

test("build: a because/although clause can lead or follow, with the comma rule", () => {
  const front = "Although/sc S[Ben] V[was] M[tired] , S[he] V[finished] O[his project] .";
  const back = ["He", "finished", "his project", "although", "Ben", "was", "tired", "."];
  assert.equal(run(front, back).ok, true);
  const mid = "S[We] V[stayed] M[inside] because/sc S[it] V[was] M[raining] .";
  assert.equal(
    run(mid, ["Because", "it", "was", "raining", ",", "we", "stayed", "inside", "."]).ok,
    true,
  );
  // Same words, but the dependent clause cut off from its connector is not accepted.
  assert.equal(
    run(mid, ["it", "was", "raining", "because", "we", "stayed", "inside", "."]).ok,
    false,
  );
});

test("build: wrong order, missing end mark and missing tiles are still caught with a part-of-speech hint", () => {
  const dsl = "S[The dog] V[barked] M[loudly] .";
  const wrong = run(dsl, ["barked", "The dog", "loudly", "."]);
  assert.equal(wrong.ok, false);
  assert.match(wrong.hint.en, /place 1/);
  assert.equal(run(dsl, ["The dog", "barked", "loudly"]).ok, false);
  assert.equal(run(dsl, ["The dog", "barked"]).ok, false);
});

test("build: equivalents never include the original and every build task still passes in answer order", () => {
  for (const task of sent.TASKS.filter((t) => ["b", "c", "e"].includes(t.kind))) {
    const parsed = engine.parseSentence(task.a);
    assert.ok(!engine.equivalentSentences(parsed).includes(parsed.text), task.id);
    const tiles = engine.tilesFor(task, parsed);
    const res = engine.checkBuild(
      parsed,
      tiles,
      task.alt || [],
      tiles.map((t) => t.text),
    );
    assert.equal(res.ok, true, task.id);
  }
});

test("build: equivalent orders are accepted for a real share of tasks", () => {
  const list = sent.TASKS.filter((t) => ["b", "c", "e"].includes(t.kind));
  const withAlt = list.filter((t) => engine.equivalentSentences(engine.parseSentence(t.a)).length);
  assert.ok(withAlt.length / list.length > 0.4, `${withAlt.length}/${list.length}`);
});

const plants = items.UPGRADE_ITEMS.find((i) => i.id === "lu35-explain-plants");

test("upgrade: every model answer passes and every original fails", () => {
  for (const it of items.UPGRADE_ITEMS) {
    assert.equal(scaffold.checkUpgrade(it, it.answer).ok, true, it.id);
    assert.equal(scaffold.checkUpgrade(it, it.informal).ok, false, it.id);
  }
});

test("upgrade: padding, repetition and a dangling connector do not pass", () => {
  for (const text of [
    "Plants need sunlight very very very very very because because.",
    "Plants need sunlight and water and sunlight and water because.",
    "Plants need stuff because really really really really.",
    "Plants need sunlight and water and sunlight and water and sunlight so.",
  ])
    assert.equal(scaffold.checkUpgrade(plants, text).ok, false, text);
});

test("upgrade: different valid revisions pass, and feedback quotes the item's own question", () => {
  for (const text of [
    "Plants need sunlight because they use it to make food.",
    "Plants need water, so they can grow tall.",
    "plants need sunlight and water since they make food from them",
  ])
    assert.equal(scaffold.checkUpgrade(plants, text).ok, true, text);
  const generic = scaffold.checkUpgrade(
    plants,
    "Plants need stuff because they are alive and green.",
  );
  assert.equal(generic.ok, false);
  assert.ok(generic.messages.some((m) => m.includes(plants.hint)));
});

test("sentence/evidence checks: wrong parts name the problem and never the answer", () => {
  const item = items.SENTENCE_ITEMS[0];
  const empty = scaffold.checkSentence(item, {});
  assert.equal(empty.ok, false);
  assert.ok(!empty.message.includes(item.tiles[0].text));
});

const mentor = await import(`${LAB}/content/craft-mentor.js`);
const craft = await import(`${LAB}/lang/craft.js`);

test("mentor try-it: every model passes, no given sentence or unfilled starter passes, every task names an audience", () => {
  for (const move of mentor.MOVES) {
    assert.ok(mentor.MOVE_CRITERIA[move.id]?.length >= 2, `${move.id} has success criteria`);
    for (const band of ["3-5", "6-8"])
      for (const task of mentor.TRY[move.id][band]) {
        assert.equal(craft.checkMove(move.id, task.model, task).ok, true, `${task.id} model`);
        if (task.base)
          assert.equal(craft.checkMove(move.id, task.base, task).ok, false, `${task.id} unchanged`);
        assert.equal(craft.checkMove(move.id, task.start, task).ok, false, `${task.id} blanks`);
        assert.ok(task.why.length > 25, `${task.id} audience and purpose`);
        assert.ok(task.start.includes("___"), `${task.id} starter has a blank`);
      }
  }
});

test("mentor try-it: a verb the list has never seen is accepted with an honest note; a plain verb is not", () => {
  const task = { weak: ["went"] };
  const unknown = craft.checkMove("verb", "The dog loped to the door.", task);
  assert.equal(unknown.ok, true);
  assert.match(unknown.got.en, /do not know your new verb/);
  assert.equal(craft.checkMove("verb", "The dog was by the door.", task).ok, false);
  assert.equal(craft.checkMove("verb", "The dog went to the door.", task).ok, false);
});

test("mentor try-it: a name at the start of the sentence counts as an exact detail", () => {
  assert.equal(craft.checkMove("prec", "Mia won the race.").ok, true);
  assert.equal(craft.checkMove("prec", "The girl won the race.").ok, false);
});
