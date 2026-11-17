// Classroom Intelligence: level distributions, evidence coverage, flexible groups, recurring needs and the
// Language Bottleneck Detector.
import { classSummary, quartiles } from "./interpret.js";
import { activitiesFor, bandForGrade } from "./practice.js";
import { assignButton, classLivePanel } from "./view-class-live.js";
import { exitPanel } from "./view-exit.js";
import { DOMAINS } from "./rules.js";
import { renderAnalyst } from "./view-analyst.js";
import { explain, subnav } from "./view-common.js";
import { recommendInstructionalGroups } from "../../access-practice-lab/src/lang/skill-graph.js";
import { barChart } from "./charts.js";
import { h, table, tip } from "./dom.js";
import { SERIES_KEYS, seriesFor } from "./forecast.js";
import { emptyState, heading } from "./view-common.js";

const BANDS = [
  ["1.0-1.9", 1, 2],
  ["2.0-2.9", 2, 3],
  ["3.0-3.9", 3, 4],
  ["4.0-4.9", 4, 5],
  ["5.0-6.0", 5, 6.01],
];

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

const GROUP_NAMES = {
  Listening: "Listening for detail and main idea",
  Speaking: "Strengthening oral elaboration",
  Reading: "Interpreting complex informational text",
  Writing: "Using evidence in writing",
};

/** Domain spread (robust: median and quartiles) inside the largest group of comparable latest results. */
function domainSpread(ws) {
  const g = classSummary(ws.students).groups[0];
  if (!g) return h("p", { class: "pi-note" }, "No results on file.");
  const rows = DOMAINS.map((d) => {
    const q = quartiles(g.records.map(({ record }) => record.domains[d].level));
    return [d, q ? String(q.n) : "0", q ? q.median.toFixed(1) : "—", q ? `${q.q1.toFixed(1)} to ${q.q3.toFixed(1)}` : "—", q ? `${q.min.toFixed(1)} to ${q.max.toFixed(1)}` : "—"];
  });
  return h(
    "section",
    { "aria-labelledby": "piSpreadT" },
    h("h3", { id: "piSpreadT" }, `Domain spread: ${g.records.length} students, ${g.year}`),
    table("Domain levels: median and middle half", ["Domain", "Students", "Median", "Middle half", "Range"], rows),
    explain({
      summary: "Medians and the middle half resist one unusual score. Only students whose latest result shares one assessment version are included.",
      uncertain: g.records.length < 10 ? "With fewer than 10 students, a pattern here may not hold for the next group." : null,
    }),
  );
}

/** Practice playlist for a group: activities for the domain at the group's median level and band. */
function playlist(domain, members, ws) {
  const q = quartiles(members.map((m) => m.level));
  const band = bandForGrade(members[0]?.grade);
  const acts = activitiesFor(domain, q?.median ?? null, band, 3);
  if (!acts.length) return null;
  return h(
    "div",
    { class: "pi-playlist" },
    h("p", { class: "fine" }, `Practice playlist (grades ${band}):`),
    h("ul", {}, acts.map((a) => h("li", {}, h("a", { href: a.href, "data-activity": a.id }, a.title)))),
    ws ? assignButton(ws, { domain, level: q?.median ?? null, grade: members[0]?.grade, label: `Assign ${domain.toLowerCase()} practice to my class` }) : null,
  );
}

/** Temporary groups suggested from each student's lowest reported domain; the teacher approves or edits. */
function scoreGroups(ws) {
  const saved = ws.state.groups || {};
  const suggested = new Map();
  for (const { student, record } of classSummary(ws.students).groups.flatMap((g) => g.records)) {
    const ds = DOMAINS.filter((d) => record.domains[d].level != null);
    if (ds.length < 2) continue;
    const low = ds.sort((a, b) => record.domains[a].level - record.domains[b].level)[0];
    if (!suggested.has(low)) suggested.set(low, []);
    suggested.get(low).push({ student, level: record.domains[low].level, grade: record.grade });
  }
  return h(
    "section",
    { "aria-labelledby": "piTmpT" },
    h("h3", { id: "piTmpT" }, "Temporary instructional groups"),
    h("p", { class: "fine" }, "Suggested from each student's lowest reported domain. Scores are one input: move students using what you see in class. Groups are temporary; review them after each cycle."),
    h(
      "div",
      { class: "pi-cards" },
      [...suggested.entries()].map(([d, members]) => {
        const id = `g-${d}`;
        const state = saved[id];
        const name = h("input", { type: "text", value: state?.name || GROUP_NAMES[d], "aria-label": `Name of the ${d} group`, maxlength: "80" });
        const boxes = members.map(({ student: m }) => h("label", { class: "pi-check" }, h("input", { type: "checkbox", value: m.id, checked: state ? state.members.includes(m.id) : true }), ` ${m.name}`));
        return h(
          "div",
          { class: "pi-card", "data-group": d },
          name,
          h("div", {}, boxes),
          h(
            "button",
            {
              type: "button",
              class: "btn small",
              on: {
                click: () => {
                  ws.state.groups = { ...saved, [id]: { name: name.value.trim() || GROUP_NAMES[d], members: boxes.map((b) => b.querySelector("input")).filter((i) => i.checked).map((i) => i.value), approvedAt: new Date().toISOString() } };
                  ws.save();
                  ws.announce("Group approved and saved on this device.");
                  ws.rerender();
                },
              },
            },
            state ? "Update group" : "Approve group",
          ),
          state ? h("span", { class: "pi-chip" }, "Approved") : null,
          playlist(d, members, ws),
        );
      }),
    ),
  );
}

export function renderClassroom(ws) {
  if (!ws.students.length) return emptyState(ws);
  const view = ws.sub.classroom || "patterns";
  return h(
    "div",
    {},
    heading(2, "Classroom Insights"),
    subnav(ws, "classroom", [["patterns", "Patterns and groups"], ["explorer", "Data Explorer"]], view),
    view === "explorer"
      ? renderAnalyst(ws)
      : h(
          "div",
          { class: "pi-stack" },
          h("p", { class: "lead" }, "Class patterns from reported scores and practice evidence. Practice evidence is never turned into a level."),
          classLivePanel(ws),
          exitPanel(ws),
          domainSpread(ws),
          scoreGroups(ws),
          h("div", { class: "pi-grid-2" }, distributions(ws), coverage(ws)),
          groups(ws),
        ),
  );
}
