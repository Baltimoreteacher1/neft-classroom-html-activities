#!/usr/bin/env node
/**
 * validate-palette — no violet, purple, indigo-violet or magenta on a core lesson.
 *
 * The locked palette (docs/style-guide.md section 1, engine/design/tokens.json) forbids
 * hue 255-335 deg at saturation > 15% (`isForbiddenHue`, tools/lib/color-math.mjs).
 * Two halves, because each is blind to what the other sees:
 *
 *   (a) STATIC  - every hex, rgb()/rgba(), hsl()/hsla() literal and every named colour
 *       VALUE (purple, violet, orchid, ...) in the files a core lesson loads. Finds
 *       a colour that only paints when a rarely-used state opens, but cannot know
 *       whether a rule is reached.
 *   (b) BROWSER - boots the built site, walks the 84 core lessons through entry, the
 *       identity gate and every sidebar phase, opens every <details>, and reads the
 *       COMPUTED colour (color, background, borders, outline, fill, stroke, shadows,
 *       gradients, ::before/::after) of every visible element. This is the half that
 *       sees what a student sees: the "go deeper" panel painted #5b21b6 on all 84
 *       lessons and the entry and lesson states, which were the only ones first
 *       measured, showed zero purple.
 *
 * A sweep that finds nothing has verified nothing: fewer than MIN_FILES static files, or
 * fewer than MIN_STATES browser states, FAILS. A missing browser is a SKIP (exit 3
 * locally, 1 in CI) via tools/lib/skip-exit.mjs, never a pass.
 *
 *   node tools/validate-palette.mjs                      both halves (needs dist/)
 *   node tools/validate-palette.mjs --static-only        half (a) only
 *   node tools/validate-palette.mjs --browser-only --ids 1-1,3-1 --base http://localhost:4601
 *   node tools/validate-palette.mjs --static-only --root <dir> --min-files 1   (the tests)
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isForbiddenHue, parseColor, toHsl } from "./lib/color-math.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const REPO = resolve(fileURLToPath(new URL("..", import.meta.url)));
const MIN_FILES = 40;
const MIN_STATES = 400; // 84 lessons x (entry + gate + phases); a real run is ~700

const NAMED = [
  "purple",
  "violet",
  "indigo",
  "magenta",
  "fuchsia",
  "orchid",
  "plum",
  "lavender",
  "amethyst",
  "mauve",
  "thistle",
  "rebeccapurple",
  "mediumpurple",
  "blueviolet",
  "darkviolet",
  "darkorchid",
  "mediumorchid",
  "darkmagenta",
  "mediumvioletred",
  "palevioletred",
];
// A named colour is a VALUE only after `:`, `=`, `(` or `,` (optionally quoted). That is
// why `badge-indigo` (a class name) and "an indigo-to-teal gradient" (prose) are not hits.
const NAMED_VALUE = new RegExp(`[:=(,]\\s*["']?(${NAMED.join("|")})(?![\\w-])`, "gi");

export const forbiddenHsl = (h, s, l) => s > 0.15 && l > 0.03 && l < 0.97 && h >= 255 && h <= 335;

/** Blank out comments, keeping newlines so line numbers survive. */
export function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  return src
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[\s;{}])\/\/[^\n]*/g, (m, p) => p + blank(m.slice(p.length)));
}

/** Forbidden-hue colour literals in a source string -> [{line, text}]. */
export function findForbiddenLiterals(src) {
  const text = stripComments(src);
  const hits = [];
  const at = (index) => text.slice(0, index).split("\n").length;
  for (const m of text.matchAll(
    /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\([^)]*\)/g,
  )) {
    const c = parseColor(m[0]);
    if (c && isForbiddenHue(c)) hits.push({ line: at(m.index), text: m[0] });
  }
  for (const m of text.matchAll(/hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/g)) {
    if (forbiddenHsl(+m[1], +m[2] / 100, +m[3] / 100)) hits.push({ line: at(m.index), text: m[0] });
  }
  for (const m of text.matchAll(NAMED_VALUE))
    hits.push({ line: at(m.index), text: m[0].replace(/^[:=(,]\s*/, "") });
  return hits;
}

function walk(dir, accept, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, accept, acc);
    else if (accept(name)) acc.push(p);
  }
  return acc;
}

const CODE = (n) => /\.(css|js|mjs)$/.test(n) && !/\.(test|spec)\./.test(n);

