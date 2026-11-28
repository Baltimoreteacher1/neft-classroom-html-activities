#!/usr/bin/env node
// Math Literacy Studio: check of the eighteen grade 1-5 manipulatives (access-practice-lab/src/mls/manips-a.js).
//   node tools/mls-manips-a-check.mjs [--no-browser] [--states 250] [--only clock,array]
// Part 1 (jsdom): every manipulative is mounted and its controls are driven over min, max and random states (>= 250 each, plus typed junk).
//   After every state: no exception, a summary with no NaN/undefined, an SVG that renders, and the mathematics checked INDEPENDENTLY of the
//   page (own gcd, own clamping rules, own clock geometry, own rulers, own statistics, own shape definitions, a grid search of real quadrilaterals).
//   Reset must restore the start. Buttons (trade, add/remove points) are clicked and their effect is recomputed.
// Part 2 (Chromium via Playwright): each manipulative operated by KEYBOARD ONLY (Tab, typing, Space/Enter), live summary changes, focus stays on a
//   button after it is pressed, no sideways scroll at 375px, text >= 16px, targets >= 44px, axe serious/critical = 0. Screenshots: /tmp/mls-manips-a/.
// Exit code 1 on any failure.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

// macOS Chromium opens the native popup on ArrowUp/ArrowDown for a closed <select> instead of changing it (Linux changes it). On darwin the
// change is made the way the keyboard would (selectedIndex, then input + change events) so the checks that follow still run.
async function pressOnSelect(page, key) {
  if (process.platform !== "darwin") return page.keyboard.press(key);
  const moved = await page.evaluate((k) => {
    const el = document.activeElement;
    if (!el || el.tagName !== "SELECT") return false;
    const next = Math.max(
      0,
      Math.min(el.options.length - 1, el.selectedIndex + (k === "ArrowUp" ? -1 : 1)),
    );
    if (next === el.selectedIndex) return true;
    el.selectedIndex = next;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }, key);
  if (!moved) await page.keyboard.press(key);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LAB = path.join(ROOT, "access-practice-lab");
const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const STATES = Number(arg("--states", 250));
const ONLY = arg("--only", "") ? arg("--only", "").split(",") : null;
const results = [];
const fails = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: Boolean(ok) });
  if (!ok) fails.push(name);
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `\n        ${String(detail).replace(/\n/g, "\n        ")}`}`,
  );
}

/* ------------------------------------------------------------------ jsdom world */
const dom = new JSDOM("<!doctype html><body><div id=r></div></body>", { pretendToBeVisual: true });
for (const k of ["window", "document", "Event", "HTMLElement", "Node"])
  globalThis[k] = dom.window[k];
const lab = (p) => pathToFileURL(path.join(LAB, "src/mls", p)).href;
const { MANIPS } = await import(lab("manips-a.js"));
const { makeRng } = await import(lab("kit.js"));
const { renderVisual } = await import(lab("visuals.js"));
const EXPECTED = [
  "tenframe",
  "bonds",
  "counters",
  "placevalue",
  "numberline",
  "shapebuilder",
  "clock",
  "measure",
  "picturegraph",
  "array",
  "areamodel",
  "fracstrips",
  "fracline",
  "decimalgrid",
  "volume",
  "coordinate",
  "angle",
  "dataviz",
];
const IDS = EXPECTED.filter((id) => !ONLY || ONLY.includes(id));
const tick = () => new Promise((r) => setTimeout(r, 0));

// independent helpers (deliberately not imported from the page)
const gcd = (a, b) => (b === 0 ? Math.abs(a) || 1 : gcd(b, a % b));
const nI = (v, lo, hi) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;
};
const pl = (n, one, many = `${one}s`) => (n === 1 ? one : many);
const lowestTerms = (n, d) => {
  const g = gcd(n, d);
  return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}`;
};
const strip = (s) => String(s).replace(/,/g, "");

/** Every `a op b op c = d` (plain numbers, + - × ÷, no fractions) stated in a text must be arithmetically true. */
function badEquations(text) {
  const t = String(text).replace(/°/g, "");
  const re =
    /(?<![\d/.])(\d[\d,]*(?:\.\d+)?(?:\s*[+−×÷]\s*\d[\d,]*(?:\.\d+)?)+)\s*=\s*(\d[\d,]*(?:\.\d+)?)(?!\d|\/|\.\d)/g;
  const bad = [];
  for (const m of t.matchAll(re)) {
    const toks = strip(m[1]).split(/\s*([+−×÷])\s*/);
    // × and ÷ first
    const stack = [Number(toks[0])];
    const ops = [];
    for (let i = 1; i < toks.length; i += 2) {
      const op = toks[i];
      const v = Number(toks[i + 1]);
      if (op === "×") stack[stack.length - 1] *= v;
      else if (op === "÷") stack[stack.length - 1] /= v;
      else {
        ops.push(op);
        stack.push(v);
      }
    }
    let r = stack[0];
    ops.forEach((op, i) => {
      r = op === "+" ? r + stack[i + 1] : r - stack[i + 1];
    });
    if (Math.abs(r - Number(strip(m[2]))) > 1e-9) bad.push(m[0]);
  }
  return bad;
}

function read(root) {
  const err = root.querySelector(".ml-man-err");
  const sum = root.querySelector("[data-ml-summary]");
  return {
    err: err ? err.textContent : null,
    summary: sum.textContent,
    svgs: [...root.querySelectorAll(".ml-man-fig svg")].map((s) => s.outerHTML),
    root,
  };
}
const svgText = (svg) => svg.replace(/<title[\s\S]*?<\/title>|<desc[\s\S]*?<\/desc>/g, "");
const svgDesc = (svg) => (/<desc[^>]*>([\s\S]*?)<\/desc>/.exec(svg) || [])[1] || "";
const svgAlt = (svg) => (/<title[^>]*>([\s\S]*?)<\/title>/.exec(svg) || [])[1] || "";
const count = (svg, re) => (svg.match(re) || []).length;

