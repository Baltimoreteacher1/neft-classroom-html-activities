// Draws a feedbackView into the practice screen. All text goes in with textContent, never innerHTML,
// so an answer a learner typed cannot become markup.
const ICON_BY_TONE = new Set(["success", "support", "neutral"]);

export function paintFeedback(els, view) {
  els.feedback.dataset.tone = ICON_BY_TONE.has(view.tone) ? view.tone : "neutral";
  els.feedback.dataset.phase = view.phase;
  els.feedbackIcon.innerHTML = view.icon;
  els.feedbackBadge.hidden = !view.badge;
  els.feedbackBadge.textContent = view.badge;
  els.feedbackAnswers.replaceChildren();
  for (const line of view.lines) {
    const row = document.createElement("div");
    row.className = "fb-answer-row";
    const label = document.createElement("dt");
    label.textContent = line.label;
    const value = document.createElement("dd");
    value.textContent = line.value;
    row.append(label, value);
    els.feedbackAnswers.append(row);
  }
  els.feedbackAnswers.hidden = !view.lines.length;
  paintActions(els, view.actions);
}

export function paintActions(els, actions) {
  els.feedbackActions.replaceChildren();
  for (const action of actions) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = action.id === "try-again" ? "primary-action" : "outline-action";
    button.dataset.feedbackAction = action.id;
    button.textContent = action.label;
    els.feedbackActions.append(button);
  }
  els.feedbackActions.hidden = !actions.length;
}
