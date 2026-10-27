// Number Line Quest acceptance suite, against the real play.html in Chromium. Rounds are solved through the UI only (mouse
// taps, touch taps, nudge buttons, keyboard); window.__fm2.solve() is read once to know WHAT to do, never to submit.
// Covers: open at several grades, how to play in both languages, real solves of PLACE, HOP, ROUND, ORDER and ZOOM rounds,
// a wrong answer then a fix, hint tiers and Show me, reset and start over, finishing with stars and saved progress, a second
// profile, resume, mid-round language switch, touch at 375px, overflow at four widths, 44px targets, keyboard-only play and
// axe in both languages. Screenshots go to /tmp/claude-501/fm2-shots/number-line-quest/.
// @fm2 FM-075 FM-012 FM-020 FM-021 FM-026 FM-034 FM-037 FM-038 FM-039 FM-040
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { PAD } from "../../math/fluency-lab/family/fm2/art/lines.js";
import game from "../../math/fluency-lab/family/fm2/games/number-line-quest/index.js";
import { assertClean, hasOverflow, launch } from "./harness.mjs";

const SHOTS = "/tmp/claude-501/fm2-shots/number-line-quest";
mkdirSync(SHOTS, { recursive: true });
let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks += 1;
};
const num = (f) => f.n / f.d;
const text = (page, selector) => page.locator(selector).first().innerText();
const rule = (page) => text(page, ".nlq-rule");

const lab = await launch();
const base = { game: "number-line-quest", rounds: 5, seed: 11 };
const url = (extra) => lab.play({ ...base, ...extra });

// What the learner would do, read from the shell's test seam (the answer is only used to choose the gestures).
const plan = (page) =>
  page.evaluate(() => ({
    round: JSON.parse(JSON.stringify(window.__fm2.round)),
    sol: JSON.parse(JSON.stringify(window.__fm2.solve())),
  }));

// ---- gestures: every way a learner can move a marker -------------------------------------------------------------------
async function boardBox(page) {
  const box = await page.locator(".nlq-board").boundingBox();
  ok(box && box.width > 200, "the board is on screen");
  return box;
}
const kOf = (x, min, step) => Math.round((num(x) - num(min)) / num(step));

async function moveTo(page, how, k, from, index = 0, count = 0) {
  if (how === "tap" || how === "touch") {
    const box = await boardBox(page);
    const x = box.x + PAD + ((box.width - 2 * PAD) * k) / count;
    const y = box.y + box.height - 46;
    if (how === "touch") await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
  } else if (how === "drag") {
    const box = await boardBox(page);
    const handle = await page.locator(".nlq-handle").nth(index).boundingBox();
    const [x, y] = [handle.x + handle.width / 2, handle.y + handle.height / 2];
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(box.x + PAD + ((box.width - 2 * PAD) * k) / count, y, { steps: 8 });
    await page.mouse.up();
  } else if (how === "keys") {
    const slider = page.locator(".nlq-handle").nth(index);
    await slider.focus();
    await page.keyboard.press("Home");
    await page.keyboard.down("Shift");
    for (let i = 0; i < Math.floor(k / 10); i += 1) await page.keyboard.press("ArrowRight");
    await page.keyboard.up("Shift");
    for (let i = 0; i < k % 10; i += 1) await page.keyboard.press("ArrowRight");
  } else {
    const delta = k - from;
    const [big, small] = [Math.trunc(delta / 10), delta % 10];
    for (let i = 0; i < Math.abs(big); i += 1)
      await page.locator(`[data-nudge="${big > 0 ? 10 : -10}"]`).click();
    for (let i = 0; i < Math.abs(small); i += 1)
      await page.locator(`[data-nudge="${small > 0 ? 1 : -1}"]`).click();
  }
  const reading = await page.locator(".nlq-handle").nth(index).getAttribute("aria-valuenow");
  return Number(reading);
}
const countOf = (line) => Math.round((num(line.max) - num(line.min)) / num(line.step));
const valueNow = async (page, index = 0) =>
  Number(await page.locator(".nlq-handle").nth(index).getAttribute("aria-valuenow"));

