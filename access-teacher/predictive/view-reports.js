// Reporting Studio: individual analysis, growth, classroom, family-friendly summary (English or Spanish) and a
// forecast report (only when a validated model supports one). Reports are built on this device from the data
// in the current mode; Print saves a PDF through the browser; CSV exports the records shown. Every report
// carries assessment dates, provenance and the generation date, and is marked confidential.
import { fmt1, h, table } from "./dom.js";
import { recordsToCSV } from "./import.js";
import { classSummary, comparableSteps, domainProfile, levelName } from "./interpret.js";
import { SERIES_KEYS } from "./forecast.js";
import { findingsFor } from "./planner.js";
import { practicePlan } from "./practice.js";
import { recordsOf } from "./records.js";
import { audit } from "./store.js";
import { ASSESSMENTS, DOMAINS } from "./rules.js";
import { assessmentLabel, emptyState, studentPicker, subnav } from "./view-common.js";
import { scoreTable } from "./view-overview.js";

const TYPES = [
  ["student", "Student analysis"],
  ["growth", "Growth"],
  ["class", "Classroom"],
  ["family", "Family summary"],
  ["forecast", "Forecast"],
  ["story", "Language story"],
];
const BULK = new Set(["family", "story", "student"]);

/** Every result, grouped into eras that may be compared, with a sentence per era. */
function storyReport(ws, st) {
  const recs = recordsOf(st);
  if (!recs.length) return h("p", { class: "pi-note" }, "No results on file for this student.");
  const eras = new Map();
  for (const r of recs) {
    const key = `${ASSESSMENTS[r.assessmentType].short}|${r.scaleVersion}|${r.levelVersion}`;
    if (!eras.has(key)) eras.set(key, []);
    eras.get(key).push(r);
  }
  const sections = [...eras.entries()].map(([key, list]) => {
    const [test] = key.split("|");
    const first = list[0].composites.Overall.level;
    const last = list.at(-1).composites.Overall.level;
    const span = list.length > 1 && first != null && last != null ? Math.round((last - first) * 10) / 10 : null;
    return h(
      "section",
      { class: "pi-story-era" },
      h("h3", {}, `${test}: ${list[0].academicYear}${list.length > 1 ? ` to ${list.at(-1).academicYear}` : ""}`),
      h(
        "p",
        {},
        span == null
          ? `${list.length} result${list.length === 1 ? "" : "s"} in this group.`
          : `Overall went from ${first.toFixed(1)} to ${last.toFixed(1)} (${span > 0 ? "+" : ""}${span.toFixed(1)}) across ${list.length} results.`,
      ),
      table(
        `${test} results`,
        ["Year", "Date", ...DOMAINS, "Overall"],
        list.map((r) => [r.academicYear, r.administrationDate || "—", ...DOMAINS.map((d) => fmt1(r.domains[d].level)), fmt1(r.composites.Overall.level)]),
      ),
    );
  });
  return frame(
    ws,
    `Language story: ${st.name}`,
    h(
      "div",
      {},
      h("p", {}, `${recs.length} result${recs.length === 1 ? "" : "s"} on file. Groups are kept apart where WIDA changed the test, the scale or the cut scores, so numbers are only compared inside a group.`),
      ...sections,
      notes(ws, `story:${st.id}`),
    ),
    recs,
  );
}

/** The same report for every student, one per printed page. */
function bulkReports(ws, make) {
  return h(
    "div",
    { class: "pi-bulk", id: "piReport" },
    ws.students.map((st) => {
      const node = make(st);
      const inner = node.querySelector?.("#piReport") || node;
      inner.removeAttribute?.("id");
      inner.querySelectorAll?.(".no-print, .pi-subnav").forEach((x) => x.remove());
      return h("div", { class: "pi-bulk-page" }, inner);
    }),
  );
}

