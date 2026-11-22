// Browser contract for the sibling WIDA / ESOL studios reachable from The Language Page: no blocking dialogs, feedback in
// live regions, map and chip controls reachable by keyboard, wrong answers teach before they reveal.
// Run: node tools/language-sibling-sites.test.mjs   (Chromium via Playwright; PW_CHROMIUM_PATH is honoured)
import assert from "node:assert/strict";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
let server, browser, base;

before(async () => {
  server = createServer((req, res) => {
    let p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(
      /^(\.\.[/\\])+/,
      "",
    );
    let f = join(ROOT, p);
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, "index.html");
    if (!existsSync(f)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" });
    createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
});
after(async () => {
  await browser?.close();
  server?.close();
});

async function open(path, viewport = { width: 390, height: 844 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push(e.message));
  page.on("dialog", (d) => {
    problems.push(`dialog: ${d.message()}`);
    d.dismiss();
  });
  await page.goto(base + path);
  return { page, problems, close: () => ctx.close() };
}
const text = async (page, sel) => (await page.locator(sel).innerText()).replace(/\s+/g, " ");
const real = (problems) => problems.filter((p) => !/web-vitals/.test(p));

test("directions trainer: map places are keyboard buttons and wrong answers teach", async () => {
  const { page, problems, close } = await open("/wida-access/directions-trainer/");
  const nodes = page.locator("#mapCanvas .map-node");
  assert.ok((await nodes.count()) >= 5);
  for (const n of await nodes.all()) {
    assert.equal(await n.getAttribute("role"), "button");
    assert.equal(await n.getAttribute("tabindex"), "0");
    assert.ok((await n.getAttribute("aria-label")).length > 2);
  }
  await page.locator("#node_cafeteria").focus();
  await page.keyboard.press("Enter");
  assert.match(await text(page, "#feedbackBox"), /not on this route/i);
  await page.locator("#node_library").focus();
  await page.keyboard.press("Space");
  const second = await text(page, "#feedbackBox");
  assert.match(second, /on the route, but it is not the end/i);
  assert.ok(
    (await page.locator("#feedbackBox li").count()) >= 3,
    "second miss shows the directions step by step",
  );
  await page.locator("#node_sciencelab").focus();
  await page.keyboard.press("Enter");
  assert.match(await text(page, "#feedbackBox"), /^Yes: Science Lab/);
  assert.ok(await page.locator("#btnNextMission").isVisible());
  assert.equal(await page.locator("#feedbackBox").getAttribute("role"), "status");
  assert.deepEqual(real(problems), []);
  await close();
});

test("directions trainer: finishing a tier is announced in the page, not an alert", async () => {
  const { page, problems, close } = await open("/wida-access/directions-trainer/");
  for (let i = 0; i < 4; i++) {
    // biome-ignore lint/correctness/noUndeclaredVariables: page-global bindings, evaluated in the page's global scope
    const target = await page.evaluate(() => getTierMissions()[activeMissionIndex].correctTarget);
    await page.locator(`#${target}`).focus();
    await page.keyboard.press("Enter");
    await page.click("#btnNextMission");
  }
  assert.match(await text(page, "#feedbackBox"), /finished every mission in this tier/i);
  assert.deepEqual(real(problems), []);
  await close();
});

test("word builder: teaching feedback, retry, saved daily quest", async () => {
  const { page, problems, close } = await open("/wida-access/word-builder/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#rootDeck [data-value="predict"]');
  await page.click('#suffixDeck [data-value="-ent"]');
  await page.click('[data-action="build"]');
  assert.match(await text(page, "#forgeStatus"), /does not take -ent/);
  await page.click('#suffixDeck [data-value="-able"]');
  await page.click('#prefixDeck [data-value="dis-"]');
  await page.click('[data-action="build"]');
  assert.match(await text(page, "#forgeStatus"), /prefix dis- does not make a word/);
  await page.click('#prefixDeck [data-value="un-"]');
  await page.click('[data-action="build"]');
  assert.match(await text(page, "#resParts"), /un- \+ predict \+ -able → unpredictable/);
  await page.click('#clozeOptions [data-word="evaporate"]');
  assert.match(await text(page, "#clozeFeedback"), /needs a noun/);
  assert.equal(await page.locator("#btnNextCloze").isVisible(), false, "first miss allows a retry");
  await page.click('#clozeOptions [data-word="evaporation"]');
  assert.match(await text(page, "#clozeFeedback"), /^Yes: evaporation/);
  await page.reload();
  assert.equal(await text(page, "#questClozeCount"), "1 / 2", "quest progress survives a reload");
  assert.match(await text(page, "#vaultCountBadge"), /^1 word$/i);
  assert.deepEqual(real(problems), []);
  await close();
});

test("math studio and book review: submit and save give inline feedback", async () => {
  let t = await open("/esol-reading-writing/twr-math-writing-studio/");
  // biome-ignore lint/correctness/noUndeclaredVariables: page-global bindings, evaluated in the page's global scope
  await t.page.evaluate(() => AppController.validateAll());
  assert.match(
    await text(t.page, "#submitStatus"),
    /Not finished yet\. Finish the because, but and so lanes/,
  );
  assert.deepEqual(real(t.problems), []);
  await t.close();
  t = await open("/esol-reading-writing/flushbooksummary/");
  await t.page.evaluate(() => {
    document.getElementById("finalResponse").value = "short";
    // biome-ignore lint/correctness/noUndeclaredVariables: page-global function, evaluated in the page's global scope
    saveFinal();
  });
  assert.match(await text(t.page, "#finalStatus"), /still short/);
  assert.deepEqual(real(t.problems), []);
  await t.close();
});

test("reward shop: locked theme explains how to earn XP without a dialog", async () => {
  const { page, problems, close } = await open("/wida-access/reward-shop/");
  await page.evaluate(() => localStorage.setItem("widaXP", "0"));
  await page.reload();
  const locked = page.locator("#themeGrid button", { hasText: /Locked/ }).first();
  await locked.click();
  assert.match(await text(page, "#shopStatus"), /needs \d+ SPARK XP and you have 0/);
  assert.deepEqual(real(problems), []);
  await close();
});

test("studios reachable from The Language Page have no axe WCAG 2.x AA violations", async () => {
  const axePath = fileURLToPath(new URL("../node_modules/axe-core/axe.min.js", import.meta.url));
  const pages = [
    "/wida-access/listening/",
    "/wida-access/reading/",
    "/wida-access/speaking/",
    "/wida-access/writing/",
    "/wida-access/word-builder/",
    "/wida-access/directions-trainer/",
    "/wida-access/reward-shop/",
    "/esol-reading-writing/esolreading/",
    "/esol-reading-writing/goal-quest-responsible-decisions/",
  ];
  for (const path of pages) {
    const { page, close } = await open(path, { width: 1280, height: 900 });
    await page.waitForTimeout(400);
    await page.addScriptTag({ path: axePath });
    const found = await page.evaluate(() =>
      // biome-ignore lint/correctness/noUndeclaredVariables: page-global bindings, evaluated in the page's global scope
      axe
        .run({ runOnly: ["wcag2a", "wcag2aa", "wcag22aa"] })
        .then((r) => r.violations.map((v) => `${v.id} x${v.nodes.length}`)),
    );
    assert.deepEqual(found, [], `${path}: ${found.join(", ")}`);
    await close();
  }
});
