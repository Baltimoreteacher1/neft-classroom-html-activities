// The Teacher Hub's roster of imported Passport share codes (kept in this browser only; nothing is uploaded).
// One reader for every panel that needs it: the class evidence tabs and the class intelligence panel.
export const ROSTER_KEY = "accessTeacher:v1:roster";

/** Older rosters had no section or id; give them both so nothing is lost. */
export const upgradeStudent = (s) => ({
  ...s,
  section: s.section || "Unsorted",
  id: s.id || `${s.section || "Unsorted"}|${s.alias}|${s.band}`,
});

/** The saved students, or [] when storage is empty, blocked or corrupt. */
export function readRoster(storage = globalThis.localStorage) {
  try {
    const list = JSON.parse(storage.getItem(ROSTER_KEY) || "null");
    return Array.isArray(list) ? list.filter((s) => s && typeof s.alias === "string").map(upgradeStudent) : [];
  } catch {
    return [];
  }
}
