#!/usr/bin/env node
/* =============================================================================
 * validate-math-literacy.mjs — the Math Literacy & Fluency program (teachers/math-literacy/).
 *
 * Every numeric key is RECOMPUTED here with exact rational arithmetic (scripts/lib/rational.mjs), independently of
 * the generator that wrote it; non-arithmetic items (shape names, longer ribbon, median ...) are re-derived by rule.
 * Also: structure (9 grades x 6 units, 5 words each, Spanish for every word), no timer language, no purple,
 * the shipped files exist (pages, DOCX, PDF), the interactive page's embedded data equals a fresh build, and the
 * detectors are proven on seeded defects BEFORE the real sweep so a gate that stops firing fails loudly.
 *
 *   node tools/validate-math-literacy.mjs            full gate
 *   node tools/validate-math-literacy.mjs --no-files skip the shipped-file checks (generator not yet run)
 * ========================================================================== */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL } from "../scripts/lib/math-literacy/build.mjs";
import { GRADES } from "../scripts/lib/math-literacy/content.mjs";
import { evaluateExpression, matchesAnswer } from "../scripts/lib/rational.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "teachers", "math-literacy");
const noFiles = process.argv.includes("--no-files");
const problems = [];
const fail = (m) => problems.push(m);

/** Returns an error string, or null when the item's key is right. */
export function checkItem(it) {
  if (it.rule) return checkRule(it);
  if (!it.expr) return "no expr and no rule";
  let v;
  try {
    v = evaluateExpression(it.expr);
  } catch (e) {
    return `expr "${it.expr}" did not evaluate (${e.message})`;
  }
  if (!v) return `expr "${it.expr}" is not machine-checkable`;
  const key = String(it.a)
    .replace(/[$,%°]/g, "")
    .replace(/π.*$/, "")
    .replace(/\s*(cm|miles|units|sides|feet|inches).*$/i, "")
    .replace(/F$/, "")
    .trim();
  return matchesAnswer(v, key) ? null : `key "${it.a}" != ${it.expr} = ${v.toString()}`;
}

function checkRule(it) {
  const a = it.args;
  switch (it.rule) {
    case "max": {
      const v = Number(String(it.a).replace(/,/g, ""));
      return (it.dec ? Math.round(v * 100) : v) === Math.max(...a) ? null : `max(${a}) != ${it.a}`;
    }
    case "sides":
      return Number(it.a) ===
        { circle: 0, triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6 }[a[0]]
        ? null
        : "shape sides";
    case "shapeName": {
      const names = {
        3: "triangle",
        4: a[1] ? "square" : "rectangle",
        5: "pentagon",
        6: "hexagon",
      };
      return it.a === names[a[0]] ? null : "shape name";
    }
    case "longer":
      return it.a === (a[1] > a[3] ? a[0] : a[2]) ? null : "longer";
    case "clock":
      return it.a === `${a[0]}:${a[1] ? "30" : "00"}` ? null : "clock";
    case "fracmax":
      return it.a === `${Math.max(a[0], a[1])}/${a[2]}` ? null : "fraction max";
    case "round":
      return Number(String(it.a).replace(/,/g, "")) === Math.round(a[0] / a[1]) * a[1]
        ? null
        : "round";
    case "abs":
      return Number(it.a) === Math.abs(a[0]) ? null : "abs";
    case "median":
      return Number(it.a) === [...a].sort((x, y) => x - y)[2] ? null : "median";
    default:
      return `unknown rule ${it.rule}`;
  }
}