/**
 * The files a core lesson loads: the whole engine, the two shared folders its page
 * injects, the ewl reference layer, learning supports, and every /assets or /shared
 * stylesheet/script the 84 lesson pages (and the launch manifest's ids) reference.
 */
export function lessonPathFiles(root) {
  const set = new Set();
  for (const d of [
    "engine",
    "shared/level-switch",
    "shared/save-resume",
    "assets/ewl",
    "assets/learning-supports",
  ])
    for (const f of walk(join(root, d), CODE)) set.add(f);
  const manifestPath = join(root, "data/curriculum-launch-manifest.json");
  const ids = existsSync(manifestPath)
    ? (JSON.parse(readFileSync(manifestPath, "utf8")).lessons || []).map((l) => l.id)
    : [];
  for (const id of ids) {
    // The BUILT page (dist/lessons/<id>/), not curriculum source, so this is not a reader of the
    // lessons/ seam in tools/lib/curriculum-source.mjs; a template literal keeps the ratchet honest.
    const page = join(root, `lessons/${id}/index.html`);
    if (!existsSync(page)) continue;
    for (const m of readFileSync(page, "utf8").matchAll(
      /(?:href|src)="(\/(?:assets|shared)\/[^"?#]+\.(?:css|js))/g,
    )) {
      const f = join(root, m[1]);
      if (existsSync(f)) set.add(f);
    }
  }
  for (const f of [
    "assets/lesson-publisher-polish.css",
    "assets/mobile-access.css",
    "assets/nt-page-enhance.js",
  ]) {
    if (existsSync(join(root, f))) set.add(join(root, f));
  }
  return [...set].sort();
}

export function staticSweep(root, minFiles = MIN_FILES) {
  const files = lessonPathFiles(root);
  const findings = [];
  for (const f of files) {
    for (const h of findForbiddenLiterals(readFileSync(f, "utf8"))) {
      findings.push({ file: relative(root, f), ...h });
    }
  }
  return {
    files: files.length,
    findings,
    ok: files.length >= minFiles && findings.length === 0,
    minFiles,
  };
}

// ---------------------------------------------------------------- browser half

