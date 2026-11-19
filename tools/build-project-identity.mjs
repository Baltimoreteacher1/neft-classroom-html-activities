#!/usr/bin/env node
/**
 * Build the Projects identity layer: one distinct look per project.
 *
 *   tools/lib/project-identity/themes.mjs     palette, type, hero layout per project (source of truth)
 *   tools/lib/project-identity/art/*.mjs      one hero scene per project (source of truth)
 *        -> shared/projects/identity/projects-identity-tokens.css   (generated, one block per project)
 *        -> shared/projects/identity/art/<id>.svg                  (generated, hero + card art)
 *
 * The hand-written structure that consumes these tokens is
 * shared/projects/identity/projects-identity.css. Every registry project must have a theme and a
 * scene; the build fails on a missing one, on a palette that cannot carry readable text, and on
 * art that is oversized or carries text, images or scripts.
 *
 *   node tools/build-project-identity.mjs            write the files
 *   node tools/build-project-identity.mjs --check    fail when the committed files are stale
 *   node tools/build-project-identity.mjs --only a,b write only these ids (art authoring)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ART } from "./lib/project-identity/art/index.mjs";
import { alpha, contrast, mix } from "./lib/project-identity/color.mjs";
import { FONTS, THEMES } from "./lib/project-identity/themes.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "shared/projects/identity");
const ART_DIR = path.join(OUT, "art");
const TOKENS = path.join(OUT, "projects-identity-tokens.css");
const MAX_ART_BYTES = 28 * 1024;
const WHITE = "#ffffff";

const args = new Set(globalThis.process.argv.slice(2));
const CHECK = args.has("--check");
const onlyArg = globalThis.process.argv.find((a) => a.startsWith("--only="));
const ONLY = onlyArg ? new Set(onlyArg.slice(7).split(",")) : null;

const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "data/project-registry.json"), "utf8"));
const IDS = registry.projects.map((p) => p.id);
const errors = [];
const fail = (id, msg) => errors.push(`${id}: ${msg}`);

/** A palette must carry readable text in every role the layout gives it. */
function checkPalette(id, th) {
  const need = (label, a, b, min) => {
    const ratio = contrast(a, b);
    if (ratio < min) fail(id, `${label} contrast ${ratio.toFixed(2)} < ${min} (${a} on ${b})`);
  };
  need("white on ink", WHITE, th.ink, 7);
  need("white on deep", WHITE, th.deep, 4.5);
  need("white on accent", WHITE, th.accent, 4.5);
  need("accent on paper", th.accent, th.paper, 4.5);
  need("accentB on paper", th.accentB, th.paper, 4.5);
  need("accentB on white", th.accentB, WHITE, 4.5);
  need("ink on tint", th.ink, th.tint, 7);
  need("glow on ink", th.glow, th.ink, 4.5);
  if (th.tone === "light" && th.layout === "poster") fail(id, "poster layout is dark-tone only");
  if (!FONTS[th.font]) fail(id, `unknown font key ${th.font}`);
}

