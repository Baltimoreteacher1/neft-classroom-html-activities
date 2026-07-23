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
import { execFileSync } from "node:child_process";
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
    return {
      ok: false,
      status: 0,
      contentType: "",
      body: "",
      error:
        err.name === "AbortError" ? `timeout after ${timeoutMs}ms` : String(err.message || err),
    };
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

/** Short 7-char SHA for display. */
function short(c) {
  return c ? String(c).slice(0, 7) : "?";
}
/** Human age string from hours. */
function ageStr(hours) {
  if (!isFinite(hours)) return "unknown age";
  return hours < 48 ? `${hours.toFixed(1)}h` : `${(hours / 24).toFixed(1)}d`;
}

/**
 * Classify the live deploy build-stamp into a freshness verdict. This catches
 * the incident class marker-checks CANNOT: the RIGHT app serving a STALE build
 * (production frozen while main moves on). The stamp
 * (/access-practice-lab/config.json, written by tools/stamp-build.mjs) carries
 * the deployed commit SHA + build time.
 *   - live commit == expected (main HEAD)     -> ok (fresh)
 *   - mismatch but built within graceHours     -> warn (build likely in flight)
 *   - mismatch and older than graceHours       -> fail (production not tracking main)
 *   - no expected commit: age-only guard vs staleHours
 */
function classifyFreshness({ stampRes, expectedCommit, graceHours, staleHours, now }) {
  if (!stampRes.ok) return { level: "warn", note: `build stamp unreadable — ${stampRes.error}` };
  const s = stampRes.stamp || {};
  const live = String(s.commit || "");
  const built = Date.parse(s.builtAt || "");
  const ageH = isFinite(built) ? (now - built) / 3.6e6 : Infinity;
  const age = ageStr(ageH);

  if (expectedCommit && live && live !== "local") {
    const match =
      live === expectedCommit ||
      live.startsWith(expectedCommit) ||
      expectedCommit.startsWith(live);
    if (match) return { level: "ok", note: `fresh — live ${short(live)} == main, built ${age} ago` };
    if (ageH <= graceHours)
      return {
        level: "warn",
        note: `deploy lag — live ${short(live)} != main ${short(expectedCommit)}, built ${age} ago (build may be in progress)`,
      };
    return {
      level: "fail",
      note: `STALE deploy — live ${short(live)} != main ${short(expectedCommit)}, last build ${age} ago (>${graceHours}h). Production is not tracking main.`,
    };
  }
  // No expected commit to compare against — fall back to a pure age guard.
  if (ageH > staleHours)
    return {
      level: "fail",
      note: `STALE — last production build ${age} ago (>${staleHours}h), live ${short(live)}`,
    };
  return { level: "ok", note: `built ${age} ago, live ${short(live)}` };
}

/** Evaluate a single route's probe result into { level, note }. */
function classify(route, forbidMarkers, r) {
  const _label = route.label || route.path;
  if (!r.ok) return { level: "fail", note: `unreachable — ${r.error}` };

  // Explicit status expectation — lets a route assert a NEGATIVE/runtime path,
  // e.g. /api/scorm on a bogus target must 404 (proves the target-exists
  // validation runs in production, not just in the source guard). Still checks
  // forbidden + required markers so a 404 page must be OUR error page.
  if (route.expectStatus) {
    if (r.status !== route.expectStatus)
      return { level: "fail", note: `status ${r.status} (expected ${route.expectStatus})` };
    const forbid = presentMarkers(r.body, forbidMarkers);
    if (forbid.length)
      return { level: "fail", note: `foreign-app marker present: "${forbid[0]}"` };
    const miss = missingMarkers(r.body, route.requireMarkers);
    if (miss.length)
      return {
        level: "fail",
        note: `${r.status} but missing marker(s): ${miss.map((m) => `"${m}"`).join(", ")}`,
      };
    return {
      level: "ok",
      note: `${r.status} as expected${route.requireMarkers?.length ? ", content verified" : ""}`,
    };
  }

  const expect = route.expect || "public";
  const forbidHit = presentMarkers(r.body, forbidMarkers);

  if (expect === "gated") {
    if (r.status === 401) return { level: "ok", note: "gate enforced (401)" };
    if (r.status === 200) {
      const miss = missingMarkers(r.body, route.requireMarkers);
      if (forbidHit.length)
        return { level: "fail", note: `200 but foreign-app marker present: "${forbidHit[0]}"` };
      if (miss.length)
        return {
          level: "fail",
          note: `200 but wrong content (missing: ${miss.map((m) => `"${m}"`).join(", ")})`,
        };
      return {
        level: "warn",
        note: "gate OPEN — SITE_PASSWORD not enforcing (right app, but teacher page is public)",
      };
    }
    return { level: "fail", note: `unexpected status ${r.status} (expected 401 or gated 200)` };
  }

  // public
  if (r.status !== 200) return { level: "fail", note: `status ${r.status} (expected 200)` };
  if (forbidHit.length)
    return { level: "fail", note: `foreign-app marker present: "${forbidHit[0]}" — wrong deploy?` };
  const miss = missingMarkers(r.body, route.requireMarkers);
  if (miss.length)
    return {
      level: "fail",
      note: `right status, WRONG/stale content — missing: ${miss.map((m) => `"${m}"`).join(", ")}`,
    };
  if (!/html/i.test(r.contentType)) {
    // Non-HTML endpoints (e.g. the /api/scorm zip) declare their expected
    // content-type in the manifest so a correct response isn't a nightly warn.
    if (route.contentTypeOk && new RegExp(route.contentTypeOk, "i").test(r.contentType))
      return { level: "ok", note: `200, content verified (${r.contentType})` };
    return { level: "warn", note: `markers ok but content-type is "${r.contentType || "?"}"` };
  }
  return { level: "ok", note: "200, content verified" };
}

