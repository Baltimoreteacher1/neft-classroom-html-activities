#!/usr/bin/env node
/**
 * Create (Project Studio), driven the way a teacher drives it, in a real browser.
 *   S1 a student device: no Create control, and no authoring module is even requested
 *   S2 vocabulary cards -> worksheet from a Vocabulary Academy lesson; Word file downloaded (the REAL builder)
 *   S3 a reading companion from a Reading Room lesson with more language support; printed page and key previews
 *   S4 packet across pages: add from two pages, the chip survives a reload, reorder by keyboard, packet Word file
 *   S5 standalone HTML downloaded, then opened with every network request blocked: it renders and checks an answer
 *   S6 Open in Activity Studio: the draft opens in the editor, the platform file is unchanged
 *   S7 a hub page (Teacher tools) with the source picker; S8 the Teacher Hub's per-set link opens the same panel
 *   S9 keyboard only: Tab to Create, arrows through formats, Esc returns focus; S10 phone 390px; axe on the dialog
 * Serves the source tree (lib/access-serve.mjs). /api/studio/docx is answered in-process by the real
 * functions/_lib/studio/docx.js buildDocx; nothing else under /api exists, which is the offline path.
 * Screenshots: $SHOTS_DIR (default reports/create-e2e). A missing browser is a SKIP locally, a FAIL in CI.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
  ({ default: AxeBuilder } = await import("@axe-core/playwright"));
} catch {
  console.warn("create-e2e: SKIP: playwright or axe is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
const { buildDocx } = await import("../functions/_lib/studio/docx.js");
const { normalizeActivity } = await import("../access-practice-lab/src/studio/core/schema.js");

const LAB = "/access-practice-lab";
const SHOTS = process.env.SHOTS_DIR || join(REPO_ROOT, "reports/create-e2e");
mkdirSync(SHOTS, { recursive: true });
const { server, base } = await serveAccess();
const browser = await chromium.launch().catch((error) => {
  console.warn(`create-e2e: SKIP: no browser (${error.message.split("\n")[0]}).`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
});

const problems = [];
const steps = [];
const metrics = [];
const ok = (name) => (steps.push(name), console.log(`  ok  ${name}`));
const watch = (page, label) => {
  page.on("pageerror", (e) => {
    if (!/web-vitals/.test(e.message))
      problems.push(`${label}: script error: ${e.message.slice(0, 200)}`);
  });
  page.on("console", (m) => {
    if (m.type() === "error" && !/status of 404|Failed to load resource|web-vitals/.test(m.text()))
      problems.push(`${label}: console error: ${m.text().slice(0, 200)}`);
  });
};

const vocabLesson = `${base}${LAB}/vocabulary-academy/grade/6/lesson/1`;
const rrIndex = JSON.parse(
  readFileSync(join(REPO_ROOT, "access-practice-lab/content/reading-room/lessons.json"), "utf8"),
);
const rrId = rrIndex.lessons[0].id;
const rrLesson = `${base}${LAB}/reading-room/${rrId}`;

async function teacherContext(viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport, acceptDownloads: true });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("accessPracticeLab:v1:audience", "teacher");
    } catch {}
  });
  await ctx.route("**/api/studio/docx", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    const bytes = await buildDocx(normalizeActivity(body.activity), {
      part: body.part || "student",
      lang: body.lang || "en",
    });
    await route.fulfill({
      status: 200,
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      body: Buffer.from(bytes),
    });
  });
  return ctx;
}

