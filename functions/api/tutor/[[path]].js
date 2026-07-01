/* =============================================================================
 * AI Tutor proxy — Cloudflare Pages Function (optional, opt-in)
 * -----------------------------------------------------------------------------
 * Route (catch-all under /api/tutor):
 *   POST /api/tutor          { mode, standard, itemText, studentWork, history }
 *   GET  /api/tutor/health   -> { ok, backend, live }
 *
 * Strategy (Claude Haiku only, graceful degradation):
 *   1. If env.ANTHROPIC_API_KEY is set -> call the Claude Messages API
 *      (Haiku) with a Socratic system prompt that NEVER reveals the final
 *      numeric answer for hint requests. Haiku is the ONLY backend so every
 *      student reply has one consistent voice and quality.
 *   2. Else -> return HTTP 503 { offline: true }. The client treats this as
 *      "Tutor is offline right now" and keeps the lesson fully usable.
 *
 * SAFETY:
 *   - No student PII is accepted or stored; inputs are length-capped and
 *     coerced to strings. Best-effort per-IP rate limiting.
 *   - Secrets are never echoed back to the client or logged.
 *   - All responses are JSON with permissive CORS so lessons served from a
 *     custom domain can reach this endpoint.
 * ========================================================================== */

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

// Anthropic Messages API.
const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_VERSION = "2023-06-01";

// Input caps (defensive — these are upper bounds, not expected sizes).
const CAP = {
  standard: 40,
  itemText: 2000,
  studentWork: 2000,
  historyTurns: 8,
  historyText: 1200,
  output: 700,
};

const MODES = new Set(["hint", "explain", "another", "diagnose", "teach"]);

// Best-effort in-memory rate limiter (per isolate). Not a hard guarantee
// across the edge, but it blunts accidental loops / abuse.
const RATE = { windowMs: 60_000, max: 20, hits: new Map() };

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

function clampStr(v, n) {
  if (typeof v !== "string") return "";
  return v.slice(0, n).trim();
}

function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "anon"
  );
}

function rateLimited(ip) {
  const now = Date.now();
  const cutoff = now - RATE.windowMs;
  let arr = RATE.hits.get(ip);
  if (!arr) {
    arr = [];
    RATE.hits.set(ip, arr);
  }
  // Drop timestamps outside the window.
  while (arr.length && arr[0] < cutoff) arr.shift();
  if (arr.length >= RATE.max) return true;
  arr.push(now);
  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (RATE.hits.size > 5000) {
    for (const [k, v] of RATE.hits) {
      if (!v.length || v[v.length - 1] < cutoff) RATE.hits.delete(k);
    }
  }
  return false;
}

// Normalize/validate the request body. Returns { ok, value } | { ok:false, error }.
function parseBody(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "bad-payload" };
  }
  const mode = clampStr(body.mode, 16) || "hint";
  if (!MODES.has(mode)) return { ok: false, error: "bad-mode" };

  const itemText = clampStr(body.itemText, CAP.itemText);
  if (!itemText) return { ok: false, error: "missing-item" };

  const standard = clampStr(body.standard, CAP.standard);
  const studentWork = clampStr(body.studentWork, CAP.studentWork);

  let history = [];
  if (Array.isArray(body.history)) {
    history = body.history
      .filter((t) => t && typeof t === "object")
      .slice(-CAP.historyTurns)
      .map((t) => ({
        role: t.role === "assistant" ? "assistant" : "user",
        text: clampStr(t.text, CAP.historyText),
      }))
      .filter((t) => t.text);
  }

  return {
    ok: true,
    value: { mode, standard, itemText, studentWork, history },
  };
}

function systemPrompt(mode, standard) {
  const stdLine = standard
    ? `The problem targets math standard ${standard}. `
    : "";
  const base =
    `You are a warm, patient Grade 6 math tutor for a multilingual classroom. ${stdLine}` +
    `Use short sentences and simple words. Be encouraging. Never shame a wrong answer. ` +
    `Format math as plain text (use / for division and ^ for exponents); no LaTeX.`;

  if (mode === "hint") {
    return (
      base +
      ` The student wants a HINT, not the answer. Rules you MUST follow: ` +
      `(1) Do NOT state the final numeric or final answer. ` +
      `(2) Do NOT do the last calculation step for them. ` +
      `(3) Ask ONE guiding question OR point to the next small step, in 1-2 short sentences. ` +
      `(4) Build on what the student already tried if they shared work.`
    );
  }
  if (mode === "explain") {
    return (
      base +
      ` The student wants you to EXPLAIN the idea behind this problem. ` +
      `Explain the concept and the method in 2-4 short sentences using a tiny everyday example. ` +
      `You may show the method, but keep it about understanding, not just the one answer.`
    );
  }
  if (mode === "diagnose") {
    return (
      base +
      ` The student shared their work. Find the MISCONCEPTION, not just the mistake. ` +
      `Rules you MUST follow: ` +
      `(1) Do NOT give the final answer or redo the full problem. ` +
      `(2) Name, in kid-friendly words, the ONE thinking-error you see (e.g. "you added the ` +
      `denominators — that is the most common fraction mix-up"). ` +
      `(3) If the work looks correct, say what they did well and confirm the reasoning is sound. ` +
      `(4) End with ONE tiny next step to self-check. Keep it to 2-4 short, warm sentences.`
    );
  }
  if (mode === "teach") {
    return (
      base +
      ` You are "Robo", a friendly robot who is a curious LEARNER — the student is teaching YOU. ` +
      `The protégé effect: students learn by explaining. Rules you MUST follow: ` +
      `(1) Stay in character as a confused-but-eager learner; the student is the teacher. ` +
      `(2) Ask ONE simple, naive follow-up question about the step they explained, so they have to ` +
      `make it clearer (e.g. "Wait — why do we flip the second fraction and not the first?"). ` +
      `(3) Never lecture or give the answer yourself; only ask or reflect back. ` +
      `(4) If their explanation is clear and correct, cheer briefly, then ask a slightly deeper ` +
      `"what if" question. Keep every reply to 1-3 short sentences.`
    );
  }
  // another
  return (
    base +
    ` Create ONE NEW practice problem at the same grade level and same skill as the example, ` +
    `with different numbers and context. Keep it short. Do NOT include the answer or a solution — ` +
    `just the new problem so the student can try it.`
  );
}

