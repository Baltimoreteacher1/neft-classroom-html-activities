// Listening and speaking activities. Speech is played with the browser's own voice and recordings stay on the
// device, so nothing here can mark spoken language right or wrong: speaking items are self-checked against a list
// of observable things the student did, and say so. Listening items use ordinary choices on heard text.
import { speakItem, unitWordsIn } from "./build.js";
import { lcFirst, mc, nearWords, noDot, relHint, visualOf, wordExtras } from "./core.js";

const G = "listening";
const filled = (cl) => (cl?.s && cl.f ? cl.s.replace("___", cl.f) : null);

export const LISTEN_TYPES = [
  {
    id: "hear-identify",
    group: G,
    label: ["Listen and choose the word", "Escucha y elige la palabra"],
    dims: ["rec", "mean"],
    dim: "rec",
    minGrade: 0,
    maxGrade: 12,
    domain: "listening",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      return mc(c, {
        prompt: "Listen to the meaning. Which word does it describe?",
        stem: w.def,
        listenOnly: true,
        correct: w.hw,
        wrongs: nearWords(c, w).map((x) => x.hw),
        explain: `“${w.hw}” means: ${w.def}`,
        hint: relHint(w) || "Listen again. Say the meaning in your own words, then think of the word.",
        speak: w.def,
      });
    },
  },
  {
    id: "hear-judge",
    group: G,
    label: ["Listen: does it make sense?", "Escucha: ¿tiene sentido?"],
    dims: ["ctx", "mean"],
    dim: "ctx",
    minGrade: 0,
    maxGrade: 12,
    domain: "listening",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      if (!w.misuse?.s || !w.ex) return null;
      const good = c.rng.int(2) === 0;
      const sentence = good ? w.ex : w.misuse.s;
      const yes = "Yes, it makes sense.";
      const no = "No, the word is used the wrong way.";
      return mc(c, {
        prompt: `Listen to the sentence. Is “${w.hw}” used the right way?`,
        stem: sentence,
        hl: [w.hw],
        listenOnly: true,
        correct: good ? yes : no,
        wrongs: [good ? no : yes],
        minWrong: 1,
        explain: good
          ? `Yes. “${w.hw}” means ${lcFirst(noDot(w.def))} and the sentence matches that meaning.`
          : `${w.misuse.why} “${w.hw}” means: ${w.def}`,
        hint: `Think about what “${w.hw}” means. Does the person or thing in the sentence match it?`,
        speak: sentence,
      });
    },
  },
  {
    id: "hear-meaning",
    group: G,
    label: ["Listen for the meaning", "Escucha el significado"],
    dims: ["ctx", "mean"],
    dim: "ctx",
    minGrade: 1,
    maxGrade: 12,
    domain: "listening",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      const s = [w.ex2, w.ex].find(Boolean);
      if (!s) return null;
      return mc(c, {
        prompt: `Listen to the sentence. What does “${w.hw}” mean in it?`,
        stem: s,
        hl: [w.hw],
        listenOnly: true,
        correct: w.def,
        wrongs: nearWords(c, w)
          .slice(0, c.n + 2)
          .map((x) => x.def)
          .filter(Boolean),
        explain: `In this sentence “${w.hw}” means: ${w.def}`,
        hint: "Listen for the clues around the word. What do they tell you about it?",
        speak: s,
      });
    },
  },
  {
    id: "listen-respond",
    group: G,
    label: ["Listen and respond", "Escucha y responde"],
    dims: ["rec", "prod"],
    dim: "prod",
    minGrade: 0,
    maxGrade: 12,
    domain: "speaking",
    mode: "speak",
    scope: "word",
    make(c) {
      const w = c.word;
      return speakItem(c, {
        prompt: "Listen to the meaning. Say the word it describes, then use the word in a sentence.",
        stem: w.def,
        listenOnly: true,
        speak: w.def,
        checklist: ["I said the word that matches the meaning.", `I used “${w.hw}” in a sentence.`, "My sentence made sense."],
        model: w.ex,
        modelSafe: false,
        modelLabel: "One way to say it",
        explain: `“${w.hw}” means: ${w.def} One sentence: ${w.ex}`,
        hint: w.frame ? `You can start with: ${w.frame}` : "Say the meaning again slowly. Which word from the lesson matches it?",
      });
    },
  },
  {
    id: "picture-describe",
    group: G,
    label: ["Describe the picture", "Describe la imagen"],
    dims: ["prod", "mean"],
    dim: "prod",
    minGrade: 0,
    maxGrade: 8,
    domain: "speaking",
    mode: "speak",
    scope: "word",
    make(c) {
      const w = c.word;
      if (!visualOf(w)) return null;
      return speakItem(c, {
        ...wordExtras(c),
        visual: w.id,
        prompt: `Look at the picture. Say what you see, and use the word “${w.hw}”.`,
        stem: `Describe the picture with “${w.hw}”.`,
        checklist: ["I said what I see.", `I used “${w.hw}”.`, "I added a detail: who, where, or why."],
        model: w.visual.alt,
        modelLabel: "What the picture shows",
        explain: `The picture shows ${lcFirst(noDot(w.visual.alt))} “${w.hw}” means: ${w.def}`,
        hint: w.frame ? `You can start with: ${w.frame}` : "Say who or what is in the picture. Then say what is happening.",
      });
    },
  },
  {
    id: "oral-cloze",
    group: G,
    label: ["Say the sentence", "Di la oración"],
    dims: ["ctx", "prod"],
    dim: "ctx",
    minGrade: 0,
    maxGrade: 12,
    domain: "speaking",
    mode: "speak",
    cloze: true,
    scope: "word",
    make(c) {
      const w = c.word;
      const cl = w.cloze2?.s && w.cloze2.f ? w.cloze2 : w.cloze;
      if (!cl?.s || !cl.f) return null;
      return speakItem(c, {
        prompt: "Say the whole sentence out loud. Say the word that fits the blank.",
        stem: cl.s,
        speak: cl.s.replace("___", "blank"),
        checklist: ["I read the sentence out loud.", "I said a word for the blank.", "I checked that the sentence makes sense."],
        model: filled(cl),
        modelSafe: false,
        modelLabel: "The sentence with the word",
        explain: `“${cl.f}” fits: it means ${lcFirst(noDot(w.def))}`,
        hint: "Read the clue words in the sentence. Which word from the lesson matches them?",
      });
    },
  },
  {
    id: "read-extend",
    group: G,
    label: ["Read it, then say your own", "Léela y di la tuya"],
    dims: ["prod"],
    dim: "prod",
    minGrade: 0,
    maxGrade: 12,
    domain: "speaking",
    mode: "speak",
    scope: "word",
    make(c) {
      const w = c.word;
      if (!w.ex) return null;
      return speakItem(c, {
        prompt: `Read the sentence out loud. Then say a new sentence of your own with “${w.hw}”.`,
        stem: w.ex,
        hl: [w.hw],
        speak: w.ex,
        checklist: ["I read the sentence clearly.", `I said a new sentence with “${w.hw}”.`, "My new sentence was about something different."],
        explain: `“${w.hw}” means: ${w.def}`,
        hint: w.frame ? `You can start with: ${w.frame}` : "Change who or where. Keep the word.",
      });
    },
  },
  {
    id: "explain-in-context",
    group: G,
    label: ["Explain why it fits", "Explica por qué encaja"],
    dims: ["ctx", "prod"],
    dim: "ctx",
    minGrade: 2,
    maxGrade: 12,
    domain: "speaking",
    mode: "speak",
    scope: "word",
    make(c) {
      const w = c.word;
      const s = w.ex2 || w.ex;
      if (!s) return null;
      return speakItem(c, {
        prompt: `Read the sentence. Tell a partner, or record yourself: why does “${w.hw}” fit here?`,
        stem: s,
        hl: [w.hw],
        speak: s,
        checklist: [`I said what “${w.hw}” means in this sentence.`, "I pointed to a clue in the sentence.", "I gave a reason."],
        model: w.def,
        modelLabel: "The meaning",
        explain: `“${w.hw}” means: ${w.def}`,
        hint: "Start with: “The clue is …, so the word means …”.",
      });
    },
  },
  {
    id: "conversation-use",
    group: G,
    label: ["Partner conversation", "Conversación en pareja"],
    dims: ["prod"],
    dim: "prod",
    minGrade: 0,
    maxGrade: 12,
    domain: "speaking",
    mode: "speak",
    scope: "unit",
    make(c) {
      const oral = c.unit.wida?.oral;
      if (!oral) return [];
      const hit = unitWordsIn(c, oral);
      return [
        speakItem({ ...c, key: 0 }, {
          wordId: null,
          wordIds: c.words.map((w) => w.id),
          partner: true,
          prompt: "Do this with a partner. Take turns.",
          stem: oral,
          checklist: ["I took my turn and spoke.", "I used a word from this lesson.", "I listened to my partner and answered.", "We explained why."],
          explain: "Strong partner talk uses lesson words in ways that fit and gives reasons.",
          hint: "Start with a frame: “I think … because …”.",
          focusWords: hit.map((w) => w.hw),
        }),
      ];
    },
  },
];
