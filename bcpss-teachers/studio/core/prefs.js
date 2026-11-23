// Teacher preferences: grade, subject, projector. Nothing is preselected; every value is a teacher's own choice.
import { GRADES, SUBJECT_IDS, bandOf } from "../data/taxonomy.js";
import { read, write } from "./store.js";

const listeners = new Set();
const LANGS = ["en", "es"];

function sanitize(raw = {}) {
  const grade = String(raw.grade ?? "").toUpperCase();
  const scale = Number(raw.scale);
  return {
    grade: GRADES.includes(grade) ? grade : null,
    band: GRADES.includes(grade) ? bandOf(grade) : null,
    subject: SUBJECT_IDS.includes(raw.subject) ? raw.subject : null,
    role: typeof raw.role === "string" && raw.role ? raw.role.slice(0, 30) : null,
    lang: LANGS.includes(raw.lang) ? raw.lang : "en",
    projector: raw.projector === true,
    scale: Number.isFinite(scale) ? Math.min(1.6, Math.max(1, scale)) : 1,
  };
}

export const getPrefs = () => sanitize(read("prefs", {}) || {});

export function setPrefs(patch = {}) {
  const next = sanitize({ ...getPrefs(), ...patch });
  write("prefs", next);
  for (const fn of listeners) fn(next);
  return next;
}

/** True once the teacher has chosen a grade or a subject. */
export const hasContext = () => {
  const p = getPrefs();
  return Boolean(p.grade || p.subject);
};

export const clearContext = () => setPrefs({ grade: null, subject: null });

export function onPrefs(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const tourDone = () => read("tour", false) === true;
export const setTourDone = () => write("tour", true);

export const get = getPrefs;
export const set = setPrefs;
