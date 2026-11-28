#!/usr/bin/env node
// Math Literacy Studio: check for the grades 6-8 manipulatives (access-practice-lab/src/mls/manips-b.js).
//   Part 1 (jsdom): every manipulative is mounted and driven through >= 250 states (min, max, mid, random, fractional and out-of-range
//     control values, then random action sequences). After EVERY change it proves: no exception, no error panel, the picture renders
//     (valid SVG, lab palette only, no NaN), the live summary matches the state, no NaN/undefined/[object in any text, focus returns to the
//     action button, and Reset restores the start. The MATHEMATICS is recomputed here with a separate exact-rational (BigInt) implementation
//     and compared with what the manipulative says: ratio-table rows and unit rates, double-number-line ticks and scaling, tape-diagram
//     totals, algebra-tile zero pairs and simplification, balance and equation-builder moves (the solution never changes; illegal moves are
//     refused), graphing intercepts / slope / intersections, function-machine outputs (the displayed rule is evaluated independently), the
//     transformation matrices, seeded probability trials, exact statistics, the triangle inequality, Pythagorean classification and circle
//     formulas. Nothing here imports the manipulatives' own helpers.
//   Part 2 (Playwright + Chromium): each manipulative is operated by KEYBOARD ONLY (Tab, arrows, Space, Enter, typing), the live summary must
//     change, there is no horizontal scroll at 375px, 16px text / 44px targets are measured, axe-core serious/critical = 0, and screenshots go
//     to /tmp/mls-manips-b/ (look at them).
// Usage: node tools/mls-manips-b-check.mjs [--jsdom-only] [--browser-only] [--only=id,id] [--states=250]
// Exit code 1 on any failure.
import { createRequire } from "node:module";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => (args.find((a) => a.startsWith(`--${n}=`)) || "").split("=")[1] || d;
const STATES = Number(opt("states", 250));
const ONLY = opt("only", "").split(",").filter(Boolean);
const OUT = "/tmp/mls-manips-b";
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const counts = {};
const failSeen = {};
let suppressed = 0;
const check = (name, ok, detail = "") => {
  name = name.replace(/ \((?:after actions, )?state \d+\)/, "").replace(/ at the start$/, "");
  if (!ok && (failSeen[name] = (failSeen[name] || 0) + 1) > 3) {
    suppressed++;
    return false;
  }
  results.push({ name, ok: Boolean(ok), detail });
  if (!ok) console.log(`FAIL  ${name}${detail ? `\n        ${String(detail).replace(/\n/g, "\n        ")}` : ""}`);
  return ok;
};
const tally = (id, what, n = 1) => {
  counts[id] ||= {};
  counts[id][what] = (counts[id][what] || 0) + n;
};

/* ---------------------------------------------------------------- independent exact arithmetic (BigInt) */

const bgcd = (a, b) => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a || 1n;
};
class Q {
  constructor(n, d = 1n) {
    n = BigInt(n);
    d = BigInt(d);
    if (d === 0n) throw new Error("zero denominator");
    if (d < 0n) [n, d] = [-n, -d];
    const g = bgcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }
  add = (o) => new Q(this.n * o.d + o.n * this.d, this.d * o.d);
  sub = (o) => new Q(this.n * o.d - o.n * this.d, this.d * o.d);
  mul = (o) => new Q(this.n * o.n, this.d * o.d);
  div = (o) => new Q(this.n * o.d, this.d * o.n);
  neg = () => new Q(-this.n, this.d);
  abs = () => (this.n < 0n ? this.neg() : this);
  cmp = (o) => {
    const x = this.n * o.d - o.n * this.d;
    return x < 0n ? -1 : x > 0n ? 1 : 0;
  };
  eq = (o) => this.cmp(o) === 0;
  get isInt() {
    return this.d === 1n;
  }
  num = () => Number(this.n) / Number(this.d);
  /** ASCII text, e.g. "-3/4" or "12". */
  txt = () => (this.d === 1n ? String(this.n) : `${this.n}/${this.d}`);
}
const q = (n, d = 1) => new Q(n, d);
const Q0 = q(0);
const Q1 = q(1);
/** Parse "−3/4", "1,250", "2.5", "7" (also a leading +). Returns a Q or null. */
function parseQ(str) {
  const t = String(str).trim().replace(/−/g, "-").replace(/,/g, "").replace(/^\+/, "");
  let m;
  if ((m = /^(-?\d+)\/(\d+)$/.exec(t))) return BigInt(m[2]) === 0n ? null : q(BigInt(m[1]), BigInt(m[2]));
  if ((m = /^(-?)(\d*)\.(\d+)$/.exec(t))) return q(BigInt(`${m[1]}${m[2] || "0"}${m[3]}`), 10n ** BigInt(m[3].length));
  if (/^-?\d+$/.test(t)) return q(BigInt(t));
  return null;
}
const must = (s, what = "number") => {
  const v = parseQ(s);
  if (!v) throw new Error(`cannot read ${what} from ${JSON.stringify(s)}`);
  return v;
};
/** Every number in a piece of text (fractions and decimals included). */
const numbersIn = (text) => (String(text).replace(/−/g, "-").match(/-?\d[\d,]*(?:\.\d+)?(?:\/\d+)?/g) || []).map((x) => must(x));
/** Parse a linear expression such as "3x + 4", "−x/4 − 3/2", "5" or "0" into { c, k } with exact values. */
function parseLin(str) {
  const s = String(str).replace(/−/g, "-").replace(/[\s,]+/g, "");
  if (s === "0") return { c: Q0, k: Q0 };
  let c = Q0;
  let k = Q0;
  for (const t of s.match(/[+-]?[^+-]+/g) || []) {
    const sg = t[0] === "-" ? -1n : 1n;
    const body = t.replace(/^[+-]/, "");
    if (body.includes("x")) {
      const m = /^(\d*)x(?:\/(\d+))?$/.exec(body);
      if (!m) throw new Error(`bad x-term ${t}`);
      c = c.add(new Q((m[1] === "" ? 1n : BigInt(m[1])) * sg, m[2] ? BigInt(m[2]) : 1n));
    } else k = k.add(must(body, "constant").mul(q(sg)));
  }
  return { c, k };
}

/* ---------------------------------------------------------------- jsdom + modules */

const { JSDOM } = require("jsdom");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { MANIPS, META } = await import(pathToFileURL(path.join(ROOT, "access-practice-lab/src/mls/manips-b.js")).href);
const { renderVisual, PALETTE } = await import(pathToFileURL(path.join(ROOT, "access-practice-lab/src/mls/visuals.js")).href);
const IDS = ["ratiotable", "doublenl", "tape", "algebratiles", "balance", "equationbuilder", "graphing", "machine", "transformtool", "probsim", "statviz", "construction"];
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, "access-practice-lab/content/mls/inventory.json"), "utf8"));
const wanted = inventory.manipulatives.filter((m) => m.band === "6-8").map((m) => m.id);
check("the module exports exactly the twelve 6-8 manipulatives of inventory.json", JSON.stringify([...wanted].sort()) === JSON.stringify([...IDS].sort()) && IDS.every((id) => MANIPS[id]) && Object.keys(MANIPS).length === 12, `inventory: ${wanted}`);

// small seeded generator (separate from the module's)
function rngOf(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)), pick: (a) => a[Math.floor(next() * a.length)], chance: (p = 0.5) => next() < p };
}

