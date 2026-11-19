// Editable Evidence-Based Small-Group Intervention Builder & Curriculum Strategy Settings.
// Derives instructional target, visual model, teacher demo, guided questions, 3-5 practice items,
// transfer item, quick reassessment, and printable teacher notes from the shared Strategy Registry.
// Never attaches unsupported diagnostic labels; reports observed evidence & insufficient-evidence flags plainly.

import { ALL_SKILLS, generateProblem, seededRandom } from "./problem-bank.js";
import { buildCanonicalSolution, getStrategy } from "./strategy-registry.js";
import {
  CURRICULUM_PROFILES,
  METHOD_OPTIONS,
  VOCAB_STYLES,
  loadCurriculumSettings,
  saveCurriculumSettings,
} from "./curriculum-profiles.js";
import { learningStage } from "./mastery-model.js";
import { esc } from "./reports-export.js";
import { t } from "./i18n.js";

export function buildInterventionPlan({
  skillKey,
  learners = [],
  settings = null,
  practiceCount = 4,
  seed = 101,
} = {}) {
  const activeSettings = settings || loadCurriculumSettings();
  const [gStr, id] = String(skillKey || "").split(":");
  const skill = ALL_SKILLS.find((s) => s.grade === Number(gStr) && s.id === id) || ALL_SKILLS[0];
  const resolvedKey = `${skill.grade}:${skill.id}`;
  const strategy = getStrategy(skill, activeSettings);

  const demoItem = generateProblem(skill, seededRandom(seed * 7919));
  const solution = buildCanonicalSolution(skill, demoItem, { settings: activeSettings });

  const count = Math.max(3, Math.min(5, Number(practiceCount) || 4));
  const practiceItems = [];
  const seen = new Set([demoItem.question]);
  for (let i = 1; practiceItems.length < count && i < 40; i += 1) {
    const candidate = generateProblem(skill, seededRandom((seed + i) * 6151));
    if (!seen.has(candidate.question)) {
      seen.add(candidate.question);
      practiceItems.push({
        question: candidate.question,
        answer: candidate.answers?.[0] ?? "",
        hint: candidate.hint || "",
      });
    }
  }

  let transferItem = generateProblem(skill, seededRandom((seed + 53) * 4999));
  if (seen.has(transferItem.question)) {
    transferItem = generateProblem(skill, seededRandom((seed + 71) * 4999));
  }
  const reassessItem = generateProblem(skill, seededRandom((seed + 89) * 3571));

  // Observed class evidence for this skill (never invented)
  const observedLearners = learners.map((learner) => {
    const rec = learner?.tutor?.records?.[resolvedKey] || {};
    const stageInfo = learningStage(rec);
    return {
      id: learner.id,
      label: learner.label || `Learner ${learner.id}`,
      stage: stageInfo.stage,
      stageLabel: stageInfo.label.en,
      insufficientEvidence: stageInfo.insufficientEvidence,
      independentCorrect: stageInfo.metrics.independentCorrect,
      independentAttempts: stageInfo.metrics.independentAttempts,
      assistedCorrect: stageInfo.metrics.assistedCorrect,
      reason: stageInfo.reason.en,
    };
  });

  const guidedQuestions = [
    `What do the numbers and units in "${demoItem.question}" represent before we calculate?`,
    "How does the visual model show that the total value stays equivalent during each step?",
    "If we changed one number in the problem, how would our strategy stay the same?",
  ];

  return {
    skillKey: resolvedKey,
    grade: skill.grade,
    skillTitle: skill.title,
    standards: strategy.standards,
    curriculum: {
      profileId: strategy.activeProfile.id,
      profileName: strategy.activeProfile.name.en,
      verificationStatus: strategy.activeAlignment.verificationStatus,
      fallbackUsed: strategy.activeAlignment.fallbackUsed,
      unit: strategy.activeAlignment.unit,
      lesson: strategy.activeAlignment.lesson,
      preferredMethod: strategy.preferredMethod,
    },
    target: strategy.learningObjective.en,
    conceptualFocus: strategy.conceptualExplanation.en,
    watchFor: strategy.misconceptionSummary.en,
    visualFrameSvg: solution.visualModel.frames[0]?.svg || "",
    visualEngine: solution.visualModel.engineId,
    teacherDemo: {
      question: demoItem.question,
      steps: solution.workedSteps,
      answer: solution.correctAnswer,
    },
    guidedQuestions,
    practiceItems,
    transferItem: {
      question: transferItem.question,
      answer: transferItem.answers?.[0] ?? "",
    },
    reassessmentItem: {
      question: reassessItem.question,
      answer: reassessItem.answers?.[0] ?? "",
    },
    observedLearners,
    notes: "",
  };
}

