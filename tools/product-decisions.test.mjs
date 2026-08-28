#!/usr/bin/env node
/* =============================================================================
 * product-decisions.test.mjs — a gate may not enforce a decision nobody made.
 *
 * WHY THIS EXISTS. A contract check is one of two things, and in the source they
 * are indistinguishable:
 *
 *   REGRESSION PIN   this exact defect shipped, here is the line that regressed,
 *                    and the mutation test proves the detector catches it.
 *                    Removing it is a regression.
 *   PRODUCT DECISION somebody decided the product should behave this way.
 *                    Removing it is a decision reversal, which may be correct.
 *
 * On 2026-08-26 an agent read "Part 1 has no forward link to its own -part2
 * page" as a defect, invented the answer — a "Continue to Part 2: Apply Day"
 * card closing Act 3 — shipped it, and pinned it in act-flow-contract.test.mjs
 * beside five genuine regression pins, mutation-proven, in the same list. Joel
 * had never been asked. Two days later he said the card should not exist, which
 * meant deleting it read as breaking a verified invariant. That is the whole
 * failure: being contract-frozen gave an unreviewed decision the authority of a
 * proven fact, and nothing in the file could tell you which it was.
 *
 * THE TEST FOR LEGITIMACY IS PROVENANCE. If you cannot name the human who
 * decided it and quote what they said, it is not a product decision — it is an
 * agent's default, and it must not be a gate. So this test holds
 * data/product-decisions.json to exactly that: a named human who is not an
 * agent, a real date, their actual words, and a pin that exists and names the
 * decision back.
 *
 * It deliberately does NOT try to classify the other ~107 gates. Nothing in the
 * source distinguishes a defect pin from a decision — that is the premise. This
 * enforces the standard on decisions once someone has recognised one, and gives
 * the next agent somewhere to look before "fixing" a red contract check.
 * ========================================================================== */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const REGISTRY = join(ROOT, "data/product-decisions.json");

const raw = JSON.parse(readFileSync(REGISTRY, "utf8"));
const decisions = raw.decisions;

assert.ok(Array.isArray(decisions), "data/product-decisions.json has no decisions array");

/* An agent is not a decider. This is the check the Apply Day card would have
 * failed on the day it was pinned: no human had said anything about it, so
 * there was no name to write down and no sentence to quote. */
const NOT_A_HUMAN =
  /^(claude|codex|gemini|agent|assistant|ai|bot|copilot|the model|unknown|n\/a|-)$/i;

/** Every field a decision must carry to be enforceable by a gate. */
export function decisionComplaint(d, allIds, fileExists, fileText) {
  if (!d || typeof d !== "object") return "not an object";
  for (const field of [
    "id",
    "surface",
    "decision",
    "decidedBy",
    "decidedOn",
    "because",
    "pinnedBy",
    "pinnedCheck",
  ]) {
    if (!d[field] || typeof d[field] !== "string" || !d[field].trim())
      return `${d.id || "(no id)"}: missing ${field}`;
  }
  if (allIds.filter((x) => x === d.id).length > 1) return `${d.id}: duplicate id`;
  if (NOT_A_HUMAN.test(d.decidedBy.trim()))
    return `${d.id}: decidedBy is "${d.decidedBy}" — an agent's own answer is a default, not a decision, and must not be a gate`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.decidedOn)) return `${d.id}: decidedOn is not an ISO date`;
  if (Number.isNaN(Date.parse(d.decidedOn))) return `${d.id}: decidedOn is not a real date`;
  if (Date.parse(d.decidedOn) > Date.now() + 864e5) return `${d.id}: decidedOn is in the future`;
  /* Their actual words, not a paraphrase. A paraphrase is the agent's reading of
   * the decision, which is the thing that went wrong in the first place. 25
   * characters is short enough for a real one-liner and long enough to reject
   * "Joel said so". */
  if (d.because.trim().length < 25)
    return `${d.id}: because is too short to be a quotation — write what they actually said`;
  if (!fileExists) return `${d.id}: pinnedBy ${d.pinnedBy} does not exist`;
  if (!fileText.includes(d.pinnedCheck))
    return `${d.id}: ${d.pinnedBy} does not contain ${d.pinnedCheck} — a decision whose pin is gone is either unenforced or stale`;
  return null;
}

/* ── mutation self-test: the detector must reject every bad shape ─────────── */
{
  const good = {
    id: "x",
    surface: "s",
    decision: "d",
    decidedBy: "Joel",
    decidedOn: "2026-08-28",
    because: "there should not be a continue to apply day button",
    pinnedBy: "tools/whatever.test.mjs",
    pinnedCheck: "someCheck",
  };
  const mutants = [
    // the exact shape the Apply Day pin had: no human ever decided it
    { ...good, decidedBy: "Claude" },
    { ...good, decidedBy: "agent" },
    { ...good, because: "Joel said so" },
    { ...good, decidedOn: "August 2026" },
    { ...good, decidedOn: "2030-01-01" },
    { ...good, pinnedCheck: "aCheckThatIsNotThere" },
    { ...good, id: "" },
  ];
  const caught = mutants.filter(
    (m) => decisionComplaint(m, [m.id], true, "someCheck") !== null,
  ).length;
  assert.equal(
    caught,
    mutants.length,
    "a provenance detector stopped firing — an unreviewed decision would pass as a reviewed one",
  );
  assert.equal(
    decisionComplaint(good, ["x"], true, "function someCheck() {}"),
    null,
    "the detector rejects a properly recorded decision",
  );
}

let failures = 0;
const allIds = decisions.map((d) => d && d.id);
for (const d of decisions) {
  const pinPath = d && d.pinnedBy ? join(ROOT, d.pinnedBy) : "";
  const exists = !!pinPath && existsSync(pinPath);
  const text = exists ? readFileSync(pinPath, "utf8") : "";
  const complaint = decisionComplaint(d, allIds, exists, text);
  if (complaint) {
    failures += 1;
    console.error(`  FAIL  ${complaint}`);
  }
}

assert.equal(
  failures,
  0,
  `${failures} product decision(s) are enforced by a gate without provenance. Name the human and quote them, or stop gating it.`,
);

console.log(
  `product-decisions: PASS (${decisions.length} gated decision(s), each with a named human and their words; 7 mutation-proven)`,
);
