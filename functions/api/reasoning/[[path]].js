/* =============================================================================
 * Reasoning reader — Cloudflare Pages Function
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 *
 * Every judgment in the small-group studio ran through isRight(), a tolerant
 * string matcher. It is well built, and it defined the curriculum. Whatever it
 * could see got scored, metered, celebrated and synced across seven feature
 * waves; whatever it could not see got sentence frames and nothing else.
 *
 * The things it cannot see are the reason the studio exists: "show why it works",
 * "defend it to a skeptic", the model explanation, the exit-ticket reasoning.
 * Students typed into those boxes and NOTHING read them. Not a teacher (there is
 * one of them and thirty students), not the engine, not the dashboard.
 *
 * This endpoint reads them. Its job is not to grade — it is to WIDEN the
 * assessable surface so pedagogy stops being shaped by what a regex can parse.
 *
 * WHAT IT WILL AND WILL NOT DO
 *
 * It returns coaching, never a score. It never states the answer. It names at
 * most one specific gap in the reasoning and asks one question that would close
 * it, because a grade-6 student who receives five criticisms reads none of them.
 *
 * Route:
 *   POST /api/reasoning/review
 *     { standard?, prompt, response, answerShown?, misconception?,
 *       language?: "en"|"es", level?: 1-5, skill?, digest?, turn?: 1|2,
 *       followup?, avoidNumbers?: string[] }
 *     -> { ok, source, strengths, gap, question, usedMisconception }
 *
 * GUARDS (all enforced here, none trusted to the client or the model):
 *   - Origin must be this site, localhost or a Pages preview.
 *   - Bodies over MAX_BODY bytes are refused before parsing.
 *   - At most two turns per exchange (turn 3 and up is refused).
 *   - A reply is dropped if it states a number the student did not write or
 *     the problem did not contain, or any number the teacher listed in
 *     avoidNumbers / the lesson sent as answerShown. The student's writing is
 *     the only source of numbers a coaching reply may use.
 *
 * PRIVACY: no name, no section, no student id is accepted or stored. Nothing is
 * persisted at all — this is a stateless read of one paragraph. The studio only
 * calls it when a student presses a button asking for feedback.
 *
 * DEGRADATION: with no ANTHROPIC_API_KEY and no AI binding it returns 503 and the
 * studio keeps its existing behaviour (a sentence frame and no response), so the
 * feature can never block a lesson.
 * ========================================================================== */

const BASE_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
  Vary: "Origin",
};

// Allowed callers: the production site, local development, and Pages previews.
function originAllowed(origin) {
  if (!origin) return false;
  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  const host = url.hostname;
  if (host === "eduwonderlab.com" || host === "www.eduwonderlab.com")
    return url.protocol === "https:";
  if (host === "localhost" || host === "127.0.0.1") return true;
  return url.protocol === "https:" && host.endsWith(".pages.dev");
}

function headersFor(request) {
  const origin = request.headers.get("Origin") || "";
  return originAllowed(origin)
    ? { ...BASE_HEADERS, "Access-Control-Allow-Origin": origin }
    : BASE_HEADERS;
}

const json = (obj, status = 200, request = null) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: request ? headersFor(request) : BASE_HEADERS,
  });

const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_VERSION = "2023-06-01";
const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
const WORKERS_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct";

const MAX_RESPONSE = 1200; // one paragraph of grade-6 writing, generously
const MAX_PROMPT = 400;
const MAX_FOLLOWUP = 600;
const MAX_BODY = 8000; // bytes; a real request is well under 3 KB
const LANGUAGES = { en: "English", es: "Spanish" };

// Best-effort in-memory per-IP limiter, mirroring functions/api/tutor. Not a hard
// guarantee across edge isolates, but it blunts an accidental client loop and a
// bored student holding the button down — both of which spend real budget on a paid
// model. A whole class shares one NAT here, so the cap is per minute and generous:
// a student asking for coaching 12 times in a minute is not writing reasoning in
// between.
const RATE = { windowMs: 60_000, max: 12, hits: new Map() };

