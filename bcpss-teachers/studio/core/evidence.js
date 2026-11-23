// Anonymous, device-local learning evidence. Moves between devices only as a pasted "evidence code" (no names, no ids).
import { read, update, write } from "./store.js";

const MAX_ATTEMPTS = 40;

export function recordAttempt(att) {
  const rec = { v: 1, t: new Date().toISOString(), ...att };
  update(`ev.${att.aid}`, (list) => [...(list || []), rec].slice(-MAX_ATTEMPTS), []);
  return rec;
}
export const attemptsFor = (aid) => read(`ev.${aid}`, []);

const b64 = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));

/** Strip anything that could identify a student before an attempt is shared. */
export function scrub(att) {
  const { aid, eng, lesson, t, tier, items = [], reflection } = att;
  return {
    v: 1,
    aid,
    eng,
    lesson,
    t,
    tier,
    items: items.map((i) => ({ id: i.id, tries: i.tries, hints: i.hints, ok: i.ok, tags: i.tags || [] })),
    reflection: typeof reflection === "string" ? reflection.slice(0, 600) : undefined,
  };
}

export const encodeCode = (att) => `LPE1.${b64(JSON.stringify(scrub(att)))}`;

export function decodeCode(code) {
  const m = /^LPE1\.([A-Za-z0-9_-]+)$/.exec(String(code || "").trim());
  if (!m) throw new Error("That is not an evidence code.");
  const obj = JSON.parse(unb64(m[1]));
  if (obj?.v !== 1 || !obj.aid || !Array.isArray(obj.items)) throw new Error("That evidence code is damaged.");
  return obj;
}

/** Class evidence bucket: pasted codes for one class. */
export function addClassEvidence(classId, code) {
  const att = decodeCode(code);
  update(`classev.${classId}`, (list) => [...(list || []), att].slice(-400), []);
  return att;
}
export const classEvidence = (classId) => read(`classev.${classId}`, []);
export const clearClassEvidence = (classId) => write(`classev.${classId}`, []);
