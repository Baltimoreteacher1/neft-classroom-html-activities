// Plain-language creation assistant for Activity Studio. NO inference service: a request is read with keyword and
// pattern rules (English plus basic Spanish) and mapped ONTO capabilities the studio already has: kind/template from
// core/schema.js, buildActivity in core/generate.js, the transforms in core/transforms.js, the supports and tiers in
// core/differentiate*.js and the verified math generators in core/mathgen.js (the build half is intent-build.js).
//
// It never claims unrestricted generation. An activity is built only from content the teacher supplied (words with
// meanings, questions, a passage, an existing activity, a lesson seed) or from verified math problems. When that is
// not enough, `interpretRequest` says ok:false and asks 1-3 concrete questions in `choices`; nothing is invented.
//
//   interpretRequest(text, context) -> { ok, plan, choices, explanation }   (plan is null when nothing is buildable)
//   buildFromPlan(plan, context, deps) -> { activity, review[], versions[] } (activity null when it cannot be built)
//
// The first line of `text` is the request; later lines are pasted content (a passage, "word - meaning" lines, a bare
// word list). `ok: true` means buildFromPlan(plan, { ...context, request: text }) produces a valid activity.

import { pair } from "../core/differentiate-util.js";
import { TEMPLATES, TIERS, clip } from "../core/schema.js";
import {
  assemblePlan,
  buildFromPlan,
  cleanTerm,
  mathTopicsFor,
  prepareSource,
  splitRequest,
  termsFromBody,
  uniqueTerms,
  validTerms,
} from "./intent-build.js";

export { buildFromPlan, splitRequest };

// ── vocabulary of requests (English + Spanish) ──────────────────────────────

const NUM = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  dozen: 12,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  doce: 12,
  quince: 15,
  veinte: 20,
};
const NUMRE = `\\d{1,2}|${Object.keys(NUM).join("|")}`;
const countBefore = (text, nouns) => {
  const re = new RegExp(`\\b(${NUMRE})\\s+(?:[\\p{L}-]+\\s+){0,2}?(?:${nouns})\\b`, "iu");
  const m = text.match(re);
  return m ? Number(m[1]) || NUM[m[1].toLowerCase()] : 0;
};

const KIND_RULES = [
  [
    "worksheet",
    /\b(worksheets?|printables?|handouts?|packets?|hojas? de trabajo|hojas?|fichas?|imprimibles?)\b/i,
  ],
  ["game", /\b(games?|quests?|adventures?|puzzles?|juegos?|misi[oó]n|acertijos?)\b/i],
  [
    "check",
    /\b(quick checks?|exit tickets?|check for understanding|quiz(?:zes)?|assessments?|boletos? de salida|revisi[oó]n r[aá]pida|cuestionarios?)\b/i,
  ],
  [
    "interactive",
    /\b(interactive|activity|activities|review|actividad(?:es)?|interactiv[oa]s?|repaso)\b/i,
  ],
];
const A_KIND = {
  interactive: pair("an interactive activity", "una actividad interactiva"),
  worksheet: pair("a worksheet", "una hoja de trabajo"),
  game: pair("a game", "un juego"),
  check: pair("a quick check", "una revisión rápida"),
};
const A_TRANSFORM = {
  speakingTask: pair("a speaking task", "una tarea de expresión oral"),
  writingTask: pair("a writing task", "una tarea de escritura"),
  exitTicket: pair("an exit ticket", "un boleto de salida"),
  vocabPractice: pair("a word practice activity", "una actividad de práctica de palabras"),
};
const TRANSFORM_KIND = {
  speakingTask: "interactive",
  writingTask: "interactive",
  exitTicket: "check",
  vocabPractice: "interactive",
};
const TRANSFORM_TEMPLATE = {
  speakingTask: "build-explain",
  writingTask: "build-explain",
  exitTicket: "exit-ticket",
  vocabPractice: "match-sort",
};

