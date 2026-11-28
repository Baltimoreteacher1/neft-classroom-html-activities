#!/usr/bin/env node
/**
 * Math Literacy Studio: the twelve reasoning games (access-practice-lab/src/mls/games.js), proved in three layers.
 *   node tools/mls-games-check.mjs [--quick] [--no-browser] [--skip-jsdom] [--grades 1,3,6,8] [--only <game id>] [--keep-going]
 *
 *  1. PURE (node): exactly the twelve inventory game ids; every skill has at least three eligible games; the family-specific games are
 *     eligible for exactly the families the directive names; defaultGameFor always names an eligible game.
 *  2. JSDOM: every eligible (skill, game) pair is mounted and PLAYED TO THE END through its own controls (the page's `peek()` says which
 *     choice is right), at rotating language bands and levels; storage holds only counts and only when asked; no timer words anywhere.
 *  3. CHROMIUM (Playwright, real clicks and keys): all twelve games for a skill in grades 1, 3, 6 and 8, at a 375px phone width, asserting
 *     no timer text, hints in order (conceptual, procedural, worked parallel example, then a new problem) with the answer never in the
 *     feedback, difficulty words after 3 clean rounds and after 2 misses, the end screen, no horizontal overflow, Tab reaching the
 *     controls and Enter answering, axe serious/critical = 0 and no animation under prefers-reduced-motion. Screenshots go to /tmp/mls-games/.
 * A missing browser is a SKIP locally and a FAIL in CI. Exit code 1 on any failure.
 */
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LAB = join(ROOT, "access-practice-lab");
const require = createRequire(join(ROOT, "package.json"));
const OUT = process.env.MLS_GAMES_OUT || "/tmp/mls-games";
mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d = "") => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const QUICK = flag("quick");
const KEEP_GOING = flag("keep-going");
const GRADES = opt("grades", "1,3,6,8").split(",").map(Number);
const ONLY = opt("only", "");

