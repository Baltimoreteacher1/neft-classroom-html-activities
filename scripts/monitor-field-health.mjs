#!/usr/bin/env node
/**
 * Read-only production monitor for anonymous field errors and Core Web Vitals.
 * The endpoint exposes aggregate health only—never paths, messages, identifiers,
 * or individual measurements—so scheduled checks need no private configuration.
 */
import { pathToFileURL } from "node:url";

const DEFAULT_BASE = "https://eduwonderlab.com";

export function evaluateFieldStatus(payload) {
  if (!payload || payload.backend !== "d1" || typeof payload.ok !== "boolean") {
    return { ok: false, lines: ["field signal endpoint returned an invalid payload"] };
  }

  const errors = payload.clientErrors || {};
  const lines = [
    `client errors: ${Number(errors.hits) || 0} hit(s) / ${Number(errors.views) || 0} view(s) ` +
      `(${Number(errors.ratePercent) || 0}%) — ${errors.status || "unknown"}`,
  ];
  for (const row of payload.vitals || []) {
    const percent = row.goodPercent == null ? "n/a" : `${row.goodPercent}% good`;
    lines.push(
      `${row.metric || "?"}/${row.device || "?"}: ${Number(row.samples) || 0} sample(s), ` +
        `${percent} — ${row.status || "unknown"}`,
    );
  }
  if (!(payload.vitals || []).length) lines.push("Core Web Vitals: awaiting field samples");
  return { ok: payload.ok, lines };
}

async function main(argv) {
  const args = argv.slice(2);
  const baseIndex = args.indexOf("--base");
  const base = (
    baseIndex >= 0 ? args[baseIndex + 1] : process.env.NEFT_SITE || DEFAULT_BASE
  ).replace(/\/+$/, "");
  const asJson = args.includes("--json");
  const url = `${base}/api/signal/status`;

  let response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": "neft-field-health-monitor/1.0" },
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error(`✗ field health unavailable: ${error.message || error}`);
    return 1;
  }
  if (!response.ok) {
    console.error(`✗ field health returned HTTP ${response.status}: ${url}`);
    return 1;
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    console.error("✗ field health response was not JSON");
    return 1;
  }
  const result = evaluateFieldStatus(payload);
  if (asJson) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`Field health — ${base}`);
    for (const line of result.lines) console.log(`  ${result.ok ? "✓" : "✗"} ${line}`);
  }
  return result.ok ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main(process.argv).then((code) => process.exit(code));
}
