// Array Architect acceptance suite, driven through the real page with real clicks, taps and key presses (never
// window.__fm2.submit): open at four grades, how to play, every skill solved through the interface, wrong answer
// then fix, hints and Show me, reset and start over, a full five-round activity with stars and stored progress,
// resume, language switch mid-build, touch at 375px, keyboard only, layout at four widths, axe in both languages.
// @fm2 FM-074 FM-011 FM-038 FM-039 FM-040 FM-037 FM-020 FM-021 FM-026
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { assertClean, hasOverflow, launch } from "./harness.mjs";

const h = await launch();
let steps = 0;
const pass = (text) => {
  steps += 1;
  console.log(`PASS ${text}`);
};
const ok = (cond, text) => assert.ok(cond, text);
const SEED = 20261026;
const SKILLS = [
  ["k-rows", 0],
  ["k-count", 0],
  ["g1-equal-rows", 1],
  ["g1-repeat-add", 1],
  ["g2-array-eq", 2],
  ["g2-even-odd", 2],
  ["g3-mult-array", 3],
  ["g3-commute", 3],
  ["g3-area-tile", 3],
  ["g3-perimeter", 3],
  ["g4-area-perim", 4],
  ["g4-factor-pairs", 4],
  ["g4-area-model", 4],
  ["g5-area-model", 5],
  ["g5-volume", 5],
  ["g6-composite", 6],
  ["g6-distribute", 6],
  ["g6-gcf", 6],
  ["g6-lcm", 6],
  ["g7-expand", 7],
  ["g7-scale", 7],
  ["g8-expand", 8],
  ["g8-factor", 8],
];

const open = async (context, params = {}) => {
  const page = await context.newPage();
  await page.goto(
    h.play({ game: "array-architect", grade: 3, seed: SEED, rounds: 5, lang: "en", ...params }),
  );
  await page.waitForSelector(".aa-board");
  return page;
};
const state = (page) =>
  page.evaluate(() => ({
    round: JSON.parse(JSON.stringify(window.__fm2.round)),
    sol: JSON.parse(JSON.stringify(window.__fm2.solve())),
  }));
const feedback = (page) => page.locator("[data-fm2-feedback]").innerText();
const nextVisible = (page) => page.locator("[data-fm2-next]").isVisible();

