// Game Room entries for the ten Enterprise 8 game families, and per-learner saved games.
import { profileKey, profiles, readLocal, writeLocal } from "../school-tools.js";
import { listFamilies } from "./games.js";
import { gameIdFor, playFamily } from "./game-shell.js";

const KEY = "ewl-fluency-e8-games-v1";
const key = () => profileKey(KEY, profiles().active);
const slot = (familyId, grade) => `${familyId}:${grade}`;

// A saved game is a small snapshot per family and grade. Anything unreadable is simply ignored.
export const e8GamePersist = {
  load(familyId, grade) {
    const all = readLocal(key(), {}) || {};
    const snap = all[slot(familyId, grade)];
    return typeof snap === "string" && snap.length < 20000 ? snap : null;
  },
  save(familyId, grade, snapshot) {
    const all = readLocal(key(), {}) || {};
    all[slot(familyId, grade)] = snapshot;
    writeLocal(key(), all);
  },
  clear(familyId, grade) {
    const all = readLocal(key(), {}) || {};
    delete all[slot(familyId, grade)];
    writeLocal(key(), all);
  },
};

const ICONS = { numberQuest: "🧭", fractionFactory: "🏭", multiplicationArena: "🏟️", decimalDash: "🏁", ratioArchitect: "📐", equationBalance: "⚖️", graphExplorer: "📈", geometryBuilder: "🧱", dataDetective: "🕵️", strategyTournament: "🏆" };

export const E8_REGISTRY = listFamilies().map((family) => ({
  id: gameIdFor(family.id),
  name: family.title.en,
  icon: ICONS[family.id],
  blurb: family.blurb.en,
  grades: family.grades,
  run: (container, options) => playFamily(family.id, container, { ...options, persist: e8GamePersist }),
}));

export const E8_GAME_NAMES = Object.fromEntries(listFamilies().map((family) => [gameIdFor(family.id), family.title.en]));
export const E8_GAME_IDS = listFamilies().map((family) => gameIdFor(family.id));
