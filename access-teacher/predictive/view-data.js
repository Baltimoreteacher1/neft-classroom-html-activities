// Import data: a seven-step wizard (source -> assessment -> map -> validate -> review -> save -> analyze),
// the data-quality panel, record management (verify, delete), the local audit log and undo of the last
// import. Real mode writes ACCESS results to the Teacher Hub's own official-results store and MODEL results
// to the studio's interim store; Synthetic demo mode never writes anything.
import { h, table, tip } from "./dom.js";
import { readPdfText, readXlsx, scoresFromReportText } from "./file-readers.js";
import {
  applyImport,
  autoMap,
  draftsFromTable,
  isLong,
  parseTable,
  TEMPLATE,
  undoImport,
  validateDrafts,
} from "./import.js";
import { QUALITY_WORDS, qualityReport } from "./quality.js";
import { recordsOf, removeRow } from "./records.js";
import { ASSESSMENTS, ASSESSMENT_TYPES, DOMAINS, SCALE_RESET_YEAR, SCORE_KEYS } from "./rules.js";
import { audit, KEYS, loadStores, read, saveStores, write } from "./store.js";
import { heading } from "./view-common.js";

const STEPS = [
  "Choose source",
  "Identify assessment",
  "Map columns",
  "Validate",
  "Review and correct",
  "Save",
  "Analyze",
];
const STATUS_WORDS = {
  new: "Will import",
  conflict: "Conflict",
  unchanged: "Already on file",
  duplicate: "Duplicate",
  error: "Error",
};
const FIELD_LABELS = [
  ["", "Ignore this column"],
  ["student", "Student"],
  ["grade", "Grade"],
  ["assessment", "Assessment"],
  ["year", "School year"],
  ["date", "Test date"],
  ["form", "Form or tier"],
  ["levelVersion", "Cut-score version"],
  ["domain", "Domain (long format)"],
  ["level", "Level (long format)"],
  ["scale", "Scale score (long format)"],
  ["sem", "Measurement error (long format)"],
  ...SCORE_KEYS.flatMap((k) => [
    [`${k}:level`, `${k} level`],
    [`${k}:scale`, `${k} scale score`],
    [`${k}:sem`, `${k} measurement error`],
  ]),
];
const SAMPLE = TEMPLATE.replace(/Student A/g, "Sample student (fictional)");

const blankDraft = (wiz) => ({
  line: 0,
  student: "",
  assessment: wiz.assessment,
  year: wiz.year,
  date: "",
  grade: "",
  form: "",
  levelVersion: wiz.levelVersion,
  scores: Object.fromEntries(SCORE_KEYS.map((k) => [k, { level: "", scale: "", sem: "" }])),
});

const wiz = {
  step: 0,
  source: "",
  assessment: "ACCESS",
  year: "",
  levelVersion: "",
  table: null,
  mapping: null,
  drafts: [],
  fileName: "",
  sourceType: "manual",
  pdfText: "",
  replace: false,
  verified: false,
  result: null,
  error: "",
};
const resetWizard = () =>
  Object.assign(wiz, {
    step: 0,
    source: "",
    table: null,
    mapping: null,
    drafts: [],
    fileName: "",
    sourceType: "manual",
    pdfText: "",
    replace: false,
    verified: false,
    result: null,
    error: "",
  });

function stepper() {
  return h(
    "ol",
    { class: "pi-wizard-steps", "aria-label": "Import steps" },
    STEPS.map((s, i) =>
      h(
        "li",
        {
          class: i === wiz.step ? "is-current" : i < wiz.step ? "is-done" : "",
          "aria-current": i === wiz.step ? "step" : null,
        },
        `${i + 1}. ${s}`,
      ),
    ),
  );
}
const nav = (ws, { back = true, next = null, nextLabel = "Next" } = {}) =>
  h(
    "div",
    { class: "pi-row" },
    back && wiz.step > 0
      ? h(
          "button",
          {
            type: "button",
            class: "btn ghost",
            on: {
              click: () => (
                (wiz.step = Math.max(
                  0,
                  wiz.step - ((wiz.source === "manual" || wiz.source === "pdf") && wiz.step === 4 ? 3 : 1),
                )),
                ws.rerender()
              ),
            },
          },
          "Back",
        )
      : null,
    next
      ? h(
          "button",
          { type: "button", class: "btn", "data-wizard-next": "", on: { click: next } },
          nextLabel,
        )
      : null,
    h(
      "button",
      { type: "button", class: "btn ghost", on: { click: () => (resetWizard(), ws.rerender()) } },
      "Start over",
    ),
  );

