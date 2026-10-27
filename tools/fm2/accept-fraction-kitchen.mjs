// Acceptance suite for Fraction Kitchen, driven through the real page with Playwright: every solve below is a real
// click / tap / key press (never window.__fm2.submit); window.__fm2.solve() only tells the helper WHAT to build.
// @fm2 FM-072 FM-020 FM-021 FM-026 FM-037 FM-038 FM-039 FM-040 FM-059

import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { assertClean, hasOverflow, launch } from "./harness.mjs";

const GAME = "fraction-kitchen";
const h = await launch();
const started = Date.now();
let steps = 0;
const pass = (message) => {
  steps += 1;
  console.log(`PASS ${message}`);
};
const SKILLS = [
  ["fair-shares", 0],
  ["fix-the-cuts", 1],
  ["serve-parts", 3],
  ["pizza-equiv", 4],
  ["compare-pieces", 3],
  ["line-marker", 4],
  ["pour-cup", 5],
  ["tenths-cup", 4],
  ["mixed-scoops", 4],
  ["batch-recipe", 5],
  ["unlike-bars", 5],
  ["part-of-part", 5],
  ["divide-unit", 5],
  ["divide-fractions", 6],
  ["percent-amount", 7],
  ["pour-spill", 7],
  ["repeating-decimals", 8],
  ["rational-approx", 8],
  ["sci-measures", 8],
];

async function open(context, params = {}) {
  const page = await context.newPage();
  await page.goto(h.play({ game: GAME, rounds: 5, seed: 21, lang: "en", ...params }));
  await page.waitForSelector(".fk", { timeout: 15000 });
  return page;
}
const feedback = (page) => page.locator("[data-fm2-feedback]").innerText();
const nextVisible = (page) => page.locator("[data-fm2-next]").isVisible();
const roundInfo = (page) =>
  page.evaluate(() => ({
    round: JSON.parse(JSON.stringify(window.__fm2.round)),
    sol: JSON.parse(JSON.stringify(window.__fm2.solve())),
    answer: window.__fm2.game.answerText(window.__fm2.round),
  }));

// ---- helpers that turn the round's solution into UI actions --------------------------------------------------------
const pressSel = (page, selector, { tap = false } = {}) =>
  tap ? page.locator(selector).first().tap() : page.locator(selector).first().click();
const valueNow = async (page, fk) =>
  Number(await page.locator(`[data-fk="${fk}"]`).first().getAttribute("aria-valuenow"));
async function stepTo(page, fk, target, { tap = false, whole = 0 } = {}) {
  for (let guard = 0; guard < 90; guard += 1) {
    const diff = target - (await valueNow(page, fk));
    if (diff === 0) return;
    const dir =
      whole && Math.abs(diff) >= whole
        ? diff > 0
          ? "bigup"
          : "bigdown"
        : diff > 0
          ? "up"
          : "down";
    await pressSel(page, `[data-fk="${fk}-${dir}"]`, { tap });
  }
  throw new Error(`could not step ${fk} to ${target}`);
}
async function buildViaUI(page, { tap = false } = {}) {
  const { round, sol } = await roundInfo(page);
  const press = (selector) => pressSel(page, selector, { tap });
  switch (round.kind) {
    case "fair":
    case "fix":
    case "serve":
    case "equiv":
    case "compare":
    case "area":
      await stepTo(page, "parts", sol.cuts.length + 1, { tap });
      if (round.kind === "fix") await press('[data-act="even"]');
      for (let i = 0; i < sol.served.length; i += 1)
        if (sol.served[i]) await press(`[data-act="toggle"][data-piece="${i}"]`);
      break;
    case "cup":
    case "line":
      if (round.irr) await stepTo(page, "ticks", sol.ticks, { tap });
      else await press(`[data-act="ticks"][data-v="${sol.ticks}"]`);
      await stepTo(page, "hop", sol.steps, { tap, whole: sol.ticks });
      if (round.irr) await press('[data-act="verdict"][data-v="close"]');
      break;
    case "fill":
      for (const s of sol.scoops) await press(`[data-act="add"][data-v="${s.n}/${s.d}"]`);
      break;
    case "serving":
      for (let i = 0; i < sol.servings; i += 1) await press('[data-act="pour"]');
      break;
    default:
      if (sol.never) {
        await press('[data-act="never"]');
        await press(`[data-act="block"][data-v="${sol.block}"]`);
      } else
        for (const place of round.places)
          await stepTo(page, `digit-${place}`, sol.digits[place], { tap });
  }
  return round;
}
async function solveViaUI(page, options = {}) {
  const round = await buildViaUI(page, options);
  await pressSel(page, '[data-act="submit"]', options);
  return round;
}
const expectCorrect = async (page, label) => {
  assert.match(await feedback(page), /Correct!|¡Correcto!/, `${label}: shell says Correct`);
  assert.ok(await nextVisible(page), `${label}: Next is offered`);
};

