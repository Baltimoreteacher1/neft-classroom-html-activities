// Math Baseball, Guess the Number, Math Race, grade-band chips and the Game Room filters: rules, then each game played in jsdom.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const realSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (fn, ms, ...rest) => realSetTimeout(fn, Math.min(ms ?? 0, 4), ...rest);
const wait = (ms = 15) => new Promise((resolve) => realSetTimeout(resolve, ms));

const html = readFileSync(new URL("../math/fluency-lab/index.html", import.meta.url), "utf8");
const dom = new JSDOM(html, {
  url: "https://example.test/math/fluency-lab/?grade=4&view=games",
  pretendToBeVisual: true,
});
const win = dom.window;
win.HTMLElement.prototype.scrollIntoView = () => {};
win.print = () => {};
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

const { OUTS, SWINGS, TIERS, halfOver, hit, makePitcher, newHalf, out, tierDecks, hardness } =
  await import("../math/fluency-lab/baseball-core.js");
const {
  MAX_BY_GRADE,
  inBand,
  judge,
  maxFor,
  midpoint,
  narrow,
  parFor,
  parseGuess,
  starsFor: guessStars,
} = await import("../math/fluency-lab/guess-core.js");
const { CALM_PACES, PACES, TRACK, missesAllowed, rivalAt, winner } = await import(
  "../math/fluency-lab/race-core.js"
);
const { bandFor, bandLabel, TAGS, FILTER_IDS } = await import(
  "../math/fluency-lab/game-catalog.js"
);
const { flyAlong, starsByShare } = await import("../math/fluency-lab/arcade-shared.js");
const { GAMES } = await import("../math/fluency-lab/games.js");
const { cleanRewards } = await import("../math/fluency-lab/rewards.js");
const { gameProblems } = await import("../math/fluency-lab/game-pool.js");
const { setLang } = await import("../math/fluency-lab/i18n.js");

// ---- Baseball rules
let half = newHalf();
({ half } = hit(half, 4));
assert.equal(half.runs, 1, "A home run with the bases empty scores the batter");
assert.deepEqual(half.bases, [false, false, false]);
({ half } = hit(half, 3));
assert.deepEqual(half.bases, [false, false, true], "A triple puts the batter on third");
const single = hit(half, 1);
assert.equal(single.scored, 1, "A single scores the runner from third");
assert.deepEqual(single.half.bases, [true, false, false]);
const loaded = hit({ ...newHalf(), bases: [true, true, true] }, 4);
assert.equal(loaded.scored, 4, "A grand slam scores four");
assert.deepEqual(loaded.half.bases, [false, false, false]);
const doubled = hit({ ...newHalf(), bases: [true, false, true] }, 2);
assert.equal(
  doubled.scored,
  1,
  "A double scores the runner from third; the one from first reaches third",
);
assert.deepEqual(doubled.half.bases, [false, true, true]);
assert.ok(
  doubled.moves.every((move) => move.to >= move.from),
  "Runners only move forward",
);
assert.equal(TIERS.map((tier) => tier.bases).join(), "1,2,3,4");
let inning = newHalf();
for (let i = 0; i < OUTS - 1; i += 1) inning = out(inning);
assert.equal(halfOver(inning), false, "Two outs is not the end");
assert.equal(halfOver(out(inning)), true, "Three outs end the half-inning");
let swings = newHalf();
for (let i = 0; i < SWINGS; i += 1) swings = hit(swings, 1).half;
assert.equal(halfOver(swings), true, "Five swings end a half-inning even with no outs");

const pool = gameProblems(4, "all", 24);
const decks = tierDecks(pool);
const rank = (deck) => deck.map(hardness);
assert.ok(
  Math.max(...rank(decks[0])) <= Math.min(...rank(decks[3])),
  "Tier decks run easiest to hardest",
);
const pitcher = makePitcher(() => gameProblems(4, "all", 24));
const dealt = new Set();
for (let i = 0; i < 12; i += 1) dealt.add(pitcher.next(i % 4).question);
assert.equal(dealt.size, 12, "A batch never repeats a question");

