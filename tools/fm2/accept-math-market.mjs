// Acceptance suite for Math Market (game 4) against the real play.html: real clicks, taps, typing and key presses on the
// register, never window.__fm2.submit. The only use of the test seam is reading the round's own solution (solve()) to
// know which coins, items and numbers to enter, which the suite then plays out through the interface.
// Screenshots land in /tmp/claude-501/fm2-shots/math-market/.
// @fm2 FM-010 FM-073 FM-020 FM-021 FM-026 FM-037 FM-038 FM-039 FM-040
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { assertClean, hasOverflow, launch } from "./harness.mjs";

const SHOTS = "/tmp/claude-501/fm2-shots/math-market";
mkdirSync(SHOTS, { recursive: true });
let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

const h = await launch();
const started = Date.now();
const GAME = "math-market";
// One skill per grade-appropriate entry, covering every register mechanic: enter, pick, tray, cart, pickEnter.
const PLAN = [
  [0, "penny-count"],
  [0, "costs-more"],
  [1, "count-pnd"],
  [2, "dollars-cents"],
  [2, "make-change"],
  [3, "exact-pay"],
  [3, "round-prices"],
  [4, "fill-budget"],
  [4, "multi-step-money"],
  [5, "decimal-ops"],
  [5, "better-buy"],
  [6, "rate-table"],
  [6, "percent-off"],
  [7, "tax-tip"],
  [7, "percent-change"],
  [7, "simple-interest"],
  [8, "compare-plans"],
  [8, "break-even"],
  [8, "slope-unit-cost"],
];

async function open(context, params) {
  const page = await context.newPage();
  await page.goto(h.play({ game: GAME, rounds: 5, seed: 7, lang: "en", ...params }));
  await page.waitForSelector(".mm");
  return page;
}
const roundOf = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__fm2.round)));
const solutionOf = (page) => page.evaluate(() => window.__fm2.solve());
const feedback = (page) => page.locator("[data-fm2-feedback]").innerText();
const hintText = (page) => page.locator("[data-fm2-hintbox]").innerText();

// Translates the round's solution into register actions: tap coins, tap items, then type numbers and press the button.
async function enterSolution(page, how = "click") {
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  const act = (selector) => page.locator(selector)[how]();
  if (sol.tray) for (const piece of sol.tray) await act(`[data-mm-add="${piece}"]`);
  if (sol.cart) for (const index of sol.cart) await act(`[data-mm-tag="${index}"]`);
  if (sol.pick !== undefined) await act(`[data-mm-tag="${sol.pick}"]`);
  if (round.scene?.type === "coins" && round.kind === "enter")
    for (let i = 0; i < Math.min(3, round.scene.coins.length); i += 1)
      await act(`[data-mm-mark="${i}"]`);
  for (const [key, text] of Object.entries(sol.values || {}))
    await page.fill(`[data-mm-field="${key}"]`, text);
  return sol;
}
async function solveByUi(page, how = "click") {
  await enterSolution(page, how);
  await page.locator("[data-mm-submit]")[how]();
}
async function assertSolved(page, label) {
  await page.waitForFunction(() =>
    /Correct!|¡Correcto!/.test(document.querySelector("[data-fm2-feedback]")?.textContent || ""),
  );
  ok(
    await page.locator("[data-fm2-next]").isVisible(),
    `${label}: Next appears after the register is solved`,
  );
}
// A deliberately wrong answer, entered through the interface, for the round's kind.
async function enterWrong(page) {
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  if (round.kind === "tray") await page.click(`[data-mm-add="${round.pool[0]}"]`);
  else if (round.kind === "cart")
    return; // an empty cart is wrong
  else if (round.kind === "pick") await page.click(`[data-mm-tag="${1 - sol.pick}"]`);
  else {
    if (round.kind === "pickEnter") await page.click(`[data-mm-tag="${1 - sol.pick}"]`);
    for (const [key, text] of Object.entries(sol.values))
      await page.fill(`[data-mm-field="${key}"]`, `${text}7`);
  }
}
const clearWork = async (page, round) => {
  if (round.kind === "tray") await page.click("[data-mm-clear]");
  if (round.kind === "enter")
    for (const f of round.fields) await page.fill(`[data-mm-field="${f.key}"]`, "");
};