function frame(ws, title, body, recs) {
  const dates = [...new Set(recs.map((r) => assessmentLabel(r, ASSESSMENTS)))];
  return h(
    "article",
    { class: "pi-report", id: "piReport", "aria-label": title },
    h(
      "p",
      { class: "pi-report-conf" },
      ws.mode === "demo"
        ? "SAMPLE CLASS: fictional students and results for practice."
        : "Confidential student record. Share only with people authorized to see it.",
    ),
    h("h2", {}, title),
    h(
      "p",
      { class: "fine" },
      `Generated ${new Date().toLocaleDateString()} · The Language Page, WIDA Data Studio · Data from: ${dates.join("; ") || "no results"} · Source: ${[...new Set(recs.map((r) => `${r.sourceType}${r.sourceVerified ? "" : " (unverified)"}`))].join(", ") || "—"}`,
    ),
    body,
  );
}

function notes(ws, key) {
  const t = h("textarea", {
    rows: 3,
    maxlength: "1200",
    "aria-label": "Teacher notes for this report",
    class: "pi-report-notes",
  });
  t.value = ws.state.notes[key] || "";
  t.addEventListener("change", () => {
    ws.state.notes[key] = t.value;
    ws.save();
  });
  return h("label", { class: "pi-field" }, h("span", {}, "Teacher notes"), t);
}

function studentReport(ws, st) {
  const recs = recordsOf(st);
  const rec = recs.at(-1);
  if (!rec) return h("p", { class: "pi-note" }, "No results on file for this student.");
  const prof = domainProfile(rec);
  return frame(
    ws,
    `Language analysis: ${st.name}`,
    h(
      "div",
      {},
      scoreTable(rec),
      h("p", {}, prof.text),
      h("h3", {}, "Instructional priorities"),
      h(
        "ul",
        {},
        findingsFor(rec).map((f) =>
          h("li", {}, `${f.domain}: ${f.gather} Then ${f.teach[0].toLowerCase()}`),
        ),
      ),
      notes(ws, `student:${st.id}`),
    ),
    recs,
  );
}

function growthReport(ws, st) {
  const steps = comparableSteps(st);
  return frame(
    ws,
    `Growth: ${st.name}`,
    h(
      "div",
      {},
      steps.length
        ? steps.map((s) =>
            s.levelsComparable
              ? table(
                  `${assessmentLabel(s.from, ASSESSMENTS)} to ${assessmentLabel(s.to, ASSESSMENTS)}`,
                  ["Score", "Before", "After", "Observed change"],
                  s.rows.map((r) => [
                    r.key,
                    fmt1(r.from.level),
                    fmt1(r.to.level),
                    r.levelChange == null
                      ? "—"
                      : `${r.levelChange > 0 ? "+" : ""}${r.levelChange.toFixed(1)}${r.beyondError === false ? " (within measurement error)" : ""}`,
                  ]),
                )
              : h(
                  "p",
                  { class: "pi-note" },
                  `${assessmentLabel(s.from, ASSESSMENTS)} to ${assessmentLabel(s.to, ASSESSMENTS)}: ${s.why}`,
                ),
          )
        : h(
            "p",
            {},
            "Fewer than two results of the same assessment are on file, so there is no observed change to report.",
          ),
      h(
        "p",
        { class: "fine" },
        "Changes are observed differences between two reported results. With two results there is no trend; proficiency levels are not equal steps.",
      ),
      notes(ws, `growth:${st.id}`),
    ),
    recordsOf(st),
  );
}

function classReport(ws) {
  const sum = classSummary(ws.students);
  const recs = sum.groups.flatMap((g) => g.records.map((x) => x.record));
  return frame(
    ws,
    "Classroom analysis",
    h(
      "div",
      {},
      h(
        "p",
        {},
        `${sum.total} students; ${sum.total - sum.missing} with results; ${sum.multi} with two comparable annual results.`,
      ),
      sum.groups.map((g) =>
        table(
          `${ASSESSMENTS[g.type].short} ${g.year}: ${g.words}`,
          ["Student", ...DOMAINS, "Overall"],
          g.records.map(({ student, record }) => [
            student.name,
            ...DOMAINS.map((d) => fmt1(record.domains[d].level)),
            fmt1(record.composites.Overall.level),
          ]),
        ),
      ),
      Object.values(ws.state.groups || {}).length
        ? h(
            "div",
            {},
            h("h3", {}, "Approved temporary groups"),
            h(
              "ul",
              {},
              Object.values(ws.state.groups).map((g) =>
                h("li", {}, `${g.name}: ${g.members.length} students`),
              ),
            ),
          )
        : null,
      notes(ws, "class"),
    ),
    recs,
  );
}