/** Formats the studio cannot make. Named in the answer instead of being quietly swapped for something else. */
const UNSUPPORTED = [
  [
    /\b(videos?|v[ií]deos?|animations?|animaci[oó]n(?:es)?|slide ?shows?|slides|power ?points?|presentaci[oó]n(?:es)?|songs?|canci[oó]n(?:es)?|podcasts?|posters?|cartel(?:es)?|websites?|sitio web)\b/i,
    pair(
      "a video, slideshow, song, poster or website",
      "un video, una presentación, una canción, un cartel o un sitio web",
    ),
  ],
  [
    /\b(draw|illustrate|generate (?:an? )?(?:image|picture)s?|dibuja\w*|ilustra\w*)\b/i,
    pair("new drawings or pictures", "dibujos o imágenes nuevos"),
  ],
];
const SUPPORT_RULES = [
  ["visuals", /\b(visuals?|pictures?|images?|diagrams?|illustrated|im[aá]genes|dibujos)\b/i],
  ["frames", /\b(sentence (?:frames?|starters?|stems?)|frames|marcos? de oraci[oó]n(?:es)?)\b/i],
  [
    "readAloud",
    /\b(read[- ]aloud|audio|listen(?:ing)?|lectura en voz alta|leer en voz alta|escuchar)\b/i,
  ],
  ["chunk", /\b(chunk(?:ed)?|short parts|shorter parts|partes cortas)\b/i],
  ["spanish", /\b(spanish|espa[ñn]ol|biling[uü]e|biling[uü]al)\b/i],
];
const LEARNER =
  /\b(english|learners?|ells?|multilingual|bilingual|emergent|wida|ingl[eé]s|aprendices)\b/i;
const LEVEL_RULES = [
  [/\b(beginning|beginner|entering|newcomers?|emerging|principiantes?|nivel inicial)\b/i, 2],
  [/\b(intermediate|developing|intermedio)\b/i, 3],
  [/\b(advanced|expanding|avanzado)\b/i, 4],
];
/** Skills a teacher may name that the verified generators do not make: the closest topic is offered, never silently used. */
const UNVERIFIED_SKILL =
  /\b(equivalent expressions?|expresiones? equivalentes?|simplif\w+|factor(?:ing)?|distributive|like terms|word problems?)\b/i;
const TRANSFORM_RULES = [
  ["speakingTask", /\b(speaking|oral|hablar|expresi[oó]n oral)\b/i],
  [
    "writingTask",
    /\b(writing (?:task|activity|prompt)|tarea de escritura|actividad de escritura)\b/i,
  ],
];
const EXISTING =
  /\b(?:this|that|my|the|esta|este|mi)\s+(?:activity|worksheet|game|check|quiz|handout|actividad|hoja|juego)\b|\b(?:existing|current)\b/i;
const TIER_PICK = { 2: ["emerging", "extension"], 3: ["emerging", "developing", "extension"] };
const TIER_ES = {
  emerging: "Emergente",
  developing: "En desarrollo",
  expanding: "En expansión",
  extension: "Ampliación",
};
const MATH_LABEL = { "evaluate-expressions": "Evaluate expressions" };

// ── reading the request ─────────────────────────────────────────────────────

/** "words: a, b, and c" on the request line. */
function termsFromHead(head) {
  const m = head.match(
    /\b(?:words?|terms?|vocabulary(?: words)?|vocab|palabras?|t[eé]rminos?|vocabulario)\b[^:\n]{0,40}:\s*(.+)$/i,
  );
  if (!m) return [];
  const tail = m[1].replace(/[.!]+$/, "");
  const parts = tail.includes(",")
    ? tail.replace(/,?\s+(?:and|y)\s+(?=[^,]+$)/i, ", ").split(/[,;]/)
    : tail.split(/\s+(?:and|y)\s+/i);
  const list = uniqueTerms(parts.map(cleanTerm).filter(Boolean));
  return validTerms(list) ? list : [];
}

function topicOf(head) {
  const m = head.match(
    /\b(?:about|regarding|on the topic of|sobre|acerca de)\s+(.+?)(?=\s+(?:with|using|that|which|including|for|and make|con|usando)\b|[.,;:!?]|$)/i,
  );
  return m
    ? m[1]
        .replace(/^(?:the|these|a|an|los|las|el|la)\s+/i, "")
        .trim()
        .slice(0, 60)
    : "";
}

