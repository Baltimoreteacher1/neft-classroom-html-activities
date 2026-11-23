// Data access for the studio: the generated manifest, lazy-loaded data modules, standards, and BCPSS seed units.
// Data modules are imported by manifest path only when a view asks for them, and cached.
import { SEED_SUBJECT, hasSeedUnits } from "../data/taxonomy.js";
import { playUrl } from "./library.js";

export class CatalogError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "CatalogError";
    this.cause = cause;
  }
}

export const KIND_LABELS = {
  lesson: "Lesson",
  vocab: "Vocabulary",
  activity: "Activity",
  wida: "WIDA practice",
  project: "Project",
  unit: "District unit",
};

/** The hash a card should open. Activities open the student player instead (see playUrl). */
export function hrefFor(kind, id) {
  const e = encodeURIComponent(id);
  switch (kind) {
    case "lesson":
      return `#/lesson/${e}`;
    case "vocab":
      return `#/vocab/${e}`;
    case "wida":
      return `#/wida/${e}`;
    case "project":
      return `#/project/${e}`;
    case "unit":
      return `#/unit/${e}`;
    case "activity":
      return playUrl(id);
    default:
      return "#/";
  }
}

async function defaultFetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

export function createCatalog({
  base = new URL("../", import.meta.url),
  fetchJson = defaultFetchJson,
  importModule = (url) => import(url),
} = {}) {
  const cache = new Map();
  // A failed load is never cached, so a retry really retries.
  const once = (key, fn) => {
    if (!cache.has(key)) {
      cache.set(
        key,
        Promise.resolve()
          .then(fn)
          .catch((err) => {
            cache.delete(key);
            throw err instanceof CatalogError ? err : new CatalogError(`Could not load ${key}.`, err);
          }),
      );
    }
    return cache.get(key);
  };
  const url = (rel) => new URL(rel, base).href;

  const meta = () => once("manifest", () => fetchJson(url("data/manifest.json")));
  const manifest = async () => (await meta()).items || [];
  const entry = async (kind, id) => (await manifest()).find((e) => e.kind === kind && e.id === id) || null;

  const load = (kind) => (id) =>
    once(`${kind}:${id}`, async () => {
      const e = await entry(kind, id);
      if (!e) throw new CatalogError(`No ${kind} with id "${id}".`);
      const mod = await importModule(url(e.path));
      if (!mod?.default) throw new CatalogError(`The ${kind} "${id}" has no data.`);
      return mod.default;
    });

  const standards = () =>
    once("standards", async () => {
      const files = (await meta()).standardsFiles || [];
      const mods = await Promise.all(files.map((f) => importModule(url(`data/standards/${f}`))));
      return mods.flatMap((m) => m.default || []);
    });

  const seedFetch = (key, path) => once(key, () => fetchJson(path));

  return {
    manifest,
    meta,
    entry,
    byKind: async (kind) => (await manifest()).filter((e) => e.kind === kind),
    lesson: load("lesson"),
    vocab: load("vocab"),
    activity: load("activity"),
    wida: load("wida"),
    project: load("project"),
    standards,
    async standard(code) {
      return (await standards()).find((s) => s.code === code) || null;
    },
    /** BCPSS seed units for K-8 ELA/Math/Science/Social Studies; [] for any other combination. Throws CatalogError on failure. */
    async seedUnits(grade, subject) {
      const label = SEED_SUBJECT[subject] || (Object.values(SEED_SUBJECT).includes(subject) ? subject : null);
      const id = Object.keys(SEED_SUBJECT).find((k) => SEED_SUBJECT[k] === label);
      if (!label || !id || !hasSeedUnits(grade, id)) return [];
      const q = `grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(label)}`;
      const data = await seedFetch(`seed:${grade}:${label}`, `/api/bcpss/units?${q}`);
      return data.units || [];
    },
    seedUnit: (unitId) => seedFetch(`seedunit:${unitId}`, `/api/bcpss/units/${encodeURIComponent(unitId)}`),
  };
}
