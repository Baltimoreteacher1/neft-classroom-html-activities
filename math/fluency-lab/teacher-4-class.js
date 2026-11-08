// Teacher tools 4.0, Class insights and Reports tabs. Learner files are read in the browser and kept in memory
// for this visit. A class is saved on the device only when the teacher presses "Save this class on this device".
import { classReportHtml, esc, learnerCsv, reportJson, skillCsv } from "./reports-export.js";
import { analyzeClass, compareSnapshotSets, parseLearnerFile } from "./reports-teacher.js";
import { MAX_LEARNERS } from "./reports-rows.js";
import {
  groupsHtml,
  patternsHtml,
  progressHtml,
  strandsHtml,
  summaryHtml,
  troubleHtml,
  troubleRankHtml,
  trendsHtml,
} from "./teacher-4-views.js";
import { factsClassHtml } from "./teacher-tools-views.js";
import { t } from "./i18n.js";
import { downloadFile, readLocal, writeLocal } from "./school-tools.js";
import { findSkill, localDay, sanitizeTutor } from "./tutor-engine.js";
import { sanitizeGrowthLog } from "./growth-log.js";
import { sanitizeFacts } from "./moby/fact-model.js";
import { cleanGreenDays } from "./green-light.js";
import { cleanStudio } from "./studio/adaptive.js";

const SAVED_KEY = "ewl-fluency-teacher-class-v1";
const MAX_FILE = 2_000_000;

const savedClass = () => {
  const saved = readLocal(SAVED_KEY, null);
  if (!saved || saved.version !== 1 || !Array.isArray(saved.learners)) return null;
  return {
    savedAt: Number(saved.savedAt) || 0,
    learners: saved.learners
      .slice(0, MAX_LEARNERS)
      .map((item, index) => ({
        id: `saved-${index + 1}`,
        label: String(item.label || `Learner ${index + 1}`).slice(0, 40),
        tutor: sanitizeTutor(item.tutor),
        growth: sanitizeGrowthLog(item.growth),
        facts: sanitizeFacts(item.facts),
        greenDays: cleanGreenDays(item.greenDays),
        studio: cleanStudio(item.studio),
        exportedAt: Number(item.exportedAt) || null,
        grade: null,
      })),
  };
};

export function createClassState({ deviceLearners }) {
  const state = {
    sets: [],
    current: null,
    grade: null,
    levelKey: "",
    showLabels: true,
    message: "",
  };
  const latest = () =>
    state.sets.find((set) => set.id === state.current) || state.sets.at(-1) || null;
  const addSet = (label, learners) => {
    const at = Math.max(0, ...learners.map((learner) => learner.exportedAt || 0)) || Date.now();
    const set = {
      id: `set-${Date.now().toString(36)}-${state.sets.length}`,
      label,
      at,
      learners: learners.slice(0, MAX_LEARNERS),
    };
    state.sets = [...state.sets, set].sort((a, b) => a.at - b.at);
    state.current = state.sets.at(-1).id; // the newest snapshot is the one analyzed
    return set;
  };
  return {
    state,
    latest,
    learners: () => latest()?.learners || [],
    analysis: () => {
      const set = latest();
      return set ? analyzeClass(set.learners, { grade: state.grade, now: Date.now() }) : null;
    },
    async openFiles(files) {
      const learners = [];
      let skipped = 0;
      for (const file of [...files].slice(0, MAX_LEARNERS)) {
        try {
          if (file.size > MAX_FILE) throw new Error("large");
          const learner = parseLearnerFile(JSON.parse(await file.text()), learners.length);
          if (learner) learners.push(learner);
          else skipped += 1;
        } catch {
          skipped += 1;
        }
      }
      if (learners.length)
        addSet(
          t("Snapshot {date}", {
            date: localDay(Math.max(0, ...learners.map((l) => l.exportedAt || 0)) || Date.now()),
          }),
          learners,
        );
      state.message = skipped
        ? t("{n} files were not Fluency Lab backups and were skipped.", { n: skipped })
        : "";
      return learners.length;
    },
    useDevice() {
      const learners = deviceLearners().filter(
        (learner) =>
          Object.keys(learner.tutor.records).length ||
          Object.keys(learner.studio?.skills || {}).length,
      );
      if (learners.length) addSet(t("This device {date}", { date: localDay() }), learners);
      else state.message = t("No saved practice was found on this device.");
      return learners.length;
    },
    openSaved() {
      const saved = savedClass();
      if (saved) addSet(t("Saved class"), saved.learners);
    },
    removeSet(id) {
      state.sets = state.sets.filter((set) => set.id !== id);
      if (state.current === id) state.current = null;
    },
    clear() {
      state.sets = [];
      state.current = null;
      state.levelKey = "";
      state.message = "";
    },
    relabel(id, label) {
      const learner = latest()?.learners.find((item) => item.id === id);
      if (learner) learner.label = label.replace(/[<>]/g, "").trim().slice(0, 40) || learner.label;
    },
    save() {
      const set = latest();
      if (!set) return false;
      return writeLocal(SAVED_KEY, {
        version: 1,
        savedAt: Date.now(),
        learners: set.learners.map(
          ({ label, tutor, growth, facts, greenDays, studio, exportedAt }) => ({
            label,
            tutor,
            growth,
            facts,
            greenDays,
            studio: cleanStudio(studio),
            exportedAt,
          }),
        ),
      });
    },
    forget() {
      try {
        localStorage.removeItem(SAVED_KEY);
      } catch {
        /* nothing saved */
      }
    },
    savedSummary: () => {
      const saved = savedClass();
      return saved
        ? { count: saved.learners.length, day: saved.savedAt ? localDay(saved.savedAt) : "" }
        : null;
    },
  };
}

