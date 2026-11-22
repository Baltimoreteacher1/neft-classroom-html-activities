// index.js — Barrel export for the shared ACCESS Practice Lab Game Core (`src/game-core/`).
export { FSM_STATES, GameFSM, toFSMState, toLegacyPhase } from "./GameFSM.js";
export { SoundEngine } from "./SoundEngine.js";
export {
  LEGACY_GAMES_KEY,
  MAX_WEAK_SPOTS_PER_GAME,
  PROGRESSION_KEY,
  SCHEMA_VERSION,
  cleanProgression,
  clearWeakSpots,
  cycleGameTheme,
  emptyProgression,
  getWeakSpots,
  loadProgression,
  recordRoundOutcome,
  saveProgression,
  sessionAccuracy,
  setGameTheme,
  setZenMode,
  unlockWorldBadge,
} from "./ProgressionStore.js";
