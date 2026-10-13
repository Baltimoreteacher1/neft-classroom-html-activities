#!/usr/bin/env node
/**
 * validate-math-workbench.mjs — the Math Workbench's own contract (static half).
 *
 * THE FAILURES THIS EXISTS TO END. Every one was found on the live page by reading,
 * not by a gate, because each check here asks "does the page keep its promise?" and
 * the older gates only ask "does it parse and render?":
 *   1. PRESET WORDING. "Unit 4" told a student to shade "the 10×10 percent grid" and
 *      "Unit 8" to "use the balance scale" — tools the Workbench never had. A preset
 *      is the Workbench talking to a student about its own tools; the wording must
 *      name only tools the preset actually places.
 *   2. SPANISH THAT IS ONLY SPEECH. "Español" changed the read-aloud voice and nothing
 *      else. The interface string table must cover every static label, keep its
 *      {placeholders}, and the reference bank must have a Spanish card for every card.
 *   3. A SECOND COPY OF THE TEACHER PIN. The PIN is rotated in several places already;
 *      this surface reads the shared Teacher Mode flag and must never hold a PIN.
 *   4. STUDIO STANDARDS. The Reasoning Studio named 2010 CCSS codes while the site's
 *      source of truth is the 2025 MCCRS registry (data/ccss-standards.json).
 *   5. OFFLINE. Every file the page loads must be precached by sw.js, and exist.
 *   6. WORKED EXAMPLES. A worked example is a claim of arithmetic in the lesson's
 *      voice, so each one is recomputed here independently of the card text.
 * The browser half (first-viewport empty state, one-row top bar, no scroll, Spanish
 * leftovers, axe) is tools/validate-math-workbench-browser.mjs.
 *
 * Self-tests its detectors first: a gate that has stopped firing reports a clean page.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WB = join(ROOT, "curriculum/math-workbench");
const read = (p) => readFileSync(p, "utf8");

const failures = [];
const fail = (m) => failures.push(m);

/* ── Detectors (pure, so the self-test can feed them known-bad input) ────────── */

/** Words a preset's wording uses -> the object types that make the wording true. */
const WORDING = [
  [/10\s*[×x]\s*10|percent grid|hundred grid/i, ["hundredgrid"]],
  [/balance/i, ["balance"]],
  [/tape diagram/i, ["tape"]],
  [/fraction bar/i, ["fracbar"]],
  [/ratio table|table of x and y|table of x/i, ["ratiotable"]],
  [/double number line/i, ["dblnumline"]],
  [/integer chips/i, ["chips"]],
  [/place-value/i, ["placevalue"]],
  [/area model|arrays?/i, ["arraymodel"]],
  [/dot plot/i, ["dotplot"]],
  [/box plot/i, ["boxplot"]],
  [/number line/i, ["numline", "ineqline", "dblnumline"]],
  [/coordinate plane/i, ["coordgrid"]],
  [/graph the points/i, ["coordgrid"]],
];

export function presetWordingProblems(key, variantName, variant, supported) {
  const out = [];
  const types = new Set(variant.tools.map((t) => t.type));
  for (const type of types) {
    if (!supported.has(type) && variantName === "base") {
      out.push(`${key}: base tool "${type}" is not a type the board can draw`);
    }
  }
  const text = variant.problem || "";
  for (const [re, needs] of WORDING) {
    if (re.test(text) && !needs.some((n) => types.has(n))) {
      out.push(
        `${key} (${variantName}): wording mentions ${re} but places none of ${needs.join("/")}`,
      );
    }
  }
  return out;
}

export function placeholderProblems(es) {
  const out = [];
  const holders = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join(",");
  for (const [k, v] of Object.entries(es)) {
    if (typeof v !== "string" || !v.trim()) out.push(`empty Spanish value for "${k}"`);
    else if (holders(k) !== holders(v)) out.push(`placeholders differ for "${k}"`);
  }
  return out;
}

export function pinLiterals(source, pins) {
  return pins.filter((pin) => source.includes(pin));
}

/* ── Loading ─────────────────────────────────────────────────────────────────── */

function slice(source, startMarker, endMarker) {
  const a = source.indexOf(startMarker);
  const b = source.indexOf(endMarker, a);
  if (a < 0 || b < 0) throw new Error(`cannot find ${startMarker}…${endMarker} in index.html`);
  return source.slice(a + startMarker.length, b);
}
const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");

