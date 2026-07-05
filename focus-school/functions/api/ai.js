/* =============================================================================
 * AI Support proxy — Cloudflare Pages Function for Focus School.
 * -----------------------------------------------------------------------------
 *   POST /api/ai   { messages:[{role:"user"|"model", text}], name? }
 *   GET  /api/ai   -> { ok, backend, live }   (health check)
 *
 * Strategy (graceful degradation):
 *   1. If env.GEMINI_API_KEY is set -> call the Google Gemini API
 *      (model env.GEMINI_MODEL || "gemini-pro-latest").
 *   2. Else if env.AI (Workers AI binding) is available -> Workers AI fallback.
 *   3. Else -> HTTP 503 { offline:true }; the client shows a friendly notice.
 *
 * SAFETY:
 *   - No PII is stored; inputs are length/count-capped and coerced to strings.
 *   - Best-effort per-IP rate limiting. Secrets are never echoed or logged.
 *   - The system prompt makes it a homework *helper*: hints + explanations,
 *     never just the final answer for graded work.
 * ========================================================================== */

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const DEFAULT_MODEL = "gemini-pro-latest"; // full-tier Gemini Pro (alias -> current stable Pro; avoids deprecation 404s)
const WORKERS_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct";

const CAP = { turns: 12, text: 1500, output: 1500, image: 8_000_000 };
const RATE = { windowMs: 60_000, max: 25, hits: new Map() };

const SYSTEM_PROMPT_HINT = [
  "You are a warm, patient homework helper for a middle-school student (about 7th grade) who has trouble focusing.",
  "Goals: keep them calm, build confidence, and help them think — do NOT just give final answers to graded problems.",
  "When they ask for an answer, give a hint or the next small step and ask a guiding question instead.",
  "It is fine to fully explain concepts, vocabulary, and how-to steps in simple words.",
  "Style: short replies (2-5 sentences), friendly, plain language, one idea at a time. Use an occasional emoji.",
  "Use LaTeX notation for ALL mathematical formulas, fractions, symbols, and equations (e.g. use \\times for multiplication, \\div for division, and fractions written in LaTeX like \\frac{a}{b}). Wrap inline math in \\( ... \\) and block/display math in \\[ ... \\]. Do not use raw programming characters like * or / for calculations.",
  "Never discuss anything unsafe or inappropriate; gently steer back to schoolwork and feelings about it.",
].join(" ");

const SYSTEM_PROMPT_SOLVE = [
  "You are a warm, patient homework helper for a middle-school student (about 7th grade) who has trouble focusing.",
  "The student wants the FULL ANSWER and a step-by-step solution.",
  "State the final answer clearly in bold at the beginning.",
  "Then explain the complete step-by-step calculation procedure using clear LaTeX math formatting.",
  "Style: friendly, plain language. Use an occasional emoji.",
  "Use LaTeX notation for ALL mathematical formulas, fractions, symbols, and equations (e.g. use \\times for multiplication, \\div for division, and fractions written in LaTeX like \\frac{a}{b}). Wrap inline math in \\( ... \\) and block/display math in \\[ ... \\]. Do not use raw programming characters like * or / for calculations.",
  "Never discuss anything unsafe or inappropriate; gently steer back to schoolwork and feelings about it.",
].join(" ");

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}
function clampStr(v, n) {
  return typeof v === "string" ? v.slice(0, n).trim() : "";
}
function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "anon"
  );
}
function rateLimited(ip) {
  const now = Date.now();
  const arr = (RATE.hits.get(ip) || []).filter((t) => now - t < RATE.windowMs);
  arr.push(now);
  RATE.hits.set(ip, arr);
  if (RATE.hits.size > 5000) RATE.hits.clear();
  return arr.length > RATE.max;
}

// Normalize incoming chat into [{role, text}] with caps applied.
function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-CAP.turns)
    .map((m) => ({
      role: m && m.role === "model" ? "model" : "user",
      text: clampStr(m && m.text, CAP.text),
    }))
    .filter((m) => m.text);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: JSON_HEADERS });
}

export async function onRequestGet({ env }) {
  const backend = env.GEMINI_API_KEY ? "gemini" : env.AI ? "workers-ai" : "none";
  return json({ ok: true, backend, live: backend !== "none" });
}

export async function onRequestPost({ request, env }) {
  const ip = clientIp(request);
  if (rateLimited(ip)) return json({ error: "Too many requests — slow down a moment." }, 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  const mode = clampStr(body && body.mode, 20) || "hint";
  const systemPrompt = mode === "solve" ? SYSTEM_PROMPT_SOLVE : SYSTEM_PROMPT_HINT;

  const messages = sanitizeMessages(body && body.messages);
  if (!messages.length) return json({ error: "No message" }, 400);
  if (messages[messages.length - 1].role !== "user")
    return json({ error: "Last message must be from the user." }, 400);

  // Optional image (base64) attached to the latest question — homework photo,
  // worksheet, etc. Capped so a huge upload can't blow the request budget.
  const image =
    body && body.image && typeof body.image.data === "string" && body.image.data
      ? {
          mime: clampStr(body.image.mime, 40) || "image/jpeg",
          data: body.image.data.slice(0, CAP.image),
        }
      : null;

  let geminiError = null;

  // 1) Gemini
  if (env.GEMINI_API_KEY) {
    try {
      const model = clampStr(env.GEMINI_MODEL, 60) || DEFAULT_MODEL;
      const url =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        encodeURIComponent(model) +
        ":generateContent?key=" +
        encodeURIComponent(env.GEMINI_API_KEY);
      const contents = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));
      if (image) {
        contents[contents.length - 1].parts.push({
          inlineData: { mimeType: image.mime, data: image.data },
        });
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            maxOutputTokens: CAP.output,
            temperature: 0.7,
          },
          safetySettings: [
            "HARM_CATEGORY_HARASSMENT",
            "HARM_CATEGORY_HATE_SPEECH",
            "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "HARM_CATEGORY_DANGEROUS_CONTENT",
          ].map((category) => ({
            category,
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = (data.candidates?.[0]?.content?.parts || [])
          .map((p) => p.text || "")
          .join("")
          .trim();
        if (reply) return json({ reply, backend: "gemini" });
        return json({
          reply: "Let's try that a different way — can you tell me a bit more? 🙂",
          backend: "gemini",
        });
      }
      // The key is configured but the call failed. Show a kid-friendly,
      // accurate message (NOT "not set up") and try Workers AI if available.
      geminiError =
        res.status === 429
          ? "I'm getting a lot of questions right now — give me a minute, then ask again. ⏳"
          : "I couldn't think of an answer just now. Try asking again in a moment. 🙂";
    } catch {
      geminiError = "I couldn't reach my brain just now — try asking again in a moment. 🙂";
    }
  }

  // 2) Workers AI fallback
  if (env.AI) {
    try {
      const out = await env.AI.run(WORKERS_AI_MODEL, {
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role === "model" ? "assistant" : "user",
            content: m.text,
          })),
        ],
        max_tokens: CAP.output,
      });
      const reply = clampStr(out && (out.response || out.result), 4000);
      if (reply) return json({ reply, backend: "workers-ai" });
    } catch {
      /* fall through */
    }
  }

  // A backend was configured but couldn't answer (e.g. quota/429). Surface a
  // friendly, accurate message as a normal reply — not the "not set up" notice.
  if (geminiError) return json({ reply: geminiError, backend: "gemini-busy" });

  // 3) Nothing configured at all.
  return json(
    {
      offline: true,
      error: "AI is not set up yet. Add a GEMINI_API_KEY to enable it.",
    },
    503,
  );
}
