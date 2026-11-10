// The mission panel: pick a grade band and a mission, work in the shared workspace, check, ask for hints. Each check is
// marked in missions-check.js and filed as independent or supported in progress.js / store.js.
import { t } from "../i18n.js";
import { checkMission, hintText } from "./missions-check.js";
import { BANDS, MISSIONS, TOPICS, missionById, missionsFor } from "./missions.js";
import { stateFrom } from "./model.js";
import { entryFor, status, withAttempt, withHint } from "./progress.js";
import { recordEvidence } from "./store.js";

const $ = (id) => document.getElementById(id);
export const STATUS_TEXT = {
  new: "Not started",
  started: "In progress",
  supported: "Done with support",
  independent: "Done on my own",
};
const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function mountMissions(app) {
  let band = missionById(app.record.open)?.band ?? BANDS[0].id;
  let feedback = null; // { ok, message, evidence }
  let draft = ""; // typed answer, kept across redraws

  const current = () => missionById(app.record.open);
  const numberOf = (mission) => missionsFor(mission.band).indexOf(mission) + 1;

  function open(id) {
    const mission = missionById(id);
    if (!mission) return;
    feedback = null;
    draft = "";
    band = mission.band;
    app.record = { ...app.record, open: id };
    app.change(
      stateFrom(mission.setup),
      t("Mission started. {prompt}", { prompt: t(mission.prompt) }),
      { announce: true },
    );
    const direct = mission.kind === "set" || mission.kind === "between";
    (direct ? $("ms-strip") : $("ms-mission")).focus();
  }

  function submission(mission) {
    if (mission.kind === "type") return { raw: $("ms-answer")?.value ?? "" };
    if (mission.kind === "choose") {
      const picked = document.querySelector('input[name="ms-choice"]:checked');
      return picked ? { index: Number(picked.value) } : null;
    }
    return { value: app.state.a, parts: app.state.parts.a };
  }

  function check() {
    const mission = current();
    if (!mission) return;
    const sub = submission(mission);
    if (!sub) {
      feedback = { ok: false, message: t("Choose an answer first."), evidence: "" };
      return finish(feedback);
    }
    const result = checkMission(mission, sub);
    if (result.id === "unreadable") {
      feedback = { ok: false, message: result.message, evidence: "" };
      return finish(feedback);
    }
    const outcome = withAttempt(app.record, mission.id, result.ok);
    app.record = outcome.record;
    recordEvidence(
      { mission, correct: result.ok, independent: outcome.independent, attempt: outcome.attempt },
      app.profile,
    );
    feedback = {
      ok: result.ok,
      message: result.message,
      evidence: outcome.independent
        ? t("This check counts as independent work.")
        : t(
            "This check counts as supported work, because you used a hint or tried this mission before.",
          ),
    };
    return finish(feedback);
  }

  function finish(result) {
    app.save();
    render();
    app.announce(`${result.ok ? t("Yes, that works.") : t("Not yet.")} ${result.message}`, {
      delay: 60,
    });
    $("ms-feedback")?.focus({ preventScroll: true });
  }

  function hint() {
    const mission = current();
    if (!mission) return;
    app.record = withHint(app.record, mission.id);
    app.save();
    render();
    const shown = entryFor(app.record, mission.id).hints;
    app.announce(t("Hint {n} of 3. {text}", { n: shown, text: hintText(mission, shown - 1) }), {
      delay: 60,
    });
  }

  function answerHtml(mission, entry) {
    if (mission.kind === "type") {
      return `<label class="ms-field"><span>${t("Your answer")}</span><input id="ms-answer" type="text" autocomplete="off" spellcheck="false" inputmode="text" value="${esc(draft)}" /></label>`;
    }
    if (mission.kind === "choose") {
      return `<fieldset class="ms-choices"><legend>${t("Choose one")}</legend>${mission.options
        .map(
          (option, index) =>
            `<label class="ms-choice"><input type="radio" name="ms-choice" value="${index}" /> <span>${esc(t(option.text))}</span></label>`,
        )
        .join("")}</fieldset>`;
    }
    return `<p class="ms-help">${mission.kind === "between" ? t("Make quantity A the amount you found in the workspace, then check it.") : t("Build it in the workspace above, then check your model.")}</p>`;
  }

  function renderPanel() {
    const panel = $("ms-mission");
    const mission = current();
    if (!mission) {
      panel.innerHTML = `<h3 id="ms-mission-h">${t("No mission open")}</h3><p>${t("Pick a mission from the list to begin. The workspace above is yours to explore at any time.")}</p>`;
      return;
    }
    const entry = entryFor(app.record, mission.id);
    const hints = Array.from(
      { length: entry.hints },
      (_, index) => `<li>${esc(hintText(mission, index))}</li>`,
    ).join("");
    const nextMission = missionsFor(mission.band)[numberOf(mission)];
    panel.innerHTML = `<h3 id="ms-mission-h">${t("Mission {n}: {topic}", { n: numberOf(mission), topic: t(TOPICS[mission.topic].name) })}</h3>
<p class="ms-prompt">${esc(t(mission.prompt))}</p>
${answerHtml(mission, entry)}
<div class="ms-row">
  <button id="ms-check" type="button" class="ms-btn">${mission.kind === "set" || mission.kind === "between" ? t("Check my model") : t("Check my answer")}</button>
  <button id="ms-hint" type="button" class="ms-btn ms-btn-quiet" ${entry.hints >= 3 ? "disabled" : ""}>${entry.hints ? t("Show another hint") : t("Show a hint")}</button>
  <button id="ms-restart" type="button" class="ms-btn ms-btn-quiet">${t("Reset the workspace for this mission")}</button>
</div>
<p class="ms-help">${t("Hints never give the answer. Using one makes this attempt supported work.")}</p>
${hints ? `<ol class="ms-hints" aria-label="${t("Hints so far")}">${hints}</ol>` : ""}
<div id="ms-feedback" class="ms-feedback ${feedback ? (feedback.ok ? "ms-ok" : "ms-try") : ""}" tabindex="-1">${
      feedback
        ? `<p><strong>${feedback.ok ? t("Yes, that works.") : t("Not yet.")}</strong> ${esc(feedback.message)}</p>${feedback.evidence ? `<p class="ms-help">${feedback.evidence}</p>` : ""}`
        : ""
    }</div>
${entry.done ? `<p class="ms-done">${t("Finished:")} ${t(STATUS_TEXT[status(entry)])}. ${nextMission ? `<button id="ms-next" type="button" class="ms-btn">${t("Next mission")}</button>` : ""}</p>` : ""}`;
    $("ms-check").addEventListener("click", check);
    $("ms-hint").addEventListener("click", hint);
    $("ms-restart").addEventListener("click", () => {
      feedback = null;
      app.change(stateFrom(mission.setup), t("Workspace reset for this mission."), {
        announce: true,
      });
    });
    $("ms-next")?.addEventListener("click", () => open(nextMission.id));
    const answer = $("ms-answer");
    answer?.addEventListener("input", () => {
      draft = answer.value;
    });
    answer?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        check();
      }
    });
  }

  function renderList() {
    $("ms-bands").setAttribute("aria-label", t("Grade band"));
    $("ms-bands").innerHTML = BANDS.map(
      (item) =>
        `<button type="button" class="ms-btn ms-btn-quiet" data-band="${item.id}" aria-pressed="${item.id === band}">${t(item.label)}</button>`,
    ).join("");
    $("ms-mission-list").innerHTML = missionsFor(band)
      .map((mission, index) => {
        const entry = entryFor(app.record, mission.id);
        const isOpen = app.record.open === mission.id;
        return `<li><button type="button" class="ms-mission-btn" data-mission="${mission.id}" ${isOpen ? 'aria-current="true"' : ""}><span class="ms-mission-name">${index + 1}. ${t(TOPICS[mission.topic].name)}</span><span class="ms-status ms-status-${status(entry)}">${t(STATUS_TEXT[status(entry)])}</span></button></li>`;
      })
      .join("");
    for (const button of document.querySelectorAll("[data-band]")) {
      button.addEventListener("click", () => {
        band = button.dataset.band;
        renderList();
        $("ms-mission-list").querySelector("button")?.focus();
      });
    }
    for (const button of document.querySelectorAll("[data-mission]"))
      button.addEventListener("click", () => open(button.dataset.mission));
  }

  function renderStrip() {
    const mission = current();
    const entry = mission ? entryFor(app.record, mission.id) : null;
    const strip = $("ms-strip");
    strip.hidden = !mission || entry.done;
    if (strip.hidden) return;
    $("ms-strip-text").textContent = t(mission.prompt);
    const direct = mission.kind === "set" || mission.kind === "between";
    const action = $("ms-strip-action");
    action.textContent = direct ? t("Check my model") : t("Go to the question");
    action.onclick = () => {
      if (direct) check();
      else
        (
          $("ms-answer") ??
          document.querySelector('input[name="ms-choice"]') ??
          $("ms-mission")
        ).focus();
    };
  }

  function render() {
    renderList();
    renderPanel();
    renderStrip();
  }

  return { render, open, count: MISSIONS.length };
}
