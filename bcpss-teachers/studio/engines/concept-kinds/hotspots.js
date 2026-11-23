// Shared by label-diagram and map-hotspots: render a visual spec with an absolutely positioned overlay in visual units,
// plus a pick-up-and-place drag helper that never breaks click, keyboard or touch alternatives.
import { h } from "../../core/dom.js";

let visualsPromise;
/** Lazily import core/visuals.js (written by another worker); resolves null when it is not available. */
export function loadVisuals() {
  visualsPromise ||= import("../../core/visuals.js").catch(() => null);
  return visualsPromise;
}

export const visualSize = (spec) => ({ w: Number(spec?.w) || 480, h: Number(spec?.h) || 320 });

/** Build {el, overlay, w, h}: el is the figure; overlay positions children by percent of visual units. */
export async function visualStage(spec, cls = "") {
  const mod = await loadVisuals();
  const { w, h: ht } = visualSize(spec);
  const holder = h("div", { class: "st-cb-vis-svg" });
  if (mod?.renderVisual) {
    try {
      holder.innerHTML = mod.renderVisual(spec);
    } catch {
      holder.append(h("p", { class: "st-cb-msg" }, "The picture could not be drawn. You can still use the numbered spots."));
    }
  } else holder.append(h("p", { class: "st-cb-msg" }, "The picture is not available. You can still use the numbered spots."));
  const overlay = h("div", { class: "st-cb-overlay" });
  const stage = h("div", { class: `st-cb-vis ${cls}`.trim(), style: `aspect-ratio:${w} / ${ht}` }, holder, overlay);
  const place = (el, x, y) => {
    el.style.left = `${(x / w) * 100}%`;
    el.style.top = `${(y / ht) * 100}%`;
    return el;
  };
  return { el: stage, overlay, w, h: ht, place };
}

/**
 * Pointer drag for a "label" button onto any element carrying [data-drop]. A press without movement is left to the
 * normal click handler, so tap-to-pick-up and keyboard use the same code path.
 */
export function dragToDrop(btnEl, { onDrop, hit = (x, y) => document.elementFromPoint(x, y)?.closest?.("[data-drop]") }) {
  let down = null;
  let ghost = null;
  btnEl.style.touchAction = "none";
  btnEl.addEventListener("pointerdown", (ev) => {
    if (ev.button != null && ev.button !== 0) return;
    down = { x: ev.clientX, y: ev.clientY, id: ev.pointerId, moved: false };
  });
  btnEl.addEventListener("pointermove", (ev) => {
    if (!down || ev.pointerId !== down.id) return;
    if (!down.moved && Math.hypot(ev.clientX - down.x, ev.clientY - down.y) < 8) return;
    if (!down.moved) {
      down.moved = true;
      try {
        btnEl.setPointerCapture(ev.pointerId);
      } catch {
        /* best effort */
      }
      ghost = btnEl.cloneNode(true);
      ghost.classList.add("st-cb-ghost");
      ghost.removeAttribute("id");
      ghost.setAttribute("aria-hidden", "true");
      document.body.append(ghost);
    }
    ghost.style.left = `${ev.clientX}px`;
    ghost.style.top = `${ev.clientY}px`;
  });
  const finish = (ev) => {
    if (!down || ev.pointerId !== down.id) return;
    const moved = down.moved;
    down = null;
    ghost?.remove();
    ghost = null;
    if (!moved) return;
    const target = hit(ev.clientX, ev.clientY);
    const stop = (e) => e.stopImmediatePropagation();
    btnEl.addEventListener("click", stop, { capture: true, once: true });
    setTimeout(() => btnEl.removeEventListener("click", stop, { capture: true }), 0);
    if (target) onDrop(target, ev);
  };
  btnEl.addEventListener("pointerup", finish);
  btnEl.addEventListener("pointercancel", finish);
}