const sumEl = (el) => el.querySelector("[data-ml-summary]");
const S = (el) => sumEl(el).textContent;
const BAD = /NaN|undefined|\bnull\b|Infinity|\[object/;
const BAD_SUMMARY = /NaN|undefined|\bnull\b|Infinity|\[object|\bfalse\b|\btrue\b/;
const palette = new Set(Object.values(PALETTE).map((c) => c.toLowerCase()));
const mountOne = (id, opts = {}) => {
  const el = document.createElement("div");
  document.body.append(el);
  const handle = MANIPS[id].mount(el, opts);
  return { el, handle };
};
const ctl = (id, cid) => META[id].controls.find((c) => c.id === cid);
/** What a control value becomes: stepper values are rounded (to halves when step is 0.5) and clamped. */
const sv = (id, st, cid) => {
  const c = ctl(id, cid);
  const raw = Number(st[cid]);
  const v = c.step === 0.5 ? Math.round(raw * 2) / 2 : Math.round(raw);
  return Math.max(c.min, Math.min(c.max, v));
};
const act = (el, name) => el.querySelector(`[data-act="${name}"]`);
const clickAct = (id, el, name, label = "") => {
  const b = act(el, name);
  if (!b) {
    check(`${id}: action button ${name} exists ${label}`, false);
    return false;
  }
  b.click();
  const focused = document.activeElement?.getAttribute?.("data-act");
  if (focused !== name) check(`${id}: focus returns to ${name} after it is used`, false, `focus is on ${document.activeElement?.tagName}.${focused}`);
  tally(id, "actions");
  return true;
};

/** Properties every manipulative must keep in every state. */
function generic(id, el, label) {
  const err = el.querySelector(".ml-man-err");
  if (err) return check(`${id}: no error panel ${label}`, false, err.textContent);
  const sm = sumEl(el);
  if (!sm || !sm.textContent.trim()) return check(`${id}: summary present ${label}`, false);
  if (BAD_SUMMARY.test(sm.textContent)) return check(`${id}: no NaN/undefined in the summary ${label}`, false, sm.textContent);
  if (sm.getAttribute("aria-live") !== "polite") return check(`${id}: summary is a polite live region`, false);
  const visible = el.textContent;
  if (BAD.test(visible)) return check(`${id}: no NaN/undefined anywhere on screen ${label}`, false, visible.match(BAD)?.[0]);
  const svgs = [...el.querySelectorAll("svg")];
  const spec = id === "algebratiles" ? /no tiles/.test(S(el)) : false;
  if (!svgs.length && !spec) return check(`${id}: the picture renders ${label}`, false);
  for (const svg of svgs) {
    const xml = new dom.window.DOMParser().parseFromString(svg.outerHTML, "image/svg+xml");
    if (xml.querySelector("parsererror")) return check(`${id}: SVG is well-formed ${label}`, false);
    if (/NaN|undefined/.test(svg.outerHTML)) return check(`${id}: SVG has no NaN ${label}`, false);
    if (!svg.querySelector("title") || !svg.getAttribute("role")) return check(`${id}: SVG has role and title ${label}`, false);
    for (const c of svg.outerHTML.match(/#[0-9a-fA-F]{6}\b/g) || []) if (!palette.has(c.toLowerCase())) return check(`${id}: SVG uses only lab colours ${label}`, false, c);
  }
  tally(id, "generic");
  return true;
}
const cssHex = fs.readFileSync(path.join(ROOT, "access-practice-lab/mls-play-manips-b.css"), "utf8");
check("stylesheet uses no purple (every hex has a non-purple hue)", (cssHex.match(/#[0-9a-fA-F]{6}\b/g) || []).every((c) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  if (mx - mn < 0.08) return true;
  let hue = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4;
  hue = (hue * 60 + 360) % 360;
  return hue < 255 || hue > 335;
}));

/** A random value for one control, with a mix of edge, interior, fractional and out-of-range values. */
function randomValue(r, c) {
  if (c.type === "toggle") return r.chance();
  if (c.type === "choice") return r.pick(c.options)[0];
  const half = c.step === 0.5;
  const k = r.int(0, 9);
  const stepIt = (v) => (half ? Math.round(v * 2) / 2 : Math.round(v));
  if (k === 0) return c.min;
  if (k === 1) return c.max;
  if (k === 2) return stepIt((c.min + c.max) / 2);
  if (k === 3) return c.min - r.int(1, 7); // out of range (typed value that bypassed the stepper)
  if (k === 4) return c.max + r.int(1, 7);
  if (k === 5) return Math.round((c.min + (c.max - c.min) * (0.15 + r.next() * 0.7)) * 100) / 100; // fractional (typed 2.37)
  return stepIt(c.min + r.int(0, Math.round((c.max - c.min) * (half ? 2 : 1))) / (half ? 2 : 1));
}
function randomize(id, r, handle) {
  for (const c of META[id].controls) {
    handle.set(c.id, randomValue(r, c));
  }
}

/* ---------------------------------------------------------------- per-manipulative verification */

const fail = (msg) => {
  throw new Error(msg);
};
const eq = (a, b, msg) => {
  if (!(a instanceof Q ? a.eq(b) : a === b)) fail(`${msg}: got ${a instanceof Q ? a.txt() : a}, expected ${b instanceof Q ? b.txt() : b}`);
};
const rowTexts = (sum) => [...sum.matchAll(/Row (\d+): ([^.]+)\./g)].map((m) => ({ k: Number(m[1]), cells: m[2].split(/, | and /).map((x) => x.trim()) }));
const vals = (cells) => cells.map((c) => (c === "unknown" ? "unknown" : must(c)));
const cellEq = (cell, expected, what) => {
  if (expected === null) {
    if (cell !== "unknown") fail(`${what}: a hidden cell must read "unknown", got ${cell}`);
  } else eq(must(cell), q(expected), what);
};

function typeAndCheck(id, el, inputId, text) {
  const inp = el.querySelector(`#${inputId}`);
  if (!inp) fail(`${id}: answer box ${inputId} is missing`);
  inp.value = text;
  act(el, "ans-check")?.click();
}

const VERIFY = {
  ratiotable(st, el, r) {
    const a = sv("ratiotable", st, "a");
    const b = sv("ratiotable", st, "b");
    const n = sv("ratiotable", st, "rows");
    const grow = st.grow;
    const hrow = Math.min(sv("ratiotable", st, "hrow"), n);
    const hcol = Number(st.hcol);
    const base = { x2: 2, x3: 3, x5: 5 }[grow];
    const mult = (k) => (grow === "add" ? k + 1 : base ** k);
    const sum = S(el);
    const rows = rowTexts(sum);
    if (rows.length !== n) fail(`expected ${n} rows, summary has ${rows.length}`);
    rows.forEach(({ cells }, k) => {
      const exp = [mult(k), a * mult(k), b * mult(k)];
      if (cells.length !== 3) fail(`row ${k + 1} has ${cells.length} cells`);
      exp.forEach((v, c) => cellEq(cells[c], hrow === k + 1 && hcol === c ? null : v, `row ${k + 1} column ${c}`));
    });
    if (hrow === 1) {
      if (/base ratio|Unit rates/.test(sum)) fail("the base ratio is named while row 1 is hidden");
    } else {
      const rates = [...sum.matchAll(/there are ([\d,]+(?:\/\d+)?)/g)].map((m) => must(m[1]));
      eq(rates[0], q(b, a), "unit rate per 1 of the first quantity");
      eq(rates[1], q(a, b), "unit rate per 1 of the second quantity");
      if (!sum.includes(`ratio is ${a} to ${b}`)) fail("base ratio sentence is wrong");
    }
    const box = el.querySelector("#mb-ratiotable-ans");
    if (!!box !== !!hrow) fail("the answer box must exist exactly when a cell is hidden");
    if (hrow && r.chance(0.5)) {
      const ans = [mult(hrow - 1), a * mult(hrow - 1), b * mult(hrow - 1)][hcol];
      const tryOne = (text, expectOk, note) => {
        typeAndCheck("ratiotable", el, "mb-ratiotable-ans", text);
        const s2 = S(el);
        if (expectOk && !s2.startsWith("Yes.")) fail(`${note}: "${text}" should be accepted. ${s2.slice(0, 60)}`);
        if (!expectOk && s2.startsWith("Yes.")) fail(`${note}: "${text}" must not be accepted`);
        if (!expectOk && !/Not yet|Type a whole/.test(s2.slice(0, 80))) fail(`${note}: a wrong answer needs a hint, got ${s2.slice(0, 80)}`);
        const row = rowTexts(s2)[hrow - 1];
        if (row.cells[hcol] !== "unknown") fail("the hidden cell was revealed by checking");
        if (!expectOk && s2.startsWith("Not yet.") && !s2.startsWith("Not yet. Every number in a row is the same multiple of the first row, so find the multiplier first.")) fail("a wrong answer must give the conceptual hint, which names no number");
      };
      tryOne(String(ans), true, "exact integer");
      tryOne(`${ans}.0`, true, "decimal form");
      tryOne(`${ans * 2}/2`, true, "fraction form");
      tryOne(String(ans + 1), false, "wrong by one");
      tryOne("abc", false, "not a number");
      tally("ratiotable", "answer checks", 5);
    }
  },

  doublenl(st, el, r) {
    const I = (k) => sv("doublenl", st, k);
    const [a, b, jump, pairs, target] = [I("a"), I("b"), I("jump"), I("pairs"), I("target")];
    const hide = Math.min(I("hide"), pairs);
    const hline = st.hline;
    const sum = S(el);
    for (const line of ["top", "bottom"]) {
      const m = new RegExp(`The ${line} line[^.]*?shows ([^.]*)\\.`).exec(sum);
      if (!m) fail(`no ${line} line in the summary`);
      const got = m[1].split(/, | and /).map((x) => x.trim());
      if (got.length !== pairs + 1) fail(`${line}: ${got.length} ticks, expected ${pairs + 1}`);
      got.forEach((g, k) => cellEq(g, hide && hline === line && k === hide ? null : k * jump * (line === "top" ? a : b), `${line} tick ${k}`));
    }
    if (target) {
      const ans = q(b * target, a);
      const fac = q(target, a);
      if (!sum.includes(`${target} ÷ ${a}`)) fail("scale-factor sentence missing");
      const tail = /= ([\d,]+(?:\/\d+)?)(?: \((?:about )?[\d.]+\))?\.\s*$/.exec(sum);
      if (!tail) fail("the scaled value is missing at the end of the summary");
      eq(must(tail[1]), ans, "scaled value");
      const f = /÷ \d+ = ([\d,]+(?:\/\d+)?)/.exec(sum);
      eq(must(f[1]), fac, "scale factor");
    } else if (/scale factor/.test(sum)) fail("scale-factor sentence shown with target 0");
    const box = el.querySelector("#mb-doublenl-ans");
    if (!!box !== !!hide) fail("answer box must exist exactly when a tick is hidden");
    if (hide && r.chance(0.5)) {
      const ans = hide * jump * (hline === "top" ? a : b);
      typeAndCheck("doublenl", el, "mb-doublenl-ans", String(ans));
      if (!S(el).startsWith("Yes.")) fail("the right missing value was refused");
      typeAndCheck("doublenl", el, "mb-doublenl-ans", String(ans + 1));
      if (!S(el).startsWith("Not yet.")) fail("a wrong missing value was accepted");
      tally("doublenl", "answer checks", 2);
    }
  },

  tape(st, el) {
    const kind = st.kind;
    const a = sv("tape", st, "a");
    const b = sv("tape", st, "b");
    const v = sv("tape", st, "v");
    const unk = st.unknown;
    const sum = S(el);
    const U = (hid, val) => (hid ? "unknown" : String(val));
    const need = [];
    if (kind === "ratio") {
      const pa = U(unk === "first", v);
      const pb = U(unk === "second", v);
      need.push(a > 1 ? `A: ${a} equal parts of ${pa}` : `A: ${pa}`, b > 1 ? `B: ${b} equal parts of ${pb}` : `B: ${pb}`, `The total is ${U(unk === "total", (a + b) * v)}`, `Together that is ${a + b} equal parts`);
      if (unk === "none" && !sum.includes(`${a + b} × ${v} = ${(a + b) * v}`)) fail("ratio total arithmetic missing or wrong");
      if (unk !== "none" && new RegExp(`${a + b} × ${v} =`).test(sum)) fail("ratio relation gives the hidden value away");
    } else if (kind === "whole") {
      need.push(`Whole: ${U(unk === "first", a * v)} (first part), ${U(unk === "second", b * v)} (second part)`, `The total is ${U(unk === "total", (a + b) * v)}`);
      if (unk === "none" && !sum.includes(`${a * v} + ${b * v} = ${(a + b) * v}`)) fail("whole arithmetic missing");
      if (unk !== "none" && new RegExp(`${a * v} \\+ ${b * v} =`).test(sum)) fail("whole relation gives the value away");
    } else {
      const diff = Math.abs(a - b) * v;
      need.push(`A: ${U(unk === "first", a * v)}${a < b ? `, ${U(unk === "total", diff)} (difference)` : ""}`, `B: ${U(unk === "second", b * v)}${b < a ? `, ${U(unk === "total", diff)} (difference)` : ""}`);
      if (a === b) need.push("no difference");
      else if (unk === "none" && !sum.includes(`${Math.max(a, b) * v} − ${Math.min(a, b) * v} = ${diff}`)) fail("compare subtraction missing or wrong");
      else if (unk !== "none" && sum.includes(`${Math.max(a, b) * v} − ${Math.min(a, b) * v} =`)) fail("compare relation gives the value away");
    }
    for (const t of need) if (!sum.includes(t)) fail(`summary should contain "${t}"`);
    const scaleNote = (kind === "whole" && (unk === "first" || unk === "second")) || (kind === "compare" && (a === b ? unk === "first" || unk === "second" : unk !== "none"));
    if (scaleNote !== /not drawn to scale/.test(sum)) fail(`the "not drawn to scale" note should be ${scaleNote ? "present" : "absent"}`);
  },

  algebratiles(st, el, r) {
    const [x, nx, one, no] = ["x", "negX", "one", "negOne"].map((k) => sv("algebratiles", st, k));
    const xv = sv("algebratiles", st, "xval");
    const sum = S(el);
    const simp = /Simplified: ([^.]+)\./.exec(sum);
    const { c, k } = parseLin(simp[1]);
    eq(c, q(x - nx), "simplified x coefficient");
    eq(k, q(one - no), "simplified constant");
    const zp = /Zero pairs: (\d+) pairs? of x and −x, and (\d+) pairs? of 1/.exec(sum);
    if (Number(zp[1]) !== Math.min(x, nx) || Number(zp[2]) !== Math.min(one, no)) fail(`zero pair counts ${zp[1]}, ${zp[2]}`);
    const val = /gives (−?[\d,]+), and the simplified expression gives (−?[\d,]+)/.exec(sum);
    const truth = x * xv - nx * xv + one - no;
    eq(must(val[1]), q(truth), "value counting every tile");
    eq(must(val[2]), q(truth), "value of the simplified expression");
    if (x + nx + one + no === 0 !== /no tiles/.test(sum)) fail("empty-mat message wrong");
    if (r.chance(0.6)) {
      // remove zero pairs
      clickAct("algebratiles", el, "zero");
      const s2 = handleOf(el).state;
      const [x2, nx2, one2, no2] = ["x", "negX", "one", "negOne"].map((kk) => sv("algebratiles", s2, kk));
      if (Math.min(x2, nx2) !== 0 || Math.min(one2, no2) !== 0) fail("zero pairs remain after removing them");
      if (x2 - nx2 !== x - nx || one2 - no2 !== one - no) fail("removing zero pairs changed the simplified expression");
      if (x2 !== x - Math.min(x, nx) || one2 !== one - Math.min(one, no)) fail("removing zero pairs removed the wrong tiles");
      tally("algebratiles", "zero-pair removals");
    }
    if (r.chance(0.5)) {
      const before = handleOf(el).state;
      const bx = sv("algebratiles", before, "x");
      const bnx = sv("algebratiles", before, "negX");
      clickAct("algebratiles", el, "addx");
      const after = handleOf(el).state;
      const ax = sv("algebratiles", after, "x");
      const anx = sv("algebratiles", after, "negX");
      if (bx >= 12 || bnx >= 12) {
        if (ax !== bx || anx !== bnx) fail("a full mat grew");
        if (!S(el).startsWith("No room")) fail("a full mat needs an explanation");
      } else {
        if (ax !== bx + 1 || anx !== bnx + 1) fail("adding a zero pair must add one x and one −x");
        if (ax - anx !== bx - bnx) fail("adding a zero pair changed the value");
      }
      clickAct("algebratiles", el, "add1");
      tally("algebratiles", "zero-pair additions");
    }
  },
};

/** The page keeps ONE slot of moves per puzzle key (it is used only while the key matches). This mirrors that, independently. */
function view(el, name, key, init) {
  const m = el[name];
  return m && m.key === key ? m : { key, ...init() };
}
function claim(el, name, key, init) {
  const m = el[name];
  if (m && m.key === key) return m;
  return (el[name] = { key, ...init() });
}
// the handle for an element (set by drive())
const HANDLES = new WeakMap();
const handleOf = (el) => HANDLES.get(el);

/* ---- balance: a separate model of the legal moves */
const BIG = 10n ** 7n;
const small = (v) => (v.n < 0n ? -v.n : v.n) <= BIG && v.d <= BIG;
function eqParse(txt) {
  const [l, r] = txt.split(" = ");
  return { l: parseLin(l), r: parseLin(r) };
}
const balSolve = (A, B, C, D) => (A.eq(C) ? (B.eq(D) ? "all" : "none") : D.sub(B).div(A.sub(C)));
VERIFY.balance = function (st, el, r) {
  const [a, b, c, d] = ["a", "b", "c", "d"].map((k) => sv("balance", st, k));
  const sum = S(el);
  const m = /The equation is ([^.]+)\./.exec(sum);
  const { l, r: rr } = eqParse(m[1]);
  const key = [a, b, c, d].join("|");
  const init = () => ({ eq: [q(a), q(b), q(c), q(d)], ops: 0, hist: [] });
  const mod = view(el, "__bal", key, init);
  const [A, B, C, D] = mod.eq;
  eq(l.c, A, "left x coefficient");
  eq(l.k, B, "left constant");
  eq(rr.c, C, "right x coefficient");
  eq(rr.k, D, "right constant");
  // the solution never changes
  const sol0 = balSolve(q(a), q(b), q(c), q(d));
  const solNow = balSolve(A, B, C, D);
  if (sol0 instanceof Q ? !(solNow instanceof Q && solNow.eq(sol0)) : solNow !== sol0) fail(`the solution changed after the moves: ${sol0?.txt?.() ?? sol0} vs ${solNow?.txt?.() ?? solNow}`);
  const isolated = (A.eq(Q1) && B.eq(Q0) && C.eq(Q0)) || (A.eq(Q0) && C.eq(Q1) && D.eq(Q0));
  const alone = /x is alone, so the solution is x = ([^\s.]+(?:\/\d+)?)/.exec(sum);
  if (!!alone !== isolated) fail(`"x is alone" shown wrongly (isolated ${isolated})`);
  if (alone) eq(must(alone[1]), sol0, "isolated solution");
  if (/every value of x/.test(sum) !== (sol0 === "all")) fail("identity message wrong");
  if (/no solution/.test(sum) !== (sol0 === "none")) fail("no-solution message wrong");
  // the beam
  const tn = sv("balance", st, "tn");
  const td = sv("balance", st, "td");
  const beam = (L, R) => {
    const vs = /left side totals ([^\s]+) and the right side totals ([^\s]+), so the scale (is level|tilts down on the (left|right))/.exec(sum);
    if (!vs) fail("the picture summary lacks the numeric totals");
    eq(must(vs[1]), L, "picture left total");
    eq(must(vs[2]), R, "picture right total");
    const dir = L.eq(R) ? "is level" : L.cmp(R) > 0 ? "tilts down on the left" : "tilts down on the right";
    if (vs[3] !== dir) fail(`beam: ${vs[3]} but the totals say ${dir}`);
  };
  if (st.trial) {
    const t = q(tn, td);
    const L = A.mul(t).add(B);
    const R = C.mul(t).add(D);
    const tv = /left side is (−?[\d,]+(?:\/\d+)?)(?: \([^)]*\))? and the right side is (−?[\d,]+(?:\/\d+)?)/.exec(sum);
    eq(must(tv[1]), L, "trial left total");
    eq(must(tv[2]), R, "trial right total");
    const level = L.eq(R);
    if (/not level/.test(sum) === level || (!level && !/is not a solution/.test(sum)) || (level && !/is a solution/.test(sum))) fail("trial verdict wrong");
    beam(L, R);
  } else if (A.eq(Q0) && C.eq(Q0)) beam(B, D); // no x anywhere: every token is a number, so the beam follows the true totals
  else if (/tilts/.test(sum) || !/The scale is level\./.test(sum)) fail("with an unknown x the scale must stay level");
  const lines = [...el.querySelectorAll(".ml-mb-log li")].map((li) => li.textContent);
  if (lines.length !== mod.ops + 1) fail(`step log has ${lines.length} lines for ${mod.ops} moves`);
  // random moves
  const steps = r.int(0, 4);
  for (let i = 0; i < steps; i++) {
    const amt = sv("balance", handleOf(el).state, "amount");
    const t = r.pick(["addn", "subn", "addx", "subx", "div", "undo"]);
    const cur = view(el, "__bal", key, init);
    const [pa, pb, pc, pd] = cur.eq;
    let next = null;
    let refused = false;
    if (t === "undo") {
      if (!cur.ops) refused = true;
      else next = cur.hist[cur.hist.length - 1];
    } else if (amt === 0 || cur.ops >= 10) refused = true;
    else {
      const k = q(amt);
      next = { addn: [pa, pb.add(k), pc, pd.add(k)], subn: [pa, pb.sub(k), pc, pd.sub(k)], addx: [pa.add(k), pb, pc.add(k), pd], subx: [pa.sub(k), pb, pc.sub(k), pd], div: [pa.div(k), pb.div(k), pc.div(k), pd.div(k)] }[t];
      if (!next.every(small)) {
        refused = true;
        next = null;
      }
    }
    clickAct("balance", el, t);
    if (refused) {
      if (!/^(Not allowed|Adding or subtracting 0|The balance records|There is no move|That would make)/.test(S(el))) fail(`move ${t} (amount ${amt}) should be refused with a reason, got ${S(el).slice(0, 80)}`);
    } else {
      const mm = claim(el, "__bal", key, init);
      if (t === "undo") {
        mm.hist.pop();
        mm.ops--;
      } else {
        mm.hist.push(mm.eq);
        mm.ops++;
      }
      mm.eq = next;
    }
    tally("balance", refused ? "refused moves" : "legal moves");
    VERIFY.balance(handleOf(el).state, el, { chance: () => false, int: () => 0, pick: (x) => x[0] });
  }
};

/* ---- equation builder */
const EQSTART = (form, a, b, c) => ({ add: [Q1, q(b), q(c)], mul: [q(a), Q0, q(c)], div: [q(1, a), Q0, q(c)], two: [q(a), q(b), q(c)], twodiv: [q(1, a), q(b), q(c)] })[form];
const EQSOL = (form, a, b, c) => ({ add: q(c - b), mul: q(c, a), div: q(c * a), two: q(c - b, a), twodiv: q((c - b) * a) })[form];
VERIFY.equationbuilder = function (st, el, r) {
  const form = st.form;
  let a = sv("equationbuilder", st, "a");
  if (a === 0) a = 1;
  const b = sv("equationbuilder", st, "b");
  const c = sv("equationbuilder", st, "c");
  const sum = S(el);
  const key = [form, a, b, c].join("|");
  const init = () => ({ eq: EQSTART(form, a, b, c), ops: 0, hist: [] });
  const mod = view(el, "__eb", key, init);
  const now = /The equation now is ([^.]+)\./.exec(sum);
  const [lhs, rhs] = now[1].split(" = ");
  const { c: P, k: Qc } = parseLin(lhs);
  const R = must(rhs);
  const [eP, eQ, eR] = mod.eq;
  eq(P, eP, "x coefficient");
  eq(Qc, eQ, "constant");
  eq(R, eR, "right side");
  const x0 = EQSOL(form, a, b, c);
  eq(eR.sub(eQ).div(eP), x0, "the solution of the current equation");
  const solved = eP.eq(Q1) && eQ.eq(Q0);
  const m = /x is alone: x = ([^\s.]+(?:\/\d+)?)/.exec(sum);
  if (!!m !== solved) fail("solved message wrong");
  if (m) {
    eq(must(m[1]), x0, "solution shown");
    if (!/They match\./.test(sum)) fail("the substitution check must match");
  }
  const logged = /Steps so far: (.+?)\. The equation now/.exec(sum);
  const nLog = logged ? logged[1].split("; ").length : 0;
  if (nLog !== mod.ops) fail(`step log has ${nLog} steps for ${mod.ops} moves`);
  const trs = tableRows(el);
  void trs;
  const n = r.int(0, 4);
  for (let i = 0; i < n; i++) {
    const s2 = handleOf(el).state;
    const amt = sv("equationbuilder", s2, "amount");
    const left = s2.side === "left";
    const t = r.pick(["add", "sub", "mul", "div", "undo"]);
    const cur = view(el, "__eb", key, init);
    const [p0, q0, r0] = cur.eq;
    let next = null;
    let ok = true;
    if (t === "undo") {
      ok = cur.ops > 0;
      if (ok) next = cur.hist[cur.hist.length - 1];
    } else if (left || amt === 0 || cur.ops >= 10) ok = false;
    else {
      const k = q(amt);
      next = { add: [p0, q0.add(k), r0.add(k)], sub: [p0, q0.sub(k), r0.sub(k)], mul: [p0.mul(k), q0.mul(k), r0.mul(k)], div: [p0.div(k), q0.div(k), r0.div(k)] }[t];
      if (!next.every(small)) ok = false;
    }
    clickAct("equationbuilder", el, t);
    const note = S(el);
    if (!ok) {
      if (!/^(Not allowed|Adding or subtracting 0|The log holds|There is no move|That would make)/.test(note)) fail(`${t} (amount ${amt}, ${left ? "left only" : "both"}) must be refused with a reason, got ${note.slice(0, 80)}`);
      if (left && t !== "undo" && !/the two sides are no longer equal/.test(note)) fail("changing one side only must explain why it is not allowed");
    } else {
      const mm = claim(el, "__eb", key, init);
      if (t === "undo") {
        mm.hist.pop();
        mm.ops--;
      } else {
        mm.hist.push(mm.eq);
        mm.ops++;
      }
      mm.eq = next;
    }
    tally("equationbuilder", ok ? "legal moves" : "refused moves");
    VERIFY.equationbuilder(handleOf(el).state, el, { chance: () => false, int: () => 0, pick: (x) => x[0] });
  }
};

/* ---- graphing */
const inWin = (v) => v.abs().cmp(q(10)) <= 0;
VERIFY.graphing = function (st, el) {
  const g = (mn, md, bn, bd) => ({ m: q(sv("graphing", st, mn), sv("graphing", st, md)), b: q(sv("graphing", st, bn), sv("graphing", st, bd)) });
  const sum = S(el);
  const L1 = g("mn", "md", "bn", "bd");
  const lines = [L1];
  if (st.two) lines.push(g("m2n", "m2d", "b2n", "b2d"));
  if (!st.two && /Line 2/.test(sum)) fail("line 2 shown while the toggle is off");
  lines.forEach((L, i) => {
    const m = new RegExp(`Line ${i + 1}: y = ([^.]+)\\.`).exec(sum);
    const { c, k } = parseLin(m[1]);
    eq(c, L.m, `line ${i + 1} slope`);
    eq(k, L.b, `line ${i + 1} y-intercept`);
    const yi = new RegExp(`Line ${i + 1}:[^]*?y-intercept is \\(0, ([^)]+)\\)`).exec(sum);
    eq(must(yi[1]), L.b, "y-intercept readout");
    if (L.m.n !== 0n) {
      const seg = sum.slice(sum.indexOf(`Line ${i + 1}:`), i === 0 && st.two ? sum.indexOf("Line 2:") : undefined);
      const xi = /x-intercept is \(([^,]+), 0\)/.exec(seg);
      eq(must(xi[1]), L.b.neg().div(L.m), "x-intercept");
      const sl = /The slope is ([^:]+):/.exec(seg);
      eq(must(sl[1]), L.m, "slope readout");
      const rate = /rate of change is ([^\s]+) units?/.exec(seg);
      eq(must(rate[1]), L.m, "rate readout");
    } else if (!/flat/.test(sum)) fail("a slope of 0 must say the line is flat");
  });
  if (st.two) {
    const [A, B] = lines;
    if (A.m.eq(B.m)) {
      const sameLine = A.b.eq(B.b);
      if (sameLine !== /the same line/.test(sum) || sameLine === /parallel/.test(sum)) fail("same/parallel classification wrong");
    } else {
      const x = B.b.sub(A.b).div(A.m.sub(B.m));
      const y = A.m.mul(x).add(A.b);
      const m = /meet at exactly one point, \(([^,]+), ([^)]+)\)/.exec(sum);
      if (!m) fail("intersection missing");
      eq(must(m[1]), x, "intersection x");
      eq(must(m[2]), y, "intersection y");
      // it lies on both lines
      if (!A.m.mul(x).add(A.b).eq(y) || !B.m.mul(x).add(B.b).eq(y)) fail("intersection is not on both lines");
      if ((/marked P/.test(sum)) !== (inWin(x) && inWin(y))) fail("point P shown/hidden wrongly for the window");
    }
  }
};

/* ---- machine: an independent evaluator for the DISPLAYED rule text */
function evalText(text, xv) {
  const src = text.replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/²/g, "^2").replace(/\s+/g, "");
  const toks = src.match(/\d+|x|\^|[-+*/()]/g);
  if (!toks || toks.join("") !== src) fail(`cannot read rule ${text}`);
  let i = 0;
  const atom = () => {
    const t = toks[i++];
    if (t === "(") {
      const v = expr();
      if (toks[i++] !== ")") fail("missing )");
      return v;
    }
    if (t === "-") return atom().neg();
    if (t === "x") return xv;
    if (/^\d+$/.test(t)) return q(BigInt(t));
    return fail(`unexpected ${t}`);
  };
  const pow = () => {
    let v = atom();
    while (toks[i] === "^") {
      i++;
      const e = Number(toks[i++]);
      let r = Q1;
      for (let k = 0; k < e; k++) r = r.mul(v);
      v = r;
    }
    return v;
  };
  const term = () => {
    let v = pow();
    while (toks[i] === "*" || toks[i] === "/") {
      const op = toks[i++];
      const w = pow();
      v = op === "*" ? v.mul(w) : v.div(w);
    }
    return v;
  };
  const expr = () => {
    let v = term();
    while (toks[i] === "+" || toks[i] === "-") {
      const op = toks[i++];
      const w = term();
      v = op === "+" ? v.add(w) : v.sub(w);
    }
    return v;
  };
  const v = expr();
  if (i !== toks.length) fail(`trailing text in rule ${text}`);
  return v;
}
const MEXP = { add: (x, p) => x.add(q(p)), multiply: (x, p) => x.mul(q(p)), divide: (x, p) => x.div(q(p === 0 ? 1 : p)), linear: (x, p, qq) => x.mul(q(p)).add(q(qq)), square: (x, _p, qq) => x.mul(x).add(q(qq)) };
const tableRows = (el) => [...el.querySelectorAll("table.ml-mb-table tbody tr")].map((tr) => [...tr.children].map((c) => c.textContent.trim()));
VERIFY.machine = function (st, el, r) {
  const mode = st.mode === "guess" ? "guess" : "show";
  let p = sv("machine", st, "p");
  if (st.rule === "divide" && p === 0) p = 1;
  const qq = sv("machine", st, "q");
  const input = sv("machine", st, "input");
  const fnMine = (x) => MEXP[st.rule](x, p, qq);
  const sum = S(el);
  const io = /The input is ([^\s]+) and the output is ([^\s.]+(?:\/\d+)?)\./.exec(sum);
  eq(must(io[1]), q(input), "input");
  const rows = tableRows(el);
  const key = mode === "guess" ? `guess|${sv("machine", st, "seed")}` : `show|${st.rule}|${p}|${qq}`;
  const mod = (el.__mc ||= { fedKey: "", fed: [], commitKey: "" });
  const fedNow = mod.fedKey === key ? mod.fed : [];
  const committedNow = mod.commitKey === key;
  let ruleText;
  if (mode === "show") {
    ruleText = /The machine rule is ([^.]+)\./.exec(sum)[1];
    for (let x = -10; x <= 10; x++) eq(evalText(ruleText, q(x)), fnMine(q(x)), `rule "${ruleText}" at input ${x}`);
  } else if (committedNow) {
    ruleText = /machine's rule was ([^.]+)\./.exec(sum)[1];
  } else {
    if (/machine's rule was|The machine rule is/.test(sum)) fail("the hidden rule is shown before the guess is committed");
    if (!/hidden/.test(sum)) fail("guess mode should say the rule is hidden");
    const svg = el.querySelector("svg")?.outerHTML || "";
    if (!/Rule/.test(svg)) fail("the machine picture lost its Rule label");
  }
  if (ruleText) eq(must(io[2]), evalText(ruleText, q(input)), "displayed output equals the displayed rule");
  if (rows.length !== fedNow.length) fail(`table has ${rows.length} rows, expected ${fedNow.length}`);
  rows.forEach((row, k) => {
    const x = fedNow[k];
    eq(must(row[0]), q(x), "table input");
    if (ruleText) eq(must(row[1]), evalText(ruleText, q(x)), `table output at ${x}`);
    if (mode === "guess") {
      eq(must(row[2]), fnMine(q(x)), `my rule's output at ${x}`);
      const same = must(row[1]).eq(must(row[2]));
      if ((same && !/same/.test(row[3])) || (!same && !/different/.test(row[3]))) fail(`same/different mark wrong at ${x}`);
      if (!/✓|✗/.test(row[3])) fail("the match column needs a mark, not only colour");
    }
  });
  const n = r.int(0, 4);
  for (let i = 0; i < n; i++) {
    const s2 = handleOf(el).state;
    const x = sv("machine", s2, "input");
    const t = r.pick(["feed", "feed", "clear", "commit"]);
    if (t === "commit" && (mode !== "guess" || mod.commitKey === key)) continue;
    if (t === "commit") {
      clickAct("machine", el, "commit");
      mod.commitKey = key;
      const s3 = S(el);
      const real = /machine's rule was ([^.]+)\./.exec(s3)[1];
      let diff = null;
      for (let k = -10; k <= 10 && diff === null; k++) if (!evalText(real, q(k)).eq(fnMine(q(k)))) diff = k;
      if (diff === null && !/equivalent to the machine's rule/.test(s3)) fail("an equivalent guess must be accepted");
      if (diff !== null) {
        if (!/not the same rule/.test(s3)) fail("a different guess must be reported");
        const m = /for input (-?\d+|−\d+) the machine gives ([^\s]+) but your rule gives ([^\s.]+(?:\/\d+)?)\./.exec(s3);
        eq(must(m[1]), q(diff), "first input where the guess differs");
        eq(must(m[2]), evalText(real, q(diff)), "machine output at the counterexample");
        eq(must(m[3]), fnMine(q(diff)), "guess output at the counterexample");
      }
      tally("machine", "commits");
    } else if (t === "feed") {
      const cur = mod.fedKey === key ? mod.fed : [];
      clickAct("machine", el, "feed");
      if (cur.includes(x)) {
        if (!/already in the table/.test(S(el))) fail("feeding a repeated input must say so");
      } else if (cur.length >= 12) {
        if (!/table is full/.test(S(el))) fail("a full table must say so");
      } else Object.assign(mod, { fedKey: key, fed: [...cur, x] });
    } else {
      clickAct("machine", el, "clear");
      Object.assign(mod, { fedKey: key, fed: [] });
    }
    VERIFY.machine(handleOf(el).state, el, { chance: () => false, int: () => 0, pick: (a) => a[0] });
  }
};

/* ---- transformtool */
const PRESETS = { t1: [[1, 1], [4, 1], [1, 3]], t2: [[2, 2], [5, 3], [3, 5]], t3: [[-3, 1], [-1, 1], [-2, 4]], t4: [[1, -2], [4, -2], [4, -4]] };
const applyT = (pts, op) =>
  pts.map(([x, y]) => ({ translate: () => [x.add(q(op.dx)), y.add(q(op.dy))], rx: () => [x, y.neg()], ry: () => [x.neg(), y], ccw: () => [y.neg(), x], cw: () => [y, x.neg()], dilate: () => [x.mul(q(op.n, op.d)), y.mul(q(op.n, op.d))] })[op.t]());
const area2 = (p) => p[1][0].sub(p[0][0]).mul(p[2][1].sub(p[0][1])).sub(p[2][0].sub(p[0][0]).mul(p[1][1].sub(p[0][1])));
const coordsIn = (txt) => [...txt.matchAll(/\(([^,()]+), ([^()]+)\)/g)].map((m) => [must(m[1]), must(m[2])]);
VERIFY.transformtool = function (st, el, r) {
  const tri = st.tri;
  const slotT = (el.__tf ||= { tri: "", ops: [] });
  const mod = { ops: slotT.tri === tri ? slotT.ops : [] };
  const pre = PRESETS[tri].map(([x, y]) => [q(x), q(y)]);
  let img = pre;
  for (const op of mod.ops) img = applyT(img, op);
  const sum = S(el);
  const pm = /Preimage: ([^.]+\))\./.exec(sum);
  const preGot = coordsIn(pm[1]);
  pre.forEach((p, i) => {
    eq(preGot[i][0], p[0], "preimage x");
    eq(preGot[i][1], p[1], "preimage y");
  });
  if (mod.ops.length) {
    const im = new RegExp(`Image after ${mod.ops.length} moves?: ([^]*?\\))\\.`).exec(sum);
    if (!im) fail(`image line missing for ${mod.ops.length} moves`);
    const got = coordsIn(im[1]);
    img.forEach((p, i) => {
      eq(got[i][0], p[0], `image x of vertex ${i}`);
      eq(got[i][1], p[1], `image y of vertex ${i}`);
    });
    // the picture agrees too
    const poly = /polygon labelled image with vertices A′ \(([^)]+)\), B′ \(([^)]+)\) and C′ \(([^)]+)\)/.exec(sum);
    if (!poly) fail("picture summary lacks the image polygon");
    [1, 2, 3].forEach((k, i) => {
      const [x, y] = poly[k].split(", ").map((t) => must(t));
      eq(x, img[i][0], "picture x");
      eq(y, img[i][1], "picture y");
    });
    let K = Q1;
    for (const op of mod.ops) if (op.t === "dilate") K = K.mul(q(op.n, op.d));
    if (K.eq(Q1) !== /congruent to the preimage/.test(sum)) fail("congruence statement wrong");
    if (!K.eq(Q1)) {
      const f = /Every side length is ([^\s]+)(?: \([^)]*\))? times.*area is ([^\s]+)(?: \([^)]*\))? times/.exec(sum);
      eq(must(f[1]), K, "scale factor");
      eq(must(f[2]), K.mul(K), "area factor");
    }
    const flipped = Math.sign(Number(area2(pre).n)) !== Math.sign(Number(area2(img).n));
    if (flipped !== /mirror image/.test(sum)) fail("orientation statement wrong");
  } else if (!/No moves yet/.test(sum)) fail("no-move message missing");
  const n = r.int(0, 4);
  for (let i = 0; i < n; i++) {
    const s2 = handleOf(el).state;
    mod.ops = slotT.tri === tri ? slotT.ops : [];
    img = pre;
    for (const o2 of mod.ops) img = applyT(img, o2);
    const op = r.pick([
      { t: "translate", dx: sv("transformtool", s2, "dx"), dy: sv("transformtool", s2, "dy") },
      { t: "rx" },
      { t: "ry" },
      { t: "ccw" },
      { t: "cw" },
      { t: "dilate", n: sv("transformtool", s2, "sn"), d: sv("transformtool", s2, "sd") },
      { t: "undo" },
    ]);
    let next = null;
    let ok = true;
    if (op.t === "undo") ok = mod.ops.length > 0;
    else if (mod.ops.length >= 12 || (op.t === "dilate" && op.n === op.d) || (op.t === "translate" && op.dx === 0 && op.dy === 0)) ok = false;
    else {
      next = applyT(img, op);
      if (next.flat().some((v) => v.abs().cmp(q(100)) > 0)) ok = false;
    }
    clickAct("transformtool", el, op.t === "undo" ? "undo" : op.t);
    if (!ok) {
      if (!/^(The tool records|A scale factor of 1|Translating by|That move would|There is no move)/.test(S(el))) fail(`move ${op.t} should be refused with a reason, got ${S(el).slice(0, 90)}`);
    } else if (op.t === "undo") Object.assign(slotT, { tri, ops: mod.ops.slice(0, -1) });
    else Object.assign(slotT, { tri, ops: [...mod.ops, op] });
    tally("transformtool", ok ? "legal moves" : "refused moves");
    VERIFY.transformtool(handleOf(el).state, el, { chance: () => false, int: () => 0, pick: (a) => a[0] });
  }
};