function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "anon"
  );
}

function rateLimited(ip) {
  const now = Date.now();
  const cutoff = now - RATE.windowMs;
  let hits = RATE.hits.get(ip);
  if (!hits) {
    hits = [];
    RATE.hits.set(ip, hits);
  }
  while (hits.length && hits[0] < cutoff) hits.shift();
  if (hits.length >= RATE.max) return true;
  hits.push(now);
  // Opportunistic prune so a long-lived isolate does not grow a map per client.
  if (RATE.hits.size > 500) {
    for (const [key, stamps] of RATE.hits) {
      if (!stamps.length || stamps[stamps.length - 1] < cutoff) RATE.hits.delete(key);
    }
  }
  return false;
}

// The whole contract, stated once. Written as constraints rather than
// encouragement because a model told to "be helpful" to a struggling 12-year-old
// will hand over the answer, and that is the one thing this must never do.
const SYSTEM = `You read one piece of written mathematical reasoning from a 6th-grade student and reply with brief coaching.

HARD RULES — these override everything else:
1. NEVER state, compute, or confirm the final answer. Not even to check it. If the student's answer is wrong, do not say what the right one is.
2. NEVER give a numeric result of your own. Use only numbers the student already wrote or the problem already contains.
3. Reply about their REASONING, not their arithmetic.
4. Name at most ONE gap. A student who receives five criticisms reads none of them.
5. Ask exactly ONE question — the question whose answer would close that gap.
6. Never praise vaguely. If you name a strength, name the specific move they made.
7. 6th-grade reading level. Second person. No emoji, no exclamation marks.
8. If the reasoning is genuinely complete, say so plainly and ask a question that extends it instead of inventing a flaw.
9. If the response is empty, off-topic, or not about the problem, say you cannot see any reasoning yet and ask them to write one sentence about their first step.
10. NEVER tell the student which operation or strategy to use. The question may point at what to notice (a quantity, a label, a part of their model), never at what to do.

Reply as strict JSON, no markdown fence:
{"strengths":"<one sentence naming a specific move they made, or empty string>","gap":"<one sentence naming the single missing link, or empty string if complete>","question":"<one question, ends with a question mark>"}`;

function systemPrompt(language, level) {
  const lines = [SYSTEM];
  if (language !== "en") {
    lines.push(
      `Write every JSON VALUE in ${LANGUAGES[language]} (keep the three JSON keys exactly as written). Keep any numbers exactly as the student wrote them.`,
    );
  }
  if (level && level <= 2) {
    lines.push(
      "Use very short sentences and common words; this student is early in learning the language.",
    );
  }
  return lines.join("\n\n");
}

function digestLine(digest) {
  if (!digest || !Array.isArray(digest.items) || !digest.items.length) return "";
  const parts = digest.items.map((i) => `${i.type}${i.filled ? " (filled in)" : " (empty)"}`);
  return `The student's board has: ${parts.join(", ")}.`;
}

function userPrompt({ standard, prompt, response, misconception, followup, turn, digest }) {
  const lines = [];
  if (standard) lines.push(`Standard: ${standard}`);
  lines.push(`The student was asked: ${prompt}`);
  lines.push(`The student wrote: ${response}`);
  const board = digestLine(digest);
  if (board) lines.push(board);
  if (turn === 2 && followup) {
    lines.push(`You already asked a question. The student answered: ${followup}`);
    lines.push(
      "Say whether that answer closes the gap, in one sentence, then ask at most one new question.",
    );
  }
  if (misconception) {
    // The deterministic detector already named a mechanism from the student's
    // numeric work. Passing it in stops the model from guessing at a different
    // error, which is the failure mode that makes AI coaching feel random.
    lines.push(
      `A separate check of their numeric work suggests this specific error: "${misconception}". If their writing shows that same thinking, aim your question at it. If it does not, ignore this line completely.`,
    );
  }
  return lines.join("\n\n");
}

