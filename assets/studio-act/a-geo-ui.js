/**
 * Practice Studio activities: the shared widget kit for the Unit 5 geometry activities (slideapex, decompose, netfold, wrapit,
 * packcrate). Not an activity itself (it registers nothing); it loads before them because its file name sorts first.
 *
 *   StudioAct.ui.begin(kind, css, host, api)  -> { root, ro, es, L, T, status, say }
 *   StudioAct.ui.field(...)                   a labelled number box ("12", "3/4" or "1.5" all work)
 *   StudioAct.ui.stepper(...)                 a - / + pair with a live value (44px targets, keyboard and pointer)
 *   StudioAct.ui.checkRow(root, ro, api, st)  the Check button
 *   StudioAct.ui.num(text)                    the value of what a student typed, NaN when it is not a number
 *   StudioAct.ui.miss(tag, en, es, right, of, marks)  a grade() miss in the contract shape
 *
 * Styles use the studio tokens (--brand, --ink ...) so every world recolours them; every control has an accessible name; Spanish
 * lines show with api.es() or the page's show-es class; nothing is timed and nothing animates (reduced motion needs no rule).
 * Contract: docs/specs/practice-studio-v2.md section 5, docs/audits/studio-v4/RULES.md (grade() return shape).
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  if (!A) throw new Error("a-geo-ui.js needs assets/studio-act/core.js loaded first");

  // biome-ignore format: compact stylesheet
  const BASE_CSS = `
.sa-root{--sa-i:var(--ink,#1B2733);--sa-s:var(--surface,#fff);--sa-b:var(--brand,#2C4A68);--sa-bt:var(--brand-tint,#E5ECF3);--sa-bl:var(--brand-line,#BBCADA);--sa-sun:var(--sun,#F0BD4F);--sa-ok:var(--ok,#0A7D4B);--sa-bad:var(--bad,#B42318);--sa-bd:var(--border,#D5DCE5);--sa-dk:var(--brand-dark,#1B2C3F);--sa-r:var(--radius-md,14px);--sa-mute:#566475;--sa-sunt:#FAF2DC;color:var(--sa-i);max-width:640px;margin:0 auto;font-family:inherit}
@supports (color:color-mix(in srgb,red,blue)){.sa-root{--sa-mute:color-mix(in srgb,var(--sa-i) 72%,var(--sa-s));--sa-sunt:color-mix(in srgb,var(--sa-sun) 32%,var(--sa-s))}}
.sa-root *{box-sizing:border-box}
.sa-root [hidden]{display:none!important}
.sa-root :focus-visible{outline:3px solid var(--sa-i);outline-offset:1px;box-shadow:0 0 0 5px var(--sa-sun)}
.sa-es{display:none;font-size:.82em;font-weight:600;color:var(--sa-b);line-height:1.25}
body.show-es .sa-es,.sa-root[data-es="1"] .sa-es{display:block}
.sa-btn{appearance:none;font:inherit;font-weight:800;min-height:44px;min-width:44px;padding:8px 14px;border-radius:var(--sa-r);border:2px solid var(--sa-bl);border-bottom-width:4px;background:var(--sa-s);color:var(--sa-b);cursor:pointer;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15;text-align:center}
.sa-btn:hover:not([disabled]){background:var(--sa-bt);border-color:var(--sa-b)}
.sa-btn:active:not([disabled]){transform:translateY(2px);border-bottom-width:2px}
.sa-btn[disabled]{opacity:.5;cursor:not-allowed}
.sa-btn[aria-pressed="true"]{background:var(--sa-sunt);border-color:var(--sa-dk);box-shadow:inset 0 0 0 2px var(--sa-dk)}
.sa-btn.sa-go{background:var(--sa-b);color:var(--sa-s);border-color:var(--sa-dk)}
.sa-status{min-height:1.5em;margin:8px 0 0;font-weight:700;color:var(--sa-mute)}
.sa-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0}
.sa-card{padding:10px;border:2px solid var(--sa-bd);border-radius:var(--sa-r);background:var(--sa-s);margin:8px 0}
.sa-card h4{margin:0 0 6px;font-size:1rem}
.sa-fig{width:100%;height:auto;display:block;margin:6px 0;background:var(--sa-s);border:2px solid var(--sa-bd);border-radius:var(--sa-r)}
.sa-fig .g-line{stroke:var(--sa-dk);stroke-width:2;fill:none}
.sa-fig .g-fill{fill:var(--sa-bt);stroke:var(--sa-dk);stroke-width:2}
.sa-fig .g-fill2{fill:var(--sa-sunt);stroke:var(--sa-dk);stroke-width:2}
.sa-fig .g-dash{stroke:var(--sa-dk);stroke-width:2;stroke-dasharray:6 4;fill:none}
.sa-fig .g-ghost{fill:none;stroke:var(--sa-b);stroke-width:2;stroke-dasharray:2 4}
.sa-fig text{fill:var(--sa-i);font:700 14px system-ui,sans-serif;paint-order:stroke;stroke:var(--sa-s);stroke-width:3px;stroke-linejoin:round}
.sa-fld{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin:6px 0}
.sa-fld label{font-weight:800;min-width:9em}
.sa-fld input[type="text"]{font:inherit;font-weight:800;min-height:44px;width:7.5em;padding:6px 10px;border:2px solid var(--sa-bl);border-radius:10px;background:var(--sa-s);color:var(--sa-i)}
.sa-fld input[type="range"]{flex:1 1 220px;min-height:44px;accent-color:var(--sa-b)}
.sa-fld output{font-weight:900;min-width:3.5em;text-align:center}
.sa-step{display:flex;align-items:center;gap:8px;font-weight:800}
.sa-step output{min-width:2.4em;text-align:center;font-size:1.3rem;font-weight:900}
.sa-unit{font-weight:700;color:var(--sa-mute)}
@media (forced-colors:active){.sa-btn{border-color:ButtonText}.sa-fig .g-fill,.sa-fig .g-fill2,.sa-fig .g-line,.sa-fig .g-dash{stroke:CanvasText}.sa-fld input[type="text"]{border-color:ButtonText}}
`;

  /** The value of what a student typed: "12", "3/4", "1 1/2", "$3" or "1.5". NaN when it is not a number. */
  const num = (/** @type {any} */ t) => {
    const s = String(t ?? "").trim();
    return s ? W.StudioGen.value(s) : Number.NaN;
  };
  /** A grade() miss in the contract shape: which tag, what it says (never the answer), and how many parts were right. */
  const miss = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
    /** @type {number} */ right,
    /** @type {number} */ of,
    /** @type {boolean[]} */ marks,
  ) => ({ ok: false, tag, say, sayEs, right, of, marks });

  function begin(
    /** @type {string} */ kind,
    /** @type {string} */ css,
    /** @type {HTMLElement} */ host,
    /** @type {any} */ api,
  ) {
    A.css("geo-ui", BASE_CSS);
    A.css(kind, css);
    const es = !!(api.es && api.es());
    const L = (/** @type {string} */ en, /** @type {string} */ sp) => (es ? sp : en);
    const T = (/** @type {string} */ en, /** @type {string} */ sp) =>
      `${en}<span class="sa-es" lang="es">${sp}</span>`;
    const root = A.el("div", "sa-root");
    if (es) root.setAttribute("data-es", "1");
    host.replaceChildren(root);
    const status = A.el("p", "sa-status");
    status.setAttribute("aria-live", "polite");
    const say = (/** @type {string} */ en, /** @type {string} */ sp) => {
      status.innerHTML = T(en, sp);
      api.say?.(L(en, sp));
    };
    return { root, ro: !!api.solved, es, L, T, status, say };
  }

  /** A labelled text box for a number. onInput(value string) runs on every edit. */
  function field(
    /** @type {{ id: string, en: string, es: string, value: string, ro: boolean, T: Function, unit?: string, onInput: (v: string) => void }} */ o,
  ) {
    const wrap = A.el("div", "sa-fld");
    const label = A.el("label", "", o.T(o.en, o.es), { for: o.id });
    const input = /** @type {HTMLInputElement} */ (
      A.el("input", "", "", {
        type: "text",
        id: o.id,
        inputmode: "decimal",
        autocomplete: "off",
        "aria-label": `${o.en} / ${o.es}`,
      })
    );
    input.value = o.value || "";
    input.disabled = o.ro;
    input.addEventListener("input", () => o.onInput(input.value));
    wrap.append(label, input);
    if (o.unit) wrap.append(A.el("span", "sa-unit", o.unit));
    return { wrap, input };
  }

  /** A - / + pair around a live value. onChange(next) gets the new value; min and max clamp it. */
  function stepper(
    /** @type {{ en: string, es: string, L: Function, T: Function, value: number, min: number, max: number, step?: number, ro: boolean, fmt?: (v: number) => string, onChange: (v: number) => void }} */ o,
  ) {
    const wrap = A.el("div", "sa-step");
    const out = A.el("output", "", "", { "aria-live": "polite" });
    let v = o.value;
    const show = () => {
      out.textContent = o.fmt ? o.fmt(v) : String(v);
    };
    const mk = (/** @type {number} */ d, /** @type {string} */ sym) => {
      const b = /** @type {HTMLButtonElement} */ (
        A.el("button", "sa-btn", sym, {
          type: "button",
          "aria-label": `${d > 0 ? o.L("More", "Más") : o.L("Fewer", "Menos")}: ${o.L(o.en, o.es)}`,
        })
      );
      b.disabled = o.ro;
      b.addEventListener("click", () => {
        v = Math.max(o.min, Math.min(o.max, Math.round((v + d * (o.step || 1)) * 1e6) / 1e6));
        show();
        o.onChange(v);
      });
      return b;
    };
    wrap.append(A.el("span", "", o.T(o.en, o.es)), mk(-1, "−"), out, mk(1, "+"));
    show();
    return {
      wrap,
      set: (/** @type {number} */ x) => {
        v = x;
        show();
      },
    };
  }

  /** The Check button; hidden once the item is solved. */
  function checkRow(
    /** @type {HTMLElement} */ root,
    /** @type {boolean} */ ro,
    /** @type {any} */ api,
    /** @type {() => any} */ state,
    /** @type {Function} */ L,
    /** @type {Function} */ T,
  ) {
    if (ro) return;
    const chk = A.el("button", "sa-btn sa-go", T("Check", "Comprobar"), {
      type: "button",
      "aria-label": L("Check my answer", "Comprobar mi respuesta"),
    });
    chk.addEventListener("click", () => api.submit?.(state()));
    const row = A.el("div", "sa-row");
    row.append(chk);
    root.append(row);
  }

  A.ui = {
    BASE_CSS,
    begin,
    field,
    stepper,
    checkRow,
    num,
    miss,
    clone: (/** @type {any} */ o) => JSON.parse(JSON.stringify(o)),
  };
})();