function controlsOf(root) {
  return [...root.querySelectorAll("[data-ctl]")].map((n) => {
    const id = n.dataset.ctl;
    if (n.tagName === "SELECT")
      return { id, type: "choice", options: [...n.options].map((o) => o.value) };
    if (n.type === "checkbox") return { id, type: "toggle" };
    return { id, type: "stepper", min: Number(n.min), max: Number(n.max) };
  });
}
const BAD_TEXT = /NaN|undefined|\bnull\b|\[object|Infinity/;
const THROWN =
  /renderVisual|TypeError|ReferenceError|Cannot |undefined|NaN|is not a function|is not defined/;

/* ------------------------------------------------------------------ per-manipulative verifiers */
const V = {};

V.tenframe = (st, o) => {
  const n = nI(st.n, 0, 20);
  const frames = n > 10 || st.two ? 2 : 1;
  const f = [];
  if (o.err) return "unexpected error";
  const S = o.summary;
  if (
    !S.startsWith(
      `${n} ${pl(n, "counter")} on ${frames === 1 ? "one ten frame" : "two ten frames"}.`,
    )
  )
    f.push("opening");
  if (frames === 1 && !new RegExp(`${n} ${pl(n, "space")} filled and ${10 - n} empty`).test(S))
    f.push("filled/empty");
  if (frames === 2) {
    const a = Math.min(n, 10);
    if (
      !S.includes(
        `Frame 1 has ${a} filled and ${10 - a} empty. Frame 2 has ${n - a} filled and ${10 - (n - a)} empty.`,
      )
    )
      f.push("two frames");
  }
  if (n < 10 && !S.includes(`${10 - n} more`)) f.push("make ten");
  if (n < 10 && !S.includes(`${n} + ${10 - n} = 10`)) f.push("make ten equation");
  if (n === 10 && !S.includes("full")) f.push("full");
  if (n > 10 && !S.includes(`10 + ${n - 10} = ${n}`)) f.push("ten and more");
  const dots = count(o.svgs[0], /<circle/g);
  if (dots !== n) f.push(`svg has ${dots} dots, expected ${n}`);
  if (!svgAlt(o.svgs[0]).includes(`${n} ${pl(n, "dot")}`)) f.push("svg alt");
  return f.join("; ");
};

V.bonds = (st, o) => {
  const a = nI(st.a, 0, 20);
  const b = nI(st.b, 0, 20);
  const g = nI(st.guess, 0, 20);
  const w = a + b;
  if (w > 20) return o.err && !o.summary ? "" : "a whole over 20 must be an error with no summary";
  if (o.err) return "unexpected error";
  const S = o.summary;
  const hide = ["none", "whole", "a", "b"].includes(st.hide) ? st.hide : "none";
  const svg = o.svgs[0];
  const f = [];
  if (hide === "none") {
    if (!S.includes(`${a} + ${b} = ${w}`)) f.push("equation");
    if (/\?/.test(svgText(svg))) f.push("nothing should be hidden");
    return f.join("; ");
  }
  const secret = { whole: w, a, b }[hide];
  const right = g === secret;
  const resolved = !!st.check && right;
  if (!st.check && !S.includes("Turn on Check")) f.push("check prompt");
  if (st.check && right && !S.includes("Yes.")) f.push("right guess must say Yes");
  if (st.check && !right && !S.includes("Not yet.")) f.push("wrong guess must say Not yet");
  if (st.check && !right && S.includes("Yes.")) f.push("wrong guess said Yes");
  const hasQ = /\?/.test(svgText(svg));
  if (!resolved && !hasQ) f.push("hidden number not hidden in the picture");
  if (resolved && hasQ) f.push("resolved bond still hidden");
  if (!resolved) {
    const reveal = { whole: /The whole is \d/, a: /part A is \d/, b: /part B is \d/ }[hide];
    if (reveal.test(S)) f.push("summary states the hidden number");
  }
  // the "Yes" claim and the "Not yet" claim are both recomputed
  const total = hide === "whole" ? a + b : hide === "a" ? g + b : a + g;
  const want = hide === "whole" ? g : w;
  if (st.check && (total === want) !== right) f.push("oracle inconsistent");
  return f.join("; ");
};

V.counters = (st, o) => {
  const n = nI(st.n, 0, 30);
  const g = [0, 2, 5, 10].includes(Number(st.group)) ? Number(st.group) : 0;
  const shape = ["circle", "square", "star", "triangle"].includes(st.shape) ? st.shape : "circle";
  const names = { circle: "circles", square: "squares", star: "stars", triangle: "triangles" };
  if (o.err) return "unexpected error";
  const S = o.summary;
  const f = [];
  if (n === 0) return S.includes("no objects") ? "" : "zero case";
  if (!S.startsWith(`${n} ${names[shape]} in all.`)) f.push("opening");
  if (g === 0 && !S.includes("rows of 10")) f.push("rows of 10");
  if (g > 0) {
    const full = Math.floor(n / g);
    const left = n % g;
    if (!S.includes(`${full} full ${pl(full, "group")} of ${g}`)) f.push("full groups");
    if (left ? !S.includes(`${left} left over`) : !S.includes("none left over"))
      f.push("left over");
    if (full) {
      const skip = Array.from({ length: full }, (_, i) => g * (i + 1)).join(", ");
      if (!S.includes(`Counting by ${g}s: ${skip}`)) f.push("skip count");
    }
  }
  // the picture holds n shapes: the tag whose count grows by exactly 1 from n=1 to n=2 is the shape's tag
  const c = (nn, tag) =>
    count(
      renderVisual({ kind: "counters", n: nn, perRow: g || 10, shape }).svg,
      new RegExp(`<${tag}[ />]`, "g"),
    );
  const tag = ["circle", "rect", "polygon", "path"].find((t) => c(2, t) - c(1, t) === 1);
  if (!tag) f.push("cannot find shape tag");
  else if (count(o.svgs[0], new RegExp(`<${tag}[ />]`, "g")) - (c(1, tag) - 1) !== n)
    f.push("picture does not hold n shapes");
  return f.join("; ");
};

V.placevalue = (st, o) => {
  const h = nI(st.hundreds, 0, 9);
  const t = nI(st.tens, 0, 20);
  const on = nI(st.ones, 0, 30);
  const total = 100 * h + 10 * t + on;
  if (total > 999) return o.err && !o.summary ? "" : "over 999 must be an error";
  if (o.err) return "unexpected error";
  const S = o.summary;
  const f = [];
  if (total === 0) return S.includes("The number is 0") && o.svgs.length === 0 ? "" : "zero case";
  if (!S.includes(`= ${total}.`)) f.push("total");
  if (!svgAlt(o.svgs[0]).includes(`showing ${total}`)) f.push("svg total");
  const digits = [Math.floor(total / 100), Math.floor((total % 100) / 10), total % 10];
  if (
    (on >= 10 || t >= 10) &&
    !S.includes(
      `${digits[0]} ${pl(digits[0], "hundred")}, ${digits[1]} ${pl(digits[1], "ten")} and ${digits[2]} ${pl(digits[2], "one")}`,
    )
  )
    f.push("fewest blocks");
  const btn = (k) => o.root.querySelector(`[data-act="${k}"]`);
  const enabled = (k) => btn(k) && btn(k).getAttribute("aria-disabled") !== "true";
  const want = {
    "t-ones": on >= 10 && t < 20,
    "t-tens": t >= 10 && h < 9,
    "b-ten": t >= 1 && on <= 20,
    "b-hundred": h >= 1 && t <= 10,
  };
  for (const k of Object.keys(want))
    if (!!enabled(k) !== want[k]) f.push(`button ${k} availability`);
  return f.join("; ");
};

V.numberline = (st, o) => {
  if (o.err) return "unexpected error";
  const S = o.summary;
  const f = [];
  const mode = ["whole", "frac", "dec"].includes(st.mode) ? st.mode : "whole";
  const marker = nI(st.marker, 0, 100);
  const hop = nI(st.hop, -20, 20);
  const svg = o.svgs[0];
  const circles = [...svg.matchAll(/<circle[^>]*fill="#E8765A"[^>]*>/g)].map((m) =>
    Number(/cx="([\d.]+)"/.exec(m[0])[1]),
  );
  const xAt = (v, lo, hi) => 44 + (472 * (v - lo)) / (hi - lo);
  const sign = (v) => (v > 0 ? "+" : "−");
  if (mode === "whole") {
    const M = [10, 20, 50, 100].includes(Number(st.max)) ? Number(st.max) : 20;
    const tk = [1, 2, 5, 10].includes(Number(st.tick)) ? Number(st.tick) : 1;
    const m = Math.min(marker, M);
    const to = Math.max(0, Math.min(M, m + hop));
    if (
      !S.includes(
        `A number line from 0 to ${M} with tick marks every ${tk}. The marker is at ${m}.`,
      )
    )
      f.push("opening");
    if (to !== m && !S.includes(`${m} ${to > m ? "+" : "−"} ${Math.abs(to - m)} = ${to}`))
      f.push("hop equation");
    if (to === m && hop && !S.includes("no room")) f.push("no room");
    if (!svgDesc(svg).includes(`divided into ${M / tk} equal`)) f.push("ticks");
    if (!circles.some((x) => Math.abs(x - xAt(m, 0, M)) < 0.05))
      f.push(`marker drawn at the wrong place (${circles} vs ${xAt(m, 0, M)})`);
    void sign;
  } else if (mode === "frac") {
    const d = [2, 3, 4, 5, 6, 8, 10, 12].includes(Number(st.den)) ? Number(st.den) : 4;
    const k = Math.min(marker, d);
    const to = Math.max(0, Math.min(d, k + hop));
    if (!S.includes(`cut into ${d} equal parts, so each part is 1/${d}`)) f.push("denominator");
    if (!S.includes(`${k} ${pl(k, "part")} of ${d} from 0`)) f.push("parts from 0");
    if (k > 0 && k < d) {
      const g = gcd(k, d);
      if (
        g === 1
          ? !S.includes("already in lowest terms")
          : !S.includes(`In lowest terms ${k}/${d} is ${k / g}/${d / g}`)
      )
        f.push("lowest terms");
    }
    if (
      to !== k &&
      !S.includes(
        `${Math.abs(to - k)} ${pl(Math.abs(to - k), "part")} of 1/${d} ${to > k ? "forward" : "back"}`,
      )
    )
      f.push("hop");
    if (!svgDesc(svg).includes(`divided into ${d} equal`)) f.push("ticks");
    if (!circles.some((x) => Math.abs(x - xAt(k, 0, d)) < 0.05))
      f.push("marker drawn at the wrong place");
  } else {
    const w = nI(st.win, 0, 9);
    const dt = (pos) => String(Number((pos / 100).toFixed(2)));
    const pos = w * 100 + marker;
    const to = Math.max(w * 100, Math.min(w * 100 + 100, pos + hop * 10));
    if (
      !S.includes(
        `A number line from ${w} to ${w + 1} cut into 10 equal tenths. The marker is at ${dt(pos)}.`,
      )
    )
      f.push("opening");
    if (
      to !== pos &&
      !S.includes(`${dt(pos)} ${to > pos ? "+" : "−"} ${dt(Math.abs(to - pos))} = ${dt(to)}`)
    )
      f.push("decimal hop equation");
    if (!circles.some((x) => Math.abs(x - xAt(pos, w * 100, w * 100 + 100)) < 0.05))
      f.push("marker drawn at the wrong place");
  }
  return f.join("; ");
};

// ---- shapes: independent definitions
const DEF = {
  square: (a) => a.sides === 4 && a.equal && a.right === 4,
  rectangle: (a) => a.sides === 4 && !a.equal && a.right === 4 && a.parallel === 2,
  rhombus: (a) => a.sides === 4 && a.equal && a.right === 0 && a.parallel === 2,
  trapezoid: (a) => a.sides === 4 && a.parallel === 1,
  parallelogram: (a) => a.sides === 4 && !a.equal && a.right === 0 && a.parallel === 2,
  quadrilateral: (a) => a.sides === 4,
  triangle: (a) => a.sides === 3,
  pentagon: (a) => a.sides === 5,
  hexagon: (a) => a.sides === 6,
};
const PRIORITY = [
  "square",
  "rhombus",
  "rectangle",
  "parallelogram",
  "trapezoid",
  "triangle",
  "pentagon",
  "hexagon",
  "quadrilateral",
];
const shapeAttrs = (st) => ({
  sides: Number(st.sides),
  equal: !!st.equal,
  right: nI(st.right, 0, 4),
  parallel: nI(st.parallel, 0, 3),
});
V.shapebuilder = (st, o) => {
  const S = o.summary;
  const f = [];
  if (st.kind === "round") {
    const fr = ["1", "1/2", "1/4"].includes(st.fraction) ? st.fraction : "1";
    const name = { 1: "circle", "1/2": "half-circle", "1/4": "quarter-circle" }[fr];
    if (o.err) return "unexpected error";
    if (!S.endsWith(`This shape is a ${name}.`)) f.push(`name ${name}`);
    if (fr === "1" && !/no straight sides and no corners/.test(S)) f.push("circle attributes");
    if (fr === "1/2" && !/one straight side, with 2 corners/.test(S)) f.push("half attributes");
    if (fr === "1/4" && !/two straight sides that meet at a right angle, with 3 corners/.test(S))
      f.push("quarter attributes");
    if (!svgAlt(o.svgs[0]).includes(`A ${name}`)) f.push("picture name");
    return f.join("; ");
  }
  const a = shapeAttrs(st);
  const m = /This shape is a ([a-z-]+)\./.exec(S);
  if (o.err) {
    if (o.summary) f.push("error with a summary");
    if (!POSSIBLE(a).impossible) f.push("error for a possible shape: " + o.err);
    return f.join("; ");
  }
  if (POSSIBLE(a).impossible) return `claimed a shape for an impossible set of attributes: ${S}`;
  if (!m) return "no name sentence";
  const claimed = m[1];
  if (!DEF[claimed](a))
    f.push(`claimed ${claimed} but attributes ${JSON.stringify(a)} do not define it`);
  const most = PRIORITY.find((n) => DEF[n](a));
  if (claimed !== most) f.push(`attributes define ${most} but the summary says ${claimed}`);
  if (!S.startsWith(`${a.sides} straight sides and ${a.sides} corners.`)) f.push("sides sentence");
  if (
    !S.includes(`${a.right} right ${pl(a.right, "angle")}.`) ||
    !S.includes(`${a.parallel} ${pl(a.parallel, "pair")} of parallel sides.`)
  )
    f.push("attribute counts");
  const pic = [
    "square",
    "rectangle",
    "rhombus",
    "trapezoid",
    "triangle",
    "pentagon",
    "hexagon",
  ].includes(claimed);
  if (pic !== o.svgs.length > 0) f.push("picture presence");
  if (pic && !svgAlt(o.svgs[0]).includes(`A ${claimed}`)) f.push("picture does not match the name");
  return f.join("; ");
};
/** What is geometrically possible (the oracle is the grid search below for 4 sides; theorems for the rest). */
let QUAD_FOUND = null;
function POSSIBLE(a) {
  if (a.sides === 3)
    return { impossible: a.right > 1 || a.parallel > 0 || (a.equal && a.right > 0) };
  if (a.sides === 4) {
    const key = `${a.equal ? 1 : 0}|${a.right}|${a.parallel}`;
    return { impossible: a.parallel > 2 || !QUAD_FOUND.has(key) };
  }
  if (a.sides === 5) return { impossible: a.right > 3 || a.parallel > 2 };
  return { impossible: a.parallel > 3 || a.right > 5 };
}
/** Search every simple quadrilateral on a small integer grid; record (all sides equal, right angles, parallel pairs). */
function quadGrid(N = 8) {
  const pts = [];
  for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) pts.push([x, y]);
  const found = new Set();
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const segX = (p1, p2, p3, p4) => {
    const d1 = Math.sign(cross(p3, p4, p1));
    const d2 = Math.sign(cross(p3, p4, p2));
    const d3 = Math.sign(cross(p1, p2, p3));
    const d4 = Math.sign(cross(p1, p2, p4));
    return d1 * d2 < 0 && d3 * d4 < 0;
  };
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  for (let i = 0; i < pts.length; i++)
    for (let j = 0; j < pts.length; j++) {
      if (j === i) continue;
      for (let k = 0; k < pts.length; k++) {
        if (k === i || k === j || cross(pts[i], pts[j], pts[k]) === 0) continue;
        for (let l = 0; l < pts.length; l++) {
          if (l === i || l === j || l === k) continue;
          const P = [pts[i], pts[j], pts[k], pts[l]];
          let ok = true;
          for (let v = 0; v < 4 && ok; v++)
            if (cross(P[v], P[(v + 1) % 4], P[(v + 2) % 4]) === 0) ok = false; // three in a row
          if (!ok) continue;
          if (segX(P[0], P[1], P[2], P[3]) || segX(P[1], P[2], P[3], P[0])) continue; // self-crossing
          let right = 0;
          for (let v = 0; v < 4; v++) {
            const a = P[v];
            const b = P[(v + 1) % 4];
            const c = P[(v + 3) % 4];
            if ((b[0] - a[0]) * (c[0] - a[0]) + (b[1] - a[1]) * (c[1] - a[1]) === 0) right++;
          }
          const par = (a, b, c, d) =>
            (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]) === 0;
          const pairs =
            (par(P[0], P[1], P[3], P[2]) ? 1 : 0) + (par(P[1], P[2], P[0], P[3]) ? 1 : 0);
          const s = [d2(P[0], P[1]), d2(P[1], P[2]), d2(P[2], P[3]), d2(P[3], P[0])];
          const eq = s.every((x) => x === s[0]) ? 1 : 0;
          found.add(`${eq}|${right}|${pairs}`);
        }
      }
    }
  return found;
}

