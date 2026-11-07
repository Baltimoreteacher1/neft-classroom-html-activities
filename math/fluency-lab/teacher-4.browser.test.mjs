// Teacher tools 4.0 in a real browser: import learner files, build and manage an assignment, read the analytics,
// export CSV, print, Spanish, keyboard, three widths, no console errors. TEACHER_SHOTS=/tmp/dir saves screenshots.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";
import { DAY, NOW, answers, keyOf, mistake, tutorWith } from "../../tools/lib/teacher-4-fixtures.mjs";

const shots = process.env.TEACHER_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });

// Learner backups, built the way the lab's "Download my progress" writes them.
const ADD = keyOf("add-20");
const RATIOS = "6:ratios";
const PROPORTIONS = "7:proportions";
const spread = (pattern, end = NOW) => answers(pattern, { start: end - (pattern.length - 1) * DAY });
const backup = (tutor, exportedAt = NOW, extra = {}) => ({ app: "EduWonderLab Fluency Lab", version: 2, exportedAt: new Date(exportedAt).toISOString(), grade: 6, progress: {}, tutor, settings: {}, ...extra });
const mastered = spread("cccccccccc");
const classNow = [
  tutorWith({ [ADD]: spread("cwww"), [RATIOS]: spread("wwcw"), [PROPORTIONS]: spread("wwc") }, [mistake(ADD, "subtractInsteadOfAdding", { n: 0 }), mistake(ADD, "subtractInsteadOfAdding", { n: 1 })]),
  tutorWith({ [ADD]: spread("www"), [RATIOS]: spread("wcw"), [PROPORTIONS]: spread("ww") }, [mistake(ADD, "subtractInsteadOfAdding", { n: 2 }), mistake(ADD, "omittedAddend", { resolved: true, n: 3 })]),
  tutorWith({ [ADD]: spread("cccc"), [RATIOS]: mastered }, [], { [RATIOS]: { dueAt: NOW - 2 * DAY, interval: 7 } }),
  tutorWith({ [ADD]: spread("cw") }, [mistake(ADD, "omittedAddend", { n: 4 })]),
  tutorWith({ [ADD]: [...spread("w"), ...answers("ww", { independent: false, start: NOW - 5 * DAY })], [RATIOS]: mastered }, [], { [RATIOS]: { dueAt: NOW - 10 * DAY, interval: 30 } }),
];
const snap = (key, daysAgo, score, state) => ({ key, at: NOW - daysAgo * DAY, score, state, independent: 4, ladderStep: 1 });
const growthFor = (key) => ({ growth: { version: 1, snapshots: [snap(key, 21, 30, "learning"), snap(key, 14, 45, "developing"), snap(key, 7, 55, "developing"), snap(key, 0, 72, "proficient")] } });
const classEarlier = [tutorWith({ [ADD]: spread("wwww", NOW - 30 * DAY) }), tutorWith({ [ADD]: spread("wcww", NOW - 30 * DAY) }), tutorWith({ [RATIOS]: spread("wwwc", NOW - 30 * DAY) })];

const dir = mkdtempSync(join(tmpdir(), "t4-files-"));
const write = (name, body) => { const path = join(dir, name); writeFileSync(path, JSON.stringify(body)); return path; };
const nowFiles = classNow.map((tutor, index) => write(`now-${index}.json`, backup(tutor, NOW, { play: growthFor(RATIOS) })));
const earlierFiles = classEarlier.map((tutor, index) => write(`earlier-${index}.json`, backup(tutor, NOW - 30 * DAY)));
const notBackup = write("other.json", { hello: "world" });

