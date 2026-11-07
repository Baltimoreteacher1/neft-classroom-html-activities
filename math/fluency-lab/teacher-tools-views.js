// fl-teacher: Class insights sections for fact automaticity (no clock) and Daily Green Light days, built from the
// per-fact records and green days in the learner files the teacher opened. Pure string builders.
import { greenDaysPerWeek } from "./green-light.js";
import { t } from "./i18n.js";
import { AUTO_STATUSES, AUTO_LABELS, autoRules, automaticity } from "./moby/fact-automaticity.js";
import { esc } from "./reports-export.js";

// Facts a learner has answered at least once, labelled by automaticity status.
export function factRows(learners, now = Date.now()) {
  return learners.map((learner) => {
    const counts = { automatic: 0, strategy: 0, counting: 0, "not-yet": 0 };
    const counted = [];
    for (const [key, record] of Object.entries(learner.facts?.facts || {})) {
      if (!record?.attempts) continue;
      const status = automaticity(record, now);
      counts[status] += 1;
      if (status === "counting") counted.push(key);
    }
    return { label: learner.label, counts, counted, weeks: greenDaysPerWeek(learner.greenDays || [], now, 4) };
  });
}

// The facts the most learners still count on, for a whole-class strategy lesson.
export function classCounting(rows) {
  const tally = new Map();
  for (const row of rows) for (const key of row.counted) tally.set(key, (tally.get(key) || 0) + 1);
  return [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
}

export function factsClassHtml(learners, now = Date.now()) {
  const rows = factRows(learners, now).filter((row) => Object.values(row.counts).some(Boolean) || row.weeks.some((w) => w.days));
  if (!rows.length)
    return `<p class="t4-empty">${esc(t("These files hold no fact practice or Green Light days yet."))}</p>`;
  const head = AUTO_STATUSES.map((id) => `<th scope="col">${esc(t(AUTO_LABELS[id]))}</th>`).join("");
  const counting = classCounting(rows);
  return `<div class="t4-scroll"><table class="t4-table"><caption class="t4-sr">${esc(t("Fact automaticity and Green Light days"))}</caption>
    <thead><tr><th scope="col">${esc(t("Learner"))}</th>${head}<th scope="col">${esc(t("Green Light days this week"))}</th><th scope="col">${esc(t("Last 4 weeks"))}</th></tr></thead>
    <tbody>${rows.map((row) => `<tr><th scope="row">${esc(row.label)}</th>${AUTO_STATUSES.map((id) => `<td>${row.counts[id]}</td>`).join("")}<td>${row.weeks[0].days}</td><td>${esc(row.weeks.map((w) => w.days).reverse().join(" · "))}</td></tr>`).join("")}</tbody></table></div>
    ${counting.length ? `<p><b>${esc(t("Facts learners still count on:"))}</b> ${counting.map(([key, n]) => `<span class="t4-chip">${esc(key)} (${n})</span>`).join(" ")}</p>` : ""}
    <details class="t4-more"><summary>${esc(t("How each status is decided"))}</summary><ul class="t4-plain">${autoRules().map((rule) => `<li><b>${esc(t(rule.label))}:</b> ${esc(t(rule.template, rule.vars))}</li>`).join("")}<li>${esc(t("A Green Light day is a day with 10 or more answers right on the first try, on the learner's own. Time is never read."))}</li></ul></details>`;
}
