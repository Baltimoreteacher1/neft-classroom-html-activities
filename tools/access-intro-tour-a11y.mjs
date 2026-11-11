#!/usr/bin/env node
import { BAND_TOUR } from "../access-practice-lab/src/intro/tour-bands.js";
/**
 * Guided Tour accessibility sweep (/start/tour): every grade choice (K, 1, 2-3, 4-5, 6-8) x all six steps, at 1280
 * and 390 px, with the live activity panel opened on the four domain steps and the "Show to the class" view opened on
 * the plan step. Each state must have:
 *   - axe (wcag2a/aa, 21a/aa, 22aa) serious + critical = 0 on the tour page. The live panel's inner document is a lab
 *     activity page and is excluded here (`iframe.tr-frame`): those pages have their own browser gates
 *     (access-lab-sweep, access-early-e2e, access-lesson-frame-e2e). Its <iframe> element itself (title) is checked.
 *   - 44 x 44 px targets on every tour control (links inside a sentence are exempt, WCAG 2.5.8);
 *   - no horizontal scroll; no console error from the tour page or the panel.
 * At 1280 it also proves auto-tick: for each domain step it presses, inside the live panel, a real control each step
 * names and checks that the step's checkbox ticked itself.
 *   node tools/access-intro-tour-a11y.mjs [--picks=K,1] [--widths=390]
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { serveAccess } from "./lib/access-serve.mjs";

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const PICKS = arg("picks")?.split(",") || Object.keys(BAND_TOUR);
const WIDTHS = (arg("widths")?.split(",") || ["1280", "390"]).map(Number);
const STEPS = 6;
const SHOTS = process.env.TOUR_A11Y_SHOTS || "";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn(
    "access-intro-tour-a11y: SKIP: playwright or @axe-core/playwright is not installed.",
  );
  process.exit(process.env.CI ? 1 : 0);
}
const { server, base } = await serveAccess();
const LAB = `${base}/access-practice-lab`;
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-intro-tour-a11y: SKIP: no browser (${error.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}

const failures = [];
let passes = 0;
const ok = (cond, msg) => {
  if (cond) passes++;
  else failures.push(msg);
  if (!cond) console.log(`FAIL ${msg}`);
};
const NOISE = /web-vitals|favicon|Failed to load resource/;

/** Controls under 44 x 44 px on the tour page (inline links in running text are exempt). */
const smallTargets = (page) =>
  page.evaluate(() => {
    const sel =
      ".tr-page a, .tr-page button, .tr-page summary, .tr-page input[type=text], .tr-page textarea, .tr-page label.in-opt, .tr-check label, .tr-show button";
    const inline = (el) =>
      el.tagName === "A" &&
      !el.classList.contains("btn") &&
      el.closest("p, li")?.textContent.trim() !== el.textContent.trim();
    return [...document.querySelectorAll(sel)]
      .filter((el) => el.offsetParent || el.getClientRects().length)
      .filter((el) => !inline(el))
      .map((el) => [el, el.getBoundingClientRect()])
      .filter(([, r]) => r.width > 0 && (r.width < 43.5 || r.height < 43.5))
      .map(
        ([el, r]) =>
          `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(" ")[0]}` : ""} "${el.textContent.trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`,
      );
  });

async function check(page, label, errors) {
  const res = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .exclude("iframe.tr-frame")
    .analyze();
  const bad = res.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  ok(
    bad.length === 0,
    `axe ${label}: ${bad
      .map(
        (v) =>
          `${v.id} (${v.nodes
            .map((n) => n.target.join(" "))
            .slice(0, 3)
            .join(" | ")})`,
      )
      .join("; ")}`,
  );
  const small = await smallTargets(page);
  ok(small.length === 0, `44px ${label}: ${small.join("; ")}`);
  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  ok(over <= 0, `horizontal scroll ${label}: ${over}px`);
  ok(errors.length === 0, `console ${label}: ${errors.join(" | ")}`);
  errors.length = 0;
}

