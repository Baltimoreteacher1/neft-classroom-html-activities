#!/usr/bin/env node
// Syntax Odyssey: Skyline Runner in a real browser: keyboard play to a gate (right and wrong answers, recovery, stepping
// pads), the Grapple Save, touch buttons at 390 px, Auto-walk through a whole chapter, pause/shop/results/replay/exit,
// English and Spanish at three viewports, no console errors, no horizontal overflow, a painted canvas, frame-time p95 at
// normal speed and 4x CPU throttle (with the quality tier reached), reduced motion, and 20 mount/exit cycles without
// listener growth. Screenshots go to $OD_SHOTS (default: the OS temp dir).
//   node tools/arcade-od-e2e.mjs            (set PW_CHROMIUM_PATH if Playwright's own Chromium is missing)
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  answerQuestion,
  consoleErrors,
  launch,
  openGame,
  startServer,
  VIEWPORTS,
} from "./lib/arcade-e2e.mjs";

const OUT = process.env.OD_SHOTS || join(tmpdir(), "arcade-od-shots");
mkdirSync(OUT, { recursive: true });
const ID = "syntax-odyssey";
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  [${detail}]` : ""}`);
};
const srv = await startServer(process.cwd());
const browser = await launch();
// The optional content layer (content/arcade/prompts-<band>.json) is another worker's; the game falls back to the bank without it.
const optional = /content\/arcade\/prompts-/;