function stepSource(ws) {
  const status = h("p", { class: "pi-note", role: "status" }, wiz.error);
  const take = (rows, name, type) => {
    if (!rows.length) {
      wiz.error = "No rows were found.";
      return ws.rerender();
    }
    Object.assign(wiz, {
      table: rows,
      mapping: autoMap(rows[0]),
      fileName: name,
      sourceType: type,
      error: "",
      step: 1,
    });
    ws.rerender();
  };
  const file = h("input", {
    type: "file",
    id: "piImportFile",
    accept:
      ".csv,.xlsx,.pdf,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  file.addEventListener("change", async () => {
    const f = file.files?.[0];
    if (!f) return;
    if (f.size > 5_000_000)
      return ((wiz.error = "That file is larger than 5 MB. Export a smaller file."), ws.rerender());
    try {
      const ext = f.name.toLowerCase().split(".").pop();
      if (ext === "xlsx") return take(await readXlsx(await f.arrayBuffer()), f.name, "xlsx");
      if (ext === "pdf") {
        const text = await readPdfText(await f.arrayBuffer());
        if (!text)
          return (
            (wiz.error =
              "No text layer was found in this PDF (it may be a scan). Open the report, select all, copy, and paste the text below. Scanned reports are not sent to any OCR service."),
            ws.rerender()
          );
        Object.assign(wiz, {
          pdfText: text,
          fileName: f.name,
          sourceType: "pdf",
          source: "pdf",
          step: 1,
          error: "",
        });
        return ws.rerender();
      }
      if (ext === "csv") return take(parseTable(await f.text()), f.name, "csv");
      wiz.error = "Choose a .csv, .xlsx or .pdf file.";
    } catch (e) {
      wiz.error = `The file could not be read: ${e.message}`;
    }
    ws.rerender();
  });
  const paste = h("textarea", {
    id: "piPaste",
    rows: 6,
    spellcheck: "false",
    placeholder: "Paste cells copied from a spreadsheet (with the header row), or CSV text.",
  });
  const reportText = h("textarea", {
    id: "piReportText",
    rows: 5,
    spellcheck: "false",
    placeholder: "Paste the text of one student's score report.",
  });
  return h(
    "div",
    { class: "pi-stack" },
    h(
      "div",
      { class: "pi-cards" },
      h(
        "div",
        { class: "pi-card" },
        h("h4", {}, "Type scores in"),
        h("p", { class: "fine" }, "One student or a whole class, row by row."),
        h(
          "button",
          {
            type: "button",
            class: "btn",
            "data-source": "manual",
            on: {
              click: () => (
                Object.assign(wiz, { source: "manual", sourceType: "manual", step: 1 }),
                ws.rerender()
              ),
            },
          },
          "Manual or bulk entry",
        ),
      ),
      h(
        "div",
        { class: "pi-card" },
        h("h4", {}, "Upload a file"),
        h(
          "p",
          { class: "fine" },
          "CSV or Excel (.xlsx) export, or a digital PDF score report. Read on this device; nothing is uploaded.",
        ),
        h("label", { for: "piImportFile", class: "pi-field" }, h("span", {}, "File"), file),
      ),
      h(
        "div",
        { class: "pi-card" },
        h("h4", {}, "Paste from a spreadsheet"),
        paste,
        h(
          "button",
          {
            type: "button",
            class: "btn",
            "data-source": "paste",
            on: { click: () => take(parseTable(paste.value), "pasted cells", "csv") },
          },
          "Use pasted cells",
        ),
      ),
      h(
        "div",
        { class: "pi-card" },
        h("h4", {}, "Paste report text"),
        reportText,
        h(
          "button",
          {
            type: "button",
            class: "btn",
            on: {
              click: () => (
                Object.assign(wiz, {
                  pdfText: reportText.value,
                  fileName: "pasted report text",
                  sourceType: "pdf",
                  source: "pdf",
                  step: 1,
                }),
                ws.rerender()
              ),
            },
          },
          "Read report text",
        ),
      ),
    ),
    status,
    h(
      "p",
      { class: "fine" },
      h(
        "a",
        {
          href: `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`,
          download: "wida-score-template.csv",
        },
        "Download the CSV template",
      ),
      " · ",
      h(
        "button",
        {
          type: "button",
          class: "linkish",
          "data-sample": "",
          on: { click: () => take(parseTable(SAMPLE), "sample (fictional)", "csv") },
        },
        "Try the wizard with a fictional sample file",
      ),
    ),
  );
}