// Presses Tab (or Shift+Tab) until the focused element matches; proves a control is reachable from the keyboard alone.
async function tabTo(page, selector) {
  const here = () => page.evaluate((s) => Boolean(document.activeElement?.matches(s)), selector);
  for (const key of ["Tab", "Shift+Tab"]) {
    for (let i = 0; i < 70; i += 1) {
      if (await here()) return;
      await page.keyboard.press(key);
    }
  }
  throw new Error(`could not reach ${selector} by keyboard`);
}
const stageSmallTargets = (page) =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll(
        "[data-fm2-stage] button, [data-fm2-stage] input, [data-fm2-stage] a[href]",
      ),
    ]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
      })
      .map(
        (e) =>
          `${e.tagName}:${(e.textContent || e.dataset.mmField || "").trim().slice(0, 20)}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`,
      ),
  );

// ---- 1. opens at several grades with no errors; "How to play" in both languages ------------------------------------------
const desktop = await h.context({ width: 1440, height: 900 });
for (const [grade, skill] of [
  [0, "penny-count"],
  [3, "exact-pay"],
  [6, "better-buy"],
  [8, "compare-plans"],
]) {
  const page = await open(desktop, { grade, skill, level: 2 });
  ok((await page.locator("h1").first().innerText()) === "Math Market", `grade ${grade}: title`);
  ok(
    (await page.locator("[data-fm2-prompt]").innerText()).length > 20,
    `grade ${grade}: a prompt is shown`,
  );
  ok(
    (await page.locator(".mm-register button, .mm-register input").count()) > 1,
    `grade ${grade}: the register has controls`,
  );
  await page.screenshot({ path: `${SHOTS}/grade${grade}-1440.png`, fullPage: true });
  await page.close();
}
assertClean(h.problems, "opening at grades 0, 3, 6, 8");
console.log("PASS opens at grades 0, 3, 6 and 8 with no console, network or page errors");

{
  const page = await open(desktop, { grade: 3, skill: "exact-pay" });
  await page.click("[data-fm2-howto]");
  const steps = page.locator("[data-fm2-howto-steps] li");
  ok(
    (await steps.count()) >= 3 && (await steps.first().isVisible()),
    "How to play: steps are visible",
  );
  ok((await steps.first().innerText()).includes("price tag"), "How to play: English steps");
  await page.click("[data-fm2-dialog-close]");
  await page.click("[data-fm2-lang]");
  await page.click("[data-fm2-howto]");
  ok(
    (await page.locator("[data-fm2-howto-steps] li").first().innerText()).includes(
      "etiqueta de precio",
    ),
    "How to play: Spanish steps",
  );
  ok(
    (await page.locator("[data-fm2-howto-steps] li").count()) === (await steps.count()),
    "How to play: same number of steps in both languages",
  );
  await page.click("[data-fm2-dialog-close]");
  await page.close();
}
console.log("PASS How to play shows its steps in English and Spanish");

// ---- 3. one real interaction per skill: tap, type, tap items; every register mechanic ------------------------------------------
for (const [grade, skill] of PLAN) {
  const page = await open(desktop, { grade, skill, level: 2 });
  await solveByUi(page);
  await assertSolved(page, skill);
  ok(/Correct!/.test(await feedback(page)), `${skill}: shell shows Correct!`);
  await page.close();
}
assertClean(h.problems, "one round of every skill");
console.log(
  `PASS solved a round of all ${PLAN.length} skills through the interface (tray, cart, pick, typed totals, pick+type)`,
);

