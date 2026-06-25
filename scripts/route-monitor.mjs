#!/usr/bin/env node
// Synthetic live-route monitor for the classroom site.
//
// Hits a manifest of LIVE routes and asserts each one serves the RIGHT app:
//   - the expected HTTP status (public => 200, gated => 401 or open-with-markers)
//   - all distinctive content markers present (proves it is OUR page, not a
//     foreign or stripped deploy)
//   - no foreign-app marker present
//
// This is the assertion layer the night-shift visual QA lacked: a deploy can
// return 200 while serving the wrong application (see the whole-site-overwrite
// and curriculum-clobber incidents). Missing markers catch exactly that.
//
// Pure Node, zero deps, native fetch (Node 18+). Importable (runRouteMonitor)
// and runnable as a CLI:
//   node scripts/route-monitor.mjs                 # uses manifest base
//   node scripts/route-monitor.mjs --base https://staging.example.com
//   node scripts/route-monitor.mjs --json          # machine-readable
// Exit code: 0 = all clean (warnings allowed), 1 = one or more FAILs,
//            2 = could not run (no manifest / bad args).
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_MANIFEST = path.join(HERE, "..", "night-shift", "route-manifest.json");
const BODY_CAP = 512 * 1024; // read at most 512 KB of each page for marker checks

/** Fetch one URL, following redirects, with a hard timeout. Never throws. */
async function probe(url, timeoutMs, fetchImpl) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "neft-route-monitor/1.0" },
    });
    const ct = res.headers.get("content-type") || "";
    let body = "";
    // Only read a body when it could carry markers (html/text); cap the read.
    if (/text|html|json|xml/i.test(ct) || res.status === 200) {
      const full = await res.text();
      body = full.length > BODY_CAP ? full.slice(0, BODY_CAP) : full;
    }
    return { ok: true, status: res.status, contentType: ct, body };
  } catch (err) {
    return { ok: false, status: 0, contentType: "", body: "", error: err.name === "AbortError" ? `timeout after ${timeoutMs}ms` : String(err.message || err) };
  } finally {
    clearTimeout(timer);
  }
}

function missingMarkers(body, markers) {
  return (markers || []).filter((m) => !body.includes(m));
}
function presentMarkers(body, markers) {
  return (markers || []).filter((m) => body.includes(m));
}

/** Evaluate a single route's probe result into { level, note }. */
function classify(route, forbidMarkers, r) {
  const label = route.label || route.path;
  if (!r.ok) return { level: "fail", note: `unreachable — ${r.error}` };

  const expect = route.expect || "public";
  const forbidHit = presentMarkers(r.body, forbidMarkers);

  if (expect === "gated") {
    if (r.status === 401) return { level: "ok", note: "gate enforced (401)" };
    if (r.status === 200) {
      const miss = missingMarkers(r.body, route.requireMarkers);
      if (forbidHit.length) return { level: "fail", note: `200 but foreign-app marker present: "${forbidHit[0]}"` };
      if (miss.length) return { level: "fail", note: `200 but wrong content (missing: ${miss.map((m) => `"${m}"`).join(", ")})` };
      return { level: "warn", note: "gate OPEN — SITE_PASSWORD not enforcing (right app, but teacher page is public)" };
    }
    return { level: "fail", note: `unexpected status ${r.status} (expected 401 or gated 200)` };
  }

  // public
  if (r.status !== 200) return { level: "fail", note: `status ${r.status} (expected 200)` };
  if (forbidHit.length) return { level: "fail", note: `foreign-app marker present: "${forbidHit[0]}" — wrong deploy?` };
  const miss = missingMarkers(r.body, route.requireMarkers);
  if (miss.length) return { level: "fail", note: `right status, WRONG/stale content — missing: ${miss.map((m) => `"${m}"`).join(", ")}` };
  if (!/html/i.test(r.contentType)) return { level: "warn", note: `markers ok but content-type is "${r.contentType || "?"}"` };
  return { level: "ok", note: "200, content verified" };
}

/**
 * Run the monitor.
 * @param {object} opts
 * @param {object} opts.manifest parsed route-manifest.json
 * @param {string} [opts.base] override manifest.base
 * @param {function} [opts.fetchImpl] injectable fetch (tests); defaults to global fetch
 * @returns {Promise<{base,when,counts,results}>}
 */
export async function runRouteMonitor({ manifest, base, fetchImpl = fetch } = {}) {
  if (!manifest || !Array.isArray(manifest.routes)) {
    throw new Error("route-monitor: manifest with a routes[] array is required");
  }
  const root = (base || manifest.base || "").replace(/\/+$/, "");
  if (!root) throw new Error("route-monitor: no base URL (set manifest.base or pass --base)");
  const timeoutMs = manifest.timeoutMs || 15000;
  const forbid = manifest.forbidMarkers || [];

  const results = [];
  for (const route of manifest.routes) {
    const url = root + route.path;
    const r = await probe(url, timeoutMs, fetchImpl);
    const { level, note } = classify(route, forbid, r);
    results.push({
      path: route.path,
      label: route.label || route.path,
      expect: route.expect || "public",
      url,
      status: r.status,
      level,
      note,
    });
  }

  const counts = results.reduce(
    (a, x) => ((a[x.level] = (a[x.level] || 0) + 1), a),
    { ok: 0, warn: 0, fail: 0 },
  );
  return { base: root, when: new Date().toISOString(), counts, results };
}

// ---- CLI ---------------------------------------------------------------
async function main(argv) {
  const args = argv.slice(2);
  const asJson = args.includes("--json");
  const baseIdx = args.indexOf("--base");
  const base = baseIdx >= 0 ? args[baseIdx + 1] : undefined;
  const manIdx = args.indexOf("--manifest");
  const manifestPath = manIdx >= 0 ? args[manIdx + 1] : DEFAULT_MANIFEST;

  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (e) {
    console.error(`route-monitor: cannot read manifest at ${manifestPath}: ${e.message}`);
    return 2;
  }

  let report;
  try {
    report = await runRouteMonitor({ manifest, base });
  } catch (e) {
    console.error(`route-monitor: ${e.message}`);
    return 2;
  }

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const icon = { ok: "✅", warn: "⚠️ ", fail: "❌" };
    console.log(`Route monitor — ${report.base}  (${report.when})`);
    for (const r of report.results) {
      console.log(`  ${icon[r.level]} [${String(r.status).padStart(3)}] ${r.label} — ${r.note}`);
    }
    console.log(`  ${report.counts.ok}✅  ${report.counts.warn}⚠️  ${report.counts.fail}❌`);
  }
  return report.counts.fail > 0 ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main(process.argv).then((code) => process.exit(code));
}
