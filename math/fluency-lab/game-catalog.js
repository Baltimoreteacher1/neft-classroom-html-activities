// Game Room catalog: the grade band on every card and the filter row above the cards (inspired by Funbrain's grade badges).
// A game's band comes from the `grades` list on its registry entry (a game with no list runs on the learner's own facts
// at every grade, Kindergarten to Grade 8), so a card can never claim a grade its game does not play at.
import { t } from "./i18n.js";

export const FIRST_GRADE = 0;
export const LAST_GRADE = 8;

export function bandFor(grades) {
  if (!grades?.length) return [FIRST_GRADE, LAST_GRADE];
  return [Math.min(...grades), Math.max(...grades)];
}

export function bandLabel([from, to]) {
  if (from === FIRST_GRADE && to === LAST_GRADE) return t("All grades");
  if (from === to) return from === FIRST_GRADE ? t("Kindergarten") : t("Grade {n}", { n: from });
  return from === FIRST_GRADE ? t("K–{n}", { n: to }) : t("Grades {a}–{b}", { a: from, b: to });
}

// Filter tags per game id. A game can carry several (Make 24 is a puzzle; Math Baseball is facts, 2-player and sports).
const FACTS = ["facts"];
const PUZZLE = ["puzzles"];
export const TAGS = {
  mathworldbuilder: PUZZLE,
  numberpuzzlestudio: PUZZLE,
  fluencyrally: ["facts", "race"],
  strategymatch: PUZZLE,
  targethive: PUZZLE,
  factorfractionpath: PUZZLE,
  ghostsprint: ["facts", "race"],
  numberquest: PUZZLE,
  arrayarchitect: PUZZLE,
  fractionforge: PUZZLE,
  balancestation: PUZZLE,
  equationfactory: PUZZLE,
  ratiocity: PUZZLE,
  fractionbridge: PUZZLE,
  tenframefactory: PUZZLE,
  divisionharbor: PUZZLE,
  decimaldashboards: PUZZLE,
  integerexpedition: PUZZLE,
  graphcity: PUZZLE,
  match: FACTS,
  hunt: FACTS,
  sort: FACTS,
  mistake: FACTS,
  make: ["facts", "puzzles"],
  duel: FACTS,
  make24: PUZZLE,
  challenge: FACTS,
  teamrelay: ["facts", "twoplayer"],
  family: FACTS,
  balance: ["facts", "puzzles"],
  flip: FACTS,
  picture: FACTS,
  baseball: ["facts", "twoplayer", "race"],
  guess: PUZZLE,
  race: ["facts", "race"],
};

export const FILTER_IDS = ["all", "facts", "puzzles", "twoplayer", "race"];
export const filterLabel = (id) =>
  ({
    all: t("All"),
    facts: t("Facts"),
    puzzles: t("Puzzles"),
    twoplayer: t("2-player"),
    race: t("Race & sports"),
  })[id];

// A registry entry with its grade band and tags attached. A game without tags is a mistake, so fail loudly.
export function withCatalog(game) {
  if (!TAGS[game.id]) throw new Error(`Game ${game.id} has no filter tags in game-catalog.js`);
  return { ...game, gradeBand: bandFor(game.grades), tags: TAGS[game.id] };
}

export const matchesFilter = (game, filter) => filter === "all" || game.tags.includes(filter);

export function filterRowHtml(active) {
  return `<div class="gm-filters" role="group" aria-label="${t("Show games")}">${FILTER_IDS.map((id) => `<button type="button" class="gm-filter" data-gm-filter="${id}" aria-pressed="${id === active}">${filterLabel(id)}</button>`).join("")}</div>`;
}
