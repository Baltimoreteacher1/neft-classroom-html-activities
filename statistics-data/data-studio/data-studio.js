const STORE_KEY = "dataStudioMasterState.v1";

const HELP = {
  descriptive: {
    title: "Descriptive Snapshot",
    body: "This gives the quick health check: average, median, spread, lowest scores, highest scores, and percent meeting the target. It answers, “How is the class doing overall, and how uneven is performance?”",
  },
  distribution: {
    title: "Distribution and Spread",
    body: "This shows where scores cluster. A tight cluster means students are performing similarly. A wide spread means the class likely needs differentiated small-group support.",
  },
  standardPriority: {
    title: "Standard Priority Finder",
    body: "This ranks standards by need using average score and the percent of students below the selected proficiency target. It helps you choose what to reteach first.",
  },
  growth: {
    title: "Growth Trajectory",
    body: "This compares earlier and later assessments. Positive growth suggests instruction or practice is working. Flat or negative growth suggests the skill may need a different reteach approach.",
  },
  prediction: {
    title: "Prediction Analysis",
    body: "This uses a simple trend line from available assessment data to estimate the next likely score. It is not a final judgment about students; it is an early-warning tool for planning.",
  },
  correlation: {
    title: "Correlation Studio",
    body: "Correlation checks whether two number-based measures move together. A value near +1 means they rise together, near -1 means one rises as the other falls, and near 0 means there is little linear relationship.",
  },
  subgroup: {
    title: "Subgroup Comparison",
    body: "This compares average scores across a selected category, such as class period, language level, attendance band, or intervention group. Use it to notice patterns, not to label students.",
  },
  outliers: {
    title: "Outlier Scan",
    body: "This flags students whose scores are unusually far above or below the group pattern. It can reveal students who may need urgent support or enrichment.",
  },
  consistency: {
    title: "Consistency Check",
    body: "This finds students whose performance changes a lot across standards or assessments. Inconsistent scores may mean the student knows some skills but is missing specific prerequisite pieces.",
  },
  intervention: {
    title: "Instructional Group Builder",
    body: "This sorts students into practical teacher groups based on current performance and growth patterns. The groups are a planning suggestion, not a permanent label.",
  },
  equity: {
    title: "Access and Equity Check",
    body: "This looks for gaps between groups so teachers can ask whether access, supports, language demands, attendance, or task format may be affecting performance.",
  },
  reliability: {
    title: "Signal Strength Check",
    body: "This checks whether the data set is strong enough to support confident decisions. Small samples, missing standards, or one-time scores should be treated cautiously.",
  },
  planningStudio: {
    title: "Planning Studio",
    body: "This turns the analysis into classroom-ready planning pieces: flexible groups, a next-day agenda, small-group mini-lessons, student/family summaries, an admin-ready brief, and an AI prompt for lesson creation.",
  },
};

const analysisCatalog = [
  [
    "descriptive",
    "Descriptive Snapshot",
    "Mean, median, range, proficiency rate, and quick class health check.",
    "📌",
  ],
  [
    "distribution",
    "Distribution + Spread",
    "Histogram, spread bands, and whether scores are clustered or widely varied.",
    "📊",
  ],
  [
    "standardPriority",
    "Priority Standards",
    "Ranks standards by reteach need and percent below target.",
    "🎯",
  ],
  [
    "growth",
    "Growth Trajectory",
    "Shows first-to-latest progress by class and student.",
    "📈",
  ],
  [
    "prediction",
    "Prediction Analysis",
    "Projects next likely class and student performance from trend data.",
    "🔮",
  ],
  [
    "correlation",
    "Correlation Studio",
    "Connects scores to another numeric measure, such as attendance.",
    "🔗",
  ],
  [
    "subgroup",
    "Subgroup Comparison",
    "Compares outcomes by class, category, or supplemental group.",
    "🧭",
  ],
  [
    "outliers",
    "Outlier Scan",
    "Finds unusually high or low patterns worth checking.",
    "🚩",
  ],
  [
    "consistency",
    "Consistency Check",
    "Finds students with uneven performance across skills.",
    "🧩",
  ],
  [
    "intervention",
    "Group Builder",
    "Creates practical reteach, guided, monitor, and extension groups.",
    "👥",
  ],
  [
    "equity",
    "Access Gap Check",
    "Highlights possible access/support gaps between groups.",
    "⚖️",
  ],
  [
    "reliability",
    "Signal Strength",
    "Checks whether the data is strong enough to trust for decisions.",
    "✅",
  ],
];

const state = {
  view: "landing",
  tab: "overview",
  rawRows: [],
  rawHeaders: [],
  extraRows: [],
  extraHeaders: [],
  records: [],
  filters: {
    className: "All",
    assessment: "All",
    focusStudent: "All",
    selectedStudents: [],
    selectedStandards: [],
    target: 70,
  },
  fields: {
    student: "",
    score: "",
    standard: "",
    assessment: "",
    className: "",
    date: "",
  },
  advanced: {
    selected: [
      "descriptive",
      "distribution",
      "standardPriority",
      "growth",
      "prediction",
      "intervention",
    ],
    corrField: "",
    subgroupField: "className",
    projectionSteps: 1,
    minGroupSize: 2,
  },
  planning: {
    purpose: "reteach",
    minutes: 45,
    cycle: "Tomorrow",
    audience: "teacher",
    includeESOL: true,
    includeFamily: true,
  },
  charts: {},
  analysisRun: false,
};

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
}
function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
function toNumber(value) {
  if (value === null || value === undefined || value === "") return NaN;
  if (typeof value === "number") return value;
  const cleaned = String(value)
    .replace(/[%,$\s]/g, "")
    .replace(/[^\d.-]/g, "");
  if (cleaned === "" || cleaned === "." || cleaned === "-" || cleaned === "-.")
    return NaN;
  return Number(cleaned);
}
function mean(arr) {
  const vals = arr.filter(Number.isFinite);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
}
function median(arr) {
  const vals = arr.filter(Number.isFinite).sort((a, b) => a - b);
  if (!vals.length) return NaN;
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
}
function quantile(arr, q) {
  const vals = arr.filter(Number.isFinite).sort((a, b) => a - b);
  if (!vals.length) return NaN;
  const pos = (vals.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return vals[base + 1] !== undefined
    ? vals[base] + rest * (vals[base + 1] - vals[base])
    : vals[base];
}
function sd(arr) {
  const vals = arr.filter(Number.isFinite);
  if (vals.length < 2) return 0;
  const m = mean(vals);
  return Math.sqrt(
    vals.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / (vals.length - 1),
  );
}
function round(n, digits = 1) {
  return Number.isFinite(n) ? Number(n.toFixed(digits)) : "—";
}
function pct(n, digits = 0) {
  return Number.isFinite(n) ? `${round(n, digits)}%` : "—";
}
function unique(arr) {
  return [
    ...new Set(
      arr
        .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
        .map((v) => String(v).trim()),
    ),
  ];
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function scoreBand(score, target = 70) {
  if (!Number.isFinite(score))
    return { label: "Missing", cls: "", color: "#f1f5f9" };
  if (score < Math.max(50, target - 20))
    return { label: "Urgent", cls: "red", color: "#fecaca" };
  if (score < target)
    return { label: "Reteach", cls: "gold", color: "#fde68a" };
  if (score < target + 15)
    return { label: "On Track", cls: "blue", color: "#bfdbfe" };
  return { label: "Extension", cls: "green", color: "#bbf7d0" };
}
function inferField(headers, candidates) {
  const lower = headers.map((h) => String(h).trim().toLowerCase());
  for (const cand of candidates) {
    const exact = lower.indexOf(cand.toLowerCase());
    if (exact !== -1) return headers[exact];
  }
  for (const cand of candidates) {
    const idx = lower.findIndex((h) => h.includes(cand.toLowerCase()));
    if (idx !== -1) return headers[idx];
  }
  return "";
}
function inferFields(headers) {
  return {
    student: inferField(headers, [
      "Student Name",
      "Student",
      "Name",
      "StudentName",
      "Full Name",
      "Scholar",
    ]),
    score: inferField(headers, [
      "Score (%)",
      "Score",
      "Percent",
      "Percentage",
      "Grade",
      "Result",
      "Points Earned",
      "Performance",
    ]),
    standard: inferField(headers, [
      "Standard",
      "Skill",
      "Objective",
      "Domain",
      "Learning Target",
      "Item Standard",
    ]),
    assessment: inferField(headers, [
      "Assessment",
      "Test",
      "Quiz",
      "Assignment",
      "Window",
      "Unit",
      "Date",
      "Benchmark",
    ]),
    className: inferField(headers, [
      "Class/Period",
      "Class",
      "Period",
      "Section",
      "Course",
      "Teacher",
    ]),
    date: inferField(headers, [
      "Date",
      "Assessment Date",
      "Test Date",
      "Admin Date",
    ]),
  };
}
function buildHeaders(rows) {
  const set = new Set();
  rows.forEach((r) => Object.keys(r || {}).forEach((k) => set.add(k)));
  return [...set];
}
function normalizeRows(rows) {
  state.rawRows = rows.filter(
    (r) => r && Object.values(r).some((v) => String(v ?? "").trim() !== ""),
  );
  state.rawHeaders = buildHeaders(state.rawRows);
  const inferred = inferFields(state.rawHeaders);
  state.fields = { ...state.fields, ...inferred };
  rebuildRecords();
}
function rebuildRecords() {
  const f = state.fields;
  state.records = state.rawRows
    .map((r, idx) => {
      const score = toNumber(r[f.score]);
      const student =
        String(r[f.student] ?? `Student ${idx + 1}`).trim() ||
        `Student ${idx + 1}`;
      const standard = String(r[f.standard] ?? "General").trim() || "General";
      const assessment =
        String(r[f.assessment] ?? "Assessment").trim() || "Assessment";
      const className = String(r[f.className] ?? "Class").trim() || "Class";
      const dateRaw = f.date ? r[f.date] : "";
      return {
        id: idx,
        student,
        score,
        standard,
        assessment,
        className,
        dateRaw,
        raw: r,
      };
    })
    .filter((d) => d.student && Number.isFinite(d.score));
  resetFiltersToAll();
  state.view = "studio";
  state.tab = "overview";
  state.analysisRun = false;
  persistLite();
  render();
}
function resetFiltersToAll() {
  const students = getAvailable().students;
  const standards = getAvailable().standards;
  state.filters.selectedStudents = students;
  state.filters.selectedStandards = standards;
  if (!students.includes(state.filters.focusStudent))
    state.filters.focusStudent = "All";
}
function getAvailable() {
  return {
    students: unique(state.records.map((d) => d.student)).sort((a, b) =>
      a.localeCompare(b),
    ),
    standards: unique(state.records.map((d) => d.standard)).sort((a, b) =>
      a.localeCompare(b),
    ),
    classes: unique(state.records.map((d) => d.className)).sort((a, b) =>
      a.localeCompare(b),
    ),
    assessments: sortAssessments(
      unique(state.records.map((d) => d.assessment)),
    ),
  };
}
function sortAssessments(values) {
  return [...values].sort((a, b) => {
    const na = Number(String(a).match(/\d+/)?.[0]);
    const nb = Number(String(b).match(/\d+/)?.[0]);
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}
function getFilteredRecords() {
  const targetStudents =
    state.filters.focusStudent === "All"
      ? state.filters.selectedStudents
      : [state.filters.focusStudent];
  return state.records.filter((d) => {
    return (
      (state.filters.className === "All" ||
        d.className === state.filters.className) &&
      (state.filters.assessment === "All" ||
        d.assessment === state.filters.assessment) &&
      targetStudents.includes(d.student) &&
      state.filters.selectedStandards.includes(d.standard)
    );
  });
}
function grouped(arr, keyFn) {
  const map = new Map();
  arr.forEach((item) => {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return map;
}
function studentSummaries(data = getFilteredRecords()) {
  const byStudent = grouped(data, (d) => d.student);
  return [...byStudent.entries()]
    .map(([student, rows]) => {
      const scores = rows.map((r) => r.score).filter(Number.isFinite);
      const assessments = sortAssessments(
        unique(rows.map((r) => r.assessment)),
      );
      const ordered = assessments.map((a) =>
        mean(rows.filter((r) => r.assessment === a).map((r) => r.score)),
      );
      const first = ordered.find(Number.isFinite);
      const latest = [...ordered].reverse().find(Number.isFinite);
      return {
        student,
        count: rows.length,
        avg: mean(scores),
        med: median(scores),
        min: Math.min(...scores),
        max: Math.max(...scores),
        spread: Math.max(...scores) - Math.min(...scores),
        sd: sd(scores),
        first,
        latest,
        growth:
          Number.isFinite(first) && Number.isFinite(latest)
            ? latest - first
            : NaN,
        rows,
      };
    })
    .sort((a, b) => a.avg - b.avg);
}
function standardSummaries(data = getFilteredRecords()) {
  const target = Number(state.filters.target);
  const byStandard = grouped(data, (d) => d.standard);
  return [...byStandard.entries()]
    .map(([standard, rows]) => {
      const scores = rows.map((r) => r.score).filter(Number.isFinite);
      return {
        standard,
        n: scores.length,
        avg: mean(scores),
        median: median(scores),
        sd: sd(scores),
        below: scores.filter((s) => s < target).length,
        belowPct: scores.length
          ? (scores.filter((s) => s < target).length / scores.length) * 100
          : NaN,
        min: Math.min(...scores),
        max: Math.max(...scores),
      };
    })
    .sort((a, b) => b.belowPct - a.belowPct || a.avg - b.avg);
}
function assessmentSummaries(data = getFilteredRecords()) {
  const byAssessment = grouped(data, (d) => d.assessment);
  return sortAssessments([...byAssessment.keys()]).map((assessment, i) => {
    const rows = byAssessment.get(assessment) || [];
    const scores = rows.map((r) => r.score).filter(Number.isFinite);
    return {
      assessment,
      index: i + 1,
      n: scores.length,
      avg: mean(scores),
      median: median(scores),
      sd: sd(scores),
      target: Number(state.filters.target),
    };
  });
}
function linearRegression(points) {
  const pts = points.filter(
    (p) => Number.isFinite(p.x) && Number.isFinite(p.y),
  );
  if (pts.length < 2) return null;
  const xbar = mean(pts.map((p) => p.x));
  const ybar = mean(pts.map((p) => p.y));
  const denom = pts.reduce((acc, p) => acc + Math.pow(p.x - xbar, 2), 0);
  if (denom === 0) return null;
  const slope =
    pts.reduce((acc, p) => acc + (p.x - xbar) * (p.y - ybar), 0) / denom;
  const intercept = ybar - slope * xbar;
  const ssTot = pts.reduce((acc, p) => acc + Math.pow(p.y - ybar, 2), 0);
  const ssRes = pts.reduce(
    (acc, p) => acc + Math.pow(p.y - (intercept + slope * p.x), 2),
    0,
  );
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return {
    slope,
    intercept,
    r2,
    predict: (x) => intercept + slope * x,
    n: pts.length,
  };
}
function pearson(xs, ys) {
  const pairs = xs
    .map((x, i) => ({ x, y: ys[i] }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (pairs.length < 3) return { r: NaN, n: pairs.length };
  const xbar = mean(pairs.map((p) => p.x));
  const ybar = mean(pairs.map((p) => p.y));
  const num = pairs.reduce((acc, p) => acc + (p.x - xbar) * (p.y - ybar), 0);
  const denX = Math.sqrt(
    pairs.reduce((acc, p) => acc + Math.pow(p.x - xbar, 2), 0),
  );
  const denY = Math.sqrt(
    pairs.reduce((acc, p) => acc + Math.pow(p.y - ybar, 2), 0),
  );
  return {
    r: denX && denY ? num / (denX * denY) : NaN,
    n: pairs.length,
    pairs,
  };
}
function describeCorrelation(r) {
  const abs = Math.abs(r);
  if (!Number.isFinite(r)) return "not enough paired data";
  const direction = r > 0 ? "positive" : r < 0 ? "negative" : "flat";
  const strength =
    abs >= 0.75
      ? "very strong"
      : abs >= 0.55
        ? "strong"
        : abs >= 0.35
          ? "moderate"
          : abs >= 0.2
            ? "weak"
            : "very weak";
  return `${strength} ${direction}`;
}
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2600);
}
function openExplain(key) {
  const entry = HELP[key] || {
    title: "Explanation",
    body: "This feature translates the data into teacher-friendly language.",
  };
  document.getElementById("modalTitle").textContent = entry.title;
  document.getElementById("modalBody").innerHTML =
    `<p>${escapeHtml(entry.body)}</p><div class="translation"><strong>Best use:</strong> Treat this as a planning signal. Pair it with what you know from classwork, student talk, attendance, language demands, and recent instruction before making a final decision.</div>`;
  document.getElementById("modalBackdrop").classList.add("show");
  document.getElementById("explainModal").classList.add("show");
}
function closeModal() {
  document.getElementById("modalBackdrop").classList.remove("show");
  document.getElementById("explainModal").classList.remove("show");
}
function persistLite() {
  try {
    const lite = {
      rawRows: state.rawRows,
      rawHeaders: state.rawHeaders,
      extraRows: state.extraRows,
      extraHeaders: state.extraHeaders,
      fields: state.fields,
      filters: state.filters,
      advanced: state.advanced,
      planning: state.planning,
    };
    localStorage.setItem(STORE_KEY, JSON.stringify(lite));
  } catch (e) {}
}
function restoreLite() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return false;
    const lite = JSON.parse(raw);
    if (!lite.rawRows || !lite.rawRows.length) return false;
    state.rawRows = lite.rawRows || [];
    state.rawHeaders = lite.rawHeaders || buildHeaders(state.rawRows);
    state.extraRows = lite.extraRows || [];
    state.extraHeaders = lite.extraHeaders || buildHeaders(state.extraRows);
    state.fields = { ...state.fields, ...(lite.fields || {}) };
    state.filters = { ...state.filters, ...(lite.filters || {}) };
    state.advanced = { ...state.advanced, ...(lite.advanced || {}) };
    state.planning = { ...state.planning, ...(lite.planning || {}) };
    state.records = [];
    rebuildRecordsNoRender();
    state.view = "studio";
    return true;
  } catch (e) {
    return false;
  }
}
function rebuildRecordsNoRender() {
  const f = state.fields;
  state.records = state.rawRows
    .map((r, idx) => ({
      id: idx,
      student:
        String(r[f.student] ?? `Student ${idx + 1}`).trim() ||
        `Student ${idx + 1}`,
      score: toNumber(r[f.score]),
      standard: String(r[f.standard] ?? "General").trim() || "General",
      assessment:
        String(r[f.assessment] ?? "Assessment").trim() || "Assessment",
      className: String(r[f.className] ?? "Class").trim() || "Class",
      dateRaw: f.date ? r[f.date] : "",
      raw: r,
    }))
    .filter((d) => d.student && Number.isFinite(d.score));
}
function clearAll() {
  if (!confirm("Clear the current dashboard data from this browser?")) return;
  localStorage.removeItem(STORE_KEY);
  Object.assign(state, {
    view: "landing",
    tab: "overview",
    rawRows: [],
    rawHeaders: [],
    extraRows: [],
    extraHeaders: [],
    records: [],
    filters: {
      className: "All",
      assessment: "All",
      focusStudent: "All",
      selectedStudents: [],
      selectedStandards: [],
      target: 70,
    },
    fields: {
      student: "",
      score: "",
      standard: "",
      assessment: "",
      className: "",
      date: "",
    },
    advanced: {
      selected: [
        "descriptive",
        "distribution",
        "standardPriority",
        "growth",
        "prediction",
        "intervention",
      ],
      corrField: "",
      subgroupField: "className",
      projectionSteps: 1,
      minGroupSize: 2,
    },
    planning: {
      purpose: "reteach",
      minutes: 45,
      cycle: "Tomorrow",
      audience: "teacher",
      includeESOL: true,
      includeFamily: true,
    },
    charts: {},
    analysisRun: false,
  });
  render();
}

function parseCSV(text) {
  const rows = [];
  let current = "",
    row = [],
    inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i],
      next = text[i + 1];
    if (ch === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      row.push(current);
      current = "";
      if (row.some((v) => String(v).trim() !== "")) rows.push(row);
      row = [];
    } else current += ch;
  }
  row.push(current);
  if (row.some((v) => String(v).trim() !== "")) rows.push(row);
  if (!rows.length) return [];
  const headers = rows.shift().map((h) => h.trim());
  return rows.map((r) =>
    Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])),
  );
}
function handleFile(file, mode = "main") {
  if (!file) return;
  const name = file.name.toLowerCase();
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      let rows = [];
      if (name.endsWith(".csv")) {
        rows = parseCSV(e.target.result);
      } else {
        if (typeof XLSX === "undefined")
          throw new Error(
            "Spreadsheet library did not load. Try CSV or check internet access.",
          );
        const wb = XLSX.read(e.target.result, {
          type: "binary",
          cellDates: true,
        });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      }
      if (mode === "main") {
        normalizeRows(rows);
        toast(`Loaded ${state.records.length} score records.`);
      } else {
        appendSupplement(rows);
      }
    } catch (err) {
      alert(
        "I could not read that file. Try saving it as .xlsx or .csv.\n\n" +
          err.message,
      );
    }
  };
  if (name.endsWith(".csv")) reader.readAsText(file);
  else reader.readAsBinaryString(file);
}
function appendSupplement(rows) {
  const cleaned = rows.filter(
    (r) => r && Object.values(r).some((v) => String(v ?? "").trim() !== ""),
  );
  state.extraRows = cleaned;
  state.extraHeaders = buildHeaders(cleaned);
  const candidates = numericSupplementFields();
  if (candidates.length && !candidates.includes(state.advanced.corrField))
    state.advanced.corrField = candidates[0];
  toast(`Supplemental data connected: ${cleaned.length} rows.`);
  persistLite();
  render();
}
function numericSupplementFields() {
  if (!state.extraRows.length) return [];
  return state.extraHeaders
    .filter((h) => {
      const vals = state.extraRows
        .map((r) => toNumber(r[h]))
        .filter(Number.isFinite);
      return (
        vals.length >= Math.max(3, Math.ceil(state.extraRows.length * 0.35))
      );
    })
    .filter((h) => {
      const lower = h.toLowerCase();
      return !["student", "student name", "name", "id"].includes(lower);
    });
}
function categoricalSupplementFields() {
  if (!state.extraRows.length) return [];
  return state.extraHeaders.filter((h) => {
    const vals = unique(state.extraRows.map((r) => r[h]));
    const numeric = state.extraRows
      .map((r) => toNumber(r[h]))
      .filter(Number.isFinite).length;
    return (
      vals.length >= 2 &&
      vals.length <= Math.max(12, state.extraRows.length * 0.45) &&
      numeric < state.extraRows.length * 0.7
    );
  });
}
function detectSupplementStudentField() {
  return (
    inferField(state.extraHeaders, [
      "Student Name",
      "Student",
      "Name",
      "StudentName",
      "Full Name",
      "Scholar",
    ]) ||
    state.extraHeaders[0] ||
    ""
  );
}
function supplementByStudent() {
  const field = detectSupplementStudentField();
  const map = new Map();
  state.extraRows.forEach((r) => {
    const s = String(r[field] ?? "").trim();
    if (s) map.set(s, r);
  });
  return map;
}
function setField(kind, value) {
  state.fields[kind] = value;
  rebuildRecords();
}
function updateFilter(key, value) {
  state.filters[key] = key === "target" ? Number(value) : value;
  state.analysisRun = false;
  persistLite();
  render();
}
function toggleFilter(kind, value) {
  const arr =
    kind === "students"
      ? state.filters.selectedStudents
      : state.filters.selectedStandards;
  const idx = arr.indexOf(value);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(value);
  state.analysisRun = false;
  persistLite();
  render();
}
function setAll(kind, checked) {
  const avail = getAvailable();
  if (kind === "students")
    state.filters.selectedStudents = checked ? [...avail.students] : [];
  if (kind === "standards")
    state.filters.selectedStandards = checked ? [...avail.standards] : [];
  state.analysisRun = false;
  persistLite();
  render();
}
function switchTab(tab) {
  state.tab = tab;
  persistLite();
  render();
}
function toggleAnalysis(key, checked) {
  const arr = state.advanced.selected;
  const idx = arr.indexOf(key);
  if (checked && idx < 0) arr.push(key);
  if (!checked && idx >= 0) arr.splice(idx, 1);
  state.analysisRun = false;
  persistLite();
  render();
}
function runSelectedAnalyses() {
  state.analysisRun = true;
  persistLite();
  render();
  setTimeout(
    () =>
      document
        .getElementById("analysisResults")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    80,
  );
}
function selectRecommendedAnalyses() {
  state.advanced.selected = [
    "descriptive",
    "distribution",
    "standardPriority",
    "growth",
    "prediction",
    "intervention",
    "reliability",
  ];
  state.analysisRun = false;
  render();
}
function selectAllAnalyses() {
  state.advanced.selected = analysisCatalog.map((a) => a[0]);
  state.analysisRun = false;
  render();
}
function clearAnalyses() {
  state.advanced.selected = [];
  state.analysisRun = false;
  render();
}

