// biome-ignore-all format: dense one-line steps keep this suite readable and inside the file-size cap
// Acceptance suite for Family Math Duel (game 10), against the real play.html: real clicks, taps and key presses on the
// cards, slots, inputs and buttons, never window.__fm2.submit. The test seam is used only to read the round (to know
// which seed we are on) and the reference play solve() (to know which cards to click). Both modes are covered: solo
// against Orbit, and together with two people on one device, including the hand-over screen, the privacy of a hidden
// hand, a challenge in each direction and Fair play. Screenshots: /tmp/claude-501/fm2-shots/family-math-duel/.
// @fm2 FM-016 FM-027 FM-079 FM-038 FM-039 FM-040 FM-037 FM-020 FM-021 FM-026
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { fmtValue, replay, seatValue, winnerOf } from "../../math/fluency-lab/family/fm2/games/family-math-duel/engine.js";
import game from "../../math/fluency-lab/family/fm2/games/family-math-duel/index.js";
import { slotKinds } from "../../math/fluency-lab/family/fm2/games/family-math-duel/templates.js";
import { makeRng, seedFrom } from "../../math/fluency-lab/family/fm2/rng.js";
import { assertClean, hasOverflow, launch } from "./harness.mjs";

const SHOTS = "/tmp/claude-501/fm2-shots/family-math-duel";
mkdirSync(SHOTS, { recursive: true });
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks += 1; };
const h = await launch();
const started = Date.now();
const GAME = "family-math-duel";
const stamp = (msg) => console.log(`[${((Date.now() - started) / 1000).toFixed(0)}s]`, msg);

// ---- finding seeds node-side, with the same seeding the shell uses ---------------------------------------------------
const roundFor = (skill, level, grade, seed, index = 0) => game.makeRound(skill, level, makeRng(seedFrom(seed, GAME, skill, level, index)), grade);
function findSeed(skill, level, grade, pred) {
  for (let seed = 1; seed < 600; seed += 1) if (pred(roundFor(skill, level, grade, seed), seed)) return seed;
  throw new Error(`no seed for ${skill} L${level} g${grade}`);
}

// ---- page helpers -----------------------------------------------------------------------------------------------------------
async function open(context, params) {
  const page = await context.newPage();
  await page.goto(h.play({ game: GAME, rounds: 5, seed: 1, lang: "en", mode: "solo", ...params }));
  await page.waitForSelector(".fd");
  return page;
}
const roundOf = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__fm2.round)));
const solutionOf = (page) => page.evaluate(() => window.__fm2.solve());
const text = (page, selector) => page.locator(selector).first().innerText();
const feedback = (page) => text(page, "[data-fm2-feedback]");
const phase = (page) => page.locator(".fd").getAttribute("data-phase");
const attempts = (page) => page.evaluate(() => window.__fm2.tools.attempts);
const act = (locator, how) => (how === "tap" ? locator.tap() : locator.click());
const tooSmall = async (page) => (await page.evaluate(() => [...document.querySelectorAll("[data-fm2-stage] button, [data-fm2-stage] input, [data-fm2-stage] a")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44); }).map((e) => `${e.tagName}:${(e.getAttribute("aria-label") || e.textContent).slice(0, 30)}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`)));
async function assertSolved(page, label) {
  await page.waitForFunction(() => /Correct!|¡Correcto!/.test(document.querySelector("[data-fm2-feedback]")?.textContent || ""));
  ok(await page.locator("[data-fm2-next]").isVisible(), `${label}: Next appears after a solved hand`);
}

// Plays the draft the way a person does: tap a card, then (when the slot matters) tap the slot.
async function placeMove(page, [seat, card, slot], how) {
  await act(page.locator(`.fd-card[data-card="${card}"]`), how);
  if (await page.evaluate((id) => document.querySelector(`.fd-card[data-card="${id}"]`)?.getAttribute("aria-pressed") === "true", card)) await act(page.locator(`.fd-slot[data-seat="${seat}"][data-slot="${slot}"]`), how);
}
async function draft(page, mode, rec, round, how = "click", opts = {}) {
  const seats = mode === "together" ? [0, 1] : [0];
  if (round.variant === "open") { for (const m of rec.moves) if (seats.includes(m[0])) await placeMove(page, m, how); return; }
  for (const seat of [round.first, 1 - round.first].filter((s) => seats.includes(s))) {
    if (mode === "together") { await opts.onHandover?.(seat); await act(page.locator("[data-act=handover-ok]"), how); }
    for (const m of rec.moves.filter((x) => x[0] === seat)) await placeMove(page, m, how);
    await act(page.locator("[data-act=lock]"), how);
  }
}
async function claim(page, selector, value, how) { await page.fill(selector.input, value); await act(page.locator(selector.submit), how); }
const CLAIM0 = { input: "#fd-in-claim0", submit: '[data-form="claim0"] button[type=submit]' };
const CLAIM1 = { input: "#fd-in-claim1", submit: '[data-form="claim1"] button[type=submit]' };
const COUNTER = { input: "#fd-in-counter", submit: '[data-form="counter"] button[type=submit]' };
// everything after the draft: claim, (their challenge), their claim, the call, the verdict
async function finish(page, mode, rec, round, how = "click", opts = {}) {
  await claim(page, CLAIM0, rec.claims[0], how);
  if (mode === "together" && round.rights.theirs) await act(page.locator(`[data-act=theirs-${opts.theirs ? "yes" : "no"}]`), how);
  if (round.rights.challenge) {
    if (mode === "together") await claim(page, CLAIM1, rec.claims[1], how);
    if (rec.call.challenge) { await act(page.locator("[data-act=challenge]"), how); await claim(page, COUNTER, rec.call.counter, how); } else await act(page.locator("[data-act=agree]"), how);
  }
  await act(page.locator(`[data-verdict="${rec.verdict}"]`), how);
}
async function solveByUi(page, mode = "solo", how = "click", opts = {}) {
  const round = await roundOf(page);
  const rec = await solutionOf(page);
  await draft(page, mode, rec, round, how, opts);
  await finish(page, mode, rec, round, how, opts);
  return { round, rec };
}

