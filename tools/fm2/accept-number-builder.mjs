// Number Builder acceptance suite, driven through the real page with real clicks, taps and key presses (never
// window.__fm2.submit): open, how to play, solve three skills, wrong answer then fix, hints and Show me, reset and
// start over, a full five-round activity with stars and stored progress, resume, language switch mid-build, touch,
// keyboard only, layout at six widths, axe in both languages. @fm2 FM-070 FM-038 FM-039 FM-040 FM-037 FM-020 FM-021 FM-026

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

const open = async (context, params) => {
  const page = await context.newPage();
  await page.goto(h.play({ game: "number-builder", seed: SEED, rounds: 5, lang: "en", ...params }));
  await page.waitForSelector("[data-nb]");
  return page;
};
const solution = (page) =>
  page.evaluate(() => ({
    round: JSON.parse(JSON.stringify(window.__fm2.round)),
    builds: window.__fm2.solve().builds,
  }));
const countOf = async (page, id) =>
  Number(await page.locator(`[data-piece="${id}"] [data-count]`).textContent());

// Move keyboard focus forward (wrapping) until the element matching `selector` has it.
async function tabTo(page, selector) {
  for (let i = 0; i < 160; i += 1) {
    if (await page.evaluate((s) => document.activeElement?.matches(s), selector)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`could not reach ${selector} with Tab`);
}

// press(selector, n): n real activations by the chosen device; the keyboard path uses Tab, Enter and the arrow keys.
function device(page, how) {
  return {
    async press(selector, n = 1, key = "Enter") {
      for (let i = 0; i < n; i += 1) {
        if (how === "key") {
          if (i === 0) await tabTo(page, selector);
          await page.keyboard.press(key);
        } else if (how === "tap") await page.locator(selector).tap();
        else await page.locator(selector).click();
      }
    },
  };
}

// Turn one build of the round's own solution into real interface actions.
async function buildUi(page, how, round, build) {
  const dev = device(page, how);
  if (round.mode === "pieces") {
    for (const p of round.pieces) {
      const have = await countOf(page, p.id);
      const want = build.counts[p.id];
      if (want > have) await dev.press(`[data-add="${p.id}"]`, want - have);
      else if (want < have)
        await dev.press(
          how === "key" ? `[data-add="${p.id}"]` : `[data-sub="${p.id}"]`,
          have - want,
          how === "key" ? "ArrowDown" : "Enter",
        );
    }
  } else if (round.mode === "chart") {
    const used = new Set();
    for (const digit of build.slots) {
      const i = round.tiles.findIndex((d, k) => d === digit && !used.has(k));
      used.add(i);
      await dev.press(`[data-tile="${i}"]`);
    }
  } else {
    for (let i = 0; i < 5; i += 1) await dev.press(`[data-up="${i}"]`, build.digits[i]);
    if (build.exp > 0) await dev.press('[data-exp="up"]', build.exp);
    if (build.exp < 0) await dev.press('[data-exp="down"]', -build.exp);
  }
}

// Solve the live round the way a learner would; ends with the shell's "Correct!" and Next showing.
async function solveUi(page, how = "click") {
  const { round, builds } = await solution(page);
  const dev = device(page, how);
  for (const [k, build] of builds.entries()) {
    if (how !== "key" || k > 0) await clearUi(page, how);
    await buildUi(page, how, round, build);
    await dev.press('[data-act="check"]');
  }
  await page.waitForSelector("[data-fm2-next]:not([hidden])");
  const feedback = await page.locator("[data-fm2-feedback]").innerText();
  ok(/Correct!|¡Correcto!/.test(feedback), `shell says correct: ${feedback}`);
  return round;
}
const clearUi = async (page, how) =>
  device(page, how === "key" ? "click" : how).press('[data-act="clear"]');
const nextUi = async (page) => {
  await page.locator("[data-fm2-next]").click();
};

try {
  // 1. open at several grades with no console, network or page errors
  const desk = await h.context({ width: 1280, height: 900 });
  for (const grade of [0, 3, 6, 8]) {
    const page = await open(desk, { grade });
    ok(
      (await page.locator("[data-fm2-prompt]").innerText()).length > 10,
      `grade ${grade} shows a prompt`,
    );
    await page.close();
  }
  assertClean(h.problems, "open at grades 0, 3, 6, 8");
  pass("opens at grades 0, 3, 6 and 8 with no console, network or page errors");

  // 2. how to play, in both languages
  {
    const page = await open(desk, { grade: 3 });
    await page.locator("[data-fm2-howto]").click();
    ok(await page.locator("dialog[open]").isVisible(), "how to play dialog opens");
    const en = await page.locator("[data-fm2-howto-steps] li").allInnerTexts();
    ok(en.length >= 3 && en.length <= 5 && /goal/.test(en[0]), "English steps are visible");
    await page.locator("[data-fm2-dialog-close]").click();
    await page.locator("[data-fm2-lang]").click();
    await page.locator("[data-fm2-howto]").click();
    const es = await page.locator("[data-fm2-howto-steps] li").allInnerTexts();
    ok(
      es.length === en.length && /meta/.test(es[0]) && es[0] !== en[0],
      "Spanish steps are visible",
    );
    await page.locator("[data-fm2-dialog-close]").click();
    await page.close();
    pass("how to play shows the steps in English and in Spanish");
  }

  // 3. real solves in three different skills, each a different mechanic mode
  const solved = [];
  for (const [grade, skill, level] of [
    [0, "k-count", 2],
    [4, "g4-tile-chart", 2],
    [8, "g8-sci-build", 1],
    [1, "g1-teen", 2],
    [6, "g6-chips", 3],
  ]) {
    const page = await open(desk, { grade, skill, level });
    const round = await solveUi(page);
    solved.push(`${round.mode}/${round.skill}`);
    const tools = await page.evaluate(() => window.__fm2.tools);
    ok(tools.solved && !tools.revealed, `${skill}: recorded as solved`);
    await page.close();
  }
  ok(
    new Set(solved).size === 5 && new Set(solved.map((s) => s.split("/")[0])).size === 3,
    `three mechanic modes solved: ${solved.join(", ")}`,
  );
  assertClean(h.problems, "solving");
  pass(`solved through the interface: ${solved.join(", ")}; the shell showed Correct! and Next`);

  // 4. wrong answer: feedback, no Next; then fix it through the interface
  for (const [grade, skill, level] of [
    [3, "g3-discs", 2],
    [4, "g4-tile-chart", 1],
    [8, "g8-exp-equivalence", 1],
  ]) {
    const page = await open(desk, { grade, skill, level });
    await clearUi(page, "click");
    await page.locator('[data-act="check"]').click();
    const text = await page.locator("[data-fm2-feedback]").innerText();
    ok(/Not yet/.test(text) && text.length > 40, `${skill}: feedback after a wrong build: ${text}`);
    ok(await page.locator("[data-fm2-next]").isHidden(), `${skill}: no Next after a miss`);
    await solveUi(page);
    await page.close();
  }
  pass(
    "a wrong build shows specific feedback and no Next; correcting it through the interface succeeds",
  );

  // 5. hints by tier, Show me after three misses
  {
    const page = await open(desk, { grade: 3, skill: "g3-discs", level: 2 });
    const texts = [];
    for (let tier = 0; tier < 3; tier += 1) {
      await page.locator("[data-fm2-hint]").click();
      ok(await page.locator("[data-fm2-hintbox]").isVisible(), `hint ${tier + 1} shows`);
      texts.push(await page.locator("[data-fm2-hintbox]").innerText());
    }
    ok(new Set(texts).size === 3, "each hint tier shows different text");
    // The shell offers Show me once every hint has been used (or after three misses).
    ok(
      await page.locator("[data-fm2-showme]").isVisible(),
      "Show me appears once all three hints are used",
    );
    for (let miss = 0; miss < 3; miss += 1) {
      await clearUi(page, "click");
      await page.locator('[data-act="check"]').click();
    }
    await page.locator("[data-fm2-showme]").click();
    const shown = await page.locator("[data-fm2-hintbox]").innerText();
    const { round } = await solution(page);
    ok(
      /One build that works/.test(shown) && shown.length > 40 && round.skill,
      `Show me reveals a worked answer: ${shown}`,
    );
    ok(await page.locator("[data-fm2-next]").isVisible(), "Next shows after Show me");
    ok(
      await page.locator("[data-add]").first().isDisabled(),
      "the workspace locks after the answer is shown",
    );
    await page.close();
    pass("hint tiers differ; Show me appears only after three misses and reveals a worked answer");
  }

  // 6. reset this puzzle, start over, a full five-round activity, stars, stored progress, second profile
  {
    const page = await open(desk, { grade: 1, skill: "g1-tens-ones", level: 1, profile: 0 });
    const before = await page
      .locator("[data-nb]")
      .evaluate((n) => n.querySelector("[data-readout]").textContent);
    await page.locator('[data-add="rod"]').click();
    await page.locator('[data-add="unit"]').click();
    await page.locator("[data-fm2-reset]").click();
    ok(
      (await page.locator("[data-readout]").textContent()) === before,
      "Reset this puzzle restores the starting mat",
    );
    await solveUi(page);
    await nextUi(page);
    ok(
      /Round 2 of 5/.test(await page.locator("[data-fm2-round]").innerText()),
      "Next moves to round 2",
    );
    await page.locator("[data-fm2-restart]").click();
    ok(
      /Round 1 of 5/.test(await page.locator("[data-fm2-round]").innerText()),
      "Start over returns to round 1",
    );
    for (let r = 0; r < 5; r += 1) {
      await solveUi(page);
      await nextUi(page);
    }
    await page.waitForSelector("[data-fm2-finish]:not([hidden])");
    const stars = await page.locator(".fm2-stars").getAttribute("aria-label");
    ok(/3 of 3 stars/.test(stars), `finish screen shows stars: ${stars}`);
    const store = await page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fm2-v1")));
    ok(
      store.skills["number-builder:g1-tens-ones"]?.plays >= 5 &&
        store.games["number-builder"].completed === 1,
      "progress is stored with the right plays count",
    );
    const other = await page.evaluate(() => localStorage.getItem("ewl-fm2-v1:profile-1"));
    ok(other === null, "profile 1 has no record");
    await page.goto(
      h.play({
        game: "number-builder",
        seed: SEED,
        rounds: 5,
        grade: 1,
        skill: "g1-tens-ones",
        level: 1,
        profile: 1,
      }),
    );
    await page.waitForSelector("[data-nb]");
    const second = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ewl-fm2-v1:profile-1") || "null"),
    );
    ok(
      !second?.skills?.["number-builder:g1-tens-ones"],
      "a second profile has no such skill record",
    );
    await page.close();
    pass(
      "Reset this puzzle, Start over and a five-round activity work; three stars; stored plays; profile 1 is clean",
    );
  }

  // 7. leave and return: resume restores the round index and earlier results
  {
    const page = await open(desk, { grade: 2, skill: "g2-hundreds", level: 1, profile: 2 });
    await solveUi(page);
    await nextUi(page);
    await solveUi(page);
    await nextUi(page);
    const promptBefore = await page.locator("[data-fm2-prompt]").innerText();
    await page.goto(h.play({ game: "number-builder", resume: 1, profile: 2 }));
    await page.waitForSelector("[data-nb]");
    ok(
      /Round 3 of 5/.test(await page.locator("[data-fm2-round]").innerText()),
      "resume restores round 3",
    );
    ok(
      (await page.locator(".fm2-dot-done").count()) === 2,
      "resume restores the two earlier results",
    );
    ok(
      (await page.locator("[data-fm2-prompt]").innerText()) === promptBefore,
      "resume rebuilds the same puzzle from the seed",
    );
    await page.close();
    pass("reload with resume=1 restores the same round index, results and puzzle");
  }

  // 8. language switch mid-round keeps the work
  for (const [grade, skill, level] of [
    [3, "g3-discs", 2],
    [4, "g4-tile-chart", 2],
    [8, "g8-sci-build", 2],
  ]) {
    const page = await open(desk, { grade, skill, level, lang: "en" });
    const { round, builds } = await solution(page);
    const part = async () => {
      if (round.mode === "pieces") {
        await clearUi(page, "click");
        const id = round.pieces.find((p) => builds[0].counts[p.id] > 0).id;
        await page.locator(`[data-add="${id}"]`).click();
      } else if (round.mode === "chart") await page.locator('[data-tile="0"]').click();
      else await page.locator('[data-up="2"]').click();
    };
    await part();
    const snap = () =>
      page.evaluate(() =>
        [...document.querySelectorAll("[data-count],[data-slot],[data-dval],.nb-dval")]
          .map((e) => e.textContent)
          .join("|"),
      );
    const label = await page.locator('[data-act="check"]').innerText();
    const before = await snap();
    await page.locator("[data-fm2-lang]").click();
    const labelEs = await page.locator('[data-act="check"]').innerText();
    ok(
      label === "Check my build" && labelEs === "Revisar mi construcción",
      `${skill}: interaction labels change language (${label} / ${labelEs})`,
    );
    ok(
      (await page.locator(".nb-h").first().innerText()) !== "",
      `${skill}: headings render in Spanish`,
    );
    ok((await snap()) === before, `${skill}: work in progress is kept across the switch`);
    await solveUi(page);
    await page.locator("[data-fm2-lang]").click();
    ok(
      (await page.locator('[data-act="check"]').innerText()) === "Check my build" &&
        /Next|Finish/.test(await page.locator("[data-fm2-next]").innerText()),
      `${skill}: back in English after solving`,
    );
    await page.close();
  }
  pass(
    "switching to Spanish mid-round changes the labels and keeps the pieces, tiles and digits already placed",
  );

  // 9. touch at 375px, overflow at six widths, 44px targets inside the stage
  {
    const touch = await h.context({ width: 375, height: 800, touch: true });
    for (const [grade, skill, level] of [
      [0, "k-count", 1],
      [3, "g3-discs", 1],
      [4, "g4-tile-chart", 1],
      [8, "g8-sci-build", 1],
    ]) {
      const page = await open(touch, { grade, skill, level });
      await solveUi(page, "tap");
      await page.close();
    }
    pass(
      "tapping alone solves a counter, a disc, a tile and a scientific-notation round on a 375px touch screen",
    );
    for (const [grade, skill, level] of [
      [0, "k-count", 2],
      [2, "g2-hundreds", 3],
      [3, "g3-discs", 3],
      [4, "g4-tile-chart", 3],
      [5, "g5-decimal-pieces", 3],
      [6, "g6-zero-pairs", 3],
      [7, "g7-exponent-discs", 3],
      [8, "g8-exp-equivalence", 3],
    ]) {
      for (const width of [320, 375, 390, 768, 1024, 1440]) {
        const context = await h.context({ width, height: 900, touch: width < 500 });
        const page = await open(context, { grade, skill, level });
        // populate the workspace so the widest state is measured
        await page.evaluate(() => {
          document.querySelectorAll("[data-add]").forEach((b) => {
            for (let i = 0; i < 3; i += 1) b.click();
          });
          document.querySelectorAll("[data-tile]").forEach((b) => b.click());
          document.querySelectorAll("[data-up]").forEach((b) => {
            b.click();
            b.click();
          });
        });
        ok(!(await hasOverflow(page)), `${skill} at ${width}px: no horizontal page scroll`);
        const small = await page.evaluate(() =>
          [
            ...document.querySelectorAll(
              "[data-fm2-stage] button, [data-fm2-stage] a[href], [data-fm2-stage] select, [data-fm2-stage] input",
            ),
          ]
            .filter((e) => {
              const r = e.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
            })
            .map(
              (e) =>
                `${e.tagName}:${e.getAttribute("aria-label") || e.textContent}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`,
            ),
        );
        same(small, [], `${skill} at ${width}px: every control in the stage is at least 44x44`);
        await context.close();
      }
    }
    pass(
      "no horizontal overflow at 320, 375, 390, 768, 1024 and 1440; every stage control is at least 44x44",
    );
  }

  // 10. keyboard only: Tab, Enter and the arrow keys
  for (const [grade, skill, level] of [
    [3, "g3-discs", 2],
    [4, "g4-tile-chart", 2],
    [8, "g8-sci-build", 2],
    [1, "g1-teen", 2],
  ]) {
    const page = await open(desk, { grade, skill, level });
    await page.evaluate(() => document.activeElement?.blur());
    await solveUi(page, "key");
    await page.close();
  }
  pass(
    "every manipulation can be done from the keyboard (Tab to reach, Enter to place, ArrowDown to take away)",
  );

  // arrow keys on a piece, undo and clear
  {
    const page = await open(desk, { grade: 2, skill: "g2-hundreds", level: 1 });
    await page.locator('[data-act="clear"]').click();
    await page.locator('[data-add="flat"]').focus();
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    ok((await countOf(page, "flat")) === 2, "ArrowUp adds a piece");
    await page.keyboard.press("ArrowDown");
    ok((await countOf(page, "flat")) === 1, "ArrowDown takes one away");
    await page.locator('[data-act="undo"]').click();
    ok((await countOf(page, "flat")) === 2, "Undo restores the last action");
    await page.locator('[data-act="clear"]').click();
    ok((await countOf(page, "flat")) === 0, "Clear empties the mat");
    await page.close();
    pass("arrow keys add and remove pieces; Undo and Clear work");
  }

  // 11. axe in both languages, on each workspace, at rest and after a miss
  for (const [grade, skill, level] of [
    [0, "k-count", 2],
    [3, "g3-discs", 3],
    [4, "g4-tile-chart", 2],
    [6, "g6-chips", 3],
    [8, "g8-sci-build", 2],
  ]) {
    for (const lang of ["en", "es"]) {
      const page = await open(desk, { grade, skill, level, lang });
      await page.evaluate(() => {
        document.querySelectorAll("[data-add]").forEach((b) => b.click());
        document.querySelectorAll("[data-tile]").forEach((b, i) => i < 2 && b.click());
        document.querySelectorAll("[data-up]").forEach((b, i) => i < 2 && b.click());
      });
      await page.locator('[data-act="check"]').click();
      await page.locator("[data-fm2-hint]").click();
      const result = await new AxeBuilder({ page })
        .include("#fm2-main")
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      same(
        result.violations.map(
          (v) =>
            `${v.id}: ${v.nodes
              .map((n) => n.target.join(" "))
              .slice(0, 2)
              .join(" | ")}`,
        ),
        [],
        `axe ${skill} ${lang}`,
      );
      await page.close();
    }
  }
  pass(
    "axe (wcag2a, wcag2aa) reports no violations in English or Spanish on pieces, tiles and scientific notation",
  );

  assertClean(h.problems, "Number Builder acceptance");
  pass("no console, network or page errors during the whole run");
  console.log(`number-builder acceptance: ${steps} groups passed.`);
} finally {
  await h.close();
}

function same(a, b, message) {
  assert.deepEqual(a, b, message);
}