/* ---- probsim */
VERIFY.probsim = function (st, el, r) {
  const device = st.device;
  const nSec = sv("probsim", st, "n");
  const names = device === "cube" ? ["1", "2", "3", "4", "5", "6"] : device === "coin" ? ["Heads", "Tails"] : ["Red", "Blue", "Green", "Yellow", "Orange", "Brown"].slice(0, nSec);
  const w1 = sv("probsim", st, "w1");
  const w2 = sv("probsim", st, "w2");
  const w = names.map((_, i) => (i === 0 ? w1 : i === 1 ? w2 : 1));
  const W = w.reduce((a, b) => a + b, 0);
  const tgt = Math.min(sv("probsim", st, "target"), names.length) - 1;
  const key = [device, names.length, w1, w2, sv("probsim", st, "seed")].join("|");
  const slotP = (el.__ps ||= { key: "", n: 0 });
  const mod = { n: slotP.key === key ? slotP.n : 0 };
  const sum = S(el);
  const th = /theoretical probability is (\d+) out of (\d+), which is ([^\s]+) as a fraction and ([^\s]+)(?: \(rounded\))? as a decimal/.exec(sum);
  if (Number(th[1]) !== w[tgt] || Number(th[2]) !== W) fail("theoretical weights");
  eq(must(th[3]), q(w[tgt], W), "theoretical fraction");
  const dv = must(th[4]).sub(q(w[tgt], W)).abs().num();
  if (dv > 0.0005) fail(`theoretical decimal is off by ${dv}`);
  const N = mod.n;
  const after = /After (\d+) trials?: ([^.]+)\./.exec(sum);
  if (N === 0 ? !!after : !after) fail("trial count line wrong");
  if (after) {
    if (Number(after[1]) !== N) fail(`trial count ${after[1]}, expected ${N}`);
    const cnt = after[2].split(", ").map((t) => Number(t.split(" ").pop()));
    if (cnt.length !== names.length || cnt.reduce((a, b) => a + b, 0) !== N) fail("counts do not add up to the number of trials");
    const ex = /experimental probability of [^\s]+ is (\d+) out of (\d+), which is ([^\s]+) as a fraction and ([^\s]+)/.exec(sum);
    if (Number(ex[1]) !== cnt[tgt]) fail("experimental count differs from the table");
    eq(must(ex[3]), q(cnt[tgt], N), "experimental fraction");
    if (must(ex[4]).sub(q(cnt[tgt], N)).abs().num() > 0.0005) fail("experimental decimal");
    // the table in the page says the same
    const rows = tableRows(el);
    rows.forEach((row, i) => {
      if (Number(row[3]) !== cnt[i]) fail("table count differs from summary");
      eq(must(row[2].split(" = ")[0]), q(w[i], W), "table theoretical fraction");
    });
    if (N >= 300) {
      // a fair seeded generator: every count within 6 standard deviations
      cnt.forEach((c, i) => {
        const p = w[i] / W;
        const sd = Math.sqrt(N * p * (1 - p));
        if (Math.abs(c - N * p) > 6 * sd) fail(`count ${c} of ${names[i]} is far from ${N * p} (${sd.toFixed(1)} sd)`);
      });
    }
    el.__psCounts = cnt;
  } else if (!/No trials yet/.test(sum)) fail("no-trials message missing");
  const bars = [...el.querySelectorAll("svg")].map((s) => s.querySelector("desc")?.textContent || "").join(" ");
  if (device === "spinner" && !/spinner with/.test(bars)) fail("the spinner picture is missing");
  const steps = r.int(0, 3);
  for (let i = 0; i < steps; i++) {
    const k = r.pick([1, 10, 100, 0]);
    const cur = slotP.key === key ? slotP.n : 0;
    if (k === 0) {
      clickAct("probsim", el, "clear");
      Object.assign(slotP, { key, n: 0 });
    } else {
      clickAct("probsim", el, `run${k}`);
      if (cur < 1000) Object.assign(slotP, { key, n: Math.min(1000, cur + k) });
    }
    VERIFY.probsim(handleOf(el).state, el, { chance: () => false, int: () => 0, pick: (a) => a[0] });
  }
};

