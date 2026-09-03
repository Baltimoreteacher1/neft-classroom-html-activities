/**
 * review-lesson-shape.mjs — present an Apply-Day config in the shape the family
 * homework generator reads.
 *
 * There are two lesson config shapes in this repo. A numbered lesson carries
 * `launch` / `practice.{approaching,onLevel,extending}` / `warmup`, and every
 * generator here was written against it. A lesson that renders through the
 * Part II engine (`bootPartTwo`) — the `-part2` pages and the hand-authored
 * bridge lessons like `6-1-6-2-practice` — carries `groupLevels.level1..3`,
 * `reviewWarmup` and `reviewHighlights` instead. Same kind of content, same
 * item objects, different field names.
 *
 * The homework generator asks a config for its practice tiers, its warm-up and
 * its key idea. This answers those questions for the second shape rather than
 * teaching every consumer about both, so `selectQuickCheckProblems`,
 * `isPrintableProblem` and the guided-notes renderers keep working unchanged —
 * including the existing rule that drops `guided-fill` items, which are a
 * worksheet scaffold and not something a family works through on screen.
 *
 * The mapping is by DIFFICULTY, which is what the tier names mean to the
 * homework page (easiest first, then a harder challenge set):
 *
 *   level1 → approaching    level2 → onLevel    level3 → extending
 *
 * A config that already has the numbered shape is returned untouched, so this
 * is safe to call on every config the generator loads.
 */

/** True when `config` is an Apply-Day/bridge lesson rather than a numbered one. */
export function isReviewShape(config) {
  return !!(config && config.groupLevels && !config.practice?.onLevel);
}

/**
 * The Apply-Day config, restated in the numbered-lesson shape.
 *
 * @param {object} config a lesson config
 * @returns {object} the same config when it is already numbered-shaped, else a
 *   copy carrying `practice`, `warmup` and `launch.conceptIntro`.
 */
export function toHomeworkShape(config) {
  if (!isReviewShape(config)) return config;

  const levels = config.groupLevels || {};
  const tier = (key) => (Array.isArray(levels[key]) ? levels[key] : []);
  const highlights = config.reviewHighlights || {};

  // The big idea a family reads. `reviewHighlights` already states the rule,
  // the formula and the numbered steps a student was taught today, so it is
  // quoted rather than re-written — the same discipline the copy panels use.
  const keyIdea = [highlights.rule, highlights.formula && `Formula: ${highlights.formula}`]
    .filter(Boolean)
    .join(" ");

  return {
    ...config,
    practice: {
      ...(config.practice || {}),
      // Authored as `reviewDiagram` at the top level, NOT as `practice.diagram`.
      // Several generators tell the two config shapes apart by asking whether
      // `config.practice` exists at all — `worksheet-set-b.mjs` returns early
      // with "partTwo" on `!cfg.practice` — so adding a `practice` key to a
      // bridge config silently routes it down the numbered-lesson path and its
      // second worksheet comes out empty. The adapter is where the key appears.
      diagram: config.reviewDiagram || config.practice?.diagram,
      approaching: tier("level1"),
      onLevel: tier("level2"),
      extending: tier("level3"),
      optional: [],
      // The one thing worth carrying over verbatim: the mistake the lesson
      // itself says to watch for. The homework's "watch for" section is the
      // right home for it, and inventing a different one would contradict the
      // lesson a family is helping with.
      commonMistake: highlights.watchOut || config.practice?.commonMistake,
    },
    warmup: config.warmup || config.reviewWarmup,
    launch: {
      ...(config.launch || {}),
      conceptIntro: {
        ...(config.launch?.conceptIntro || {}),
        keyIdea: keyIdea || config.contentObjective || "",
        iDo: {
          title: highlights.title || "How to divide with fractions",
          lines: Array.isArray(highlights.steps) ? highlights.steps : [],
        },
      },
    },
  };
}