/** What the request line itself says (no content, no context). */
function readFeatures(head, body) {
  const test = (re) => re.test(head);
  let wida = Number(head.match(/\bwida\s*(?:level\s*)?([1-6])\b/i)?.[1]) || 0;
  if (!wida && test(LEARNER)) wida = LEVEL_RULES.find(([re]) => test(re))?.[1] || 0;
  const listed = termsFromHead(head);
  return {
    head,
    kind: KIND_RULES.find(([, re]) => test(re))?.[0] || "",
    unsupported: UNSUPPORTED.find(([re]) => test(re))?.[1] || null,
    supports: SUPPORT_RULES.filter(([, re]) => test(re)).map(([k]) => k),
    wida,
    differentiate: test(
      /\b(differentiat\w+|tiered|leveled|levelled|diferenci\w+|niveles|versions?|versiones)\b/i,
    ),
    versionCount: countBefore(head, "versions?|versiones|levels?|niveles"),
    count:
      countBefore(head, "questions?|problems?|items?|preguntas?|problemas?|ejercicios?") ||
      (test(/\b(short|brief|corto|breve)\b/i) ? 6 : 0),
    statedTerms: countBefore(head, "words?|terms?|palabras?|t[eé]rminos?"),
    terms: listed.length ? listed : termsFromBody(body),
    topic: topicOf(head),
    transform: TRANSFORM_RULES.find(([, re]) => test(re))?.[0] || "",
    refersToExisting: test(EXISTING),
    writingHint: test(/\b(writing|escritura|escribir)\b/i),
  };
}

function existingTransform(head) {
  if (/\bexit ticket|boleto de salida\b/i.test(head)) return "exitTicket";
  if (
    /\bvocab(?:ulary)? practice|word practice|pr[aá]ctica de (?:vocabulario|palabras)\b/i.test(head)
  )
    return "vocabPractice";
  const target = head.match(/\b(?:into|to|as|en|a)\s+(?:an?\s+|un[ao]?\s+)?(.+)$/i)?.[1] || "";
  const kind = KIND_RULES.find(([, re]) => re.test(target))?.[0];
  return kind && /\b(turn|convert|change|make|convierte|cambia)\b/i.test(head)
    ? `toKind:${kind}`
    : "";
}

function defaultTemplate(kind, f, content) {
  const t = (re, id) => (re.test(f.head) ? id : "");
  if (kind === "worksheet")
    return (
      t(/\b(organizer|kwl|venn|graphic|organizador)\b/i, "organizer") ||
      (content.passage && f.writingHint ? "reading-writing" : "") ||
      t(/\b(independent|independiente)\b/i, "independent") ||
      "guided"
    );
  if (kind === "game")
    return (
      t(/\b(match|parejas)\b/i, "match") ||
      t(/\b(puzzle|acertijo)/i, "puzzle") ||
      t(/\b(strategy|estrategia)/i, "strategy") ||
      "quest"
    );
  if (kind === "check")
    return (
      t(/\b(exit ticket|boleto de salida)\b/i, "exit-ticket") ||
      t(/\b(listening|escucha)/i, "listen-read") ||
      t(/\bexplain (?:and|&) revise|explicar y revisar/i, "explain-revise") ||
      "skill-check"
    );
  return (
    t(/\b(match|sort|clasific\w+|empareja\w*)\b/i, "match-sort") ||
    t(/\bbuild (?:and|&|y) explain\b/i, "build-explain") ||
    (content.passage
      ? "interactive-reading"
      : content.vocab && !content.math
        ? "match-sort"
        : "explore-practice")
  );
}

// ── answering ───────────────────────────────────────────────────────────────

const choice = (id, en, es, options) => ({
  id,
  question: pair(en, es),
  options: options.map(([oid, e, s]) => ({ id: oid, label: pair(e, s) })),
});
const PASTE = [
  "paste-content",
  "Paste my words, questions or a short passage",
  "Pegar mis palabras, preguntas o un texto corto",
];
const LESSON = [
  "pick-lesson",
  "Choose a lesson from the curriculum",
  "Elegir una lección del currículo",
];
const CHOICES = {
  format: () =>
    choice(
      "format",
      "Which kind of activity should I make?",
      "¿Qué tipo de actividad debo hacer?",
      [
        ["worksheet", "A worksheet", "Una hoja de trabajo"],
        ["interactive", "An interactive activity", "Una actividad interactiva"],
        ["game", "A game", "Un juego"],
        ["check", "A quick check", "Una revisión rápida"],
      ],
    ),
  source: (topic) =>
    choice(
      "source",
      topic
        ? `What should the activity about ${topic} be built from?`
        : "What should the activity be built from?",
      topic
        ? `¿De qué debo construir la actividad sobre ${topic}?`
        : "¿De qué debo construir la actividad?",
      [
        PASTE,
        LESSON,
        [
          "add-meanings",
          "Give the words with their meanings",
          "Dar las palabras con sus significados",
        ],
      ],
    ),
  meanings: () =>
    choice(
      "meanings",
      "Where should the meanings of these words come from?",
      "¿De dónde deben venir los significados de estas palabras?",
      [
        [
          "type-meanings",
          'I will type them as "word - meaning" lines',
          'Los escribiré como líneas "palabra - significado"',
        ],
        LESSON,
      ],
    ),
  passage: () =>
    choice(
      "passage",
      "Which text should students speak or write about?",
      "¿Sobre qué texto deben hablar o escribir los estudiantes?",
      [
        ["paste-passage", "Paste a passage I trust", "Pegar un texto de confianza"],
        ["pick-lesson", "Use a reading from a lesson", "Usar una lectura de una lección"],
      ],
    ),
  activity: () =>
    choice("activity", "Which activity should I work from?", "¿Con qué actividad debo trabajar?", [
      ["open-activity", "Open an activity I already made", "Abrir una actividad que ya hice"],
      ["describe-first", "Describe a new activity first", "Describir primero una actividad nueva"],
    ]),
  level: () =>
    choice(
      "version-level",
      "Which level should the version be for?",
      "¿Para qué nivel debe ser la versión?",
      TIERS.map((t) => [t, t[0].toUpperCase() + t.slice(1), TIER_ES[t]]),
    ),
  math: (labels) =>
    choice(
      "math-topic",
      "I cannot make verified problems for that exact skill. Use the closest topic?",
      "No puedo hacer problemas verificados para esa destreza exacta. ¿Uso el tema más cercano?",
      [
        ["use-closest", `Yes, use: ${labels}`, `Sí, usar: ${labels}`],
        ["paste-own", "No, I will paste my own problems", "No, pegaré mis propios problemas"],
      ],
    ),
};

