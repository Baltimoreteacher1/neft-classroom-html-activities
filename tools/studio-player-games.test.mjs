// The four game mechanics, played to a win through the real DOM: quest, match, puzzle, strategy. Plus the controls
// every game has: pause, calm mode and the plain list version.
import assert from "node:assert/strict";
import { test } from "node:test";
import { vocabSample } from "../access-practice-lab/src/studio/core/fixtures.js";
import { normalizeActivity } from "../access-practice-lab/src/studio/core/schema.js";
import { checkNow, click, makeWindow, solve } from "./studio-player-helpers.mjs";

const plain = (v) => JSON.parse(JSON.stringify(v));
const choice = (id, answer = "b") => ({
  id,
  type: "question",
  format: "choice",
  prompt: `Question ${id}`,
  options: [
    { id: "a", text: "Alpha" },
    { id: "b", text: "Beta" },
    { id: "c", text: "Gamma" },
  ],
  answer,
  hint: "Think about the order.",
  explanation: `Because ${id} is ${answer}.`,
  misconception: "Alpha is tempting.",
});
const number = (id) => ({
  id,
  type: "question",
  format: "number",
  prompt: "2 + 2?",
  answer: "4",
  explanation: "Add.",
});
const game = (template, blocks, extra = {}) =>
  normalizeActivity({
    id: `g-${template}`,
    title: `Game ${template}`,
    kind: "game",
    template,
    supports: { hints: true },
    blocks,
    ...extra,
  });
const questions = (a) => a.blocks.filter((b) => b.type === "question");

/** Answer one question in whatever mechanic is showing it, then press Next if it is offered. */
function answer(w, q, { next = true } = {}) {
  solve(w.document, q);
  const fb = checkNow(w.document);
  assert.ok(fb.classList.contains("is-right"), `${q.id}: ${fb.textContent}`);
  if (next) click(w.$(".sp-next:not([hidden])"));
}
const finished = (w) => Boolean(w.$(".sp-finish-title"));

test("quest: a path of missions with camps, a recap, retry-to-recover and a finish", () => {
  const a = game("quest", [choice("m1"), number("m2"), choice("m3"), choice("m4")]);
  const w = makeWindow();
  const player = w.mount(a);
  assert.equal(w.$$(".sp-node").length, 4);
  assert.match(w.$(".sp-node.is-here").textContent, /Mission 1/);
  assert.ok(w.$(".sp-hero"), "the traveler marks where you are");
  assert.ok(w.$(".sp-hint-btn"), "hints are available in the quest");
  const [m1, m2, m3, m4] = questions(a);
  answer(w, m1);
  assert.match(w.$(".sp-node.is-here").textContent, /Mission 2/);
  assert.equal(w.$$(".sp-node.is-done").length, 1);
  answer(w, m2);
  answer(w, m3);
  assert.ok(w.$(".sp-camp"), "camp after the third mission");
  assert.match(w.$(".sp-camp").textContent, /Because m3 is b/, "the recap says what was learned");
  click([...w.$$(".sp-camp .sp-btn")].find((b) => /Keep going/.test(b.textContent)));
  answer(w, m4);
  assert.match(w.$(".sp-camp").textContent, /Quest complete/);
  assert.ok(!w.$(".sp-retry"));
  click(w.$(".sp-camp .sp-btn-primary"));
  assert.ok(finished(w));
  assert.equal(player.summary().length, 4);
});

test("quest: a missed mission (no revising) can be tried again at the end and then counts as recovered", () => {
  const a = game("quest", [choice("m1"), choice("m2")], { options: { revise: false } });
  const w = makeWindow();
  const player = w.mount(a);
  click(w.$('.sp-q input[value="a"]'));
  checkNow(w.document);
  assert.match(w.$(".sp-feedback").textContent, /Here is the answer/);
  click(w.$(".sp-next:not([hidden])"));
  answer(w, questions(a)[1]);
  assert.match(w.$(".sp-camp").textContent, /try these missions again/);
  assert.equal(w.$$(".sp-retry button").length, 1);
  click(w.$(".sp-retry button"));
  answer(w, questions(a)[0]);
  assert.ok(!w.$(".sp-retry"), "recovered");
  click(w.$(".sp-camp .sp-btn-primary"));
  assert.ok(finished(w));
  assert.equal(plain(player.summary())[0].first, "incorrect");
  assert.equal(plain(player.summary())[0].final, "correct");
});

