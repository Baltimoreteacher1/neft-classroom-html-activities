// Living Language Simulation Engine: the mission registry. Built-in missions are listed here (a new mission is one
// entry); compiled experiences made by the instructor compiler live on this device under
// accessPracticeLab:v1:experiences = { [id]: { def, updatedAt } } and are read, never written, by this module.
import { safeJson, storage } from "../../util.js";
import { build as cityThatStoppedTalking, ID as CITY_ID } from "./city-that-stopped-talking.js";

export const EXPERIENCES_KEY = "accessPracticeLab:v1:experiences";
export const FLAGSHIP_ID = CITY_ID;
/** Objective id (src/pathways/graph.js slug) a mission's language tasks are recorded against. */
export const DEFAULT_OBJECTIVE = "explain-with-evidence";

const BUILDERS = { [CITY_ID]: cityThatStoppedTalking };
export const MISSION_IDS = Object.freeze(Object.keys(BUILDERS));

const bandOf = (band) => (band === "3-5" ? "3-5" : "6-8");

/** A built-in mission for a grade band (same id and structure in both bands), or null. */
export const missionById = (id, band) => (BUILDERS[id] ? BUILDERS[id](bandOf(band)) : null);
export const listMissions = (band) => MISSION_IDS.map((id) => missionById(id, band));

/** Compiled experiences saved on this device: [{ id, def, updatedAt }], newest first. */
export function localExperiences(read = (k) => storage.get(k)) {
  const all = safeJson(read(EXPERIENCES_KEY), null);
  if (!all || typeof all !== "object" || Array.isArray(all)) return [];
  return Object.entries(all)
    .filter(([, v]) => v && typeof v === "object" && v.def && typeof v.def === "object")
    .map(([id, v]) => ({ id, def: v.def, updatedAt: String(v.updatedAt || "") }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export const localExperience = (id, read) =>
  localExperiences(read).find((x) => x.id === id) || null;
