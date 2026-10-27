// biome-ignore-all format: one-line assertions keep this suite readable and inside the file-size cap
// Acceptance suite for Pattern Detective (game 7), against the real play.html: real clicks, taps, typing and key presses
// on the probe box, the clue table, the rule builder and the prediction, never window.__fm2.submit. The test seam is used
// only to read the round's own solution (solve()) so the suite knows which probes and which rule to play through the
// interface. Screenshots land in /tmp/claude-501/fm2-shots/pattern-detective/.
// @fm2 FM-013 FM-076 FM-070 FM-071 FM-072 FM-073 FM-074 FM-075 FM-077 FM-078 FM-079 FM-038 FM-039 FM-040 FM-037 FM-020 FM-021 FM-026
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { assertClean, hasOverflow, launch, smallTargets } from "./harness.mjs";

const SHOTS = "/tmp/claude-501/fm2-shots/pattern-detective";
mkdirSync(SHOTS, { recursive: true });
let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};
const h = await launch();
const started = Date.now();
const GAME = "pattern-detective";
const stamp = (text) => console.log(`[${((Date.now() - started) / 1000).toFixed(0)}s]`, text);

async function open(context, params) {
  const page = await context.newPage();
  await page.goto(h.play({ game: GAME, rounds: 5, seed: 7, lang: "en", ...params }));
  await page.waitForSelector(".pd");
  return page;
}
const roundOf = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__fm2.round)));
const solutionOf = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__fm2.solve())));
const text = (page, selector) => page.locator(selector).first().innerText();
const tooSmall = async (page) =>
  (await smallTargets(page)).filter((t) => !/^a:Skip to the activity|Save \/ Resume/.test(t));
const press = (page, selector, how) =>
  how === "tap" ? page.locator(selector).first().tap() : page.locator(selector).first().click();
const act = (page, name, how, extra = "") => press(page, `[data-act="${name}"]${extra}`, how);
const left = async (page) => text(page, "[data-pd-left]");
const tableRows = (page) => page.locator(".pd-table tbody tr").count();

// ---- the interface drivers --------------------------------------------------------------------------------------------
async function probeAll(page, round, plan, how = "click") {
  for (const p of plan) {
    if (round.form === "cycle") await act(page, "cell", how, `[data-x="${p.x}"]`);
    else {
      if (round.machines.length > 1) await act(page, "machine", how, `[data-m="${p.m}"]`);
      await page.fill('[data-key="x"]', String(p.x));
      await act(page, "probe", how);
    }
  }
}
async function setField(page, path, value) {
  if (/(^|\.)op[12]?$/.test(path))
    await page.locator(`[data-act="set"][data-path="${path}"][data-value="${value}"]`).click();
  else await page.locator(`[data-path="${path}"]`).first().fill(value);
}
async function stateRule(page, round, fields, how = "click") {
  if (round.form === "cycle") {
    for (const id of fields.core) await act(page, "core-add", how, `[data-id="${id}"]`);
  } else if (round.form === "seq") {
    for (const [k, v] of Object.entries(fields))
      if (k !== "op" || round.say.op === "both") await setField(page, k, v);
  } else if (round.form === "two") {
    for (const side of ["A", "B"])
      for (const [k, v] of Object.entries(fields[side]))
        if (k !== "op" || round.say.op === "both") await setField(page, `${side}.${k}`, v);
  } else if (round.form === "typed") await page.fill('[data-key="typed"]', fields.text);
  else if (round.form === "line") {
    await setField(page, "m", fields.m);
    if (!round.say.lockB) await setField(page, "b", fields.b);
  } else {
    await setField(page, "op1", fields.op1);
    await setField(page, "a", fields.a);
    if (fields.op2 !== "none") {
      await setField(page, "op2", fields.op2);
      await setField(page, "b", fields.b);
    }
  }
}
async function predict(page, round, sol, far, how = "click") {
  if (round.cls) await act(page, "cls", how, `[data-id="${sol.cls}"]`);
  if (round.form === "cycle") await act(page, "far-sym", how, `[data-id="${far}"]`);
  else await page.fill('[data-key="far"]', far);
}
// The whole case: probes, rule, prediction, check. `far` overrides the prediction (to make a miss).
async function solveByUi(page, { how = "click", far = null, skipCheck = false } = {}) {
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  await probeAll(page, round, sol.probe, how);
  await stateRule(page, round, sol.fields, how);
  await predict(page, round, sol, far ?? sol.far, how);
  if (!skipCheck) await act(page, "check", how);
  return { round, sol };
}
const wrongFar = (round, sol) =>
  round.form === "cycle"
    ? round.alpha.find((s) => s !== sol.far)
    : String(Number(sol.far.split("/")[0]) + 1000003);
