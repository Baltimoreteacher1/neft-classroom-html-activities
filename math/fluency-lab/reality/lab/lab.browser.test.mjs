// The Reality Lab in a real browser: the hub, a flagship journey through the actual controls, the Mistake Lab opened on a
// learner's own wrong answer, keyboard-only manipulation, resume after reload, Spanish, axe at phone and desktop widths
// in three grade bands, and horizontal overflow. Set LAB_SHOTS=/dir to keep screenshots.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../../../tools/lib/curriculum-source.mjs";

const shots = process.env.LAB_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}/math/fluency-lab/reality/lab/`;
let browser;
const errors = [];
try {
  browser = await chromium.launch({ headless: true });
  const open = async (query, viewport = { width: 1280, height: 900 }, context = null) => {
    const page = await (context ?? (await browser.newContext({ viewport }))).newPage();
    page.on("pageerror", (e) => errors.push(`${query}: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && errors.push(`${query}: ${m.text()}`));
    await page.goto(`${base}${query}`, { waitUntil: "networkidle" });
    return page;
  };
  const shot = async (page, name) => shots && (await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true }));
  const key = (page, k) => page.locator(`[data-key="${k}"]`);
  const click = (page, k) => key(page, k).click();
  const kicker = (page) => page.locator(".mr-kicker").textContent();
  const mission = (page) => page.locator("#mr-mission-h").innerText();
  const ro = (page) => page.locator(".mr-readout").innerText();

  // ---- hub ---------------------------------------------------------------------------------------------------------------
  {
    const page = await open("?grade=4");
    assert.match(await page.locator("h1").innerText(), /Math Reality Lab/);
    assert.ok((await page.locator(".mr-card").count()) >= 5, "experiences for the grade");
    assert.ok((await page.locator(".mr-skill").count()) >= 10, "every skill of the grade is listed");
    assert.match(await page.locator(".mr-skill-why").first().innerText(), /Studio/, "an exception states why and where the skill is served");
    await shot(page, "hub-4");
    await page.getByRole("link", { name: /Open: Cut it up/ }).click();
    await page.waitForSelector(".mr-stage");
    assert.match(await kicker(page), /Step 1 of 8/);
  }

  // ---- a skill link opens its experience: grade 6 divide-fractions is the X-Ray bar, drawn before it is cut ---------------------
  {
    const page = await open("?grade=6&skill=6%3Adivide-fractions&restart=1");
    await page.waitForSelector(".mr-stage");
    assert.ok((await page.locator("svg.mr-svg .mr-cut").count()) >= 2, "the uncut dividend bar shows its cut marks");
    assert.match(await page.locator("svg.mr-svg").first().getAttribute("aria-label"), /equal pieces/, "the bar is described");
    await shot(page, "skill-divide-fractions");
  }

  // ---- flagship 1 through real controls (mouse, then keyboard) -------------------------------------------------------------
  {
    const page = await open("?x=fraction-transform&grade=4&restart=1");
    assert.equal(await key(page, "next").isDisabled(), true, "Next waits for the build");
    await click(page, "cut-4");
    await page.locator(".mr-part").nth(0).click();
    await page.locator(".mr-part").nth(1).focus();
    await page.keyboard.press("Space"); // keyboard shades the second part
    await page.locator(".mr-part").nth(2).click();
    assert.match(await page.locator(".mr-fb.is-ok").first().innerText(), /3\/4/);
    await click(page, "next");
    await click(page, "opt-same");
    await click(page, "next");
    await click(page, "split-2");
    assert.match(await ro(page), /6\s*\n?\s*8/);
    // resume: reload mid-step and find the same model
    await page.reload({ waitUntil: "networkidle" });
    assert.match(await kicker(page), /Step 3 of 8/, "the step is saved");
    assert.match(await page.locator("svg.mr-svg").first().getAttribute("aria-label"), /8 equal parts, 6 shaded/, "the model is rebuilt from its saved moves");
    assert.equal(await key(page, "next").isEnabled(), true, "completed work stays completed");
    await click(page, "undo");
    assert.match(await ro(page), /3\s*\n?\s*4/);
    await click(page, "redo");
    await click(page, "next");
    await click(page, "opt-amount");
    await click(page, "next");
    await click(page, "rep-line");
    assert.equal(await page.locator(".mr-tab[aria-pressed='true']").innerText(), "Number line");
    await shot(page, "fraction-line");
  }

  // ---- Mistake Lab opens on the learner's own answer -------------------------------------------------------------------------
  {
    const page = await open("?x=mistake-decimal&grade=5&restart=1&a=0.4&b=0.35&r=0.39");
    const text = await page.locator(".mr-diagnose").innerText();
    assert.match(text, /smaller than one of the numbers/, "a confirmed fact");
    assert.match(text, /may have added the digits/, "a hypothesis, worded as one");
    assert.doesNotMatch(text, /0\.75/, "the answer is not handed over");
    await click(page, "probe-a");
    await click(page, "next");
    for (let i = 0; i < 4; i++) await click(page, "A-tenths-add1");
    await click(page, "next");
    for (let i = 0; i < 7; i++) await click(page, "B-hundredths-add5");
    await click(page, "next");
    await click(page, "combine");
    for (let i = 0; i < 3; i++) await click(page, "trade-hundredths");
    assert.match(await ro(page), /0\.75/);
    await shot(page, "mistake-lab");
    // an impossible trade is refused, with a reason, and changes nothing
    await click(page, "trade-hundredths");
    assert.match(await page.locator(".mr-fb.is-warn").innerText(), /need 10/);
  }

  // ---- balance: one-sided change tips it, equal change restores it -----------------------------------------------------------
  {
    const page = await open("?x=balance-equation&grade=7&restart=1");
    await click(page, "opt-right");
    await click(page, "next");
    for (let i = 0; i < 2; i++) await click(page, "amt-plus");
    await click(page, "left-rem-u");
    assert.match(await ro(page), /x < 8/);
    assert.match(await ro(page), /Tipped/);
    await click(page, "right-rem-u");
    assert.match(await ro(page), /x = 5/);
    assert.match(await ro(page), /Balanced/);
    await shot(page, "balance");
  }

  // ---- area: the resize handle works without a pointer ------------------------------------------------------------------------
  {
    const page = await open("?x=discover-area&grade=3&restart=1");
    await click(page, "opt-double");
    await click(page, "next");
    await page.locator(".mr-knob").focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    assert.match(await ro(page), /6 × 4 = 24/);
    await page.keyboard.press("ArrowDown"); // the handle is the bottom-right corner, so down makes it taller
    assert.match(await ro(page), /6 × 5 = 30/);
  }

  // ---- Spanish and the language attribute -------------------------------------------------------------------------------------
  {
    const page = await open("?x=recipe-scaling&grade=6&restart=1");
    await click(page, "lang");
    assert.equal(await page.evaluate(() => document.documentElement.lang), "es");
    assert.match(await page.locator("h1").innerText(), /Escala una receta/);
    await click(page, "opt-3");
    await click(page, "next");
    await click(page, "make-3");
    assert.match(await ro(page), /porciones/);
    await click(page, "lang");
  }


  // ---- family companion: all eight sections, Spanish, no sideways scroll ---------------------------------------------------------
  {
    const page = await open("?family=fraction-transform&grade=4");
    for (const name of ["What we are learning", "Why it matters", "Try the model together", "Talk about it", "Practice together", "Watch for", "Try on their own", "What comes next"])
      assert.ok(await page.getByRole("heading", { name }).count(), `section ${name}`);
    assert.equal(await page.locator(".mr-fam-list li").count() >= 2, true);
    await click(page, "lang");
    assert.ok(await page.getByRole("heading", { name: "Lo que aprendemos" }).count(), "Spanish headings");
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    assert.deepEqual(result.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => v.id), [], "family page axe");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1);
    await shot(page, "family");
  }


  // ---- teacher view and preview mode: nothing a teacher opens changes a learner's saved progress ---------------------------------------
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await open("?teacher=1&grade=5", undefined, context);
    assert.ok((await page.locator(".mr-t-table tbody tr").count()) >= 10, "every skill of the grade is a row");
    assert.match(await page.locator(".mr-t-std").first().innerText(), /\d/, "a standard code is shown");
    const before = await page.evaluate(() => localStorage.getItem("ewl-reality-lab-v1"));
    await page.getByRole("link", { name: /Preview the activity: Add decimals/ }).click();
    await page.waitForSelector(".mr-stage");
    await page.locator('[data-key="probe-a"]').click().catch(() => {});
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => localStorage.getItem("ewl-reality-lab-v1"));
    assert.equal(after, before, "a preview writes nothing to the learner's saved progress");
    await context.close();
    // a student's browser is refused the teacher module: the page says what to do instead of showing nothing
    const blocked = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await blocked.route(/teacher\.js/, (route) => route.fulfill({ status: 401, body: "Unauthorized" }));
    const refused = await open("?teacher=1&grade=5", undefined, blocked);
    assert.match(await refused.locator("h1").innerText(), /teacher sign-in/);
    assert.ok(await refused.getByRole("link", { name: "Back to the Reality Lab" }).count());
    await blocked.close();
    // the browser logs the 401 we injected on purpose; that one line is the expected result, not a defect
    for (let i = errors.length - 1; i >= 0; i--) if (/\(Unauthorized\)/.test(errors[i]) && errors[i].startsWith("?teacher=1&grade=5")) errors.splice(i, 1);
    const t = await open("?teacher=1&grade=5");
    const result = await new AxeBuilder({ page: t }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    assert.deepEqual(result.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => v.id), [], "teacher view axe");
  }


  // ---- studio family companion and the grade's companion list --------------------------------------------------------------------
  {
    const list = await open("?family=&grade=3");
    assert.ok((await list.locator(".mr-card").count()) >= 8, "the grade's skills and the flagships are listed");
    const page = await open("?family=studio:3:mul-0-5&grade=3");
    assert.match(await page.locator("h1").innerText(), /Multiplication facts/);
    assert.ok((await page.locator(".mr-fam-list li").count()) >= 2);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    assert.deepEqual(result.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => v.id), [], "studio companion axe");
  }


  // ---- nine grade identities: distinct, accessible, and the hero really is interactive ----------------------------------------------
  {
    const seen = new Map();
    for (let g = 0; g <= 8; g++) {
      for (const [width, height] of [[390, 844], [1280, 900]]) {
        const page = await open(`?grade=${g}`, { width, height });
        assert.equal(await page.evaluate(() => document.documentElement.dataset.grade), String(g));
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(overflow <= 1, `grade ${g} hub scrolls sideways by ${overflow}px at ${width}px`);
        const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
        const bad = result.violations.filter((v) => ["serious", "critical"].includes(v.impact));
        assert.deepEqual(bad.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 80)}`), [], `grade ${g} hub at ${width}px`);
        // the spiral-review line always says why it is offered (a blank label here once shipped unnoticed)
        for (const review of await page.locator(".mr-review").all()) assert.match(await review.innerText(), /builds on/i, `grade ${g} review text`);
        if (width === 1280) {
          const fp = await page.evaluate(() => {
            const cs = getComputedStyle(document.querySelector(".mr-app"));
            return [cs.backgroundColor, getComputedStyle(document.querySelector("h1")).fontFamily.split(",")[0], getComputedStyle(document.querySelector(".mr-btn")).borderRadius, document.querySelector(".mr-grade-art svg").getAttribute("aria-label")].join("|");
          });
          seen.set(g, fp);
          await shot(page, `grade-${g}-hub`);
          // the hero responds: more groups means a bigger product, everywhere on the page
          const before = await page.locator(".mr-hero-svg").getAttribute("aria-label");
          await page.locator('[data-key="hero-rows-plus"]').click();
          const after = await page.locator(".mr-hero-svg").getAttribute("aria-label");
          assert.notEqual(after, before, `grade ${g} hero updates`);
          assert.match(after, /4 groups of 4 make 16/);
        }
      }
      const work = await open(`?x=balance-equation&grade=${g}&restart=1`);
      const wr = await new AxeBuilder({ page: work }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      assert.deepEqual(wr.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 80)}`), [], `grade ${g} workspace`);
    }
    assert.equal(new Set(seen.values()).size, 9, "nine grades, nine different identities");
    assert.equal(new Set([...seen.values()].map((v) => v.split("|")[0])).size >= 7, true, "colour differs by grade, not just by band");
  }

  // ---- axe and overflow: three grade bands, phone and desktop ------------------------------------------------------------------
  for (const [query, label] of [["?x=studio:1:make-10&grade=1&skill=1:make-10&restart=1", "g1"], ["?x=fraction-transform&grade=4&restart=1", "g4"], ["?x=balance-equation&grade=8&restart=1", "g8"], ["?grade=2", "hub2"]]) {
    for (const [width, height] of [[390, 844], [1280, 900]]) {
      const page = await open(query, { width, height });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 1, `${label} at ${width}px scrolls sideways by ${overflow}px`);
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const bad = result.violations.filter((v) => ["serious", "critical"].includes(v.impact));
      assert.deepEqual(bad.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 90)}`), [], `${label} at ${width}px`);
      await shot(page, `${label}-${width}`);
      const small = await page.evaluate(() => [...document.querySelectorAll(".mr-btn, .mr-input")].filter((el) => el.offsetParent && el.getBoundingClientRect().height < 43.5).map((el) => el.textContent.trim().slice(0, 20)));
      assert.deepEqual(small, [], `${label} at ${width}px has targets under 44px`);
    }
  }
  assert.deepEqual(errors, [], "no console errors or page errors");
  console.log("reality lab browser: hub, flagship, resume, Mistake Lab, balance, keyboard resize, Spanish, axe and overflow pass");
} finally {
  await browser?.close();
  await server.close();
}
