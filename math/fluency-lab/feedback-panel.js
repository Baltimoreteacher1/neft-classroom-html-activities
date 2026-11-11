// Draws a feedbackView into the practice screen. All text goes in with textContent, never innerHTML,
// so an answer a learner typed cannot become markup.
const ICON_BY_TONE = new Set(["success", "support", "neutral"]);

const FRAC_TOKEN = /(^|[^\w/])(?:([−-]?\s*\d{1,4})|([a-zA-Z]))\/(?:(\d{1,4})|([a-zA-Z]))(?=[^\w/]|$)/g;

function appendSafeFractionText(container, text) {
  const raw = String(text ?? "");
  let cursor = 0;
  let match;
  FRAC_TOKEN.lastIndex = 0;
  while ((match = FRAC_TOKEN.exec(raw)) !== null) {
    const [full, lead, nDigits, nVar, dDigits, dVar] = match;
    if (nVar && dVar) continue;
    const denText = dDigits || dVar;
    if (!denText || denText === "0") continue;
    const numText = nDigits ? nDigits.replace(/\s+/g, "") : nVar;
    const fracStart = match.index + lead.length;
    if (fracStart > cursor) {
      container.append(document.createTextNode(raw.slice(cursor, fracStart)));
    }
    const wrap = document.createElement("span");
    wrap.className = "v-frac-wrap";
    wrap.setAttribute("role", "math");
    wrap.setAttribute("aria-label", `${numText.replace(/[-−]/g, "negative ")} over ${denText}`);
    const frac = document.createElement("span");
    frac.className = "v-frac";
    const numEl = document.createElement("span");
    numEl.className = "v-num";
    numEl.textContent = numText;
    const denEl = document.createElement("span");
    denEl.className = "v-den";
    denEl.textContent = denText;
    frac.append(numEl, denEl);
    wrap.append(frac);
    container.append(wrap);
    cursor = match.index + full.length;
  }
  if (cursor < raw.length) {
    container.append(document.createTextNode(raw.slice(cursor)));
  }
}

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
    appendSafeFractionText(value, line.value);
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
    button.className = action.id === "try-again" || action.id === "next" ? "primary-action" : "outline-action";
    button.dataset.feedbackAction = action.id;
    if (action.id === "next") button.dataset.gmNext = "";
    button.textContent = action.label;
    els.feedbackActions.append(button);
  }
  els.feedbackActions.hidden = !actions.length;
}
