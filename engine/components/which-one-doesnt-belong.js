// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
// Which One Doesn't Belong — a four-quadrant argument, not a question.
//
// The design constraint that makes this worth building: EVERY quadrant has a
// defensible answer. That is not a nicety, it is the entire pedagogy. A student
// who has been trained that math questions have one right answer cannot practise
// justification, because the moment they identify the answer the thinking stops.
// Here there is nothing to identify, so the only thing left to do is argue.
//
// Three consequences run through the code below:
//
//   1. Nothing is ever marked wrong. There is no correct index, no score, no
//      red state. `onAnswer` is always called with `true` — this is a
//      participation surface and must never move a student's accuracy.
//   2. The other three reasons are revealed only AFTER the student commits to
//      their own. Revealing early turns the set back into a reading task.
//   3. The student's own reason is typed before the reveal and kept afterwards,
//      side by side with the published one, so "I had a different reason" reads
//      as success rather than as a miss.

const QUADRANT_LABELS = ["A", "B", "C", "D"];

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

const WODB_STYLE_ID = "wodb-styles";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(WODB_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = WODB_STYLE_ID;
  style.textContent = `
    .wodb { margin: var(--sp-4, 1rem) 0; }
    .wodb-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 3px;
      background: var(--line, #cbd5e1);
      border: 3px solid var(--line, #cbd5e1);
      border-radius: 12px;
      overflow: hidden;
      max-width: 34rem;
    }
    .wodb-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--sp-2, 0.5rem);
      min-height: 7.5rem;
      padding: var(--sp-4, 1rem);
      background: var(--surface, #fff);
      border: 0;
      font: inherit;
      color: inherit;
      cursor: pointer;
      text-align: center;
      transition: background 0.15s ease;
    }
    .wodb-cell:hover { background: var(--surface-alt, #f1f5f9); }
    .wodb-cell:focus-visible { outline: 3px solid var(--teal, #0f766e); outline-offset: -3px; }
    .wodb-cell[aria-pressed="true"] {
      background: var(--teal-pale, #ccfbf1);
      box-shadow: inset 0 0 0 3px var(--teal, #0f766e);
    }
    .wodb-badge {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: var(--muted, #64748b);
    }
    .wodb-value { font-size: 1.35rem; font-weight: 700; line-height: 1.25; }
    .wodb-because { margin-top: var(--sp-4, 1rem); max-width: 34rem; }
    .wodb-because label { display: block; font-weight: 700; margin-bottom: var(--sp-2, 0.5rem); }
    .wodb-because textarea {
      width: 100%;
      min-height: 4.5rem;
      font: inherit;
      padding: var(--sp-3, 0.75rem);
      border: 2px solid var(--line, #cbd5e1);
      border-radius: 10px;
      resize: vertical;
    }
    .wodb-frames { display: flex; flex-wrap: wrap; gap: var(--sp-2, 0.5rem); margin-bottom: var(--sp-2, 0.5rem); }
    .wodb-frame {
      font: inherit;
      font-size: 0.85rem;
      padding: 3px 10px;
      border-radius: 999px;
      border: 1px dashed var(--teal, #0f766e);
      background: transparent;
      color: var(--teal-ink, #115e59);
      cursor: pointer;
    }
    .wodb-reveal { margin-top: var(--sp-4, 1rem); max-width: 34rem; }
    .wodb-reveal-list { list-style: none; margin: var(--sp-3, 0.75rem) 0 0; padding: 0; display: grid; gap: var(--sp-2, 0.5rem); }
    .wodb-reveal-list li {
      display: grid;
      grid-template-columns: 1.6rem 1fr;
      gap: var(--sp-2, 0.5rem);
      padding: var(--sp-2, 0.5rem) var(--sp-3, 0.75rem);
      border-radius: 8px;
      background: var(--surface-alt, #f1f5f9);
      line-height: 1.4;
    }
    .wodb-reveal-list li.is-mine { background: var(--teal-pale, #ccfbf1); font-weight: 600; }
    .wodb-reveal-list .wodb-badge { align-self: start; }
    .wodb-mine { margin-top: var(--sp-3, 0.75rem); padding: var(--sp-3, 0.75rem); border-left: 4px solid var(--teal, #0f766e); }
    .wodb-mine strong { display: block; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted, #64748b); }
    @media (max-width: 30rem) {
      .wodb-value { font-size: 1.1rem; }
      .wodb-cell { min-height: 6rem; padding: var(--sp-3, 0.75rem); }
    }
  `;
  document.head.append(style);
}

// Sentence frames, so a multilingual learner argues about mathematics rather
// than about English. They fill the textarea rather than replacing it — the
// student still writes the reason.
const REASON_FRAMES = [
  "___ doesn't belong because it is the only one that ___.",
  "The other three all ___, but ___ does not.",
  "I noticed that ___.",
];

/**
 * @param {HTMLElement} container
 * @param {object}   def
 * @param {string}   def.prompt      question line above the grid
 * @param {string[]} def.items       exactly four quadrant values
 * @param {string[]} def.reasons     one published reason per quadrant
 * @param {(v: object) => void} [def.onPick]     fired when a quadrant is chosen
 * @param {(ok: boolean) => void} [def.onComplete] fired once, always with true
 * @param {{ get?: Function, set?: Function }} [def.store] optional {get,set} for resume
 */
