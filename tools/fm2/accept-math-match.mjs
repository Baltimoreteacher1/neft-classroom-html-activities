// Acceptance suite for Math Match (game 2), against the real play.html: real clicks, taps and key presses on the board,
// never window.__fm2.submit. The only use of the test seam is reading the round's own solution (solve()) to know which
// cards belong together, which the suite then plays out through the interface. Screenshots land in
// /tmp/claude-501/fm2-shots/math-match/. @fm2 FM-008 FM-071 FM-020 FM-021 FM-026 FM-037 FM-038 FM-039 FM-040
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { assertClean, hasOverflow, launch, smallTargets } from "./harness.mjs";

const SHOTS = "/tmp/claude-501/fm2-shots/math-match";
mkdirSync(SHOTS, { recursive: true });
let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

const h = await launch();
const started = Date.now();
const GAME = "math-match";

async function open(context, params) {
  const page = await context.newPage();
  await page.goto(h.play({ game: GAME, rounds: 5, seed: 7, lang: "en", ...params }));
  await page.waitForSelector(".mm-card");
  return page;
}
const roundOf = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__fm2.round)));
const solutionOf = (page) => page.evaluate(() => window.__fm2.solve());
const card = (page, id) => page.locator(`.mm-card[data-id="${id}"]`);
const text = (page, selector) => page.locator(selector).first().innerText();
// The visually hidden skip link (1px by design) and the site-wide Save / Resume button the page injects are not part of
// the game; every other control must be at least 44px.
const tooSmall = async (page) =>
  (await smallTargets(page)).filter((t) => !/^a:Skip to the activity|Save \/ Resume/.test(t));
const states = (page) => page.$$eval(".mm-card", (cards) => cards.map((c) => c.dataset.state));

// Plays one set by clicking (or tapping) its cards in the interface.
async function playSet(page, ids, how = "click") {
  for (const id of ids) await card(page, id)[how]();
}
async function solveByUi(page, how = "click") {
  const { groups } = await solutionOf(page);
  for (const group of groups) await playSet(page, group, how);
}
// Two cards that do not belong together, by the round's own solution.
async function mismatchPair(page, skip = 0) {
  const { groups } = await solutionOf(page);
  return [groups[skip][0], groups[skip + 1][0]];
}
async function missOnce(page, how = "click", skip = 0) {
  const [a, b] = await mismatchPair(page, skip);
  await card(page, a)[how]();
  await card(page, b)[how]();
}
async function assertSolved(page, label) {
  await page.waitForFunction(
    () =>
      document.querySelector("[data-fm2-feedback]")?.textContent.includes("Correct!") ||
      document.querySelector("[data-fm2-feedback]")?.textContent.includes("¡Correcto!"),
  );
  ok(
    await page.locator("[data-fm2-next]").isVisible(),
    `${label}: Next appears after the board is solved`,
  );
}

// ---- 1. opens at several grades with no errors -----------------------------------------------------------------------------
const desktop = await h.context({ width: 1440, height: 900 });
for (const grade of [0, 3, 6, 8]) {
  const page = await open(desktop, { grade, level: 1 });
  const round = await roundOf(page);
  ok(
    round.cards.length === 6 && (await page.locator(".mm-card").count()) === 6,
    `grade ${grade}: a six-card board opens`,
  );
  ok(
    (await states(page)).every((s) => s === "down"),
    `grade ${grade}: every card starts face down`,
  );
  ok(
    (await card(page, 4).getAttribute("aria-label")) === "Card 5, face down",
    `grade ${grade}: face-down label names only the card number`,
  );
  ok(!(await hasOverflow(page)), `grade ${grade}: no horizontal overflow`);
  await page.close();
}
console.log(
  `[${((Date.now() - started) / 1000).toFixed(0)}s]`,
  "PASS opens at grades 0, 3, 6 and 8 with a clean console",
);

