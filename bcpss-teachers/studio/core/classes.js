// Class profiles. A class is a nickname plus broad language-proficiency counts. No student names, no rosters, ever.
import { DOMAINS, GRADES, KLUS, SUBJECT_IDS, TIER_IDS } from "../data/taxonomy.js";
import { read, remove, write } from "./store.js";

const KEY = "classes";
const MAX_COUNT = 1000;
export const DOMAIN_TIER_CHOICES = ["mixed", ...TIER_IDS];

const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(n, MAX_COUNT) : 0;
};

export function newId() {
  const bytes = new Uint8Array(6);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return `c-${[...bytes].map((b) => b.toString(36).padStart(2, "0")).join("")}`;
}

export const blankProfile = () => ({
  id: "",
  nickname: "",
  grade: "",
  subject: "",
  curriculum: "",
  unit: "",
  proficiencyMode: "count",
  proficiency: { ee: 0, dev: 0, exp: 0, br: 0 },
  domainPriorities: [],
  domainTiers: Object.fromEntries(DOMAINS.map((d) => [d, "mixed"])),
  klus: [],
  goals: "",
  created: "",
  updated: "",
});

/** Coerce arbitrary input to a clean profile (never throws). */
export function normalize(raw = {}) {
  const base = blankProfile();
  const grade = String(raw.grade ?? "").toUpperCase();
  const tiers = raw.domainTiers || {};
  return {
    id: text(raw.id, 40),
    nickname: text(raw.nickname, 40),
    grade: GRADES.includes(grade) ? grade : "",
    subject: SUBJECT_IDS.includes(raw.subject) ? raw.subject : "",
    curriculum: text(raw.curriculum, 120),
    unit: text(raw.unit, 120),
    proficiencyMode: raw.proficiencyMode === "percent" ? "percent" : "count",
    proficiency: Object.fromEntries(TIER_IDS.map((t) => [t, num(raw.proficiency?.[t])])),
    domainPriorities: DOMAINS.filter((d) => (raw.domainPriorities || []).includes(d)),
    domainTiers: Object.fromEntries(
      DOMAINS.map((d) => [d, DOMAIN_TIER_CHOICES.includes(tiers[d]) ? tiers[d] : base.domainTiers[d]]),
    ),
    klus: KLUS.filter((k) => (raw.klus || []).includes(k)),
    goals: text(raw.goals, 600),
    created: text(raw.created, 40),
    updated: text(raw.updated, 40),
  };
}

/** Field-level problems keyed by field name. Empty object means valid. */
export function validate(profile) {
  const errors = {};
  if (!profile.nickname) errors.nickname = "Give the class a nickname, such as \"Period 3\" or \"Room 214\".";
  if (!profile.grade) errors.grade = "Choose a grade.";
  if (!profile.subject) errors.subject = "Choose a subject.";
  const total = TIER_IDS.reduce((n, t) => n + profile.proficiency[t], 0);
  if (profile.proficiencyMode === "percent" && total > 100) {
    errors.proficiency = "Percentages add up to more than 100. Lower one of them.";
  }
  return errors;
}

export const listClasses = () => (read(KEY, []) || []).map(normalize).filter((c) => c.id);
export const getClass = (id) => listClasses().find((c) => c.id === id) || null;

/** Create or update. Returns { ok, errors, cls }. */
export function saveClass(raw) {
  const profile = normalize(raw);
  const errors = validate(profile);
  if (Object.keys(errors).length) return { ok: false, errors, cls: profile };
  const all = listClasses();
  const now = new Date().toISOString();
  const existing = all.find((c) => c.id === profile.id);
  const cls = existing
    ? { ...profile, created: existing.created, updated: now }
    : { ...profile, id: profile.id || newId(), created: now, updated: now };
  write(KEY, existing ? all.map((c) => (c.id === cls.id ? cls : c)) : [...all, cls]);
  return { ok: true, errors: {}, cls };
}

/** Removing a class also removes the anonymous evidence pasted for it, unless asked to keep it. */
export function deleteClass(id, { keepEvidence = false } = {}) {
  write(KEY, listClasses().filter((c) => c.id !== id));
  if (!keepEvidence) remove(`classev.${id}`);
}

export function duplicateClass(id) {
  const src = getClass(id);
  if (!src) return null;
  return saveClass({ ...src, id: "", nickname: `${src.nickname} (copy)`.slice(0, 40) }).cls;
}

/** Whole-number percentages per tier (largest remainder, sums to 100) or null when no counts were entered. */
export function tierShares(cls) {
  const total = TIER_IDS.reduce((n, t) => n + cls.proficiency[t], 0);
  if (!total) return null;
  const raw = TIER_IDS.map((t) => (cls.proficiency[t] / total) * 100);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) {
    if (left-- <= 0) break;
    out[i] += 1;
  }
  return Object.fromEntries(TIER_IDS.map((t, i) => [t, out[i]]));
}

export function dominantTier(cls) {
  const shares = tierShares(cls);
  if (!shares) return null;
  return TIER_IDS.reduce((best, t) => (shares[t] > shares[best] ? t : best), TIER_IDS[0]);
}