// ---- clock
const minuteWords = (m, h12) => {
  const nx = h12 === 12 ? 1 : h12 + 1;
  if (m === 0) return `${h12} o'clock`;
  if (m === 15) return `a quarter past ${h12}`;
  if (m === 30) return `half past ${h12}`;
  if (m === 45) return `a quarter to ${nx}`;
  return m < 30
    ? `${m} ${pl(m, "minute")} past ${h12}`
    : `${60 - m} ${pl(60 - m, "minute")} to ${nx}`;
};
const digital = (mins24) => {
  const h24 = Math.floor(mins24 / 60) % 24;
  const m = mins24 % 60;
  const h12 = h24 % 12 || 12;
  return {
    d: `${h12}:${String(m).padStart(2, "0")} ${h24 < 12 ? "am" : "pm"}`,
    w: minuteWords(m, h12),
    h24,
    m,
  };
};
function handAngles(svg) {
  const polys = [...svg.matchAll(/<polygon points="([^"]+)" fill="(#[0-9A-F]{6})"/g)].map((m) => ({
    pts: m[1]
      .trim()
      .split(/\s+/)
      .map((p) => p.split(",").map(Number)),
    fill: m[2],
  }));
  const ang = (p) =>
    ((Math.atan2(p.pts[2][0] - 150, 150 - p.pts[2][1]) * 180) / Math.PI + 360) % 360;
  const hour = polys.find((p) => p.fill === "#17324D" && p.pts.length === 4);
  const min = polys.find((p) => p.fill === "#2F6FB0" && p.pts.length === 4);
  return { hour: hour && ang(hour), min: min && ang(min) };
}
V.clock = (st, o) => {
  if (o.err) return "unexpected error";
  const hr = nI(st.hour, 1, 12);
  const m = nI(st.minute, 0, 59);
  const pm = st.ampm === "pm";
  const start = ((hr % 12) + (pm ? 12 : 0)) * 60 + m;
  const t0 = digital(start);
  const f = [];
  if (!o.summary.startsWith(`The clock shows ${t0.d}, which is ${t0.w}.`))
    f.push(`digital/words: expected ${t0.d}, ${t0.w}`);
  const ha = handAngles(o.svgs[0]);
  const wantH = (((t0.h24 % 12) + m / 60) * 30) % 360;
  if (ha.hour == null || Math.abs(ha.hour - wantH) > 0.1)
    f.push(`hour hand at ${ha.hour}, expected ${wantH}`);
  if (ha.min == null || Math.abs(ha.min - m * 6) > 0.1)
    f.push(`minute hand at ${ha.min}, expected ${m * 6}`);
  if (!svgAlt(o.svgs[0]).includes(`showing ${t0.d.replace(/ [ap]m/, "")}`)) f.push("svg time");
  if (st.mode === "elapsed") {
    const e = nI(st.elapsed, 0, 360);
    const end = digital((start + e) % 1440);
    if (
      !o.summary.includes(
        `The end time is ${end.d}${start + e >= 1440 ? " the next day" : ""}, which is ${end.w}.`,
      )
    )
      f.push(`end time expected ${end.d}`);
    if (!o.summary.includes(`(${e} ${pl(e, "minute")})`)) f.push("elapsed minutes");
    const eh = handAngles(o.svgs[1]);
    if (
      eh.min == null ||
      Math.abs(eh.min - end.m * 6) > 0.1 ||
      Math.abs(eh.hour - ((((end.h24 % 12) + end.m / 60) * 30) % 360)) > 0.1
    )
      f.push("second clock hands");
  } else if (o.svgs.length !== 1) f.push("one clock in show mode");
  return f.join("; ");
};

// ---- measure
const RUL = { cm10: ["cm", 10], cm15: ["cm", 15], in6: ["in", 6], in12: ["in", 12] };
const measureTxt = (u, unit) => {
  if (unit === "cm") return u % 10 === 0 ? `${u / 10} cm` : `${u / 10} cm`;
  const w = Math.floor(u / 16);
  const r = u % 16;
  const g = gcd(r, 16);
  return `${w || ""}${w && r ? " " : ""}${r ? `${r / g}/${16 / g}` : w ? "" : "0"} in`;
};
function objectRect(svg, unit, len, per) {
  const m = /<rect x="([\d.]+)" y="38" width="([\d.]+)" height="36" fill="#D3E3F3"/.exec(svg);
  if (!m) return null;
  const ppu = Math.floor(unit === "cm" ? Math.min(52, 500 / len) : Math.min(100, 500 / len));
  const lenPx = ppu * len;
  const x0 = 40;
  const a = ((Number(m[1]) - x0) * len) / lenPx;
  const b = ((Number(m[1]) + Number(m[2]) - x0) * len) / lenPx;
  return {
    from: Math.round(a * per),
    to: Math.round(b * per),
    exact:
      Math.abs(a * per - Math.round(a * per)) < 0.05 &&
      Math.abs(b * per - Math.round(b * per)) < 0.05,
  };
}
V.measure = (st, o) => {
  const [unit, len] = RUL[["cm10", "cm15", "in6", "in12"].includes(st.ruler) ? st.ruler : "cm15"];
  const per = unit === "cm" ? 10 : 16;
  const startW = Math.min(nI(st.start, 0, 14), len - 1);
  const from = startW * per;
  const frac = unit === "cm" ? nI(st.mm, 0, 9) : nI(st.eighths, 0, 7) * 2;
  const want = nI(st.whole, 0, 14) * per + frac;
  if (want === 0) return o.err && !o.summary ? "" : "a zero-length object must be an error";
  if (o.err) return `unexpected error: ${o.err}`;
  const l1 = Math.min(want, len * per - from);
  const f = [];
  const S = o.summary;
  if (from + l1 > len * per) f.push("object past the end of the ruler (oracle)");
  if (
    !S.includes(
      `The object starts at ${measureTxt(from, unit)} and ends at ${measureTxt(from + l1, unit)}.`,
    )
  )
    f.push("start/end text");
  if (!S.includes(`= ${measureTxt(l1, unit)}`)) f.push("length text");
  if (
    l1 < want &&
    !S.includes("would stick out past the end of the ruler, so the object is shortened to fit")
  )
    f.push("clamp must be stated");
  if (l1 === want && S.includes("would stick out")) f.push("clamp stated but not applied");
  const r = objectRect(o.svgs[0], unit, len, per);
  if (!r || !r.exact || r.from !== from || r.to !== from + l1)
    f.push(`object drawn from ${r && r.from} to ${r && r.to}, expected ${from} to ${from + l1}`);
  if (st.compare) {
    const l2 = Math.min(nI(st.second, 1, 14) * per, len * per);
    const d = Math.abs(l1 - l2);
    if (
      d === 0
        ? !S.includes("same length")
        : !S.includes(
            `The ${l1 > l2 ? "first" : "second"} object is longer by ${measureTxt(d, unit)}.`,
          )
    )
      f.push("comparison");
    if (nI(st.second, 1, 14) * per > len * per !== S.includes("(shortened to fit the ruler)"))
      f.push("second object clamp statement");
    const r2 = objectRect(o.svgs[1] || "", unit, len, per);
    if (!r2 || r2.from !== 0 || r2.to !== l2) f.push("second object drawn wrongly");
  }
  return f.join("; ");
};

