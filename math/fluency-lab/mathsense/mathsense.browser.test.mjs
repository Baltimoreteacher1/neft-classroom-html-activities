// MathSense driven the way a learner drives it, in real Chromium: every editor updates every picture, compare mode,
// missions with independent versus supported evidence, a keyboard-only mission, reload, Spanish, the one live region,
// axe at 375 and 1440, targets, focus, forced colors and a clean console with no network traffic.
// Set MS_SHOTS=<dir> to save screenshots for a visual review.
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../../tools/lib/curriculum-source.mjs";

const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
const URL = `${origin}/math/fluency-lab/mathsense/`;
const shots = process.env.MS_SHOTS;
let browser;
const problems = [];
const requests = [];

const field = (page, kind) => page.locator(`#ms-in-${kind}`);
const values = async (page) => ({
  fraction: await field(page, "fraction").inputValue(),
  mixed: await field(page, "mixed").inputValue(),
  decimal: await field(page, "decimal").inputValue(),
  percent: await field(page, "percent").inputValue(),
});
const enter = async (page, kind, text) => {
  await field(page, kind).fill(text);
  await field(page, kind).press("Enter");
};
const live = (page) => page.locator("#ms-live").innerText();
const settled = (page) => page.waitForTimeout(260);
const evidenceOf = (page, key) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem("ewl-fluency-tutor-v2") || "{}").records?.[k]?.recent ?? [], key);
const focusWith = async (page, selector, key = "Tab") => {
  for (let i = 0; i < 160; i += 1) {
    if (await page.evaluate((s) => document.activeElement?.matches(s), selector)) return;
    await page.keyboard.press(key);
  }
  throw new Error(`could not reach ${selector} with ${key}`);
};
async function axe(page, label) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  assert.deepEqual(
    result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`),
    [],
    `axe ${label}`,
  );
}
async function smallTargets(page) {
  return page.evaluate(() => {
    const bad = [];
    const check = (el, what) => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height && (r.width < 43.5 || r.height < 43.5)) bad.push(`${what} ${el.id || el.textContent.trim().slice(0, 24)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    };
    for (const el of document.querySelectorAll("button, select, input[type=text], input[type=number], textarea, summary, #ms-back, [role=slider]")) check(el, el.tagName);
    for (const el of document.querySelectorAll("label:has(input[type=checkbox]), label:has(input[type=radio])")) check(el, "label");
    return bad;
  });
}
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

