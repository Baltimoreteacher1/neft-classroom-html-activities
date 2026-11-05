// Data and import: the data-quality panel and the CSV import of historical ACCESS results (preview,
// confirm, undo). Imports write to the Teacher Hub's official-results store in Real mode only.
import { clear, h, table, tip } from "./dom.js";
import { applyImport, TEMPLATE, undoImport, validateImport } from "./import.js";
import { QUALITY_WORDS, qualityReport } from "./quality.js";
import { KEYS, read, write } from "./store.js";
import { heading } from "./view-common.js";

const STATUS_WORDS = {
  new: "Will import",
  conflict: "Conflict",
  unchanged: "Already on file",
  duplicate: "Duplicate",
  error: "Error",
};

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
        "Checks for gaps and suspicious values in official results. Nothing is changed automatically; fix the source record.",
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

function importPanel(ws) {
  if (ws.mode === "demo")
    return h(
      "section",
      { "aria-labelledby": "piImpTitle" },
      h("h3", { id: "piImpTitle" }, "Import historical ACCESS results"),
      h(
        "p",
        { class: "pi-note" },
        "Import is available in My class (real) mode only. Synthetic demonstration data is never mixed with real results.",
      ),
    );
  const out = h("div", { "aria-live": "polite" });
  const text = h("textarea", { id: "pi-csv", rows: 6, spellcheck: "false", placeholder: TEMPLATE });
  const file = h("input", { id: "pi-csv-file", type: "file", accept: ".csv,text/csv" });
  let fileName = "pasted.csv";
  file.addEventListener("change", async () => {
    const f = file.files?.[0];
    if (!f) return;
    fileName = f.name;
    text.value = await f.text();
  });
  const log = read(KEYS.imports, []);
  const last = log.at(-1);
  const preview = () => {
    clear(out);
    const roster = ws.students.filter((s) => s.onRoster).map((s) => ({ id: s.id, name: s.name }));
    const official = read(KEYS.official, {});
    const p = validateImport(text.value, { roster, official, today: ws.today });
    if (p.headerErrors.length) {
      out.append(h("p", { class: "pi-error", role: "alert" }, p.headerErrors.join(" ")));
      return;
    }
    const sm = p.summary;
    const replace = h("input", { type: "checkbox", id: "pi-replace" });
    out.append(
      h(
        "p",
        { id: "piImportSummary" },
        `${sm.total} rows: ${sm.new} to import, ${sm.conflict} conflict${sm.conflict === 1 ? "" : "s"}, ${sm.unchanged} already on file, ${sm.duplicate} duplicate${sm.duplicate === 1 ? "" : "s"}, ${sm.error} with errors.`,
      ),
      table(
        "Import preview",
        ["Line", "Student", "Year", "Domain", "Level", "Scale", "Status", "Notes"],
        p.rows.map((r) => [
          String(r.line),
          r.student || "—",
          r.year || "—",
          r.domain || "—",
          r.level != null ? r.level.toFixed(1) : "—",
          r.scale ?? "—",
          STATUS_WORDS[r.status],
          [...r.errors, ...r.flags].join(" ") || "—",
        ]),
      ),
      sm.conflict
        ? h(
            "div",
            { class: "pi-check" },
            replace,
            h(
              "label",
              { for: "pi-replace" },
              `Replace the existing official result for ${sm.conflict} conflicting row${sm.conflict === 1 ? "" : "s"}`,
            ),
          )
        : null,
      h(
        "button",
        {
          type: "button",
          class: "btn btn-primary",
          id: "piConfirmImport",
          disabled: !p.ok,
          on: {
            click: () => {
              const at = new Date().toISOString();
              const res = applyImport(read(KEYS.official, {}), p, {
                replaceConflicts: replace.checked,
                importId: `imp-${Date.now().toString(36)}`,
                at,
                fileName,
              });
              if (
                !write(KEYS.official, res.official) ||
                !write(KEYS.imports, [...read(KEYS.imports, []), res.log].slice(-10))
              ) {
                ws.announce(
                  "This browser could not save the import (storage may be full). Nothing was changed.",
                );
                return;
              }
              ws.reload();
              ws.announce(
                `Imported ${res.log.applied} official result${res.log.applied === 1 ? "" : "s"}.`,
              );
            },
          },
        },
        p.ok ? "Confirm import" : "Nothing to import",
      ),
    );
  };
  return h(
    "section",
    { "aria-labelledby": "piImpTitle" },
    h("h3", { id: "piImpTitle" }, "Import historical ACCESS results"),
    h(
      "p",
      { class: "fine" },
      "One row per student, school year and domain: student, year (2024-25), domain (Listening, Speaking, Reading, Writing or Overall), level (1.0-6.0), optional scale_score (100-600). Use the same student names as your roster. Results are saved only in this browser, in the same place as results typed in the Teacher Hub.",
    ),
    h(
      "a",
      {
        class: "btn small",
        href: `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`,
        download: "access-history-template.csv",
      },
      "Download a template",
    ),
    h("div", { class: "pi-field" }, h("label", { for: "pi-csv-file" }, "Choose a CSV file"), file),
    h("div", { class: "pi-field" }, h("label", { for: "pi-csv" }, "Or paste CSV text"), text),
    h(
      "button",
      { type: "button", class: "btn", id: "piCheckImport", on: { click: preview } },
      "Check and preview",
    ),
    out,
    last
      ? h(
          "div",
          { class: "pi-card" },
          h(
            "p",
            {},
            `Last import: ${last.fileName}, ${last.applied} result${last.applied === 1 ? "" : "s"} on ${last.at.slice(0, 10)}. Undo restores each touched year to how it was before that import, including any later edits to those years.`,
          ),
          h(
            "button",
            {
              type: "button",
              class: "btn",
              id: "piUndoImport",
              on: {
                click: () => {
                  const restored = undoImport(read(KEYS.official, {}), last);
                  if (!write(KEYS.official, restored) || !write(KEYS.imports, log.slice(0, -1))) {
                    ws.announce("This browser could not save the undo.");
                    return;
                  }
                  ws.reload();
                  ws.announce("Last import undone.");
                },
              },
            },
            "Undo last import",
          ),
        )
      : null,
  );
}

export function renderData(ws) {
  return h("div", {}, heading(2, "Data and import"), qualityPanel(ws), importPanel(ws));
}
