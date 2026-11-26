/* =============================================================================
 * The student copy of an activity (see activities.js): what a student may download once a teacher publishes.
 * ========================================================================== */

import { normalizeActivity } from "./schema.js";

const MARKER = /\[\[([^\]]+)\]\]/g;

const rand = (n) => {
  const b = new Uint32Array(1);
  crypto.getRandomValues(b);
  return b[0] % n;
};
/** A random permutation of 0..n-1 with no element left in place (for n >= 2), so a shuffled key is never the key. */
function permutation(n) {
  const base = Array.from({ length: n }, (_, i) => i);
  if (n < 2) return base;
  for (let tries = 0; tries < 24; tries++) {
    const p = base.slice();
    for (let i = n - 1; i > 0; i--) {
      const j = rand(i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    if (p.every((v, i) => v !== i)) return p;
  }
  const k = 1 + rand(n - 1);
  return base.map((i) => (i + k) % n);
}
const permute = (list) => permutation(list.length).map((i) => list[i]);

/** Per format: what a worksheet student copy replaces. Prompts, options and the layout stay; every key goes. */
const WORKSHEET = {
  choice: () => ({ answer: "" }),
  multi: () => ({ answers: [] }),
  match: (q) => {
    const rights = permute(q.pairs.map((p) => p.right));
    return { pairs: q.pairs.map((p, i) => ({ ...p, right: rights[i] })) };
  },
  sort: (q) => ({ items: permute(q.items).map((i) => ({ ...i, category: "" })) }),
  order: (q) => ({ items: permute(q.items) }),
  blank: (q) => ({
    text: q.text.replace(MARKER, "[[ ]]"),
    bank: false,
    prompt: q.bank
      ? `${q.prompt}\nWord bank / Banco de palabras: ${permute(
          [...q.text.matchAll(MARKER)].map((m) => m[1].split("|")[0].trim()),
        ).join(", ")}`
      : q.prompt,
  }),
  number: () => ({ answer: "", accept: [], tolerance: 0, expr: "" }),
  short: () => ({ sample: "", rubric: [] }),
  identify: (q) => ({ text: q.text.replace(MARKER, (_, m) => m.split("|")[0].trim()) }),
  hotspot: () => ({ answer: "" }),
  numberline: () => ({ answer: "", tolerance: 0 }),
  build: (q) => ({ words: permute(q.words), accept: [] }),
  error: () => ({ errorStep: "", fixAnswer: "" }),
  fillTable: (q) => ({
    rows: q.rows.map((r) => r.map((c) => (c && typeof c === "object" ? { answer: "" } : c))),
  }),
  plot: () => ({ points: [] }),
};

const worksheetQuestion = (q) => ({
  ...q,
  ...WORKSHEET[q.format](q),
  hint: "",
  explanation: "",
  misconception: "",
});

/**
 * What a student may download. Never `notes` or `note` blocks. A worksheet copy has no answers anywhere: choice
 * answers, keys, samples, rubrics and explanations are blanked, and match, sort, order and build contents are
 * shuffled (derangements, not stored) so the order cannot be read as the key.
 */
export function studentCopyFor(activity) {
  const a = normalizeActivity(activity);
  const worksheet = a.kind === "worksheet";
  a.notes = { teacher: "", misconceptions: [] };
  if (worksheet) a.options.answerKey = false;
  a.blocks = a.blocks
    .filter((b) => b.type !== "note")
    .map((b) => (worksheet && b.type === "question" ? worksheetQuestion(b) : b));
  return a;
}
