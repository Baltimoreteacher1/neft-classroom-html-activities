/* =============================================================================
 * data.js — load and index the curriculum nervous system.
 * -----------------------------------------------------------------------------
 * The graph itself is GENERATED (tools/build-nervous-system.mjs). Nothing here
 * re-derives it; this module only fetches it, builds the lookups the view needs,
 * and answers the two questions the map is built to answer:
 *
 *   traceBack(id)    what has to be true UNDER this standard  (prereqs, BFS)
 *   traceForward(id) what this standard makes possible        (unlocks, BFS)
 * ========================================================================== */

export const DATA_URL = "/data/curriculum-nervous-system.json";

/** Colours are the single source of truth for domain identity across the app. */
export const DOMAIN_STYLE = {
  NOS: { glow: "#58b6ff", deep: "#123a68", ink: "#15487f" },
  AT: { glow: "#ffc46b", deep: "#5c3f0c", ink: "#845506" },
  GR: { glow: "#b79bff", deep: "#3b2d72", ink: "#593cbd" },
  DS: { glow: "#6fe0b0", deep: "#14503d", ink: "#1c6b52" },
};

export const FALLBACK_STYLE = { glow: "#9fb6d4", deep: "#243a5c", ink: "#41506b" };

export function domainStyle(domain) {
  return DOMAIN_STYLE[domain] || FALLBACK_STYLE;
}

/**
 * Normalise a standard id to the form used by the graph nodes.
 *   6.AT.A.2    -> 6.AT.2     (drop the cluster letter)
 *   6.NOS.C.8.c -> 6.NOS.8c   (drop the cluster letter, fuse the sub-letter)
 *   6.AT.3a     -> 6.AT.3a    (already normal)
 * Telemetry rows carry the long form; the graph carries the short one.
 */
export function normalizeStandard(raw) {
  const s = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!s) return "";
  const parts = s.split(".");
  if (parts.length < 3) return s;
  let rest = parts.slice(2);
  // The cluster letter is only ever the FIRST segment after the domain. A
  // trailing single letter (6.NOS.C.8.c) is the sub-standard and must survive.
  if (rest.length > 1 && /^[A-Z]$/.test(rest[0])) rest = rest.slice(1);
  let tail = rest.join("");
  if (/^\d/.test(tail)) tail = tail.replace(/[A-Z]+/g, (m) => m.toLowerCase());
  return `${parts[0]}.${parts[1]}.${tail}`;
}

function haystack(node) {
  const bits = [
    node.id,
    node.shortLabel,
    node.label,
    node.fullText,
    node.domainName,
    node.topic,
    ...(node.aliases || []),
    ...(node.oldIds || []),
    ...(node.units || []).map((u) => `unit ${u}`),
    ...(node.assets || []).map((a) => a.title),
    ...(node.assets || []).map((a) => a.category),
  ];
  return bits.filter(Boolean).join(" • ").toLowerCase();
}

/** Build every lookup the rest of the app reads from. */
export function buildModel(raw) {
  const nodes = Array.isArray(raw.nodes) ? raw.nodes.slice() : [];
  const edges = Array.isArray(raw.edges) ? raw.edges.slice() : [];
  const byId = new Map();
  const alias = new Map();
  const search = new Map();

  for (const node of nodes) {
    byId.set(node.id, node);
    search.set(node.id, haystack(node));
    const keys = [node.id, ...(node.aliases || []), ...(node.oldIds || [])];
    for (const key of keys) {
      alias.set(String(key).toUpperCase(), node.id);
      alias.set(normalizeStandard(key), node.id);
    }
  }

  const edgeIndex = new Map();
  for (const edge of edges) edgeIndex.set(`${edge.from}>${edge.to}`, edge);

  return {
    raw,
    nodes,
    edges,
    byId,
    edgeIndex,
    search,
    layout: raw.layout || { width: 1410, height: 1382, lanes: [] },
    lanes: (raw.layout && raw.layout.lanes) || [],
    domains: raw.domains || {},
    strengths: raw.strengths || {},
    misconceptions: raw.misconceptions || {},
    generated: raw.generated || "",
    /** Resolve any spelling of a standard id to a node id, or "". */
    resolve(id) {
      const key = String(id || "").trim();
      if (!key) return "";
      if (byId.has(key)) return key;
      return alias.get(key.toUpperCase()) || alias.get(normalizeStandard(key)) || "";
    },
    edge(from, to) {
      return edgeIndex.get(`${from}>${to}`) || null;
    },
  };
}

export async function loadModel(url = DATA_URL) {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`The curriculum graph could not be loaded (${res.status}).`);
  const raw = await res.json();
  if (!raw || !Array.isArray(raw.nodes) || !raw.nodes.length) {
    throw new Error("The curriculum graph loaded but contained no standards.");
  }
  return buildModel(raw);
}

/**
 * Breadth-first walk over one direction of the graph.
 * Returns [{ depth, node, via, strength, why }] with each standard visited once,
 * at its SHORTEST distance from the start — so "depth 1" always means "directly
 * underneath", never "also reachable the long way round".
 */
function walk(model, startId, key, maxDepth) {
  const start = model.byId.get(startId);
  if (!start) return [];
  const seen = new Set([startId]);
  const out = [];
  let frontier = [startId];

  for (let depth = 1; depth <= maxDepth && frontier.length; depth += 1) {
    const next = [];
    for (const currentId of frontier) {
      const current = model.byId.get(currentId);
      if (!current) continue;
      for (const otherId of current[key] || []) {
        if (seen.has(otherId)) continue;
        const other = model.byId.get(otherId);
        if (!other) continue;
        seen.add(otherId);
        const edge =
          key === "prereqs" ? model.edge(otherId, currentId) : model.edge(currentId, otherId);
        out.push({
          depth,
          node: other,
          via: current,
          strength: (edge && edge.strength) || "supporting",
          why: (edge && edge.why) || "",
        });
        next.push(otherId);
      }
    }
    frontier = next;
  }
  return out;
}

/** What has to be true underneath this standard. Capped at 4 layers. */
export function traceBack(model, id, maxDepth = 4) {
  return walk(model, id, "prereqs", maxDepth);
}

/** What this standard makes possible. Capped at 2 layers. */
export function traceForward(model, id, maxDepth = 2) {
  return walk(model, id, "unlocks", maxDepth);
}

/** Every node id one hop from `id` in either direction, plus `id` itself. */
export function neighbourhood(model, id) {
  const set = new Set();
  const node = model.byId.get(id);
  if (!node) return set;
  set.add(id);
  for (const p of node.prereqs || []) set.add(p);
  for (const u of node.unlocks || []) set.add(u);
  return set;
}

/** Node ids whose searchable text contains every whitespace-separated term. */
export function searchNodes(model, query) {
  const terms = String(query || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (!terms.length) return null;
  const hits = [];
  for (const node of model.nodes) {
    const hay = model.search.get(node.id) || "";
    if (terms.every((t) => hay.includes(t))) hits.push(node);
  }
  hits.sort((a, b) => {
    const q = terms[0];
    const aExact = a.id.toLowerCase().startsWith(q) ? 0 : 1;
    const bExact = b.id.toLowerCase().startsWith(q) ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });
  return hits;
}
