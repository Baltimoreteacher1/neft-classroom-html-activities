// Book Studio writing coach: the rules both sides share. Pure and dependency-light, so the server
// (functions/api/book-coach.js), the editor (editor-coach.js) and the Node tests all read the SAME limits.
//
//   validateRequest()  what a request may carry (per action, size-capped; never names, media or ids)
//   acceptReply()      what a model reply may say: only questions, observations that quote the learner, or word
//                      choices. Any item over 30 words, any 8+ word run copied from the learner's text, a question
//                      that is not a question, or anything shaped like a score rejects the WHOLE reply.
//   offlineCoach()     deterministic built-in tips (no AI, no network) for Brainstorm, Organize, Expand, Genre and
//                      Picture, so the coach still helps with no model or no internet.
//
// The coach asks; it never writes the learner's book. No action returns a sentence, a page or alt text to paste.
import { MOVES, purposeMoves } from "../lang/purpose.js";
import { tokenize } from "../lang/text.js";

export const COACH_ACTIONS = Object.freeze([
  "brainstorm",
  "organize",
  "expand",
  "vocabulary",
  "clarity",
  "genre",
  "picture",
  "translate",
]);
/** Actions with built-in tips when the AI is off or unreachable. */
export const OFFLINE_ACTIONS = Object.freeze([
  "brainstorm",
  "organize",
  "expand",
  "genre",
  "picture",
]);
export const PURPOSES = Object.freeze(["Narrate", "Inform", "Explain", "Argue"]);
export const PROMPT_VERSION = "book-coach-1";
export const LIMITS = Object.freeze({
  text: 2000,
  sentence: 300,
  phrase: 80,
  phraseWords: 6,
  title: 120,
  prompt: 400,
  heading: 80,
  pages: 40,
  maxWords: 30,
  copyRun: 8,
});

const clean = (v, n) =>
  typeof v === "string"
    ? v
        .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, n)
    : "";
const words = (s) => tokenize(s).map((t) => t.lower);
export const wordCountOf = (s) => tokenize(s).length;

/** The purpose a book's template states (Narrate/Inform/Explain/Argue), else one inferred from the kind of book. */
export function purposeOf(template, kind) {
  const p = template?.purpose?.en;
  if (PURPOSES.includes(p)) return p;
  if (kind === "report" || kind === "informational") return "Inform";
  if (kind === "narrative" || kind === "comic" || kind === "picture" || kind === "audio")
    return "Narrate";
  return "Explain";
}

// ── requests ──────────────────────────────────────────────────────────────────────────────────────────────

const fail = (error) => ({ ok: false, error });
const purposeIn = (p) => (PURPOSES.includes(p) ? p : "");

/**
 * Validate one coach request. Returns { ok: true, action, lang, payload } with only the allowed, cleaned fields,
 * or { ok: false, error }. Oversized text is refused (not clipped), so the learner knows what was sent.
 */
