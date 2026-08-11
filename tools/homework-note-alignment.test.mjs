/**
 * The family-note half of the homework alignment gate.
 *
 * scripts/audit-homework-alignment.mjs reported "84/84 aligned" for months while
 * every note in data/family-homework-notes/ sat on the WRONG lesson: the notes
 * were keyed to the pre-renumber ids, so lesson 5-2 ("Determine the Area of
 * Triangles") shipped a parent note teaching trapezoids. The audit never read
 * the note at all — it scored only the generated problems and visuals.
 *
 * This test pins the detector added on 2026-08-11 in BOTH directions, because a
 * check that quietly stops firing is indistinguishable from a clean curriculum:
 *
 *   · the real curriculum must report zero conflicts, and
 *   · 5-3's note pasted onto 5-2 — the exact defect that shipped — must be
 *     caught AND attributed to 5-3.
 *
 * The second assertion is the one that matters. A first attempt at this detector
 * scored keyword overlap and passed the shipped defect happily, because the
 * trapezoid note and the triangle lesson share area, base, height, formula,
 * multiply and half. Overlap alone cannot tell sibling lessons apart.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  findNoteOwnershipConflicts,
  NOTE_OWNERSHIP_GAP,
  scoreHomeworkAlignment,
} from "../scripts/homework-alignment.mjs";

const root = join(import.meta.dirname, "..");
const lessonsDir = join(root, "lessons");
const notesDir = join(root, "data", "family-homework-notes");

const ids = readdirSync(lessonsDir, { withFileTypes: true })
  .filter((e) => e.isDirectory() && /^\d+-\d+$/.test(e.name))
  .map((e) => e.name)
  .filter((id) => existsSync(join(lessonsDir, id, "homework.html")))
  .sort();

function buildCorpus() {
  return ids.map((id) => {
    const config = JSON.parse(readFileSync(join(lessonsDir, id, "config.json"), "utf8"));
    const notePath = join(notesDir, `${id}.json`);
    if (existsSync(notePath)) {
      config.familyNotes = JSON.parse(readFileSync(notePath, "utf8"));
    }
    return { id, config };
  });
}

// ── 1. The shipped curriculum is clean. ────────────────────────────────────
{
  const conflicts = findNoteOwnershipConflicts(buildCorpus());
  assert.deepEqual(
    conflicts,
    [],
    `family notes on the wrong lesson:\n  ${conflicts
      .map((c) => `${c.id} looks like ${c.suspectedOwner}: ${c.text}`)
      .join("\n  ")}`,
  );
}

// ── 2. The defect that actually shipped is caught and attributed. ──────────
{
  const corpus = buildCorpus();
  const l52 = corpus.find((l) => l.id === "5-2"); // Determine the Area of Triangles
  const l53 = corpus.find((l) => l.id === "5-3"); // Determine the Area of Trapezoids
  l52.config.familyNotes = l53.config.familyNotes;

  const conflicts = findNoteOwnershipConflicts(corpus);
  const hit = conflicts.find((c) => c.id === "5-2");
  assert.ok(
    hit,
    "the trapezoid note on the triangle lesson must be caught — this is the bug that shipped",
  );
  assert.equal(
    hit.suspectedOwner,
    "5-3",
    "the conflict must name the lesson the note really belongs to",
  );
}

// ── 3. The threshold still separates the two cases. ────────────────────────
// If honest sibling overlap ever reaches the trigger gap, the detector starts
// crying wolf and will be turned off. Fail here first, while it is fixable.
{
  const corpus = buildCorpus();
  const swapped = buildCorpus();
  swapped.find((l) => l.id === "5-2").config.familyNotes = swapped.find(
    (l) => l.id === "5-3",
  ).config.familyNotes;
  const injected = findNoteOwnershipConflicts(swapped).find((c) => c.id === "5-2");
  assert.ok(
    injected.bestScore - injected.ownScore > NOTE_OWNERSHIP_GAP,
    "the injected defect must clear the threshold with room to spare",
  );
  assert.equal(findNoteOwnershipConflicts(corpus).length, 0);
}

// ── 4. An empty note is reported rather than silently scoring fine. ────────
{
  const config = JSON.parse(readFileSync(join(lessonsDir, "5-2", "config.json"), "utf8"));
  config.familyNotes = { learningTonight: { en: "" }, bigIdea: { en: "" } };
  const result = scoreHomeworkAlignment(
    config,
    readFileSync(join(lessonsDir, "5-2", "homework.html"), "utf8"),
  );
  assert.ok(
    result.issues.some((i) => /Family note/i.test(i)),
    "a note with no English summary must be reported",
  );
}

// ── 5. Every lesson shipping homework has a curated note to check. ─────────
const missing = ids.filter((id) => !existsSync(join(notesDir, `${id}.json`)));
assert.deepEqual(missing, [], `lessons shipping homework with no curated family note: ${missing}`);
assert.ok(ids.length >= 84, `expected the full curriculum to be scored, found ${ids.length}`);

console.log(
  `homework note alignment: ${ids.length} notes on the right lesson, detector fires on the shipped defect.`,
);
