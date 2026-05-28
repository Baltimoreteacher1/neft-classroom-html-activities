export { createScene } from "./core.js";
export { createInput } from "./input.js";
export { createHUD } from "./hud.js";
export { showVocabGate } from "./vocab-gate.js";
export { showLevelSelect, levelInfo, LEVELS } from "./levels.js";
export { createFeel } from "./feel.js";
export {
  createAnnouncer,
  prefersReducedMotion,
  trapFocus,
  onActivate,
} from "./a11y.js";
export {
  reportScore,
  saveProgress,
  loadProgress,
  flushQueue,
} from "./progress.js";
export { mountGame } from "./game-base.js";
export { createGrid } from "./grid.js";
export { makeLabel, updateLabel } from "./label3d.js";
export {
  rectArea,
  triangleArea,
  polygonArea,
  compositeArea,
  prismVolume,
  decompose,
} from "./geometry-math.js";
