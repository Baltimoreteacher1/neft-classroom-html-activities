// Checkers for the Culture & Communication Explorer (/communication). Pure functions, no DOM.
// Every check reports only what it can observe in the learner's own words (a greeting it found, a question mark, a
// reason word). It never claims a proficiency level and never says one way of communicating is better than another:
// a feature either fits the situation the task describes or the tip names what this audience may need.
import { sentences, tokenize } from "./text.js";

const norm = (s) => String(s || "").replace(/[’‘]/g, "'");
const lower = (s) => norm(s).toLowerCase();
const uniq = (a) => [...new Set(a)];

const CASUAL_GREETINGS = [
  "hey",
  "heyy",
  "heyyy",
  "yo",
  "sup",
  "hiya",
  "howdy",
  "what's up",
  "whats up",
  "wassup",
];
const GREETING_RE =
  /^[\s"'(]*(dear|hello|hi|hey+|good (?:morning|afternoon|evening)|greetings|excuse me|yo|sup|hiya|howdy|what'?s up|wassup)\b/i;
const CASUAL_CLOSINGS = ["bye", "ttyl", "love", "xoxo", "later", "cya", "peace"];
const CLOSING_RE =
  /\b(sincerely|respectfully|best regards|best wishes|kind regards|regards|warmly|thank you|thanks|best|see you|talk soon|bye|ttyl|love|xoxo|later|cya|cheers|peace)\b/gi;
const CASUAL_WORDS = new Set(
  "gonna wanna gotta u ur r pls plz thx lol omg btw idk ya yeah nah bruh sup tbh ngl rn k ok".split(
    " ",
  ),
);
const PATTERNS = {
  request:
    /\b(could you|would you|can you|will you|may i|could i|can i|would it be possible|is it possible|i would like|i'd like|i was wondering|please|do you have|where can i|where is|where should)\b/gi,
  reason:
    /\b(because|so that|since|the reason|that way|so we|so i|so the|so it|this is why|that is why)\b/gi,
  thanks: /\b(thank you|thanks|i appreciate|appreciate it|grateful)\b/gi,
  example:
    /\b(for example|for instance|such as|like when|it's like|it is like|imagine|just like|kind of like|is like a|(?<!(?:would|i|we|you|they|'d|to) )like (?:a|an|little|tiny|big|the)(?= ))\b/gi,
  perspective:
    /\b(might feel|may feel|probably feel|probably feels|feels|point of view|from (?:his|her|their|my|our) (?:side|view)|(?:he|she|they|some people|others|families|teachers|students) (?:think|thinks|want|wants|worry|worries|believe|believes|need|needs)|on the other hand|both sides|i understand|i get why|i see why)\b/gi,
  acknowledge:
    /\b(sorry|i apologi[sz]e|i didn't mean|i did not mean|my mistake|my fault|i understand why|i see why|misunderstanding|what i meant|i meant|came across|came out wrong|i should have)\b/gi,
  nextStep:
    /\b(next time|from now on|can we|could we|let's|let us|i will|i'll|how about|we could|do you want|would you like|i can help|i'd like to help|can i|let me|we can)\b/gi,
  suggest:
    /\b(we could|what if|let's|let us|how about|maybe we|i suggest|i propose|why don't we|one idea|a fair (?:plan|policy|idea|way)|a compromise|instead)\b/gi,
  respond:
    /\b(i like|i see|good point|that's a good|that is a good|i understand|i agree that|interesting idea|great idea|i hear you|you're right that|you are right that)\b/gi,
  permission:
    /\b(may i|is it okay|is it ok|can i|do you mind|would it be okay|would it be all right|is that okay)\b[^.?!]*\b(record|recording|notes|write|quote|use)\b/gi,
};

/** Every check the content may ask for, with a bilingual label and the tip shown when it is not yet seen. */
export const CHECKS = {
  greeting: {
    label: ["A greeting that fits this audience", "Un saludo que encaja con esta audiencia"],
    tip: [
      "Start with a greeting. For this audience, try “Hello, …”, “Good morning, …” or “Dear …,” with the person's name.",
      "Empieza con un saludo. Para esta audiencia, prueba «Hello, …», «Good morning, …» o «Dear …,» con el nombre de la persona.",
    ],
  },
  closing: {
    label: ["A closing that fits this audience", "Una despedida que encaja con esta audiencia"],
    tip: [
      "End with a closing line, such as “Thank you,” or “Sincerely,” and your name.",
      "Termina con una despedida, como «Thank you,» o «Sincerely,» y tu nombre.",
    ],
  },
  purpose: {
    label: ["Says what the message is about", "Dice de qué trata el mensaje"],
    tip: [
      "Name the topic so the reader knows why you are writing. Use a word from the situation.",
      "Nombra el tema para que el lector sepa por qué escribes. Usa una palabra de la situación.",
    ],
  },
  address: {
    label: ["Uses the person's name or title", "Usa el nombre o el título de la persona"],
    tip: [
      "Use the person's name or title (for example, Ms. Rivera) so they know you are talking to them.",
      "Usa el nombre o el título de la persona (por ejemplo, Ms. Rivera) para que sepa que le hablas a ella.",
    ],
  },
  request: {
    label: ["A clear request or question", "Una petición o pregunta clara"],
    tip: [
      "Ask for what you need in one clear question, for example “Could I …?” or “Would it be possible to …?”",
      "Pide lo que necesitas en una pregunta clara, por ejemplo «Could I …?» o «Would it be possible to …?»",
    ],
  },
  reason: {
    label: ["Gives a reason", "Da una razón"],
    tip: [
      "Add a reason with “because” or “so that”.",
      "Agrega una razón con «because» o «so that».",
    ],
  },
  thanks: {
    label: ["Thanks the person", "Le da las gracias a la persona"],
    tip: [
      "Thank the person for their time or help.",
      "Agradece a la persona por su tiempo o su ayuda.",
    ],
  },
  casual: {
    label: ["Word choice fits this audience", "Las palabras encajan con esta audiencia"],
    tip: [
      "Some words fit a chat with friends better than this audience. Try writing them out in full.",
      "Algunas palabras encajan mejor en un chat con amigos que con esta audiencia. Prueba a escribirlas completas.",
    ],
  },
  questions: {
    label: ["Open questions", "Preguntas abiertas"],
    tip: [
      "Add more questions. Open questions start with how, why, what or tell me about.",
      "Agrega más preguntas. Las preguntas abiertas empiezan con how, why, what o tell me about.",
    ],
  },
  simple: {
    label: ["Short sentences for a young listener", "Oraciones cortas para alguien pequeño"],
    tip: [
      "Use at least two short sentences. Split a long sentence where you see “and”.",
      "Usa al menos dos oraciones cortas. Divide una oración larga donde veas «and».",
    ],
  },
  academic: {
    label: [
      "Precise topic words for this audience",
      "Palabras precisas del tema para esta audiencia",
    ],
    tip: [
      "This audience expects precise words. Use at least two words from the word bank.",
      "Esta audiencia espera palabras precisas. Usa al menos dos palabras del banco de palabras.",
    ],
  },
  example: {
    label: ["An example or comparison", "Un ejemplo o una comparación"],
    tip: [
      "Add an example the listener already knows: “It's like …” or “For example, …”.",
      "Agrega un ejemplo que el oyente ya conoce: «It's like …» o «For example, …».",
    ],
  },
  perspective: {
    label: ["Names someone else's point of view", "Nombra el punto de vista de otra persona"],
    tip: [
      "Say what another person thinks or feels: “Some students want …”, “She might feel …”.",
      "Di lo que otra persona piensa o siente: «Some students want …», «She might feel …».",
    ],
  },
  acknowledge: {
    label: ["Acknowledges the misunderstanding", "Reconoce el malentendido"],
    tip: [
      "Show you noticed how the other person felt: “I'm sorry …”, “I didn't mean …”, “I think my words came across wrong.”",
      "Muestra que notaste cómo se sintió la otra persona: «I'm sorry …», «I didn't mean …», «I think my words came across wrong.»",
    ],
  },
  nextStep: {
    label: ["Offers a next step", "Ofrece un siguiente paso"],
    tip: [
      "Offer a next step: “Can we …?”, “Next time, I'll …”, “Do you want to …?”",
      "Ofrece un siguiente paso: «Can we …?», «Next time, I'll …», «Do you want to …?»",
    ],
  },
  suggest: {
    label: ["Makes a suggestion", "Hace una sugerencia"],
    tip: [
      "Suggest an idea: “What if we …?”, “We could …”, “How about …?”",
      "Sugiere una idea: «What if we …?», «We could …», «How about …?»",
    ],
  },
  respond: {
    label: ["Responds to the other idea first", "Responde primero a la otra idea"],
    tip: [
      "Before you disagree, say something about the other idea: “I like that …”, “That's a good point, but …”.",
      "Antes de no estar de acuerdo, di algo sobre la otra idea: «I like that …», «That's a good point, but …».",
    ],
  },
  permission: {
    label: ["Asks permission to record or take notes", "Pide permiso para grabar o tomar notas"],
    tip: [
      "Ask before you record: “Is it okay if I record our conversation?”",
      "Pregunta antes de grabar: «Is it okay if I record our conversation?»",
    ],
  },
};

function findAll(re, text) {
  re.lastIndex = 0;
  return uniq([...norm(text).matchAll(re)].map((m) => m[0].toLowerCase()));
}
function wordsFrom(list, text) {
  const t = ` ${lower(text).replace(/[^a-z0-9:' .-]+/g, " ")} `;
  return list.filter((w) => {
    const k = lower(w).trim();
    return k && new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(t);
  });
}

/** The greeting at the start of the text, if any, and whether it fits the task's register. */
export function greetingOf(text, register = "neutral") {
  const m = norm(text).match(GREETING_RE);
  if (!m) return { word: "", fits: false };
  const word = m[1].toLowerCase();
  const casual = CASUAL_GREETINGS.includes(word.replace(/y+$/, "y")) || /^hey+$/.test(word);
  return { word: m[1], fits: register === "formal" ? !casual : true, casual };
}

/** A closing in the last two sentences or the last line, and whether it fits the register. */
export function closingOf(text, register = "neutral") {
  const t = norm(text).trim();
  const tail = [
    ...sentences(t)
      .slice(-2)
      .map((s) => s.text),
    t.split(/\n/).filter(Boolean).at(-1) || "",
  ].join(" ");
  const found = findAll(CLOSING_RE, tail);
  if (!found.length) return { word: "", fits: false };
  const formalOnes = found.filter((w) => !CASUAL_CLOSINGS.includes(w));
  if (register === "formal")
    return {
      word: formalOnes[0] || found[0],
      fits: formalOnes.length > 0,
      casual: !formalOnes.length,
    };
  return { word: found[0], fits: true };
}

/** Words and marks that usually fit a chat with friends: slang spellings, emoji, "!!" / "??". */
export function casualMarkers(text) {
  const out = tokenize(text)
    .map((t) => t.lower)
    .filter((w) => CASUAL_WORDS.has(w) && w !== "ok");
  const emoji = norm(text).match(/\p{Extended_Pictographic}/gu) || [];
  const marks = norm(text).match(/[!?]{2,}/g) || [];
  return uniq([...out, ...emoji, ...marks]);
}

const avgWords = (text) => {
  const ss = sentences(text);
  if (!ss.length) return { count: 0, avg: 0 };
  const total = ss.reduce((n, s) => n + tokenize(s.text).length, 0);
  return { count: ss.length, avg: Math.round((total / ss.length) * 10) / 10 };
};

/** Run one check. Returns { id, met, found: [observed words], note? } — `note` replaces the tip when a feature was
 *  seen but fits a different audience (a casual greeting in a formal email). */
export function runCheck(id, text, task = {}) {
  const register = task.register || "neutral";
  if (id === "greeting") {
    const g = greetingOf(text, register);
    if (g.word && !g.fits)
      return {
        id,
        met: false,
        found: [g.word],
        note: [
          `“${g.word}” fits a friend or a group chat. ${task.medium === "email" ? "In an email to this person" : "For this person"}, try “Hello”, “Good morning” or “Dear” with their name.`,
          `«${g.word}» encaja con un amigo o un chat de grupo. ${task.medium === "email" ? "En un correo a esta persona" : "Para esta persona"}, prueba «Hello», «Good morning» o «Dear» con su nombre.`,
        ],
      };
    return { id, met: !!g.word, found: g.word ? [g.word] : [] };
  }
  if (id === "closing") {
    const c = closingOf(text, register);
    if (c.word && !c.fits)
      return {
        id,
        met: false,
        found: [c.word],
        note: [
          `“${c.word}” fits a message to a friend. For this audience, try “Thank you,” “Sincerely,” or “Best,” and your name.`,
          `«${c.word}» encaja en un mensaje a un amigo. Para esta audiencia, prueba «Thank you,» «Sincerely,» o «Best,» y tu nombre.`,
        ],
      };
    return { id, met: !!c.word, found: c.word ? [c.word] : [] };
  }
  if (id === "casual") {
    const found = casualMarkers(text);
    return found.length
      ? {
          id,
          met: false,
          found,
          note: [
            `I noticed ${found.map((w) => `“${w}”`).join(", ")}. These fit a chat with friends. For this audience, write the words out in full and use one end mark.`,
            `Noté ${found.map((w) => `«${w}»`).join(", ")}. Esto encaja en un chat con amigos. Para esta audiencia, escribe las palabras completas y usa un solo signo al final.`,
          ],
        }
      : { id, met: true, found: [] };
  }
  if (id === "purpose") {
    const found = wordsFrom(task.purposeWords || [], text);
    return { id, met: found.length > 0, found };
  }
  if (id === "address") {
    const found = wordsFrom(task.audienceWords || [], text);
    return { id, met: found.length > 0, found };
  }
  if (id === "academic") {
    const found = wordsFrom(task.academicWords || [], text);
    return { id, met: found.length >= (task.minAcademic || 2), found };
  }
  if (id === "questions") {
    const n = (norm(text).match(/\?/g) || []).length;
    const need = task.minQuestions || 2;
    return { id, met: n >= need, found: n ? [`${n} ?`] : [], count: n, need };
  }
  if (id === "simple") {
    const { count, avg } = avgWords(text);
    const max = task.maxAvg || 12;
    return {
      id,
      met: count >= 2 && avg > 0 && avg <= max,
      found: count ? [`${count} / ${avg}`] : [],
      count,
      avg,
      max,
    };
  }
  const re = PATTERNS[id];
  if (!re) throw new Error(`Unknown communication check: ${id}`);
  const found = findAll(re, text);
  if (id === "request" && !found.length && /\?/.test(norm(text)))
    return { id, met: true, found: ["?"] };
  return { id, met: found.length > 0, found };
}

/**
 * Check a learner's message against a task: { needs: [check ids], register, medium, minWords, purposeWords, … }.
 * Returns { empty, ok, words, minWords, results: [{ id, met, found, note? }], next: { en, es } | null }.
 */
export function checkMessage(text, task) {
  const words = tokenize(text).length;
  const minWords = task.minWords || 10;
  if (!words) return { empty: true, ok: false, words, minWords, results: [], next: null };
  const results = (task.needs || []).map((id) => runCheck(id, text, task));
  const firstMiss = results.find((r) => !r.met);
  const longEnough = words >= minWords;
  let next = null;
  if (firstMiss) {
    const pair = firstMiss.note || CHECKS[firstMiss.id].tip;
    next = { en: pair[0], es: pair[1] };
  } else if (!longEnough)
    next = {
      en: `Your message has ${words} words. Add a detail so the reader has what they need (about ${minWords} words).`,
      es: `Tu mensaje tiene ${words} palabras. Agrega un detalle para que el lector tenga lo que necesita (unas ${minWords} palabras).`,
    };
  return { empty: false, ok: !firstMiss && longEnough, words, minWords, results, next };
}

/** Compare step: which version the learner chose. */
export function checkPick(scenario, versionId) {
  const v = scenario.versions.find((x) => x.id === versionId);
  if (!v) return null;
  return { ok: !!v.best, id: v.id };
}

/** Shift step: answers { index: "changes" | "stays" }. Every item must be answered before checking. */
export function checkShift(scenario, answers = {}) {
  const items = scenario.shift.items;
  const missing = items.map((_, i) => i).filter((i) => !["changes", "stays"].includes(answers[i]));
  if (missing.length) return { complete: false, missing, results: [], right: 0 };
  const results = items.map((it, i) => ({ ok: (answers[i] === "changes") === it.changes }));
  return { complete: true, missing: [], results, right: results.filter((r) => r.ok).length };
}
