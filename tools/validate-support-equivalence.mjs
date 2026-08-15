#!/usr/bin/env node
/* =============================================================================
 * validate-support-equivalence.mjs — screen, print and export must not disagree
 * about what a teacher turned on.
 *
 * THE FAILURE THIS PREVENTS. A teacher applies sentence frames, teaches from
 * the supported lesson, prints the packet — and the packet has no frames. No
 * per-file check can see that: the screen code is correct, the print code is
 * correct, and each is correct about a different thing. The only way to catch
 * it is to resolve the SAME configuration through every surface and compare.
 *
 * Surfaces are allowed to differ. Paper cannot speak. But every difference must
 * be DECLARED in the MODALITY table, and a declared difference must carry the
 * thing it degrades to. An undeclared difference is a failure, which is what
 * turns MODALITY from documentation into a contract.
 *
 * It also checks the other direction — the one a modality table cannot express:
 * a support that claims to be ACTIVE on paper must actually produce something
 * on paper. "Active" with no block is the same lie as a toggle with no
 * behaviour, one surface further along.
 *
 * Self-tests its detectors first: a gate that has stopped firing reports a
 * perfectly consistent system.
 * ========================================================================== */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODULE_PATH = join(ROOT, "shared", "supports", "lesson-supports.js");
const MANIFEST_PATH = join(ROOT, "assets", "learning-supports", "manifest.json");
const OVERRIDES_PATH = join(ROOT, "data", "lesson-support-overrides.json");

function loadModule() {
  const mod = { exports: {} };
  new Function("module", "globalThis", readFileSync(MODULE_PATH, "utf8"))(mod, {});
  return mod.exports;
}

const errors = [];
const fail = (m) => errors.push(m);

function ctxFor(overrides, lessonId) {
  const o = (overrides.lessons || {})[lessonId] || {};
  return {
    computationIsObjective: !!o.computationIsObjective,
    factRecallIsObjective: !!o.factRecallIsObjective,
    pin: Array.isArray(o.pin) ? o.pin : [],
    excluded: Array.isArray(o.exclude) ? o.exclude.map((e) => e.key || e) : [],
  };
}

function main() {
  const LS = loadModule();
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const overrides = JSON.parse(readFileSync(OVERRIDES_PATH, "utf8"));

  /* -- self-test: the detectors still fire --------------------------------- */
  {
    const probe = LS.resolveEffectiveSupports({
      lessonId: "5-3",
      store: { "5-3": LS.normalizeProfile({ keys: ["read-aloud", "word-bank"] }, "5-3") },
      entry: manifest["5-3"],
      surface: "print",
    });
    if (probe.teacherNotes.length !== 1 || probe.teacherNotes[0].key !== "read-aloud") {
      fail(
        "Self-test: read-aloud no longer degrades to a teacher note on paper — this gate is blind.",
      );
    }
    if (!probe.active.includes("word-bank")) {
      fail(
        "Self-test: a printable support no longer resolves as active on paper — this gate is blind.",
      );
    }
  }

  /* -- the sweep ------------------------------------------------------------
   * Every lesson, every applicable support, one at a time AND all together.
   * One at a time isolates the support that diverges; all together catches an
   * interaction (a conflict rule that quietly drops one). */
  let comparisons = 0;
  let declaredDifferences = 0;

  for (const lessonId of Object.keys(manifest)) {
    const entry = manifest[lessonId];
    const ctx = ctxFor(overrides, lessonId);
    const applicable = LS.applicableSupports(entry, ctx)
      .filter((s) => !ctx.excluded.includes(s.key))
      .map((s) => s.key);

    const sets = applicable.map((k) => [k]);
    sets.push(applicable); // and the whole lot at once

    for (const keys of sets) {
      if (!keys.length) continue;
      const store = { [lessonId]: LS.normalizeProfile({ keys }, lessonId) };
      const per = {};
      for (const surface of LS.SURFACES) {
        per[surface] = LS.resolveEffectiveSupports({ lessonId, store, entry, surface, ctx });
      }
      comparisons++;

      const screen = new Set(per.screen.active);
      for (const surface of ["print", "export"]) {
        const here = new Set(per[surface].active);
        const noted = new Set(per[surface].teacherNotes.map((t) => t.key));
        for (const key of screen) {
          if (here.has(key)) continue;
          const declared = LS.modalityFor(key, surface);
          if (declared === "active") {
            fail(
              `${lessonId}: "${key}" is active on screen and declared active on ${surface}, but did not resolve there`,
            );
          } else if (declared === "teacher-note") {
            declaredDifferences++;
            if (!noted.has(key)) {
              fail(
                `${lessonId}: "${key}" degrades to a teacher note on ${surface} but no note was produced — the teacher is told nothing`,
              );
            }
          } else if (declared === "n/a") {
            declaredDifferences++;
          } else {
            fail(
              `${lessonId}: "${key}" is on screen and missing from ${surface} with NO modality rule explaining it`,
            );
          }
        }
        // Nothing may appear on paper that the teacher did not turn on.
        for (const key of here) {
          if (!screen.has(key)) {
            fail(
              `${lessonId}: "${key}" is active on ${surface} but not on screen — paper invented a support`,
            );
          }
        }
      }

      /* A support that claims to be ACTIVE on paper must PRODUCE something on
       * paper. This is the check the modality table cannot make about itself. */
      const blocks = LS.supportBlocks(per.print.active, entry);
      const produced = new Set(blocks.map((b) => b.key));
      for (const key of per.print.active) {
        // The modification does not add a block; it marks the tail of the
        // practice set optional, which is asserted by the print regression test
        // against real generated markup rather than here.
        if (key === "shorter-practice-set") continue;
        // Visual vocabulary and bilingual vocabulary render as ONE block.
        if (key === "visual-vocabulary" && produced.has("bilingual-vocabulary")) continue;
        if (!produced.has(key)) {
          fail(
            `${lessonId}: "${key}" is declared active on paper but contributes nothing to a printed page`,
          );
        }
      }
      for (const b of blocks) {
        if (!LS.byKey[b.key]) fail(`${lessonId}: print block names unknown support "${b.key}"`);
        if (!b.title) fail(`${lessonId}: print block for "${b.key}" has no heading`);
      }
    }
  }

  if (!comparisons) fail("Zero comparisons ran — this gate checked nothing.");
  if (!declaredDifferences) {
    fail(
      "Zero declared modality differences were exercised. Either every support now works identically " +
        "on paper (check that MODALITY is still being read) or the sweep is not reaching the teacher-note cases.",
    );
  }

  if (errors.length) {
    console.error(`FAIL validate:support-equivalence — ${errors.length} problem(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(
    `PASS validate:support-equivalence — ${comparisons} configurations compared across ` +
      `${LS.SURFACES.length} surfaces; ${declaredDifferences} modality differences, all declared.`,
  );
}

main();
