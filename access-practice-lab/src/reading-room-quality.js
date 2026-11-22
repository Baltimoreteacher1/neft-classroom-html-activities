// Content-quality rules for Reading Room lessons. Pure (no DOM, no fetch) so the validator, the content
// patch tool and the unit test all read the same single source of truth.
// A lesson that fails these rules would teach badly even though its answer key is structurally valid.

export const PRAISE_OPENER =
  /^(well done|great|excellent|good (job|work|thinking|comparing|reading)|nice|you (found|got|did|noticed|used|spotted|chose|picked)|perfect|right|correct|yes|awesome|wow|that'?s (right|correct))\b/i;
export const GENERIC_GUIDE = /^what detail in this section connects to/i;
const ABSOLUTE_OPTION = /\b(all|none) of the above\b|\bboth (a|b|c) and (a|b|c)\b/i;

const words = (s) =>
  String(s ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
const norm = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

/** All quality problems in one lesson, as readable strings (empty array = clean). */
export function lessonQualityIssues(lesson) {
  const out = [];
  const at = (a, msg) => out.push(`${lesson.id}/${a.id}: ${msg}`);
  const pids = new Set((lesson.paragraphs || []).map((p) => p.id));
  for (const p of lesson.paragraphs || []) {
    if (!p.guidingQuestion || GENERIC_GUIDE.test(p.guidingQuestion))
      out.push(`${lesson.id}/${p.id}: guidingQuestion is missing or is the generic template`);
    else if (words(p.guidingQuestion).length > 24)
      out.push(`${lesson.id}/${p.id}: guidingQuestion too long`);
  }
  for (const a of lesson.activities || []) {
    if (!a.rationale || words(a.rationale).length < 8) at(a, "rationale missing or under 8 words");
    else if (PRAISE_OPENER.test(a.rationale.trim()))
      at(
        a,
        "rationale opens with praise; it is shown on wrong answers too, so it must only explain",
      );
    for (const id of a.evidenceIds || [])
      if (!pids.has(id)) at(a, `evidenceIds references unknown paragraph ${id}`);
    if (a.hint != null && words(a.hint).length < 5) at(a, "hint under 5 words");
    if (["choice", "connector", "multi", "hotText"].includes(a.type)) {
      const texts = (a.choices || []).map((c) => norm(c.text));
      if (new Set(texts).size !== texts.length) at(a, "duplicate answer options");
      const keys = a.type === "choice" || a.type === "connector" ? [a.answerId] : a.answerIds || [];
      for (const k of keys)
        if (!(a.choices || []).some((c) => c.id === k)) at(a, `answer key ${k} is not a choice`);
      for (const c of a.choices || []) {
        if (ABSOLUTE_OPTION.test(c.text)) at(a, `option "${c.text}" depends on option order`);
        if (!keys.includes(c.id)) {
          if (words(c.why).length < 5) at(a, `wrong option ${c.id} has no teaching note (why)`);
          else if (norm(c.why) === norm(c.text))
            at(a, `wrong option ${c.id}: why just repeats the option`);
        }
      }
    }
    if (a.type === "cloze")
      for (const s of (a.segments || []).filter((x) => x.blank)) {
        const o = s.blank.options || [];
        if (new Set(o.map(norm)).size !== o.length) at(a, `blank ${s.blank.id}: duplicate options`);
        if (!o.includes(s.blank.answer)) at(a, `blank ${s.blank.id}: answer not in options`);
      }
    if (a.type === "sort" || a.type === "order") {
      const t = (a.items || []).map((x) => norm(x.text));
      if (new Set(t).size !== t.length) at(a, "duplicate items");
    }
    if (a.type === "short") {
      if ((a.lookFor || []).length < 2) at(a, "short response needs at least two lookFor criteria");
      if (!(a.model || a.rubric?.length)) at(a, "short response needs a model or rubric");
    }
  }
  return out;
}

/** Share of 3+ option single-answer questions whose key is the longest option (an accidental clue). */
export function keyIsLongestShare(lessons) {
  let n = 0;
  let longest = 0;
  for (const l of lessons)
    for (const a of l.activities || []) {
      if (a.type !== "choice" || (a.choices || []).length < 3) continue;
      n++;
      const lens = a.choices.map((c) => String(c.text).length);
      const key = a.choices.find((c) => c.id === a.answerId);
      if (key && String(key.text).length === Math.max(...lens)) longest++;
    }
  return { n, longest, share: n ? longest / n : 0 };
}

/** Where the key sits (index) across single-answer questions: a bias here lets learners guess "first". */
export function keyPositionShare(lessons) {
  const counts = {};
  let n = 0;
  for (const l of lessons)
    for (const a of l.activities || []) {
      if (a.type !== "choice" || (a.choices || []).length < 3) continue;
      const i = a.choices.findIndex((c) => c.id === a.answerId);
      counts[i] = (counts[i] || 0) + 1;
      n++;
    }
  return { n, counts, maxShare: n ? Math.max(...Object.values(counts)) / n : 0 };
}