export function validateRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("invalid-body");
  const { action } = body;
  if (!COACH_ACTIONS.includes(action)) return fail("invalid-action");
  const raw = body.payload;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail("invalid-payload");
  const lang = body.lang === "es" ? "es" : "en";
  const tooLong = (v, n) => typeof v === "string" && v.trim().length > n;
  const out = (payload) => ({ ok: true, action, lang, payload });

  if (action === "brainstorm") {
    if (tooLong(raw.title, LIMITS.title) || tooLong(raw.prompt, LIMITS.prompt))
      return fail("too-long");
    const title = clean(raw.title, LIMITS.title);
    const prompt = clean(raw.prompt, LIMITS.prompt);
    if (!title && !prompt) return fail("needs-title-or-prompt");
    return out({ title, prompt, purpose: purposeIn(raw.purpose) || "Explain" });
  }
  if (action === "organize") {
    if (!Array.isArray(raw.pages) || raw.pages.length < 2 || raw.pages.length > LIMITS.pages)
      return fail("invalid-pages");
    const pages = raw.pages.map((p, i) => ({
      n: i + 1,
      heading: clean(p?.heading, LIMITS.heading),
    }));
    if (pages.reduce((n, p) => n + p.heading.length, 0) > LIMITS.text) return fail("too-long");
    return out({ pages, purpose: purposeIn(raw.purpose) || "Explain" });
  }
  if (action === "expand") {
    if (tooLong(raw.sentence, LIMITS.sentence)) return fail("too-long");
    const sentence = clean(raw.sentence, LIMITS.sentence);
    if (wordCountOf(sentence) < 3) return fail("sentence-too-short");
    return out({ sentence });
  }
  if (action === "vocabulary" || action === "clarity" || action === "genre") {
    if (tooLong(raw.text, LIMITS.text)) return fail("too-long");
    const text = clean(raw.text, LIMITS.text);
    if (wordCountOf(text) < (action === "genre" ? 1 : 3)) return fail("text-too-short");
    const purpose = purposeIn(raw.purpose);
    if (action === "genre" && !purpose) return fail("invalid-purpose");
    return out(action === "vocabulary" ? { text } : { text, purpose: purpose || "Explain" });
  }
  if (action === "picture") {
    const kind = ["art", "drawing", "photo"].includes(raw.kind) ? raw.kind : "";
    if (!kind) return fail("invalid-kind");
    if (tooLong(raw.prompt, LIMITS.prompt)) return fail("too-long");
    // A built-in illustration's catalogue name ("girl with a backpack"), never a file or a pixel.
    const name = kind === "art" ? clean(raw.name, 60).replace(/[^\p{L}\p{N}' -]/gu, "") : "";
    return out({ kind, name, prompt: clean(raw.prompt, LIMITS.prompt) });
  }
  // translate
  if (tooLong(raw.phrase, LIMITS.phrase)) return fail("too-long");
  const phrase = clean(raw.phrase, LIMITS.phrase);
  const n = wordCountOf(phrase);
  if (n < 1 || n > LIMITS.phraseWords) return fail("phrase-length");
  return out({ phrase });
}

/** All learner-written text in a payload: what a reply may not copy long runs of. */
export function sourceText(action, payload) {
  if (action === "organize") return payload.pages.map((p) => p.heading).join(" . ");
  return [payload.title, payload.prompt, payload.sentence, payload.text, payload.phrase]
    .filter(Boolean)
    .join(" . ");
}

// ── replies ───────────────────────────────────────────────────────────────────────────────────────────────

/** True when `out` repeats a run of `n` or more consecutive words from `input`. */
export function copiedRun(out, input, n = LIMITS.copyRun) {
  const src = words(input);
  if (src.length < n) return false;
  const grams = new Set();
  for (let i = 0; i + n <= src.length; i++) grams.add(src.slice(i, i + n).join(" "));
  const w = words(out);
  for (let i = 0; i + n <= w.length; i++) if (grams.has(w.slice(i, i + n).join(" "))) return true;
  return false;
}

const SCORE_LIKE =
  /\b\d+\s*(?:\/|out of)\s*\d+\b|\d+\s*%|\b(?:score|grade|level|points?|rating)\b/i;
const isQuestion = (s) => /[?？]\s*$/.test(s);

/** One string a reply may carry: a non-empty sentence-sized string, ≤ 30 words, not a copy, not a score. */
function okString(v, src, { max = LIMITS.maxWords, question = false } = {}) {
  const s = clean(v, 400);
  if (!s || wordCountOf(s) > max || copiedRun(s, src)) return null;
  if (SCORE_LIKE.test(s)) return null;
  if (question && !isQuestion(s)) return null;
  return s;
}

/** Map every item through `fn`; null if any item fails (one bad item rejects the reply). */
function all(list, fn) {
  const out = [];
  for (const x of list) {
    const v = fn(x);
    if (v == null) return null;
    out.push(v);
  }
  return out;
}

const QUESTION_COUNTS = { brainstorm: [3, 5], expand: [2, 3], genre: [2, 4], picture: [2, 4] };

/** Inside the learner's text, as a whole-word phrase (case-insensitive). */
function occursIn(phrase, text) {
  const p = words(phrase).join(" ");
  if (!p) return false;
  return ` ${words(text).join(" ")} `.includes(` ${p} `);
}

/**
 * Validate a parsed model reply against the action's allowed shape. Returns the cleaned result or null.
 * The result is the only thing the server passes on; model prose outside these fields is dropped.
 */
export function acceptReply(action, parsed, payload) {
  if (!parsed || typeof parsed !== "object") return null;
  const src = sourceText(action, payload);
  if (QUESTION_COUNTS[action]) {
    const [min, max] = QUESTION_COUNTS[action];
    const list = Array.isArray(parsed.questions) ? parsed.questions : [];
    const qs = all(list.slice(0, max), (q) => okString(q, src, { question: true }));
    if (!qs || qs.length < min || new Set(qs.map((q) => q.toLowerCase())).size !== qs.length)
      return null;
    return { questions: qs };
  }
  if (action === "organize") {
    const q = okString(parsed.question, src, { question: true });
    return q ? { question: q } : null;
  }
  if (action === "vocabulary") {
    const list = Array.isArray(parsed.words) ? parsed.words.slice(0, 6) : [];
    const items = all(list, (w) => {
      const word = clean(w?.word, 40);
      const forWord = clean(w?.for, 40);
      const means = okString(w?.means, src, { max: 15 });
      if (!/^[\p{L}'’-]+(?: [\p{L}'’-]+){0,2}$/u.test(word) || !forWord || !means) return null;
      if (!occursIn(forWord, payload.text) || word.toLowerCase() === forWord.toLowerCase())
        return null;
      return { word, for: forWord, means };
    });
    return items && items.length >= 2 ? { words: items } : null;
  }
  if (action === "clarity") {
    const list = Array.isArray(parsed.observations) ? parsed.observations.slice(0, 3) : [];
    const obs = all(list, (o) => {
      const quote = clean(o?.quote, 200).replace(/^["“'‘]+|["”'’]+$/g, "");
      const note = okString(o?.note, src);
      const kind = o?.kind === "strength" ? "strength" : o?.kind === "try" ? "try" : "";
      // A quote is the learner's own words (they must be in the text), short enough to point, not to copy.
      if (!quote || !kind || !note || wordCountOf(quote) >= LIMITS.copyRun) return null;
      if (!occursIn(quote, payload.text)) return null;
      return { kind, quote, note };
    });
    const next = okString(parsed.next, src);
    if (!obs || !obs.length || !next || !obs.some((o) => o.kind === "strength")) return null;
    // Strengths first, always.
    obs.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "strength" ? -1 : 1));
    return { observations: obs, next };
  }
  if (action === "translate") {
    const es = okString(parsed.es, src);
    const en = parsed.en == null || parsed.en === "" ? "" : okString(parsed.en, src, { max: 20 });
    return es && en !== null ? { es, en } : null;
  }
  return null;
}