const results = [];
const failures = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: Boolean(ok) });
  if (!ok) failures.push(name);
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `\n        ${String(detail).replace(/\n/g, "\n        ")}`}`,
  );
}
const warn = (m) => console.log(`WARN  ${m}`);
const group = (name, fn) => {
  const before = failures.length;
  return Promise.resolve(fn()).then(() => {
    if (failures.length > before && !KEEP_GOING) {
      console.log(`\n${failures.length - before} failure(s) in ${name}.`);
    }
  });
};

/* ------------------------------------------------------------------ the content: inventory and every authored grade file */

const { mergeSkill } = await import(pathToFileURL(join(LAB, "src/mls/merge.js")).href);
const inventory = JSON.parse(readFileSync(join(LAB, "content/mls/inventory.json"), "utf8"));
const authored = {};
for (let g = 1; g <= 8; g++) {
  const f = join(LAB, `content/mls/skills/g${g}.json`);
  if (existsSync(f))
    authored[g] = new Map(JSON.parse(readFileSync(f, "utf8")).skills.map((s) => [s.id, s]));
}
const skills = inventory.skills.map((inv) => {
  const c = authored[inv.grade]?.get(inv.id);
  return c ? mergeSkill(inv, c) : { ...inv, familyId: inv.family, family: undefined };
});
const noContent = skills.filter((s) => !authored[s.grade]?.get(s.id));
if (noContent.length)
  warn(
    `${noContent.length} skills have no authored content yet (inventory only); the games must still play: ${noContent
      .map((s) => s.id)
      .slice(0, 6)
      .join(", ")}${noContent.length > 6 ? ", ..." : ""}`,
  );

const { GAMES, defaultGameFor } = await import(pathToFileURL(join(LAB, "src/mls/games.js")).href);
const { FAMILIES, generate } = await import(pathToFileURL(join(LAB, "src/mls/families.js")).href);
const gameIds = Object.keys(GAMES);
const hasFamily = (s) => Boolean(FAMILIES[s.familyId]);
const missingFamilies = [...new Set(skills.filter((s) => !hasFamily(s)).map((s) => s.familyId))];
if (missingFamilies.length)
  warn(
    `${missingFamilies.length} problem families are not generated yet (${missingFamilies.slice(0, 8).join(", ")}${missingFamilies.length > 8 ? ", ..." : ""}); skills that use them play from authored content only.`,
  );

/* ------------------------------------------------------------------ 1. pure checks */

const SETS = {
  "fraction-architect": ["fracid", "fracline", "fracequiv", "fracops"],
  "ratio-design": ["ratio", "unitrate", "percent", "proportional", "scale"],
  "graph-detective": ["bargraph", "lineplot", "coordinate", "scatter", "stats", "indepdep"],
  "data-lab": ["lineplot", "stats", "sampling", "scatter", "probability"],
  "number-explorer": [
    "numrel",
    "patterns",
    "properties",
    "factors",
    "multcompare",
    "exprs",
    "tensones",
    "expanded",
    "compare",
  ],
};
await group("pure", () => {
  const want = inventory.games.map((g) => g.id).sort();
  check(
    "GAMES has exactly the twelve inventory game ids",
    JSON.stringify(gameIds.slice().sort()) === JSON.stringify(want),
    `have ${gameIds.join(", ")}`,
  );
  for (const id of gameIds) {
    const g = GAMES[id];
    const inv = inventory.games.find((x) => x.id === id);
    check(
      `${id}: title matches the inventory, has a blurb, eligible() and mount()`,
      g.title === inv?.title &&
        typeof g.blurb === "string" &&
        g.blurb.length > 10 &&
        typeof g.eligible === "function" &&
        typeof g.mount === "function",
      `title ${g.title} vs ${inv?.title}`,
    );
  }
  let bad = [];
  for (const s of skills) {
    const el = gameIds.filter((id) => GAMES[id].eligible(s));
    if (el.length < 3) bad.push(`${s.id} (${el.length})`);
  }
  check(
    `every one of ${skills.length} skills has at least 3 eligible games`,
    !bad.length,
    bad.join(", "),
  );
  bad = [];
  for (const s of skills)
    for (const [id, fams] of Object.entries(SETS))
      if (GAMES[id].eligible(s) !== fams.includes(s.familyId)) bad.push(`${s.id}/${id}`);
  check(
    "the family-specific games are eligible for exactly the families named in the directive",
    !bad.length,
    bad.slice(0, 8).join(", "),
  );
  bad = [];
  for (const id of [
    "vocab-quest",
    "wp-investigator",
    "equation-escape",
    "rep-match",
    "misconception-detective",
    "debate-challenge",
    "strategy-showdown",
  ])
    for (const s of skills) if (!GAMES[id].eligible(s)) bad.push(`${s.id}/${id}`);
  check(
    "the seven general games are eligible for every skill",
    !bad.length,
    bad.slice(0, 8).join(", "),
  );
  bad = [];
  for (const s of skills) {
    const d = defaultGameFor(s);
    if (!GAMES[d] || !GAMES[d].eligible(s) || defaultGameFor(s) !== d) bad.push(`${s.id} -> ${d}`);
  }
  check(
    "defaultGameFor names a stable, eligible game for every skill",
    !bad.length,
    bad.slice(0, 8).join(", "),
  );
  const byDefault = new Map();
  for (const s of skills)
    byDefault.set(defaultGameFor(s), (byDefault.get(defaultGameFor(s)) || 0) + 1);
  console.log(`      defaults: ${[...byDefault].map(([k, v]) => `${k} ${v}`).join(", ")}`);
  check(
    "defaultGameFor for an empty skill is safe",
    GAMES[defaultGameFor({})] && GAMES[defaultGameFor(null)],
  );
});

/* ------------------------------------------------------------------ 2. jsdom: mount and play every pair to the end */

// Clock times such as 7:30 and "coins" in a money lesson are mathematics, so this scans only the game's own chrome (the bar, notes,
// feedback, panels and buttons), never the problem text, for the words that would turn a game into a race or a shop.
const CHROME =
  ".ml-gm-how, .ml-gm-note, .ml-gm-bar, .ml-gm-prefs, .ml-gm-roundhead, .ml-gm-done, .ml-gm-fb, .ml-gm-levelnote, .ml-gm-endlist, .ml-gm-endbtns, .ml-gm-worked, .ml-gm-promptrow .btn";
const TIMER_WORDS =
  /\b(timer|countdown|stopwatch|seconds? left|time left|time remaining|hurry|speed bonus|leaderboard|high score|coins?|streak|avatar)\b/i;
const BANDS = ["1-2", "3-4", "5-6"];
const COMBOS = [
  ["1-2", 1],
  ["3-4", 2],
  ["5-6", 3],
  ["3-4", 1],
  ["1-2", 3],
  ["5-6", 2],
  ["3-4", 3],
  ["1-2", 2],
  ["5-6", 1],
];

if (!flag("skip-jsdom"))
  await group("jsdom", async () => {
    const { JSDOM } = require("jsdom");
    const dom = new JSDOM("<!doctype html><html lang=en><body></body></html>", {
      url: "http://localhost/",
    });
    const g = globalThis;
    g.window = dom.window;
    g.document = dom.window.document;
    g.localStorage = dom.window.localStorage;
    g.CustomEvent = dom.window.CustomEvent;
    g.history = dom.window.history;
    g.Node = dom.window.Node;

    const wrapOf = (el) =>
      [...el.querySelectorAll(".ml-gm-stepwrap")].find((w) => w.dataset.done !== "1");
    const setNum = (input, v) => {
      input.value = String(v);
      input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    };
    /** Play to the end by clicking the right choice each time; returns { rounds, timerHit, steps }. */
    function autoplay(el, handle) {
      let guard = 0;
      let steps = 0;
      let timerHit = "";
      const seen = new Set();
      while (!handle.state.ended && guard++ < 900) {
        const t = [...el.querySelectorAll(CHROME)].map((n) => n.textContent).join(" ");
        const m = t.match(TIMER_WORDS);
        if (m && !timerHit) timerHit = m[0];
        const pk = handle.peek();
        if (pk) {
          const w = wrapOf(el);
          if (!w) throw new Error("no open step wrapper");
          steps++;
          if (pk.type === "mc") {
            const btns = w.querySelectorAll(".ml-gm-opt");
            if (btns.length !== pk.n) throw new Error(`option count ${btns.length} vs ${pk.n}`);
            seen.add(btns[pk.correct].textContent);
            btns[pk.correct].click();
          } else if (pk.kind === "explore") {
            const inc = w.querySelector('.ml-gm-sbtn[aria-label^="Increase"]');
            for (let i = 0; i < pk.needed; i++) inc.click();
            w.querySelector(".ml-gm-btn.primary").click();
          } else {
            const inputs = [...w.querySelectorAll(".ml-gm-num")];
            Object.values(pk.solution).forEach((v, i) => setNum(inputs[i], v));
            w.querySelector(".ml-gm-btn.primary").click();
          }
          continue;
        }
        const next = el.querySelector(".ml-gm-done .ml-gm-btn.primary");
        if (next) {
          next.click();
          continue;
        }
        throw new Error(`stuck: no step and no Next button (${el.textContent.slice(-120)})`);
      }
      if (!handle.state.ended) throw new Error("did not reach the end screen");
      return { steps, timerHit };
    }

    let plays = 0;
    let mounts = 0;
    const errors = [];
    const timerHits = [];
    const t0 = Date.now();
    let pairIdx = 0;
    const fams = new Set();
    for (const s of skills) {
      for (const id of gameIds) {
        if (ONLY && id !== ONLY) continue;
        if (!GAMES[id].eligible(s)) continue;
        pairIdx++;
        const fullSweep = !fams.has(`${s.familyId}|${id}`);
        fams.add(`${s.familyId}|${id}`);
        const combos = fullSweep && !QUICK ? COMBOS : [COMBOS[pairIdx % COMBOS.length]];
        for (const [band, level] of combos) {
          const el = document.createElement("div");
          document.body.append(el);
          try {
            const handle = GAMES[id].mount(el, {
              skill: s,
              band,
              level,
              seed: 1 + (pairIdx % 5),
              ctx: s.contexts?.[0] || "store",
              support: "standard",
            });
            mounts++;
            if (!/Round 1 of [678]/.test(el.textContent))
              throw new Error(`no "Round 1 of N": ${el.textContent.slice(0, 100)}`);
            if (combos.length > 1 && band !== "3-4") {
              handle.destroy();
              continue;
            }
            const r = autoplay(el, handle);
            plays++;
            if (r.timerHit) timerHits.push(`${s.id}/${id}: ${r.timerHit}`);
            const end = el.textContent;
            if (
              !/You finished all [678] rounds/.test(end) ||
              !/Play again/.test(end) ||
              !/Back/.test(end)
            )
              throw new Error("end screen incomplete");
            if (!/You explained why in [678] of [678] rounds/.test(end))
              throw new Error(`end screen does not praise the reasoning: ${end.slice(-300)}`);
            handle.destroy();
            if (el.childNodes.length) throw new Error("destroy() left DOM behind");
          } catch (e) {
            errors.push(`${s.id}/${id} (${band}, level ${level}): ${e.message}`);
          }
          el.remove();
        }
      }
    }
    check(
      `jsdom: ${mounts} mounts and ${plays} full plays (every eligible skill x game) ended cleanly in ${((Date.now() - t0) / 1000).toFixed(1)}s`,
      !errors.length,
      errors.slice(0, 8).join("\n"),
    );
    check(
      "jsdom: no timer, countdown, speed, coin, avatar or streak word on screen in any play",
      !timerHits.length,
      timerHits.slice(0, 6).join("\n"),
    );

    // storage: only counts, only when asked
    const KEY = "accessPracticeLab:v1:mls:play";
    const sk = skills.find((s) => s.id === "g6.ratios") || skills[0];
    localStorage.clear();
    let el = document.createElement("div");
    document.body.append(el);
    let handle = GAMES["vocab-quest"].mount(el, { skill: sk, band: "3-4", level: 2, seed: 2 });
    const boxes = [...el.querySelectorAll('.ml-gm-prefs input[type="checkbox"]')];
    check(
      "a sound toggle and a remember box exist and both start off",
      boxes.length === 2 && boxes.every((b) => !b.checked),
    );
    const playOne = () => {
      for (let i = 0; i < 40 && !el.querySelector(".ml-gm-done"); i++) {
        const pk = handle.peek();
        if (!pk) break;
        wrapOf(el).querySelectorAll(".ml-gm-opt")[pk.correct].click();
      }
    };
    playOne();
    check(
      "nothing is stored while 'Remember my rounds' is off",
      localStorage.getItem(KEY) === null,
    );
    el.querySelector(".ml-gm-done .ml-gm-btn.primary").click();
    boxes[1].checked = true;
    boxes[1].dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    boxes[0].checked = true;
    boxes[0].dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    playOne();
    const stored = JSON.parse(localStorage.getItem(KEY) || "null");
    check(
      "with it on, only a count per skill and game is stored (no name, no identity)",
      stored &&
        Object.values(stored).every((v) => Number.isInteger(v)) &&
        Object.keys(stored).every((k) => /^g\d\.[a-z]+\|[a-z-]+$/.test(k)),
      JSON.stringify(stored),
    );
    handle.destroy();
    el.remove();
    // a broken localStorage must not break a game
    const real = g.localStorage;
    g.localStorage = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    el = document.createElement("div");
    document.body.append(el);
    let ok = true;
    try {
      handle = GAMES["rep-match"].mount(el, { skill: sk, band: "3-4", level: 2, seed: 4 });
      el.querySelectorAll('.ml-gm-prefs input[type="checkbox"]')[1].checked = true;
      el.querySelectorAll('.ml-gm-prefs input[type="checkbox"]')[1].dispatchEvent(
        new dom.window.Event("change", { bubbles: true }),
      );
      autoplay(el, handle);
    } catch (e) {
      ok = false;
      console.log(e.stack);
    }
    g.localStorage = real;
    check("blocked storage never breaks a game", ok);
    el.remove();
  });

/* ------------------------------------------------------------------ 3. Chromium */

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
const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Games check</title>
<link rel="stylesheet" href="/access-practice-lab/ds.css"><link rel="stylesheet" href="/access-practice-lab/acc.css"><link rel="stylesheet" href="/access-practice-lab/mls.css"></head>
<body><main id="main"><div class="ml-page ml-play" id="host"><h1>Games check</h1><section class="panel ml-stage" id="stage" aria-label="Game"></section></div></main>
<script type="module">
import { mergeSkill } from "/access-practice-lab/src/mls/merge.js";
import { GAMES } from "/access-practice-lab/src/mls/games.js";
window.__ready = (async () => {
  const inv = await (await fetch("/access-practice-lab/content/mls/inventory.json")).json();
  const by = {};
  for (let g = 1; g <= 8; g++) { const r = await fetch("/access-practice-lab/content/mls/skills/g" + g + ".json"); if (r.ok) by[g] = new Map((await r.json()).skills.map((s) => [s.id, s])); }
  window.__skills = Object.fromEntries(inv.skills.map((s) => [s.id, by[s.grade]?.get(s.id) ? mergeSkill(s, by[s.grade].get(s.id)) : { ...s, familyId: s.family, family: undefined }]));
  window.__mount = (game, id, o) => {
    window.__h?.destroy();
    const sk = window.__skills[id];
    const host = document.getElementById("host");
    host.className = "ml-page ml-play " + (sk.grade <= 2 ? "ml-g12" : sk.grade <= 5 ? "ml-g35" : "ml-g68");
    document.getElementById("stage").replaceChildren();
    window.__h = GAMES[game].mount(document.getElementById("stage"), { skill: sk, ctx: sk.contexts?.[0] || "store", ...o });
    return true;
  };
  return true;
})();
</script></body></html>`;

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    if (url === "/__games.html") {
      res.writeHead(200, { "content-type": TYPES[".html"] });
      res.end(PAGE);
      return;
    }
    let file = null;
    if (url.startsWith("/access-practice-lab/"))
      file = join(LAB, url.slice("/access-practice-lab/".length));
    else file = join(ROOT, "public", url);
    if (file && existsSync(file) && statSync(file).isFile()) {
      res.writeHead(200, {
        "content-type": TYPES[extname(file)] || "application/octet-stream",
        "cache-control": "no-store",
      });
      createReadStream(file).pipe(res);
    } else {
      res.writeHead(404);
      res.end("not found");
    }
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r(server)));
}