function stepIdentify(ws) {
  const type = h(
    "select",
    { id: "piAsType" },
    ASSESSMENT_TYPES.map((t) =>
      h("option", { value: t, selected: t === wiz.assessment }, ASSESSMENTS[t].label),
    ),
  );
  const year = h("input", {
    id: "piAsYear",
    type: "text",
    placeholder: "2025-26",
    value: wiz.year,
    size: 8,
  });
  const lv = h(
    "select",
    { id: "piAsLv" },
    h("option", { value: "" }, "First report (2016 cut scores)"),
    h(
      "option",
      { value: "2026-cuts", selected: wiz.levelVersion === "2026-cuts" },
      "Updated report (2026 cut scores)",
    ),
  );
  return h(
    "div",
    { class: "pi-stack" },
    h(
      "p",
      {},
      "Which assessment are these results from? A column in the file overrides these defaults row by row.",
    ),
    h(
      "div",
      { class: "pi-form" },
      h("label", { class: "pi-field", for: "piAsType" }, h("span", {}, "Assessment"), type),
      h(
        "label",
        { class: "pi-field", for: "piAsYear" },
        h("span", {}, "School year (if the file has none)"),
        year,
      ),
      h(
        "label",
        { class: "pi-field", for: "piAsLv" },
        h("span", {}, `For ${SCALE_RESET_YEAR} ACCESS: which report?`),
        lv,
      ),
    ),
    h(
      "p",
      { class: "fine" },
      `ACCESS was revised in ${SCALE_RESET_YEAR} and its scale reset; 2025-26 levels were first reported on the 2016 cut scores and re-issued after WIDA's 2026 standard setting. The studio keeps these versions apart.`,
    ),
    nav(ws, {
      next: () => {
        Object.assign(wiz, {
          assessment: type.value,
          year: year.value.trim(),
          levelVersion: lv.value,
        });
        if (wiz.source === "manual") Object.assign(wiz, { drafts: [blankDraft(wiz)], step: 4 });
        else if (wiz.source === "pdf") {
          const got = scoresFromReportText(wiz.pdfText);
          const d = blankDraft(wiz);
          Object.assign(d, { year: got.year || wiz.year, grade: got.grade });
          for (const [k, v] of Object.entries(got.scores)) d.scores[k] = { ...d.scores[k], ...v };
          wiz.error = got.found
            ? `Found ${got.found} score lines. Check every value against the report.`
            : "No scores were recognised. Type them from the report.";
          Object.assign(wiz, { drafts: [d], step: 4 });
        } else wiz.step = 2;
        ws.rerender();
      },
    }),
  );
}

function stepMap(ws) {
  const header = wiz.table[0];
  const selects = header.map((col, i) => {
    const sel = h(
      "select",
      { "aria-label": `Field for column "${col}"`, "data-map": String(i) },
      FIELD_LABELS.map(([v, l]) => h("option", { value: v, selected: wiz.mapping[i] === v }, l)),
    );
    sel.addEventListener("change", () => (wiz.mapping[i] = sel.value));
    return sel;
  });
  return h(
    "div",
    { class: "pi-stack" },
    h(
      "p",
      {},
      `${wiz.table.length - 1} data rows in ${wiz.fileName}. Columns were matched automatically; change any that are wrong.`,
    ),
    table(
      "Column mapping",
      ["Column in the file", "First value", "Studio field"],
      header.map((col, i) => [
        col || `(column ${i + 1})`,
        String(wiz.table[1]?.[i] ?? ""),
        selects[i],
      ]),
    ),
    nav(ws, {
      next: () => {
        if (!wiz.mapping.includes("student"))
          return ((wiz.error = "Map one column to Student."), ws.announce(wiz.error));
        wiz.drafts = draftsFromTable(wiz.table, wiz.mapping, {
          assessment: wiz.assessment,
          year: wiz.year,
          levelVersion: wiz.levelVersion,
        });
        wiz.step = 3;
        ws.rerender();
      },
    }),
    isLong(wiz.mapping)
      ? h(
          "p",
          { class: "fine" },
          "Long format detected: rows for the same student, assessment and year are combined into one result.",
        )
      : null,
  );
}

