#!/usr/bin/env node
/**
 * generate-part-two.mjs — build /lessons/<id>-part2/ for every core lesson that
 * ships a Reveal "Apply" word problem.
 *
 * WHY. The Apply problem is the culminating, real-world version of the day's
 * mathematics and it carries the deck's one figure. Rendered as the last card of
 * Part 1 it reliably got four rushed minutes. Part 2 gives it a day: a brief
 * review, the scenario, then students break into groups with four named jobs.
 * The Apply problem is no longer rendered in Part 1 (renderShowYourWork in
 * engine/core/lesson-renderer.js) — this page is where it lives now.
 *
 * WHAT IT OWNS. Only the three files in `lessons/<id>-part2/`. It NEVER writes
 * to the core lesson's config, and it authors no mathematics: every string in
 * the generated config is copied verbatim from the core lesson. Re-running it is
 * idempotent — a lesson whose core config has not changed produces byte-identical
 * output.
 *
 * THE SHELL IS DERIVED, NOT WRITTEN. index.html is the CORE lesson's own
 * index.html with the lesson id, the titles, the description and the canonical
 * URL rewritten. That is deliberate: the core shell already carries every
 * injected block the site's gates require (save/resume, learning supports,
 * mobile access, enterprise head, the no-JS fallback). Hand-writing a shell
 * would mean re-deriving all of that and getting one of them subtly wrong.
 *
 * Usage:
 *   node scripts/generate-part-two.mjs            # write
 *   node scripts/generate-part-two.mjs --check    # fail if anything is stale
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const CORE = /^\d+-\d+$/;
const CHECK = process.argv.includes("--check");

/**
 * The core lesson's own interactive model, carried onto Part 2 so the Apply
 * problem can be worked with something other than a text box.
 *
 * WHY. Part 2 is where the day's richest problem finally gets its time, but
 * every interaction on the page was answer entry — the interaction-quality
 * audit graded all 66 of these pages D, "no manipulable representation". The
 * tool that taught the concept in Part 1 is the right one to reach for here;
 * a second, Part-2-only manipulative would be a new thing to learn on the day
 * students should be applying what they already know.
 *
 * Priority matches the homework and family-page generators — practice first,
 * then explore, connect, and the launch visual — so one lesson shows one tool
 * on every surface. Copied verbatim, like every other carried field: this
 * generator authors no mathematics.
 */
function selectTool(core) {
  const candidates = [];
  const add = (value) => {
    if (Array.isArray(value)) value.forEach(add);
    else if (value && typeof value === "object" && typeof value.kind === "string")
      candidates.push(value);
  };
  add(core.practice?.diagram);
  add(core.explore?.diagram);
  add(core.connect?.diagram);
  add(core.launch?.visual);

  for (const candidate of candidates) {
    // INTERACTIVE_KINDS is the engine's own registry, read at build time — a
    // kind that only draws a picture is not a tool and must not claim to be one.
    if (INTERACTIVE_KINDS.has(String(candidate.kind))) return candidate;
  }
  return null;
}

/** Fields Part 2 needs from the core lesson, copied verbatim. */
const CARRIED = [
  "standard",
  "unit",
  "lesson",
  "theme",
  "themeEmoji",
  "contentObjective",
  "contentObjectiveEs",
  "languageObjective",
  "languageObjectiveEs",
  "vocabulary",
  "notebook",
  "revealWordProblem",
  "commonMistake",
  "contentVisualImg",
  "contentVisualCaption",
  "languageVisualImg",
  "languageVisualCaption",
];

/**
 * The `visual.kind`s the WHOLE-LESSON renderer can actually draw, read out of
 * `buildVisual()`'s own switch plus its explicit `.kind === "…"` comparisons.
 * Parsed rather than listed so it cannot drift from the engine — the same
 * source of truth scripts/validate-lesson-visuals.mjs reads.
 *
 * This matters because the level banks below draw on the SMALL-GROUP variants,
 * and those render their figures through a different dispatcher with its own
 * kinds (factor-table, volume-prism, multiple-lanes, …). Carried into Part 2,
 * which renders through buildVisual, those problems would show a blank gap
 * where their figure should be — and a problem whose numbers live in the figure
 * is then unsolvable.
 */
