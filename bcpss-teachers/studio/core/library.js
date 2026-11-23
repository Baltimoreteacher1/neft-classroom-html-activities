// Teacher library: favorites, recents, bundles, backup/restore. Device-local; nothing leaves the browser.
import { TIER_IDS } from "../data/taxonomy.js";
import { newId, normalize as normalizeClass } from "./classes.js";
import { getPrefs } from "./prefs.js";
import { keys, read, write } from "./store.js";

const MAX_RECENTS = 60;
const MAX_FAVORITES = 300;
const FILE_APP = "bcpss-teacher-studio";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const KINDS = ["lesson", "vocab", "activity", "wida", "project", "unit", "part"];
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
export const onLibrary = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
/** Reduce anything to a storable library reference. Returns null when it is not one. */
export function toRef(raw) {
  if (!raw || !KINDS.includes(raw.kind) || !raw.id) return null;
  const ref = { kind: raw.kind, id: str(String(raw.id), 120), title: str(raw.title, 160) || str(String(raw.id), 120) };
  for (const f of ["grade", "subject"]) if (raw[f]) ref[f] = str(String(raw[f]), 30);
  for (const f of ["lessonId", "label", "text", "href"]) if (raw[f]) ref[f] = str(String(raw[f]), f === "text" ? 1200 : 300);
  if (raw.t) ref.t = str(raw.t, 40);
  return ref;
}
const same = (a, b) => a.kind === b.kind && a.id === b.id;
const list = (k) => (read(k, []) || []).map(toRef).filter(Boolean);

// favorites
export const favorites = () => list("favorites");
export const isFavorite = (item) => favorites().some((f) => same(f, item));
export function toggleFavorite(item) {
  const ref = toRef(item);
  if (!ref) return false;
  const all = favorites();
  const on = !all.some((f) => same(f, ref));
  write("favorites", on ? [{ ...ref, t: new Date().toISOString() }, ...all].slice(0, MAX_FAVORITES) : all.filter((f) => !same(f, ref)));
  emit();
  return on;
}

// recents (also the searchable history)
export const recents = () => list("recents");
export function addRecent(item) {
  const ref = toRef(item);
  if (!ref) return;
  write("recents", [{ ...ref, t: new Date().toISOString() }, ...recents().filter((r) => !same(r, ref))].slice(0, MAX_RECENTS));
  emit();
}
export const clearRecents = () => {
  write("recents", []);
  emit();
};
export function searchHistory(query) {
  const words = String(query || "").toLowerCase().split(/\s+/).filter(Boolean);
  const hay = (r) => `${r.title} ${r.kind} ${r.subject || ""} ${r.grade || ""} ${r.label || ""}`.toLowerCase();
  return recents().filter((r) => words.every((w) => hay(r).includes(w)));
}

// bundles
const bundleOf = (b) => ({
  id: str(b.id, 40) || newId(),
  name: str(b.name, 80).trim() || "Untitled bundle",
  items: (b.items || []).map(toRef).filter(Boolean),
  created: str(b.created, 40),
  updated: str(b.updated, 40),
});
export const bundles = () => (read("bundles", []) || []).map(bundleOf);
export const getBundle = (id) => bundles().find((b) => b.id === id) || null;
function saveBundles(next) {
  write("bundles", next);
  emit();
}
function mutate(id, fn) {
  const now = new Date().toISOString();
  saveBundles(bundles().map((b) => (b.id === id ? { ...b, ...fn(b), updated: now } : b)));
}
export function createBundle(name, items = []) {
  const now = new Date().toISOString();
  const b = bundleOf({ id: "", name, items, created: now, updated: now });
  b.id = `b-${newId().slice(2)}`;
  saveBundles([...bundles(), b]);
  return b;
}
export const renameBundle = (id, name) => mutate(id, () => ({ name: str(name, 80).trim() || "Untitled bundle" }));
export const deleteBundle = (id) => saveBundles(bundles().filter((b) => b.id !== id));
export function addToBundle(id, item) {
  const ref = toRef(item);
  if (!ref) return false;
  mutate(id, (b) => ({ items: b.items.some((i) => same(i, ref) && i.label === ref.label) ? b.items : [...b.items, ref] }));
  return true;
}
export const removeFromBundle = (id, index) => mutate(id, (b) => ({ items: b.items.filter((_, i) => i !== index) }));
export function moveInBundle(id, from, to) {
  mutate(id, (b) => {
    if (to < 0 || to >= b.items.length || from === to) return {};
    const items = [...b.items];
    items.splice(to, 0, items.splice(from, 1)[0]);
    return { items };
  });
}

