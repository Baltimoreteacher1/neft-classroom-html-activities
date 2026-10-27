/* =============================================================================
 * copy-scan — one place that knows (a) which strings in a lesson config are
 * read by students and (b) what is wrong with a string of copy.
 * -----------------------------------------------------------------------------
 * Shared by tools/validate-math-notation.mjs, tools/validate-microcopy.mjs and
 * tools/report-copy-scan.mjs so the report and the gates can never disagree
 * about what a violation is.
 *
 * Every detector here is narrow on purpose. Hyphens in ranges, dates, ids and
 * correctly-signed numbers, and the letter x in "x-axis" or as a variable, are
 * not violations (docs/style-guide.md section 3). Detectors were hand-verified
 * on samples; the measured false-positive rates are in copy-scan-hand-verified.mjs.
 *
 * The notation detectors are deliberately INDEPENDENT of the render-time
 * formatter (engine/core/math-typography.js): the gate runs the formatter over
 * every lesson string and then asks these detectors whether anything survived.
 * ========================================================================== */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BANNED_PHRASES,
  isGenericFeedback,
  MAX_EXCLAMATIONS_PER_STRING,
  TERMS,
} from "@eduwonderlab/engine/core/copy-dictionary.js";

export { BANNED_PHRASES, isGenericFeedback, TERMS as TERM_GROUPS };

// --------------------------------------------------------------------------
// 1. Which strings are student-facing?
// --------------------------------------------------------------------------

/** Keys whose string values are NOT prose a student reads: keys, ids, data, markup. */
const SKIP_KEYS = new Set([
  "id",
  "type",
  "kind",
  "phase",
  "standard",
  "href",
  "url",
  "src",
  "image",
  "imageAlt",
  "imageAltEs",
  "docx",
  "pdf",
  "emoji",
  "themeEmoji",
  "icon",
  "art",
  "color",
  "anchorKind",
  "lessonId",
  "prevLessonId",
  "unit",
  "role",
  "mode",
  "op",
  "dir",
  "direction",
  "shape",
  "placement",
  "circleType",
  "vocabMode",
  "misconceptionTags",
  "misconceptionTag",
  // answer keys and data tables: never scanned, never rewritten
  "answer",
  "answers",
  "answersEs",
  "correctAnswer",
  "correctOrder",
  "correct",
  "solution",
  "rows",
  "vals",
  "values",
  "data",
  "presets",
  "match",
  "matchEs",
  "left",
  "right",
  "leftEs",
  "rightEs",
  "expression",
  "equation",
  "formula",
  "inequality",
  "relatedEquation",
  "relatedSolution",
  "testX5",
  "testX20",
  "dividend",
  "divisor",
  "quotient",
  "remainder",
  "problem",
  "problemEs",
  "start",
  "given",
  "theme",
  "xLabel",
  "yLabel",
  "xLabelEs",
  "yLabelEs",
  "xName",
  "yName",
  "xUnit",
  "yUnit",
  "yPrefix",
  "variable",
  "var",
  "pattern",
  "stepLabel",
  "badge",
  "tools",
  "manip",
  "interactiveVisual",
  "heroFigure",
  "reviews",
  "projects",
  "prevLessonTitle",
  // typed-response match lists: compared against what a student types
  "keywords",
  "keywordsEs",
  "wordBank",
]);

const KIND_BY_KEY = [
  [/^(stem|question|questionText|wordProblem|narrative|scenario|context|story|situation)$/, "stem"],
  [/^(choices|options)$/, "choice"],
  [/^(choiceFeedback|explanation|why|correction|correctWork|workedExample|rewrite)$/, "feedback"],
  [/^(hints?)$/, "hint"],
  [/^(instructions|task|demand|directions|goal|promptQuestion|prompt|cta)$/, "instruction"],
  [/^(definition|example|cloze|term|examples|meaning)$/, "vocab"],
  [/^(heading|menuTitle|eyebrow)$/, "heading"],
  [
    /^(intro|lines|work|steps|keyIdea|modelAnswer|sampleAnswer|commonMistake|caption|text|label|title|rule|listenFor|extend|extendStems|stems|sentenceStems|sentenceFrame|noticePrompts|wonderPrompts|noticeStarters|wonderStarters|phrases|contentObjective|languageObjective|observation|think|thinking|familyKeyIdea|score0|score1|score2|name|desc|description)$/,
    "text",
  ],
];

