// Verifier: sentence frames (studio.frames per band, lesson language_objective.forms) are well formed, can be completed
// with the unit's own vocabulary, and move from supported to open across the three bands.
//
// A frame is a string with blanks written as [label] or [option / option]. Findings:
//   frame_malformed          error  unbalanced or nested brackets, empty blank, stray bracket text
//   frame_blank_style        warn   blank written some other way (___, {n}) or padded "[ x ]"
//   frame_band_missing       error  a band (l1_2, l3_4, l5_6) has no frames
//   frame_no_blank           warn   a band frame with nothing to fill in
//   frame_duplicate_band     warn   same frame text in two bands (no progression)
//   frame_no_vocab_slot      warn   no blank of the frame can take a unit vocabulary word (see vocabFillable)
//   frame_band_progression   warn   blanks per frame fall, or choice blanks rise, from one band to the next
//   frame_vocab_unreachable  info   unit vocabulary terms that no frame blank can take (count kept)
//
// Supported -> open is measured per band as (a) mean blanks per frame, which may not fall by more than 0.5 from one band to
// the next, and (b) the share of blanks that offer a choice ("truck / boat", a supported blank), which may not rise by more
// than 0.2. Openness as blanks per word was tried first and rejected: longer upper-band frames add fixed words and read as
// "less open" though the writer produces more.
//
// vocabFillable: a frame is tied to the vocabulary when its fixed text names a unit term or family word, or a blank's option
// or label shares a six-letter stem with one, or the label names its part of speech (noun, verb, adjective, word, term) and
// the unit has a term of that part of speech. Open-class role labels (number, reason, evidence, person, place) are not vocab
// slots on purpose; a frame made only of those, with no vocab word in its fixed text, is reported.
//
// False-positive classes found by hand-reading the real sweep (docs/content/verifiers-b.md):
//   - frame_no_vocab_slot on l1_2 frames: supported frames often ask for a picture word ("[animal]") that is the unit's
//     topic, not a vocabulary term.
//   - frame_band_progression: a band whose frames are single long sentences with one blank each can have fewer blanks per
//     frame than a band of short two-blank frames though it asks for more; hand-read before treating as a defect.

import { finding, fold } from "./b-common.mjs";

export const name = "frames";
export const kinds = ["unit"];
export const BANDS = ["l1_2", "l3_4", "l5_6"];
const BLANK_TOLERANCE = 0.5;
const CHOICE_TOLERANCE = 0.2;
const POS_CUES = {
  noun: "noun",
  verb: "verb",
  adjective: "adjective",
  adj: "adjective",
  word: null,
  term: null,
  vocabulary: null,
};
const stemOf = (w) => fold(w).replace(/\s/g, "").slice(0, 6);

/** Parse one frame. Returns { blanks: [{ label, options }], problems: string[], fixedWords }. */
export function parseFrame(frame) {
  const problems = [];
  const blanks = [];
  let fixed = "";
  let depth = 0;
  let cur = "";
  for (const ch of String(frame)) {
    if (ch === "[") {
      if (depth > 0) problems.push("nested [");
      depth += 1;
      if (depth === 1) cur = "";
    } else if (ch === "]") {
      if (depth === 0) {
        problems.push("stray ]");
      } else {
        depth -= 1;
        if (depth === 0) {
          const label = cur.trim();
          if (!label) problems.push("empty blank []");
          else
            blanks.push({
              label,
              options: label
                .split("/")
                .map((o) => o.trim())
                .filter(Boolean),
              padded: cur !== label,
            });
        }
      }
    } else if (depth > 0) cur += ch;
    else fixed += ch;
  }
  if (depth > 0) problems.push("unclosed [");
  return {
    blanks,
    problems,
    fixedText: fixed,
    fixedWords: fixed.split(/\s+/).filter(Boolean).length,
    legacy: /_{3,}|\{\d+\}/.test(fixed),
  };
}

function vocabIndex(vocab) {
  const stems = new Set();
  const pos = new Set();
  for (const v of vocab ?? []) {
    for (const w of [v.term, ...(v.family ?? [])])
      for (const part of fold(w).split(" ")) if (part.length >= 3) stems.add(stemOf(part));
    if (v.pos) pos.add(fold(v.pos));
  }
  return { stems, pos };
}

/**
 * True when the frame is tied to the unit vocabulary: a blank can take a vocab word, or the fixed text already names one
 * ("The mean is [number]" is completed with the unit word in the frame itself).
 */
export function vocabFillable(parsed, index) {
  const wordsOf = (s) =>
    fold(s)
      .split(" ")
      .filter((w) => w.length >= 3);
  if (wordsOf(parsed.fixedText ?? "").some((w) => index.stems.has(stemOf(w)))) return true;
  return parsed.blanks.some((b) => {
    const words = [...b.options, b.label].flatMap(wordsOf);
    if (words.some((w) => index.stems.has(stemOf(w)))) return true;
    return words.some(
      (w) =>
        w in POS_CUES && (POS_CUES[w] === null ? index.pos.size > 0 : index.pos.has(POS_CUES[w])),
    );
  });
}

