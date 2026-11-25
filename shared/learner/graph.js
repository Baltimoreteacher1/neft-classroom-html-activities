/**
 * Skill graph. Nodes:
 *   language  lang.<domain>.<klu>.<band>   4 domains x 4 key language uses x 3 bands = 48
 *   vocab     vocab.<unitId>.<term-slug>   one per authored vocabulary term
 *   standard  std.<code>                   one per core standard code in the unit seed
 * Edges (from = prerequisite of to):
 *   band        band ladder tiers within a domain and key language use (1_2 -> 3_4 -> 5_6)
 *   klu         Narrate -> Inform -> Explain -> Argue within a domain and band
 *   arc         lesson arc, input before output: listening -> speaking, reading -> writing
 *   vocab       a unit's vocabulary term -> that unit's standards
 *   unit-order  standard of an earlier unit -> standard of the next unit of the same grade and subject
 * Unit-order edges only run from a lower first-seen rank to a higher one, so the graph is acyclic by construction.
 */
import { BANDS, KLUS, LANG_DOMAINS } from "./constants.js";

export const langNodeId = (domain, klu, band) => `lang.${domain}.${klu.toLowerCase()}.${band}`;
export const vocabSlug = (term) =>
  String(term)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
export const vocabNodeId = (unitId, term) => `vocab.${unitId}.${vocabSlug(term)}`;
export const standardNodeId = (code) => `std.${code}`;

export function parseNodeId(id) {
  const parts = String(id).split(".");
  if (parts[0] === "lang" && parts.length === 4) {
    return { type: "language", domain: parts[1], klu: parts[2], band: parts[3] };
  }
  if (parts[0] === "vocab" && parts.length >= 3) {
    return { type: "vocab", unitId: parts[1], slug: parts.slice(2).join(".") };
  }
  if (parts[0] === "std" && parts.length >= 2) {
    return { type: "standard", code: parts.slice(1).join(".") };
  }
  throw new Error(`unknown node id "${id}"`);
}

/**
 * @param {Array<{id:string, grade:string|number, subject:string, unitNumber:number, standards:string[], vocab:string[]}>} units
 */
export function buildSkillGraph(units) {
  const nodes = new Map();
  const edges = new Map();
  const addNode = (node) => {
    if (!nodes.has(node.id)) nodes.set(node.id, node);
  };
  const addEdge = (from, to, kind) => {
    if (from === to) return;
    const key = `${from}>${to}`;
    if (!edges.has(key)) edges.set(key, { from, to, kind });
  };

  for (const domain of LANG_DOMAINS) {
    for (const klu of KLUS) {
      for (const band of BANDS) {
        addNode({ id: langNodeId(domain, klu, band), type: "language", domain, klu, band });
      }
    }
  }
  for (const domain of LANG_DOMAINS) {
    for (const band of BANDS) {
      KLUS.slice(1).forEach((klu, i) => {
        addEdge(langNodeId(domain, KLUS[i], band), langNodeId(domain, klu, band), "klu");
      });
    }
    for (const klu of KLUS) {
      BANDS.slice(1).forEach((band, i) => {
        addEdge(langNodeId(domain, klu, BANDS[i]), langNodeId(domain, klu, band), "band");
      });
    }
  }
  for (const klu of KLUS) {
    for (const band of BANDS) {
      addEdge(langNodeId("listening", klu, band), langNodeId("speaking", klu, band), "arc");
      addEdge(langNodeId("reading", klu, band), langNodeId("writing", klu, band), "arc");
    }
  }

  const sequences = new Map();
  for (const unit of units) {
    const stds = unit.standards.map(standardNodeId);
    for (const code of unit.standards) {
      addNode({ id: standardNodeId(code), type: "standard", code });
    }
    for (const term of unit.vocab) {
      const id = vocabNodeId(unit.id, term);
      addNode({ id, type: "vocab", unitId: unit.id, term });
      for (const std of stds) addEdge(id, std, "vocab");
    }
    const key = `${unit.grade}|${unit.subject}`;
    if (!sequences.has(key)) sequences.set(key, []);
    sequences.get(key).push(unit);
  }

  const rank = new Map();
  for (const unit of units) {
    for (const code of unit.standards) {
      const id = standardNodeId(code);
      if (!rank.has(id)) rank.set(id, rank.size);
    }
  }
  for (const list of sequences.values()) {
    const ordered = [...list].sort((a, b) => a.unitNumber - b.unitNumber);
    for (let i = 1; i < ordered.length; i++) {
      for (const from of ordered[i - 1].standards.map(standardNodeId)) {
        for (const to of ordered[i].standards.map(standardNodeId)) {
          if (rank.get(from) < rank.get(to)) addEdge(from, to, "unit-order");
        }
      }
    }
  }
  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

export function prerequisitesOf(graph, id) {
  return graph.edges.filter((e) => e.to === id).map((e) => e.from);
}

/** Kahn's algorithm. Returns a topological order, or null when the graph has a cycle. */
export function topologicalOrder(graph) {
  const indegree = new Map(graph.nodes.map((n) => [n.id, 0]));
  const out = new Map(graph.nodes.map((n) => [n.id, []]));
  for (const e of graph.edges) {
    if (!indegree.has(e.from) || !indegree.has(e.to)) return null;
    indegree.set(e.to, indegree.get(e.to) + 1);
    out.get(e.from).push(e.to);
  }
  const queue = [...indegree].filter(([, d]) => d === 0).map(([id]) => id);
  const order = [];
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    for (const next of out.get(id)) {
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }
  return order.length === graph.nodes.length ? order : null;
}
