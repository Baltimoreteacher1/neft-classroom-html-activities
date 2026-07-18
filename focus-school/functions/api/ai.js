/* =============================================================================
 * AI Support proxy — Cloudflare Pages Function for Focus School.
 * -----------------------------------------------------------------------------
 *   POST /api/ai   { mode, messages:[{role:"user"|"model", text}], image?, name? }
 *   GET  /api/ai   -> { ok, backend, live }   (health check)
 *
 * Strategy (Claude-primary, graceful degradation):
 *   1. If env.ANTHROPIC_API_KEY is set -> call the Anthropic Messages API
 *      (Claude). This is the primary backend — fast, and the same provider the
 *      rest of the platform's AI (tutor, study-pack) already uses.
 *   2. Else if env.GEMINI_API_KEY is set -> call Google Gemini (fallback).
 *   3. Else if env.AI (Workers AI binding) is available -> Workers AI fallback.
 *   4. Else -> HTTP 503 { offline:true }; the client shows a friendly notice.
 *
 *   A backend that is CONFIGURED but fails a given request (quota, 5xx, network)
 *   degrades to the next configured backend, and only if EVERY configured
 *   backend fails do we surface a friendly reply — never the "not set up" 503
 *   (that is reserved for the genuinely-unconfigured case).
 *
 * SAFETY:
 *   - No PII is stored; inputs are length/count-capped and coerced to strings.
 *   - Best-effort per-IP rate limiting. Secrets are never echoed or logged; the
 *     upstream error body is never surfaced (it can carry account detail).
 *   - The system prompt makes it a homework *helper*: hints + explanations,
 *     never just the final answer for graded work.
 * ========================================================================== */

// Same-origin only: the app always calls /api/ai from its own origin, which
// never needs a CORS grant. No CORS headers = browsers block every cross-origin
// caller, so the paid AI keys can't be scripted against from a third-party page.
const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

// Anthropic Messages API (primary). Hint mode uses the fast, low-cost Haiku
// tier — plenty capable for middle-school hints and quick to respond. Solve
// mode ("show me the whole answer, step by step") uses Sonnet 5 for deeper
// reasoning. Both are confirmed available on this account.
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_VERSION = "2023-06-01";
const CLAUDE_MODELS = {
  hint: "claude-haiku-4-5-20251001",
  solve: "claude-sonnet-5",
};

const DEFAULT_GEMINI_MODEL = "gemini-pro-latest"; // full-tier Gemini Pro fallback
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
  const backend = env.ANTHROPIC_API_KEY
    ? "claude"
    : env.GEMINI_API_KEY
      ? "gemini"
      : env.AI
        ? "workers-ai"
        : "none";
  return json({ ok: true, backend, live: backend !== "none" });
}

// --- Anthropic (Claude) ------------------------------------------------------
// Returns { reply } on success, or throws to let the caller degrade to Gemini.
async function callClaude(env, { mode, systemPrompt, messages, image }) {
  const model = CLAUDE_MODELS[mode === "solve" ? "solve" : "hint"];
  // Claude uses assistant/user roles; the client speaks Gemini's user/model.
  const claudeMessages = messages.map((m) => ({
    role: m.role === "model" ? "assistant" : "user",
    content: m.text,
  }));
  // Attach the homework photo (if any) to the latest user turn as a vision block.
  if (image && claudeMessages.length) {
    const last = claudeMessages[claudeMessages.length - 1];
    last.content = [
      { type: "image", source: { type: "base64", media_type: image.mime, data: image.data } },
      { type: "text", text: typeof last.content === "string" ? last.content : "" },
    ];
  }
  const res = await fetch(CLAUDE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": CLAUDE_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: CAP.output,
      system: systemPrompt,
      messages: claudeMessages,
    }),
  });
  if (!res.ok) {
    const err = new Error("claude-upstream");
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const reply = (Array.isArray(data.content) ? data.content : [])
    .filter((b) => b && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("")
    .trim();
  return { reply };
}

// --- Google Gemini (fallback) ------------------------------------------------
async function callGemini(env, { systemPrompt, messages, image }) {
  const model = clampStr(env.GEMINI_MODEL, 60) || DEFAULT_GEMINI_MODEL;
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(model) +
    ":generateContent?key=" +
    encodeURIComponent(env.GEMINI_API_KEY);
  const contents = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));
  if (image && contents.length) {
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
      generationConfig: { maxOutputTokens: CAP.output, temperature: 0.7 },
      safetySettings: [
        "HARM_CATEGORY_HARASSMENT",
        "HARM_CATEGORY_HATE_SPEECH",
        "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "HARM_CATEGORY_DANGEROUS_CONTENT",
      ].map((category) => ({ category, threshold: "BLOCK_MEDIUM_AND_ABOVE" })),
    }),
  });
  if (!res.ok) {
    const err = new Error("gemini-upstream");
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const reply = (data.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || "")
    .join("")
    .trim();
  return { reply };
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
          mime: /^image\/(png|jpe?g|webp|gif|heic|heif)$/i.test(clampStr(body.image.mime, 40))
            ? clampStr(body.image.mime, 40)
            : "image/jpeg",
          data: body.image.data.slice(0, CAP.image),
        }
      : null;

  const payload = { mode, systemPrompt, messages, image };
  let busyReply = null;

  // 1) Claude (primary)
  if (env.ANTHROPIC_API_KEY) {
    try {
      const { reply } = await callClaude(env, payload);
      if (reply) return json({ reply, backend: "claude" });
    } catch (error) {
      busyReply =
        error && error.status === 429
          ? "I'm getting a lot of questions right now — give me a minute, then ask again. ⏳"
          : "I couldn't think of an answer just now. Try asking again in a moment. 🙂";
    }
  }

  // 2) Gemini (fallback)
  if (env.GEMINI_API_KEY) {
    try {
      const { reply } = await callGemini(env, payload);
      if (reply) return json({ reply, backend: "gemini" });
      busyReply = busyReply || "Let's try that a different way — can you tell me a bit more? 🙂";
    } catch (error) {
      busyReply =
        error && error.status === 429
          ? "I'm getting a lot of questions right now — give me a minute, then ask again. ⏳"
          : busyReply || "I couldn't reach my brain just now — try asking again in a moment. 🙂";
    }
  }

  // 3) Workers AI fallback
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

  // A backend was configured but couldn't answer (e.g. quota/429/5xx). Surface a
  // friendly, accurate message as a normal reply — not the "not set up" notice.
  if (busyReply) return json({ reply: busyReply, backend: "busy" });

  // 4) Nothing configured at all.
  return json(
    {
      offline: true,
      error: "AI is not set up yet. Add an ANTHROPIC_API_KEY (or GEMINI_API_KEY) to enable it.",
    },
    503,
  );
}
