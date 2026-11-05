// Classroom Intelligence: level distributions, evidence coverage, flexible groups, recurring needs and the
// Language Bottleneck Detector.
import { recommendInstructionalGroups } from "../../access-practice-lab/src/lang/skill-graph.js";
import { barChart } from "./charts.js";
import { h, table, tip } from "./dom.js";
import { SERIES_KEYS, seriesFor } from "./forecast.js";
import { emptyState, heading } from "./view-common.js";
import { renderBottlenecks } from "./view-bottleneck.js";

const BANDS = [
  ["1.0-1.9", 1, 2],
  ["2.0-2.9", 2, 3],
  ["3.0-3.9", 3, 4],
  ["4.0-4.9", 4, 5],
  ["5.0-6.0", 5, 6.01],
];
const DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];

function distributions(ws) {
  const rows = SERIES_KEYS.map((k) => {
    const latest = ws.students.map((s) => seriesFor(s, k).at(-1)).filter(Boolean);
    return [
      k === "Overall" ? "Overall (reported)" : k,
      ...BANDS.map(([, lo, hi]) =>
        String(latest.filter((p) => p.level >= lo && p.level < hi).length),
      ),
      String(ws.students.length - latest.length),
    ];
  });
  return h(
    "section",
    { "aria-labelledby": "piDistTitle" },
    h(
      "h3",
      { id: "piDistTitle" },
      "Latest reported levels",
      tip(
        "Distribution",
        "How many students' most recent official level falls in each band. Students' latest results may come from different years.",
      ),
    ),
    table(
      "Students by latest reported level band",
      ["Series", ...BANDS.map((b) => b[0]), "No result"],
      rows,
    ),
  );
}

function coverage(ws) {
  const counts = DOMAINS.map((d) => ({
    d,
    none: ws.students.filter((s) => !(ws.evidence(s)[d].n > 0)),
  }));
  return h(
    "section",
    { "aria-labelledby": "piCovTitle" },
    h("h3", { id: "piCovTitle" }, "Practice evidence coverage"),
    barChart({
      title: "Students with practice evidence in each domain",
      max: Math.max(1, ws.students.length),
      bars: counts.map(({ d, none }) => ({ label: d, value: ws.students.length - none.length })),
      format: (v) => `${v} of ${ws.students.length}`,
    }),
    table(
      "Coverage gaps: students with no practice evidence in a domain",
      ["Domain", "Students with no evidence"],
      counts.map(({ d, none }) => [d, none.length ? none.map((s) => s.name).join(", ") : "none"]),
    ),
  );
}

function groups(ws) {
  const list = recommendInstructionalGroups(
    ws.students.map((s) => ({
      alias: s.name,
      ledger: { entries: s.entries || [] },
      records: s.records || {},
    })),
  ).sort((a, b) => b.members.length - a.members.length);
  return h(
    "section",
    { "aria-labelledby": "piGroupsTitle" },
    h(
      "h3",
      { id: "piGroupsTitle" },
      "Flexible groups and recurring needs",
      tip(
        "Flexible group",
        "Students who are all still developing the same practice skill. Groups change as new evidence arrives.",
      ),
    ),
    list.length
      ? table(
          "Skills two or more students are still developing (largest group first)",
          ["Skill", "Domain", "Students", "Why"],
          list.map((g) => [g.label, g.domain, g.members.join(", "), g.why]),
        )
      : h(
          "p",
          { class: "pi-note" },
          "No skill is shared by two or more students with enough evidence yet (each needs 3+ items across 2+ activities).",
        ),
  );
}

export function renderClassroom(ws) {
  if (!ws.students.length) return emptyState(ws);
  return h(
    "div",
    {},
    heading(2, "Classroom Intelligence"),
    h(
      "p",
      { class: "lead" },
      "Class patterns from official levels and practice evidence. Practice evidence is never turned into a level.",
    ),
    h("div", { class: "pi-grid-2" }, distributions(ws), coverage(ws)),
    groups(ws),
    renderBottlenecks(ws),
  );
}
