// Vocabulary Academy print: the student-safe projection of a unit, and the key stripper for derived items.
//
// Student kinds are rendered ONLY from `studentSafe(unit)` plus `stripKeys(items)`. Everything that is an answer,
// a rationale, a model response or teacher guidance is removed here, once, so no sheet can print it by mistake.
// Derived answer data (items.js) always lives under a property named `key`; `stripKeys` deletes every `key`.

const clone = (value) => JSON.parse(JSON.stringify(value));

/** Student-facing copy of a unit: no teacher block, no editorial notes, no answers, no models. */
export function studentSafe(unit) {
  const u = clone(unit);
  delete u.teacher;
  delete u.editorial;
  delete u.rationale;
  delete u.check;
  for (const w of u.words ?? []) {
    delete w.src;
    delete w.misuse; // sentences reach students only through items (as items, with the verdict stripped)
    delete w.cloze;
    delete w.cloze2;
  }
  for (const q of u.passage?.qs ?? []) {
    delete q.a;
    delete q.why;
  }
  for (const g of u.relations?.groups ?? []) delete g.ids;
  delete u.relations?.shades; // the ladder order is the answer; items.js supplies a scrambled copy
  for (const a of u.relations?.analogies ?? []) delete a.a;
  for (const c of u.produce?.combine ?? []) delete c.model;
  return u;
}

/** Deep copy of derived items with every `key` removed. */
export function stripKeys(value) {
  if (Array.isArray(value)) return value.map(stripKeys);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) if (k !== "key") out[k] = stripKeys(v);
    return out;
  }
  return value;
}

/** Every teacher-only or answer-key string in a unit: the list the leak test refuses to find in student output. */
export function forbiddenStrings(unit) {
  const out = [];
  const walk = (v) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(unit.teacher);
  walk(unit.editorial);
  if (unit.rationale) out.push(unit.rationale);
  for (const c of unit.check?.constructed ?? []) {
    out.push(c.model);
    walk(c.look);
  }
  for (const w of unit.words ?? []) if (w.misuse?.why) out.push(w.misuse.why);
  for (const q of unit.passage?.qs ?? []) if (q.why) out.push(q.why);
  for (const c of unit.produce?.combine ?? []) if (c.model) out.push(c.model);
  return out.filter((s) => typeof s === "string" && s.trim().length >= 12);
}
