// WIDA view data: turns the generated manifest into the descriptors the hub, the pathway generator and the
// evidence summary share. Pure helpers first (testable in Node), one loader that talks to the catalog.
import {
  DOMAINS,
  GRADES,
  TIER_IDS,
  TIERS,
  bandOf,
  widaClusterOf,
  WIDA_CLUSTERS,
} from "../../data/taxonomy.js";

export const FRAMING =
  "WIDA-aligned original practice. These are not official WIDA or ACCESS items, and nothing here is a score or a prediction of ACCESS results. Practice is untimed.";

export const CLUSTER_LABEL = {
  K: "Kindergarten",
  1: "Grade 1",
  "2-3": "Grades 2-3",
  "4-5": "Grades 4-5",
  "6-8": "Grades 6-8",
};
export const DOMAIN_NOTE = {
  Listening: "Listen to a spoken text and show understanding.",
  Speaking: "Rehearse and say language aloud.",
  Reading: "Read an original text and find evidence.",
  Writing: "Write, then revise against language targets.",
};
export { DOMAINS, TIERS, TIER_IDS, WIDA_CLUSTERS };

/** One manifest entry as the descriptor used everywhere in the WIDA views. Returns null when it is not WIDA practice. */
export function describe(entry) {
  if (!entry || entry.kind !== "wida" || !entry.id) return null;
  const domain = entry.domain || (Array.isArray(entry.domains) ? entry.domains[0] : "");
  const grade = entry.grade != null ? String(entry.grade) : "";
  if (!DOMAINS.includes(domain) || !GRADES.includes(grade)) return null;
  return {
    id: entry.id,
    kind: "wida",
    title: entry.title || entry.id,
    domain,
    grade,
    band: entry.band || bandOf(grade),
    cluster: entry.cluster || widaClusterOf(grade),
    subject: entry.subject || "esol",
    klus: Array.isArray(entry.klus) ? entry.klus : [],
    standards: Array.isArray(entry.standards) ? entry.standards : [],
    lessonId: entry.lessonId || "",
  };
}

/** Everything the pathway generator reads (see core/wida-path.js buildPathway). */
export function buildIndex(manifest = []) {
  const wida = manifest.map(describe).filter(Boolean);
  const domainByAid = new Map(wida.map((c) => [c.id, c.domain]));
  const pick = (kind) => manifest.filter((e) => e.kind === kind);
  return {
    wida,
    vocab: pick("vocab"),
    activities: pick("activity"),
    domainOf: (aid) => domainByAid.get(aid) || null,
  };
}

const clean = (v, allowed) => (allowed.includes(v) ? v : "");

/** Read and validate the filter state from route params. Anything unknown is dropped. */
export function readFilters(params = {}, defaults = {}) {
  return {
    cluster: clean(params.cluster ?? defaults.cluster ?? "", WIDA_CLUSTERS),
    domain: clean(params.domain ?? "", DOMAINS),
    subject: typeof params.subject === "string" ? params.subject.slice(0, 40) : "",
    tier: clean(params.tier ?? "", TIER_IDS) || "dev",
    q: typeof params.q === "string" ? params.q.slice(0, 80) : "",
  };
}

const norm = (s) => String(s || "").toLowerCase();

export function filterEntries(entries, f) {
  const q = norm(f.q).trim();
  return entries.filter((c) => {
    if (f.cluster && c.cluster !== f.cluster) return false;
    if (f.domain && c.domain !== f.domain) return false;
    if (f.subject && c.subject !== f.subject) return false;
    if (
      q &&
      ![c.title, c.subject, c.domain, ...c.klus, ...c.standards].some((v) => norm(v).includes(q))
    )
      return false;
    return true;
  });
}

/** Stable order: grade, domain, title. */
export function sortEntries(entries) {
  const g = (c) => GRADES.indexOf(c.grade);
  const d = (c) => DOMAINS.indexOf(c.domain);
  return [...entries].sort(
    (a, b) => g(a) - g(b) || d(a) - d(b) || (a.title < b.title ? -1 : a.title > b.title ? 1 : 0),
  );
}

/** Counts per cluster and per domain for the filter chips, ignoring that filter's own choice. */
export function facetCounts(entries, f) {
  const clusters = Object.fromEntries(WIDA_CLUSTERS.map((c) => [c, 0]));
  const domains = Object.fromEntries(DOMAINS.map((d) => [d, 0]));
  for (const c of filterEntries(entries, { ...f, cluster: "" })) clusters[c.cluster] += 1;
  for (const c of filterEntries(entries, { ...f, domain: "" })) domains[c.domain] += 1;
  return { clusters, domains };
}

/** Student link into the play player. Independent practice adds the engine's own `p=independent` flag. */
export function playLink(shell, id, { tier = "dev", independent = false, lessonId, origin = "" } = {}) {
  const url = shell.library.playUrl(id, { tier, lessonId, origin });
  return independent ? `${url}&p=independent` : url;
}

export const tierShort = (id) => TIERS.find((t) => t.id === id)?.short || id;

/** Manifest + descriptors from the shell catalog. Throws when the manifest cannot be read. */
export async function loadWida(shell) {
  const manifest = await shell.catalog.manifest();
  const index = buildIndex(manifest);
  return { manifest, index, entries: sortEntries(index.wida) };
}
