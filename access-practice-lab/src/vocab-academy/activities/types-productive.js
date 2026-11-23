// Productive activities: typed cloze, sentence creation, combining, expanding, rewriting, short and extended
// response, discussion, oral explanation and argumentation. Written checks are rule-based and transparent
// (see writing.js): they never claim to grade meaning, and every response is saved for teacher review.
import { byBand, speakItem, targets, unitWordsIn, writeItem } from "./build.js";
import { countWords, fitForm, item, nearWords, noDot, lcFirst, wordExtras } from "./core.js";

const G = "productive";
const GENERIC = { adj: ["nice", "good", "bad", "okay"], adv: ["very", "really"], n: ["thing", "stuff"] };
const spec = (c, over) => ({ ...over });

export const PRODUCTIVE_TYPES = [
  {
    id: "sentence-complete",
    group: G,
    label: ["Complete the sentence (type)", "Completa la oración (escribe)"],
    dims: ["prod", "ctx"],
    dim: "prod",
    minGrade: 0,
    maxGrade: 12,
    domain: "writing",
    mode: "typed",
    cloze: true,
    scope: "word",
    make(c) {
      const w = c.word;
      const cl = (c.early ? w.cloze : w.cloze2 || w.cloze) || null;
      if (!cl?.s || !cl.f) return null;
      const bankWrongs = nearWords(c, w).map((x) => fitForm(x, w, cl.f)).filter(Boolean);
      const bank = c.rng.shuffle([cl.f, ...[...new Set(bankWrongs)].slice(0, c.early ? 2 : 5)]);
      const near = [w.hw, ...(w.family || []).map((x) => x.w)].filter((x) => x.toLowerCase() !== cl.f.toLowerCase());
      return item(c, {
        ...wordExtras(c),
        prompt: c.early ? "Tap the word that fits the blank." : "Type the missing word.",
        stem: cl.s,
        answer: [cl.f],
        near,
        bank,
        directions: ["Read the sentence.", c.early ? "Tap the word that fits." : "Type the word that fits the blank.", "Check your answer."],
        explain: `“${cl.f}” fits: it means ${lcFirst(noDot(w.def))}`,
        hint: `The word starts with “${cl.f[0]}” and has ${cl.f.length} letters.`,
        speak: cl.s.replace("___", "blank"),
      });
    },
  },
  {
    id: "sentence-create",
    group: G,
    label: ["Write your own sentence", "Escribe tu propia oración"],
    dims: ["prod"],
    dim: "prod",
    minGrade: 3,
    maxGrade: 12,
    domain: "writing",
    mode: "write",
    scope: "word",
    make(c) {
      const w = c.word;
      const prompts = c.unit.produce?.sentences || [];
      const claimed = new Set();
      const mine = prompts.find((p, i) => {
        const hit = unitWordsIn(c, p);
        const first = hit[0];
        if (first?.id === w.id && !claimed.has(i)) {
          claimed.add(i);
          return true;
        }
        return false;
      });
      const hit = mine ? unitWordsIn(c, mine) : [w];
      return writeItem(c, {
        prompt: "Write a sentence that shows you know what the word means. Add a detail.",
        stem: mine || `Write your own sentence using “${w.hw}”.`,
        targets: targets(hit),
        spec: spec(c, { minWords: byBand(c, [6, 8, 10]), link: true }),
        model: w.ex2 || w.ex,
        modelLabel: "Another sentence with the word",
        explain: `“${w.hw}” means: ${w.def}`,
        hint: w.frame ? `Try this frame, then make it your own: ${w.frame}` : `Think of a person or place that shows “${w.hw}”. What do they do?`,
      });
    },
  },
  {
    id: "sentence-combine",
    group: G,
    label: ["Combine sentences", "Combina oraciones"],
    dims: ["prod"],
    dim: "prod",
    minGrade: 3,
    maxGrade: 12,
    domain: "writing",
    mode: "write",
    scope: "unit",
    make(c) {
      return (c.unit.produce?.combine || []).map((cb, k) => {
        const used = unitWordsIn(c, cb.model || "");
        const w = used[0];
        return writeItem({ ...c, key: k }, {
          word: w,
          wordId: w?.id ?? null,
          wordIds: used.map((x) => x.id),
          prompt: `Write ONE sentence that keeps every idea.${w ? ` Use the word “${w.hw}”.` : ""}`,
          stem: cb.given.join(" "),
          given: cb.given,
          directions: ["Read the short sentences.", "Pick a joining word such as because, so, but, while, or when.", "Write one sentence with all the ideas."],
          targets: targets(used.slice(0, 1)),
          spec: spec(c, { minWords: byBand(c, [6, 8, 10]), given: cb.given, single: true }),
          model: cb.model,
          modelLabel: "One way to combine them",
          explain: `One way to combine them: ${cb.model}`,
          hint: "Which idea is the main one? Which idea explains it? A joining word like because or so can link them.",
        });
      });
    },
  },
  {
    id: "sentence-expand",
    group: G,
    label: ["Expand a sentence", "Amplía una oración"],
    dims: ["prod"],
    dim: "prod",
    minGrade: 3,
    maxGrade: 12,
    domain: "writing",
    mode: "write",
    scope: "word",
    make(c) {
      const w = c.word;
      const base = w.ex;
      if (!base) return null;
      return writeItem(c, {
        prompt: "Make this sentence longer. Add details: who, when, where, or why. Keep the word.",
        stem: base,
        hl: [w.hw],
        askMore: ["Who?", "When?", "Where?", "Why?"],
        targets: targets([w]),
        spec: spec(c, { minWords: countWords(base) + 2, gain: byBand(c, [4, 5, 6]), baseWords: countWords(base) }),
        explain: `Details answer questions the reader may have. “${w.hw}” means: ${w.def}`,
        hint: "Pick one question word. Write what the answer is and add it to the sentence.",
      });
    },
  },
  {
    id: "rewrite-precise",
    group: G,
    label: ["Rewrite with a precise word", "Reescribe con una palabra precisa"],
    dims: ["prod", "ctx"],
    dim: "prod",
    minGrade: 3,
    maxGrade: 12,
    domain: "writing",
    mode: "write",
    scope: "word",
    make(c) {
      const w = c.word;
      const cl = w.cloze;
      const vague = GENERIC[w.pos];
      if (!vague || !cl?.s || cl.f?.toLowerCase() !== w.hw.toLowerCase()) return null;
      const g = vague[c.rng.int(vague.length)];
      const stem = cl.s.replace(/\ban ___/, "a ___").replace("___", g);
      return writeItem(c, {
        prompt: `Rewrite the sentence. Replace “${g}” with a more exact word from this lesson.`,
        stem,
        targets: c.words.length ? [{ id: w.id, hw: w.hw, re: targets([w], { syn: true })[0].re }] : [],
        spec: spec(c, { minWords: countWords(stem) - 1, generic: g, hideTarget: true }),
        model: cl.s.replace("___", w.hw),
        modelSafe: false,
        modelLabel: "A more exact version",
        explain: `“${w.hw}” says it more exactly: ${lcFirst(noDot(w.def))}`,
        hint: `The sentence gives a clue about what is happening. Which word from this lesson describes it exactly?`,
      });
    },
  },
  {
    id: "short-response",
    group: G,
    label: ["Short written response", "Respuesta escrita corta"],
    dims: ["prod", "ctx"],
    dim: "prod",
    minGrade: 3,
    maxGrade: 12,
    domain: "writing",
    mode: "write",
    scope: "unit",
    make(c) {
      const rows = (c.unit.check?.constructed || []).map((q) => ({
        id: q.id,
        prompt: q.prompt,
        words: (q.wordIds || []).map((id) => c.words.find((w) => w.id === id)).filter(Boolean),
        look: q.look,
        model: q.model,
      }));
      if (c.unit.produce?.explain) rows.push({ id: "explain", prompt: c.unit.produce.explain, words: unitWordsIn(c, c.unit.produce.explain), look: ["uses the word correctly", "gives an example", "explains the difference"] });
      return rows.map((r, k) =>
        writeItem({ ...c, key: r.id || k }, {
          word: r.words[0],
          wordId: r.words[0]?.id ?? null,
          wordIds: r.words.map((x) => x.id),
          prompt: "Write a short response. Use the words from the prompt.",
          stem: r.prompt,
          selfCheck: r.look || [],
          targets: targets(r.words),
          spec: spec(c, { minWords: byBand(c, [12, 18, 25]), reason: false }),
          model: r.model,
          modelLabel: "A strong answer",
          explain: r.model ? `A strong answer: ${r.model}` : "Check your answer against the list of what a strong answer shows.",
          hint: "Plan first: which words must you use, and what example proves each one?",
        }),
      );
    },
  },
  {
    id: "paragraph-response",
    group: G,
    label: ["Write a paragraph", "Escribe un párrafo"],
    dims: ["prod"],
    dim: "prod",
    minGrade: 4,
    maxGrade: 12,
    domain: "writing",
    mode: "write",
    scope: "unit",
    make(c) {
      const wr = c.unit.passage?.write;
      if (!wr?.prompt) return [];
      const need = Number((wr.prompt.match(/at least (\d+|two|three|four|five)/i) || [])[1]) || 0;
      const k = { two: 2, three: 3, four: 4, five: 5 }[String(need).toLowerCase()] || need || 2;
      return [
        writeItem({ ...c, key: 0 }, {
          wordId: null,
          wordIds: [],
          pool: true,
          prompt: `Write a paragraph. Use at least ${k} words from this lesson.`,
          stem: wr.prompt,
          frame: wr.frame,
          frames: [wr.frame, ...(c.unit.wida?.frames || [])].filter(Boolean),
          targets: targets(c.words),
          spec: spec(c, { minWords: byBand(c, [40, 60, 90]), minSentences: 3, minTargets: k }),
          model: null,
          explain: "Reread your paragraph. Does each lesson word show its real meaning?",
          hint: "Plan three sentences: what happened, what each person did, and what you learned.",
          organizer: ["Beginning", "Middle", "End"],
        }),
      ];
    },
  },
  {
    id: "discussion-prompt",
    group: G,
    label: ["Discussion prompt", "Tema de conversación"],
    dims: ["prod"],
    dim: "prod",
    minGrade: 0,
    maxGrade: 12,
    domain: "speaking",
    mode: "speak",
    scope: "unit",
    make(c) {
      return (c.unit.produce?.discuss || []).map((p, k) => {
        const hit = unitWordsIn(c, p);
        const suggest = hit.length ? hit : c.rng.shuffle(c.words).slice(0, 3);
        return speakItem({ ...c, key: k }, {
          word: hit[0],
          wordId: hit[0]?.id ?? null,
          wordIds: hit.map((x) => x.id),
          prompt: "Talk about this out loud with a partner, or record yourself.",
          stem: p,
          checklist: ["I answered the question out loud.", `I used a word from this lesson (for example ${suggest.map((x) => `“${x.hw}”`).join(", ")}).`, "I gave a reason or an example.", "I listened to a partner or to my recording."],
          explain: "Strong talk answers the question, uses lesson words in a way that fits, and gives a reason.",
          hint: "Start with a frame: “I think … because …”.",
        });
      });
    },
  },
  {
    id: "oral-explain",
    group: G,
    label: ["Explain it out loud", "Explícalo en voz alta"],
    dims: ["prod", "mean"],
    dim: "prod",
    minGrade: 0,
    maxGrade: 12,
    domain: "speaking",
    mode: "speak",
    scope: "word",
    make(c) {
      const w = c.word;
      return speakItem(c, {
        prompt: "Explain the word out loud to a partner, or record yourself.",
        stem: `Explain “${w.hw}” in your own words.`,
        checklist: ["I said what the word means in my own words.", "I gave an example.", `I used “${w.hw}” in a sentence.`],
        model: w.def,
        modelLabel: "The meaning",
        explain: `“${w.hw}” means: ${w.def}`,
        hint: w.frame ? `You can start with: ${w.frame}` : "Start with: “It means …”. Then say a time you might use it.",
      });
    },
  },
  {
    id: "argument-vocab",
    group: G,
    label: ["Vocabulary in argument", "Vocabulario en un argumento"],
    dims: ["prod", "ctx"],
    dim: "prod",
    minGrade: 3,
    maxGrade: 12,
    domain: "writing",
    mode: "write",
    scope: "unit",
    make(c) {
      const a = c.unit.produce?.argue;
      if (!a?.prompt) return [];
      return [
        writeItem({ ...c, key: 0 }, {
          wordId: null,
          wordIds: [],
          pool: true,
          prompt: "Take a side. Give a reason. Use at least one word from this lesson.",
          stem: a.prompt,
          frames: [a.frame, ...(c.unit.wida?.frames || [])].filter(Boolean),
          frame: a.frame,
          targets: targets(c.words),
          spec: spec(c, { minWords: byBand(c, [25, 35, 50]), minTargets: 1, reason: true, claim: true }),
          model: null,
          explain: "A strong argument states a claim, gives a reason that supports it, and uses precise words.",
          hint: "Say your claim in one sentence. Then add “because” and the reason that proves it.",
          organizer: ["Claim", "Reason", "Example"],
        }),
      ];
    },
  },
];
