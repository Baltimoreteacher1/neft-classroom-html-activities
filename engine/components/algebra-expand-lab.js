// algebra-expand-lab.js — Preset wrapper around the "Expand It" area-model lab
// (algebra-tiles-expand.js) so a distribute lesson can offer quick-pick a(x + c)
// problems. Each problem expands a(x + c) = a·x + a·c on the tap-to-fill tiles.
//
// Public API:  renderAlgebraExpandLab(host, cfg) -> { destroy }
//   cfg = { kind:'algebra-expand', a, c, title?, presets?:[{ a, c, label? }] }

import { renderAlgebraExpand } from "./algebra-tiles-expand.js";

let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected || document.getElementById("axl-styles")) {
    stylesInjected = true;
    return;
  }
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "axl-styles";
  s.textContent = `
  .axl-wrap{margin:var(--sp-3,12px) 0;display:flex;flex-direction:column;align-items:center;}
  .axl-presets{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:8px;}
  .axl-chip{padding:5px 13px;font:inherit;font-size:.85rem;font-weight:600;color:#12355b;background:#f4f8ff;
    border:1.5px solid #d7e2ed;border-radius:999px;cursor:pointer;}
  .axl-chip:hover{background:#e2ecff;border-color:#1d4ed8;}
  .axl-chip[aria-pressed="true"]{background:#1d4ed8;color:#fff;border-color:#1d4ed8;}
  .axl-stage{width:100%;}
  `;
  document.head.appendChild(s);
}

// Mount the expand lab for one {a, c} into `stage`. renderAlgebraExpand reads
// cfg.values = [a, _, c]; it returns null on invalid input, so guard for that.
function mountOne(stage, a, c) {
  return renderAlgebraExpand(stage, { values: [a, null, c] }) || { destroy() {} };
}

export function renderAlgebraExpandLab(host, cfg = {}) {
  ensureStyles();
  const presets = Array.isArray(cfg.presets)
    ? cfg.presets.filter((p) => p && p.a != null && p.c != null)
    : [];
  const problems = presets.length ? presets : [{ a: cfg.a, c: cfg.c }];

  const wrap = document.createElement("div");
  wrap.className = "axl-wrap";
  const stage = document.createElement("div");
  stage.className = "axl-stage";
  let current = null;
  const mount = (p) => {
    if (current) current.destroy();
    stage.innerHTML = "";
    current = mountOne(stage, Number(p.a), Number(p.c));
  };

  if (problems.length > 1) {
    const bar = document.createElement("div");
    bar.className = "axl-presets";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Pick a problem");
    problems.forEach((p, i) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "axl-chip";
      chip.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      chip.textContent = p.label || `${p.a}(x + ${p.c})`;
      chip.addEventListener("click", () => {
        [...bar.children].forEach((cc, j) =>
          cc.setAttribute("aria-pressed", j === i ? "true" : "false"),
        );
        mount(problems[i]);
      });
      bar.appendChild(chip);
    });
    wrap.appendChild(bar);
  }
  wrap.appendChild(stage);
  host.appendChild(wrap);
  mount(problems[0]);

  return {
    destroy() {
      if (current) current.destroy();
      wrap.remove();
    },
  };
}

export default renderAlgebraExpandLab;