function checkArt(id, svg) {
  if (typeof svg !== "string" || !svg.includes("<")) return fail(id, "scene returned no markup");
  const bytes = Buffer.byteLength(svg);
  if (bytes > MAX_ART_BYTES) fail(id, `scene is ${bytes} bytes, cap ${MAX_ART_BYTES}`);
  for (const [re, why] of [
    [/<text[\s>]/i, "<text> (fonts are not guaranteed inside a background image)"],
    [/<image[\s>]/i, "<image>"],
    [/<script[\s>]/i, "<script>"],
    [/<foreignObject/i, "<foreignObject>"],
    [/(?:href|src)\s*=\s*["']https?:/i, "an external reference"],
    [/[\u{1F300}-\u{1FAFF}☀-➿]/u, "an emoji"],
  ])
    if (re.test(svg)) fail(id, `scene contains ${why}`);
}

function paletteFor(id, th) {
  return {
    id,
    tone: th.tone,
    dark: th.tone === "dark",
    ink: th.ink,
    deep: th.deep,
    accent: th.accent,
    accentB: th.accentB,
    glow: th.glow,
    paper: th.paper,
    tint: th.tint,
  };
}

function wrapScene(p, scene) {
  const bg = p.dark
    ? `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.ink}"/><stop offset="1" stop-color="${p.deep}"/></linearGradient></defs><rect width="1200" height="600" fill="url(#bg)"/>`
    : `<rect width="1200" height="600" fill="${p.tint}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${bg}${scene}</svg>\n`;
}

function tokenBlock(id, th) {
  const f = FONTS[th.font];
  const dark = th.tone === "dark";
  const poster = th.layout === "poster";
  const soft = dark ? "rgba(255,255,255,.9)" : mix(th.ink, th.tint, 0.18);
  const line = mix(th.tint, th.ink, 0.12);
  const rows = {
    ink: th.ink,
    deep: th.deep,
    accent: th.accent,
    "accent-b": th.accentB,
    glow: th.glow,
    paper: th.paper,
    tint: th.tint,
    line,
    "tint-soft": mix(th.tint, WHITE, 0.55),
    display: f.stack,
    "display-weight": f.weight,
    "display-track": f.track,
    "display-scale": f.scale ?? 1,
    "hero-bg": dark ? `linear-gradient(135deg, ${th.ink} 0%, ${th.deep} 100%)` : th.tint,
    "hero-fg": dark ? WHITE : th.ink,
    "hero-soft": soft,
    "hero-inv": dark ? th.ink : WHITE,
    "chip-bg": dark ? "rgba(255,255,255,.13)" : "rgba(255,255,255,.62)",
    "chip-bd": dark ? "rgba(255,255,255,.4)" : alpha(th.ink, 0.28),
    "art-width": poster ? "100%" : "54%",
    "art-mask": poster
      ? "linear-gradient(#000, #000)"
      : "linear-gradient(90deg, transparent 0%, #000 30%)",
    "art-scrim": poster
      ? `linear-gradient(90deg, ${alpha(th.ink, 0.92)} 0%, ${alpha(th.ink, 0.7)} 42%, ${alpha(th.ink, 0.12)} 100%)`
      : "none",
    "copy-width": poster ? "62%" : "52%",
    art: `url(/shared/projects/identity/art/${id}.svg)`,
  };
  const body = Object.entries(rows)
    .map(([k, v]) => `--id-${k}:${v}`)
    .join(";");
  return `[data-project="${id}"]{${body}}`;
}

const out = new Map();
const missing = [];

for (const id of IDS) {
  const th = THEMES[id];
  if (!th) {
    fail(id, "no theme in themes.mjs");
    continue;
  }
  checkPalette(id, th);
  const scene = ART[id];
  if (!scene) {
    if (!ONLY) missing.push(id); // --only is for art authoring: scenes not written yet are expected
    continue;
  }
  const p = paletteFor(id, th);
  const svg = wrapScene(p, scene(p));
  checkArt(id, svg);
  out.set(id, svg);
}
for (const id of Object.keys(THEMES))
  if (!IDS.includes(id)) fail(id, "theme for an id the registry does not list");
for (const id of Object.keys(ART))
  if (!IDS.includes(id)) fail(id, "art for an id the registry does not list");
for (const id of missing) fail(id, "no scene in tools/lib/project-identity/art/");

if (errors.length) {
  console.error(`build-project-identity: ${errors.length} problem(s)\n  ${errors.join("\n  ")}`);
  globalThis.process.exit(1);
}

const css = `/* GENERATED by tools/build-project-identity.mjs from tools/lib/project-identity/. Do not edit. */\n${IDS.map((id) => tokenBlock(id, THEMES[id])).join("\n")}\n`;

const stale = [];
function put(file, text) {
  const exists = fs.existsSync(file);
  if (exists && fs.readFileSync(file, "utf8") === text) return;
  if (CHECK) return stale.push(path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

put(TOKENS, css);
for (const [id, svg] of out) if (!ONLY || ONLY.has(id)) put(path.join(ART_DIR, `${id}.svg`), svg);

if (CHECK) {
  const onDisk = fs.existsSync(ART_DIR)
    ? fs.readdirSync(ART_DIR).filter((f) => f.endsWith(".svg"))
    : [];
  for (const f of onDisk)
    if (!out.has(f.replace(/\.svg$/, ""))) stale.push(`shared/projects/identity/art/${f} (orphan)`);
  if (stale.length) {
    console.error(
      `build-project-identity --check: stale or orphan files\n  ${stale.join("\n  ")}\nRun: node tools/build-project-identity.mjs`,
    );
    globalThis.process.exit(1);
  }
  console.log(`build-project-identity --check: ${IDS.length} projects up to date`);
} else {
  console.log(`build-project-identity: ${IDS.length} projects, ${out.size} scenes written`);
}
