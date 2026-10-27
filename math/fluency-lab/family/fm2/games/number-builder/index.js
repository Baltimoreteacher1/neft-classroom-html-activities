// Game 1, Number Builder: the learner constructs a value out of pieces (counters, base-ten blocks, discs, chips,
// digit tiles, a coefficient and a power of ten) until it equals the target and meets the rules. Many builds are right.
// @fm2 FM-007 FM-017 FM-019
import { NB_ICON } from "../../art/place-value.js";
import { HOW_TO, SKILL_COPY, TAGLINE, TITLE, TOGETHER } from "./copy.js";
import { answerText, check, hint, solve } from "./logic.js";
import * as early from "./rounds.js";
import * as chips from "./rounds-chips.js";
import * as upper from "./rounds-upper.js";
import { mount } from "./ui.js";

const SKILLS = [
  { id: "k-count", grades: [0, 0], standard: "K.CC.B.5", gen: early.kCount },
  { id: "k-bonds", grades: [0, 0], standard: "K.OA.A.3", gen: early.kBonds },
  { id: "g1-tens-ones", grades: [1, 1], standard: "1.NBT.B.2", gen: early.g1TensOnes },
  { id: "g1-teen", grades: [1, 1], standard: "1.NBT.B.2b", gen: early.g1Teen },
  { id: "g2-hundreds", grades: [2, 2], standard: "2.NBT.A.1", gen: early.g2Hundreds },
  { id: "g2-regroup", grades: [2, 2], standard: "2.NBT.B.9", gen: early.g2Regroup },
  { id: "g3-discs", grades: [3, 3], standard: "3.NBT.A.1", gen: early.g3Discs },
  { id: "g3-expanded", grades: [3, 3], standard: "2.NBT.A.3", gen: early.g3Expanded },
  { id: "g4-discs", grades: [4, 4], standard: "4.NBT.A.2", gen: upper.g4Discs },
  { id: "g4-tile-chart", grades: [4, 4], standard: "4.NBT.A.2", gen: upper.g4Tiles },
  { id: "g5-decimal-pieces", grades: [5, 5], standard: "5.NBT.A.3", gen: upper.g5DecimalPieces },
  { id: "g5-decimal-regroup", grades: [5, 5], standard: "5.NBT.A.1", gen: upper.g5DecimalRegroup },
  { id: "g6-chips", grades: [6, 6], standard: "6.NS.C.5", gen: chips.g6Chips },
  { id: "g6-zero-pairs", grades: [6, 6], standard: "6.NS.C.6a", gen: chips.g6ZeroPairs },
  { id: "g7-signed-chips", grades: [7, 7], standard: "7.NS.A.1", gen: chips.g7SignedChips },
  { id: "g7-zero-sum", grades: [7, 7], standard: "7.NS.A.1b", gen: chips.g7ZeroSum },
  { id: "g7-exponent-discs", grades: [6, 7], standard: "6.EE.A.1", gen: upper.g7ExponentDiscs },
  { id: "g8-sci-build", grades: [8, 8], standard: "8.EE.A.3", gen: upper.g8SciBuild },
  { id: "g8-exp-equivalence", grades: [8, 8], standard: "8.EE.A.1", gen: upper.g8ExpEquivalence },
];

function makeRound(skillId, level, rng, grade) {
  const skill = SKILLS.find((s) => s.id === skillId);
  if (!skill) throw new RangeError(`Unknown Number Builder skill: ${skillId}`);
  const lv = Math.min(3, Math.max(1, Math.round(level)));
  const g = Math.min(
    skill.grades[1],
    Math.max(skill.grades[0], Math.round(grade ?? skill.grades[0])),
  );
  return { ...skill.gen(lv, rng, g), skill: skillId, level: lv, grade: g };
}

export default {
  id: "number-builder",
  mechanic: "compose-to-target",
  order: 1,
  title: TITLE,
  tagline: TAGLINE,
  howTo: HOW_TO,
  icon: NB_ICON,
  secPerRound: 60,
  together: TOGETHER,
  skills: SKILLS.map(({ id, grades, standard }) => ({
    id,
    grades,
    standard,
    strand: SKILL_COPY[id].strand,
    title: SKILL_COPY[id].title,
  })),
  makeRound,
  check,
  hint,
  solve,
  answerText,
  mount,
  cssHref: new URL("./game.css", import.meta.url).href,
};