const NO_SOURCE = pair("There is nothing to build it from.", "No hay con qué construirla.");
const join = (notes, lang) => (notes.length ? ` ${notes.map((n) => n[lang]).join(" ")}` : "");

function explain(plan, ok, prep, reason, notes) {
  const what =
    A_TRANSFORM[plan.transform] ||
    A_KIND[plan.kind] ||
    pair("a set of versions", "un conjunto de versiones");
  const about = plan.topic ? pair(` about ${plan.topic}`, ` sobre ${plan.topic}`) : pair("", "");
  const from = prep.useMath
    ? pair("verified math problems", "problemas de matemáticas verificados")
    : prep.supplied
      ? pair("the content you gave me", "el contenido que me diste")
      : pair("your existing activity", "tu actividad existente");
  if (ok)
    return pair(
      `I will make ${what.en}${about.en} with ${from.en}. Nothing is invented: every answer comes from your content or is calculated.${join(notes, "en")}`,
      `Haré ${what.es}${about.es} con ${from.es}. No se inventa nada: cada respuesta viene de tu contenido o se calcula.${join(notes, "es")}`,
    );
  return pair(
    `I cannot build ${what.en}${about.en} yet: ${reason.en} I only build from words, questions, passages, an existing activity or math topics I can verify, so I do not guess.${join(notes, "en")}`,
    `Todavía no puedo construir ${what.es}${about.es}: ${reason.es} Solo construyo con palabras, preguntas, textos, una actividad existente o temas de matemáticas que puedo verificar, así que no adivino.${join(notes, "es")}`,
  );
}

const tiersFor = (n) => (n >= 4 || n === 0 ? [...TIERS] : TIER_PICK[n] || []);
const recommendKind = (prep) =>
  prep.useMath && !prep.parsed.passage ? "worksheet" : "interactive";

function whyNot(plan, f, prep, hasActivity) {
  if (!plan.kind && !plan.transform) return [hasActivity ? CHOICES.level() : CHOICES.activity()];
  if (plan.transform === "speakingTask" || plan.transform === "writingTask")
    return [CHOICES.passage()];
  if (plan.transform) return hasActivity ? [] : [CHOICES.activity()];
  if (f.terms.length && !prep.vocab.length) return [CHOICES.meanings()];
  return [CHOICES.source(f.topic)];
}

/**
 * @param {string} text the request (first line) plus any pasted content below it
 * @param {object} context see intent-build.js: { sourceText, parsed, vocab, seed, activity, grade, subject, ... }
 * @returns {{ ok: boolean, plan: object|null, choices: object[], explanation: {en,es} }}
 *  plan: { kind, template, transform?, count, topic, terms[], supports[], versions[], confidence, wida, mathTopics[] }
 *  (`confidence` is "high" | "medium" | "low", a plain statement of how sure the reading is, never a score).
 *  ok:false carries the reason in `explanation` and 1-3 concrete questions in `choices`; `choices` may also come
 *  with ok:true when the request was only approximately matched (the default plan is still buildable).
 */