async function press(page, selector, how) {
  if (how === "keys") {
    await page.locator(selector).first().focus();
    await page.keyboard.press("Enter");
  } else if (how === "touch") await page.locator(selector).first().tap();
  else await page.locator(selector).first().click();
}

// Translate the round's solution into UI actions of the chosen kind of gesture, then press the round's own check button.
async function solveByUI(page, how = "tap", { submit = true } = {}) {
  const { round, sol } = await plan(page);
  const line = round.line;
  const n = countOf(line);
  const startK = (f) => kOf(f, line.min, line.step);
  if (round.kind === "place") {
    await moveTo(page, how, kOf(sol.x, line.min, line.step), startK(round.start), 0, n);
  } else if (round.kind === "round") {
    await moveTo(page, how, kOf(sol.x, line.min, line.step), startK(round.start), 0, n);
    const lo = num(sol.pick) === num(round.lo);
    await press(page, `[data-pick="${lo ? "lo" : "hi"}"]`, how);
  } else if (round.kind === "order") {
    for (let i = 0; i < round.items.length; i += 1) {
      await press(page, `[data-chip="${i}"]`, how === "keys" ? "keys" : "click");
      await moveTo(page, how, kOf(sol.xs[i], line.min, line.step), startK(round.starts[i]), i, n);
    }
  } else if (round.kind === "hop") {
    for (const hop of sol.hops) await press(page, `[data-hop="${hop.n}/${hop.d}"]`, how);
  } else {
    let low = num(round.zoom.outerMin);
    for (let i = 0; i < round.zoom.z; i += 1) {
      const slice = 10 ** -(i + 1);
      await moveTo(
        page,
        how === "touch" ? "touch" : how,
        Math.round((num(sol.path[i]) - low) / slice),
        0,
        0,
        10,
      );
      await press(page, "[data-zoomin]", how);
      low = num(sol.path[i]);
    }
    await moveTo(page, how, Math.round((num(sol.x) - low) / 10 ** -(round.zoom.z + 1)), 0, 0, 10);
  }
  if (submit) await press(page, "[data-check]", how === "keys" ? "keys" : how);
  return round;
}

async function assertSolved(page, label) {
  await page.waitForSelector(".fm2-feedback-good");
  ok(
    (await text(page, ".fm2-feedback-good")).includes("Correct!"),
    `${label}: shell says Correct!`,
  );
  ok(await page.locator("[data-fm2-next]").isVisible(), `${label}: Next appears`);
  ok(await page.evaluate(() => window.__fm2.tools.solved), `${label}: the shell recorded a solve`);
}

async function open(page, extra) {
  await page.goto(url(extra));
  await page.waitForSelector(".nlq");
}
const lang = (page) => page.evaluate(() => document.documentElement.lang);

// ---- 1. opens at grades 0, 3, 6, 8 with no console or network problems -----------------------------------------------------
for (const grade of [0, 3, 6, 8]) {
  const context = await lab.context({ width: 1024 });
  const page = await context.newPage();
  await open(page, { grade });
  const skill = await page.evaluate(() => window.__fm2.skillId);
  ok(
    game.skills.some((s) => s.id === skill && s.grades[0] <= grade && grade <= s.grades[1]),
    `grade ${grade} picks a skill`,
  );
  ok(
    (await text(page, "[data-fm2-prompt]")).length > 10 &&
      (await page.locator(".nlq-board").count()) === 1,
    `grade ${grade} opens`,
  );
  await context.close();
}

