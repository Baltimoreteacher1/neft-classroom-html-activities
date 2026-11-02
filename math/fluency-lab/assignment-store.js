// The teacher's list of assignments made on this device: create, edit, duplicate, retire. Stored locally only;
// a link or class code is the whole assignment, so nothing here is shared or needs a server.
import { readLocal, validateAssignment, writeLocal } from "./school-tools.js";

const KEY = "ewl-fluency-teacher-assignments-v1";
export const MAX_ASSIGNMENTS = 60;

export function cleanAssignmentList(value) {
  const list = Array.isArray(value) ? value : [];
  const seen = new Set();
  const out = [];
  for (const entry of list) {
    const assignment = validateAssignment(entry?.assignment);
    const id = String(entry?.id || "")
      .replace(/[^\w-]/g, "")
      .slice(0, 24);
    if (!assignment || !id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      assignment,
      createdAt: Number(entry.createdAt) || 0,
      updatedAt: Number(entry.updatedAt) || 0,
      retired: entry.retired === true,
    });
  }
  return out.slice(0, MAX_ASSIGNMENTS);
}

const newId = (list, now) => {
  let id = `a${now.toString(36)}`;
  for (let n = 1; list.some((entry) => entry.id === id); n += 1) id = `a${now.toString(36)}${n}`;
  return id;
};

// Each helper returns a new list; none mutates its input.
export function addAssignment(list, assignment, now = Date.now()) {
  const clean = validateAssignment(assignment);
  if (!clean) throw new Error("Choose at least one skill.");
  const entry = {
    id: newId(list, now),
    assignment: clean,
    createdAt: now,
    updatedAt: now,
    retired: false,
  };
  return cleanAssignmentList([entry, ...list]);
}

export function updateAssignment(list, id, assignment, now = Date.now()) {
  const clean = validateAssignment(assignment);
  if (!clean) throw new Error("Choose at least one skill.");
  if (!list.some((entry) => entry.id === id))
    throw new Error("That assignment is no longer in the list.");
  return list.map((entry) =>
    entry.id === id ? { ...entry, assignment: clean, updatedAt: now } : entry,
  );
}

export function duplicateAssignment(list, id, now = Date.now()) {
  const source = list.find((entry) => entry.id === id);
  if (!source) return list;
  const copy = { ...source.assignment, label: `${source.assignment.label} (copy)`.slice(0, 80) };
  return addAssignment(list, copy, now);
}

export const setRetired = (list, id, retired, now = Date.now()) =>
  list.map((entry) =>
    entry.id === id ? { ...entry, retired: Boolean(retired), updatedAt: now } : entry,
  );
export const removeAssignment = (list, id) => list.filter((entry) => entry.id !== id);

export const loadAssignments = () => cleanAssignmentList(readLocal(KEY, []));
export const saveAssignments = (list) => writeLocal(KEY, cleanAssignmentList(list));
