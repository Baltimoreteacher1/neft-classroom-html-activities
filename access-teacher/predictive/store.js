// Storage for the Predictive Intelligence workspace. Real mode READS the Teacher Hub's existing stores (the
// roster and the typed official results) and writes official results back to that same store only through a
// confirmed CSV import. The workspace's own settings (targets, finding decisions, learning plans, forecast
// snapshots) live in a separate key per mode, so synthetic demonstration state can never mix with real data.

export const KEYS = Object.freeze({
  roster: "accessTeacher:v1:roster", // owned by /access-teacher/evidence.js
  official: "accessTeacher:v1:officialResults", // owned by /access-teacher/evidence.js
  imports: "accessTeacher:v1:predictive:imports",
  mode: "accessTeacher:v1:predictive:mode",
  real: "accessTeacher:v1:predictive:real",
  demo: "accessTeacher:v1:predictive:demo",
});

export function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Same id rule the Teacher Hub uses for older roster rows without one. */
export const rosterId = (s) => s.id || `${s.section || "Unsorted"}|${s.alias}|${s.band}`;

/** Prefix for official results imported for a student who is not on the roster. */
export const IMPORT_PREFIX = "import|";

/**
 * Workspace students from the hub's roster and official-results map. Students with official results but no
 * roster row (imported history) are included and named from their import id.
 */
export function studentsFromStores(roster = [], official = {}) {
  const out = [];
  const seen = new Set();
  for (const s of Array.isArray(roster) ? roster : []) {
    if (!s || !s.alias) continue;
    const id = rosterId(s);
    seen.add(id);
    out.push({
      id,
      name: String(s.alias),
      section: s.section || "Unsorted",
      official: Array.isArray(official[id]) ? official[id] : [],
      entries: Array.isArray(s.ledger?.entries) ? s.ledger.entries : [],
      records: s.records || {},
      onRoster: true,
    });
  }
  for (const [id, list] of Object.entries(official || {})) {
    if (seen.has(id) || !Array.isArray(list) || !list.length) continue;
    out.push({
      id,
      name: id.startsWith(IMPORT_PREFIX) ? id.slice(IMPORT_PREFIX.length) : id,
      section: "Imported history",
      official: list,
      entries: [],
      records: {},
      onRoster: false,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export const loadRealStudents = () =>
  studentsFromStores(read(KEYS.roster, []), read(KEYS.official, {}));

const EMPTY_STATE = () => ({
  targets: {},
  findings: {},
  plans: {},
  snapshots: {},
  scenarios: null,
});

/** Workspace state for a mode ("real" | "demo"); never shared between the two. */
export function loadState(mode) {
  return { ...EMPTY_STATE(), ...read(mode === "demo" ? KEYS.demo : KEYS.real, {}) };
}
export const saveState = (mode, state) => write(mode === "demo" ? KEYS.demo : KEYS.real, state);
