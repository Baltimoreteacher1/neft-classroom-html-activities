// G-93 offline-pinned-unit (real browser, network disabled) and G-94 student-no-external-egress.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "./server.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function launch() {
  try {
    const { chromium } = await import("playwright");
    return await chromium.launch(
      process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    );
  } catch (err) {
    return { skip: String(err?.message || err).split("\n")[0] };
  }
}

async function probeOfflineUnit({ pinFirst }) {
  const browser = await launch();
  if (browser.skip) return { skip: browser.skip };
  const { server, base } = await startServer();
  const errors = [];
  const info = { unitId: "g6-math-u1", pinFirst };
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const url = `${base}/bcpss-teachers/?grade=6&subject=Math&unit=g6-math-u1`;

    if (pinFirst) {
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForSelector("#workspaceTitle", { timeout: 15_000 });
      await page.waitForFunction(
        () => (document.querySelector("#workspaceTitle")?.textContent || "").includes("Unit 1"),
        null,
        { timeout: 15_000 },
      );
      // Wait briefly for SW registration/claim
      await page.waitForFunction(
        async () => {
          if (!("serviceWorker" in navigator)) return false;
          const reg = await navigator.serviceWorker.ready;
          return Boolean(reg?.active);
        },
        null,
        { timeout: 10_000 },
      );
      await page.click("#pinUnitOfflineBtn");
      await page.waitForFunction(
        () => document.querySelector("#pinUnitOfflineBtn")?.getAttribute("aria-pressed") === "true",
        null,
        { timeout: 15_000 },
      );
      info.pinLabel = await page.$eval("#pinUnitOfflineLabel", (e) => e.textContent);
      // Ensure SW controls the page before going offline
      if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
        await page.reload({ waitUntil: "networkidle" });
      }
    }

    await ctx.setOffline(true);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10_000 });
      await page.waitForFunction(
        () => (document.querySelector("#workspaceTitle")?.textContent || "").includes("Unit 1"),
        null,
        { timeout: 10_000 },
      );
      const title = await page.$eval("#workspaceTitle", (e) => e.textContent || "");
      info.offlineTitle = title;
      if (!title.includes("Unit 1")) {
        errors.push(`offline load did not render pinned unit title (got "${title}")`);
      }
    } catch (err) {
      errors.push(`offline load failed: ${String(err?.message || err).split("\n")[0]}`);
    }
    return { errors, info };
  } finally {
    await browser.close();
    server.close();
  }
}

export const gateOfflinePinnedUnit = {
  id: "G-93",
  name: "offline-pinned-unit",
  browser: true,
  async run() {
    return probeOfflineUnit({ pinFirst: true });
  },
  async controls() {
    const res = await probeOfflineUnit({ pinFirst: false });
    if (res.skip) return [{ name: "unpinned-offline-fails", errors: [`SKIP: ${res.skip}`] }];
    return [{ name: "unpinned-offline-fails", errors: res.errors }];
  },
};

// ── G-94: student-no-external-egress ──────────────────────────────────────────
const STUDENT_DIRS = [
  "access-practice-lab/src",
  "bcpss-teachers/language-studio",
  "bcpss-teachers/writing-lab",
];
const STUDENT_FILES = [
  "access-practice-lab/index.html",
  "bcpss-teachers/index.html",
  "bcpss-teachers/language-studio/index.html",
  "bcpss-teachers/writing-lab/index.html",
  "bcpss-teachers/offline-mode.js",
  "bcpss-teachers/sw.js",
];

const EXTERNAL_CALL_RE =
  /\b(?:fetch|sendBeacon)\(\s*["'`]https?:\/\/|new\s+(?:EventSource|WebSocket)\(\s*["'`](?:https?|wss?):\/\//g;
const CDN_ASSET_RE =
  /https?:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com|unpkg\.com|cdn\.jsdelivr\.net|ajax\.googleapis\.com)/gi;
const EXTERNAL_TAG_RE =
  /<(?:script|link)\b[^>]*\b(?:src|href)\s*=\s*["']https?:\/\/[^"']+["']/gi;

function stripJsComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

export function scanSourceForExternalEgress(relPath, content) {
  const errors = [];
  const isHtml = relPath.endsWith(".html");
  const body = isHtml ? content : stripJsComments(content);

  for (const m of body.matchAll(EXTERNAL_CALL_RE)) {
    errors.push(`${relPath}: external network call (${m[0].slice(0, 60)})`);
  }
  for (const m of body.matchAll(CDN_ASSET_RE)) {
    errors.push(`${relPath}: external CDN asset/font (${m[0]})`);
  }
  if (isHtml) {
    for (const m of body.matchAll(EXTERNAL_TAG_RE)) {
      if (!/rel\s*=\s*["'](?:canonical|noopener|noreferrer)["']/i.test(m[0])) {
        errors.push(`${relPath}: external script/stylesheet tag (${m[0].slice(0, 80)})`);
      }
    }
  }
  return errors;
}

function walkFiles(dirRel) {
  const abs = path.join(ROOT, dirRel);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  const stack = [abs];
  while (stack.length) {
    const cur = stack.pop();
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (/\.(?:js|mjs|html|css)$/.test(ent.name)) {
        out.push(path.relative(ROOT, full));
      }
    }
  }
  return out;
}

export const gateStudentNoExternalEgress = {
  id: "G-94",
  name: "student-no-external-egress",
  async run() {
    const files = new Set(STUDENT_FILES.filter((f) => fs.existsSync(path.join(ROOT, f))));
    for (const d of STUDENT_DIRS) {
      for (const f of walkFiles(d)) files.add(f);
    }
    const errors = [];
    for (const rel of [...files].sort()) {
      const content = fs.readFileSync(path.join(ROOT, rel), "utf8");
      errors.push(...scanSourceForExternalEgress(rel, content));
    }
    return { errors, info: { filesScanned: files.size } };
  },
  async controls() {
    const badJs = scanSourceForExternalEgress(
      "access-practice-lab/src/synthetic-bad.js",
      'export function leak() { return fetch("https://analytics.example.com/collect"); }',
    );
    const badHtml = scanSourceForExternalEgress(
      "access-practice-lab/synthetic-bad.html",
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter" />',
    );
    return [
      { name: "external-fetch-detected", errors: badJs },
      { name: "cdn-font-detected", errors: badHtml },
    ];
  },
};
