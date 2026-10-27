// Acceptance suite for Ratio Recipe Lab (game 8) against the real play.html: real clicks, taps, typing and key presses on the
// workbench (stepper, slider, x/÷ buttons, typed cells), never window.__fm2.submit. The only use of the test seam is reading the
// round's own solution (solve()) to know which batch and amounts to enter, which the suite then plays out through the interface.
// Screenshots land in /tmp/claude-501/fm2-shots/ratio-recipe-lab/.
// @fm2 FM-077 FM-038 FM-039 FM-040 FM-037 FM-020 FM-021 FM-026
// biome-ignore-all format: dense script, one assertion per line
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { assertClean, hasOverflow, launch } from "./harness.mjs";

const SHOTS = "/tmp/claude-501/fm2-shots/ratio-recipe-lab";
mkdirSync(SHOTS, { recursive: true });
let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

const h = await launch();
const started = Date.now();
const GAME = "ratio-recipe-lab";
const PLAN = [
  [0, "bowls-groups"], [0, "more-fewer"], [0, "share-bowls"], [1, "double-half"], [2, "repeat-batch"], [3, "times-as-many"],
  [3, "scale-whole"], [4, "table-100"], [4, "fraction-batch"], [5, "fraction-scale"], [5, "graph-pairs"], [6, "equiv-ratios"],
  [6, "unit-rate"], [6, "percent-per-100"], [6, "constant-speed"], [6, "stronger-mix"], [7, "const-k"], [7, "equation-ykx"],
  [7, "scale-drawing"], [7, "percent-prop"], [8, "line-origin"], [8, "compare-rates"], [8, "direct-variation"],
];

async function open(context, params) {
  const page = await context.newPage();
  await page.goto(h.play({ game: GAME, rounds: 5, seed: 7, lang: "en", ...params }));
  await page.waitForSelector(".rl");
  return page;
}
const roundOf = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__fm2.round)));
const solutionOf = (page) => page.evaluate(() => window.__fm2.solve());
const feedback = (page) => page.locator("[data-fm2-feedback]").innerText();
const hintText = (page) => page.locator("[data-fm2-hintbox]").innerText();

// ---- exact fractions for planning a button path ----------------------------------------------------------------------------
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const fr = (n, d = 1) => { const g = gcd(n, d) || 1; return d < 0 ? [-n / g, -d / g] : [n / g, d / g]; };
const frParse = (text) => {
  const t = text.trim();
  let m = /^(\d+) (\d+)\/(\d+)$/.exec(t);
  if (m) return fr(Number(m[1]) * Number(m[3]) + Number(m[2]), Number(m[3]));
  m = /^(\d+)\/(\d+)$/.exec(t);
  if (m) return fr(Number(m[1]), Number(m[2]));
  m = /^(\d+)\.(\d+)$/.exec(t);
  if (m) return fr(Number(m[1] + m[2]), 10 ** m[2].length);
  return fr(Number(t), 1);
};
const key = ([n, d]) => `${n}/${d}`;
const frAdd = (a, b) => fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const frMul = (a, b) => fr(a[0] * b[0], a[1] * b[1]);
const frCmp = (a, b) => Math.sign(a[0] * b[1] - b[0] * a[1]);

// Breadth-first search over the buttons (+, -, x/÷) from the current batch to the target: the fewest presses.
function plan(start, target, step, mults, max, only = null) {
  const moves = [["inc", (v) => frAdd(v, step)], ["dec", (v) => frAdd(v, [-step[0], step[1]])]];
  if (!only) for (const m of mults) moves.push([`mult:${key(m)}`, (v) => (v[0] === 0 ? m : frMul(v, m))]);
  const seen = new Map([[key(start), []]]);
  let frontier = [start];
  for (let depth = 0; depth < 60 && frontier.length; depth += 1) {
    const next = [];
    for (const v of frontier) {
      if (key(v) === key(target)) return seen.get(key(v));
      for (const [name, move] of moves) {
        const w = move(v);
        if (w[0] < 0 || frCmp(w, max) > 0 || seen.has(key(w))) continue;
        seen.set(key(w), [...seen.get(key(v)), name]);
        next.push(w);
      }
    }
    frontier = next;
  }
  return seen.get(key(target)) ?? null;
}

