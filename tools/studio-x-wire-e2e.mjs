#!/usr/bin/env node
/**
 * Studio X wiring, driven the way a teacher drives it, in a real browser (`/activity-studio`), at 1280 and 375px:
 *   (a) Describe it: a request with pasted vocabulary -> the plan in plain words -> Build -> the editor opens with a
 *       valid worksheet. Done once with the mouse and once with the KEYBOARD ONLY (Tab/Enter/Space, no pointer).
 *       A request that cannot be met shows the honest message and no Build button.
 *   (b) Use my own material: a numbered multiple-choice list with one missing answer -> the review item with its
 *       line numbers -> the teacher picks the answer -> Build -> a valid check.
 *   (c) A small .docx made with the installed `docx` package is chosen -> read in the browser (the vendored JSZip is
 *       loaded on demand) -> an activity. A PDF gets the honest message.
 *   (d) Recipes: save the structure of an activity, then apply the saved recipe to a different topic: the new
 *       activity carries none of the first topic's words.
 * Also: no horizontal overflow and 44px targets in the boxes, no script error, and nothing leaves the origin (only
 * same-origin GETs). Serves the source tree. A missing browser is a SKIP locally and a FAIL in CI.
 */
import assert from "node:assert/strict";
import { normalizeActivity } from "../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";
import { serveAccess } from "./lib/access-serve.mjs";
import { MC_TEXT, makeDocx, VOCAB_REQUEST } from "./studio-x-wire-helpers.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
  ({ default: AxeBuilder } = await import("@axe-core/playwright"));
} catch {
  console.warn("studio-x-wire-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}

const LAB = "/access-practice-lab";
const DRAFTS = "accessPracticeLab:v1:studio";
const RECIPES = "accessPracticeLab:v1:studio-recipes";
const { server, base } = await serveAccess();
const browser = await chromium.launch().catch((error) => {
  console.warn(`studio-x-wire-e2e: SKIP — no browser (${error.message.split("\n")[0]}).`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
});

const problems = [];
const requested = [];
const watch = (page, label) => {
  page.on("pageerror", (e) => {
    if (!/web-vitals/.test(e.message))
      problems.push(`${label}: script error: ${e.message.slice(0, 200)}`);
  });
  page.on("console", (m) => {
    if (m.type() === "error" && !/status of 404|Failed to load resource/.test(m.text()))
      problems.push(`${label}: console error: ${m.text().slice(0, 200)}`);
  });
  page.on("request", (r) => {
    requested.push(r.url());
    if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:"))
      problems.push(`${label}: left the origin: ${r.url().slice(0, 100)}`);
    if (r.method() !== "GET" && !/\/api\/studio\/ai/.test(r.url()))
      problems.push(`${label}: ${r.method()} ${r.url().slice(0, 100)}`);
  });
};

const drafts = (page) =>
  page.evaluate((k) => Object.values(JSON.parse(localStorage.getItem(k) || "{}")), DRAFTS);
const newest = async (page) =>
  (await drafts(page)).sort((a, b) => b.updatedAt - a.updatedAt)[0]?.activity;
const sound = (activity, where) => {
  assert.ok(activity, `${where}: a draft was saved`);
  assert.deepEqual(
    normalizeActivity(activity),
    activity,
    `${where}: fixed point of normalizeActivity`,
  );
  const check = validateActivity(activity);
  assert.equal(check.ok, true, `${where}: valid ${JSON.stringify(check.errors)}`);
};
const overflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** Every button, radio label and summary in the open boxes is at least 44px tall; nothing scrolls sideways. */
async function layout(page, where) {
  const small = await page.evaluate(() =>
    [
      ...document.querySelectorAll(
        ".xw-box .xw-btn, .xw-box .xw-radio, .xw-box .xw-input, .xw-way > summary",
      ),
    ]
      .filter((e) => e.offsetParent && !e.classList.contains("xw-link"))
      .map((e) => [e.className, Math.round(e.getBoundingClientRect().height)])
      .filter(([, h]) => h < 43.5),
  );
  assert.deepEqual(small, [], `${where}: 44px targets`);
  assert.ok((await overflow(page)) <= 1, `${where}: no horizontal scroll`);
}

/** axe (WCAG 2.2 AA) on the boxes; serious and critical findings fail. */
async function axe(page, where, scope = ".xw-start") {
  const res = await new AxeBuilder({ page })
    .include(scope)
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const bad = res.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  assert.deepEqual(
    bad.map((v) => `${v.id}: ${v.nodes[0]?.target}`),
    [],
    `${where}: axe`,
  );
}

async function chooser(page) {
  await page.goto(`${base}${LAB}/activity-studio`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "What would you like to create?" }).waitFor();
  assert.equal(await page.locator(".st-kind").count(), 4, "the four types are still there");
  assert.equal(
    await page.locator("details.xw-way[open]").count(),
    0,
    "the other ways start closed",
  );
}
const openWay = async (page, way) => {
  await page.locator(`details.xw-way[data-way="${way}"] > summary`).click();
  await page.locator(`details.xw-way[data-way="${way}"] .xw-box`).waitFor({ timeout: 10000 });
};
const editorReady = (page) =>
  page.getByRole("button", { name: "Preview as student" }).waitFor({ timeout: 15000 });

/** Tab until the focused element matches `selector` (a keyboard user's route). */
async function tabTo(page, selector, max = 120) {
  for (let i = 0; i < max; i++) {
    if (await page.evaluate((s) => document.activeElement?.matches(s) ?? false, selector)) return;
    await page.keyboard.press("Tab");
  }
  assert.fail(`keyboard could not reach ${selector}`);
}

async function scenarios(width, label) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  watch(page, label);
  const said = [];

  // (a) Describe it, with the pointer.
  await chooser(page);
  await openWay(page, "describe");
  await layout(page, `${label} describe`);
  await page.getByLabel("What would you like to make?").fill("Make me a video about volcanoes");
  await page.locator('[data-act="plan"]').click();
  await page
    .locator(".xw-plan")
    .getByText(/cannot make a video/i)
    .waitFor();
  assert.equal(
    await page.locator('[data-act="build"]').count(),
    0,
    "no Build for a request that cannot be met",
  );
  assert.ok((await page.locator(".xw-choice").count()) <= 3, "at most three questions");
  await page.getByLabel("What would you like to make?").fill(VOCAB_REQUEST);
  assert.equal(
    await page.locator('[data-act="build"]').count(),
    0,
    "a changed request clears the old plan",
  );
  await page.locator('[data-act="plan"]').click();
  await page
    .locator(".xw-plan")
    .getByText(/I will make a worksheet about ecosystems/)
    .waitFor();
  const planText = await page.locator(".xw-plan").innerText();
  assert.match(planText, /sentence frames/);
  assert.ok(!/\bnull\b/.test(planText));
  await layout(page, `${label} plan`);
  await axe(page, `${label} plan`);
  await page.locator('[data-act="build"]').click();
  await editorReady(page);
  const a = await newest(page);
  sound(a, `${label} (a) describe`);
  assert.equal(a.kind, "worksheet");
  assert.ok(
    a.blocks.some((b) => b.type === "vocab"),
    "the teacher's words are in it",
  );
  said.push(`describe ${a.blocks.length} blocks`);

  // (b) Own material: one missing answer.
  await chooser(page);
  await openWay(page, "import");
  await page.getByLabel("Paste your material").fill(MC_TEXT);
  await page.locator('[data-act="read"]').click();
  const review = page.locator(".xw-review");
  await review.getByText("Needs a look (1)").waitFor();
  const reviewText = await review.innerText();
  assert.match(reviewText, /Lines 6-9/);
  assert.match(reviewText, /No correct answer is marked/);
  assert.equal(
    await review.locator('input[type="radio"]').count(),
    3,
    "an answer picker, nothing preselected",
  );
  assert.equal(await review.locator('input[type="radio"]:checked').count(), 0);
  await layout(page, `${label} review`);
  await axe(page, `${label} review`);
  await review.getByLabel(/b\) A thing that makes its own food/).click();
  await page.getByText("Nothing needs a look").waitFor();
  await page.locator('[data-act="build"]').click();
  await editorReady(page);
  const b = await newest(page);
  sound(b, `${label} (b) own material`);
  const qs = b.blocks.filter((x) => x.type === "question");
  assert.equal(qs.length, 3, "all three questions, none dropped");
  const consumer = qs.find((q) => /consumer/.test(q.prompt));
  assert.equal(
    consumer.options.find((o) => o.id === consumer.answer).text,
    "A thing that makes its own food",
  );
  assert.equal(b.context.source.origin, "teacher");
  said.push(`own material ${qs.length} questions`);

  // (c) A Word file, then a PDF.
  await chooser(page);
  await openWay(page, "import");
  const docx = await makeDocx();
  await page.locator('input[type="file"]').setInputFiles({
    name: "ecosystems quiz.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: docx,
  });
  await page.getByText(/Chosen: ecosystems quiz\.docx/).waitFor();
  await page.locator('[data-act="read"]').click();
  await page
    .locator(".xw-summary")
    .getByText(/3 questions/)
    .waitFor({ timeout: 15000 });
  assert.ok(
    requested.some((u) => u.endsWith("/card-builder/vendor/jszip.min.js")),
    "the vendored JSZip was loaded on demand",
  );
  assert.match(await page.locator(".xw-review").innerText(), /Needs a look \(1\)/);
  await page
    .locator(".xw-review")
    .getByLabel(/c\) A thing that breaks down matter/)
    .click();
  await page.locator('[data-act="build"]').click();
  await editorReady(page);
  const c = await newest(page);
  sound(c, `${label} (c) docx`);
  assert.equal(c.blocks.filter((x) => x.type === "question").length, 3);
  assert.match(JSON.stringify(c.context.source), /ecosystems quiz/);
  said.push("docx 3 questions");

  await chooser(page);
  await openWay(page, "import");
  await page.locator('input[type="file"]').setInputFiles({
    name: "scan.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n"),
  });
  await page.locator('[data-act="read"]').click();
  await page
    .locator(".xw-plan")
    .getByText(/Reading PDF files is not available/)
    .waitFor();
  assert.equal(await page.locator('[data-act="build"]').count(), 0);

  // (d) Recipes: save the structure of the worksheet from (a), then apply it to a different topic.
  await chooser(page);
  await openWay(page, "recipe");
  await page.locator('details.xw-way[data-way="recipe"] details.xw-more > summary').click();
  await page.getByLabel("Which activity?").selectOption({ label: a.title });
  await page.getByLabel("Recipe name").fill("Words then practice");
  await page.locator('[data-act="save-recipe"]').click();
  await page.getByText(/Saved "Words then practice" on this device \(1 of 20\)/).waitFor();
  const stored = JSON.parse(await page.evaluate((k) => localStorage.getItem(k), RECIPES));
  assert.equal(stored.v, 1);
  assert.equal(stored.recipes.length, 1);
  assert.ok(!/habitat|producer/i.test(JSON.stringify(stored)), "the recipe keeps no words");
  assert.ok(
    stored.recipes[0].steps.some((s) => s.block === "vocab"),
    "it is the worksheet from (a)",
  );
  await page.reload({ waitUntil: "networkidle" });
  await openWay(page, "recipe");
  await page.getByText("My saved recipes (1 of 20)").waitFor();
  await page.getByRole("radio", { name: /Words then practice/ }).check();
  await page.getByLabel("Topic", { exact: true }).fill("the water cycle");
  await page
    .getByLabel("Your words, questions or passage")
    .fill(
      "evaporation - water turning into a gas\ncondensation - a gas turning into water\nprecipitation - water falling from clouds\nrunoff - water flowing over land\ncollection - water gathering in one place\nvapor - water as a gas",
    );
  await layout(page, `${label} recipes`);
  // the lab header is sticky: axe's target-size rule counts a control under it as covered, so centre the list first
  await page.locator(".xw-recipes").evaluate((el) => el.scrollIntoView({ block: "center" }));
  await axe(page, `${label} recipes`);
  await page.locator('[data-act="apply"]').click();
  await page.locator(".xw-plan").getByText("Your first version is ready").waitFor();
  await page.locator('[data-act="open-built"]').click();
  await editorReady(page);
  const d = await newest(page);
  sound(d, `${label} (d) recipe`);
  assert.match(d.title, /water cycle/i);
  assert.ok(
    !/habitat|producer|decomposer/i.test(JSON.stringify(d)),
    "nothing from the first topic leaked",
  );
  said.push("recipe applied");

  // The chooser still works for a teacher who ignores all of it.
  await chooser(page);
  await page.locator(".st-kind", { hasText: "Worksheet" }).first().click();
  await page.getByRole("heading", { name: "Worksheet" }).waitFor();

  await context.close();
  return said;
}

