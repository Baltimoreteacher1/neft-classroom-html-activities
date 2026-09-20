#!/usr/bin/env node
/**
 * generate-worksheets.mjs — the printed practice packets for every lesson.
 *
 * Sourced from lessons/<id>/config.json (the problems, the worked example, the
 * words, the common mistake) and, where the district's Reveal practice sheet
 * exists for the lesson, from its committed snapshot (see
 * scripts/lib/worksheet-reveal.mjs), so the packet a student takes home opens
 * with the same support page the class worked from.
 *
 * Outputs per lesson:
 *   • lessons/<id>/worksheet.html                — Set A: START HERE page + practice editions
 *   • lessons/<id>/worksheet-answer-key.html     — Set A teacher key
 *   • lessons/<id>/worksheet-2.html              — Set B: a second form, new problems
 *   • lessons/<id>/worksheet-2-answer-key.html   — Set B teacher key
 *
 * Set A prints the lesson's authored practice tiers in full — Version A
 * (supported: hints and sentence starters), Version B (core), Challenge
 * (extension). Small-group and Apply Day lessons print their own editions.
 * Set B is composed ONLY of problems the author already wrote and Set A does
 * not print; see scripts/lib/worksheet-set-b.mjs for the reserve and why
 * nothing here re-numbers an authored stem.
 *
 * Audience gating: the student sheet carries no `ws-correct` / `ws-keynote`
 * markup and never the words "Answer Key" (tools/validate-worksheet-audience.mjs).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LESSONS_DIR as LESSONS, listLessonDirs } from "../tools/lib/curriculum-source.mjs";
import { EDITORIAL_OVERRIDES } from "./lib/editorial-print.mjs";
import { isGeneratedFresh, writeGenerated } from "./lib/preserve-injected.mjs";
import { esc } from "./lib/worksheet-figures.mjs";
import {
  confidenceBar,
  explainBlock,
  packetHeader,
  WORKSHEET_CSS,
  writeYourOwnBlock,
} from "./lib/worksheet-layout.mjs";
import { renderProblem, sectionedProblems } from "./lib/worksheet-problems.mjs";
import { revealFor } from "./lib/worksheet-reveal.mjs";
import { kindOf, partTwoSplit, SET_A_TIER_CAP, setBPages } from "./lib/worksheet-set-b.mjs";
import { exampleBlock, rememberBox, supportPage } from "./lib/worksheet-support.mjs";

const printable = (pool) => (pool || []).filter((p) => p && (p.type || p.stem || p.prompt));

/* ── which editions a lesson prints (Set A) ────────────────────────────── */

const LEVEL_ZERO_COUNT = 4;

const CORE_TIERS = [
  { key: "approaching", label: "Version A", note: "Supported practice", supported: true },
  { key: "onLevel", label: "Version B", note: "Core practice", supported: false },
  { key: "extending", label: "Challenge", note: "Extension", supported: false },
];

const PART_TWO_TIERS = [
  { label: "Apply Day · Version A", note: "Supported practice", supported: true },
  { label: "Apply Day · Version B", note: "Core practice", supported: false },
  { label: "Apply Day · Challenge", note: "Extension", supported: false },
];

/**
 * The Set A editions for a lesson: [{pool, label, note, supported, extras}].
 * A group lesson prints one edition; a core lesson prints each authored tier
 * that has problems. Nothing prints twice — the old "Level 0" page, which was
 * the first four Version A problems under another name, is gone.
 */
function setAEditions(cfg) {
  const id = cfg.lessonId || "";
  const kind = kindOf(id, cfg);
  const approaching = printable(cfg.practice?.approaching);
  const onLevel = printable(cfg.practice?.onLevel);
  const extending = printable(cfg.practice?.extending);

  if (kind === "partTwo") {
    const split = partTwoSplit(cfg);
    const single = {
      label: "Apply Day · Practice",
      note: "Today's problem, on paper",
      supported: true,
    };
    return split.setA
      .map((pool, i) => ({ pool, ...(split.tiered ? PART_TWO_TIERS[i] : single) }))
      .filter((t) => t.pool.length);
  }
  if (kind === "group1") {
    const pool = (approaching.length ? approaching : onLevel).slice(0, 6);
    return [{ pool, label: "Group 1", note: "Supported practice", supported: true }];
  }
  if (kind === "group2") {
    const pool = (extending.length ? extending : onLevel).slice(0, 6);
    return [
      { pool, label: "Group 2", note: "Challenge practice", supported: false, extras: "author" },
    ];
  }
  if (kind === "catchup") {
    const pool = (approaching.length ? approaching : onLevel).slice(0, 5);
    return [{ pool, label: "Catch-Up", note: "Skill bridge", supported: true }];
  }
  return CORE_TIERS.map((t) => ({
    ...t,
    pool: printable(cfg.practice?.[t.key]).slice(0, SET_A_TIER_CAP),
  })).filter((t) => t.pool.length);
}

