// Class link: the opt-in bridge from one learner profile on this device to a class on the class platform
// (/api/class, docs/class-platform.md). Nothing here runs until a learner joins a class; without it the Lab stays
// device-only exactly as before. Progress travels as the Lab's own JSON backup (makeBackup + exportPlay), so a
// cloud copy is restored through the same cleaners as a downloaded backup file and nothing new can be smuggled in.
//
// Pure helpers (summary, merge decision) are exported for tests; the network calls take `fetchImpl` so tests can
// drive them without a server.
import {
  classInfo,
  cleanLink,
  createSync as createClassSync,
  joinClass,
  mergeDecision,
  studentApi,
} from "../../shared/class-platform/client.js";
import { profileKey } from "./family/fm2/profile-key.js";
import { localDay } from "./tutor-engine.js";
import { masteryState } from "./mastery-model.js";
import { profiles, readLocal, writeLocal } from "./school-tools.js";

export const LINK_KEY = "ewl-fluency-class-v1";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const keyFor = (profile) =>
  profileKey(LINK_KEY, Number.isInteger(profile) ? profile : profiles().active);

export const loadLink = (profile) => cleanLink(readLocal(keyFor(profile), null));
export const saveLink = (link, profile) =>
  writeLocal(keyFor(profile), link ? cleanLink(link) : null);

/** What the teacher dashboard, goal meter and family digest see: counts and skill ids, never the work itself. */
export function fluencySummary({
  tutor,
  grade,
  interventions,
  activeSkill = null,
  now = Date.now(),
}) {
  const records = tutor?.records || {};
  const mastered = [];
  let independentCorrect = 0;
  let weekIndependent = 0;
  const days = new Set();
  let lastActivity = 0;
  for (const [key, record] of Object.entries(records)) {
    if (!/^\d:[a-z0-9-]{1,40}$/.test(key)) continue;
    if (masteryState(record, now) === "mastered") mastered.push(key);
    for (const entry of record?.recent || []) {
      if (!Number.isFinite(entry?.at)) continue;
      lastActivity = Math.max(lastActivity, entry.at);
      if (entry.independent && entry.correct) {
        independentCorrect += 1;
        if (now - entry.at <= WEEK_MS) weekIndependent += 1;
      }
      if (now - entry.at <= WEEK_MS) days.add(localDay(entry.at));
    }
  }
  const needsTeacher = Object.values(interventions?.states || {})
    .filter((s) => s?.stage === "needs-teacher" && /^\d:[a-z0-9-]{1,40}$/.test(s.key))
    .slice(0, 10)
    .map((s) => ({
      skill: s.key,
      ...(/^[a-z0-9-]{1,40}$/.test(s.handoff?.reason || "") ? { why: s.handoff.reason } : {}),
    }));
  return {
    grade: Number.isInteger(grade) && grade >= 0 && grade <= 8 ? grade : 0,
    ...(activeSkill && /^\d:[a-z0-9-]{1,40}$/.test(activeSkill) ? { activeSkill } : {}),
    needsTeacher,
    mastered: mastered.slice(0, 200),
    practiced: Math.min(200, Object.keys(records).length),
    independentCorrect: Math.min(1_000_000, independentCorrect),
    weekIndependent: Math.min(100_000, weekIndependent),
    weekDays: Math.min(7, days.size),
    ...(lastActivity ? { lastActivity: Math.floor(lastActivity) } : {}),
  };
}

export { classInfo, cleanLink, joinClass, mergeDecision };

// The network calls are the shared client's (shared/class-platform/client.js); this file only binds them to the
// Fluency document and to this device's per-profile link.
const api = studentApi("fluency");
export const pullProgress = api.pull;
export const pushProgress = api.push;
export const whoAmI = api.whoAmI;
export const activeRooms = api.activeRooms;
export const roomState = api.roomState;
export const roomRespond = api.roomRespond;
export const roomWorkspace = api.roomWorkspace;

/** The family digest link for this learner (read-only token from the server). */
export function digestUrl(origin, link, familyToken, lang = "en") {
  const url = new URL("/math/fluency-lab/class/family.html", origin);
  url.searchParams.set("code", link.code);
  url.searchParams.set("student", link.studentId);
  url.searchParams.set("token", familyToken);
  if (lang === "es") url.searchParams.set("lang", "es");
  return url.toString();
}

/**
 * The sync loop for this profile's link. `getBackup()` returns the Lab's backup object; `getSummary()` the summary;
 * `onRemoteNewer(remote, decision)` is called when the class copy should be restored ("restore") or offered ("ask").
 */
export const createSync = (options) =>
  createClassSync({ doc: "fluency", loadLink, saveLink, ...options });
