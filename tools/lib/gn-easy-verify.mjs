// Checks an authored Easy-read file (graphic-novels/axiom-city/easy/<slug>.json) against its book.
// Hard failures: a key the book does not have, markup beyond inline tags, a number or math token that
// changed, a vocabulary term that vanished, text more than 10% longer. Reported only: words above grade 5.
import { readFileSync } from "node:fs";
import { EASY_TAGS } from "../inject-gn-layer.mjs";
import { extractBook } from "./gn-extract.mjs";
import { bookLessons, loadLayer, vocabFor } from "./gn-layer.mjs";

const layer = loadLayer();
const SUPER = "⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻⁼⁽⁾ⁿ";
const MATH = new RegExp(`\\d+(?:[.,]\\d+)*|[${SUPER}]+|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|[+−×÷=<>≤≥%^/]`, "g");

const plain = (html) =>
  html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
const emphasised = (html) =>
  [...html.matchAll(/<(b|strong|code)[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((m) => plain(m[2]).trim())
    .filter(Boolean);
const tokens = (html) => [...(plain(html).match(MATH) || []), ...emphasised(html)];

function missing(have, need) {
  const pool = new Map();
  for (const t of have) pool.set(t, (pool.get(t) || 0) + 1);
  const out = [];
  for (const t of need) {
    if ((pool.get(t) || 0) > 0) pool.set(t, pool.get(t) - 1);
    else out.push(t);
  }
  return out;
}

const syllables = (w) =>
  (
    w
      .toLowerCase()
      .replace(/e$/, "")
      .match(/[aeiouy]+/g) || ["a"]
  ).length;

export function verifyEasy(bookFile, easyFile) {
  const easy = JSON.parse(readFileSync(easyFile, "utf8"));
  const errors = [];
  const report = [];
  if (easy.v !== 1 || !easy.map || typeof easy.map !== "object")
    return { errors: ['expected {"v":1,"map":{...}}'], report, checked: 0 };
  const items = new Map(extractBook(bookFile).items.map((i) => [i.key, i]));
  const html = readFileSync(bookFile, "utf8");
  const vocab = vocabFor(bookLessons(html).ids);
  const matcher = layer.buildMatcher(vocab);
  const termsIn = (text) =>
    matcher
      ? (text.match(new RegExp(matcher.regexSource, "gi")) || []).map((s) => layer.normSurface(s))
      : [];
  const known = new Set(vocab.flatMap((v) => v.term.toLowerCase().split(/\W+/)));
  for (const [key, easyHtml] of Object.entries(easy.map)) {
    const orig = items.get(key);
    if (!orig) {
      errors.push(`key not in this book: ${key.slice(0, 80)}`);
      continue;
    }
    const label = `${orig.id} (${key.slice(0, 40)}...)`;
    const bad = [...easyHtml.matchAll(/<\/?([a-z][a-z0-9]*)/gi)]
      .map((m) => m[1].toLowerCase())
      .filter((t) => !EASY_TAGS.has(t));
    if (bad.length) errors.push(`${label}: tags not allowed: ${[...new Set(bad)].join(", ")}`);
    if (/\son\w+\s*=|javascript:/i.test(easyHtml)) errors.push(`${label}: script-like markup`);
    const lost = missing(tokens(easyHtml), tokens(orig.html));
    if (lost.length) errors.push(`${label}: math or numbers changed or missing: ${lost.join(" ")}`);
    const lostTerms = missing(termsIn(plain(easyHtml)), termsIn(plain(orig.html)));
    if (lostTerms.length) errors.push(`${label}: vocabulary term changed: ${lostTerms.join(", ")}`);
    const o = layer.normalizeKey(plain(orig.html)).length;
    const e = layer.normalizeKey(plain(easyHtml)).length;
    if (e > o * 1.1)
      errors.push(
        `${label}: easy text is ${e} chars, limit ${Math.floor(o * 1.1)} (original ${o})`,
      );
    const hard = [
      ...new Set(
        (plain(easyHtml).match(/[A-Za-z]{7,}/g) || []).filter(
          (w) => syllables(w) >= 3 && !known.has(w.toLowerCase()),
        ),
      ),
    ];
    if (hard.length) report.push(`${orig.id}: above grade 5? ${hard.join(", ")}`);
  }
  return { errors, report, checked: Object.keys(easy.map).length };
}
