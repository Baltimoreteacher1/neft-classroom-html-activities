#!/usr/bin/env node
/**
 * Studio X components + missions, driven the way a teacher drives them, in a real browser. The UI is mounted in the
 * real lab page (dynamic import through page.evaluate) at 1280px and 375px:
 *   the recommended list is short and starts with the obvious next step -> its preview is a real student player,
 *   built only when opened -> ONE click adds it and Undo takes it back -> the keyboard alone (Tab, Enter) adds one
 *   -> the activity still validates -> "See all" lists everything, including what the engine cannot do and why ->
 *   "Build a mission" opens the 3-step dialog, builds a mission from the activity's own content, previews it in
 *   the real player, and "Use this mission" is one undoable step that validates.
 * Also: no script error, nothing leaves the origin, no horizontal overflow, 44px targets on the add buttons.
 * Serves the source tree. A missing browser is a SKIP locally and a FAIL in CI.
 */
import assert from "node:assert/strict";
import { allFormats } from "../access-practice-lab/src/studio/core/fixtures.js";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("studio-x-components-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}

const LAB = "/access-practice-lab";
const SRC = `${LAB}/src/studio`;
const { server, base } = await serveAccess();
const browser = await chromium.launch().catch((error) => {
  console.warn(`studio-x-components-e2e: SKIP — no browser (${error.message.split("\n")[0]}).`);
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
    if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:"))
      problems.push(`${label}: left the origin: ${r.url().slice(0, 100)}`);
    if (r.method() !== "GET" && !/\/api\/studio\/ai/.test(r.url()))
      problems.push(`${label}: ${r.method()} ${r.url().slice(0, 100)}`);
  });
};
const overflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** A real activity: vocabulary with meanings, a passage, and the fixture's questions (one of each format). */
const source = () => {
  const a = allFormats();
  a.title = "Plant parts";
  a.context.subject = "Science";
  a.context.objective = "Name the parts of a plant.";
  a.blocks.unshift({
    id: "vocab-e2e",
    type: "vocab",
    items: [
      { id: "w1", term: "root", def: "the part of a plant that takes in water" },
      { id: "w2", term: "stem", def: "the part that holds the plant up" },
      { id: "w3", term: "leaf", def: "the part that makes food from sunlight" },
    ],
  });
  // keep it small: vocabulary, the passage and four questions
  a.blocks = a.blocks.filter(
    (b) =>
      b.id === "vocab-e2e" ||
      b.type === "passage" ||
      ["q-choice", "q-number", "q-short", "q-order"].includes(b.id),
  );
  return a;
};

async function mount(page, activity) {
  await page.evaluate(
    async ([root, activity]) => {
      const [{ createStore }, { createComponentBrowser }] = await Promise.all([
        import(`${root}/editor/store.js`),
        import(`${root}/editor/component-browser.js`),
      ]);
      document.getElementById("cb-host")?.remove();
      const host = document.createElement("div");
      host.id = "cb-host";
      host.className = "st-root";
      host.style.padding = "0 16px 64px";
      document.body.append(host);
      const store = createStore(activity);
      const S = (en) => en;
      const events = [];
      const browser = createComponentBrowser(store, {
        S,
        onInserted: (e) => events.push(e.component?.id || "mission"),
      });
      host.append(browser.el);
      browser.render();
      window.__cb = { store, browser, events };
    },
    [`${base}${SRC}`, activity],
  );
  await page.locator(".cb .cb-item").first().waitFor();
}

const ids = (page) => page.evaluate(() => window.__cb.store.get().blocks.map((b) => b.id));
const validity = (page) =>
  page.evaluate(async (root) => {
    const { validateActivity } = await import(`${root}/core/validate.js`);
    const r = validateActivity(window.__cb.store.get());
    return { ok: r.ok, errors: r.errors.map((e) => e.message) };
  }, `${base}${SRC}`);