async function assertSolved(page, label) {
  await page.waitForFunction(() => /Correct!|¡Correcto!/.test(document.querySelector("[data-fm2-feedback]")?.textContent || ""));
  ok(await page.locator("[data-fm2-next]").isVisible(), `${label}: Next appears after the case is solved`);
  ok((await page.locator(".pd-solved").isVisible()) && (await page.locator('[data-act="check"]').isDisabled()), `${label}: the screen locks after success`);
}

// ---- 1. opens at several grades with no errors -----------------------------------------------------------------------------
const desktop = await h.context({ width: 1440, height: 900 });
for (const [grade, skill, level] of [
  [0, "k-core", 1],
  [3, "g3-times-table", 2],
  [6, "g6-io-table", 2],
  [8, "g8-slope", 2],
]) {
  const page = await open(desktop, { grade, skill, level });
  const round = await roundOf(page);
  ok(round.skillId === skill && round.grade === grade && round.level === level, `grade ${grade}: the ${skill} round opens`);
  ok(new RegExp(`Probes left: ${round.probes} of ${round.probes}`).test(await left(page)), `grade ${grade}: the probe allowance is shown`);
  ok((await text(page, "[data-fm2-prompt]")).length > 60, `grade ${grade}: the prompt is shown`);
  ok(!(await hasOverflow(page)), `grade ${grade}: no horizontal overflow`);
  await page.close();
}
stamp("PASS opens at grades 0, 3, 6 and 8 with a clean console");

// ---- 2. how to play, in both languages ---------------------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 3, skill: "g3-times-table", level: 2 });
  await page.click("[data-fm2-howto]");
  ok(await page.locator("dialog[open]").isVisible(), "How to play opens");
  const steps = await page.$$eval("[data-fm2-howto-steps] li", (items) => items.map((li) => li.textContent));
  ok(steps.length >= 3 && steps.every((s) => s.length > 20) && steps[0].startsWith("A rule is hidden"), "English steps are visible");
  await page.click("[data-fm2-dialog-close]");
  await page.click("[data-fm2-lang]");
  await page.click("[data-fm2-howto]");
  const es = await page.$$eval("[data-fm2-howto-steps] li", (items) => items.map((li) => li.textContent));
  ok(es.length === steps.length && es[0].startsWith("Hay una regla escondida") && es.every((s, i) => s !== steps[i]), "Spanish steps are visible and different");
  await page.screenshot({ path: `${SHOTS}/how-to-es-1440.png` });
  await page.click("[data-fm2-dialog-close]");
  await page.close();
}
stamp("PASS how to play opens in English and Spanish");