// ---- Guess the Number rules
assert.deepEqual(MAX_BY_GRADE.length, 9, "Every grade from K to 8 has a range");
assert.equal(maxFor(0), 10);
assert.equal(maxFor(8), 1000);
assert.equal(parFor(10), 4);
assert.equal(parFor(100), 7);
assert.equal(parFor(1000), 10);
assert.equal(midpoint({ lo: 1, hi: 100 }), 50);
assert.deepEqual(narrow({ lo: 1, hi: 100 }, 50, 70), { lo: 51, hi: 100 });
assert.deepEqual(narrow({ lo: 51, hi: 100 }, 75, 70), { lo: 51, hi: 74 });
assert.equal(judge(5, 5), "found");
assert.equal(inBand({ lo: 51, hi: 74 }, 50), false);
assert.equal(parseGuess(" 42 ", 100), 42);
assert.equal(parseGuess("0", 100), null);
assert.equal(parseGuess("101", 100), null);
assert.equal(parseGuess("4.5", 100), null);
assert.equal(guessStars(7, 7), 3);
assert.equal(guessStars(9, 7), 2);
assert.equal(guessStars(12, 7), 1);
for (let grade = 0; grade <= 8; grade += 1) {
  const max = maxFor(grade);
  const par = parFor(max);
  for (let secret = 1; secret <= max; secret += 1) {
    let band = { lo: 1, hi: max };
    let count = 0;
    while (true) {
      count += 1;
      const guess = midpoint(band);
      if (guess === secret) break;
      band = narrow(band, guess, secret);
    }
    assert.ok(count <= par, `Grade ${grade}: halving finds ${secret} within ${par} guesses`);
  }
}

// ---- Race rules: the rival runs on a fixed plan, never a clock, and a careful learner always wins
assert.deepEqual(
  [...PACES, ...CALM_PACES].every((pace) => pace > TRACK),
  true,
);
for (const pace of [...PACES, ...CALM_PACES]) {
  const plan = Array.from({ length: pace + 1 }, (_, turn) => rivalAt(turn, pace));
  assert.deepEqual(
    plan,
    Array.from({ length: pace + 1 }, (_, turn) => rivalAt(turn, pace)),
    "The plan never changes",
  );
  assert.ok(
    plan.every((place, i) => i === 0 || (place >= plan[i - 1] && place - plan[i - 1] <= 1)),
    "The rival moves at most one segment a turn",
  );
  assert.equal(plan[pace], TRACK, "The rival finishes on its pace turn");
  for (let misses = 0; misses <= missesAllowed(pace) + 1; misses += 1) {
    // Misses can fall anywhere; the best and worst orders both decide the same way.
    for (const missFirst of [true, false]) {
      let me = 0;
      let turn = 0;
      let result = null;
      const wrong = Array(misses).fill(false);
      const queue = missFirst
        ? [...wrong, ...Array(TRACK).fill(true)]
        : [...Array(TRACK - 1).fill(true), ...wrong, true];
      for (const right of queue) {
        turn += 1;
        if (right) me += 1;
        result = winner(me, rivalAt(turn, pace));
        if (result) break;
      }
      assert.equal(
        result === "you",
        misses <= missesAllowed(pace),
        `Pace ${pace}: ${misses} misses ${result === "you" ? "still wins" : "loses"} as expected`,
      );
    }
  }
}
assert.equal(winner(6, 6), "you", "A tie goes to the learner, who moves first");

// ---- Stars reward share of first-try answers, never speed
assert.equal(starsByShare(10, 10), 3);
assert.equal(starsByShare(8, 10), 3);
assert.equal(starsByShare(5, 10), 2);
assert.equal(starsByShare(2, 10), 1);