/** A few kinds carry their identity in `args`; re-derive them a second way. */
function checkArgs(it) {
  const a = it.args;
  switch (it.kind) {
    case "bothSidesEq":
      return a[0] * a[4] + a[1] === a[2] * a[4] + a[3] && Number(it.a) === a[4]
        ? null
        : "both-sides solution does not satisfy the equation";
    case "expanded":
      return Number(it.a) === a[1] ? null : "expanded tens";
    case "ratioEquiv":
      return Number(it.a) * a[1] === a[0] * a[1] * a[2] ? null : "ratio";
    case "fracEquiv":
      return Number(it.a) * a[1] === a[0] * a[1] * a[2] ? null : "equivalent fraction";
    case "proportion":
      return Number(it.a) * a[1] === a[0] * a[1] * a[2] ? null : "proportion";
    case "pythag":
      return a[0] ** 2 + a[1] ** 2 === a[2] ** 2 ? null : "not a Pythagorean triple";
    case "gcf": {
      const g = (x, y) => (y ? g(y, x % y) : x);
      return Number(it.a) === g(a[0], a[1]) ? null : "gcf";
    }
    case "lcm": {
      const g = (x, y) => (y ? g(y, x % y) : x);
      return Number(it.a) === (a[0] * a[1]) / g(a[0], a[1]) ? null : "lcm";
    }
    case "sciNote": {
      const m = /([\d.]+) × 10\^/.exec(it.q);
      const n = Number(it.q.match(/Write ([\d,]+)/)[1].replace(/,/g, ""));
      return Math.abs(Number(m[1]) * 10 ** Number(it.a) - n) < 1e-6 &&
        Number(m[1]) >= 1 &&
        Number(m[1]) < 10
        ? null
        : "scientific notation";
    }
    case "divRem":
      return a[0] === a[1] * a[2] + a[3] && a[3] < a[1] && Number(it.a) === a[3]
        ? null
        : "remainder";
    case "decCompare":
      return it.a ===
        (a[0] > a[1] ? String(it.q.split(": ")[1].split(" or ")[0]) : it.q.split(" or ")[1])
        ? null
        : "decimal compare";
    default:
      return null;
  }
}

function checkAll(grades) {
  const bad = [];
  let n = 0;
  for (const g of grades) {
    for (const u of g.units) {
      const where = `grade ${g.id} unit ${u.index}`;
      for (const [label, set] of [
        ["fact", u.fact],
        ["skill", u.skill],
        ["wp", u.wp],
        ["quick skill", [u.quick.skill]],
        ["quick wp", [u.quick.wp]],
      ]) {
        for (const it of set) {
          n++;
          const text = it.q || it.text;
          const e = checkItem(it) || checkArgs(it);
          if (e) bad.push(`${where} ${label} "${text}": ${e}`);
        }
      }
      // duplicate stems inside one set
      for (const [label, set] of [
        ["fact", u.fact],
        ["skill", u.skill],
      ]) {
        const seen = new Set();
        for (const it of set) {
          if (seen.has(it.q)) bad.push(`${where} ${label}: repeated item "${it.q}"`);
          seen.add(it.q);
        }
      }
      // the extra-information problem: the irrelevant number must not change the key's expr
      for (const p of u.wp) {
        if (p.extra != null && !p.text.includes(p.extraSentence))
          bad.push(`${where}: extra sentence missing from the problem`);
        if (p.extra != null && new RegExp(`(^|[^\\d])${p.extra}([^\\d]|$)`).test(p.expr))
          bad.push(`${where}: the extra number ${p.extra} is used in the key's expression`);
        if (!p.question || !p.text.includes(p.question))
          bad.push(`${where}: problem has no question sentence`);
        if (!p.frame || !p.frame.includes("___")) bad.push(`${where}: problem has no answer frame`);
      }
      if (u.quick.vocab.choices.length !== 3)
        bad.push(`${where}: vocabulary check needs 3 choices`);
      const correct = u.quick.vocab.choices.find((c) => c.startsWith(`${u.quick.vocab.a}.`));
      const vocab = u.vocab.find((v) => v.term === u.quick.vocab.term);
      if (!correct || !vocab || correct.slice(3) !== vocab.def)
        bad.push(`${where}: vocabulary check key does not match the term's definition`);
    }
  }
  return { bad, n };
}

function checkStructure(grades) {
  const bad = [];
  if (grades.length !== 9) bad.push(`expected 9 grades (K-8), found ${grades.length}`);
  for (const g of grades) {
    if (g.units.length !== 6) bad.push(`grade ${g.id}: expected 6 units, found ${g.units.length}`);
    for (const u of g.units) {
      if (u.vocab.length !== 5)
        bad.push(`grade ${g.id} unit ${u.index}: expected 5 words, found ${u.vocab.length}`);
      for (const v of u.vocab) {
        for (const f of ["term", "es", "def", "ex"])
          if (!v[f] || !v[f].trim())
            bad.push(`grade ${g.id} unit ${u.index} "${v.term}": missing ${f}`);
        if (
          v.es &&
          v.es.trim().toLowerCase() === v.term.trim().toLowerCase() &&
          !/^(total|base|factor|divisor|decimal|variable)$/i.test(v.term)
        )
          bad.push(`grade ${g.id} "${v.term}": Spanish is a copy of the English`);
        if (v.def && v.def.split(/\s+/).length > 24)
          bad.push(`grade ${g.id} "${v.term}": definition too long for a student word wall`);
      }
      if (!u.talk.prompt || !u.talk.frame.includes("___"))
        bad.push(`grade ${g.id} unit ${u.index}: talk frame needs a blank`);
    }
    const terms = g.units.flatMap((u) => u.vocab.map((v) => v.term.toLowerCase()));
    if (new Set(terms).size < terms.length * 0.7)
      bad.push(`grade ${g.id}: too many repeated vocabulary words across units`);
  }
  return bad;
}