const FAMILY = {
  en: {
    title: (n) => `How ${n} is growing in English`,
    intro:
      "Every year your child takes a test of English in four areas: listening, speaking, reading and writing. Here is what the latest results show.",
    strong: (d) => `A strength right now: ${d}.`,
    next: (d) => `What we are working on next: ${d}.`,
    goal: "Our goal",
    home: "Ideas for home (optional)",
    ideas: [
      "Talk together every day in the language you know best. Strong talk at home helps English grow.",
      "Ask your child to explain how to do something, step by step.",
      "Read together, or retell a story or a video in your own words.",
    ],
    level: "Level",
    note: "Scores are one piece of information. Teachers also look at your child's work in class.",
  },
  es: {
    title: (n) => `Cómo crece ${n} en inglés`,
    intro:
      "Cada año su hijo o hija toma una prueba de inglés en cuatro áreas: escuchar, hablar, leer y escribir. Esto muestran los resultados más recientes.",
    strong: (d) => `Una fortaleza ahora: ${d}.`,
    next: (d) => `Lo que vamos a trabajar ahora: ${d}.`,
    goal: "Nuestra meta",
    home: "Ideas para la casa (opcional)",
    ideas: [
      "Conversen todos los días en el idioma que mejor conocen. Hablar mucho en casa ayuda a crecer en inglés.",
      "Pídanle a su hijo o hija que explique cómo hacer algo, paso a paso.",
      "Lean juntos, o vuelvan a contar un cuento o un video con sus propias palabras.",
    ],
    level: "Nivel",
    note: "Los puntajes son solo una parte de la información. Los maestros también miran el trabajo de su hijo o hija en clase.",
  },
};
const DOMAIN_ES = {
  Listening: "escuchar",
  Speaking: "hablar",
  Reading: "leer",
  Writing: "escribir",
};

function familyReport(ws, st) {
  const lang = ws.sub.familyLang || "en";
  const T = FAMILY[lang];
  const rec = recordsOf(st).at(-1);
  if (!rec) return h("p", { class: "pi-note" }, "No results on file for this student.");
  const prof = domainProfile(rec);
  const dn = (d) => (lang === "es" ? DOMAIN_ES[d] : d.toLowerCase());
  const goal = (ws.state.goals[st.id] || []).at(-1);
  return h(
    "div",
    {},
    subnav(
      ws,
      "familyLang",
      [
        ["en", "English"],
        ["es", "Español"],
      ],
      lang,
    ),
    frame(
      ws,
      T.title(st.name),
      h(
        "div",
        { lang },
        h("p", {}, T.intro),
        h(
          "ul",
          { class: "pi-family-levels" },
          DOMAINS.filter((d) => rec.domains[d].level != null).map((d) =>
            h(
              "li",
              {},
              h(
                "strong",
                {},
                `${lang === "es" ? DOMAIN_ES[d][0].toUpperCase() + DOMAIN_ES[d].slice(1) : d}: `,
              ),
              `${T.level} ${fmt1(rec.domains[d].level)}${lang === "en" ? ` (${levelName(rec.domains[d].level)})` : ""}`,
            ),
          ),
        ),
        prof.strength && prof.gap > 0 ? h("p", {}, T.strong(dn(prof.strength))) : null,
        prof.need && prof.gap > 0 ? h("p", {}, T.next(dn(prof.need))) : null,
        goal?.student ? h("p", {}, h("strong", {}, `${T.goal}: `), goal.student) : null,
        h("h3", {}, T.home),
        h(
          "ul",
          {},
          T.ideas.map((x) => h("li", {}, x)),
        ),
        h("h3", {}, lang === "es" ? "Practiquen juntos en The Language Page (gratis, sin cuenta)" : "Practice together on The Language Page (free, no account)"),
        h(
          "ul",
          { class: "pi-family-links" },
          practicePlan(rec, { max: 1 }).map((p) =>
            h("li", {}, h("a", { href: `${location.origin}${p.activities[0].href}` }, p.activities[0].title), ` · ${p.domain === "Vocabulary" ? (lang === "es" ? "palabras" : "words") : lang === "es" ? DOMAIN_ES[p.domain] : p.domain.toLowerCase()}`),
          ),
        ),
        h("p", { class: "fine" }, T.note),
        lang === "es"
          ? h(
              "p",
              { class: "fine no-print" },
              "Spanish text is a draft; it has not been reviewed by a native speaker.",
            )
          : null,
      ),
      [rec],
    ),
  );
}

