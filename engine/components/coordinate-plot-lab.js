const C = {
  ink: "#333",
  navy: "#264653",
  muted: "#54677c",
  line: "#c3d3e2",
  accent: "#1d4ed8",
  ok: "#0d7a76",
  okFill: "#e2f9f5",
  wrong: "#d9534f",
  pop: "var(--sg-pop,#d9795d)",
};

function esc(s) {
  return String(s == null ? "" : s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

function ensureStyles() {
  if (document.getElementById("cpl-styles")) return;
  const s = document.createElement("style");
  s.id = "cpl-styles";
  s.textContent = `
  .cpl-wrap{margin:var(--sp-3,12px) 0;display:flex;flex-direction:column;align-items:center;}
  .cpl-title{font-weight:700;color:${C.navy};margin-bottom:4px;font-size:.98rem;text-align:center;}
  .cpl-hint{font-size:.82rem;color:${C.muted};margin-bottom:8px;text-align:center;max-width:420px;line-height:1.4;}
  .cpl-stage{width:100%;max-width:560px;background:#fff;border:1px solid ${C.line};border-radius:12px;padding:8px;}
  .cpl-stage svg{width:100%;height:auto;display:block;cursor:crosshair;touch-action:manipulation;}
  .cpl-todo{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:10px;max-width:560px;}
  .cpl-chip{font-size:.8rem;font-weight:600;color:${C.navy};background:#eef4fb;border:2px solid ${C.line};
    border-radius:999px;padding:4px 10px;}
  .cpl-chip.done{color:${C.ok};background:${C.okFill};border-color:${C.ok};}
  .cpl-chip.done::before{content:"✓ ";}
  .cpl-status{min-height:1.2em;margin-top:8px;font-size:.9rem;font-weight:600;text-align:center;}
  .cpl-status.ok{color:${C.ok};}
  .cpl-status.no{color:${C.wrong};}
  .cpl-reveal{margin-top:8px;width:100%;max-width:560px;box-sizing:border-box;padding:10px 14px;
    border:1px solid ${C.line};border-left:4px solid ${C.accent};border-radius:12px;background:#f7faff;
    font-size:.88rem;color:${C.navy};line-height:1.4;}
  `;
  document.head.appendChild(s);
}

export function renderCoordinatePlot(host, cfg) {
  ensureStyles();
  const points = (cfg.points || [])
    .map((p) => ({ x: Number(p.x), y: Number(p.y), label: p.label }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (!points.length) return null;

  const m = Number(cfg.max ?? 6) || 6;
  const allNonNeg = points.every((p) => p.x >= 0 && p.y >= 0);
  const lo = allNonNeg ? 0 : -m;
  const hi = m;
  const span = hi - lo || 1;

  const W = 480;
  const pad = 34;
  const plot = W - 2 * pad;
  const unit = plot / span;
  const X = (x) => pad + (x - lo) * unit;
  const Y = (y) => pad + (hi - y) * unit;
  const stride = span > 12 ? 2 : 1;
  const tick = 'style="font-size:13px;fill:#4a5668;font-weight:500"';

  let grid = "";
  for (let i = lo; i <= hi; i++) {
    grid += `<line x1="${X(i).toFixed(1)}" y1="${pad}" x2="${X(i).toFixed(1)}" y2="${(W - pad).toFixed(1)}" stroke="rgba(0,0,0,0.06)"/>`;
    grid += `<line x1="${pad}" y1="${Y(i).toFixed(1)}" x2="${(W - pad).toFixed(1)}" y2="${Y(i).toFixed(1)}" stroke="rgba(0,0,0,0.06)"/>`;
    if (i !== 0 && i % stride === 0) {
      grid += `<text x="${X(i).toFixed(1)}" y="${(Y(0) + 13).toFixed(1)}" text-anchor="middle" ${tick}>${i}</text>`;
      grid += `<text x="${(X(0) - 6).toFixed(1)}" y="${(Y(i) + 4).toFixed(1)}" text-anchor="end" ${tick}>${i}</text>`;
    }
  }
  grid += `<text x="${(X(0) - 6).toFixed(1)}" y="${(Y(0) + 13).toFixed(1)}" text-anchor="end" ${tick}>0</text>`;
  const axes =
    `<line x1="${pad}" y1="${Y(0).toFixed(1)}" x2="${(W - pad).toFixed(1)}" y2="${Y(0).toFixed(1)}" stroke="${C.ink}" stroke-width="2"/>` +
    `<line x1="${X(0).toFixed(1)}" y1="${pad}" x2="${X(0).toFixed(1)}" y2="${(W - pad).toFixed(1)}" stroke="${C.ink}" stroke-width="2"/>` +
    `<text x="${(W - pad + 4).toFixed(1)}" y="${(Y(0) + 4).toFixed(1)}" ${tick}>x</text>` +
    `<text x="${(X(0) + 5).toFixed(1)}" y="${pad.toFixed(1)}" ${tick}>y</text>`;

  const wrap = document.createElement("div");
  wrap.className = "cpl-wrap";
  wrap.innerHTML = `
    ${cfg.title ? `<div class="cpl-title">${esc(cfg.title)}</div>` : ""}
    <div class="cpl-hint">Tap the grid to plot each point in the list. Go right for x, then up for y.</div>
    <div class="cpl-stage">
      <svg viewBox="0 0 ${W} ${W}" role="img" aria-label="Coordinate plane. Tap to plot each listed point.">
        ${grid}${axes}<g class="cpl-plotted"></g>
      </svg>
    </div>
    <div class="cpl-todo"></div>
    <div class="cpl-status" role="status" aria-live="polite"></div>
    <div class="cpl-reveal" hidden></div>
  `;

  const svg = wrap.querySelector("svg");
  const plotted = wrap.querySelector(".cpl-plotted");
  const todo = wrap.querySelector(".cpl-todo");
  const status = wrap.querySelector(".cpl-status");
  const reveal = wrap.querySelector(".cpl-reveal");

  const done = new Set();
  points.forEach((p, i) => {
    const chip = document.createElement("span");
    chip.className = "cpl-chip";
    chip.dataset.i = String(i);
    chip.textContent = p.label || `(${p.x}, ${p.y})`;
    todo.appendChild(chip);
  });

  function place(p) {
    // White under-ring keeps the dot readable on gridline crossings; the
    // coordinate label makes each plotted point self-explanatory.
    const cx = X(p.x).toFixed(1);
    const cy = Y(p.y).toFixed(1);
    const flip = X(p.x) > W - pad - 60;
    plotted.insertAdjacentHTML(
      "beforeend",
      `<circle cx="${cx}" cy="${cy}" r="11" fill="#fff" fill-opacity="0.85"/>` +
        `<circle cx="${cx}" cy="${cy}" r="8" fill="${C.pop}" stroke="${C.ok}" stroke-width="2.5"/>` +
        `<text x="${(X(p.x) + (flip ? -12 : 12)).toFixed(1)}" y="${(Y(p.y) - 10).toFixed(1)}" text-anchor="${flip ? "end" : "start"}" style="font-size:13px;fill:${C.navy};font-weight:600">(${p.x}, ${p.y})</text>`,
    );
  }

  let ghost = null;
  function showGhost(gx, gy) {
    // A brief gray dot where the tap landed, so a miss is visible instead of
    // feeling like the grid ignored the tap.
    if (ghost) ghost.remove();
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    el.setAttribute("cx", X(gx).toFixed(1));
    el.setAttribute("cy", Y(gy).toFixed(1));
    el.setAttribute("r", "7");
    el.setAttribute("fill", "rgba(84,103,124,0.45)");
    plotted.appendChild(el);
    ghost = el;
    setTimeout(() => {
      if (ghost === el) {
        el.remove();
        ghost = null;
      }
    }, 900);
  }

  svg.addEventListener("click", (e) => {
    const rect = svg.getBoundingClientRect();
    const vbX = ((e.clientX - rect.left) / rect.width) * W;
    const vbY = ((e.clientY - rect.top) / rect.height) * W;
    const gx = Math.round((vbX - pad) / unit + lo);
    const gy = Math.round(hi - (vbY - pad) / unit);
    const idx = points.findIndex((p, i) => !done.has(i) && p.x === gx && p.y === gy);
    if (gx < lo || gx > hi || gy < lo || gy > hi) return;
    if (idx === -1) {
      showGhost(gx, gy);
      status.textContent = `You tapped (${gx}, ${gy}) — that isn't one of the points in the list. Go right for x, then up for y.`;
      status.className = "cpl-status no";
      return;
    }
    done.add(idx);
    place(points[idx]);
    todo.querySelector(`.cpl-chip[data-i="${idx}"]`)?.classList.add("done");
    if (done.size >= points.length) {
      status.textContent = "🎉 All points plotted!";
      status.className = "cpl-status ok";
      if (cfg.caption) {
        /** @type {HTMLElement} */ (reveal).hidden = false;
        reveal.innerHTML = esc(cfg.caption);
      }
    } else {
      status.textContent = `Plotted (${gx}, ${gy}). ${points.length - done.size} to go.`;
      status.className = "cpl-status ok";
    }
  });

  host.appendChild(wrap);
  return {
    destroy() {
      wrap.remove();
    },
  };
}

export default renderCoordinatePlot;
