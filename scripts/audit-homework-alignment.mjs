#!/usr/bin/env node
/**
 * Audit all family homework.html files for tab UI, games, links, alignment, and no curriculum nav.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { assertNonEmpty } from "../tools/lib/non-empty.mjs";
import { assertSweptEnough } from "../tools/lib/sweep-guard.mjs";
import {
  detectVisualMismatch,
  findNoteOwnershipConflicts,
  scoreHomeworkAlignment,
} from "./homework-alignment.mjs";

const root = join(import.meta.dirname, "..");

import { LESSONS_DIR as lessonsDir } from "../tools/lib/curriculum-source.mjs";

/* THE SUBJECT IS EVERY PAGE THAT EXISTS, not every page whose name was
   anticipated. This used to be `/^(\d+)-(\d+)(-flagship)?$/`, and a name-shaped
   filter silently shrinks: the 76 `-part2` homeworks shipped outside it and were
   ranked against the OTHER session's mathematics with every gate green, and
   widening it by hand to `-part2` STILL missed four more — the bridge lessons
   `1-practice`, `1-review`, `6-1-6-2-practice` and `6-1-6-2-practice-part2`, all
   four live and returning 200. Discovery is now "the directory ships a
   homework.html", which is the thing this audit is named for and cannot be
   outgrown by the next id shape somebody invents. */
const ORDER_RE = /^(\d+)-(\d+)/;