async function keyboardOnly() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  watch(page, "keyboard");
  await chooser(page);
  await tabTo(page, 'details.xw-way[data-way="describe"] > summary');
  await page.keyboard.press("Enter");
  await page.locator('details.xw-way[data-way="describe"] .xw-box').waitFor({ timeout: 10000 });
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement?.tagName),
    "TEXTAREA",
    "Tab from the summary reaches the request box",
  );
  await page.keyboard.type(VOCAB_REQUEST);
  await tabTo(page, '[data-act="plan"]');
  await page.keyboard.press("Enter");
  await page
    .locator(".xw-plan")
    .getByText(/I will make a worksheet about ecosystems/)
    .waitFor();
  assert.equal(
    await page.evaluate(() => document.activeElement?.tagName),
    "H3",
    "focus moves to the plan heading so it is read aloud",
  );
  await tabTo(page, '[data-act="build"]');
  await page.keyboard.press("Space");
  await editorReady(page);
  sound(await newest(page), "keyboard describe");

  // the review step can also be finished without a pointer
  await chooser(page);
  await tabTo(page, 'details.xw-way[data-way="import"] > summary');
  await page.keyboard.press("Enter");
  await page.locator('details.xw-way[data-way="import"] .xw-box').waitFor({ timeout: 10000 });
  await page.keyboard.press("Tab");
  await page.keyboard.insertText(MC_TEXT);
  await tabTo(page, '[data-act="read"]');
  await page.keyboard.press("Enter");
  await page.locator(".xw-review").getByText("Needs a look (1)").waitFor();
  await tabTo(page, '.xw-review input[type="radio"]');
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  await page.getByText("Nothing needs a look").waitFor();
  await tabTo(page, '[data-act="build"]');
  await page.keyboard.press("Enter");
  await editorReady(page);
  sound(await newest(page), "keyboard import");
  await context.close();
}

