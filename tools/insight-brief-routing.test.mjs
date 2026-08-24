import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Load insight engine
await import("../teacher-tools/insight-brief/insight-engine.js");
const engine = globalThis.NTInsightEngine;

// Parse CLI args for optional --base flag
const args = process.argv.slice(2);
let baseUrl = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--base" && args[i + 1]) {
    baseUrl = args[i + 1].replace(/\/+$/, "");
    i++;
  } else if (args[i].startsWith("--base=")) {
    baseUrl = args[i].slice(7).replace(/\/+$/, "");
  }
}

/**
 * Validates catch-up routing across all core lessons against canonical stations.
 * @param {Object} options
 * @param {Function} [options.customRouter] Optional routing function override for negative control testing.
 * @param {Array<string>} [options.customLessons] Optional core lesson list override.
 * @param {Array<Object>} [options.customStations] Optional canonical station manifest override.
 * @param {string} [options.base] Optional base URL for HTTP/HTTPS verification.
 * @returns {Promise<{ checkedLessons: number, checkedStations: number }>}
 */
export async function validateCatchupRouting(options = {}) {
  const router = options.customRouter || engine.catchupPath;
  const allCatchupRows = JSON.parse(readFileSync(join(ROOT, "tools/catchup-rows.json"), "utf8"));
  // The 20 canonical unit-slice stations (excluding the 16 legacy-strand stations)
  const canonicalCatchupRows =
    options.customStations ||
    allCatchupRows.filter((r) => r.range && r.range.includes("–") && !r.range.includes("·"));
  assert.equal(canonicalCatchupRows.length, 20, "expected exactly 20 canonical catchup rows");

  const canonStationMap = new Map(canonicalCatchupRows.map((r) => [r.id, r]));
  const canonicalSet = new Set(canonicalCatchupRows.map((r) => r.id));
  const base = options.base || baseUrl;

  // Sweep all core lessons directly from lessons/
  const coreLessons =
    options.customLessons ||
    readdirSync(join(ROOT, "lessons"), { withFileTypes: true })
      .filter((e) => e.isDirectory() && /^\d+-\d+$/.test(e.name))
      .map((e) => e.name)
      .sort((a, b) => {
        const [uA, lA] = a.split("-").map(Number);
        const [uB, lB] = b.split("-").map(Number);
        return uA !== uB ? uA - uB : lA - lB;
      });

  const inboundCounts = new Map();
  for (const row of canonicalCatchupRows) {
    inboundCounts.set(row.id, []);
  }

  for (const lessonId of coreLessons) {
    const dottedId = lessonId.replace("-", ".");
    const [sourceUnitStr, sourceLessonStr] = lessonId.split("-");
    const sourceUnit = Number(sourceUnitStr);
    const sourceLessonNum = Number(sourceLessonStr);

    const targetUrl = router(dottedId);
    if (!targetUrl || typeof targetUrl !== "string") {
      throw new Error(`routing: lesson ${lessonId} produced invalid target URL: ${targetUrl}`);
    }

    const stationId = targetUrl.replace(/^\/lessons\//, "").replace(/\/$/, "");

    // Assertion 3 (Required by user): No route may target a station outside the 20 canonical ones
    if (!canonicalSet.has(stationId)) {
      throw new Error(
        `routing: lesson ${lessonId} routes to non-canonical station "${stationId}" (${targetUrl}) which is not one of the 20 canonical stations`,
      );
    }

    let docTitle = "";
    let targetUnit = null;

    if (base) {
      // Remote HTTP/HTTPS fetch for production verification
      const fullUrl = `${base}${targetUrl}`;
      const resp = await fetch(fullUrl, {
        headers: { "User-Agent": "nt-routing-gate/1.0" },
      });
      if (!resp.ok) {
        throw new Error(
          `routing: lesson ${lessonId} target ${fullUrl} returned HTTP ${resp.status} ${resp.statusText}`,
        );
      }
      const html = await resp.text();
      const docTitleMatch = html.match(/<title>(.*?)<\/title>/);
      docTitle = docTitleMatch ? docTitleMatch[1] : "";

      // Try fetching config.json
      const configUrl = `${base}/lessons/${stationId}/config.json`;
      const cfgResp = await fetch(configUrl, {
        headers: { "User-Agent": "nt-routing-gate/1.0" },
      });
      if (cfgResp.ok) {
        try {
          const cfg = await cfgResp.json();
          targetUnit = Number(cfg.unit);
        } catch {}
      }
    } else {
      // Local filesystem read
      const stationDir = join(ROOT, "lessons", stationId);
      const htmlPath = join(stationDir, "index.html");
      const configPath = join(stationDir, "config.json");

      if (!existsSync(htmlPath)) {
        throw new Error(
          `routing: lesson ${lessonId} points at dead link ${targetUrl} (missing index.html)`,
        );
      }
      if (!existsSync(configPath)) {
        throw new Error(`routing: lesson ${lessonId} target ${targetUrl} is missing config.json`);
      }

      const stationConfig = JSON.parse(readFileSync(configPath, "utf8"));
      const htmlContent = readFileSync(htmlPath, "utf8");
      const docTitleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
      docTitle = docTitleMatch ? docTitleMatch[1] : "";
      targetUnit = Number(stationConfig.unit);
    }

    // Assertion 1: Identity Check (Unit, Scope, and Title)
    if (targetUnit !== null && targetUnit !== sourceUnit) {
      throw new Error(
        `routing: lesson ${lessonId} (Unit ${sourceUnit}) routed to cross-unit station ${targetUrl} (Unit ${targetUnit})`,
      );
    }

    const canonInfo = canonStationMap.get(stationId);
    if (canonInfo && canonInfo.range) {
      const [startStr, endStr] = canonInfo.range.split("–");
      const startNum = Number(startStr.split(".")[1]);
      const endNum = Number(endStr.split(".")[1]);
      if (sourceLessonNum < startNum || sourceLessonNum > endNum) {
        throw new Error(
          `routing: lesson ${lessonId} out of range for station ${targetUrl} (station covers ${canonInfo.range})`,
        );
      }
    }

    if (!docTitle.includes("Catch-Up")) {
      throw new Error(
        `routing: lesson ${lessonId} target page ${targetUrl} title does not render Catch-Up: "${docTitle}"`,
      );
    }

    // Track inbound route
    inboundCounts.get(stationId).push(lessonId);
  }

  // Assertion 2: Completeness Check (Every canonical station must have at least 1 inbound route)
  const orphanedStations = [];
  for (const [stationId, sources] of inboundCounts.entries()) {
    if (sources.length === 0) {
      orphanedStations.push(stationId);
    }
  }

  if (orphanedStations.length > 0) {
    throw new Error(
      `routing: orphaned canonical station(s) with 0 inbound routes: ${orphanedStations.join(", ")}`,
    );
  }

  return {
    checkedLessons: coreLessons.length,
    checkedStations: canonicalCatchupRows.length,
  };
}

// ── Main Execution ────────────────────────────────────────────────────────────

// 1. Positive Sweep
const result = await validateCatchupRouting();
assert.equal(result.checkedLessons, 84, "expected 84 core lessons checked");
assert.equal(result.checkedStations, 20, "expected 20 canonical stations checked");
console.log(
  `✓ Catch-up routing gate passed: ${result.checkedLessons} lessons mapped with verified identity to ${result.checkedStations} canonical stations ${baseUrl ? `(${baseUrl})` : "(local)"}.`,
);

// 2. Negative Controls (only run locally to avoid hitting remote servers unnecessarily)
if (!baseUrl) {
  // Negative Control A: Non-canonical station route fails naming the non-canonical station
  await assert.rejects(
    async () => {
      await validateCatchupRouting({
        customRouter: (id) => (id === "2.4" ? "/lessons/2-5-catchup/" : engine.catchupPath(id)),
      });
    },
    (err) => {
      assert.match(err.message, /lesson 2-4 routes to non-canonical station "2-5-catchup"/);
      return true;
    },
    "negative control A: non-canonical station routing for lesson 2-4 must fail naming 2-5-catchup",
  );

  // Negative Control B: Dead link fails naming the broken route
  await assert.rejects(
    async () => {
      await validateCatchupRouting({
        customRouter: (id) => (id === "1.5" ? "/lessons/1-7-catchup/" : engine.catchupPath(id)),
      });
    },
    (err) => {
      assert.match(err.message, /non-canonical station "1-7-catchup"/);
      return true;
    },
    "negative control B: dead link for lesson 1-5 must fail naming 1-7-catchup",
  );

  // Negative Control C: Out-of-range route fails naming the lesson and range
  await assert.rejects(
    async () => {
      await validateCatchupRouting({
        customRouter: (id) => (id === "1.4" ? "/lessons/1-3-catchup/" : engine.catchupPath(id)),
      });
    },
    (err) => {
      assert.match(err.message, /lesson 1-4 out of range for station \/lessons\/1-3-catchup\//);
      return true;
    },
    "negative control C: out-of-range routing for lesson 1-4 must fail naming lesson 1-4",
  );

  // Negative Control D: Orphaned station fails naming the orphaned station
  await assert.rejects(
    async () => {
      const allCoreExcept14_16 = readdirSync(join(ROOT, "lessons"), {
        withFileTypes: true,
      })
        .filter(
          (e) =>
            e.isDirectory() && /^\d+-\d+$/.test(e.name) && !["1-4", "1-5", "1-6"].includes(e.name),
        )
        .map((e) => e.name);
      await validateCatchupRouting({
        customLessons: allCoreExcept14_16,
      });
    },
    (err) => {
      assert.match(
        err.message,
        /orphaned canonical station\(s\) with 0 inbound routes: 1-6-catchup/,
      );
      return true;
    },
    "negative control D: unrouted station 1-6-catchup must fail naming 1-6-catchup",
  );

  console.log(
    "✓ All negative controls passed (non-canonical target, dead-link, out-of-range, orphaned station).",
  );
}