function parseReply(text) {
  if (!text) return null;
  // Models occasionally fence JSON despite instructions.
  const cleaned = String(text)
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }
  const question = typeof parsed.question === "string" ? parsed.question.trim() : "";
  if (!question) return null;
  return {
    strengths: typeof parsed.strengths === "string" ? parsed.strengths.trim() : "",
    gap: typeof parsed.gap === "string" ? parsed.gap.trim() : "",
    question,
  };
}

const numbersIn = (text) =>
  (String(text || "").match(/\d+(?:[.,]\d+)*/g) || []).map((n) => n.replace(/,/g, ""));

// A last-resort guard, not a substitute for the system prompt. If a reply leaks
// something that reads like the answer, drop it rather than show it: silence is a
// supported state here, and a giveaway is not. Two independent tests:
//   1. the reply states a number on the avoid list (teacher setting or the
//      lesson's answerShown);
//   2. the reply introduces a number that is nowhere in what the student or the
//      problem wrote. Coaching about reasoning never needs a new number.
function leaksAnswer(review, { answerShown, avoid, allowedText }) {
  const reply = [review.strengths, review.gap, review.question].join(" ");
  const replyNumbers = numbersIn(reply);
  const avoidList = [...(avoid || []), ...numbersIn(answerShown)].filter((n) => n.length);
  if (replyNumbers.some((n) => avoidList.includes(n))) return true;
  const allowed = new Set(numbersIn(allowedText));
  return replyNumbers.some((n) => !allowed.has(n));
}

const LOCAL = {
  en: {
    gap: "There is not enough written down yet to follow your thinking.",
    question: "What was the very first thing you did, and why did you start there?",
    filtered: "Can you explain, in one more sentence, why that step has to be true?",
  },
  es: {
    gap: "Todavía no hay suficiente escrito para seguir tu razonamiento.",
    question: "¿Qué fue lo primero que hiciste y por qué empezaste ahí?",
    filtered: "¿Puedes explicar, en una oración más, por qué ese paso tiene que ser verdadero?",
  },
};

async function viaClaude(env, payload) {
  const response = await fetch(CLAUDE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": CLAUDE_VERSION,
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      system: systemPrompt(payload.language, payload.level),
      messages: [{ role: "user", content: userPrompt(payload) }],
    }),
  });
  if (!response.ok) return null;
  const data = await response.json().catch(() => null);
  const text = Array.isArray(data?.content)
    ? data.content
        .filter((block) => block?.type === "text" && typeof block.text === "string")
        .map((block) => block.text)
        .join("")
    : "";
  const review = parseReply(text);
  return review ? { ...review, source: "claude" } : null;
}

async function viaWorkersAi(env, payload) {
  try {
    const result = await env.AI.run(WORKERS_AI_MODEL, {
      messages: [
        { role: "system", content: systemPrompt(payload.language, payload.level) },
        { role: "user", content: userPrompt(payload) },
      ],
      max_tokens: 400,
    });
    const review = parseReply(result?.response);
    return review ? { ...review, source: "workers-ai" } : null;
  } catch {
    return null;
  }
}

