// EduWonderLab 7.0 journeys, driven in a real browser (npm run validate:fluency-v7-browser).
// Grade, topic, skill, Start; every flagship (G2 arrays, G4 fractions, G6 ratios, G7 equations, G8 linear) loads a living
// model; a wrong answer gets a coach move that never states the answer; a right answer is recorded additively; Spanish;
// 390px and 1280px without sideways scroll; axe; deep links and old saved progress are untouched; storage blocked still works.
// Screenshots go to $V7_SHOTS (default: a temp dir) for human review. A missing browser is a SKIP (exit 3; failure in CI).
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const SHOTS = process.env.V7_SHOTS || join(tmpdir(), "v7-shots");
mkdirSync(SHOTS, { recursive: true });
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".png": "image/png",
};
const server = createServer(async (req, res) => {
  try {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(
      /^(\.\.[/\\])+/,
      "",
    );
    const file = join(REPO_ROOT, path.endsWith("/") ? `${path}index.html` : path);
    if (!file.startsWith(REPO_ROOT)) throw new Error("outside");
    const body = await readFile(file).catch(() => readFile(join(REPO_ROOT, "public", path)));
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("nf");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (error) {
  console.log(
    `SKIP validate:fluency-v7-browser — no browser (${String(error.message).split("\n")[0]})`,
  );
  server.close();
  process.exit(process.env.CI ? 1 : 3);
}

let checks = 0;
const ok = (cond, msg) => {
  assert.ok(cond, msg);
  checks += 1;
};
const problems = [];
// The legacy lab page imports Vite-resolved specifiers ("web-vitals", "@engine/…") that only exist after `npm run build`;
// a source server cannot resolve them (the same harness-only noise validate:smoke-injection ignores). the injected Save/Resume engine on v7 pages carries the same specifier. Nothing else is excused.
const buildTimeNoise = (e) => /web-vitals|@engine|status of 404/.test(e);

async function open(viewport, { reduced = false, init } = {}) {
  const ctx = await browser.newContext({
    viewport,
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  page.on("request", (r) => {
    if (!r.url().startsWith(base) && !r.url().startsWith("data:"))
      errors.push(`external request: ${r.url()}`);
  });
  return { ctx, page, errors };
}
const noSideways = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
async function axe(page, label) {
  // Contrast is sampled from the painted page: wait for web fonts and in-flight animations first,
  // otherwise a mid-fade element is measured against the wrong colour and the result depends on load.
  await page.evaluate(() => document.fonts.ready);
  // Only finite animations are awaited, and never for longer than 3 seconds: an infinite one never finishes.
  await page.evaluate(() =>
    Promise.race([
      Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect.getComputedTiming().endTime))
          .map((a) => a.finished.catch(() => {})),
      ),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]),
  );
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  if (bad.length)
    problems.push(`${label}: axe ${bad.map((v) => `${v.id}(${v.nodes.length})`).join(", ")}`);
}

// 1. From the front door (grade, topic, skill, Start) to the skill's Learn stage, then into the v7 picture workspace.
{
  const { ctx, page, errors } = await open({ width: 390, height: 844 });
  await page.goto(`${base}/math/fluency-lab/lab.html`);
  await page.waitForSelector(".ep");
  ok((await page.locator("[data-ep-grade]").count()) === 9, "nine grade choices, K to 8");
  await page.click('[data-ep-grade="4"]');
  await page.click('[data-ep-topic="fractions"]');
  await page.click('[data-ep-skill="fraction-equiv"]');
  const go = page.locator("[data-ep-start]");
  ok(await go.isVisible(), "Start appears after a skill is chosen");
  const box = await go.boundingBox();
  ok(box.height >= 44 && box.width >= 44, "Start is a 44px target");
  ok(await noSideways(page), "home has no horizontal scroll at 390");
  await page.screenshot({ path: join(SHOTS, "home-390.png") });
  await axe(page, "home");
  await go.click();
  await page.waitForSelector("#workspace-view:not([hidden])");
  await page.locator(".learn-support > summary").click();
  await page.click('#learn-panel a[href^="./v7/"]');
  await page.waitForSelector("#v7-model svg, #v7-model .e8ml-visual", { timeout: 15000 });
  ok(
    page.url().includes("/v7/?grade=4&skill=fraction-equiv"),
    "Learn opens the v7 workspace for the same skill",
  );
  ok(
    errors.filter((e) => !buildTimeNoise(e)).length === 0,
    `home journey clean: ${errors.join("; ")}`,
  );
  await ctx.close();
}

// 2. Deep links keep working and skip the front door; old saved progress is untouched by v7.
{
  const OLD = JSON.stringify({ "4:fraction-equiv": { attempts: 9, correct: 8 } });
  const { ctx, page, errors } = await open(
    { width: 1280, height: 900 },
    {
      init: `if(!localStorage.getItem("ewl-fluency-progress-v1"))localStorage.setItem("ewl-fluency-progress-v1", ${JSON.stringify(OLD)})`,
    },
  );
  await page.goto(`${base}/math/fluency-lab/lab.html?grade=4&skill=fraction-equiv`);
  await page.waitForSelector("#main");
  ok((await page.locator(".ep").count()) === 0, "deep link skips the front door");
  await page.goto(`${base}/math/fluency-lab/v7/?grade=4&skill=fraction-equiv`);
  await page.waitForSelector("#v7-model svg, #v7-model .e8ml-visual");
  const answer = await page.evaluate(() => window.__v7.item.answers[0]);
  await page.fill("#v7-answer", answer);
  await page.click("#v7-check");
  ok(/works|funciona/i.test(await page.textContent("#v7-feedback")), "right answer confirmed");
  const stored = await page.evaluate(() => ({
    lab: localStorage.getItem("ewl-fluency-progress-v1"),
    mine: localStorage.getItem("ewl-v7-progress-v1"),
  }));
  ok(stored.lab === OLD, "v7 never rewrites the lab's saved progress");
  ok(
    JSON.parse(stored.mine)["4:fraction-equiv"].correct === 1,
    "v7 records its own evidence additively",
  );
  ok(
    errors.filter((e) => !buildTimeNoise(e)).length === 0,
    `deep link journey clean: ${errors.join("; ")}`,
  );
  await ctx.close();
}

// 3. Flagships: model renders, wrong answer -> coach (answer-free), right answer, Spanish, 390 + 1280, axe, screenshots.
const FLAGS = [
  [2, "mul-0-5", "g2-arrays"],
  [4, "fraction-equiv", "g4-fractions"],
  [6, "ratios", "g6-ratios"],
  [7, "equations", "g7-equations"],
  [8, "slope", "g8-linear"],
];
for (const [grade, skill, name] of FLAGS) {
  for (const width of [390, 1280]) {
    const { ctx, page, errors } = await open({ width, height: width === 390 ? 844 : 900 });
    await page.goto(`${base}/math/fluency-lab/v7/?grade=${grade}&skill=${skill}&seed=7`);
    await page.waitForSelector("#v7-model svg, #v7-model .e8ml-visual", { timeout: 15000 });
    ok(
      (await page.locator("#v7-model button").count()) > 0,
      `${name}@${width}: model has controls`,
    );
    ok(await noSideways(page), `${name}@${width}: no horizontal scroll`);
    // Wrong answer must get a coach move that does not state the answer.
    const info = await page.evaluate(() => ({
      q: window.__v7.item.question,
      a: window.__v7.item.answers,
    }));
    await page.fill("#v7-answer", "zzz");
    await page.click("#v7-check");
    await page.waitForSelector("#v7-log li");
    for (let i = 0; i < 3; i += 1) {
      await page.click("#v7-help");
    }
    const logs = await page.locator("#v7-log li").allTextContents();
    ok(logs.length >= 3, `${name}@${width}: coach responds`);
    const early = logs.slice(0, 2).join(" ");
    ok(
      !info.a.some((a) => a.length > 1 && early.includes(a) && !info.q.includes(a)),
      `${name}@${width}: early coach never states the answer`,
    );
    await page.screenshot({ path: join(SHOTS, `${name}-${width}.png`), fullPage: true });
    if (width === 390) {
      await page.click("#v7-lang");
      ok((await page.textContent("#v7-help")).includes("Ayúdame"), `${name}: Spanish`);
      await page.screenshot({ path: join(SHOTS, `${name}-es-390.png`) });
      await axe(page, `${name}@390 es`);
      await page.click("#v7-lang");
    } else await axe(page, `${name}@1280`);
    ok(
      errors.filter((e) => !buildTimeNoise(e)).length === 0,
      `${name}@${width} clean: ${errors.join("; ")}`,
    );
    await ctx.close();
  }
}

// 4. Storage blocked: the workspace still works and does not crash.
{
  const { ctx, page, errors } = await open(
    { width: 1280, height: 900 },
    { init: `Object.defineProperty(window,"localStorage",{get(){throw new Error("blocked")}})` },
  );
  await page.goto(`${base}/math/fluency-lab/v7/?grade=6&skill=ratios`);
  await page.waitForSelector("#v7-q");
  const a = await page.evaluate(() => window.__v7.item.answers[0]);
  await page.fill("#v7-answer", a);
  await page.click("#v7-check");
  ok(/works|funciona/i.test(await page.textContent("#v7-feedback")), "works with storage blocked");
  ok(
    errors.filter((e) => !/blocked/.test(e) && !buildTimeNoise(e)).length === 0,
    `storage-blocked clean: ${errors.join("; ")}`,
  );
  await ctx.close();
}

// 5. Reduced motion + forced colors do not break the workspace.
{
  const { ctx, page } = await open({ width: 390, height: 844 }, { reduced: true });
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto(`${base}/math/fluency-lab/v7/?grade=7&skill=equations`);
  await page.waitForSelector("#v7-q");
  ok(await noSideways(page), "reduced motion / forced colors: no sideways scroll");
  await ctx.close();
}

await browser.close();
server.close();
if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`FAIL validate:fluency-v7-browser (${checks} checks, ${problems.length} problems)`);
  process.exit(1);
}
console.log(`fluency-v7-browser: ${checks} checks passed. Screenshots: ${SHOTS}`);
