/* =============================================================================
 * Teach the Machine — the AI learner a student teaches (Cloudflare Pages Function)
 * -----------------------------------------------------------------------------
 * POST /api/teach-machine
 *   { tag, turns: [{ role: "student" | "learner", text }], lang: "en" | "es" }
 *   -> { ok, reply, understanding: { addressed, missing, convinced }, coaching,
 *        source, tag, lang }
 * GET  /api/teach-machine   (health)
 *   -> { ok, claude, workersAi, live, tags }
 *
 * WHAT THIS ENDPOINT IS:
 *   A Grade 6 peer who holds ONE specific wrong idea — the one the class is
 *   actually making most this week, per /api/class-pulse — and gives it up only
 *   when the student's explanation genuinely addresses every item in that
 *   persona's rubric. It is deliberately NOT a tutor: it never states the
 *   correct method, never does the student's reasoning, and never grades an
 *   answer. The student is scored on the QUALITY OF THEIR EXPLANATION, and the
 *   rubric is visible to them on the page the whole time.
 *
 * DEGRADATION LADDER (the feature never hard-fails):
 *   1. claude-opus-5 via the Anthropic Messages API (env.ANTHROPIC_API_KEY)
 *   2. claude-haiku-4-5-20251001, same call shape
 *   3. env.AI — the Workers AI binding
 *   4. a scripted offline persona driven by personas.js probes[]
 *   A deployment with no API key and no AI binding still gets a working,
 *   in-character learner. That is the point of level 4.
 *
 * TRUST MODEL FOR THE MODEL'S OWN JSON:
 *   The model is asked to emit { reply, addressed[], missing[], convinced }.
 *   Nothing it returns is trusted directly. Ids are intersected with the closed
 *   rubric, and `convinced` is ANDed with the deterministic evaluator in
 *   personas.js — so a hallucinated "you convinced me!" on turn one cannot hand
 *   a student a win they did not earn. Malformed JSON degrades to the scripted
 *   persona instead of a 500.
 *
 * PRIVACY:
 *   No auth (student-facing), no storage, no logging. Student text is never
 *   echoed in an error body and never written anywhere. Cache-Control:no-store.
 * ========================================================================== */

import {
  evaluateTurns,
  MIN_CONVINCED_WORDS,
  nextProbe,
  TAGS as PERSONA_TAGS,
  personaFor,
} from "../../curriculum/teach-the-machine/personas.js";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Anthropic Messages API — same shape as functions/api/tutor/[[path]].js.
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_VERSION = "2023-06-01";
const CLAUDE_MODEL = "claude-opus-5";
const CLAUDE_FALLBACK_MODEL = "claude-haiku-4-5-20251001";
const WORKERS_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct";

// Closed, INLINED tag vocabulary. Nothing outside this list is ever accepted,
// so no value a client sends can select a persona that does not exist.
// tools/validate-teach-machine.mjs asserts this stays identical to
// curriculum/teach-the-machine/personas.js TAGS.
const ALLOWED_TAGS = [
  "decimal-place-value",
  "exponent-as-multiplication",
  "fraction-added-denominators",
  "fraction-no-reciprocal",
  "fraction-straight-across-division",
  "measure-area-perimeter-swap",
  "op-added-instead-of-multiplied",
  "op-divided-instead-of-multiplied",
  "op-multiplied-instead-of-added",
  "op-multiplied-instead-of-divided",
  "op-reversed-division",
  "op-reversed-subtraction",
  "order-of-operations-left-to-right",
  "percent-scale-off-by-100",
  "percent-used-as-whole-number",
  "rate-not-per-one",
  "ratio-inverted",
  "sign-dropped",
  "stat-summed-instead-of-averaged",
];
const ALLOWED = new Set(ALLOWED_TAGS);

const CAP = { turns: 12, text: 1200, output: 700 };

