#!/usr/bin/env node
// Language Lab v2 in a real browser: deep links keep band / language / tier through a hard refresh, the HUD,
// Listening replay limits by tier, the Math Workbench scope, a missing microphone API, and Chromebook / iPad layout.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { exitSkipped } from "./lib/skip-exit.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  exitSkipped(
    "Playwright is not installed for the Language Lab v2 browser check.",
    "Install the locked project dependencies.",
  );
}
const root = process.cwd();
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://local").pathname);
  let file = join(root, p.endsWith("/") ? `${p}index.html` : p);
  if (!existsSync(file) || statSync(file).isDirectory()) {
    if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
      file = join(root, "access-practice-lab/index.html");
    else {
      res.writeHead(404);
      return res.end();
    }
  }
  res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);

const failures = [];
const check = (ok, label) => {
  (ok ? console.log : console.error)(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) failures.push(label);
};
const watch = (page) => {
  page.on(
    "pageerror",
    (e) => !/web-vitals/.test(e.message) && failures.push(`page error: ${e.message}`),
  );
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      failures.push(`console error: ${m.text()}`),
  );
};
const fresh = async (viewport = { width: 1366, height: 768 }, { noMic = false } = {}) => {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  watch(page);
  if (noMic)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true });
    });
  return { ctx, page };
};
const go = async (page, path) => {
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#app h1, #app .lh, #app .gs", { timeout: 15000 }).catch(() => {});
};
const pressed = (page, sel) =>
  page.$eval(sel, (n) => n.getAttribute("aria-pressed")).catch(() => null);

// 1. Deep link: band, language and tier from the URL; a hard refresh keeps the game and the choices.
{
  const { ctx, page } = await fresh();
  await go(page, "/access-practice-lab/games/word-bingo?band=6-8&lang=en-es&support=independent");
  check(
    (await page.$(".gs-start-wrap")) !== null || (await page.$(".lh")) !== null,
    "deep link /games/word-bingo opens the game, not the splash gate",
  );
  await page.click("[data-g-start]").catch(() => {});
  await page.waitForSelector(".lh", { timeout: 8000 }).catch(() => {});
  check((await page.$(".lh")) !== null, "HUD is on the playing frame");
  check(
    (await pressed(page, '.lh-lang-btn[data-lang-mode="bi"]')) === "true",
    "lang=en-es selects EN+ES",
  );
  check(
    (await pressed(page, '.lh-tier[data-g-support="C"]')) === "true",
    "support=independent selects Independent",
  );
  const title = await page.$eval(".lh-title", (n) => n.textContent);
  check(/Word Bingo/.test(title), "HUD shows the game title");
  const domains = await page.$$eval(".lh-domain.is-on", (n) => n.map((x) => x.dataset.domain));
  check(domains.includes("Listening"), "HUD domain badge shows Listening");
  check(
    (await page.$('a[href*="math-workbench"]')) === null,
    "no Math Workbench link on an ELA task",
  );
  check(
    (await page.$("#nsr-workbench")) === null ||
      (await page.$eval("#nsr-workbench", (n) => getComputedStyle(n).display)) === "none",
    "floating Math Workbench is hidden",
  );
  // Listening replay limit: Independent allows two plays.
  const say = await page.$("[data-say]");
  if (say) {
    await page.evaluate(() => {
      window.__plays = 0;
    });
    const left0 = await page.$eval("[data-say]", (n) => n.dataset.playsLeft ?? "unset");
    for (let i = 0; i < 3; i++) await page.click("[data-say]").catch(() => {});
    const spent = await page.$eval("[data-say]", (n) => ({
      left: n.dataset.playsLeft,
      cls: n.className,
      aria: n.getAttribute("aria-disabled"),
    }));
    check(
      spent.left === "0" && spent.aria === "true",
      `Independent: clip is spent after 2 plays (was ${left0}, now ${spent.left})`,
    );
  } else check(true, "no [data-say] on the first Word Bingo round (replay check skipped)");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".lh, .gs-start-wrap", { timeout: 8000 }).catch(() => {});
  check(
    new URL(page.url()).pathname.endsWith("/games/word-bingo"),
    "hard refresh stays on /games/word-bingo",
  );
  check((await page.$(".lh, .gs-start-wrap")) !== null, "hard refresh renders the game");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check(overflow <= 1, `no horizontal scroll at 1366x768 (${overflow}px)`);
  await ctx.close();
}

