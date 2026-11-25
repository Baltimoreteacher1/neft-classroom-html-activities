// Leak scan for STUDENT papers: no level, band, program or identity label may appear in the text a student reads.
// Pure and browser-safe. The scan runs on the paper's visible text AFTER the authored source strings are masked out, so a
// unit that legitimately teaches the word "level" (sea level) never trips it, while any label the packet code itself
// adds ("Level 2", "Newcomer", an initial) does.
//
// Hand-read false-positive classes (authored vocabulary that is ordinary English, found by sweeping all 162 units; the
// tests report them and never edit them): "level" (a level of cubes, highest to lowest level), "band" (a rubber band),
// "initial" (initial value), "beginning" (the very beginning), "reaching" (reaching a goal). All sit inside authored
// source strings, which is why the scan masks source first. Nothing the packet code itself writes uses these words.

// Case-insensitive words. "tier" and "band" also cover "tier 2" and "band 3_4".
const WORDS = [
  "levels?",
  "bands?",
  "tiers?",
  "newcomers?",
  "esol",
  "wida",
  "access",
  "entering",
  "emerging",
  "developing",
  "expanding",
  "bridging",
  "reaching",
  "beginning",
  "intermediate",
  "advanced",
  "program",
  "intervention",
  "special education",
  "gifted",
  "alias",
  "initials?",
  "student name",
];
const WORD_RE = new RegExp(`\\b(?:${WORDS.join("|")})\\b`, "gi");
// Case-sensitive program acronyms ("el" and "ml" are ordinary Spanish and math words, so only capitals count).
const ACRONYM_RE = /\b(?:ELL|MLL|ESL|IEP|SPED|504)\b/g;
// A band id such as 1_2, or "L1", "Lvl 2".
const BAND_ID_RE = /\b[1356]_[2468]\b|\bLvl\.?\s*\d\b|\bL[1-6]\b/g;

const SCANS = [WORD_RE, ACRONYM_RE, BAND_ID_RE];

/** Text with every authored source string removed (longest first), whitespace collapsed. */
export function maskSource(text, sourceStrings) {
  let out = String(text);
  const sorted = [...new Set(sourceStrings.filter((s) => typeof s === "string" && s.trim()))].sort(
    (a, b) => b.length - a.length,
  );
  for (const s of sorted) out = out.split(s).join(" ");
  return out.replace(/\s+/g, " ");
}

/** Forbidden tokens found in the text that is not authored source. [] means clean. */
export function findLeaks(text, sourceStrings = []) {
  const rest = maskSource(text, sourceStrings);
  const hits = [];
  for (const re of SCANS) for (const m of rest.matchAll(re)) hits.push(m[0]);
  return hits;
}

/** Forbidden tokens inside authored source itself (reported by the tests, never auto-edited). */
export function findSourceHits(sourceStrings) {
  const hits = [];
  for (const s of sourceStrings)
    for (const re of SCANS)
      for (const m of String(s).matchAll(re)) hits.push({ token: m[0], in: s });
  return hits;
}
