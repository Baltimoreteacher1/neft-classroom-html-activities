// Achievements page: illustrated recognition for demonstrated growth, built from this device's saved evidence only.
import { EARNED_KEY, GOALS_KEY, addGoal, earnedAchievements, keepEarned, removeGoal, sanitizeGoals } from "../achievements-4.js";
import { achievementsPage } from "../achievements-4-view.js";
import { achievementCertificateHtml } from "../certificate.js";
import { achievementsChrome } from "../family-pages-4.js";
import { primaryGrade } from "../reports-family.js";
import { profileKey, readLocal, writeLocal } from "../school-tools.js";
import { REWARDS_KEY, bootPage, loadEvidence } from "./page4.js";

const $ = (selector) => document.querySelector(selector);
const ui = { grade: null, evidence: null, data: null, profile: 0 };

async function draw(state) {
  ui.profile = state.profile;
  ui.evidence = await loadEvidence(state.profile);
  if (ui.grade === null) ui.grade = primaryGrade(ui.evidence.tutor);
  const goals = sanitizeGoals(readLocal(profileKey(GOALS_KEY, state.profile), { goals: [] }));
  ui.goals = goals;
  const { tutor, trail, rewards, log, api } = ui.evidence;
  const kept = keepEarned(readLocal(profileKey(EARNED_KEY, state.profile), null), earnedAchievements(tutor, trail, rewards, log, { api, goals }));
  writeLocal(profileKey(EARNED_KEY, state.profile), kept.store);
  ui.data = kept.data;
  const text = achievementsChrome();
  document.title = text.docTitle;
  $("#a4-title").textContent = text.title;
  $("#a4-eyebrow").textContent = text.eyebrow;
  $("#a4-optional").textContent = text.optional;
  $("#back-link").textContent = text.back;
  $("#report-link").textContent = text.link;
  $("#skip-link").textContent = text.skip;
  $("#foot-lab").textContent = text.foot;
  const open = new Set([...document.querySelectorAll("details[open]")].map((el) => el.querySelector("summary")?.dataset.fk));
  const key = document.activeElement?.dataset?.fk;
  $("#a4-body").innerHTML = achievementsPage(ui.data, ui);
  for (const summary of document.querySelectorAll("#a4-body summary")) if (open.has(summary.dataset.fk)) summary.parentElement.open = true;
  if (key) document.querySelector(`[data-fk="${CSS.escape(key)}"]`)?.focus({ preventScroll: true });
}

const saveGoals = (goals) => writeLocal(profileKey(GOALS_KEY, ui.profile), goals);

document.addEventListener("click", (event) => {
  const grade = event.target.closest("[data-grade]");
  if (grade) {
    ui.grade = Number(grade.dataset.grade);
    return redraw();
  }
  const cert = event.target.closest("[data-cert]");
  if (cert) {
    const item = ui.data.badges.find((entry) => entry.id === cert.dataset.cert);
    if (!item) return;
    $("#a4-print").innerHTML = achievementCertificateHtml(item);
    document.body.dataset.print = "certificate";
    return window.print();
  }
  if (event.target.closest("[data-goal-add]")) {
    const key = $("#goal-skill")?.value;
    if (key) saveGoals(addGoal(ui.goals, key, ui.evidence.tutor));
    return redraw();
  }
  const remove = event.target.closest("[data-goal-remove]");
  if (remove) {
    saveGoals(removeGoal(ui.goals, remove.dataset.goalRemove));
    redraw();
  }
});
document.addEventListener("change", (event) => {
  if (event.target.id !== "weekly-goal") return;
  writeLocal(profileKey(REWARDS_KEY, ui.profile), { ...ui.evidence.rewards, goal: Number(event.target.value) });
  redraw();
});
window.addEventListener("afterprint", () => {
  delete document.body.dataset.print;
  $("#a4-print").innerHTML = "";
});

function redraw() {
  return draw({ profile: ui.profile }).catch(console.error);
}
bootPage({ draw, onProfile: () => { ui.grade = null; } });
