// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
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

import { labT } from "./lab-strings-es.js";

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
      ? labT(
          "number-line-explorer.intro-compare",
          "Drag both points. The number farther to the right is greater — and watch how a number can be less than another yet be farther from zero.",
        )
      : labT(
          "number-line-explorer.intro-absolute",
          "Drag the point along the line. Its absolute value is its distance from zero — see the segment light up, and find its opposite on the other side.",
        ));
  root.innerHTML =
    `<div class="nlex-head"><span class="nlex-title">📏 ${labT("number-line-explorer.title", "Number Line Explorer")}</span></div>` +
    `<p class="nlex-hint">${esc(intro)}</p>` +
    `<div class="nlex-plot" data-el="plot"></div>` +
    `<div class="nlex-tip">${labT("number-line-explorer.tip", "drag a point, or focus it and use ← →")}</div>` +
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

  function marker(v, color, key, filled = true, label = "", valueText = "") {
    const px = x(v);
    return (
      `<g class="nlex-pt" data-pt="${key}" tabindex="0" role="slider" aria-label="${label}" ` +
      `aria-valuemin="${-MAX}" aria-valuemax="${MAX}" aria-valuenow="${v}" aria-valuetext="${valueText}">` +
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
      overlays += marker(
        a,
        C.aColor,
        "a",
        true,
        labT("number-line-explorer.point", "point"),
        labT("number-line-explorer.point-at", "point at {v}", { v: fmt(a) }),
      );
      if (a !== 0) {
        overlays += marker(
          -a,
          C.absEdge,
          "opp",
          false,
          labT("number-line-explorer.opposite", "opposite (not draggable)"),
          labT("number-line-explorer.opposite-at", "opposite (not draggable) at {v}", {
            v: fmt(-a),
          }),
        );
      }
    } else {
      overlays += marker(
        a,
        C.aColor,
        "a",
        true,
        labT("number-line-explorer.point-a", "point A"),
        labT("number-line-explorer.point-a-at", "point A at {v}", { v: fmt(a) }),
      );
      overlays += marker(
        b,
        C.bColor,
        "b",
        true,
        labT("number-line-explorer.point-b", "point B"),
        labT("number-line-explorer.point-b-at", "point B at {v}", { v: fmt(b) }),
      );
    }
    el("plot").innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${labT("number-line-explorer.aria-plot", "Number line explorer")}">${axis}${overlays}</svg>`;
    wire();
  }

  function renderRead() {
    if (mode === "absolute") {
      const opp = -a;
      el("read").innerHTML =
        `<div class="nlex-card">` +
        `<div class="nlex-line">${
          Math.abs(a) === 1
            ? labT(
                "number-line-explorer.distance-one",
                "<b>{a}</b> is <b>{abs}</b> unit from zero, so <b>|{a}| = {abs}</b>.",
                { a: fmt(a), abs: fmt(Math.abs(a)) },
              )
            : labT(
                "number-line-explorer.distance-many",
                "<b>{a}</b> is <b>{abs}</b> units from zero, so <b>|{a}| = {abs}</b>.",
                { a: fmt(a), abs: fmt(Math.abs(a)) },
              )
        }</div>` +
        `<div class="nlex-line nlex-muted">${labT(
          "number-line-explorer.opposite-note",
          "Its opposite is <b>{opp}</b> — the same distance from zero, on the other side. Opposites always have the <em>same</em> absolute value.",
          { opp: fmt(opp) },
        )}</div>` +
        `</div>`;
    } else {
      const greater = a === b ? null : a > b ? a : b;
      const cmp = a === b ? "=" : a > b ? ">" : "<";
      const absNote =
        Math.abs(a) === Math.abs(b)
          ? labT(
              "number-line-explorer.same-distance",
              "They are the same distance from zero: |{a}| = |{b}| = {abs}.",
              { a: fmt(a), b: fmt(b), abs: fmt(Math.abs(a)) },
            )
          : labT(
              "number-line-explorer.farther",
              "But |{a}| = {absA} and |{b}| = {absB}, so <b>{far}</b> is farther from zero.",
              {
                a: fmt(a),
                absA: fmt(Math.abs(a)),
                b: fmt(b),
                absB: fmt(Math.abs(b)),
                far: fmt(Math.abs(a) > Math.abs(b) ? a : b),
              },
            );
      el("read").innerHTML =
        `<div class="nlex-card">` +
        `<div class="nlex-line"><b>${fmt(a)} ${cmp} ${fmt(b)}</b>${
          greater !== null
            ? ` — ${labT(
                "number-line-explorer.greater",
                "<b>{g}</b> is greater because it sits farther to the right.",
                { g: fmt(greater) },
              )}`
            : ` — ${labT("number-line-explorer.equal", "the two points are equal.")}`
        }</div>` +
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
  .nlex-title{font-family:"Outfit",system-ui,sans-serif;font-weight:700;color:${C.navy};font-size:1.05rem;}
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
