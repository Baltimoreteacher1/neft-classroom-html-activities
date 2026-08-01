#!/usr/bin/env node
import { execFileSync } from "node:child_process";
/* =============================================================================
 * validate-nervous-system.mjs — integrity gate for the curriculum graph and the
 * six surfaces built on it. Wired into `npm run validate`, so the pre-push QA
 * loop blocks any push that would ship an incoherent nervous system.
 *
 * The invariants here are the ones that fail SILENTLY in production if unguarded:
 *
 *  1. The committed graph matches a fresh build (a stale graph looks fine and is
 *     wrong).
 *  2. The prerequisite graph is a DAG and every edge lands on a real standard
 *     (the build script throws on both; this re-asserts after the fact).
 *  3. Every misconception tag the engine can emit has a home: a standard it is
 *     diagnostic of, and a label. An unmapped tag would arrive from telemetry and
 *     silently light up nothing on the map.
 *  4. THE DRIFT GUARD: functions/api/class-pulse.js inlines the tag vocabulary
 *     and the tag -> standard map, because Pages Functions cannot read repo data
 *     files at runtime. That inlined copy MUST stay in parity with the data
 *     files. Drift here is invisible until a real class hits it.
 *  5. The hub actually links to every surface, and every linked page exists on
 *     disk. A card pointing at a 404 is worse than no card.
 * ========================================================================== */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(readFileSync(resolve(ROOT, rel), "utf8"));
const readText = (rel) => readFileSync(resolve(ROOT, rel), "utf8");

const failures = [];
const check = (ok, msg) => {
  if (!ok) failures.push(msg);
};

// --- 1. Graph is fresh -------------------------------------------------------
try {
  execFileSync(process.execPath, [resolve(ROOT, "tools/build-nervous-system.mjs"), "--check"], {
    stdio: "pipe",
  });
} catch (err) {
  failures.push(
    "curriculum-nervous-system.json is stale or unbuildable — run `npm run generate:nervous-system`.\n" +
      String(err.stdout || "") +
      String(err.stderr || ""),
  );
}

const graph = read("data/curriculum-nervous-system.json");
const prereqs = read("data/standards-prerequisites.json");
const labels = read("data/misconception-labels.json").tags;

// --- 2. Graph shape ----------------------------------------------------------
const ids = new Set(graph.nodes.map((n) => n.id));
check(graph.nodes.length >= 40, `expected >= 40 standards, got ${graph.nodes.length}`);
check(graph.edges.length >= 40, `expected >= 40 prerequisite edges, got ${graph.edges.length}`);
for (const e of graph.edges) {
  check(ids.has(e.from), `edge from unknown standard: ${e.from}`);
  check(ids.has(e.to), `edge to unknown standard: ${e.to}`);
  check(
    typeof e.why === "string" && e.why.length >= 30,
    `edge ${e.from} -> ${e.to} has no real explanation (why: ${JSON.stringify(e.why)}) — the ` +
      `causal trace on the map renders this sentence, so a stub makes the flagship feature hollow`,
  );
  check(
    ["core", "supporting", "fluency"].includes(e.strength),
    `edge ${e.from} -> ${e.to} has unknown strength ${JSON.stringify(e.strength)}`,
  );
}
// Re-assert acyclicity independently of the build script.
{
  const state = new Map();
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  let cycle = null;
  const visit = (id, path) => {
    if (cycle) return;
    const s = state.get(id) || 0;
    if (s === 2) return;
    if (s === 1) {
      cycle = [...path.slice(path.indexOf(id)), id].join(" -> ");
      return;
    }
    state.set(id, 1);
    for (const p of byId.get(id).prereqs) visit(p, [...path, id]);
    state.set(id, 2);
  };
  for (const id of ids) visit(id, []);
  check(!cycle, `prerequisite cycle: ${cycle}`);
}
// Every node must be reachable as either a root or a dependent — an isolated
// standard with no edges either way is almost always an authoring oversight.
const connected = new Set();
for (const e of graph.edges) {
  connected.add(e.from);
  connected.add(e.to);
}
const isolated = [...ids].filter((id) => !connected.has(id));
check(
  isolated.length === 0,
  `${isolated.length} standard(s) have no prerequisite relationship at all: ${isolated.join(", ")}` +
    ` — add an edge in data/standards-prerequisites.json or they float unreachable on the map`,
);

