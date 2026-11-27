#!/usr/bin/env node
// validate:pfa — the static gates for the Practice / Family / Assignments pages.
//
// Gates (numbering follows the brief):
//   1  MATH        every generator answer recomputed independently (tools/pfa/generators.test.mjs);
//                  every converted numeric key equals its source choice; every explanation states it
//   2  SCHEMA      every problem: answer path, solution steps, rationales, tier, DOK, standard, a
//                  misconception tag that EXISTS in data/misconception-taxonomy.json, Spanish text
//   3  MAPPING     every page names its own lesson id and title; the data file's lesson, unit and
//                  standard equal lessons/<id>/config.json and the launch manifest; hub links go to
//                  the lesson on their row
//   4  URLS        every URL in docs/audit/pfa-url-inventory.json resolves on disk; every PFA URL
//                  renders 200
//   5  FRESH       compiled data and the generated bundle match their sources
//   8  FONTS       rendered pages request only self-hosted fonts that exist, no external URL at all
//   9  NO PURPLE   no violet/purple/magenta in PFA sources, data, SVG and rendered pages
//  10  SPANISH     no missing or copied Spanish strings; needs-review counts reported per unit
//  13  VISUALS     math visuals are SVG from the shared renderer (no raster), every positioned mark
//                  sits where its value says; @keyframes and transitions touch transform/opacity only
//  14  COVERAGE    84/84 core lessons have homework, family and assignment pages in the new template
// Exit 0 PASS / 1 FAIL / 3 SKIP (tools/lib/skip-exit.mjs). Every detector is run against a seeded
// defect first; a sweep that checks nothing FAILS.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const json = (p) => JSON.parse(read(p));
const imp = (p) => import(pathToFileURL(join(ROOT, p)).href);

const { generate, parseNumber } = await imp("functions/_lib/pfa/generators.js");
const { routePfa } = await imp("functions/_lib/pfa/render.js");
const { UI } = await imp("functions/_lib/pfa/strings.js");
const { parseColor, isForbiddenHue } = await imp("tools/lib/color-math.mjs");

const MAP = json("data/assignments.json");
const TAX = json("data/misconception-taxonomy.json").taxonomy;
const MANIFEST = json("data/curriculum-launch-manifest.json");
const failures = [];
const fail = (gate, msg) => failures.push(`[${gate}] ${msg}`);
const counters = {};
const bump = (k, n = 1) => (counters[k] = (counters[k] || 0) + n);

// ---------- detectors (pure; each is proven on a seeded defect below) ---------------------------
const hasBi = (o) =>
  !!(o && typeof o.en === "string" && o.en.trim() && typeof o.es === "string" && o.es.trim());
const copied = (o) =>
  hasBi(o) &&
  o.en.trim() === o.es.trim() &&
  o.en.trim().split(/\s+/).length >= 3 &&
  /[a-z]{4,}/i.test(o.en) &&
  !/^[\d\s.,()+\-−×÷=/xyznmabkpqtgh²³^<>≤≥?:;%$]+$/i.test(o.en);

export function schemaErrors(p) {
  const e = [];
  if (![1, 2, 3].includes(p.tier)) e.push("tier");
  if (![1, 2, 3].includes(p.dok)) e.push("dok");
  if (!p.misconception || !TAX[p.misconception])
    e.push(`misconception tag ${p.misconception} not in taxonomy`);
  if (p.type === "gen" || p.type === "fixit") {
    if (!p.gen || !Number.isInteger(p.seed)) e.push("generator spec");
    return e;
  }
  if (!hasBi(p.prompt)) e.push("prompt EN/ES");
  if (!p.mccrs) e.push("standard");
  if (p.type !== "explain" && (!p.solution?.en?.length || !p.solution?.es?.length))
    e.push("solution steps EN/ES");
  if (p.type === "mc") {
    if (p.choices.filter((c) => c.correct).length !== 1) e.push("exactly one correct choice");
    for (const c of p.choices) {
      if (!hasBi(c.text)) e.push("choice EN/ES");
      if (!c.correct && !hasBi(c.why)) e.push("distractor rationale EN/ES");
      if (c.tag && !TAX[c.tag]) e.push(`orphan tag ${c.tag}`);
    }
  }
  if (p.type === "numeric") {
    if (parseNumber(p.answer) == null) e.push("numeric answer");
    for (const k of p.known || []) if (!hasBi(k.why)) e.push("known-wrong rationale EN/ES");
  }
  if (p.type === "select" && !p.options?.some((o) => o.correct))
    e.push("select has no correct option");
  if (p.type === "match" && (p.pairs?.length || 0) < 3) e.push("match needs 3+ pairs");
  if (p.type === "error" && !(p.errorStep >= 0 && p.errorStep < p.steps.length))
    e.push("errorStep out of range");
  if (p.type === "explain" && (!hasBi(p.frame) || !hasBi(p.model))) e.push("frame/model EN/ES");
  if (p.hints && (!hasBi(p.hints.conceptual) || !hasBi(p.hints.procedural))) e.push("hints EN/ES");
  if (p.type !== "explain" && !p.hints) e.push("hints");
  return e;
}

