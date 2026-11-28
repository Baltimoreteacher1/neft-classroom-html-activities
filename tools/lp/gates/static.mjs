// Static gates for the front layer (no browser). Each gate: { id, name, run(ctx) -> {ok, notes, count}, control(ctx) }.
// A control runs the same detector on a known-bad fixture and must FAIL; a gate whose control passes is broken.
import fs from "node:fs";
import path from "node:path";
import { loadData } from "../site/data.mjs";

/* ---------- exact rational arithmetic for G-08 ---------- */
const gcd = (a, b) => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};
const frac = (n, d = 1n) => {
  if (d === 0n) throw new Error("division by zero");
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
};
const fromDecimal = (s) => {
  const [i, f = ""] = s.split(".");
  return frac(BigInt(i + f || "0"), 10n ** BigInt(f.length));
};
const OPS = {
  "+": (a, b) => frac(a.n * b.d + b.n * a.d, a.d * b.d),
  "-": (a, b) => frac(a.n * b.d - b.n * a.d, a.d * b.d),
  "*": (a, b) => frac(a.n * b.n, a.d * b.d),
  "/": (a, b) => frac(a.n * b.d, a.d * b.n),
};
export function evaluate(expr) {
  if (!/^[\d+\-*/().\s]+$/.test(expr)) throw new Error(`illegal characters in "${expr}"`);
  const toks = expr.match(/\d+(?:\.\d+)?|[+\-*/()]/g) || [];
  let i = 0;
  const peek = () => toks[i];
  const primary = () => {
    const t = toks[i++];
    if (t === "(") {
      const v = sum();
      if (toks[i++] !== ")") throw new Error("missing )");
      return v;
    }
    if (t === "-") return OPS["-"](frac(0n), primary());
    if (t && /^\d/.test(t)) return fromDecimal(t);
    throw new Error(`unexpected "${t}"`);
  };
  const product = () => {
    let v = primary();
    while (peek() === "*" || peek() === "/") v = OPS[toks[i++]](v, primary());
    return v;
  };
  const sum = () => {
    let v = product();
    while (peek() === "+" || peek() === "-") v = OPS[toks[i++]](v, product());
    return v;
  };
  const v = sum();
  if (i !== toks.length) throw new Error("trailing input");
  return v;
}
const sameValue = (a, b) => a.n === b.n && a.d === b.d;
const numbersIn = (text) =>
  (
    String(text)
      .replace(/(\d),(\d{3})/g, "$1$2")
      .match(/-?\d+(?:\.\d+)?/g) || []
  ).map(fromDecimal);

/* ---------- content schema (G-07) ---------- */
const ELD = new Set(["ELD-SI", "ELD-LA", "ELD-MA", "ELD-SC", "ELD-SS"]);
const KLU = new Set(["Narrate", "Inform", "Explain", "Argue"]);
const AREAS = new Set(["Math", "Science", "Social Studies", "Language Arts", "School life"]);
const ICONS = new Set(
  "sun cloud rain snow wind plant seed tree water rock mountain fish bird bug magnet bulb thermometer beaker scale ruler clock calendar map compass house school bus bike book pencil computer ball apple money flag people ear mouth chart globe store park recycle trash music paint heart star question".split(
    " ",
  ),
);
const ORGS = new Set([
  "sequence",
  "claim-reasons",
  "compare",
  "cause-effect",
  "describe",
  "problem-solution",
]);
const wc = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;
const RANGES = {
  passage: { "grades-2-3": [120, 200], "grades-4-5": [200, 320], "grades-6-8": [300, 450] },
  script: { "grades-2-3": [90, 160], "grades-4-5": [150, 260], "grades-6-8": [220, 380] },
  writing: { "grades-2-3": [20, 90], "grades-4-5": [35, 160], "grades-6-8": [55, 260] },
};

