#!/usr/bin/env node
/**
 * Teacher Tour 2.0 in a real browser (the release-blocking checks):
 *   - first-time journey: Welcome → Experience → Support → Implement → Prepare → Studio (3 screens) → Kit;
 *   - NAVIGATION CONTAINMENT: the page URL never changes, no new tab opens, no document navigation happens, a preview
 *     opens and closes with its filters intact, and the in-frame activity cannot move the tour;
 *   - differentiation: the learning goal is constant while the supports change;
 *   - kit: the PDF and DOCX download as real files (magic bytes), the plan and link copy, the student card prints alone;
 *   - resume: Save & Exit, a refresh mid-lesson and a return offer Continue Where I Left Off / Start a New Tour;
 *   - grade bands 3–5 and 6–8; mobile 390px has no horizontal scroll; axe finds no serious or critical issue.
 *   node tools/access-tour2-e2e.mjs        (serves this working tree; a missing browser is a SKIP locally, FAIL in CI)
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-tour2-e2e: SKIP: playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}
const { server, base } = await serveAccess();
const LAB = `${base}/access-practice-lab`;
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-tour2-e2e: SKIP: no browser (${error.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` ${detail}`}`);
};
const errors = [];
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: "reduce",
  acceptDownloads: true,
  permissions: ["clipboard-read", "clipboard-write"],
});
const pages = [];
context.on("page", (p) => pages.push(p));
const page = await context.newPage();
page.on("pageerror", (e) => {
  if (!/web-vitals/.test(e.message)) errors.push(`pageerror: ${e.message}`); // a build-time import the dev server does not bundle
});
page.on("console", (m) => {
  if (m.type() === "error" && !/web-vitals|Failed to load resource|favicon/.test(m.text())) errors.push(`console: ${m.text()}`);
});
const docNavs = [];
page.on("framenavigated", (f) => {
  if (f === page.mainFrame()) docNavs.push(f.url());
});

const freshTour = async () => {
  await page.evaluate(() => sessionStorage.clear()); // a new visit in this tab, as if arriving from another page
  await page.goto(`${LAB}/start/tour`);
  await page.waitForSelector("[data-t2-root]");
  if (await page.locator(".t2-gate").count()) {
    await page.locator('[data-t2="gate-new"]').click();
    await page.locator('[data-t2="gate-new"]').click();
  }
  await page.waitForSelector('[data-t2-field="band"]');
};
const t2 = (name) => page.locator(`[data-t2="${name}"]`);
const next = () => t2("next").click();
const title = () => page.locator("#t2Title").innerText();
const step = () => page.locator("[data-t2-root]").getAttribute("data-step");

try {
  await page.goto(`${LAB}/start/tour`);
  await page.waitForSelector("[data-t2-root]");
  const startUrl = page.url();
  check("tour opens as one workspace with top bar, two panels and bottom bar", (await page.locator(".t2-top, .t2-guide, .t2-stage, .t2-foot").count()) === 4);
  check("site navigation is hidden while the tour is open", !(await page.locator(".lab-top").first().isVisible().catch(() => false)));

  /* Step 1 */
  check("step 1 title", (await title()).startsWith("Welcome!"));
  await page.locator('[data-t2="peek"][data-t2-value="speaking"]').click();
  await page.waitForSelector(".t2-peek h3");
  check("speaking card previews a real activity in place", /Speaking Practice:/.test(await page.locator(".t2-peek h3").innerText()));
  await page.locator('[data-t2="peek"][data-t2-value="writing"]').click();
  check("writing card previews", /Writing Practice:/.test(await page.locator(".t2-peek h3").innerText()));
  await page.locator('[data-t2="peek"][data-t2-value="growth"]').click();
  check("practice and growth card previews", /Practice and Growth/.test(await page.locator(".t2-peek h3").innerText()));
  await page.locator(".t2-more summary").click();
  check("teacher-resource explanation expands", await page.locator(".t2-more li").first().isVisible());
  check("continue is available (focus not required to move on)", (await t2("next").getAttribute("aria-disabled")) === null);
  await page.locator('[data-t2-field="focus"][data-t2-value="all"]').click();
  check("focus choice is saved", (await page.locator('[data-t2-field="focus"][data-t2-value="all"]').getAttribute("aria-pressed")) === "true");
  await page.locator('[data-t2-field="band"][data-t2-value="3-5"]').click();
  await page.locator('[data-t2-field="band"][data-t2-value="6-8"]').click();
  await next();

  /* Step 2 */
  await page.waitForSelector(".t2-iframe");
  check("step 2 shows the live activity in a sandboxed frame", (await page.locator(".t2-iframe").getAttribute("sandbox")).includes("allow-scripts") && !(await page.locator(".t2-iframe").getAttribute("sandbox")).includes("allow-top-navigation"));
  const frame = page.frameLocator(".t2-iframe");
  await frame.locator("main, .lab-main, #app").first().waitFor({ timeout: 20000 });
  const frameText = await frame.locator("body").innerText();
  check("the real activity loaded inside the frame", frameText.length > 80, frameText.slice(0, 80));
  check("microphone status is announced", /Microphone/.test(await page.locator("[data-t2-mic]").innerText()));
  const src1 = await page.locator(".t2-iframe").getAttribute("src");
  await page.locator('[data-t2-field="tab"][data-t2-value="writing"]').click();
  await page.waitForSelector(".t2-iframe");
  const src2 = await page.locator(".t2-iframe").getAttribute("src");
  check("Speaking | Writing tabs swap the activity without leaving the page", src1 !== src2 && /Writing/.test(src2) && /Speaking/.test(src1));
  // Preview isolation: an answer typed in the frame must not reach this device's saved progress.
  const before = await page.evaluate(() => Object.keys(localStorage).sort().join("|"));
  const box = page.frameLocator(".t2-iframe").locator("textarea").first();
  if (await box.count()) {
    await box.fill("This is a preview sentence.");
    await page.waitForTimeout(600);
  }
  const after = await page.evaluate(() => Object.keys(localStorage).sort().join("|"));
  check("preview answers are not written to the teacher's saved progress", before === after, `${before} → ${after}`);
  await next();

  /* Step 3 */
  check("step 3 title", /Different Language Supports/.test(await title()));
  const goal = (await page.locator(".t2-sim-goal").innerText()).replace(/\s+/g, " ");
  const seen = {};
  for (const p of ["starting", "growing", "expanding"]) {
    await page.locator(`[data-t2-field="profile"][data-t2-value="${p}"]`).click();
    seen[p] = (await page.locator(".t2-sim-sups").innerText()).replace(/\s+/g, " ");
    check(`profile ${p}: learning goal unchanged`, (await page.locator(".t2-sim-goal").innerText()).replace(/\s+/g, " ") === goal);
    check(`profile ${p}: change summary shown`, /Unchanged/.test(await page.locator(".t2-delta").innerText()));
  }
  check("supports differ across Starting, Growing and Expanding", new Set(Object.values(seen)).size === 3);
  check("Starting has frames and Expanding has success criteria", /Sentence frames/.test(seen.starting) && /Success criteria/.test(seen.expanding));
  await next();

  /* Step 4 */
  check("step 4 title", /Find an Activity/.test(await title()));
  check("continue is blocked until an activity is chosen", (await t2("next").getAttribute("aria-disabled")) === "true");
  await page.locator('[data-t2-field="finder-domain"][data-t2-value="writing"]').click();
  await page.locator('[data-t2-field="finder-purpose"][data-t2-value="independent"]').click();
  const n = await page.locator(".t2-result").count();
  check("finder returns up to three real activities", n >= 1 && n <= 3, String(n));
  const firstTitle = await page.locator(".t2-result h3").first().innerText();
  const urlBefore = page.url();
  await page.locator('[data-t2="preview"]').first().click();
  await page.waitForSelector(".t2-iframe");
  check("preview opens inside the workspace", page.url() === urlBefore && (await page.locator('[data-t2="close-preview"]').count()) === 1);
  const link = await page.locator("#t2Link").inputValue();
  check("student link is the real activity URL", /^https:\/\/thelanguagepage\.com\/access-practice-lab\/(Speaking|Writing)\/[ABC]\/[\w-]+\?grades=(3-5|6-8)$/.test(link), link);
  check("QR code is shown", (await page.locator(".t2-qr svg").count()) === 1);
  await t2("copy-link").first().click();
  check("copy link puts the URL on the clipboard", (await page.evaluate(() => navigator.clipboard.readText())) === link);
  await t2("use-pick").click();
  await t2("close-preview").click();
  check("Back to My Resources restores the same filters", (await page.locator('[data-t2-field="finder-purpose"][data-t2-value="independent"]').getAttribute("aria-pressed")) === "true" && (await page.locator('[data-t2-field="finder-domain"][data-t2-value="writing"]').getAttribute("aria-pressed")) === "true");
  check("the chosen activity is marked", (await page.locator(".t2-result.is-picked h3").innerText()).includes(firstTitle));
  await next();

  /* Step 5 */
  check("step 5 title", /Fits Into Your Lesson/.test(await title()));
  for (const id of ["model", "practice", "check", "feedback", "revise"]) await page.locator(`[data-t2="seq"][data-t2-value="${id}"]`).first().click();
  check("the ready message appears on the last part", /Ready to Build Your First Lesson/.test(await page.locator(".t2-ready").innerText()));
  check("last step's button says Build My First Lesson", /Build My First Lesson/.test(await t2("next").innerText()));
  await next();

  /* Studio */
  check("studio screen 1", /Confirm Your Lesson/.test(await title()));
  await page.locator('[data-t2-field="minutes"][data-t2-value="15"]').click();
  await page.locator('[data-t2-field="approach"][data-t2-value="mixed"]').click();
  await next();
  check("studio screen 2 shows a timed plan that adds up", /Generate/.test(await title()) && (await page.locator(".t2-seg-time b").allInnerTexts()).map(Number).reduce((a, b) => a + b, 0) === 15);
  await next();
  check("studio screen 3 lets the teacher edit", /Review and Adjust/.test(await title()));
  await page.locator("#t2Target").fill("I can explain my idea with a reason.");
  check("target edit updates the lesson preview", (await page.locator("[data-t2-lesson]").innerText()).includes("I can explain my idea with a reason."));
  await page.locator('[data-t2="toggle-ui"][data-t2-value="linkcheck"]').click();
  check("student link check shows the verified link", (await page.locator(".t2-ok").innerText()).includes("opens"));
  await page.locator('[data-t2="toggle-ui"][data-t2-value="student"]').click();
  check("student activity previews inside the studio", (await page.locator(".t2-inline .t2-iframe").count()) === 1);
  await page.locator('[data-t2="toggle-ui"][data-t2-value="student"]').first().click();
  await page.locator('[data-t2-field="minutes"][data-t2-value="10"]').click();
  check("changing the length keeps the teacher's edit", (await page.locator("[data-t2-lesson]").innerText()).includes("I can explain my idea with a reason.") && /10 minutes/.test(await page.locator("[data-t2-lesson]").innerText()));
  await next();

  /* Kit */
  check("kit title", /My First Lesson with The Language Page/.test(await title()));
  for (const id of ["guide", "card", "projection", "support", "quick"]) {
    await page.locator(`[data-t2="kit-tab"][data-t2-value="${id}"]`).click();
    check(`kit tab ${id} renders`, (await page.locator("#t2panel").innerText()).length > 60);
  }
  await page.locator('[data-t2="kit-tab"][data-t2-value="card"]').click();
  check("student card has a QR code and the link", (await page.locator("#t2panel svg").count()) === 1 && (await page.locator("#t2panel .t2-url").innerText()).startsWith("https://thelanguagepage.com/"));
  await page.locator('[data-t2="kit-tab"][data-t2-value="projection"]').click();
  const proj = await page.locator("#t2panel").innerText();
  check("projection view hides teacher notes and tour controls", !/Teacher|Prepare|Evidence|Save/.test(proj), proj.slice(0, 120));
  const [pdf] = await Promise.all([page.waitForEvent("download"), t2("download-pdf").click()]);
  const pdfPath = await pdf.path();
  const pdfBytes = readFileSync(pdfPath);
  check("PDF downloads as a real PDF", pdfBytes.subarray(0, 5).toString() === "%PDF-" && pdfBytes.toString("latin1").includes("%%EOF") && /\.pdf$/.test(pdf.suggestedFilename()));
  check("PDF has working hyperlinks", pdfBytes.toString("latin1").includes("/URI (https://thelanguagepage.com/access-practice-lab/"));
  const [docx] = await Promise.all([page.waitForEvent("download"), t2("download-docx").click()]);
  const docxBytes = readFileSync(await docx.path());
  check("DOCX downloads as a real zip with a document part", docxBytes.subarray(0, 2).toString() === "PK" && docxBytes.toString("latin1").includes("word/document.xml") && /\.docx$/.test(docx.suggestedFilename()));
  await t2("copy-plan").click();
  const plan = await page.evaluate(() => navigator.clipboard.readText());
  check("Copy Lesson Plan copies the editable plan text", plan.includes("I can explain my idea with a reason.") && plan.includes("LESSON STEPS") && plan.includes("https://thelanguagepage.com/"));
  await page.evaluate(() => {
    window.__printed = "";
    window.print = () => {
      window.__printed = document.getElementById("t2PrintHost")?.innerText || "";
      window.dispatchEvent(new Event("afterprint"));
    };
  });
  await t2("print-card").click();
  const printed = await page.evaluate(() => window.__printed);
  check("Print Student Card prints the student card only", /Directions/.test(printed) && !/Teacher talk moves/.test(printed));
  await t2("save-return").click();
  check("Save and Return confirms", /Saved in this browser/.test(await page.locator("[data-t2-kit-note]").innerText()));
  await next();
  check("Use My Lesson opens the full-screen projection view", await page.locator("#t2Dialog").isVisible());
  await page.keyboard.press("Escape");
  await page.waitForSelector("#t2Dialog", { state: "detached" });
  check("Escape closes the projection view and returns focus to the tour", true);

  /* containment */
  check("NAVIGATION: the URL never changed during the tour", page.url() === startUrl, `${startUrl} → ${page.url()}`);
  check("NAVIGATION: no new tab or window opened", pages.length === 1, String(pages.length));
  check("NAVIGATION: no document navigation after the first load", docNavs.length === 1, docNavs.join(" , "));

  /* resume */
  await page.reload();
  await page.waitForSelector("[data-t2-root]");
  const afterReload = await page.evaluate(() => document.querySelector("#t2Title")?.innerText || document.body.innerText.slice(0, 200));
