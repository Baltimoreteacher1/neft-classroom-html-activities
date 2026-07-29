/* =============================================================================
 * Screener narrative assist — Cloudflare Pages Function (optional, opt-in)
 * -----------------------------------------------------------------------------
 * POST /api/screener-assist  { grade, homeLanguage, tier, domains:[{name,result,detail}] }
 * GET  /api/screener-assist/health -> { ok, backend, live }
 *
 * Drafts an editable clinical-impression paragraph and a parent-friendly
 * explanation from a speech-language SCREENING's DE-IDENTIFIED results. The
 * client sends NO student name, DOB, initials, teacher, or free-text notes —
 * only grade band, home-language name, tier, and per-domain results. Claude
 * Haiku only; graceful 503 when ANTHROPIC_API_KEY is absent. Stateless: nothing
 * is stored or logged; secrets are never echoed.
 * ========================================================================== */
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
const CAP = { str: 80, detail: 300, domains: 8, output: 700 };
const RATE = { windowMs: 60_000, max: 20, hits: new Map() };

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
  const now = Date.now(),
    cutoff = now - RATE.windowMs;
  const arr = (RATE.hits.get(ip) || []).filter((t) => t > cutoff);
  arr.push(now);
  RATE.hits.set(ip, arr);
  if (RATE.hits.size > 5000) RATE.hits.clear();
  return arr.length > RATE.max;
}
function parseBody(b) {
  if (!b || typeof b !== "object") return { ok: false, error: "missing-body" };
  const grade = clampStr(b.grade, CAP.str);
  const tier = clampStr(b.tier, 120);
  const homeLanguage = clampStr(b.homeLanguage, CAP.str);
  let domains = Array.isArray(b.domains) ? b.domains.slice(0, CAP.domains) : [];
  domains = domains
    .map((d) => ({
      name: clampStr(d && d.name, CAP.str),
      result: clampStr(d && d.result, CAP.str),
      detail: clampStr(d && d.detail, CAP.detail),
    }))
    .filter((d) => d.name);
  if (!domains.length) return { ok: false, error: "missing-domains" };
  return { ok: true, value: { grade, tier, homeLanguage, domains } };
}
function systemPrompt() {
  return [
    "You are an experienced school-based speech-language pathologist writing up a speech-language SCREENING (a brief check, not a diagnostic evaluation).",
    "Write from DE-IDENTIFIED results only — you are given no student name or date of birth; never invent one. Refer to 'the student'.",
    "Rules:",
    "- A screening is NOT a diagnosis and does not determine eligibility. Never diagnose or state eligibility.",
    "- Be professional, specific to the data, and appropriately cautious. Do not invent findings beyond what is provided.",
    "- Frame next steps consistent with the given tier (e.g., monitor/strategies vs. refer for a comprehensive evaluation).",
    "- For multilingual students, note that difference is not disorder where relevant.",
    'Return STRICT JSON: {"impression":"4-6 sentence clinical impression paragraph","parent":"3-4 sentence plain, warm explanation a family can understand"}. No markdown, no extra keys.',
  ].join("\n");
}
function userPrompt(v) {
  const lines = [];
  lines.push("Grade: " + (v.grade || "unspecified"));
  if (v.homeLanguage) lines.push("Home language(s): " + v.homeLanguage);
  lines.push("Screening conclusion (tier): " + (v.tier || "unspecified"));
  lines.push("Domain results:");
  v.domains.forEach((d) =>
    lines.push("- " + d.name + ": " + d.result + (d.detail ? " (" + d.detail + ")" : "")),
  );
  lines.push("\nWrite the JSON now.");
  return lines.join("\n");
}
async function callClaude(env, v) {
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
      system: systemPrompt(),
      messages: [{ role: "user", content: userPrompt(v) }],
    }),
  });
  if (!resp.ok) return { ok: false, status: resp.status === 429 ? 429 : 502 };
  const data = await resp.json().catch(() => null);
  const text = Array.isArray(data?.content)
    ? data.content
        .filter((x) => x && x.type === "text" && typeof x.text === "string")
        .map((x) => x.text)
        .join("")
        .trim()
    : "";
  if (!text) return { ok: false, status: 502 };
  let impression = "",
    parent = "";
  try {
    const m = text.match(/\{[\s\S]*\}/);
    const obj = JSON.parse(m ? m[0] : text);
    impression = clampStr(obj.impression, 3000);
    parent = clampStr(obj.parent, 2000);
  } catch {
    impression = text; // fall back to raw text as the impression
  }
  if (!impression) return { ok: false, status: 502 };
  return { ok: true, impression, parent };
}
export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();
  if (method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });
  const seg = (params.path && params.path[0]) || "";
  const hasClaude = !!env.ANTHROPIC_API_KEY;
  if (seg === "health" && method === "GET")
    return json({ ok: true, backend: hasClaude ? "claude" : "none", live: hasClaude });
  if (method !== "POST" || seg) return json({ ok: false, error: "not-found" }, 404);
  if (!hasClaude)
    return json(
      {
        ok: false,
        offline: true,
        error: "not-configured",
        message: "AI assist backend is not configured (ANTHROPIC_API_KEY).",
      },
      503,
    );
  if (rateLimited(clientIp(request))) return json({ ok: false, error: "rate-limited" }, 429);
  const parsed = parseBody(await request.json().catch(() => null));
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);
  try {
    const out = await callClaude(env, parsed.value);
    if (!out || !out.ok)
      return json(
        { ok: false, offline: true, error: "unavailable" },
        out && out.status === 429 ? 429 : 503,
      );
    return json({ ok: true, impression: out.impression, parent: out.parent });
  } catch {
    return json({ ok: false, offline: true, error: "server-error" }, 503);
  }
}