// warm the dev server so a first-load dependency reload cannot interrupt a test
{ const warm = await h.context({ width: 1024, height: 800 }); const p = await open(warm, { grade: 3, skill: "g3-product-war", level: 1 }); await p.waitForLoadState("networkidle"); await p.close(); await warm.close(); }

// ---- 1. opens at several grades, in both modes, with no errors -----------------------------------------------------------------
const desktop = await h.context({ width: 1440, height: 900 });
for (const [grade, skill] of [[0, "k-compare"], [3, "g3-product-war"], [6, "g6-zero-sum"], [8, "g8-power"]]) for (const mode of ["solo", "together"]) {
  const page = await open(desktop, { grade, skill, mode, level: 2 });
  const round = await roundOf(page);
  ok(round.skillId === skill && (await page.locator(".fd-seat").count()) === 2, `grade ${grade} ${mode}: the duel table opens with two players`);
  const names = await page.$$eval(".fd-name", (n) => n.map((x) => x.textContent));
  ok(mode === "solo" ? names.join() === "You,Orbit" : names.join() === "Learner,Caregiver", `grade ${grade} ${mode}: names are ${names}`);
  ok(/Goal/.test(await text(page, ".fd-goal")) && (await text(page, ".fd-goal-text")).length > 10, `grade ${grade}: the goal is stated`);
  ok(!(await hasOverflow(page)), `grade ${grade} ${mode}: no horizontal overflow`);
  if (mode === "together") ok((await text(page, "[data-fm2-turn]")).includes("Both of you play"), `grade ${grade}: the shell's together prompt names both players`);
  await page.close();
}
stamp("PASS opens at grades 0, 3, 6 and 8 in solo and together, clean console");

// ---- 2. how to play, in both languages -----------------------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 3, skill: "g3-product-war", level: 2 });
  await page.click("[data-fm2-howto]");
  const en = await page.$$eval("[data-fm2-howto-steps] li", (i) => i.map((x) => x.textContent));
  ok(en.length >= 3 && en.length <= 5 && en[0].startsWith("Read the goal"), "English steps are visible");
  await page.click("[data-fm2-dialog-close]");
  await page.click("[data-fm2-lang]");
  await page.click("[data-fm2-howto]");
  const es = await page.$$eval("[data-fm2-howto-steps] li", (i) => i.map((x) => x.textContent));
  ok(es.length === en.length && es[0].startsWith("Lee la meta") && es.every((s, i) => s !== en[i]), "Spanish steps are visible and different");
  await page.click("[data-fm2-dialog-close]");
  await page.close();
}
stamp("PASS how to play in English and Spanish");

// ---- 3. solo against Orbit: real clicks solve rounds of different skills ------------------------------------------------------------
for (const [skill, grade, level, pred] of [
  ["g3-product-war", 3, 2, (r) => r.variant === "open"],
  ["g2-place-number", 2, 1, (r) => r.variant === "open" && r.first === 1],
  ["g2-place-number", 2, 1, (r) => r.variant === "private"],
  ["g5-near-one", 5, 2, (r) => r.variant === "open"],
  ["g6-order-of-ops", 6, 3, (r) => r.variant === "private"],
  ["g8-scinot", 8, 2, (r) => r.variant === "open"],
  ["k-make10", 0, 1, (r) => r.variant === "open"],
  ["g7-percent-of", 7, 3, (r) => r.orbit.slip],
]) {
  const seed = findSeed(skill, level, grade, pred);
  const page = await open(desktop, { grade, skill, level, seed });
  const { round, rec } = await solveByUi(page, "solo");
  await assertSolved(page, `${skill} (${round.variant})`);
  ok((await text(page, "[data-fm2-feedback]")).includes("Hand complete"), `${skill}: the shell reports the hand`);
  ok(await page.locator("[data-testid=duel-result]").isVisible(), `${skill}: the result panel lists the hand`);
  const pts = await page.$$eval(".fd-score", (s) => s.map((x) => Number(x.textContent.match(/\d+/)[0])));
  const expected = [0, 0];
  if (rec.verdict === 2) { expected[0] += 1; expected[1] += 1; } else expected[rec.verdict] += 2;
  if (round.rights.challenge && rec.call?.challenge) expected[0] += 1;
  ok(pts.join() === expected.join(), `${skill}: scores ${pts} match the rules ${expected}`);
  await page.close();
}
stamp("PASS solo hands solved by clicking: open and private, five skills, with and without a challenge");

