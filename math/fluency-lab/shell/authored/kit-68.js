// Shared helpers for the Grade 6–8 authored content: bilingual strings, answer parsing for misconception
// detectors, and one mount pattern for every living model. A living model is a bounded state (a few labelled
// sliders and buttons) and ONE render function that draws the picture, the table and the equation from that
// state, so the representations are recomputed together on every change and can never disagree.
export const L = (en, es) => ({ en, es });

// ---- numbers -------------------------------------------------------------------------------------------
export const clean = (v) =>
  String(v ?? "")
    .trim()
    .replaceAll("−", "-")
    .replaceAll("–", "-")
    .replace(/(\d),(?=\d{3}(?!\d))/g, "$1") // thousands separators only; "(3, 8)" keeps its comma
    .replace(/\s+/g, " ");
// A typed number, fraction, or mixed number ("-3/4", "2 1/2", "0.75") → value, or NaN.
export function num(raw) {
  const s = clean(raw).replace(/\s*\/\s*/g, "/");
  let m = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/);
  if (m) return (m[1] ? -1 : 1) * (Number(m[2]) + Number(m[3]) / Number(m[4]));
  m = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (m) return Number(m[2]) === 0 ? NaN : Number(m[1]) / Number(m[2]);
  if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return Number(s);
  return NaN;
}
export const same = (a, b) =>
  Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-6;
export const near = (a, b, tol = 0.011) =>
  Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;
// All signed numbers in a question, in order ("(-4, 6)" → [-4, 6]).
export const nums = (q) =>
  (clean(q).match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
export const key = (item) => num(item.answers?.[0]);
// "(a, b)" typed by a student → [a, b], or null.
export function point(raw) {
  const m = clean(raw).match(
    /^\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)?$/,
  );
  return m ? [Number(m[1]), Number(m[2])] : null;
}
export const samePoint = (p, x, y) =>
  Boolean(p) && same(p[0], x) && same(p[1], y);
// "ax + b" in any common spelling → { x, c }, or null. Accepts "3x + 2", "-6x+4", "x - 3", "15x", "7".
export function linear(raw) {
  const s = clean(raw).replace(/\s+/g, "").replace(/^\+/, "");
  if (!s || !/^[-+\dx.]+$/.test(s)) return null;
  const terms = s.match(/[+-]?[^+-]+/g);
  let x = 0;
  let c = 0;
  for (const t of terms) {
    if (t.endsWith("x")) {
      const coef = t.slice(0, -1);
      x += coef === "" || coef === "+" ? 1 : coef === "-" ? -1 : Number(coef);
    } else c += Number(t);
  }
  return Number.isFinite(x) && Number.isFinite(c) ? { x, c } : null;
}
export const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};
export const fmt = (n, places = 2) => {
  if (!Number.isFinite(n)) return "?";
  const r = Math.round(n * 10 ** places) / 10 ** places;
  return (r < 0 ? "−" : "") + String(Math.abs(r));
};
// An exact value with denominator dividing 8, as a mixed number in lowest terms: 3.75 → "3 3/4", 0.125 → "1/8".
export const eighths = (n) => {
  const e = Math.round(n * 8);
  const w = Math.trunc(e / 8);
  const r = Math.abs(e % 8);
  if (!r) return fmt(w);
  const g = gcd(r, 8);
  return `${n < 0 ? "−" : ""}${Math.abs(w) ? `${Math.abs(w)} ` : ""}${r / g}/${8 / g}`;
};
// Halves shown as mixed numbers: 2.5 → "2 1/2".
export const half = (n) => {
  const w = Math.floor(n);
  const f = n - w;
  if (Math.abs(f) < 1e-9) return String(w);
  if (Math.abs(f - 0.5) < 1e-9) return w ? `${w} 1/2` : "1/2";
  return fmt(n);
};