function chart(id, config) {
  if (typeof Chart === "undefined") return;
  const ctx = document.getElementById(id);
  if (!ctx) return;
  if (state.charts[id]) state.charts[id].destroy();
  state.charts[id] = new Chart(ctx, {
    ...config,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { usePointStyle: true, boxWidth: 8 },
        },
        tooltip: { mode: "nearest", intersect: false },
        ...(config.options?.plugins || {}),
      },
      scales:
        config.type === "pie" ||
        config.type === "doughnut" ||
        config.type === "radar"
          ? config.options?.scales
          : {
              y: {
                beginAtZero: true,
                grid: { color: "#eef3f8" },
                ticks: { color: "#64748b" },
              },
              x: { grid: { display: false }, ticks: { color: "#64748b" } },
              ...(config.options?.scales || {}),
            },
      ...config.options,
    },
  });
}
function initCharts() {
  Object.values(state.charts).forEach((c) => c.destroy());
  state.charts = {};
  const data = getFilteredRecords();
  if (!data.length) return;

  if (state.tab === "overview") {
    const scores = data.map((d) => d.score);
    const bins = [
      { label: "0–49", min: 0, max: 49 },
      { label: "50–59", min: 50, max: 59 },
      { label: "60–69", min: 60, max: 69 },
      { label: "70–79", min: 70, max: 79 },
      { label: "80–89", min: 80, max: 89 },
      { label: "90–100", min: 90, max: 100 },
    ];
    chart("overviewHistogram", {
      type: "bar",
      data: {
        labels: bins.map((b) => b.label),
        datasets: [
          {
            label: "Records",
            data: bins.map(
              (b) => scores.filter((s) => s >= b.min && s <= b.max).length,
            ),
            backgroundColor: "#0f766e",
            borderRadius: 10,
          },
        ],
      },
    });
    const ss = standardSummaries(data).slice(0, 8).reverse();
    chart("overviewStandards", {
      type: "bar",
      data: {
        labels: ss.map((s) => s.standard),
        datasets: [
          {
            label: "Average score",
            data: ss.map((s) => round(s.avg, 1)),
            backgroundColor: "#2563eb",
            borderRadius: 10,
          },
        ],
      },
      options: { indexAxis: "y", scales: { x: { suggestedMax: 100 } } },
    });
  }
  if (state.tab === "trends") {
    const assess = assessmentSummaries(data);
    chart("trendLine", {
      type: "line",
      data: {
        labels: assess.map((a) => a.assessment),
        datasets: [
          {
            label: "Class average",
            data: assess.map((a) => round(a.avg, 1)),
            borderColor: "#0f766e",
            backgroundColor: "rgba(15,118,110,.12)",
            fill: true,
            tension: 0.35,
            pointRadius: 5,
          },
          {
            label: "Target",
            data: assess.map((a) => Number(state.filters.target)),
            borderColor: "#b7791f",
            borderDash: [6, 6],
            pointRadius: 0,
          },
        ],
      },
      options: { scales: { y: { suggestedMin: 0, suggestedMax: 100 } } },
    });
  }
  if (state.tab === "patterns") {
    drawHeatmapChart();
  }
  if (state.tab === "advanced" && state.analysisRun) {
    renderAnalysisCharts();
  }
}
function renderAnalysisCharts() {
  const selected = state.advanced.selected;
  const data = getFilteredRecords();
  if (selected.includes("distribution")) {
    const scores = data.map((d) => d.score);
    const bins = [
      { label: "0–49", min: 0, max: 49 },
      { label: "50–59", min: 50, max: 59 },
      { label: "60–69", min: 60, max: 69 },
      { label: "70–79", min: 70, max: 79 },
      { label: "80–89", min: 80, max: 89 },
      { label: "90–100", min: 90, max: 100 },
    ];
    chart("analysisDistributionChart", {
      type: "bar",
      data: {
        labels: bins.map((b) => b.label),
        datasets: [
          {
            label: "Number of score records",
            data: bins.map(
              (b) => scores.filter((s) => s >= b.min && s <= b.max).length,
            ),
            backgroundColor: "#4f46e5",
            borderRadius: 10,
          },
        ],
      },
    });
  }
  if (selected.includes("standardPriority")) {
    const ss = standardSummaries(data).slice(0, 10).reverse();
    chart("analysisStandardChart", {
      type: "bar",
      data: {
        labels: ss.map((s) => s.standard),
        datasets: [
          {
            label: "% below target",
            data: ss.map((s) => round(s.belowPct, 0)),
            backgroundColor: "#c2410c",
            borderRadius: 10,
          },
        ],
      },
      options: { indexAxis: "y", scales: { x: { suggestedMax: 100 } } },
    });
  }
  if (selected.includes("growth")) {
    const summaries = studentSummaries(data)
      .filter((s) => Number.isFinite(s.growth))
      .sort((a, b) => a.growth - b.growth)
      .slice(0, 12);
    chart("analysisGrowthChart", {
      type: "bar",
      data: {
        labels: summaries.map((s) => s.student),
        datasets: [
          {
            label: "Growth points",
            data: summaries.map((s) => round(s.growth, 1)),
            backgroundColor: "#0f766e",
            borderRadius: 10,
          },
        ],
      },
    });
  }
  if (selected.includes("prediction")) {
    const pred = predictionAnalysis(data);
    chart("analysisPredictionChart", {
      type: "line",
      data: {
        labels: pred.labels,
        datasets: [
          {
            label: "Actual average",
            data: pred.actual,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,.10)",
            fill: false,
            tension: 0.35,
            pointRadius: 5,
          },
          {
            label: "Projection",
            data: pred.projectedSeries,
            borderColor: "#b7791f",
            borderDash: [6, 6],
            tension: 0.35,
            pointRadius: 5,
          },
        ],
      },
      options: { scales: { y: { suggestedMin: 0, suggestedMax: 100 } } },
    });
  }
  if (selected.includes("correlation")) {
    const corr = correlationAnalysis(data);
    if (corr && corr.pairs.length) {
      chart("analysisCorrelationChart", {
        type: "scatter",
        data: {
          datasets: [
            {
              label: `${corr.field} vs Score`,
              data: corr.pairs.map((p) => ({ x: p.x, y: p.y })),
              backgroundColor: "#0f766e",
              pointRadius: 5,
            },
          ],
        },
        options: {
          scales: {
            x: { title: { display: true, text: corr.field } },
            y: {
              title: { display: true, text: "Score" },
              suggestedMin: 0,
              suggestedMax: 100,
            },
          },
        },
      });
    }
  }
  if (selected.includes("subgroup") || selected.includes("equity")) {
    const sub = subgroupAnalysis(data);
    if (sub.groups.length) {
      chart("analysisSubgroupChart", {
        type: "bar",
        data: {
          labels: sub.groups.map((g) => g.label),
          datasets: [
            {
              label: "Average score",
              data: sub.groups.map((g) => round(g.avg, 1)),
              backgroundColor: "#7c3aed",
              borderRadius: 10,
            },
          ],
        },
        options: { scales: { y: { suggestedMax: 100 } } },
      });
    }
  }
}

