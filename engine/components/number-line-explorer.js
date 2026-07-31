// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
// number-line-explorer.js — a hands-on horizontal number line for integers and
// rational numbers. The student drags a point (pointer or arrow keys) and the
// lab shows, live:
//   • absolute value as a highlighted segment from 0 to the point, with the
//     distance called out ( |-6| = 6, "6 units from zero" );
//   • the opposite of the number, marked as a hollow point at −n;
//   • in compare mode, a second point, which number is greater and why, and a
//     side-by-side of their absolute values.
//
// This is the interactive absolute-value / integer tool: distance-from-zero is
// something you SEE and move, not just a rule to memorize.
//
// Pure SVG + DOM, no dependencies. Public API:
//   renderNumberLineExplorer(container, cfg) -> { destroy }
//     cfg.mode  : "absolute" (default) | "compare"
//     cfg.max   : half-range, line runs −max…max (default 10)
//     cfg.step  : snap increment (default 1; use 0.5 / 0.25 for rationals)
//     cfg.start : starting value of point A (default -6)
//     cfg.startB: starting value of point B in compare mode (default 3)
//     cfg.intro : optional coaching sentence under the title

const C = {
  navy: "#12355b",
  accent: "#1d4ed8",
  teal: "#0d7a76",
  amber: "#b45309",
  ink: "#1a2b3c",
  muted: "#54677c",
  line: "#d7e2ed",
  chipBg: "#f4f8ff",
  aColor: "#1d4ed8",
  bColor: "#0d7a76",
  absFill: "rgba(124,58,237,.16)",
  absEdge: "#7c3aed",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

const fmt = (v) => {
  const r = Math.round(v * 1000) / 1000;
  return Number.isInteger(r) ? String(r) : String(r);
};

export function renderNumberLineExplorer(container, cfg = {}) {
  const mode = cfg.mode === "compare" ? "compare" : "absolute";
  const MAX = Number(cfg.max) > 0 ? Number(cfg.max) : 10;
  const STEP = Number(cfg.step) > 0 ? Number(cfg.step) : 1;
  const snap = (v) => Math.max(-MAX, Math.min(MAX, Math.round(v / STEP) * STEP));
  let a = snap(cfg.start != null ? cfg.start : -6);
  let b = snap(cfg.startB != null ? cfg.startB : 3);
  const dragCleanups = new Set();

  injectStyles();
  const root = document.createElement("div");
  root.className = "nlex";
  const intro =
    cfg.intro ||
    (mode === "compare"
      ? "Drag both points. The number farther to the right is greater — and watch how a number can be less than another yet be farther from zero."
      : "Drag the point along the line. Its absolute value is its distance from zero — see the segment light up, and find its opposite on the other side.");
  root.innerHTML =
    `<div class="nlex-head"><span class="nlex-title">📏 Number Line Explorer</span></div>` +
    `<p class="nlex-hint">${esc(intro)}</p>` +
    `<div class="nlex-plot" data-el="plot"></div>` +
    `<div class="nlex-tip">drag a point, or focus it and use ← →</div>` +
    `<div class="nlex-read" data-el="read" aria-live="polite"></div>`;
  container.appendChild(root);
  const el = (n) => root.querySelector(`[data-el="${n}"]`);

  const W = 640;
  const H = mode === "compare" ? 150 : 130;
  const L = 30;
  const R = 610;
  const AX = 78;
  const x = (v) => L + ((v + MAX) / (2 * MAX)) * (R - L);
  const fromX = (px) => ((px - L) / (R - L)) * (2 * MAX) - MAX;

  function marker(v, color, key, filled = true, label = "") {
    const px = x(v);
    return (
      `<g class="nlex-pt" data-pt="${key}" tabindex="0" role="slider" aria-label="${label || "point"}" ` +
      `aria-valuemin="${-MAX}" aria-valuemax="${MAX}" aria-valuenow="${v}" aria-valuetext="${label} at ${fmt(v)}">` +
      `<line x1="${px}" y1="${AX}" x2="${px}" y2="${AX - 30}" stroke="${color}" stroke-width="2"/>` +
      `<circle cx="${px}" cy="${AX - 38}" r="12" fill="${filled ? color : "#fff"}" stroke="${color}" stroke-width="3"/>` +
      `<text x="${px}" y="${AX - 34}" text-anchor="middle" font-size="11" font-weight="800" fill="${filled ? "#fff" : color}">${fmt(v)}</text>` +
      `</g>`
    );
  }

  function renderPlot() {
    // axis + ticks
    let axis = `<line x1="${L}" y1="${AX}" x2="${R}" y2="${AX}" stroke="${C.navy}" stroke-width="2"/>`;
    const tick = MAX > 12 ? 2 : 1;
    for (let t = -MAX; t <= MAX; t += tick) {
      const big = t === 0;
      axis +=
        `<line x1="${x(t)}" y1="${AX - (big ? 8 : 5)}" x2="${x(t)}" y2="${AX + (big ? 8 : 5)}" stroke="${big ? C.navy : C.muted}" stroke-width="${big ? 2 : 1}"/>` +
        `<text x="${x(t)}" y="${AX + 22}" text-anchor="middle" font-size="10" fill="${big ? C.navy : C.muted}" font-weight="${big ? 800 : 400}">${t}</text>`;
    }
    let overlays = "";
    if (mode === "absolute") {
      // |a| segment from 0 to a, opposite marker at -a.
      const x0 = x(0);
      const xa = x(a);
      overlays +=
        `<rect x="${Math.min(x0, xa)}" y="${AX - 6}" width="${Math.abs(xa - x0)}" height="12" fill="${C.absFill}" stroke="${C.absEdge}" stroke-width="1.5"/>` +
        (a !== 0
          ? `<text x="${(x0 + xa) / 2}" y="${AX + 40}" text-anchor="middle" font-size="11" font-weight="800" fill="${C.absEdge}">|${fmt(a)}| = ${fmt(Math.abs(a))}</text>`
          : "");
      overlays += marker(a, C.aColor, "a", true, "point");
      if (a !== 0) overlays += marker(-a, C.absEdge, "opp", false, "opposite (not draggable)");
    } else {
      overlays += marker(a, C.aColor, "a", true, "point A");
      overlays += marker(b, C.bColor, "b", true, "point B");
    }
    el("plot").innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Number line explorer">${axis}${overlays}</svg>`;
    wire();
  }

  function renderRead() {
    if (mode === "absolute") {
      const opp = -a;
      el("read").innerHTML =
        `<div class="nlex-card">` +
        `<div class="nlex-line"><b>${fmt(a)}</b> is <b>${fmt(Math.abs(a))}</b> unit${Math.abs(a) === 1 ? "" : "s"} from zero, so <b>|${fmt(a)}| = ${fmt(Math.abs(a))}</b>.</div>` +
        `<div class="nlex-line nlex-muted">Its opposite is <b>${fmt(opp)}</b> — the same distance from zero, on the other side. Opposites always have the <em>same</em> absolute value.</div>` +
        `</div>`;
    } else {
      const greater = a === b ? null : a > b ? a : b;
      const cmp = a === b ? "=" : a > b ? ">" : "<";
      const absNote =
        Math.abs(a) === Math.abs(b)
          ? `They are the same distance from zero: |${fmt(a)}| = |${fmt(b)}| = ${fmt(Math.abs(a))}.`
          : `But |${fmt(a)}| = ${fmt(Math.abs(a))} and |${fmt(b)}| = ${fmt(Math.abs(b))}, so <b>${fmt(Math.abs(a) > Math.abs(b) ? a : b)}</b> is farther from zero.`;
      el("read").innerHTML =
        `<div class="nlex-card">` +
        `<div class="nlex-line"><b>${fmt(a)} ${cmp} ${fmt(b)}</b>${greater !== null ? ` — <b>${fmt(greater)}</b> is greater because it sits farther to the right.` : " — the two points are equal."}</div>` +
        `<div class="nlex-line nlex-muted">${absNote}</div>` +
        `</div>`;
    }
  }

  function setVal(key, v) {
    const nv = snap(v);
    if (key === "a") {
      if (nv === a) return;
      a = nv;
    } else {
      if (nv === b) return;
      b = nv;
    }
    render();
    el("plot").querySelector(`[data-pt="${key}"]`)?.focus?.();
  }

  function render() {
    renderPlot();
    renderRead();
  }

  function wire() {
    const svg = el("plot").querySelector("svg");
    svg.querySelectorAll(".nlex-pt").forEach((g) => {
      const key = g.dataset.pt;
      if (key === "opp") return; // opposite marker is a read-out, not draggable
      g.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        const move = (ev) => {
          const live = el("plot").querySelector("svg");
          if (!live) return;
          const rect = live.getBoundingClientRect();
          const px = ((ev.clientX - rect.left) / rect.width) * W;
          const v = snap(fromX(px));
          if ((key === "a" && v !== a) || (key === "b" && v !== b)) {
            if (key === "a") a = v;
            else b = v;
            render();
          }
        };
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          dragCleanups.delete(up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        dragCleanups.add(up);
        move(e);
      });
      g.addEventListener("keydown", (e) => {
        const d =
          e.key === "ArrowRight" || e.key === "ArrowUp"
            ? STEP
            : e.key === "ArrowLeft" || e.key === "ArrowDown"
              ? -STEP
              : 0;
        if (!d) return;
        e.preventDefault();
        setVal(key, (key === "a" ? a : b) + d);
      });
    });
  }

  render();

  return {
    destroy() {
      for (const up of [...dragCleanups]) up();
      root.remove();
    },
  };
}

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || document.getElementById("nlex-styles")) {
    stylesInjected = true;
    return;
  }
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "nlex-styles";
  s.textContent = `
  .nlex{max-width:680px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .nlex-title{font-family:"Outfit",system-ui,sans-serif;font-weight:800;color:${C.navy};font-size:1.05rem;}
  .nlex-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.45;}
  .nlex-plot svg{width:100%;height:auto;display:block;}
  .nlex-pt{cursor:grab;}
  .nlex-pt:focus-visible{outline:none;}
  .nlex-pt:focus-visible circle{stroke-width:4;}
  .nlex-tip{font-size:.8rem;color:${C.muted};font-style:italic;text-align:right;margin-top:2px;}
  .nlex-read{margin-top:8px;}
  .nlex-card{padding:10px 14px;border-radius:12px;background:#f8fbff;border:1px solid ${C.line};}
  .nlex-line{font-size:.95rem;line-height:1.5;color:${C.ink};}
  .nlex-line b{color:${C.navy};}
  .nlex-line+.nlex-line{margin-top:5px;}
  .nlex-muted{color:${C.muted};font-size:.88rem;}
  @media (max-width:480px){.nlex-tip{text-align:left;}}
  `;
  document.head.appendChild(s);
}

export default renderNumberLineExplorer;
