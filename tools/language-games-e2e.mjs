#!/usr/bin/env node
/**
 * Language Games (/language-games): the hub lists four flagship games; chapters unlock in order; the first chapter of
 * every game is played end to end in grades 6-8 and one game in grades 3-5, with a wrong-then-right path (clue, then
 * rule, never the answer) on choose, sort and write steps; progress survives a reload; Spanish help marks a step
 * supported; story flags from Conversation Quest are saved; the Newsroom front page goes to Book Studio; ledger entries
 * are written; axe on the hub, a map, a step and an artifact; no sideways scroll at 390px; no drag-only controls.
 * `--shots <dir>` saves screenshots at 1280 and 390px. BASE=<url> to point elsewhere.
 */
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("language-games-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 3);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}

const shotsArg = process.argv.indexOf("--shots");
const SHOTS = shotsArg > 0 ? process.argv[shotsArg + 1] : "";
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

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
function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
    if (!existsSync(file) && existsSync(join(REPO_ROOT, "public", p)))
      file = join(REPO_ROOT, "public", p);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
        file = join(REPO_ROOT, "access-practice-lab/index.html");
      else {
        res.writeHead(404);
        return res.end();
      }
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const LAB = "/access-practice-lab";
let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
const browser = await chromium.launch();
const errors = [];
const settle = async (page) => {
  await page.waitForFunction(() => !document.querySelector(".is-entering"));
  await page.waitForTimeout(250);
};
async function axe(page, sel, name) {
  if (!AxeBuilder) return;
  await settle(page);
  const r = await new AxeBuilder({ page })
    .include(sel)
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  ok(
    bad.length === 0,
    `axe: ${name} ${bad.map((v) => `${v.id}(${v.nodes.length}) ${v.nodes[0]?.target}`).join(" ")}`,
  );
}
const shot = async (page, name) => {
  if (!SHOTS) return;
  await settle(page);
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
};

/** The step on screen, read from the same content module the page uses. */
async function currentStep(page, gameId, band, chapterId) {
  const id = await page.locator(".lg-step[data-step]").getAttribute("data-step");
  return page.evaluate(
    async ([g, b, c, s]) => {
      const E = await import("/access-practice-lab/src/flagship/engine.js");
      const ch = E.chaptersOf(E.gameById(g), b).find((x) => x.id === c);
      return JSON.parse(JSON.stringify(ch.steps.find((x) => x.id === s)));
    },
    [gameId, band, chapterId, id],
  );
}
const fb = (page) => page.locator(".lg-fb").innerText();

/** Answer the step correctly (choose: the ok option; sort: every item; write: the model). */
async function solve(page, step) {
  if (step.type === "choose")
    await page.check(`.lg-opt input[value="${step.options.find((o) => o.ok).id}"]`);
  else if (step.type === "sort")
    for (const it of step.items) {
      await page.selectOption(`[data-item="${it.id}"][data-part="cat"]`, it.cat);
      if (step.reasons)
        await page.selectOption(`[data-item="${it.id}"][data-part="reason"]`, it.reason);
    }
  else await page.fill("[data-lg-text]", step.model);
  await page.click("[data-lg-check]");
  await page.waitForSelector("[data-lg-next]");
}
async function playChapter(page, gameId, band, chapterId, { wrongFirst = false, shots = "" } = {}) {
  const tried = new Set();
  for (let guard = 0; guard < 30; guard++) {
    if (await page.locator(".lg-done").count()) return true;
    const step = await currentStep(page, gameId, band, chapterId);
    if (wrongFirst && !tried.has(step.type)) {
      tried.add(step.type);
      if (step.type === "choose") {
        const wrong = step.options.find((o) => !o.ok);
        const right = step.options.find((o) => o.ok);
        await page.check(`.lg-opt input[value="${wrong.id}"]`);
        await page.click("[data-lg-check]");
        const f = await fb(page);
        ok(
          /Clue/.test(f) && !f.includes(`“${right.text}”`),
          `${gameId} ${band}: a wrong choice gets a clue, not the answer`,
        );
        await page.check(`.lg-opt input[value="${wrong.id}"]`);
        await page.click("[data-lg-check]");
        ok(/Rule/.test(await fb(page)), `${gameId} ${band}: a second wrong choice gets the rule`);
      } else if (step.type === "sort") {
        for (const it of step.items) {
          const other = step.cats.find((c) => c.id !== it.cat).id;
          await page.selectOption(`[data-item="${it.id}"][data-part="cat"]`, other);
          if (step.reasons)
            await page.selectOption(
              `[data-item="${it.id}"][data-part="reason"]`,
              step.reasons[0].id,
            );
        }
        await page.click("[data-lg-check]");
        ok(
          (await page.locator(".lg-sort-item.is-wrong .lg-item-clue").count()) >= 1,
          `${gameId} ${band}: wrong sorts are marked with a clue (icon and words)`,
        );
      } else {
        await page.fill("[data-lg-text]", step.prompt);
        await page.click("[data-lg-check]");
        const f = await fb(page);
        ok(
          /Clue|Rule/.test(f) && !f.includes(step.model),
          `${gameId} ${band}: copying the question gets a clue, not the model`,
        );
        if (shots) await shot(page, `${shots}-write-clue`);
      }
    }
    await solve(page, step);
    if (shots && step.type === "write" && guard < 3) await shot(page, `${shots}-write-right`);
    await page.click("[data-lg-next]");
    await page.waitForTimeout(80);
  }
  return false;
}

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (e) => !/web-vitals/.test(String(e)) && errors.push(e.stack || String(e)));
  const go = async (path) => {
    await page.goto(`${origin}${LAB}/${path}`);
    await page.waitForSelector("#app h1", { timeout: 15000 });
  };

  // Hub
  await go("language-games?grades=6-8");
  ok((await page.locator(".lg-card").count()) === 4, "hub lists four games");
  ok(
    (await page.locator(".lg-card .lg-art-bg").count()) === 4,
    "every game card has its scene art",
  );
  await axe(page, ".lg-hub", "hub");
  await shot(page, "hub-1280");

  // Escape room map: room 1 open, room 2 locked (not a link)
  await go("language-games/escape-room?grades=6-8");
  ok(
    (await page.locator(".lg-path-item.is-open a").count()) === 1,
    "escape room: the first room is open",
  );
  ok(
    (await page.locator(".lg-path-item.is-locked [aria-disabled]").count()) === 2,
    "escape room: later rooms are locked and not links",
  );
  await axe(page, ".lg-game", "escape room map");
  await shot(page, "escape-map-1280");
  await go("language-games/escape-room/er68-archive?grades=6-8");
  ok(
    (await page.locator(".lg-doc").count()) === (await page.locator(".lg-doc [data-say]").count()),
    "every evidence document can be read aloud",
  );
  ok((await page.locator("[draggable='true']").count()) === 0, "no drag-only controls");
  await shot(page, "escape-step-1280");
  await axe(page, ".lg-play", "escape room step");

  // Spanish help marks the step supported and explains without the answer
  await page.click("[data-lg-help]");
  ok((await page.locator(".lg-help[lang='es']").count()) === 1, "Spanish help opens in Spanish");
  ok(
    !/118/.test(await page.locator(".lg-help").innerText()),
    "Spanish help does not state the code",
  );

  // Play room 1 with a wrong-then-right path, reload mid-way to prove resume
  const first = await currentStep(page, "escape-room", "6-8", "er68-archive");
  await solve(page, first);
  await page.click("[data-lg-next]");
  await page.fill("[data-lg-text]", "The code is because I think so.");
  await page.click("[data-lg-check]");
  ok(
    /Clue/.test(await fb(page)) && !/1:15/.test(await fb(page)),
    "escape room: a vague explanation gets a clue about what is missing",
  );
  await shot(page, "escape-write-clue-1280");
  await page.reload();
  await page.waitForSelector(".lg-step");
  const resumed = await page.locator(".lg-step").getAttribute("data-step");
  ok(resumed === "l1-explain", `resume after reload lands on the same step (${resumed})`);
  ok((await page.locator(".lg-locks li").count()) === 4, "escape room shows four locks");
  ok(
    await playChapter(page, "escape-room", "6-8", "er68-archive", { wrongFirst: true }),
    "escape room 6-8: room 1 played to the end",
  );
  await shot(page, "escape-done-1280");
  await go("language-games/escape-room?grades=6-8");
  ok(
    (await page.locator(".lg-path-item.is-done").count()) === 1 &&
      (await page.locator(".lg-path-item.is-open a, .lg-path-item.is-going a").count()) === 1,
    "finishing room 1 unlocks room 2",
  );

  // The other three games, chapter 1 in grades 6-8
  for (const id of ["evidence-detective", "conversation-quest", "newsroom-challenge"]) {
    await go(`language-games/${id}?grades=6-8`);
    const href = await page.locator(".lg-path-item a").first().getAttribute("href");
    const chapterId = href.split("/").pop().split("?")[0];
    await go(href.replace(`${LAB}/`, ""));
    if (id === "evidence-detective") await shot(page, "detective-step-1280");
    ok(
      await playChapter(page, id, "6-8", chapterId, {
        wrongFirst: true,
        shots: id === "conversation-quest" ? "quest" : "",
      }),
      `${id} 6-8: chapter 1 played to the end`,
    );
    await shot(page, `${id}-done-1280`);
  }
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("accessPracticeLab:v1:flagship") || "{}"),
  );
  ok(
    Object.keys(state["conversation-quest"]?.["6-8"]?.flags || {}).length > 0,
    "conversation quest saves story flags that later encounters read",
  );
  const ledger = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("accessPracticeLab:v1:ledger") || "{}"),
  );
  const mine = (ledger.entries || []).filter((e) => e.src === "flagship");
  ok(mine.length >= 20, `ledger entries written (src flagship: ${mine.length})`);
  ok(
    mine.some((e) => e.stage === "supported") && mine.some((e) => e.stage === "independent"),
    "ledger separates supported and independent attempts",
  );
  ok(
    mine.some((e) => e.kind === "revision"),
    "ledger marks retries as revisions",
  );

  // Grades 3-5: one game end to end
  await go("language-games/evidence-detective?grades=3-5");
  const href35 = await page.locator(".lg-path-item a").first().getAttribute("href");
  await go(href35.replace(`${LAB}/`, ""));
  ok(
    await playChapter(page, "evidence-detective", "3-5", href35.split("/").pop().split("?")[0], {
      wrongFirst: true,
    }),
    "evidence detective 3-5: case 1 played to the end",
  );

  // Newsroom front page → Book Studio
  await go("language-games/newsroom-challenge/log?grades=6-8");
  ok(
    (await page.locator(".lg-art-part dd").count()) >= 3,
    "newsroom front page shows the learner's headline, lead and correction",
  );
  await axe(page, ".lg-artifact", "newsroom artifact");
  await shot(page, "newsroom-log-1280");
  const headline = (await page.locator(".lg-art-part dd").first().innerText())
    .replace(/Hear it/g, "")
    .trim();
  await page.click("[data-lg-book]");
  await page.waitForURL(/book-studio\/edit\//, { timeout: 15000 });
  await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page");
  await page.click('.bk-page-item [data-bk-page="1"]');
  ok(
    (await page.locator(".bk-canvas").innerText()).includes(headline.slice(0, 20)),
    "the newsroom report lands in Book Studio",
  );

  // Phone
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const p2 = await phone.newPage();
  p2.on("pageerror", (e) => !/web-vitals/.test(String(e)) && errors.push(e.stack || String(e)));
  for (const [path, name] of [
    ["language-games?grades=6-8", "hub"],
    ["language-games/escape-room/er68-archive?grades=6-8", "escape-step"],
    ["language-games/conversation-quest?grades=3-5", "quest-map"],
    ["language-games/newsroom-challenge/log?grades=6-8", "newsroom-log"],
  ]) {
    await p2.goto(`${origin}${LAB}/${path}`);
    await p2.waitForSelector("#app h1");
    await settle(p2);
    const over = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(over <= 1, `phone: ${path} has no sideways scroll (${over}px)`);
    if (SHOTS) await p2.screenshot({ path: join(SHOTS, `${name}-390.png`), fullPage: true });
  }
  await phone.close();
} catch (error) {
  failures.push(`crashed: ${error.stack || error}`);
  console.log(`FAIL crashed: ${error.stack || error}`);
} finally {
  await browser.close();
  server?.close();
}
ok(errors.length === 0, `no page errors ${errors.slice(0, 3).join(" | ")}`);
console.log(
  failures.length
    ? `\nlanguage-games-e2e: ${failures.length} FAILED`
    : "\nlanguage-games-e2e: all passed",
);
process.exit(failures.length ? 1 : 0);