/**
 * Level 0 — most support — is its OWN sheet (worksheet-level-0.html), not a
 * page of Set A: a teacher hands it to the students who work from it, and the
 * packet everyone else gets stays short. The first four Version A problems as
 * the app's Level 0 delivers them: every authored hint printed as steps to
 * try, the worked example on the page, sentence starters on. Core lessons only.
 */
function levelZeroEdition(cfg) {
  if (kindOf(cfg.lessonId || "", cfg) !== "core") return null;
  const pool = printable(cfg.practice?.approaching).slice(0, LEVEL_ZERO_COUNT);
  if (!pool.length) return null;
  return {
    pool,
    label: "Level 0",
    note: "Most support · every hint printed",
    supported: "all",
    extras: "example",
  };
}

/* ── one edition page ──────────────────────────────────────────────────── */

/* An Apply Day config is titled "3.1 · Part II"; the district's Session 2
   sheet names the session ("Ratios with Tape Diagrams"), and that is the
   title a student recognises. */
function packetTitle(cfg, reveal) {
  if (reveal?.sessionTitle && /^\d+\.\d+\s*·\s*Part\s*II$/i.test(String(cfg.title || ""))) {
    return reveal.sessionTitle;
  }
  return cfg.title || cfg.lessonId || "Practice";
}

function editionPage(cfg, edition, { isKey = false, lead = "", title = "", reveal = null } = {}) {
  const commonMistake = isKey ? cfg.practice?.commonMistake || "" : "";
  if (edition.extras === "example" && !isKey) lead += exampleBlock(cfg, reveal);
  const problems = sectionedProblems(edition.pool, (p, n) =>
    renderProblem(p, n, { key: isKey, supported: edition.supported, commonMistake }),
  );
  const closing = isKey
    ? ""
    : `${explainBlock(cfg, { supported: edition.supported })}${edition.extras === "author" ? writeYourOwnBlock() : ""}${confidenceBar()}`;
  return `<section class="ws-page ${isKey ? "ws-key-page" : "ws-edition-page"}">
    ${packetHeader(cfg, { edition: edition.label, note: edition.note, isKey, target: cfg.contentObjective || "", title })}
    ${lead}
    ${problems}
    ${closing}
  </section>`;
}

/* ── the packet ────────────────────────────────────────────────────────── */

export function buildWorksheet(cfg, { key = false, set = "A" } = {}) {
  const lessonId = cfg.lessonId || "";
  const reveal = revealFor(lessonId);
  const audience = key ? "teacher" : "student";
  const title = packetTitle(cfg, reveal);
  const suffixBase =
    set === "B" ? "Practice Set B" : set === "L0" ? "Practice Level 0" : "Practice";
  const titleSuffix = key ? `${suffixBase} Answer Key` : `${suffixBase} Worksheet`;

  let pages = [];
  if (set === "L0") {
    const edition = levelZeroEdition(cfg);
    if (!edition) return "";
    if (!key) {
      const support = supportPage(cfg, reveal, {
        header: packetHeader(cfg, {
          edition: "Start here",
          note: "Words, worked example, and sentence starters",
          mastery: false,
          target: cfg.contentObjective || "",
          title,
        }),
      });
      if (support.html) pages.push(support.html);
    }
    pages.push(editionPage(cfg, edition, { isKey: key, title, reveal }));
  } else if (set === "B") {
    // Every Set B page runs through the one edition builder: the reserve is a
    // flat list of practice items regardless of lesson kind. The first page
    // opens with a short REMEMBER box instead of the full START HERE page,
    // which already went home with Set A.
    const editions = setBPages(cfg).map((p) => ({
      pool: p.pool,
      label: p.label,
      note: p.sub,
      supported: p.supported,
    }));
    pages = editions.map((e, i) =>
      editionPage(cfg, e, {
        isKey: key,
        lead: i === 0 && !key ? rememberBox(cfg, reveal) : "",
        title,
      }),
    );
  } else {
    const editions = setAEditions(cfg);
    if (!key) {
      const support = supportPage(cfg, reveal, {
        header: packetHeader(cfg, {
          edition: "Start here",
          note: "Words, worked example, and sentence starters",
          mastery: false,
          target: cfg.contentObjective || "",
          title,
        }),
      });
      if (support.html) pages.push(support.html);
      pages.push(...editions.map((e) => editionPage(cfg, e, { isKey: false, title, reveal })));
    } else {
      const support = supportPage(cfg, reveal);
      pages = editions.map((e, i) =>
        editionPage(cfg, e, { isKey: true, lead: i === 0 ? support.keyNote : "", title }),
      );
    }
  }

  return `<!DOCTYPE html>
<html lang="en" data-ewl-supports-lesson="${esc(lessonId)}" data-support-audience="${audience}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)} — ${titleSuffix}</title>
<link href="/assets/fonts/worksheet-pages.css" rel="stylesheet" />
<style>
${WORKSHEET_CSS}
${EDITORIAL_OVERRIDES}
</style>
</head>
<body>
<main data-support-slot="practice">
${pages.join("\n")}
</main>
<script src="/shared/supports/print-supports.js" defer></script>
</body>
</html>`;
}

