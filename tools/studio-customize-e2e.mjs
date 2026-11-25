#!/usr/bin/env node
/**
 * Customize Activity, driven the way a teacher drives it, in a real browser (desktop 1280 and phone 390):
 *   chooser -> customize an ACCESS reading set -> draft with lineage, original file untouched -> edit a question
 *   (autosave, reload recovers it) -> a quick change with Undo -> make four versions and see the comparison ->
 *   preview as a student (no notes, no keys, no editing controls) -> a Vocabulary Academy customization ->
 *   the assistant is honestly disabled with no AI, and a mocked one is reviewed before anything is applied ->
 *   keyboard-only reach of Customize, Make versions and the dialog -> axe on chooser, editor and versions dialog.
 * Serves the source tree (see lib/access-serve.mjs): Vite-only `web-vitals` and the Pages Functions do not exist, so
 * `/api/*` answers 404 and the assistant is unavailable, which is the offline path under test.
 * Screenshots go to $SHOTS_DIR (default reports/studio-customize, git-ignored). A missing browser is a SKIP locally and
 * a FAIL in CI.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
  ({ default: AxeBuilder } = await import("@axe-core/playwright"));
} catch {
  console.warn("studio-customize-e2e: SKIP: playwright or axe is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}

const LAB = "/access-practice-lab";
const SHOTS = process.env.SHOTS_DIR || join(REPO_ROOT, "reports/studio-customize");
mkdirSync(SHOTS, { recursive: true });
const { server, base } = await serveAccess();
const browser = await chromium.launch().catch((error) => {
  console.warn(`studio-customize-e2e: SKIP: no browser (${error.message.split("\n")[0]}).`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
});

const problems = [];
const steps = [];
const ok = (name) => steps.push(name);
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
    if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:"))
      problems.push(`${label}: left the origin: ${r.url().slice(0, 100)}`);
    if (r.method() !== "GET" && !/\/api\/studio\/ai/.test(r.url()))
      problems.push(`${label}: ${r.method()} ${r.url().slice(0, 100)}`);
  });
};
const overflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const shot = (page, name) => page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
const sha = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const draftId = (page) => page.url().match(/activity-studio\/(s[a-f0-9]{10})/)?.[1];
const readDraft = (page, id) =>
  page.evaluate(
    (i) =>
      JSON.parse(localStorage.getItem("accessPracticeLab:v1:studio") || "{}")[i]?.activity || null,
    id,
  );
const allDrafts = (page) =>
  page.evaluate(() =>
    Object.values(JSON.parse(localStorage.getItem("accessPracticeLab:v1:studio") || "{}")).map(
      (e) => e.activity,
    ),
  );
const axe = async (page, label, scope) => {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]);
  if (scope) builder = builder.include(scope);
  const { violations } = await builder.analyze();
  const bad = violations.filter((v) => ["serious", "critical"].includes(v.impact));
  assert.deepEqual(
    bad.map(
      (v) =>
        `${v.id}: ${v.nodes
          .slice(0, 2)
          .map((n) => n.target.join(" "))
          .join(" | ")}`,
    ),
    [],
    `${label}: axe serious/critical`,
  );
};
const waitSaved = (page) => page.locator('.st-save[data-phase="saved"]').waitFor({ timeout: 8000 });

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  watch(page, "desktop");

  // 1. Chooser: only real adapters are offered, with what stays fixed; "start from scratch" is visible.
  await page.goto(`${base}${LAB}/activity-studio/customize`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Start from an existing activity", level: 1 }).waitFor();
  await page.locator(".st-family").first().waitFor();
  const families = await page
    .locator(".st-family")
    .evaluateAll((els) => els.map((e) => e.dataset.family));
  assert.ok(
    families.includes("access-bank") && families.includes("vocab-academy"),
    `families offered: ${families}`,
  );
  assert.ok(await page.getByRole("button", { name: "Start from scratch instead" }).isVisible());
  await shot(page, "01-chooser");
  await axe(page, "chooser");
  ok("chooser");

  // 2. Customize an ACCESS reading set: the draft carries lineage; the original file is untouched.
  await page.locator('.st-family[data-family="access-bank"]').click();
  await page.locator(".st-source-row").first().waitFor({ timeout: 15000 });
  await shot(page, "01b-chooser-list");
  await axe(page, "chooser list");
  await page.getByLabel("Subject or topic").selectOption({ label: "Reading" });
  const ref = await page.locator(".st-source-row button").first().getAttribute("data-ref");
  assert.ok(ref, "a Reading set to customize");
  const file = join(REPO_ROOT, "access-practice-lab/content/bank", `${ref}.json`);
  const before = sha(file);
  await page.locator(".st-source-row button").first().click();
  await page.waitForURL(/activity-studio\/s[a-f0-9]{10}$/, { timeout: 15000 });
  const id = draftId(page);
  await page.locator(".st-source-line").waitFor();
  assert.match(await page.locator(".st-source-line").innerText(), /Customized from/);
  assert.equal(
    await page.locator("#st-quick-title").count(),
    1,
    "Quick Customize is the first tab for a customized activity",
  );
  assert.equal(await page.locator('.st-tab[aria-selected="true"]').innerText(), "Quick Customize");
  const draft = await readDraft(page, id);
  assert.equal(draft.lineage.family, "access-bank");
  assert.equal(draft.lineage.ref, ref);
  assert.ok(draft.lineage.sourceHash, "lineage carries a source fingerprint");
  assert.equal(sha(file), before, "the platform original is untouched");
  const served = await (await page.request.get(`${base}${LAB}/content/bank/${ref}.json`)).body();
  assert.equal(
    createHash("sha256").update(served).digest("hex"),
    before,
    "the served original is byte-identical",
  );
  await page.locator(".st-notes").waitFor();
  await shot(page, "02-quick-customize");
  await axe(page, "editor (Quick Customize)");
  await page.getByRole("button", { name: "Got it" }).click();
  assert.equal(await page.locator(".st-notes").count(), 0, "the notes banner dismisses");
  ok("customize from chooser");

  // 3. My Activities lists it as customized, with a way back to the original.
  await page.goto(`${base}${LAB}/activity-studio/mine`, { waitUntil: "networkidle" });
  await page.locator('.st-pill.origin[data-origin="customized"]').first().waitFor();
  assert.ok(
    await page
      .getByRole("link", { name: /Return to original/ })
      .first()
      .isVisible(),
  );
  await page.getByLabel("Show", { exact: true }).selectOption("created");
  assert.equal(
    await page.locator(".st-lib-card").count(),
    0,
    "created filter hides the customized draft",
  );
  await page.getByLabel("Show", { exact: true }).selectOption("all");
  await shot(page, "03-my-activities");
  ok("my activities");
  await page.goto(`${base}${LAB}/activity-studio/${id}`, { waitUntil: "networkidle" });

  // 4. Edit a question prompt (autosave), reload, and the draft is recovered.
  await page.getByRole("tab", { name: "Edit content" }).click();
  let edited = false;
  const cards = page.locator("section.st-card[data-block] button.st-card-title");
  for (let i = 0, n = await cards.count(); i < n && !edited; i++) {
    await cards.nth(i).click();
    const q = page.getByLabel("Question", { exact: true });
    if (await q.count()) {
      await q.first().fill("EDITED PROMPT: what is the main idea?");
      edited = true;
    }
  }
  assert.ok(edited, "found a question to edit");
  await waitSaved(page);
  await shot(page, "04-content-editor");
  await page.reload({ waitUntil: "networkidle" });
  assert.ok(
    JSON.stringify(await readDraft(page, id)).includes("EDITED PROMPT"),
    "the edit survives a reload",
  );
  await page.getByRole("tab", { name: "Edit content" }).click();
  await page.locator("section.st-card[data-block]").first().waitFor();
  ok("edit, autosave, recover");

  // 5. A quick change with Undo.
  await page.getByRole("tab", { name: "Quick Customize" }).click();
  const snapshot = JSON.stringify((await readDraft(page, id)).blocks);
  await page.locator('[data-preset="language-support"]').click();
  await page.locator(".st-quick-result").getByRole("button", { name: "Undo" }).waitFor();
  assert.notEqual(
    JSON.stringify(
      (
        await (async () => {
          await waitSaved(page);
          return readDraft(page, id);
        })()
      ).blocks,
    ),
    snapshot,
    "the quick change changed the draft",
  );
  await page.locator(".st-quick-result").getByRole("button", { name: "Undo" }).click();
  await waitSaved(page);
  assert.equal(
    JSON.stringify((await readDraft(page, id)).blocks),
    snapshot,
    "Undo restores the content exactly",
  );
  ok("quick change and undo");

  // 6. No AI here: the assistant says so honestly.
  const suggest = page.locator('[data-act="suggest"]');
  assert.ok(await suggest.isDisabled(), "Suggest changes is disabled with no AI");
  assert.match(await page.locator('[data-ai="no"]').innerText(), /not available right now/);
  ok("assistant disabled honestly");

  // 7. Student preview carries no teacher notes and no editing controls.
  await page.getByRole("button", { name: "Advanced options" }).click();
  await page.getByLabel(/Notes for me/).fill("TEACHER-ONLY-NOTE-7731");
  await waitSaved(page);
  await page.getByRole("button", { name: "Preview as student" }).click();
  const frame = page.locator("dialog iframe");
  await frame.waitFor({ timeout: 15000 });
  await page.frameLocator("dialog iframe").locator(".sp-q").first().waitFor({ timeout: 15000 });
  const srcdoc = await frame.getAttribute("srcdoc");
  assert.ok(!srcdoc.includes("TEACHER-ONLY-NOTE-7731"), "no teacher note in the student preview");
  assert.ok(
    !srcdoc.includes("Copied from the ACCESS Practice Lab bank"),
    "no teacher source note in the student preview",
  );
  assert.ok(
    !/st-card|st-sidebar|Quick Customize|data-act=/.test(srcdoc),
    "no editing controls in the student preview",
  );
  assert.ok(
    !/"notes"|"type":"note"/.test(srcdoc),
    "no notes or note blocks in the student page data",
  );
  await shot(page, "05-student-preview");
  await page.keyboard.press("Escape");

  // The student page player output (what /do/<id> and the downloaded HTML carry) from the same draft.
  const student = await page.evaluate(async (aid) => {
    const a = JSON.parse(localStorage.getItem("accessPracticeLab:v1:studio"))[aid].activity;
    const { studentHtml } = await import("/access-practice-lab/src/studio/editor/preview.js");
    const { convertActivity } = await import("/access-practice-lab/src/studio/core/convert.js");
    const { printHtml } = await import("/access-practice-lab/src/studio/editor/preview.js");
    const html = await studentHtml(a, { lang: "en" });
    const ws = convertActivity(a, "worksheet").activity;
    const sheet = await printHtml(ws, { lang: "en", part: "student" });
    const key = await printHtml(ws, { lang: "en", part: "key" });
    return { html, sheet: sheet.html, key: key.html };
  }, id);
  assert.ok(
    !student.html.includes("TEACHER-ONLY-NOTE-7731") && !/"type":"note"/.test(student.html),
    "student HTML: no notes",
  );
  assert.ok(!/answer key/i.test(student.sheet), "worksheet student page: no answer key");
  assert.ok(/answer key/i.test(student.key), "worksheet key page: has the key");
  ok("student output clean");

  // 8. Make four versions: a comparison table with the rigor confirmation, then open one.
  await page.getByRole("tab", { name: "Quick Customize" }).click();
  await page.locator('[data-act="make-versions"]').click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByRole("button", { name: "Make versions" }).click();
  await dialog.locator("table.st-compare").waitFor({ timeout: 20000 });
  assert.equal(await dialog.locator("table caption").count(), 1);
  assert.equal(
    await dialog.locator('thead th[scope="col"]').count(),
    6,
    "what changes + original + 4 versions",
  );
  assert.ok(
    (await dialog.locator('tbody th[scope="row"]').count()) >= 3,
    "rows of supports and counts",
  );
  const note = await dialog.locator(".st-confirm, .st-needs").first().innerText();
  assert.match(note, /Same learning objective and same answer keys/, `rigor line: ${note}`);
  await shot(page, "06-versions-comparison");
  await axe(page, "versions dialog");
  assert.equal(await dialog.locator(".st-version-list button").count(), 4);
  ok("versions");
  await dialog.locator(".st-version-list button").first().click();
  await page.waitForURL(/activity-studio\/s[a-f0-9]{10}$/);
  assert.notEqual(draftId(page), id, "Open goes to the version");
  await page.locator(".st-source-line").waitFor();
  assert.match(await page.locator(".st-source-line").innerText(), /Emerging version of/);
  const all = await allDrafts(page);
  assert.equal(
    all.filter((a) => a.lineage?.variantOf === id).length,
    4,
    "four versions saved, each linked to the original",
  );
  assert.equal(
    JSON.stringify((await readDraft(page, id)).blocks).includes("EDITED PROMPT"),
    true,
    "the original draft is untouched",
  );
  await page.goto(`${base}${LAB}/activity-studio/mine`, { waitUntil: "networkidle" });
  await page.locator(".st-lib-versions summary").first().waitFor();
  assert.match(await page.locator(".st-lib-versions summary").first().innerText(), /4 versions/);
  await page.locator(".st-lib-versions summary").first().click();
  await shot(page, "07-my-activities-versions");
  ok("versions open and grouped");

  // 9. A Vocabulary Academy customization.
  const vref = await page.evaluate(async () => {
    const { adapterFor } = await import("/access-practice-lab/src/studio/adapters/registry.js");
    const list = await adapterFor("vocab-academy").list({
      fetchJson: (u) => fetch(u).then((r) => r.json()),
    });
    return list[0]?.id;
  });
  assert.ok(vref, "vocab-academy lists units");
  await page.goto(`${base}${LAB}/activity-studio/customize?family=vocab-academy&ref=${vref}`, {
    waitUntil: "networkidle",
  });
  await page.waitForURL(/activity-studio\/s[a-f0-9]{10}$/, { timeout: 15000 });
  const vdraft = await readDraft(page, draftId(page));
  assert.equal(vdraft.lineage.family, "vocab-academy");
  assert.equal(vdraft.lineage.ref, vref);
  assert.ok(
    vdraft.blocks.some((b) => b.type === "vocab"),
    "the unit's words came across",
  );
  ok("vocab-academy customization");
  await page.goto(`${base}${LAB}/activity-studio/customize?family=access-bank&ref=does-not-exist`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("heading", { name: "That activity could not be opened" }).waitFor();
  ok("unknown ref is explained");

  // 10. Teacher entry point on a Vocabulary Academy lesson: teacher device only.
  const lesson = `${base}${LAB}/vocabulary-academy/grade/${vref.slice(1).split("-")[0]}/lesson/${Number(vref.slice(-2))}`;
  const guest = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const gp = await guest.newPage();
  watch(gp, "student device");
  await gp.goto(lesson, { waitUntil: "networkidle" });
  await gp.locator("main, h1").first().waitFor();
  assert.equal(
    await gp.locator("[data-customize-activity]").count(),
    0,
    "a student device never sees Customize Activity",
  );
  await guest.close();
  const teacher = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await teacher.addInitScript(() => {
    try {
      localStorage.setItem("accessPracticeLab:v1:audience", "teacher");
    } catch {}
  });
  const tp = await teacher.newPage();
  watch(tp, "teacher device");
  await tp.goto(lesson, { waitUntil: "networkidle" });
  const link = tp.locator("[data-customize-activity]");
  await link.waitFor({ timeout: 10000 });
  assert.match(
    await link.getAttribute("href"),
    new RegExp(`customize\\?family=vocab-academy&ref=${vref}(&|$)`),
  );
  await teacher.close();
  ok("entry point gated to teachers");

  // 11. The assistant, mocked: a suggestion is reviewed before anything is applied.
  const aiCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await aiCtx.addInitScript(() => {
    try {
      localStorage.setItem(
        "accessPracticeLabClass:v1:teacher-classes",
        JSON.stringify([{ code: "ABC234", passcode: "TEACH2", title: "Test class" }]),
      );
    } catch {}
  });
  await aiCtx.route("**/api/studio/ai", async (route) => {
    const req = route.request();
    if (req.method() === "GET") return route.fulfill({ json: { ok: true, available: true } });
    const body = JSON.parse(req.postData());
    const a = structuredClone(body.activity);
    const q = a.blocks.find((b) => b.type === "question");
    q.prompt = `${q.prompt} (clearer wording)`;
    return route.fulfill({
      json: { ok: true, mode: "edit", activity: a, issues: { errors: [], warnings: [] } },
    });
  });
  const ap = await aiCtx.newPage();
  watch(ap, "assistant");
  await ap.goto(`${base}${LAB}/activity-studio/customize?family=access-bank&ref=${ref}`, {
    waitUntil: "networkidle",
  });
  await ap.waitForURL(/activity-studio\/s[a-f0-9]{10}$/, { timeout: 15000 });
  const aid = draftId(ap);
  await ap.locator('[data-ai="yes"]').waitFor();
  await ap.getByLabel("What would you like to change?").fill("Make the first question clearer");
  await ap.locator('[data-act="suggest"]').click();
  await ap.getByRole("heading", { name: "Review suggested changes" }).waitFor();
  assert.equal(await ap.locator(".st-change").count(), 1, "one changed block is listed");
  assert.ok(
    (await ap.locator(".st-diff ins").first().innerText()).includes("clearer"),
    "the added words are marked",
  );
  await ap.getByRole("button", { name: "Cancel" }).click();
  assert.ok(
    !JSON.stringify(await readDraft(ap, aid)).includes("clearer wording"),
    "Cancel applies nothing",
  );
  await ap.locator('[data-act="suggest"]').click();
  await ap.getByRole("button", { name: "Apply selected" }).click();
  await waitSaved(ap);
  assert.ok(
    JSON.stringify(await readDraft(ap, aid)).includes("clearer wording"),
    "Apply selected applies the change",
  );
  await ap.getByRole("button", { name: "Undo" }).first().click();
  await waitSaved(ap);
  assert.ok(
    !JSON.stringify(await readDraft(ap, aid)).includes("clearer wording"),
    "the applied suggestion can be undone",
  );
  await aiCtx.close();
  ok("assistant reviewed before applying");

  // 12. Keyboard only: reach Customize, then Make versions, then the dialog and out again.
  await page.goto(`${base}${LAB}/activity-studio/${id}`, { waitUntil: "networkidle" });
  await page.locator(".st-top").waitFor();
  const tabTo = async (selector, max = 90) => {
    for (let i = 0; i < max; i++) {
      await page.keyboard.press("Tab");
      if (await page.evaluate((s) => document.activeElement?.matches(s), selector)) return i + 1;
    }
    throw new Error(`could not reach ${selector} by keyboard in ${max} Tab presses`);
  };
  await page.locator("body").click({ position: { x: 2, y: 2 } });
  await tabTo('[data-act="customize"]');
  await page.keyboard.press("Enter");
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    "st-quick-title",
    "Customize moves focus to the panel",
  );
  await tabTo('[data-act="make-versions"]');
  await page.keyboard.press("Enter");
  await page.locator("dialog[open]").waitFor();
  assert.ok(
    await page.evaluate(() => Boolean(document.activeElement?.closest("dialog"))),
    "focus is inside the dialog",
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog[open]").count(), 0, "Escape closes the dialog");
  ok("keyboard only");

  // 13. Phone width: nothing overflows, and the editor reads in one column.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "activity-studio/customize",
    "activity-studio/mine",
    `activity-studio/${id}`,
  ]) {
    await page.goto(`${base}${LAB}/${path}`, { waitUntil: "networkidle" });
    assert.ok((await overflow(page)) <= 1, `${path}: no horizontal scroll at 390px`);
  }
  await page.goto(`${base}${LAB}/activity-studio/${id}`, { waitUntil: "networkidle" });
  await page.locator("#st-quick-title").waitFor();
  await shot(page, "08-mobile-editor");
  await page.locator('[data-act="make-versions"]').click();
  await page.locator("dialog[open]").getByRole("button", { name: "Make versions" }).click();
  await page.locator("dialog table.st-compare").waitFor({ timeout: 20000 });
  assert.ok((await overflow(page)) <= 1, "versions dialog: no horizontal page scroll at 390px");
  await shot(page, "09-mobile-versions");
  await page.keyboard.press("Escape");
  ok("phone width");

  await context.close();
  assert.deepEqual(problems, [], problems.join("\n"));
  console.log(`studio-customize-e2e: PASS (${steps.length} scenarios: ${steps.join("; ")})`);
} catch (error) {
  console.error(`studio-customize-e2e: FAIL: ${error.message}`);
  if (problems.length) console.error(problems.join("\n"));
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
