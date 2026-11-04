// The Reality Lab record in the learner's JSON backup. Kept free of the experience catalog so the Lab's main bundle does
// not load it: this only bounds the shape and size of what travels; every session is fully repaired against its
// experience when the Reality Lab reads it (store.js cleanLab).
import { profileKey } from "../../family/fm2/profile-key.js";
import { activeProfile } from "../storage.js";

const KEY = "ewl-reality-lab-v1";
const MAX_SESSIONS = 80;
const MAX_BYTES = 24000;
const ID = /^[\w:.-]{1,80}$/;
const plain = (v) => v && typeof v === "object" && !Array.isArray(v);

export function exportLab(profile = activeProfile()) {
  try {
    return JSON.parse(localStorage.getItem(profileKey(KEY, profile)) ?? "null");
  } catch {
    return null;
  }
}

export function cleanLabLite(value) {
  if (!plain(value) || value.v !== 1) return null;
  const keep = (map) => Object.fromEntries(Object.entries(plain(map) ? map : {}).filter(([id, v]) => ID.test(id) && plain(v) && JSON.stringify(v).length <= MAX_BYTES).slice(0, MAX_SESSIONS));
  return {
    v: 1,
    sessions: keep(value.sessions),
    trails: keep(value.trails),
    last: typeof value.last === "string" && ID.test(value.last) ? value.last : null,
    support: ["frames", "starter", "free"].includes(value.support) ? value.support : "frames",
    streak: Number.isInteger(value.streak) && value.streak >= 0 && value.streak <= 99 ? value.streak : 0,
  };
}

export function importLab(clean, profile = activeProfile()) {
  if (!clean) return;
  try {
    localStorage.setItem(profileKey(KEY, profile), JSON.stringify(clean));
  } catch {
    /* a blocked store only loses the Reality Lab record, never the rest of the import */
  }
}
