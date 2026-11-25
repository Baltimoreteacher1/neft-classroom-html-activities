/**
 * GET /api/health: liveness and dependency probe for uptime monitors and the synthetic check.
 * Returns the deployed build stamp and a D1 reachability ping. No secrets, no PII, never cached.
 * 200 when healthy (including "no D1 bound"), 503 when D1 is bound but unreachable.
 * Runbook: docs/runbooks/observability.md
 */
import { handler, json } from "../_lib/http.js";

const D1_PING_TIMEOUT_MS = 1500;
const STAMP_PATH = "/access-practice-lab/config.json";
const SHA_RE = /^[0-9a-f]{7,40}$/i;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function pingD1(env) {
  if (!env?.DB) return "absent";
  try {
    await withTimeout(env.DB.prepare("SELECT 1 AS ok").first(), D1_PING_TIMEOUT_MS);
    return "ok";
  } catch {
    return "error";
  }
}

/** Commit and build time from the public build stamp written by tools/stamp-build.mjs. */
async function readBuildStamp(request, env) {
  try {
    const res = await env.ASSETS.fetch(new URL(STAMP_PATH, request.url));
    if (!res.ok) return { commit: "unknown", built_at: null };
    const stamp = await res.json();
    const commit = SHA_RE.test(stamp.commit || "") ? stamp.commit.slice(0, 12) : "unknown";
    const built_at = typeof stamp.builtAt === "string" ? stamp.builtAt.slice(0, 30) : null;
    return { commit, built_at };
  } catch {
    return { commit: "unknown", built_at: null };
  }
}

export const onRequest = handler({
  methods: ["GET", "HEAD"],
  rateLimit: { max: 60, windowMs: 60_000 },
  async handle({ request, env }) {
    const [d1, build] = await Promise.all([pingD1(env), readBuildStamp(request, env)]);
    const ok = d1 !== "error";
    return json({ ok, build, d1, checked_at: new Date().toISOString() }, ok ? 200 : 503, {
      "Cache-Control": "no-store",
    });
  },
});