// Best-effort per-isolate rate limit, mirroring the tutor proxy.
const RATE = { windowMs: 60_000, max: 30, hits: new Map() };

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
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
  while (arr.length && arr[0] < cutoff) arr.shift();
  if (arr.length >= RATE.max) return true;
  arr.push(now);
  if (RATE.hits.size > 5000) {
    for (const [k, v] of RATE.hits) {
      if (!v.length || v[v.length - 1] < cutoff) RATE.hits.delete(k);
    }
  }
  return false;
}

/** Normalize the request body. Never returns any student text in an error. */
function parseBody(body) {
  if (!body || typeof body !== "object") return { ok: false, error: "bad-payload" };

  const tag = typeof body.tag === "string" ? body.tag.slice(0, 60) : "";
  if (!ALLOWED.has(tag)) return { ok: false, error: "bad-tag" };

  const lang = body.lang === "es" ? "es" : "en";

  if (!Array.isArray(body.turns)) return { ok: false, error: "bad-turns" };
  const turns = body.turns
    .filter((t) => t && typeof t === "object")
    .slice(-CAP.turns)
    .map((t) => ({
      role: t.role === "learner" ? "learner" : "student",
      text: typeof t.text === "string" ? t.text.slice(0, CAP.text).trim() : "",
    }))
    .filter((t) => t.text);
  if (!turns.length) return { ok: false, error: "no-turns" };
  if (!turns.some((t) => t.role === "student")) return { ok: false, error: "no-student-turn" };

  return { ok: true, value: { tag, lang, turns } };
}

/* ── Prompting ───────────────────────────────────────────────────────────── */

function systemPrompt(persona, lang, evaluation) {
  const langName = lang === "es" ? "Spanish" : "English";
  const wrongIdea = lang === "es" ? persona.wrongIdeaEs : persona.wrongIdea;
  const rubric = persona.mustAddress
    .map((i, n) => `${n + 1}. [${i.id}] ${lang === "es" ? i.es : i.en}`)
    .join("\n");
  const still = evaluation.missing.length
    ? evaluation.missing.join(", ")
    : "(nothing — every rubric idea now looks addressed)";

  return (
    `You are ${persona.name}, a Grade 6 student who believes ${wrongIdea}. ` +
    `You are friendly and genuinely want to understand. You do NOT already know the correct ` +
    `method — you are being taught by a classmate, and they are the teacher.\n\n` +
    `HARD RULES, no exceptions:\n` +
    `- Never state the correct method yourself. Never do the classmate's reasoning for them.\n` +
    `- Never introduce a fact, rule, formula, or step they have not said first.\n` +
    `- Ask ONE short question at a time, and only about the part you still do not get.\n` +
    `- Use Grade 6 vocabulary and short sentences. Plain-text math (/ for division, ^ for ` +
    `exponents). No LaTeX.\n` +
    `- Write your entire reply in ${langName}.\n` +
    `- Never shame them, never grade them, never mention scores. Stay warm and curious.\n` +
    `- If they only recite a rule or a slogan without explaining WHY, say honestly that you ` +
    `can repeat the words but still cannot picture it, and ask about the part you cannot see.\n\n` +
    `THE IDEAS YOUR CLASSMATE MUST GET ACROSS BEFORE YOU LET GO OF YOUR WRONG IDEA:\n` +
    `${rubric}\n\n` +
    `Ideas still unaddressed after their latest message: ${still}\n\n` +
    `IF AND ONLY IF their explanation has now addressed EVERY numbered idea above, express ` +
    `genuine understanding and restate the whole idea IN YOUR OWN WORDS as proof you have it — ` +
    `do not copy their sentences back. Otherwise stay honestly stuck and keep asking.\n\n` +
    `Reply with ONLY a JSON object, no code fence and no text around it:\n` +
    `{"reply":"<what you say, 1-3 short sentences>","addressed":["<ids they have covered>"],` +
    `"missing":["<ids still not covered>"],"convinced":<true|false>,` +
    `"coaching":"<one short encouraging tip for the teacher-classmate, in ${langName}>"}`
  );
}

