// Versioned, sanitised local record for Enterprise 8 evidence (Enterprise 8). It lives beside the tutor record, per learner,
// travels in the JSON backup, and is cleaned on import: unknown fields are dropped, numbers are clamped, and a backup made
// before this layer existed simply yields an empty record. Nothing here is sent anywhere.
import { emptyEvidence, sanitizeEvidence } from "./misconception-engine.js";

export const E8_KEY = "ewl-fluency-e8-v1";
export const E8_VERSION = 1;
const KEY_RE = /^\d:[\w-]{1,30}$/;
const COUNTERS = ["predictedCorrect", "built", "explained", "transfer", "reasoning", "solverIndependent", "solverSupported"];
const n = (v, max = 999) => (Number.isFinite(v) && v > 0 ? Math.min(Math.floor(v), max) : 0);

export const emptyE8 = () => ({ version: E8_VERSION, misconceptions: emptyEvidence(), skills: {}, placement: {}, repairs: [] });

export function sanitizeE8(value) {
  const out = emptyE8();
  if (!value || typeof value !== "object") return out;
  out.misconceptions = sanitizeEvidence(value.misconceptions);
  for (const [key, e] of Object.entries(value.skills || {})) {
    if (!KEY_RE.test(key) || !e || typeof e !== "object") continue;
    const clean = {};
    for (const c of COUNTERS) clean[c] = n(e[c]);
    if (COUNTERS.some((c) => clean[c])) out.skills[key] = clean;
  }
  for (const [grade, p] of Object.entries(value.placement || {})) {
    if (!/^[0-8]$/.test(grade) || !p || typeof p !== "object") continue;
    const keys = (list) => (Array.isArray(list) ? list.filter((k) => KEY_RE.test(k)).slice(0, 40) : []);
    out.placement[grade] = { at: Number.isFinite(p.at) ? p.at : 0, known: keys(p.known), gaps: keys(p.gaps), path: keys(p.path), items: n(p.items, 40), unsure: n(p.unsure, 40), confidence: p.confidence === "moderate" ? "moderate" : "rough" };
  }
  out.repairs = (Array.isArray(value.repairs) ? value.repairs : [])
    .filter((r) => r && typeof r.id === "string" && r.id.length <= 60 && KEY_RE.test(r.skill || ""))
    .slice(-30)
    .map((r) => ({ id: r.id, skill: r.skill, at: Number.isFinite(r.at) ? r.at : 0, freshCorrect: r.freshCorrect === true, independent: r.independent === true, attempts: n(r.attempts, 9), resolved: r.resolved === true }));
  return out;
}

// Injectable storage so the same code runs in the browser and in tests.
export function createE8Store({ read, write }) {
  const load = () => sanitizeE8(read());
  return {
    load,
    save: (state) => write(sanitizeE8(state)),
    update(fn) { const next = load(); fn(next); write(sanitizeE8(next)); return next; },
  };
}

// Small helpers used by the lab screens.
export function addSkillEvent(state, key, counter, by = 1) {
  if (!KEY_RE.test(key) || !COUNTERS.includes(counter)) return state;
  state.skills[key] = state.skills[key] || Object.fromEntries(COUNTERS.map((c) => [c, 0]));
  state.skills[key][counter] = n(state.skills[key][counter] + by);
  return state;
}
export function saveRepair(state, repair) {
  state.repairs = [...state.repairs, repair].slice(-30);
  return state;
}
export function savePlacement(state, grade, result, now = Date.now()) {
  state.placement[String(grade)] = { at: now, known: result.known, gaps: result.gaps, path: result.path, items: result.items, unsure: result.unsure, confidence: result.confidence };
  return state;
}
