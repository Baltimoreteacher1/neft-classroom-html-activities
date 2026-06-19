#!/usr/bin/env node
/*
 * brain-action-plan.mjs — turns the content graph + coverage into a prioritized,
 * human-readable action plan: where the 624-activity library has holes, and which
 * auto-assigned CCSS tags are low-confidence and worth a teacher's eyes.
 * Output: reports/math-brain-action-plan.md
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const graph = JSON.parse(readFileSync(join(root, "data/content-graph.json"), "utf8"));
const cov = JSON.parse(readFileSync(join(root, "data/content-coverage.json"), "utf8"));
const tax = JSON.parse(readFileSync(join(root, "data/standards-taxonomy.json"), "utf8"));
const labelOf = Object.fromEntries(tax.standards.map((s) => [s.id, s.label]));

// 1. coverage gaps, worst first (no content > no level-0 > no enrichment)
const rank = (f) => (f.includes("NO_CONTENT") ? 0 : f.includes("no-level-0") ? 1 : 2);
const gaps = cov.gaps.slice().sort((a, b) => rank(a.flags) - rank(b.flags) || a.standard.localeCompare(b.standard));

// 2. low-confidence tags (auto-assigned, worth review)
const lowConf = graph.entries
  .filter((e) => e.confidence != null && e.confidence < 0.7 && !["NON_MATH"].includes(e.standard))
  .sort((a, b) => a.confidence - b.confidence);

// 3. standards with the richest content (where the Brain can route well today)
const strong = cov.rows
  .filter((r) => r.total >= 8 && r.l0 > 0 && r.l2 > 0)
  .sort((a, b) => b.total - a.total);

let md = `# Math Brain — Action Plan\n\n`;
md += `_Generated ${new Date().toISOString().slice(0, 10)} from ${graph.total} tagged activities across ${Object.keys(graph.byStandard).length} standards._\n\n`;

md += `## 1. Content gaps to fill (priority order)\n\n`;
md += `These standards can't be fully personalized yet — the Brain has nothing to route struggling or advanced students to.\n\n`;
md += `| Standard | Skill | Gap |\n|---|---|---|\n`;
gaps.forEach((g) => {
  md += `| \`${g.standard}\` | ${labelOf[g.standard] || ""} | ${g.flags.join(", ")} |\n`;
});

md += `\n## 2. Auto-tags to spot-check (${lowConf.length})\n\n`;
md += `Activities the tagging workflow was least sure about — confirm the standard is right.\n\n`;
md += `| Conf | Standard | Activity |\n|---|---|---|\n`;
lowConf.slice(0, 40).forEach((e) => {
  md += `| ${e.confidence.toFixed(2)} | \`${e.standard}\` | [${e.title.replace(/\|/g, "/")}](${e.url}) |\n`;
});
if (lowConf.length > 40) md += `\n_…and ${lowConf.length - 40} more in data/content-graph.json (confidence < 0.7)._\n`;

md += `\n## 3. Strongest standards (Brain routes well here today)\n\n`;
md += `Full coverage across support (L0), on-level (L1), and enrichment (L2).\n\n`;
md += `| Standard | Total | L0 | L1 | L2 |\n|---|---|---|---|---|\n`;
strong.forEach((r) => {
  md += `| \`${r.standard}\` | ${r.total} | ${r.l0} | ${r.l1} | ${r.l2} |\n`;
});

mkdirSync(join(root, "reports"), { recursive: true });
writeFileSync(join(root, "reports/math-brain-action-plan.md"), md);
console.log(`reports/math-brain-action-plan.md — ${gaps.length} gaps, ${lowConf.length} low-confidence tags, ${strong.length} strong standards`);
