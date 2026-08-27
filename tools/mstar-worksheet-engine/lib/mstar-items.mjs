/**
 * mstar-items.mjs — Authentic MSTAR / MCAP Grade 6 Math Assessment Engine
 *
 * Implements Maryland Comprehensive Assessment Program (MCAP) / MSTAR item structures:
 *   - Type I: Conceptual & Procedural (Single-Select, Multi-Select, EBSR Part A/B)
 *   - Type II: Mathematical Reasoning & Constructed Response with Scored Rubric (SMP.3/6)
 *   - Type III: Real-World Modeling & Contextual Problem Solving (SMP.1/4)
 */

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

/**
 * Renders an MSTAR Type I Evidence-Based Selected Response (EBSR) Item (Part A + Part B).
 */
export function renderEBSRItemHtml(pNum, item = {}) {
  const partA = item.partA || {
    prompt: "Solve the problem or choose the correct statement.",
    options: ["Option A", "Option B", "Option C", "Option D"]
  };
  const partB = item.partB || {
    prompt: "Which statement or mathematical equation best supports your answer in Part A?",
    options: ["Evidence A", "Evidence B", "Evidence C", "Evidence D"]
  };

  const renderOpts = (opts) =>
    `<ol class="ws-opts" style="list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;margin-top:6px;">` +
    opts
      .map(
        (opt, i) => `
        <li style="display:flex;align-items:flex-start;gap:8px;">
          <span style="flex:0 0 auto;width:20px;height:20px;border:1.8px solid #0f172a;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:10.5px;">${LETTERS[i]}</span>
          <span style="font-size:12px;font-weight:500;color:#1e293b;">${esc(opt)}</span>
        </li>`
      )
      .join("") +
    `</ol>`;

  return `
    <li class="ws-problem-card" style="background:#ffffff;border:1.5px solid #cbd5e1;border-radius:8px;padding:14px 16px;margin-bottom:14px;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1px solid #f1f5f9;padding-bottom:4px;">
        <span style="display:inline-flex;align-items:center;gap:6px;">
          <span style="width:22px;height:22px;border-radius:50%;background:#0f172a;color:#ffffff;font-weight:800;font-size:11px;display:inline-flex;align-items:center;justify-content:center;">${pNum}</span>
          <span style="font-size:11px;font-weight:800;color:#1d4ed8;letter-spacing:0.04em;">MSTAR · EVIDENCE-BASED SELECTED RESPONSE (EBSR)</span>
        </span>
        <span style="font-size:10px;font-weight:700;color:#64748b;">Type I · 2 Points</span>
      </div>

      <!-- Part A -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;margin-bottom:10px;">
        <div style="font-size:11px;font-weight:800;color:#1d4ed8;margin-bottom:4px;">PART A</div>
        <p style="font-size:12.5px;font-weight:600;color:#0f172a;margin-bottom:6px;">${esc(partA.prompt)}</p>
        ${item.partASvg || ""}
        ${renderOpts(partA.options)}
      </div>

      <!-- Part B -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;">
        <div style="font-size:11px;font-weight:800;color:#0f766e;margin-bottom:4px;">PART B (EVIDENCE &amp; JUSTIFICATION)</div>
        <p style="font-size:12.5px;font-weight:600;color:#0f172a;margin-bottom:6px;">${esc(partB.prompt)}</p>
        ${renderOpts(partB.options)}
      </div>
    </li>
  `;
}

/**
 * Renders an MSTAR Multi-Select Item ("Select ALL that apply").
 */
