// nexus/orchestrate.mjs — turns a resource's goal into a coherent, bounded
// sequence of steps. Each goal has an authored order (not generated), and short
// practice stays short: "practice" is at most five steps. Steps that a resource
// cannot support (speaking without full language support, the what-if explorer
// on a topic with no consequences) are dropped, never shown empty. Pure.

import { allowed } from "./compat.mjs";

const P = (en, es) => ({ en, es });

export const STEP_LABEL = {
  story: P("The situation", "La situación"),
  model: P("See the model", "Mira el modelo"),
  twin: P("What if…?", "¿Qué pasa si…?"),
  check: P("Check your thinking", "Comprueba tu razonamiento"),
  speak: P("Say it", "Dilo"),
  write: P("Write it", "Escríbelo"),
  respond: P("Your next step", "Tu siguiente paso"),
  transfer: P("Somewhere new", "En otro lugar"),
  replay: P("Replay my thinking", "Repetir mi razonamiento"),
};

export const GOAL_INFO = {
  understand: { label: P("Understand the idea", "Entender la idea"), detail: P("Situation, animated model, what-if explorer, questions, a written explanation.", "Situación, modelo animado, explorador, preguntas y una explicación escrita.") },
  practice: { label: P("Practice on their own", "Practicar por su cuenta"), detail: P("Short: questions with feedback, a next step, a fresh problem.", "Corto: preguntas con retroalimentación, un siguiente paso y un problema nuevo.") },
  explain: { label: P("Explain their reasoning", "Explicar su razonamiento"), detail: P("Model, questions, oral rehearsal, because / but / so writing.", "Modelo, preguntas, ensayo oral y escritura con porque / pero / así que.") },
  transfer: { label: P("Apply it somewhere new", "Aplicarlo en otro lugar"), detail: P("Quick check, then an unfamiliar problem and an explanation.", "Comprobación rápida, luego un problema desconocido y una explicación.") },
};

const ORDER = {
  understand: ["story", "model", "twin", "check", "write", "respond", "replay"],
  practice: ["story", "check", "respond", "transfer", "replay"],
  explain: ["story", "model", "check", "speak", "write", "respond", "replay"],
  transfer: ["story", "check", "transfer", "write", "replay"],
};

const NEEDS = { model: "model", twin: "twin", speak: "speaking", write: "writing", transfer: "mission" };

/** The step ids for this resource, in order. */
export function sequence(r) {
  return ORDER[r.goal].filter((s) => !NEEDS[s] || allowed(r, NEEDS[s]));
}
