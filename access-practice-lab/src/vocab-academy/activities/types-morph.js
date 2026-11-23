// Morphology activities. Parts come from the unit's own morph/study blocks (and morphology.json when loaded);
// a combination is only offered when the data says it is a real word.
import { allParts, morphology, segsOf } from "./morph-data.js";
import {
  POS_NAME,
  defsOf,
  item,
  lcFirst,
  maskWord,
  mc,
  nearWords,
  noDot,
  place,
  wordExtras,
} from "./core.js";

const G = "morphology";
const bare = (s) => String(s).replace(/^-+|-+$/g, "");
const hasAffix = (word, part, kind) => {
  const w = word.toLowerCase();
  const a = bare(part).toLowerCase();
  return kind === "prefix" ? w.startsWith(a) : kind === "suffix" ? w.endsWith(a) : w.includes(a);
};
const withSegs = (c) =>
  c.words.map((w) => ({ w, segs: segsOf(w, c.ctx) })).filter((x) => x.segs.length);

function affixWordItem(c, kind) {
  const w = c.word;
  const segs = segsOf(w, c.ctx);
  const seg = segs.find((s) => s.t === kind);
  if (!seg) return null;
  const parts = allParts(c.unit, c.ctx);
  const wrongs = [
    ...segs.filter((s) => s !== seg).map((s) => s.s),
    ...c.rng.shuffle(parts.filter((p) => p.t === kind && p.s !== seg.s)).map((p) => p.s),
    ...c.rng
      .shuffle(parts.filter((p) => p.t !== kind && p.t !== "base" && p.s !== seg.s))
      .map((p) => p.s),
  ];
  return mc(c, {
    prompt: `Look at the parts of the word. Which part is the ${kind}?`,
    stem: `Which part of “${w.hw}” is the ${kind}?`,
    correct: seg.s,
    wrongs,
    explain:
      `“${seg.s}” is the ${kind}${seg.m ? `: it means “${seg.m}”` : ""}. ${w.morph?.note || ""}`.trim(),
    hint: `A ${kind} is added to the ${kind === "prefix" ? "front" : "end"} of a base word. Which part is added on?`,
  });
}
function affixPartItems(c, kind) {
  const out = [];
  (c.unit.study?.parts || [])
    .filter((p) => p.type === kind)
    .forEach((p, k) => {
      const unitHit = c.words.find((w) => segsOf(w, c.ctx).some((s) => s.s === p.p));
      const correct = unitHit?.hw ?? p.ex?.[0];
      if (!correct) return;
      const pool = [
        ...c.words.filter((w) => w !== unitHit && !hasAffix(w.hw, p.p, kind)).map((w) => w.hw),
        ...(c.unit.study.parts || [])
          .filter((x) => x !== p)
          .flatMap((x) => x.ex || [])
          .filter((e) => !hasAffix(e, p.p, kind)),
      ];
      const r = mc(
        { ...c, word: unitHit, key: `p${k}` },
        {
          wordId: unitHit?.id ?? null,
          prompt: `The ${kind} “${p.p}” means “${p.m}”. Which word has it?`,
          stem: `Which word has the ${kind} “${p.p}”?`,
          correct,
          wrongs: c.rng.shuffle([...new Set(pool)]),
          explain: `“${correct}” has the ${kind} “${p.p}”, which means “${p.m}”.`,
          hint: `Look at the ${kind === "prefix" ? "start" : "end"} of each word for “${p.p}”.`,
        },
      );
      if (r) out.push(r);
    });
  return out;
}
const affixType = (kind, minGrade) => ({
  id: `${kind}-id`,
  group: G,
  label:
    kind === "prefix"
      ? ["Find the prefix", "Encuentra el prefijo"]
      : ["Find the suffix", "Encuentra el sufijo"],
  dims: ["morph"],
  dim: "morph",
  minGrade,
  maxGrade: 12,
  domain: "reading",
  mode: "choice",
  scope: "both",
  make: (c) => affixWordItem(c, kind),
  makeUnit: (c) => affixPartItems(c, kind),
});