function userPrompt(v) {
  const lines = [`Problem the student is working on:\n${v.itemText}`];
  if (v.studentWork)
    lines.push(`\nWhat the student has tried so far:\n${v.studentWork}`);
  if (v.mode === "hint")
    lines.push(`\nGive me a hint for the next step (not the answer).`);
  else if (v.mode === "explain") lines.push(`\nExplain why / how this works.`);
  else if (v.mode === "diagnose")
    lines.push(
      `\nLook at my work above and tell me where my thinking went wrong (or confirm it is right).`,
    );
  else if (v.mode === "teach")
    lines.push(
      `\nI am the teacher and you are Robo the learner. Ask me one question about what I just explained.`,
    );
  else lines.push(`\nGive me another problem like this to practice.`);
  return lines.join("\n");
}

async function callClaude(env, v) {
  const messages = [];
  for (const t of v.history) {
    messages.push({ role: t.role, content: t.text });
  }
  messages.push({ role: "user", content: userPrompt(v) });

  const resp = await fetch(CLAUDE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": CLAUDE_VERSION,
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: CAP.output,
      system: systemPrompt(v.mode, v.standard),
      messages,
    }),
  });

  if (!resp.ok) {
    // Never surface the upstream body (may contain account detail). Capture only
    // the HTTP status + Anthropic's error *type* classification so a gated
    // ?debug=1 can report WHY Claude refused (bad key vs. bad model vs. limit).
    let upstreamType = "";
    try {
      const errData = await resp.json();
      upstreamType = (errData && errData.error && errData.error.type) || "";
    } catch (e) {
      /* body not JSON — ignore */
    }
    return {
      ok: false,
      status: resp.status === 429 ? 429 : 502,
      upstreamStatus: resp.status,
      upstreamType,
    };
  }

  const data = await resp.json().catch(() => null);
  const text = Array.isArray(data?.content)
    ? data.content
        .filter((b) => b && b.type === "text" && typeof b.text === "string")
        .map((b) => b.text)
        .join("")
        .trim()
    : "";
  if (!text) return { ok: false, status: 502 };
  return { ok: true, reply: text, source: "claude" };
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  const seg = (params.path && params.path[0]) || "";
  const hasClaude = !!env.ANTHROPIC_API_KEY;

  // Health works without any backend so the client can probe availability.
  // `claude` reports whether the key is BOUND (not whether it is valid), so a
  // "live:true but every POST is offline" state means the ANTHROPIC_API_KEY is
  // bad/unfunded or the model id was rejected upstream.
  if (seg === "health" && method === "GET") {
    return json({
      ok: true,
      backend: hasClaude ? "claude" : "none",
      live: hasClaude,
      claude: hasClaude,
    });
  }

  if (method !== "POST" || seg) {
    return json({ ok: false, error: "not-found" }, 404);
  }

  // No backend configured -> graceful offline (client keeps working).
  if (!hasClaude) {
    return json(
      {
        ok: false,
        offline: true,
        error: "tutor-not-configured",
        message: "AI tutor backend is not configured. Set ANTHROPIC_API_KEY.",
      },
      503,
    );
  }

  if (rateLimited(clientIp(request))) {
    return json({ ok: false, error: "rate-limited" }, 429);
  }

  const raw = await request.json().catch(() => null);
  const parsed = parseBody(raw);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);

  try {
    // Haiku-only: the tutor answers exclusively with Claude Haiku so every
    // student reply has one consistent voice and quality. No Workers AI (llama)
    // fallback — if Claude is unavailable we return the graceful offline state
    // rather than silently switching to a different model.
    let out = null;
    if (hasClaude) {
      out = await callClaude(env, parsed.value);
    }

    if (!out || !out.ok) {
      // Gated diagnostic: ?debug=1 echoes only the upstream status + error type
      // (no key, no content) so we can pinpoint a misconfig. Temporary.
      const dbg =
        new URL(request.url).searchParams.get("debug") === "1"
          ? {
              claudeStatus: out ? out.upstreamStatus : null,
              claudeError: out ? out.upstreamType : null,
              model: CLAUDE_MODEL,
            }
          : {};
      return json(
        { ok: false, offline: true, error: "tutor-unavailable", ...dbg },
        out && out.status === 429 ? 429 : 503,
      );
    }
    return json({
      ok: true,
      reply: out.reply,
      mode: parsed.value.mode,
      source: out.source,
    });
  } catch (err) {
    // Generic — never leak the error detail (may reference internals).
    return json({ ok: false, offline: true, error: "server-error" }, 503);
  }
}
