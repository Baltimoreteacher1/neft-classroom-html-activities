// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
// stat-towers.js — 3D data towers for measures of center and spread. Each data
// value is a tower of unit blocks rendered with pure CSS 3D transforms (same
// zero-dependency approach as shape-3d.js). The signature move: press
// "Level them" and watch blocks physically fly from tall towers to short ones
// until every tower is the SAME height — that height IS the mean. Mean as
// fair-share/leveling is the core Grade 6 mental model (6.DS.4), and MAD
// (6.DS.6c) becomes visible as "how far each tower sits from the leveled line".
//
// Public API:
//   renderStatTowers(container, { values, unit, label, mode }) -> { destroy }
//     values: number[] (integers ≥ 0, ≤ 12 towers, heights capped at 12)
//     unit:   what one block means, e.g. "books" (optional)
//     mode:   "mean" (default) | "spread" — spread adds the deviation readout
//
// Students can also tap a tower to add a block (+ shift-tap / long-press button
// to remove), so "what happens to the mean if…" is one tap away. Honors
// prefers-reduced-motion by swapping the flight animation for a crossfade.

const C = {
  navy: "#12355b",
  teal: "#1fa6a2",
  coral: "#d9795d",
  amber: "#f2a516",
  line: "#cfe0f0",
  muted: "#54677c",
  meanLine: "#e8663c",
};

const MAX_TOWERS = 12;
const MAX_H = 12;

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || document.getElementById("stat-towers-style")) return;
  stylesInjected = true;
  const el = document.createElement("style");
  el.id = "stat-towers-style";
  el.textContent = `
.stat-towers{max-width:600px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px;box-shadow:0 2px 10px rgba(12,27,42,.08);}
.stat-towers .st-stage{position:relative;height:280px;perspective:900px;overflow:hidden;border-radius:12px;background:linear-gradient(180deg,#f6fbff 0%,#eef6f4 100%);}
.stat-towers .st-tower{position:absolute;bottom:0;transform-style:preserve-3d;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.stat-towers .st-block{position:absolute;left:0;width:100%;height:100%;transform-style:preserve-3d;transition:transform .55s cubic-bezier(.22,.9,.34,1.15),opacity .4s;}
.stat-towers .st-face{position:absolute;inset:0;border:1px solid rgba(18,53,91,.35);border-radius:3px;}
.stat-towers .st-meanline{position:absolute;left:4%;right:4%;border-top:3px dashed ${C.meanLine};opacity:0;transition:opacity .5s,bottom .55s;pointer-events:none;}
.stat-towers .st-meanline .st-meantag{position:absolute;right:0;top:-24px;background:${C.meanLine};color:#fff;font-weight:800;font-size:.78rem;padding:2px 8px;border-radius:8px;font-family:system-ui;}
.stat-towers .st-val{position:absolute;bottom:-22px;left:50%;transform:translateX(-50%);font:700 .8rem system-ui;color:${C.navy};}
.stat-towers .st-btn{min-height:44px;padding:0 16px;border:2px solid ${C.line};border-radius:12px;background:#fff;color:${C.navy};font-weight:700;cursor:pointer;font-size:.95rem;}
.stat-towers .st-btn[data-primary]{background:${C.teal};border-color:${C.teal};color:#fff;}
.stat-towers .st-btn:disabled{opacity:.5;cursor:default;}
@media (prefers-reduced-motion: reduce){.stat-towers .st-block{transition:opacity .3s;}}
`;
  document.head.appendChild(el);
}

