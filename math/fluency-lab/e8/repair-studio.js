// Mistake Repair Studio 2.0 (Enterprise 8). A structured pathway, not a re-try loop:
//   1 review the original work -> 2 name what happened -> 3 see a counterexample in a model -> 4 choose the repaired strategy
//   -> 5 explain the change -> 6 solve a NEW problem alone -> 7 update the evidence.
// Corrected work is recorded as supported; only the fresh problem, done with no hints, can count as independent.
import { ALL_SKILLS, generateProblem, seededRandom, validateAnswer } from "../problem-bank.js";
import { skillKey } from "../tutor-engine.js";
import { MISCONCEPTIONS, misconceptionById } from "./misconception-library.js";
import { itemSignature } from "../mastery-model.js";

const STEPS = ["review", "identify", "counterexample", "strategy", "explain", "fresh", "done"];
const pickStable = (list, seed) => list[Math.abs(seed) % list.length];

export class RepairStudio {
  // original: { skill (library skill), question, response, answers }; diagnosis: analysis from analyzeResponse (may be uncertain).
  constructor({ original, diagnosis = null, seed = 1 }) {
    this.original = original;
    this.diagnosis = diagnosis && diagnosis.id ? diagnosis : null;
    this.info = this.diagnosis ? misconceptionById(this.diagnosis.id) : null;
    this.seed = seed;
    this.index = 0;
    this.log = { identified: null, explained: null, strategyOk: null, attempts: 0, hints: 0, fresh: [] };
    this.fresh = null;
  }

  get step() { return STEPS[this.index]; }
  get done() { return this.step === "done"; }

  // Step 1: the learner's own work, with no answer revealed.
  reviewView() { return { question: this.original.question, response: this.original.response }; }

  // Step 2: options always include "I'm not sure". The diagnosed pattern is offered only when there is evidence for it.
  identifyOptions() {
    const sameDomain = MISCONCEPTIONS.filter((m) => m.id !== this.info?.id && (!this.info || m.domain === this.info.domain));
    const wrong = [pickStable(sameDomain, this.seed), pickStable(sameDomain, this.seed + 3)].filter(Boolean);
    const options = [...(this.info ? [this.info] : []), ...wrong].filter((m, i, a) => a.findIndex((x) => x.id === m.id) === i).slice(0, 3);
    const rotated = options.map((m, i) => ({ id: m.id, text: m.does })).sort((a, b) => ((a.id.length + this.seed) % 3) - ((b.id.length + this.seed) % 3));
    return [...rotated, { id: "unsure", text: { en: "I'm not sure what happened.", es: "No estoy seguro de qué pasó." } }];
  }
  identify(id) {
    this.log.identified = { id, matchesDiagnosis: Boolean(this.info && id === this.info.id), unsure: id === "unsure" };
    this.index = 2;
    return this.log.identified;
  }

  // Step 3: a model that shows why the idea fails. With no diagnosis the learner still gets the skill's own model.
  counterexample() {
    const modelId = this.info?.models[0] || null;
    return { model: modelId, statement: this.info?.counter || { en: "Look at your answer in a picture or on a number line and ask: does it make sense?", es: "Mira tu respuesta en una imagen o en una recta numérica y pregunta: ¿tiene sentido?" } };
  }
  confirmCounterexample() { this.index = 3; }

