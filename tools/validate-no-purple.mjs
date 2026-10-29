#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
/**
 * Validate every production-shipped code/data file and its same-path source for
 * purple/violet/indigo, plus the decoded pixels of shipped and matched source
 * rasters. Run after `npm run build`; only public output in dist is authoritative.
 */
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { fromHsl, parseColor, toHsl } from "./lib/color-math.mjs";
import { skipExit } from "./lib/skip-exit.mjs";
import { findForbiddenLiterals, stripComments } from "./validate-palette.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const ROUTES = ["curriculum/index.html", "curriculum/units/index.html"];
const TEXT_EXT = new Set([".html", ".css", ".js", ".mjs", ".svg", ".json"]);
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);
const SHIPPED_EXT = new Set([...TEXT_EXT, ...IMAGE_EXT]);
const CHANGE_EXT = new Set([...TEXT_EXT, ...IMAGE_EXT, ".md"]);
const DOC_SKIP = new Set([".git", "node_modules", "dist", ".next", ".cache", ".vercel"]);
const URL_REF =
  /(?:href|src|poster|content)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^)'"\s]+)|["'](\/(?:assets|shared|curriculum|data)\/[^"']+)["']/gi;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

const localPath = (base, url) => {
  const raw = String(url).split(/[?#]/, 1)[0];
  let clean;
  try {
    clean = decodeURIComponent(raw);
  } catch {
    clean = raw;
  }
  if (!clean || /^(?:https?:|data:|mailto:|javascript:|#)/i.test(clean)) return null;
  const abs = clean.startsWith("/") ? join(base, clean.slice(1)) : join(base, clean);
  const normalized = resolve(abs);
  return normalized.startsWith(resolve(base) + sep) ? normalized : null;
};
const dependencyPath = (base, from, url) => {
  const raw = String(url).split(/[?#]/, 1)[0];
  let clean;
  try {
    clean = decodeURIComponent(raw);
  } catch {
    clean = raw;
  }
  if (!clean || /^(?:https?:|data:|mailto:|javascript:|#)/i.test(clean)) return null;
  const candidate = clean.startsWith("/")
    ? join(base, clean.slice(1))
    : resolve(dirname(from), clean);
  const normalized = resolve(candidate);
  return normalized.startsWith(resolve(base) + sep) ? normalized : null;
};

/** Resolve the hub routes and all their textual and image dependencies. */
export function collectHubFiles(root = ROOT, generated = false) {
  const base = generated ? join(root, "dist") : root;
  const pages = ROUTES.map((r) => join(base, r));
  if (pages.some((p) => !existsSync(p))) return { pages: [], textFiles: [], images: [] };
  const seen = new Set();
  const images = new Set();
  const queue = [...pages];
  while (queue.length) {
    const file = queue.pop();
    if (!file || seen.has(file) || !existsSync(file) || !statSync(file).isFile()) continue;
    seen.add(file);
    const ext = extname(file).toLowerCase();
    if (IMAGE_EXT.has(ext)) {
      images.add(file);
      continue;
    }
    if (!TEXT_EXT.has(ext)) continue;
    const body = readFileSync(file, "utf8");
    const refs = [];
    for (const m of body.matchAll(URL_REF)) refs.push(m[1] || m[2] || m[3]);
    // CSS imports can omit url(), and module imports can be relative.
    if (ext === ".css")
      for (const m of body.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/gi)) refs.push(m[1]);
    if ([".js", ".mjs"].includes(ext)) {
      for (const m of body.matchAll(/(?:from\s*|import\s*\(|import\s*)["']([^"']+)["']/g))
        refs.push(m[1]);
    }
    for (const ref of refs) {
      const dep = dependencyPath(base, file, ref);
      const depExt = dep ? extname(dep).toLowerCase() : "";
      // Follow loaded resources and data, not navigation links to every page
      // linked from the hub. The hub entry HTML itself is already a scan root.
      if (dep && depExt !== ".html" && (TEXT_EXT.has(depExt) || IMAGE_EXT.has(depExt)))
        queue.push(dep);
    }
  }
  return {
    pages,
    textFiles: [...seen].filter((p) => TEXT_EXT.has(extname(p).toLowerCase())).sort(),
    images: [...images].sort(),
  };
}

const forbiddenHue = (h, s) => h >= 230 && h <= 320 && s > 0.1 && (h >= 235 || s >= 0.35);

export function findForbiddenPaints(source) {
  const text = stripComments(source);
  const hasPerceptibleHue = (color) => {
    if (!color) return false;
    const channels = [color.r, color.g, color.b];
    return Math.max(...channels) - Math.min(...channels) >= 24;
  };
  const hits = [...findForbiddenLiterals(text)].filter((hit) => {
    const color = parseColor(hit.text);
    if (!color) return true;
    const { h, s, l } = toHsl(color);
    return hasPerceptibleHue(color) && forbiddenHue(h, s) && l > 0.08;
  });
  const at = (i) => text.slice(0, i).split("\n").length;
  const forbidden = (c) => {
    if (!c) return false;
    const { h, s } = toHsl(c);
    // Include perceptible indigo and pale tints while excluding dark/near-neutral
    // blue-gray ink whose computed hue is unstable or not visibly violet.
    // Start low enough to include blue-violet indigos (for example #3742a6).
    const { l } = toHsl(c);
    return hasPerceptibleHue(c) && forbiddenHue(h, s) && l > 0.08;
  };
  for (const m of text.matchAll(/#[\da-f]{8}\b|#[\da-f]{6}\b|#[\da-f]{3}\b|rgba?\([^)]*\)/gi)) {
    if (/^#\d{3}$/.test(m[0]) && /\bcase\s+$/i.test(text.slice(Math.max(0, m.index - 20), m.index)))
      continue;
    if (!forbidden(parseColor(m[0]))) continue;
    if (!hits.some((h) => h.line === at(m.index) && h.text.toLowerCase() === m[0].toLowerCase())) {
      hits.push({ line: at(m.index), text: m[0] });
    }
  }
  for (const m of text.matchAll(/hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/gi)) {
    const h = +m[1],
      s = +m[2] / 100;
    const color = fromHsl({ h, s, l: +m[3] / 100 });
    if (hasPerceptibleHue(color) && forbiddenHue(h, s) && +m[3] / 100 > 0.08)
      hits.push({ line: at(m.index), text: m[0] });
  }
  return hits;
}

export function scanHubFiles(root = ROOT, generated = false) {
  const files = collectHubFiles(root, generated);
  const findings = [];
  for (const file of files.textFiles) {
    for (const hit of findForbiddenPaints(readFileSync(file, "utf8"))) {
      findings.push({ file: file.replace(root + sep, ""), ...hit });
    }
  }
  return {
    ...files,
    findings,
    ok:
      files.pages.length === ROUTES.length && files.textFiles.length >= 4 && findings.length === 0,
  };
}

/** Scan repository Markdown so design and release docs cannot retain old palette literals. */
export function scanSourceDocs(root = ROOT) {
  const files = [];
  const visit = (dir) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      if (DOC_SKIP.has(name)) continue;
      const file = join(dir, name);
      if (statSync(file).isDirectory()) visit(file);
      else if (name.toLowerCase().endsWith(".md")) files.push(file);
    }
  };
  visit(root);
  const findings = [];
  for (const file of files) {
    for (const hit of findForbiddenPaints(readFileSync(file, "utf8"))) {
      findings.push({ file: file.replace(root + sep, ""), ...hit });
    }
  }
  return { files, findings };
}

/** Enumerate every shipped code/data asset in the production build. */
export function scanDist(root = ROOT) {
  const dist = join(root, "dist");
  const files = [];
  const visit = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name === ".DS_Store") continue;
      const file = join(dir, name);
      if (statSync(file).isDirectory()) visit(file);
      else if (SHIPPED_EXT.has(extname(file).toLowerCase())) files.push(file);
    }
  };
  if (existsSync(dist)) visit(dist);
  const staticFiles = files.filter((f) => TEXT_EXT.has(extname(f).toLowerCase()));
  const imageFiles = files.filter((f) => IMAGE_EXT.has(extname(f).toLowerCase()));
  const findings = [];
  for (const file of staticFiles) {
    for (const hit of findForbiddenPaints(readFileSync(file, "utf8"))) {
      findings.push({ file: file.replace(root + sep, ""), ...hit });
    }
  }
  const sourceFiles = staticFiles
    .map((f) => join(root, f.slice(dist.length + 1)))
    .filter((f) => existsSync(f) && statSync(f).isFile());
  const sourceImages = imageFiles
    .map((f) => join(root, f.slice(dist.length + 1)))
    .filter((f) => existsSync(f) && statSync(f).isFile());
  const sourceFindings = [];
  for (const file of sourceFiles) {
    for (const hit of findForbiddenPaints(readFileSync(file, "utf8"))) {
      sourceFindings.push({ file: file.replace(root + sep, ""), ...hit });
    }
  }
  return { dist, staticFiles, imageFiles, findings, sourceFiles, sourceImages, sourceFindings };
}

const hueOf = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b),
    d = mx - mn,
    l = (mx + mn) / 2;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
};
export function hasForbiddenPixels(rgba) {
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] < 5) continue;
    // Hue is numerically unstable for near-neutral raster pixels (for example
    // #fefeff decodes as 240° despite being visually white). Require enough
    // absolute channel spread for the hue to be perceptible. Text/vector
    // literals remain checked without this pixel-noise floor below.
    if (
      Math.max(rgba[i], rgba[i + 1], rgba[i + 2]) < 72 ||
      Math.max(rgba[i], rgba[i + 1], rgba[i + 2]) - Math.min(rgba[i], rgba[i + 1], rgba[i + 2]) < 36
    )
      continue;
    const { h, s, l } = hueOf(rgba[i], rgba[i + 1], rgba[i + 2]);
    if (forbiddenHue(h, s) && l > 0.08) return true;
  }
  return false;
}

async function rasterSweep(imageFiles, baseDir = ROOT) {
  if (!imageFiles.length) return { checked: 0, findings: [] };
  const server = createServer((req, res) => {
    let file = localPath(baseDir, req.url || "/");
    if (file && existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!file || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.setHeader("Content-Type", MIME[extname(file).toLowerCase()] || "application/octet-stream");
    res.end(readFileSync(file));
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const startPage = existsSync(join(baseDir, "curriculum/index.html"))
      ? "/curriculum/"
      : "/index.html";
    await page.goto(`http://127.0.0.1:${server.address().port}${startPage}`, {
      waitUntil: "domcontentloaded",
    });
    const paths = imageFiles.map(
      (p) =>
        `/${p
          .slice(baseDir.length + 1)
          .split(sep)
          .join("/")}`,
    );
    const result = await page.evaluate(async (urls) => {
      const hits = [],
        failed = [];
      const inspect = async (url) => {
        try {
          const img = new Image();
          img.src = url;
          await img.decode();
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);
          const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          for (let i = 0; i < rgba.length; i += 4) {
            if (rgba[i + 3] < 5) continue;
            // Ignore compression/antialiasing noise near neutral colors; source
            // text/vector literals are still checked with the strict hue scan.
            if (
              Math.max(rgba[i], rgba[i + 1], rgba[i + 2]) < 72 ||
              Math.max(rgba[i], rgba[i + 1], rgba[i + 2]) -
                Math.min(rgba[i], rgba[i + 1], rgba[i + 2]) <
                36
            )
              continue;
            const r = rgba[i] / 255,
              g = rgba[i + 1] / 255,
              b = rgba[i + 2] / 255,
              mx = Math.max(r, g, b),
              mn = Math.min(r, g, b),
              d = mx - mn,
              l = (mx + mn) / 2;
            if (!d) continue;
            const s = d / (1 - Math.abs(2 * l - 1));
            let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
            h = (h * 60 + 360) % 360;
            if (s > 0.1 && h >= 230 && h <= 320 && (h >= 235 || s >= 0.35)) {
              hits.push({
                url,
                pixel: i / 4,
                color: [rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]],
              });
              break;
            }
          }
        } catch {
          failed.push(url);
        }
      };
      for (let i = 0; i < urls.length; i += 12) {
        await Promise.all(urls.slice(i, i + 12).map(inspect));
      }
      return { hits, failed };
    }, paths);
    return { checked: paths.length, ...result };
  } finally {
    await browser?.close();
    await new Promise((ok) => server.close(ok));
  }
}

/** Return production surfaces changed from the release base, including untracked files. */
export function collectChangedSurfaces(root = ROOT) {
  const run = (args) => {
    try {
      return execFileSync("git", args, { cwd: root, encoding: "utf8" })
        .split(/\r?\n/)
        .filter(Boolean);
    } catch {
      return [];
    }
  };
  const base = process.env.NO_PURPLE_BASE || "origin/main";
  const changed = new Set([
    ...run(["diff", "--name-only", "--diff-filter=ACMR", base]),
    ...run(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]),
    ...run(["ls-files", "--others", "--exclude-standard"]),
  ]);
  // On post-push CI, origin/main may already point at HEAD. Scan the shipped
  // commit itself so the gate never passes vacuously on the default branch.
  if (!changed.size) {
    for (const file of run(["diff", "--name-only", "--diff-filter=ACMR", "HEAD^", "HEAD"])) {
      changed.add(file);
    }
  }
  return [...changed]
    .filter((relative) => CHANGE_EXT.has(extname(relative).toLowerCase()))
    .filter((relative) => !/\.test\.(?:js|mjs|cjs)$/i.test(relative))
    .filter((relative) => !/^tools\/validate-/i.test(relative))
    .map((relative) => join(root, relative))
    .filter((file) => existsSync(file) && statSync(file).isFile())
    .sort();
}

export function scanChangedText(root, files) {
  const findings = [];
  const textFiles = files.filter((file) =>
    [...TEXT_EXT, ".md"].includes(extname(file).toLowerCase()),
  );
  for (const file of textFiles) {
    for (const hit of findForbiddenPaints(readFileSync(file, "utf8"))) {
      findings.push({ file: file.replace(root + sep, ""), ...hit });
    }
  }
  return { textFiles, findings };
}

async function mainFull() {
  const built = scanDist();
  const docs = scanSourceDocs();
  const errors = [];
  if (
    built.staticFiles.length < 5000 ||
    built.staticFiles.filter((f) => extname(f).toLowerCase() === ".html").length < 1000
  ) {
    errors.push(
      `production dist is incomplete: ${built.staticFiles.length} code/data files; expected at least 5000 total and 1000 HTML routes`,
    );
  }
  if (built.imageFiles.length < 100)
    errors.push(
      `production dist raster coverage is incomplete: ${built.imageFiles.length} images; expected at least 100`,
    );
  errors.push(...built.findings.map((x) => `dist:${x.file}:${x.line} ${x.text}`));
  errors.push(...built.sourceFindings.map((x) => `source:${x.file}:${x.line} ${x.text}`));
  errors.push(...docs.findings.map((x) => `doc:${x.file}:${x.line} ${x.text}`));
  if (!built.staticFiles.length)
    errors.push("dist is absent; run the production build before this gate");
  let raster;
  try {
    raster = await rasterSweep(built.imageFiles, built.dist);
  } catch (e) {
    process.exitCode = skipExit(
      `Chromium raster scan unavailable: ${e.message}`,
      "Install the repo Playwright browser",
    );
    return;
  }
  if (raster.failed.length)
    errors.push(`raster images failed to decode: ${raster.failed.join(", ")}`);
  errors.push(...raster.hits.map((x) => `raster:${x.url} pixel ${x.pixel} ${x.color.join(",")}`));
  const reportPath = join(tmpdir(), "eduwonderlab-no-purple-classification.json");
  const { writeFileSync } = await import("node:fs");
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        scannedAt: new Date().toISOString(),
        counts: {
          distFiles: built.staticFiles.length,
          matchedSourceFiles: built.sourceFiles.length,
          markdownFiles: docs.files.length,
          rasterFiles: raster.checked,
          distPaints: built.findings.length,
          sourcePaints: built.sourceFindings.length,
          markdownPaints: docs.findings.length,
          rasterPaints: raster.hits.length,
          rasterDecodeFailures: raster.failed.length,
        },
        dist: built.findings,
        source: built.sourceFindings,
        docs: docs.findings,
        raster: raster.hits,
        rasterFailed: raster.failed,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `no-purple: dist ${built.staticFiles.length} files, matched source ${built.sourceFiles.length}, rasters ${raster.checked}; forbidden paints ${errors.length}`,
  );
  console.log(`no-purple classification: ${reportPath}`);
  if (errors.length) {
    console.error(`FAIL validate:no-purple (${errors.length} findings; first 40 follow)`);
    errors.slice(0, 40).forEach((e) => console.error(`FAIL ${e}`));
    if (errors.length > 40)
      console.error(`... ${errors.length - 40} additional findings recorded by the classifier`);
    process.exitCode = 1;
  } else console.log("PASS validate:no-purple (production dist and matched source files)");
}