function conversationMessages(persona, lang, turns) {
  const opening = lang === "es" ? persona.openingLineEs : persona.openingLine;
  const messages = [{ role: "assistant", content: opening }];
  for (const t of turns) {
    messages.push({
      role: t.role === "learner" ? "assistant" : "user",
      content: t.text,
    });
  }
  // The Messages API requires the final turn to be from the user.
  if (messages[messages.length - 1].role !== "user") {
    messages.push({ role: "user", content: "Ask me what you still do not understand." });
  }
  return messages;
}

/** Pull the first balanced JSON object out of a model reply, tolerating fences. */
function extractJson(text) {
  if (typeof text !== "string") return null;
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function cleanSentence(value, cap) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, cap);
}

/**
 * Turn a raw model reply into a trusted result, or null.
 * Ids are intersected with the closed rubric; `convinced` is ANDed with the
 * deterministic evaluation so a hallucinated win is impossible.
 */
function normalizeModelReply(raw, persona, evaluation, source) {
  const parsed = extractJson(raw);
  if (!parsed || typeof parsed !== "object") return null;
  const reply = cleanSentence(parsed.reply, 600);
  if (!reply) return null;

  const rubricIds = persona.mustAddress.map((i) => i.id);
  const claimed = Array.isArray(parsed.addressed)
    ? parsed.addressed.filter((id) => rubricIds.includes(id))
    : [];

  const addressed = [...new Set([...evaluation.addressed, ...claimed])];
  const missing = rubricIds.filter((id) => !addressed.includes(id));
  // The model can UNLOCK an item the keyword rubric missed (a good paraphrase),
  // and the deterministic evaluator is the FLOOR that stops a stubborn model
  // from locking a student out of a win they have already earned. Neither side
  // can hand out a win on its own: the rubric must be complete either way.
  const convinced =
    (parsed.convinced === true || evaluation.convinced) &&
    missing.length === 0 &&
    evaluation.words >= MIN_CONVINCED_WORDS;

  return {
    reply,
    understanding: { addressed, missing, convinced },
    coaching: cleanSentence(parsed.coaching, 240),
    source,
  };
}

/* ── Backends ────────────────────────────────────────────────────────────── */

async function viaClaude(env, model, persona, v, evaluation) {
  let resp;
  try {
    resp = await fetch(CLAUDE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": CLAUDE_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: CAP.output,
        system: systemPrompt(persona, v.lang, evaluation),
        messages: conversationMessages(persona, v.lang, v.turns),
      }),
    });
  } catch {
    return null;
  }
  // Never surface the upstream body — it can carry account detail.
  if (!resp.ok) return null;

  const data = await resp.json().catch(() => null);
  const text = Array.isArray(data?.content)
    ? data.content
        .filter((b) => b && b.type === "text" && typeof b.text === "string")
        .map((b) => b.text)
        .join("")
    : "";
  return normalizeModelReply(text, persona, evaluation, "claude");
}

async function viaWorkersAi(env, persona, v, evaluation) {
  try {
    const result = await env.AI.run(WORKERS_AI_MODEL, {
      messages: [
        { role: "system", content: systemPrompt(persona, v.lang, evaluation) },
        ...conversationMessages(persona, v.lang, v.turns).map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      ],
      max_tokens: 500,
    });
    return normalizeModelReply(result?.response, persona, evaluation, "workers-ai");
  } catch {
    return null;
  }
}

/**
 * Level 4 — the scripted persona. No model involved: the learner asks the probe
 * tied to the first rubric idea still missing, and restates the idea in its own
 * words (assembled from the rubric) once everything is covered. A deployment
 * with no AI backend at all still gets a real, in-character conversation.
 */
