#!/usr/bin/env node
/**
 * Studio X W2, the animation block in a real browser:
 *  - student player at 1280 and 375px: nothing plays until Play is pressed; Play/Pause/Step/Replay work against a fake
 *    clock; a played animation stops at the last frame (no loop); keyboard-only operation; 44px targets and a visible
 *    focus ring; the steps list and data table open with the keyboard; Spanish; axe finds nothing; no console errors;
 *  - prefers-reduced-motion: never auto-plays, no Play/Pause buttons, no transition, stepping still works;
 *  - editor: choose a preset in words, type values, the preview IS the real player (controls work inside it), a bad
 *    value shows a plain-word note, add/remove rows keep focus, axe finds nothing, no horizontal scroll at 375px;
 *  - print: the filmstrip keeps every frame's caption on one page, read back from a real PDF with pdftotext.
 * Serves the source tree. A missing browser is a SKIP locally and a FAIL in CI.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { normalizeActivity } from "../access-practice-lab/src/studio/core/schema.js";
import { renderWorksheetHtml } from "../access-practice-lab/src/studio/print/worksheet.js";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
  ({ default: AxeBuilder } = await import("@axe-core/playwright"));
} catch {
  console.warn("studio-x-animation-e2e: SKIP — playwright or axe is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}

const LAB = "/access-practice-lab";
const { server, base } = await serveAccess();
const browser = await chromium.launch().catch((error) => {
  console.warn(`studio-x-animation-e2e: SKIP — no browser (${error.message.split("\n")[0]}).`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
});

const process4 = {
  stages: [
    { label: "Evaporation", text: "The sun heats water and it rises." },
    { label: "Condensation", text: "Vapor cools into clouds." },
    { label: "Precipitation", text: "Water falls as rain." },
    { label: "Collection", text: "Water gathers in lakes." },
  ],
};
const ratio = {
  a: { label: "cups of flour", value: 2 },
  b: { label: "cups of sugar", value: 3 },
  scales: [2, 3],
};
const question = {
  id: "q1",
  type: "question",
  format: "choice",
  prompt: "Which stage comes first?",
  options: [
    { id: "a", text: "Evaporation" },
    { id: "b", text: "Collection" },
  ],
  answer: "a",
};
const activity = normalizeActivity({
  id: "e2e1",
  title: "Animations",
  kind: "worksheet",
  supports: { spanish: true },
  blocks: [
    {
      id: "an1",
      type: "animation",
      preset: "process",
      params: process4,
      title: "The water cycle",
      explanation: { en: "Press Play to watch.", es: "Presione Reproducir." },
    },
    { id: "an2", type: "animation", preset: "ratio-change", params: ratio },
    question,
  ],
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
    const u = r.url();
    if (!u.startsWith(base) && !u.startsWith("data:") && !u.startsWith("blob:"))
      problems.push(`left the origin: ${u.slice(0, 100)}`);
  });
};
const overflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const axe = async (page, include) => {
  const r = await new AxeBuilder({ page })
    .include(include)
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  return r.violations.map((v) => `${v.id}: ${v.nodes[0].html.slice(0, 120)}`);
};
const PLAYER = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Player</title><link rel="stylesheet" href="${LAB}/player/studio-player.css"></head><body><main id="app"></main>
<script src="${LAB}/player/studio-player.js"></script>
<script>window.mount=(lang)=>StudioPlayer.mountPlayer(document.getElementById("app"),${JSON.stringify(activity)},{lang});mount("en");</script></body></html>`;
const harness = async (page, body) => {
  await page.route(`${base}/__harness`, (route) =>
    route.fulfill({ contentType: "text/html", body }),
  );
  await page.goto(`${base}/__harness`, { waitUntil: "load" });
};

/** Helpers over the first animation on the page (or inside a frame). */
const api = (scope) => {
  const root = scope.locator(".sp-anim").first();
  return {
    root,
    caption: () => root.locator(".sp-anim-caption").innerText(),
    count: () => root.locator(".sp-anim-count").innerText(),
    button: (name) => root.locator(".sp-anim-controls").getByRole("button", { name, exact: true }),
  };
};

