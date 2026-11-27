/* collections.js — what /curriculum/find/ keeps on this device, as pure functions over a Storage-like object.
 *
 * Collections: named sets of resources ("Ratios intervention", "Weekend practice"), each item a title, a path, a kind
 * and an optional teacher note. Recent: the last resources opened from Find. Path: a student's own "I did this" marks
 * on a practice path. All of it is titles, site paths and short notes: nothing about a student, never sent anywhere.
 *
 * Sharing puts a collection in the URL fragment (#share=…). The fragment never reaches the server; the receiver's page
 * keeps only paths it can find in the index (or links to The Language Page), so a shared link cannot smuggle in an
 * outside URL, and every text is rendered as text. Tests: tools/curriculum-find-plan.test.mjs. */

export const KEYS = {
  sets: "ewl-find-collections-v1",
  legacy: "ewl-find-list-v1",
  recent: "ewl-find-recent-v1",
  path: "ewl-find-path-v1",
};
export const LIMITS = { sets: 20, items: 60, name: 80, note: 240, recent: 10 };
const LP_ORIGIN = "https://thelanguagepage.com/";

const clip = (s, n) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, n);
/** A site path ("/lessons/6-6/") or a Language Page link; nothing else is kept. */
export const safeHref = (p) =>
  typeof p === "string" &&
  ((p.startsWith("/") && !p.startsWith("//") && !/[\s"'<>\\]/.test(p)) ||
    (p.startsWith(LP_ORIGIN) && !/[\s"'<>\\]/.test(p)));

function read(storage, key, fallback) {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const cleanItem = (x) =>
  x && safeHref(x.p) && typeof x.t === "string" && x.t.trim()
    ? {
        p: x.p,
        t: clip(x.t, 200),
        k: typeof x.k === "string" ? x.k.slice(0, 24) : "",
        ...(x.n ? { n: clip(x.n, LIMITS.note) } : {}),
      }
    : null;
const dedupe = (items) => {
  const seen = new Set();
  return items.filter((x) => x && !seen.has(x.p) && seen.add(x.p)).slice(0, LIMITS.items);
};
let counter = 0;
export const newId = (now = Date.now()) => `c${now.toString(36)}${(counter++).toString(36)}`;

/** A valid state from anything (corrupt storage, an old shape, nothing). Always has one set and a valid active id. */
export function normalize(raw) {
  const sets = (Array.isArray(raw?.sets) ? raw.sets : [])
    .filter((s) => s && typeof s.id === "string" && /^[\w-]{1,40}$/.test(s.id))
    .map((s) => ({
      id: s.id,
      name: clip(s.name, LIMITS.name) || "My list",
      items: dedupe((Array.isArray(s.items) ? s.items : []).map(cleanItem)),
    }))
    .slice(0, LIMITS.sets);
  if (!sets.length) sets.push({ id: "mine", name: "My list", items: [] });
  const active = sets.some((s) => s.id === raw?.active) ? raw.active : sets[0].id;
  return { v: 1, active, sets };
}

/** Read collections, folding in the single "My list" that Find kept before collections existed. */
export function loadSets(storage) {
  const stored = read(storage, KEYS.sets, null);
  if (stored) return normalize(stored);
  const legacy = read(storage, KEYS.legacy, []);
  return normalize({
    active: "mine",
    sets: [{ id: "mine", name: "My list", items: Array.isArray(legacy) ? legacy : [] }],
  });
}
export const saveSets = (storage, state) => write(storage, KEYS.sets, normalize(state));

/* ---------- state changes (each returns a new state) ---------------------------------------------------------- */
const mapActive = (state, fn) => ({
  ...state,
  sets: state.sets.map((s) => (s.id === state.active ? fn(s) : s)),
});
export const activeSet = (state) => state.sets.find((s) => s.id === state.active) || state.sets[0];
export const inActive = (state, p) => activeSet(state).items.some((x) => x.p === p);

export function toggleItem(state, doc) {
  return mapActive(state, (s) =>
    s.items.some((x) => x.p === doc.p)
      ? { ...s, items: s.items.filter((x) => x.p !== doc.p) }
      : { ...s, items: dedupe([...s.items, cleanItem(doc)]) },
  );
}
export const removeItem = (state, p) =>
  mapActive(state, (s) => ({ ...s, items: s.items.filter((x) => x.p !== p) }));
export function moveItem(state, p, delta) {
  return mapActive(state, (s) => {
    const items = [...s.items];
    const at = items.findIndex((x) => x.p === p);
    const to = at + delta;
    if (at < 0 || to < 0 || to >= items.length) return s;
    [items[at], items[to]] = [items[to], items[at]];
    return { ...s, items };
  });
}
export const setNote = (state, p, note) =>
  mapActive(state, (s) => ({
    ...s,
    items: s.items.map((x) => (x.p === p ? cleanItem({ ...x, n: note }) || x : x)),
  }));
export function addSet(state, name, items = [], id = newId()) {
  if (state.sets.length >= LIMITS.sets) return state;
  const set = {
    id,
    name: clip(name, LIMITS.name) || "New collection",
    items: dedupe(items.map(cleanItem)),
  };
  return { ...state, active: set.id, sets: [...state.sets, set] };
}
export const renameSet = (state, name) =>
  mapActive(state, (s) => ({ ...s, name: clip(name, LIMITS.name) || s.name }));
export function deleteSet(state) {
  const sets = state.sets.filter((s) => s.id !== state.active);
  return normalize({ sets, active: sets[0]?.id });
}
export const clearSet = (state) => mapActive(state, (s) => ({ ...s, items: [] }));
export const selectSet = (state, id) =>
  state.sets.some((s) => s.id === id) ? { ...state, active: id } : state;

/* ---------- sharing -------------------------------------------------------------------------------------------- */
const b64url = {
  enc: (text) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(text)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, ""),
  dec: (code) => {
    const bin = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  },
};
/** The fragment for a shared collection: name, then [path, note?] pairs. Titles are looked up again on arrival. */
export function encodeShare(set) {
  const body = {
    n: clip(set.name, LIMITS.name),
    i: set.items.slice(0, LIMITS.items).map((x) => (x.n ? [x.p, clip(x.n, LIMITS.note)] : [x.p])),
  };
  return b64url.enc(JSON.stringify(body));
}
/**
 * Read a shared fragment against the index. Unknown site paths are dropped (counted in `dropped`), titles and kinds
 * come from the index, never from the link. Returns null for anything that is not a share.
 */
export function decodeShare(code, index) {
  let body;
  try {
    if (typeof code !== "string" || code.length > 12000 || !/^[\w-]+$/.test(code)) return null;
    body = JSON.parse(b64url.dec(code));
  } catch {
    return null;
  }
  if (!body || !Array.isArray(body.i)) return null;
  const byPath = new Map(index.docs.map((d) => [d.p, d]));
  const items = [];
  let dropped = 0;
  for (const entry of body.i.slice(0, LIMITS.items)) {
    const [p, n] = Array.isArray(entry) ? entry : [];
    const doc = typeof p === "string" ? byPath.get(p) : null;
    if (doc) items.push(cleanItem({ p: doc.p, t: doc.t, k: doc.k, n }));
    else if (safeHref(p) && p.startsWith(LP_ORIGIN))
      items.push(cleanItem({ p, t: "Search on The Language Page", k: "language", n }));
    else dropped++;
  }
  return { name: clip(body.n, LIMITS.name) || "Shared collection", items: dedupe(items), dropped };
}

/* ---------- recently opened ------------------------------------------------------------------------------------ */
export const loadRecent = (storage) =>
  (Array.isArray(read(storage, KEYS.recent, [])) ? read(storage, KEYS.recent, []) : [])
    .map(cleanItem)
    .filter(Boolean)
    .slice(0, LIMITS.recent);
export function pushRecent(storage, doc) {
  const item = cleanItem(doc);
  if (!item) return loadRecent(storage);
  const list = [item, ...loadRecent(storage).filter((x) => x.p !== item.p)].slice(0, LIMITS.recent);
  write(storage, KEYS.recent, list);
  return list;
}

/* ---------- a student's practice path -------------------------------------------------------------------------- */
/** { lesson, done: [slot ids], at } — the student's own marks, never a score. */
export function loadPath(storage) {
  const v = read(storage, KEYS.path, null);
  if (!v || typeof v.lesson !== "string" || !/^\d+-\d+$/.test(v.lesson)) return null;
  const done = Array.isArray(v.done) ? v.done.filter((x) => typeof x === "string").slice(0, 8) : [];
  return { lesson: v.lesson, done: [...new Set(done)] };
}
export function savePath(storage, lesson, done) {
  return write(storage, KEYS.path, { lesson, done: [...new Set(done)] });
}

/** Everything Find keeps on this device, gone. */
export function clearAll(storage) {
  for (const key of Object.values(KEYS)) {
    try {
      storage.removeItem(key);
    } catch {}
  }
}