function loadWindowScript(files) {
  const window = {};
  const context = vm.createContext({ window });
  for (const f of files) vm.runInContext(read(join(WB, f)), context, { filename: f });
  return window;
}

/* ── Self-tests ──────────────────────────────────────────────────────────────── */
{
  const supported = new Set(["tape", "ineqline"]);
  const bad = presetWordingProblems(
    "x",
    "base",
    { tools: [{ type: "tape" }], problem: "Use the balance scale, then the 10×10 percent grid." },
    supported,
  );
  if (bad.length !== 2)
    fail(`self-test: wording detector found ${bad.length} of 2 planted problems`);
  const good = presetWordingProblems(
    "x",
    "base",
    { tools: [{ type: "tape" }], problem: "Use the tape diagram." },
    supported,
  );
  if (good.length) fail("self-test: wording detector flagged correct wording");
  if (placeholderProblems({ "Hi {a}": "Hola {b}" }).length !== 1)
    fail("self-test: placeholder detector missed a planted mismatch");
  if (placeholderProblems({ Hi: "" }).length !== 1) fail("self-test: empty-value detector missed");
  if (pinLiterals("const p = 'Secret1';", ["Secret1"]).length !== 1)
    fail("self-test: PIN detector missed a planted literal");
}

const html = read(join(WB, "index.html"));
const preScript = html.slice(0, html.indexOf("<script>"));

/* 1. presets ------------------------------------------------------------------- */
const supportedTypes = new Set(
  [
    ...slice(html, "function buildObjEl(o) {", "function buildNumLine").matchAll(
      /o\.type === "(\w+)"/g,
    ),
  ].map((m) => m[1]),
);
for (const t of [
  "ratiotable",
  "dblnumline",
  "tape",
  "fracbar",
  "placevalue",
  "chips",
  "numline",
  "coordgrid",
  "shape2d",
  "shape3d",
  "arraymodel",
  "dotplot",
  "boxplot",
  "ineqline",
]) {
  if (!supportedTypes.has(t)) fail(`board no longer draws "${t}" (extraction or builder changed)`);
}
const PRESETS = vm.runInNewContext(
  `(${slice(html, "const PRESETS = ", "\n      };\n\n      // Does this board really know").trim()}\n})`,
);
let upgradeCount = 0;
for (const [key, preset] of Object.entries(PRESETS)) {
  if (/unit10/i.test(key))
    fail(`preset "${key}": Unit 10 is not taught; do not ship a preset for it`);
  if (!preset.problem || !Array.isArray(preset.tools))
    fail(`preset "${key}" is missing problem or tools`);
  for (const p of presetWordingProblems(key, "base", preset, supportedTypes)) fail(p);
  if (preset.upgrade) {
    upgradeCount++;
    for (const p of presetWordingProblems(
      key,
      "upgrade",
      preset.upgrade,
      new Set([...supportedTypes, ...preset.upgrade.requires]),
    ))
      fail(p);
    for (const need of preset.upgrade.requires) {
      if (!preset.upgrade.tools.some((t) => t.type === need))
        fail(`preset "${key}": upgrade requires ${need} but does not place it`);
    }
  }
}
console.log(`presets: ${Object.keys(PRESETS).length} checked, ${upgradeCount} with an upgrade`);

/* 2. Spanish interface ------------------------------------------------------------ */
const w = loadWindowScript(["wb-i18n-es.js", "wb-i18n-es-panels.js", "wb-reference-es.js"]);
for (const p of placeholderProblems(w.MWB_ES)) fail(p);
const staticStrings = new Set();
for (const re of [
  /class="txt">([^<]+)</g,
  /class="lbl">([^<]+)</g,
  /\btitle="([^"]+)"/g,
  /aria-label="([^"]+)"/g,
  /placeholder="([^"]+)"/g,
  /<h[123][^>]*>([^<]+)</g,
]) {
  for (const m of preScript.matchAll(re)) {
    const text = decode(m[1]).replace(/\s+/g, " ").trim();
    if (/[A-Za-z]{3}/.test(text)) staticStrings.add(text);
  }
}
const IGNORE = new Set(["Go to page 1", "Delete page 1 (the current page)"]); // built from the page number; covered by patterns
for (const s of staticStrings) {
  if (IGNORE.has(s)) continue;
  if (!Object.hasOwn(w.MWB_ES, s) && !w.MWB_ES_PATTERNS.some(([re]) => re.test(s)))
    fail(`Spanish table has no entry for static text: "${s}"`);
}
console.log(
  `spanish: ${Object.keys(w.MWB_ES).length} phrases, ${staticStrings.size} static strings covered`,
);