const dialog = (page) => page.locator("dialog.cr-dialog[open]").first();
async function openCreate(page) {
  // the lab header is rebuilt on every render (a view may render again once its data arrives), so a click can land on
  // a button that was just replaced: retry until the dialog is open
  for (let i = 0; i < 4; i++) {
    const btn = page.locator("button.cr-launch");
    await btn.waitFor({ timeout: 15000 });
    await btn.click();
    try {
      await dialog(page).locator("#cr-s1").waitFor({ timeout: 6000 });
      return;
    } catch {
      if (await page.locator("dialog.cr-dialog[open]").count()) {
        try {
          await dialog(page).locator("#cr-s1").waitFor({ timeout: 15000 });
          return;
        } catch {
          throw new Error(
            `Create dialog stuck on: ${(await dialog(page).innerText()).slice(0, 300)}`,
          );
        }
      }
    }
  }
  throw new Error("the Create dialog did not open");
}
async function frameText(page) {
  const handle = await dialog(page).locator("iframe.cr-frame").elementHandle();
  const frame = await handle.contentFrame();
  await frame.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(400);
  return frame.evaluate(() => document.body?.innerText || "");
}
function checkDocx(path, label) {
  const listing = execFileSync("unzip", ["-l", path], { encoding: "utf8" });
  assert.match(listing, /word\/document\.xml/, `${label}: no document.xml`);
  execFileSync("unzip", ["-tq", path]);
  const xml = execFileSync("unzip", ["-p", path, "word/document.xml"], {
    encoding: "utf8",
    maxBuffer: 64 << 20,
  });
  const text = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(" ");
  assert.ok(text.length > 200, `${label}: almost no editable text`);
  return { xml, text };
}