// Sets the batch through the interface. mode: "type" (the number box), "steps" (-/+ and x/÷ buttons), "keys" (arrow keys in the box).
async function setBatch(page, col, text, mode, how = "click") {
  if (mode === "type") {
    await page.fill("[data-rl-batch]", text);
    return [];
  }
  const start = frParse(await page.inputValue("[data-rl-batch]"));
  const mults = (await page.locator("[data-rl-mult]").evaluateAll((els) => els.map((e) => e.dataset.rlMult))).map((m) => frParse(m));
  const path = plan(start, frParse(text), fr(col.step.n, col.step.d), mults, fr(col.max.n, col.max.d), mode === "keys" ? "keys" : null);
  ok(path !== null && path.length < 60, `a button path exists from ${key(start)} to ${text}`);
  if (mode === "keys") await page.focus("[data-rl-batch]");
  for (const move of path) {
    if (mode === "keys") await page.keyboard.press(move === "inc" ? "ArrowUp" : "ArrowDown");
    else if (move === "inc") await page.locator("[data-rl-inc]")[how]();
    else if (move === "dec") await page.locator("[data-rl-dec]")[how]();
    else await page.locator(`[data-rl-mult="${move.split(":")[1]}"]`)[how]();
  }
  return path;
}

// Translates the round's solution into workbench actions: choose each batch, type each amount, answer extras, pick, check.
async function enterSolution(page, { mode = "type", how = "click", submit = false } = {}) {
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  for (let ci = 0; ci < round.cols.length; ci += 1) {
    if (round.cols.length > 1) await page.locator(`[data-rl-col="${ci}"]`)[how]();
    await setBatch(page, round.cols[ci], sol.cols[ci].batch, mode, how);
    ok((await page.inputValue("[data-rl-batch]")).length > 0, "the batch box shows the chosen batch");
    for (const [k, text] of Object.entries(sol.cols[ci].values)) await page.fill(`[data-rl-field="${ci}:${k}"]`, text);
  }
  for (const [k, text] of Object.entries(sol.extra)) await page.fill(`[data-rl-extra="${k}"]`, text);
  if (sol.pick !== null) await page.locator(`[data-rl-pick="${sol.pick}"]`)[how]();
  if (submit) await page.locator("[data-rl-submit]")[how]();
  return { round, sol };
}
async function assertSolved(page, label) {
  await page.waitForFunction(() => /Correct!|¡Correcto!/.test(document.querySelector("[data-fm2-feedback]")?.textContent || ""));
  ok(await page.locator("[data-fm2-next]").isVisible(), `${label}: Next appears after the workbench is solved`);
}
const solveByUi = (page, options) => enterSolution(page, { ...options, submit: true });

// A deliberately wrong answer entered through the interface: an amount that is off, a wrong option, or a batch one step too big.
async function enterWrong(page) {
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  const asked = round.cols[0].ask;
  await enterSolution(page);
  if (asked.length) {
    const k = asked[0];
    const right = sol.cols[0].values[k];
    const bad = right.includes("/") ? "999" : String(Number.parseFloat(right) + 7);
    if (round.cols.length > 1) await page.locator('[data-rl-col="0"]').click();
    await page.fill(`[data-rl-field="0:${k}"]`, bad);
  } else if (round.pick) await page.locator(`[data-rl-pick="${1 - sol.pick}"]`).click();
  else {
    if (round.cols.length > 1) await page.locator('[data-rl-col="0"]').click();
    await page.click("[data-rl-inc]");
  }
  return { round, sol };
}

async function tabTo(page, selector) {
  const here = () => page.evaluate((s) => Boolean(document.activeElement?.matches(s)), selector);
  for (const k of ["Tab", "Shift+Tab"]) {
    for (let i = 0; i < 80; i += 1) {
      if (await here()) return;
      await page.keyboard.press(k);
    }
  }
  throw new Error(`could not reach ${selector} by keyboard`);
}
const stageSmallTargets = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[data-fm2-stage] button, [data-fm2-stage] input, [data-fm2-stage] a[href]")]
      .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44); })
      .map((e) => `${e.tagName}:${(e.textContent || e.dataset.rlField || "").trim().slice(0, 20)}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`),
  );

