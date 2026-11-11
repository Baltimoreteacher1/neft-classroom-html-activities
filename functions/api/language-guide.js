/* =============================================================================
 * POST /api/language-guide — Mr. Neft, the Language Page guide, answers a typed question.
 * -----------------------------------------------------------------------------
 * Body: { question, page?, step?, grades?, lang?, history? }
 *   question  the teacher's or family's question (capped at 400 characters)
 *   page      where it was asked: "tour" | "start" | "family" | "site-guide"
 *   step      the tour step name on screen (capped)
 *   grades    a grade choice id (K, 1, 2-3, 4-5, 6-8); picks which activities the guide talks about
 *   lang      "en" | "es"
 *   history   up to 3 earlier { q, a } turns, so a follow-up question has its context
 *
 * The model is grounded: the system prompt is GUIDE_RULES plus guideContext(), built from the same verified data the
 * pages render (access-practice-lab/src/intro/guide-knowledge.js). callModel() uses Claude Haiku when
 * ANTHROPIC_API_KEY is bound, else the Workers AI binding, else nothing: then this answers 503 { offline: true } and
 * the page shows answers from the Site Guide instead. No student data is asked for.
 *
 * Guards (language-guide/guard.js): the shared per-isolate limiter below, plus a per-IP hourly cap and a site-wide
 * daily cap kept in the Workers Cache API. Over a cap the answer is 429 { ok: false, limited: true } and the page
 * shows the Site Guide with a calm line.
 *
 * Log (Joel, 2026-11-11): the question, with names, emails and phone numbers replaced, plus page, step, grade choice,
 * language, whether the model answered and the time, is kept 90 days in PLAN_DOCS under lp-guide-q:<date>:<id>.
 * Nothing else (no IP, no history, no answer). Read back by GET /api/language-guide/questions (teacher key).
 * ============================================================================= */
import { GUIDE_RULES, guideContext } from "../../access-practice-lab/src/intro/guide-knowledge.js";
import { badRequest, handler, json } from "../_lib/http.js";
import { callModel } from "../_lib/model-call.js";
import { limitedResponse, logQuestion, overCap } from "./language-guide/guard.js";

const PAGES = new Set(["tour", "start", "family", "site-guide"]);
const PICKS = new Set(["K", "1", "2-3", "4-5", "6-8"]);
const clip = (v, n) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");

export const onRequest = handler({
  methods: ["POST"],
  rateLimit: { max: 12, windowMs: 60_000 },
  maxBodyBytes: 16_000,
  async handle({ request, env, body, waitUntil }) {
    const question = clip(body?.question, 400);
    if (question.length < 2) return badRequest("question is required");
    const page = PAGES.has(body?.page) ? body.page : "tour";
    const pick = PICKS.has(body?.grades) ? body.grades : "6-8";
    const lang = body?.lang === "es" ? "es" : "en";
    const step = clip(body?.step, 60);
    const history = (Array.isArray(body?.history) ? body.history : [])
      .slice(-3)
      .map((t) => ({ q: clip(t?.q, 400), a: clip(t?.a, 700) }))
      .filter((t) => t.q && t.a);

    const system = `${GUIDE_RULES}\n\nFACTS:\n${guideContext({ pick, page, step })}`;
    const earlier = history
      .map((t) => `Earlier question: ${t.q}\nYour earlier answer: ${t.a}`)
      .join("\n\n");
    const user = `${earlier ? `${earlier}\n\n` : ""}Language: ${lang}\nQuestion: ${question}`;

    if (await overCap(request)) return limitedResponse();

    const reply = await callModel(env, { system, user, maxTokens: 320 });
    const logged = logQuestion(env, {
      question,
      page,
      step,
      grades: PICKS.has(body?.grades) ? body.grades : "",
      lang,
      answered: Boolean(reply),
    });
    if (typeof waitUntil === "function") waitUntil(logged);
    else await logged;
    if (!reply) return json({ ok: false, offline: true }, 503);
    return { ok: true, answer: reply.text.slice(0, 1200), source: reply.source };
  },
});