// ---- living models -------------------------------------------------------------------------------------
const escAttr = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
let uid = 0;
// spec: {
//   label: L(...)                                   — names the control group
//   sliders: [{ id, label: L, min, max, step, value, show?(v), when?(state) }]
//   toggles: [{ id, options: [{ value, label: L }], value }]   — a radio-like button row
//   buttons: [{ id, label: L, run(state) }]         — one-shot actions on the state
//   render(state, T) → { svg, table?, eq }          — the ONE function every representation comes from
//   observed?(state, initial) → bool                — what counts as having investigated
// }
export function livingModel(spec) {
  return {
    mount(host, { lang, say }) {
      const T = (v) =>
        v && typeof v === "object"
          ? lang() === "es"
            ? v.es
            : v.en
          : String(v ?? "");
      const state = {};
      for (const s of spec.sliders || []) state[s.id] = s.value;
      for (const t of spec.toggles || []) state[t.id] = t.value;
      const initial = { ...state };
      let touched = false;
      const n = (uid += 1);
      const sliderHtml = (s) =>
        `<label style="display:flex;flex-direction:column;gap:2px;min-width:min(100%,210px);flex:1 1 210px;max-width:320px;font-weight:600">
          <span>${escAttr(T(s.label))}: <output data-out="${s.id}" style="font-variant-numeric:tabular-nums;color:var(--navy)"></output></span>
          <input type="range" data-sl="${s.id}" id="lm${n}-${s.id}" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}" style="min-height:44px;width:100%;accent-color:var(--q3)"/>
        </label>`;
      const toggleHtml = (t) =>
        `<span role="group" aria-label="${escAttr(T(t.label || spec.label))}" style="display:flex;gap:6px;flex-wrap:wrap">${t.options
          .map(
            (o) =>
              `<button type="button" class="btn btn-quiet" data-tg="${t.id}" data-v="${escAttr(o.value)}" aria-pressed="false">${escAttr(T(o.label))}</button>`,
          )
          .join("")}</span>`;
      host.innerHTML = `
        <div class="lm" data-lm>
          <div class="lm-controls" role="group" aria-label="${escAttr(T(spec.label))}">
            ${(spec.toggles || []).map(toggleHtml).join("")}
            ${(spec.sliders || []).map(sliderHtml).join("")}
            ${(spec.buttons || []).map((b) => `<button type="button" class="btn btn-secondary" data-bt="${b.id}">${escAttr(T(b.label))}</button>`).join("")}
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:12px 24px;align-items:center;max-width:860px">
            <figure class="lm-figure" data-fig style="margin:0"></figure>
            <div data-tab style="max-width:420px"></div>
          </div>
          <p class="lm-eq" data-eq aria-live="polite" style="max-width:62ch;line-height:1.6"></p>
        </div>`;
      const q = (s) => host.querySelector(s);
      const draw = () => {
        // render() runs first: a model may clamp its own state (a count can never exceed its total).
        const out = spec.render(state, T);
        for (const s of spec.sliders || []) {
          const v = state[s.id];
          // A control that does nothing in the current mode is hidden rather than left to mislead.
          host.querySelector(`[data-sl="${s.id}"]`).closest("label").style.display = s.when && !s.when(state) ? "none" : "flex";
          host.querySelector(`[data-out="${s.id}"]`).textContent = s.show
            ? s.show(v, T)
            : fmt(v);
          host.querySelector(`[data-sl="${s.id}"]`).value = String(v);
          host
            .querySelector(`[data-sl="${s.id}"]`)
            .setAttribute("aria-valuetext", s.show ? s.show(v, T) : fmt(v));
        }
        for (const b of host.querySelectorAll("[data-tg]"))
          b.setAttribute(
            "aria-pressed",
            String(String(state[b.dataset.tg]) === b.dataset.v),
          );
        q("[data-fig]").innerHTML = out.svg || "";
        q("[data-tab]").innerHTML = out.table || "";
        q("[data-tab]").hidden = !out.table;
        q("[data-eq]").innerHTML = mathHtml(out.eq);
        say(plainMath(out.eq));
      };
      host.addEventListener("input", (event) => {
        const id = event.target.dataset?.sl;
        if (!id) return;
        state[id] = Number(event.target.value);
        touched = true;
        draw();
      });
      host.addEventListener("click", (event) => {
        const tg = event.target.closest("[data-tg]");
        const bt = event.target.closest("[data-bt]");
        if (tg) {
          const t = spec.toggles.find((x) => x.id === tg.dataset.tg);
          const opt = t.options.find((o) => String(o.value) === tg.dataset.v);
          state[t.id] = opt.value;
        } else if (bt)
          spec.buttons.find((b) => b.id === bt.dataset.bt).run(state);
        else return;
        touched = true;
        draw();
      });
      draw();
      return {
        observed: () =>
          spec.observed ? spec.observed(state, initial) : touched,
        // For tests and the teacher view: the current state and what the model shows for it.
        state: () => ({ ...state }),
        shown: () => ({
          eq: q("[data-eq]").textContent,
          table: q("[data-tab]").textContent,
        }),
      };
    },
  };
}

// A small table from rows of cells; the first row is the header.
export function table(caption, rows, onRow = -1) {
  const [head, ...body] = rows;
  return `<table class="lm-table"><caption>${caption}</caption><thead><tr>${head
    .map((h) => `<th scope="col">${h}</th>`)
    .join("")}</tr></thead><tbody>${body
    .map(
      (r, i) =>
        `<tr${i === onRow ? ' class="lm-row-on"' : ""}>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`,
    )
    .join("")}</tbody></table>`;
}
// Pictures keep one size relationship everywhere: they never shrink labels below 14px on a 320px screen (labels
// are 18 units in a viewBox at most ~330 wide) and never grow past 1.15× on a desktop.
export const svg = (w, h, label, body) =>
  `<svg viewBox="0 0 ${w} ${h}" class="lm-svg" role="img" aria-label="${escAttr(label)}" style="max-width:${Math.round(w * 1.15)}px;max-height:none;display:block;margin:0 auto">${body}</svg>`;
// Equation text: "[[a/b]]" is set as a stacked fraction (with a hidden slash, so it is read and copied as a/b).
const VISUALLY_HIDDEN = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
export function mathHtml(s) {
  return escAttr(s).replace(
    /\[\[([^\]/]+)\/([^\]]+)\]\]/g,
    (_, a, b) =>
      `<span style="display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;line-height:1.1;font-size:.85em;margin:0 .12em"><span style="border-bottom:2px solid currentColor;padding:0 .2em">${a}</span><span style="${VISUALLY_HIDDEN}">/</span><span style="padding:0 .2em">${b}</span></span>`,
  );
}
export const plainMath = (s) => String(s).replace(/\[\[([^\]/]+)\/([^\]]+)\]\]/g, "$1/$2");
// Labels are 18 units (16 for secondary marks, passed as font-size="12"); set inline because the shell's .lm-num
// rule would otherwise override an SVG font-size attribute.
export const text = (x, y, s, extra = "") => {
  const small = /font-size="1[0-3]"/.test(extra);
  const anchor = extra.match(/text-anchor="(start|middle|end)"/)?.[1] || "middle";
  const rest = extra.replace(/font-size="\d+"/, "").replace(/text-anchor="\w+"/, "");
  const cls = rest.includes("class=") ? "" : 'class="lm-num"';
  return `<text x="${x}" y="${y}" ${cls} ${rest} style="font-size:${small ? 16 : 18}px;text-anchor:${anchor}">${escAttr(s)}</text>`;
};
