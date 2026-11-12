// One small model call for the class platform's AI helpers. Same backends and the same model ids as the tutor
// (functions/api/tutor) and the reasoning reviewer: Claude Haiku when ANTHROPIC_API_KEY is set, otherwise the
// Workers AI binding `AI`, otherwise nothing, and every caller then falls back to its authored, rule-based path.
// The helpers that use this only ever ask the model to SELECT among authored ids, never to write learner-facing text.
//
// Gemini is opt-in per call (`allowGemini: true`) and, when allowed and GEMINI_API_KEY is bound, is tried first.
// Only a caller whose payload PLATFORM.md already lets leave the device may opt in (Mr. Neft, the typed-question guide);
// the class platform's student-writing helpers never do, so student text never reaches Gemini.

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
// Cheapest Stable Gemini text model (ai.google.dev pricing, 2026-11-12: $0.25 in / $1.50 out per 1M tokens).
// gemini-2.5-flash-lite is cheaper but limited to accounts that already used 2.5, so a new key may not reach it.
const GEMINI_MODEL = "gemini-3.1-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const WORKERS_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct";

export const modelAvailable = (env) => ({
  claude: Boolean(env?.ANTHROPIC_API_KEY),
  workersAi: Boolean(env?.AI),
});

async function viaClaude(env, { system, user, maxTokens }) {
  const res = await fetch(CLAUDE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const text = Array.isArray(data?.content)
    ? data.content
        .filter((b) => b?.type === "text" && typeof b.text === "string")
        .map((b) => b.text)
        .join("")
        .trim()
    : "";
  return text || null;
}

async function viaGemini(env, { system, user, maxTokens }) {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      // "minimal" is this model's default and cheapest level; thought tokens bill as output.
      generationConfig: {
        maxOutputTokens: maxTokens,
        thinkingConfig: { thinkingLevel: "minimal" },
      },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts
        .filter((p) => typeof p?.text === "string" && !p.thought)
        .map((p) => p.text)
        .join("")
        .trim()
    : "";
  return text || null;
}

async function viaWorkersAi(env, { system, user, maxTokens }) {
  const out = await env.AI.run(WORKERS_AI_MODEL, {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_tokens: maxTokens,
  });
  const text = typeof out?.response === "string" ? out.response.trim() : "";
  return text || null;
}

/** @returns {Promise<{ text: string, source: "gemini" | "claude" | "workers-ai" } | null>} null when no backend answered. */
export async function callModel(env, { system, user, maxTokens = 120, allowGemini = false }) {
  const args = { system, user, maxTokens };
  if (allowGemini && env?.GEMINI_API_KEY) {
    try {
      const text = await viaGemini(env, args);
      if (text) return { text, source: "gemini" };
    } catch {}
  }
  if (env?.ANTHROPIC_API_KEY) {
    try {
      const text = await viaClaude(env, args);
      if (text) return { text, source: "claude" };
    } catch {}
  }
  if (env?.AI) {
    try {
      const text = await viaWorkersAi(env, args);
      if (text) return { text, source: "workers-ai" };
    } catch {}
  }
  return null;
}

/** The first JSON object in a model reply (models wrap JSON in prose or fences), or null. */
export function firstJsonObject(text) {
  const start = String(text || "").indexOf("{");
  const end = String(text || "").lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const value = JSON.parse(text.slice(start, end + 1));
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