test("match: pick a card, place it; a wrong slot is refused with a reason; vocabulary drives the pairs", () => {
  const a = normalizeActivity({ ...vocabSample(), kind: "game", template: "match" });
  const w = makeWindow();
  const player = w.mount(a);
  assert.ok(!w.$(".sp-vocab"), "the word list is not shown above its own matching game");
  const key = (k) => [...w.$$("[data-key]")].find((n) => n.dataset.key === k);
  assert.equal(w.$$(".sp-gcard").length, 3);
  click(key("c:p2"));
  assert.equal(key("c:p2").getAttribute("aria-pressed"), "true");
  click(key("d:p1"));
  assert.match(w.$(".sp-say").textContent, /does not go with habitat/);
  assert.equal(w.$$(".sp-gcard").length, 3, "a wrong card stays in the tray");
  for (const id of ["p1", "p2", "p3"]) {
    click(key(`c:${id}`));
    click(key(`d:${id}`));
  }
  assert.equal(w.$$(".sp-dock.is-filled").length, 3);
  assert.match(w.$(".sp-feedback").textContent, /Round complete/);
  click(w.$(".sp-next-row .sp-btn-primary"));
  assert.ok(finished(w));
  const s = plain(player.summary());
  assert.equal(s.length, 1);
  assert.deepEqual([s[0].first, s[0].final, s[0].revised], ["partial", "correct", true]);
});

test("match: a match question plus bonus questions of other formats are all played", () => {
  const match = {
    id: "mq",
    type: "question",
    format: "match",
    prompt: "Match",
    pairs: [
      { id: "p1", left: "one", right: "uno" },
      { id: "p2", left: "two", right: "dos" },
    ],
    explanation: "Numbers.",
  };
  const a = game("match", [choice("b1"), match]);
  const w = makeWindow();
  w.mount(a);
  assert.equal(w.$$(".sp-gcard").length, 2, "match rounds come first");
  const key = (k) => [...w.$$("[data-key]")].find((n) => n.dataset.key === k);
  for (const id of ["p1", "p2"]) {
    click(key(`c:${id}`));
    click(key(`d:${id}`));
  }
  assert.match(w.$(".sp-feedback").textContent, /Numbers/);
  click(w.$(".sp-next-row .sp-btn-primary"));
  assert.ok(w.$(".sp-q-choice"), "the bonus round is a normal question");
  answer(w, questions(a)[0]);
  assert.ok(finished(w));
});

const pieceCell = (w, piece) => {
  const want = piece.querySelector("svg").getAttribute("viewBox");
  return w
    .$$(".sp-cell:not(.is-placed)")
    .find((c) => c.querySelector("svg").getAttribute("viewBox") === want);
};

test("puzzle: each solved item earns a piece; only the matching space accepts it; the picture completes", () => {
  const a = game("puzzle", [choice("p1"), choice("p2"), choice("p3")]);
  const w = makeWindow();
  const player = w.mount(a);
  assert.equal(w.$$(".sp-cell").length, 4);
  assert.equal(w.$$(".sp-cell.is-placed").length, 1, "the spare space is already filled");
  const [q1, q2, q3] = questions(a);
  answer(w, q1);
  assert.match(w.$(".sp-puzzle-panel").textContent, /You earned a piece/);
  const piece = w.$(".sp-piece");
  click(piece);
  assert.equal(w.$(".sp-piece").getAttribute("aria-pressed"), "true");
  const right = pieceCell(w, piece);
  const wrong = w.$$(".sp-cell:not(.is-placed)").find((c) => c !== right);
  click(wrong);
  assert.match(w.$(".sp-say").textContent, /does not fit/);
  assert.equal(w.$$(".sp-cell.is-placed").length, 1);
  click(right);
  assert.match(w.$(".sp-say").textContent, /It fits/);
  assert.equal(w.$$(".sp-cell.is-placed").length, 2);
  assert.ok(w.$(".sp-q"), "the next item is asked");
  answer(w, q2);
  click(w.$(".sp-piece"));
  click(pieceCell(w, w.$(".sp-piece")));
  answer(w, q3);
  click([...w.$$(".sp-puzzle-panel .sp-btn")].find((b) => /Place it for me/.test(b.textContent)));
  assert.ok(w.$(".sp-board.is-complete"));
  assert.match(w.$(".sp-puzzle-panel").textContent, /The picture is complete/);
  click(w.$(".sp-puzzle-panel .sp-btn-primary"));
  assert.ok(finished(w));
  assert.equal(player.summary().length, 3);
});

