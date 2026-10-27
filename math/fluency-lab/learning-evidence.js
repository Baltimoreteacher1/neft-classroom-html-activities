import { ALL_SKILLS } from "./problem-bank.js";
import { evidence, localDay, prerequisites, skillKey } from "./tutor-engine.js";
import { mistakeCategoryLabel } from "./mistake-notes.js";

const esc = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export function masteryStage(status) {
  if (!status.recent.length) return status.lessonCompleted ? "Exploring" : "Not checked";
  const lastThreeIndependent = status.recent.slice(-3).every((entry) => entry.independent && entry.correct);
  if (status.secure) return "Retained";
  if (status.independent >= 8 && status.ratio >= 0.85 && lastThreeIndependent) return "Proficient";
  if (status.independent >= 4 && status.ratio >= 0.75) return "Practicing";
  return "Developing";
}

function profileRows(learners, grade, now) {
  const skills = ALL_SKILLS.filter((skill) => skill.grade === grade);
  const rows = [];
  for (const learner of learners || []) {
    const tutor = learner.tutor || { records: {}, mistakes: [], diagnostics: {}, sessions: [] };
    const diagnosis = tutor.diagnostics?.[grade]?.results || {};
    for (const skill of skills) {
      const status = evidence(tutor, skill, now);
      const diagnostic = typeof diagnosis[skillKey(skill)] === "boolean" ? diagnosis[skillKey(skill)] : null;
      const mistakes = (tutor.mistakes || []).filter((item) => item.key === skillKey(skill) && !item.resolvedAt);
      if (!status.recent.length && diagnostic === null && !status.lessonCompleted) continue;
      const categoryCounts = new Map();
      for (const mistake of mistakes) {
        if (!mistake.category) continue;
        categoryCounts.set(mistake.category, (categoryCounts.get(mistake.category) || 0) + 1);
      }
      const likelyPattern = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0] || null;
      const prerequisiteGap = prerequisites(skill)
        .map((foundation) => ({ skill: foundation, status: evidence(tutor, foundation, now) }))
        .find(({ status: foundation }) => foundation.independent >= 2 && foundation.ratio < 0.75);
      rows.push({
        learner: learner.label,
        skill,
        status,
        diagnostic,
        mistakes,
        likelyPattern,
        prerequisiteGap,
        stage: masteryStage(status),
        sessionCount: (tutor.sessions || []).filter((session) => session.grade === grade).length,
        lastPracticed: status.lastAt ? localDay(status.lastAt) : "",
      });
    }
  }
  return rows;
}

export function groupTeacherInterventions(rows) {
  const groups = new Map();
  for (const row of rows) {
    const { status } = row;
    const enoughEvidence = status.independent >= 2 || row.diagnostic !== null;
    if (!enoughEvidence) continue;

    let target = row.skill;
    let need = "independent practice";
    let pattern = null;
    if (row.likelyPattern) {
      [pattern] = row.likelyPattern;
      need = "possible misconception";
    } else if (row.prerequisiteGap && (row.diagnostic === false || status.ratio < 0.75)) {
      target = row.prerequisiteGap.skill;
      need = "prerequisite check";
    } else if (status.due) {
      need = "retention review";
    } else if (row.diagnostic === false || (status.independent >= 2 && status.ratio < 0.75)) {
      need = "guided model and reattempt";
    } else {
      continue;
    }

    const key = [skillKey(target), need, pattern || ""].join("|");
    const group = groups.get(key) || {
      key,
      skill: target,
      need,
      pattern,
      learners: [],
      evidence: [],
    };
    group.learners.push(row.learner);
    const missCount = pattern
      ? row.mistakes.filter((mistake) => mistake.category === pattern).length
      : 0;
    group.evidence.push(
      pattern
        ? `${row.learner}: ${missCount} recorded response${missCount === 1 ? "" : "s"} matched “${mistakeCategoryLabel(pattern)}”.`
        : row.prerequisiteGap && target === row.prerequisiteGap.skill
          ? `${row.learner}: ${row.prerequisiteGap.status.independent} independent prerequisite checks, ${Math.round(row.prerequisiteGap.status.ratio * 100)}% correct.`
          : status.due
            ? `${row.learner}: ${status.independent} recent independent checks; spaced review is due.`
            : `${row.learner}: ${status.independent} recent independent checks, ${Math.round(status.ratio * 100)}% correct.`,
    );
    groups.set(key, group);
  }
  return [...groups.values()].sort(
    (a, b) => b.learners.length - a.learners.length || a.skill.title.localeCompare(b.skill.title),
  );
}

