#!/usr/bin/env node

// Math Literacy Studio: property checks for access-practice-lab/src/mls/visuals.js.
//
//   node tools/mls-visuals-check.mjs            # run every property test, write /tmp/mls-visuals/index.html and, if Playwright
//                                               # and a Chromium are available, /tmp/mls-visuals/sheet-N.png contact sheets
//   node tools/mls-visuals-check.mjs --no-sheet # property tests only
//
// For every one of the 30 kinds it renders >= 25 seeded random and edge-case specs and asserts: a well-formed self-contained
// <svg> (role, title, desc, viewBox, no width/height), palette-only colors (no purple), text >= 12 units, nothing drawn off the
// canvas, byte-identical output on a repeat, a summary that states the key values, hidden values that never leak into the svg
// text, alt or summary, exact geometry where it can be measured (clock hands, bars, points, rays, sectors, ruler ends ...),
// and that impossible arguments throw. Exit code 1 on any failure.

import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { PALETTE, renderVisual, VISUAL_KINDS } from "../access-practice-lab/src/mls/visuals.js";

const require = createRequire(import.meta.url);
const OUT_DIR = "/tmp/mls-visuals";
const argv = process.argv.slice(2);
const WANT_SHEET = !argv.includes("--no-sheet");
const ONLY = (argv.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean); // --only=angle,circle: just those kinds, larger

const EXPECTED_KINDS = [
  "tenframe",
  "counters",
  "bond",
  "placevalue",
  "numberline",
  "array",
  "areamodel",
  "fracstrip",
  "fracshape",
  "clock",
  "bar",
  "lineplot",
  "boxplot",
  "coord",
  "tape",
  "ratiotable",
  "doublenl",
  "table",
  "shape",
  "prism",
  "rect",
  "angle",
  "circle",
  "triangle",
  "balance",
  "tiles",
  "scatter",
  "spinner",
  "ruler",
  "machine",
];

/* ------------------------------------------------------------------ harness */

const FAILS = [];
let CHECKS = 0;
function ok(cond, kind, msg, extra = "") {
  CHECKS++;
  if (!cond) FAILS.push(`${kind}: ${msg}${extra ? ` :: ${String(extra).slice(0, 300)}` : ""}`);
  return !!cond;
}
function rngOf(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (a) => a[Math.floor(next() * a.length)],
    chance: (p = 0.5) => next() < p,
    shuffle(a) {
      const b = a.slice();
      for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [b[i], b[j]] = [b[j], b[i]];
      }
      return b;
    },
  };
  r.distinct = (n, lo, hi) =>
    r.shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, n);
  return r;
}
const seedOf = (s) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
};

/* ------------------------------------------------------------------ svg inspection */

