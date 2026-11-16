#!/usr/bin/env node
// validate:universe-games-browser — every Math Universe game under
// math/games/universe/games/<slug>/, driven in Chromium the way a student drives it.
//
// Per game:
//  1. BOOT: the page loads with no page error, console error or failed request
//     (the static server has no /api, so /api/* is ignored), the title screen
//     shows, and Start puts the game in play with a HUD and a described canvas.
//  2. CONTROLS: holding a real arrow key moves the player; Escape pauses and
//     resumes; the Time Machine opens from its button and resumes.
//  3. LANGUAGE: the English/Spanish switch changes the title text and <html lang>.
//  4. SETTINGS: reduced motion, low graphics and high contrast each apply
//     without an error, and the choice survives a reload.
//  5. PLAY: the game's own driver (tools/universe/drivers/<slug>.mjs) plays
//     level 1 to its end through the real interface. A game with no driver FAILS:
//     "it loads" is not "it plays".
//  6. RESUME: after the driver, a reload shows the finished level as done.
//  7. AXE: WCAG 2.x A/AA + 2.2 AA on the title, in play and with a panel open;
//     serious and critical fail.
//  8. REFLOW: at 390 px there is no horizontal scroll and Start is on screen.
//  9. FRAME TIME: 3 s of live play under 4x CPU throttle (school Chromebook
//     profile). Average must reach 30 fps; the measured numbers are written to
//     reports/universe-performance.json and printed, never invented.
//
// Usage: node tools/validate-universe-games-browser.mjs [--only=power-plant] [--no-perf] [--root=dist]
// A missing browser is a SKIP (exit 3 locally, 1 in CI).

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { launchBrowser, startStaticServer } from "./lib/lesson-gate-kit.mjs";
import { exitSkipped } from "./lib/skip-exit.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const GAMES = join(ROOT, "math/games/universe/games");
const require = createRequire(import.meta.url);
const AXE = require.resolve("axe-core/axe.min.js");
const args = process.argv.slice(2);
const only = (args.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const noPerf = args.includes("--no-perf");
const serveRoot = resolve(ROOT, (args.find((a) => a.startsWith("--root=")) || "--root=.").slice(7));
const FPS_MIN = 30;

const slugs = readdirSync(GAMES).filter(
  (d) => existsSync(join(GAMES, d, "index.html")) && (!only.length || only.includes(d)),
);
if (!slugs.length) {
  console.error("FAIL no universe games found under math/games/universe/games/");
  process.exit(1);
}

const browser = await launchBrowser();
if (!browser) exitSkipped("no Chromium available", "Set PW_CHROMIUM_PATH to a system Chromium");
const server = await startStaticServer(serveRoot);
const failures = [];
const perf = {};

async function axe(page, where, fail) {
  await page.addScriptTag({ path: AXE });
  const r = await page.evaluate(() =>
    window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    }),
  );
  for (const v of r.violations.filter((x) => x.impact === "serious" || x.impact === "critical"))
    fail(`axe ${where}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target?.join(" ")}`);
}

