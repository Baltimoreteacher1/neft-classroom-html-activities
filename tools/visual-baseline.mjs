#!/usr/bin/env node
/* =============================================================================
 * visual-baseline.mjs — turn "Joel notices in class" into "flagged overnight".
 *
 *   node tools/visual-baseline.mjs --update    bless the current look as the baseline
 *   node tools/visual-baseline.mjs             re-capture and diff against it
 *
 * WHY THIS EXISTS
 * ---------------
 * Every gate in this repo asks a question it already knows to ask. `validate:
 * visibility` asks whether the launch card is tall enough because the launch
 * card once collapsed; `validate:css-integrity` counts parsed rules because a
 * stylesheet once lost twelve of them. That works, and it is why each of those
 * bugs cannot come back — but the NEXT visual regression will be a shape nobody
 * has written an assertion for yet, and the current detection mechanism for
 * that class is Joel opening the lesson in front of a class of sixth graders.
 *
 * A screenshot diff needs no theory of what will break. It only needs the page
 * to look the way it looked yesterday.
 *
 * WHAT IT IS NOT
 * --------------
 * NOT A DEPLOY GATE, deliberately, and it must never become one. A pixel diff
 * cannot tell a broken layout from an intended redesign, and this repo's own
 * history says what happens to a gate that fails on ordinary content edits:
 * tests/curriculum-visual.spec.ts had to widen its tolerance from 0.02 to 0.08
 * and clip its capture because background automation edits the hub several
 * times an hour, and "a permanently-red gate is one nobody reads." So this runs
 * WEEKLY, in Site Health, as a report. Drift pages a human; it does not block a
 * ship.
 *
 * WHY 2-7
 * -------
 * One lesson, eight surfaces, all of them shared shell. 2-7 is the long-division
 * lesson: it has a warm-up that was just rebuilt, a Launch takeover, the Watch
 * Me stepper, Try It With Me, the Math Notes dialog, and a Part 2. Every other
 * lesson renders through the same components, so a shell regression shows up
 * here. Adding lessons would multiply the images without adding coverage of
 * anything but their content — which is exactly the churn that made the hub
 * baselines unmaintainable.
 *
 * DETERMINISM, and why each measure is here
 * -----------------------------------------
 * A flaky baseline gets deleted within a week, so every source of run-to-run
 * variation is pinned rather than absorbed by a bigger tolerance:
 *   • a FIXED `?sn=` — the student name is printed on screen and would otherwise
 *     differ per capture;
 *   • animations, transitions and carets zeroed (the caret blinks);
 *   • `document.fonts.ready` — text reflows a few pixels after a late font;
 *   • networkidle, THEN a layout-settle poll, because networkidle is not enough
 *     on these pages: deferred renders keep growing the document after it;
 *   • a FIXED viewport clip rather than fullPage — Playwright refuses a height
 *     mismatch outright, before any tolerance is consulted, so a full-page shot
 *     turns "this lesson gained a line of text" into an unreadable failure;
 *   • `Date` and `Math.random` frozen, so a date-stamped label or a shuffled
 *     order cannot differ between runs.
 *
 * NO NEW DEPENDENCY
 * -----------------
 * package.json has no pixelmatch and no pngjs, and Playwright's copies are
 * inside a webpack bundle with no importable entry point. Rather than add a
 * dependency for arithmetic this simple, the decode and the diff both run
 * INSIDE Chromium — which is already a devDependency and already open — via
 * createImageBitmap + OffscreenCanvas. The browser's PNG decoder is the same
 * one that produced the screenshot.
 * ========================================================================== */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIST = join(ROOT, "dist");
const BASELINE = join(ROOT, "reports", "visual-baseline");
const DIFFS = join(ROOT, "reports", "visual-diff");

const UPDATE = process.argv.includes("--update");
/** Fraction of differing pixels above which a surface is reported as drift. */
const THRESHOLD = Number(process.env.VISUAL_THRESHOLD || 0.005);
/** Per-channel 0-255 difference below which two pixels count as equal. */
const CHANNEL_TOLERANCE = 12;
const VIEWPORT = { width: 1440, height: 1000 };
/** Fixed so a captured student name never varies between runs. */
const STUDENT = "BaselineBot";

