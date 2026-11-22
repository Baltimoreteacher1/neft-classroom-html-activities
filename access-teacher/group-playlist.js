// Group -> playlist (Teacher Hub, Groups tab). Each suggested group (lang/teacher.js groupSuggestions) gets a
// "Copy playlist link": up to five lab activities in the group's grade band that practice the group's need, in the
// playlist URL format of the Hub's playlist builder (teacher.js playUrl: /play?ids=…&t=…&grades=…).
// Rule-based and visible: the need picks a domain and a skill pattern; activities that match come first.
// Relative imports resolve to the same /access-practice-lab/ modules in the browser and under node:test.
import { bandRows } from "../access-practice-lab/src/content.js";
import { GUIDED_UNITS } from "../access-practice-lab/src/content/guided-units.js";
import { CONTENT_BANDS } from "../access-practice-lab/src/bands.js";
import { BASE } from "../access-practice-lab/src/util.js";

export { GUIDED_UNITS };

export const guidedUnitUrl = (unitId, band = "6-8") =>
  `${BASE}/guided-units/${encodeURIComponent(unitId)}?grades=${encodeURIComponent(band)}`;

/** What each kind of group needs: the domain to draw from and the skill words that match the need. */
export const GROUP_NEEDS = Object.freeze({
  pattern: {
    domains: ["Writing"],
    skill: /grammar|sentence|verb|edit|convention|punctuat|tense|agree/i,
  },
  fade: { domains: ["Writing"], skill: /write|sentence|paragraph|organiz|explain|opinion/i },
  trap: {
    domains: ["Reading", "Listening"],
    skill: /evidence|detail|main idea|infer|question|support/i,
  },
  evidence: { domains: ["Reading", "Writing"], skill: /evidence|claim|support|cite|opinion|argu/i },
});
export const PLAYLIST_MAX = 5;

/** Activity ids for one group kind from a band's activity rows: skill matches first, one per skill where possible. */
export function groupPlaylistIds(kind, rows, max = PLAYLIST_MAX) {
  const need = Object.hasOwn(GROUP_NEEDS, kind) ? GROUP_NEEDS[kind] : GROUP_NEEDS.fade;
  const pool = (Array.isArray(rows) ? rows : []).filter(
    (r) => r && need.domains.includes(r.domain) && r.id,
  );
  const matched = pool.filter((r) => need.skill.test(r.skill || ""));
  const ordered = [...matched, ...pool.filter((r) => !matched.includes(r))];
  const out = [];
  const skills = new Set();
  for (const r of ordered)
    if (out.length < max && !skills.has(r.skill)) (out.push(r.id), skills.add(r.skill));
  for (const r of ordered) if (out.length < max && !out.includes(r.id)) out.push(r.id);
  return out;
}

/** The playlist link, same shape as the Hub's playlist builder. */
export const groupPlaylistUrl = (ids, title, band) =>
  `${BASE}/play?ids=${ids.join(",")}${title ? `&t=${encodeURIComponent(title)}` : ""}&grades=${band}`;

/** The band most of the group's members are in (the Hub roster stores one per student), or 6-8. */
export function groupBand(members, students) {
  const tally = new Map();
  for (const m of members || []) {
    const band = (students || []).find((s) => s.alias === m)?.band;
    if (CONTENT_BANDS.includes(band)) tally.set(band, (tally.get(band) || 0) + 1);
  }
  return [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "6-8";
}

/** Click handler body for a [data-group-playlist] button. Returns the absolute URL that was copied, or null. */
export async function copyGroupPlaylist(
  button,
  { origin = location.origin, rowsFor = bandRows } = {},
) {
  const { groupPlaylist: kind, band, label } = button.dataset;
  const ids = groupPlaylistIds(kind, await rowsFor(band));
  if (!ids.length) return null;
  const url = new URL(groupPlaylistUrl(ids, label, band), origin).href;
  await navigator.clipboard.writeText(url);
  return url;
}