async function mainChanged() {
  const files = collectChangedSurfaces();
  const scanned = scanChangedText(ROOT, files);
  const images = files.filter((file) => IMAGE_EXT.has(extname(file).toLowerCase()));
  const errors = scanned.findings.map((x) => `source:${x.file}:${x.line} ${x.text}`);
  let raster = { checked: 0, hits: [], failed: [] };
  if (images.length) {
    try {
      raster = await rasterSweep(images, ROOT);
    } catch (e) {
      process.exitCode = skipExit(
        `Chromium raster scan unavailable: ${e.message}`,
        "Install the repo Playwright browser",
      );
      return;
    }
  }
  if (raster.failed.length)
    errors.push(`raster images failed to decode: ${raster.failed.join(", ")}`);
  errors.push(...raster.hits.map((x) => `raster:${x.url} pixel ${x.pixel} ${x.color.join(",")}`));
  console.log(
    `no-purple changed-surface check: ${scanned.textFiles.length} text/doc files, ${images.length} images; ${errors.length} findings`,
  );
  if (errors.length) {
    console.error(
      `FAIL validate:no-purple (${errors.length} changed-surface findings; first 40 follow)`,
    );
    errors.slice(0, 40).forEach((e) => console.error(`FAIL ${e}`));
    if (errors.length > 40) console.error(`... ${errors.length - 40} additional findings`);
    process.exitCode = 1;
  } else console.log("PASS validate:no-purple (changed production surfaces)");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  (process.argv.includes("--full") ? mainFull() : mainChanged()).catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