const ONLY = (process.env.OD_ONLY || "").split(",").filter(Boolean); // e.g. OD_ONLY=grapple,touch to run part of the suite
async function session(opts = {}, fn) {
  if (ONLY.length && !ONLY.some((k) => (opts.label || "").includes(k))) return null;
  const ctx = await browser.newContext({
    viewport: opts.viewport || VIEWPORTS.chromebook,
    hasTouch: Boolean(opts.touch),
    reducedMotion: opts.reduced ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  const errs = [];
  consoleErrors(page, errs);
  if (opts.init) await page.addInitScript(opts.init);
  try {
    return await fn(page, errs, ctx);
  } finally {
    const real = errs.filter((e) => !optional.test(e));
    check(
      `no console errors (${opts.label || "session"})`,
      real.length === 0,
      real.slice(0, 3).join(" | "),
    );
    await ctx.close();
  }
}
const dbg = (page) => page.evaluate(() => window.__ARCADE__.game().debug());
const sess = (page, expr) => page.evaluate(expr);
const shot = (page, name) =>
  page
    .locator("[data-ax-host]")
    .screenshot({ path: join(OUT, `${name}.png`) })
    .catch(() => {});
const overflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const painted = (page) =>
  page.evaluate(() => {
    const c = document.querySelector("canvas.ax-od-canvas");
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const seen = new Set();
    for (let i = 0; i < d.length; i += 4 * 211)
      seen.add(`${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`);
    return seen.size;
  });

/** Open the game, choose a chapter in the in-game picker. */
async function begin(page, { band = "3-5", lang = "en", cfg = {}, chapter = 1, auto } = {}) {
  await openGame(page, srv.base, ID, { band, lang, cfg });
  await page.waitForSelector("[data-od-pick]", { timeout: 20000 });
  if (auto !== undefined) await page.setChecked("[data-od-auto]", auto);
  await page.click(`[data-od-pick="${chapter}"]`);
  await page.waitForFunction(() => window.__ARCADE__.game().debug().mode === "run", null, {
    timeout: 10000,
  });
  await page.focus("canvas.ax-od-canvas");
}

/** A keyboard player: real key events, steered by what the Auto-walk driver would press (shared lookahead). */
async function bot(page, until, { ms = 240000 } = {}) {
  const down = new Set();
  const set = async (key, on) => {
    if (on && !down.has(key)) {
      await page.keyboard.down(key);
      down.add(key);
    }
    if (!on && down.has(key)) {
      await page.keyboard.up(key);
      down.delete(key);
    }
  };
  const t0 = Date.now();
  let last;
  while (Date.now() - t0 < ms) {
    last = await dbg(page);
    if (until(last)) break;
    if (last.mode !== "run" || !last.hint) {
      await set("ArrowRight", false);
      await set("Space", false);
      await page.waitForTimeout(80);
      continue;
    }
    if ((await page.evaluate(() => document.activeElement?.tagName)) === "BUTTON")
      await page.focus("canvas.ax-od-canvas");
    await set("ArrowRight", last.hint.right);
    await set("Space", last.hint.jump);
    await page.waitForTimeout(24);
  }
  await set("ArrowRight", false);
  await set("Space", false);
  return last;
}
const state = (page) => sess(page, () => window.__ARCADE__.state());

// ── 1. keyboard play to a gate, right and wrong answers, stepping pads, the level card ──────────
await session({ label: "keyboard" }, async (page) => {
  await begin(page, { cfg: { level: 2 } });
  const d0 = await dbg(page);
  check(
    "picker then world: chapter 1, level 1, screen 1",
    d0.level === "od-ch1-l1" && d0.seq === 1,
  );
  await shot(page, "10-keyboard-start");
  const x0 = d0.body.x;
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(700);
  await page.keyboard.up("ArrowRight");
  const d1 = await dbg(page);
  check(
    "arrow keys run the Explorer",
    d1.body.x > x0 + 60,
    `x ${Math.round(x0)} -> ${Math.round(d1.body.x)}`,
  );
  await page.keyboard.press("Space");
  await page.waitForTimeout(120);
  check("Space jumps", !(await dbg(page)).body.grounded);
  const reached = await bot(page, (d) => d.run.stats.gates > 0 || d.mode === "gate", {});
  const open = await bot(page, async () => (await state(page)) === "QUESTION_ACTIVE", {
    ms: 60000,
  }).catch(() => null);
  check(
    "running and jumping across three screens reaches a language gate",
    reached.mode === "gate" || (await state(page)) === "QUESTION_ACTIVE",
    `screen ${reached.seq}`,
  );
  await page.waitForSelector("[data-ax-q]", { timeout: 15000 });
  const frozen = await dbg(page);
  await page.waitForTimeout(500);
  const still = await dbg(page);
  check(
    "the world is frozen while a question is open",
    Math.abs(still.body.x - frozen.body.x) < 0.5 && Math.abs(still.body.y - frozen.body.y) < 0.5,
  );
  await shot(page, "11-gate-question");
  await answerQuestion(page, { right: false });
  await page.waitForFunction(
    () => window.__ARCADE__.game().debug().run.gates[0] === "segments",
    null,
    { timeout: 8000 },
  );
  check("a miss leaves stepping pads (a recoverable obstacle), not a dead end", true);
  const pads = await bot(page, (d) => d.mode === "card" || d.run.level === 2, { ms: 90000 });
  check(
    "the Explorer crosses the pads to the exit and the level card opens",
    pads.mode === "card",
    `mode ${pads.mode}`,
  );
  await shot(page, "12-level-card");
  const card = await page.locator(".ax-od-card").innerText();
  check(
    "level card names the level and the world Shards",
    /Level 1 complete/.test(card) && /Shards/.test(card),
    card.replace(/\s+/g, " ").slice(0, 80),
  );
  await page.click('[data-od="next"]');
  await page.waitForFunction(() => window.__ARCADE__.game().debug().run.level === 2, null, {
    timeout: 8000,
  });
  check("Continue starts level 2 (saved run advanced)", true);
  const saved = await sess(page, () => JSON.stringify(window.__ARCADE__.session().gameState));
  check(
    "run state is saved with the session (level + completion)",
    /"level":2/.test(saved) && /od-ch1-l1/.test(saved),
  );
  void open;
});

// ── 2. Grapple Save: buy one, fall, use it; and a fall without one returns to the checkpoint ──
await session({ label: "grapple" }, async (page) => {
  await begin(page, { band: "6-8", cfg: { level: 4 } });
  await page.focus("canvas.ax-od-canvas");
  await page.keyboard.down("ArrowRight");
  await page.waitForFunction(() => window.__ARCADE__.game().debug().run.stats.falls > 0, null, {
    timeout: 20000,
  });
  await page.keyboard.up("ArrowRight");
  const d = await dbg(page);
  check(
    "a fall with no Grapple Save goes back to the checkpoint, no card, no academic change",
    d.mode === "run" && (await sess(page, () => window.__ARCADE__.session().records.length)) === 0,
    `mode ${d.mode}`,
  );
  check(
    "the Grapple button is hidden until one is owned",
    await page.locator('[data-od="grapple"]').isHidden(),
  );
  await sess(page, () => window.__ARCADE__.session().grantShards(200, "qa-grapple"));
  await page.click('[data-ax="shop"]');
  await page.waitForSelector('[data-ax="buy"][data-item="grapple"]');
  await page.click('[data-ax="buy"][data-item="grapple"]');
  await page.click('[data-ax="shop-close"]');
  check(
    "Grapple Save is sold in the shop for this game",
    (await sess(page, () => window.__ARCADE__.session().economy.stock.grapple)) === 1,
  );
  await page.focus("canvas.ax-od-canvas");
  await page.waitForTimeout(300);
  await page.locator('[data-od="grapple"]').waitFor({ state: "visible" });
  await page.keyboard.down("ArrowRight");
  await page.waitForSelector('[data-od="fall-grapple"]', { timeout: 20000 });
  await page.keyboard.up("ArrowRight");
  await shot(page, "20-fall-card");
  const before = (await dbg(page)).run.stats.falls;
  await page.keyboard.press("KeyG");
  await page.waitForFunction(() => window.__ARCADE__.game().debug().mode === "run", null, {
    timeout: 5000,
  });
  const after = await dbg(page);
  check(
    "G (or the button) spends one Grapple Save and lifts the Explorer back to a safe ledge",
    (await sess(page, () => window.__ARCADE__.session().economy.stock.grapple)) === 0 &&
      after.body.grounded &&
      after.run.stats.grapples === 1 &&
      after.run.stats.falls === before,
  );
  await shot(page, "21-after-grapple");
});

// ── 3. touch buttons at 390 x 844 ──────────────────────────────────────────────────────────────
await session({ label: "touch", viewport: VIEWPORTS.phone, touch: true }, async (page) => {
  await begin(page, { cfg: { level: 2 } });
  await shot(page, "30-phone-run");
  const sizes = await page.$$eval(".ax-od-hold, .ax-od-tools .ax-btn:not([hidden])", (els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return [e.className.split(" ")[0], Math.round(r.width), Math.round(r.height)];
    }),
  );
  check(
    "movement buttons are at least 56 px",
    sizes.filter(([c]) => c === "ax-od-hold").every(([, w, h]) => w >= 56 && h >= 56),
    JSON.stringify(sizes.filter(([c]) => c === "ax-od-hold")),
  );
  check(
    "every other control is at least 44 px tall",
    sizes.every(([, , h]) => h >= 44),
    JSON.stringify(sizes.map((s) => s[2])),
  );
  const press = async (sel, ms) => {
    const b = await page.locator(sel).boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(ms);
    await page.mouse.up();
  };
  const x0 = (await dbg(page)).body.x;
  await press('[data-act="right"]', 700);
  const x1 = (await dbg(page)).body.x;
  check(
    "holding the on-screen Right button runs the Explorer",
    x1 > x0 + 60,
    `${Math.round(x0)} -> ${Math.round(x1)}`,
  );
  await press('[data-act="left"]', 500);
  check("Left runs back", (await dbg(page)).body.x < x1 - 30);
  const jumped = await page.evaluate(async () => {
    const b = document.querySelector('[data-act="jump"]');
    b.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 120));
    const air = !window.__ARCADE__.game().debug().body.grounded;
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    return air;
  });
  check("the Jump button jumps", jumped);
  check(
    "no horizontal overflow at 390 px",
    (await overflow(page)) <= 0,
    String(await overflow(page)),
  );
  check("the canvas is painted", (await painted(page)) > 12, String(await painted(page)));
  await page.click('[data-od="where"]');
  const where = await page.locator("[data-od-where]").innerText();
  check(
    "'Where am I?' describes the route in words",
    /island/.test(where) && /Shards/.test(where),
    where.slice(0, 90),
  );
  const label = await page.getAttribute("canvas.ax-od-canvas", "aria-label");
  check(
    "the canvas has role=img and a live text alternative",
    (await page.getAttribute("canvas.ax-od-canvas", "role")) === "img" &&
      /Cloud Library/.test(label),
    label.slice(0, 70),
  );
});

