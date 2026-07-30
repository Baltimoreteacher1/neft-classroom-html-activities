// small-group-reasoning.js — put a reader on the writing.
//
// The studio's written-response boxes collected the richest thinking in the
// product and nothing ever read them. Not a teacher — there is one of them and
// thirty students — and not the engine, because isRight() is a string matcher and
// reasoning is not a string match. So the sections that mattered most were the
// only ones with no feedback loop at all.
//
// This mounts a "Read my reasoning" control under a written response. It is
// opt-in per press: nothing is sent while a student types, and nothing is sent
// unless they ask for it. What comes back is one named gap and one question —
// never a score, never the answer.
//
// It also forwards the misconception the deterministic detector already named
// from the student's numeric work (see misconceptions.js), which is
// what keeps the coaching pointed at the error the student actually made instead
// of one the model invented.

import { el, esc } from "./small-group-ui.js";

const ENDPOINT = "/api/reasoning/review";

/**
 * @param {HTMLTextAreaElement} textarea  the response field to read
 * @param {object} options
 * @param {string} options.prompt         what the student was asked
 * @param {string} [options.standard]
 * @param {string} [options.answerShown]  the item's answer, used ONLY as a
 *   client-side guard: if coaching contains it, the coaching is suppressed.
 * @param {()=>string|null} [options.misconception] current named misconception
 * @returns {HTMLElement}
 */
export function mountReasoningReader(textarea, options = {}) {
  const wrap = el("div", "sg-reasoning");
  const row = el("div", "sg-reasoning-row");
  const button = el("button", "sg-reasoning-btn", "🧠 Read my reasoning");
  button.type = "button";
  const status = el("p", "sg-reasoning-status");
  status.setAttribute("aria-live", "polite");
  const output = el("div", "sg-reasoning-out");
  output.hidden = true;
  row.append(button, status);
  wrap.append(row, output);

  const show = (review) => {
    output.hidden = false;
    output.innerHTML = "";
    if (review.strengths) {
      output.appendChild(
        el("p", "sg-reasoning-good", `<b>What is working:</b> ${esc(review.strengths)}`),
      );
    }
    if (review.gap) {
      output.appendChild(
        el("p", "sg-reasoning-gap", `<b>The missing link:</b> ${esc(review.gap)}`),
      );
    }
    output.appendChild(
      el("p", "sg-reasoning-q", `<b>Answer this in your writing:</b> ${esc(review.question)}`),
    );
    // Said plainly, because a student should know what did and did not happen.
    output.appendChild(
      el("p", "sg-reasoning-note", "This is coaching on your explanation. It is not a grade."),
    );
  };

  button.onclick = async () => {
    const response = textarea.value.trim();
    if (!response) {
      status.textContent = "Write your thinking first, then I can read it.";
      return;
    }
    button.disabled = true;
    status.textContent = "Reading…";
    try {
      const request = await fetch(ENDPOINT, {
        method: "POST",
        credentials: "omit",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: options.prompt || "Explain your reasoning.",
          standard: options.standard || "",
          response,
          answerShown: options.answerShown || "",
          misconception: options.misconception?.() || "",
        }),
      });
      const data = request.ok ? await request.json() : null;
      if (!data?.ok) {
        // A missing reader is a supported state, not an error a student should
        // have to interpret.
        status.textContent = "The reader is not available right now — your writing is still saved.";
        button.disabled = false;
        return;
      }
      status.textContent = "";
      show(data);
      button.textContent = "🧠 Read it again";
    } catch {
      status.textContent = "The reader is not available right now — your writing is still saved.";
    }
    button.disabled = false;
  };

  return wrap;
}

export default mountReasoningReader;