const section = (id, title, intro, body) =>
  `<section class="t4-section" aria-labelledby="${id}"><h3 id="${id}">${esc(title)}</h3>${intro ? `<p class="t4-hint">${esc(intro)}</p>` : ""}${body}</section>`;

function sourceHtml(klass) {
  const { state } = klass;
  const saved = klass.savedSummary();
  const gradesPresent = [
    ...new Set(
      klass.learners().flatMap((learner) =>
        Object.keys(learner.tutor.records)
          .map((key) => findSkill(key)?.grade)
          .filter((grade) => grade !== undefined),
      ),
    ),
  ].sort((a, b) => a - b);
  return `<section class="t4-source" aria-labelledby="t4-source-title"><h3 id="t4-source-title">${esc(t("Open learner files"))}</h3>
    <p>${esc(t("Learners use Download my progress on the practice page. Open several of those .json files here. Files are read in this browser and never uploaded."))}</p>
    <div class="t4-actions"><label class="fl-btn t4-file">${esc(t("Open learner files"))}<input type="file" multiple accept="application/json,.json" data-t4-files></label>
      <button type="button" class="fl-btn fl-btn--ghost" data-t4-device>${esc(t("Use learners on this device"))}</button>
      ${state.sets.length ? `<button type="button" class="fl-btn fl-btn--ghost" data-t4-clear>${esc(t("Clear everything from this page"))}</button>` : ""}</div>
    ${saved ? `<p class="t4-saved">${esc(t("A class of {n} learners was saved on this device {date}.", { n: saved.count, date: saved.day }))} <button type="button" class="fl-btn fl-btn--ghost" data-t4-open-saved>${esc(t("Open saved class"))}</button></p>` : ""}
    <p class="t4-message" role="status">${esc(state.message)}</p>
    ${
      state.sets.length
        ? `<div class="t4-row"><label>${esc(t("Snapshot to analyze"))}<select data-t4-set>${state.sets.map((set) => `<option value="${esc(set.id)}" ${set.id === klass.latest().id ? "selected" : ""}>${esc(set.label)} (${set.learners.length})</option>`).join("")}</select></label>
      <label>${esc(t("Grade"))}<select data-t4-grade><option value="">${esc(t("All grades"))}</option>${gradesPresent.map((grade) => `<option value="${grade}" ${state.grade === grade ? "selected" : ""}>${esc(grade === 0 ? t("Kindergarten") : t("Grade {n}", { n: grade }))}</option>`).join("")}</select></label>
      ${state.sets.length > 1 ? `<button type="button" class="fl-btn fl-btn--ghost" data-t4-remove-set>${esc(t("Remove this snapshot"))}</button>` : ""}</div>`
        : ""
    }
    ${
      klass.learners().length
        ? `<details class="t4-more"><summary>${esc(t("Learner labels (optional)"))}</summary><p class="t4-hint">${esc(t("Files hold no names. Labels you type stay in this page and in reports you make. Leave them as they are to keep the class anonymous."))}</p><div class="t4-labels">${klass
            .learners()
            .map(
              (learner) =>
                `<label>${esc(learner.id)}<input data-t4-label="${esc(learner.id)}" maxlength="40" value="${esc(learner.label)}" autocomplete="off"></label>`,
            )
            .join("")}</div></details>`
        : ""
    }</section>`;
}