// ---- 2. how to play, in both languages ---------------------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 3, skill: "g3-fraction", level: 2 });
  await page.click("[data-fm2-howto]");
  ok(await page.locator("dialog[open]").isVisible(), "How to play opens");
  const steps = await page.$$eval("[data-fm2-howto-steps] li", (items) =>
    items.map((li) => li.textContent),
  );
  ok(
    steps.length >= 3 && steps.every((s) => s.length > 20) && steps[0].startsWith("Tap a card"),
    "English steps are visible",
  );
  await page.click("[data-fm2-dialog-close]");
  await page.click("[data-fm2-lang]");
  await page.click("[data-fm2-howto]");
  const es = await page.$$eval("[data-fm2-howto-steps] li", (items) =>
    items.map((li) => li.textContent),
  );
  ok(
    es.length === steps.length &&
      es[0].startsWith("Toca una carta") &&
      es.every((s, i) => s !== steps[i]),
    "Spanish steps are visible and different",
  );
  await page.screenshot({ path: `${SHOTS}/how-to-es-1440.png` });
  await page.click("[data-fm2-dialog-close]");
  await page.close();
}
console.log(
  `[${((Date.now() - started) / 1000).toFixed(0)}s]`,
  "PASS how to play opens in English and Spanish",
);

// ---- 3. real interaction solves a round of each of several skills ----------------------------------------------------------------
for (const [skill, grade, level] of [
  ["k-count", 0, 1],
  ["g3-fraction", 3, 2],
  ["g6-ratio", 6, 3],
  ["g8-linear", 8, 3],
  ["g5-order", 5, 2],
  ["g2-coins", 2, 3],
]) {
  const page = await open(desktop, { grade, skill, level });
  const round = await roundOf(page);
  const { groups } = await solutionOf(page);
  let found = 0;
  for (const group of groups) {
    await playSet(page, group);
    found += 1;
    if (found < groups.length) {
      const status = await text(page, ".mm-status");
      ok(
        status.includes(`Sets found: ${found} of ${groups.length}`),
        `${skill}: progress shows ${found} sets found, got "${status}"`,
      );
    }
  }
  await assertSolved(page, skill);
  ok(
    (await text(page, "[data-fm2-feedback]")).includes("Correct!"),
    `${skill}: the shell says Correct!`,
  );
  const matched = (await states(page)).filter((s) => s === "matched").length;
  ok(matched === round.cards.length, `${skill}: every card ends matched and face up`);
  ok(
    (await card(page, 0).getAttribute("aria-label")).startsWith("Card 1, matched: "),
    `${skill}: a matched card states its face`,
  );
  await page.close();
}
console.log(
  `[${((Date.now() - started) / 1000).toFixed(0)}s]`,
  "PASS real clicks solve rounds of six different skills",
);

// ---- 4. a wrong grouping through the interface, then the fix ------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 2, skill: "g2-place", level: 3 });
  const [a, b] = await mismatchPair(page);
  await card(page, a).click();
  const faceUp = await card(page, a).getAttribute("aria-label");
  ok(/^Card \d+, face up: /.test(faceUp), "a flipped card states its face");
  await card(page, b).click();
  const feedback = await text(page, "[data-fm2-feedback]");
  ok(
    feedback.includes("Not yet") && feedback.length > 40,
    `a mismatch gives named feedback: ${feedback}`,
  );
  ok(!(await page.locator("[data-fm2-next]").isVisible()), "no Next after a mismatch");
  ok(await page.locator("[data-mm-pending]").isVisible(), "Got it appears");
  ok(
    await page.evaluate(() => document.activeElement?.hasAttribute("data-mm-gotit")),
    "focus moves to Got it",
  );
  ok(
    (await card(page, a).getAttribute("data-state")) === "up" &&
      (await card(page, b).getAttribute("data-state")) === "up",
    "the two cards stay face up until Got it",
  );
  await card(
    page,
    [0, 1, 2, 3].find((i) => i !== a && i !== b),
  ).click();
  ok(
    (await states(page)).filter((s) => s === "up").length === 2,
    "other cards cannot be turned over while Got it is pending",
  );
  await page.click("[data-mm-gotit]");
  ok(
    (await states(page)).every((s) => s === "down"),
    "Got it turns the cards back over",
  );
  ok(
    (await card(page, a).getAttribute("aria-label")).endsWith("face down"),
    "the label goes back to face down",
  );
  ok(!(await page.locator("[data-mm-pending]").isVisible()), "Got it goes away");
  await solveByUi(page);
  await assertSolved(page, "after a mismatch");
  ok(
    (await text(page, "[data-fm2-feedback]")).includes("turns"),
    "the finished board reports its turns",
  );
  await page.close();
}
console.log(
  `[${((Date.now() - started) / 1000).toFixed(0)}s]`,
  "PASS a mismatch gives feedback and no Next, and the board can still be solved",
);