// ---- 2. How to play: steps visible in English and in Spanish ---------------------------------------------------------------
{
  const context = await lab.context();
  const page = await context.newPage();
  await open(page, { grade: 3, skill: "g3-fractions-line", level: 1 });
  for (const code of ["en", "es"]) {
    await page.locator("[data-fm2-howto]").click();
    const steps = await page.locator("[data-fm2-howto-steps] li").allInnerTexts();
    ok(
      steps.length === game.howTo[code].length && steps.every((s, i) => s === game.howTo[code][i]),
      `how to play in ${code}`,
    );
    ok(await page.locator("[data-fm2-dialog]").isVisible(), "the how-to dialog is open");
    await page.locator("[data-fm2-dialog-close]").click();
    if (code === "en") await page.locator("[data-fm2-lang]").click();
  }
  ok((await lang(page)) === "es", "Spanish stays on after the dialog");
  await context.close();
}

// ---- 3. real UI solves of three different skills (and the other two kinds) ------------------------------------------------
const SOLVES = [
  ["g3-fractions-line", 3, 2, "tap"],
  ["g1-hop-tens-ones", 1, 2, "tap"],
  ["g3-round-nearest", 3, 2, "tap"],
  ["g5-order-decimals", 5, 1, "nudge"],
  ["g6-opposite-absolute", 6, 2, "drag"],
  ["g5-zoom-decimals", 5, 2, "tap"],
  ["g8-square-roots", 8, 2, "tap"],
];
for (const [skill, grade, level, how] of SOLVES) {
  const context = await lab.context({ width: 1024 });
  const page = await context.newPage();
  await open(page, { grade, skill, level });
  await solveByUI(page, how);
  await assertSolved(page, `${skill} by ${how}`);
  await context.close();
}

// ---- 4 + 5 + 6a. a wrong answer, hints, Show me, reset, start over ----------------------------------------------------------
{
  const context = await lab.context({ width: 1024 });
  const page = await context.newPage();
  await open(page, { grade: 3, skill: "g3-fractions-line", level: 2 });
  const start = await valueNow(page);
  await page.locator("[data-check]").click();
  await page.waitForSelector(".fm2-feedback-try");
  const feedback = await text(page, ".fm2-feedback-try");
  ok(
    /Not yet/.test(feedback) && /right|left|slip|mark|flip|part/.test(feedback),
    `wrong answer gets named feedback: ${feedback}`,
  );
  ok(await page.locator("[data-fm2-next]").isHidden(), "no Next after a miss");
  ok(
    !(await page.locator(".fm2-feedback").innerText()).includes("Correct"),
    "a miss is not a success",
  );
  const tiers = [];
  for (let i = 0; i < 3; i += 1) {
    await page.locator("[data-fm2-hint]").click();
    tiers.push(await text(page, "[data-fm2-hintbox]"));
  }
  ok(
    new Set(tiers).size === 3 && tiers.every((t) => t.length > 20),
    "three different hint tiers appear",
  );
  await moveTo(page, "tap", 1, 0, 0, countOf((await plan(page)).round.line));
  ok((await valueNow(page)) !== start, "the marker moved");
  await page.locator("[data-fm2-reset]").click();
  ok((await valueNow(page)) === start, "Reset this puzzle puts the marker back");
  await page.locator("[data-check]").click();
  await page.locator("[data-check]").click();
  ok(await page.locator("[data-fm2-showme]").isVisible(), "Show me appears after three misses");
  await page.locator("[data-fm2-showme]").click();
  ok(
    (await page.locator("[data-fm2-hintbox]").getAttribute("data-tier")) === "3",
    "Show me shows the full solution",
  );
  ok(await page.locator("[data-fm2-next]").isVisible(), "Next after Show me");
  ok(!(await page.evaluate(() => window.__fm2.tools.solved)), "a revealed round is not a solve");
  await page.locator("[data-fm2-restart]").click();
  ok(
    (await text(page, "[data-fm2-round]")) === "Round 1 of 5" &&
      (await page.evaluate(() => window.__fm2.tools.attempts)) === 0,
    "Start over",
  );
  // a miss through the UI, then the fix through the UI
  await page.locator("[data-check]").click();
  await page.waitForSelector(".fm2-feedback-try");
  await solveByUI(page, "tap");
  await assertSolved(page, "fixed after a miss");
  await context.close();
}