/* ---- statviz: exact statistics, computed separately */
function exactStats(vals) {
  const a = vals.map((v) => q(v)).sort((x, y) => x.cmp(y));
  const n = a.length;
  const med = (arr) => (arr.length % 2 ? arr[(arr.length - 1) / 2] : arr[arr.length / 2 - 1].add(arr[arr.length / 2]).div(q(2)));
  const mean = a.reduce((x, y) => x.add(y), Q0).div(q(n));
  const lo = a.slice(0, Math.floor(n / 2));
  const hi = a.slice(Math.floor(n / 2) + (n % 2));
  const median = med(a);
  const q1 = lo.length ? med(lo) : median;
  const q3 = hi.length ? med(hi) : median;
  const iqr = q3.sub(q1);
  const f = new Map();
  vals.forEach((v) => f.set(v, (f.get(v) || 0) + 1));
  const top = Math.max(...f.values());
  const mode = top > 1 ? [...f].filter(([, c]) => c === top).map(([v]) => v).sort((x, y) => x - y) : [];
  const mad = a.reduce((x, y) => x.add(y.sub(mean).abs()), Q0).div(q(n));
  const fl = q1.sub(iqr.mul(q(3, 2)));
  const fh = q3.add(iqr.mul(q(3, 2)));
  return { mean, median, q1, q3, iqr, range: a[n - 1].sub(a[0]), mad, mode, outliers: a.filter((v) => v.cmp(fl) < 0 || v.cmp(fh) > 0).map((v) => Number(v.n)), fl, fh, min: a[0], max: a[n - 1] };
}
const DEFAULT_DATA = [2, 4, 4, 5, 6, 7, 7, 8, 9];
VERIFY.statviz = function (st, el, r) {
  const mod = (el.__sv ||= { data: DEFAULT_DATA });
  const ex = sv("statviz", st, "extra");
  const useExtra = !!st.withExtra && mod.data.length < 15;
  const data = useExtra ? [...mod.data, ex] : mod.data;
  const E = exactStats(data);
  const sum = S(el);
  const head = /Data \((\d+) values?\): ([^.]+)\./.exec(sum);
  if (Number(head[1]) !== data.length || JSON.stringify(head[2].split(", ").map(Number)) !== JSON.stringify([...data].sort((a, b) => a - b))) fail("data list differs from the data");
  const mm = /Measures: (.+?)\. Quartiles: first ([^,]+), third ([^.]+)\./.exec(sum);
  if (!mm) fail(`measures sentence not found in: ${sum.slice(0, 300)}`);
  const parts = mm[1].split("; ").map((t) => t.replace(/^(mean|median|mode|range|IQR|MAD) /, ""));
  const ms = [null, parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], mm[2], mm[3]];
  const first = (t) => must(t.trim().split(" ")[0]);
  const near = (t, Qv, what) => {
    eq(first(t), Qv, what);
    const dm = /\((?:about )?(−?[\d.]+)\)/.exec(t);
    if (dm && must(dm[1]).sub(Qv).abs().num() > 0.0006) fail(`${what}: decimal ${dm[1]} vs ${Qv.num()}`);
  };
  near(ms[1], E.mean, "mean");
  near(ms[2], E.median, "median");
  near(ms[4], E.range, "range");
  near(ms[5], E.iqr, "IQR");
  near(ms[6], E.mad, "MAD");
  eq(first(ms[7]), E.q1, "first quartile");
  eq(first(ms[8]), E.q3, "third quartile");
  const modeNums = E.mode.length ? ms[3].split(/, | and /).map(Number) : null;
  if (E.mode.length ? JSON.stringify(modeNums) !== JSON.stringify(E.mode) : !/^none/.test(ms[3])) fail(`mode ${ms[3]} vs ${E.mode}`);
  const outs = /By the 1\.5 × IQR rule, ([^()]+?) (?:is an outlier|are outliers)/.exec(sum);
  if (E.outliers.length ? !outs || JSON.stringify(outs[1].split(/, | and /).map((x) => Number(x.replace("−", "-")))) !== JSON.stringify(E.outliers) : /outlier \(|are outliers|is an outlier/.test(sum)) fail(`outlier statement wrong: expected ${E.outliers}`);
  if (useExtra) {
    const B = exactStats(mod.data);
    const m = /Adding (-?\d+|−\d+): the mean goes from ([^,]+?) to ([^()]+?)(?: \([^)]*\))? \(change/.exec(sum);
    if (m) {
      eq(first(m[2]), B.mean, "mean before the extra value");
      eq(first(m[3]), E.mean, "mean after the extra value");
    } else fail("with-extra comparison missing");
    const rows = Object.fromEntries(tableRows(el).map((row) => [row[0], row]));
    for (const [nm, key] of [["Minimum", "min"], ["First quartile", "q1"], ["Median", "median"], ["Third quartile", "q3"], ["Maximum", "max"], ["Mean", "mean"], ["Range", "range"], ["IQR", "iqr"], ["MAD", "mad"]]) {
      if (!rows[nm] || rows[nm].length !== 3) fail(`comparison table lacks ${nm}`);
      eq(first(rows[nm][1]), B[key], `${nm} before`);
      eq(first(rows[nm][2]), E[key], `${nm} after`);
    }
  } else {
    if (/Adding /.test(sum)) fail("comparison shown without an extra value");
    const rows = Object.fromEntries(tableRows(el).map((row) => [row[0], row]));
    for (const [nm, key] of [["Minimum", "min"], ["First quartile", "q1"], ["Median", "median"], ["Third quartile", "q3"], ["Maximum", "max"], ["Mean", "mean"], ["Range", "range"], ["IQR", "iqr"], ["MAD", "mad"]]) {
      if (!rows[nm] || rows[nm].length !== 2) fail(`measures table lacks ${nm}`);
      eq(first(rows[nm][1]), E[key], `${nm} in the table`);
    }
  }
  // plot kind
  const desc = el.querySelector("svg")?.querySelector("desc")?.textContent || "";
  const rng = E.range.num();
  const wantDot = el && st.plot === "dot" && rng >= 0 && rng <= 60;
  if (wantDot && !/line plot/.test(desc)) fail("a dot plot was expected");
  if (!wantDot && !/box plot/.test(desc)) fail("a box plot was expected");
  if (/box plot/.test(desc)) {
    const bp = /minimum ([^,]+), first quartile ([^,]+), median ([^,]+), third quartile ([^,]+), maximum ([^.]+)\./.exec(desc);
    eq(must(bp[1]), E.min, "box min");
    eq(must(bp[2]), E.q1, "box q1");
    eq(must(bp[3]), E.median, "box median");
    eq(must(bp[4]), E.q3, "box q3");
    eq(must(bp[5]), E.max, "box max");
  }
  if (r.chance(0.5)) {
    const tryText = (text, ok) => {
      const inp = el.querySelector("#mb-statviz-data");
      inp.value = text;
      clickAct("statviz", el, "use");
      const note = S(el);
      if (ok) {
        const vs = text.split(/[\s,;]+/).filter(Boolean).map(Number);
        if (!/^Now using/.test(note)) fail(`"${text}" should be accepted, got ${note.slice(0, 80)}`);
        mod.data = vs;
      } else if (/^Now using/.test(note) || !/(Type|“)/.test(note.slice(0, 80))) fail(`"${text}" should be refused with a reason, got ${note.slice(0, 80)}`);
    };
    const k = r.int(0, 5);
    if (k === 0) tryText(Array.from({ length: r.int(1, 15) }, () => r.int(-100, 100)).join(", "), true);
    if (k === 1) tryText("1, 2, x", false);
    if (k === 2) tryText("1.5, 2", false);
    if (k === 3) tryText(Array.from({ length: 16 }, (_, i) => i).join(" "), false);
    if (k === 4) tryText("", false);
    if (k === 5) tryText("101, 3", false);
    tally("statviz", "data entries");
    VERIFY.statviz(handleOf(el).state, el, { chance: () => false, int: () => 0, pick: (a) => a[0] });
  }
};