async function scenario(page, width, report) {
  await page.setViewportSize({ width, height: width < 500 ? 800 : 900 });
  await page.goto(`${base}${LAB}/activity-studio`, { waitUntil: "networkidle" });
  await mount(page, source());

  // 1. A short, sensible list; the obvious next step is first.
  const recommended = page.locator('ul[aria-label="Recommended components"] > li.cb-item');
  const n = await recommended.count();
  assert.ok(n >= 1 && n <= 6, `${width}px: ${n} recommendations`);
  const availableCount = await page.evaluate(async (root) => {
    const { COMPONENTS } = await import(`${root}/x/components.js`);
    return COMPONENTS.filter((c) => c.available).length;
  }, `${base}${SRC}`);
  assert.ok(n < availableCount / 2, `a short list (${n}) against ${availableCount} components`);
  assert.match(await recommended.first().locator("h4").innerText(), /Match my vocabulary words/);
  report.recommended = n;

  // 2. Preview is lazy and real: nothing is built until opened.
  assert.equal(await page.locator(".cb iframe").count(), 0, "no preview frames until opened");
  await recommended.first().locator("summary").click();
  const frame = page.frameLocator(".cb iframe").first();
  await frame.locator(".sp-root").waitFor({ timeout: 15000 });
  assert.match(
    await frame.locator("body").innerText(),
    /habitat|predator|producer/i,
    "the real player shows the component's example",
  );
  assert.equal(await page.locator(".cb iframe").count(), 1, "only the opened item built a preview");
  const sandbox = await page.locator(".cb iframe").first().getAttribute("sandbox");
  assert.ok(!sandbox.includes("allow-same-origin"), "the preview cannot reach the site's storage");

  // 3. One click adds; Undo takes it back.
  const before = await ids(page);
  const addBtn = recommended.first().locator('[data-add="vocab-match"]');
  const box = await addBtn.boundingBox();
  assert.ok(box.height >= 44, `${width}px: the add button is a 44px target (${box.height})`);
  await addBtn.click();
  const after = await ids(page);
  assert.equal(after.length, before.length + 1, "one click added the matching question");
  assert.match(await page.locator(".cb-status").innerText(), /Added "Match my vocabulary words"/);
  assert.equal(await page.evaluate(() => window.__cb.store.get().blocks.at(-1).format), "match");
  const pairs = await page.evaluate(() =>
    window.__cb.store
      .get()
      .blocks.at(-1)
      .pairs.map((p) => p.left),
  );
  assert.deepEqual(pairs.sort(), ["leaf", "root", "stem"], "built from the teacher's own words");
  assert.deepEqual(
    (await validity(page)).errors.filter((e) => !/Question \d+: add a (hint|short)/.test(e)),
    [],
  );
  assert.equal(await page.evaluate(() => window.__cb.store.undo()), true);
  assert.deepEqual(await ids(page), before, "Undo restores the activity exactly");
  assert.equal(
    await page.evaluate(() => window.__cb.store.canUndo()),
    false,
    "adding was one undo step",
  );
  await page.waitForFunction(
    () => /Match my vocabulary words/.test(document.querySelector(".cb")?.innerText || ""),
    null,
    { timeout: 5000 },
  );

  // 4. Keyboard only: Tab to an add button, Enter adds it, and focus stays in the browser.
  await page.evaluate(() => document.querySelector(".cb-status").focus());
  let target = "";
  for (let i = 0; i < 12 && !target; i++) {
    await page.keyboard.press("Tab");
    target = await page.evaluate(() => document.activeElement?.dataset?.add || "");
  }
  assert.ok(target, "Tab reaches an Add button");
  const beforeKey = await ids(page);
  await page.keyboard.press("Enter");
  const afterKey = await ids(page);
  assert.ok(afterKey.length > beforeKey.length, `Enter added ${target} without a pointer`);
  const focused = await page.evaluate(() => {
    const a = document.activeElement;
    return {
      inside: Boolean(a?.closest(".cb")),
      tag: a?.tagName,
      cls: a?.className,
      text: (a?.textContent || "").slice(0, 40),
    };
  });
  assert.ok(
    focused.inside,
    `focus is still inside the component browser after adding: ${JSON.stringify(focused)}`,
  );
  const verdict = await validity(page);
  assert.equal(verdict.ok, true, `the activity still validates: ${verdict.errors.join("; ")}`);
  report.keyboardAdded = target;

  // 5. See all: everything, including what the engine cannot do and why.
  await page.locator("details.cb-all > summary").click();
  const allItems = await page.locator("details.cb-all li.cb-item").count();
  assert.ok(allItems >= availableCount, `See all lists every component (${allItems})`);
  for (const id of ["map", "simulation", "animation", "flip-cards", "branching"]) {
    const why = page.locator(`[data-unavailable="${id}"]`);
    assert.match(await why.innerText(), /Not available:/, `${id} says why it is not offered`);
  }
  assert.equal(
    await page.locator(".cb-off button.btn-primary").count(),
    0,
    "unavailable items have no Add button",
  );
  assert.ok(
    (await overflow(page)) <= 1,
    `${width}px: no horizontal scroll with the list open (${await overflow(page)})`,
  );

  // 6. A mission from the browser: pick, add topic/source, preview in the real player, use (undoable).
  await page.evaluate(() => window.__cb.store.replace(window.__cb.store.get(), "structure"));
  const preMission = await page.evaluate(() => JSON.stringify(window.__cb.store.get()));
  await page.locator('[data-act="missions"]').click();
  const dlg = page.locator("dialog.st-dialog");
  await dlg.waitFor();
  await dlg.locator('[data-step-heading="1"]').waitFor();
  await dlg.getByLabel(/Scientific investigation/).check();
  await dlg.getByRole("button", { name: "Next" }).click();
  await dlg.locator('[data-step-heading="2"]').waitFor();
  await dlg.getByRole("button", { name: "Preview my mission" }).click();
  assert.match(
    await dlg.locator("[data-error]").innerText(),
    /topic/i,
    "a topic is required, said plainly",
  );
  await dlg.getByLabel("Topic").fill("Plant parts");
  await dlg.getByLabel(/Objective/).fill("Name the parts of a plant and what each does.");
  await dlg.getByLabel("Use what is already in my activity").check();
  await dlg.getByRole("button", { name: "Preview my mission" }).click();
  await dlg.locator('[data-step-heading="3"]').waitFor();
  const mframe = dlg.frameLocator('iframe[title="Student view of your mission"]');
  await mframe.locator(".sp-root").waitFor({ timeout: 15000 });
  assert.match(
    await mframe.locator("body").innerText(),
    /1\. Mission briefing/,
    "the real player shows the first stage",
  );
  const stagesText = await dlg.locator('ul[aria-label="Stages"]').innerText();
  assert.match(stagesText, /Built: Mission briefing/);
  assert.match(
    stagesText,
    /Left out: See it/,
    "a stage with nothing to build it from is listed as left out",
  );
  assert.ok(
    (await overflow(page)) <= 1,
    `${width}px: no horizontal scroll in the mission dialog (${await overflow(page)})`,
  );
  await dlg.getByRole("button", { name: /Use this mission/ }).click();
  await dlg.waitFor({ state: "detached" });
  const mission = await page.evaluate(() => window.__cb.store.get());
  assert.equal(mission.kind, "interactive");
  assert.match(mission.title, /Scientific investigation: Plant parts/);
  assert.ok(
    mission.blocks.filter((b) => b.type === "text" && b.role === "heading").length >= 4,
    "stage headings are in the activity",
  );
  const mv = await validity(page);
  assert.equal(mv.ok, true, `the mission validates: ${mv.errors.join("; ")}`);
  assert.equal(await page.evaluate(() => window.__cb.store.undo()), true);
  assert.equal(
    await page.evaluate(() => JSON.stringify(window.__cb.store.get())),
    preMission,
    "Undo restores what was there before the mission",
  );
  report.missionBlocks = mission.blocks.length;
  assert.ok((await overflow(page)) <= 1, `${width}px: no horizontal scroll at the end`);
}

try {
  const report = {};
  for (const width of [1280, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    watch(page, `${width}px`);
    await scenario(page, width, report);
    await context.close();
  }
  assert.deepEqual(problems, [], problems.join("\n"));
  console.log(
    `studio-x-components-e2e: PASS — ${report.recommended} recommendations, preview lazy and sandboxed, one-click add + undo, keyboard add (${report.keyboardAdded}), see-all with reasons, mission built/previewed/used (${report.missionBlocks} blocks), at 1280 and 375px`,
  );
} catch (error) {
  console.error(`studio-x-components-e2e: FAIL — ${error.message}`);
  if (problems.length) console.error(problems.join("\n"));
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