// ---- 4. a wrong answer gives feedback and no Next; then correct it through the UI -----------------------------------------
for (const [grade, skill] of [
  [0, "penny-count"],
  [0, "costs-more"],
  [3, "exact-pay"],
  [4, "fill-budget"],
  [5, "better-buy"],
  [7, "tax-tip"],
  [8, "compare-plans"],
]) {
  const page = await open(desktop, { grade, skill, level: 2 });
  const round = await roundOf(page);
  await enterWrong(page);
  await page.click("[data-mm-submit]");
  await page.waitForFunction(() =>
    /Not yet/.test(document.querySelector("[data-fm2-feedback]")?.textContent || ""),
  );
  ok(
    !(await page.locator("[data-fm2-next]").isVisible()),
    `${skill}: no Next after a wrong answer`,
  );
  ok(
    (await feedback(page)).length > 25,
    `${skill}: the feedback says what to check (${(await feedback(page)).slice(0, 60)})`,
  );
  await clearWork(page, round);
  await solveByUi(page);
  await assertSolved(page, `${skill} corrected`);
  await page.close();
}
console.log(
  "PASS wrong answers show feedback and no Next, then succeed after correcting through the UI",
);

// ---- 5. hint tiers and the Show me path ---------------------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 3, skill: "exact-pay" });
  const seen = [];
  for (let i = 0; i < 3; i += 1) {
    await page.click("[data-fm2-hint]");
    seen.push(await hintText(page));
  }
  ok(new Set(seen).size === 3, "three hint tiers show three different texts");
  ok(
    await page.locator("[data-fm2-hint]").isDisabled(),
    "hint button is spent after the third tier",
  );
  const answer = await page.evaluate(() => window.__fm2.game.answerText(window.__fm2.round));
  ok(!seen.some((text) => text.includes(answer)), "tiers 0-2 do not print the answer");
  for (let i = 0; i < 3; i += 1) await page.click("[data-mm-submit]");
  ok(await page.locator("[data-fm2-showme]").isVisible(), "Show me appears after three misses");
  await page.click("[data-fm2-showme]");
  ok((await hintText(page)).includes(answer), "Show me gives the full solution");
  ok(await page.locator("[data-fm2-next]").isVisible(), "Next appears after Show me");
  ok(/worked answer/.test(await feedback(page)), "the shell says the answer was shown");
  ok(await page.locator("[data-mm-add]").first().isDisabled(), "the register locks after Show me");
  await page.close();
}
console.log("PASS hint tiers differ, Show me appears after three misses and states the solution");

// ---- 6. Reset, Start over, a five-round activity, stars, stored record, a second profile ---------------------------------------
{
  const page = await open(desktop, { grade: 3, skill: "exact-pay" });
  await page.click('[data-mm-add="25"]');
  await page.click('[data-mm-add="10"]');
  ok((await page.locator("[data-mm-out]").count()) === 2, "two pieces are in the tray");
  await page.click("[data-fm2-reset]");
  ok((await page.locator("[data-mm-out]").count()) === 0, "Reset this puzzle empties the tray");
  await solveByUi(page);
  await assertSolved(page, "before start over");
  await page.click("[data-fm2-next]");
  ok(
    /Round 2 of 5/.test(await page.locator("[data-fm2-round]").innerText()),
    "Next goes to round 2",
  );
  await page.click("[data-fm2-restart]");
  ok(
    /Round 1 of 5/.test(await page.locator("[data-fm2-round]").innerText()),
    "Start over returns to round 1",
  );
  await page.close();
}
{
  const clean = await h.context({ width: 1440, height: 900 }); // empty storage, so the play count is exactly this activity's
  const page = await open(clean, { grade: 0, skill: "penny-count" });
  for (let i = 0; i < 5; i += 1) {
    await solveByUi(page);
    await assertSolved(page, `round ${i + 1}`);
    await page.click("[data-fm2-next]");
  }
  await page.waitForSelector(".fm2-finish:not([hidden])");
  ok(
    /3 of 3 stars/.test((await page.locator(".fm2-stars").getAttribute("aria-label")) || ""),
    "the finish screen shows stars",
  );
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fm2-v1")));
  ok(
    stored.skills["math-market:penny-count"]?.plays === 5,
    `localStorage ewl-fm2-v1 holds 5 plays of the skill (${JSON.stringify(stored.skills["math-market:penny-count"])})`,
  );
  ok(
    stored.games["math-market"]?.completed === 1 && stored.games["math-market"].bestStars === 3,
    "the activity is recorded as completed with 3 stars",
  );
  const other = await clean.newPage();
  await other.goto(
    h.play({ game: GAME, grade: 0, skill: "penny-count", profile: 1, seed: 7, lang: "en" }),
  );
  await other.waitForSelector(".mm");
  const second = await other.evaluate(() =>
    JSON.parse(localStorage.getItem("ewl-fm2-v1:profile-1") || "{}"),
  );
  ok(!second.skills?.["math-market:penny-count"], "a second profile has no record of that skill");
  const first = await other.evaluate(
    () => JSON.parse(localStorage.getItem("ewl-fm2-v1")).skills["math-market:penny-count"].plays,
  );
  ok(first === 5, "the first profile's record is untouched");
  await other.close();
  await page.close();
  await clean.close();
}
console.log(
  "PASS Reset, Start over, a 5-round activity with stars, the stored record, and a separate second profile",
);