// Runs inside the page. Returns [{sel, prop, color}] for forbidden paints only.
export function probe() {
  const hslOf = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const l = (mx + mn) / 2;
    const d = mx - mn;
    if (d === 0) return { h: 0, s: 0, l };
    const s = d / (1 - Math.abs(2 * l - 1));
    let h;
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return { h: (h * 60 + 360) % 360, s, l };
  };
  const bad = (r, g, b, a) => {
    if (a < 0.02) return false;
    const { h, s, l } = hslOf(r, g, b);
    return s > 0.15 && l > 0.03 && l < 0.97 && h >= 255 && h <= 335;
  };
  // rgb(), rgba(), color(srgb ...) - everything Chrome serialises a computed colour as.
  const forbiddenIn = (value) => {
    if (!value || value === "none") return [];
    const out = [];
    for (const m of value.matchAll(/rgba?\(([^)]+)\)/g)) {
      const p = m[1]
        .split(/[\s,/]+/)
        .filter(Boolean)
        .map(Number);
      if (p.length >= 3 && bad(p[0], p[1], p[2], p[3] ?? 1)) out.push(m[0]);
    }
    for (const m of value.matchAll(/color\(srgb ([^)]+)\)/g)) {
      const p = m[1]
        .split(/[\s/]+/)
        .filter(Boolean)
        .map(Number);
      if (p.length >= 3 && bad(p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1)) out.push(m[0]);
    }
    return out;
  };
  const desc = (el) => {
    const cls = typeof el.className === "string" ? el.className : el.className?.baseVal || "";
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${cls.trim() ? `.${cls.trim().split(/\s+/).slice(0, 2).join(".")}` : ""}`;
  };
  for (const d of document.querySelectorAll("details")) d.open = true;
  const found = [];
  const seen = new Set();
  const add = (el, pseudo, prop, value) => {
    for (const c of forbiddenIn(value)) {
      const key = `${desc(el)}${pseudo}|${prop}|${c}`;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({ sel: desc(el) + pseudo, prop, color: c });
    }
  };
  const read = (el, pseudo) => {
    const cs = getComputedStyle(el, pseudo || null);
    const tag = pseudo || "";
    add(el, tag, "color", cs.color);
    add(el, tag, "background-color", cs.backgroundColor);
    add(el, tag, "background-image", cs.backgroundImage);
    for (const side of ["Top", "Right", "Bottom", "Left"]) {
      if (parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== "none")
        add(el, tag, `border-${side.toLowerCase()}`, cs[`border${side}Color`]);
    }
    if (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0)
      add(el, tag, "outline", cs.outlineColor);
    add(el, tag, "box-shadow", cs.boxShadow);
    add(el, tag, "text-shadow", cs.textShadow);
    add(el, tag, "caret-color", cs.caretColor);
    if (cs.accentColor && cs.accentColor !== "auto") add(el, tag, "accent-color", cs.accentColor);
    if (el instanceof SVGElement) {
      add(el, tag, "fill", cs.fill);
      add(el, tag, "stroke", cs.stroke);
    }
  };
  let n = 0;
  for (const el of document.querySelectorAll("body, body *")) {
    if (["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(el.tagName)) continue;
    if (el.getClientRects().length === 0) continue;
    n++;
    read(el);
    for (const p of ["::before", "::after"]) {
      const content = getComputedStyle(el, p).content;
      if (content && content !== "none" && content !== "normal") read(el, p);
    }
  }
  return { elements: n, found };
}

const SKIP_LABEL = /^(\u2039|Read Aloud|Draw|Previous|Next|Show all|Save|Teacher|Workbench)/i;
/** In-page: the label of every sidebar button worth visiting. */
function sidebarLabels(skipSource) {
  const skip = new RegExp(skipSource, "i");
  const seen = new Set();
  const out = [];
  for (const b of document.querySelectorAll(".sidebar button, nav button, aside button")) {
    const l = (b.innerText || "")
      .replace(/\s+/g, " ")
      .replace(/^[\d\s\p{Extended_Pictographic}\u200d\ufe0f]+/u, "")
      .replace(/[\u2605\u2606\s]+$/, "")
      .trim();
    if (!l || skip.test(l) || seen.has(l)) continue;
    seen.add(l);
    out.push(l);
  }
  return out;
}

/** In-page: click the sidebar button with that label. */
function clickSidebar([label, skipSource]) {
  const skip = new RegExp(skipSource, "i");
  for (const b of document.querySelectorAll(".sidebar button, nav button, aside button")) {
    const l = (b.innerText || "")
      .replace(/\s+/g, " ")
      .replace(/^[\d\s\p{Extended_Pictographic}\u200d\ufe0f]+/u, "")
      .replace(/[\u2605\u2606\s]+$/, "")
      .trim();
    if (l === label && !skip.test(l)) {
      b.click();
      return true;
    }
  }
  return false;
}

async function enter(page) {
  // Mission card(s) -> identity gate -> lesson (model: tools/style-audit.mjs enter()).
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
      await page.waitForTimeout(1200);
      return true;
    }
    const go = page
      .locator("button", { hasText: /→/ })
      .filter({ hasNotText: /Next:|Save|Workbench|Teacher/ })
      .first();
    if (!(await go.isVisible().catch(() => false))) return false;
    await go.click().catch(() => {});
    await page.waitForTimeout(450);
  }
  return false;
}

async function startPreview(port) {
  const proc = spawn(
    "npx",
    ["vite", "preview", "--port", String(port), "--strictPort", "--host", "127.0.0.1"],
    {
      cwd: REPO,
      stdio: "ignore",
    },
  );
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${base}/lessons/1-1/`)).ok) return { proc, base };
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  proc.kill();
  throw new Error("vite preview did not come up");
}

export async function browserSweep({ base, lessons, concurrency = 4, log = () => {} }) {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    return { skip: "playwright is not installed" };
  }
  let browser;
  try {
    browser = await chromium.launch(
      process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    );
  } catch (e) {
    return { skip: `no Chromium available (${String(e.message).split("\n")[0]})` };
  }
  const findings = [];
  const unreachable = [];
  let states = 0;
  let elements = 0;
  const phaseStates = {};
  const queue = [...lessons];
  const worker = async () => {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    for (let id = queue.shift(); id; id = queue.shift()) {
      const page = await ctx.newPage();
      const measure = async (state) => {
        const r = await page.evaluate(probe);
        states++;
        elements += r.elements;
        phaseStates[state] = (phaseStates[state] || 0) + 1;
        for (const f of r.found) findings.push({ lesson: id, state, ...f });
      };
      try {
        await page.goto(`${base}/lessons/${id}/`, { waitUntil: "load", timeout: 45000 });
        await page.waitForTimeout(500);
        await measure("entry");
        if (await enter(page)) {
          await measure("lesson");
          // Every sidebar entry, by its own label: lessons name their phases differently
          // (Warm-Up, Notice & Wonder, Explore, Apply, Objectives Review ...).
          const labels = await page.evaluate(sidebarLabels, SKIP_LABEL.source);
          for (const name of labels) {
            const ok = await page.evaluate(clickSidebar, [name, SKIP_LABEL.source]);
            if (!ok) continue;
            await page.waitForTimeout(500);
            await measure(`phase:${name}`);
            await page.keyboard.press("Escape").catch(() => {});
          }
        } else unreachable.push(id);
      } catch (e) {
        unreachable.push(`${id} (${String(e.message).split("\n")[0].slice(0, 80)})`);
      }
      await page.close();
      log(id);
    }
    await ctx.close();
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  await browser.close();
  return { findings, unreachable, states, elements, phaseStates };
}