// keyboard-only variant: Tab to a control, then Space / Enter / arrows
async function tabTo(page, selector) {
  for (let guard = 0; guard < 90; guard += 1) {
    if (await page.evaluate((sel) => document.activeElement?.matches(sel), selector)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Tab never reached ${selector}`);
}
async function solveViaKeyboard(page) {
  const { round, sol } = await roundInfo(page);
  const arrow = async (fk, target, whole = 0) => {
    await tabTo(page, `[data-fk="${fk}"]`);
    for (let guard = 0; guard < 90; guard += 1) {
      const diff = target - (await valueNow(page, fk));
      if (diff === 0) return;
      await page.keyboard.press(
        whole && Math.abs(diff) >= whole
          ? diff > 0
            ? "PageUp"
            : "PageDown"
          : diff > 0
            ? "ArrowUp"
            : "ArrowDown",
      );
    }
    throw new Error(`arrow keys could not reach ${target}`);
  };
  const activate = async (selector, key = "Space") => {
    await tabTo(page, selector);
    await page.keyboard.press(key);
  };
  switch (round.kind) {
    case "fair":
    case "fix":
    case "serve":
    case "equiv":
    case "compare":
    case "area":
      await arrow("parts", sol.cuts.length + 1);
      for (let i = 0; i < sol.served.length; i += 1)
        if (sol.served[i]) await activate(`[data-act="toggle"][data-piece="${i}"]`);
      break;
    case "cup":
    case "line":
      if (round.irr) await arrow("ticks", sol.ticks);
      else await activate(`[data-act="ticks"][data-v="${sol.ticks}"]`);
      await arrow("hop", sol.steps, sol.ticks);
      if (round.irr) await activate('[data-act="verdict"][data-v="close"]');
      break;
    case "fill":
      for (const s of sol.scoops) await activate(`[data-act="add"][data-v="${s.n}/${s.d}"]`);
      break;
    case "serving":
      for (let i = 0; i < sol.servings; i += 1) await activate('[data-act="pour"]');
      break;
    default:
      for (const place of round.places) await arrow(`digit-${place}`, sol.digits[place]);
  }
  await activate('[data-act="submit"]', "Enter");
  return round;
}

// geometry of the live SVG against the equation text (FM-059 in the browser)
const liveModel = (page) =>
  page.evaluate(() => {
    const turn = (x, y, cx, cy) => (Math.atan2(x - cx, -(y - cy)) / (2 * Math.PI) + 1) % 1;
    const eq = document.querySelector('[data-fk="eq"]')?.textContent ?? "";
    let servedShare = 0;
    const pieces = [...document.querySelectorAll(".fk-model .fk-piece")];
    for (const piece of pieces) {
      if (piece.getAttribute("fill") !== "#1d9a6c") continue;
      if (piece.tagName === "rect")
        servedShare +=
          Number(piece.getAttribute("width")) /
          Number(document.querySelector(".fk-whole").getAttribute("width"));
      else if (piece.tagName === "circle") servedShare += 1;
      else {
        const m = piece
          .getAttribute("d")
          .match(
            /^M ([\d.-]+) ([\d.-]+) L ([\d.-]+) ([\d.-]+) A [\d.-]+ [\d.-]+ 0 \d 1 ([\d.-]+) ([\d.-]+) Z$/,
          )
          .slice(1)
          .map(Number);
        servedShare += (turn(m[4], m[5], m[0], m[1]) - turn(m[2], m[3], m[0], m[1]) + 1) % 1 || 1;
      }
    }
    return { eq, servedShare, parts: pieces.length };
  });
const smallInStage = (page) =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll(
        "[data-fm2-stage] :is(button, a[href], select, input:not([type=hidden]), [role=button], [role=spinbutton])",
      ),
    ]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return (
          r.width > 0 &&
          r.height > 0 &&
          getComputedStyle(e).visibility !== "hidden" &&
          (r.width < 44 || r.height < 44)
        );
      })
      .map(
        (e) =>
          `${e.tagName}:${(e.getAttribute("aria-label") || e.textContent).trim().slice(0, 24)}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`,
      ),
  );

try {
  const desktop = await h.context({ width: 1280, height: 900 });

  // 1. opens at grades 0, 3, 6, 8 with no errors, model drawn
  for (const grade of [0, 3, 6, 8]) {
    const page = await open(desktop, { grade, level: 1 });
    assert.ok(
      (await page.locator(".fk svg").count()) >= 1 ||
        (await page.locator(".fk .fk-eq").count()) >= 1,
      `grade ${grade}: model is drawn`,
    );
    assert.ok(
      await page.locator("[data-fm2-prompt]").innerText(),
      `grade ${grade}: kitchen order shown`,
    );
    await page.close();
  }
  assertClean(h.problems, "grades 0/3/6/8");
  pass("opens at grades 0, 3, 6 and 8 with no console, network or page errors");

  // 2. How to play in both languages
  {
    const page = await open(desktop, { grade: 3, skill: "serve-parts" });
    await page.click("[data-fm2-howto]");
    const steps = await page.locator("[data-fm2-howto-steps] li").allInnerTexts();
    assert.ok(
      steps.length >= 3 &&
        steps.every((s) => s.length > 20) &&
        /kitchen order/i.test(steps[0]) &&
        (await page.locator("[data-fm2-dialog]").isVisible()),
      "English steps visible",
    );
    await page.click("[data-fm2-dialog-close]");
    await page.click("[data-fm2-lang]");
    await page.click("[data-fm2-howto]");
    const pasos = await page.locator("[data-fm2-howto-steps] li").allInnerTexts();
    assert.ok(
      pasos.length === steps.length &&
        /pedido de la cocina/i.test(pasos[0]) &&
        pasos[0] !== steps[0],
      "Spanish steps visible",
    );
    await page.close();
    pass("How to play shows its steps in English and in Spanish");
  }

  // 3. a real interaction solves a round of every skill
  for (const [skill, grade] of SKILLS) {
    const page = await open(desktop, { skill, grade, level: 2, seed: 33 });
    const round = await solveViaUI(page);
    await expectCorrect(page, skill);
    const model = await liveModel(page);
    if (["fair", "serve", "equiv", "compare", "area"].includes(round.kind)) {
      const [, k, n] =
        /(\d+) of (\d+) equal parts/.exec(model.eq) ??
        /(\d+) pieces, each 1\/(\d+)/.exec(model.eq) ??
        [];
      assert.ok(
        Math.abs(model.servedShare - Number(k) / Number(n)) < 0.004,
        `${skill}: drawn served share ${model.servedShare.toFixed(3)} equals the equation ${k}/${n}`,
      );
    }
    await page.close();
  }
  pass(
    `solved a round of all ${SKILLS.length} skills through the UI; Correct! and Next shown; drawn shares match the equation`,
  );

  // 4. a wrong answer through the UI: feedback, no Next; then corrected through the UI
  {
    const page = await open(desktop, { skill: "fix-the-cuts", grade: 1, level: 2, seed: 4 });
    await page.click('[data-act="submit"]');
    assert.match(await feedback(page), /Not yet/);
    assert.match(await feedback(page), /aren't equal-sized/, "the unequal cut is named");
    assert.ok(!(await nextVisible(page)), "no Next after a miss");
    await solveViaUI(page);
    await expectCorrect(page, "fix after miss");
    const serve = await open(desktop, { skill: "serve-parts", grade: 2, level: 2, seed: 8 });
    const { round, sol } = await roundInfo(serve);
    const [a, b] = round.ask;
    await stepTo(serve, "parts", b);
    for (let i = 0; i <= a && i < b; i += 1)
      await pressSel(serve, `[data-act="toggle"][data-piece="${i}"]`);
    await serve.click('[data-act="submit"]');
    assert.match(await feedback(serve), /more than the order/, "serving too many is named");
    for (let i = 0; i < sol.served.length; i += 1)
      if (sol.served[i] !== (i <= a && i < b))
        await pressSel(serve, `[data-act="toggle"][data-piece="${i}"]`);
    await serve.click('[data-act="submit"]');
    await expectCorrect(serve, "serve after miss");
    const scoops = await open(desktop, { skill: "mixed-scoops", grade: 4, level: 1 });
    await scoops.click('[data-act="submit"]');
    assert.match(await feedback(scoops), /pitcher is empty/);
    await scoops.close();
    await page.close();
    await serve.close();
    pass("wrong answers through the UI give named feedback and no Next; correcting them succeeds");
  }

  // 5. hint tiers and the Show me path
  {
    const page = await open(desktop, { skill: "serve-parts", grade: 3, level: 2, seed: 6 });
    const { answer } = await roundInfo(page);
    const texts = [];
    for (let i = 0; i < 3; i += 1) {
      await page.click("[data-fm2-hint]");
      texts.push(await page.locator("[data-fm2-hintbox]").innerText());
    }
    assert.equal(new Set(texts).size, 3, "three hint tiers differ");
    for (const text of texts)
      assert.ok(
        !new RegExp(`(?<![\\w/.])${answer}(?![\\w/.])`).test(text),
        `hint tier does not print ${answer}: ${text}`,
      );
    for (let i = 0; i < 3; i += 1) {
      await page.click('[data-act="submit"]');
      assert.ok(!(await nextVisible(page)));
    }
    assert.ok(
      await page.locator("[data-fm2-showme]").isVisible(),
      "Show me appears after three misses",
    );
    await page.click("[data-fm2-showme]");
    assert.ok(
      (await page.locator("[data-fm2-hintbox]").innerText()).includes(answer),
      "Show me states the full solution",
    );
    assert.ok(await nextVisible(page), "Next after Show me");
    await page.close();
    pass(
      "hint tiers differ and never print the answer; Show me after three misses reveals the solution",
    );
  }

  // 6. Reset this puzzle, Start over, a full 5-round activity, stars and storage
  {
    const page = await open(desktop, { skill: "serve-parts", grade: 3, level: 1, seed: 9 });
    await stepTo(page, "parts", 4);
    await pressSel(page, '[data-act="toggle"][data-piece="0"]');
    assert.equal(await page.locator('.fk-piece-btn[aria-pressed="true"]').count(), 1);
    await page.click("[data-fm2-reset]");
    assert.equal(await valueNow(page, "parts"), 1, "Reset this puzzle remounts the interaction");
    assert.equal(await page.locator('.fk-piece-btn[aria-pressed="true"]').count(), 0);
    await solveViaUI(page);
    await page.click("[data-fm2-next]");
    assert.match(await page.locator("[data-fm2-round]").innerText(), /Round 2 of 5/);
    await page.click("[data-fm2-restart]");
    assert.match(await page.locator("[data-fm2-round]").innerText(), /Round 1 of 5/, "Start over");
    await page.close();
    pass("Reset this puzzle and Start over work");
  }
  {
    const context = await h.context({ width: 1024, height: 800 });
    const page = await open(context, { skill: "fair-shares", grade: 1, level: 1, seed: 12 });
    for (let i = 0; i < 5; i += 1) {
      await solveViaUI(page);
      await expectCorrect(page, `round ${i + 1}`);
      await page.click("[data-fm2-next]");
    }
    assert.match(await page.locator(".fm2-stars").getAttribute("aria-label"), /3 of 3 stars/);
    assert.match(await page.locator("[data-fm2-finish]").innerText(), /Nice work!/);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fm2-v1")));
    assert.equal(
      stored.skills["fraction-kitchen:fair-shares"].plays,
      5,
      "five plays recorded for the skill",
    );
    assert.equal(stored.games["fraction-kitchen"].completed, 1);
    const other = await open(context, {
      skill: "fair-shares",
      grade: 1,
      level: 1,
      seed: 12,
      profile: 1,
    });
    assert.equal(
      await other.evaluate(
        () =>
          JSON.parse(localStorage.getItem("ewl-fm2-v1:profile-1") || "null")?.skills?.[
            "fraction-kitchen:fair-shares"
          ] ?? null,
      ),
      null,
      "a second profile has no such record",
    );
    await solveViaUI(other);
    const second = await other.evaluate(() => ({
      one: JSON.parse(localStorage.getItem("ewl-fm2-v1:profile-1")),
      zero: JSON.parse(localStorage.getItem("ewl-fm2-v1")),
    }));
    assert.equal(second.one.skills["fraction-kitchen:fair-shares"].plays, 1);
    assert.equal(
      second.zero.skills["fraction-kitchen:fair-shares"].plays,
      5,
      "profile 0 is untouched",
    );
    await context.close();
    pass(
      "finished a 5-round activity: 3 stars, skill record with 5 plays, second profile isolated",
    );
  }

  // 7. resume mid-activity
  {
    const context = await h.context({ width: 1024, height: 800 });
    const page = await open(context, { skill: "pour-cup", grade: 4, level: 1, seed: 17 });
    for (let i = 0; i < 2; i += 1) {
      await solveViaUI(page);
      await page.click("[data-fm2-next]");
    }
    const before = await page.evaluate(() => window.__fm2.round.prompt.en);
    await page.goto(
      h.play({ game: GAME, skill: "pour-cup", grade: 4, level: 1, seed: 17, rounds: 5, resume: 1 }),
    );
    await page.waitForSelector(".fk");
    assert.match(
      await page.locator("[data-fm2-round]").innerText(),
      /Round 3 of 5/,
      "resume lands on round 3",
    );
    assert.equal(
      await page.evaluate(() => window.__fm2.round.prompt.en),
      before,
      "the same round is rebuilt from the seed",
    );
    assert.equal(await page.locator(".fm2-dot-done").count(), 2, "earlier results are restored");
    await context.close();
    pass("reload with resume=1 restores the round index and earlier results");
  }

  // 8. language switch keeps the work
  {
    const page = await open(desktop, { skill: "serve-parts", grade: 3, level: 2, seed: 8 });
    const { round, sol } = await roundInfo(page);
    await stepTo(page, "parts", sol.cuts.length + 1);
    const first = sol.served.indexOf(true);
    await pressSel(page, `[data-act="toggle"][data-piece="${first}"]`);
    assert.match(await page.locator('[data-act="submit"]').innerText(), /Serve it/);
    await page.click("[data-fm2-lang]");
    assert.match(
      await page.locator('[data-act="submit"]').innerText(),
      /Servir/,
      "labels switch to Spanish",
    );
    assert.match(
      (await page.locator('[data-fk="parts"]').getAttribute("aria-valuetext")) ?? "",
      /partes iguales/,
    );
    assert.match(await page.locator('[data-fk="eq"]').innerText(), /Servido/);
    assert.equal(await valueNow(page, "parts"), sol.cuts.length + 1, "parts kept");
    assert.equal(
      await page.locator('.fk-piece-btn[aria-pressed="true"]').count(),
      1,
      "served piece kept",
    );
    for (let i = first + 1; i < sol.served.length; i += 1)
      if (sol.served[i]) await pressSel(page, `[data-act="toggle"][data-piece="${i}"]`);
    await page.click('[data-act="submit"]');
    assert.match(await feedback(page), /¡Correcto!/);
    await page.click("[data-fm2-lang]");
    assert.match(
      await page.locator('[data-act="submit"]').innerText(),
      /Serve it/,
      "and back to English",
    );
    assert.equal(round.kind, "serve");
    const cup = await open(desktop, { skill: "pour-cup", grade: 4, level: 1, seed: 3 });
    const { sol: cupSol } = await roundInfo(cup);
    await pressSel(cup, `[data-act="ticks"][data-v="${cupSol.ticks}"]`);
    await stepTo(cup, "hop", Math.max(1, cupSol.steps - 1), { whole: cupSol.ticks });
    const level = await cup.locator('[data-fk="eq"]').innerText();
    await cup.click("[data-fm2-lang]");
    assert.equal(
      await cup
        .locator(`[data-act="ticks"][data-v="${cupSol.ticks}"]`)
        .getAttribute("aria-pressed"),
      "true",
      "cup choice kept",
    );
    assert.match(await cup.locator('[data-fk="eq"]').innerText(), /Nivel/);
    const kept = Math.max(1, cupSol.steps - 1);
    assert.match(level, new RegExp(`${kept} marks? of`));
    assert.match(
      await cup.locator('[data-fk="eq"]').innerText(),
      new RegExp(`${kept} marcas? de`),
      "level kept",
    );
    const pitcher = await open(desktop, { skill: "mixed-scoops", grade: 4, level: 1, seed: 2 });
    const { sol: scoopSol } = await roundInfo(pitcher);
    const s = scoopSol.scoops[0];
    await pressSel(pitcher, `[data-act="add"][data-v="${s.n}/${s.d}"]`);
    await pitcher.click("[data-fm2-lang]");
    assert.match(await pitcher.locator('[data-fk="eq"]').innerText(), /1 × /);
    assert.equal(
      await pitcher.locator(".fk-group").count(),
      1,
      "scoops kept across the language switch",
    );
    await page.close();
    await cup.close();
    await pitcher.close();
    pass(
      "switching language mid-round changes the labels and keeps parts, pieces, marks, levels and scoops",
    );
  }

  // 9. phone: touch taps solve rounds; no overflow; 44px targets
  {
    const phone = await h.context({ width: 375, height: 800, touch: true });
    for (const [skill, grade] of [
      ["serve-parts", 3],
      ["pour-cup", 4],
      ["mixed-scoops", 4],
      ["tenths-cup", 4],
      ["line-marker", 3],
      ["divide-fractions", 6],
    ]) {
      const page = await open(phone, { skill, grade, level: 2, seed: 5 });
      assert.deepEqual(
        await smallInStage(page),
        [],
        `${skill}: every control in the stage is at least 44x44`,
      );
      assert.equal(await hasOverflow(page), false, `${skill}: no horizontal overflow at 375`);
      await solveViaUI(page, { tap: true });
      await expectCorrect(page, `${skill} by touch`);
      await page.close();
    }
    for (const width of [320, 375, 768, 1440]) {
      const context = await h.context({ width, height: 900 });
      for (const [skill, grade] of [
        ["fair-shares", 0],
        ["fix-the-cuts", 2],
        ["pizza-equiv", 4],
        ["line-marker", 4],
        ["pour-cup", 4],
        ["mixed-scoops", 5],
        ["part-of-part", 5],
        ["divide-unit", 5],
        ["pour-spill", 7],
        ["repeating-decimals", 7],
        ["rational-approx", 8],
      ]) {
        const page = await open(context, { skill, grade, level: 3, seed: 14 });
        await buildViaUI(page);
        assert.equal(
          await hasOverflow(page),
          false,
          `${skill}: no horizontal overflow at ${width}`,
        );
        assert.equal(
          await page.evaluate(() => {
            const stage = document.querySelector("[data-fm2-stage]");
            return stage.scrollWidth > stage.clientWidth + 1;
          }),
          false,
          `${skill}: the stage itself does not scroll sideways at ${width}`,
        );
        assert.deepEqual(await smallInStage(page), [], `${skill}: 44px targets at ${width}`);
        await page.close();
      }
      await context.close();
    }
    await phone.close();
    pass(
      "touch taps solve rounds at 375px; no horizontal overflow at 320, 375, 768 and 1440; every control is at least 44x44",
    );
  }

  // 10. keyboard only
  for (const [skill, grade] of [
    ["serve-parts", 3],
    ["pour-cup", 4],
    ["mixed-scoops", 4],
    ["repeating-decimals", 7],
    ["divide-fractions", 6],
    ["rational-approx", 8],
    ["fix-the-cuts", 1],
  ]) {
    const page = await open(desktop, { skill, grade, level: 2, seed: 7 });
    await page.focus("[data-fm2-prompt]");
    await solveViaKeyboard(page);
    await expectCorrect(page, `${skill} by keyboard`);
    await page.close();
  }
  pass(
    "whole rounds completed with Tab, Space, Enter and arrow keys only (cuts, pieces, marks, scoops, place values, servings)",
  );

  // 11. axe in both languages, across every kind of model
  for (const lang of ["en", "es"]) {
    for (const [skill, grade] of [
      ["fair-shares", 0],
      ["fix-the-cuts", 1],
      ["pizza-equiv", 4],
      ["part-of-part", 5],
      ["line-marker", 3],
      ["pour-cup", 4],
      ["mixed-scoops", 4],
      ["divide-fractions", 6],
      ["tenths-cup", 4],
      ["repeating-decimals", 7],
      ["rational-approx", 8],
    ]) {
      const page = await open(desktop, { skill, grade, level: 2, seed: 3, lang });
      await buildViaUI(page);
      await page.click("[data-fm2-hint]");
      const report = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      assert.deepEqual(
        report.violations.map(
          (v) =>
            `${v.id}: ${v.nodes
              .map((n) => n.target.join(" "))
              .slice(0, 3)
              .join(" | ")}`,
        ),
        [],
        `axe ${skill} ${lang}`,
      );
      await page.close();
    }
  }
  pass(
    "axe-core (wcag2a, wcag2aa) reports no violations in English or Spanish across all model types",
  );

  assertClean(h.problems, "Fraction Kitchen suite");
  pass("no console, network or page errors over the whole suite");
} finally {
  await h.close();
}
console.log(
  `fraction-kitchen acceptance: ${steps} groups passed in ${Math.round((Date.now() - started) / 1000)}s.`,
);