function classifyKey(rawKey) {
  const lang = /(Es|_es)$/.test(rawKey) ? "es" : "en";
  const base = rawKey.replace(/(Es|_es)$/, "");
  if (SKIP_KEYS.has(rawKey) || SKIP_KEYS.has(base)) return null;
  for (const [re, kind] of KIND_BY_KEY) if (re.test(base)) return { lang, kind, base };
  return null;
}

/**
 * Every student-facing string in a lesson config.
 * @returns {{path:string,key:string,lang:"en"|"es",kind:string,text:string}[]}
 */
export function collectTexts(cfg) {
  const out = [];
  const walk = (node, path, ctx) => {
    if (typeof node === "string") {
      if (ctx) out.push({ path, key: ctx.base, lang: ctx.lang, kind: ctx.kind, text: node });
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`, ctx));
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const [k, v] of Object.entries(node)) {
      // {en, es} pairs: the key names the language, the parent names the field.
      if ((k === "en" || k === "es") && typeof v === "string" && ctx) {
        out.push({ path: `${path}.${k}`, key: ctx.base, lang: k, kind: ctx.kind, text: v });
        continue;
      }
      if (SKIP_KEYS.has(k)) continue;
      const c = classifyKey(k);
      // A classified key sets the context; an unclassified key under a
      // classified parent inherits it (e.g. choices[].text, steps[].en).
      walk(v, `${path}.${k}`, c || (typeof v === "object" ? ctx : null));
    }
  };
  walk(cfg, "", null);
  return out;
}

export function loadCoreIds(root) {
  const m = JSON.parse(readFileSync(join(root, "data/curriculum-launch-manifest.json"), "utf8"));
  return m.lessons.map((l) => l.id);
}

export function loadCoreConfigs(root) {
  const out = [];
  for (const id of loadCoreIds(root)) {
    const file = `lessons/${id}/config.json`;
    const p = join(root, file);
    if (!existsSync(p)) continue;
    out.push({ id, file, cfg: JSON.parse(readFileSync(p, "utf8")) });
  }
  return out;
}

/** Plain text of a string: tags removed, common entities decoded. */
export function plain(text) {
  return String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// --------------------------------------------------------------------------
// 2. Math notation detectors
// --------------------------------------------------------------------------

const WORDY_UNITS =
  "(?:ft|feet|foot|yd|yards?|mi|miles?|cm|mm|km|meters?|metres?|kg|grams?|mg|lbs?|pounds?|oz|ounces?|mL|liters?|litres?|gal|gallons?|mph|min|minutes?|hours?|hrs?|seconds?|secs?|days?|weeks?|inches|degrees|cents|dollars|units|cups?|quarts?)";
const SYMBOL_UNITS = "(?:ft|yd|mi|cm|mm|km|kg|mg|lbs?|oz|mL|gal|mph|min|hrs?|secs?|m|g|L|s|h)";

// number, then an ORDINARY space (not U+00A0), then a unit. "in" is a preposition.
const NUM_UNIT_RE = new RegExp(
  String.raw`(?<![\w.,$/])(\d(?:[\d,]*\d)?(?:\.\d+)?)[ ](?=(?:${WORDY_UNITS}|${SYMBOL_UNITS})(?:[²³]|\^[23])?(?![A-Za-zÀ-ÿ]))`,
  "g",
);

const YEAR_CONTEXT =
  /(?:\b(?:in|since|year|until|by|from|during|en|desde|hasta|año|de|del)|(?:january|february|march|april|may|june|july|august|september|october|november|december|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\.?(?: \d{1,2},?)?)\s$/i;

export const RULES_NOTATION = [
  {
    id: "minus-spaced",
    desc: "hyphen used as minus between operands (use U+2212)",
    re: /(?<=[\d)]|(?<![A-Za-z])[a-z]) - (?=\d|\(|[a-z](?![A-Za-zÀ-ÿ]))/g,
  },
  {
    id: "minus-negative",
    desc: "hyphen used as the sign of a negative number or variable (use U+2212)",
    re: /(?<=^|[\s(=<>×÷+,:;[|])-(?=\d|\.\d|[a-z](?![A-Za-z\d]))/g,
  },
  {
    id: "multiply-x",
    desc: "letter x used as a multiplication sign between numbers (use U+00D7)",
    re: /(?<=[\d)]) [xX] (?=\d|\()/g,
  },
  {
    id: "multiply-star",
    desc: "asterisk used as a multiplication sign (use U+00D7)",
    re: /(?<=[\d)])[ ]?(?<!\*)\*(?!\*)[ ]?(?=[\d(a-z])/g,
  },
  {
    id: "divide-slash-spaced",
    desc: "spaced slash in an equation (use U+00F7 for division)",
    re: /(?<=\d|(?<![A-Za-z])[a-z]|(?<=\d )[a-z]{1,4}) \/ (?=\d)/g,
  },
  {
    id: "money-one-decimal",
    desc: "money with one decimal place ($4.5; write $4.50)",
    re: /\$\d[\d,]*\.\d(?![\d]|\s?(?:[KMBkmb]\b|million|billion|thousand|mil\b))/g,
  },
  {
    id: "money-space",
    desc: "space between $ and the amount",
    re: /\$ \d/g,
  },
  {
    id: "percent-space",
    desc: "ordinary space before a percent sign (the number and % must not split)",
    re: /\d [%]/g,
  },
  {
    id: "thousands-no-comma",
    desc: "four or more digit number without thousands commas",
    re: /(?<![\d.,#/:-])\d{4,}(?![\d,]|[-/:]\d)/g,
  },
  {
    id: "decimal-comma",
    desc: "decimal comma (3,5): decimals use a point",
    re: /(?<![\d,(])\d{1,3},\d{1,2}(?![\d,]|\))(?!\s*\d)/g,
    only: "es",
  },
  {
    id: "number-unit-space",
    desc: "number and unit joined by an ordinary space (use a no-break space)",
    re: NUM_UNIT_RE,
  },
];

function isMoneyContext(text) {
  return /\$|dollar|cents?\b|price|cost|pesos?|dólares|centavos|precio|costo|\bpaid\b|\bearns?\b|\bsalary\b/i.test(
    text,
  );
}

/** Trailing-zero decimals outside money (2.50 m, 0.30). INFORMATION ONLY. */
function trailingZeros(text) {
  const out = [];
  const re = /(?<![\d.$])\d+\.\d*[1-9]?0+(?![\d.])/g;
  let m;
  while ((m = re.exec(text))) {
    const lit = m[0];
    if (!/\.\d*0$/.test(lit) || /^\d+\.0+$/.test(lit)) continue;
    const trimmed = lit.replace(/0+$/, "");
    if (new RegExp(`${trimmed.replace(".", "\\.")}(?!\\d)`).test(text)) continue;
    if (isMoneyContext(text)) continue;
    if (/\bplaces?\b|zero|cero|lugar|equivalent|equivalente|trailing/i.test(text)) continue;
    out.push({ index: m.index, match: lit });
  }
  return out;
}

/** Context filters that keep each detector under ~10% false positives. */
function filterHit(id, text, m) {
  const i = m.index;
  const around = text.slice(Math.max(0, i - 24), i + m[0].length + 24);
  if (id === "minus-negative") {
    // a bullet at the start of a line followed by a space is not a sign
    return !/^-\s/.test(text.slice(i));
  }
  if (id === "minus-spaced") {
    return !/\d\s*-\s*\d\s*-\s*\d/.test(around); // dates / ids
  }
  if (id === "multiply-star") {
    return /[\d)]\s?\*\s?[\d(a-z]/i.test(around);
  }
  if (id === "divide-slash-spaced") {
    // Only an equation is division: "$7 / 10%" is a pair label.
    const after = text.slice(i + m[0].length, i + m[0].length + 14);
    const before = text.slice(Math.max(0, i - 14), i);
    return /^[$\d.,]+ ?=/.test(after) || /=\s?[$\d.,]+$/.test(before);
  }
  if (id === "decimal-comma") {
    if (/\(\s*-?\d+,\s*-?\d+\s*\)/.test(around)) return false; // coordinates
    if (/\d,\d{1,2},\d/.test(around)) return false; // lists
    return true;
  }
  if (id === "thousands-no-comma") {
    const before = text.slice(Math.max(0, i - 16), i);
    if (/\b(?:room|grade|page|pág|id|code|código|zip|pin|isbn)\s$/i.test(before)) return false;
    if (/^(?:19|20)\d\d$/.test(m[0]) && YEAR_CONTEXT.test(before)) return false;
    return true;
  }
  if (id === "number-unit-space") {
    // "2 m" / "3 g" can be a product of a number and a variable in an equation.
    const rest = text.slice(i + m[0].length);
    const unit = rest.match(/^[A-Za-z]+/)?.[0] || "";
    if (/^(m|g|s|h|L)$/.test(unit) && /^\s*[=+×÷−\-*/^]/.test(rest.slice(unit.length)))
      return false;
    return true;
  }
  return true;
}

/** Scan one text against every notation rule. */
export function scanNotation(raw, lang = "en") {
  const text = plain(raw);
  const hits = [];
  for (const r of RULES_NOTATION) {
    if (r.only && r.only !== lang) continue;
    r.re.lastIndex = 0;
    let m;
    while ((m = r.re.exec(text))) {
      if (m[0] === "") {
        r.re.lastIndex++;
        continue;
      }
      if (filterHit(r.id, text, m)) hits.push({ rule: r.id, index: m.index, match: m[0] });
    }
  }
  return hits;
}

/** INFORMATION ONLY, never gated: about half of the "trailing zero" hits were
 *  aligned-decimal addition (4.59 + 3.80), percent-to-decimal (40% = 0.40) and
 *  money written without a dollar sign, which the style guide allows. */
export function scanInfo(raw) {
  return trailingZeros(plain(raw)).map((h) => ({ rule: "info-trailing-zero", ...h }));
}

// --------------------------------------------------------------------------
// 3. Microcopy detectors (the phrase lists live in engine/core/copy-dictionary.js)
// --------------------------------------------------------------------------

const MINOR_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

/**
 * "Why Is This True" (Title Case) but not "Why is this true" or "What is the
 * Pythagorean Theorem": every word is capitalized or a minor word, and at least
 * four are capitalized, so a proper noun inside a sentence is never flagged.
 */
export function isTitleCase(text) {
  const words = String(text)
    .replace(/[?!.:,;]+$/, "")
    .trim()
    .split(/\s+/);
  if (words.length < 4) return false;
  let caps = 0;
  for (const [i, w] of words.entries()) {
    if (/^[A-Z][a-z']*$/.test(w)) caps++;
    else if (!(i > 0 && MINOR_WORDS.has(w))) return false;
  }
  return caps >= 4;
}

/** Scan one lesson string for tone and casing problems. */
export function scanMicrocopy(raw, { lang = "en", kind = "text", key = "" } = {}) {
  const text = plain(raw).trim();
  const hits = [];
  if (!text) return hits;
  if ((kind === "feedback" || kind === "hint") && isGenericFeedback(text)) {
    hits.push({ rule: "generic-feedback", match: text });
  }
  if (lang === "en") {
    for (const b of BANNED_PHRASES) {
      const m = text.match(b.re);
      if (m) hits.push({ rule: `banned-${b.id}`, match: m[0] });
    }
    const ex = (text.match(/!/g) || []).length;
    if (ex > MAX_EXCLAMATIONS_PER_STRING) {
      hits.push({ rule: "multiple-exclamations", match: `${ex} exclamation marks` });
    }
  }
  // ALL-CAPS paragraph: 4+ words, 12+ letters, and (almost) every letter upper-case.
  const letters = text.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, "");
  const words = text.split(/\s+/).filter((w) => /[A-Za-z]{2}/.test(w));
  if (letters.length >= 12 && words.length >= 4) {
    const up = letters.replace(/[^A-ZÁÉÍÓÚÑ]/g, "").length;
    if (up / letters.length > 0.8)
      hits.push({ rule: "all-caps-paragraph", match: text.slice(0, 60) });
  }
  // Headings are sentence case. Only the lesson's own `heading` fields: story
  // titles (menuTitle, eyebrow) are proper names of a work, not headings.
  if (kind === "heading" && key === "heading" && lang === "en" && isTitleCase(text)) {
    hits.push({ rule: "heading-title-case", match: text });
  }
  // A variant of a term the dictionary enforces ("coordinate pair" for "ordered pair").
  if (lang === "en") {
    for (const t of TERMS) {
      if (!t.enforce) continue;
      for (const v of t.variants) {
        const m = text.match(v);
        if (m) hits.push({ rule: "term-variant", match: `${m[0]} -> ${t.preferred}` });
      }
    }
  }
  return hits;
}

// --------------------------------------------------------------------------
// 4. Reading level (Flesch-Kincaid)
// --------------------------------------------------------------------------

export function countSyllables(word) {
  let w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const g = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, g ? g.length : 1);
}

/** Flesch-Kincaid grade level; numerals count as one short word. */
export function fleschKincaid(raw) {
  const text = plain(raw).replace(/[0-9][0-9,.]*/g, "five");
  const sentences = text.split(/[.!?]+(?:\s|$)/).filter((s) => /[A-Za-z]/.test(s));
  const words = text.match(/[A-Za-z']+/g) || [];
  if (!sentences.length || !words.length) return 0;
  const syll = words.reduce((n, w) => n + countSyllables(w), 0);
  return 0.39 * (words.length / sentences.length) + 11.8 * (syll / words.length) - 15.59;
}

export const INSTRUCTION_KINDS = new Set(["instruction"]);

// --------------------------------------------------------------------------
// 5. Engine strings
// --------------------------------------------------------------------------

/**
 * String literals of a JavaScript file with their line numbers. A small state
 * machine (comments skipped, template `${}` kept inside the literal) rather than
 * a regex, so an apostrophe in a comment cannot swallow the next real string.
 */
export function extractStrings(src) {
  const out = [];
  let i = 0;
  let line = 1;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === "\n") {
      line++;
      i++;
    } else if (c === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") i++;
    } else if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
        if (src[i] === "\n") line++;
        i++;
      }
      i += 2;
    } else if (c === '"' || c === "'" || c === "`") {
      const startLine = line;
      let j = i + 1;
      let buf = "";
      let depth = 0;
      while (j < n) {
        const d = src[j];
        if (d === "\\") {
          buf += src[j + 1] ?? "";
          j += 2;
          continue;
        }
        if (d === "\n") {
          line++;
          if (c !== "`") break;
        }
        if (c === "`" && d === "$" && src[j + 1] === "{") depth++;
        else if (c === "`" && d === "}" && depth > 0) depth--;
        else if (d === c && depth === 0) break;
        buf += d;
        j++;
      }
      out.push({ line: startLine, text: buf, quote: c });
      i = j + 1;
    } else {
      i++;
    }
  }
  return out;
}