// ---- 5. hint tiers and Show me ------------------------------------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 4, skill: "g4-fracdec", level: 2 });
  const answer = await page.evaluate(() => window.__fm2.game.answerText(window.__fm2.round));
  const boxes = [];
  for (let i = 0; i < 3; i += 1) {
    await page.click("[data-fm2-hint]");
    boxes.push(await text(page, "[data-fm2-hintbox]"));
  }
  ok(
    new Set(boxes).size === 3 && boxes.every((b) => b.length > 30),
    "each hint tier shows different text",
  );
  ok(
    boxes.every((b) => !b.includes(answer)),
    "tiers 0 to 2 do not state the answer",
  );
  ok(await page.locator("[data-fm2-hint]").isDisabled(), "the hint button stops after three hints");
  await page.close();

  const miss = await open(desktop, { grade: 4, skill: "g4-fracdec", level: 2 });
  ok(!(await miss.locator("[data-fm2-showme]").isVisible()), "Show me is hidden at first");
  for (let i = 0; i < 3; i += 1) {
    await missOnce(miss);
    await miss.click("[data-mm-gotit]");
  }
  ok(await miss.locator("[data-fm2-showme]").isVisible(), "Show me appears after three misses");
  await miss.click("[data-fm2-showme]");
  const shown = await text(miss, "[data-fm2-hintbox]");
  const key = await miss.evaluate(() => window.__fm2.game.answerText(window.__fm2.round));
  ok(shown.includes(key), "Show me states the full solution");
  ok(
    (await text(miss, "[data-fm2-feedback]")).includes("worked answer"),
    "Show me says it is a worked answer",
  );
  ok(await miss.locator("[data-fm2-next]").isVisible(), "Next appears after Show me");
  await miss.waitForFunction(() => document.querySelector(".mm-card")?.dataset.state === "shown");
  ok(
    (await states(miss)).every((s) => s === "shown"),
    "Show me turns every card over, grouped by letter",
  );
  ok(
    (await card(miss, 0).getAttribute("aria-label")).includes("set "),
    "shown cards name their set",
  );
  await miss.screenshot({ path: `${SHOTS}/show-me-1440.png` });
  await miss.close();
}
console.log(
  `[${((Date.now() - started) / 1000).toFixed(0)}s]`,
  "PASS hint tiers differ and Show me appears after three misses",
);

