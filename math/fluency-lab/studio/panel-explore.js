// Explore: a simulator for the skill's big idea. Sliders are real range inputs; the reading under the picture
// always restates the current numbers in words, so the learner can connect what they moved to what changed.
import { morph, pick } from "./core.js";
import { t } from "../i18n.js";
import { vocabMarkup } from "./vocab-content.js";

const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function mountExplore(ctx, root) {
  const sim = ctx.sim;
  if (sim.mount) return sim.mount(ctx, root);
  let state = sim.init(ctx);
  root.innerHTML = `
    <p class="sd-task"><span class="sd-tag">${esc(t("Explore"))}</span> <span data-ask></span></p>
    <div class="sd-stage-wrap"><div class="sd-stage" data-stage></div></div>
    <div class="sd-sliders" data-sliders></div>
    <div class="sd-controls" data-acts></div>
    <p class="sd-cap" data-read role="status" aria-live="polite"></p>`;
  const q = (s) => root.querySelector(s);
  let first = true;
  let touched = 0;
  let dragIndex = null;

  function sliders() {
    q("[data-sliders]").innerHTML = sim.sliders(state).map((s) => `<label class="sd-slider"><span>${esc(pick(s.label, ctx.lang()))}: <output data-out="${s.key}">${s.value}</output></span><input type="range" data-k="${s.key}" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}" /></label>`).join("");
    q("[data-acts]").innerHTML = (sim.actions || []).map((a) => `<button type="button" class="sd-btn" data-a="${a.id}">${esc(pick(a.label, ctx.lang()))}</button>`).join("");
  }
  function draw(rebuild) {
    const r = sim.render(state);
    morph(q("[data-stage]"), r.svg, { animate: !first });
    first = false;
    q("[data-ask]").innerHTML = vocabMarkup(pick(sim.ask, ctx.lang()));
    q("[data-read]").innerHTML = vocabMarkup(pick(r.read, ctx.lang()));
    if (rebuild) sliders();
  }
  root.addEventListener("input", (e) => {
    const k = e.target.dataset?.k;
    if (!k) return;
    state = { ...state, [k]: Number(e.target.value) };
    if (sim.clamp) state = sim.clamp(state);
    touched += 1;
    if (touched >= 3) ctx.mark("explore");
    draw(k === "d" || sim.clamp !== undefined);
    const out = root.querySelector(`[data-out="${k}"]`);
    if (out) out.textContent = e.target.value;
    if (sim.clamp) root.querySelector(`[data-k="${k}"]`)?.focus();
  });
  root.addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]");
    if (!a) return;
    state = sim.act(state, a.dataset.a);
    touched += 1;
    if (touched >= 3) ctx.mark("explore");
    draw(false);
  });
  root.addEventListener("pointerdown", (e) => {
    const point = e.target.closest("[data-point-index]");
    if (!point || !sim.movePoint) return;
    dragIndex = Number(point.dataset.pointIndex);
    point.focus();
    e.preventDefault();
    point.closest("svg")?.setPointerCapture?.(e.pointerId);
    const svg = point.closest("svg");
    const value = sim.pointerValue?.(e.clientX, svg?.getBoundingClientRect(), svg?.viewBox?.baseVal);
    if (value !== null && value !== undefined) {
      state = sim.movePoint(state, dragIndex, value);
      touched += 1;
      if (touched >= 3) ctx.mark("explore");
      draw(false);
    }
  });
  root.addEventListener("pointermove", (e) => {
    if (dragIndex === null) return;
    const svg = root.querySelector("[data-stage] svg");
    const value = sim.pointerValue?.(e.clientX, svg?.getBoundingClientRect(), svg?.viewBox?.baseVal);
    if (value === null || value === undefined) return;
    state = sim.movePoint(state, dragIndex, value);
    touched += 1;
    if (touched >= 3) ctx.mark("explore");
    draw(false);
  });
  root.addEventListener("pointerup", () => { dragIndex = null; });
  root.addEventListener("pointercancel", () => { dragIndex = null; });
  root.addEventListener("keydown", (e) => {
    const point = e.target.closest?.("[data-point-index]");
    if (!point || !sim.movePoint) return;
    const index = Number(point.dataset.pointIndex);
    const current = state.data[index];
    const next = e.key === "ArrowLeft" ? current - 1 : e.key === "ArrowRight" ? current + 1 : e.key === "Home" ? 0 : e.key === "End" ? 20 : null;
    if (next === null) return;
    e.preventDefault();
    state = sim.movePoint(state, index, next);
    touched += 1;
    if (touched >= 3) ctx.mark("explore");
    draw(false);
  });
  sliders();
  draw(false);
  return () => {};
}
