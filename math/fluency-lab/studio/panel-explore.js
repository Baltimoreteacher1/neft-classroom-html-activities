// Explore: a simulator for the skill's big idea. Sliders are real range inputs; the reading under the picture
// always restates the current numbers in words, so the learner can connect what they moved to what changed.
import { morph, pick } from "./core.js";
import { t } from "../i18n.js";

const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function mountExplore(ctx, root) {
  const sim = ctx.sim;
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

  function sliders() {
    q("[data-sliders]").innerHTML = sim.sliders(state).map((s) => `<label class="sd-slider"><span>${esc(pick(s.label, ctx.lang()))}: <output data-out="${s.key}">${s.value}</output></span><input type="range" data-k="${s.key}" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}" /></label>`).join("");
    q("[data-acts]").innerHTML = (sim.actions || []).map((a) => `<button type="button" class="sd-btn" data-a="${a.id}">${esc(pick(a.label, ctx.lang()))}</button>`).join("");
  }
  function draw(rebuild) {
    const r = sim.render(state);
    morph(q("[data-stage]"), r.svg, { animate: !first });
    first = false;
    q("[data-ask]").textContent = pick(sim.ask, ctx.lang());
    q("[data-read]").textContent = pick(r.read, ctx.lang());
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
  sliders();
  draw(false);
  return () => {};
}
