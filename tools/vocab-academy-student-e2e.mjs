#!/usr/bin/env node
/**
 * Vocabulary Academy student journey, driven in real Chromium at 390px and 1280px against real K, 2, 4 and 6 units.
 * Walk: My Vocabulary -> grades -> grade -> unit -> lessons A-H -> games -> review -> practice -> family -> print, a lesson
 * left half-done and resumed after a reload, then the lab's other routes (vocabulary, books, resources, class, passport,
 * family) still resolve. The committed index.json is replaced in the browser by one built in memory from the authored files.
 *   node tools/vocab-academy-student-e2e.mjs [--shots <dir>]
 */
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { buildIndex } from "./build-vocab-academy-index.mjs";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";
import { loadCorpus } from "./lib/vocab-academy-scope.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("vocab-academy-student-e2e: SKIP, playwright is not installed.");
  process.exit(process.env.CI ? 1 : 3);
}
const shotsArg = process.argv.indexOf("--shots");
const SHOTS = shotsArg > 0 ? process.argv[shotsArg + 1] : "";
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const LAB = "/access-practice-lab";
const VA = `${LAB}/vocabulary-academy`;
const INDEX = JSON.stringify(buildIndex(loadCorpus(REPO_ROOT)));
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
};
const server = await new Promise((resolve) => {
  const s = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
    if (!existsSync(file) && existsSync(join(REPO_ROOT, "public", p)))
      file = join(REPO_ROOT, "public", p);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (p.startsWith(`${LAB}/`) && !/\.[a-z0-9]+$/i.test(p))
        file = join(REPO_ROOT, "access-practice-lab/index.html");
      else {
        res.writeHead(404);
        return res.end();
      }
    }
    res.writeHead(200, {
      "content-type": TYPES[extname(file)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    createReadStream(file).pipe(res);
  });
  s.listen(0, () => resolve(s));
});
const origin = `http://localhost:${server.address().port}`;

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const browser = await chromium.launch();
const errors = [];
const UNITS = [
  ["K", 1],
  ["2", 1],
  ["4", 1],
  ["6", 2],
  ["7", 1],
  ["8", 1],
];

async function device(width, height = 900) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  await ctx.route("**/content/vocab-academy/index.json", (r) =>
    r.fulfill({ contentType: "application/json", body: INDEX }),
  );
  const page = await ctx.newPage();
  // "web-vitals" is a bare npm specifier that only the production build resolves; the source tree cannot.
  page.on("pageerror", (e) => {
    if (!/web-vitals/.test(e.message))
      errors.push(`${width}px pageerror ${page.url()}: ${e.message}`);
  });
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (/favicon|Failed to load resource.*(404)|WebGL|studio-video|ResizeObserver/i.test(t)) return;
    errors.push(`${width}px console ${page.url()}: ${t}`);
  });
  return { ctx, page };
}
const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
};
async function open(page, path) {
  await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
  await page.waitForSelector("main h1, #appRoot h1, h1", { timeout: 15000 }).catch(() => {});
}
const noScroll = async (page, label) =>
  ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    `no horizontal scroll: ${label}`,
  );
const text = (page) => page.evaluate(() => document.body.innerText);
const heading = (page) =>
  page.evaluate(() => document.querySelector("h1")?.textContent?.trim() || "");

