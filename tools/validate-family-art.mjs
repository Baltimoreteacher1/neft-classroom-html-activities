#!/usr/bin/env node
/**
 * validate-family-art.mjs: the Family Math Studio art kit is well formed, small, self-contained, accessible and in
 * the palette. Sweeps every SVG under assets/design/family/art/ plus the rendered output of the pure modules
 * (hook cards and math models, both languages).
 *
 * Detectors (each proven on a known-bad fixture BEFORE the sweep, and a sweep of zero files FAILS):
 *   WELLFORMED   the file parses as XML
 *   SIZE         <= 8 KB per illustration (sprites and Open Graph cards have their own stated caps)
 *   NO_SCRIPT    no <script>, no on*= handler, no javascript: URL
 *   NO_EXTERNAL  no external href / url() / @import / http(s) reference; no <image>, no data: URI, no <foreignObject>
 *   HEX          no raw hex colour outside a var(--token, #fallback); every hex (fallbacks included) is in the palette
 *   A11Y         root is aria-hidden="true" OR role="img" with a non-empty first-child <title>; scenes must be decorative
 *   IDS          no duplicate id; every url(#x) / href="#x" resolves inside the file
 * Plus: every icon id in the README exists in the sprite and vice versa, counts meet the floors, the unit accents are
 * outside the violet/magenta band, and the generated files match a fresh `tools/build-family-art.mjs` run.
 *
 * Usage: node tools/validate-family-art.mjs
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import {
  HOOK_KINDS,
  renderHookCard,
  sampleSlots,
} from "../assets/design/family/art/hook-cards.mjs";
import { renderModel } from "../assets/design/family/art/math-models.mjs";
import { SAMPLES } from "../assets/design/family/art/math-samples.mjs";
import { isForbiddenHue, parseColor, toHsl } from "./lib/color-math.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ART = join(ROOT, "assets/design/family/art");

const CAP = { default: 8192, sprite: 24576, og: 16384 };
const FLOORS = { icons: 45, scenes: 10, spots: 30, hooks: 6 };

/** Palette: the design tokens, the generated tint ramp, the unit accents and the illustration extras below. */
const ART_EXTRA = [
  // skin, hair and eyes (fixed on purpose: people must not recolour in dark mode)
  "#F3D2B3",
  "#E0AC7E",
  "#B97A4C",
  "#8A5733",
  "#5E3A22",
  "#2A1D16",
  "#6B4527",
  "#A9A29A",
  "#B5762E",
  // illustration neutrals and secondaries
  "#E6E0D0",
  "#D9694A",
  "#6F9BC9",
  "#7FB27E",
  "#FFFFFF",
  // dark-theme counterparts
  "#223245",
  "#2B3C4F",
  "#E07B5E",
  "#7FA8D4",
  "#8FC08E",
  "#14202C",
  // score board, math "error" ground
  "#24496D",
  "#1B3A58",
  "#0F2236",
  "#F6E6E2",
];