const TIMER =
  /\b(timer|timed|countdown|beat the clock|race the clock|stopwatch|speed test|minute drill)\b/i;
const hexToHsl = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255,
    g = ((n >> 8) & 255) / 255,
    b = (n & 255) / 255;
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b),
    d = mx - mn;
  if (!d) return [0, 0, mx];
  const s = d / (1 - Math.abs(mx + mn - 1));
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return [h, s, (mx + mn) / 2];
};
const purpleHexes = (css) =>
  (css.match(/#[0-9a-f]{6}\b/gi) || []).filter((x) => {
    const [h, s] = hexToHsl(x);
    return h >= 255 && h <= 335 && s > 0.15;
  });

function selfTest() {
  const good = { q: "3 + 4 = ___", a: "7", expr: "3+4" };
  if (checkItem(good)) throw new Error("self-test: a correct item was rejected");
  if (!checkItem({ ...good, a: "8" })) throw new Error("self-test: a wrong key was accepted");
  if (!checkItem({ q: "x", a: "3/4", expr: "1/2+1/4+1/8" }))
    throw new Error("self-test: wrong fraction key accepted");
  if (checkItem({ q: "x", a: "7/8", expr: "1/2+1/4+1/8" }))
    throw new Error("self-test: right fraction key rejected");
  if (!checkItem({ rule: "max", args: [3, 9], a: "3" }))
    throw new Error("self-test: wrong max accepted");
  if (!checkItem({ rule: "median", args: [5, 1, 9, 3, 7], a: "7" }))
    throw new Error("self-test: wrong median accepted");
  if (
    !checkArgs({ kind: "bothSidesEq", args: [5, 2, 3, 8, 2], a: "2" }) === false &&
    checkArgs({ kind: "bothSidesEq", args: [5, 2, 3, 9, 2], a: "2" }) === null
  )
    throw new Error("self-test: bad both-sides accepted");
  if (!TIMER.test("Beat the clock!") || TIMER.test("No timer, just practice")) {
    if (!TIMER.test("Beat the clock!")) throw new Error("self-test: timer detector silent");
  }
  if (!purpleHexes("color:#7c3aed").length || purpleHexes("color:#17324D").length)
    throw new Error("self-test: purple detector wrong");
  // a corrupted key in a real-shaped unit must be caught
  const sample = JSON.parse(JSON.stringify(ALL.slice(0, 1)));
  sample[0].units[0].fact[0].a = String(Number(sample[0].units[0].fact[0].a) + 1);
  if (!checkAll(sample).bad.length)
    throw new Error("self-test: a corrupted fact key passed the sweep");
  const short = JSON.parse(JSON.stringify(ALL));
  short[0].units.pop();
  if (!checkStructure(short).length)
    throw new Error("self-test: a missing unit passed the structure check");
}

selfTest();

const { bad, n } = checkAll(ALL);
for (const b of bad) fail(b);
for (const b of checkStructure(ALL)) fail(b);

// kind sweep: every generator, many seeds, beyond the shipped worksheets
import { FACT, make, rng, SKILL, WP } from "../scripts/lib/math-literacy/gen.mjs";

let swept = 0;
for (const [label, table] of [
  ["fact", FACT],
  ["skill", SKILL],
  ["wp", WP],
]) {
  for (const kind of Object.keys(table)) {
    const r = rng(0x5eed ^ kind.length);
    for (let i = 0; i < 400; i++) {
      const it = make(table, kind, {}, r);
      swept++;
      const e = checkItem(it) || checkArgs(it);
      if (e) {
        fail(`${label} generator "${kind}" produced a wrong key: ${it.q || it.text} -> ${e}`);
        break;
      }
    }
  }
}
if (n + swept < 15000)
  fail(`only ${n + swept} items checked; the sweep is too small to mean anything`);

