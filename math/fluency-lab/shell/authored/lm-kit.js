// A small frame for K–5 living models. A model is ONE state object; the picture, the table and the equation are
// all drawn from it on every change, so they can never disagree. Controls are bounded steppers (− value +),
// pressed-state toggles and one-of-several choices — all real <button>s, so every control is keyboard operable and
// labelled. Nothing animates (reduced-motion safe), and every colour in a picture is paired with a label or shape.
import { L } from "./k5-kit.js";

let uid = 0;
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

/**
 * @param {object} spec
 * @param {{key:string,label:{en:string,es:string},min:number,max:number,step?:number,init:number,fmt?:(v:number)=>string}[]} [spec.steppers]
 * @param {{key:string,label:{en:string,es:string},init?:boolean}[]} [spec.toggles]
 * @param {{key:string,label:{en:string,es:string},init:string,options:{value:string,label:{en:string,es:string}}[]}[]} [spec.choices]
 * @param {(state:object)=>object} [spec.limit] keeps related values valid (e.g. "showing" never above "in all")
 * @param {(state:object, T:(v:{en:string,es:string})=>string, lang:string)=>{svg:string, eq:string, table?:string, note?:string}} spec.draw
 * @param {(state:object, changes:number)=>boolean} [spec.observed]
 */
export function model(spec) {
  return {
    mount(host, { lang, say }) {
      const id = `lm${(uid += 1)}`;
      const T = (v) => (lang() === "es" ? v.es : v.en);
      const steppers = spec.steppers || [];
      const toggles = spec.toggles || [];
      const choices = spec.choices || [];
      const initial = () => {
        const s = {};
        for (const c of steppers) s[c.key] = c.init;
        for (const t of toggles) s[t.key] = Boolean(t.init);
        for (const c of choices) s[c.key] = c.init;
        return spec.limit ? spec.limit(s) : s;
      };
      let state = initial();
      let changes = 0;
      const fmt = (c, v) => (c.fmt ? c.fmt(v, lang()) : String(v));
      const stepperHtml = (c) => `
        <div class="lm-stepper" role="group" aria-labelledby="${id}-${c.key}" style="display:inline-flex;align-items:center;gap:6px;flex-wrap:nowrap">
          <span id="${id}-${c.key}" style="font-weight:600">${esc(T(c.label))}</span>
          <button type="button" class="btn btn-quiet" data-k="${c.key}" data-d="-1" aria-label="${esc(T(c.label))}: ${esc(T(L("less", "menos")))}" style="min-width:44px;padding:8px 12px">−</button>
          <output data-v="${c.key}" aria-live="off" style="min-width:2.4em;text-align:center;font-weight:700;font-variant-numeric:tabular-nums"></output>
          <button type="button" class="btn btn-quiet" data-k="${c.key}" data-d="1" aria-label="${esc(T(c.label))}: ${esc(T(L("more", "más")))}" style="min-width:44px;padding:8px 12px">+</button>
        </div>`;
      const choiceHtml = (c) => `
        <div role="group" aria-label="${esc(T(c.label))}" style="display:inline-flex;gap:6px;flex-wrap:wrap;align-items:center">
          <span style="font-weight:600">${esc(T(c.label))}</span>
          ${c.options.map((o) => `<button type="button" class="btn btn-quiet" data-c="${c.key}" data-o="${esc(o.value)}" aria-pressed="false">${esc(T(o.label))}</button>`).join("")}
        </div>`;
      host.innerHTML = `
        <div class="lm" data-lm>
          <div class="lm-controls" role="group" aria-label="${esc(T(L("Change the model", "Cambia el modelo")))}">
            ${choices.map(choiceHtml).join("")}
            ${steppers.map(stepperHtml).join("")}
            ${toggles.map((t) => `<button type="button" class="btn btn-quiet" data-t="${t.key}" aria-pressed="false">${esc(T(t.label))}</button>`).join("")}
            <button type="button" class="btn btn-link" data-reset>${esc(T(L("Start over", "Empezar de nuevo")))}</button>
          </div>
          <figure class="lm-figure" data-fig style="margin:0;overflow:hidden"></figure>
          <div data-table style="overflow-x:auto"></div>
          <p class="lm-eq" data-eq aria-live="polite"></p>
          <p class="note" data-note></p>
        </div>`;
      const $ = (s) => host.querySelector(s);
      const draw = () => {
        const out = spec.draw(state, T, lang());
        $("[data-fig]").innerHTML = out.svg;
        $("[data-table]").innerHTML = out.table || "";
        $("[data-eq]").innerHTML = out.eq;
        $("[data-note]").textContent = out.note || "";
        $("[data-note]").hidden = !out.note;
        for (const c of steppers) {
          host.querySelector(`[data-v="${c.key}"]`).textContent = fmt(
            c,
            state[c.key],
          );
          const step = c.step || 1;
          host.querySelector(`[data-k="${c.key}"][data-d="-1"]`).disabled =
            state[c.key] - step < c.min;
          host.querySelector(`[data-k="${c.key}"][data-d="1"]`).disabled =
            state[c.key] + step > c.max;
        }
        for (const t of toggles)
          host
            .querySelector(`[data-t="${t.key}"]`)
            .setAttribute("aria-pressed", String(Boolean(state[t.key])));
        for (const c of choices)
          for (const b of host.querySelectorAll(`[data-c="${c.key}"]`))
            b.setAttribute(
              "aria-pressed",
              String(b.dataset.o === state[c.key]),
            );
        fitText();
        say(out.eq.replace(/<[^>]+>/g, ""));
      };
      // Labels never render below 14.5 CSS px, however narrow the screen: an SVG scales with its box, so each
      // label's size is raised by the inverse of the current scale (at full width nothing changes).
      const fitText = () => {
        for (const el of host.querySelectorAll("svg[viewBox]")) {
          const vb = el.viewBox?.baseVal;
          const shown = el.getBoundingClientRect().width;
          if (!vb?.width || !shown) continue;
          const scale = shown / vb.width;
          for (const t of el.querySelectorAll("text")) {
            const authored = Number(t.dataset.size || t.getAttribute("font-size"));
            t.dataset.size = String(authored);
            t.setAttribute("font-size", String(Math.max(authored, 14.5 / scale)));
          }
        }
      };
      if (typeof ResizeObserver === "function") new ResizeObserver(fitText).observe(host);
      host.addEventListener("click", (event) => {
        const b = event.target.closest("button");
        if (!b || b.disabled || !host.contains(b)) return;
        const next = { ...state };
        if (b.dataset.k) {
          const c = steppers.find((x) => x.key === b.dataset.k);
          const v = state[c.key] + Number(b.dataset.d) * (c.step || 1);
          if (v < c.min || v > c.max) return;
          next[c.key] = v;
        } else if (b.dataset.t) next[b.dataset.t] = !state[b.dataset.t];
        else if (b.dataset.c) next[b.dataset.c] = b.dataset.o;
        else if (b.hasAttribute("data-reset")) {
          state = initial();
          return draw();
        } else return;
        state = spec.limit ? spec.limit(next) : next;
        changes += 1;
        draw();
      });
      draw();
      return {
        observed: () =>
          spec.observed ? spec.observed(state, changes) : changes >= 2,
      };
    },
  };
}

