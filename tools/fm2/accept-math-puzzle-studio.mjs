// Acceptance suite for Math Puzzle Studio (game 9) against the real play.html: real clicks, taps, drags, typing and key
// presses on the board, never window.__fm2.submit. The test seam is used only to read the round and its own solution
// (solve()), which a helper turns into tile placements and scale moves that the suite then plays out through the page.
// Screenshots land in /tmp/claude-501/fm2-shots/math-puzzle-studio/.
// @fm2 FM-015 FM-078 FM-020 FM-021 FM-026 FM-037 FM-038 FM-039 FM-040
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { assertClean, hasOverflow, launch } from "./harness.mjs";

const SHOTS = "/tmp/claude-501/fm2-shots/math-puzzle-studio";
mkdirSync(SHOTS, { recursive: true });
let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

const h = await launch();
const started = Date.now();
const GAME = "math-puzzle-studio";
// One entry per skill, covering every board: bond, scales, grids, triangle, cages, pairs, expressions, equation scales.
const PLAN = [
  [0, "bond-parts"],
  [0, "balance-same"],
  [1, "equal-sign"],
  [1, "missing-addend"],
  [2, "grid-sums"],
  [2, "magic-triangle"],
  [3, "magic-square"],
  [3, "factor-grid"],
  [4, "kenken"],
  [4, "factor-pairs"],
  [5, "target-ops"],
  [5, "equal-forms"],
  [6, "scale-onestep"],
  [6, "inequality-scale"],
  [7, "scale-twostep"],
  [7, "equiv-expr"],
  [8, "scale-system"],
  [8, "scale-both-sides"],
  [8, "pythag-squares"],
];

async function open(context, params) {
  const page = await context.newPage();
  await page.goto(h.play({ game: GAME, rounds: 5, seed: 7, lang: "en", ...params }));
  await page.waitForSelector(".pz");
  return page;
}
const roundOf = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__fm2.round)));
const solutionOf = (page) => page.evaluate(() => window.__fm2.solve());
const feedback = (page) => page.locator("[data-fm2-feedback]").innerText();
const hintText = (page) => page.locator("[data-fm2-hintbox]").innerText();
const act = (locator, how) => (how === "tap" ? locator.tap() : locator.click());

// Set the move amount of an equation scale: by typing, or (touch) by tapping the more and less buttons.
async function setAmount(page, n, how) {
  if (how !== "tap") return page.fill("[data-pz-amt]", String(n));
  let now = Number(await page.inputValue("[data-pz-amt]"));
  while (now < n) {
    await act(page.locator("[data-pz-more]"), how);
    now += 1;
  }
  while (now > n) {
    await act(page.locator("[data-pz-less]"), how);
    now -= 1;
  }
}
async function playMoves(page, moves, how) {
  for (const m of moves) {
    await act(page.locator(`[data-pz-pans="${m.side}"]`), how);
    await setAmount(page, m.n, how);
    await act(
      page.locator(m.op === "split" ? "[data-pz-split]" : `[data-pz-take="${m.what}"]`),
      how,
    );
  }
}
// Translate the round's solution into UI actions: pick up each tile, then tap its spot; or play the scale moves.
async function enterSolution(page, how = "click") {
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  if (round.kind === "scale") await playMoves(page, sol.moves, how);
  else {
    for (let i = 0; i < round.cells.length; i += 1) {
      if (!sol.put[i]) continue;
      await act(page.locator(`[data-pz-tile="${sol.put[i]}"]`), how);
      await act(page.locator(`[data-pz-slot="${i}"]`), how);
    }
  }
  return sol;
}
async function solveByUi(page, how = "click") {
  await enterSolution(page, how);
  await act(page.locator("[data-pz-check]"), how);
}
async function assertSolved(page, label) {
  await page.waitForFunction(() =>
    /Correct!|¡Correcto!/.test(document.querySelector("[data-fm2-feedback]")?.textContent || ""),
  );
  ok(
    await page.locator("[data-fm2-next]").isVisible(),
    `${label}: Next appears after the board is solved`,
  );
}
// A complete but wrong board: the solution with one tile changed to one that breaks a clue (found with the pure check()).
async function wrongPut(page) {
  return page.evaluate(() => {
    const { round, game } = window.__fm2;
    const sol = game.solve(round).put;
    for (let i = 0; i < sol.length; i += 1) {
      if (!sol[i]) continue;
      for (const tile of round.pool) {
        if (tile.id === sol[i] || (round.cells[i].type && round.cells[i].type !== tile.kind))
          continue;
        const put = [...sol];
        put[i] = tile.id;
        if (!round.reuse && new Set(put.filter(Boolean)).size !== put.filter(Boolean).length)
          continue;
        if (!game.check(round, { put }).correct) return put;
      }
    }
    for (let i = 0; i < sol.length; i += 1) {
      for (let j = i + 1; j < sol.length; j += 1) {
        if (!sol[i] || !sol[j] || sol[i] === sol[j]) continue;
        const put = [...sol];
        [put[i], put[j]] = [put[j], put[i]];
        if (
          round.cells.some(
            (c, k) => c.type && put[k] && c.type !== round.pool.find((t) => t.id === put[k]).kind,
          )
        )
          continue;
        if (!game.check(round, { put }).correct) return put;
      }
    }
    return null;
  });
}
async function enterWrong(page) {
  const round = await roundOf(page);
  if (round.kind === "scale") return; // an unfinished scale is already a wrong answer
  const put = await wrongPut(page);
  ok(put, "a wrong board exists for this round");
  for (let i = 0; i < put.length; i += 1) {
    if (!put[i]) continue;
    await page.locator(`[data-pz-tile="${put[i]}"]`).click();
    await page.locator(`[data-pz-slot="${i}"]`).click();
  }
}