export function mountInsights(host, { klass, onPlan, announce }) {
  const render = () => {
    const analysis = klass.analysis();
    const body =
      !analysis || !analysis.totals.learners
        ? `<p class="t4-empty" role="status">${esc(klass.latest() ? t("These files hold no saved answers for the chosen grade yet.") : t("Open learner files to see what to reteach, how to group learners, and how the class is changing."))}</p>`
        : [
            summaryHtml(analysis),
            section(
              "t4-h-trouble",
              t("Skills to reteach"),
              t(
                "A skill appears when at least one third of the learners with two or more independent checks answered under 60% correctly.",
              ),
              troubleHtml(analysis),
            ),
            section(
              "t4-h-spots",
              t("Trouble spots, ranked"),
              t(
                "A learner has a trouble spot after missing the same kind of item three times on their own in the last four weeks. Spots shared by the most learners come first.",
              ),
              troubleRankHtml(analysis),
            ),
            section(
              "t4-h-patterns",
              t("Answer patterns to reteach"),
              t(
                "Counts of saved wrong answers that match a named pattern. A match is a pointer, not a diagnosis.",
              ),
              patternsHtml(analysis),
            ),
            section(
              "t4-h-facts",
              t("Fact automaticity and Green Light days"),
              t(
                "From each learner's fact practice: first-try answers on their own across separate days, plus their own note on how they got it. No clock is used.",
              ),
              factsClassHtml(klass.learners()),
            ),
            section(
              "t4-h-groups",
              t("Flexible groups"),
              t(
                "Groups describe one skill today. A learner can be in several groups or none, and nothing is stored on a learner.",
              ),
              groupsHtml(analysis, klass.state.levelKey),
            ),
            section(
              "t4-h-strands",
              t("Mastery by strand"),
              t("Average of each learner's 0 to 100 skill scores, by strand."),
              strandsHtml(analysis),
            ),
            section(
              "t4-h-progress",
              t("Independent work, retention and growth"),
              "",
              progressHtml(analysis),
            ),
            section(
              "t4-h-trends",
              t("Class trend across snapshots"),
              "",
              trendsHtml(
                compareSnapshotSets(
                  klass.state.sets.map((set) => ({
                    label: set.label,
                    at: set.at,
                    learners: set.learners,
                  })),
                  { grade: klass.state.grade },
                ),
                (key) => findSkill(key)?.title || key,
              ),
            ),
          ].join("");
    host.innerHTML = `${sourceHtml(klass)}<div class="t4-results">${body}</div>`;
  };
  const refreshResults = () => {
    const keep = host.querySelector("[data-t4-level]") === document.activeElement;
    render();
    if (keep) host.querySelector("[data-t4-level]")?.focus();
  };
  host.addEventListener("change", async (event) => {
    const target = event.target;
    if (target.matches("[data-t4-files]")) {
      const count = await klass.openFiles(target.files);
      render();
      announce?.(t("{n} learner files opened.", { n: count }));
    } else if (target.matches("[data-t4-set]")) {
      klass.state.current = target.value;
      render();
    } else if (target.matches("[data-t4-grade]")) {
      klass.state.grade = target.value === "" ? null : Number(target.value);
      klass.state.levelKey = "";
      render();
    } else if (target.matches("[data-t4-level]")) {
      klass.state.levelKey = target.value;
      refreshResults();
    } else if (target.matches("[data-t4-label]")) {
      klass.relabel(target.dataset.t4Label, target.value);
      render();
      host.dispatchEvent(new CustomEvent("t4-changed", { bubbles: true }));
    }
  });
  host.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.matches("[data-t4-device]")) {
      const count = klass.useDevice();
      render();
      announce?.(t("{n} learners opened from this device.", { n: count }));
    } else if (button.matches("[data-t4-clear]")) {
      klass.clear();
      render();
      announce?.(t("Everything was cleared from this page."));
    } else if (button.matches("[data-t4-open-saved]")) {
      klass.openSaved();
      render();
    } else if (button.matches("[data-t4-remove-set]")) {
      klass.removeSet(klass.latest().id);
      render();
    } else if (button.dataset.t4Plan) {
      const [kind, index] = button.dataset.t4Plan.split(":");
      const analysis = klass.analysis();
      const source = {
        trouble: analysis.troubleSpots,
        spot: analysis.troubleRanked,
        pattern: analysis.misconceptions.byPattern,
        group: analysis.groups,
        individual: analysis.individual,
      }[kind]?.[Number(index)];
      if (source)
        onPlan?.({
          ...source.intervention.practice,
          grade: findSkill(source.intervention.focus).grade,
          label: t("Reteach: {skill}", { skill: source.intervention.focusTitle }),
        });
    }
  });
  render();
  return { refresh: render };
}