function playStrategy({ fence }) {
  const a = game("strategy", [choice("s1"), choice("s2"), choice("s3")]);
  const w = makeWindow();
  w.mount(a);
  const out = { energy: [], plants: [] };
  const read = () => Number(w.$(".sp-energy").textContent.match(/\d+/)[0]);
  const plants = () =>
    Number(
      w
        .$(".sp-plants")
        .getAttribute("aria-label")
        .match(/^(\d+)/)[1],
    );
  for (const q of questions(a)) {
    answer(w, q);
    out.energy.push(read());
    if (fence) {
      const up = w
        .$$(".sp-building")
        .find((b) => /Fence/.test(b.textContent))
        .querySelector("button");
      if (!up.disabled) click(up);
    }
    click([...w.$$(".sp-next-row .sp-btn-primary")].pop());
    out.plants.push(plants());
    click([...w.$$(".sp-next-row .sp-btn-primary")].pop());
    if (finished(w)) break;
  }
  return { w, out };
}

test("strategy: answers earn energy, energy buys upgrades, and the choice changes what the storm does", () => {
  const spend = playStrategy({ fence: true });
  const save = playStrategy({ fence: false });
  assert.ok(finished(spend.w) && finished(save.w), "both win");
  assert.equal(spend.out.energy[0], 3, "first try, no greenhouse: 3 energy");
  assert.ok(
    spend.out.plants.at(-1) > save.out.plants.at(-1),
    `fence kept more plants: ${spend.out.plants} vs ${save.out.plants}`,
  );
  assert.deepEqual(save.out.plants, [4, 3, 2], "unspent energy: every storm does damage");
  assert.deepEqual(spend.out.plants, [5, 5, 5]);
});

test("strategy: a garden that is wiped out is replanted, never a game over", () => {
  const a = game(
    "strategy",
    Array.from({ length: 12 }, (_, i) => choice(`r${i}`)),
  );
  const w = makeWindow();
  w.mount(a);
  let sawReplant = false;
  for (const q of questions(a)) {
    answer(w, q);
    click(
      w.$(".sp-next-row .sp-btn-primary:last-of-type") ||
        [...w.$$(".sp-next-row .sp-btn-primary")].pop(),
    );
    sawReplant ||= /replanted/.test(w.$(".sp-strategy-panel").textContent);
    click([...w.$$(".sp-next-row .sp-btn-primary")].pop());
    if (finished(w)) break;
  }
  assert.ok(sawReplant);
  assert.ok(finished(w));
});

test("pause freezes the game area, calm mode removes motion, and nothing is timed", () => {
  const a = game("match", [
    {
      id: "mq",
      type: "question",
      format: "match",
      prompt: "M",
      pairs: [
        { id: "p1", left: "a", right: "b" },
        { id: "p2", left: "c", right: "d" },
      ],
    },
  ]);
  const w = makeWindow();
  w.mount(a);
  const pause = w.$(".sp-game-bar .sp-btn");
  click(pause);
  assert.equal(w.$(".sp-game").dataset.paused, "true");
  assert.ok(w.$(".sp-game-area").hidden);
  assert.ok(!w.$(".sp-paused").hidden);
  click(w.$(".sp-paused .sp-btn"));
  assert.ok(!w.$(".sp-game-area").hidden);
  const calm = [...w.$$(".sp-btn")].find((b) => /Calm mode/.test(b.textContent));
  click(calm);
  assert.ok(w.$(".sp-root").classList.contains("sp-calm"));
  assert.equal(calm.getAttribute("aria-pressed"), "true");
  assert.match(w.$(".sp-root [role=status]").textContent, /Calm mode is on/);
});

test("the list version is one button away in every game and reaches the same finish", () => {
  for (const template of ["quest", "match", "puzzle", "strategy"]) {
    const a = game(template, [choice("l1"), choice("l2")]);
    const w = makeWindow();
    const player = w.mount(a);
    const toggle = w.$(".sp-mode");
    assert.match(toggle.textContent, /list version/, template);
    click(toggle);
    assert.ok(w.$(".sp-flow"), `${template}: list flow`);
    assert.match(w.$(".sp-listnote").textContent, /same questions, with no game/);
    assert.ok(!w.$(".sp-game"));
    for (const q of questions(a)) answer(w, q);
    assert.ok(finished(w), template);
    assert.equal(player.summary().length, 2);
    click([...w.$$(".sp-finish .sp-btn")].find((b) => /Back to the game/.test(b.textContent)));
    // a match game with every round already played has nothing left to play: it goes straight to the finish
    assert.ok(
      w.$(".sp-game") || (template === "match" && finished(w)),
      `${template}: back to the game`,
    );
  }
});

test("every game template mounts on the full 15-format activity and shows its first screen without errors", () => {
  for (const template of ["quest", "match", "puzzle", "strategy"]) {
    const w = makeWindow();
    const errors = [];
    w.window.addEventListener("error", (e) => errors.push(e.message));
    w.mount(normalizeActivity({ ...vocabSample(), kind: "game", template }));
    assert.ok(w.$(".sp-game"), template);
    assert.deepEqual(errors, []);
  }
});
