import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const root = resolve(REPO_ROOT);
  let file = resolve(root, `.${rel}`);
  if (!file.startsWith(`${root}/`)) return void res.writeHead(403).end();
  if (!existsSync(file)) file = resolve(root, `public/.${rel}`);
  if (!existsSync(file) || !statSync(file).isFile()) return void res.writeHead(404).end();
  res.writeHead(200, {
    "Content-Type": types[extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const graph = JSON.parse(
  readFileSync(join(REPO_ROOT, "data/practice-studio/skill-graph.json"), "utf8"),
);
const launch = process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {};
const browser = await chromium.launch(launch);
const errors = [];
let routes = 0;
try {
  assert.equal(graph.lessons.length, 72, "Units 2–9 have 72 lessons");
  for (const lesson of graph.lessons) {
    for (const mode of ["standard", "challenge"]) {
      const url = lesson.source[mode];
      const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
      const response = await page.goto(origin + url, { waitUntil: "domcontentloaded" });
      if (response?.status() !== 200)
        errors.push(`${lesson.id} ${mode}: HTTP ${response?.status()}`);
      if (!(await page.locator("h1").count())) errors.push(`${lesson.id} ${mode}: no heading`);
      if (/^4-/.test(lesson.id)) {
        if (!(await page.locator("main, .studio-main").count()))
          errors.push(`${lesson.id} ${mode}: no main area`);
      } else {
        try {
          await page.waitForFunction(
            () => !!window.StudioRT?.api && !!window.StudioPathways,
            null,
            { timeout: 7000 },
          );
          if (!(await page.locator(".pathway-panel").count()))
            errors.push(`${lesson.id} ${mode}: no adaptive entry`);
          if (!(await page.locator("[data-path-entry]").count()))
            errors.push(`${lesson.id} ${mode}: no two-check entry`);
        } catch {
          errors.push(`${lesson.id} ${mode}: practice runtime failed to initialize`);
        }
      }
      routes++;
      await page.close();
    }
  }
  for (const id of ["2-1", "3-3", "5-1", "8-2"]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${origin}/math/practice-studio/${id}/`, { waitUntil: "domcontentloaded" });
    await page.locator(".focus-more-btn").click();
    await page.locator("[data-path-entry]").click();
    assert.match(await page.locator(".pathway-check h3").innerText(), /Check 1 of 2/);
    assert.ok(
      await page.locator(".pathway-item .item-fb").count(),
      `${id}: diagnostic mounted a real item`,
    );
    await page.locator("[data-path-skip]").click();
    assert.match(await page.locator(".pathway-summary").innerText(), /Full sequence/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 24, `${id}: mobile overflow ${overflow}px`);
    const shotDir = join(REPO_ROOT, ".qa-logs", "studio-pathways");
    mkdirSync(shotDir, { recursive: true });
    await page.screenshot({ path: join(shotDir, `${id}-mobile.png`), fullPage: true });
    await page.close();
  }
  {
    const page = await browser.newPage();
    await page.goto(`${origin}/math/practice-studio/2-1/`, { waitUntil: "domcontentloaded" });
    const before = await page.evaluate(() => ({
      stats: { ...window.StudioRT.api.state.stats },
      learner: localStorage.getItem("neft_studio_learner_v1"),
    }));
    await page.locator(".focus-more-btn").click();
    await page.locator("[data-path-entry]").click();
    const first = await page.evaluate(() => {
      const { tab, index } = window.StudioPathways.entrySpecs()[0];
      const it = window.StudioRT.api.expand(tab, index);
      return { k: it.k, a: it.a, choices: it.c?.length || 0 };
    });
    assert.equal(first.k, "mc", "2-1 starts with a statistical-question choice check");
    await page
      .locator(".pathway-item .choice-btn")
      .nth((first.a + 1) % first.choices)
      .click();
    const after = await page.evaluate(() => ({
      stats: { ...window.StudioRT.api.state.stats },
      learner: localStorage.getItem("neft_studio_learner_v1"),
      entry: window.StudioRT.api.state.pathway.entry,
    }));
    assert.deepEqual(
      after.stats,
      before.stats,
      "entry miss does not change lesson success counters",
    );
    assert.equal(after.learner, before.learner, "entry miss does not change cross-lesson evidence");
    assert.equal(after.entry.length, 1, "entry miss is recorded only in the optional check");
    await page.close();
  }
  {
    const page = await browser.newPage();
    await page.goto(`${origin}/math/practice-studio/3-3/`, { waitUntil: "domcontentloaded" });
    await page.locator(".focus-more-btn").click();
    await page.locator("[data-path-entry]").click();
    for (let i = 0; i < 2; i++) {
      const item = await page.evaluate((n) => {
        const { tab, index } = window.StudioPathways.entrySpecs()[n];
        const it = window.StudioRT.api.expand(
          tab,
          index,
          96321 + n * 271 + Number.parseInt(window.StudioRT.api.data.lesson.replace("-", ""), 10),
        );
        return { k: it.k, a: it.a };
      }, i);
      if (item.k === "mc") await page.locator(".pathway-item .choice-btn").nth(item.a).click();
      else if (item.k === "num") {
        await page.locator(".pathway-item input.num-input").fill(String(item.a));
        await page.locator(".pathway-item [data-check]").click();
      } else throw new Error(`unexpected diagnostic kind ${item.k}`);
      await page.locator(".pathway-check > .pathway-primary").click();
    }
    assert.equal(await page.evaluate(() => window.StudioRT.api.state.pathway.recommendation), 4);
    await page.evaluate(() => {
      const rt = window.StudioRT.api;
      for (const tab of [4, 5])
        for (const it of rt.sections[tab - 1].items) rt.state[`solved${tab}`][it.id] = true;
      rt.progress();
    });
    assert.equal(await page.evaluate(() => window.StudioRT.api.state.pathway.focusedDone), true);
    assert.match(await page.locator(".pathway-summary").innerText(), /Focused route complete/);
    await page.reload();
    assert.equal(
      await page.evaluate(() => window.StudioRT.api.state.pathway.focusedDone),
      true,
      "focused route persists",
    );
    await page.close();
  }
  assert.deepEqual(errors, [], errors.join("\n"));
  console.log(
    `Practice pathways: ${routes} direct routes initialized; four mobile layouts, diagnostic isolation, and focused completion passed.`,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
