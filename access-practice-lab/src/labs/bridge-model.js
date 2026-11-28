// Connector Bridge: the pure logic. A connector builds a bridge of one relationship (cause, contrast, addition,
// sequence, example, conclusion); punctuation is part of the bridge; "weigh the evidence" shows which idea a
// contrast bridge puts the weight on. No DOM, no storage.
import { jobOf } from "../lang/labs-check.js";

/** Band palettes. The core list is the shared content palette; 6-8 adds four precise academic bridges. */
export const EXTRA_68 = ["in addition", "therefore", "even though", "on the other hand"];
export const paletteFor = (core, band) => (band === "6-8" ? [...core, ...EXTRA_68] : [...core]);

export const JOB_ORDER = ["cause", "contrast", "addition", "sequence", "example", "conclusion"];
export const JOB_NAMES = {
  cause: ["cause / result", "causa / resultado"],
  contrast: ["contrast", "contraste"],
  sequence: ["time order", "orden en el tiempo"],
  addition: ["adding on", "agregar"],
  example: ["example", "ejemplo"],
  conclusion: ["conclusion", "conclusión"],
};
/** The question that picks a bridge: what does idea B do to idea A? */
export const JOB_QUESTION = {
  cause: ["B is the reason for A, or the result of A.", "B es la razón de A, o el resultado de A."],
  contrast: [
    "B is different from A, or surprising after A.",
    "B es diferente de A, o sorprendente después de A.",
  ],
  sequence: ["B happens after A.", "B pasa después de A."],
  addition: ["B adds one more thing like A.", "B agrega una cosa más como A."],
  example: ["B is one example of A.", "B es un ejemplo de A."],
  conclusion: ["B sums up everything before it.", "B resume todo lo anterior."],
};

/** Spanish glosses for the English connectors (shown beside the English in ES and EN+ES, never instead of it). */
export const GLOSS = {
  because: "porque",
  so: "así que",
  but: "pero",
  although: "aunque",
  then: "luego",
  "after that": "después de eso",
  "for example": "por ejemplo",
  also: "también",
  however: "sin embargo",
  "as a result": "como resultado",
  "in addition": "además",
  therefore: "por lo tanto",
  "even though": "a pesar de que",
  "on the other hand": "por otro lado",
};

// ── punctuation ──────────────────────────────────────────────────────────────
const TRANSITIONS = new Set([
  "however",
  "as a result",
  "for example",
  "for instance",
  "after that",
  "also",
  "in addition",
  "therefore",
  "on the other hand",
  "in contrast",
  "finally",
  "moreover",
  "furthermore",
  "meanwhile",
]);
const CONJUNCTIONS = new Set(["so", "but", "and", "yet", "or"]);
const REASON = new Set(["because", "since"]);
const CONCESSION = new Set(["although", "even though", "while", "whereas", "though"]);

const R = (en, es) => ({ en, es });
/** How a connector is punctuated when it joins A and B. `before` and `after` are what sits on each side of the word. */
export function punctuation(connector) {
  const c = String(connector || "").toLowerCase();
  if (TRANSITIONS.has(c))
    return {
      kind: "transition",
      before: ";",
      after: ",",
      rule: R(
        `“${c}” starts a new complete sentence idea: a semicolon before it and a comma after it.`,
        `«${c}» abre una idea completa nueva: punto y coma antes y coma después.`,
      ),
    };
  if (CONJUNCTIONS.has(c))
    return {
      kind: "conjunction",
      before: ",",
      after: "",
      rule: R(
        `“${c}” joins two complete ideas: put a comma before it.`,
        `«${c}» une dos ideas completas: pon una coma antes.`,
      ),
    };
  if (REASON.has(c))
    return {
      kind: "reason",
      before: "",
      after: "",
      rule: R(
        `“${c}” needs no comma when it comes in the middle of the sentence.`,
        `«${c}» no lleva coma cuando va en medio de la oración.`,
      ),
    };
  if (CONCESSION.has(c))
    return {
      kind: "concession",
      before: ",",
      after: "",
      rule: R(
        `“${c}” brings in a surprising idea: a comma before it keeps the two ideas apart.`,
        `«${c}» trae una idea sorprendente: una coma antes mantiene separadas las dos ideas.`,
      ),
    };
  if (c === "then")
    return {
      kind: "sequence",
      before: ";",
      after: "",
      rule: R(
        "“then” after a semicolon needs no comma.",
        "«then» después de un punto y coma no lleva coma.",
      ),
    };
  return {
    kind: "plain",
    before: "",
    after: "",
    rule: R("Read it aloud: where would you pause?", "Léelo en voz alta: ¿dónde harías una pausa?"),
  };
}