// ---- 4. mistakes through the interface: feedback, no Next, then the fix ---------------------------------------------------------------------
{
  // 4a. a card already taken is a neutral probe; a wrong value is named; a wrong verdict is named
  const seed = findSeed("g3-product-war", 2, 3, (r) => r.variant === "open" && r.first === 1 && !r.orbit.slip);
  const page = await open(desktop, { grade: 3, skill: "g3-product-war", level: 2, seed });
  const round = await roundOf(page);
  const rec = await solutionOf(page);
  const orbitCard = rec.moves[0][1];
  ok((await page.locator(`.fd-card[data-card="${orbitCard}"]`).getAttribute("data-taken")) === "true", "Orbit opened first: its card is marked taken");
  ok((await page.locator(`.fd-card[data-card="${orbitCard}"]`).getAttribute("aria-label")).includes("already taken by Orbit"), "a taken card says who took it");
  await page.locator(`.fd-card[data-card="${orbitCard}"]`).click();
  ok(/already taken/.test(await feedback(page)) && !(await page.locator("[data-fm2-next]").isVisible()), "using a taken card gets named feedback and no Next");
  ok((await attempts(page)) === 0, "a taken-card probe does not count toward Show me");
  await draft(page, "solo", rec, round);
  ok((await phase(page)) === "claim0", "the draft ends and the value step opens");
  const v0 = Number(rec.claims[0]);
  await claim(page, CLAIM0, String(v0 + 1), "click");
  const f1 = await feedback(page);
  ok(/Not yet/.test(f1) && f1.length > 50 && !new RegExp(`\\b${v0}\\b`).test(f1) && !(await page.locator("[data-fm2-next]").isVisible()), `a wrong value is named, not corrected: ${f1}`);
  ok((await phase(page)) === "claim0" && (await attempts(page)) === 1, "the wrong value stays editable and counts as an attempt");
  await claim(page, CLAIM0, String(rec.claims[0]), "click");
  ok((await phase(page)) !== "claim0", "the right value moves the hand on");
  if (round.rights.challenge && !round.orbit.slip) {
    await act(page.locator("[data-act=challenge]"), "click");
    await claim(page, COUNTER, String(Number(rec.claims[1]) + 1), "click");
    ok(/right|challenge/i.test(await feedback(page)) && !(await page.locator("[data-fm2-next]").isVisible()), `challenging a right claim is a named mistake: ${await feedback(page)}`);
    await page.locator("[data-act=challenge]").click();
    await act(page.locator("[data-act=agree]"), "click");
  }
  const wrongVerdict = [0, 1, 2].find((v) => v !== rec.verdict);
  await page.locator(`[data-verdict="${wrongVerdict}"]`).click();
  ok(/Not yet/.test(await feedback(page)) && !(await page.locator("[data-fm2-next]").isVisible()), `a wrong verdict is named: ${await feedback(page)}`);
  await page.locator(`[data-verdict="${rec.verdict}"]`).click();
  await assertSolved(page, "after mistakes");
  await page.close();
}
{
  // 4b. Orbit slips: agreeing is a named mistake, a wrong correction is another, the right correction passes
  const seed = findSeed("g3-product-war", 2, 3, (r) => r.variant === "open" && r.orbit.slip);
  const page = await open(desktop, { grade: 3, skill: "g3-product-war", level: 2, seed });
  const round = await roundOf(page);
  const rec = await solutionOf(page);
  ok(rec.call.challenge, "Orbit's claim is wrong on this hand");
  await draft(page, "solo", rec, round);
  await claim(page, CLAIM0, rec.claims[0], "click");
  ok(/Orbit says its value is/.test(await text(page, ".fd-board[data-seat='1']")), "Orbit announces its value on its board");
  await page.locator("[data-act=agree]").click();
  ok(/not right/.test(await feedback(page)) && !(await page.locator("[data-fm2-next]").isVisible()), `accepting a wrong claim is named: ${await feedback(page)}`);
  await page.locator("[data-act=challenge]").click();
  await claim(page, COUNTER, String(Number(rec.call.counter) + 5), "click");
  ok(/correction/.test(await feedback(page)), `a wrong correction is named: ${await feedback(page)}`);
  await claim(page, COUNTER, rec.call.counter, "click");
  ok((await phase(page)) === "verdict" && (await page.locator(".fd-score").first().innerText()).length > 0, "the right correction upholds the challenge");
  ok((await page.$$eval(".fd-score", (s) => s.map((x) => x.textContent.match(/\d+/)[0]))).join() === "1,0", "an upheld challenge scores a point for the challenger");
  await page.locator(`[data-verdict="${rec.verdict}"]`).click();
  await assertSolved(page, "after a slip");
  ok(/Challenge upheld/.test(await text(page, "[data-testid=duel-result]")), "the result explains the challenge");
  await page.close();
}
stamp("PASS mistakes: taken card, wrong value, bad challenge, missed slip, wrong verdict are named, then fixed");