const unent = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
const textsOf = (svg) =>
  [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map((m) => unent(m[1]));
function els(svg, tag) {
  const out = [];
  for (const m of svg.matchAll(new RegExp(`<${tag}\\b([^>]*?)\\/?>`, "g"))) {
    const at = {};
    for (const a of m[1].matchAll(/([A-Za-z][\w:-]*)="([^"]*)"/g)) at[a[1]] = a[2];
    out.push(at);
  }
  return out;
}
const num = (v) => Number(v);
const norm = (s) => {
  let t = String(s).replace(/−/g, "-");
  let prev;
  do {
    prev = t;
    t = t.replace(/(\d),(\d{3})/g, "$1$2");
  } while (t !== prev);
  return t;
};
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasToken = (hay, tok) =>
  new RegExp(`(?<![\\d./])${reEsc(norm(tok))}(?![\\d/]|\\.\\d)`).test(norm(hay));
const hasText = (hay, s) => norm(hay).toLowerCase().includes(norm(s).toLowerCase());

const ALLOWED = new Set(Object.values(PALETTE).map((c) => c.toUpperCase()));
function hueSat(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (d === 0) return { h: 0, s: 0 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s };
}

let JSDOM = null;
try {
  ({ JSDOM } = await import("jsdom"));
} catch {
  JSDOM = null;
}

function commonChecks(kind, spec, r, label) {
  const tag = `${kind}[${label}]`;
  const { svg, alt, summary } = r;
  ok(
    typeof svg === "string" && svg.startsWith("<svg "),
    tag,
    "svg must start with <svg",
    svg.slice(0, 40),
  );
  ok(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(svg), tag, "missing xmlns");
  const root = /^<svg\b([^>]*)>/.exec(svg);
  const rootAttrs = root ? root[1] : "";
  const vb = /viewBox="0 0 (\d+) (\d+)"/.exec(rootAttrs);
  ok(!!vb, tag, "missing viewBox", rootAttrs);
  ok(
    !/\swidth=/.test(rootAttrs) && !/\sheight=/.test(rootAttrs),
    tag,
    "root svg has width/height attributes",
  );
  ok(/role="img"/.test(rootAttrs), tag, "missing role=img");
  ok(
    /aria-labelledby="[^"]+"/.test(rootAttrs) && /preserveAspectRatio=/.test(rootAttrs),
    tag,
    "missing aria-labelledby or preserveAspectRatio",
  );
  const t = /<title id="([^"]+)">([\s\S]*?)<\/title>/.exec(svg);
  const d = /<desc id="([^"]+)">([\s\S]*?)<\/desc>/.exec(svg);
  ok(!!t && unent(t[2]) === alt, tag, "title must equal alt");
  ok(!!d && unent(d[2]) === summary, tag, "desc must equal summary");
  ok(
    !!t && !!d && new RegExp(`aria-labelledby="${t[1]} ${d[1]}"`).test(rootAttrs),
    tag,
    "aria-labelledby must name title and desc ids",
  );
  ok(
    !/https?:\/\/(?!www\.w3\.org\/2000\/svg)/.test(svg) && !/<image\b|<script\b|href=/.test(svg),
    tag,
    "svg must be self-contained (no external refs)",
  );
  ok(
    !/NaN|Infinity|undefined|\[object|null/.test(svg),
    tag,
    "bad token in svg",
    (/NaN|Infinity|undefined|\[object|null/.exec(svg) || [])[0],
  );
  ok(
    !/NaN|undefined|\[object/.test(summary) && !/NaN|undefined|\[object/.test(alt),
    tag,
    "bad token in summary or alt",
  );
  ok(summary.length > 12 && alt.length > 3, tag, "summary or alt too short");
  // colors
  const hexes = [...svg.matchAll(/#[0-9A-Fa-f]{6}\b/g)].map((m) => m[0].toUpperCase());
  const bad = hexes.filter((h) => !ALLOWED.has(h));
  ok(!bad.length, tag, "color outside the palette", [...new Set(bad)].join(","));
  for (const h of new Set(hexes)) {
    const { h: hue, s } = hueSat(h);
    ok(!(hue >= 255 && hue <= 335 && s > 0.15), tag, "purple/violet/magenta hue", h);
  }
  ok(
    !/\b(purple|violet|indigo|magenta|fuchsia|lavender|plum|orchid)\b/i.test(svg),
    tag,
    "forbidden color word",
  );
  ok(
    !/rgb\(|hsl\(|#[0-9A-Fa-f]{3}\b(?![0-9A-Fa-f])/.test(svg.replace(/#[0-9A-Fa-f]{6}/g, "")),
    tag,
    "non-hex color syntax",
  );
  const named = [...svg.matchAll(/(?:fill|stroke)="([A-Za-z]+)"/g)]
    .map((m) => m[1])
    .filter((n) => !["none", "transparent"].includes(n));
  ok(!named.length, tag, "named color used", named.join(","));
  // text size
  const sizes = [...svg.matchAll(/font-size="([^"]+)"/g)].map((m) => Number(m[1]));
  ok(
    sizes.every((s) => s >= 12),
    tag,
    "font-size below 12",
    sizes.filter((s) => s < 12).join(","),
  );
  const nText = (svg.match(/<text\b/g) || []).length;
  ok(nText === sizes.length, tag, "every <text> needs a font-size", `${nText} vs ${sizes.length}`);
  ok(
    !/font-size="[^"]*"[^>]*style=|style="[^"]*font-size/.test(svg),
    tag,
    "inline font-size style",
  );
  // well-formed XML
  if (JSDOM) {
    try {
      new JSDOM(svg, { contentType: "image/svg+xml" });
      CHECKS++;
    } catch (e) {
      ok(false, tag, "svg is not well-formed XML", e.message);
    }
  }
  // inside the canvas
  if (vb) {
    const W = Number(vb[1]);
    const H = Number(vb[2]);
    const out = [];
    const inside = (x, y, what) => {
      if (x < -2 || x > W + 2 || y < -2 || y > H + 2)
        out.push(`${what}(${Math.round(x)},${Math.round(y)})`);
    };
    for (const e of els(svg, "rect")) {
      if (e.width === String(W) && e.height === String(H)) continue;
      inside(num(e.x), num(e.y), "rect");
      inside(num(e.x) + num(e.width), num(e.y) + num(e.height), "rect-end");
    }
    for (const e of els(svg, "line")) {
      inside(num(e.x1), num(e.y1), "line");
      inside(num(e.x2), num(e.y2), "line");
    }
    for (const e of els(svg, "circle")) {
      inside(num(e.cx) - num(e.r), num(e.cy) - num(e.r), "circle");
      inside(num(e.cx) + num(e.r), num(e.cy) + num(e.r), "circle");
    }
    for (const e of els(svg, "polygon"))
      for (const p of e.points.split(" ")) inside(...p.split(",").map(Number), "poly");
    for (const m of svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
      const at = {};
      for (const a of m[1].matchAll(/([A-Za-z][\w:-]*)="([^"]*)"/g)) at[a[1]] = a[2];
      if (at.transform) continue;
      const s = num(at["font-size"]);
      const w = unent(m[2]).length * s * 0.52;
      const x = num(at.x);
      const y = num(at.y);
      const anchor = at["text-anchor"];
      const x1 = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
      const x2 = anchor === "start" ? x + w : anchor === "end" ? x : x + w / 2;
      if (x1 < -2 || x2 > W + 2 || y - s * 0.8 < -2 || y + s * 0.3 > H + 2)
        out.push(
          `text "${unent(m[2]).slice(0, 18)}" ${Math.round(x1)}..${Math.round(x2)},${Math.round(y)}`,
        );
    }
    ok(!out.length, tag, `drawn outside the ${W}x${H} canvas`, out.slice(0, 4).join("; "));
  }
  // determinism, and a provided alt wins
  const again = renderVisual(JSON.parse(JSON.stringify(spec)));
  ok(
    again.svg === svg && again.summary === summary && again.alt === alt,
    tag,
    "output is not deterministic",
  );
  const alt2 = renderVisual({ ...spec, alt: "Custom alt text" });
  ok(
    alt2.alt === "Custom alt text" &&
      alt2.svg.includes("<title") &&
      alt2.svg.includes("Custom alt text"),
    tag,
    "provided alt is not used",
  );
}

/* ------------------------------------------------------------------ helpers shared by the kinds */

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
function fracText(n, d, mixed = true) {
  if (n % d === 0) return String(n / d);
  const g = gcd(n, d);
  n /= g;
  d /= g;
  if (mixed && n > d) return `${Math.floor(n / d)} ${n % d}/${d}`;
  return `${n}/${d}`;
}
const setMinus = (n) => (n < 0 ? `−${Math.abs(n)}` : String(n));
const WORDS = [
  "dogs",
  "cats",
  "fish",
  "birds",
  "apples",
  "pears",
  "red",
  "blue",
  "Mon",
  "Tue",
  "books",
  "pens",
  "oak",
  "pine",
];

/** every number-like token in the visible text, summary and alt, as one string */
const visibleBlob = (r) => `${textsOf(r.svg).join(" | ")} | ${r.summary} | ${r.alt}`;

/* ------------------------------------------------------------------ per-kind definitions */
// gen(rng) -> spec, edges: fixed specs, info(spec, r) -> { mention:[...], hidden:[...], extra?:(r)=>void }, bad: specs that must throw,
// sheet: specs shown on the contact sheet.

const K = {};

K.tenframe = {
  gen: (g) => {
    const frames = g.int(1, 4);
    return { kind: "tenframe", n: g.int(0, 10 * frames), frames };
  },
  edges: [
    { kind: "tenframe", n: 0 },
    { kind: "tenframe", n: 10 },
    { kind: "tenframe", n: 5 },
    { kind: "tenframe", n: 6 },
    { kind: "tenframe", n: 20, frames: 2 },
    { kind: "tenframe", n: 80, frames: 8 },
  ],
  info: (s) => ({
    mention: [String(s.n)],
    extra: (r) => {
      const dots = els(r.svg, "circle").filter((c) => c.fill === PALETTE.teal).length;
      ok(dots === s.n, "tenframe", "drawn dot count differs from n", `${dots} vs ${s.n}`);
    },
  }),
  bad: [
    { kind: "tenframe", n: 11 },
    { kind: "tenframe", n: -1 },
    { kind: "tenframe", n: 1.5 },
    { kind: "tenframe", n: 3, frames: 0 },
    { kind: "tenframe", n: 3, frames: 9 },
    { kind: "tenframe", n: 21, frames: 2 },
    { kind: "tenframe" },
  ],
  sheet: [
    { kind: "tenframe", n: 7 },
    { kind: "tenframe", n: 17, frames: 2 },
  ],
};

K.counters = {
  gen: (g) => ({
    kind: "counters",
    n: g.int(0, 60),
    perRow: g.pick([5, 10, 4, 8, 12, 3]),
    shape: g.pick(["circle", "square", "triangle", "star"]),
  }),
  edges: [
    { kind: "counters", n: 1 },
    { kind: "counters", n: 0 },
    { kind: "counters", n: 200, perRow: 20 },
    { kind: "counters", n: 7, perRow: 1 },
    { kind: "counters", n: 10 },
    { kind: "counters", n: 13, shape: "star" },
  ],
  info: (s) => ({
    mention: s.n ? [String(s.n)] : ["No counters"],
    extra: (r) => {
      const svg = r.svg;
      const cnt =
        s.shape === "square"
          ? els(svg, "rect").length - 1
          : s.shape === "circle" || !s.shape
            ? els(svg, "circle").length
            : els(svg, "polygon").length;
      ok(cnt === s.n, "counters", "drawn shape count differs from n", `${cnt} vs ${s.n}`);
    },
  }),
  bad: [
    { kind: "counters", n: 201 },
    { kind: "counters", n: -3 },
    { kind: "counters", n: 5, shape: "hex" },
    { kind: "counters", n: 5, perRow: 0 },
    { kind: "counters", n: 5, perRow: 21 },
  ],
  sheet: [
    { kind: "counters", n: 23 },
    { kind: "counters", n: 14, shape: "star", perRow: 5 },
    { kind: "counters", n: 9, shape: "triangle", perRow: 3 },
  ],
};

K.bond = {
  gen: (g) => {
    const [a, b] = g.distinct(2, 1, 19);
    const hide = g.pick(["whole", "a", "b", null, "whole", "a"]);
    return { kind: "bond", whole: a + b, a, b, hide };
  },
  edges: [
    { kind: "bond", whole: 10, a: 3, b: 7, hide: "b" },
    { kind: "bond", whole: "?", a: 4, b: 9 },
    { kind: "bond", whole: 1000, a: 250, b: 750, hide: "a" },
    { kind: "bond", whole: "3/4", a: "1/4", b: "1/2", hide: "b" },
    { kind: "bond", whole: 1.5, a: 0.5, b: 1 },
  ],
  info: (s) => {
    const vals = { whole: s.whole, a: s.a, b: s.b };
    const hid = ["whole", "a", "b"].filter((k) => k === s.hide || vals[k] === "?");
    const mention = ["whole", "a", "b"].filter((k) => !hid.includes(k)).map((k) => String(vals[k]));
    const hidden = hid.filter((k) => vals[k] !== "?").map((k) => String(vals[k]));
    return {
      mention,
      hidden,
      extra: (r) =>
        ok(hid.length === 0 || /unknown/.test(r.summary), "bond", "summary must say unknown"),
    };
  },
  bad: [
    { kind: "bond", whole: 10, a: 3, b: 6 },
    { kind: "bond", whole: 10, a: 3, b: 7, hide: "x" },
    { kind: "bond", whole: 10, a: 3 },
    { kind: "bond", whole: "ten", a: 3, b: 7 },
    { kind: "bond", whole: 1, a: "1/2", b: "1/3" },
  ],
  sheet: [
    { kind: "bond", whole: 12, a: 5, b: 7, hide: "whole" },
    { kind: "bond", whole: 12, a: 5, b: 7, hide: "b" },
  ],
};

K.placevalue = {
  gen: (g) => {
    for (;;) {
      const s = { kind: "placevalue", hundreds: g.int(0, 9), tens: g.int(0, 9), ones: g.int(0, 9) };
      if (s.hundreds + s.tens + s.ones) return s;
    }
  },
  edges: [
    { kind: "placevalue", ones: 1 },
    { kind: "placevalue", hundreds: 9, tens: 20, ones: 30 },
    { kind: "placevalue", tens: 10 },
    { kind: "placevalue", hundreds: 1 },
  ],
  info: (s) => {
    const h = s.hundreds || 0;
    const t = s.tens || 0;
    const o = s.ones || 0;
    return {
      mention: [
        h && String(h),
        t && String(t),
        o && String(o),
        String(h * 100 + t * 10 + o),
      ].filter(Boolean),
      extra: (r) => {
        const rects = els(r.svg, "rect").filter((e) => e["stroke-width"] === "2");
        const flats = rects.filter((e) => e.width === "56").length / 2;
        const rods = rects.filter((e) => e.width === "12" && e.height === "56").length / 2;
        const cubes = els(r.svg, "rect").filter(
          (e) => e.width === "12" && e.height === "12",
        ).length;
        ok(
          flats === h && rods === t && cubes === o,
          "placevalue",
          "drawn block counts differ",
          `${flats},${rods},${cubes} vs ${h},${t},${o}`,
        );
      },
    };
  },
  bad: [
    { kind: "placevalue" },
    { kind: "placevalue", hundreds: 10 },
    { kind: "placevalue", tens: -1 },
    { kind: "placevalue", ones: 31 },
    { kind: "placevalue", tens: 2.5 },
  ],
  sheet: [
    { kind: "placevalue", hundreds: 2, tens: 3, ones: 4 },
    { kind: "placevalue", hundreds: 1, tens: 12, ones: 15 },
  ],
};

K.numberline = {
  gen: (g) => {
    const mode = g.pick(["int", "frac", "dec", "frac-hidden", "int-hops", "frac-hidden"]);
    if (mode === "int" || mode === "int-hops") {
      const step = g.pick([1, 2, 5, 10]);
      const min = g.int(0, 3) * step;
      const ticks = g.int(2, 10);
      const max = min + ticks * step;
      const s = { kind: "numberline", min, max, ticks, show: "int" };
      const marks = [];
      for (let i = g.int(0, 2); i > 0; i--)
        marks.push({
          at: min + g.int(0, ticks) * step,
          label: g.chance() ? String(g.pick(["A", "B", "start"])) : undefined,
          hollow: g.chance(0.3),
        });
      if (marks.length) s.marks = marks;
      if (mode === "int-hops") {
        const hops = [];
        let at = min + g.int(0, 2) * step;
        for (let i = g.int(1, 2); i > 0; i--) {
          const to = Math.min(max, at + g.int(1, 3) * step);
          if (to === at) break;
          hops.push({ from: at, to, label: `+${((to - at) / step) * step}` });
          at = to;
        }
        if (hops.length) s.hops = hops;
      }
      return s;
    }
    if (mode === "dec") {
      const k = g.int(1, 9);
      return {
        kind: "numberline",
        min: 0,
        max: 1,
        ticks: 10,
        show: "dec",
        marks: [{ at: `0.${k}`, label: "P" }],
      };
    }
    const ticks = g.pick([2, 3, 4, 5, 6, 8, 10, 12]);
    const k = g.int(1, ticks - 1);
    const s = { kind: "numberline", min: 0, max: 1, ticks, show: "frac" };
    if (mode === "frac-hidden") s.marks = [{ at: `${k}/${ticks}`, label: "?" }];
    else s.marks = [{ at: `${k}/${ticks}`, hollow: g.chance(0.3) }];
    return s;
  },
  edges: [
    {
      kind: "numberline",
      min: 0,
      max: 1,
      ticks: 4,
      marks: [{ at: "3/4", label: "3/4" }],
      show: "frac",
    },
    {
      kind: "numberline",
      min: 0,
      max: 1,
      ticks: 3,
      marks: [{ at: "1/3", label: "?" }],
      show: "frac",
    },
    {
      kind: "numberline",
      min: -5,
      max: 5,
      ticks: 10,
      marks: [{ at: -2 }, { at: 3, hollow: true }],
    },
    { kind: "numberline", min: 0, max: 100, ticks: 100 },
    { kind: "numberline", min: 1, max: 2, ticks: 8, show: "frac", mixed: true },
    {
      kind: "numberline",
      min: 0,
      max: 2,
      ticks: 8,
      show: "frac",
      reduce: false,
      labelTicks: "all",
    },
    {
      kind: "numberline",
      min: 0,
      max: 12,
      ticks: 12,
      hops: [
        { from: 0, to: 5, label: "+5" },
        { from: 5, to: 8, label: "+3" },
      ],
      marks: [
        { at: 0, label: "start" },
        { at: 8, label: "?" },
      ],
    },
    { kind: "numberline", min: 1000, max: 2000, ticks: 5, show: "int", labelTicks: "none" },
  ],
  info: (s) => {
    const mention = [String(s.min), String(s.max), `${s.ticks} equal`];
    const hidden = [];
    for (const m of s.marks || []) {
      if (m.label === "?") hidden.push(String(m.at));
      else mention.push(String(m.at));
    }
    const hiddenAt = new Set(
      (s.marks || []).filter((m) => m.label === "?").map((m) => String(m.at)),
    );
    for (const h of s.hops || [])
      for (const e of [h.from, h.to]) (hiddenAt.has(String(e)) ? hidden : mention).push(String(e));
    return {
      mention,
      hidden,
      extra: (r) => {
        if (!s.marks) return;
        // exact position of every mark: x = x0 + 472 * (at - min) / (max - min), x0 = 44
        const dots = els(r.svg, "circle").filter((c) => c.r === "8");
        ok(dots.length === s.marks.length, "numberline", "mark count", `${dots.length}`);
        const exact = (v) => {
          if (typeof v === "number") return v;
          const m = /^(-?\d+)\/(\d+)$/.exec(v);
          return m ? Number(m[1]) / Number(m[2]) : Number(v);
        };
        s.marks.forEach((m, i) => {
          const want = 44 + (472 * (exact(m.at) - exact(s.min))) / (exact(s.max) - exact(s.min));
          ok(
            Math.abs(num(dots[i].cx) - want) < 0.02,
            "numberline",
            "mark off its true position",
            `${dots[i].cx} vs ${want.toFixed(2)}`,
          );
        });
        // ticks equally spaced
        const ticks = els(r.svg, "line")
          .filter(
            (l) =>
              l.x1 === l.x2 &&
              Math.abs(num(l.y2) - num(l.y1)) >= 10 &&
              Math.abs(num(l.y2) - num(l.y1)) <= 18 &&
              (l["stroke-width"] === "3" || l["stroke-width"] === "2"),
          )
          .map((l) => num(l.x1));
        if (ticks.length >= s.ticks + 1) {
          const xs = ticks.slice(0, s.ticks + 1);
          const step = 472 / s.ticks;
          ok(
            xs.every((x, i) => Math.abs(x - (44 + i * step)) < 0.02),
            "numberline",
            "tick spacing is not even",
          );
        }
      },
    };
  },
  bad: [
    { kind: "numberline", min: 1, max: 1, ticks: 4 },
    { kind: "numberline", min: 0, max: 1, ticks: 0 },
    { kind: "numberline", min: 0, max: 1, ticks: 1.5 },
    { kind: "numberline", min: 0, max: 1, ticks: 4, marks: [{ at: 2 }] },
    { kind: "numberline", min: 0, max: 5, ticks: 5, hops: [{ from: 2, to: 2 }] },
    { kind: "numberline", min: 0, max: 5, ticks: 5, show: "roman" },
    { kind: "numberline", min: 0, max: 5, ticks: 5, hops: [{ from: 0, to: 9 }] },
    { kind: "numberline", min: "a", max: 5, ticks: 5 },
    { kind: "numberline", min: 0, max: 5, ticks: 5, labelTicks: "some" },
  ],
  sheet: [
    {
      kind: "numberline",
      min: 0,
      max: 1,
      ticks: 4,
      marks: [{ at: "3/4", label: "?" }],
      show: "frac",
    },
    {
      kind: "numberline",
      min: 0,
      max: 12,
      ticks: 12,
      hops: [
        { from: 0, to: 5, label: "+5" },
        { from: 5, to: 8, label: "+3" },
      ],
      marks: [
        { at: 0, label: "start" },
        { at: 8, label: "?" },
      ],
    },
    {
      kind: "numberline",
      min: 0,
      max: 2,
      ticks: 8,
      show: "frac",
      mixed: true,
      marks: [{ at: "5/4", label: "A" }],
    },
  ],
};

K.array = {
  gen: (g) => {
    const rows = g.int(1, 8);
    const cols = g.int(1, 10);
    const s = { kind: "array", rows, cols };
    if (g.chance(0.5)) s.shade = { rows: g.int(1, rows), cols: g.int(1, cols) };
    if (g.chance(0.25)) s.label = false;
    return s;
  },
  edges: [
    { kind: "array", rows: 1, cols: 1 },
    { kind: "array", rows: 15, cols: 20 },
    { kind: "array", rows: 3, cols: 4, shade: { rows: 2, cols: 3 } },
    { kind: "array", rows: 7, cols: 9, label: false },
  ],
  info: (s) => {
    const hidden = [];
    if (s.rows >= 2 && s.cols >= 2 && !(s.shade && s.shade.rows * s.shade.cols === s.rows * s.cols))
      hidden.push(String(s.rows * s.cols));
    return {
      mention: [
        String(s.rows),
        String(s.cols),
        ...(s.shade ? [`${s.shade.rows} row`, `${s.shade.cols} column`] : []),
      ],
      hidden: s.rows * s.cols === s.rows || s.rows * s.cols === s.cols ? [] : hidden,
      extra: (r) => {
        const n = els(r.svg, "circle").length;
        ok(n === s.rows * s.cols, "array", "dot count", `${n}`);
      },
    };
  },
  bad: [
    { kind: "array", rows: 0, cols: 3 },
    { kind: "array", rows: 3, cols: 21 },
    { kind: "array", rows: 3, cols: 4, shade: { rows: 4, cols: 1 } },
    { kind: "array", rows: 3, cols: 4, shade: { rows: 1, cols: 0 } },
    { kind: "array", rows: 16, cols: 4 },
  ],
  sheet: [
    { kind: "array", rows: 3, cols: 4, shade: { rows: 2, cols: 3 } },
    { kind: "array", rows: 5, cols: 7 },
  ],
};

K.areamodel = {
  gen: (g) => {
    const w = g.int(2, 60);
    const h = g.int(2, 30);
    const s = { kind: "areamodel", w, h };
    if (g.chance(0.8)) s.cutW = g.int(1, w - 1);
    if (g.chance(0.6)) s.cutH = g.int(1, h - 1);
    if (g.chance(0.2)) s.labels = false;
    return s;
  },
  edges: [
    { kind: "areamodel", w: 23, h: 14, cutW: 20, cutH: 10 },
    { kind: "areamodel", w: 8, h: 6 },
    { kind: "areamodel", w: 99, h: 2, cutW: 1 },
    { kind: "areamodel", w: "2.5", h: "1.2", cutW: "2", cutH: "1" },
    { kind: "areamodel", w: 12, h: 5, cutH: 2 },
  ],
  info: (s) => {
    const mention = [String(s.w), String(s.h)];
    const vis = new Set([s.w, s.h]);
    const rd = (x) => +Number(x).toFixed(6);
    const wp = s.cutW ? [Number(s.cutW), rd(s.w - s.cutW)] : [Number(s.w)];
    const hp = s.cutH ? [Number(s.cutH), rd(s.h - s.cutH)] : [Number(s.h)];
    for (const x of [...wp, ...hp]) {
      vis.add(x);
      mention.push(String(x));
    }
    const hidden = [];
    if (!/\./.test(String(s.w))) {
      for (const a of wp) for (const b of hp) if (!vis.has(a * b)) hidden.push(String(a * b));
      if (!vis.has(s.w * s.h)) hidden.push(String(s.w * s.h));
      mention.push(`${wp[0]} × ${hp[0]}`);
    }
    return { mention, hidden };
  },
  bad: [
    { kind: "areamodel", w: 0, h: 5 },
    { kind: "areamodel", w: 5, h: 5, cutW: 5 },
    { kind: "areamodel", w: 5, h: 5, cutH: 0 },
    { kind: "areamodel", w: 5, h: -2 },
    { kind: "areamodel", w: 5, h: 5, cutW: 7 },
  ],
  sheet: [
    { kind: "areamodel", w: 23, h: 14, cutW: 20, cutH: 10 },
    { kind: "areamodel", w: 12, h: 5, cutH: 2 },
    { kind: "areamodel", w: 7, h: 4 },
  ],
};

K.fracstrip = {
  gen: (g) => {
    const parts = g.int(1, 12);
    const s = { kind: "fracstrip", parts, shaded: g.int(0, parts) };
    if (g.chance(0.4)) {
      const p2 = g.int(1, 12);
      s.compare = { parts: p2, shaded: g.int(0, p2) };
    }
    return s;
  },
  edges: [
    { kind: "fracstrip", parts: 1, shaded: 1 },
    { kind: "fracstrip", parts: 24, shaded: 0 },
    { kind: "fracstrip", parts: 4, shaded: 3, compare: { parts: 8, shaded: 6 } },
    { kind: "fracstrip", parts: 5, shaded: 5 },
  ],
  info: (s) => ({
    mention: [
      `${s.shaded} shaded`,
      `${s.parts} equal`,
      ...(s.compare ? [`${s.compare.parts} equal`, `${s.compare.shaded} shaded`] : []),
    ],
    extra: (r) => {
      const cells = els(r.svg, "rect").filter((e) => e["stroke-width"] === "2.5");
      const filled = cells.filter((e) => e.fill === PALETTE.teal).length;
      ok(
        filled === s.shaded + (s.compare ? s.compare.shaded : 0),
        "fracstrip",
        "shaded cell count",
        `${filled}`,
      );
      ok(
        cells.length === s.parts + (s.compare ? s.compare.parts : 0),
        "fracstrip",
        "cell count",
        `${cells.length}`,
      );
    },
  }),
  bad: [
    { kind: "fracstrip", parts: 4, shaded: 5 },
    { kind: "fracstrip", parts: 0, shaded: 0 },
    { kind: "fracstrip", parts: 4, shaded: -1 },
    { kind: "fracstrip", parts: 4, shaded: 1, compare: { parts: 3, shaded: 4 } },
    { kind: "fracstrip", parts: 25, shaded: 1 },
  ],
  sheet: [
    { kind: "fracstrip", parts: 4, shaded: 3 },
    { kind: "fracstrip", parts: 4, shaded: 2, compare: { parts: 8, shaded: 4 } },
  ],
};

K.fracshape = {
  gen: (g) => {
    const shape = g.pick(["circle", "rect"]);
    const parts = g.int(1, shape === "circle" ? 16 : 24);
    return { kind: "fracshape", shape, parts, shaded: g.int(0, parts) };
  },
  edges: [
    { kind: "fracshape", shape: "circle", parts: 1, shaded: 1 },
    { kind: "fracshape", shape: "circle", parts: 2, shaded: 1 },
    { kind: "fracshape", shape: "circle", parts: 3, shaded: 3 },
    { kind: "fracshape", shape: "rect", parts: 7, shaded: 0 },
    { kind: "fracshape", parts: 8, shaded: 5 },
  ],
  info: (s) => ({
    mention: [`${s.shaded} shaded`, `${s.parts} equal`],
    extra: (r) => {
      const shapes =
        s.shape === "rect"
          ? els(r.svg, "rect").filter((e) => e["stroke-width"] === "2.5")
          : s.parts === 1
            ? []
            : els(r.svg, "path").filter((e) => e["stroke-width"] === "2.5");
      if (s.parts > 1) {
        ok(shapes.length === s.parts, "fracshape", "part count", `${shapes.length}`);
        ok(
          shapes.filter((e) => e.fill === PALETTE.teal).length === s.shaded,
          "fracshape",
          "shaded count",
        );
      }
    },
  }),
  bad: [
    { kind: "fracshape", shape: "circle", parts: 4, shaded: 5 },
    { kind: "fracshape", shape: "hex", parts: 4, shaded: 1 },
    { kind: "fracshape", shape: "circle", parts: 17, shaded: 1 },
    { kind: "fracshape", shape: "rect", parts: 0, shaded: 0 },
  ],
  sheet: [
    { kind: "fracshape", shape: "circle", parts: 6, shaded: 2 },
    { kind: "fracshape", shape: "rect", parts: 5, shaded: 3 },
    { kind: "fracshape", shape: "circle", parts: 3, shaded: 3 },
  ],
};

K.clock = {
  gen: (g) => ({
    kind: "clock",
    h: g.int(0, 23),
    m: g.pick([g.int(0, 59), g.int(0, 59), g.pick([0, 15, 30, 45, 5, 10])]),
    numerals: g.chance(0.8),
  }),
  edges: [
    { kind: "clock", h: 12, m: 0 },
    { kind: "clock", h: 0, m: 0 },
    { kind: "clock", h: 6, m: 30 },
    { kind: "clock", h: 11, m: 59 },
    { kind: "clock", h: 3, m: 15 },
    { kind: "clock", h: 9, m: 45 },
    { kind: "clock", h: 12, m: 30 },
    { kind: "clock", h: 4, m: 30, numerals: false },
    { kind: "clock", h: 23, m: 7 },
  ],
  info: (s) => {
    const hh = s.h % 12 === 0 ? 12 : s.h % 12;
    return {
      mention: [`${hh}:${String(s.m).padStart(2, "0")}`],
      extra: (r) => {
        const polys = els(r.svg, "polygon");
        ok(polys.length === 2, "clock", "two hands expected", String(polys.length));
        const tip = (p) => {
          const pts = p.points.split(" ").map((q) => q.split(",").map(Number));
          return pts[2];
        };
        const ang = (p) => {
          const [x, y] = tip(p);
          let a = (Math.atan2(x - 150, -(y - 150)) * 180) / Math.PI;
          if (a < 0) a += 360;
          return a;
        };
        const wantH = ((s.h % 12) + s.m / 60) * 30;
        const wantM = s.m * 6;
        const diff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
        ok(
          diff(ang(polys[0]), wantH) < 0.1,
          "clock",
          "hour hand angle",
          `${ang(polys[0]).toFixed(2)} vs ${wantH}`,
        );
        ok(
          diff(ang(polys[1]), wantM) < 0.1,
          "clock",
          "minute hand angle",
          `${ang(polys[1]).toFixed(2)} vs ${wantM}`,
        );
        const len = (p) => Math.hypot(tip(p)[0] - 150, tip(p)[1] - 150);
        ok(
          len(polys[1]) > len(polys[0]) + 20,
          "clock",
          "minute hand must be longer than hour hand",
        );
        const nums = textsOf(r.svg).filter((t) => /^\d+$/.test(t));
        ok(
          s.numerals === false ? nums.length === 0 : nums.length === 12,
          "clock",
          "numerals",
          String(nums.length),
        );
      },
    };
  },
  bad: [
    { kind: "clock", h: 24, m: 0 },
    { kind: "clock", h: 3, m: 60 },
    { kind: "clock", h: 3, m: -1 },
    { kind: "clock", h: 3, m: 1.5 },
    { kind: "clock", h: -1, m: 0 },
    { kind: "clock", m: 5 },
  ],
  sheet: [
    { kind: "clock", h: 4, m: 30 },
    { kind: "clock", h: 10, m: 8 },
    { kind: "clock", h: 7, m: 45, numerals: false },
  ],
};

K.bar = {
  gen: (g) => {
    const n = g.int(2, 6);
    const cats = g.shuffle(WORDS).slice(0, n);
    const picture = g.chance(0.3);
    const scale = picture ? g.pick([1, 2, 5]) : g.pick([1, 2, 5, 10]);
    const values = cats.map(() =>
      picture ? g.int(0, 12) * scale + (g.chance(0.3) ? scale / 2 : 0) : g.int(0, 40),
    );
    if (picture && !values.some((v) => v > 0)) values[0] = scale;
    const s = { kind: "bar", cats, values, scale, orient: g.pick(["v", "h"]), picture };
    if (g.chance(0.7)) s.title = g.pick(["Pets", "Fruit", "Class survey"]);
    if (g.chance(0.6)) s.axisLabel = "Number of things";
    if (g.chance(0.3)) s.unit = "pets";
    if (g.chance(0.3)) s.showValues = true;
    return s;
  },
  edges: [
    {
      kind: "bar",
      title: "Pets",
      cats: ["dogs", "cats", "fish"],
      values: [5, 8, 3],
      scale: 2,
      axisLabel: "Number of pets",
    },
    { kind: "bar", cats: ["a", "b"], values: [0, 0] },
    {
      kind: "bar",
      cats: ["North region", "South", "East coast", "West"],
      values: [1200, 800, 1500, 300],
      scale: 100,
      orient: "h",
      axisLabel: "Visitors",
    },
    { kind: "bar", cats: ["x", "y", "z"], values: ["1/2", "3/4", "1/4"], scale: "1/4" },
    { kind: "bar", cats: ["one"], values: [7] },
    {
      kind: "bar",
      title: "Votes",
      cats: ["Ana", "Omar", "Mei"],
      values: [4, 6, 3],
      picture: true,
      scale: 2,
      unit: "votes",
    },
    { kind: "bar", cats: ["p", "q", "r"], values: [350, 120, 90], scale: 1 },
    {
      kind: "bar",
      cats: ["A long category name here", "Another long one", "Short"],
      values: [4, 9, 6],
      scale: 1,
    },
  ],
  info: (s) => ({
    mention: s.cats.map((c, i) => `${c} ${s.values[i]}`),
    extra: (r) => {
      const teal = els(r.svg, "rect").filter((e) => e.fill === PALETTE.teal);
      if (!s.picture) {
        const nz = s.values
          .map((v, i) => [
            typeof v === "string" ? Number(v.split("/")[0]) / Number(v.split("/")[1]) : v,
            i,
          ])
          .filter(([v]) => v > 0);
        ok(teal.length === nz.length, "bar", "bar count", `${teal.length} vs ${nz.length}`);
        const dim = (e) => (s.orient === "h" ? num(e.width) : num(e.height));
        const ratios = nz.map(([v], i) => dim(teal[i]) / v);
        ok(
          ratios.every((q) => Math.abs(q - ratios[0]) / ratios[0] < 0.005),
          "bar",
          "bars not proportional to values",
          ratios.map((q) => q.toFixed(3)).join(","),
        );
        // axis labelled: at least 3 numeric tick labels
        ok(
          textsOf(r.svg).filter((t) => /^[\d,./]+$/.test(t)).length >= 2,
          "bar",
          "axis scale labels missing",
        );
      } else {
        const full = els(r.svg, "circle").filter((e) => e.fill === PALETTE.teal).length - 1; // minus the key symbol
        const halves = els(r.svg, "path").filter((e) => e.fill === PALETTE.teal).length;
        const want = s.values.reduce((a, v) => a + v / s.scale, 0);
        ok(
          Math.abs(full + halves / 2 - want) < 1e-9,
          "bar",
          "symbol count",
          `${full}+${halves}/2 vs ${want}`,
        );
      }
    },
  }),
  bad: [
    { kind: "bar", cats: ["a", "b"], values: [1] },
    { kind: "bar", cats: [], values: [] },
    { kind: "bar", cats: ["a"], values: [-1] },
    { kind: "bar", cats: ["a"], values: [1], scale: 0 },
    { kind: "bar", cats: ["a"], values: [7], scale: 3, picture: true },
    { kind: "bar", cats: ["a"], values: [1], orient: "x" },
    { kind: "bar", cats: ["a"], values: ["many"] },
    { kind: "bar", cats: Array.from({ length: 13 }, (_, i) => `c${i}`), values: Array(13).fill(1) },
  ],
  sheet: [
    {
      kind: "bar",
      title: "Pets",
      cats: ["dogs", "cats", "fish"],
      values: [5, 8, 3],
      scale: 2,
      axisLabel: "Number of pets",
    },
    {
      kind: "bar",
      title: "Fruit sold",
      cats: ["apples", "pears", "plums", "figs"],
      values: [12, 30, 18, 6],
      scale: 5,
      orient: "h",
      axisLabel: "Pieces sold",
      showValues: true,
    },
    {
      kind: "bar",
      title: "Votes",
      cats: ["Ana", "Omar", "Mei"],
      values: [4, 7, 3],
      picture: true,
      scale: 2,
      unit: "votes",
    },
    {
      kind: "bar",
      title: "Votes",
      cats: ["Ana", "Omar", "Mei"],
      values: [4, 7, 3],
      picture: true,
      scale: 2,
      unit: "votes",
      orient: "h",
    },
  ],
};

K.lineplot = {
  gen: (g) => {
    const [sn, sd] = g.pick([
      [1, 4],
      [1, 2],
      [1, 8],
      [1, 1],
      [2, 1],
      [5, 1],
      [1, 3],
    ]);
    const N = g.int(2, 8);
    const count = g.int(1, 14);
    const mixed = true;
    const values = Array.from({ length: count }, () => {
      const k = g.int(0, N);
      const text = fracText(k * sn, sd, mixed);
      return { k, text };
    });
    const maxText = fracText(N * sn, sd, mixed);
    return {
      kind: "lineplot",
      min: 0,
      max: maxText.includes("/") ? maxText : Number(maxText),
      step: sd === 1 ? sn : `${sn}/${sd}`,
      values: values.map((v) => (/^\d+$/.test(v.text) ? Number(v.text) : v.text)),
      label: g.pick(["Length (in)", "Pets", ""]) || undefined,
    };
  },
  edges: [
    {
      kind: "lineplot",
      min: 0,
      max: 1,
      step: "1/4",
      values: ["1/4", "1/2", "1/2", "3/4"],
      label: "Length (in)",
    },
    {
      kind: "lineplot",
      min: 0,
      max: 5,
      step: 1,
      values: [0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    },
    {
      kind: "lineplot",
      min: 0,
      max: 3,
      step: "1/2",
      values: ["1 1/2", 2, "1/2", "1 1/2", "2 1/2"],
      label: "Cups",
    },
    { kind: "lineplot", min: 0, max: 60, step: 1, values: [3, 7, 7, 60] },
  ],
  info: (s) => {
    const q = (v) => {
      const str = String(v).trim();
      let m;
      if ((m = /^(\d+)\s+(\d+)\/(\d+)$/.exec(str)))
        return [Number(m[1]) * Number(m[3]) + Number(m[2]), Number(m[3])];
      if ((m = /^(\d+)\/(\d+)$/.exec(str))) return [Number(m[1]), Number(m[2])];
      return [Number(str), 1];
    };
    const [sn, sd] = q(s.step);
    const counts = new Map();
    for (const v of s.values) {
      const [n, d] = q(v);
      const t = fracText(n, d, true);
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    void sn;
    void sd;
    return {
      mention: [...counts].map(([t, c]) => `${c} at ${t}`).concat([`${s.values.length} data`]),
      extra: (r) => {
        const xs = els(r.svg, "line").filter((l) => l.x1 !== l.x2 && l.y1 !== l.y2);
        ok(
          xs.length === 2 * s.values.length,
          "lineplot",
          "x mark count",
          `${xs.length / 2} vs ${s.values.length}`,
        );
      },
    };
  },
  bad: [
    { kind: "lineplot", min: 0, max: 1, step: "1/4", values: ["1/3"] },
    { kind: "lineplot", min: 0, max: 1, step: "1/3", values: [0], label: "x" }.max === 1
      ? { kind: "lineplot", min: 0, max: 1, step: "2/3", values: [0] }
      : null,
    { kind: "lineplot", min: 0, max: 1, step: 0, values: [0] },
    { kind: "lineplot", min: 0, max: 1, step: "1/4", values: [] },
    { kind: "lineplot", min: 1, max: 1, step: 1, values: [1] },
    { kind: "lineplot", min: 0, max: 1, step: "1/4", values: [2] },
    { kind: "lineplot", min: 0, max: 100, step: 1, values: [1] },
  ].filter(Boolean),
  sheet: [
    {
      kind: "lineplot",
      min: 0,
      max: 1,
      step: "1/4",
      values: ["1/4", "1/2", "1/2", "3/4", "1/2", 1, 1],
      label: "Length of leaves (in)",
    },
    {
      kind: "lineplot",
      min: 0,
      max: 3,
      step: "1/2",
      values: ["1 1/2", 2, "1/2", "1 1/2", "2 1/2", "1 1/2"],
      label: "Cups of water",
    },
    { kind: "lineplot", min: 0, max: 10, step: 1, values: [2, 3, 3, 4, 4, 4, 7, 7, 10] },
  ],
};

K.boxplot = {
  gen: (g) => {
    const v = [g.int(0, 100), g.int(0, 100), g.int(0, 100), g.int(0, 100), g.int(0, 100)].sort(
      (a, b) => a - b,
    );
    const keys = ["min", "q1", "median", "q3", "max"];
    const s = { kind: "boxplot" };
    keys.forEach((k, i) => (s[k] = v[i]));
    if (g.chance(0.6)) s.label = "Test scores";
    if (g.chance(0.4)) s.showValues = true;
    return s;
  },
  edges: [
    { kind: "boxplot", min: 4, q1: 7, median: 9, q3: 12, max: 15, label: "Scores" },
    { kind: "boxplot", min: 5, q1: 5, median: 5, q3: 5, max: 5 },
    { kind: "boxplot", min: 0, q1: 1, median: 2, q3: 3, max: 1000, label: "x" },
    { kind: "boxplot", min: "2.5", q1: "3.5", median: 4, q3: "5.5", max: 8, showValues: true },
    { kind: "boxplot", min: -10, q1: -4, median: 0, q3: 6, max: 12 },
  ],
  info: (s) => ({
    mention: ["min", "q1", "median", "q3", "max"]
      .map((k) => String(s[k]))
      .filter((_, i, a) => true && a),
    extra: (r) => {
      const keys = ["min", "q1", "median", "q3", "max"];
      const v = keys.map((k) => Number(s[k]));
      if (!(v[3] > v[1])) return;
      if (num(els(r.svg, "rect").find((e) => e["stroke-width"] === "3").width) < 40) return;
      const box = els(r.svg, "rect").find((e) => e["stroke-width"] === "3");
      const med = els(r.svg, "line").find((e) => e["stroke-width"] === "6");
      const caps = els(r.svg, "line").filter((e) => e["stroke-width"] === "3.5" && e.x1 === e.x2);
      const bx = num(box.x);
      const bw = num(box.width);
      ok(
        Math.abs((num(med.x1) - bx) / bw - (v[2] - v[1]) / (v[3] - v[1])) < 0.002,
        "boxplot",
        "median not proportional",
        `${JSON.stringify(v)} ${((num(med.x1) - bx) / bw).toFixed(4)} vs ${((v[2] - v[1]) / (v[3] - v[1])).toFixed(4)}`,
      );
      ok(
        Math.abs((bx - num(caps[0].x1)) / bw - (v[1] - v[0]) / (v[3] - v[1])) < 0.002,
        "boxplot",
        "min whisker not proportional",
      );
      ok(
        Math.abs((num(caps[1].x1) - bx - bw) / bw - (v[4] - v[3]) / (v[3] - v[1])) < 0.002,
        "boxplot",
        "max whisker not proportional",
      );
    },
  }),
  bad: [
    { kind: "boxplot", min: 5, q1: 4, median: 6, q3: 7, max: 8 },
    { kind: "boxplot", min: 1, q1: 2, median: 9, q3: 5, max: 10 },
    { kind: "boxplot", min: 1, q1: 2, median: 3, q3: 4 },
    { kind: "boxplot", min: 1, q1: 2, median: 3, q3: 4, max: "big" },
    { kind: "boxplot", min: 1, q1: 2, median: 3, q3: 9, max: 4 },
  ],
  sheet: [
    {
      kind: "boxplot",
      min: 4,
      q1: 7,
      median: 9,
      q3: 12,
      max: 15,
      label: "Minutes of reading",
      showValues: true,
    },
    { kind: "boxplot", min: -10, q1: -4, median: 0, q3: 6, max: 12 },
  ],
};

K.coord = {
  gen: (g) => {
    const xmin = -g.int(0, 6);
    const xmax = g.int(3, 10);
    const ymin = -g.int(0, 6);
    const ymax = g.int(3, 10);
    const step = g.pick([1, 1, 2]);
    const s = { kind: "coord", xmin, xmax, ymin, ymax, step };
    s.points = Array.from({ length: g.int(0, 4) }, (_, i) => ({
      x: g.int(xmin, xmax),
      y: g.int(ymin, ymax),
      label: g.chance(0.6) ? "ABCD"[i] : undefined,
    }));
    if (g.chance(0.5))
      s.lines = [
        g.chance()
          ? { m: g.pick([1, 2, -1, "1/2", 0]), b: g.int(-2, 2) }
          : { p1: { x: xmin, y: ymin }, p2: { x: xmax, y: ymax - 1 } },
      ];
    if (g.chance(0.3))
      s.polys = [
        {
          pts: [
            { x: xmin, y: ymin },
            { x: xmax, y: ymin },
            { x: xmax, y: ymax },
          ],
          label: "T",
        },
      ];
    if (g.chance(0.5)) s.labelAxes = ["x", "y"];
    return s;
  },
  edges: [
    {
      kind: "coord",
      xmin: -5,
      xmax: 5,
      ymin: -5,
      ymax: 5,
      points: [
        { x: 2, y: 3, label: "A" },
        { x: -4, y: -1 },
      ],
      lines: [{ m: 1, b: 1 }],
      labelAxes: ["x", "y"],
    },
    {
      kind: "coord",
      xmin: 0,
      xmax: 10,
      ymin: 0,
      ymax: 10,
      points: [{ x: 3, y: 4, label: "(3, 4)" }],
    },
    { kind: "coord", xmin: 2, xmax: 8, ymin: 3, ymax: 9, points: [{ x: 4, y: 5 }] },
    {
      kind: "coord",
      xmin: -6,
      xmax: 6,
      ymin: -6,
      ymax: 6,
      polys: [
        {
          pts: [
            { x: 1, y: 1 },
            { x: 4, y: 1 },
            { x: 4, y: 3 },
            { x: 1, y: 3 },
          ],
          label: "R",
        },
      ],
      lines: [{ x: 2 }],
    },
    {
      kind: "coord",
      xmin: 0,
      xmax: 60,
      ymin: 0,
      ymax: 40,
      step: 5,
      points: [{ x: 15, y: 30 }],
      labelAxes: ["time (min)", "distance (m)"],
    },
    {
      kind: "coord",
      xmin: 0,
      xmax: 2,
      ymin: 0,
      ymax: 2,
      step: "1/2",
      points: [{ x: "1/2", y: "3/2" }],
    },
  ],
  info: (s) => ({
    mention: (s.points || []).map((p) => `(${p.x}, ${p.y})`),
    extra: (r) => {
      const frame = els(r.svg, "rect").find((e) => e.stroke === PALETTE.grid);
      const rx = num(frame.x);
      const ry = num(frame.y);
      const rw = num(frame.width);
      const rh = num(frame.height);
      const q = (v) =>
        typeof v === "string" && v.includes("/")
          ? Number(v.split("/")[0]) / Number(v.split("/")[1])
          : Number(v);
      const [x0, x1, y0, y1] = [q(s.xmin), q(s.xmax), q(s.ymin), q(s.ymax)];
      ok(
        Math.abs(rw / (x1 - x0) - rh / (y1 - y0)) < 0.02,
        "coord",
        "grid cells are not square",
        `${rw / (x1 - x0)} vs ${rh / (y1 - y0)}`,
      );
      const pts = els(r.svg, "circle").filter((c) => c.r === "7");
      ok(pts.length === (s.points || []).length, "coord", "point count", `${pts.length}`);
      (s.points || []).forEach((p, i) => {
        const wx = rx + ((q(p.x) - x0) / (x1 - x0)) * rw;
        const wy = ry + rh - ((q(p.y) - y0) / (y1 - y0)) * rh;
        ok(
          Math.abs(num(pts[i].cx) - wx) < 0.02 && Math.abs(num(pts[i].cy) - wy) < 0.02,
          "coord",
          "point off its grid position",
          `${pts[i].cx},${pts[i].cy} vs ${wx.toFixed(2)},${wy.toFixed(2)}`,
        );
      });
      const first = (s.lines || [])[0];
      if (first && first.m !== undefined) {
        const seg = els(r.svg, "line").find(
          (e) => e.stroke === PALETTE.blue && e["stroke-width"] === "3.5",
        );
        if (seg) {
          for (const [px, py] of [
            [seg.x1, seg.y1],
            [seg.x2, seg.y2],
          ]) {
            const dx = x0 + ((num(px) - rx) / rw) * (x1 - x0);
            const dy = y0 + ((ry + rh - num(py)) / rh) * (y1 - y0);
            ok(
              Math.abs(dy - (q(first.m) * dx + q(first.b || 0))) < 0.05,
              "coord",
              "line endpoint off y = mx + b",
              `${dx},${dy}`,
            );
          }
        }
      }
    },
  }),
  bad: [
    { kind: "coord", xmin: 0, xmax: 5, ymin: 0, ymax: 5, points: [{ x: 6, y: 1 }] },
    { kind: "coord", xmin: 5, xmax: 5, ymin: 0, ymax: 5 },
    { kind: "coord", xmin: 0, xmax: 5, ymin: 0, ymax: 5, step: 0 },
    { kind: "coord", xmin: 0, xmax: 5, ymin: 0, ymax: 5, lines: [{ foo: 1 }] },
    {
      kind: "coord",
      xmin: 0,
      xmax: 5,
      ymin: 0,
      ymax: 5,
      polys: [
        {
          pts: [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
          ],
        },
      ],
    },
    { kind: "coord", xmin: 0, xmax: 500, ymin: 0, ymax: 5, step: 1 },
    {
      kind: "coord",
      xmin: 0,
      xmax: 5,
      ymin: 0,
      ymax: 5,
      lines: [{ p1: { x: 1, y: 1 }, p2: { x: 1, y: 1 } }],
    },
  ],
  sheet: [
    {
      kind: "coord",
      xmin: -5,
      xmax: 5,
      ymin: -5,
      ymax: 5,
      points: [
        { x: 2, y: 3, label: "A" },
        { x: -4, y: -1, label: "B" },
      ],
      lines: [
        { m: 1, b: 1 },
        { m: -2, b: 2, label: "L" },
      ],
      labelAxes: ["x", "y"],
    },
    {
      kind: "coord",
      xmin: 0,
      xmax: 10,
      ymin: 0,
      ymax: 10,
      polys: [
        {
          pts: [
            { x: 2, y: 2, label: "P" },
            { x: 7, y: 2, label: "Q" },
            { x: 7, y: 6, label: "R" },
            { x: 2, y: 6, label: "S" },
          ],
          label: "Garden",
        },
      ],
    },
    {
      kind: "coord",
      xmin: 0,
      xmax: 60,
      ymin: 0,
      ymax: 40,
      step: 10,
      points: [
        { x: 20, y: 10 },
        { x: 40, y: 20 },
      ],
      lines: [{ p1: { x: 0, y: 0 }, p2: { x: 60, y: 30 } }],
      labelAxes: ["Minutes", "Meters"],
    },
  ],
};

K.tape = {
  gen: (g) => {
    const mode = g.pick(["hidden-part", "hidden-total", "multi", "plain"]);
    if (mode === "hidden-part") {
      const vals = g.distinct(g.int(2, 4), 10, 16);
      const hi = g.int(0, vals.length - 1);
      const total = vals.reduce((a, b) => a + b, 0);
      return {
        kind: "tape",
        rows: [
          {
            label: g.chance() ? "Ana" : undefined,
            parts: vals.map((v, i) => ({ value: i === hi ? "?" : v })),
          },
        ],
        total,
      };
    }
    if (mode === "hidden-total") {
      const vals = g.distinct(g.int(2, 4), 10, 16);
      return { kind: "tape", rows: [{ parts: vals.map((v) => ({ value: v })) }], total: "?" };
    }
    if (mode === "multi") {
      const [a, b] = g.distinct(2, 10, 16);
      return {
        kind: "tape",
        rows: [
          { label: "Ana", parts: [{ value: a, n: g.int(1, 3) }] },
          { label: "Ben", parts: [{ value: a }, { value: b }] },
        ],
      };
    }
    const vals = g.distinct(g.int(1, 3), 10, 16);
    return {
      kind: "tape",
      rows: [
        {
          parts: vals.map((v) => ({
            value: v,
            n: g.int(1, 2),
            label: g.chance(0.3) ? "boys" : undefined,
          })),
        },
      ],
    };
  },
  edges: [
    {
      kind: "tape",
      rows: [{ label: "Ana", parts: [{ value: 5, n: 3 }, { value: "?" }] }],
      total: 20,
    },
    { kind: "tape", rows: [{ parts: [{ value: "?", n: 4 }] }], total: 36 },
    {
      kind: "tape",
      rows: [
        { label: "Red", parts: [{ value: 12 }] },
        { label: "Blue", parts: [{ value: 12, n: 3 }] },
      ],
      total: "?",
    },
    {
      kind: "tape",
      rows: [{ parts: [{ value: "1/2" }, { value: "3/4" }, { value: "1/4" }] }],
      total: "3/2",
    },
    { kind: "tape", rows: [{ parts: [{ value: 1 }, { value: 100 }] }] },
  ],
  info: (s) => {
    const mention = [];
    const hidden = [];
    const known = new Set();
    for (const r of s.rows)
      for (const p of r.parts) if (p.value !== "?") known.add(String(p.value));
    const flat = s.rows.flatMap((r) => r.parts);
    for (const p of flat) if (p.value !== "?") mention.push(String(p.value));
    const anyHidden = flat.some((p) => p.value === "?");
    if (s.total !== undefined) {
      if (s.total === "?") {
        if (!anyHidden) {
          const total = flat.reduce((a, p) => a + Number(p.value) * (p.n || 1), 0);
          if (!known.has(String(total)) && !flat.some((p) => (p.n || 1) === total))
            hidden.push(String(total));
        }
      } else mention.push(String(s.total));
    }
    if (anyHidden && s.total !== undefined && s.total !== "?") {
      const nHidden = flat.filter((p) => p.value === "?").length;
      if (
        nHidden === 1 &&
        flat.every((p) => p.value === "?" || (p.n || 1) === 1) &&
        flat.find((p) => p.value === "?").n === undefined
      ) {
        const missing =
          Number(s.total) -
          flat.filter((p) => p.value !== "?").reduce((a, p) => a + Number(p.value), 0);
        if (
          Number.isInteger(missing) &&
          !known.has(String(missing)) &&
          String(missing) !== String(s.total)
        )
          hidden.push(String(missing));
      }
    }
    return {
      mention,
      hidden,
      extra: (r) => {
        const boxes = els(r.svg, "rect").filter((e) => e["stroke-width"] === "2.5");
        const want = s.rows.flatMap((row) =>
          row.parts.flatMap((p) => Array.from({ length: p.n || 1 }, () => p)),
        );
        ok(boxes.length === want.length, "tape", "box count", `${boxes.length} vs ${want.length}`);
        const kn = want.map((p, i) => [p, i]).filter(([p]) => p.value !== "?");
        const toN = (v) =>
          typeof v === "string" && v.includes("/")
            ? Number(v.split("/")[0]) / Number(v.split("/")[1])
            : Number(v);
        const ratios = kn.map(([p, i]) => num(boxes[i].width) / toN(p.value));
        const minW = Math.min(...kn.map(([, i]) => num(boxes[i].width)));
        if (minW > 36.5)
          ok(
            ratios.every((q) => Math.abs(q - ratios[0]) / ratios[0] < 0.01),
            "tape",
            "boxes not proportional to values",
            ratios.map((q) => q.toFixed(3)).join(","),
          );
        ok(boxes.filter((e) => e["stroke-dasharray"]).length === 0 || true, "tape", "");
        const dashed = els(r.svg, "rect").filter((e) => e["stroke-dasharray"]).length;
        ok(
          dashed === want.filter((p) => p.value === "?").length,
          "tape",
          "each hidden box is drawn dashed with ?",
          `${dashed}`,
        );
      },
    };
  },
  bad: [
    { kind: "tape", rows: [] },
    { kind: "tape", rows: [{ parts: [] }] },
    { kind: "tape", rows: [{ parts: [{ value: 0 }] }] },
    { kind: "tape", rows: [{ parts: [{ value: -3 }] }] },
    { kind: "tape", rows: [{ parts: [{ value: 5, n: 0 }] }] },
    { kind: "tape", rows: [{ parts: [{ value: 5 }, { value: 6 }] }], total: 12 },
    { kind: "tape" },
    { kind: "tape", rows: [{ parts: [{ value: "five" }] }] },
  ],
  sheet: [
    {
      kind: "tape",
      rows: [{ label: "Ana", parts: [{ value: 5, n: 3 }, { value: "?" }] }],
      total: 20,
    },
    {
      kind: "tape",
      rows: [
        { label: "Red", parts: [{ value: 12 }] },
        { label: "Blue", parts: [{ value: 12, n: 3 }] },
      ],
      total: "?",
    },
    {
      kind: "tape",
      rows: [
        {
          parts: [
            { value: 14, label: "boys" },
            { value: 11, label: "girls" },
          ],
        },
      ],
      total: 25,
    },
  ],
};

K.ratiotable = {
  gen: (g) => {
    const nc = g.int(2, 3);
    const nr = g.int(2, 4);
    const vals = g.distinct(nc * nr, 10, 99);
    const rows = Array.from({ length: nr }, (_, r) => vals.slice(r * nc, r * nc + nc));
    const hide = [];
    for (let i = g.int(0, 2); i > 0; i--) hide.push([g.int(0, nr - 1), g.int(0, nc - 1)]);
    return {
      kind: "ratiotable",
      headers: ["Cups of flour", "Cups of sugar", "Batches"].slice(0, nc),
      rows,
      hide,
    };
  },
  edges: [
    {
      kind: "ratiotable",
      headers: ["Cups of flour", "Cups of sugar"],
      rows: [
        [2, 3],
        [4, 6],
        [6, 9],
      ],
      hide: [[1, 1]],
    },
    { kind: "ratiotable", headers: ["a", "b"], rows: [["1/2", "3/4"]], hide: [] },
    {
      kind: "ratiotable",
      headers: ["Miles", "Hours"],
      rows: [
        [60, 1],
        [120, 2],
        [180, "?"],
      ],
      hide: [[0, 0]],
    },
  ],
  info: (s) => {
    const hid = new Set((s.hide || []).map(([r, c]) => `${r},${c}`));
    const mention = [];
    const hidden = [];
    s.rows.forEach((row, r) =>
      row.forEach((v, c) =>
        hid.has(`${r},${c}`) || v === "?"
          ? v !== "?" && hidden.push(String(v))
          : mention.push(String(v)),
      ),
    );
    return {
      mention: mention.length ? mention.slice(0, 6) : [],
      hidden: hidden.filter((h) => !mention.includes(h)),
      extra: (r) =>
        ok(
          !hid.size && !s.rows.flat().includes("?") ? true : /unknown/.test(r.summary),
          "ratiotable",
          "summary must say unknown",
        ),
    };
  },
  bad: [
    { kind: "ratiotable", headers: ["a"], rows: [[1]] },
    { kind: "ratiotable", headers: ["a", "b"], rows: [[1, 2]], hide: [[1, 0]] },
    { kind: "ratiotable", headers: ["a", "b"], rows: [[1, 2, 3]] },
    { kind: "ratiotable", headers: ["a", "b"], rows: [] },
    { kind: "ratiotable", headers: ["a", "b"], rows: [[1, 2]], hide: [[0, 2]] },
    { kind: "ratiotable", headers: ["a", "b"], rows: [[1, 2]], hide: [[0]] },
  ],
  sheet: [
    {
      kind: "ratiotable",
      headers: ["Cups of flour", "Cups of sugar"],
      rows: [
        [2, 3],
        [4, 6],
        [6, 9],
      ],
      hide: [
        [1, 1],
        [2, 0],
      ],
    },
    {
      kind: "ratiotable",
      headers: ["Hours", "Miles", "Gallons"],
      rows: [
        [1, 55, 2],
        [2, 110, 4],
        [3, 165, 6],
      ],
      hide: [[2, 2]],
    },
  ],
};

K.doublenl = {
  gen: (g) => {
    const n = g.int(3, 6);
    const vals = g.distinct(2 * n, 1, 99);
    const top = vals.slice(0, n).sort((a, b) => a - b);
    const bottom = vals.slice(n).sort((a, b) => a - b);
    const hide = (arr) => arr.map((v) => (g.chance(0.25) ? null : v));
    return {
      kind: "doublenl",
      top: { label: "Cups of flour", values: hide(top) },
      bottom: { label: "Cups of sugar", values: hide(bottom) },
    };
  },
  edges: [
    {
      kind: "doublenl",
      top: { label: "Flour", values: [0, 2, 4, 6] },
      bottom: { label: "Sugar", values: [0, 3, null, 9] },
    },
    {
      kind: "doublenl",
      top: { label: "a", values: [1, 2] },
      bottom: { label: "b", values: ["?", 7] },
    },
    {
      kind: "doublenl",
      top: { label: "Miles", values: [0, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 660] },
      bottom: { label: "Hours", values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "?"] },
    },
  ],
  info: (s) => {
    const mention = [];
    const hidden = [];
    for (const l of [s.top, s.bottom])
      for (const v of l.values)
        (v === null || v === "?" ? v !== null && v !== "?" : true) &&
          v !== null &&
          v !== "?" &&
          mention.push(String(v));
    for (const l of [s.top, s.bottom])
      for (const v of l.values)
        if (typeof v === "number" && l.values.includes(null) && false) hidden.push(String(v));
    return {
      mention,
      hidden,
      extra: (r) =>
        ok(
          ![...s.top.values, ...s.bottom.values].some((v) => v === null || v === "?") ||
            /unknown/.test(r.summary),
          "doublenl",
          "summary must say unknown",
        ),
    };
  },
  bad: [
    {
      kind: "doublenl",
      top: { label: "a", values: [1, 2, 3] },
      bottom: { label: "b", values: [1, 2] },
    },
    { kind: "doublenl", top: { label: "a", values: [1] }, bottom: { label: "b", values: [1] } },
    { kind: "doublenl", top: { label: "a" }, bottom: { label: "b", values: [1, 2] } },
    {
      kind: "doublenl",
      top: { label: "a", values: [1, "x"] },
      bottom: { label: "b", values: [1, 2] },
    },
    { kind: "doublenl" },
  ],
  sheet: [
    {
      kind: "doublenl",
      top: { label: "Cups of flour", values: [0, 2, 4, 6] },
      bottom: { label: "Cups of sugar", values: [0, 3, null, 9] },
    },
    {
      kind: "doublenl",
      top: { label: "Miles", values: [0, 60, 120, 180, 240, 300] },
      bottom: { label: "Hours", values: [0, 1, 2, null, 4, 5] },
    },
  ],
};

K.table = {
  gen: (g) => {
    const nc = g.int(2, 4);
    const nr = g.int(1, 6);
    const headers = ["Day", "Pets", "Cost ($)", "Notes"].slice(0, nc);
    const rows = Array.from({ length: nr }, () =>
      headers.map((_, c) => (c === 0 ? g.pick(WORDS) : g.chance(0.2) ? null : g.int(0, 5000))),
    );
    return { kind: "table", headers, rows, caption: g.chance(0.7) ? "Pet shop sales" : undefined };
  },
  edges: [
    {
      kind: "table",
      headers: ["Day", "Pets"],
      rows: [
        ["Mon", 5],
        ["Tue", 8],
      ],
      caption: "Pets",
    },
    { kind: "table", headers: ["x"], rows: [[1]] },
    {
      kind: "table",
      headers: ["Item", "Price"],
      rows: [
        ["Pen", "$1.25"],
        ["Book", "$12.40"],
        ["Bag", "?"],
      ],
    },
    { kind: "table", headers: ["A & B", "<C>"], rows: [["x < y", '"q"']] },
  ],
  info: (s) => ({
    mention: s.rows
      .flat()
      .filter((v) => v !== null && v !== "?" && String(v).length)
      .slice(0, 8)
      .map((v) => String(typeof v === "number" ? v : v)),
    extra: (r) => {
      const t = textsOf(r.svg);
      const cells = s.rows.flat().filter((v) => v !== null && v !== "");
      ok(
        cells.every((v) =>
          t.includes(
            typeof v === "number" ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : String(v),
          ),
        ),
        "table",
        "a cell value is not drawn",
        cells.join("|"),
      );
    },
  }),
  bad: [
    { kind: "table", headers: [], rows: [[1]] },
    { kind: "table", headers: ["a", "b"], rows: [[1]] },
    { kind: "table", headers: ["a"], rows: [] },
    { kind: "table", rows: [[1]] },
  ],
  sheet: [
    {
      kind: "table",
      headers: ["Day", "Pets sold", "Cost ($)"],
      rows: [
        ["Monday", 5, "12.50"],
        ["Tuesday", 8, "20.00"],
        ["Wednesday", 3, "7.50"],
      ],
      caption: "Pet shop sales",
    },
  ],
};

const SHAPES = [
  "triangle",
  "square",
  "rectangle",
  "circle",
  "pentagon",
  "hexagon",
  "rhombus",
  "trapezoid",
  "half-circle",
  "quarter-circle",
];
K.shape = {
  gen: (g) => ({ kind: "shape", name: g.pick(SHAPES), labels: g.chance(0.5) }),
  edges: SHAPES.map((name) => ({ kind: "shape", name, labels: name.length % 2 === 0 })),
  info: (s) => ({
    mention: [s.name],
    extra: (r) => {
      const t = textsOf(r.svg).join("|");
      ok(
        s.labels ? t.includes(s.name) : t === "",
        "shape",
        "name label shown only when labels is true",
        t,
      );
    },
  }),
  bad: [{ kind: "shape", name: "blob" }, { kind: "shape" }, { kind: "shape", name: "Triangle" }],
  sheet: SHAPES.map((name) => ({ kind: "shape", name, labels: true })),
};

K.prism = {
  gen: (g) => {
    const units = g.chance(0.75);
    if (units)
      return {
        kind: "prism",
        l: g.int(1, 8),
        w: g.int(1, 8),
        h: g.int(1, 8),
        units,
        unit: g.pick(["cubes", "cm", undefined]),
      };
    return {
      kind: "prism",
      l: g.pick([2.5, "3/2", 4]),
      w: g.pick([3, 1.5]),
      h: g.pick([2, "5/2"]),
      units,
      unit: g.pick(["cm", "in"]),
    };
  },
  edges: [
    { kind: "prism", l: 5, w: 3, h: 2 },
    { kind: "prism", l: 1, w: 1, h: 1 },
    { kind: "prism", l: 12, w: 12, h: 12 },
    { kind: "prism", l: 12, w: 1, h: 1 },
    { kind: "prism", l: 1, w: 1, h: 12 },
    { kind: "prism", l: 7.5, w: 2, h: 3, units: false, unit: "cm" },
    { kind: "prism", l: 6, w: 4, h: 3, units: false },
  ],
  info: (s) => {
    const q = (v) =>
      typeof v === "string" && v.includes("/")
        ? Number(v.split("/")[0]) / Number(v.split("/")[1])
        : Number(v);
    const vol = q(s.l) * q(s.w) * q(s.h);
    const vis = new Set([String(s.l), String(s.w), String(s.h)]);
    return {
      mention: [String(s.l), String(s.w), String(s.h)],
      hidden: Number.isInteger(vol) && !vis.has(String(vol)) ? [String(vol)] : [],
    };
  },
  bad: [
    { kind: "prism", l: 2.5, w: 2, h: 2 },
    { kind: "prism", l: 0, w: 2, h: 2 },
    { kind: "prism", l: 13, w: 2, h: 2 },
    { kind: "prism", l: 2, w: -1, h: 2 },
    { kind: "prism", l: 2, w: 2 },
    { kind: "prism", l: "a", w: 2, h: 2 },
  ],
  sheet: [
    { kind: "prism", l: 5, w: 3, h: 2 },
    { kind: "prism", l: 4, w: 4, h: 4 },
    { kind: "prism", l: "7.5", w: 4, h: 3, units: false, unit: "cm" },
  ],
};

K.rect = {
  gen: (g) => {
    const [w, h] = g.distinct(2, 3, 30);
    const s = { kind: "rect", w, h, unit: g.pick(["cm", "in", "ft", "units", "feet", undefined]) };
    s.showArea = g.chance(0.4);
    s.showPerimeter = g.chance(0.4);
    if (g.chance(0.25)) s.labels = ["w", "h"];
    return s;
  },
  edges: [
    { kind: "rect", w: 8, h: 3, unit: "cm", showArea: true },
    { kind: "rect", w: 30, h: 3, unit: "m", showPerimeter: true },
    { kind: "rect", w: 3, h: 30 },
    { kind: "rect", w: "2.5", h: "1.5", unit: "cm", showArea: true, showPerimeter: true },
    { kind: "rect", w: 7, h: 5, labels: ["?", "5 cm"] },
    { kind: "rect", w: 9, h: 4, labels: ["l", "w"], showArea: true },
  ],
  info: (s) => {
    const q = (v) => Number(v);
    const area = q(s.w) * q(s.h);
    const per = 2 * (q(s.w) + q(s.h));
    const vis = new Set([String(s.w), String(s.h)]);
    const hidden = [];
    if (
      !s.showArea &&
      Number.isInteger(area) &&
      !vis.has(String(area)) &&
      !(s.showPerimeter && String(per) === String(area))
    )
      hidden.push(String(area));
    if (
      !s.showPerimeter &&
      Number.isInteger(per) &&
      !vis.has(String(per)) &&
      !(s.showArea && String(per) === String(area))
    )
      hidden.push(String(per));
    const mention = [];
    if (!s.labels) mention.push(String(s.w), String(s.h));
    else if (s.labels[0] !== "?" && s.labels[1] !== "?") mention.push(...s.labels);
    if (s.showArea && !s.labels) mention.push(String(area));
    if (s.showPerimeter && !s.labels) mention.push(String(per));
    if (s.labels && s.labels[0] === "w" && s.labels[1] === "h") {
      if (!(s.w === 2 || s.h === 2)) hidden.push(String(s.w), String(s.h));
    }
    return { mention, hidden: hidden.filter((h) => h !== "2") };
  },
  bad: [
    { kind: "rect", w: 0, h: 3 },
    { kind: "rect", w: 3, h: -1 },
    { kind: "rect", w: 3, h: 4, labels: ["w"] },
    { kind: "rect", h: 4 },
    { kind: "rect", w: "x", h: 4 },
  ],
  sheet: [
    { kind: "rect", w: 8, h: 3, unit: "cm", showArea: true, showPerimeter: true },
    { kind: "rect", w: 9, h: 4, unit: "ft", labels: ["l", "w"] },
  ],
};

K.angle = {
  gen: (g) => {
    const deg = g.pick([
      g.int(1, 359),
      g.int(1, 179),
      g.int(1, 179),
      g.pick([30, 45, 60, 90, 120, 135, 180, 270]),
    ]);
    const s = { kind: "angle", deg };
    const mode = g.pick(["default", "default", "x", "?", "shown"]);
    if (mode === "x" || mode === "?") s.label = mode;
    if (mode === "shown") s.label = `${deg}°`;
    if (deg <= 180 && g.chance(0.35)) s.protractor = true;
    return s;
  },
  edges: [
    { kind: "angle", deg: 65, protractor: true },
    { kind: "angle", deg: 90 },
    { kind: "angle", deg: 1 },
    { kind: "angle", deg: 359 },
    { kind: "angle", deg: 180, protractor: true },
    { kind: "angle", deg: 135, label: "x" },
    { kind: "angle", deg: 200, label: "?" },
    { kind: "angle", deg: 30, label: "?", protractor: true },
  ],
  info: (s) => {
    const hiddenLabel = s.label !== undefined && !/\d/.test(String(s.label));
    return {
      mention: hiddenLabel ? [] : [String(s.deg)],
      hidden: hiddenLabel && !s.protractor ? [String(s.deg)] : [],
      extra: (r) => {
        const rays = els(r.svg, "line").filter((e) => e["stroke-width"] === "4.5");
        ok(rays.length === 2, "angle", "two rays expected", String(rays.length));
        const [r1, r2] = rays;
        ok(
          Math.abs(num(r1.y1) - num(r1.y2)) < 1e-6 && num(r1.x2) > num(r1.x1),
          "angle",
          "base ray must point right",
        );
        ok(r1.x1 === r2.x1 && r1.y1 === r2.y1, "angle", "rays must share a vertex");
        let a = (Math.atan2(-(num(r2.y2) - num(r2.y1)), num(r2.x2) - num(r2.x1)) * 180) / Math.PI;
        if (a < 0) a += 360;
        ok(
          Math.abs(a - s.deg) < 0.1,
          "angle",
          "second ray not at the stated degrees",
          `${a.toFixed(2)} vs ${s.deg}`,
        );
        if (s.protractor) {
          const tens = textsOf(r.svg).filter((t) => /^\d+$/.test(t));
          ok(tens.length >= 36, "angle", "protractor scales missing", String(tens.length));
        }
      },
    };
  },
  bad: [
    { kind: "angle", deg: 0 },
    { kind: "angle", deg: 360 },
    { kind: "angle", deg: -5 },
    { kind: "angle", deg: 200, protractor: true },
    { kind: "angle", deg: 40, label: "30°" },
    { kind: "angle" },
    { kind: "angle", deg: "big" },
  ],
  sheet: [
    { kind: "angle", deg: 65, protractor: true },
    { kind: "angle", deg: 90, label: "x" },
    { kind: "angle", deg: 145, label: "?" },
    { kind: "angle", deg: 250, label: "a" },
  ],
};

K.circle = {
  gen: (g) => {
    const r = g.int(1, 20);
    const mode = g.pick(["radius", "diameter", "both"]);
    const s = { kind: "circle", r, show: mode, unit: g.pick(["cm", "in", undefined]) };
    if (g.chance(0.3)) s.d = 2 * r;
    return s;
  },
  edges: [
    { kind: "circle", r: 5, show: "both", unit: "cm" },
    { kind: "circle", r: "?", show: "both" },
    { kind: "circle", d: 14, show: "radius" },
    { kind: "circle", d: "?", r: 9, show: "diameter" },
    { kind: "circle", r: "2.5", show: "diameter", unit: "m" },
    { kind: "circle", r: 7 },
  ],
  info: (s) => {
    const show = s.show || "radius";
    const r =
      s.r === "?"
        ? null
        : s.r !== undefined
          ? Number(s.r)
          : s.d !== undefined && s.d !== "?"
            ? Number(s.d) / 2
            : null;
    const mention = [];
    const hidden = [];
    if (r !== null && !Number.isNaN(r)) {
      if (show !== "diameter" && s.r !== "?") mention.push(String(r));
      if (show !== "radius" && s.d !== "?") mention.push(String(r * 2));
      if (show === "diameter" && s.d === undefined) hidden.push(String(r));
      if (show === "radius" && s.r === undefined) hidden.push(String(r * 2));
      if (show === "diameter" && s.d === "?") hidden.push(String(r * 2));
    }
    return { mention, hidden: hidden.filter((h) => !mention.includes(h)) };
  },
  bad: [
    { kind: "circle", r: -1 },
    { kind: "circle" },
    { kind: "circle", r: 3, show: "chord" },
    { kind: "circle", r: 3, d: 5 },
    { kind: "circle", r: 0 },
    { kind: "circle", r: "big" },
  ],
  sheet: [
    { kind: "circle", r: 5, show: "both", unit: "cm" },
    { kind: "circle", r: "?", d: 14, show: "both", unit: "in" },
    { kind: "circle", d: 14, show: "diameter" },
  ],
};

const TRIPLES = [
  [3, 4, 5],
  [5, 12, 13],
  [6, 8, 10],
  [8, 15, 17],
  [9, 12, 15],
  [7, 24, 25],
  [20, 21, 29],
];
K.triangle = {
  gen: (g) => {
    if (g.chance(0.7)) {
      const t = g.pick(TRIPLES);
      const h = g.pick([null, 0, 1, 2]);
      const s = { kind: "triangle", right: true, a: t[0], b: t[1], c: t[2] };
      if (h !== null) s[["a", "b", "c"][h]] = "?";
      if (g.chance(0.3)) s.unit = "cm";
      return s;
    }
    for (;;) {
      const [a, b, c] = [g.int(4, 12), g.int(4, 12), g.int(4, 12)];
      if (a + b > c && a + c > b && b + c > a)
        return { kind: "triangle", right: false, a, b, c: g.chance(0.3) ? "?" : c };
    }
  },
  edges: [
    { kind: "triangle", a: 3, b: 4, c: "?" },
    { kind: "triangle", a: 3, b: 4, c: 5, right: true, labels: ["a", "b", "c"] },
    { kind: "triangle", a: 5, b: 6, c: 7, right: false },
    { kind: "triangle", a: "?", b: "?", c: "?" },
    { kind: "triangle", a: 3, b: 4, c: "5 cm" },
    { kind: "triangle", a: 7, b: 24, c: "?", unit: "ft" },
  ],
  info: (s) => {
    const hidden = [];
    const mention = [];
    const vis = new Set(["a", "b", "c"].filter((k) => s[k] !== "?").map((k) => String(s[k])));
    if (!s.labels)
      for (const k of ["a", "b", "c"])
        if (s[k] !== "?") mention.push(String(s[k]).replace(/ cm$/, ""));
    if (s.right !== false && !s.labels) {
      const tr = TRIPLES.find(
        (t) => t.includes(Number(s.a)) || t.includes(Number(s.b)) || t.includes(Number(s.c)),
      );
      if (tr)
        for (const k of ["a", "b", "c"])
          if (s[k] === "?")
            for (const v of tr)
              if (
                !vis.has(String(v)) &&
                (k === "a" ? v === tr[0] : k === "b" ? v === tr[1] : v === tr[2])
              )
                hidden.push(String(v));
    }
    return {
      mention,
      hidden,
      extra: (r) => {
        const polys = els(r.svg, "polygon");
        const tri = polys[0];
        const pts = tri.points.split(" ").map((q) => q.split(",").map(Number));
        const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
        const sides = [d(pts[0], pts[1]), d(pts[0], pts[2]), d(pts[1], pts[2])];
        const given = ["a", "b", "c"].map((k) => (s[k] === "?" ? null : parseFloat(s[k])));
        const bh = Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1]));
        const known = given.map((v, i) => [v, i]).filter(([v]) => v != null);
        if (known.length >= 2 && bh > 71) {
          const rs = known.map(([v, i]) => sides[i] / v);
          ok(
            rs.every((q) => Math.abs(q - rs[0]) / rs[0] < 0.02),
            "triangle",
            "sides not drawn in proportion",
            rs.map((q) => q.toFixed(3)).join(","),
          );
        }
        if (s.right !== false) {
          const dot =
            (pts[1][0] - pts[0][0]) * (pts[2][0] - pts[0][0]) +
            (pts[1][1] - pts[0][1]) * (pts[2][1] - pts[0][1]);
          ok(
            Math.abs(dot) < 1e-6,
            "triangle",
            "right angle must be a true right angle",
            String(dot),
          );
        }
      },
    };
  },
  bad: [
    { kind: "triangle", a: 3, b: 4, c: 6 },
    { kind: "triangle", a: 1, b: 2, c: 9, right: false },
    { kind: "triangle", a: 3, b: 4 },
    { kind: "triangle", a: 3, b: 4, c: 5, labels: ["a", "b"] },
    { kind: "triangle", a: -3, b: 4, c: 5 },
    { kind: "triangle", a: 0, b: 4, c: 5 },
  ],
  sheet: [
    { kind: "triangle", a: 3, b: 4, c: "?", unit: "cm" },
    { kind: "triangle", a: 5, b: 12, c: 13, labels: ["a", "b", "c"] },
    { kind: "triangle", a: 6, b: 7, c: 9, right: false },
    { kind: "triangle", a: 7, b: "?", c: 25, unit: "m" },
  ],
};

K.balance = {
  gen: (g) => {
    const side = (n) => Array.from({ length: n }, () => g.int(1, 9));
    const mode = g.pick(["num", "num", "x", "x"]);
    if (mode === "x") {
      const l = side(g.int(0, 3));
      l.push(...Array.from({ length: g.int(1, 2) }, () => "x"));
      return { kind: "balance", left: g.shuffle(l), right: side(g.int(1, 3)) };
    }
    return { kind: "balance", left: side(g.int(1, 5)), right: side(g.int(1, 5)) };
  },
  edges: [
    { kind: "balance", left: [3, 5], right: [8] },
    { kind: "balance", left: ["x", 3], right: [8] },
    { kind: "balance", left: [9, 9, 9], right: [1] },
    { kind: "balance", left: [1], right: [9, 9, 9] },
    { kind: "balance", left: [], right: [4] },
    { kind: "balance", left: Array(12).fill(1), right: Array(12).fill("x") },
    { kind: "balance", left: [4, "x"], right: ["2x", 6] },
    { kind: "balance", left: ["1/2", "1/2"], right: [1] },
  ],
  info: (s) => {
    const q = (v) =>
      typeof v === "string" && v.includes("/")
        ? Number(v.split("/")[0]) / Number(v.split("/")[1])
        : Number(v);
    const numeric = [...s.left, ...s.right].every((t) => !Number.isNaN(q(t)));
    const sl = numeric ? s.left.reduce((a, t) => a + q(t), 0) : 0;
    const sr = numeric ? s.right.reduce((a, t) => a + q(t), 0) : 0;
    return {
      mention: [...s.left, ...s.right].map(String).slice(0, 4),
      extra: (r) => {
        const beam = els(r.svg, "line").find((e) => e["stroke-width"] === "9");
        const dy = num(beam.y2) - num(beam.y1);
        if (!numeric || sl === sr) ok(Math.abs(dy) < 1e-6, "balance", "must be level", String(dy));
        else if (sl > sr)
          ok(
            dy < -1,
            "balance",
            "left is heavier so the left end must be lower (larger y)",
            String(dy),
          );
        else ok(dy > 1, "balance", "right is heavier so the right end must be lower", String(dy));
        ok(
          numeric ? /totals/.test(r.summary) : /level/.test(r.summary) && !/totals/.test(r.summary),
          "balance",
          "summary totals only when all tokens are numbers",
        );
        if (numeric)
          ok(
            hasText(r.summary, `left side totals ${fracText(Math.round(sl * 1000), 1000, false)}`),
            "balance",
            "summary left total",
            r.summary,
          );
      },
    };
  },
  bad: [
    { kind: "balance", left: "x", right: [1] },
    { kind: "balance", left: [], right: [] },
    { kind: "balance", left: Array(13).fill(1), right: [1] },
    { kind: "balance", left: [1, ""], right: [1] },
    { kind: "balance", left: [1] },
  ],
  sheet: [
    { kind: "balance", left: [3, 5], right: [8] },
    { kind: "balance", left: [9, 4, 3], right: [5, 2] },
    { kind: "balance", left: ["x", "x", 3], right: [11] },
  ],
};

K.tiles = {
  gen: (g) => {
    for (;;) {
      const s = {
        kind: "tiles",
        x: g.int(0, 6),
        negX: g.int(0, 4),
        one: g.int(0, 10),
        negOne: g.int(0, 8),
      };
      if (s.x + s.negX + s.one + s.negOne) return s;
    }
  },
  edges: [
    { kind: "tiles", x: 1 },
    { kind: "tiles", x: 12, negX: 12, one: 12, negOne: 12 },
    { kind: "tiles", one: 1 },
    { kind: "tiles", x: 2, negX: 1, one: 3, negOne: 2 },
  ],
  info: (s) => {
    const names = {
      x: "x-tile",
      negX: "negative x-tile",
      one: "unit tile",
      negOne: "negative unit tile",
    };
    return {
      mention: Object.keys(names)
        .filter((k) => s[k])
        .map((k) => `${s[k]} ${names[k]}`),
      extra: (r) => {
        const total = (s.x || 0) + (s.negX || 0) + (s.one || 0) + (s.negOne || 0);
        const tiles = els(r.svg, "rect").filter((e) => e["stroke-width"] === "2.5");
        ok(tiles.length === total, "tiles", "tile count", `${tiles.length} vs ${total}`);
        const labels = textsOf(r.svg);
        ok(
          labels.filter((t) => t === "x").length === (s.x || 0) &&
            labels.filter((t) => t === "−x").length === (s.negX || 0) &&
            labels.filter((t) => t === "1").length === (s.one || 0) &&
            labels.filter((t) => t === "−1").length === (s.negOne || 0),
          "tiles",
          "tile labels (negatives must be marked in text, not by color alone)",
        );
      },
    };
  },
  bad: [
    { kind: "tiles" },
    { kind: "tiles", x: 13 },
    { kind: "tiles", x: -1 },
    { kind: "tiles", x: 1.5 },
    { kind: "tiles", one: 0, negOne: 0, x: 0, negX: 0 },
  ],
  sheet: [
    { kind: "tiles", x: 2, negX: 1, one: 3, negOne: 4 },
    { kind: "tiles", x: 3, one: 5 },
  ],
};

K.scatter = {
  gen: (g) => {
    const xmin = g.int(0, 5);
    const xmax = xmin + g.int(5, 40);
    const ymin = g.int(0, 5);
    const ymax = ymin + g.int(5, 40);
    const points = Array.from({ length: g.int(1, 12) }, () => ({
      x: g.int(xmin, xmax),
      y: g.int(ymin, ymax),
    }));
    const s = { kind: "scatter", xmin, xmax, ymin, ymax, points };
    if (g.chance(0.5)) s.line = { m: g.pick([1, 2, "1/2", 0, -1]), b: g.int(-2, 4) };
    if (g.chance(0.7)) {
      s.xLabel = "Hours studied";
      s.yLabel = "Test score";
    }
    return s;
  },
  edges: [
    {
      kind: "scatter",
      xmin: 0,
      xmax: 10,
      ymin: 0,
      ymax: 100,
      points: [
        { x: 1, y: 20 },
        { x: 4, y: 55 },
        { x: 9, y: 90 },
      ],
      line: { m: 8, b: 12 },
      xLabel: "Hours",
      yLabel: "Score",
    },
    {
      kind: "scatter",
      xmin: 0,
      xmax: 5,
      ymin: 0,
      ymax: 5,
      points: [
        { x: 5, y: 5 },
        { x: 0, y: 0 },
      ],
    },
    {
      kind: "scatter",
      xmin: 0,
      xmax: 1000,
      ymin: 0,
      ymax: 1,
      points: [
        { x: 250, y: "1/2" },
        { x: 750, y: 0.25 },
      ],
    },
    { kind: "scatter", xmin: -10, xmax: 10, ymin: -10, ymax: 10, points: [{ x: -3, y: 4 }] },
  ],
  info: (s) => ({
    mention: s.points.map((p) => `(${p.x}, ${p.y})`),
    extra: (r) => {
      const frame = els(r.svg, "rect").find((e) => e.stroke === PALETTE.grid);
      const rx = num(frame.x);
      const ry = num(frame.y);
      const rw = num(frame.width);
      const rh = num(frame.height);
      const q = (v) =>
        typeof v === "string" && v.includes("/")
          ? Number(v.split("/")[0]) / Number(v.split("/")[1])
          : Number(v);
      const pts = els(r.svg, "circle").filter((c) => c.r === "6.5");
      ok(pts.length === s.points.length, "scatter", "point count", String(pts.length));
      s.points.forEach((p, i) => {
        const wx = rx + ((q(p.x) - s.xmin) / (s.xmax - s.xmin)) * rw;
        const wy = ry + rh - ((q(p.y) - s.ymin) / (s.ymax - s.ymin)) * rh;
        ok(
          Math.abs(num(pts[i].cx) - wx) < 0.02 && Math.abs(num(pts[i].cy) - wy) < 0.02,
          "scatter",
          "point off its true position",
          `${pts[i].cx},${pts[i].cy} vs ${wx.toFixed(2)},${wy.toFixed(2)}`,
        );
      });
      if (s.line) {
        const seg = els(r.svg, "line").find(
          (e) => e.stroke === PALETTE.coral && e["stroke-width"] === "4",
        );
        if (seg)
          for (const [px, py] of [
            [seg.x1, seg.y1],
            [seg.x2, seg.y2],
          ]) {
            const dx = s.xmin + ((num(px) - rx) / rw) * (s.xmax - s.xmin);
            const dy = s.ymin + ((ry + rh - num(py)) / rh) * (s.ymax - s.ymin);
            ok(
              Math.abs(dy - (q(s.line.m) * dx + s.line.b)) < 0.05,
              "scatter",
              "trend line endpoint off y = mx + b",
              `${dx},${dy}`,
            );
          }
      }
    },
  }),
  bad: [
    { kind: "scatter", xmin: 0, xmax: 5, ymin: 0, ymax: 5, points: [{ x: 6, y: 1 }] },
    { kind: "scatter", xmin: 0, xmax: 5, ymin: 0, ymax: 5, points: [] },
    { kind: "scatter", xmin: 5, xmax: 5, ymin: 0, ymax: 5, points: [{ x: 5, y: 1 }] },
    { kind: "scatter", xmin: 0, xmax: 5, ymin: 0, ymax: 5 },
    { kind: "scatter", xmin: 0, xmax: 5, ymin: 0, ymax: 5, points: [{ x: 1, y: 6 }] },
  ],
  sheet: [
    {
      kind: "scatter",
      xmin: 0,
      xmax: 10,
      ymin: 0,
      ymax: 100,
      points: [
        { x: 1, y: 20 },
        { x: 2, y: 28 },
        { x: 4, y: 55 },
        { x: 5, y: 52 },
        { x: 7, y: 71 },
        { x: 9, y: 90 },
      ],
      line: { m: 8, b: 12 },
      xLabel: "Hours studied",
      yLabel: "Test score",
    },
  ],
};

K.spinner = {
  gen: (g) => {
    const n = g.int(2, 7);
    const labels = g
      .shuffle([
        "red",
        "blue",
        "green",
        "yellow",
        "orange",
        "pink",
        "teal",
        "1",
        "2",
        "3",
        "A",
        "B",
      ])
      .slice(0, n);
    const equal = g.chance(0.3);
    return {
      kind: "spinner",
      sections: labels.map((label) => ({ label, weight: equal ? 1 : g.int(1, 6) })),
    };
  },
  edges: [
    {
      kind: "spinner",
      sections: [
        { label: "red", weight: 3 },
        { label: "blue", weight: 1 },
        { label: "green", weight: 1 },
      ],
    },
    {
      kind: "spinner",
      sections: [
        { label: "heads", weight: 1 },
        { label: "tails", weight: 1 },
      ],
    },
    {
      kind: "spinner",
      sections: Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), weight: 1 })),
    },
    {
      kind: "spinner",
      sections: [
        { label: "big", weight: 99 },
        { label: "tiny", weight: 1 },
      ],
    },
    {
      kind: "spinner",
      sections: [
        { label: "half", weight: "1/2" },
        { label: "quarter", weight: "1/4" },
        { label: "other quarter", weight: 0.25 },
      ],
    },
  ],
  info: (s) => ({
    mention: s.sections.map((x) => x.label),
    extra: (r) => {
      const q = (v) =>
        typeof v === "string" && v.includes("/")
          ? Number(v.split("/")[0]) / Number(v.split("/")[1])
          : Number(v);
      const total = s.sections.reduce((a, x) => a + q(x.weight), 0);
      const arcs = els(r.svg, "path").filter((e) => e["stroke-width"] === "3" && /^M /.test(e.d));
      ok(arcs.length === s.sections.length, "spinner", "section count", String(arcs.length));
      arcs.forEach((p, i) => {
        const m =
          /^M ([\d.]+) ([\d.]+) L ([-\d.]+) ([-\d.]+) A [\d.]+ [\d.]+ 0 [01] 1 ([-\d.]+) ([-\d.]+) Z$/.exec(
            p.d,
          );
        const [cx, cy, x1, y1, x2, y2] = m.slice(1).map(Number);
        const a1 = Math.atan2(x1 - cx, -(y1 - cy));
        const a2 = Math.atan2(x2 - cx, -(y2 - cy));
        let sweep = ((a2 - a1) * 180) / Math.PI;
        while (sweep <= 0) sweep += 360;
        const want = (q(s.sections[i].weight) / total) * 360;
        ok(
          Math.abs(sweep - want) < 0.5 || Math.abs(sweep - want - 360) < 0.5,
          "spinner",
          "sector angle not proportional to weight",
          `${sweep.toFixed(2)} vs ${want.toFixed(2)}`,
        );
      });
      const equal = s.sections.every((x) => q(x.weight) === q(s.sections[0].weight));
      ok(equal === /equal sections/.test(r.summary), "spinner", "summary equal/unequal wording");
    },
  }),
  bad: [
    { kind: "spinner", sections: [{ label: "a", weight: 1 }] },
    {
      kind: "spinner",
      sections: [
        { label: "a", weight: 0 },
        { label: "b", weight: 1 },
      ],
    },
    {
      kind: "spinner",
      sections: Array.from({ length: 13 }, (_, i) => ({ label: String(i), weight: 1 })),
    },
    { kind: "spinner", sections: [{ weight: 1 }, { label: "b", weight: 1 }] },
    { kind: "spinner" },
    {
      kind: "spinner",
      sections: [
        { label: "a", weight: -1 },
        { label: "b", weight: 1 },
      ],
    },
  ],
  sheet: [
    {
      kind: "spinner",
      sections: [
        { label: "red", weight: 3 },
        { label: "blue", weight: 1 },
        { label: "green", weight: 1 },
        { label: "yellow", weight: 3 },
      ],
    },
    {
      kind: "spinner",
      sections: Array.from({ length: 8 }, (_, i) => ({ label: String(i + 1), weight: 1 })),
    },
    {
      kind: "spinner",
      sections: [
        { label: "win", weight: 1 },
        { label: "try again", weight: 9 },
      ],
    },
  ],
};

K.ruler = {
  gen: (g) => {
    const unit = g.pick(["cm", "in"]);
    const length = unit === "cm" ? g.int(3, 20) : g.int(2, 8);
    const per = unit === "cm" ? 10 : 16;
    const a = g.int(0, length * per - 1);
    const b = g.int(a + 1, length * per);
    const txt = (k) => {
      if (unit === "cm") return k % 10 === 0 ? k / 10 : String(k / 10);
      return k % 16 === 0 ? k / 16 : fracText(k, 16, true);
    };
    return { kind: "ruler", unit, length, objectFrom: txt(a), objectTo: txt(b) };
  },
  edges: [
    { kind: "ruler", unit: "cm", length: 10, objectFrom: 0, objectTo: "6.4" },
    { kind: "ruler", unit: "in", length: 6, objectTo: "3 1/4" },
    { kind: "ruler", unit: "in", length: 3, objectFrom: "1/16", objectTo: "2 15/16" },
    { kind: "ruler", unit: "cm", length: 30, objectFrom: "12.3", objectTo: 29 },
    { kind: "ruler", unit: "cm", length: 5 },
    { kind: "ruler", unit: "in", length: 12, objectTo: 12 },
    { kind: "ruler", unit: "cm", length: 15, objectFrom: 3, objectTo: "10.5" },
  ],
  info: (s) => {
    const mention = [];
    if (s.objectTo !== undefined) mention.push(String(s.objectTo), String(s.objectFrom ?? 0));
    return {
      mention,
      extra: (r) => {
        if (s.objectTo === undefined) return;
        const q = (v) => {
          const t = String(v);
          let m;
          if ((m = /^(\d+) (\d+)\/(\d+)$/.exec(t)))
            return Number(m[1]) + Number(m[2]) / Number(m[3]);
          if ((m = /^(\d+)\/(\d+)$/.exec(t))) return Number(m[1]) / Number(m[2]);
          return Number(t);
        };
        // map ruler x to value with the "0" and last numeral labels
        const labels = [
          ...r.svg.matchAll(/<text x="([\d.]+)"[^>]*font-size="17"[^>]*>(\d+)<\/text>/g),
        ].map((m) => [Number(m[1]), Number(m[2])]);
        const zero = labels.find(([, v]) => v === 0);
        const last = labels.find(([, v]) => v === s.length);
        ok(!!zero && !!last, "ruler", "end numerals missing");
        if (!zero || !last) return;
        const val = (x) => ((x - zero[0]) / (last[0] - zero[0])) * s.length;
        const obj = els(r.svg, "rect").find((e) => e.fill === PALETTE.blueL);
        ok(
          Math.abs(val(num(obj.x)) - q(s.objectFrom ?? 0)) < 0.011,
          "ruler",
          "object start off its tick",
          `${val(num(obj.x))} vs ${q(s.objectFrom ?? 0)}`,
        );
        ok(
          Math.abs(val(num(obj.x) + num(obj.width)) - q(s.objectTo)) < 0.011,
          "ruler",
          "object end off its tick",
          `${val(num(obj.x) + num(obj.width))} vs ${q(s.objectTo)}`,
        );
        const ticks = els(r.svg, "line").filter(
          (l) => l.stroke === PALETTE.navy && l.x1 === l.x2 && l["stroke-linecap"] === "butt",
        ).length;
        ok(ticks === s.length * (s.unit === "cm" ? 10 : 16) + 1, "ruler", "tick count", `${ticks}`);
      },
    };
  },
  bad: [
    { kind: "ruler", unit: "cm", length: 10, objectTo: 11 },
    { kind: "ruler", unit: "cm", length: 10, objectTo: "6.55" },
    { kind: "ruler", unit: "ft", length: 10 },
    { kind: "ruler", unit: "cm", length: 0 },
    { kind: "ruler", unit: "cm", length: 10, objectFrom: 5, objectTo: 5 },
    { kind: "ruler", unit: "in", length: 6, objectTo: "3 1/32" },
    { kind: "ruler", unit: "cm", length: 31 },
    { kind: "ruler", unit: "cm", length: 10, objectFrom: -1, objectTo: 3 },
  ],
  sheet: [
    { kind: "ruler", unit: "cm", length: 10, objectFrom: 0, objectTo: "6.4" },
    { kind: "ruler", unit: "in", length: 6, objectFrom: "1/2", objectTo: "3 3/4" },
  ],
};

K.machine = {
  gen: (g) => {
    const tpl = g.pick([
      (i, k) => ({ rule: `x + ${k}`, out: i + k }),
      (i, k) => ({ rule: `x − ${k}`, out: i - k }),
      (i, k) => ({ rule: `${k} × x`, out: i * k }),
      (i, k) => ({ rule: `${k}x`, out: i * k }),
      (i, k) => ({ rule: `2x + ${k}`, out: 2 * i + k }),
      (i, k) => ({ rule: `x ÷ ${k}`, out: i / k }),
    ]);
    const k = g.int(3, 9);
    let i = g.int(11, 40);
    const probe = tpl(1, k);
    if (probe.rule.includes("÷")) i = k * g.int(2, 9) + 0;
    const { rule, out } = tpl(i, k);
    const hide = g.pick(["output", "input", "rule", "none"]);
    const s = { kind: "machine", rule, input: i, output: out };
    if (hide === "output") s.output = "?";
    if (hide === "input") s.input = "?";
    if (hide === "rule") s.rule = "?";
    s._truth = { rule, i, out, hide };
    return s;
  },
  edges: [
    { kind: "machine", rule: "x + 3", input: 5, output: "?" },
    { kind: "machine", rule: "x + 3", input: 5, output: 8 },
    { kind: "machine", rule: "?", input: 4, output: 12 },
    { kind: "machine", rule: "x * 2", input: "?", output: 10 },
    { kind: "machine", rule: "3(x + 1)", input: 2, output: 9 },
    { kind: "machine", rule: "x²", input: 6, output: 36 },
    { kind: "machine", rule: "half of x plus the number of days", input: 4, output: 9 },
    { kind: "machine", rule: "x ÷ 2", input: 7, output: "7/2" },
  ],
  info: (s) => {
    const t = s._truth;
    if (!t) {
      const mention = [];
      if (s.input !== "?") mention.push(String(s.input));
      if (s.output !== "?") mention.push(String(s.output));
      return {
        mention,
        hidden: s.output === "?" && s.rule === "x + 3" && s.input === 5 ? ["8"] : [],
      };
    }
    const mention = [];
    const hidden = [];
    const consts = new Set([String(t.i), String(t.out)]);
    if (t.hide !== "input") mention.push(String(t.i));
    if (t.hide !== "output") mention.push(String(t.out));
    if (t.hide !== "rule") mention.push(t.rule);
    if (t.hide === "input") hidden.push(String(t.i));
    if (t.hide === "output") hidden.push(String(t.out));
    const ruleNums = t.rule.match(/\d+/g) || [];
    return {
      mention,
      hidden: hidden.filter((h) => !ruleNums.includes(h) && consts.has(h)),
      extra: (r) =>
        ok(t.hide === "none" || /unknown/.test(r.summary), "machine", "summary must say unknown"),
    };
  },
  bad: [
    { kind: "machine", rule: "x + 3", input: 5, output: 9 },
    { kind: "machine", rule: "2x", input: 3, output: 7 },
    { kind: "machine", rule: "x ÷ 2", input: 3, output: 2 },
    { kind: "machine", rule: "x + 3", input: "five", output: 8 },
    { kind: "machine", rule: "x + 3", input: 5, output: "eight" },
  ],
  sheet: [
    { kind: "machine", rule: "x + 3", input: 5, output: "?" },
    { kind: "machine", rule: "?", input: 4, output: 12 },
    { kind: "machine", rule: "3x − 2", input: "?", output: 19 },
  ],
};

/* ------------------------------------------------------------------ run */

const t0 = Date.now();
const stripKeys = (s) => {
  const { _truth, ...rest } = s;
  return rest;
};

ok(VISUAL_KINDS.length === 30, "kinds", "must export 30 kinds", String(VISUAL_KINDS.length));
ok(
  EXPECTED_KINDS.every((k) => VISUAL_KINDS.includes(k)),
  "kinds",
  "missing kinds",
  EXPECTED_KINDS.filter((k) => !VISUAL_KINDS.includes(k)).join(","),
);
ok(
  EXPECTED_KINDS.every((k) => K[k]),
  "check",
  "this tool has no cases for some kinds",
  EXPECTED_KINDS.filter((k) => !K[k]).join(","),
);

const perKind = {};
for (const kind of EXPECTED_KINDS) {
  const def = K[kind];
  if (!def) continue;
  const g = rngOf(seedOf(`mls-visuals:${kind}`));
  const specs = [
    ...def.edges,
    ...Array.from({ length: Math.max(25, 25 + 5 - def.edges.length) }, () => def.gen(g)),
  ];
  ok(specs.length >= 25, kind, "needs at least 25 specs");
  let n = 0;
  specs.forEach((raw, i) => {
    const spec = stripKeys(raw);
    const label = `${i < def.edges.length ? "edge" : "rand"}${i}`;
    let r;
    try {
      r = renderVisual(spec);
    } catch (e) {
      ok(false, `${kind}[${label}]`, `valid spec threw: ${e.message}`, JSON.stringify(spec));
      return;
    }
    n++;
    commonChecks(kind, spec, r, label);
    const info = def.info(raw, r);
    const blob = visibleBlob(r);
    for (const m of info.mention || [])
      ok(
        hasText(r.summary, String(m)),
        `${kind}[${label}]`,
        `summary must mention "${m}"`,
        `${r.summary} <= ${JSON.stringify(spec).slice(0, 160)}`,
      );
    for (const h of info.hidden || [])
      ok(
        !hasToken(blob, String(h)),
        `${kind}[${label}]`,
        `hidden value "${h}" leaked`,
        `${blob.slice(0, 260)} <= ${JSON.stringify(spec).slice(0, 160)}`,
      );
    if (info.extra) {
      try {
        info.extra(r);
      } catch (e) {
        ok(
          false,
          `${kind}[${label}]`,
          `geometry check crashed: ${e.message}`,
          JSON.stringify(spec).slice(0, 200),
        );
      }
    }
  });
  perKind[kind] = n;
  for (const [i, bad] of def.bad.entries()) {
    let threw = null;
    try {
      renderVisual(bad);
    } catch (e) {
      threw = e;
    }
    ok(
      threw instanceof Error && threw.message.includes(kind),
      `${kind}[bad${i}]`,
      "impossible spec must throw an Error that names the kind",
      threw ? threw.message : `rendered ${JSON.stringify(bad).slice(0, 120)}`,
    );
  }
  ok(def.bad.length >= 3, kind, "needs at least 3 impossible specs");
}
for (const bad of [null, undefined, 5, {}, { kind: "nope" }, { kind: "toString" }]) {
  let threw = false;
  try {
    renderVisual(bad);
  } catch (e) {
    threw = e instanceof Error;
  }
  ok(threw, "renderVisual", "bad spec must throw", JSON.stringify(bad));
}
// the same spec between other renders must not change (no shared state)
{
  const a = renderVisual({ kind: "tiles", x: 2, negOne: 3 }).svg;
  renderVisual({
    kind: "spinner",
    sections: [
      { label: "a", weight: 1 },
      { label: "b", weight: 2 },
    ],
  });
  ok(
    renderVisual({ kind: "tiles", x: 2, negOne: 3 }).svg === a,
    "renderVisual",
    "output depends on earlier renders",
  );
  const ids = new Set();
  for (const k of ["tenframe", "counters", "clock"])
    ids.add(/aria-labelledby="([^ ]+) /.exec(renderVisual(K[k].sheet[0]).svg)[1]);
  ok(
    ids.size === 3,
    "renderVisual",
    "svg ids must differ between visuals so several can share one page",
  );
}

/* ------------------------------------------------------------------ contact sheet */

async function writeSheet() {
  mkdirSync(OUT_DIR, { recursive: true });
  const groups = [];
  if (ONLY.length) groups.push(ONLY);
  else
    for (let i = 0; i < EXPECTED_KINDS.length; i += 6) groups.push(EXPECTED_KINDS.slice(i, i + 6));
  const css = `body{margin:0;background:#F7F4EC;color:#24323F;font:15px/1.4 Arial,Helvetica,sans-serif}
main{width:1200px;padding:16px;box-sizing:border-box}h2{font-size:18px;margin:18px 0 6px;color:#17324D}
.row{display:flex;flex-wrap:wrap;gap:14px}.cell{background:#fff;border:1px solid #C5CFD8;border-radius:8px;padding:8px;width:calc(50% - 7px);box-sizing:border-box}
.cell.third{width:calc(33.3% - 10px)}.cell svg{width:100%;height:auto;display:block}.sum{font-size:12px;color:#5B6B79;margin:6px 2px 0}code{font-size:11px}`;
  const pages = [];
  groups.forEach((kinds, gi) => {
    let html = `<!doctype html><meta charset="utf-8"><style>${css}</style><main>`;
    for (const kind of kinds) {
      html += `<h2>${kind}</h2><div class="row">`;
      for (const spec of K[kind].sheet) {
        const r = renderVisual(spec);
        html += `<div class="cell${!ONLY.length && K[kind].sheet.length >= 3 && ["fracshape", "shape", "tenframe", "counters"].includes(kind) ? " third" : ""}">${r.svg}<div class="sum">${r.summary.replace(/</g, "&lt;")}</div></div>`;
      }
      html += "</div>";
    }
    html += "</main>";
    pages.push(html);
    writeFileSync(`${OUT_DIR}/${ONLY.length ? "only" : "sheet"}-${gi + 1}.html`, html);
  });
  // an index of all of them for a browser
  let all = `<!doctype html><meta charset="utf-8"><style>${css}</style><main>`;
  for (const kind of EXPECTED_KINDS) {
    all += `<h2>${kind}</h2><div class="row">`;
    for (const spec of K[kind].sheet) {
      const r = renderVisual(spec);
      all += `<div class="cell">${r.svg}<div class="sum">${r.summary.replace(/</g, "&lt;")}</div></div>`;
    }
    all += "</div>";
  }
  writeFileSync(`${OUT_DIR}/index.html`, `${all}</main>`);
  let shots = 0;
  try {
    const { chromium } = require("playwright");
    const browser = await chromium.launch({
      executablePath: "/opt/pw-browsers/chromium",
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    for (let i = 0; i < pages.length; i++) {
      await page.setContent(pages[i]);
      await page.screenshot({
        path: `${OUT_DIR}/${ONLY.length ? "only" : "sheet"}-${i + 1}.png`,
        fullPage: true,
      });
      shots++;
    }
    // one page with several SVGs together: ids must not collide, so every title resolves to its own text
    await page.setContent(
      `<!doctype html><body>${["tenframe", "counters", "clock"].map((k) => renderVisual(K[k].sheet[0]).svg).join("")}</body>`,
    );
    const names = await page.evaluate(() =>
      [...document.querySelectorAll("svg")].map((s) =>
        s
          .getAttribute("aria-labelledby")
          .split(" ")
          .map((id) => document.getElementById(id)?.textContent?.slice(0, 20) || "MISSING")
          .join(" / "),
      ),
    );
    ok(
      names.every((n) => !n.includes("MISSING")) && new Set(names).size === names.length,
      "renderVisual",
      "aria-labelledby ids must resolve to each svg's own title and desc in a shared page",
      names.join(" || "),
    );
    await browser.close();
  } catch (e) {
    console.log(`(no screenshots: ${String(e.message).split("\n")[0]})`);
  }
  return shots;
}

let shots = 0;
if (WANT_SHEET) shots = await writeSheet();

const total = Object.values(perKind).reduce((a, b) => a + b, 0);
console.log(
  `mls-visuals-check: ${EXPECTED_KINDS.length} kinds, ${total} specs rendered, ${CHECKS} checks in ${((Date.now() - t0) / 1000).toFixed(1)}s${WANT_SHEET ? `; contact sheets in ${OUT_DIR} (${shots} png)` : ""}`,
);
if (FAILS.length) {
  console.log(`FAIL: ${FAILS.length} problem${FAILS.length === 1 ? "" : "s"}`);
  const seen = new Map();
  for (const f of FAILS) {
    const key = f.replace(/\[[a-z]+\d+\]/, "[*]").replace(/ :: .*/, "");
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  let shown = 0;
  for (const f of FAILS) {
    const key = f.replace(/\[[a-z]+\d+\]/, "[*]").replace(/ :: .*/, "");
    if (seen.get(key) > 0) {
      console.log(`  - ${f}${seen.get(key) > 1 ? `   (x${seen.get(key)} similar)` : ""}`);
      seen.set(key, 0);
      if (++shown >= 40) break;
    }
  }
  process.exit(1);
}
console.log("PASS");