// ---- 1. opens at several grades with no errors; 2. "How to play" in both languages ----------------------------------------------
const desktop = await h.context({ width: 1440, height: 900 });
for (const [grade, skill] of [[0, "bowls-groups"], [3, "scale-whole"], [6, "unit-rate"], [8, "compare-rates"]]) {
  const page = await open(desktop, { grade, skill, level: 2 });
  ok((await page.locator("h1").first().innerText()) === "Ratio Recipe Lab", `grade ${grade}: title`);
  ok((await page.locator("[data-fm2-prompt]").innerText()).length > 20, `grade ${grade}: a prompt is shown`);
  ok((await page.locator(".rl-table th, .rl-table td").count()) > 3 && (await page.locator("[data-rl-batch]").count()) === 1 && (await page.locator("[data-rl-slider]").count()) === 1, `grade ${grade}: the workbench shows a table, a batch box and a slider`);
  await page.screenshot({ path: `${SHOTS}/grade${grade}-1440.png`, fullPage: true });
  await page.close();
}
assertClean(h.problems, "opening at grades 0, 3, 6, 8");
console.log("PASS opens at grades 0, 3, 6 and 8 with no console, network or page errors");

{
  const page = await open(desktop, { grade: 3, skill: "scale-whole" });
  await page.click("[data-fm2-howto]");
  const steps = page.locator("[data-fm2-howto-steps] li");
  ok((await steps.count()) >= 3 && (await steps.first().isVisible()), "How to play: steps are visible");
  ok((await steps.first().innerText()).includes("Read the table"), "How to play: English steps");
  await page.click("[data-fm2-dialog-close]");
  await page.click("[data-fm2-lang]");
  await page.click("[data-fm2-howto]");
  ok((await page.locator("[data-fm2-howto-steps] li").first().innerText()).includes("Lee la tabla"), "How to play: Spanish steps");
  ok((await page.locator("[data-fm2-howto-steps] li").count()) === (await steps.count()), "How to play: same number of steps in both languages");
  await page.click("[data-fm2-dialog-close]");
  await page.close();
}
console.log("PASS How to play shows its steps in English and Spanish");

// ---- 3. one real interaction per skill, rotating the ways of setting a batch ------------------------------------------------------
const MODES = ["type", "steps", "keys"];
let n = 0;
const used = { type: 0, steps: 0, keys: 0 };
for (const [grade, skill] of PLAN) {
  const mode = MODES[n % 3];
  n += 1;
  const page = await open(desktop, { grade, skill, level: 2 });
  await solveByUi(page, { mode });
  await assertSolved(page, `${skill} (${mode})`);
  ok(/Correct!/.test(await feedback(page)), `${skill}: shell shows Correct!`);
  used[mode] += 1;
  await page.close();
}
assertClean(h.problems, "one round of every skill");
console.log(`PASS solved a round of all ${PLAN.length} skills through the interface (typed batch ${used.type}, buttons ${used.steps}, arrow keys ${used.keys})`);

// ---- 3b. several scale paths reach the same answer ------------------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 1, skill: "double-half", level: 2, seed: 11 });
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  const target = sol.cols[0].batch;
  await page.click(target === "2" ? '[data-rl-mult="2/1"]' : '[data-rl-mult="1/2"]');
  ok(frParse(await page.inputValue("[data-rl-batch]")).join("/") === frParse(target).join("/"), "a x2 or ÷2 button lands on the batch");
  for (const [k, text] of Object.entries(sol.cols[0].values)) await page.fill(`[data-rl-field="0:${k}"]`, text);
  await page.click("[data-rl-submit]");
  await assertSolved(page, "button path");
  ok(round.cols.length === 1, "single column");
  const again = await open(desktop, { grade: 1, skill: "double-half", level: 2, seed: 11 });
  await again.fill("[data-rl-batch]", target === "2" ? "4/2" : "2/4");
  for (const [k, text] of Object.entries(sol.cols[0].values)) await again.fill(`[data-rl-field="0:${k}"]`, text);
  await again.click("[data-rl-submit]");
  await assertSolved(again, "typed equivalent fraction");
  await again.close();
  await page.close();
}
console.log("PASS different paths to the same batch (a button, a typed equivalent fraction) are both accepted");

