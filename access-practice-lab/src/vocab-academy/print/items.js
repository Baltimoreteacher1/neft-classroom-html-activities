// Vocabulary Academy print: deterministic exercise items derived from a unit's own JSON (never re-authored).
// Built from the FULL unit. Every answer sits under a `key` property so project.stripKeys() can remove it for students.
import { rngFor } from "../rng.js";
import { bandInfo } from "./shared.js";

const surface = (w, which) => w[which]?.f ?? w.hw;
const ending = (s) => /(ly|ing|ed|s)$/i.exec(s)?.[0]?.toLowerCase() ?? "";

/** Up to `n` distractor surface forms for word `w`: same part of speech and ending first. */
function distract(words, w, which, n, rng) {
  const answer = surface(w, which).toLowerCase();
  const others = words
    .filter((o) => o.id !== w.id)
    .map((o) => ({
      f: surface(o, which),
      samePos: o.pos === w.pos,
      sameEnd: ending(surface(o, which)) === ending(answer),
    }))
    .filter((o) => o.f.toLowerCase() !== answer);
  const rank = (o) => (o.sameEnd ? 2 : 0) + (o.samePos ? 1 : 0);
  const shuffled = rng.shuffle(others).sort((a, b) => rank(b) - rank(a));
  const seen = new Set();
  const picked = [];
  for (const o of shuffled) {
    if (seen.has(o.f.toLowerCase())) continue;
    seen.add(o.f.toLowerCase());
    picked.push(o.f);
    if (picked.length === n) break;
  }
  return picked;
}

/** The word shown fully in the worked example: the first with word parts (grades 3+), else the first word. */
export function modeledWord(unit) {
  const early = bandInfo(unit.grade).early;
  return (
    (!early && unit.words.find((w) => w.morph?.segs?.length && w.cloze && w.misuse)) ||
    unit.words[0]
  );
}

/** Pairs "A : B" from the unit's own synonym/antonym/family data. */
function pairs(words) {
  const out = [];
  for (const w of words) {
    if (w.syn?.[0]) out.push({ type: "synonyms", a: w.hw, b: w.syn[0], word: w.id });
    if (w.ant?.[0]) out.push({ type: "opposites", a: w.hw, b: w.ant[0], word: w.id });
    const fam = w.family?.find((f) => f.w.toLowerCase() !== w.hw.toLowerCase());
    if (fam) out.push({ type: "word family", a: w.hw, b: fam.w, word: w.id });
  }
  return out;
}

/** Analogies: the unit's own, then more built from synonym/antonym data until there are at least `min`. */
export function buildAnalogies(unit, min, rng) {
  const own = (unit.relations?.analogies ?? []).map((a) => ({
    stem: a.stem,
    choices: a.choices,
    relation: a.relation,
    source: "unit",
    key: { index: a.choices.indexOf(a.a), answer: a.a },
  }));
  const out = [...own];
  const all = pairs(unit.words);
  const stems = new Set(own.map((a) => a.stem.replace(/\s+/g, "")));
  for (const base of rng.shuffle(all.filter((p) => p.type !== "word family"))) {
    if (out.length >= min) break;
    const stem = `${base.a} : ${base.b}`;
    if (stems.has(stem.replace(/\s+/g, ""))) continue;
    const right = rng.shuffle(all.filter((p) => p.type === base.type && p.word !== base.word))[0];
    if (!right) continue;
    const wrong = [];
    for (const p of rng.shuffle(
      all.filter((q) => q.type !== base.type && q.word !== base.word && q.word !== right.word),
    )) {
      if (wrong.length === 3) break;
      if (!wrong.some((x) => x.word === p.word)) wrong.push(p);
    }
    if (wrong.length < 3) continue;
    const labelled = rng
      .shuffle([right, ...wrong])
      .map((p) => ({ text: `${p.a} : ${p.b}`, right: p === right }));
    stems.add(stem.replace(/\s+/g, ""));
    out.push({
      stem,
      choices: labelled.map((c) => c.text),
      relation: base.type,
      source: "derived from synonym and antonym data",
      key: { index: labelled.findIndex((c) => c.right), answer: `${right.a} : ${right.b}` },
    });
  }
  return out;
}

const scrambled = (list, rng) => {
  if (list.length < 2) return [...list];
  for (let i = 0; i < 8; i++) {
    const s = rng.shuffle(list);
    if (s.some((x, j) => x !== list[j])) return s;
  }
  return [...list].reverse();
};

/** Base + part rows for the build-a-word grid: from each word's own morph segments. */
export function buildMorphRows(unit, rng) {
  const rows = unit.words
    .filter((w) => w.morph?.segs?.length === 2)
    .map((w) => {
      const [x, y] = w.morph.segs;
      const base = x.t === "base" ? x : y;
      const part = base === x ? y : x;
      return {
        wordId: w.id,
        base: base.s,
        baseMeaning: base.m,
        part: part.s,
        partMeaning: part.m,
        order: part === x ? "first" : "last",
        note: w.morph.note || "",
        key: { word: w.hw },
      };
    });
  return rng.shuffle(rows);
}

