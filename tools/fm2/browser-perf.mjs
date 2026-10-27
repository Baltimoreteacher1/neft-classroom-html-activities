// Performance suite: budgets in docs/family-math-2-performance.md, measured on the Vite-served source tree (uncompressed)
// with a 4x CPU slowdown that stands in for a mid-range Chromebook or phone. Exit 1 when a budget is missed; the report
// then states the measured number and a proposed budget (measured + 20%), never a quietly relaxed assertion.
//   node tools/fm2/browser-perf.mjs [--games=math-market] [--runs=3]
// @fm2 FM-042
import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { gzipSync } from "node:zlib";
import { loadAll } from "../../math/fluency-lab/family/fm2/registry.js";
import { makeRng } from "../../math/fluency-lab/family/fm2/rng.js";
import { SHOTS } from "./browser-kit.mjs";
import { launch } from "./harness.mjs";

const KB = 1024;
export const BUDGETS = {
  homeBytes: 400 * KB, // JS + CSS the home page itself pulls in, uncompressed (about 100 KB gzipped)
  homeRequests: 60, // documents, modules, styles and fonts on the unbundled source tree
  homeDcl: 1500, // ms, DOMContentLoaded at 4x CPU
  homeLcp: 2500, // ms, "good" Largest Contentful Paint (web.dev) at 4x CPU
  homeReady: 4000, // ms until the ten games are validated and Start is live, at 4x CPU
  playBytes: 250 * KB, // heaviest game's play page, JS + CSS, uncompressed
  playLcp: 2500,
  playReady: 3000, // ms until the first round is interactive
  clickP95: 200, // ms click -> next paint ("good" INP), hint / grade / answer, at 4x CPU
  roundP95: 300, // ms Next -> new round painted (mounts a whole game stage), at 4x CPU
  heapGrowth: 3 * 1024 * KB, // bytes retained after GC between round 14 and round 30
  domBand: 0.1, // share: DOM nodes at round 30 above the busiest of rounds 1-14 (rounds differ in size, a leak keeps climbing)
  resetGrowth: 0.01, // share: nodes and listeners left behind by 30 "Reset this puzzle" mounts of one round
  makeRoundP99: 50, // ms, 1,000 makeRound calls per game, node
};
const arg = (name, fallback) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;
const RUNS = Number(arg("runs", 3));
const ONLY = arg("games", "").split(",").filter(Boolean);
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) / 2)];
const pct = (xs, p) =>
  [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.ceil((p / 100) * xs.length) - 1)];
const pctText = (v) => `${(v * 100).toFixed(1)}%`;
const kb = (n) => `${(n / KB).toFixed(0)} KB`;
const failures = [];
const rows = [];
const check = (
  label,
  measured,
  budget,
  unit = "ms",
  fmt = (v) => `${Math.round(v)} ${unit}`,
  step = 10,
) => {
  const propose = (v) => Math.ceil((v * 1.2) / step) * step;
  const ok = measured <= budget;
  rows.push({
    label,
    measured: fmt(measured),
    budget: fmt(budget),
    ok,
    proposed: ok ? "" : fmt(propose(measured)),
  });
  if (!ok)
    failures.push(
      `${label}: measured ${fmt(measured)} > budget ${fmt(budget)} (proposed budget ${fmt(propose(measured))})`,
    );
};

// ---- page measurement ---------------------------------------------------------------------------------------------------
const WATCH = () => {
  window.__lcp = 0;
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__lcp = e.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  const ready = () =>
    document.querySelectorAll("[data-testid=game-card][data-ready=true]").length === 10 ||
    Boolean(
      document.querySelector("[data-fm2-stage] > *") &&
        document.querySelector("[data-fm2-prompt]")?.textContent,
    );
  const poll = () => {
    if (ready()) window.__readyAt = performance.now();
    else requestAnimationFrame(poll);
  };
  requestAnimationFrame(poll);
};
const OURS = /\/math\/fluency-lab\//;