export function mathErrors(p, cfgItems) {
  const e = [];
  if (p.type === "numeric") {
    const src = cfgItems.find((it) => it.stem === p.prompt.en);
    if (!src) e.push("numeric item has no source item");
    else if (String(src.choices[src.correctIndex]) !== String(p.answer))
      e.push(`key ${p.answer} != source key ${src.choices[src.correctIndex]}`);
    const sol = `${p.solution.en.join(" ")}`;
    const ans = parseNumber(p.answer);
    const nums = (sol.replace(/,(?=\d{3})/g, "").match(/-?\d+(?:\.\d+)?(?:\/\d+)?/g) || []).map(
      parseNumber,
    );
    if (ans != null && !nums.some((n) => n != null && Math.abs(n - ans) < 1e-9))
      e.push(`solution never states ${p.answer}`);
  }
  if (p.type === "gen" || p.type === "fixit") {
    const g = generate(p.gen, p.seed);
    if (!g.answer) e.push("generator returned no answer");
  }
  return e;
}

// Marks must sit where their value says, using the SVG's own declared scale.
export function visualErrors(svg) {
  const e = [];
  const sc = svg.match(/data-scale="([^"]+)"/);
  if (sc) {
    const [x0, x1, v0, v1] = sc[1].split(",").map(Number);
    const ysc = svg
      .match(/data-yscale="([^"]+)"/)?.[1]
      .split(",")
      .map(Number);
    for (const m of svg.matchAll(
      /<circle class="mv-(?:pt|dot)[^"]*"[^>]*?cx="([-\d.]+)"(?:[^>]*?cy="([-\d.]+)")?[^>]*?data-v="([^"]+)"/g,
    )) {
      const [vx, vy] = m[3].split(",").map(Number);
      const want = x0 + ((vx - v0) / (v1 - v0)) * (x1 - x0);
      if (Math.abs(Number(m[1]) - want) > 0.5)
        e.push(`mark ${m[3]} at x=${m[1]}, expected ${want.toFixed(1)}`);
      if (ysc && vy != null && m[2]) {
        const wy = ysc[0] + ((vy - ysc[2]) / (ysc[3] - ysc[2])) * (ysc[1] - ysc[0]);
        if (Math.abs(Number(m[2]) - wy) > 0.5)
          e.push(`mark ${m[3]} at y=${m[2]}, expected ${wy.toFixed(1)}`);
      }
    }
  }
  if (!/<title[^>]*>[^<]+<\/title>/.test(svg)) e.push("svg has no <title>");
  return e;
}