// ---- Motion respects the reduced-motion setting
const frames = [];
const element = { animate: (keyframes, options) => (frames.push({ keyframes, options }), {}) };
assert.ok(
  flyAlong(element, [
    [0, 0],
    [10, 10],
  ]),
  "Motion plays by default",
);
assert.equal(frames[0].keyframes.length, 2);
win.matchMedia = () => ({ matches: true });
assert.equal(
  flyAlong(element, [
    [0, 0],
    [10, 10],
  ]),
  null,
  "Reduced motion skips the flight",
);
delete win.matchMedia;
const css = readFileSync(new URL("../math/fluency-lab/arcade-games.css", import.meta.url), "utf8");
assert.match(
  css,
  /prefers-reduced-motion: reduce\)\s*{[^}]*\.gn-band[^}]*\.rc-car[^}]*transition: none/s,
  "CSS transitions are switched off for reduced motion",
);
assert.match(
  readFileSync(new URL("../math/fluency-lab/games.css", import.meta.url), "utf8"),
  /@import "\.\/arcade-games\.css"/,
);

// ---- Catalog: grade bands come from each entry's grades, and every game is tagged
assert.deepEqual(bandFor(undefined), [0, 8]);
assert.deepEqual(bandFor([3, 4, 5, 6, 7, 8]), [3, 8]);
assert.equal(bandLabel([0, 8]), "All grades");
assert.equal(bandLabel([0, 3]), "K–3");
assert.equal(bandLabel([3, 8]), "Grades 3–8");
assert.equal(bandLabel([4, 4]), "Grade 4");
assert.equal(bandLabel([0, 0]), "Kindergarten");
setLang("es", { persist: false });
assert.equal(bandLabel([3, 8]), "Grados 3–8");
assert.equal(bandLabel([0, 8]), "Todos los grados");
setLang("en", { persist: false });
const OLD_IDS =
  "mathworldbuilder numberpuzzlestudio fluencyrally strategymatch targethive factorfractionpath ghostsprint numberquest arrayarchitect fractionforge balancestation equationfactory ratiocity fractionbridge tenframefactory divisionharbor decimaldashboards integerexpedition graphcity match hunt sort mistake make duel make24 challenge teamrelay family balance flip picture".split(
    " ",
  );
for (const id of [...OLD_IDS, "baseball", "guess", "race"])
  assert.ok(
    GAMES.some((game) => game.id === id),
    `${id} stays in the registry`,
  );
const { E8_GAME_IDS } = await import("../math/fluency-lab/e8/game-ids.js");
for (const id of E8_GAME_IDS)
  assert.ok(
    GAMES.some((game) => game.id === id),
    `${id} (Enterprise 8) is in the registry`,
  );
assert.equal(
  GAMES.length,
  OLD_IDS.length + 3 + E8_GAME_IDS.length,
  "Only the three arcade games and the Enterprise 8 families were added",
);
for (const game of GAMES) {
  assert.ok(
    game.tags.length && game.tags.every((tag) => FILTER_IDS.includes(tag) && tag !== "all"),
    `${game.id} has valid filter tags`,
  );
  const [from, to] = game.gradeBand;
  if (game.grades)
    assert.deepEqual(
      [from, to],
      [Math.min(...game.grades), Math.max(...game.grades)],
      `${game.id}: band matches its grades`,
    );
  else
    assert.deepEqual(
      [from, to],
      [0, 8],
      `${game.id}: a game with no grade list plays at every grade`,
    );
}
assert.deepEqual(
  Object.keys(TAGS).sort(),
  GAMES.map((game) => game.id).sort(),
  "Tags and registry list the same games",
);
assert.deepEqual(GAMES.find((game) => game.id === "family").gradeBand, [1, 5]);
assert.deepEqual(GAMES.find((game) => game.id === "make24").gradeBand, [3, 8]);
assert.deepEqual(GAMES.find((game) => game.id === "numberquest").gradeBand, [0, 2]);
for (const id of ["baseball", "guess", "race"])
  assert.deepEqual(
    GAMES.find((game) => game.id === id).gradeBand,
    [0, 8],
    `${id} plays at every grade`,
  );