/* ---- construction */
VERIFY.construction = function (st, el) {
  const sum = S(el);
  const u = { none: "", cm: "cm", in: "in", m: "m" }[st.unit] ?? "";
  if (st.tool === "circle") {
    const r2 = Math.round(sv("construction", st, "r") * 2);
    const r = q(r2, 2);
    const C = q(314, 50).mul(r); // 2 × 3.14 × r
    const A = q(314, 100).mul(r).mul(r);
    const NUM = "(\\d+(?:\\.\\d+)?)";
    const cm = new RegExp(`C = 2 × 3\\.14 × ${NUM} = ${NUM}`).exec(sum);
    eq(must(cm[1]), r, "radius in C");
    eq(must(cm[2]), C, "circumference with 3.14");
    const am = new RegExp(`A = 3\\.14 × ${NUM} × ${NUM} = ${NUM}`).exec(sum);
    eq(must(am[3]), A, "area with 3.14");
    const ct = /In terms of π: C = ([\d.,]+)π/.exec(sum);
    eq(must(ct[1]), r.mul(q(2)), "circumference in terms of pi");
    const at = /In terms of π: A = ([\d.,]+)π/.exec(sum);
    eq(must(at[1]), r.mul(r), "area in terms of pi");
    if (u && !sum.includes(`${u}²`)) fail("area unit missing");
    if (!u && !/square units/.test(sum)) fail("square units missing");
    return;
  }
  const s = ["a", "b", "c"].map((k) => sv("construction", st, k));
  const t = s.map((v) => q(Math.round(v * 2), 2)).sort((x, y) => x.cmp(y));
  const [s1, s2, s3] = t;
  const buildable = s1.add(s2).cmp(s3) > 0;
  if (buildable === /cannot build a triangle/.test(sum)) fail(`triangle inequality: ${t.map((x) => x.txt())} buildable=${buildable}`);
  if (!buildable) {
    const m = /add up to ([\d.]+) \+ ([\d.]+) = ([\d.]+)/.exec(sum);
    eq(must(m[3]), s1.add(s2), "sum of the two shorter sides");
    const equal = s1.add(s2).eq(s3);
    if (equal !== /exactly equal/.test(sum) || equal === /less than/.test(sum)) fail("equal/less wording wrong");
    return;
  }
  const L = s1.mul(s1).add(s2.mul(s2));
  const c2 = L.cmp(s3.mul(s3));
  const kind = c2 === 0 ? "a right triangle" : c2 > 0 ? "an acute triangle" : "an obtuse triangle";
  if (!sum.includes(`the triangle is ${kind}`)) fail(`classification should be ${kind}`);
  const py = /a² \+ b² = (\d+(?:\.\d+)?) \+ (\d+(?:\.\d+)?) = (\d+(?:\.\d+)?) and c² = (\d+(?:\.\d+)?)/.exec(sum);
  eq(must(py[1]), s1.mul(s1), "a squared");
  eq(must(py[2]), s2.mul(s2), "b squared");
  eq(must(py[3]), L, "a² + b²");
  eq(must(py[4]), s3.mul(s3), "c squared");
  const ang = /angles are about ([\d.]+)°, ([\d.]+)° and ([\d.]+)°/.exec(sum);
  const [x, y, z] = t.map((v) => v.num());
  const want = [Math.acos((y * y + z * z - x * x) / (2 * y * z)), Math.acos((x * x + z * z - y * y) / (2 * x * z)), Math.acos((x * x + y * y - z * z) / (2 * x * y))].map((v) => (v * 180) / Math.PI);
  want.forEach((w, i) => {
    if (Math.abs(Number(ang[i + 1]) - w) > 0.06) fail(`angle ${ang[i + 1]} vs ${w.toFixed(2)}`);
  });
  const desc = el.querySelector("svg")?.querySelector("desc")?.textContent || "";
  if (c2 === 0 ? !/right triangle/.test(desc) : !/A triangle with its sides labelled/.test(desc)) fail("triangle picture kind does not match the classification");
};