const REQUIRED_MARKERS = [
  {
    id: "tab-bar",
    test: (h) => h.includes('class="homework-tab-bar"') && h.includes("switchHomeworkTab"),
  },
  {
    // SIX STOPS. This used to require eight tab panels including "help" and
    // "more" — which pinned a decision (that help and the online links are
    // DESTINATIONS) rather than a defect. They are not: help is needed while
    // working the Check problems, and as tab 8 of 10 it was unreachable exactly
    // then. What must hold is that nothing was LOST, so the checks below assert
    // reachability instead of tab-ness.
    id: "all-tabs",
    test: (h) =>
      ["learn", "words", "together", "check", "play", "done"].every((t) =>
        h.includes(`data-tab-panel="${t}"`),
      ) && !h.includes('data-tab-panel="help"'),
  },
  {
    // Help still exists, still carries the say / do-not-say coaching, and now
    // opens over whichever stop the family is standing on.
    id: "help-reachable",
    test: (h) =>
      h.includes('id="hw_help_drawer"') &&
      h.includes("toggleHelpDrawer") &&
      h.includes("stuck-heading"),
  },
  {
    // The manipulatives moved into Together rather than disappearing.
    id: "workbench-reachable",
    test: (h) => h.includes("workbench-drawer") && h.includes("switchWorkbenchTool"),
  },
  {
    // Every game lives in one arcade on the Play stop: the four family games
    // plus the two that used to be tabs of their own (the quiz and the full
    // Practice Arcade iframe).
    id: "play-game",
    test: (h) =>
      h.includes('data-tab-panel="play"') &&
      (h.includes("hw-game") || h.includes("initHomeworkGame")) &&
      ["memory", "tf", "sort", "wyr", "quiz", "full"].every((g) =>
        h.includes(`data-arcade-game="${g}"`),
      ),
  },
  {
    id: "external-links",
    test: (h) => h.includes("external-resource-list") && h.includes("external-resource-link"),
  },
  {
    id: "help-modal",
    test: (h) => h.includes("help_modal_overlay") && h.includes("openHelpModalFromBtn"),
  },
  { id: "bilingual", test: (h) => h.includes('lang="es"') && h.includes("Ayuda a tu estudiante") },
  {
    id: "no-curriculum",
    test: (h) => {
      // Allow student practice tools (AI Learning Lab + Math Workbench).
      const stripped = h.replace(/\/curriculum\/(ai-hub|math-workbench)\/[^"'\s]*/gi, "");
      return (
        !/\/curriculum\//i.test(stripped) &&
        !/Back to curriculum/i.test(h) &&
        !/Curriculum Hub/i.test(h)
      );
    },
  },
];

function loadLessons() {
  return readdirSync(lessonsDir)
    .filter(
      (d) =>
        existsSync(join(lessonsDir, d, "config.json")) &&
        existsSync(join(lessonsDir, d, "homework.html")),
    )
    .sort((a, b) => {
      /* Unit/lesson order where the id carries one; a bridge id like
         `6-1-6-2-practice` still leads with its unit, and anything with no
         leading number sorts by name rather than being dropped. */
      const m1 = a.match(ORDER_RE);
      const m2 = b.match(ORDER_RE);
      if (!m1 || !m2) return m1 ? -1 : m2 ? 1 : a.localeCompare(b);
      return Number(m1[1]) - Number(m2[1]) || Number(m1[2]) - Number(m2[2]) || a.localeCompare(b);
    })
    .map((id) => {
      const config = JSON.parse(readFileSync(join(lessonsDir, id, "config.json"), "utf8"));
      /* Merge the curated family-note sidecar exactly the way
         scripts/generate-homework-html.mjs does, so this audit scores the text a
         parent actually reads. Reading only config.json is what let a whole
         directory of notes drift onto the wrong lessons unnoticed. */
      const notesPath = join(root, "data", "family-homework-notes", `${id}.json`);
      if (existsSync(notesPath)) {
        config.familyNotes = {
          ...JSON.parse(readFileSync(notesPath, "utf8")),
          ...(config.familyNotes || {}),
        };
      }
      return { id, config, html: readFileSync(join(lessonsDir, id, "homework.html"), "utf8") };
    });
}

const lessons = loadLessons();
/* One entry per lesson directory that ships family homework. Pinned so a lesson
   that silently stops generating homework fails here instead of shrinking the
   denominator and still reporting "all compliant". Was 74 until the book-TOC
   renumber brought the curriculum to 84. */
const expectedCount = 164;
const failures = [];
const alignmentRows = [];

assertNonEmpty(
  "lessons to audit",
  lessons,
  "loadLessons() returned nothing — a zero-lesson audit reports zero misalignments.",
);
assertSweptEnough(
  "audit:homework",
  lessons,
  "Discovery for audit:homework returned far fewer items than this gate's pinned floor — see data/sweep-floors.json.",
);
console.log(`\nHomework alignment audit — ${lessons.length} lessons\n`);

if (lessons.length !== expectedCount) {
  failures.push(
    `lesson count: expected ${expectedCount}, found ${lessons.length} — update expectedCount if this is intentional`,
  );
}

// The optional "More practice" accordion intentionally pulls a broader pool that
// may include lower-aligned bonus problems. Alignment is judged on the core
// (required) problems only, so strip the accordion before scoring. The block
// contains nested <details> (step guides), so match its close by counting depth.
function stripMorePractice(html) {
  const start = html.indexOf('<details class="more-practice"');
  if (start < 0) return html;
  let pos = html.indexOf(">", start) + 1;
  let depth = 1;
  while (depth > 0 && pos < html.length) {
    const open = html.indexOf("<details", pos);
    const close = html.indexOf("</details>", pos);
    if (close < 0) break;
    if (open >= 0 && open < close) {
      depth++;
      pos = open + 8;
    } else {
      depth--;
      pos = close + 10;
    }
  }
  return html.slice(0, start) + html.slice(pos);
}

for (const { id, config, html } of lessons) {
  const lessonFails = [];

  for (const marker of REQUIRED_MARKERS) {
    if (!marker.test(html)) {
      lessonFails.push(marker.id);
    }
  }

  const coreHtml = stripMorePractice(html);
  const { score, issues } = scoreHomeworkAlignment(config, coreHtml);
  const { wrongTopic } = detectVisualMismatch(config, coreHtml);
  const aligned = score >= 70 && !wrongTopic;

  alignmentRows.push({ id, score, aligned, issues });

  if (!aligned) {
    lessonFails.push(`alignment(score=${score}${issues.length ? `: ${issues.join("; ")}` : ""})`);
  }

  if (lessonFails.length) {
    failures.push({ id, fails: lessonFails });
  }
}

/* Findings a human has read. Held to the same standard as the tree: a reason
   under 40 characters is rejected, and an entry whose finding no longer fires
   must be deleted rather than left behind as a stale absolution. */
const REVIEW_PATH = join(root, "data", "homework-alignment-review.json");
const reviewed = existsSync(REVIEW_PATH)
  ? JSON.parse(readFileSync(REVIEW_PATH, "utf8")).reviewed || []
  : [];
for (const entry of reviewed) {
  if (!entry.id || !entry.kind || String(entry.reason || "").length < 40) {
    failures.push(
      `homework-alignment-review: ${entry.id || "(no id)"} needs an id, a kind and a reason of at least 40 characters`,
    );
  }
}
const isReviewed = (id, kind) => reviewed.some((e) => e.id === id && e.kind === kind);
const clearedAlignment = new Set();
for (let i = failures.length - 1; i >= 0; i--) {
  const f = failures[i];
  if (typeof f === "string") continue;
  const rest = f.fails.filter(
    (t) => !(t.startsWith("alignment(") && isReviewed(f.id, "alignment")),
  );
  if (rest.length === f.fails.length) continue;
  clearedAlignment.add(f.id);
  if (rest.length) failures[i] = { id: f.id, fails: rest };
  else failures.splice(i, 1);
}
/* A reviewed entry the audit no longer flags is stale and must go. */
for (const entry of reviewed) {
  if (entry.kind !== "alignment") continue;
  if (!clearedAlignment.has(entry.id)) {
    failures.push(
      `homework-alignment-review: ${entry.id} no longer fires an alignment finding — delete the entry`,
    );
  }
}

const passCount = lessons.length - failures.length;
const alignedCount = alignmentRows.filter((r) => r.aligned).length;

console.log("Structure & policy checks:");
for (const marker of REQUIRED_MARKERS) {
  const ok = lessons.filter((l) => marker.test(l.html)).length;
  console.log(`  ${ok === lessons.length ? "✓" : "✗"} ${marker.id}: ${ok}/${lessons.length}`);
}

/* Is each curated family note on the lesson it belongs to? Nothing checked this
   until 2026-08-11, which is how an entire directory of notes kept the
   pre-renumber lesson ids while this audit reported "84/84 fully compliant". */
const ownership = findNoteOwnershipConflicts(lessons);
for (const c of ownership) {
  if (isReviewed(c.id, "note-ownership")) continue;
  failures.push(
    `${c.id}: family note looks like ${c.suspectedOwner}'s lesson (score ${c.bestScore} vs ${c.ownScore}) — "${c.text}…"`,
  );
}
for (const entry of reviewed) {
  if (entry.kind !== "note-ownership") continue;
  if (!ownership.some((c) => c.id === entry.id)) {
    failures.push(
      `homework-alignment-review: ${entry.id} no longer fires a note-ownership finding — delete the entry`,
    );
  }
}
console.log(
  `Family notes: ${lessons.length - ownership.length}/${lessons.length} on the right lesson`,
);

console.log(
  `\nTopic alignment: ${alignedCount}/${lessons.length} aligned (score ≥70, no wrong-topic visual)`,
);

if (failures.length) {
  console.log(`\n❌ FAIL — ${passCount}/${lessons.length} pass\n`);
  /* `failures` holds two shapes — a per-lesson {id, fails} and a plain string
     from the lesson-count and note-ownership checks. Printing only the first
     shape crashed the reporter on the string, so the run that FOUND a problem
     was the run that died before naming it. */
  for (const f of failures.slice(0, 20)) {
    console.log(typeof f === "string" ? `  ${f}` : `  ${f.id}: ${f.fails.join(", ")}`);
  }
  if (failures.length > 20) {
    console.log(`  … and ${failures.length - 20} more`);
  }
  process.exit(1);
}

console.log(`\n✅ PASS — ${passCount}/${lessons.length} lessons fully compliant\n`);
process.exit(0);
