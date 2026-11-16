// Language Expeditions in the learner's share code (feature "teacher"). Only where the learner practiced travels:
// which lands were stamped, how many stops were finished, and counts of collected things. No answers, no writing,
// no recordings, never a score or a level. Pure functions: share.js (learner side) and the Teacher Hub reader use them.
import { sessionKey } from "./state.js";

export const EXPEDITION_ID = "language-expeditions";
export const LANDS = ["listening", "reading", "speaking", "writing"];
const finished = (r) =>
  r?.type === "speak" || r?.type === "write"
    ? Boolean(r.done)
    : ["right", "revealed"].includes(r?.rs?.status);
const int = (v, max) => (Number.isInteger(v) && v >= 0 ? Math.min(v, max) : 0);
/** Counts that another feature may keep in state (an array, a number or nothing): read defensively. */
const tally = (v) => (Array.isArray(v) ? v.length : Number.isInteger(v) && v >= 0 ? v : null);

/** The learner's latest expedition in this band, as shared. Null when there is none. */
export function expeditionSummary(games, band) {
  const session = games?.sessions?.[sessionKey(EXPEDITION_ID, band)];
  const s = session?.state;
  if (!s || !Array.isArray(s.lands) || !s.lands.length) return null;
  const got = Array.isArray(s.got) ? s.got.map(String) : [];
  const out = {
    at: String(session.updatedAt || session.startedAt || "").slice(0, 40),
    lands: s.lands.slice(0, 4).map((L, k) => {
      const acts = Array.isArray(L?.acts) ? L.acts : [];
      const row = {
        land: LANDS[k],
        stamp: Boolean(L?.stamp),
        stops: acts.filter(finished).length,
        of: acts.length,
        got: got.filter((id) => id.startsWith(`${k}-`)).length,
      };
      const gear = tally(L?.gear);
      if (gear != null) row.gear = gear;
      return row;
    }),
  };
  const gear = tally(s.gear);
  const words = tally(s.words);
  if (gear != null) out.gear = gear;
  if (words != null) out.words = words;
  return out;
}

/** Never trusts the input. Old codes have no field: null. */
export function cleanExpedition(o) {
  if (!o || typeof o !== "object" || !Array.isArray(o.lands)) return null;
  const lands = o.lands
    .slice(0, 4)
    .filter((r) => r && typeof r === "object" && LANDS.includes(r.land))
    .map((r) => ({
      land: r.land,
      stamp: r.stamp === true,
      stops: int(r.stops, 10),
      of: int(r.of, 10),
      got: int(r.got, 50),
      ...(Number.isInteger(r.gear) ? { gear: int(r.gear, 100) } : {}),
    }));
  if (!lands.length) return null;
  return {
    at: String(o.at || "").slice(0, 40),
    lands,
    ...(Number.isInteger(o.gear) ? { gear: int(o.gear, 500) } : {}),
    ...(Number.isInteger(o.words) ? { words: int(o.words, 500) } : {}),
  };
}
