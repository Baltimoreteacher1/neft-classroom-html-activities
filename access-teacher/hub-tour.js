// The Teacher Hub's guided tour (access-teacher/hub-tour.js): three short steps inside /access-teacher/ that end with
// something a teacher can use today. Pick an activity, add supports, share it. Progress is kept under
// accessTeacher:v1:hubTour. It was eight steps until 2026-11-17; Joel: "not overwhelming, clear, easy to do".

import {
  SCAFFOLD_CATALOG,
  composeLessonPathway,
  discoverResources,
} from "/access-practice-lab/src/resource-intelligence.js";
import {
  BASE,
  html,
  icon,
  raw,
  safeJson,
  storage,
} from "/access-practice-lab/src/util.js";
import { savePathwayRecord } from "/access-teacher/command-center.js";

export const HUB_TOUR_KEY = "accessTeacher:v1:hubTour";

export const HUB_TOUR_STEPS = Object.freeze([
  { n: 1, id: "pick", title: "Pick an activity" },
  { n: 2, id: "supports", title: "Add supports" },
  { n: 3, id: "share", title: "Share it" },
]);

export function defaultTourState() {
  return {
    v: 1,
    open: false,
    step: 1,
    furthest: 1,
    completed: false,
    band: "6-8",
    domain: "Speaking",
    support: "B",
    pickedId: "",
    scaffolds: ["visual-vocabulary", "sentence-frames", "audio-directions", "word-bank", "model-response"],
    swappedPracticeId: "",
  };
}

export function loadHubTourState() {
  const rawState = safeJson(storage.get(HUB_TOUR_KEY), null);
  if (!rawState || typeof rawState !== "object" || rawState.v !== 1) return defaultTourState();
  const base = defaultTourState();
  const last = HUB_TOUR_STEPS.length;
  const step = Math.max(1, Math.min(last, Number(rawState.step) || 1));
  const furthest = Math.max(step, Math.min(last, Number(rawState.furthest) || 1));
  return {
    ...base,
    ...rawState,
    step,
    furthest,
    scaffolds: Array.isArray(rawState.scaffolds) ? rawState.scaffolds : base.scaffolds,
  };
}

export function saveHubTourState(patch) {
  const next = { ...loadHubTourState(), ...patch };
  storage.set(HUB_TOUR_KEY, JSON.stringify(next));
  return next;
}

export function assembleStarterKit(registry, state) {
  const matches = discoverResources(registry, {
    band: state.band,
    domain: state.domain,
    support: state.support,
    type: "activity",
    limit: 6,
  }).map((r) => r.item);
  const primary = matches.find((m) => m.id === state.pickedId) || matches[0] || registry[0];
  const pathway = composeLessonPathway(registry, {
    band: state.band,
    domain: state.domain,
    support: state.support,
    minutes: 25,
    needs: state.scaffolds,
  });
  if (state.swappedPracticeId) {
    const alt = registry.find((r) => r.id === state.swappedPracticeId);
    const pracStage = pathway.stages.find((s) => s.stageId === "practice");
    if (alt && pracStage) pracStage.resource = alt;
  }
  const scaffolds = SCAFFOLD_CATALOG.filter((s) => state.scaffolds.includes(s.id));
  const studentUrl = primary ? primary.urlFor(state.band) : `${BASE}/${state.domain}/${state.support}?grades=${state.band}`;
  const familyUrl = primary?.activityId
    ? `${BASE}/family?grades=${state.band}&companion=${encodeURIComponent(primary.activityId)}`
    : `${BASE}/family?grades=${state.band}`;

  return {
    band: state.band,
    domain: state.domain,
    support: state.support,
    primaryActivity: primary,
    studentUrl,
    familyUrl,
    pathway,
    scaffolds,
    formativeCheck: `Ask students to complete "${primary?.title || "the activity"}" and check whether their response uses at least one academic connector or cited detail from the prompt.`,
  };
}

const SUPPORT_CHOICES = [
  ["visual-vocabulary", "Pictures for key words"],
  ["sentence-frames", "Sentence starters"],
  ["audio-directions", "Read aloud"],
  ["word-bank", "Word bank"],
  ["model-response", "An example answer"],
];

