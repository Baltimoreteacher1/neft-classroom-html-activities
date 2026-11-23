// concept-builder kind: timeline-sort. One row per event; place each event on a shared time axis (tap Place, then drag or use arrow keys).
import { h } from "../../core/dom.js";
import { clone, draggable, sliderKey } from "./shared.js";

const ordered = (m, s) =>
  m.events
    .map((e, i) => ({ id: e.id, i, at: s.at[e.id] }))
    .filter((e) => e.at != null)
    .sort((a, b) => a.at - b.at || a.i - b.i);

export default {
  id: "timeline-sort",

  validateModel(m) {
    const out = [];
    const [lo, hi] = m.span || [];
    if (!Number.isInteger(lo) || !Number.isInteger(hi) || lo >= hi) return ["model.span must be [min, max] integers with min < max"];
    if (!Number.isInteger(m.axisStep) || m.axisStep < 1 || (hi - lo) % m.axisStep !== 0 || (hi - lo) / m.axisStep > 120) out.push("axisStep must be an integer that divides the span into at most 120 steps");
    const ev = m.events || [];
    if (ev.length < 3 || ev.length > 10) out.push("model.events needs 3..10 events");
    const seen = new Set();
    for (const e of ev) {
      if (!e.id || !e.label) out.push("each event needs id and label");
      if (seen.has(e.id)) out.push(`duplicate event id ${e.id}`);
      seen.add(e.id);
      if (!Number.isInteger(e.at) || e.at < lo || e.at > hi) out.push(`event ${e.id}: at must be an integer inside the span`);
    }
    return out;
  },

  initialState: (m) => ({ at: Object.fromEntries(m.events.map((e) => [e.id, null])) }),

  validateState(m, s) {
    const [lo, hi] = m.span;
    return m.events.flatMap((e) => {
      const v = s?.at?.[e.id];
      return v === null || (Number.isInteger(v) && v >= lo && v <= hi && (v - lo) % m.axisStep === 0) ? [] : [`state.at.${e.id} must be null or on the axis grid`];
    });
  },

  value(m, s) {
    const placed = ordered(m, s);
    const ats = placed.map((p) => p.at);
    return {
      at: Object.fromEntries(m.events.map((e) => [e.id, s.at[e.id] == null ? "unplaced" : String(s.at[e.id])])),
      order: placed.map((p) => p.id),
      placed: String(placed.length),
      unplaced: String(m.events.length - placed.length),
      ties: String(ats.filter((a, i) => i > 0 && a === ats[i - 1]).length),
    };
  },

  describe(m, s) {
    const o = ordered(m, s);
    return o.length ? `${o.length} placed, earliest first: ${o.map((p) => `${m.events.find((e) => e.id === p.id).label} (${p.at})`).join(", ")}` : "nothing placed yet";
  },

  mount(host, { model, state, onChange, announce }) {
    const [lo, hi] = model.span;
    const unit = model.unit || "year";
    const N = (hi - lo) / model.axisStep;
    let st = clone(state);
    let revealed = false;
    const pct = (v) => ((v - lo) / (hi - lo)) * 100;
    const root = h("div", { class: "st-cb-tl", style: `--st-cb-ticks:${N}` });
    host.replaceChildren(root, h("p", { class: "st-cb-quiet-text" }, "Press Place to put an event on the line. Then drag it, or use the arrow keys (PageUp and PageDown move ten steps)."));
    const live = h("p", { class: "st-cb-readout", role: "status" });
    host.append(live);

    const setAt = (e, v, spoken) => {
      v = Math.max(lo, Math.min(hi, lo + Math.round((v - lo) / model.axisStep) * model.axisStep));
      if (st.at[e.id] === v) return;
      st.at[e.id] = v;
      sync();
      onChange(clone(st));
      if (spoken) announce(`${e.label} at ${unit} ${v}. ${ordered(model, st).map((p) => model.events.find((x) => x.id === p.id).label).join(", then ")}.`);
    };

    function build() {
      const axis = h("div", { class: "st-cb-tl-axis", "aria-hidden": "true" });
      const labelEvery = Math.max(1, Math.ceil(N / 6));
      for (let i = 0; i <= N; i += labelEvery) axis.append(h("span", { style: `left:${pct(lo + i * model.axisStep)}%` }, String(lo + i * model.axisStep)));
      const rows = model.events.map((e) => {
        const label = h("div", { class: "st-cb-tl-label" }, h("strong", {}, e.label), e.detail ? h("span", {}, e.detail) : null, h("span", { class: "st-cb-tl-date", "data-date": e.id }));
        const track = h("div", { class: "st-cb-tl-track", "data-track": e.id });
        const place = h("button", { type: "button", class: "st-cb-btn st-cb-tl-place", "aria-label": `Place ${e.label} on the line`, onclick: () => { st.at[e.id] = lo + Math.round(N / 2) * model.axisStep; sync(); onChange(clone(st)); announce(`${e.label} placed at ${unit} ${st.at[e.id]}. Use the arrow keys to move it.`); root.querySelector(`[data-thumb="${e.id}"]`)?.focus(); } }, "Place");
        const thumb = h("div", { class: "st-cb-tl-thumb", tabindex: "0", role: "slider", "data-thumb": e.id, "aria-label": e.label, "aria-valuemin": String(lo), "aria-valuemax": String(hi) }, h("span", { class: "st-cb-tl-year" }));
        draggable(thumb, {
          onStart: () => thumb.focus(),
          onMove: (ev) => {
            const r = track.getBoundingClientRect();
            setAt(e, lo + ((ev.clientX - r.left) / r.width) * (hi - lo), false);
          },
          onEnd: () => announce(`${e.label} at ${unit} ${st.at[e.id]}.`),
        });
        thumb.addEventListener("keydown", (ev) => {
          const k = sliderKey(ev, 10);
          if (k == null) return;
          ev.preventDefault();
          const cur = st.at[e.id];
          if (ev.key === "Delete" || ev.key === "Backspace") return;
          setAt(e, k === "home" ? lo : k === "end" ? hi : cur + k * model.axisStep, true);
        });
        thumb.addEventListener("keydown", (ev) => {
          if (ev.key !== "Delete" && ev.key !== "Backspace") return;
          ev.preventDefault();
          st.at[e.id] = null;
          sync();
          onChange(clone(st));
          announce(`${e.label} taken off the line.`);
          root.querySelector(`[data-track="${e.id}"] .st-cb-tl-place`)?.focus();
        });
        track.append(place, thumb);
        return h("div", { class: "st-cb-tl-row" }, label, track);
      });
      root.replaceChildren(h("div", { class: "st-cb-tl-head" }, h("span", {}, "Event"), axis), ...rows);
    }

    function sync() {
      const placed = ordered(model, st);
      const wasFocused = document.activeElement?.dataset?.thumb;
      for (const e of model.events) {
        const track = root.querySelector(`[data-track="${e.id}"]`);
        const thumb = track.querySelector(".st-cb-tl-thumb");
        const place = track.querySelector(".st-cb-tl-place");
        const v = st.at[e.id];
        thumb.hidden = v == null;
        place.hidden = v != null;
        if (v != null) {
          thumb.style.left = `${pct(v)}%`;
          thumb.querySelector(".st-cb-tl-year").textContent = String(v);
          thumb.setAttribute("aria-valuenow", String(v));
          thumb.setAttribute("aria-valuetext", `${e.label}, ${unit} ${v}, number ${placed.findIndex((p) => p.id === e.id) + 1} of ${placed.length}`);
        }
        const d = root.querySelector(`[data-date="${e.id}"]`);
        d.textContent = revealed ? `It happened in ${e.at}.` : "";
      }
      live.textContent = `${placed.length} of ${model.events.length} events placed.`;
      if (wasFocused) root.querySelector(`[data-thumb="${wasFocused}"]`)?.focus();
    }
    build();
    sync();
    return {
      setState(s) {
        st = clone(s);
        sync();
      },
      reveal(on = true) {
        revealed = on;
        sync();
      },
    };
  },
};
