// Cloudflare Pages Function: POST /api/ai
//
// Tiny, locked-down proxy to the Anthropic Messages API so the API key never
// ships to the browser. Only does ONE thing: turn a school assignment into a
// short list of concrete, kid-friendly steps. The key lives in the project
// secret ANTHROPIC_API_KEY (set with `wrangler pages secret put ANTHROPIC_API_KEY`).
//
// Degrades gracefully: if the key isn't configured the client falls back to its
// built-in step templates, so the app never breaks when AI is unavailable.

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TITLE = 200;
const MAX_CLASS = 80;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });

export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: "ai_not_configured" }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const title = String(body?.title || "")
    .slice(0, MAX_TITLE)
    .trim();
  const className = String(body?.className || "")
    .slice(0, MAX_CLASS)
    .trim();
  if (!title) return json({ error: "missing_title" }, 400);

  const userMsg =
    `Break this school assignment into 4 to 7 small, concrete steps a middle-school ` +
    `student can check off one at a time. Each step is a short action (3 to 10 words), ` +
    `starts with a verb, and is specific to the task — no generic "do your homework".\n\n` +
    `Class: ${className || "(not given)"}\nAssignment: ${title}\n\n` +
    `Return ONLY a JSON array of step strings. No prose, no numbering.`;

  let resp;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system:
          "You are a calm, encouraging study coach for a middle-school student. " +
          "You only help break schoolwork into small steps. Keep it simple and doable.",
        messages: [{ role: "user", content: userMsg }],
      }),
    });
  } catch {
    return json({ error: "upstream_unreachable" }, 502);
  }

  if (!resp.ok) {
    return json({ error: "upstream_error", status: resp.status }, 502);
  }

  const data = await resp.json();
  const text = (data?.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  let steps = [];
  try {
    const match = text.match(/\[[\s\S]*\]/);
    steps = JSON.parse(match ? match[0] : text);
  } catch {
    // Fallback: split lines, strip bullets/numbering.
    steps = text
      .split("\n")
      .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
      .filter(Boolean);
  }

  steps = (Array.isArray(steps) ? steps : [])
    .map((s) => String(s).slice(0, 120).trim())
    .filter(Boolean)
    .slice(0, 8);

  if (!steps.length) return json({ error: "no_steps" }, 502);
  return json({ steps });
}
// Non-POST methods get an automatic 405 from Pages (no other handler exported).