const summarize = (findings, keyOf) => {
  const m = new Map();
  for (const f of findings) m.set(keyOf(f), (m.get(keyOf(f)) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

async function main() {
  const argv = process.argv.slice(2);
  const flag = (n) => argv.includes(`--${n}`);
  const opt = (n) => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const root = opt("root") ? resolve(opt("root")) : REPO;
  let failed = false;

  if (!flag("browser-only")) {
    const minFiles = Number(opt("min-files") || MIN_FILES);
    const s = staticSweep(root, minFiles);
    console.log(
      `palette static: swept ${s.files} lesson-path files, ${s.findings.length} forbidden-hue literal(s)`,
    );
    if (s.files < minFiles) {
      console.error(
        `FAIL palette static: swept ${s.files} files (< ${minFiles}). An empty sweep verifies nothing.`,
      );
      failed = true;
    }
    for (const f of s.findings) console.error(`  ${f.file}:${f.line}  ${f.text}`);
    if (s.findings.length) failed = true;
  }

  if (!flag("static-only")) {
    const manifest = JSON.parse(
      readFileSync(join(root, "data/curriculum-launch-manifest.json"), "utf8"),
    );
    const all = (manifest.lessons || []).map((l) => l.id);
    const lessons = opt("ids") ? opt("ids").split(",") : all;
    let base = opt("base");
    let preview;
    if (!base) {
      if (!existsSync(join(root, "dist/lessons"))) {
        console.error("FAIL palette browser: dist/ is missing. Run `npm run build` first.");
        process.exit(1);
      }
      preview = await startPreview(Number(opt("port") || 4601));
      base = preview.base;
    }
    let done = 0;
    const r = await browserSweep({
      base,
      lessons,
      concurrency: Number(opt("concurrency") || 4),
      log: () => {
        if (++done % 12 === 0)
          process.stderr.write(`  palette browser: ${done}/${lessons.length} lessons\n`);
      },
    });
    preview?.proc.kill();
    if (r.skip) {
      const code = skipExit(
        `palette browser half: ${r.skip}`,
        "Set PW_CHROMIUM_PATH to a system Chromium.",
      );
      process.exit(failed ? 1 : code);
    }
    const minStates = lessons.length === all.length ? MIN_STATES : lessons.length * 4;
    console.log(
      `palette browser: ${lessons.length} lessons, ${r.states} states, ${r.elements} elements read, ${r.findings.length} forbidden paint(s)`,
    );
    console.log(
      `  states by phase: ${Object.entries(r.phaseStates)
        .map(([k, n]) => `${k}=${n}`)
        .join("  ")}`,
    );
    if (r.states < minStates) {
      console.error(
        `FAIL palette browser: only ${r.states} states measured (< ${minStates}). An empty sweep verifies nothing.`,
      );
      failed = true;
    }
    if (r.unreachable.length) {
      console.error(`FAIL palette browser: lesson(s) never entered: ${r.unreachable.join(", ")}`);
      failed = true;
    }
    if (r.findings.length) {
      failed = true;
      console.error("  by selector/property/colour:");
      for (const [k, n] of summarize(r.findings, (f) => `${f.sel} ${f.prop} ${f.color}`).slice(
        0,
        25,
      ))
        console.error(`    ${n}x ${k}`);
      console.error("  by phase:");
      for (const [k, n] of summarize(r.findings, (f) => f.state)) console.error(`    ${n}x ${k}`);
      console.error(`  lessons affected: ${new Set(r.findings.map((f) => f.lesson)).size}`);
    }
  }

  console.log(failed ? "FAIL validate:palette" : "PASS validate:palette");
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