const preview = (ws) =>
  validateDrafts(wiz.drafts, {
    roster: ws.students.filter((s) => s.onRoster).map((s) => ({ id: s.id, name: s.name })),
    stores: loadStores(),
    today: ws.today,
  });

function stepValidate(ws) {
  const p = preview(ws);
  return h(
    "div",
    { class: "pi-stack" },
    h(
      "ul",
      { class: "pi-stats", "data-import-summary": "" },
      Object.entries(p.summary).map(([k, v]) =>
        h("li", {}, h("strong", {}, String(v)), ` ${k === "total" ? "results" : STATUS_WORDS[k]}`),
      ),
    ),
    table(
      "Validation",
      ["Line", "Student", "Assessment", "Status", "Problems and notes"],
      p.rows.map((r) => [
        String(r.line),
        r.student || "—",
        `${ASSESSMENTS[r.row.assessment]?.short || "?"} ${r.row.year || ""}`,
        h(
          "span",
          { class: `pi-chip is-${r.status}`, "data-import-status": r.status },
          STATUS_WORDS[r.status],
        ),
        [...r.errors, ...r.warnings].join(" ") || "—",
      ]),
    ),
    nav(ws, { next: () => ((wiz.step = 4), ws.rerender()), nextLabel: "Review and correct" }),
  );
}

function stepReview(ws) {
  const p = preview(ws);
  const cell = (d, path, label, size = 5) => {
    const get = () => path.reduce((o, k) => o?.[k], d) ?? "";
    const input = h("input", {
      type: "text",
      value: get(),
      size,
      "aria-label": `${label}, row ${wiz.drafts.indexOf(d) + 1}`,
    });
    input.addEventListener("change", () => {
      let o = d;
      for (const k of path.slice(0, -1)) o = o[k];
      o[path.at(-1)] = input.value.trim();
      ws.rerender();
    });
    return input;
  };
  const rows = wiz.drafts.map((d, i) => {
    const r = p.rows[i];
    const sel = h(
      "select",
      { "aria-label": `Assessment, row ${i + 1}` },
      ASSESSMENT_TYPES.map((t) =>
        h("option", { value: t, selected: d.assessment === t }, ASSESSMENTS[t].short),
      ),
    );
    sel.addEventListener("change", () => ((d.assessment = sel.value), ws.rerender()));
    return h(
      "tr",
      { class: `is-${r.status}`, "data-review-row": String(i) },
      h("td", {}, cell(d, ["student"], "Student", 14)),
      h("td", {}, sel),
      h("td", {}, cell(d, ["year"], "School year", 7)),
      h("td", {}, cell(d, ["date"], "Date", 10)),
      h("td", {}, cell(d, ["grade"], "Grade", 2)),
      ...[...DOMAINS, "Overall"].map((k) =>
        h(
          "td",
          {},
          cell(d, ["scores", k, "level"], `${k} level`, 3),
          cell(d, ["scores", k, "scale"], `${k} scale`, 3),
        ),
      ),
      h(
        "td",
        {},
        h("span", { class: `pi-chip is-${r.status}` }, STATUS_WORDS[r.status]),
        h("span", { class: "fine" }, ` ${[...r.errors, ...r.warnings].join(" ")}`),
        h(
          "button",
          {
            type: "button",
            class: "ghost small",
            on: { click: () => (wiz.drafts.splice(i, 1), ws.rerender()) },
          },
          "Remove",
        ),
      ),
    );
  });
  return h(
    "div",
    { class: "pi-stack" },
    wiz.error ? h("p", { class: "pi-note", role: "status" }, wiz.error) : null,
    h(
      "p",
      {},
      "Correct anything that does not match the score report. Each cell holds level (top) and scale score (bottom).",
    ),
    h(
      "div",
      { class: "pi-table-wrap", role: "region", "aria-label": "Review table", tabindex: "0" },
      h(
        "table",
        { class: "pi-table pi-review" },
        h(
          "thead",
          {},
          h(
            "tr",
            {},
            ["Student", "Assessment", "Year", "Date", "Grade", ...DOMAINS, "Overall", "Status"].map(
              (x) => h("th", { scope: "col" }, x),
            ),
          ),
        ),
        h("tbody", {}, rows),
      ),
    ),
    h(
      "button",
      {
        type: "button",
        class: "btn small ghost",
        "data-add-row": "",
        on: { click: () => (wiz.drafts.push(blankDraft(wiz)), ws.rerender()) },
      },
      "Add a row",
    ),
    nav(ws, { next: () => ((wiz.step = 5), ws.rerender()), nextLabel: "Continue to save" }),
  );
}