// ---- 3. real interaction solves a round of each of several skills --------------------------------------------------------------
for (const [skill, grade, level] of [
  ["k-core", 0, 2],
  ["g1-grow-shape", 1, 1],
  ["g3-times-table", 3, 2],
  ["g4-rule-pattern", 4, 3],
  ["g5-two-rules", 5, 2],
  ["g6-variables", 6, 3],
  ["g7-proportional", 7, 2],
  ["g8-linear-nonlinear", 8, 3],
]) {
  const page = await open(desktop, { grade, skill, level });
  const { round, sol } = await solveByUi(page);
  await assertSolved(page, skill);
  ok((await text(page, "[data-fm2-feedback]")).includes("Correct!"), `${skill}: the shell says Correct!`);
  ok((await tableRows(page)) === (round.form === "cycle" ? 0 : round.seed.length + sol.probe.length), `${skill}: the clue table has one row per clue`);
  if (round.form === "cycle")
    ok((await page.locator('.pd-cell[data-state="shown"]').count()) === round.seed.length + sol.probe.length, `${skill}: revealed cells are shown`);
  if (skill === "g1-grow-shape")
    ok((await page.locator(".pd-fig").count()) === round.seed.length + sol.probe.length, `${skill}: each probed figure is drawn`);
  if (skill === "g6-variables")
    await page.screenshot({ path: `${SHOTS}/solved-g6-variables-1440.png`, fullPage: true });
  await page.close();
}
stamp("PASS real clicks and typing solve rounds of eight different skills");

// ---- 4. wrong answers through the interface, then the fix ------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 4, skill: "g4-rule-pattern", level: 2 });
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  await probeAll(page, round, sol.probe);
  const bent = { ...sol.fields, start: String(Number(sol.fields.start) + 1) };
  await stateRule(page, round, bent);
  await predict(page, round, sol, sol.far);
  await act(page, "check");
  let feedback = await text(page, "[data-fm2-feedback]");
  ok(feedback.includes("Not yet") && feedback.includes("Check your clue table"), `a rule that breaks a clue is answered with the clue: ${feedback}`);
  ok(!(await page.locator("[data-fm2-next]").isVisible()), "no Next after a wrong rule");
  ok(!(await text(page, "[data-fm2-feedback]")).includes(sol.far) || sol.far.length < 3, "the feedback does not state the answer");
  ok(await page.locator('[data-act="check"]').isEnabled(), "the learner can fix the rule and check again");
  await setField(page, "start", sol.fields.start);
  await page.fill('[data-key="far"]', String(Number(sol.far) + 1000003));
  await act(page, "check");
  feedback = await text(page, "[data-fm2-feedback]");
  ok(feedback.includes("Not yet") && feedback.includes("Your rule is right"), `a right rule with a slipped prediction is told so: ${feedback}`);
  ok(!(await page.locator("[data-fm2-next]").isVisible()), "still no Next");
  ok((await page.locator('[data-path="start"]').inputValue()) === sol.fields.start, "the work is kept after a miss");
  await page.fill('[data-key="far"]', sol.far);
  await act(page, "check");
  await assertSolved(page, "fixed through the interface");
  await page.close();
}
stamp("PASS a wrong rule and a wrong prediction are answered, then corrected through the interface");

// ---- 5. hints and Show me ------------------------------------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 3, skill: "g3-times-table", level: 2 });
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  const seen = [];
  for (let i = 0; i < 3; i += 1) {
    await page.click("[data-fm2-hint]");
    const box = await text(page, "[data-fm2-hintbox]");
    seen.push(box);
    if (i < 2)
      ok(!new RegExp(`(^|[^0-9])${sol.far}([^0-9]|$)`).test(box), `hint ${i + 1} does not state the faraway answer ${sol.far}`);
  }
  ok(new Set(seen).size === 3 && seen[0].includes("Hint 1") && seen[2].includes("Hint 3"), "three hint tiers, each different");
  await probeAll(page, round, sol.probe);
  await stateRule(page, round, sol.fields);
  for (let i = 0; i < 3; i += 1) {
    await predict(page, round, sol, wrongFar(round, sol));
    await act(page, "check");
  }
  ok(await page.locator("[data-fm2-showme]").isVisible(), "Show me appears after three misses");
  await page.click("[data-fm2-showme]");
  const shown = await text(page, "[data-fm2-hintbox]");
  ok(new RegExp(`(^|[^0-9])${sol.far}([^0-9]|$)`).test(shown) && shown.includes("The rule is"), `Show me states the whole solution: ${shown}`);
  ok(await page.locator("[data-fm2-next]").isVisible(), "Next appears after Show me");
  await page.waitForFunction(() => document.querySelector('[data-act="check"]')?.disabled);
  ok(true, "the controls lock after Show me");
  await page.close();
}
stamp("PASS hint tiers and Show me");

