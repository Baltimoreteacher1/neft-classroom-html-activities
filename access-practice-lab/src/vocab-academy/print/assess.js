// Vocabulary Academy print: the two parallel assessment forms (A and B) built from the unit's own JSON.
// Parallel means: the same words, the same three item types in the same order, different sentences and item order.
//   Part 1  choose the word that completes the sentence   (A: cloze,  B: cloze2)         every word
//   Part 2  is the word used correctly?                    (A and B take opposite sentences) every word
//   Part 3  meaning                                        (A: word -> meaning, B: meaning -> word) first half / second half
//   Part 4  one constructed response                       (A: check.constructed[0], B: [1])
import { rngFor } from "../rng.js";
import { bandInfo } from "./shared.js";

const surface = (w, which) => w[which]?.f ?? w.hw;

function wrongForms(words, w, which, n, rng) {
  const answer = surface(w, which).toLowerCase();
  const seen = new Set([answer]);
  const out = [];
  for (const o of rng.shuffle(words.filter((x) => x.id !== w.id))) {
    const f = surface(o, which);
    if (seen.has(f.toLowerCase())) continue;
    seen.add(f.toLowerCase());
    out.push(f);
    if (out.length === n) break;
  }
  return out;
}

function buildForm(unit, form) {
  const info = bandInfo(unit.grade);
  const rng = (tag) => rngFor(`${unit.id}:assess:${form}:${tag}`);
  const A = form === "A";
  const which = A ? "cloze" : "cloze2";
  const words = unit.words;
  const letters = info.letters.length;

  const p1rng = rng("p1");
  const part1 = p1rng.shuffle(words.filter((w) => w[which])).map((w, i) => {
    const choices = p1rng.shuffle([
      surface(w, which),
      ...wrongForms(words, w, which, letters - 1, p1rng),
    ]);
    return {
      n: i + 1,
      wordId: w.id,
      s: w[which].s,
      choices,
      key: {
        index: choices.indexOf(surface(w, which)),
        answer: surface(w, which),
        why: `${w.hw} means "${w.def.replace(/\.$/, "")}", which fits the clue in the sentence.`,
      },
    };
  });

  const p2rng = rng("p2");
  const order = p2rng.shuffle(words.filter((w) => w.misuse));
  const part2 = order.map((w, i) => {
    // A shows the incorrect sentence for even positions; B for odd positions, and a different correct sentence.
    const wrong = A ? i % 2 === 0 : i % 2 === 1;
    return {
      n: i + 1,
      wordId: w.id,
      hw: w.hw,
      s: wrong ? w.misuse.s : A ? (w.ex2 ?? w.ex) : w.ex,
      key: {
        wrong,
        why: wrong ? w.misuse.why : `Correct use. ${w.hw} means "${w.def.replace(/\.$/, "")}".`,
      },
    };
  });

  const half = Math.ceil(words.length / 2);
  const p3words = A ? words.slice(0, half) : words.slice(half);
  const p3rng = rng("p3");
  const part3 = (p3words.length ? p3words : words.slice(0, half)).map((w, i) => {
    if (A) {
      const wrong = p3rng
        .shuffle(words.filter((x) => x.id !== w.id))
        .slice(0, letters - 1)
        .map((x) => x.def);
      const choices = p3rng.shuffle([w.def, ...wrong]);
      return {
        n: i + 1,
        wordId: w.id,
        mode: "word-to-meaning",
        prompt: w.hw,
        pron: w.pron,
        choices,
        key: { index: choices.indexOf(w.def), answer: w.def, why: `${w.hw} means "${w.def}"` },
      };
    }
    const wrong = p3rng
      .shuffle(words.filter((x) => x.id !== w.id))
      .slice(0, letters - 1)
      .map((x) => x.hw);
    const choices = p3rng.shuffle([w.hw, ...wrong]);
    return {
      n: i + 1,
      wordId: w.id,
      mode: "meaning-to-word",
      prompt: w.def,
      choices,
      key: {
        index: choices.indexOf(w.hw),
        answer: w.hw,
        why: `"${w.def}" is the meaning of ${w.hw}.`,
      },
    };
  });

  const cons = unit.check?.constructed ?? [];
  const c = cons[A ? 0 : 1] ?? cons[0];
  const part4 = c
    ? { id: c.id, prompt: c.prompt, wordIds: c.wordIds, key: { model: c.model, look: c.look } }
    : unit.produce?.explain
      ? {
          id: `${unit.id}-explain`,
          prompt: unit.produce.explain,
          wordIds: [],
          key: {
            model: "",
            look: ["uses the lesson words correctly", "gives a clear reason or example"],
          },
        }
      : null;

  // Number items straight through the form so the key and the form agree.
  let n = 0;
  for (const part of [part1, part2, part3]) for (const item of part) item.q = ++n;
  if (part4) part4.q = ++n;
  return { form, parts: { part1, part2, part3, part4 }, total: n };
}

export const buildAssessmentForms = (unit) => ({
  A: buildForm(unit, "A"),
  B: buildForm(unit, "B"),
});