export function interpretRequest(text, context = {}) {
  const raw = clip(text, 12000);
  const { head, body } = splitRequest(raw);
  const f = readFeatures(head, body);
  const hasActivity = Boolean(context.activity);
  const wantsVersions = f.differentiate || f.versionCount > 0;
  const onExisting = hasActivity && f.refersToExisting;
  const transform = f.transform || (onExisting && !wantsVersions ? existingTransform(head) : "");
  const kind = onExisting && wantsVersions && !transform ? "" : f.kind;
  const notes = f.unsupported
    ? [pair(`I cannot make ${f.unsupported.en}.`, `No puedo hacer ${f.unsupported.es}.`)]
    : [];

  const actionable = Boolean(
    kind || transform || wantsVersions || f.terms.length || f.topic || body || context.sourceText,
  );
  if (!raw.trim() || !actionable || (f.unsupported && !kind && !transform && !wantsVersions)) {
    const reason = f.unsupported
      ? pair(`I cannot make ${f.unsupported.en}.`, `No puedo hacer ${f.unsupported.es}.`)
      : pair("I could not tell what to make.", "No pude saber qué hacer.");
    return {
      ok: false,
      plan: null,
      choices: [CHOICES.format()],
      explanation: pair(
        `${reason.en} I can make worksheets, interactive activities, games and quick checks from your words, questions, passages and verified math problems. Which would you like?`,
        `${reason.es} Puedo hacer hojas de trabajo, actividades interactivas, juegos y revisiones rápidas a partir de tus palabras, preguntas, textos y problemas de matemáticas verificados. ¿Cuál quieres?`,
      ),
    };
  }

  const mathTopics = f.topic && !transform ? mathTopicsFor(f.topic, context) : [];
  const approximate = mathTopics.length > 0 && UNVERIFIED_SKILL.test(f.topic);
  const ctx = { ...context, request: raw };
  const prep = prepareSource(ctx, { terms: f.terms, mathTopics });
  const content = {
    passage: Boolean(prep.parsed.passage),
    vocab: prep.vocab.length > 0,
    math: prep.useMath,
  };
  const planKind = transform
    ? transform.startsWith("toKind:")
      ? transform.slice(7)
      : TRANSFORM_KIND[transform]
    : kind || (wantsVersions ? "" : recommendKind(prep));
  const plan = {
    kind: planKind,
    template: transform
      ? TRANSFORM_TEMPLATE[transform] || ""
      : planKind
        ? defaultTemplate(planKind, f, content)
        : "",
    ...(transform ? { transform } : {}),
    count: f.count,
    topic: f.topic,
    terms: f.terms,
    supports: f.supports,
    versions: wantsVersions ? tiersFor(f.versionCount) : [],
    wida: f.wida,
    mathTopics,
    confidence: "low",
  };
  if (planKind && !transform && !TEMPLATES[planKind].some((t) => t.id === plan.template))
    plan.template = TEMPLATES[planKind][0].id;

  if (wantsVersions && f.versionCount === 1)
    return {
      ok: false,
      plan,
      choices: [CHOICES.level()],
      explanation: explain(
        plan,
        false,
        prep,
        pair("one version needs a level.", "una versión necesita un nivel."),
        notes,
      ),
    };

  const res = assemblePlan(plan, ctx);
  const ok = Boolean(res.activity);
  let choices = [];
  if (ok && approximate) {
    choices = [CHOICES.math(mathTopics.map((id) => MATH_LABEL[id] || id).join(", "))];
    notes.push(
      pair(
        "The verified generators make practice for the closest topic, not that exact skill.",
        "Los generadores verificados hacen práctica del tema más cercano, no de esa destreza exacta.",
      ),
    );
  }
  if (ok && f.statedTerms && f.terms.length && f.statedTerms !== f.terms.length)
    notes.push(
      pair(
        `You said ${f.statedTerms} words but I found ${f.terms.length}. Check the list.`,
        `Dijiste ${f.statedTerms} palabras pero encontré ${f.terms.length}. Revisa la lista.`,
      ),
    );
  if (!ok) choices = whyNot(plan, f, res.prep, hasActivity);
  plan.confidence = !ok
    ? "low"
    : approximate || !(kind || transform || plan.versions.length)
      ? "medium"
      : "high";
  const reason = res.review[0] ? pair(res.review[0].en, res.review[0].es) : NO_SOURCE;
  return {
    ok,
    plan,
    choices: choices.slice(0, 3),
    explanation: explain(plan, ok, res.prep, reason, notes),
  };
}