/* ── the eight canonical surfaces ─────────────────────────────────────────────
 * Each is a name plus the clicks that reach it. `settle` is extra wait for a
 * surface that animates itself open.
 * -------------------------------------------------------------------------- */
const SURFACES = [
  {
    name: "01-warmup",
    lesson: "2-7",
    what: "Act 1 as it loads — the first thing a student sees each day",
    reach: async () => {},
  },
  {
    name: "02-launch-top",
    lesson: "2-7",
    what: "the Launch takeover at the top of the problem card",
    reach: async (page) => {
      await mustOpenSubtab(page, /Launch/);
    },
  },
  {
    name: "03-launch-mid",
    lesson: "2-7",
    what: "the Launch takeover scrolled to the guided solve",
    reach: async (page) => {
      await mustOpenSubtab(page, /Launch/);
      await page.evaluate(() => {
        const panel = document.querySelector(".extra-panel--fullpage");
        if (panel) panel.scrollTop = 700;
      });
      await page.waitForTimeout(400);
    },
  },
  {
    name: "04-watch-me-open",
    lesson: "2-7",
    what: "Watch Me on step 1, The Big Idea",
    reach: async (page) => {
      await mustOpenSubtab(page, /Watch Me/);
    },
  },
  {
    name: "05-watch-me-steps",
    lesson: "2-7",
    what: "Watch Me Solve It — the long-division frames",
    reach: async (page) => {
      await mustOpenSubtab(page, /Watch Me/);
      await mustClick(page, /Watch Me Solve It/);
    },
  },
  {
    /* NOT a sidebar subtab. "Try It With Me" is step 3 INSIDE the Watch Me
     * panel, and searching the sidebar for it found nothing — which left this
     * surface capturing the warm-up, byte-identical to 01. Two of the eight
     * canonical surfaces were the same image and the tool said nothing. The
     * `must*` helpers and the duplicate-capture guard below both exist because
     * of that. */
    name: "06-try-it-with-me",
    lesson: "2-7",
    what: "Try It With Me, where the student takes the pen",
    reach: async (page) => {
      await mustOpenSubtab(page, /Watch Me/);
      await mustClick(page, /Try It With Me/);
    },
  },
  {
    name: "07-math-notes",
    lesson: "2-7",
    what: "the Math Notes card — this lesson's own words to copy",
    reach: async (page) => {
      await mustOpenSubtab(page, /Math Notes/);
    },
  },
  {
    name: "08-part2-warmup",
    lesson: "2-7-part2",
    what: "Part 2's opening review",
    reach: async () => {},
  },
];

/* ── page helpers ─────────────────────────────────────────────────────────────
 * Every click POLLS for its target rather than looking once. The sidebar and
 * the takeover panels are rendered by script after load, so a single look can
 * miss a control that appears 200ms later — observed as an intermittent
 * "no sidebar tab matching /Launch/" on a run where the tab plainly exists.
 * A weekly job that flakes gets ignored, and the honest fix for a race is to
 * wait for the thing, not to lengthen a fixed sleep and hope.
 * -------------------------------------------------------------------------- */
const CLICK_BUDGET_MS = 8000;

async function pollClick(page, selector, re, settleMs) {
  const deadline = Date.now() + CLICK_BUDGET_MS;
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const hit = await page.evaluate(
      ([sel, source, flags]) => {
        const pattern = new RegExp(source, flags);
        const node = [...document.querySelectorAll(sel)].find(
          (b) => b.getClientRects().length && pattern.test(b.textContent || ""),
        );
        if (!node) return false;
        node.click();
        return true;
      },
      [selector, re.source, re.flags],
    );
    if (hit) {
      await page.waitForTimeout(settleMs);
      return true;
    }
    if (Date.now() >= deadline) return false;
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(200);
  }
}

const clickText = (page, re) => pollClick(page, "button, a, .phase-btn", re, 900);
const openSubtab = (page, re) => pollClick(page, ".sidebar .phase-btn", re, 1400);

/* A `reach` step that silently does nothing is the failure mode that made two
 * of these eight surfaces the same picture. Not finding the target is an
 * error, and the surface is reported as unreachable rather than captured
 * wherever the page happened to be. */