export function renderMultiSelectItemHtml(pNum, item = {}) {
  const prompt = item.prompt || "Select all statements that are mathematically true.";
  const options = item.options || ["Option A", "Option B", "Option C", "Option D", "Option E"];

  const optsHtml = options
    .map(
      (opt, i) => `
      <li style="display:flex;align-items:flex-start;gap:8px;padding:3px 0;">
        <span style="flex:0 0 auto;width:18px;height:18px;border:1.8px solid #0f172a;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;">${LETTERS[i]}</span>
        <span style="font-size:12px;font-weight:500;color:#1e293b;">${esc(opt)}</span>
      </li>`
    )
    .join("");

  return `
    <li class="ws-problem-card" style="background:#ffffff;border:1.5px solid #cbd5e1;border-radius:8px;padding:14px 16px;margin-bottom:14px;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="display:inline-flex;align-items:center;gap:6px;">
          <span style="width:22px;height:22px;border-radius:50%;background:#0f172a;color:#ffffff;font-weight:800;font-size:11px;display:inline-flex;align-items:center;justify-content:center;">${pNum}</span>
          <span style="font-size:11px;font-weight:800;color:#6b21a8;letter-spacing:0.04em;">MSTAR · MULTI-SELECT (SELECT ALL THAT APPLY)</span>
        </span>
        <span style="font-size:10px;font-weight:700;color:#64748b;">Type I · 1 Point</span>
      </div>
      <p style="font-size:12.5px;font-weight:600;color:#0f172a;margin-bottom:6px;">${esc(prompt)} <span style="color:#b45309;font-weight:800;">(Select ALL that apply.)</span></p>
      ${item.svgHtml || ""}
      <ul style="list-style:none;padding:0;margin:8px 0;display:flex;flex-direction:column;gap:6px;">
        ${optsHtml}
      </ul>
    </li>
  `;
}

/**
 * Renders an MSTAR Type II Constructed Response / Error Analysis Item with Official Scoring Rubric.
 */
export function renderTypeIIReasoningItemHtml(pNum, item = {}) {
  const title = item.title || "Analyze Student Reasoning & Critique Misconception";
  const scenario = item.scenario || "A student was asked to solve the problem below. Review their steps and identify the error.";
  const steps = item.steps || [
    { num: 1, label: "Step 1", text: "Identified the numbers in the problem." },
    { num: 2, label: "Step 2 (Student Error)", text: "Applied the wrong operation or inverted the rule." },
    { num: 3, label: "Step 3", text: "Computed the final incorrect value." }
  ];

  const stepsHtml = steps
    .map(
      (s) => `
      <li style="display:flex;align-items:flex-start;gap:8px;padding:3px 0;font-size:11.5px;">
        <span style="flex:0 0 auto;width:18px;height:18px;border-radius:50%;background:#e2e8f0;font-size:10px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;">${s.num}</span>
        <span style="font-weight:700;color:#0f172a;min-width:70px;">${esc(s.label)}:</span>
        <span style="color:#334155;font-family:'SFMono-Regular',Consolas,monospace;">${esc(s.text)}</span>
      </li>`
    )
    .join("");

  return `
    <li class="ws-problem-card" style="background:#ffffff;border:1.5px solid #cbd5e1;border-left:5px solid #b45309;border-radius:8px;padding:14px 16px;margin-bottom:14px;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="display:inline-flex;align-items:center;gap:6px;">
          <span style="width:22px;height:22px;border-radius:50%;background:#b45309;color:#ffffff;font-weight:800;font-size:11px;display:inline-flex;align-items:center;justify-content:center;">${pNum}</span>
          <span style="font-size:11px;font-weight:800;color:#b45309;letter-spacing:0.04em;">MSTAR TYPE II · REASONING &amp; ERROR ANALYSIS</span>
        </span>
        <span style="font-size:10px;font-weight:800;background:#fef3c7;color:#b45309;padding:2px 8px;border-radius:4px;border:1px solid #fde68a;">SMP.3 / 3-Point Rubric</span>
      </div>

      <p style="font-size:12.5px;font-weight:700;color:#0f172a;margin-bottom:4px;">${esc(title)}</p>
      <p style="font-size:12px;color:#475569;margin-bottom:8px;">${esc(scenario)}</p>
      ${item.svgHtml || ""}

      <!-- Student Work Box -->
      <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:6px;padding:10px 12px;margin-bottom:10px;">
        <div style="font-size:10.5px;font-weight:800;color:#b45309;text-transform:uppercase;margin-bottom:4px;">🔍 Student Work Sample:</div>
        <ol style="list-style:none;padding:0;margin:0;">
          ${stepsHtml}
        </ol>
      </div>

      <!-- Written Response Tasks -->
      <div style="margin-bottom:10px;">
        <p style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:4px;">Write your mathematical critique and complete solution:</p>
        <div style="font-size:11.5px;color:#475569;margin-bottom:6px;">
          1. Identify which step contains the error.<br>
          2. Explain the mathematical misconception in words using vocabulary from your word bank.<br>
          3. Show the correct multi-step calculation and state the correct answer.
        </div>
        <div style="border:1.5px dashed #cbd5e1;border-radius:6px;min-height:90px;padding:8px 10px;background:#fafbfc;">
          <span style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;">✏️ Student Constructed Response &amp; Justification</span>
        </div>
      </div>

      <!-- Rubric -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:6px 10px;font-size:10px;color:#475569;">
        <b>Official Scoring Rubric:</b> 
        <span style="color:#0f766e;font-weight:700;">[3 pts]</span> Names error step, explains conceptual flaw with precise vocabulary, and computes correct answer with work. 
        <span style="color:#1d4ed8;font-weight:700;">[2 pts]</span> Correct calculation with minor explanation gap. 
        <span style="color:#b45309;font-weight:700;">[1 pt]</span> Identifies error step only. 
        <span style="color:#64748b;">[0 pts]</span> Incorrect or blank.
      </div>
    </li>
  `;
}

