import { PHASE_TIME_ESTIMATES, countPracticeProblems } from "./content-enrichment.js";

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
      👩‍🏫 Teacher View
    </button>
    <div id="teacher-panel-body" class="teacher-panel-body">
      <div class="teacher-panel-section">
        <h4>Pacing Guide</h4>
        <ul class="teacher-pacing-list">
          ${PHASE_TIME_ESTIMATES.map(
            (p) =>
              `<li><span>${p.icon} ${p.name}</span><span>~${p.minutes} min</span></li>`,
          ).join("")}
        </ul>
        <p class="teacher-meta">Total: ${esc(config.timeEstimate || "~45 min")} · ${countPracticeProblems(config)} practice items</p>
      </div>
      <div class="teacher-panel-section">
        <h4>Standards & Objectives</h4>
        <p><strong>${esc(config.standard)}</strong></p>
        <p class="teacher-obj">${esc(config.contentObjective || config.objective || "")}</p>
        <p class="teacher-obj">${esc(config.languageObjective || "")}</p>
      </div>
      <div class="teacher-panel-section" data-bind="listen-fors"></div>
      <div class="teacher-panel-section" data-bind="answer-key"></div>
      <div class="teacher-panel-section">
        <h4>Differentiation Tips</h4>
        <ul class="teacher-tips">
          <li><strong>Level 1:</strong> Scaffold hints + remediation flow on misses</li>
          <li><strong>Adaptive:</strong> Auto-adjusts tier based on accuracy</li>
          <li><strong>Level 2:</strong> Stretch items + extend stems in Turn & Talk</li>
        </ul>
      </div>
      <button type="button" class="btn btn-secondary btn-sm teacher-print-packet">🖨️ Print pacing sheet</button>
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
    listenSlot.innerHTML = `<h4>Listen For</h4><ul class="teacher-listen">${listenFors.join("")}</ul>`;
  } else {
    listenSlot.remove();
  }

  // Answer key summary from practice items
  const keySlot = panel.querySelector('[data-bind="answer-key"]');
  const items = collectAnswerKey(config);
  if (items.length) {
    keySlot.innerHTML = `
      <h4>Answer Key (Practice)</h4>
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