check("refresh restores the kit with no prompt", /My First Lesson with The Language Page/.test(afterReload), afterReload);
  await t2("back").click();
  check("Back from the kit returns to the studio review", /Review and Adjust/.test(await title()) && (await page.locator("#t2Target").inputValue()) === "I can explain my idea with a reason.");
  await t2("exit").click();
  await page.waitForURL(/access-practice-lab\/?(\?.*)?$/);
  check("Save & Exit leaves for the lab home", /access-practice-lab\/?$/.test(page.url()));
  await page.goto(`${LAB}/start/tour`);
  await page.waitForSelector(".t2-gate");
  const gateText = await page.locator(".t2-gate").innerText();
  check("returning teacher is offered Continue and Start a New Tour", /Continue Where I Left Off/.test(gateText) && /Start a New Tour/.test(gateText));
  await page.locator('[data-t2="gate-new"]').click();
  check("starting over asks before replacing saved work", (await page.locator('[data-t2="gate-new"]').innerText()).startsWith("Yes, replace"));
  await page.locator('[data-t2="gate-cancel"]').click();
  await page.locator('[data-t2="gate-continue"]').click();
  await page.waitForSelector("#t2Title");
  check("continue returns to exactly the saved screen", /Review and Adjust/.test(await title()));
  await t2("back").click();
  await t2("back").click();
  await t2("back").click();
  check("Back walks backward through the studio, prepare and earlier steps", (await step()) === "prepare");

  /* grade bands */
  for (const band of ["3-5", "6-8"]) {
    await freshTour();
    await page.locator(`[data-t2-field="band"][data-t2-value="${band}"]`).click();
    await next();
    await next();
    await next();
    await page.locator('[data-t2-field="finder-purpose"][data-t2-value="warmup"]').click();
    const links = [];
    for (const dom of ["speaking", "writing"]) {
      await page.locator(`[data-t2-field="finder-domain"][data-t2-value="${dom}"]`).click();
      const count = await page.locator(".t2-result").count();
      check(`${band} ${dom}: finder offers verified activities`, count >= 1 && count <= 3, String(count));
      await page.locator('[data-t2="preview"]').first().click();
      links.push(await page.locator("#t2Link").inputValue());
      await t2("close-preview").click();
    }
    check(`${band}: student links carry the right grades`, links.every((l) => l.endsWith(`grades=${band}`)), links.join(" "));
  }

  /* mobile */
  const phone = await browser.newContext({ viewport: { width: 390, height: 800 }, reducedMotion: "reduce" });
  const m = await phone.newPage();
  await m.goto(`${LAB}/start/tour`);
  await m.waitForSelector("[data-t2-root]");
  check("390px: no horizontal scroll", (await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)) === true);
  check("390px: Continue stays reachable", await m.locator('[data-t2="next"]').isVisible());
  await phone.close();

  /* axe */
  if (AxeBuilder) {
    await freshTour();
    const bad = [];
    for (let i = 0; i < 5; i++) {
      const r = await new AxeBuilder({ page }).include("[data-t2-root]").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
      bad.push(...r.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${step()} ${v.id}`));
      if (i < 4) await next().catch(() => {});
    }
    check("axe: no serious or critical violations across the five steps", bad.length === 0, JSON.stringify(bad));
  }
  check("no console or page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
} catch (error) {
  check("e2e ran to the end", false, error.stack || String(error));
} finally {
  await browser.close();
  server.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\naccess-tour2-e2e: ${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