// Move keyboard focus forward (wrapping) until the element matching `selector` has it.
async function tabTo(page, selector) {
  for (let i = 0; i < 200; i += 1) {
    if (await page.evaluate((s) => document.activeElement?.matches(s), selector)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`could not reach ${selector} with Tab`);
}

// One device (mouse click, touch tap or keyboard only) turned into the five things a learner does on this page.
function device(page, how) {
  return {
    async press(selector) {
      if (how === "key") {
        await tabTo(page, selector);
        await page.keyboard.press("Enter");
      } else if (how === "tap") await page.locator(selector).tap();
      else await page.locator(selector).click();
    },
    async type(selector, text) {
      if (how === "key") {
        await tabTo(page, selector);
        await page.keyboard.press("ControlOrMeta+a");
        await page.keyboard.type(String(text));
        await page.keyboard.press("Tab");
      } else {
        await page.locator(selector).fill(String(text));
        await page.locator(selector).press("Tab");
      }
    },
    async cell(r, c, mode = "toggle") {
      if (how !== "key") {
        if (how === "tap") await page.locator(`#aa-c-${r}-${c}`).tap();
        else await page.locator(`#aa-c-${r}-${c}`).click();
        return;
      }
      await tabTo(page, ".aa-grid");
      const at = await page.evaluate(() =>
        document.querySelector(".aa-grid").getAttribute("aria-activedescendant"),
      );
      const [cr, cc] = at.replace("aa-c-", "").split("-").map(Number);
      for (let i = 0; i < Math.abs(r - cr); i += 1)
        await page.keyboard.press(r > cr ? "ArrowDown" : "ArrowUp");
      for (let i = 0; i < Math.abs(c - cc); i += 1)
        await page.keyboard.press(c > cc ? "ArrowRight" : "ArrowLeft");
      await page.keyboard.press(mode === "toggle" ? "Space" : "Enter");
    },
  };
}

const sizeOf = (cells) => [
  Math.max(...cells.map((c) => c[0])) + 1,
  Math.max(...cells.map((c) => c[1])) + 1,
];

// Turn the round's own solution into interface actions, then press Check.
async function solveUi(page, how) {
  const { round, sol } = await state(page);
  const act = device(page, how);
  const tappable = round.grid && round.grid.rows <= 12 && round.grid.cols <= 12;
  const setSize = async (rows, cols) => {
    if (tappable && rows > 0 && cols > 0) await act.cell(rows - 1, cols - 1);
    else {
      await act.type('.aa-step-input[data-id="rows"]', rows);
      await act.type('.aa-step-input[data-id="cols"]', cols);
    }
  };
  if (round.kind === "rect") {
    await setSize(...sizeOf(sol.cells));
    if (sol.value != null) await act.type("[data-ask]", sol.value);
  } else if (round.kind === "paint") {
    let tool = 1;
    for (const [r, c, v = 1] of sol.cells) {
      if (v !== tool) {
        await act.press(`[data-act="tool"][data-v="${v}"]`);
        tool = v;
      }
      await act.cell(r, c);
    }
    if (sol.parity) await act.press(`[data-act="parity"][data-v="${sol.parity}"]`);
    if (sol.value != null) await act.type("[data-ask]", sol.value);
  } else if (round.kind === "collect") {
    for (const [rows, cols] of sol.list) {
      await act.type('.aa-step-input[data-id="rows"]', rows);
      await act.type('.aa-step-input[data-id="cols"]', cols);
      await act.press('[data-act="add"]');
    }
  } else if (round.kind === "model") {
    for (const [key, value] of Object.entries(sol.cuts))
      await act.type(`.aa-step-input[data-id="cut-${key}"]`, value);
    for (const [id, value] of Object.entries(sol.partials))
      await act.type(`[data-part="${id}"]`, value);
    await act.type("[data-total]", sol.total);
  } else if (round.kind === "prism") {
    await setSize(...sizeOf(sol.cells));
    await act.type('.aa-step-input[data-id="layers"]', sol.layers);
    if (sol.value != null) await act.type("[data-ask]", sol.value);
  } else if (round.kind === "scale") {
    await setSize(...sizeOf(sol.cells));
    await act.press(`[data-act="pick"][data-v="${sol.pick}"]`);
  } else if (round.kind === "tiling") {
    await act.type('.aa-step-input[data-id="s"]', sol.s);
  } else {
    for (const [id, value] of [
      ["w1", sol.w[1]],
      ["w0", sol.w[0]],
      ["h1", sol.h[1]],
      ["h0", sol.h[0]],
    ])
      await act.type(`.aa-step-input[data-id="${id}"]`, value);
  }
  await act.press('[data-act="check"]');
  return round;
}

const solved = async (page) => {
  await page.waitForFunction(() => window.__fm2.tools.solved === true, null, { timeout: 8000 });
  ok(/Correct!|¡Correcto!/.test(await feedback(page)), "the shell says Correct!");
  ok(await nextVisible(page), "Next appears after a correct answer");
};

const stageSmallTargets = (page) =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll(
        "[data-fm2-stage] button, [data-fm2-stage] input:not([type=hidden]), [data-fm2-stage] a[href], [data-fm2-stage] [role=button]",
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
          `${e.tagName.toLowerCase()}:${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 24)}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`,
      ),
  );

