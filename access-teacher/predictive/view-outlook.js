// Outlook and Practice next: two cards on a student's overview. Outlook shows a validated forecast range, the
// WIDA MODEL-to-ACCESS estimate, or goal math, each labelled for what it is. Practice next links straight to
// Language Page activities chosen for the student's lowest domains, level and grade band.
import { h } from "./dom.js";
import { goalMath, outlookFor } from "./outlook.js";
import { bandForGrade, practicePlan } from "./practice.js";
import { recordsOf } from "./records.js";

const f1 = (x) => (x == null ? "—" : Number(x).toFixed(1));
const yearsAhead = (y, n) =>
  Array.from({ length: n }, (_, i) => {
    const a = Number(y.slice(0, 4)) + i + 1;
    return `${a}-${String((a + 1) % 100).padStart(2, "0")}`;
  });

function goalEditor(ws, st, o) {
  if (!o.access) return null;
  const goal = h(
    "select",
    { "aria-label": "Goal level", "data-goal-level": "" },
    [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6].map((g) =>
      h("option", { value: g, selected: g === o.goal }, g.toFixed(1)),
    ),
  );
  const by = h(
    "select",
    { "aria-label": "By school year", "data-goal-by": "" },
    yearsAhead(o.access.academicYear, 4).map((y) =>
      h("option", { value: y, selected: y === o.byYear }, y),
    ),
  );
  const save = () => {
    ws.state.goalsMath = {
      ...(ws.state.goalsMath || {}),
      [st.id]: { goal: Number(goal.value), by: by.value },
    };
    ws.save();
    ws.rerender();
  };
  goal.addEventListener("change", save);
  by.addEventListener("change", save);
  return h("p", { class: "pi-goalpick" }, "Goal: Overall ", goal, " by ", by);
}

export function outlookCard(ws, st) {
  const o = outlookFor(ws, st);
  const m = o.math;
  const lines = [];
  if (o.forecast)
    lines.push(
      h(
        "div",
        { class: "pi-ol is-validated", "data-outlook": "forecast" },
        h("span", { class: "pi-ol-tag" }, "Validated forecast"),
        h(
          "strong",
          {},
          `${f1(o.forecast.numbers.interval80[0])} to ${f1(o.forecast.numbers.interval80[1])}`,
        ),
        h(
          "span",
          {},
          `likely Overall range for ${o.forecast.targetYear} (about 8 in 10 students land inside a range like this)`,
        ),
      ),
    );
  if (o.concordance)
    lines.push(
      h(
        "div",
        { class: "pi-ol is-validated", "data-outlook": "concordance" },
        h("span", { class: "pi-ol-tag" }, "WIDA MODEL estimate"),
        h(
          "strong",
          {},
          `${f1(o.concordance.estimate.range.lo)} to ${f1(o.concordance.estimate.range.hi)}`,
        ),
        h("span", {}, "likely ACCESS Overall if tested the same day as MODEL"),
      ),
    );
  if (m)
    lines.push(
      h(
        "div",
        { class: "pi-ol is-math", "data-outlook": "goal" },
        h("span", { class: "pi-ol-tag" }, "Goal math"),
        h("strong", {}, m.reached ? "Goal already met" : `+${m.perYear.toFixed(2)} a year`),
        h(
          "span",
          {},
          m.reached
            ? "Choose a higher goal to plan the next step."
            : `to move from ${f1(o.access.composites.Overall.level)} to ${f1(o.goal)} by ${o.byYear} (${m.years} year${m.years === 1 ? "" : "s"}). Arithmetic, not a prediction.${m.crossesChange ? " ACCESS changed in 2025-26, so treat this as a rough guide." : ""}`,
        ),
      ),
    );
  return h(
    "article",
    { class: "pi-card pi-outlook", "aria-labelledby": "piOutlookT" },
    h("h3", { id: "piOutlookT" }, "Outlook"),
    lines.length
      ? h("div", { class: "pi-ols" }, lines)
      : h("p", { class: "fine" }, "Add an ACCESS result to see an outlook."),
    !o.forecast && o.access
      ? h("p", { class: "fine" }, `No forecast number: ${o.forecastWhy}`)
      : null,
    goalEditor(ws, st, o),
  );
}

export function practiceCard(ws, st) {
  const rec = recordsOf(st).at(-1);
  const plan = practicePlan(rec);
  if (!plan.length) return null;
  const band = bandForGrade(rec.grade);
  const link = `${location.origin}/access-practice-lab/?grades=${band}`;
  return h(
    "article",
    { class: "pi-card pi-practice", "aria-labelledby": "piPracticeT" },
    h("h3", { id: "piPracticeT" }, "Practice next on The Language Page"),
    h(
      "div",
      { class: "pi-practice-cols" },
      plan.map((p) =>
        h(
          "section",
          { class: "pi-practice-col", "data-practice": p.domain },
          h(
            "h4",
            {},
            p.domain === "Vocabulary"
              ? "Words"
              : p.level != null
                ? `${p.domain} (${f1(p.level)})`
                : p.domain,
          ),
          h(
            "ul",
            {},
            p.activities.map((a) =>
              h(
                "li",
                {},
                h("a", { href: a.href, "data-activity": a.id }, a.title),
                h("span", { class: "fine" }, ` ${a.why}`),
              ),
            ),
          ),
        ),
      ),
    ),
    h(
      "p",
      { class: "pi-row" },
      h(
        "button",
        { type: "button", class: "btn small", on: { click: () => ws.go("planner") } },
        "Make an assignment",
      ),
      h(
        "button",
        {
          type: "button",
          class: "btn small ghost",
          on: {
            click: () =>
              navigator.clipboard?.writeText(link).then(() => ws.announce("Student link copied.")),
          },
        },
        `Copy the grade ${band} student link`,
      ),
    ),
  );
}

export { goalMath };
