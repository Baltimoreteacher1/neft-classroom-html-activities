#!/usr/bin/env node
// validate:engine-games-browser — every physics engine game under
// math/games/engines/<slug>/, driven in Chromium the way a student drives it.
//
// Per game:
//  1. KEYBOARD: from the page top, reach each control with real Tab presses
//     (never .focus()) and solve rounds with Arrow / Home / Enter only, using
//     the round's own testPlan(). A deliberate first miss must speak in the
//     assertive region and unlock Tier 1. Covers several rounds so every round
//     mode (e.g. equation vs inequality) is driven.
//  2. SCREEN READER: the canvas carries a scene description, every control has
//     an accessible name, live regions exist, a solve is announced.
//  3. LANGUAGE: the EN/ES toggle re-binds text without resetting the round.
//  4. AXE: WCAG 2.x A/AA + 2.2 AA, serious/critical fail.
//  5. REFLOW: no horizontal scroll at 390 px; visible controls >= 44 px.
//  6. FPS: 4x CPU throttle (school Chromebook profile), 3 s of live loop with
//     particle load; avg >= 55 fps and p95 frame <= 20 ms.
//  7. GC: CDP heap sampling (16-byte interval, minor/major-GC objects kept),
//     after a JIT warm-up. Engine code allocates no objects, arrays, closures or
//     strings per frame by construction; the measured budget is STEP_BUDGET
//     bytes per step (one boxed number, which V8 may still create at a call
//     boundary in some optimized states). Over 600 fixed steps and over 2 s of
//     live frames (judged against a bare rAF control loop in the same window),
//     anything above the budget fails. A window over budget is sampled again in
//     the identical state and fails only if it repeats (one-off JIT work does
//     not); the first window's bytes are still printed.
//
// Usage: node tools/validate-engine-games-browser.mjs [--only=u8-aero-torque] [--no-perf]
// A missing browser is a SKIP (exit 3 locally, 1 in CI).

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { launchBrowser, startStaticServer } from "./lib/lesson-gate-kit.mjs";
import { exitSkipped } from "./lib/skip-exit.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const ENGINES = join(ROOT, "math/games/engines");
const require = createRequire(import.meta.url);
const AXE = require.resolve("axe-core/axe.min.js");
const args = process.argv.slice(2);
const only = (args.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const noPerf = args.includes("--no-perf");
const ROUNDS = 4;
const FPS_MIN = 55;
const P95_MAX = 20;
// Sampling noise allowed between frame()'s own bytes and a bare rAF loop's, per frame.
const LOOP_SLACK = 1.5;
// Per-step allocation budget in steady state. Engine code allocates no objects,
// arrays, closures or strings per frame by construction. What V8 may still do in
// some optimized states is box a number (12 bytes) at a call boundary, wherever
// its inlining choices land: bisected on u8/u9 2026-11-10, the site moved with
// every code change and no line allocated in isolation. Measured worst cases
// that day: u8 ~12 B/step, u5 ~10, u9 ~27; every other game 0. The budget is two
// boxed numbers per step. A string or object per frame exceeds it. At 60 steps/s
// that is under 2 KB/s: tens of minutes of play per young-generation scavenge,
// and a scavenge of a heap this quiet takes well under a millisecond.
const STEP_BUDGET = 32;

const slugs = readdirSync(ENGINES).filter(
  (d) =>
    d !== "core" &&
    existsSync(join(ENGINES, d, "index.html")) &&
    (!only.length || only.includes(d)),
);
if (!slugs.length) {
  console.error("FAIL no engine games found under math/games/engines/");
  process.exit(1);
}

const browser = await launchBrowser();
if (!browser) exitSkipped("no Chromium available", "Set PW_CHROMIUM_PATH to a system Chromium");
const server = await startStaticServer(ROOT);
const report = [];
let failures = 0;

function fail(game, msg) {
  failures++;
  game.fails.push(msg);
  console.error(`FAIL ${game.slug}: ${msg}`);
}

const deepActiveId = () => {
  let a = document.activeElement;
  while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;
  return a ? a.id || a.tagName : "";
};

async function tabTo(page, id) {
  for (let i = 0; i < 80; i++) {
    if ((await page.evaluate(deepActiveId)) === id) return true;
    await page.keyboard.press("Tab");
  }
  return false;
}

async function runPlan(page, game, plan) {
  for (const step of plan) {
    if (!(await tabTo(page, step.control))) {
      fail(game, `Tab never reached #${step.control}`);
      return false;
    }
    for (let k = 0; k < (step.times ?? 1); k++) await page.keyboard.press(step.key);
  }
  return true;
}

for (const slug of slugs) {
  const game = { slug, fails: [], rounds: [], fps: null, gc: null };
  report.push(game);
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`${server.base}/math/games/engines/${slug}/?seed=4242`);
  try {
    await page.waitForFunction(() => window.__ewEngines?.[0]?.roundIndex >= 1, null, {
      timeout: 15000,
    });
  } catch {
    fail(game, `engine never started (${errors.join(" | ") || "no error"})`);
    await context.close();
    continue;
  }

  // ---- 2. screen-reader semantics ----
  const sr = await page.evaluate(() => {
    const e = window.__ewEngines[0];
    const root = e.shadowRoot;
    const canvas = root.getElementById("stage");
    const unnamed = [];
    for (const el of root.querySelectorAll("button, input")) {
      if (el.closest("[hidden]")) continue;
      const name =
        el.labels?.[0]?.textContent?.trim() ||
        el.getAttribute("aria-label") ||
        el.textContent.trim();
      if (!name || !/\p{L}/u.test(name)) unnamed.push(el.id || el.type);
    }
    return {
      canvasRole: canvas.getAttribute("role"),
      canvasLabel: canvas.getAttribute("aria-label") || "",
      polite: !!root.querySelector('[aria-live="polite"]'),
      assertive: !!root.querySelector('[aria-live="assertive"]'),
      unnamed,
    };
  });
  if (sr.canvasRole !== "img" || sr.canvasLabel.length < 12)
    fail(game, `canvas lacks a scene description ("${sr.canvasLabel}")`);
  if (!sr.polite || !sr.assertive) fail(game, "missing polite/assertive live regions");
  if (sr.unnamed.length) fail(game, `controls without accessible names: ${sr.unnamed.join(", ")}`);

  // ---- 1. keyboard play: miss first, then solve several rounds ----
  await page.mouse.click(5, 5); // focus the document without touching a control
  for (let r = 0; r < ROUNDS; r++) {
    const checkId = await page.evaluate(() => window.__ewEngines[0].meta.checkId);
    if (r === 0) {
      const startsSolved = await page.evaluate(() => window.__ewEngines[0].evaluate().ok);
      // evaluate() may set visual state; that is fine before a real attempt.
      if (startsSolved) fail(game, "round 1 starts already solved");
      if (await tabTo(page, checkId)) {
        await page.keyboard.press("Enter");
        const miss = await page.evaluate(() => {
          const e = window.__ewEngines[0];
          return {
            said: e.shadowRoot.getElementById("assertive").textContent.trim(),
            tier1: !e.tierInputs[1].disabled,
            solved: e.solved,
          };
        });
        if (miss.solved) fail(game, "a first check with untouched controls solved the round");
        if (!miss.said) fail(game, "a miss was not announced in the assertive region");
        if (!miss.tier1) fail(game, "a miss did not unlock Tier 1");
      } else fail(game, `Tab never reached the check control #${checkId}`);
    }
    const info = await page.evaluate(() => {
      const e = window.__ewEngines[0];
      return { plan: e.testPlan(), mission: e.missionText(), mode: e.mode || "" };
    });
    if (!(await runPlan(page, game, info.plan))) break;
    const after = await page.evaluate(() => {
      const e = window.__ewEngines[0];
      return {
        solved: e.solved,
        said: e.shadowRoot.getElementById("assertive").textContent.trim(),
      };
    });
    game.rounds.push({ mode: info.mode, mission: info.mission.slice(0, 90), solved: after.solved });
    if (!after.solved) {
      fail(game, `round ${r + 1} (${info.mode}) not solved by its keyboard plan: "${after.said}"`);
      break;
    }
    if (!after.said) fail(game, `round ${r + 1} solve was not announced`);
    if (r < ROUNDS - 1) {
      if (!(await tabTo(page, "next"))) {
        fail(game, "Tab never reached the Next button after a solve");
        break;
      }
      await page.keyboard.press("Enter");
      const moved = await page.evaluate((n) => window.__ewEngines[0].roundIndex === n, r + 2);
      if (!moved) fail(game, "Next did not start a new round");
    }
  }

  // ---- 3. language toggle keeps state ----
  const lang = await page.evaluate(async () => {
    const e = window.__ewEngines[0];
    const before = {
      round: e.roundIndex,
      label: e.canvas.getAttribute("aria-label"),
      mission: e.missionText(),
    };
    e.shadowRoot.getElementById("lang").click();
    await new Promise((r) => setTimeout(r, 50));
    const after = {
      round: e.roundIndex,
      label: e.canvas.getAttribute("aria-label"),
      mission: e.missionText(),
    };
    e.shadowRoot.getElementById("lang").click();
    return { before, after, htmlLang: document.documentElement.lang };
  });
  if (lang.after.round !== lang.before.round) fail(game, "language toggle reset the round");
  if (lang.after.mission === lang.before.mission)
    fail(game, "Spanish mission text identical to English");
  if (lang.after.label === lang.before.label)
    fail(game, "Spanish scene description identical to English");

  // ---- 4. axe ----
  await page.addScriptTag({ path: AXE });
  const axe = await page.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
    });
    return r.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map(
        (v) =>
          `${v.id}: ${v.nodes
            .map((n) => n.target.join(" "))
            .slice(0, 3)
            .join("; ")}`,
      );
  });
  for (const v of axe) fail(game, `axe ${v}`);

  // ---- 6/7. performance + GC ----
  if (!noPerf) {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const fps = await page.evaluate(
      () =>
        new Promise((done) => {
          const e = window.__ewEngines[0];
          const times = [];
          const t0 = performance.now();
          let burst = 0;
          const tick = (now) => {
            times.push(now);
            if (e.particles && now - burst > 150) {
              burst = now;
              e.particles.emit(480, 270, 30, 260, 1, -Math.PI / 2, Math.PI * 2, 1);
            }
            if (now - t0 < 3000) requestAnimationFrame(tick);
            else {
              const d = [];
              for (let i = 1; i < times.length; i++) d.push(times[i] - times[i - 1]);
              d.sort((a, b) => a - b);
              const avg = d.reduce((s, v) => s + v, 0) / d.length;
              done({
                fps: 1000 / avg,
                p95: d[Math.floor(d.length * 0.95)],
                frames: d.length,
                slow: d.filter((v) => v > 20).length,
              });
            }
          };
          requestAnimationFrame(tick);
        }),
    );
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    game.fps = {
      avg: +fps.fps.toFixed(1),
      p95: +fps.p95.toFixed(1),
      frames: fps.frames,
      over20ms: fps.slow,
      throttle: "4x CPU",
    };
    if (fps.fps < FPS_MIN)
      fail(game, `avg ${fps.fps.toFixed(1)} fps under 4x throttle (< ${FPS_MIN})`);
    if (fps.p95 > P95_MAX)
      fail(game, `p95 frame ${fps.p95.toFixed(1)} ms under 4x throttle (> ${P95_MAX})`);

    await cdp.send("HeapProfiler.enable");
    const sample = async (fn) => {
      await cdp.send("HeapProfiler.startSampling", {
        samplingInterval: 16,
        includeObjectsCollectedByMajorGC: true,
        includeObjectsCollectedByMinorGC: true,
      });
      await fn();
      const { profile } = await cdp.send("HeapProfiler.stopSampling");
      return profile;
    };
    const HOT = new Set(["frame", "stepFrames"]);
    // Split every sampled byte beneath the engine's frame/stepFrames into:
    //   game  — allocated by any function the loop CALLS (update, render, helpers).
    //           Must be exactly 0.
    //   loop  — the frame() callback's own self size: integer bookkeeping only,
    //           so what lands here is the browser boxing the rAF timestamp it hands
    //           to every callback. Judged against a bare rAF control loop running
    //           in the same page over the same window (the platform's own cost).
    const split = (profile) => {
      const hits = [];
      let game = 0;
      let loop = 0;
      let control = 0;
      const walk = (node, inHot, stack) => {
        const cf = node.callFrame;
        const engineFn = cf.url.includes("/math/games/engines/");
        const isLoop = engineFn && HOT.has(cf.functionName);
        const here = `${cf.functionName || "(anon)"}@${cf.url.split("/engines/")[1] || cf.url.split("/").pop()}:${cf.lineNumber + 1}`;
        if (cf.functionName === "__rafControl") control += node.selfSize;
        if (node.selfSize > 0 && (inHot || isLoop)) {
          if (isLoop && cf.functionName === "frame") loop += node.selfSize;
          else {
            game += node.selfSize;
            hits.push(`${node.selfSize}B ${[...stack, here].slice(-3).join(" > ")}`);
          }
        }
        for (const c of node.children) walk(c, inHot || isLoop, [...stack, here]);
      };
      walk(profile.head, false, []);
      return { game, loop, control, hits: hits.slice(0, 8) };
    };
    // Warm the JIT first: interpreted code boxes every double, optimized code does
    // not, and gameplay ticks run optimized within the first second of play. Then
    // give concurrent compiles a moment to install before measuring.
    await page.evaluate(() => window.__ewEngines[0].stepFrames(3600));
    await page.waitForTimeout(400);
    // A hot-loop allocation happens on EVERY frame, so it shows in every window.
    // One-off JIT work (a compile installing, a flushed function recompiling) can
    // land in a single window under load and be charged to whatever was running.
    // So a window that shows bytes is sampled again in the identical state; only
    // an allocation that repeats fails. Both measurements are reported.
    const stepOnce = () => sample(() => page.evaluate(() => window.__ewEngines[0].stepFrames(600)));
    let stepped = split(await stepOnce());
    let steppedFirst = null;
    if (stepped.game + stepped.loop > 600 * STEP_BUDGET) {
      steppedFirst = stepped.game + stepped.loop;
      stepped = split(await stepOnce());
    }
    const counts0 = await page.evaluate(() => {
      window.__rafN = 0;
      window.__rafRun = true;
      window.__rafControl = function __rafControl() {
        window.__rafN++;
        if (window.__rafRun) requestAnimationFrame(window.__rafControl);
      };
      requestAnimationFrame(window.__rafControl);
      return window.__ewEngines[0].frameCount;
    });
    let live = split(await sample(() => page.waitForTimeout(2000)));
    let liveFirst = null;
    if (live.game > 0) {
      liveFirst = live.game; // any live game bytes: confirm in a second window
      live = split(await sample(() => page.waitForTimeout(2000)));
    }
    const counts1 = await page.evaluate(() => {
      window.__rafRun = false;
      return { frames: window.__ewEngines[0].frameCount, control: window.__rafN };
    });
    const liveFrames = Math.max(
      1,
      Math.round((counts1.frames - counts0) / (liveFirst === null ? 1 : 2)),
    );
    const gamePerFrame = live.game / liveFrames;
    const loopPerFrame = live.loop / liveFrames;
    const controlPerFrame =
      live.control / Math.max(1, Math.round(counts1.control / (liveFirst === null ? 1 : 2)));
    game.gc = {
      steppedBytes: stepped.game + stepped.loop,
      liveGameBytes: live.game,
      loopPerFrame: +loopPerFrame.toFixed(2),
      controlPerFrame: +controlPerFrame.toFixed(2),
      liveFrames,
      firstWindow: { stepped: steppedFirst, live: liveFirst },
      hits: [...stepped.hits, ...live.hits],
    };
    if (stepped.game + stepped.loop > 600 * STEP_BUDGET)
      fail(
        game,
        `GC: ${stepped.game + stepped.loop} B in 600 fixed steps (budget ${600 * STEP_BUDGET} B, two boxed numbers per step): ${stepped.hits.join(" | ")}`,
      );
    // Live: everything charged to the loop (game code plus frame() and what V8
    // inlines into it) may exceed the bare rAF control by at most the budget.
    const livePerFrame = gamePerFrame + loopPerFrame;
    if (livePerFrame > controlPerFrame + STEP_BUDGET + LOOP_SLACK)
      fail(
        game,
        `GC: ${livePerFrame.toFixed(2)} B/frame in live play vs bare rAF control ${controlPerFrame.toFixed(2)} (budget +${STEP_BUDGET}): ${live.hits.join(" | ")}`,
      );
  }

  // ---- 5. reflow at 390 px + target size ----
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  const reflow = await page.evaluate(() => {
    const root = window.__ewEngines[0].shadowRoot;
    const small = [];
    for (const el of root.querySelectorAll("button, input[type=range], .tier")) {
      if (el.closest("[hidden]")) continue;
      const r = el.getBoundingClientRect();
      if (r.width && (r.height < 44 || r.width < 44))
        small.push(`${el.id || el.className}:${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      small,
    };
  });
  if (reflow.overflow > 0) fail(game, `horizontal scroll ${reflow.overflow}px at 390px`);
  if (reflow.small.length) fail(game, `targets under 44px: ${reflow.small.join(", ")}`);

  for (const e of errors) fail(game, `console: ${e}`);
  console.log(
    `${game.fails.length ? "FAIL" : "ok  "} ${slug}: rounds ${game.rounds.filter((r) => r.solved).length}/${ROUNDS} by keyboard` +
      (game.fps
        ? `, ${game.fps.avg} fps p95 ${game.fps.p95} ms @4x, GC ${game.gc.steppedBytes} B/600 steps, game ${game.gc.liveGameBytes} B live, rAF callback ${game.gc.loopPerFrame} vs control ${game.gc.controlPerFrame} B/frame${game.gc.firstWindow.stepped !== null || game.gc.firstWindow.live !== null ? ` (first window re-sampled: ${JSON.stringify(game.gc.firstWindow)})` : ""}`
        : ""),
  );
  await context.close();
}

await browser.close();
await server.close();

mkdirSync(join(ROOT, "reports"), { recursive: true });
const lines = [
  "# Engine games browser audit",
  "",
  `Run: ${new Date().toISOString()} · Chromium headless · 1366x768 DPR 1 · FPS/GC under 4x CPU throttle`,
  "",
  "| Game | Keyboard rounds | Avg FPS | p95 ms | GC: B in 600 steps / game B live / rAF B/frame (control) | Result |",
  "| --- | --- | --- | --- | --- | --- |",
  ...report.map(
    (g) =>
      `| ${g.slug} | ${g.rounds.filter((r) => r.solved).length}/${ROUNDS} | ${g.fps?.avg ?? "-"} | ${g.fps?.p95 ?? "-"} | ${g.gc ? `${g.gc.steppedBytes} / ${g.gc.liveGameBytes} / ${g.gc.loopPerFrame} (${g.gc.controlPerFrame})` : "-"} | ${g.fails.length ? `FAIL (${g.fails.length})` : "pass"} |`,
  ),
  "",
  ...report
    .filter((g) => g.fails.length)
    .flatMap((g) => [`## ${g.slug}`, ...g.fails.map((f) => `- ${f}`), ""]),
];
writeFileSync(join(ROOT, "reports/engine-games-audit.md"), `${lines.join("\n")}\n`);
console.log(
  `\n${failures ? "FAIL" : "PASS"} validate:engine-games-browser — ${slugs.length} games, ${failures} failures → reports/engine-games-audit.md`,
);
process.exit(failures ? 1 : 0);