/**
 * Run the monitor.
 * @param {object} opts
 * @param {object} opts.manifest parsed route-manifest.json
 * @param {string} [opts.base] override manifest.base
 * @param {string} [opts.expectedCommit] commit main HEAD should be serving (freshness check)
 * @param {number} [opts.now] epoch ms (tests); defaults to Date.now()
 * @param {function} [opts.fetchImpl] injectable fetch (tests); defaults to global fetch
 * @returns {Promise<{base,when,counts,results}>}
 */
export async function runRouteMonitor({
  manifest,
  base,
  expectedCommit,
  now = Date.now(),
  fetchImpl = fetch,
} = {}) {
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

  // Deploy-freshness check: is the RIGHT app also the LATEST build? Uses the
  // public build stamp (commit + builtAt). Configured via manifest.deployStamp.
  const ds = manifest.deployStamp;
  if (ds && ds.path) {
    const url = root + ds.path;
    const r = await probe(url, timeoutMs, fetchImpl);
    let stampRes;
    if (!r.ok) stampRes = { ok: false, error: r.error };
    else if (r.status !== 200) stampRes = { ok: false, error: `status ${r.status}` };
    else {
      try {
        stampRes = { ok: true, stamp: JSON.parse(r.body) };
      } catch {
        stampRes = { ok: false, error: "stamp not JSON" };
      }
    }
    const { level, note } = classifyFreshness({
      stampRes,
      expectedCommit,
      graceHours: ds.graceHours || 6,
      staleHours: ds.staleHours || 72,
      now,
    });
    results.push({
      path: ds.path,
      label: "Deploy freshness (build stamp)",
      expect: "freshness",
      url,
      status: r.status,
      level,
      note,
    });
  }

  const counts = results.reduce((a, x) => ((a[x.level] = (a[x.level] || 0) + 1), a), {
    ok: 0,
    warn: 0,
    fail: 0,
  });
  return { base: root, when: new Date().toISOString(), counts, results };
}

// ---- CLI ---------------------------------------------------------------
/** Resolve the commit production SHOULD be serving: --expected, env, or git HEAD. */
export function resolveExpectedCommit(explicit) {
  if (explicit) return explicit;
  if (process.env.CF_EXPECTED_COMMIT) return process.env.CF_EXPECTED_COMMIT;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: HERE, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

async function main(argv) {
  const args = argv.slice(2);
  const asJson = args.includes("--json");
  const baseIdx = args.indexOf("--base");
  const base = baseIdx >= 0 ? args[baseIdx + 1] : undefined;
  const manIdx = args.indexOf("--manifest");
  const manifestPath = manIdx >= 0 ? args[manIdx + 1] : DEFAULT_MANIFEST;
  const expIdx = args.indexOf("--expected");
  const expectedCommit = resolveExpectedCommit(expIdx >= 0 ? args[expIdx + 1] : undefined);

  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (e) {
    console.error(`route-monitor: cannot read manifest at ${manifestPath}: ${e.message}`);
    return 2;
  }

  let report;
  try {
    report = await runRouteMonitor({ manifest, base, expectedCommit });
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