// ---- Backups: the new ids round-trip and unknown ids are still dropped
const cleaned = cleanRewards({ best: { baseball: 2, guess: 3, race: 1, bogus: 3 } });
assert.deepEqual([cleaned.best.baseball, cleaned.best.guess, cleaned.best.race], [2, 3, 1]);
assert.equal("bogus" in cleaned.best, false, "Unknown game ids are dropped");
assert.deepEqual(
  cleanRewards(JSON.parse(JSON.stringify(cleaned))).best,
  cleaned.best,
  "Best records round-trip",
);

// ---- In the Game Room
await import("../math/fluency-lab/app.js");
const $ = (selector) => win.document.querySelector(selector);
const $$ = (selector) => [...win.document.querySelectorAll(selector)];
const click = (selector) => {
  assert.ok($(selector), `Missing ${selector}`);
  $(selector).click();
};
const submit = (form) =>
  form.dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
const answerOf = (text) =>
  Function(
    `return ${text
      .replaceAll(",", "")
      .replace(/=\s*\?/, "")
      .replaceAll("×", "*")
      .replaceAll("÷", "/")
      .replaceAll("−", "-")}`,
  )();
const type = (value) => {
  $("#gm-input").value = String(value);
  submit($(".gm-ask-form"));
};
const rewardsNow = () => JSON.parse(win.localStorage.getItem("ewl-fluency-rewards-v1"));
const factCount = () =>
  Object.keys(JSON.parse(win.localStorage.getItem("ewl-fluency-trail-v1") || "{}").facts || {})
    .length;
await wait();

// Every card shows its grade band, and the filter row narrows the cards.
const cards = $$("[data-game]");
const { familiesForGrade: e8Families } = await import("../math/fluency-lab/e8/games.js");
const GRADE4_TOTAL = 28 + e8Families(4).length;
assert.equal(
  cards.length,
  GRADE4_TOTAL,
  "Grade 4 is offered the 28 classic games plus the Enterprise 8 families",
);
assert.ok(
  cards.every((card) => card.querySelector(".gm-band")?.textContent.trim()),
  "Every card has a grade-band chip",
);
assert.equal($("[data-game='family'] .gm-band").textContent, "Grades 1–5");
assert.equal($("[data-game='baseball'] .gm-band").textContent, "All grades");
assert.equal($$("[data-gm-filter]").length, 5);
assert.equal($("[data-gm-filter='all']").getAttribute("aria-pressed"), "true");
click("[data-gm-filter='twoplayer']");
assert.deepEqual(
  $$("[data-game]").map((card) => card.dataset.game),
  ["teamrelay", "baseball"],
  "The 2-player filter shows both 2-player games",
);
assert.equal($("#gm-shown").textContent, "Showing 2 games");
assert.equal($("[data-gm-filter='twoplayer']").getAttribute("aria-pressed"), "true");
assert.equal($("[data-gm-filter='all']").getAttribute("aria-pressed"), "false");
click("[data-gm-filter='race']");
assert.ok(
  ["baseball", "race", "fluencyrally"].every((id) => $(`[data-game='${id}']`)),
  "Race & sports lists the race games",
);
assert.ok(!$("[data-game='match']"), "Race & sports hides fact-card games");
click("[data-gm-filter='puzzles']");
assert.ok($("[data-game='guess']") && $("[data-game='make24']") && !$("[data-game='baseball']"));
click("[data-gm-filter='all']");
assert.equal($$("[data-game]").length, GRADE4_TOTAL, "All brings every card back");