function stepSave(ws) {
  const p = preview(ws);
  const replace = h("input", { type: "checkbox", id: "piReplace", checked: wiz.replace });
  replace.addEventListener("change", () => (wiz.replace = replace.checked));
  const verified = h("input", { type: "checkbox", id: "piVerified", checked: wiz.verified });
  verified.addEventListener("change", () => (wiz.verified = verified.checked));
  const take = p.summary.new + (wiz.replace ? p.summary.conflict : 0);
  return h(
    "div",
    { class: "pi-stack" },
    ws.mode === "demo"
      ? h(
          "p",
          { class: "pi-note", "data-demo-no-save": "" },
          "The Sample class never saves imports. Switch to My class at the top to import these rows.",
        )
      : h(
          "div",
          {},
          h(
            "p",
            {},
            `${p.summary.new} new result(s) ready; ${p.summary.conflict} conflict(s); ${p.summary.error + p.summary.duplicate} row(s) will be skipped.`,
          ),
          h(
            "label",
            { class: "pi-check", for: "piVerified" },
            verified,
            " I checked these values against the official score reports.",
          ),
          p.summary.conflict
            ? h(
                "label",
                { class: "pi-check", for: "piReplace" },
                replace,
                " Replace results already on file where they differ",
              )
            : null,
          h(
            "p",
            { class: "fine" },
            "Saved only in this browser on this device, beside your Teacher Hub roster. You can undo this import.",
          ),
          h(
            "button",
            {
              type: "button",
              class: "btn",
              "data-confirm-import": "",
              on: {
                click: () => {
                  const fresh = preview(ws);
                  for (const r of fresh.rows) r.row.verified = wiz.verified;
                  const at = new Date().toISOString();
                  const res = applyImport(loadStores(), fresh, {
                    replaceConflicts: wiz.replace,
                    importId: `imp-${Date.now().toString(36)}`,
                    at,
                    fileName: wiz.fileName || "manual entry",
                    sourceType: wiz.sourceType,
                  });
                  if (!saveStores(res.stores))
                    return ws.announce("This browser could not save (storage may be full).");
                  write(KEYS.imports, [...read(KEYS.imports, []), res.log].slice(-10));
                  audit("import", { source: wiz.sourceType, records: res.log.applied });
                  wiz.result = res.log;
                  wiz.firstStudent = fresh.rows.find(
                    (r) => r.status === "new" || r.status === "conflict",
                  )?.studentId;
                  wiz.step = 6;
                  ws.announce(`Imported ${res.log.applied} result(s).`);
                  ws.reload();
                },
              },
            },
            take ? `Import ${take} result(s)` : "Nothing to import",
          ),
        ),
    nav(ws),
  );
}

function stepAnalyze(ws) {
  return h(
    "div",
    { class: "pi-stack" },
    h(
      "p",
      { role: "status", "data-import-done": "" },
      `${wiz.result?.applied ?? 0} result(s) saved.`,
    ),
    h(
      "div",
      { class: "pi-row" },
      h(
        "button",
        {
          type: "button",
          class: "btn",
          "data-open-analysis": "",
          on: {
            click: () => {
              if (wiz.firstStudent) ws.selected = wiz.firstStudent;
              resetWizard();
              ws.go("overview");
            },
          },
        },
        "Open the analysis",
      ),
      h(
        "button",
        { type: "button", class: "btn ghost", on: { click: () => (resetWizard(), ws.rerender()) } },
        "Import more",
      ),
    ),
  );
}