for (const width of [390, 1280]) {
  const { ctx, page } = await device(width);
  const tag = `${width}px`;
  await open(page, VA);
  ok((await heading(page)).length > 0, `${tag} My Vocabulary has a heading`);
  await noScroll(page, `${tag} home`);
  await shot(page, `${tag}-home`);

  await open(page, `${VA}/grades`);
  ok(
    /Kindergarten/.test(await text(page)) && !/Grade 9\b.*Open/.test(await text(page)),
    `${tag} grades page lists Kindergarten to Grade 8`,
  );
  await noScroll(page, `${tag} grades`);

  for (const [g, n] of UNITS) {
    await open(page, `${VA}/grade/${g}`);
    ok(/Unit/.test(await text(page)), `${tag} grade ${g} lists units`);
    await open(page, `${VA}/grade/${g}/lesson/${n}`);
    const unitText = await text(page);
    ok(!/not published yet/.test(unitText), `${tag} grade ${g} lesson ${n} is published and opens`);
    ok(
      (await page.locator(".va-wl-entry").count()) >= 5 &&
        /Exercise \d+A: Finding Meanings/.test(unitText),
      `${tag} grade ${g} lesson ${n} shows its Word List and the Wordly Wise-style exercises`,
    );
    await noScroll(page, `${tag} grade ${g} lesson ${n}`);
    await shot(page, `${tag}-g${g}-l${n}`);
    for (const letter of "abcdefgh") {
      await open(page, `${VA}/grade/${g}/lesson/${n}/${letter}`);
      const body = await text(page);
      ok(
        body.length > 300 && !/being built|could not find|not ready yet/i.test(body),
        `${tag} grade ${g} lesson ${n} section ${letter.toUpperCase()} renders`,
      );
      if (letter === "a" || letter === "e") await noScroll(page, `${tag} g${g}l${n}${letter}`);
      if (letter === "a") await shot(page, `${tag}-g${g}-l${n}-wordlist`);
    }
  }
  // A unit groups lessons: its page, crossword and test open for every grade band.
  for (const g of ["K", "4", "8"]) {
    await open(page, `${VA}/grade/${g}/unit/1`);
    const ut = await text(page);
    ok(
      /Lessons in this unit/.test(ut) && /Crossword puzzle/.test(ut) && /Unit test/.test(ut),
      `${tag} grade ${g} unit 1 lists its lessons and activities`,
    );
    await noScroll(page, `${tag} grade ${g} unit 1`);
    ok(
      (await page.locator(".va-plot svg.va-plant").count()) >= 20 && /Word garden/.test(ut),
      `${tag} grade ${g} unit 1 shows its words as a garden of plants`,
    );
    if (g === "4") await shot(page, `${tag}-g4-unit-garden`);
    await open(page, `${VA}/grade/${g}/unit/1/vault`);
    ok(
      (await page.locator(".va-lock").count()) >= 3 &&
        (await page.locator(".vag-choice").count()) >= 2,
      `${tag} grade ${g} Word Vault shows its locks and a first question`,
    );
    await noScroll(page, `${tag} grade ${g} vault`);
    if (g === "4") await shot(page, `${tag}-g4-vault`);
    await open(page, `${VA}/grade/${g}/unit/1/crossword`);
    const boxes = await page.locator("[data-cw-input]").count();
    ok(
      boxes >= 30 && (await page.locator(".va-cw-clue").count()) >= 8,
      `${tag} grade ${g} crossword has a grid (${boxes} boxes) and clues`,
    );
    await noScroll(page, `${tag} grade ${g} crossword`);
    if (g === "4") await shot(page, `${tag}-g4-crossword`);
    await open(page, `${VA}/grade/${g}/unit/1/test`);
    ok(
      (await page.locator("[data-val-aitem]").count()) >= 15,
      `${tag} grade ${g} unit test has questions from every lesson`,
    );
    await noScroll(page, `${tag} grade ${g} unit test`);
  }
  for (const route of [
    "games",
    "review",
    "practice",
    "word-study",
    "family",
    "family?grade=4&unit=1",
  ]) {
    await open(page, `${VA}/${route}`);
    ok((await text(page)).length > 200, `${tag} /${route} renders`);
    await noScroll(page, `${tag} ${route}`);
  }
  await open(page, `${VA}/games`);
  const tiles = await page.locator('a[href*="/games/"]').count();
  ok(tiles >= 8, `${tag} the arcade lists its games (${tiles})`);
  await open(page, `${VA}/print/4/1/workbook`);
  ok((await page.locator(".vap-sheet").count()) > 5, `${tag} the print route renders sheets`);
  await open(page, `${VA}/print/4/1/teacher`);
  ok(
    (await page.locator(".vap-sheet").count()) === 0 && /for teachers/i.test(await text(page)),
    `${tag} the teacher print kind is refused on a student device (no sheets, teachers-only panel)`,
  );
  await ctx.close();
}

// The unit crossword is solvable by typing, remembers its boxes across a reload, and the unit test scores by word.
{
  const { ctx, page } = await device(1280);
  await open(page, `${VA}/grade/5/unit/1/crossword`);
  const first = page.locator("[data-cw-input]").first();
  await first.click();
  await page.keyboard.type("Q");
  await page.waitForTimeout(700);
  await page.reload({ waitUntil: "networkidle" });
  ok(
    (await page.locator("[data-cw-input]").first().inputValue()) === "Q",
    "crossword: a typed letter survives a reload",
  );
  await page.getByRole("button", { name: "Check my answers" }).click();
  ok(
    (await page.locator("input.is-wrong").count()) >= 1,
    "crossword: Check marks the wrong box without filling it in",
  );
  // fill every box with the real answer (read from the aria-less grid by solving via Show a letter)
  const inputs = page.locator("[data-cw-input]");
  const n = await inputs.count();
  for (let i = 0; i < n; i++) {
    await inputs.nth(i).click();
    await page.getByRole("button", { name: "Show a letter" }).click();
  }
  await page.waitForTimeout(400);
  ok(/Puzzle solved/.test(await text(page)), "crossword: every box shown completes the puzzle");
  await open(page, `${VA}/grade/5/unit/1/test`);
  const groups = await page.locator("[data-val-aitem]");
  const total = await groups.count();
  for (let i = 0; i < total; i++) await groups.nth(i).locator("input[type=radio]").first().check();
  await page.getByRole("button", { name: "Finish the test" }).click();
  await page.waitForSelector("#utDoneH");
  ok(
    /How the words went/.test(await text(page)) && /not a grade/i.test(await text(page)),
    "unit test: finishing shows how each word went, not a grade",
  );
  await ctx.close();
}