// ---- 5. hints and Show me --------------------------------------------------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 4, skill: "g4-big-number", level: 2 });
  const answer = await page.evaluate(() => window.__fm2.game.answerText(window.__fm2.round));
  const boxes = [];
  for (let i = 0; i < 3; i += 1) { await page.click("[data-fm2-hint]"); boxes.push(await text(page, "[data-fm2-hintbox]")); }
  ok(new Set(boxes).size === 3 && boxes.every((b) => b.length > 30), "each hint tier shows different text");
  ok(boxes.every((b) => !new RegExp(`(?<![\\d./])${answer}(?![\\d./])`).test(b)), "tiers 0 to 2 do not state the answer");
  ok(await page.locator("[data-fm2-hint]").isDisabled() && (await page.locator("[data-fm2-showme]").isVisible()), "three hints end the hint button and offer Show me");
  await page.close();
  const miss = await open(desktop, { grade: 3, skill: "g3-product-war", level: 1, seed: 2 });
  const rec = await solutionOf(miss);
  const round = await roundOf(miss);
  await draft(miss, "solo", rec, round);
  ok(!(await miss.locator("[data-fm2-showme]").isVisible()), "Show me is hidden at first");
  for (let i = 0; i < 3; i += 1) await claim(miss, CLAIM0, String(Number(rec.claims[0]) + 1 + i), "click");
  ok(await miss.locator("[data-fm2-showme]").isVisible(), "Show me appears after three misses");
  await miss.click("[data-fm2-showme]");
  const shown = await text(miss, "[data-fm2-hintbox]");
  const key = await miss.evaluate(() => window.__fm2.game.answerText(window.__fm2.round));
  ok(shown.includes(key) && /strong play/.test(shown), "Show me gives the full play");
  ok(/worked answer/.test(await feedback(miss)) && (await miss.locator("[data-fm2-next]").isVisible()), "Show me says it is a worked answer, then Next");
  ok((await miss.locator("#fd-in-claim0").count()) === 0 && (await miss.locator("[data-testid=duel-panel]").innerText()).includes("ended"), "the table is frozen after Show me");
  await miss.screenshot({ path: `${SHOTS}/show-me-1440.png` });
  await miss.close();
}
stamp("PASS hint tiers differ and never state the answer; Show me after three misses");

// ---- 6. reset, start over, a five-round activity, stars and per-profile records ----------------------------------------------------------------
{
  const context = await h.context({ width: 1024, height: 900 });
  const page = await open(context, { grade: 3, skill: "g3-product-war", level: 1, rounds: 5, seed: 3 });
  const rec = await solutionOf(page);
  const round = await roundOf(page);
  await placeMove(page, rec.moves.find((m) => m[0] === 0), "click");
  ok((await page.locator(".fd-slot-full").count()) >= 1, "a card is placed before reset");
  await page.click("[data-fm2-reset]");
  ok((await page.locator("button.fd-slot[data-seat='0']:not(.fd-slot-full)").count()) === slotKinds(round.tpl).length || round.first === 1, "Reset this puzzle clears the learner's cards");
  await solveByUi(page);
  await page.click("[data-fm2-next]");
  ok((await text(page, "[data-fm2-round]")) === "Round 2 of 5", "Next goes to round 2");
  await page.click("[data-fm2-restart]");
  ok((await text(page, "[data-fm2-round]")) === "Round 1 of 5" && (await phase(page)) === "draft", "Start over returns to round 1 with a fresh table");
  await context.close();
}
{
  const context = await h.context({ width: 1024, height: 900 });
  const page = await open(context, { grade: 3, skill: "g3-product-war", level: 2, rounds: 5, seed: 9, profile: 0 });
  for (let r = 1; r <= 5; r += 1) {
    const sel = await solveByUi(page);
    await assertSolved(page, `round ${r} (${sel.round.variant})`);
    await page.click("[data-fm2-next]");
  }
  await page.waitForSelector(".fm2-stars");
  const stars = await page.getAttribute(".fm2-stars", "aria-label");
  ok(stars.startsWith("3"), `the finish screen shows stars: ${stars}`);
  await page.screenshot({ path: `${SHOTS}/finish-1024.png` });
  const stored = JSON.parse(await page.evaluate(() => localStorage.getItem("ewl-fm2-v1")));
  ok(stored.skills[`${GAME}:g3-product-war`]?.plays === 5, `the skill record counts five plays: ${stored.skills[`${GAME}:g3-product-war`]?.plays}`);
  ok(stored.games[GAME].completed === 1, "the activity is recorded as completed once");
  const other = await open(context, { grade: 3, skill: "g3-product-war", level: 2, rounds: 5, profile: 1 });
  const second = await other.evaluate(() => localStorage.getItem("ewl-fm2-v1:profile-1"));
  ok(!second || !JSON.parse(second).skills[`${GAME}:g3-product-war`], "a second profile has no record of that skill");
  await other.close();
  await context.close();
}
stamp("PASS reset, start over, a five-round activity with stars, records separated by profile");

// ---- 7. leave and return -------------------------------------------------------------------------------------------------------------------------------
{
  const context = await h.context({ width: 1024, height: 900 });
  const page = await open(context, { grade: 4, skill: "g4-multiply-tens", level: 1, rounds: 4, seed: 5, profile: 0 });
  await solveByUi(page);
  await page.click("[data-fm2-next]");
  const before = await roundOf(page);
  await page.goto(h.play({ game: GAME, resume: 1, profile: 0 }));
  await page.waitForSelector(".fd");
  ok((await text(page, "[data-fm2-round]")) === "Round 2 of 4", "resume restores the round index");
  assert.deepEqual(await roundOf(page), before, "resume rebuilds the same hand from the seed"); checks += 1;
  ok((await page.locator(".fm2-dot-done").count()) === 1, "resume keeps the earlier result");
  await context.close();
}
stamp("PASS resume restores the round and earlier results");