// ---- 6. reset, start over, a five-round activity, stars and storage ------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 2, skill: "g2-skip", level: 1 });
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  await probeAll(page, round, sol.probe.slice(0, 2));
  ok((await tableRows(page)) === 2 + round.seed.length, "two probes fill two rows");
  ok(new RegExp(`${round.probes - 2} of ${round.probes}`).test(await left(page)), "probes left goes down");
  await page.click("[data-fm2-reset]");
  ok(new RegExp(`Probes left: ${round.probes} of ${round.probes}`).test(await left(page)) && (await tableRows(page)) === (round.seed.length || 1), "Reset this puzzle gives the probes back and empties the table");
  await probeAll(page, round, sol.probe.slice(0, 1));
  await page.click("[data-fm2-restart]");
  ok((await page.evaluate(() => window.__fm2.index)) === 0 && (await text(page, ".fm2-round-label")).includes("Round 1 of 5"), "Start over returns to round 1");
  for (let i = 0; i < 5; i += 1) {
    await solveByUi(page);
    await assertSolved(page, `round ${i + 1}`);
    await page.click("[data-fm2-next]");
  }
  await page.waitForSelector("[data-fm2-finish]:not([hidden])");
  const stars = await page.getAttribute(".fm2-stars", "aria-label");
  ok(/^[0-3] of 3 stars$/.test(stars) && stars.startsWith("3"), `the finish screen shows stars: ${stars}`);
  const record = await page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fm2-v1")));
  ok(record.skills["pattern-detective:g2-skip"]?.plays === 5, `the skill record counts five plays: ${JSON.stringify(record.skills)}`);
  ok(record.games["pattern-detective"]?.plays === 1 && record.games["pattern-detective"].bestStars === 3, "the game record counts the activity");
  await page.screenshot({ path: `${SHOTS}/finish-1440.png` });
  const second = await open(desktop, { grade: 2, skill: "g2-skip", level: 1, profile: 1 });
  const other = await second.evaluate(() => JSON.parse(localStorage.getItem("ewl-fm2-v1:profile-1") || "null"));
  ok(!other || !other.skills["pattern-detective:g2-skip"], "a second profile has no such record");
  await second.close();
  await page.close();
}
stamp("PASS reset, start over, five rounds, stars, storage and profile separation");

// ---- 7. leave and return -----------------------------------------------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 5, skill: "g5-numerical-pattern", level: 1 });
  for (let i = 0; i < 2; i += 1) {
    await solveByUi(page);
    await assertSolved(page, `resume round ${i + 1}`);
    await page.click("[data-fm2-next]");
  }
  const before = await roundOf(page);
  const beforeIndex = await page.evaluate(() => window.__fm2.index);
  await page.goto(h.play({ game: GAME, resume: 1 }));
  await page.waitForSelector(".pd");
  const after = await roundOf(page);
  ok((await page.evaluate(() => window.__fm2.index)) === beforeIndex && beforeIndex === 2, "resume reopens the same round number");
  ok(JSON.stringify(after) === JSON.stringify(before), "resume rebuilds the identical round from the seed");
  ok((await page.evaluate(() => window.__fm2.results.filter((r) => r.correct).length)) === 2, "resume keeps the earlier results");
  await page.close();
}
stamp("PASS resume=1 restores the round and results");

