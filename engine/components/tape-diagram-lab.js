// tape-diagram-lab.js — Interactive tape diagram. Takes the SAME config the static
// `tape-diagram` figure uses ({ title, caption, rows:[{label, parts:[{value,label}]}] })
// and makes it a counting model: the student taps each equal part to count how many
// there are in all, a live tally updates, and when every part is counted the diagram
// confirms the total and reveals the relationship (the caption). Turns "look at a
// picture" into "count with the model" — no config changes needed.
//
// Pure DOM + CSS, no dependencies. Matches the static tapeDiagramSVG palette.

const PALETTE = [
  "var(--teal,#2a9d8f)",
  "var(--coral,#d9795d)",
  "var(--amber,#e9c46a)",
  "var(--navy,#264653)",
];

function esc(s) {
  return String(s == null ? "" : s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

function ensureStyles() {
  if (document.getElementById("tdl-styles")) return;
  const s = document.createElement("style");
  s.id = "tdl-styles";
  s.textContent = `
  .tdl-wrap{margin:var(--sp-3,12px) 0;display:flex;flex-direction:column;align-items:center;}
  .tdl-title{font-weight:800;color:var(--navy,#264653);margin-bottom:4px;font-size:.98rem;text-align:center;}
  .tdl-hint{font-size:.82rem;color:var(--muted,#54677c);margin-bottom:10px;text-align:center;max-width:440px;line-height:1.4;}
  .tdl-stage{width:100%;max-width:540px;background:#fff;border:1px solid var(--line,#cbd5e1);border-radius:12px;padding:12px;}
  .tdl-row{display:flex;align-items:stretch;gap:8px;margin:6px 0;}
  .tdl-rowlab{flex:0 0 84px;display:flex;align-items:center;font-size:.78rem;font-weight:700;color:var(--navy,#264653);}
  .tdl-track{flex:1;display:flex;gap:3px;min-width:0;}
  .tdl-part{position:relative;min-width:0;height:40px;border:2px solid transparent;border-radius:5px;color:#fff;
    font-weight:700;font-size:.78rem;display:flex;align-items:center;justify-content:center;cursor:pointer;
    padding:0 2px;box-sizing:border-box;transition:transform .08s ease,filter .1s ease;overflow:hidden;}
  .tdl-part:hover{filter:brightness(1.06);}
  .tdl-part:active{transform:scale(.96);}
  .tdl-part.counted{outline:2px solid #0d7a76;outline-offset:1px;box-shadow:0 0 0 2px #fff inset;}
  .tdl-part.counted::after{content:"✓";position:absolute;top:1px;right:3px;font-size:.7rem;color:#fff;
    text-shadow:0 0 2px rgba(0,0,0,.5);}
  .tdl-part:focus-visible{outline:3px solid var(--accent,#1d4ed8);outline-offset:2px;}
  .tdl-count{margin-top:12px;font-size:1rem;font-weight:800;color:var(--navy,#264653);text-align:center;}
  .tdl-count .tdl-n{color:var(--teal,#0d7a76);}
  .tdl-status{min-height:1.2em;margin-top:6px;font-size:.9rem;font-weight:700;text-align:center;color:var(--teal,#0d7a76);}
  .tdl-reveal{margin-top:10px;width:100%;max-width:540px;box-sizing:border-box;padding:10px 14px;
    border:1px solid var(--line,#cbd5e1);border-left:4px solid var(--teal,#2a9d8f);border-radius:12px;
    background:#f4faf8;font-size:.9rem;color:var(--navy,#264653);line-height:1.4;}
  .tdl-controls{display:flex;gap:8px;justify-content:center;margin-top:10px;}
  .tdl-btn{font:inherit;font-weight:700;font-size:.82rem;border-radius:999px;padding:6px 14px;cursor:pointer;
    border:2px solid var(--line,#cbd5e1);background:#fff;color:var(--navy,#264653);}
  .tdl-btn:hover{border-color:var(--accent,#1d4ed8);}
  `;
  document.head.appendChild(s);
}

export function renderTapeDiagram(host, cfg) {
  ensureStyles();
  const rows = Array.isArray(cfg.rows) ? cfg.rows.filter((r) => Array.isArray(r.parts)) : [];
  if (!rows.length) return null;

  const total = rows.reduce((s, r) => s + r.parts.length, 0);
  // Scale part widths to the longest row, so a part's size reflects its value.
  const rowTotals = rows.map((r) => r.parts.reduce((s, p) => s + (Number(p.value) || 1), 0));
  const maxTotal = Math.max(...rowTotals, 1);

  const wrap = document.createElement("div");
  wrap.className = "tdl-wrap";
  wrap.innerHTML = `
    ${cfg.title ? `<div class="tdl-title">${esc(cfg.title)}</div>` : ""}
    <div class="tdl-hint">Tap each part to count how many equal parts there are in all.</div>
    <div class="tdl-stage"></div>
    <div class="tdl-count">Counted: <span class="tdl-n">0</span> of ${total}</div>
    <div class="tdl-status" role="status" aria-live="polite"></div>
    <div class="tdl-reveal" hidden></div>
    <div class="tdl-controls"><button type="button" class="tdl-btn tdl-reset">Start over</button></div>
  `;
  const stage = wrap.querySelector(".tdl-stage");
  const countN = wrap.querySelector(".tdl-n");
  const status = wrap.querySelector(".tdl-status");
  const reveal = wrap.querySelector(".tdl-reveal");

  const counted = new Set();
  let colorIx = 0;

  function refresh() {
    countN.textContent = String(counted.size);
    if (counted.size >= total) {
      status.textContent = `🎉 ${total} equal parts in all!`;
      if (cfg.caption) {
        reveal.hidden = false;
        reveal.innerHTML = esc(cfg.caption);
      }
    } else {
      status.textContent = "";
      reveal.hidden = true;
    }
  }

  function build() {
    stage.innerHTML = "";
    counted.clear();
    colorIx = 0;
    rows.forEach((r) => {
      const rowEl = document.createElement("div");
      rowEl.className = "tdl-row";
      const lab = document.createElement("div");
      lab.className = "tdl-rowlab";
      lab.textContent = r.label || "";
      const track = document.createElement("div");
      track.className = "tdl-track";
      r.parts.forEach((p) => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "tdl-part";
        const grow = (Number(p.value) || 1) / maxTotal;
        cell.style.flex = `${grow} 1 0`;
        cell.style.background = p.fill || PALETTE[colorIx % PALETTE.length];
        colorIx += 1;
        cell.textContent = p.label != null ? p.label : p.value;
        cell.setAttribute(
          "aria-label",
          `Part ${counted.size + 1}: ${p.label ?? p.value}. Tap to count.`,
        );
        const key = `${cell.style.background}-${colorIx}-${Math.random()}`;
        cell.addEventListener("click", () => {
          if (cell.classList.contains("counted")) {
            cell.classList.remove("counted");
            counted.delete(key);
          } else {
            cell.classList.add("counted");
            counted.add(key);
          }
          refresh();
        });
        cell.dataset.key = key;
        track.appendChild(cell);
      });
      rowEl.append(lab, track);
      stage.appendChild(rowEl);
    });
    refresh();
  }

  build();
  const resetBtn = wrap.querySelector(".tdl-reset");
  resetBtn.addEventListener("click", build);

  host.appendChild(wrap);
  return {
    destroy() {
      resetBtn.removeEventListener("click", build);
      wrap.remove();
    },
  };
}

export default renderTapeDiagram;
