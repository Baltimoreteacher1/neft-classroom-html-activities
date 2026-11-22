#!/usr/bin/env node
/**
 * Assemble reports/language-page-quality/REPORT.md (sections A-O) and print a terminal summary.
 *
 *   node reports/language-page-quality/tools/assemble-report.mjs [--dir <report dir>] [--out <REPORT.md>] [--expect <n>]
 *
 * Inputs (all optional except inventory.json):
 *   inventory.json          families + activity records (tools/enumerate.mjs)
 *   baseline-scores.json    platform baseline scores per family with evidence
 *   rubric.json             dimension keys and weights
 *   crawl-baseline.json     crawler results on baseline (tools/crawl.mjs)
 *   crawl-after.json        crawler results after the overhaul (same tool, run on the merged branch)
 *   fragments/*.json        one fragment per area agent (shape in the master brief)
 *
 * Rules: every number is computed from these inputs. A missing input produces a "not available" line, never a
 * placeholder figure. Malformed fragments are reported and skipped. Overall scores are only computed when all
 * eleven dimensions are present for that entry. Re-running with the same inputs gives identical output.
 */
import fs from "node:fs";
import path from "node:path";

const HERE = import.meta.dirname;
const argv = process.argv.slice(2);
const opt = (n, d) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const DIR = path.resolve(opt("dir", path.resolve(HERE, "..")));
const OUT = path.resolve(opt("out", path.join(DIR, "REPORT.md")));
const EXPECT = Number(opt("expect", 8));
const KEYS = "ABCDEFGHIJK".split("");

const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } };
const inv = readJson(path.join(DIR, "inventory.json"));
if (!inv) { console.error(`inventory.json not found in ${DIR}; run tools/enumerate.mjs first.`); process.exit(1); }
const baseline = readJson(path.join(DIR, "baseline-scores.json"));
const rubric = readJson(path.join(DIR, "rubric.json")) || { dimensions: KEYS.map((k) => ({ key: k, name: k, weight: 1 / 11 })) };
const crawlBefore = readJson(path.join(DIR, "crawl-baseline.json"));
const crawlAfter = readJson(path.join(DIR, "crawl-after.json"));
const W = Object.fromEntries(rubric.dimensions.map((d) => [d.key, d.weight]));
const NAME = Object.fromEntries(rubric.dimensions.map((d) => [d.key, d.name]));

