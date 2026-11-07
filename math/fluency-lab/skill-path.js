// Grade → Domain → Topic → Skill, plus the five-stage learning path (Learn, Try It, Practice, Play, Grow).
// The curriculum's own `strand` names are too fine and too uneven to browse (Grade 3 has "Multiplication" and
// "Operations", Grade 5 has "Operations" that means multiply and divide). This file is the single place that
// groups every skill into one consistent topic. Skill ids, grades and saved records are never touched.
import { GRADES } from "./problem-bank.js";

export const DOMAINS = [
  { id: "number", name: "Number & Operations" },
  { id: "fractions", name: "Fractions & Decimals" },
  { id: "algebra", name: "Ratios & Algebra" },
  { id: "measure", name: "Measurement, Geometry & Data" },
];

// Display order, and the one label every grade uses for the same topic.
export const TOPICS = [
  { id: "counting", name: "Counting", domain: "number" },
  { id: "number-sense", name: "Number Sense", domain: "number" },
  { id: "place-value", name: "Place Value", domain: "number" },
  { id: "add-subtract", name: "Add & Subtract", domain: "number" },
  { id: "multiplication", name: "Multiplication", domain: "number" },
  { id: "division", name: "Division", domain: "number" },
  { id: "factors-multiples", name: "Factors & Multiples", domain: "number" },
  { id: "integers-rational", name: "Integers & Rational Numbers", domain: "number" },
  { id: "exponents-roots", name: "Exponents & Roots", domain: "number" },
  { id: "fractions", name: "Fractions", domain: "fractions" },
  { id: "decimals", name: "Decimals", domain: "fractions" },
  { id: "patterns", name: "Patterns", domain: "algebra" },
  { id: "ratios-percents", name: "Ratios & Percents", domain: "algebra" },
  { id: "expressions-equations", name: "Expressions & Equations", domain: "algebra" },
  { id: "functions", name: "Linear Relationships & Functions", domain: "algebra" },
  { id: "measurement-geometry", name: "Measurement & Geometry", domain: "measure" },
  { id: "money", name: "Money", domain: "measure" },
  { id: "data", name: "Data & Statistics", domain: "measure" },
];

const STRAND_TOPIC = {
  Counting: "counting",
  "Number sense": "number-sense",
  "Number relationships": "number-sense",
  "Place value": "place-value",
  Operations: "add-subtract",
  Fluency: "add-subtract",
  Addition: "add-subtract",
  Subtraction: "add-subtract",
  Multiplication: "multiplication",
  Division: "division",
  "Number theory": "factors-multiples",
  "Number system": "integers-rational",
  "Rational numbers": "integers-rational",
  Fractions: "fractions",
  Decimals: "decimals",
  Patterns: "patterns",
  Ratios: "ratios-percents",
  Proportions: "ratios-percents",
  Percents: "ratios-percents",
  Expressions: "expressions-equations",
  Equations: "expressions-equations",
  Systems: "expressions-equations",
  "Linear relationships": "functions",
  Functions: "functions",
  Exponents: "exponents-roots",
  "Scientific notation": "exponents-roots",
  "Real numbers": "exponents-roots",
  Geometry: "measurement-geometry",
  "Geometry extension": "measurement-geometry",
  Measurement: "measurement-geometry",
  Money: "money",
  Data: "data",
  Statistics: "data",
};

// Where a skill's strand name would put it in the wrong topic.
const SKILL_TOPIC = {
  "5:multiply-whole": "multiplication",
  "5:divide-whole": "division",
  "6:gcf": "factors-multiples",
  "6:lcm": "factors-multiples",
  "6:divide-fractions": "fractions",
  "6:decimal-ops": "decimals",
  "6:multi-digit-division": "division",
  "6:order-rational": "integers-rational",
};

export const skillKey = (skill) => `${skill.grade}:${skill.id}`;
export const topicById = (id) => TOPICS.find((topic) => topic.id === id) || null;
export const topicIdFor = (skill) =>
  SKILL_TOPIC[skillKey(skill)] || STRAND_TOPIC[skill.strand] || null;
export const topicOf = (skill) => topicById(topicIdFor(skill));

// The topics a grade really has, in display order, each with its skills in curriculum order.
export function topicsFor(grade) {
  const skills = GRADES.find((entry) => entry.grade === grade)?.skills || [];
  return TOPICS.map((topic) => ({
    ...topic,
    skills: skills.filter((skill) => topicIdFor(skill) === topic.id),
  })).filter((topic) => topic.skills.length);
}

// The next skill to learn: the following one in this topic, else the first skill of the grade's next topic.
export function nextSkillAfter(skill) {
  const topics = topicsFor(skill.grade);
  const at = topics.findIndex((topic) => topic.id === topicIdFor(skill));
  if (at < 0) return null;
  const inTopic = topics[at].skills;
  const here = inTopic.findIndex((candidate) => candidate.id === skill.id);
  if (here < inTopic.length - 1) return inTopic[here + 1];
  return topics[at + 1]?.skills[0] || null;
}

export const STAGES = [
  { id: "learn", name: "Learn" },
  { id: "try", name: "Try It" },
  { id: "practice", name: "Practice" },
  { id: "play", name: "Play ##nav" },
  { id: "grow", name: "Grow" },
];
const STAGE_IDS = STAGES.map((stage) => stage.id);

// The lab's existing practice modes stay as they are; each one belongs to a stage.
const MODE_STAGE = {
  learn: "learn",
  visual: "try",
  guided: "try",
  quick: "practice",
  flashcard: "practice",
  practice: "practice",
  adaptive: "practice",
  streak: "practice",
};
export const stageOfMode = (mode) => MODE_STAGE[mode] || "practice";
// Stages that open one of those modes. Play and Grow have their own panels.
export const STAGE_MODE = { learn: "learn", try: "visual", practice: "practice" };
export const isStage = (value) => STAGE_IDS.includes(value);
export const stageAfter = (id) => STAGES[STAGE_IDS.indexOf(id) + 1]?.id || null;
export const stageLabel = (id) => STAGES.find((stage) => stage.id === id)?.name || "";

// The same URL the lab already writes for a skill: it works in a fresh browser with nothing saved.
export function skillPath(grade, skillId, stage = null) {
  const params = new URLSearchParams({ grade: String(grade), skill: skillId });
  if (stage && stage !== "learn" && isStage(stage)) params.set("stage", stage);
  return `?${params}`;
}

// A saved "last place" is trusted only when its grade and skill still exist.
export function validLastVisit(raw) {
  const grade = GRADES.find((entry) => entry.grade === raw?.grade);
  const skill = grade?.skills.find((entry) => entry.id === raw?.skillId);
  if (!skill) return null;
  return {
    grade: grade.grade,
    skillId: skill.id,
    stage: isStage(raw.stage) ? raw.stage : "learn",
    skill,
  };
}
