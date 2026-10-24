/**
 * Practice Studio activity kit (window.StudioAct.kit89): the chrome the Unit 8-9 activities share.
 * It registers no activity. A widget calls StudioAct.kit.start(host, spec, api, kind) and gets the language helpers,
 * a status line, a Check / Clear bar, the verdict hook and one stylesheet (prefix "ak-").
 *
 * Feedback contract (docs/audits/studio-v4/RULES.md): after a miss a widget draws no per-part tick or cross of its own.
 * The runtime hands back api.verdict = { level, right, of, marks } through api.onVerdict(fn); a widget draws marks only
 * when level is 2 and marks is an array (kit89.marks()).
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const K = (A.kit = A.kit || {});

  K.CSS = `
.ak{display:grid;gap:14px;max-width:660px;color:var(--ink,#1B2733)}
.ak-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
.ak-cap{font-weight:800;font-size:.92rem;color:var(--brand,#2C4A68);margin:0 0 4px}
.ak-text{margin:0;font-size:1rem;line-height:1.45}
.ak-box{border:2px solid var(--brand-line,#BBCADA);background:var(--brand-tint,#E5ECF3);border-radius:var(--radius-md,14px);padding:10px 14px;font-weight:700;line-height:1.4}
.ak-box small{display:block;font-weight:600;font-size:.88rem;margin-top:2px}
.ak-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.ak-card{border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);background:var(--surface,#fff);padding:10px 12px;display:grid;gap:8px}
.ak-card.active{border-color:var(--brand,#2C4A68)}
.ak-btn,.ak-chip,.ak-step{appearance:none;font:inherit;cursor:pointer;color:var(--brand,#2C4A68);background:var(--surface,#fff);border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;border-radius:var(--radius-md,14px);min-height:48px;min-width:48px;padding:6px 14px;font-weight:800;line-height:1.2;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.ak-chip{font-weight:700;color:var(--ink,#1B2733)}
.ak-step{font-size:1.4rem;padding:4px 10px}
.ak-btn[aria-pressed=true],.ak-chip[aria-pressed=true]{background:var(--brand,#2C4A68);color:var(--surface,#fff);border-color:var(--brand-dark,#1B2C3F)}
.ak-btn:hover:not([disabled]):not([aria-pressed=true]),.ak-chip:hover:not([disabled]):not([aria-pressed=true]),.ak-step:hover:not([disabled]){background:var(--brand-tint,#E5ECF3)}
.ak-btn.go,.ak-btn.go:hover:not([disabled]){background:var(--brand,#2C4A68);color:var(--surface,#fff);border-color:var(--brand-dark,#1B2C3F)}
.ak-btn[disabled],.ak-chip[disabled],.ak-step[disabled]{cursor:default}
.ak-btn.go[disabled]{opacity:.5;cursor:not-allowed}
.ak-btn .es-text,.ak-chip .es-text{color:inherit;font-size:.75em;margin:0;font-weight:600}
.ak-btn:focus-visible,.ak-chip:focus-visible,.ak-step:focus-visible,.ak-in:focus-visible,.ak-focus:focus-visible{outline:3px solid var(--ink,#1B2733);outline-offset:2px;box-shadow:0 0 0 7px var(--sun,#F0BD4F)}
.ak-in{font:inherit;font-weight:800;font-size:1.2rem;text-align:center;width:104px;min-height:48px;border:2px solid var(--brand,#2C4A68);border-radius:var(--radius-md,14px);background:var(--surface,#fff);color:var(--ink,#1B2733)}
.ak-note{margin:0;font-weight:700}
.ak-note:empty{display:none}
.ak-ok{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;border:2px solid var(--ok,#0A7D4B);color:color-mix(in srgb,var(--ok,#0A7D4B) 55%,var(--ink,#1B2733));background:color-mix(in srgb,var(--ok,#0A7D4B) 14%,var(--surface,#fff));font-weight:800}
.ak-mark-ok{border-color:var(--ok,#0A7D4B)}
.ak-mark-bad{border-color:var(--bad,#B42318)}
.ak-svg{background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);line-height:0;overflow:hidden;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.ak-svg svg{display:block;width:100%;height:auto}
.ak-ink{stroke:var(--ink,#1B2733);fill:none;stroke-width:2}
.ak-lab{fill:var(--ink,#1B2733);font:700 12px system-ui,sans-serif;paint-order:stroke;stroke:var(--surface,#fff);stroke-width:3px}
@media (forced-colors:active){.ak-btn,.ak-chip,.ak-step,.ak-in{border-color:ButtonText}.ak [aria-pressed=true]{outline:3px solid Highlight}.ak-ink{stroke:CanvasText}.ak-lab{fill:CanvasText}}
`;

  /** @param {any} host @param {any} spec @param {any} api @param {string} kind */
  K.start = (host, spec, api, kind) => {
    A.css("kit", K.CSS);
    const es = () => !!(api.es && api.es());
    const L = (/** @type {string} */ en, /** @type {string} */ esT) => (es() && esT ? esT : en);
    const T = (/** @type {string} */ en, /** @type {string} */ esT) => A.t(en, esT);
    const say = (/** @type {string} */ en, /** @type {string} */ esT) =>
      api.say && api.say(L(en, esT));
    const c = /** @type {any} */ ({ api, spec, es, L, T, say, kind });
    c.solved = !!api.solved;
    c.saved = api.restore || null;
    c.verdict = null;
    c.relabels = /** @type {Array<() => void>} */ ([]);
    c.redraws = /** @type {Array<() => void>} */ ([]);
    host.textContent = "";
    c.root = A.el("div", `ak ak-${kind}${c.solved ? " ak-solved" : ""}`);
    c.body = A.el("div", "", "", { style: "display:grid;gap:14px" });
    c.note = A.el("p", "ak-note", "", { role: "status" });
    c.bar = A.el("div", "ak-row");
    c.checkBtn = A.el("button", "ak-btn go", T("Check", "Comprobar"), { type: "button" });
    c.clearBtn = A.el("button", "ak-btn", T("Clear", "Borrar"), { type: "button" });
    c.badge = A.el("span", "ak-ok", `✓ ${T("Solved", "Resuelto")}`);
    c.bar.append(...(c.solved ? [c.badge] : [c.checkBtn, c.clearBtn]));
    c.root.append(c.body, ...(c.solved ? [] : [c.note]), c.bar);
    host.append(c.root);

    /** A control whose accessible name follows the language: label(el, en, es). */
    c.label = (/** @type {any} */ el, /** @type {string} */ en, /** @type {string} */ esT) => {
      const set = () => el.setAttribute("aria-label", L(en, esT));
      set();
      c.relabels.push(set);
      return el;
    };
    c.redraw = () => {
      for (const f of c.redraws) f();
    };
    /** per-part marks, only when the runtime says the student has earned them (verdict level 2) */
    c.marks = () => {
      const v = c.verdict;
      return v && v.level === 2 && Array.isArray(v.marks) ? v.marks : null;
    };
    if (typeof api.onVerdict === "function")
      api.onVerdict((/** @type {any} */ v) => {
        c.verdict = v || null;
        c.redraw();
      });
    /** Wire Check / Clear. get() returns the JSON-safe state; reset() restores the empty state. */
    c.wire = (/** @type {() => any} */ get, /** @type {() => void} */ reset) => {
      c.checkBtn.addEventListener("click", () => {
        if (c.solved) return;
        c.verdict = null;
        api.submit?.(JSON.parse(JSON.stringify(get())));
      });
      c.clearBtn.addEventListener("click", () => {
        if (c.solved) return;
        c.verdict = null;
        reset();
        c.note.textContent = "";
        c.redraw();
        say("Cleared", "Borrado");
      });
    };
    c.emit = (/** @type {any} */ s) => api.change?.(JSON.parse(JSON.stringify(s)));
    if (typeof MutationObserver !== "undefined") {
      const mo = new MutationObserver(() => {
        if (!c.root.isConnected) return mo.disconnect();
        for (const f of c.relabels) f();
        c.redraw();
      });
      mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }
    return c;
  };

  /** Number text with a true minus and no float noise. */
  K.n = (/** @type {number} */ v) => W.StudioGen.fmt(v, 4).replace("-", "−");
  /** Parse typed text ("4.5", "−3", " 7 ") to a number, or null. */
  K.parse = (/** @type {any} */ t) => {
    const s = String(t ?? "")
      .replace(/−/g, "-")
      .trim();
    return s === "" || s === "-" || s === "." || Number.isNaN(Number(s)) ? null : Number(s);
  };
  /** Split "English ¦ Español" into [en, es]. */
  K.bi = (/** @type {string} */ s) => s.split("¦").map((t) => t.trim());
  /** A miss result in the grade() shape. */
  K.miss = (/** @type {string} */ tag, /** @type {string} */ s, /** @type {any} */ parts = {}) => {
    const [say, sayEs] = K.bi(s);
    return { ok: false, tag, say, sayEs, ...parts };
  };
  /** { right, of, marks } from a list of per-part booleans. */
  K.parts = (/** @type {boolean[]} */ marks) => ({
    right: marks.filter(Boolean).length,
    of: marks.length,
    marks,
  });
  /** The package a make() returns for its text fields: q / x / h from "English ¦ Español" strings. */
  K.pack = (/** @type {any} */ o) => {
    const [q, qEs] = K.bi(o.q);
    const [x, xEs] = K.bi(o.x);
    const hh = o.h.map(K.bi);
    return { q, qEs, x, xEs, h: hh.map((t) => t[0]), hEs: hh.map((t) => t[1]) };
  };
})();