// ---- 8. language switch keeps the work -----------------------------------------------------------------------------------------------------
{
  const page = await open(desktop, { grade: 5, skill: "g5-numerical-pattern", level: 2 });
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  await probeAll(page, round, sol.probe);
  await setField(page, "op1", sol.fields.op1);
  await setField(page, "a", sol.fields.a);
  const rows = await tableRows(page);
  await page.click("[data-fm2-lang]");
  ok(/Pruebas que quedan/.test(await left(page)), "the probe labels switch to Spanish");
  ok((await text(page, ".pd-table caption")) === "Tabla de pistas" && (await page.locator('label[for="pd-x"]').innerText()).includes("para probar"), "the table and the probe label are Spanish");
  ok((await tableRows(page)) === rows && (await page.locator('[data-path="a"]').inputValue()) === sol.fields.a, "the clues and the half-built rule are kept");
  ok((await page.locator('[data-path="op1"][aria-pressed="true"]').getAttribute("data-value")) === sol.fields.op1, "the chosen operation is kept");
  await page.screenshot({ path: `${SHOTS}/es-g5-numerical-1440.png`, fullPage: true });
  if (sol.fields.op2 !== "none") {
    await setField(page, "op2", sol.fields.op2);
    await setField(page, "b", sol.fields.b);
  }
  await page.fill('[data-key="far"]', sol.far);
  await act(page, "check");
  await page.waitForFunction(() => /¡Correcto!/.test(document.querySelector("[data-fm2-feedback]")?.textContent || ""));
  await page.click("[data-fm2-lang]");
  ok(/Probes left/.test(await left(page)) && (await tableRows(page)) === rows, "switching back to English keeps everything");
  await page.close();
  const cyc = await open(desktop, { grade: 0, skill: "k-core", level: 2 });
  const cround = await roundOf(cyc);
  const csol = await solutionOf(cyc);
  await probeAll(cyc, cround, csol.probe);
  await stateRule(cyc, cround, csol.fields);
  await cyc.click("[data-fm2-lang]");
  const labels = await cyc.locator(".pd-slot").allInnerTexts();
  const es = { circle: "círculo", square: "cuadrado", triangle: "triángulo", star: "estrella" };
  ok(labels.length === csol.fields.core.length && labels.every((l, i) => l.includes(es[csol.fields.core[i]])), `core pieces stay and read in Spanish: ${labels}`);
  ok((await cyc.locator('.pd-cell[data-state="shown"]').count()) === cround.seed.length + csol.probe.length, "revealed cells stay revealed");
  await cyc.click("[data-fm2-lang]");
  await cyc.close();
}
stamp("PASS language switch keeps probes, clues and the half-built rule");

// ---- 9. mobile touch and layout ----------------------------------------------------------------------------------------------------------------
{
  const touch = await h.context({ width: 375, height: 800, touch: true });
  for (const [grade, skill, level] of [
    [0, "k-core", 1],
    [3, "g3-times-table", 2],
    [8, "g8-linear-nonlinear", 1],
  ]) {
    const page = await open(touch, { grade, skill, level });
    const { sol } = await solveByUi(page, { how: "tap" });
    await assertSolved(page, `touch ${skill}`);
    ok((await tooSmall(page)).length === 0, `touch ${skill}: every control is at least 44px: ${(await tooSmall(page)).join(", ")}`);
    ok(sol.far.length > 0 && !(await hasOverflow(page)), `touch ${skill}: no horizontal overflow at 375`);
    await page.close();
  }
  await touch.close();
  for (const width of [320, 375, 768, 1440]) {
    const ctx = await h.context({ width, height: 900 });
    for (const [grade, skill, level] of [
      [5, "g5-two-rules", 3],
      [8, "g8-linear-nonlinear", 3],
      [1, "g1-grow-shape", 3],
      [2, "g2-hundred-chart", 3],
      [0, "k-core", 3],
      [6, "g6-io-table", 3],
    ]) {
      const page = await open(ctx, { grade, skill, level });
      const round = await roundOf(page);
      const sol = await solutionOf(page);
      await probeAll(page, round, sol.probe);
      await stateRule(page, round, sol.fields);
      ok(!(await hasOverflow(page)), `${skill} at ${width}px: no horizontal overflow with clues showing`);
      ok((await tooSmall(page)).length === 0, `${skill} at ${width}px: no small targets: ${(await tooSmall(page)).join(", ")}`);
      if ([375, 768, 1440].includes(width) && ["g5-two-rules", "g1-grow-shape", "g2-hundred-chart", "k-core"].includes(skill))
        await page.screenshot({ path: `${SHOTS}/${skill}-${width}.png`, fullPage: true });
      await page.close();
    }
    await ctx.close();
  }
}
stamp("PASS tap solves rounds at 375px; no overflow or small targets from 320 to 1440");

