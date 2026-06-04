/**
 * Grading + gradebook module — local-first only.
 *
 * Computes an auto-grade from tracked lesson state at completion, assigns a
 * mastery band matching the Forecast/Evidence studio bands, persists a result
 * record to a localStorage gradebook (key `rma_gradebook`), and exports the
 * result as CSV (Forecast-import compatible), JSON, or a printable summary.
 *
 * NO network calls. Everything stays on the device; downloads only.
 */

const GRADEBOOK_KEY = "rma_gradebook";

/* HTML-escape helper (DOM-based, no deps). */
function esc(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}

/* CSV cell quoting per RFC 4180 (handles comma/quote/newline). */
function csvCell(value) {
  const v = value == null ? "" : String(value);
  if (/[",\r\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

/**
 * Mastery bands — kept consistent with the Forecast/Evidence studio.
 *   >=85 Strong | >=70 Likely Ready | >=60 Approaching | else Needs Reteach
 */
export function masteryBand(pct) {
  if (pct >= 85) return "Strong";
  if (pct >= 70) return "Likely Ready";
  if (pct >= 60) return "Approaching";
  return "Needs Reteach";
}

/**
 * Stable student id derived from the name (no PII beyond the name the student
 * typed; matches export.js normalizeStudentId conventions).
 */
function studentIdFromName(name) {
  const slug = (name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return slug ? `S_${slug}` : "S_student";
}

/**
 * Compute an auto-grade from tracked lesson state + config.
 *
 * Score % is correct/attempts. If there were 0 attempts (e.g. a lesson with no
 * graded questions), we fall back to the star-based completion ratio so the
 * student still receives a fair, non-zero grade for finishing.
 */
export function computeGrade(state, config) {
  const s = state.get();
  const correct = s.totalCorrect || 0;
  const attempts = s.totalAttempts || 0;

  let pct;
  let basis;
  if (attempts > 0) {
    pct = Math.round((correct / attempts) * 100);
    basis = "accuracy";
  } else {
    // No graded attempts: grade on completion (stars earned / stars possible).
    const phaseCount = s.phases.length || 0;
    const starsPossible = phaseCount * 3;
    const starsEarned = s.phases.reduce((sum, p) => sum + (p.stars || 0), 0);
    pct =
      starsPossible > 0 ? Math.round((starsEarned / starsPossible) * 100) : 100;
    basis = "completion";
  }

  const band = masteryBand(pct);

  const phaseBreakdown = s.phases.map((p) => {
    const pAttempts = p.attempts || 0;
    const pPct =
      pAttempts > 0
        ? Math.round((p.correct / pAttempts) * 100)
        : p.status === "completed"
          ? Math.round(((p.stars || 0) / 3) * 100)
          : 0;
    return {
      name: p.name,
      status: p.status,
      correct: p.correct || 0,
      attempts: pAttempts,
      stars: p.stars || 0,
      pct: pPct,
    };
  });

  return {
    studentName: s.studentName || "Student",
    studentPeriod: s.studentPeriod || "",
    studentId: studentIdFromName(s.studentName),
    lessonId:
      config.id ||
      config.lessonId ||
      config.title ||
      config.standard ||
      "lesson",
    lessonTitle: config.title || "Lesson",
    standard: config.standard || "",
    correct,
    attempts,
    pct,
    band,
    basis,
    phaseBreakdown,
    date: new Date().toISOString().slice(0, 10),
  };
}

/* ── localStorage gradebook ── */

function readGradebook() {
  try {
    const raw = localStorage.getItem(GRADEBOOK_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

/**
 * Append (or update) a result record in `rma_gradebook`.
 * De-dupes by (lessonId + studentName) so a re-do updates rather than
 * duplicates. Returns the saved record, or null if storage failed.
 */
export function saveGrade(grade) {
  const record = {
    studentName: grade.studentName,
    studentPeriod: grade.studentPeriod,
    lessonId: grade.lessonId,
    lessonTitle: grade.lessonTitle,
    standard: grade.standard,
    correct: grade.correct,
    attempts: grade.attempts,
    pct: grade.pct,
    band: grade.band,
    date: grade.date,
  };
  const book = readGradebook();
  const keyOf = (r) =>
    `${r.lessonId}||${(r.studentName || "").trim().toLowerCase()}`;
  const target = keyOf(record);
  const idx = book.findIndex((r) => keyOf(r) === target);
  if (idx >= 0) book[idx] = record;
  else book.push(record);
  try {
    localStorage.setItem(GRADEBOOK_KEY, JSON.stringify(book));
    return record;
  } catch (_) {
    return null;
  }
}

/* ── Exports (download only) ── */

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function safeFilePart(str, fallback) {
  return (str || fallback).replace(/[^a-zA-Z0-9.]/g, "-");
}

/**
 * Build a CSV string that matches the Forecast/Evidence studio import schema.
 *
 * Header (exact columns the studio expects):
 *   rowType,classId,className,grade,studentId,studentName,tags,standard,
 *   description,score,maxScore,date,assessment
 *
 * We emit a `student` row (so the roster auto-creates the student) and an
 * `evidence` row carrying the lesson grade. The studio reads evidence as
 * score/maxScore => pct, exactly matching our correct/attempts.
 */
export function buildForecastCsv(grade) {
  const header = [
    "rowType",
    "classId",
    "className",
    "grade",
    "studentId",
    "studentName",
    "tags",
    "standard",
    "description",
    "score",
    "maxScore",
    "date",
    "assessment",
  ];
  // When there were no graded attempts we still export a score out of 100
  // (the completion-based pct) so the row is valid (maxScore must be > 0).
  const score = grade.attempts > 0 ? grade.correct : grade.pct;
  const maxScore = grade.attempts > 0 ? grade.attempts : 100;

  const studentRow = [
    "student",
    "",
    "",
    "",
    grade.studentId,
    grade.studentName,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];
  const evidenceRow = [
    "evidence",
    "",
    "",
    "",
    grade.studentId,
    grade.studentName,
    "",
    grade.standard,
    grade.lessonTitle,
    score,
    maxScore,
    grade.date,
    grade.lessonTitle,
  ];

  return [header, studentRow, evidenceRow]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}

export function exportCsv(grade) {
  const csv = buildForecastCsv(grade);
  const filename = `${safeFilePart(grade.standard, "lesson")}_${safeFilePart(grade.studentName, "student")}_${grade.date}.csv`;
  downloadBlob(csv, filename, "text/csv;charset=utf-8");
}

export function exportJson(grade) {
  const filename = `${safeFilePart(grade.standard, "lesson")}_${safeFilePart(grade.studentName, "student")}_${grade.date}.json`;
  downloadBlob(JSON.stringify(grade, null, 2), filename, "application/json");
}

/**
 * Open a clean print view of the grade + per-phase breakdown.
 */
export function printSummary(grade) {
  const rows = grade.phaseBreakdown
    .map(
      (p) => `
      <tr>
        <td>${esc(p.name)}</td>
        <td style="text-align:center;">${p.status === "completed" ? "Completed" : p.status === "active" ? "In Progress" : "Locked"}</td>
        <td style="text-align:center;">${p.attempts > 0 ? `${p.correct}/${p.attempts}` : "&mdash;"}</td>
        <td style="text-align:center;">${"★".repeat(p.stars)}${"☆".repeat(3 - p.stars)}</td>
        <td style="text-align:center;">${p.pct}%</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8">
    <title>${esc(grade.lessonTitle)} — ${esc(grade.studentName)}</title>
    <style>
      body { font-family: Calibri, Arial, sans-serif; color:#21313F; margin:40px; line-height:1.5; }
      h1 { color:#12355B; font-size:22pt; margin-bottom:2px; }
      .sub { color:#5F6F80; margin:0 0 16px; }
      .score { font-size:40pt; font-weight:800; color:#1FA6A2; margin:8px 0 0; }
      .band { display:inline-block; padding:4px 14px; border-radius:999px; background:#DFF2EE; color:#0F7C4A; font-weight:700; }
      table { width:100%; border-collapse:collapse; margin-top:20px; font-size:11pt; }
      th { background:#12355B; color:#fff; padding:8px 10px; text-align:left; }
      td { border:1px solid #D7E2ED; padding:8px 10px; }
      .meta td { border:none; padding:2px 16px 2px 0; }
      footer { margin-top:28px; color:#5F6F80; font-size:9pt; }
      @media print { body { margin:16px; } }
    </style></head><body>
    <h1>${esc(grade.lessonTitle)}</h1>
    <p class="sub">${esc(grade.standard)}</p>
    <table class="meta"><tbody>
      <tr><td style="font-weight:bold;">Student</td><td>${esc(grade.studentName)}${grade.studentPeriod ? ` &middot; Period ${esc(grade.studentPeriod)}` : ""}</td></tr>
      <tr><td style="font-weight:bold;">Date</td><td>${esc(grade.date)}</td></tr>
    </tbody></table>
    <div class="score">${grade.pct}%</div>
    <p style="margin:6px 0 0;"><span class="band">${esc(grade.band)}</span>
      &nbsp;${grade.attempts > 0 ? `(${grade.correct} of ${grade.attempts} correct)` : "(completion-based)"}</p>
    <table><thead><tr>
      <th>Phase</th><th style="text-align:center;">Status</th><th style="text-align:center;">Correct</th>
      <th style="text-align:center;">Stars</th><th style="text-align:center;">Score</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <footer>Neft Teacher &middot; ${esc(grade.standard)} &middot; ${esc(grade.date)}</footer>
    </body></html>`;

  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 300);
}

/* ── Completion-screen grade card ── */

const BAND_COLOR = {
  Strong: "var(--success, #0F7C4A)",
  "Likely Ready": "var(--teal, #1FA6A2)",
  Approaching: "var(--amber, #F2C15B)",
  "Needs Reteach": "var(--coral, #D9795D)",
};

/**
 * Build a grade card element for the completion screen. Computes the grade,
 * saves it to the gradebook, and wires up CSV/JSON/Print buttons.
 *
 * Additive: does not touch existing scoring/phase logic.
 */
export function buildGradeCard(state, config) {
  const grade = computeGrade(state, config);
  saveGrade(grade);

  const wrap = document.createElement("section");
  wrap.className = "card";
  wrap.setAttribute("aria-labelledby", "grade-heading");
  wrap.style.cssText = "margin-top:var(--sp-6); text-align:left;";

  const bandColor = BAND_COLOR[grade.band] || "var(--teal, #1FA6A2)";
  const correctLine =
    grade.attempts > 0
      ? `${grade.correct} of ${grade.attempts} correct`
      : "Based on lesson completion";

  const breakdownRows = grade.phaseBreakdown
    .map(
      (p) => `
      <tr>
        <th scope="row" style="text-align:left; font-weight:700; padding:6px 10px;">${esc(p.name)}</th>
        <td style="text-align:center; padding:6px 10px;">${p.attempts > 0 ? `${p.correct}/${p.attempts}` : "&mdash;"}</td>
        <td style="text-align:center; padding:6px 10px; color:var(--amber);">${"★".repeat(p.stars)}${"☆".repeat(3 - p.stars)}</td>
        <td style="text-align:center; padding:6px 10px; font-weight:700;">${p.pct}%</td>
      </tr>`,
    )
    .join("");

  wrap.innerHTML = `
    <h3 id="grade-heading" style="margin:0 0 var(--sp-3);">Your Grade</h3>
    <div style="display:flex; align-items:center; gap:var(--sp-4); flex-wrap:wrap; margin-bottom:var(--sp-4);">
      <div style="font-size:2.6rem; font-weight:900; color:var(--teal);" aria-label="Score ${grade.pct} percent">${grade.pct}%</div>
      <div>
        <div style="display:inline-block; padding:4px 14px; border-radius:999px; background:${bandColor}; color:#fff; font-weight:800; font-size:0.85rem;">${esc(grade.band)}</div>
        <div style="color:var(--muted); font-size:0.85rem; margin-top:4px;">${esc(correctLine)}</div>
      </div>
    </div>
    <table style="width:100%; border-collapse:collapse; font-size:0.88rem; margin-bottom:var(--sp-5);">
      <caption class="sr-only" style="position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0);">Per-phase score breakdown</caption>
      <thead>
        <tr style="border-bottom:2px solid var(--cream, #eee);">
          <th scope="col" style="text-align:left; padding:6px 10px;">Phase</th>
          <th scope="col" style="text-align:center; padding:6px 10px;">Correct</th>
          <th scope="col" style="text-align:center; padding:6px 10px;">Stars</th>
          <th scope="col" style="text-align:center; padding:6px 10px;">Score</th>
        </tr>
      </thead>
      <tbody>${breakdownRows}</tbody>
    </table>
    <div role="group" aria-label="Save and export results" style="display:flex; flex-wrap:wrap; gap:var(--sp-2);">
      <button type="button" class="btn btn-primary" data-grade-action="csv">Download results (CSV)</button>
      <button type="button" class="btn btn-secondary" data-grade-action="json">Download results (JSON)</button>
      <button type="button" class="btn btn-secondary" data-grade-action="print">Print summary</button>
    </div>
    <p style="color:var(--muted); font-size:0.78rem; margin-top:var(--sp-3);">Saved to this device. The CSV imports directly into the Forecast studio.</p>`;

  const csvBtn = wrap.querySelector('[data-grade-action="csv"]');
  const jsonBtn = wrap.querySelector('[data-grade-action="json"]');
  const printBtn = wrap.querySelector('[data-grade-action="print"]');

  const flash = (btn, label) => {
    const orig = btn.textContent;
    btn.textContent = label;
    btn.classList.add("btn-success");
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove("btn-success");
    }, 2000);
  };

  csvBtn.addEventListener("click", () => {
    exportCsv(grade);
    flash(csvBtn, "Downloaded!");
  });
  jsonBtn.addEventListener("click", () => {
    exportJson(grade);
    flash(jsonBtn, "Downloaded!");
  });
  printBtn.addEventListener("click", () => printSummary(grade));

  return wrap;
}
