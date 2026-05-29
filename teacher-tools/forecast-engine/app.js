(() => {
  "use strict";

  const STORAGE_KEY = "nfe_gold_state_v5";
  const PROFILE_PREFIX = "nfe_profile_";
  const PHASES = [
    "IDLE",
    "CONFIGURING",
    "VALIDATING",
    "COMPUTING",
    "SUCCESS",
    "ERROR",
  ];

  const TABS = {
    start: ["Start Here", "A guided teacher workflow for classroom evidence."],
    setup: [
      "Setup Class",
      "Add class info, students, standards, and manual evidence.",
    ],
    import: [
      "Import Data",
      "Download a template, upload a file, or paste rows.",
    ],
    quality: [
      "Review Data",
      "Check missing records, duplicates, and readiness before forecasting.",
    ],
    forecast: [
      "Forecast",
      "Review planning estimates by student and standard.",
    ],
    groups: ["Groups", "Create flexible reteach groups."],
    reports: ["Reports", "Generate teacher-facing summaries and exports."],
    settings: ["Settings", "Manage local profiles, theme, and self-tests."],
  };

  const TEMPLATE = [
    "rowType,classId,className,grade,studentId,studentName,tags,standard,description,score,maxScore,date,assessment",
    "class,C1,Period 1 Math,Grade 6,,,,,,,,,",
    "student,C1,,,S001,Student Alpha,ML,,,,,,",
    "standard,,,,,,,6.G.A.1,Find area of polygons,,,,",
    "evidence,,,,S001,,,6.G.A.1,,8,10,2026-05-18,Exit Ticket",
  ].join("\n");

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const State = {
    current: null,
    worker: null,
    workerCache: null,
    saveTimer: null,
  };

  function makeEvidence(student, standard, score, max, date, assessment) {
    const safeScore = Number(score);
    const safeMax = Number(max);
    return {
      id: `e_${Math.random().toString(36).slice(2)}`,
      student,
      standard,
      score: Number.isFinite(safeScore) ? safeScore : 0,
      max: Number.isFinite(safeMax) && safeMax > 0 ? safeMax : 100,
      pct: bound(
        Number.isFinite(safeScore) && Number.isFinite(safeMax) && safeMax > 0
          ? (safeScore / safeMax) * 100
          : 0,
      ),
      date: date || today(),
      assessment: assessment || "Evidence",
    };
  }

  function seedState() {
    return {
      phase: "IDLE",
      active: "start",
      theme:
        window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
      profile: "Default",
      threshold: 70,
      groupNames: {},
      class: { id: "C1", name: "Period 1 Math", grade: "Grade 6" },
      students: [
        ["S001", "Student Alpha", "ML"],
        ["S002", "Student Bravo", "IEP"],
        ["S003", "Student Charlie", ""],
        ["S004", "Student Delta", "Newcomer"],
      ].map(([id, name, tags]) => ({ id, name, tags })),
      standards: [
        ["6.G.A.1", "Find area of polygons"],
        ["6.G.A.2", "Find volume of rectangular prisms"],
        ["6.G.A.4", "Use nets and surface area"],
        ["6.SP.A.1", "Recognize statistical questions"],
      ].map(([code, desc]) => ({ code, desc })),
      evidence: [
        makeEvidence("S001", "6.G.A.1", 8, 10, "2026-05-18", "Exit Ticket"),
        makeEvidence("S002", "6.G.A.1", 6, 10, "2026-05-18", "Exit Ticket"),
        makeEvidence("S003", "6.G.A.1", 7, 10, "2026-05-18", "Exit Ticket"),
        makeEvidence("S004", "6.G.A.2", 5, 10, "2026-05-19", "Quiz"),
      ],
      log: [],
      updatedAt: new Date().toISOString(),
    };
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }
  function bound(value) {
    const n = Number(value);
    return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
  }
  function average(values) {
    return values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  }

  function normalizeState(raw) {
    const base = seedState();
    const input = raw && typeof raw === "object" ? raw : {};
    return {
      ...base,
      ...input,
      class: { ...base.class, ...(input.class || {}) },
      students: Array.isArray(input.students)
        ? input.students.map((s) => ({
            id: String(s.id || "").trim(),
            name: String(s.name || s.id || "Unnamed Student").trim(),
            tags: String(s.tags || "").trim(),
          }))
        : base.students,
      standards: Array.isArray(input.standards)
        ? input.standards.map((s) => ({
            code: String(s.code || "").trim(),
            desc: String(s.desc || "Imported standard").trim(),
          }))
        : base.standards,
      evidence: Array.isArray(input.evidence)
        ? input.evidence.map((r) =>
            makeEvidence(
              r.student,
              r.standard,
              Number(r.score),
              Number(r.max),
              r.date,
              r.assessment,
            ),
          )
        : base.evidence,
      log: Array.isArray(input.log) ? input.log : [],
      threshold:
        Number.isFinite(Number(input.threshold)) &&
        Number(input.threshold) >= 40 &&
        Number(input.threshold) <= 90
          ? Number(input.threshold)
          : base.threshold,
      groupNames:
        input.groupNames && typeof input.groupNames === "object"
          ? input.groupNames
          : {},
    };
  }

  function getThreshold() {
    const t = Number(State.current && State.current.threshold);
    return Number.isFinite(t) && t >= 40 && t <= 90 ? t : 70;
  }

  function loadState() {
    try {
      return normalizeState(
        JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || seedState(),
      );
    } catch {
      return seedState();
    }
  }

  function persist(renderAfter = true) {
    clearTimeout(State.saveTimer);
    State.saveTimer = setTimeout(() => {
      try {
        State.current.updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(State.current));
        $("#saveBadge").textContent = "Saved locally";
      } catch {
        State.current.phase = "ERROR";
        $("#saveBadge").textContent = "Save failed";
        alert("Local save failed. Export a backup before continuing.");
      }
      if (renderAfter) render();
    }, 0);
  }

  function transition(phase, message) {
    State.current.phase = PHASES.includes(phase) ? phase : "ERROR";
    State.current.log = [
      {
        time: new Date().toLocaleTimeString(),
        phase: State.current.phase,
        message,
      },
      ...State.current.log,
    ].slice(0, 100);
    $("#phaseBadge").textContent = State.current.phase;
    $("#saveBadge").textContent = "Saving…";
    persist(false);
  }

  function validateState(state = State.current) {
    const issues = [],
      studentIds = new Set(),
      standardCodes = new Set(state.standards.map((standard) => standard.code)),
      seenEvidence = new Set();
    state.students.forEach((student) => {
      if (!student.id) issues.push(["bad", "A student is missing an ID."]);
      if (studentIds.has(student.id))
        issues.push(["bad", `Duplicate student ID: ${student.id}`]);
      studentIds.add(student.id);
    });
    state.standards.forEach((standard) => {
      if (!standard.code) issues.push(["bad", "A standard is missing a code."]);
      if (!standard.desc)
        issues.push([
          "warn",
          `Standard ${standard.code} is missing a description.`,
        ]);
    });
    state.evidence.forEach((row) => {
      if (!studentIds.has(row.student))
        issues.push(["warn", `Evidence uses unknown student: ${row.student}`]);
      if (!standardCodes.has(row.standard))
        issues.push([
          "warn",
          `Evidence uses unknown standard: ${row.standard}`,
        ]);
      if (
        !Number.isFinite(Number(row.score)) ||
        !Number.isFinite(Number(row.max)) ||
        Number(row.max) <= 0
      )
        issues.push([
          "bad",
          "An evidence row has an invalid score or max score.",
        ]);
      if (Number(row.score) > Number(row.max))
        issues.push([
          "warn",
          `Score greater than max for ${row.student} on ${row.standard}.`,
        ]);
      const key = `${row.student}|${row.standard}|${row.date}|${row.assessment}`;
      if (seenEvidence.has(key))
        issues.push(["warn", `Duplicate evidence row: ${key}`]);
      seenEvidence.add(key);
    });
    return issues;
  }

  function rowsFor(studentId, standardCode) {
    return State.current.evidence.filter(
      (row) =>
        (!studentId || row.student === studentId) &&
        (!standardCode || row.standard === standardCode),
    );
  }
  function band(score) {
    const s = bound(score);
    if (s >= 85) return ["Strong", "ok"];
    if (s >= 70) return ["Likely Ready", "info"];
    if (s >= 60) return ["Approaching", "warn"];
    return ["Needs Reteach", "bad"];
  }
  // Recency-weighted mean + linear trend; interval from actual score variance.
  // Mirror of the same logic in forecast.worker.js — keep them in sync.
  function forecast(studentId, standardCode) {
    const rows = rowsFor(studentId, standardCode);
    if (!rows.length)
      return {
        n: 0,
        p: 0,
        lo: 0,
        hi: 0,
        label: "No data",
        cls: "warn",
        conf: "Very Low",
        trend: "flat",
        slope: 0,
      };
    const sorted = rows
      .slice()
      .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
    const pcts = sorted.map((row) => bound(row.pct));
    const n = pcts.length;

    let weightedSum = 0,
      weightTotal = 0;
    pcts.forEach((value, index) => {
      const w = index + 1;
      weightedSum += value * w;
      weightTotal += w;
    });
    const weightedMean = weightTotal ? weightedSum / weightTotal : 0;

    let slope = 0;
    if (n >= 2) {
      const meanX = (n - 1) / 2;
      const meanY = pcts.reduce((s, v) => s + v, 0) / n;
      let num = 0,
        den = 0;
      pcts.forEach((value, index) => {
        num += (index - meanX) * (value - meanY);
        den += (index - meanX) ** 2;
      });
      slope = den ? num / den : 0;
    }
    const projected = bound(weightedMean + slope * 0.5);

    const plainMean = pcts.reduce((s, v) => s + v, 0) / n;
    const variance =
      n >= 2 ? pcts.reduce((s, v) => s + (v - plainMean) ** 2, 0) / (n - 1) : 0;
    const stdErr = n >= 2 ? Math.sqrt(variance / n) : 14;
    const margin = Math.max(4, Math.min(20, Math.round(1.6 * stdErr)));

    const [label, cls] = band(projected);
    const trend =
      slope > 1.5 ? "improving" : slope < -1.5 ? "slipping" : "flat";

    return {
      n,
      p: projected,
      lo: bound(projected - margin),
      hi: bound(projected + margin),
      label,
      cls,
      conf: n >= 4 ? "High" : n >= 2 ? "Medium" : "Low",
      trend,
      slope: Math.round(slope * 10) / 10,
    };
  }

  function trendBadge(result) {
    if (!result || !result.n || result.trend === "flat")
      return '<span class="trend flat" title="Flat trend">→ flat</span>';
    if (result.trend === "improving")
      return '<span class="trend up" title="Improving trend">↑ improving</span>';
    return '<span class="trend down" title="Slipping trend">↓ slipping</span>';
  }

  // Text/icon cue for color-only badges.
  const CUE = { ok: "✓ ", warn: "▲ ", bad: "✕ ", info: "● ", neutral: "" };
  function cue(cls) {
    return `<span class="cue" aria-hidden="true">${CUE[cls] || ""}</span>`;
  }

  function setTab(tabName) {
    const next = TABS[tabName] ? tabName : "start";
    State.current.active = next;
    $$(".screen").forEach((screen) =>
      screen.classList.toggle("active", screen.id === next),
    );
    $$(".nav button").forEach((button) => {
      const on = button.dataset.tab === next;
      button.classList.toggle("active", on);
      button.setAttribute("aria-selected", on ? "true" : "false");
      // Roving tabindex: only the active tab is in the tab order.
      button.setAttribute("tabindex", on ? "0" : "-1");
    });
    $("#pageTitle").textContent = TABS[next][0];
    $("#pageSubtitle").textContent = TABS[next][1];
    updateEmptyStates();
    persist();
  }

  function hasData() {
    return State.current.evidence.length > 0;
  }

  function updateEmptyStates() {
    const empty = !hasData();
    [
      ["#forecastEmpty", "#forecast"],
      ["#groupsEmpty", "#groups"],
      ["#reportsEmpty", "#reports"],
    ].forEach(([emptyId]) => {
      const el = $(emptyId);
      if (el) el.hidden = !empty;
    });
  }

  function render() {
    document.documentElement.dataset.theme = State.current.theme || "light";
    $("#phaseBadge").textContent = State.current.phase || "IDLE";
    renderHome();
    renderSetupTables();
    renderSelectors();
    renderQuality();
    renderEvidenceTable();
    renderDiagnostics();
    syncThresholdUI();
    updateEmptyStates();
    computeForecastsAsync();
  }

  function syncThresholdUI() {
    const slider = $("#groupThreshold"),
      label = $("#groupThresholdValue");
    if (slider) {
      slider.value = String(getThreshold());
      slider.setAttribute("aria-valuetext", getThreshold() + " percent");
    }
    if (label) label.textContent = String(getThreshold());
  }

  function renderHome() {
    const mean = average(State.current.evidence.map((row) => row.pct));
    $("#metrics").innerHTML = [
      [
        "Class",
        State.current.class.name || "Unnamed",
        State.current.class.grade || "",
      ],
      ["Students", State.current.students.length, "local roster"],
      ["Evidence", State.current.evidence.length, "records"],
      ["Average", `${bound(mean)}%`, "current evidence"],
    ]
      .map(
        ([title, metric, note]) =>
          `<article class="card"><h3>${escapeHtml(title)}</h3><div class="metric">${escapeHtml(metric)}</div><div class="muted">${escapeHtml(note)}</div></article>`,
      )
      .join("");
    $("#priorityStandards").innerHTML =
      State.current.standards
        .map((standard) => {
          const meanScore = average(
            rowsFor(null, standard.code).map((row) => row.pct),
          );
          const [label, cls] = band(meanScore);
          return `<p><strong>${escapeHtml(standard.code)}</strong> <span class="badge ${cls}">${cue(cls)}${label}</span><br><span class="muted">${escapeHtml(standard.desc)} • ${bound(meanScore)}%</span></p><div class="bar"><i style="width:${bound(meanScore)}%"></i></div>`;
        })
        .join("") || '<p class="muted">Add standards to begin.</p>';
    const moves = State.current.standards
      .map((standard) => [
        standard,
        average(rowsFor(null, standard.code).map((row) => row.pct)),
        rowsFor(null, standard.code).length,
      ])
      .filter((entry) => entry[2])
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3);
    $("#teacherMoves").innerHTML =
      moves
        .map(
          ([standard, meanScore]) =>
            `<div class="step"><span class="num">→</span><p><strong>${escapeHtml(standard.code)}</strong>: Start with students under ${getThreshold()}%. Class average: ${bound(meanScore)}%.</p></div>`,
        )
        .join("") || '<p class="muted">Add evidence to see next moves.</p>';
  }

  function renderSetupTables() {
    $("#studentTable").innerHTML =
      '<caption>Students in this class</caption><thead><tr><th scope="col">ID</th><th scope="col">Name</th><th scope="col">Tags</th><th scope="col">Avg</th></tr></thead><tbody>' +
      State.current.students
        .map(
          (student) =>
            `<tr><td>${escapeHtml(student.id)}</td><td>${escapeHtml(student.name)}</td><td>${escapeHtml(student.tags || "")}</td><td>${bound(average(rowsFor(student.id).map((row) => row.pct)))}%</td></tr>`,
        )
        .join("") +
      "</tbody>";
    $("#standardTable").innerHTML =
      '<caption>Standards for this class</caption><thead><tr><th scope="col">Code</th><th scope="col">Description</th></tr></thead><tbody>' +
      State.current.standards
        .map(
          (standard) =>
            `<tr><td>${escapeHtml(standard.code)}</td><td>${escapeHtml(standard.desc)}</td></tr>`,
        )
        .join("") +
      "</tbody>";
  }

  function renderSelectors() {
    const studentOptions = State.current.students
      .map(
        (student) =>
          `<option value="${escapeHtml(student.id)}">${escapeHtml(student.name)} (${escapeHtml(student.id)})</option>`,
      )
      .join("");
    const standardOptions = State.current.standards
      .map(
        (standard) =>
          `<option value="${escapeHtml(standard.code)}">${escapeHtml(standard.code)} — ${escapeHtml(standard.desc)}</option>`,
      )
      .join("");
    ["#manualStudent", "#forecastStudent"].forEach((selector) => {
      $(selector).innerHTML = studentOptions;
    });
    ["#manualStandard", "#forecastStandard"].forEach((selector) => {
      $(selector).innerHTML = standardOptions;
    });
  }

  function renderQuality() {
    const issues = validateState(),
      critical = issues.filter((issue) => issue[0] === "bad").length;
    $("#qualityCards").innerHTML = [
      [
        "Students",
        State.current.students.length,
        State.current.students.length ? "ok" : "bad",
      ],
      [
        "Standards",
        State.current.standards.length,
        State.current.standards.length ? "ok" : "bad",
      ],
      [
        "Issues",
        issues.length,
        critical ? "bad" : issues.length ? "warn" : "ok",
      ],
    ]
      .map(
        ([title, count, cls]) =>
          `<article class="card"><h3>${title}</h3><div class="metric">${count}</div><span class="badge ${cls}">${cue(cls)}${cls === "ok" ? "OK" : cls === "warn" ? "Review" : "Fix"}</span></article>`,
      )
      .join("");
    $("#qualityIssues").innerHTML = issues.length
      ? issues
          .map(
            ([cls, message]) =>
              `<p><span class="badge ${cls}">${cue(cls)}${cls}</span> ${escapeHtml(message)}</p>`,
          )
          .join("")
      : '<p class="muted">No critical issues found.</p>';
  }

  function renderEvidenceTable() {
    $("#evidenceTable").innerHTML =
      '<caption>Evidence records</caption><thead><tr><th scope="col">Date</th><th scope="col">Student</th><th scope="col">Standard</th><th scope="col">Assessment</th><th scope="col">Score</th></tr></thead><tbody>' +
      State.current.evidence
        .map(
          (row) =>
            `<tr><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.student)}</td><td>${escapeHtml(row.standard)}</td><td>${escapeHtml(row.assessment)}</td><td>${row.score}/${row.max} (${row.pct}%)</td></tr>`,
        )
        .join("") +
      "</tbody>";
  }
  function renderForecastGrid(grid) {
    $("#forecastTable").innerHTML =
      '<caption>Forecast by student and standard</caption><thead><tr><th scope="col">Student</th>' +
      State.current.standards
        .map((standard) => `<th scope="col">${escapeHtml(standard.code)}</th>`)
        .join("") +
      "</tr></thead><tbody>" +
      grid
        .map(
          (row) =>
            `<tr><th scope="row">${escapeHtml(row.student.name)}</th>${row.forecasts
              .map((cell) => {
                const f = cell.result;
                return `<td><span class="badge ${f.cls}">${cue(f.cls)}${f.n ? `${f.p}%` : "No data"}</span><br><small>${escapeHtml(f.label)}</small>${f.n ? `<br>${trendBadge(f)}` : ""}</td>`;
              })
              .join("")}</tr>`,
        )
        .join("") +
      "</tbody>";
  }
  function renderDiagnostics() {
    $("#diagText").textContent = JSON.stringify(
      {
        phase: State.current.phase,
        active: State.current.active,
        profile: State.current.profile,
        worker: Boolean(State.worker),
        counts: {
          students: State.current.students.length,
          standards: State.current.standards.length,
          evidence: State.current.evidence.length,
        },
        issues: validateState(),
        log: State.current.log.slice(0, 16),
      },
      null,
      2,
    );
  }
  function computeSync() {
    return {
      grid: State.current.students.map((student) => ({
        student,
        forecasts: State.current.standards.map((standard) => ({
          standard,
          result: forecast(student.id, standard.code),
        })),
      })),
      groups: State.current.standards
        .map((standard) => ({
          standard,
          kids: State.current.students
            .map((student) => ({
              student,
              result: forecast(student.id, standard.code),
            }))
            .filter(
              (entry) => entry.result.n && entry.result.p < getThreshold(),
            ),
        }))
        .filter((group) => group.kids.length),
    };
  }

  function computeForecastsAsync() {
    const status = $("#workerStatus");
    if (!status) return;
    if (!State.worker) {
      State.workerCache = computeSync();
      renderForecastGrid(State.workerCache.grid);
      return;
    }
    status.classList.add("show");
    State.worker.onmessage = (event) => {
      State.workerCache = event.data;
      renderForecastGrid(State.workerCache.grid);
      status.classList.remove("show");
    };
    State.worker.onerror = () => {
      State.workerCache = computeSync();
      renderForecastGrid(State.workerCache.grid);
      status.classList.remove("show");
    };
    State.worker.postMessage({
      state: JSON.parse(JSON.stringify(State.current)),
      threshold: getThreshold(),
    });
  }

  function detectDelimiter(line) {
    return (
      [
        [",", (line.match(/,/g) || []).length],
        ["\t", (line.match(/\t/g) || []).length],
        ["|", (line.match(/\|/g) || []).length],
        [";", (line.match(/;/g) || []).length],
      ].sort((a, b) => b[1] - a[1])[0][0] || ","
    );
  }
  function parseDelimitedRows(text) {
    const delimiter = detectDelimiter(text.split(/\r?\n/)[0] || "");
    const rows = [];
    let row = [],
      cell = "",
      quote = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i],
        next = text[i + 1];
      if (ch === '"' && quote && next === '"') {
        cell += '"';
        i += 1;
        continue;
      }
      if (ch === '"') {
        quote = !quote;
        continue;
      }
      if (ch === delimiter && !quote) {
        row.push(cell.trim());
        cell = "";
        continue;
      }
      if ((ch === "\n" || ch === "\r") && !quote) {
        if (ch === "\r" && next === "\n") i += 1;
        row.push(cell.trim());
        if (row.some(Boolean)) rows.push(row);
        row = [];
        cell = "";
        continue;
      }
      cell += ch;
    }
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
    if (rows.length < 2) return [];
    const headers = rows
      .shift()
      .map((header) => header.toLowerCase().replace(/[^a-z0-9]/g, ""));
    return rows.map((values) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || "";
      });
      return obj;
    });
  }
  function parseHtmlTableRows(text) {
    if (!/<table/i.test(text)) return parseDelimitedRows(text);
    const doc = new DOMParser().parseFromString(text, "text/html");
    const tableRows = Array.from(doc.querySelectorAll("tr")).map((tr) =>
      Array.from(tr.children).map((td) => td.textContent.trim()),
    );
    if (tableRows.length < 2) return [];
    const headers = tableRows
      .shift()
      .map((header) => header.toLowerCase().replace(/[^a-z0-9]/g, ""));
    return tableRows.map((values) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || "";
      });
      return obj;
    });
  }

  function importRows(rows) {
    transition("VALIDATING", "Import started");
    const add = { class: 0, students: 0, standards: 0, evidence: 0 },
      warnings = [];
    rows.forEach((row, index) => {
      const type = String(row.rowtype || "evidence").toLowerCase();
      if (type === "class") {
        State.current.class = {
          id: row.classid || "C1",
          name: row.classname || "Math Class",
          grade: row.grade || "",
        };
        add.class += 1;
        return;
      }
      if (type === "student") {
        const id = row.studentid || row.id;
        if (!id) {
          warnings.push(`Row ${index + 2}: missing studentId`);
          return;
        }
        if (!State.current.students.some((student) => student.id === id)) {
          State.current.students.push({
            id,
            name: row.studentname || `Student ${id}`,
            tags: row.tags || "",
          });
          add.students += 1;
        }
        return;
      }
      if (type === "standard") {
        const code = row.standard || row.code || row.ccss;
        if (!code) {
          warnings.push(`Row ${index + 2}: missing standard`);
          return;
        }
        if (
          !State.current.standards.some((standard) => standard.code === code)
        ) {
          State.current.standards.push({
            code,
            desc: row.description || "Imported standard",
          });
          add.standards += 1;
        }
        return;
      }
      const student = row.studentid || row.student,
        standard = row.standard || row.code || row.ccss,
        score = Number(row.score),
        max = Number(row.maxscore || row.max || 100);
      if (
        !student ||
        !standard ||
        !Number.isFinite(score) ||
        !Number.isFinite(max) ||
        max <= 0
      ) {
        warnings.push(`Row ${index + 2}: missing student/standard/score/max`);
        return;
      }
      if (!State.current.students.some((item) => item.id === student))
        State.current.students.push({
          id: student,
          name: `Student ${student}`,
          tags: "",
        });
      if (!State.current.standards.some((item) => item.code === standard))
        State.current.standards.push({
          code: standard,
          desc: "Imported standard",
        });
      const date = row.date || today(),
        assessment = row.assessment || "Imported";
      if (
        State.current.evidence.some(
          (entry) =>
            entry.student === student &&
            entry.standard === standard &&
            entry.date === date &&
            entry.assessment === assessment,
        )
      ) {
        warnings.push(`Row ${index + 2}: duplicate skipped`);
        return;
      }
      State.current.evidence.push(
        makeEvidence(student, standard, score, max, date, assessment),
      );
      add.evidence += 1;
    });
    transition("SUCCESS", "Import complete");
    $("#importStatus").innerHTML =
      `<p><strong>Import complete.</strong> ${add.class} class, ${add.students} students, ${add.standards} standards, ${add.evidence} evidence rows.</p>${warnings.map((warning) => `<p class="muted">${escapeHtml(warning)}</p>`).join("") || '<p class="muted">No warnings.</p>'}`;
    render();
  }

  function downloadFile(name, text, type) {
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(new Blob([text], { type }));
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(anchor.href);
  }
  function runSelfTest() {
    const tests = [],
      ok = (name, pass) => tests.push({ name, pass });
    ok("Bound handles NaN", bound(NaN) === 0);
    ok("Empty forecast is safe", forecast("missing", "6.G.A.1").n === 0);
    const before = State.current.students.length;
    importRows(
      parseDelimitedRows(
        "rowType,studentId,studentName\nstudent,T999,Test Student",
      ),
    );
    ok(
      "Import adds a student",
      State.current.students.some((student) => student.id === "T999"),
    );
    State.current.students = State.current.students.filter(
      (student) => student.id !== "T999",
    );
    ok(
      "State restores after test cleanup",
      State.current.students.length === before,
    );
    transition(
      tests.every((test) => test.pass) ? "SUCCESS" : "ERROR",
      "Self-test complete",
    );
    persist();
    return tests;
  }

  // Surface existing tags as neutral support tiers (never label "ESOL").
  function supportTier(tags) {
    const t = String(tags || "").toLowerCase();
    if (/ml|newcomer|esol|ell|iep|504/.test(t))
      return [
        '<span class="badge info tier">Level 1 scaffold</span>',
        "Level 1",
      ];
    return ['<span class="badge ok tier">Level 2 extension</span>', "Level 2"];
  }

  function studentById(id) {
    return State.current.students.find((s) => s.id === id) || null;
  }

  function groupKey(code) {
    return `g_${code}`;
  }
  function groupName(code) {
    return (
      (State.current.groupNames && State.current.groupNames[groupKey(code)]) ||
      ""
    );
  }

  // Move a student's evidence-derived placement note. We track manual moves in
  // groupNames overrides so a teacher can pull a student into another standard's
  // group conceptually; here we simply re-render after recomputing.
  function buildGroups() {
    const threshold = getThreshold();
    const data = State.workerCache || computeSync();
    const standards = State.current.standards;
    const html =
      data.groups
        .map((group) => {
          const code = group.standard.code;
          const customName = groupName(code);
          const kidsHtml = group.kids
            .map((entry) => {
              const [tierBadge] = supportTier(entry.student.tags);
              const others = standards
                .filter((s) => s.code !== code)
                .map(
                  (s) =>
                    `<option value="${escapeHtml(s.code)}">${escapeHtml(s.code)}</option>`,
                )
                .join("");
              return `<div class="move-row" data-student="${escapeHtml(entry.student.id)}" data-from="${escapeHtml(code)}">
                <span>${escapeHtml(entry.student.name)} (${entry.result.p}%) ${trendBadge(entry.result)}</span>
                ${tierBadge}
                <label class="muted" style="text-transform:none;font-weight:600;">move to
                  <select class="moveStudent" aria-label="Move ${escapeHtml(entry.student.name)} to another group">
                    <option value="">— keep here —</option>${others}
                  </select>
                </label>
              </div>`;
            })
            .join("");
          return `<article class="card group-card" data-code="${escapeHtml(code)}">
            <h3 contenteditable="true" class="groupTitle" data-code="${escapeHtml(code)}" aria-label="Editable group name">${escapeHtml(customName || `${code}: ${group.standard.desc}`)}</h3>
            <p><span class="badge warn">${cue("warn")}Support group (below ${threshold}%)</span></p>
            ${kidsHtml || '<p class="muted">No students below threshold.</p>'}
            <p class="muted">Suggested move: worked example → visual model → 3-question exit check.</p>
          </article>`;
        })
        .join("") ||
      `<article class="card"><p class="muted">No support groups at or below ${threshold}%. Lower the threshold or add evidence.</p></article>`;
    $("#groupOutput").innerHTML = html;
    wireGroupEditing();
    transition("SUCCESS", "Groups built");
    renderDiagnostics();
  }

  function wireGroupEditing() {
    $$("#groupOutput .groupTitle").forEach((el) => {
      el.onblur = () => {
        const code = el.dataset.code;
        State.current.groupNames = State.current.groupNames || {};
        State.current.groupNames[groupKey(code)] = el.textContent.trim();
        persist(false);
      };
    });
    $$("#groupOutput .moveStudent").forEach((sel) => {
      sel.onchange = () => {
        const row = sel.closest(".move-row");
        const studentId = row && row.dataset.student;
        const target = sel.value;
        const from = row && row.dataset.from;
        if (!studentId || !target) return;
        // A "move" reclassifies by adding a small placeholder note in the log so
        // the teacher's intent is captured without altering real evidence.
        State.current.log = [
          {
            time: new Date().toLocaleTimeString(),
            phase: State.current.phase,
            message: `Group move: ${studentId} from ${from} → ${target} (teacher override)`,
          },
          ...State.current.log,
        ].slice(0, 100);
        State.current.groupMoves = State.current.groupMoves || {};
        State.current.groupMoves[studentId] = { from, to: target };
        persist(false);
        alert(
          `Noted: ${studentId} moved toward the ${target} group. This is recorded as a teacher override; evidence is unchanged.`,
        );
      };
    });
  }

  function buildReportHtml() {
    const classAvg = bound(
      average(State.current.evidence.map((row) => row.pct)),
    );
    const threshold = getThreshold();
    const standardRows = State.current.standards
      .map((standard) => {
        const meanScore = bound(
          average(rowsFor(null, standard.code).map((row) => row.pct)),
        );
        const [label, cls] = band(meanScore);
        return `<tr><td>${escapeHtml(standard.code)}</td><td>${escapeHtml(standard.desc)}</td><td>${meanScore}%</td><td><span class="badge ${cls}">${cue(cls)}${label}</span></td></tr>`;
      })
      .join("");
    const issues = validateState();
    const issuesHtml = issues.length
      ? issues
          .map(
            (issue) =>
              `<li><span class="badge ${issue[0]}">${cue(issue[0])}${issue[0]}</span> ${escapeHtml(issue[1])}</li>`,
          )
          .join("")
      : "<li>No major issues found.</li>";
    return `
      <h2>Neft Learning Forecast Engine — Teacher Report</h2>
      <p class="muted">Generated: ${escapeHtml(new Date().toLocaleString())} · Class: ${escapeHtml(State.current.class.name || "Unnamed")} (${escapeHtml(State.current.class.grade || "")})</p>
      <p><strong>${State.current.students.length}</strong> students · <strong>${State.current.standards.length}</strong> standards · <strong>${State.current.evidence.length}</strong> evidence records · class average <strong>${classAvg}%</strong></p>
      <h4>Standards Overview</h4>
      <table><caption>Standards overview</caption><thead><tr><th scope="col">Code</th><th scope="col">Description</th><th scope="col">Avg</th><th scope="col">Status</th></tr></thead><tbody>${standardRows || '<tr><td colspan="4">No standards.</td></tr>'}</tbody></table>
      <h4>Priority Next Move</h4>
      <p>Build flexible support groups for standards with students below ${threshold}%. Reteach with a worked example, a visual model, and a short exit check.</p>
      <h4>Data Quality Notes</h4>
      <ul>${issuesHtml}</ul>
      <p class="muted"><strong>Safety note:</strong> Forecasts estimate needs, not labels. Use professional judgment. Data is local to this browser.</p>
    `;
  }

  // ---- Wide gradebook import (one row per student, columns per standard) ----
  function readSpreadsheetFile(file) {
    return new Promise((resolve, reject) => {
      const name = (file.name || "").toLowerCase();
      const isXlsx = /\.xlsx?$/.test(name);
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read the file."));
      reader.onload = () => {
        try {
          if (isXlsx) {
            if (!window.XLSX)
              return reject(
                new Error(
                  "Spreadsheet parser (SheetJS) is not loaded. Connect to the internet once to load it, or save your gradebook as CSV and try again.",
                ),
              );
            const wb = window.XLSX.read(reader.result, { type: "array" });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const aoa = window.XLSX.utils.sheet_to_json(sheet, {
              header: 1,
              defval: "",
            });
            resolve(aoa.map((r) => r.map((c) => String(c))));
          } else {
            resolve(parseToMatrix(String(reader.result)));
          }
        } catch (err) {
          reject(err);
        }
      };
      if (isXlsx) reader.readAsArrayBuffer(file);
      else reader.readAsText(file);
    });
  }

  // Parse delimited text into a 2D matrix (header row + rows), reusing the
  // existing quote-aware delimiter logic.
  function parseToMatrix(text) {
    const delimiter = detectDelimiter(text.split(/\r?\n/)[0] || "");
    const rows = [];
    let row = [],
      cell = "",
      quote = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i],
        next = text[i + 1];
      if (ch === '"' && quote && next === '"') {
        cell += '"';
        i += 1;
        continue;
      }
      if (ch === '"') {
        quote = !quote;
        continue;
      }
      if (ch === delimiter && !quote) {
        row.push(cell.trim());
        cell = "";
        continue;
      }
      if ((ch === "\n" || ch === "\r") && !quote) {
        if (ch === "\r" && next === "\n") i += 1;
        row.push(cell.trim());
        if (row.some(Boolean)) rows.push(row);
        row = [];
        cell = "";
        continue;
      }
      cell += ch;
    }
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
    return rows;
  }

  const Gradebook = { matrix: null };

  function loadGradebook() {
    const file = $("#gradebookFile").files[0];
    const pasted = $("#gradebookPaste").value.trim();
    const done = (matrix) => {
      if (!matrix || matrix.length < 2)
        return alert("Need a header row and at least one student row.");
      Gradebook.matrix = matrix;
      renderGradebookMapping(matrix);
    };
    if (file) {
      readSpreadsheetFile(file).then(done, (err) =>
        alert(err.message || String(err)),
      );
    } else if (pasted) {
      done(parseToMatrix(pasted));
    } else {
      alert("Upload a file or paste a wide gradebook first.");
    }
  }

  function renderGradebookMapping(matrix) {
    const headers = matrix[0];
    const sampleRows = matrix.slice(1, 4);
    const colOptions = (selected) =>
      headers
        .map(
          (h, i) =>
            `<option value="${i}" ${i === selected ? "selected" : ""}>${escapeHtml(h || `Column ${i + 1}`)}</option>`,
        )
        .join("");
    // Heuristics for default selections.
    const findCol = (re) =>
      headers.findIndex((h) => re.test(String(h).toLowerCase()));
    const idCol = findCol(/(student\s*id|^id$|^sid$)/);
    const nameCol = findCol(/name|student/);
    const studentCol = idCol >= 0 ? idCol : nameCol >= 0 ? nameCol : 0;
    const standardCols = headers
      .map((h, i) => i)
      .filter((i) => i !== studentCol);

    const previewHtml = `<div class="preview"><table><tr>${headers
      .map((h) => `<th>${escapeHtml(h)}</th>`)
      .join("")}</tr>${sampleRows
      .map(
        (r) =>
          `<tr>${headers.map((_, i) => `<td>${escapeHtml(r[i] || "")}</td>`).join("")}</tr>`,
      )
      .join("")}</table></div>`;

    const checkboxes = headers
      .map((h, i) =>
        i === studentCol
          ? ""
          : `<label class="muted" style="text-transform:none;font-weight:600;display:inline-flex;gap:5px;margin:3px 8px 3px 0;"><input type="checkbox" class="gbStandardCol" value="${i}" checked> ${escapeHtml(h || `Column ${i + 1}`)}</label>`,
      )
      .join("");

    $("#gradebookMapping").hidden = false;
    $("#gradebookMapping").innerHTML = `
      <h4>Map your columns</h4>
      <p class="muted">Each selected column becomes a standard; each row's value becomes a score for that student.</p>
      ${previewHtml}
      <div class="grid g2 no-margin">
        <label class="field" style="text-transform:none;">Student identifier column
          <select id="gbStudentCol">${colOptions(studentCol)}</select>
        </label>
        <label class="field" style="text-transform:none;">Max score for these columns
          <input id="gbMax" type="number" min="1" value="100">
        </label>
      </div>
      <p class="muted" style="margin-top:8px;">Standard columns to import:</p>
      <div>${checkboxes}</div>
      <div class="button-row">
        <button class="btn primary" id="gbApplyBtn" type="button">Reshape &amp; Import</button>
      </div>
    `;
    $("#gbApplyBtn").onclick = () => applyGradebookMapping(matrix);
    // mark intended default
    void standardCols;
  }

  function applyGradebookMapping(matrix) {
    const headers = matrix[0];
    const studentCol = Number($("#gbStudentCol").value);
    const max = Number($("#gbMax").value) || 100;
    if (!Number.isFinite(max) || max <= 0)
      return alert("Enter a valid max score greater than 0.");
    const stdCols = $$(".gbStandardCol")
      .filter((cb) => cb.checked)
      .map((cb) => Number(cb.value));
    if (!stdCols.length)
      return alert("Select at least one standard column to import.");

    // Wide → long reshape into the row-typed format importRows already accepts.
    const longRows = [];
    matrix.slice(1).forEach((r) => {
      const studentVal = String(r[studentCol] || "").trim();
      if (!studentVal) return;
      stdCols.forEach((ci) => {
        const raw = String(r[ci] || "").trim();
        if (raw === "") return;
        const score = Number(raw);
        if (!Number.isFinite(score)) return;
        longRows.push({
          rowtype: "evidence",
          studentid: studentVal,
          studentname: studentVal,
          standard: String(headers[ci] || `Col${ci + 1}`).trim(),
          score: String(score),
          maxscore: String(max),
          date: today(),
          assessment: "Gradebook import",
        });
      });
    });
    if (!longRows.length)
      return alert("No numeric scores found in the selected columns.");
    importRows(longRows);
    $("#gradebookMapping").hidden = true;
    Gradebook.matrix = null;
  }

  // Opt-in (default OFF): include support tags in CSV/JSON exports.
  function exportTagsEnabled() {
    const checkbox = $("#includeTagsExport");
    return Boolean(checkbox && checkbox.checked);
  }

  function wireEvents() {
    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-tab],[data-go]");
      if (target) setTab(target.dataset.tab || target.dataset.go);
    });
    // Keyboard support for the tablist (ArrowLeft/Right/Home/End).
    const tablist = document.querySelector(".nav[role='tablist']");
    if (tablist) {
      tablist.addEventListener("keydown", (event) => {
        const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
        if (!keys.includes(event.key)) return;
        const tabs = Array.from(tablist.querySelectorAll("button[role='tab']"));
        if (!tabs.length) return;
        const currentIndex = tabs.indexOf(document.activeElement);
        const from = currentIndex === -1 ? 0 : currentIndex;
        let nextIndex = from;
        if (event.key === "ArrowLeft")
          nextIndex = (from - 1 + tabs.length) % tabs.length;
        else if (event.key === "ArrowRight")
          nextIndex = (from + 1) % tabs.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = tabs.length - 1;
        event.preventDefault();
        const nextTab = tabs[nextIndex];
        if (nextTab && nextTab.dataset.tab) {
          setTab(nextTab.dataset.tab);
          nextTab.focus();
        }
      });
    }
    $("#themeBtn").onclick = () => {
      State.current.theme = State.current.theme === "dark" ? "light" : "dark";
      persist();
    };
    $("#saveClassBtn").onclick = () => {
      State.current.class.name =
        $("#className").value || State.current.class.name;
      State.current.class.grade =
        $("#gradeCourse").value || State.current.class.grade;
      transition("CONFIGURING", "Class saved");
      render();
    };
    $("#addStudentBtn").onclick = () => {
      const id = $("#studentId").value.trim();
      if (!id) return alert("Add a Student ID.");
      if (State.current.students.some((student) => student.id === id))
        return alert("Duplicate Student ID.");
      State.current.students.push({
        id,
        name: $("#studentName").value || `Student ${id}`,
        tags: $("#studentTags").value || "",
      });
      transition("CONFIGURING", "Student added");
      render();
    };
    $("#addStandardBtn").onclick = () => {
      const code = $("#standardCode").value.trim();
      if (!code) return alert("Add a standard code.");
      if (State.current.standards.some((standard) => standard.code === code))
        return alert("Duplicate standard.");
      State.current.standards.push({
        code,
        desc: $("#standardDesc").value || "Teacher-added standard",
      });
      transition("CONFIGURING", "Standard added");
      render();
    };
    $("#addEvidenceBtn").onclick = () => {
      const scoreRaw = $("#manualScore").value.trim(),
        maxRaw = $("#manualMax").value.trim();
      if (!$("#manualStudent").value || !$("#manualStandard").value)
        return alert("Add at least one student and standard first.");
      if (scoreRaw === "" || maxRaw === "")
        return alert("Enter both a score and a max score.");
      const score = Number(scoreRaw),
        max = Number(maxRaw);
      if (!Number.isFinite(score) || score < 0)
        return alert("Score must be a number of 0 or more.");
      if (!Number.isFinite(max) || max <= 0)
        return alert("Max score must be a number greater than 0.");
      if (score > max)
        return alert(
          `Score (${score}) cannot be greater than max (${max}). Please correct it.`,
        );
      State.current.evidence.push(
        makeEvidence(
          $("#manualStudent").value,
          $("#manualStandard").value,
          score,
          max,
          today(),
          $("#manualAssessment").value || "Manual Evidence",
        ),
      );
      transition("SUCCESS", "Evidence added");
      render();
    };
    $("#importPasteBtn").onclick = () =>
      importRows(parseDelimitedRows($("#pasteBox").value));
    $("#importFileBtn").onclick = () => {
      const file = $("#fileInput").files[0];
      if (!file) return alert("Choose a file.");
      const reader = new FileReader();
      reader.onload = () =>
        importRows(parseHtmlTableRows(String(reader.result)));
      reader.readAsText(file);
    };
    $("#downloadCsvBtn").onclick = () =>
      downloadFile("forecast-template.csv", TEMPLATE, "text/csv");
    $("#runForecastBtn").onclick = () => {
      transition("COMPUTING", "Forecast requested");
      const result = forecast(
        $("#forecastStudent").value,
        $("#forecastStandard").value,
      );
      $("#forecastResult").innerHTML = result.n
        ? `<div class="metric">${result.lo}–${result.hi}%</div><p><span class="badge ${result.cls}">${cue(result.cls)}${result.label}</span> <span class="badge info">${result.conf} confidence</span> ${trendBadge(result)}</p><p class="muted">${result.n} evidence point(s); projected ${result.p}% (recency-weighted + trend). Use as a planning estimate, not a label.</p>`
        : '<p class="muted">Not enough evidence for this student and standard.</p>';
      transition("SUCCESS", "Forecast complete");
      render();
    };
    $("#buildGroupsBtn").onclick = buildGroups;
    $("#reportBtn").onclick = () => {
      $("#report").textContent = [
        "NEFT LEARNING FORECAST ENGINE REPORT",
        `Generated: ${new Date().toLocaleString()}`,
        `Class: ${State.current.class.name}`,
        `Students: ${State.current.students.length}`,
        `Standards: ${State.current.standards.length}`,
        `Evidence records: ${State.current.evidence.length}`,
        `Class average: ${bound(average(State.current.evidence.map((row) => row.pct)))}%`,
        "",
        "Priority next move:",
        `Use Groups for standards with students below ${getThreshold()}%. Reteach with a worked example, visual model, and short exit ticket.`,
        "",
        "Data quality notes:",
        validateState()
          .map((issue) => `- ${issue[1]}`)
          .join("\n") || "- No major issues found.",
        "",
        "Safety note: Forecast needs. Do not label students. Use teacher judgment.",
      ].join("\n");
      const htmlEl = $("#reportHtml");
      if (htmlEl) htmlEl.innerHTML = buildReportHtml();
    };
    $("#csvBtn").onclick = () => {
      const includeTags = exportTagsEnabled();
      const tagFor = (studentId) => {
        const student = State.current.students.find((s) => s.id === studentId);
        return student ? student.tags || "" : "";
      };
      const header = includeTags
        ? "studentId,standard,score,maxScore,percent,date,assessment,tags"
        : "studentId,standard,score,maxScore,percent,date,assessment";
      downloadFile(
        "forecast-evidence.csv",
        header +
          "\n" +
          State.current.evidence
            .map((row) => {
              const cells = [
                row.student,
                row.standard,
                row.score,
                row.max,
                row.pct,
                row.date,
                row.assessment,
              ];
              if (includeTags) cells.push(tagFor(row.student));
              return cells
                .map((value) => `"${String(value).replace(/"/g, '""')}"`)
                .join(",");
            })
            .join("\n"),
        "text/csv",
      );
    };
    $("#jsonBtn").onclick = () => {
      const includeTags = exportTagsEnabled();
      // Deep clone so the in-memory state and localStorage are untouched.
      const snapshot = JSON.parse(JSON.stringify(State.current));
      if (!includeTags && Array.isArray(snapshot.students)) {
        snapshot.students.forEach((student) => {
          delete student.tags;
        });
      }
      downloadFile(
        "forecast-backup.json",
        JSON.stringify(snapshot, null, 2),
        "application/json",
      );
    };
    $("#saveProfileBtn").onclick = () => {
      const profile =
        $("#profileName").value.trim() || State.current.profile || "Default";
      if (
        localStorage.getItem(PROFILE_PREFIX + profile) !== null &&
        !confirm(
          `A profile named "${profile}" already exists. Overwrite it with the current data?`,
        )
      )
        return;
      State.current.profile = profile;
      localStorage.setItem(
        PROFILE_PREFIX + profile,
        JSON.stringify(State.current),
      );
      transition("SUCCESS", `Profile saved: ${profile}`);
      render();
    };
    $("#loadProfileBtn").onclick = () => {
      const profile = $("#profileName").value.trim();
      const raw = localStorage.getItem(PROFILE_PREFIX + profile);
      if (!raw) return alert("Profile not found.");
      State.current = normalizeState(JSON.parse(raw));
      transition("SUCCESS", `Profile loaded: ${profile}`);
      persist();
    };
    $("#sampleBtn").onclick = () => {
      if (
        State.current.evidence.length &&
        !confirm(
          "This replaces ALL current class data with built-in sample data. Your real data will be lost unless you exported a backup. Continue?",
        )
      )
        return;
      State.current = seedState();
      transition("SUCCESS", "Sample data loaded");
      persist();
    };
    $("#clearBtn").onclick = () => {
      if (!confirm("Clear all local Forecast Engine data?")) return;
      State.current = {
        ...seedState(),
        students: [],
        standards: [],
        evidence: [],
        log: [],
      };
      transition("SUCCESS", "Local data cleared");
      persist();
    };
    $("#runSelfTestBtn").onclick = () => {
      $("#settingsStatus").innerHTML = runSelfTest()
        .map(
          (test) =>
            `<p><span class="badge ${test.pass ? "ok" : "bad"}">${test.pass ? "PASS" : "FAIL"}</span> ${escapeHtml(test.name)}</p>`,
        )
        .join("");
      render();
    };
    const thresholdSlider = $("#groupThreshold");
    if (thresholdSlider) {
      thresholdSlider.oninput = () => {
        const v = Number(thresholdSlider.value);
        State.current.threshold =
          Number.isFinite(v) && v >= 40 && v <= 90 ? v : 70;
        $("#groupThresholdValue").textContent = String(getThreshold());
        thresholdSlider.setAttribute(
          "aria-valuetext",
          getThreshold() + " percent",
        );
      };
      thresholdSlider.onchange = () => {
        persist();
      };
    }

    const printGroupsBtn = $("#printGroupsBtn");
    if (printGroupsBtn)
      printGroupsBtn.onclick = () => {
        if (!$("#groupOutput").innerHTML.trim()) buildGroups();
        setTab("groups");
        window.print();
      };

    const endSessionBtn = $("#clearEndSessionBtn");
    if (endSessionBtn) endSessionBtn.onclick = () => $("#clearBtn").click();

    const gradebookLoadBtn = $("#gradebookLoadBtn");
    if (gradebookLoadBtn) gradebookLoadBtn.onclick = loadGradebook;

    let clicks = 0,
      timer = null;
    $("#diagnosticHotspot").onclick = () => {
      clicks += 1;
      clearTimeout(timer);
      timer = setTimeout(() => {
        clicks = 0;
      }, 800);
      if (clicks >= 3) {
        $("#diag").classList.add("open");
        renderDiagnostics();
        clicks = 0;
      }
    };
    $("#closeDiagBtn").onclick = () => $("#diag").classList.remove("open");
    $("#diagTestBtn").onclick = () => {
      $("#diagText").textContent = JSON.stringify(runSelfTest(), null, 2);
      render();
    };
  }

  function bootWorker() {
    try {
      State.worker = new Worker("./forecast.worker.js");
    } catch {
      State.worker = null;
    }
  }

  function updateSheetjsStatus() {
    const el = $("#sheetjsStatus");
    if (!el) return;
    if (window.XLSX || window.__SHEETJS_READY) {
      el.className = "badge ok";
      el.textContent = "SheetJS: ready (.xlsx supported)";
    } else if (window.__SHEETJS_FAILED) {
      el.className = "badge warn";
      el.textContent = "SheetJS: offline — use CSV instead";
    } else {
      el.className = "badge neutral";
      el.textContent = "SheetJS: loading…";
      setTimeout(updateSheetjsStatus, 600);
    }
  }

  State.current = loadState();
  bootWorker();
  wireEvents();
  setTab(State.current.active || "start");
  render();
  updateSheetjsStatus();
})();
