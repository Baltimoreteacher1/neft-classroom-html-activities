/* =============================================================================
 * Anonymous evidence for one activity (see activities.js): per-question totals and plain-language suggestions.
 * Suggestions come from fixed thresholds and always describe "these responses", never an individual student.
 * ========================================================================== */

import { plainMath } from "../../../access-practice-lab/src/studio/core/math.js";
import {
  normalizeActivity,
  questionsOf,
} from "../../../access-practice-lab/src/studio/core/schema.js";
import { parseJson } from "./store.js";

export const MIN_EVIDENCE = 5;

/** option id -> plain text, for every kind of choice a question can carry. */
export const choicesOf = (q) =>
  new Map(
    [...(q.options || []), ...(q.fixOptions || []), ...(q.regions || [])].map((o) => [
      o.id,
      plainMath(o.text ?? o.label ?? ""),
    ]),
  );

const pct = (x, n) => (n ? Math.round((100 * x) / n) : null);
const avg = (x, n) => (n ? Math.round((10 * x) / n) / 10 : null);

/** Plain-language suggestions from fixed thresholds. They describe these responses, never a student. */
function suggestionsFor(label, s) {
  if (!s.graded) return [];
  const min = MIN_EVIDENCE;
  if (s.n < min)
    return [`${label}: too few responses to say (${s.n} so far; at least ${min} are needed).`];
  const out = [];
  const top = s.topWrong[0];
  if (top && top.count >= 3 && top.count / s.n >= 0.4)
    out.push(
      `${label}: in these responses, ${top.count} of ${s.n} chose "${top.text || top.choice}" first. Review the idea behind this question.`,
    );
  else if (s.firstTryPct < 50)
    out.push(
      `${label}: in these responses, ${s.n - s.firstCorrect} of ${s.n} were not correct on the first try. Review the idea behind this question.`,
    );
  if (s.avgHints >= 1.5)
    out.push(
      `${label}: in these responses, students used ${s.avgHints} hints on average. The question may need a clearer prompt or a scaffold.`,
    );
  if (s.revised / s.n >= 0.3 && s.finalPct - s.firstTryPct >= 20)
    out.push(
      `${label}: in these responses, ${s.revised} of ${s.n} changed their answer after feedback, and ${s.finalPct}% were correct at the end (${s.firstTryPct}% on the first try). The feedback appears to help.`,
    );
  if (s.firstTryPct >= 90)
    out.push(
      `${label}: ${s.firstTryPct}% were correct on the first try in these responses. This idea may not need more practice.`,
    );
  return out;
}

export async function evidence({ db }, _code, row) {
  const source = row.published_json
    ? parseJson(row.published_json, null)
    : parseJson(row.draft_json, null);
  const questions = questionsOf(normalizeActivity(source || {}));
  const res = await db
    .prepare(`SELECT * FROM class_platform_activity_stat WHERE activity_id = ?`)
    .bind(row.activity_id)
    .all();
  const stats = new Map((res.results || []).map((r) => [r.question_id, r]));
  const suggestions = [];
  const list = questions.map((q, i) => {
    const r = stats.get(q.id);
    const n = Number(r?.n || 0);
    const firstCorrect = Number(r?.first_correct || 0);
    const finalCorrect = Number(r?.final_correct || 0);
    const labels = choicesOf(q);
    const topWrong = Object.entries(parseJson(r?.wrong_json, {}))
      .map(([choice, count]) => ({ choice, text: labels.get(choice) || "", count: Number(count) }))
      .sort((a, b) => b.count - a.count || a.choice.localeCompare(b.choice))
      .slice(0, 3);
    const s = {
      id: q.id,
      format: q.format,
      prompt: plainMath(q.prompt).slice(0, 160),
      graded: q.format !== "short",
      n,
      firstCorrect,
      firstTryPct: pct(firstCorrect, n),
      finalPct: pct(finalCorrect, n),
      revised: Number(r?.revised || 0),
      avgHints: avg(Number(r?.hints || 0), n),
      topWrong,
    };
    suggestions.push(...suggestionsFor(`Question ${i + 1}`, s));
    const { firstCorrect: _omit, ...out } = s;
    return out;
  });
  return {
    ok: true,
    id: row.activity_id,
    published: row.state === "published",
    questions: list,
    suggestions,
    note: "These counts come from anonymous responses to this activity. They show how answers were distributed, not what any one student understands.",
  };
}