// ---- 6b. a full five-round activity: stars, saved progress, a second profile -----------------------------------------------
{
  const context = await lab.context({ width: 1024 });
  const page = await context.newPage();
  await open(page, { grade: 3, skill: "g3-fractions-line", level: 2, seed: 4 });
  for (const how of ["tap", "keys", "nudge", "drag", "tap"]) {
    await solveByUI(page, how);
    await assertSolved(page, `round by ${how}`);
    await page.locator("[data-fm2-next]").click();
  }
  await page.waitForSelector("[data-fm2-finish]:not([hidden])");
  ok(
    /3 of 3 stars/.test(
      await page.locator("[data-fm2-finish] [role=img]").getAttribute("aria-label"),
    ),
    "five clean solves earn three stars",
  );
  const store = await page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fm2-v1")));
  ok(
    store.skills["number-line-quest:g3-fractions-line"].plays === 5,
    "the skill record counts five plays",
  );
  ok(store.games["number-line-quest"].completed === 1, "the activity is recorded as completed");
  ok(store.resume === null, "a finished activity leaves nothing to resume");
  await open(page, { grade: 3, skill: "g3-fractions-line", level: 2, profile: 1 });
  const other = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ewl-fm2-v1:profile-1") || "null"),
  );
  ok(
    !other?.skills?.["number-line-quest:g3-fractions-line"],
    "a second profile has no such record",
  );
  await context.close();
}

// ---- 7. resume mid-activity ------------------------------------------------------------------------------------------------
{
  const context = await lab.context({ width: 1024 });
  const page = await context.newPage();
  await open(page, { grade: 1, skill: "g1-hop-tens-ones", level: 1, seed: 9 });
  for (let i = 0; i < 2; i += 1) {
    await solveByUI(page, "tap");
    await assertSolved(page, `resume round ${i + 1}`);
    await page.locator("[data-fm2-next]").click();
  }
  const before = await page.evaluate(() => ({
    index: window.__fm2.index,
    round: window.__fm2.round,
  }));
  await page.goto(url({ grade: 1, skill: "g1-hop-tens-ones", level: 1, seed: 9, resume: 1 }));
  await page.waitForSelector(".nlq");
  const after = await page.evaluate(() => ({
    index: window.__fm2.index,
    round: window.__fm2.round,
    results: window.__fm2.results,
  }));
  ok(after.index === 2 && before.index === 2, "resume returns to round 3");
  ok(
    JSON.stringify(after.round) === JSON.stringify(before.round),
    "resume rebuilds the same round from the seed",
  );
  ok(
    after.results.length === 2 && after.results.every((r) => r.correct),
    "earlier results are restored",
  );
  ok((await text(page, "[data-fm2-round]")) === "Round 3 of 5", "the round label says 3 of 5");
  await context.close();
}

