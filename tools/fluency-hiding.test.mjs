// How Many Are Hiding? (K-2 part-whole game): rules, then the game played in jsdom through the Game Room.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const realSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (fn, ms, ...rest) => realSetTimeout(fn, Math.min(ms ?? 0, 4), ...rest);
const wait = (ms = 15) => new Promise((resolve) => realSetTimeout(resolve, ms));

const dir = new URL("../math/fluency-lab/", import.meta.url);
const html = readFileSync(new URL("index.html", dir), "utf8");
const dom = new JSDOM(html, {
  url: "https://example.test/math/fluency-lab/lab.html?grade=0&view=games",
  pretendToBeVisual: true,
});
const win = dom.window;
win.HTMLElement.prototype.scrollIntoView = () => {};
for (const [key, value] of Object.entries({
  window: win,
  document: win.document,
  location: win.location,
  history: win.history,
  localStorage: win.localStorage,
  CustomEvent: win.CustomEvent,
  Event: win.Event,
}))
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });

const core = await import("../math/fluency-lab/hiding-core.js");
const { GAMES, mountGames } = await import("../math/fluency-lab/games.js");
const { setLang } = await import("../math/fluency-lab/i18n.js");
const { ALL_SKILLS } = await import("../math/fluency-lab/problem-bank.js");
const { skillKey } = await import("../math/fluency-lab/tutor-engine.js");
const { cleanRewards } = await import("../math/fluency-lab/rewards.js");
const { leakCap } = await import("../math/fluency-lab/step-leak.js");
const { GAME_PHASES } = await import("../math/fluency-lab/feedback-host.js");
const { GAMES_BY_ID_NAME } = await import("../math/fluency-lab/game-names.js");
const { CLASSIC_GAME_ICONS } = await import("../math/fluency-lab/game-icons.js");

// ---- Rules
assert.deepEqual(
  core.stagesFor(0).map((s) => s.id),
  ["seed", "sprout", "bud"],
  "Kindergarten stays within 10",
);
assert.deepEqual(
  core.stagesFor(1).map((s) => s.id),
  ["seed", "sprout", "bud", "bloom"],
);
assert.deepEqual(
  core.stagesFor(2).map((s) => s.id),
  ["seed", "sprout", "bud", "bloom"],
);
const allTotals = core.STAGES.flatMap((s) => s.totals);
assert.deepEqual(allTotals, [3, 4, 5, 6, 7, 8, 9, 10, 20], "Totals run 3 to 10, then 20");
for (let seed = 1; seed <= 200; seed += 1) {
  let state = seed;
  const rng = () => (state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296;
  for (const grade of [0, 1, 2]) {
    for (const calm of [false, true]) {
      const plan = core.makePlan(grade, calm, rng);
      assert.equal(plan.length, core.stagesFor(grade).length * core.roundsPerStage(calm));
      const order = core.STAGES.map((s) => s.id);
      assert.deepEqual(
        [...plan].map((r) => order.indexOf(r.stage)),
        [...plan].map((r) => order.indexOf(r.stage)).sort((a, b) => a - b),
        "Stages run in order",
      );
      const seen = new Set();
      for (const round of plan) {
        const stage = core.STAGES.find((s) => s.id === round.stage);
        assert.ok(stage.totals.includes(round.total));
        assert.ok(
          round.shown >= 1 && round.hidden >= 1 && round.shown + round.hidden === round.total,
        );
        if (round.total > 10)
          assert.ok(round.shown >= 3 && round.hidden >= 3, "The 20 stage is never all-but-one");
        assert.ok(!seen.has(`${round.total}:${round.shown}`), "No repeated picture in one game");
        seen.add(`${round.total}:${round.shown}`);
        // Wrong tries never change anything: only the exact hidden part is right.
        for (let guess = 0; guess <= round.total; guess += 1)
          assert.equal(core.isRight(round, guess), guess === round.hidden);
        assert.equal(core.isRight(round, round.hidden + 0.5), false);
        const item = core.reviewItem(round);
        assert.equal(item.answers[0], String(round.hidden));
        assert.equal(leakCap(item), 2, "Review steps name the answer only in the last step");
        assert.ok(item.questionEs.includes(String(round.total)));
      }
    }
  }
}
assert.equal(core.clampSetting({ total: 7 }, -3), 0);
assert.equal(core.clampSetting({ total: 7 }, 99), 7);
assert.equal(core.starsFor(8, 8), 3);
assert.equal(core.starsFor(3, 8), 1);
assert.equal(core.starsFor(5, 8), 2);
assert.equal(core.independentRound({ misses: 0, supported: false }), true);
assert.equal(core.independentRound({ misses: 0, supported: true }), false);
assert.equal(core.independentRound({ misses: 1, supported: false }), false);
assert.deepEqual(core.cleanGarden({ flowers: -4 }), { flowers: 0 });
assert.deepEqual(core.cleanGarden("junk"), { flowers: 0 });
assert.equal(core.grow({ flowers: 3 }, 4).flowers, 7);
assert.equal(core.skillKeyFor(10), "0:hidden-parts");
assert.equal(core.skillKeyFor(20), "1:missing-addend");
for (const key of [core.SKILL_WITHIN_10, core.SKILL_WITHIN_20])
  assert.ok(
    ALL_SKILLS.some((skill) => skillKey(skill) === key),
    `${key} is a real skill`,
  );

// ---- Registration
const entry = GAMES.find((game) => game.id === "hiding");
assert.ok(entry, "The game is in the Game Room registry");
assert.deepEqual(entry.grades, [0, 1, 2]);
assert.deepEqual(entry.gradeBand, [0, 2]);
assert.ok(entry.tags.length);
assert.equal(GAMES_BY_ID_NAME.hiding, "How Many Are Hiding?");
assert.ok(CLASSIC_GAME_ICONS.hiding.includes("<svg"));
assert.deepEqual(GAME_PHASES.hiding, {
  right: "correct",
  miss: "retry",
  "right-after-miss": "assisted",
});
assert.equal(
  cleanRewards({ best: { hiding: 2 } }).best.hiding,
  2,
  "The best record survives cleaning",
);
assert.equal(cleanRewards({}).best.hiding, 0);
const css = readFileSync(new URL("hiding-game.css", dir), "utf8");
assert.match(readFileSync(new URL("games.css", dir), "utf8"), /@import "\.\/hiding-game\.css"/);
assert.match(css, /\.hd-btn \{[^}]*min-height: 64px/s, "Buttons are at least 64px tall");
assert.match(css, /\.hd-btn \{[^}]*min-width: 64px/s, "Buttons are at least 64px wide");
const source = readFileSync(new URL("hiding-game.js", dir), "utf8");
assert.ok(
  !/setTimeout|setInterval|requestAnimationFrame|Date\.now|Math\.random/.test(source),
  "No timer and no randomness in the game",
);

// ---- Play it in the Game Room
const root = document.createElement("div");
document.body.append(root);
const $ = (selector) => root.querySelector(selector);
const $$ = (selector) => [...root.querySelectorAll(selector)];
const click = (selector) => {
  const element = typeof selector === "string" ? $(selector) : selector;
  assert.ok(element, `${selector} exists`);
  element.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true }));
};
const roundFacts = () => {
  const total = Number($(".hd-total b").textContent.match(/\d+/)[0]);
  const shown = $$(".hd-col")[0].querySelectorAll(
    "svg.hd-zone > :is(circle, ellipse, polygon)",
  ).length;
  return { total, shown, hidden: total - shown };
};
const setTo = (n) => {
  while (Number($("[data-hd-out]").textContent) < n) click('[data-hd="plus"]');
  while (Number($("[data-hd-out]").textContent) > n) click('[data-hd="minus"]');
};

