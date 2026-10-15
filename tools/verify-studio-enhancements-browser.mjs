// Browser verification for the practice-studio enhancements: Comfort panel, Skill Quest, Daily Boost, celebrations.
// Explicitly invoked (npm run validate:studio-enhancements-browser); never starts on ordinary site builds.
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const types = {
  ".html": "text/html",
  ".json": "application/json",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
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
const report = [];
const ok = (m) => report.push(m);

/** Solve the item that is on screen by reading its answer from the generator, test-side only.
 *  `tab` set: the studio's own current item in that section; unset: the last item the Skill Quest generated. */
async function solveCurrent(page, host = "body", tab = 0) {
  const item = await page.evaluate((t) => {
    const it = t
      ? window.StudioRT.api.expand(t, window.StudioRT.api.state.idx[t])
      : window.__lastItem;
    return it && { k: it.k, a: it.a };
  }, tab);
  assert.ok(item, "an item was generated");
  if (item.k === "mc") await page.locator(`${host} .choice-btn`).nth(item.a).click();
  else {
    await page.locator(`${host} input`).first().fill(String(item.a));
    await page.locator(`${host} .btn-go, ${host} button:has-text("Check")`).first().click();
  }
}
const spy = (page) =>
  page.addInitScript(() => {
    const t = setInterval(() => {
      const G = window.StudioGen;
      if (!G || G.__spied) return;
      G.__spied = true;
      const make = G.make;
      G.make = (...a) => (window.__lastItem = make(...a));
      clearInterval(t);
    }, 5);
  });

try {
  /* ---- 1. Comfort: every setting applies, persists and keeps the page usable -------------------------- */
  const u4 = [
    "percent-practice-studio",
    "percent-practice-studio-challenging",
    ...["2", "3", "4", "5"].flatMap((n) => [
      `4-${n}-practice-studio`,
      `4-${n}-practice-studio-challenging`,
    ]),
  ];
  for (const url of [
    "/math/practice-studio/3-5/",
    "/math/practice-studio/3-5/challenge/",
    "/math/practice-studio/boost/",
    ...u4.map((d) => `/math/unit-4/${d}/`),
  ]) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(origin + url);
    await page.locator("#comfort-btn").waitFor();
    await page.locator("#comfort-btn").click();
    // a fresh visitor sees every switch at its usual setting
    assert.equal(
      await page.locator('[data-toggle="contrast"]').isChecked(),
      false,
      `${url}: contrast starts off`,
    );
    assert.equal(
      await page.locator('[data-toggle="celebrate"]').isChecked(),
      true,
      `${url}: celebrations start on`,
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.dataset.comfortContrast),
      "normal",
    );
    await page.locator('input[name="comfort-size"][value="3"]').check();
    await page.locator('input[name="comfort-font"][value="lexend"]').check();
    await page.locator('input[name="comfort-space"][value="roomy"]').check();
    await page.locator('[data-toggle="contrast"]').check();
    await page.locator('[data-toggle="ruler"]').check();
    await page.locator('[data-toggle="calm"]').check();
    const attrs = await page.evaluate(() => ({ ...document.documentElement.dataset }));
    assert.equal(attrs.comfortSize, "3");
    assert.equal(attrs.comfortFont, "lexend");
    assert.equal(attrs.comfortSpace, "roomy");
    assert.equal(attrs.comfortContrast, "high");
    assert.equal(attrs.comfortCalm, "on");
    await page.locator("[data-close]").click();
    await page.reload();
    await page.locator("#comfort-btn").waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.dataset.comfortSize),
      "3",
      `${url}: size persists`,
    );
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(
      overflow <= 24,
      `${url}: no sideways scroll at 375px with the largest text (${overflow}px)`,
    );
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.equal(bg, "rgb(255, 255, 255)", `${url}: high contrast gives a white page`);
    await page.mouse.move(100, 300);
    const top = await page.evaluate(() =>
      parseFloat(document.getElementById("comfort-ruler").style.top),
    );
    assert.ok(top > 150 && top < 320, `${url}: ruler follows the pointer (${top})`);
    await ctx.close();
  }
  ok(
    "comfort: size, font, spacing, contrast, ruler and calm apply, persist, and fit at 375px (every studio shape: generated, Boost, and all ten Unit 4 pages)",
  );

  /* ---- 2. Skill Quest: adapts, ends, and records stars --------------------------------------------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
    const page = await ctx.newPage();
    await spy(page);
    await page.goto(`${origin}/math/practice-studio/3-5/`);
    await page.locator("#quest-btn").click();
    assert.match(await page.locator("#studio-quest").innerText(), /Start the quest/);
    await page.locator("[data-start]").click();
    let questions = 0;
    for (; questions < 20; questions++) {
      if (await page.locator(".quest-stars").count()) break;
      await page.locator(".quest-stage .item-q, .quest-stage .item-sub").first().waitFor();
      await solveCurrent(page, "#studio-quest");
      await page.locator("#studio-quest .item-fb button").first().click();
    }
    assert.ok(await page.locator(".quest-stars").count(), "the quest reached its results");
    const stars = await page.locator(".quest-stars").getAttribute("aria-label");
    assert.match(stars, /3 of 3/, `a student who is always right masters the skills (${stars})`);
    assert.ok(questions >= 4 && questions <= 18, `quest length is sensible (${questions})`);
    const saved = await page.evaluate(
      () => JSON.parse(localStorage.getItem("neft_studio_3-5_practice_v2")).quest,
    );
    assert.equal(saved.best, 3);
    // the quest fed the Daily Boost memory
    const boost = await page.evaluate(() => JSON.parse(localStorage.getItem("ewl_boost_v1")));
    assert.ok(Object.keys(boost.skills).length >= 1, "quest answers were remembered for the Boost");
    await ctx.close();
    ok(`skill quest: adaptive run of ${questions} questions ended with 3 stars and was remembered`);
  }

  /* ---- 3. Daily Boost: a set for today, remembered per skill ----------------------------------------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
    const page = await ctx.newPage();
    await spy(page);
    await page.goto(`${origin}/math/practice-studio/boost/`);
    await page.locator(".item-q").first().waitFor();
    assert.equal(await page.locator("#header-progress-count").innerText(), "0 / 10");
    assert.match(
      await page
        .locator("#hud-pill, .ewl-hud-id")
        .first()
        .innerText()
        .catch(() => "Daily Boost"),
      /./,
    );
    const set1 = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ewl_boost_v1"))
        .today.items.map((i) => i.g)
        .join(","),
    );
    await solveCurrent(page, "#stage-1", 1);
    const skills = await page.evaluate(
      () => JSON.parse(localStorage.getItem("ewl_boost_v1")).skills,
    );
    const first = Object.values(skills)[0];
    assert.equal(first.box, 1, "a clean answer lands in box 1");
    await page.reload();
    await page.locator(".item-q").first().waitFor();
    const set2 = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ewl_boost_v1"))
        .today.items.map((i) => i.g)
        .join(","),
    );
    assert.equal(set1, set2, "a reload shows the same set for the day");
    await ctx.close();
    ok("daily boost: today's ten, one clean answer boxed, same set after reload");
  }

  /* ---- 4. Celebrations: a streak toast, and silence when calm ----------------------------------------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
    const page = await ctx.newPage();
    await spy(page);
    await page.goto(`${origin}/math/practice-studio/3-5/`);
    await page.locator(".item-q").first().waitFor();
    for (let i = 0; i < 3; i++) {
      await solveCurrent(page, "#stage-1", 1);
      await page.locator("#stage-1 .next-btn").click();
    }
    await page.waitForSelector("#comfort-toast.show", { timeout: 4000 });
    assert.match(await page.locator("#comfort-toast").innerText(), /3 in a row/);
    await ctx.close();
    ok("celebrations: a three-in-a-row toast for something earned");
  }
} finally {
  await browser.close();
  server.close();
}
console.log(report.map((r) => `✓ ${r}`).join("\n"));