  // Step 4: pick the repaired strategy. Wrong options are other misconceptions' habits, so choosing one is informative.
  strategyOptions() {
    const idea = this.info?.idea || { en: "Check the answer against a model before you decide.", es: "Comprueba la respuesta con un modelo antes de decidir." };
    const wrong = MISCONCEPTIONS.filter((m) => m.id !== this.info?.id && (!this.info || m.domain === this.info.domain)).slice(0, 8);
    const distractors = [pickStable(wrong, this.seed + 1), pickStable(wrong, this.seed + 5)].filter(Boolean).filter((m, i, a) => a.findIndex((x) => x.id === m.id) === i);
    const options = [{ id: "right", ok: true, text: idea }, ...distractors.map((m) => ({ id: m.id, ok: false, text: m.does }))];
    return options.sort((a, b) => ((a.id.length + this.seed) % 4) - ((b.id.length + this.seed) % 4));
  }
  chooseStrategy(id) {
    this.log.strategyOk = id === "right";
    if (id === "right") this.index = 4;
    return { ok: id === "right", feedback: id === "right" ? null : { en: "That is the habit that caused the mistake. Look at the counterexample again.", es: "Ese es el hábito que causó el error. Mira otra vez el contraejemplo." } };
  }

  explain(text) {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    if (words.length < 5) return { ok: false, feedback: { en: "Write a full sentence about what you will do differently.", es: "Escribe una oración completa sobre lo que harás distinto." } };
    this.log.explained = { words: words.length };
    this.index = 5;
    this.startFresh();
    return { ok: true };
  }

  // Step 6: a new problem on the same skill. The numbers must differ from the original (different signature).
  startFresh() {
    const skill = this.original.skill;
    const originalSig = itemSignature(this.original.question);
    for (let i = 0; i < 60; i += 1) {
      const p = generateProblem(skill, seededRandom(this.seed * 977 + this.log.attempts * 131 + i * 17 + 5), 1);
      if (itemSignature(p.question) !== originalSig && !this.log.fresh.includes(itemSignature(p.question))) {
        this.fresh = p;
        this.log.fresh.push(itemSignature(p.question));
        return p;
      }
    }
    throw new Error("Could not build a fresh problem");
  }
  freshHint() { this.log.hints += 1; return skillHint(this.fresh); }
  answerFresh(value) {
    this.log.attempts += 1;
    const ok = validateAnswer(value, this.fresh);
    const independent = ok && this.log.hints === 0 && this.log.attempts === 1;
    if (ok) {
      this.result = { resolved: true, independent, freshCorrect: true, attempts: this.log.attempts, hints: this.log.hints };
      this.index = 6;
      return { ok: true, independent };
    }
    // One more targeted look at the counterexample, then a different fresh problem; three misses means "come back tomorrow".
    if (this.log.attempts >= 3) {
      this.result = { resolved: false, independent: false, freshCorrect: false, attempts: this.log.attempts, hints: this.log.hints, revisit: true };
      this.index = 6;
      return { ok: false, revisit: true };
    }
    this.index = 2;
    this.startFresh();
    return { ok: false, feedback: { en: "Not yet. Look at the model again, then try a different problem.", es: "Todavía no. Mira otra vez el modelo y prueba un problema diferente." } };
  }

  // Step 7: what to write to the evidence records.
  evidence() {
    const r = this.result || { resolved: false, independent: false, freshCorrect: false, attempts: this.log.attempts, hints: this.log.hints };
    return {
      skill: skillKey(this.original.skill),
      misconception: this.info?.id || null,
      // The corrected original is supported work. The fresh problem is independent only with no hints and no earlier miss.
      records: [
        { sig: itemSignature(this.original.question), correct: true, independent: false, level: 0, kind: "corrected-original" },
        ...(this.fresh ? [{ sig: itemSignature(this.fresh.question), correct: r.freshCorrect, independent: r.independent, level: 1, kind: "fresh" }] : []),
      ],
      resolved: r.resolved, independent: r.independent, attempts: r.attempts, revisit: Boolean(r.revisit),
      markRepaired: r.resolved && r.independent && Boolean(this.info),
    };
  }
}

function skillHint(problem) {
  return { en: problem.hint || "Use a picture or a model to check each step.", es: problem.hint || "Usa una imagen o un modelo para comprobar cada paso." };
}

export const repairableSkill = (key) => ALL_SKILLS.find((s) => skillKey(s) === key) || null;
