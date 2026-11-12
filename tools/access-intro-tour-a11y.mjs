#!/usr/bin/env node
/**
 * Teacher Tour accessibility sweep (/start/tour, four parts): every grade choice (K, 1, 2-3, 4-5, 6-8) at 1280 and
 * 390 px, in each part — 1 the goals, 2 a live activity with the coach card, 3 a chosen skill and support with the
 * live preview, 4 the classroom card and its "Show the QR code to the class" dialog. Each state must have:
 *   - axe (wcag2a/aa, 21a/aa, 22aa) serious + critical = 0 on the tour page. The activity frame's inner document is a
 *     lab activity page and is excluded (`iframe.gc-frame`): those pages have their own browser gates
 *     (access-lab-sweep, access-early-e2e, access-lesson-frame-e2e). The <iframe> element itself (title) is checked.
 *   - 44 x 44 px targets on every tour and coach control (links inside a sentence are exempt, WCAG 2.5.8);
 *   - no horizontal scroll; no console error from the tour page or the frame;
 *   - at phone width (< 960 px) the coach card is docked: position:fixed at the bottom of the screen.
 * The Show dialog must close on Escape and return focus to its button.
 *   node tools/access-intro-tour-a11y.mjs [--picks=K,1] [--widths=390]
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { BAND_TOUR } from "../access-practice-lab/src/intro/tour-bands.js";
import { serveAccess } from "./lib/access-serve.mjs";

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const PICKS = arg("picks")?.split(",") || Object.keys(BAND_TOUR);
const WIDTHS = (arg("widths")?.split(",") || ["1280", "390"]).map(Number);
const SHOTS = process.env.TOUR_A11Y_SHOTS || "";
// Part 3 shows each grade choice a different skill, so all four skills are swept across the five picks.
const PREP_SKILL = {
  K: "speaking",
  1: "writing",
  "2-3": "listening",
  "4-5": "writing",
  "6-8": "speaking",
};

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
// web-vitals is a bare npm specifier resolved at build time; the source-tree server cannot serve it.
const NOISE = /web-vitals|favicon|Failed to load resource/;

/** Controls under 44 x 44 px on the tour page and the coach card (inline links in running text are exempt). */
const smallTargets = (page) =>
  page.evaluate(() => {
    const sel =
      ".gt-page a, .gt-page button, .gt-page summary, .gt-page input[type=text], .gc-card button, .gc-pill, .gt-show button";
    const inline = (el) =>
      el.tagName === "A" &&
      !el.classList.contains("btn") &&
      el.closest("p, li, dd")?.textContent.trim() !== el.textContent.trim();
    return [...new Set(document.querySelectorAll(sel))]
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
    .exclude("iframe.gc-frame")
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

/** Wait for the activity frame to render and the coach card to show. */
async function stageReady(page) {
  await page.waitForSelector("iframe.gc-frame", { timeout: 60000 });
  await page
    .frameLocator("iframe.gc-frame")
    .locator("#app h1")
    .first()
    .waitFor({ state: "attached", timeout: 60000 });
  await page.waitForSelector(".gc-card", { timeout: 30000 });
  await page.waitForTimeout(400);
}

/** On phones the coach card docks: its slot (or the card) is position:fixed and sits at the bottom of the screen. */
const docked = (page) =>
  page.evaluate(() => {
    const card = document.querySelector(".gc-card");
    if (!card) return "no card";
    let el = card;
    while (el && getComputedStyle(el).position !== "fixed") el = el.parentElement;
    if (!el) return "not fixed";
    const r = card.getBoundingClientRect();
    return Math.abs(innerHeight - r.bottom) <= 24
      ? ""
      : `bottom ${Math.round(r.bottom)} of ${innerHeight}`;
  });

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
  const go = (q) =>
    page
      .goto(`${LAB}/start/tour?${q}`, { waitUntil: "domcontentloaded" })
      .then(() => page.waitForSelector(".gt-page"));
  for (const pick of PICKS) {
    const g = encodeURIComponent(pick);
    const shot = async (n) =>
      SHOTS && page.screenshot({ path: `${SHOTS}/tour-${pick}-${n}-${width}.png`, fullPage: true });
    await page.goto(`${LAB}/start`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.removeItem("accessPracticeLab:v1:intro"));

    await go(`part=1&grades=${g}`);
    await check(page, `${pick} part 1 @${width}`, errors);
    await shot(1);

    await go(`part=2&goal=show&grades=${g}`);
    await stageReady(page);
    await check(page, `${pick} part 2 (coach + live activity) @${width}`, errors);
    if (width < 960) {
      const where = await docked(page);
      ok(where === "", `coach card docked at the bottom @${width} ${pick}: ${where}`);
    }
    await shot(2);

    const skill = PREP_SKILL[pick] || "reading";
    await go(`part=3&goal=show&grades=${g}&skill=${skill}&support=A`);
    await stageReady(page);
    ok(
      (await page.locator("[data-gt-use]").count()) === 1,
      `${pick} part 3 ${skill}: Use this activity`,
    );
    await check(page, `${pick} part 3 (${skill}, preview) @${width}`, errors);
    await shot(3);

    await go(`part=4&goal=share&grades=${g}&skill=${skill}&support=A`);
    await page.waitForSelector(".gt-class-card");
    await check(page, `${pick} part 4 @${width}`, errors);
    await shot(4);
    if (await page.locator("[data-gt-show]").count()) {
      await page.locator("[data-gt-show]").click();
      await page.waitForSelector("[data-gt-show-dialog][open]");
      await check(page, `${pick} part 4 (Show the QR code) @${width}`, errors);
      await page.keyboard.press("Escape");
      ok(
        (await page.locator("[data-gt-show-dialog][open]").count()) === 0 &&
          (await page.evaluate(() => document.activeElement?.matches("[data-gt-show]"))),
        `Escape closes Show the QR code and focus returns: ${pick} @${width}`,
      );
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