// ── 4. Auto-walk completes a chapter; pause, shop, results, replay, exit ───────────────────────
await session({ label: "auto-walk" }, async (page) => {
  await begin(page, { band: "3-5", cfg: { level: 1, calm: true }, chapter: 2 });
  check(
    "calm mode selects Auto-walk by default",
    (await page.getAttribute('[data-od="auto"]', "aria-pressed")) === "true",
  );
  await shot(page, "40-autowalk-start");
  await page.click('[data-ax="pause"]');
  const pausedAt = await dbg(page);
  await page.waitForTimeout(400);
  check(
    "pause freezes the world",
    (await state(page)) === "PAUSED" && Math.abs((await dbg(page)).body.x - pausedAt.body.x) < 0.5,
  );
  await page.click('[data-ax="resume"]');
  let gates = 0;
  let shots = 0;
  const t0 = Date.now();
  for (;;) {
    if (Date.now() - t0 > 330000) break;
    if (await page.locator(".ax-results").count()) break;
    const d = await dbg(page).catch(() => null);
    if (!d) {
      await page.waitForTimeout(200);
      continue;
    }
    if (d.mode === "run" && !d.walking) await page.click('[data-od="go"]');
    else if (d.mode === "card") {
      if (shots++ === 0) await shot(page, "41-autowalk-level-card");
      await page.click('[data-od="next"]');
    } else if (d.mode === "gate" && (await state(page)) === "QUESTION_ACTIVE") {
      await answerQuestion(page, { right: gates % 2 === 0 });
      gates += 1;
    } else await page.waitForTimeout(150);
  }
  await page.waitForSelector(".ax-results", { timeout: 20000 });
  const res = await page.locator(".ax-results").innerText();
  await shot(page, "42-results");
  check(
    "Auto-walk completes a whole chapter (3 levels, 4 language gates)",
    gates === 4 && /Chapter complete|Grammar Gardens/.test(res),
    `gates ${gates}`,
  );
  const facts = await page.locator(".ax-od-sum").innerText();
  check(
    "the game's own results are facts (gates, bridges, levels, Shards, falls), with no mastery or WIDA claim",
    /Language gates passed/.test(facts) &&
      /Falls \(no academic penalty\)/.test(facts) &&
      !/(mastery|mastered|proficien|WIDA|score)/i.test(facts),
    facts.replace(/\s+/g, " ").slice(0, 100),
  );
  check(
    "the shared results screen is on screen with the chapter title",
    /Chapter complete/.test(res),
    res.replace(/\s+/g, " ").slice(0, 60),
  );
  const done = await sess(page, () =>
    JSON.stringify(
      JSON.parse(localStorage.getItem("accessPracticeLab:v1:arcade")).games["syntax-odyssey"] || {},
    ),
  );
  check(
    "completion is recorded for replay selection (od-ch2-l3)",
    /od-ch2-l3/.test(done),
    done.slice(0, 120),
  );
  await page.click('[data-ax="replay"]');
  await page.waitForSelector("[data-od-pick]", { timeout: 15000 });
  const rec = await page.getAttribute("[data-od-pick].is-rec", "data-od-pick");
  check(
    "replay opens the chapter picker, and the next unfinished chapter is recommended",
    rec === "1" || rec === "3",
    `recommended ${rec}`,
  );
  await page.click('[data-od-pick="3"]');
  await page.waitForFunction(() => window.__ARCADE__.game().debug().run.chapter === 3, null, {
    timeout: 8000,
  });
  check("a replayed run is a fresh run in the chosen chapter (Syntax Skyline)", true);
  await page.click('[data-ax="exit"]');
  await page.click('[data-ax="leave"]');
  await page.waitForSelector("[data-ax-launch]", { timeout: 10000 });
  check(
    "exit returns to the launcher with the run saved",
    (await page.locator('[data-ax="continue"]').count()) > 0,
  );
});