try {
  // ── student player, normal motion ──────────────────────────────────────────
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  watch(page);
  await page.clock.install();
  await harness(page, PLAYER);
  const an = api(page);
  await an.root.locator("svg").waitFor();
  assert.match(await an.caption(), /Stage 1 of 4: Evaporation/);
  assert.equal(await an.count(), "Step 1 of 4");
  await page.clock.runFor(30000);
  assert.match(
    await an.caption(),
    /Stage 1 of 4/,
    "auto-play is OFF: 30 seconds later it has not moved",
  );
  assert.ok(await an.button("Play").isVisible());
  assert.ok(await an.button("Back").isDisabled(), "Back is disabled on the first frame");

  await an.button("Play").click();
  assert.ok(await an.button("Pause").isVisible(), "Play turns into Pause");
  await page.clock.runFor(3600);
  assert.match(await an.caption(), /Stage 2 of 4/, "one calm step after the fixed pace");
  await an.button("Pause").click();
  await page.clock.runFor(30000);
  assert.match(await an.caption(), /Stage 2 of 4/, "Pause holds the frame");
  await an.button("Play").click();
  await page.clock.runFor(3600 * 5);
  assert.match(await an.caption(), /Stage 4 of 4/, "it plays to the end");
  assert.ok(await an.button("Play").isVisible(), "and stops there: Play is offered again, no loop");
  await page.clock.runFor(60000);
  assert.match(await an.caption(), /Stage 4 of 4/, "it never loops");
  assert.ok(await an.button("Next").isDisabled());
  await an.button("Back").click();
  assert.match(await an.caption(), /Stage 3 of 4/);
  await an.button("Replay").click();
  assert.match(await an.caption(), /Stage 1 of 4/);
  assert.ok(await an.button("Pause").isVisible(), "Replay plays from the start");
  await an.button("Next").click();
  assert.ok(await an.button("Play").isVisible(), "stepping pauses");
  await page.clock.runFor(30000);
  assert.match(await an.caption(), /Stage 2 of 4/);
  const live = an.root.locator(".sp-anim-caption");
  assert.equal(await live.getAttribute("aria-live"), "polite");
  assert.equal(await live.getAttribute("role"), "status");

  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 900 });
    const box = await an.root.locator(".sp-anim-art").boundingBox();
    assert.ok(
      box.width > 200 && box.x >= -1 && box.x + box.width <= width + 1,
      `figure fits ${width}px`,
    );
    assert.ok((await overflow(page)) <= 1, `no horizontal scroll at ${width}px`);
    for (const name of ["Replay", "Back", "Next"]) {
      const b = await an.button(name).boundingBox();
      assert.ok(
        b.height >= 44 && b.width >= 44,
        `${name}: 44px target at ${width}px (${b.width}x${b.height})`,
      );
    }
    const play = await an.button("Play").boundingBox();
    assert.ok(play.height >= 44 && play.width >= 44, "Play: 44px target");
  }

  // keyboard only: Tab to Play, press Space, then Enter on Pause, Tab to Next and press Enter
  await an.button("Replay").click();
  await an.button("Pause").click();
  await page.evaluate(() => document.querySelector(".sp-anim-title").scrollIntoView());
  await page
    .locator(".sp-anim-title")
    .first()
    .evaluate((el) => {
      el.tabIndex = -1;
      el.focus();
    });
  const focusName = () => page.evaluate(() => document.activeElement?.textContent?.trim());
  let hops = 0;
  while ((await focusName()) !== "Play" && hops++ < 12) await page.keyboard.press("Tab");
  assert.equal(await focusName(), "Play", "Play is reachable with Tab");
  const ring = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement);
    return { w: Number.parseFloat(s.outlineWidth), style: s.outlineStyle };
  });
  assert.ok(ring.w >= 2 && ring.style !== "none", `visible focus ring (${JSON.stringify(ring)})`);
  await page.keyboard.press("Space");
  assert.equal(await focusName(), "Pause", "focus stays on the toggle");
  await page.clock.runFor(3600);
  const before = await an.caption();
  await page.keyboard.press("Enter");
  await page.clock.runFor(20000);
  assert.equal(await an.caption(), before, "Pause by keyboard holds the frame");
  await page.keyboard.press("Tab");
  assert.equal(await focusName(), "Next");
  await page.keyboard.press("Enter");
  assert.notEqual(await an.caption(), before, "Next by keyboard");
  // walk to the last frame by keyboard: the disabled Next must not strand focus
  for (let i = 0; i < 4; i++)
    if (await an.button("Next").isEnabled()) await page.keyboard.press("Enter");
  assert.match(await an.caption(), /Stage 4 of 4/);
  assert.notEqual(await focusName(), "", "focus has not fallen out of the controls");
  assert.ok(
    await page.evaluate(() => document.activeElement?.closest(".sp-anim-controls") !== null),
    "focus stays in the controls",
  );

  // the steps list and the data table
  const summary = an.root.locator("details.sp-anim-steps summary");
  await summary.focus();
  assert.ok((await summary.boundingBox()).height >= 44);
  await page.keyboard.press("Enter");
  assert.equal(await an.root.locator("details.sp-anim-steps li").count(), 4);
  assert.match(
    await an.root.locator("details.sp-anim-steps li").nth(2).innerText(),
    /Precipitation/,
  );
  const ratioSummary = page.locator(".sp-anim").nth(1).locator("details summary");
  await ratioSummary.focus();
  await page.keyboard.press("Enter");
  const cells = await page.locator(".sp-anim").nth(1).locator("tbody td").allInnerTexts();
  assert.deepEqual(cells.slice(0, 6), ["× 1", "2", "3", "× 2", "4", "6"]);
  assert.deepEqual(await axe(page, ".sp-root"), [], "axe: player");

  await page.evaluate(() => window.mount("es"));
  await an.root.locator("svg").waitFor();
  assert.match(await an.caption(), /Etapa 1 de 4/);
  assert.equal((await an.count()).trim(), "Paso 1 de 4");
  assert.ok(await an.button("Reproducir").isVisible());
  assert.deepEqual(await axe(page, ".sp-root"), [], "axe: player (es)");
  await context.close();

  // ── reduced motion ─────────────────────────────────────────────────────────
  const calm = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const cp = await calm.newPage();
  watch(cp);
  await cp.clock.install();
  await harness(cp, PLAYER);
  const ca = api(cp);
  await ca.root.locator("svg").waitFor();
  assert.ok(await ca.button("Play").isHidden(), "reduced motion: no Play button");
  assert.ok((await ca.button("Pause").count()) === 0 || (await ca.button("Pause").isHidden()));
  await cp.clock.runFor(60000);
  assert.match(await ca.caption(), /Stage 1 of 4/, "reduced motion: never auto-plays");
  await ca.button("Next").click();
  await cp.clock.runFor(60000);
  assert.match(await ca.caption(), /Stage 2 of 4/, "stepping works and nothing else moves");
  assert.equal(
    await ca.root.locator("svg").evaluate((el) => getComputedStyle(el).transitionDuration),
    "0s",
    "no transition",
  );
  await ca.button("Replay").click();
  await cp.clock.runFor(60000);
  assert.match(await ca.caption(), /Stage 1 of 4/, "Replay only goes back to the start");
  await ca.root.locator("details summary").focus();
  await cp.keyboard.press("Enter");
  assert.equal(await ca.root.locator("details li").count(), 4, "the non-motion list is there");
  assert.deepEqual(await axe(cp, ".sp-root"), [], "axe: reduced motion");
  await calm.close();

  // ── editor ─────────────────────────────────────────────────────────────────
  const ec = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const ep = await ec.newPage();
  watch(ep);
  await ep.goto(`${base}${LAB}/activity-studio`, { waitUntil: "networkidle" });
  await ep.evaluate(async (lab) => {
    const { createStore } = await import(`${lab}/src/studio/editor/store.js`);
    const { normalizeActivity: norm } = await import(`${lab}/src/studio/core/schema.js`);
    const { animationBlockEditor, blankAnimationFields } = await import(
      `${lab}/src/studio/editor/animation-editor.js`
    );
    const store = createStore(
      norm({
        id: "ed1",
        title: "T",
        kind: "worksheet",
        blocks: [{ id: "an1", type: "animation", ...blankAnimationFields("process") }],
      }),
    );
    window.store = store;
    document.body.replaceChildren();
    const host = document.createElement("main");
    host.id = "host";
    host.className = "st-root";
    host.append(animationBlockEditor(store.get().blocks[0], { store, S: (en) => en }));
    document.body.append(host);
    window.ready = true;
  }, LAB);
  await ep.waitForFunction(() => window.ready);
  const preview = ep.frameLocator("iframe").first();
  const pa = api(preview);
  await pa.root.locator("svg").waitFor({ timeout: 15000 });
  assert.match(await pa.caption(), /Stage 1 of 3: Step 1/, "the preview is the real player");
  await ep.getByLabel("Step 1: Step name").fill("Heat");
  await ep
    .getByLabel("Step 1: One line that explains it (optional)")
    .fill("The sun warms the water.");
  await ep.waitForFunction(
    () => window.store.get().blocks[0].params.stages[0].text === "The sun warms the water.",
  );
  await preview
    .locator(".sp-anim-caption", { hasText: "Stage 1 of 3: Heat. The sun warms the water." })
    .waitFor({ timeout: 15000 });
  await pa.button("Next").click();
  assert.match(await pa.caption(), /Stage 2 of 3/, "the player's own controls work in the preview");
  // a bad value: a plain-word note instead of a preview
  await ep.getByLabel("Step 2: Step name").fill("");
  const note = ep.locator("p.st-warn");
  await note.waitFor({ state: "visible", timeout: 5000 });
  assert.match(await note.innerText(), /Stage 2 needs a name/);
  await ep.getByLabel("Step 2: Step name").fill("Cool");
  await note.waitFor({ state: "hidden", timeout: 5000 });
  await ep.getByRole("button", { name: "Add a step" }).click();
  assert.equal(
    await ep.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Step 4: Step name",
    "focus lands in the new row",
  );
  await ep.getByRole("button", { name: "Remove Step 4" }).click();
  assert.equal(await ep.locator("tbody tr").count(), 3);
  // switch to the ratio preset and type numbers
  await ep.getByLabel("What does this animation explain?").selectOption("ratio-change");
  await ep.getByLabel("First quantity: name").fill("cups of flour");
  await ep.getByLabel("Second quantity: name").fill("cups of sugar");
  await ep.getByLabel("Multiplier 1: Multiply both by").fill("1/2");
  await ep.waitForFunction(() => window.store.get().blocks[0].params.scales[0] === "1/2");
  await preview
    .locator(".sp-anim-caption", { hasText: "cups of flour = 2" })
    .waitFor({ timeout: 15000 });
  await pa.button("Next").click();
  assert.match(
    await pa.caption(),
    /Multiply both quantities by 0\.5: cups of flour = 1 and cups of sugar = 1\.5/,
    "exact math in the preview",
  );
  await ep.getByLabel("First quantity: number").fill("-2");
  await note.waitFor({ state: "visible", timeout: 5000 });
  assert.match(await note.innerText(), /must be a number greater than 0/);
  await ep.getByLabel("First quantity: number").fill("2");
  assert.deepEqual(
    await ep.evaluate(() => Object.keys(window.store.get().blocks[0]).sort()),
    ["alt", "explanation", "id", "params", "preset", "title", "type"],
    "the store holds values, not markup",
  );
  assert.deepEqual(await axe(ep, "#host"), [], "axe: editor");
  await ep.setViewportSize({ width: 375, height: 800 });
  assert.ok((await overflow(ep)) <= 1, "editor: no horizontal scroll at 375px");
  await ec.close();

  // ── print ──────────────────────────────────────────────────────────────────
  const pc = await browser.newContext({ viewport: { width: 816, height: 1056 } });
  const pp = await pc.newPage();
  const dir = mkdtempSync(join(tmpdir(), "animation-e2e-"));
  const filler = (n) =>
    Array.from({ length: n }, (_, i) => ({
      id: `t${i}`,
      type: "text",
      role: "body",
      text: `Filler paragraph number ${i + 1}. The quick brown fox jumps over the lazy dog.`,
    }));
  const eight = {
    stages: Array.from({ length: 8 }, (_, i) => ({
      label: `Stage name ${i + 1}`,
      text: `What happens in stage ${i + 1} is explained here in one line.`,
    })),
  };
  const printed = async (n) => {
    const a = normalizeActivity({
      id: "p1",
      title: "Print",
      kind: "worksheet",
      blocks: [
        ...filler(n),
        { id: "an1", type: "animation", preset: "process", params: eight },
        { id: "an2", type: "animation", preset: "ratio-change", params: ratio },
        question,
      ],
    });
    await pp.setContent(renderWorksheetHtml(a, { part: "student", lang: "en" }), {
      waitUntil: "load",
    });
    await pp.emulateMedia({ media: "print" });
    for (const svg of await pp.locator("li.anim-frame svg").all()) {
      const b = await svg.boundingBox();
      assert.ok(
        b.width <= 7 * 96 + 1 && b.height <= 3 * 96 + 1,
        `frame figure size ${b.width}x${b.height}`,
      );
    }
    const file = join(dir, `s${n}.pdf`);
    await pp.pdf({ path: file, format: "Letter", printBackground: true });
    const pages = Number(
      /Pages:\s+(\d+)/.exec(spawnSync("pdfinfo", [file], { encoding: "utf8" }).stdout)?.[1],
    );
    const text = (p) =>
      spawnSync("pdftotext", ["-f", String(p), "-l", String(p), file, "-"], {
        encoding: "utf8",
      }).stdout.replace(/\s+/g, " ");
    const texts = Array.from({ length: pages }, (_, i) => text(i + 1));
    const where = (needle) => texts.findIndex((t) => t.includes(needle)) + 1;
    return { pages, where, texts };
  };
  let split = 0;
  let broke = 0;
  for (let n = 2; n <= 24; n += 2) {
    const { pages, where, texts } = await printed(n);
    assert.ok(pages <= 8, `n=${n}: ${pages} pages`);
    for (let i = 1; i <= 8; i++) {
      // "Stage i of 8" is only in the caption. The words "in stage i is" are in the caption AND drawn in
      // the figure of the same frame, so a frame that stays whole shows it twice on the page where its caption starts.
      const start = where(`Stage ${i} of 8:`);
      assert.ok(start > 0, `n=${n}: frame ${i} is in the PDF`);
      const phrase = `in stage ${i} is`;
      const times = texts[start - 1].split(phrase).length - 1;
      assert.ok(
        times >= 2,
        `n=${n}: frame ${i} stays whole: figure and caption share page ${start} (${times} of 2)`,
      );
      if (start > 1) broke++;
    }
    split += pages > 1 ? 1 : 0;
  }
  assert.ok(split > 0 && broke > 0, "the sweep reached page breaks (otherwise it proved nothing)");
  await pc.close();

  assert.deepEqual(problems, [], problems.join("\n"));
  console.log(
    `studio-x-animation-e2e: PASS — player (1280/375, Play/Pause/Step/Replay on a fake clock, off by default, stops at the end, keyboard, 44px, focus ring, es, axe), reduced motion (no Play, no transition, steps + list), editor (real-player preview, plain-word notes, focus, axe, 375), print (${broke} frames sat past page 1 and none was split)`,
  );
} catch (error) {
  console.error(`studio-x-animation-e2e: FAIL — ${error.message}`);
  if (problems.length) console.error(problems.join("\n"));
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
