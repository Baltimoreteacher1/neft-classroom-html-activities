#!/usr/bin/env node
/**
 * Write a book's comic-art data into the book, idempotently. Source: graphic-novels/axiom-city/_engine/art/<dir>/
 *   panels.json  per panel: id, prompt, seed, size, alt (the scene, read aloud), faces ([x, y, w, h] as 0-1)
 *   atlas.json   written by `python3 tools/gn-art.py pack`: atlas size, sha256 and each frame's rectangle
 *
 * Two sentinel blocks per illustrated book:
 *   <!-- gn-art:begin --> <link gn-comic.css> <!-- gn-art:end -->                    before </head>
 *   /* gn-art:begin * / const GN_ART = {...}; function ART(id) {...} /* gn-art:end * /   before `const PAGES`
 * ART(id) returns the panel's art element (role=img, aria-label = alt, face boxes). Static markup can ask
 * for a frame with <div data-gn-art="id"></div> (the cover does); the block swaps those in on load.
 *
 *   node tools/inject-gn-art.mjs          write
 *   node tools/inject-gn-art.mjs --check  exit 1 if a book is stale, a frame is missing or unused, an alt
 *                                         or face box is malformed, or the atlas on disk is not the one packed
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { NOVEL_DIR } from "./lib/gn-layer.mjs";

export const ART_DIR = join(NOVEL_DIR, "_engine/art");
export const ATLAS_URL = "/graphic-novels/axiom-city/art/";
export const MAX_ATLAS_BYTES = 2_500_000;
const HEAD_BEGIN = "<!-- gn-art:begin";
const HEAD_END = "<!-- gn-art:end -->";
const JS_BEGIN = "/* gn-art:begin";
const JS_END = "/* gn-art:end */";
const HEAD_RE = /<!-- gn-art:begin[\s\S]*?<!-- gn-art:end -->\n?/;
const JS_RE = /\/\* gn-art:begin[\s\S]*?\/\* gn-art:end \*\/\n?/;

const attr = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

/** Every illustrated book: its art directory, specs and file. */
export function artBooks() {
  if (!existsSync(ART_DIR)) return [];
  return readdirSync(ART_DIR)
    .filter((d) => existsSync(join(ART_DIR, d, "panels.json")))
    .sort()
    .map((dir) => {
      const spec = JSON.parse(readFileSync(join(ART_DIR, dir, "panels.json"), "utf8"));
      const atlasFile = join(ART_DIR, dir, "atlas.json");
      const atlas = existsSync(atlasFile) ? JSON.parse(readFileSync(atlasFile, "utf8")) : null;
      const file = [
        join(NOVEL_DIR, `${spec.book}.html`),
        join(NOVEL_DIR, "episodes", `${spec.book}.html`),
      ].find(existsSync);
      return { dir, spec, atlas, file, webp: join(NOVEL_DIR, "art", `${spec.book}.webp`) };
    });
}

/** Problems with a book's art data that no injection can fix. */
export function problems(b) {
  const out = [];
  if (!b.file) out.push(`${b.dir}: book ${b.spec.book}.html not found`);
  if (!b.atlas) return [...out, `${b.dir}: no atlas.json (run python3 tools/gn-art.py pack)`];
  if (!existsSync(b.webp)) out.push(`${b.dir}: atlas ${b.webp} missing`);
  else {
    const data = readFileSync(b.webp);
    if (createHash("sha256").update(data).digest("hex") !== b.atlas.sha256)
      out.push(`${b.dir}: atlas on disk is not the one atlas.json describes (re-run pack)`);
    if (statSync(b.webp).size > MAX_ATLAS_BYTES)
      out.push(`${b.dir}: atlas is ${statSync(b.webp).size} bytes, budget ${MAX_ATLAS_BYTES}`);
  }
  for (const p of b.spec.panels) {
    const f = b.atlas.frames[p.id];
    if (!f) out.push(`${b.dir}/${p.id}: not in the atlas (re-run pack)`);
    else if (f[0] + f[2] > b.atlas.w || f[1] + f[3] > b.atlas.h)
      out.push(`${b.dir}/${p.id}: frame outside atlas`);
    if (typeof p.alt !== "string" || p.alt.trim().split(/\s+/).length < 6)
      out.push(`${b.dir}/${p.id}: alt must describe the scene (6+ words)`);
    if (/\b(image|picture|illustration) of\b/i.test(p.alt || ""))
      out.push(`${b.dir}/${p.id}: alt should describe the scene, not say "image of"`);
    for (const r of p.faces || [])
      if (
        !Array.isArray(r) ||
        r.length !== 4 ||
        r.some((v) => typeof v !== "number" || v < 0 || v > 1) ||
        r[0] + r[2] > 1.001 ||
        r[1] + r[3] > 1.001
      )
        out.push(`${b.dir}/${p.id}: face box ${JSON.stringify(r)} must be [x, y, w, h] inside 0-1`);
  }
  for (const id of Object.keys(b.atlas.frames))
    if (!b.spec.panels.some((p) => p.id === id))
      out.push(`${b.dir}/${id}: in the atlas but not in panels.json`);
  return out;
}

