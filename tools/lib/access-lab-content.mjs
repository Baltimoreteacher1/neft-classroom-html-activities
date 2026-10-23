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

/** Use the upper end of a task's stated range so students can allow enough time. */
export function activityMinutes(time) {
  const values =
    String(time || "")
      .match(/\d+(?:\.\d+)?/g)
      ?.map(Number) || [];
  return values.length ? Math.ceil(Math.max(...values)) : null;
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
              // [id, title, type, skill, minutes] — enough for home, passport and teacher views
              // to render without fetching the full domain file.
              activities: orderedActivities(L).map((a) => [
                a.id,
                a.title,
                a.type,
                a.skill || "",
                activityMinutes(a.time),
              ]),
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
  index.studio = buildStudioIndex(root);
  return index;
}

/** Chooser-sized summaries of the studio content (speaking, writing, missions, detective). Details load on demand. */
export function buildStudioIndex(root = CONTENT_DIR) {
  const read = (rel) => {
    const file = join(root, rel);
    return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  };
  const pick = (t, extra) => ({
    id: t.id,
    title: t.title,
    band: t.band,
    keyUse: t.keyUse,
    contentArea: t.contentArea,
    time: t.time,
    ...extra(t),
  });
  const missionDir = join(root, "missions");
  const missions = existsSync(missionDir)
    ? readdirSync(missionDir)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .map((f) => JSON.parse(readFileSync(join(missionDir, f), "utf8")))
        .map((m) => ({
          id: m.id,
          title: m.title,
          subtitle: m.subtitle,
          band: m.band,
          role: m.role,
          icon: m.icon,
          theme: m.theme,
          contentArea: m.contentArea,
          keyUses: m.keyUses,
          minutes: m.minutes,
          summary: m.summary,
        }))
    : [];
  return {
    speaking: (read("studio/speaking.json")?.tasks || []).map((t) =>
      pick(t, (x) => ({ taskType: x.taskType, seconds: x.targetSeconds })),
    ),
    writing: (read("studio/writing.json")?.tasks || []).map((t) =>
      pick(t, (x) => ({ form: x.form, words: x.expected })),
    ),
    missions,
    patterns: Object.entries(read("detective/patterns.json")?.patterns || {}).map(([id, p]) => ({
      id,
      name: p.name,
      category: p.category,
    })),
  };
}

/**
 * The tap-a-word glossary: every vocabulary entry ever authored in the bank, one per word (first definition wins,
 * in band then domain order). Generated, never hand-edited: `node tools/access-lab-index.mjs`.
 * Spanish arrives as "término: definición" and is split here so the app never parses it.
 */
export function buildGlossary(root = CONTENT_DIR) {
  const byTerm = new Map();
  for (const { activity } of allActivities(root))
    for (const [term, def, es] of activity.vocabulary || []) {
      const key = String(term).trim().toLowerCase();
      if (!key || byTerm.has(key)) continue;
      const m = /^([^:]+):\s*(.+)$/.exec(String(es || ""));
      byTerm.set(key, {
        term: key,
        def: String(def),
        es: m ? m[1].trim() : "",
        esDef: m ? m[2].trim() : "",
      });
    }
  return { schema: 1, terms: [...byTerm.values()].sort((a, b) => a.term.localeCompare(b.term)) };
}