export function renderPrintableIntervention(plan, editedNotes = "") {
  const alignBadge = plan.curriculum.fallbackUsed
    ? `${plan.curriculum.profileName} (Standards-Aligned Fallback — Reveal mapping pending verification)`
    : plan.curriculum.unit
      ? `${plan.curriculum.profileName} · ${plan.curriculum.unit} (${plan.curriculum.lesson})`
      : plan.curriculum.profileName;

  return `<article class="fl-print-intervention" style="font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;color:#17324d">
    <h1>Small-Group Intervention Plan: ${esc(plan.skillTitle)}</h1>
    <p><strong>Grade ${plan.grade === 0 ? "K" : plan.grade}</strong> · Standards: ${esc(plan.standards.join(", "))} · Curriculum: ${esc(alignBadge)}</p>
    <h2>1. Instructional Target &amp; Conceptual Focus</h2>
    <p>${esc(plan.target)}</p>
    <p><em>Key idea:</em> ${esc(plan.conceptualFocus)}</p>
    <p><em>Watch for:</em> ${esc(plan.watchFor)}</p>
    ${plan.visualFrameSvg ? `<h2>2. Visual Model (${esc(plan.visualEngine)})</h2><div style="max-width:480px">${plan.visualFrameSvg}</div>` : ""}
    <h2>3. Brief Teacher Demonstration</h2>
    <p><strong>Problem:</strong> ${esc(plan.teacherDemo.question)}</p>
    <ol>${plan.teacherDemo.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
    <p><strong>Verified Answer:</strong> ${esc(plan.teacherDemo.answer)}</p>
    <h2>4. Guided Discussion Questions</h2>
    <ul>${plan.guidedQuestions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>
    <h2>5. Targeted Practice (${plan.practiceItems.length} items)</h2>
    <ol>${plan.practiceItems.map((it) => `<li>${esc(it.question)} <span style="color:#64748b">[Key: ${esc(it.answer)}]</span></li>`).join("")}</ol>
    <h2>6. Transfer Problem</h2>
    <p>${esc(plan.transferItem.question)} <span style="color:#64748b">[Key: ${esc(plan.transferItem.answer)}]</span></p>
    <h2>7. Quick Independent Reassessment</h2>
    <p>${esc(plan.reassessmentItem.question)} <span style="color:#64748b">[Key: ${esc(plan.reassessmentItem.answer)}]</span></p>
    ${editedNotes ? `<h2>Teacher Notes</h2><p>${esc(editedNotes)}</p>` : ""}
  </article>`;
}

