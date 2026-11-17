// Storage for the Predictive Intelligence workspace. Real mode READS the Teacher Hub's existing stores (the
// roster and the typed official results) and writes official results back to that same store only through a
// confirmed CSV import. The workspace's own settings (targets, finding decisions, learning plans, forecast
// snapshots) live in a separate key per mode, so synthetic demonstration state can never mix with real data.

export const KEYS = Object.freeze({
  roster: "accessTeacher:v1:roster", // owned by /access-teacher/evidence.js
  official: "accessTeacher:v1:officialResults", // owned by /access-teacher/evidence.js
  imports: "accessTeacher:v1:predictive:imports",
  interim: "accessTeacher:v1:predictive:interim", // MODEL results, several per year, owned by this studio
  audit: "accessTeacher:v1:predictive:audit",
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
export function studentsFromStores(roster = [], official = {}, interim = {}) {
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
      interim: Array.isArray(interim[id]) ? interim[id] : [],
      entries: Array.isArray(s.ledger?.entries) ? s.ledger.entries : [],
      records: s.records || {},
      onRoster: true,
    });
  }
  const extra = new Set(
    [...Object.keys(official || {}), ...Object.keys(interim || {})].filter((id) => !seen.has(id)),
  );
  for (const id of extra) {
    const list = Array.isArray(official?.[id]) ? official[id] : [];
    const more = Array.isArray(interim?.[id]) ? interim[id] : [];
    if (!list.length && !more.length) continue;
    out.push({
      id,
      name: id.startsWith(IMPORT_PREFIX) ? id.slice(IMPORT_PREFIX.length) : id,
      section: "Imported history",
      official: list,
      interim: more,
      entries: [],
      records: {},
      onRoster: false,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export const loadRealStudents = () =>
  studentsFromStores(read(KEYS.roster, []), read(KEYS.official, {}), read(KEYS.interim, {}));

/** Both score stores, for the record writers in records.js. */
export const loadStores = () => ({ official: read(KEYS.official, {}), interim: read(KEYS.interim, {}) });
export const saveStores = (stores) =>
  write(KEYS.official, stores.official) && write(KEYS.interim, stores.interim);

/**
 * Local audit log of imports, edits, deletions and exports: what happened, when and how many records, never
 * score values or names. Capped at 500 events.
 */
export function audit(action, detail = {}) {
  const log = read(KEYS.audit, []);
  log.push({ at: new Date().toISOString(), action, ...detail });
  write(KEYS.audit, log.slice(-500));
}

const EMPTY_STATE = () => ({
  targets: {},
  findings: {},
  plans: {},
  snapshots: {},
  scenarios: null,
  goals: {},
  groups: {},
  notes: {},
});

/** Workspace state for a mode ("real" | "demo"); never shared between the two. */
export function loadState(mode) {
  return { ...EMPTY_STATE(), ...read(mode === "demo" ? KEYS.demo : KEYS.real, {}) };
}
export const saveState = (mode, state) => write(mode === "demo" ? KEYS.demo : KEYS.real, state);