/**
 * Renders an MSTAR Type III Modeling & Real-World Application Task.
 */
export function renderTypeIIIModelingItemHtml(pNum, item = {}) {
  const title = item.title || "Real-World Mathematical Modeling Challenge";
  const scenario = item.scenario || "Use mathematical modeling, tables, or equations to solve the multi-step real-world situation.";
  const parts = item.parts || [
    { letter: "A", prompt: "Define variables and write a mathematical model (equation, table, or diagram)." },
    { letter: "B", prompt: "Compute the intermediate values and show all operations." },
    { letter: "C", prompt: "Interpret your final result in the context of the problem and write a conclusion." }
  ];

  const partsHtml = parts
    .map(
      (p) => `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;margin-bottom:8px;">
        <div style="font-size:11px;font-weight:800;color:#0f766e;margin-bottom:4px;">PART ${p.letter}:</div>
        <p style="font-size:12px;font-weight:600;color:#0f172a;margin-bottom:6px;">${esc(p.prompt)}</p>
        ${p.svgHtml || ""}
        <div style="border:1.5px dashed #cbd5e1;border-radius:4px;min-height:55px;padding:6px 8px;background:#ffffff;">
          <span style="font-size:9.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;">✏️ Show work &amp; reasoning for Part ${p.letter}</span>
        </div>
      </div>`
    )
    .join("");

  return `
    <li class="ws-problem-card" style="background:#ffffff;border:1.5px solid #cbd5e1;border-left:5px solid #0f766e;border-radius:8px;padding:14px 16px;margin-bottom:14px;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="display:inline-flex;align-items:center;gap:6px;">
          <span style="width:22px;height:22px;border-radius:50%;background:#0f766e;color:#ffffff;font-weight:800;font-size:11px;display:inline-flex;align-items:center;justify-content:center;">${pNum}</span>
          <span style="font-size:11px;font-weight:800;color:#0f766e;letter-spacing:0.04em;">MSTAR TYPE III · MODELING &amp; REAL-WORLD APPLICATION</span>
        </span>
        <span style="font-size:10px;font-weight:800;background:#ccfbf1;color:#0f766e;padding:2px 8px;border-radius:4px;border:1px solid #99f6e4;">SMP.1 / SMP.4 Modeling</span>
      </div>

      <p style="font-size:12.5px;font-weight:700;color:#0f172a;margin-bottom:4px;">${esc(title)}</p>
      <p style="font-size:12px;color:#334155;margin-bottom:10px;">${esc(scenario)}</p>
      ${item.svgHtml || ""}

      ${partsHtml}
    </li>
  `;
}
