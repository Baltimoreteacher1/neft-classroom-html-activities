// Single reader for ACCESS Practice Lab content (access-practice-lab/content/).
// Every Node consumer — validator, index generator, printables, inventory,
// build stamp — loads content through here so there is one definition of
// "what the lab ships".
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const LAB_DIR = join(REPO_ROOT, "access-practice-lab");
export const CONTENT_DIR = join(LAB_DIR, "content");
export const BANDS = ["3-5", "6-8"];
export const CORE_DOMAINS = ["Listening", "Speaking", "Reading", "Writing"];
export const LEVEL_KEYS = ["A", "B", "C"];
export const ITEM_TYPES = [
  "multipleChoice",
  "multiSelect",
  "sort",
  "order",
  "cloze",
  "hotText",
  "constructed",
  "worksheet",
];

export const bandDir = (band) => join(CONTENT_DIR, `g${band}`);

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`${file}: ${error.message}`);
  }
}

/** All domain files for a band: [{ band, domain, file, data }]. */
export function loadBand(band, root = CONTENT_DIR) {
  const dir = join(root, `g${band}`);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const file = join(dir, f);
      return { band, domain: f.replace(/\.json$/, ""), file, data: readJson(file) };
    });
}

/** Every activity with its location: [{ band, domain, level, activity }]. */
export function allActivities(root = CONTENT_DIR) {
  const out = [];
  for (const band of BANDS)
    for (const { domain, data } of loadBand(band, root))
      for (const [level, L] of Object.entries(data.levels || {}))
        for (const activity of L.activities || []) out.push({ band, domain, level, activity });
  return out;
}

export function loadTests(root = CONTENT_DIR) {
  const dir = join(root, "tests");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({ file: join(dir, f), data: readJson(join(dir, f)) }));
}

export function loadOptional(name, root = CONTENT_DIR) {
  const file = join(root, name);
  return existsSync(file) ? readJson(file) : null;
}

/** Activities in teaching order: category strands first, then any unlisted ones. */
export function orderedActivities(level) {
  const list = level.activities || [];
  const byId = new Map(list.map((a) => [a.id, a]));
  const seen = new Set();
  const out = [];
  for (const c of level.categories || [])
    for (const id of c.activityIds || [])
      if (byId.has(id) && !seen.has(id)) {
        seen.add(id);
        out.push(byId.get(id));
      }
  for (const a of list) if (!seen.has(a.id)) out.push(a);
  return out;
}

/** The generated index, computed from disk. */
export function buildIndex(root = CONTENT_DIR) {
  const index = { schema: 3, bands: {}, tests: [] };
  for (const band of BANDS) {
    const domains = {};
    for (const { domain, data } of loadBand(band, root))
      domains[domain] = {
        color: data.color,
        icon: data.icon,
        description: data.description,
        levels: Object.fromEntries(
          Object.entries(data.levels || {}).map(([lk, L]) => [
            lk,
            {
              tier: L.tier || null,
              // [id, title, type, skill] — enough for home, passport and teacher views
              // to render without fetching the full domain file.
              activities: orderedActivities(L).map((a) => [a.id, a.title, a.type, a.skill || ""]),
            },
          ]),
        ),
      };
    if (Object.keys(domains).length) index.bands[band] = { domains };
  }
  for (const { data: t } of loadTests(root)) {
    const sections = t.sections || [];
    index.tests.push({
      id: t.id,
      band: t.band,
      kind: t.kind,
      domain: t.domain || null,
      title: t.title,
      items: sections.reduce((n, s) => n + (s.items || []).length, 0),
      minutes: sections.reduce((n, s) => n + (Number(s.estMinutes) || 8), 0),
    });
  }
  return index;
}
