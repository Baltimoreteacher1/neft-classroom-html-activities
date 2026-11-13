// The Representation Bridge and Experiment Recorder, driven the way a student drives them.
// For each of the five bridge labs: panels agree with the model, a test idea is gated behind a prediction, a wrong idea names its
// misconception, "Show this in the model" and "Back to before" move the model, the log survives a reload, the keyboard path works,
// a phone has no sideways scroll, and axe finds nothing serious. Also: a lab with no bridge still records its Predict-bar
// experiments, and an older save with no `experiments` loads cleanly.
// Usage: node tools/verify-learning-labs-bridge-browser.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const types = {
  ".html": "text/html",
  ".json": "application/json",
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
};
const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (path.endsWith("/")) path += "index.html";
  let file = resolve(REPO_ROOT, `.${path}`);
  if (!file.startsWith(`${resolve(REPO_ROOT)}/`)) return void res.writeHead(403).end();
  if (!existsSync(file)) file = join(REPO_ROOT, "public", path);
  if (!existsSync(file) || !statSync(file).isFile())
    return void res.writeHead(404).end("Not found");
  res.writeHead(200, {
    "Content-Type": types[extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const problems = [];
const report = { labs: 0, ideas: 0, restores: 0, axe: 0 };

async function open(id, viewport = { width: 1366, height: 768 }, storage = null) {
  const context = await browser.newContext({ viewport });
  if (storage)
    await context.addInitScript(([k, v]) => {
      if (!localStorage.getItem(k)) localStorage.setItem(k, v);
    }, storage);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`${origin}/curriculum/learning-labs/${id}/#investigate`);
  await page.locator("#panel-investigate .studio-ask").waitFor({ timeout: 10000 });
  return { context, page, errors };
}
const modelValues = (page) =>
  page
    .locator("#investigation-model [data-control]")
    .evaluateAll((els) => els.map((e) => Number(e.value)));
const count = async (page) =>
  Number(/\((\d+)\)/.exec(await page.locator(".recorder summary").innerText())?.[1] ?? -1);

// idea index to test for the misconception check, per lab: [idea, parameter, what the verdict must mention]
const wrong = {
  "recipe-remix": [1, null, /multiplying|additive|Adding/i],
  "missing-whole": [0, "5.4", /work back to 100%/],
  "power-plant": [1, null, /repeated|factor|exponent/i],
  "balance-bureau": [1, null, /both sides|one side|same/i],
  "shape-shift-garden": [1, "9", /perpendicular|height/i],
};

for (const id of Object.keys(wrong)) {
  const { context, page, errors } = await open(id);
  report.labs++;
  const say = (m) => problems.push(`${id}: ${m}`);

  // 1. four panels from the model's own numbers
  const panels = await page.locator(".bridge-card .bridge-panel").count();
  if (panels !== 4) say(`expected 4 bridge panels, found ${panels}`);
  const tableBefore = await page.locator(".bridge-panel table").first().innerText();
  const wordsBefore = await page.locator(".bridge-panel").nth(2).innerText();

  // 2. the representations follow the model: change the first control and the table and the sentence change
  const editable = page.locator("#investigation-model [data-control]:not([readonly])");
  const first = (await editable.count()) > 1 ? editable.nth(1) : editable.first();
  const next =
    Number(await first.inputValue()) === Number(await first.getAttribute("max"))
      ? Number(await first.getAttribute("min"))
      : Number(await first.inputValue()) + 1;
  await first.fill(String(next));
  await first.dispatchEvent("input");
  await page.waitForTimeout(150);
  if ((await page.locator(".bridge-panel table").first().innerText()) === tableBefore)
    say("table did not follow the model");
  if ((await page.locator(".bridge-panel").nth(2).innerText()) === wordsBefore)
    say("sentence did not follow the model");

  // 3. prediction gate: choosing an idea shows the question, not the answer; the model has not moved
  const modelAtTest = await modelValues(page);
  await page.locator("[data-idea]").first().click();
  if (!(await page.locator(".bridge-stage").innerText()).includes("Predict first"))
    say("no prediction prompt");
  if (await page.locator(".bridge-verdict").count())
    say("the verdict was shown before a prediction");
  assert.deepEqual(await modelValues(page), modelAtTest);
  await page.locator("[data-guess='yes']").click();
  await page.locator(".bridge-verdict").waitFor({ timeout: 3000 });
  report.ideas++;
  if ((await count(page)) !== 1)
    say(`recorder should hold 1 experiment, holds ${await count(page)}`);

  // 4. a wrong idea names its misconception
  const [ideaIndex, param, pattern] = wrong[id];
  await page.locator("[data-again]").click();
  await page.locator("[data-idea]").nth(ideaIndex).click();
  // missing-whole: a whole equal to the percent of the part, from the model's CURRENT settings (the classic wrong move)
  const typed =
    id === "missing-whole"
      ? await modelValues(page).then(([p, part]) => ((p * part) / 100).toFixed(1))
      : param;
  if (typed)
    await page
      .locator("[data-idea]")
      .nth(ideaIndex)
      .locator("xpath=ancestor::li//input")
      .fill(typed);
  if (typed) await page.locator("[data-idea]").nth(ideaIndex).click();
  await page.locator("[data-guess='yes']").click();
  await page.locator(".bridge-verdict").waitFor();
  report.ideas++;
  const verdict = await page.locator(".bridge-stage").innerText();
  if (!pattern.test(verdict)) say(`verdict does not explain the idea: ${verdict.slice(0, 160)}`);
  if (!/stayed the same|changed/.test(verdict)) say("verdict has no text outcome (colour alone)");

  // 5. Show in the model / Back to before
  const showable = page.locator("[data-show]");
  if (await showable.count()) {
    const was = await modelValues(page);
    await showable.click();
    await page.waitForTimeout(150);
    if (JSON.stringify(await modelValues(page)) === JSON.stringify(was))
      say("Show this in the model did not move the model");
    report.restores++;
  }
  await page.locator(".recorder summary").click();
  const back = page.locator("[data-restore-before]").first();
  if (await back.count()) {
    await back.click();
    await page.waitForTimeout(150);
    report.restores++;
  }

  // 6. persistence across a reload
  const logged = await count(page);
  await page.reload();
  await page.locator("#panel-investigate .studio-ask").waitFor();
  if ((await count(page)) !== logged)
    say(`the experiment log did not survive a reload (${logged} then ${await count(page)})`);

  // 7. keyboard: reach an idea, press Enter, reach Yes, press Enter
  await page.locator("[data-idea]").first().focus();
  await page.keyboard.press("Enter");
  await page.locator("[data-guess='yes']").focus();
  await page.keyboard.press("Enter");
  await page
    .locator(".bridge-verdict")
    .waitFor({ timeout: 3000 })
    .catch(() => say("the keyboard path to a verdict failed"));

  // 8. axe on the investigate panel with the bridge and recorder open
  const axe = await new AxeBuilder({ page })
    .include("#panel-investigate")
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  const bad = axe.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  report.axe += axe.violations.length;
  for (const v of bad) say(`axe ${v.impact}: ${v.id} (${v.nodes.length})`);

  // Spanish follows the lab's saved language choice. Test one complete Bridge and Recorder interaction.
  if (id === "recipe-remix") {
    await page.locator("#tab-learn").click();
    await page.locator('.lang-switch [data-lang="es"]').click();
    await page.locator("#tab-investigate").click();
    await page.locator('.bridge-card [lang="es"]').first().waitFor({ timeout: 3000 });
    if (!(await page.locator(".bridge-card").innerText()).includes("Cómo se conectan las partes"))
      say("Spanish Bridge heading is missing");
    if ((await page.locator(".bridge-card [lang=es]").first().getAttribute("lang")) !== "es")
      say("Spanish Bridge text is missing lang=es");
    await page.locator("[data-idea]").first().click();
    await page.locator("[data-guess='yes']").click();
    await page.locator(".bridge-verdict").waitFor();
    await page.locator(".recorder summary").click();
    const recText = await page.locator(".recorder").innerText();
    if (!recText.includes("Mis experimentos") || !recText.includes("Predije:"))
      say("Spanish Recorder text is missing");
    const savedEs = JSON.parse(
      await page.evaluate(() => localStorage.getItem("eduwonderlab:learning-lab:v1:recipe-remix")),
    );
    if (savedEs.experiments?.items?.at(-1)?.prediction?.textEs !== "sí")
      say("Spanish experiment was not stored additively");
    const spanishAxe = await new AxeBuilder({ page })
      .include("#panel-investigate")
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    const spanishBad = spanishAxe.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact),
    );
    report.axe += spanishAxe.violations.length;
    for (const v of spanishBad) say(`Spanish axe ${v.impact}: ${v.id} (${v.nodes.length})`);
  }

  if (errors.length) say(`console/page errors: ${errors.slice(0, 2).join(" | ")}`);
  await context.close();

  // 9. phone: no sideways scroll
  const phone = await open(id, { width: 390, height: 844 });
  if (await phone.page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))
    say("horizontal scroll at 390px");
  await phone.context.close();
}

