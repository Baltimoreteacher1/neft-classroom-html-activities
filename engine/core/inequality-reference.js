// inequality-reference.js — a pop-up "Inequality Key" students can open from
// wherever they are typing an inequality.
//
// Why a pop-up and not a card on the page: the four symbols, the phrases that
// map to them, and the open/closed-circle rule are needed at the moment of
// writing an answer — three phases after the lesson taught them. Printed on the
// page it is one more block to scroll past; as a dialog it is one tap away and
// costs the lesson no vertical space. It is read-only and never touches phase
// state, so opening it mid-problem changes nothing.

const DIALOG_ID = "nt-inequality-key";

const ROWS = [
  {
    sym: ">",
    name: "greater than",
    words: ["more than", "over", "above", "exceeds"],
    circle: "open",
    example: "More than 12 people: x > 12",
  },
  {
    sym: "≥",
    name: "greater than or equal to",
    words: ["at least", "no fewer than", "minimum", "or more"],
    circle: "closed",
    example: "At least 48 inches tall: x ≥ 48",
  },
  {
    sym: "<",
    name: "less than",
    words: ["fewer than", "under", "below"],
    circle: "open",
    example: "Under 40 degrees: x < 40",
  },
  {
    sym: "≤",
    name: "less than or equal to",
    words: ["at most", "no more than", "maximum", "or less"],
    circle: "closed",
    example: "At most 12 minutes: x ≤ 12",
  },
];

// A 2-inch number line showing the boundary circle for one symbol. The circle is
// the whole point of the row, so it is drawn, not described: hollow means the
// boundary is NOT a solution, filled means it IS.
function miniLine(circle, direction) {
  const filled = circle === "closed";
  const cx = direction === "right" ? 42 : 78;
  const rayX = direction === "right" ? `M${cx} 20 H112` : `M${cx} 20 H8`;
  const head = direction === "right" ? "112,20 104,15 104,25" : "8,20 16,15 16,25";
  return `<svg viewBox="0 0 120 40" width="120" height="40" role="img"
      aria-label="Number line with ${filled ? "a closed" : "an open"} circle at the boundary, shaded ${direction}">
      <line x1="8" y1="20" x2="112" y2="20" stroke="#94a3b8" stroke-width="2"/>
      <path d="${rayX}" stroke="#0f766e" stroke-width="5" stroke-linecap="round"/>
      <polygon points="${head}" fill="#0f766e"/>
      <circle cx="${cx}" cy="20" r="7" fill="${filled ? "#0f766e" : "#fff"}" stroke="#0f766e" stroke-width="3"/>
    </svg>`;
}

function buildDialog() {
  const dialog = document.createElement("div");
  dialog.id = DIALOG_ID;
  dialog.className = "nt-ineq-key";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", "Inequality key");
  dialog.style.cssText =
    "position:fixed; inset:0; z-index:9600; display:flex; align-items:center; justify-content:center; " +
    "background:rgba(10,20,35,0.45); padding:16px;";

  const rows = ROWS.map(
    (r) => `
      <tr>
        <td style="font-size:2rem; font-weight:900; color:#0f766e; text-align:center; padding:10px 12px;">${r.sym}</td>
        <td style="padding:10px 12px;">
          <div style="font-weight:800; color:#14223a;">${r.name}</div>
          <div style="color:#475569; font-size:0.95rem;">${r.words.join(" · ")}</div>
          <div style="color:#14223a; font-size:0.95rem; margin-top:4px;"><em>${r.example}</em></div>
        </td>
        <td style="padding:10px 12px; text-align:center;">
          ${miniLine(r.circle, r.sym === ">" || r.sym === "≥" ? "right" : "left")}
          <div style="font-size:0.85rem; font-weight:800; color:${r.circle === "closed" ? "#0f766e" : "#b45309"};">
            ${r.circle === "closed" ? "closed — the number counts" : "open — the number does not count"}
          </div>
        </td>
      </tr>`,
  ).join("");

  dialog.innerHTML = `
    <div class="nt-ineq-card" style="background:#fff; border-radius:16px; max-width:760px; width:100%;
        max-height:88vh; overflow:auto; box-shadow:0 24px 60px rgba(9,20,40,0.35);">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;
          padding:16px 20px; border-bottom:1px solid #e2e8f0; position:sticky; top:0; background:#fff;">
        <h2 style="margin:0; font-size:1.25rem; color:#14223a;">📐 Inequality Key</h2>
        <button type="button" data-act="close" class="btn btn-secondary"
          style="min-height:44px; cursor:pointer;">✕ Close</button>
      </div>
      <table style="width:100%; border-collapse:collapse;">
        <caption class="sr-only">Inequality symbols, the words that signal them, and the boundary circle each one uses</caption>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin:0; padding:14px 20px 20px; color:#475569; font-size:0.95rem;">
        The word tells you the symbol. <strong>“At least” and “at most” include the number</strong>, so they use
        ≥ / ≤ and a <strong>closed</strong> circle. “More than” and “fewer than” leave the number out, so they use
        &gt; / &lt; and an <strong>open</strong> circle.
      </p>
    </div>`;
  return dialog;
}

/** Open the reference. Safe to call repeatedly — one dialog at a time. */
export function openInequalityReference() {
  if (typeof document === "undefined") return null;
  const existing = document.getElementById(DIALOG_ID);
  if (existing) return existing;

  const dialog = buildDialog();
  const close = () => {
    dialog.remove();
    document.removeEventListener("keydown", onKey);
    opener?.focus?.();
  };
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  const opener = /** @type {HTMLElement|null} */ (document.activeElement);
  dialog.addEventListener("click", (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (target === dialog || target.closest?.('[data-act="close"]')) close();
  });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(dialog);
  /** @type {HTMLElement|null} */ (dialog.querySelector('[data-act="close"]'))?.focus();
  return dialog;
}

/**
 * Add a "Key" button to a symbol pad (or any host element). This is the point of
 * use: the student is already looking at the ≤ / ≥ buttons when they wonder
 * which one the sentence means.
 */
export function mountInequalityKeyButton(host) {
  if (!host) return null;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nt-ineq-key-btn";
  btn.textContent = "ⓘ Key";
  btn.title = "Open the inequality key — symbols, words and circles";
  btn.style.cssText =
    "min-height:44px; padding:0 12px; font-weight:800; color:#0f766e; background:#f0fdfa; " +
    "border:2px solid #99f6e4; border-radius:10px; cursor:pointer;";
  btn.addEventListener("click", openInequalityReference);
  host.append(btn);
  return btn;
}
