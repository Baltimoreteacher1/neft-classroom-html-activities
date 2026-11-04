#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdir, readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { model } from "../curriculum/projects/studio/math.mjs";
import { getProject, PROJECTS, studioURL } from "../curriculum/projects/studio/projects.mjs";
import { answerText, oracle } from "./lib/project-studio-oracle.mjs";

const root = path.resolve(process.env.STUDIO_ROOT || ".");
let server;
let base = process.env.STUDIO_BASE_URL;
if (!base) {
  server = createServer(async (req, res) => {
    try {
      let pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      let file = path.resolve(root, "." + pathname);
      if (!file.startsWith(root + path.sep)) throw Error("Path");
      try {
        await stat(file);
      } catch {
        file = path.resolve(root, "public", "." + pathname);
        if (!file.startsWith(path.join(root, "public") + path.sep)) throw Error("Path");
      }
      if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
      const mime = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".woff2": "font/woff2",
        ".png": "image/png",
      };
      res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
      res.end(await readFile(file));
    } catch {
      res.statusCode = 404;
      res.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
}
const browser = await chromium.launch({ headless: true });
async function newPage(options = {}) {
  const context = await browser.newContext(options);
  return context.newPage();
}
const errors = [];
const failures = [];
let a11yScans = 0;
await mkdir("output/playwright/project-studio", { recursive: true });
async function audit(page, label, wcag22 = false) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", ...(wcag22 ? ["wcag22aa"] : [])])
    .analyze();
  a11yScans++;
  assert.deepEqual(
    result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    [],
    label,
  );
  if (!(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))) {
    console.log(
      await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll("body *")]
          .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
          .map((e) => [e.tagName, e.className, e.getBoundingClientRect().right])
          .slice(0, 15),
      })),
    );
    await page.screenshot({ path: "output/playwright/project-studio/overflow.png" });
    throw Error(`Overflow: ${label}`);
  }
}
async function stage(page, n) {
  await page.locator(`[data-stage="${n}"]`).first().click();
  const heading = await page.locator("#stage-heading").boundingBox();
  const rail = await page.locator(".journey").boundingBox();
  assert.ok(heading.y >= rail.y + rail.height - 1, "Focused heading is clear of sticky navigation");
}
async function checkAll(page, project, design) {
  await stage(page, 2);
  for (const q of model(project, design).checks) {
    await page.locator(`[data-answer="${q.id}"]`).fill(String(Number(q.answer.toFixed(2))));
    await page.locator(`[data-check="${q.id}"] button`).click();
    assert.match(await page.locator(`#feedback-${q.id}`).innerText(), /Matches this design/);
  }
  assert.match(await page.locator(".checkpoint-meter").innerText(), /6 of 6/);
}