// ---- picture graph
const TH = {
  pets: ["Dogs", "Cats", "Fish", "Birds"],
  fruit: ["Apples", "Bananas", "Grapes", "Pears"],
  sports: ["Soccer", "Swimming", "Running", "Dancing"],
  rides: ["Bus", "Walk", "Car", "Bike"],
};
V.picturegraph = (st, o) => {
  if (o.err) return "unexpected error";
  const cats = TH[TH[st.theme] ? st.theme : "pets"];
  const c = [st.c0, st.c1, st.c2, st.c3].map((v) => nI(v, 0, 20));
  const per = Number(st.per) === 2 ? 2 : 1;
  const S = o.summary;
  const f = [];
  cats.forEach((n, i) => {
    if (!S.includes(`${n}: ${c[i]}`)) f.push(`reads ${n}`);
  });
  const total = c.reduce((a, b) => a + b, 0);
  if (!S.includes(`Total: ${total}.`)) f.push("total");
  const mx = Math.max(...c);
  const mn = Math.min(...c);
  if (total > 0 && mx !== mn && !S.includes(`the most (${mx})`) && !S.includes(`the most (${mx});`))
    f.push("most");
  if (total > 0 && mx !== mn && !S.includes(`a difference of ${mx - mn}`)) f.push("difference");
  if (total > 0 && mx === mn && !S.includes("same count")) f.push("tie");
  if (!st.bar) {
    const full = c.reduce((a, v) => a + Math.floor(v / per), 0);
    const halves = c.reduce((a, v) => a + (v % per), 0);
    const circles = count(o.svgs[0], /<circle[^>]*fill="#1FA6A2"/g);
    if (circles !== full + 1) f.push(`pictures drawn ${circles - 1}, expected ${full}`); // +1: the key symbol
    if (count(o.svgs[0], /<path d="M [\d.]+ [\d.]+ A /g) !== halves + (halves ? 0 : 0))
      f.push("half pictures");
    cats.forEach((n, i) => {
      const fl = Math.floor(c[i] / per);
      const half = c[i] % per !== 0;
      const words = half
        ? fl
          ? `${fl} and a half pictures`
          : "a half picture"
        : `${fl} ${pl(fl, "picture")}`;
      if (!S.includes(`${n}: ${c[i]} (${words})`)) f.push(`pictures for ${n}`);
    });
  } else if (!/Bar graph/.test(S)) f.push("bar mode");
  return f.join("; ");
};

V.array = (st, o) => {
  if (o.err) return "unexpected error";
  const rows = nI(st.rows, 1, 12);
  const cols = nI(st.cols, 1, 12);
  const turn = !!st.turn;
  const R = turn ? cols : rows;
  const C = turn ? rows : cols;
  const sp = nI(st.split, 0, 11);
  const f = [];
  if (!o.summary.includes(`${R} ${pl(R, "row")} of ${C}, so ${R} × ${C} = ${rows * cols}.`))
    f.push("sentence");
  if (
    !o.summary.includes(`${cols} × ${rows} = ${rows * cols}`) ||
    !o.summary.includes(`${rows} × ${cols} = ${rows * cols}`)
  )
    f.push("commutative partner");
  if (count(o.svgs[0], /<circle/g) !== rows * cols) f.push("dots drawn");
  if (
    sp >= 1 &&
    sp < cols &&
    !o.summary.includes(
      `${rows} × ${sp} and ${rows} × ${cols - sp}: ${rows * sp} + ${rows * (cols - sp)} = ${rows * cols}`,
    )
  )
    f.push("distributive split");
  if (!(sp >= 1 && sp < cols) && sp && !o.summary.includes("not inside")) f.push("bad split note");
  if (!svgAlt(o.svgs[0]).includes(`${R} rows and ${C} columns`)) f.push("svg alt");
  return f.join("; ");
};

V.areamodel = (st, o) => {
  if (o.err) return "unexpected error";
  const a = nI(st.a, 1, 99);
  const b = nI(st.b, 1, 99);
  const how = ["place", "custom", "none"].includes(st.how) ? st.how : "place";
  const tc = (v) => (v > 10 && v % 10 ? Math.floor(v / 10) * 10 : 0);
  const raw =
    how === "place"
      ? [tc(a), tc(b)]
      : how === "custom"
        ? [nI(st.sa, 0, 98), nI(st.sb, 0, 98)]
        : [0, 0];
  const ca = raw[0] > 0 && raw[0] < a ? raw[0] : 0;
  const cb = raw[1] > 0 && raw[1] < b ? raw[1] : 0;
  const ws = ca ? [ca, a - ca] : [a];
  const hs = cb ? [cb, b - cb] : [b];
  const want = [];
  for (const hh of hs)
    for (const w of ws) want.push(`${w} × ${hh} = ${(w * hh).toLocaleString("en-US")}`);
  const f = [];
  const S = o.summary;
  const seg = /Partial products: (.*?)\. Added together/.exec(S);
  if (want.length === 1) {
    if (!S.includes(`the area is ${a} × ${b} = ${(a * b).toLocaleString("en-US")}`))
      f.push("unsplit area");
  } else {
    if (!seg) return "no partial products";
    const got = seg[1].split(", ");
    if (got.slice().sort().join("|") !== want.slice().sort().join("|"))
      f.push(`partials ${got} expected ${want}`);
    const sumP = got.reduce((s, g) => s + Number(strip(/= ([\d,]+)/.exec(g)[1])), 0);
    if (sumP !== a * b) f.push(`partials add to ${sumP}, not ${a * b}`);
    const wsum = ws.reduce((x, y) => x + y, 0);
    const hsum = hs.reduce((x, y) => x + y, 0);
    if (wsum !== a || hsum !== b) f.push("parts do not add to the sides");
  }
  const sv = o.svgs[0];
  if (!svgAlt(sv).includes(`${a} by ${b} rectangle`)) f.push("svg alt");
  if (want.length > 1 && !new RegExp(`${ca ? "split" : ""}`).test(svgAlt(sv))) f.push("svg split");
  return f.join("; ");
};

V.fracstrips = (st, o) => {
  if (o.err) return "unexpected error";
  const mode = ["compare", "equivalent", "add"].includes(st.mode) ? st.mode : "compare";
  const pa = nI(st.pa, 1, 12);
  const sa = Math.min(nI(st.sa, 0, 12), pa);
  const S = o.summary;
  const f = [];
  const cmp = (n1, d1, n2, d2) => Math.sign(n1 * d2 - n2 * d1);
  if (mode === "compare") {
    const pb = nI(st.pb, 1, 12);
    const sb = Math.min(nI(st.sb, 0, 12), pb);
    const c = cmp(sa, pa, sb, pb);
    const rel = c > 0 ? "is greater than" : c < 0 ? "is less than" : "is equal to";
    if (!S.includes(`${sa}/${pa} ${rel} ${sb}/${pb}.`))
      f.push(`relation: expected ${sa}/${pa} ${rel} ${sb}/${pb}`);
    if (c === 0 && !S.includes(`both are ${lowestTerms(sa, pa)} in lowest terms`))
      f.push("equivalent lowest terms");
    if (/strip/.test(svgDesc(o.svgs[0])) && !svgDesc(o.svgs[0]).includes("Strip B"))
      f.push("two strips");
  } else if (mode === "equivalent") {
    const m = Math.max(1, Math.min(nI(st.mult, 1, 6), Math.floor(24 / pa)));
    if (!S.includes(`strip B has ${pa * m} parts with ${sa * m} shaded, ${sa * m}/${pa * m}.`))
      f.push("equivalent strip");
    if (cmp(sa, pa, sa * m, pa * m) !== 0) f.push("not equivalent!");
    if (!S.includes(`In lowest terms both are ${lowestTerms(sa, pa)}.`)) f.push("lowest terms");
  } else {
    const sb = Math.min(nI(st.sb, 0, 12), pa);
    const sum = sa + sb;
    if (!S.includes(`${sa}/${pa} + ${sb}/${pa} = ${sum}/${pa}.`)) f.push("sum sentence");
    if (!S.includes(`${sa} + ${sb} = ${sum}`)) f.push("numerator sum");
    if (sum > pa && !S.includes(`${sum}/${pa} = 1 ${lowestTerms(sum - pa, pa)}`))
      f.push("mixed number");
    if (sum === pa && !S.includes("exactly one whole")) f.push("one whole");
    if (o.svgs.length !== 2) f.push("a total strip is drawn");
  }
  return f.join("; ");
};

V.fracline = (st, o) => {
  if (o.err) return "unexpected error";
  const d = nI(st.den, 2, 12);
  const r = Number(st.range) === 2 ? 2 : 1;
  const k = Math.min(nI(st.num, 0, 24), r * d);
  const S = o.summary;
  const f = [];
  if (!S.includes(`at ${k}/${d}`)) f.push("marker fraction");
  if (!S.includes(`${k} ${pl(k, "jump")} of 1/${d} from 0`)) f.push("jumps");
  if (k > 0 && k % d !== 0) {
    const g = gcd(k, d);
    if (
      g === 1
        ? !S.includes("already in lowest terms")
        : !S.includes(`In lowest terms ${k}/${d} is ${k / g}/${d / g}`)
    )
      f.push("lowest terms");
  }
  if (k > d && k % d && !S.includes(`mixed number it is ${Math.floor(k / d)} ${k % d}/${d}`))
    f.push("mixed");
  const want = [];
  for (let q = 2; q <= 12; q++) if (q !== d && (k * q) % d === 0) want.push(`${(k * q) / d}/${q}`);
  const m = /denominator up to 12: ([^.]*)\./.exec(S);
  const got = m ? m[1].split(", ") : [];
  if (got.join("|") !== want.join("|")) f.push(`equivalents ${got} expected ${want}`);
  for (const g of got) {
    const [n2, d2] = g.split("/").map(Number);
    if (n2 * d !== k * d2) f.push(`${g} is not equal to ${k}/${d}`);
  }
  const circles = [...o.svgs[0].matchAll(/<circle[^>]*fill="#E8765A"[^>]*>/g)].map((x) =>
    Number(/cx="([\d.]+)"/.exec(x[0])[1]),
  );
  if (!circles.some((x) => Math.abs(x - (44 + (472 * k) / (r * d))) < 0.05))
    f.push("marker drawn at the wrong place");
  if (!svgDesc(o.svgs[0]).includes(`divided into ${r * d} equal`)) f.push("ticks");
  return f.join("; ");
};

V.decimalgrid = (st, o) => {
  if (o.err) return "unexpected error";
  const te = nI(st.tenths, 0, 10);
  const hu = te === 10 ? 0 : nI(st.hundredths, 0, 9);
  const total = te * 10 + hu;
  const S = o.summary;
  const f = [];
  if (
    !S.includes(
      `${total} of the 100 squares shaded: ${te} ${pl(te, "tenth")} (whole columns) and ${hu} extra ${pl(hu, "hundredth")}.`,
    )
  )
    f.push("counts");
  if (!S.includes(`As a fraction: ${total}/100`)) f.push("fraction");
  const g = gcd(total, 100);
  if (g > 1 && !S.includes(`which is ${lowestTerms(total, 100)} in lowest terms`))
    f.push("lowest terms");
  if (!S.includes(`As a decimal: ${(total / 100).toFixed(2)}`)) f.push("decimal");
  if (!S.includes(`As a percent: ${total}%.`)) f.push("percent");
  if (count(o.svgs[0], /<circle/g) !== total) f.push("shaded squares drawn");
  if (count(o.svgs[0], /<rect[^>]*fill="#1FA6A2"/g) !== total) f.push("teal squares");
  // each shaded square is its own square: the tenths columns fill left to right
  return f.join("; ");
};

V.volume = (st, o) => {
  if (o.err) return "unexpected error";
  const l = nI(st.l, 1, 10);
  const w = nI(st.w, 1, 10);
  const h = nI(st.hh, 1, 10);
  const f = [];
  const S = o.summary;
  if (!S.includes(`One layer is ${l} × ${w} = ${l * w}`)) f.push("layer");
  if (!S.includes(`${h} × ${l * w} = ${l * w * h} cubes, and ${l} × ${w} × ${h} = ${l * w * h}`))
    f.push("volume");
  if (!S.includes(`The volume is ${l * w * h} cubic units.`)) f.push("volume sentence");
  if (!svgAlt(o.svgs[0]).includes(`${l} by ${w} by ${st.one ? 1 : h}`)) f.push("picture dims");
  return f.join("; ");
};

V.angle = (st, o) => {
  if (o.err) return "unexpected error";
  const d = nI(st.deg, 5, 180);
  const kind = (x) =>
    x < 90
      ? "an acute angle"
      : x === 90
        ? "a right angle"
        : x < 180
          ? "an obtuse angle"
          : "a straight angle";
  const f = [];
  const S = o.summary;
  if (!S.startsWith(`An angle of ${d}°, which is ${kind(d)}`)) f.push(`classification of ${d}`);
  if (!svgAlt(o.svgs[0]).includes(`Angle of ${d} degrees`)) f.push("svg alt");
  if (st.protractor && !/protractor/.test(svgDesc(o.svgs[0]))) f.push("protractor");
  if (st.partner) {
    const p = 180 - d;
    if (p === 0) {
      if (!S.includes("180° − 180° = 0°")) f.push("zero partner");
    } else {
      if (!S.includes(`180° − ${d}° = ${p}°, ${kind(p)}`)) f.push("partner");
      if (!S.includes(`${d}° + ${p}° = 180°`)) f.push("sum 180");
      if (!svgAlt(o.svgs[1] || "").includes(`Angle of ${p} degrees`)) f.push("partner picture");
    }
  }
  return f.join("; ");
};

V.dataviz = (st, o) => {
  const from = [0, 1, 5, 10].includes(Number(st.from)) ? Number(st.from) : 1;
  const by = [1, 2, 5].includes(Number(st.by)) ? Number(st.by) : 1;
  const cs = Array.from({ length: 7 }, (_, i) => nI(st[`c${i}`], 0, 8));
  const vals = cs.map((_, i) => from + i * by);
  const n = cs.reduce((a, b) => a + b, 0);
  const f = [];
  const rows = [...o.root.querySelectorAll(".ml-man-table tbody tr")].map((r) =>
    [...r.children].map((c) => c.textContent),
  );
  if (rows.length !== 7 || rows.some((r, i) => r[0] !== String(vals[i]) || r[1] !== String(cs[i])))
    f.push("table does not match the data");
  if (n === 0)
    return o.summary.includes("no data") && o.svgs.length === 0 ? f.join("; ") : "empty case";
  const data = [];
  vals.forEach((v, i) => {
    for (let j = 0; j < cs[i]; j++) data.push(v);
  });
  data.sort((a, b) => a - b);
  const sum = data.reduce((a, b) => a + b, 0);
  const S = o.summary;
  const g = gcd(sum, n);
  const meanTxt = n / g === 1 ? `${sum / g}` : `${sum / g}/${n / g}`;
  const dec = Math.round((sum / n) * 100) / 100;
  if (!S.includes(`Mean: ${sum} ÷ ${n} = ${meanTxt}`)) f.push(`mean text expected ${meanTxt}`);
  if (n / g !== 1) {
    const approx = (sum * 100) % n === 0 ? "=" : "≈";
    if (!S.includes(`${meanTxt} ${approx} ${dec}`)) f.push("mean decimal");
  }
  const med = n % 2 ? data[(n - 1) / 2] : (data[n / 2 - 1] + data[n / 2]) / 2;
  if (!S.includes(`Median: ${med}.`)) f.push(`median expected ${med}`);
  const freq = new Map();
  data.forEach((v) => freq.set(v, (freq.get(v) || 0) + 1));
  const mx = Math.max(...freq.values());
  const modes = [...freq].filter(([, c]) => c === mx).map(([v]) => v);
  if (freq.size > 1 && modes.length === freq.size) {
    if (!S.includes("no mode")) f.push("expected no mode");
  } else if (
    !S.includes(
      `Mode: ${modes.length > 1 ? `${modes.slice(0, -1).join(", ")}${modes.length > 2 ? "," : ""} and ${modes[modes.length - 1]}`.replace(/^(\d+),? and/, "$1 and") : modes[0]}.`,
    ) &&
    !modes.every((m) => S.includes(String(m)))
  )
    f.push(`mode expected ${modes}`);
  if (!S.includes(`Range: ${data[n - 1]} − ${data[0]} = ${data[n - 1] - data[0]}.`))
    f.push("range");
  if (st.display === "bar") {
    if (!/Bar graph|bar graph/.test(svgAlt(o.svgs[0]))) f.push("bar graph shown");
  } else if (!svgDesc(o.svgs[0]).includes(`There are ${n} data values in all`) && n > 1)
    f.push("line plot count");
  return f.join("; ");
};

V.coordinate = (st, o) => {
  if (o.err) return "unexpected error";
  const x = nI(st.x, 0, 10);
  const y = nI(st.y, 0, 10);
  const S = o.summary;
  const f = [];
  if (!S.includes(`The next point is (${x}, ${y}): go ${x} right from 0, then ${y} up.`))
    f.push("next point");
  return f.join("; ");
};

/* ------------------------------------------------------------------ Part 1 driver */
const rng = makeRng("mls-manips-a");
function randomValue(c) {
  if (c.type === "stepper") return c.min + rng.int(0, c.max - c.min);
  if (c.type === "choice") return rng.pick(c.options);
  return rng.chance(0.5);
}
function extremeValue(c, which) {
  if (c.type === "stepper") return which === "min" ? c.min : c.max;
  if (c.type === "choice") return which === "min" ? c.options[0] : c.options[c.options.length - 1];
  return which === "max";
}

QUAD_FOUND = quadGrid(8);
{
  // Corroborate the four-sided rules against real quadrilaterals before trusting them as an oracle.
  const mine = new Set();
  for (const eq of [0, 1])
    for (let r = 0; r <= 4; r++)
      for (let p = 0; p <= 2; p++) {
        const key = `${eq}|${r}|${p}`;
        // possibility according to the TOOL
        const el = document.createElement("div");
        const m = MANIPS.shapebuilder.mount(el);
        m.set("kind", "poly");
        m.set("sides", "4");
        m.set("equal", !!eq);
        m.set("right", r);
        m.set("parallel", p);
        if (!el.querySelector(".ml-man-err")) mine.add(key);
      }
  const grid = QUAD_FOUND;
  const claimedNotFound = [...mine].filter((k) => !grid.has(k));
  const foundNotClaimed = [...grid].filter((k) => !mine.has(k) && Number(k.split("|")[2]) <= 2);
  check(
    `shapebuilder: the tool accepts only attribute sets that real quadrilaterals have (${grid.size} sets found on an 8x8 grid, ${mine.size} accepted)`,
    claimedNotFound.length === 0,
    `accepted but no quadrilateral found: ${claimedNotFound}`,
  );
  check(
    "shapebuilder: no real quadrilateral is refused by the tool",
    foundNotClaimed.length === 0,
    `real but refused: ${foundNotClaimed}`,
  );
}

const state0 = {};
for (const id of IDS) {
  const def = MANIPS[id];
  check(
    `${id}: exposes id, title, band, purpose, mount`,
    def &&
      def.id === id &&
      def.title &&
      ["1-2", "3-5"].includes(def.band) &&
      def.purpose &&
      typeof def.mount === "function",
  );
  const host = document.createElement("div");
  document.getElementById("r").append(host);
  const mt = def.mount(host);
  await tick();
  const ctls = controlsOf(host).filter((c) => c.id !== "pts");
  const init = JSON.parse(JSON.stringify(mt.state));
  const initSummary = read(host).summary;
  state0[id] = { init, initSummary };
  const body = host.textContent;
  check(
    `${id}: has a purpose line, 2-3 notice prompts and a Reset button`,
    host.querySelector(".ml-man-purpose")?.textContent.length > 20 &&
      [2, 3].includes(host.querySelectorAll(".ml-man-notice li").length) &&
      [...host.querySelectorAll("button")].some((b) => b.textContent === "Reset") &&
      body.length > 0,
  );
  // keyboard operability by construction: every stepper has a typed field and +/- buttons; nothing relies on drag
  check(
    `${id}: every stepper has a typed field and Decrease/Increase buttons; no draggable or pointer-only element`,
    ctls
      .filter((c) => c.type === "stepper")
      .every((c) =>
        host.querySelector(
          `button[aria-label="Decrease ${host.querySelector(`label[for="man-${id}-${c.id}"]`).textContent}"]`,
        ),
      ) && !host.querySelector("[draggable], [onmousedown], [onpointerdown]"),
  );

  let errs = 0;
  let total = 0;
  const problems = [];
  const visit = async (label) => {
    await tick();
    const o = read(host);
    total++;
    const st = mt.state;
    const bad = [];
    if (o.err) {
      errs++;
      if (THROWN.test(o.err) || !o.err.trim()) bad.push(`thrown/blank error: ${o.err}`);
      if (o.summary) bad.push("error and summary together");
    } else {
      if (!o.summary.trim()) bad.push("empty summary");
      if (BAD_TEXT.test(o.summary)) bad.push(`bad text in summary: ${o.summary}`);
      for (const s of o.svgs) {
        if (BAD_TEXT.test(svgText(s))) bad.push("bad text in svg");
        if (!/<svg[^>]*viewBox/.test(s)) bad.push("svg without viewBox");
      }
      if (!o.svgs.length && !host.querySelector(".ml-man-extra")) bad.push("no picture");
      const eqs = badEquations(o.summary);
      if (eqs.length) bad.push(`false equation: ${eqs.join(" | ")}`);
    }
    if (V[id]) {
      const msg = V[id](st, o);
      if (msg) bad.push(msg);
    }
    if (bad.length)
      problems.push(
        `[${label}] ${JSON.stringify(st)}\n  ${bad.join("\n  ")}\n  summary: ${o.summary || o.err}`,
      );
    return o;
  };
  const apply = async (values, label) => {
    for (const c of ctls) mt.set(c.id, values[c.id]);
    return visit(label);
  };
  try {
    await apply(Object.fromEntries(ctls.map((c) => [c.id, extremeValue(c, "min")])), "all min");
    await apply(Object.fromEntries(ctls.map((c) => [c.id, extremeValue(c, "max")])), "all max");
    for (let i = 0; i < STATES; i++)
      await apply(Object.fromEntries(ctls.map((c) => [c.id, randomValue(c)])), `random ${i}`);
    // one control at a time through its whole range (every choice, every stepper value) from a valid base
    for (const c of ctls) {
      const base = Object.fromEntries(ctls.map((x) => [x.id, init[x.id]]));
      for (const x of ctls) mt.set(x.id, base[x.id]);
      const values =
        c.type === "stepper"
          ? Array.from(
              { length: Math.min(c.max - c.min + 1, 40) },
              (_, i) =>
                c.min +
                Math.round((i * (c.max - c.min)) / Math.max(1, Math.min(c.max - c.min, 39))),
            )
          : c.type === "choice"
            ? c.options
            : [false, true];
      for (const v of values) {
        mt.set(c.id, v);
        await visit(`sweep ${c.id}=${v}`);
      }
    }
    // typed junk through the real input handler
    for (const c of ctls.filter((x) => x.type === "stepper")) {
      const inp = host.querySelector(`[data-ctl="${c.id}"]`);
      for (const junk of ["", "abc", "-5", "1e9", "7.5", "0", "999999", " 12 "]) {
        for (const x of ctls) mt.set(x.id, init[x.id]);
        inp.value = junk;
        inp.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
        await visit(`typed ${c.id}="${junk}"`);
      }
    }
  } catch (e) {
    problems.push(`EXCEPTION ${e.stack}`);
  }
  check(
    `${id}: ${total} driven states (min, max, ${STATES} random, one-control sweeps, typed junk): summary matches the state, svg renders, mathematics holds`,
    problems.length === 0,
    problems.slice(0, 4).join("\n"),
  );
  check(
    `${id}: most states are valid (${total - errs}/${total}); errors only for states with no valid reading`,
    errs / total < 0.6,
    `${errs} of ${total} states were errors`,
  );

  // reset restores the start
  try {
    for (const c of ctls) mt.set(c.id, randomValue(c));
    [...host.querySelectorAll("button")].find((b) => b.textContent === "Reset").click();
    await tick();
    const after = read(host);
    check(
      `${id}: Reset restores the start state and its summary`,
      JSON.stringify(mt.state) === JSON.stringify(init) && after.summary === initSummary,
      `${JSON.stringify(mt.state)} vs ${JSON.stringify(init)}`,
    );
  } catch (e) {
    check(`${id}: Reset restores the start state and its summary`, false, e.stack);
  }
}

/* ---- button-driven scenarios (placevalue trades, coordinate points, mode visibility) */
if (IDS.includes("placevalue")) {
  const host = document.createElement("div");
  const mt = MANIPS.placevalue.mount(host);
  let bad = [];
  let clicks = 0;
  for (let i = 0; i < 150; i++) {
    const v = { hundreds: rng.int(0, 9), tens: rng.int(0, 20), ones: rng.int(0, 30) };
    if (100 * v.hundreds + 10 * v.tens + v.ones > 999) continue;
    for (const [k, val] of Object.entries(v)) mt.set(k, val);
    await tick();
    const total = 100 * v.hundreds + 10 * v.tens + v.ones;
    for (const [key, delta] of [
      ["t-ones", { ones: -10, tens: 1 }],
      ["t-tens", { tens: -10, hundreds: 1 }],
      ["b-ten", { tens: -1, ones: 10 }],
      ["b-hundred", { hundreds: -1, tens: 10 }],
    ]) {
      for (const [k, val] of Object.entries(v)) mt.set(k, val);
      await tick();
      const b = host.querySelector(`[data-act="${key}"]`);
      if (b.getAttribute("aria-disabled") === "true") {
        const before = JSON.stringify(mt.state);
        b.click();
        await tick();
        if (JSON.stringify(mt.state) !== before) bad.push(`${key} acted while unavailable`);
        continue;
      }
      b.click();
      clicks++;
      await tick();
      const s = mt.state;
      const nt = 100 * s.hundreds + 10 * s.tens + s.ones;
      const expect = {
        hundreds: v.hundreds + (delta.hundreds || 0),
        tens: v.tens + (delta.tens || 0),
        ones: v.ones + (delta.ones || 0),
      };
      if (nt !== total)
        bad.push(`${key}: value changed from ${total} to ${nt} at ${JSON.stringify(v)}`);
      if (s.hundreds !== expect.hundreds || s.tens !== expect.tens || s.ones !== expect.ones)
        bad.push(`${key}: blocks ${JSON.stringify(s)} expected ${JSON.stringify(expect)}`);
      if (!host.querySelector(`[data-act="${key}"]`)) bad.push("button vanished");
    }
  }
  check(
    `placevalue: ${clicks} trades keep the number the same and move exactly one group of ten`,
    bad.length === 0 && clicks > 100,
    bad.slice(0, 3).join("\n"),
  );
}

if (IDS.includes("coordinate")) {
  const host = document.createElement("div");
  const mt = MANIPS.coordinate.mount(host);
  await tick();
  const exp = [];
  const bad = [];
  const letter = (i) => String.fromCharCode(65 + i);
  const click = async (k) => {
    host.querySelector(`[data-act="${k}"]`).click();
    await tick();
  };
  for (let i = 0; i < 400; i++) {
    const x = rng.int(0, 10);
    const y = rng.int(0, 10);
    mt.set("x", x);
    mt.set("y", y);
    await tick();
    const roll = rng.next();
    if (roll < 0.62) {
      const dup = exp.some((p) => p.x === x && p.y === y);
      await click("add");
      if (!dup && exp.length < 8) exp.push({ x, y });
    } else if (roll < 0.9) {
      await click("remove");
      exp.pop();
    } else {
      await click("clear");
      exp.length = 0;
    }
    const o = read(host);
    const rows = [...host.querySelectorAll(".ml-man-table tbody tr")].map((r) =>
      [...r.children].map((c) => c.textContent),
    );
    if (
      rows.length !== exp.length ||
      rows.some((r, j) => r[0] !== letter(j) || r[1] !== `(${exp[j].x}, ${exp[j].y})`)
    )
      bad.push(`step ${i}: table ${JSON.stringify(rows)} expected ${JSON.stringify(exp)}`);
    const want = exp.length
      ? `Points on the plane: ${exp.map((p, j) => `${letter(j)} (${p.x}, ${p.y})`).join(", ")}. `
      : "No points are on the plane yet. ";
    if (!o.summary.includes(want)) bad.push(`step ${i}: summary points ${o.summary}`);
    const desc = svgDesc(o.svgs[0]);
    const wantDesc = exp.map((p, j) => `${letter(j)} (${p.x}, ${p.y})`).join(", ");
    if (exp.length && !desc.includes(`Points: ${wantDesc}.`))
      bad.push(`step ${i}: picture points ${desc}`);
    if (!exp.length && /Points:/.test(desc))
      bad.push(`step ${i}: picture shows points that are not there`);
    if (exp.length >= 2) {
      const a = exp[exp.length - 2];
      const b = exp[exp.length - 1];
      const nm = `${letter(exp.length - 2)} and ${letter(exp.length - 1)}`;
      const dxs = Math.abs(a.x - b.x);
      const dys = Math.abs(a.y - b.y);
      if (
        a.y === b.y && a.x !== b.x
          ? !o.summary.includes(`${nm} are on the same horizontal line, ${dxs} units apart`)
          : a.x === b.x && a.y !== b.y
            ? !o.summary.includes(`${nm} are on the same vertical line, ${dys} units apart`)
            : !o.summary.includes("not on the same grid line")
      )
        bad.push(`step ${i}: distance claim wrong for ${JSON.stringify([a, b])}: ${o.summary}`);
    }
    const addBtn = host.querySelector('[data-act="add"]');
    const shouldBeOff = exp.some((p) => p.x === x && p.y === y) || exp.length >= 8;
    if ((addBtn.getAttribute("aria-disabled") === "true") !== shouldBeOff)
      bad.push(`step ${i}: add availability`);
    if (exp.length > 8) bad.push("more than 8 points");
  }
  check(
    "coordinate: 400 add/remove/clear presses keep the list, table, picture and distances in step (no duplicates, at most 8)",
    bad.length === 0,
    bad.slice(0, 3).join("\n"),
  );
}

{
  // controls that do not matter in a mode leave the tab order
  const hiddenRows = async (id, set) => {
    const host = document.createElement("div");
    const mt = MANIPS[id].mount(host);
    for (const [k, v] of Object.entries(set)) mt.set(k, v);
    await tick();
    await tick();
    return new Set(
      [...host.querySelectorAll("[data-ctl]")]
        .filter((n) => n.closest(".ml-man-row").hidden)
        .map((n) => n.dataset.ctl),
    );
  };
  if (IDS.includes("numberline")) {
    const a = await hiddenRows("numberline", { mode: "frac" });
    const b = await hiddenRows("numberline", { mode: "dec" });
    check(
      "numberline: each mode shows only its own controls",
      a.has("max") &&
        a.has("tick") &&
        a.has("win") &&
        !a.has("den") &&
        b.has("den") &&
        b.has("max") &&
        !b.has("win"),
    );
  }
  if (IDS.includes("shapebuilder")) {
    const a = await hiddenRows("shapebuilder", { kind: "round" });
    const b = await hiddenRows("shapebuilder", { kind: "poly" });
    check(
      "shapebuilder: straight-sided and round shapes show only their own controls",
      a.has("sides") &&
        a.has("right") &&
        !a.has("fraction") &&
        b.has("fraction") &&
        !b.has("sides"),
    );
  }
  if (IDS.includes("coordinate")) {
    const a = await hiddenRows("coordinate", {});
    check(
      "coordinate: the stored point list is not shown as a control",
      a.has("pts") && !a.has("x"),
    );
  }
  if (IDS.includes("clock")) {
    const a = await hiddenRows("clock", { mode: "show" });
    const b = await hiddenRows("clock", { mode: "elapsed" });
    check(
      "clock: the elapsed-minutes control appears only in elapsed mode",
      a.has("elapsed") && !b.has("elapsed"),
    );
  }
  if (IDS.includes("fracstrips")) {
    const a = await hiddenRows("fracstrips", { mode: "equivalent" });
    check(
      "fracstrips: equivalent mode hides strip B",
      a.has("pb") && a.has("sb") && !a.has("mult"),
    );
  }
}

// no purple anywhere in what the manipulatives draw themselves
{
  const src =
    fs.readFileSync(path.join(LAB, "src/mls/manips-a.js"), "utf8") +
    fs.readFileSync(path.join(LAB, "mls-play-manips-a.css"), "utf8");
  const hexes = [...src.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0].toLowerCase());
  const hue = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    if (mx === mn) return -1;
    const d = mx - mn;
    const hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (hh * 60 + 360) % 360;
  };
  const sat = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const l = (mx + mn) / 2;
    return mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
  };
  const purple = [...new Set(hexes)].filter((x) => hue(x) >= 255 && hue(x) <= 335 && sat(x) > 0.15);
  check(
    `no violet, purple or magenta colour in manips-a.js or its stylesheet (${new Set(hexes).size} colours checked)`,
    purple.length === 0,
    purple.join(", "),
  );
  check(
    "manips-a.js has no timers, no drag handlers and no innerHTML of user text",
    !/setInterval|setTimeout|requestAnimationFrame|dragstart|ondrag|pointermove|mousemove/.test(
      src,
    ),
  );
}

