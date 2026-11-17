// Student Language Profile: domain profile (levels or scale scores, never on one axis), composite breakdown,
// strengths and needs, language-development starting points, every assessment on file, and goals the teacher
// writes (with a student-friendly version) linked to Language Page activities.
import { profileChart } from "./charts.js";
import { fmt1, h, table } from "./dom.js";
import { domainProfile, guidanceFor, levelName } from "./interpret.js";
import { RESOURCES, resourceLink } from "./planner.js";
import { recordsOf } from "./records.js";
import {
  ASSESSMENTS,
  COMPOSITE_INFO,
  COMPOSITES,
  DOMAINS,
  LEVEL_WORDS,
  SCALE_WORDS,
} from "./rules.js";
import {
  assessmentLabel,
  COLORS,
  emptyState,
  explain,
  heading,
  scoreChip,
  studentPicker,
  subnav,
} from "./view-common.js";
import { scoreTable } from "./view-overview.js";
import { practicePanel, studentView } from "./view-student-extra.js";

function compositeCards(rec) {
  return h(
    "ul",
    { class: "pi-cards" },
    COMPOSITES.map((c) => {
      const sc = rec.composites[c];
      const info = COMPOSITE_INFO[c];
      return h(
        "li",
        { class: "pi-card", "data-composite": c },
        h("h4", {}, info.label),
        h(
          "p",
          { class: "pi-card-value" },
          sc.level != null
            ? `${fmt1(sc.level)} ${levelName(sc.level)}`
            : sc.calculatedScale != null
              ? `Scale ${sc.calculatedScale}`
              : "Not reported",
        ),
        scoreChip(
          sc.level != null || sc.scale != null
            ? "reported"
            : sc.calculatedScale != null
              ? "calculated"
              : sc.status,
        ),
        h("p", { class: "fine" }, `${info.parts[0].toUpperCase()}${info.parts.slice(1)}. ${info.means}`),
        sc.calculatedScale != null && sc.level == null
          ? h(
              "p",
              { class: "fine" },
              "Calculated from the reported domain scale scores with WIDA's published weights to illustrate the composite. It is not an official score, and no level is derived from it.",
            )
          : null,
      );
    }),
  );
}

function guidancePanel(rec) {
  const rows = DOMAINS.filter((d) => rec.domains[d].level != null).map((d) => {
    const g = guidanceFor(rec.domains[d].level);
    return [
      d,
      `${fmt1(rec.domains[d].level)} ${levelName(rec.domains[d].level)}`,
      g.functions,
      g.sentence,
      d === "Speaking" ? g.speaking : d === "Writing" ? g.writing : g.discourse,
    ];
  });
  if (!rows.length) return h("p", { class: "pi-note" }, "No domain levels on file for guidance.");
  const overall = guidanceFor(rec.composites.Overall.level ?? rec.domains.Reading.level);
  return h(
    "div",
    {},
    table(
      "Language-development starting points by domain",
      ["Domain", "Reported", "Language functions", "Sentence resources", "Task to try"],
      rows,
    ),
    overall
      ? h(
          "p",
          { class: "fine" },
          `Vocabulary focus: ${overall.vocabulary}. Discourse: ${overall.discourse}.`,
        )
      : null,
    h(
      "p",
      { class: "pi-note" },
      "These are starting points informed by WIDA's proficiency level descriptors, chosen from the score alone. What the student shows in class confirms or changes them.",
    ),
  );
}

function goalsPanel(ws, st) {
  const goals = ws.state.goals[st.id] || [];
  const domain = h(
    "select",
    { id: "piGoalDomain" },
    DOMAINS.map((d) => h("option", { value: d }, d)),
  );
  const teacher = h("input", {
    id: "piGoalTeacher",
    type: "text",
    maxlength: "200",
    placeholder: "Explain a process using sequence words and one reason",
  });
  const kid = h("input", {
    id: "piGoalKid",
    type: "text",
    maxlength: "160",
    placeholder: "I can explain the steps with first, next, then and because.",
  });
  const add = () => {
    if (!teacher.value.trim()) return ws.announce("Write the goal first.");
    ws.state.goals[st.id] = [
      ...goals,
      {
        id: Date.now().toString(36),
        domain: domain.value,
        teacher: teacher.value.trim(),
        student: kid.value.trim(),
        at: new Date().toISOString(),
      },
    ];
    ws.save();
    ws.announce("Goal saved on this device.");
    ws.rerender();
  };
  return h(
    "section",
    { "aria-labelledby": "piGoalsT" },
    h("h3", { id: "piGoalsT" }, "Language goals"),
    goals.length
      ? h(
          "ul",
          { class: "pi-goals" },
          goals.map((g) =>
            h(
              "li",
              { "data-goal": g.id },
              h("strong", {}, `${g.domain}: `),
              g.teacher,
              g.student ? h("span", { class: "pi-kid" }, ` Student version: “${g.student}”`) : null,
              " ",
              h("span", { class: "fine" }, "Practice: "),
              (RESOURCES[g.domain] || []).slice(0, 2).map((id) => [resourceLink(id), " "]),
              h(
                "button",
                {
                  type: "button",
                  class: "ghost small",
                  on: {
                    click: () => {
                      ws.state.goals[st.id] = goals.filter((x) => x.id !== g.id);
                      ws.save();
                      ws.rerender();
                    },
                  },
                },
                "Remove",
              ),
            ),
          ),
        )
      : h("p", { class: "fine" }, "No goals yet."),
    h(
      "div",
      { class: "pi-form" },
      h("label", { class: "pi-field" }, h("span", {}, "Domain"), domain),
      h("label", { class: "pi-field pi-grow" }, h("span", {}, "Teacher goal"), teacher),
      h("label", { class: "pi-field pi-grow" }, h("span", {}, "Student-friendly version"), kid),
      h("button", { type: "button", class: "btn", on: { click: add } }, "Save goal"),
    ),
  );
}

