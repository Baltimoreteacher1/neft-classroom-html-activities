// Contract check for the "Then vs. now" bridge card authored in data/family-homework-notes/<id>.json
// (key `bridge`). Shared by tools/validate-family-bridge.mjs (one-off runs while authoring) and
// tools/homework-bridge-card.test.mjs (in `npm test`). Spec: docs/specs/family-homework-bridge-card.md.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BRIDGE_ROWS, bridgeProblems, bridgeRequired } from "../../scripts/lib/homework-bridge.mjs";
import { REPO_ROOT, tryLoadLessonConfig } from "./curriculum-source.mjs";

const NOTES = join(REPO_ROOT, "data/family-homework-notes");

export const sidecarIds = () =>
  readdirSync(NOTES)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

export const readSidecar = (id) => JSON.parse(readFileSync(join(NOTES, `${id}.json`), "utf8"));

/** Every string in a JSON value, joined: the text a lesson states about itself. */
function allStrings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) allStrings(v, out);
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) if (k !== "bridge") allStrings(v, out);
  return out;
}

/** What the lesson states: its sidecar, its config, and (for a Part 2) the core lesson's. */
export function lessonCorpus(id) {
  const ids = [id];
  if (id.endsWith("-part2")) ids.push(id.slice(0, -"-part2".length));
  const parts = [];
  for (const one of ids) {
    if (existsSync(join(NOTES, `${one}.json`))) allStrings(readSidecar(one), parts);
    const cfg = tryLoadLessonConfig(one);
    if (cfg) allStrings(cfg, parts);
  }
  return parts.join("\n");
}

/** Ids that must carry a bridge (BRIDGE_UNITS), in lesson order. */
export const requiredIds = () => sidecarIds().filter(bridgeRequired);

/** Problems across the given ids ([] = every required sidecar plus any other that opts in). */
export function checkBridges(ids = null) {
  const want =
    ids ?? sidecarIds().filter((id) => bridgeRequired(id) || readSidecar(id).bridge !== undefined);
  const problems = [];
  const seen = new Map();
  for (const id of want) {
    const bridge = readSidecar(id).bridge;
    problems.push(...bridgeProblems(id, bridge, lessonCorpus(id)));
    if (!bridge) continue;
    for (const row of BRIDGE_ROWS) {
      const text = bridge[row.key]?.en?.trim().toLowerCase();
      if (!text) continue;
      const key = `${row.key}:${text}`;
      if (seen.has(key)) problems.push(`${id}: bridge ${row.key}.en repeats ${seen.get(key)}`);
      else seen.set(key, id);
    }
  }
  return problems;
}
