// Graded interactive answers on the real practice screen, in a browser: a skill with built answers opens a
// number line, coordinate grid, shaded bar, ten-frame, base-ten mat or inequality graph in the answer card; the
// learner builds the answer with the keyboard (or taps), Check grades it through the normal practice path, a miss
// names what to check without giving the answer, Spanish labels the controls, a phone does not scroll sideways,
// targets are 44px, and the console stays clean. Math.random is pinned below 1/3 so practice draws a built answer.
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";

const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
const errors = [];
let browser;

async function open(query, { width = 1280, height = 900, lang = "en" } = {}) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.addInitScript((language) => {
    Math.random = () => 0.2;
    localStorage.setItem("ewl-fluency-lang-v1", JSON.stringify(language));
  }, lang);
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => message.type() === "error" && errors.push(`console: ${message.text()}`));
  await page.goto(`${base}/math/fluency-lab/lab.html?${query}&stage=practice`, { waitUntil: "networkidle" });
  await page.locator("#response-widget").waitFor({ state: "visible" });
  return page;
}
// The practice feedback card (#feedback) carries the phase of the last check; read it after each Check.
const feedbackPhase = async (page) => {
  await page.locator("#feedback").waitFor({ state: "visible" });
  return page.locator("#feedback").getAttribute("data-phase");
};
const readout = (page) => page.locator("#response-widget .rw-readout").innerText();
const check = (page) => page.locator("#check-answer").click();