function forecastReport(ws, st) {
  const rows = SERIES_KEYS.map((k) => ws.forecast(st, k, ws.state.targets[k] ?? null));
  const any = rows.some((f) => f.numbers);
  if (!any)
    return h(
      "p",
      { class: "pi-note", "data-forecast-report": "disabled" },
      "No validated model supports a forecast for this student, so no forecast report is produced. The growth and student reports describe what is known.",
    );
  return frame(
    ws,
    `Forecast: ${st.name}`,
    h(
      "div",
      {},
      table(
        "Validated forecast ranges",
        ["Score", "Year forecast", "Expected", "80% range", "Model", "Held-out error (MAE)"],
        rows
          .filter((f) => f.numbers)
          .map((f) => [
            f.key,
            f.targetYear,
            fmt1(f.numbers.expected),
            `${fmt1(f.numbers.interval80[0])} to ${fmt1(f.numbers.interval80[1])}`,
            f.model?.id || "—",
            f.model?.testMae != null ? f.model.testMae.toFixed(2) : "—",
          ]),
      ),
      h(
        "p",
        {},
        "Assumptions: the next result is the next annual ACCESS administration on the same scale and cut-score version; the model's error on held-out students applies to this student. About one in five results falls outside an 80% range.",
      ),
      h(
        "p",
        {},
        "Limitations: a forecast is not an exit decision or a placement. It cannot see instruction, attendance or test-day conditions.",
      ),
      ws.mode === "demo"
        ? h(
            "p",
            { class: "pi-note" },
            "The model was trained on synthetic data. It shows how the workflow behaves, not how real students will score.",
          )
        : null,
    ),
    recordsOf(st),
  );
}

function download(name, text) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function renderReports(ws) {
  if (!ws.students.length) return emptyState(ws);
  const type = ws.sub.report || "student";
  const st = ws.student();
  const makers = {
    student: (x) => studentReport(ws, x),
    growth: (x) => growthReport(ws, x),
    class: () => classReport(ws),
    family: (x) => familyReport(ws, x),
    forecast: (x) => forecastReport(ws, x),
    story: (x) => storyReport(ws, x),
  };
  const all = BULK.has(type) && ws.sub.reportAll === "all";
  const body = all ? bulkReports(ws, makers[type]) : makers[type](st);
  const rows = (type === "class" ? ws.students : [st]).flatMap((s) =>
    recordsOf(s).map((record) => ({ name: s.name, record })),
  );
  return h(
    "div",
    { class: "pi-stack" },
    subnav(ws, "report", TYPES, type),
    BULK.has(type) ? subnav(ws, "reportAll", [["one", "One student"], ["all", "Whole class (one page each)"]], ws.sub.reportAll || "one") : null,
    type === "class" || all ? null : studentPicker(ws),
    type === "family" && all ? subnav(ws, "familyLang", [["en", "English"], ["es", "Español"]], ws.sub.familyLang || "en") : null,
    h(
      "div",
      { class: "pi-row no-print" },
      h(
        "button",
        {
          type: "button",
          class: "btn",
          "data-print-report": "",
          on: { click: () => (audit("print-report", { type, mode: ws.mode }), window.print()) },
        },
        "Print or save as PDF",
      ),
      h(
        "button",
        {
          type: "button",
          class: "btn ghost",
          "data-csv-report": "",
          on: {
            click: () => {
              audit("export-csv", { type, mode: ws.mode, records: rows.length });
              download(
                `${ws.mode === "demo" ? "synthetic-" : ""}wida-${type}-${new Date().toISOString().slice(0, 10)}.csv`,
                recordsToCSV(rows),
              );
            },
          },
        },
        "Export CSV",
      ),
    ),
    body,
  );
}