export function renderHubTourHTML(registry, state, statusMsg = "") {
  const stepMeta = HUB_TOUR_STEPS[state.step - 1] || HUB_TOUR_STEPS[0];
  const last = HUB_TOUR_STEPS.length;
  const matches = discoverResources(registry, {
    band: state.band,
    domain: state.domain,
    support: state.support,
    type: "activity",
    limit: 3,
  });
  const primary = matches.find((m) => m.item.id === state.pickedId)?.item || matches[0]?.item || registry[0];
  const kit = assembleStarterKit(registry, state);

  let bodyHTML = "";
  if (state.step === 1) {
    bodyHTML = html`<div class="ht-step-body">
      <p>Choose a grade and a skill. Then pick one activity.</p>
      <div class="tc-controls">
        <label class="field">
          <span>Grade</span>
          <select data-ht-field="band">
            ${["K", "1", "2-3", "3-5", "6-8"].map(
              (b) => html`<option value="${b}" ${state.band === b ? raw("selected") : ""}>Grades ${b}</option>`,
            )}
          </select>
        </label>
        <label class="field">
          <span>Skill</span>
          <select data-ht-field="domain">
            ${["Listening", "Speaking", "Reading", "Writing"].map(
              (d) => html`<option value="${d}" ${state.domain === d ? raw("selected") : ""}>${d}</option>`,
            )}
          </select>
        </label>
      </div>
      <ul class="tc-rec-grid">
        ${matches.map(
          ({ item }) => html`<li class="tc-rec-card${primary?.id === item.id ? " is-picked" : ""}">
            <strong>${item.title}</strong>
            ${item.minutes ? html`<span class="fine">About ${item.minutes} minutes</span>` : ""}
            <div class="tc-stage-actions">
              <button
                type="button"
                class="btn small ${primary?.id === item.id ? "btn-primary" : ""}"
                data-ht-pick="${item.id}"
                aria-pressed="${primary?.id === item.id}"
              >
                ${primary?.id === item.id ? "✓ Picked" : "Pick this"}
              </button>
            </div>
          </li>`,
        )}
      </ul>
    </div>`;
  } else if (state.step === 2) {
    const has = (id) => state.scaffolds.includes(id);
    bodyHTML = html`<div class="ht-step-body">
      <p>
        Turn on the help your students need. The activity and its goal stay the same.
        <strong>${primary?.title || ""}</strong>
      </p>
      <div class="tc-stage-actions" role="group" aria-label="Supports">
        ${SUPPORT_CHOICES.map(
          ([id, label]) => html`<button
            type="button"
            class="btn small ${has(id) ? "btn-primary" : ""}"
            data-ht-scaffold="${id}"
            aria-pressed="${has(id)}"
          >
            ${has(id) ? "✓ " : "+ "}${label}
          </button>`,
        )}
      </div>
    </div>`;
  } else {
    bodyHTML = html`<div class="ht-step-body" id="htStarterKit">
      <p class="lead"><strong>Ready to use.</strong> ${kit.primaryActivity?.title || "Your activity"} · Grades ${kit.band} · ${kit.domain}</p>
      <div class="tc-stage-actions">
        <a class="btn btn-primary" href="${kit.studentUrl}" target="_blank" rel="noopener">Open the activity ${icon("external")}</a>
        <button type="button" class="btn" data-ht-copy="${kit.studentUrl}">${icon("copy")} Copy link for students</button>
        <button type="button" class="btn" data-ht-copy="${kit.familyUrl}">${icon("copy")} Copy link for families</button>
        <button type="button" class="btn" data-ht-act="save-kit">${icon("save")} Save to My Resources</button>
      </div>
      <p class="fine">Students start right away from the link. No accounts. Families get the same activity with a short note in English or Spanish.</p>
    </div>`;
  }

  return html`<section class="ht-drawer" aria-labelledby="htStepTitle">
    <header class="ht-top">
      <div>
        <p class="eyebrow">Step ${state.step} of ${last}</p>
        <h3 id="htStepTitle" tabindex="-1">${stepMeta.title}</h3>
      </div>
      <div class="tc-stage-actions">
        <button type="button" class="btn small" data-ht-act="close">Close</button>
      </div>
    </header>

    <ol class="ht-progress" aria-label="Tour steps">
      ${HUB_TOUR_STEPS.map(
        (s) => html`<li class="${s.n === state.step ? "is-now" : s.n <= state.furthest ? "is-done" : ""}">
          <button
            type="button"
            class="ht-step-dot"
            data-ht-goto="${s.n}"
            ${s.n === state.step ? raw('aria-current="step"') : ""}
          >
            <span>${s.n}</span> ${s.title}
          </button>
        </li>`,
      )}
    </ol>

    ${bodyHTML}
    ${statusMsg ? html`<p class="tc-status" role="status">${statusMsg}</p>` : ""}

    <footer class="ht-foot">
      <button type="button" class="btn" data-ht-act="back" ${state.step === 1 ? raw("disabled") : ""}>
        ${icon("arrow-left")} Back
      </button>
      ${
        state.step < last
          ? html`<button type="button" class="btn btn-primary" data-ht-act="next">
              Next: ${HUB_TOUR_STEPS[state.step].title} ${icon("arrow-right")}
            </button>`
          : html`<button type="button" class="btn btn-primary" data-ht-act="close">Done</button>`
      }
    </footer>
  </section>`;
}
