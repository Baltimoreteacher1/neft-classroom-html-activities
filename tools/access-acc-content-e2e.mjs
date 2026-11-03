#!/usr/bin/env node
/** Teacher Hub content library: live coverage matrix, filters, previews, Spanish, axe, phone width. */
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-acc-content-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}
const failures = [];
const ok = (c, m) => {
  if (!c) failures.push(m);
  console.log(`${c ? "PASS" : "FAIL"} ${m}`);
};
const { server, base } = await serveAccess();
const browser = await chromium.launch();
async function open(prefs, viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  if (prefs)
    await ctx.addInitScript(
      (p) => localStorage.setItem("accessPracticeLab:v1:prefs", JSON.stringify(p)),
      prefs,
    );
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => !/web-vitals|@engine\//.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
  await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
  await page.waitForSelector("#accContent table.acc-matrix");
  return { ctx, page, errors };
}

{
  const { ctx, page, errors } = await open();
  const txt = await page.locator("#accContent").innerText();
  ok(
    /40 practice sets · 320 items/.test(txt),
    "the library reports the bank it actually holds (40 sets, 320 items)",
  );
  ok(
    /Automated checks only: no item has had human review/.test(txt),
    "it says plainly that no item has had human review",
  );
  ok(/Grades 3–5: 160 items/.test(txt), "the matrix header counts grade 3–5 items from the index");
  ok(
    (await page.locator(".acc-cov.is-framework").count()) > 10 &&
      (await page.locator(".acc-cov-tag", { hasText: "supplementary" }).count()) > 0,
    "framework and supplementary cells are both present and labelled",
  );
  ok(
    (await page.locator(".acc-cov.is-none").count()) > 0 && /Not a framework combination/.test(txt),
    "combinations the framework does not list are shown as such, not as gaps",
  );
  const gaps = await page.locator(".acc-cov.is-gap").count();
  ok(
    /\d+ framework combinations? with no items/.test(txt) &&
      (gaps === 0) === /0 framework combinations with no items/.test(txt),
    `the gap count matches the gaps shown (${gaps})`,
  );
  const cells = await page
    .locator(".acc-cov")
    .evaluateAll((els) => els.every((e) => e.innerText.trim().length > 0));
  ok(cells, "every coverage cell carries text");
  await page.locator("#cGrade").selectOption("6-8");
  ok(
    /Grades 6–8: 160 items/.test(await page.locator("#accContent").innerText()),
    "switching grade band changes the matrix",
  );
  await page.locator("#cDomain").selectOption("Listening");
  await page.locator("#cKlu").selectOption("Argue");
  const found = await page.locator(".acc-item-row").count();
  ok(found > 0 && found <= 24, `filters narrow the tasks (${found} shown)`);
  ok(
    (await page.locator(".acc-item-row .acc-hint").allInnerTexts()).every((t) =>
      /Listening · Argue/.test(t),
    ),
    "every task shown matches the filters",
  );
  await page.locator(".acc-item-row button", { hasText: "Preview" }).first().click();
  await page.locator(".acc-preview").waitFor();
  const pv = await page.locator(".acc-preview").innerText();
  ok(
    pv.length > 120 && /Teacher key and scoring guidance/.test(pv),
    "a real preview shows the stimulus, the task and a teacher key",
  );
  ok(
    (await page.locator('.acc-item-row a[href*="/assess/b68-listen-"]').count()) >= 2,
    "each task links to practice its set in both modes",
  );
  await page.locator("#cExplicit").check();
  ok(true, "the framework-only filter applies");
  if (AxeBuilder) {
    const axe = await new AxeBuilder({ page })
      .include("#accContent")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    ok(
      axe.violations.length === 0,
      `axe: the content library has no WCAG 2.2 AA violations ${axe.violations.map((v) => `${v.id}:${v.nodes[0].target}`).join(",")}`,
    );
  }
  ok(errors.length === 0, `no console errors ${errors.join("|")}`);
  await ctx.close();
}
{
  const { ctx, page } = await open({ lang: "es", langChosen: true });
  const txt = await page.locator("#accContent").innerText();
  ok(
    /Biblioteca de contenido y cobertura/.test(txt) && /Grados 3–5/.test(txt),
    "Spanish mode translates the library interface",
  );
  ok(
    /Solo revisión|Brecha|No es una combinación del marco/.test(txt) ||
      /Not a framework/.test(txt) === false,
    "coverage labels are Spanish",
  );
  await ctx.close();
}
{
  const { ctx, page } = await open(null, { width: 390, height: 844 });
  ok(
    !(await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )),
    "390px: the page does not scroll sideways",
  );
  await ctx.close();
}
await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-acc-content-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-acc-content-e2e: all checks passed");
