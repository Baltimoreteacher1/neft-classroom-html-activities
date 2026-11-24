#!/usr/bin/env node
// Playwright visual-regression baselines for each of the 12 BCPSS ESOL Premium lesson-companion activity kinds.
// Usage:
//   node tools/bcpss-kinds-visual.mjs --update   # render all 12 kinds in Chromium and bless baselines
//   node tools/bcpss-kinds-visual.mjs            # compare current render against docs/esol-premium/visual-baseline/
// Exits 3 (SKIP) via tools/lib/skip-exit.mjs when Chromium is unavailable.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLessons } from "../functions/_lib/bcpss/lessons.js";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const BASELINE_DIR = join(ROOT, "docs/esol-premium/visual-baseline");
const UPDATE = process.argv.includes("--update");
const VIEWPORT = { width: 1280, height: 800 };
const CHANNEL_TOLERANCE = 12;
const THRESHOLD = 0.02;

const KINDS = [
  "flash_retrieval",
  "listen_and_show",
  "sentence_xray",
  "speak_and_record",
  "exit_check",
  "point_and_say",
  "tpr_cards",
  "home_language_bridge",
  "cognate_detective",
  "morph_lab",
  "paragraph_builder",
  "mission_escape",
];

// Gather one deterministic payload per kind from g6-math-u1 and g6-math-u2
const set1 = await loadLessons("g6-math-u1");
const set2 = await loadLessons("g6-math-u2");
const byKind = new Map();
for (const l of [...(set2?.lessons || []), ...(set1?.lessons || [])]) {
  const acts = [
    ...l.arc.map((s) => s.activity),
    ...(l.newcomer_path || []),
    l.extension,
    l.exit_check,
  ].filter(Boolean);
  for (const a of acts) {
    if (KINDS.includes(a.kind) && !byKind.has(a.kind)) {
      byKind.set(a.kind, { lessonId: l.id, activity: a });
    }
  }
}