// ---------------------------------------------------------------- fragments
const fragDir = path.join(DIR, "fragments");
const fragments = [], badFragments = [];
for (const f of fs.existsSync(fragDir) ? fs.readdirSync(fragDir).filter((x) => x.endsWith(".json")).sort() : []) {
  const j = readJson(path.join(fragDir, f));
  if (j && typeof j === "object" && !Array.isArray(j)) fragments.push({ file: f, ...j, area: j.area || f.replace(/\.json$/, "") });
  else badFragments.push(f);
}

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n+/g, " ");
const asText = (x) => (typeof x === "string" ? x : x && typeof x === "object" ? Object.entries(x).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join("; ") : String(x));
const num = (x) => (typeof x === "number" && Number.isFinite(x) ? x : null);
const arr = (x) => (Array.isArray(x) ? x : []);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const complete = (s) => s && KEYS.every((k) => num(s[k]) !== null);
const overall = (s) => (complete(s) ? Math.round(sum(KEYS.map((k) => W[k] * s[k])) * 10) / 10 : null);
const mean = (xs) => (xs.length ? Math.round((sum(xs) / xs.length) * 10) / 10 : null);
const fmtScore = (s) => KEYS.map((k) => (num(s?.[k]) !== null ? s[k] : "-")).join(" ");
const table = (head, rows) => (rows.length ? [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.map(esc).join(" | ")} |`)].join("\n") : "_None reported._");
const normUrl = (u) => String(u || "").split("#")[0].replace(/\?.*$/, "").replace(/\/+$/, "");
const scoreOf = (v) => (v && v.scores ? v.scores : v);

// baseline score table: family id -> { scores, evidence, basis }
const baseScores = {};
for (const [id, v] of Object.entries(baseline?.families || {})) baseScores[id] = { name: v.name || id, scores: v.scores || {}, evidence: v.evidence || {}, basis: v.basis || {} };
const fragBefore = {}, fragAfter = {};
for (const fr of fragments) {
  for (const [k, v] of Object.entries(fr.scoresBefore || {})) fragBefore[`${fr.area}::${k}`] = { area: fr.area, key: k, scores: scoreOf(v) };
  for (const [k, v] of Object.entries(fr.scoresAfter || {})) fragAfter[`${fr.area}::${k}`] = { area: fr.area, key: k, scores: scoreOf(v) };
}
// match a fragment key to a baseline family (exact id, or case-insensitive name)
const baseByAlias = {};
for (const [id, v] of Object.entries(baseScores)) { baseByAlias[id.toLowerCase()] = id; baseByAlias[String(v.name).toLowerCase()] = id; }

// ---------------------------------------------------------------- coverage of the baseline inventory by fragments
const fragInv = fragments.flatMap((f) => arr(f.inventory).map((r) => ({ ...r, area: f.area })));
const fragIds = new Set(fragInv.map((r) => String(r.id).toLowerCase()));
const fragUrls = new Set(fragInv.map((r) => normUrl(r.url)).filter(Boolean));
const covers = (fam) => fragIds.has(String(fam.id).toLowerCase()) || fragUrls.has(normUrl(fam.url)) || arr(fam.probe).some((u) => fragUrls.has(normUrl(u)));
const testableFams = inv.families.filter((f) => f.testable);
const coveredFams = testableFams.filter(covers);
const statusCounts = fragInv.reduce((m, r) => ((m[r.status || "unspecified"] = (m[r.status || "unspecified"] || 0) + 1), m), {});
const prioCounts = fragInv.reduce((m, r) => ((m[r.priority || "unspecified"] = (m[r.priority || "unspecified"] || 0) + 1), m), {});
const testRows = fragments.flatMap((f) => arr(f.tests).map((t) => ({ area: f.area, cmd: t.cmd || asText(t), result: t.result ?? "" })));
const classify = (r0) => { const r = String(r0).replace(/\b0 (fail\w*|error\w*)|\b(fail\w*|error\w*)[: ]+0\b/gi, ""); return classifyText(r); };
const classifyText = (r) => (/\b(fail|failed|error|red|not ok)\b/i.test(r) ? "fail" : /^(pass|passed|ok|green|exit 0)|\b(all )?\d+ pass|✓|0 fail/i.test(r) ? "pass" : "unclassified");

// ---------------------------------------------------------------- crawl comparison
const cr = (c) => c?.summary;
const crawlLine = (c, label) => {
  const s = cr(c); if (!s) return `- ${label}: not available.`;
  const ax = Object.entries(s.axe || {}).map(([w, v]) => `${w}px: ${v.pagesWithSeriousOrCritical} page(s) with serious/critical, ${v.pagesWithViolations} with any`).join("; ");
  const ov = Object.entries(s.overflowByWidth || {}).map(([w, v]) => `${w}px: ${v.length}`).join(", ");
  return `- ${label}: ${s.targets} pages x ${arr(s.widths).join("/")}px; load errors ${s.loadErrors.length}; pages with console/page errors ${s.withConsoleOrPageErrors}; horizontal overflow (pages) ${ov}; axe ${ax}; pages with targets under 44px at 390px: ${s.pagesWithTargetsUnder44at390}; interaction states: ${(s.activityInteractionStates || []).map(([k, n]) => `${k} ${n}`).join(", ")}.`;
};
const delta = (b, a) => (b === undefined || a === undefined || b === null || a === null ? "n/a" : `${a - b >= 0 ? "+" : ""}${a - b}`);

// ================================================================ build report
const md = [];
const H = (t) => md.push(`\n## ${t}\n`);
const generated = new Date().toISOString().slice(0, 10);
md.push("# The Language Page: activity quality overhaul report\n");
md.push(`Generated ${generated} by \`tools/assemble-report.mjs\` from \`inventory.json\`${baseline ? ", `baseline-scores.json`" : ""}${fragments.length ? `, ${fragments.length} fragment(s)` : ""}. Baseline = origin/main at ${inv.baseline?.originMain || inv.baseline?.commit || "unknown"}.`);
md.push("Numbers below are computed from those files. Where an input is missing the report says so instead of estimating.\n");

// A
H("A. Executive summary");
const rewritten = sum(fragments.map((f) => num(f.contentRecordsRewritten) || 0));
const critical = sum(fragments.map((f) => num(f.criticalFixed) || 0));
const sharedEditCount = sum(fragments.map((f) => arr(f.sharedEdits).length));
const beforeOverall = Object.values(baseScores).map((v) => overall(v.scores)).filter((x) => x !== null);
const afterOverall = Object.values(fragAfter).map((v) => overall(v.scores)).filter((x) => x !== null);
const beforeFragOverall = Object.values(fragBefore).map((v) => overall(v.scores)).filter((x) => x !== null);
md.push(`- Surface audited: ${inv.counts.families} families (${inv.counts.destinations} site-map destinations, ${inv.counts.coreBankActivities} core-bank activities across ${inv.families.filter((f) => f.kind === "content-family").length} band x skill families, ${inv.families.filter((f) => f.kind === "static-site-family").length} static sibling-site families), ${inv.counts.activityRecords} enumerated activity or route records; ${inv.counts.untestableFamilies} families are untestable and are listed with reasons.`);
md.push(`- Area fragments received: ${fragments.length}${EXPECT ? ` of ${EXPECT} expected` : ""}${badFragments.length ? `; unreadable: ${badFragments.join(", ")}` : ""}.`);
md.push(`- Baseline mean overall score (weighted A-K): ${beforeOverall.length ? `${mean(beforeOverall)} over ${beforeOverall.length} scored families` : "not available (no baseline-scores.json or incomplete dimensions)"}.`);
md.push(`- After-state mean overall score: ${afterOverall.length ? `${mean(afterOverall)} over ${afterOverall.length} scored entries (area-reported; before-state for the same entries: ${beforeFragOverall.length ? mean(beforeFragOverall) : "n/a"})` : "not available (no fragment reported complete after scores)"}.`);
md.push(`- Content records rewritten: ${fragments.length ? rewritten : "n/a"}; critical defects fixed: ${fragments.length ? critical : "n/a"}; shared-hotspot edits declared: ${fragments.length ? sharedEditCount : "n/a"}.`);
md.push(`- Fragment inventory records: ${fragInv.length ? `${fragInv.length} (${Object.entries(statusCounts).map(([k, n]) => `${k} ${n}`).join(", ")})` : "none yet"}.`);
md.push(`- Baseline testable families covered by at least one fragment record: ${fragments.length ? `${coveredFams.length} of ${testableFams.length}` : "n/a"}.`);
md.push(crawlLine(crawlBefore, "Baseline crawl"));
md.push(crawlLine(crawlAfter, "After crawl"));

// B
H("B. Inventory of activity families");
md.push(`Source: \`inventory.json\` (${inv.generatedBy}). One row per family; \`count\` is the number of enumerable items. Priority is the baseline priority from measured content flags and crawl results.\n`);
md.push(table(["id", "program", "type", "grade", "count", "testable", "priority", "covered by fragment"], inv.families.map((f) => [f.id, f.program, f.type, f.gradeBand, f.count ?? "", f.testable ? "yes" : "NO", f.priority, fragments.length ? (f.testable ? (covers(f) ? "yes" : "no") : "n/a") : "n/a"])));
md.push("\nUntestable or count-only surfaces:\n");
md.push(table(["id", "url", "reason"], inv.untestable.map((u) => [u.id, u.url, u.reason])));

// C
H("C. Activity-level findings");
md.push("Baseline measured content flags for the core practice bank (static analysis of `content/g*/<Domain>.json`):\n");
const flags = Object.entries(inv.counts.coreIssueCounts || {}).sort((a, b) => b[1] - a[1]);
md.push(table(["flag", "activities", "of"], flags.map(([k, n]) => [k, n, inv.counts.coreBankActivities])));
const coreFams = inv.families.filter((f) => f.kind === "content-family");
md.push("\nCore-bank metrics per band x skill family:\n");
md.push(table(["family", "n", "avg directions words", "generic correct %", "full distractor fb %", "item fb %", "hint=support %", "WIDA tag %", "ES directions %", "ES feedback %"],
  coreFams.map((f) => [f.id, f.metrics.n, f.metrics.avgDirectionsWords, f.metrics.genericCorrectPct, f.metrics.distractorFeedbackFullPct ?? "n/a", f.metrics.itemFeedbackPct, f.metrics.hintEqualsSupportPct, f.metrics.widaTagPct, f.metrics.esDirectionsPct, f.metrics.esFeedbackPct ?? "n/a"])));
if (fragInv.length) {
  md.push("\nArea findings (from fragments), by area:\n");
  for (const fr of fragments) {
    const recs = arr(fr.inventory);
    md.push(`**${fr.area}**: ${recs.length} record(s)${recs.length ? ` (${Object.entries(recs.reduce((m, r) => ((m[r.status || "unspecified"] = (m[r.status || "unspecified"] || 0) + 1), m), {})).map(([k, n]) => `${k} ${n}`).join(", ")})` : ""}.\n`);
    md.push(table(["id", "url", "priority", "status", "design issues", "content issues", "action", "verification"], recs.map((r) => [r.id, r.url, r.priority, r.status, arr(r.designIssues).join("; "), arr(r.contentIssues).join("; "), r.action, r.verification])));
    md.push("");
  }
} else md.push("\nNo area fragments have been merged yet; activity-level findings for the baseline are in `inventory.json` (`activities[].issues`).");

// D
H("D. Original scores (baseline)");
if (Object.keys(baseScores).length) {
  md.push(`Rubric: \`RUBRIC.md\` (A-K, weights in \`rubric.json\`). Columns A-K are the 1-5 scores; overall is weighted. Basis and evidence per score are in \`baseline-scores.json\`.\n`);
  md.push(table(["family", ...KEYS, "overall"], Object.entries(baseScores).map(([id, v]) => [id, ...KEYS.map((k) => v.scores[k] ?? "-"), overall(v.scores) ?? "partial"])));
  const dimMeans = KEYS.map((k) => [k, mean(Object.values(baseScores).map((v) => num(v.scores[k])).filter((x) => x !== null))]);
  md.push(`\nMean by dimension: ${dimMeans.map(([k, m]) => `${k} ${NAME[k] || ""} ${m ?? "n/a"}`).join("; ")}.`);
} else md.push("baseline-scores.json not available.");
if (Object.keys(fragBefore).length) {
  md.push("\nArea-reported before scores:\n");
  md.push(table(["area", "entry", ...KEYS, "overall"], Object.values(fragBefore).map((v) => [v.area, v.key, ...KEYS.map((k) => v.scores?.[k] ?? "-"), overall(v.scores) ?? "partial"])));
}

// E
H("E. Problems found");
const problems = fragments.flatMap((f) => arr(f.problemsFound).map((p) => `${f.area}: ${asText(p)}`));
if (problems.length) problems.forEach((p) => md.push(`- ${p}`)); else md.push("_No fragments reported problems yet._");
md.push("\nBaseline measured by the crawler (no interpretation):\n");
if (cr(crawlBefore)) {
  const s = cr(crawlBefore);
  md.push(`- Pages with horizontal overflow: ${Object.entries(s.overflowByWidth).map(([w, v]) => `${w}px ${v.length}${v.length ? ` (${v.slice(0, 6).join(", ")}${v.length > 6 ? ", ..." : ""})` : ""}`).join("; ")}.`);
  for (const [w, v] of Object.entries(s.axe)) md.push(`- Axe at ${w}px: ${v.pagesWithViolations} page(s) with violations; rules: ${v.ruleCounts.map(([r, n]) => `${r} x${n}`).join(", ") || "none"}.`);
  md.push(`- Pages whose Tab focus indicator was not visible: ${s.focusNotVisible.length}${s.focusNotVisible.length ? ` (${s.focusNotVisible.slice(0, 8).join(", ")})` : ""}.`);
  const errs = (crawlBefore.results || []).filter((r) => arr(r.consoleErrors).length || arr(r.pageErrors).length || arr(r.failedRequests).length);
  md.push(`- Pages with console errors, page errors or failed requests: ${errs.length}.`);
} else md.push("- crawl-baseline.json not available.");

// F
H("F. Improvements made");
const improvements = fragments.flatMap((f) => arr(f.improvements).map((p) => `${f.area}: ${asText(p)}`));
if (improvements.length) improvements.forEach((p) => md.push(`- ${p}`)); else md.push("_No fragments reported improvements yet._");

// G
H("G. New scores (after)");
if (Object.keys(fragAfter).length) {
  const rows = Object.values(fragAfter).map((v) => {
    const alias = baseByAlias[String(v.key).toLowerCase()];
    const b = fragBefore[`${v.area}::${v.key}`]?.scores || (alias ? baseScores[alias].scores : null);
    const ob = overall(b), oa = overall(v.scores);
    return [v.area, v.key, ...KEYS.map((k) => v.scores?.[k] ?? "-"), oa ?? "partial", ob ?? "n/a", ob !== null && oa !== null ? delta(ob, oa) : "n/a"];
  });
  md.push(table(["area", "entry", ...KEYS, "overall after", "overall before", "delta"], rows));
  md.push("\nPer-dimension delta (entries with a before and after score for that dimension):\n");
  const dd = KEYS.map((k) => {
    const pairs = Object.values(fragAfter).map((v) => { const alias = baseByAlias[String(v.key).toLowerCase()]; const b = fragBefore[`${v.area}::${v.key}`]?.scores || (alias ? baseScores[alias].scores : null); return [num(b?.[k]), num(v.scores?.[k])]; }).filter(([b, a]) => b !== null && a !== null);
    return [k, NAME[k] || "", pairs.length, pairs.length ? mean(pairs.map(([b, a]) => a - b)) : "n/a"];
  });
  md.push(table(["dim", "name", "n pairs", "mean delta"], dd));
} else md.push("No after scores reported yet.");

// H
H("H. Shared components and templates redesigned");
const tpl = fragments.flatMap((f) => arr(f.templatesRedesigned).map((t) => `${f.area}: ${asText(t)}`));
if (tpl.length) tpl.forEach((t) => md.push(`- ${t}`)); else md.push("_None reported yet._");
const shared = fragments.flatMap((f) => arr(f.sharedEdits).map((t) => [f.area, asText(t)]));
md.push("\nShared-hotspot edits declared (home-registry, sitemap, sw/precache, package.json, shared CSS):\n");
md.push(table(["area", "edit"], shared));

// I
H("I. Content rewritten");
md.push(table(["area", "content records rewritten", "files changed"], fragments.map((f) => [f.area, num(f.contentRecordsRewritten) ?? "not reported", arr(f.filesChanged).length])));
md.push(`\nTotal reported: ${fragments.length ? rewritten : "n/a"}.`);

// J
H("J. WIDA alignment and accessibility");
md.push("WIDA: the platform keeps its grade-band and language-function structures; A/B/C are local support choices, not WIDA levels, and all practice is described as modeled on the framework, never official. Baseline measured WIDA and Spanish coverage for the core bank:\n");
md.push(table(["family", "WIDA tag %", "vocab >=2 %", "ES directions %", "ES feedback %", "avg frames"], coreFams.map((f) => [f.id, f.metrics.widaTagPct, f.metrics.vocabGE2Pct, f.metrics.esDirectionsPct, f.metrics.esFeedbackPct ?? "n/a", f.metrics.avgFrames])));
md.push("\nAccessibility crawl (axe WCAG 2.0/2.1/2.2 A+AA, touch targets, focus, labels):\n");
md.push(crawlLine(crawlBefore, "Baseline"));
md.push(crawlLine(crawlAfter, "After"));
if (cr(crawlBefore) && cr(crawlAfter)) {
  const b = cr(crawlBefore), a = cr(crawlAfter);
  md.push("\nBefore/after (same tool, same targets where ids match):\n");
  md.push(table(["metric", "before", "after", "delta"], [
    ["pages with console/page errors", b.withConsoleOrPageErrors, a.withConsoleOrPageErrors, delta(b.withConsoleOrPageErrors, a.withConsoleOrPageErrors)],
    ...Object.keys(b.axe || {}).map((w) => [`axe serious/critical pages @${w}px`, b.axe[w].pagesWithSeriousOrCritical, a.axe?.[w]?.pagesWithSeriousOrCritical ?? "n/a", delta(b.axe[w].pagesWithSeriousOrCritical, a.axe?.[w]?.pagesWithSeriousOrCritical)]),
    ...Object.keys(b.overflowByWidth || {}).map((w) => [`pages with horizontal overflow @${w}px`, b.overflowByWidth[w].length, a.overflowByWidth?.[w]?.length ?? "n/a", delta(b.overflowByWidth[w].length, a.overflowByWidth?.[w]?.length)]),
    ["pages with targets < 44px @390", b.pagesWithTargetsUnder44at390, a.pagesWithTargetsUnder44at390, delta(b.pagesWithTargetsUnder44at390, a.pagesWithTargetsUnder44at390)],
  ]));
}

// K
H("K. Before/after screenshots");
const shotRoot = path.join(DIR, "screenshots");
const listImgs = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort() : []);
const beforeImgs = listImgs(path.join(shotRoot, "before"));
if (beforeImgs.length) {
  md.push("Baseline screenshots (`screenshots/before/`, from `tools/crawl.mjs`; file name = target id and viewport width):\n");
  md.push(table(["target", "390px", "1280px"], [...new Set(beforeImgs.map((f) => f.replace(/-(390|1280)\.\w+$/, "")))].map((id) => [id, beforeImgs.includes(`${id}-390.jpg`) ? `![${id} 390](screenshots/before/${id}-390.jpg)` : "-", beforeImgs.includes(`${id}-1280.jpg`) ? `![${id} 1280](screenshots/before/${id}-1280.jpg)` : "-"])));
} else md.push("No baseline screenshots found.");
const areaDirs = fs.existsSync(shotRoot) ? fs.readdirSync(shotRoot).filter((d) => d !== "before" && fs.statSync(path.join(shotRoot, d)).isDirectory()).sort() : [];
for (const d of areaDirs) {
  const imgs = listImgs(path.join(shotRoot, d));
  if (!imgs.length) continue;
  md.push(`\n**${d}** (${imgs.length} image(s)):\n`);
  md.push(imgs.map((f) => `![${d}/${f}](screenshots/${d}/${f})`).join("\n"));
}
const referenced = fragments.flatMap((f) => arr(f.screenshots).map((s) => [f.area, s]));
const missingShots = referenced.filter(([, s]) => !fs.existsSync(path.join(DIR, s)) && !fs.existsSync(path.join(DIR, "..", "..", s)));
if (referenced.length) md.push(`\nFragments reference ${referenced.length} screenshot path(s); ${missingShots.length} not found on disk${missingShots.length ? ` (${missingShots.slice(0, 5).map(([a, s]) => `${a}:${s}`).join(", ")}${missingShots.length > 5 ? ", ..." : ""})` : ""}.`);

