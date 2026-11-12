// Build: the learner moves the model themselves. Every action goes through the engine's own rules, so an
// impossible move is refused with a reason and the picture only ever shows a legal state. The list of moves
// they made is kept as their visible thinking.
import { morph, pick } from "./core.js";
import { record } from "./adaptive.js";
import { t } from "../i18n.js";
import { vocabMarkup } from "./vocab-content.js";
import { bindPlane } from "./plane-pick.js";

const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function mountBuild(ctx, root) {
  const { engine, spec } = ctx.lesson;
  const b = engine.build;
  let state = b.init(spec);
  let extra = {};
  const moves = [];
  const prompt = typeof b.prompt === "function" ? b.prompt(spec) : b.prompt;
  root.innerHTML = `
    <p class="sd-task"><span class="sd-tag">${esc(t("Build"))}</span> <span data-prompt></span></p>
    <div class="sd-stage-wrap"><div class="sd-stage" data-stage></div></div>
    <p class="sd-cap" data-status role="status" aria-live="polite"></p>
    <p class="sd-note" data-msg role="alert"></p>
    <div class="sd-controls sd-tools" data-controls role="group" aria-label="${esc(t("Moves"))}"></div>
    <div class="sd-record" data-record hidden><h4>${esc(t("My thinking"))}</h4><ol data-moves></ol></div>`;
  const q = (s) => root.querySelector(s);
  const stage = q("[data-stage]");
  let first = true;
  let r;

  function draw() {
    r = b.render(state, spec, extra);
    morph(stage, r.svg, { animate: !first });
    first = false;
    q("[data-prompt]").innerHTML = vocabMarkup(pick(prompt, ctx.lang()));
    q("[data-status]").innerHTML = r.status ? vocabMarkup(pick(r.status, ctx.lang())) : "";
    const done = b.done(state, spec);
    q("[data-controls]").innerHTML = r.controls.map((c, n) => `<button type="button" class="sd-btn" data-n="${n}">${esc(pick(c.label, ctx.lang()))}</button>`).join("");
    const rec = q("[data-record]");
    rec.hidden = moves.length === 0;
    q("[data-moves]").innerHTML = moves.map((m) => `<li>${esc(m)}</li>`).join("");
    if (done) {
      ctx.mark("build");
      ctx.say(r.status ? pick(r.status, ctx.lang()) : t("Done."));
    }
    attachDrag();
    // A quadrant question can be answered on the plane itself: tapping a quadrant picks it like its button does.
    bindPlane(stage, {
      lang: () => ctx.lang(),
      onPick: ({ quadrant, commit }) => {
        if (!commit || spec.mode !== "quad" || !quadrant) return;
        const n = r.controls.findIndex((c) => c.id === "pick" && pick(c.label, "en") === quadrant);
        if (n >= 0) apply("pick", r.controls[n].arg, pick(r.controls[n].label, ctx.lang()));
      },
    });
  }

  function apply(id, arg, label) {
    const res = b.act(state, id, arg, spec);
    state = res.state;
    extra = { tilt: res.tilt || 0 };
    q("[data-msg]").innerHTML = res.msg ? vocabMarkup(pick(res.msg, ctx.lang())) : "";
    if (res.ok) moves.push(label);
    else if (res.tag) record(ctx.key, { kind: "predict", ok: false, supported: false, tag: res.tag });
    draw();
    if (res.tilt) setTimeout(() => ((extra = {}), draw()), 1400);
  }

  function attachDrag() {
    const svg = stage.querySelector("svg[data-lo]");
    const token = stage.querySelector(".sd-token");
    if (!svg || !token || svg.dataset.bound) return;
    svg.dataset.bound = "1";
    let dragging = false;
    const valueAt = (ev) => {
      // Through the SVG's own transform, so it stays right however the drawing was cropped or scaled.
      const point = svg.createSVGPoint();
      point.x = ev.clientX;
      point.y = ev.clientY;
      const x = point.matrixTransform(svg.getScreenCTM().inverse()).x;
      const lo = Number(svg.dataset.lo);
      const hi = Number(svg.dataset.hi);
      return Math.round(lo + ((x - 40) / 480) * (hi - lo));
    };
    svg.addEventListener("pointerdown", (ev) => {
      if (!ev.target.closest(".sd-token")) return;
      dragging = true;
      svg.setPointerCapture?.(ev.pointerId);
    });
    svg.addEventListener("pointermove", (ev) => {
      if (!dragging) return;
      const v = valueAt(ev);
      if (v !== state.pos) apply("goto", v, t("Dragged the point to {n}", { n: String(v).replace("-", "−") }));
    });
    const end = () => (dragging = false);
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
  }

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-n]");
    if (!btn) return;
    const c = r.controls[Number(btn.dataset.n)];
    apply(c.id, c.arg, pick(c.label, ctx.lang()));
  });
  draw();
  return () => {};
}
