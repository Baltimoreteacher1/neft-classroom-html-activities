// Search and filtering over the manifest. Pure functions: ranking and facet counts are unit-tested.
import { BANDS, SUBJECT_PROFILE } from "../data/taxonomy.js";

const norm = (s) => String(s ?? "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
const words = (s) => norm(s).split(/[^a-z0-9.]+/).filter(Boolean);
const codeLike = (t) => /\d/.test(t) && /[a-z]/.test(t);

/** Grades an item applies to: its own grade, an explicit list, or every grade in its band. */
export function itemGrades(item) {
  if (item.grade) return [String(item.grade)];
  if (Array.isArray(item.grades) && item.grades.length) return item.grades.map(String);
  return BANDS.find((b) => b.id === item.band)?.grades || [];
}
export const itemSubjects = (item) =>
  item.subjects?.length ? item.subjects : item.subject ? [item.subject] : [];

/** Score one item for one token. 0 means the token matched nowhere. */
function scoreToken(item, tok) {
  const title = norm(item.title);
  const tw = words(item.title);
  let best = 0;
  const bump = (n) => {
    if (n > best) best = n;
  };
  if (title === tok) bump(100);
  else if (title.startsWith(tok)) bump(70);
  else if (tw.includes(tok)) bump(55);
  else if (tw.some((w) => w.startsWith(tok))) bump(40);
  else if (title.includes(tok)) bump(25);
  for (const s of item.standards || []) {
    const c = norm(s);
    if (c === tok) bump(95);
    else if (codeLike(tok) && c.startsWith(tok)) bump(60);
    else if (tok.length > 3 && c.includes(tok)) bump(30);
  }
  for (const v of item.vocab || []) {
    const w = norm(v);
    if (w === tok) bump(65);
    else if (tok.length > 2 && w.startsWith(tok)) bump(35);
  }
  for (const k of item.klus || []) if (norm(k) === tok) bump(30);
  for (const d of item.domains || []) if (norm(d) === tok) bump(20);
  if (item.lo && norm(item.lo).includes(tok)) bump(18);
  for (const s of itemSubjects(item)) {
    const p = SUBJECT_PROFILE[s];
    if (p && (norm(p.label).includes(tok) || norm(p.short) === tok)) bump(12);
  }
  if (norm(item.id).includes(tok)) bump(6);
  return best;
}

/** Every filter value present must match; `kind`, `subject`, `grade`, `klu`, `domain`, `engine`. */
export function passes(item, f = {}) {
  if (f.kind && item.kind !== f.kind) return false;
  if (f.subject && !itemSubjects(item).includes(f.subject)) return false;
  if (f.grade && !itemGrades(item).includes(String(f.grade))) return false;
  if (f.klu && !(item.klus || []).includes(f.klu)) return false;
  if (f.domain && !(item.domains || []).includes(f.domain)) return false;
  if (f.engine && item.engine !== f.engine) return false;
  return true;
}

/** Ranked results. All words must match somewhere (AND); ties break by title then id so order is stable. */
export function searchItems(items, query = "", filters = {}) {
  const toks = words(query);
  const rows = [];
  for (const item of items) {
    if (!passes(item, filters)) continue;
    let total = 0;
    let ok = true;
    for (const t of toks) {
      const s = scoreToken(item, t);
      if (!s) {
        ok = false;
        break;
      }
      total += s;
    }
    if (ok) rows.push({ item, score: total });
  }
  rows.sort(
    (a, b) =>
      b.score - a.score ||
      String(a.item.title).localeCompare(String(b.item.title)) ||
      String(a.item.id).localeCompare(String(b.item.id)),
  );
  return rows.map((r) => r.item);
}

const FACETS = {
  kind: (i) => [i.kind],
  subject: itemSubjects,
  grade: itemGrades,
  klu: (i) => i.klus || [],
  domain: (i) => i.domains || [],
  engine: (i) => (i.engine ? [i.engine] : []),
};

/**
 * Counts per facet value for the current query, with every OTHER filter applied. A value that would give zero
 * results is absent, so the UI never offers a dead option.
 */
export function facetCounts(items, query = "", filters = {}) {
  const out = {};
  for (const [name, pick] of Object.entries(FACETS)) {
    const without = { ...filters, [name]: "" };
    const counts = new Map();
    for (const item of searchItems(items, query, without)) {
      for (const v of new Set(pick(item))) counts.set(v, (counts.get(v) || 0) + 1);
    }
    out[name] = Object.fromEntries(counts);
  }
  return out;
}