export function mountInterventionBuilder(container, { klass, grade = 6, onPrint, announce } = {}) {
  let settings = loadCurriculumSettings();
  const skillsForGrade = (g) => ALL_SKILLS.filter((s) => s.grade === g);
  let selectedGrade = Number.isInteger(grade) ? grade : 6;
  let selectedKey = `${selectedGrade}:${skillsForGrade(selectedGrade)[0]?.id || "ratios"}`;
  let practiceCount = 4;
  let teacherNotes = "";

  function render() {
    const learners = klass?.learners?.() || [];
    const plan = buildInterventionPlan({
      skillKey: selectedKey,
      learners,
      settings,
      practiceCount,
    });
    const gradeSkills = skillsForGrade(selectedGrade);
    const needSupport = plan.observedLearners.filter(
      (l) => !l.insufficientEvidence && (l.stage === "exploring" || l.stage === "developing"),
    );
    const insufficient = plan.observedLearners.filter((l) => l.insufficientEvidence);

    container.innerHTML = `<section class="t4-intervention" aria-label="${esc(t("Plan Intervention"))}">
      <div class="t4-card" style="padding:1rem;border:1px solid #cbd5e1;border-radius:12px;margin-bottom:1rem;background:#f8fafc">
        <h3>${esc(t("Curriculum Strategy Profile"))}</h3>
        <p style="margin:.25rem 0 .75rem;color:#475569">${esc(t("Controls how strategies and models are taught. Mathematically correct answers are always accepted."))}</p>
        <div class="t4-row" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:.75rem">
          <label>${esc(t("Curriculum"))}
            <select data-curr-profile style="width:100%;min-height:44px">
              ${Object.values(CURRICULUM_PROFILES)
                .map((p) => `<option value="${esc(p.id)}" ${p.id === settings.profileId ? "selected" : ""}>${esc(p.name.en)}</option>`)
                .join("")}
            </select>
          </label>
          <label>${esc(t("Preferred instructional method"))}
            <select data-curr-method style="width:100%;min-height:44px">
              ${METHOD_OPTIONS.map((m) => `<option value="${esc(m.id)}" ${m.id === settings.preferredMethod ? "selected" : ""}>${esc(m.label.en)}</option>`).join("")}
            </select>
          </label>
          <label>${esc(t("Vocabulary convention"))}
            <select data-curr-vocab style="width:100%;min-height:44px">
              ${VOCAB_STYLES.map((v) => `<option value="${esc(v.id)}" ${v.id === settings.vocabularyStyle ? "selected" : ""}>${esc(v.label.en)}</option>`).join("")}
            </select>
          </label>
        </div>
        <p style="margin:.75rem 0 0;font-size:.9rem;color:#17324d" data-testid="curriculum-status">
          <strong>${esc(t("Alignment status"))}:</strong>
          ${plan.curriculum.fallbackUsed
            ? esc("Pending authorized Reveal Math source verification for this skill — using General Standards-Aligned Mathematics fallback.")
            : plan.curriculum.unit
              ? esc(`Verified Reveal Math (${plan.curriculum.unit}, Lessons ${plan.curriculum.lesson}).`)
              : esc("Verified General Standards-Aligned Mathematics.")}
        </p>
      </div>

      <div class="t4-card" style="padding:1rem;border:1px solid #cbd5e1;border-radius:12px;margin-bottom:1rem">
        <h3>${esc(t("Small-Group Intervention Builder"))}</h3>
        <div class="t4-row" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem;margin-bottom:1rem">
          <label>${esc(t("Grade"))}
            <select data-int-grade style="width:100%;min-height:44px">
              ${[0, 1, 2, 3, 4, 5, 6, 7, 8]
                .map((g) => `<option value="${g}" ${g === selectedGrade ? "selected" : ""}>${g === 0 ? "Kindergarten" : `Grade ${g}`}</option>`)
                .join("")}
            </select>
          </label>
          <label>${esc(t("Target skill"))}
            <select data-int-skill style="width:100%;min-height:44px">
              ${gradeSkills
                .map((s) => `<option value="${s.grade}:${s.id}" ${`${s.grade}:${s.id}` === selectedKey ? "selected" : ""}>${esc(s.title)}</option>`)
                .join("")}
            </select>
          </label>
          <label>${esc(t("Practice items (3–5)"))}
            <select data-int-count style="width:100%;min-height:44px">
              ${[3, 4, 5].map((n) => `<option value="${n}" ${n === practiceCount ? "selected" : ""}>${n}</option>`).join("")}
            </select>
          </label>
        </div>

        <div style="padding:.75rem;background:#f1f5f9;border-radius:8px;margin-bottom:1rem">
          <strong>${esc(t("Observed Evidence Summary"))}:</strong>
          ${plan.observedLearners.length
            ? `${needSupport.length} needing support · ${insufficient.length} with insufficient evidence (${plan.observedLearners.length} learners loaded).`
            : "Load learner files in Class insights to see who needs support for this skill."}
        </div>

        <p><strong>${esc(t("Instructional Target"))}:</strong> ${esc(plan.target)}</p>
        <p><strong>${esc(t("Conceptual Model"))}:</strong> ${esc(plan.conceptualFocus)}</p>
        ${plan.visualFrameSvg ? `<div style="max-width:440px;margin:.75rem 0">${plan.visualFrameSvg}</div>` : ""}
        <p><strong>${esc(t("Teacher Demonstration"))}:</strong> ${esc(plan.teacherDemo.question)} → <code>${esc(plan.teacherDemo.answer)}</code></p>
        <h4>${esc(t("Guided Questions"))}</h4>
        <ul>${plan.guidedQuestions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>
        <h4>${esc(t("Targeted Practice"))}</h4>
        <ol>${plan.practiceItems.map((it) => `<li>${esc(it.question)} <small style="color:#64748b">(${esc(it.answer)})</small></li>`).join("")}</ol>
        <p><strong>${esc(t("Transfer Problem"))}:</strong> ${esc(plan.transferItem.question)} <small style="color:#64748b">(${esc(plan.transferItem.answer)})</small></p>
        <p><strong>${esc(t("Quick Reassessment"))}:</strong> ${esc(plan.reassessmentItem.question)} <small style="color:#64748b">(${esc(plan.reassessmentItem.answer)})</small></p>

        <label style="display:block;margin-top:.75rem">${esc(t("Editable Teacher Notes"))}
          <textarea data-int-notes rows="3" style="width:100%;margin-top:.25rem;padding:.5rem" placeholder="${esc(t("Add small-group adjustments, manipulatives, or ESOL scaffolds..."))}">${esc(teacherNotes)}</textarea>
        </label>
        <div style="margin-top:.75rem;display:flex;gap:.5rem;flex-wrap:wrap">
          <button type="button" class="btn-primary" data-int-print style="min-height:44px;padding:.5rem 1rem">${esc(t("Print intervention notes"))}</button>
        </div>
      </div>
    </section>`;

    container.querySelector("[data-curr-profile]")?.addEventListener("change", (e) => {
      settings = saveCurriculumSettings({ ...settings, profileId: e.target.value });
      announce?.("Curriculum strategy profile updated.");
      render();
    });
    container.querySelector("[data-curr-method]")?.addEventListener("change", (e) => {
      settings = saveCurriculumSettings({ ...settings, preferredMethod: e.target.value });
      render();
    });
    container.querySelector("[data-curr-vocab]")?.addEventListener("change", (e) => {
      settings = saveCurriculumSettings({ ...settings, vocabularyStyle: e.target.value });
      render();
    });
    container.querySelector("[data-int-grade]")?.addEventListener("change", (e) => {
      selectedGrade = Number(e.target.value);
      selectedKey = `${selectedGrade}:${skillsForGrade(selectedGrade)[0]?.id || ""}`;
      render();
    });
    container.querySelector("[data-int-skill]")?.addEventListener("change", (e) => {
      selectedKey = e.target.value;
      render();
    });
    container.querySelector("[data-int-count]")?.addEventListener("change", (e) => {
      practiceCount = Number(e.target.value);
      render();
    });
    container.querySelector("[data-int-notes]")?.addEventListener("input", (e) => {
      teacherNotes = e.target.value;
    });
    container.querySelector("[data-int-print]")?.addEventListener("click", () => {
      const html = renderPrintableIntervention(plan, teacherNotes);
      if (typeof onPrint === "function") onPrint(html, `Intervention: ${plan.skillTitle}`);
    });
  }

  render();
  return { refresh: render };
}
