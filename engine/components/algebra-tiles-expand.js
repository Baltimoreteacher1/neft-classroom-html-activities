// algebra-tiles-expand.js — "Expand It": turns an AUTHORED static distributive-
// property figure into an interactive area-model / algebra-tiles builder for
// expanding a(x + c) IN PLACE. It reads the exact same practice `visual` config
// the static figure builder reads, so an existing item upgrades with zero
// authoring changes and the static figure stays as the JS-off / print fallback.
//
// Design principle — SEE-WHY / NON-DESTRUCTIVE:
//   The area model is drawn once and stays visible the whole time so the student
//   literally SEES why a(x + c) = a·x + a·c: an `a`-row grid with one wide "x"
//   column (teal x-tiles) and `c` unit columns (coral/navy 1-tiles). The student
//   then counts the two tile groups on tap-to-fill steppers and checks each. When
//   both are correct, the assembled expression ax + ac is revealed.
//
// Public API:  renderAlgebraExpand(host, cfg) -> { destroy } | null
// cfg = the practice item's `visual`, shaped
//   { kind:"algebra-tiles", values:[a, _, c] }  (values[1] is vestigial — ignored)
// The problem is a(x + c) and the correct expansion is a·x + (a·c).

// Data-encoding colours: fixed, not theme tokens. Inside .sg-lab the generic
// palette is remapped onto the group accent (--teal becomes var(--sg)), which
// turns every data mark the same navy. Colour that carries meaning belongs to
// the figure. See engine/light-only-surfaces.test.mjs.
const DATA_1 = "#0f8a84"; // teal - primary
const DATA_2 = "#c2603f"; // clay - secondary

