// Checkers for the Language Labs (/language-labs): Verb Time Machine, Connector Bridge, Paragraph X-Ray.
// Pure functions, no DOM. Feedback names the learner's own words and one next move; it never states an answer on a
// first miss (hints step up: cue → rule → model, the same ladder the rest of the lab uses).
import { CONNECTORS, IRREGULAR } from "./lexicon.js";
import { sentences } from "./text.js";

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// ── Verb Time Machine ────────────────────────────────────────────────────────

/** Regular/irregular forms of a base verb. */
export function verbForms(base) {
  const b = norm(base);
  const irr = IRREGULAR[b];
  const ed = irr
    ? irr[0]
    : b.endsWith("e")
      ? `${b}d`
      : /[^aeiou]y$/.test(b)
        ? `${b.slice(0, -1)}ied`
        : /^[^aeiou]*[aeiou][bdgmnprt]$/.test(b) && b.length <= 4
          ? `${b}${b.at(-1)}ed`
          : `${b}ed`;
  const part = irr ? irr[1] : ed;
  const s = /(s|sh|ch|x|z|o)$/.test(b)
    ? `${b}es`
    : /[^aeiou]y$/.test(b)
      ? `${b.slice(0, -1)}ies`
      : b === "be"
        ? "is"
        : b === "have"
        ? "has"
        : `${b}s`;
  const ing = b.endsWith("ie")
    ? `${b.slice(0, -2)}ying`
    : b.endsWith("e") && !b.endsWith("ee") && b !== "be"
      ? `${b.slice(0, -1)}ing`
      : /^[^aeiou]*[aeiou][bdgmnprt]$/.test(b) && b.length <= 4
        ? `${b}${b.at(-1)}ing`
        : `${b}ing`;
  return { base: b, s, ed, part, ing };
}

