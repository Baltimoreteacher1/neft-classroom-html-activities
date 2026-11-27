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
export const loadSpeaking = () => get("speaking.json");
/** The speak item of a Speaking Studio task: the same item kind a mission uses, so one renderer serves both. */
export const speakItemOf = (t) => ({ id: "speak", kind: "speak", prompt: t.prompt, ladder: t.ladder, selfChecks: t.selfChecks, needSelf: t.needSelf, typedMin: t.typedMin });
/** A one-item mission built from a studio task, so evidence, portfolio and the teacher read it like any run. */
export const pseudoMission = (t) => ({
  id: `speaking-${t.id}`, studio: true, band: t.band, title: t.title, objective: { en: t.prompt, es: t.title.es }, domains: ["Speaking"], functions: ["Describe"], keyUses: ["Inform"], minutes: 10, characters: [t.character],
  stages: [{ id: "communicate", title: "Speak", items: [speakItemOf(t)] }], endings: [{ id: "done", title: "Saved", text: "" }],
});
export const loadMission = (id) =>
  id.startsWith("speaking-") ? loadSpeaking().then((d) => pseudoMission(d.tasks.find((t) => `speaking-${t.id}` === id))) : get(`missions/${id}.json`);
export const worldOf = (cat, id) => cat.worlds.find((w) => w.id === id);
export const characterOf = (cat, id) => cat.characters.find((c) => c.id === id);
export const missionMeta = (cat, id) => cat.missions.find((m) => m.id === id);
