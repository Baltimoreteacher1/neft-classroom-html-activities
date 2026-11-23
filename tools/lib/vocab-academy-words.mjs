// Vocabulary Academy — per-WORD checks (SPEC §3.3). Pure: word record in, issue list out.
// Every issue is { sev: "ERROR"|"WARN", code, loc, msg }; the caller prefixes the file.
import {
  CATS,
  POS,
  TIERS,
  wordIdOf,
} from "../../access-practice-lab/src/vocab-academy/contract.js";
import {
  definitionLeak,
  normSentence,
  occursIn,
  plausibleSurface,
  sentenceShape,
  tokensOf,
  wordCount,
} from "./vocab-academy-lexical.mjs";

export const SEG_TYPES = ["prefix", "base", "root", "suffix"];
export const DIAGRAMS = ["spectrum", "contrast", "cycle", "web", "flow"];
export const VISUAL_KINDS = ["scene", "diagram", "none"];

/** SPEC §3.3: K-2 <= 9 words, 3-5 <= 14, 6-12 <= 22. */
export const defLimit = (band) => (band === "early" ? 9 : band === "upper-elem" ? 14 : 22);
/** Brief: K ex <= 12 words, 1-2 <= 16, 3-5 <= 24; no cap above grade 5 (the passage bounds those). */
export function sentenceCap(grade) {
  if (grade === "K") return 12;
  if (grade === "1" || grade === "2") return 16;
  if (["3", "4", "5"].includes(String(grade))) return 24;
  return null;
}

const str = (v) => typeof v === "string" && v.trim() !== "";
const strArr = (v) => Array.isArray(v) && v.every(str);
const REQUIRED = [
  "id",
  "hw",
  "pos",
  "tier",
  "cats",
  "level",
  "pron",
  "def",
  "ex",
  "ex2",
  "syn",
  "family",
  "rel",
  "apps",
  "cloze",
  "cloze2",
  "misuse",
  "visual",
  "es",
  "frame",
  "src",
];

/**
 * Join morph segments the way English spells them: a seam may drop the left part's final e, turn
 * its y into i, or double its last consonant. Returns every spelling those rules allow.
 */
export function seamSpellings(parts) {
  let acc = new Set([parts[0] ?? ""]);
  for (const r of parts.slice(1)) {
    const next = new Set();
    for (const l of acc) {
      next.add(l + r);
      if (l.endsWith("e")) next.add(l.slice(0, -1) + r);
      if (l.endsWith("y")) next.add(`${l.slice(0, -1)}i${r}`);
      if (l.length) next.add(l + l.at(-1) + r);
      if (l.length > 2) next.add(l.slice(0, -1) + r);
      // -ion bases lose "on" before a vowel suffix: caution + -ous -> cautious
      if (l.endsWith("ion") && /^[aeiou]/.test(r)) next.add(l.slice(0, -2) + r);
    }
    acc = next;
  }
  return acc;
}

/** Morph segments reproduce the headword spelling? `note` may document one respelling as "x -> y". */
export function morphSpellsHeadword(segs, hw, note = "") {
  const target = String(hw)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  const parts = segs.map((s) =>
    String(s.s ?? "")
      .toLowerCase()
      .replace(/[^a-z]/g, ""),
  );
  if (parts.some((p) => !p)) return false;
  const attempts = [parts];
  for (const m of String(note)
    .toLowerCase()
    .matchAll(/([a-z]+)\s*(?:→|->|becomes|changes to|respelled as)\s*([a-z]+)/g)) {
    attempts.push(parts.map((p) => p.replaceAll(m[1], m[2])));
  }
  return attempts.some((a) => seamSpellings(a).has(target) || a.join("") === target);
}