/** Which time an answer expresses: past | present | progressive | future | perfect-past | perfect | unknown. */
export function tenseOf(answer, base) {
  const a = norm(answer);
  const f = verbForms(base);
  if (!a) return "empty";
  if (/^had /.test(a)) return "past-perfect";
  if (/^(have|has) /.test(a)) return "present-perfect";
  if (/^(will|'ll) |^(am|is|are) going to /.test(a)) return "future";
  if (/^(was|were) /.test(a) && a.endsWith(f.ing)) return "past-progressive";
  if (/^(am|is|are) /.test(a) && a.endsWith(f.ing)) return "present-progressive";
  if (a === f.ed || a === f.part) return "past";
  if (a === f.s || a === f.base) return "present";
  if (a.endsWith(f.ing)) return "progressive-no-helper";
  return "unknown";
}

export const TENSE_NAMES = {
  past: ["simple past", "pasado simple"],
  present: ["simple present", "presente simple"],
  future: ["future", "futuro"],
  "past-progressive": ["past in progress", "pasado en progreso"],
  "present-progressive": ["now, in progress", "ahora, en progreso"],
  "past-perfect": ["past before the past", "pasado antes del pasado"],
  "present-perfect": ["present perfect", "presente perfecto"],
  "progressive-no-helper": ["-ing without a helping verb", "-ing sin verbo auxiliar"],
  unknown: ["a form I do not recognise", "una forma que no reconozco"],
  empty: ["nothing yet", "nada todavía"],
};

/** The one-line rule for an item's tense, as [English, Spanish]. Shared by the second try and the hint ladder. */
export function verbRule(item) {
  const f = verbForms(item.base);
  const irregular = Boolean(IRREGULAR[f.base]);
  return {
    past: irregular
      ? [
          `“${item.base}” is irregular: its past form does not end in -ed.`,
          `«${item.base}» es irregular: su pasado no termina en -ed.`,
        ]
      : ["Regular past: add -ed.", "Pasado regular: agrega -ed."],
    present: [
      "Habits and facts use the present: he/she/it adds -s.",
      "Hábitos y hechos usan el presente: he/she/it agrega -s.",
    ],
    future: [
      "Later: will + the base verb, or am/is/are going to + the base verb.",
      "Después: will + el verbo base, o am/is/are going to + el verbo base.",
    ],
    "past-progressive": [
      "In progress in the past: was/were + verb-ing.",
      "En progreso en el pasado: was/were + verbo-ing.",
    ],
    "present-progressive": [
      "In progress right now: am/is/are + verb-ing.",
      "En progreso ahora: am/is/are + verbo-ing.",
    ],
    "past-perfect": [
      "The earlier of two past events: had + past participle.",
      "El primero de dos sucesos pasados: had + participio.",
    ],
    "present-perfect": [
      "Started in the past and still true: have/has + past participle.",
      "Empezó en el pasado y sigue siendo cierto: have/has + participio.",
    ],
  }[item.tense];
}

/** Hint ladder: level 0 asks about the time clue, level 1 gives the rule. Neither states the answer. */
export function verbHint(item, level = 0) {
  if (level === 0)
    return {
      en: `Look at the time clue “${item.cue}”: is this action before now, now, or later?`,
      es: `Mira la pista de tiempo «${item.cue}»: ¿la acción es antes de ahora, ahora o después?`,
    };
  const rule = verbRule(item);
  return { en: rule[0], es: rule[1] };
}

/**
 * Check a verb item: { base, accept: [...answers], tense, cue }. tries = how many checks before this one.
 * Returns { ok, got, message: {en, es}, reveal }.
 */
export function checkVerb(item, answer, tries = 0) {
  const a = norm(answer);
  const ok = item.accept.map(norm).includes(a);
  const got = tenseOf(answer, item.base);
  if (ok)
    return {
      ok,
      got,
      message: {
        en: `Yes: “${answer.trim()}” puts the action at the right time (${TENSE_NAMES[item.tense][0]}).`,
        es: `Sí: «${answer.trim()}» pone la acción en el momento correcto (${TENSE_NAMES[item.tense][1]}).`,
      },
    };
  if (got === "empty")
    return { ok, got, message: { en: "Type the verb first.", es: "Primero escribe el verbo." } };
  const said = TENSE_NAMES[got] || TENSE_NAMES.unknown;
  if (tries === 0)
    return {
      ok,
      got,
      message: {
        en: `“${answer.trim()}” sounds like ${said[0]}. Look at the time clue “${item.cue}”: is this action before now, now, or later? Change the verb to match.`,
        es: `«${answer.trim()}» suena a ${said[1]}. Mira la pista de tiempo «${item.cue}»: ¿la acción es antes de ahora, ahora o después? Cambia el verbo para que coincida.`,
      },
    };
  if (tries === 1) {
    const rule = verbRule(item);
    return {
      ok,
      got,
      message: { en: `${rule[0]} Try again.`, es: `${rule[1]} Inténtalo otra vez.` },
    };
  }
  return {
    ok,
    got,
    reveal: item.accept[0],
    message: {
      en: `One answer that works: “${item.accept[0]}”. Read the sentence with it, then go on.`,
      es: `Una respuesta que funciona: «${item.accept[0]}». Lee la oración con ella y continúa.`,
    },
  };
}

/** Transfer: the learner's own sentences about before / now / later. Lists what each sentence shows. */
export function checkTimeline(text) {
  const sents = sentences(text).map((s) => s.text || s);
  const t = norm(text);
  const pastIrr = Object.values(IRREGULAR).map((x) => x[0]);
  const past =
    /\b\w{3,}ed\b/.test(t) ||
    pastIrr.some((p) => new RegExp(`\\b${p}\\b`).test(t)) ||
    /\b(was|were|had)\b/.test(t);
  const future = /\b(will|'ll|going to)\b/.test(t);
  const present =
    /\b(am|is|are|do|does)\b/.test(t) || /\b(i|we|they|you) [a-z]+\b/.test(t) || /\b\w+s\b/.test(t);
  const cues = [
    "yesterday",
    "last",
    "ago",
    "before",
    "today",
    "now",
    "every",
    "usually",
    "tomorrow",
    "next",
    "later",
    "after",
    "soon",
    "then",
    "first",
    "finally",
  ].filter((c) => new RegExp(`\\b${c}\\b`).test(t));
  const shows = { past, present, future, cues: cues.length >= 2 };
  const ok = sents.length >= 3 && past && future && shows.cues;
  const next = !past
    ? {
        en: "Add a sentence about something that already happened (yesterday, last week…).",
        es: "Agrega una oración sobre algo que ya pasó (ayer, la semana pasada…).",
      }
    : !future
      ? {
          en: "Add a sentence about later, with will or going to.",
          es: "Agrega una oración sobre después, con will o going to.",
        }
      : !shows.cues
        ? {
            en: "Add time words (yesterday, now, tomorrow) so a reader can place each event.",
            es: "Agrega palabras de tiempo (ayer, ahora, mañana) para que el lector ubique cada suceso.",
          }
        : sents.length < 3
          ? {
              en: "Write at least three sentences: before, now and later.",
              es: "Escribe al menos tres oraciones: antes, ahora y después.",
            }
          : null;
  return { ok, shows, cues, count: sents.length, next };
}

// ── Connector Bridge ─────────────────────────────────────────────────────────

const JOB_OF = new Map();
for (const [job, list] of Object.entries(CONNECTORS)) for (const w of list) if (!JOB_OF.has(w)) JOB_OF.set(w, job);
// Everyday result word the shared lexicon leaves out (it lists "so that" only; error detectors depend on that list).
JOB_OF.set("so", "cause");
export const jobOf = (connector) => JOB_OF.get(norm(connector)) || "";

export const JOB_MEANING = {
  cause: [
    "the second idea is the reason or the result of the first",
    "la segunda idea es la razón o el resultado de la primera",
  ],
  contrast: [
    "the second idea is different from, or surprising after, the first",
    "la segunda idea es diferente o sorprendente después de la primera",
  ],
  sequence: [
    "the second idea happens after the first",
    "la segunda idea pasa después de la primera",
  ],
  addition: [
    "the second idea adds more of the same kind",
    "la segunda idea agrega más de lo mismo",
  ],
  example: [
    "the second idea is an example of the first",
    "la segunda idea es un ejemplo de la primera",
  ],
  conclusion: ["the second idea sums up what came before", "la segunda idea resume lo anterior"],
};

/** Check a bridge item: { a, b, jobs: [fitting jobs], why: {en, es} }. */
export function checkBridge(item, connector, tries = 0) {
  const job = jobOf(connector);
  const ok = item.jobs.includes(job);
  const meaning = JOB_MEANING[job] || ["", ""];
  if (ok)
    return {
      ok,
      job,
      message: {
        en: `“${connector}” works: it tells the reader ${meaning[0]}. ${item.why.en}`,
        es: `«${connector}» funciona: le dice al lector que ${meaning[1]}. ${item.why.es}`,
      },
    };
  if (tries < 2)
    return {
      ok,
      job,
      message: {
        en: `With “${connector}”, the bridge says ${meaning[0]}. Read both ideas again: is that how they are related? ${tries === 1 ? `Hint: ask what the second idea does to the first.` : ""}`.trim(),
        es: `Con «${connector}», el puente dice que ${meaning[1]}. Vuelve a leer las dos ideas: ¿así se relacionan? ${tries === 1 ? "Pista: pregúntate qué hace la segunda idea con la primera." : ""}`.trim(),
      },
    };
  return {
    ok,
    job,
    reveal: CONNECTORS[item.jobs[0]][0],
    message: {
      en: `These ideas need a ${item.jobs[0]} connector, like “${CONNECTORS[item.jobs[0]][0]}”. ${item.why.en}`,
      es: `Estas ideas necesitan un conector de ${item.jobs[0]}, como «${CONNECTORS[item.jobs[0]][0]}». ${item.why.es}`,
    },
  };
}

/** Connectors that appear in a text, with their jobs, in order. */
export function connectorsIn(text) {
  const t = ` ${norm(text)} `;
  const found = [];
  for (const [w, job] of JOB_OF) {
    const i = t.indexOf(` ${w} `);
    if (i >= 0) found.push({ word: w, job, at: i });
  }
  // Drop a match that sits inside a longer one ("so" inside "so that").
  return found
    .filter(
      (f) =>
        !found.some(
          (g) =>
            g !== f &&
            g.word.length > f.word.length &&
            g.at <= f.at &&
            g.at + g.word.length >= f.at + f.word.length,
        ),
    )
    .sort((x, y) => x.at - y.at);
}

/** Transfer: two of the learner's own ideas joined to show `job`. */
export function checkJoin(text, job) {
  const found = connectorsIn(text);
  const hit = found.find((f) => f.job === job);
  const words = norm(text).split(" ").filter(Boolean).length;
  const ok = Boolean(hit) && words >= 8;
  const next = !found.length
    ? {
        en: "Join your two ideas with a connector from the bridge.",
        es: "Une tus dos ideas con un conector del puente.",
      }
    : !hit
      ? {
          en: `“${found[0].word}” shows ${found[0].job}. This bridge needs ${job}: try one of ${CONNECTORS[job].slice(0, 4).join(", ")}.`,
          es: `«${found[0].word}» muestra ${found[0].job}. Este puente necesita ${job}: prueba ${CONNECTORS[job].slice(0, 4).join(", ")}.`,
        }
      : words < 8
        ? {
            en: "Make each idea a full thought, with who did what.",
            es: "Haz que cada idea sea un pensamiento completo, con quién hizo qué.",
          }
        : null;
  return { ok, found, hit, next };
}

// ── Paragraph X-Ray ──────────────────────────────────────────────────────────

export const JOBS = {
  topic: [
    "Topic sentence: says what the paragraph is about",
    "Oración principal: dice de qué trata el párrafo",
  ],
  detail: [
    "Detail or evidence: a fact, example or event",
    "Detalle o evidencia: un dato, ejemplo o suceso",
  ],
  explain: [
    "Explanation: tells why the detail matters",
    "Explicación: dice por qué importa el detalle",
  ],
  conclude: [
    "Conclusion: sums up or connects back",
    "Conclusión: resume o conecta con el principio",
  ],
};

/** Labels for a paragraph item: item.sentences[i].job. Returns per-sentence results. */
export function checkLabels(item, labels) {
  const results = item.sentences.map((s, i) => {
    const ok = labels[i] === s.job;
    return { i, ok, given: labels[i] || "", why: ok ? s.why : s.clue };
  });
  return { ok: results.every((r) => r.ok), results };
}

/** Order check for a scrambled paragraph: order = array of original indexes. */
export function checkOrder(item, order) {
  const firstWrong = order.findIndex((idx, pos) => idx !== pos);
  if (firstWrong < 0) return { ok: true };
  const s = item.sentences[order[firstWrong]];
  return { ok: false, at: firstWrong, clue: s.orderClue || s.clue };
}

/** Transfer: a paragraph of the learner's own. topicWords are words the topic sentence should name. */
export function checkParagraph(text, topicWords = []) {
  const sents = sentences(text).map((s) => s.text || s);
  const first = norm(sents[0] || "");
  const last = norm(sents.at(-1) || "");
  const topic = topicWords.length
    ? topicWords.some((w) => first.includes(norm(w)))
    : sents.length > 0;
  const conns = connectorsIn(text).filter((c) =>
    ["sequence", "addition", "cause", "example", "contrast"].includes(c.job),
  );
  const conclusion =
    connectorsIn(sents.at(-1) || "").some((c) => c.job === "conclusion") ||
    (topicWords.length > 0 && sents.length > 1 && topicWords.some((w) => last.includes(norm(w)))) ||
    /\b(that is why|this is why|so|overall|in the end)\b/.test(last);
  const enough = sents.length >= 4;
  const ok = enough && topic && conns.length >= 1 && conclusion;
  const next = !enough
    ? {
        en: "Write at least four sentences: topic, two details, and a conclusion.",
        es: "Escribe al menos cuatro oraciones: idea principal, dos detalles y una conclusión.",
      }
    : !topic
      ? {
          en: "Make your first sentence name the topic, so the reader knows what the paragraph is about.",
          es: "Haz que tu primera oración nombre el tema, para que el lector sepa de qué trata el párrafo.",
        }
      : !conns.length
        ? {
            en: "Link your details with a connector (first, also, because, for example).",
            es: "Une tus detalles con un conector (first, also, because, for example).",
          }
        : !conclusion
          ? {
              en: "End with a sentence that sums up or connects back to the topic (overall, that is why…).",
              es: "Termina con una oración que resuma o vuelva al tema (overall, that is why…).",
            }
          : null;
  return { ok, count: sents.length, topic, conns, conclusion, next, sentences: sents };
}
