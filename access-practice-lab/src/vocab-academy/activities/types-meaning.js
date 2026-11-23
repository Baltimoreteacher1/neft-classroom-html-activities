// Meaning & recognition activities: definitions, pictures, examples, context choice, sorting, misuse.
import {
  capFirst,
  defsOf,
  fitForm,
  formIn,
  groupIndex,
  hasForm,
  item,
  lcFirst,
  maskWord,
  mc,
  nearWords,
  noDot,
  place,
  relHint,
  visualOf,
  wordExtras,
} from "./core.js";

const G = "meaning";
const NEG = /\bnot\b|n't|\bnever\b|opposite|\bno\b/i;
const sameFormFits = (c, near, target, surface) =>
  near.map((x) => fitForm(x, target, surface)).filter(Boolean);

/** Split n words into sets of size ~k, as even as possible. */
function chunk(list, k) {
  const sets = Math.max(1, Math.round(list.length / k));
  const out = Array.from({ length: sets }, () => []);
  list.forEach((x, i) => out[i % sets].push(x));
  return out;
}

export const MEANING_TYPES = [
  {
    id: "meaning-mc",
    group: G,
    label: ["Choose the meaning", "Elige el significado"],
    dims: ["mean", "rec"],
    dim: "mean",
    minGrade: 0,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      return mc(c, {
        prompt: "Choose the meaning.",
        stem: `What does “${w.hw}” mean?`,
        correct: w.def,
        wrongs: defsOf(nearWords(c, w).slice(0, c.n + 2)),
        explain: `“${w.hw}” means: ${w.def}`,
        hint:
          relHint(w) ||
          "Say each meaning in your own words, then pick the one that fits the word best.",
        speak: `What does ${w.hw} mean?`,
      });
    },
  },
  {
    id: "word-for-def",
    group: G,
    label: ["Which word fits?", "¿Qué palabra encaja?"],
    dims: ["rec", "mean"],
    dim: "rec",
    minGrade: 0,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      return mc(c, {
        prompt: "Which word matches this meaning?",
        stem: w.def,
        correct: w.hw,
        wrongs: nearWords(c, w).map((x) => x.hw),
        explain: `“${w.hw}” means: ${w.def}`,
        hint:
          relHint(w) ||
          "Say the meaning in your own words, then think of a word that could replace it.",
        speak: w.def,
      });
    },
  },
  {
    id: "match-def",
    group: G,
    label: ["Match words to meanings", "Une palabras y significados"],
    dims: ["mean", "rec"],
    dim: "mean",
    minGrade: 0,
    maxGrade: 12,
    domain: "reading",
    mode: "match",
    scope: "unit",
    make(c) {
      const order = c.rng.shuffle(c.words.filter((w) => w.def));
      const k = c.early ? 3 : 4;
      if (order.length < 3) return [];
      return chunk(order, k).map((set, s) => {
        const lefts = set.map((w) => w.hw);
        const extra = nearWords(c, set[0]).find((x) => !set.includes(x) && x.def);
        const rights = c.rng.shuffle([...set.map((w) => w.def), ...(extra ? [extra.def] : [])]);
        return item(
          { ...c, key: s },
          {
            prompt: "Match each word to its meaning.",
            stem: `Match these words: ${lefts.join(", ")}.`,
            items: lefts.map((t) => ({ t })),
            choices: rights,
            answer: set.map((w) => rights.indexOf(w.def)),
            wordIds: set.map((w) => w.id),
            explain: set.map((w) => `“${w.hw}”: ${w.def}`).join("  "),
            hint: "Start with the word you know best. Say its meaning, then look for it on the right.",
            speak: `Match these words: ${lefts.join(", ")}.`,
          },
        );
      });
    },
  },
  {
    id: "match-image",
    group: G,
    label: ["Match word and picture", "Une palabra e imagen"],
    dims: ["rec"],
    dim: "rec",
    minGrade: 0,
    maxGrade: 8,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      if (!visualOf(w)) return null;
      const pics = [w, ...nearWords(c, w).filter(visualOf)].slice(0, c.n + 2);
      if (c.early) {
        // Picture-forward: hear/see the word, choose the picture.
        const p = place(
          c.rng,
          w.visual.alt,
          pics.slice(1).map((x) => x.visual.alt),
          c.n,
        );
        if (!p) return null;
        const choiceWords = p.choices.map((alt) => pics.find((x) => x.visual.alt === alt).id);
        return item(c, {
          ...wordExtras(c),
          prompt: "Find the picture that goes with this word.",
          stem: `Find the picture for “${w.hw}”.`,
          ...p,
          choiceWords,
          explain: `“${w.hw}”: ${w.visual.alt}`,
          hint: "Say the word. Think about what you would see.",
          speak: w.hw,
        });
      }
      return mc(c, {
        prompt: "Which word goes with this picture?",
        stem: `Picture ${c.seq}`,
        visual: w.id,
        correct: w.hw,
        wrongs: pics.slice(1).map((x) => x.hw),
        explain: `The picture shows ${lcFirst(noDot(w.visual.alt))}. That goes with “${w.hw}”: ${w.def}`,
        hint:
          relHint(w) ||
          "Look at what is happening in the picture, then think about which meaning it shows.",
      });
    },
  },
  {
    id: "identify-example",
    group: G,
    label: ["Find an example", "Encuentra un ejemplo"],
    dims: ["mean", "ctx"],
    dim: "mean",
    minGrade: 0,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      if (!w.ex || !w.misuse?.s) return null;
      const others = nearWords(c, w, { far: true });
      const wrongs = [
        maskWord(w.misuse.s, w),
        ...others.map((x) => (x.ex ? maskWord(x.ex, x) : null)).filter(Boolean),
      ];
      const correct = maskWord(w.ex, w);
      if (correct === w.ex) return null;
      return mc(c, {
        prompt: "Which sentence is a good example? The blank is the word.",
        stem: `Which situation is an example of “${w.hw}”?`,
        correct,
        wrongs,
        explain: `“${w.hw}” means: ${w.def} In the sentence that fits, ${lcFirst(noDot(w.ex))}.`,
        hint:
          relHint(w) || "Put the word in the blank and ask: does the whole sentence make sense?",
      });
    },
  },
  {
    id: "identify-nonexample",
    group: G,
    label: ["Find a non-example", "Encuentra un no ejemplo"],
    dims: ["mean", "ctx"],
    dim: "mean",
    minGrade: 0,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      const non = w.nonExample && !NEG.test(w.nonExample) ? w.nonExample : w.misuse?.s;
      if (!non) return null;
      const okSentences = [
        w.ex,
        w.ex2,
        w.cloze?.s && w.cloze.f ? w.cloze.s.replace("___", w.cloze.f) : null,
        w.cloze2?.s && w.cloze2.f ? w.cloze2.s.replace("___", w.cloze2.f) : null,
      ]
        .filter(Boolean)
        .map((s) => maskWord(s, w));
      return mc(c, {
        prompt: "Which one does NOT show the word's meaning? The blank is the word.",
        stem: `Which does NOT show “${w.hw}”?`,
        correct: maskWord(non, w),
        wrongs: okSentences,
        explain: `“${w.hw}” means: ${w.def} ${w.misuse?.why || ""}`.trim(),
        hint: "Three of these show the word. Say the word in the blank and listen for the one that sounds wrong.",
      });
    },
  },
  {
    id: "context-mc",
    group: G,
    label: ["Complete the sentence", "Completa la oración"],
    dims: ["ctx"],
    dim: "ctx",
    minGrade: 0,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    cloze: true,
    scope: "word",
    make(c) {
      const w = c.word;
      const out = [];
      [w.cloze, w.cloze2].forEach((cl, k) => {
        if (!cl?.s || !cl.f) return;
        const near = nearWords(c, w);
        const r = mc(
          { ...c, key: `${c.key}${k ? "b" : "a"}` },
          {
            prompt: "Choose the word that best completes the sentence.",
            stem: cl.s,
            correct: cl.f,
            wrongs: sameFormFits(c, near, w, cl.f),
            explain: `“${cl.f}” fits: it means ${lcFirst(noDot(w.def))}. The clue in the sentence points to that meaning.`,
            hint: `Look for the clue words in the sentence. ${relHint(w)}`.trim(),
            speak: cl.s.replace("___", "blank"),
          },
        );
        if (r) out.push(r);
      });
      return out;
    },
  },
  {
    id: "word-sort",
    group: G,
    label: ["Sort the words", "Clasifica las palabras"],
    dims: ["mean"],
    dim: "mean",
    minGrade: 0,
    maxGrade: 12,
    domain: "reading",
    mode: "sort",
    scope: "unit",
    make(c) {
      const groups = (c.unit.relations?.groups || [])
        .map((g) => ({
          ...g,
          words: g.ids.map((id) => c.words.find((w) => w.id === id)).filter(Boolean),
        }))
        .filter((g) => g.words.length >= 2);
      if (groups.length < 2) return [];
      const chosen = c.rng.shuffle(groups).slice(0, c.early ? 2 : 3);
      const per = c.early ? 2 : 3;
      const items = [];
      chosen.forEach((g, gi) =>
        c.rng
          .shuffle(g.words)
          .slice(0, per)
          .forEach((w) => items.push({ t: w.hw, a: gi, id: w.id })),
      );
      const shuffled = c.rng.shuffle(items);
      return [
        item(
          { ...c, key: 0 },
          {
            prompt: "Put each word in the group where it belongs.",
            stem: `Sort these words: ${shuffled.map((x) => x.t).join(", ")}.`,
            items: shuffled.map(({ t, a }) => ({ t, a })),
            choices: chosen.map((g) => g.label),
            answer: shuffled.map((x) => x.a),
            wordIds: shuffled.map((x) => x.id),
            explain: chosen
              .map(
                (g) =>
                  `${capFirst(g.label)}: ${g.words
                    .filter((w) => shuffled.some((s) => s.id === w.id))
                    .map((w) => w.hw)
                    .join(", ")}.`,
              )
              .join("  "),
            hint: "Think about what each word describes a person doing or being. Which group name fits that?",
          },
        ),
      ];
    },
  },
  {
    id: "semantic-category",
    group: G,
    label: ["Which group?", "¿A qué grupo pertenece?"],
    dims: ["mean"],
    dim: "mean",
    minGrade: 0,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      const groups = c.unit.relations?.groups || [];
      const gi = groupIndex(c.unit, w);
      if (gi < 0 || groups.length < 2) return null;
      return mc(c, {
        prompt: "Which group does this word belong to?",
        stem: `Where does “${w.hw}” belong?`,
        correct: groups[gi].label,
        wrongs: groups.filter((_, i) => i !== gi).map((g) => g.label),
        minWrong: 1,
        explain: `“${w.hw}” (${lcFirst(noDot(w.def))}) belongs with words ${groups[gi].label}.`,
        hint: "Say what the word means, then pick the group whose name describes that meaning.",
      });
    },
  },
  {
    id: "best-word",
    group: G,
    label: ["Choose the best word", "Elige la mejor palabra"],
    dims: ["ctx", "mean"],
    dim: "ctx",
    minGrade: 0,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    cloze: true,
    scope: "word",
    make(c) {
      const w = c.word;
      const src = [w.ex, w.ex2].find((s) => s && hasForm(s, w));
      if (!src) return null;
      const stem = maskWord(src, w);
      const surface = formIn(src, w) || w.hw;
      return mc(c, {
        prompt: "Choose the best word for this sentence.",
        stem,
        correct: surface,
        wrongs: sameFormFits(c, nearWords(c, w), w, surface),
        explain: `“${surface}” is the best fit. It means ${lcFirst(noDot(w.def))}`,
        hint: "Several words may almost fit. Pick the one that matches everything the sentence tells you.",
        speak: stem.replace("___", "blank"),
      });
    },
  },
  {
    id: "detect-misuse",
    group: G,
    label: ["Spot the wrong use", "Encuentra el uso incorrecto"],
    dims: ["ctx", "mean"],
    dim: "ctx",
    minGrade: 0,
    maxGrade: 12,
    domain: "reading",
    mode: "steps",
    scope: "word",
    make(c) {
      const w = c.word;
      if (!w.misuse?.s) return null;
      const good = [
        w.ex,
        w.ex2,
        w.cloze?.s && w.cloze.f ? w.cloze.s.replace("___", w.cloze.f) : null,
      ].filter((s) => s && s !== w.misuse.s);
      if (good.length < 2) return null;
      const sentences = c.rng.shuffle([w.misuse.s, ...good.slice(0, 2)]);
      const first = {
        prompt: `One sentence uses “${w.hw}” the wrong way. Which one?`,
        choices: sentences,
        answer: sentences.indexOf(w.misuse.s),
      };
      const stem = `Find the wrong use of “${w.hw}”.`;
      const common = {
        ...wordExtras(c),
        stem,
        explain: `${w.misuse.why} “${w.hw}” means: ${w.def}`,
        hint: relHint(w) || `Which sentence does not match what “${w.hw}” means?`,
        speak: `${stem} ${sentences.map((s, i) => `Sentence ${i + 1}. ${s}`).join(" ")}`,
      };
      if (c.early)
        return item(c, {
          ...common,
          mode: "choice",
          prompt: first.prompt,
          choices: first.choices,
          answer: first.answer,
        });
      const others = nearWords(c, w);
      const whyRight = w.misuse.why;
      const swaps = others
        .filter((x) => x.def)
        .slice(0, c.n)
        .map((x) => `The writer uses “${w.hw}” to mean “${lcFirst(noDot(x.def))}”.`);
      const masked = others
        .filter((x) => x.misuse?.why)
        .map((x) => capFirst(maskWord(x.misuse.why, x, "this word")));
      const p = place(
        c.rng,
        whyRight,
        [swaps[0], masked[0], swaps[1], masked[1]].filter(Boolean),
        c.n,
      );
      if (!p) return null;
      const second = { prompt: "Why is it wrong?", choices: p.choices, answer: p.answer };
      return item(c, {
        ...common,
        prompt: first.prompt,
        steps: [first, second],
        choices: first.choices,
        answer: [first.answer, second.answer],
      });
    },
  },
];