function checkVisual(v, where, errs) {
  if (!v) return;
  if (v.type === "icons") {
    if (!Array.isArray(v.icons) || !v.icons.length)
      errs.push(`${where}: icons visual has no icons`);
    for (const n of v.icons || []) if (!ICONS.has(n)) errs.push(`${where}: unknown icon "${n}"`);
    if (!v.alt?.trim()) errs.push(`${where}: visual has no alt text`);
  } else if (v.type === "table") {
    if (!v.headers?.length || !v.rows?.length) errs.push(`${where}: table needs headers and rows`);
    for (const r of v.rows || [])
      if (r.length !== v.headers.length)
        errs.push(`${where}: table row length differs from headers`);
  } else errs.push(`${where}: unknown visual type "${v.type}"`);
}

export function validateSet(set, errs) {
  const id = set.id || "(no id)";
  for (const f of ["id", "slug", "title", "summary", "eld", "klu", "contentArea", "minutes"])
    if (set[f] == null || set[f] === "") errs.push(`${id}: missing ${f}`);
  if (!new RegExp(`^${set.cluster}-${set.domain}-[1-3]$`).test(set.id))
    errs.push(`${id}: id must be <cluster>-<domain>-<1..3>`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+){1,5}$/.test(set.slug || ""))
    errs.push(`${id}: slug must be kebab-case`);
  if (!ELD.has(set.eld)) errs.push(`${id}: eld "${set.eld}" is not an ELD Standard`);
  if (!KLU.has(set.klu)) errs.push(`${id}: klu "${set.klu}" is not a Key Language Use`);
  if (!AREAS.has(set.contentArea)) errs.push(`${id}: contentArea "${set.contentArea}" not allowed`);
  if (!(set.minutes >= 8 && set.minutes <= 25)) errs.push(`${id}: minutes must be 8-25`);
  const d = set.domain;
  if (d === "reading" || d === "listening") {
    if (d === "reading") {
      const p = set.passage;
      if (!p?.paragraphs?.length) errs.push(`${id}: reading set has no passage`);
      else {
        const n = wc(p.paragraphs.join(" "));
        const [lo, hi] = RANGES.passage[set.cluster];
        if (n < lo * 0.9 || n > hi * 1.1)
          errs.push(`${id}: passage has ${n} words (target ${lo}-${hi})`);
        if (!(p.glossary?.length >= 3 && p.glossary.length <= 6))
          errs.push(`${id}: glossary needs 3-6 entries`);
        const text = p.paragraphs.join(" ").toLowerCase();
        for (const g of p.glossary || []) {
          for (const f of ["term", "definition", "es", "esDefinition"])
            if (!g[f]?.trim()) errs.push(`${id}: glossary "${g.term}" missing ${f}`);
          if (g.term && !text.includes(g.term.toLowerCase()))
            errs.push(`${id}: glossary term "${g.term}" is not in the passage`);
        }
      }
    } else {
      const s = set.script;
      if (!s?.lines?.length) errs.push(`${id}: listening set has no script`);
      else {
        const n = wc(s.lines.map((l) => l.text).join(" "));
        const [lo, hi] = RANGES.script[set.cluster];
        if (n < lo * 0.9 || n > hi * 1.1)
          errs.push(`${id}: script has ${n} words (target ${lo}-${hi})`);
        for (const l of s.lines)
          if (!l.speaker?.trim() || !l.text?.trim())
            errs.push(`${id}: script line missing speaker or text`);
      }
    }
    const items = set.items || [];
    if (items.length !== 6) errs.push(`${id}: needs exactly 6 items (has ${items.length})`);
    const expected = ["1-2", "1-2", "3-4", "3-4", "5", "5"];
    const positions = {};
    items.forEach((it, k) => {
      const where = it.id || `${id}-q?`;
      if (it.id !== `${id}-q${k + 1}`) errs.push(`${where}: id should be ${id}-q${k + 1}`);
      if (it.pl !== expected[k])
        errs.push(`${where}: pl "${it.pl}" out of order (expected ${expected[k]})`);
      if (!ELD.has(it.eld)) errs.push(`${where}: missing or bad eld`);
      if (!KLU.has(it.klu)) errs.push(`${where}: missing or bad klu`);
      if (!it.stem?.trim()) errs.push(`${where}: missing stem`);
      const choices = it.choices || [];
      const want = it.pl === "1-2" ? 3 : 4;
      if (choices.length !== want)
        errs.push(`${where}: needs ${want} choices (has ${choices.length})`);
      const right = choices.filter((c) => c.correct === true);
      if (right.length !== 1)
        errs.push(`${where}: needs exactly one correct choice (has ${right.length})`);
      const idx = choices.findIndex((c) => c.correct === true);
      positions[idx] = (positions[idx] || 0) + 1;
      const texts = choices.map((c) => String(c.text).trim().toLowerCase());
      if (new Set(texts).size !== texts.length) errs.push(`${where}: duplicate choice text`);
      for (const c of choices) {
        if (!c.text?.toString().trim()) errs.push(`${where}: empty choice`);
        if (!c.why?.trim())
          errs.push(`${where}: choice "${c.text}" has no "why" (answer rationale)`);
        if (!c.correct && !c.misconception?.trim())
          errs.push(
            `${where}: wrong choice "${c.text}" has no misconception (distractor rationale)`,
          );
        if (c.icon && !ICONS.has(c.icon)) errs.push(`${where}: unknown choice icon "${c.icon}"`);
      }
      // Test-wise tell: the key is much longer than every distractor. A quoted sentence from the text is exempt.
      const key = choices.find((c) => c.correct === true);
      if (key && choices.length > 1) {
        const keyLen = String(key.text).length;
        const maxOther = Math.max(
          ...choices.filter((c) => c !== key).map((c) => String(c.text).length),
        );
        if (
          !/^["“]/.test(String(key.text).trim()) &&
          keyLen > maxOther * 1.3 &&
          keyLen - maxOther >= 12
        )
          errs.push(
            `${where}: the answer is much longer than every distractor (${keyLen} vs ${maxOther} characters)`,
          );
      }
      // The glossary must not define the very word an item asks about (it hands the student the answer).
      const asked = (/what does (?:the word )?["“']?([a-z-]+)["”']? mean/i.exec(it.stem) ||
        /["“]([a-z-]+)["”]/i.exec(it.stem))?.[1];
      if (asked && set.passage?.glossary?.some((g) => g.term.toLowerCase() === asked.toLowerCase()))
        errs.push(`${where}: the glossary defines "${asked}", which this item asks about`);
      checkVisual(it.visual, where, errs);
    });
    if (items.length && !items.some((it) => it.pl === "1-2" && it.visual))
      errs.push(`${id}: no level 1-2 item has a visual support`);
    for (const [pos, n] of Object.entries(positions))
      if (n > 3) errs.push(`${id}: correct answer is in position ${pos} ${n} times (max 3)`);
  } else if (d === "speaking") {
    const tasks = set.tasks || [];
    if (tasks.length !== 3) errs.push(`${id}: speaking needs exactly 3 tasks`);
    tasks.forEach((t, k) => {
      const where = t.id || `${id}-t?`;
      if (t.id !== `${id}-t${k + 1}`) errs.push(`${where}: id should be ${id}-t${k + 1}`);
      if (t.pl !== ["1-2", "3-4", "5"][k]) errs.push(`${where}: pl out of order`);
      if (!ELD.has(t.eld) || !KLU.has(t.klu)) errs.push(`${where}: bad eld or klu`);
      if (!t.prompt?.trim()) errs.push(`${where}: missing prompt`);
      if (!(t.thinkSeconds >= 10 && t.thinkSeconds <= 45))
        errs.push(`${where}: thinkSeconds out of range`);
      if (!(t.responseSeconds >= 20 && t.responseSeconds <= 90))
        errs.push(`${where}: responseSeconds out of range`);
      const levels = (t.models || []).map((m) => m.level).join(",");
      if (levels !== (k === 0 ? "1,3,5" : "2,4,6"))
        errs.push(`${where}: model levels must be ${k === 0 ? "1,3,5" : "2,4,6"} (answer key)`);
      for (const m of t.models || [])
        if (!m.text?.trim() || !m.note?.trim())
          errs.push(`${where}: model needs text and a teacher note`);
      if (!(t.checklist?.length >= 3 && t.checklist.length <= 4))
        errs.push(`${where}: checklist needs 3-4 entries`);
      checkVisual(t.visual, where, errs);
    });
  } else if (d === "writing") {
    const tasks = set.tasks || [];
    if (tasks.length !== 2) errs.push(`${id}: writing needs exactly 2 tasks`);
    tasks.forEach((t, k) => {
      const where = t.id || `${id}-t?`;
      if (t.id !== `${id}-t${k + 1}`) errs.push(`${where}: id should be ${id}-t${k + 1}`);
      if (k === 1 && t.pl !== "5") errs.push(`${where}: second task must be pl 5`);
      if (k === 0 && !["1-2", "3-4"].includes(t.pl))
        errs.push(`${where}: first task must be pl 1-2 or 3-4`);
      if (!ELD.has(t.eld) || !KLU.has(t.klu)) errs.push(`${where}: bad eld or klu`);
      if (!ORGS.has(t.organizer?.type))
        errs.push(`${where}: organizer type "${t.organizer?.type}" not allowed`);
      if (!(t.organizer?.fields?.length >= 3 && t.organizer.fields.length <= 6))
        errs.push(`${where}: organizer needs 3-6 fields`);
      if (
        !(t.frames?.length >= 4 && t.frames.length <= 6) ||
        t.frames.some((f) => !f.includes("___"))
      )
        errs.push(`${where}: 4-6 frames, each with ___`);
      const [lo, hi] = RANGES.writing[set.cluster];
      if (!(t.wordTarget?.[0] >= lo && t.wordTarget[1] <= hi && t.wordTarget[0] < t.wordTarget[1]))
        errs.push(`${where}: wordTarget out of range for the cluster`);
      if ((t.models || []).map((m) => m.level).join(",") !== "2,4,6")
        errs.push(`${where}: models must be levels 2,4,6 (answer key)`);
      for (const m of t.models || [])
        if (!m.text?.trim() || !(m.annotations?.length >= 2 && m.annotations.length <= 4))
          errs.push(`${where}: model needs text and 2-4 annotations`);
      const dims = new Set((t.checklist || []).map((c) => c.dimension));
      for (const dim of ["Discourse", "Sentence", "Word/Phrase"])
        if (!dims.has(dim)) errs.push(`${where}: checklist misses the ${dim} dimension`);
    });
  } else errs.push(`${id}: unknown domain "${d}"`);
}

export function validateUnit(u, errs) {
  const id = u.id || u.file;
  for (const f of [
    "id",
    "area",
    "grade",
    "slug",
    "title",
    "summary",
    "standard",
    "eld",
    "klu",
    "demands",
    "contentObjective",
    "languageObjective",
    "frames",
    "vocabulary",
    "activity",
    "warmup",
  ])
    if (u[f] == null || u[f] === "") errs.push(`${id}: missing ${f}`);
  if (u.id !== `${u.area}-${u.grade}-${u.slug}`)
    errs.push(`${id}: id must be <area>-<grade>-<slug>`);
  if (!["CCSS", "NGSS", "C3", "CCSS-ELA"].includes(u.standard?.framework))
    errs.push(`${id}: bad standard framework`);
  if (!u.standard?.code || !u.standard?.text) errs.push(`${id}: standard needs code and text`);
  if (!ELD.has(u.eld) || !KLU.has(u.klu)) errs.push(`${id}: bad eld or klu`);
  for (const lvl of ["discourse", "sentence", "word"])
    if (!(u.demands?.[lvl]?.length >= 2 && u.demands[lvl].length <= 4))
      errs.push(`${id}: demands.${lvl} needs 2-4 entries`);
  for (const b of ["L1-2", "L3-4", "L5-6"])
    if (!(u.frames?.[b]?.length >= 2 && u.frames[b].length <= 4))
      errs.push(`${id}: frames.${b} needs 2-4 entries`);
  const v = u.vocabulary || [];
  if (!(v.length >= 5 && v.length <= 9)) errs.push(`${id}: vocabulary needs 5-9 terms`);
  if (!v.some((x) => x.tier === 2) || !v.some((x) => x.tier === 3))
    errs.push(`${id}: vocabulary needs tier 2 and tier 3 terms`);
  for (const x of v)
    for (const f of ["term", "definition", "es", "morphology"])
      if (!x[f]?.toString().trim()) errs.push(`${id}: vocabulary "${x.term}" missing ${f}`);
  if (!u.activity?.title || !u.activity?.steps?.length)
    errs.push(`${id}: activity needs a title and steps`);
}

/** All content: returns { errs, count }. Includes duplicate checks across the whole bank. */
export function contentIntegrity(data) {
  const errs = [];
  const ids = new Map();
  const stems = new Map();
  let count = 0;
  for (const s of data.practice) {
    validateSet(s, errs);
    for (const x of [s, ...(s.items || []), ...(s.tasks || [])]) {
      if (ids.has(x.id)) errs.push(`duplicate id ${x.id}`);
      ids.set(x.id, true);
      count++;
    }
    for (const it of s.items || []) {
      const key = it.stem.trim().toLowerCase();
      if (stems.has(key))
        errs.push(`duplicate item stem in ${it.id} and ${stems.get(key)}: "${it.stem}"`);
      stems.set(key, it.id);
    }
  }
  const slugs = new Set();
  for (const s of data.practice) {
    const k = `${s.cluster}/${s.domain}/${s.slug}`;
    if (slugs.has(k)) errs.push(`duplicate slug ${k}`);
    slugs.add(k);
  }
  for (const u of data.units) {
    validateUnit(u, errs);
    if (ids.has(u.id)) errs.push(`duplicate id ${u.id}`);
    ids.set(u.id, true);
    count++;
  }
  // coverage: 3 sets per cluster x domain
  for (const c of ["grades-2-3", "grades-4-5", "grades-6-8"])
    for (const d of ["listening", "reading", "speaking", "writing"]) {
      const n = data.practice.filter((s) => s.cluster === c && s.domain === d).length;
      if (n < 3) errs.push(`coverage: ${c} ${d} has ${n} sets (need 3)`);
    }
  for (const d of ["listening", "reading", "speaking", "writing"]) {
    const eld = new Set(data.practice.filter((s) => s.domain === d).map((s) => s.eld));
    if (eld.size < 5) errs.push(`coverage: ${d} sets cover ${eld.size} of 5 ELD Standards`);
  }
  return { errs, count };
}

/** G-08: recompute every compute block; the answer must equal the expression and appear in the keyed text. */
export function mathCheck(data) {
  const errs = [];
  let count = 0;
  const one = (where, compute, keyedText) => {
    count++;
    let v;
    try {
      v = evaluate(compute.expr);
    } catch (e) {
      errs.push(`${where}: cannot evaluate "${compute.expr}": ${e.message}`);
      return;
    }
    let ans;
    try {
      ans = fromDecimal(String(compute.answer).trim());
    } catch {
      errs.push(`${where}: answer "${compute.answer}" is not a number`);
      return;
    }
    if (!sameValue(v, ans))
      errs.push(`${where}: ${compute.expr} = ${v.n}/${v.d}, but the answer says ${compute.answer}`);
    if (keyedText != null && !numbersIn(keyedText).some((x) => sameValue(x, ans)))
      errs.push(
        `${where}: answer ${compute.answer} does not appear in the keyed text "${keyedText}"`,
      );
  };
  for (const s of data.practice)
    for (const it of s.items || []) {
      if (!it.compute) continue;
      const right = it.choices.find((c) => c.correct);
      one(it.id, it.compute, right?.text ?? "");
    }
  for (const u of data.units)
    for (const [k, p] of (u.activity?.problems || []).entries())
      if (p.compute) one(`${u.id} problem ${k + 1}`, p.compute, p.answer);
  return { errs, count };
}

/* ---------- G-06 no purple ---------- */
const NAMED =
  /\b(purple|violet|lavender|orchid|plum|magenta|fuchsia|indigo|mediumpurple|rebeccapurple|blueviolet|darkviolet|darkorchid|thistle|mediumorchid|mediumslateblue|slateblue|darkslateblue)\b/i;
function hueOf(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}
const purpleish = ({ h, s }) => h >= 255 && h <= 335 && s > 0.15;
export function purpleScan(text) {
  const hits = [];
  for (const m of text.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    let hex = m[1];
    if (hex.length === 3) hex = hex.replace(/./g, (c) => c + c);
    const [r, g, b] = [0, 2, 4].map((k) => parseInt(hex.slice(k, k + 2), 16));
    if (purpleish(hueOf(r, g, b))) hits.push(m[0]);
  }
  for (const m of text.matchAll(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/gi))
    if (purpleish(hueOf(+m[1], +m[2], +m[3]))) hits.push(m[0]);
  for (const m of text.matchAll(/hsla?\(\s*(\d+(?:\.\d+)?)(?:deg)?[,\s]+(\d+(?:\.\d+)?)%/gi))
    if (+m[1] >= 255 && +m[1] <= 335 && +m[2] > 15) hits.push(m[0]);
  // Named colors only in a color position (css property value, or a theme/color key), so prose like "plum" in a
  // recipe passage is not a false positive.
  for (const m of text.matchAll(
    /(?:color|background|fill|stroke|border|accent|theme)[\w-]*\s*[:=]\s*["']?([a-z]+)/gi,
  ))
    if (NAMED.test(m[1])) hits.push(m[0]);
  return hits;
}

/* ---------- G-10 privacy (static half) ---------- */
export function privacyScan(text) {
  const hits = [];
  for (const m of text.matchAll(
    /\b(fetch|navigator\.sendBeacon|new\s+WebSocket|new\s+EventSource)\s*\(\s*([`'"])(https?:|\/\/|wss?:)/g,
  ))
    hits.push(m[0]);
  for (const m of text.matchAll(/\.open\(\s*["'](?:GET|POST|PUT)["']\s*,\s*["'](https?:|\/\/)/gi))
    hits.push(m[0]);
  for (const m of text.matchAll(/<form\b[^>]*method\s*=\s*["']?post/gi)) hits.push(m[0]);
  for (const m of text.matchAll(
    /<(?:script|link|img|iframe)\b[^>]*(?:src|href)\s*=\s*["'](?:https?:)?\/\/(?!thelanguagepage\.com)/gi,
  ))
    hits.push(m[0]);
  for (const m of text.matchAll(
    /googletagmanager|google-analytics|facebook\.net|hotjar|segment\.(?:io|com)|mixpanel|cloudflareinsights/gi,
  ))
    hits.push(m[0]);
  return hits;
}

/* ---------- G-11 disclaimer ---------- */
export const DISCLAIMER_TEXT =
  "It is not affiliated with, endorsed by, or sponsored by WIDA or the WIDA Consortium";
export function disclaimerCheck(html, pagePath) {
  const errs = [];
  const n = html.split(DISCLAIMER_TEXT).length - 1;
  if (n < 1) errs.push(`${pagePath}: no disclaimer`);
  if (
    !/<footer[\s\S]*data-disclaimer[\s\S]*<\/footer>/.test(html) ||
    !/<footer[\s\S]*It is not affiliated with, endorsed by, or sponsored by WIDA[\s\S]*<\/footer>/.test(
      html,
    )
  )
    errs.push(`${pagePath}: footer has no disclaimer`);
  if (pagePath.startsWith("/practice/") && n < 2)
    errs.push(`${pagePath}: practice page has no on-page disclaimer`);
  return errs;
}

/* ---------- G-12 i18n ---------- */
export function i18nCheck(htmlFiles, jsFiles, strings) {
  const errs = [];
  const used = new Set();
  for (const h of htmlFiles)
    for (const m of h.matchAll(/data-i18n(?:-label|-placeholder)?="([^"]+)"/g)) used.add(m[1]);
  for (const j of jsFiles) for (const m of j.matchAll(/\btr\(\s*"([^"]+)"/g)) used.add(m[1]);
  for (const k of used) {
    const s = strings[k];
    if (!s) errs.push(`missing key "${k}"`);
    else
      for (const lang of ["en", "es"])
        if (!s[lang]?.trim()) errs.push(`key "${k}" has no ${lang} text`);
  }
  return { errs, count: used.size };
}

/* ---------- helpers ---------- */
export function walk(dir, filter) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return p.includes(`${path.sep}vendor`) ? [] : walk(p, filter);
    return filter(p) ? [p] : [];
  });
}
export { loadData };
