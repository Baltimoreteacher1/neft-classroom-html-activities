// Watch: the animated explanation with Back / Play / Next / Replay and speed. It stops at each
// Predict-Reveal-Explain point and waits for the learner to think before showing what happens.
import { morph, pick } from "./core.js";
import { framesOf } from "./engines.js";
import { record } from "./adaptive.js";
import { t } from "../i18n.js";
import { speak } from "../speech.js";

const reduced = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function mountWatch(ctx, root) {
  const { lesson } = ctx;
  const repNow = ctx.rep || lesson.spec.reps?.[0] || "main";
  const frames = framesOf(lesson, repNow);
  const isDefaultRep = !lesson.spec.reps || repNow === lesson.spec.reps[0];
  const predicts = isDefaultRep ? lesson.engine.predicts(lesson.spec) : [];
  const calm = reduced();
  let i = 0;
  let playing = false;
  let timer = null;
  let speed = 1;
  const answered = new Set();
  let gate = null;

  root.innerHTML = `
    <div class="sd-stage-wrap">
      <div class="sd-stage" data-stage tabindex="0" aria-label="${esc(t("Animated model. Use the arrow keys to move between steps."))}"></div>
      <p class="sd-eq" data-eq aria-hidden="true"></p>
    </div>
    <p class="sd-cap" data-cap role="status" aria-live="polite"></p>
    <div class="sd-predict" data-predict hidden></div>
    <div class="sd-controls" role="group" aria-label="${esc(t("Playback"))}">
      <button type="button" class="sd-btn" data-w="back">${esc(t("Previous step"))}</button>
      ${calm ? "" : `<button type="button" class="sd-btn sd-primary" data-w="play">${esc(t("Play"))}</button>`}
      <button type="button" class="sd-btn sd-primary" data-w="next">${esc(t("Next step"))}</button>
      <button type="button" class="sd-btn" data-w="replay">${esc(t("Replay"))}</button>
      ${calm ? "" : `<label class="sd-speed">${esc(t("Speed"))} <select data-w="speed"><option value="0.6">${esc(t("Slow"))}</option><option value="1" selected>${esc(t("Normal"))}</option><option value="1.6">${esc(t("Fast"))}</option></select></label>`}
      <button type="button" class="sd-btn sd-ghost" data-w="all">${esc(t("Show all steps"))}</button>
    </div>
    <ol class="sd-dots" data-dots aria-hidden="true">${frames.map((_, n) => `<li data-dot="${n}"></li>`).join("")}</ol>
    <ol class="sd-all" data-all hidden></ol>`;
  const q = (sel) => root.querySelector(sel);
  const stage = q("[data-stage]");

  const caption = (f) => pick(ctx.simple && f.easy ? f.easy : f.cap, ctx.lang());
  function show(n, { speakIt = true } = {}) {
    i = Math.max(0, Math.min(frames.length - 1, n));
    const f = frames[i];
    morph(stage, f.svg, { animate: !calm });
    q("[data-eq]").textContent = f.eq || "";
    q("[data-cap]").textContent = caption(f);
    root.querySelectorAll("[data-dot]").forEach((d, k) => d.classList.toggle("on", k <= i));
    q('[data-w="back"]').disabled = i === 0;
    q('[data-w="next"]').disabled = Boolean(gate) || i === frames.length - 1;
    if (ctx.narrate && speakIt) speak(caption(f), ctx.lang(), { raw: true });
    const p = predicts.find((x) => x.at === i && !answered.has(x.at));
    if (p) openGate(p);
    if (i === frames.length - 1 && !gate) {
      stop();
      ctx.mark("explore");
    }
  }

  function openGate(p) {
    stop();
    gate = p;
    q('[data-w="next"]').disabled = true;
    const box = q("[data-predict]");
    box.hidden = false;
    box.innerHTML = `<p class="sd-q"><span class="sd-tag">${esc(t("Predict"))}</span> ${esc(pick(p.q, ctx.lang()))}</p>
      <div class="sd-choices">${p.choices.map((c, n) => `<button type="button" class="sd-choice" data-c="${n}">${esc(pick(c.t, ctx.lang()))}</button>`).join("")}</div>
      <p class="sd-why" data-why role="status" aria-live="polite"></p>`;
    ctx.say(pick(p.q, ctx.lang()));
    box.querySelector("button")?.focus();
  }

  function closeGate() {
    answered.add(gate.at);
    gate = null;
    q("[data-predict]").hidden = true;
    q("[data-predict]").innerHTML = "";
    show(i, { speakIt: false });
    q('[data-w="next"]').focus();
  }

  function choose(n) {
    const c = gate.choices[n];
    const box = q("[data-predict]");
    const why = box.querySelector("[data-why]");
    const first = !gate.tried;
    gate.tried = true;
    if (first) record(ctx.key, { kind: "predict", ok: c.ok, supported: false, tag: null });
    why.textContent = `${c.ok ? t("Yes.") : t("Not quite.")} ${pick(c.why, ctx.lang())}`;
    box.querySelectorAll(".sd-choice")[n].classList.add(c.ok ? "sd-right" : "sd-wrong");
    if (!c.ok) return;
    box.querySelectorAll(".sd-choice").forEach((b) => (b.disabled = true));
    if (gate.explain && !gate.explained) {
      gate.explained = true;
      why.insertAdjacentHTML(
        "afterend",
        `<div class="sd-explain" data-explain><p class="sd-q"><span class="sd-tag">${esc(t("Explain"))}</span> ${esc(t("Which sentence says why?"))}</p><div class="sd-choices">${gate.explain.map((e, k) => `<button type="button" class="sd-choice" data-e="${k}">${esc(pick(e.t, ctx.lang()))}</button>`).join("")}</div></div>`,
      );
      return;
    }
    box.insertAdjacentHTML(
      "beforeend",
      `<button type="button" class="sd-btn sd-primary" data-w="go">${esc(t("Show me"))}</button>`,
    );
    box.querySelector('[data-w="go"]').focus();
  }

  function explain(k) {
    const e = gate.explain[k];
    const box = q("[data-predict]");
    const buttons = box.querySelectorAll("[data-e]");
    buttons[k].classList.add(e.ok ? "sd-right" : "sd-wrong");
    if (!e.ok) return void ctx.say(t("Not quite. Read the choices again."));
    buttons.forEach((b) => (b.disabled = true));
    ctx.mark("explain");
    box.insertAdjacentHTML(
      "beforeend",
      `<button type="button" class="sd-btn sd-primary" data-w="go">${esc(t("Show me"))}</button>`,
    );
    box.querySelector('[data-w="go"]').focus();
  }

  function play() {
    if (gate) return;
    if (i >= frames.length - 1) show(0);
    playing = true;
    q('[data-w="play"]').textContent = t("Pause");
    const tick = () => {
      if (!playing) return;
      if (i >= frames.length - 1) return stop();
      show(i + 1);
      if (playing) timer = setTimeout(tick, (2600 + caption(frames[i]).length * 28) / speed);
    };
    timer = setTimeout(tick, 400);
  }
  function stop() {
    playing = false;
    clearTimeout(timer);
    const b = q('[data-w="play"]');
    if (b) b.textContent = t("Play");
  }

  const onClick = (e) => {
    const w = e.target.closest("[data-w]")?.dataset.w;
    const c = e.target.closest("[data-c]");
    const ex = e.target.closest("[data-e]");
    if (c && gate) return choose(Number(c.dataset.c));
    if (ex && gate) return explain(Number(ex.dataset.e));
    if (w === "go") return closeGate();
    if (w === "play") return playing ? stop() : play();
    if (w === "next") return (stop(), show(i + 1));
    if (w === "back") return (stop(), show(i - 1));
    if (w === "replay")
      return (
        stop(),
        (answered.clear(), (gate = null), (q("[data-predict]").hidden = true), show(0))
      );
    if (w === "all") {
      const list = q("[data-all]");
      list.hidden = !list.hidden;
      list.innerHTML = list.hidden ? "" : frames.map((f) => `<li>${esc(caption(f))}</li>`).join("");
      if (!list.hidden) ctx.mark("explore");
    }
  };
  const onKey = (e) => {
    if (e.key === "ArrowRight") (e.preventDefault(), stop(), !gate && show(i + 1));
    else if (e.key === "ArrowLeft") (e.preventDefault(), stop(), show(i - 1));
    else if (e.key === " " && !calm && e.target === stage)
      (e.preventDefault(), playing ? stop() : play());
  };
  root.addEventListener("click", onClick);
  stage.addEventListener("keydown", onKey);
  q('[data-w="speed"]')?.addEventListener("change", (e) => (speed = Number(e.target.value)));
  show(0);
  return () => {
    stop();
    root.removeEventListener("click", onClick);
  };
}