export function mountReports(host, { klass, onPrint, announce }) {
  const render = () => {
    const ready = Boolean(klass.analysis()?.totals.learners);
    const disabled = ready ? "" : "disabled";
    host.innerHTML = `<section class="t4-section"><h3>${esc(t("Reports"))}</h3><p>${esc(ready ? t("Export what is on the Class insights tab. Files use only the labels shown there.") : t("Open learner files in Class insights first."))}</p>
      <div class="t4-actions"><button type="button" class="fl-btn" data-t4-csv-learner ${disabled}>${esc(t("Download CSV: one row per learner"))}</button><button type="button" class="fl-btn" data-t4-csv-skill ${disabled}>${esc(t("Download CSV: one row per learner and skill"))}</button><button type="button" class="fl-btn" data-t4-json ${disabled}>${esc(t("Download JSON"))}</button></div>
      <div class="t4-actions"><button type="button" class="fl-btn fl-btn--teal" data-t4-print ${disabled}>${esc(t("Print class report"))}</button><label class="t4-inline t4-check"><input type="checkbox" data-t4-labels ${klass.state.showLabels ? "checked" : ""}><span>${esc(t("Show learner labels on the printout"))}</span></label></div></section>
    <section class="t4-section" aria-labelledby="t4-privacy"><h3 id="t4-privacy">${esc(t("Privacy"))}</h3><ul class="t4-plain t4-privacy"><li>${esc(t("Learner files are read in this browser. Nothing is uploaded, and there are no accounts."))}</li><li>${esc(t("Files hold no names. A label is only what you type, or Learner 1, Learner 2 and so on."))}</li><li>${esc(t("Nothing identifiable is kept after you leave this page unless you press Save this class on this device."))}</li><li>${esc(t("Downloaded files and printouts contain the labels shown on screen. Store and share them as you would any class record."))}</li></ul>
      <div class="t4-actions"><button type="button" class="fl-btn fl-btn--ghost" data-t4-save ${disabled}>${esc(t("Save this class on this device"))}</button>${klass.savedSummary() ? `<button type="button" class="fl-btn fl-btn--ghost" data-t4-forget>${esc(t("Delete the saved class"))}</button>` : ""}</div><p class="t4-message" role="status" data-t4-note></p></section>`;
  };
  const note = (text) => {
    const node = host.querySelector("[data-t4-note]");
    if (node) node.textContent = text;
    announce?.(text);
  };
  host.addEventListener("change", (event) => {
    if (event.target.matches("[data-t4-labels]")) klass.state.showLabels = event.target.checked;
  });
  host.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const analysis = klass.analysis();
    const stamp = localDay();
    const scope =
      analysis?.grade === null || analysis?.grade === undefined ? "all" : `grade-${analysis.grade}`;
    if (button.matches("[data-t4-csv-learner]"))
      downloadFile(
        `fluency-class-learners-${scope}-${stamp}.csv`,
        learnerCsv(analysis),
        "text/csv;charset=utf-8",
      );
    else if (button.matches("[data-t4-csv-skill]"))
      downloadFile(
        `fluency-class-skills-${scope}-${stamp}.csv`,
        skillCsv(analysis),
        "text/csv;charset=utf-8",
      );
    else if (button.matches("[data-t4-json]"))
      downloadFile(
        `fluency-class-report-${scope}-${stamp}.json`,
        JSON.stringify(reportJson(analysis), null, 2),
      );
    else if (button.matches("[data-t4-print]"))
      onPrint?.(
        classReportHtml(analysis, {
          showLabels: klass.state.showLabels,
          title: klass.latest()?.label,
        }),
      );
    else if (button.matches("[data-t4-save]")) {
      const saved = klass.save();
      render();
      note(
        saved
          ? t("Class saved on this device. Delete it here at any time.")
          : t("This browser could not save the class."),
      );
    }
    else if (button.matches("[data-t4-forget]")) {
      klass.forget();
      render();
      note(t("The saved class was deleted."));
    }
  });
  render();
  return { refresh: render };
}
