/**
 * Practice Studio activity helper (window.StudioAct.u7): the four-quadrant grid the Unit 7 activities share.
 * It registers no activity. A widget calls StudioAct.u7.grid(c, opts), where c comes from StudioAct.kit.start().
 *
 *   const g = StudioAct.u7.grid(c, { r: 8, name: ["Coordinate grid", "Cuadrícula de coordenadas"], onTap(x, y) {} });
 *   host.append(g.el, g.pad);  g.draw({ points: [{x, y, l, cls}], segs: [{x1, y1, x2, y2, cls}], rects: [{x1, y1, x2, y2, cls}] });
 *
 * Pointer: press shows a ghost, drag moves it, release taps that grid point (so a rough touch can be corrected before it lands).
 * Keyboard: arrow keys move the cursor one grid point, Enter or Space taps it. The pad buttons do the same for touch.
 * Classes for layers: a, b (student points), given, ok, bad, ghost. Colour never carries the meaning alone: a point's letter is drawn.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const U = (A.u7 = A.u7 || {});

  U.CSS = `
.u7-grid{max-width:440px;cursor:crosshair}
.u7-grid:focus-visible{outline:3px solid var(--ink,#1B2733);outline-offset:2px;box-shadow:0 0 0 7px var(--sun,#F0BD4F)}
.u7-grid.done{cursor:default}
.u7-gl{stroke:var(--brand-line,#BBCADA);stroke-width:1}
.u7-ax{stroke:var(--ink,#1B2733);stroke-width:2.4}
.u7-tk{fill:var(--ink,#1B2733);font:700 10px system-ui,sans-serif;text-anchor:middle}
.u7-an{fill:var(--brand,#2C4A68);font:800 13px system-ui,sans-serif}
.u7-p{stroke:var(--surface,#fff);stroke-width:2.5;fill:var(--brand,#2C4A68)}
.u7-p.b{fill:var(--sun,#F0BD4F);stroke:var(--ink,#1B2733)}
.u7-p.given{fill:var(--surface,#fff);stroke:var(--ink,#1B2733);stroke-width:3}
.u7-p.ok{fill:var(--ok,#0A7D4B)}
.u7-p.bad{fill:var(--bad,#B42318)}
.u7-pl{fill:var(--ink,#1B2733);font:800 12px system-ui,sans-serif;paint-order:stroke;stroke:var(--surface,#fff);stroke-width:3px}
.u7-ghost{fill:none;stroke:var(--brand,#2C4A68);stroke-width:2;stroke-dasharray:3 3}
.u7-cur{fill:none;stroke:var(--ink,#1B2733);stroke-width:3}
.u7-curh{fill:none;stroke:var(--sun,#F0BD4F);stroke-width:7}
.u7-seg{stroke:var(--brand,#2C4A68);stroke-width:2.5;stroke-dasharray:6 4;fill:none}
.u7-seg.bar{stroke:var(--sun,#F0BD4F);stroke-width:6;stroke-dasharray:none;stroke-linecap:round}
.u7-seg.ok{stroke:var(--ok,#0A7D4B)}
.u7-rect{fill:color-mix(in srgb,var(--brand,#2C4A68) 8%,transparent);stroke:var(--brand,#2C4A68);stroke-width:2;stroke-dasharray:6 4}
.u7-pad{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.u7-pad[hidden]{display:none}
@media (forced-colors:active){.u7-p{fill:Highlight;stroke:Canvas}.u7-p.given{fill:Canvas;stroke:CanvasText}.u7-gl{stroke:GrayText}.u7-ax,.u7-seg,.u7-rect,.u7-cur{stroke:CanvasText}.u7-tk,.u7-pl,.u7-an{fill:CanvasText}}
`;

  /**
   * @param {any} c the kit context
   * @param {{r?: number, name?: string[], onTap?: (x: number, y: number) => void, fixed?: boolean}} o
   */
  U.grid = (c, o) => {
    A.css("u7", U.CSS);
    const r = o.r || 8;
    const N = 2 * r;
    const S = 400;
    const pad = 24;
    const cell = (S - 2 * pad) / N;
    const X = (/** @type {number} */ x) => Math.round((pad + (x + r) * cell) * 10) / 10;
    const Y = (/** @type {number} */ y) => Math.round((pad + (r - y) * cell) * 10) / 10;
    const every = r > 8 ? 2 : 1;
    const el = A.el("div", "ak-svg u7-grid", "", {
      tabindex: c.solved ? "-1" : "0",
      role: "application",
    });
    if (c.solved) el.classList.add("done");
    c.label(
      el,
      `${o.name?.[0] || "Coordinate grid"}. Arrow keys move the cursor. Press Enter to place a point.`,
      `${o.name?.[1] || "Cuadrícula de coordenadas"}. Las flechas mueven el cursor. Presiona Enter para poner un punto.`,
    );
    const live = A.el("p", "ak-sr", "", { role: "status" });
    let cur = { x: 0, y: 0 };
    /** @type {{x: number, y: number} | null} */
    let ghost = null;
    let showCur = false;
    let last = /** @type {any} */ ({});
    /** @type {number | null} */
    let down = null;

    const grid = (() => {
      let s = "";
      for (let k = -r; k <= r; k++)
        s += `<line class="u7-gl" x1="${X(k)}" y1="${Y(-r)}" x2="${X(k)}" y2="${Y(r)}"/><line class="u7-gl" x1="${X(-r)}" y1="${Y(k)}" x2="${X(r)}" y2="${Y(k)}"/>`;
      s += `<line class="u7-ax" x1="${X(-r)}" y1="${Y(0)}" x2="${X(r)}" y2="${Y(0)}"/><line class="u7-ax" x1="${X(0)}" y1="${Y(-r)}" x2="${X(0)}" y2="${Y(r)}"/>`;
      for (let k = -r; k <= r; k++) {
        if (!k || k % every) continue;
        s += `<text class="u7-tk" x="${X(k)}" y="${Y(0) + 13}">${k < 0 ? "−" : ""}${Math.abs(k)}</text><text class="u7-tk" x="${X(0) - 9}" y="${Y(k) + 3.5}">${k < 0 ? "−" : ""}${Math.abs(k)}</text>`;
      }
      s += `<text class="u7-an" x="${X(r) - 4}" y="${Y(0) - 7}" text-anchor="end">x</text><text class="u7-an" x="${X(0) + 8}" y="${Y(r) + 12}">y</text>`;
      return s;
    })();

    /** @param {any} layers */
    const draw = (layers = last) => {
      last = layers;
      let s = grid;
      for (const q of layers.rects || [])
        s += `<rect class="u7-rect" x="${X(Math.min(q.x1, q.x2))}" y="${Y(Math.max(q.y1, q.y2))}" width="${Math.abs(q.x2 - q.x1) * cell}" height="${Math.abs(q.y2 - q.y1) * cell}"/>`;
      for (const q of layers.segs || [])
        s += `<line class="u7-seg ${q.cls || ""}" x1="${X(q.x1)}" y1="${Y(q.y1)}" x2="${X(q.x2)}" y2="${Y(q.y2)}"/>`;
      for (const p of layers.points || [])
        s += `<circle class="u7-p ${p.cls || ""}" cx="${X(p.x)}" cy="${Y(p.y)}" r="${Math.max(6, Math.min(10, cell * 0.4))}"/>${p.l ? `<text class="u7-pl" x="${X(p.x) + 9}" y="${Y(p.y) - 8}">${p.l}</text>` : ""}`;
      if (!c.solved && ghost)
        s += `<circle class="u7-ghost" cx="${X(ghost.x)}" cy="${Y(ghost.y)}" r="9"/>`;
      if (!c.solved && showCur)
        s += `<circle class="u7-curh" cx="${X(cur.x)}" cy="${Y(cur.y)}" r="13"/><circle class="u7-cur" cx="${X(cur.x)}" cy="${Y(cur.y)}" r="13"/>`;
      el.innerHTML = `<svg viewBox="0 0 ${S} ${S}" aria-hidden="true" focusable="false">${s}</svg>`;
    };
    const clamp = (/** @type {number} */ v) => Math.max(-r, Math.min(r, v));
    const at = (/** @type {any} */ ev) => {
      const b = el.getBoundingClientRect();
      const px = ((ev.clientX - b.left - el.clientLeft) * S) / (el.clientWidth || b.width || S);
      const py = ((ev.clientY - b.top - el.clientTop) * S) / (el.clientWidth || b.width || S);
      return {
        x: clamp(Math.round((px - pad) / cell - r)),
        y: clamp(Math.round(r - (py - pad) / cell)),
      };
    };
    const speak = (/** @type {string} */ en, /** @type {string} */ esT) => {
      live.textContent = c.L(en, esT);
    };
    const nm = (/** @type {number} */ v) => `${v < 0 ? "−" : ""}${Math.abs(v)}`;
    const move = (/** @type {number} */ dx, /** @type {number} */ dy) => {
      cur = { x: clamp(cur.x + dx), y: clamp(cur.y + dy) };
      showCur = true;
      speak(`Cursor at (${nm(cur.x)}, ${nm(cur.y)})`, `Cursor en (${nm(cur.x)}, ${nm(cur.y)})`);
      draw();
    };
    const tap = (/** @type {number} */ x, /** @type {number} */ y) => {
      if (c.solved || !o.onTap) return;
      o.onTap(x, y);
    };

    if (!c.solved) {
      el.addEventListener("keydown", (e) => {
        const d = /** @type {any} */ ({
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, 1],
          ArrowDown: [0, -1],
        })[e.key];
        if (d) {
          e.preventDefault();
          move(d[0], d[1]);
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          tap(cur.x, cur.y);
        }
      });
      el.addEventListener("focus", () => {
        showCur = true;
        draw();
      });
      el.addEventListener("blur", () => {
        showCur = false;
        draw();
      });
      el.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        el.focus({ preventScroll: true });
        down = e.pointerId;
        ghost = at(e);
        cur = { ...ghost };
        draw();
      });
      el.addEventListener("pointermove", (e) => {
        if (down === null && e.pointerType !== "mouse") return;
        const g = at(e);
        if (!ghost || ghost.x !== g.x || ghost.y !== g.y) {
          ghost = g;
          if (down !== null) cur = { ...g };
          draw();
        }
      });
      el.addEventListener("pointerup", (e) => {
        if (down === null) return;
        down = null;
        const g = at(e);
        cur = { ...g };
        ghost = e.pointerType === "mouse" ? g : null;
        draw();
        tap(g.x, g.y);
      });
      const drop = () => {
        down = null;
        if (ghost) {
          ghost = null;
          draw();
        }
      };
      el.addEventListener("pointercancel", drop);
      el.addEventListener("pointerleave", drop);
    }

    const padEl = A.el("div", "u7-pad");
    if (!c.solved) {
      const mk = (
        /** @type {string} */ glyph,
        /** @type {string} */ en,
        /** @type {string} */ esT,
        /** @type {() => void} */ fn,
      ) => {
        const b = A.el("button", "ak-step", glyph, { type: "button" });
        c.label(b, en, esT);
        b.addEventListener("click", fn);
        return b;
      };
      const place = A.el("button", "ak-btn", c.T("Place at cursor", "Poner en el cursor"), {
        type: "button",
      });
      place.addEventListener("click", () => tap(cur.x, cur.y));
      padEl.append(
        mk("←", "Move cursor left", "Mover el cursor a la izquierda", () => move(-1, 0)),
        mk("↓", "Move cursor down", "Mover el cursor hacia abajo", () => move(0, -1)),
        mk("↑", "Move cursor up", "Mover el cursor hacia arriba", () => move(0, 1)),
        mk("→", "Move cursor right", "Mover el cursor a la derecha", () => move(1, 0)),
        place,
      );
    }
    c.redraws.push(() => draw());
    draw({});
    return {
      el,
      pad: padEl,
      live,
      draw,
      r,
      cur: () => cur,
      setCur: (/** @type {number} */ x, /** @type {number} */ y) => ((cur = { x, y }), draw()),
    };
  };
})();
