// One small model call for the class platform's AI helpers. Same backends and the same model ids as the tutor
// (functions/api/tutor) and the reasoning reviewer: Claude Haiku when ANTHROPIC_API_KEY is set, otherwise the
// Workers AI binding `AI`, otherwise nothing, and every caller then falls back to its authored, rule-based path.
// The helpers that use this only ever ask the model to SELECT among authored ids, never to write learner-facing text.

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
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

/** @returns {Promise<{ text: string, source: "claude" | "workers-ai" } | null>} null when no backend answered. */
export async function callModel(env, { system, user, maxTokens = 120 }) {
  const args = { system, user, maxTokens };
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