class Unreachable extends Error {}

async function mustClick(page, re) {
  if (!(await clickText(page, re))) throw new Unreachable(`no clickable control matching ${re}`);
}

async function mustOpenSubtab(page, re) {
  if (!(await openSubtab(page, re))) throw new Unreachable(`no sidebar tab matching ${re}`);
}

/**
 * networkidle is not enough on these pages — deferred renders keep growing the
 * document after it — so poll the document height until it repeats.
 */
async function waitForStableLayout(page, repeats = 3, intervalMs = 200, budgetMs = 12000) {
  let last = -1;
  let stable = 0;
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    stable = height === last ? stable + 1 : 0;
    last = height;
    if (stable >= repeats) return true;
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(intervalMs);
  }
  return false;
}

/* ── the diff, run inside Chromium ────────────────────────────────────────────
 * Returns the differing-pixel ratio and a side-by-side PNG (baseline | current |
 * diff mask) as a data URL. Two images of different SIZE are reported as such
 * rather than compared — a size change is drift, and comparing overlapping
 * regions of differently-sized pages produces a meaningless number.
 * -------------------------------------------------------------------------- */
/* ONE parameter, destructured: page.evaluate passes a single argument, so a
 * three-parameter signature silently binds the whole array to the first name
 * and leaves the other two undefined. */
const DIFF_IN_PAGE = async ([baselineB64, currentB64, tolerance]) => {
  /* Decoded with atob, NOT fetch(dataUrl): a lesson page's Content-Security
   * Policy blocks `data:` in connect-src, so fetch throws "Failed to fetch"
   * before any pixel is compared. atob touches no network. */
  const load = async (b64) => {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "image/png" });
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    return { bitmap, data: ctx.getImageData(0, 0, bitmap.width, bitmap.height) };
  };
  const a = await load(baselineB64);
  const b = await load(currentB64);
  if (a.bitmap.width !== b.bitmap.width || a.bitmap.height !== b.bitmap.height) {
    return {
      sizeChanged: `${a.bitmap.width}×${a.bitmap.height} → ${b.bitmap.width}×${b.bitmap.height}`,
    };
  }

  const { width, height } = a.bitmap;
  const mask = new ImageData(width, height);
  let differing = 0;
  for (let i = 0; i < a.data.data.length; i += 4) {
    const dr = Math.abs(a.data.data[i] - b.data.data[i]);
    const dg = Math.abs(a.data.data[i + 1] - b.data.data[i + 1]);
    const db = Math.abs(a.data.data[i + 2] - b.data.data[i + 2]);
    const da = Math.abs(a.data.data[i + 3] - b.data.data[i + 3]);
    const changed = dr > tolerance || dg > tolerance || db > tolerance || da > tolerance;
    if (changed) {
      differing += 1;
      // Magenta on white — visible against this site's palette in both themes.
      mask.data[i] = 255;
      mask.data[i + 1] = 0;
      mask.data[i + 2] = 200;
      mask.data[i + 3] = 255;
    } else {
      // Faded original, so the unchanged page stays readable as context.
      const grey = (a.data.data[i] + a.data.data[i + 1] + a.data.data[i + 2]) / 3;
      const faded = 200 + grey * 0.2;
      mask.data[i] = faded;
      mask.data[i + 1] = faded;
      mask.data[i + 2] = faded;
      mask.data[i + 3] = 255;
    }
  }
  const ratio = differing / (width * height);

  const GAP = 16;
  const LABEL = 28;
  const sheet = new OffscreenCanvas(width * 3 + GAP * 2, height + LABEL);
  const sctx = sheet.getContext("2d");
  sctx.fillStyle = "#ffffff";
  sctx.fillRect(0, 0, sheet.width, sheet.height);
  sctx.fillStyle = "#14223a";
  sctx.font = "600 16px sans-serif";
  ["baseline", "current", `diff — ${(ratio * 100).toFixed(2)}% of pixels`].forEach((text, i) => {
    sctx.fillText(text, i * (width + GAP), 20);
  });
  sctx.drawImage(a.bitmap, 0, LABEL);
  sctx.drawImage(b.bitmap, width + GAP, LABEL);
  const maskCanvas = new OffscreenCanvas(width, height);
  maskCanvas.getContext("2d").putImageData(mask, 0, 0);
  sctx.drawImage(maskCanvas, (width + GAP) * 2, LABEL);

  const out = await sheet.convertToBlob({ type: "image/png" });
  const buffer = new Uint8Array(await out.arrayBuffer());
  let binary = "";
  for (const byte of buffer) binary += String.fromCharCode(byte);
  return { ratio, differing, total: width * height, sheet: btoa(binary) };
};

