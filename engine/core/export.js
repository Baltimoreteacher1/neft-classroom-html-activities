/**
 * Export module — generates a downloadable .docx (HTML-based) from lesson state.
 * No external libraries required; uses browser Blob API.
 */

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function escHtml(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}

/**
 * Build a clean HTML document string from lesson state + config.
 */
function buildExportHtml(state, config) {
  const s = state.get();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const studentName = s.studentName || "Student";
  const studentPeriod = s.studentPeriod ? `Period ${s.studentPeriod}` : "";
  const totalStars = s.phases.reduce((sum, p) => sum + (p.stars || 0), 0);
  const accuracy =
    s.totalAttempts > 0
      ? Math.round((s.totalCorrect / s.totalAttempts) * 100)
      : 100;

  // Collect responses by phase
  const phaseNames = [
    "Launch",
    "Vocab Builder",
    "Explore",
    "Practice",
    "Connect",
    "Reflect",
  ];

  let responseSections = "";

  // Phase 0: Launch
  const notice = s.responses["0_notice"] || "";
  const wonder = s.responses["0_wonder"] || "";
  if (notice || wonder) {
    responseSections += `
      <h2 style="color:#1FA6A2; border-bottom:2px solid #1FA6A2; padding-bottom:4px;">
        Phase 1: Launch
      </h2>
      <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
        <tr>
          <td style="padding:8px 12px; background:#DFF2EE; border:1px solid #ccc; width:120px; font-weight:bold;">I Notice</td>
          <td style="padding:8px 12px; border:1px solid #ccc;">${escHtml(notice)}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px; background:#FCE6DE; border:1px solid #ccc; font-weight:bold;">I Wonder</td>
          <td style="padding:8px 12px; border:1px solid #ccc;">${escHtml(wonder)}</td>
        </tr>
      </table>`;
  }

  // Phase 1: Vocab Builder (status only)
  const vocabPhase = s.phases[1];
  if (vocabPhase) {
    responseSections += `
      <h2 style="color:#F2C15B; border-bottom:2px solid #F2C15B; padding-bottom:4px;">
        Phase 2: Vocab Builder
      </h2>
      <p>Status: <strong>${vocabPhase.status === "completed" ? "Completed" : "In Progress"}</strong>
         &nbsp;|&nbsp; Stars: ${"★".repeat(vocabPhase.stars)}${"☆".repeat(3 - vocabPhase.stars)}</p>`;
  }

  // Phase 2: Explore (status)
  const explorePhase = s.phases[2];
  if (explorePhase) {
    responseSections += `
      <h2 style="color:#1FA6A2; border-bottom:2px solid #1FA6A2; padding-bottom:4px;">
        Phase 3: Explore
      </h2>
      <p>Status: <strong>${explorePhase.status === "completed" ? "Completed" : "In Progress"}</strong>
         &nbsp;|&nbsp; Stars: ${"★".repeat(explorePhase.stars)}${"☆".repeat(3 - explorePhase.stars)}</p>`;
  }

  // Phase 3: Practice
  const practicePhase = s.phases[3];
  if (practicePhase) {
    responseSections += `
      <h2 style="color:#12355B; border-bottom:2px solid #12355B; padding-bottom:4px;">
        Phase 4: Practice
      </h2>
      <p>Correct: <strong>${practicePhase.correct || 0}</strong> / ${practicePhase.attempts || 0}
         &nbsp;|&nbsp; Stars: ${"★".repeat(practicePhase.stars)}${"☆".repeat(3 - practicePhase.stars)}</p>`;
  }

  // Phase 4: Connect
  const connectPhase = s.phases[4];
  if (connectPhase) {
    responseSections += `
      <h2 style="color:#1FA6A2; border-bottom:2px solid #1FA6A2; padding-bottom:4px;">
        Phase 5: Real-World Connection
      </h2>
      <p>Status: <strong>${connectPhase.status === "completed" ? "Completed" : "In Progress"}</strong>
         &nbsp;|&nbsp; Stars: ${"★".repeat(connectPhase.stars)}${"☆".repeat(3 - connectPhase.stars)}</p>`;
  }

  // Phase 5: Reflect
  const reflect3 = s.responses["5_reflect_3"] || "";
  const reflect2 = s.responses["5_reflect_2"] || "";
  const reflect1 = s.responses["5_reflect_1"] || "";
  const selfAssess = s.responses["5_self-assess"] || "";
  const selfAssessLabel =
    selfAssess === "3"
      ? "Got it!"
      : selfAssess === "2"
        ? "Almost"
        : selfAssess === "1"
          ? "Need help"
          : "Not answered";

  if (reflect3 || reflect2 || reflect1 || selfAssess) {
    responseSections += `
      <h2 style="color:#D9795D; border-bottom:2px solid #D9795D; padding-bottom:4px;">
        Phase 6: Reflect
      </h2>
      <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
        <tr>
          <td style="padding:8px 12px; background:#DFF2EE; border:1px solid #ccc; width:180px; font-weight:bold;">3 things I learned</td>
          <td style="padding:8px 12px; border:1px solid #ccc;">${escHtml(reflect3)}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px; background:#FEF7E0; border:1px solid #ccc; font-weight:bold;">2 connections I made</td>
          <td style="padding:8px 12px; border:1px solid #ccc;">${escHtml(reflect2)}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px; background:#FCE6DE; border:1px solid #ccc; font-weight:bold;">1 question I still have</td>
          <td style="padding:8px 12px; border:1px solid #ccc;">${escHtml(reflect1)}</td>
        </tr>
      </table>
      <p>Self-Assessment: <strong>${escHtml(selfAssessLabel)}</strong></p>`;
  }

  // Also include any other responses not yet covered
  const coveredKeys = new Set([
    "0_notice",
    "0_wonder",
    "5_reflect_3",
    "5_reflect_2",
    "5_reflect_1",
    "5_self-assess",
  ]);
  const extraResponses = Object.entries(s.responses).filter(
    ([k]) => !coveredKeys.has(k),
  );
  if (extraResponses.length) {
    responseSections += `
      <h2 style="color:#12355B; border-bottom:2px solid #12355B; padding-bottom:4px;">
        Additional Responses
      </h2>
      <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
        ${extraResponses
          .map(
            ([k, v]) => `
          <tr>
            <td style="padding:8px 12px; background:#F7F4EC; border:1px solid #ccc; width:180px; font-weight:bold;">${escHtml(k)}</td>
            <td style="padding:8px 12px; border:1px solid #ccc;">${escHtml(String(v))}</td>
          </tr>`,
          )
          .join("")}
      </table>`;
  }

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:w="urn:schemas-microsoft-com:office:word"
  xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escHtml(config.title)} — ${escHtml(studentName)}</title>
  <style>
    body { font-family: Calibri, sans-serif; color: #21313F; margin: 40px; line-height: 1.6; }
    h1 { color: #12355B; font-size: 24pt; margin-bottom: 4px; }
    h2 { font-size: 14pt; margin-top: 24px; margin-bottom: 8px; }
    p { margin: 4px 0 12px; }
    table { font-size: 11pt; }
  </style>
</head>
<body>
  <h1>${escHtml(config.title)}</h1>
  <p style="color:#5F6F80; margin-bottom:4px;">
    ${escHtml(config.standard)} &middot; Unit ${escHtml(String(config.unit || ""))}
  </p>
  <table style="border-collapse:collapse; margin-bottom:24px;">
    <tr>
      <td style="padding:6px 16px 6px 0; font-weight:bold;">Student</td>
      <td style="padding:6px 0;">${escHtml(studentName)}${studentPeriod ? ` &middot; ${escHtml(studentPeriod)}` : ""}</td>
    </tr>
    <tr>
      <td style="padding:6px 16px 6px 0; font-weight:bold;">Date</td>
      <td style="padding:6px 0;">${escHtml(dateStr)} at ${escHtml(timeStr)}</td>
    </tr>
  </table>

  <div style="background:#F7F4EC; border:1px solid #D7E2ED; border-radius:8px; padding:16px; margin-bottom:24px;">
    <table style="width:100%; border-collapse:collapse;">
      <tr>
        <td style="text-align:center; padding:8px;">
          <div style="font-size:24pt; font-weight:bold; color:#F2C15B;">${s.xp}</div>
          <div style="font-size:9pt; color:#5F6F80; font-weight:bold;">Total XP</div>
        </td>
        <td style="text-align:center; padding:8px;">
          <div style="font-size:24pt; font-weight:bold; color:#F2C15B;">${totalStars}/18</div>
          <div style="font-size:9pt; color:#5F6F80; font-weight:bold;">Stars</div>
        </td>
        <td style="text-align:center; padding:8px;">
          <div style="font-size:24pt; font-weight:bold; color:#1FA6A2;">${accuracy}%</div>
          <div style="font-size:9pt; color:#5F6F80; font-weight:bold;">Accuracy</div>
        </td>
        <td style="text-align:center; padding:8px;">
          <div style="font-size:24pt; font-weight:bold; color:#0F7C4A;">${s.phases.filter((p) => p.status === "completed").length}/6</div>
          <div style="font-size:9pt; color:#5F6F80; font-weight:bold;">Phases Done</div>
        </td>
      </tr>
    </table>
    ${s.bestStreak >= 3 ? `<p style="text-align:center; color:#D9795D; font-weight:bold; margin:8px 0 0;">Best streak: ${s.bestStreak} in a row</p>` : ""}
  </div>

  <h2 style="color:#12355B; border-bottom:2px solid #12355B; padding-bottom:4px;">Phase Summary</h2>
  <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
    <tr style="background:#12355B; color:white;">
      <th style="padding:8px 12px; text-align:left;">Phase</th>
      <th style="padding:8px 12px; text-align:center;">Status</th>
      <th style="padding:8px 12px; text-align:center;">Stars</th>
      <th style="padding:8px 12px; text-align:center;">XP</th>
    </tr>
    ${s.phases
      .map(
        (p, i) => `
      <tr style="background:${i % 2 === 0 ? "#FFFFFF" : "#F8FBFC"};">
        <td style="padding:8px 12px; border:1px solid #D7E2ED; font-weight:bold;">${escHtml(p.name)}</td>
        <td style="padding:8px 12px; border:1px solid #D7E2ED; text-align:center;">${p.status === "completed" ? "Completed" : p.status === "active" ? "In Progress" : "Locked"}</td>
        <td style="padding:8px 12px; border:1px solid #D7E2ED; text-align:center;">${"★".repeat(p.stars)}${"☆".repeat(3 - p.stars)}</td>
        <td style="padding:8px 12px; border:1px solid #D7E2ED; text-align:center;">${p.xpEarned || 0}</td>
      </tr>`,
      )
      .join("")}
  </table>

  ${responseSections}

  <hr style="border:none; border-top:1px solid #D7E2ED; margin:32px 0 16px;">
  <p style="color:#5F6F80; font-size:9pt; text-align:center;">
    Neft Teacher &middot; ${escHtml(config.standard)} &middot; Exported ${escHtml(dateStr)}
  </p>
</body>
</html>`;
}

/**
 * Generate a plain-text version for clipboard copy.
 */
function buildPlainText(state, config) {
  const s = state.get();
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const studentName = s.studentName || "Student";
  const totalStars = s.phases.reduce((sum, p) => sum + (p.stars || 0), 0);
  const accuracy =
    s.totalAttempts > 0
      ? Math.round((s.totalCorrect / s.totalAttempts) * 100)
      : 100;

  let text = `${config.title}\n`;
  text += `${config.standard} · Unit ${config.unit || ""}\n`;
  text += `Student: ${studentName}${s.studentPeriod ? ` · Period ${s.studentPeriod}` : ""}\n`;
  text += `Date: ${dateStr}\n\n`;

  text += `--- SCORE SUMMARY ---\n`;
  text += `XP: ${s.xp}/${s.maxXp}  |  Stars: ${totalStars}/18  |  Accuracy: ${accuracy}%\n`;
  text += `Phases Completed: ${s.phases.filter((p) => p.status === "completed").length}/6\n`;
  if (s.bestStreak >= 3) text += `Best Streak: ${s.bestStreak} in a row\n`;
  text += `\n`;

  // Phase summary
  s.phases.forEach((p) => {
    const stars = "★".repeat(p.stars) + "☆".repeat(3 - p.stars);
    text += `${p.name}: ${p.status === "completed" ? "Completed" : p.status} ${stars} (${p.xpEarned || 0} XP)\n`;
  });
  text += `\n`;

  // Responses
  const notice = s.responses["0_notice"];
  const wonder = s.responses["0_wonder"];
  if (notice || wonder) {
    text += `--- LAUNCH ---\n`;
    if (notice) text += `I Notice: ${notice}\n`;
    if (wonder) text += `I Wonder: ${wonder}\n`;
    text += `\n`;
  }

  const reflect3 = s.responses["5_reflect_3"];
  const reflect2 = s.responses["5_reflect_2"];
  const reflect1 = s.responses["5_reflect_1"];
  if (reflect3 || reflect2 || reflect1) {
    text += `--- REFLECT ---\n`;
    if (reflect3) text += `3 things I learned: ${reflect3}\n`;
    if (reflect2) text += `2 connections I made: ${reflect2}\n`;
    if (reflect1) text += `1 question I still have: ${reflect1}\n`;
    text += `\n`;
  }

  text += `--- Neft Teacher · ${config.standard} ---\n`;
  return text;
}

/**
 * Download an HTML blob as a .doc file (opens in Word/Google Docs).
 */
function downloadAsDoc(html, filename) {
  // Word/Google Docs can open .doc files containing HTML
  const blob = new Blob(["﻿", html], { type: DOCX_MIME });
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

/**
 * Copy formatted text to clipboard.
 */
async function copyToClipboard(html, plainText) {
  try {
    if (navigator.clipboard && ClipboardItem) {
      const htmlBlob = new Blob([html], { type: "text/html" });
      const textBlob = new Blob([plainText], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob,
        }),
      ]);
      return true;
    }
  } catch (_) {
    /* fall through */
  }
  // Fallback: plain text copy
  try {
    await navigator.clipboard.writeText(plainText);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Build the filename from config + state.
 */
function buildFilename(state, config) {
  const s = state.get();
  const name = (s.studentName || "student").replace(/[^a-zA-Z0-9]/g, "-");
  const standard = (config.standard || "lesson").replace(/[^a-zA-Z0-9.]/g, "-");
  const date = new Date().toISOString().slice(0, 10);
  return `${standard}_${name}_${date}.doc`;
}

/* ── SVG Icons (inline, no external deps) ── */

const ICON_DOWNLOAD = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

const ICON_CLIPBOARD = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`;

const ICON_CHECK = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

const ICON_PDF = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;

/**
 * Create the floating export toolbar and attach to the DOM.
 * Call this once after the main app layout is built.
 */
export function mountExportToolbar(state, config) {
  const bar = document.createElement("div");
  bar.className = "export-toolbar";
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "Save and export");

  // Download button
  const dlBtn = document.createElement("button");
  dlBtn.className = "export-btn export-btn-primary";
  dlBtn.innerHTML = `${ICON_DOWNLOAD}<span>Save to Google Docs</span>`;
  dlBtn.title = "Download as .doc file (open in Google Docs)";
  dlBtn.addEventListener("click", () => {
    const html = buildExportHtml(state, config);
    const filename = buildFilename(state, config);
    downloadAsDoc(html, filename);

    // Brief success flash
    dlBtn.classList.add("export-btn-success");
    const orig = dlBtn.innerHTML;
    dlBtn.innerHTML = `${ICON_CHECK}<span>Downloaded!</span>`;
    setTimeout(() => {
      dlBtn.classList.remove("export-btn-success");
      dlBtn.innerHTML = orig;
    }, 2000);
  });

  // Copy button
  const copyBtn = document.createElement("button");
  copyBtn.className = "export-btn export-btn-secondary";
  copyBtn.innerHTML = `${ICON_CLIPBOARD}<span>Copy</span>`;
  copyBtn.title = "Copy lesson summary to clipboard";
  copyBtn.addEventListener("click", async () => {
    const html = buildExportHtml(state, config);
    const plain = buildPlainText(state, config);
    const ok = await copyToClipboard(html, plain);

    if (ok) {
      copyBtn.classList.add("export-btn-success");
      const orig = copyBtn.innerHTML;
      copyBtn.innerHTML = `${ICON_CHECK}<span>Copied!</span>`;
      setTimeout(() => {
        copyBtn.classList.remove("export-btn-success");
        copyBtn.innerHTML = orig;
      }, 2000);
    }
  });

  // PDF button — opens print dialog with lesson content in a clean print window
  const pdfBtn = document.createElement("button");
  pdfBtn.className = "export-btn export-btn-secondary";
  pdfBtn.innerHTML = `${ICON_PDF}<span>Save as PDF</span>`;
  pdfBtn.title = "Save as PDF via print dialog";
  pdfBtn.addEventListener("click", () => {
    const html = buildExportHtml(state, config);
    const printWin = window.open("", "_blank", "width=800,height=600");
    if (!printWin) return;
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 300);
  });

  bar.append(dlBtn, pdfBtn, copyBtn);
  document.body.prepend(bar);

  return bar;
}
