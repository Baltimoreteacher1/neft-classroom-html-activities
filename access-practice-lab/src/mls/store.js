// Math Literacy Studio: the teacher's lightweight workspace. Stored on this device only (localStorage, key accessPracticeLab:v1:mls).
// It saves recipes (skill, type, options, edits), never student data and never built content, so a saved resource rebuilds identically
// and nothing here can leak a student. No account is needed.
import { storage } from "../util.js";

const KEY = "accessPracticeLab:v1:mls";
const empty = () => ({ v: 1, recents: [], saved: [], favorites: [], collections: [], last: null, seen: false, created: 0 });
let mem = null;
export function load() {
  if (mem) return mem;
  try {
    const raw = storage.get(KEY);
    mem = raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  } catch {
    mem = empty();
  }
  return mem;
}
export function save() {
  try {
    storage.set(KEY, JSON.stringify(mem || empty()));
  } catch {
    /* storage refused: the in-memory copy still works for this visit */
  }
}
export const reset = () => {
  mem = empty();
  save();
};
const uid = () => `r${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

/** A recipe is everything needed to rebuild a resource. */
export const recipe = (skillId, type, opts = {}, edits = {}) => ({ skillId, type, opts, edits });
export const recipeKey = (r) => `${r.skillId}|${r.type}|${JSON.stringify(r.opts)}`;

export function remember(r) {
  const s = load();
  const k = recipeKey(r);
  s.recents = [{ ...r, at: Date.now(), k }, ...s.recents.filter((x) => x.k !== k)].slice(0, 12);
  s.last = { ...r, at: Date.now() };
  save();
}
export function saveResource(r, name) {
  const s = load();
  const item = { id: uid(), name: name || `${r.skillId} ${r.type}`, recipe: r, at: Date.now() };
  s.saved.unshift(item);
  save();
  return item;
}
export function duplicateResource(id) {
  const s = load();
  const it = s.saved.find((x) => x.id === id);
  if (!it) return null;
  const copy = { ...JSON.parse(JSON.stringify(it)), id: uid(), name: `${it.name} (copy)`, at: Date.now() };
  s.saved.unshift(copy);
  save();
  return copy;
}
export function updateSaved(id, patch) {
  const s = load();
  const it = s.saved.find((x) => x.id === id);
  if (!it) return null;
  Object.assign(it, patch, { at: Date.now() });
  save();
  return it;
}
export function removeSaved(id) {
  const s = load();
  s.saved = s.saved.filter((x) => x.id !== id);
  for (const c of s.collections) c.items = c.items.filter((x) => x !== id);
  save();
}
export function toggleFavorite(skillId) {
  const s = load();
  s.favorites = s.favorites.includes(skillId) ? s.favorites.filter((x) => x !== skillId) : [skillId, ...s.favorites];
  save();
  return s.favorites.includes(skillId);
}
export const isFavorite = (skillId) => load().favorites.includes(skillId);
export function newCollection(name) {
  const s = load();
  const c = { id: uid(), name: name || "My collection", items: [], at: Date.now() };
  s.collections.push(c);
  save();
  return c;
}
export function addToCollection(cid, savedId) {
  const s = load();
  const c = s.collections.find((x) => x.id === cid);
  if (c && !c.items.includes(savedId)) c.items.push(savedId);
  save();
}
export function removeFromCollection(cid, savedId) {
  const s = load();
  const c = s.collections.find((x) => x.id === cid);
  if (c) c.items = c.items.filter((x) => x !== savedId);
  save();
}
export function deleteCollection(cid) {
  const s = load();
  s.collections = s.collections.filter((x) => x.id !== cid);
  save();
}
export function markSeen() {
  load().seen = true;
  save();
}
export function noteCreated() {
  load().created += 1;
  save();
}