// ── built-in tips (no AI) ─────────────────────────────────────────────────────────────────────────────────

const B = (en, es) => ({ en, es });
const pickLang = (list, lang) => list.map((x) => x[lang] || x.en);

const BRAINSTORM = {
  Narrate: [
    B(
      "Who is in this part of your story, and what do they want?",
      "¿Quién está en esta parte de tu historia y qué quiere?",
    ),
    B("Where and when does it happen?", "¿Dónde y cuándo pasa?"),
    B("What problem or surprise happens?", "¿Qué problema o sorpresa ocurre?"),
    B(
      "How does the main person feel, and how will the reader know?",
      "¿Cómo se siente la persona principal y cómo lo sabrá el lector?",
    ),
  ],
  Inform: [
    B(
      "What is the most important thing a reader should know first?",
      "¿Qué es lo más importante que el lector debe saber primero?",
    ),
    B(
      "Which fact, number or example would help someone picture it?",
      "¿Qué dato, número o ejemplo ayudaría a imaginarlo?",
    ),
    B(
      "What question would a curious reader ask you about this?",
      "¿Qué pregunta te haría un lector curioso sobre esto?",
    ),
    B(
      "Where could you check that your facts are right?",
      "¿Dónde podrías comprobar que tus datos son correctos?",
    ),
  ],
  Explain: [
    B(
      "What exactly are you explaining: how it works, or why it happens?",
      "¿Qué explicas exactamente: cómo funciona o por qué pasa?",
    ),
    B(
      "What happens first, and what does that cause next?",
      "¿Qué pasa primero y qué causa después?",
    ),
    B("What example from your own life shows this?", "¿Qué ejemplo de tu propia vida lo muestra?"),
    B(
      "What part might confuse a reader, and how could you make it clear?",
      "¿Qué parte podría confundir al lector y cómo podrías aclararla?",
    ),
  ],
  Argue: [
    B(
      "What do you believe about this, in one sentence?",
      "¿Qué piensas sobre esto, en una oración?",
    ),
    B("What is your strongest reason?", "¿Cuál es tu razón más fuerte?"),
    B("Which fact or example supports that reason?", "¿Qué dato o ejemplo apoya esa razón?"),
    B("What would someone who disagrees say?", "¿Qué diría alguien que no está de acuerdo?"),
  ],
};

