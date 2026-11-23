// The lab's shareable URL contract: `?band=6-8&lang=en-es&support=guided`.
//
// The routes themselves (/games/:id, /worlds/:id, /road/:week) already exist in main.js's parseRoute; this
// file owns the three query parameters that make any of them a complete, bookmarkable starting point.
// Spellings accepted for older links stay valid: `grades=` is `band=`, `mode=A|B|C` is `support=`.
//
//   band     3-5 | 6-8                          (alias: grades)
//   lang     en | es | en-es  (also es, bi)     the chrome language, never the English being practiced
//   support  independent | guided | hands-on    (also A | B | C; alias: mode)
import {
  LANG_URL,
  TIERS,
  normalizeLabBand,
  normalizeLang,
  normalizeTier,
  supportOfTier,
} from "./meta.js";

/** Read the three parameters from a search string. Missing or unknown values come back as "". */
export function readLabQuery(search = "") {
  const q = new URLSearchParams(search);
  return {
    band: normalizeLabBand(q.get("band") || q.get("grades")),
    lang: normalizeLang(q.get("lang")),
    tier: normalizeTier(q.get("support") || q.get("mode")),
  };
}

/** The engine support key (A/B/C) a query asks for, or "". */
export const supportFromQuery = (search = "") => {
  const { tier } = readLabQuery(search);
  return tier ? supportOfTier(tier) : "";
};

/** Build a query string from known choices; empty choices are left out so links stay short. */
export function labQueryString({ band = "", lang = "", tier = "" } = {}) {
  const q = new URLSearchParams();
  const b = normalizeLabBand(band);
  const l = normalizeLang(lang);
  const t = normalizeTier(tier);
  if (b) q.set("band", b);
  if (l) q.set("lang", LANG_URL[l]);
  if (t) q.set("support", TIERS[t].id);
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** The canonical lab routes. One place spells them so the HUD, the Road, My Progress and the teacher deep links agree. */
export const labRoutes = Object.freeze({
  game: (id, choices) =>
    `/access-practice-lab/games/${encodeURIComponent(id)}${labQueryString(choices)}`,
  world: (id, choices) =>
    `/access-practice-lab/worlds/${encodeURIComponent(id)}${labQueryString(choices)}`,
  road: (week, choices) =>
    `/access-practice-lab/road/${Number(week) || 1}${labQueryString(choices)}`,
});
