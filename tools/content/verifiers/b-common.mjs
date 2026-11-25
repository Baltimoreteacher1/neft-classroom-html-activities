// Shared helpers for the Prompt 3 Wave 2 "B" content verifiers (cognate, standards, spanish, frames).
//
// Subject contract (what every B verifier's verify(subject, ctx) receives):
//   { kind: "unit", id, unit, studio, lessons }   one Language Studio unit, its seed record and its lesson companions
//   { kind: "term", id, term }                    one record of the shared term bank (db/seeds/bcpss/v2/terms.mjs)
// Finding: { code, severity: "error" | "warn" | "info", path, message, evidence }.
// Verifiers are pure: no I/O, no clock, no randomness; reference data arrives through ctx.

export const EXIT = { OK: 0, FAIL: 1, ERROR: 3 };
export const SEVERITIES = ["error", "warn", "info"];

export const finding = (code, severity, path, message, evidence = "") => ({
  code,
  severity,
  path,
  message,
  evidence: String(evidence).slice(0, 240),
});

/** Lowercase, accent-free, punctuation reduced to single spaces. */
export const fold = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function levenshtein(a, b) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Normalized edit distance 0 (same) .. 1 (nothing shared). */
export const normalizedDistance = (a, b) =>
  a.length === 0 && b.length === 0 ? 0 : levenshtein(a, b) / Math.max(a.length, b.length);

/** How the unit author marked a pair: "cognate" | "false_friend" | "not_cognate" | "unmarked". */
export function markOf(status, note) {
  const text = String(note ?? "").trim();
  if (status === "false_friend" || /^false friend\b|\bfalse friend\b/i.test(text))
    return "false_friend";
  if (
    status === "none" ||
    /^(not an? (exact )?cognate|no (exact |single )?(cognate|word))/i.test(text)
  ) {
    return "not_cognate";
  }
  if (status === "true" || /^cognate\b|\bcognate pair\b|\btrue cognate/i.test(text))
    return "cognate";
  return "unmarked";
}

/**
 * English|Spanish pairs in a subject, de-duplicated by (en, es, mark) so a word repeated in every lesson of a unit is
 * judged once. Each pair: { source, path, en, es, mark, note, reviewStatus, count }.
 */
export function pairsOf(subject) {
  const out = new Map();
  const add = (p) => {
    const en = String(p.en ?? "").trim();
    const es = String(p.es ?? "").trim();
    if (!en || !es) return;
    const mark = markOf(p.status, p.note);
    const key = `${en}|${es}|${mark}`;
    const hit = out.get(key);
    if (hit) hit.count += 1;
    else out.set(key, { ...p, en, es, mark, count: 1 });
  };
  if (subject.kind === "term") {
    const t = subject.term;
    add({
      source: "terms",
      path: `terms.${t.id}`,
      en: t.term,
      es: t.glosses?.es?.text,
      status: t.cognate,
      note: t.notes,
      reviewStatus: t.glosses?.es?.review_status ?? "machine",
    });
    return [...out.values()];
  }
  (subject.studio?.vocab ?? []).forEach((v, i) =>
    add({
      source: "studio",
      path: `studio.vocab[${i}]`,
      en: v.term,
      es: v.es,
      note: v.es_note,
      reviewStatus: "machine",
    }),
  );
  (subject.lessons ?? []).forEach((lesson, l) =>
    (lesson.newcomer_path ?? []).forEach((act, a) =>
      (act.payload?.items ?? []).forEach((it, k) =>
        add({
          source: "lesson",
          path: `lessons[${l}].newcomer_path[${a}].payload.items[${k}]`,
          en: it.term,
          es: it.es,
          status: it.status,
          note: it.why ?? it.note,
          reviewStatus: lesson.review?.translation?.es?.state ?? "machine",
        }),
      ),
    ),
  );
  return [...out.values()];
}

/** Split a Spanish gloss into alternatives ("a / b", "a, b") and drop parenthetical asides. */
export const alternatives = (es) =>
  String(es)
    .replace(/\([^)]*\)/g, " ")
    .split(/\s*[/;,]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
