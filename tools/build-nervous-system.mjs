#!/usr/bin/env node
/* =============================================================================
 * build-nervous-system.mjs — fuse the curriculum into one navigable graph.
 * -----------------------------------------------------------------------------
 * GENERATES data/curriculum-nervous-system.json. Do not hand-edit that file.
 *
 * Four sources, one graph:
 *   data/standards-taxonomy.json      -> the 47 authored standards (label, domain)
 *   data/standards-prerequisites.json -> HAND-AUTHORED prerequisite edges + the
 *                                        misconception-tag -> standard join
 *   data/asset-concept-map.json       -> every asset that teaches each standard
 *   data/content-coverage.json        -> level 0/1/2 coverage + gap flags
 *
 * Standard ids are NORMALIZED to the form asset-concept-map.json already uses
 * (cluster letter dropped, sub-part de-dotted): 6.AT.A.3.a -> 6.AT.3a. That is
 * the only id form that joins all four files, so it is the graph's node id.
 *
 * Layout is computed here, not in the browser, and is fully deterministic:
 *   x = longest-path depth from a root (left = foundations, right = culminating)
 *   y = domain lane, then stable within-lane ordering
 * No Math.random, no Date.now in the payload beyond a single `generated` stamp,
 * so `--check` can assert the committed file matches a fresh build.
 *
 * Usage:
 *   node tools/build-nervous-system.mjs           # write
 *   node tools/build-nervous-system.mjs --check   # verify committed == fresh
 * ========================================================================== */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "data/curriculum-nervous-system.json");
const CHECK = process.argv.includes("--check");

const read = (rel) => JSON.parse(readFileSync(resolve(ROOT, rel), "utf8"));

/** 6.AT.A.3.a -> 6.AT.3a ; 6.NOS.B.2 -> 6.NOS.2 . Returns null if unparseable. */
export function normalizeStandard(id) {
  const m = /^6\.(AT|NOS|GR|DS)\.([A-D])\.(\d+)(?:\.([a-z]))?$/.exec(String(id || "").trim());
  if (!m) return null;
  const [, domain, , num, sub] = m;
  return `6.${domain}.${num}${sub || ""}`;
}

const DOMAIN_NAMES = {
  AT: "Algebraic Thinking",
  NOS: "Number & Operation Sense",
  GR: "Geometric Reasoning & Measurement",
  DS: "Reasoning with Data & Statistics",
};
// Lane order top-to-bottom. Stable, so the map never reshuffles between builds.
const LANE_ORDER = ["NOS", "AT", "GR", "DS"];