// ---- 10. keyboard only ---------------------------------------------------------------------------------------------------------------------------
{
  async function tabTo(page, selector, max = 120) {
    for (let i = 0; i < max; i += 1) {
      if (await page.evaluate((s) => document.activeElement?.matches(s), selector)) return;
      await page.keyboard.press("Tab");
    }
    throw new Error(`could not reach ${selector} with Tab`);
  }
  async function viaKeys(page, selector, keys) {
    await tabTo(page, selector);
    for (const k of keys) await page.keyboard.press(k);
  }
  const typeInto = async (page, selector, value) => {
    await tabTo(page, selector);
    await page.keyboard.type(value);
  };
  // repeating pattern: cells and shapes by Tab + Enter
  {
    const page = await open(desktop, { grade: 0, skill: "k-core", level: 1 });
    const round = await roundOf(page);
    const sol = await solutionOf(page);
    for (const p of sol.probe) await viaKeys(page, `[data-act="cell"][data-x="${p.x}"]`, ["Enter"]);
    for (const id of sol.fields.core)
      await viaKeys(page, `[data-act="core-add"][data-id="${id}"]`, ["Enter"]);
    await viaKeys(page, `[data-act="far-sym"][data-id="${sol.far}"]`, ["Space"]);
    ok(round.form === "cycle" && (await page.locator('[data-act="far-sym"][aria-pressed="true"]').count()) === 1, "keyboard: a shape is chosen as the prediction");
    await viaKeys(page, '[data-act="check"]', ["Enter"]);
    await assertSolved(page, "keyboard k-core");
    await page.close();
  }
  // machine with a builder: typing, Enter on the probe box, Space on the operation buttons
  {
    const page = await open(desktop, { grade: 3, skill: "g3-times-table", level: 2 });
    const round = await roundOf(page);
    const sol = await solutionOf(page);
    for (const p of sol.probe) {
      await typeInto(page, '[data-key="x"]', String(p.x));
      await page.keyboard.press("Enter");
    }
    ok((await tableRows(page)) === round.seed.length + sol.probe.length, "keyboard: Enter on the probe box probes");
    await viaKeys(page, `[data-act="set"][data-path="op1"][data-value="${sol.fields.op1}"]`, ["Space"]);
    ok((await page .locator(`[data-act="set"][data-path="op1"][data-value="${sol.fields.op1}"]`) .getAttribute("aria-pressed")) === "true", `keyboard: Space chooses the operation ${sol.fields.op1}`);
    await typeInto(page, '[data-path="a"]', sol.fields.a);
    await typeInto(page, '[data-key="far"]', sol.far);
    await page.keyboard.press("Enter");
    await assertSolved(page, "keyboard g3-times-table");
    await page.close();
  }
  // line form with a yes/no question: buttons by Space
  {
    const page = await open(desktop, { grade: 7, skill: "g7-proportional", level: 1 });
    const sol = await solutionOf(page);
    for (const p of sol.probe) {
      await typeInto(page, '[data-key="x"]', String(p.x));
      await page.keyboard.press("Enter");
    }
    await typeInto(page, '[data-path="m"]', sol.fields.m);
    await typeInto(page, '[data-path="b"]', sol.fields.b);
    await viaKeys(page, `[data-act="cls"][data-id="${sol.cls}"]`, ["Space"]);
    await typeInto(page, '[data-key="far"]', sol.far);
    await viaKeys(page, '[data-act="check"]', ["Space"]);
    await assertSolved(page, "keyboard g7-proportional");
    await page.close();
  }
  // typed rule with the key pad
  {
    const page = await open(desktop, { grade: 8, skill: "g8-linear-nonlinear", level: 1 });
    const sol = await solutionOf(page);
    for (const p of sol.probe) {
      await typeInto(page, '[data-key="x"]', String(p.x));
      await page.keyboard.press("Enter");
    }
    await viaKeys(page, '[data-key="key-x"]', ["Enter"]);
    ok((await page.locator('[data-key="typed"]').inputValue()).endsWith("x"), "keyboard: the key pad inserts into the rule");
    await page.fill('[data-key="typed"]', "");
    await typeInto(page, '[data-key="typed"]', sol.fields.text);
    await viaKeys(page, `[data-act="cls"][data-id="${sol.cls}"]`, ["Enter"]);
    await typeInto(page, '[data-key="far"]', sol.far);
    await page.keyboard.press("Enter");
    await assertSolved(page, "keyboard g8-linear-nonlinear");
    await page.close();
  }
}
stamp("PASS every manipulation works with the keyboard alone");