async function newPage(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
  const page = await context.newPage();
  page.on("console", (m) => ["error", "warning"].includes(m.type()) && problems.push(`console ${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => problems.push(`requestfailed: ${r.url()}`));
  page.on("response", (r) => r.status() >= 400 && problems.push(`http ${r.status()}: ${r.url()}`));
  page.on("request", (r) => requests.push({ url: r.url(), method: r.method() }));
  return { context, page };
}
const open = async (page, query = "") => {
  await page.goto(URL + query);
  await page.waitForSelector("html[data-ms-ready]");
};

try {
  browser = await chromium.launch({ headless: true });
  const { context, page } = await newPage();
  await open(page);

  // ---- 1. initial state, one live region, labels ---------------------------------------------------------------------
  assert.deepEqual(await values(page), { fraction: "3/4", mixed: "3/4", decimal: "0.75", percent: "75%" });
  assert.equal(await page.locator("[aria-live], [role=alert], [role=status], [role=log]").count(), 1, "exactly one live region");
  assert.equal(await page.locator("#ms-live").getAttribute("aria-live"), "polite");
  for (const id of ["bar", "line", "grid", "percent"]) {
    assert.equal(await page.locator(`#ms-${id}`).getAttribute("aria-valuetext"), "3/4, 0.75, 75%");
    assert.ok(await page.locator(`#ms-${id}`).getAttribute("aria-label"));
  }
  assert.equal(await page.title(), "MathSense | EduWonderLab Math Fluency Lab");
  assert.ok(await noOverflow(page), "no horizontal scroll at 1440");
  if (shots) await page.screenshot({ path: `${shots}/ms-1440-start.png`, fullPage: true });

  // ---- 2. every editor updates every picture -----------------------------------------------------------------------------
  await page.locator("#ms-bar").focus();
  await page.keyboard.press("ArrowRight");
  assert.deepEqual(await values(page), { fraction: "4/4", mixed: "1", decimal: "1", percent: "100%" });
  await page.waitForFunction(() => document.getElementById("ms-live").textContent.includes("The amount is 1"));
  assert.match(await live(page), /Fraction bar/);
  assert.match(await page.locator("#ms-percent").innerText().catch(() => ""), /|/);
  assert.match(await page.locator("#ms-percent svg title").textContent(), /Percent bar/);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  assert.equal((await values(page)).fraction, "2/4");
  assert.equal((await values(page)).percent, "50%", "a bad entry changes nothing");
  await page.selectOption("#ms-parts", "12");
  assert.equal((await values(page)).fraction, "6/12");
  assert.match(await page.locator("#ms-statements").innerText(), /6 of 12 equal pieces are shaded, so 6\/12 = 1\/2\./);
  assert.match(await page.locator("#ms-bar svg").innerHTML(), /6 of 12 pieces = 1\/2/);

  await enter(page, "decimal", "0.4");
  assert.deepEqual(await values(page), { fraction: "2/5", mixed: "2/5", decimal: "0.4", percent: "40%" });
  assert.equal(await page.locator("#ms-parts").inputValue(), "5", "the bar re-cut itself to fifths");
  assert.match(await page.locator("#ms-grid svg").innerHTML(), /40 of 100 squares = 0\.4/);
  assert.equal(await page.locator("#ms-grid").getAttribute("aria-valuetext"), "2/5, 0.4, 40%");

  await enter(page, "percent", "125%");
  assert.deepEqual(await values(page), { fraction: "5/4", mixed: "1 1/4", decimal: "1.25", percent: "125%" });
  assert.equal(await page.locator("#ms-grid svg rect.ms-well").count(), 2, "two decimal grids for more than one whole");
  assert.match(await page.locator("#ms-line svg").innerHTML(), /A 5\/4 = 1\.25/);
  assert.match(await page.locator("#ms-statements").innerText(), /5\/4 = 1 1\/4: 1 whole and 1\/4 more\./);

  await enter(page, "fraction", "1/3");
  assert.deepEqual(await values(page), { fraction: "1/3", mixed: "1/3", decimal: "0.(3)", percent: "33.(3)%" });
  assert.match(await page.locator("#ms-statements").innerText(), /close but not equal/);

  await enter(page, "decimal", "0.333");
  assert.equal((await values(page)).fraction, "333/1000", "a stopped decimal is a different number");
  assert.match(await page.locator("#ms-statements").innerText(), /falls between two lines/);
  assert.match(await page.locator("#ms-bar svg").innerHTML(), /between two lines of the 100-piece cut/);

  await enter(page, "mixed", "2 3/8");
  assert.deepEqual(await values(page), { fraction: "19/8", mixed: "2 3/8", decimal: "2.375", percent: "237.5%" });
  await enter(page, "decimal", "0,5");
  assert.deepEqual([(await values(page)).decimal, (await values(page)).fraction], ["0.5", "4/8"], "a decimal comma is read as a decimal point; the bar keeps its eighths");

  // a bad entry is explained, announced and changes nothing
  await enter(page, "decimal", "abc");
  assert.equal(await field(page, "decimal").getAttribute("aria-invalid"), "true");
  assert.match(await page.locator("#ms-err-decimal").innerText(), /could not read that/);
  await page.waitForFunction(() => document.getElementById("ms-live").textContent.includes("could not read"));
  assert.equal((await values(page)).percent, "50%", "a bad entry changes nothing");
  await enter(page, "percent", "900%");
  assert.match(await page.locator("#ms-err-percent").innerText(), /more than 5 wholes/);
  await enter(page, "decimal", "0.333...");
  assert.match(await page.locator("#ms-err-decimal").innerText(), /Three dots/);

  // pointer on the pictures
  await page.click("#ms-reset");
  const at = async (selector, x, y) => {
    await page.locator(`${selector} svg`).scrollIntoViewIfNeeded();
    const box = await page.locator(`${selector} svg`).boundingBox();
    const scale = box.width / 360;
    await page.mouse.click(box.x + x * scale, box.y + y * scale);
  };
  await at("#ms-line", 6 + 174, 40);
  assert.equal((await values(page)).fraction, "2/4", "the line snaps to the nearest piece");
  await at("#ms-grid", 60 + 4 * 24 + 12, 22 + 4 * 24 + 12);
  assert.equal((await values(page)).decimal, "0.45");
  assert.equal((await values(page)).fraction, "9/20");
  await at("#ms-percent", 6 + 0.3 * 348, 40);
  assert.equal((await values(page)).percent, "30%");
  await at("#ms-bar", 6 + 0.75 * 348, 40);
  assert.equal((await values(page)).decimal, "0.75", "the bar snaps to the nearest piece of its cut");

  // ---- 3. compare mode ------------------------------------------------------------------------------------------------
  await page.check("#ms-compare");
  await enter(page, "fraction", "2/3");
  await page.check('input[name="ms-active"][value="b"]');
  await enter(page, "fraction", "3/4");
  assert.match(await page.locator("#ms-compare-line").innerText(), /A = 2\/3 is less than B = 3\/4\. A is 0\.\(6\) and B is 0\.75\. B is 1\/12 more\./);
  assert.match(await page.locator("#ms-line svg").innerHTML(), /A 2\/3[\s\S]*B 3\/4/);
  assert.match(await page.locator("#ms-percent svg").innerHTML(), /B: 75% of one whole/);
  assert.equal(await page.locator("#ms-bar svg rect.ms-fill-b").count(), 1);
  await at("#ms-percent", 6 + 0.5 * 348, 40 + 78);
  assert.equal((await values(page)).percent, "50%", "a click on B's row edits B");
  await enter(page, "fraction", "2/3");
  assert.match(await page.locator("#ms-compare-line").innerText(), /A and B are equal: 2\/3 = 2\/3/);
  if (shots) await page.screenshot({ path: `${shots}/ms-1440-compare.png`, fullPage: true });
  await axe(page, "compare mode, 1440");
  await page.uncheck("#ms-compare");
  assert.equal(await page.locator("#ms-compare-line").innerText(), "");

  // ---- 4. missions: supported, independent, named slips, never the answer -------------------------------------------------
  await page.click('[data-mission="g45-equiv-twelfths"]');
  await page.waitForSelector("#ms-strip:not([hidden])");
  assert.deepEqual(await values(page), { fraction: "3/4", mixed: "3/4", decimal: "0.75", percent: "75%" });
  await page.click("#ms-strip-action");
  assert.match(await page.locator("#ms-feedback").innerText(), /Not yet\. The amount is right, but this task asks for 12 equal pieces and the bar has 4\./);
  let evidence = await evidenceOf(page, "4:fraction-equiv");
  assert.deepEqual(evidence.map((e) => [e.correct, e.independent]), [[false, true]], "first check, no hint: an independent miss");
  await page.click("#ms-hint");
  assert.equal(await page.locator(".ms-hints li").count(), 1);
  assert.doesNotMatch(await page.locator(".ms-hints").innerText(), /9\/12|9 twelfths/);
  await page.selectOption("#ms-parts", "12");
  await page.click("#ms-check");
  assert.match(await page.locator("#ms-feedback").innerText(), /Yes, that works\./);
  assert.match(await page.locator(".ms-done").innerText(), /Done with support/);
  evidence = await evidenceOf(page, "4:fraction-equiv");
  assert.deepEqual(evidence.map((e) => [e.correct, e.independent]), [[false, true], [true, false]], "the check after a hint is supported");
  assert.match(await page.locator('[data-mission="g45-equiv-twelfths"]').innerText(), /Done with support/);

  await page.click('[data-mission="g45-equiv-sixths"]');
  await page.selectOption("#ms-parts", "6");
  await page.locator("#ms-k").fill("1");
  await page.locator("#ms-k").press("Tab");
  await page.click("#ms-check");
  assert.match(await page.locator("#ms-feedback").innerText(), /changed the number of pieces but kept 1 shaded/);
  assert.doesNotMatch(await page.locator("#ms-mission").innerText(), /3\/6/);

  await page.click('[data-mission="g45-decimal-five-eighths"]');
  await page.fill("#ms-answer", "0.58");
  await page.press("#ms-answer", "Enter");
  assert.match(await page.locator("#ms-feedback").innerText(), /side by side/);
  assert.doesNotMatch(await page.locator("#ms-feedback").innerText(), /0\.625/);
  await page.fill("#ms-answer", "5/8");
  await page.press("#ms-answer", "Enter");
  assert.match(await page.locator("#ms-feedback").innerText(), /task asks for a decimal\. You wrote a fraction/);
  await page.fill("#ms-answer", "0.625");
  await page.press("#ms-answer", "Enter");
  assert.match(await page.locator("#ms-feedback").innerText(), /Yes, that works\./);
  assert.match(await page.locator(".ms-done").innerText(), /Done with support/, "retries after a miss are supported");

  await page.click('[data-band="6"]');
  await page.click('[data-mission="g6-benchmark-seven-twelfths"]');
  await page.getByLabel("More than 1/2").check();
  await page.click("#ms-check");
  assert.match(await page.locator(".ms-done").innerText(), /Done on my own/);
  evidence = await evidenceOf(page, "6:order-rational");
  assert.deepEqual(evidence.map((e) => [e.correct, e.independent]), [[true, true]]);
  assert.match(await page.locator("#ms-feedback").innerText(), /counts as independent work/);
  await page.click('[data-mission="g6-repeating-five-sixths"]');
  await page.getByLabel("0.83", { exact: true }).check();
  await page.click("#ms-check");
  assert.match(await page.locator("#ms-feedback").innerText(), /stops after two digits/);
  await page.click("#ms-hint");
  await page.click("#ms-hint");
  await page.click("#ms-hint");
  assert.equal(await page.locator(".ms-hints li").count(), 3);
  assert.equal(await page.locator("#ms-hint").isDisabled(), true);
  assert.doesNotMatch(await page.locator(".ms-hints").innerText(), /0\.8\(3\)/);

  // ---- 5. notice and explain --------------------------------------------------------------------------------------------------
  await page.fill("#ms-sentence", "The bar and the decimal show the same amount because the pieces match.");
  await page.click("#ms-sentence-save");
  assert.match(await page.locator("#ms-sentence-mirror").innerText(), /Saved\. Your sentence names: decimal, bar/);
  assert.match(await page.locator("#ms-saved").innerText(), /The bar and the decimal show the same amount because the pieces match\./);
  await page.click("#ms-sentence-save");
  assert.match(await page.locator("#ms-sentence-mirror").innerText(), /Write your sentence first/);

  // ---- 6. reload restores everything ------------------------------------------------------------------------------------------
  await enter(page, "fraction", "7/4");
  await page.reload();
  await page.waitForSelector("html[data-ms-ready]");
  assert.equal((await values(page)).fraction, "7/4");
  assert.match(await page.locator("#ms-saved").innerText(), /same amount because the pieces match/);
  assert.match(await page.locator('[data-mission="g6-benchmark-seven-twelfths"]').innerText(), /Done on my own/);
  assert.equal(await page.locator('[data-mission="g6-repeating-five-sixths"]').getAttribute("aria-current"), "true");
  assert.equal(await page.locator(".ms-hints li").count(), 3, "hints already used stay recorded");
  await page.click('[data-band="4-5"]');
  assert.match(await page.locator('[data-mission="g45-equiv-twelfths"]').innerText(), /Done with support/);

  // ---- 7. keyboard only: one full mission, Tab and keys, no pointer -------------------------------------------------------------------------
  await page.click("body", { position: { x: 3, y: 3 } });
  await page.evaluate(() => document.activeElement?.blur());
  await page.evaluate(() => window.scrollTo(0, 0));
  await focusWith(page, '[data-band="7-8"]');
  await page.keyboard.press("Enter");
  await focusWith(page, '[data-mission="g78-eighths-three-hundred-seventy-five"]');
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "ms-strip", "focus moves to the mission");
  await focusWith(page, "#ms-parts");
  await page.keyboard.press("8");
  assert.equal(await page.locator("#ms-parts").inputValue(), "8");
  await focusWith(page, "#ms-k", "Shift+Tab");
  await page.keyboard.type("3");
  await page.keyboard.press("Tab");
  assert.equal((await values(page)).decimal, "0.375");
  await focusWith(page, "#ms-strip-action", "Shift+Tab");
  await page.keyboard.press("Enter");
  assert.match(await page.locator(".ms-done").innerText(), /Done on my own/);
  evidence = await evidenceOf(page, "7:fraction-ops");
  assert.deepEqual(evidence.at(-1) && [evidence.at(-1).correct, evidence.at(-1).independent], [true, true]);
  // keyboard on the pictures, hints and a focus ring
  await page.locator("#ms-grid").focus();
  await page.keyboard.press("Shift+ArrowRight");
  assert.equal((await values(page)).decimal, "0.4", "Shift moves to the next tenth");
  await page.keyboard.press("ArrowLeft");
  assert.equal((await values(page)).decimal, "0.39", "an arrow moves to the previous hundredth");
  await page.keyboard.press("End");
  assert.equal((await values(page)).percent, "500%");
  await page.keyboard.press("Home");
  assert.equal((await values(page)).decimal, "0");
  assert.equal(await page.locator("#ms-grid").evaluate((el) => getComputedStyle(el).outlineWidth), "3px", "visible 3px focus ring");
  assert.ok((await smallTargets(page)).length === 0, `targets under 44px: ${(await smallTargets(page)).join(", ")}`);

  // ---- 8. Spanish --------------------------------------------------------------------------------------------------------------------
  await enter(page, "fraction", "3/8");
  await page.click("#ms-lang");
  assert.equal(await page.evaluate(() => document.documentElement.lang), "es");
  assert.equal(await page.locator("#ms-work-h").innerText(), "Espacio de trabajo conectado");
  assert.equal(await page.locator("#ms-lang").innerText(), "English");
  assert.match(await page.locator("#ms-statements").innerText(), /partes iguales/);
  assert.match(await page.locator("#ms-mission").innerText(), /Muestra 0\.375 en la barra usando 8 partes iguales\./);
  await page.click("#ms-hint");
  assert.match(await page.locator(".ms-hints").innerText(), /milésimos/);
  await page.click("#ms-check");
  assert.match(await page.locator("#ms-feedback").innerText(), /Sí, eso funciona\./);
  assert.match(await page.locator('[data-mission="g78-eighths-three-hundred-seventy-five"]').innerText(), /Terminada/);
  await enter(page, "decimal", "abc");
  assert.match(await page.locator("#ms-err-decimal").innerText(), /No pude leer eso/);
  await page.waitForFunction(() => document.getElementById("ms-live").textContent.includes("No pude leer"));
  await enter(page, "fraction", "1/3");
  assert.match(await page.locator("#ms-statements").innerText(), /se repiten para siempre/);
  const english = await page.evaluate(() =>
    document.querySelector("main").innerText.match(/\b(Fraction bar|Number line|Decimal grid|Percent bar|Hint|Check my|workspace|Reset|Compare two|Notice and explain|Save my|Linked|Mission \d)\b/g),
  );
  assert.equal(english, null, `English left on the Spanish screen: ${english}`);
  await page.fill("#ms-sentence", "La barra y el decimal muestran la misma cantidad porque las partes coinciden.");
  await page.click("#ms-sentence-save");
  assert.match(await page.locator("#ms-sentence-mirror").innerText(), /Guardada\. Tu oración nombra: decimal, barra/);
  await page.locator("[data-delete]").first().click();
  if (shots) await page.screenshot({ path: `${shots}/ms-1440-es.png`, fullPage: true });
  await axe(page, "Spanish, 1440");
  await page.reload();
  await page.waitForSelector("html[data-ms-ready]");
  assert.equal(await page.evaluate(() => document.documentElement.lang), "es", "the language is remembered");
  await page.click("#ms-lang");
  assert.equal(await page.evaluate(() => document.documentElement.lang), "en");
  await context.close();

  // ---- 9. phone width, axe, targets, error state, direct links ---------------------------------------------------------------------------
  const phone = await newPage({ viewport: { width: 375, height: 800 }, hasTouch: true });
  await open(phone.page, "?mission=g45-benchmark-half");
  assert.ok(await noOverflow(phone.page), "no horizontal scroll at 375");
  assert.match(await phone.page.locator("#ms-mission").innerText(), /closest to 1\/2/);
  await axe(phone.page, "mission open, 375");
  assert.deepEqual(await smallTargets(phone.page), [], "375px targets");
  await enter(phone.page, "decimal", "x");
  await axe(phone.page, "error state, 375");
  if (shots) await phone.page.screenshot({ path: `${shots}/ms-375.png`, fullPage: true });
  await phone.page.click("#ms-lang");
  assert.ok(await noOverflow(phone.page), "no horizontal scroll at 375 in Spanish");
  await axe(phone.page, "Spanish, 375");
  await phone.page.click("#ms-lang");
  await phone.context.close();

  const spanish = await newPage();
  await open(spanish.page, "?lang=es");
  assert.equal(await spanish.page.locator("#ms-work-h").innerText(), "Espacio de trabajo conectado");
  await spanish.context.close();

  // ---- 10. forced colors, reduced motion --------------------------------------------------------------------------------------------------
  const forced = await newPage({ forcedColors: "active", reducedMotion: "reduce" });
  await open(forced.page);
  await forced.page.check("#ms-compare");
  const fills = await forced.page.evaluate(() => ({
    shaded: getComputedStyle(document.querySelector("#ms-bar .ms-fill-a")).fill,
    well: getComputedStyle(document.querySelector("#ms-bar .ms-well")).fill,
    striped: getComputedStyle(document.querySelector("#ms-bar .ms-fill-b")).stroke,
    transition: getComputedStyle(document.querySelector(".ms-btn")).transitionDuration,
  }));
  assert.notEqual(fills.shaded, fills.well, "shaded and empty differ under forced colors");
  assert.notEqual(fills.striped, "none", "quantity B keeps a dashed outline under forced colors");
  assert.ok(["0s", "0.001s"].includes(fills.transition) || fills.transition === "0s");
  if (shots) await forced.page.screenshot({ path: `${shots}/ms-forced-colors.png`, fullPage: true });
  await forced.context.close();

  // ---- 11. nothing left the device, and the console stayed clean -------------------------------------------------------------------------
  const outside = requests.filter((r) => !r.url.startsWith(origin) && !r.url.startsWith("data:"));
  assert.deepEqual(outside, [], "no request leaves the origin");
  assert.deepEqual(requests.filter((r) => r.method !== "GET"), [], "no write request");
  assert.deepEqual(requests.filter((r) => r.url.includes("/api/")), [], "no API call");
  assert.deepEqual(problems, [], "console clean");
  console.log("MathSense browser checks passed");
} finally {
  await browser?.close();
  await server.close();
}
