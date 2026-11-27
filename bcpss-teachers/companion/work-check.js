// BCPSS Plan & Respond — on-device student work check.
// Reads ONE anonymous student response against the unit's own authored content (vocab, connectors, frames, exit-ticket
// model, misconception). Runs entirely in the browser: nothing is stored or sent anywhere.
// It reports what is OBSERVABLE in the text, separately from what the teacher MIGHT check. It never scores, never names a
// proficiency level, and never infers anything about the student beyond the words on the page.

const STOP = new Set(
  "a an and are as at be because but by can do does for from has have he her his how i if in into is it its me my no not of on or our she so than that the their them then there these they this to too up was we were what when where which who why will with you your".split(
    " ",
  ),
);
const REASON_WORDS = [
  "because",
  "since",
  "so",
  "therefore",
  "as a result",
  "this shows",
  "which means",
  "that is why",
];
const EVIDENCE_WORDS = [
  "the text says",
  "according to",
  "the author",
  "in paragraph",
  "for example",
  "for instance",
  "the data",
  "the table",
  "the graph",
  "the model",
  "the source",
  "evidence",
];
export const NAME_HINT = /\b(my name is|name\s*:|student\s*:|by\s+[A-Z][a-z]+\s+[A-Z][a-z]+)/i;

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9.%/\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const has = (text, phrase) => {
  const p = norm(phrase);
  if (!p) return false;
  return new RegExp(`(^|[^a-z0-9])${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(
    text,
  );
};

const sentencesOf = (raw) =>
  String(raw || "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 2);

const contentWords = (s) =>
  norm(s)
    .split(" ")
    .filter((w) => w.length > 3 && !STOP.has(w));

const numbersIn = (s) =>
  [...String(s || "").matchAll(/-?\d+(?:[.,]\d+)*(?:\/\d+)?/g)].map((m) => m[0].replace(/,/g, ""));

function frameMatch(text, frames) {
  let best = null;
  for (const f of frames) {
    const fixed = contentWords(f.replace(/\[[^\]]*\]|_{2,}/g, " "));
    if (fixed.length < 2) continue;
    const hit = fixed.filter((w) => text.includes(w)).length / fixed.length;
    if (hit >= 0.6 && (!best || hit > best.hit)) best = { frame: f, hit };
  }
  return best;
}

/**
 * @param {string} raw  the anonymous student response
 * @param {object} detail  unit detail from /api/bcpss/units/<id>
 * @param {{ task?: "exit" | "open" }} [opts]  "exit" compares against the unit's exit-ticket model
 */
export function analyzeResponse(raw, detail, opts = {}) {
  const studio = detail?.studio;
  if (!studio) throw new Error("analyzeResponse: unit has no authored studio content");
  const input = String(raw || "").trim();
  if (!input)
    return { empty: true, observed: [], possible: [], strengths: [], next: [], privacy: [] };
  const text = norm(input);
  const words = input.split(/\s+/).filter(Boolean);
  const sentences = sentencesOf(input);
  const observed = [];
  const possible = [];
  const strengths = [];
  const next = [];
  const privacy = [];

  if (NAME_HINT.test(input))
    privacy.push("This text may contain a name. Remove names before checking work.");

  // Vocabulary
  const vocab = studio.vocab || [];
  const used = vocab.filter((v) => [v.term, ...(v.family || [])].some((w) => has(text, w)));
  const unused = vocab.filter((v) => !used.includes(v));
  observed.push({
    area: "Vocabulary",
    text: used.length
      ? `Uses ${used.length} of ${vocab.length} unit words: ${used.map((v) => v.term).join(", ")}.`
      : `Uses none of the ${vocab.length} unit words.`,
  });
  if (used.length >= 2)
    strengths.push(
      `You used unit words (${used
        .slice(0, 3)
        .map((v) => v.term)
        .join(", ")}).`,
    );
  const homeWords = vocab.filter((v) => v.es && norm(v.es) !== norm(v.term) && has(text, v.es));
  if (homeWords.length) {
    observed.push({
      area: "Vocabulary",
      text: `Uses Spanish words: ${homeWords.map((v) => `${v.es} (${v.term})`).join(", ")}.`,
    });
    possible.push({
      area: "Language",
      text: "The student may know the idea but not yet the English word. Bridge from the Spanish word to the English one; this is a strength to build on.",
    });
  }

  // Sentences and connectors
  const avg = sentences.length ? Math.round(words.length / sentences.length) : words.length;
  observed.push({
    area: "Sentences",
    text: `${sentences.length || 1} sentence${sentences.length === 1 ? "" : "s"}, ${words.length} words (about ${avg} words per sentence).`,
  });
  const connectors = (studio.connectors || []).filter((c) => has(text, c));
  observed.push({
    area: "Sentences",
    text: connectors.length
      ? `Uses unit connectors: ${connectors.join(", ")}.`
      : "Uses none of the unit connectors.",
  });
  if (connectors.length) strengths.push(`You linked ideas with "${connectors[0]}".`);
  else
    next.push(
      `Join two ideas with a connector such as "${(studio.connectors || ["because"])[0]}".`,
    );
  const lowerStarts = sentences.filter((s) => /^[a-z]/.test(s)).length;
  const noEnd = /[.!?]$/.test(input) ? 0 : 1;
  if (lowerStarts || noEnd)
    observed.push({
      area: "Sentences",
      text: `${lowerStarts} sentence${lowerStarts === 1 ? "" : "s"} start with a lowercase letter${noEnd ? "; the response has no end punctuation" : ""}.`,
    });

  // Frames
  const allFrames = Object.values(studio.frames || {}).flat();
  const frame = frameMatch(text, allFrames);
  if (frame) observed.push({ area: "Sentences", text: `Follows the frame "${frame.frame}".` });

  // Explanation and evidence
  const reasons = REASON_WORDS.filter((w) => has(text, w));
  observed.push({
    area: "Explanation",
    text: reasons.length
      ? `Gives a reason (${reasons.join(", ")}).`
      : "No reason word (because, so, since) appears.",
  });
  if (reasons.length) strengths.push("You explained why, not just what.");
  else next.push("Add a sentence that starts with because to explain your thinking.");
  const evidence = EVIDENCE_WORDS.filter((w) => has(text, w));
  if (evidence.length || /["“].{6,}["”]/.test(input)) {
    observed.push({
      area: "Evidence",
      text: `Points to evidence (${evidence.join(", ") || "a quotation"}).`,
    });
  } else if (/ela|social/i.test(detail.unit?.subject || "")) {
    observed.push({
      area: "Evidence",
      text: "No quotation or evidence phrase (according to, the text says) appears.",
    });
    next.push("Point to one piece of evidence: According to the text, ...");
  }

  // Exit-ticket comparison (numbers are checked as written; no arithmetic is inferred)
  const model = studio.exit_ticket?.model || "";
  if (opts.task === "exit" && model) {
    const modelNums = [...new Set(numbersIn(model))];
    const studentNums = new Set(numbersIn(input));
    if (modelNums.length) {
      const found = modelNums.filter((n) => studentNums.has(n));
      observed.push({
        area: "Content",
        text:
          found.length === modelNums.length
            ? `Includes every number in the model answer (${modelNums.join(", ")}).`
            : `Includes ${found.length} of the model answer's numbers (${modelNums.join(", ")}).`,
      });
      if (found.length < modelNums.length)
        possible.push({
          area: "Content",
          text: `Check the work for ${modelNums.filter((n) => !studentNums.has(n)).join(", ")}. A different number can mean a different method, a slip, or a misunderstanding; ask the student to talk you through it.`,
        });
    }
    const modelWords = new Set(contentWords(model));
    const shared = [...new Set(contentWords(input))].filter((w) => modelWords.has(w));
    observed.push({
      area: "Content",
      text: `Shares ${shared.length} key words with the model answer${shared.length ? ` (${shared.slice(0, 6).join(", ")})` : ""}.`,
    });
  }

  // Misconception look-for: flagged only when the response shares distinctive words with the authored pattern
  const m = studio.misconception;
  if (m?.pattern) {
    const vocabWords = new Set(vocab.flatMap((v) => contentWords(v.term)));
    const distinct = [...new Set(contentWords(m.pattern))].filter((w) => !vocabWords.has(w));
    const overlap = distinct.filter((w) => text.includes(w));
    if (overlap.length >= 2)
      possible.push({
        area: "Content",
        text: `Possible known misconception: ${m.pattern} (shared words: ${overlap.join(", ")}). Confirm by asking the student to explain.`,
      });
  }

  // Language-load signals, phrased as things to check, never as conclusions about the student
  if (words.length < 8)
    possible.push({
      area: "Language",
      text: "The response is very short. It may not show everything the student knows; try an oral check or a frame.",
    });
  if (!used.length && words.length >= 8)
    possible.push({
      area: "Language",
      text: "The idea may be there in everyday words. Ask the student to say it again with one unit word.",
    });

  if (!strengths.length) strengths.push("You wrote a response you can build on.");
  if (unused.length) next.push(`Use one more unit word, such as "${unused[0].term}".`);

  return {
    empty: false,
    observed,
    possible,
    strengths: strengths.slice(0, 2),
    next: next.slice(0, 2),
    privacy,
    used: used.map((v) => v.term),
    unused: unused.map((v) => v.term),
  };
}

/** A revision task and a fresh follow-up task for the student, from the unit's own frames and words. */
export function followUps(result, detail, wida = "3_4") {
  const studio = detail.studio;
  const frames = studio.frames?.[`l${wida}`] || [];
  const words = (result.unused || []).slice(0, 2);
  const revise = {
    title: "Revise",
    steps: [
      `Read your answer aloud to a partner.`,
      result.next[0] || "Add one detail that makes your answer clearer.",
      frames[0]
        ? `Rewrite one sentence with this frame: ${frames[0]}`
        : "Rewrite one sentence so it is clearer.",
    ],
  };
  const fresh = {
    title: "Try a new one",
    prompt: studio.essential_question,
    steps: [
      `Answer this question in two or three sentences: ${studio.essential_question}`,
      words.length ? `Use these words: ${words.join(", ")}.` : "Use two unit words.",
      `Use a connector: ${(studio.connectors || []).slice(0, 3).join(", ")}.`,
    ],
  };
  return { revise, fresh };
}