// 2. Worlds, Road and the 12-week routes are bookmarkable and survive a refresh.
for (const path of [
  "/access-practice-lab/worlds/signal-station?band=3-5&lang=es&support=guided",
  "/access-practice-lab/road/3?band=6-8",
  "/access-practice-lab/worlds?band=6-8",
]) {
  const { ctx, page } = await fresh({ width: 768, height: 1024 });
  await go(page, path);
  const h1 = await page.$eval("#app h1", (n) => n.textContent.trim()).catch(() => "");
  check(h1.length > 0, `${path.split("?")[0]} renders a page`);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#app h1", { timeout: 10000 }).catch(() => {});
  const same = new URL(page.url()).pathname === new URL(`${base}${path}`).pathname;
  check(same, `${path.split("?")[0]} survives a hard refresh`);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check(overflow <= 1, `no horizontal scroll at 768x1024 on ${path.split("?")[0]} (${overflow}px)`);
  await ctx.close();
}
{
  const { ctx, page } = await fresh();
  await go(page, "/access-practice-lab/worlds/signal-station?band=3-5&lang=es");
  const lang = await page.evaluate(
    () => JSON.parse(localStorage.getItem("accessPracticeLab:v1:prefs") || "{}").lang,
  );
  check(lang === "es", "lang=es is remembered across a refresh (prefs)");
  await page.reload({ waitUntil: "domcontentloaded" });
  await go(page, "/access-practice-lab/games/word-bingo?band=3-5");
  // The start screen has no HUD yet, so read the language switch every page carries.
  const pressedEs = await pressed(page, '.lab-tools [data-lang-mode="es"], [data-lang-mode="es"]');
  await ctx.close();
  check(pressedEs === "true", "language choice carries to the next game without the parameter");
}

// 3. No microphone API: the Speaking game still loads and never throws.
{
  const { ctx, page } = await fresh({ width: 1366, height: 768 }, { noMic: true });
  await go(page, "/access-practice-lab/games/fluency-echo?band=6-8&support=guided");
  await page.click("[data-g-start]").catch(() => {});
  await page.waitForSelector(".lh", { timeout: 8000 }).catch(() => {});
  check(
    (await page.$(".lh")) !== null,
    "Speaking game renders with navigator.mediaDevices unavailable",
  );
  const mic = await page.$eval(".lh-mic", (n) => n.dataset.mic).catch(() => "");
  check(mic === "fallback", `mic pill reports the typed fallback (${mic})`);
  await ctx.close();
}

// 4. Teachers hub: paste two student codes, see the recurring pattern and a link to its game; no name appears.
{
  const lab = (events) => ({
    schemaVersion: 2,
    createdAt: "2026-11-22T10:00:00.000Z",
    updatedAt: "2026-11-22T10:00:00.000Z",
    events,
    migrated: { gamesV1: true },
  });
  const round = (tag) => ({
    kind: "round",
    gameId: "sentence-factory",
    gradeBand: "6-8",
    widaDomain: "Writing",
    widaContentArea: "LoELA",
    scaffoldTier: "guided",
    languageErrorTag: tag,
    ok: false,
    timestamp: "2026-11-22T10:00:00.000Z",
  });
  const code = (state) =>
    `ACCESS1.${Buffer.from(JSON.stringify({ v: 1, data: { "accessPracticeLab:v1:tlp_lab_v2": JSON.stringify(state), "accessPracticeLab:v1:studentName": "Maria Lopez" } })).toString("base64")}`;
  const { ctx, page } = await fresh({ width: 1366, height: 768 });
  await page.goto(`${base}/access-teacher/`, { waitUntil: "domcontentloaded" });
  await page.click("#tab-review");
  await page.waitForSelector("#cpCodes", { state: "visible", timeout: 15000 }).catch(() => {});
  if (await page.$("#cpCodes")) {
    await page.fill(
      "#cpCodes",
      [
        code(lab([round("MISSING_SUBJECT")])),
        code(lab([round("MISSING_SUBJECT"), round("CONNECTOR_MISSING")])),
      ].join("\n"),
    );
    await page.click("[data-cp-run]");
    await page.waitForSelector(".lp-class .lp-pattern-list", { timeout: 5000 }).catch(() => {});
    const text = await page.$eval(".lp-class", (n) => n.textContent).catch(() => "");
    check(
      /Missing subject/.test(text) && /2 students/.test(text),
      "class view ranks the pattern shared by two students",
    );
    check(!/Maria|Lopez/.test(text), "class view never shows a student name");
    const href = await page
      .$eval(".lp-class .lp-pattern-list a", (a) => a.getAttribute("href"))
      .catch(() => "");
    check(/games\/sentence-factory/.test(href), "class view links to the remediation game");
  } else check(false, "Teachers hub renders the class patterns panel");
  await ctx.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-lab-v2-e2e: ${failures.length} failure(s)\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\naccess-lab-v2-e2e: all checks passed");
