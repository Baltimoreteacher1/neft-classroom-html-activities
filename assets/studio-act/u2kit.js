/**
 * Practice Studio activity kit for the Unit 2 statistics and decimal activities (window.StudioAct.kit).
 *
 * It registers no activity. It holds the small pure helpers (five-number summary, mean, MAD, formatting) and the two
 * shared widgets the Unit 2 activities are built from: a row of draggable dots on a number line, and a row of bars the
 * student raises and lowers. Activities read A.kit lazily (inside make / grade / mount), so file load order never matters.
 * Contract: docs/specs/practice-studio-v2.md section 5; grade() shape from docs/audits/studio-v4/RULES.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const K = (A.kit = A.kit || {});
  const EPS = 1e-9;
  K.EPS = EPS;

  /* ---- pure helpers ----------------------------------------------------------------------------- */
  /** Display number: true minus, no float noise. */
  K.f = (/** @type {number} */ n, dp = 2) => W.StudioGen.fmt(n, dp).replace("-", "−");
  K.sum = (/** @type {number[]} */ d) => d.reduce((a, b) => a + b, 0);
  K.sorted = (/** @type {number[]} */ d) => d.slice().sort((a, b) => a - b);
  K.medianOf = (/** @type {number[]} */ d) => {
    const s = K.sorted(d);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  /** Five-number summary with the grade 6 rule: the quartiles are the medians of the lower and upper halves. */
  K.five = (/** @type {number[]} */ d) => {
    const s = K.sorted(d);
    const n = s.length;
    return {
      min: s[0],
      q1: K.medianOf(s.slice(0, n >> 1)),
      med: K.medianOf(s),
      q3: K.medianOf(s.slice(Math.ceil(n / 2))),
      max: s[n - 1],
    };
  };
  K.meanOf = (/** @type {number[]} */ d) => K.sum(d) / d.length;
  /** Total distance of the values from their mean, and the mean absolute deviation. */
  K.dev = (/** @type {number[]} */ d) => {
    const m = K.meanOf(d);
    const total = d.reduce((a, v) => a + Math.abs(v - m), 0);
    return { mean: m, total, mad: total / d.length };
  };
  K.same = (/** @type {number[]} */ a, /** @type {number[]} */ b) => {
    const x = K.sorted(a);
    const y = K.sorted(b);
    return x.length === y.length && x.every((v, i) => Math.abs(v - y[i]) < EPS);
  };
  /** "English|Spanish" -> [en, es] with {name} slots filled. */
  K.fill = (/** @type {string} */ s, /** @type {any} */ o = {}) =>
    s.replace(/\{(\w+)\}/g, (_m, k) => String(o[k] ?? "")).split("|");
  /** A failed grade: the shape every activity returns. say / sayEs come from one "English|Spanish" string. */
  K.no = (/** @type {string} */ tag, /** @type {string} */ pair, /** @type {any} */ extra = {}) => {
    const [say, sayEs] = pair.split("|");
    return { ok: false, tag, say, sayEs, ...extra };
  };
  /** { ok, right, of, marks } from a list of booleans (one per part). */
  K.score = (/** @type {boolean[]} */ marks) => ({
    right: marks.filter(Boolean).length,
    of: marks.length,
    marks,
  });

  /* ---- shared styles ---------------------------------------------------------------------------- */
  const CSS = `
.u2-root{display:grid;gap:12px;color:var(--ink,#1B2733);font:inherit}
.u2-cap{margin:0;font-size:.92rem;opacity:.85}
.u2-box{background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:8px}
.u2-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.u2-row.is-mid{justify-content:center}
.u2-btn{appearance:none;font:inherit;font-weight:800;cursor:pointer;min-height:48px;min-width:48px;padding:6px 16px;border-radius:var(--radius-md,14px);border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;background:var(--surface,#fff);color:var(--ink,#1B2733)}
.u2-btn:hover:not(:disabled){background:var(--brand-tint,#E5ECF3)}
.u2-btn:disabled{opacity:.45;cursor:not-allowed}
.u2-btn:focus-visible,.u2-opt:focus-visible,.u2-col:focus-visible{outline:4px solid var(--sun,#F0BD4F);outline-offset:2px}
.u2-go{background:var(--brand,#2C4A68);color:var(--surface,#fff)}
.u2-go:hover:not(:disabled){background:var(--brand,#2C4A68);filter:brightness(1.12)}
.u2-opt{appearance:none;font:inherit;text-align:left;cursor:pointer;min-height:48px;padding:8px 12px;border-radius:var(--radius-md,14px);border:2px solid var(--border,#D5DCE5);background:var(--surface,#fff);color:var(--ink,#1B2733)}
.u2-opt[aria-pressed="true"],.u2-opt[aria-checked="true"]{border-color:var(--brand,#2C4A68);background:var(--brand-tint,#E5ECF3);font-weight:700}
.u2-opt:disabled{cursor:default}
.u2-chips{display:flex;flex-wrap:wrap;gap:8px}
.u2-chip{flex:1 1 7em;display:grid;gap:1px;padding:8px 12px;border:2px solid var(--brand-line,#BBCADA);border-radius:var(--radius-md,14px);background:var(--brand-tint,#E5ECF3)}
.u2-chip b{font-size:.82rem}
.u2-chip output{font-size:1.35rem;font-weight:800;line-height:1.1}
.u2-chip small{font-size:.78rem;opacity:.85}
.u2-chip.is-ok{border-color:var(--ok,#0A7D4B);box-shadow:inset 0 0 0 1px var(--ok,#0A7D4B)}
.u2-chip.is-ok small::before{content:"\\2713 ";color:var(--ok,#0A7D4B);font-weight:800}
.u2-plot{background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);overflow:hidden}
.u2-svg{display:block;width:100%;height:auto;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.u2-axis{stroke:var(--ink,#1B2733);stroke-width:2}
.u2-tick{fill:var(--ink,#1B2733);font:700 12px system-ui,sans-serif;text-anchor:middle}
.u2-dot{cursor:grab;outline:none}
.u2-dotfill{fill:var(--sun,#F0BD4F);stroke:var(--ink,#1B2733);stroke-width:2}
.u2-ring{fill:none;stroke:var(--brand,#2C4A68);stroke-width:4;opacity:0}
.u2-dot.is-sel .u2-ring{opacity:1}
.u2-dot:focus-visible .u2-ring{opacity:1;stroke:var(--ink,#1B2733);stroke-dasharray:5 3}
.u2-mark{stroke:var(--brand,#2C4A68);stroke-width:3;stroke-dasharray:6 4}
.u2-marklab{fill:var(--ink,#1B2733);font:700 11px system-ui,sans-serif}
.u2-sel{min-width:9.5em;text-align:center;font-weight:700}
.u2-bars{display:flex;gap:6px;align-items:stretch}
.u2-colwrap{flex:1 1 0;min-width:48px;display:grid;gap:4px;justify-items:center}
.u2-col{width:100%;outline:none;border-radius:8px;cursor:ns-resize;touch-action:none}
.u2-well{position:relative;height:170px;border-bottom:3px solid var(--ink,#1B2733);background:repeating-linear-gradient(to top,transparent 0,transparent 33px,var(--border,#D5DCE5) 33px,var(--border,#D5DCE5) 34px)}
.u2-bar{position:absolute;left:12%;right:12%;bottom:0;background:var(--brand,#2C4A68);border-radius:6px 6px 0 0;min-height:0}
.u2-bar.is-pick{background:var(--sun,#F0BD4F);outline:3px solid var(--ink,#1B2733)}
.u2-barn{position:absolute;left:0;right:0;text-align:center;font-weight:800;font-size:.95rem}
.u2-lab{font-size:.78rem;font-weight:700;text-align:center}
.u2-note{margin:0;font-size:.9rem}
.u2-live{margin:0;min-height:1.3em;font-weight:700}
@media (prefers-reduced-motion:no-preference){.u2-bar{transition:height .15s ease}.u2-dot{transition:transform .15s ease}.u2-dot.is-drag{transition:none}}
@media (forced-colors:active){.u2-bar,.u2-dotfill{fill:Highlight;background:Highlight}.u2-btn,.u2-chip,.u2-opt{border-color:ButtonText}}
`;
  K.useCss = () => A.css("u2kit", CSS);

  /* ---- widget plumbing -------------------------------------------------------------------------- */
  /** Common start of every mount(): styles, emptied host, language helpers, a live region. */
  K.shell = (/** @type {any} */ host, /** @type {any} */ api, /** @type {string} */ cls = "") => {
    K.useCss();
    host.textContent = "";
    const root = A.el("div", `u2-root ${cls}`.trim());
    host.append(root);
    const L = (/** @type {string} */ en, /** @type {string} */ es) => (api.es?.() ? es : en);
    const B = (/** @type {string} */ en, /** @type {string} */ es) => A.t(en, es);
    const live = A.el("p", "u2-live", "", { role: "status", "aria-live": "polite" });
    return { root, L, B, live, ro: !!api.solved };
  };
  /** Check / Hint / Start over. */
  K.actions = (
    /** @type {any} */ root,
    /** @type {any} */ api,
    /** @type {any} */ B,
    /** @type {() => any} */ state,
    /** @type {() => void} */ reset,
  ) => {
    const row = A.el("div", "u2-row");
    const mk = (/** @type {string} */ cls, /** @type {string} */ en, /** @type {string} */ es) =>
      A.el("button", `u2-btn ${cls}`.trim(), B(en, es), { type: "button" });
    const check = mk("u2-go", "Check", "Revisar");
    const hint = mk("", "Hint", "Pista");
    const again = mk("", "Start over", "Empezar de nuevo");
    check.addEventListener("click", () => api.submit?.(state()));
    hint.addEventListener("click", () => api.hint?.());
    again.addEventListener("click", reset);
    row.append(check, hint, again);
    root.append(row);
    return row;
  };
  /** A toggle button list (radio-like) with 48px targets. onPick(i) runs after the state changes. */
  K.choices = (
    /** @type {any} */ parent,
    /** @type {{en:string, es:string}[]} */ opts,
    /** @type {number|null} */ cur,
    /** @type {boolean} */ ro,
    /** @type {(i:number)=>void} */ onPick,
    /** @type {string} */ label,
    /** @type {any} */ B,
  ) => {
    const grp = A.el("div", "u2-row", "", { role: "radiogroup", "aria-label": label });
    const btns = opts.map((o, i) => {
      const b = A.el("button", "u2-opt", B(o.en, o.es), {
        type: "button",
        role: "radio",
        "aria-checked": String(cur === i),
      });
      b.disabled = ro;
      b.addEventListener("click", () => {
        btns.forEach((x, j) => x.setAttribute("aria-checked", String(j === i)));
        onPick(i);
      });
      grp.append(b);
      return b;
    });
    parent.append(grp);
    return {
      el: grp,
      set(/** @type {number|null} */ v) {
        btns.forEach((x, j) => x.setAttribute("aria-checked", String(j === v)));
      },
    };
  };

  /* ---- a row of draggable dots on a number line --------------------------------------------------- */
  /**
   * o: { n, lo, hi, step, vals, ro, nameOf(i), tickEvery, overlay(g, X, S, vals, ctx), onChange(vals, i), lockedAt:Set }
   * Returns { get, set, paint }. Keyboard: arrows, Home, End, PageUp, PageDown on the selected dot; Previous / Next dot buttons.
   */
  K.dotStage = (/** @type {any} */ parent, /** @type {any} */ o, /** @type {any} */ api) => {
    const L = (/** @type {string} */ en, /** @type {string} */ es) => (api.es?.() ? es : en);
    const SV = (
      /** @type {string} */ tg,
      /** @type {any} */ at = {},
      /** @type {any} */ p = null,
    ) => {
      const e = /** @type {any} */ (document.createElementNS("http://www.w3.org/2000/svg", tg));
      for (const k of Object.keys(at)) e.setAttribute(k, String(at[k]));
      p?.append(e);
      return e;
    };
    const { n, lo, hi } = o;
    const step = o.step || 1;
    const vals = o.vals.slice();
    const R = 10;
    const PADX = 22;
    const ROWS = 5;
    const GAP = 22;
    const baseY = 16 + ROWS * GAP;
    const H = baseY + 40;
    let W0 = 0;
    let sel = 0;
    let drag = -1;
    let dots = /** @type {any[]} */ ([]);
    let svg = /** @type {any} */ (null);
    let over = /** @type {any} */ (null);
    const pos = /** @type {{x:number,y:number}[]} */ ([]);
    const plot = A.el("div", "u2-plot");
    const selTxt = A.el("span", "u2-sel");
    const mkBtn = (/** @type {string} */ t) => A.el("button", "u2-btn", t, { type: "button" });
    const prev = mkBtn("◀◀");
    const next = mkBtn("▶▶");
    const left = mkBtn("◀");
    const right = mkBtn("▶");
    const pad = A.el("div", "u2-row is-mid");
    pad.append(prev, left, selTxt, right, next);
    parent.append(plot);
    if (!o.ro) parent.append(pad);
    const X = (/** @type {number} */ v) => PADX + ((v - lo) / (hi - lo)) * (W0 - 2 * PADX);
    const vAt = (/** @type {number} */ px) => lo + ((px - PADX) / (W0 - 2 * PADX)) * (hi - lo);
    const snap = (/** @type {number} */ v) =>
      Math.max(lo, Math.min(hi, lo + Math.round((v - lo) / step) * step));
    const setDot = (/** @type {number} */ i, /** @type {number} */ v) => {
      const nv = snap(v);
      if (Math.abs(nv - vals[i]) < EPS) return false;
      vals[i] = nv;
      return true;
    };
    const commit = (/** @type {number} */ i) => {
      paint();
      o.onChange?.(vals.slice(), i);
      api.say?.(
        L(`Dot ${i + 1} is at ${K.f(vals[i])}.`, `El punto ${i + 1} está en ${K.f(vals[i])}.`),
      );
    };
    const nudge = (/** @type {number} */ i, /** @type {number} */ v) => setDot(i, v) && commit(i);
    const key = (/** @type {number} */ i, /** @type {any} */ e) => {
      const to = /** @type {any} */ ({
        ArrowLeft: vals[i] - step,
        ArrowDown: vals[i] - step,
        ArrowRight: vals[i] + step,
        ArrowUp: vals[i] + step,
        Home: lo,
        End: hi,
        PageDown: vals[i] - 4 * step,
        PageUp: vals[i] + 4 * step,
      })[e.key];
      if (to === undefined) return;
      e.preventDefault();
      nudge(i, to);
    };
    const build = () => {
      W0 = Math.max(300, Math.round(plot.clientWidth || parent.clientWidth || 320));
      plot.textContent = "";
      svg = SV(
        "svg",
        { class: "u2-svg", viewBox: `0 0 ${W0} ${H}`, width: W0, height: H, role: "group" },
        plot,
      );
      svg.setAttribute("aria-label", o.label || L("Dot plot", "Diagrama de puntos"));
      SV("line", { class: "u2-axis", x1: 8, x2: W0 - 8, y1: baseY, y2: baseY }, svg);
      const every = o.tickEvery || Math.max(1, Math.ceil((26 / (X(lo + step) - X(lo))) * step));
      for (let v = lo; v <= hi + EPS; v += step) {
        const k = Math.round((v - lo) / step);
        if (k % Math.round(every / step) === 0 || v === hi) {
          SV("line", { class: "u2-axis", x1: X(v), x2: X(v), y1: baseY, y2: baseY + 6 }, svg);
          SV("text", { class: "u2-tick", x: X(v), y: baseY + 20 }, svg).textContent = K.f(v);
        }
      }
      over = SV("g", {}, svg);
      dots = vals.map((_v, i) => {
        const g = SV("g", { class: "u2-dot" }, svg);
        SV("circle", { class: "u2-ring", r: R + 5 }, g);
        SV("circle", { class: "u2-dotfill", r: R }, g);
        const live = !o.ro;
        g.setAttribute("role", live ? "slider" : "img");
        if (live) {
          g.setAttribute("aria-orientation", "horizontal");
          g.setAttribute("aria-valuemin", String(lo));
          g.setAttribute("aria-valuemax", String(hi));
          g.addEventListener("keydown", (e) => key(i, e));
          g.addEventListener("focus", () => {
            sel = i;
            paint();
          });
        }
        return g;
      });
      paint();
    };
    const pointer = (/** @type {any} */ e) => {
      const r = svg.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const nearest = (/** @type {{x:number,y:number}} */ p) => {
      let best = -1;
      let bd = 30;
      vals.forEach((_v, i) => {
        const d = Math.hypot(pos[i].x - p.x, pos[i].y - p.y);
        if (d < bd || (d === bd && best >= 0 && i === sel)) [best, bd] = [i, d];
      });
      return best;
    };
    if (!o.ro) {
      plot.addEventListener("pointerdown", (e) => {
        const p = pointer(e);
        const i = nearest(p);
        if (i >= 0) {
          sel = i;
          drag = i;
          dots[i].classList.add("is-drag");
          plot.setPointerCapture?.(e.pointerId);
          paint();
        } else if (p.y > baseY - 30) nudge(sel, vAt(p.x));
      });
      plot.addEventListener(
        "pointermove",
        (e) => drag >= 0 && setDot(drag, vAt(pointer(e).x)) && paint(),
      );
      const end = () => {
        if (drag < 0) return;
        const i = drag;
        drag = -1;
        dots[i].classList.remove("is-drag");
        commit(i);
      };
      plot.addEventListener("pointerup", end);
      plot.addEventListener("pointercancel", end);
      prev.addEventListener("click", () => {
        sel = (sel + n - 1) % n;
        paint();
        dots[sel].focus?.();
      });
      next.addEventListener("click", () => {
        sel = (sel + 1) % n;
        paint();
        dots[sel].focus?.();
      });
      left.addEventListener("click", () => nudge(sel, vals[sel] - step));
      right.addEventListener("click", () => nudge(sel, vals[sel] + step));
    }
    const paint = () => {
      const count = /** @type {any} */ ({});
      for (const v of vals) count[v] = (count[v] || 0) + 1;
      const gap = Math.min(GAP, (ROWS * GAP) / Math.max(ROWS, ...Object.values(count)));
      const level = /** @type {any} */ ({});
      vals.forEach((v, i) => {
        const k = (level[v] = (level[v] ?? -1) + 1);
        pos[i] = { x: X(v), y: baseY - R - 2 - k * gap };
        const g = dots[i];
        g.style.transform = `translate(${pos[i].x}px,${pos[i].y}px)`;
        g.classList.toggle("is-sel", i === sel && !o.ro);
        g.setAttribute("tabindex", !o.ro && i === sel ? "0" : "-1");
        const nm = o.nameOf ? o.nameOf(i) : L(`Dot ${i + 1} of ${n}`, `Punto ${i + 1} de ${n}`);
        g.setAttribute("aria-label", g.getAttribute("role") === "slider" ? nm : `${nm}, ${K.f(v)}`);
        g.setAttribute("aria-valuenow", String(v));
        g.setAttribute("aria-valuetext", K.f(v));
      });
      selTxt.textContent = L(
        `Dot ${sel + 1}: ${K.f(vals[sel])}`,
        `Punto ${sel + 1}: ${K.f(vals[sel])}`,
      );
      prev.setAttribute("aria-label", L("Previous dot", "Punto anterior"));
      next.setAttribute("aria-label", L("Next dot", "Punto siguiente"));
      left.setAttribute(
        "aria-label",
        L(`Move dot ${sel + 1} left`, `Mover el punto ${sel + 1} a la izquierda`),
      );
      right.setAttribute(
        "aria-label",
        L(`Move dot ${sel + 1} right`, `Mover el punto ${sel + 1} a la derecha`),
      );
      left.disabled = o.ro || vals[sel] <= lo + EPS;
      right.disabled = o.ro || vals[sel] >= hi - EPS;
      if (over) {
        over.textContent = "";
        o.overlay?.(over, X, SV, vals.slice(), { W0, H, baseY });
      }
    };
    build();
    if (typeof W.ResizeObserver === "function") {
      new W.ResizeObserver(() => {
        const w = Math.round(plot.clientWidth);
        if (w && Math.abs(w - W0) > 6 && parent.isConnected) build();
      }).observe(plot);
    }
    return {
      get: () => vals.slice(),
      set(/** @type {number[]} */ v) {
        v.forEach((x, i) => {
          vals[i] = x;
        });
        paint();
      },
      paint,
    };
  };

  /* ---- a row of bars the student raises and lowers ------------------------------------------------ */
  /**
   * o: { labels:string[], counts:number[], max, total?:number, ro, nameOf(i), onChange(counts, i), pick?:number, onFull(msg) }
   * With total, a bar cannot be raised past the students left to place. Pointer: press and drag inside a column.
   */
  K.barCols = (/** @type {any} */ parent, /** @type {any} */ o, /** @type {any} */ api) => {
    const L = (/** @type {string} */ en, /** @type {string} */ es) => (api.es?.() ? es : en);
    const counts = o.counts.slice();
    const wrap = A.el("div", "u2-bars");
    const refs = o.labels.map((lab, i) => {
      const cw = A.el("div", "u2-colwrap");
      const col = A.el("div", "u2-col", "", {
        role: o.ro ? "img" : "slider",
        tabindex: o.ro ? "-1" : "0",
      });
      const well = A.el("div", "u2-well");
      const bar = A.el("div", "u2-bar");
      const num = A.el("div", "u2-barn");
      well.append(bar, num);
      col.append(well);
      const label = A.el("div", "u2-lab", lab);
      cw.append(col, label);
      let minus = null;
      let plus = null;
      if (!o.ro) {
        const r = A.el("div", "u2-row is-mid");
        minus = A.el("button", "u2-btn", "−", { type: "button" });
        plus = A.el("button", "u2-btn", "+", { type: "button" });
        r.append(minus, plus);
        cw.append(r);
        col.setAttribute("aria-valuemin", "0");
        col.setAttribute("aria-valuemax", String(o.max));
      }
      wrap.append(cw);
      return { col, well, bar, num, minus, plus };
    });
    parent.append(wrap);
    const used = () => counts.reduce((a, b) => a + b, 0);
    const setCount = (/** @type {number} */ i, /** @type {number} */ want) => {
      let v = Math.max(0, Math.min(o.max, Math.round(want)));
      if (o.total != null && v > counts[i] && used() - counts[i] + v > o.total) {
        v = o.total - (used() - counts[i]);
        if (v <= counts[i]) {
          o.onFull?.();
          return false;
        }
      }
      if (v === counts[i]) return false;
      counts[i] = v;
      paint();
      o.onChange?.(counts.slice(), i);
      return true;
    };
    refs.forEach((r, i) => {
      if (o.ro) return;
      r.minus.addEventListener("click", () => setCount(i, counts[i] - 1));
      r.plus.addEventListener("click", () => setCount(i, counts[i] + 1));
      r.col.addEventListener("keydown", (/** @type {any} */ e) => {
        const to = /** @type {any} */ ({
          ArrowUp: counts[i] + 1,
          ArrowRight: counts[i] + 1,
          ArrowDown: counts[i] - 1,
          ArrowLeft: counts[i] - 1,
          Home: 0,
          End: o.max,
        })[e.key];
        if (to === undefined) return;
        e.preventDefault();
        setCount(i, to);
      });
      let down = false;
      const fromY = (/** @type {any} */ e) => {
        const b = r.well.getBoundingClientRect();
        if (!b.height) return;
        setCount(i, ((b.bottom - e.clientY) / b.height) * o.max);
      };
      r.col.addEventListener("pointerdown", (/** @type {any} */ e) => {
        down = true;
        r.col.setPointerCapture?.(e.pointerId);
        fromY(e);
      });
      r.col.addEventListener("pointermove", (/** @type {any} */ e) => down && fromY(e));
      const up = () => {
        down = false;
      };
      r.col.addEventListener("pointerup", up);
      r.col.addEventListener("pointercancel", up);
    });
    const paint = () => {
      refs.forEach((r, i) => {
        const pct = (counts[i] / o.max) * 100;
        r.bar.style.height = `${pct}%`;
        r.num.style.bottom = `calc(${pct}% + 2px)`;
        r.num.textContent = String(counts[i]);
        r.bar.classList.toggle("is-pick", o.pick === i);
        const nm = o.nameOf ? o.nameOf(i) : o.labels[i];
        r.col.setAttribute("aria-label", `${nm}: ${counts[i]}`);
        r.col.setAttribute("aria-valuenow", String(counts[i]));
        r.col.setAttribute(
          "aria-valuetext",
          L(`${counts[i]} students`, `${counts[i]} estudiantes`),
        );
        if (r.minus) {
          r.minus.setAttribute("aria-label", L(`Lower ${nm}`, `Bajar ${nm}`));
          r.plus.setAttribute("aria-label", L(`Raise ${nm}`, `Subir ${nm}`));
          r.minus.disabled = counts[i] <= 0;
          r.plus.disabled = counts[i] >= o.max;
        }
      });
    };
    paint();
    return {
      get: () => counts.slice(),
      set(/** @type {number[]} */ c) {
        c.forEach((x, i) => {
          counts[i] = x;
        });
        paint();
      },
      paint,
      used,
    };
  };
})();
