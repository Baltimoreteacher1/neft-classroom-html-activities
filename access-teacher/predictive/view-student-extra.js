// Two more views of one student: Practice activity (how they use The Language Page: weekly practice by domain,
// on-their-own share, skill accuracy) and the student-facing "My English growth" page (level ladder, can-do
// statements, goals, next practice), printable for conferences.
import { activityColumns, DOMAIN_COLORS, independenceBars } from "./charts2.js";
import { h, pct, table } from "./dom.js";
import { levelName, LEVEL_NAMES } from "./interpret.js";
import { hrefOf, RESOURCES, titleOf } from "./planner.js";
import { recordsOf } from "./records.js";
import { DOMAINS } from "./rules.js";
import { independenceByDomain, usageSummary, weeklyActivity } from "./usage.js";
import { explain } from "./view-common.js";

export function practicePanel(ws, st) {
  const entries = st.entries || [];
  const use = usageSummary(entries);
  if (!use.total)
    return h(
      "p",
      { class: "pi-note" },
      `${st.name} has no practice on The Language Page yet. When students practice, their activity appears here (it stays on this device).`,
    );
  const ev = ws.evidence(st);
  return h(
    "div",
    { class: "pi-stack" },
    h(
      "div",
      { class: "pi-kpis" },
      h(
        "div",
        { class: "pi-kpi" },
        h("span", { class: "pi-kpi-label" }, "Activities"),
        h("strong", { class: "pi-kpi-value" }, String(use.total)),
      ),
      h(
        "div",
        { class: "pi-kpi" },
        h("span", { class: "pi-kpi-label" }, "Active weeks"),
        h("strong", { class: "pi-kpi-value" }, String(use.weeks)),
      ),
      h(
        "div",
        { class: "pi-kpi" },
        h("span", { class: "pi-kpi-label" }, "On their own"),
        h("strong", { class: "pi-kpi-value" }, pct(use.independentShare)),
      ),
      h(
        "div",
        { class: "pi-kpi" },
        h("span", { class: "pi-kpi-label" }, "Last practice"),
        h("strong", { class: "pi-kpi-value" }, use.last ? use.last.toLocaleDateString() : "—"),
      ),
    ),
    h(
      "section",
      { class: "pi-card" },
      h("h3", {}, "Practice per week"),
      activityColumns({
        title: `${st.name}: practice per week by domain`,
        weeks: weeklyActivity(entries),
        domains: DOMAINS,
      }),
    ),
    h(
      "section",
      { class: "pi-card" },
      h("h3", {}, "From support to independence"),
      independenceBars({
        title: `${st.name}: share of practice done without supports`,
        rows: independenceByDomain(entries),
      }),
    ),
    table(
      "Practice evidence by domain",
      ["Domain", "Evidence items", "Average with support", "Average on own"],
      DOMAINS.map((d) => [
        d,
        String(ev[d].n),
        pct(ev[d].supported.mean),
        pct(ev[d].independent.mean),
      ]),
    ),
    explain({
      summary:
        "This is how the student uses The Language Page: what they practiced, when, and how much they did without supports.",
      uncertain:
        "Practice scores are classroom evidence, not WIDA levels. They are never turned into a level or used in forecasts.",
      act: "If “on their own” stays low in one domain, fade one support at a time and compare the next two attempts.",
    }),
  );
}

const CAN_DO = [
  "I can point to, name and match words and pictures.",
  "I can use short phrases and simple sentences about things I know.",
  "I can describe, put steps in order and give a reason.",
  "I can explain my thinking and use evidence with linking words.",
  "I can explain and argue with detail and precise words.",
  "I can use English like a confident academic speaker and writer.",
];
const KID = {
  Listening: "Listening",
  Speaking: "Speaking",
  Reading: "Reading",
  Writing: "Writing",
};

function ladder(level, color) {
  const at = level == null ? -1 : Math.min(5, Math.floor(level) - 1);
  return h(
    "ol",
    { class: "pi-ladder", "aria-label": "Level ladder from 1 to 6" },
    LEVEL_NAMES.slice(1).map((n, i) =>
      h(
        "li",
        {
          class: i === at ? "is-here" : i < at ? "is-done" : "",
          style: i <= at ? `--lc:${color}` : null,
        },
        h("span", { class: "pi-ladder-n" }, String(i + 1)),
        h("span", {}, n),
        i === at ? h("span", { class: "pi-ladder-you" }, "I am here") : null,
      ),
    ),
  );
}

export function studentView(ws, st) {
  const rec = recordsOf(st).at(-1);
  const goals = ws.state.goals[st.id] || [];
  return h(
    "div",
    { class: "pi-stack" },
    h(
      "div",
      { class: "pi-row no-print" },
      h(
        "button",
        { type: "button", class: "btn", on: { click: () => window.print() } },
        "Print for a student conference",
      ),
    ),
    h(
      "article",
      {
        class: "pi-kidview pi-report",
        id: "piReport",
        "aria-label": `${st.name}: my English growth`,
      },
      h("h2", {}, `${st.name}: My English Growth`),
      rec
        ? h(
            "p",
            { class: "pi-kid-lead" },
            `From my ${rec.assessmentType.startsWith("MODEL") ? "MODEL" : "ACCESS"} test in ${rec.academicYear}. Every level is a step forward.`,
          )
        : h("p", {}, "My scores are not here yet."),
      rec
        ? h(
            "div",
            { class: "pi-kidgrid" },
            DOMAINS.map((d) => {
              const lv = rec.domains[d].level;
              return h(
                "section",
                { class: "pi-kidcard", style: `--dc:${DOMAIN_COLORS[d]}` },
                h("h3", {}, KID[d]),
                h(
                  "p",
                  { class: "pi-kid-level" },
                  lv == null ? "Not tested" : `Level ${Math.floor(lv)}: ${levelName(lv)}`,
                ),
                ladder(lv, DOMAIN_COLORS[d]),
                lv != null
                  ? h("p", { class: "pi-kid-can" }, CAN_DO[Math.min(5, Math.floor(lv) - 1)])
                  : null,
                h(
                  "p",
                  { class: "pi-kid-next" },
                  "Practice next: ",
                  ...RESOURCES[d]
                    .slice(0, 2)
                    .flatMap((id, i) => [
                      i ? " or " : "",
                      h("a", { href: hrefOf(id) }, titleOf(id)),
                    ]),
                ),
              );
            }),
          )
        : null,
      h(
        "section",
        { class: "pi-kidgoal" },
        h("h3", {}, "My goal"),
        goals.length
          ? h(
              "ul",
              {},
              goals.map((g) => h("li", {}, g.student || g.teacher)),
            )
          : h("p", {}, "My teacher and I will write a goal together."),
      ),
    ),
  );
}