export const MORPH_TYPES = [
  affixType("prefix", 1),
  affixType("suffix", 1),
  {
    id: "root-analysis",
    group: G,
    label: ["Find the base or root", "Encuentra la base o raíz"],
    dims: ["morph"],
    dim: "morph",
    minGrade: 3,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      const segs = segsOf(w, c.ctx);
      const base = segs.find((s) => s.t === "base" || s.t === "root");
      if (!base) return [];
      const out = [];
      const otherBases = withSegs(c)
        .filter((x) => x.w !== w)
        .map((x) => x.segs.find((s) => s.t === "base" || s.t === "root"))
        .filter(Boolean);
      const a = mc(
        { ...c, key: `${c.key}a` },
        {
          prompt: "Take off every prefix and suffix. What is left?",
          stem: `What is the ${base.t === "root" ? "root" : "base word"} in “${w.hw}”?`,
          correct: base.s,
          wrongs: [
            ...segs.filter((s) => s !== base).map((s) => s.s),
            ...c.rng.shuffle(otherBases).map((b) => b.s),
          ],
          explain:
            `The ${base.t === "root" ? "root" : "base word"} is “${base.s}”${base.m ? `: ${base.m}` : ""}. ${w.morph?.note || ""}`.trim(),
          hint: "The base is the part that can carry meaning on its own. What is left when the extra ending is removed?",
        },
      );
      if (a) out.push(a);
      if (base.m) {
        const others = allParts(c.unit, c.ctx).filter((p) => p.m && p.m !== base.m);
        const b = mc(
          { ...c, key: `${c.key}b` },
          {
            prompt: "Use the word parts to find the meaning.",
            stem: `What does “${base.s}” mean in “${w.hw}”?`,
            correct: base.m,
            wrongs: c.rng.shuffle(others).map((p) => p.m),
            explain: `“${base.s}” means “${base.m}”.`,
            hint: `Say “${w.hw}” and think about what it means. Which meaning matches the base part?`,
          },
        );
        if (b) out.push(b);
      }
      return out;
    },
  },
  {
    id: "word-family",
    group: G,
    label: ["Word families", "Familias de palabras"],
    dims: ["morph"],
    dim: "morph",
    minGrade: 2,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      const fam = (w.family || []).filter((f) => f.w && f.pos);
      if (!fam.length) return [];
      const outside = c.pool
        .filter((x) => x.id !== w.id)
        .flatMap((x) => x.family || [])
        .filter((f) => f.w);
      return fam
        .map((f, k) => {
          const posName = (POS_NAME[f.pos] || [f.pos])[0];
          const wrongs = [
            ...(f.pos === w.pos ? [] : [w.hw]),
            ...fam.filter((x) => x !== f && x.pos !== f.pos).map((x) => x.w),
            ...c.rng.shuffle(outside.filter((x) => x.pos === f.pos)).map((x) => x.w),
            ...c.rng.shuffle(outside).map((x) => x.w),
          ].filter((x) => x.toLowerCase() !== f.w.toLowerCase());
          return mc(
            { ...c, key: `${c.key}-${k}` },
            {
              prompt: `Choose the ${posName} that belongs to the same word family.`,
              stem: `Which word is the ${posName} form of “${w.hw}”?`,
              correct: f.w,
              wrongs,
              explain: `“${f.w}” is the ${posName} in the “${w.hw}” family. “${w.hw}” means: ${w.def}`,
              hint: `Words in a family share a base. Look for the ${posName} that is built on the same base as “${w.hw}”.`,
            },
          );
        })
        .filter(Boolean);
    },
  },
  {
    id: "build-a-word",
    group: G,
    label: ["Build a word", "Construye una palabra"],
    dims: ["morph"],
    dim: "morph",
    minGrade: 1,
    maxGrade: 12,
    domain: "reading",
    mode: "build",
    scope: "word",
    make(c) {
      const w = c.word;
      const segs = segsOf(w, c.ctx);
      if (segs.length < 2 || !w.def) return null;
      const parts = allParts(c.unit, c.ctx);
      const have = new Set(segs.map((s) => s.s));
      const decoys = c.rng
        .shuffle(parts.filter((p) => !have.has(p.s) && p.t !== "base"))
        .slice(0, c.early ? 1 : 2)
        .map((p) => p.s);
      const answer = segs.map((s) => s.s);
      let tiles = c.rng.shuffle([...answer, ...decoys]);
      if (tiles.join() === answer.join()) tiles = [...tiles.slice(1), tiles[0]];
      return item(c, {
        ...wordExtras(c),
        prompt: "Tap the parts in the right order to build the word.",
        stem: `Build the word that means: ${w.def}`,
        choices: tiles,
        answer,
        result: w.hw,
        explain: `${answer.join(" + ")} makes “${w.hw}”. ${w.morph?.note || ""}`.trim(),
        hint: "Start with the base word. Then add the part that changes its meaning or job.",
      });
    },
  },
  {
    id: "predict-meaning",
    group: G,
    label: ["Predict from the parts", "Predice con las partes"],
    dims: ["morph", "mean"],
    dim: "morph",
    minGrade: 2,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "word",
    make(c) {
      const w = c.word;
      const segs = segsOf(w, c.ctx).filter((s) => s.m);
      if (segs.length < 2) return null;
      return mc(c, {
        prompt: "Use the word parts to predict what the word means.",
        stem: `${w.hw} = ${segs.map((s) => `${s.s} (${s.m})`).join(" + ")}`,
        correct: w.def,
        wrongs: defsOf(nearWords(c, w).slice(0, c.n + 2)),
        explain: `The parts give a clue: ${segs.map((s) => `“${s.s}” ${s.m}`).join(", and ")}. Together: ${w.def}`,
        hint: "Put the meanings of the parts together in your own words, then find the choice that sounds like that.",
      });
    },
  },
  {
    id: "analyze-unfamiliar",
    group: G,
    label: ["Analyze a new word", "Analiza una palabra nueva"],
    dims: ["morph"],
    dim: "morph",
    minGrade: 3,
    maxGrade: 12,
    domain: "reading",
    mode: "choice",
    scope: "unit",
    make(c) {
      const parts = c.unit.study?.parts || [];
      const out = [];
      parts.forEach((p, pi) =>
        (p.ex || []).forEach((e, ei) => {
          const hit = c.words.find((w) => segsOf(w, c.ctx).some((s) => s.s === p.p));
          if (!hit || !p.m || !hasAffix(e, p.p, p.type)) return;
          const wrongs = allParts(c.unit, c.ctx)
            .filter((x) => x.m && x.m !== p.m && x.s !== p.p)
            .map((x) => x.m);
          const r = mc(
            { ...c, word: hit, key: `${pi}-${ei}` },
            {
              wordId: hit.id,
              prompt: `What does “${p.p}” tell you about this word?`,
              stem: `You find the word “${e}”. It has the ${p.type} “${p.p}”.`,
              correct: p.m,
              wrongs: c.rng.shuffle(wrongs),
              explain: `“${p.p}” means “${p.m}”, so “${e}” has that idea in it.`,
              hint: `Cover “${p.p}”. What word is left? Then think about what “${p.p}” adds.`,
            },
          );
          if (r && ei === 0) out.push(r);
        }),
      );
      const data = morphology(c.ctx);
      if (data?.derivations?.length) {
        data.derivations.slice(0, 40).forEach((d, k) => {
          const ids = new Set(
            (d.parts || []).map((id) => data.parts.find((p) => p.id === id)?.form).filter(Boolean),
          );
          const hit = c.words.find((w) => segsOf(w, c.ctx).some((s) => ids.has(s.s)));
          if (!hit || !d.gloss || c.words.some((w) => w.hw === d.word)) return;
          const wrongs = data.derivations.filter((x) => x !== d && x.gloss).map((x) => x.gloss);
          const r = mc(
            { ...c, word: hit, key: `d${k}` },
            {
              wordId: hit.id,
              prompt: "Use the word parts to figure out a word you may not know.",
              stem: `What does “${d.word}” most likely mean?`,
              correct: d.gloss,
              wrongs: c.rng.shuffle(wrongs),
              explain: `“${d.word}” means “${d.gloss}” because of its parts.`,
              hint: "Break the word into parts. What does each part add?",
            },
          );
          if (r && out.length < 12) out.push(r);
        });
      }
      return out;
    },
  },
];
export { lcFirst, maskWord, noDot, place };