const hexesIn = (s) =>
  [...s.matchAll(/#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)].map((m) =>
    m[0].toUpperCase(),
  );

export function loadPalette() {
  const set = new Set(ART_EXTRA.map((h) => h.toUpperCase()));
  const tokens = JSON.parse(readFileSync(join(ROOT, "engine/design/tokens.json"), "utf8")).palette;
  for (const v of Object.values(tokens)) set.add(v.toUpperCase());
  for (const h of hexesIn(
    readFileSync(join(ROOT, "engine/styles/ds-tokens.generated.css"), "utf8"),
  ))
    set.add(h);
  for (const u of JSON.parse(readFileSync(join(ART, "units.json"), "utf8")))
    for (const k of ["accent", "tint", "tintDark"]) set.add(u[k].toUpperCase());
  return set;
}

/** Strip every var(--x, fallback) (balanced), keep the fallbacks aside. */
function splitVars(input) {
  let bare = "";
  const fallbacks = [];
  // a custom-property DEFINITION (--unit-accent:#3F7CB8) is a token, not a raw colour: it is palette-checked instead
  const s = input.replace(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/g, (_, name, hex) => {
    fallbacks.push(hex.toUpperCase());
    return `${name}:var()`;
  });
  for (let i = 0; i < s.length; ) {
    if (s.startsWith("var(", i)) {
      let depth = 0;
      let j = i + 3;
      for (; j < s.length; j++) {
        if (s[j] === "(") depth++;
        if (s[j] === ")" && --depth === 0) break;
      }
      fallbacks.push(...hexesIn(s.slice(i, j + 1)));
      bare += "var()";
      i = j + 1;
    } else bare += s[i++];
  }
  return { bare, fallbacks };
}

/** @returns {string[]} problems for one SVG document */
export function checkSvg(_name, svg, { cap = CAP.default, palette, scene = false } = {}) {
  const errs = [];
  const bytes = Buffer.byteLength(svg);
  if (bytes > cap) errs.push(`SIZE ${bytes} bytes > ${cap}`);
  let doc;
  try {
    const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
    doc = dom.window.document;
  } catch (e) {
    return [...errs, `WELLFORMED ${String(e.message).split("\n")[0]}`];
  }
  const root = doc.documentElement;
  if (root.localName !== "svg") errs.push("WELLFORMED root is not <svg>");
  if (doc.querySelector("script") || /\son[a-z]+\s*=/i.test(svg) || /javascript:/i.test(svg))
    errs.push("NO_SCRIPT script, event handler or javascript: URL");
  for (const el of doc.querySelectorAll("*")) {
    for (const a of el.attributes) {
      if ((a.localName === "href" || a.name === "xlink:href") && !a.value.startsWith("#"))
        errs.push(`NO_EXTERNAL ${a.name}="${a.value.slice(0, 40)}"`);
    }
  }
  const withoutNs = svg.replace(/xmlns(:xlink)?="http:\/\/www\.w3\.org\/[^"]+"/g, "");
  if (/https?:\/\//i.test(withoutNs)) errs.push("NO_EXTERNAL http(s) reference");
  if (/@import/i.test(svg)) errs.push("NO_EXTERNAL @import");
  if (/data:/i.test(svg)) errs.push("NO_EXTERNAL data: URI");
  if (doc.querySelector("image, foreignObject"))
    errs.push("NO_EXTERNAL <image> or <foreignObject> (raster / embedded HTML)");
  // colour
  const { bare, fallbacks } = splitVars(svg);
  for (const h of hexesIn(bare)) errs.push(`HEX raw ${h} outside a var(--token, fallback)`);
  for (const h of new Set(fallbacks))
    if (palette && !palette.has(h)) errs.push(`HEX fallback ${h} is not in the palette`);
  // accessibility
  const hidden = root.getAttribute("aria-hidden") === "true";
  const title = [...root.children].find((c) => c.localName === "title");
  const titled =
    root.getAttribute("role") === "img" && title && title.textContent.trim().length > 0;
  if (!hidden && !titled)
    errs.push(
      'A11Y root needs aria-hidden="true" or role="img" with a non-empty <title> as a direct child',
    );
  if (hidden && root.getAttribute("role") === "img")
    errs.push("A11Y aria-hidden and role=img together");
  if (scene && !hidden) errs.push("A11Y scenes are decorative and must be aria-hidden");
  if (scene && title) errs.push("A11Y a decorative scene must not carry a <title>");
  // ids
  const ids = [...doc.querySelectorAll("[id]")].map((e) => e.getAttribute("id"));
  for (const id of ids)
    if (ids.indexOf(id) !== ids.lastIndexOf(id)) errs.push(`IDS duplicate id "${id}"`);
  for (const m of svg.matchAll(/url\(#([^)]+)\)/g))
    if (!ids.includes(m[1])) errs.push(`IDS url(#${m[1]}) has no target`);
  for (const el of doc.querySelectorAll("use")) {
    const h = el.getAttribute("href");
    if (h?.startsWith("#") && !ids.includes(h.slice(1)))
      errs.push(`IDS <use href="${h}"> has no target`);
  }
  for (const el of doc.querySelectorAll("[aria-labelledby]"))
    for (const id of el.getAttribute("aria-labelledby").split(/\s+/))
      if (!ids.includes(id)) errs.push(`IDS aria-labelledby -> ${id} missing`);
  return errs;
}

/** A sweep over named documents; zero documents is a failure, not a pass. */
export function sweep(docs, opts) {
  if (docs.length === 0)
    return {
      failures: ["SWEEP swept zero files; a gate that finds nothing has verified nothing"],
      checked: 0,
    };
  const failures = [];
  for (const d of docs)
    for (const e of checkSvg(d.name, d.svg, { ...opts, ...d.opts }))
      failures.push(`${d.name}: ${e}`);
  return { failures, checked: docs.length };
}

// ---------------------------------------------------------------------------------------------------- self-tests
function selfTest(palette) {
  const ok =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" aria-hidden="true"><rect fill="var(--ink,#17324D)" width="4" height="4"/></svg>';
  assert.deepEqual(checkSvg("ok", ok, { palette }), [], "the clean fixture must pass");
  const bad = {
    WELLFORMED: ok.replace("</svg>", ""),
    SIZE: ok.replace("</svg>", `<!--${"x".repeat(9000)}--></svg>`),
    NO_SCRIPT: ok.replace("<rect", "<script>alert(1)</script><rect"),
    "NO_SCRIPT (handler)": ok.replace("<rect", '<rect onclick="x()"'),
    NO_EXTERNAL: ok.replace("<rect", '<use href="https://example.com/a.svg#x"/><rect'),
    "NO_EXTERNAL (http)": ok.replace("<rect", '<a x="http://example.com"/><rect'),
    "NO_EXTERNAL (image)": ok.replace("<rect", '<image href="#a"/><rect'),
    "NO_EXTERNAL (data)": ok.replace(
      "<rect",
      '<rect style="background:url(data:image/png;base64,AAAA)"/><rect',
    ),
    "HEX raw": ok.replace('fill="var(--ink,#17324D)"', 'fill="#17324D"'),
    "HEX fallback": ok.replace("#17324D", "#7A3FF2"),
    A11Y: ok.replace(' aria-hidden="true"', ""),
    "A11Y (empty title)": ok
      .replace(' aria-hidden="true"', ' role="img"')
      .replace("<rect", "<title> </title><rect"),
    IDS: ok.replace("<rect", '<g id="a"/><g id="a"/><rect'),
    "IDS (url)": ok.replace("<rect", '<rect fill="url(#nope)"/><rect'),
  };
  for (const [name, svg] of Object.entries(bad)) {
    const errs = checkSvg(name, svg, { palette });
    assert.ok(errs.length > 0, `detector ${name} did not fire on its known-bad fixture`);
    assert.ok(
      errs.some((e) => e.startsWith(name.split(" ")[0])),
      `detector ${name} fired as ${errs.join(" | ")}`,
    );
  }
  assert.ok(
    checkSvg(
      "scene",
      ok.replace(' aria-hidden="true"', ' role="img"').replace("<rect", "<title>t</title><rect"),
      { palette, scene: true },
    ).some((e) => e.startsWith("A11Y")),
    "a titled scene must fail",
  );
  assert.ok(sweep([]).failures.length > 0, "a sweep of zero files must fail");
  assert.ok(isForbiddenHue(parseColor("#7A3FF2")), "the hue detector must flag violet");
}

// ---------------------------------------------------------------------------------------------------- the sweep
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

function main() {
  const palette = loadPalette();
  selfTest(palette);
  const files = walk(ART).filter((f) => f.endsWith(".svg"));
  const docs = files.map((f) => {
    const rel = relative(ART, f);
    const sprite = rel === "icons.svg" || rel === "celebration.svg";
    return {
      name: rel,
      svg: readFileSync(f, "utf8"),
      opts: {
        cap: sprite ? CAP.sprite : rel.startsWith("brand/og/") ? CAP.og : CAP.default,
        scene: rel.startsWith("scenes/"),
      },
    };
  });
  for (const kind of HOOK_KINDS)
    for (const lang of ["en", "es"])
      docs.push({
        name: `hook:${kind}:${lang}`,
        svg: renderHookCard(kind, sampleSlots(kind, lang), { lang }),
        opts: {},
      });
  for (const s of SAMPLES)
    for (const lang of ["en", "es"])
      docs.push({ name: `model:${s.id}:${lang}`, svg: renderModel(s, { lang }), opts: {} });
  const { failures, checked } = sweep(docs, { palette });

  // counts, README and unit accents
  const count = (dir) => files.filter((f) => relative(ART, f).startsWith(`${dir}/`)).length;
  const sprite = readFileSync(join(ART, "icons.svg"), "utf8");
  const ids = [...sprite.matchAll(/<symbol id="(fi-[a-z0-9-]+)"/g)].map((m) => m[1]);
  const base = ids.filter((i) => !i.endsWith("-fill"));
  if (new Set(ids).size !== ids.length) failures.push("icons.svg: duplicate symbol id");
  if (base.length < FLOORS.icons)
    failures.push(`icons.svg: ${base.length} icons < floor ${FLOORS.icons}`);
  if (count("scenes") !== FLOORS.scenes)
    failures.push(`scenes: ${count("scenes")} != ${FLOORS.scenes} (one per unit)`);
  if (count("spots") < FLOORS.spots)
    failures.push(`spots: ${count("spots")} < floor ${FLOORS.spots}`);
  if (count("hooks") !== FLOORS.hooks) failures.push(`hooks: ${count("hooks")} != ${FLOORS.hooks}`);
  const readme = readFileSync(join(ART, "README.md"), "utf8");
  const documented = [...readme.matchAll(/`(fi-[a-z0-9-]+)`/g)].map((m) => m[1]);
  for (const id of documented)
    if (!ids.includes(id)) failures.push(`README documents ${id}, which is not in icons.svg`);
  for (const id of ids)
    if (!documented.includes(id))
      failures.push(`icons.svg has ${id}, which the README does not list`);
  for (const m of readme.matchAll(/`((?:scenes|spots)\/[a-z0-9-]+\.svg)`/g))
    if (!files.includes(join(ART, m[1])))
      failures.push(`README lists ${m[1]}, which does not exist`);
  for (const u of JSON.parse(readFileSync(join(ART, "units.json"), "utf8"))) {
    for (const k of ["accent", "tint", "tintDark"])
      if (isForbiddenHue(parseColor(u[k])))
        failures.push(`units.json: unit ${u.unit} ${k} ${u[k]} is in the violet/magenta band`);
    const { l } = toHsl(parseColor(u.accent));
    if (l < 0.25 || l > 0.8)
      failures.push(
        `units.json: unit ${u.unit} accent ${u.accent} is too dark or too light to read as an accent`,
      );
  }
  for (const f of ["LICENSE-NOTES.md", "art.css", "brand/manifest.webmanifest"])
    if (!statSync(join(ART, f), { throwIfNoEntry: false })) failures.push(`${f} is missing`);

  // generated files are fresh
  try {
    execFileSync(process.execPath, [join(ROOT, "tools/build-family-art.mjs"), "--check"], {
      stdio: "pipe",
    });
  } catch (e) {
    failures.push(
      `generated art is stale: ${String(e.stderr || e.message)
        .trim()
        .split("\n")
        .slice(0, 3)
        .join(" / ")}`,
    );
  }

  if (failures.length) {
    console.error(`FAIL validate:family-art (${failures.length} problems in ${checked} documents)`);
    for (const f of failures.slice(0, 60)) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(
    `PASS validate:family-art (${checked} SVG documents, ${base.length} icons + ${ids.length - base.length} filled, ${count("scenes")} scenes, ${count("spots")} spots, ${count("hooks")} hook cards; detectors self-tested)`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
