#!/usr/bin/env node
/**
 * Synthetic check: hits /api/health and the BCPSS read APIs (units list, one unit) with timeouts.
 *
 *   node tools/synthetic-check.mjs <baseUrl> [--timeout-ms=5000] [--allow-production]
 *
 * Exit 0 every check passed, 1 a check failed, 3 could not run (bad usage or refused target; CI treats 3 as failure).
 * Read-only GETs. Production hosts are refused unless --allow-production is given on purpose, so a
 * test or a stray run cannot probe the live site. Runbook: docs/runbooks/observability.md
 */
import { pathToFileURL } from "node:url";

export const PRODUCTION_HOSTS = [
  "eduwonderlab.com",
  "www.eduwonderlab.com",
  "thelanguagepage.com",
  "www.thelanguagepage.com",
];
const DEFAULT_TIMEOUT_MS = 5000;

async function getJson(url, timeoutMs, fetchImpl) {
  const started = Date.now();
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs), redirect: "manual" });
  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    // leave null; the check reports "not JSON"
  }
  return { res, body, ms: Date.now() - started };
}

/** Run the checks in order; the unit-detail check uses an id found by the list check. */
export async function runChecks(
  baseUrl,
  { timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch } = {},
) {
  const results = [];
  const record = async (name, path, verify) => {
    const url = new URL(path, baseUrl).href;
    try {
      const { res, body, ms } = await getJson(url, timeoutMs, fetchImpl);
      const problem = verify(res, body);
      results.push({ name, ok: !problem, ms, detail: problem || `HTTP ${res.status}` });
      return body;
    } catch (err) {
      const detail =
        err?.name === "TimeoutError"
          ? `timed out after ${timeoutMs} ms`
          : `request failed (${err?.name || "Error"})`;
      results.push({ name, ok: false, ms: timeoutMs, detail });
      return null;
    }
  };
  const expectJson = (res, body) =>
    res.status !== 200 ? `HTTP ${res.status}` : body === null ? "response is not JSON" : "";

  await record("health", "/api/health", (res, body) => {
    const base = expectJson(res, body);
    if (base) return base;
    if (body.ok !== true) return "health reports ok=false";
    if (typeof body.build?.commit !== "string") return "no build stamp";
    if (!(res.headers.get("cache-control") || "").includes("no-store"))
      return "health is cacheable";
    return "";
  });
  const list = await record("units list", "/api/bcpss/units?grade=6&subject=Math", (res, body) => {
    const base = expectJson(res, body);
    if (base) return base;
    return Array.isArray(body.units) && body.units.length > 0 ? "" : "units list is empty";
  });
  const unitId = list?.units?.[0]?.id;
  if (!unitId) {
    results.push({
      name: "unit detail",
      ok: false,
      ms: 0,
      detail: "skipped: no unit id from the list",
    });
  } else {
    await record("unit detail", `/api/bcpss/units/${encodeURIComponent(unitId)}`, (res, body) => {
      const base = expectJson(res, body);
      if (base) return base;
      return (body.unit?.id || body.id) === unitId
        ? ""
        : "detail does not match the requested unit";
    });
  }
  return results;
}

export function parseArgs(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const timeoutArg = argv.find((a) => a.startsWith("--timeout-ms="));
  const timeoutMs = timeoutArg ? Number(timeoutArg.split("=")[1]) : DEFAULT_TIMEOUT_MS;
  return {
    baseUrl: argv.find((a) => !a.startsWith("--")),
    timeoutMs,
    allowProduction: flags.has("--allow-production"),
  };
}

export async function main(
  argv,
  { fetchImpl = fetch, out = console.log, err = console.error } = {},
) {
  const { baseUrl, timeoutMs, allowProduction } = parseArgs(argv);
  if (!baseUrl) {
    err("usage: node tools/synthetic-check.mjs <baseUrl> [--timeout-ms=5000] [--allow-production]");
    return 3;
  }
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    err(`not a URL: ${baseUrl}`);
    return 3;
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs < 100 || timeoutMs > 60_000) {
    err("--timeout-ms must be between 100 and 60000");
    return 3;
  }
  if (PRODUCTION_HOSTS.includes(url.hostname) && !allowProduction) {
    err(`refusing to probe production host ${url.hostname} without --allow-production`);
    return 3;
  }
  const results = await runChecks(url.origin, { timeoutMs, fetchImpl });
  for (const r of results)
    out(
      `${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(12)} ${String(r.ms).padStart(5)} ms  ${r.detail}`,
    );
  const failed = results.filter((r) => !r.ok).length;
  out(
    failed
      ? `\n${failed} of ${results.length} checks failed`
      : `\nall ${results.length} checks passed`,
  );
  return failed ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      console.error(`synthetic-check error: ${e?.name || "Error"}`);
      process.exit(3);
    },
  );
}