/* ── self-test: prove the comparator can actually SEE a difference ────────────
 * A diff that always returns 0 reports a perfectly stable site — the same shape
 * as every other gate in this repo that quietly stopped firing. Two synthetic
 * images run through the real comparator before any real capture is trusted.
 * -------------------------------------------------------------------------- */
async function selfTest(page) {
  const png = async (fill, mark) =>
    page.evaluate(
      async ([colour, spot]) => {
        const canvas = new OffscreenCanvas(60, 40);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = colour;
        ctx.fillRect(0, 0, 60, 40);
        if (spot) {
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, 30, 40); // exactly half the pixels
        }
        const blob = await canvas.convertToBlob({ type: "image/png" });
        const buffer = new Uint8Array(await blob.arrayBuffer());
        let binary = "";
        for (const byte of buffer) binary += String.fromCharCode(byte);
        return btoa(binary);
      },
      [fill, mark],
    );

  const plain = await png("#ffffff", false);
  const halved = await png("#ffffff", true);
  const same = await page.evaluate(DIFF_IN_PAGE, [plain, plain, CHANNEL_TOLERANCE]);
  const differs = await page.evaluate(DIFF_IN_PAGE, [plain, halved, CHANNEL_TOLERANCE]);

  const problems = [];
  if (!(same.ratio === 0)) problems.push(`identical images reported ${same.ratio} drift`);
  if (!(differs.ratio > 0.45 && differs.ratio < 0.55))
    problems.push(`a half-black image reported ${differs.ratio} drift, expected ~0.5`);
  if (!differs.sheet) problems.push("no side-by-side sheet was produced");

  // A size change must be REPORTED, never silently compared.
  const tall = await page.evaluate(async () => {
    const canvas = new OffscreenCanvas(60, 80);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 60, 80);
    const blob = await canvas.convertToBlob({ type: "image/png" });
    const buffer = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (const byte of buffer) binary += String.fromCharCode(byte);
    return btoa(binary);
  });
  const resized = await page.evaluate(DIFF_IN_PAGE, [plain, tall, CHANNEL_TOLERANCE]);
  if (!resized.sizeChanged) problems.push("a size change was not reported as such");

  return problems;
}

/* ── static file server over dist/ ────────────────────────────────────────── */
const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function serveDist() {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    let file = join(DIST, path);
    if (path.endsWith("/")) file = join(file, "index.html");
    if (!existsSync(file) && existsSync(`${file}/index.html`)) file = `${file}/index.html`;
    if (!existsSync(file) || !file.startsWith(DIST)) {
      res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
  });
  return server;
}

/* ── main ─────────────────────────────────────────────────────────────────── */
if (!existsSync(join(DIST, "lessons", "2-7", "index.html"))) {
  console.error("dist/ is missing or incomplete. Run `npm run build` first.");
  process.exit(
    skipExit("dist/ has no built lesson to capture", "Run `npm run build`, then re-run."),
  );
}

const server = serveDist();
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const { chromium } = await import("playwright");
let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (error) {
  server.close();
  process.exit(
    skipExit(
      `Chromium could not be launched (${error.message.split("\n")[0]})`,
      "Install a browser (npx playwright install chromium) or set PW_CHROMIUM_PATH.",
    ),
  );
}

