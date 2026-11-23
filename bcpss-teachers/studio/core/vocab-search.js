// Vocabulary library search and faceted filtering. Pure functions: no DOM, no storage, importable by Node tests.
import { BANDS, SUBJECT_IDS, SUBJECT_PROFILE } from "../data/taxonomy.js";

export const FACETS = ["band", "subject", "standard", "unit", "klu"];
export const FACET_LABEL = {
  band: "Grade band",
  subject: "Subject",
  standard: "Standard",
  unit: "Unit",
  klu: "Language function",
};

/** Lower-case, accent-free text for matching ("razon" finds "razón"). */
export const fold = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** The values one collection offers for each facet. */
export function facetValues(c) {
  const klus = [...new Set((c.entries || []).map((e) => e.klu).filter(Boolean))];
  return {
    band: c.band ? [c.band] : [],
    subject: c.subject ? [c.subject] : [],
    standard: [...(c.standards || [])],
    unit: c.curriculum?.unitId ? [c.curriculum.unitId] : [],
    klu: klus,
  };
}

export function labelFor(facet, value) {
  if (facet === "band") return BANDS.find((b) => b.id === value)?.label || value;
  if (facet === "subject") return SUBJECT_PROFILE[value]?.short || value;
  if (facet === "unit") return String(value).replace(/^g\d+-/, "").replace(/-/g, " ");
  return String(value);
}

const ORDER = {
  band: (v) => BANDS.findIndex((b) => b.id === v),
  subject: (v) => SUBJECT_IDS.indexOf(v),
};

/** One searchable row per entry, built once per library load. */
export function buildIndex(collections) {
  const rows = [];
  for (const c of collections) {
    for (const e of c.entries || []) {
      rows.push({
        cid: c.id,
        eid: e.id,
        word: e.word,
        es: e.es?.word || "",
        wordF: fold(e.word),
        esF: fold(e.es?.word),
        defF: fold(`${e.def || ""} ${e.es?.def || ""}`),
      });
    }
  }
  return rows;
}

const variants = (q) => {
  const f = fold(q);
  if (!f) return [];
  const out = new Set([f]);
  if (f.length > 3 && f.endsWith("es")) out.add(f.slice(0, -2));
  if (f.length > 3 && f.endsWith("s")) out.add(f.slice(0, -1));
  return [...out];
};

function scoreRow(row, forms) {
  let best = 0;
  let kind = "";
  const bump = (n, k) => {
    if (n > best) {
      best = n;
      kind = k;
    }
  };
  for (const q of forms) {
    if (row.wordF === q) bump(100, "word");
    else if (row.esF === q) bump(95, "spanish");
    else if (row.wordF.startsWith(q)) bump(80, "word");
    else if (row.esF.startsWith(q)) bump(75, "spanish");
    else if (row.wordF.split(" ").some((t) => t.startsWith(q))) bump(60, "word");
    else if (row.esF.split(" ").some((t) => t.startsWith(q))) bump(55, "spanish");
    else if (row.wordF.includes(q)) bump(50, "word");
    else if (row.esF.includes(q)) bump(45, "spanish");
    else if (q.length > 2 && ` ${row.defF} `.includes(` ${q}`)) bump(20, "definition");
  }
  return { score: best, kind };
}

/** Entry hits for a query across the indexed collections, best first. Optional scope = set of collection ids. */
export function searchEntries(index, query, { limit = 60, scope = null } = {}) {
  const forms = variants(query);
  if (!forms.length) return [];
  const hits = [];
  for (const row of index) {
    if (scope && !scope.has(row.cid)) continue;
    const { score, kind } = scoreRow(row, forms);
    if (score > 0) hits.push({ cid: row.cid, eid: row.eid, word: row.word, es: row.es, score, kind });
  }
  hits.sort((a, b) => b.score - a.score || a.word.localeCompare(b.word));
  return hits.slice(0, limit);
}

const titleMatches = (c, forms) => forms.some((q) => fold(c.title).includes(q));

/** Collections passing every active filter (except `skip`) and the query. */
export function filterCollections(collections, index, state, skip = null) {
  const forms = variants(state.q);
  const hitSet = forms.length ? new Set(searchEntries(index, state.q, { limit: 5000 }).map((h) => h.cid)) : null;
  return collections.filter((c) => {
    const vals = facetValues(c);
    for (const f of FACETS) {
      if (f === skip || !state[f]) continue;
      if (!vals[f].includes(state[f])) return false;
    }
    if (hitSet && !hitSet.has(c.id) && !titleMatches(c, forms)) return false;
    return true;
  });
}

/**
 * Filter values to offer. Counts are disjunctive (computed with every OTHER filter applied), and a value with zero
 * results is never offered, except the one currently selected so it can still be cleared.
 */
export function facetCounts(collections, index, state) {
  const out = {};
  for (const f of FACETS) {
    const pool = filterCollections(collections, index, state, f);
    const counts = new Map();
    for (const c of pool) for (const v of facetValues(c)[f]) counts.set(v, (counts.get(v) || 0) + 1);
    if (state[f] && !counts.has(state[f])) counts.set(state[f], 0);
    const rank = ORDER[f];
    out[f] = [...counts.entries()]
      .filter(([v, n]) => n > 0 || v === state[f])
      .map(([value, count]) => ({ value, count, label: labelFor(f, value), selected: state[f] === value }))
      .sort((a, b) => (rank ? rank(a.value) - rank(b.value) : a.label.localeCompare(b.label, "en", { numeric: true })));
  }
  return out;
}

/** Counts for an entry-level attribute (part of speech, tier) with every other predicate applied. Zero never offered. */
export function entryValueCounts(entries, getter, predicate = () => true) {
  const counts = new Map();
  for (const e of entries) {
    if (!predicate(e)) continue;
    const v = getter(e);
    if (v == null || v === "") continue;
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => String(a.value).localeCompare(String(b.value), "en", { numeric: true }));
}

export function parseState(search = "") {
  const p = new URLSearchParams(String(search).replace(/^\?/, ""));
  const s = { q: p.get("q") || "" };
  for (const f of FACETS) s[f] = p.get(f) || "";
  return s;
}

export function serializeState(state) {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  for (const f of FACETS) if (state[f]) p.set(f, state[f]);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const hasActiveFilters = (state) => !!state.q || FACETS.some((f) => state[f]);
