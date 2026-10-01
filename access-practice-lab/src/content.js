// Content loader. Everything the lab shows comes from content/*.json; files are
// fetched lazily (a student opening one Speaking activity downloads one domain
// file, not 1 MB of everything) and revalidated on each load (`no-cache`), so a
// deploy is picked up immediately without a hard refresh.
import { BASE, bandOfId } from "./util.js";

const cache = new Map();

async function getJson(path) {
  if (!cache.has(path)) {
    const p = fetch(`${BASE}/content/${path}`, { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
      return r.json();
    });
    cache.set(path, p);
    p.catch(() => cache.delete(path));
  }
  return cache.get(path);
}

export const loadIndex = () => getJson("index.json");
export const loadShared = () => getJson("shared.json");
export const loadRoad = () => getJson("road.json").catch(() => ({}));
export const loadFamily = () => getJson("family.json").catch(() => null);
export const loadTest = (id) => getJson(`tests/${encodeURIComponent(id)}.json`);

export async function loadDomain(band, domain) {
  const data = await getJson(`g${band}/${encodeURIComponent(domain)}.json`);
  return data;
}

/** Bands that actually ship content, in display order. */
export async function availableBands() {
  const index = await loadIndex();
  return ["3-5", "6-8"].filter((b) => index.bands[b]);
}

/** Domains for a band from the index (no domain fetch). */
export async function bandDomains(band) {
  const index = await loadIndex();
  return index.bands[band]?.domains || {};
}

/** Look an activity up by id, using the index to find its file. */
export async function findActivity(id, hint = {}) {
  const index = await loadIndex();
  const band = hint.band || bandOfId(id);
  const domains = index.bands[band]?.domains || {};
  const order = hint.domain ? [hint.domain, ...Object.keys(domains)] : Object.keys(domains);
  for (const domain of order) {
    const levels = domains[domain]?.levels || {};
    for (const [level, L] of Object.entries(levels)) {
      if (L.activities.some((row) => row[0] === id)) {
        const data = await loadDomain(band, domain);
        const list = data.levels[level].activities;
        return { band, domain, level, data, list, activity: list.find((a) => a.id === id) };
      }
    }
  }
  return null;
}

/** All index rows for a band as flat records. */
export async function bandRows(band) {
  const domains = await bandDomains(band);
  const rows = [];
  for (const [domain, d] of Object.entries(domains))
    for (const [level, L] of Object.entries(d.levels))
      for (const [id, title, type, skill] of L.activities)
        rows.push({ band, domain, level, id, title, type, skill });
  return rows;
}