// student links and in-progress activities
const PLAY = "/bcpss-teachers/studio/play/";
export function playUrl(activityId, { tier, lessonId, projector, origin = "" } = {}) {
  const hash = new URLSearchParams({ a: activityId });
  if (TIER_IDS.includes(tier)) hash.set("t", tier);
  if (lessonId) hash.set("l", lessonId);
  return `${origin}${PLAY}${projector ? "?projector=1" : ""}#${hash}`;
}
export const inProgress = () =>
  keys("progress.").map((k) => k.slice("progress.".length)).filter(Boolean).sort();

// backup file
const EVIDENCE_KEY = /^(ev|classev)\.[A-Za-z0-9._-]{1,80}$/;
const PROGRESS_KEY = /^progress\.[A-Za-z0-9._-]{1,80}$/;
export function exportWorkspace({ includeEvidence = false, now = () => new Date() } = {}) {
  const out = {
    app: FILE_APP,
    v: 1,
    exported: now().toISOString(),
    prefs: getPrefs(),
    classes: read("classes", []),
    favorites: favorites(),
    recents: recents(),
    bundles: bundles(),
    progress: Object.fromEntries(keys("progress.").map((k) => [k, read(k)])),
  };
  if (includeEvidence) {
    out.evidence = Object.fromEntries(keys("").filter((k) => EVIDENCE_KEY.test(k)).map((k) => [k, read(k)]));
  }
  return out;
}

const currentClasses = () => (read("classes", []) || []).map(normalizeClass).filter((c) => c.id);
/** Restore a backup. Only known keys are written. mode: "merge" keeps what is here, "replace" starts from the file. */
export function importWorkspace(source, { mode = "merge", includeEvidence = false } = {}) {
  if (typeof source === "string" && source.length > MAX_FILE_BYTES) throw new Error("That file is too large to be a workspace backup.");
  let file;
  try {
    file = typeof source === "string" ? JSON.parse(source) : source;
  } catch {
    throw new Error("That file is not a workspace backup (it could not be read).");
  }
  if (!file || file.app !== FILE_APP || file.v !== 1) throw new Error("That file is not a BCPSS Teacher Studio backup.");
  const keep = mode !== "replace";
  const incomingClasses = (Array.isArray(file.classes) ? file.classes : []).map(normalizeClass).filter((c) => c.id);
  const incomingBundles = (Array.isArray(file.bundles) ? file.bundles : []).map(bundleOf);
  const incomingFavs = (Array.isArray(file.favorites) ? file.favorites : []).map(toRef).filter(Boolean);
  const incomingRecents = (Array.isArray(file.recents) ? file.recents : []).map(toRef).filter(Boolean);
  const merge = (cur, inc) => [
    ...(keep ? cur : []),
    ...inc.filter((i) => !(keep ? cur : []).some((c) => same(c, i))),
  ];
  const classMap = new Map((keep ? currentClasses() : []).map((c) => [c.id, c]));
  for (const c of incomingClasses) if (!classMap.has(c.id)) classMap.set(c.id, c);
  write("classes", [...classMap.values()]);
  write(
    "bundles",
    keep ? [...bundles(), ...incomingBundles.filter((b) => !getBundle(b.id))] : incomingBundles,
  );
  write("favorites", merge(favorites(), incomingFavs).slice(0, MAX_FAVORITES));
  write("recents", merge(recents(), incomingRecents).slice(0, MAX_RECENTS));
  let evidenceKeys = 0;
  if (file.progress && typeof file.progress === "object") {
    for (const [k, v] of Object.entries(file.progress)) if (PROGRESS_KEY.test(k)) write(k, v);
  }
  if (includeEvidence && file.evidence && typeof file.evidence === "object") {
    for (const [k, v] of Object.entries(file.evidence)) {
      if (EVIDENCE_KEY.test(k) && Array.isArray(v)) {
        write(k, v);
        evidenceKeys += 1;
      }
    }
  }
  emit();
  return {
    classes: incomingClasses.length,
    bundles: incomingBundles.length,
    favorites: incomingFavs.length,
    recents: incomingRecents.length,
    evidenceKeys,
    hasEvidence: Boolean(file.evidence && Object.keys(file.evidence).length),
  };
}
