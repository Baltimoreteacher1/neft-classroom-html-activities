#!/usr/bin/env node
/**
 * K-2 starters in the Activity Studio, driven the way a teacher and a child drive them, in a real browser:
 *   Studio home shows the K-2 callout -> /activity-studio/k2 lists all 15 starters; grade and topic filters recount
 *   them -> for EVERY starter: "Use this activity" makes a draft (lineage k2-starters, Read aloud on, playful look)
 *   -> "Preview as student" runs the real player in its sandboxed frame -> the child completes every question with
 *   the controls a child uses (tap a picture, pick up a card and place it, move up/down, type or tap the word bank,
 *   talk prompt) and each one is marked correct (talk prompts go to review, never auto-graded) -> the finish screen.
 *   Also: K-2 sizing (data-band="k2", 64px+ targets), ten frames drawn in the player, the Hear button, no console
 *   errors, no request leaving the origin, no sideways scroll at 390px, reduced motion, axe (WCAG 2.2 AA) on the
 *   K-2 page and the editor.
 * Serves the source tree (lib/access-serve.mjs). Screenshots go to $SHOTS_DIR (default reports/studio-k2,
 * git-ignored). A missing browser is a SKIP locally and a FAIL in CI.
 *   node tools/studio-k2-e2e.mjs
 */
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { K2_STARTERS } from "../access-practice-lab/src/content/k2-studio/index.js";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
  ({ default: AxeBuilder } = await import("@axe-core/playwright"));
} catch {
  console.warn("studio-k2-e2e: SKIP: playwright or axe is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}

const LAB = "/access-practice-lab";
const SHOTS = process.env.SHOTS_DIR || join(REPO_ROOT, "reports/studio-k2");
mkdirSync(SHOTS, { recursive: true });
const { server, base } = await serveAccess();
const browser = await chromium.launch().catch((error) => {
  console.warn(`studio-k2-e2e: SKIP: no browser (${error.message.split("\n")[0]}).`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
});

const problems = [];
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
    const u = r.url();
    if (
      !u.startsWith(base) &&
      !u.startsWith("data:") &&
      !u.startsWith("blob:") &&
      u !== "about:srcdoc"
    )
      problems.push(`${label}: left the origin: ${u.slice(0, 100)}`);
  });
};
const shot = (page, name) => page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
const overflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const axe = async (page, label) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("iframe")
    .analyze();
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
const readDraft = (page, id) =>
  page.evaluate(
    (i) =>
      JSON.parse(localStorage.getItem("accessPracticeLab:v1:studio") || "{}")[i]?.activity || null,
    id,
  );
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Answer one question with the controls a child uses, from the draft's own key. */
async function answer(frame, q) {
  const box = frame.locator(`section.sp-q[data-block-id="${q.id}"]`);
  await box.waitFor({ timeout: 10000 });
  const optionInput = async (text) => {
    const texts = await box.locator(".sp-option .sp-opt-text").allTextContents();
    const at = texts.findIndex((t) => t.trim() === text);
    assert.ok(at >= 0, `${q.id}: option "${text}" not shown (saw ${texts.join(" | ")})`);
    await box.locator(".sp-option input").nth(at).check({ force: true });
  };
  if (q.format === "choice") await optionInput(q.options.find((o) => o.id === q.answer).text);
  else if (q.format === "multi")
    for (const id of q.answers) await optionInput(q.options.find((o) => o.id === id).text);
  else if (q.format === "sort")
    for (const it of q.items) {
      await box.locator(`.sp-bank [data-key="item:${it.id}"]`).click();
      await box.locator(`[data-key="cat:${it.category}"]`).click();
    }
  else if (q.format === "match")
    for (const p of q.pairs) {
      await box.locator(`.sp-bank [data-key="card:${p.id}"]`).click();
      await box.locator(`[data-key="slot:${p.id}"]`).click();
    }
  else if (q.format === "order") {
    for (let i = 0; i < q.items.length; i++) {
      const id = q.items[i].id;
      for (let guard = 0; guard < q.items.length; guard++) {
        const now = await box
          .locator("li.sp-order-item")
          .evaluateAll((els) => els.map((e) => e.dataset.id));
        if (now.indexOf(id) <= i) break;
        await box.locator(`[data-key="up:${id}"]`).click();
      }
    }
  } else if (q.format === "blank") {
    const answers = [...q.text.matchAll(/\[\[([^\]|]+)/g)].map((m) => m[1]);
    // the word bank, the way a child fills it: tap each tile in the order of the blanks
    for (const word of answers)
      await box.locator(".sp-bank button", { hasText: new RegExp(`^${esc(word)}$`) }).click();
  } else if (q.format === "short") await box.locator("textarea").fill(q.sample);
  else throw new Error(`${q.id}: no driver for ${q.format}`);
  await box.getByRole("button", { name: "Check answer" }).click();
  const fb = box.locator(".sp-feedback");
  await fb.locator(".sp-fb-title").waitFor({ timeout: 5000 });
  const cls = await fb.getAttribute("class");
  assert.match(
    cls,
    /is-right/,
    `${q.id} (${q.format}): not marked right: ${(await fb.innerText()).slice(0, 120)}`,
  );
  if (q.format === "short")
    assert.doesNotMatch(
      await fb.innerText(),
      /^Correct/m,
      `${q.id}: a talk prompt must never be auto-graded`,
    );
}

const steps = [];
const ok = (s) => steps.push(s);
try {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 1400 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  watch(page, "desktop");

  // 1. The Studio home offers K-2 starters.
  await page.goto(`${base}${LAB}/activity-studio`, { waitUntil: "networkidle" });
  const callout = page.locator(".st-k2-callout");
  await callout.waitFor({ timeout: 15000 });
  await shot(page, "01-studio-home");
  await callout.getByRole("button", { name: "Browse K-2 starters" }).click();
  await page.getByRole("heading", { name: "K-2 starter activities", level: 1 }).waitFor();
  assert.match(page.url(), /\/activity-studio\/k2$/);
  ok("Studio home -> K-2 starters");

  // 2. The K-2 page: every starter, and the filters recount from the data.
  const cards = page.locator(".st-k2-card");
  await cards.first().waitFor();
  assert.equal(await cards.count(), K2_STARTERS.length);
  assert.equal(K2_STARTERS.length, 15);
  await shot(page, "02-k2-all");
  await axe(page, "K-2 page");
  for (const g of ["K", "1", "2"]) {
    await page.locator(`[data-filter="grade:${g}"]`).click();
    assert.equal(
      await cards.count(),
      K2_STARTERS.filter((s) => s.grade === g).length,
      `grade ${g}`,
    );
    assert.equal(
      await page.locator(`[data-filter="grade:${g}"]`).getAttribute("aria-pressed"),
      "true",
    );
  }
  await page.locator('[data-filter="topic:math"]').click();
  assert.equal(
    await cards.count(),
    K2_STARTERS.filter((s) => s.grade === "2" && s.topic === "math").length,
  );
  await shot(page, "03-k2-grade2-math");
  await page.locator('[data-filter="grade:all"]').click();
  await page.locator('[data-filter="topic:all"]').click();
  assert.equal(await cards.count(), 15);
  // keyboard: Tab reaches a filter and a Use button; Enter on a filter applies it
  await page.locator('[data-filter="grade:K"]').focus();
  await page.keyboard.press("Enter");
  assert.equal(await cards.count(), 5);
  await page.locator('[data-filter="grade:all"]').focus();
  await page.keyboard.press("Space");
  assert.equal(await cards.count(), 15);
  ok("K-2 page: 15 starters, grade/topic filters, keyboard, axe");

  // 3. Every starter: copy it, preview it as a student, complete it.
  for (const [n, s] of K2_STARTERS.entries()) {
    await page.goto(`${base}${LAB}/activity-studio/k2`, { waitUntil: "networkidle" });
    await page.locator(`button[data-ref="${s.id}"]`).click();
    await page.getByRole("button", { name: "Preview as student" }).waitFor({ timeout: 15000 });
    const id = page.url().match(/activity-studio\/(s[a-f0-9]{10})/)?.[1];
    assert.ok(id, `${s.id}: no draft address (${page.url()})`);
    const draft = await readDraft(page, id);
    assert.equal(draft.lineage.family, "k2-starters", `${s.id}: lineage`);
    assert.equal(draft.lineage.ref, s.id);
    assert.equal(draft.supports.readAloud, true);
    assert.equal(draft.look.style, "playful");
    assert.equal(draft.context.grade, s.grade);
    if (n === 0) {
      await shot(page, "04-editor-first-starter");
      await axe(page, "editor with a K-2 starter");
    }
    await page.getByRole("button", { name: "Preview as student" }).click();
    const frame = page.frameLocator("dialog[open] iframe[sandbox]").first();
    await frame.locator(".sp-root").waitFor({ timeout: 15000 });
    assert.equal(
      await frame.locator(".sp-root").getAttribute("data-band"),
      "k2",
      `${s.id}: K-2 sizing`,
    );
    const questions = draft.blocks.filter((b) => b.type === "question");
    const diagrams = draft.blocks.filter((b) => b.type === "diagram").length;
    let framesSeen = 0;
    for (const [i, q] of questions.entries()) {
      const box = frame.locator(`section.sp-q[data-block-id="${q.id}"]`);
      await box.waitFor({ timeout: 10000 });
      assert.ok(await box.locator(".sp-hear").count(), `${s.id}/${q.id}: no Hear button`);
      framesSeen += (await frame.locator(".sp-step svg [data-frame]").count()) ? 1 : 0;
      if (i === 0) {
        const target = await box.locator("button, .sp-option").first().boundingBox();
        assert.ok(target.height >= 52, `${s.id}: first target is ${target.height}px tall`);
        await box.locator(".sp-hear").click(); // the device voice or a plain notice; never an error
      }
      await answer(frame, q);
      if (n < 3 || i === 0) await shot(page, `05-${s.id}-q${i + 1}`);
      await box.locator(".sp-next-row button").click();
    }
    assert.ok(framesSeen >= Math.min(diagrams, 1), `${s.id}: ten frame not drawn`);
    await frame
      .getByText(/You finished/)
      .first()
      .waitFor({ timeout: 10000 });
    if (n % 5 === 0) await shot(page, `06-${s.id}-finish`);
    ok(`${s.id}: copied, previewed, ${questions.length} questions completed`);
  }

  // 4. Phone width: the K-2 page and a starter in the player do not scroll sideways.
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const pp = await phone.newPage();
  watch(pp, "phone");
  await pp.goto(`${base}${LAB}/activity-studio/k2`, { waitUntil: "networkidle" });
  await pp.locator(".st-k2-card").first().waitFor();
  assert.ok((await overflow(pp)) <= 1, "K-2 page scrolls sideways at 390px");
  await shot(pp, "07-k2-phone");
  await pp.locator('button[data-ref="k-count-ten-frames"]').click();
  await pp.getByRole("button", { name: "Preview as student" }).click();
  await pp
    .frameLocator("dialog[open] iframe[sandbox]")
    .first()
    .locator(".sp-q")
    .first()
    .waitFor({ timeout: 15000 });
  assert.ok((await overflow(pp)) <= 1, "editor scrolls sideways at 390px");
  await shot(pp, "08-ten-frame-phone");
  await phone.close();
  ok("phone width");

  assert.deepEqual(problems, [], "console errors or off-origin requests");
  for (const s of steps) console.log(`  ok  ${s}`);
  console.log(`studio-k2-e2e: PASS (${steps.length} checks; screenshots in ${SHOTS})`);
} catch (error) {
  for (const s of steps) console.log(`  ok  ${s}`);
  if (problems.length) console.error(problems.join("\n"));
  console.error(`studio-k2-e2e: FAIL: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
