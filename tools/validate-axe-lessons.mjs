#!/usr/bin/env node
// validate:axe-lessons - axe-core (WCAG 2.0 / 2.1 / 2.2, levels A and AA) over every lesson.
//
//   node tools/validate-axe-lessons.mjs --base http://localhost:4603 [--lessons 1-1] [--viewport 390x844]
//
// Runs axe on the entry card, the lesson, the warm-up feedback state and EVERY sidebar phase.
// FAILS on any `serious` or `critical` violation; `moderate` and `minor` are counted and
// reported per lesson but do not fail (raise the bar with --fail-on moderate).
// axe's "incomplete" results (it could not decide) are counted, never silently dropped.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { runGates } from "./lib/lesson-gate-kit.mjs";

const require = createRequire(import.meta.url);
const AXE_PATH = require.resolve("axe-core/axe.min.js");
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const RANK = { minor: 1, moderate: 2, serious: 3, critical: 4 };

async function probe(page) {
  if (!(await page.evaluate(() => typeof window.axe !== "undefined")))
    await page.addScriptTag({ path: AXE_PATH });
  return page.evaluate(async (tags) => {
    const r = await window.axe.run(document, {
      runOnly: { type: "tag", values: tags },
      resultTypes: ["violations", "incomplete"],
    });
    return {
      violations: r.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help.slice(0, 90),
        nodes: v.nodes.length,
        targets: v.nodes.slice(0, 3).map((n) => String(n.target[0]).slice(0, 90)),
      })),
      incomplete: r.incomplete.length,
    };
  }, TAGS);
}

function judge(records, { args }) {
  const failOn = RANK[args["fail-on"]] || RANK.serious;
  const findings = [];
  const perLesson = {};
  const totals = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  let incomplete = 0;
  let statesRun = 0;
  const ruleCount = {};
  for (const r of records) {
    const pl = (perLesson[r.id] ||= {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      incomplete: 0,
    });
    const seen = new Set();
    for (const st of r.states) {
      const d = st.data["axe-lessons"];
      if (!d || d.probeError) continue;
      statesRun++;
      incomplete += d.incomplete;
      pl.incomplete += d.incomplete;
      for (const v of d.violations) {
        const k = `${v.id}|${v.targets[0]}`;
        if (seen.has(k)) continue;
        seen.add(k);
        totals[v.impact] = (totals[v.impact] || 0) + 1;
        pl[v.impact] = (pl[v.impact] || 0) + 1;
        ruleCount[`${v.impact}:${v.id}`] = (ruleCount[`${v.impact}:${v.id}`] || 0) + 1;
        if ((RANK[v.impact] || 0) >= failOn)
          findings.push({
            key: `axe|${v.id}|${String(v.targets[0]).replace(/\d+/g, "N")}`,
            lesson: r.id,
            viewport: r.viewport,
            state: st.label,
            detail: `[${v.impact}] ${v.id}: ${v.help} (${v.nodes} node(s), e.g. ${v.targets[0]})`,
          });
      }
    }
  }
  const guards = [];
  if (statesRun === 0 && records.length)
    guards.push("axe ran on ZERO states (script injection failed?)");
  const top = Object.entries(ruleCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, n]) => `${k} x${n}`)
    .join(", ");
  return {
    findings,
    guards,
    perLesson,
    stats: { axeRuns: statesRun, ...totals, incomplete, topRules: ruleCount },
    lines: [
      `axe runs: ${statesRun}; critical ${totals.critical}, serious ${totals.serious} (FAIL); moderate ${totals.moderate}, minor ${totals.minor} (reported); incomplete ${incomplete}`,
      `most frequent rules: ${top || "none"}`,
    ],
  };
}

export const gate = { name: "axe-lessons", viewports: ["1366x768"], feedback: true, probe, judge };
if (import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(await runGates([gate]));
