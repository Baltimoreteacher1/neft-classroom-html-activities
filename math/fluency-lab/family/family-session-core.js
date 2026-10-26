import { GRADES, seededRandom } from "../problem-bank.js";
import { adaptiveProblem, difficulty, findSkill, prerequisites, recommendations, skillKey } from "../tutor-engine.js";

export const NIGHT_STAGES = ["retrieval", "concept", "independent", "family", "reflection"];
export const NIGHT_STORAGE = "ewl-family-night-v1";

const itemFor = (skill, tutor, rng, recent = []) => {
  const level = Math.max(0, difficulty(tutor, skill));
  for (let attempt = 0; attempt < 24; attempt++) {
    const item = adaptiveProblem(skill, rng, level);
    if (!recent.includes(item.question)) return { ...item, skillKey: skillKey(skill), level };
  }
  const item = adaptiveProblem(skill, rng, level);
  return { ...item, skillKey: skillKey(skill), level };
};

function problemList(skills, count, tutor, rng, recent = []) {
  return Array.from({ length: count }, (_, index) => {
    const skill = skills[index % skills.length];
    const item = itemFor(skill, tutor, rng, recent);
    recent.push(item.question);
    return item;
  });
}

export function createNightSession({ grade, profile, lang = "en", skill: requestedSkill, tutor, now = Date.now() }) {
  if (!GRADES.some((entry) => entry.grade === Number(grade))) throw new RangeError("Choose a supported grade.");
  if (!Number.isInteger(Number(profile)) || Number(profile) < 0 || Number(profile) > 5) throw new RangeError("Choose a valid local learner profile.");
  const gradeNumber = Number(grade);
  const ranked = recommendations(tutor, gradeNumber, now);
  const target = ranked.find((entry) => entry.skill.id === requestedSkill)?.skill || ranked[0]?.skill;
  if (!target) throw new RangeError("This grade has no skills to practice.");
  const prior = ranked.filter((entry) => entry.status.recent.length > 0 || entry.status.due).map((entry) => entry.skill);
  const foundation = prerequisites(target)[0];
  const warmSkills = (prior.length ? prior : foundation ? [foundation] : [target]).slice(0, 2);
  const seed = (now ^ (gradeNumber * 104729) ^ (Number(profile) * 13007)) >>> 0;
  const rng = seededRandom(seed);
  const recentQuestions = [];
  const retrieval = problemList(warmSkills, 2, tutor, rng, recentQuestions);
  const independent = problemList([target], 2, tutor, rng, recentQuestions);
  const family = problemList([target], 1, tutor, rng, recentQuestions);
  const randomId = `${seed.toString(36)}-${Math.floor(rng() * 0x100000000).toString(36)}`;
  return {
    version: 1,
    id: randomId,
    profile: Number(profile),
    grade: gradeNumber,
    lang: lang === "es" ? "es" : "en",
    skillKey: skillKey(target),
    startedAt: now,
    updatedAt: now,
    stage: "retrieval",
    stages: {
      retrieval: { items: retrieval, cursor: 0, complete: false, correct: 0, assisted: 0, priorEvidence: prior.length > 0 },
      concept: { complete: false },
      independent: { items: independent, cursor: 0, complete: false, correct: 0, assisted: 0 },
      family: { items: family, cursor: 0, complete: false, correct: 0, assisted: 0 },
      reflection: { complete: false, strategy: null },
    },
  };
}

export function sanitizeNightSession(value, { profile, grade } = {}) {
  if (!value || value.version !== 1 || Number(value.profile) !== Number(profile) || Number(value.grade) !== Number(grade)) return null;
  if (!NIGHT_STAGES.includes(value.stage) || findSkill(value.skillKey)?.grade !== Number(grade)) return null;
  for (const name of ["retrieval", "independent", "family"]) {
    const stage = value.stages?.[name];
    if (!stage || !Array.isArray(stage.items) || !stage.items.length || stage.items.length > 4 || !Number.isInteger(stage.cursor) || stage.cursor < 0 || stage.cursor > stage.items.length || stage.items.some((item) => {
      const skill = findSkill(item.skillKey);
      return !skill || typeof item.question !== "string" || item.question.length > 500 || !Array.isArray(item.answers) || item.answers.length < 1 || item.answers.length > 8 || item.answers.some((answer) => String(answer).length > 120);
    })) return null;
  }
  if (!value.stages?.concept || !value.stages?.reflection) return null;
  return value;
}

export function currentNightSkill(session, stage = session.stage) {
  if (stage === "concept" || stage === "independent" || stage === "family") return findSkill(session.skillKey);
  const item = session.stages?.[stage]?.items?.[session.stages?.[stage]?.cursor];
  return findSkill(item?.skillKey) || findSkill(session.skillKey);
}

export function markNightStageComplete(session, stage, now = Date.now()) {
  if (!NIGHT_STAGES.includes(stage) || session.stage !== stage) return false;
  session.stages[stage].complete = true;
  session.stages[stage].completedAt = now;
  session.updatedAt = now;
  return true;
}

export function moveNightStage(session, now = Date.now()) {
  const index = NIGHT_STAGES.indexOf(session.stage);
  if (index < 0 || !session.stages[session.stage]?.complete || index >= NIGHT_STAGES.length - 1) return false;
  session.stage = NIGHT_STAGES[index + 1];
  session.updatedAt = now;
  return true;
}