// ---- 6. reset, start over, a five-round activity and per-profile records -----------------------------------------------------------
{
  const context = await h.context({ width: 1024, height: 800 });
  const page = await open(context, { grade: 3, skill: "g3-multiply", level: 1, rounds: 5 });
  const { groups } = await solutionOf(page);
  await playSet(page, groups[0]);
  ok(
    (await text(page, ".mm-status")).includes("Sets found: 1 of 3"),
    "one set is found before reset",
  );
  await page.click("[data-fm2-reset]");
  ok(
    (await states(page)).every((s) => s === "down") &&
      (await text(page, ".mm-status")).includes("Sets found: 0 of 3"),
    "Reset this puzzle turns every card back over",
  );
  await solveByUi(page);
  await page.click("[data-fm2-next]");
  ok((await text(page, "[data-fm2-round]")) === "Round 2 of 5", "Next goes to round 2");
  await page.click("[data-fm2-restart]");
  ok(
    (await text(page, "[data-fm2-round]")) === "Round 1 of 5" &&
      (await states(page)).every((s) => s === "down"),
    "Start over returns to round 1 with a fresh board",
  );
  await context.close();
}
{
  const context = await h.context({ width: 1024, height: 800 });
  const page = await open(context, {
    grade: 3,
    skill: "g3-multiply",
    level: 1,
    rounds: 5,
    profile: 0,
  });
  for (let round = 1; round <= 5; round += 1) {
    if (round === 3) {
      await missOnce(page);
      await page.click("[data-mm-gotit]");
    }
    await solveByUi(page);
    await assertSolved(page, `round ${round}`);
    await page.click("[data-fm2-next]");
  }
  await page.waitForSelector(".fm2-stars");
  const stars = await page.getAttribute(".fm2-stars", "aria-label");
  ok(
    /^\d of 3 stars$/.test(stars) && stars.startsWith("3"),
    `the finish screen shows stars: ${stars}`,
  );
  await page.screenshot({ path: `${SHOTS}/finish-1024.png` });
  const stored = JSON.parse(await page.evaluate(() => localStorage.getItem("ewl-fm2-v1")));
  ok(
    stored.skills["math-match:g3-multiply"]?.plays === 5,
    `the skill record counts five plays: ${stored.skills["math-match:g3-multiply"]?.plays}`,
  );
  ok(stored.games["math-match"].completed === 1, "the activity is recorded as completed once");
  const other = await open(context, {
    grade: 3,
    skill: "g3-multiply",
    level: 1,
    rounds: 5,
    profile: 1,
  });
  const second = await other.evaluate(() => localStorage.getItem("ewl-fm2-v1:profile-1"));
  ok(
    !second || !JSON.parse(second).skills["math-match:g3-multiply"],
    "a second profile has no record of that skill",
  );
  await other.close();
  await page.close();
  await context.close();
}
console.log(
  `[${((Date.now() - started) / 1000).toFixed(0)}s]`,
  "PASS reset, start over, a five-round activity, stars and profile-separated records",
);

// ---- 7. leave and return -------------------------------------------------------------------------------------------------------------
{
  const context = await h.context({ width: 1024, height: 800 });
  const page = await open(context, {
    grade: 4,
    skill: "g4-equiv",
    level: 1,
    rounds: 4,
    profile: 0,
  });
  await solveByUi(page);
  await page.click("[data-fm2-next]");
  const before = await roundOf(page);
  ok((await text(page, "[data-fm2-round]")) === "Round 2 of 4", "round 2 is current");
  await page.goto(h.play({ game: GAME, resume: 1, profile: 0 }));
  await page.waitForSelector(".mm-card");
  ok((await text(page, "[data-fm2-round]")) === "Round 2 of 4", "resume restores the round index");
  same(await roundOf(page), before, "resume rebuilds the same board from the seed");
  ok((await page.locator(".fm2-dot-done").count()) === 1, "resume keeps the earlier result");
  await page.close();
  await context.close();
}
console.log(
  `[${((Date.now() - started) / 1000).toFixed(0)}s]`,
  "PASS resume restores the round and earlier results",
);
function same(a, b, message) {
  assert.deepEqual(a, b, message);
  checks += 1;
}