// Feedback engine v2 + live models, one mission per family. Every number typed into a check comes from the
// independent exact-arithmetic oracle (tools/lib/project-studio-oracle.mjs), never from the engine under test.
const V2_FLOWS = [
  {
    id: "pre-unit-a",
    check: "groups",
    wrong: "6",
    message: /You entered 6\. 6 seating groups of 24 hold 144 of the 146 guests/,
    step: "a",
    expectKey: "a",
  },
  {
    id: "unit-2-a",
    check: "median",
    wrong: "8",
    message: /You entered 8\. That is the mean/,
    datum: 0,
  },
  { id: "unit-3-a", check: "scale-a", wrong: "9", message: /comes from adding 6 to 3/, step: "a" },
  {
    id: "unit-4-a",
    check: "tax",
    wrong: "2.4",
    message: /finds 4% of the ORIGINAL price/,
    step: "a",
    grid: true,
  },
  {
    id: "unit-6-a",
    check: "value",
    wrong: "34",
    message: /adds 2 instead of 2²/,
    step: "a",
    builder: true,
  },
  {
    id: "unit-5-a",
    check: "composite",
    wrong: "24",
    message: /counts only the main 6 m by 4 m floor/,
    step: "a",
  },
  {
    id: "unit-7-a",
    check: "opposite",
    wrong: "3",
    message: /only the distance from A to the x-axis/,
    step: "a",
  },
  {
    id: "unit-8-c",
    check: "multiplication",
    wrong: "441",
    message: /multiplies both sides by 7/,
    step: "a",
  },
  {
    id: "unit-9-b",
    check: "two",
    wrong: "24",
    message: /starting amount of 4 is still added/,
    step: "a",
  },
  {
    id: "unit-10-b",
    check: "surface",
    wrong: "52",
    message: /counts a top face\. This model is open at the top/,
    step: "a",
  },
  {
    id: "discovery",
    check: "target",
    wrong: "35",
    message: /extra tiles once in every group/,
    step: "a",
  },
  {
    id: "synthesis",
    check: "discount",
    wrong: "20",
    message: /That is the discount rate/,
    step: "a",
  },
];
const verdict = (page) => page.locator("#wb-models .wb-verdicts").first().innerText();
const pick = (page, key, value) => page.locator(`#wb-${key}`).selectOption(value);
const type = (page, key, value) => page.locator(`#wb-${key}`).fill(value);
const designValue = (page, key) => page.locator(`#design-${key}`).inputValue();
async function gridClick(page, holder, vx, vy, width) {
  const box = await page.locator(`${holder} svg`).boundingBox();
  const k = box.width / width;
  await page.mouse.click(box.x + vx * k, box.y + vy * k);
}
// Family-specific interactions in the Build stage. Each one ends with the design back at its defaults.
const EXTRAS = {
  async "unit-5-a"(page) {
    await pick(page, "A", "m2");
    await pick(page, "B", "m2");
    assert.match(
      await verdict(page),
      /Distance around the rectangular floor \(20\): you chose square meters[\s\S]*A perimeter is a distance around the edge/,
    );
    await pick(page, "B", "m");
    await pick(page, "C", "m2");
    assert.match(
      await verdict(page),
      /Space inside the storage box: you chose square meters[\s\S]*Square units count flat surface/,
    );
    await pick(page, "C", "m3");
    await pick(page, "D", "usd");
    assert.match(await verdict(page), /Every unit fits its quantity/);
  },
  async "unit-7-a"(page) {
    await type(page, "A", "4");
    await type(page, "B", "3");
    await type(page, "C", "6");
    assert.match(await verdict(page), /opposite sign, so A is on the other side of the y-axis/);
    await type(page, "A", "-4");
    assert.match(await verdict(page), /The plotted points match your plan/);
    await page.locator("#wb-plane").focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await designValue(page, "a"), "-3", "plane: arrow key moves A right");
    await page.keyboard.press("ArrowUp");
    assert.equal(await designValue(page, "b"), "4", "plane: arrow key moves A up");
    await page.locator("#wb-mover-B").check();
    await page.locator("#wb-plane").focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await designValue(page, "c"), "7", "plane: arrow key moves B right");
    await page.locator("#wb-mover-A").check();
    await gridClick(page, "#wb-plane", 180 - 2 * 16, 180 - 5 * 16, 360);
    assert.equal(await designValue(page, "a"), "-2", "plane: a click places A");
    assert.equal(await designValue(page, "b"), "5", "plane: a click places A");
    for (let i = 0; i < 4; i++) await page.locator('[data-wb="undo"]').click();
    assert.deepEqual(
      [await designValue(page, "a"), await designValue(page, "b"), await designValue(page, "c")],
      ["-4", "3", "6"],
      "plane moves undo",
    );
  },
  async "unit-8-c"(page) {
    await type(page, "A", "8");
    assert.match(
      await page.locator("#wb-models .wb-verdict").last().innerText(),
      /opens neither lock/,
    );
    await type(page, "A", "18/2");
    assert.match(
      await page.locator("#wb-models .wb-verdict").last().innerText(),
      /opens both locks/,
    );
    await type(page, "A", "9");
    assert.match(await page.locator("#wb-models").innerText(), /At the boundary value/);
    assert.match(
      await page.locator('#wb-models tr:has-text("Gate n >:")').innerText(),
      /not allowed by "greater than 9"/,
      "gate: greater than excludes the boundary",
    );
    assert.match(
      await page.locator('#wb-models tr:has-text("Gate n ≥:")').innerText(),
      /9 is allowed by "at least 9"/,
      "gate: at least includes the boundary",
    );
  },
  async "unit-9-b"(page) {
    await type(page, "A", "40");
    await type(page, "B", "52");
    await type(page, "C", "65");
    assert.match(await verdict(page), /by 12 from x = 3 to 4 but by 13 from 4 to 5/);
    await type(page, "C", "64");
    assert.match(await verdict(page), /follows the same rule/);
    await pick(page, "D", "y");
    await pick(page, "E", "x");
    assert.match(
      await page.locator("#wb-models .wb-verdicts").nth(1).innerText(),
      /calculated FROM lab hours/,
    );
    await pick(page, "D", "x");
    await pick(page, "E", "y");
    assert.match(
      await page.locator("#wb-models .wb-verdicts").nth(1).innerText(),
      /lab hours is independent/,
    );
    await page.locator("#wb-graph").focus();
    await page.keyboard.press("ArrowUp");
    assert.equal(await designValue(page, "b"), "5", "graph: arrow up raises the starting amount");
    await page.keyboard.press("ArrowRight");
    assert.equal(await designValue(page, "a"), "13", "graph: arrow right raises the rate");
    await gridClick(page, "#wb-graph", 44, 32 + 180 - 10 * 1.8, 360);
    assert.ok(
      Number(await designValue(page, "b")) >= 9 && Number(await designValue(page, "b")) <= 11,
      "graph: a click at x = 0 sets the start",
    );
    for (let i = 0; i < 3; i++) await page.locator('[data-wb="undo"]').click();
    assert.deepEqual(
      [await designValue(page, "a"), await designValue(page, "b")],
      ["12", "4"],
      "graph moves undo",
    );
  },
  async "unit-10-b"(page) {
    await type(page, "A", "3");
    await type(page, "B", "2");
    await type(page, "C", "4");
    await type(page, "D", "2");
    assert.match(await verdict(page), /base's other edge/);
    await type(page, "A", "4");
    await type(page, "C", "3");
    assert.match(await verdict(page), /five-face box with an open top/);
  },
  async discovery(page) {
    await type(page, "A", "5");
    await type(page, "B", "23");
    await type(page, "C", "20");
    assert.match(await verdict(page), /differ by 3/);
    await type(page, "C", "23");
    assert.match(await verdict(page), /the picture agrees/);
  },
  async synthesis(page) {
    await type(page, "A", "1");
    await type(page, "B", "4");
    assert.match(await verdict(page), /25% of the subtotal, but this discount is 20%/);
    await type(page, "B", "5");
    assert.match(await verdict(page), /in lowest terms/);
    await pick(page, "C", "m3");
    assert.match(
      await page.locator("#wb-models .wb-verdicts").last().innerText(),
      /cubic units count blocks/i,
    );
    await pick(page, "C", "m2");
    await pick(page, "D", "usd");
  },
};
async function v2Flow(flow) {
  const project = getProject(flow.id);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(`${flow.id}: ${e.message}`));
  await page.goto(base + studioURL(flow.id));
  await page.locator("#stage-heading").waitFor();
  const stored = () =>
    page.evaluate((id) => JSON.parse(localStorage.getItem(`ewl-project-studio:v1:${id}`)), flow.id);
  const field = flow.datum !== undefined ? "data" : flow.step;
  const stepButton =
    flow.datum !== undefined
      ? '[data-wb-datum="0"][data-dir="1"]'
      : `[data-wb-step="${flow.step}"][data-dir="1"]`;
  // Build: one design, many linked views
  await stage(page, 1);
  await page.locator("#wb-models svg, #wb-models table").first().waitFor();
  const before = await page.locator("#wb-models").innerHTML();
  const formBefore = await page.locator(`#design-${field}`).inputValue();
  await page.locator(stepButton).click();
  const changed = await page.locator(`#design-${field}`).inputValue();
  assert.notEqual(changed, formBefore, `${flow.id}: model control moves the form input`);
  assert.notEqual(
    await page.locator("#wb-models").innerHTML(),
    before,
    `${flow.id}: models redraw when a quantity changes`,
  );
  assert.notEqual(
    await page.locator("[data-model-canvas]").innerHTML(),
    "",
    "sidebar model stays linked",
  );
  // undo / redo
  await page.locator('[data-wb="undo"]').click();
  assert.equal(
    await page.locator(`#design-${field}`).inputValue(),
    formBefore,
    `${flow.id}: undo restores the design`,
  );
  assert.equal(
    await page.locator("#wb-models").innerHTML(),
    before,
    `${flow.id}: undo restores the model`,
  );
  await page.locator('[data-wb="redo"]').click();
  assert.equal(
    await page.locator(`#design-${field}`).inputValue(),
    changed,
    `${flow.id}: redo reapplies`,
  );
  await page.locator('[data-wb="undo"]').click();
  // keyboard path: a stepper button by keyboard; percent also has a keyboard slider
  await page.locator(stepButton).focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await page.locator(`#design-${field}`).inputValue(),
    changed,
    `${flow.id}: keyboard Enter operates the stepper`,
  );
  await page.locator('[data-wb="undo"]').click();
  if (flow.grid) {
    const grid = page.locator("#wb-grid");
    const start = Number(await grid.getAttribute("aria-valuenow"));
    await grid.focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      Number(await grid.getAttribute("aria-valuenow")),
      start + 1,
      "percent grid: arrow key adds one square",
    );
    await page.keyboard.press("PageDown");
    assert.equal(
      Number(await page.locator("#wb-grid").getAttribute("aria-valuenow")),
      start - 9,
      "percent grid: Page Down removes ten",
    );
    await page.locator('[data-wb="undo"]').click();
    await page.locator('[data-wb="undo"]').click();
    assert.equal(
      Number(await page.locator("#wb-grid").getAttribute("aria-valuenow")),
      start,
      "percent grid: undo returns to the start",
    );
  }
  // checkpoints: save, change, restore, refresh
  const saved = await page.locator(`#design-${field}`).inputValue();
  await page.locator("#cp-name").fill("Gate checkpoint");
  await page.locator("[data-wb-frame]").nth(1).click();
  assert.match(await page.locator("#cp-reason").inputValue(), /I changed ___ from/);
  await page.locator('[data-wb-form="checkpoint"] button[type=submit]').click();
  assert.match(await page.locator("#wb-checkpoints").innerText(), /Gate checkpoint/);
  await page.locator(stepButton).click();
  assert.notEqual(await page.locator(`#design-${field}`).inputValue(), saved);
  await page.locator("[data-wb-restore]").first().click();
  assert.equal(
    await page.locator(`#design-${field}`).inputValue(),
    saved,
    `${flow.id}: restore returns the saved design`,
  );
  await page.locator('[data-wb="undo"]').click();
  assert.notEqual(
    await page.locator(`#design-${field}`).inputValue(),
    saved,
    `${flow.id}: a restore can be undone`,
  );
  await page.locator('[data-wb="undo"]').click();
  await page.reload();
  await page.locator("#stage-heading").waitFor();
  await stage(page, 1);
  assert.match(
    await page.locator("#wb-checkpoints").innerText(),
    /Gate checkpoint/,
    `${flow.id}: checkpoint survives refresh`,
  );
  const save = await stored();
  assert.equal(save.version, 1, "save version is unchanged");
  assert.equal(save.checkpoints.length, 1);
  assert.ok(
    save.design && save.answers && save.instructionalEvidence && save.evidence,
    "existing save fields are intact",
  );
  if (EXTRAS[flow.id]) await EXTRAS[flow.id](page);
  if (flow.builder) {
    const [coefficient, constant] = ["coefficient", "constant"].map((id) =>
      oracle(project, project.defaults).find((o) => o.id === id),
    );
    await stage(page, 2);
    await page.locator(".wb-test-models summary").first().click();
    await page.locator("#wb-A").fill(answerText(coefficient.answer));
    await page.locator("#wb-B").fill(answerText(constant.answer.add(coefficient.answer)));
    assert.match(
      await page.locator(".wb-verdict").innerText(),
      /does not match the original at/,
      "builder: a wrong constant is flagged at specific inputs",
    );
    await page.locator("#wb-B").fill(answerText(constant.answer));
    assert.match(
      await page.locator(".wb-verdict").innerText(),
      /matches the original at all 3 test inputs/,
      "builder: the exact expansion is confirmed",
    );
    await stage(page, 1);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await audit(page, `${flow.id} build workbench 390px`, true);
  await page.screenshot({ path: `output/playwright/project-studio/workbench-${flow.id}-390.png` });
  await page.setViewportSize({ width: 1366, height: 900 });
  // Test: specific message for a wrong input, revision to the exact oracle answer, models reveal after a match
  await stage(page, 2);
  await page.locator(`[data-answer="${flow.check}"]`).fill(flow.wrong);
  await page.locator(`[data-check="${flow.check}"] button`).click();
  const text = await page.locator(`#feedback-${flow.check}`).innerText();
  assert.match(text, /^Not yet\./);
  assert.match(text, flow.message, `${flow.id}: wrong input is named specifically`);
  assert.doesNotMatch(
    text,
    new RegExp(
      `\\b${answerText(oracle(project, project.defaults).find((o) => o.id === flow.check).answer).replace(".", "\\.")}\\b(?! (?:groups?|%))`,
    ),
    `${flow.id}: message does not state the answer`,
  );
  await page.locator(`[data-answer="${flow.check}"]`).fill("not a number");
  await page.locator(`[data-check="${flow.check}"] button`).click();
  assert.match(
    await page.locator(`#feedback-${flow.check}`).innerText(),
    /not a number the Studio can read|numbers only/,
  );
  await page.locator(".wb-test-models summary").first().click();
  assert.match(
    await page.locator("#wb-models").textContent(),
    /\?/,
    `${flow.id}: unchecked values show as ?`,
  );
  for (const { id, answer } of oracle(project, project.defaults)) {
    await page.locator(`[data-answer="${id}"]`).fill(answerText(answer));
    await page.locator(`[data-check="${id}"] button`).click();
    assert.match(
      await page.locator(`#feedback-${id}`).innerText(),
      /Matches this design/,
      `${flow.id} ${id}: exact oracle answer ${answerText(answer)} is accepted`,
    );
  }
  assert.match(await page.locator(".checkpoint-meter").innerText(), /6 of 6/);
  assert.doesNotMatch(
    await page.locator("#wb-models").textContent(),
    /\?/,
    `${flow.id}: every model value appears once its check matches`,
  );
  assert.ok(
    (await page.locator("#wb-facts li").count()) >= 1,
    "confirmed facts appear after checks match",
  );
  assert.match(await page.locator("#workbench").innerText(), /Judged by your teacher/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await audit(page, `${flow.id} test workbench 390px`, true);
  await page.screenshot({
    path: `output/playwright/project-studio/workbench-test-${flow.id}-390.png`,
  });
  await context.close();
  console.log(
    `PASS ${flow.id} v2: specific feedback, revision, oracle answers, linked models, undo/redo, checkpoint restore + refresh, keyboard, 390px, axe A/AA/2.2`,
  );
}
try {
  for (const project of process.env.STUDIO_V2_ONLY === "1" ? [] : PROJECTS) {
    const page = await newPage({ viewport: { width: 1366, height: 900 } });
    page.on("pageerror", (e) => errors.push(`${project.id}: ${e.message}`));
    page.on("response", (r) => {
      if (r.status() >= 400 && r.url().startsWith(base)) failures.push(`${r.status()} ${r.url()}`);
    });
    await page.goto(base + studioURL(project.id));
    await page.locator("#stage-heading").waitFor();
    assert.equal(await page.locator("h1").innerText(), project.title);
    await audit(page, `${project.id} choose`);
    await stage(page, 1);
    await page.locator("#design-form button").click();
    await page.locator(".model svg").waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await audit(page, `${project.id} build mobile`);
    await stage(page, 2);
    await page.locator("[data-answer]").first().fill("999999");
    await page.locator("[data-check] button").first().click();
    assert.match(await page.locator(".feedback").first().innerText(), /Not yet/);
    const firstCheck = model(project, project.defaults).checks[0];
    const helpButton = page.locator(
      `[data-diagnostic="${firstCheck.id}"][data-signal="language-access"]`,
    );
    await helpButton.click();
    assert.match(
      await page.locator(`#diagnostic-${firstCheck.id}`).innerText(),
      /not evidence that your math understanding is weak/i,
    );
    const evidence = await page.evaluate(
      (id) => JSON.parse(localStorage.getItem(`ewl-project-studio:v1:${id}`)),
      project.id,
    );
    assert.equal(evidence.instructionalEvidence.events.at(-1).languageAccess, "learner-requested");
    assert.equal("answer" in evidence.instructionalEvidence.events.at(-1), false);
    await page.reload();
    assert.match(
      await page.locator(`#diagnostic-${firstCheck.id}`).innerText(),
      /You asked for language access/,
    );
    await checkAll(page, project, project.defaults);
    await page.reload();
    await page.locator(".checkpoint-meter").waitFor();
    assert.match(await page.locator(".checkpoint-meter").innerText(), /6 of 6/);
    await stage(page, 3);
    await page.locator("[data-action=baseline]").click();
    assert.match(await page.locator("#stage-panel").innerText(), /first design is saved/);
    await stage(page, 4);
    await audit(page, `${project.id} publish mobile`);
    await page.close();
    console.log(
      `PASS ${project.id}: launch, 390px reflow, a11y, retry, 6 checks, reload, baseline, publish`,
    );
  }
  for (const flow of V2_FLOWS.filter(
    (f) => !process.env.STUDIO_FLOW || process.env.STUDIO_FLOW.split(",").includes(f.id),
  ))
    await v2Flow(flow);
  const page = await newPage({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
  page.on("pageerror", (e) => errors.push(e.message));
  const p = getProject("unit-3-a");
  await page.goto(base + studioURL(p.id));
  await page.locator("[name=context]").first().check();
  await page
    .locator("#vision")
    .fill("Serve a fictional club with a consistent recipe and compare cost per unit.");
  await page.locator("[data-action=supports]").click();
  await stage(page, 1);
  await page.locator("#design-form button").click();
  await page.screenshot({ path: "output/playwright/project-studio/desktop-build.png" });
  await checkAll(page, p, p.defaults);
  for (let i = 0; i < 3; i++)
    await page
      .locator(`#evidence-${i}`)
      .fill(
        `Evidence ${i + 1}: my labeled ratio model uses the same scale factor for both quantities.`,
      );
  await stage(page, 3);
  await page.locator("[data-action=baseline]").click();
  await page.locator("[data-action=build]").click();
  await page.locator("[data-design=c]").fill("7");
  await page.locator("#design-form button").click();
  await stage(page, 2);
  assert.match(await page.locator(".checkpoint-meter").innerText(), /0 of 6/);
  await checkAll(page, p, { ...p.defaults, c: 7 });
  await stage(page, 3);
  await page
    .locator("#critique")
    .fill("Does the ratio remain equivalent when I change the batch size?");
  await page
    .locator("#revision")
    .fill(
      "The scale factor changed from 6 to 7. A changed from 18 to 21, and B from 12 to 14. The ratio stays 3:2.",
    );
  await stage(page, 4);
  await page
    .locator("#claim")
    .fill(
      "Choose this recipe because both parts scale together. Offer B costs less per unit. This model ignores ingredient quality.",
    );
  for (const el of await page.locator("[data-review]").all()) await el.check();
  assert.match(await page.locator("#readiness").innerText(), /Ready for teacher review/);
  let [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("[data-action=report]").click(),
  ]);
  let report = await readFile(await download.path(), "utf8");
  assert.match(report, /READY FOR HUMAN REVIEW/);
  assert.match(report, /scale factor changed from 6 to 7/);
  assert.ok(!report.includes("[not yet"));
  [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("[data-action=backup]").first().click(),
  ]);
  const backup = JSON.parse(await readFile(await download.path(), "utf8"));
  assert.equal(backup.design.c, "7");
  await page.locator("#claim").fill("Temporary changed text");
  await page.locator("#import-file").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole("button", { name: "Replace with this backup" }).click();
  assert.match(await page.locator("#claim").inputValue(), /Choose this recipe/);
  await page.locator("#import-file").setInputFiles({
    name: "wrong.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ ...backup, projectId: "unit-4-a" })),
  });
  await page.waitForFunction(() =>
    document.querySelector("#file-status").textContent.includes("different project"),
  );
  assert.match(await page.locator("#file-status").innerText(), /different project/);
  assert.match(await page.locator("#claim").inputValue(), /Choose this recipe/);
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.locator("[data-action=print]").click();
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator("#print-report").isVisible(), true);
  assert.equal(await page.locator(".site-header").isVisible(), false);
  await page.pdf({ path: "output/playwright/project-studio/math-defense.pdf", format: "Letter" });
  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 720, height: 900 });
  await stage(page, 1);
  await audit(page, "200% equivalent viewport");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "output/playwright/project-studio/mobile-build.png" });
  await page.locator('[data-stage="2"]').first().focus();
  await page.keyboard.press("Enter");
  assert.match(await page.locator("#stage-heading").innerText(), /Test it/);
  await page.locator("[data-answer]").first().focus();
  await page.keyboard.press("Tab");
  assert.equal(
    await page
      .locator("[data-check] button")
      .first()
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.locator("[data-answer]").first().fill("<img src=x onerror=alert(1)>");
  await page.locator("[data-check] button").first().click();
  assert.match(await page.locator(".feedback").first().innerText(), /Not yet/);
  assert.equal(await page.locator("img[src=x]").count(), 0);
  await page.close();
  const blocked = await browser.newContext();
  await blocked.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw Error("Storage blocked");
    };
  });
  const bp = await blocked.newPage();
  await bp.goto(base + studioURL("unit-4-a"));
  await bp.locator("#vision").fill("My draft still works");
  assert.match(await bp.locator("#save-status").innerText(), /unavailable/);
  [download] = await Promise.all([
    bp.waitForEvent("download"),
    bp.locator("[data-action=backup]").first().click(),
  ]);
  assert.match(await readFile(await download.path(), "utf8"), /My draft still works/);
  await blocked.close();
  const corrupt = await newPage();
  await corrupt.goto(base + studioURL("unit-4-a"));
  await corrupt.evaluate(() => localStorage.setItem("ewl-project-studio:v1:unit-4-a", "{bad"));
  await corrupt.reload();
  await corrupt.locator("#stage-heading").waitFor();
  assert.match(await corrupt.locator("main").innerText(), /could not be read/);
  await corrupt.close();
  const gallery = await newPage({ viewport: { width: 390, height: 844 } });
  for (const route of ["/curriculum/projects/", "/math/projects/"]) {
    await gallery.goto(base + route);
    await gallery.locator(".pg-card").first().waitFor();
    assert.equal(await gallery.locator(".pg-card:visible").count(), 30);
    await gallery.locator("#pg-unit").selectOption("5");
    assert.equal(await gallery.locator(".pg-card:visible").count(), 6);
    await gallery.locator("#pg-search").fill("nonexistent");
    assert.equal(await gallery.locator(".pg-card:visible").count(), 0);
    await audit(gallery, route + " filtered mobile");
  }
  await gallery.goto(base + "/curriculum/projects/studio/?project=missing");
  assert.match(await gallery.locator("h1").innerText(), /Choose an available/);
  await gallery.close();
  assert.deepEqual(errors, [], "Browser errors");
  assert.deepEqual(failures, [], "Broken same-origin resources");
  console.log(
    `PASS: 30 missions, 180 browser answer checks, ${a11yScans} WCAG A/AA scans; complete revision/report flow, backup restore, wrong-project import protection, blocked/corrupt storage, keyboard, print and search.`,
  );
} finally {
  await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}
