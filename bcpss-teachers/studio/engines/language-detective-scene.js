// language-detective: the scene (passage, conversation, image or diagram) with tap-to-select evidence units.
import { h } from "../core/dom.js";
import { unitText } from "./language-detective-model.js";
import { speakBtn, visualEl } from "./st1-ui.js";

/**
 * createScene(ctx, scene, { onChange(selectedSet) })
 * state: selecting (bool), selected (Set), saved (Map unitId -> [question numbers]), model (Set of unit ids to outline)
 */
export function createScene(ctx, scene, { onChange } = {}) {
  const st = {
    selecting: false,
    selected: new Set(),
    saved: new Map(),
    model: new Set(),
    max: Infinity,
  };
  const body = h("div", { class: "st-ld-scene-body" });
  const status = h("p", { class: "st-ld-scene-status", role: "status" });
  const el = h(
    "section",
    {
      class: "st-card st-ld-scene",
      "aria-label": scene.title || "The scene",
      "data-kind": scene.kind,
    },
    h("h3", {}, scene.title || "The scene"),
    scene.source ? h("p", { class: "st-ld-source" }, scene.source) : null,
    status,
    body,
    scene.caption ? h("p", { class: "st-ld-caption" }, scene.caption) : null,
  );

  const classes = (id) =>
    [
      "st-ld-unit",
      st.selected.has(id) ? "st-selected" : "",
      st.saved.has(id) ? "st-ld-saved" : "",
      st.model.has(id) ? "st-pulse" : "",
    ]
      .filter(Boolean)
      .join(" ");
  const badge = (id) =>
    st.saved.has(id)
      ? h("sup", { class: "st-ld-badge", "aria-hidden": "true" }, st.saved.get(id).join(","))
      : null;
  const savedLabel = (id) =>
    st.saved.has(id) ? ` Saved as proof for question ${st.saved.get(id).join(" and ")}.` : "";

  function toggle(id) {
    if (!st.selecting) return;
    if (st.selected.has(id)) st.selected.delete(id);
    else if (st.selected.size < st.max) st.selected.add(id);
    else ctx.announce(`You can choose up to ${st.max}. Tap one to unselect it first.`);
    paint();
    onChange?.(new Set(st.selected));
    body.querySelector(`[data-unit="${id}"]`)?.focus();
  }

  function unit(id, text, label, tag = "span") {
    const common = { class: classes(id), "data-unit": id };
    if (!st.selecting)
      return h(tag, common, text, badge(id), st.saved.has(id) ? h("span", { class: "st-sr-only" }, ` (proof for question ${st.saved.get(id).join(" and ")})`) : null);
    return h(
      "button",
      {
        ...common,
        type: "button",
        "aria-pressed": String(st.selected.has(id)),
        "aria-label": `${label}.${savedLabel(id)}`,
        onclick: () => toggle(id),
      },
      text,
      badge(id),
    );
  }

  function paintPassage() {
    const paras = new Map();
    for (const s of scene.sentences) {
      const k = s.para ?? 0;
      if (!paras.has(k)) paras.set(k, []);
      paras.get(k).push(s);
    }
    for (const list of paras.values()) {
      const p = h("p", { class: "st-ld-para" });
      list.forEach((s, i) => {
        p.append(unit(s.id, s.text, s.text, "span"), i < list.length - 1 ? " " : "");
      });
      body.append(p);
    }
    body.append(
      h(
        "div",
        { class: "st-row" },
        speakBtn(ctx, scene.sentences.map((s) => s.text).join(" "), {
          label: "Read the whole passage to me",
        }),
      ),
    );
  }

  function paintConversation() {
    if (scene.setting) body.append(h("p", { class: "st-ld-setting" }, scene.setting));
    const list = h("ol", { class: "st-ld-lines" });
    scene.lines.forEach((l, i) => {
      const side =
        [...new Set(scene.lines.map((x) => x.speaker))].indexOf(l.speaker) % 2 ? "b" : "a";
      list.append(
        h(
          "li",
          { class: `st-ld-line st-ld-side-${side}` },
          h("span", { class: "st-ld-speaker" }, l.speaker),
          unit(l.id, l.text, `${l.speaker} says: ${l.text}`, "span"),
          speakBtn(ctx, `${l.speaker} says: ${l.text}`, {
            label: `Hear line ${i + 1}`,
            iconOnly: true,
          }),
        ),
      );
    });
    body.append(list);
  }

  function paintImage() {
    const w = scene.visual.w || 480;
    const hh = scene.visual.h || 320;
    const wrap = h(
      "div",
      { class: "st-ld-image", style: `aspect-ratio:${w}/${hh}` },
      visualEl(scene.visual, "st-ld-visual"),
    );
    for (const r of scene.regions) {
      const cx = ((r.x + r.w / 2) / w) * 100;
      const cy = ((r.y + r.h / 2) / hh) * 100;
      const style = `left:${cx}%;top:${cy}%;width:${(r.w / w) * 100}%;height:${(r.h / hh) * 100}%`;
      const attrs = { class: `${classes(r.id)} st-ld-region`, "data-unit": r.id, style };
      if (st.selecting)
        wrap.append(
          h(
            "button",
            {
              ...attrs,
              type: "button",
              "aria-pressed": String(st.selected.has(r.id)),
              "aria-label": `${r.label}.${savedLabel(r.id)}`,
              onclick: () => toggle(r.id),
            },
            badge(r.id),
          ),
        );
      else if (st.saved.has(r.id))
        wrap.append(h("span", { ...attrs, "aria-hidden": "true" }, badge(r.id)));
    }
    body.append(wrap);
    if (scene.visual.longDesc)
      body.append(
        h(
          "details",
          { class: "st-ld-desc" },
          h("summary", {}, "Describe this picture in words"),
          h("p", {}, scene.visual.longDesc),
        ),
      );
  }

  function paint() {
    body.textContent = "";
    status.textContent = st.selecting
      ? `Tap ${scene.kind === "passage" ? "sentences" : scene.kind === "conversation" ? "lines" : "parts of the picture"} to choose your proof. ${st.selected.size} chosen.`
      : "";
    el.dataset.selecting = String(st.selecting);
    if (scene.kind === "passage") paintPassage();
    else if (scene.kind === "conversation") paintConversation();
    else paintImage();
  }

  paint();
  return {
    el,
    startSelecting({ max = Infinity } = {}) {
      st.selecting = true;
      st.selected = new Set();
      st.max = max;
      paint();
    },
    stopSelecting() {
      st.selecting = false;
      st.selected = new Set();
      paint();
    },
    selected: () => new Set(st.selected),
    clear() {
      st.selected = new Set();
      paint();
      onChange?.(new Set());
    },
    save(ids, qNo) {
      for (const id of ids) st.saved.set(id, [...(st.saved.get(id) || []), qNo]);
      paint();
    },
    outline(ids) {
      st.model = new Set(ids);
      paint();
    },
    text: (id) =>
      unitText(
        scene.kind === "passage"
          ? scene.sentences.find((s) => s.id === id)
          : scene.kind === "conversation"
            ? scene.lines.find((s) => s.id === id)
            : scene.regions.find((s) => s.id === id),
      ),
    refresh: paint,
  };
}
