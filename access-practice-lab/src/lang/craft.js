// Craft studios (Argument Arena, Mentor Text Explorer, Sentence Lab): saved state, ledger recording and the
// on-device practice checks for arguments and writer's moves. Pure logic, no markup.
//
// Honesty rules: every check is a rule over the words on the page. It looks for patterns and says what it found;
// it never judges meaning or truth and says so on screen. Feedback is { en, es } so any language mode can show it.
// Nothing here is a WIDA level or score.
import { appendEntry, loadLedger, saveLedger } from "./ledger.js";
import { analyzeResponse } from "./analyze.js";
import { sentences, stem, tokenize } from "./text.js";
import { safeJson, storage } from "../util.js";

export const CRAFT_KEY = "accessPracticeLab:v1:craft";
export const LEVELS = ["A", "B", "C"];
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const str = (v, n = 4000) => (typeof v === "string" ? v.slice(0, n) : "");
const bi = (en, es) => ({ en, es });

/** Saved state: one key for all three studios, so the Passport can carry it. Unknown or damaged fields reset to defaults. */
export function normalizeCraft(raw) {
  const r = isObj(raw) ? raw : {};
  const topics = isObj(r.arena?.topics) ? r.arena.topics : {};
  const texts = isObj(r.mentor?.texts) ? r.mentor.texts : {};
  const tasks = isObj(r.sentences?.tasks) ? r.sentences.tasks : {};
  return {
    v: 1,
    level: LEVELS.includes(r.level) ? r.level : "A",
    arena: { topics: Object.fromEntries(Object.entries(topics).filter(([, t]) => isObj(t))) },
    mentor: {
      texts: Object.fromEntries(Object.entries(texts).filter(([, t]) => isObj(t))),
      toolbox: (Array.isArray(r.mentor?.toolbox) ? r.mentor.toolbox : [])
        .filter((x) => isObj(x) && typeof x.move === "string" && typeof x.text === "string")
        .slice(-120),
      tries: isObj(r.mentor?.tries) ? r.mentor.tries : {},
    },
    sentences: {
      tasks: Object.fromEntries(Object.entries(tasks).filter(([, t]) => isObj(t))),
      boss: isObj(r.sentences?.boss) ? r.sentences.boss : {},
      pos: isObj(r.sentences?.pos) ? r.sentences.pos : {},
      round: isObj(r.sentences?.round) ? r.sentences.round : {},
    },
  };
}
export const loadCraft = (read = (k) => storage.get(k)) =>
  normalizeCraft(safeJson(read(CRAFT_KEY), null));
export const saveCraft = (state, write = (k, v) => storage.set(k, v)) =>
  write(CRAFT_KEY, JSON.stringify(state));

/** Writes one evidence-ledger entry. Support levels A and B opened frames or hints, so they are "supported"; C is independent. */
export function recordCraft(partial, { text = "", analyzeOpts = null } = {}) {
  const ledger = loadLedger();
  const supported = partial.level !== "C" || partial.supportUsed;
  const m = { ...(partial.m || {}) };
  if (analyzeOpts && text) Object.assign(m, analyzeResponse(text, analyzeOpts).ledger);
  const entry = appendEntry(ledger, {
    src: partial.src,
    task: partial.task,
    band: partial.band,
    domain: partial.domain,
    use: partial.use,
    stage: supported ? "supported" : "independent",
    kind: partial.kind || "first",
    supports: supported
      ? {
          frames: partial.level === "A",
          hint: partial.level !== "C" || Boolean(partial.supportUsed),
        }
      : {},
    m: Object.fromEntries(Object.entries(m).filter(([, v]) => v !== null && v !== undefined)),
  });
  saveLedger(ledger);
  return entry;
}

// ── text helpers ────────────────────────────────────────────────────────────
const words = (t) => tokenize(t).map((x) => x.lower);
const wc = (t) => words(t).length;
const wordRe = (w) =>
  new RegExp(
    `(?<![\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:s|es|ed|d|ing|ly|y)?(?![\\p{L}\\p{N}])`,
    "iu",
  );