// ---- 4. a wrong answer gives feedback and no Next; then correct it through the UI ----------------------------------------------------
for (const [grade, skill] of [[0, "bowls-groups"], [3, "scale-whole"], [4, "fraction-batch"], [6, "stronger-mix"], [7, "percent-prop"], [8, "direct-variation"], [3, "times-as-many"]]) {
  const page = await open(desktop, { grade, skill, level: skill === "times-as-many" ? 3 : 2 });
  await enterWrong(page);
  await page.click("[data-rl-submit]");
  await page.waitForFunction(() => /Not yet/.test(document.querySelector("[data-fm2-feedback]")?.textContent || ""));
  ok(!(await page.locator("[data-fm2-next]").isVisible()), `${skill}: no Next after a wrong answer`);
  ok((await feedback(page)).length > 40, `${skill}: the feedback says what to check (${(await feedback(page)).slice(0, 70)})`);
  await solveByUi(page);
  await assertSolved(page, `${skill} corrected`);
  await page.close();
}
console.log("PASS wrong answers show named feedback and no Next, then succeed after correcting through the UI");

// ---- 5. hint tiers and the Show me path ----------------------------------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 3, skill: "scale-whole", seed: 5 });
  const seen = [];
  for (let i = 0; i < 3; i += 1) {
    await page.click("[data-fm2-hint]");
    seen.push(await hintText(page));
  }
  ok(new Set(seen).size === 3, "three hint tiers show three different texts");
  ok(await page.locator("[data-fm2-hint]").isDisabled(), "hint button is spent after the third tier");
  const answer = await page.evaluate(() => window.__fm2.game.answerText(window.__fm2.round));
  ok(!seen.some((text) => text.includes(answer)), "tiers 0-2 do not print the answer");
  for (let i = 0; i < 3; i += 1) {
    await page.fill("[data-rl-batch]", String(40 + i));
    await page.click("[data-rl-submit]");
  }
  ok(await page.locator("[data-fm2-showme]").isVisible(), "Show me appears after three misses");
  await page.click("[data-fm2-showme]");
  ok((await hintText(page)).includes(answer), "Show me gives the full solution");
  ok(await page.locator("[data-fm2-next]").isVisible(), "Next appears after Show me");
  ok(/worked answer/.test(await feedback(page)), "the shell says the answer was shown");
  ok((await page.locator("[data-rl-batch]").isDisabled()) && (await page.locator("[data-rl-inc]").isDisabled()), "the workbench locks after Show me");
  await page.close();
}
console.log("PASS hint tiers differ, Show me appears after three misses and states the solution");

// ---- 6. Reset, Start over, a five-round activity, stars, stored record, a second profile -----------------------------------------------
{
  const page = await open(desktop, { grade: 3, skill: "scale-whole", seed: 9 });
  await page.click("[data-rl-inc]");
  await page.click("[data-rl-inc]");
  ok((await page.inputValue("[data-rl-batch]")) === "3", "two presses of + move the batch from 1 to 3");
  await page.click("[data-fm2-reset]");
  ok((await page.inputValue("[data-rl-batch]")) === "1", "Reset this puzzle puts the batch back");
  await solveByUi(page);
  await assertSolved(page, "before start over");
  await page.click("[data-fm2-next]");
  ok(/Round 2 of 5/.test(await page.locator("[data-fm2-round]").innerText()), "Next goes to round 2");
  await page.click("[data-fm2-restart]");
  ok(/Round 1 of 5/.test(await page.locator("[data-fm2-round]").innerText()), "Start over returns to round 1");
  await page.close();
}
{
  const clean = await h.context({ width: 1440, height: 900 });
  const page = await open(clean, { grade: 0, skill: "bowls-groups" });
  for (let i = 0; i < 5; i += 1) {
    await solveByUi(page, { mode: i % 2 ? "steps" : "type" });
    await assertSolved(page, `round ${i + 1}`);
    await page.click("[data-fm2-next]");
  }
  await page.waitForSelector(".fm2-finish:not([hidden])");
  ok(/3 of 3 stars/.test((await page.locator(".fm2-stars").getAttribute("aria-label")) || ""), "the finish screen shows stars");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fm2-v1")));
  ok(stored.skills[`${GAME}:bowls-groups`]?.plays === 5, `localStorage ewl-fm2-v1 holds 5 plays of the skill (${JSON.stringify(stored.skills[`${GAME}:bowls-groups`])})`);
  ok(stored.games[GAME]?.completed === 1 && stored.games[GAME].bestStars === 3, "the activity is recorded as completed with 3 stars");
  const other = await clean.newPage();
  await other.goto(h.play({ game: GAME, grade: 0, skill: "bowls-groups", profile: 1, seed: 7, lang: "en" }));
  await other.waitForSelector(".rl");
  const second = await other.evaluate(() => JSON.parse(localStorage.getItem("ewl-fm2-v1:profile-1") || "{}"));
  ok(!second.skills?.[`${GAME}:bowls-groups`], "a second profile has no record of that skill");
  ok((await other.evaluate((g) => JSON.parse(localStorage.getItem("ewl-fm2-v1")).skills[`${g}:bowls-groups`].plays, GAME)) === 5, "the first profile's record is untouched");
  await other.close();
  await page.close();
  await clean.close();
}
console.log("PASS Reset, Start over, a 5-round activity with stars, the stored record, and a separate second profile");