export function renderStudents(ws) {
  if (!ws.students.length) return emptyState(ws);
  const view = ws.sub.studentView || "profile";
  const st = ws.student();
  const body = view === "practice" ? practicePanel(ws, st) : view === "kid" ? studentView(ws, st) : renderProfile(ws);
  return h(
    "div",
    { class: "pi-stack" },
    subnav(ws, "studentView", [["profile", "Language profile"], ["practice", "Practice activity"], ["kid", "Student view"]], view),
    view === "profile" ? null : studentPicker(ws),
    body,
  );
}

function renderProfile(ws) {
  const st = ws.student();
  const recs = recordsOf(st);
  const rec = recs.at(-1);
  if (!rec)
    return h(
      "div",
      {},
      studentPicker(ws),
      h("p", { class: "pi-note" }, "No results on file for this student yet."),
      goalsPanel(ws, st),
    );
  const measure = ws.sub.measure || "level";
  const prof = domainProfile(rec);
  const hasScale = DOMAINS.some((d) => rec.domains[d].scale != null);
  return h(
    "div",
    { class: "pi-stack" },
    studentPicker(ws),
    heading(2, `${st.name}: language profile`),
    h(
      "p",
      { class: "fine" },
      `${assessmentLabel(rec, ASSESSMENTS)} · ${SCALE_WORDS[rec.scaleVersion]} · ${LEVEL_WORDS[rec.levelVersion]}`,
    ),
    subnav(
      ws,
      "measure",
      [
        ["level", "Proficiency levels"],
        ["scale", "Scale scores"],
      ],
      measure,
    ),
    measure === "scale" && !hasScale
      ? h(
          "p",
          { class: "pi-note" },
          "No scale scores are on file for this result. Proficiency levels are shown instead.",
        )
      : null,
    profileChart({
      title: `${st.name}: domain ${measure === "scale" && hasScale ? "scale scores" : "proficiency levels"}`,
      measure: measure === "scale" && hasScale ? "scale" : "level",
      rows: DOMAINS.map((d) => ({
        key: d,
        label: d,
        value: measure === "scale" && hasScale ? rec.domains[d].scale : rec.domains[d].level,
        sem: rec.domains[d].sem,
        status: rec.domains[d].status,
      })),
      colors: COLORS,
    }),
    explain({
      summary: prof.text,
      uncertain:
        measure === "scale"
          ? "Lines through the bars show about 95% of the reported measurement error, where it is on file."
          : "Proficiency levels are not equal steps, so a 0.5 gap does not mean the same thing everywhere on the scale.",
      evidence: scoreTable(rec),
    }),
    heading(3, "Composite breakdown"),
    compositeCards(rec),
    heading(3, "Strengths, needs and what to teach"),
    guidancePanel(rec),
    heading(3, "Every assessment on file"),
    table(
      `Assessments for ${st.name}`,
      ["Assessment", "Year", "Date", "Grade", ...DOMAINS, "Overall", "Source"],
      [...recs]
        .reverse()
        .map((r) => [
          ASSESSMENTS[r.assessmentType].short,
          r.academicYear,
          r.administrationDate || "—",
          String(r.grade ?? "—"),
          ...DOMAINS.map((d) =>
            r.domains[d].status === "not-assessed" ? "N/A" : fmt1(r.domains[d].level),
          ),
          fmt1(r.composites.Overall.level),
          `${r.sourceType}${r.sourceVerified ? "" : " (unverified)"}`,
        ]),
    ),
    goalsPanel(ws, st),
  );
}