function wizard(ws) {
  const body = [stepSource, stepIdentify, stepMap, stepValidate, stepReview, stepSave, stepAnalyze][
    wiz.step
  ](ws);
  return h(
    "section",
    { "aria-labelledby": "piWizT", class: "pi-wizard" },
    h("h3", { id: "piWizT" }, "Import data"),
    stepper(),
    body,
  );
}

function qualityPanel(ws) {
  const q = qualityReport(ws.students, { today: ws.today });
  return h(
    "section",
    { "aria-labelledby": "piQualTitle" },
    h(
      "h3",
      { id: "piQualTitle" },
      "Data quality",
      tip(
        "Data quality",
        "Checks for gaps and suspicious values in reported results. Nothing is changed automatically; fix the source record.",
      ),
    ),
    h(
      "ul",
      { class: "pi-stats" },
      Object.entries(q.counts).map(([k, v]) =>
        h("li", { "data-quality": k }, h("strong", {}, String(v)), ` ${QUALITY_WORDS[k]}`),
      ),
    ),
    q.findings.length
      ? table(
          "Data-quality findings",
          ["Student", "Check", "Detail"],
          q.findings.map((f) => [f.student, QUALITY_WORDS[f.kind], f.detail]),
        )
      : h(
          "p",
          { class: "pi-note" },
          ws.students.length ? "No data-quality issues found." : "No students yet.",
        ),
  );
}

function manage(ws) {
  if (ws.mode === "demo") return null;
  const st = ws.student();
  const log = read(KEYS.imports, []);
  const last = log.at(-1);
  const events = read(KEYS.audit, []);
  return h(
    "section",
    { "aria-labelledby": "piManT" },
    h("h3", { id: "piManT" }, "Manage records"),
    st
      ? table(
          `Results on file for ${st.name}`,
          ["Assessment", "Source", "Verified", ""],
          recordsOf(st).map((r) => [
            `${ASSESSMENTS[r.assessmentType].short} ${r.academicYear}${r.administrationDate ? ` ${r.administrationDate}` : ""}`,
            r.sourceType,
            r.sourceVerified ? "Yes" : "No",
            h(
              "button",
              {
                type: "button",
                class: "ghost small",
                "data-delete-record": r.assessmentId,
                on: {
                  click: () => {
                    saveStores(removeRow(loadStores(), st.id, r.assessmentId));
                    audit("delete-record", { records: 1 });
                    ws.announce("Result deleted.");
                    ws.reload();
                  },
                },
              },
              "Delete",
            ),
          ]),
        )
      : null,
    last
      ? h(
          "p",
          {},
          `Last import: ${last.applied} result(s) from ${last.fileName}, ${new Date(last.at).toLocaleString()}. `,
          h(
            "button",
            {
              type: "button",
              class: "btn small ghost",
              "data-undo-import": "",
              on: {
                click: () => {
                  saveStores(undoImport(loadStores(), last));
                  write(KEYS.imports, log.slice(0, -1));
                  audit("undo-import", { records: last.applied });
                  ws.announce("Import undone.");
                  ws.reload();
                },
              },
            },
            "Undo this import",
          ),
        )
      : null,
    h(
      "details",
      { class: "pi-more" },
      h("summary", {}, `Audit log (${events.length} events, no names or scores)`),
      events.length
        ? table(
            "Audit log",
            ["When", "Action", "Detail"],
            events
              .slice(-20)
              .reverse()
              .map((e) => [
                new Date(e.at).toLocaleString(),
                e.action,
                Object.entries(e)
                  .filter(([k]) => !["at", "action"].includes(k))
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", "),
              ]),
          )
        : h("p", { class: "fine" }, "Nothing logged yet."),
    ),
    h(
      "button",
      {
        type: "button",
        class: "btn small ghost",
        "data-delete-interim": "",
        on: {
          click: () => {
            const s = loadStores();
            saveStores({ official: s.official, interim: {} });
            write(KEYS.real, {});
            audit("delete-studio-data", {});
            ws.announce(
              "MODEL results and studio settings deleted. ACCESS results stay in the Teacher Hub, where its own Remove everything clears them.",
            );
            ws.reload();
          },
        },
      },
      "Delete MODEL results and studio settings",
    ),
  );
}

export function renderData(ws) {
  return h(
    "div",
    { class: "pi-stack" },
    heading(2, "Import and manage data"),
    wizard(ws),
    qualityPanel(ws),
    manage(ws),
  );
}
export { resetWizard };
