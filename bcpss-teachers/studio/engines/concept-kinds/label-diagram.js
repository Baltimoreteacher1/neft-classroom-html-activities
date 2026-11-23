// concept-builder kind: label-diagram. Place labels on hotspots of a visual (tap, keyboard or drag).
import { h } from "../../core/dom.js";
import { loadVisuals, dragToDrop, visualSize, visualStage } from "./hotspots.js";
import { clone } from "./shared.js";

export default {
  id: "label-diagram",

  validateModel(m) {
    const out = [];
    const v = m.visual;
    if (!v || typeof v.kind !== "string" || typeof v.alt !== "string" || v.alt.length < 8) out.push("model.visual needs kind and a meaningful alt");
    const { w, h: ht } = visualSize(v);
    const labels = m.labels || [];
    const spots = m.hotspots || [];
    if (labels.length < 2) out.push("model.labels needs at least 2 labels");
    if (spots.length < 2 || spots.length > 10) out.push("model.hotspots needs 2..10 hotspots");
    const lid = new Set();
    for (const l of labels) {
      if (!l.id || !l.text) out.push("each label needs id and text");
      if (lid.has(l.id)) out.push(`duplicate label id ${l.id}`);
      lid.add(l.id);
    }
    const hid = new Set();
    const answers = new Map();
    for (const s of spots) {
      if (!s.id) out.push("each hotspot needs an id");
      if (hid.has(s.id)) out.push(`duplicate hotspot id ${s.id}`);
      hid.add(s.id);
      if (!(s.x >= 0 && s.x <= w && s.y >= 0 && s.y <= ht)) out.push(`hotspot ${s.id} is outside the visual (${w} x ${ht})`);
      if (!lid.has(s.answer)) out.push(`hotspot ${s.id}: answer ${s.answer} is not a label`);
      if (answers.has(s.answer)) out.push(`labels ${s.answer} is the answer of two hotspots`);
      answers.set(s.answer, s.id);
      const text = labels.find((l) => l.id === s.answer)?.text?.toLowerCase();
      if (s.name && text && s.name.toLowerCase().includes(text)) out.push(`hotspot ${s.id}: name gives away the label`);
    }
    for (const l of labels) if (!answers.has(l.id) && !l.distractor) out.push(`label ${l.id} is not any hotspot's answer; mark it distractor:true`);
    for (const l of labels) if (answers.has(l.id) && l.distractor) out.push(`label ${l.id} is marked distractor but is an answer`);
    return out;
  },

  initialState: () => ({ placed: {} }),

  validateState(m, s) {
    const out = [];
    const used = new Set();
    for (const [hid, lid] of Object.entries(s?.placed || {})) {
      if (!m.hotspots.some((x) => x.id === hid)) out.push(`state.placed has unknown hotspot ${hid}`);
      if (!m.labels.some((x) => x.id === lid)) out.push(`state.placed has unknown label ${lid}`);
      if (used.has(lid)) out.push(`label ${lid} placed twice`);
      used.add(lid);
    }
    return out;
  },

  value(m, s) {
    const placed = {};
    const wrongIds = [];
    const unplacedIds = [];
    for (const sp of m.hotspots) {
      const got = s.placed[sp.id];
      placed[sp.id] = got || "none";
      if (!got) unplacedIds.push(sp.id);
      else if (got !== sp.answer) wrongIds.push(sp.id);
    }
    return { placed, correct: String(m.hotspots.length - wrongIds.length - unplacedIds.length), wrong: String(wrongIds.length), unplaced: String(unplacedIds.length), total: String(m.hotspots.length), wrongIds, unplacedIds };
  },

  describe(m, s) {
    const n = Object.keys(s.placed).length;
    return `${n} of ${m.hotspots.length} labels placed`;
  },

  async mount(host, { model, state, onChange, announce }) {
    let st = clone(state);
    let held = null;
    let marks = new Set();
    const stage = await visualStage(model.visual, "st-cb-ld");
    const bank = h("ul", { class: "st-cb-bank", "aria-label": "Labels to place" });
    const status = h("p", { class: "st-cb-readout", role: "status" });
    host.replaceChildren(h("div", { class: "st-cb-ld-grid" }, stage.el, h("div", {}, h("p", { class: "st-cb-quiet-text" }, "Tap or press Enter on a label, then choose a numbered spot. You can also drag. Backspace removes a label from a spot."), bank)), status);
    const labelText = (id) => model.labels.find((l) => l.id === id)?.text || id;
    const spotNo = (id) => model.hotspots.findIndex((s) => s.id === id) + 1;

    const place = (spotId, labelId) => {
      const old = st.placed[spotId];
      for (const k of Object.keys(st.placed)) if (st.placed[k] === labelId) delete st.placed[k];
      st.placed[spotId] = labelId;
      if (old && old !== labelId) held = null;
      held = null;
      marks = new Set();
      announce(`${labelText(labelId)} placed on spot ${spotNo(spotId)}.${old && old !== labelId ? ` ${labelText(old)} went back to the list.` : ""}`);
      onChange(clone(st));
      draw();
      stage.overlay.querySelector(`[data-drop="${spotId}"]`)?.focus();
    };
    const unplace = (spotId) => {
      const lid = st.placed[spotId];
      if (!lid) return;
      delete st.placed[spotId];
      marks = new Set();
      announce(`${labelText(lid)} returned to the list.`);
      onChange(clone(st));
      draw();
      stage.overlay.querySelector(`[data-drop="${spotId}"]`)?.focus();
    };

    function draw() {
      const used = new Set(Object.values(st.placed));
      bank.replaceChildren(
        ...model.labels.map((l) => {
          const b = h("button", { type: "button", class: `st-cb-label${held === l.id ? " is-held" : ""}`, "aria-pressed": String(held === l.id), "data-label": l.id, disabled: used.has(l.id) ? true : false, onclick: () => { held = held === l.id ? null : l.id; announce(held ? `Picked up ${l.text}. Choose a spot on the diagram.` : `Put down ${l.text}.`); draw(); bank.querySelector(`[data-label="${l.id}"]`)?.focus(); } }, l.text);
          dragToDrop(b, { onDrop: (t) => place(t.dataset.drop, l.id) });
          return h("li", {}, b);
        }),
      );
      stage.overlay.replaceChildren(
        ...model.hotspots.map((s, i) => {
          const lid = st.placed[s.id];
          const wrong = marks.has(s.id);
          const b = h(
            "button",
            {
              type: "button",
              class: `st-cb-spot${lid ? " is-filled" : ""}${wrong ? " is-wrong" : ""}`,
              "data-drop": s.id,
              "aria-label": `Spot ${i + 1}${s.name ? `, ${s.name}` : ""}: ${lid ? `${labelText(lid)}${wrong ? ", not yet right" : ""}` : "empty"}`,
              onclick: () => {
                if (held) return place(s.id, held);
                if (lid) {
                  held = lid;
                  delete st.placed[s.id];
                  marks = new Set();
                  announce(`Picked up ${labelText(lid)} from spot ${i + 1}. Choose another spot.`);
                  onChange(clone(st));
                  draw();
                  bank.querySelector(`[data-label="${lid}"]`)?.focus();
                } else announce(`Spot ${i + 1} is empty. Pick a label first.`);
              },
              onkeydown: (ev) => (ev.key === "Backspace" || ev.key === "Delete") && (ev.preventDefault(), unplace(s.id)),
            },
            lid ? h("span", { class: "st-cb-spot-text" }, labelText(lid), wrong ? h("span", { class: "st-cb-notyet" }, " (not yet)") : null) : h("span", { class: "st-cb-spot-no" }, String(i + 1)),
          );
          return stage.place(b, s.x, s.y);
        }),
      );
      const n = Object.keys(st.placed).length;
      status.textContent = held ? `Holding: ${labelText(held)}. Choose a spot.` : `${n} of ${model.hotspots.length} labels placed.`;
    }
    draw();
    void loadVisuals;
    return {
      setState(s) {
        st = clone(s);
        held = null;
        marks = new Set();
        draw();
      },
      mark(value) {
        marks = new Set(value.wrongIds);
        draw();
      },
    };
  },
};