// ---- 11. axe, both languages -----------------------------------------------------------------------------------------------------------------------
for (const [grade, skill, level] of [
  [0, "k-core", 2],
  [5, "g5-two-rules", 2],
  [6, "g6-variables", 3],
  [1, "g1-grow-shape", 1],
  [2, "g2-hundred-chart", 2],
  [8, "g8-linear-nonlinear", 3],
  [4, "g4-rule-pattern", 2],
]) {
  for (const lang of ["en", "es"]) {
    const page = await open(desktop, { grade, skill, level, lang });
    const round = await roundOf(page);
    const sol = await solutionOf(page);
    await probeAll(page, round, sol.probe);
    await stateRule(page, round, sol.fields);
    if (round.cls) await act(page, "cls", "click", `[data-id="${sol.cls}"]`);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    ok(result.violations.length === 0, `axe ${skill} ${lang}: ${result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`).join("; ")}`);
    if (lang === "es" && ["k-core", "g5-two-rules", "g6-variables"].includes(skill))
      await page.screenshot({ path: `${SHOTS}/${skill}-es-1440.png`, fullPage: true });
    await page.close();
  }
}
stamp("PASS axe wcag2a/aa finds nothing in English or Spanish");

// ---- screenshots for the visual review ---------------------------------------------------------------------------------------------------------------
for (const [width, name] of [
  [768, "768"],
  [375, "375"],
]) {
  const ctx = await h.context({ width, height: 900 });
  for (const [grade, skill, level, lang] of [
    [6, "g6-variables", 2, "en"],
    [8, "g8-linear-nonlinear", 3, "es"],
  ]) {
    const page = await open(ctx, { grade, skill, level, lang });
    const round = await roundOf(page);
    const sol = await solutionOf(page);
    await probeAll(page, round, sol.probe);
    await stateRule(page, round, sol.fields);
    await page.screenshot({ path: `${SHOTS}/${skill}-${lang}-${name}.png`, fullPage: true });
    await page.close();
  }
  await ctx.close();
}

assertClean(h.problems, "pattern-detective");
await h.close();
console.log(`PASS pattern-detective acceptance suite: ${checks} checks in ${((Date.now() - started) / 1000).toFixed(0)}s`);