// ---- 8. language switch keeps the work -------------------------------------------------------------------------------------------------------------------
{
  const seed = findSeed("g2-place-number", 2, 2, (r) => r.variant === "open" && r.first === 0);
  const page = await open(desktop, { grade: 2, skill: "g2-place-number", level: 2, seed });
  const round = await roundOf(page);
  const rec = await solutionOf(page);
  const mine = rec.moves.filter((m) => m[0] === 0);
  await placeMove(page, mine[0], "click");
  const placedEn = await page.locator(`button.fd-slot[data-seat="0"][data-slot="${mine[0][2]}"]`).getAttribute("aria-label");
  ok(/holds Card/.test(placedEn), `a placed card is labelled in English: ${placedEn}`);
  await page.locator(`.fd-card[data-card="${mine[1][1]}"]`).click(); // selected, waiting for a slot
  ok((await page.locator(`.fd-card[data-card="${mine[1][1]}"]`).getAttribute("aria-pressed")) === "true", "a card is selected before the switch");
  await page.click("[data-fm2-lang]");
  const placedEs = await page.locator(`button.fd-slot[data-seat="0"][data-slot="${mine[0][2]}"]`).getAttribute("aria-label");
  ok(/con Carta/.test(placedEs), `the placed card is still there, labelled in Spanish: ${placedEs}`);
  ok((await page.locator(`.fd-card[data-card="${mine[1][1]}"]`).getAttribute("aria-pressed")) === "true", "the selected card stays selected");
  ok((await page.$$eval(".fd-name", (n) => n.map((x) => x.textContent).join())) === "Tú,Orbit" && /Meta/.test(await text(page, ".fd-goal")), "names and goal are in Spanish");
  ok(/Carta \d/.test(await page.locator(".fd-card").first().getAttribute("aria-label")), "table cards are labelled in Spanish");
  await page.screenshot({ path: `${SHOTS}/spanish-draft-1440.png`, fullPage: true });
  await page.click("[data-fm2-lang]");
  await page.locator(`.fd-slot[data-seat="0"][data-slot="${mine[1][2]}"]`).click();
  for (const m of mine.slice(2)) await placeMove(page, m, "click");
  await finish(page, "solo", rec, round);
  await assertSolved(page, "after switching languages");
  await page.close();
  // mid-claim: typed text survives a switch
  const p2 = await open(desktop, { grade: 3, skill: "g3-product-war", level: 2, seed: 4 });
  const r2 = await roundOf(p2); const s2 = await solutionOf(p2);
  await draft(p2, "solo", s2, r2);
  await p2.fill("#fd-in-claim0", "12");
  await p2.click("[data-fm2-lang]");
  ok((await p2.inputValue("#fd-in-claim0")) === "12" && /Valor exacto/.test(await text(p2, ".fd-form label")), "typed text survives the switch and the label is Spanish");
  await p2.close();
}
stamp("PASS switching language keeps placed cards, a selected card and typed text");

