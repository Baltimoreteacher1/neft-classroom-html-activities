/**
 * MCAP Real-Time Misconception Diagnostic & Remediation Engine
 */
(function (window) {
  "use strict";

  const MISCONCEPTION_LIBRARY = {
    "coordinate-quadrant-swap": {
      title: "Swapping X and Y Coordinates",
      rule: "Remember: In an ordered pair (x, y), always move HORIZONTALLY along the x-axis FIRST, then VERTICALLY along the y-axis.",
      svgIcon:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      explanation:
        "You plotted or read (y, x) instead of (x, y). The first coordinate is horizontal (left/right) and the second is vertical (up/down).",
      remedialSteps: [
        "Start at origin (0,0).",
        "Find the first coordinate on the horizontal x-axis.",
        "Move up or down to the second coordinate on the vertical y-axis.",
      ],
    },
    "sign-reflection-error": {
      title: "Sign Change in Axis Reflections",
      rule: "Reflection across the x-axis keeps x the same and negates y: (x, -y). Reflection across the y-axis negates x and keeps y the same: (-x, y).",
      svgIcon:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M4 12h16M12 4v16"/></svg>',
      explanation:
        "When reflecting a point over an axis, the coordinate belonging to THAT axis stays unchanged, while the OPPOSITE coordinate flips its sign.",
      remedialSteps: [
        "Identify which axis is the mirror line (x-axis or y-axis).",
        "Keep the coordinate matching the mirror axis constant.",
        "Multiply the other coordinate by -1.",
      ],
    },
    "fraction-division-inversion": {
      title: "Inverting the Wrong Fraction in Division",
      rule: "To divide fractions: a/b ÷ c/d = a/b × d/c (Multiply by the reciprocal of the DIVISOR).",
      svgIcon:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 12h10M12 8v8"/></svg>',
      explanation:
        "In fraction division, only the second fraction (the divisor) is flipped into its reciprocal. Never flip the first fraction (dividend).",
      remedialSteps: [
        "Keep the first fraction exactly as it is (dividend).",
        "Change division (÷) to multiplication (×).",
        "Flip the numerator and denominator of the second fraction (divisor).",
        "Multiply straight across.",
      ],
    },
    "inequality-circle-type": {
      title: "Open vs. Closed Circle Boundary",
      rule: "Strict inequalities (< or >) use an OPEN circle (○). Non-strict inequalities (≤ or ≥) use a CLOSED circle (●).",
      svgIcon:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>',
      explanation:
        'A closed circle means the boundary number is part of the solution set ("or equal to"). An open circle means the boundary number itself is NOT included.',
      remedialSteps: [
        "Check the inequality symbol.",
        'If it includes the "or equal to" bar (≤, ≥), fill in the circle solid.',
        "If strictly less than or greater than (<, >), keep the circle open.",
      ],
    },
    "surface-area-missed-face": {
      title: "Missing Faces in Total Surface Area",
      rule: "A rectangular prism has 6 faces (3 matching pairs: Top/Bottom, Front/Back, Left/Right).",
      svgIcon:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
      explanation:
        "Surface area is the sum of ALL face areas, not just the front or visible faces, and is different from volume (length × width × height).",
      remedialSteps: [
        "Count all 6 faces of the net.",
        "Find area of Front/Back: 2 × (l × h).",
        "Find area of Top/Bottom: 2 × (l × w).",
        "Find area of Left/Right: 2 × (w × h).",
        "Add all three pair areas together.",
      ],
    },
    "box-plot-median-confusion": {
      title: "Median vs. Mean in Data Distributions",
      rule: "The median is the exact middle value of an ordered data set, represented by the vertical line inside the box.",
      svgIcon:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
      explanation:
        "The median divides the ordered data set into equal lower (50%) and upper (50%) halves. It is not calculated by adding and dividing like the mean.",
      remedialSteps: [
        "Order data from least to greatest.",
        "Find the middle number (or average of two middle numbers).",
        "Locate the line inside the box plot representing this median value.",
      ],
    },
  };

  const MCAPRemediator = {
    detectMisconception: function (item, selectedChoiceIndex) {
      if (item.misconceptionTags && item.misconceptionTags[selectedChoiceIndex]) {
        const tag = item.misconceptionTags[selectedChoiceIndex];
        return MISCONCEPTION_LIBRARY[tag] || null;
      }
      return null;
    },

    showMicroLessonModal: function (misconceptionData, onRetryCallback) {
      const data = misconceptionData;
      if (!data) return;

      const modalId = "mcap-remediation-modal";
      let existing = document.getElementById(modalId);
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = modalId;
      modal.style.cssText =
        "position:fixed; inset:0; background:rgba(15,23,42,0.7); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:99999; padding:20px;";

      modal.innerHTML = `
        <div style="background:#ffffff; border-radius:16px; max-width:540px; width:100%; box-shadow:0 20px 40px rgba(0,0,0,0.25); overflow:hidden; border:1px solid #e2e8f0; font-family:system-ui, sans-serif;">
          <div style="background:linear-gradient(135deg, #0d9488, #0f766e); padding:18px 24px; color:#ffffff; display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="background:rgba(255,255,255,0.2); padding:6px; border-radius:8px; display:inline-flex;">${data.svgIcon}</span>
              <div>
                <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.05em; opacity:0.9; font-weight:700;">Targeted Conceptual Check</div>
                <h3 style="margin:0; font-size:18px; font-weight:800;">${data.title}</h3>
              </div>
            </div>
            <button type="button" id="mcap-modal-close" style="background:none; border:none; color:#ffffff; font-size:24px; cursor:pointer; line-height:1;">&times;</button>
          </div>
          <div style="padding:24px; max-height:75vh; overflow-y:auto;">
            <div style="background:#f0fdfa; border-left:4px solid #0d9488; padding:12px 16px; border-radius:6px; margin-bottom:16px;">
              <strong style="color:#0f766e; font-size:14px;">Core Mathematical Rule:</strong>
              <p style="margin:4px 0 0; color:#134e4a; font-size:14px; line-height:1.5;">${data.rule}</p>
            </div>
            <div style="font-size:14px; color:#334155; line-height:1.6; margin-bottom:16px;">
              <strong>Why this happens:</strong> ${data.explanation}
            </div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 18px; margin-bottom:20px;">
              <div style="font-size:13px; font-weight:700; color:#1e293b; margin-bottom:8px;">Step-by-Step Recovery:</div>
              <ol style="margin:0 0 0 20px; padding:0; color:#475569; font-size:13.5px; line-height:1.6;">
                ${data.remedialSteps.map((step) => `<li style="margin-bottom:4px;">${step}</li>`).join("")}
              </ol>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:12px;">
              <button type="button" id="mcap-modal-dismiss" style="padding:10px 18px; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:8px; font-weight:600; color:#475569; cursor:pointer;">Close</button>
              <button type="button" id="mcap-modal-retry" style="padding:10px 20px; background:#0d9488; border:none; border-radius:8px; font-weight:700; color:#ffffff; cursor:pointer;">Try Parallel Question &rarr;</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const closeBtn = modal.querySelector("#mcap-modal-close");
      const dismissBtn = modal.querySelector("#mcap-modal-dismiss");
      const retryBtn = modal.querySelector("#mcap-modal-retry");

      const cleanup = () => modal.remove();
      if (closeBtn) closeBtn.onclick = cleanup;
      if (dismissBtn) dismissBtn.onclick = cleanup;
      if (retryBtn) {
        retryBtn.onclick = () => {
          cleanup();
          if (onRetryCallback) onRetryCallback();
        };
      }
    },
  };

  window.MCAPRemediator = MCAPRemediator;
})(window);
