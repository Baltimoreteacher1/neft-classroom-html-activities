/* Forecast Engine — Data: add scores, import, class setup and records. */
(() => {
  "use strict";
  const NFE = window.NFE;
  const { esc, fmt, store } = NFE;
  NFE.views = NFE.views || {};

  const TABS = [
    ["add", "Add scores"],
    ["import", "Import"],
    ["setup", "Class setup"],
    ["records", "Records"],
  ];
  const D = {
    tab: "add",
    filter: "",
    std: "all",
    limit: 60,
    wide: null,
    report: null,
    entry: { student: "", standard: "", max: 10, date: "", assessment: "" },
  };

  const nextId = () => {
    const n = store.state.students.map((s) => Number(/^S(\d+)$/.exec(s.id)?.[1] || 0));
    return `S${String(Math.max(0, ...n) + 1).padStart(3, "0")}`;
  };
  const sampleBanner = () =>
    store.state.sample
      ? `<div class="banner" role="status"><div><strong>This is the sample class.</strong> Importing replaces it automatically. To type scores by hand, start with your own class first.</div><button class="btn small" data-act="fresh">Start with my class</button></div>`
      : "";

  /* ── Add scores ─────────────────────────────────────────────────────── */
  function addTab() {
    const s = store.state;
    const e = D.entry;
    if (!s.students.some((x) => x.id === e.student)) e.student = s.students[0]?.id || "";
    if (!s.standards.some((x) => x.code === e.standard)) e.standard = s.standards[0]?.code || "";
    e.date = e.date || store.today();
    const names = [...new Set(s.evidence.map((x) => x.assessment))].slice(0, 20);
    if (s.sample)
      return `${sampleBanner()}${NFE.empty("Add scores to your own class", "The sample class is for looking around. Start with your own class, then type scores here or import a file.", '<button class="btn primary" data-act="fresh">Start with my class</button>')}`;
    if (!s.students.length || !s.standards.length)
      return `${sampleBanner()}${NFE.empty("Set up your class first", "Add at least one student and one standard, then come back to enter scores.", '<button class="btn primary" data-dtab="setup">Open class setup</button>')}`;
    return `${sampleBanner()}
      <div class="plainset">
      <div class="grid g2">
        <section class="card"><h2>One score</h2>
          <form id="quick" class="form-grid" autocomplete="off">
            ${NFE.select({ id: "q-student", label: "Student", value: e.student, options: s.students.map((x) => [x.id, x.name]) })}
            ${NFE.select({ id: "q-standard", label: "Standard", value: e.standard, options: s.standards.map((x) => [x.code, `${x.code} · ${x.desc}`]) })}
            <div class="two"><label class="field"><span class="ctl-name">Score</span><input id="q-score" type="number" inputmode="decimal" min="0" step="any" required></label>
            <label class="field"><span class="ctl-name">Out of</span><input id="q-max" type="number" inputmode="decimal" min="1" step="any" value="${e.max}" required></label></div>
            <div class="two"><label class="field"><span class="ctl-name">Date</span><input id="q-date" type="date" value="${esc(e.date)}" required></label>
            <label class="field"><span class="ctl-name">Assessment</span><input id="q-assess" list="q-names" value="${esc(e.assessment)}" placeholder="Exit ticket"><datalist id="q-names">${names.map((n) => `<option value="${esc(n)}">`).join("")}</datalist></label></div>
            <button class="btn primary" type="submit">${NFE.icon("plus", 16)}Add score</button>
            <p class="muted small-note" id="q-status" role="status" aria-live="polite">Press Enter after typing a score to add it and move on.</p>
          </form></section>
        <section class="card"><h2>A whole class at once</h2>
          <form id="bulk" autocomplete="off">
            <div class="three">${NFE.select({ id: "b-standard", label: "Standard", value: e.standard, options: s.standards.map((x) => [x.code, x.code]) })}
            <label class="field"><span class="ctl-name">Out of</span><input id="b-max" type="number" min="1" step="any" value="${e.max}"></label>
            <label class="field"><span class="ctl-name">Date</span><input id="b-date" type="date" value="${esc(e.date)}"></label></div>
            <label class="field"><span class="ctl-name">Assessment</span><input id="b-assess" value="${esc(e.assessment)}" placeholder="Unit quiz"></label>
            <div class="table-wrap short"><table class="plain"><thead><tr><th scope="col">Student</th><th scope="col">Score</th></tr></thead><tbody>${s.students.map((x) => `<tr><th scope="row">${esc(x.name)}</th><td><input class="bulk-score" data-id="${esc(x.id)}" type="number" inputmode="decimal" min="0" step="any" aria-label="Score for ${esc(x.name)}"></td></tr>`).join("")}</tbody></table></div>
            <button class="btn primary" type="submit">Save all scores</button><p class="muted small-note" id="b-status" role="status" aria-live="polite">Leave a box empty to skip a student.</p>
          </form></section>
      </div></div>
      ${NFE.how("Forecasts get better with more scores, so make adding them fast. Use One score for a quick entry, or A whole class to type a column of results after a quiz. Dates matter: they let us see who is improving.", "Add the same standard a few times across weeks. Three or more scores per student is where the forecast gets reliable.")}`;
  }

  function addScore(student, standard, score, max, date, assessment) {
    if (!(score >= 0) || !(max > 0)) return "Enter a score of 0 or more and a maximum above 0.";
    if (score > max) return `A score of ${score} cannot be above ${max}.`;
    store.mutate((s) =>
      s.evidence.push(
        store.makeEvidence(student, standard, score, max, date, assessment || "Score"),
      ),
    );
    return "";
  }

  /* ── Import ─────────────────────────────────────────────────────────── */
  function importTab() {
    const r = D.report;
    return `${store.state.sample ? sampleBanner() : ""}
      <div class="grid g2">
        <section class="card"><h2>Upload a file</h2>
          <label class="drop" id="drop" tabindex="0"><input id="file" type="file" accept=".xlsx,.xls,.csv,.tsv,.txt,.html" hidden>${NFE.icon("upload", 28)}<strong>Drop a file here or choose one</strong><span>Excel, CSV or the Forecast template. A gradebook with one row per student works too.</span></label>
          <div class="btn-row"><a class="btn" href="./forecast-template.xls" download>${NFE.icon("download", 16)}Template (.xls)</a><button class="btn" id="dl-csv" type="button">${NFE.icon("download", 16)}Template (.csv)</button></div>
          <p class="muted small-note">The file is read in this browser. Nothing is uploaded. <span id="sheetjs"></span></p></section>
        <section class="card"><h2>Paste from a spreadsheet</h2><label class="field"><span class="ctl-name">Rows</span><textarea id="paste" spellcheck="false" placeholder="Copy rows from Excel or Google Sheets, with the header row, and paste here."></textarea></label><button class="btn primary" id="paste-go" type="button">Read pasted rows</button></section>
      </div>
      <div id="map"></div>
      <section class="card" aria-live="polite"><h2>Import results</h2><div id="report">${r ? reportHtml(r) : '<p class="muted">Nothing imported yet.</p>'}</div></section>
      <section class="card"><h2>Lesson grades</h2><p class="muted">Auto-graded lessons finished on this device are added automatically each time you open the tool. Re-syncing updates a lesson's row instead of duplicating it.</p><div class="btn-row"><button class="btn" id="sync" type="button">Sync lesson grades now</button></div><p class="muted" id="sync-status" role="status" aria-live="polite"></p></section>`;
  }
  function reportHtml(r) {
    return `<p><strong>Done.</strong> ${r.classes ? "Class details, " : ""}${fmt.plural(r.students, "new student")}, ${fmt.plural(r.standards, "new standard")}, ${fmt.plural(r.evidence, "score")} added.${r.replacedSample ? " The sample class was replaced." : ""}</p>${
      r.warnings.length
        ? `<details class="how" open><summary>${fmt.plural(r.warnings.length, "note")}</summary><ul class="plainlist">${r.warnings
            .slice(0, 30)
            .map((w) => `<li>${esc(w)}</li>`)
            .join(
              "",
            )}${r.warnings.length > 30 ? `<li class="muted">and ${r.warnings.length - 30} more</li>` : ""}</ul></details>`
        : '<p class="muted">No warnings.</p>'
    }<button class="btn small" type="button" data-act="undo">${NFE.icon("undo", 14)}Undo this import</button>`;
  }
  function mappingHtml(matrix) {
    const def = importers().wideDefaults(matrix);
    const heads = matrix[0];
    return `<section class="card"><h2>Match your columns</h2><p class="muted">This looks like a gradebook with one row per student. Choose which column names the student and which columns are scores.</p>
      <div class="preview table-wrap short"><table class="plain"><thead><tr>${heads.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${matrix
        .slice(1, 4)
        .map((r) => `<tr>${heads.map((_, i) => `<td>${esc(r[i] || "")}</td>`).join("")}</tr>`)
        .join("")}</tbody></table></div>
      <div class="three"><label class="field"><span class="ctl-name">Student column</span><select id="w-student">${heads.map((h, i) => `<option value="${i}"${i === def.studentCol ? " selected" : ""}>${esc(h || `Column ${i + 1}`)}</option>`).join("")}</select></label>
      <label class="field"><span class="ctl-name">Every score is out of</span><input id="w-max" type="number" min="1" value="100"></label>
      <label class="field"><span class="ctl-name">Date of these scores</span><input id="w-date" type="date" value="${store.today()}"></label></div>
      <fieldset class="checks"><legend class="ctl-name">Score columns (each becomes a standard)</legend>${heads.map((h, i) => (i === def.studentCol ? "" : `<label class="check"><input type="checkbox" class="w-col" value="${i}"${def.stdCols.includes(i) ? " checked" : ""}> ${esc(h || `Column ${i + 1}`)}</label>`)).join("")}</fieldset>
      <button class="btn primary" id="w-go" type="button">Import these scores</button></section>`;
  }
  const importers = () => NFE.importers;

  /* ── Class setup ────────────────────────────────────────────────────── */
  function setupTab() {
    const s = store.state;
    return `${sampleBanner()}
      <section class="card"><h2>Class</h2><div class="two"><label class="field"><span class="ctl-name">Class name</span><input id="c-name" value="${esc(s.class.name)}"></label><label class="field"><span class="ctl-name">Grade or course</span><input id="c-grade" value="${esc(s.class.grade)}" placeholder="Grade 6 Math"></label></div></section>
      <div class="grid g2">
        <section class="card"><h2>Students</h2><p class="muted small-note">Use IDs or first names with an initial to protect privacy. Tags like ML, IEP or Newcomer power the fairness check and never appear in exports unless you choose.</p>
          <div class="table-wrap short"><table class="plain"><thead><tr><th scope="col">ID</th><th scope="col">Name</th><th scope="col">Tags</th><th scope="col"><span class="sr">Remove</span></th></tr></thead><tbody>${s.students.map((x, i) => `<tr><td>${esc(x.id)}</td><td><input data-edit="students.${i}.name" value="${esc(x.name)}" aria-label="Name for ${esc(x.id)}"></td><td><input data-edit="students.${i}.tags" value="${esc(x.tags)}" aria-label="Tags for ${esc(x.name)}"></td><td><button class="btn small" type="button" data-del-student="${esc(x.id)}" aria-label="Remove ${esc(x.name)}">${NFE.icon("trash", 14)}</button></td></tr>`).join("")}</tbody></table></div>
          <form id="add-student" class="inline-form"><label class="field"><span class="ctl-name">New student</span><input id="n-name" placeholder="Name" required></label><label class="field"><span class="ctl-name">Tags</span><input id="n-tags" placeholder="ML, IEP"></label><button class="btn primary" type="submit">${NFE.icon("plus", 16)}Add</button></form>
          <details class="how"><summary>${NFE.icon("data", 16)}Paste a roster</summary><div class="how-body"><label class="field"><span class="ctl-name">One student per line, optional tags after a comma</span><textarea id="roster" placeholder="Maya R., ML&#10;Jordan T."></textarea></label><button class="btn" id="roster-go" type="button">Add these students</button></div></details></section>
        <section class="card"><h2>Standards</h2>
          <div class="table-wrap short"><table class="plain"><thead><tr><th scope="col">Code</th><th scope="col">What it covers</th><th scope="col"><span class="sr">Remove</span></th></tr></thead><tbody>${s.standards.map((x, i) => `<tr><td>${esc(x.code)}</td><td><input data-edit="standards.${i}.desc" value="${esc(x.desc)}" aria-label="Description for ${esc(x.code)}"></td><td><button class="btn small" type="button" data-del-standard="${esc(x.code)}" aria-label="Remove ${esc(x.code)}">${NFE.icon("trash", 14)}</button></td></tr>`).join("")}</tbody></table></div>
          <form id="add-standard" class="inline-form"><label class="field"><span class="ctl-name">Code</span><input id="n-code" placeholder="6.GR.A.1" required></label><label class="field"><span class="ctl-name">What it covers</span><input id="n-desc" placeholder="Find area of polygons"></label><button class="btn primary" type="submit">${NFE.icon("plus", 16)}Add</button></form></section>
      </div>`;
  }

  /* ── Records ────────────────────────────────────────────────────────── */
  function recordsTab() {
    const s = store.state;
    const q = D.filter.trim().toLowerCase();
    const rows = s.evidence
      .filter(
        (e) =>
          (D.std === "all" || e.standard === D.std) &&
          (!q ||
            `${e.student} ${store.studentName(e.student)} ${e.standard} ${e.assessment} ${e.date}`
              .toLowerCase()
              .includes(q)),
      )
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const shown = rows.slice(0, D.limit);
    return `<section class="card"><div class="card-head"><h2>${fmt.plural(rows.length, "record")}</h2><div class="inline-form tight"><label class="field"><span class="ctl-name">Search</span><input id="r-filter" type="search" value="${esc(D.filter)}" placeholder="Student, standard, assessment"></label>${NFE.select({ id: "r-std", label: "Standard", value: D.std, options: [["all", "All"], ...s.standards.map((x) => [x.code, x.code])] })}</div></div>
      ${rows.length ? `<div class="table-wrap"><table class="plain"><thead><tr><th scope="col">Date</th><th scope="col">Student</th><th scope="col">Standard</th><th scope="col">Assessment</th><th scope="col">Score</th><th scope="col"><span class="sr">Actions</span></th></tr></thead><tbody>${shown.map((e) => `<tr><td>${esc(e.date)}</td><td>${esc(store.studentName(e.student))}</td><td>${esc(e.standard)}</td><td>${esc(e.assessment)}</td><td>${e.score}/${e.max} <span class="muted">(${Math.round(e.pct)}%)</span></td><td class="row-actions"><button class="btn small" type="button" data-edit-rec="${esc(e.id)}">Edit</button><button class="btn small" type="button" data-del-rec="${esc(e.id)}" aria-label="Delete this record">${NFE.icon("trash", 14)}</button></td></tr>`).join("")}</tbody></table></div>${rows.length > shown.length ? `<div class="btn-row"><button class="btn" id="more" type="button">Show more (${rows.length - shown.length} left)</button></div>` : ""}` : '<p class="muted">No records match.</p>'}</section>`;
  }

  function editRecord(id) {
    const e = store.state.evidence.find((x) => x.id === id);
    if (!e) return;
    const dlg = document.createElement("dialog");
    dlg.className = "dlg";
    dlg.innerHTML = `<form method="dialog"><h2>Edit score</h2><p class="muted">${esc(store.studentName(e.student))} · ${esc(e.standard)}</p>
      <div class="two"><label class="field"><span class="ctl-name">Score</span><input name="score" type="number" step="any" min="0" value="${e.score}" required></label><label class="field"><span class="ctl-name">Out of</span><input name="max" type="number" step="any" min="1" value="${e.max}" required></label></div>
      <div class="two"><label class="field"><span class="ctl-name">Date</span><input name="date" type="date" value="${esc(e.date)}" required></label><label class="field"><span class="ctl-name">Assessment</span><input name="assess" value="${esc(e.assessment)}"></label></div>
      <p class="dlg-error" role="alert"></p><div class="dlg-actions"><button class="btn" value="cancel" formnovalidate>Cancel</button><button class="btn primary" value="save">Save</button></div></form>`;
    document.body.appendChild(dlg);
    dlg.addEventListener("close", () => dlg.remove());
    dlg.querySelector("form").addEventListener("submit", (ev) => {
      if (ev.submitter?.value !== "save") return;
      const f = new FormData(ev.target);
      const score = Number(f.get("score"));
      const max = Number(f.get("max"));
      if (score > max || !(max > 0)) {
        ev.preventDefault();
        dlg.querySelector(".dlg-error").textContent =
          "The score cannot be higher than what it is out of.";
        return;
      }
      store.mutate((s) => {
        const i = s.evidence.findIndex((x) => x.id === id);
        const row = store.makeEvidence(
          e.student,
          e.standard,
          score,
          max,
          String(f.get("date")),
          String(f.get("assess")) || e.assessment,
        );
        row.id = id;
        s.evidence[i] = row;
      });
      NFE.toast("Score updated.");
    });
    dlg.showModal();
  }

  const TAB_HTML = { add: addTab, import: importTab, setup: setupTab, records: recordsTab };

  function show(root, tab) {
    D.tab = tab;
    NFE.views.data.mount(root);
  }

  NFE.views.data = {
    mount(root) {
      const arrival = NFE.takeArrive();
      if (arrival?.tab && TABS.some(([k]) => k === arrival.tab)) {
        D.tab = arrival.tab;
        if (arrival.filter !== undefined) D.filter = store.studentName(arrival.filter);
      }
      root.innerHTML = `<div class="subtabs" role="tablist" aria-label="Data tasks">${TABS.map(([k, t]) => `<button role="tab" type="button" class="subtab${k === D.tab ? " on" : ""}" data-dtab="${k}" aria-selected="${k === D.tab}">${t}</button>`).join("")}</div><div id="data-body">${TAB_HTML[D.tab]()}</div>`;
      if (D.tab === "import") {
        const el = NFE.$("#sheetjs", root);
        if (el)
          el.textContent = window.XLSX
            ? "Excel reader ready."
            : window.__SHEETJS_FAILED
              ? "Excel reader unavailable offline: use CSV."
              : "";
        if (D.wide) NFE.$("#map", root).innerHTML = mappingHtml(D.wide);
      }
    },
    update() {},
    wire(root) {
      const status = (id, msg) => {
        const el = NFE.$(id, root);
        if (el) el.textContent = msg;
      };
      const readText = async (matrix) => {
        if (!matrix || matrix.length < 2)
          return NFE.toast("The file needs a header row and at least one row of data.");
        if (importers().isTemplate(matrix)) {
          D.wide = null;
          D.report = importers().importTemplate(importers().toObjects(matrix));
          NFE.views.data.mount(root);
          NFE.toast("Import finished.", { action: "Undo", onAction: () => {
            D.report = null;
            store.undo();
          } });
        } else {
          D.wide = matrix;
          NFE.$("#map", root).innerHTML = mappingHtml(matrix);
          NFE.$("#map", root).scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      };
      const loadFile = async (file) => {
        try {
          await readText(await importers().readFile(file));
        } catch (err) {
          NFE.notice("That file could not be read", `<p>${esc(err.message || String(err))}</p>`);
        }
      };

      root.addEventListener("click", (e) => {
        if (e.target.closest('[data-act="undo"]')) D.report = null;
        const tab = e.target.closest("[data-dtab]");
        if (tab) return show(root, tab.dataset.dtab);
        if (e.target.closest("#dl-csv"))
          return NFE.download("forecast-template.csv", importers().TEMPLATE_CSV, "text/csv");
        if (e.target.closest("#paste-go"))
          return readText(importers().parseMatrix(NFE.$("#paste", root).value));
        if (e.target.closest("#drop")) return NFE.$("#file", root).click();
        if (e.target.closest("#more")) {
          D.limit += 60;
          return show(root, "records");
        }
        if (e.target.closest("#sync")) {
          const n = store.syncLessons();
          if (n) store.changed();
          return status(
            "#sync-status",
            n
              ? `Imported ${fmt.plural(n, "lesson result")} from this device.`
              : "No new lesson results found on this device.",
          );
        }
        if (e.target.closest("#w-go")) {
          const stdCols = NFE.$$(".w-col", root)
            .filter((c) => c.checked)
            .map((c) => Number(c.value));
          const max = Number(NFE.$("#w-max", root).value);
          if (!stdCols.length || !(max > 0))
            return NFE.toast("Choose at least one score column and a maximum above 0.");
          D.report = importers().importWide(D.wide, {
            studentCol: Number(NFE.$("#w-student", root).value),
            stdCols,
            max,
            date: NFE.$("#w-date", root).value,
          });
          D.wide = null;
          NFE.views.data.mount(root);
          return NFE.toast("Import finished.", { action: "Undo", onAction: () => store.undo() });
        }
        if (e.target.closest("#roster-go")) {
          const lines = NFE.$("#roster", root)
            .value.split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
          if (!lines.length) return;
          return store.mutate(
            (s) => {
              lines.forEach((l) => {
                const [name, ...tags] = l.split(",");
                s.students.push({ id: nextId(), name: name.trim(), tags: tags.join(",").trim() });
              });
            },
            { undoable: true },
          );
        }
        const delStudent = e.target.closest("[data-del-student]")?.dataset.delStudent;
        if (delStudent) {
          const n = store.state.evidence.filter((x) => x.student === delStudent).length;
          return NFE.confirm(
            `${store.studentName(delStudent)} and ${fmt.plural(n, "score")} will be removed. You can undo this right after.`,
            { ok: "Remove student", danger: true },
          ).then((ok) => {
            if (ok)
              (store.mutate(
                (s) => {
                  s.students = s.students.filter((x) => x.id !== delStudent);
                  s.evidence = s.evidence.filter((x) => x.student !== delStudent);
                },
                { undoable: true },
              ),
                NFE.toast("Student removed.", { action: "Undo", onAction: () => store.undo() }));
          });
        }
        const delStd = e.target.closest("[data-del-standard]")?.dataset.delStandard;
        if (delStd) {
          const n = store.state.evidence.filter((x) => x.standard === delStd).length;
          return NFE.confirm(
            `${delStd} and ${fmt.plural(n, "score")} will be removed. You can undo this right after.`,
            { ok: "Remove standard", danger: true },
          ).then((ok) => {
            if (ok)
              (store.mutate(
                (s) => {
                  s.standards = s.standards.filter((x) => x.code !== delStd);
                  s.evidence = s.evidence.filter((x) => x.standard !== delStd);
                },
                { undoable: true },
              ),
                NFE.toast("Standard removed.", { action: "Undo", onAction: () => store.undo() }));
          });
        }
        const edit = e.target.closest("[data-edit-rec]")?.dataset.editRec;
        if (edit) return editRecord(edit);
        const del = e.target.closest("[data-del-rec]")?.dataset.delRec;
        if (del) {
          store.mutate(
            (s) => {
              s.evidence = s.evidence.filter((x) => x.id !== del);
            },
            { undoable: true },
          );
          NFE.toast("Score deleted.", { action: "Undo", onAction: () => store.undo() });
        }
      });

      root.addEventListener("change", (e) => {
        if (e.target.id === "file" && e.target.files[0]) loadFile(e.target.files[0]);
        if (e.target.id === "q-student") D.entry.student = e.target.value;
        if (e.target.id === "q-standard") D.entry.standard = e.target.value;
        if (e.target.id === "c-name" || e.target.id === "c-grade")
          store.quiet((s) => {
            s.class.name = NFE.$("#c-name", root).value;
            s.class.grade = NFE.$("#c-grade", root).value;
          });
        const ed = e.target.dataset?.edit;
        if (ed) {
          const [list, i, key] = ed.split(".");
          store.quiet((s) => {
            s[list][Number(i)][key] = e.target.value.trim() || s[list][Number(i)][key];
          });
        }
        if (e.target.id === "r-std") {
          D.std = e.target.value;
          D.limit = 60;
          show(root, "records");
        }
      });
      root.addEventListener("input", (e) => {
        if (e.target.id === "r-filter") {
          D.filter = e.target.value;
          D.limit = 60;
          const pos = e.target.selectionStart;
          NFE.$("#data-body", root).innerHTML = recordsTab();
          const box = NFE.$("#r-filter", root);
          box.focus();
          box.setSelectionRange(pos, pos);
        }
      });
      root.addEventListener("submit", (e) => {
        e.preventDefault();
        if (e.target.id === "quick") {
          const en = D.entry;
          en.max = Number(NFE.$("#q-max", root).value);
          en.date = NFE.$("#q-date", root).value;
          en.assessment = NFE.$("#q-assess", root).value;
          const score = Number(NFE.$("#q-score", root).value);
          const err = addScore(en.student, en.standard, score, en.max, en.date, en.assessment);
          if (err) return status("#q-status", err);
          show(root, "add");
          status("#q-status", `Added ${score}/${en.max} for ${store.studentName(en.student)}.`);
          NFE.$("#q-score", root).focus();
        }
        if (e.target.id === "bulk") {
          const std = NFE.$("#b-standard", root).value;
          const max = Number(NFE.$("#b-max", root).value);
          const date = NFE.$("#b-date", root).value;
          const assess = NFE.$("#b-assess", root).value || "Class scores";
          const entries = NFE.$$(".bulk-score", root)
            .filter((i) => i.value !== "")
            .map((i) => [i.dataset.id, Number(i.value)]);
          if (!entries.length) return status("#b-status", "Type at least one score first.");
          const bad = entries.find(([, v]) => v < 0 || v > max);
          if (bad || !(max > 0))
            return status(
              "#b-status",
              `Every score must be between 0 and ${max || "the maximum"}. Check ${bad ? store.studentName(bad[0]) : "the maximum"}.`,
            );
          D.entry.standard = std;
          D.entry.max = max;
          D.entry.date = date;
          D.entry.assessment = assess;
          store.mutate(
            (s) =>
              entries.forEach(([id, v]) =>
                s.evidence.push(store.makeEvidence(id, std, v, max, date, assess)),
              ),
            { undoable: true },
          );
          NFE.toast(`Saved ${fmt.plural(entries.length, "score")}.`, {
            action: "Undo",
            onAction: () => store.undo(),
          });
        }
        if (e.target.id === "add-student") {
          const name = NFE.$("#n-name", root).value.trim();
          if (!name) return;
          store.mutate((s) =>
            s.students.push({ id: nextId(), name, tags: NFE.$("#n-tags", root).value.trim() }),
          );
        }
        if (e.target.id === "add-standard") {
          const code = NFE.$("#n-code", root).value.trim();
          if (!code) return;
          if (store.state.standards.some((x) => x.code === code))
            return NFE.toast("That standard is already listed.");
          store.mutate((s) =>
            s.standards.push({
              code,
              desc: NFE.$("#n-desc", root).value.trim() || "Teacher-added standard",
            }),
          );
        }
      });

      const drop = () => NFE.$("#drop", root);
      root.addEventListener("dragover", (e) => {
        if (e.target.closest("#drop")) {
          e.preventDefault();
          drop().classList.add("over");
        }
      });
      root.addEventListener("dragleave", () => drop()?.classList.remove("over"));
      root.addEventListener("drop", (e) => {
        if (!e.target.closest("#drop")) return;
        e.preventDefault();
        drop().classList.remove("over");
        if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
      });
      root.addEventListener("keydown", (e) => {
        if (e.target.id === "drop" && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          NFE.$("#file", root).click();
        }
      });
    },
  };
})();