function build() {
  const taxonomy = read("data/standards-taxonomy.json");
  const prereqs = read("data/standards-prerequisites.json");
  const conceptMap = read("data/asset-concept-map.json");
  const coverage = read("data/content-coverage.json");

  // ---- Nodes from the taxonomy (deduped by normalized id) -------------------
  /** @type {Map<string, any>} */
  const nodes = new Map();
  for (const s of taxonomy.standards) {
    const id = normalizeStandard(s.id);
    if (!id) continue;
    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        domain: s.domain,
        domainName: DOMAIN_NAMES[s.domain] || s.domain,
        cluster: /^6\.[A-Z]+\.([A-D])\./.exec(s.id)?.[1] || "",
        label: s.label,
        aliases: [],
        oldIds: [],
        assets: [],
        assetCount: 0,
        units: [],
        coverage: null,
        misconceptions: [],
        prereqs: [],
        unlocks: [],
        depth: 0,
        x: 0,
        y: 0,
      });
    }
    const n = nodes.get(id);
    if (!n.aliases.includes(s.id)) n.aliases.push(s.id);
    if (s.oldId && !n.oldIds.includes(s.oldId)) n.oldIds.push(s.oldId);
    // Multiple taxonomy rows collapse to one node; keep the longest label, it is
    // reliably the most descriptive of the group.
    if (s.label.length > n.label.length) n.label = s.label;
  }

  // ---- Assets from the concept map -----------------------------------------
  let assetsJoined = 0;
  for (const [rawId, entry] of Object.entries(conceptMap.byStandard || {})) {
    const n = nodes.get(rawId);
    if (!n) continue;
    n.shortLabel = entry.label || "";
    n.fullText = entry.fullText || "";
    n.topic = entry.topic || "";
    n.assets = (entry.assets || []).map((a) => ({
      title: a.title,
      path: a.path,
      category: a.category,
      audience: a.audience,
      unit: a.unit ?? null,
      via: a.via,
    }));
    n.assetCount = n.assets.length;
    assetsJoined += n.assetCount;
    n.units = [...new Set(n.assets.map((a) => a.unit).filter((u) => u != null))].sort(
      (a, b) => a - b,
    );
  }

  // ---- Related assets for standards the concept map does not index directly --
  // The concept map tags assets at 29 of the 42 standards. The other 13 are
  // almost all sub-parts (6.NOS.8a) or umbrella parents (6.AT.6) that are taught
  // inside their sibling's material rather than separately. Rendering those as
  // empty nodes would read as "this standard has nothing", which is false and
  // makes the map look broken. Instead, carry the family's assets across with an
  // explicit `relation` so the map can say WHERE the teaching actually lives.
  const familyKey = (id) => id.replace(/[a-z]+$/, ""); // 6.NOS.8a -> 6.NOS.8
  for (const n of nodes.values()) {
    if (n.assetCount > 0) continue;
    const parentId = familyKey(n.id);
    const relatives = [...nodes.values()].filter(
      (o) => o.id !== n.id && familyKey(o.id) === parentId && o.assetCount > 0,
    );
    n.relatedAssets = relatives.flatMap((o) =>
      o.assets.map((a) => ({ ...a, relation: o.id === parentId ? "parent" : "sibling", from: o.id })),
    );
    n.relatedAssetCount = n.relatedAssets.length;
    n.taughtWithin = [...new Set(n.relatedAssets.map((a) => a.from))];
  }

  // ---- Coverage (level 0/1/2 + gap flags) -----------------------------------
  for (const row of coverage.rows || []) {
    const id = normalizeStandard(row.standard);
    const n = id && nodes.get(id);
    if (!n) continue;
    // Several taxonomy rows can share a normalized id; sum rather than clobber.
    const c = n.coverage || { total: 0, l0: 0, l1: 0, l2: 0, flags: [] };
    c.total += row.total || 0;
    c.l0 += row.l0 || 0;
    c.l1 += row.l1 || 0;
    c.l2 += row.l2 || 0;
    for (const f of row.flags || []) if (!c.flags.includes(f)) c.flags.push(f);
    n.coverage = c;
  }
  // A flag only survives if it is still true of the summed node.
  for (const n of nodes.values()) {
    if (!n.coverage) continue;
    n.coverage.flags = n.coverage.flags.filter((f) => {
      if (f === "no-level-0") return n.coverage.l0 === 0;
      if (f === "no-enrichment") return n.coverage.l2 === 0;
      return true;
    });
  }

  // ---- Misconception tags ---------------------------------------------------
  const labels = read("data/misconception-labels.json").tags || {};
  const tagStandards = { ...prereqs.tagStandards };
  delete tagStandards._note;
  const tagIndex = {};
  for (const [tag, ids] of Object.entries(tagStandards)) {
    const meta = labels[tag] || {};
    tagIndex[tag] = {
      tag,
      label: meta.label || tag,
      labelEs: meta.labelEs || "",
      watchFor: meta.watchFor || "",
      standards: ids,
    };
    for (const id of ids) {
      const n = nodes.get(id);
      if (n && !n.misconceptions.includes(tag)) n.misconceptions.push(tag);
    }
  }

  // ---- Edges ----------------------------------------------------------------
  const edges = [];
  const unknown = [];
  for (const e of prereqs.edges) {
    if (!nodes.has(e.from) || !nodes.has(e.to)) {
      unknown.push(`${e.from} -> ${e.to}`);
      continue;
    }
    edges.push({ from: e.from, to: e.to, strength: e.strength, why: e.why });
    nodes.get(e.to).prereqs.push(e.from);
    nodes.get(e.from).unlocks.push(e.to);
  }
  if (unknown.length) {
    throw new Error(
      `build-nervous-system: ${unknown.length} prerequisite edge(s) reference standards that are ` +
        `not in the taxonomy:\n  ${unknown.join("\n  ")}\n` +
        `Fix data/standards-prerequisites.json — a dangling edge would silently drop a ` +
        `prerequisite from the map, which is worse than a loud failure.`,
    );
  }

  // ---- Depth (longest path from a root) + cycle detection -------------------
  const depth = new Map();
  const state = new Map(); // 0 unvisited, 1 in-stack, 2 done
  const stack = [];
  function visit(id) {
    const s = state.get(id) || 0;
    if (s === 2) return depth.get(id);
    if (s === 1) {
      const cycle = [...stack.slice(stack.indexOf(id)), id].join(" -> ");
      throw new Error(
        `build-nervous-system: prerequisite cycle detected: ${cycle}\n` +
          `The prerequisite graph must be a DAG — a cycle means "A must come before B must ` +
          `come before A", which makes causal tracing meaningless.`,
      );
    }
    state.set(id, 1);
    stack.push(id);
    let d = 0;
    for (const p of nodes.get(id).prereqs) d = Math.max(d, visit(p) + 1);
    stack.pop();
    state.set(id, 2);
    depth.set(id, d);
    return d;
  }
  for (const id of nodes.keys()) visit(id);
  for (const [id, d] of depth) nodes.get(id).depth = d;

  // ---- Deterministic layout -------------------------------------------------
  // x by depth; y by lane then stable in-lane order (depth, then id).
  const maxDepth = Math.max(...depth.values());
  const byLane = new Map(LANE_ORDER.map((d) => [d, []]));
  for (const n of [...nodes.values()].sort(
    (a, b) => a.depth - b.depth || a.id.localeCompare(b.id),
  )) {
    (byLane.get(n.domain) || byLane.get(LANE_ORDER[0])).push(n);
  }
  const LANE_GAP = 260;
  const COL_GAP = 210;
  const ROW_GAP = 86;
  let laneTop = 0;
  const lanes = [];
  for (const domain of LANE_ORDER) {
    const members = byLane.get(domain) || [];
    // Within a lane, stack nodes that share a depth so they never overlap.
    const perColumn = new Map();
    let laneHeight = 0;
    for (const n of members) {
      const col = perColumn.get(n.depth) || 0;
      perColumn.set(n.depth, col + 1);
      n.x = 140 + n.depth * COL_GAP;
      n.y = laneTop + 90 + col * ROW_GAP;
      laneHeight = Math.max(laneHeight, 90 + col * ROW_GAP);
    }
    lanes.push({
      domain,
      name: DOMAIN_NAMES[domain],
      top: laneTop,
      height: Math.max(laneHeight + 70, LANE_GAP),
      count: members.length,
    });
    laneTop += Math.max(laneHeight + 70, LANE_GAP);
  }

  const nodeList = [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id));
  const width = 140 + maxDepth * COL_GAP + 220;
  const height = laneTop + 40;

  return {
    _note:
      "GENERATED by tools/build-nervous-system.mjs — do not hand-edit. The prerequisite " +
      "edges live in data/standards-prerequisites.json; everything else is joined from " +
      "the taxonomy, the asset concept map, coverage, and the misconception labels.",
    generated: new Date().toISOString(),
    version: 1,
    source: {
      taxonomyRows: taxonomy.standards.length,
      nodes: nodeList.length,
      edges: edges.length,
      assetsJoined,
      misconceptionTags: Object.keys(tagIndex).length,
    },
    // Real, actionable coverage intelligence rather than a decorative stat: a
    // standard with no asset of its own AND none inherited from its family is a
    // genuine hole in the curriculum. The map surfaces these deliberately.
    gaps: {
      note: "Standards with no directly-tagged asset and none inherited from a parent or sibling.",
      untaught: nodeList
        .filter((n) => n.assetCount === 0 && !n.relatedAssetCount)
        .map((n) => ({ id: n.id, label: n.label, domain: n.domain })),
      noSupportLevel: nodeList
        .filter((n) => n.coverage && n.coverage.l0 === 0 && n.coverage.total > 0)
        .map((n) => n.id),
      noEnrichment: nodeList
        .filter((n) => n.coverage && n.coverage.l2 === 0 && n.coverage.total > 0)
        .map((n) => n.id),
    },
    layout: { width, height, maxDepth, colGap: COL_GAP, rowGap: ROW_GAP, lanes },
    domains: DOMAIN_NAMES,
    strengths: prereqs.strengths,
    misconceptions: tagIndex,
    nodes: nodeList,
    edges,
  };
}

const fresh = build();

if (CHECK) {
  let committed;
  try {
    committed = JSON.parse(readFileSync(OUT, "utf8"));
  } catch {
    console.error("build-nervous-system --check: data/curriculum-nervous-system.json is missing.");
    process.exit(1);
  }
  const strip = (o) => {
    const { generated, ...rest } = o;
    return JSON.stringify(rest);
  };
  if (strip(committed) !== strip(fresh)) {
    console.error(
      "build-nervous-system --check: committed graph is stale. Run `npm run generate:nervous-system`.",
    );
    process.exit(1);
  }
  console.log(
    `build-nervous-system --check: OK (${fresh.source.nodes} nodes, ${fresh.source.edges} edges).`,
  );
} else {
  writeFileSync(OUT, JSON.stringify(fresh, null, 2) + "\n");
  console.log(
    `build-nervous-system: wrote data/curriculum-nervous-system.json — ` +
      `${fresh.source.nodes} nodes, ${fresh.source.edges} edges, ` +
      `${fresh.source.assetsJoined} assets joined, depth 0..${fresh.layout.maxDepth}.`,
  );
}