// --- 3. Every emittable misconception tag has a home -------------------------
const tagStandards = { ...prereqs.tagStandards };
delete tagStandards._note;
for (const tag of Object.keys(labels)) {
  check(
    Array.isArray(tagStandards[tag]) && tagStandards[tag].length > 0,
    `misconception tag "${tag}" is not mapped to any standard in data/standards-prerequisites.json ` +
      `— live telemetry carrying it would light up nothing on the map`,
  );
  for (const id of tagStandards[tag] || []) {
    check(ids.has(id), `tag "${tag}" maps to unknown standard "${id}"`);
  }
}
for (const tag of Object.keys(tagStandards)) {
  check(labels[tag], `standards-prerequisites.json maps unknown tag "${tag}"`);
}

// --- 4. Drift guard: the inlined copy in class-pulse.js ----------------------
{
  const src = readText("functions/api/class-pulse.js");
  for (const tag of Object.keys(labels)) {
    check(
      src.includes(`"${tag}"`),
      `functions/api/class-pulse.js is missing misconception tag "${tag}" — its inlined vocabulary ` +
        `has drifted from data/misconception-labels.json, so that tag would be dropped from the ` +
        `student-safe class pulse and the Boss and Teach the Machine would never see it`,
    );
  }
  // The k-anonymity floor is the privacy contract. Assert it is still there and
  // has not been quietly relaxed to something meaningless.
  const minCohort = /const MIN_COHORT = (\d+)/.exec(src);
  const minEvents = /const MIN_EVENTS = (\d+)/.exec(src);
  check(minCohort, "class-pulse.js no longer declares MIN_COHORT — the k-anonymity floor is gone");
  check(minEvents, "class-pulse.js no longer declares MIN_EVENTS — the k-anonymity floor is gone");
  if (minCohort) {
    check(
      Number(minCohort[1]) >= 5,
      `class-pulse.js MIN_COHORT dropped to ${minCohort[1]} (must stay >= 5). Below five students, ` +
        `"the class's top mistake" is one identifiable child's mistake on a shared screen.`,
    );
  }
  check(
    !/student_name\s*[,)]/.test(src.split("const tags =")[1] || ""),
    "class-pulse.js appears to emit student_name in its response — it must never leave this endpoint",
  );
}

// --- 5. Hub links to every surface, and every surface exists -----------------
{
  const hub = readText("curriculum/index.html");
  const surfaces = [
    ["/curriculum/map/", "curriculum/map/index.html", "cns-map-feature-title"],
    ["/curriculum/forge/", "curriculum/forge/index.html", "cns-forge-feature-title"],
    ["/curriculum/class-boss/", "curriculum/class-boss/index.html", "cns-boss-feature-title"],
    [
      "/curriculum/teach-the-machine/",
      "curriculum/teach-the-machine/index.html",
      "cns-ttm-feature-title",
    ],
    [
      "/curriculum/family-connections/broadcast/",
      "curriculum/family-connections/broadcast/index.html",
      "cns-broadcast-feature-title",
    ],
    ["/curriculum/showcase/", "curriculum/showcase/index.html", "cns-showcase-feature-title"],
  ];
  for (const [href, file, titleId] of surfaces) {
    check(hub.includes(`href="${href}"`), `curriculum hub has no card linking to ${href}`);
    check(hub.includes(`id="${titleId}"`), `curriculum hub is missing the card titled #${titleId}`);
    check(existsSync(resolve(ROOT, file)), `hub links to ${href} but ${file} does not exist`);
  }
  check(
    hub.includes("The Curriculum Nervous System"),
    "curriculum hub is missing the Curriculum Nervous System section header",
  );
}

// --- Report ------------------------------------------------------------------
if (failures.length) {
  console.error(`✗ nervous system: ${failures.length} problem(s)\n`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log(
  `✓ nervous system: ${graph.nodes.length} standards, ${graph.edges.length} prerequisite edges, ` +
    `${Object.keys(labels).length} misconception tags mapped, 6 surfaces linked and present.`,
);
