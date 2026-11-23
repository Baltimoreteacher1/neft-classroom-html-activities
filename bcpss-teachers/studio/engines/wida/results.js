// Review and results screens: a calm digital response environment in original design.
import { announce, h } from "../../core/dom.js";
import { encodeCode } from "../../core/evidence.js";
import { DISCLAIMER, answerText, indicatorLine, isScored, scoreTask } from "./check.js";
import { feedbackSheet } from "./rubric.js";
import { copyText, printNodes } from "./ui.js";

const STATUS_TEXT = { done: "Answered", started: "Started", none: "Not answered yet" };

export function renderReview(app) {
  const { collection, S } = app;
  const unanswered = collection.tasks.filter((t) => S.status(t) !== "done");
  const flagged = collection.tasks.filter((t) => S.st.flags[t.id]);
  const list = h("ol", { class: "st-wida-review", "aria-label": "Tasks" });
  collection.tasks.forEach((t, i) => {
    const st = S.status(t);
    list.append(
      h(
        "li",
        { class: "st-wida-reviewrow", "data-status": st },
        h("div", {}, h("strong", {}, `${i + 1}. ${t.title}`), h("p", { class: "st-wida-quiet" }, STATUS_TEXT[st], S.st.flags[t.id] ? ". Flagged for later" : "")),
        h("button", { type: "button", class: "st-btn", "aria-label": `Go to task ${i + 1}: ${t.title}`, onclick: () => app.goTask(i) }, st === "done" ? "Look again" : "Go to task"),
      ),
    );
  });
  const independent = S.st.mode === "independent";
  app.stage.replaceChildren(
    h(
      "section",
      { class: "st-wida-screen", "aria-labelledby": "st-wida-review-h" },
      h("h3", { id: "st-wida-review-h", tabindex: "-1" }, "Review your practice"),
      h("p", {}, `${collection.tasks.length - unanswered.length} of ${collection.tasks.length} tasks answered${flagged.length ? `, ${flagged.length} flagged for later` : ""}.`),
      unanswered.length ? h("p", { class: "st-wida-quiet" }, "You can go back to any task, or submit now. Nothing is graded and nothing has a time limit.") : h("p", { class: "st-wida-quiet" }, "Every task has an answer. Submit when you are ready."),
      list,
      h("p", { class: "st-wida-quiet" }, independent ? "In independent practice you will see which answers match, and why, after you submit." : "Submitting shows your results and the explanations."),
      h("div", { class: "st-row" }, h("button", { type: "button", class: "st-btn", onclick: () => app.goTask(app.firstUnanswered() ?? 0) }, unanswered.length ? "Go to the first unanswered task" : "Back to the tasks"), h("button", { type: "button", class: "st-btn st-primary", onclick: app.submit }, "Submit practice")),
      h("p", { class: "st-wida-disclaimer" }, DISCLAIMER),
    ),
  );
  app.focusHeading("st-wida-review-h");
}

function taskResult(app, t) {
  const { S } = app;
  const sc = scoreTask(t, S.answer(t.id));
  const line = indicatorLine(sc);
  const head = h("h4", {}, t.title);
  const body = [];
  if (isScored(t)) {
    body.push(h("p", { class: "st-wida-indicator" }, sc.answered ? line : "Not answered."));
    if (sc.answered) body.push(h("p", {}, h("strong", {}, "Answer: "), answerText(t)));
    body.push(h("p", { class: "st-wida-quiet" }, t.explain));
  } else {
    const done = S.status(t) === "done";
    body.push(h("p", { class: "st-wida-indicator" }, done ? "Completed. This task has no score." : "Not completed."));
    body.push(h("p", { class: "st-wida-quiet" }, t.type.startsWith("speak") ? "Ask a partner or your teacher for feedback on your talk." : "Share your writing with a partner or your teacher for feedback."));
  }
  const asked = S.st.hints[t.id] || 0;
  if (asked) body.push(h("p", { class: "st-wida-quiet" }, `Hints or supports used on this task: ${asked}.`));
  return h("li", { class: "st-wida-result" }, head, ...body);
}