const MOVE_ES = {
  orient: "¿Dónde y cuándo pasa esto, y quién está ahí?",
  sequence: "¿Qué palabra de tiempo muestra qué pasó primero, después y al final?",
  events: "¿Qué hicieron los personajes? Usa verbos de acción en pasado.",
  response: "¿Cómo terminó, o qué aprendió o sintió el personaje?",
  topic: "En una oración, ¿cuál es tu tema y qué tipo de cosa es?",
  details: "¿Qué dato, número o ejemplo exacto ayudaría al lector a imaginarlo?",
  organize: "¿Cómo agrupaste tus detalles? Agrega una palabra que muestre cómo se conectan.",
  close: "¿Qué es lo único que quieres que el lector recuerde?",
  phenomenon: "¿Qué explicas exactamente: qué pasó o cómo funciona?",
  cause: "¿Qué lo causó y qué pasó por eso?",
  chain: "¿Qué pasa después de ese efecto? Agrega el siguiente paso.",
  support: "¿Qué dato, número o fuente muestra que es verdad?",
  claim: "¿Cuál es tu posición, en una oración con la que alguien podría estar de acuerdo o no?",
  reason: "¿Por qué lo crees? Termina: «Pienso esto porque…»",
  evidence: "¿Qué dato, número u oración de la fuente apoya tu razón?",
  counter: "¿Qué diría alguien que no está de acuerdo y cómo le responderías?",
  restate: "¿Cómo puedes terminar recordándole al lector tu posición?",
};

