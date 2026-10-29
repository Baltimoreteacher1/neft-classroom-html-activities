// Today's mission as the page shows it: one row per planned activity, each with the link that opens exactly that
// game, skill and level. Pure, so tools/fm2/mission.test.mjs can prove every destination without a browser.
// Routing goes through urls.js (playUrl); nothing here builds a URL by hand. @fm2 FM-003 FM-004 FM-005 FM-035
import { covers } from "./inventory.js";
import { skillExplanation } from "./skill-link.js";
import { playUrl } from "./urls.js";

export const minutesOf = (estSec) => Math.max(1, Math.round(estSec / 60));

// The recommender's reason is worth saying when it comes from the learner's own record. "New skill, start at level 1"
// is true of everything unplayed, so it is left out of the mission rather than repeated on every row.
export const showsReason = (reason) =>
  reason === "review" || reason === "weak" || reason === "stretch";

/**
 * @param {object} args
 * @param {{activities: Array}} args.plan   the planned session (planSession / dailyMission)
 * @param {Array} args.games                the loaded games
 * @param {Array} [args.recs]               recommend() output, for the reason line
 * @param {{grade:number, profile:number, lang:string, mode:string}} args.context  what the page is currently set to
 */
export function missionItems({ plan, games, recs = [], context }) {
  return (plan?.activities || []).map((a) => {
    const game = games.find((g) => g.id === a.gameId);
    const skill = game?.skills.find((s) => s.id === a.skillId);
    // A review skill from the grade below opens at its own grade; everything else opens at the page's grade.
    const grade = !skill || covers(skill, context.grade) ? context.grade : skill.grades[1];
    const rec = recs.find((r) => r.gameId === a.gameId && r.skillId === a.skillId);
    return {
      gameId: a.gameId,
      skillId: a.skillId,
      role: a.role,
      level: a.level,
      rounds: a.rounds,
      minutes: minutesOf(a.estSec),
      game,
      skill,
      note: skill ? skillExplanation(skill, context.lang, a.gameId) : "",
      reason: rec && showsReason(rec.reason) ? { ...rec, level: a.level } : null,
      // The activity as planned: same level and number of rounds, so the time shown is the time it takes.
      href: playUrl({
        ...context,
        game: a.gameId,
        skill: a.skillId,
        level: a.level,
        rounds: a.rounds,
        grade,
      }),
    };
  });
}