// ---- 9. together on one device: the hand-over screen, privacy, a challenge each way, Fair play ---------------------------------------------------------------------
{
  const seed = findSeed("g1-biggest-sum", 2, 1, (r) => r.variant === "private" && r.orbit.slip);
  const page = await open(desktop, { grade: 1, skill: "g1-biggest-sum", level: 2, seed, mode: "together" });
  const round = await roundOf(page);
  const rec = await solutionOf(page);
  const seen = [];
  const first = round.first;
  ok((await phase(page)) === "handover", "a private hand opens on the hand-over screen");
  ok((await text(page, "[data-testid=handover]")).includes(`Hand the device to ${first === 0 ? "Learner" : "Caregiver"}`), "the hand-over screen names who gets the device");
  ok((await page.locator(".fd-card, .fd-slot, .fd-board").count()) === 0, "no cards or expressions are in the page during hand-over");
  await page.screenshot({ path: `${SHOTS}/handover-1440.png` });
  await draft(page, "together", rec, round, "click", {
    onHandover: async (seat) => {
      ok((await page.locator("[data-testid=handover]").isVisible()) && (await page.locator(".fd-card").count()) === 0, `the screen before ${seat === 0 ? "Learner" : "Caregiver"} shows no cards`);
      seen.push(seat);
    },
  });
  ok(seen.join() === `${first},${1 - first}`, `the device changes hands once, ${seen}`);
  ok((await phase(page)) === "claim0" && (await page.locator(".fd-board .fd-slot-back").count()) === 0, "after both lock in, both expressions are revealed");
  ok((await page.locator(".fd-slot-full").count()) === slotKinds(round.tpl).length * 2, "every card of both players is shown at the reveal");
  await page.screenshot({ path: `${SHOTS}/together-reveal-1440.png`, fullPage: true });
  // privacy while the second player builds: re-run to the second seat's turn and look for the first seat's cards
  const p2 = await open(desktop, { grade: 1, skill: "g1-biggest-sum", level: 2, seed, mode: "together" });
  await p2.click("[data-act=handover-ok]");
  const mine = round.deal[first];
  const theirs = round.deal[1 - first];
  ok((await p2.locator(".fd-card").count()) === mine.length && (await p2.locator(`.fd-card[data-card="${theirs[0]}"]`).count()) === 0, "the first player sees only their own hand");
  ok((await p2.locator(".fd-board .fd-slot-back").count()) === slotKinds(round.tpl).length, "the other player's expression is face down");
  for (const m of rec.moves.filter((x) => x[0] === first)) await placeMove(p2, m, "click");
  await p2.click("[data-act=lock]");
  ok((await phase(p2)) === "handover" && (await p2.locator(".fd-card").count()) === 0, "locking in returns to the hand-over screen with nothing showing");
  await p2.click("[data-act=handover-ok]");
  ok((await p2.locator(`.fd-card[data-card="${theirs[0]}"]`).count()) === 1 && (await p2.locator(`.fd-card[data-card="${mine[0]}"]`).count()) === 0, "the second player sees their own hand and not the first player's");
  ok((await p2.locator(".fd-slot-full").count()) === 0, "the first player's chosen cards are not visible to the second player");
  await p2.close();
  // the caregiver's claim is wrong (a real slip); the learner challenges and corrects it
  await claim(page, CLAIM0, rec.claims[0], "click");
  ok((await phase(page)) === "claim1", "the caregiver is asked to type their own value");
  await claim(page, CLAIM1, "abc", "click");
  ok(/as a number|number/.test(await text(page, ".fd-warn")) , "an unreadable caregiver value is refused on the spot");
  await claim(page, CLAIM1, rec.claims[1], "click");
  ok((await phase(page)) === "call", "the learner is asked to agree or challenge");
  await page.locator("[data-act=agree]").click();
  ok(/not right/.test(await feedback(page)) && !(await page.locator("[data-fm2-next]").isVisible()), "agreeing with a wrong caregiver value is named");
  await page.locator("[data-act=challenge]").click();
  await claim(page, COUNTER, rec.call.counter, "click");
  await page.locator(`[data-verdict="${rec.verdict}"]`).click();
  await assertSolved(page, "together private with a challenge");
  const result = await text(page, "[data-testid=duel-result]");
  ok(/Challenge upheld/.test(result) && /Learner made/.test(result), "the result names both players and the challenge");
  await page.screenshot({ path: `${SHOTS}/together-result-1440.png`, fullPage: true });
  ok((await text(page, "[data-fm2-explain]")).length > 20, "the shell shows the caregiver's talk prompt after the hand");
  await page.close();
}
{
  // level 3: the caregiver challenges the learner's (correct) value; the game checks it
  const seed = findSeed("g3-product-war", 3, 3, (r) => r.variant === "open" && r.rights.theirs);
  const page = await open(desktop, { grade: 3, skill: "g3-product-war", level: 3, seed, mode: "together" });
  const round = await roundOf(page);
  const rec = await solutionOf(page);
  await draft(page, "together", rec, round);
  await claim(page, CLAIM0, rec.claims[0], "click");
  ok((await phase(page)) === "claim0" || (await phase(page)) === "theirs", "the learner's value is locked in");
  ok(/do you challenge/i.test(await text(page, "[data-testid=duel-panel]")), "the caregiver is offered a challenge");
  await page.locator("[data-act=theirs-yes]").click();
  ok(/The game checked the challenge/.test(await text(page, ".fd-board[data-seat='0']")), "the game verifies the caregiver's challenge");
  await claim(page, CLAIM1, rec.claims[1], "click");
  if (rec.call.challenge) { await page.locator("[data-act=challenge]").click(); await claim(page, COUNTER, rec.call.counter, "click"); } else await page.locator("[data-act=agree]").click();
  await page.locator(`[data-verdict="${rec.verdict}"]`).click();
  await assertSolved(page, "caregiver challenge");
  ok(/Challenge checked/.test(await text(page, "[data-testid=duel-result]")), "the result records the checked challenge");
  await page.close();
}
{
  // Fair play: visible, bilingual, changeable until the first pick, locks the weakest card into the caregiver's expression
  const seed = findSeed("g3-product-war", 2, 3, (r) => r.variant === "open" && r.first === 0);
  const page = await open(desktop, { grade: 3, skill: "g3-product-war", level: 2, seed, mode: "together" });
  const round = await roundOf(page);
  ok(/Fair play/.test(await text(page, ".fd-fair")) && (await page.locator("[data-fair]").isEnabled()), "the Fair play setting is visible and available");
  await page.locator("[data-fair]").check();
  ok(/is locked into the caregiver/.test(await text(page, ".fd-goal")), "Fair play states which card it locks");
  const lockCard = round.cards[round.fair.card].text;
  ok((await page.locator(".fd-board[data-seat='1'] .fd-lock").count()) === 1 && (await page.locator(".fd-board[data-seat='1'] .fd-slot-full").getAttribute("aria-label")).includes(`Card ${lockCard}`), "the locked card sits in the caregiver's expression, marked 'locked'");
  ok((await page.locator(`.fd-card[data-card="${round.fair.card}"]`).getAttribute("data-taken")) === "true", "the locked card is off the table");
  await page.click("[data-fm2-lang]");
  ok(/Juego justo/.test(await text(page, ".fd-fair")) && /fijada/.test(await text(page, ".fd-board[data-seat='1']")), "Fair play is bilingual");
  await page.screenshot({ path: `${SHOTS}/fair-play-es-1440.png`, fullPage: true });
  await page.click("[data-fm2-lang]");
  // play a legal hand by hand: learner and caregiver alternate, then claim exact values computed from the cards
  const moves = [];
  let st = replay(round, moves, true);
  while (!st.complete) {
    const seat = st.turn;
    const card = round.pool.find((id) => !st.taken(seat, id));
    const slot = st.seats[seat].findIndex((c) => c === null);
    moves.push([seat, card, slot]);
    await placeMove(page, [seat, card, slot], "click");
    st = replay(round, moves, true);
  }
  ok(await page.locator("[data-fair]").isDisabled(), "Fair play cannot change after the first pick");
  const v = [seatValue(round, st.seats[0]), seatValue(round, st.seats[1])];
  const rec2 = { claims: [fmtValue(v[0], round.style), fmtValue(v[1], round.style)], call: { challenge: false }, verdict: winnerOf(round.goal, v[0], v[1]) };
  await finish(page, "together", rec2, round);
  await assertSolved(page, "Fair play hand");
  ok((await page.locator(".fd-board[data-seat='1'] .fd-lock").count()) === 1, "the locked card stays in place after the hand");
  await page.close();
}
stamp("PASS together mode: hand-over screens, private hands, a challenge each way, Fair play");

