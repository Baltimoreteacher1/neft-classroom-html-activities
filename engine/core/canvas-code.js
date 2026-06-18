/**
 * canvas-code.js — shows a student their "Canvas completion code" when they
 * finish a lesson, so they can paste it into the matching Canvas assignment.
 *
 * Generation is independent of EduPulse/D1: the code is computed entirely in the
 * browser via the shared codec (assets/canvas-code-codec.js), so it works even
 * when the gradebook backend is unconfigured. Fire-and-forget — never throws into
 * the lesson flow.
 */

const CODEC_SRC = "/assets/canvas-code-codec.js";

/** Load the shared codec once; resolve when window.NeftCanvasCodec is ready. */
function ensureCodec() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.NeftCanvasCodec) return Promise.resolve(window.NeftCanvasCodec);
  return new Promise((resolve) => {
    let s = document.querySelector(`script[src="${CODEC_SRC}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = CODEC_SRC;
      document.body.append(s);
    }
    s.addEventListener("load", () => resolve(window.NeftCanvasCodec || null), {
      once: true,
    });
    s.addEventListener("error", () => resolve(null), { once: true });
    // Already-loaded edge case
    if (window.NeftCanvasCodec) resolve(window.NeftCanvasCodec);
  });
}

function buildPayload(state, config) {
  const s = state.get();
  const totalStars = (s.phases || []).reduce(
    (sum, p) => sum + (p.stars || 0),
    0,
  );
  const percent =
    s.totalAttempts > 0
      ? Math.round((s.totalCorrect / s.totalAttempts) * 100)
      : 0;
  return {
    studentName: s.studentName || "",
    classPeriod: s.studentPeriod || "",
    activityId: config.lessonId || "lesson",
    activityTitle: config.title || config.lessonId || "Lesson",
    score: s.totalCorrect,
    maxScore: s.totalAttempts || 1,
    percent,
    stars: totalStars,
  };
}

function render(code, payload) {
  if (document.getElementById("nt-canvas-code")) return; // once per completion

  const card = document.createElement("div");
  card.id = "nt-canvas-code";
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-label", "Canvas completion code");
  card.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;" +
    "justify-content:center;background:rgba(18,53,91,0.55);backdrop-filter:blur(4px);" +
    "padding:20px;font-family:system-ui,Segoe UI,sans-serif;";

  const needName = !String(payload.n || "").trim();
  const nameNote = needName
    ? '<p style="margin:0 0 12px;color:#b54708;font-weight:600;font-size:14px;">' +
      "⚠ Add your name first (so your teacher can match this to you), then copy the code." +
      "</p>"
    : "";

  card.innerHTML = `
    <div style="background:#fff;border-radius:18px;max-width:440px;width:100%;
                box-shadow:0 24px 60px rgba(0,0,0,0.35);overflow:hidden;">
      <div style="background:#387F84;color:#fff;padding:18px 22px;">
        <div style="font-size:13px;letter-spacing:.5px;opacity:.9;">CANVAS SUBMISSION</div>
        <div style="font-size:20px;font-weight:800;">Your completion code 🎉</div>
      </div>
      <div style="padding:22px;">
        ${nameNote}
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.5;">
          Your code is <strong>copied</strong> — just paste it into the
          <strong>Canvas assignment</strong> for this lesson. (Tap Copy if you need it again.)
        </p>
        <div style="display:flex;gap:8px;align-items:stretch;">
          <input id="nt-cc-input" readonly value="${code}"
                 style="flex:1;font:600 14px ui-monospace,Menlo,monospace;padding:12px;
                        border:2px solid #cbd5e1;border-radius:10px;color:#0f172a;
                        background:#f8fafc;overflow-x:auto;" />
          <button id="nt-cc-copy"
                  style="background:#F2A93B;color:#12355b;font-weight:800;border:0;
                         border-radius:10px;padding:0 16px;cursor:pointer;font-size:14px;">
            Copy
          </button>
        </div>
        <ol style="margin:14px 0 0;padding-left:20px;color:#334155;font-size:13px;line-height:1.7;">
          <li>Go back to the <strong>Canvas assignment</strong> for this lesson.</li>
          <li><strong>Paste</strong> the code into the text box (it's already copied).</li>
          <li>Click <strong>Submit Assignment</strong>.</li>
        </ol>
        <p style="margin:10px 0 0;color:#64748b;font-size:13px;">
          Score recorded: <strong>${payload.s}/${payload.m}</strong> (${payload.pc}%).
        </p>
        <div style="text-align:right;margin-top:18px;">
          <button id="nt-cc-close"
                  style="background:transparent;color:#475569;border:0;cursor:pointer;
                         font-size:14px;font-weight:600;">Close</button>
        </div>
      </div>
    </div>`;

  document.body.append(card);

  const input = card.querySelector("#nt-cc-input");
  const copyBtn = card.querySelector("#nt-cc-copy");
  const flagCopied = () => {
    copyBtn.textContent = "Copied ✓";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1600);
  };
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      input.select();
      document.execCommand("copy");
    }
    flagCopied();
  };
  copyBtn.addEventListener("click", doCopy);
  // Auto-copy on completion so the student only has to paste into Canvas.
  // The lesson-finish event usually follows a click, so the clipboard gesture
  // is honored; if the browser blocks it, the Copy button still works.
  doCopy().catch(() => {});
  const close = () => card.remove();
  card.querySelector("#nt-cc-close").addEventListener("click", close);
  card.addEventListener("click", (e) => {
    if (e.target === card) close();
  });
}

/** True when the lesson is launched inside a SCORM package (?lms=scorm). */
function isScormLaunch() {
  try {
    return /(?:^|[?&])lms=scorm(?:&|$)/.test(window.location.search);
  } catch {
    return false;
  }
}

/**
 * Report the score to a parent frame (SCORM package launcher or any embedder).
 * The SCORM launcher relays this to Canvas's gradebook automatically — no codes.
 */
function reportToParent(payload) {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          source: "neft-lesson",
          type: "score",
          percent: payload.percent,
          score: payload.score,
          max: payload.maxScore,
          lessonId: payload.activityId,
          title: payload.activityTitle,
        },
        "*",
      );
    }
  } catch {
    /* never break the lesson */
  }
}

/** Generate + show the completion code. Safe to call once on lesson completion. */
export async function showCanvasCode(state, config) {
  try {
    const payload = buildPayload(state, config);
    // Always tell a parent frame the score (SCORM auto-grading / embeds).
    reportToParent(payload);
    // Inside a SCORM package the grade is automatic — skip the manual code UI.
    if (isScormLaunch()) return;
    const codec = await ensureCodec();
    if (!codec) return;
    const code = codec.encode(payload);
    // payload echoes the compact keys for the summary line
    render(code, codec.decode(code).payload || {});
  } catch {
    // never break the lesson
  }
}