/* 2b. reference bank parity + worked arithmetic ---------------------------------- */
const TOPICS = vm.runInNewContext(
  `(${"[" + slice(html, "const TOPICS = [", "\n      ];\n\n      // Build topic tabs")}\n])`,
);
let cards = 0;
const hasWords = (eq) =>
  /[A-Za-z]{3}/.test(
    String(eq)
      .replace(/<[^>]*>/g, " ")
      .replace(/\b[IVX]+\b/g, " "), // roman numerals (quadrants) are notation, not words
  );
for (const topic of TOPICS) {
  if (!w.MWBRefES.topic(topic.id)) fail(`reference topic "${topic.id}" has no Spanish name`);
  const items = topic.items || Object.values(topic.levels).flat();
  for (const it of items) {
    cards++;
    if (!w.MWBRefES.item(topic.id, it.name, "name"))
      fail(`reference card ${topic.id}/"${it.name}" has no Spanish name`);
    if (it.note && !w.MWBRefES.item(topic.id, it.name, "note"))
      fail(`reference card ${topic.id}/"${it.name}" has no Spanish note`);
    if (hasWords(it.eq) && !w.MWBRefES.item(topic.id, it.name, "eq"))
      fail(
        `reference card ${topic.id}/"${it.name}" has words in its formula but no Spanish version`,
      );
    if (topic.id === "worked") {
      const es = w.MWBRefES.item(topic.id, it.name, "steps");
      if (!Array.isArray(es) || es.length !== it.steps.length)
        fail(`worked example "${it.name}": Spanish steps differ in count from English`);
    }
  }
}
console.log(`reference bank: ${cards} cards have Spanish`);

// Independent recomputation of every worked example's final numbers.
const worked = Object.fromEntries(
  TOPICS.find((t) => t.id === "worked").items.map((i) => [i.name, i]),
);
const mentions = (item, ...needles) => {
  const text = item.steps.join(" ");
  for (const n of needles)
    if (!text.includes(n)) fail(`worked example "${item.name}": expected "${n}" in its steps`);
};
{
  mentions(worked["Equivalent ratios"], `2 × ${12 / 3} = ${(2 * 12) / 3}`);
  mentions(worked["Unit rate"], `7.50 ÷ 3 = ${(7.5 / 3).toFixed(2)}`);
  mentions(worked["Percent of a number"], `${90 / 10}`, `3 × ${90 / 10} = ${0.3 * 90}`);
  // 2/3 ÷ 1/4 = 8/3 = 2 2/3, and 2 2/3 × 1/4 = 2/3
  const num = 2 * 4;
  const den = 3 * 1;
  mentions(
    worked["Divide fractions"],
    `${num} ÷ ${den}`,
    `${Math.trunc(num / den)} y`.replace(" y", " and"),
  );
  mentions(worked["One-step equation"], `x = ${32 - 14}`);
  mentions(worked["Two-step equation"], `2x = ${11 - 3}`, `x = ${(11 - 3) / 2}`);
  mentions(worked["Area of a triangle"], `8 × 5 = ${8 * 5}`, `${(8 * 5) / 2}`);
  const data = [4, 8, 6, 10, 8, 6, 8];
  const sum = data.reduce((a, b) => a + b, 0);
  const sorted = [...data].sort((a, b) => a - b);
  mentions(
    worked["Mean and median"],
    `= ${sum}`,
    `${sum} ÷ ${data.length} ≈ ${(sum / data.length).toFixed(1)}`,
    sorted.join(", "),
    `is ${sorted[Math.floor(sorted.length / 2)]}`,
  );
  mentions(worked["Add integers"], `= ${-6 + 9}`);
  mentions(worked["Volume with fractional edges"], `= ${1.5 * 2 * 3}`);
  mentions(worked["Distance on a coordinate plane"], `= ${Math.abs(3 - -1)}`);
}