// ---- 7. leave and return: resume restores the same round and earlier results --------------------------------------------------------------
{
  const page = await open(desktop, { grade: 5, skill: "fraction-scale", seed: 21 });
  await solveByUi(page);
  await assertSolved(page, "resume setup round 1");
  await page.click("[data-fm2-next]");
  await solveByUi(page);
  await assertSolved(page, "resume setup round 2");
  await page.click("[data-fm2-next]");
  const before = await page.evaluate(() => window.__fm2.round.prompt.en);
  await page.goto(h.play({ game: GAME, grade: 5, skill: "fraction-scale", seed: 21, lang: "en", resume: 1 }));
  await page.waitForSelector(".rl");
  ok(/Round 3 of 5/.test(await page.locator("[data-fm2-round]").innerText()), "resume=1 returns to round 3");
  ok((await page.evaluate(() => window.__fm2.round.prompt.en)) === before, "resume rebuilds the same round from the seed");
  ok((await page.locator(".fm2-dot-done").count()) === 2, "earlier results are restored (two solved rounds)");
  await page.close();
}
console.log("PASS resume=1 restores the round index, the same round and the earlier results");

// ---- 8. language switch keeps the work; labels change -------------------------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 3, skill: "scale-whole", seed: 3, level: 2 });
  const sol = await solutionOf(page);
  const labelEn = await page.locator(".rl-label").innerText();
  await setBatch(page, (await roundOf(page)).cols[0], sol.cols[0].batch, "steps");
  const [k, text] = Object.entries(sol.cols[0].values)[0];
  await page.fill(`[data-rl-field="0:${k}"]`, text);
  const batchBefore = await page.inputValue("[data-rl-batch]");
  const liveBefore = await page.locator("[data-rl-live]").allInnerTexts();
  await page.click("[data-fm2-lang]");
  ok((await page.locator(".rl-label").innerText()) !== labelEn && /tandas/.test(await page.locator(".rl-label").innerText()), "the batch label switches to Spanish");
  ok((await page.inputValue("[data-rl-batch]")) === batchBefore, "the chosen batch remains after the switch");
  ok((await page.inputValue(`[data-rl-field="0:${k}"]`)) === text, "the typed amount remains after the switch");
  ok((await page.locator("[data-rl-live]").allInnerTexts()).join() === liveBefore.join(), "the live table cells are unchanged");
  ok(/Comprobar/.test(await page.locator("[data-rl-submit]").innerText()), "the main button is in Spanish");
  ok(/Personas|Harina|Leche|Azúcar|Huevos|Mantequilla|Fideos|Zanahorias|Caldo|Arroz|Aceite|Cacao|Plátanos|Yogur|Jugo|Limones|Agua|Nueces|Pasas|Semillas/.test(await page.locator(".rl-table").innerText()), "the table row names are Spanish");
  await page.screenshot({ path: `${SHOTS}/scale-es-1440.png`, fullPage: true });
  await solveByUi(page);
  await page.waitForFunction(() => /¡Correcto!/.test(document.querySelector("[data-fm2-feedback]")?.textContent || ""));
  await page.click("[data-fm2-lang]");
  ok(/Check/.test(await page.locator("[data-rl-submit]").innerText()), "switching back restores English labels");
  await page.close();
}
{
  const page = await open(desktop, { grade: 8, skill: "compare-rates", level: 2 });
  const sol = await solutionOf(page);
  await page.locator(`[data-rl-pick="${sol.pick}"]`).click();
  await page.fill('[data-rl-field="1:y"]', "7");
  await page.click("[data-fm2-lang]");
  ok((await page.locator(`[data-rl-pick="${sol.pick}"]`).getAttribute("aria-pressed")) === "true", "the chosen option survives the language switch");
  ok((await page.inputValue('[data-rl-field="1:y"]')) === "7", "a typed amount in the second column survives");
  ok(/Relación/.test(await page.locator(".rl-chips").innerText()), "column chips are relabelled");
  await page.close();
}
console.log("PASS language switch relabels the workbench and keeps the batch, typed amounts and the chosen option");