/* ---------------------------------------------------------------- the drive loop */

const tStart = Date.now();
const ids = IDS.filter((id) => !ONLY.length || ONLY.includes(id));
function runJsdom() {
  for (const id of ids) {
    const r = rngOf(0x6b8 + id.length * 7919 + id.charCodeAt(0));
    const { el, handle } = mountOne(id, {});
    HANDLES.set(el, handle);
    // the start state
    const startState = JSON.stringify(Object.fromEntries(META[id].controls.map((c) => [c.id, handle.state[c.id]])));
    const startSummary = S(el);
    check(`${id}: has a purpose line and 2-3 notice prompts`, typeof MANIPS[id].purpose === "string" && MANIPS[id].purpose.length > 30 && /\.$/.test(MANIPS[id].purpose) && META[id].notice.length >= 2 && META[id].notice.length <= 3 && el.querySelectorAll(".ml-man-notice li").length === META[id].notice.length);
    check(`${id}: band 6-8 and a title`, MANIPS[id].band === "6-8" && !!MANIPS[id].title);
    generic(id, el, "at the start");
    let failed = 0;
    for (let n = 0; n < STATES; n++) {
      try {
        randomize(id, r, handle);
        const st = handle.state;
        if (!generic(id, el, `(state ${n})`)) {
          failed++;
          continue;
        }
        VERIFY[id](st, el, r);
        generic(id, el, `(after actions, state ${n})`);
        tally(id, "states");
      } catch (e) {
        failed++;
        if (failed <= 3) check(`${id}: state ${n} ${JSON.stringify(Object.fromEntries(META[id].controls.map((c) => [c.id, handle.state[c.id]])))}`, false, e.stack?.split("\n").slice(0, 4).join("\n") || String(e));
      }
      if (n % 40 === 39) {
        // Reset restores the start
        const btn = [...el.querySelectorAll("button")].find((b) => b.textContent === "Reset");
        btn.click();
        const now = JSON.stringify(Object.fromEntries(META[id].controls.map((c) => [c.id, handle.state[c.id]])));
        if (now !== startState || S(el) !== startSummary || (el.__reset = true) === null) check(`${id}: Reset restores the start`, false, `${now}\n${startState}`);
        for (const k of ["__bal", "__eb", "__mc", "__tf", "__ps", "__sv"]) delete el[k];
        tally(id, "resets");
      }
    }
    check(`${id}: ${STATES} random states, every one valid and mathematically exact`, failed === 0, `${failed} failing states`);
    check(`${id}: at least ${STATES} states were really driven`, (counts[id]?.states || 0) >= STATES - failed);
    el.remove();
  }
}