const lowerFirst = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);

/** The joined sentence for A, a connector and B (A and B come without end punctuation). */
export function joinIdeas(a, b, connector) {
  if (!connector) return `${a}. ${b}.`;
  const p = punctuation(connector);
  return `${a}${p.before} ${connector}${p.after} ${lowerFirst(b)}.`;
}

/** Punctuation as drawn tiles on the deck: [{kind:"mark"|"word", text, label}] */
export function deckTiles(connector) {
  if (!connector) return [];
  const p = punctuation(connector);
  const mark = (text, en, es) => ({ kind: "mark", text, label: [en, es] });
  return [
    ...(p.before
      ? [
          mark(
            p.before,
            p.before === ";" ? "semicolon" : "comma",
            p.before === ";" ? "punto y coma" : "coma",
          ),
        ]
      : []),
    { kind: "word", text: connector },
    ...(p.after ? [mark(p.after, "comma", "coma")] : []),
  ];
}

/** Does the connector's job fit one of the jobs an idea pair allows? */
export const fits = (connector, fitJobs) => fitJobs.includes(jobOf(connector));

// ── weigh the evidence (grades 6-8) ──────────────────────────────────────────
export const WEIGH = [
  {
    id: "start",
    claim: "Middle schools should start later in the morning.",
    support: "teenagers' sleep cycles shift later during puberty",
    counter: "a later start can make bus schedules harder to plan",
  },
  {
    id: "phones",
    claim: "Students should be allowed to use phones at lunch.",
    support: "lunch is a break that lets students relax and talk",
    counter: "phones can pull students away from talking to each other",
  },
  {
    id: "homework",
    claim: "Schools should give less homework.",
    support: "students who sleep more often learn more the next day",
    counter: "practice at home helps some students remember new skills",
  },
];

/** Bridges the weigh-the-evidence mode offers. `heavy` is the position of the idea that carries the weight. */
export const WEIGH_FORMS = [
  { id: "however", label: "; however,", heavy: "second" },
  { id: "but", label: ", but", heavy: "second" },
  { id: "although-front", label: "Although …, …", heavy: "second" },
  { id: "although-mid", label: "…, although …", heavy: "first" },
];

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * Build one weighing sentence. `first` is "support" or "counter" (which idea comes first in the sentence).
 * Returns the sentence, which idea carries the weight, and whether that backs the claim.
 */
export function weigh(scenario, first, formId) {
  const form = WEIGH_FORMS.find((f) => f.id === formId);
  if (!scenario || !form) return null;
  const second = first === "support" ? "counter" : "support";
  const one = scenario[first];
  const two = scenario[second];
  const sentence = {
    however: `${cap(one)}; however, ${two}.`,
    but: `${cap(one)}, but ${two}.`,
    "although-front": `Although ${one}, ${two}.`,
    "although-mid": `${cap(one)}, although ${two}.`,
  }[form.id];
  const heavier = form.heavy === "first" ? first : second;
  return { sentence, heavier, backsClaim: heavier === "support", first, second, form: form.id };
}

export const weighNote = (w) =>
  w.backsClaim
    ? {
        en: "The weight is on your evidence, so the sentence backs your claim. The other side is still acknowledged, which sounds fair.",
        es: "El peso está en tu evidencia, así que la oración respalda tu afirmación. El otro lado también se reconoce, y eso suena justo.",
      }
    : {
        en: "The weight is on the other side, so this sentence works against your claim. Swap the ideas, or try another bridge, to put your evidence in the strong spot.",
        es: "El peso está en el otro lado, así que esta oración va en contra de tu afirmación. Cambia el orden de las ideas o prueba otro puente para poner tu evidencia en el lugar fuerte.",
      };

/** Which job a learner's chosen connector shows, and the tilt of the scale (-1 left, 1 right). */
export const tilt = (w) => (w ? (w.heavier === "support" ? 1 : -1) : 0);