// Keep only the structural fields the prompt uses; never pass free text through.
function cleanDigest(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.items)) return null;
  const items = raw.items.slice(0, 12).map((i) => ({
    type: String(i?.type || "")
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 20),
    filled: Boolean(i?.filled),
  }));
  return { items: items.filter((i) => i.type) };
}

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: headersFor(request) });
  }
  const route = (params.path && params.path[0]) || "";

  if (route === "health") {
    return json(
      {
        ok: true,
        claude: Boolean(env.ANTHROPIC_API_KEY),
        workersAi: Boolean(env.AI),
        live: Boolean(env.ANTHROPIC_API_KEY || env.AI),
      },
      200,
      request,
    );
  }

  if (route !== "review" || request.method !== "POST") {
    return json({ ok: false, error: "not-found" }, 404, request);
  }

  // Browsers always send Origin on a POST; scripts usually do not. Requiring an
  // allowed Origin (or a Referer from one) keeps the paid model off the open web.
  const origin = request.headers.get("Origin") || "";
  const referer = request.headers.get("Referer") || "";
  if (!originAllowed(origin) && !(!origin && originAllowed(referer))) {
    return json({ ok: false, error: "forbidden-origin" }, 403, request);
  }

  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > MAX_BODY) return json({ ok: false, error: "too-large" }, 413, request);

  let body;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ ok: false, error: "too-large" }, 413, request);
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "bad-json" }, 400, request);
  }

  const response = String(body?.response ?? "")
    .trim()
    .slice(0, MAX_RESPONSE);
  const prompt = String(body?.prompt ?? "")
    .trim()
    .slice(0, MAX_PROMPT);
  if (!response) return json({ ok: false, error: "no-response" }, 400, request);
  if (!prompt) return json({ ok: false, error: "no-prompt" }, 400, request);

  const turn = Number(body?.turn ?? 1);
  if (!Number.isInteger(turn) || turn < 1)
    return json({ ok: false, error: "bad-turn" }, 400, request);
  if (turn > 2) return json({ ok: false, error: "turn-limit" }, 400, request);

  const language = body?.language === "es" ? "es" : "en";
  const level = Math.max(0, Math.min(5, Math.round(Number(body?.level)) || 0));
  const local = LOCAL[language];

  // Too short to reason about. Answered deterministically so a two-word entry
  // never costs a model call, and so the coaching is identical every time.
  if (response.split(/\s+/).filter(Boolean).length < 4) {
    return json(
      {
        ok: true,
        source: "local",
        strengths: "",
        gap: local.gap,
        question: local.question,
        usedMisconception: null,
      },
      200,
      request,
    );
  }

  if (!env.ANTHROPIC_API_KEY && !env.AI) {
    return json({ ok: false, error: "not-configured" }, 503, request);
  }

  // Checked HERE, not at the top: the short-entry path above is answered locally
  // and costs nothing, so it must never consume a student's allowance.
  if (rateLimited(clientIp(request))) {
    return json({ ok: false, error: "rate-limited" }, 429, request);
  }

  const followup = String(body?.followup ?? "")
    .trim()
    .slice(0, MAX_FOLLOWUP);
  const avoid = Array.isArray(body?.avoidNumbers)
    ? body.avoidNumbers.slice(0, 10).flatMap((n) => numbersIn(String(n).slice(0, 12)))
    : [];
  const payload = {
    standard: String(body?.standard ?? "").slice(0, 40),
    prompt,
    response,
    misconception: String(body?.misconception ?? "").slice(0, 120),
    language,
    level,
    turn,
    followup,
    digest: cleanDigest(body?.digest),
  };

  let review = env.ANTHROPIC_API_KEY ? await viaClaude(env, payload) : null;
  if (!review && env.AI) review = await viaWorkersAi(env, payload);
  if (!review) return json({ ok: false, error: "unavailable" }, 502, request);

  const guard = {
    answerShown: body?.answerShown,
    avoid,
    allowedText: `${prompt} ${response} ${followup}`,
  };
  if (leaksAnswer(review, guard)) {
    // Prefer no coaching over coaching that hands over the answer.
    return json(
      {
        ok: true,
        source: "local",
        strengths: "",
        gap: "",
        question: local.filtered,
        usedMisconception: null,
        filtered: true,
      },
      200,
      request,
    );
  }

  return json(
    {
      ok: true,
      source: review.source,
      strengths: review.strengths,
      gap: review.gap,
      question: review.question,
      usedMisconception: payload.misconception || null,
    },
    200,
    request,
  );
}
