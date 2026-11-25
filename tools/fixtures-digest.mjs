#!/usr/bin/env node
/**
 * Pins the fixture corpus so a change to the PRNG, class specs or history model is a deliberate act.
 *   node tools/fixtures-digest.mjs            check against shared/fixtures/corpus-digest.json
 *   node tools/fixtures-digest.mjs --update   rewrite the pin (do this only on purpose; read the diff of the consumers)
 * Negative control: a corpus with one attempt altered must produce a different digest, else exit 3.
 * Exit codes: 0 match, 1 mismatch, 3 error.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fixtureCorpus } from "../shared/fixtures/index.js";
import { canonicalJson } from "../shared/flags/evaluate.js";

const PIN = fileURLToPath(new URL("../shared/fixtures/corpus-digest.json", import.meta.url));

export function corpusDigest(corpus = fixtureCorpus()) {
  return createHash("sha256").update(canonicalJson(corpus)).digest("hex");
}

function main() {
  const corpus = fixtureCorpus();
  const digest = corpusDigest(corpus);
  const altered = structuredClone(corpus);
  const first = Object.values(altered.histories)[0][0];
  first.correct = !first.correct;
  if (corpusDigest(altered) === digest) {
    console.error(
      "fixtures-digest: negative control failed (an altered corpus has the same digest)",
    );
    process.exit(3);
  }
  if (process.argv.includes("--update")) {
    writeFileSync(
      PIN,
      `${JSON.stringify({ algorithm: "sha256 of canonicalJson(fixtureCorpus())", digest }, null, 2)}\n`,
    );
    console.log(`fixtures-digest: pinned ${digest}`);
    return;
  }
  const pinned = JSON.parse(readFileSync(PIN, "utf8")).digest;
  if (pinned !== digest) {
    console.error(
      `fixtures-digest: corpus changed\n  pinned ${pinned}\n  actual ${digest}\n  re-pin with --update if intended`,
    );
    process.exit(1);
  }
  console.log(`fixtures-digest: ok ${digest.slice(0, 12)} (${corpus.classes.length} classes)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(`fixtures-digest error: ${err.message}`);
    process.exit(3);
  }
}
