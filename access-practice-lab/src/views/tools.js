// Test tools warm-up: try every control used on the practice tests (and the
// real test) before test day — listen/replay, choose, flag, record, type.
import { crumbsHTML, listenPlayerHTML, recorderHTML } from "../components.js";
import { inputHTML, reduceAnswer } from "../items.js";
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
    title: "Test tools warm-up",
    html: html`${crumbsHTML([
        ["Lab", `${BASE}/`],
        ["Test tools", null],
      ])}
      <section class="room-hero">
        <div>
          <h1 tabindex="-1">🖱️ Test tools warm-up</h1>
          <p class="lead">
            Try each tool once. On test day, you will already know what every button does.
          </p>
        </div>
      </section>
      <ol class="tool-steps">
        ${step(
          1,
          "Listen and listen again",
          html`<p>
              Press the button. Then press it again to hear it one more time. Try the slower speed
              too.
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
              Press Record, say your name and your favorite food, then press Stop and play it back.
            </p>
            ${recorderHTML("tools-rec", { recording: isRecording("tools-rec") })}`,
        )}
        ${step(
          5,
          "Type an answer",
          html`<p>Type one sentence. Use a capital letter and a period.</p>
            <textarea
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
  if (e.target.closest("[data-tool-flag]")) {
    state.flagged = !state.flagged;
    ctx.rerender();
  }
}
export function onInput(e) {
  if (e.target.matches("[data-tool-type]")) state.typed = e.target.value;
}
