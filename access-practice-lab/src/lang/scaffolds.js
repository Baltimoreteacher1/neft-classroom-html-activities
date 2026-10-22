// Home-language and word-formation bridges offered with supports (never in an "on my own" attempt).
import { FALSE_FRIENDS, findCognatesInText } from "../multilingual.js";
import { MORPHEMES } from "./lexicon.js";
import { tokenize } from "./text.js";

/** Break words into known roots, prefixes and suffixes: [{ word, parts:[{m,kind,meaning}] }]. Conservative on purpose. */
export function wordParts(words, { max = 6 } = {}) {
  const out = [];
  for (const raw of words) {
    const w = String(raw).toLowerCase().split(/[/\s]/)[0].replace(/[^a-z]/g, "");
    if (w.length < 6) continue;
    const parts = [];
    for (const m of MORPHEMES) {
      const rest = w.length - m.m.length;
      if (rest < 3) continue;
      if (m.kind === "prefix" && w.startsWith(m.m)) parts.push(m);
      else if (m.kind === "suffix" && w.endsWith(m.m)) parts.push(m);
      else if (m.kind === "root" && w.includes(m.m)) parts.push(m);
    }
    // keep the longest affix per kind so "in" does not shadow "inter"
    const best = ["prefix", "root", "suffix"].map((k) => parts.filter((p) => p.kind === k).sort((a, b) => b.m.length - a.m.length)[0]).filter(Boolean);
    if (best.length) out.push({ word: w, parts: best.map(({ m, kind, meaning }) => ({ m, kind, meaning })) });
    if (out.length >= max) break;
  }
  return out;
}

/** Cognates and false-friend warnings for the words a task uses. */
export function bridgesFor(texts) {
  const text = texts.join(" ");
  const cognates = findCognatesInText(text);
  const words = new Set(tokenize(text).map((t) => t.lower));
  const warnings = FALSE_FRIENDS.filter((f) => words.has(f.en.toLowerCase()));
  return { cognates, warnings };
}

export const partLabel = (p) => (p.kind === "prefix" ? `${p.m}- (${p.meaning})` : p.kind === "suffix" ? `-${p.m} (${p.meaning})` : `${p.m} (${p.meaning})`);