/**
 * An engine string literal that tells a student they missed and nothing else.
 * One- and two-word scale labels ("Not yet", "Almost") and CSS state names
 * ("wrong", "incorrect") are not messages, so a string must read like a
 * sentence: terminal punctuation or the word "try".
 */
export function isEngineGenericFeedback(text) {
  if (/\s$/.test(text)) return false; // a prefix glued to a coaching line
  if (!isGenericFeedback(text)) return false;
  return /[.!?]|\btry\b/i.test(text.replace(/<[^>]*>/g, ""));
}

/** A string that is a title-cased button label assigned to a button element. */
export function titleCaseButtons(src) {
  const out = [];
  const lines = src.split("\n");
  const assign =
    /\b[A-Za-z_]*(?:btn|Btn|button|Button)[A-Za-z_]*\.(?:textContent|innerText)\s*=\s*(["'`])([^"'`$\n]+)\1/;
  const tag = />([A-Z][A-Za-z']*(?: [A-Z][A-Za-z']*)+)<\/button>/;
  // engine/core/i18n.js: keys that name an action ("printCertificate", "dsCheckOrder")
  const verbKey =
    /^\s*(?:ds[A-Z]|check|submit|print|save|start|try|next|back|prev|close|reset|show|hide|open|continue|finish|play|retry|download|share|send|clear)[A-Za-z]*:\s*\{\s*en:\s*"([^"]+)"/;
  lines.forEach((ln, idx) => {
    const m = ln.match(assign);
    const label = m?.[2] ?? ln.match(tag)?.[1] ?? ln.match(verbKey)?.[1];
    if (label && /^[A-Z][a-z']*(?: [A-Z][A-Za-z']*)+$/.test(label))
      out.push({ line: idx + 1, text: label });
  });
  return out;
}
