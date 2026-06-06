import { PHASE_TIME_ESTIMATES, countPracticeProblems } from "./content-enrichment.js";
import { t, stackHtml, phaseName } from "./i18n.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

export function isTeacherMode() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("teacher") === "1" || params.get("mode") === "teacher";
}

/** Floating teacher panel with answer keys, pacing, listen-fors, differentiation. */
export function mountTeacherPanel(root, config, state) {
  if (!isTeacherMode()) return null;

  document.documentElement.classList.add("teacher-mode");

  const panel = document.createElement("aside");
  panel.className = "teacher-panel";
  panel.setAttribute("aria-label", "Teacher view");
  panel.innerHTML = `
    <button type="button" class="teacher-panel-toggle" aria-expanded="true" aria-controls="teacher-panel-body">
      👩‍🏫 ${stackHtml(t("teacherView", "en"), t("teacherView", "es"))}
    </button>
    <div id="teacher-panel-body" class="teacher-panel-body">
      <div class="teacher-panel-section">
        <h4>${stackHtml(t("pacingGuide", "en"), t("pacingGuide", "es"))}</h4>
        <ul class="teacher-pacing-list">
          ${PHASE_TIME_ESTIMATES.map(
            (p, i) =>
              `<li><span>${p.icon} ${phaseName(i)}</span><span>~${p.minutes} min</span></li>`,
          ).join("")}
        </ul>
        <p class="teacher-meta">Total: ${esc(config.timeEstimate || "~45 min")} · ${countPracticeProblems(config)} ${t("practiceItems")}</p>
      </div>
      <div class="teacher-panel-section">
        <h4>${stackHtml(t("standardsObjectives", "en"), t("standardsObjectives", "es"))}</h4>
        <p><strong>${esc(config.standard)}</strong></p>
        <p class="teacher-obj">${esc(config.contentObjective || config.objective || "")}</p>
        <p class="teacher-obj">${esc(config.languageObjective || "")}</p>
      </div>
      <div class="teacher-panel-section" data-bind="listen-fors"></div>
      <div class="teacher-panel-section" data-bind="answer-key"></div>
      <div class="teacher-panel-section">
        <h4>${stackHtml(t("differentiationTips", "en"), t("differentiationTips", "es"))}</h4>
        <ul class="teacher-tips">
          <li><strong>Level 1:</strong> Scaffold hints + remediation flow on misses</li>
          <li><strong>Adaptive:</strong> Auto-adjusts tier based on accuracy</li>
          <li><strong>Level 2:</strong> Stretch items + extend stems in Turn & Talk</li>
        </ul>
      </div>
      <button type="button" class="btn btn-secondary btn-sm teacher-print-packet">🖨️ ${stackHtml(t("printPacingSheet", "en"), t("printPacingSheet", "es"))}</button>
    </div>`;

  const toggle = panel.querySelector(".teacher-panel-toggle");
  const body = panel.querySelector(".teacher-panel-body");
  toggle.addEventListener("click", () => {
    const open = body.hidden;
    body.hidden = !open;
    toggle.setAttribute("aria-expanded", String(!open));
    panel.classList.toggle("is-collapsed", open);
  });

  // Listen-fors from turnAndTalk
  const listenSlot = panel.querySelector('[data-bind="listen-fors"]');
  const listenFors = (config.turnAndTalk || [])
    .filter((t) => t.listenFor)
    .map(
      (t) =>
        `<li><strong>${esc(t.phase || "Phase")}:</strong> ${esc(t.listenFor)}</li>`,
    );
  if (listenFors.length) {
    listenSlot.innerHTML = `<h4>${stackHtml(t("listenFor", "en"), t("listenFor", "es"))}</h4><ul class="teacher-listen">${listenFors.join("")}</ul>`;
  } else {
    listenSlot.remove();
  }

  // Answer key summary from practice items
  const keySlot = panel.querySelector('[data-bind="answer-key"]');
  const items = collectAnswerKey(config);
  if (items.length) {
    keySlot.innerHTML = `
      <h4>${stackHtml(t("answerKey", "en"), t("answerKey", "es"))}</h4>
      <ol class="teacher-answer-key">${items
        .map((item) => `<li>${esc(item)}</li>`)
        .join("")}</ol>`;
  } else {
    keySlot.remove();
  }

  panel.querySelector(".teacher-print-packet")?.addEventListener("click", () => {
    window.print();
  });

  root.append(panel);
  return panel;
}

function collectAnswerKey(config) {
  const answers = [];
  const buckets = ["approaching", "onLevel", "extending"];
  for (const b of buckets) {
    const items = config.practice?.[b] || [];
    items.forEach((item, i) => {
      if (item.type === "multiple-choice" && item.choices?.[item.correctIndex]) {
        answers.push(
          `${b} #${i + 1}: ${item.choices[item.correctIndex]}${item.explanation ? ` — ${item.explanation}` : ""}`,
        );
      } else if (item.answer) {
        answers.push(`${b} #${i + 1}: ${item.answer}`);
      }
    });
  }
  return answers.slice(0, 12);
}

/** Collapsible teacher notes for welcome/cover (no ?teacher=1 required). */
export function buildWelcomeTeacherNotes(config) {
  const listenFors = (config.turnAndTalk || [])
    .filter((t) => t.listenFor)
    .slice(0, 4)
    .map(
      (t) =>
        `<li><strong>${esc(t.phase || "Phase")}:</strong> ${esc(t.listenFor)}</li>`,
    );

  const pacing = PHASE_TIME_ESTIMATES.map(
    (p, i) =>
      `<li><span>${p.icon} ${phaseName(i)}</span><span>~${p.minutes} min</span></li>`,
  ).join("");

  const wrap = document.createElement("div");
  wrap.className = "welcome-teacher-notes";
  wrap.innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm welcome-teacher-toggle" aria-expanded="false">
      📋 ${stackHtml(t("teacherNotesToggle", "en"), t("teacherNotesToggle", "es"))}
    </button>
    <div class="welcome-teacher-panel" hidden>
      <h4>${stackHtml(t("teacherNotes", "en"), t("teacherNotes", "es"))}</h4>
      <p class="teacher-meta">${esc(config.standard)} · ${esc(config.timeEstimate || "~45 min")} · ${countPracticeProblems(config)} ${t("practiceItems")}</p>
      <div class="teacher-panel-section">
        <h5>${stackHtml(t("pacingGuide", "en"), t("pacingGuide", "es"))}</h5>
        <ul class="teacher-pacing-list">${pacing}</ul>
      </div>
      ${
        listenFors.length
          ? `<div class="teacher-panel-section"><h5>${stackHtml(t("listenFor", "en"), t("listenFor", "es"))}</h5><ul class="teacher-listen">${listenFors.join("")}</ul></div>`
          : ""
      }
      <p style="font-size:0.82rem; color:var(--muted); margin-top:8px;">${stackHtml("Full answer keys:", "Claves completas:")} <code>?teacher=1</code></p>
    </div>`;

  const toggle = wrap.querySelector(".welcome-teacher-toggle");
  const panel = wrap.querySelector(".welcome-teacher-panel");
  toggle.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.innerHTML = open
      ? `📋 ${stackHtml(t("teacherNotesHide", "en"), t("teacherNotesHide", "es"))}`
      : `📋 ${stackHtml(t("teacherNotesToggle", "en"), t("teacherNotesToggle", "es"))}`;
  });

  return wrap;
}