/* extra jsdom properties that need their own scenarios */
function runExtra() {
  // balance: a fixed worked sequence ends exactly at x = 6 and never changes the solution
  if (ids.includes("balance")) {
    const { el, handle } = mountOne("balance");
    HANDLES.set(el, handle);
    handle.set("amount", 1);
    clickAct("balance", el, "subx");
    handle.set("amount", 4);
    clickAct("balance", el, "subn");
    handle.set("amount", 2);
    clickAct("balance", el, "div");
    check("balance: 3x + 4 = x + 16 solved in three legal moves gives x = 6", /x is alone, so the solution is x = 6\./.test(S(el)), S(el).slice(0, 200));
    handle.set("amount", 0);
    clickAct("balance", el, "div");
    check("balance: dividing both sides by 0 is refused", /^Not allowed: you cannot divide by 0/.test(S(el)));
    handle.set("amount", 1);
    for (let i = 0; i < 12; i++) clickAct("balance", el, "addn");
    check("balance: the move log stops at 10 moves", /records at most 10 moves/.test(S(el)) && el.querySelectorAll(".ml-mb-log li").length === 11, S(el).slice(0, 80));
    // the tilt follows true values: x = 6 level, x = 5 tilts toward the heavier side
    handle.set("trial", true);
    handle.set("tn", 5);
    handle.set("td", 1);
    el.remove();
    const m2 = mountOne("balance");
    m2.handle.set("trial", true);
    m2.handle.set("tn", 6);
    check("balance: with x = 6 the scale is level and says so", /scale is level, so x = 6 is a solution/.test(S(m2.el)) && /scale is level\./.test(S(m2.el).replace(/^.*totals/, "scale is level. totals")) === true || /is level/.test(S(m2.el)));
    m2.handle.set("tn", 5);
    check("balance: with x = 5 the right side is heavier and the scale tilts down on the right", /tilts down on the right/.test(S(m2.el)) && /not a solution/.test(S(m2.el)), S(m2.el));
    m2.el.remove();
  }
  // equation builder worked example
  if (ids.includes("equationbuilder")) {
    const { el, handle } = mountOne("equationbuilder");
    HANDLES.set(el, handle);
    handle.set("amount", 4);
    clickAct("equationbuilder", el, "sub");
    handle.set("amount", 3);
    clickAct("equationbuilder", el, "div");
    check("equation builder: 3x + 4 = 19 solves to x = 5 with a check", /x is alone: x = 5\./.test(S(el)) && /They match\./.test(S(el)), S(el).slice(-200));
    check("equation builder: the step log lists both moves", /Steps so far: 1\. Subtract 4 on both sides, giving 3x = 15; 2\. Divide by 3 on both sides, giving x = 5\./.test(S(el)), S(el).slice(0, 300));
    handle.set("side", "left");
    clickAct("equationbuilder", el, "add");
    check("equation builder: a left-side-only move is refused and the log is unchanged", /^Not allowed: if you change only the left side/.test(S(el)) && /Steps so far: 1\. [^;]+; 2\./.test(S(el)) && !/3\. /.test(S(el)));
    el.remove();
    // fractions stay exact: x / 4 + (-3) = 5 -> x = 32
    const m2 = mountOne("equationbuilder");
    m2.handle.set("form", "twodiv");
    m2.handle.set("a", 4);
    m2.handle.set("b", -3);
    m2.handle.set("c", 5);
    m2.handle.set("amount", 3);
    clickAct("equationbuilder", m2.el, "add");
    m2.handle.set("amount", 4);
    clickAct("equationbuilder", m2.el, "mul");
    check("equation builder: x/4 − 3 = 5 → add 3 → multiply by 4 gives x = 32", /x is alone: x = 32\./.test(S(m2.el)), S(m2.el).slice(-160));
    m2.handle.set("form", "mul");
    m2.handle.set("a", 3);
    m2.handle.set("c", 8);
    m2.handle.set("amount", 3);
    clickAct("equationbuilder", m2.el, "div");
    check("equation builder: 3x = 8 → divide by 3 keeps the exact fraction x = 8/3", /x is alone: x = 8\/3 \(about 2\.667\)/.test(S(m2.el)), S(m2.el).slice(-200));
    m2.el.remove();
  }
  // machine puzzle: reproducible by number, varied across numbers, hidden until committed
  if (ids.includes("machine")) {
    const reveal = (seed) => {
      const { el, handle } = mountOne("machine", { seed });
      handle.set("mode", "guess");
      handle.set("seed", seed);
      handle.set("rule", "linear");
      handle.set("p", 7);
      handle.set("q", 9);
      const before = S(el);
      clickAct("machine", el, "commit");
      const rule = /machine's rule was ([^.]+)\./.exec(S(el))[1];
      el.remove();
      return { before, rule };
    };
    const rules = new Set();
    let hiddenOk = true;
    for (let sd = 1; sd <= 99; sd++) {
      const a = reveal(sd);
      const b = reveal(sd);
      if (a.rule !== b.rule) check(`machine: puzzle ${sd} is the same every time`, false, `${a.rule} vs ${b.rule}`);
      if (a.before.replace(/Your guess is [^.]+\./, "").includes(a.rule)) hiddenOk = false;
      rules.add(a.rule);
    }
    check("machine: the hidden rule is not in the page before the guess is committed (99 puzzles)", hiddenOk);
    check("machine: the 99 puzzles give a variety of rules", rules.size >= 20, `${rules.size} distinct`);
    const seeded = mountOne("machine", { seed: 17 });
    check("machine: start(opts) seeds the puzzle number from opts.seed", Number(seeded.handle.state.seed) === 17);
    seeded.el.remove();
  }
  // probsim: reproducible, batch-independent, capped
  if (ids.includes("probsim")) {
    const run = (seed, ks, device = "spinner") => {
      const { el, handle } = mountOne("probsim");
      handle.set("device", device);
      handle.set("w1", 1);
      handle.set("seed", seed);
      for (const k of ks) el.querySelector(`[data-act="run${k}"]`).click();
      const out = { sum: S(el), counts: tableRows(el).map((r) => Number(r[3])) };
      el.remove();
      return out;
    };
    const a = run(7, [10, 1]);
    const b = run(7, [1, 10]);
    const c = run(7, [10, 1]);
    check("probsim: the same seed gives exactly the same trials", JSON.stringify(a.counts) === JSON.stringify(c.counts) && a.sum === c.sum);
    check("probsim: 10 then 1 trials equals 1 then 10 trials (the k-th trial depends only on seed and k)", JSON.stringify(a.counts) === JSON.stringify(b.counts));
    const d = run(8, [100]);
    const e = run(9, [100]);
    check("probsim: different seeds give different trials", JSON.stringify(d.counts) !== JSON.stringify(e.counts));
    const cap = run(3, Array(12).fill(100));
    check("probsim: trials stop at 1000", cap.counts.reduce((x, y) => x + y, 0) === 1000 && /After 1000 trials/.test(cap.sum));
    for (const device of ["cube", "coin"]) {
      const o = run(5, [100, 100, 100], device);
      check(`probsim: ${device} counts add up and have ${device === "cube" ? 6 : 2} outcomes`, o.counts.length === (device === "cube" ? 6 : 2) && o.counts.reduce((x, y) => x + y, 0) === 300);
    }
    // a fair cube over 1000 trials: every face within 6 sd of 1000/6
    const cube = run(11, Array(10).fill(100), "cube");
    check("probsim: a fair cube over 1000 trials stays within 6 standard deviations on every face", cube.counts.every((x) => Math.abs(x - 1000 / 6) < 6 * Math.sqrt(1000 * (1 / 6) * (5 / 6))), cube.counts.join(","));
  }
  // statviz: the outlier changes the mean far more than the median (stated and recomputed)
  if (ids.includes("statviz")) {
    const { el, handle } = mountOne("statviz");
    handle.set("withExtra", true);
    handle.set("extra", 100);
    const sm = S(el);
    const base = exactStats(DEFAULT_DATA);
    const withE = exactStats([...DEFAULT_DATA, 100]);
    check("statviz: one outlier of 100 raises the mean by more than 8 times as much as the median", withE.mean.sub(base.mean).num() > 8 * withE.median.sub(base.median).num() && /100 is an outlier/.test(sm), sm.slice(-420));
    el.remove();
  }
  // construction: well-known triples
  if (ids.includes("construction")) {
    const tri = (a, b, c) => {
      const { el, handle } = mountOne("construction");
      handle.set("a", a);
      handle.set("b", b);
      handle.set("c", c);
      const s = S(el);
      el.remove();
      return s;
    };
    check("construction: 3, 4, 5 is a right triangle", /a right triangle/.test(tri(3, 4, 5)));
    check("construction: 5, 12, 13 is a right triangle", /a right triangle/.test(tri(5, 12, 13)));
    check("construction: 6, 7, 9 is acute", /an acute triangle/.test(tri(6, 7, 9)));
    check("construction: 4, 5, 8 is obtuse", /an obtuse triangle/.test(tri(4, 5, 8)));
    check("construction: 3, 4, 7 cannot be built because 3 + 4 equals 7", /cannot build a triangle[^]*exactly equal/.test(tri(3, 4, 7)));
    check("construction: 2, 3, 9 cannot be built because 2 + 3 is less than 9", /less than 9/.test(tri(2, 3, 9)));
    check("construction: 2.5, 6, 6.5 (half units) is a right triangle", /a right triangle/.test(tri(2.5, 6, 6.5)));
  }
}

/* ---------------------------------------------------------------- Part 2: the browser */