export function buildTeacherReport(learners, grade, now = Date.now()) {
  const rows = profileRows(learners, grade, now);
  const groups = groupTeacherInterventions(rows);
  const sessions = (learners || []).reduce(
    (total, learner) =>
      total + (learner.tutor?.sessions || []).filter((session) => session.grade === grade).length,
    0,
  );
  const responses = rows.reduce(
    (total, row) => total + row.status.recent.length,
    0,
  );
  return {
    grade,
    rows,
    groups,
    sessions,
    responses,
    learnerCount: new Set(rows.map((row) => row.learner)).size,
  };
}

function toCsv(report) {
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const header = ["Learner profile", "Grade", "Skill", "Standard", "Evidence stage", "Recent independent checks", "Recent independent accuracy", "Supported responses", "Possible error pattern", "Retention due", "Last practiced"];
  const lines = report.rows.map((row) => [
    row.learner,
    report.grade,
    row.skill.title,
    row.skill.standard,
    row.stage,
    row.status.independent,
    row.status.independent ? `${Math.round(row.status.ratio * 100)}%` : "",
    row.status.supportedTotal || 0,
    row.likelyPattern ? mistakeCategoryLabel(row.likelyPattern[0]) : "",
    row.status.due ? "Yes" : "No",
    row.lastPracticed,
  ]);
  return [header, ...lines].map((line) => line.map(quote).join(",")).join("\r\n");
}

function toInterventionCsv(report) {
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = report.groups.map((group) => [
    group.skill.grade,
    group.skill.title,
    group.skill.standard,
    group.need,
    group.pattern ? mistakeCategoryLabel(group.pattern) : "",
    group.learners.join("; "),
    group.evidence.join(" "),
    group.skill.learn.rule,
    group.skill.learn.example,
    group.skill.learn.steps.join(" → "),
    "Assign a short set; check the learner's next independent response before moving on.",
  ]);
  return [["Grade", "Skill focus", "Standard", "Instructional need", "Possible response pattern", "Learner profiles", "Evidence", "Model", "Worked example", "Teaching routine", "Follow-up check"], ...rows]
    .map((row) => row.map(quote).join(","))
    .join("\r\n");
}