/** Support profile of a band: mean blanks per frame and the share of blanks that offer a choice. */
export function bandProfile(parsedFrames) {
  const blanks = parsedFrames.flatMap((f) => f.blanks);
  return {
    blanksPerFrame: parsedFrames.length ? blanks.length / parsedFrames.length : 0,
    choiceShare: blanks.length
      ? blanks.filter((b) => b.options.length > 1).length / blanks.length
      : 0,
  };
}

export function verify(subject) {
  const { studio, lessons } = subject;
  const out = [];
  const frames = studio?.frames ?? {};
  const index = vocabIndex(studio?.vocab);
  const profile = {};
  const seen = new Map();
  const reachable = new Set();
  for (const band of BANDS) {
    const list = frames[band] ?? [];
    if (list.length === 0) {
      out.push(
        finding(
          "frame_band_missing",
          "error",
          `studio.frames.${band}`,
          `band ${band} has no frames`,
          subject.id,
        ),
      );
      continue;
    }
    const parsedList = list.map(parseFrame);
    list.forEach((text, i) => {
      const path = `studio.frames.${band}[${i}]`;
      const parsed = parsedList[i];
      for (const p of parsed.problems) out.push(finding("frame_malformed", "error", path, p, text));
      if (parsed.legacy || parsed.blanks.some((b) => b.padded))
        out.push(
          finding("frame_blank_style", "warn", path, "blank is not written as [label]", text),
        );
      if (parsed.blanks.length === 0 && parsed.problems.length === 0)
        out.push(finding("frame_no_blank", "warn", path, "frame has no blank", text));
      if (parsed.blanks.length > 0 && !vocabFillable(parsed, index))
        out.push(
          finding(
            "frame_no_vocab_slot",
            "warn",
            path,
            "no blank can take a unit vocabulary word",
            text,
          ),
        );
      if (seen.has(text) && seen.get(text) !== band)
        out.push(
          finding(
            "frame_duplicate_band",
            "warn",
            path,
            `same frame as band ${seen.get(text)}`,
            text,
          ),
        );
      seen.set(text, band);
      for (const w of [
        parsed.fixedText,
        ...parsed.blanks.flatMap((b) => [...b.options, b.label]),
      ].flatMap((o) => fold(o).split(" ")))
        reachable.add(stemOf(w));
    });
    profile[band] = bandProfile(parsedList);
  }
  for (let i = 1; i < BANDS.length; i++) {
    const a = profile[BANDS[i - 1]];
    const b = profile[BANDS[i]];
    if (!a || !b) continue;
    const fewer = b.blanksPerFrame + BLANK_TOLERANCE < a.blanksPerFrame;
    const moreChoice = b.choiceShare > a.choiceShare + CHOICE_TOLERANCE;
    if (fewer || moreChoice) {
      out.push(
        finding(
          "frame_band_progression",
          "warn",
          `studio.frames.${BANDS[i]}`,
          `${BANDS[i - 1]} -> ${BANDS[i]}: blanks/frame ${a.blanksPerFrame.toFixed(1)} -> ${b.blanksPerFrame.toFixed(1)}, choice share ${a.choiceShare.toFixed(2)} -> ${b.choiceShare.toFixed(2)}`,
          subject.id,
        ),
      );
    }
  }
  (lessons ?? []).forEach((lesson, l) =>
    (lesson.language_objective?.forms ?? []).forEach((text, i) => {
      if (!/[[\]]/.test(text)) return;
      for (const p of parseFrame(text).problems)
        out.push(
          finding(
            "frame_malformed",
            "error",
            `lessons[${l}].language_objective.forms[${i}]`,
            p,
            text,
          ),
        );
    }),
  );
  const missed = (studio?.vocab ?? []).filter(
    (v) =>
      !fold(v.term)
        .split(" ")
        .some((w) => w.length >= 3 && reachable.has(stemOf(w))),
  );
  if (missed.length > 0 && (studio?.vocab ?? []).length > 0) {
    out.push(
      finding(
        "frame_vocab_unreachable",
        "info",
        "studio.frames",
        `${missed.length} vocabulary term(s) named by no frame blank`,
        missed
          .map((v) => v.term)
          .slice(0, 6)
          .join(", "),
      ),
    );
  }
  return out;
}

const vocab = [
  { term: "ratio", pos: "noun", family: ["ratios"] },
  { term: "compare", pos: "verb", family: ["compares"] },
];
const unit = (frames) => ({ kind: "unit", id: "fixture", studio: { vocab, frames }, lessons: [] });
export const fixtures = {
  bad: {
    subject: unit({
      l1_2: ["The [ratio is [number]."],
      l3_4: ["The [] compares ]x[."],
      l5_6: [],
    }),
    mustFlag: ["frame_malformed", "frame_band_missing"],
  },
  good: {
    subject: unit({
      l1_2: ["The [ratio] is [number]."],
      l3_4: ["[ratio] is [number] because [reason]."],
      l5_6: ["[verb] [claim] because [reason] so [result]."],
    }),
  },
};
