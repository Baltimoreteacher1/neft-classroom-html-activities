// Vocabulary Academy — per-UNIT checks (SPEC §3.2). Pure: unit object in, { issues, info } out.
// Word-level rules live in vocab-academy-words.mjs; corpus-wide rules (ids, review, overlap) in -scope.
import {
  bandOfGrade,
  GENRES,
  GRADES,
  Q_SKILLS,
  STRANDS,
  STUDY_FOCI,
  unitId,
} from "../../access-practice-lab/src/vocab-academy/contract.js";
import {
  hasDoubleSpace,
  hasMojibake,
  normSentence,
  occursIn,
  placeholderHit,
  sentenceShape,
  sentencesOf,
  tokensOf,
  wordCount,
} from "./vocab-academy-lexical.mjs";
import { checkWord } from "./vocab-academy-words.mjs";

export const STUDY_TYPES = ["prefix", "suffix", "root", "base", "compound", "family"];
/** SPEC §3.2 passage word ranges (grade bands K-2 40-80, 3-5 150-260, 6-8 220-400, 9-12 300-520; the bare "90-140" in the spec is superseded). */
export const PASSAGE_WORDS = {
  early: [40, 80],
  "upper-elem": [150, 260],
  middle: [220, 400],
  high: [300, 520],
};
export const gradeNumber = (g) => (g === "K" ? 0 : Number(g));

