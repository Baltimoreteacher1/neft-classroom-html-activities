// Shared harness for the browser-based style and quality gates
// (validate:contrast-browser, :typography-browser, :responsive, :console-clean, :axe-lessons).
//
// WHAT IT IS. One way to get inside a built lesson (entry card -> identity gate -> lesson ->
// every sidebar phase -> a driven wrong-then-right warm-up answer), and one place that decides
// the three honest outcomes:
//
//   exit 0  PASS  - the sweep ran, covered what it claims to cover, and nothing failed
//   exit 1  FAIL  - a finding, OR the sweep did not cover enough to mean anything
//   exit 3  SKIP  - no browser / no server (tools/lib/skip-exit.mjs); nothing was verified
//
// THE GUARD THAT MATTERS. A gate that clicks nothing measures only the entry card and prints a
// clean report. Every gate therefore also fails when too few lessons were ENTERED, too few states
// were measured per lesson, or the fleet shrank below what the manifest promises ("swept minimum").
//
// MEASUREMENT RULE. Only computed values: getComputedStyle, getBoundingClientRect, layout-shift
// entries, axe results. Never source text.
//
// Several gates can share ONE browser pass (`runGates([a, b, c])`), which is how the publisher
// scorecard collects everything without opening each lesson five times.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { chromium } from "playwright";
import { skipExit } from "./skip-exit.mjs";

// ---------------------------------------------------------------- arguments
export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    if (eq > 0) {
      out[a.slice(2, eq)] = a.slice(eq + 1);
      continue;
    }
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      out[a.slice(2)] = next;
      i++;
    } else out[a.slice(2)] = true;
  }
  return out;
}

export const parseViewport = (v) => {
  const [w, h] = String(v).split("x").map(Number);
  if (!(w > 0 && h > 0)) throw new Error(`bad --viewport "${v}" (want WxH)`);
  return { w, h, name: `${w}x${h}` };
};

export function manifestLessonIds(root = process.cwd()) {
  const m = JSON.parse(readFileSync(join(root, "data/curriculum-launch-manifest.json"), "utf8"));
  return (m.lessons || []).map((l) => l.id);
}

// ------------------------------------------------------------------ servers
export async function reachable(base, path = "/") {
  try {
    const r = await fetch(base + path, { signal: AbortSignal.timeout(5000) });
    return r.status < 500;
  } catch {
    return false;
  }
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
};

/** Minimal static server (used for dist/ when no --base is given, and for the test fixtures). */
export function startStaticServer(dir, port = 0) {
  const root = resolve(dir);
  return new Promise((ok, bad) => {
    const srv = createServer((req, res) => {
      try {
        const url = decodeURIComponent((req.url || "/").split("?")[0]);
        let p = normalize(join(root, url));
        if (!p.startsWith(root)) {
          res.writeHead(403).end();
          return;
        }
        if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
        if (!existsSync(p)) {
          res.writeHead(404, { "content-type": "text/plain" }).end("not found");
          return;
        }
        res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" });
        res.end(readFileSync(p));
      } catch (e) {
        res.writeHead(500).end(String(e));
      }
    });
    srv.on("error", bad);
    srv.listen(port, "127.0.0.1", () =>
      ok({
        base: `http://127.0.0.1:${srv.address().port}`,
        close: () => new Promise((r) => srv.close(() => r())),
      }),
    );
  });
}

export async function launchBrowser() {
  try {
    return await chromium.launch(
      process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    );
  } catch {
    return null;
  }
}

