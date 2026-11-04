/**
 * Revision checkpoints: named snapshots of a design with the student's reason for it.
 * Stored in the Studio save object under the additive field `checkpoints` (the save version stays 1;
 * older code ignores unknown fields). Pure; no DOM.
 */
import { fieldsFor, model } from "./math.mjs";

export const MAX_CHECKPOINTS = 12;
const text = (v, n) => (typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").slice(0, n) : "");

function cleanDesign(project, input) {
  const design = {};
  for (const f of fieldsFor(project)) {
    const value = input?.[f.key];
    if (!["string", "number"].includes(typeof value)) return null;
    design[f.key] = String(value).slice(0, 200);
  }
  return model(project, design).errors.length ? null : design;
}

/** Validate a stored list. Anything malformed is dropped; nothing here throws. */
export function cleanCheckpoints(project, raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const item of raw.slice(0, MAX_CHECKPOINTS)) {
    const design = cleanDesign(project, item?.design);
    const id = text(item?.id, 20);
    if (!design || !/^cp-\d+$/.test(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      name: text(item.name, 40).trim() || id,
      reason: text(item.reason, 500),
      matched: Number.isInteger(item.matched) && item.matched >= 0 && item.matched <= 6 ? item.matched : 0,
      design,
    });
  }
  return out;
}

export function addCheckpoint(project, list, { name, reason, design, matched }) {
  const clean = cleanDesign(project, design);
  if (!clean) return { error: "Fix the design inputs before saving a checkpoint." };
  if (list.length >= MAX_CHECKPOINTS)
    return { error: `You have ${MAX_CHECKPOINTS} checkpoints. Remove one to save another.` };
  const next = list.reduce((top, cp) => Math.max(top, Number(cp.id.slice(3))), 0) + 1;
  const id = `cp-${next}`;
  const entry = {
    id,
    name: text(name, 40).trim() || `Checkpoint ${next}`,
    reason: text(reason, 500),
    matched: Math.max(0, Math.min(6, matched | 0)),
    design: clean,
  };
  return { list: [...list, entry], entry };
}

export const removeCheckpoint = (list, id) => list.filter((cp) => cp.id !== id);

/** The design a restore would apply, or null if the checkpoint is gone. */
export const restoreDesign = (list, id) => {
  const cp = list.find((item) => item.id === id);
  return cp ? { ...cp.design } : null;
};

/** Fields whose value differs between two designs, for the "what changed" line. */
export function changedFields(project, from, to) {
  return fieldsFor(project).filter((f) => String(from[f.key]).trim() !== String(to[f.key]).trim());
}

/** Sentence frames for "explain your choice". English and Spanish; the mission's own discourse frames come first. */
export function reasonFrames(project, lang) {
  const es = lang === "es";
  const own = project.discourse?.[es ? 1 : 0];
  const generic = es
    ? [
        "Cambié ___ de ___ a ___ porque ___.",
        "Este punto de control es mejor porque ___ cambió de ___ a ___ y el resultado ___.",
        "Mantengo ___ igual porque ___.",
      ]
    : [
        "I changed ___ from ___ to ___ because ___.",
        "This checkpoint is better because ___ changed from ___ to ___ and the result ___.",
        "I am keeping ___ the same because ___.",
      ];
  return own ? [own, ...generic] : generic;
}