function viaScript(persona, v, evaluation) {
  const es = v.lang === "es";
  const alreadyAsked = v.turns.filter((t) => t.role === "learner").map((t) => t.text);

  if (evaluation.convinced) {
    const ideas = persona.mustAddress.map((i) => (es ? i.es : i.en)).join(es ? "; y " : "; and ");
    const reply = es
      ? `Ya lo veo. Si lo digo con mis palabras: ${ideas}. Por eso mi idea de antes no funcionaba. ¡Gracias por explicármelo!`
      : `Oh — I see it now. In my own words: ${ideas}. That is why my old idea did not work. Thank you for teaching me!`;
    return {
      reply,
      understanding: {
        addressed: evaluation.addressed,
        missing: [],
        convinced: true,
      },
      coaching: es
        ? "Explicaste el porqué, no solo el qué. Eso es enseñar."
        : "You explained the why, not just the what. That is teaching.",
      source: "offline",
    };
  }

  const probe = nextProbe(persona.tag, evaluation, alreadyAsked, v.lang);
  const gotSomething = evaluation.addressed.length > 0;
  const usedGiveaway = evaluation.giveaways.length > 0;

  let lead;
  if (usedGiveaway) {
    lead = es
      ? "Puedo repetir esas palabras, pero todavía no me lo imagino."
      : "I can repeat those words, but I still cannot picture it.";
  } else if (gotSomething) {
    lead = es ? "Bien, eso me ayudó un poco." : "Okay, that part helped a little.";
  } else {
    lead = es ? "Mmm, todavía no lo veo." : "Hmm, I still do not see it.";
  }

  return {
    reply: `${lead} ${probe}`.trim(),
    understanding: {
      addressed: evaluation.addressed,
      missing: evaluation.missing,
      convinced: false,
    },
    coaching: coachingFor(persona, evaluation, v.lang),
    source: "offline",
  };
}

/** A short, deterministic nudge for the student — never the answer. */
function coachingFor(persona, evaluation, lang) {
  const es = lang === "es";
  if (evaluation.giveaways.length) {
    return es
      ? "Dijiste el paso. Ahora di POR QUÉ ese paso tiene sentido."
      : "You said the step. Now say WHY that step makes sense.";
  }
  const nextItem = persona.mustAddress.find((i) => evaluation.missing.includes(i.id));
  if (!nextItem) {
    return es
      ? "Ya cubriste todo. Añade un ejemplo pequeño para rematarlo."
      : "You have covered everything. Add one tiny example to seal it.";
  }
  const idea = es ? nextItem.es : nextItem.en;
  return es ? `Todavía falta explicar: ${idea}.` : `Still to explain: ${idea}.`;
}

/* ── Handler ─────────────────────────────────────────────────────────────── */

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });

  if (method === "GET") {
    return json({
      ok: true,
      claude: Boolean(env.ANTHROPIC_API_KEY),
      workersAi: Boolean(env.AI),
      // Always live: the scripted persona needs no backend at all.
      live: true,
      tags: ALLOWED_TAGS.length,
    });
  }

  if (method !== "POST") return json({ ok: false, error: "method-not-allowed" }, 405);

  const raw = await request.json().catch(() => null);
  const parsed = parseBody(raw);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);

  const v = parsed.value;
  const persona = personaFor(v.tag);
  // Unreachable while ALLOWED_TAGS and personas.js agree; the validator keeps
  // them in step, and this stays as the honest guard if they ever drift.
  if (!persona) return json({ ok: false, error: "bad-tag" }, 400);

  const evaluation = evaluateTurns(v.tag, v.turns);

  // Over the limit: still answer, just without a model call. The student is
  // mid-explanation — cutting them off with a 429 would be the wrong lesson.
  const throttled = rateLimited(clientIp(request));

  let out = null;
  try {
    if (!throttled && env.ANTHROPIC_API_KEY) {
      out = await viaClaude(env, CLAUDE_MODEL, persona, v, evaluation);
      if (!out) out = await viaClaude(env, CLAUDE_FALLBACK_MODEL, persona, v, evaluation);
    }
    if (!out && !throttled && env.AI) {
      out = await viaWorkersAi(env, persona, v, evaluation);
    }
  } catch {
    out = null;
  }
  if (!out) out = viaScript(persona, v, evaluation);

  // The coaching line is always deterministic when the model did not supply one.
  const coaching = out.coaching || coachingFor(persona, out.understanding, v.lang);

  return json({
    ok: true,
    tag: v.tag,
    lang: v.lang,
    reply: out.reply,
    understanding: out.understanding,
    coaching,
    source: out.source,
  });
}

export const __test__ = { ALLOWED_TAGS, PERSONA_TAGS, parseBody, extractJson, viaScript };
