// Lab device readiness and supported-practice controls; not an official test simulation.
// Also home of the EduWonderLab rehearsal settings (high contrast, magnify, line reader, scratchpad)
// that the practice-test runner (views/test.js) reuses. They are this lab's own rehearsal settings and
// never stand in for official WIDA ACCESS accommodations.
import { crumbsHTML, listenPlayerHTML, recorderHTML } from "../components.js";
import { choiceTarget, inputHTML, reduceAnswer } from "../items.js";
import { isRecording } from "../recorder.js";
import { PREFIX } from "../store.js";
import { BASE, announce, html, raw, safeJson, storage } from "../util.js";

// ── EduWonderLab rehearsal settings ───────────────────────────────────────────
const RH_KEY = `${PREFIX}:rehearsal`;
const MAGNIFY = 1.3;
export const REHEARSAL_TOOLS = [
  { id: "contrast", label: "High contrast", help: "Black text on white with bold outlines." },
  { id: "magnify", label: "Magnify", help: "Makes text and buttons larger." },
  { id: "reader", label: "Line reader", help: "Dims the page except a reading band that follows your pointer or keyboard focus." },
  { id: "scratch", label: "Scratchpad", help: "A notes box for your thinking. It is never scored and stays on this device." },
];
export const REHEARSAL_NOTICE =
  "These are EduWonderLab rehearsal settings, not official WIDA ACCESS accommodations. The official test has its own accommodation settings that this rehearsal does not copy. Ask your teacher which supports are in your testing plan.";

/** Saved settings; anything unreadable (blocked storage, old data) falls back to all off. */
export function rehearsalPrefs() {
  const saved = safeJson(storage.get(RH_KEY), {}) || {};
  return Object.fromEntries(REHEARSAL_TOOLS.map((t) => [t.id, saved[t.id] === true]));
}
export function setRehearsalPref(id, on) {
  if (!REHEARSAL_TOOLS.some((t) => t.id === id)) return rehearsalPrefs();
  const next = { ...rehearsalPrefs(), [id]: Boolean(on) };
  storage.set(RH_KEY, JSON.stringify(next));
  return next;
}
export const rehearsalClasses = (p = rehearsalPrefs()) =>
  `rh-scope${p.contrast ? " rh-contrast" : ""}${p.magnify ? " rh-magnify" : ""}`;

/** Toggle row. `compact` keeps the runner short; the full notice is on the intro and the tools page. */
export function rehearsalToolbarHTML({ compact = false } = {}) {
  const p = rehearsalPrefs();
  return html`<section class="rh-tools" aria-label="EduWonderLab rehearsal settings">
    ${compact ? "" : html`<h2>EduWonderLab rehearsal settings</h2>`}
    <div class="rh-row">
      ${REHEARSAL_TOOLS.map(
        (t) =>
          html`<button type="button" class="btn small rh-toggle" data-rh-toggle="${t.id}" aria-pressed="${p[t.id]}" title="${t.help}">
            ${p[t.id] ? html`<span aria-hidden="true">✓ </span>` : ""}${t.label}
          </button>`,
      )}
    </div>
    <p class="fine rh-note">
      ${compact ? "EduWonderLab rehearsal settings — not the official WIDA ACCESS accommodations." : REHEARSAL_NOTICE}
    </p>
    ${p.reader ? raw('<div class="rh-reader" data-rh-reader aria-hidden="true"></div>') : ""}
  </section>`;
}

export function onRehearsalClick(e, ctx) {
  const b = e.target.closest?.("[data-rh-toggle]");
  if (!b) return false;
  const tool = REHEARSAL_TOOLS.find((t) => t.id === b.dataset.rhToggle);
  if (!tool) return false;
  const next = setRehearsalPref(tool.id, !rehearsalPrefs()[tool.id]);
  announce(`${tool.label} ${next[tool.id] ? "on" : "off"}. This is an EduWonderLab rehearsal setting.`);
  ctx.rerender();
  return true;
}