/** The parts a book of each purpose usually has, in order, with the cue words that show a heading covers one. */
const PARTS = {
  Narrate: [
    {
      cues: ["beginning", "start", "once", "one day", "setting", "meet", "who", "introduction"],
      q: B(
        "Where does your book show the reader who is in the story and where it happens?",
        "¿Dónde muestra tu libro quién está en la historia y dónde pasa?",
      ),
    },
    {
      cues: ["problem", "middle", "then", "suddenly", "challenge", "trouble", "happened"],
      q: B(
        "Which page shows the problem or the big moment?",
        "¿Qué página muestra el problema o el gran momento?",
      ),
    },
    {
      cues: ["end", "ending", "finally", "last", "learned", "lesson", "after", "conclusion"],
      q: B(
        "Which page tells how it ended or what the character learned?",
        "¿Qué página cuenta cómo terminó o qué aprendió el personaje?",
      ),
    },
  ],
  Inform: [
    {
      cues: ["introduction", "what is", "about", "meet", "overview", "intro"],
      q: B(
        "Which page tells the reader what your topic is before the details?",
        "¿Qué página le dice al lector cuál es tu tema antes de los detalles?",
      ),
    },
    {
      cues: [
        "fact",
        "facts",
        "how",
        "parts",
        "kinds",
        "types",
        "where",
        "life",
        "body",
        "food",
        "home",
        "details",
      ],
      q: B(
        "Which pages hold your main facts, and does each one cover one idea?",
        "¿Qué páginas tienen tus datos principales y cada una trata una idea?",
      ),
    },
    {
      cues: ["conclusion", "remember", "summary", "end", "glossary", "fun fact", "why it matters"],
      q: B(
        "How will your last page help the reader remember the main idea?",
        "¿Cómo ayudará tu última página a que el lector recuerde la idea principal?",
      ),
    },
  ],
  Explain: [
    {
      cues: ["question", "what", "introduction", "wonder", "problem", "intro"],
      q: B("Which page says what you are explaining?", "¿Qué página dice qué estás explicando?"),
    },
    {
      cues: [
        "step",
        "steps",
        "cause",
        "because",
        "how",
        "process",
        "first",
        "next",
        "data",
        "test",
        "evidence",
      ],
      q: B(
        "Which pages show the steps or causes in order?",
        "¿Qué páginas muestran los pasos o las causas en orden?",
      ),
    },
    {
      cues: ["conclusion", "result", "results", "so", "learned", "why it matters", "end"],
      q: B(
        "Which page tells what it all means at the end?",
        "¿Qué página dice qué significa todo al final?",
      ),
    },
  ],
  Argue: [
    {
      cues: ["claim", "opinion", "believe", "think", "position", "introduction", "intro"],
      q: B("Which page states your claim clearly?", "¿Qué página dice tu afirmación con claridad?"),
    },
    {
      cues: ["reason", "reasons", "evidence", "because", "fact", "why"],
      q: B(
        "Which pages give a reason and the evidence for it?",
        "¿Qué páginas dan una razón y la evidencia para ella?",
      ),
    },
    {
      cues: ["other side", "counter", "however", "some people", "disagree", "objection"],
      q: B(
        "Is there a page for what someone who disagrees would say?",
        "¿Hay una página para lo que diría alguien que no está de acuerdo?",
      ),
    },
    {
      cues: ["conclusion", "end", "call to action", "so", "should", "finally"],
      q: B(
        "Which page brings the reader back to your claim at the end?",
        "¿Qué página lleva al lector de vuelta a tu afirmación al final?",
      ),
    },
  ],
};

const covers = (heading, cues) => {
  const h = ` ${words(heading).join(" ")} `;
  return cues.some((c) => h.includes(` ${c} `));
};

function organizeTip({ pages, purpose }, lang) {
  const blank = pages.find((p, i) => i > 0 && !p.heading);
  if (blank)
    return lang === "es"
      ? `La página ${blank.n} todavía no tiene título ni palabras. ¿Qué parte de tu libro va ahí?`
      : `Page ${blank.n} has no heading or words yet. Which part of your book belongs there?`;
  const parts = PARTS[purpose] || PARTS.Explain;
  const where = parts.map((part) => pages.findIndex((p) => covers(p.heading, part.cues)));
  const missing = where.findIndex((i) => i < 0);
  if (missing >= 0) return parts[missing].q[lang] || parts[missing].q.en;
  for (let k = 1; k < where.length; k++)
    if (where[k] < where[k - 1]) {
      const [a, b] = [pages[where[k]].n, pages[where[k - 1]].n];
      return lang === "es"
        ? `¿Tendría más sentido la página ${a} antes de la página ${b}?`
        : `Would page ${a} make more sense before page ${b}?`;
    }
  return lang === "es"
    ? "Lee los títulos de tus páginas en orden. ¿Cada uno lleva al siguiente?"
    : "Read your page headings in order. Does each one lead to the next?";
}

