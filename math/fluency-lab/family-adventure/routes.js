/* Every link the expedition shows goes through here, and every one points at a page that exists today.
 * Links carry only choices (grade, learner slot, language, a skill id), never answers or names. */
import {
  directedSkillPlan,
  skillExample,
  skillExplanation,
  teacherSkillLink,
} from "../family/fm2/skill-link.js";
import { playUrl, progressUrl } from "../family/fm2/urls.js";
import { skillsFor } from "../family/fm2/inventory.js";
import { GAME_IDS, loadGame } from "../family/fm2/registry.js";
import { validateGame } from "../family/fm2/contract.js";

const q = (values) =>
  new URLSearchParams(
    Object.entries(values)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => [k, String(v)]),
  ).toString();

const langOf = (mode) => (mode === "es" ? "es" : "en");

/** The Math Fluency Lab itself (one level up from this page). */
export const labUrl = ({ grade, profile, mode, start, view, skill } = {}) =>
  `../?${q({ grade, profile, lang: langOf(mode), start, view, skill })}`;

/** The one real practice destination for each thing Stop 4 shows. */
export function destinations({ grade, profile, mode, labSkill }) {
  const base = { grade, profile, mode };
  return {
    daily: labUrl({ ...base, start: "daily" }),
    games: labUrl({ ...base, view: "games" }),
    visual: labUrl({ ...base, skill: labSkill }),
    scratchpad: labUrl({ ...base, skill: labSkill }),
    mistakes: labUrl({ ...base, view: "notebook" }),
    progress: labUrl({ ...base, view: "path" }),
    familyProgress: `../family/${progressUrl({ grade, profile, lang: langOf(mode) })}`,
    familyHome: `../family/?${q({ grade, profile, lang: langOf(mode) })}`,
    write: labUrl({ ...base, view: "write" }),
    tourFamily: `../?${q({ grade, profile, lang: langOf(mode), tour: "family" })}`,
  };
}

/** A real Lab skill id for this grade, so "visual lessons" and the scratchpad open on a working page. */
export async function labSkillFor(grade) {
  const { GRADES } = await import("../problem-bank.js");
  const entry = GRADES.find((g) => g.grade === grade);
  return entry?.skills[0]?.id || "";
}

// ---- Family Math practice (Stop 5) -----------------------------------------------------------------------------
/** The games that load and pass the shared contract. */
export async function loadGames() {
  const settled = await Promise.allSettled(GAME_IDS.map((id) => loadGame(id)));
  return settled
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((g) => g && !validateGame(g).length)
    .sort((a, b) => a.order - b.order);
}

const PREFER = {
  1: "number-builder",
  2: "number-line-quest",
  3: "fraction-kitchen",
  4: "array-architect",
  5: "number-builder",
  6: "ratio-recipe-lab",
  7: "ratio-recipe-lab",
  8: "ratio-recipe-lab",
};

/** Skills this grade can practice, as {gameId, skillId, title, strand}. */
export const skillChoices = (games, grade) => skillsFor(games, grade);

/** The skill to preselect: one from the game that matches the grade's model, else the first available. */
export function defaultSkill(choices, grade) {
  return choices.find((c) => c.gameId === PREFER[grade]) || choices[0] || null;
}

export const routineLevel = { quick: 1, together: 1, deeper: 2 };

/** Build the real practice URL for a chosen grade, skill and routine. Returns null when the skill is not offered. */
export function practiceLinks({ games, grade, profile, mode, gameId, skillId, routine }) {
  const game = games.find((g) => g.id === gameId);
  const skill = game?.skills.find((s) => s.id === skillId);
  if (!game || !skill) return null;
  const spec = ROUTINE_SPEC[routine];
  const plan = directedSkillPlan({
    game,
    skill,
    grade,
    minutes: spec.minutes,
    mode: spec.mode,
    level: routineLevel[routine],
  });
  if (!plan) return null;
  const a = plan.activities[0];
  const lang = langOf(mode);
  return {
    play: `../family/${playUrl({ game: a.gameId, skill: a.skillId, level: a.level, rounds: a.rounds, grade, profile, lang, mode: spec.mode })}`,
    tonight: teacherSkillLink({
      grade,
      gameId,
      skillId,
      minutes: spec.minutes,
      mode: spec.mode,
      lang,
      path: "../family/",
    })?.replace("?", `?profile=${profile}&`),
    example: skillExample(game, skill, grade, lang),
    about: skillExplanation(skill, lang, gameId),
    game,
    skill,
    rounds: a.rounds,
  };
}

export const ROUTINE_SPEC = {
  quick: { minutes: 5, mode: "solo" },
  together: { minutes: 10, mode: "together" },
  deeper: { minutes: 15, mode: "together" },
};