// ---- 8. language switch keeps the work ---------------------------------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 3, skill: "g3-fraction", level: 2, lang: "en" });
  const { groups } = await solutionOf(page);
  await playSet(page, groups[0]);
  const extra = groups[1][0];
  await card(page, extra).click();
  const before = await card(page, extra).getAttribute("aria-label");
  ok(before.startsWith("Card ") && before.includes("face up"), "one card is face up in English");
  await page.click("[data-fm2-lang]");
  ok(
    (await card(page, extra).getAttribute("aria-label")).startsWith("Carta ") &&
      (await card(page, extra).getAttribute("aria-label")).includes("boca arriba"),
    "the face-up card is still up, now labeled in Spanish",
  );
  ok(
    (await card(page, groups[0][0]).getAttribute("aria-label")).includes("emparejada"),
    "matched cards stay matched, labeled in Spanish",
  );
  ok(
    (await text(page, ".mm-status")).includes("Conjuntos encontrados: 1 de 4"),
    "progress is kept and spoken in Spanish",
  );
  const other = [...Array(8).keys()].find((i) => ![...groups[0], extra].includes(i));
  ok(
    (await card(page, other).getAttribute("aria-label")) === `Carta ${other + 1}, boca abajo`,
    "face-down cards are labeled in Spanish",
  );
  await page.screenshot({ path: `${SHOTS}/spanish-1440.png` });
  await page.click("[data-fm2-lang]");
  ok(
    (await card(page, extra).getAttribute("aria-label")).includes("face up") &&
      (await states(page)).filter((s) => s === "matched").length === 2,
    "switching back keeps the work",
  );
  await card(page, groups[1][1]).click();
  for (const group of groups.slice(2)) await playSet(page, group);
  await assertSolved(page, "after switching languages");
  await page.close();
}
console.log(
  `[${((Date.now() - started) / 1000).toFixed(0)}s]`,
  "PASS switching language keeps flipped and matched cards",
);

// ---- 9. mobile touch, overflow and targets -------------------------------------------------------------------------------------------------
{
  const touch = await h.context({ width: 375, height: 800, touch: true });
  const page = await open(touch, { grade: 6, skill: "g6-fdp", level: 3 });
  const { groups } = await solutionOf(page);
  await playSet(page, groups[0], "tap");
  ok(
    (await text(page, ".mm-status")).includes("Sets found: 1 of 4"),
    "taps flip cards and find a set",
  );
  await missOnce(page, "tap", 1);
  await page.tap("[data-mm-gotit]");
  ok(
    (await states(page)).filter((s) => s === "matched").length === 3,
    "tapping Got it clears a mismatch on a phone",
  );
  await page.screenshot({ path: `${SHOTS}/phone-mid-375.png` });
  for (const group of groups.slice(1)) await playSet(page, group, "tap");
  await assertSolved(page, "phone");
  await page.screenshot({ path: `${SHOTS}/phone-375.png` });
  ok(
    (await tooSmall(page)).length === 0,
    `no target is smaller than 44px: ${await tooSmall(page)}`,
  );
  await page.close();
  await touch.close();
  for (const [width, skill, level, grade] of [
    [320, "g4-wordform", 3, 4],
    [375, "g6-ratio", 3, 6],
    [768, "g8-exponents", 3, 8],
    [1440, "g1-time", 3, 1],
    [320, "k-count", 3, 0],
    [320, "g8-linear", 3, 8],
  ]) {
    const context = await h.context({ width, height: 800 });
    const wide = await open(context, { grade, skill, level });
    await solveByUi(wide);
    ok(!(await hasOverflow(wide)), `${skill}: no horizontal overflow at ${width}px`);
    const bad = await tooSmall(wide);
    ok(bad.length === 0, `${skill}: no small targets at ${width}px: ${bad}`);
    if (width === 768 || width === 1440 || skill === "g4-wordform")
      await wide.screenshot({ path: `${SHOTS}/${skill}-${width}.png` });
    await context.close();
  }
}
console.log(
  `[${((Date.now() - started) / 1000).toFixed(0)}s]`,
  "PASS tap play, no horizontal overflow at 320, 375, 768 and 1440, and no small targets",
);