// Small SVG helpers shared by the models -----------------------------------------------------------------------------
export const C = {
  a: "var(--q1)",
  b: "var(--q2)",
  c: "var(--q3)",
  ink: "var(--ink-2)",
  line: "var(--line-2)",
};
export const svg = (w, h, label, body, maxH = 220) =>
  `<svg viewBox="0 0 ${w} ${h}" class="lm-svg" role="img" aria-label="${esc(label)}" style="max-height:${maxH}px">${body}</svg>`;
export const text = (
  x,
  y,
  s,
  { size = 16, anchor = "middle", fill = "var(--ink)", weight = 600 } = {},
) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}" font-family="inherit"${fill === "#fff" ? "" : ' stroke="#fff" stroke-width="3" stroke-linejoin="round" paint-order="stroke"'}>${esc(s)}</text>`;
export const table = (caption, head, rows, onRow = -1) =>
  `<table class="lm-table" style="width:100%;max-width:440px;table-layout:fixed;font-size:0.88rem"><caption>${esc(caption)}</caption><thead><tr>${head.map((h) => `<th scope="col" style="padding:6px 4px">${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r, i) => `<tr${i === onRow ? ' class="lm-row-on"' : ""}>${r.map((c) => `<td style="padding:6px 4px">${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
export { esc };