// ---- 7. leave and return: resume restores the same round and earlier results -------------------------------------------------
{
  const page = await open(desktop, { grade: 3, skill: "make-change", seed: 21 });
  await solveByUi(page);
  await assertSolved(page, "resume setup round 1");
  await page.click("[data-fm2-next]");
  await solveByUi(page);
  await assertSolved(page, "resume setup round 2");
  await page.click("[data-fm2-next]");
  const before = await page.evaluate(() => window.__fm2.round.prompt.en);
  await page.goto(
    h.play({ game: GAME, grade: 3, skill: "make-change", seed: 21, lang: "en", resume: 1 }),
  );
  await page.waitForSelector(".mm");
  ok(
    /Round 3 of 5/.test(await page.locator("[data-fm2-round]").innerText()),
    "resume=1 returns to round 3",
  );
  ok(
    (await page.evaluate(() => window.__fm2.round.prompt.en)) === before,
    "resume rebuilds the same round from the seed",
  );
  ok(
    (await page.locator(".fm2-dot-done").count()) === 2,
    "earlier results are restored (two solved rounds)",
  );
  await page.close();
}
console.log("PASS resume=1 restores the round index, the same round and the earlier results");

// ---- 8. language switch keeps the work; labels change -------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 3, skill: "exact-pay", seed: 3 });
  const keysEn = await page.locator(".mm-key-name").allInnerTexts();
  await page.click('[data-mm-add="25"]');
  await page.click('[data-mm-add="10"]');
  const totalBefore = await page.locator("[data-mm-total]").innerText();
  await page.click("[data-fm2-lang]");
  const keysEs = await page.locator(".mm-key-name").allInnerTexts();
  ok(
    keysEs.join() !== keysEn.join() && /moneda|centavo/.test(keysEs.join()),
    `register labels switch to Spanish (${keysEs.join(" | ")})`,
  );
  ok(
    (await page.locator("[data-mm-out]").count()) === 2 &&
      (await page.locator("[data-mm-total]").innerText()) === totalBefore,
    "the pieces already placed remain after the switch",
  );
  ok(
    /Pagar/.test(await page.locator("[data-mm-submit]").innerText()),
    "the main button is in Spanish",
  );
  await page.click("[data-mm-clear]");
  await solveByUi(page);
  await page.waitForFunction(() =>
    /¡Correcto!/.test(document.querySelector("[data-fm2-feedback]")?.textContent || ""),
  );
  await page.click("[data-fm2-lang]");
  ok(
    /Correct!/.test(await feedback(page)) ||
      /Pay/.test(await page.locator("[data-mm-submit]").innerText()),
    "switching back restores English labels",
  );
  ok(
    /Pay/.test(await page.locator("[data-mm-submit]").innerText()),
    "the main button is back in English",
  );
  await page.close();
}
{
  const page = await open(desktop, { grade: 7, skill: "tax-tip", level: 2 });
  await page.fill('[data-mm-field="answer"]', "12.34");
  await page.click("[data-fm2-lang]");
  ok(
    (await page.inputValue('[data-mm-field="answer"]')) === "12.34",
    "typed text is kept across the language switch",
  );
  ok(
    /Total|\(\$\)/.test(await page.locator(".mm-field label").innerText()),
    "the field label is relabelled",
  );
  await page.screenshot({ path: `${SHOTS}/tax-es-1440.png`, fullPage: true });
  await page.close();
}
{
  const page = await open(desktop, { grade: 4, skill: "fill-budget", seed: 5 });
  const sol = await solutionOf(page);
  await page.click(`[data-mm-tag="${sol.cart[0]}"]`);
  await page.click("[data-fm2-lang]");
  ok(
    (await page.locator("[data-mm-drop]").count()) === 1,
    "the cart keeps its item after a language switch",
  );
  ok(
    /Tu carrito|Quitar/.test(await page.locator(".mm-register").innerText()),
    "the cart is relabelled in Spanish",
  );
  await page.close();
}
console.log("PASS language switch relabels the register and keeps the tray, cart and typed text");