// ---------------------------------------------------------- in-page helpers
// Installed with addInitScript, so every probe can call window.__g.* . Must be self-contained.
export function installHelpers() {
  const parse = (c) => {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1]
      .split(/[ ,/]+/)
      .filter(Boolean)
      .map(Number);
    return { r, g, b, a };
  };
  const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lum = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => {
    const x = lum(a);
    const y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const over = (fg, bg) => {
    const a = fg.a ?? 1;
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1,
    };
  };
  const hex = ({ r, g, b }) =>
    `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
  const srOnly = (e, r) => {
    r = r || e.getBoundingClientRect();
    return r.width < 2 || r.height < 2;
  };
  // A flip card's far face (backface-visibility:hidden, turned half-way round) is in the DOM and
  // has a size, but nobody can see it. The first baseline "found" the Spanish side of every
  // vocabulary card at 2.1:1 because of this; the pixels showed the white front instead.
  const facingAway = (e) => {
    for (let n = e; n && n.nodeType === 1; n = n.parentElement) {
      if (getComputedStyle(n).backfaceVisibility !== "hidden") continue;
      const m = new DOMMatrix();
      const stack = [];
      for (let x = n; x && x.nodeType === 1; x = x.parentElement) stack.push(x);
      for (let i = stack.length - 1; i >= 0; i--) {
        const t = getComputedStyle(stack[i]).transform;
        if (t && t !== "none") m.multiplySelf(new DOMMatrix(t));
      }
      if (m.m33 < 0) return true;
    }
    return false;
  };
  const visible = (e) => {
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const s = getComputedStyle(e);
    if (s.visibility === "hidden" || s.display === "none" || +s.opacity <= 0.02) return false;
    // Content inside a closed <details> keeps a layout box but is never painted
    // (content-visibility:hidden); checkVisibility() knows, getBoundingClientRect() does not.
    if (
      e.checkVisibility &&
      !e.checkVisibility({ checkVisibilityCSS: true, contentVisibilityAuto: true })
    )
      return false;
    return !facingAway(e);
  };
  // Effective solid background behind element `e`. Translucent layers are composited over the
  // first opaque ancestor; an ancestor's opacity scales every layer inside it (an approximation
  // of group compositing that is exact for a single layer). Returns {c, op} (op = the element's
  // own cumulative opacity, to scale its text) or {why} when it cannot be known from computed
  // colour alone (gradient/image, an almost invisible element).
  const bgOf = (e) => {
    const chain = [];
    for (let n = e; n && n.nodeType === 1; n = n.parentElement) chain.push(n);
    const ops = new Array(chain.length);
    let cum = 1;
    for (let i = chain.length - 1; i >= 0; i--) {
      cum *= +getComputedStyle(chain[i]).opacity;
      ops[i] = cum;
    }
    if (ops[0] < 0.05) return { why: "invisible" };
    const layers = [];
    for (let i = 0; i < chain.length; i++) {
      const s = getComputedStyle(chain[i]);
      if (s.backgroundImage && s.backgroundImage !== "none") return { why: "image" };
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) {
        layers.push({ ...c, a: c.a * ops[i] });
        if (c.a * ops[i] >= 0.99) break;
      }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return { c: base, op: ops[0] };
  };
  const sig = (e) => {
    const one = (n) =>
      `${n.tagName.toLowerCase()}${[...n.classList]
        .filter((c) => !/\d/.test(c))
        .slice(0, 2)
        .map((c) => `.${c}`)
        .join("")}`;
    const p = e.parentElement;
    return (p && p !== document.body ? `${one(p)}>` : "") + one(e);
  };
  const ownText = (e) =>
    [...e.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  const textEls = () =>
    [...document.querySelectorAll("body *")].filter((e) => {
      if (/^(SCRIPT|STYLE|NOSCRIPT|SVG|PATH|TEMPLATE)$/i.test(e.tagName)) return false;
      if (!ownText(e)) return false;
      const r = e.getBoundingClientRect();
      return !srOnly(e, r) && visible(e);
    });
  // Is the element's centre actually the thing painted there? Skips text buried under a modal
  // or scrolled out of an overflow container, which is not what a student sees.
  const painted = (e) => {
    const r = e.getBoundingClientRect();
    const x = r.left + Math.min(r.width / 2, 40);
    const y = r.top + r.height / 2;
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return true; // cannot probe offscreen
    const top = document.elementFromPoint(x, y);
    return !top || e.contains(top) || top.contains(e);
  };
  window.__g = {
    parse,
    lum,
    ratio,
    over,
    hex,
    srOnly,
    visible,
    bgOf,
    sig,
    ownText,
    textEls,
    painted,
  };

  // Layout-shift + font-load timeline, for the typography gate.
  window.__ls = [];
  window.__fontEv = [];
  try {
    new PerformanceObserver((list) => {
      for (const en of list.getEntries()) {
        window.__ls.push({
          v: en.value,
          t: en.startTime,
          input: en.hadRecentInput,
          nodes: (en.sources || []).map((s) => {
            const n = s.node;
            return {
              tag: n && n.nodeType === 1 ? n.tagName : n ? "#text" : "?",
              text: !!(n && (n.textContent || "").trim()),
            };
          }),
        });
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch {}
  const hook = () => {
    if (!document.fonts) return;
    document.fonts.addEventListener("loadingdone", (ev) => {
      window.__fontEv.push({
        t: performance.now(),
        faces: (ev.fontfaces || []).map((f) => f.family.replace(/["']/g, "")),
      });
    });
  };
  if (document.fonts) hook();
  else document.addEventListener("DOMContentLoaded", hook);
}

// ----------------------------------------------------------------- driving
export async function enter(page) {
  // Mission/entry card(s) -> identity gate -> lesson (same logic as tools/style-audit.mjs).
  for (let step = 0; step < 4; step++) {
    const name = page.locator('input[placeholder*="First"]').first();
    if (await name.isVisible().catch(() => false)) {
      await name.fill("Sam T");
      await page
        .locator('input[placeholder*="3"]')
        .first()
        .fill("3")
        .catch(() => {});
      await page
        .locator("button", { hasText: /Start Activity/i })
        .last()
        .click()
        .catch(() => {});
      return page
        .waitForSelector(".phase-btn", { timeout: 9000 })
        .then(() => true)
        .catch(() => false);
    }
    const go = page
      .locator("button", { hasText: /→/ })
      .filter({ hasNotText: /Next:|Save|Workbench|Teacher/ })
      .first();
    if (!(await go.isVisible().catch(() => false))) return false;
    await go.click().catch(() => {});
    await page.waitForTimeout(600);
  }
  return false;
}

export async function listPhases(page) {
  return page.evaluate(() => {
    const seen = new Set();
    const out = [];
    for (const b of document.querySelectorAll(".phase-btn:not(.extra-btn)")) {
      if (!b.offsetParent && !b.getClientRects().length) continue;
      const label = (b.innerText || "")
        .split("\n")
        .map((x) => x.trim())
        .find((x) => /\p{L}/u.test(x));
      if (!label || seen.has(label)) continue;
      seen.add(label);
      out.push(label);
    }
    return out;
  });
}

export async function goPhase(page, label) {
  return page.evaluate((lab) => {
    const b = [...document.querySelectorAll(".phase-btn:not(.extra-btn)")].find((x) =>
      (x.innerText || "")
        .split("\n")
        .map((y) => y.trim())
        .includes(lab),
    );
    if (!b) return false;
    b.click();
    return true;
  }, label);
}

/** Wrong answer on warm-up Q1, right answers on the rest, then Submit. Returns what happened. */
export async function driveWarmupFeedback(page, config) {
  const qs = config?.warmup?.questions;
  if (!Array.isArray(qs) || qs.length < 2) return { ok: false, why: "no warm-up questions" };
  const correct = qs.map((q) => q.correctIndex);
  const picked = await page.evaluate((cor) => {
    const cards = [...document.querySelectorAll(".warmup-question-card")];
    let wrong = 0;
    let right = 0;
    cards.forEach((c, i) => {
      const radios = [...c.querySelectorAll("input[type=radio]")];
      const want =
        i === 0
          ? radios.find((r) => Number(r.value) !== cor[i])
          : radios.find((r) => Number(r.value) === cor[i]);
      if (want) {
        want.click();
        if (i === 0) wrong++;
        else right++;
      }
    });
    return { cards: cards.length, wrong, right };
  }, correct);
  if (!picked.wrong || !picked.right) return { ok: false, why: "no radio choices", picked };
  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) =>
      /Submit Warmup/i.test(x.innerText),
    );
    if (!b) return false;
    b.click(); // DOM click: a floating pill can sit over the button at some widths
    return true;
  });
  if (!clicked) return { ok: false, why: "no submit button", picked };
  await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll(".warmup-fb-box")].some(
          (b) => getComputedStyle(b).display !== "none",
        ),
      null,
      { timeout: 4000 },
    )
    .catch(() => {});
  const shown = await page.evaluate(
    () =>
      [...document.querySelectorAll(".warmup-fb-box")].filter(
        (b) => getComputedStyle(b).display !== "none",
      ).length,
  );
  if (!shown) return { ok: false, why: "submit showed no feedback", picked };
  return { ok: true, picked };
}

/**
 * Wait until finite CSS animations/transitions have finished (max ~2.5s). A colour measured
 * mid-fade is not what a student reads: before this existed the contrast gate reported
 * "Word Wall" at 1.38:1 and "Tap to flip" at 1.35:1 - text caught half-way through its
 * entrance transition. Infinite animations (spinners) are ignored.
 */
export async function waitIdle(page) {
  await page
    .evaluate(async () => {
      const t0 = performance.now();
      const running = () =>
        document.getAnimations().filter((a) => {
          if (a.playState !== "running") return false;
          const end = a.effect?.getComputedTiming?.().endTime;
          return Number.isFinite(end);
        });
      while (performance.now() - t0 < 2500 && running().length)
        await new Promise((r) => setTimeout(r, 60));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    })
    .catch(() => {});
}

// ------------------------------------------------------------------- sweep
const NOISE = /ERR_TUNNEL|favicon|net::ERR_(PROXY|CERT|NAME_NOT_RESOLVED|CONNECTION|INTERNET)/;

async function sweepOne(browser, ctxOpts, gates, o) {
  const { base, id, vp, args } = o;
  const rec = {
    id,
    viewport: vp.name,
    entered: false,
    states: [],
    page: {},
    nav: { phases: 0, visited: 0, failed: [] },
  };
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, ...ctxOpts });
  const page = await ctx.newPage();
  let current = "load";
  const consoleErrs = [];
  const ignored = { network: 0, api: 0, noise: 0 };
  const origin = new URL(base).origin;
  page.on("pageerror", (e) =>
    consoleErrs.push({ type: "pageerror", text: e.message.slice(0, 200), state: current }),
  );
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    const url = m.location()?.url || "";
    if (NOISE.test(text) || NOISE.test(url)) {
      ignored.noise++;
      return;
    }
    // A blocked third-party request (fonts CDN, analytics, hub API) is the sandbox, not the page.
    if (/Failed to load resource/.test(text) && url && !url.startsWith(origin)) {
      ignored.network++;
      return;
    }
    // /api/* has no Worker behind a static preview (same rule as smoke:injection).
    if (/Failed to load resource/.test(text) && /\/api\//.test(url)) {
      ignored.api++;
      return;
    }
    consoleErrs.push({
      type: "console",
      text: text.slice(0, 200),
      url: url.slice(0, 120),
      state: current,
    });
  });
  await page.addInitScript(`(${installHelpers.toString()})()`);
  let config = null;
  if (!args.static) {
    try {
      config = JSON.parse(readFileSync(join(process.cwd(), `lessons/${id}/config.json`), "utf8"));
    } catch {}
  }
  const measure = async (label, kind, extra) => {
    current = label;
    await waitIdle(page);
    const st = { label, kind, data: {}, ...extra };
    for (const g of gates) {
      if (!g.probe) continue;
      try {
        st.data[g.name] = await g.probe(page, { id, vp, label, kind, args });
      } catch (e) {
        st.data[g.name] = { probeError: String(e.message).slice(0, 160) };
      }
    }
    rec.states.push(st);
  };
  try {
    const t0 = Date.now();
    const path = (args.path || "/lessons/{id}/").replace("{id}", id);
    await page.goto(base + path, { waitUntil: "load", timeout: 40000 });
    await page.evaluate(() => document.fonts?.ready).catch(() => {});
    await page.waitForTimeout(+args.settle || 450);
    rec.loadMs = Date.now() - t0;
    await measure("entry", "entry");
    if (!args.static) {
      rec.entered = await enter(page);
      if (rec.entered) {
        await page.waitForTimeout(+args.settle || 450);
        await measure("lesson", "lesson");
        if (gates.some((g) => g.feedback)) {
          const fb = await driveWarmupFeedback(page, config);
          rec.feedback = fb;
          if (fb.ok) {
            await page.waitForTimeout(400);
            await measure("feedback", "feedback");
          }
        }
        if (!args["no-phases"]) {
          const phases = await listPhases(page);
          rec.nav.phases = phases.length;
          for (const lab of phases) {
            const ok = await goPhase(page, lab);
            if (!ok) {
              rec.nav.failed.push(lab);
              continue;
            }
            await page.waitForTimeout(+args.settle || 450);
            await measure(`phase:${lab}`, "phase");
            rec.nav.visited++;
          }
        }
      }
    }
    await page.waitForTimeout(250);
    for (const g of gates) {
      if (g.finish) {
        try {
          rec.page[g.name] = await g.finish(page, rec);
        } catch (e) {
          rec.page[g.name] = { probeError: String(e.message).slice(0, 160) };
        }
      }
    }
    rec.page.console = { errors: consoleErrs, ignored };
  } catch (e) {
    rec.fatal = String(e.message).slice(0, 200);
    rec.page.console = { errors: consoleErrs, ignored };
  }
  await ctx.close();
  return rec;
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.max(1, n) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

// ------------------------------------------------------------------ review
/** data/browser-gate-review.json: recorded human decisions. Reasons >= 40 chars; stale entries fail. */
export function loadReview(path = "data/browser-gate-review.json") {
  if (!existsSync(path)) return { entries: [], problems: [] };
  const j = JSON.parse(readFileSync(path, "utf8"));
  const problems = [];
  for (const [i, e] of (j.entries || []).entries()) {
    if (!e.gate || !e.key) problems.push(`entry ${i}: needs "gate" and "key"`);
    if (String(e.reason || "").trim().length < 40)
      problems.push(`entry ${i} (${e.gate}/${e.key}): reason must be 40+ characters`);
    if (!e.decidedBy || String(e.decidedBy).trim().length < 3)
      problems.push(`entry ${i} (${e.gate}/${e.key}): needs "decidedBy" (a person)`);
  }
  return { entries: j.entries || [], problems };
}

function applyReview(gateName, findings, review, fullSweep) {
  const mine = review.entries.filter((e) => e.gate === gateName);
  const used = new Set();
  const open = [];
  const reviewed = [];
  for (const f of findings) {
    const hit = mine.find(
      (e) =>
        e.key === f.key &&
        (e.lessons === "*" || (Array.isArray(e.lessons) && e.lessons.includes(f.lesson))),
    );
    if (hit) {
      used.add(hit);
      reviewed.push(f);
    } else open.push(f);
  }
  const stale = fullSweep ? mine.filter((e) => !used.has(e)) : [];
  return { open, reviewed, stale };
}

// ------------------------------------------------------------------ runner
function groupClasses(findings) {
  const m = new Map();
  for (const f of findings) {
    const c = m.get(f.key) || { key: f.key, lessons: new Set(), count: 0, example: f };
    c.lessons.add(f.lesson);
    c.count++;
    m.set(f.key, c);
  }
  return [...m.values()].sort((a, b) => b.lessons.size - a.lessons.size || b.count - a.count);
}

/**
 * gates: [{ name, viewports:["1366x768"], probe(page, ctx), finish?(page, rec), feedback?,
 *           judge(records, opts) -> { findings:[{key,lesson,viewport,state,detail}], stats, perLesson, lines } }]
 */
export async function runGates(gates, argv = process.argv.slice(2), opts = {}) {
  const args = parseArgs(argv);
  const label = args.label && args.label !== true ? String(args.label) : "latest";
  const outDir = args["out-dir"] || "reports";
  const all = manifestLessonIds();
  const ids = args.lessons ? String(args.lessons).split(",").filter(Boolean) : all;
  const full = !args.lessons && !args.viewport && !args.static && !args.path;
  const unknown = ids.filter((i) => !args.static && !all.includes(i));
  if (unknown.length) {
    console.error(`unknown lesson id(s): ${unknown.join(", ")}`);
    return 1;
  }

  let base =
    args.base && args.base !== true
      ? String(args.base).replace(/\/$/, "")
      : process.env.LESSON_GATE_BASE;
  let closeServer = null;
  const probePath = args.static
    ? (args.path || "/").replace("{id}", ids[0] || "")
    : "/lessons/1-1/";
  if (!base || !(await reachable(base, probePath))) {
    if (base)
      return skipExit(`no server answering at ${base}`, "Start one: npx vite preview --port 4603");
    if (existsSync("dist/lessons/1-1/index.html")) {
      const s = await startStaticServer("dist");
      base = s.base;
      closeServer = s.close;
    } else {
      return skipExit(
        "no --base server and no built dist/",
        "Run `npm run build`, then `npx vite preview --port 4603` and pass --base http://localhost:4603",
      );
    }
  }
  const browser = await launchBrowser();
  if (!browser) {
    await closeServer?.();
    return skipExit("no Chromium available", "Set PW_CHROMIUM_PATH to a system Chromium");
  }

  const vpNames = args.viewport
    ? String(args.viewport).split(",")
    : [...new Set(gates.flatMap((g) => g.viewports))];
  const concurrency = +args.concurrency || 2;
  const names = gates.map((g) => g.name).join(" + ");
  console.error(`sweep: ${names} | ${ids.length} lessons x ${vpNames.join(",")} | ${base}`);
  const recordsBy = {};
  const t0 = Date.now();
  for (const vpName of vpNames) {
    const vp = parseViewport(vpName);
    const active = gates.filter((g) => args.viewport || g.viewports.includes(vpName));
    const jobs = ids.map((id) => ({ id }));
    const recs = await pool(jobs, concurrency, async (j) => {
      const rec = await sweepOne(browser, {}, active, { base, id: j.id, vp, args });
      process.stderr.write(
        `  ${vp.name} ${j.id}${rec.fatal ? " FATAL" : rec.entered ? "" : " (not entered)"}\n`,
      );
      return rec;
    });
    recordsBy[vpName] = recs;
  }
  await browser.close();
  await closeServer?.();

  const review = loadReview(args.review || undefined);
  let exit = 0;
  const reportDir = outDir;
  const minLessons = args["min-lessons"] ? +args["min-lessons"] : full ? 80 : 1;
  for (const g of gates) {
    const gvps = args.viewport ? vpNames : g.viewports;
    const recs = gvps.flatMap((v) => recordsBy[v] || []);
    const fails = [];
    // ---- coverage guards: an empty sweep must FAIL, never pass.
    const lessonsSwept = new Set(recs.map((r) => r.id)).size;
    const entered = recs.filter((r) => r.entered).length;
    const fatal = recs.filter((r) => r.fatal);
    const statesPer = recs.length ? recs.reduce((n, r) => n + r.states.length, 0) / recs.length : 0;
    if (lessonsSwept < minLessons)
      fails.push(`swept ${lessonsSwept} lessons, below the minimum ${minLessons}`);
    if (!args.static) {
      if (recs.length && entered / recs.length < 0.9)
        fails.push(
          `only ${entered}/${recs.length} page runs got INSIDE a lesson (need 90%); the sweep measured entry cards`,
        );
      if (!args["no-phases"] && recs.length && statesPer < 3)
        fails.push(
          `average ${statesPer.toFixed(1)} states per page run (need >= 3): phases were not visited`,
        );
    }
    if (fatal.length)
      fails.push(
        `${fatal.length} page run(s) crashed: ${fatal
          .slice(0, 3)
          .map((r) => `${r.id}@${r.viewport} ${r.fatal}`)
          .join("; ")}`,
      );
    let judged = { findings: [], stats: {}, perLesson: {}, lines: [] };
    try {
      judged = g.judge(recs, { args, full });
    } catch (e) {
      fails.push(`judge crashed: ${e.message}`);
    }
    for (const x of judged.guards || []) fails.push(x);
    const { open, reviewed, stale } = applyReview(
      g.name,
      judged.findings,
      review,
      full || !!args["check-stale"],
    );
    if (review.problems.length) fails.push(...review.problems.map((p) => `review file: ${p}`));
    for (const s of stale)
      fails.push(`stale review entry (no longer fires, delete it): ${g.name}/${s.key}`);
    if (open.length)
      fails.push(`${open.length} finding(s) in ${groupClasses(open).length} class(es)`);

    const status = fails.length ? "FAIL" : "PASS";
    console.log(`\n=== ${g.name}: ${status} ===`);
    console.log(
      `swept: ${lessonsSwept} lessons, ${recs.length} page runs (${entered} entered), ${recs.reduce((n, r) => n + r.states.length, 0)} states, ${((Date.now() - t0) / 1000).toFixed(0)}s`,
    );
    for (const l of judged.lines || []) console.log(l);
    console.log(`reviewed (recorded decisions): ${reviewed.length}`);
    for (const c of groupClasses(open).slice(0, 15)) {
      const e = c.example;
      console.log(
        `  [${c.lessons.size} lesson(s), ${c.count}x] ${c.key}\n      e.g. ${e.lesson} @${e.viewport} ${e.state}: ${e.detail}`,
      );
    }
    for (const f of fails) console.log(`  ! ${f}`);
    if (fails.length) exit = 1;

    const report = {
      gate: g.name,
      label,
      at: new Date().toISOString(),
      base,
      status,
      full,
      swept: {
        lessons: lessonsSwept,
        pageRuns: recs.length,
        entered,
        statesPerRun: +statesPer.toFixed(2),
      },
      stats: judged.stats,
      failures: fails,
      findings: open,
      reviewed,
      perLesson: judged.perLesson,
    };
    if (!args["no-report"]) {
      const file = join(reportDir, `gate-${g.name}-${label}.json`);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify(report, null, 1));
      console.log(`wrote ${file}`);
    }
  }
  if (opts.afterAll) await opts.afterAll(recordsBy, args);
  return exit;
}

export const cap = (arr, n) => (arr.length > n ? arr.slice(0, n) : arr);