const spoken = [];
globalThis.fluencyGameHooks = { speak: (text, info) => spoken.push({ text, info }) };
const evidence = [];
const stop = mountGames(root, { grade: 0, onEvidence: (entry) => evidence.push(entry) });
assert.ok($("[data-game='hiding']"), "Kindergarten sees the card in the Game Room");
assert.match($("[data-game='hiding']").textContent, /How Many Are Hiding\?/);
assert.match($("[data-game='hiding']").textContent, /Kindergarten|K–2/);
click("[data-game='hiding']");
await wait();
assert.ok($(".gm-hiding"));
assert.ok(
  spoken[0]?.info.kind === "prompt" && spoken[0].info.game === "hiding",
  "The optional audio hook gets the prompt",
);
assert.match(spoken[0].text, /How many are hiding\?/);

let facts = roundFacts();
assert.ok(facts.total >= 3 && facts.total <= 5, "Round 1 is the Seed stage");
assert.ok($(".hd-leaf"), "A leaf covers the hidden counters");
assert.equal(
  $$(".hd-col")[1].querySelectorAll("circle, ellipse, polygon").length,
  0,
  "The leaf zone draws no hidden counters",
);

// A wrong try: nothing is removed, the answer is not shown, and the child can try again.
const wrong = facts.hidden === 1 ? 2 : 1;
setTo(wrong);
click('[data-hd="check"]');
assert.match($("[data-fb-host]").textContent, /Not quite/);
assert.ok($(".hd-leaf"), "A wrong try leaves the leaf down");
assert.equal($$(".hd-col")[1].querySelectorAll("circle, ellipse, polygon").length, 0);
assert.ok(
  $$('[data-hd="plus"], [data-hd="minus"], [data-hd="check"]').every((b) => !b.disabled),
  "A wrong try removes no choice",
);
assert.ok(
  !new RegExp(`\\b${facts.hidden}\\b`).test(
    $(".gm-note").textContent.replace(String(facts.total), "").replace(String(facts.shown), ""),
  ) ||
    facts.hidden === facts.shown ||
    facts.hidden === facts.total,
  "The miss note never names the answer",
);
assert.equal(evidence.at(-1).skillKey, "0:hidden-parts");
assert.deepEqual([evidence.at(-1).correct, evidence.at(-1).independent], [false, false]);
click("[data-feedback-action='try-again']");
assert.ok(!$("[data-fb-host]"), "Try again clears the panel");

