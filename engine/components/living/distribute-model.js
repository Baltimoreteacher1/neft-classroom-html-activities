// distribute-model.js — pure validation and formatting for the distribute play (no DOM).

const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export function validateDistribute(cfg) {
  const a = Number(cfg?.a);
  const c = Number(cfg?.c);
  if (!okInt(a, 2, 5) || !okInt(c, 1, 6)) return null;
  const presets = (Array.isArray(cfg.presets) ? cfg.presets : [])
    .map((p) => ({ a: Number(p.a), c: Number(p.c) }))
    .filter((p) => okInt(p.a, 2, 5) && okInt(p.c, 1, 6) && !(p.a === a && p.c === c));
  // Reverse and transfer scenes need two OTHER expressions; fall back to
  // deterministic neighbours of the lesson's own numbers when none are authored.
  const fallback = [
    { a: a === 2 ? 3 : 2, c: c === 5 ? 3 : 5 },
    { a: a === 4 ? 5 : 4, c: c === 3 ? 2 : 3 },
  ];
  while (presets.length < 2) presets.push(fallback[presets.length]);
  return { a, c, reverse: presets[0], transfer: presets[1] };
}

export const fmtFactored = (a, c) => `${a}(x + ${c})`;
export const fmtExpanded = (a, c) => `${a}x + ${a * c}`;

/** Stable position for the correct choice — never always first. */
export function placeCorrect(options, seed) {
  const k = seed % options.length;
  const correct = options.find((o) => o.correct);
  const rest = options.filter((o) => !o.correct);
  rest.splice(k, 0, correct);
  return rest;
}
