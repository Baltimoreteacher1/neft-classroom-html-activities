// Language Quest content loader: the catalog (worlds, characters and each mission's summary) is one small file
// (content/quest/index.json, written by tools/validate-quest.mjs --write); a mission's items load only when it is opened.
import { BASE } from "../util.js";

const cache = new Map();
function get(path) {
  if (!cache.has(path)) {
    const p = fetch(`${BASE}/content/quest/${path}`, { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error(`quest/${path}: HTTP ${r.status}`);
      return r.json();
    });
    cache.set(path, p);
    p.catch(() => cache.delete(path));
  }
  return cache.get(path);
}
export const loadCatalog = () => get("index.json");
export const loadMission = (id) => get(`missions/${id}.json`);
export const worldOf = (cat, id) => cat.worlds.find((w) => w.id === id);
export const characterOf = (cat, id) => cat.characters.find((c) => c.id === id);
export const missionMeta = (cat, id) => cat.missions.find((m) => m.id === id);
