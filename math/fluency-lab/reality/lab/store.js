// Reality Lab persistence: one versioned save per learner slot (the same slot scheme every Fluency Lab save uses).
// A session is saved with the short list of model actions that built the current step, so a reload rebuilds the exact
// model the learner had. Reads repair what they find; writes report failure instead of throwing.
import { profileKey } from "../../family/fm2/profile-key.js";
import { activeProfile } from "../storage.js";
import { record } from "../../studio/adaptive.js";
import { experienceById } from "./catalog.js";
import { sanitizeSession } from "./journey.js";

const KEY = "ewl-reality-lab-v1";
export const LAB_VERSION = 1;
const MAX_SESSIONS = 80;
const MAX_ACTIONS = 200;

export const emptyLab = () => ({ v: LAB_VERSION, sessions: {}, trails: {}, last: null, support: "frames", streak: 0 });

// A saved model action is a flat object of numbers, short strings and booleans; "on" actions carry one nested act.
const cleanAction = (a, depth = 0) => {
  if (!a || typeof a !== "object" || typeof a.type !== "string") return null;
  const out = { type: a.type.slice(0, 24) };
  for (const [k, v] of Object.entries(a)) {
    if (k === "type" || k.length > 16) continue;
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "string") out[k] = v.slice(0, 64);
    else if (typeof v === "boolean") out[k] = v;
    else if (k === "act" && depth === 0) {
      const inner = cleanAction(v, 1);
      if (inner) out.act = inner;
    }
  }
  return out;
};

export function cleanLab(raw) {
  const out = emptyLab();
  if (!raw || typeof raw !== "object") return out;
  for (const [id, value] of Object.entries(raw.sessions && typeof raw.sessions === "object" ? raw.sessions : {}).slice(0, MAX_SESSIONS)) {
    const exp = experienceById(id);
    const session = exp && sanitizeSession(exp, value);
    if (!session) continue;
    out.sessions[id] = session;
    const trail = raw.trails?.[id];
    if (trail && Number.isInteger(trail.step) && Array.isArray(trail.actions))
      out.trails[id] = { step: trail.step, actions: trail.actions.slice(-MAX_ACTIONS).map(cleanAction).filter(Boolean) };
  }
  out.last = typeof raw.last === "string" && out.sessions[raw.last] ? raw.last : null;
  out.support = ["frames", "starter", "free"].includes(raw.support) ? raw.support : "frames";
  out.streak = Number.isInteger(raw.streak) && raw.streak >= 0 && raw.streak <= 99 ? raw.streak : 0;
  return out;
}

const read = (profile) => {
  try {
    const raw = localStorage.getItem(profileKey(KEY, profile));
    return raw == null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
};

export const loadLab = (profile = activeProfile()) => cleanLab(read(profile));

export function writeLab(lab, profile = activeProfile()) {
  try {
    localStorage.setItem(profileKey(KEY, profile), JSON.stringify(lab));
    return true;
  } catch {
    return false;
  }
}

// A transfer result also lands in the Studio's per-skill record, so its scaffolding fades and returns with this evidence.
export function recordSkillEvidence(skillKey, { ok, supported, tag }) {
  if (!skillKey) return;
  try {
    record(skillKey, { kind: "try", ok, supported, tag });
  } catch {
    /* the Studio record is a courtesy; a blocked store never blocks learning */
  }
}

// Next explanation support: two good explanations in a row at one level step the support down one notch.
const LEVELS = ["frames", "starter", "free"];
export function nextSupport(lab, explainedOk) {
  const streak = explainedOk ? lab.streak + 1 : 0;
  const at = LEVELS.indexOf(lab.support);
  if (streak >= 2 && at < LEVELS.length - 1) return { support: LEVELS[at + 1], streak: 0 };
  if (!explainedOk && at > 0 && lab.streak === 0) return { support: lab.support, streak };
  return { support: lab.support, streak };
}