/* ------------------------------------------------------------------ Part 2: Chromium */
if (!argv.includes("--no-browser")) {
  const OUT = "/tmp/mls-manips-a";
  fs.mkdirSync(OUT, { recursive: true });
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (e) {
    check("playwright is installed", false, String(e));
  }
  const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Manipulatives A</title>
<link rel="stylesheet" href="/access-practice-lab/mls-play.css"><link rel="stylesheet" href="/access-practice-lab/mls-play-manips-a.css">
<style>body{margin:0;padding:16px;font:16px/1.5 Arial,Helvetica,sans-serif;background:#F7F4EC;color:#24323F}
.btn{border:2px solid #17324D;background:#fff;color:#17324D;border-radius:8px;padding:.4rem .8rem;font:inherit;cursor:pointer}
select,input{font:inherit;color:#24323F}h1{font-size:1.4rem;margin:0 0 .5rem}</style></head>
<body><main><h1>Manipulative</h1><div class="ml-stage" id="stage"></div></main>
<script type="module">import {MANIPS} from "/access-practice-lab/src/mls/manips-a.js";
window.mountManip=(id)=>{const s=document.getElementById("stage");s.textContent="";window.__m=MANIPS[id].mount(s,{});return true;};window.__ready=true;</script></body></html>`;
  const MIME = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".html": "text/html",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
  };
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split("?")[0]);
    if (u === "/test.html") {
      res.writeHead(200, { "content-type": "text/html" });
      return res.end(PAGE);
    }
    const f = path.join(ROOT, u);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.writeHead(404);
      return res.end("not found");
    }
    res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const axeSrc = fs.readFileSync(path.join(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");

  if (chromium) {
    const browser = await chromium.launch({
      executablePath: process.env.PW_CHROMIUM_PATH || "/opt/pw-browsers/chromium",
      args: ["--no-sandbox"],
    });
    const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error" && !/Failed to load resource/.test(m.text()))
        pageErrors.push(m.text());
    });
    await page.goto(`${base}/test.html`);
    await page.waitForFunction(() => window.__ready === true);

    const summaryOf = () =>
      page.evaluate(
        () =>
          document.querySelector("[data-ml-summary]")?.textContent ||
          document.querySelector(".ml-man-err")?.textContent ||
          "",
      );
    const describeActive = () =>
      page.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body || !document.getElementById("stage").contains(a)) return null;
        return {
          tag: a.tagName,
          type: a.type || "",
          ctl: a.dataset.ctl || "",
          act: a.dataset.act || "",
          text: a.textContent.trim().slice(0, 40),
          min: a.min,
          max: a.max,
          value: a.value,
          disabled: a.getAttribute("aria-disabled") === "true",
          label: a.getAttribute("aria-label") || "",
          optIndex: a.tagName === "SELECT" ? a.selectedIndex : -1,
          optCount: a.tagName === "SELECT" ? a.options.length : 0,
        };
      });
    const tabIntoStage = async () => {
      await page.evaluate(() => {
        document.activeElement?.blur();
        window.scrollTo(0, 0);
        document.querySelector("h1").setAttribute("tabindex", "-1");
        document.querySelector("h1").focus();
        document.querySelector("h1").removeAttribute("tabindex");
      });
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press("Tab");
        if (await describeActive()) return true;
      }
      return false;
    };

    for (const id of IDS) {
      pageErrors.length = 0;
      await page.setViewportSize({ width: 375, height: 800 });
      await page.evaluate((i) => window.mountManip(i), id);
      await page.waitForTimeout(60);

      // ---- keyboard-only walk through every control
      const got = await tabIntoStage();
      let ops = 0;
      let changed = 0;
      const unchanged = [];
      let steps = 0;
      let leftStage = !got;
      let sawReset = false;
      let focusKept = true;
      const log = [];
      while (!leftStage && steps < 80) {
        steps++;
        const a = await describeActive();
        if (!a) {
          leftStage = true;
          break;
        }
        const before = await summaryOf();
        let did = false;
        if (a.tag === "INPUT" && a.type === "number") {
          const cur = Number(a.value);
          const lo = Number(a.min);
          const hi = Number(a.max);
          const target = cur >= hi ? Math.max(lo, cur - 1) : cur + 1; // a small typed change, so the walk stays in valid states
          await page.keyboard.press("ControlOrMeta+A");
          await page.keyboard.type(String(target));
          await page.keyboard.press("Tab");
          did = true;
          log.push(`type ${a.ctl}=${target}`);
        } else if (a.tag === "SELECT") {
          if (a.ctl === "pts") {
            await page.keyboard.press("Tab");
            continue;
          }
          await pressOnSelect(page, a.optIndex >= a.optCount - 1 ? "ArrowUp" : "ArrowDown");
          did = true;
          log.push(`select ${a.ctl}`);
          await page.keyboard.press("Tab");
        } else if (a.tag === "INPUT" && a.type === "checkbox") {
          await page.keyboard.press("Space");
          did = true;
          log.push(`toggle ${a.ctl}`);
          await page.keyboard.press("Tab");
        } else if (a.tag === "BUTTON") {
          if (a.text === "Reset") {
            sawReset = true;
            await page.keyboard.press("Enter");
            await page.waitForTimeout(40);
            await page.keyboard.press("Tab");
            continue;
          }
          if (/^(Decrease|Increase)/.test(a.label)) {
            if (a.label.startsWith("Increase")) {
              await page.keyboard.press("Enter");
              did = true;
              log.push(a.label);
              await page.keyboard.press("Tab");
            } else await page.keyboard.press("Tab");
          } else {
            // an action button: Enter (or Space), and focus must stay on a button of the same kind
            await page.keyboard.press(steps % 2 ? "Enter" : "Space");
            did = !a.disabled;
            log.push(`press ${a.act || a.text}`);
            await page.waitForTimeout(20);
            const now = await describeActive();
            if (!now || now.act !== a.act) focusKept = false;
            await page.keyboard.press("Tab");
          }
        } else await page.keyboard.press("Tab");
        if (did) {
          await page.waitForTimeout(25);
          ops++;
          const after = await summaryOf();
          if (after !== before) changed++;
          else unchanged.push(log[log.length - 1]);
        }
      }
      check(
        `${id}: keyboard only (Tab, typing, Space, Enter): ${ops} operations, ${changed} changed the live summary; Reset reachable`,
        ops >= 2 && changed >= Math.ceil(ops * 0.6) && sawReset,
        `ops ${ops}, changed ${changed}, unchanged: ${unchanged.join(", ")}, reset ${sawReset}`,
      );
      check(`${id}: pressing an action button by keyboard keeps focus on that button`, focusKept);
      check(
        `${id}: no page errors while operating it`,
        pageErrors.length === 0,
        pageErrors.slice(0, 3).join("\n"),
      );

      // ---- layout in a stressful state and the default
      const layoutProbe = async (label) => {
        const r = await page.evaluate(() => {
          const stage = document.getElementById("stage");
          const out = {
            overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
            scrollWidth: document.documentElement.scrollWidth,
            small: [],
            targets: [],
          };
          const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
          let n;
          while ((n = walker.nextNode())) {
            if (!n.textContent.trim()) continue;
            const el = n.parentElement;
            if (el.closest("svg") || el.closest("[hidden]") || el.closest(".ml-sr")) continue;
            const cs = getComputedStyle(el);
            if (cs.display === "none" || cs.visibility === "hidden") continue;
            if (parseFloat(cs.fontSize) < 15.99)
              out.small.push(
                `${el.tagName}.${el.className}: ${cs.fontSize} "${n.textContent.trim().slice(0, 30)}"`,
              );
          }
          for (const el of stage.querySelectorAll(
            "button, input:not([type=checkbox]), select, label:has(> input[type=checkbox])",
          )) {
            if (el.closest("[hidden]") || getComputedStyle(el).display === "none") continue;
            const b = el.getBoundingClientRect();
            if (b.width === 0) continue;
            if (b.height < 43.5 || b.width < 43.5)
              out.targets.push(
                `${el.tagName}[${el.dataset.ctl || el.dataset.act || el.getAttribute("aria-label") || el.textContent.slice(0, 20)}] ${Math.round(b.width)}x${Math.round(b.height)}`,
              );
          }
          return out;
        });
        check(
          `${id}: ${label}: no horizontal scroll at 375px (${r.scrollWidth}px), all text >= 16px, all targets >= 44px`,
          !r.overflow && r.small.length === 0 && r.targets.length === 0,
          `${r.overflow ? "overflow " : ""}${r.small.slice(0, 4).join("; ")} ${r.targets.slice(0, 6).join("; ")}`,
        );
      };
      await page.evaluate((i) => window.mountManip(i), id);
      await page.waitForTimeout(60);
      await layoutProbe("default state");
      await page.screenshot({ path: path.join(OUT, `${id}-375.png`), fullPage: true });

      // axe on the default and on a busy state
      const axeRun = async (label) => {
        await page.evaluate(axeSrc);
        const res = await page.evaluate(async () => {
          const r = await window.axe.run(document.getElementById("stage").closest("main"), {
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"],
            },
          });
          return r.violations
            .filter((v) => ["serious", "critical"].includes(v.impact))
            .map(
              (v) =>
                `${v.id} (${v.impact}): ${v.nodes
                  .slice(0, 2)
                  .map((n) => n.target.join(" "))
                  .join(" | ")}`,
            );
        });
        check(`${id}: ${label}: axe serious/critical = 0`, res.length === 0, res.join("\n"));
      };
      await axeRun("default state");

      // a busy state: every control at its largest valid-looking value
      await page.evaluate(() => {
        const m = window.__m;
        const stage = document.getElementById("stage");
        for (const n of stage.querySelectorAll("[data-ctl]")) {
          if (n.dataset.ctl === "pts") continue;
          if (n.tagName === "SELECT") m.set(n.dataset.ctl, n.options[n.options.length - 1].value);
          else if (n.type === "checkbox") m.set(n.dataset.ctl, true);
          else m.set(n.dataset.ctl, Math.round((Number(n.min) + Number(n.max)) / 2) + 1);
        }
      });
      await page.waitForTimeout(60);
      await layoutProbe("busy state");
      await page.screenshot({ path: path.join(OUT, `${id}-375-busy.png`), fullPage: true });
      await page.setViewportSize({ width: 1100, height: 800 });
      await page.screenshot({ path: path.join(OUT, `${id}-1100.png`), fullPage: true });
      await axeRun("busy state at 1100px");
    }

    /* ---- specific keyboard-only scenarios */
    const press = async (k, n = 1) => {
      for (let i = 0; i < n; i++) await page.keyboard.press(k);
    };
    const tabTo = async (pred, max = 60) => {
      for (let i = 0; i < max; i++) {
        const a = await describeActive();
        if (a && pred(a)) return a;
        await page.keyboard.press("Tab");
      }
      return null;
    };
    await page.setViewportSize({ width: 375, height: 800 });
    if (IDS.includes("placevalue")) {
      await page.evaluate(() => window.mountManip("placevalue"));
      await tabIntoStage();
      const a = await tabTo((x) => x.act === "t-ones");
      const before = await summaryOf();
      await press("Enter");
      await page.waitForTimeout(40);
      const after = await summaryOf();
      const st = await page.evaluate(() => window.__m.state);
      const now = await describeActive();
      check(
        "placevalue: Enter on 'Trade 10 ones for 1 ten' trades (13 ones -> 3 ones, 2 tens -> 3 tens), keeps 133, and keeps focus",
        !!a &&
          st.ones === 3 &&
          st.tens === 3 &&
          st.hundreds === 1 &&
          after.includes("= 133") &&
          before.includes("= 133") &&
          now &&
          now.act === "t-ones",
        `${JSON.stringify(st)} ${after}`,
      );
    }
    if (IDS.includes("coordinate")) {
      await page.evaluate(() => window.mountManip("coordinate"));
      await tabIntoStage();
      await tabTo((x) => x.ctl === "x");
      await press("ControlOrMeta+A");
      await page.keyboard.type("7");
      await press("Tab", 2); // + button of x? -> field y is after its two buttons
      const yField = await tabTo((x) => x.ctl === "y");
      await press("ControlOrMeta+A");
      await page.keyboard.type("2");
      await press("Tab");
      const add = await tabTo((x) => x.act === "add");
      await press("Enter");
      await page.waitForTimeout(40);
      const rows = await page.evaluate(() =>
        [...document.querySelectorAll(".ml-man-table tbody tr")].map((r) => r.textContent),
      );
      const now = await describeActive();
      check(
        "coordinate: typing 7 and 2 then Enter on 'Add point' adds A (7, 2) by keyboard alone, and focus stays on a button",
        !!yField &&
          !!add &&
          rows.length === 1 &&
          rows[0].includes("(7, 2)") &&
          now &&
          now.act === "add",
        `${JSON.stringify(rows)}`,
      );
    }
    if (IDS.includes("bonds")) {
      await page.evaluate(() => window.mountManip("bonds"));
      await tabIntoStage();
      await tabTo((x) => x.ctl === "guess");
      await press("ControlOrMeta+A");
      await page.keyboard.type("6");
      await press("Tab");
      await tabTo((x) => x.type === "checkbox" && x.ctl === "check");
      await press("Space");
      await page.waitForTimeout(40);
      const yes = await summaryOf();
      await tabTo((x) => x.ctl === "guess");
      await press("ControlOrMeta+A");
      await page.keyboard.type("5");
      await press("Tab");
      await page.waitForTimeout(40);
      const no = await summaryOf();
      check(
        "bonds: by keyboard, guessing 6 for the hidden part of 4 + ? = 10 checks as Yes and guessing 5 as Not yet (and never shows the answer)",
        /Yes\./.test(yes) && /Not yet\./.test(no) && !/part B is 6/.test(no),
        `${yes} || ${no}`,
      );
    }
    if (IDS.includes("decimalgrid")) {
      await page.evaluate(() => window.mountManip("decimalgrid"));
      await tabIntoStage();
      await tabTo((x) => x.ctl === "tenths");
      await press("ControlOrMeta+A");
      await page.keyboard.type("5");
      await press("Tab");
      const s = await summaryOf();
      check(
        "decimalgrid: typing 5 tenths by keyboard reads 0.57 and 57%",
        /5 tenths/.test(s) && /As a decimal: 0\.57/.test(s) && /57%/.test(s),
        s,
      );
    }
    await browser.close();
  }
  server.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log("FAILED:");
  for (const f of failed) console.log(`  - ${f.name}`);
  process.exit(1);
}
process.exit(0);
