#!/usr/bin/env node
/**
 * Publish the misconception taxonomy as a static JSON artifact.
 *
 * `engine/core/misconceptions.js` is the single source of truth for every named
 * misconception, but it is an ES module bundled into the lesson engine. The
 * teacher-facing pages that need to READ those names — the misconception
 * heatmap, the participation view — are standalone HTML with classic inline
 * scripts and cannot import it. Rather than let a second copy of the labels
 * drift into those pages (which is exactly how a tag ends up displayed as
 * "op-added-instead-of-multiplied" in one place and "Added when the problem
 * multiplies" in another), the taxonomy is exported here and fetched there.
 *
 * Generated — do not hand-edit data/misconception-labels.json. Re-run after any
 * change to the taxonomy; `tools/misconception-labels.test.mjs` fails if the
 * committed artifact has fallen out of step.
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MISCONCEPTIONS } from "../engine/core/misconceptions.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const OUTPUT = resolve(ROOT, "data/misconception-labels.json");

/** The teacher-facing projection of the taxonomy: names and next moves only. */
export function buildLabels() {
  const tags = {};
  for (const id of Object.keys(MISCONCEPTIONS).sort()) {
    const entry = MISCONCEPTIONS[id];
    tags[id] = {
      label: entry.label,
      labelEs: entry.labelEs,
      watchFor: entry.watchFor,
    };
  }
  return {
    _generated: "scripts/generate-misconception-labels.mjs — do not hand-edit",
    _source: "engine/core/misconceptions.js",
    count: Object.keys(tags).length,
    tags,
  };
}

export function serialize(labels) {
  return `${JSON.stringify(labels, null, 2)}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const labels = buildLabels();
  writeFileSync(OUTPUT, serialize(labels));
  console.log(`misconception labels: wrote ${labels.count} tags to data/misconception-labels.json`);
}
