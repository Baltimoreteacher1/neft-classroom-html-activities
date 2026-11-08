// Explore: a simulator for the skill's big idea. Sliders are real range inputs; the reading under the picture
// always restates the current numbers in words, so the learner can connect what they moved to what changed.
import { morph, pick } from "./core.js";
import { record } from "./adaptive.js";
import { t } from "../i18n.js";
import { vocabMarkup } from "./vocab-content.js";

const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function mountExplore(ctx, root) {
  const sim = ctx.sim;
  if (sim.mount) return sim.mount(ctx, root);
  // Keep an investigation intact when a learner switches to another strategy or tab.
  // The key includes the problem spec so a new problem can never inherit old quantities.
  const sessionKey = JSON.stringify([
    sim.id,
    ctx.lesson?.engine?.id || "",
    ctx.lesson?.spec || null,
  ]);
  const prior = ctx.exploreSession?.key === sessionKey ? ctx.exploreSession : null;
  let state = prior?.state ? structuredClone(prior.state) : sim.init(ctx);
  let predictionUnlocked = sim.prediction ? Boolean(prior?.predictionUnlocked) : true;
  let predictionAttempts = prior?.predictionAttempts || 0;
  let predictionValue = prior?.predictionValue || "";
  let predictionFeedback = prior?.predictionFeedback || "";
  let evidenceRecorded = Boolean(prior?.evidenceRecorded);
  const save = () => {
    ctx.exploreSession = {
      key: sessionKey,
      state: structuredClone(state),
      predictionUnlocked,
      predictionAttempts,
      predictionValue,
      predictionFeedback,
      evidenceRecorded,
    };
  };
  root.innerHTML = `
    <section class="sd-prediction" data-prediction ${predictionUnlocked ? "hidden" : ""} aria-labelledby="sd-prediction-title">
      <p class="sd-task"><span class="sd-tag">${esc(t("Explore"))}</span></p>
      <h4 id="sd-prediction-title" data-prediction-prompt></h4>
      <form class="sd-answer" data-prediction-form novalidate>
        <label for="sd-prediction-${ctx.id}">${esc(t("Your prediction"))}</label>
        <input id="sd-prediction-${ctx.id}" class="sd-input" type="number" inputmode="decimal" step="any" autocomplete="off" value="${esc(predictionValue)}" />
        <button type="submit" class="sd-btn sd-primary">${esc(t("Check prediction"))}</button>
      </form>
      <p class="sd-feedback" data-prediction-feedback role="status" aria-live="polite">${esc(predictionFeedback)}</p>
      <button type="button" class="sd-btn" data-reveal-model ${predictionAttempts >= 2 ? "" : "hidden"}>${esc(t("Open the model"))}</button>
    </section>
    <section data-model ${predictionUnlocked ? "" : "hidden"}>
      <p class="sd-task"><span class="sd-tag">${esc(t("Explore"))}</span> <span data-ask></span></p>
      <div class="sd-stage-wrap"><div class="sd-stage" data-stage></div></div>
      <div class="sd-sliders" data-sliders></div>
      <div class="sd-controls" data-acts></div>
      <p class="sd-cap" data-read role="status" aria-live="polite"></p>
    </section>`;
  const q = (s) => root.querySelector(s);
  let first = true;
  let touched = 0;
  let dragIndex = null;
  const noteInteraction = () => {
    touched += 1;
    if (touched < 3) return;
    ctx.mark("explore");
    if (!evidenceRecorded && /^[0-8]:[\w-]{1,40}$/.test(ctx.key || "")) {
      evidenceRecorded = true;
      record(ctx.key, { kind: "explore", ok: true, supported: true, tag: sim.id });
    }
    save();
  };

  function sliders() {
    q("[data-sliders]").innerHTML = sim.sliders(state).map((s) => `<label class="sd-slider"><span>${esc(pick(s.label, ctx.lang()))}: <output data-out="${s.key}">${s.value}</output></span><input type="range" data-k="${s.key}" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}" /></label>`).join("");
    q("[data-acts]").innerHTML = (sim.actions || []).map((a) => `<button type="button" class="sd-btn" data-a="${a.id}">${esc(pick(a.label, ctx.lang()))}</button>`).join("");
  }
  function draw(rebuild) {
    if (!predictionUnlocked) {
      q("[data-prediction-prompt]").textContent = pick(sim.prediction(state).prompt, ctx.lang());
      return;
    }
    const r = sim.render(state);
    morph(q("[data-stage]"), r.svg, { animate: !first });
    first = false;
    q("[data-ask]").innerHTML = vocabMarkup(pick(sim.ask, ctx.lang()));
    q("[data-read]").innerHTML = vocabMarkup(pick(r.read, ctx.lang()));
    if (rebuild) sliders();
  }
  q("[data-prediction-form]")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = q("[data-prediction-form] input");
    if (!input.value.trim()) {
      q("[data-prediction-feedback]").textContent = t("Enter a prediction first.");
      predictionFeedback = q("[data-prediction-feedback]").textContent;
      save();
      input.focus();
      return;
    }
    const expected = sim.prediction(state).answer;
    const guess = Number(input.value);
    predictionValue = input.value;
    if (Number.isFinite(guess) && Math.abs(guess - expected) < 1e-8) {
      predictionUnlocked = true;
      predictionFeedback = t("Your prediction is correct. Now change a quantity and investigate how the whole responds.");
      q("[data-prediction-feedback]").textContent = predictionFeedback;
      input.disabled = true;
      q("[data-prediction-form] button").disabled = true;
      q("[data-prediction]").hidden = false;
      q("[data-model]").hidden = false;
      save();
      draw(true);
      root.querySelector("[data-k]")?.focus();
      return;
    }
    predictionAttempts += 1;
    q("[data-prediction-feedback]").textContent = pick(sim.prediction(state).hint, ctx.lang());
    predictionFeedback = q("[data-prediction-feedback]").textContent;
    if (predictionAttempts >= 2) q("[data-reveal-model]").hidden = false;
    save();
    input.select();
  });
  q("[data-reveal-model]")?.addEventListener("click", () => {
    predictionUnlocked = true;
    predictionFeedback = t("The model is open. Explore the relationship, then solve a fresh problem on your own.");
    q("[data-prediction-feedback]").textContent = predictionFeedback;
    q("[data-prediction-form] input").disabled = true;
    q("[data-prediction-form] button").disabled = true;
    q("[data-model]").hidden = false;
    save();
    draw(true);
    root.querySelector("[data-k]")?.focus();
  });
  root.addEventListener("input", (e) => {
    const k = e.target.dataset?.k;
    if (!k) return;
    state = { ...state, [k]: Number(e.target.value) };
    if (sim.clamp) state = sim.clamp(state);
    save();
    noteInteraction();
    draw(k === "d" || sim.clamp !== undefined);
    const out = root.querySelector(`[data-out="${k}"]`);
    if (out) out.textContent = e.target.value;
    if (sim.clamp) root.querySelector(`[data-k="${k}"]`)?.focus();
  });
  root.addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]");
    if (!a) return;
    state = sim.act(state, a.dataset.a);
    save();
    noteInteraction();
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
      save();
      noteInteraction();
      draw(false);
    }
  });
  root.addEventListener("pointermove", (e) => {
    if (dragIndex === null) return;
    const svg = root.querySelector("[data-stage] svg");
    const value = sim.pointerValue?.(e.clientX, svg?.getBoundingClientRect(), svg?.viewBox?.baseVal);
    if (value === null || value === undefined) return;
    state = sim.movePoint(state, dragIndex, value);
    save();
    noteInteraction();
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
    save();
    noteInteraction();
    draw(false);
  });
  if (predictionUnlocked) sliders();
  draw(false);
  if (prior && predictionUnlocked) {
    q("[data-prediction-form] input").disabled = true;
    q("[data-prediction-form] button").disabled = true;
  }
  return () => {};
}
