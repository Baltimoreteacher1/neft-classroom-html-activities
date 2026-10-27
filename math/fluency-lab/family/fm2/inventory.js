// What the ten games teach, grade by grade. Pure functions over the game list, so the landing page, the recommender
// and the coverage tests all read one inventory. @fm2 FM-006 FM-018
import { GRADES, LEVELS } from "./contract.js";
import { missingLanguages } from "./lang.js";

export const MIN_SKILLS_PER_GRADE = 10;
export const MIN_GAMES_PER_GRADE = 6;

export const covers = (skill, grade) => Array.isArray(skill?.grades) && skill.grades[0] <= grade && grade <= skill.grades[1];

const shelf = (games) => [...(games || [])].sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

export function skillsFor(games, grade) {
  const out = [];
  for (const game of shelf(games)) {
    for (const skill of game.skills || []) {
      if (covers(skill, grade)) out.push({ gameId: game.id, skillId: skill.id, strand: skill.strand, title: skill.title, standard: skill.standard, levels: LEVELS });
    }
  }
  return out;
}

export function buildInventory(games) {
  const byGrade = {};
  for (const grade of GRADES) byGrade[grade] = skillsFor(games, grade);
  const perGame = {};
  for (const game of games || []) {
    perGame[game.id] = { grades: GRADES.filter((g) => byGrade[g].some((entry) => entry.gameId === game.id)), skillCount: (game.skills || []).length };
  }
  const perGrade = {};
  for (const grade of GRADES) perGrade[grade] = { skills: byGrade[grade].length, games: new Set(byGrade[grade].map((e) => e.gameId)).size };
  const totals = { games: (games || []).length, skills: Object.values(perGame).reduce((sum, g) => sum + g.skillCount, 0), perGrade };
  return { byGrade, perGame, totals };
}

// Everything that must be true of the shelf as a whole; an empty array means the inventory is releasable.
export function coverageProblems(games) {
  const problems = [];
  const list = games || [];
  if (list.length !== 10) problems.push(`expected 10 games, found ${list.length}`);
  const ids = new Set();
  const mechanics = new Map();
  for (const game of list) {
    if (ids.has(game.id)) problems.push(`duplicate game id ${game.id}`);
    ids.add(game.id);
    const mechanic = String(game.mechanic || "").trim().toLowerCase();
    if (!mechanic) problems.push(`${game.id}: missing mechanic`);
    else if (mechanics.has(mechanic)) problems.push(`${game.id} and ${mechanics.get(mechanic)} share the mechanic "${mechanic}"`);
    else mechanics.set(mechanic, game.id);
    for (const field of ["title", "tagline", "together"]) problems.push(...missingLanguages(game[field], `${game.id}.${field}`).map((p) => `missing language: ${p}`));
    for (const lang of ["en", "es"]) if (!Array.isArray(game.howTo?.[lang]) || !game.howTo[lang].length) problems.push(`missing language: ${game.id}.howTo.${lang}`);
    const seen = new Set();
    for (const skill of game.skills || []) {
      if (seen.has(skill.id)) problems.push(`${game.id}: duplicate skill id ${skill.id}`);
      seen.add(skill.id);
      for (const field of ["strand", "title"]) problems.push(...missingLanguages(skill[field], `${game.id}.${skill.id}.${field}`).map((p) => `missing language: ${p}`));
      if (typeof skill.standard !== "string" || skill.standard.length < 3) problems.push(`${game.id}.${skill.id}: missing standard`);
      if (!Array.isArray(skill.grades) || !(skill.grades[0] >= 0 && skill.grades[1] <= 8 && skill.grades[0] <= skill.grades[1])) problems.push(`${game.id}.${skill.id}: invalid grade range`);
    }
  }
  const inventory = buildInventory(list);
  for (const grade of GRADES) {
    const { skills, games: gameCount } = inventory.totals.perGrade[grade];
    if (skills < MIN_SKILLS_PER_GRADE) problems.push(`grade ${grade}: only ${skills} skills (need ${MIN_SKILLS_PER_GRADE})`);
    if (gameCount < MIN_GAMES_PER_GRADE) problems.push(`grade ${grade}: only ${gameCount} games (need ${MIN_GAMES_PER_GRADE})`);
  }
  for (const game of list) {
    const missing = GRADES.filter((g) => !inventory.perGame[game.id].grades.includes(g));
    if (missing.length) problems.push(`${game.id} does not cover grade ${missing.join(", ")}`);
  }
  return problems;
}
