// Math Literacy Studio: the manipulative framework. A manipulative is DATA: controls (steppers, choices, toggles) -> state -> a Visuals spec
// (src/mls/visuals.js) plus a plain-language summary. This framework supplies what every manipulative must have:
//   - keyboard-operable controls (number steppers with + and - buttons and a typed field; no drag-only interaction),
//   - a Reset button, an instructional purpose line, a "what to notice" prompt, and
//   - a live text summary (aria-live) that states the actual values, so the picture is never the only way to read it.
import { renderVisual } from "./visuals.js";
import { h, clear, say } from "./ui-kit.js";

/**
 * defineManip({
 *   id, title, band: "1-2"|"3-5"|"6-8", purpose,                      // purpose: one sentence, what understanding it builds
 *   notice: ["What do you notice when ...?", ...],                    // prompts shown under the picture
 *   controls: [{ id, label, type: "stepper", min, max, step=1, value } | { id, label, type: "choice", options: [[value,label],..], value } | { id, label, type: "toggle", value }],
 *   model(state, opts) -> { spec?: VisualSpec, extra?: Node, summary: string, error?: string }   // pure; throws never; error text replaces the picture
 * })
 * -> { id, title, band, purpose, mount(el, opts) }
 */
export function defineManip(def) {
  return {
    id: def.id,
    title: def.title,
    band: def.band,
    purpose: def.purpose,
    mount(el, opts = {}) {
      clear(el);
      const init = () => Object.fromEntries(def.controls.map((c) => [c.id, typeof def.start === "function" ? (def.start(opts)[c.id] ?? c.value) : c.value]));
      let state = init();
      const fig = h("div", { class: "ml-man-fig", role: "group", "aria-label": `${def.title} picture` });
      const sum = h("p", { class: "ml-man-sum", "aria-live": "polite", "data-ml-summary": "" });
      const panel = h("div", { class: "ml-man-controls" });
      const draw = () => {
        let m;
        try {
          m = def.model(state, opts);
        } catch (e) {
          m = { error: String(e.message || e), summary: "" };
        }
        clear(fig);
        if (m.error) fig.append(h("p", { class: "ml-man-err", role: "alert" }, m.error));
        else if (m.spec) {
          const v = renderVisual(m.spec);
          const box = h("div", { class: "ml-man-svg" });
          box.innerHTML = v.svg; // our own generated SVG (escaped by visuals.js), never user text
          fig.append(box);
        }
        if (m.extra) fig.append(m.extra);
        sum.textContent = m.error ? "" : m.summary;
      };
      const set = (id, value) => {
        state = { ...state, [id]: value };
        draw();
        panel.querySelectorAll("[data-ctl]").forEach((n) => {
          const c = def.controls.find((x) => x.id === n.dataset.ctl);
          if (c.type === "toggle") n.checked = !!state[c.id];
          else if (n.value !== String(state[c.id])) n.value = String(state[c.id]);
        });
      };
      for (const c of def.controls) {
        const id = `man-${def.id}-${c.id}`;
        if (c.type === "stepper") {
          const step = c.step || 1;
          const clamp = (v) => Math.max(c.min, Math.min(c.max, v));
          const field = h("input", { id, type: "number", min: c.min, max: c.max, step, value: state[c.id], "data-ctl": c.id, onchange: (e) => set(c.id, clamp(Number(e.target.value) || c.min)) });
          panel.append(h("div", { class: "ml-man-row" }, h("label", { for: id }, c.label), h("button", { type: "button", class: "btn small", "aria-label": `Decrease ${c.label}`, onclick: () => set(c.id, clamp(+(Number(state[c.id]) - step).toFixed(6))) }, "−"), field, h("button", { type: "button", class: "btn small", "aria-label": `Increase ${c.label}`, onclick: () => set(c.id, clamp(+(Number(state[c.id]) + step).toFixed(6))) }, "+")));
        } else if (c.type === "choice") {
          panel.append(h("div", { class: "ml-man-row" }, h("label", { for: id }, c.label), h("select", { id, "data-ctl": c.id, onchange: (e) => set(c.id, e.target.value) }, c.options.map(([v, l]) => h("option", { value: v, selected: String(v) === String(state[c.id]) }, l)))));
        } else if (c.type === "toggle") {
          panel.append(h("div", { class: "ml-man-row" }, h("label", { for: id }, h("input", { id, type: "checkbox", "data-ctl": c.id, checked: !!state[c.id], onchange: (e) => set(c.id, e.target.checked) }), ` ${c.label}`)));
        }
      }
      panel.append(h("button", { type: "button", class: "btn", onclick: () => { state = init(); draw(); panel.querySelectorAll("[data-ctl]").forEach((n) => { const c = def.controls.find((x) => x.id === n.dataset.ctl); if (c.type === "toggle") n.checked = !!state[c.id]; else n.value = String(state[c.id]); }); say(el, "Reset to the start."); } }, "Reset"));
      el.append(h("div", { class: "ml-man" }, h("p", { class: "ml-man-purpose" }, def.purpose), h("div", { class: "ml-man-body" }, panel, h("div", { class: "ml-man-out" }, fig, sum)), def.notice?.length ? h("ul", { class: "ml-man-notice" }, def.notice.map((n) => h("li", {}, n))) : null));
      draw();
      return { destroy() { clear(el); }, get state() { return state; }, set };
    },
  };
}
