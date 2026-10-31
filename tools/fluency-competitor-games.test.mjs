// Make 24 and Class Code Challenge: rules and solver soundness, seeded determinism, and both games played end to end in jsdom.
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

const { apply, dealCard, frac, solve } = await import("../math/fluency-lab/make24-core.js");
const { challengeSet, cleanCode, newCode, validCode } = await import(
  "../math/fluency-lab/challenge-game.js"
);
const { seededRandom, validateAnswer } = await import("../math/fluency-lab/problem-bank.js");

// ---- Make 24 rules
assert.deepEqual(apply(frac(6), frac(4), "×"), frac(24));
assert.equal(apply(frac(7), frac(0), "÷"), null, "Division by zero is refused");
assert.equal(
  apply(frac(7), frac(2), "÷", true),
  null,
  "Whole-number mode refuses an uneven division",
);
assert.equal(
  apply(frac(2), frac(5), "−", true),
  null,
  "Whole-number mode refuses a negative result",
);
assert.deepEqual(apply(frac(7), frac(2), "÷"), frac(7, 2), "Fraction mode keeps exact fractions");
assert.ok(solve([3, 3, 8, 8]), "3 3 8 8 is the classic card that needs 8 ÷ (3 − 8 ÷ 3)");
assert.equal(
  solve([3, 3, 8, 8], { wholeOnly: true }),
  null,
  "...and cannot be solved with whole numbers only",
);
assert.equal(solve([1, 1, 1, 1]), null, "1 1 1 1 cannot make 24");

const evaluate = (steps, values) => {
  const pool = values.map((n) => frac(n));
  for (const { a, b, op } of steps) {
    const parse = (text) =>
      text.includes("/") ? frac(...text.split("/").map(Number)) : frac(Number(text));
    const [x, y] = [parse(a), parse(b)];
    const at = (v) => pool.findIndex((p) => p.n === v.n && p.d === v.d);
    pool.splice(at(x), 1);
    pool.splice(at(y), 1);
    pool.push(apply(x, y, op));
  }
  return pool;
};
for (const grade of [3, 5, 6, 8]) {
  const rng = seededRandom(grade * 101);
  for (let i = 0; i < 150; i += 1) {
    const card = dealCard(grade, rng);
    assert.equal(card.values.length, 4);
    assert.ok(
      card.values.every((n) => n >= 1 && n <= (grade <= 5 ? 9 : 13)),
      `Grade ${grade} numbers stay in range`,
    );
    const left = evaluate(card.solution, card.values);
    assert.deepEqual(left, [frac(24)], `Grade ${grade} card ${card.values} must reach 24`);
    if (grade <= 5)
      assert.ok(
        card.solution.every((s) => !s.result.includes("/")),
        "Grades 3-5 never pass through a fraction",
      );
  }
}

// ---- Class Code Challenge: same grade and code always give the same problems
assert.equal(cleanCode(" ab-c1o9 xyz"), "ABC109");
assert.ok(validCode(newCode()) && newCode().length === 6);
for (let i = 0; i < 40; i += 1) assert.ok(validCode(newCode()), "Generated codes pass validation");
assert.equal(validCode("ABC"), false);
for (const grade of [0, 1, 3, 5, 8]) {
  const a = challengeSet(grade, "K7M2QX");
  const b = challengeSet(grade, "K7M2QX");
  assert.equal(a.length, 8, `Grade ${grade} deals eight problems`);
  assert.deepEqual(
    a.map((x) => x.question),
    b.map((x) => x.question),
    `Grade ${grade}: same code, same problems`,
  );
  assert.equal(new Set(a.map((x) => x.question)).size, 8, "No repeated problem in one set");
  assert.notDeepEqual(
    a.map((x) => x.question),
    challengeSet(grade, "ZZ9A4B").map((x) => x.question),
    "A different code deals different problems",
  );
}

// ---- Both games in the Game Room (Grade 4)
await import("../math/fluency-lab/app.js");
const $ = (selector) => win.document.querySelector(selector);
const $$ = (selector) => [...win.document.querySelectorAll(selector)];
const click = (selector) => {
  assert.ok($(selector), `Missing ${selector}`);
  $(selector).click();
};
const nextStep = async () => {
  const button = $("[data-feedback-action='next']");
  if (button) {
    button.click();
    await wait();
  }
};
const submit = (form) =>
  form.dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
await wait();
assert.ok(
  $('[data-game="make24"]') && $('[data-game="challenge"]'),
  "Both games are offered to Grade 4",
);

click('[data-game="make24"]');
await wait();
for (let round = 0; round < 3; round += 1) {
  const values = $$(".gm-card").map((card) => card.textContent.trim());
  const card = dealCard(4, seededRandom(round + 7));
  // Solve the dealt board from its own tiles, then play the route with clicks.
  const steps = solve(values.map(Number), { wholeOnly: true });
  assert.ok(steps, `Dealt board ${values} is solvable`);
  for (const { a, b, op } of steps) {
    const tiles = $$(".gm-card").map((el) => el.textContent.trim());
    const i = tiles.indexOf(a);
    const j = tiles.findIndex((text, k) => text === b && k !== i);
    $(`[data-t="${i}"]`).click();
    $(`[data-op="${op}"]`).click();
    $(`[data-t="${j}"]`).click();
  }
  assert.ok(
    $(".fb-host[data-phase='correct']"),
    "Reaching 24 without hints is a correct first try",
  );
  await nextStep();
  void card;
}
await wait(60);
assert.ok($(".gm-result"), "Make 24 ends on the shared result screen");
assert.match($(".tr-score").textContent, /Make 24/);
assert.ok($$(".tr-star.on").length === 3, "No hints earns three stars");
click("[data-gm-menu]");
await wait();

click('[data-game="make24"]');
await wait();
click("[data-hint]");
assert.match(
  $(".gm-note").textContent,
  /Try using \d+ and \d+ together/,
  "First hint names a pair only",
);
click("[data-hint]");
assert.match($(".gm-note").textContent, /Try \d+ [+−×÷] \d+\./, "Second hint names the move");
click("[data-hint]");
assert.ok($(".fb-host[data-phase='revealed']"), "Third request shows one way and says so");
click("[data-gm-menu]");
await wait();

click('[data-game="challenge"]');
await wait();
$("#gm-code").value = "k7m2qx";
submit($(".gm-ask-form"));
await wait();
const expected = challengeSet(4, "K7M2QX");
for (let n = 0; n < expected.length; n += 1) {
  assert.equal($("#gm-q").textContent.replace(/\s+/g, " ").trim().length > 0, true);
  $("#gm-input").value = expected[n].answers[0];
  submit($(".gm-ask-form"));
  assert.ok(validateAnswer(expected[n].answers[0], expected[n]));
  await nextStep();
}
await wait(60);
assert.ok($(".gm-result"), "The challenge ends on the result screen");
assert.match($(".tr-score").textContent, /8 of 8 on the first try · Code K7M2QX/);
const rewards = JSON.parse(win.localStorage.getItem("ewl-fluency-rewards-v1"));
assert.ok(
  rewards.best.make24 >= 1 && rewards.best.challenge === 3,
  "Both results are kept as best stars",
);
console.log("fluency-competitor-games: ok");
process.exit(0);
