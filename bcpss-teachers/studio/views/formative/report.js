// The class report: distribution bars, the dominant misconception card, error tally buttons, the top-3 table and
// the weekly trend table. Pure DOM builders over data the shared modules computed; no fetching here.
import { h } from "../../core/dom.js";
import { LEVELS, LEVEL_LABEL } from "../../../../shared/formative/constants.js";

const students = (n) => `${n} ${n === 1 ? "student" : "students"}`;

/** Bars for one scorer's distribution. Each row says its count and percent in words, so colour is never the only cue. */
export function distributionBars(dist, title) {
  const rows = LEVELS.map((level) => {
    const bar = h("span", { class: "st-fm-bar", "data-level": level });
    bar.style.setProperty("--w", `${dist.percent[level]}%`);
    return h("li", { class: "st-fm-dist-row" },
      h("span", { class: "st-fm-dist-label" }, LEVEL_LABEL[level]),
      h("span", { class: "st-fm-track", "aria-hidden": "true" }, bar),
      h("span", { class: "st-fm-dist-n" }, `${students(dist.counts[level])} (${dist.percent[level]}%)`),
    );
  });
  return h("section", { class: "st-fm-card", "aria-labelledby": `st-fm-dist-${title.id}` },
    h("h3", { id: `st-fm-dist-${title.id}` }, title.text),
    h("ul", { class: "st-fm-dist" }, rows),
    h("p", { class: "st-meta", role: "status" }, `${dist.scored} of ${dist.total} scored${dist.unscored ? `, ${dist.unscored} to go` : ""}.`),
  );
}

/** The dominant misconception with its example, redirect and follow-up activity. */
export function misconceptionCard(dominant, reteach) {
  if (!dominant) return h("section", { class: "st-fm-card" }, h("h3", {}, "Most common misconception"), h("p", {}, "Score a few aliases and the card appears here."));
  if (!dominant.needsReteach)
    return h("section", { class: "st-fm-card" }, h("h3", {}, "Most common misconception"), h("p", {}, "Every scored student is proficient. No reteach needed for this ticket."));
  const { entry } = dominant;
  const basis = dominant.basis === "tallies" ? `Tallied ${dominant.count} ${dominant.count === 1 ? "time" : "times"} by you this unit.` : "This is the unit's own common misconception. Tally what you hear below to refine it.";
  const act = reteach[entry.id];
  return h("section", { class: "st-fm-card st-fm-dominant", "aria-labelledby": "st-fm-dom" },
    h("h3", { id: "st-fm-dom" }, "Most common misconception"),
    h("p", { class: "st-fm-lead" }, entry.label),
    entry.example && entry.example !== entry.label ? h("p", {}, h("strong", {}, "Example: "), entry.example) : null,
    h("p", {}, h("strong", {}, "Redirect: "), entry.redirect),
    act ? h("p", {}, h("strong", {}, "Follow-up activity: "), `${act.title}${act.minutes ? ` (${act.minutes} min)` : ""}`) : null,
    h("p", { class: "st-meta" }, `${students(dominant.struggling)} scored emerging or developing. ${basis}`),
  );
}

/** One +1 and one -1 button per catalog entry: "this many students slipped on this error". */
export function tallyPanel(catalog, onBump) {
  const items = catalog.map((e) =>
    h("li", { class: "st-fm-tally" },
      h("span", { class: "st-fm-tally-text" }, e.label),
      h("button", { class: "st-fm-step", type: "button", "aria-label": `Undo one: ${e.label}`, onclick: () => onBump(e.id, -1) }, "-1"),
      h("button", { class: "st-fm-step", type: "button", "aria-label": `Add one: ${e.label}`, onclick: () => onBump(e.id, 1) }, "+1"),
    ),
  );
  return h("details", { class: "st-fm-card" },
    h("summary", {}, "Tally an error you heard"),
    h("p", { class: "st-meta" }, "One tap adds one student who slipped this way. Counts are for the class, never for a student."),
    h("ul", { class: "st-fm-tallies" }, items),
  );
}

const ARROW = { up: "Up from last week", down: "Down from last week", flat: "Same as last week", new: "New this week" };

/** Top error types with an example and the reteach activity, plus the weekly trend beside each. */
export function topTable(top, trend, reteach) {
  if (!top.length) return h("section", { class: "st-fm-card" }, h("h3", {}, "Top 3 error types"), h("p", {}, "No errors tallied yet for this unit."));
  const weeks = trend.weeks.map((w) => w.slice(5));
  const rows = top.map(({ entry, count, share }, i) => {
    const series = trend.series[i];
    const act = reteach[entry.id];
    return h("tr", {},
      h("th", { scope: "row" }, entry.label),
      h("td", {}, entry.example || ""),
      h("td", {}, `${count} (${share}%)`),
      h("td", {}, act ? act.title : ""),
      h("td", {}, `${series.counts.join(" ")} ${ARROW[series.direction]}`),
    );
  });
  return h("section", { class: "st-fm-card" },
    h("h3", {}, "Top 3 error types"),
    h("div", { class: "st-fm-scroll" },
      h("table", { class: "st-fm-table" },
        h("caption", { class: "st-sr-only" }, `Top error types, with weekly counts for weeks starting ${weeks.join(", ")}`),
        h("thead", {}, h("tr", {}, ["Error", "Example", "Count", "Reteach with", `Weekly counts (${weeks[0]} to ${weeks[weeks.length - 1]})`].map((t) => h("th", { scope: "col" }, t)))),
        h("tbody", {}, rows),
      ),
    ),
  );
}