// ---- 9. mobile touch, overflow, 44px targets -----------------------------------------------------------------------------------
const phone = await h.context({ width: 375, height: 800, touch: true });
for (const [grade, skill] of [
  [0, "penny-count"],
  [3, "exact-pay"],
  [4, "fill-budget"],
  [5, "better-buy"],
  [8, "compare-plans"],
]) {
  const page = await open(phone, { grade, skill, level: 2 });
  ok(!(await hasOverflow(page)), `${skill}: no horizontal overflow at 375 touch`);
  ok(
    (await stageSmallTargets(page)).length === 0,
    `${skill}: every control in the stage is at least 44px (${(await stageSmallTargets(page)).join(", ")})`,
  );
  await solveByUi(page, "tap");
  await assertSolved(page, `${skill} by touch`);
  await page.close();
}
for (const width of [320, 375, 768, 1440]) {
  const context = await h.context({ width, height: 900 });
  for (const [grade, skill] of [
    [0, "costs-more"],
    [2, "make-change"],
    [3, "exact-pay"],
    [4, "fill-budget"],
    [6, "rate-table"],
    [7, "percent-off"],
    [8, "break-even"],
    [1, "count-pnd"],
  ]) {
    const page = await open(context, { grade, skill, level: 3 });
    await enterSolution(page);
    ok(!(await hasOverflow(page)), `${skill}: no horizontal overflow at ${width}px`);
    ok(
      (await stageSmallTargets(page)).length === 0,
      `${skill}: 44px targets at ${width}px (${(await stageSmallTargets(page)).join(", ")})`,
    );
    if (width === 320 || width === 768)
      await page.screenshot({ path: `${SHOTS}/${skill}-${width}.png`, fullPage: true });
    await page.close();
  }
  await context.close();
}
{
  const page = await open(phone, { grade: 3, skill: "make-change", lang: "es" });
  await enterSolution(page, "tap");
  await page.screenshot({ path: `${SHOTS}/make-change-es-375.png`, fullPage: true });
  await page.close();
}
console.log(
  "PASS touch taps solve rounds at 375px; no overflow at 320, 375, 768 and 1440; every stage control is 44px",
);