const EXPAND = [
  {
    id: "who",
    has: /\b(?:with|and|my|our|his|her|their|friend|friends|mom|dad|teacher|brother|sister|class|family|people|we|they)\b/i,
    q: B("Who else was there or was part of this?", "¿Quién más estaba ahí o participó?"),
  },
  {
    id: "where",
    has: /\b(?:at|in|on|near|under|behind|inside|outside|home|school|park|room|city|street|house|store|outside)\b/i,
    q: B(
      "Where did this happen? What did that place look like?",
      "¿Dónde pasó esto? ¿Cómo era ese lugar?",
    ),
  },
  {
    id: "when",
    has: /\b(?:yesterday|today|tomorrow|morning|afternoon|night|evening|when|after|before|then|later|monday|tuesday|wednesday|thursday|friday|saturday|sunday|summer|winter|spring|fall|year|week|day|ago|\d{4})\b/i,
    q: B("When did it happen?", "¿Cuándo pasó?"),
  },
  {
    id: "why",
    has: /\b(?:because|so|since|to|reason|wanted|needed)\b/i,
    q: B("Why did it happen, or why does it matter?", "¿Por qué pasó o por qué importa?"),
  },
  {
    id: "how",
    has: /\b\w+ly\b|\b(?:by|with|using|carefully|quickly|slowly)\b/i,
    q: B(
      "How did it happen? What did it look, sound or feel like?",
      "¿Cómo pasó? ¿Cómo se veía, sonaba o se sentía?",
    ),
  },
];

function expandTips({ sentence }, lang) {
  const missing = EXPAND.filter((x) => !x.has.test(sentence));
  const qs = (missing.length >= 2 ? missing : EXPAND.slice(-3)).slice(0, 3).map((x) => x.q);
  if (qs.length < 2) qs.push(B("What happened right after this?", "¿Qué pasó justo después?"));
  return pickLang(qs, lang);
}

function genreTips({ text, purpose }, lang) {
  const result = purposeMoves(text, purpose, { words: wordCountOf(text) });
  const missing = result.moves.filter((m) => m.required && !m.present).slice(0, 3);
  const qs = missing.map((m) => (lang === "es" ? MOVE_ES[m.id] || m.ask : m.ask));
  const extra = [
    B(
      "Which sentence on this page are you proudest of, and why?",
      "¿De qué oración de esta página estás más orgulloso u orgullosa, y por qué?",
    ),
    B(
      "What could the next page add to this one?",
      "¿Qué podría agregar la página siguiente a esta?",
    ),
  ];
  for (const x of extra) if (qs.length < 2) qs.push(x[lang] || x.en);
  return qs;
}

function pictureTips({ kind, name }, lang) {
  const first =
    kind === "art" && name
      ? B(
          `What is the ${name} doing in this picture, and where?`,
          `¿Qué hace «${name}» en esta imagen y dónde está?`,
        )
      : B(
          "Who or what is the most important thing in the picture?",
          "¿Quién o qué es lo más importante de la imagen?",
        );
  return pickLang(
    [
      first,
      B(
        "What colors, shapes or details would help someone who cannot see it?",
        "¿Qué colores, formas o detalles ayudarían a alguien que no puede verla?",
      ),
      B(
        "How does the picture connect to the words on this page?",
        "¿Cómo se conecta la imagen con las palabras de esta página?",
      ),
    ],
    lang,
  );
}

/** Built-in tips, the same shape acceptReply returns. Null for actions that need a model (vocabulary, clarity, translate). */
export function offlineCoach(action, payload, lang = "en") {
  const L2 = lang === "es" ? "es" : "en";
  if (action === "brainstorm") {
    const list = pickLang((BRAINSTORM[payload.purpose] || BRAINSTORM.Explain).slice(), L2);
    if (payload.title)
      list.unshift(
        L2 === "es"
          ? `¿Qué sabes ya sobre «${payload.title}» y qué quieres averiguar?`
          : `What do you already know about “${payload.title}”, and what do you want to find out?`,
      );
    return { questions: list.slice(0, 5) };
  }
  if (action === "organize") return { question: organizeTip(payload, L2) };
  if (action === "expand") return { questions: expandTips(payload, L2) };
  if (action === "genre") return { questions: genreTips(payload, L2) };
  if (action === "picture") return { questions: pictureTips(payload, L2) };
  return null;
}

export { MOVES };