/** Issues for one word record. ctx: { grade, band, morphForms:Set|null, strictMorph:boolean } */
export function checkWord(w, ctx) {
  const iss = [];
  const hw = typeof w?.hw === "string" ? w.hw : "?";
  const where = (f) => `word "${hw}" (${w?.id ?? "no id"}) ${f}`;
  const err = (code, f, msg) => iss.push({ sev: "ERROR", code, loc: where(f), msg });
  const warn = (code, f, msg) => iss.push({ sev: "WARN", code, loc: where(f), msg });
  if (!w || typeof w !== "object") {
    err("word-fields", "", "word record is not an object");
    return iss;
  }

  for (const k of REQUIRED) {
    if (w[k] === undefined || w[k] === null)
      err("word-fields", k, `required field "${k}" is missing`);
  }
  if (!str(w.hw)) err("word-fields", "hw", "hw must be a non-empty string");
  if (!POS.includes(w.pos))
    err("word-enum", "pos", `pos "${w.pos}" is not one of ${POS.join(" ")}`);
  if (!TIERS.includes(w.tier))
    err("word-enum", "tier", `tier "${w.tier}" is not one of ${TIERS.join(" ")}`);
  if (!Array.isArray(w.cats) || w.cats.some((c) => !CATS.includes(c)))
    err("word-enum", "cats", `cats must be an array drawn from ${CATS.join(" ")}`);
  if (![1, 2, 3].includes(w.level))
    err("word-enum", "level", `level "${w.level}" must be 1, 2 or 3`);
  if (str(w.hw) && POS.includes(w.pos) && w.id !== wordIdOf(w.hw, w.pos))
    err("id-format", "id", `id should be "${wordIdOf(w.hw, w.pos)}" (va.<slug>.<pos>)`);
  if (str(w.hw) && !/^[a-z][a-z' -]*$/.test(w.hw))
    err(
      "word-fields",
      "hw",
      "hw must be lowercase letters (spaces, hyphens and apostrophes allowed)",
    );

  // pronunciation respelling: hyphenated syllables, stressed syllable in capitals
  if (w.pron !== undefined) {
    const syl = String(w.pron)
      .split(/[-\s]+/)
      .filter(Boolean);
    if (!str(w.pron) || !/^[A-Za-z' -]+$/.test(w.pron) || !syl.some((s) => /^[A-Z']+$/.test(s)))
      err(
        "pron",
        "pron",
        `pron "${w.pron}" must be hyphen-separated syllables with the stressed syllable in CAPITALS`,
      );
  }

  // definition
  if (w.def !== undefined) {
    if (!str(w.def)) err("def-empty", "def", "definition is empty");
    else {
      const n = wordCount(w.def);
      const limit = defLimit(ctx.band);
      if (n > limit)
        err("def-long", "def", `definition has ${n} words; the ${ctx.band} limit is ${limit}`);
      const leak = definitionLeak(w.def, w);
      if (leak)
        err("def-headword", "def", `definition uses "${leak}", the headword or a form of it`);
    }
  }

  // examples
  const cap = sentenceCap(ctx.grade);
  for (const f of ["ex", "ex2"]) {
    if (w[f] === undefined) continue;
    if (!str(w[f])) err("ex-empty", f, `${f} is empty`);
    else {
      if (!occursIn(w[f], w))
        err(
          "ex-form",
          f,
          `${f} does not use "${hw}" or a listed inflection/family form: "${w[f]}"`,
        );
      if (cap && wordCount(w[f]) > cap)
        err("ex-long", f, `${f} has ${wordCount(w[f])} words; grade ${ctx.grade} cap is ${cap}`);
    }
  }
  if (str(w.ex) && str(w.ex2) && normSentence(w.ex) === normSentence(w.ex2))
    err("ex-same", "ex2", "ex and ex2 are the same sentence");

  // cloze
  const clozeNorm = [];
  for (const f of ["cloze", "cloze2"]) {
    const c = w[f];
    if (c === undefined) continue;
    if (!c || typeof c !== "object" || !str(c.s) || !str(c.f)) {
      err("cloze-fields", f, `${f} needs non-empty "s" and "f"`);
      continue;
    }
    const blanks = c.s.split("___").length - 1;
    if (blanks !== 1)
      err("cloze-blank", f, `${f}.s must contain ___ exactly once (found ${blanks}): "${c.s}"`);
    if (!plausibleSurface(c.f, w))
      err("cloze-form", f, `${f}.f "${c.f}" is not a plausible surface form of "${hw}"`);
    if (blanks === 1 && occursIn(c.s.replace("___", " "), w, { loose: false }))
      err("cloze-leak", f, `${f}.s already contains a form of "${hw}" outside the blank`);
    const filled = normSentence(c.s.replace("___", c.f));
    clozeNorm.push(normSentence(c.s));
    for (const e of ["ex", "ex2"])
      if (str(w[e]) && filled === normSentence(w[e]))
        err("cloze-is-example", f, `${f} filled with "${c.f}" is identical to ${e}`);
    const shape = sentenceShape(c.s, { cloze: true });
    if (shape.length) err("sentence-shape", `${f}.s`, `${shape.join("; ")}: "${c.s}"`);
  }
  if (clozeNorm.length === 2 && clozeNorm[0] === clozeNorm[1])
    err("cloze-same", "cloze2", "cloze and cloze2 are the same sentence");

  // misuse
  if (w.misuse !== undefined) {
    if (!str(w.misuse?.s) || !str(w.misuse?.why))
      err("misuse-fields", "misuse", 'misuse needs non-empty "s" and "why"');
    else if (!occursIn(w.misuse.s, w))
      err("misuse-form", "misuse.s", `misuse.s does not use a form of "${hw}": "${w.misuse.s}"`);
  }

  // relations of the word itself
  if (w.syn !== undefined) {
    if (!strArr(w.syn)) err("syn-fields", "syn", "syn must be an array of non-empty strings");
    else {
      if (w.syn.length > 4) err("syn-count", "syn", `syn has ${w.syn.length} entries; at most 4`);
      if (!w.syn.length) warn("syn-empty", "syn", "no synonyms listed");
      const hwT = tokensOf(w.hw);
      for (const s of w.syn)
        if (
          hwT.length === 1
            ? tokensOf(s).includes(hwT[0])
            : tokensOf(s).join(" ").includes(hwT.join(" "))
        )
          err("syn-headword", "syn", `synonym "${s}" contains the headword`);
    }
  }
  if ("ant" in w) {
    if (!strArr(w.ant) || !w.ant.length)
      err(
        "ant-empty",
        "ant",
        "ant must be a non-empty array of strings or the key must be omitted",
      );
    else {
      const synSet = new Set((w.syn ?? []).map((s) => String(s).toLowerCase()));
      for (const a of w.ant) {
        if (synSet.has(a.toLowerCase()))
          err("ant-is-syn", "ant", `antonym "${a}" is also listed as a synonym`);
        if (a.toLowerCase() === String(w.hw).toLowerCase())
          err("ant-headword", "ant", `antonym "${a}" is the headword`);
      }
    }
  }
  if (w.family !== undefined) {
    if (!Array.isArray(w.family)) err("family-fields", "family", "family must be an array");
    else {
      const seen = new Set();
      for (const f of w.family) {
        if (!str(f?.w) || !POS.includes(f?.pos))
          err(
            "family-fields",
            "family",
            `family entry ${JSON.stringify(f)} needs w and a valid pos`,
          );
        else {
          if (f.w.toLowerCase() === String(w.hw).toLowerCase())
            err("family-headword", "family", `family entry "${f.w}" equals the headword`);
          if (seen.has(f.w.toLowerCase()))
            warn("family-dup", "family", `family lists "${f.w}" twice`);
          seen.add(f.w.toLowerCase());
        }
      }
    }
  }

  // morphology
  if (w.morph !== undefined) {
    const segs = w.morph?.segs;
    if (!Array.isArray(segs) || !segs.length)
      err(
        "morph-fields",
        "morph",
        "morph.segs must be a non-empty array (omit morph for non-decomposable words)",
      );
    else {
      for (const s of segs) {
        if (!SEG_TYPES.includes(s?.t))
          err(
            "morph-seg-type",
            "morph",
            `segment type "${s?.t}" is not one of ${SEG_TYPES.join(" ")}`,
          );
        if (!str(s?.s) || !str(s?.m))
          err("morph-fields", "morph", `segment ${JSON.stringify(s)} needs non-empty s and m`);
      }
      if (segs.every((s) => str(s?.s)) && !morphSpellsHeadword(segs, w.hw, w.morph.note))
        err(
          "morph-spelling",
          "morph",
          `segments ${segs.map((s) => s.s).join(" + ")} do not reproduce "${w.hw}" (allowed seam changes: dropped e, y to i, doubled consonant; document others in morph.note as "x -> y")`,
        );
      if (ctx.band === "early") {
        const ok = new Set(["s", "es", "ed", "ing", "er", "est", "un", "re", "y", "ly"]);
        for (const s of segs) {
          const f = String(s?.s ?? "")
            .toLowerCase()
            .replace(/-/g, "");
          if (["prefix", "suffix"].includes(s?.t) && f && !ok.has(f))
            warn(
              "morph-k2-scope",
              "morph",
              `grades K-2 limit word parts to plurals, -ed/-ing/-er/-est, un-/re- and compounds; "${s.s}" is outside that list`,
            );
        }
      }
      if (ctx.morphForms) {
        const missing = segs.filter(
          (s) =>
            ["prefix", "suffix", "root"].includes(s?.t) &&
            str(s?.s) &&
            !ctx.morphForms.has(String(s.s).toLowerCase().replace(/-/g, "")),
        );
        for (const s of missing) {
          const m = `morph part "${s.s}" (${s.t}) is not in content/vocab-academy/morphology.json`;
          if (ctx.strictMorph) err("morph-unknown-part", "morph", m);
          else warn("morph-unknown-part", "morph", m);
        }
      }
    }
  }

  // sentence-shaped text fields
  for (const f of ["def", "ex", "ex2", "nonExample"]) {
    if (!str(w[f])) {
      if (f === "nonExample" && w.nonExample !== undefined)
        err("empty-string", f, "nonExample is present but empty (omit the key instead)");
      continue;
    }
    const shape = sentenceShape(w[f]);
    if (shape.length) err("sentence-shape", f, `${shape.join("; ")}: "${w[f]}"`);
  }
  if (str(w.misuse?.s)) {
    const shape = sentenceShape(w.misuse.s);
    if (shape.length) err("sentence-shape", "misuse.s", `${shape.join("; ")}: "${w.misuse.s}"`);
  }
  if (w.apps !== undefined) {
    for (const k of ["academic", "spoken", "writing"])
      if (!str(w.apps?.[k])) err("apps-fields", `apps.${k}`, `apps.${k} is missing or empty`);
  }
  if (str(w.frame) && !w.frame.includes("___"))
    err("frame-blank", "frame", `frame has no ___ blank: "${w.frame}"`);

  // Spanish
  if (w.es !== undefined) {
    if (!str(w.es?.gloss)) err("es-gloss", "es.gloss", "Spanish gloss is empty");
    if (typeof w.es?.cognate !== "boolean")
      err("es-gloss", "es.cognate", "es.cognate must be true or false");
  }

  // visual
  if (w.visual !== undefined) {
    const v = w.visual;
    if (!VISUAL_KINDS.includes(v?.kind))
      err(
        "visual",
        "visual.kind",
        `visual.kind "${v?.kind}" is not one of ${VISUAL_KINDS.join(" ")}`,
      );
    if (!str(v?.alt)) err("visual", "visual.alt", "visual.alt is empty");
    const g = v?.glyphs;
    if (!Array.isArray(g)) err("visual", "visual.glyphs", "visual.glyphs must be an array");
    else if (v.kind === "scene") {
      const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
      const bad = g.filter(
        (x) =>
          typeof x !== "string" ||
          [...seg.segment(x)].length !== 1 ||
          !/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(x),
      );
      if (g.length < 1 || g.length > 3 || bad.length)
        err(
          "visual",
          "visual.glyphs",
          `scene needs 1-3 glyphs that are each a single emoji (got ${JSON.stringify(g)})`,
        );
    } else if (v.kind === "diagram" || v.kind === "none") {
      if (g.length)
        err(
          "visual",
          "visual.glyphs",
          `${v.kind} visuals use glyphs [] (got ${JSON.stringify(g)})`,
        );
      if (v.kind === "diagram" && !DIAGRAMS.includes(v.diagram))
        err("visual", "visual.diagram", `diagram visual needs "diagram" in ${DIAGRAMS.join(" ")}`);
    }
  }

  // senses (optional)
  if (w.senses !== undefined) {
    if (!Array.isArray(w.senses) || !w.senses.length)
      err("senses", "senses", "senses must be omitted or a non-empty array");
    else
      for (const s of w.senses)
        if (!POS.includes(s?.pos) || !str(s?.def) || !str(s?.example))
          err("senses", "senses", `sense ${JSON.stringify(s)} needs pos, def and example`);
  }
  if (
    w.src !== undefined &&
    (!str(w.src?.method) || !Array.isArray(w.src?.basis) || !w.src.basis.length)
  )
    err("src", "src", "src needs method and a non-empty basis array");
  return iss;
}