// ---- 10. keyboard only: Tab to a control, Enter or Space to use it, Backspace to take back --------------------------------------
{
  const page = await open(desktop, { grade: 3, skill: "exact-pay", seed: 13 });
  const sol = await solutionOf(page);
  const [first] = sol.tray;
  await tabTo(page, `[data-mm-add="${first}"]`);
  await page.keyboard.press("Enter");
  ok((await page.locator("[data-mm-out]").count()) === 1, "Enter puts a piece in the tray");
  await page.keyboard.press("Space");
  ok((await page.locator("[data-mm-out]").count()) === 2, "Space puts another piece in");
  await page.keyboard.press("Backspace");
  ok(
    (await page.locator("[data-mm-out]").count()) === 1,
    "Backspace takes the last piece back out",
  );
  await page.keyboard.press("Backspace");
  for (const piece of sol.tray) {
    await tabTo(page, `[data-mm-add="${piece}"]`);
    await page.keyboard.press("Enter");
  }
  await tabTo(page, "[data-mm-submit]");
  await page.keyboard.press("Enter");
  await assertSolved(page, "keyboard-only tray");
  await page.close();
}
{
  const page = await open(desktop, { grade: 4, skill: "fill-budget", seed: 4 });
  const sol = await solutionOf(page);
  for (const index of sol.cart) {
    await tabTo(page, `[data-mm-tag="${index}"]`);
    await page.keyboard.press("Space");
  }
  await tabTo(page, "[data-mm-submit]");
  await page.keyboard.press("Enter");
  await assertSolved(page, "keyboard-only cart");
  await page.close();
}
{
  const page = await open(desktop, { grade: 5, skill: "better-buy", seed: 6 });
  const sol = await solutionOf(page);
  await tabTo(page, `[data-mm-tag="${sol.pick}"]`);
  await page.keyboard.press("Space");
  for (const [key, text] of Object.entries(sol.values)) {
    await tabTo(page, `[data-mm-field="${key}"]`);
    await page.keyboard.type(text);
  }
  await page.keyboard.press("Enter");
  await assertSolved(page, "keyboard-only pick and type");
  await page.close();
}
{
  const page = await open(desktop, { grade: 7, skill: "percent-off", seed: 8 });
  const sol = await solutionOf(page);
  await tabTo(page, '[data-mm-field="answer"]');
  await page.keyboard.type(sol.values.answer);
  await page.keyboard.press("Enter");
  await assertSolved(page, "keyboard-only typed total");
  ok(
    (await page.getAttribute('[data-mm-field="answer"]', "inputmode")) === "decimal",
    "numeric entry is a real input with inputmode decimal",
  );
  await page.close();
}
{
  const page = await open(desktop, { grade: 0, skill: "penny-count", seed: 9 });
  await tabTo(page, '[data-mm-mark="0"]');
  await page.keyboard.press("Enter");
  ok(
    (await page.getAttribute('[data-mm-mark="0"]', "aria-pressed")) === "true",
    "a coin can be marked as counted from the keyboard",
  );
  await page.close();
}
console.log("PASS tray, cart, pick and typed rounds are all completed with the keyboard alone");

// ---- 11. axe-core, both languages -----------------------------------------------------------------------------------------------
for (const lang of ["en", "es"]) {
  for (const [grade, skill, level] of [
    [0, "penny-count", 2],
    [3, "exact-pay", 2],
    [4, "fill-budget", 2],
    [5, "better-buy", 2],
    [6, "rate-table", 2],
    [8, "compare-plans", 2],
    [0, "costs-more", 1],
  ]) {
    const page = await open(desktop, { grade, skill, level, lang });
    await enterSolution(page);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    ok(
      result.violations.length === 0,
      `axe (${lang}, ${skill}): ${JSON.stringify(result.violations.map((v) => [v.id, v.nodes.slice(0, 2).map((n) => n.html.slice(0, 90))]))}`,
    );
    await page.click("[data-mm-submit]");
    await page.waitForSelector("[data-fm2-next]:not([hidden])");
    const done = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    ok(
      done.violations.length === 0,
      `axe finished (${lang}, ${skill}): ${JSON.stringify(done.violations.map((v) => v.id))}`,
    );
    await page.close();
  }
}
console.log("PASS axe-core finds no wcag2a/aa violations in English or Spanish");

// ---- screenshots for the visual review ------------------------------------------------------------------------------------------
for (const [name, width, params] of [
  ["exact-pay-768", 768, { grade: 3, skill: "exact-pay" }],
  ["cart-375", 375, { grade: 4, skill: "fill-budget" }],
  ["table-es-1440", 1440, { grade: 6, skill: "rate-table", lang: "es" }],
  ["plans-es-375", 375, { grade: 8, skill: "compare-plans", lang: "es" }],
]) {
  const context = await h.context({ width, height: 900 });
  const page = await open(context, { level: 2, ...params });
  await enterSolution(page);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
  await context.close();
}

assertClean(h.problems, "the whole Math Market suite");
await h.close();
console.log(
  `math-market acceptance: ${checks} checks passed in ${Math.round((Date.now() - started) / 1000)}s.`,
);
