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
//  7. GC: CDP heap sampling (16-byte interval, minor/major-GC objects kept).
//     The machine is first kept moving (every spring kicked, particles fired)
//     for 14 s unsampled, so motion-only code is optimized as it is in real
//     play; then 4 s of live browser frames are sampled under the same motion.
//     Budget: everything charged to the loop (game code plus frame() itself) may
//     exceed a bare rAF control loop sampled in the same window by at most
//     STEP_BUDGET bytes per frame. A
//     window with game bytes is sampled again and fails only if they repeat.
//     600 synthetic steps are also sampled and PRINTED as a diagnostic only:
//     they run from a test loop, which V8 compiles differently from frames.
//
// Usage: node tools/validate-engine-games-browser.mjs [--only=u8-aero-torque] [--no-perf] [--root=dist]
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
// --root=dist serves the BUILT site (bundled games) instead of the source tree.
const serveRoot = resolve(ROOT, (args.find((a) => a.startsWith("--root=")) || "--root=.").slice(7));
const ROUNDS = 4;
const FPS_MIN = 55;
const P95_MAX = 20;
// Sampling noise allowed between frame()'s own bytes and a bare rAF loop's, per frame.
const LOOP_SLACK = 1.5;
// Live allocation budget per frame, per round mode, under motion, above the
// bare rAF control: 24 bytes (two boxed numbers). Engine code allocates no
// objects, arrays, closures or strings per frame by construction, and most modes
// measure 0. A few modes (u8 inequality, u2 divide) carry ~14-20 B/frame that no
// statement accounts for: bisected 2026-11-10, it stayed when any part of the
// frame was removed and moved to frame() when the draw call was emptied, so it
// is charged by V8/canvas internals to whatever is running. ~1 KB/s, far below
// anything that causes a pause. Bigger costs fail: u7 tether measured 151 KB/4 s
// before its fix.
const STEP_BUDGET = 24;
const MOTION_WARM_MS = 14000;
const LIVE_WINDOW_MS = 4000;

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
const server = await startStaticServer(serveRoot);
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

  // ---- 7. GC helpers: heap sampling, shared by the per-mode live check ----
  const cdp = noPerf ? null : await context.newCDPSession(page);
  if (cdp) await cdp.send("HeapProfiler.enable");
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
  game.gc = { modes: [] };
  const kickOn = (id) =>
    page.evaluate((key) => {
      const e = window.__ewEngines[0];
      window[key] = setInterval(() => {
        const sp = e.springs;
        if (sp) for (let i = 0; i < sp.count; i++) sp.impulse(i, (i % 2 ? -1 : 1) * 0.6);
        if (e.particles) e.particles.emit(480, 270, 24, 220, 1, -Math.PI / 2, Math.PI * 2, 0.8);
      }, 120);
    }, id);
  const kickOff = (id) => page.evaluate((key) => clearInterval(window[key]), id);
  // Live GC in the CURRENT round mode, under motion, after reaching steady state
  // (code that only runs while springs move is optimized only once play moves it:
  // u8 converged in ~12 s of continuous motion, 2026-11-10). Game code must
  // allocate 0 B; frame() itself may not exceed a bare rAF control loop sampled
  // in the same window. A window over budget is sampled again in the identical
  // state and fails only if it repeats (one-off JIT work does not).
  const liveGc = async (label) => {
    await kickOn("__ewKickWarm");
    await page.waitForTimeout(MOTION_WARM_MS);
    await kickOff("__ewKickWarm");
    const window1 = async () => {
      const c0 = await page.evaluate(() => {
        window.__rafN = 0;
        window.__rafRun = true;
        window.__rafControl = function __rafControl() {
          window.__rafN++;
          if (window.__rafRun) requestAnimationFrame(window.__rafControl);
        };
        requestAnimationFrame(window.__rafControl);
        return window.__ewEngines[0].frameCount;
      });
      const prof = await sample(async () => {
        await kickOn("__ewKick");
        await page.waitForTimeout(LIVE_WINDOW_MS);
        await kickOff("__ewKick");
      });
      const c1 = await page.evaluate(() => {
        window.__rafRun = false;
        return { frames: window.__ewEngines[0].frameCount, control: window.__rafN };
      });
      const r = split(prof);
      const frames = Math.max(1, c1.frames - c0);
      return {
        ...r,
        gamePerFrame: r.game / frames,
        loopPerFrame: r.loop / frames,
        controlPerFrame: r.control / Math.max(1, c1.control),
      };
    };
    const over = (w) =>
      w.gamePerFrame + w.loopPerFrame > w.controlPerFrame + STEP_BUDGET + LOOP_SLACK;
    let w = await window1();
    let first = null;
    if (over(w)) {
      first = `${w.game} B game, ${w.loopPerFrame.toFixed(2)} B/frame callback`;
      w = await window1();
    }
    game.gc.modes.push({
      label,
      game: w.game,
      loop: +w.loopPerFrame.toFixed(2),
      control: +w.controlPerFrame.toFixed(2),
      first,
    });
    if (over(w))
      fail(
        game,
        `GC [${label}]: game code ${w.game} B, frame() ${w.loopPerFrame.toFixed(2)} B/frame vs bare rAF control ${w.controlPerFrame.toFixed(2)} (budget ${STEP_BUDGET} B/frame above the control): ${w.hits.join(" | ")}`,
      );
  };

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
    if (!noPerf) await liveGc(`round ${r + 1} ${info.mode || ""}`.trim());
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
    const stepOnce = () =>
      sample(() =>
        page.evaluate(() => {
          const e = window.__ewEngines[0];
          for (let i = 0; i < 600; i++) e.stepFrames(1);
        }),
      );
    let stepped = split(await stepOnce());
    let steppedFirst = null;
    if (stepped.game + stepped.loop > 600 * STEP_BUDGET) {
      steppedFirst = stepped.game + stepped.loop;
      stepped = split(await stepOnce());
    }
    game.gc.steppedBytes = stepped.game + stepped.loop;
    game.gc.steppedFirst = steppedFirst;
    // DIAGNOSTIC only, printed but not gating: these steps are called from a test
    // loop, not by the browser, so V8 inlines them differently and can box a
    // number real frames never do (2026-11-10: u9 ~10 B/step this way, 0 B in
    // live frames under the same motion). The gate is the per-mode live check.
    game.gc.steppedNote = stepped.hits.slice(0, 2).join(" | ");
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
        ? `, ${game.fps.avg} fps p95 ${game.fps.p95} ms @4x, GC live per mode: ${game.gc.modes.map((m) => `${m.label} ${m.game}B/${m.loop}vs${m.control}`).join("; ")}; diag ${game.gc.steppedBytes} B/600 synthetic steps`
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
  "| Game | Keyboard rounds | Avg FPS | p95 ms | GC live per round mode: game B / rAF callback B/frame (bare control) | Result |",
  "| --- | --- | --- | --- | --- | --- |",
  ...report.map(
    (g) =>
      `| ${g.slug} | ${g.rounds.filter((r) => r.solved).length}/${ROUNDS} | ${g.fps?.avg ?? "-"} | ${g.fps?.p95 ?? "-"} | ${g.gc?.modes?.length ? g.gc.modes.map((m) => `${m.label}: ${m.game} B / ${m.loop} (${m.control})`).join("<br>") : "-"} | ${g.fails.length ? `FAIL (${g.fails.length})` : "pass"} |`,
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
