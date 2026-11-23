// concept-builder kind: map-hotspots. Choose regions on a schematic map visual; the explain step justifies the choice.
import { h } from "../../core/dom.js";
import { visualSize, visualStage } from "./hotspots.js";
import { clone } from "./shared.js";

export default {
  id: "map-hotspots",

  validateModel(m) {
    const out = [];
    const v = m.visual;
    if (!v || typeof v.kind !== "string" || typeof v.alt !== "string" || v.alt.length < 8) out.push("model.visual needs kind and a meaningful alt");
    const { w, h: ht } = visualSize(v);
    const regions = m.regions || [];
    if (regions.length < 2 || regions.length > 12) out.push("model.regions needs 2..12 regions");
    const seen = new Set();
    for (const r of regions) {
      if (!r.id || !r.label) out.push("each region needs id and label");
      if (seen.has(r.id)) out.push(`duplicate region id ${r.id}`);
      seen.add(r.id);
      const [x, y, rw, rh] = r.rect || [];
      if (![x, y, rw, rh].every(Number.isFinite) || rw <= 0 || rh <= 0 || x < 0 || y < 0 || x + rw > w + 0.001 || y + rh > ht + 0.001) out.push(`region ${r.id}: rect must be [x,y,w,h] inside ${w} x ${ht}`);
    }
    return out;
  },

  initialState: () => ({ selected: [] }),

  validateState(m, s) {
    return (s?.selected || []).filter((id) => !m.regions.some((r) => r.id === id)).map((id) => `state.selected has unknown region ${id}`);
  },

  value(m, s) {
    const selected = m.regions.filter((r) => s.selected.includes(r.id)).map((r) => r.id);
    return { selected, count: String(selected.length) };
  },

  describe: (m, s) => `${s.selected.length} region${s.selected.length === 1 ? "" : "s"} chosen: ${m.regions.filter((r) => s.selected.includes(r.id)).map((r) => r.label).join(", ") || "none"}`,

  async mount(host, { model, state, onChange, announce }) {
    let st = clone(state);
    const stage = await visualStage(model.visual, "st-cb-map");
    const status = h("p", { class: "st-cb-readout", role: "status" });
    host.replaceChildren(stage.el, status);
    // The picture may already print a region's name (visual.regions[].label). Printing it again on the hotspot draws two
    // overlapping labels, so the hotspot keeps only its accessible name. `showLabels:false` hides them for every region.
    const drawn = new Set((model.visual?.regions || []).map((vr) => vr.label?.trim().toLowerCase()).filter(Boolean));
    const showLabel = (r) => model.showLabels !== false && !drawn.has(r.label.trim().toLowerCase());
    function draw() {
      stage.overlay.replaceChildren(
        ...model.regions.map((r) => {
          const on = st.selected.includes(r.id);
          const b = h(
            "button",
            {
              type: "button",
              class: `st-cb-region${on ? " is-on" : ""}`,
              "aria-pressed": String(on),
              "aria-label": r.label,
              "data-region": r.id,
              onclick: () => {
                if (model.multi === false) st.selected = on ? [] : [r.id];
                else st.selected = on ? st.selected.filter((x) => x !== r.id) : [...st.selected, r.id];
                announce(`${r.label} ${on ? "removed" : "chosen"}. ${st.selected.length} chosen.`);
                onChange(clone(st));
                draw();
                stage.overlay.querySelector(`[data-region="${r.id}"]`)?.focus();
              },
            },
            showLabel(r) ? h("span", { class: "st-cb-region-text" }, r.label) : null,
            on ? h("span", { class: "st-cb-region-mark" }, "chosen") : null,
          );
          const [x, y, rw, rh] = r.rect;
          b.style.left = `${(x / stage.w) * 100}%`;
          b.style.top = `${(y / stage.h) * 100}%`;
          b.style.width = `${(rw / stage.w) * 100}%`;
          b.style.height = `${(rh / stage.h) * 100}%`;
          return b;
        }),
      );
      status.textContent = `${st.selected.length} region${st.selected.length === 1 ? "" : "s"} chosen.`;
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