/* ── runner ────────────────────────────────────────────────────────────── */

function main() {
  const CHECK = process.argv.includes("--check");
  const stale = [];
  const missingSetB = [];
  const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const dirs = listLessonDirs().filter((d) => (only.length ? only.includes(d) : true));
  let written = 0;
  let skipped = 0;

  for (const d of dirs) {
    let cfg;
    try {
      cfg = JSON.parse(readFileSync(join(LESSONS, d, "config.json"), "utf8"));
    } catch {
      skipped++;
      continue;
    }

    const hasAny =
      ["approaching", "onLevel", "extending", "optional"].some(
        (tier) => printable(cfg.practice?.[tier]).length,
      ) ||
      Boolean(
        cfg.lessonId && (cfg.lessonId.includes("-group") || cfg.lessonId.includes("-catchup")),
      ) ||
      // Apply Day authors its practice under groupLevels, not practice.*.
      ["level1", "level2", "level3"].some((lvl) => printable(cfg.groupLevels?.[lvl]).length);
    if (!hasAny) {
      skipped++;
      continue;
    }

    // Set B is skipped, not emitted empty, when a lesson has no reserve — a
    // worksheet with a header and no problems is worse than no second sheet.
    const hasSetB = setBPages(cfg).length > 0;
    const outputs = [
      ["worksheet.html", buildWorksheet(cfg, { key: false })],
      ["worksheet-answer-key.html", buildWorksheet(cfg, { key: true })],
    ];
    if (hasSetB) {
      outputs.push(
        ["worksheet-2.html", buildWorksheet(cfg, { key: false, set: "B" })],
        ["worksheet-2-answer-key.html", buildWorksheet(cfg, { key: true, set: "B" })],
      );
    } else {
      missingSetB.push(d);
    }
    if (levelZeroEdition(cfg)) {
      outputs.push(
        ["worksheet-level-0.html", buildWorksheet(cfg, { key: false, set: "L0" })],
        ["worksheet-level-0-answer-key.html", buildWorksheet(cfg, { key: true, set: "L0" })],
      );
    }

    if (CHECK) {
      for (const [name, html] of outputs) {
        if (!isGeneratedFresh(join(LESSONS, d, name), html)) stale.push(`lessons/${d}/${name}`);
      }
      continue;
    }
    for (const [name, html] of outputs) writeGenerated(join(LESSONS, d, name), html);
    written++;
  }

  if (CHECK) {
    if (stale.length) {
      console.error(
        `${stale.length} worksheet page(s) are STALE — the committed HTML no longer matches its config.json:\n  ${stale
          .slice(0, 15)
          .join("\n  ")}\n\nFix: node scripts/generate-worksheets.mjs`,
      );
      process.exit(1);
    }
    console.log(`Worksheets up to date (${dirs.length} lessons).`);
    return;
  }
  console.log(
    `Worksheets generated: ${written} lessons × Set A + Set B  (skipped ${skipped})` +
      (missingSetB.length
        ? `\n  no Set B reserve (Set A only): ${missingSetB.join(", ")}`
        : "\n  every lesson has a Set B."),
  );
}

main();
