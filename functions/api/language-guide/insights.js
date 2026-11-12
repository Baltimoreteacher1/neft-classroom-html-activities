/* =============================================================================
 * GET /api/language-guide/insights?days=30 — what teachers keep asking Mr. Neft, grouped into themes, plus the
 * questions the authored guide probably does not answer yet.
 * -----------------------------------------------------------------------------
 * Teacher only (x-teacher-key, same gate as questions.js). The model reads ONLY the anonymous question log's most
 * frequent questions (already stripped of names, emails and phone numbers by guard.js) and returns question NUMBERS:
 * its words are limited to a short theme label and a one-line reason, and every number must exist in the input.
 * Nothing it writes is shown to a student; a person decides whether to author a new answer.
 *
 * Returns { ok, days, total, source, themes: [{ label, count, questions: [{ question, count }] }],
 * gaps: [{ question, count, why }], top } where `top` is the plain frequency list from questions.js. With fewer than
 * MIN_QUESTIONS distinct questions, no model, or an unusable reply, `source` is null and themes/gaps are empty.
 * ============================================================================= */
import { handler, json, unauthorized } from "../../_lib/http.js";
import { callModel, firstJsonObject } from "../../_lib/model-call.js";
import { sameKey, summarizeQuestions } from "./guard.js";

const MIN_QUESTIONS = 5;
const MAX_DAYS = 90;
const MAX_THEMES = 6;
const MAX_GAPS = 5;

const SYSTEM = `You help the owner of a classroom language-practice site see what teachers ask its AI guide.
You get a numbered list of anonymous questions with how often each was asked. Reply with ONLY one JSON object:
{"themes":[{"label":"2-5 words","questions":[question numbers]}],"gaps":[{"question":question number,"why":"one short sentence"}]}
Rules: at most ${MAX_THEMES} themes; a question number appears in at most one theme; use only numbers from the list;
"gaps" are questions a short authored FAQ answer would likely not cover well (at most ${MAX_GAPS}); do not invent
questions, names or facts; no text outside the JSON.`;

const clip = (v, n) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");
const validNumber = (v, n) => Number.isInteger(v) && v >= 1 && v <= n;

function daysParam(raw) {
  const n = Math.round(Number(raw));
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), MAX_DAYS) : 30;
}

/** Keeps only what the model may contribute (labels, reasons, which listed question) and drops everything else. */
export function readInsights(reply, top) {
  const parsed = firstJsonObject(reply);
  if (!parsed) return null;
  const used = new Set();
  const themes = [];
  for (const t of Array.isArray(parsed.themes) ? parsed.themes : []) {
    const label = clip(t?.label, 60);
    const picks = [
      ...new Set(
        (Array.isArray(t?.questions) ? t.questions : []).filter(
          (n) => validNumber(n, top.length) && !used.has(n),
        ),
      ),
    ];
    if (!label || !picks.length || themes.length >= MAX_THEMES) continue;
    for (const n of picks) used.add(n);
    const questions = picks.map((n) => ({
      question: top[n - 1].question,
      count: top[n - 1].count,
    }));
    themes.push({ label, count: questions.reduce((sum, q) => sum + q.count, 0), questions });
  }
  const seen = new Set();
  const gaps = [];
  for (const g of Array.isArray(parsed.gaps) ? parsed.gaps : []) {
    const why = clip(g?.why, 160);
    if (!validNumber(g?.question, top.length) || seen.has(g.question) || !why) continue;
    if (gaps.length >= MAX_GAPS) break;
    seen.add(g.question);
    gaps.push({ question: top[g.question - 1].question, count: top[g.question - 1].count, why });
  }
  return themes.length || gaps.length ? { themes, gaps } : null;
}

export const onRequest = handler({
  methods: ["GET"],
  rateLimit: { max: 10, windowMs: 60_000 },
  async handle({ request, env }) {
    if (!sameKey(request.headers.get("x-teacher-key"), env?.TEACHER_KEY)) return unauthorized();
    if (!env?.PLAN_DOCS?.list)
      return json({ ok: false, error: "question log store not bound" }, 503);
    const days = daysParam(new URL(request.url).searchParams.get("days"));
    const { total, top } = await summarizeQuestions(env.PLAN_DOCS, days);
    const base = { ok: true, days, total, source: null, themes: [], gaps: [], top };
    if (top.length < MIN_QUESTIONS) return base;

    const list = top.map((q, i) => `${i + 1}. (${q.count}x) ${q.question}`).join("\n");
    const reply = await callModel(env, {
      system: SYSTEM,
      user: `Questions from the last ${days} days:\n${list}`,
      maxTokens: 700,
      allowGemini: true,
    });
    const insights = reply ? readInsights(reply.text, top) : null;
    return insights ? { ...base, source: reply.source, ...insights } : base;
  },
});
