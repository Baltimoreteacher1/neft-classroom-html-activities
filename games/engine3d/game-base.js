import { createScene } from "./core.js";
import { createInput } from "./input.js";
import { createHUD } from "./hud.js";
import { createFeel } from "./feel.js";
import { createAnnouncer } from "./a11y.js";
import { showVocabGate } from "./vocab-gate.js";
import { showLevelSelect, levelInfo } from "./levels.js";
import { reportScore, saveProgress, loadProgress, flushQueue } from "./progress.js";

/**
 * Boots a unit game end-to-end:
 *   (optional) level select -> vocab gate (Level 1) -> scene/HUD/input -> game loop -> scoring.
 *
 * gameModule must export createGame(ctx). ctx is documented in README.md.
 *
 * options:
 *   level           - 0 | 1 | 2 | undefined (undefined => show level select UI)
 *                     0 = most-supported (IEP), 1 = support, 2 = enrichment
 *   gameId          - string id for scoring/progress (defaults to gameModule.id)
 *   vocab           - terms array [{term,definition,image?,emoji?}]; falls back to gameModule.vocab
 *   sceneOpts       - passed to createScene
 *   onScore         - extra hook called whenever the game reports score (after network report)
 *   skipVocabForL2  - if true, Level 2 skips the vocab gate (default false: vocab always shows)
 */
export function mountGame(mountEl, gameModule, options = {}) {
  if (!mountEl) throw new Error("mountGame: mountEl is required");
  if (!gameModule || typeof gameModule.createGame !== "function") {
    throw new Error("mountGame: gameModule must export createGame(ctx)");
  }

  const gameId = options.gameId || gameModule.id || "unknown-game";
  const vocab = options.vocab || gameModule.vocab || [];
  let game = null;
  let core = null;
  let input = null;
  let hud = null;
  let feel = null;
  let announcer = null;
  let disposed = false;
  let totalScore = 0;

  flushQueue();

  function start(level) {
    // Level may be 0 (most-supported/IEP), 1 or 2. Default to 1 only when
    // undefined — never coerce a valid 0 to 1.
    const lvl = level == null ? 1 : level;
    // Vocab-first gate is part of every level; by default it ALWAYS shows
    // before play. (Vocab is especially important for Level 0.)
    const showVocab = vocab.length && !(options.skipVocabForL2 && lvl === 2);
    announcer = createAnnouncer(mountEl);
    if (showVocab) {
      showVocabGate(mountEl, {
        terms: vocab,
        announce: announcer.announce,
        onComplete: () => boot(lvl),
      });
    } else {
      boot(lvl);
    }
  }

  // Accepts an explicit level of 0, 1 or 2 (0 is falsy, so test for null).
  function hasExplicitLevel() {
    return options.level === 0 || options.level === 1 || options.level === 2;
  }

  function boot(level) {
    if (disposed) return;
    core = createScene(mountEl, options.sceneOpts || {});
    input = createInput(core.renderer.domElement);
    hud = createHUD(mountEl);
    feel = createFeel({
      scene: core.scene,
      camera: core.camera,
      renderer: core.renderer,
      onFrame: core.onFrame,
      announce: announcer.announce,
    });

    hud.setLevel(levelInfo(level).label);
    hud.setScore(0);

    // Running per-step feedback shared by every game: each scored part bumps a
    // step counter + streak in the persistent HUD, so progress is always shown
    // without each game having to wire it up. Games may still call
    // hud.setProgress(done,total) directly for an exact "Step X of Y".
    let stepsDone = 0;
    let streak = 0;
    // totalSteps lets the HUD render "Step X of Y"; games can advertise it via
    // gameModule.totalSteps or options.totalSteps, else we show a running count.
    const totalSteps = options.totalSteps || gameModule.totalSteps || 0;

    // The game's declarative standard travels with every score row so the
    // results pipeline can group by CCSS standard without a second lookup.
    const standard = gameModule.standard || "";

    function onScore(points, meta = {}) {
      totalScore += points;
      hud.setScore(totalScore);
      const correct = points >= 0;
      // A non-negative score is treated as a successful step → advance + streak.
      if (correct) {
        stepsDone += 1;
        streak += 1;
        if (typeof hud.setProgress === "function") hud.setProgress(stepsDone, totalSteps);
        if (typeof hud.setStreak === "function" && streak >= 2) hud.setStreak(streak);
      } else {
        streak = 0;
        if (typeof hud.setStreak === "function") hud.setStreak(0);
      }
      // Misconception / sub-skill tagging for the results pipeline: a game
      // passes meta.misconceptionTag (or meta.skillTag) per step so a teacher
      // can see WHICH sub-skill failed, not just the raw score. We surface a
      // single canonical `misconceptionTag` field on the payload.
      const misconceptionTag = meta.misconceptionTag || meta.skillTag || meta.tag || null;
      // `total` on a game_scores row means ATTEMPTS REPRESENTED BY THIS ROW,
      // not the running score — one onScore() call is exactly one attempt, so
      // it is always 1 (this is the contract math/games/practice-arcade posts).
      // It previously carried `totalScore`, which made SUM(total) a sum of
      // running scores: the usage report read unit-1-smoothie-stand as
      // "18 correct / 1455 attempted", and rows even landed with total = -4
      // once a step scored negative. The cumulative score is still recoverable
      // as SUM(points), and saveProgress() below deliberately keeps
      // `total: totalScore` — game_progress.total IS the resume score.
      const payload = {
        gameId,
        standard,
        level,
        points,
        correct,
        total: 1,
        steps: stepsDone,
        misconceptionTag,
        ...meta,
      };
      reportScore(payload);
      saveProgress({
        gameId,
        standard,
        level,
        total: totalScore,
        steps: stepsDone,
        misconceptionTag,
        ...meta,
      });
      if (typeof options.onScore === "function") options.onScore(payload);
    }

    const ctx = {
      scene: core.scene,
      camera: core.camera,
      renderer: core.renderer,
      clock: core.clock,
      onFrame: core.onFrame,
      loaders: core.loaders,
      THREE: core.THREE,
      input,
      hud,
      feel,
      announce: announcer.announce,
      caption: announcer.caption,
      level,
      levelInfo: levelInfo(level),
      gameId,
      onScore,
      loadProgress: () => loadProgress(gameId),
    };

    game = gameModule.createGame(ctx);
    if (game && typeof game.start === "function") game.start();
  }

  // Entry: explicit level (0, 1 or 2) skips selection; otherwise show select.
  if (hasExplicitLevel()) {
    start(options.level);
  } else {
    showLevelSelect(mountEl, { onSelect: start });
  }

  return {
    get score() {
      return totalScore;
    },
    dispose() {
      disposed = true;
      if (game && typeof game.dispose === "function") game.dispose();
      if (feel) feel.dispose();
      if (input) input.dispose();
      if (hud) hud.dispose();
      if (announcer) announcer.dispose();
      if (core) core.dispose();
    },
  };
}
