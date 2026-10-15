// Contract for the lesson-specific family homework content authored in data/family-homework-notes/<id>.json:
//   "corner"        the Family Activity Corner, the real-world spotlight, the watch-out and the optional power-up,
//   "basicPractice" six plain skill reps shown before the warm-up.
// Without them the generator falls back to unit-wide defaults, which asked a "percents greater than 100%" lesson to draw a
// 25% discount. See docs/specs/family-homework-corner.md.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { exactFamilySupport } from "../../scripts/homework-family-support.mjs";
import { loadLessonConfig, REPO_ROOT } from "./curriculum-source.mjs";

const NOTES = join(REPO_ROOT, "data/family-homework-notes");
const STOP = new Set(
  "this that with from have what when then your their about each into they them will are for and the draw label find explain check write show make number numbers using which where does tonight lesson students student part".split(
    " ",
  ),
);
const stems = (s) =>
  new Set(
    (
      String(s)
        .toLowerCase()
        .match(/[a-z]{4,}/g) || []
    )
      .filter((w) => !STOP.has(w))
      .map((w) => w.replace(/(ing|es|s|ed)$/, "")),
  );
const TIMER = /\b(timer|countdown|stopwatch|beat the clock|seconds? left|race the clock)\b/i;
const pairOk = (x) =>
  x && typeof x.en === "string" && x.en.trim() && typeof x.es === "string" && x.es.trim();

/** Sidecar ids the content applies to: every page except Unit 10, which is not taught. */
export function notesIds() {
  return readdirSync(NOTES)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""))
    .filter((id) => !/^10-/.test(id))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}
export const readNotes = (id) => JSON.parse(readFileSync(join(NOTES, `${id}.json`), "utf8"));

/** A page needs an authored corner unless the lesson already has exact, lesson-specific family support. */
export const needsCorner = (id) => !exactFamilySupport({ lessonId: id });

function lessonText(id, side) {
  let cfg = {};
  try {
    cfg = loadLessonConfig(id);
  } catch {
    /* a sidecar without a lesson config is judged on the sidecar alone */
  }
  return [
    side.sessionTitle,
    cfg.title,
    side.learningTonight?.en,
    side.bigIdea?.en,
    cfg.contentObjective,
    ...(side.vocabulary || cfg.vocabulary || []).map((v) => `${v.term} ${v.definition || ""}`),
  ].join(" ");
}

export function problemsWithItem(it, tag) {
  const p = [];
  if (!it || it.type !== "multiple-choice") return [`${tag}: type must be "multiple-choice"`];
  if (!it.stem?.trim() || !it.stemEs?.trim()) p.push(`${tag}: stem and stemEs required`);
  const n = it.choices?.length;
  if (!(n >= 3 && n <= 4)) return [...p, `${tag}: 3 or 4 choices`];
  if (new Set(it.choices.map((c) => String(c).trim())).size !== n)
    p.push(`${tag}: duplicate choices`);
  if (
    !Array.isArray(it.choicesEs) ||
    it.choicesEs.length !== n ||
    it.choicesEs.some((c) => !String(c).trim())
  )
    p.push(`${tag}: choicesEs must match choices`);
  if (!Number.isInteger(it.correctIndex) || it.correctIndex < 0 || it.correctIndex >= n)
    p.push(`${tag}: correctIndex out of range`);
  if (!it.explanation?.trim() || !it.explanationEs?.trim())
    p.push(`${tag}: explanation and explanationEs required`);
  for (const k of ["choiceFeedback", "choiceFeedbackEs"]) {
    if (!Array.isArray(it[k]) || it[k].length !== n)
      p.push(`${tag}: ${k} needs one entry per choice`);
    else {
      if (it[k][it.correctIndex]) p.push(`${tag}: ${k} for the correct choice must be empty`);
      it[k].forEach((f, i) => {
        if (i !== it.correctIndex && !String(f).trim())
          p.push(`${tag}: ${k}[${i}] must say why that choice is wrong`);
      });
    }
  }
  for (const k of ["hints", "hintsEs"])
    if (!Array.isArray(it[k]) || it[k].length !== 3 || it[k].some((h) => !String(h).trim()))
      p.push(`${tag}: ${k} needs exactly 3 hints`);
  const right = String(it.choices[it.correctIndex] ?? "").trim();
  if (right && !(it.explanation || "").includes(right.replace(/\.$/, "")))
    p.push(`${tag}: the explanation should state the correct answer "${right}"`);
  // hints must not hand over the answer in the first rung
  if (right && right.length >= 2 && (it.hints?.[0] || "").includes(right))
    p.push(`${tag}: hint 1 gives the answer away`);
  if (TIMER.test(JSON.stringify(it))) p.push(`${tag}: no timer language`);
  return p;
}

