#!/usr/bin/env node
/**
 * Studio X wave 2, W4, in a real browser (`/activity-studio`): create a worksheet, then mount the two new side panels
 * into the real editor's side panel (the shell is not wired to them yet, so they are imported dynamically).
 *   Compare panel: "Make versions" lays out version cards; previews load lazily as a card scrolls into view and run in
 *   a sandboxed frame; Open saves the version as its OWN draft (new id, lineage -> parent), the parent is untouched,
 *   and the saved draft opens in the editor; "Another version" shows its seed and the not-equivalent note; no page
 *   overflow at 375px.
 *   Language panel: one-click add, the block appears in the activity with its marker, Undo restores it exactly,
 *   unavailable supports say why.
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import assert from "node:assert/strict";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("studio-x-compare-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}

const LAB = "/access-practice-lab";
const KEY = "accessPracticeLab:v1:studio";
const { server, base } = await serveAccess();
const browser = await chromium.launch().catch((error) => {
  console.warn(`studio-x-compare-e2e: SKIP — no browser (${error.message.split("\n")[0]}).`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
});

const problems = [];
const watch = (page) => {
  page.on("pageerror", (e) => {
    if (!/web-vitals/.test(e.message)) problems.push(`script error: ${e.message.slice(0, 200)}`);
  });
  page.on("console", (m) => {
    if (m.type() === "error" && !/status of 404|Failed to load resource/.test(m.text()))
      problems.push(`console error: ${m.text().slice(0, 200)}`);
  });
  page.on("request", (r) => {
    if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:"))
      problems.push(`left the origin: ${r.url().slice(0, 100)}`);
    if (r.method() !== "GET" && !/\/api\/studio\/(ai|docx)/.test(r.url()))
      problems.push(`${r.method()} ${r.url().slice(0, 100)}`);
  });
};

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  watch(page);

  // 1. A real worksheet, made the way a teacher makes one.
  await page.goto(`${base}${LAB}/activity-studio`, { waitUntil: "networkidle" });
  await page
    .locator(".st-kind", { hasText: /worksheet/i })
    .first()
    .click();
  await page.getByLabel("Grade", { exact: true }).selectOption({ label: "Grade 6" });
  await page.getByLabel("Subject", { exact: true }).selectOption({ label: "Mathematics" });
  await page.getByRole("tab", { name: "Describe My Idea" }).click();
  await page.locator("textarea").first().fill("Practice with equivalent ratios and unit rates");
  await page.getByRole("button", { name: "Create My Activity" }).click();
  await page.getByRole("button", { name: "Preview as student" }).waitFor({ timeout: 15000 });
  await page.waitForFunction(
    (k) => Object.keys(JSON.parse(localStorage.getItem(k) || "{}")).length > 0,
    KEY,
    { timeout: 10000 },
  );
  const parentId = await page.evaluate(
    (k) => Object.keys(JSON.parse(localStorage.getItem(k)))[0],
    KEY,
  );
  const parentJson = await page.evaluate(
    (k) => JSON.stringify(JSON.parse(localStorage.getItem(k))),
    KEY,
  );

  // 2. Mount the compare panel in the editor's side panel, with a store on the saved draft.
  await page.evaluate(
    async ([key, id]) => {
      const { createStore } = await import("/access-practice-lab/src/studio/editor/store.js");
      const { createComparePanel } = await import(
        "/access-practice-lab/src/studio/editor/compare-panel.js"
      );
      const activity = JSON.parse(localStorage.getItem(key))[id].activity;
      const store = createStore(activity);
      const panel = createComparePanel(store, {
        S: (en) => en,
        lang: "en",
        onOpen: (draft) => {
          window.__opened = draft;
        },
      });
      window.__store = store;
      document.querySelector(".st-side-panel").replaceChildren(panel.el);
      panel.render();
    },
    [KEY, parentId],
  );
  const panel = page.locator(".st-cmp");
  await panel.getByRole("button", { name: "Make versions" }).click();
  const cards = page.locator(".st-cmp-card");
  await cards.first().waitFor();
  const n = await cards.count();
  assert.ok(n >= 5, `standard + four tiers (+ shorter): ${n}`);
  for (const name of [
    "More language support",
    "Some language support",
    "Greater independence",
    "Enrichment",
  ])
    assert.ok(await page.locator(".st-cmp-card h3", { hasText: name }).count(), `${name} card`);
  const emerging = page.locator('[data-card="emerging"]');
  assert.match(await emerging.innerText(), /What changed[\s\S]*What stayed the same/);
  assert.match(await emerging.innerText(), /original questions are still there/);

  // 3. Previews are lazy and sandboxed: not every card has a frame until it scrolls into view.
  await page.waitForFunction(
    () => document.querySelectorAll(".st-cmp-card iframe").length >= 1,
    null,
    { timeout: 15000 },
  );
  const early = await page.locator(".st-cmp-card iframe").count();
  assert.ok(early < n, `lazy: ${early} of ${n} previews loaded before scrolling`);
  await page.locator(".st-cmp-grid").evaluate((el) => el.scrollTo({ left: el.scrollWidth }));
  await page.waitForFunction(
    (total) => document.querySelectorAll(".st-cmp-card iframe").length > total,
    early,
    { timeout: 15000 },
  );
  const sandbox = await page.locator(".st-cmp-card iframe").first().getAttribute("sandbox");
  assert.match(sandbox, /allow-scripts/);
  assert.ok(!/allow-same-origin/.test(sandbox), "sandboxed from this site");
  const frame = page.frameLocator(".st-cmp-card iframe").first();
  await frame.locator("body").waitFor({ timeout: 15000 });
  assert.ok(
    (await frame.locator("body").innerText()).trim().length > 20,
    "the real student page rendered in the card",
  );
  assert.equal(
    await page.locator(".st-cmp-grid").getAttribute("tabindex"),
    "0",
    "scrollable by keyboard",
  );

  // 4. Open saves the version as its OWN draft; the parent is untouched.
  const shorter = page.locator('[data-card="shorter"]');
  if (await shorter.count())
    assert.ok(
      await shorter.locator('[role="alert"]').count(),
      "the rigor warning is shown on the shortened version",
    );
  await page.locator('[data-card="emerging"] button[data-act="open"]').click();
  const draftId = await page.evaluate(() => window.__opened);
  assert.match(draftId, /^s[a-f0-9]{10}$/);
  assert.notEqual(draftId, parentId);
  const drafts = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
  assert.equal(drafts[draftId].activity.lineage.variantOf, parentId, "lineage records the parent");
  assert.equal(drafts[draftId].activity.lineage.tier, "emerging");
  assert.equal(
    JSON.stringify(drafts[parentId]),
    JSON.stringify(JSON.parse(parentJson)[parentId]),
    "the parent draft is byte-identical",
  );

  // 5. Another version: seed shown, not claimed equivalent.
  await page.locator('.st-cmp input[type="number"]').fill("7");
  await page.locator('.st-cmp button[data-act="variant"]').click();
  const variant = page.locator(".st-cmp-card", { hasText: "Seed 7" });
  await variant.waitFor();
  assert.match(await variant.innerText(), /Not claimed equivalent/);

  // 6. Phone width: the panel scrolls inside itself; the page does not.
  await page.setViewportSize({ width: 375, height: 800 });
  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  assert.ok(over <= 1, `no horizontal page scroll at 375px (over by ${over})`);
  await page.setViewportSize({ width: 1280, height: 900 });

  // 7. The saved version opens in the real editor, and it is a different draft from the parent.
  await page.goto(`${base}${LAB}/activity-studio/${draftId}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Preview as student" }).waitFor({ timeout: 15000 });
  assert.match(await page.locator(".st-title").innerText(), /\(Emerging\)/);

  // 8. Language panel on the parent: one click adds, Undo restores exactly.
  await page.goto(`${base}${LAB}/activity-studio/${parentId}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Preview as student" }).waitFor({ timeout: 15000 });
  await page.evaluate(
    async ([key, id]) => {
      const { createStore } = await import("/access-practice-lab/src/studio/editor/store.js");
      const { createLanguagePanel } = await import(
        "/access-practice-lab/src/studio/editor/language-panel.js"
      );
      const store = createStore(JSON.parse(localStorage.getItem(key))[id].activity);
      window.__lang = store;
      window.__langBefore = JSON.stringify(store.get().blocks);
      const panel = createLanguagePanel(store, { S: (en) => en });
      document.querySelector(".st-side-panel").replaceChildren(panel.el);
      panel.render();
    },
    [KEY, parentId],
  );
  const lang = page.locator(".st-lang");
  await lang.waitFor();
  const rows = await lang.locator("li[data-option]").count();
  assert.equal(rows, 12, "all twelve supports are listed");
  const unavailable = lang.locator('li[data-available="false"]');
  assert.ok((await unavailable.count()) > 0, "some supports are unavailable for this activity");
  assert.match(await unavailable.first().innerText(), /Not available: /);
  await lang.locator('button[data-option="sentence-frames"]').click();
  const added = await page.evaluate(() => window.__lang.get().blocks.map((b) => b.id));
  assert.ok(added.includes("ls-sentence-frames"), "added by one click");
  assert.ok(
    await page.evaluate(() => window.__lang.get().lineage.added.includes("ls-sentence-frames")),
    "marked as added",
  );
  assert.match(await lang.locator(".st-lang-result").innerText(), /Please review/);
  assert.match(
    await page.evaluate(() => document.activeElement?.className || ""),
    /st-lang-result/,
    "focus moved to the result",
  );
  await lang.locator('button[data-act="lang-undo"]').click();
  assert.equal(
    await page.evaluate(() => JSON.stringify(window.__lang.get().blocks)),
    await page.evaluate(() => window.__langBefore),
    "Undo restores the activity exactly",
  );
  await lang.locator('button[data-option="oral-rehearsal"]').waitFor();

  await context.close();
  assert.deepEqual(problems, [], problems.join("\n"));
  console.log(
    `studio-x-compare-e2e: PASS — ${n} version cards, lazy sandboxed previews (${early}/${n} before scroll), Open saves its own draft, variant seed, phone width, language panel add/undo`,
  );
} catch (error) {
  console.error(`studio-x-compare-e2e: FAIL — ${error.message}`);
  if (problems.length) console.error(problems.join("\n"));
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