async function measureLoad(h, url, { cpu = 4, net = null } = {}) {
  const context = await h.context({ width: 390, height: 844 });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  if (net) {
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: net.latency,
      downloadThroughput: net.down,
      uploadThroughput: net.up,
    });
  }
  await page.addInitScript(WATCH);
  const bytes = { jsCss: 0, oursJsCss: 0, gzipJsCss: 0, other: 0 };
  const urls = new Set();
  const pending = [];
  page.on("response", (response) => {
    const u = response.url();
    if (/\/@vite\/|\/@id\/|\.vite\/deps|favicon|\/@fs\//.test(u)) return;
    urls.add(u);
    const type = response.request().resourceType();
    pending.push(
      response
        .body()
        .then((b) => {
          if (type === "script" || type === "stylesheet") {
            // Vite's dev server appends an inline source map to every module (about 5x the code); the budget is for the code.
            const text = b.toString("utf8");
            const cut = text.indexOf("//# sourceMappingURL=data:");
            const code = cut > 0 ? text.slice(0, cut) : text;
            const size = Buffer.byteLength(code);
            bytes.jsCss += size;
            if (OURS.test(u)) {
              bytes.oursJsCss += size;
              bytes.gzipJsCss += gzipSync(code, { level: 9 }).length;
            }
          } else bytes.other += b.length;
        })
        .catch(() => {}),
    );
  });
  await page.goto(url, { waitUntil: "load", timeout: 240000 });
  await page.waitForFunction(() => window.__readyAt > 0, null, { timeout: 240000 });
  await page.waitForTimeout(400);
  await Promise.all(pending);
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    return {
      dcl: nav.domContentLoadedEventEnd,
      load: nav.loadEventEnd,
      lcp: window.__lcp,
      ready: window.__readyAt,
    };
  });
  await context.close();
  return { ...timing, ...bytes, requests: urls.size };
}

async function medianLoad(h, url, opts) {
  const runs = [];
  for (let i = 0; i < RUNS; i += 1) runs.push(await measureLoad(h, url, opts));
  const pick = (key) => median(runs.map((r) => r[key]));
  return Object.fromEntries(
    ["dcl", "load", "lcp", "ready", "jsCss", "oursJsCss", "gzipJsCss", "other", "requests"].map(
      (k) => [k, pick(k)],
    ),
  );
}

// Click -> next paint for one control, in the page, under the CPU slowdown.
const TIMED = `async (selector) => { const el = document.querySelector(selector); const t0 = performance.now(); el.click(); await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))); return performance.now() - t0; }`;
const timedClick = (page, selector) => page.evaluate(`(${TIMED})(${JSON.stringify(selector)})`);

async function gameRun(h, game, lang = "en") {
  const context = await h.context({ width: 390, height: 844 });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await page.goto(h.play({ game: game.id, grade: 5, rounds: 12, seed: 21, lang }));
  await page.waitForSelector("[data-fm2-stage] > *");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const clicks = [];
  const rounds = [];
  const heap = {};
  const counters = {};
  const snapshot = async () => {
    await cdp.send("HeapProfiler.collectGarbage");
    await cdp.send("HeapProfiler.collectGarbage");
    const usage = await cdp.send("Runtime.getHeapUsage");
    const dom = await cdp.send("Memory.getDOMCounters");
    return { heap: usage.usedSize, nodes: dom.nodes, listeners: dom.jsEventListeners };
  };
  const series = [];
  let played = 0;
  while (played < 30) {
    for (let i = 0; i < 3 && played < 4; i += 1) {
      const hint = await page.$("[data-fm2-hint]:not([disabled])");
      if (hint) clicks.push(await timedClick(page, "[data-fm2-hint]"));
    }
    clicks.push(
      await page.evaluate(
        `(async () => { const t0 = performance.now(); window.__fm2.submit(window.__fm2.solve()); await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))); return performance.now() - t0; })()`,
      ),
    );
    played += 1;
    const finishing = (await page.locator("[data-fm2-next]").innerText())
      .trim()
      .match(/^(Finish|Terminar)$/);
    const next = await timedClick(page, "[data-fm2-next]");
    if (finishing) {
      await page.waitForSelector("[data-fm2-again]");
      if (played < 30) await page.click("[data-fm2-again]");
    } else rounds.push(next);
    // Baseline after one full finish-and-replay cycle, so the one-off finish card is already in the DOM.
    if (played === 14) Object.assign(heap, { before: await snapshot() });
    if (!finishing) series.push((await cdp.send("Memory.getDOMCounters")).nodes);
    await page.waitForTimeout(10);
  }
  Object.assign(counters, { after: await snapshot() });
  // Pure mount/destroy leak test: reset the same puzzle 30 times; nodes and listeners must come back to where they were.
  const beforeReset = await snapshot();
  for (let i = 0; i < 30; i += 1) {
    await page.evaluate(() => document.querySelector("[data-fm2-reset]").click());
    await page.waitForTimeout(5);
  }
  const afterReset = await snapshot();
  await context.close();
  return {
    clicks,
    rounds,
    before: heap.before,
    after: counters.after,
    series,
    beforeReset,
    afterReset,
  };
}

