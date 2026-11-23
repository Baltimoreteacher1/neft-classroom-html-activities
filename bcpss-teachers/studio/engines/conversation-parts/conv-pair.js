// conversation-studio: the projector pair view and the printable feedback sheet. No timers, no names.
import { h } from "../../core/dom.js";
import { btn } from "../e4-kit.js";
import { moveSupportItem, pairLabels, planLabels, speechOpts } from "./conv-logic.js";

/** One large card per turn for two partners at a projector. */
export function pairView(env, { onClose }) {
  const { ctx, activity } = env;
  const purpose = env.purposeOrFirst();
  const turns = purpose.rehearsal.turns;
  let i = 0;
  let swapped = false;
  const head = h("h2", { class: "st-cv-h", "data-focus": "" }, "Partner talk");
  const host = h("div", { class: "st-cv-pair-card", role: "group", "aria-label": "Current turn" });
  const count = h("p", { class: "st-cv-count", role: "status", "aria-live": "polite" });
  const prev = btn("Previous", "", () => go(i - 1));
  const next = btn("Next", "primary", () => go(i + 1));

  function card() {
    const t = turns[i];
    const who = pairLabels(activity.roles, swapped)[t.speaker];
    if (t.speaker === "partner") {
      return [
        h("h3", { class: "st-cv-pair-who" }, `${who} says`),
        h("p", { class: "st-cv-pair-say" }, t.say),
        t.note ? h("p", { class: "st-note" }, h("strong", {}, "Listen for: "), t.note) : null,
        btn("Listen", "st-btn-quiet", () => ctx.speak(t.say, speechOpts(activity, t))),
      ];
    }
    const move = env.moveById(t.moveId);
    return [
      h("h3", { class: "st-cv-pair-who" }, `${who} speaks`),
      h("p", { class: "st-cv-pair-say" }, t.prompt),
      h("p", { class: "st-note" }, h("strong", {}, `${move.label}: `), move.function),
      ctx.supportPanel(moveSupportItem(move)).el,
    ];
  }
  function go(n) {
    i = Math.max(0, Math.min(turns.length - 1, n));
    host.replaceChildren(...card().filter(Boolean));
    count.textContent = `Turn ${i + 1} of ${turns.length}.`;
    prev.disabled = i === 0;
    next.disabled = i === turns.length - 1;
  }
  const swap = btn("Swap roles", "", () => {
    swapped = !swapped;
    swap.setAttribute("aria-pressed", String(swapped));
    go(i);
    ctx.announce(`Roles swapped. ${pairLabels(activity.roles, swapped).you} speaks first.`);
  });
  swap.setAttribute("aria-pressed", "false");
  go(0);
  const el = h(
    "section",
    { class: "st-cv-step st-cv-pair", "aria-label": "Pair view" },
    head,
    h(
      "p",
      { class: "st-intro" },
      `${activity.roles[0].label}: ${activity.roles[0].job} ${activity.roles[1].label}: ${activity.roles[1].job}`,
    ),
    host,
    count,
    h(
      "div",
      { class: "st-e4-actions" },
      prev,
      next,
      swap,
      onClose ? btn("Back to my steps", "st-btn-quiet", onClose) : null,
    ),
  );
  return { el, focus: () => head.focus() };
}

/** Printable feedback sheet: rubric rows with blank score circles, success criteria, the plan the learner built. */
export function sheetView(env, { onClose }) {
  const { activity, st } = env;
  const purpose = st.purposeId ? env.purpose() : null;
  const head = h("h2", { class: "st-cv-h", "data-focus": "" }, "Feedback sheet");
  const circles = (levels) =>
    h(
      "span",
      { class: "st-cv-circles", "aria-hidden": "true" },
      levels.map((l) => h("span", { class: "st-cv-circle" }, String(l.score))),
    );
  const rows = activity.rubric.criteria.map((c) =>
    h(
      "tr",
      {},
      h("th", { scope: "row" }, c.label),
      c.levels.map((l) => h("td", {}, h("strong", {}, `${l.score}. `), l.descriptor)),
      h("td", { class: "st-cv-score" }, circles(c.levels)),
    ),
  );
  const levelCount = Math.max(...activity.rubric.criteria.map((c) => c.levels.length));
  const table = h(
    "table",
    { class: "st-cv-rubric" },
    h("caption", {}, "Teacher or partner feedback. Circle one score in each row."),
    h(
      "thead",
      {},
      h(
        "tr",
        {},
        h("th", { scope: "col" }, "Criterion"),
        Array.from({ length: levelCount }, (_, k) => h("th", { scope: "col" }, `Level ${k + 1}`)),
        h("th", { scope: "col" }, "Score"),
      ),
    ),
    h("tbody", {}, rows),
  );
  const plan = purpose && st.order?.length ? planLabels(st.order, activity.moves) : null;
  const line = (label) =>
    h("p", { class: "st-cv-line" }, `${label} `, h("span", { class: "st-cv-blank" }));
  const el = h(
    "section",
    { class: "st-cv-step st-cv-sheet", "aria-label": "Feedback sheet" },
    head,
    h(
      "p",
      { class: "st-note st-cv-noprint" },
      "Print this sheet for a partner or teacher. It has blank lines for pen. Nothing here has a name in it.",
    ),
    h("h3", {}, activity.title),
    line("Speaker:"),
    line("Partner:"),
    h("h3", {}, "I can"),
    h(
      "ul",
      { class: "st-cv-criteria" },
      activity.successCriteria.map((c) =>
        h("li", {}, h("span", { class: "st-cv-box", "aria-hidden": "true" }), c.label),
      ),
    ),
    plan
      ? h(
          "div",
          {},
          h("h3", {}, "The plan I built"),
          h(
            "ol",
            {},
            plan.map((p) => h("li", {}, p)),
          ),
        )
      : null,
    table,
    h("h3", {}, "Comments"),
    line(""),
    line(""),
    line(""),
    h(
      "div",
      { class: "st-e4-actions st-cv-noprint" },
      btn("Print", "primary", () => window.print()),
      btn("Back", "st-btn-quiet", onClose),
    ),
  );
  return { el, focus: () => head.focus() };
}
