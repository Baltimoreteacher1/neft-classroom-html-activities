// The Site Directory (appendix): every activity in content/index.json, by grade band, domain and support level, with a
// link to each one, plus the practice tests. Routes follow parseRoute in src/main.js:
//   /<Domain>/<Level>/<id>?grades=<band>             Listening, Reading, Speaking, Writing (levels A, B, C)
//   /Model-Test/<band>/<A|B>/<id>?grades=<band>       Model-Test levels are keyed "<band>-<A|B>"
//   /test/<id>?grades=<band>                           practice tests
// Pure: the caller passes the parsed index.json, so Node (the generator, the tests) and a page can share it.
import { CONTENT_BAND_ORDER, bandName } from "../grade-bands.js";
import { SITE, absUrl, shortUrl } from "./data.js";

export const DOMAIN_ORDER = ["Listening", "Reading", "Speaking", "Writing", "Model-Test"];
const DOMAIN_NAME = { "Model-Test": "Model test items" };

/** The lab route of one activity row, or throws when the shape is not one parseRoute knows. */
export function activityRoute(band, domain, levelKey, id) {
  const q = `?grades=${encodeURIComponent(band)}`;
  if (domain === "Model-Test") {
    const m = /^(.+)-([A-Z])$/.exec(levelKey);
    if (!m)
      throw new Error(`site-directory: Model-Test level ${levelKey} has no band-letter shape`);
    return `/Model-Test/${m[1]}/${m[2]}/${encodeURIComponent(id)}${q}`;
  }
  if (!/^[A-Z]$/.test(levelKey))
    throw new Error(`site-directory: ${domain} level ${levelKey} is not a letter`);
  return `/${domain}/${levelKey}/${encodeURIComponent(id)}${q}`;
}

/** The shape every directory link must have (the tests check every link against it). */
export const ROUTE_SHAPE =
  /^\/(?:(?:Listening|Reading|Speaking|Writing)\/[A-Z]|Model-Test\/[\w-]+\/[A-Z]|test)\/[\w%-]+\?grades=[\w-]+$/;

const levelName = (domain, key, tier) =>
  domain === "Model-Test"
    ? `Model test ${key.slice(-1)}`
    : `Level ${key}: ${tier?.name || "Support level"}`;

/** "Grades 3–5" plus how the site's grade picker reaches it when its label differs ("Grades 4–5"). */
function bandLabel(band, gradeBands) {
  const own = bandName(band)[0];
  const picks = (gradeBands || [])
    .filter((g) => g.contentBand === band && g.label !== own)
    .map((g) => g.label);
  return {
    label: own,
    note: picks.length ? `Shown when ${picks.join(" or ")} is chosen on the lab home.` : "",
  };
}

export function buildDirectory(index, { generated } = {}) {
  const bands = CONTENT_BAND_ORDER.filter((b) => index.bands?.[b]).map((band) => {
    const { label, note } = bandLabel(band, index.gradeBands);
    const domains = DOMAIN_ORDER.filter((d) => index.bands[band].domains?.[d]).map((domain) => {
      const levels = Object.entries(index.bands[band].domains[domain].levels || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, level]) => ({
          key,
          name: levelName(domain, key, level.tier),
          rows: level.activities.map(([id, title, type, skill, minutes]) => {
            const route = activityRoute(band, domain, key, id);
            const time = typeof minutes === "number" ? `${minutes} min` : type === "worksheet" ? "printable" : "";
            return { id, title, type, skill, minutes, time, route, url: absUrl(route) };
          }),
        }));
      const count = levels.reduce((n, l) => n + l.rows.length, 0);
      return { id: domain, name: DOMAIN_NAME[domain] || domain, count, levels };
    });
    const count = domains.reduce((n, d) => n + d.count, 0);
    return { id: band, label, note, count, domains };
  });
  const tests = (index.tests || []).map((t) => {
    const route = `/test/${encodeURIComponent(t.id)}?grades=${encodeURIComponent(t.band)}`;
    return { ...t, route, url: absUrl(route), bandLabel: bandName(t.band)[0] };
  });
  return {
    title: "The Language Page Site Directory",
    subtitle: "Appendix: every domain and activity, with links",
    generated,
    base: shortUrl(""),
    host: SITE.host,
    bands,
    tests,
    total: bands.reduce((n, b) => n + b.count, 0),
  };
}

/** Number of activity rows in an index.json, counted independently of buildDirectory (the tests compare the two). */
export const countIndexActivities = (index) =>
  Object.values(index.bands).reduce(
    (n, b) =>
      n +
      Object.values(b.domains).reduce(
        (m, d) => m + Object.values(d.levels).reduce((k, l) => k + l.activities.length, 0),
        0,
      ),
    0,
  );
