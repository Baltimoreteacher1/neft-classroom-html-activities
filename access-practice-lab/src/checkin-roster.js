// Teacher-side record of Passport check-ins, kept in the teacher's own browser (never uploaded).
// A student is "alias + grade band"; two children who send the same nickname merge, which only ever
// makes the teacher look twice. Stops finished never go backwards: an older check-in cannot undo a newer one.
import { routeKey } from "./checkin.js";

export const ROSTER_KEY = "accessTeacher:v1:passportCheckins";
export const emptyRoster = () => ({ v: 1, students: {} });
const studentId = (alias, band) => `${band}|${alias.toLowerCase()}`;

/** Read stored data defensively: anything unexpected is dropped, never thrown. */
export function sanitizeRoster(raw) {
  const roster = emptyRoster();
  if (!raw || typeof raw !== "object" || raw.v !== 1 || typeof raw.students !== "object") return roster;
  for (const s of Object.values(raw.students).slice(0, 500)) {
    if (!s || typeof s.alias !== "string" || !["3-5", "6-8"].includes(s.band) || typeof s.routes !== "object") continue;
    const routes = {};
    for (const [key, r] of Object.entries(s.routes)) {
      if (!/^(Listening|Reading|Speaking|Writing):[ABC]$/.test(key) || !Array.isArray(r?.stops) || r.stops.length > 12) continue;
      routes[key] = { stops: r.stops.map(Boolean), stamped: Math.min(Math.max(Number.isInteger(r.stamped) ? r.stamped : 0, 0), 12) };
    }
    roster.students[studentId(s.alias, s.band)] = { alias: s.alias.slice(0, 40), band: s.band, date: /^\d{4}-\d{2}-\d{2}$/.test(s.date) ? s.date : "", routes };
  }
  return roster;
}

const doneCount = (r) => r.stops.filter(Boolean).length;

/** @param {ReturnType<typeof emptyRoster>} roster @param {ReturnType<import("./checkin.js").decodeCheckin>} checkin */
export function addCheckin(roster, checkin) {
  const id = studentId(checkin.alias, checkin.band);
  const before = roster.students[id];
  const routes = { ...(before?.routes || {}) };
  let added = 0;
  for (const r of checkin.routes) {
    const key = routeKey(r.domain, r.level);
    const old = routes[key];
    const len = Math.max(old?.stops.length || 0, r.stops.length);
    const stops = Array.from({ length: len }, (_, i) => Boolean(old?.stops[i]) || Boolean(r.stops[i]));
    added += stops.filter(Boolean).length - (old ? doneCount(old) : 0);
    routes[key] = { stops, stamped: old?.stamped || 0 };
  }
  const date = before?.date > checkin.date ? before.date : checkin.date;
  return { roster: { ...roster, students: { ...roster.students, [id]: { alias: checkin.alias, band: checkin.band, date, routes } } }, added, id };
}

/** Routes with stops finished beyond what the teacher has stamped: [{ key, done, total, fresh }]. */
export const needsStamp = (student) =>
  Object.entries(student.routes)
    .map(([key, r]) => ({ key, done: doneCount(r), total: r.stops.length, fresh: doneCount(r) - r.stamped }))
    .filter((r) => r.fresh > 0);

export const markStamped = (roster, id) => {
  const s = roster.students[id];
  if (!s) return roster;
  const routes = Object.fromEntries(Object.entries(s.routes).map(([k, r]) => [k, { ...r, stamped: doneCount(r) }]));
  return { ...roster, students: { ...roster.students, [id]: { ...s, routes } } };
};
export const removeStudent = (roster, id) => {
  const { [id]: _gone, ...students } = roster.students;
  return { ...roster, students };
};
export const waiting = (roster) => Object.entries(roster.students).filter(([, s]) => needsStamp(s).length);