// Count with me is a scaffold the child asks for, and it makes the round supported.
click('[data-hd="count"]');
assert.equal($('[data-hd="count"]').getAttribute("aria-pressed"), "true");
assert.ok($("[data-hd-tray] text"), "The count-on numbers appear on the child's own counters");
setTo(facts.hidden);
click('[data-hd="check"]');
assert.ok(
  !$(".hd-leaf") &&
    $$(".hd-col")[1].querySelectorAll("circle, ellipse, polygon").length === facts.hidden,
  "The leaf lifts and shows the hidden part",
);
assert.match(
  $(".gm-note").textContent,
  new RegExp(`Yes! ${facts.shown} and ${facts.hidden} make ${facts.total}`),
);
assert.deepEqual(
  [evidence.at(-1).correct, evidence.at(-1).independent],
  [true, false],
  "A supported round is not independent evidence",
);
assert.ok(
  $$('[data-hd="plus"], [data-hd="check"]').every((b) => b.disabled),
  "A solved round is locked",
);
click("[data-gm-next]");
await wait();

// Play every remaining round correctly, first try.
let rounds = 1;
let guard = 0;
while (!$("[data-hd='finish']") && guard++ < 20) {
  facts = roundFacts();
  const expected = facts.total > 10 ? "1:missing-addend" : "0:hidden-parts";
  setTo(facts.hidden);
  click('[data-hd="check"]');
  assert.equal(evidence.at(-1).skillKey, expected);
  assert.deepEqual([evidence.at(-1).correct, evidence.at(-1).independent], [true, true]);
  click("[data-gm-next]");
  rounds += 1;
}
assert.ok($("[data-hd='finish']"), "Finishing every stage reaches the win screen");
assert.equal(rounds, 6, "Kindergarten plays 3 stages of 2 rounds");
assert.match($(".hd-win-title").textContent, /full bloom/);
assert.equal($$(".hd-garden")[0].getAttribute("aria-label"), "Your garden: 3 of 3 flowers grown");
assert.ok(
  [...Array(win.localStorage.length).keys()].some((i) =>
    win.localStorage.key(i).includes("hiding-garden"),
  ),
  "The garden is saved",
);
click("[data-hd='finish']");
await wait();
assert.ok($(".gm-result"), "The win leads to the Game Room result screen");
const score = $(".tr-score").textContent;
assert.match(score, /How Many Are Hiding\?/);
assert.match(score, /\d+ of 6 rounds on the first try/);
assert.ok($$(".tr-star.on").length >= 1);
assert.ok(
  JSON.parse(
    win.localStorage.getItem(
      [...Array(win.localStorage.length).keys()]
        .map((i) => win.localStorage.key(i))
        .find((k) => k.includes("rewards")),
    ),
  ).best.hiding >= 1,
  "The best record is saved",
);
assert.ok($(".gm-review"), "Rounds that needed help come back as a review");
stop();

// Grade 1 plays the 20 stage and the +5/-5 buttons appear only there; Grade 4 does not see the game.
root.innerHTML = "";
const stopG1 = mountGames(root, {
  grade: 1,
  autostart: "hiding",
  onEvidence: (entry) => evidence.push(entry),
});
await wait();
let sawTwenty = false;
for (let i = 0; i < 8; i += 1) {
  facts = roundFacts();
  if (facts.total === 20) {
    sawTwenty = true;
    assert.ok($('[data-hd="plus5"]') && $('[data-hd="minus5"]'), "The 20 stage has +5 and -5");
    click('[data-hd="plus5"]');
    assert.equal($("[data-hd-out]").textContent, "5");
    click('[data-hd="minus5"]');
    assert.equal($("[data-hd-out]").textContent, "0");
  } else assert.ok(!$('[data-hd="plus5"]'));
  setTo(facts.hidden);
  click('[data-hd="check"]');
  if (facts.total === 20) assert.equal(evidence.at(-1).skillKey, "1:missing-addend");
  click("[data-gm-next]");
}
assert.ok(sawTwenty, "Grade 1 reaches the 20 stage");
assert.ok($("[data-hd='finish']"));
stopG1();
root.innerHTML = "";
const stopG4 = mountGames(root, { grade: 4 });
assert.ok(!$("[data-game='hiding']"), "Older grades do not see the game");
stopG4();

// Spanish strings: prompt, buttons and win text
setLang("es", { persist: false });
root.innerHTML = "";
const stopEs = mountGames(root, { grade: 0, autostart: "hiding" });
await wait();
assert.match($(".hd-goal").textContent, /Pip escondió unas (bayas|semillas|gemas)/);
assert.equal($('[data-hd="check"]').textContent, "Levantar la hoja");
assert.equal($('[data-hd="count"]').textContent, "Cuenta conmigo");
assert.match($(".hd-total b").textContent, /en total/);
assert.match($('[data-hd="plus"]').getAttribute("aria-label"), /Esconder una más/);
stopEs();
setLang("en", { persist: false });
delete globalThis.fluencyGameHooks;

console.log("fluency-hiding: ok");
process.exit(0);