/**
 * Project Studio's Create panel offers the same ways to start (teacher device, a lab page outside the Studio):
 * "Describe it" builds an activity and opens it in the Studio; "Save as recipe" sits in step 3 of a built resource.
 */
async function panel(width, label) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("accessPracticeLab:v1:audience", "teacher");
    } catch {}
  });
  const page = await context.newPage();
  watch(page, label);
  const dlg = page.locator("dialog.cr-dialog[open]");
  await page.goto(`${base}${LAB}/tools`, { waitUntil: "networkidle" });
  await page.locator("button.cr-launch").waitFor({ timeout: 15000 });
  await page.locator("button.cr-launch").click();
  await dlg.locator(".cr-ways").waitFor({ timeout: 15000 });
  // the panel keeps its own upload and recipe bar (Project Studio); Describe it is the one extra way in here
  assert.deepEqual(await dlg.locator(".cr-ways button").allInnerTexts(), ["Describe it"]);
  await dlg.locator('[data-way="describe"]').click();
  await dlg.locator('[data-box="describe"]').waitFor({ timeout: 10000 });
  await dlg.getByLabel("What would you like to make?").fill(VOCAB_REQUEST);
  await dlg.locator('[data-act="plan"]').click();
  await dlg.getByText(/I will make a worksheet about ecosystems/).waitFor();
  await layout(page, `${label} panel`);
  await axe(page, `${label} panel`, "dialog.cr-dialog");
  await dlg.locator('[data-act="build"]').click();
  // notes are shown before the draft opens; the teacher presses Open
  const open = dlg.getByRole("button", { name: /Open in Activity Studio/ });
  const ready = page.getByRole("button", { name: "Preview as student" });
  await Promise.race([open.waitFor({ timeout: 15000 }), ready.waitFor({ timeout: 15000 })]);
  if (await open.count()) await open.click();
  await editorReady(page);
  sound(await newest(page), `${label} panel describe`);

  assert.ok((await overflow(page)) <= 1, `${label} panel: no horizontal scroll`);
  await context.close();
}

try {
  await panel(1280, "panel 1280");
  await panel(390, "panel 390");
  const wide = await scenarios(1280, "1280");
  await keyboardOnly();
  const phone = await scenarios(375, "375");
  assert.deepEqual(problems, [], problems.join("\n"));
  console.log(
    `studio-x-wire-e2e: PASS — Create panel at 1280 and 390; 1280px (${wide.join("; ")}); keyboard-only describe + review; 375px (${phone.join("; ")})`,
  );
} catch (error) {
  console.error(`studio-x-wire-e2e: FAIL — ${error.message}`);
  if (problems.length) console.error(problems.join("\n"));
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