// ---- 8. language switch keeps the work in progress ---------------------------------------------------------------------------
{
  const context = await lab.context({ width: 1024 });
  const page = await context.newPage();
  await open(page, { grade: 3, skill: "g3-fractions-line", level: 2, seed: 6 });
  const { round } = await plan(page);
  const n = countOf(round.line);
  await moveTo(page, "keys", 3, 0, 0, n);
  const placed = await valueNow(page);
  const english = {
    rule: await rule(page),
    label: await page.locator(".nlq-handle").getAttribute("aria-label"),
  };
  await page.locator("[data-fm2-lang]").click();
  ok((await lang(page)) === "es", "Spanish is on");
  const spanish = {
    rule: await rule(page),
    label: await page.locator(".nlq-handle").getAttribute("aria-label"),
  };
  ok(
    spanish.rule !== english.rule &&
      /Arrastra/.test(spanish.rule) &&
      /Marcador/.test(spanish.label),
    "the interaction's labels change",
  );
  ok((await valueNow(page)) === placed, "the marker stays where it was put");
  ok(
    /Marcador en/.test(await text(page, ".nlq-readout")) &&
      /Comprobar/.test(await text(page, "[data-check]")),
    "readout and buttons are Spanish",
  );
  await solveByUI(page, "tap");
  await page.waitForSelector(".fm2-feedback-good");
  ok((await text(page, ".fm2-feedback-good")).includes("Correcto"), "Spanish success message");
  await page.locator("[data-fm2-lang]").click();
  ok(/Marker/.test(await page.locator(".nlq-handle").getAttribute("aria-label")), "English again");
  await context.close();
  // hops and zoom keep their work too
  const ctx2 = await lab.context({ width: 1024 });
  const hop = await ctx2.newPage();
  await open(hop, { grade: 1, skill: "g1-hop-tens-ones", level: 1, seed: 3 });
  const hopRound = (await plan(hop)).round;
  const first = hopRound.hops[0];
  await hop.locator(`[data-hop="${first.n}/${first.d}"]`).click();
  const equation = await text(hop, ".nlq-equation");
  await hop.locator("[data-fm2-lang]").click();
  ok(
    (await text(hop, ".nlq-equation")).includes("Ecuación") &&
      (await text(hop, ".nlq-equation")).includes(equation.split(": ")[1]),
    "hops survive a language switch",
  );
  ok(/Saltos usados: 1/.test(await text(hop, ".nlq-readout")), "hop count survives in Spanish");
  await solveByUI(hop, "tap", { submit: false });
  await ctx2.close();
  const ctx3 = await lab.context({ width: 1024 });
  const zoom = await ctx3.newPage();
  await open(zoom, { grade: 5, skill: "g5-zoom-decimals", level: 2, seed: 2 });
  const zr = await plan(zoom);
  await moveTo(
    zoom,
    "keys",
    Math.round((num(zr.sol.path[0]) - num(zr.round.zoom.outerMin)) / 0.1),
    0,
    0,
    10,
  );
  await zoom.locator("[data-zoomin]").click();
  const windowText = await text(zoom, ".nlq-window");
  await zoom.locator("[data-fm2-lang]").click();
  const digits = (t) => (t.match(/\d+\.\d+/g) || []).join();
  const zoomEs = await text(zoom, ".nlq-window");
  ok(
    zoomEs.startsWith("Ventana") && digits(zoomEs) === digits(windowText),
    "the zoom window survives",
  );
  await ctx3.close();
}

