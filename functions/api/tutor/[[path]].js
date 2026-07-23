/* =============================================================================
 * AI Tutor proxy — Cloudflare Pages Function (optional, opt-in)
 * -----------------------------------------------------------------------------
 * Route (catch-all under /api/tutor):
 *   POST /api/tutor          { mode, standard, itemText, studentWork, history,
 *                              hintLevel?, replyLang? }
 *   GET  /api/tutor/health   -> { ok, backend, live }
 *
 * Optional fields:
 *   - hintLevel (mode "hint" only): integer 1-3, default 1; anything invalid
 *     falls back to 1. Ladder: 1 = one guiding question / next small step;
 *     2 = name the exact next operation or model and why it helps (still no
 *     answer); 3 = fully worked PARALLEL example (same skill, different
 *     numbers) then "try the same steps" — never the student's actual answer.
 *   - replyLang (any mode except "translate"): plain language name, e.g.
 *     "Spanish". The tutor replies entirely in that language with simple
 *     grade-6 wording; math notation and numbers stay unchanged. Empty or
 *     absent = English (current behavior).
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
  // Base64 payload for a photo of handwritten work. ~4 MB of base64 ≈ a 3 MB
  // image, which comfortably covers a phone snapshot after client downscaling.
  imageB64: 4_000_000,
};

const MODES = new Set([
  "hint",
  "explain",
  "another",
  "diagnose",
  "teach",
  "photo",
  "solve",
  "translate",
  "recognize",
  // Teacher-facing: Insight Brief narrative over an ANONYMIZED class snapshot
  // (standards, counts, misconception tags — never student names).
  "plan",
]);

// Media types Claude's vision API accepts.
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

// Parse a `data:image/...;base64,....` URL into { media_type, data } or null.
function parseDataUrl(v) {
  if (typeof v !== "string" || v.length > CAP.imageB64) return null;
  const m = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)$/.exec(v.trim());
  if (!m) return null;
  const mediaType = m[1] === "image/jpg" ? "image/jpeg" : m[1];
  if (!IMAGE_TYPES.has(mediaType)) return null;
  return { media_type: mediaType, data: m[2] };
}

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
    request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "anon"
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

  // Optional photo of the student's handwritten work (data URL). Required for
  // "photo" mode; ignored elsewhere.
  const image = body.image != null ? parseDataUrl(body.image) : null;
  if ((mode === "photo" || mode === "recognize") && !image)
    return { ok: false, error: "missing-image" };

  const itemText = clampStr(body.itemText, CAP.itemText);
  // For photo/handwriting modes the picture carries the work, so a typed problem
  // is optional; every other mode still needs the problem text.
  if (!itemText && mode !== "photo" && mode !== "recognize")
    return { ok: false, error: "missing-item" };

  const standard = clampStr(body.standard, CAP.standard);
  const studentWork = clampStr(body.studentWork, CAP.studentWork);
  // Target language for translate mode (plain language name, e.g. "Spanish").
  const lang = clampStr(body.lang, 40);
  if (mode === "translate" && !lang) return { ok: false, error: "missing-lang" };

  // Optional hint-ladder level (integer 1-3). Only meaningful for "hint" mode;
  // anything missing or invalid falls back to level 1 (the classic nudge).
  const rawHintLevel = Number(body.hintLevel);
  const hintLevel =
    Number.isInteger(rawHintLevel) && rawHintLevel >= 1 && rawHintLevel <= 3 ? rawHintLevel : 1;

  // Optional reply language for every mode except "translate" (plain language
  // name, e.g. "Spanish"). Empty = reply in English (current behavior).
  const replyLang = clampStr(body.replyLang, 40);

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
    value: { mode, standard, itemText, studentWork, history, image, lang, hintLevel, replyLang },
  };
}

function systemPrompt(mode, standard, lang, hintLevel = 1, replyLang = "") {
  const core = modeSystemPrompt(mode, standard, lang, hintLevel);
  // Firm reply-language directive for every mode except "translate" (which
  // already targets `lang`). Math notation and numbers stay exactly as written.
  if (!replyLang || mode === "translate") return core;
  return (
    core +
    ` IMPORTANT: Write your ENTIRE reply in ${replyLang}. Use simple, grade-6-appropriate ` +
    `${replyLang} wording. Keep every number, math symbol, and piece of math notation exactly ` +
    `as it is — do not translate or alter the math.`
  );
}

function modeSystemPrompt(mode, standard, lang, hintLevel) {
  if (mode === "translate") {
    return (
      `You are a translator for a Grade 6 math class. Translate the text the student sends into ` +
      `${lang}. Keep all numbers, math symbols, and math notation exactly as they are. Use simple, ` +
      `natural, grade-appropriate wording. Output ONLY the translation — no preface, no explanation, ` +
      `no romanization.`
    );
  }
  if (mode === "plan") {
    return (
      `You are an experienced Grade 6 math instructional coach writing a short note to the ` +
      `classroom teacher. You receive an anonymized snapshot of recent class work: standards ` +
      `with attempt/struggle/misconception/mastery counts, misconception tags, and how many ` +
      `students sit in each support tier. Student names are never included — never invent any. ` +
      `Write a planning narrative in 4-7 short sentences, plain text, no headings: ` +
      `(1) one sentence on the overall picture, ` +
      `(2) the single highest-leverage reteach move and why the data says so, ` +
      `(3) one concrete Do Now or Turn-and-Talk idea aimed at the top misconception tag, ` +
      `(4) one idea for the enrichment-ready group. ` +
      `Stay strictly inside the numbers given; format math as plain text (/ for division, ^ for exponents).`
    );
  }
  const stdLine = standard ? `The problem targets math standard ${standard}. ` : "";
  const base =
    `You are a warm, patient Grade 6 math tutor for a multilingual classroom. ${stdLine}` +
    `Use short sentences and simple words. Be encouraging. Never shame a wrong answer. ` +
    `Format math as plain text (use / for division and ^ for exponents); no LaTeX.`;

  if (mode === "hint") {
    if (hintLevel === 3) {
      return (
        base +
        ` The student wants a HINT, not the answer. This is a LEVEL 3 hint: two earlier hints ` +
        `did not unstick them, so show a fully WORKED PARALLEL EXAMPLE. Rules you MUST follow: ` +
        `(1) Invent a similar problem — the SAME skill but DIFFERENT numbers and context — and ` +
        `solve THAT one step by step. ` +
        `(2) End by telling them to now try the same steps on their own problem. ` +
        `(3) NEVER solve or state the answer to the student's actual problem. ` +
        `(4) Keep the whole reply to 3-6 short sentences.`
      );
    }
    if (hintLevel === 2) {
      return (
        base +
        ` The student wants a HINT, not the answer. This is a LEVEL 2 hint: the student already ` +
        `got a Level 1 nudge and is still stuck, so be more specific. Rules you MUST follow: ` +
        `(1) Name the specific next step AND say WHY it helps, pointing to the exact operation ` +
        `or model to use (e.g. "find a common denominator so the pieces are the same size"). ` +
        `(2) Do NOT state the final numeric or final answer. ` +
        `(3) Do NOT do the final calculation for them. ` +
        `(4) Build on what the student already tried, in 2-3 short sentences.`
      );
    }
    // Level 1 — the classic single nudge.
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
  if (mode === "recognize") {
    return (
      base +
      ` The student wrote math by hand and sent a picture of it. Read the handwriting. Reply in ` +
      `2-3 short lines: (1) "I see you wrote: ..." transcribing it as plain-text math (use / for ` +
      `division, ^ for exponents); if it's unreadable, kindly ask them to write more clearly. ` +
      `(2) If it's a complete problem, solve it; if it's an expression or an answer, evaluate or ` +
      `simplify it and say whether it looks right. Keep it warm and brief.`
    );
  }
  if (mode === "solve") {
    return (
      base +
      ` Fully SOLVE this problem so the student can check their work. Rules: ` +
      `(1) If the student included an answer, FIRST say clearly whether it is correct, and give the ` +
      `correct final answer. ` +
      `(2) Then show the solution in 2-5 short numbered steps. ` +
      `(3) Be warm and brief; plain-text math (use / for division, ^ for exponents).`
    );
  }
  if (mode === "photo") {
    return (
      base +
      ` The student sent a PHOTO of their handwritten work. Read the photo carefully. ` +
      `Rules you MUST follow: ` +
      `(1) First, in one short sentence, say back what problem/steps you can see so they know ` +
      `you read it (if the photo is blurry or unreadable, kindly ask them to retake it). ` +
      `(2) Do NOT give the final answer or redo the whole problem. ` +
      `(3) Find the ONE misconception (the thinking-error), not just the slip, and name it in ` +
      `kid-friendly words. If the work is correct, say clearly what they did well. ` +
      `(4) End with ONE tiny next step they can try to fix or check it themselves. ` +
      `Keep the whole reply to 2-4 short, warm sentences.`
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
  if (v.mode === "translate") return v.itemText;
  if (v.mode === "plan") return `Anonymized class data snapshot:\n${v.itemText}`;
  if (v.mode === "recognize")
    return "Read the math I wrote by hand in this image, then solve or check it.";
  const lines = [];
  if (v.itemText) lines.push(`Problem the student is working on:\n${v.itemText}`);
  if (v.studentWork) lines.push(`\nWhat the student has tried so far:\n${v.studentWork}`);
  if (v.mode === "photo") {
    lines.push(
      lines.length
        ? `\nHere is a photo of my handwritten work. Read it and coach me on my thinking (do not give the answer).`
        : `Here is a photo of my handwritten math work. Read it and coach me on my thinking (do not give the answer).`,
    );
    return lines.join("\n");
  }
  if (v.mode === "solve")
    lines.push(
      "\nSolve this step by step so I can check my work." +
        (v.studentWork ? " First tell me if my answer above is right." : ""),
    );
  else if (v.mode === "hint") lines.push(`\nGive me a hint for the next step (not the answer).`);
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
  // When a photo is attached, the final user turn becomes a content array with
  // the image first, then the text prompt (Claude vision format).
  if (v.image) {
    messages.push({
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: v.image.media_type, data: v.image.data },
        },
        { type: "text", text: userPrompt(v) },
      ],
    });
  } else {
    messages.push({ role: "user", content: userPrompt(v) });
  }

  const resp = await fetch(CLAUDE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": CLAUDE_VERSION,
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: v.mode === "translate" ? 1500 : CAP.output,
      system: systemPrompt(v.mode, v.standard, v.lang, v.hintLevel, v.replyLang),
      messages,
    }),
  });

  if (!resp.ok) {
    // Never surface the upstream body (may contain account detail). Map to a
    // generic error; the client falls back to its offline state.
    return { ok: false, status: resp.status === 429 ? 429 : 502 };
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
      return json(
        { ok: false, offline: true, error: "tutor-unavailable" },
        out && out.status === 429 ? 429 : 503,
      );
    }
    return json({
      ok: true,
      reply: out.reply,
      mode: parsed.value.mode,
      source: out.source,
    });
  } catch (_err) {
    // Generic — never leak the error detail (may reference internals).
    return json({ ok: false, offline: true, error: "server-error" }, 503);
  }
}
