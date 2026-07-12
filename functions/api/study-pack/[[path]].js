/* =============================================================================
 * Study Pack proxy — Cloudflare Pages Function (classroom / eduwonderlab.com).
 * -----------------------------------------------------------------------------
 * Routes (catch-all under /api/study-pack):
 *   POST /api/study-pack            { mode:"generate", notes, subjectHint? }
 *                                     -> { ok, pack }
 *   POST /api/study-pack            { mode:"ask", notes, question, history? }
 *                                     -> { ok, reply }
 *   GET  /api/study-pack/health     -> { ok, backend, live }
 *
 * Backend: Claude Haiku only (same stance as /api/tutor) — one consistent
 * voice; graceful 503 offline when ANTHROPIC_API_KEY is unset.
 *
 * SAFETY:
 *   - No student PII accepted or stored; inputs are length-capped & coerced.
 *   - Best-effort per-IP rate limiting. Secrets never echoed or logged.
 *   - The prompt/schema live in ../../../shared/study-pack/contract.mjs — the
 *     single source of truth shared with the browser engine and Noam's app.
 * ========================================================================== */

import {
  CAPS,
  buildStudyPackPrompt,
  buildAskPrompt,
  buildAudioPrompt,
  coerceStudyPack,
  coerceAudioScript,
  extractJsonObject,
  extractJsonArray,
} from "../../../shared/study-pack/contract.mjs";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_VERSION = "2023-06-01";

// Generation needs headroom for a full pack; Ask replies stay short.
const OUT = { generate: 4000, ask: 600, audio: 1600 };
const RATE = { windowMs: 60_000, max: 12, hits: new Map() };
const IMG_CAP = 5_000_000; // base64 chars (~3.7MB image); Claude vision input
const IMG_MIME = /^image\/(png|jpe?g|webp|gif)$/i;

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

// Extract the joined text from an Anthropic Messages response.
function claudeText(data) {
  return Array.isArray(data?.content)
    ? data.content
        .filter((b) => b && b.type === "text" && typeof b.text === "string")
        .map((b) => b.text)
        .join("")
        .trim()
    : "";
}

// `image` (optional) is a validated {mime, data} base64 block for Claude vision.
async function callClaude(env, { system, user, maxTokens, image }) {
  const content = image
    ? [
        { type: "image", source: { type: "base64", media_type: image.mime, data: image.data } },
        { type: "text", text: user },
      ]
    : user;
  const resp = await fetch(CLAUDE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": CLAUDE_VERSION,
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content }],
    }),
  });
  if (!resp.ok) return { ok: false, status: resp.status === 429 ? 429 : 502 };
  const data = await resp.json().catch(() => null);
  const text = claudeText(data);
  if (!text) return { ok: false, status: 502 };
  return { ok: true, text };
}

// Pull a validated Claude-vision image out of the request body, or null.
function parseImage(body) {
  const img = body && body.image;
  if (!img || typeof img.data !== "string" || !img.data) return null;
  const mime = IMG_MIME.test(clampStr(img.mime, 40)) ? clampStr(img.mime, 40) : "image/jpeg";
  return { mime, data: img.data.slice(0, IMG_CAP) };
}

async function handleGenerate(env, body) {
  const notes = clampStr(body.notes, CAPS.notes);
  const image = parseImage(body);
  // Notes OR a photo is required — a photo alone is a valid source.
  if (!image && notes.length < 20) return json({ ok: false, error: "notes-too-short" }, 400);
  const subjectHint = clampStr(body.subjectHint, 120);
  const { system, user } = buildStudyPackPrompt(notes, { subjectHint, hasImage: !!image });
  const out = await callClaude(env, { system, user, maxTokens: OUT.generate, image });
  if (!out.ok) {
    return json({ ok: false, offline: true, error: "unavailable" }, out.status === 429 ? 429 : 503);
  }
  const pack = coerceStudyPack(extractJsonObject(out.text));
  if (!pack) return json({ ok: false, error: "bad-generation" }, 502);
  return json({ ok: true, pack });
}

async function handleAudio(env, body) {
  const notes = clampStr(body.notes, CAPS.notes);
  if (notes.length < 20) return json({ ok: false, error: "notes-too-short" }, 400);
  const subjectHint = clampStr(body.subjectHint, 120);
  const { system, user } = buildAudioPrompt(notes, { subjectHint });
  const out = await callClaude(env, { system, user, maxTokens: OUT.audio });
  if (!out.ok) {
    return json({ ok: false, offline: true, error: "unavailable" }, out.status === 429 ? 429 : 503);
  }
  const script = coerceAudioScript(extractJsonArray(out.text));
  if (!script) return json({ ok: false, error: "bad-generation" }, 502);
  return json({ ok: true, script });
}

async function handleAsk(env, body) {
  const notes = clampStr(body.notes, CAPS.notes);
  const question = clampStr(body.question, CAPS.question);
  if (!notes || !question) return json({ ok: false, error: "missing-fields" }, 400);
  const { system, user } = buildAskPrompt(notes, question);
  const out = await callClaude(env, { system, user, maxTokens: OUT.ask });
  if (!out.ok) {
    return json({ ok: false, offline: true, error: "unavailable" }, out.status === 429 ? 429 : 503);
  }
  return json({ ok: true, reply: out.text });
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });

  const seg = (params.path && params.path[0]) || "";
  const hasClaude = !!env.ANTHROPIC_API_KEY;

  if (seg === "health" && method === "GET") {
    return json({ ok: true, backend: hasClaude ? "claude" : "none", live: hasClaude });
  }
  if (method !== "POST" || seg) return json({ ok: false, error: "not-found" }, 404);

  if (!hasClaude) {
    return json(
      { ok: false, offline: true, error: "not-configured", message: "Set ANTHROPIC_API_KEY." },
      503,
    );
  }
  if (rateLimited(clientIp(request))) return json({ ok: false, error: "rate-limited" }, 429);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ ok: false, error: "bad-payload" }, 400);
  const mode = clampStr(body.mode, 16) || "generate";

  try {
    if (mode === "generate") return await handleGenerate(env, body);
    if (mode === "ask") return await handleAsk(env, body);
    if (mode === "audio") return await handleAudio(env, body);
    return json({ ok: false, error: "bad-mode" }, 400);
  } catch {
    return json({ ok: false, offline: true, error: "server-error" }, 503);
  }
}