// L
H("L. Test results");
if (testRows.length) {
  const cls = testRows.map((t) => classify(String(t.result)));
  md.push(`${testRows.length} test command(s) reported by ${new Set(testRows.map((t) => t.area)).size} area(s): ${cls.filter((c) => c === "pass").length} classified pass, ${cls.filter((c) => c === "fail").length} fail, ${cls.filter((c) => c === "unclassified").length} unclassified (result text shown verbatim).\n`);
  md.push(table(["area", "command", "result"], testRows.map((t) => [t.area, "`" + String(t.cmd).replace(/`/g, "'") + "`", t.result])));
} else md.push("No test results reported yet.");
if (crawlAfter) md.push("\nCrawler re-run: see section J.");

// M
H("M. Preserved contracts");
md.push("The master brief fixes these contracts. Each is listed with any evidence the fragments supply; a contract with no evidence is not claimed as verified.\n");
const CONTRACTS = [
  ["Public URLs, routes and deep links unchanged", /route|sitemap|url|redirect|part2-regression|deep.?link/i],
  ["Activity and book ids unchanged", /id|bank|validate-access|alignment/i],
  ["Teacher-authored content and publish/share workflows", /publish|share|teacher|studio|book-studio/i],
  ["Saved student work and `accessPracticeLab:v1:*` localStorage keys, IndexedDB", /storage|localstorage|indexeddb|attempts|passport|state/i],
  ["Offline / service worker precache lists match files a page loads", /sw|precache|offline|service.?worker|sync-access-shell/i],
  ["Grade and WIDA preferences; EN/ES chrome", /grade|wida|es-|spanish|i18n|bilingual|leak/i],
  ["No new dependencies; `_headers`, `_redirects`, `wrangler.toml`, vite output config untouched", /package|dependenc|_headers|_redirects|wrangler|vite/i],
];
const evid = (re) => testRows.filter((t) => re.test(`${t.cmd}`)).map((t) => `${t.area}: ${t.cmd} -> ${t.result}`);
md.push(table(["contract", "evidence reported"], CONTRACTS.map(([c, re]) => [c, evid(re).slice(0, 4).join(" || ") || "none reported"])));
const touchedGuarded = fragments.flatMap((f) => arr(f.filesChanged).filter((p) => /(^|\/)(_headers|_redirects|wrangler\.toml|vite\.config\.[jt]s|package(-lock)?\.json)$/.test(p)).map((p) => `${f.area}: ${p}`));
md.push(`\nGuarded files appearing in any fragment's filesChanged: ${touchedGuarded.length ? touchedGuarded.join("; ") : fragments.length ? "none" : "n/a (no fragments)"}.`);

// N
H("N. Remaining limitations");
const unresolved = fragments.flatMap((f) => arr(f.unresolved).map((u) => `${f.area}: ${asText(u)}`));
if (unresolved.length) unresolved.forEach((u) => md.push(`- ${u}`)); else md.push("_No unresolved items reported by fragments._");
md.push(`\nPlatform-level limits of this audit:\n`);
md.push(`- Untestable surfaces: ${inv.untestable.length} listed in section B (Learning Studios Worker pages, user-authored books, count-only banks).`);
md.push("- The crawler runs against a no-build static server; `assets/nt-web-vitals.js` needs a bundler and is excluded as a harness artifact.");
md.push("- Speech recognition, text-to-speech voices and microphone paths cannot be exercised headlessly; they are checked for presence and error-free load only.");
md.push("- Baseline scores marked `judged` rest on sampled content and screenshots, not on every record. Measured scores are exhaustive over the files named in their evidence.");
if (fragments.length && coveredFams.length < testableFams.length) {
  const gaps = testableFams.filter((f) => !covers(f));
  md.push(`- Baseline families with no fragment record (${gaps.length}): ${gaps.slice(0, 40).map((f) => f.id).join(", ")}${gaps.length > 40 ? ", ..." : ""}.`);
}

// O
H("O. Commit and worktree information");
md.push(table(["area", "branch", "head commit", "files changed", "screenshots"], fragments.map((f) => [f.area, f.branch || "not reported", f.headCommit || "not reported", arr(f.filesChanged).length, arr(f.screenshots).length])));
md.push(`\nBaseline: branch \`${inv.baseline?.branch}\`, commit \`${inv.baseline?.commit}\`, origin/main \`${inv.baseline?.originMain}\`.`);

fs.writeFileSync(OUT, md.join("\n").replace(/\n{3,}/g, "\n\n") + "\n");

// ---------------------------------------------------------------- terminal summary
const line = (k, v) => console.log(`  ${k.padEnd(44)} ${v}`);
console.log(`\nLanguage Page quality report -> ${path.relative(process.cwd(), OUT) || OUT}`);
line("families (testable / untestable)", `${inv.counts.families} (${testableFams.length} / ${inv.families.length - testableFams.length})`);
line("activity / route records", inv.counts.activityRecords);
line("core bank activities", inv.counts.coreBankActivities);
line("baseline scored families / mean overall", `${beforeOverall.length} / ${mean(beforeOverall) ?? "n/a"}`);
line("fragments received", `${fragments.length}${EXPECT ? ` of ${EXPECT}` : ""}${badFragments.length ? ` (${badFragments.length} unreadable)` : ""}`);
line("fragment inventory records", `${fragInv.length}${fragInv.length ? " " + JSON.stringify(statusCounts) : ""}`);
line("fragment priorities", fragInv.length ? JSON.stringify(prioCounts) : "n/a");
line("after-scored entries / mean overall", `${afterOverall.length} / ${mean(afterOverall) ?? "n/a"}`);
line("content records rewritten", fragments.length ? rewritten : "n/a");
line("critical defects fixed", fragments.length ? critical : "n/a");
line("shared-hotspot edits", fragments.length ? sharedEditCount : "n/a");
line("tests reported (pass / fail / unclassified)", testRows.length ? ["pass", "fail", "unclassified"].map((c) => testRows.filter((t) => classify(String(t.result)) === c).length).join(" / ") : "n/a");
line("baseline families covered by fragments", fragments.length ? `${coveredFams.length} of ${testableFams.length}` : "n/a");
line("crawl before / after", `${cr(crawlBefore) ? cr(crawlBefore).targets + " pages" : "n/a"} / ${cr(crawlAfter) ? cr(crawlAfter).targets + " pages" : "n/a"}`);
console.log("");