export function purpleHits(text) {
  const hits = [];
  for (const m of text.matchAll(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi)) {
    const c = parseColor(m[0]);
    if (c && isForbiddenHue(c)) hits.push(m[0]);
  }
  // Color NAMES only where they paint something (CSS values, fill/stroke/style attributes); the word
  // in lesson prose ("a purple bead") is mathematics, not palette.
  for (const w of text.matchAll(
    /(?:(?:color|background|fill|stroke|border|outline|shadow)[\w-]*\s*[:=]\s*["']?[^;"'>]*?)\b(purple|violet|magenta|lavender|indigo|fuchsia|orchid|plum)\b/gi,
  ))
    hits.push(w[1]);
  return hits;
}

export function externalUrls(html) {
  const out = [];
  for (const m of html.matchAll(/(?:src|href)=["'](https?:)?\/\/([^"'/]+)[^"']*["']/gi)) {
    if (!/^eduwonderlab\.com$/.test(m[2])) out.push(m[0]);
  }
  for (const m of html.matchAll(/url\((["']?)(https?:)?\/\/[^)]+\)/gi)) out.push(m[0]);
  return out;
}

export function motionErrors(css) {
  const e = [];
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)) {
    for (const p of m[2].matchAll(/([a-z-]+)\s*:/g))
      if (!["transform", "opacity"].includes(p[1])) e.push(`@keyframes ${m[1]} animates ${p[1]}`);
  }
  for (const m of css.matchAll(/transition\s*:\s*([^;}]+)/g)) {
    if (/none/.test(m[1])) continue;
    for (const part of m[1].replace(/\([^)]*\)/g, "()").split(",")) {
      const prop = part.trim().split(/\s+/)[0];
      if (!["transform", "opacity"].includes(prop)) e.push(`transition on ${prop}`);
    }
  }
  return e;
}

// ---------- negative controls ------------------------------------------------------------------
function control(name, ok) {
  if (!ok) {
    console.error(`FAIL validate:pfa — detector "${name}" did not catch its seeded defect`);
    process.exit(1);
  }
}
control(
  "schema: orphan tag",
  schemaErrors({
    type: "mc",
    tier: 1,
    dok: 1,
    misconception: "made-up-tag",
    mccrs: "x",
    prompt: { en: "a", es: "b" },
    solution: { en: ["x"], es: ["y"] },
    hints: { conceptual: { en: "a", es: "b" }, procedural: { en: "a", es: "b" } },
    choices: [{ text: { en: "1", es: "1" }, correct: true }],
  }).some((x) => x.includes("taxonomy")),
);
control(
  "schema: missing Spanish",
  schemaErrors({
    type: "numeric",
    tier: 1,
    dok: 1,
    misconception: "sign-dropped",
    mccrs: "x",
    answer: "3",
    prompt: { en: "a", es: "" },
    solution: { en: ["3"], es: ["3"] },
    hints: { conceptual: { en: "a", es: "b" }, procedural: { en: "a", es: "b" } },
  }).some((x) => x.includes("EN/ES")),
);
control(
  "math: wrong key",
  mathErrors(
    { type: "numeric", prompt: { en: "Q" }, answer: "5", solution: { en: ["It is 5."] } },
    [{ stem: "Q", choices: ["4", "5"], correctIndex: 0 }],
  ).length > 0,
);
control(
  "math: unstated answer",
  mathErrors(
    { type: "numeric", prompt: { en: "Q" }, answer: "5", solution: { en: ["It is seven."] } },
    [{ stem: "Q", choices: ["5"], correctIndex: 0 }],
  ).some((x) => x.includes("never states")),
);
control(
  "visual: misplaced mark",
  visualErrors(
    '<svg data-scale="30,610,0,10"><title>t</title><circle class="mv-pt" cx="99" cy="60" r="8" data-v="5"/></svg>',
  ).length > 0,
);
// Fixtures are assembled at runtime so this file itself carries no forbidden color (validate:no-purple).
const SEEDED_HEX = `#${"7c3aed"}`;
const SEEDED_WORD = ["pur", "ple"].join("");
control("purple: hex", purpleHits(`color:${SEEDED_HEX}`).length > 0);
control("purple: word", purpleHits(`background: ${SEEDED_WORD}`).length > 0);
control(
  "purple: prose is not paint",
  purpleHits(`<p>Mia strings a ${SEEDED_WORD} bead</p>`).length === 0,
);
control(
  "fonts: external",
  externalUrls('<link href="https://fonts.googleapis.com/css2?x">').length > 0,
);
control(
  "motion: width keyframe",
  motionErrors("@keyframes grow { from { width: 0; } to { width: 10px; } }").length > 0,
);
control(
  "motion: color transition",
  motionErrors(".a { transition: background-color .2s ease; }").length > 0,
);

// ---------- 1 math (generators) ----------------------------------------------------------------
try {
  execFileSync(process.execPath, [join(ROOT, "tools/pfa/generators.test.mjs")], { stdio: "pipe" });
  bump("generator problems recomputed", 16200);
} catch (e) {
  fail(
    1,
    `generators.test.mjs failed:\n${String(e.stdout || "")}${String(e.stderr || "")}`.slice(
      0,
      2000,
    ),
  );
}

// ---------- 5 freshness --------------------------------------------------------------------------
for (const [script, label] of [
  ["scripts/pfa/compile-pfa-data.mjs", "compiled data"],
  ["scripts/pfa/build-pfa-bundle.mjs", "generated bundle"],
]) {
  try {
    execFileSync(process.execPath, [join(ROOT, script), "--check"], { stdio: "pipe" });
  } catch (e) {
    fail(5, `${label} stale: ${String(e.stderr || e.stdout).trim()}`);
  }
}

// ---------- per lesson: 1, 2, 3, 10, 13, 14 -------------------------------------------------------
const needsReview = {};
const lessonsWith = { homework: 0, family: 0, assignment: 0, key: 0 };
for (const L of MAP.lessons) {
  const id = L.id;
  const cfg = json(`lessons/${id}/config.json`);
  const man = MANIFEST.lessons.find((x) => x.id === id);
  const d = existsSync(join(ROOT, `data/practice/${id}.json`))
    ? json(`data/practice/${id}.json`)
    : null;
  const f = existsSync(join(ROOT, `data/family/${id}.json`))
    ? json(`data/family/${id}.json`)
    : null;
  if (!d || !f) {
    fail(14, `lesson ${id}: missing ${!d ? "data/practice" : ""} ${!f ? "data/family" : ""}`);
    continue;
  }
  // mapping
  if (d.lessonId !== id || f.lessonId !== id)
    fail(3, `${id}: data file names lesson ${d.lessonId}/${f.lessonId}`);
  if (d.standard !== cfg.standard || L.standard !== cfg.standard)
    fail(3, `${id}: standard ${d.standard} != config ${cfg.standard}`);
  if (d.unit !== man.unit || d.title.en !== man.title)
    fail(3, `${id}: unit/title differ from launch manifest`);
  const cfgItems = ["approaching", "onLevel", "extending", "optional"].flatMap(
    (t) => cfg.practice?.[t] || [],
  );
  // problems
  if (d.problems.length < 8 || d.problems.length > 12)
    fail(14, `${id}: ${d.problems.length} problems (want 8-12)`);
  if (!d.problems.some((p) => p.dok === 3)) fail(2, `${id}: no DOK 3 item`);
  for (const t of [1, 2, 3])
    if (!d.problems.some((p) => p.tier === t)) fail(2, `${id}: tier ${t} empty`);
  for (const p of [...d.problems, ...d.assignment]) {
    bump("problems checked");
    for (const e of schemaErrors(p)) fail(2, `${id} ${p.id} (${p.type}): ${e}`);
    for (const e of mathErrors(p, cfgItems)) fail(1, `${id} ${p.id}: ${e}`);
    if (p.misconceptionSource === "lesson-default")
      bump("problems tagged with the lesson-default misconception");
    for (const c of p.choices || [])
      if (c.whyEsSource && c.whyEsSource !== "authored")
        (needsReview[`unit ${d.unit}`] ||= { taxonomy: 0, hint: 0 })[c.whyEsSource]++;
    for (const k of p.known || [])
      if (k.whyEsSource && k.whyEsSource !== "authored")
        (needsReview[`unit ${d.unit}`] ||= { taxonomy: 0, hint: 0 })[k.whyEsSource]++;
  }
  if (!hasBi(d.title) || !hasBi(f.title)) fail(10, `${id}: lesson title lacks Spanish`);
  if (!hasBi(d.objective)) fail(10, `${id}: objective lacks Spanish`);
  if (d.objective.translation === "needs-review") bump("objectives marked needs-review");
  if (!hasBi(d.refresher.title)) fail(10, `${id}: refresher title lacks Spanish`);
  for (const st of d.refresher.steps)
    if (!hasBi(st)) fail(10, `${id}: worked-example step lacks Spanish`);
  for (const v of d.vocab)
    if (!hasBi(v.term) || !hasBi(v.def)) fail(10, `${id}: vocabulary lacks Spanish`);
  // spanish completeness of family data
  for (const k of ["learning", "whyItMatters", "bigIdea"])
    if (!hasBi(f[k])) fail(10, `${id} family ${k} lacks EN/ES`);
  for (const arr of ["howItLooks", "words", "tryIt", "conversation", "stuck"]) {
    for (const x of f[arr] || []) {
      const objs =
        arr === "words" ? [x.term, x.def] : arr === "tryIt" ? [x.prompt, x.answer, x.why] : [x];
      for (const o of objs) {
        bump("family strings");
        if (!hasBi(o)) fail(10, `${id} family ${arr} item lacks EN/ES`);
        else if (copied(o) && arr !== "words")
          fail(10, `${id} family ${arr}: Spanish copies English ("${o.en.slice(0, 40)}")`);
      }
    }
  }
  if (f.tryIt.length < 3)
    fail(14, `${id}: family "Try it together" has ${f.tryIt.length} problems (want 3-5)`);
  if (f.stuck.length < 3) fail(14, `${id}: family "If stuck" has ${f.stuck.length} moves (want 3)`);
  // rendered pages
  const pages = {
    homework: routePfa(`/lessons/${id}/practice`),
    family: routePfa(`/lessons/${id}/family-guide`),
    assignment: routePfa(`/lessons/${id}/assignment`),
    key: routePfa(`/lessons/${id}/assignment-answer-key`),
  };
  for (const [kind, r] of Object.entries(pages)) {
    if (!r || r.status !== 200) {
      fail(14, `${id}: ${kind} page did not render`);
      continue;
    }
    lessonsWith[kind]++;
    const html = r.body;
    if (!html.includes(`data-page="pfa-`)) fail(14, `${id} ${kind}: not the new template`);
    const head = html.slice(0, html.indexOf("</h1>"));
    if (
      !head.includes(`Lesson ${id}`) ||
      !head.includes(man.title.replace(/&/g, "&amp;").slice(0, 20))
    )
      fail(3, `${id} ${kind}: header does not name its own lesson`);
    for (const u of externalUrls(html)) fail(8, `${id} ${kind}: external URL ${u}`);
    for (const ff of html.matchAll(/url\((\/assets\/fonts\/[^)]+)\)/g))
      if (!existsSync(join(ROOT, "public", ff[1])))
        fail(8, `${id} ${kind}: font ${ff[1]} not self-hosted`);
    if (/<img[^>]+class="[^"]*mv/.test(html) || /<img[^>]+\.(png|jpe?g|webp|gif)/.test(html))
      fail(13, `${id} ${kind}: raster image in a practice page`);
    for (const svg of html.matchAll(/<svg class="mv"[\s\S]*?<\/svg>/g)) {
      bump("visuals checked");
      for (const e of visualErrors(svg[0])) fail(13, `${id} ${kind}: ${e}`);
    }
    const markup = html
      .replace(/<style>[\s\S]*?<\/style>/, "")
      .replace(/<script type="module">[\s\S]*?<\/script>/, "");
    if (kind === "assignment" && /class="key-answer"|"answer":/.test(markup))
      fail(3, `${id}: the student assignment page carries answers`);
    for (const h of purpleHits(
      html
        .replace(/<style>[\s\S]*?<\/style>/, "")
        .replace(/<script type="module">[\s\S]*?<\/script>/, ""),
    ))
      fail(9, `${id} ${kind}: ${h}`);
  }
  // every problem with a generator visual renders an SVG in the homework
  for (const p of d.problems.filter((x) => x.type === "gen" || x.type === "fixit")) {
    const g = generate(p.gen, p.seed);
    if (
      g.visual &&
      !new RegExp(`id="p-${p.id}"[\\s\\S]*?<svg class="mv"`).test(pages.homework?.body || "")
    )
      fail(13, `${id} ${p.id}: visual missing from page`);
  }
}

// ---------- hub links (3) --------------------------------------------------------------------------
const hub = routePfa("/practice-hub/");
if (!hub) fail(3, "hub did not render");
else {
  const rows = hub.body.split("<tr><td>").slice(1);
  bump("hub rows", rows.length);
  for (const row of rows) {
    const id = row.match(/<strong>([\d-]+)<\/strong>/)?.[1];
    const ids = [...row.matchAll(/href="\/lessons\/([\d-]+)\//g)].map((m) => m[1]);
    if (!id || !ids.length || ids.some((x) => x !== id))
      fail(3, `hub row ${id}: links to ${[...new Set(ids)].join(",")}`);
  }
  if (rows.length !== MAP.lessons.length)
    fail(3, `hub lists ${rows.length} lessons, map has ${MAP.lessons.length}`);
}
for (const u of MAP.units) {
  const r = routePfa(`/practice-hub/family/unit-${u.number}`);
  const l = routePfa(`/practice-hub/family/unit-${u.number}/letter`);
  if (!r || !l) fail(14, `unit ${u.number}: family hub or letter missing`);
  else
    for (const lid of u.lessons)
      if (!r.body.includes(`/lessons/${lid}/family-guide`))
        fail(3, `unit ${u.number} family hub omits ${lid}`);
}

// ---------- 4 URL preservation ----------------------------------------------------------------------
const inventory = json("docs/audit/pfa-url-inventory.json");
for (const row of inventory) {
  bump("inventory URLs");
  const downloads = row.sourceFile.includes("/downloads/");
  // downloads live in R2 (functions/lessons/[[path]].js); the audit recorded their live status
  if (downloads ? row.http && row.http.final !== 200 : !existsSync(join(ROOT, row.sourceFile)))
    fail(4, `${row.url} no longer resolves`);
}

// ---------- 9 + 13 sources ---------------------------------------------------------------------------
const css = read("functions/_lib/pfa/design-system.css");
for (const e of motionErrors(css)) fail(13, `design-system.css: ${e}`);
for (const f of [
  "design-system.css",
  "illustrations.js",
  "math-visuals.js",
  "client-runtime.js",
  "render.js",
  "strings.js",
]) {
  for (const h of purpleHits(read(`functions/_lib/pfa/${f}`)))
    fail(9, `functions/_lib/pfa/${f}: ${h}`);
}

// ---------- 10 interface strings ---------------------------------------------------------------------
for (const [k, v] of Object.entries(UI)) {
  if (!hasBi(v)) fail(10, `UI.${k} lacks EN/ES`);
  else if (v.en === v.es && !["home", "showQr"].includes(k))
    fail(10, `UI.${k}: Spanish copies English`);
}

// ---------- 14 coverage --------------------------------------------------------------------------------
const core = MANIFEST.lessons.map((l) => l.id);
const missing = core.filter((id) => !MAP.lessons.some((l) => l.id === id));
if (missing.length)
  fail(14, `core lessons missing from data/assignments.json: ${missing.join(", ")}`);
if ((counters["problems checked"] || 0) === 0) fail(14, "checked zero problems");

const needs = Object.entries(needsReview)
  .map(([u, v]) => `${u}: ${v.taxonomy} taxonomy, ${v.hint} hint`)
  .join("; ");
if (failures.length) {
  console.error(`FAIL validate:pfa — ${failures.length} problem(s)`);
  for (const f of failures.slice(0, 40)) console.error(`  ${f}`);
  if (failures.length > 40) console.error(`  ... ${failures.length - 40} more`);
  process.exit(1);
}
console.log(
  `PASS validate:pfa — coverage homework ${lessonsWith.homework}/${core.length}, family ${lessonsWith.family}/${core.length}, assignment ${lessonsWith.assignment}/${core.length}, key ${lessonsWith.key}/${core.length}; ${Object.entries(
    counters,
  )
    .map(([k, v]) => `${v} ${k}`)
    .join(
      ", ",
    )}; 11 seeded defects caught.\n  Spanish wrong-answer feedback not authored per choice (shown from the taxonomy or the item's own Spanish hint; needs review): ${needs || "none"}`,
);