// ---- 9. mobile touch, overflow, 44px targets ---------------------------------------------------------------------------------------------------------
const phone = await h.context({ width: 375, height: 800, touch: true });
for (const [grade, skill] of [[0, "more-fewer"], [2, "repeat-batch"], [3, "scale-whole"], [5, "graph-pairs"], [6, "unit-rate"], [8, "compare-rates"]]) {
  const page = await open(phone, { grade, skill, level: 2 });
  ok(!(await hasOverflow(page)), `${skill}: no horizontal overflow at 375 touch`);
  ok((await stageSmallTargets(page)).length === 0, `${skill}: every control in the stage is at least 44px (${(await stageSmallTargets(page)).join(", ")})`);
  await solveByUi(page, { mode: "steps", how: "tap" });
  await assertSolved(page, `${skill} by touch`);
  await page.close();
}
for (const width of [320, 375, 768, 1440]) {
  const context = await h.context({ width, height: 900 });
  for (const [grade, skill] of [[0, "bowls-groups"], [1, "double-half"], [3, "scale-whole"], [4, "table-100"], [5, "fraction-scale"], [6, "stronger-mix"], [7, "const-k"], [8, "line-origin"], [8, "compare-rates"]]) {
    const page = await open(context, { grade, skill, level: 3 });
    await enterSolution(page);
    ok(!(await hasOverflow(page)), `${skill}: no horizontal overflow at ${width}px`);
    ok((await stageSmallTargets(page)).length === 0, `${skill}: 44px targets at ${width}px (${(await stageSmallTargets(page)).join(", ")})`);
    if (width === 320 || width === 768) await page.screenshot({ path: `${SHOTS}/${skill}-${width}.png`, fullPage: true });
    await page.close();
  }
  await context.close();
}
{
  const page = await open(phone, { grade: 3, skill: "scale-whole", lang: "es", level: 3 });
  await enterSolution(page, { mode: "steps", how: "tap" });
  await page.screenshot({ path: `${SHOTS}/scale-whole-es-375.png`, fullPage: true });
  await page.close();
}
console.log("PASS touch taps solve rounds at 375px; no overflow at 320, 375, 768 and 1440; every stage control is 44px");

