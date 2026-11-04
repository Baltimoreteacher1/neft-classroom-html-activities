// EduWonderLab 7.0 Socratic coach: a PURE state machine. Given the problem, the learner's response and how far the
// conversation has gone, it returns the next coaching move. Nothing here calls a network or a model, so a classroom with
// no AI endpoint gets exactly this. Mathematics is never decided here: correctness comes from the lab's own
// validateAnswer, and misconception names come from the deterministic misconception engine.
//
// Ladder: noticing question -> representation -> next step (answer-free, capped by peekCap) -> reveal with explanation.
// A misconception is NAMED only when the engine is `conceptual` AND `high` confidence; otherwise the coach asks a
// question instead of asserting a diagnosis. Non-reveal moves are filtered so they cannot state the answer.
import { validateAnswer } from "../problem-bank.js";
import { analyzeResponse } from "../e8/misconception-engine.js";
import { MISCONCEPTIONS } from "../e8/misconception-library.js";
import { peekCap } from "../step-leak.js";

const bi = (en, es) => ({ en, es });
export const MAX_LEVEL = 4; // 1 noticing, 2 representation, 3 next step, 4 reveal
const plain = (value) => String(value ?? "").normalize("NFKC").replace(/[−–]/g, "-").toLowerCase();

// Does `text` state any of the answers that the question itself does not already show?
export function leaksAnswer(text, item) {
  const body = plain(text);
  const asked = plain(item.question);
  return (item.answers || []).some((answer) => {
    const form = plain(answer).trim();
    if (!form) return false;
    const re = new RegExp(`(?<![\\d./])${form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\d]|\\.\\d|/\\d)`);
    return re.test(body) && !re.test(asked);
  });
}

const GENERIC = {
  noticing: bi("Read the problem again. What is it asking for, and what do you already know?", "Lee el problema otra vez. ¿Qué pide y qué ya sabes?"),
  representation: bi("Try the picture on the left. Change it and watch what happens to the numbers.", "Prueba el dibujo de la izquierda. Cámbialo y mira qué pasa con los números."),
  stuck: bi("Let's go one small step at a time.", "Vamos paso a paso."),
};

export function nextMove({ concept, item, response, level = 0, lang = "en" }) {
  if (!item) throw new Error("nextMove needs an item");
  const text = String(response ?? "").trim();
  if (text && validateAnswer(text, item)) {
    return { kind: "confirm", level, reveal: false, correct: true, text: bi("Yes — that works. Can you say why in your own words?", "Sí, eso funciona. ¿Puedes decir por qué con tus palabras?"), named: null };
  }
  const analysis = text ? analyzeResponse({ skill: concept?.skill, question: item.question, answers: item.answers, response: text }) : { category: "incomplete" };
  const named = analysis.category === "conceptual" && analysis.confidence === "high" ? analysis : null;
  const next = Math.min(MAX_LEVEL, level + 1);
  let move;
  if (next === 1) {
    move = named
      ? { kind: "noticing", text: bi(`I notice you ${lowerFirst(named.evidence?.en || "tried something")}. What would that mean in the picture?`, `Veo que ${lowerFirst(named.evidence?.es || "intentaste algo")}. ¿Qué significaría eso en el dibujo?`) }
      : { kind: "noticing", text: analysis.category === "incomplete" ? GENERIC.noticing : bi("Tell me how you got that. Which step were you sure about?", "Cuéntame cómo lo obtuviste. ¿De qué paso estabas seguro?") };
  } else if (next === 2) {
    const m = named && MISCONCEPTIONS.find((x) => x.id === named.id);
    move = { kind: "representation", model: concept?.primaryModel || null, text: m?.counter || GENERIC.representation };
  } else if (next === 3) {
    const steps = (item.steps || []).slice(0, Math.max(1, peekCap(item)));
    move = { kind: "next-step", steps, text: steps.length ? bi(steps[0], steps[0]) : GENERIC.stuck };
  } else {
    move = { kind: "reveal", text: bi(item.explanation || `The answer is ${item.displayAnswer}.`, item.explanation || `La respuesta es ${item.displayAnswer}.`), answer: item.displayAnswer };
  }
  const safe = move.kind === "reveal" || !leaksAnswer(`${move.text.en} ${move.text.es}`, item);
  if (!safe) move = { kind: move.kind, model: move.model, text: GENERIC.stuck, filtered: true };
  return { ...move, level: next, reveal: move.kind === "reveal", correct: false, named: named ? { id: named.id, title: named.title } : null, lang };
}

const lowerFirst = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

// Engagement guard: a learner who has not made an attempt cannot skip straight to the reveal.
export function canReveal({ attempts = 0, level = 0 }) {
  return attempts >= 1 && level >= MAX_LEVEL - 1;
}