export function renderStatTowers(container, cfg = {}) {
  injectStyles();
  const unit = cfg.unit ? String(cfg.unit) : "";
  const mode = cfg.mode === "spread" ? "spread" : "mean";
  let values = (Array.isArray(cfg.values) && cfg.values.length ? cfg.values : [3, 7, 4, 9, 2])
    .slice(0, MAX_TOWERS)
    .map((v) => Math.max(0, Math.min(MAX_H, Math.round(Number(v) || 0))));
  const original = [...values];
  let leveled = false;

  const root = document.createElement("div");
  root.className = "stat-towers";

  const stage = document.createElement("div");
  stage.className = "st-stage";
  root.appendChild(stage);

  const meanLine = document.createElement("div");
  meanLine.className = "st-meanline";
  meanLine.innerHTML = '<span class="st-meantag"></span>';
  stage.appendChild(meanLine);

  const readout = document.createElement("div");
  readout.setAttribute("aria-live", "polite");
  readout.style.cssText =
    "display:flex;flex-wrap:wrap;gap:10px 18px;margin:26px 0 8px;font-size:1rem;justify-content:center;";
  root.appendChild(readout);

  const note = document.createElement("div");
  note.style.cssText = `text-align:center;color:${C.muted};font-size:.95rem;margin-bottom:12px;min-height:2.4em;`;
  root.appendChild(note);

  const controls = document.createElement("div");
  controls.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;justify-content:center;";
  controls.innerHTML =
    '<button type="button" class="st-btn" data-act="level" data-primary>⚖️ Level them → find the mean</button>' +
    '<button type="button" class="st-btn" data-act="reset">↩ Reset data</button>' +
    '<button type="button" class="st-btn" data-act="minus">− block from tallest</button>';
  root.appendChild(controls);

  const stats = () => {
    const n = values.length;
    const sum = values.reduce((s, v) => s + v, 0);
    const mean = sum / n;
    const sorted = [...values].sort((x, y) => x - y);
    const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    const mad = values.reduce((s, v) => s + Math.abs(v - mean), 0) / n;
    return { n, sum, mean, median, mad };
  };

  // ── 3D tower rendering ─────────────────────────────────────────────────────
  // Layout: towers stand in a row, each an extruded stack of unit cubes drawn
  // with three visible faces (front / top / side) — the classic axonometric
  // block look, driven entirely by CSS 3D transforms on nested divs.
  const BLOCK = 20; // px face size
  const GAPX = 14;

  function towerX(i) {
    const w = values.length * (BLOCK + GAPX) - GAPX;
    return -w / 2 + i * (BLOCK + GAPX);
  }

  function blockEl(colorA, colorB) {
    const b = document.createElement("div");
    b.className = "st-block";
    b.style.width = `${BLOCK}px`;
    b.style.height = `${BLOCK}px`;
    b.innerHTML =
      `<div class="st-face" style="background:${colorA};transform:translateZ(${BLOCK / 2}px)"></div>` +
      `<div class="st-face" style="background:${colorB};transform:rotateY(90deg) translateZ(${BLOCK / 2}px)"></div>` +
      `<div class="st-face" style="background:#fff;filter:brightness(.96);transform:rotateX(90deg) translateZ(${BLOCK / 2}px)"></div>`;
    return b;
  }

  const towers = [];

  function rebuildStage() {
    towers.forEach((t) => t.el.remove());
    towers.length = 0;
    values.forEach((_v, i) => {
      const t = document.createElement("div");
      t.className = "st-tower";
      t.style.left = `calc(50% + ${towerX(i)}px)`;
      t.style.width = `${BLOCK}px`;
      t.style.bottom = "34px";
      t.style.transform = "rotateX(-8deg) rotateY(-16deg)";
      t.setAttribute("role", "button");
      t.setAttribute("tabindex", "0");
      const label = document.createElement("span");
      label.className = "st-val";
      t.appendChild(label);
      stage.appendChild(t);
      towers.push({ el: t, blocks: [], label });
      t.addEventListener("click", () => bump(i, 1));
      t.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          bump(i, 1);
        }
        if (e.key === "Backspace" || e.key === "-") bump(i, -1);
      });
      syncTower(i);
    });
    syncMeanLine();
    syncReadout();
  }

  function syncTower(i) {
    const t = towers[i];
    const v = values[i];
    const isMean = leveled;
    while (t.blocks.length < v) {
      const b = blockEl(isMean ? "#ffd9cc" : "#c9ecea", isMean ? C.coral : C.teal);
      const level = t.blocks.length;
      b.style.transform = `translateY(${-level * BLOCK}px) translateY(-140px)`;
      b.style.opacity = "0";
      t.el.appendChild(b);
      t.blocks.push(b);
      requestAnimationFrame(() => {
        b.style.opacity = "1";
        b.style.transform = `translateY(${-level * BLOCK}px)`;
      });
    }
    while (t.blocks.length > v) {
      const b = t.blocks.pop();
      b.style.opacity = "0";
      b.style.transform += " translateY(-140px)";
      setTimeout(() => b.remove(), 550);
    }
    t.label.textContent = String(v);
    t.el.setAttribute(
      "aria-label",
      `Tower ${i + 1}: ${v}${unit ? ` ${unit}` : ""}. Tap to add a block.`,
    );
  }

  function syncMeanLine() {
    const { mean } = stats();
    meanLine.querySelector(".st-meantag").textContent = `mean = ${Math.round(mean * 100) / 100}`;
    meanLine.style.opacity = leveled ? "1" : "0";
    if (!leveled) return;
    // The 3D projection (perspective + tilt) shifts where block stacks LAND on
    // screen, so a purely computed 34 + mean·BLOCK misses the visual tower
    // tops. Measure the tallest stack's real screen geometry instead, then
    // re-measure once the block flight animation has settled.
    const place = () => {
      if (!root.isConnected) return;
      const t = towers[values.indexOf(Math.max(...values))];
      if (!t || !t.blocks.length) {
        meanLine.style.bottom = `${34 + mean * BLOCK}px`;
        return;
      }
      const stageR = stage.getBoundingClientRect();
      const rects = t.blocks.map((b) => b.getBoundingClientRect());
      const top = Math.min(...rects.map((r) => r.top));
      const bot = Math.max(...rects.map((r) => r.bottom));
      const per = (bot - top) / t.blocks.length;
      meanLine.style.bottom = `${stageR.bottom - bot + mean * per}px`;
    };
    place();
    setTimeout(place, 620);
  }

  function syncReadout() {
    const s = stats();
    const r2 = (x) => Math.round(x * 100) / 100;
    const chip = (color, name, val) =>
      `<span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;border-radius:3px;background:${color};"></span><b style="color:${C.navy}">${name}:</b> ${val}</span>`;
    readout.innerHTML =
      chip(C.meanLine, "Mean", r2(s.mean)) +
      chip("#6d4ad6", "Median", r2(s.median)) +
      (mode === "spread" ? chip(C.amber, "MAD", r2(s.mad)) : "") +
      `<span style="color:${C.muted}">n = ${s.n} · total = ${s.sum}${unit ? ` ${esc(unit)}` : ""}</span>`;
    if (leveled) {
      note.textContent = Number.isInteger(s.mean)
        ? `Every tower now holds exactly ${s.mean} — the mean is the fair-share height.`
        : `The blocks can't split evenly (${s.sum} ÷ ${s.n}), so the mean ${r2(s.mean)} sits BETWEEN tower heights — that's why a mean can be a decimal.`;
    } else if (mode === "spread") {
      note.textContent =
        "MAD asks: on average, how far is each tower from the mean line? Level them to see the line, then compare each tower to it.";
    } else {
      note.textContent =
        "Tap a tower to add a block and watch the mean move. Then level them to SEE the mean.";
    }
  }

  // "Level them": redistribute to floor(mean)/ceil(mean) so the total is
  // conserved — blocks move, none appear or vanish. The animation reads as
  // tall towers donating blocks to short ones.
  function level() {
    const { sum, n } = stats();
    const base = Math.floor(sum / n);
    let extra = sum - base * n; // this many towers get one bonus block
    values = values.map(() => base + (extra-- > 0 ? 1 : 0));
    leveled = true;
    towers.forEach((_, i) => syncTower(i));
    // Recolor existing blocks to the "mean" palette for a clear state change.
    towers.forEach((t) =>
      t.blocks.forEach((b) => {
        const faces = b.querySelectorAll(".st-face");
        if (faces[0]) faces[0].style.background = "#ffd9cc";
        if (faces[1]) faces[1].style.background = C.coral;
      }),
    );
    syncMeanLine();
    syncReadout();
  }

  function bump(i, d) {
    leveled = false;
    values[i] = Math.max(0, Math.min(MAX_H, values[i] + d));
    syncTower(i);
    syncMeanLine();
    syncReadout();
  }

  controls.addEventListener("click", (e) => {
    const act = e.target.closest("button")?.dataset.act;
    if (!act) return;
    if (act === "level") level();
    else if (act === "reset") {
      values = [...original];
      leveled = false;
      rebuildStage();
    } else if (act === "minus") {
      const i = values.indexOf(Math.max(...values));
      if (values[i] > 0) bump(i, -1);
    }
  });

  root.setAttribute("role", "group");
  root.setAttribute(
    "aria-label",
    cfg.label ||
      `Interactive 3D data towers showing ${values.length} values. Level them to find the mean.`,
  );

  container.appendChild(root);
  rebuildStage();

  return {
    destroy() {
      root.remove();
    },
  };
}

export default renderStatTowers;
