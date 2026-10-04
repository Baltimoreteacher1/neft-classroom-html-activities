// Lab device readiness and supported-practice controls; not an official test simulation.
import { crumbsHTML, listenPlayerHTML, recorderHTML } from "../components.js";
import { choiceTarget, inputHTML, reduceAnswer } from "../items.js";
import { isRecording } from "../recorder.js";
import { BASE, html, raw } from "../util.js";

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
const state = { answer: undefined, flagged: false, typed: "" };

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
    html: html`${crumbsHTML([
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
      </ol>
      <div class="row-actions">
        <a class="btn btn-primary" href="${BASE}/tests">I'm ready — go to practice tests →</a>
      </div>`,
  };
}
export function onChange(e, ctx) {
  const next = reduceAnswer(SAMPLE, state.answer, e.target);
  if (next !== undefined) {
    state.answer = next;
    ctx.rerender();
  }
}
export function onClick(e, ctx) {
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
}
