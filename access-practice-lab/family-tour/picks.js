// Real activities from the lab, read from picks.json (generated from access-practice-lab/content by
// tools/build-family-tour-picks.mjs). The tour only ever shows, recommends and links activities in this file.
const BASE = "/access-practice-lab";
let cache = null;

export async function loadPicks() {
  if (cache) return cache;
  const res = await fetch(`${BASE}/family-tour/picks.json`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`picks ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.picks) || !data.picks.length) throw new Error("picks empty");
  cache = data.picks;
  return cache;
}

export const byId = (picks, id) => picks.find((p) => p.id === id) || null;

/** The student-facing address of an activity: the same page a student opens in the lab. */
export const activityPath = (p) => `${BASE}/${p.domain}/${p.level}/${p.id}?grades=${p.band}`;
export const activityUrl = (p, origin = location.origin) => `${origin}${activityPath(p)}`;
export const labUrl = (origin = location.origin) => `${origin}${BASE}/`;
export const domainUrl = (domain, band, origin = location.origin) => `${origin}${BASE}/${domain}?grades=${band}`;

/** The activity each demonstration uses: a short, picture-first task at the lowest support level. */
const DEMOS = {
  "3-5": { speaking: "g35-s-a-playground", writing: "g35-w-a-park-scene" },
  "6-8": { speaking: "v3-s-a-1", writing: "v10-w-a-caption" },
};
export const demoPick = (picks, domain, band) => byId(picks, DEMOS[band || "3-5"][domain]) || picks.find((p) => p.domain === (domain === "speaking" ? "Speaking" : "Writing"));

export const domainName = (focus) => (focus === "speaking" ? "Speaking" : "Writing");

const gap = (p, minutes) => (p.minutes <= minutes + 1 ? minutes - p.minutes : 30 + (p.minutes - minutes));

/**
 * Up to three activities for a grade band, focus and time. One per support level where possible
 * (A more help, B some help, C less help), the closest fit to the minutes first; "both" mixes speaking and writing.
 */
export function recommend(picks, { band, focus, minutes }) {
  const domains = focus === "both" ? ["Speaking", "Writing"] : [domainName(focus)];
  const pool = picks.filter((p) => p.band === band && domains.includes(p.domain));
  const ranked = (list) => [...list].sort((a, b) => gap(a, minutes) - gap(b, minutes) || Number(Boolean(b.picture)) - Number(Boolean(a.picture)) || a.id.localeCompare(b.id));
  const out = [];
  const take = (p) => p && !out.includes(p) && out.push(p);
  if (focus === "both") {
    const s = ranked(pool.filter((p) => p.domain === "Speaking"));
    const w = ranked(pool.filter((p) => p.domain === "Writing"));
    take(s[0]);
    take(w[0]);
    take(s.find((p) => p.level !== s[0]?.level) || s[1]);
    return out.slice(0, 3);
  }
  const all = ranked(pool);
  for (const level of ["A", "B", "C"]) take(all.find((p) => p.level === level && p.minutes <= minutes + 3));
  for (const p of all) if (out.length < 3) take(p);
  return out.slice(0, 3).sort((a, b) => a.level.localeCompare(b.level) || a.minutes - b.minutes);
}
