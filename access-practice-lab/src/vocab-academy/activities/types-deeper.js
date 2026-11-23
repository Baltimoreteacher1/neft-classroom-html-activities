// Deeper-meaning activities: synonyms, antonyms, shades, multiple meanings, clues, relationships, analogies,
// precise word choice and meaning comparisons. Only data that exists is used: no invented synonym or antonym.
import {
  capFirst,
  defsOf,
  fitForm,
  formIn,
  groupIndex,
  hasForm,
  isOpposite,
  isSynonymish,
  item,
  lcFirst,
  maskWord,
  mc,
  nearWords,
  noDot,
  place,
  relHint,
  wordExtras,
} from "./core.js";

const G = "deeper";
const GENERIC = {
  adj: ["nice", "good", "bad", "okay"],
  adv: ["very", "really"],
  n: ["thing", "stuff"],
};

const pickOne = (rng, list) => (list.length ? list[rng.int(list.length)] : null);
/** Words from other unit words' lists that cannot also answer for `w`. */
function otherLists(c, w, field, skip) {
  const out = [];
  for (const x of c.pool) {
    if (x.id === w.id || skip(x)) continue;
    for (const s of x[field] || []) out.push(s);
  }
  return out;
}

export const DEEPER_TYPES = [
  {
    id: "synonym-mc",
    group: G,
    label: ["Same meaning", "Mismo significado"],
    dims: ["mean"],
    dim: "mean",
    minGrade: 1,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      if (!w.syn?.length) return null;
      const correct = pickOne(c.rng, w.syn);
      const avoid = new Set([w.hw, ...w.syn, ...(w.ant || [])].map((s) => s.toLowerCase()));
      const pool = otherLists(c, w, "syn", (x) => isOpposite(x, w) || isSynonymish(x, w)).filter(
        (s) => !avoid.has(s.toLowerCase()),
      );
      const wrongs = [...(w.ant || []), ...c.rng.shuffle(pool)];
      return mc(c, {
        prompt: "Choose the word that means almost the same.",
        stem: `Which word is closest in meaning to “${w.hw}”?`,
        correct,
        wrongs,
        explain: `“${correct}” and “${w.hw}” mean almost the same. “${w.hw}” means: ${w.def}`,
        hint: `Say what “${w.hw}” means, then ask which choice could replace it in a sentence.`,
      });
    },
  },
  {
    id: "antonym-mc",
    group: G,
    label: ["Opposite meaning", "Significado opuesto"],
    dims: ["mean"],
    dim: "mean",
    minGrade: 1,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      if (!w.ant?.length) return null;
      const correct = pickOne(c.rng, w.ant);
      const avoid = new Set([w.hw, ...w.ant].map((s) => s.toLowerCase()));
      const pool = otherLists(c, w, "syn", (x) => isOpposite(x, w)).filter(
        (s) => !avoid.has(s.toLowerCase()),
      );
      const wrongs = [...(w.syn || []), ...c.rng.shuffle(pool)];
      return mc(c, {
        prompt: "Choose the word that means the opposite.",
        stem: `Which word is the opposite of “${w.hw}”?`,
        correct,
        wrongs,
        explain: `“${correct}” is the opposite of “${w.hw}”. “${w.hw}” means: ${w.def}`,
        hint: `Think of someone who acts the other way from “${w.hw}”. ${relHint(w, "Hint: this word is about")}`.trim(),
      });
    },
  },
  {
    id: "shades",
    group: G,
    label: ["Shades of meaning", "Matices de significado"],
    dims: ["mean"],
    dim: "mean",
    minGrade: 0,
    maxGrade: 12,
    domain: "reading",
    mode: "order",
    scope: "unit",
    make(c) {
      const out = [];
      (c.unit.relations?.shades || []).forEach((s, k) => {
        const ladder = (s.ladder || []).filter(Boolean);
        if (ladder.length < 3) return;
        let order = c.rng.shuffle(ladder);
        if (order.join() === ladder.join()) order = [...order.slice(1), order[0]];
        const ids = ladder
          .map((hw) => c.words.find((w) => w.hw.toLowerCase() === hw.toLowerCase())?.id)
          .filter(Boolean);
        out.push(
          item(
            { ...c, key: k },
            {
              wordId: ids[0] ?? null,
              wordIds: ids,
              prompt: "Put the words in order from least to most.",
              stem: `Order the words: ${s.label}.`,
              choices: order,
              answer: ladder,
              ends: ["least", "most"],
              explain: `From least to most: ${ladder.join(" → ")}.`,
              hint: "Find the word at each end first. Then decide where the others fit in between.",
            },
          ),
        );
      });
      return out;
    },
  },
  {
    id: "multiple-meanings",
    group: G,
    label: ["More than one meaning", "Más de un significado"],
    dims: ["mean", "ctx"],
    dim: "mean",
    minGrade: 0,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      const senses = (w.senses || []).filter((s) => s.def && s.example);
      if (!senses.length) return [];
      const rows = [{ def: w.def, example: w.ex }, ...senses].filter((r) => r.example);
      return rows
        .map((r, k) => {
          const otherDefs = rows.filter((x) => x !== r).map((x) => x.def);
          return mc(
            { ...c, key: `${c.key}-${k}` },
            {
              prompt: `What does “${w.hw}” mean in this sentence?`,
              stem: r.example,
              hl: [w.hw],
              correct: r.def,
              wrongs: [...otherDefs, ...defsOf(nearWords(c, w).slice(0, c.n))],
              explain: `Here “${w.hw}” means: ${r.def}`,
              hint: "Read the whole sentence. Which meaning makes the sentence make sense?",
            },
          );
        })
        .filter(Boolean);
    },
  },
  {
    id: "context-clues",
    group: G,
    label: ["Use context clues", "Usa pistas del contexto"],
    dims: ["ctx"],
    dim: "ctx",
    minGrade: 2,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      const s = [w.ex2, w.ex].find((x) => x && hasForm(x, w));
      if (!s) return null;
      return mc(c, {
        prompt: `Use the clues around “${w.hw}”. What does it most likely mean here?`,
        stem: s,
        hl: [formIn(s, w)],
        correct: w.def,
        wrongs: defsOf(nearWords(c, w).slice(0, c.n + 2)),
        explain: `The words around “${w.hw}” are clues. They point to this meaning: ${w.def}`,
        hint: "Look at what happens before and after the word. What clues tell you what kind of word it is?",
      });
    },
  },
  {
    id: "word-relationships",
    group: G,
    label: ["How are they related?", "¿Cómo se relacionan?"],
    dims: ["mean"],
    dim: "mean",
    minGrade: 1,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      const rels = [];
      if (w.syn?.length) rels.push(["same", w.syn[0], "They mean almost the same."]);
      if (w.ant?.length) rels.push(["opp", w.ant[0], "They mean the opposite."]);
      const all = [
        "They mean almost the same.",
        "They mean the opposite.",
        "They have no clear connection.",
        "One is a bigger group that includes the other.",
      ];
      return rels
        .map(([kind, other, right]) =>
          mc(
            { ...c, key: `${c.key}${kind}` },
            {
              prompt: "How are these two words related?",
              stem: `How are “${w.hw}” and “${other}” related?`,
              correct: right,
              wrongs: all.filter((x) => x !== right),
              explain: `“${w.hw}” and “${other}”: ${right.toLowerCase()} “${w.hw}” means: ${w.def}`,
              hint: `Think of a sentence with “${w.hw}”. Does swapping in “${other}” keep the meaning, flip it, or change the topic?`,
            },
          ),
        )
        .filter(Boolean);
    },
  },
  {
    id: "analogy",
    group: G,
    label: ["Word analogies", "Analogías"],
    dims: ["mean"],
    dim: "mean",
    minGrade: 5,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "unit",
    make(c) {
      return (c.unit.relations?.analogies || [])
        .map((a, k) => {
          const hws = `${a.stem} ${a.a}`.toLowerCase();
          const ids = c.words
            .filter((w) => new RegExp(`\\b${w.hw.toLowerCase()}`).test(hws))
            .map((w) => w.id);
          const p = place(
            c.rng,
            a.a,
            (a.choices || []).filter((x) => x !== a.a),
            4,
          );
          if (!p) return null;
          return item(
            { ...c, key: k },
            {
              wordId: ids[0] ?? null,
              wordIds: ids,
              prompt: "Choose the pair that has the same relationship.",
              stem: `${a.stem}  is like  ___`,
              ...p,
              explain: `Both pairs show ${a.relation || "the same relationship"}: ${a.stem} and ${a.a}.`,
              hint: `First say how the words in “${a.stem}” are related. Then find the pair related the same way.`,
            },
          );
        })
        .filter(Boolean);
    },
  },
  {
    id: "precise-word",
    group: G,
    label: ["Choose the exact word", "Elige la palabra exacta"],
    dims: ["ctx", "mean"],
    dim: "ctx",
    minGrade: 3,
    maxGrade: 12,
    domain: "writing",
    mode: "choice",
    cloze: true,
    scope: "word",
    make(c) {
      const w = c.word;
      const vague = GENERIC[w.pos];
      const cl = w.cloze;
      if (!vague || !cl?.s || cl.f?.toLowerCase() !== w.hw.toLowerCase()) return null;
      const g = vague[c.rng.int(vague.length)];
      const stem = cl.s.replace(/\ban ___/, `a ___`).replace("___", g);
      const wrongs = nearWords(c, w, { far: true })
        .filter((x) => x.pos === w.pos)
        .map((x) => fitForm(x, w, cl.f));
      return mc(c, {
        prompt: `Which word can replace “${g}” to say it more exactly?`,
        stem,
        correct: w.hw,
        wrongs: wrongs.filter(Boolean),
        explain: `“${w.hw}” is more exact than “${g}”: it means ${lcFirst(noDot(w.def))}`,
        hint: `“${g}” is a general word. Which choice tells the reader exactly what the sentence shows?`,
      });
    },
  },
  {
    id: "compare-meanings",
    group: G,
    label: ["Compare two words", "Compara dos palabras"],
    dims: ["mean"],
    dim: "mean",
    minGrade: 3,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      const mate = nearWords(c, w).find(
        (x) => x.def && (groupIndex(c.unit, x) === groupIndex(c.unit, w) || isOpposite(x, w)),
      );
      const third = nearWords(c, w).find((x) => x.def && x !== mate && x.id !== w.id);
      if (!mate || !third || w.id > mate.id) return null;
      const line = (a, b) => `${a.hw}: ${a.def}\n${b.hw}: ${b.def}`;
      const swapped = `${w.hw}: ${mate.def}\n${mate.hw}: ${w.def}`;
      return mc(c, {
        wordIds: [w.id, mate.id],
        prompt: "Which pair of meanings is correct?",
        stem: `Compare “${w.hw}” and “${mate.hw}”.`,
        correct: line(w, mate),
        wrongs: [
          swapped,
          `${w.hw}: ${w.def}\n${mate.hw}: ${third.def}`,
          `${w.hw}: ${third.def}\n${mate.hw}: ${mate.def}`,
        ],
        explain: `${capFirst(w.hw)}: ${w.def} ${capFirst(mate.hw)}: ${mate.def}`,
        hint: "Decide the meaning of the word you know best first. The other pair then falls into place.",
      });
    },
  },
];
export { maskWord };