/** Press, inside the live panel, one control each step names, and expect its checkbox to tick itself. */
const CLICK_FOR_STEP = {
  "K:listening": [
    "button:has-text('Hear it again')",
    [".early-pick", "button:has-text('Check')"],
    "[aria-label^='Hear: ']",
  ],
  "1:listening": [
    "button:has-text('Hear it again')",
    [".early-pick", "button:has-text('Check')"],
    "button:has-text('Hear the story again')",
  ],
  "2-3:reading": [".early-sentence", ".early-pick", "button:has-text('Check')"],
  // Step 3 ("Check my answer") needs an answer and a confidence first; steps 1-2 prove this activity.
  "4-5:reading": ["button:has-text('Got it, let me try')", "button:has-text('Highlight')", null],
  "6-8:speaking": [
    null,
    "button:has-text('Hear Lina first')",
    "summary:has-text('Show a sentence frame')",
  ],
};

async function autoTick(page, key) {
  const plan = CLICK_FOR_STEP[key];
  if (!plan) return;
  const frame = page.frameLocator("iframe.tr-frame");
  for (const [i, step] of plan.entries()) {
    if (!step) continue;
    // A step may need a choice first (Check stays disabled until a picture is chosen); the last selector is the one
    // the step names.
    const sels = [step].flat();
    for (const pre of sels.slice(0, -1))
      await frame
        .locator(pre)
        .first()
        .click({ timeout: 5000 })
        .catch(() => {});
    const sel = sels.at(-1);
    const target = frame.locator(sel).first();
    await target.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
    if (!(await target.isVisible())) {
      ok(false, `auto-tick ${key} step ${i + 1}: "${sel}" not visible in the panel`);
      continue;
    }
    const clicked = await target.click({ timeout: 5000 }).then(
      () => true,
      () => false,
    );
    if (!clicked) {
      ok(false, `auto-tick ${key} step ${i + 1}: could not press "${sel}"`);
      continue;
    }
    await page
      .waitForFunction((n) => document.querySelector(`[data-tr-tick="${n}"]`)?.checked, i, {
        timeout: 3000,
      })
      .catch(() => {});
    ok(
      await page.locator(`[data-tr-tick="${i}"]`).isChecked(),
      `auto-tick ${key} step ${i + 1} from "${sel}"`,
    );
  }
  const count = await page.locator("[data-tr-count]").innerText();
  ok(/ticked for you|All three done/.test(count), `auto-tick ${key} is announced ("${count}")`);
}

for (const width of WIDTHS) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(90000);
  const errors = [];
  page.on("pageerror", (e) => !NOISE.test(e.message) && errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !NOISE.test(m.text()) && errors.push(m.text()));
  for (const pick of PICKS) {
    await page.goto(`${LAB}/start`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.removeItem("accessPracticeLab:v1:intro"));
    for (let stop = 1; stop <= STEPS; stop++) {
      const label = `${pick} step ${stop} @${width}`;
      await page.goto(`${LAB}/start/tour?grades=${encodeURIComponent(pick)}&stop=${stop}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForSelector(".tr-page");
      if (await page.locator("[data-tr-launch]").count()) {
        const domain = await page
          .locator("[data-tr-stop][aria-current=step]")
          .getAttribute("data-tr-stop");
        await page.locator("[data-tr-launch]").click();
        const frame = page.frameLocator("iframe.tr-frame");
        await frame
          .locator("#app > :not(.boot):not(.route-loading)")
          .first()
          .waitFor({ timeout: 60000 });
        await page.waitForTimeout(400);
        await check(page, `${label} (live panel open)`, errors);
        if (width >= 1000) await autoTick(page, `${pick}:${domain}`);
      } else if (stop === STEPS) {
        await page.locator('input[name="tour-pick"]').first().check();
        await page.waitForSelector(".tr-plan-act");
        await check(page, `${label} (plan card)`, errors);
        await page.locator("[data-tr-show]").click();
        await page.waitForSelector("[data-tr-show-dialog][open]");
        await check(page, `${label} (Show to the class)`, errors);
        await page.keyboard.press("Escape");
        ok(
          await page.evaluate(() => document.activeElement?.matches("[data-tr-show]")),
          `Escape closes Show to the class and focus returns: ${label}`,
        );
      } else await check(page, label, errors);
      if (SHOTS)
        await page.screenshot({
          path: `${SHOTS}/tour-${pick}-${stop}-${width}.png`,
          fullPage: true,
        });
    }
  }
  await context.close();
}

await browser.close();
server.close();
console.log(`access-intro-tour-a11y: ${passes} passed, ${failures.length} failed`);
if (failures.length) {
  console.log(failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