// Presses Tab (or Shift+Tab) until the focused element matches; proves a control is reachable from the keyboard alone.
async function tabTo(page, selector) {
  const here = () => page.evaluate((s) => Boolean(document.activeElement?.matches(s)), selector);
  for (const key of ["Tab", "Shift+Tab"]) {
    for (let i = 0; i < 80; i += 1) {
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
        return (
          r.width > 0 && r.height > 0 && !e.closest("[hidden]") && (r.width < 44 || r.height < 44)
        );
      })
      .map(
        (e) =>
          `${e.tagName}:${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 24)}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`,
      ),
  );

// ---- 1. opens at several grades with no errors; "How to play" in both languages -------------------------------------
const desktop = await h.context({ width: 1440, height: 900 });
for (const [grade, skill] of [
  [0, "bond-parts"],
  [3, "magic-square"],
  [6, "scale-onestep"],
  [8, "scale-system"],
]) {
  const page = await open(desktop, { grade, skill, level: 2 });
  ok(
    (await page.locator("h1").first().innerText()) === "Math Puzzle Studio",
    `grade ${grade}: title`,
  );
  ok(
    (await page.locator("[data-fm2-prompt]").innerText()).length > 20,
    `grade ${grade}: a prompt is shown`,
  );
  ok(
    (await page.locator(".pz-tile, .pz-moves button").count()) > 2,
    `grade ${grade}: the board has controls`,
  );
  await page.screenshot({ path: `${SHOTS}/grade${grade}-1440.png`, fullPage: true });
  await page.close();
}
assertClean(h.problems, "opening at grades 0, 3, 6, 8");
console.log("PASS opens at grades 0, 3, 6 and 8 with no console, network or page errors");

