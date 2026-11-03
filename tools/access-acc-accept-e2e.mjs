#!/usr/bin/env node
/**
 * Publisher acceptance for the delivered bank and teacher tools, in a real browser at desktop, tablet, phone and 200% zoom
 * (a 640px viewport is what a 1280px window looks like at 200%). For each viewport: no horizontal scroll, controls in the new
 * surfaces are at least 44px, axe WCAG 2.2 AA is clean on every key state, and opening a bank set stays within a payload and
 * time budget. Numbers are printed so a regression is visible, not just a pass.
 */
import { fixtureRows, seedEvidence } from "./lib/access-acc-fixtures.mjs";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-acc-accept-e2e: SKIP — playwright or axe is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
const failures = [];
const ok = (c, m) => {
  if (!c) failures.push(m);
  console.log(`${c ? "PASS" : "FAIL"} ${m}`);
};
const { server, base } = await serveAccess();
const browser = await chromium.launch({
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
const ROOT = `${base}/access-practice-lab`;
const VIEWPORTS = [
  ["desktop 1440", 1440, 900],
  ["tablet 768", 768, 1024],
  ["phone 390", 390, 844],
  ["200% zoom (640)", 640, 480],
];
const SPEECH = `Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { speaking: false, paused: false, getVoices: () => [], addEventListener() {}, removeEventListener() {}, cancel() {}, pause() {}, resume() {}, speak(u) { setTimeout(() => u.onend && u.onend({}), 600); } } });`;
const BUDGET = { bytes: 1_500_000, ms: 6000 };

async function overflow(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}
async function small(page, scope) {
  return page.evaluate((scope) => {
    const out = [];
    for (const el of document.querySelectorAll(
      `${scope} button, ${scope} select, ${scope} input[type=text], ${scope} input[type=number], ${scope} textarea, ${scope} summary, ${scope} a.acc-btn`,
    )) {
      const r = el.getBoundingClientRect();
      if (r.width && r.height && r.height < 44)
        out.push(
          `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""} ${Math.round(r.width)}x${Math.round(r.height)}`,
        );
    }
    for (const el of document.querySelectorAll(
      `${scope} label:has(input[type=radio]), ${scope} label:has(input[type=checkbox])`,
    )) {
      const r = el.getBoundingClientRect();
      if (r.width && r.height && r.height < 44)
        out.push(`label ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    return out;
  }, scope);
}
async function axe(page, label, include) {
  const r = await new AxeBuilder({ page })
    .include(include)
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  ok(
    r.violations.length === 0,
    `${label}: axe clean ${r.violations.map((v) => `${v.id}:${v.nodes[0].target.join(" ")}`).join(" | ")}`,
  );
}

for (const [name, w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    permissions: ["microphone"],
  });
  await ctx.addInitScript(SPEECH);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => !/web-vitals|@engine\//.test(e.message) && errors.push(e.message));

  // chooser with the whole library
  await page.goto(`${ROOT}/assess`, { waitUntil: "networkidle" });
  await page.locator(".acc-lib-card").first().waitFor();
  ok((await overflow(page)) <= 1, `${name}: chooser has no horizontal scroll`);
  await axe(page, `${name}: chooser`, ".acc-wrap");

  // a bank set, intro and first question, with the performance budget
  const t0 = Date.now();
  let bytes = 0;
  page.on("response", async (r) => {
    try {
      bytes += (await r.body()).length;
    } catch {}
  });
  await page.goto(`${ROOT}/assess/b68-listen-03?mode=summative`, { waitUntil: "networkidle" });
  const timer = page.locator("#accTimer");
  if (await timer.count()) await timer.uncheck();
  await page.locator("[data-act=begin]").click();
  await page.locator(".acc-stem").waitFor();
  const ms = Date.now() - t0;
  ok(
    bytes < BUDGET.bytes && ms < BUDGET.ms,
    `${name}: opening a bank set loads ${Math.round(bytes / 1024)} KB in ${ms} ms (budget ${BUDGET.bytes / 1024} KB / ${BUDGET.ms} ms)`,
  );
  ok((await overflow(page)) <= 1, `${name}: a listening question has no horizontal scroll`);
  const sm = await small(page, ".acc-wrap");
  ok(
    sm.length === 0,
    `${name}: controls in the question view are 44px or taller ${sm.slice(0, 4).join(", ")}`,
  );
  await axe(page, `${name}: listening question`, ".acc-wrap");

  // teacher hub with evidence, review queue, insights and assignment builder
  await page.goto(`${ROOT}/assess`, { waitUntil: "networkidle" });
  await seedEvidence(page, fixtureRows());
  await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
  await page.locator("#inSkills").waitFor({ timeout: 8000 });
  await page.locator("#asKind").waitFor();
  await page.locator("#accReviewBody [data-act=open-review]").first().click();
  await page.locator(".acc-review-form").waitFor();
  ok(
    (await overflow(page)) <= 1,
    `${name}: teacher hub with review, insights and builder open has no horizontal scroll`,
  );
  for (const scope of ["#accReview", "#accInsights", "#accAssign"]) {
    const s = await small(page, scope);
    ok(s.length === 0, `${name}: ${scope} controls are 44px or taller ${s.slice(0, 4).join(", ")}`);
    await axe(page, `${name}: ${scope}`, scope);
  }
  ok(errors.length === 0, `${name}: no page errors ${errors.join("|")}`);
  await ctx.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-acc-accept-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-acc-accept-e2e: all checks passed");
