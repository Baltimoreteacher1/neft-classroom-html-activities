// Authored data for Living Writing (compose.js): organizer boxes, what each move does for a reader (EN + ES), and overlay groups.
// Starters are sentence frames with blanks and questions never state an answer. Spanish is natural, not word for word.

// ── organizer boxes ───────────────────────────────────────────────────────────
// A box is a place in the plan. `starter` is a sentence frame with a blank (support modes only); `ask` is the question the box asks.
export const BOXES = {
  claim: {
    label: ["Claim", "Afirmación"],
    ask: ["What is your position?", "¿Cuál es tu postura?"],
    starter: "I believe that ___.",
  },
  reasons: {
    label: ["Reasons", "Razones"],
    ask: ["Why do you believe it?", "¿Por qué lo crees?"],
    starter: "I think this because ___.",
  },
  evidence: {
    label: ["Evidence", "Evidencia"],
    ask: ["Which fact shows it?", "¿Qué dato lo demuestra?"],
    starter: "The evidence shows that ___.",
  },
  counter: {
    label: ["Other view", "Otro punto de vista"],
    ask: ["What would someone who disagrees say?", "¿Qué diría alguien que no está de acuerdo?"],
    starter: "Some people think ___, but ___.",
  },
  conclusion: {
    label: ["Closing", "Cierre"],
    ask: [
      "How will you remind the reader of your position?",
      "¿Cómo le recordarás tu postura al lector?",
    ],
    starter: "In conclusion, ___.",
  },
  phenomenon: {
    label: ["What happened", "Qué pasó"],
    ask: ["What exactly are you explaining?", "¿Qué estás explicando exactamente?"],
    starter: "I am explaining why ___.",
  },
  cause: {
    label: ["Cause", "Causa"],
    ask: ["What caused it?", "¿Qué lo causó?"],
    starter: "___ happened because ___.",
  },
  result: {
    label: ["Result", "Resultado"],
    ask: ["What happened next because of that?", "¿Qué pasó después por eso?"],
    starter: "Because of this, ___, which led to ___.",
  },
  setting: {
    label: ["Setting", "Escenario"],
    ask: ["Where, when and who?", "¿Dónde, cuándo y quién?"],
    starter: "One day, in ___, ___.",
  },
  events: {
    label: ["Events", "Sucesos"],
    ask: ["What happened, in order?", "¿Qué pasó, en orden?"],
    starter: "First, ___. Then ___.",
  },
  ending: {
    label: ["Ending", "Final"],
    ask: ["How did it end?", "¿Cómo terminó?"],
    starter: "In the end, ___.",
  },
  topic: {
    label: ["Topic", "Tema"],
    ask: [
      "What is your topic and what kind of thing is it?",
      "¿Cuál es tu tema y qué tipo de cosa es?",
    ],
    starter: "___ is a kind of ___.",
  },
  details: {
    label: ["Details", "Detalles"],
    ask: ["Which facts or numbers will you give?", "¿Qué datos o números darás?"],
    starter: "One important detail is ___.",
  },
  organize: {
    label: ["Grouping", "Agrupación"],
    ask: ["How are your details grouped?", "¿Cómo agrupas tus detalles?"],
    starter: "Another ___ is ___.",
  },
  close: {
    label: ["Wrap-up", "Cierre"],
    ask: ["What is the one thing to remember?", "¿Qué es lo único que se debe recordar?"],
    starter: "The main point is ___.",
  },
};
export const BOX_MOVE = {
  reasons: "reason",
  result: "chain",
  setting: "orient",
  ending: "response",
  conclusion: "restate",
};
/** The Key Language Use move a box looks for. "evidence" is the support move when the task explains. */
export const moveForBox = (box, keyUse) =>
  box === "evidence" && keyUse === "Explain" ? "support" : BOX_MOVE[box] || box;
export const starterFor = (boxId) => BOXES[boxId]?.starter || "";

