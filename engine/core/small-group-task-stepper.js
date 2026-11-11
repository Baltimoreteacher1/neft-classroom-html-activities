// One meaningful task at a time. Wraps a list of cards in a stepper: a single card is
// visible, a numbered rail shows where the student is and what is done, and the
// forward button becomes the obvious next action once the current task is answered.
// Cards stay in the DOM (hidden, not removed) so restore, tallies and print keep
// working; the current index is saved so a reload resumes on the same task.

import { el } from "./small-group-ui.js";

const answered = (card) =>
  card.classList.contains("is-right") ||
  card.classList.contains("is-shown") ||
  card.classList.contains("is-done");

/**
 * @param {HTMLElement[]} cards
 * @param {{store?: any, key: string, noun?: string}} opts
 */
export function taskStepper(cards, { store, key, noun = "Problem" }) {
  const root = el("div", "sg-stepper");
  if (cards.length < 2) {
    for (const c of cards) root.appendChild(c);
    return root;
  }
  const rail = el("ol", "sg-trail");
  rail.setAttribute("aria-label", `${noun}s`);
  const stage = el("div", "sg-stage");
  const nav = el("div", "sg-stepnav");
  const prev = /** @type {HTMLButtonElement} */ (el("button", "btn ghost", "← Back"));
  const next = /** @type {HTMLButtonElement} */ (el("button", "btn", ""));
  prev.type = next.type = "button";
  nav.append(prev, next);

  const wraps = cards.map((card) => {
    const w = el("div", "sg-task");
    w.appendChild(card);
    stage.appendChild(w);
    return w;
  });
  const dots = cards.map((_, i) => {
    const li = el("li", "sg-trail-item");
    const b = /** @type {HTMLButtonElement} */ (el("button", "sg-trail-dot", String(i + 1)));
    b.type = "button";
    b.addEventListener("click", () => show(i));
    li.appendChild(b);
    rail.appendChild(li);
    return b;
  });

  const saved = Number(store?.get(`${key}-i`));
  let at = Number.isInteger(saved) && saved >= 0 && saved < cards.length ? saved : 0;
  const refresh = () => {
    wraps.forEach((w, i) => {
      w.hidden = i !== at;
    });
    dots.forEach((b, i) => {
      const done = answered(cards[i]);
      b.classList.toggle("is-done", done);
      b.classList.toggle("is-here", i === at);
      b.setAttribute("aria-current", i === at ? "step" : "false");
      b.setAttribute(
        "aria-label",
        `${noun} ${i + 1} of ${cards.length}${done ? ", answered" : ""}`,
      );
    });
    prev.disabled = at === 0;
    const last = at === cards.length - 1;
    next.hidden = last && !answered(cards[at]) ? false : false;
    next.textContent = last ? "Last one — review ✓" : `Next ${noun.toLowerCase()} →`;
    next.disabled = last;
    next.classList.toggle("is-primary", answered(cards[at]) && !last);
    next.classList.toggle("ghost", !(answered(cards[at]) && !last));
  };
  function show(i) {
    at = Math.max(0, Math.min(cards.length - 1, i));
    store?.set(`${key}-i`, at);
    refresh();
  }
  prev.addEventListener("click", () => show(at - 1));
  next.addEventListener("click", () => {
    show(at + 1);
    wraps[at].querySelector("h3")?.scrollIntoView?.({ block: "nearest" });
  });
  // Cards flip their own class when answered; mirror it onto the rail and the CTA.
  // (Headless render harnesses have no MutationObserver; the rail then refreshes on navigation.)
  if (typeof MutationObserver !== "undefined") {
    const watch = new MutationObserver(refresh);
    for (const card of cards) watch.observe(card, { attributes: true, attributeFilter: ["class"] });
  }

  root.append(rail, stage, nav);
  refresh();
  return root;
}

export const STEPPER_CSS = `
.sg-stepper{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
.sg-stage,.sg-task{min-width:0}
.sg-trail{display:flex;gap:8px;list-style:none;margin:0;padding:0;flex-wrap:wrap}
.sg-trail-dot{width:44px;height:44px;border-radius:50%;border:2px solid var(--sg-line);background:#fff;color:var(--sg-deep);font:800 16px var(--sg-display,inherit);cursor:pointer}
.sg-trail-dot.is-here{border-color:var(--sg-deep);background:var(--sg-deep);color:#fff}
.sg-trail-dot.is-done:not(.is-here){border-color:var(--sg-good);background:var(--sg-good-bg);color:var(--sg-good-ink)}
.sg-trail-dot:focus-visible{outline:3px solid #1f5fd6;outline-offset:2px}
.sg-task[hidden]{display:none!important}
.sg-stepnav{display:flex;gap:10px;justify-content:space-between;flex-wrap:wrap}
.sg-stepnav .btn.is-primary{box-shadow:0 0 0 4px #1f5fd62e}
@media print{.sg-task[hidden]{display:block!important}.sg-trail,.sg-stepnav{display:none!important}}
`;
