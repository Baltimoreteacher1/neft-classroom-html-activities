// Facts report: a learner downloads which facts are still tricky; a teacher opens several reports at once
// to see the class picture. Reports hold no names and never leave the device unless someone shares the file.
import { loadTrail } from "./fact-trail.js";
import { loadRewards } from "./rewards.js";
import { STRATEGIES } from "./strategies.js";

const APP = "EduWonderLab Fluency Lab facts report";
const MAX_FILES = 60;
const escapeHtml = (value) =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export const factLabel = (key) => {
  const [kind, a, b] = key.split(":");
  return `${a} ${kind === "add" ? "+" : "×"} ${b}`;
};

// A fact is "tricky" when the learner has missed it more often than they got it, or missed it last.
export function factsReport(grade) {
  const trail = loadTrail();
  const tricky = Object.entries(trail.facts)
    .filter(([, entry]) => entry.missed > entry.right || entry.last === false)
    .map(([key, entry]) => ({ key, right: entry.right || 0, missed: entry.missed || 0 }));
  const known = Object.entries(trail.facts).filter(([, entry]) => entry.right >= 2 && entry.last).length;
  return { app: APP, version: 1, grade, tricky, known, strategies: loadRewards().strategies };
}

export function parseFactsReport(value) {
  if (!value || value.app !== APP || value.version !== 1) return null;
  const tricky = (Array.isArray(value.tricky) ? value.tricky : [])
    .filter((entry) => /^(add|mul):\d{1,3}:\d{1,3}$/.test(entry?.key))
    .slice(0, 400)
    .map((entry) => ({ key: entry.key, right: Number(entry.right) || 0, missed: Number(entry.missed) || 0 }));
  const strategies = {};
  for (const id of Object.keys(STRATEGIES)) if (Number(value.strategies?.[id]) > 0) strategies[id] = Math.min(Number(value.strategies[id]), 100000);
  return { grade: Number(value.grade) || 0, tricky, known: Number(value.known) || 0, strategies };
}

export function summarizeReports(reports) {
  const counts = new Map();
  const strategies = {};
  for (const report of reports) {
    for (const { key } of report.tricky) counts.set(key, (counts.get(key) || 0) + 1);
    for (const [id, n] of Object.entries(report.strategies)) strategies[id] = (strategies[id] || 0) + n;
  }
  const facts = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12);
  return { students: reports.length, facts, strategies };
}

export function snapshotHtml(summary) {
  const strategyRows = Object.entries(summary.strategies).sort((a, b) => b[1] - a[1]);
  return `<h3>Class facts snapshot</h3><p>${summary.students} learner report${summary.students === 1 ? "" : "s"} read on this device. Nothing was uploaded.</p>
    ${summary.facts.length ? `<ol class="snap-facts">${summary.facts.map(([key, n]) => `<li><b>${escapeHtml(factLabel(key))}</b> <span>${n} of ${summary.students} learners still finding this tricky</span></li>`).join("")}</ol>` : "<p>No tricky facts showed up in these reports.</p>"}
    ${strategyRows.length ? `<h4>How learners say they think</h4><ul class="snap-strategies">${strategyRows.map(([id, n]) => `<li>${STRATEGIES[id].icon} ${escapeHtml(STRATEGIES[id].label)}: ${n}</li>`).join("")}</ul>` : ""}`;
}

export function mountSnapshot(container) {
  container.innerHTML = `<section class="class-snapshot" aria-labelledby="snap-title"><h3 id="snap-title">Class facts snapshot</h3><p>Ask learners to use “Download my facts report” on the practice page, then open several of their files here. The reports hold no names.</p><label class="outline-action file-button">Open facts reports<input id="snap-files" type="file" multiple accept="application/json,.json"/></label><div id="snap-result" aria-live="polite"></div></section>`;
  container.querySelector("#snap-files").addEventListener("change", async (event) => {
    const files = [...(event.target.files || [])].slice(0, MAX_FILES);
    const reports = [];
    for (const file of files) {
      if (file.size > 200000) continue;
      try {
        const parsed = parseFactsReport(JSON.parse(await file.text()));
        if (parsed) reports.push(parsed);
      } catch {
        /* a file that is not a facts report is skipped */
      }
    }
    container.querySelector("#snap-result").innerHTML = reports.length ? snapshotHtml(summarizeReports(reports)) : "<p>None of those files were Fluency Lab facts reports.</p>";
    event.target.value = "";
  });
}
