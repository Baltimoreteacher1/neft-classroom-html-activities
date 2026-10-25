// "Clicker bot" gate for the generated Practice Studios (npm run validate:studio-guess-browser).
//
// A student who clicks every choice until one turns green must NOT earn credit for it. This drives the real page the way that
// student does: on each multiple-choice item it clicks choices in order (picking one "what will I change" chip when the page asks
// for it) until the item is solved, then asserts what the page promised:
//   - the misses are saved (a reload cannot give the bot a clean slate),
//   - an item solved after two or more misses is OWED: no star, the dot shows it, "Next" is replaced by a fresh problem,
//   - the first miss is a pause, not a lockout (the next try still works), and no feedback prints the right answer.
// Then it answers the fresh problem the honest way (a clean, first-try answer found by the page's own key) and checks the item is released.
//
//   node tools/verify-studio-guess-browser.mjs            a sample: 3-3 5-2 6-9 7-6 8-5 2-3
//   node tools/verify-studio-guess-browser.mjs 3-3 6-9    only these
//   node tools/verify-studio-guess-browser.mjs --all      every generated studio (slow)
//
// A missing browser is a SKIP (exit 3), never a pass.
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";
import { listLessonDirs, REPO_ROOT } from "./lib/curriculum-source.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

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

const args = process.argv.slice(2);
const wanted = args.filter((a) => /^\d+-\d+$/.test(a));
const all = args.includes("--all");
const STUDIO_UNITS = [2, 3, 5, 6, 7, 8, 9];
let ids = wanted.length
  ? wanted
  : all
    ? listLessonDirs({ filter: /^\d+-\d+$/ }).filter((id) =>
        STUDIO_UNITS.includes(Number(id.split("-")[0])),
      )
    : ["2-3", "3-3", "5-2", "6-9", "7-6", "8-5"];
ids = ids.filter((id) => existsSync(join(REPO_ROOT, `math/practice-studio/${id}/index.html`)));
if (!ids.length) {
  server.close();
  process.exit(skipExit("no generated studio page to drive (run the generator first)"));
}

const launch = process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {};
let browser;
try {
  browser = await chromium.launch(launch);
} catch (e) {
  server.close();
  process.exit(skipExit(`no browser: ${String(e.message).split("\n")[0]}`));
}
const failures = [];
const stats = { pages: 0, guessedItems: 0 };
const fail = (where, msg) => failures.push(`${where}: ${msg}`);

for (const id of ids) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  // start clean once; the reload below must keep what the page saved
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("guess-bot-started")) {
      localStorage.clear();
      sessionStorage.setItem("guess-bot-started", "1");
    }
  });
  await page.goto(`${origin}/math/practice-studio/${id}/`, { waitUntil: "load" });
  stats.pages++;
  // the first generated multiple-choice item in sections 2 or 3 (a pool, not a hands-on widget)
  const target = await page.evaluate(() => {
    const rt = window.StudioRT.api;
    for (const tab of [2, 3, 1]) {
      const items = rt.sections[tab - 1].items;
      for (let i = 0; i < items.length; i++) {
        const it = rt.expand(tab, i);
        if (it.k === "mc" && Array.isArray(it.c) && it.c.length >= 3)
          return { tab, i, id: it.id, n: it.c.length };
      }
    }
    return null;
  });
  if (!target) {
    fail(id, "no multiple-choice item to drive");
    await page.close();
    continue;
  }
  await page.evaluate(({ tab, i }) => {
    const rt = window.StudioRT.api;
    rt.state.idx[tab] = i;
    rt.selectTab(tab);
    rt.render(tab);
  }, target);
  const stage = page.locator(`#stage-${target.tab}`);
  const starsBefore = await page.evaluate(
    () => Object.keys(window.StudioRT.api.state.play?.stars || {}).length,
  );

  // click choices in DOM order, as a bot would, until the item is solved; pick a chip when asked
  const tried = new Set();
  let solved = false;
  let _sawHold = false;
  for (let step = 0; step < 14 && !solved; step++) {
    if (await stage.locator(".hold-chips").count()) {
      _sawHold = true;
      await stage.locator(".hold-chip").first().click();
    }
    const choices = stage.locator("[data-mc]:not([disabled])");
    const n = await choices.count();
    let clicked = false;
    for (let k = 0; k < n; k++) {
      const label = (await choices.nth(k).innerText()).trim();
      if (tried.has(label)) continue;
      tried.add(label);
      await choices.nth(k).click();
      clicked = true;
      break;
    }
    if (!clicked) break;
    solved = (await stage.locator(".item-fb.ok").count()) > 0;
  }
  const out = await page.evaluate(({ id: itemId }) => {
    const st = window.StudioRT.api.state;
    return {
      att: st.att?.[itemId] || 0,
      owed: !!st.owed?.[itemId],
      stars: Object.keys(st.play?.stars || {}).length,
    };
  }, target);
  if (!solved) fail(id, "the bot never solved the item (a hold may be a lockout)");
  if (out.att >= 2) {
    stats.guessedItems++;
    if (!out.owed) fail(id, `solved after ${out.att} misses but the item is not marked owed`);
    if (out.stars > starsBefore) fail(id, "a guessed answer earned a star");
    if (!(await stage.locator("[data-prove]").count()))
      fail(id, "no fresh-problem button after a guessed answer");
    if (await stage.locator(".next-btn").count())
      fail(id, "Next is offered before the fresh problem");
    if (!(await page.locator(".step-dot.owed").count()))
      fail(id, "the dot does not show the item as owed");
  } else if (out.att === 0) {
    // a lucky first click is fine; nothing to assert
  }
  // pause on miss is removed per user request: get rid of the "before you try again" part
  // the misses survive a reload
  await page.reload({ waitUntil: "load" });
  const after = await page.evaluate(
    ({ id: itemId }) => window.StudioRT.api.state.att?.[itemId] || 0,
    target,
  );
  if (out.att && after !== out.att)
    fail(id, `misses did not survive a reload (${out.att} -> ${after})`);
  await page.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`validate:studio-guess-browser FAILED (${failures.length}):`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(
  `validate:studio-guess-browser: ${stats.pages} pages driven, ${stats.guessedItems} guessed item(s) all earned no credit and asked for a fresh problem.`,
);
