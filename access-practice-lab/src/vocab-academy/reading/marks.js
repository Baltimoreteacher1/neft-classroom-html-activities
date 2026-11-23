// Vocabulary Academy reader — the learner's own marks and the saved state of one reading. PURE.
// Kept only on this device, in progress.reading[<readingId>]:
//   { done, at, hl:[{ p, s, k }], notes:[{ p, s, t }], retell, spot:[wordId], pred, found:[clueIndex], ans:{ [qid]:{ first, right, tries } } }
// `p` paragraph, `s` sentence (both 0-based), `k` one of MARKS, `t` the note text. Everything read back from storage goes
// through cleanReadingState, so a hand-edited or imported record can never put markup, huge text or odd keys in the page.

export const MARKS = ["imp", "sur", "q"];
/** Labels with a shape so a mark is never told apart by colour alone: [en, es, glyph]. */
export const MARK_LABEL = {
  imp: ["Important", "Importante", "★"],
  sur: ["Surprise", "Sorpresa", "!"],
  q: ["Question", "Pregunta", "?"],
};
export const LIMITS = {
  marks: 120,
  notes: 60,
  noteChars: 240,
  retellChars: 1200,
  predChars: 300,
  spot: 40,
  found: 12,
  ans: 12,
};

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const idx = (v) => (Number.isInteger(v) && v >= 0 && v < 500 ? v : null);
const text = (v, max) =>
  typeof v === "string"
    ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").slice(0, max)
    : "";
const BAD = new Set(["__proto__", "constructor", "prototype"]);
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
const iso = (v) =>
  typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v)) ? v : "";

export const blankReadingState = () => ({
  done: false,
  at: "",
  hl: [],
  notes: [],
  retell: "",
  spot: [],
  pred: "",
  found: [],
  ans: {},
});

export function cleanReadingState(raw) {
  const out = blankReadingState();
  if (!isObj(raw)) return out;
  out.done = raw.done === true;
  out.at = iso(raw.at);
  const seen = new Set();
  for (const h of Array.isArray(raw.hl) ? raw.hl : []) {
    if (!isObj(h) || !MARKS.includes(h.k)) continue;
    const p = idx(h.p);
    const s = idx(h.s);
    if (p === null || s === null || seen.has(`${p}:${s}`)) continue;
    seen.add(`${p}:${s}`);
    out.hl.push({ p, s, k: h.k });
    if (out.hl.length >= LIMITS.marks) break;
  }
  const noted = new Set();
  for (const n of Array.isArray(raw.notes) ? raw.notes : []) {
    if (!isObj(n)) continue;
    const p = idx(n.p);
    const s = idx(n.s);
    const t = text(n.t, LIMITS.noteChars).trim();
    if (p === null || s === null || !t || noted.has(`${p}:${s}`)) continue;
    noted.add(`${p}:${s}`);
    out.notes.push({ p, s, t });
    if (out.notes.length >= LIMITS.notes) break;
  }
  out.retell = text(raw.retell, LIMITS.retellChars);
  out.pred = text(raw.pred, LIMITS.predChars);
  out.spot = [
    ...new Set(
      (Array.isArray(raw.spot) ? raw.spot : []).filter(
        (x) => typeof x === "string" && ID_RE.test(x),
      ),
    ),
  ].slice(0, LIMITS.spot);
  out.found = [
    ...new Set((Array.isArray(raw.found) ? raw.found : []).map(idx).filter((x) => x !== null)),
  ].slice(0, LIMITS.found);
  if (isObj(raw.ans))
    for (const [id, a] of Object.entries(raw.ans)) {
      if (BAD.has(id) || !ID_RE.test(id) || !isObj(a) || Object.keys(out.ans).length >= LIMITS.ans)
        continue;
      out.ans[id] = {
        first: a.first === true,
        right: a.right === true,
        tries: Math.min(20, Math.max(1, Math.trunc(Number(a.tries)) || 1)),
      };
    }
  return out;
}

/** The whole `progress.reading` map, cleaned. Unknown reading ids are kept if they look like ids (other grades, later releases). */
export function cleanReadingMap(raw) {
  const out = {};
  if (!isObj(raw)) return out;
  for (const [id, state] of Object.entries(raw)) {
    if (BAD.has(id) || !ID_RE.test(id) || Object.keys(out).length >= 600) continue;
    out[id] = cleanReadingState(state);
  }
  return out;
}

/** Merge two devices' reading maps: finished wins, then the later `at`; marks and notes union. Importing twice changes nothing. */
export function mergeReadingMaps(localRaw, incomingRaw) {
  const a = cleanReadingMap(localRaw);
  const b = cleanReadingMap(incomingRaw);
  const out = { ...b };
  for (const [id, mine] of Object.entries(a)) {
    const other = b[id];
    if (!other) {
      out[id] = mine;
      continue;
    }
    const base =
      mine.done !== other.done ? (mine.done ? mine : other) : mine.at >= other.at ? mine : other;
    const marks = new Map([...other.hl, ...mine.hl].map((h) => [`${h.p}:${h.s}`, h]));
    const notes = new Map([...other.notes, ...mine.notes].map((n) => [`${n.p}:${n.s}`, n]));
    out[id] = cleanReadingState({
      ...base,
      done: mine.done || other.done,
      hl: [...marks.values()],
      notes: [...notes.values()],
      retell: mine.retell || other.retell,
      spot: [...new Set([...other.spot, ...mine.spot])],
    });
  }
  return out;
}

// ── edits (return a NEW state; never mutate) ────────────────────────────────────────────────────────────────────
/** Cycle a sentence's mark: none → imp → sur → q → none, or set it directly with `kind`. Clearing a mark keeps its note. */
export function setMark(state, p, s, kind) {
  const st = cleanReadingState(state);
  const rest = st.hl.filter((h) => !(h.p === p && h.s === s));
  const hl = MARKS.includes(kind) ? [...rest, { p, s, k: kind }] : rest;
  return cleanReadingState({ ...st, hl: hl.sort((x, y) => x.p - y.p || x.s - y.s) });
}
export const markOf = (state, p, s) => state?.hl?.find((h) => h.p === p && h.s === s)?.k || "";
export function setNote(state, p, s, t) {
  const st = cleanReadingState(state);
  const rest = st.notes.filter((n) => !(n.p === p && n.s === s));
  const clean = text(t, LIMITS.noteChars).trim();
  return cleanReadingState({ ...st, notes: clean ? [...rest, { p, s, t: clean }] : rest });
}
export const noteOf = (state, p, s) => state?.notes?.find((n) => n.p === p && n.s === s)?.t || "";
export const setRetell = (state, t) => cleanReadingState({ ...state, retell: t });
export const finishReading = (state, now = new Date().toISOString()) =>
  cleanReadingState({ ...state, done: true, at: state?.at || now });
export const noteAnswer = (state, qid, correct) => {
  const st = cleanReadingState(state);
  const was = st.ans[qid];
  return cleanReadingState({
    ...st,
    ans: {
      ...st.ans,
      [qid]: { first: was ? was.first : Boolean(correct), right: Boolean(was?.right || correct), tries: (was?.tries || 0) + 1 },
    },
  });
};