const pct = (v) => Math.round(v * 10000) / 100;

export function blocks(b) {
  const { w, h, sha256 } = b.atlas;
  const frames = Object.fromEntries(
    b.spec.panels.map((p) => [
      p.id,
      [...b.atlas.frames[p.id], attr(p.alt), (p.faces || []).map((r) => r.map(pct))],
    ]),
  );
  const data = { src: `${ATLAS_URL}${b.spec.book}.webp?v=${sha256.slice(0, 10)}`, w, h, f: frames };
  const head = `${HEAD_BEGIN} (comic panel art — tools/inject-gn-art.mjs) -->\n<link rel="stylesheet" href="/graphic-novels/_shared/gn-comic.css">\n${HEAD_END}\n`;
  const js = `${JS_BEGIN} (comic panel art: one atlas, coordinates and alt text from _engine/art/${b.dir} — tools/inject-gn-art.mjs) */
const GN_ART = ${json(data)};
function ART(id) {
  const a = GN_ART.f[id];
  if (!a) throw new Error("gn-art: no frame " + id);
  const [x, y, w, h, alt, faces] = a;
  const at = (v, total, size) => (total === size ? 0 : (v / (total - size)) * 100);
  const faceHtml = faces.map(([l, t, fw, fh]) => \`<i class="gn-face" style="left:\${l}%;top:\${t}%;width:\${fw}%;height:\${fh}%"></i>\`).join("");
  return \`<div class="gn-art" role="img" aria-label="\${alt}" style="aspect-ratio:\${w}/\${h};background-image:url(\${GN_ART.src});background-size:\${(GN_ART.w / w) * 100}% \${(GN_ART.h / h) * 100}%;background-position:\${at(x, GN_ART.w, w)}% \${at(y, GN_ART.h, h)}%">\${faceHtml}</div>\`;
}
for (const el of document.querySelectorAll("[data-gn-art]")) el.outerHTML = ART(el.dataset.gnArt);
${JS_END}
`;
  return { head, js };
}

export function inject(html, { head, js }) {
  let out = html.replace(HEAD_RE, "").replace(JS_RE, "");
  const h = out.indexOf("</head>");
  const p = out.search(/^const PAGES\s*=/m);
  if (h < 0 || p < 0) throw new Error("book has no </head> or no `const PAGES`");
  out = `${out.slice(0, p)}${js}${out.slice(p)}`;
  const h2 = out.indexOf("</head>");
  return `${out.slice(0, h2)}${head}${out.slice(h2)}`;
}

/** Frame ids the book's markup asks for: ART("id") in PAGES and data-gn-art="id" in static HTML. */
export function usedFrames(html) {
  const body = html.replace(JS_RE, "");
  return new Set(
    [...body.matchAll(/\bART\("([\w-]+)"\)|data-gn-art="([\w-]+)"/g)].map((m) => m[1] || m[2]),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes("--check");
  const errors = [];
  let changed = 0;
  for (const b of artBooks()) {
    const bad = problems(b);
    if (bad.length) {
      errors.push(...bad);
      continue;
    }
    const html = readFileSync(b.file, "utf8");
    const next = inject(html, blocks(b));
    const used = usedFrames(next);
    for (const id of used)
      if (!b.atlas.frames[id]) errors.push(`${b.dir}: book uses frame "${id}" that does not exist`);
    for (const p of b.spec.panels)
      if (!used.has(p.id)) errors.push(`${b.dir}/${p.id}: packed but never shown`);
    if (next === html) continue;
    changed++;
    if (check) errors.push(`${b.dir}: gn-art block is stale; run node tools/inject-gn-art.mjs`);
    else writeFileSync(b.file, next);
  }
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(check ? "gn-art blocks current" : `Updated ${changed} book(s)`);
}
