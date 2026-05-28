import { createScene } from "./core.js";
import { createInput } from "./input.js";
import { createHUD } from "./hud.js";
import { createFeel } from "./feel.js";
import { createAnnouncer } from "./a11y.js";
import { showVocabGate } from "./vocab-gate.js";
import { showLevelSelect, levelInfo } from "./levels.js";
import {
  reportScore,
  saveProgress,
  loadProgress,
  flushQueue,
} from "./progress.js";

/**
 * Boots a unit game end-to-end:
 *   (optional) level select -> vocab gate (Level 1) -> scene/HUD/input -> game loop -> scoring.
 *
 * gameModule must export createGame(ctx). ctx is documented in README.md.
 *
 * options:
 *   level           - 1 | 2 | undefined (undefined => show level select UI)
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
    const lvl = level || 1;
    // Vocab-first gate is part of Level 1; by default it ALWAYS shows before play.
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

    function onScore(points, meta = {}) {
      totalScore += points;
      hud.setScore(totalScore);
      const payload = {
        gameId,
        level,
        points,
        total: totalScore,
        ...meta,
      };
      reportScore(payload);
      saveProgress({ gameId, level, total: totalScore, ...meta });
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

  // Entry: explicit level skips selection; otherwise show level select.
  if (options.level === 1 || options.level === 2) {
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