async function capture(surface) {
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  /* Frozen before any page script runs: a date-stamped label or a shuffled
   * order would otherwise differ every night and drown the real signal. */
  await page.addInitScript(() => {
    const FIXED = 1756166400000; // 2025-08-26T00:00:00Z, a fixed instant
    const RealDate = Date;
    Date = class extends RealDate {
      constructor(...args) {
        super(...(args.length ? args : [FIXED]));
      }
      static now() {
        return FIXED;
      }
    };
    let seed = 42;
    Math.random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
  });
  await page.goto(`${BASE}/lessons/${surface.lesson}/?sn=${STUDENT}`, {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-duration: 0s !important; animation-delay: 0s !important;
      transition-duration: 0s !important; transition-delay: 0s !important;
      caret-color: transparent !important; scroll-behavior: auto !important;
    }`,
  });
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(900);
  // through any cover screen
  for (let i = 0; i < 3; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const clicked = await clickText(
      page,
      /start activity|start the mission|begin|open the|enter the/i,
    );
    if (!clicked) break;
  }
  let unreachable = null;
  try {
    await surface.reach(page);
  } catch (error) {
    unreachable = error.message;
  }
  await page.waitForLoadState("networkidle").catch(() => {});
  const settled = await waitForStableLayout(page);
  const buffer = await page.screenshot({
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
  await page.close();
  return { buffer, settled, unreachable };
}

/* about:blank on purpose: the comparator needs OffscreenCanvas and nothing
 * else, and a lesson page brings its own CSP along with it. */
const scratch = await browser.newPage();
const selfProblems = await selfTest(scratch);
if (selfProblems.length) {
  console.error("visual-baseline SELF-TEST FAILED — the comparator cannot be trusted:");
  for (const p of selfProblems) console.error(`  ✗ ${p}`);
  await browser.close();
  server.close();
  process.exit(1);
}
console.log(`comparator self-test: OK (identical → 0, half-changed → ~0.5, resize reported)\n`);

mkdirSync(BASELINE, { recursive: true });
const captured = [];
for (const surface of SURFACES) {
  // eslint-disable-next-line no-await-in-loop
  const shot = await capture(surface);
  captured.push({ surface, ...shot });
  if (!shot.settled) console.warn(`  ⚠  ${surface.name}: layout never settled — capture may flake`);
}

/* TWO INDEPENDENT NETS against a surface that silently covers nothing.
 *
 * 1. UNREACHABLE — a `reach` step could not find its target, so whatever was
 *    captured is not the surface this entry names.
 * 2. DUPLICATE — two surfaces produced byte-identical images. That can only
 *    mean one of them never navigated, and it is caught even when every click
 *    reported success, which is why it is here as well as the first net.
 *
 * Both are fatal. A baseline containing a mislabelled image is worse than no
 * baseline: it makes a permanent claim to cover a surface nobody is watching.
 */
const unreachable = captured.filter((c) => c.unreachable);
const byHash = new Map();
for (const c of captured) {
  const hash = createHash("sha256").update(c.buffer).digest("hex");
  if (!byHash.has(hash)) byHash.set(hash, []);
  byHash.get(hash).push(c.surface.name);
}
const duplicates = [...byHash.values()].filter((names) => names.length > 1);

if (unreachable.length || duplicates.length) {
  console.error("visual-baseline: the capture set does not cover what it claims.\n");
  for (const c of unreachable) {
    console.error(`  ✗ ${c.surface.name}: ${c.unreachable}`);
  }
  for (const names of duplicates) {
    console.error(
      `  ✗ ${names.join(" and ")} captured the SAME image — one of them never navigated`,
    );
  }
  console.error(
    "\nFix the surface definition; do not bless a baseline that covers less than it says.",
  );
  await browser.close();
  server.close();
  process.exit(1);
}

if (UPDATE) {
  for (const { surface, buffer } of captured) {
    writeFileSync(join(BASELINE, `${surface.name}.png`), buffer);
  }
  writeFileSync(
    join(BASELINE, "README.md"),
    `# Visual baseline — lesson 2-7\n\n` +
      `Blessed by \`node tools/visual-baseline.mjs --update\` at ${VIEWPORT.width}×${VIEWPORT.height}.\n\n` +
      `Accepting a new baseline declares the current appearance CORRECT. That is a\n` +
      `human judgement, which is why nothing regenerates these automatically.\n\n` +
      `| surface | what it holds |\n| --- | --- |\n` +
      SURFACES.map((s) => `| \`${s.name}.png\` | ${s.what} |`).join("\n") +
      "\n",
  );
  await browser.close();
  server.close();
  console.log(`Baseline updated: ${captured.length} surface(s) → reports/visual-baseline/`);
  process.exit(0);
}