{
  const page = await open(desktop, { grade: 3, skill: "magic-square" });
  await page.click("[data-fm2-howto]");
  const steps = page.locator("[data-fm2-howto-steps] li");
  ok(
    (await steps.count()) >= 3 && (await steps.first().isVisible()),
    "How to play: steps are visible",
  );
  ok((await steps.first().innerText()).includes("Read the puzzle"), "How to play: English steps");
  await page.click("[data-fm2-dialog-close]");
  await page.click("[data-fm2-lang]");
  await page.click("[data-fm2-howto]");
  ok(
    (await page.locator("[data-fm2-howto-steps] li").first().innerText()).includes("Lee el reto"),
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

// ---- 3. one real interaction per skill: tiles into spots, scale moves, every board ---------------------------------------
for (const [grade, skill] of PLAN) {
  const page = await open(desktop, { grade, skill, level: 2 });
  await solveByUi(page);
  await assertSolved(page, skill);
  ok(/Correct!/.test(await feedback(page)), `${skill}: shell shows Correct!`);
  ok(await page.locator("[data-pz-check]").isDisabled(), `${skill}: the board locks once solved`);
  await page.close();
}
assertClean(h.problems, "one round of every skill");
console.log(
  `PASS solved a round of all ${PLAN.length} skills through the interface (tiles, scales, grids, cages, equation moves)`,
);

// ---- 4. a wrong answer gives named feedback and no Next; then correct it through the UI ------------------------------------
for (const [grade, skill] of [
  [0, "bond-parts"],
  [1, "equal-sign"],
  [2, "grid-sums"],
  [3, "magic-square"],
  [4, "kenken"],
  [5, "target-ops"],
  [6, "scale-onestep"],
  [7, "equiv-expr"],
  [8, "scale-system"],
  [8, "pythag-squares"],
]) {
  const page = await open(desktop, { grade, skill, level: 2 });
  await enterWrong(page);
  await page.click("[data-pz-check]");
  await page.waitForFunction(() =>
    /Not yet/.test(document.querySelector("[data-fm2-feedback]")?.textContent || ""),
  );
  ok(
    !(await page.locator("[data-fm2-next]").isVisible()),
    `${skill}: no Next after a wrong answer`,
  );
  ok(
    (await feedback(page)).length > 40,
    `${skill}: the feedback says what to check (${(await feedback(page)).slice(0, 70)})`,
  );
  ok(
    !(await page.locator("[data-pz-check]").isDisabled()),
    `${skill}: the board stays open after a miss`,
  );
  await page.click("[data-pz-clear]");
  await solveByUi(page);
  await assertSolved(page, `${skill} corrected`);
  await page.close();
}
console.log(
  "PASS wrong answers show feedback and no Next, then succeed after correcting through the UI",
);

// ---- 5. hint tiers and the Show me path ---------------------------------------------------------------------------------------
for (const [grade, skill] of [
  [2, "grid-sums"],
  [7, "scale-twostep"],
]) {
  const page = await open(desktop, { grade, skill });
  const seen = [];
  for (let i = 0; i < 3; i += 1) {
    await page.click("[data-fm2-hint]");
    seen.push(await hintText(page));
  }
  ok(new Set(seen).size === 3, `${skill}: three hint tiers show three different texts`);
  ok(
    await page.locator("[data-fm2-hint]").isDisabled(),
    `${skill}: the hint button is spent after the third tier`,
  );
  const answer = await page.evaluate(() => window.__fm2.game.answerText(window.__fm2.round));
  ok(
    !seen.some((text) => text.replace(/^Hint \d+\s*/, "").includes(answer)),
    `${skill}: tiers 0-2 do not print the answer`,
  );
  await enterWrong(page);
  for (let i = 0; i < 3; i += 1) await page.click("[data-pz-check]");
  ok(
    await page.locator("[data-fm2-showme]").isVisible(),
    `${skill}: Show me appears after three misses`,
  );
  await page.click("[data-fm2-showme]");
  ok(
    (await hintText(page)).includes(answer),
    `${skill}: Show me gives the full solution (${answer})`,
  );
  ok(await page.locator("[data-fm2-next]").isVisible(), `${skill}: Next appears after Show me`);
  ok(/worked answer/.test(await feedback(page)), `${skill}: the shell says the answer was shown`);
  ok(
    (await page.locator("[data-pz-check]").isDisabled()) &&
      (await page.locator("[data-pz-tile], [data-pz-take]").first().isDisabled()),
    `${skill}: the board locks after Show me`,
  );
  await page.close();
}
console.log("PASS hint tiers differ, Show me appears after three misses and states the solution");

// ---- 6. Reset, Start over, a five-round activity, stars, stored record, a second profile --------------------------------------
{
  const page = await open(desktop, { grade: 3, skill: "magic-square" });
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  const first = round.cells.findIndex((_, i) => sol.put[i]);
  await page.click(`[data-pz-tile="${sol.put[first]}"]`);
  await page.click(`[data-pz-slot="${first}"]`);
  ok(await page.locator(`[data-pz-slot="${first}"].is-filled`).count(), "a tile is on the board");
  await page.click("[data-fm2-reset]");
  ok(
    (await page.locator(".pz-slot.is-filled").count()) === 0,
    "Reset this puzzle empties the board",
  );
  await page.click(`[data-pz-tile="${sol.put[first]}"]`);
  await page.click(`[data-pz-slot="${first}"]`);
  await page.click("[data-pz-undo]");
  ok((await page.locator(".pz-slot.is-filled").count()) === 0, "Undo takes back the last tile");
  await page.click(`[data-pz-tile="${sol.put[first]}"]`);
  await page.click(`[data-pz-slot="${first}"]`);
  await page.click(`[data-pz-slot="${first}"]`);
  ok(
    (await page.locator(".pz-slot.is-filled").count()) === 0,
    "tapping a placed tile takes it back",
  );
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
  const page = await open(clean, { grade: 0, skill: "bond-parts", level: 1 });
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
    stored.skills[`${GAME}:bond-parts`]?.plays === 5,
    `localStorage ewl-fm2-v1 holds 5 plays of the skill (${JSON.stringify(stored.skills[`${GAME}:bond-parts`])})`,
  );
  ok(
    stored.games[GAME]?.completed === 1 && stored.games[GAME].bestStars === 3,
    "the activity is recorded as completed with 3 stars",
  );
  const other = await clean.newPage();
  await other.goto(
    h.play({ game: GAME, grade: 0, skill: "bond-parts", profile: 1, seed: 7, lang: "en" }),
  );
  await other.waitForSelector(".pz");
  const second = await other.evaluate(() =>
    JSON.parse(localStorage.getItem("ewl-fm2-v1:profile-1") || "{}"),
  );
  ok(!second.skills?.[`${GAME}:bond-parts`], "a second profile has no record of that skill");
  const first = await other.evaluate(
    (key) => JSON.parse(localStorage.getItem("ewl-fm2-v1")).skills[key].plays,
    `${GAME}:bond-parts`,
  );
  ok(first === 5, "the first profile's record is untouched");
  await other.close();
  await page.close();
  await clean.close();
}
console.log(
  "PASS Reset, Undo, Start over, a 5-round activity with stars, the stored record, and a separate second profile",
);

// ---- 7. leave and return: resume restores the same round and earlier results ------------------------------------------------
{
  const page = await open(desktop, { grade: 7, skill: "scale-twostep", seed: 21 });
  await solveByUi(page);
  await assertSolved(page, "resume setup round 1");
  await page.click("[data-fm2-next]");
  await solveByUi(page);
  await assertSolved(page, "resume setup round 2");
  await page.click("[data-fm2-next]");
  const before = await page.evaluate(() => window.__fm2.round.prompt.en);
  await page.goto(
    h.play({ game: GAME, grade: 7, skill: "scale-twostep", seed: 21, lang: "en", resume: 1 }),
  );
  await page.waitForSelector(".pz");
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

// ---- 8. language switch keeps the work; labels change ----------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 3, skill: "magic-square", seed: 3 });
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  const cells = round.cells.flatMap((_, i) => (sol.put[i] ? [i] : []));
  for (const i of cells.slice(0, 2)) {
    await page.click(`[data-pz-tile="${sol.put[i]}"]`);
    await page.click(`[data-pz-slot="${i}"]`);
  }
  const labelEn = await page.locator(`[data-pz-slot="${cells[0]}"]`).getAttribute("aria-label");
  await page.click("[data-fm2-lang]");
  const labelEs = await page.locator(`[data-pz-slot="${cells[0]}"]`).getAttribute("aria-label");
  ok(labelEn !== labelEs && /Fila/.test(labelEs), `spot labels switch to Spanish (${labelEs})`);
  ok(
    (await page.locator(".pz-slot.is-filled").count()) === 2,
    "the tiles already placed remain after the switch",
  );
  ok(
    /Comprobar/.test(await page.locator("[data-pz-check]").innerText()) &&
      /Fichas/.test((await page.locator(".pz-tray").getAttribute("aria-label")) || ""),
    "the board buttons and tray are in Spanish",
  );
  ok(
    /Cada fila/.test(await page.locator(".pz-note").innerText()),
    "the magic sum note is in Spanish",
  );
  for (const i of cells.slice(2)) {
    await page.click(`[data-pz-tile="${sol.put[i]}"]`);
    await page.click(`[data-pz-slot="${i}"]`);
  }
  await page.click("[data-pz-check]");
  await page.waitForFunction(() =>
    /¡Correcto!/.test(document.querySelector("[data-fm2-feedback]")?.textContent || ""),
  );
  await page.click("[data-fm2-lang]");
  ok(
    /Check/.test(await page.locator("[data-pz-check]").innerText()) &&
      /Correct!/.test(await feedback(page)),
    "switching back restores English labels",
  );
  await page.close();
}
{
  const page = await open(desktop, { grade: 6, skill: "scale-onestep", level: 2, seed: 5 });
  const sol = await solutionOf(page);
  await playMoves(page, sol.moves.slice(0, 1), "click");
  const history = await page.locator(".pz-history li").first().innerText();
  await page.click("[data-fm2-lang]");
  const historyEs = await page.locator(".pz-history li").first().innerText();
  ok(
    history !== historyEs && /Quitaste|Dividiste/.test(historyEs),
    `the move history switches to Spanish and is kept (${historyEs})`,
  );
  ok(
    /balanza|equilibrada/i.test(await page.locator(".pz-reading").innerText()),
    "the scale reading is in Spanish",
  );
  await page.screenshot({ path: `${SHOTS}/scale-onestep-es-1440.png`, fullPage: true });
  await page.click("[data-fm2-lang]");
  await playMoves(page, sol.moves.slice(1), "click");
  await page.click("[data-pz-check]");
  await assertSolved(page, "scale after a language switch");
  await page.close();
}
{
  const page = await open(desktop, { grade: 7, skill: "equiv-expr", level: 2, seed: 4 });
  const before = await page.locator("[data-pz-xval]").innerText();
  await page.click("[data-pz-xup]");
  ok(
    (await page.locator("[data-pz-xval]").innerText()) !== before,
    "the x button changes the sample weight",
  );
  await page.click("[data-fm2-lang]");
  ok(
    /Peso de x/.test(await page.locator(".pz-xstep").innerText()),
    "the x stepper is relabelled in Spanish",
  );
  await page.screenshot({ path: `${SHOTS}/equiv-es-1440.png`, fullPage: true });
  await page.close();
}
console.log(
  "PASS language switch relabels the board and keeps placed tiles, scale moves and the x weight",
);

// ---- the scale tells the truth in the page: the reading and the tilt match the pans ------------------------------------------------
{
  const page = await open(desktop, { grade: 1, skill: "balance-same", level: 2, seed: 8 });
  const round = await roundOf(page);
  const cell = round.cells.findIndex((c) => c.v === null);
  const left = round.scales[0].l.reduce((s, t) => s + (t.v ?? 0), 0);
  const right = round.scales[0].r.reduce((s, t) => s + (t.v ?? 0), 0);
  const slotOnLeft = round.scales[0].l.some((t) => "c" in t);
  for (const tile of round.pool.slice(0, 4)) {
    await page.click(`[data-pz-tile="${tile.id}"]`);
    await page.click(`[data-pz-slot="${cell}"]`);
    const l = left + (slotOnLeft ? tile.v : 0);
    const r = right + (slotOnLeft ? 0 : tile.v);
    const want =
      l === r
        ? "The scale balances."
        : `${l > r ? "Left" : "Right"} is heavier by ${Math.abs(l - r)}.`;
    ok(
      (await page.locator("[data-pz-reading]").innerText()) === want,
      `the reading with ${tile.v} says "${want}"`,
    );
    const tilt = Number(await page.locator("[data-pz-scale]").getAttribute("data-tilt"));
    ok(
      Math.sign(tilt) === Math.sign(l - r),
      `the beam tilts toward the heavier pan (${tilt}deg for ${l} against ${r})`,
    );
    await page.click(`[data-pz-slot="${cell}"]`);
  }
  await page.close();
}
console.log("PASS the scale's written reading and beam tilt match the weights on the pans");

// ---- 9. mobile touch, overflow, 44px targets ---------------------------------------------------------------------------------------
const phone = await h.context({ width: 375, height: 800, touch: true });
for (const [grade, skill, level] of [
  [0, "bond-parts", 1],
  [1, "equal-sign", 1],
  [2, "magic-triangle", 1],
  [3, "factor-grid", 1],
  [4, "kenken", 1],
  [5, "target-ops", 1],
  [6, "scale-onestep", 1],
  [8, "scale-system", 1],
]) {
  const page = await open(phone, { grade, skill, level });
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
  for (const [grade, skill] of PLAN) {
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
  const page = await open(phone, { grade: 7, skill: "scale-twostep", lang: "es", level: 1 });
  await enterSolution(page, "tap");
  await page.screenshot({ path: `${SHOTS}/scale-twostep-es-375.png`, fullPage: true });
  await page.close();
}
console.log(
  "PASS touch taps solve rounds at 375px; no overflow at 320, 375, 768 and 1440; every stage control is 44px",
);

// ---- 10. keyboard only: Tab to a control, Enter or Space to use it, arrows between spots, Backspace to clear -------------------------
{
  const page = await open(desktop, { grade: 3, skill: "magic-square", seed: 13 });
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  const cells = round.cells.flatMap((_, i) => (sol.put[i] ? [i] : []));
  // arrow keys move between spots by where they are on the screen; Backspace clears
  await tabTo(page, `[data-pz-slot="${cells[0]}"]`);
  await page.keyboard.press("ArrowRight");
  const afterRight = await page.evaluate(() => Number(document.activeElement.dataset.pzSlot));
  ok(
    Number.isInteger(afterRight) && afterRight !== cells[0],
    `ArrowRight moves to another spot (${cells[0]} -> ${afterRight})`,
  );
  await page.keyboard.press("ArrowDown");
  const afterDown = await page.evaluate(() => document.activeElement.getBoundingClientRect().top);
  const topRight = await page.evaluate(
    (i) => document.querySelector(`[data-pz-slot="${i}"]`)?.getBoundingClientRect().top ?? 0,
    afterRight,
  );
  ok(afterDown > topRight, "ArrowDown moves to a spot lower on the board");
  await tabTo(page, `[data-pz-tile="${sol.put[cells[0]]}"]`);
  await page.keyboard.press("Enter");
  ok(
    (await page.locator(`[data-pz-tile="${sol.put[cells[0]]}"]`).getAttribute("aria-pressed")) ===
      "true",
    "Enter picks up a tile",
  );
  await tabTo(page, `[data-pz-slot="${cells[0]}"]`);
  await page.keyboard.press("Space");
  ok(
    await page.locator(`[data-pz-slot="${cells[0]}"].is-filled`).count(),
    "Space places the tile in the focused spot",
  );
  await page.keyboard.press("Backspace");
  ok((await page.locator(".pz-slot.is-filled").count()) === 0, "Backspace clears the focused spot");
  for (const i of cells) {
    await tabTo(page, `[data-pz-tile="${sol.put[i]}"]`);
    await page.keyboard.press("Enter");
    await tabTo(page, `[data-pz-slot="${i}"]`);
    await page.keyboard.press("Enter");
  }
  await tabTo(page, "[data-pz-check]");
  await page.keyboard.press("Enter");
  await assertSolved(page, "keyboard-only magic square");
  await page.close();
}
{
  const page = await open(desktop, { grade: 5, skill: "target-ops", level: 1, seed: 6 });
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  for (let i = 0; i < round.cells.length; i += 1) {
    await tabTo(page, `[data-pz-tile="${sol.put[i]}"]`);
    await page.keyboard.press("Space");
    await tabTo(page, `[data-pz-slot="${i}"]`);
    await page.keyboard.press("Space");
  }
  ok(
    /makes/.test(await page.locator("[data-pz-result]").innerText()),
    "a filled expression shows what it makes",
  );
  await tabTo(page, "[data-pz-check]");
  await page.keyboard.press("Enter");
  await assertSolved(page, "keyboard-only expression");
  await page.close();
}
{
  const page = await open(desktop, { grade: 7, skill: "scale-twostep", level: 2, seed: 9 });
  const sol = await solutionOf(page);
  for (const m of sol.moves) {
    await tabTo(page, `[data-pz-pans="${m.side}"]`);
    await page.keyboard.press("Enter");
    await tabTo(page, "[data-pz-amt]");
    await page.keyboard.press("End");
    for (let k = 0; k < 3; k += 1) await page.keyboard.press("Backspace");
    await page.keyboard.type(String(m.n));
    await tabTo(page, m.op === "split" ? "[data-pz-split]" : `[data-pz-take="${m.what}"]`);
    await page.keyboard.press("Enter");
  }
  ok(
    /balances/.test(await page.locator(".pz-reading").innerText()),
    "legal moves keep the scale balanced",
  );
  await tabTo(page, "[data-pz-check]");
  await page.keyboard.press("Enter");
  await assertSolved(page, "keyboard-only equation scale");
  await page.close();
}
{
  const page = await open(desktop, { grade: 0, skill: "bond-parts", level: 1, seed: 2 });
  const sol = await solutionOf(page);
  const i = sol.put.findIndex(Boolean);
  await page.dragAndDrop(`[data-pz-tile="${sol.put[i]}"]`, `[data-pz-slot="${i}"]`);
  ok(
    await page.locator(`[data-pz-slot="${i}"].is-filled`).count(),
    "a tile can also be dragged onto a spot",
  );
  await act(page.locator("[data-pz-check]"), "click");
  await assertSolved(page, "drag and drop");
  await page.close();
}
console.log(
  "PASS tiles, spots and scale moves are all completed with the keyboard alone; drag and drop works too",
);

// ---- 11. axe-core, both languages --------------------------------------------------------------------------------------------------
for (const lang of ["en", "es"]) {
  for (const [grade, skill, level] of [
    [0, "bond-parts", 1],
    [1, "equal-sign", 2],
    [2, "grid-sums", 2],
    [2, "magic-triangle", 2],
    [4, "kenken", 2],
    [5, "target-ops", 3],
    [5, "equal-forms", 2],
    [6, "scale-onestep", 2],
    [6, "inequality-scale", 3],
    [7, "equiv-expr", 2],
    [8, "scale-system", 2],
    [8, "pythag-squares", 2],
  ]) {
    const page = await open(desktop, { grade, skill, level, lang });
    await enterSolution(page);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    ok(
      result.violations.length === 0,
      `axe (${lang}, ${skill}): ${JSON.stringify(result.violations.map((v) => [v.id, v.nodes.slice(0, 2).map((n) => n.html.slice(0, 120))]))}`,
    );
    await page.click("[data-pz-check]");
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

// ---- screenshots for the visual review -----------------------------------------------------------------------------------------------
for (const [name, width, params] of [
  ["kenken-1440", 1440, { grade: 4, skill: "kenken", level: 3 }],
  ["balance-768", 768, { grade: 1, skill: "equal-sign", level: 2 }],
  ["system-es-375", 375, { grade: 8, skill: "scale-system", level: 2, lang: "es" }],
  ["factor-es-768", 768, { grade: 3, skill: "factor-grid", level: 2, lang: "es" }],
  ["forms-375", 375, { grade: 6, skill: "equal-forms", level: 3 }],
  ["pythag-1440", 1440, { grade: 8, skill: "pythag-squares", level: 3 }],
  ["triangle-es-375", 375, { grade: 2, skill: "magic-triangle", level: 2, lang: "es" }],
]) {
  const context = await h.context({ width, height: 900 });
  const page = await open(context, params);
  await enterSolution(page);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
  await context.close();
}

assertClean(h.problems, "the whole Math Puzzle Studio suite");
await h.close();
console.log(
  `math-puzzle-studio acceptance: ${checks} checks passed in ${Math.round((Date.now() - started) / 1000)}s.`,
);