/**
 * The interactive-visual REGISTRY keys, parsed from the engine at build time.
 * Mirrors renderableVisualKinds(): read the engine rather than keep a second
 * list here, so a kind added to the registry reaches Part 2 without anyone
 * remembering to update this file. Throws if the parse collapses, because a
 * silently-empty set would quietly drop the tool from every page.
 */
function interactiveKinds() {
  const src = readFileSync(join(ROOT, "engine/core/interactive-visual.js"), "utf8");
  const start = src.indexOf("const REGISTRY = {");
  if (start < 0) throw new Error("REGISTRY not found in interactive-visual.js");
  const open = src.indexOf("{", start);
  let depth = 0;
  let end = -1;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === "{") depth += 1;
    else if (src[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const body = src.slice(open, end);
  // Only top-level keys of the registry object literal are kinds; nested config
  // object keys sit at deeper indentation.
  const kinds = new Set([...body.matchAll(/^  "([a-z0-9-]+)":/gm)].map((m) => m[1]));
  if (kinds.size < 10) {
    throw new Error(`only ${kinds.size} interactive kinds parsed — the registry moved`);
  }
  return kinds;
}

function renderableVisualKinds() {
  const src = readFileSync(join(ROOT, "engine/core/lesson-renderer.js"), "utf8");
  const start = src.indexOf("function buildVisual(");
  if (start < 0) throw new Error("buildVisual() not found in lesson-renderer.js");
  let depth = 0;
  const open = src.indexOf("{", start);
  let end = -1;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === "{") depth += 1;
    else if (src[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const kinds = new Set([
    ...[...src.slice(open, end).matchAll(/case "([^"]+)"/g)].map((m) => m[1]),
    ...[...src.matchAll(/\.kind === "([a-z0-9-]+)"/g)].map((m) => m[1]),
  ]);
  if (kinds.size < 10) {
    throw new Error(`only ${kinds.size} renderable visual kinds parsed — the engine moved`);
  }
  return kinds;
}

const RENDERABLE_KINDS = renderableVisualKinds();
const INTERACTIVE_KINDS = interactiveKinds();

/**
 * True when Part 2 can draw whatever figure the item declares.
 *
 * Two dispatchers, not one. `buildVisual` in lesson-renderer.js draws the 39
 * kinds `renderComponent` knows; the variant parallel banks were authored
 * against small-group-visual-practice.js, whose 43 kinds overlap those on five.
 * An item carrying `sgFigure` is drawn by the second one — the Part 2 renderer
 * calls it directly — so it renders even though `buildVisual` never heard of
 * `xy-table`. Judging every item by RENDERABLE_KINDS alone is what dropped the
 * whole scaffolded bank off the Apply Day tables.
 */
function visualRenders(item) {
  const kind = item && item.visual && item.visual.kind;
  if (!kind) return true;
  if (item.sgFigure) return true;
  return RENDERABLE_KINDS.has(String(kind));
}

/** A self-grading multiple-choice item — the only kind a warm-up can mark. */
function gradable(item) {
  return Boolean(
    item &&
      typeof item === "object" &&
      (item.stem || item.prompt) &&
      Array.isArray(item.choices) &&
      item.choices.length >= 2 &&
      Number.isInteger(item.correctIndex),
  );
}

/**
 * Part 2 opens with a WARM-UP on yesterday's lesson, not a single quick check
 * (Joel, 2026-08-26: "instead of quick check ... have a warmup part"). Every
 * question is one the core lesson already wrote, so Part 2 still authors no
 * mathematics.
 *
 * IT IS NOT `config.warmup`, and the field is called `reviewWarmup` to keep
 * that clear. `warmup` is a defined contract in this repo: it reviews the
 * PREVIOUS lesson, and tools/warmup-sequencing.test.mjs holds a variant to its
 * parent's copy because a variant must not author its own. Part 2's warm-up
 * reviews THIS lesson — the one taught yesterday — so inheriting the parent's
 * would point students at the wrong day. Different meaning, different name.
 *
 * Easiest first: this is a "do you still have yesterday" check at the start of
 * a second day, so it opens where every student can get in.
 */
function buildWarmup(config, title) {
  const p = config.practice || {};
  const seen = new Set();
  const questions = [];
  for (const tier of ["approaching", "onLevel", "extending"]) {
    for (const item of Array.isArray(p[tier]) ? p[tier] : []) {
      if (questions.length >= 3 || !gradable(item) || !visualRenders(item)) continue;
      const key = String(item.stem || item.prompt);
      if (seen.has(key)) continue;
      seen.add(key);
      questions.push(item);
    }
  }
  if (!questions.length) return null;
  return {
    title: "Warm-Up: Yesterday's Lesson",
    kind: "previous",
    prevLessonTitle: title,
    questions,
  };
}

/**
 * The "what we did yesterday" recap, as a FEW HIGHLIGHTS rather than the whole
 * notes page (Joel: "it should be a simplified (quick version of the day
 * before or a few highlights of it)"). Everything here is lifted from the core
 * lesson: the rule its notebook page anchors on, the numbered steps under that
 * rule, and the mistake it told students to watch for.
 */
function buildHighlights(config) {
  const boxes = ((config.notebook || {}).checkpoints || []).filter(Boolean);
  const anchor = boxes.find((b) => b && b.copyPanel && b.copyPanel.rule);
  const panel = anchor ? anchor.copyPanel : null;
  const out = {};
  if (panel) {
    if (panel.rule) out.rule = String(panel.rule);
    if (panel.formula) out.formula = String(panel.formula);
    if (Array.isArray(panel.steps) && panel.steps.length) {
      out.steps = panel.steps.map(String).slice(0, 4);
    }
  }
  const mistake = (config.practice || {}).commonMistake;
  if (mistake) out.watchOut = String(mistake);
  return Object.keys(out).length ? out : null;
}

/**
 * The leveled problem sets Part 2's group work runs on (Joel: "Group work
 * should be leveled (with subcards) having different levels and different
 * modifications/problems included").
 *
 * Every problem is AUTHORED — pulled from the core lesson and from its own
 * small-group variants, which between them already carry a large bank per
 * lesson (core practice, each group's practice, and each group's 12-item
 * parallel-practice set). Nothing here is generated, so nothing here can be
 * wrong in a way an author did not write.
 *
 *   🟢 Level 1  the scaffolded end — approaching items and Group 1's bank
 *   🔵 Level 2  grade level — on-level items from the lesson and both groups
 *   🟣 Level 3  the stretch — extending items and Group 2's bank
 */
function buildGroupLevels(id, config, readVariant, warmupStems = []) {
  const g1 = readVariant(`${id}-group1`);
  const g2 = readVariant(`${id}-group2`);
  const cu = readVariant(`${id}-catchup`);
  const tier = (cfg, name) =>
    cfg && Array.isArray((cfg.practice || {})[name]) ? cfg.practice[name] : [];
  /* The variant parallel banks, tagged with the dispatcher that owns their
   * figures. Every item in them declares a `visual.kind` — the small-group gate
   * refuses one that does not — but those kinds belong to
   * engine/core/small-group-visual-practice.js, not to `buildVisual`, which is
   * what `renderComponent` draws an item figure with. The Part 2 renderer reads
   * `sgFigure` and calls that dispatcher directly; without the flag it cannot
   * tell a kind it must skip from a kind another module draws, and
   * `visualRenders` below would go on dropping all 2,376 of them. */
  const parallel = (cfg) =>
    cfg && Array.isArray(cfg.parallelPractice)
      ? cfg.parallelPractice.map((item) =>
          item && typeof item === "object" && item.visual && item.visual.kind
            ? { ...item, sgFigure: true }
            : item,
        )
      : [];

  /* The lesson's own MSTAR item, flattened into an ordinary practice problem.
   *
   * These are state-assessment items — the most rigorous authored content the
   * lesson owns — and nothing read them before: this builder only ever looked
   * at `practice.*` and `parallelPractice`, so they sat unused while Level 3
   * repeated Level 1 on 25 of 76 lessons. That was an oversight, not a
   * decision; no comment or gate excluded them.
   *
   * ONLY Part A is taken. An EBSR item is two questions: Part A asks for the
   * value, Part B asks which reasoning justifies "the answer to Part A" — and
   * 28 of those stems say exactly that, which dangles the moment the part is
   * lifted out and numbered on its own, the same defect the Connect checks had
   * on the printed worksheets. Part A stands alone; Part B does not.
   *
   * `multi-select` and `error-analysis` MSTAR items are skipped: the first has
   * several correct answers where this renderer marks one, and the second
   * carries a worked example in a shape groupLevels never uses. A half-rendered
   * state item is worse than none.
   *
   * Every Part A carries `choiceFeedback` naming what each wrong choice did —
   * authored 2026-08-28 for exactly this promotion, because
   * tools/distractor-feedback.test.mjs holds every multiple-choice item in a
   * lesson config to that standard and these had none. */
  const mstarProblems = (cfg) => {
    const out = [];
    for (const item of (cfg && cfg.reflect && cfg.reflect.mstarPractice) || []) {
      if (!item || item.type !== "ebsr") continue;
      const part = item.partA;
      if (!part || !part.stem || !Array.isArray(part.choices) || !part.choices.length) continue;
      if (!Number.isInteger(part.correctIndex)) continue;
      if (part.correctIndex < 0 || part.correctIndex >= part.choices.length) continue;
      if (!Array.isArray(part.choiceFeedback) || part.choiceFeedback.length !== part.choices.length)
        continue;
      out.push({
        type: "multiple-choice",
        stem: part.stem,
        choices: part.choices,
        correctIndex: part.correctIndex,
        choiceFeedback: part.choiceFeedback,
        ...(part.explanation ? { explanation: part.explanation } : {}),
        ...(part.stemEs ? { stemEs: part.stemEs } : {}),
        ...(part.choicesEs ? { choicesEs: part.choicesEs } : {}),
        ...(part.explanationEs ? { explanationEs: part.explanationEs } : {}),
      });
    }
    return out;
  };

  // Each group's 12-item parallel bank is a ramp of the same skill. Group 1's
  // runs scaffolded → on-level and Group 2's runs on-level → challenge, so each
  // is split at the middle: the easy half of Group 1's and the hard half of
  // Group 2's anchor the outer levels, and the two inner halves — which are
  // both plainly grade-level — thicken the middle, which is otherwise the
  // thinnest bank in the repo (every variant inherits the core's on-level set,
  // so those four configs hold about five distinct problems between them).
  const p1 = parallel(g1);
  const p2 = parallel(g2);
  // The catch-up variant's bank was never read. It is the most scaffolded set
  // the lesson owns and every item in it carries a figure (the small-group
  // gate refuses a parallel item without `visual.kind`), which is exactly what
  // Level 1 was short of on 68 of 76 Apply Days.
  const pcu = parallel(cu);
  const h1 = Math.floor(p1.length / 2);
  const h2 = Math.floor(p2.length / 2);
  const hcu = Math.floor(pcu.length / 2);

  /* Two ordered streams, taken in turn rather than end to end.
   *
   * `practice.*` items are authored without figures — 0 of the 14 on a typical
   * core lesson declare `visual` — while every one of the 2,376 items in the
   * group and catch-up parallel banks does. Concatenating put the text pool
   * first and the figure-bearing pool after it, so the five-item cap below
   * spent every slot before reaching a single picture: 68 of 76 Apply Days
   * shipped with no figure at any level, and Level 1 — whose `approaching`
   * pool is the smallest and most heavily deduped — ran to 236 items against
   * Level 2's 367, starving the table that needs the most practice.
   *
   * This is the same failure the Level 3 comment below already names ("anything
   * appended here is what the cap throws away"), so it gets the same remedy,
   * generalized: alternate. `primary` still leads, which keeps the item closest
   * to today's skill in the first slot, and the cap now lands on a mix instead
   * of on one end of the list. Nothing is reordered within a stream, the cap,
   * the within-level dedupe, and Level 3's pinned state item all stand. */
  const interleave = (primary, secondary) => {
    const out = [];
    for (let i = 0; i < Math.max(primary.length, secondary.length); i += 1) {
      if (i < primary.length) out.push(primary[i]);
      if (i < secondary.length) out.push(secondary[i]);
    }
    return out;
  };

  const levels = {
    level1: interleave(
      [...tier(config, "approaching"), ...tier(g1, "approaching"), ...tier(cu, "approaching")],
      [...pcu.slice(0, hcu), ...p1.slice(0, h1)],
    ),
    level2: interleave(
      [
        ...tier(config, "onLevel"),
        ...tier(g1, "onLevel"),
        ...tier(g2, "onLevel"),
        ...tier(cu, "onLevel"),
        ...tier(config, "optional"),
      ],
      [...p1.slice(h1), ...p2.slice(0, h2), ...pcu.slice(hcu)],
    ),
    level3: [
      // FIRST, deliberately. Each level is capped at five and the pools are
      // ordered, so anything appended here is what the cap throws away — which
      // is precisely how Level 3 came to show five items it did not own.
      // Leading with the state item also fixes the hollow levels WITHOUT
      // touching the within-level dedupe this file documents above, and which
      // measurement supports: cross-deduping in any claiming order simply moves
      // the shortage onto Level 2, the grade-level table.
      ...mstarProblems(config),
      ...interleave(
        [...tier(config, "extending"), ...tier(g2, "extending"), ...tier(cu, "extending")],
        [...p2.slice(h2)],
      ),
    ],
  };

  // Deduped WITHIN a level, not across them. The three levels run at the same
  // time at different tables, so a problem serving two of them is invisible;
  // deduping globally instead let the first level drain the pool and left 27
  // lessons with an empty challenge set.
  //
  // Two more exclusions, both from the 2026-08-27 publisher critique:
  // - A stem the Review warm-up already asked is DROPPED — students were
  //   meeting "Find the mean of: 10, 14, 8, 12, 16" three times in one block
  //   (warm-up, then twice more at the table), because the catch-up variant's
  //   pools carry the same prior-lesson items buildWarmup lifts.
  // - Each level is CAPPED at five problems. Ten-problem sets turned Group
  //   Work into a second worksheet and pushed the actual collaborative solve
  //   seven screens down. Pools are ordered core-lesson-first, so the cap
  //   keeps the items closest to today's skill.
  // Comparison is on a NORMALIZED stem: the parallel banks label their copies
  // "(Lesson 2.3)", so an exact-string compare saw two different problems
  // where a student sees the same one — 36 of 76 part2 configs shipped
  // internal duplicates that way.
  const normStem = (s) =>
    String(s)
      .replace(/\(Lesson \d+\.\d+\)/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  const warmupSet = new Set(warmupStems.map(normStem).filter(Boolean));
  const out = {};
  for (const [key, items] of Object.entries(levels)) {
    const seen = new Set();
    const kept = [];
    for (const item of items) {
      if (kept.length >= 5) break;
      if (!item || typeof item !== "object") continue;
      const stem = normStem(item.stem || item.prompt || "");
      if (!stem || seen.has(stem) || warmupSet.has(stem)) continue;
      // Drop rather than de-figure: a problem whose numbers are in the picture
      // is unsolvable without it, and this renderer cannot draw that picture.
      if (!visualRenders(item)) continue;
      seen.add(stem);
      kept.push(item);
    }
    if (kept.length) out[key] = kept;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * The Part 2 title is the LESSON NUMBER and Part II — "2.7 · Part II" (Joel,
 * 2026-08-26: "instead of the word review, just title it … the lesson number
 * and Part II"). Day 2 is not a different lesson, so it does not restate the
 * lesson's name; it says which lesson and which day.
 */
function partTwoTitle(config) {
  return `${config.unit}.${config.lesson} · Part II`;
}

function buildConfig(id, core, readVariant) {
  const out = {
    lessonId: `${id}-part2`,
    baseLessonId: id,
    variant: "part2",
    partTwo: true,
    title: partTwoTitle(core),
    timeEstimate: "~45 min",
    note: "GENERATED by scripts/generate-part-two.mjs from the core lesson — do not hand-edit.",
  };
  for (const key of CARRIED) {
    if (core[key] !== undefined) out[key] = core[key];
  }
  const warmup = buildWarmup(core, core.title);
  if (warmup) out.reviewWarmup = warmup;
  const highlights = buildHighlights(core);
  if (highlights) out.reviewHighlights = highlights;
  const warmupStems = warmup
    ? (warmup.questions || []).map((q) => String(q?.stem || "").trim())
    : [];
  const levels = buildGroupLevels(id, core, readVariant, warmupStems);
  if (levels) out.groupLevels = levels;
  const tool = selectTool(core);
  if (tool) out.tool = tool;
  return out;
}

/** A sibling variant's config, or null when the lesson has no such variant. */
function readVariantConfig(variantId) {
  const path = join(LESSONS, variantId, "config.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

/**
 * The core shell, re-pointed at this id. Only identity strings change; every
 * injected block, stylesheet and script tag is carried across untouched.
 */
function buildShell(id, core, coreHtml) {
  const id2 = `${id}-part2`;
  const title = `${partTwoTitle(core)} — Neft Teacher`;
  const desc = `Grade 6 Reveal Math Part 2 — apply ${core.title} to a real-world problem in small groups`;
  return coreHtml
    .replace(/data-ewl-supports-lesson="[^"]*"/g, `data-ewl-supports-lesson="${id2}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${escapeHtml(desc)}"`,
    )
    .replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${escapeHtml(title)}"`,
    )
    .replace(
      /<meta property="og:description" content="[^"]*"/,
      `<meta property="og:description" content="${escapeHtml(desc)}"`,
    )
    .replace(
      /(<link rel="canonical" href="https:\/\/eduwonderlab\.com\/lessons\/)[^"]*(">)/,
      `$1${id2}/$2`,
    )
    .replace(
      /(<meta property="og:url" content="https:\/\/eduwonderlab\.com\/lessons\/)[^"]*(">)/,
      `$1${id2}/$2`,
    );
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

const BOOT = `import { bootPartTwo } from "@engine/core/part-two-renderer.js";
import config from "./config.json";
bootPartTwo(config);
`;

/** Write only when the bytes differ, so --check and reruns stay honest. */
function put(path, contents, stale) {
  const current = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (current === contents) return false;
  if (CHECK) {
    stale.push(path.slice(ROOT.length + 1));
    return true;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
  return true;
}

const stale = [];
let written = 0;
let skipped = 0;

for (const dir of readdirSync(LESSONS).sort()) {
  if (!CORE.test(dir)) continue;
  const configPath = join(LESSONS, dir, "config.json");
  const shellPath = join(LESSONS, dir, "index.html");
  if (!existsSync(configPath) || !existsSync(shellPath)) continue;

  const core = JSON.parse(readFileSync(configPath, "utf8"));
  const wp = core.revealWordProblem;
  // No Apply problem, no Part 2. Units 1 and 10 are the "Math is…" mindset
  // lessons whose Apply is a reflection prompt rather than a problem, so most of
  // the skips land there — inventing a scenario for them is authoring, not
  // generation, and this script does not author.
  if (!wp || typeof wp !== "object" || !String(wp.text || "").trim()) {
    skipped += 1;
    continue;
  }

  const outDir = join(LESSONS, `${dir}-part2`);
  const changed =
    put(
      join(outDir, "config.json"),
      `${JSON.stringify(buildConfig(dir, core, readVariantConfig), null, 2)}\n`,
      stale,
    ) |
    put(join(outDir, "index.html"), buildShell(dir, core, readFileSync(shellPath, "utf8")), stale) |
    put(join(outDir, "lesson.js"), BOOT, stale);
  if (changed) written += 1;
}

if (CHECK) {
  if (stale.length) {
    console.error(
      `generate-part-two --check: ${stale.length} file(s) stale — run \`node scripts/generate-part-two.mjs\`:\n  ${stale.join("\n  ")}`,
    );
    process.exit(1);
  }
  console.log(
    `generate-part-two --check: up to date (${skipped} core lessons have no Apply problem)`,
  );
} else {
  console.log(
    `generate-part-two: ${written} Part 2 lesson(s) written, ${skipped} core lesson(s) skipped (no Apply problem)`,
  );
}