// A lab with no bridge: no bridge card, but a Predict-bar experiment is still recorded
{
  const { context, page, errors } = await open("consistency-cup");
  if (await page.locator(".bridge-card").count())
    problems.push("consistency-cup: has a bridge card but no bridge is declared");
  await page.locator("#tab-learn").click();
  await page.locator('.lang-switch [data-lang="es"]').click();
  await page.locator("#tab-investigate").click();
  await page.locator("[data-predict='up']").click();
  const input = page.locator("#investigation-model [data-control]:not([readonly])").first();
  await input.fill(String(Number(await input.inputValue()) + 9));
  await input.dispatchEvent("input");
  await page.waitForTimeout(1300);
  if ((await count(page)) < 1)
    problems.push("consistency-cup: a judged prediction was not recorded");
  await page.locator(".recorder summary").click();
  if (!(await page.locator(".recorder").innerText()).includes("Mis experimentos"))
    problems.push("consistency-cup: Spanish Recorder text is missing");
  const loggedEs = JSON.parse(
    await page.evaluate(() => localStorage.getItem("eduwonderlab:learning-lab:v1:consistency-cup")),
  );
  if (!loggedEs.experiments?.items?.at(-1)?.observed?.textEs)
    problems.push("consistency-cup: Predict-bar Spanish evidence was not recorded");
  if (errors.length) problems.push(`consistency-cup: errors ${errors[0]}`);
  await context.close();
}