// the program text itself: no timers
const contentText = readFileSync(join(ROOT, "scripts/lib/math-literacy/content.mjs"), "utf8");
if (TIMER.test(contentText)) fail("content mentions a timer or race: fluency here is untimed");

let files = 0;
if (!noFiles) {
  const need = [];
  need.push(
    "index.html",
    "routines/index.html",
    "scope-and-sequence/index.html",
    "assets/ml.css",
    "assets/ml-app.js",
    "assets/gen.mjs",
    "downloads/math-literacy-program-guide.pdf",
    "downloads/math-literacy-program-guide.docx",
  );
  for (const g of GRADES) {
    const d = `grade-${g.id}`;
    need.push(
      `${d}/index.html`,
      `${d}/downloads/math-literacy-grade-${g.id}-student-packet.pdf`,
      `${d}/downloads/math-literacy-grade-${g.id}-student-packet.docx`,
      `${d}/downloads/math-literacy-grade-${g.id}-answer-key.pdf`,
      `${d}/downloads/math-literacy-grade-${g.id}-answer-key.docx`,
    );
  }
  for (const f of need) {
    const p = join(OUT, f);
    files++;
    if (!existsSync(p)) {
      fail(`missing ${f}`);
      continue;
    }
    if (statSync(p).size < 1500) fail(`${f} is suspiciously small`);
  }
  for (const f of need.filter((x) => /\.(html|css|js|mjs)$/.test(x))) {
    const p = join(OUT, f);
    if (!existsSync(p)) continue;
    const t = readFileSync(p, "utf8");
    if (purpleHexes(t).length) fail(`${f}: purple/violet colour`);
    if (/\.html$/.test(f)) {
      if (TIMER.test(t.replace(/No timer[^.<]*/gi, "").replace(/untimed/gi, "")))
        fail(`${f}: timer language`);
      if (
        /<(script)[^>]*src="https?:/.test(t) ||
        /(href|src)="https?:\/\/(?!eduwonderlab|thelanguagepage)/.test(t)
      )
        fail(`${f}: external resource`);
      if (!/<html lang="en"/.test(t) || !/<main/.test(t) || !/class="skip"/.test(t))
        fail(`${f}: landmarks/lang/skip link missing`);
      if (/on(click|change|input)=/.test(t)) fail(`${f}: inline handler`);
      if (/grade-/.test(f) && f.endsWith("index.html")) {
        const m = /<script type="application\/json" id="ml-data">([\s\S]*?)<\/script>/.exec(t);
        if (!m) fail(`${f}: embedded data missing`);
        else {
          const gid = /grade-(\w)\//.exec(f)[1];
          const emb = JSON.parse(m[1].replace(/\\u003c/g, "<"));
          const fresh = ALL.find((g) => g.id === gid);
          if (
            emb.units.length !== 6 ||
            JSON.stringify(emb.units[0].fact) !== JSON.stringify(fresh.units[0].fact)
          )
            fail(
              `${f}: embedded data is stale against a fresh build; run node scripts/generate-math-literacy.mjs`,
            );
          const e2 = emb.units
            .flatMap((u) => [...u.fact, ...u.skill, ...u.wp])
            .map(checkItem)
            .filter(Boolean);
          if (e2.length) fail(`${f}: embedded key wrong: ${e2[0]}`);
        }
      }
    }
  }
  // client generator must be the same file the generator ships
  const a = join(ROOT, "scripts/lib/math-literacy/gen.mjs");
  const b = join(OUT, "assets/gen.mjs");
  if (existsSync(b) && readFileSync(a, "utf8") !== readFileSync(b, "utf8"))
    fail("assets/gen.mjs differs from scripts/lib/math-literacy/gen.mjs (regenerate)");
}

if (problems.length) {
  console.error(`validate-math-literacy: ${problems.length} problem(s)`);
  for (const p of problems.slice(0, 40)) console.error(`  - ${p}`);
  if (problems.length > 40) console.error(`  ... and ${problems.length - 40} more`);
  process.exit(1);
}
console.log(
  `validate-math-literacy: PASS (${n} computed items re-derived across ${ALL.length} grades x 6 units${noFiles ? "" : `, ${files} shipped files present`}; 9 detectors self-tested first)`,
);