const anyWord = (text, list) => list.filter((w) => wordRe(w).test(text));
/** Rough root of an English word so sprint, sprints and sprinted compare equal. Short words compare exactly. */
const root = (word) => {
  let w = word.toLowerCase();
  if (w.length <= 3) return w;
  if (w.endsWith("ing") && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith("ied")) w = `${w.slice(0, -3)}y`;
  else if (w.endsWith("ed") && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith("es") && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  if (w.endsWith("e")) w = w.slice(0, -1);
  if (/([^aeiou])\1$/.test(w)) w = w.slice(0, -1);
  return w;
};
const verbHits = (text, list) => {
  const roots = new Set(list.map(root));
  return words(text).filter((x) => roots.has(root(x)));
};
const longestRun = (a, b) => {
  const x = words(a);
  const y = new Set();
  const yw = words(b);
  for (let n = 3; n <= 12; n++)
    for (let i = 0; i + n <= yw.length; i++) y.add(yw.slice(i, i + n).join(" "));
  let best = 0;
  for (let i = 0; i < x.length; i++)
    for (let n = 3; n <= 12 && i + n <= x.length; n++)
      if (y.has(x.slice(i, i + n).join(" "))) best = Math.max(best, n);
  return best;
};

// ── Argument Arena ──────────────────────────────────────────────────────────
const STANCE =
  /\b(should|shouldn't|should not|believe|think|agree|argue|must|better|worse|need|needs|ought|support|am for|am against)\b/i;
const SIGNAL =
  /\b(according to|says|said|shows|show|states|found|reports|explains|wrote|writes|for example|for instance)\b/i;
const REASON =
  /\b(because|this shows|this means|which means|that is why|therefore|this matters|that shows|so that|as a result)\b/i;

export const blankTopicState = () => ({
  step: "read",
  side: "",
  claim: "",
  slots: [null, null],
  notes: ["", ""],
  reason: "",
  counterType: "",
  counter: "",
  spoke: false,
  checks: [false, false, false, false],
  self: {},
  peer: {},
  ledgered: {},
});
export const topicState = (state, id) => ({
  ...blankTopicState(),
  ...(isObj(state.arena.topics[id]) ? state.arena.topics[id] : {}),
});

/** Rule-based check of the built argument: [{ id, ok, say: { en, es } }] and ready = every item ok. */
export function checkArgument(topic, s) {
  const items = [];
  const claim = str(s.claim).trim();
  items.push({
    id: "claim",
    ok: wc(claim) >= 6 && STANCE.test(claim),
    say:
      wc(claim) >= 6 && STANCE.test(claim)
        ? bi("Your claim takes a clear side.", "Tu afirmación toma un lado claro.")
        : bi(
            "Write a claim of at least six words that takes a side, such as “I believe … should …”.",
            "Escribe una afirmación de al menos seis palabras que tome un lado, como “Creo que … debería …”.",
          ),
  });
  const cards = s.slots.map((id) => topic.cards.find((c) => c.id === id) || null);
  const filled = cards.filter(Boolean);
  const wrongSide = cards.findIndex((c) => c && c.side !== s.side);
  items.push({
    id: "evidence",
    ok: filled.length === 2 && wrongSide < 0,
    say:
      filled.length < 2
        ? bi(
            "Add two evidence cards to your argument.",
            "Agrega dos tarjetas de evidencia a tu argumento.",
          )
        : wrongSide >= 0
          ? bi(
              `The card from “${cards[wrongSide].source}” supports the other side. Save it for the counterargument, or pick a card that backs your claim.`,
              `La tarjeta de “${cards[wrongSide].source}” apoya el otro lado. Guárdala para el contraargumento o elige una tarjeta que respalde tu afirmación.`,
            )
          : bi("Both cards back your side.", "Las dos tarjetas respaldan tu lado."),
  });
  const notes = s.notes.map((n) => str(n).trim());
  const noteOk = filled.length > 0 && notes.slice(0, filled.length).every((n) => wc(n) >= 6);
  const signal = notes.some((n) => SIGNAL.test(n));
  items.push({
    id: "signal",
    ok: noteOk && signal,
    say: !noteOk
      ? bi(
          "Under each card, explain the evidence in one sentence of your own.",
          "Debajo de cada tarjeta, explica la evidencia en una oración propia.",
        )
      : !signal
        ? bi(
            "Name where the evidence comes from, for example “According to the teacher interview, …”.",
            "Nombra de dónde viene la evidencia, por ejemplo “Según la entrevista con la maestra, …”.",
          )
        : bi("You named your source.", "Nombraste tu fuente."),
  });
  const copied = notes.findIndex((n, i) => cards[i] && longestRun(n, cards[i].text) >= 8);
  items.push({
    id: "own",
    ok: copied < 0 && noteOk,
    say:
      copied >= 0
        ? bi(
            `Your note for card ${copied + 1} copies eight or more words in a row. Put the idea in your own words.`,
            `Tu nota de la tarjeta ${copied + 1} copia ocho o más palabras seguidas. Pon la idea en tus propias palabras.`,
          )
        : bi("Your evidence is in your own words.", "Tu evidencia está en tus propias palabras."),
  });
  const reason = str(s.reason).trim();
  const reasonOk = wc(reason) >= 8 && REASON.test(reason);
  items.push({
    id: "reasoning",
    ok: reasonOk,
    say: reasonOk
      ? bi(
          "Your reasoning explains why the evidence matters.",
          "Tu razonamiento explica por qué importa la evidencia.",
        )
      : bi(
          "Explain why the evidence supports your claim in at least eight words. Try “This matters because …”.",
          "Explica por qué la evidencia respalda tu afirmación en al menos ocho palabras. Prueba “Esto importa porque …”.",
        ),
  });
  return { items, ready: items.every((i) => i.ok), next: items.find((i) => !i.ok) || null };
}

export function composeArgument(topic, s) {
  const cards = s.slots.map((id) => topic.cards.find((c) => c.id === id));
  return [
    str(s.claim).trim(),
    ...s.notes.map((n, i) => (cards[i] ? str(n).trim() : "")).filter(Boolean),
    str(s.reason).trim(),
  ]
    .filter(Boolean)
    .join(" ");
}

const COUNTER = {
  agree: {
    cue: /\b(good point|you are right|you're right|i agree that|it is true|that is true|you make a good point|fair point)\b/i,
    turn: /\b(but|however|still|even so|yet)\b/i,
  },
  disagree: {
    cue: /\b(i disagree|i do not agree|i don't agree|i see it differently|not exactly|i am not sure that)\b/i,
    turn: /\b(because|since|for example|the evidence|according to)\b/i,
  },
  clarify: { cue: /\b(what|why|how|which|who|do you|can you|could you|would you)\b/i, turn: /\?/ },
};
/** Checks a response to the counterargument card by its type. */
export function checkCounter(type, text) {
  const t = str(text).trim();
  const rule = COUNTER[type];
  if (!rule)
    return {
      ok: false,
      say: bi("Choose how you will respond first.", "Primero elige cómo vas a responder."),
    };
  if (wc(t) < 6)
    return {
      ok: false,
      say: bi("Write at least one full sentence.", "Escribe al menos una oración completa."),
    };
  if (!rule.cue.test(t))
    return {
      ok: false,
      say:
        type === "agree"
          ? bi(
              "Start by naming what is true in the other point, for example “You make a good point that …”.",
              "Empieza diciendo qué es cierto en el otro punto, por ejemplo “Tienes razón en que …”.",
            )
          : type === "disagree"
            ? bi(
                "Say plainly that you see it differently, for example “I disagree because …”.",
                "Di con claridad que lo ves diferente, por ejemplo “No estoy de acuerdo porque …”.",
              )
            : bi(
                "Ask with a question word, such as what, why, how or can you.",
                "Pregunta con una palabra interrogativa, como qué, por qué, cómo o puedes.",
              ),
    };
  if (!rule.turn.test(t))
    return {
      ok: false,
      say:
        type === "agree"
          ? bi(
              "After you agree, add what still matters with “but” or “however”.",
              "Después de estar de acuerdo, agrega lo que aún importa con “pero” o “sin embargo”.",
            )
          : type === "disagree"
            ? bi(
                "Give a reason after you disagree. Try “because” or “for example”.",
                "Da una razón después de no estar de acuerdo. Prueba con “porque” o “por ejemplo”.",
              )
            : bi(
                "End with a question mark so it reads as a question.",
                "Termina con un signo de interrogación para que se lea como pregunta.",
              ),
    };
  return {
    ok: true,
    say: bi(
      "Your response does its job: it answers the other side politely and clearly.",
      "Tu respuesta cumple su función: responde al otro lado con cortesía y claridad.",
    ),
  };
}

export const RUBRIC = [
  {
    id: "claim",
    name: bi("Claim", "Afirmación"),
    d: [
      bi("I am not sure what side I took.", "No estoy seguro de qué lado tomé."),
      bi("My side is there, but it could be clearer.", "Mi lado está, pero podría ser más claro."),
      bi("My side is clear in one sentence.", "Mi lado es claro en una oración."),
    ],
  },
  {
    id: "evidence",
    name: bi("Evidence", "Evidencia"),
    d: [
      bi("I used no card or only one.", "No usé tarjeta o usé solo una."),
      bi(
        "I used two cards but did not say where they came from.",
        "Usé dos tarjetas pero no dije de dónde venían.",
      ),
      bi("I used two cards and named my sources.", "Usé dos tarjetas y nombré mis fuentes."),
    ],
  },
  {
    id: "reasoning",
    name: bi("Reasoning", "Razonamiento"),
    d: [
      bi("I did not explain why the evidence matters.", "No expliqué por qué importa la evidencia."),
      bi("I explained a little.", "Expliqué un poco."),
      bi(
        "I connected the evidence to my claim with “because”.",
        "Conecté la evidencia con mi afirmación usando “porque”.",
      ),
    ],
  },
  {
    id: "speaking",
    name: bi("Speaking", "Expresión oral"),
    d: [
      bi("I stopped often or spoke very quietly.", "Me detuve mucho o hablé muy bajo."),
      bi("I spoke clearly some of the time.", "Hablé con claridad parte del tiempo."),
      bi(
        "I spoke clearly and looked up from my notes.",
        "Hablé con claridad y levanté la vista de mis notas.",
      ),
    ],
  },
  {
    id: "responding",
    name: bi("Responding", "Responder"),
    d: [
      bi("I have not answered the other side.", "No he respondido al otro lado."),
      bi("I answered, but I did not say why.", "Respondí, pero no dije por qué."),
      bi(
        "I answered politely and gave a reason or a question.",
        "Respondí con cortesía y di una razón o una pregunta.",
      ),
    ],
  },
];

// ── Mentor Text Explorer: practice checks per writer's move ────────────────
const STRONG_VERBS =
  "sprinted dashed darted bolted raced charged lunged leaped vaulted tiptoed crept sneaked slithered shuffled trudged stomped marched strode wandered drifted glided soared swooped plunged tumbled stumbled staggered scrambled clambered hurled flung tossed lobbed snatched grabbed seized clutched gripped whispered murmured muttered shouted bellowed shrieked gasped sighed groaned declared announced insisted admitted replied stared glanced gazed peered squinted studied scanned glared gleamed glimmered flickered sparkled blazed glowed shimmered crashed slammed thudded clattered rattled rumbled thundered boomed echoed hissed crackled sizzled bubbled splashed drizzled poured gushed trickled swelled shrank crumbled shattered split snapped twisted tangled wrapped hugged squeezed pressed pounded hammered tapped drummed knocked nudged shoved yanked tugged heaved lifted hoisted dragged hauled wrestled gobbled devoured nibbled gulped sipped savored chomped munched carved sculpted sketched painted stitched assembled constructed crafted invented examined investigated measured calculated predicted discovered revealed confirmed argued persuaded convinced demanded urged warned protected defended rescued trembled shivered quivered bloomed sprouted flourished withered erupted exploded surged dwindled".split(
    " ",
  );
const WEAK_VERBS =
  "went go goes going said say says got get gets getting looked look looks walked walk walks was is were are had have has saw see made make took take put came come ran run moved".split(
    " ",
  );
const SENSE = {
  sight:
    "bright glowing shimmering dark golden scarlet crimson gleaming glittering dim pale faded sparkling shadowy blurry silver emerald turquoise orange violet misty hazy colorful striped speckled".split(
      " ",
    ),
  sound:
    "crunch crackle rumble whisper buzz hum roar thud creak screech clatter echo hiss snap sizzle ring clang murmur pop splash thump bang rustle howl squeak chirp growl drip tap".split(
      " ",
    ),
  smell:
    "smell scent aroma stink fragrant musty smoky perfume stale fresh pine sour-smelling rotten flowery spicy-smelling".split(
      " ",
    ),
  touch:
    "rough smooth slippery prickly sticky cold icy warm hot soft fuzzy damp gritty bumpy sharp silky freezing scratchy chilly wet dry rubbery velvety".split(
      " ",
    ),
  taste:
    "sweet sour bitter salty spicy tangy juicy crunchy bland creamy sugary buttery savory minty tart".split(
      " ",
    ),
};
const SENSE_NAME = {
  sight: bi("sight", "vista"),
  sound: bi("sound", "oído"),
  smell: bi("smell", "olfato"),
  touch: bi("touch", "tacto"),
  taste: bi("taste", "gusto"),
};
const TRANS = {
  time: [
    "first",
    "next",
    "then",
    "later",
    "finally",
    "meanwhile",
    "after",
    "before",
    "soon",
    "at last",
    "afterward",
    "eventually",
    "once",
  ],
  contrast: [
    "however",
    "but",
    "although",
    "instead",
    "on the other hand",
    "in contrast",
    "still",
    "yet",
    "even though",
    "while",
  ],
  addition: ["also", "in addition", "furthermore", "moreover", "besides", "another", "as well"],
  cause: ["because", "so", "therefore", "as a result", "for this reason", "since", "that is why"],
  example: ["for example", "for instance", "such as"],
  conclusion: ["in conclusion", "overall", "in summary", "to sum up"],
};
const TRANS_NAME = {
  time: bi("time", "tiempo"),
  contrast: bi("contrast", "contraste"),
  addition: bi("adding", "suma"),
  cause: bi("cause and effect", "causa y efecto"),
  example: bi("example", "ejemplo"),
  conclusion: bi("conclusion", "conclusión"),
};

/**
 * Checks one try-it sentence for one move. `task` = { weak?: [], fn?: transition kind }.
 * Returns { ok, got: {en,es}|null, tip: {en,es} }.
 */
export function checkMove(move, text, task = {}) {
  const t = str(text).trim();
  if (wc(t) < 4)
    return {
      ok: false,
      got: null,
      tip: bi(
        "Write a full sentence with at least four words.",
        "Escribe una oración completa con al menos cuatro palabras.",
      ),
    };
  const ok = (en, es) => ({ ok: true, got: bi(en, es), tip: null });
  const no = (en, es) => ({ ok: false, got: null, tip: bi(en, es) });
  switch (move) {
    case "verb": {
      const weakLeft = verbHits(t, task.weak || []);
      const strong = verbHits(t, STRONG_VERBS);
      if (weakLeft.length)
        return no(
          `The plain word “${weakLeft[0]}” is still in your sentence. Swap it for a verb that shows how.`,
          `La palabra simple “${weakLeft[0]}” sigue en tu oración. Cámbiala por un verbo que muestre cómo.`,
        );
      if (strong.length)
        return ok(
          `“${strong[0]}” is a precise verb: it shows how the action happened.`,
          `“${strong[0]}” es un verbo preciso: muestra cómo ocurrió la acción.`,
        );
      return no(
        "I could not find a precise verb I know. Pick a verb that shows speed, force, or feeling, such as sprinted, gripped, or whispered.",
        "No encontré un verbo preciso que conozca. Elige un verbo que muestre velocidad, fuerza o sentimiento, como sprinted, gripped o whispered.",
      );
    }
    case "sense": {
      const found = Object.entries(SENSE)
        .map(([k, list]) => [k, anyWord(t, list)])
        .filter(([, w]) => w.length);
      if (found.length) {
        const [k, w] = found[0];
        return ok(
          `“${w[0]}” brings in the sense of ${SENSE_NAME[k].en}.`,
          `“${w[0]}” trae el sentido del ${SENSE_NAME[k].es}.`,
        );
      }
      return no(
        "Add a detail the reader can see, hear, smell, touch, or taste, such as crackling, golden, or icy.",
        "Agrega un detalle que el lector pueda ver, oír, oler, tocar o saborear, como crackling, golden o icy.",
      );
    }
    case "hook": {
      const first = sentences(t)[0]?.text || t;
      if (/\?\s*$/.test(first))
        return ok(
          "Your opening is a question. It makes the reader want to answer.",
          "Tu comienzo es una pregunta. Hace que el lector quiera responder.",
        );
      if (/^["“]/.test(first))
        return ok(
          "Your opening is spoken words. Dialogue puts the reader in the scene.",
          "Tu comienzo son palabras habladas. El diálogo mete al lector en la escena.",
        );
      if (/^(imagine|picture|what if|have you ever|did you know)\b/i.test(first))
        return ok(
          "Your opening speaks straight to the reader.",
          "Tu comienzo le habla directamente al lector.",
        );
      if (/\d/.test(first) || /!\s*$/.test(first))
        return ok(
          "Your opening has a surprising number or strong feeling.",
          "Tu comienzo tiene un número sorprendente o un sentimiento fuerte.",
        );
      return no(
        "Try opening with a question, a line of dialogue, “Imagine …”, or a surprising fact.",
        "Prueba abrir con una pregunta, una línea de diálogo, “Imagine …” o un dato sorprendente.",
      );
    }
    case "trans": {
      const hit = Object.entries(TRANS)
        .map(([k, list]) => [k, anyWord(t, list)])
        .filter(([, w]) => w.length);
      if (!hit.length)
        return no(
          "Add a transition word such as first, however, for example, or as a result.",
          "Agrega una palabra de transición como first, however, for example o as a result.",
        );
      const want = task.fn && hit.find(([k]) => k === task.fn);
      if (task.fn && !want)
        return no(
          `“${hit[0][1][0]}” is a ${TRANS_NAME[hit[0][0]].en} word. This sentence needs a ${TRANS_NAME[task.fn].en} word.`,
          `“${hit[0][1][0]}” es una palabra de ${TRANS_NAME[hit[0][0]].es}. Esta oración necesita una palabra de ${TRANS_NAME[task.fn].es}.`,
        );
      const [k, w] = want || hit[0];
      return ok(
        `“${w[0]}” is a ${TRANS_NAME[k].en} transition. It tells the reader how the ideas connect.`,
        `“${w[0]}” es una transición de ${TRANS_NAME[k].es}. Le dice al lector cómo se conectan las ideas.`,
      );
    }
    case "evid": {
      const sig = t.match(
        /\b(according to|the (?:text|article|author|passage|report|survey|study|data|chart|graph) (?:says|states|shows|explains|reports|found|suggests)|one (?:study|source|expert)|research (?:shows|suggests)|experts (?:say|suggest)|for example|for instance)\b/i,
      );
      if (!sig)
        return no(
          "Add a signal phrase that names the source, such as “According to the article, …”.",
          "Agrega una frase señal que nombre la fuente, como “Según el artículo, …”.",
        );
      if (!/\d|["“]/.test(t))
        return {
          ok: true,
          got: bi(
            `“${sig[0]}” introduces the evidence. Next, add a number or a quotation to make it stronger.`,
            `“${sig[0]}” presenta la evidencia. Luego agrega un número o una cita para fortalecerla.`,
          ),
          tip: null,
        };
      return ok(
        `“${sig[0]}” introduces the evidence, and you included a number or quotation.`,
        `“${sig[0]}” presenta la evidencia, y incluiste un número o una cita.`,
      );
    }
    case "coh": {
      const ss = sentences(t);
      if (ss.length < 2)
        return no(
          "Write two sentences. The second one should point back to the first.",
          "Escribe dos oraciones. La segunda debe remitir a la primera.",
        );
      const ref = ss
        .slice(1)
        .map(
          (s) =>
            s.text.match(
              /^(?:this|that|these|those|such|another|the same|in addition|also|they|it|he|she)\b/i,
            )?.[0],
        )
        .find(Boolean);
      const shared = tokenize(ss[0].text)
        .filter((x) => x.lower.length > 3)
        .some((x) => ss.slice(1).some((s) => words(s.text).map(stem).includes(stem(x.lower))));
      if (ref && shared)
        return ok(
          `“${ref}” points back to the first sentence, and the repeated key word keeps the ideas tied together.`,
          `“${ref}” remite a la primera oración, y la palabra clave repetida mantiene unidas las ideas.`,
        );
      if (ref)
        return ok(
          `“${ref}” points back to the first sentence.`,
          `“${ref}” remite a la primera oración.`,
        );
      return no(
        "Start the second sentence with a pointing word such as This, These, Another, or They.",
        "Empieza la segunda oración con una palabra que señale, como This, These, Another o They.",
      );
    }
    case "comp": {
      const m = t.match(
        /\b(like|as \w+ as|seemed like|as if|as though|looked like|resembled|than)\b/i,
      );
      return m
        ? ok(
            `“${m[0]}” sets up a comparison that helps the reader picture it.`,
            `“${m[0]}” crea una comparación que ayuda al lector a imaginarlo.`,
          )
        : no(
            "Compare two things with “like”, “as … as”, or “as if”.",
            "Compara dos cosas con “like”, “as … as” o “as if”.",
          );
    }
    case "prec": {
      const num = t.match(
        /\b\d[\d,.]*\s?(?:%|inches|feet|miles|meters|minutes|hours|pounds|degrees|years|days|students|people)?|\b(?:two|three|four|five|six|seven|eight|nine|ten|twelve|twenty|hundred|thousand)\b/i,
      );
      const name = t.slice(1).match(/(?<=[a-z,] )[A-Z][a-z]{2,}/);
      if (num)
        return ok(
          `“${num[0].trim()}” is an exact detail. It tells the reader how many or how much.`,
          `“${num[0].trim()}” es un detalle exacto. Le dice al lector cuántos o cuánto.`,
        );
      if (name)
        return ok(
          `“${name[0]}” is a specific name. Names are more precise than “a place” or “a person”.`,
          `“${name[0]}” es un nombre específico. Los nombres son más precisos que “un lugar” o “una persona”.`,
        );
      return no(
        "Add an exact number, measurement, or name instead of a general word.",
        "Agrega un número exacto, una medida o un nombre en lugar de una palabra general.",
      );
    }
    default:
      return no("Try again.", "Inténtalo de nuevo.");
  }
}
