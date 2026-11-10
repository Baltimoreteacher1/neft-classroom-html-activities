/**
 * The Quick Guide page (/start/guide) in a real browser: structure, download links, return links, saved ticks and plan
 * notes, the Print button, exactly two Letter pages in print, no horizontal scroll at 1280 / 768 / 375 / 320, axe
 * WCAG 2.2 AA, and Spanish chrome on an English guide.
 *
 *   node tools/access-intro-guide-e2e.mjs        (serves this working tree)
 *
 * A missing browser is a SKIP locally and a FAIL in CI. Screenshots go to $INTRO_SHOTS when set.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DOWNLOADS, ENTRANCE, ROUTES } from "../access-practice-lab/src/intro/data.js";
import { minTextSize } from "../scripts/lib/pdf-text-sizes.mjs";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-intro-guide-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn(
    "access-intro-guide-e2e: axe-core/playwright is not installed; skipping axe checks.",
  );
}

const LAB = "/access-practice-lab";
const KEY = "accessPracticeLab:v1:intro";
const { server, base } = await serveAccess();
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-intro-guide-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}
const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const errors = [];
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
page.on("pageerror", (e) => !/web-vitals|@engine\//.test(e.message) && errors.push(e.message));
page.on(
  "console",
  (m) =>
    m.type() === "error" &&
    !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
    errors.push(m.text()),
);
const open = async (path = ROUTES.guide) => {
  await page.goto(`${base}${LAB}${path}`, { waitUntil: "load" });
  await page.waitForSelector("#app .ig-sheet");
};
const shots = process.env.INTRO_SHOTS;

// the static server sends no Content-Length; Pages does. Stand in for it so the file sizes can be checked.
await page.route(/\/guides\/.*\.(pdf|docx)$/, (route) =>
  route.request().method() === "HEAD"
    ? route.fulfill({
        status: 200,
        headers: { "content-length": "107520", "content-type": "application/octet-stream" },
      })
    : route.continue(),
);
await open();
await page
  .waitForFunction(
    () => document.querySelector("[data-ig-size]")?.textContent.includes("KB"),
    null,
    { timeout: 5000 },
  )
  .catch(() => {});
ok(
  (await page.locator("[data-ig-size]").first().innerText()).trim() === "(105 KB)",
  "each download shows its size once the file answers",
);

// structure
ok((await page.locator("#app h1").count()) === 1, "one h1 on the page");
ok((await page.locator("#app main, main#app").count()) >= 1, "a main landmark holds the guide");
ok((await page.locator("#app .ig-sheet").count()) === 2, "two printed sheets on screen");
const headings = await page
  .locator("#app h1, #app h2, #app h3")
  .evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
ok(
  headings.every((level, i) => i === 0 || level - headings[i - 1] <= 1),
  `heading levels never skip (${headings.join("")})`,
);
ok(
  (await page.locator('#app a[href*="/start"]:has-text("Back to Start Here")').count()) === 1,
  "a visible Back to Start Here link",
);
ok(
  await page.evaluate(() =>
    [...document.querySelectorAll("#app input[type=checkbox], #app textarea")].every(
      (el) => el.labels?.length > 0,
    ),
  ),
  "every checkbox and text box has a label",
);

// downloads: the three files from DOWNLOADS, both types, with the file type stated
const downloads = Object.values(DOWNLOADS).flatMap((o) => [o.pdf, o.docx]);
for (const href of downloads) {
  const link = page.locator(`#app a[href="${href}"]`);
  ok((await link.count()) === 1, `download link ${href}`);
  const text = await link.innerText();
  ok(
    /Download (PDF|Word file)/.test(text),
    `${href} states its file type (${text.trim().replace(/\s+/g, " ")})`,
  );
}
ok((await page.locator("#app a[download]").count()) === 6, "six download links in all");

// links: activities open with a way back, the printed copy does not
const activityHrefs = await page
  .locator("#app .ig-table a")
  .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
ok(
  activityHrefs.length === 4 && activityHrefs.every((h) => /[?&]intro=guide/.test(h)),
  `activity links carry intro=guide (${activityHrefs.length})`,
);
const lessonHref = await page
  .locator('#app .ig-linkrow a:has-text("lesson page")')
  .getAttribute("href");
ok(
  lessonHref.startsWith(`${LAB}${ROUTES.lesson}`) && !/intro=/.test(lessonHref),
  "the lesson page link is a plain lab link",
);
ok(
  (await page.locator(`#app .ig-sheet img[src$="/guides/qr-start.svg"]`).count()) === 1,
  "exactly one QR image in the guide",
);
ok(
  (await page.locator(".ig-sheet img").first().getAttribute("alt")).includes(ENTRANCE.short),
  "the QR alt text names the address",
);

// saved ticks and plan notes (this device only), read-modify-write of the shared intro object
await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ tour: { stop: 3 } })), KEY);
await page.check("#ig-c-hallway");
await page.fill("#ig-p-practice", "explaining one change and a reason");
await page.fill("#ig-p-frame", "I will use the hallway lesson with my 6th graders.");
const saved = JSON.parse(await page.evaluate((k) => localStorage.getItem(k), KEY));
ok(
  saved.guide?.checks?.hallway === true &&
    saved.guide?.plan?.practice === "explaining one change and a reason",
  "ticks and plan notes saved under intro.guide",
);
ok(saved.tour?.stop === 3, "other pages' keys in the intro object are kept");
await open();
ok(await page.isChecked("#ig-c-hallway"), "the tick is back after a reload");
ok(
  (await page.inputValue("#ig-p-practice")) === "explaining one change and a reason",
  "the plan note is back after a reload",
);
ok(
  /this browser on this device only/i.test(await page.locator(".ig-note").innerText()),
  "the page says notes stay on this device",
);

// Print button
await page.evaluate(() => {
  window.__printed = 0;
  window.print = () => {
    window.__printed++;
  };
});
await page.click("[data-ig-print]");
ok((await page.evaluate(() => window.__printed)) === 1, "Print / Save as PDF calls window.print()");

// print media: exactly two Letter pages, app chrome hidden, nothing under 11 pt
await page.evaluate((k) => localStorage.removeItem(k), KEY);
await open();
await page.emulateMedia({ media: "print" });
const hidden = await page.evaluate(() =>
  [".lab-top", ".lab-footer", "#labLive", ".ig-bar", ".skip-link"].every((s) => {
    const el = document.querySelector(s);
    return !el || getComputedStyle(el).display === "none";
  }),
);
ok(hidden, "app chrome and the toolbar are hidden in print");
const dir = mkdtempSync(join(tmpdir(), "intro-guide-e2e-"));
const printed = join(dir, "page.pdf");
writeFileSync(printed, await page.pdf({ preferCSSPageSize: true, printBackground: true }));
const pages = Number(
  /Pages:\s+(\d+)/.exec(execFileSync("pdfinfo", [printed], { encoding: "utf8" }))[1],
);
ok(pages === 2, `the on-screen page prints to exactly two pages (${pages})`);
const size = execFileSync("pdfinfo", [printed], { encoding: "utf8" }).match(/Page size:\s+(.+)/)[1];
ok(/612 x 792/.test(size), `Letter size (${size})`);
ok(minTextSize(readFileSync(printed)) >= 10.99, "no printed text under 11 pt");
await page.emulateMedia({ media: "screen" });

// widths, overflow, screenshots
for (const [w, h] of [
  [1280, 900],
  [768, 1000],
  [375, 800],
  [320, 700],
]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(150);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(over <= 1, `no horizontal scroll at ${w}px (${over})`);
  if (shots) await page.screenshot({ path: join(shots, `guide-${w}.png`), fullPage: true });
}
await page.setViewportSize({ width: 1280, height: 900 });

// axe
if (AxeBuilder) {
  const res = await new AxeBuilder({ page })
    .include("#app")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  ok(
    res.violations.length === 0,
    `axe WCAG 2.2 AA${res.violations.length ? `: ${res.violations.map((v) => `${v.id}(${v.nodes.length})`).join(", ")}` : ""}`,
  );
}

// Spanish: the toolbar follows the language switch, the printed sheets stay English
await page.locator('.lab-tools [data-lang-mode="es"]').click();
await page
  .waitForFunction(
    () => /Descargar|Imprimir/.test(document.querySelector(".ig-bar")?.innerText || ""),
    null,
    { timeout: 5000 },
  )
  .catch(() => {});
ok(
  /Descargar|Imprimir/.test(await page.locator(".ig-bar").innerText()),
  "the toolbar switches to Spanish",
);
ok((await page.locator(".ig-bar [lang=es]").count()) > 0, "Spanish chrome is marked lang=es");
ok(
  /Your 20-Minute Exploration/.test(await page.locator("#ig-h-p1").innerText()),
  "the sheets stay English",
);
await page.locator('.lab-tools [data-lang-mode="en"]').click();
await page.waitForFunction(
  () => /Download and print/.test(document.querySelector(".ig-bar")?.innerText || ""),
  null,
  { timeout: 5000 },
);

// an activity opens with a visible way back, and the way back returns to the guide
await open();
const first = page.locator("#app .ig-table a").first();
await first.click();
await page.waitForSelector("#app > :not(.boot)");
const back = page.locator('#introReturn a:has-text("Back to the Quick Guide")');
await back.waitFor({ timeout: 5000 }).catch(() => {});
ok(
  (await back.count()) === 1 && (await back.isVisible()),
  "the activity shows Back to the Quick Guide",
);
if (await back.count()) {
  await back.click();
  await page.waitForSelector("#app .ig-sheet");
  ok(
    new URL(page.url()).pathname === `${LAB}${ROUTES.guide}`,
    "Back to the Quick Guide returns to /start/guide",
  );
}

ok(
  errors.length === 0,
  `no console or page errors${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""}`,
);
await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-intro-guide-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-intro-guide-e2e: all checks passed");
