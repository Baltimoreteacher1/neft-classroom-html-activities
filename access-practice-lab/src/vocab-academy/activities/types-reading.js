// Reading activities built on the unit passage: contextual meaning, comprehension questions, evidence selection,
// vocabulary in literary and informational text, and meaning across units of the same grade.
import { countWords, defsOf, formIn, hasForm, isOpposite, isSynonymish, item, lcFirst, mc, nearWords, noDot, place, splitSentences, wordExtras } from "./core.js";

const G = "reading";
const LITERARY = new Set(["narrative", "dialogue", "poem", "description"]);
const NO_SHUFFLE = /of the above|both a|none of|all of/i;

const sentencesOf = (c) => (c.unit.passage?.paras || []).flatMap(splitSentences);
const passageOf = (c) => {
  const p = c.unit.passage;
  return p ? { title: p.title, genre: p.genre, paras: p.paras, listenOnly: Boolean(p.listenOnly) } : null;
};
const inPassage = (c) => {
  const ids = new Set(c.unit.passage?.words || []);
  return c.words.filter((w) => ids.has(w.id));
};
const sentenceWith = (c, w) => sentencesOf(c).find((s) => hasForm(s, w) && countWords(s) <= 42);

function contextItem(c, tpl) {
  const w = c.word;
  const s = sentenceWith(c, w);
  if (!s) return null;
  return mc(c, {
    prompt: tpl.prompt(w, c.unit.passage),
    stem: s,
    hl: [formIn(s, w)],
    passage: tpl.showPassage ? passageOf(c) : undefined,
    correct: w.def,
    wrongs: defsOf(nearWords(c, w).slice(0, c.n + 2)),
    explain: tpl.explain(w),
    hint: "Reread the sentence before and after it. What clues does the author give?",
    speak: s,
  });
}
const inGenre = (set, yes) => (c) => (yes === set.has(c.unit.passage?.genre) ? true : false);

export const READING_TYPES = [
  {
    id: "contextual-interpretation",
    group: G,
    label: ["Meaning in the passage", "Significado en el texto"],
    dims: ["ctx"],
    dim: "ctx",
    minGrade: 2,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      if (!c.unit.passage?.words?.includes(c.word.id)) return null;
      return contextItem(c, {
        prompt: (w, p) => `What does “${w.hw}” mean in this sentence from “${p.title}”?`,
        explain: (w) => `In this sentence “${w.hw}” means: ${w.def}`,
      });
    },
  },
  {
    id: "passage-comprehension",
    group: G,
    label: ["Passage questions", "Preguntas del texto"],
    dims: ["ctx"],
    dim: "ctx",
    minGrade: 0,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "unit",
    make(c) {
      const p = c.unit.passage;
      return (p?.qs || [])
        .map((q, k) => {
          const text = q.choices[q.a];
          const fixed = q.choices.some((x) => NO_SHUFFLE.test(x));
          const choices = fixed ? q.choices : c.rng.shuffle(q.choices);
          const hit = c.words.filter((w) => hasForm(q.q, w));
          return item({ ...c, key: q.id || k }, {
            wordId: hit[0]?.id ?? null,
            wordIds: hit.map((w) => w.id),
            prompt: c.early ? "Listen to the story, then answer." : "Read the passage, then answer the question.",
            stem: q.q,
            passage: passageOf(c),
            choices: c.early ? choices.slice(0, 3).includes(text) ? choices.slice(0, 3) : [text, ...choices.filter((x) => x !== text).slice(0, 2)] : choices,
            answer: 0,
            skill: q.skill,
            explain: q.why,
            hint: q.skill === "word-meaning" ? "Find the word in the passage and read the sentences around it." : "Go back to the passage. Which sentence helps you answer?",
            speak: q.q,
          });
        })
        .map((it) => {
          const q = p.qs.find((x) => (x.id || null) === it.id.split(":").pop()) || p.qs[Number(it.id.split(":").pop())];
          const text = q.choices[q.a];
          it.answer = it.choices.indexOf(text);
          return it;
        });
    },
  },
  {
    id: "evidence-select",
    group: G,
    label: ["Find the evidence", "Encuentra la evidencia"],
    dims: ["ctx"],
    dim: "ctx",
    minGrade: 2,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      const all = sentencesOf(c).filter((s) => countWords(s) <= 42);
      const proof = sentenceWith(c, w);
      if (!proof || all.length < 4) return null;
      const withOther = all.filter((s) => s !== proof && !hasForm(s, w) && c.words.some((x) => x !== w && hasForm(s, x)));
      const rest = all.filter((s) => s !== proof && !hasForm(s, w) && !withOther.includes(s));
      return mc(c, {
        prompt: "Tap the sentence from the passage that shows this meaning.",
        stem: w.def,
        passage: passageOf(c),
        correct: proof,
        wrongs: [...c.rng.shuffle(withOther), ...c.rng.shuffle(rest)],
        explain: `This sentence is evidence: it shows someone or something that fits “${lcFirst(noDot(w.def))}”.`,
        hint: "Read each sentence and ask: does this show the meaning, or is it about something else?",
        choiceStyle: "sentences",
      });
    },
  },
  {
    id: "vocab-literary",
    group: G,
    label: ["Word choice in a story or poem", "Elección de palabras en un cuento o poema"],
    dims: ["ctx"],
    dim: "ctx",
    minGrade: 3,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      if (!inGenre(LITERARY, true)(c) || !c.unit.passage?.words?.includes(c.word.id)) return null;
      return contextItem(c, {
        prompt: (w) => `A writer chose “${w.hw}” to show something about a character or moment. What does the word tell you?`,
        explain: (w) => `By choosing “${w.hw}” the writer shows this: ${w.def}`,
      });
    },
  },
  {
    id: "vocab-informational",
    group: G,
    label: ["Words in informational text", "Palabras en textos informativos"],
    dims: ["ctx"],
    dim: "ctx",
    minGrade: 3,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      if (!inGenre(LITERARY, false)(c) || !c.unit.passage?.words?.includes(c.word.id)) return null;
      return contextItem(c, {
        prompt: (w) => `The writer uses “${w.hw}” to explain an idea. What does it mean in this text?`,
        explain: (w) => `In this text “${w.hw}” means: ${w.def}`,
      });
    },
  },
  {
    id: "meaning-across-passages",
    group: G,
    label: ["Compare words across lessons", "Compara palabras entre lecciones"],
    dims: ["mean", "ctx"],
    dim: "mean",
    minGrade: 3,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      const here = new Set(c.words.map((x) => x.id));
      const other = (c.ctx.pool || []).find((x) => !here.has(x.id) && (isOpposite(x, w) || isSynonymish(x, w)));
      if (!other) return null;
      const same = !isOpposite(other, w);
      const right = same ? "They mean almost the same." : "They mean the opposite.";
      return mc(c, {
        wordIds: [w.id],
        prompt: `“${other.hw}” is from another lesson in this grade. How does it compare to “${w.hw}”?`,
        stem: `Compare “${w.hw}” (this lesson) and “${other.hw}” (another lesson).`,
        correct: right,
        wrongs: ["They mean almost the same.", "They mean the opposite.", "They have no clear connection.", "One is a bigger group that includes the other."].filter((x) => x !== right),
        explain: `${right} “${w.hw}” means: ${w.def} “${other.hw}” means: ${other.def}`,
        hint: "Read both meanings. Would swapping one word for the other keep the idea, flip it, or change the topic?",
      });
    },
  },
];
export { place, wordExtras };