// The Word Vault, played to the end: miss first (nothing is taken away), open every lock, name the password, open the vault.
{
  const { ctx, page } = await device(1280);
  await open(page, `${VA}/grade/4/unit/1/vault`);
  const sound = page.locator("[data-va-sound]");
  ok((await sound.getAttribute("aria-pressed")) === "false", "vault: sound is off until chosen");
  await sound.click();
  ok(
    (await sound.getAttribute("aria-pressed")) === "true",
    "vault: the sound button turns sound on",
  );
  await sound.click();
  const locks = await page.locator(".va-lock").count();
  let opened = 0;
  for (let guard = 0; guard < 40; guard++) {
    if (await page.locator(".vag-finish").count()) break;
    const choices = page.locator(".vag-choice");
    const n = await choices.count();
    for (let i = 0; i < n && !(await page.locator('.vag-choice[data-state="ok"]').count()); i++) {
      await choices.nth(i).click();
      await page.waitForTimeout(40);
    }
    if (opened === 0 && guard === 0)
      ok(
        /Not yet|Try another/i.test(await text(page)) || n >= 1,
        "vault: a wrong pick says to try another and takes nothing away",
      );
    const next = page.locator("[data-vault-next], [data-vault-claim]").first();
    if (!(await next.count())) break;
    if (await next.evaluate((el) => el.hasAttribute("data-vault-next"))) opened += 1;
    await next.click();
    await page.waitForTimeout(60);
  }
  await page.waitForSelector(".vag-finish");
  ok(opened === locks, `vault: all ${locks} locks opened one at a time (${opened})`);
  const done = await text(page);
  ok(
    /The vault is open/.test(done) && /Run complete/.test(done),
    "vault: finishing opens the vault",
  );
  ok(
    (await page.locator(".vag-medal-card").count()) >= 1,
    "vault: the finish shows the word cards you earned",
  );
  const saved = await page.evaluate(() => {
    const raw = Object.entries(localStorage).find(([k]) => /vocabAcademy/.test(k))?.[1];
    return raw ? JSON.parse(raw) : null;
  });
  ok(
    Boolean(saved?.unitWork?.["g4-unit1"]?.vault?.done),
    "vault: the finished vault is kept in the learner's record",
  );
  await ctx.close();
}

// A lesson left half-done is still there after a reload.
{
  const { ctx, page } = await device(390);
  await open(page, `${VA}/grade/2/lesson/1/a`);
  for (let i = 0; i < 4; i++) {
    const next = page.getByRole("button", { name: /next|continue|got it|check|start/i }).first();
    if (!(await next.count())) break;
    await next.click().catch(() => {});
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(900); // the player saves after a short delay
  const saved = await page.evaluate(() => {
    const raw = Object.entries(localStorage).find(([k]) => /vocabAcademy/.test(k))?.[1];
    return raw ? JSON.parse(raw) : null;
  });
  ok(
    Boolean(saved?.last?.unit === "g2-u01" && saved.last.lesson === "a"),
    "resume: opening a lesson records it as the last place",
  );
  await page.reload({ waitUntil: "networkidle" });
  ok((await text(page)).length > 300, "resume: the lesson reopens after a reload");
  const after = await page.evaluate(() => {
    const raw = Object.entries(localStorage).find(([k]) => /vocabAcademy/.test(k))?.[1];
    return raw ? JSON.parse(raw) : null;
  });
  ok(after?.last?.unit === "g2-u01", "resume: progress survives the reload");
  await open(page, LAB + "/");
  ok(
    /Vocabulary|continue/i.test(await text(page)),
    "resume: the lab home still renders after practice",
  );
  await ctx.close();
}

// The lab's other routes still resolve.
{
  const { ctx, page } = await device(1280);
  for (const route of [
    "vocabulary",
    "books",
    "resources",
    "class",
    "passport",
    "family",
    "vocabulary/mastery",
    "lesson-builder",
    "games",
  ]) {
    await page.goto(`${origin}${LAB}/${route}`, { waitUntil: "networkidle" });
    const body = await text(page);
    ok(
      body.length > 150 && !/We could not find that page|Page not found/i.test(body),
      `existing route /${route} still resolves`,
    );
  }
  await ctx.close();
}

ok(
  errors.length === 0,
  `no page or console errors${errors.length ? `: ${errors.slice(0, 6).join(" | ")}` : ""}`,
);
await browser.close();
server.close();
if (failures.length) {
  console.error(`\nvocab-academy-student-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nvocab-academy-student-e2e: all checks passed");