// ---- 10. keyboard only: Tab to a control, arrows and typing, Enter to check ----------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 3, skill: "scale-whole", seed: 13, level: 2 });
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  await tabTo(page, "[data-rl-batch]");
  const target = frParse(sol.cols[0].batch)[0];
  for (let i = 1; i < target; i += 1) await page.keyboard.press("ArrowUp");
  ok((await page.inputValue("[data-rl-batch]")) === String(target), "ArrowUp raises the batch one step at a time");
  await page.keyboard.press("ArrowDown");
  ok((await page.inputValue("[data-rl-batch]")) === String(target - 1), "ArrowDown lowers it");
  await page.keyboard.press("ArrowUp");
  await tabTo(page, "[data-rl-slider]");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowRight");
  ok((await page.inputValue("[data-rl-batch]")) === String(target), "the slider moves with the arrow keys and keeps the batch in step");
  ok(((await page.locator("[data-rl-slider]").getAttribute("aria-valuetext")) || "").includes(String(target)), "the slider announces its value in aria-valuetext");
  for (const [k, text] of Object.entries(sol.cols[0].values)) {
    await tabTo(page, `[data-rl-field="0:${k}"]`);
    await page.keyboard.type(text);
  }
  await page.keyboard.press("Enter");
  await assertSolved(page, "keyboard-only workbench");
  ok(round.cols.length === 1, "single-column round");
  await page.close();
}
{
  const page = await open(desktop, { grade: 8, skill: "stronger-mix", seed: 4, level: 2 });
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  for (let ci = 0; ci < round.cols.length; ci += 1) {
    await tabTo(page, `[data-rl-col="${ci}"]`);
    await page.keyboard.press("Enter");
    await tabTo(page, "[data-rl-batch]");
    await page.keyboard.press("End");
    for (let i = 0; i < 8; i += 1) await page.keyboard.press("Backspace");
    await page.keyboard.type(sol.cols[ci].batch);
    await tabTo(page, `[data-rl-field="${ci}:a"]`);
    await page.keyboard.type(sol.cols[ci].values.a);
  }
  for (const [k, text] of Object.entries(sol.extra)) {
    await tabTo(page, `[data-rl-extra="${k}"]`);
    await page.keyboard.type(text);
  }
  await tabTo(page, `[data-rl-pick="${sol.pick}"]`);
  await page.keyboard.press("Space");
  ok((await page.getAttribute(`[data-rl-pick="${sol.pick}"]`, "aria-pressed")) === "true", "an option is chosen with the space bar");
  await tabTo(page, "[data-rl-submit]");
  await page.keyboard.press("Enter");
  await assertSolved(page, "keyboard-only columns, extras and a choice");
  await page.close();
}
console.log("PASS columns, batch, amounts, extras and choices are all completed with the keyboard alone");

// ---- 11. axe-core, both languages -----------------------------------------------------------------------------------------------------------------------
for (const lang of ["en", "es"]) {
  for (const [grade, skill, level] of [[0, "bowls-groups", 2], [0, "more-fewer", 3], [3, "scale-whole", 3], [4, "table-100", 2], [5, "graph-pairs", 2], [6, "unit-rate", 2], [6, "stronger-mix", 2], [7, "const-k", 2], [8, "compare-rates", 2], [8, "line-origin", 2]]) {
    const page = await open(desktop, { grade, skill, level, lang });
    await enterSolution(page);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    ok(result.violations.length === 0, `axe (${lang}, ${skill}): ${JSON.stringify(result.violations.map((v) => [v.id, v.nodes.slice(0, 2).map((x) => x.html.slice(0, 90))]))}`);
    await page.click("[data-rl-submit]");
    await page.waitForSelector("[data-fm2-next]:not([hidden])");
    const done = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    ok(done.violations.length === 0, `axe finished (${lang}, ${skill}): ${JSON.stringify(done.violations.map((v) => v.id))}`);
    await page.close();
  }
}
console.log("PASS axe-core finds no wcag2a/aa violations in English or Spanish");

// ---- screenshots for the visual review -----------------------------------------------------------------------------------------------------------------
for (const [name, width, params] of [
  ["bowls-1440", 1440, { grade: 0, skill: "bowls-groups" }],
  ["share-768", 768, { grade: 1, skill: "share-bowls" }],
  ["limit-375", 375, { grade: 3, skill: "scale-whole", level: 3 }],
  ["table-es-1440", 1440, { grade: 4, skill: "table-100", lang: "es" }],
  ["graph-768", 768, { grade: 5, skill: "graph-pairs" }],
  ["unit-1440", 1440, { grade: 6, skill: "unit-rate" }],
  ["constk-es-375", 375, { grade: 7, skill: "const-k", lang: "es" }],
  ["compare-1440", 1440, { grade: 8, skill: "compare-rates" }],
]) {
  const context = await h.context({ width, height: 900 });
  const page = await open(context, { level: 2, ...params });
  await enterSolution(page);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
  await context.close();
}

// ---- 12. nothing broke along the way ------------------------------------------------------------------------------------------------------------------------
assertClean(h.problems, "the whole Ratio Recipe Lab suite");
await h.close();
console.log(`ratio-recipe-lab acceptance: ${checks} checks passed in ${Math.round((Date.now() - started) / 1000)}s.`);