const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  await context.addInitScript(() => { window.__printed = 0; window.print = () => { window.__printed += 1; }; });
  const page = await context.newPage();
  const problems = [];
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") problems.push(`console: ${message.text()}`); });
  const shot = async (name, { full = false } = {}) => shots && page.screenshot({ path: `${shots}/${name}.png`, fullPage: full });
  const noOverflow = async (label) => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, `no sideways scroll: ${label}`);
  const t4 = page.locator("#teacher-4");

  await page.goto(`${base}/math/fluency-lab/?view=teacher&grade=6`, { waitUntil: "networkidle" });
  await t4.locator(".t4").waitFor();
  assert.equal(await page.locator("#teacher-4 [role=tab]").count(), 7);

  // Tabs: roving tabindex and arrow keys.
  await page.locator("#t4-tab-assign").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.evaluate(() => document.activeElement.id), "t4-tab-insights");
  assert.equal(await page.locator("#t4-panel-insights").isVisible(), true);
  await page.keyboard.press("End");
  assert.equal(await page.evaluate(() => document.activeElement.id), "t4-tab-tools", "End goes to the last of the seven tabs");
  await page.keyboard.press("Home");
  assert.equal(await page.locator("#t4-panel-assign").isVisible(), true);

  // ---- Assignments ----
  const form = t4.locator("[data-t4-form]");
  await form.locator("[name=label]").fill('Ratios "week 1" | check');
  await form.locator("[name=grade]").selectOption("6");
  await form.locator("[name=skill]").nth(0).check();
  await form.locator("[name=skill]").nth(1).check();
  await form.locator("[name=count]").selectOption("15");
  await form.locator("[name=tierLow]").selectOption("2");
  await form.locator("[name=tierHigh]").selectOption("4");
  assert.equal(await form.locator("[name=score]").isDisabled(), true, "target fields wait for the checkbox");
  await form.locator("[name=target]").check();
  await form.locator("[name=score]").fill("80");
  await form.locator("[name=days]").fill("2");
  await form.locator("[name=due]").fill("2099-05-20");
  await shot("1-assignments-1280");
  await form.locator("button[type=submit]").click();
  const share = t4.locator(".t4-share");
  await share.waitFor();
  const shortHref = await share.locator("#t4-short").inputValue();
  const code = await share.locator("#t4-code").inputValue();
  const fullHref = await share.locator("#t4-full").inputValue();
  assert.match(code, /^FL4-/);
  assert.ok(shortHref.endsWith(`#assignment=${code}`) && shortHref.length < fullHref.length + 20);
  const decoded = await page.evaluate(async ({ code: c, fullHref: f }) => {
    const { decodeAssignment } = await import("/math/fluency-lab/school-tools.js");
    return { short: decodeAssignment(c), full: decodeAssignment(new URL(f).hash.slice("#assignment=".length)) };
  }, { code, fullHref });
  assert.deepEqual([decoded.short.tiers, decoded.short.target, decoded.short.due, decoded.short.count], [[2, 4], { score: 80, days: 2 }, "2099-05-20", 15]);
  assert.equal(decoded.full.label, 'Ratios "week 1" | check', "the full link carries the title");
  assert.deepEqual(decoded.full.tiers, [2, 4]);
  await share.locator("[data-t4-qr]").click();
  assert.equal(await share.locator("svg[role=img]").count(), 1, "the short link fits a local QR code");
  assert.equal(await t4.locator(".t4-item").count(), 1);
  await shot("2-assignment-saved-1280");

  // Edit, duplicate, retire.
  await t4.locator("[data-t4-edit]").click();
  assert.equal(await form.locator("[name=label]").inputValue(), 'Ratios "week 1" | check');
  assert.equal(await form.locator("[name=due]").inputValue(), "2099-05-20");
  assert.equal(await form.locator("button[type=submit]").innerText(), "Update assignment");
  await form.locator("[name=label]").fill("Ratios week 1 (edited)");
  await form.locator("button[type=submit]").click();
  await t4.locator(".t4-item h4", { hasText: "Ratios week 1 (edited)" }).waitFor();
  assert.equal(await t4.locator(".t4-item").count(), 1, "editing keeps one assignment");
  await t4.locator("[data-t4-dup]").click();
  assert.equal(await t4.locator(".t4-item").count(), 2);
  await t4.locator(".t4-item").first().locator("[data-t4-retire]").click();
  assert.match(await t4.locator(".t4-item").first().innerText(), /Retired/);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fluency-teacher-assignments-v1")).length), 2);
  await form.locator("button[type=submit]").click();
  assert.match(await form.locator(".t4-error").innerText(), /at least one skill/);

  // ---- Class insights ----
  assert.equal(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.includes("teacher-class")).length), 0);
  await page.locator("#t4-tab-insights").click();
  await t4.locator("[data-t4-files]").setInputFiles([...nowFiles, notBackup]);
  await t4.locator(".t4-tiles").waitFor();
  assert.match(await t4.locator(".t4-message").first().innerText(), /1 files were not Fluency Lab backups/);
  assert.match(await t4.locator(".t4-tiles").innerText(), /5\s+learners with evidence/);
  const cards = t4.locator("#t4-h-trouble").locator("xpath=..").locator(".t4-card");
  assert.ok((await cards.count()) >= 3);
  for (const card of await cards.all()) {
    assert.match(await card.locator(".t4-obs").innerText(), /^Observed:.*\d/s);
    assert.match(await card.locator(".t4-inf").innerText(), /^Possible reason \(inferred\):\s*Possible/s);
  }
  assert.match(await t4.locator("#t4-h-patterns").locator("xpath=..").innerText(), /Subtracted instead of adding/);
  const groupText = await t4.locator("#t4-h-groups").locator("xpath=..").innerText();
  assert.match(groupText, /Shared answer pattern/);
  assert.match(groupText, /Learner 1\s+Learner 2/);
  assert.equal(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.includes("teacher-class")).length), 0, "opening files stores nothing");
  await t4.locator("[data-t4-level]").selectOption(ADD);
  assert.equal(await t4.locator(".t4-band").count(), 3);
  await shot("3-insights-1280", { full: true });

  // A reteach card hands its practice plan to the assignment form.
  await t4.locator("#t4-h-trouble").locator("xpath=..").locator("[data-t4-plan]").first().click();
  assert.equal(await page.locator("#t4-panel-assign").isVisible(), true);
  assert.match(await form.locator("[name=label]").inputValue(), /^Reteach: /);
  assert.ok((await form.locator("[name=skill]:checked").count()) >= 1);
  assert.equal(await form.locator("[name=target]").isChecked(), true);

  // Second snapshot set: trend table.
  await page.locator("#t4-tab-insights").click();
  await t4.locator("[data-t4-files]").setInputFiles(earlierFiles);
  await t4.locator("[data-t4-set] option").nth(1).waitFor({ state: "attached" });
  assert.equal(await t4.locator("#t4-h-trends").locator("xpath=..").locator("tbody tr").count(), 2);
  assert.match(await t4.locator(".t4-tiles").innerText(), /5\s+learners with evidence/, "the newest snapshot is analyzed");
  await t4.locator("[data-t4-set]").selectOption({ index: 0 });
  assert.match(await t4.locator(".t4-tiles").innerText(), /3\s+learners with evidence/);
  await t4.locator("[data-t4-set]").selectOption({ index: 1 });
  await t4.locator("[data-t4-label]").first().evaluate((node) => (node.closest("details").open = true));
  await t4.locator("[data-t4-label]").first().fill("Period 3 A");
  await t4.locator("[data-t4-label]").first().dispatchEvent("change");
  assert.match(await t4.locator("#t4-h-strands").locator("xpath=..").innerText(), /Period 3 A/);

  // The assignment list now shows progress from the opened class.
  await page.locator("#t4-tab-assign").click();
  await t4.locator(".t4-item details summary").first().click();
  assert.match(await t4.locator(".t4-item").first().innerText(), /\d+ met, \d+ in progress/);

  // ---- Reports ----
  await page.locator("#t4-tab-reports").click();
  const download = async (selector) => { const [file] = await Promise.all([page.waitForEvent("download"), t4.locator(selector).click()]); return { name: file.suggestedFilename(), text: await (await import("node:fs")).promises.readFile(await file.path(), "utf8") }; };
  const learners = await download("[data-t4-csv-learner]");
  assert.match(learners.name, /^fluency-class-learners-all-\d{4}-\d{2}-\d{2}\.csv$/);
  const lines = learners.text.split("\r\n");
  assert.equal(lines.length, 6);
  assert.ok(lines.some((line) => line.startsWith('"Period 3 A"')), "the typed label reaches the file");
  assert.doesNotMatch(learners.text, /@|https?:/);
  const skills = await download("[data-t4-csv-skill]");
  assert.equal(skills.text.split("\r\n").length, 1 + 11, "11 learner-skill records");
  const json = JSON.parse((await download("[data-t4-json]")).text);
  assert.equal(json.kind, "class-report");
  await t4.locator("[data-t4-print]").click();
  assert.equal(await page.evaluate(() => window.__printed), 1);
  const printed = await page.locator("#print-sheet").innerHTML();
  assert.match(printed, /Possible reason \(inferred\)/);
  assert.match(printed, /Period 3 A/);
  await t4.locator("[data-t4-labels]").uncheck();
  await t4.locator("[data-t4-print]").click();
  assert.doesNotMatch(await page.locator("#print-sheet").innerHTML(), /Learner \d|Period 3 A/, "labels can be left off the printout");
  await t4.locator("[data-t4-save]").click();
  assert.equal(await page.evaluate(() => Boolean(localStorage.getItem("ewl-fluency-teacher-class-v1"))), true);
  await shot("4-reports-1280");
  await t4.locator("[data-t4-forget]").click();
  assert.equal(await page.evaluate(() => localStorage.getItem("ewl-fluency-teacher-class-v1")), null, "the saved class can be deleted");
  assert.equal(await page.evaluate(() => Object.keys(localStorage).filter((key) => /tutor|class/.test(key) && key.includes("teacher")).length), 0);

  // ---- Keyboard: build an assignment without a mouse; focus is visible ----
  await page.locator("#t4-tab-assign").click();
  await t4.locator("[data-t4-cancel]").click().catch(() => {});
  await form.locator("[name=label]").focus();
  const ring = await form.locator("[name=label]").evaluate((node) => getComputedStyle(node).boxShadow);
  assert.notEqual(ring, "none", "the focused field shows a ring");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.name), "skill");
  await page.keyboard.press("Space");
  assert.equal(await page.evaluate(() => document.activeElement.checked), true);

  // ---- Widths and touch targets ----
  for (const [width, height] of [[1280, 900], [820, 1100], [390, 844]]) {
    await page.setViewportSize({ width, height });
    for (const tab of ["assign", "insights", "reports"]) {
      await page.locator(`#t4-tab-${tab}`).click();
      await noOverflow(`${tab} at ${width}px`);
      for (const control of await page.locator(`#t4-panel-${tab} button:visible, #t4-panel-${tab} select:visible, #t4-panel-${tab} input:not([type=checkbox]):not([type=file]):visible`).all())
        assert.ok((await control.boundingBox()).height >= 43.5, `44px targets in ${tab} at ${width}px`);
      await t4.locator(".t4").scrollIntoViewIfNeeded();
      await shot(`5-${tab}-${width}`, { full: true });
    }
  }

  // ---- Spanish ----
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: /Español/ }).first().click();
  await t4.locator("#t4-tab-assign").waitFor();
  assert.equal(await t4.locator("#t4-tab-assign").innerText(), "Tareas");
  assert.equal(await t4.locator("#t4-tab-insights").innerText(), "Panorama de la clase");
  await page.locator("#t4-tab-insights").click();
  if (process.env.T4_DEBUG) console.log((await page.locator("#t4-panel-insights").innerText()).slice(0, 600));
  assert.deepEqual(problems, [], `no errors after switching language: ${problems.join("; ")}`);
  assert.match(await t4.locator("#t4-h-trouble").innerText(), /Habilidades para reenseñar/, "the opened class survives a language change");
  assert.match(await t4.locator("#t4-h-trouble").locator("xpath=..").innerText(), /Observado:[\s\S]*Posible razón \(inferida\):/);
  await shot("6-insights-es-1280", { full: true });
  await page.locator("#t4-tab-reports").click();
  assert.match(await t4.locator("#t4-privacy").innerText(), /Privacidad/);
  await noOverflow("Spanish reports");

  assert.deepEqual(problems, [], `no console errors: ${problems.join("; ")}`);
  console.log("teacher 4.0 browser test passed");
} finally {
  await browser?.close();
  await server.close();
}