// ---- 10. keyboard only ----------------------------------------------------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 5, skill: "g5-fdp", level: 2 });
  const round = await roundOf(page);
  const { groups } = await solutionOf(page);
  for (
    let i = 0;
    i < 20 && !(await page.evaluate(() => document.activeElement?.classList.contains("mm-card")));
    i += 1
  )
    await page.keyboard.press("Tab");
  ok(
    await page.evaluate(() => document.activeElement?.classList.contains("mm-card")),
    "Tab reaches the board",
  );
  const focused = () => page.evaluate(() => Number(document.activeElement.dataset.id));
  const goTo = async (id) => {
    await page.keyboard.press("Home");
    for (let i = 0; i < id; i += 1) await page.keyboard.press("ArrowRight");
    ok((await focused()) === id, `ArrowRight reaches card ${id + 1}`);
  };
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowDown");
  ok((await focused()) === 4, "ArrowDown moves one row (four columns)");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowLeft");
  ok((await focused()) === 0, "ArrowUp and ArrowLeft stop at the edge");
  await page.keyboard.press("End");
  ok((await focused()) === round.cards.length - 1, "End goes to the last card");
  const [a, b] = await mismatchPair(page);
  await goTo(a);
  await page.keyboard.press("Enter");
  await goTo(b);
  await page.keyboard.press("Space");
  ok(
    await page.evaluate(() => document.activeElement?.hasAttribute("data-mm-gotit")),
    "after a mismatch focus is on Got it",
  );
  await page.keyboard.press("Escape");
  ok(
    (await states(page)).every((s) => s === "down") && (await focused()) === a,
    "Escape also turns the cards back, returning focus to the first card",
  );
  for (const group of groups) {
    for (const id of group) {
      await goTo(id);
      await page.keyboard.press("Enter");
    }
  }
  await assertSolved(page, "keyboard");
  await page.close();
}
console.log(
  `[${((Date.now() - started) / 1000).toFixed(0)}s]`,
  "PASS a round is solved with the keyboard alone",
);

// ---- 11. axe, both languages ----------------------------------------------------------------------------------------------------------------
for (const lang of ["en", "es"]) {
  for (const [skill, grade, level] of [
    ["g4-fracdec", 4, 3],
    ["g8-linear", 8, 3],
    ["g1-time", 1, 2],
  ]) {
    const page = await open(desktop, { grade, skill, level, lang });
    const { groups } = await solutionOf(page);
    await playSet(page, groups[0]);
    await card(page, groups[1][0]).click();
    const midBoard = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    ok(
      midBoard.violations.length === 0,
      `axe (${lang}, ${skill}, mid-board): ${JSON.stringify(midBoard.violations.map((v) => [v.id, v.nodes.slice(0, 2).map((n) => n.html.slice(0, 80))]))}`,
    );
    for (const group of groups.slice(1))
      for (const id of group)
        if ((await card(page, id).getAttribute("data-state")) === "down")
          await card(page, id).click();
    const done = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    ok(
      done.violations.length === 0,
      `axe (${lang}, ${skill}, finished): ${JSON.stringify(done.violations.map((v) => v.id))}`,
    );
    await page.close();
  }
}
console.log(
  `[${((Date.now() - started) / 1000).toFixed(0)}s]`,
  "PASS axe-core finds no wcag2a/aa violations in English or Spanish",
);

// ---- screenshots for the record -----------------------------------------------------------------------------------------------------------------
for (const [width, lang] of [
  [1440, "en"],
  [768, "en"],
  [375, "en"],
  [375, "es"],
  [1440, "es"],
]) {
  const context = await h.context({ width, height: 900 });
  const page = await open(context, { grade: 3, skill: "g3-fraction", level: 3, lang });
  const { groups } = await solutionOf(page);
  await playSet(page, groups[0]);
  await card(page, groups[1][0]).click();
  await page.screenshot({ path: `${SHOTS}/board-${width}-${lang}.png`, fullPage: true });
  await context.close();
}

assertClean(h.problems, "math-match");
await h.close();
console.log(
  `PASS math-match acceptance: ${checks} checks in ${((Date.now() - started) / 1000).toFixed(0)}s`,
);