// Math Baseball with a friend
click("[data-game='baseball']");
await wait();
$("input[name='players'][value='2']").checked = true;
submit($("[data-bb-form]"));
await wait();
assert.equal($$(".bb-board li").length, 2, "Two players on the scoreboard");
assert.ok(
  $(".bb-svg") && $(".bb-svg").getAttribute("aria-label").includes("No runners"),
  "The diamond is described for screen readers",
);
assert.equal($$("[data-tier]").length, 4);
const board = () => $$(".bb-board li b").map((el) => Number(el.textContent));
const pickTier = async (index) => {
  click(`[data-tier='${index}']`);
  await wait();
};
const nextBatter = async () => {
  click("[data-feedback-action='next']");
  await wait();
};
await pickTier(3);
type(answerOf($("#gm-q").textContent));
assert.deepEqual(board(), [1, 0], "A home run on the first try scores the batter");
assert.match($(".gm-note").textContent, /Home run/);
await nextBatter();
await pickTier(2);
type(answerOf($("#gm-q").textContent));
assert.deepEqual(board(), [1, 0]);
assert.match(
  $(".bb-svg").getAttribute("aria-label"),
  /third base/,
  "A triple leaves the batter on third",
);
await nextBatter();
await pickTier(0);
type(answerOf($("#gm-q").textContent));
assert.deepEqual(board(), [2, 0], "A single scores the runner from third");
await nextBatter();
await pickTier(1);
type("999999");
assert.ok($("#gm-steps"), "A first miss shows the steps");
assert.ok(!/\b999999\b/.test($("#gm-steps").textContent));
assert.equal($("#gm-input").disabled, false, "A first miss allows one more try");
type("999998");
assert.match($(".gm-note").textContent, /Out!/, "A second miss is an out");
assert.match($(".bb-svg").getAttribute("aria-label"), /Outs: 1 of 3/);
assert.ok($(".fb-answers"), "The answer is shown after the out");
await nextBatter();
await pickTier(0);
type("999999");
type(answerOf($("#gm-q").textContent));
assert.match($(".gm-note").textContent, /second try/, "A right second try is a single");
assert.match(
  $("[data-feedback-action='next']").textContent,
  /Next half-inning/,
  "The fifth swing ends the half-inning",
);
await nextBatter();
assert.match($(".team-turn").textContent, /Player 2/, "The other player bats next");
assert.deepEqual(board(), [2, 0], "The second-try single moves the runner up without scoring");
let guard = 0;
while (!$(".gm-result") && guard < 80) {
  guard += 1;
  if ($("[data-tier]")) await pickTier(guard % 4);
  else if ($("#gm-input") && !$("#gm-input").disabled) type(answerOf($("#gm-q").textContent));
  else await nextBatter();
}
assert.ok($(".gm-result"), "Math Baseball ends on the result screen");
assert.match($(".tr-score").textContent, /Player 1 \d+ · Player 2 \d+/);
assert.ok($$(".tr-star.on").length >= 1);
assert.equal(factCount(), 0, "Two-player turns never write to the personal fact chart");
assert.ok(rewardsNow().best.baseball >= 1, "The best record is saved");
click("[data-gm-menu]");
await wait();