// ---- generation cost (node, unthrottled) --------------------------------------------------------------------------------
async function generationCost(games) {
  const out = [];
  for (const game of games) {
    const combos = game.skills.flatMap((skill) =>
      [1, 2, 3].flatMap((level) => {
        const grades = [];
        for (let g = skill.grades[0]; g <= skill.grades[1]; g += 1) grades.push(g);
        return grades.map((grade) => [skill.id, level, grade]);
      }),
    );
    const call = (i) => {
      const [skill, level, grade] = combos[i % combos.length];
      const t0 = performance.now();
      game.makeRound(skill, level, makeRng(1000 + i), grade);
      return performance.now() - t0;
    };
    for (let i = 0; i < 300; i += 1) call(i);
    const times = Array.from({ length: 1000 }, (_, i) => call(i));
    out.push({ id: game.id, p50: pct(times, 50), p99: pct(times, 99), max: Math.max(...times) });
  }
  return out;
}

const h = await launch();
const started = Date.now();
mkdirSync(SHOTS, { recursive: true });
const report = { budgets: BUDGETS, runs: RUNS };
try {
  const games = (await loadAll()).filter((g) => !ONLY.length || ONLY.includes(g.id));
  await measureLoad(h, h.url("index.html?grade=3&lang=en"), { cpu: 1 }); // warm Vite's transform cache
  console.log("home page (4x CPU, median of", RUNS, "cold loads)");
  const home = await medianLoad(h, h.url("index.html?grade=3&lang=en"));
  report.home = home;
  console.log(
    `  js+css ${kb(home.jsCss)} (ours ${kb(home.oursJsCss)}, ${kb(home.gzipJsCss)} gzipped), ${home.requests} requests, dcl ${Math.round(home.dcl)} ms, lcp ${Math.round(home.lcp)} ms, ready ${Math.round(home.ready)} ms`,
  );
  check("home JS+CSS bytes (ours)", home.oursJsCss, BUDGETS.homeBytes, "B", kb);
  check("home requests", home.requests, BUDGETS.homeRequests, "", (v) => `${Math.round(v)}`);
  check("home DOMContentLoaded", home.dcl, BUDGETS.homeDcl);
  check("home LCP", home.lcp, BUDGETS.homeLcp);
  check("home ready (10 games validated)", home.ready, BUDGETS.homeReady);

  const sizes = [];
  for (const game of games) {
    const m = await measureLoad(h, h.play({ game: game.id, grade: 3, lang: "en" }), { cpu: 1 });
    sizes.push({ id: game.id, bytes: m.oursJsCss, requests: m.requests });
  }
  report.playBytes = sizes;
  console.log(`play page JS+CSS by game: ${sizes.map((s) => `${s.id} ${kb(s.bytes)}`).join(", ")}`);
  const heaviest = sizes.reduce((a, b) => (b.bytes > a.bytes ? b : a));
  const play = await medianLoad(h, h.play({ game: heaviest.id, grade: 3, lang: "en" }));
  report.play = { game: heaviest.id, ...play };
  console.log(
    `heaviest game ${heaviest.id} (4x CPU): lcp ${Math.round(play.lcp)} ms, ready ${Math.round(play.ready)} ms, ${play.requests} requests`,
  );
  check(`play bytes, heaviest game (${heaviest.id})`, heaviest.bytes, BUDGETS.playBytes, "B", kb);
  check(`play LCP (${heaviest.id})`, play.lcp, BUDGETS.playLcp);
  check(`play first round ready (${heaviest.id})`, play.ready, BUDGETS.playReady);

  // Informational (not a budget): the dev server cannot gzip, so a real slow link is estimated from gzipped code at
  // 1.6 Mbps plus the 4x-CPU ready time measured above.
  const transfer = (gz) => ((gz * 8) / 1.6e6) * 1000;
  report.slowNetworkEstimate = {
    homeMs: home.ready + transfer(home.gzipJsCss),
    playMs: play.ready + transfer(play.gzipJsCss),
  };
  console.log(
    `informational, 1.6 Mbps estimate: home ready about ${Math.round(report.slowNetworkEstimate.homeMs)} ms (${kb(home.gzipJsCss)} gzipped), ${heaviest.id} about ${Math.round(report.slowNetworkEstimate.playMs)} ms (${kb(play.gzipJsCss)} gzipped)`,
  );

  report.interaction = [];
  for (const game of games) {
    const r = await gameRun(h, game);
    const click = pct(r.clicks, 95);
    const round = pct(r.rounds, 95);
    const growth = r.after.heap - r.before.heap;
    const band = Math.max(...r.series.slice(0, 14));
    const last = r.series.at(-1);
    report.interaction.push({
      id: game.id,
      clickP95: click,
      roundP95: round,
      heapGrowth: growth,
      nodes: [r.before.nodes, r.after.nodes],
      listeners: [r.before.listeners, r.after.listeners],
    });
    console.log(
      `  ${game.id}: click p95 ${Math.round(click)} ms, new round p95 ${Math.round(round)} ms, heap ${kb(r.before.heap)} -> ${kb(r.after.heap)}, nodes ${r.before.nodes} -> ${r.after.nodes}, listeners ${r.before.listeners} -> ${r.after.listeners}`,
    );
    check(`${game.id} click p95`, click, BUDGETS.clickP95);
    check(`${game.id} new-round p95`, round, BUDGETS.roundP95);
    check(`${game.id} heap growth r3->r30`, Math.max(0, growth), BUDGETS.heapGrowth, "B", kb);
    check(
      `${game.id} DOM nodes at round 30 vs busiest of rounds 1-14`,
      Math.max(0, (last - band) / band),
      BUDGETS.domBand,
      "",
      pctText,
      0.005,
    );
    const resetNodes = (r.afterReset.nodes - r.beforeReset.nodes) / r.beforeReset.nodes;
    const resetListeners =
      (r.afterReset.listeners - r.beforeReset.listeners) / r.beforeReset.listeners;
    check(
      `${game.id} nodes after 30 puzzle resets`,
      Math.max(0, resetNodes),
      BUDGETS.resetGrowth,
      "",
      pctText,
      0.005,
    );
    check(
      `${game.id} listeners after 30 puzzle resets`,
      Math.max(0, resetListeners),
      BUDGETS.resetGrowth,
      "",
      pctText,
      0.005,
    );
  }

  report.generation = await generationCost(games);
  for (const g of report.generation) {
    console.log(
      `  ${g.id}: makeRound p50 ${g.p50.toFixed(2)} ms, p99 ${g.p99.toFixed(2)} ms, max ${g.max.toFixed(1)} ms`,
    );
    check(`${g.id} makeRound p99`, g.p99, BUDGETS.makeRoundP99);
  }
  report.rows = rows;
  writeFileSync(`${SHOTS}/perf-report.json`, JSON.stringify(report, null, 1));
  console.log(
    `\nperf: ${rows.length} budget checks in ${Math.round((Date.now() - started) / 1000)}s`,
  );
  if (failures.length) {
    console.log(`FAIL perf: ${failures.length} budget(s) missed`);
    for (const f of failures) console.log(`  ${f}`);
    process.exitCode = 1;
  } else console.log("PASS perf: every budget met");
} finally {
  await h.close();
}