let releaseReader = null;
/** Call from a view's mount: magnifies and wires the line reader. The app resets --lab-scale on every render. */
export function applyRehearsal(ctx) {
  releaseRehearsal();
  if (typeof document === "undefined" || !document.querySelector) return;
  const p = rehearsalPrefs();
  if (p.magnify)
    document.documentElement?.style.setProperty(
      "--lab-scale",
      String(Math.max(Number(ctx?.prefs?.textSize) || 1, MAGNIFY)),
    );
  const band = document.querySelector("[data-rh-reader]");
  if (!p.reader || !band) return;
  const place = (y) => {
    band.style.top = `${Math.max(0, y - band.offsetHeight / 2)}px`;
  };
  const onMove = (e) => place(e.clientY);
  const onFocus = (e) => {
    const r = e.target?.getBoundingClientRect?.();
    if (r) place(r.top + Math.min(r.height, 48) / 2);
  };
  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("focusin", onFocus);
  releaseReader = () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("focusin", onFocus);
  };
}
export function releaseRehearsal() {
  releaseReader?.();
  releaseReader = null;
}

const IGN = raw("data-nsr-ignore");
const SAMPLE = {
  id: "tools-sample",
  type: "multipleChoice",
  options: [
    { id: "a", text: "A pencil", visual: "✏️" },
    { id: "b", text: "A book", visual: "📘" },
    { id: "c", text: "A backpack", visual: "🎒" },
  ],
  answer: "b",
};
const state = { answer: undefined, flagged: false, typed: "", scratch: "" };

