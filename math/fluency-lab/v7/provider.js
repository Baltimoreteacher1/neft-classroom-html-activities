// EduWonderLab 7.0 tutor provider boundary. This is the ONLY place a language model could ever be consulted, and by
// default it is not: with no `endpoint` configured every request is answered by the deterministic coach (tutor.js).
// If an endpoint is configured, its reply must pass a strict schema, a length cap, a language check and the answer-leak
// filter, and any failure, timeout or budget exhaustion falls back to the deterministic move. The model is never the
// source of mathematical truth: correctness and misconception names are computed before and outside this call.
// STATUS: no endpoint, key or server function is shipped. See docs/fluency-lab-7/report.md.
import { leaksAnswer, nextMove } from "./tutor.js";

export const LIMITS = { maxChars: 280, timeoutMs: 6000, retries: 1, perSession: 12 };

export function validateReply(reply, item, { allowReveal = false } = {}) {
  if (!reply || typeof reply !== "object") return { ok: false, why: "not-object" };
  const { text, kind } = reply;
  if (typeof text !== "string" || !text.trim()) return { ok: false, why: "no-text" };
  if (text.length > LIMITS.maxChars) return { ok: false, why: "too-long" };
  if (!["noticing", "representation", "next-step", "reveal", "confirm"].includes(kind)) return { ok: false, why: "bad-kind" };
  if (kind === "reveal" && !allowReveal) return { ok: false, why: "reveal-not-allowed" };
  if (kind !== "reveal" && leaksAnswer(text, item)) return { ok: false, why: "leaks-answer" };
  if (/https?:\/\/|<[a-z/][^>]*>/i.test(text)) return { ok: false, why: "markup-or-link" };
  return { ok: true };
}

export function createCoach({ endpoint = null, fetchImpl = globalThis.fetch, limits = {}, now = () => Date.now() } = {}) {
  const cfg = { ...LIMITS, ...limits };
  const stats = { calls: 0, fallbacks: 0, rejected: [], deterministic: 0 };
  async function ask(input) {
    const base = nextMove(input);
    // Never ask a model about a correct answer, and never let one produce the reveal.
    if (!endpoint || !fetchImpl || base.correct || base.reveal || stats.calls >= cfg.perSession) {
      stats.deterministic += 1;
      return { ...base, source: "deterministic" };
    }
    for (let attempt = 0; attempt <= cfg.retries; attempt += 1) {
      stats.calls += 1;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
      try {
        // Only the question, the move kind and a trimmed response leave the page: no profile, no name, no history.
        const res = await fetchImpl(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ question: input.item.question, kind: base.kind, response: String(input.response ?? "").slice(0, 80), lang: input.lang || "en" }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const reply = await res.json();
        const verdict = validateReply(reply, input.item);
        if (verdict.ok) return { ...base, text: { en: reply.text, es: reply.text }, kind: reply.kind, source: "model" };
        stats.rejected.push(verdict.why);
        break;
      } catch (error) {
        stats.rejected.push(error?.name === "AbortError" ? "timeout" : "error");
      } finally {
        clearTimeout(timer);
      }
    }
    stats.fallbacks += 1;
    return { ...base, source: "fallback" };
  }
  return { ask, stats };
}