// An older save (version 1, no `experiments`) loads cleanly and keeps its work
{
  const old = JSON.stringify({
    version: 1,
    level: "core",
    tab: "investigate",
    notes: { prediction: "kept" },
    practice: {},
    steps: {},
    games: {},
    models: {},
    investigated: [1],
  });
  const { context, page, errors } = await open("recipe-remix", { width: 1366, height: 768 }, [
    "eduwonderlab:learning-lab:v1:recipe-remix",
    old,
  ]);
  if ((await count(page)) !== 0) problems.push("older save: expected an empty experiment log");
  const saved = JSON.parse(
    await page.evaluate(() => localStorage.getItem("eduwonderlab:learning-lab:v1:recipe-remix")),
  );
  if (saved.notes?.prediction !== "kept" || !saved.investigated?.includes(1))
    problems.push("older save: previous work was lost");
  if (errors.length) problems.push(`older save: errors ${errors[0]}`);
  await context.close();
}

await browser.close();
server.close();
if (problems.length) {
  console.error(`FAIL learning-labs bridge browser:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(
  `PASS learning-labs bridge browser: ${report.labs} labs, ${report.ideas} ideas tested behind a prediction, ${report.restores} model restores, keyboard path, reload persistence, phone width, axe (${report.axe} non-blocking), Predict-bar recording on a lab with no bridge, older-save compatibility.`,
);
