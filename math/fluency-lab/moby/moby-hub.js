// EduWonderLab Math Fluency Lab — MobyMax Publisher-Grade Integration 5.0 Hub
// Seamlessly coordinates Quests, Fact Fluency, Intervention, Strategy Theater, and Teacher Diagnostics.
import { t } from "../i18n.js";
import { findSkill, skillKey, localDay } from "../tutor-engine.js";
import { loadQuests, saveQuests, emptyQuests, dayQuests, progressQuest, supportiveRetry } from "./quests.js";
import { loadFacts, saveFacts, emptyFacts, factStatus, gradeFactDomain, progressMap, isDifficult } from "./fact-model.js";
import { buildFactSession } from "./fact-session.js";
import { loadFactPlan } from "./fact-plan.js";
import { applyFactPlan, mountFactPractice } from "./fact-practice.js";
import { SYMBOL } from "./fact-keys.js";
import { loadInterventions, saveInterventions, emptyInterventions, startIntervention, nextItems, recordResult, summarizeForTeacher, describeStage, retentionDue } from "./intervention-engine.js";
import { mountStrategyTheater } from "./strategy-theater.js";
import { STRATEGY_IDS, strategyFor } from "./fact-strategies.js";
import { STRATEGIES_DATA } from "./strategies-data.js";
import { cleanAvatar, avatarSVG, UNLOCKABLES } from "./avatar.js";
import { journeyMap, milestones } from "./journey.js";

const escapeHtml = (text) =>
  String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

// 1. Quests Widget (Learner Dashboard Integration)
export function mountMobyQuests(host, { tutor, grade, now = Date.now(), onOpenSkill }) {
  if (!host) return;
  const store = loadQuests();
  const { state, quests, goals } = dayQuests(store, tutor, grade, now);
  saveQuests(state);

  const questCards = quests.map((q) => {
    const isDone = q.status === "done";
    return `
      <div class="mby-quest-card" data-quest-id="${escapeHtml(q.id)}" style="background:#ffffff;border:1px solid ${isDone ? "#10b981" : "#e2e8f0"};border-radius:8px;padding:0.875rem;margin-bottom:0.75rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-size:1rem;color:#0f172a;">${escapeHtml(q.title)}</strong>
          <span style="font-size:0.8125rem;font-weight:600;padding:0.25rem 0.5rem;border-radius:9999px;background:${isDone ? "#ecfdf5" : "#f1f5f9"};color:${isDone ? "#047857" : "#475569"};">
            ${isDone ? "✓ " + escapeHtml(t("Complete")) : escapeHtml(t("In progress"))}
          </span>
        </div>
        <p style="margin:0.375rem 0 0.5rem;font-size:0.875rem;color:#475569;">${escapeHtml(q.objective)}</p>
        <p style="margin:0;font-size:0.75rem;color:#64748b;font-style:italic;">${escapeHtml(q.why)}</p>
      </div>`;
  }).join("");

  host.innerHTML = `
    <section class="mby-quests-section" aria-label="${escapeHtml(t("Today's Learning Quests"))}" style="margin:1.5rem 0;padding:1.25rem;background:#f8fafc;border-radius:12px;border:1px solid #cbd5e1;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <div>
          <h3 style="margin:0;font-size:1.1875rem;font-weight:700;color:#0f172a;">🎯 ${escapeHtml(t("Today's Learning Quests"))}</h3>
          <p style="margin:0.25rem 0 0;font-size:0.8125rem;color:#64748b;">${escapeHtml(t("Honest practice that rewards learning, revision, and understanding."))}</p>
        </div>
        <span style="font-weight:600;font-size:0.875rem;color:#0369a1;">${goals.daily.filter((goal) => goal.done).length} / ${goals.daily.length} ${escapeHtml(t("goals met"))}</span>
      </div>
      <div class="mby-quest-list">${questCards}</div>
    </section>`;
}