const STYLE_ID = "algebra-tiles-expand-styles";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  .atx{color-scheme:light;--atx-teal:${DATA_1};--atx-coral:var(--coral,#d9795d);--atx-navy:var(--navy,#264653);--atx-ink:var(--ink,#333);--atx-muted:var(--muted,#6b7280);
    border:1px solid rgba(38,70,83,.14);border-radius:14px;padding:14px 14px 12px;margin:var(--sp-3,12px) 0;background:linear-gradient(180deg,#fff,#fbfdfc);box-shadow:0 1px 3px rgba(38,70,83,.06)}
  .atx-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
  .atx-title{font-weight:800;color:var(--atx-navy);font-size:1rem}
  .atx-badge{font-size:.68rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--atx-teal);border:1px solid currentColor;border-radius:999px;padding:2px 8px}
  .atx-model{position:relative}
  .atx-model svg{width:100%;height:auto;max-width:520px;display:block;margin:0 auto;touch-action:manipulation}
  .atx-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:12px}
  .atx-step{border:1.5px solid rgba(38,70,83,.16);border-radius:12px;padding:10px 11px;background:#fff}
  .atx-step.ok{border-color:var(--atx-teal);background:rgba(42,157,143,.08)}
  .atx-step-q{font-size:.86rem;font-weight:700;color:var(--atx-navy);margin-bottom:8px;display:flex;align-items:center;gap:6px}
  .atx-step-q .swatch{width:14px;height:14px;border-radius:4px;flex:0 0 auto;border:1px solid rgba(0,0,0,.15)}
  .atx-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .atx-nudge{display:inline-flex;align-items:center;gap:6px}
  .atx-nudge button{font:inherit;font-weight:800;width:38px;height:38px;border-radius:10px;border:1.5px solid rgba(38,70,83,.22);background:#fff;color:var(--atx-navy);cursor:pointer}
  .atx-nudge button:hover{border-color:var(--atx-teal);color:var(--atx-teal)}
  .atx-nudge button:disabled{opacity:.4;cursor:default}
  .atx-count{min-width:2.4ch;text-align:center;font-size:1.2rem;font-weight:800;color:var(--atx-navy)}
  .atx-check{font:inherit;font-size:.82rem;font-weight:800;color:#fff;background:var(--atx-teal);border:1.5px solid var(--atx-teal);border-radius:999px;padding:7px 14px;cursor:pointer}
  .atx-check:hover{filter:brightness(1.05)}
  .atx-check:disabled{background:var(--atx-teal);border-color:var(--atx-teal);cursor:default}
  .atx-tick{color:var(--atx-teal);font-weight:800;font-size:1.1rem}
  .atx-expr{display:none;margin-top:12px;text-align:center;font-size:1.5rem;font-weight:800;color:var(--atx-navy);letter-spacing:.01em;padding:10px;border-radius:12px;background:rgba(42,157,143,.1);border:1.5px solid var(--atx-teal)}
  .atx.done .atx-expr{display:block;animation:atx-pop .5s ease}
  .atx-expr .lit{color:var(--atx-coral)}
  @keyframes atx-pop{0%{transform:scale(.92);opacity:0}60%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
  .atx-note{margin-top:9px;font-size:.86rem;color:var(--atx-ink);background:rgba(42,157,143,.08);border-left:3px solid var(--atx-teal);border-radius:0 8px 8px 0;padding:7px 10px;min-height:1.2em}
  .atx-note:empty{display:none}
  @media (prefers-reduced-motion:reduce){.atx.done .atx-expr{animation:none}}
`;
  document.head.appendChild(s);
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// Positive finite integer guard (a in 1..12, c in 1..20 by authoring contract,
// but we only hard-require a positive integer so the caller's fallback owns the
// out-of-range decision).
function posInt(n) {
  return Number.isFinite(n) && Number.isInteger(n) && n > 0;
}

// Build the area model SVG: `a` rows tall, one wide x-column + `c` unit columns.
function modelSvg(a, c) {
  const W = 520,
    padL = 34,
    padT = 30,
    _padR = 14,
    padB = 16;
  const xColW = 96; // the wide "x" column
  const unitW = Math.max(16, Math.min(30, Math.floor((360 - 8) / Math.max(c, 1))));
  const gridW = xColW + 8 + unitW * c;
  const rowH = Math.max(20, Math.min(34, Math.floor(180 / a)));
  const gridH = rowH * a;
  const H = padT + gridH + padB + 22;
  const x0 = padL;
  const y0 = padT;

  let cells = "";
  for (let r = 0; r < a; r++) {
    const cy = y0 + r * rowH;
    // one tall x-tile per row (teal)
    cells +=
      `<rect x="${x0 + 1}" y="${cy + 1}" width="${xColW - 2}" height="${rowH - 2}" rx="3" fill="${DATA_1}" fill-opacity="0.9" stroke="#fff" stroke-width="1"/>` +
      `<text x="${x0 + xColW / 2}" y="${cy + rowH / 2 + 4}" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">x</text>`;
    // c unit tiles (alternating coral/navy for countability)
    for (let k = 0; k < c; k++) {
      const ux = x0 + xColW + 8 + k * unitW;
      const fill = k % 2 ? "var(--navy,#264653)" : "var(--coral,#d9795d)";
      cells += `<rect x="${ux + 1}" y="${cy + 1}" width="${unitW - 2}" height="${rowH - 2}" rx="2" fill="${fill}" fill-opacity="0.9" stroke="#fff" stroke-width="1"/>`;
    }
  }

  // top bracket label "x + c" and left label "a"
  const topY = y0 - 10;
  const xColMid = x0 + xColW / 2;
  const unitMid = x0 + xColW + 8 + (unitW * c) / 2;
  const topLabels =
    `<text x="${xColMid}" y="${topY}" text-anchor="middle" font-size="13" font-weight="800" fill="var(--navy,#264653)">x</text>` +
    `<text x="${x0 + xColW + 2}" y="${topY}" text-anchor="middle" font-size="13" font-weight="800" fill="var(--muted,#6b7280)">+</text>` +
    `<text x="${unitMid}" y="${topY}" text-anchor="middle" font-size="13" font-weight="800" fill="var(--navy,#264653)">${c}</text>`;
  const leftLabel = `<text x="${x0 - 12}" y="${y0 + gridH / 2 + 4}" text-anchor="middle" font-size="14" font-weight="800" fill="var(--navy,#264653)" transform="rotate(-90 ${x0 - 12} ${y0 + gridH / 2 + 4})">${a}</text>`;
  const bracket = `<line x1="${x0}" y1="${y0 - 4}" x2="${x0 + gridW}" y2="${y0 - 4}" stroke="var(--muted,#6b7280)" stroke-width="1"/>`;

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Area model showing ${a} rows by x plus ${c}, with ${a} tall x-tiles and ${a * c} unit tiles">${bracket}${topLabels}${leftLabel}${cells}</svg>`;
}

// One tap-to-fill counting step (x-tiles or unit tiles).
function stepMarkup(id, question, swatch, hint) {
  return (
    `<div class="atx-step" data-step="${id}">` +
    `<div class="atx-step-q"><span class="swatch" style="background:${swatch}"></span>${esc(question)}</div>` +
    `<div class="atx-row">` +
    `<span class="atx-nudge">` +
    `<button type="button" data-d="dn" aria-label="Fewer, ${esc(hint)}">−</button>` +
    `<span class="atx-count" data-el="count" role="status" aria-live="polite" aria-label="current count">0</span>` +
    `<button type="button" data-d="up" aria-label="More, ${esc(hint)}">+</button>` +
    `</span>` +
    `<button type="button" class="atx-check" data-el="check">Check</button>` +
    `<span class="atx-tick" data-el="tick" hidden>✓</span>` +
    `</div></div>`
  );
}

export function renderAlgebraExpand(host, cfg = {}) {
  try {
    injectStyles();
    const a = Number(cfg.values?.[0]);
    const c = Number(cfg.values?.[2]);
    if (!posInt(a) || !posInt(c)) return null;

    const xTilesTarget = a; // a rows × 1 x-column
    const unitTarget = a * c; // a rows × c unit columns

    const root = document.createElement("div");
    root.className = "atx";
    root.innerHTML =
      `<div class="atx-head"><span class="atx-title">Expand ${a}(x + ${c})</span>` +
      `<span class="atx-badge">Build It</span></div>` +
      `<div class="atx-model">${modelSvg(a, c)}</div>` +
      `<div class="atx-steps">` +
      stepMarkup("x", "x-tiles: how many?", "${DATA_1}", "x-tiles") +
      stepMarkup("u", "unit tiles: how many?", "var(--coral,#d9795d)", "unit tiles") +
      `</div>` +
      `<div class="atx-expr" data-el="expr" role="status" aria-live="polite"></div>` +
      `<div class="atx-note" data-el="note" role="status" aria-live="polite"></div>`;
    host.appendChild(root);

    const note = root.querySelector('[data-el="note"]');
    const expr = root.querySelector('[data-el="expr"]');
    const state = { x: { val: 0, ok: false }, u: { val: 0, ok: false } };
    const targets = { x: xTilesTarget, u: unitTarget };
    const coach = {
      x: "Count the tall x-tiles — one per row, " + a + " rows.",
      u: "Count the small unit tiles — " + c + " in each of the " + a + " rows.",
    };

    function reveal() {
      // e.g. "4x + 20" with the ax term and constant lit up
      expr.innerHTML = `<span class="lit">${a}x</span> + <span class="lit">${unitTarget}</span>`;
      root.classList.add("done");
      note.textContent = `${a}(x + ${c}) = ${a}x + ${unitTarget}. You built every tile — that is the distributive property.`;
    }

    function wireStep(id) {
      const step = root.querySelector(`[data-step="${id}"]`);
      const countEl = step.querySelector('[data-el="count"]');
      const check = step.querySelector('[data-el="check"]');
      const tick = step.querySelector('[data-el="tick"]');
      const dn = step.querySelector('[data-d="dn"]');
      const up = step.querySelector('[data-d="up"]');
      const st = state[id];

      const render = () => {
        countEl.textContent = String(st.val);
        dn.disabled = st.ok || st.val <= 0;
        up.disabled = st.ok;
      };
      const bump = (d) => {
        if (st.ok) return;
        st.val = Math.max(0, st.val + d);
        render();
      };
      dn.addEventListener("click", () => bump(-1));
      up.addEventListener("click", () => bump(1));
      check.addEventListener("click", () => {
        if (st.ok) return;
        if (st.val === targets[id]) {
          st.ok = true;
          step.classList.add("ok");
          tick.hidden = false;
          check.disabled = true;
          check.textContent = "Locked";
          render();
          if (state.x.ok && state.u.ok) reveal();
          else note.textContent = "Correct! Now finish the other group.";
        } else {
          note.textContent = coach[id];
        }
      });
      render();
    }

    wireStep("x");
    wireStep("u");

    return {
      destroy() {
        root.remove();
      },
    };
  } catch (e) {
    console.warn("algebra-tiles-expand: render failed", e);
    return null;
  }
}

export default renderAlgebraExpand;
