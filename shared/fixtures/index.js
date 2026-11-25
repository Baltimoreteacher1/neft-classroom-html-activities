/**
 * Fixture library: the stable API later waves import for learner-model and planner tests.
 * Everything is deterministic (see prng.js) and synthetic (see validate.js). Docs: docs/testing/fixtures.md
 */
import { buildClass, CLASS_SPECS } from "./classes.js";
import { buildHistory } from "./history.js";
import { assertFixture } from "./validate.js";

export const FIXTURE_API_VERSION = 1;
export { BAND_MIXES, BANDS, buildClass, CLASS_SPECS, GRADES, MAX_CLASS_SIZE } from "./classes.js";
export { buildHistory, DOMAINS, HISTORY_START, NODES_PER_DOMAIN, nodeIdsFor } from "./history.js";
export { createRng, hashSeed } from "./prng.js";
export { ALIAS, assertFixture, validateFixture } from "./validate.js";

/** Every committed fixture class, freshly built (safe to mutate). */
export function fixtureClasses() {
  return CLASS_SPECS.map((spec) => assertFixture(buildClass(spec)));
}

export function getFixtureClass(id) {
  const spec = CLASS_SPECS.find((c) => c.id === id);
  if (!spec) throw new Error(`unknown fixture class "${id}"`);
  return assertFixture(buildClass(spec));
}

/** Practice history for one fixture class (or any class built with buildClass). */
export function getFixtureHistory(classOrId, opts) {
  const cls = typeof classOrId === "string" ? getFixtureClass(classOrId) : classOrId;
  return assertFixture(buildHistory(cls, opts));
}

/** All classes plus their histories, the unit the digest gate pins. */
export function fixtureCorpus() {
  const classes = fixtureClasses();
  return {
    version: FIXTURE_API_VERSION,
    classes,
    histories: Object.fromEntries(classes.map((c) => [c.id, getFixtureHistory(c)])),
  };
}