const str = (v) => typeof v === "string" && v.trim() !== "";
const strArr = (v, min = 1) => Array.isArray(v) && v.length >= min && v.every(str);
const UNIT_ID = /^g(?:K|\d{1,2})-u\d{2}$/;
const WORD_ID = /^va\.[a-z0-9-]+\.[a-z]+(?:\.\d+)?$/;
const choiceNorm = (s) =>
  normSentence(s)
    .replace(/\b(?:a|an|the)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
const jaccard = (a, b) => {
  const A = new Set(a);
  const B = new Set(b);
  const i = [...A].filter((x) => B.has(x)).length;
  return A.size + B.size - i ? i / (A.size + B.size - i) : 0;
};

/**
 * @param {object} unit
 * @param {{ morphForms?: Set<string>|null, strictMorph?: boolean, fk?: (t:string)=>number }} [ctx]
 */
export function checkUnit(unit, ctx = {}) {
  const iss = [];
  const info = { sentences: [], fk: null, passageWords: 0 };
  const uid = unit?.id ?? "?";
  const err = (code, loc, msg) =>
    iss.push({ sev: "ERROR", code, loc: `unit ${uid} ${loc}`.trim(), msg });
  const warn = (code, loc, msg) =>
    iss.push({ sev: "WARN", code, loc: `unit ${uid} ${loc}`.trim(), msg });
  if (!unit || typeof unit !== "object" || Array.isArray(unit)) {
    err("unit-schema", "", "unit file is not a JSON object");
    return { issues: iss, info };
  }

  // identity and top-level shape
  if (unit.schema !== 1) err("unit-schema", "schema", `schema must be 1 (got ${unit.schema})`);
  if (!GRADES.includes(unit.grade))
    err("unit-schema", "grade", `grade "${unit.grade}" is not one of ${GRADES.join(" ")}`);
  if (!Number.isInteger(unit.n) || unit.n < 1)
    err("unit-schema", "n", `n must be a positive integer (got ${unit.n})`);
  if (
    !UNIT_ID.test(String(unit.id)) ||
    (GRADES.includes(unit.grade) &&
      Number.isInteger(unit.n) &&
      unit.id !== unitId(unit.grade, unit.n))
  )
    err(
      "unit-schema",
      "id",
      `id should be "${GRADES.includes(unit.grade) ? unitId(unit.grade, unit.n) : "g<G>-u<NN>"}" (got "${unit.id}")`,
    );
  for (const k of ["title", "theme", "rationale"])
    if (!str(unit[k])) err("unit-schema", k, `${k} is missing or empty`);
  if (!STRANDS.includes(unit.strand))
    err("unit-schema", "strand", `strand "${unit.strand}" is not one of ${STRANDS.join(" ")}`);
  if (!/^\d+\.\d+\.\d+$/.test(String(unit.version)))
    err("unit-schema", "version", `version "${unit.version}" must look like 1.0.0`);
  if (!Number.isInteger(unit.pacingDays) || unit.pacingDays < 1 || unit.pacingDays > 10)
    err("unit-schema", "pacingDays", `pacingDays must be an integer 1-10 (got ${unit.pacingDays})`);
  if (!strArr(unit.objectives, 3))
    err("unit-schema", "objectives", "objectives must be 3-4 non-empty strings");
  else {
    if (unit.objectives.length > 4)
      warn("unit-schema", "objectives", `${unit.objectives.length} objectives; the spec says 3-4`);
    for (const o of unit.objectives)
      if (!/^I can\b/.test(o))
        warn("unit-schema", "objectives", `objective should start "I can": "${o}"`);
  }
  const band = bandOfGrade(unit.grade);
  const early = band === "early";
  const gnum = gradeNumber(unit.grade);

  // words
  const words = Array.isArray(unit.words) ? unit.words : [];
  if (!words.length) err("unit-schema", "words", "words must be a non-empty array");
  const ids = new Set(words.map((w) => w?.id).filter(Boolean));
  const wctx = {
    grade: unit.grade,
    band,
    morphForms: ctx.morphForms ?? null,
    strictMorph: !!ctx.strictMorph,
  };
  for (const w of words) {
    iss.push(...checkWord(w, wctx).map((i) => ({ ...i, loc: `unit ${uid} ${i.loc}` })));
    if (w && typeof w === "object") {
      const add = (text, loc) =>
        text && info.sentences.push({ text, loc: `unit ${uid} word "${w.hw}" ${loc}` });
      add(w.ex, "ex");
      add(w.ex2, "ex2");
      add(w.nonExample, "nonExample");
      add(w.misuse?.s, "misuse.s");
      add(w.cloze?.s, "cloze.s");
      add(w.cloze2?.s, "cloze2.s");
      for (const k of ["academic", "spoken", "writing"]) add(w.apps?.[k], `apps.${k}`);
    }
  }

  // review
  const review = unit.review;
  if (!Array.isArray(review) || !review.every((r) => WORD_ID.test(String(r))))
    err("review", "review", "review must be an array of word ids (va.<slug>.<pos>)");
  else if (unit.n === 1) {
    // grade K unit 1 has nothing earlier to revisit; unit 1 of later grades may revisit earlier grades' words
    if (review.length && unit.grade === "K")
      warn(
        "review",
        "review",
        "kindergarten unit 1 has nothing earlier to revisit; review should be []",
      );
  } else if (!review.length)
    err(
      "review",
      "review",
      `unit ${unit.n} must revisit 2-4 earlier words; review is empty (only unit 1 may be [])`,
    );
  else if (review.length < 2 || review.length > 4)
    warn("review", "review", `review has ${review.length} ids; the spec asks for 2-4`);
  if (Array.isArray(review) && review.some((r) => ids.has(r)))
    err("review", "review", "review lists a word that is a target of this same unit");

  // passage
  const p = unit.passage;
  if (!p || typeof p !== "object") err("passage-missing", "passage", "passage is missing");
  else {
    if (!str(p.id) || !p.id.startsWith(`${uid}-`))
      err("passage-fields", "passage.id", `passage.id should start "${uid}-" (got "${p.id}")`);
    if (!GENRES.includes(p.genre))
      err(
        "passage-fields",
        "passage.genre",
        `genre "${p.genre}" is not one of ${GENRES.join(" ")}`,
      );
    if (!str(p.title)) err("passage-fields", "passage.title", "passage.title is empty");
    if (typeof p.listenOnly !== "boolean")
      err("passage-fields", "passage.listenOnly", "listenOnly must be true or false");
    else if (early && !p.listenOnly)
      err("passage-fields", "passage.listenOnly", "grades K-2 passages must be listenOnly: true");
    if (!strArr(p.paras))
      err("passage-fields", "passage.paras", "paras must be a non-empty array of strings");
    else {
      const text = p.paras.join(" ");
      const n = wordCount(text);
      info.passageWords = n;
      const [lo, hi] = PASSAGE_WORDS[band];
      if (n < lo || n > hi)
        err("passage-length", "passage", `passage has ${n} words; ${band} range is ${lo}-${hi}`);
      if (p.genre !== "poem")
        p.paras.forEach((para, i) => {
          const shape = sentenceShape(para);
          if (shape.length)
            err(
              "sentence-shape",
              `passage.paras[${i}]`,
              `${shape.join("; ")}: "${para.slice(0, 60)}"`,
            );
        });
      const sents = sentencesOf(text);
      if (early && (sents.length < 3 || sents.length > 6))
        warn(
          "passage-length",
          "passage",
          `${sents.length} sentences; K-2 passages are 3-6 short sentences`,
        );
      for (const s of sents)
        if (wordCount(s) >= 4) info.sentences.push({ text: s, loc: `unit ${uid} passage` });
      if (ctx.fk) info.fk = ctx.fk(text);
      if (info.fk != null) {
        if (info.fk > gnum + 3)
          warn(
            "readability",
            "passage",
            `Flesch-Kincaid ${info.fk.toFixed(1)} is above grade ${unit.grade} + 3`,
          );
        else if (info.fk < gnum - 6)
          warn(
            "readability",
            "passage",
            `Flesch-Kincaid ${info.fk.toFixed(1)} is below grade ${unit.grade} - 6`,
          );
      }
      // words listed and words used
      const byId = new Map(words.map((w) => [w?.id, w]));
      const listed = Array.isArray(p.words) ? p.words : null;
      if (!listed)
        err("passage-fields", "passage.words", "passage.words must be an array of word ids");
      else {
        for (const id of listed)
          if (!byId.has(id))
            err("passage-words", "passage.words", `"${id}" is not a word of this unit`);
        for (const id of listed)
          if (byId.has(id) && !occursIn(text, byId.get(id)))
            warn(
              "passage-words",
              "passage.words",
              `"${id}" is listed but never appears in the passage text`,
            );
      }
      const missing = words.filter((w) => w?.hw && !occursIn(text, w));
      const ratio = words.length ? (words.length - missing.length) / words.length : 0;
      const flagged = (w) =>
        (unit.editorial?.needsReview ?? []).some(
          (r) => typeof r === "string" && r.toLowerCase().includes(w.hw.toLowerCase()),
        );
      const unflagged = missing.filter((w) => !flagged(w));
      if (ratio < 0.7 && unflagged.length)
        err(
          "passage-coverage",
          "passage",
          `only ${(ratio * 100).toFixed(0)}% of target words occur in the passage (need 70%); not in the passage and not in editorial.needsReview: ${unflagged.map((w) => w.hw).join(", ")}`,
        );
      else if (unflagged.length)
        warn(
          "passage-coverage",
          "passage",
          `target words absent from the passage and not flagged in editorial.needsReview: ${unflagged.map((w) => w.hw).join(", ")}`,
        );
    }
    // questions
    const qs = Array.isArray(p.qs) ? p.qs : [];
    if (qs.length < 2)
      err("q-count", "passage.qs", `passage needs at least 2 questions (has ${qs.length})`);
    else if (early && qs.length > 3)
      warn("q-count", "passage.qs", `K-2 passages carry 2-3 questions (has ${qs.length})`);
    else if (!early && qs.length < 3)
      warn("q-count", "passage.qs", `grades 3+ usually carry 3-4 questions (has ${qs.length})`);
    const qids = new Set();
    qs.forEach((q, i) => {
      const at = `passage.qs[${i}]${q?.id ? ` (${q.id})` : ""}`;
      if (!str(q?.id) || qids.has(q.id) || !q.id.startsWith(`${uid}-`))
        err("q-fields", at, `question id must be unique and start "${uid}-" (got "${q?.id}")`);
      qids.add(q?.id);
      if (!Q_SKILLS.includes(q?.skill))
        err("q-fields", at, `skill "${q?.skill}" is not one of ${Q_SKILLS.join(" ")}`);
      if (!str(q?.q)) err("q-fields", at, "question text is empty");
      if (!str(q?.why)) err("q-why", at, "why is empty");
      const ch = q?.choices;
      if (!strArr(ch, 3) || ch.length > 4) {
        err(
          "q-choices",
          at,
          `needs 3-4 non-empty choices (has ${Array.isArray(ch) ? ch.length : "none"})`,
        );
        return;
      }
      if (!Number.isInteger(q.a) || q.a < 0 || q.a >= ch.length)
        err("q-answer-range", at, `a=${q.a} is not a valid index into ${ch.length} choices`);
      const norm = ch.map(choiceNorm);
      if (new Set(norm).size !== norm.length) err("q-dup-choice", at, "two choices are identical");
      else if (Number.isInteger(q.a) && ch[q.a]) {
        const at2 = tokensOf(ch[q.a]);
        ch.forEach((c, j) => {
          if (j !== q.a && at2.length >= 3 && jaccard(at2, tokensOf(c)) >= 0.9)
            err(
              "q-answer-trivial",
              at,
              `answer "${ch[q.a]}" is trivially identical to distractor "${c}"`,
            );
        });
      }
      if (
        q.skill === "word-meaning" &&
        !words.some((w) => w && occursIn(q.q ?? "", w, { loose: false }))
      )
        err(
          "q-word-meaning",
          at,
          "a word-meaning question must name one of the unit's target words",
        );
    });
    const keys = qs.filter((q) => Number.isInteger(q?.a)).map((q) => q.a);
    if (keys.length >= 3 && new Set(keys).size === 1)
      warn(
        "q-answer-balance",
        "passage.qs",
        `all ${keys.length} correct answers are choice ${keys[0] + 1}; vary the position`,
      );
    if (!str(p.write?.prompt))
      err("passage-fields", "passage.write", "write.prompt is missing or empty");
    if (!str(p.write?.frame))
      warn("passage-fields", "passage.write", "write.frame is missing or empty");
  }

  // study
  const s = unit.study;
  if (!s || typeof s !== "object") err("study", "study", "study is missing");
  else {
    if (!STUDY_FOCI.includes(s.focus))
      err("study", "study.focus", `focus "${s.focus}" is not one of ${STUDY_FOCI.join(" ")}`);
    if (!Array.isArray(s.parts)) err("study", "study.parts", "parts must be an array");
    else {
      if (unit.strand === "morphology" && !s.parts.length)
        err("study-parts", "study.parts", "a morphology unit needs study.parts");
      if (
        s.focus !== "none" &&
        STUDY_FOCI.includes(s.focus) &&
        !s.parts.length &&
        unit.strand !== "morphology"
      )
        warn("study-parts", "study.parts", `focus is "${s.focus}" but parts is empty`);
      for (const part of s.parts) {
        if (
          !str(part?.p) ||
          !STUDY_TYPES.includes(part?.type) ||
          !str(part?.m) ||
          !strArr(part?.ex)
        )
          err(
            "study",
            "study.parts",
            `part ${JSON.stringify(part)} needs p, type (${STUDY_TYPES.join("|")}), m and ex[]`,
          );
        else if (
          ctx.morphForms &&
          ["prefix", "suffix", "root"].includes(part.type) &&
          !ctx.morphForms.has(part.p.toLowerCase().replace(/-/g, ""))
        ) {
          const m = `study part "${part.p}" (${part.type}) is not in content/vocab-academy/morphology.json`;
          (ctx.strictMorph ? err : warn)("morph-unknown-part", "study.parts", m);
        }
      }
    }
    if (!str(s.task)) err("study", "study.task", "task is empty");
  }

  // relations
  const r = unit.relations;
  if (!r || typeof r !== "object") err("relations", "relations", "relations is missing");
  else {
    const grouped = new Set();
    if (!Array.isArray(r.groups) || !r.groups.length)
      err("relations", "relations.groups", "groups must be a non-empty array");
    else
      for (const g of r.groups) {
        if (!str(g?.label) || !strArr(g?.ids))
          err(
            "relations",
            "relations.groups",
            `group ${JSON.stringify(g)} needs a label and ids[]`,
          );
        else
          for (const id of g.ids) {
            if (!ids.has(id))
              err(
                "relations-ids",
                "relations.groups",
                `group "${g.label}" lists "${id}", which is not a word of this unit`,
              );
            grouped.add(id);
          }
      }
    for (const w of words)
      if (w?.id && !grouped.has(w.id))
        warn("relations-ungrouped", "relations.groups", `word "${w.hw}" (${w.id}) is in no group`);
    if (r.shades !== undefined)
      for (const sh of r.shades ?? [])
        if (
          !str(sh?.label) ||
          !strArr(sh?.ladder, 3) ||
          new Set(sh.ladder.map((x) => x.toLowerCase())).size !== sh.ladder.length
        )
          err(
            "relations",
            "relations.shades",
            `shade ${JSON.stringify(sh)} needs a label and 3+ distinct ladder words`,
          );
    const an = r.analogies ?? [];
    if (!Array.isArray(an)) err("analogy", "relations.analogies", "analogies must be an array");
    else {
      if (early && an.length) err("analogy", "relations.analogies", "grades K-2 omit analogies");
      if (!early && !an.length)
        warn("analogy", "relations.analogies", "no analogies (grades 3+ normally carry 1-2)");
      an.forEach((a, i) => {
        const at = `relations.analogies[${i}]`;
        if (!str(a?.stem) || !a.stem.includes(":") || !str(a?.relation))
          err("analogy", at, "needs a stem containing ':' and a relation");
        const ch = a?.choices;
        if (!strArr(ch, 3) || ch.length > 4)
          return err("analogy", at, "needs 3-4 non-empty choices");
        if (!ch.includes(a.a)) err("analogy", at, `answer "${a.a}" is not among the choices`);
        if (new Set(ch.map(choiceNorm)).size !== ch.length)
          err("analogy", at, "two choices are identical");
      });
    }
  }

  // produce, check, teacher, wida, editorial
  const pr = unit.produce;
  if (!pr || typeof pr !== "object") err("produce", "produce", "produce is missing");
  else {
    if (!strArr(pr.sentences))
      err("produce", "produce.sentences", "sentences must be a non-empty array");
    if (!strArr(pr.discuss)) err("produce", "produce.discuss", "discuss must be a non-empty array");
    if (!str(pr.explain)) err("produce", "produce.explain", "explain is missing or empty");
    const cb = pr.combine;
    if (
      cb !== undefined &&
      (!Array.isArray(cb) || cb.some((c) => !strArr(c?.given, 2) || !str(c?.model)))
    )
      err("produce", "produce.combine", "each combine item needs given[2+] and model");
    if (!early) {
      if (!Array.isArray(cb) || !cb.length)
        err("produce", "produce.combine", "grades 3+ need produce.combine");
      if (!str(pr.argue?.prompt) || !str(pr.argue?.frame))
        err("produce", "produce.argue", "grades 3+ need produce.argue with prompt and frame");
    } else if (pr.argue !== undefined && (!str(pr.argue?.prompt) || !str(pr.argue?.frame)))
      err("produce", "produce.argue", "argue, when present, needs prompt and frame");
  }
  const cons = unit.check?.constructed;
  if (!Array.isArray(cons) || !cons.length)
    err("check", "check.constructed", "check.constructed must be a non-empty array");
  else {
    const cids = new Set();
    cons.forEach((c, i) => {
      const at = `check.constructed[${i}]`;
      if (!str(c?.id) || cids.has(c.id) || !c.id.startsWith(`${uid}-`))
        err("check", at, `id must be unique and start "${uid}-" (got "${c?.id}")`);
      cids.add(c?.id);
      if (!strArr(c?.wordIds)) err("check", at, "wordIds must be a non-empty array");
      else
        for (const id of c.wordIds)
          if (!ids.has(id))
            err("check-ids", at, `wordIds lists "${id}", which is not a word of this unit`);
      if (!str(c?.prompt) || !strArr(c?.look) || !str(c?.model))
        err("check", at, "needs prompt, look[] and model");
    });
  }
  const t = unit.teacher;
  if (!t || typeof t !== "object") err("teacher", "teacher", "teacher is missing");
  else {
    for (const k of ["overview", "model", "reviewAdvice"])
      if (!str(t[k])) err("teacher", `teacher.${k}`, `${k} is missing or empty`);
    for (const k of ["discuss", "misconceptions", "extend"])
      if (!strArr(t[k])) err("teacher", `teacher.${k}`, `${k} must be a non-empty array`);
    const notes = t.notes;
    if (!notes || typeof notes !== "object" || Array.isArray(notes))
      err("teacher", "teacher.notes", "notes must be an object keyed by word id");
    else {
      for (const w of words)
        if (w?.id && !str(notes[w.id]))
          err("teacher-notes", "teacher.notes", `no teacher note for word "${w.hw}" (${w.id})`);
      for (const k of Object.keys(notes))
        if (!ids.has(k))
          err("teacher-notes", "teacher.notes", `note key "${k}" is not a word of this unit`);
    }
  }
  const wd = unit.wida;
  if (!wd || typeof wd !== "object") err("wida", "wida", "wida is missing");
  else {
    if (!strArr(wd.frames, 3))
      err(
        "wida",
        "wida.frames",
        `wida.frames needs at least 3 sentence frames (has ${Array.isArray(wd.frames) ? wd.frames.length : 0})`,
      );
    if (!strArr(wd.bank)) err("wida", "wida.bank", "bank must be a non-empty array");
    if (!str(wd.oral)) err("wida", "wida.oral", "oral is missing or empty");
  }
  const status = unit.editorial?.status;
  if (!["auto-checked", "human-reviewed"].includes(status))
    err(
      "editorial",
      "editorial.status",
      `editorial.status must be "auto-checked" or "human-reviewed" (got "${status}")`,
    );
  else if (status === "human-reviewed")
    warn(
      "editorial",
      "editorial.status",
      'status is "human-reviewed" but no machine-readable review log exists; only a person sets it (content-qa.md section 1)',
    );
  if (!Array.isArray(unit.editorial?.needsReview))
    err(
      "editorial",
      "editorial.needsReview",
      "needsReview must be an array (use [] when nothing is doubtful)",
    );

  // in-unit duplicate sentences
  const seen = new Map();
  for (const x of info.sentences) {
    const k = normSentence(x.text);
    if (k.split(" ").length < 4) continue;
    if (seen.has(k))
      err(
        "dup-sentence",
        "",
        `the same sentence appears twice in this unit: ${seen.get(k)} and ${x.loc.replace(`unit ${uid} `, "")}: "${x.text}"`,
      );
    else seen.set(k, x.loc.replace(`unit ${uid} `, ""));
  }

  hygiene(unit, uid, words, iss);
  return { issues: iss, info };
}

/** Whole-unit text hygiene: empty strings, mojibake, double spaces, placeholders. */
function hygiene(unit, uid, words, iss) {
  const insertOk = words.some((w) => /insert/i.test(w?.hw ?? ""));
  const walk = (v, path, key) => {
    if (typeof v === "string") {
      const loc = `unit ${uid} ${path}`;
      if (v.trim() === "") {
        if (key !== "note" && key !== "cognate")
          iss.push({ sev: "ERROR", code: "empty-string", loc, msg: "empty string" });
        return;
      }
      if (v !== v.trim())
        iss.push({
          sev: "ERROR",
          code: "whitespace",
          loc,
          msg: `leading or trailing space: "${v}"`,
        });
      if (hasMojibake(v))
        iss.push({
          sev: "ERROR",
          code: "mojibake",
          loc,
          msg: `garbled characters (encoding damage): "${v.slice(0, 60)}"`,
        });
      if (hasDoubleSpace(v))
        iss.push({
          sev: "ERROR",
          code: "double-space",
          loc,
          msg: `double space or tab: "${v.slice(0, 60)}"`,
        });
      if (/https?:\/\/|\bwww\.|[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(v))
        iss.push({
          sev: "ERROR",
          code: "safety-string",
          loc,
          msg: `URL or email address in content: "${v.slice(0, 60)}"`,
        });
      const ph = placeholderHit(v, insertOk ? "insert" : "");
      if (ph)
        iss.push({
          sev: "ERROR",
          code: "placeholder",
          loc,
          msg: `placeholder text (${ph}): "${v.slice(0, 60)}"`,
        });
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`, key));
    else if (v && typeof v === "object")
      for (const [k, x] of Object.entries(v)) {
        if (path.endsWith(".glyphs") || k === "glyphs") continue;
        walk(x, path ? `${path}.${k}` : k, k);
      }
  };
  for (const [k, v] of Object.entries(unit)) {
    if (k === "words" && Array.isArray(v))
      v.forEach((w, i) => walk(w, `word "${w?.hw ?? i}"`, "word"));
    else walk(v, k, k);
  }
}
