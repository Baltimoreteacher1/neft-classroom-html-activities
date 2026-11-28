// Project the same Fluency Lab items used in practice onto the Studio's printable resource blocks.
import { framesFor } from "./lang.js";
import { normalizeOpts } from "./model.js";
import { practiceProblem, sourceSkill } from "./fluency-problems.js";

const FLUENCY_RESOURCE = "fluency-practice";
const ITEM_TAG = 0;
const DRAW_LIMIT = 32;

function visualFor(item, grade) {
  const m = item.model;
  if (!m) return undefined;
  if (m.type === "counters" && grade <= 2) {
    if (m.kind === "join") return { kind: "bond", whole: "?", a: m.filled, b: m.shown - m.filled };
    if (m.kind === "takeAway") return { kind: "tenframe", n: m.target, frames: Math.ceil(m.total / 10) };
    if (m.kind === "missing") return { kind: "tenframe", n: m.filled, frames: Math.ceil(m.total / 10) };
  }
  if (m.type === "array" && !m.share && !m.unit && m.a <= 12 && m.b <= 12) return { kind: "array", rows: m.a, cols: m.b };
  if (m.type === "dataTable") return { kind: "table", headers: m.headers, rows: m.rows, caption: m.caption };
  return undefined;
}

function draw(source, seed, seen) {
  let item;
  for (let i = 0; i < DRAW_LIMIT; i++) {
    item = practiceProblem(source, seed + Math.imul(i, 104729));
    if (!seen.has(item.question)) break;
  }
  seen.add(item.question);
  return item;
}

function answerWithUnit(item) {
  const answer = String(item.displayAnswer);
  const unit = item.unit;
  return unit && !answer.endsWith(unit) ? `${answer} ${unit}` : answer;
}

export function buildFluencyResource(skill, entry, opts = {}) {
  const source = sourceSkill(entry.grade, entry.id);
  if (!source || skill.grade !== entry.grade) throw new Error("Invalid Fluency skill for this resource");
  const op = normalizeOpts(opts, skill);
  const count = Math.max(1, Math.min(20, Math.trunc(op.count) || 8));
  const seed = Math.trunc(op.seed) >>> 0;
  const hidden = new Set(Array.isArray(op.hide) ? op.hide.map(Number) : []);
  const seen = new Set();
  const blocks = [];
  const key = [];
  for (let idx = 1; idx <= count; idx++) {
    const override = Number(op.pseed[`${ITEM_TAG}:${idx}`]);
    const item = draw(source, Number.isFinite(override) ? override : (Math.imul(seed, 1009) + idx), seen);
    if (hidden.has(idx)) continue;
    const n = blocks.length + 1;
    // A write-in activity works on paper and in the offline web export. The learner blocks never carry the key.
    blocks.push({
      t: "problem",
      n,
      tag: ITEM_TAG,
      idx,
      ask: item.question,
      visual: visualFor(item, skill.grade),
      choices: item.choices || undefined,
      workspace: { kind: skill.grade <= 2 ? "box" : "lines", size: 2 },
    });
    key.push({ ref: `Problem ${n}`, answer: answerWithUnit(item), work: item.steps });
  }
  const frames = op.writing === "none" ? [] : framesFor(skill, op.band, op.writing === "starter" ? 1 : 2);
  const sections = [
    { heading: "Practice", blocks: [{ t: "p", style: "directions", text: "Solve each problem. Show your work with numbers, words, or a drawing." }, ...blocks] },
    {
      heading: "Explain a strategy",
      blocks: [
        { t: "p", text: "Choose one problem. Explain why your method works, then show how you could check your answer." },
        ...(frames.length ? [{ t: "frames", items: frames }] : []),
        { t: "lines", prompt: "My reasoning", n: 3 },
      ],
    },
  ];
  return {
    id: `${skill.id}:${FLUENCY_RESOURCE}.${entry.id}:${seed}`,
    skillId: skill.id,
    grade: skill.grade,
    type: FLUENCY_RESOURCE,
    title: `${source.title}: Fluency practice set`,
    subtitle: "Fluency practice set",
    meta: {
      minutes: Math.max(5, blocks.length),
      support: op.support,
      mathLevel: 2,
      langBand: op.band,
      independence: "Independent practice",
      roles: ["worksheet", "independent-practice"],
      standards: skill.standards.codes,
      standardsNote: "Informational Studio alignment. The selected topic covers part or all of this skill.",
      objective: source.learn?.idea || skill.studentObjective,
      seed,
      family: source.generator,
    },
    sections,
    key,
    notes: ["Listen for why the strategy works and how the learner could check it. Accept equivalent correct answers that match the requested form."],
  };
}