// order and round rounds keep their work across a language switch, and together mode shows the family prompts
{
  const context = await lab.context({ width: 1024 });
  const page = await context.newPage();
  await open(page, { grade: 6, skill: "g6-order-rationals", level: 2, seed: 7 });
  await page.locator('[data-chip="1"]').click();
  await page.locator('[data-nudge="1"]').click();
  await page.locator('[data-nudge="10"]').click();
  const placed = [await valueNow(page, 0), await valueNow(page, 1)];
  const now = await text(page, ".nlq-now");
  await page.locator("[data-fm2-lang]").click();
  ok(
    (await valueNow(page, 0)) === placed[0] && (await valueNow(page, 1)) === placed[1],
    "markers keep their places in Spanish",
  );
  ok(
    /Marcador B/.test(await page.locator(".nlq-handle").nth(1).getAttribute("aria-label")),
    "marker names are Spanish",
  );
  ok(
    /De izquierda a derecha/.test(await text(page, ".nlq-now")) &&
      (await text(page, ".nlq-now")).includes(now.split(": ")[1]),
    "order line",
  );
  ok(
    /Marcador B/.test(await text(page, '[data-chip="1"]')) &&
      (await page.locator('[data-chip="1"]').getAttribute("aria-pressed")) === "true",
    "the picked marker stays picked",
  );
  await solveByUI(page, "tap");
  await page.waitForSelector(".fm2-feedback-good");
  await context.close();
  const ctx2 = await lab.context({ width: 1024 });
  const round = await ctx2.newPage();
  await open(round, { grade: 3, skill: "g3-round-nearest", level: 1, seed: 5 });
  await round.locator('[data-pick="hi"]').click();
  await round.locator("[data-fm2-lang]").click();
  ok(
    (await round.locator('[data-pick="hi"]').getAttribute("aria-pressed")) === "true" &&
      /Más cerca/.test(await text(round, '[data-pick="hi"]')),
    "the picked benchmark survives",
  );
  await ctx2.close();
  const ctx3 = await lab.context({ width: 1024 });
  const together = await ctx3.newPage();
  await open(together, { grade: 3, skill: "g3-fractions-line", level: 1, mode: "together" });
  ok(await together.locator("[data-fm2-turn]").isVisible(), "together mode shows whose turn it is");
  await solveByUI(together, "tap");
  await assertSolved(together, "together mode");
  ok(
    await together.locator("[data-fm2-explain]").isVisible(),
    "together mode asks the family to talk it over",
  );
  await ctx3.close();
}