/** @returns {string[]} problems for one sidecar */
export function validateSidecar(id, side) {
  const p = [];
  const t = (m) => p.push(`${id}: ${m}`);
  if (needsCorner(id)) {
    const c = side.corner;
    if (!c) t("missing corner");
    else {
      for (const k of ["mission", "question", "frame", "watchOut"])
        if (!pairOk(c[k])) t(`corner.${k} needs en and es`);
      const sp = c.spotlight;
      if (!sp || !sp.titleEn || !sp.titleEs || !sp.factEn || !sp.factEs)
        t("corner.spotlight needs titleEn, titleEs, factEn, factEs");
      const pu = c.powerUp;
      if (!pu?.qEn || !pu.qEs || !Array.isArray(pu.choices) || pu.choices.length !== 3)
        t("corner.powerUp needs qEn, qEs and 3 choices");
      else {
        if (!pu.choices.every(pairOk)) t("corner.powerUp choices need en and es");
        if (![0, 1, 2].includes(pu.correctIndex))
          t("corner.powerUp.correctIndex must be 0, 1 or 2");
        if (!pu.hintEn || !pu.hintEs) t("corner.powerUp needs hintEn and hintEs");
        if (new Set(pu.choices.map((x) => x.en)).size !== 3)
          t("corner.powerUp choices must differ");
      }
      const lesson = stems(lessonText(id, side));
      const own = [
        ...stems(`${c.mission?.en} ${c.question?.en} ${c.watchOut?.en} ${c.spotlight?.factEn}`),
      ].filter((w) => lesson.has(w));
      if (own.length < 2)
        t(
          "corner shares fewer than 2 content words with the lesson: it may be about a different idea",
        );
      if (TIMER.test(JSON.stringify(c))) t("corner: no timer language");
    }
  }
  if (/-part\d+$/.test(id)) {
    const v = side.vocabulary;
    if (!Array.isArray(v) || v.length < 4 || v.length > 8)
      t("a Part 2 page must state its own vocabulary: 4 to 8 terms");
    else {
      if (new Set(v.map((x) => String(x.term).toLowerCase())).size !== v.length)
        t("vocabulary repeats a term");
      v.forEach((x, i) => {
        for (const k of ["term", "termEs", "definition", "definitionEs", "visual", "cloze"])
          if (!String(x[k] || "").trim()) t(`vocabulary[${i}] needs ${k}`);
        if (
          !Array.isArray(x.examples) ||
          x.examples.length < 2 ||
          !x.examples.some((e) => e.isExample === false)
        )
          t(`vocabulary[${i}] "${x.term}" needs 2+ examples including a non-example`);
        if (
          !/^\/assets\/vocab-images\/[\w-]+\.svg$/.test(String(x.image || "")) ||
          !existsSync(join(REPO_ROOT, String(x.image).slice(1)))
        )
          t(
            `vocabulary[${i}] "${x.term}" needs the path of an existing image in assets/vocab-images/`,
          );
      });
      const words = stems(
        [
          side.sessionTitle,
          side.learningTonight?.en,
          side.bigIdea?.en,
          ...(side.conceptSteps || []).map((c) => c.en),
        ].join(" "),
      );
      const hit = v.filter((x) =>
        [...stems(`${x.term} ${x.definition}`)].some((w) => words.has(w)),
      ).length;
      if (hit < 2) t("vocabulary shares too little with what this session teaches");
    }
  }
  const b = side.basicPractice;
  if (!Array.isArray(b) || b.length !== 6) t("basicPractice must hold exactly 6 items");
  else {
    b.forEach((it, i) => p.push(...problemsWithItem(it, `${id}: basicPractice[${i}]`)));
    if (new Set(b.map((x) => x.correctIndex)).size < 2)
      t("basicPractice: the correct answer sits at the same position every time");
    if (new Set(b.map((x) => x.stem)).size !== 6) t("basicPractice: repeated stems");
  }
  return p;
}

/** Cross-page checks: authored text must not be copy-pasted between lessons. */
export function validateAll(ids = notesIds()) {
  const problems = [];
  const seen = new Map();
  for (const id of ids) {
    const side = readNotes(id);
    problems.push(...validateSidecar(id, side));
    const keys = [
      side.corner?.mission?.en,
      side.corner?.powerUp?.qEn,
      ...(side.basicPractice || []).map((x) => x.stem),
    ];
    for (const k of keys.filter(Boolean)) {
      const norm = k.toLowerCase().replace(/\W+/g, " ").trim();
      const base = id.replace(/-part\d+$/, "");
      const prev = seen.get(norm);
      if (prev && prev.base !== base)
        problems.push(`${id}: text repeats ${prev.id}: "${k.slice(0, 60)}"`);
      else if (!prev) seen.set(norm, { id, base });
    }
  }
  return problems;
}
