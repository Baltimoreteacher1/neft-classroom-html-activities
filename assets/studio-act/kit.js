/**
 * Practice Studio activity kit (StudioAct.kit): the shared widget plumbing for the v4 hands-on activities.
 * One mount() wires what every widget needs the same way: restore and read-only solved state, a bilingual Check button,
 * the feedback line, the verdict the runtime passes back after a miss (api.onVerdict), and a render() that is re-run after
 * each edit while keyboard focus returns to the control that was used (data-key).
 * Contract: docs/specs/practice-studio-v2.md section 5, plus the grade() shape { ok, tag?, say?, sayEs?, right?, of?, marks? }.
 * A widget never draws per-part marks on its own: marks come from ctx.verdict, and only at level 2.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const clone = (/** @type {any} */ o) => JSON.parse(JSON.stringify(o));

  const CSS = `
.k{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;max-width:680px;color:var(--ink,#1B2733)}
.k>*,.k-view>*{min-width:0}
.k-view{display:grid;gap:12px}
.k-box{background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:10px 12px;display:grid;gap:8px}
.k-lab{font-weight:800;display:block}
.k-lab .es-text,.k-btn .es-text,.k-note .es-text,.k-fb .es-text{margin:0;font-size:.85em;font-weight:600;color:inherit}
.k-note{margin:0;font-weight:600}
.k-big{font-size:1.5rem;font-weight:800;color:var(--brand,#2C4A68);font-variant-numeric:tabular-nums}
.k-chips{display:flex;flex-wrap:wrap;gap:8px}
.k-btn{appearance:none;font:inherit;font-weight:800;min-height:48px;min-width:48px;padding:6px 14px;border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;border-radius:var(--radius-md,14px);background:var(--surface,#fff);color:var(--brand,#2C4A68);cursor:pointer;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.2;text-align:center}
.k-btn:hover:not([disabled]){background:var(--brand-tint,#E5ECF3)}
.k-btn[aria-pressed=true]{background:var(--brand,#2C4A68);color:var(--surface,#fff);border-color:var(--ink,#1B2733)}
.k-btn.go{background:var(--brand,#2C4A68);color:var(--surface,#fff);border-color:var(--brand-dark,#1B2C3F)}
.k-btn[disabled]{opacity:.55;cursor:not-allowed}
.k-btn[hidden]{display:none}
.k-btn .es-text{font-size:.75em}
.k-btn:focus-visible,.k-in:focus-visible,.k-sel:focus-visible{outline:3px solid var(--ink,#1B2733);outline-offset:2px;box-shadow:0 0 0 7px var(--sun,#F0BD4F)}
.k-in,.k-sel{font:inherit;font-size:1.2rem;font-weight:800;text-align:center;min-height:48px;padding:4px 8px;border:3px solid var(--brand,#2C4A68);border-radius:var(--radius-md,14px);background:var(--surface,#fff);color:var(--ink,#1B2733)}
.k-in{width:4.2em}
.k-sel{text-align:left;max-width:100%}
.k-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.k-fr{display:inline-flex;flex-direction:column;align-items:center;gap:2px}
.k-fr hr{width:100%;margin:0;border:0;border-top:3px solid var(--ink,#1B2733)}
.k-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.k-fb{flex:1 1 220px;margin:0;padding:8px 12px 8px 44px;border-radius:var(--radius-md,14px);font-weight:700;position:relative;border:2px solid var(--bad,#B42318);background:color-mix(in srgb,var(--bad,#B42318) 12%,var(--surface,#fff))}
.k-fb::before{content:"!";position:absolute;left:10px;top:8px;width:26px;height:26px;border-radius:50%;background:var(--bad,#B42318);color:#fff;font-weight:800;text-align:center;line-height:26px}
.k-fb.ok{border-color:var(--ok,#0A7D4B);background:color-mix(in srgb,var(--ok,#0A7D4B) 14%,var(--surface,#fff))}
.k-fb.ok::before{content:"\\2713";background:var(--ok,#0A7D4B)}
.k-fb[hidden]{display:none}
.k-fb .k-cnt{display:block;font-weight:600;margin-top:2px}
.k-mk{font-weight:800;margin-left:6px}
.k-ok>.k-mk{color:var(--ok,#0A7D4B)}
.k-no>.k-mk{color:var(--bad,#B42318)}
.k-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.k-cell{display:inline-flex;align-items:center;justify-content:center;min-width:34px;min-height:34px;padding:2px 6px;border:2px solid var(--ink,#1B2733);border-radius:8px;background:var(--surface,#fff);font-weight:800;font-variant-numeric:tabular-nums}
.k-cell.on{background:color-mix(in srgb,var(--sun,#F0BD4F) 80%,var(--surface,#fff))}
.k-cell.hi{outline:3px dashed var(--bad,#B42318);outline-offset:2px}
@media (prefers-reduced-motion:no-preference){.k-fb{animation:k-pop .2s ease-out}@keyframes k-pop{from{transform:scale(.97);opacity:.3}to{transform:none;opacity:1}}}
@media (forced-colors:active){.k-btn,.k-box,.k-cell,.k-in,.k-sel{border-color:ButtonText}.k-btn[aria-pressed=true]{background:Highlight;color:HighlightText}.k-cell.on{background:Highlight;color:HighlightText}}
`;

  /**
   * @param {HTMLElement} host @param {any} spec @param {any} api
   * @param {{kind:string, def:any, css?:string, init:(base:any)=>any, render:(ctx:any)=>void, okEn?:string, okEs?:string, skip?:string[]}} o
   */
  function mount(host, spec, api, o) {
    A.css("kit", CSS);
    if (o.css) A.css(o.kind, o.css);
    const T = A.t;
    const es = () => !!(api.es && api.es());
    const L = (/** @type {string} */ en, /** @type {string} */ esT) => (es() && esT ? esT : en);
    const solved = !!api.solved;
    const base = solved ? o.def.solution(spec) : api.restore || {};
    const st = o.init(base);
    host.textContent = "";
    const root = A.el("div", `k k-${o.kind}`);
    const view = A.el("div", "k-view");
    const fb = A.el("p", "k-fb");
    fb.hidden = true;
    if (!api.say) fb.setAttribute("role", "status");
    const check = A.el("button", "k-btn go", T("Check", "Comprobar"), { type: "button" });
    const bar = A.el("div", "k-bar");
    bar.append(check, fb);
    root.append(view, bar);
    host.append(root);
    /** @type {any} */
    const ctx = { st, spec, T, L, es, el: A.el, fb, view, root, ended: solved, verdict: null };
    const lock = () => {
      for (const b of /** @type {any[]} */ ([...view.querySelectorAll("button,select")]))
        b.disabled = true;
      for (const i of /** @type {any[]} */ ([...view.querySelectorAll("input")])) i.readOnly = true;
    };
    ctx.update = (/** @type {string} */ focus) => {
      view.textContent = "";
      o.render(ctx);
      if (ctx.ended) lock();
      if (focus) {
        const t = /** @type {any} */ (view.querySelector(`[data-key="${focus}"]`));
        if (t && !t.disabled) t.focus();
      }
    };
    /** call after any edit: saves progress, hides the old feedback, redraws */
    ctx.change = (/** @type {string} */ focus) => {
      fb.hidden = true;
      ctx.verdict = null;
      ctx.last = null;
      if (api.change) api.change(clone(st));
      ctx.update(focus);
    };
    /** "right of of" at level 1 and per-part marks at level 2, from ctx.verdict only */
    ctx.mark = (/** @type {number} */ i) => {
      const v = ctx.verdict;
      if (!v || v.level < 2 || !Array.isArray(v.marks) || typeof v.marks[i] !== "boolean")
        return { cls: "", html: "" };
      return v.marks[i]
        ? {
            cls: " k-ok",
            html: `<span class="k-mk" aria-hidden="true">✓</span><span class="k-sr">${L("right", "bien")}</span>`,
          }
        : {
            cls: " k-no",
            html: `<span class="k-mk" aria-hidden="true">✗</span><span class="k-sr">${L("not yet", "todavía no")}</span>`,
          };
    };
    const count = () => {
      const v = ctx.verdict;
      return v && v.level >= 1 && Number.isFinite(v.right) && Number.isFinite(v.of)
        ? `<span class="k-cnt">${T(`${v.right} of ${v.of} parts are right.`, `${v.right} de ${v.of} partes están bien.`)}</span>`
        : "";
    };
    const show = (/** @type {any} */ r) => {
      fb.hidden = false;
      fb.className = `k-fb${r.ok ? " ok" : ""}`;
      fb.innerHTML = r.ok
        ? T(o.okEn || "You worked it out.", o.okEs || "Lo resolviste.")
        : T(r.say || "Not yet.", r.sayEs || "Todavía no.") + count();
      if (api.say)
        api.say(
          r.ok ? L("Correct", "Correcto") : L(r.say || "Not yet", r.sayEs || r.say || "Todavía no"),
        );
    };
    if (typeof api.onVerdict === "function")
      api.onVerdict((/** @type {any} */ v) => {
        ctx.verdict = v || null;
        ctx.update();
        if (!fb.hidden && !ctx.ended) {
          const c = fb.querySelector(".k-cnt");
          if (c) c.remove();
          fb.insertAdjacentHTML("beforeend", count());
        }
      });
    check.addEventListener("click", () => {
      if (ctx.ended) return;
      const local = o.def.grade(spec, clone(st));
      const skip = (o.skip || ["empty", "unset"]).includes(local.tag || "");
      if (!skip && api.submit) api.submit(clone(st));
      ctx.last = local;
      if (local.ok) {
        ctx.ended = true;
        check.hidden = true;
      }
      show(local);
      ctx.update();
    });
    ctx.update();
    if (solved) {
      check.hidden = true;
      show({ ok: true });
    }
    return ctx;
  }

  /** A button; en/es label, optional pressed state and data-key for focus return. */
  const btn = (
    /** @type {string} */ en,
    /** @type {string} */ esT,
    /** @type {() => void} */ on,
    /** @type {{pressed?:boolean, key?:string, label?:string, cls?:string}} */ o = {},
  ) => {
    /** @type {Record<string,string>} */
    const at = { type: "button" };
    if (o.pressed !== undefined) at["aria-pressed"] = String(o.pressed);
    if (o.key) at["data-key"] = o.key;
    if (o.label) at["aria-label"] = o.label;
    const b = A.el("button", `k-btn${o.cls ? ` ${o.cls}` : ""}`, A.t(en, esT), at);
    b.addEventListener("click", on);
    return b;
  };
  /** A labelled box: <div class="k-box"><span class="k-lab">title</span>…</div> */
  const box = (/** @type {string} */ en, /** @type {string} */ esT) => {
    const b = A.el("div", "k-box");
    if (en) b.append(A.el("span", "k-lab", A.t(en, esT)));
    return b;
  };
  /** A text input bound to a setter; numeric keypad on phones. */
  const field = (
    /** @type {string} */ value,
    /** @type {string} */ label,
    /** @type {(v:string)=>void} */ set,
    /** @type {{key?:string, mode?:string}} */ o = {},
  ) => {
    const i = /** @type {any} */ (
      A.el("input", "k-in", "", {
        type: "text",
        inputmode: o.mode || "numeric",
        autocomplete: "off",
        "aria-label": label,
        ...(o.key ? { "data-key": o.key } : {}),
      })
    );
    i.value = value;
    i.addEventListener("input", () => set(i.value));
    return i;
  };
  const gcd = (/** @type {number} */ a, /** @type {number} */ b) =>
    b ? gcd(b, a % b) : Math.abs(a);

  /** Format numbers consistently with generated problems. */
  const n = (/** @type {number} */ value) => W.StudioGen.fmt(value, 4).replace("-", "−");
  /** Split bilingual activity copy into the runtime's paired fields. */
  const pack = (/** @type {any} */ o) => {
    const pair = (value) =>
      String(value || "")
        .split("¦")
        .map((part) => part.trim());
    const [q, qEs] = pair(o.q);
    const [x, xEs] = pair(o.x);
    const hints = (o.h || []).map(pair);
    return {
      q,
      qEs,
      x,
      xEs,
      h: hints.map((part) => part[0]),
      hEs: hints.map((part) => part[1] || ""),
    };
  };
  const bi = (/** @type {string} */ value) =>
    String(value || "")
      .split("¦")
      .map((part) => part.trim());
  const parts = (/** @type {boolean[]} */ marks) => ({
    right: marks.filter(Boolean).length,
    of: marks.length,
    marks,
  });
  const miss = (/** @type {string} */ tag, /** @type {string} */ copy, extra = {}) => {
    const [say, sayEs] = bi(copy);
    return { ok: false, tag, say, sayEs, ...extra };
  };
  const parse = (value) => {
    const raw = String(value ?? "")
      .replace(/−/g, "-")
      .trim();
    return raw === "" || raw === "-" || raw === "." || Number.isNaN(Number(raw))
      ? null
      : Number(raw);
  };

  A.kit = { mount, btn, box, field, clone, gcd, n, pack, bi, parts, miss, parse };
})();