// ── 5. Spanish and English at three viewports: layout, overflow, painted canvas ────────────────
for (const [name, viewport] of Object.entries({
  chromebook: VIEWPORTS.chromebook,
  tablet: VIEWPORTS.tablet,
  phone: VIEWPORTS.phone,
})) {
  for (const lang of ["en", "es"]) {
    await session({ label: `${lang} ${name}`, viewport, touch: name === "phone" }, async (page) => {
      await openGame(page, srv.base, ID, {
        band: lang === "es" ? "6-8" : "3-5",
        lang,
        cfg: { level: 3 },
      });
      await page.waitForSelector("[data-od-pick]", { timeout: 20000 });
      await shot(page, `50-${lang}-${name}-picker`);
      const pick = await page.locator(".ax-od-pick").innerText();
      check(
        `${lang} ${name}: picker is in ${lang === "es" ? "Spanish" : "English"}`,
        lang === "es"
          ? /Elige un capítulo/.test(pick) && !/Choose a chapter/.test(pick)
          : /Choose a chapter/.test(pick),
      );
      await page.click('[data-od-pick="3"]');
      await page.waitForFunction(() => window.__ARCADE__.game().debug().mode === "run", null, {
        timeout: 10000,
      });
      await page.waitForTimeout(900);
      await shot(page, `51-${lang}-${name}-run`);
      const tools = await page.locator(".ax-od-panel").innerText();
      check(
        `${lang} ${name}: controls are in ${lang === "es" ? "Spanish" : "English"}`,
        lang === "es"
          ? /Ir a la siguiente puerta/.test(tools) &&
              /Saltar/.test(tools) &&
              !/Go to next gate/.test(tools)
          : /Go to next gate/.test(tools),
      );
      check(
        `${lang} ${name}: no horizontal overflow`,
        (await overflow(page)) <= 0,
        String(await overflow(page)),
      );
      check(`${lang} ${name}: the canvas is painted`, (await painted(page)) > 12);
      if (lang === "es")
        check(
          "Spanish canvas text alternative",
          /Biblioteca|Jardines|Horizonte/.test(
            await page.getAttribute("canvas.ax-od-canvas", "aria-label"),
          ),
        );
    });
  }
}