const tokenIn = (text, tok) =>
  Boolean(tok) &&
  new RegExp(
    `(^|[^\\w./])${String(tok).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\w./])`,
    "i",
  ).test(String(text));

async function browserPart() {
  let chromium;
  let AxeBuilder;
  try {
    ({ chromium } = require("playwright"));
  } catch {
    console.log("SKIP  chromium: playwright is not installed.");
    if (process.env.CI) failures.push("playwright missing in CI");
    return;
  }
  try {
    AxeBuilder =
      require("@axe-core/playwright").AxeBuilder || require("@axe-core/playwright").default;
  } catch {
    warn("@axe-core/playwright is not installed; axe is skipped");
  }
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.PW_CHROMIUM_PATH || "/opt/pw-browsers/chromium",
      args: ["--no-sandbox"],
    });
  } catch {
    try {
      browser = await chromium.launch({ args: ["--no-sandbox"] });
    } catch (e) {
      console.log(
        `SKIP  chromium: no browser could be started (${String(e.message).split("\n")[0]})`,
      );
      server.close();
      if (process.env.CI) failures.push("no browser in CI");
      return;
    }
  }
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text()))
      consoleErrors.push(m.text());
  });
  await page.goto(`${base}/__games.html`);
  await page.evaluate(() => window.__ready);

  const overflow = () =>
    page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const peek = () =>
    page.evaluate(() => ({
      ended: window.__h.state.ended,
      round: window.__h.state.round,
      pk: window.__h.peek(),
      done: Boolean(document.querySelector(".ml-gm-done")),
      worked: Boolean(document.querySelector(".ml-gm-worked")),
      level: document.querySelector(".ml-gm")?.dataset.level,
    }));
  const openWrap = (n = 0) => page.locator('.ml-gm-stepwrap:not([data-done="1"])').nth(n);
  const fbText = (n = 0) =>
    openWrap(n)
      .locator(".ml-gm-fb")
      .innerText()
      .catch(() => "");
  const bodyText = () =>
    page.evaluate(() => document.querySelector(".ml-gm-main")?.innerText || "");
  const shot = (name) => page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  async function axe(label, problems) {
    if (!AxeBuilder) return;
    const r = await new AxeBuilder({ page })
      .include(".ml-gm")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    if (bad.length)
      problems.push(
        `axe (${label}): ${bad.map((v) => `${v.id}[${v.nodes.length}] ${v.nodes[0]?.target?.join(" ")}`).join("; ")}`,
      );
  }
  async function act(pk, mode) {
    // mode: "right" or "wrong"
    const w = openWrap();
    if (pk.type === "mc") {
      const idx =
        mode === "right"
          ? pk.correct
          : [...Array(pk.n).keys()].filter((i) => i !== pk.correct && !false)[0];
      await w.locator(".ml-gm-opt").nth(idx).click();
      return idx;
    }
    if (pk.kind === "explore") {
      const inc = w.locator('.ml-gm-sbtn[aria-label^="Increase"]').first();
      for (let i = 0; i < pk.needed; i++) await inc.click();
      await w.locator(".ml-gm-btn.primary").click();
      return 0;
    }
    const inputs = w.locator(".ml-gm-num");
    const vals = Object.values(pk.solution);
    for (let i = 0; i < vals.length; i++) {
      const v = mode === "right" ? vals[i] : i === vals.length - 1 ? vals[i] + 1 : vals[i];
      await inputs.nth(i).fill(String(v));
      await inputs.nth(i).press("Tab");
    }
    await w.locator(".ml-gm-btn.primary").click();
    return 0;
  }
  /** a wrong try that always differs from the previous wrong try (MC); builders keep being wrong */
  async function wrongTry(pk, tried) {
    const w = openWrap();
    if (pk.type === "mc") {
      const idx = [...Array(pk.n).keys()].find((i) => i !== pk.correct && !tried.has(i));
      if (idx === undefined) return null;
      tried.add(idx);
      await w.locator(".ml-gm-opt").nth(idx).click();
      return idx;
    }
    await act(pk, "wrong");
    return 0;
  }

  async function playGame(gameId, skill, { first = false, shots = true } = {}) {
    const tag = `${gameId} / ${skill.id}`;
    const problems = [];
    const note = [];
    await page.evaluate(
      ([g, id]) => window.__mount(g, id, { band: "3-4", level: 2, seed: 7 }),
      [gameId, skill.id],
    );
    await page
      .locator(".ml-gm .ml-gm-opt, .ml-gm .ml-gm-num")
      .first()
      .waitFor({ state: "visible", timeout: 8000 })
      .catch(() => {});
    const sname = `${gameId}-${skill.id.replace(/\./g, "_")}`;
    if (shots) await shot(`${sname}-start`);
    await axe("first step", problems);
    // instructions at the top and the untimed note
    const how = await page.locator(".ml-gm-how").innerText();
    if (!/How to play/.test(how) || how.split("\n").length < 4)
      problems.push("instructions are missing at the top");
    if (!/untimed/i.test(await page.locator(".ml-gm-note").innerText()))
      problems.push("no on-screen note that the game is untimed");
    // Tab reaches a control and the keyboard answers
    await page.evaluate(() => document.activeElement?.blur?.());
    let reached = false;
    for (let i = 0; i < 14 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(() =>
        Boolean(
          document.activeElement?.closest?.(".ml-gm") &&
            document.activeElement.matches("button, input, summary"),
        ),
      );
    }
    if (!reached) problems.push("Tab never reached a game control");
    // keyboard-only first answer when the first step is a choice
    const pk0 = (await peek()).pk;
    if (first && pk0?.type === "mc") {
      let hit = false;
      for (let i = 0; i < 40 && !hit; i++) {
        await page.keyboard.press("Tab");
        hit = await page.evaluate(
          (c) =>
            document.activeElement?.dataset?.i === String(c) &&
            document.activeElement.classList.contains("ml-gm-opt"),
          pk0.correct,
        );
      }
      if (!hit) problems.push("could not Tab to the right choice");
      else {
        await page.keyboard.press("Enter");
        const after = await page.evaluate(
          () => document.querySelector(".ml-gm-stepwrap")?.dataset.done,
        );
        if (after !== "1") problems.push("Enter on a focused choice did not answer");
      }
    }
    let rounds = 0;
    let sawUp = false;
    let sawDown = false;
    let missPlan = "pending"; // pending | done | n/a
    let levelBefore = 0;
    let doneShots = 0;
    for (let guard = 0; guard < 500; guard++) {
      const st = await peek();
      if (st.ended) break;
      if (st.worked) {
        await page.locator(".ml-gm-worked .ml-gm-btn").click();
        continue;
      }
      if (st.done) {
        const doneTxt = await page.locator(".ml-gm-done").innerText();
        if (/Next: This one has bigger numbers|Next: This one is a little harder/.test(doneTxt))
          sawUp = true;
        if ((await overflow()) > 1)
          problems.push(`horizontal overflow ${await overflow()}px on a round-complete panel`);
        if (shots && doneShots++ === 0) await shot(`${sname}-done`);
        rounds++;
        await page.locator(".ml-gm-done .ml-gm-btn.primary").click();
        continue;
      }
      if (!st.pk) {
        await page.waitForTimeout(20);
        continue;
      }
      const pk = st.pk;
      const chrome = await page.evaluate(
        (sel) => [...document.querySelectorAll(sel)].map((n) => n.innerText).join(" "),
        CHROME,
      );
      if (TIMER_WORDS.test(chrome))
        problems.push(`timer-like text on screen: ${chrome.match(TIMER_WORDS)[0]}`);
      if (
        await page
          .locator(
            '[class*="timer" i], [class*="countdown" i], [id*="timer" i], progress, [role="timer"]',
          )
          .count()
      )
        problems.push("a timer element exists");
      if ((await overflow()) > 1)
        problems.push(`horizontal overflow ${await overflow()}px (round ${st.round})`);
      // Round 4 (or the first later round with a scoreable step): three misses, in order, then a new problem
      if (
        missPlan === "pending" &&
        st.round >= 4 &&
        !pk.reason &&
        (pk.type === "custom" ? pk.kind !== "explore" : pk.n >= 3)
      ) {
        missPlan = "done";
        levelBefore = Number(st.level);
        const before = await bodyText();
        const tried = new Set();
        const correctText = pk.correctText || "";
        const h1 = pk.hints.conceptual;
        const h2 = pk.hints.procedural;
        await wrongTry(pk, tried);
        let f = await fbText();
        if (!f.includes(h1.slice(0, 40)))
          problems.push(`first miss did not show the conceptual hint (${f.slice(0, 120)})`);
        if (correctText && tokenIn(f, correctText) && !tokenIn(h1, correctText))
          problems.push(`the feedback after a miss shows the answer "${correctText}"`);
        if (!/Not yet\./.test(f)) problems.push("feedback after a miss has no word 'Not yet.'");
        if (shots) await shot(`${sname}-miss1`);
        await axe("after a miss", problems);
        let pk2 = (await peek()).pk;
        await wrongTry(pk2, tried);
        f = await fbText();
        if (!f.includes(h2.slice(0, 40)))
          problems.push(`second miss did not show the procedural hint (${f.slice(0, 120)})`);
        if (correctText && tokenIn(f, correctText) && !tokenIn(h2, correctText))
          problems.push(`the feedback after two misses shows the answer "${correctText}"`);
        const lvl = Number((await peek()).level);
        if (levelBefore === 3 && lvl !== 2)
          problems.push(`two misses did not lower the level (was ${levelBefore}, now ${lvl})`);
        if (
          levelBefore === 3 &&
          !/friendlier numbers|a little easier/.test(await page.locator(".ml-gm-main").innerText())
        )
          problems.push("the lowered level is not said in words");
        else if (levelBefore === 3) sawDown = true;
        pk2 = (await peek()).pk;
        const canThird = pk.type === "custom" || pk.n >= 4;
        if (pk2 && canThird) await wrongTry(pk2, tried);
        const worked = page.locator(".ml-gm-worked");
        if (!canThird)
          note.push(
            "verdict step has 3 choices: two misses tested, the third-miss worked example is covered by the other games",
          );
        else if (!(await worked.count()))
          problems.push("the third miss did not show a worked example");
        else {
          const wt = await worked.innerText();
          if (!/different numbers/i.test(wt))
            problems.push("worked example is not labelled as using different numbers");
          if (correctText && /^\D*\d{3,}|[a-z]{4,}/i.test(correctText) && tokenIn(wt, correctText))
            problems.push(`the worked example shows the answer "${correctText}"`);
          if (shots) await shot(`${sname}-worked`);
          await axe("worked example", problems);
          await page.locator(".ml-gm-worked .ml-gm-btn").click();
          const after = await bodyText();
          const rn = (await peek()).round;
          if (rn !== st.round)
            problems.push(`a new problem moved the round counter (${st.round} -> ${rn})`);
          if (after === before)
            problems.push("the new problem after the worked example is the same as before");
        }
        continue;
      }
      await act(pk, "right");
    }
    const end = await peek();
    if (!end.ended) problems.push("did not reach the end screen");
    else {
      const endTxt = await page.locator(".ml-gm-main").innerText();
      if (
        !/You finished all [678] rounds/.test(endTxt) ||
        !/You explained why in \d of [678] rounds|looked for the reason/.test(endTxt)
      )
        problems.push(`end screen text is wrong: ${endTxt.slice(0, 160)}`);
      if (
        !(await page.getByRole("button", { name: "Play again" }).count()) ||
        !(await page.getByRole("button", { name: "Back" }).count())
      )
        problems.push("end screen lacks Play again or Back");
      if ((await overflow()) > 1)
        problems.push(`horizontal overflow on the end screen (${await overflow()}px)`);
      if (shots) await shot(`${sname}-end`);
      await axe("end screen", problems);
      if (first) {
        await page.getByRole("button", { name: "Play again" }).click();
        if (!/Round 1 of/.test(await page.locator(".ml-gm-bar").innerText()))
          problems.push("Play again did not start round 1");
      }
    }
    if (rounds < 6) problems.push(`only ${rounds} rounds completed`);
    if (!sawUp && missPlan !== "n/a") {
      // three clean rounds from level 2 must say "bigger" (the first three rounds are always clean)
      problems.push("three clean rounds in a row did not raise the level in words");
    }
    if (missPlan === "pending")
      note.push("no scoreable step at round 4+ for the miss plan (all rounds answered clean)");
    if (levelBefore === 3 && !sawDown) problems.push("no lowered-level note");
    return { tag, problems, note, rounds };
  }

  const pickSkills = (gameId, gradeList) => {
    const out = [];
    for (const grade of gradeList) {
      const el = skills.filter((s) => s.grade === grade && GAMES[gameId].eligible(s));
      if (!el.length) continue;
      const withGen = el.filter(hasFamily);
      const pool = withGen.length ? withGen : el;
      out.push(pool[gameIds.indexOf(gameId) % pool.length]);
    }
    return out;
  };

  let firstPlay = true;
  const allProblems = [];
  const t0 = Date.now();
  let playsDone = 0;
  const noGen = [];
  for (const gameId of gameIds) {
    if (ONLY && gameId !== ONLY) continue;
    const picked = pickSkills(gameId, QUICK ? [GRADES[0], GRADES[GRADES.length - 1]] : GRADES);
    if (!picked.length) {
      allProblems.push(`${gameId}: no eligible skill in grades ${GRADES.join(", ")}`);
      continue;
    }
    for (const skill of picked) {
      if (!hasFamily(skill)) noGen.push(`${gameId}/${skill.id}`);
      const r = await playGame(gameId, skill, {
        first: firstPlay || skill === picked[0],
        shots: true,
      });
      firstPlay = false;
      playsDone++;
      if (r.problems.length)
        allProblems.push(`${r.tag}: ${[...new Set(r.problems)].slice(0, 4).join(" | ")}`);
      else
        console.log(
          `      ok  ${r.tag} (${r.rounds} rounds)${r.note.length ? ` [${r.note[0]}]` : ""}`,
        );
    }
  }
  check(
    `chromium: ${playsDone} games played to the end by real clicks at 375px (grades ${GRADES.join(", ")}) in ${((Date.now() - t0) / 1000).toFixed(0)}s`,
    !allProblems.length,
    allProblems.join("\n"),
  );
  if (noGen.length)
    warn(
      `${noGen.length} of those plays used a skill whose problem family is not generated yet: ${noGen.slice(0, 5).join(", ")}`,
    );
  check(
    "chromium: no page error or console error during any play",
    !consoleErrors.length,
    [...new Set(consoleErrors)].slice(0, 5).join("\n"),
  );

  // desktop layout once per game (for the eyes); the same page at 1280px has no overflow either
  await page.setViewportSize({ width: 1280, height: 900 });
  const wideProblems = [];
  for (const gameId of gameIds) {
    if (ONLY && gameId !== ONLY) continue;
    const skill = pickSkills(gameId, [6])[0] || pickSkills(gameId, [3])[0];
    if (!skill) continue;
    await page.evaluate(
      ([g, id]) => window.__mount(g, id, { band: "3-4", level: 2, seed: 11 }),
      [gameId, skill.id],
    );
    await page.waitForTimeout(80);
    const pk = (await peek()).pk;
    if (pk) await act(pk, "right");
    if ((await overflow()) > 1) wideProblems.push(`${gameId} overflows at 1280px`);
    await shot(`${gameId}-1280`);
  }
  check(
    "chromium: no horizontal overflow at 1280px",
    !wideProblems.length,
    wideProblems.join("\n"),
  );
  await page.setViewportSize({ width: 375, height: 812 });
  await ctx.close();

  // reduced motion: no animation or transition anywhere in a game
  const rm = await browser.newContext({
    viewport: { width: 375, height: 812 },
    reducedMotion: "reduce",
  });
  const rp = await rm.newPage();
  await rp.goto(`${base}/__games.html`);
  await rp.evaluate(() => window.__ready);
  const rmProblems = [];
  for (const gameId of gameIds) {
    if (ONLY && gameId !== ONLY) continue;
    const skill =
      pickSkills(gameId, [3])[0] || pickSkills(gameId, [6])[0] || pickSkills(gameId, [1])[0];
    if (!skill) continue;
    await rp.evaluate(
      ([g, id]) => window.__mount(g, id, { band: "3-4", level: 2, seed: 5 }),
      [gameId, skill.id],
    );
    await rp.waitForTimeout(60);
    for (let i = 0; i < 3; i++) {
      const pk = await rp.evaluate(() => window.__h.peek());
      if (!pk) break;
      const w = rp.locator('.ml-gm-stepwrap:not([data-done="1"])').first();
      if (pk.type === "mc") await w.locator(".ml-gm-opt").nth(pk.correct).click();
      else break;
    }
    const bad = await rp.evaluate(() => {
      const out = [];
      for (const e of document.querySelectorAll(".ml-gm, .ml-gm *")) {
        const cs = getComputedStyle(e);
        if (cs.animationName !== "none") out.push(`animation on ${e.className}`);
        if (!/^(0s)(, 0s)*$/.test(cs.transitionDuration))
          out.push(`transition on ${e.className} (${cs.transitionDuration})`);
      }
      if (document.getAnimations().length)
        out.push(`${document.getAnimations().length} running animations`);
      return out.slice(0, 3);
    });
    if (bad.length) rmProblems.push(`${gameId}: ${bad.join("; ")}`);
  }
  check(
    "chromium: no animation or transition under prefers-reduced-motion",
    !rmProblems.length,
    rmProblems.join("\n"),
  );
  await rm.close();
  await browser.close();
  server.close();
}

if (!flag("no-browser")) await browserPart();

const bad = results.filter((r) => !r.ok);
console.log(
  `\n${results.length - bad.length}/${results.length} checks passed.${failures.length ? ` Failed: ${failures.join("; ")}` : ""}`,
);
console.log(`Screenshots: ${OUT}`);
process.exit(failures.length ? 1 : 0);