for (const slug of slugs) {
  const fail = (msg) => failures.push(`${slug}: ${msg}`);
  const url = `${server.base}/math/games/universe/games/${slug}/?seed=4242`;
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  page.on("pageerror", (e) => fail(`page error: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text()))
      fail(`console: ${m.text()}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && !new URL(r.url()).pathname.startsWith("/api/"))
      fail(`HTTP ${r.status()} ${r.url()}`);
  });
  const u = (fn, ...a) => page.evaluate(fn, ...a);
  const mode = () => u(() => window.__universe.mode);
  try {
    // 1. boot
    await page.goto(url, { waitUntil: "load" });
    await page.waitForFunction(() => window.__universe?.mode === "title", null, { timeout: 15000 });
    const host = page.locator(await u(() => window.__universe.localName));
    const title = await host.locator("h1").innerText();
    if (!title.trim()) fail("title screen has no heading");
    await axe(page, "title", fail);

    // 3. language (on the title screen, before any state exists)
    await host.locator("button[lang]").click();
    const es = await host.locator("h1").innerText();
    if ((await u(() => document.documentElement.lang)) !== "es")
      fail("<html lang> did not switch to es");
    if (
      es === title &&
      !(await u(() => window.__universe.def.title.en === window.__universe.def.title.es))
    )
      fail("title did not change in Spanish");
    const start = await host.locator("#start").innerText();
    if (start !== "Comenzar") fail(`Start button reads "${start}" in Spanish`);
    await host.locator("button[lang]").click();

    // 4. settings
    await host.getByRole("button", { name: "Settings" }).click();
    for (const name of ["Reduced motion", "Low graphics", "High contrast"])
      await host.getByLabel(name).check();
    await host.getByRole("button", { name: "Back" }).click();
    if (!(await u(() => window.__universe.hasAttribute("data-contrast"))))
      fail("high contrast did not apply");
    await page.reload({ waitUntil: "load" });
    await page.waitForFunction(() => window.__universe?.mode === "title");
    if (!(await u(() => window.__universe.settings.lowfx && window.__universe.settings.reduced)))
      fail("settings did not survive a reload");
    await host.getByRole("button", { name: "Settings" }).click();
    for (const name of ["Reduced motion", "Low graphics", "High contrast"])
      await host.getByLabel(name).uncheck();
    await host.getByRole("button", { name: "Back" }).click();

    // 1b. start
    await host.locator("#start").click();
    if ((await mode()) !== "play") fail(`Start left the game in mode "${await mode()}"`);
    if (await host.locator("#hud").isHidden()) fail("no HUD in play");
    if (!(await host.locator("canvas#stage").getAttribute("aria-label")))
      fail("canvas has no description");
    if (!(await host.locator("#objective").innerText()).trim()) fail("no objective in the HUD");
    await axe(page, "play", fail);

    // 2. controls: a real key moves the player
    const where = () => u(() => JSON.stringify(window.__universe.focus(window.__universe.world)));
    await host.locator("canvas#stage").focus();
    let moved = false;
    for (const key of ["ArrowRight", "ArrowUp", "ArrowDown", "ArrowLeft"]) {
      const before = await where();
      await page.keyboard.down(key);
      await page.waitForTimeout(450);
      await page.keyboard.up(key);
      if ((await where()) !== before) {
        moved = true;
        break;
      }
    }
    if (!moved) fail("no arrow key moved the player");
    await page.keyboard.press("Escape");
    if ((await mode()) !== "pause") fail("Escape did not pause");
    await axe(page, "pause", fail);
    await page.keyboard.press("Escape");
    if ((await mode()) !== "play") fail("Escape did not resume");
    await host.locator("#btnTime").click();
    if (!(await host.getByRole("dialog", { name: "Time Machine" }).isVisible()))
      fail("Time Machine did not open");
    await host.getByRole("button", { name: "Resume" }).click();
    if ((await mode()) !== "play") fail("Time Machine did not resume");

    // 9. frame time, measured before the driver changes the scene
    if (!noPerf) {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await page.keyboard.down("ArrowRight");
      const m = await u(
        () =>
          new Promise((done) => {
            const t = [];
            let last = performance.now();
            const tick = (now) => {
              t.push(now - last);
              last = now;
              if (t.length < 180) requestAnimationFrame(tick);
              else {
                t.shift();
                t.sort((a, b) => a - b);
                const avg = t.reduce((a, b) => a + b, 0) / t.length;
                done({ fps: 1000 / avg, p95: t[Math.floor(t.length * 0.95)], worst: t.at(-1) });
              }
            };
            requestAnimationFrame(tick);
          }),
      );
      await page.keyboard.up("ArrowRight");
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
      perf[slug] = {
        throttle: "4x CPU",
        fps: +m.fps.toFixed(1),
        p95ms: +m.p95.toFixed(1),
        worstMs: +m.worst.toFixed(1),
      };
      if (m.fps < FPS_MIN) fail(`${m.fps.toFixed(1)} fps under 4x throttle (floor ${FPS_MIN})`);
    }

    // 5. play level 1 through the real interface
    const driver = join(ROOT, "tools/universe/drivers", `${slug}.mjs`);
    if (!existsSync(driver))
      fail("no driver at tools/universe/drivers/ — the game is not proven playable");
    else {
      await page.reload({ waitUntil: "load" });
      await page.waitForFunction(() => window.__universe?.mode === "title");
      await host.locator("#start").click();
      const { drive } = await import(pathToFileURL(driver).href);
      await drive({ page, host, u, fail, axe: (where) => axe(page, where, fail) });
      if ((await mode()) !== "done")
        fail(`driver finished with the game in mode "${await mode()}", not "done"`);
      const s = await u(() => window.__universe.evidence.summary());
      if (!s.levelsCompleted.length) fail("no completion evidence after level 1");
      if (!s.decisions) fail("level 1 finished with no mathematical decision recorded");
      // 6. resume
      await page.reload({ waitUntil: "load" });
      await page.waitForFunction(() => window.__universe?.mode === "title");
      if (!(await u(() => window.__universe.save.completed.length)))
        fail("completion did not survive a reload");
      if (!(await host.getByRole("button", { name: /^✓ 1\./ }).count()))
        fail("level 1 is not marked done after reload");
    }

    // 8. reflow
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: "load" });
    await page.waitForFunction(() => window.__universe?.mode === "title");
    const overflow = await u(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) fail(`horizontal scroll of ${overflow}px at 390px`);
    if (!(await host.locator("#start").isVisible())) fail("Start is not visible at 390px");
    const box = await host.locator("#start").boundingBox();
    if (box && (box.height < 44 || box.x < 0 || box.x + box.width > 390))
      fail("Start is clipped or under 44px at 390px");
  } catch (e) {
    fail(`gate crashed: ${String(e.message || e).split("\n")[0]}`);
  }
  await context.close();
  console.log(
    `${failures.some((f) => f.startsWith(`${slug}:`)) ? "FAIL" : "ok  "} ${slug}${perf[slug] ? `  ${perf[slug].fps} fps, p95 ${perf[slug].p95ms} ms @4x` : ""}`,
  );
}

await browser.close();
await server.close();
if (!noPerf && !only.length && serveRoot === ROOT) {
  mkdirSync(join(ROOT, "reports"), { recursive: true });
  writeFileSync(
    join(ROOT, "reports/universe-performance.json"),
    `${JSON.stringify({ measured: new Date().toISOString(), viewport: "1366x768", profile: "Chromium, 4x CPU throttle", games: perf }, null, 2)}\n`,
  );
}
if (failures.length) {
  console.error(`\nFAIL validate:universe-games-browser (${failures.length})`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`PASS validate:universe-games-browser — ${slugs.length} game(s) played in Chromium`);