// ── what each move does for a reader (plain language, EN + ES) ────────────────
export const WHY = {
  orient: [
    ["sets the scene", "ubica la escena"],
    ["knows where and when it happens", "sabe dónde y cuándo ocurre"],
  ],
  sequence: [
    ["puts events in order with time words", "ordena los sucesos con palabras de tiempo"],
    [
      "can follow what happened first, next and last",
      "puede seguir qué pasó primero, después y al final",
    ],
  ],
  events: [
    ["tells what happened with action verbs", "cuenta lo que pasó con verbos de acción"],
    ["can picture what the characters did", "puede imaginar lo que hicieron los personajes"],
  ],
  response: [
    ["shows how it ended or what it meant", "muestra cómo terminó o qué significó"],
    ["knows why the story matters", "entiende por qué importa la historia"],
  ],
  topic: [
    ["names the topic", "nombra el tema"],
    ["knows right away what you are writing about", "sabe de inmediato sobre qué escribes"],
  ],
  details: [
    ["gives specific details", "da detalles específicos"],
    ["can picture the facts", "puede imaginar los datos"],
  ],
  organize: [
    ["groups ideas with signal words", "agrupa las ideas con palabras señal"],
    ["can see how your details connect", "ve cómo se conectan tus detalles"],
  ],
  close: [
    ["wraps up the main point", "cierra con la idea principal"],
    ["knows what to remember", "sabe qué debe recordar"],
  ],
  phenomenon: [
    ["says exactly what is being explained", "dice exactamente qué se explica"],
    ["is not confused about your topic", "no se confunde sobre tu tema"],
  ],
  cause: [
    ["links a cause to its effect", "une una causa con su efecto"],
    ["can see why it happened", "puede ver por qué sucedió"],
  ],
  chain: [
    ["connects more than one step", "conecta más de un paso"],
    [
      "can follow the whole chain, not just one link",
      "puede seguir toda la cadena, no solo un eslabón",
    ],
  ],
  support: [
    ["backs the explanation with a fact", "respalda la explicación con un dato"],
    [
      "can trust the explanation, since a fact supports it",
      "puede confiar en la explicación, pues un dato la apoya",
    ],
  ],
  claim: [
    ["states a clear position", "expresa una postura clara"],
    ["knows what you think", "sabe lo que piensas"],
  ],
  reason: [
    ["gives a reason", "da una razón"],
    ["understands why you think it", "entiende por qué lo piensas"],
  ],
  evidence: [
    ["uses evidence", "usa evidencia"],
    ["can check your reason against something real", "puede comprobar tu razón con algo real"],
  ],
  counter: [
    ["considers another point of view", "considera otro punto de vista"],
    ["sees that you thought about other ideas", "ve que pensaste en otras ideas"],
  ],
  restate: [
    ["returns to the position at the end", "vuelve a la postura al final"],
    ["remembers your position", "recuerda tu postura"],
  ],
};
export const JOB_WHY = {
  sequence: WHY.sequence,
  addition: [
    ["adds another idea", "suma otra idea"],
    ["can tell a new idea is coming", "sabe que viene otra idea"],
  ],
  cause: WHY.cause,
  contrast: [
    ["shows a difference or another side", "muestra una diferencia u otro lado"],
    ["can see how two ideas differ", "ve en qué se diferencian dos ideas"],
  ],
  example: [
    ["gives an example", "da un ejemplo"],
    ["can picture what you mean", "puede imaginar a qué te refieres"],
  ],
  evidence: [
    ["points to where a fact comes from", "señala de dónde viene un dato"],
    ["knows the fact has a source", "sabe que el dato tiene una fuente"],
  ],
  stance: WHY.claim,
  concession: WHY.counter,
  conclusion: WHY.close,
};
export const JOB_LABEL = {
  sequence: "order",
  addition: "adding",
  cause: "cause",
  contrast: "contrast",
  example: "example",
  evidence: "evidence",
  stance: "position",
  concession: "other view",
  conclusion: "wrap-up",
};

// Overlay groups the learner can switch on: what the move is for.
export const MOVE_KIND = {
  claim: "claim",
  phenomenon: "claim",
  topic: "claim",
  orient: "claim",
  restate: "claim",
  response: "claim",
  close: "claim",
  reason: "reason",
  cause: "reason",
  chain: "reason",
  sequence: "reason",
  events: "reason",
  organize: "reason",
  counter: "reason",
  evidence: "evidence",
  support: "evidence",
  details: "evidence",
};