function renderLanding() {
  return `
    <main class="hero">
      <section class="hero-card">
        <div>
          <p class="eyebrow">Teacher Data Analysis Studio</p>
          <h1>Data Studio Master</h1>
          <p>A polished, interactive dashboard for assessment data, advanced analysis, prediction, grouping, correlations, and plain-language teacher explanations.</p>
          <div class="hero-grid">
            <div class="hero-pill">📊 Visual dashboards</div>
            <div class="hero-pill">🔮 Prediction analysis</div>
            <div class="hero-pill">👥 Smart groups</div>
            <div class="hero-pill">🎯 Priority standards</div>
            <div class="hero-pill">🔗 Correlations</div>
            <div class="hero-pill">✅ Data quality checks</div>
            <div class="hero-pill">🧭 Planning Studio</div>
          </div>
        </div>
        <div class="drop-card" onclick="document.getElementById('mainFile').click()" ondragover="event.preventDefault(); this.style.borderColor='var(--teal)'" ondragleave="this.style.borderColor='#bdd5e9'" ondrop="event.preventDefault(); this.style.borderColor='#bdd5e9'; handleFile(event.dataTransfer.files[0], 'main')">
          <span class="drop-icon">📂</span>
          <h2>Upload your assessment file</h2>
          <p class="hint">Use .xlsx or .csv. Best columns: Student Name, Score, Standard, Assessment, Class/Period.</p>
          <input class="sr-only" id="mainFile" type="file" accept=".xlsx,.xls,.csv" onchange="handleFile(this.files[0], 'main')"/>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px">
            <button class="btn btn-primary" type="button" onclick="event.stopPropagation(); document.getElementById('mainFile').click()">Choose File</button>
            <button class="btn btn-light" type="button" onclick="event.stopPropagation(); loadSample()">Load Demo Data</button>
          </div>
          <p class="micro" style="margin-top:16px">Data stays in your browser. Nothing is uploaded to a server by this page.</p>
        </div>
      </section>
    </main>
  `;
}
function renderAppShell() {
  return `
    <header class="topbar no-print">
      <div class="brand">
        <div class="brand-mark">DSM</div>
        <div class="brand-copy">
          <span class="brand-title">Data Studio Master</span>
          <span class="brand-subtitle">Teacher-friendly advanced analysis</span>
        </div>
      </div>
      <div class="top-actions">
        <button class="btn btn-light btn-small" onclick="switchTab('planning')">Planning Studio</button>
        <button class="btn btn-light btn-small" onclick="switchTab('action')">Action Plan</button>
        <button class="btn btn-light btn-small" onclick="switchTab('manager')">Data Manager</button>
        <button class="btn btn-light btn-small" onclick="exportCSV()">Export CSV</button>
        <button class="btn btn-light btn-small" onclick="exportReportHTML()">Export Report</button>
        <button class="btn btn-light btn-small" onclick="saveProject()">Save Project</button>
        <button class="btn btn-light btn-small" onclick="document.getElementById('projectFile').click()">Load Project</button>
        <button class="btn btn-light btn-small" onclick="print()">Print / Save PDF</button>
        <button class="btn btn-light btn-small" onclick="copyReport()">Copy Summary</button>
        <button class="btn btn-danger btn-small" onclick="clearAll()">Reset</button>
        <input class="sr-only" id="projectFile" type="file" accept=".json" onchange="loadProjectFile(this.files[0])"/>
      </div>
    </header>
    <div class="shell">
      <aside class="sidebar no-print">
        ${renderSidebar()}
      </aside>
      <main class="main">
        ${renderCurrentTab()}
      </main>
    </div>
  `;
}
function renderSidebar() {
  const items = [
    ["overview", "📊", "Dashboard"],
    ["planning", "🧭", "Planning Studio"],
    ["action", "🚀", "Action Plan"],
    ["trends", "📈", "Growth Trends"],
    ["patterns", "🧩", "Pattern Heatmap"],
    ["groups", "👥", "Instructional Groups"],
    ["students", "🪪", "Student Cards"],
    ["advanced", "🧠", "Advanced Analysis"],
    ["whatif", "🧪", "What-If Lab"],
    ["manager", "📂", "Data Manager"],
    ["help", "❔", "Teacher Guide"],
  ];
  return `
    <section class="side-section">
      <p class="side-title">Views</p>
      <nav class="nav">${items.map(([id, icon, label]) => `<button class="nav-btn ${state.tab === id ? "active" : ""}" onclick="switchTab('${id}')"><span class="nav-emoji">${icon}</span><span>${label}</span></button>`).join("")}</nav>
    </section>
    <section class="side-section">
      <p class="side-title">Current Data</p>
      <div class="tag teal">${state.records.length} score records</div>
      <div class="tag blue">${getAvailable().students.length} students</div>
      <div class="tag purple">${getAvailable().standards.length} standards</div>
      ${state.extraRows.length ? `<div class="tag green">${state.extraRows.length} supplemental rows</div>` : `<div class="tag gold">No supplemental data</div>`}
    </section>
    <section class="side-section">
      <p class="side-title">Teacher Note</p>
      <p class="micro">Use advanced analysis as a planning signal, then confirm with student work, classroom observations, and language/access considerations.</p>
    </section>
  `;
}
function renderCurrentTab() {
  if (!state.records.length) return renderNoData();
  if (state.tab === "overview") return renderOverview();
  if (state.tab === "planning") return renderPlanningStudio();
  if (state.tab === "action") return renderActionPlan();
  if (state.tab === "trends") return renderTrends();
  if (state.tab === "patterns") return renderPatterns();
  if (state.tab === "groups") return renderGroups();
  if (state.tab === "students") return renderStudentCards();
  if (state.tab === "advanced") return renderAdvanced();
  if (state.tab === "whatif") return renderWhatIf();
  if (state.tab === "help") return renderGuide();
  return renderManager();
}
function renderNoData() {
  return `<div class="container"><div class="empty"><h2>No usable score records found</h2><p>Check the Data Manager field mapping and make sure there is a student column and a numeric score column.</p><button class="btn btn-primary" onclick="state.view='landing';render()">Upload Another File</button></div></div>`;
}
function renderFilters() {
  const avail = getAvailable();
  return `
    <section class="card no-print">
      <div class="card-header">
        <div>
          <h2 class="card-title">Focus Controls</h2>
          <p class="card-subtitle">Filter by class, assessment, student, standards, and target score. Every view updates from these controls.</p>
        </div>
      </div>
      <div class="controls">
        <div class="control">
          <label>Class / Period</label>
          <select onchange="updateFilter('className', this.value)">
            <option value="All">All classes</option>
            ${avail.classes.map((c) => `<option value="${escapeAttr(c)}" ${state.filters.className === c ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}
          </select>
        </div>
        <div class="control">
          <label>Assessment</label>
          <select onchange="updateFilter('assessment', this.value)">
            <option value="All">All assessments</option>
            ${avail.assessments.map((a) => `<option value="${escapeAttr(a)}" ${state.filters.assessment === a ? "selected" : ""}>${escapeHtml(a)}</option>`).join("")}
          </select>
        </div>
        <div class="control">
          <label>Quick Student Focus</label>
          <select onchange="updateFilter('focusStudent', this.value)">
            <option value="All">All selected students</option>
            ${avail.students.map((s) => `<option value="${escapeAttr(s)}" ${state.filters.focusStudent === s ? "selected" : ""}>${escapeHtml(s)}</option>`).join("")}
          </select>
        </div>
        <div class="control">
          <label>Proficiency Target</label>
          <input type="number" min="0" max="100" value="${escapeAttr(state.filters.target)}" onchange="updateFilter('target', this.value)"/>
        </div>
      </div>
      <div class="grid grid-2" style="margin-top:16px">
        <div>
          <div class="label" style="margin-bottom:7px">Students</div>
          <div class="multi-box">
            <label class="check-row"><input type="checkbox" ${state.filters.selectedStudents.length === avail.students.length ? "checked" : ""} onchange="setAll('students', this.checked)"/> <strong>Select all students</strong></label>
            ${avail.students.map((s) => `<label class="check-row"><input type="checkbox" data-value="${escapeAttr(s)}" ${state.filters.selectedStudents.includes(s) ? "checked" : ""} onchange="toggleFilter('students', this.dataset.value)"/> ${escapeHtml(s)}</label>`).join("")}
          </div>
        </div>
        <div>
          <div class="label" style="margin-bottom:7px">Standards / Skills</div>
          <div class="multi-box">
            <label class="check-row"><input type="checkbox" ${state.filters.selectedStandards.length === avail.standards.length ? "checked" : ""} onchange="setAll('standards', this.checked)"/> <strong>Select all standards</strong></label>
            ${avail.standards.map((s) => `<label class="check-row"><input type="checkbox" data-value="${escapeAttr(s)}" ${state.filters.selectedStandards.includes(s) ? "checked" : ""} onchange="toggleFilter('standards', this.dataset.value)"/> ${escapeHtml(s)}</label>`).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}
function renderOverview() {
  const data = getFilteredRecords();
  const scores = data.map((d) => d.score);
  const target = Number(state.filters.target);
  const prof = scores.length
    ? (scores.filter((s) => s >= target).length / scores.length) * 100
    : NaN;
  const lowStandards = standardSummaries(data).slice(0, 3);
  return `
    <div class="container">
      ${renderFilters()}
      ${renderCommandCenter(data)}
      <section class="stats-grid">
        <div class="stat"><div class="stat-label">Average Score</div><div class="stat-value">${pct(mean(scores))}</div><div class="stat-note">Across current filtered records</div></div>
        <div class="stat blue"><div class="stat-label">Median Score</div><div class="stat-value">${pct(median(scores))}</div><div class="stat-note">Middle performance point</div></div>
        <div class="stat gold"><div class="stat-label">At / Above Target</div><div class="stat-value">${pct(prof)}</div><div class="stat-note">Target set to ${target}%</div></div>
        <div class="stat red"><div class="stat-label">Score Spread</div><div class="stat-value">${round(Math.max(...scores) - Math.min(...scores), 0)}</div><div class="stat-note">Difference between highest and lowest</div></div>
      </section>
      <section class="grid grid-2">
        <div class="card">
          <div class="card-header"><div><h2 class="card-title">Score Distribution</h2><p class="card-subtitle">How many score records fall into each band?</p></div></div>
          <div class="chart-wrap"><canvas id="overviewHistogram"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><div><h2 class="card-title">Priority Standards</h2><p class="card-subtitle">Lowest-need-to-highest planning signal by standard.</p></div></div>
          <div class="chart-wrap"><canvas id="overviewStandards"></canvas></div>
        </div>
      </section>
      <section class="card soft">
        <div class="card-header">
          <div>
            <h2 class="card-title">Teacher Translation</h2>
            <p class="card-subtitle">Plain-language takeaways from the current filtered view.</p>
          </div>
        </div>
        <div class="translation">${overviewTranslation(scores, prof, lowStandards)}</div>
        <ul class="action-list">
          ${lowStandards.map((s) => `<li><strong>Reteach focus:</strong> ${escapeHtml(s.standard)} has ${pct(s.belowPct)} below target. Start with a short error analysis or 2–3 worked examples before independent practice.</li>`).join("")}
          <li><strong>Next move:</strong> Open Advanced Analysis and run Prediction Analysis + Priority Standards for a planning-ready report.</li>
        </ul>
      </section>
    </div>
  `;
}
function overviewTranslation(scores, prof, standards) {
  if (!scores.length) return "No records are currently selected.";
  const avg = mean(scores),
    spread = Math.max(...scores) - Math.min(...scores),
    target = Number(state.filters.target);
  const status =
    avg >= target
      ? "The class average is currently above the target"
      : "The class average is currently below the target";
  const spreadText =
    spread >= 35
      ? "The wide score spread suggests you should plan differentiated groups rather than one whole-class activity."
      : "The score spread is manageable, so a short whole-class reteach plus targeted checks may work.";
  const low = standards[0]
    ? `The clearest standard to prioritize is ${escapeHtml(standards[0].standard)}.`
    : "No single standard is clearly isolated yet.";
  return `<strong>${status} (${pct(avg)}).</strong> ${pct(prof)} of selected records are at or above ${target}%. ${spreadText} ${low}`;
}
function renderTrends() {
  const data = getFilteredRecords();
  const assess = assessmentSummaries(data);
  return `
    <div class="container">
      ${renderFilters()}
      <section class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Growth Trends</h2>
            <p class="card-subtitle">Track class averages over assessment windows. Use this to notice whether performance is improving, staying flat, or dropping.</p>
          </div>
        </div>
        <div class="chart-wrap tall"><canvas id="trendLine"></canvas></div>
      </section>
      <section class="card">
        <div class="card-header"><div><h2 class="card-title">Assessment Summary Table</h2><p class="card-subtitle">Spreadsheet-ready trend view.</p></div></div>
        ${table(
          ["Assessment", "Records", "Average", "Median", "Spread"],
          assess.map((a) => [
            a.assessment,
            a.n,
            pct(a.avg),
            pct(a.median),
            round(a.sd, 1),
          ]),
        )}
      </section>
    </div>
  `;
}
function renderPatterns() {
  const data = getFilteredRecords();
  const students =
    state.filters.focusStudent === "All"
      ? state.filters.selectedStudents
      : [state.filters.focusStudent];
  const standards = state.filters.selectedStandards;
  const by = grouped(data, (d) => `${d.student}|||${d.standard}`);
  return `
    <div class="container">
      ${renderFilters()}
      <section class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Pattern Heatmap</h2>
            <p class="card-subtitle">Each cell shows the average score for one student on one standard. Hover to see exact values.</p>
          </div>
        </div>
        <div class="table-wrap" style="padding:12px">
          <div class="heatmap">
            <div class="heat-row">
              <div class="heat-label">Student</div>
              <div class="heat-cells" style="grid-template-columns:repeat(${Math.max(1, standards.length)}, minmax(90px,1fr));">
                ${standards.map((s) => `<div class="heat-label" title="${escapeAttr(s)}">${escapeHtml(s)}</div>`).join("")}
              </div>
            </div>
            ${students
              .map(
                (st) => `
              <div class="heat-row">
                <div class="heat-label" title="${escapeAttr(st)}">${escapeHtml(st)}</div>
                <div class="heat-cells" style="grid-template-columns:repeat(${Math.max(1, standards.length)}, minmax(90px,1fr));">
                  ${standards
                    .map((std) => {
                      const rows = by.get(`${st}|||${std}`) || [];
                      const avg = mean(rows.map((r) => r.score));
                      const band = scoreBand(avg, Number(state.filters.target));
                      return `<div class="heat-cell" style="background:${band.color}" title="${escapeAttr(st)} | ${escapeAttr(std)} | ${pct(avg)}">${pct(avg, 0)}</div>`;
                    })
                    .join("")}
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </section>
    </div>
  `;
}
function drawHeatmapChart() {}

function renderGroups() {
  const summaries = studentSummaries();
  const target = Number(state.filters.target);
  const groups = buildGroups(summaries, target);
  const cards = [
    [
      "urgent",
      "red",
      "Intensive Reteach",
      "Students need immediate small-group support with modeling, vocabulary/visual support, and quick checks.",
    ],
    [
      "strategic",
      "gold",
      "Guided Practice",
      "Students are near target but need structured practice and feedback.",
    ],
    [
      "monitor",
      "blue",
      "On Track / Monitor",
      "Students are meeting the target; keep checking for retention and precision.",
    ],
    [
      "extension",
      "green",
      "Extension",
      "Students are ready for challenge tasks, explanation prompts, or peer-coaching roles.",
    ],
  ];
  return `
    <div class="container">
      ${renderFilters()}
      <section class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Instructional Groups</h2>
            <p class="card-subtitle">Flexible, data-informed grouping suggestions. Groups are meant for planning, not permanent labels.</p>
          </div>
          <button class="btn btn-light" onclick="copyGroups()">Copy Groups</button>
        </div>
        <div class="group-grid">
          ${cards
            .map(
              ([key, cls, title, note]) => `
            <div class="group-card ${cls}">
              <div class="group-bar"></div>
              <div class="group-inner">
                <div class="group-title">${title}</div>
                <div class="group-note">${note}</div>
                <div>${groups[key].length ? groups[key].map((s) => `<span class="tag ${cls}">${escapeHtml(s.student)} · ${pct(s.avg, 0)}</span>`).join("") : `<span class="micro">No students in this group right now.</span>`}</div>
              </div>
            </div>`,
            )
            .join("")}
        </div>
      </section>
      <section class="card">
        <div class="card-header"><div><h2 class="card-title">Group Planning Table</h2><p class="card-subtitle">Average, growth, and suggested next move by student.</p></div></div>
        ${table(
          [
            "Student",
            "Average",
            "Growth",
            "Current Band",
            "Suggested Teacher Move",
          ],
          summaries.map((s) => [
            s.student,
            pct(s.avg),
            Number.isFinite(s.growth) ? `${round(s.growth, 1)} pts` : "—",
            scoreBand(s.avg, target).label,
            suggestMove(s, target),
          ]),
        )}
      </section>
    </div>
  `;
}
function buildGroups(summaries, target) {
  return {
    urgent: summaries.filter((s) => s.avg < target - 15),
    strategic: summaries.filter((s) => s.avg >= target - 15 && s.avg < target),
    monitor: summaries.filter((s) => s.avg >= target && s.avg < target + 15),
    extension: summaries.filter((s) => s.avg >= target + 15),
  };
}
function suggestMove(s, target) {
  if (s.avg < target - 15)
    return "Reteach prerequisite skill with visual model, sentence frame, and immediate guided check.";
  if (s.avg < target)
    return "Use guided practice with feedback; check one misconception before independent work.";
  if (s.avg < target + 15)
    return "Continue grade-level practice; ask for written explanation to confirm understanding.";
  return "Offer extension, error analysis, or student-created example/non-example.";
}

function renderAdvanced() {
  return `
    <div class="container">
      ${renderFilters()}
      <section class="card soft">
        <div class="card-header">
          <div>
            <h2 class="card-title">Advanced Analysis Studio</h2>
            <p class="card-subtitle">Choose optional analyses. Each one includes a simple explanation popup and a teacher-friendly interpretation after it runs.</p>
          </div>
          <button class="btn btn-primary" onclick="runSelectedAnalyses()">Run Selected Analyses</button>
        </div>
        <div style="display:flex;gap:9px;flex-wrap:wrap;margin-bottom:14px">
          <button class="btn btn-light btn-small" onclick="selectRecommendedAnalyses()">Recommended Set</button>
          <button class="btn btn-light btn-small" onclick="selectAllAnalyses()">Select All</button>
          <button class="btn btn-light btn-small" onclick="clearAnalyses()">Clear</button>
        </div>
        <div class="analysis-picker">
          ${analysisCatalog
            .map(
              ([key, title, desc, icon]) => `
            <label class="analysis-option">
              <input type="checkbox" ${state.advanced.selected.includes(key) ? "checked" : ""} onchange="toggleAnalysis('${key}', this.checked)"/>
              <span>
                <span class="analysis-title">${icon} ${title}<button type="button" class="info" onclick="event.preventDefault(); event.stopPropagation(); openExplain('${key}')" data-tip="Click for a simple explanation.">?</button></span>
                <span class="analysis-desc">${desc}</span>
              </span>
            </label>`,
            )
            .join("")}
        </div>
        ${renderAdvancedSettings()}
      </section>
      <section id="analysisResults">
        ${state.analysisRun ? renderAnalysisResults() : `<div class="empty"><h2>Choose analyses, then run.</h2><p>The results will appear here with charts, plain-language meaning, and teacher next steps.</p></div>`}
      </section>
    </div>
  `;
}
function renderAdvancedSettings() {
  const corrFields = numericSupplementFields();
  const catFields = categoricalSupplementFields();
  const subgroupOptions = [
    ["className", "Class / Period"],
    ["assessment", "Assessment"],
    ["standard", "Standard"],
    ...catFields.map((f) => [`extra:${f}`, `Supplement: ${f}`]),
  ];
  if (corrFields.length && !state.advanced.corrField)
    state.advanced.corrField = corrFields[0];
  return `
    <div class="grid grid-3" style="margin-top:18px">
      <div class="control">
        <label>Correlation Field <button type="button" class="info" onclick="openExplain('correlation')" data-tip="Pick a number field from supplemental data, such as attendance or behavior points.">?</button></label>
        <select onchange="state.advanced.corrField=this.value; state.analysisRun=false; persistLite(); render()">
          ${corrFields.length ? corrFields.map((f) => `<option value="${escapeAttr(f)}" ${state.advanced.corrField === f ? "selected" : ""}>${escapeHtml(f)}</option>`).join("") : `<option value="">Upload supplemental numeric data first</option>`}
        </select>
      </div>
      <div class="control">
        <label>Subgroup Field <button type="button" class="info" onclick="openExplain('subgroup')" data-tip="Pick the category used for subgroup comparison.">?</button></label>
        <select onchange="state.advanced.subgroupField=this.value; state.analysisRun=false; persistLite(); render()">
          ${subgroupOptions.map(([v, l]) => `<option value="${escapeAttr(v)}" ${state.advanced.subgroupField === v ? "selected" : ""}>${escapeHtml(l)}</option>`).join("")}
        </select>
      </div>
      <div class="control">
        <label>Prediction Steps Ahead</label>
        <input type="number" min="1" max="4" value="${escapeAttr(state.advanced.projectionSteps)}" onchange="state.advanced.projectionSteps=Number(this.value)||1; state.analysisRun=false; persistLite(); render()"/>
      </div>
    </div>
  `;
}
function renderAnalysisResults() {
  const data = getFilteredRecords();
  const selected = state.advanced.selected;
  if (!selected.length)
    return `<div class="empty"><h2>No analyses selected.</h2><p>Select at least one analysis option above.</p></div>`;
  return `<div class="grid" style="gap:18px">${selected.map((key) => renderAnalysisCard(key, data)).join("")}</div>`;
}
function renderAnalysisCard(key, data) {
  const found = analysisCatalog.find((a) => a[0] === key);
  const title = found ? found[1] : key;
  const icon = found ? found[3] : "📌";
  let body = "";
  if (key === "descriptive") body = resultDescriptive(data);
  if (key === "distribution") body = resultDistribution(data);
  if (key === "standardPriority") body = resultStandardPriority(data);
  if (key === "growth") body = resultGrowth(data);
  if (key === "prediction") body = resultPrediction(data);
  if (key === "correlation") body = resultCorrelation(data);
  if (key === "subgroup") body = resultSubgroup(data);
  if (key === "outliers") body = resultOutliers(data);
  if (key === "consistency") body = resultConsistency(data);
  if (key === "intervention") body = resultIntervention(data);
  if (key === "equity") body = resultEquity(data);
  if (key === "reliability") body = resultReliability(data);
  return `
    <article class="result-card">
      <div class="result-head">
        <h3 class="result-title">${icon} ${escapeHtml(title)}</h3>
        <button class="btn btn-light btn-small" onclick="openExplain('${key}')">Explain</button>
      </div>
      <div class="result-body">${body || `<p class="hint">This analysis is not available for the current data selection.</p>`}</div>
    </article>
  `;
}
function resultDescriptive(data) {
  const scores = data.map((d) => d.score);
  const q1 = quantile(scores, 0.25),
    q3 = quantile(scores, 0.75);
  const target = Number(state.filters.target);
  const below = scores.filter((s) => s < target).length;
  return `
    <div class="stats-grid">
      <div class="stat"><div class="stat-label">Mean</div><div class="stat-value">${pct(mean(scores))}</div></div>
      <div class="stat blue"><div class="stat-label">Median</div><div class="stat-value">${pct(median(scores))}</div></div>
      <div class="stat gold"><div class="stat-label">IQR</div><div class="stat-value">${round(q3 - q1, 0)}</div></div>
      <div class="stat red"><div class="stat-label">Below Target</div><div class="stat-value">${below}</div></div>
    </div>
    <div class="translation" style="margin-top:14px"><strong>What this means:</strong> ${scores.length ? `The middle score is ${pct(median(scores))}. ${below} selected score records are below the ${target}% target. A spread of ${round(sd(scores), 1)} standard-deviation points means performance is ${sd(scores) >= 15 ? "fairly uneven, so grouping is likely useful" : "fairly clustered, so a shared reteach may be efficient"}.` : "No selected score records."}</div>
  `;
}
function resultDistribution(data) {
  const scores = data.map((d) => d.score);
  const wide = sd(scores) >= 15;
  return `
    <div class="chart-wrap"><canvas id="analysisDistributionChart"></canvas></div>
    <div class="translation" style="margin-top:14px"><strong>What this means:</strong> Scores are ${wide ? "spread out enough that one lesson will probably not fit everyone equally well" : "clustered enough that a common mini-lesson may be useful"}. Use the distribution to decide how many levels of support to prepare.</div>
  `;
}
function resultStandardPriority(data) {
  const standards = standardSummaries(data);
  const top = standards[0];
  return `
    <div class="chart-wrap"><canvas id="analysisStandardChart"></canvas></div>
    <div class="translation" style="margin-top:14px"><strong>What this means:</strong> ${top ? `${escapeHtml(top.standard)} is the strongest reteach candidate because ${pct(top.belowPct)} of selected records are below target and the average is ${pct(top.avg)}.` : "No standard-level records are available."}</div>
    ${table(
      ["Priority", "Standard", "Average", "% Below Target", "Records"],
      standards
        .slice(0, 8)
        .map((s, i) => [i + 1, s.standard, pct(s.avg), pct(s.belowPct), s.n]),
    )}
  `;
}
function resultGrowth(data) {
  const summaries = studentSummaries(data)
    .filter((s) => Number.isFinite(s.growth))
    .sort((a, b) => a.growth - b.growth);
  const avgGrowth = mean(summaries.map((s) => s.growth));
  return `
    <div class="chart-wrap"><canvas id="analysisGrowthChart"></canvas></div>
    <div class="translation" style="margin-top:14px"><strong>What this means:</strong> Average first-to-latest growth is ${Number.isFinite(avgGrowth) ? round(avgGrowth, 1) : "—"} points. ${avgGrowth >= 5 ? "Overall movement is positive; now focus on students whose growth is flat or negative." : "Growth is limited; consider changing the reteach model, practice format, or feedback cycle."}</div>
    ${table(
      ["Student", "First", "Latest", "Growth", "Planning Note"],
      summaries
        .slice(0, 10)
        .map((s) => [
          s.student,
          pct(s.first),
          pct(s.latest),
          Number.isFinite(s.growth) ? `${round(s.growth, 1)} pts` : "—",
          s.growth < 0
            ? "Check misconception or access barrier"
            : s.growth < 5
              ? "Monitor and give targeted feedback"
              : "Positive movement",
        ]),
    )}
  `;
}
function predictionAnalysis(data) {
  const assess = assessmentSummaries(data);
  const points = assess.map((a, i) => ({
    x: i + 1,
    y: a.avg,
    label: a.assessment,
  }));
  const reg = linearRegression(points);
  const steps = clamp(Number(state.advanced.projectionSteps) || 1, 1, 4);
  const labels = assess.map((a) => a.assessment);
  const actual = assess.map((a) => round(a.avg, 1));
  const projectedSeries = actual.map(() => null);
  let projected = NaN,
    confidence = "Low";
  if (reg) {
    projected = clamp(reg.predict(points.length + steps), 0, 100);
    labels.push(`Projected +${steps}`);
    actual.push(null);
    projectedSeries[projectedSeries.length - 1] = round(
      assess[assess.length - 1]?.avg,
      1,
    );
    projectedSeries.push(round(projected, 1));
    confidence =
      reg.n >= 4 && reg.r2 >= 0.55
        ? "Moderate"
        : reg.n >= 3
          ? "Cautious"
          : "Low";
  }
  return {
    assess,
    points,
    reg,
    labels,
    actual,
    projectedSeries,
    projected,
    confidence,
    steps,
  };
}
function resultPrediction(data) {
  const pred = predictionAnalysis(data);
  const target = Number(state.filters.target);
  if (!pred.reg)
    return `<div class="empty"><h3>Prediction needs at least two assessment windows.</h3><p>Upload or select data with multiple assessments to project a trend.</p></div>`;
  const direction =
    pred.reg.slope > 1
      ? "upward"
      : pred.reg.slope < -1
        ? "downward"
        : "mostly flat";
  const risk =
    pred.projected >= target
      ? "on pace to meet the selected target"
      : "not yet on pace to meet the selected target";
  return `
    <div class="chart-wrap"><canvas id="analysisPredictionChart"></canvas></div>
    <div class="translation" style="margin-top:14px"><strong>What this means:</strong> The current trend is ${direction}. The projected class average ${pred.steps} assessment step(s) ahead is <strong>${pct(pred.projected)}</strong>, so the group is ${risk}. Confidence is <strong>${pred.confidence}</strong> because this is based on ${pred.reg.n} assessment points and trend strength R² ≈ ${round(pred.reg.r2, 2)}.</div>
    ${table(
      ["Metric", "Value", "Teacher Meaning"],
      [
        [
          "Trend per assessment",
          `${round(pred.reg.slope, 1)} pts`,
          pred.reg.slope > 0
            ? "Scores are increasing over time."
            : pred.reg.slope < 0
              ? "Scores are decreasing over time."
              : "Scores are mostly stable.",
        ],
        [
          "Projected average",
          pct(pred.projected),
          pred.projected >= target
            ? "Likely maintain or exceed target if trend continues."
            : "Plan reteach or intervention before the next assessment.",
        ],
        [
          "Confidence",
          pred.confidence,
          "Use as an early-warning signal, not a final decision.",
        ],
      ],
    )}
  `;
}
function resultCorrelation(data) {
  const corr = correlationAnalysis(data);
  if (!corr)
    return `<div class="empty"><h3>Correlation needs supplemental numeric data.</h3><p>Open Data Manager and append a file with Student Name plus a numeric field such as Attendance %, Missing Assignments, Behavior Points, or Intervention Minutes.</p></div>`;
  return `
    <div class="chart-wrap"><canvas id="analysisCorrelationChart"></canvas></div>
    <div class="translation" style="margin-top:14px"><strong>What this means:</strong> ${escapeHtml(corr.field)} and score show a <strong>${describeCorrelation(corr.r)}</strong> relationship (r = ${round(corr.r, 2)}, n = ${corr.n}). ${Math.abs(corr.r) >= 0.35 ? "This pattern is strong enough to discuss as a planning clue." : "This pattern is weak, so avoid over-interpreting it."}</div>
  `;
}
function correlationAnalysis(data) {
  const field = state.advanced.corrField || numericSupplementFields()[0];
  if (!field || !state.extraRows.length) return null;
  const sup = supplementByStudent();
  const byStudent = studentSummaries(data);
  const xs = [],
    ys = [],
    pairs = [];
  byStudent.forEach((s) => {
    const row = sup.get(s.student);
    if (!row) return;
    const x = toNumber(row[field]);
    const y = s.avg;
    if (Number.isFinite(x) && Number.isFinite(y)) {
      xs.push(x);
      ys.push(y);
      pairs.push({ student: s.student, x, y });
    }
  });
  const res = pearson(xs, ys);
  return { field, ...res, pairs };
}
function subgroupAnalysis(data) {
  const field = state.advanced.subgroupField || "className";
  const sup = supplementByStudent();
  const byStudent = studentSummaries(data);
  const groupRows = [];
  byStudent.forEach((s) => {
    let label = "";
    if (field === "className") label = s.rows[0]?.className || "Class";
    else if (field === "assessment")
      label = s.rows[0]?.assessment || "Assessment";
    else if (field === "standard") label = "By standard";
    else if (field.startsWith("extra:")) {
      const f = field.slice(6);
      label = sup.get(s.student)?.[f] || "";
    }
    if (label)
      groupRows.push({ label: String(label), avg: s.avg, student: s.student });
  });
  const byGroup = grouped(groupRows, (r) => r.label);
  const groups = [...byGroup.entries()]
    .map(([label, rows]) => ({
      label,
      n: rows.length,
      avg: mean(rows.map((r) => r.avg)),
      min: Math.min(...rows.map((r) => r.avg)),
      max: Math.max(...rows.map((r) => r.avg)),
    }))
    .sort((a, b) => a.avg - b.avg);
  const gap =
    groups.length >= 2 ? groups[groups.length - 1].avg - groups[0].avg : NaN;
  return { field, groups, gap };
}
function resultSubgroup(data) {
  const sub = subgroupAnalysis(data);
  if (!sub.groups.length)
    return `<div class="empty"><h3>No subgroup field available.</h3><p>Try class period or append supplemental category data.</p></div>`;
  return `
    <div class="chart-wrap"><canvas id="analysisSubgroupChart"></canvas></div>
    <div class="translation" style="margin-top:14px"><strong>What this means:</strong> The difference between the highest and lowest subgroup average is ${Number.isFinite(sub.gap) ? round(sub.gap, 1) : "—"} points. ${sub.gap >= 12 ? "That is large enough to investigate access, attendance, language demands, or instructional support differences." : "This gap is not large enough by itself to suggest a major subgroup concern."}</div>
    ${table(
      ["Group", "Students", "Average", "Lowest", "Highest"],
      sub.groups.map((g) => [g.label, g.n, pct(g.avg), pct(g.min), pct(g.max)]),
    )}
  `;
}
function resultEquity(data) {
  const sub = subgroupAnalysis(data);
  if (sub.groups.length < 2)
    return `<div class="empty"><h3>Equity check needs at least two groups.</h3><p>Select class period, assessment group, or upload a supplemental category field.</p></div>`;
  const low = sub.groups[0],
    high = sub.groups[sub.groups.length - 1];
  return `
    <div class="translation"><strong>Access gap check:</strong> ${escapeHtml(low.label)} averages ${pct(low.avg)}, while ${escapeHtml(high.label)} averages ${pct(high.avg)}. The gap is ${round(sub.gap, 1)} points. ${sub.gap >= 12 ? "This deserves a closer look before the next unit or reteach cycle." : "The gap is present but not the main story unless it repeats across multiple assessments."}</div>
    <ul class="action-list">
      <li><strong>Check access:</strong> Did all groups receive the same modeling, vocabulary supports, and practice time?</li>
      <li><strong>Check task language:</strong> Did the wording or context create an avoidable barrier for multilingual learners?</li>
      <li><strong>Check attendance/work completion:</strong> Are lower averages connected to missing instruction or missing practice?</li>
    </ul>
  `;
}
function resultOutliers(data) {
  const summaries = studentSummaries(data);
  const avgs = summaries.map((s) => s.avg);
  const m = mean(avgs),
    spread = sd(avgs);
  const rows = summaries
    .map((s) => ({ ...s, z: spread ? (s.avg - m) / spread : 0 }))
    .filter((s) => Math.abs(s.z) >= 1.2)
    .sort((a, b) => a.avg - b.avg);
  return `
    <div class="translation"><strong>What this means:</strong> ${rows.length ? `${rows.length} student(s) are noticeably different from the current group pattern.` : "No major outliers are visible in the current selection."} Outliers should be checked with actual student work before making a placement decision.</div>
    ${
      rows.length
        ? table(
            ["Student", "Average", "Distance from Group", "Possible Use"],
            rows.map((s) => [
              s.student,
              pct(s.avg),
              `${round(s.z, 2)} z`,
              s.z < 0
                ? "Urgent check-in / misconception review"
                : "Extension or peer explanation role",
            ]),
          )
        : ""
    }
  `;
}
function resultConsistency(data) {
  const summaries = studentSummaries(data).sort((a, b) => b.sd - a.sd);
  const top = summaries.slice(0, 8);
  return `
    <div class="translation"><strong>What this means:</strong> Students with the highest variation may understand some standards but not others. This is a signal for targeted standard-specific work, not a general ability label.</div>
    ${table(
      ["Student", "Average", "Variation", "Range", "Planning Meaning"],
      top.map((s) => [
        s.student,
        pct(s.avg),
        round(s.sd, 1),
        round(s.spread, 0),
        s.sd >= 15
          ? "Uneven skill profile — diagnose by standard"
          : "Fairly consistent pattern",
      ]),
    )}
  `;
}
function resultIntervention(data) {
  const summaries = studentSummaries(data);
  const target = Number(state.filters.target);
  const groups = buildGroups(summaries, target);
  return `
    <div class="group-grid">
      <div class="group-card red"><div class="group-bar"></div><div class="group-inner"><div class="group-title">Intensive</div><div>${groups.urgent.map((s) => `<span class="tag red">${escapeHtml(s.student)}</span>`).join("") || "<span class='micro'>None</span>"}</div></div></div>
      <div class="group-card gold"><div class="group-bar"></div><div class="group-inner"><div class="group-title">Guided Practice</div><div>${groups.strategic.map((s) => `<span class="tag gold">${escapeHtml(s.student)}</span>`).join("") || "<span class='micro'>None</span>"}</div></div></div>
      <div class="group-card blue"><div class="group-bar"></div><div class="group-inner"><div class="group-title">Monitor</div><div>${groups.monitor.map((s) => `<span class="tag blue">${escapeHtml(s.student)}</span>`).join("") || "<span class='micro'>None</span>"}</div></div></div>
      <div class="group-card green"><div class="group-bar"></div><div class="group-inner"><div class="group-title">Extension</div><div>${groups.extension.map((s) => `<span class="tag green">${escapeHtml(s.student)}</span>`).join("") || "<span class='micro'>None</span>"}</div></div></div>
    </div>
    <div class="translation" style="margin-top:14px"><strong>What this means:</strong> Start with the Intensive and Guided Practice groups. Keep groups flexible and update after the next exit ticket.</div>
  `;
}
function resultReliability(data) {
  const students = unique(data.map((d) => d.student)).length;
  const assessments = unique(data.map((d) => d.assessment)).length;
  const standards = unique(data.map((d) => d.standard)).length;
  const missingScoreRows = state.rawRows.length - state.records.length;
  const checks = [
    [
      "Student sample",
      students >= 8,
      `${students} students selected`,
      students >= 8
        ? "Stronger for group-level planning."
        : "Use caution; small groups can swing easily.",
    ],
    [
      "Assessment windows",
      assessments >= 2,
      `${assessments} assessment(s)`,
      assessments >= 2
        ? "Trend/prediction can be attempted."
        : "Prediction needs more than one assessment.",
    ],
    [
      "Standards represented",
      standards >= 2,
      `${standards} standard(s)`,
      standards >= 2
        ? "Standard comparison is useful."
        : "Standard comparison is limited.",
    ],
    [
      "Readable score rows",
      missingScoreRows === 0,
      `${missingScoreRows} row(s) skipped`,
      missingScoreRows === 0
        ? "All uploaded rows were usable."
        : "Some rows lacked usable student/score data.",
    ],
  ];
  return `
    <div class="quality-grid">
      ${checks.map(([name, good, value, note]) => `<div class="quality-item ${good ? "good" : "warn"}"><div class="mini-title">${good ? "✅" : "⚠️"} ${name}</div><div><strong>${escapeHtml(value)}</strong></div><div class="micro">${escapeHtml(note)}</div></div>`).join("")}
    </div>
    <div class="translation" style="margin-top:14px"><strong>What this means:</strong> ${assessments >= 2 && students >= 8 ? "The selected data is strong enough for planning-level decisions." : "Use this analysis as a starting point and confirm with more evidence before making major decisions."}</div>
  `;
}

function renderCommandCenter(data) {
  const scores = data.map((d) => d.score);
  const standards = standardSummaries(data);
  const pred = predictionAnalysis(data);
  const groups = buildGroups(
    studentSummaries(data),
    Number(state.filters.target),
  );
  const urgentCount = groups.urgent.length + groups.strategic.length;
  const priority = standards[0]?.standard || "No priority standard yet";
  const predictionText = pred.reg
    ? `${pct(pred.projected)} projected next average`
    : "Add another assessment window for prediction";
  const confidence = pred.reg
    ? `${pred.confidence} confidence`
    : "Needs trend data";
  return `
    <section class="command-grid no-print">
      <div class="command-card">
        <div class="command-label">Planning Priority</div>
        <div class="command-title">${escapeHtml(priority)}</div>
        <p class="command-text">${standards[0] ? `${pct(standards[0].belowPct)} below target. Use this as the first reteach candidate.` : "Upload standards/skills to unlock priority ranking."}</p>
      </div>
      <div class="command-card blue">
        <div class="command-label">Prediction Signal</div>
        <div class="command-title">${predictionText}</div>
        <p class="command-text">${confidence}. Treat this as a planning signal, not a label.</p>
      </div>
      <div class="command-card gold">
        <div class="command-label">Support Load</div>
        <div class="command-title">${urgentCount} student(s) need support</div>
        <p class="command-text">Based on the selected target of ${Number(state.filters.target)}%. Open Action Plan for next steps.</p>
      </div>
    </section>
  `;
}

function updatePlanning(key, value) {
  if (key === "minutes")
    state.planning[key] = clamp(Number(value) || 45, 15, 120);
  else if (key === "includeESOL" || key === "includeFamily")
    state.planning[key] = Boolean(value);
  else state.planning[key] = value;
  persistLite();
  render();
}
function planningPurposeLabel(value = state.planning.purpose) {
  const labels = {
    reteach: "Targeted Reteach Groups",
    mixed: "Mixed Collaborative Groups",
    extension: "Extension + Support Split",
    intervention: "Intervention Priority Groups",
    peer: "Peer Support Partnerships",
    testprep: "Test-Prep Rotation Groups",
  };
  return labels[value] || "Targeted Reteach Groups";
}
function listNames(students, limit = 99) {
  const names = students.map((s) => s.student || s.name || s).filter(Boolean);
  if (!names.length) return "No students assigned";
  return (
    names.slice(0, limit).join(", ") +
    (names.length > limit ? ` +${names.length - limit} more` : "")
  );
}
function priorityReason(p, i) {
  if (!p) return "Add standard/skill data to generate stronger priorities.";
  if (i === 0)
    return `Highest urgency: ${pct(p.belowPct)} below target and average ${pct(p.avg)}.`;
  if (p.belowPct >= 50)
    return `Many students are below target (${pct(p.belowPct)}), so this may need a second support cycle.`;
  if (p.sd >= 15)
    return "Scores are uneven, suggesting targeted groups rather than whole-class reteach only.";
  return "Monitor with a short check after the highest-priority standard is addressed.";
}
function buildPlanningGroups(
  summaries = studentSummaries(),
  priorities = standardSummaries(),
  target = Number(state.filters.target),
) {
  const purpose = state.planning.purpose;
  const focus = priorities[0]?.standard || "the priority skill";
  const sortedLow = [...summaries].sort((a, b) => a.avg - b.avg);
  const sortedHigh = [...summaries].sort((a, b) => b.avg - a.avg);
  const base = buildGroups(summaries, target);
  const mk = (
    name,
    kind,
    students,
    focusText,
    teacherMove,
    task,
    check,
    support,
  ) => ({
    name,
    kind,
    students,
    avg: mean(students.map((s) => s.avg)),
    focus: focusText,
    teacherMove,
    task,
    check,
    support,
  });
  if (purpose === "mixed") {
    const buckets = [[], [], [], []];
    sortedHigh.forEach((s, i) => buckets[i % 4].push(s));
    return buckets
      .filter((g) => g.length)
      .map((g, i) =>
        mk(
          `Mixed Team ${i + 1}`,
          "blue",
          g,
          `Collaborative practice on ${focus}`,
          "Assign roles: Reader, Strategy Captain, Evidence Checker, Reporter. Require every student to explain one step.",
          "Complete one shared problem, then create one similar problem with a worked solution.",
          "Each student writes one sentence explaining the strategy.",
          "Use vocabulary cards and sentence frames so language demand does not block the math.",
        ),
      );
  }
  if (purpose === "extension") {
    return [
      mk(
        "Precision Reteach",
        "red",
        [...base.urgent, ...base.strategic],
        focus,
        "Model the misconception, then have students repair an incorrect solution.",
        "Guided practice with immediate feedback and one explain-your-thinking item.",
        "One targeted exit-ticket item on the priority standard.",
        "Provide visuals, word bank, and a first-step sentence frame.",
      ),
      mk(
        "Grade-Level Application",
        "blue",
        base.monitor,
        focus,
        "Give grade-level practice with a required explanation, not just an answer.",
        "Solve independently, compare methods, and revise explanations.",
        "Collect one written explanation for accuracy and vocabulary.",
        "Offer optional sentence kernels for explanations.",
      ),
      mk(
        "Extension Studio",
        "green",
        base.extension,
        `Extend ${focus}`,
        "Use challenge, error analysis, or student-created examples.",
        "Create a harder version of the problem and an answer key.",
        "Students defend why their problem matches the standard.",
        "Push academic vocabulary and precision.",
      ),
    ].filter((g) => g.students.length);
  }
  if (purpose === "intervention") {
    const priority = sortedLow.filter((s) => s.avg < target || s.growth < 0);
    const watch = sortedLow.filter(
      (s) => s.avg >= target && s.avg < target + 10,
    );
    const ready = sortedLow.filter((s) => s.avg >= target + 10);
    return [
      mk(
        "Intervention First",
        "red",
        priority,
        focus,
        "Start with prerequisite language and one modeled example; do not begin with independent practice.",
        "Teacher table: I do → We do → You do one item with feedback.",
        "Ask students to identify the first step and explain why.",
        "Use visual model, vocabulary preview, reduced language load, and frequent checks.",
      ),
      mk(
        "Watch List",
        "gold",
        watch,
        focus,
        "Use guided practice and targeted feedback before students work alone.",
        "Two scaffolded problems with a partner check.",
        "One individual check before release.",
        "Keep sentence frames available but fade them as students gain confidence.",
      ),
      mk(
        "Independent / Extension",
        "green",
        ready,
        focus,
        "Keep students on grade-level work with an extension option.",
        "Independent practice plus error analysis.",
        "One written explanation or peer teach-back.",
        "Require precise math vocabulary.",
      ),
    ].filter((g) => g.students.length);
  }
  if (purpose === "peer") {
    const lows = [...base.urgent, ...base.strategic];
    const highs = [...base.extension, ...base.monitor].sort(
      (a, b) => b.avg - a.avg,
    );
    const pairs = lows.map((s, i) =>
      [s, highs[i % Math.max(1, highs.length)]].filter(Boolean),
    );
    return pairs.map((pair, i) =>
      mk(
        `Peer Support Pair ${i + 1}`,
        "teal",
        pair,
        focus,
        "Give the stronger student a coaching script: ask questions, do not tell answers.",
        "Partner A explains the first step; Partner B checks evidence and asks one why question.",
        "Both students complete the final check independently.",
        "Post talk moves: ‘I noticed…’, ‘Can you explain…?’, ‘The first step is… because…’",
      ),
    );
  }
  if (purpose === "testprep") {
    return [
      mk(
        "Must-Fix Standard",
        "red",
        base.urgent,
        focus,
        "Short reteach on the highest-risk tested skill.",
        "One released-style problem with annotation and answer-choice elimination.",
        "Students explain why two wrong answers are wrong.",
        "Preteach vocabulary and underline command words.",
      ),
      mk(
        "Almost There",
        "gold",
        base.strategic,
        focus,
        "Focus on accuracy, units, and avoiding common traps.",
        "Two mixed-review problems with immediate feedback.",
        "Error analysis: find and fix one mistake.",
        "Use a checklist for steps and labels.",
      ),
      mk(
        "On Track Review",
        "blue",
        base.monitor,
        focus,
        "Maintain fluency and written reasoning.",
        "Timed-but-calm practice set with explanation item.",
        "Students score their confidence and revise one answer.",
        "Offer optional vocabulary support.",
      ),
      mk(
        "Challenge Review",
        "green",
        base.extension,
        `Advanced application of ${focus}`,
        "Use multi-step or constructed-response problems.",
        "Create a test-prep hint card for classmates.",
        "Peer review for precision.",
        "Require formal academic vocabulary.",
      ),
    ].filter((g) => g.students.length);
  }
  return [
    mk(
      "Intensive Reteach",
      "red",
      base.urgent,
      focus,
      "Use direct modeling with visuals, vocabulary, and immediate teacher feedback.",
      "One worked example, one guided problem, one independent check.",
      "Ask: ‘What is the first step, and how do you know?’",
      "Add a visual model, vocabulary bank, sentence frame, and chunked steps.",
    ),
    mk(
      "Guided Practice",
      "gold",
      base.strategic,
      focus,
      "Use scaffolded practice and catch misconceptions before independent work.",
      "Two guided items with partner talk and teacher feedback.",
      "Students complete one similar item independently.",
      "Use sentence starters and a worked-example reference.",
    ),
    mk(
      "Monitor / Grade-Level",
      "blue",
      base.monitor,
      focus,
      "Keep students on grade-level tasks while checking precision.",
      "Independent practice with a required written explanation.",
      "Collect one explanation and one computation check.",
      "Offer vocabulary supports as optional tools.",
    ),
    mk(
      "Extension",
      "green",
      base.extension,
      `Extend ${focus}`,
      "Push reasoning, error analysis, and student-created examples.",
      "Create a challenge problem, solve it, and explain the strategy.",
      "Students defend why their answer is reasonable.",
      "Require precise academic language and multiple representations.",
    ),
  ].filter((g) => g.students.length);
}
function buildAgenda(
  priorities = standardSummaries(),
  groups = buildPlanningGroups(),
  minutes = Number(state.planning.minutes) || 45,
) {
  const focus = priorities[0]?.standard || "priority skill";
  const m = clamp(minutes, 15, 120);
  const intro = Math.max(4, Math.round(m * 0.12));
  const model = Math.max(7, Math.round(m * 0.22));
  const groupsTime = Math.max(12, Math.round(m * 0.38));
  const share = Math.max(4, Math.round(m * 0.12));
  const exit = Math.max(5, m - intro - model - groupsTime - share);
  return [
    [
      `${intro} min`,
      "Launch + goal",
      `Name the focus: ${focus}. Students preview vocabulary and explain what the task is asking.`,
    ],
    [
      `${model} min`,
      "Model the high-leverage move",
      `Teacher models one example and pauses for students to identify the first step, representation, or formula.`,
    ],
    [
      `${groupsTime} min`,
      "Flexible group work",
      `${groups.length} group(s) work on differentiated tasks while the teacher starts with the highest-need group.`,
    ],
    [
      `${share} min`,
      "Compare strategies",
      `Students share one strategy, misconception fix, or sentence using academic vocabulary.`,
    ],
    [
      `${exit} min`,
      "Exit evidence",
      `Students complete a short check that can be uploaded back into Data Studio Master.`,
    ],
  ];
}
function buildAdminBriefText() {
  const data = getFilteredRecords();
  const scores = data.map((d) => d.score);
  const target = Number(state.filters.target);
  const priorities = standardSummaries(data).slice(0, 3);
  const groups = buildPlanningGroups(
    studentSummaries(data),
    priorities,
    target,
  );
  const pred = predictionAnalysis(data);
  return [
    "Data Studio Master — Admin/Coach Brief",
    `Records analyzed: ${data.length}`,
    `Students: ${unique(data.map((d) => d.student)).length}`,
    `Current average: ${pct(mean(scores))}`,
    `At/above target (${target}%): ${scores.length ? pct((scores.filter((s) => s >= target).length / scores.length) * 100) : "—"}`,
    `Top priority: ${priorities[0]?.standard || "Not available"}`,
    priorities[0]
      ? `Rationale: ${pct(priorities[0].belowPct)} below target; average ${pct(priorities[0].avg)}.`
      : "Rationale: add standard data for a clearer priority.",
    pred.reg
      ? `Prediction: ${pct(pred.projected)} projected next average (${pred.confidence} confidence).`
      : "Prediction: more assessment windows needed.",
    "",
    "Instructional response:",
    ...groups.map(
      (g) => `- ${g.name}: ${g.students.length} student(s). ${g.teacherMove}`,
    ),
    "",
    "Evidence to collect next: 3-question exit ticket with one fluency item, one grade-level item, and one written explanation.",
  ].join("\n");
}
function buildStudentFamilySummary(
  s,
  priority,
  target = Number(state.filters.target),
  lang = "EN",
) {
  const band = scoreBand(s.avg, target).label;
  const growth = Number.isFinite(s.growth)
    ? `${round(s.growth, 1)} points`
    : "more data needed";
  if (lang === "ES") {
    return `${s.student}: Fortaleza — está trabajando en ${priority || "la destreza de la clase"}. Promedio actual: ${pct(s.avg)} (${band}). Crecimiento: ${growth}. Próxima meta: explicar el primer paso y mostrar el trabajo con vocabulario matemático. Apoyo en casa: practicar 2–3 problemas cortos y pedir que explique “primero…, porque…”.`;
  }
  return `${s.student}: Strength — working on ${priority || "the class focus skill"}. Current average: ${pct(s.avg)} (${band}). Growth: ${growth}. Next goal: explain the first step and show work using math vocabulary. Home/class support: practice 2–3 short problems and ask, “What do you do first, and why?”`;
}
function buildPlanningPrompt() {
  const data = getFilteredRecords();
  const target = Number(state.filters.target);
  const priorities = standardSummaries(data).slice(0, 3);
  const groups = buildPlanningGroups(
    studentSummaries(data),
    priorities,
    target,
  );
  const pred = predictionAnalysis(data);
  return [
    "I teach Grade 6 math and need a practical, accessible reteach/support plan based on classroom data.",
    `Planning purpose: ${planningPurposeLabel()}`,
    `Time available: ${state.planning.minutes} minutes`,
    `Proficiency target: ${target}%`,
    `Top priority standard/skill: ${priorities[0]?.standard || "not available"}`,
    priorities[0]
      ? `Why this is priority: average ${pct(priorities[0].avg)}; ${pct(priorities[0].belowPct)} below target.`
      : "Why this is priority: standard-level data was not available.",
    pred.reg
      ? `Prediction signal: next projected average ${pct(pred.projected)} (${pred.confidence} confidence).`
      : "Prediction signal: not enough assessment windows for a trend projection.",
    "",
    "Flexible groups:",
    ...groups.map(
      (g) =>
        `- ${g.name}: ${listNames(g.students)}. Focus: ${g.focus}. Teacher move: ${g.teacherMove}`,
    ),
    "",
    "Create a ready-to-teach plan with: a short launch, teacher model, small-group tasks, checks for understanding, ESOL/SPED-friendly supports, student-facing directions, sentence frames, and a 3-question exit ticket. Keep the learning target rigorous; remove barriers without lowering demand.",
  ].join("\n");
}
function renderPlanningStudio() {
  const data = getFilteredRecords();
  const scores = data.map((d) => d.score);
  const target = Number(state.filters.target);
  const priorities = standardSummaries(data).slice(0, 5);
  const summaries = studentSummaries(data);
  const groups = buildPlanningGroups(summaries, priorities, target);
  const agenda = buildAgenda(
    priorities,
    groups,
    Number(state.planning.minutes),
  );
  const pred = predictionAnalysis(data);
  const topFocus = priorities[0]?.standard || "priority skill";
  const familyLang = state.planning.audience === "family-es" ? "ES" : "EN";
  return `
    <div class="container">
      ${renderFilters()}
      <section class="planning-hero">
        <div class="card-header" style="margin-bottom:10px">
          <div>
            <p class="eyebrow">Teacher Decision System</p>
            <h2 class="card-title">Planning Studio</h2>
            <p class="card-subtitle">Convert the dashboard into classroom-ready moves: grouping, mini-lessons, meeting notes, student/family summaries, and an AI lesson-planning prompt.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-light" onclick="copyPlanningStudioSummary()">Copy Planning Summary</button>
            <button class="btn btn-primary" onclick="downloadPlanningReportHTML()">Export Planning Report</button>
          </div>
        </div>
        <div class="planning-controls no-print">
          <div class="control">
            <label>Grouping Purpose</label>
            <select onchange="updatePlanning('purpose', this.value)">
              ${[
                ["reteach", "Targeted reteach"],
                ["mixed", "Mixed collaboration"],
                ["extension", "Extension + support split"],
                ["intervention", "Intervention priority"],
                ["peer", "Peer support partnerships"],
                ["testprep", "Test-prep rotation"],
              ]
                .map(
                  ([v, l]) =>
                    `<option value="${v}" ${state.planning.purpose === v ? "selected" : ""}>${l}</option>`,
                )
                .join("")}
            </select>
          </div>
          <div class="control">
            <label>Minutes Available</label>
            <input type="number" min="15" max="120" value="${escapeAttr(state.planning.minutes)}" onchange="updatePlanning('minutes', this.value)"/>
          </div>
          <div class="control">
            <label>Planning Cycle</label>
            <select onchange="updatePlanning('cycle', this.value)">
              ${["Tomorrow", "3-Day Cycle", "1-Week Cycle", "Data Meeting", "Conference Prep"].map((v) => `<option value="${v}" ${state.planning.cycle === v ? "selected" : ""}>${v}</option>`).join("")}
            </select>
          </div>
          <div class="control">
            <label>Summary Audience</label>
            <select onchange="updatePlanning('audience', this.value)">
              ${[
                ["teacher", "Teacher"],
                ["admin", "Admin/Coach"],
                ["family-en", "Family/Student EN"],
                ["family-es", "Family/Student ES"],
              ]
                .map(
                  ([v, l]) =>
                    `<option value="${v}" ${state.planning.audience === v ? "selected" : ""}>${l}</option>`,
                )
                .join("")}
            </select>
          </div>
        </div>
        <div class="studio-strip" style="margin-top:16px">
          <div class="studio-tile"><div class="tile-icon">🎯</div><h3>Focus</h3><p>${escapeHtml(topFocus)}</p></div>
          <div class="studio-tile"><div class="tile-icon">📊</div><h3>Average</h3><p>${pct(mean(scores))} current average</p></div>
          <div class="studio-tile"><div class="tile-icon">✅</div><h3>Target</h3><p>${scores.length ? pct((scores.filter((s) => s >= target).length / scores.length) * 100) : "—"} at/above ${target}%</p></div>
          <div class="studio-tile"><div class="tile-icon">👥</div><h3>Groups</h3><p>${groups.length} flexible planning group(s)</p></div>
          <div class="studio-tile"><div class="tile-icon">🔮</div><h3>Prediction</h3><p>${pred.reg ? `${pct(pred.projected)} projected` : "Needs more trend data"}</p></div>
        </div>
        <div class="wizard-note" style="margin-top:16px"><strong>Wizard choice:</strong> ${planningPurposeLabel()} changes how groups are built. This lets a teacher choose whether the goal is reteaching, collaboration, intervention, peer support, extension, or test prep.</div>
      </section>

      <section class="planner-grid">
        <div class="card">
          <div class="card-header"><div><h2 class="card-title">Next-Day Teaching Map</h2><p class="card-subtitle">A timed agenda based on ${state.planning.minutes} minutes and the selected grouping purpose.</p></div></div>
          <div class="agenda">${agenda.map(([time, title, text]) => `<div class="agenda-step"><div class="agenda-time">${escapeHtml(time)}</div><div><div class="agenda-title">${escapeHtml(title)}</div><div class="lesson-text">${escapeHtml(text)}</div></div></div>`).join("")}</div>
        </div>
        <div class="card">
          <div class="card-header"><div><h2 class="card-title">Admin / Coach Brief</h2><p class="card-subtitle">Meeting-ready summary of what the data says and what the teacher will do next.</p></div></div>
          <div class="meeting-brief">
            <div class="brief-card"><h3>Need</h3><p class="hint">${priorities[0] ? `${escapeHtml(priorities[0].standard)}: ${pct(priorities[0].belowPct)} below target.` : "Add standard data for a clearer need."}</p></div>
            <div class="brief-card"><h3>Response</h3><p class="hint">${planningPurposeLabel()} with ${groups.length} group(s), starting with the highest-need group.</p></div>
            <div class="brief-card"><h3>Evidence</h3><p class="hint">3-question exit ticket, then re-upload results to check movement.</p></div>
          </div>
          <div class="translation" style="margin-top:14px"><strong>Meeting language:</strong> ${escapeHtml(buildAdminBriefText().split("\n").slice(1, 8).join(" "))}</div>
        </div>
      </section>

      <section class="card">
        <div class="card-header"><div><h2 class="card-title">Small-Group Mini-Lessons</h2><p class="card-subtitle">Each group gets a focus, teacher move, student task, quick check, and access support.</p></div></div>
        <div class="lesson-grid">
          ${groups
            .map(
              (g) => `
            <article class="lesson-card">
              <div class="lesson-head"><div><h3 class="lesson-title">${escapeHtml(g.name)}</h3><div class="tag ${g.kind}">${g.students.length} student(s) · ${pct(g.avg)}</div></div></div>
              <div class="lesson-body">
                <div class="lesson-row"><div class="lesson-label">Students</div><div class="lesson-text">${escapeHtml(listNames(g.students, 18))}</div></div>
                <div class="lesson-row"><div class="lesson-label">Focus</div><div class="lesson-text">${escapeHtml(g.focus)}</div></div>
                <div class="lesson-row"><div class="lesson-label">Teacher Move</div><div class="lesson-text">${escapeHtml(g.teacherMove)}</div></div>
                <div class="lesson-row"><div class="lesson-label">Student Task</div><div class="lesson-text">${escapeHtml(g.task)}</div></div>
                <div class="lesson-row"><div class="lesson-label">Quick Check</div><div class="lesson-text">${escapeHtml(g.check)}</div></div>
                <div class="lesson-row"><div class="lesson-label">Access Support</div><div class="lesson-text">${escapeHtml(g.support)}</div></div>
              </div>
            </article>`,
            )
            .join("")}
        </div>
      </section>

      <section class="grid grid-2">
        <div class="card">
          <div class="card-header"><div><h2 class="card-title">Standards Priority Planner</h2><p class="card-subtitle">Use this sequence when deciding what to reteach first, second, and third.</p></div></div>
          ${table(
            [
              "Priority",
              "Standard / Skill",
              "Why it matters",
              "Recommended Action",
            ],
            priorities.map((p, i) => [
              i + 1,
              p.standard,
              priorityReason(p, i),
              i === 0
                ? "Whole/small-group reteach now"
                : i === 1
                  ? "Second support cycle or spiral review"
                  : "Monitor or embed in practice",
            ]),
          )}
        </div>
        <div class="copy-panel">
          <div class="card-header"><div><h2 class="card-title">AI Prompt Export</h2><p class="card-subtitle">Copy this into ChatGPT, Claude, Gemini, MagicSchool, or another lesson tool.</p></div></div>
          <textarea id="planningPromptText" readonly>${escapeHtml(buildPlanningPrompt())}</textarea>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
            <button class="btn btn-primary" onclick="copyPlanningPrompt()">Copy AI Prompt</button>
            <button class="btn btn-light" onclick="downloadText('data_studio_master_ai_prompt.txt', buildPlanningPrompt(), 'text/plain')">Download Prompt</button>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header"><div><h2 class="card-title">Student / Family Conference Summaries</h2><p class="card-subtitle">Plain-language summaries for quick conferences, goal-setting, SST notes, or family communication.</p></div><button class="btn btn-light" onclick="copyFamilySummaries()">Copy Summaries</button></div>
        <div class="family-grid">
          ${summaries
            .slice(0, 10)
            .map(
              (s) =>
                `<article class="family-card"><h3>${escapeHtml(s.student)}</h3><p class="hint">${escapeHtml(buildStudentFamilySummary(s, topFocus, target, familyLang))}</p></article>`,
            )
            .join("")}
        </div>
      </section>
    </div>
  `;
}
function buildPlanningStudioText() {
  const data = getFilteredRecords();
  const target = Number(state.filters.target);
  const priorities = standardSummaries(data).slice(0, 5);
  const groups = buildPlanningGroups(
    studentSummaries(data),
    priorities,
    target,
  );
  const agenda = buildAgenda(
    priorities,
    groups,
    Number(state.planning.minutes),
  );
  return [
    "Data Studio Master — Planning Studio",
    `Planning purpose: ${planningPurposeLabel()}`,
    `Cycle: ${state.planning.cycle}`,
    `Time: ${state.planning.minutes} minutes`,
    `Priority focus: ${priorities[0]?.standard || "Not available"}`,
    priorities[0]
      ? `Priority rationale: ${pct(priorities[0].belowPct)} below target; average ${pct(priorities[0].avg)}.`
      : "Priority rationale: Add standard data for stronger ranking.",
    "",
    "Next-day agenda:",
    ...agenda.map((a) => `- ${a[0]} ${a[1]}: ${a[2]}`),
    "",
    "Small-group plan:",
    ...groups.map(
      (g) =>
        `- ${g.name} (${g.students.length}): ${listNames(g.students)}. Focus: ${g.focus}. Move: ${g.teacherMove}. Check: ${g.check}`,
    ),
    "",
    "Evidence: Use a 3-question exit ticket, then re-upload results to check whether the support cycle worked.",
  ].join("\n");
}
function copyPlanningStudioSummary() {
  const text = buildPlanningStudioText();
  navigator.clipboard?.writeText(text).then(
    () => toast("Planning summary copied."),
    () => alert(text),
  );
}
function copyPlanningPrompt() {
  const text = buildPlanningPrompt();
  navigator.clipboard?.writeText(text).then(
    () => toast("AI prompt copied."),
    () => alert(text),
  );
}
function copyFamilySummaries() {
  const priorities = standardSummaries();
  const focus = priorities[0]?.standard || "the class focus skill";
  const target = Number(state.filters.target);
  const lang = state.planning.audience === "family-es" ? "ES" : "EN";
  const text = studentSummaries()
    .map((s) => buildStudentFamilySummary(s, focus, target, lang))
    .join("\n\n");
  navigator.clipboard?.writeText(text).then(
    () => toast("Student/family summaries copied."),
    () => alert(text),
  );
}
function buildPlanningReportHTML() {
  const text = buildPlanningStudioText();
  const prompt = buildPlanningPrompt();
  const lines = text.split("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Data Studio Master Planning Report</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#102033;line-height:1.5}h1{font-size:30px;margin-bottom:4px}h2{margin-top:26px;border-bottom:2px solid #dbe5ef;padding-bottom:6px}.box{border:1px solid #dbe5ef;border-radius:12px;background:#f8fafc;padding:14px;margin:12px 0}pre{white-space:pre-wrap;border:1px solid #dbe5ef;border-radius:12px;padding:14px;background:#fbfdff}ul{padding-left:22px}@media print{body{margin:18px}}</style></head><body><h1>Data Studio Master Planning Report</h1><p>Generated ${escapeHtml(new Date().toLocaleString())}</p><div class="box"><strong>${escapeHtml(lines[1] || "Planning purpose")}</strong><br>${escapeHtml(lines[2] || "")}<br>${escapeHtml(lines[3] || "")}</div><h2>Planning Summary</h2><pre>${escapeHtml(text)}</pre><h2>AI Prompt Export</h2><pre>${escapeHtml(prompt)}</pre></body></html>`;
}
function downloadPlanningReportHTML() {
  if (!getFilteredRecords().length) {
    toast("No planning report to export yet.");
    return;
  }
  downloadText(
    "data_studio_master_planning_report.html",
    buildPlanningReportHTML(),
    "text/html",
  );
}

function renderActionPlan() {
  const data = getFilteredRecords();
  const scores = data.map((d) => d.score);
  const target = Number(state.filters.target);
  const priorities = standardSummaries(data).slice(0, 3);
  const summaries = studentSummaries(data);
  const groups = buildGroups(summaries, target);
  const pred = predictionAnalysis(data);
  const focus = priorities[0]?.standard || "the most missed skill";
  const trendLine = pred.reg
    ? `The current trend projects ${pct(pred.projected)} in ${pred.steps} assessment step(s), with ${pred.confidence.toLowerCase()} confidence.`
    : "Prediction needs at least two assessment windows; use the current average and priority standards for now.";
  return `
    <div class="container">
      ${renderFilters()}
      <section class="card soft">
        <div class="card-header">
          <div>
            <h2 class="card-title">Action Plan Generator</h2>
            <p class="card-subtitle">Turns the analysis into a practical 1-week teacher plan: what to reteach, who needs support, and what evidence to collect next.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-light" onclick="copyActionPlan()">Copy Action Plan</button>
            <button class="btn btn-primary" onclick="exportReportHTML()">Export Report</button>
          </div>
        </div>
        <div class="plan-grid">
          <div>
            ${[
              [
                "1",
                "Name the focus",
                `Prioritize <strong>${escapeHtml(focus)}</strong>. ${priorities[0] ? `${pct(priorities[0].belowPct)} of selected records are below target on this standard.` : "A standard column will make this more precise."}`,
              ],
              [
                "2",
                "Teach the shortest high-leverage move",
                `Use a 10–12 minute reteach: model one example, ask students to annotate the thinking, then complete one guided check with immediate feedback.`,
              ],
              [
                "3",
                "Group for practice",
                `${groups.urgent.length} student(s) need intensive reteach, ${groups.strategic.length} need guided practice, ${groups.monitor.length} are on track/monitor, and ${groups.extension.length} are ready for extension.`,
              ],
              [
                "4",
                "Collect quick evidence",
                `Use a 3-question exit ticket: one fluency item, one grade-level item, and one explain-your-thinking prompt. Re-run this dashboard with the exit ticket results.`,
              ],
            ]
              .map(
                (step) =>
                  `<div class="plan-step"><div class="step-number">${step[0]}</div><div><p class="step-title">${step[1]}</p><p class="step-text">${step[2]}</p></div></div>`,
              )
              .join("")}
          </div>
          <div class="segment">
            <div class="segment-head">Teacher Brief</div>
            <div class="segment-body">
              <div class="translation"><strong>Bottom line:</strong> Current average is ${pct(mean(scores))}; ${scores.length ? pct((scores.filter((s) => s >= target).length / scores.length) * 100) : "—"} are at/above ${target}%. ${trendLine}</div>
              <ul class="action-list">
                <li><strong>Level 1 access move:</strong> Add a visual model, vocabulary bank, and sentence frame before independent practice.</li>
                <li><strong>Check for misconception:</strong> Ask students to explain the first step, not just solve.</li>
                <li><strong>Teacher look-for:</strong> Track whether students can identify the operation/strategy before calculating.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section class="grid grid-2">
        <div class="card">
          <div class="card-header"><div><h2 class="card-title">Priority Reteach List</h2><p class="card-subtitle">Use this to decide the lesson focus.</p></div></div>
          ${table(
            ["Rank", "Standard / Skill", "Average", "Below Target", "Records"],
            priorities.map((p, i) => [
              i + 1,
              p.standard,
              pct(p.avg),
              pct(p.belowPct),
              p.n,
            ]),
          )}
        </div>
        <div class="card">
          <div class="card-header"><div><h2 class="card-title">Small-Group Launch</h2><p class="card-subtitle">Flexible groups for the next support cycle.</p></div></div>
          ${table(
            ["Group", "Count", "Teacher Move"],
            [
              [
                "Intensive",
                groups.urgent.length,
                "Model + guided practice + immediate check",
              ],
              [
                "Guided Practice",
                groups.strategic.length,
                "Scaffolded practice with feedback",
              ],
              [
                "Monitor",
                groups.monitor.length,
                "Grade-level task plus explanation",
              ],
              [
                "Extension",
                groups.extension.length,
                "Challenge/error analysis/student-created problem",
              ],
            ],
          )}
        </div>
      </section>
    </div>
  `;
}

function renderStudentCards() {
  const summaries = studentSummaries();
  const target = Number(state.filters.target);
  return `
    <div class="container">
      ${renderFilters()}
      <section class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Student Insight Cards</h2>
            <p class="card-subtitle">Fast student-by-student planning view. Names stay local in the browser. Use print/PDF for team meetings when appropriate.</p>
          </div>
          <span class="privacy-badge">🔒 Local browser only</span>
        </div>
        <div class="student-card-grid">
          ${summaries
            .map((s) => {
              const band = scoreBand(s.avg, target);
              const pctWidth = clamp(s.avg, 0, 100);
              const lowStandards =
                standardSummaries(s.rows)
                  .slice(0, 2)
                  .map((x) => x.standard)
                  .join(", ") || "General practice";
              return `<article class="student-card">
              <h3>${escapeHtml(s.student)}</h3>
              <div class="tag ${band.cls || "blue"}">${band.label} · ${pct(s.avg)}</div>
              <div class="meter"><div class="meter-fill" style="width:${pctWidth}%;"></div></div>
              <p class="micro"><strong>Growth:</strong> ${Number.isFinite(s.growth) ? `${round(s.growth, 1)} pts` : "Needs multiple assessments"}</p>
              <p class="micro"><strong>Focus:</strong> ${escapeHtml(lowStandards)}</p>
              <p class="micro"><strong>Move:</strong> ${escapeHtml(suggestMove(s, target))}</p>
            </article>`;
            })
            .join("")}
        </div>
      </section>
    </div>
  `;
}

function renderWhatIf() {
  const data = getFilteredRecords();
  const scores = data.map((d) => d.score);
  const currentAvg = mean(scores);
  const currentTarget = Number(state.filters.target);
  const plus5 = clamp(currentAvg + 5, 0, 100);
  const plus10 = clamp(currentAvg + 10, 0, 100);
  const changedTargetProf = scores.length
    ? (scores.filter((s) => s >= Math.min(100, currentTarget + 5)).length /
        scores.length) *
      100
    : NaN;
  const pred = predictionAnalysis(data);
  return `
    <div class="container">
      ${renderFilters()}
      <section class="card soft">
        <div class="card-header">
          <div>
            <h2 class="card-title">What-If Planning Lab</h2>
            <p class="card-subtitle">Use simple planning scenarios to see what might happen if scores improve, the target changes, or current trends continue.</p>
          </div>
        </div>
        <div class="whatif-panel">
          <div class="scenario-card">
            <div class="command-label">Scenario A</div>
            <div class="scenario-value">${pct(plus5)}</div>
            <p class="command-title">If the class improves +5 points</p>
            <p class="command-text">A focused reteach cycle could move the average from ${pct(currentAvg)} to ${pct(plus5)}.</p>
          </div>
          <div class="scenario-card">
            <div class="command-label">Scenario B</div>
            <div class="scenario-value">${pct(plus10)}</div>
            <p class="command-title">If intervention adds +10 points</p>
            <p class="command-text">This is a stretch scenario for students receiving intensive support and repeated feedback.</p>
          </div>
          <div class="scenario-card">
            <div class="command-label">Scenario C</div>
            <div class="scenario-value">${pct(changedTargetProf)}</div>
            <p class="command-title">If target rises to ${Math.min(100, currentTarget + 5)}%</p>
            <p class="command-text">This shows how many current records would still meet a more rigorous target.</p>
          </div>
        </div>
        <div class="translation" style="margin-top:16px"><strong>Prediction connection:</strong> ${pred.reg ? `The trend-based projection is ${pct(pred.projected)}. Compare that to the +5 and +10 scenarios to decide whether the next step should be light review, guided reteach, or intensive intervention.` : "Add another assessment window to unlock trend-based prediction."}</div>
      </section>
      <section class="card">
        <div class="card-header"><div><h2 class="card-title">Scenario Planning Notes</h2><p class="card-subtitle">Copy-ready interpretation for planning.</p></div></div>
        <ul class="action-list">
          <li><strong>Light review:</strong> Use when the class is near target and the priority standard has a manageable below-target rate.</li>
          <li><strong>Guided reteach:</strong> Use when average performance is below target but many students are close.</li>
          <li><strong>Intensive support:</strong> Use when both average and growth are low, or when the same standard stays below target across assessments.</li>
        </ul>
      </section>
    </div>
  `;
}

function renderGuide() {
  return `
    <div class="container">
      <section class="card soft">
        <div class="card-header"><div><h2 class="card-title">Teacher Guide</h2><p class="card-subtitle">A simple operating guide so Data Studio Master is usable by teachers with any level of data background.</p></div></div>
        <div class="guide-grid">
          <div class="guide-card"><h3>1. Upload clean score data</h3><p class="hint">Best columns: Student Name, Score, Standard/Skill, Assessment, Class/Period. CSV or XLSX both work.</p></div>
          <div class="guide-card"><h3>2. Check field mapping</h3><p class="hint">Open Data Manager if the wrong column was detected. Remap Student, Score, Standard, Assessment, and Class.</p></div>
          <div class="guide-card"><h3>3. Start with Action Plan</h3><p class="hint">The Action Plan turns data into a reteach focus, grouping suggestion, and evidence collection plan.</p></div>
          <div class="guide-card"><h3>4. Use Advanced Analysis carefully</h3><p class="hint">Run prediction, correlation, subgroup, and reliability checks as planning signals. Confirm with student work.</p></div>
          <div class="guide-card"><h3>5. Add supplemental data</h3><p class="hint">Attendance, language level, missing work, intervention group, or tutoring minutes can power correlation and subgroup analysis.</p></div>
          <div class="guide-card"><h3>6. Export for meetings</h3><p class="hint">Use Export Report for a portable HTML report, Export CSV for spreadsheet work, and Print/Save PDF for sharing.</p></div>
        </div>
      </section>
    </div>
  `;
}

function copyActionPlan() {
  const data = getFilteredRecords();
  const target = Number(state.filters.target);
  const priorities = standardSummaries(data).slice(0, 3);
  const groups = buildGroups(studentSummaries(data), target);
  const pred = predictionAnalysis(data);
  const text = [
    "Data Studio Master — Action Plan",
    `Target: ${target}%`,
    `Priority focus: ${priorities[0]?.standard || "Not available"}`,
    priorities[0]
      ? `Why: average ${pct(priorities[0].avg)}, ${pct(priorities[0].belowPct)} below target.`
      : "Why: add standard/skill data for a clearer priority.",
    "",
    "Flexible Groups:",
    `Intensive: ${groups.urgent.map((s) => s.student).join(", ") || "None"}`,
    `Guided Practice: ${groups.strategic.map((s) => s.student).join(", ") || "None"}`,
    `Monitor: ${groups.monitor.map((s) => s.student).join(", ") || "None"}`,
    `Extension: ${groups.extension.map((s) => s.student).join(", ") || "None"}`,
    "",
    pred.reg
      ? `Prediction: ${pct(pred.projected)} projected next average (${pred.confidence} confidence).`
      : "Prediction: needs at least two assessment windows.",
    "",
    "Next evidence: 3-question exit ticket with one fluency item, one grade-level item, and one explain-your-thinking prompt.",
  ].join("\n");
  navigator.clipboard?.writeText(text).then(
    () => toast("Action plan copied."),
    () => alert(text),
  );
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function exportCSV() {
  const data = getFilteredRecords();
  if (!data.length) {
    toast("No data to export.");
    return;
  }
  const rows = [
    ["Student", "Class/Period", "Assessment", "Standard", "Score"],
  ].concat(
    data.map((d) => [
      d.student,
      d.className,
      d.assessment,
      d.standard,
      d.score,
    ]),
  );
  downloadText(
    "data_studio_master_filtered_records.csv",
    rows.map((r) => r.map(csvEscape).join(",")).join("\n"),
    "text/csv",
  );
}
function buildPortableReportHTML() {
  const data = getFilteredRecords();
  const scores = data.map((d) => d.score);
  const target = Number(state.filters.target);
  const standards = standardSummaries(data).slice(0, 5);
  const summaries = studentSummaries(data);
  const groups = buildGroups(summaries, target);
  const pred = predictionAnalysis(data);
  const now = new Date().toLocaleString();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Data Studio Master Report</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#102033;line-height:1.5}h1{font-size:30px;margin-bottom:4px}h2{margin-top:28px;border-bottom:2px solid #dbe5ef;padding-bottom:6px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.card{border:1px solid #dbe5ef;border-radius:12px;padding:14px;background:#f8fafc}.value{font-size:28px;font-weight:800}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #dbe5ef;padding:8px;text-align:left}th{background:#eef4f8}.note{background:#e8f7f4;border:1px solid #bfe9e1;border-radius:12px;padding:14px;margin-top:14px}@media print{body{margin:18px}}</style></head><body><h1>Data Studio Master Report</h1><p>Generated ${escapeHtml(now)}. This report is based on the active filters in the dashboard.</p><div class="grid"><div class="card"><strong>Records</strong><div class="value">${data.length}</div></div><div class="card"><strong>Students</strong><div class="value">${unique(data.map((d) => d.student)).length}</div></div><div class="card"><strong>Average</strong><div class="value">${pct(mean(scores))}</div></div><div class="card"><strong>At/Above Target</strong><div class="value">${scores.length ? pct((scores.filter((s) => s >= target).length / scores.length) * 100) : "—"}</div></div></div><div class="note"><strong>Teacher Translation:</strong> ${overviewTranslation(scores, scores.length ? (scores.filter((s) => s >= target).length / scores.length) * 100 : NaN, standards)}</div><h2>Priority Standards</h2><table><thead><tr><th>Rank</th><th>Standard</th><th>Average</th><th>Below Target</th><th>Records</th></tr></thead><tbody>${standards.map((s, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(s.standard)}</td><td>${pct(s.avg)}</td><td>${pct(s.belowPct)}</td><td>${s.n}</td></tr>`).join("")}</tbody></table><h2>Prediction</h2><p>${pred.reg ? `Projected next average: <strong>${pct(pred.projected)}</strong> (${pred.confidence} confidence; R² ≈ ${round(pred.reg.r2, 2)}).` : "Prediction needs at least two assessment windows."}</p><h2>Flexible Groups</h2><table><thead><tr><th>Group</th><th>Students</th></tr></thead><tbody><tr><td>Intensive</td><td>${escapeHtml(groups.urgent.map((s) => s.student).join(", ") || "None")}</td></tr><tr><td>Guided Practice</td><td>${escapeHtml(groups.strategic.map((s) => s.student).join(", ") || "None")}</td></tr><tr><td>Monitor</td><td>${escapeHtml(groups.monitor.map((s) => s.student).join(", ") || "None")}</td></tr><tr><td>Extension</td><td>${escapeHtml(groups.extension.map((s) => s.student).join(", ") || "None")}</td></tr></tbody></table><h2>Recommended Next Step</h2><p>Use the top priority standard for a short reteach cycle, collect a 3-question exit ticket, and re-run Data Studio Master to check movement.</p></body></html>`;
}
function exportReportHTML() {
  if (!getFilteredRecords().length) {
    toast("No report to export yet.");
    return;
  }
  downloadText(
    "data_studio_master_report.html",
    buildPortableReportHTML(),
    "text/html",
  );
}
function saveProject() {
  const payload = {
    app: "Data Studio Master",
    version: "2.0",
    savedAt: new Date().toISOString(),
    rawRows: state.rawRows,
    rawHeaders: state.rawHeaders,
    extraRows: state.extraRows,
    extraHeaders: state.extraHeaders,
    fields: state.fields,
    filters: state.filters,
    advanced: state.advanced,
    planning: state.planning,
  };
  downloadText(
    "data_studio_master_project.json",
    JSON.stringify(payload, null, 2),
    "application/json",
  );
}
function loadProjectFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const payload = JSON.parse(e.target.result);
      if (!payload || !Array.isArray(payload.rawRows))
        throw new Error(
          "This does not look like a Data Studio Master project file.",
        );
      state.rawRows = payload.rawRows || [];
      state.rawHeaders = payload.rawHeaders || buildHeaders(state.rawRows);
      state.extraRows = payload.extraRows || [];
      state.extraHeaders =
        payload.extraHeaders || buildHeaders(state.extraRows);
      state.fields = { ...state.fields, ...(payload.fields || {}) };
      rebuildRecordsNoRender();
      state.filters = { ...state.filters, ...(payload.filters || {}) };
      state.advanced = { ...state.advanced, ...(payload.advanced || {}) };
      state.planning = { ...state.planning, ...(payload.planning || {}) };
      state.view = "studio";
      state.tab = "overview";
      state.analysisRun = false;
      persistLite();
      toast("Project loaded.");
      render();
    } catch (err) {
      alert("I could not load that project file.\n\n" + err.message);
    }
  };
  reader.readAsText(file);
}
function downloadText(filename, text, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function renderManager() {
  return `
    <div class="container">
      <section class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Data Manager</h2>
            <p class="card-subtitle">Upload, map, append, and check your data without losing the current workspace.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="document.getElementById('mainFile2').click()">Replace Main Data</button>
            <button class="btn btn-light" onclick="document.getElementById('suppFile').click()">Append Supplemental Data</button>
            <input class="sr-only" id="mainFile2" type="file" accept=".xlsx,.xls,.csv" onchange="handleFile(this.files[0], 'main')"/>
            <input class="sr-only" id="suppFile" type="file" accept=".xlsx,.xls,.csv" onchange="handleFile(this.files[0], 'supplement')"/>
          </div>
        </div>
        <div class="grid grid-2">
          <div class="segment">
            <div class="segment-head">Main Assessment File</div>
            <div class="segment-body">
              <div class="tag teal">${state.rawRows.length} raw rows</div>
              <div class="tag blue">${state.records.length} usable score records</div>
              <div class="tag purple">${state.rawHeaders.length} columns</div>
              ${renderMappingControls()}
            </div>
          </div>
          <div class="segment">
            <div class="segment-head">Supplemental Data</div>
            <div class="segment-body">
              ${state.extraRows.length ? `<div class="tag green">${state.extraRows.length} supplemental rows</div><div class="tag blue">${numericSupplementFields().length} numeric field(s)</div><div class="tag purple">${categoricalSupplementFields().length} category field(s)</div>` : `<p class="hint">Add optional data for richer analysis: attendance, WIDA level, intervention group, missing work, behavior points, tutoring minutes, or any student-level category/number.</p>`}
              <div style="margin-top:12px"><button class="btn btn-light" onclick="document.getElementById('suppFile').click()">Choose Supplemental File</button></div>
            </div>
          </div>
        </div>
      </section>
      <section class="card">
        <div class="card-header"><div><h2 class="card-title">Data Quality Check</h2><p class="card-subtitle">Fast check for common issues before analysis.</p></div></div>
        ${resultReliability(getFilteredRecords())}
      </section>
    </div>
  `;
}
function renderMappingControls() {
  const fields = [
    ["student", "Student Column"],
    ["score", "Score Column"],
    ["standard", "Standard / Skill Column"],
    ["assessment", "Assessment Column"],
    ["className", "Class / Period Column"],
    ["date", "Date Column"],
  ];
  return `
    <div class="grid grid-2" style="margin-top:16px">
      ${fields
        .map(
          ([key, label]) => `
        <div class="control">
          <label>${label}</label>
          <select onchange="setField('${key}', this.value)">
            <option value="">Not used / Auto</option>
            ${state.rawHeaders.map((h) => `<option value="${escapeAttr(h)}" ${state.fields[key] === h ? "selected" : ""}>${escapeHtml(h)}</option>`).join("")}
          </select>
        </div>`,
        )
        .join("")}
    </div>
  `;
}
function table(headers, rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
        <tbody>${rows.length ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${headers.length}">No rows available.</td></tr>`}</tbody>
      </table>
    </div>
  `;
}
function loadSample() {
  const students = [
    "Amara",
    "Ben",
    "Camila",
    "Diego",
    "Elena",
    "Farah",
    "Gabriel",
    "Hana",
    "Isaac",
    "Janelle",
    "Khalil",
    "Lucia",
    "Mateo",
    "Noor",
    "Omar",
    "Priya",
  ];
  const standards = [
    "6.EE.C.9 Variables",
    "6.G.A.1 Area",
    "6.G.A.2 Volume",
    "6.SP.A.1 Statistical Questions",
  ];
  const assessments = [
    "Unit 1 Check",
    "Unit 2 Check",
    "Unit 3 Check",
    "Unit 4 Check",
  ];
  const rows = [];
  students.forEach((student, si) => {
    const base = 50 + (si % 6) * 6 + Math.floor(si / 6) * 3;
    assessments.forEach((assessment, ai) => {
      standards.forEach((standard, sti) => {
        const noise = ((si * 7 + ai * 5 + sti * 11) % 17) - 8;
        const score = clamp(
          base + ai * 5 - (sti === 1 ? 6 : 0) + noise,
          28,
          99,
        );
        rows.push({
          "Student Name": student,
          "Class/Period": si < 8 ? "Period 1" : "Period 2",
          Assessment: assessment,
          Standard: standard,
          "Score (%)": score,
        });
      });
    });
  });
  normalizeRows(rows);
  state.extraRows = students.map((student, i) => ({
    "Student Name": student,
    "Attendance (%)": clamp(78 + ((i * 9) % 23), 70, 100),
    "Missing Assignments": (i * 3) % 7,
    "Language Level Band":
      i % 3 === 0
        ? "Entering/Emerging"
        : i % 3 === 1
          ? "Developing"
          : "Expanding/Bridging",
    "Intervention Group":
      i % 4 === 0 ? "Small Group" : i % 4 === 1 ? "Check-ins" : "Core Only",
  }));
  state.extraHeaders = buildHeaders(state.extraRows);
  state.advanced.corrField = "Attendance (%)";
  toast("Demo data loaded.");
  persistLite();
  render();
}
function copyReport() {
  const data = getFilteredRecords();
  if (!data.length) {
    toast("No report to copy yet.");
    return;
  }
  const scores = data.map((d) => d.score);
  const standards = standardSummaries(data).slice(0, 5);
  const pred = predictionAnalysis(data);
  const text = [
    "Data Studio Master Summary",
    `Records analyzed: ${data.length}`,
    `Students: ${unique(data.map((d) => d.student)).length}`,
    `Average score: ${pct(mean(scores))}`,
    `Median score: ${pct(median(scores))}`,
    `At/above target (${state.filters.target}%): ${pct((scores.filter((s) => s >= state.filters.target).length / scores.length) * 100)}`,
    "",
    "Priority standards:",
    ...standards.map(
      (s, i) =>
        `${i + 1}. ${s.standard}: avg ${pct(s.avg)}, ${pct(s.belowPct)} below target`,
    ),
    "",
    pred.reg
      ? `Prediction: projected next average ${pct(pred.projected)} (${pred.confidence} confidence).`
      : "Prediction: needs at least two assessment windows.",
    "",
    "Teacher next step: Open Planning Studio to generate the small-group plan, next-day agenda, student/family summaries, and AI prompt export.",
  ].join("\n");
  navigator.clipboard?.writeText(text).then(
    () => toast("Summary copied."),
    () => alert(text),
  );
}
function copyGroups() {
  const groups = buildGroups(studentSummaries(), Number(state.filters.target));
  const text = [
    "Instructional Groups",
    `Intensive: ${groups.urgent.map((s) => s.student).join(", ") || "None"}`,
    `Guided Practice: ${groups.strategic.map((s) => s.student).join(", ") || "None"}`,
    `Monitor: ${groups.monitor.map((s) => s.student).join(", ") || "None"}`,
    `Extension: ${groups.extension.map((s) => s.student).join(", ") || "None"}`,
  ].join("\n");
  navigator.clipboard?.writeText(text).then(
    () => toast("Groups copied."),
    () => alert(text),
  );
}
function render() {
  const app = document.getElementById("app");
  if (state.view === "landing") app.innerHTML = renderLanding();
  else app.innerHTML = renderAppShell();
  initCharts();
}
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
if (restoreLite()) {
  render();
} else {
  render();
}
