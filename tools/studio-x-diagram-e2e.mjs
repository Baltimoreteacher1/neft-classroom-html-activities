#!/usr/bin/env node
/**
 * Studio X W1, the diagram block in a real browser:
 *  - student player: the figure is drawn and fits at 1280 and 375px, the "data table" disclosure opens with the
 *    keyboard, Spanish works, axe finds nothing, no console errors, nothing leaves the origin;
 *  - editor: typing values redraws the figure, a bad value shows a plain-word note instead of a figure, add/remove
 *    rows keep focus, axe finds nothing, no horizontal scroll at 375px;
 *  - print: the figure is no wider than the text column and stays on the same page as its question (swept over
 *    page-break positions, read back from a real PDF with pdftotext).
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
  console.warn("studio-x-diagram-e2e: SKIP — playwright or axe is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}

const LAB = "/access-practice-lab";
const { server, base } = await serveAccess();
const browser = await chromium.launch().catch((error) => {
  console.warn(`studio-x-diagram-e2e: SKIP — no browser (${error.message.split("\n")[0]}).`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
});

const bar = {
  kind: "bar",
  title: "Pets in Room 12",
  unit: "students",
  categories: [
    { label: "Dogs", value: 8 },
    { label: "Cats", value: 5 },
    { label: "Fish", value: 3 },
  ],
};
const timeline = {
  kind: "timeline",
  events: [
    { year: 1776, label: "Declaration signed" },
    { year: 1803, label: "Louisiana Purchase" },
    { year: 1865, label: "War ends" },
  ],
};
const question = (n) => ({
  id: `q${n}`,
  type: "question",
  format: "choice",
  prompt: `Which pet has the most students? (${n})`,
  options: [
    { id: "a", text: "Dogs" },
    { id: "b", text: "Cats" },
  ],
  answer: "a",
});
const act = (blocks, extra = {}) =>
  normalizeActivity({ id: "e2e1", title: "Diagrams", kind: "worksheet", blocks, ...extra });

const problems = [];
const watch = (page) => {
  page.on("pageerror", (e) => {
    // web-vitals is a Vite build-time import; the source tree served here cannot resolve it (same as studio-x-e2e).
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
const harness = async (page, body) => {
  await page.route(`${base}/__harness`, (route) =>
    route.fulfill({ contentType: "text/html", body }),
  );
  await page.goto(`${base}/__harness`, { waitUntil: "load" });
};

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  watch(page);

  // ── student player ─────────────────────────────────────────────────────────
  const activity = act(
    [
      { id: "d1", type: "diagram", spec: bar },
      { id: "d2", type: "diagram", spec: timeline },
      question(1),
    ],
    { supports: { spanish: true } },
  );
  await harness(
    page,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Player</title><link rel="stylesheet" href="${LAB}/player/studio-player.css"></head><body><main id="app"></main>
<script src="${LAB}/player/studio-player.js"></script>
<script>window.mount=(lang)=>StudioPlayer.mountPlayer(document.getElementById("app"),${JSON.stringify(activity)},{lang});mount("en");</script></body></html>`,
  );
  await page.locator(".sp-diagram svg").first().waitFor();
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [i, svg] of (await page.locator(".sp-diagram svg").all()).entries()) {
      const box = await svg.boundingBox();
      assert.ok(box && box.width > 150 && box.height > 40, `figure ${i} is visible at ${width}px`);
      assert.ok(box.x >= -1 && box.x + box.width <= width + 1, `figure ${i} fits ${width}px`);
    }
    assert.ok((await overflow(page)) <= 1, `no horizontal scroll at ${width}px`);
  }
  const summary = page.locator(".sp-diagram-data summary").first();
  await summary.focus();
  assert.ok(
    await summary.evaluate((el) => el === document.activeElement),
    "the disclosure takes focus",
  );
  assert.ok((await summary.boundingBox()).height >= 44, "44px target");
  await page.keyboard.press("Enter");
  await page.locator(".sp-diagram-data[open] table td").first().waitFor();
  const cells = await page.locator(".sp-diagram-data[open]").first().locator("td").allInnerTexts();
  assert.deepEqual(cells, ["Dogs", "8", "Cats", "5", "Fish", "3"]);
  assert.deepEqual(await axe(page, ".sp-root"), [], "axe: player");
  await page.evaluate(() => window.mount("es"));
  await page.locator(".sp-diagram svg title").first().waitFor({ state: "attached" });
  assert.match(
    await page.locator(".sp-diagram svg title").first().textContent(),
    /Gráfica de barras/,
  );
  assert.match(
    await page.locator(".sp-diagram-data summary").first().innerText(),
    /tabla de datos/,
  );

  // ── editor ─────────────────────────────────────────────────────────────────
  // The editor is mounted into the real app page, so it gets the site's own stylesheets (box model, tokens).
  await page.goto(`${base}${LAB}/activity-studio`, { waitUntil: "networkidle" });
  await page.evaluate(async (lab) => {
    const { createStore } = await import(`${lab}/src/studio/editor/store.js`);
    const { normalizeActivity } = await import(`${lab}/src/studio/core/schema.js`);
    const { blankDiagramFields, diagramBlockEditor } = await import(
      `${lab}/src/studio/editor/diagram-editor.js`
    );
    const store = createStore(
      normalizeActivity({
        id: "ed1",
        title: "T",
        kind: "worksheet",
        blocks: [{ id: "d1", type: "diagram", ...blankDiagramFields("bar") }],
      }),
    );
    window.store = store;
    document.body.replaceChildren();
    const host = document.createElement("main");
    host.id = "host";
    host.className = "st-root";
    host.append(diagramBlockEditor(store.get().blocks[0], { store, S: (en) => en }));
    document.body.append(host);
    window.ready = true;
  }, LAB);
  await page.waitForFunction(() => window.ready);
  const note = page.locator("p.st-warn");
  assert.ok(await note.isVisible(), "a blank figure explains what is missing in words");
  assert.match(await note.innerText(), /^Title is empty|^The title is empty|Row 1/);
  assert.equal(
    await page.locator(".st-diagram-editor svg").count(),
    0,
    "no figure while values are missing",
  );
  await page.getByLabel("Title", { exact: true }).fill("Pets");
  const rows = [
    ["Dogs", "8"],
    ["Cats", "5"],
    ["Fish", "3"],
  ];
  for (const [i, [label, value]] of rows.entries()) {
    await page.getByLabel(`Row ${i + 1}: Category`).fill(label);
    await page.getByLabel(`Row ${i + 1}: Value`).fill(value);
  }
  await page.locator(".st-diagram-editor svg").waitFor();
  assert.ok(await note.isHidden(), "the note goes away once the figure can be drawn");
  const lengths = async () =>
    page
      .locator(".st-diagram-editor rect[data-value]")
      .evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-length"))));
  const before = await lengths();
  assert.equal(before.length, 3);
  assert.ok(before[0] > before[1] && before[1] > before[2], "bars follow 8 > 5 > 3");
  await page.getByLabel("Row 3: Value").fill("20");
  const after = await lengths();
  assert.ok(after[2] > after[0], "changing a value redraws the bar");
  assert.equal(
    await page.evaluate(() => window.store.get().blocks[0].spec.categories[2].value),
    20,
    "the store holds the number, not a picture",
  );
  await page.getByRole("button", { name: "Add a row" }).click();
  assert.ok(
    await page.evaluate(
      () => document.activeElement?.getAttribute("aria-label") === "Row 4: Category",
    ),
    "focus lands in the new row",
  );
  await page.getByRole("button", { name: "Remove Row 4" }).click();
  assert.equal(await page.locator("tbody tr").count(), 3);
  await page.getByLabel("Kind of figure").selectOption("histogram");
  assert.ok(await page.getByLabel("Values", { exact: true }).isVisible());
  await page.getByLabel("Values", { exact: true }).fill("1 2 2 3 3 3 4 4 5 9");
  await page.locator(".st-diagram-editor rect[data-bin]").first().waitFor();
  assert.deepEqual(await axe(page, "#host"), [], "axe: editor");
  await page.setViewportSize({ width: 375, height: 800 });
  assert.ok((await overflow(page)) <= 1, "editor: no horizontal scroll at 375px");

  // ── print ──────────────────────────────────────────────────────────────────
  const dir = mkdtempSync(join(tmpdir(), "diagram-e2e-"));
  const filler = (n) =>
    Array.from({ length: n }, (_, i) => ({
      id: `t${i}`,
      type: "text",
      role: "body",
      text: `Filler paragraph number ${i + 1}. The quick brown fox jumps over the lazy dog.`,
    }));
  const printed = async (n, name) => {
    const html = renderWorksheetHtml(
      act([...filler(n), { id: "d1", type: "diagram", spec: bar }, question(1)]),
      { part: "student", lang: "en" },
    );
    await page.setViewportSize({ width: 816, height: 1056 });
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });
    const fig = await page.locator("figure.diagram svg").boundingBox();
    assert.ok(
      fig.width <= 7 * 96 + 1 && fig.height <= 4 * 96 + 1,
      `figure size ${fig.width}x${fig.height}`,
    );
    const file = join(dir, `${name}.pdf`);
    await page.pdf({ path: file, format: "Letter", printBackground: true });
    const pages = Number(
      /Pages:\s+(\d+)/.exec(spawnSync("pdfinfo", [file], { encoding: "utf8" }).stdout)?.[1],
    );
    const where = (needle) => {
      for (let p = 1; p <= pages; p++)
        if (
          spawnSync("pdftotext", ["-f", String(p), "-l", String(p), file, "-"], {
            encoding: "utf8",
          }).stdout.includes(needle)
        )
          return p;
      return 0;
    };
    return {
      caption: where("Pets in Room 12"),
      question: where("Which pet has the most students"),
      pages,
    };
  };
  let movedToNextPage = 0;
  for (let n = 6; n <= 30; n += 2) {
    const r = await printed(n, `s${n}`);
    assert.ok(r.caption > 0 && r.question > 0, `n=${n}: figure and question are in the PDF`);
    assert.equal(
      r.caption,
      r.question,
      `n=${n}: the figure shares a page with its question (${JSON.stringify(r)})`,
    );
    if (r.caption > 1) movedToNextPage++;
  }
  assert.ok(movedToNextPage > 0, "the sweep reached a page break (otherwise it proved nothing)");

  await context.close();
  assert.deepEqual(problems, [], problems.join("\n"));
  console.log(
    `studio-x-diagram-e2e: PASS — player (1280/375, keyboard table, es, axe), editor (live redraw, plain-word note, focus, axe, 375), print (size, kept with question over ${movedToNextPage} page-break cases)`,
  );
} catch (error) {
  console.error(`studio-x-diagram-e2e: FAIL — ${error.message}`);
  if (problems.length) console.error(problems.join("\n"));
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
