// concept-builder kind: scale-sort. Arrange items along a continuum (for example shades of meaning or intensity).
import { h } from "../../core/dom.js";
import { btn, clone, draggable } from "./shared.js";

export default {
  id: "scale-sort",

  validateModel(m) {
    const out = [];
    if (!m.axis?.label || !m.axis?.low || !m.axis?.high) out.push("model.axis needs label, low and high");
    const items = m.items || [];
    if (items.length < 3 || items.length > 8) out.push("model.items needs 3..8 items");
    const seen = new Set();
    for (const i of items) {
      if (!i.id || !i.text) out.push("each item needs id and text");
      if (seen.has(i.id)) out.push(`duplicate item id ${i.id}`);
      seen.add(i.id);
    }
    return out;
  },

  initialState: (m) => ({ order: m.items.map((i) => i.id) }),

  validateState(m, s) {
    const ids = m.items.map((i) => i.id).sort().join("|");
    return Array.isArray(s?.order) && [...s.order].sort().join("|") === ids ? [] : ["state.order must contain every item once"];
  },

  value(m, s) {
    return { order: [...s.order], pos: Object.fromEntries(s.order.map((id, i) => [id, String(i + 1)])), first: s.order[0], last: s.order[s.order.length - 1] };
  },

  describe: (m, s) => `${m.axis.low} to ${m.axis.high}: ${s.order.map((id) => m.items.find((i) => i.id === id).text).join(", ")}`,

  mount(host, { model, state, onChange, announce }) {
    let st = clone(state);
    const text = (id) => model.items.find((i) => i.id === id).text;
    const list = h("ol", { class: "st-cb-ss-list" });
    host.replaceChildren(
      h("div", { class: "st-cb-ss" }, h("div", { class: "st-cb-ss-rail", "aria-hidden": "true" }, h("span", {}, model.axis.low), h("span", {}, model.axis.high)), list),
      h("p", { class: "st-cb-quiet-text" }, `${model.axis.label}: ${model.axis.low} at the top, ${model.axis.high} at the bottom. Use the arrow buttons or drag the grip.`),
    );
    const move = (from, to, spoken = true) => {
      to = Math.max(0, Math.min(st.order.length - 1, to));
      if (from === to) return;
      const [id] = st.order.splice(from, 1);
      st.order.splice(to, 0, id);
      onChange(clone(st));
      draw(id, to < from ? "up" : "down");
      if (spoken) announce(`${text(id)} moved to position ${to + 1} of ${st.order.length}.`);
    };
    function draw(focusId, focusDir) {
      list.replaceChildren(
        ...st.order.map((id, i) => {
          const it = model.items.find((x) => x.id === id);
          const up = btn("Earlier", () => move(i, i - 1), { cls: "st-cb-small", attrs: { "aria-label": `Move ${it.text} toward ${model.axis.low}, now position ${i + 1} of ${st.order.length}`, disabled: i === 0 ? true : false, "data-dir": "up" } });
          const down = btn("Later", () => move(i, i + 1), { cls: "st-cb-small", attrs: { "aria-label": `Move ${it.text} toward ${model.axis.high}, now position ${i + 1} of ${st.order.length}`, disabled: i === st.order.length - 1 ? true : false, "data-dir": "down" } });
          const grip = h("span", { class: "st-cb-grip", "aria-hidden": "true" }, "::");
          const li = h("li", { class: "st-cb-ss-item", "data-id": id }, grip, h("span", { class: "st-cb-ss-no" }, String(i + 1)), h("span", { class: "st-cb-ss-text" }, h("strong", {}, it.text), it.gloss ? h("small", {}, it.gloss) : null), h("span", { class: "st-cb-ss-btns" }, up, down));
          let startY = 0;
          draggable(grip, {
            onStart: (ev) => { startY = ev.clientY; li.classList.add("is-drag"); },
            onMove: (ev) => { li.style.transform = `translateY(${ev.clientY - startY}px)`; },
            onEnd: (ev) => {
              li.classList.remove("is-drag");
              li.style.transform = "";
              const others = [...list.children].filter((n) => n !== li);
              const to = others.filter((n) => n.getBoundingClientRect().top + n.getBoundingClientRect().height / 2 < ev.clientY).length;
              move(i, to);
            },
          });
          return li;
        }),
      );
      if (focusId) {
        const li = list.querySelector(`[data-id="${focusId}"]`);
        const pick = li?.querySelector(`[data-dir="${focusDir || "up"}"]:not(:disabled)`) || li?.querySelector("button:not(:disabled)");
        pick?.focus();
      }
    }
    draw();
    return {
      setState(s) {
        st = clone(s);
        draw();
      },
    };
  },
};