// ── 6. performance: frame-time p95 at normal speed and at 4x CPU throttle ──────────────────────
const perf = {};
for (const rate of [1, 4]) {
  await session({ label: `perf x${rate}` }, async (page, _errs, ctx) => {
    await begin(page, { band: "6-8", cfg: { level: 5 }, chapter: 3 });
    if (rate > 1)
      await (await ctx.newCDPSession(page)).send("Emulation.setCPUThrottlingRate", { rate });
    await page.click('[data-od="go"]');
    await page.waitForTimeout(rate > 1 ? 14000 : 7000);
    const d = await dbg(page);
    perf[rate] = {
      p95: Math.round(d.p95 * 10) / 10,
      avg: Math.round(d.avg * 10) / 10,
      tier: d.quality,
    };
    check(
      `frame time at ${rate}x CPU: p95 ${perf[rate].p95} ms, avg ${perf[rate].avg} ms, tier ${d.quality}`,
      rate === 1 ? d.p95 < 34 : d.p95 < 90 || d.quality === "low",
      JSON.stringify(perf[rate]),
    );
    await shot(page, `60-perf-x${rate}`);
  });
}

// ── 7. reduced motion pins the cheapest tier and calms the world ───────────────────────────────
await session({ label: "reduced motion", reduced: true }, async (page) => {
  await begin(page, { cfg: { level: 3 } });
  const d = await dbg(page);
  check(
    "prefers-reduced-motion: motion reduced and quality pinned low",
    d.reduced === true && d.quality === "low",
    `${d.reduced} ${d.quality}`,
  );
  check("the canvas still paints with reduced motion", (await painted(page)) > 8);
});

// ── 8. twenty mount/exit cycles: no listener growth ────────────────────────────────────────────
await session(
  {
    label: "20 cycles",
    init: () => {
      const net = {};
      const key = (t, type) =>
        `${t === window ? "window" : t === document ? "document" : "el"}:${type}`;
      const add = EventTarget.prototype.addEventListener;
      const rem = EventTarget.prototype.removeEventListener;
      const seen = new WeakMap();
      EventTarget.prototype.addEventListener = function (type, fn, o) {
        const k = key(this, type);
        const m = seen.get(this) || new Set();
        if (fn && !m.has(fn)) {
          m.add(fn);
          seen.set(this, m);
          net[k] = (net[k] || 0) + 1;
        }
        return add.call(this, type, fn, o);
      };
      EventTarget.prototype.removeEventListener = function (type, fn, o) {
        const k = key(this, type);
        const m = seen.get(this);
        if (m?.has(fn)) {
          m.delete(fn);
          net[k] = (net[k] || 0) - 1;
        }
        return rem.call(this, type, fn, o);
      };
      window.__netListeners = () => ({ ...net });
    },
  },
  async (page) => {
    const totals = [];
    for (let i = 0; i < 20; i += 1) {
      await openGame(page, srv.base, ID, { band: "3-5", cfg: { level: 3 }, start: i === 0 });
      if (i > 0) await page.click('[data-ax="start"]');
      await page.waitForSelector("[data-od-pick]", { timeout: 20000 });
      await page.click('[data-od-pick="1"]');
      await page.waitForFunction(() => window.__ARCADE__.game().debug().mode === "run", null, {
        timeout: 10000,
      });
      await page.waitForTimeout(150);
      await page.click('[data-ax="exit"]');
      await page.click('[data-ax="leave"]');
      await page.waitForSelector("[data-ax-launch]", { timeout: 10000 });
      totals.push(
        await page.evaluate(() =>
          Object.entries(window.__netListeners())
            .filter(([k]) => !k.startsWith("el:"))
            .reduce((n, [, v]) => n + v, 0),
        ),
      );
    }
    const growth = totals[19] - totals[4];
    check(
      "20 mount/exit cycles leave no window/document listeners behind",
      growth <= 0,
      `net window+document listeners after cycles 5/20: ${totals[4]}/${totals[19]}`,
    );
  },
);

await browser.close();
await srv.close();
const failed = results.filter((r) => !r.ok);
console.log(
  `\n${results.length - failed.length}/${results.length} checks passed. Screenshots: ${OUT}`,
);
console.log(`Frame time: ${JSON.stringify(perf)}`);
if (failed.length) {
  console.log(`FAILED:\n${failed.map((f) => `  - ${f.name} ${f.detail}`).join("\n")}`);
  process.exit(1);
}