// ---- 10. phone: touch play, no overflow, no small targets --------------------------------------------------------------------------------------------------------------
{
  const touch = await h.context({ width: 375, height: 800, touch: true });
  const seed = findSeed("g3-product-war", 2, 3, (r) => r.variant === "open" && !r.orbit.slip);
  const page = await open(touch, { grade: 3, skill: "g3-product-war", level: 2, seed });
  const { round } = await (async () => { const round = await roundOf(page); const rec = await solutionOf(page); await draft(page, "solo", rec, round, "tap"); await page.screenshot({ path: `${SHOTS}/phone-claim-375.png`, fullPage: true }); await finish(page, "solo", rec, round, "tap"); return { round }; })();
  await assertSolved(page, `phone ${round.variant}`);
  await page.screenshot({ path: `${SHOTS}/phone-result-375.png`, fullPage: true });
  ok((await tooSmall(page)).length === 0, `no stage target is smaller than 44px: ${await tooSmall(page)}`);
  await page.close();
  const pg = await open(touch, { grade: 6, skill: "g6-order-of-ops", level: 3, seed: findSeed("g6-order-of-ops", 3, 6, (r) => r.variant === "private"), mode: "together" });
  await pg.screenshot({ path: `${SHOTS}/phone-handover-375.png` });
  ok((await tooSmall(pg)).length === 0, `the hand-over screen has no small targets: ${await tooSmall(pg)}`);
  await pg.tap("[data-act=handover-ok]");
  await pg.screenshot({ path: `${SHOTS}/phone-hand-375.png`, fullPage: true });
  ok((await tooSmall(pg)).length === 0, `a private hand has no small targets: ${await tooSmall(pg)}`);
  await pg.close();
  await touch.close();
  for (const [width, skill, grade, level, mode] of [[320, "g6-order-of-ops", 6, 2, "solo"], [320, "g2-two-digit-sums", 2, 1, "together"], [375, "g8-scinot", 8, 3, "solo"], [768, "g8-power", 8, 3, "together"], [1440, "g5-near-one", 5, 3, "solo"], [320, "g5-compare-values", 5, 3, "solo"]]) {
    const context = await h.context({ width, height: 800 });
    const seed = findSeed(skill, level, grade, (r) => r.variant === "open");
    const wide = await open(context, { grade, skill, level, mode, seed });
    const rec = await solutionOf(wide);
    const round = await roundOf(wide);
    await draft(wide, mode, rec, round);
    ok(!(await hasOverflow(wide)), `${skill}: no horizontal overflow at ${width}px while drafting`);
    ok((await tooSmall(wide)).length === 0, `${skill}: no small targets at ${width}px: ${await tooSmall(wide)}`);
    await wide.screenshot({ path: `${SHOTS}/${skill}-${width}.png`, fullPage: true });
    await finish(wide, mode, rec, round);
    ok(!(await hasOverflow(wide)), `${skill}: no horizontal overflow at ${width}px after the hand`);
    await context.close();
  }
}
stamp("PASS tap play on a phone, no horizontal overflow at 320, 375, 768 and 1440, no small targets");