export async function render(ctx) {
  const step = (n, title, body) =>
    html`<li class="tool-step">
      <span class="tool-n">${n}</span>
      <div>
        <h2>${title}</h2>
        ${body}
      </div>
    </li>`;
  return {
    title: "Lab tools and device check",
    html: html`<div class="${rehearsalClasses()}">${crumbsHTML([
        ["Lab", `${BASE}/`],
        ["Lab tools", null],
      ])}
      <section class="room-hero">
        <div>
          <h1 tabindex="-1">🧰 Lab tools and device check</h1>
          <p class="lead">
            Try the lab controls and check your headphones before practicing. These are lab practice tools, not an official test simulation.
          </p>
        </div>
      </section>
      <section class="panel"><h2>Prepare for the actual test</h2><p>Replay, slower speech, flagging, and recording here may work differently on ACCESS. Use the <a href="https://wida.wisc.edu/assess/access/preparing-students" target="_blank" rel="noopener">official WIDA preparation resources and test demo (new tab)</a> to learn the real test interface. Follow your teacher’s directions about allowed tools.</p></section>
      <ol class="tool-steps">
        ${step(
          1,
          "Headphones and playback check",
          html`<p>
              Connect your headphones and set a comfortable volume. Press Listen, then Stop audio. Replay and try slower speech. If you hear nothing, check the volume and audio output, then ask your teacher.
            </p>
            ${listenPlayerHTML("tools-listen", ["Point to the book on the table. Then choose the book."], { rate: ctx.prefs.rate })}`,
        )}
        ${step(
          2,
          "Choose an answer",
          html`<p>Click one answer. Click a different one to change your mind.</p>
            ${inputHTML(SAMPLE, state.answer)}${state.answer ? html`<p class="saved-note">${state.answer === "b" ? "✓ You chose the book." : "You can change your answer any time before you submit."}</p>` : ""}`,
        )}
        ${step(
          3,
          "Flag a question",
          html`<p>Not sure? Flag it, and come back to it before you finish.</p>
            <button
              type="button"
              class="flag ${state.flagged ? "is-on" : ""}"
              data-tool-flag
              aria-pressed="${state.flagged}"
            >
              ${state.flagged ? "★ Flagged" : "☆ Flag"}
            </button>`,
        )}
        ${step(
          4,
          "Record your voice",
          html`<p>
              Optional microphone check: press Record, say “The book is on the table,” then press Stop and play it back. Do not say your name or other personal information.
            </p>
            ${recorderHTML("tools-rec", { recording: isRecording("tools-rec") })}
            <p>No microphone, permission denied, or no playback? Practice the sentence aloud with a partner or teacher. You can continue without recording. Recordings disappear when this page closes or reloads; resume codes do not contain audio.</p>`,
        )}
        ${step(
          5,
          "Type an answer",
          html`<p>Type one sentence. Use a capital letter and a period.</p>
            <label for="tool-typing">Practice sentence</label>
            <textarea
              id="tool-typing"
              rows="2"
              data-tool-type
              placeholder="My favorite subject is ___ because ___."
              ${IGN}
            >
${state.typed}</textarea>`,
        )}
        ${step(
          6,
          "Try the rehearsal settings",
          html`<p>
              Practice tests have two modes. <strong>Guided Practice</strong> is untimed and gives hints, answer explanations and retries.
              <strong>Independent Rehearsal</strong> is like test day: each recording plays once, there are no sentence frames or word banks, and you review each section before you submit.
            </p>
            <p>Turn these on to try them. Your choices are saved on this device and also apply in practice tests.</p>
            ${rehearsalToolbarHTML()}
            <ul class="fine">
              ${REHEARSAL_TOOLS.map((t) => html`<li><strong>${t.label}:</strong> ${t.help}</li>`)}
            </ul>
            ${
              rehearsalPrefs().scratch
                ? html`<label class="field rh-scratch"
                    ><span>Scratchpad (EduWonderLab rehearsal setting, never scored)</span
                    ><textarea rows="3" data-tool-scratch ${IGN}>${state.scratch}</textarea></label
                  >`
                : ""
            }`,
        )}
        ${step(
          7,
          "Teacher Hub & Differentiated Instructional Grouping",
          html`<p>Actionable language development tools for educators. Analyze evidence, plan small-group interventions, and access printable materials.</p>
            <div class="card teacher-grouping-card">
              <h3>Targeted Language Interventions</h3>
              <ul>
                <li><strong>Group A (Discourse & Cohesion):</strong> Focus on cause-and-effect transitions (<em>because, consequently, therefore</em>) and multi-paragraph structures. Use the <a href="${BASE}/construction">Language Construction Lab</a>.</li>
                <li><strong>Group B (Evidence & Scientific Claims):</strong> Focus on data interpretation and citing specific textual evidence. Use the <a href="${BASE}/evidence">Evidence Studio</a>.</li>
                <li><strong>Group C (Oral Fluency & Discourse):</strong> Focus on academic dialogue turn-taking and spoken elaboration. Use the <a href="${BASE}/conversation">Conversation Simulator</a>.</li>
                <li><strong>Group D (Vocabulary & Morphology):</strong> Focus on Greek and Latin roots, prefixes, and suffixes. Use <a href="${BASE}/vocabulary">Word Builder</a>.</li>
                <li><strong>Whole-Class Modeling:</strong> Projector routines for listening, evidence reading, and sequence reconstruction. Use the <a href="${BASE}/classroom">Whole-Class Studio</a>.</li>
              </ul>
              <div class="row-actions">
                <a class="btn ghost small" href="${BASE}/launch-studio">Open Teacher Launch Studio →</a>
                <a class="btn ghost small" href="${BASE}/classroom">Open Whole-Class Studio →</a>
                <a class="btn ghost small" href="/access-teacher/">Open Full Teacher Dashboard →</a>
                <a class="btn ghost small" href="${BASE}/passport?portfolio=1">View Student Practice Portfolios →</a>
              </div>
            </div>`,
        )}
      </ol>
      <div class="row-actions">
        <a class="btn btn-primary" href="${BASE}/tests">I'm ready — go to practice tests →</a>
      </div></div>`,
  };
}
export function onChange(e, ctx) {
  const next = reduceAnswer(SAMPLE, state.answer, e.target);
  if (next !== undefined) {
    state.answer = next;
    ctx.rerender();
  }
}
export function mount(_root, ctx) {
  applyRehearsal(ctx);
}
export function unmount() {
  releaseRehearsal();
}
export function onClick(e, ctx) {
  if (onRehearsalClick(e, ctx)) return true;
  const choice = choiceTarget(e);
  if (choice) {
    state.answer = reduceAnswer(SAMPLE, state.answer, choice);
    ctx.rerender();
    return true;
  }
  if (e.target.closest("[data-tool-flag]")) {
    state.flagged = !state.flagged;
    ctx.rerender();
  }
}
export function onInput(e) {
  if (e.target.matches("[data-tool-type]")) state.typed = e.target.value;
  if (e.target.matches("[data-tool-scratch]")) state.scratch = e.target.value;
}