export function renderWhichOneDoesntBelong(container, def = {}) {
  injectStyles();
  const items = Array.isArray(def.items) ? def.items.slice(0, 4) : [];
  const reasons = Array.isArray(def.reasons) ? def.reasons : [];
  if (items.length !== 4) {
    // Malformed authoring must not blank the phase it sits in.
    const note = document.createElement("p");
    note.className = "problem-stem";
    note.textContent = def.prompt || "This activity is unavailable.";
    container.append(note);
    return null;
  }

  const root = document.createElement("section");
  root.className = "wodb";
  root.setAttribute("aria-labelledby", "wodb-prompt");

  const heading = document.createElement("p");
  heading.className = "problem-stem";
  heading.id = "wodb-prompt";
  heading.innerHTML = `<strong>${esc(def.prompt || "Which one doesn't belong?")}</strong> Every answer can be right — you just have to say why.`;
  root.append(heading);

  const grid = document.createElement("div");
  grid.className = "wodb-grid";
  grid.setAttribute("role", "group");
  grid.setAttribute("aria-label", "Four choices");

  let picked = null;

  const cells = items.map((value, i) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "wodb-cell";
    cell.setAttribute("aria-pressed", "false");
    cell.innerHTML = `<span class="wodb-badge">${QUADRANT_LABELS[i]}</span><span class="wodb-value">${esc(value)}</span>`;
    cell.addEventListener("click", () => choose(i));
    grid.append(cell);
    return cell;
  });

  root.append(grid);

  // --- the student's own reason, written BEFORE the published ones appear ----
  const because = document.createElement("div");
  because.className = "wodb-because";
  because.hidden = true;
  const textareaId = `wodb-why-${Math.random().toString(36).slice(2, 8)}`;
  because.innerHTML = `
    <label for="${textareaId}">Why doesn't it belong?</label>
    <div class="wodb-frames">
      ${REASON_FRAMES.map((f) => `<button type="button" class="wodb-frame">${esc(f)}</button>`).join("")}
    </div>
    <textarea id="${textareaId}" rows="3" placeholder="Because it is the only one that…"></textarea>
  `;
  const textarea = because.querySelector("textarea");
  because.querySelectorAll(".wodb-frame").forEach((btn) => {
    btn.addEventListener("click", () => {
      textarea.value = btn.textContent;
      textarea.focus();
      // Drop the caret on the first blank so the frame is a starting point.
      const blank = textarea.value.indexOf("___");
      if (blank >= 0) textarea.setSelectionRange(blank, blank + 3);
      persist();
    });
  });
  textarea.addEventListener("input", persist);

  const revealBtn = document.createElement("button");
  revealBtn.type = "button";
  revealBtn.className = "btn btn-primary mt-4";
  revealBtn.textContent = "Show what other people said";
  revealBtn.addEventListener("click", reveal);
  because.append(revealBtn);
  root.append(because);

  const revealHost = document.createElement("div");
  revealHost.className = "wodb-reveal";
  revealHost.hidden = true;
  root.append(revealHost);

  function persist() {
    def.store?.set?.({ picked, why: textarea.value });
  }

  function choose(i) {
    picked = i;
    cells.forEach((c, j) => c.setAttribute("aria-pressed", j === i ? "true" : "false"));
    because.hidden = false;
    if (!revealHost.hidden) reveal();
    def.onPick?.({ index: i, value: items[i] });
    persist();
    textarea.focus();
  }

  function reveal() {
    if (picked == null) return;
    revealHost.hidden = false;
    const mine = (textarea.value || "").trim();
    revealHost.innerHTML = `
      <h4 style="margin:0">Reasons people give</h4>
      <p style="margin:var(--sp-2,0.5rem) 0 0; color:var(--muted,#64748b)">
        All four of these are correct. Yours counts too, even if it is not on this list.
      </p>
      <ul class="wodb-reveal-list">
        ${items
          .map(
            (value, i) => `
          <li class="${i === picked ? "is-mine" : ""}">
            <span class="wodb-badge">${QUADRANT_LABELS[i]}</span>
            <span><strong>${esc(value)}</strong> — ${esc(reasons[i] || "students find their own reason for this one.")}</span>
          </li>`,
          )
          .join("")}
      </ul>
      ${
        mine
          ? `<div class="wodb-mine"><strong>Your reason</strong>${esc(mine)}</div>`
          : `<div class="wodb-mine"><strong>Your reason</strong>Say yours out loud to a partner before you move on.</div>`
      }
    `;
    revealBtn.textContent = "Reasons shown";
    revealBtn.disabled = true;
    // Always true: there is no wrong quadrant, so this can only ever report
    // participation. Reporting anything else would let an ungradeable activity
    // move a student's accuracy.
    def.onComplete?.(true);
  }

  // Resume a previous visit.
  const saved = def.store?.get?.();
  if (saved && Number.isInteger(saved.picked)) {
    choose(saved.picked);
    if (saved.why) textarea.value = saved.why;
  }

  container.append(root);
  return { getPicked: () => picked, getReason: () => textarea.value };
}

export default renderWhichOneDoesntBelong;