try {
  // ── S1 student device ──────────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    watch(page, "student");
    const requested = [];
    page.on("request", (r) => r.url().includes("/src/create/") && requested.push(r.url()));
    await page.goto(rrLesson, { waitUntil: "networkidle" });
    await page.locator("main h1").first().waitFor();
    assert.equal(
      await page.locator("[data-create]").count(),
      0,
      "a student device shows no Create control",
    );
    const authoring = requested.filter((u) => !/create\/gate\.js/.test(u));
    assert.deepEqual(
      authoring,
      [],
      `a student device requested authoring code: ${authoring.join(", ")}`,
    );
    // a device set to teacher but LINKED to a class as a student still gets nothing
    await page.evaluate(() => {
      localStorage.setItem("accessPracticeLab:v1:audience", "teacher");
      localStorage.setItem(
        "accessPracticeLabClass:v1:link",
        JSON.stringify({
          code: "ABC234",
          studentId: "s0123456789",
          studentKey: "ABCD2345",
          alias: "Star 1",
        }),
      );
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("main h1").first().waitFor();
    assert.equal(
      await page.locator("[data-create]").count(),
      0,
      "a class-linked student device shows no Create",
    );
    await ctx.close();
    ok("S1 student devices: no Create control, no authoring code");
  }

  // ── S2 vocabulary worksheet + Word ─────────────────────────────────────────
  const ctx = await teacherContext();
  const page = await ctx.newPage();
  watch(page, "teacher");
  {
    const t0 = Date.now();
    let clicks = 0;
    await page.goto(vocabLesson, { waitUntil: "networkidle" });
    await openCreate(page);
    clicks++;
    const d = dialog(page);
    assert.match(
      await d.locator(".cr-context").innerText(),
      /Vocabulary Academy|Grade 6/i,
      "inherited context is shown",
    );
    await d.locator("label.cr-format", { hasText: "Worksheet" }).click();
    clicks++;
    const txt = await frameText(page);
    assert.ok(txt.length > 300, "the worksheet preview has content");
    const [dl] = await Promise.all([
      page.waitForEvent("download"),
      d.getByRole("button", { name: "Download editable Word file" }).click(),
    ]);
    clicks++;
    const file = join(SHOTS, "s2-vocab-worksheet.docx");
    await dl.saveAs(file);
    const seconds = (Date.now() - t0) / 1000;
    const { text } = checkDocx(file, "S2 Word");
    assert.match(text, /\w{3,}/);
    metrics.push({
      scenario: "Vocabulary worksheet as Word, from a lesson page",
      clicks,
      decisions: 1,
      seconds,
    });
    await page.screenshot({ path: join(SHOTS, "s2-panel.png") });
    ok(`S2 vocabulary worksheet -> Word (${clicks} clicks, ${seconds.toFixed(1)} s)`);
  }

  // ── S3 reading companion with language support; print + key previews ──────
  {
    await page.keyboard.press("Escape");
    await page.goto(rrLesson, { waitUntil: "networkidle" });
    await openCreate(page);
    const d = dialog(page);
    await d.locator("label.cr-format", { hasText: "Worksheet" }).click();
    const before = await d
      .locator(".cr-more")
      .last()
      .innerText()
      .catch(() => "");
    await d
      .locator("fieldset.cr-seg", { hasText: "Language support" })
      .getByText("More support")
      .click();
    await page.waitForTimeout(300);
    const after = await d.locator("details.cr-more").last().innerText();
    assert.notEqual(after, before, "the change list reflects the adjustment");
    assert.match(after, /read-aloud|frames|word bank|hint/i);
    await d.locator("fieldset.cr-seg", { hasText: "Show" }).getByText("Printed page").click();
    const print = await frameText(page);
    assert.ok(print.length > 300, "printed page renders");
    assert.doesNotMatch(print, /Answer key/i, "student printed page has no key");
    await d.locator("fieldset.cr-seg", { hasText: "Show" }).getByText("Answer key").click();
    assert.match(await frameText(page), /Answer key/i);
    await page.screenshot({ path: join(SHOTS, "s3-reading-key.png") });
    // add to packet
    await d.getByRole("button", { name: "Add to packet" }).click();
    await d.locator(".cr-status", { hasText: "Added" }).waitFor();
    ok("S3 reading companion: support adjustment, printed page and separate key; added to packet");
  }

  // ── S4 packet across pages, reload, keyboard reorder, packet Word ──────────
  {
    await page.keyboard.press("Escape");
    await page.goto(vocabLesson, { waitUntil: "networkidle" });
    await page.locator("button.cr-tray", { hasText: "Packet (1)" }).waitFor({ timeout: 10000 });
    await openCreate(page);
    const d = dialog(page);
    await d.locator("label.cr-format", { hasText: "Vocabulary practice" }).click();
    await d.getByRole("button", { name: "Add to packet" }).click();
    await d.locator(".cr-status", { hasText: "2 part" }).waitFor();
    await page.keyboard.press("Escape");
    await page.reload({ waitUntil: "networkidle" });
    const chip = page.locator("button.cr-tray", { hasText: "Packet (2)" });
    await chip.waitFor({ timeout: 10000 });
    ok("S4a packet survives navigation and a reload");
    await chip.click();
    const pk = page.locator("dialog.cr-packet[open]");
    await pk.locator(".cr-pk-item").first().waitFor();
    const firstBefore = await pk.locator(".cr-pk-item .cr-pk-t strong").first().innerText();
    const down = pk.locator(".cr-pk-item").first().locator('[data-act="down"]');
    await down.focus();
    await page.keyboard.press("Enter");
    const firstAfter = await pk.locator(".cr-pk-item .cr-pk-t strong").first().innerText();
    assert.notEqual(firstAfter, firstBefore, "keyboard reorder moved the part");
    assert.ok(
      await page.evaluate(() => document.activeElement?.closest(".cr-pk-item") != null),
      "focus stays on the moved part",
    );
    await pk.locator("#cr-pk-name").fill("Ecosystems packet");
    await pk.locator("#cr-pk-name").press("Tab");
    const [dl] = await Promise.all([
      page.waitForEvent("download"),
      pk.getByRole("button", { name: "Download packet (Word)" }).click(),
    ]);
    const file = join(SHOTS, "s4-packet.docx");
    await dl.saveAs(file);
    const { text } = checkDocx(file, "S4 packet");
    assert.match(text, /Part 1/);
    assert.match(text, /Part 2/);
    const [dlk] = await Promise.all([
      page.waitForEvent("download"),
      pk.getByRole("button", { name: "Answer key (Word)" }).click(),
    ]);
    await dlk.saveAs(join(SHOTS, "s4-packet-key.docx"));
    checkDocx(join(SHOTS, "s4-packet-key.docx"), "S4 key");
    await page.screenshot({ path: join(SHOTS, "s4-packet.png") });
    await page.keyboard.press("Escape");
    ok("S4b packet: keyboard reorder, title, combined Word file and answer key");
  }

  // ── S5 standalone HTML, opened offline ─────────────────────────────────────
  {
    await openCreate(page);
    const d = dialog(page);
    await d.locator("label.cr-format", { hasText: "Interactive activity" }).click();
    const [dl] = await Promise.all([
      page.waitForEvent("download"),
      d.getByRole("button", { name: /Download HTML/ }).click(),
    ]);
    const file = join(SHOTS, "s5-activity.html");
    await dl.saveAs(file);
    await page.keyboard.press("Escape");
    const off = await browser.newContext({ viewport: { width: 1024, height: 800 }, offline: true });
    const op = await off.newPage();
    const external = [];
    op.on(
      "request",
      (r) =>
        !r.url().startsWith("file:") &&
        !r.url().startsWith("data:") &&
        !r.url().startsWith("blob:") &&
        external.push(r.url()),
    );
    watch(op, "offline html");
    await op.goto(`file://${file}`);
    await op.locator("h1").first().waitFor({ timeout: 10000 });
    const btn = op.locator("button:visible").first();
    assert.ok(await btn.count(), "the offline activity has working controls");
    assert.deepEqual(
      external,
      [],
      `the standalone file requested the network: ${external.join(", ")}`,
    );
    await op.screenshot({ path: join(SHOTS, "s5-offline.png") });
    await off.close();
    ok("S5 standalone HTML opens with no network");
  }

  // ── S6 open in Activity Studio ─────────────────────────────────────────────
  {
    const original = readFileSync(
      join(REPO_ROOT, "access-practice-lab/content/vocab-academy/g6/u01.json"),
      "utf8",
    );
    await openCreate(page);
    await dialog(page)
      .getByRole("button", { name: /Open in Activity Studio/ })
      .click();
    await page.waitForURL(/\/activity-studio\/s[a-f0-9]{10}$/, { timeout: 15000 });
    await page.locator("main").getByRole("textbox").first().waitFor({ timeout: 15000 });
    assert.equal(
      await page.locator("dialog.cr-dialog[open]").count(),
      0,
      "the Create dialog closed",
    );
    assert.equal(
      readFileSync(
        join(REPO_ROOT, "access-practice-lab/content/vocab-academy/g6/u01.json"),
        "utf8",
      ),
      original,
    );
    assert.equal(
      await page.locator("button.cr-launch").count(),
      0,
      "no second Create inside the Studio",
    );
    ok("S6 Open in Activity Studio: draft opens in the editor; platform file unchanged");
  }

  // ── S7 hub picker ──────────────────────────────────────────────────────────
  {
    await page.goto(`${base}${LAB}/tools`, { waitUntil: "networkidle" });
    const btn = page.locator("button.cr-launch");
    await btn.waitFor({ timeout: 15000 });
    await btn.click();
    const d = dialog(page);
    await d
      .locator("fieldset.cr-seg", { hasText: "Start from" })
      .getByText("Reading Room lesson")
      .click();
    await d.locator(".cr-pick").first().waitFor({ timeout: 15000 });
    await d.locator("input[type=search]").fill(rrIndex.lessons[3].title.slice(0, 12));
    await d.locator(".cr-pick").first().click();
    await d.locator("#cr-s2").waitFor({ timeout: 15000 });
    assert.ok((await frameText(page)).length > 200);
    await page.keyboard.press("Escape");
    ok("S7 hub page: source picker -> search -> preview");
  }

  // ── S8 Teacher Hub per-set link ────────────────────────────────────────────
  {
    await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
    const link = page.locator("[data-customize-activity]").first();
    if (await link.count()) {
      // as a teacher would: open the Resources tab, then the content-library fold
      await page.locator("#tab-resources").click();
      const foldBody = page.locator("#fold--access-teacher-accContent");
      if (await foldBody.count()) {
        const toggle = page.locator('[aria-controls="fold--access-teacher-accContent"]');
        if ((await toggle.count()) && (await toggle.getAttribute("aria-expanded")) !== "true")
          await toggle.first().click();
      }
      await link.scrollIntoViewIfNeeded({ timeout: 5000 });
      await link.click();
      await dialog(page).locator("#cr-s1").waitFor({ timeout: 15000 });
      assert.match(page.url(), /access-teacher/, "the page did not navigate away");
      await page.screenshot({ path: join(SHOTS, "s8-teacher-hub.png") });
      await page.keyboard.press("Escape");
      ok("S8 Teacher Hub: the set's link opens Create in place");
    } else
      problems.push("S8: the Teacher Hub content panel rendered no set links on the source server");
  }

  // ── S9 keyboard only ───────────────────────────────────────────────────────
  {
    await page.goto(rrLesson, { waitUntil: "networkidle" });
    await page.locator("button.cr-launch").waitFor();
    await page.locator("button.cr-launch").focus();
    await page.keyboard.press("Enter");
    const d = dialog(page);
    await d.locator("#cr-s1").waitFor();
    const radio = d.locator('input[name="cr-format"]:checked');
    await radio.focus();
    const v1 = await radio.getAttribute("value");
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(500);
    const v2 = await d.locator('input[name="cr-format"]:checked').getAttribute("value");
    assert.notEqual(v1, v2, "arrow keys change the format");
    const results = await new AxeBuilder({ page })
      .include("dialog.cr-dialog")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    assert.deepEqual(
      serious.map((v) => `${v.id}: ${v.nodes[0]?.target}`),
      [],
      "axe on the Create dialog",
    );
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    assert.ok(
      await page.evaluate(() => document.activeElement?.classList.contains("cr-launch")),
      "Esc returns focus to Create",
    );
    ok("S9 keyboard only: open, arrow through formats, Esc returns focus; axe clean");
  }
  await ctx.close();

  // ── S10 phone ──────────────────────────────────────────────────────────────
  {
    const pctx = await teacherContext({ width: 390, height: 844 });
    const p = await pctx.newPage();
    watch(p, "phone");
    await p.goto(vocabLesson, { waitUntil: "networkidle" });
    const btn = p.locator("button.cr-launch");
    await btn.waitFor({ timeout: 15000 });
    if (!(await btn.isVisible())) {
      // the header may collapse tools into the More menu on phones
      await p
        .locator(".lab-tools summary")
        .first()
        .click()
        .catch(() => {});
    }
    await btn.click();
    await dialog(p).locator("#cr-s1").waitFor();
    const overflow = await p.evaluate(() => {
      const d = document.querySelector("dialog.cr-dialog");
      return d.scrollWidth - d.clientWidth;
    });
    assert.ok(overflow <= 1, `dialog scrolls sideways at 390px by ${overflow}px`);
    await p.screenshot({ path: join(SHOTS, "s10-phone.png") });
    await pctx.close();
    ok("S10 phone 390px: the panel fits with no sideways scroll");
  }
} catch (e) {
  problems.push(`stopped: ${e.message.split("\n").slice(0, 3).join(" ")}`);
} finally {
  await browser.close();
  server.close();
}

writeFileSync(join(SHOTS, "metrics.json"), JSON.stringify({ steps, metrics, problems }, null, 2));
console.log(`create-e2e: ${steps.length} scenarios passed`);
for (const m of metrics)
  console.log(
    `  metric: ${m.scenario}: ${m.clicks} clicks, ${m.decisions} decision, ${m.seconds.toFixed(1)} s (automated, not a human)`,
  );
if (problems.length) {
  for (const p of problems) console.error(`  FAIL ${p}`);
  process.exit(1);
}