// Guess the Number: a halving plan finds each secret, and the number line narrows
click("[data-game='guess']");
await wait();
assert.match($(".gn-left").textContent, /100 numbers still possible: 1 to 100/);
click("[data-gn-hint]");
assert.match($(".gm-note").textContent, /try the middle, 50/);
assert.ok($(".gn-mid"), "The hint marks the middle on the number line");
for (let round = 0; round < 3; round += 1) {
  let lo = 1;
  let hi = 100;
  let first = true;
  for (let step = 0; step < 12 && !$("[data-gm-next]"); step += 1) {
    const guess = Math.floor((lo + hi) / 2);
    $("#gn-input").value = String(guess);
    submit($(".gn-form"));
    const verdict = $$(".gn-history li").at(-1).textContent;
    if (first && !/found/.test(verdict)) {
      first = false;
      const lowBand = $("[data-band='low']").getAttribute("style");
      const highBand = $("[data-band='high']").getAttribute("style");
      assert.ok(
        /scaleX\(0\)/.test(lowBand) !== /scaleX\(0\)/.test(highBand),
        "One side of the number line is shaded after a guess",
      );
      const before = $$(".gn-history li").length;
      $("#gn-input").value = String(/too low/.test(verdict) ? 1 : 100);
      submit($(".gn-form"));
      assert.match($(".gm-note").textContent, /already ruled out/);
      assert.equal(
        $$(".gn-history li").length,
        before,
        "A ruled-out number is not counted as a guess",
      );
    }
    if (/too low/.test(verdict)) lo = guess + 1;
    else if (/too high/.test(verdict)) hi = guess - 1;
  }
  assert.ok($("[data-gm-next]"), `Round ${round + 1}: the secret is found within par`);
  assert.ok($$(".gn-history li").length <= 7, "Halving stays within 7 guesses for 1 to 100");
  click("[data-gm-next]");
  await wait();
}
assert.ok($(".gm-result"), "Guess the Number ends on the result screen");
assert.equal($$(".tr-star.on").length, 3, "Halving every time earns three stars");
assert.match($(".tr-score").textContent, /Found 3 numbers in \d+ guesses/);
click("[data-gm-menu]");
await wait();

// Math Race: win both races on first tries; the rival follows its fixed plan
const before = factCount();
click("[data-game='race']");
await wait();
const seg = 312 / TRACK;
for (let race = 0; race < 2; race += 1) {
  const pace = PACES[race];
  assert.match($(".gm-ask").textContent, new RegExp(`finishes after ${pace} problems`));
  for (let turn = 1; turn <= TRACK; turn += 1) {
    type(answerOf($("#gm-q").textContent));
    assert.equal(
      $("[data-car='you']").style.transform,
      `translateX(${turn * seg}px)`,
      "Your car moves one segment per right answer",
    );
    assert.equal(
      $("[data-car='rival']").style.transform,
      `translateX(${rivalAt(turn, pace) * seg}px)`,
      "The rival follows its fixed plan",
    );
    assert.match(
      $("[data-rc-pos]").textContent,
      new RegExp(`You: ${turn} of 6 · Rival: ${rivalAt(turn, pace)} of 6`),
    );
    if (turn < TRACK) assert.match($("[data-feedback-action='next']").textContent, /Next problem/);
    click("[data-feedback-action='next']");
    await wait();
  }
}
assert.ok($(".gm-result"), "Math Race ends on the result screen");
assert.match($(".tr-score").textContent, /Won 2 of 2 races, 12 of 12 right on the first try/);
assert.equal($$(".tr-star.on").length, 3);
assert.ok(
  factCount() > before,
  "A one-player race records first-try facts like the other solo games",
);
assert.equal(rewardsNow().best.race, 3);

// Replay and lose race one by missing every problem: the rival wins on its plan, and the learner can still win race two
click("[data-again]");
await wait();
for (let turn = 1; turn <= PACES[0]; turn += 1) {
  type("999999");
  type("999998");
  assert.match(
    $("[data-rc-pos]").textContent,
    new RegExp(`You: 0 of 6 · Rival: ${rivalAt(turn, PACES[0])} of 6`),
  );
  if (turn < PACES[0]) click("[data-feedback-action='next']");
  await wait();
}
assert.match($(".gm-note").textContent, /rival finished first/);
assert.match($("[data-feedback-action='next']").textContent, /Next race/);
click("[data-feedback-action='next']");
await wait();
for (let turn = 1; turn <= TRACK; turn += 1) {
  type(answerOf($("#gm-q").textContent));
  click("[data-feedback-action='next']");
  await wait();
}
assert.match($(".tr-score").textContent, /Won 1 of 2 races, 6 of 16 right on the first try/);
assert.equal(rewardsNow().best.race, 3, "A lower later result never lowers the best record");
console.log("fluency-arcade: rules, catalog, filters and all three games hold");
process.exit(0);