// ---- 11. keyboard only ----------------------------------------------------------------------------------------------------------------------------------------------------
{
  const seed = findSeed("g2-place-number", 1, 2, (r) => r.variant === "open" && r.first === 0);
  const page = await open(desktop, { grade: 2, skill: "g2-place-number", level: 1, seed });
  const round = await roundOf(page);
  const rec = await solutionOf(page);
  const activeIs = (sel) => page.evaluate((s) => document.activeElement?.matches(s), sel);
  const tabTo = async (sel) => { for (let i = 0; i < 40 && !(await activeIs(sel)); i += 1) await page.keyboard.press("Tab"); ok(await activeIs(sel), `Tab reaches ${sel}`); };
  await tabTo(".fd-card");
  const focusedCard = () => page.evaluate(() => Number(document.activeElement.dataset.card));
  await page.keyboard.press("End");
  ok((await focusedCard()) === round.pool.at(-1), "End goes to the last card");
  await page.keyboard.press("Home");
  ok((await focusedCard()) === round.pool[0], "Home goes to the first card");
  await page.keyboard.press("ArrowLeft");
  ok((await focusedCard()) === round.pool[0], "ArrowLeft stops at the edge");
  for (const move of rec.moves.filter((m) => m[0] === 0)) {
    await page.keyboard.press("Home");
    for (let i = 0; i < round.pool.indexOf(move[1]); i += 1) await page.keyboard.press("ArrowRight");
    ok((await focusedCard()) === move[1], `arrow keys reach card ${move[1]}`);
    await page.keyboard.press("Enter");
    if (await activeIs(".fd-slot")) {
      for (let i = 0; i < 6 && Number(await page.evaluate(() => document.activeElement.dataset.slot)) !== move[2]; i += 1) await page.keyboard.press("ArrowRight");
      ok(Number(await page.evaluate(() => document.activeElement.dataset.slot)) === move[2], "arrow keys reach the slot");
      await page.keyboard.press("Enter");
    }
    if ((await phase(page)) === "draft") await tabTo(".fd-card");
  }
  ok((await phase(page)) === "claim0" && (await activeIs("#fd-in-claim0")), "focus moves to the value box when the draft ends");
  await page.keyboard.type(rec.claims[0]);
  await page.keyboard.press("Enter");
  ok(await activeIs("[data-verdict]"), "focus moves to the verdict buttons");
  for (let i = 0; i < rec.verdict; i += 1) await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await assertSolved(page, "keyboard");
  await page.close();
  // private hand with the keyboard: pick, place, take back with Enter on a placed card, lock in
  const sp = findSeed("g2-place-number", 1, 2, (r) => r.variant === "private" && r.first === 0);
  const pg = await open(desktop, { grade: 2, skill: "g2-place-number", level: 1, seed: sp });
  const r2 = await roundOf(pg); const s2 = await solutionOf(pg);
  const mine = s2.moves.filter((m) => m[0] === 0);
  await pg.locator(`.fd-card[data-card="${mine[0][1]}"]`).focus();
  await pg.keyboard.press("Enter");
  if (await pg.evaluate(() => document.activeElement?.matches(".fd-slot"))) { while (Number(await pg.evaluate(() => document.activeElement.dataset.slot)) !== mine[0][2]) await pg.keyboard.press("ArrowRight"); await pg.keyboard.press("Enter"); }
  const placed = await pg.locator(`button.fd-slot-full[data-seat="0"]`).count();
  ok(placed === 1, "a private card is placed with the keyboard");
  await pg.locator("button.fd-slot-full").focus();
  await pg.keyboard.press("Enter");
  ok((await pg.locator("button.fd-slot-full").count()) === 0, "Enter on a placed card takes it back");
  ok(r2.variant === "private" && (await pg.locator("[data-act=lock]").isDisabled()), "Lock in waits until every slot is filled");
  await pg.close();
}
stamp("PASS a whole hand is played with the keyboard alone");

// ---- 12. axe, both languages, mid-hand, at the hand-over screen and at the end ---------------------------------------------------------------------------------------------------------------
for (const lang of ["en", "es"]) {
  for (const [skill, grade, level, mode, pred] of [["g3-product-war", 3, 2, "solo", (r) => r.variant === "open"], ["g6-order-of-ops", 6, 3, "together", (r) => r.variant === "private"], ["g8-scinot", 8, 2, "solo", (r) => r.variant === "private"]]) {
    const seed = findSeed(skill, level, grade, pred);
    const page = await open(desktop, { grade, skill, level, mode, seed, lang });
    const scan = async (when) => { const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze(); ok(res.violations.length === 0, `axe (${lang}, ${skill}, ${when}): ${JSON.stringify(res.violations.map((v) => [v.id, v.nodes.slice(0, 2).map((n) => n.html.slice(0, 90))]))}`); };
    await scan("start");
    const rec = await solutionOf(page);
    const round = await roundOf(page);
    await draft(page, mode, rec, round, "click", { onHandover: async () => scan("hand-over") });
    await scan("claim");
    await finish(page, mode, rec, round);
    await assertSolved(page, `axe ${lang}`);
    await scan("finished");
    await page.close();
  }
}
stamp("PASS axe-core finds no wcag2a/aa violations in English or Spanish");

// ---- screenshots for the record --------------------------------------------------------------------------------------------------------------------------------------------------------------
for (const [width, lang] of [[1440, "en"], [768, "en"], [375, "en"], [375, "es"], [768, "es"], [1440, "es"]]) {
  const context = await h.context({ width, height: 900 });
  const seed = findSeed("g6-order-of-ops", 3, 6, (r) => r.variant === "open");
  const page = await open(context, { grade: 6, skill: "g6-order-of-ops", level: 3, seed, lang, mode: "together" });
  const rec = await solutionOf(page);
  const round = await roundOf(page);
  for (const m of rec.moves.slice(0, 4)) await placeMove(page, m, "click");
  await page.screenshot({ path: `${SHOTS}/table-${width}-${lang}.png`, fullPage: true });
  await context.close();
}

assertClean(h.problems, "family-math-duel");
await h.close();
console.log(`PASS family-math-duel acceptance: ${checks} checks in ${((Date.now() - started) / 1000).toFixed(0)}s`);