/* ── compare ──────────────────────────────────────────────────────────────── */
const missing = captured.filter(
  ({ surface }) => !existsSync(join(BASELINE, `${surface.name}.png`)),
);
if (missing.length === captured.length) {
  await browser.close();
  server.close();
  console.error("No baseline on disk — nothing to compare against.");
  process.exit(
    skipExit(
      "no committed baseline exists yet",
      "Review the current appearance, then run: node tools/visual-baseline.mjs --update",
    ),
  );
}

rmSync(DIFFS, { recursive: true, force: true });
mkdirSync(DIFFS, { recursive: true });

const asBase64 = (buffer) => buffer.toString("base64");
const rows = [];
let drifted = 0;
for (const { surface, buffer } of captured) {
  const file = join(BASELINE, `${surface.name}.png`);
  if (!existsSync(file)) {
    rows.push({ name: surface.name, what: surface.what, status: "NEW", detail: "no baseline yet" });
    writeFileSync(join(DIFFS, `${surface.name}-current.png`), buffer);
    continue;
  }
  const result = await scratch.evaluate(DIFF_IN_PAGE, [
    asBase64(readFileSync(file)),
    asBase64(buffer),
    CHANNEL_TOLERANCE,
  ]);
  if (result.sizeChanged) {
    drifted += 1;
    rows.push({
      name: surface.name,
      what: surface.what,
      status: "DRIFT",
      detail: `capture size changed: ${result.sizeChanged}`,
    });
    writeFileSync(join(DIFFS, `${surface.name}-current.png`), buffer);
    continue;
  }
  const pct = (result.ratio * 100).toFixed(3);
  if (result.ratio > THRESHOLD) {
    drifted += 1;
    writeFileSync(join(DIFFS, `${surface.name}-diff.png`), Buffer.from(result.sheet, "base64"));
    rows.push({
      name: surface.name,
      what: surface.what,
      status: "DRIFT",
      detail: `${pct}% of pixels changed (threshold ${(THRESHOLD * 100).toFixed(3)}%) — reports/visual-diff/${surface.name}-diff.png`,
    });
  } else {
    rows.push({ name: surface.name, what: surface.what, status: "ok", detail: `${pct}% changed` });
  }
}

await browser.close();
server.close();

const report = [
  "# Weekly visual drift — lesson 2-7",
  "",
  `Captured at ${VIEWPORT.width}×${VIEWPORT.height} from \`dist/\`. Threshold: ${(THRESHOLD * 100).toFixed(3)}% of pixels.`,
  "",
  "**This is a report, not a deploy gate.** A pixel diff cannot tell a broken",
  "layout from an intended redesign. Drift here means *look at it* — and if the",
  "new appearance is correct, bless it with `node tools/visual-baseline.mjs --update`.",
  "",
  "| surface | status | detail | what it holds |",
  "| --- | --- | --- | --- |",
  ...rows.map((r) => `| \`${r.name}\` | ${r.status} | ${r.detail} | ${r.what} |`),
  "",
  drifted
    ? `**${drifted} of ${rows.length} surfaces drifted.** Side-by-side images: \`reports/visual-diff/\``
    : `All ${rows.length} surfaces match the baseline.`,
  "",
].join("\n");
mkdirSync(join(ROOT, "reports"), { recursive: true });
writeFileSync(join(ROOT, "reports", "visual-drift.md"), report);

for (const r of rows) {
  const mark = r.status === "ok" ? "  ok  " : ` ${r.status} `;
  console.log(`${mark} ${r.name.padEnd(22)} ${r.detail}`);
}
console.log(`\n→ reports/visual-drift.md`);
if (drifted) {
  console.log(
    `\n${drifted} surface(s) drifted. Look at reports/visual-diff/, then either fix the page ` +
      "or re-bless the baseline with --update.",
  );
}
/* Exit 0 either way: this is a reporting job. Site Health surfaces the report;
 * a red X here would make a weekly redesign look like an outage. */
process.exit(0);