// 2. Fact Fluency Practice & Strategy Theater Widget
export function mountMobyFluency(host, { grade, now = Date.now(), onDoneSession, onAnswer }) {
  if (!host) return;

  host.innerHTML = `
    <section class="mby-fluency-section" aria-label="${escapeHtml(t("Adaptive Fact Fluency"))}" style="margin:1.5rem 0;padding:1.25rem;background:#ffffff;border-radius:12px;border:1px solid #cbd5e1;">
      <div style="margin-bottom:1rem;">
        <h3 style="margin:0;font-size:1.25rem;font-weight:700;color:#0f172a;">⚡ ${escapeHtml(t("Adaptive Fact Fluency"))}</h3>
        <p style="margin:0.25rem 0 0;font-size:0.875rem;color:#475569;">
          ${escapeHtml(t("Strategy-based mastery across addition, subtraction, multiplication, and division fact families."))}
        </p>
      </div>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1.25rem;">
        <button type="button" class="mby-btn mby-btn-primary" data-moby-start="5" style="min-height:44px;padding:0.5rem 1rem;font-weight:600;border-radius:6px;cursor:pointer;">
          ⏱️ ${escapeHtml(t("5-Minute Daily Routine"))}
        </button>
        <button type="button" class="mby-btn" data-moby-start="10" style="min-height:44px;padding:0.5rem 1rem;font-weight:600;border-radius:6px;background:#f1f5f9;border:1px solid #cbd5e1;cursor:pointer;">
          ⏱️ ${escapeHtml(t("10-Minute Focus"))}
        </button>
        <button type="button" class="mby-btn" data-moby-start="15" style="min-height:44px;padding:0.5rem 1rem;font-weight:600;border-radius:6px;background:#f1f5f9;border:1px solid #cbd5e1;cursor:pointer;">
          ⏱️ ${escapeHtml(t("15-Minute Deep Practice"))}
        </button>
      </div>
      <div id="mby-fluency-host"></div>
    </section>`;

  const subHost = host.querySelector("#mby-fluency-host");
  // fl-teacher: a teacher's fact plan (fact-plan.js) narrows the operations and sets the number of problems.
  const plan = loadFactPlan();
  if (plan)
    subHost.insertAdjacentHTML(
      "beforebegin",
      `<p class="fl-fact-plan-note" role="note">${escapeHtml(t("Your teacher's fact plan: {n} problems a session.", { n: plan.count || "—" }))}${plan.ops.length ? ` ${escapeHtml(t("Facts:"))} ${plan.ops.map((op) => SYMBOL[op]).join(" ")}` : ""}</p>`,
    );

  host.querySelectorAll("[data-moby-start]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const minutes = plan ? 15 : Number(btn.dataset.mobyStart) || 5;
      const startedAt = Date.now();
      const session = buildFactSession({ store: loadFacts(), grade, minutes, mode: "untimed", now: startedAt });
      session.items = applyFactPlan(session.items, plan);
      // fl-teacher: introduce-then-practice and the one-tap "how did you get it" note (fact-practice.js).
      mountFactPractice(subHost, session, {
        store: loadFacts(),
        save: saveFacts,
        now: () => Date.now(),
        onAnswer,
        onDone: (receipt) => onDoneSession?.(receipt),
      });
    });
  });
}

// 3. Teacher Diagnostic & Intervention Grouping Widget
export function mountMobyTeacherPanel(host, { tutor, now = Date.now() }) {
  if (!host) return;
  const interventions = loadInterventions();
  const summary = summarizeForTeacher(interventions, tutor, now);

  const missionRows = summary.items.map((it) => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:0.75rem;font-weight:600;color:#0f172a;">${escapeHtml(it.title)} (Grade ${it.grade})</td>
      <td style="padding:0.75rem;"><span style="display:inline-block;padding:0.25rem 0.5rem;border-radius:9999px;font-size:0.75rem;font-weight:600;background:#f1f5f9;color:#334155;">${escapeHtml(it.stageLabel)}</span></td>
      <td style="padding:0.75rem;font-size:0.875rem;color:#475569;">${escapeHtml(it.route.label)} (${escapeHtml(it.route.mode)})</td>
      <td style="padding:0.75rem;font-size:0.8125rem;color:#334155;">
        ${it.observed.independentCorrect} / ${it.observed.independentAnswers} right • ${it.observed.wrongAnswersRead} slips read
      </td>
      <td style="padding:0.75rem;font-size:0.8125rem;color:#0369a1;font-weight:500;">${escapeHtml(it.inferred.action)}</td>
    </tr>`).join("");

  host.innerHTML = `
    <section class="mby-teacher-section" aria-label="${escapeHtml(t("Diagnostic & Intervention Toolkit"))}" style="margin:2rem 0;padding:1.5rem;background:#ffffff;border-radius:12px;border:1px solid #cbd5e1;">
      <div style="margin-bottom:1rem;">
        <h3 style="margin:0;font-size:1.375rem;font-weight:700;color:#0f172a;">📊 ${escapeHtml(t("MobyMax Publisher-Grade Diagnostic & Intervention"))}</h3>
        <p style="margin:0.25rem 0 0;font-size:0.875rem;color:#64748b;font-style:italic;">${escapeHtml(summary.disclosure)}</p>
      </div>
      <div style="display:flex;gap:1.5rem;margin-bottom:1.25rem;padding:0.75rem 1rem;background:#f8fafc;border-radius:8px;">
        <span><strong>${summary.totals.active}</strong> ${escapeHtml(t("active missions"))}</span>
        <span><strong>${summary.totals.mastered}</strong> ${escapeHtml(t("mastered"))}</span>
        <span><strong>${summary.totals.retentionDue}</strong> ${escapeHtml(t("retention checks due"))}</span>
        <span><strong>${summary.totals.needsTeacher}</strong> ${escapeHtml(t("need teacher"))}</span>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;text-align:left;font-size:0.875rem;">
          <thead>
            <tr style="border-bottom:2px solid #cbd5e1;background:#f8fafc;">
              <th style="padding:0.75rem;">Skill</th>
              <th style="padding:0.75rem;">Stage</th>
              <th style="padding:0.75rem;">Diagnosis & Route</th>
              <th style="padding:0.75rem;">Observed Evidence</th>
              <th style="padding:0.75rem;">Next Instructional Action</th>
            </tr>
          </thead>
          <tbody>
            ${missionRows || `<tr><td colspan="5" style="padding:1.5rem;text-align:center;color:#64748b;">${escapeHtml(t("No active missions. Diagnostic checks run continuously during practice."))}</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>`;
}