/* 3. no second copy of a teacher PIN ---------------------------------------------- */
{
  const tm = read(join(ROOT, "engine/core/teacher-mode.js"));
  const pins = [
    ...tm
      .slice(tm.indexOf("TEACHER_PINS"), tm.indexOf("ACCEPTED_TEACHER_PINS"))
      .matchAll(/:\s*"([^"]{6,})"/g),
  ].map((m) => m[1]);
  if (pins.length < 2) fail("could not read the Teacher Mode PINs to check for copies");
  for (const file of [
    "index.html",
    "wb-teacher.js",
    "wb-access.js",
    "wb-shell.js",
    "wb-calc.js",
    "wb-lesson.js",
    "wb-reference.js",
    "wb-i18n.js",
  ]) {
    const hit = pinLiterals(read(join(WB, file)), pins);
    if (hit.length) fail(`${file} holds a copy of a Teacher Mode PIN`);
  }
  if (!/require\(/.test(html) && !/MWBTeacher\.require/.test(html))
    fail("Live Board teacher controls are not gated by MWBTeacher.require");
}

/* 4. Studio standards come from the registry ---------------------------------------- */
{
  const registry = JSON.parse(read(join(ROOT, "data/ccss-standards.json"))).standards;
  const used = [...read(join(WB, "reasoning-data.js")).matchAll(/standard:\s*"([^"]+)"/g)].map(
    (m) => m[1],
  );
  // A Studio label may name a range ("6.AT.1–3") or a list ("6.GR.2, 6.GR.4"); every
  // code it spans must be a real registry key, so the label cannot name a standard
  // that does not exist.
  const expand = (label) =>
    label.split(/\s*,\s*/).flatMap((part) => {
      const range = /^(\d\.[A-Z]+\.)(\d+)[–-](\d+)$/.exec(part);
      if (!range) return [part];
      const out = [];
      for (let n = Number(range[2]); n <= Number(range[3]); n++) out.push(`${range[1]}${n}`);
      return out;
    });
  for (const label of used) {
    for (const code of expand(label)) {
      if (!registry[code])
        fail(`Studio standard "${code}" (in "${label}") is not in data/ccss-standards.json`);
    }
  }
}

/* 5. offline + referenced files ------------------------------------------------------- */
{
  const sw = read(join(WB, "sw.js"));
  const pre = [...slice(sw, "const PRECACHE = [", "];").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  for (const entry of pre) {
    const file = entry.startsWith("/")
      ? join(ROOT, entry)
      : join(WB, entry === "./" ? "index.html" : entry);
    // /assets/fonts/*.css is written by the build from data/font-bundles.json, so it is not
    // in the source tree; the bundle must be declared there instead.
    const fontBundle = /^\/assets\/fonts\/([\w-]+)\.css$/.exec(entry);
    if (fontBundle) {
      if (!read(join(ROOT, "data/font-bundles.json")).includes(`"${fontBundle[1]}"`))
        fail(
          `sw.js precaches "${entry}" but data/font-bundles.json declares no "${fontBundle[1]}" bundle`,
        );
      continue;
    }
    if (!existsSync(file)) fail(`sw.js precaches "${entry}" but it does not exist`);
  }
  for (const m of html.matchAll(/(?:src|href)="(\/curriculum\/math-workbench\/[^"?#]+)"/g)) {
    if (!existsSync(join(ROOT, m[1]))) fail(`index.html loads ${m[1]} but it does not exist`);
    const rel = `./${m[1].split("/").pop()}`;
    if (/\.(js|css)$/.test(m[1]) && !pre.includes(rel))
      fail(`${m[1]} is loaded but not precached by sw.js (offline Workbench would lose it)`);
  }
}

/* 6. the doorway into the board ------------------------------------------------------ */
{
  const shellDef = slice(html, "window.MWBShell = Object.freeze({", "\n      });");
  const defined = new Set([...shellDef.matchAll(/^\s{8}(\w+):/gm)].map((m) => m[1]));
  for (const file of readdirWbScripts()) {
    for (const m of read(join(WB, file)).matchAll(/\bMWBShell\.(\w+)/g)) {
      if (!defined.has(m[1]))
        fail(`${file} calls MWBShell.${m[1]} but index.html does not define it`);
    }
    for (const m of read(join(WB, file)).matchAll(/\bshell\.(\w+)\(/g)) {
      if (!defined.has(m[1]))
        fail(`${file} calls shell.${m[1]}() but index.html does not define it`);
    }
  }
}
function readdirWbScripts() {
  return [
    "wb-shell.js",
    "wb-access.js",
    "wb-reference.js",
    "wb-calc.js",
    "wb-lesson.js",
    "wb-teacher.js",
  ];
}

if (failures.length) {
  console.error(`\nFAIL validate:math-workbench — ${failures.length} problem(s)`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("PASS validate:math-workbench");
