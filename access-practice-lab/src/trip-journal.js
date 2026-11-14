// Trip journal: one entry per finished stop on the "My journey" trip, with what the learner did there and one
// line they write themselves ("I learned / Aprendí"). Pure: no DOM, no storage writes.
// The lines live in the lab's preferences record (`accessPracticeLab:v1:prefs`, field `tripJournal`), the same
// record the Passport progress code (ACCESS1) exports, so moving to a new device with that code carries them.
// Nothing here is a score: an entry exists because a stop was finished, and the line is the learner's own words.
import { COUNTRIES } from "./journey.js";

export const MAX_LINE = 140;
const MAX_ENTRIES = 400;
const KEY_RE =
  /^(?:K|1|2-3|3-5|6-8)\|(?:Listening|Speaking|Reading|Writing):[ABC]:(?:[1-9]|1[0-2])$/;

/** Storage key for one stop: band, route and 1-based stop number. */
export const journalKey = (band, domain, level, stop) => `${band}|${domain}:${level}:${stop}`;

/** Strip control characters and angle brackets, collapse spaces, cap the length. */
export const cleanLine = (v) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LINE);

/** The saved lines from preferences. Unknown keys, non-strings and empty lines are dropped; it never throws. */
export function getJournal(prefs) {
  const raw = prefs?.tripJournal;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw).slice(0, MAX_ENTRIES)) {
    if (!KEY_RE.test(key) || typeof value !== "string") continue;
    const line = cleanLine(value);
    if (line) out[key] = line;
  }
  return out;
}

/** The preferences patch that saves (or, for an empty line, removes) one stop's line. */
export function journalPatch(prefs, key, value) {
  const next = { ...getJournal(prefs) };
  if (!KEY_RE.test(key)) return { tripJournal: next };
  const line = cleanLine(value);
  if (line) next[key] = line;
  else delete next[key];
  return { tripJournal: next };
}

/**
 * One entry per finished stop, grouped by country in route order.
 * @param {string} band
 * @param {ReturnType<import("./journey.js").routeProgress>} routes
 * @param {Map<string, string>} titles activity id -> title
 * @param {Record<string, string>} journal saved lines (getJournal)
 */
export function journalEntries(band, routes, titles, journal = {}) {
  return routes
    .filter((r) => r.stopsDone > 0)
    .map((r) => ({
      domain: r.domain,
      level: r.level,
      country: COUNTRIES[r.domain][r.level],
      stops: r.stops.length,
      stopsDone: r.stopsDone,
      entries: r.stops.flatMap((on, i) => {
        if (!on) return [];
        const key = journalKey(band, r.domain, r.level, i + 1);
        return [
          {
            key,
            stop: i + 1,
            activities: r.stopIds[i].map((id) => titles.get(id) || id),
            line: journal[key] || "",
          },
        ];
      }),
    }));
}
