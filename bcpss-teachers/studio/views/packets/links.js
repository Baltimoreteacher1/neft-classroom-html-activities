// Pure helpers for #/packets: the export links and the unit-id facts the form needs. No DOM, no network.
import { BANDS, BAND_LABEL, countsToString, parseCounts, variantCodes } from "../../../../shared/packets/bands.js";

export const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
export const SUBJECTS = ["ELA", "Math", "Science", "Social Studies"];
const SUBJECT_OF_CODE = { ela: "ELA", math: "Math", sci: "Science", ss: "Social Studies" };

export const KIT_PARTS = [
  { part: "kit-cards", label: "Vocabulary cards", note: "Word, plain definition, Spanish gloss (draft translation), cognate note." },
  { part: "kit-frames", label: "Sentence frame strips", note: "Cut-apart strips for all three papers, marked with the paper codes." },
  { part: "kit-exit", label: "Exit ticket sheet", note: "Prompt, frame, writing lines and the rubric row." },
  { part: "kit-family", label: "Family sheet", note: "English and Spanish, one sheet." },
];

/** "g6-math-u1" -> { grade: "6", subject: "Math" }; null for an id this form cannot place. */
export function unitFacts(id) {
  const m = /^g([k1-8])-([a-z]+)-u\d+$/.exec(String(id || ""));
  if (!m || !SUBJECT_OF_CODE[m[2]]) return null;
  return { grade: m[1] === "k" ? "K" : m[1], subject: SUBJECT_OF_CODE[m[2]] };
}

/** /api/bcpss/packet link for one part. `counts` is the cover sheet's band counts (string or object). */
export function packetHref({ unit, part, format = "pdf", band = null, counts = null }) {
  const q = new URLSearchParams({ unit, part, format });
  if (band) q.set("band", band);
  if (counts) q.set("counts", typeof counts === "string" ? counts : countsToString(counts));
  return `/api/bcpss/packet?${q}`;
}

/** The three student papers for a unit: code, teacher-side group label and how many copies to print. */
export function paperRows(unit, counts) {
  const codes = variantCodes(unit);
  return BANDS.map((band) => ({ band, code: codes[band], label: BAND_LABEL[band], copies: counts[band] || 0 }));
}

export { countsToString, parseCounts };