try {
  browser = await chromium.launch({ headless: true });

  // Grade 6 integers: place a number on the line by keyboard. A miss names the direction, then the right spot passes.
  {
    const page = await open("grade=6&skill=integers");
    const question = await page.locator("#question").innerText();
    const target = Number(/Place (\S+) on the number line/.exec(question)?.[1].replace("−", "-"));
    assert.ok(Number.isFinite(target), `a number-line item: ${question}`);
    assert.equal(await page.locator("#answer-input").isHidden(), true, "the typed answer box is hidden");
    const line = page.locator("#response-widget .rw-line");
    assert.equal(await line.getAttribute("role"), "slider");
    await check(page);
    assert.equal(await page.locator("#answer-result-status, .answer-result-status").first().innerText(), "Add an answer", "Check with nothing built is a nudge, not a miss");
    await line.focus();
    await page.keyboard.press("Home");
    assert.equal(await readout(page), "Your point: −10");
    await check(page);
    assert.ok(!["correct", "assisted"].includes(await feedbackPhase(page)), "a miss is not marked right");
    const nudge = await page.locator("#feedback").innerText();
    assert.ok(/too far left/.test(nudge), `the miss names the direction: ${nudge}`);
    if (process.env.SHOW_NUDGE) console.log(nudge);
    await line.focus();
    for (let v = -10; v < target; v += 1) await page.keyboard.press("ArrowRight");
    await check(page);
    assert.ok(["correct", "assisted"].includes(await feedbackPhase(page)), "the built answer is graded right");
    await page.context().close();
  }

  // Grade 7 inequalities: boundary by keyboard, circle and direction by buttons.
  {
    const page = await open("grade=7&skill=inequalities");
    const question = await page.locator("#question").innerText();
    const m = /Graph x (<|≤|>|≥) (\S+) on the number line/.exec(question);
    assert.ok(m, `an inequality item: ${question}`);
    const value = Number(m[2].replace("−", "-"));
    await page.locator("#response-widget .rw-line").focus();
    await page.keyboard.press("Home");
    for (let v = -10; v < value; v += 1) await page.keyboard.press("ArrowRight");
    await page.getByRole("button", { name: ["≤", "≥"].includes(m[1]) ? "Closed circle" : "Open circle" }).click();
    await page.getByRole("button", { name: ["<", "≤"].includes(m[1]) ? "Shade left" : "Shade right" }).click();
    await check(page);
    assert.ok(["correct", "assisted"].includes(await feedbackPhase(page)), "inequality graph graded right");
    await page.context().close();
  }

  // Grade 7 two-step equations: multi-line work typed line by line; a wrong line is marked, a correct path passes.
  {
    const page = await open("grade=7&skill=equations");
    const question = await page.locator("#question").innerText();
    const m = /Solve (\d+)x (−|\+) (\d+) = (-?\d+)\./.exec(question);
    assert.ok(m, `a work item: ${question}`);
    const [a, sign, b, c] = [Number(m[1]), m[2], Number(m[3]), Number(m[4])];
    const ax = sign === "+" ? c - b : c + b;
    const first = page.locator('#response-widget [data-line="0"]');
    await first.focus();
    await page.keyboard.type(`${a}x = ${ax + 1}`);
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("#response-widget [data-line]").count(), 2, "Enter starts a new line, it does not submit");
    await page.keyboard.type(`x = ${(ax + 1) / a}`);
    await check(page);
    assert.ok(!["correct", "assisted"].includes(await feedbackPhase(page)), "a wrong line is not marked right");
    assert.match(await page.locator("#feedback").innerText(), /Line 2 changes the solution/, "the wrong line is named");
    assert.equal(await page.locator('#response-widget [data-mark="0"]').getAttribute("data-state"), "check", "the line is marked");
    await first.fill(`${a}x = ${ax}`);
    await page.locator('#response-widget [data-line="1"]').fill(`x = ${ax / a}`);
    await check(page);
    assert.ok(["correct", "assisted"].includes(await feedbackPhase(page)), "corrected work is graded right");
    await page.context().close();
  }

  // Grade 3 equivalent fractions: shade parts of a bar (taps), in Spanish.
  {
    const page = await open("grade=3&skill=fraction-equivalence", { lang: "es" });
    // Fractions render stacked (numerator and denominator on separate lines); fold them back to a/b.
    const question = (await page.locator("#question").innerText()).replace(/\s*(\d+)\s*\n\s*(\d+)\s*\n/g, " $1/$2 ");
    const m = /has (\d+) equal parts\. Shade\s+(\d+)\/(\d+)/.exec(question);
    assert.ok(m, `a shade item: ${question}`);
    const shade = (Number(m[1]) / Number(m[3])) * Number(m[2]);
    const parts = page.locator("#response-widget [data-part]");
    assert.equal(await parts.count(), Number(m[1]));
    assert.match(await parts.first().getAttribute("aria-label"), /^Parte 1 de/, "Spanish part labels");
    for (let i = 0; i < shade; i += 1) await parts.nth(i).click();
    assert.match(await readout(page), /partes sombreadas/, "Spanish readout");
    await check(page);
    assert.ok(["correct", "assisted"].includes(await feedbackPhase(page)), "shaded bar graded right");
    await page.context().close();
  }

  // Kindergarten ten-frame and Grade 1 base-ten blocks on a phone: no sideways scroll, 44px targets.
  for (const [query, build] of [
    ["grade=0&skill=count-cardinality", async (page, q) => {
      const n = Number(/Show (\d+)/.exec(q)[1]);
      for (let i = 0; i < n; i += 1) await page.locator(`#response-widget [data-cell="${i}"]`).click();
    }],
    ["grade=1&skill=tens-ones", async (page, q) => {
      const n = Number(/Build (\d+)/.exec(q)[1]);
      for (let i = 0; i < Math.floor(n / 10); i += 1) await page.locator('#response-widget [data-more="tens"]').click();
      for (let i = 0; i < n % 10; i += 1) await page.locator('#response-widget [data-more="ones"]').click();
    }],
  ]) {
    const page = await open(query, { width: 390, height: 844 });
    const question = await page.locator("#question").innerText();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, `${query}: no sideways scroll at 390px`);
    for (const box of await page.locator("#response-widget button").evaluateAll((els) => els.map((el) => el.getBoundingClientRect())))
      assert.ok(box.height >= 44 && box.width >= 44, `${query}: 44px targets (${box.width}x${box.height})`);
    await build(page, question);
    await check(page);
    assert.ok(["correct", "assisted"].includes(await feedbackPhase(page)), `${query}: graded right`);
    await page.context().close();
  }

  assert.deepEqual(errors, [], "console stays clean");
  console.log("response.browser: number line, inequality, shaded bar (ES), ten-frame and base-ten blocks pass in practice");
} finally {
  await browser?.close();
  await server.close();
}