export function renderResults(app, attempt) {
  const { collection, S, ctx } = app;
  const writing = collection.tasks.filter((t) => t.type.startsWith("write"));
  const code = ctx.mode === "student" && attempt ? encodeCode({ ...attempt, t: new Date().toISOString() }) : null;
  const rubricState = S.st.rubric;
  const sheet = collection.domain === "Speaking" || collection.domain === "Writing" ? feedbackSheet(collection, rubricState, S.saveSoon) : null;
  const status = h("p", { class: "st-wida-quiet", role: "status", "aria-live": "polite" });

  const actions = [h("button", { type: "button", class: "st-btn", onclick: () => app.goReview() }, "Back to review"), h("button", { type: "button", class: "st-btn", onclick: app.practiceAgain }, "Practice again")];
  if (writing.length) {
    const text = () => writing.map((t) => `${t.title}\n${S.answer(t.id).rev?.draft2 || S.answer(t.id).text || ""}`).join("\n\n");
    actions.push(
      h("button", { type: "button", class: "st-btn", onclick: async () => { status.textContent = (await copyText(text())) ? "Writing copied." : "Could not copy."; announce(status.textContent); } }, "Copy my writing"),
      h("button", { type: "button", class: "st-btn", onclick: () => printNodes(collection.title, writing.map((t) => h("div", {}, h("h2", {}, t.title), h("p", { class: "st-wida-printtext" }, S.answer(t.id).rev?.draft2 || S.answer(t.id).text || "(no writing)")))) }, "Print my writing"),
    );
  }
  const independent = collection.tasks.reduce((n, t) => n + (S.st.taskMode[t.id] === "independent" ? 1 : 0), 0);
  const asked = Object.values(S.st.hints).reduce((a, b) => a + b, 0);
  const next = [];
  if (collection.domain === "Listening" || collection.domain === "Reading") next.push("Look at the tasks marked with fewer correct answers. Go back to the audio or text and find the words that decide the answer.");
  next.push(independent ? "Try the same collection with supports on, then again without them, and notice which supports you reached for." : "When you feel ready, try this collection again in independent practice.");
  app.stage.replaceChildren(
    h(
      "section",
      { class: "st-wida-screen st-finish", "aria-labelledby": "st-wida-done-h" },
      h("h3", { id: "st-wida-done-h", tabindex: "-1" }, "Practice complete"),
      h("p", { class: "st-wida-banner" }, DISCLAIMER),
      h("p", { class: "st-wida-quiet" }, `${independent ? `${independent} ${independent === 1 ? "task" : "tasks"} done in independent practice. ` : ""}${asked ? `Hints or supports used: ${asked}.` : "No hints or supports were used."}`),
      h("ol", { class: "st-wida-results" }, collection.tasks.map((t) => taskResult(app, t))),
      h("section", { class: "st-wida-next" }, h("h4", {}, "What to do next"), h("ul", {}, next.map((n) => h("li", {}, n)))),
      sheet,
      code
        ? h("section", { class: "st-wida-code" }, h("h4", {}, "Evidence code for your teacher"), h("p", { class: "st-wida-quiet" }, "This code has no names and no writing in it. Your teacher can paste it into Class Evidence."), h("textarea", { class: "st-textarea", readonly: "", rows: "3", "aria-label": "Evidence code" }, code), h("button", { type: "button", class: "st-btn", onclick: async () => { status.textContent = (await copyText(code)) ? "Code copied." : "Could not copy. Select the code and copy it by hand."; } }, "Copy code"))
        : null,
      h("div", { class: "st-row" }, ...actions),
      status,
      h("p", { class: "st-wida-disclaimer" }, DISCLAIMER),
    ),
  );
  app.focusHeading("st-wida-done-h");
}