// ---- 9. touch at 375px, overflow at four widths, 44px targets ---------------------------------------------------------------
{
  const context = await lab.context({ width: 375, height: 800, touch: true });
  const page = await context.newPage();
  for (const [skill, grade, level] of [
    ["g3-fractions-line", 3, 2],
    ["g1-hop-tens-ones", 1, 2],
    ["g6-order-rationals", 6, 1],
    ["g3-round-nearest", 3, 1],
  ]) {
    await open(page, { grade, skill, level, seed: 5 });
    await solveByUI(page, "touch");
    await assertSolved(page, `${skill} by touch at 375px`);
  }
  await context.close();
}
const STAGE_TARGETS = () =>
  [
    ...document.querySelectorAll(
      "[data-fm2-stage] :is(button, a[href], select, input, [role=slider], [role=button])",
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
        `${e.tagName}:${(e.textContent || e.getAttribute("aria-label") || "").slice(0, 20)}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`,
    );
for (const width of [320, 375, 768, 1440]) {
  const context = await lab.context({ width, height: 900 });
  const page = await context.newPage();
  for (const [skill, grade, level] of [
    ["g3-fractions-line", 3, 3],
    ["g1-hop-tens-ones", 1, 3],
    ["g6-order-rationals", 6, 3],
    ["g5-zoom-decimals", 5, 3],
    ["g8-scientific-positions", 8, 2],
    ["g5-round-decimals", 5, 3],
  ]) {
    await open(page, { grade, skill, level, seed: 8 });
    ok(!(await hasOverflow(page)), `${skill} has no horizontal overflow at ${width}px`);
    const small = await page.evaluate(STAGE_TARGETS);
    ok(small.length === 0, `${skill} at ${width}px has only 44px targets in the stage: ${small}`);
    const box = await page.locator(".nlq-board").boundingBox();
    ok(box.x >= 0 && box.x + box.width <= width + 1, `${skill}: the board fits inside ${width}px`);
  }
  await context.close();
}

// ---- 10. keyboard only: Tab to the controls, arrows to move, Enter to answer -------------------------------------------------
{
  const context = await lab.context({ width: 1024 });
  const page = await context.newPage();
  const tabTo = async (selector) => {
    for (let i = 0; i < 60; i += 1) {
      if (await page.evaluate((s) => document.activeElement?.matches(s), selector)) return;
      await page.keyboard.press("Tab");
    }
    throw new Error(`could not Tab to ${selector}`);
  };
  await open(page, { grade: 3, skill: "g3-fractions-line", level: 2, seed: 12 });
  const { round, sol } = await plan(page);
  await tabTo("[role=slider]");
  ok(
    (await page.locator("[role=slider]").getAttribute("aria-valuetext")).length > 0,
    "the slider speaks in words",
  );
  const k = kOf(sol.x, round.line.min, round.line.step);
  await page.keyboard.press("Home");
  for (let i = 0; i < k; i += 1) await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await assertSolved(page, "keyboard-only place round");
  await page.keyboard.press("Enter");
  ok(/Round 2/.test(await text(page, "[data-fm2-round]")), "Enter on the focused Next moves on");
  // a hop round and a round-and-pick round, with Tab navigation to each button
  await open(page, { grade: 1, skill: "g1-hop-tens-ones", level: 1, seed: 13 });
  const hop = await plan(page);
  for (const h of hop.sol.hops) {
    await tabTo(`[data-hop="${h.n}/${h.d}"]`);
    await page.keyboard.press("Space");
  }
  await tabTo("[data-check]");
  await page.keyboard.press("Enter");
  await assertSolved(page, "keyboard-only hop round");
  await open(page, { grade: 3, skill: "g3-round-nearest", level: 1, seed: 14 });
  await solveByUI(page, "keys");
  await assertSolved(page, "keyboard-only round-and-pick");
  await open(page, { grade: 5, skill: "g5-zoom-decimals", level: 2, seed: 15 });
  await solveByUI(page, "keys");
  await assertSolved(page, "keyboard-only zoom");
  await open(page, { grade: 6, skill: "g6-order-rationals", level: 1, seed: 16 });
  await solveByUI(page, "keys");
  await assertSolved(page, "keyboard-only order");
  await context.close();
}

// ---- 11. axe-core in both languages --------------------------------------------------------------------------------------------
{
  const context = await lab.context({ width: 1024 });
  const page = await context.newPage();
  for (const [skill, grade, level] of [
    ["g3-fractions-line", 3, 2],
    ["g1-hop-tens-ones", 1, 2],
    ["g6-order-rationals", 6, 2],
    ["g5-zoom-decimals", 5, 2],
    ["g3-round-nearest", 3, 2],
  ]) {
    await open(page, { grade, skill, level, lang: "en" });
    for (const code of ["en", "es"]) {
      if ((await lang(page)) !== code) await page.locator("[data-fm2-lang]").click();
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      ok(
        result.violations.length === 0,
        `axe ${skill} (${code}): ${result.violations.map((v) => `${v.id} ${v.nodes.map((n) => n.target).join(" | ")}`).join("; ")}`,
      );
    }
  }
  await context.close();
}

// ---- screenshots to look at ---------------------------------------------------------------------------------------------------
for (const [skill, grade, level] of [
  ["g3-fractions-line", 3, 2],
  ["g1-hop-tens-ones", 1, 2],
  ["g6-order-rationals", 6, 2],
  ["g5-zoom-decimals", 5, 2],
  ["g8-square-roots", 8, 2],
  ["g4-frac-dec", 4, 3],
]) {
  for (const [width, code] of [
    [1440, "en"],
    [768, "en"],
    [375, "en"],
    [375, "es"],
  ]) {
    const context = await lab.context({ width, height: 900, touch: width < 500 });
    const page = await context.newPage();
    await open(page, { grade, skill, level, seed: 21, lang: code });
    if (skill === "g1-hop-tens-ones") {
      const { round } = await plan(page);
      for (const h of round.hops.slice(0, 2))
        await page.locator(`[data-hop="${h.n}/${h.d}"]`).click();
    }
    await page.addStyleTag({ content: ".fm2-toolbar { position: static !important; }" });
    await page.screenshot({ path: `${SHOTS}/${skill}-${width}-${code}.png`, fullPage: true });
    await context.close();
  }
}

assertClean(lab.problems, "number-line-quest");
await lab.close();
console.log(`number-line-quest acceptance: ${checks} checks passed.`);
