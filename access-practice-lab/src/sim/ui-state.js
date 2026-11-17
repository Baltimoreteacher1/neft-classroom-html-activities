// Living Language Simulation Engine: what the player remembers between renders that is NOT mission state (which
// panel is open, drafts being typed, a recording in progress). It is lost on a reload on purpose; everything that
// matters (evidence, decisions, help opened, finished work) lives in the runtime state and is saved.
export const freshUi = (preview = false) => ({
  preview, // an embedded preview: nothing is written to the loop store or the ledger
  view: "scene", // "scene" | "map"
  panel: null, // { kind: "evidence" | "character" | "task" | "journal" | "outcome" | "complete", id? }
  listen: { played: false, transcript: false },
  drafts: {}, // text being typed, by task id (and "reason:<taskId>")
  spoken: {}, // task ids whose draft came from speech-to-text
  cmp: {}, // comparison picks by task id: { pair, relation, stronger }
  cite: {}, // decision picks by task id: { option, cited[] }
  confirm: "", // task id of a decision waiting for "yes"
  question: "", // the learner's own question, as typed
  lastQ: null, // { character, text, matched, thinking? }
  thinking: "", // character id while the helper is matching a typed question
  aiAllowed: null, // Promise<boolean>: may this device ask the helper (class setting aiCoach)
  dict: null, // { key, session } while speech-to-text runs
  recording: "", // recorder key while recording
  feedback: {}, // feedback by task id for this visit (previews keep it only here)
  note: null, // [en, es] message for the open panel
  speaking: false,
  words: false,
  shared: null, // result of the last share press
  busy: false,
  arriving: false, // the scene just changed (drives the gentle transition)
});

export const speakingNow = (ui) => Boolean(ui.speaking);
export const recKey = (def, taskId) => `sim:${def.id}:${taskId}`;