for (const k of KINDS) {
  if (!byKind.has(k)) {
    console.error(`✗ bcpss-kinds-visual: no payload found for kind "${k}"`);
    process.exit(1);
  }
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

function renderHarnessHtml(kind, entry) {
  const payloadJson = JSON.stringify(entry);
  return `<!doctype html>
<html lang="en" data-band="g68">
<head>
  <meta charset="utf-8" />
  <title>Visual Baseline — ${kind}</title>
  <link rel="stylesheet" href="/bcpss-teachers/language-studio/studio.css" />
  <link rel="stylesheet" href="/bcpss-teachers/language-studio/studio-components.css" />
  <link rel="stylesheet" href="/bcpss-teachers/language-studio/studio-run.css" />
  <link rel="stylesheet" href="/bcpss-teachers/language-studio/studio-open.css" />
  <link rel="stylesheet" href="/bcpss-teachers/language-studio/studio-open2.css" />
  <link rel="stylesheet" href="/bcpss-teachers/language-studio/studio-games.css" />
  <link rel="stylesheet" href="/bcpss-teachers/language-studio/studio-games-2.css" />
  <link rel="stylesheet" href="/bcpss-teachers/language-studio/studio-sentence.css" />
  <link rel="stylesheet" href="/bcpss-teachers/language-studio/studio-lessons.css" />
  <link rel="stylesheet" href="/bcpss-teachers/language-studio/studio-lesson-kinds.css" />
  <style>
    *, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
      caret-color: transparent !important;
    }
    body { margin: 0; padding: 24px; background: var(--st-bg, #f8fafc); }
    #stageHost { max-width: 960px; margin: 0 auto; }
  </style>
</head>
<body>
  <main id="stageHost" class="st-card" style="padding:24px">
    <p class="sl-count">Kind: ${kind}</p>
    <h1 style="margin:4px 0 8px;font-size:1.5rem">${entry.activity.title}</h1>
    <p style="margin:0 0 18px;color:var(--st-muted)">${entry.activity.mission}</p>
    <div id="kindRoot"></div>
  </main>
  <div id="stLive" class="st-sr" aria-live="polite"></div>
  <script type="module">
    import { shuffle, rng, esc, announce } from "/bcpss-teachers/language-studio/studio-core.js";
    import mount from "/bcpss-teachers/language-studio/studio-kinds/${kind}.js";
    const entry = ${payloadJson};
    const root = document.getElementById("kindRoot");
    mount(root, {
      payload: entry.activity.payload,
      activity: entry.activity,
      lessonId: entry.lessonId,
      level: "l3_4",
      studio: { vocab: [] },
      shuffle,
      rng,
      esc,
      tts: async () => false,
      announce,
      vocabIcon: () => "",
      done: () => {},
      saveState: () => {},
      loadState: () => null,
      root,
    });
    window.__KIND_READY = true;
  </script>
</body>
</html>`;
}

const DIFF_IN_PAGE = async ([baselineB64, currentB64, tolerance]) => {
  const load = async (b64) => {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    return { bitmap, data: ctx.getImageData(0, 0, bitmap.width, bitmap.height) };
  };
  const a = await load(baselineB64);
  const b = await load(currentB64);
  if (a.bitmap.width !== b.bitmap.width || a.bitmap.height !== b.bitmap.height) {
    return {
      sizeChanged: `${a.bitmap.width}x${a.bitmap.height} -> ${b.bitmap.width}x${b.bitmap.height}`,
    };
  }
  let differing = 0;
  for (let i = 0; i < a.data.data.length; i += 4) {
    if (
      Math.abs(a.data.data[i] - b.data.data[i]) > tolerance ||
      Math.abs(a.data.data[i + 1] - b.data.data[i + 1]) > tolerance ||
      Math.abs(a.data.data[i + 2] - b.data.data[i + 2]) > tolerance
    ) {
      differing++;
    }
  }
  return { ratio: differing / (a.bitmap.width * a.bitmap.height) };
};

const server = createServer((req, res) => {
  const u = new URL(req.url, "http://127.0.0.1");
  if (u.pathname.startsWith("/__kind/")) {
    const kind = u.pathname.slice("/__kind/".length);
    const entry = byKind.get(kind);
    if (!entry) {
      res.writeHead(404).end("Unknown kind");
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(renderHarnessHtml(kind, entry));
    return;
  }
  const file = join(ROOT, decodeURIComponent(u.pathname));
  if (!file.startsWith(ROOT) || !existsSync(file)) {
    res.writeHead(404).end("Not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const { chromium } = await import("playwright");
let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (err) {
  server.close();
  process.exit(
    skipExit(
      `Chromium unavailable (${err.message.split("\n")[0]})`,
      "Install Playwright Chromium or set PW_CHROMIUM_PATH.",
    ),
  );
}

mkdirSync(BASELINE_DIR, { recursive: true });
const captured = new Map();
const hashes = new Map();
const problems = [];

for (const kind of KINDS) {
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${BASE}/__kind/${kind}`, { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForFunction(() => window.__KIND_READY === true, null, { timeout: 5000 });
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  if (overflow) problems.push(`${kind}: horizontal overflow at ${VIEWPORT.width}px`);
  if (errors.length) problems.push(`${kind}: pageerror: ${errors.join("; ")}`);
  const buf = await page.screenshot({
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
  await page.close();
  captured.set(kind, buf);
  const h = createHash("sha256").update(buf).digest("hex");
  if (hashes.has(h)) {
    problems.push(`${kind} and ${hashes.get(h)} produced identical screenshots`);
  }
  hashes.set(h, kind);
}

if (UPDATE) {
  const manifest = {};
  for (const [kind, buf] of captured) {
    const file = join(BASELINE_DIR, `${kind}.png`);
    writeFileSync(file, buf);
    manifest[kind] = {
      sha256: createHash("sha256").update(buf).digest("hex"),
      bytes: buf.length,
      viewport: VIEWPORT,
    };
  }
  writeFileSync(join(BASELINE_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await browser.close();
  server.close();
  if (problems.length) {
    for (const p of problems) console.error(` - ${p}`);
    process.exit(1);
  }
  console.log(
    `bcpss-kinds-visual: updated ${captured.size} baselines in docs/esol-premium/visual-baseline/`,
  );
  process.exit(0);
}

const scratch = await browser.newPage();
for (const [kind, buf] of captured) {
  const baseFile = join(BASELINE_DIR, `${kind}.png`);
  if (!existsSync(baseFile)) {
    problems.push(`${kind}: missing baseline ${baseFile} (run with --update)`);
    continue;
  }
  const res = await scratch.evaluate(DIFF_IN_PAGE, [
    readFileSync(baseFile).toString("base64"),
    buf.toString("base64"),
    CHANNEL_TOLERANCE,
  ]);
  if (res.sizeChanged) {
    problems.push(`${kind}: baseline size changed (${res.sizeChanged})`);
  } else if (res.ratio > THRESHOLD) {
    problems.push(
      `${kind}: visual drift ${(res.ratio * 100).toFixed(2)}% > ${(THRESHOLD * 100).toFixed(2)}%`,
    );
  }
}

await browser.close();
server.close();

console.log(`bcpss-kinds-visual: ${captured.size} kinds checked, ${problems.length} problems`);
for (const p of problems) console.log(` - ${p}`);
process.exit(problems.length ? 1 : 0);