function serve() {
  const page = (id) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${id} test</title>
<link rel="stylesheet" href="/access-practice-lab/mls-play.css">
<style>
 body { margin: 0; padding: 0 16px 24px; background: #f7f4ec; color: #24323f; font: 1rem/1.5 "Atkinson Hyperlegible", Arial, sans-serif; }
 main { max-width: 64rem; margin: 0 auto; }
 h1 { font-size: 1.5rem; margin: 0.8rem 0; color: #17324d; }
 .panel { background: #fff; border: 2px solid #17324d; border-radius: 10px; padding: 0.8rem; }
 .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.4rem 0.9rem; border: 2px solid #17324d; border-radius: 8px; background: #fff; color: #17324d; font-weight: 700; cursor: pointer; }
 .btn:hover { background: #e3e9ef; }
</style></head><body><main><h1 tabindex="-1">${id}</h1><section class="panel ml-stage" id="stage" aria-label="${id}"></section></main>
<script type="module">
 import { MANIPS } from "/access-practice-lab/src/mls/manips-b.js";
 window.__ready = (async () => { window.__h = MANIPS[${JSON.stringify(id)}].mount(document.getElementById("stage"), { seed: 1 }); return true; })();
</script></body></html>`;
  const types = { ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".html": "text/html" };
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, "http://x");
    if (u.pathname === "/favicon.ico") {
      res.writeHead(204);
      return res.end();
    }
    const m = /^\/__test\/(\w+)$/.exec(u.pathname);
    if (m) {
      res.writeHead(200, { "content-type": "text/html" });
      return res.end(page(m[1]));
    }
    const file = path.join(ROOT, decodeURIComponent(u.pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      return res.end("not found");
    }
    res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => srv.listen(0, "127.0.0.1", () => resolve(srv)));
}

/** Keyboard only: press Tab until the focused element matches `sel` (never clicks, never focuses directly). */
async function tabTo(page, sel, max = 80) {
  for (let i = 0; i < max; i++) {
    const hit = await page.evaluate((s) => document.activeElement?.matches?.(s) === true, sel);
    if (hit) return true;
    await page.keyboard.press("Tab");
  }
  return false;
}
async function tabBackTo(page, sel, max = 80) {
  for (let i = 0; i < max; i++) {
    if (await page.evaluate((s) => document.activeElement?.matches?.(s) === true, sel)) return true;
    await page.keyboard.press("Shift+Tab");
  }
  return false;
}
const live = (page) => page.evaluate(() => document.querySelector("[data-ml-summary]").textContent);

/** One keyboard-only walk per manipulative. Each step presses keys and asserts the live summary. */
const WALK = {
  async ratiotable(page, K) {
    await K.stepper("hrow", "ArrowUp", 3);
    await K.expect(/unknown/, "hiding row 3 shows unknown");
    await K.tab("#mb-ratiotable-ans");
    await page.keyboard.type("12");
    await page.keyboard.press("Enter");
    await K.expect(/^Yes\./, "the exact answer 12 is accepted from the keyboard");
    await page.keyboard.press("Control+A");
    await page.keyboard.type("13");
    await page.keyboard.press("Enter");
    await K.expect(/^Not yet\./, "a wrong answer gets a hint");
  },
  async doublenl(page, K) {
    await K.stepper("hide", "ArrowUp", 2);
    await K.tab("#mb-doublenl-ans");
    await page.keyboard.type("10");
    await page.keyboard.press("Enter");
    await K.expect(/^Yes\./, "tick 2 of the bottom line is 10");
    await K.stepper("target", "ArrowUp", 18);
    await K.expect(/scale factor is 18 ÷ 3 = 6, so amount B is 5 × 6 = 30/, "18 of A gives scale factor 6 and 30 of B");
  },
  async tape(page, K) {
    await K.select("kind", "ArrowDown", 2);
    await K.expect(/difference/, "the comparison tape shows the difference");
    await K.select("unknown", "ArrowDown", 1);
    await K.expect(/\(difference\)/, "hiding the total hides the difference");
    await K.expect(/\?|unknown/, "the hidden part reads unknown");
  },
  async algebratiles(page, K) {
    await K.tab('[data-act="zero"]');
    await page.keyboard.press("Enter");
    await K.expect(/^Removed 1 pair of x and −x and 2 pairs of 1 and −1\./, "zero pairs removed");
    await K.expect(/Zero pairs: 0 pairs of x and −x, and 0 pairs of 1/, "no zero pairs remain");
    await K.tab('[data-act="addx"]');
    await page.keyboard.press("Space");
    await K.expect(/^Added one x-tile/, "a zero pair is added");
  },
  async balance(page, K) {
    await K.tab('[data-act="subx"]');
    await page.keyboard.press("Enter");
    await K.expect(/The equation is 2x \+ 4 = 16\./, "subtract x from both sides");
    await K.stepper("amount", "ArrowUp", 3);
    await K.tab('[data-act="subn"]');
    await page.keyboard.press("Enter");
    await K.expect(/The equation is 2x = 12\./, "subtract 4 from both sides");
    await K.stepper("amount", "ArrowDown", 2);
    await K.tab('[data-act="div"]');
    await page.keyboard.press("Enter");
    await K.expect(/x is alone, so the solution is x = 6\./, "divide by 2 isolates x");
    await K.tab('[data-act="undo"]');
    await page.keyboard.press("Enter");
    await K.expect(/The equation is 2x = 12\./, "undo from the keyboard");
    await K.toggle("trial");
    await K.expect(/with x = 2/i, "a trial value is put in for x");
  },
  async equationbuilder(page, K) {
    await K.tab('[data-act="sub"]');
    await page.keyboard.press("Enter");
    await K.expect(/The equation now is 3x = 15\./, "subtract 4");
    await K.stepper("amount", "ArrowDown", 1);
    await K.tab('[data-act="div"]');
    await page.keyboard.press("Enter");
    await K.expect(/x is alone: x = 5\./, "divide by 3 gives x = 5");
    await K.select("side", "ArrowDown", 1);
    await K.tab('[data-act="add"]');
    await page.keyboard.press("Enter");
    await K.expect(/^Not allowed: if you change only the left side/, "an illegal one-sided move is refused");
  },
  async graphing(page, K) {
    await K.stepper("mn", "ArrowUp", 1);
    await K.expect(/Line 1: y = x \+ 1\./, "slope numerator 2 over 2 is slope 1");
    await K.toggle("two");
    await K.expect(/meet at exactly one point, \(3\/2, 5\/2\)/, "the second line crosses the first at (3/2, 5/2)");
  },
  async machine(page, K) {
    await K.tab('[data-act="feed"]');
    await page.keyboard.press("Enter");
    await K.expect(/Inputs tried so far: 3 gives 6\./, "feeding 3 gives 6");
    await K.select("mode", "ArrowDown", 1);
    await K.expect(/hidden/, "guess mode hides the rule");
    await K.tab('[data-act="feed"]');
    await page.keyboard.press("Enter");
    await K.tab('[data-act="commit"]');
    await page.keyboard.press("Enter");
    await K.expect(/machine's rule was/, "committing shows the rule");
  },
  async transformtool(page, K) {
    await K.tab('[data-act="rx"]');
    await page.keyboard.press("Enter");
    await K.expect(/Image after 1 move: A′\(1, −1\), B′\(4, −1\), C′\(1, −3\)\./, "reflection over the x-axis");
    await K.tab('[data-act="ccw"]');
    await page.keyboard.press("Enter");
    await K.expect(/Image after 2 moves: A′\(1, 1\), B′\(1, 4\), C′\(3, 1\)\./, "then rotate 90 degrees counterclockwise");
    await K.tab('[data-act="undo"]');
    await page.keyboard.press("Enter");
    await K.expect(/Image after 1 move/, "undo");
  },
  async probsim(page, K) {
    await K.tab('[data-act="run10"]');
    await page.keyboard.press("Enter");
    await K.expect(/After 10 trials:/, "run 10 trials");
    await K.tab('[data-act="run100"]');
    await page.keyboard.press("Space");
    await K.expect(/After 110 trials:/, "then 100 more");
  },
  async statviz(page, K) {
    await K.tab("#mb-statviz-data");
    await page.keyboard.press("Control+A");
    await page.keyboard.type("1, 2, 3, 4, 5, 6, 7, 8, 100");
    await page.keyboard.press("Enter");
    await K.expect(/Data \(9 values\): 1, 2, 3, 4, 5, 6, 7, 8, 100\./, "new data typed and applied");
    await K.expect(/more than 60 units/, "a spread over 60 units falls back to the box plot and says so");
    await K.expect(/100 is an outlier/, "100 is flagged by the 1.5 x IQR rule");
    await K.select("plot", "ArrowDown", 1);
    await K.expect(/box plot/i, "box plot shown");
  },
  async construction(page, K) {
    await K.stepper("c", "ArrowUp", 4);
    await K.expect(/cannot build a triangle/, "3, 4, 7 cannot be built");
    await K.select("tool", "ArrowDown", 1);
    await K.expect(/Circumference C = 2 × π × r/, "the circle tool");
  },
};

async function runBrowser() {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (e) {
    return check("playwright is installed", false, String(e));
  }
  const axeSrc = (() => {
    try {
      return fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
    } catch {
      return null;
    }
  })();
  check("axe-core is installed (it is run on every manipulative)", !!axeSrc);
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
  try {
    for (const id of ids) {
      for (const [vw, vh, tag] of [[375, 740, "375"], [1100, 900, "1100"]]) {
        const ctxb = await browser.newContext({ viewport: { width: vw, height: vh }, reducedMotion: "reduce" });
        const page = await ctxb.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(String(e)));
        page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
        page.on("requestfailed", (r) => errors.push(`request failed ${r.url()}`));
        await page.goto(`${base}/__test/${id}`);
        await page.waitForFunction(() => window.__ready, null, { timeout: 15000 });
        await page.waitForSelector("[data-ml-summary]");
        await page.evaluate(() => document.fonts?.ready);
        const K = {
          async expect(re, what) {
            const t = await live(page);
            check(`${id} @${tag}: ${what}`, re.test(t), `live summary: ${t.slice(0, 220)}`);
            tally(id, `browser steps @${tag}`);
          },
          async tab(sel) {
            let ok = await tabTo(page, sel, 120);
            if (!ok) ok = await tabBackTo(page, sel, 120);
            check(`${id} @${tag}: ${sel} is reachable with the keyboard`, ok);
            return ok;
          },
          async stepper(cid, key, n) {
            if (!(await this.tab(`#man-${id}-${cid}`))) return;
            const before = await live(page);
            for (let i = 0; i < n; i++) await page.keyboard.press(key);
            await page.keyboard.press("Tab"); // commits a typed or stepped value
            await page.keyboard.press("Shift+Tab");
            if (n) {
              const after = await live(page);
              check(`${id} @${tag}: ${key} ×${n} on ${cid} changes the live summary`, after !== before, after.slice(0, 120));
            }
          },
          async select(cid, key, n) {
            if (!(await this.tab(`#man-${id}-${cid}`))) return;
            const before = await live(page);
            for (let i = 0; i < n; i++) await page.keyboard.press(key);
            await page.waitForTimeout(30);
            const after = await live(page);
            check(`${id} @${tag}: ${key} ×${n} on ${cid} changes the live summary`, after !== before, after.slice(0, 120));
          },
          async toggle(cid) {
            if (!(await this.tab(`#man-${id}-${cid}`))) return;
            const before = await live(page);
            await page.keyboard.press("Space");
            const after = await live(page);
            check(`${id} @${tag}: Space on ${cid} changes the live summary`, after !== before, after.slice(0, 120));
          },
        };
        if (tag === "375") {
          // keyboard walk once, on the phone width (the harder layout)
          const first = await live(page);
          check(`${id} @${tag}: live summary states values at the start`, /\d/.test(first));
          await WALK[id](page, K);
          await page.screenshot({ path: path.join(OUT, `${id}-${tag}-after.png`), fullPage: true });
        } else {
          await WALK[id](page, K);
        }
        const metrics = await page.evaluate(() => {
          const de = document.documentElement;
          const out = { overflow: de.scrollWidth - window.innerWidth, small: [], target: [] };
          const walker = document.createTreeWalker(document.querySelector(".ml-man"), NodeFilter.SHOW_TEXT);
          const seen = new Set();
          while (walker.nextNode()) {
            const n = walker.currentNode;
            const p = n.parentElement;
            if (!n.textContent.trim() || p.closest("svg") || p.closest(".ml-sr") || seen.has(p)) continue;
            seen.add(p);
            if (!(p.offsetWidth || p.offsetHeight)) continue;
            const fs = parseFloat(getComputedStyle(p).fontSize);
            if (fs < 15.99) out.small.push(`${p.tagName}.${p.className}: ${fs}px "${n.textContent.trim().slice(0, 30)}"`);
          }
          for (const el of document.querySelectorAll(".ml-man button, .ml-man input:not([type=checkbox]), .ml-man select, .ml-man label:has(input[type=checkbox])")) {
            const b = el.getBoundingClientRect();
            if (!b.width && !b.height) continue;
            if (b.height < 43.5 || b.width < 43.5) out.target.push(`${el.tagName}#${el.id || el.textContent.slice(0, 20)}: ${Math.round(b.width)}x${Math.round(b.height)}`);
          }
          return out;
        });
        check(`${id} @${tag}: no horizontal scroll`, metrics.overflow <= 0, `${metrics.overflow}px too wide`);
        check(`${id} @${tag}: all HTML text is at least 16px`, metrics.small.length === 0, metrics.small.slice(0, 4).join("\n"));
        check(`${id} @${tag}: every control is at least 44x44`, metrics.target.length === 0, metrics.target.slice(0, 4).join("\n"));
        const overflowing = await page.evaluate(() => [...document.querySelectorAll(".ml-man *")].filter((e) => !e.closest("svg") && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX === "visible" && e.getBoundingClientRect().right > window.innerWidth + 1).map((e) => e.tagName + "." + e.className).slice(0, 3));
        check(`${id} @${tag}: nothing pokes out of the viewport`, overflowing.length === 0, overflowing.join(", "));
        if (axeSrc) {
          await page.evaluate(axeSrc);
          const res = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"] } }));
          const bad = res.violations.filter((v) => ["serious", "critical"].includes(v.impact));
          check(`${id} @${tag}: axe serious/critical = 0`, bad.length === 0, bad.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")} ${v.nodes[0]?.failureSummary?.split("\n")[1] || ""}`).join("\n"));
          const minor = res.violations.filter((v) => !["serious", "critical"].includes(v.impact));
          if (minor.length && tag === "375") console.log(`note  ${id}: axe minor/moderate: ${minor.map((v) => v.id).join(", ")}`);
        }
        await page.screenshot({ path: path.join(OUT, `${id}-${tag}.png`), fullPage: true });
        check(`${id} @${tag}: no console or page errors`, errors.length === 0, errors.join("\n"));
        await ctxb.close();
      }
    }
  } finally {
    await browser.close();
    srv.close();
  }
}

/* ---------------------------------------------------------------- run */

if (!flag("browser-only")) {
  runJsdom();
  runExtra();
}
if (!flag("jsdom-only")) await runBrowser();

const failed = results.filter((r) => !r.ok);
if (suppressed) console.log(`(${suppressed} repeated failures not printed)`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed in ${((Date.now() - tStart) / 1000).toFixed(1)}s`);
for (const id of ids) if (counts[id]) console.log(`  ${id.padEnd(16)} ${Object.entries(counts[id]).map(([k, v]) => `${k} ${v}`).join(", ")}`);
if (failed.length) {
  console.log(`\n${failed.length} FAILED:`);
  for (const f of failed.slice(0, 40)) console.log(` - ${f.name}${f.detail ? `\n     ${String(f.detail).split("\n")[0].slice(0, 300)}` : ""}`);
  process.exit(1);
}
console.log("PASS mls-manips-b-check");