/** Every derived item set a unit's sheets use. */
export function buildUnitItems(unit) {
  const info = bandInfo(unit.grade);
  const seed = (tag) => rngFor(`${unit.id}:${tag}`);
  const modeled = modeledWord(unit);
  const practice = unit.words.filter((w) => w !== modeled);
  const withCloze = practice.filter((w) => w.cloze);

  // cloze with a word bank (the modeled word is the solved example)
  const bankRng = seed("bank");
  const cloze = {
    example: modeled.cloze
      ? { wordId: modeled.id, s: modeled.cloze.s, answer: modeled.cloze.f }
      : null,
    items: withCloze.map((w, i) => ({
      n: i + 1,
      wordId: w.id,
      s: w.cloze.s,
      key: { answer: w.cloze.f },
    })),
  };
  cloze.bank = bankRng.shuffle(withCloze.map((w) => w.cloze.f));

  // choose the best word (second sentence)
  const bestRng = seed("best");
  const best = practice
    .filter((w) => w.cloze2)
    .map((w, i) => {
      const wrong = distract(unit.words, w, "cloze2", info.choiceCount - 1, bestRng);
      const choices = bestRng.shuffle([w.cloze2.f, ...wrong]);
      return {
        n: i + 1,
        wordId: w.id,
        s: w.cloze2.s,
        choices,
        key: { index: choices.indexOf(w.cloze2.f), answer: w.cloze2.f },
      };
    });

  // detect incorrect usage: about 60% misuse sentences, the rest a correct sentence (ex2)
  const detRng = seed("detect");
  const withMisuse = practice.filter((w) => w.misuse);
  const wrongIds = new Set(
    detRng.shuffle(withMisuse.map((w) => w.id)).slice(0, Math.ceil(withMisuse.length * 0.6)),
  );
  const detect = {
    example: modeled.misuse
      ? {
          wordId: modeled.id,
          hw: modeled.hw,
          s: modeled.misuse.s,
          def: modeled.def,
          wrong: true,
          key: { why: modeled.misuse.why },
        }
      : null,
    items: withMisuse.map((w, i) => {
      const wrong = wrongIds.has(w.id);
      return {
        n: i + 1,
        wordId: w.id,
        hw: w.hw,
        s: wrong ? w.misuse.s : (w.ex2 ?? w.ex),
        key: {
          wrong,
          why: wrong
            ? w.misuse.why
            : `This sentence uses ${w.hw} correctly: ${w.def.replace(/\.$/, "")}.`,
        },
      };
    }),
  };

  // sort
  const sortRng = seed("sort");
  const byId = new Map(unit.words.map((w) => [w.id, w]));
  const groups = (unit.relations?.groups ?? []).filter((g) => g.ids?.length);
  const sort = {
    groups: groups.map((g) => ({
      label: g.label,
      key: { words: g.ids.map((id) => byId.get(id)?.hw).filter(Boolean) },
    })),
    pool: sortRng.shuffle(
      groups.flatMap((g) => g.ids.map((id) => byId.get(id)?.hw).filter(Boolean)),
    ),
  };

  // shades ladders: the unit's order is the key, students get a scrambled copy
  const ladRng = seed("ladder");
  const ladders = (unit.relations?.shades ?? []).map((s) => ({
    label: s.label,
    words: scrambled(s.ladder, ladRng),
    steps: s.ladder.length,
    key: { order: s.ladder },
  }));

  // analogies (grades 3+): at least five
  const analogies = info.early ? [] : buildAnalogies(unit, 5, seed("analogies"));

  // early band: draw a line from each word to its picture
  const picRng = seed("pictures");
  const withPic = unit.words.filter((w) => w.visual?.glyphs?.length);
  const pictureMatch = {
    words: withPic.map((w, i) => ({ n: i + 1, hw: w.hw, id: w.id })),
    tiles: picRng
      .shuffle(withPic.map((w) => ({ id: w.id, glyphs: w.visual.glyphs, alt: w.visual.alt })))
      .map((t, i) => ({
        ...t,
        letter: String.fromCharCode(65 + i),
      })),
  };
  for (const w of pictureMatch.words) {
    w.key = { letter: pictureMatch.tiles.find((t) => t.id === w.id).letter };
  }
  const tiles = pictureMatch.tiles.map(({ id, ...rest }) => ({ ...rest, key: { id } }));
  pictureMatch.tiles = tiles;

  const morph = buildMorphRows(unit, seed("morph"));
  const match = buildMatch(unit.words, seed("match"));

  return { modeledId: modeled.id, cloze, best, detect, sort, ladders, analogies, pictureMatch, morph, match };
}

/** Match words with meanings: `terms` numbered, `defs` lettered and shuffled. `key.letter` on each term. */
export function buildMatch(words, rng, { max = words.length } = {}) {
  const chosen = words.slice(0, max);
  const defs = rng
    .shuffle(chosen.map((w) => ({ id: w.id, def: w.def })))
    .map((d, i) => ({ ...d, letter: String.fromCharCode(65 + i) }));
  return {
    terms: chosen.map((w, i) => ({
      n: i + 1,
      hw: w.hw,
      pron: w.pron,
      key: { letter: defs.find((d) => d.id === w.id).letter },
    })),
    defs: defs.map(({ id, ...d }) => d),
  };
}
