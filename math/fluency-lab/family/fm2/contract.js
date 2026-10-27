// The contract every Family Math 2.0 game module satisfies, and the validator the tests and registry share.
//
//   export default {
//     id, mechanic, order,                      // unique id, unique one-phrase mechanic tag, shelf order 1..10
//     title, tagline, howTo,                    // {en, es}; howTo = {en: [steps], es: [steps]} (3-5 steps)
//     icon,                                     // inline SVG string, aria-hidden
//     secPerRound,                              // honest estimate of seconds for one round (sessions are budgeted from it)
//     together,                                 // {en, es} how two people play this game (family collaboration)
//     skills: [{ id, strand:{en,es}, title:{en,es}, grades:[min,max], standard, labSkill }],
//     makeRound(skillId, level, rng, grade),    // pure: JSON-serializable round { prompt:{en,es}, ...data }
//     check(round, response),                   // pure: { correct, feedback:{en,es}, mistake? }
//     hint(round, tier, response),              // pure: tier 0 nudge, 1 strategy, 2 worked step (none may state the answer), 3 full solution -> {en, es}
//     solve(round),                             // pure: one correct response in the form check() accepts
//     answerText(round),                        // pure: the answer as short text, used to prove tiers 0-2 never leak it
//     mount(root, ctx),                         // DOM: ctx.round, ctx.lang, ctx.mode, ctx.submit(response) -> result, ctx.announce(text);
//                                               // returns { destroy(), setLang(lang) } so a language switch keeps the work in progress
//     cssHref,                                  // URL of the game's stylesheet (new URL("./game.css", import.meta.url).href)
//   }
//
// `check` and `solve` are the game's own scoring; the math suites re-derive correctness independently and never
// trust them. @fm2 FM-017 FM-019 FM-101
import { missingLanguages } from "./lang.js";

export const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8];
export const LEVELS = 3;

export function validateGame(game) {
  const problems = [];
  const need = (ok, text) => { if (!ok) problems.push(text); };
  need(/^[a-z][a-z0-9-]{2,30}$/.test(game?.id || ""), "id must be a kebab-case slug");
  need(typeof game?.mechanic === "string" && game.mechanic.length > 3, "mechanic tag required");
  need(Number.isInteger(game?.order) && game.order >= 1 && game.order <= 10, "order 1..10 required");
  for (const field of ["title", "tagline", "together"]) problems.push(...missingLanguages(game?.[field], field));
  const howTo = game?.howTo || {};
  for (const lang of ["en", "es"]) need(Array.isArray(howTo[lang]) && howTo[lang].length >= 3 && howTo[lang].length <= 5 && howTo[lang].every((s) => typeof s === "string" && s.trim()), `howTo.${lang} needs 3-5 steps`);
  need(howTo.en?.length === howTo.es?.length, "howTo languages must have the same number of steps");
  need(typeof game?.icon === "string" && game.icon.startsWith("<svg"), "icon must be an inline SVG");
  need(Number.isFinite(game?.secPerRound) && game.secPerRound >= 15 && game.secPerRound <= 240, "secPerRound 15..240 required");
  for (const fn of ["makeRound", "check", "hint", "solve", "answerText", "mount"]) need(typeof game?.[fn] === "function", `${fn}() required`);
  need(typeof game?.cssHref === "string" && game.cssHref.length > 0, "cssHref required");
  need(Array.isArray(game?.skills) && game.skills.length >= 9, "at least 9 skills (one per grade K-8 minimum) required");
  const ids = new Set();
  for (const skill of game?.skills || []) {
    need(/^[a-z0-9-]{2,40}$/.test(skill.id || ""), `skill id invalid: ${skill.id}`);
    need(!ids.has(skill.id), `duplicate skill id ${skill.id}`);
    ids.add(skill.id);
    for (const field of ["strand", "title"]) problems.push(...missingLanguages(skill[field], `skills.${skill.id}.${field}`));
    const [low, high] = skill.grades || [];
    need(Number.isInteger(low) && Number.isInteger(high) && low >= 0 && high <= 8 && low <= high, `skill ${skill.id} grades invalid`);
    need(typeof skill.standard === "string" && skill.standard.length > 2, `skill ${skill.id} needs a standard code`);
  }
  const covered = GRADES.filter((g) => (game?.skills || []).some((s) => s.grades?.[0] <= g && g <= s.grades?.[1]));
  need(covered.length === GRADES.length, `skills must cover every grade K-8 (missing ${GRADES.filter((g) => !covered.includes(g)).join(",")})`);
  return problems;
}
