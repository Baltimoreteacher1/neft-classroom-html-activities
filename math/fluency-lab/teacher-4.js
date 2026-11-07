// Teacher tools 4.0: assignments with differentiated practice and targets, class insights built from learner
// files the teacher opens, and exportable reports. Mounted at the top of the "For teachers" view.
// Privacy: learner data is read only after the teacher chooses files (or this device's profiles), stays in memory,
// and is saved only on an explicit button press. Nothing is sent anywhere.
import { loadGrowthLog } from "./growth-log.js";
import { FACTS_KEY } from "./moby/fact-model.js";
import { REWARDS_KEY } from "./rewards.js";
import { profileKey, readLocal } from "./school-tools.js";
import { t } from "./i18n.js";
import { deviceLearner } from "./reports-rows.js";
import { esc } from "./reports-export.js";
import { mountAssignments } from "./teacher-4-assign.js";
import { createClassState, mountInsights, mountReports } from "./teacher-4-class.js";
import { mountAssessmentBuilder, mountLessonPlanner } from "./e8/assessment-ui.js";
import { mountMasteryMap } from "./e8/teacher-hub-ui.js";
import { mountClassTools } from "./teacher-class-tools.js";

const TABS = () => [
  { id: "assign", label: t("Assignments") },
  { id: "insights", label: t("Class insights") },
  { id: "reports", label: t("Reports and privacy") },
  { id: "map", label: t("Mastery map") },
  { id: "assess", label: t("Assessments") },
  { id: "lesson", label: t("Lesson plan from my class") },
  { id: "tools", label: t("Class tools") }, // fl-teacher
];

// The opened class lives for this page visit, so switching language or tabs does not lose it. Reloading clears it.
let currentDevice = () => [];
let sharedClass = null;

export function mountTeacher4(
  container,
  { grade, onLaunch, onPrint, announce, profileRecords = () => [] },
) {
  currentDevice = () =>
    profileRecords().map((record) =>
      deviceLearner({
        id: record.id,
        label: record.label,
        tutor: record.tutor,
        growth: loadGrowthLog(record.id),
        facts: readLocal(profileKey(FACTS_KEY, record.id), null),
        greenDays: readLocal(profileKey(REWARDS_KEY, record.id), {})?.greenDays,
      }),
    );
  const klass = (sharedClass ??= createClassState({ deviceLearners: () => currentDevice() }));
  const tabs = TABS();
  container.innerHTML = `<section class="t4" aria-labelledby="t4-title">
    <header class="t4-head"><p class="t4-eyebrow">${esc(t("Teacher tools"))}</p><h2 id="t4-title">${esc(t("Assign, understand, report"))}</h2>
      <p>${esc(t("Differentiated assignments, what to reteach, and flexible groups, from learner files you open. Everything stays on this device."))}</p></header>
    <div class="t4-tabs" role="tablist" aria-label="${esc(t("Teacher tools"))}">${tabs.map((tab, index) => `<button type="button" role="tab" class="t4-tab" id="t4-tab-${tab.id}" aria-controls="t4-panel-${tab.id}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}">${esc(tab.label)}</button>`).join("")}</div>
    ${tabs.map((tab, index) => `<div role="tabpanel" class="t4-panelwrap" id="t4-panel-${tab.id}" aria-labelledby="t4-tab-${tab.id}" ${index ? "hidden" : ""}></div>`).join("")}</section>`;
  const panel = (id) => container.querySelector(`#t4-panel-${id}`);
  const show = (id, { focus = false } = {}) => {
    for (const tab of tabs) {
      const selected = tab.id === id;
      const button = container.querySelector(`#t4-tab-${tab.id}`);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      panel(tab.id).hidden = !selected;
      if (selected && focus) button.focus();
    }
    if (id === "assign") assign.refresh();
    if (id === "reports") reports.refresh();
    if (id === "map") map.refresh();
    if (id === "lesson") lessonPlan.refresh();
  };

  let prefill = () => {};
  const assign = mountAssignments(panel("assign"), {
    grade,
    getLearners: () => klass.learners(),
    onLaunch,
    onPrint,
    announce,
    registerPrefill: (fn) => {
      prefill = fn;
    },
  });
  mountInsights(panel("insights"), {
    klass,
    announce,
    onPlan: (plan) => {
      show("assign");
      prefill(plan);
    },
  });
  const reports = mountReports(panel("reports"), { klass, onPrint, announce });
  const map = mountMasteryMap(panel("map"), {
    klass,
    grade,
    onPrint,
    announce,
    onPlan: (plan) => {
      show("assign");
      prefill(plan);
    },
  });
  mountAssessmentBuilder(panel("assess"), { klass, grade, onPrint, announce });
  const lessonPlan = mountLessonPlanner(panel("lesson"), { klass, grade });
  mountClassTools(panel("tools"), { grade, onPrint, announce });

  const tablist = container.querySelector("[role=tablist]");
  tablist.addEventListener("click", (event) => {
    const tab = event.target.closest("[role=tab]");
    if (tab) show(tab.id.replace("t4-tab-", ""));
  });
  tablist.addEventListener("keydown", (event) => {
    const order = tabs.map((tab) => tab.id);
    const current = order.indexOf(document.activeElement?.id?.replace("t4-tab-", ""));
    const next = {
      ArrowRight: (current + 1) % order.length,
      ArrowLeft: (current - 1 + order.length) % order.length,
      Home: 0,
      End: order.length - 1,
    }[event.key];
    if (next === undefined || current < 0) return;
    event.preventDefault();
    show(order[next], { focus: true });
  });
  return { show };
}
