// Misconception Detective storage: one key, device only. Unfinished cases (resume) and finished ones (progress).
// Holds the learner's typed sentence, so it is never exported or sent anywhere.
import { safeJson, storage } from "../util.js";
import { caseById, sanitizeState } from "./engine.js";

export const KEY = "accessPracticeLab:v1:claim-check";

export function load() {
  const raw = safeJson(storage.get(KEY), null) || {};
  const open = {};
  for (const [id, s] of Object.entries(raw.open && typeof raw.open === "object" ? raw.open : {})) {
    const c = caseById(id);
    if (c) open[id] = sanitizeState(s, c);
  }
  const done = {};
  for (const [id, r] of Object.entries(raw.done && typeof raw.done === "object" ? raw.done : {}))
    if (caseById(id)) done[id] = { independent: r?.independent === true, t: typeof r?.t === "string" ? r.t : "" };
  return { v: 1, open, done, last: caseById(raw.last) ? raw.last : "" };
}

export const save = (data) => storage.set(KEY, JSON.stringify(data));