function groupHtml(group, index) {
  const model = group.skill.learn;
  const titleId = `teacher-group-${index}-title`;
  return `<article class="teacher-intervention" aria-labelledby="${titleId}">
    <div class="teacher-intervention-heading"><div><p class="teacher-evidence-label">${esc(group.need)} · ${group.learners.length} learner${group.learners.length === 1 ? "" : "s"}</p><h4 id="${titleId}">${esc(group.skill.title)}</h4></div>
      <button type="button" class="outline-action" data-teacher-assign="${esc(skillKey(group.skill))}">Add focus to assignment</button></div>
    <p><strong>Supporting evidence:</strong> ${group.evidence.map(esc).join(" ")}</p>
    ${group.pattern ? `<p><strong>Possible pattern:</strong> ${esc(mistakeCategoryLabel(group.pattern))}. This label describes recorded responses; it does not diagnose a student's thinking.</p>` : ""}
    <div class="teacher-routine"><div><h5>Teach</h5><p>${esc(model.rule)}</p><p><strong>Model:</strong> ${esc(model.example)}</p></div>
      <div><h5>Try together</h5><ol>${model.steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol></div>
      <div><h5>Reattempt and reassess</h5><p>Assign a short set on this focus. Ask the learner to solve a new item independently and explain or show one step. Review the next saved evidence before deciding to move on.</p></div></div>
  </article>`;
}

export function mountTeacherEvidenceDashboard(container, { learners = () => [], grade = () => 1, onAssign = () => {} } = {}) {
  const render = () => {
    const report = buildTeacherReport(learners(), Number(grade()));
    container.innerHTML = `<section class="teacher-evidence" aria-labelledby="teacher-evidence-title">
      <div class="teacher-evidence-header"><div><p class="section-label">Saved learner evidence</p><h3 id="teacher-evidence-title">What to teach next</h3>
        <p>Based on this browser's local learner profiles. Results are not sent to a server. Profiles without enough recorded evidence are left out of groups.</p></div>
        <div class="teacher-evidence-actions"><button type="button" class="outline-action" data-teacher-refresh>Refresh evidence</button><button type="button" class="outline-action" data-teacher-export ${report.rows.length ? "" : "disabled"}>Download progress CSV</button><button type="button" class="outline-action" data-teacher-export-groups ${report.groups.length ? "" : "disabled"}>Download intervention plan</button></div></div>
      <div class="teacher-evidence-metrics" aria-label="Evidence summary">
        <div><strong>${report.learnerCount}</strong><span>profiles with evidence</span></div><div><strong>${report.sessions}</strong><span>saved practice sessions</span></div><div><strong>${report.responses}</strong><span>recent skill responses</span></div>
      </div>
      ${report.rows.length ? `<details class="teacher-data-table"><summary>Review ${report.rows.length} skill evidence records</summary><div class="teacher-table-scroll"><table><caption>Grade ${report.grade} evidence in this browser</caption><thead><tr><th scope="col">Learner profile</th><th scope="col">Skill</th><th scope="col">Evidence stage</th><th scope="col">Independent checks</th><th scope="col">Accuracy</th><th scope="col">Supported responses</th><th scope="col">Retention</th></tr></thead><tbody>${report.rows.map((row) => `<tr><th scope="row">${esc(row.learner)}</th><td>${esc(row.skill.title)}<small>${esc(row.skill.standard)}</small></td><td>${esc(row.stage)}</td><td>${row.status.independent}</td><td>${row.status.independent ? `${Math.round(row.status.ratio * 100)}%` : "—"}</td><td>${row.status.supportedTotal || 0}</td><td>${row.status.due ? "Review due" : row.status.secure ? "Retained" : "Not due"}</td></tr>`).join("")}</tbody></table></div></details>` : `<p class="teacher-evidence-empty" role="status">No saved attempts or checkup results for Grade ${report.grade} are available in this browser yet. After practice, return here to review actual evidence.</p>`}
      <div class="teacher-interventions"><div><h4>Suggested small groups</h4><p>Rules use at least two independent checks or a recorded checkup result. Error labels are possible patterns only.</p></div>
        ${report.groups.length ? report.groups.map((group, index) => groupHtml(group, index)).join("") : `<p class="teacher-evidence-empty">No group recommendation meets the evidence rules for Grade ${report.grade} yet.</p>`}
      </div>
      <p class="teacher-evidence-footnote">CSV export contains profile nicknames and measured evidence only. It includes no answer text, private URL, or external tracking.</p>
    </section>`;
    container.querySelector("[data-teacher-export]")?.addEventListener("click", () => {
      downloadCsv(toCsv(report), `fluency-grade-${report.grade}-evidence.csv`);
    });
    container.querySelector("[data-teacher-export-groups]")?.addEventListener("click", () => {
      downloadCsv(toInterventionCsv(report), `fluency-grade-${report.grade}-intervention-plan.csv`);
    });
    container.querySelector("[data-teacher-refresh]")?.addEventListener("click", render);
    container.querySelectorAll("[data-teacher-assign]").forEach((button) =>
      button.addEventListener("click", () => onAssign(button.dataset.teacherAssign)),
    );
  };
  render();
  return { refresh: render };
}

function downloadCsv(content, filename) {
      const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