try {
  // 1. open at grades 0, 3, 6 and 8 with no console, network or page errors --------------------------------------
  const desktop = await h.context({ width: 1280, height: 900 });
  for (const [grade, skill] of [
    [0, "k-rows"],
    [3, "g3-mult-array"],
    [6, "g6-composite"],
    [8, "g8-expand"],
  ]) {
    const page = await open(desktop, { grade });
    ok(
      (await page.evaluate(() => window.__fm2.game.id)) === "array-architect",
      "the shell mounted Array Architect",
    );
    ok(
      (await page.evaluate(() => window.__fm2.skillId)) === skill,
      `grade ${grade} opens ${skill}`,
    );
    ok((await page.locator("[data-fm2-prompt]").innerText()).length > 20, "a prompt is shown");
    ok((await page.locator(".aa-readout, .aa-board").count()) > 0, "the board is drawn");
    await page.close();
  }
  pass("opens at grades 0, 3, 6 and 8 with a prompt and a board");

  // 2. How to play, English and Spanish --------------------------------------------------------------------------
  {
    const page = await open(desktop);
    await page.locator("[data-fm2-howto]").click();
    const steps1 = await page.locator("[data-fm2-howto-steps] li").allInnerTexts();
    ok(
      steps1.length >= 3 && steps1.length <= 5 && /Read the clue/.test(steps1[0]),
      "English steps are visible",
    );
    ok(await page.locator("[data-fm2-dialog]").isVisible(), "the dialog is open");
    await page.locator("[data-fm2-dialog-close]").click();
    await page.locator("[data-fm2-lang]").click();
    await page.locator("[data-fm2-howto]").click();
    const steps2 = await page.locator("[data-fm2-howto-steps] li").allInnerTexts();
    ok(
      steps2.length === steps1.length && /Lee la pista/.test(steps2[0]) && steps2[0] !== steps1[0],
      "Spanish steps are visible",
    );
    await page.locator("[data-fm2-dialog-close]").click();
    await page.close();
  }
  pass("How to play shows the steps in English and in Spanish");

  // 3. every skill solved with real clicks (level 2), and level 3 for the harder ones --------------------------------
  const kinds = new Set();
  for (const [skill, grade] of SKILLS) {
    const page = await open(desktop, { grade, skill, level: 2 });
    kinds.add((await state(page)).round.kind);
    await solveUi(page, "mouse");
    await solved(page);
    await page.close();
  }
  ok(kinds.size === 8, `all eight screens were exercised (${[...kinds].join(", ")})`);
  pass(
    `solved one round of each of ${SKILLS.length} skills through the interface, covering ${kinds.size} different screens`,
  );
  for (const [skill, grade] of SKILLS) {
    const page = await open(desktop, { grade, skill, level: 3, seed: SEED + 5 });
    await solveUi(page, "mouse");
    await solved(page);
    await page.close();
  }
  pass("solved a level 3 round of every skill through the interface");

  // 4. a wrong answer through the UI, then the fix --------------------------------------------------------------
  {
    const page = await open(desktop, { grade: 0, skill: "k-rows", level: 1 });
    const { round, sol } = await state(page);
    const [rows, cols] = sizeOf(sol.cells);
    await page.locator(`#aa-c-${rows - 1}-${cols}`).click();
    await page.locator('[data-act="check"]').click();
    ok(
      /Not yet/.test(await feedback(page)) && /columns|each row|rows/.test(await feedback(page)),
      "a named mistake is shown",
    );
    ok(!(await nextVisible(page)), "no Next after a wrong answer");
    ok(/\d/.test(await feedback(page)), "the feedback quotes the learner's own numbers");
    ok(
      !(await page.locator("[data-fm2-hintbox]").isVisible()),
      "a miss alone does not print a hint or the answer",
    );
    await page.locator(`#aa-c-${rows - 1}-${cols - 1}`).click();
    await page.locator('[data-act="check"]').click();
    await solved(page);
    ok(round.kind === "rect", "fixed the build and solved it");
    await page.close();
  }
  pass("a wrong answer gives named feedback with no Next, then the corrected build succeeds");

  // 5. hint tiers and Show me after three misses -----------------------------------------------------------------
  {
    const page = await open(desktop, { grade: 4, skill: "g4-area-perim", level: 2 });
    const answer = await page.evaluate(() => window.__fm2.game.answerText(window.__fm2.round));
    const texts = [];
    for (let i = 0; i < 3; i += 1) {
      await page.locator("[data-fm2-hint]").click();
      texts.push(await page.locator("[data-fm2-hintbox]").innerText());
    }
    ok(new Set(texts).size === 3, "three hint tiers show three different texts");
    ok(
      texts.every((t) => !t.includes(answer)),
      "hint tiers 0-2 do not print the answer",
    );
    await page.close();
    // misses alone: Show me stays hidden for two misses, appears on the third
    const misses = await open(desktop, { grade: 4, skill: "g4-area-perim", level: 2 });
    for (let i = 0; i < 3; i += 1) {
      await misses.locator("#aa-c-0-0").click();
      await misses.locator('[data-act="check"]').click();
      if (i === 1)
        ok(
          !(await misses.locator("[data-fm2-showme]").isVisible()),
          "Show me is hidden before three misses",
        );
    }
    ok(await misses.locator("[data-fm2-showme]").isVisible(), "Show me appears after three misses");
    await misses.locator("[data-fm2-showme]").click();
    ok(
      (await misses.locator("[data-fm2-hintbox]").innerText()).includes(answer),
      "Show me states the full solution",
    );
    ok(await nextVisible(misses), "Next appears after Show me");
    ok(
      (await misses.locator("[data-fm2-dots] .fm2-dot-current").count()) === 1,
      "progress dots stay accurate",
    );
    ok(
      (await misses.locator(".aa-board.aa-locked").count()) === 1,
      "the board freezes once the answer is shown",
    );
    await misses.close();
  }
  pass("hints escalate by tier, Show me appears after three misses and states the solution");

  // 6. Reset this puzzle and Start over -------------------------------------------------------------------------
  {
    const page = await open(desktop, { grade: 3, skill: "g3-area-tile", level: 2 });
    await page.locator("#aa-c-0-0").click();
    await page.locator("#aa-c-0-1").click();
    ok((await page.locator(".aa-cell.aa-on").count()) === 2, "two tiles placed");
    await page.locator("[data-fm2-reset]").click();
    ok(
      (await page.locator(".aa-cell.aa-on").count()) === 0 &&
        /0 of/.test(await page.locator(".aa-readout").innerText()),
      "Reset this puzzle clears the work",
    );
    await solveUi(page, "mouse");
    await solved(page);
    await page.locator("[data-fm2-next]").click();
    ok(/Round 2 of 5/.test(await page.locator("[data-fm2-round]").innerText()), "moved to round 2");
    await page.locator("[data-fm2-restart]").click();
    ok(
      /Round 1 of 5/.test(await page.locator("[data-fm2-round]").innerText()) &&
        (await page.locator(".aa-cell.aa-on").count()) === 0,
      "Start over returns to a fresh round 1",
    );
    await page.locator('[data-act="clear"]').click();
    await page.close();
  }
  pass("Reset this puzzle and Start over both work");

  // 7. a full five-round activity: stars and stored progress ------------------------------------------------------
  {
    const context = await h.context({ width: 1280, height: 900 });
    const page = await open(context, { grade: 4, skill: "g4-area-model", level: 2 });
    for (let i = 0; i < 5; i += 1) {
      await solveUi(page, "mouse");
      await solved(page);
      if (i === 4)
        ok(
          /Finish/.test(await page.locator("[data-fm2-next]").innerText()),
          "the last round says Finish",
        );
      await page.locator("[data-fm2-next]").click();
    }
    await page.locator("[data-fm2-finish] .fm2-stars").waitFor();
    ok(
      /3 of 3 stars/.test(
        await page.locator("[data-fm2-finish] [role=img]").getAttribute("aria-label"),
      ),
      "the finish screen shows three stars",
    );
    const store = await page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fm2-v1")));
    ok(
      store.skills["array-architect:g4-area-model"]?.plays === 5,
      "the skill record counts five plays",
    );
    ok(
      store.games["array-architect"]?.plays === 1 && store.games["array-architect"].bestStars === 3,
      "the activity is recorded once with its stars",
    );
    const second = await page.evaluate(() => localStorage.getItem("ewl-fm2-v1:profile-1"));
    ok(second === null, "profile 1 has no record");
    const other = await context.newPage();
    await other.goto(
      h.play({
        game: "array-architect",
        grade: 4,
        skill: "g4-area-model",
        profile: 1,
        rounds: 5,
        lang: "en",
      }),
    );
    await other.waitForSelector(".aa-board");
    ok(
      (await other.evaluate(
        () =>
          JSON.parse(localStorage.getItem("ewl-fm2-v1:profile-1") || "null")?.skills?.[
            "array-architect:g4-area-model"
          ] ?? null,
      )) === null,
      "a second profile has no such record",
    );
    await context.close();
  }
  pass("a five-round activity shows stars and stores the skill record for this profile only");

  // 8. leave and return (resume) --------------------------------------------------------------------------------
  {
    const context = await h.context({ width: 1280, height: 900 });
    const page = await open(context, { grade: 6, skill: "g6-gcf", level: 2 });
    for (let i = 0; i < 2; i += 1) {
      await solveUi(page, "mouse");
      await solved(page);
      await page.locator("[data-fm2-next]").click();
    }
    const before = await page.evaluate(() => ({
      index: window.__fm2.index,
      prompt: window.__fm2.round.prompt.en,
    }));
    await page.goto(h.play({ game: "array-architect", resume: 1, lang: "en" }));
    await page.waitForSelector(".aa-board");
    const after = await page.evaluate(() => ({
      index: window.__fm2.index,
      prompt: window.__fm2.round.prompt.en,
    }));
    ok(
      before.index === 2 && after.index === 2 && after.prompt === before.prompt,
      "resume restores the same round",
    );
    ok(
      (await page.locator("[data-fm2-dots] .fm2-dot-done").count()) === 2 &&
        /Round 3 of 5/.test(await page.locator("[data-fm2-round]").innerText()),
      "earlier results and the round number come back",
    );
    await context.close();
  }
  pass("reload with resume=1 restores the round index and earlier results");

  // 9. language switch keeps the work ---------------------------------------------------------------------------
  {
    const page = await open(desktop, { grade: 0, skill: "k-count", level: 2 });
    const { sol } = await state(page);
    for (const [r, c] of sol.cells.slice(0, 4)) await page.locator(`#aa-c-${r}-${c}`).click();
    ok((await page.locator(".aa-cell.aa-on").count()) === 4, "four counters placed in English");
    ok(/Check my work/.test(await page.locator('[data-act="check"]').innerText()), "English label");
    await page.locator("[data-fm2-lang]").click();
    ok(
      /Revisar mi trabajo/.test(await page.locator('[data-act="check"]').innerText()),
      "the interaction's labels change to Spanish",
    );
    ok(
      (await page.locator(".aa-cell.aa-on").count()) === 4 &&
        /puestas/.test(await page.locator(".aa-readout").innerText()),
      "placed counters remain after the switch",
    );
    ok(
      /fichas|Coloca/.test(await page.locator("[data-fm2-prompt]").innerText()),
      "the prompt is Spanish",
    );
    for (const [r, c] of sol.cells.slice(4)) await page.locator(`#aa-c-${r}-${c}`).click();
    await page.locator('[data-act="check"]').click();
    await solved(page);
    ok(/¡Correcto!/.test(await feedback(page)), "solved in Spanish");
    await page.locator("[data-fm2-lang]").click();
    ok(
      /Check my work/.test(await page.locator('[data-act="check"]').innerText()),
      "and back to English",
    );
    await page.close();
    const model = await open(desktop, { grade: 4, skill: "g4-area-model", level: 3 });
    const m = await state(model);
    const [key, cut] = Object.entries(m.sol.cuts)[0];
    await model.locator(`.aa-step-input[data-id="cut-${key}"]`).fill(cut);
    await model.locator(`.aa-step-input[data-id="cut-${key}"]`).press("Tab");
    await model.locator('[data-part="A"]').fill(m.sol.partials.A);
    await model.locator("[data-fm2-lang]").click();
    ok(
      (await model.locator('[data-part="A"]').inputValue()) === m.sol.partials.A &&
        (await model.locator(`.aa-step-input[data-id="cut-${key}"]`).inputValue()) === cut,
      "typed model work survives the language switch",
    );
    ok(
      /Revisar mi modelo/.test(await model.locator('[data-act="check"]').innerText()),
      "model labels switch to Spanish",
    );
    await model.close();
    const list = await open(desktop, { grade: 4, skill: "g4-factor-pairs", level: 1 });
    const l = await state(list);
    await list.locator('.aa-step-input[data-id="rows"]').fill(String(l.sol.list[0][0]));
    await list.locator('.aa-step-input[data-id="rows"]').press("Tab");
    await list.locator('.aa-step-input[data-id="cols"]').fill(String(l.sol.list[0][1]));
    await list.locator('.aa-step-input[data-id="cols"]').press("Tab");
    await list.locator('[data-act="add"]').click();
    await list.locator("[data-fm2-lang]").click();
    ok(
      (await list.locator(".aa-chip").count()) === 1 &&
        /Revisar mi lista/.test(await list.locator('[data-act="check"]').innerText()),
      "a collected rectangle survives the language switch",
    );
    await list.close();
  }
  pass("switching to Spanish mid-round keeps placed tiles, typed work and listed rectangles");

  // 9b. dragging across the grid sets a rectangle and paints a row of tiles -----------------------------------------
  {
    const page = await open(desktop, { grade: 3, skill: "g3-mult-array", level: 2, seed: 3 });
    const center = async (r, c) => {
      const box = await page.locator(`#aa-c-${r}-${c}`).boundingBox();
      return [box.x + box.width / 2, box.y + box.height / 2];
    };
    await page.mouse.move(...(await center(0, 0)));
    await page.mouse.down();
    await page.mouse.move(...(await center(2, 3)), { steps: 6 });
    await page.mouse.up();
    ok(
      /3 rows × 4 columns = 12 squares/.test(await page.locator(".aa-readout").innerText()),
      "drag sets a 3 by 4 rectangle",
    );
    await page.goto(
      h.play({
        game: "array-architect",
        grade: 3,
        skill: "g3-area-tile",
        level: 2,
        seed: 3,
        lang: "en",
      }),
    );
    await page.waitForSelector(".aa-grid");
    await page.mouse.move(...(await center(0, 0)));
    await page.mouse.down();
    for (const c of [1, 2, 3]) await page.mouse.move(...(await center(0, c)), { steps: 3 });
    await page.mouse.up();
    ok(
      (await page.locator(".aa-cell.aa-on").count()) === 4,
      "dragging across four squares places four tiles",
    );
    await page.close();
  }
  pass("dragging across the grid sets a rectangle and paints tiles");

  // 10. touch at 375px --------------------------------------------------------------------------------------------
  const phone = await h.context({ width: 375, height: 812, touch: true });
  for (const [skill, grade] of [
    ["k-rows", 0],
    ["g3-area-tile", 3],
    ["g4-area-model", 4],
    ["g6-composite", 6],
    ["g8-factor", 8],
    ["g7-scale", 7],
    ["g4-factor-pairs", 4],
  ]) {
    const page = await open(phone, { grade, skill, level: 2 });
    await solveUi(page, "tap");
    await solved(page);
    ok(!(await hasOverflow(page)), `${skill} has no horizontal overflow at 375`);
    ok(
      (await stageSmallTargets(page)).length === 0,
      `${skill} has no touch target under 44px: ${await stageSmallTargets(page)}`,
    );
    await page.close();
  }
  pass("tap interactions solve rounds at 375px with no overflow and no small targets");

  // 11. layout at 320, 375, 768 and 1440 and the size of grid cells -------------------------------------------------
  for (const width of [320, 375, 768, 1440]) {
    const context = await h.context({ width, height: 900, touch: width < 500 });
    for (const [skill, grade, level] of [
      ["g3-mult-array", 3, 2],
      ["g4-factor-pairs", 4, 3],
      ["g5-volume", 5, 1],
      ["g6-composite", 6, 3],
      ["g7-expand", 7, 3],
      ["g8-factor", 8, 3],
      ["g6-lcm", 6, 3],
      ["k-count", 0, 3],
      ["g8-expand", 8, 3],
    ]) {
      const page = await open(context, { grade, skill, level });
      ok(!(await hasOverflow(page)), `${skill} has no horizontal overflow at ${width}`);
      const small = await stageSmallTargets(page);
      ok(small.length === 0, `${skill} at ${width} has small targets: ${small}`);
      const cells = await page
        .locator(".aa-cell:not(.aa-off)")
        .evaluateAll((list) =>
          list.map((e) =>
            Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height),
          ),
        );
      ok(
        cells.every((size) => size >= 43.9),
        `${skill} at ${width} keeps grid cells at 44px or more`,
      );
      await page.close();
    }
    await context.close();
  }
  pass(
    "no horizontal overflow at 320, 375, 768 and 1440, touch targets and grid cells at least 44px",
  );

  // 12. keyboard only ----------------------------------------------------------------------------------------------
  for (const [skill, grade, level] of [
    ["k-rows", 0, 2],
    ["g3-area-tile", 3, 3],
    ["g6-composite", 6, 1],
    ["g4-area-model", 4, 2],
    ["g4-factor-pairs", 4, 3],
    ["g5-volume", 5, 1],
    ["g8-factor", 8, 2],
    ["g2-even-odd", 2, 1],
    ["g7-scale", 7, 2],
  ]) {
    const page = await open(desktop, { grade, skill, level, seed: SEED + 11 });
    await solveUi(page, "key");
    await solved(page).catch((error) => {
      throw new Error(`keyboard-only ${skill} L${level}: ${error.message}`);
    });
    await page.close();
  }
  pass(
    "rounds on the grid, area models, lists, prisms, tiles, pairs and scaling are all completed with the keyboard only",
  );
  {
    const page = await open(desktop, { grade: 5, skill: "g5-volume", level: 1 });
    await tabTo(page, '[data-act="inc"][data-id="layers"]');
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    ok(
      (await page.locator('.aa-step-input[data-id="layers"]').inputValue()) === "3",
      "plus and minus buttons work from the keyboard",
    );
    await page.close();
  }

  // 13. axe, wcag2a and wcag2aa, both languages ---------------------------------------------------------------------
  for (const lang of ["en", "es"]) {
    for (const [skill, grade, level] of [
      ["k-rows", 0, 2],
      ["g2-even-odd", 2, 2],
      ["g3-area-tile", 3, 3],
      ["g4-factor-pairs", 4, 2],
      ["g4-area-model", 4, 2],
      ["g5-volume", 5, 2],
      ["g6-composite", 6, 3],
      ["g6-gcf", 6, 2],
      ["g7-scale", 7, 2],
      ["g8-factor", 8, 2],
      ["g8-expand", 8, 2],
    ]) {
      const page = await open(desktop, { grade, skill, level, lang });
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      ok(
        results.violations.length === 0,
        `axe ${skill} ${lang}: ${results.violations.map((v) => `${v.id} ${v.nodes[0]?.target}`).join("; ")}`,
      );
      await page.close();
    }
  }
  pass("axe-core (wcag2a, wcag2aa) finds no violations in English or Spanish");

  assertClean(h.problems, "array-architect");
  pass("no console, network or page errors during the whole run");
  console.log(`array-architect acceptance: ${steps} groups passed.`);
} finally {
  await h.close();
}
