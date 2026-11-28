// The source engines supply the drawing, legal model moves, and bilingual descriptions.
import { pick, svgAlt, svgIn } from "../../../math/fluency-lab/studio/core.js";
import { eqIn } from "../../../math/fluency-lab/studio/eq-language.js";
import { framesOf, hasBuild, lessonFor, repsOf } from "../../../math/fluency-lab/studio/engines.js";
import { h } from "./ui-kit.js";

function drawPicture(host, picture, lang) {
  host.innerHTML = svgIn(svgAlt(picture.svg, picture.alt, lang), lang);
}

export function mountWorkedExample(host, item, { lang, question, guided = true, speak }) {
  const phrase = (en, es) => lang === "es" ? es : en;
  const lesson = lessonFor(item);
  const representations = lesson ? repsOf(lesson) : [];
  const heading = h("h3", { tabindex: "-1" }, phrase("Worked example", "Ejemplo resuelto"));
  const problem = h("p", { lang: question.lang }, question.text);
  const visual = h("div", { class: "ml-man-svg" });
  const status = h("p", { "aria-live": "polite" });
  const caption = h("p");
  const equation = h("p", { class: "ml-man-sum" });
  const prev = h("button", { type: "button", class: "btn small" }, phrase("Previous step", "Paso anterior"));
  const next = h("button", { type: "button", class: "btn btn-primary" }, phrase("Next step", "Paso siguiente"));
  const controls = h("div", { class: "ml-inline" }, prev, next);
  const say = h("button", { type: "button", class: "btn small" }, phrase("Read this step aloud", "Leer este paso en voz alta"));
  const options = representations.length > 1
    ? h("select", {},
        ...representations.map((rep) => h("option", { value: rep },
          ({ table: phrase("Table", "Tabla"), line: phrase("Number line", "Recta numérica"), bars: phrase("Bars", "Barras"), chips: phrase("Counters", "Fichas") })[rep] || rep,
        )),
      )
    : null;
  const steps = (rep) => lesson?.modeled
    ? framesOf(lesson, rep)
    : item.steps.map((step) => ({ cap: { en: step, es: step }, englishOnly: true }));
  let index = 0;
  let frames = steps(representations[0]);
  let build;
  const controller = new AbortController();
  const { signal } = controller;

  function show() {
    const frame = frames[index];
    if (!frame) return;
    status.textContent = phrase(`Step ${index + 1} of ${frames.length}`, `Paso ${index + 1} de ${frames.length}`);
    caption.textContent = pick(frame.cap, lang);
    caption.lang = frame.englishOnly ? "en" : lang;
    if (frame.svg) drawPicture(visual, frame, lang);
    equation.textContent = eqIn(frame.eq, lang);
    equation.hidden = !frame.eq;
    prev.disabled = index === 0;
    next.disabled = index === frames.length - 1;
  }
  prev.addEventListener("click", () => {
    index -= 1;
    show();
    if (prev.disabled) next.focus();
  }, { signal });
  next.addEventListener("click", () => {
    index += 1;
    show();
    if (next.disabled) prev.focus();
  }, { signal });
  options?.addEventListener("change", () => {
    frames = steps(options.value);
    index = 0;
    show();
  }, { signal });
  say.addEventListener("click", () => speak(caption.textContent, caption.lang), { signal });
  host.replaceChildren(heading, problem);
  if (!lesson?.modeled && lang === "es") host.append(h("p", {}, "Los pasos de este ejemplo están en inglés."));
  if (options) host.append(h("label", { class: "ml-inline" }, phrase("Representation", "Representación"), options));
  host.append(visual, status, caption, equation, controls, say);
  if (guided && lesson && hasBuild(lesson)) {
    build = h("details", {}, h("summary", {}, phrase("Try moves on this model", "Prueba movimientos en este modelo")));
    build.addEventListener("toggle", () => {
      if (build.open && build.children.length === 1) mountBuild(build, lesson, lang, signal);
    }, { signal });
    host.append(build);
  }
  show();
  return () => {
    controller.abort();
    host.replaceChildren();
  };
}

function mountBuild(host, { engine, spec }, lang, signal) {
  const b = engine.build;
  const phrase = (en, es) => lang === "es" ? es : en;
  let state = b.init(spec);
  const prompt = typeof b.prompt === "function" ? b.prompt(spec) : b.prompt;
  const picture = h("div", { class: "ml-man-svg" });
  const status = h("p", { "aria-live": "polite" });
  const moves = h("div", { class: "ml-inline", role: "group", "aria-label": phrase("Model moves", "Movimientos del modelo") });
  const reset = h("button", { type: "button", class: "btn small" }, phrase("Reset model", "Reiniciar modelo"));

  function draw(message, focusIndex) {
    const view = b.render(state, spec);
    drawPicture(picture, view, lang);
    status.textContent = pick(message || view.status, lang) || "";
    moves.replaceChildren(...view.controls.map((c, i) => h("button", {
      class: "btn small", type: "button", "data-fluency-move": i,
    }, pick(c.label, lang))));
    if (focusIndex != null) (moves.children[Math.min(focusIndex, moves.children.length - 1)] || reset).focus();
    moves.current = view.controls;
  }

  moves.addEventListener("click", (event) => {
    const button = event.target.closest("[data-fluency-move]");
    if (!button) return;
    const index = Number(button.dataset.fluencyMove);
    const move = moves.current[index];
    const result = b.act(state, move.id, move.arg, spec);
    state = result.state;
    draw(result.msg, index);
  }, { signal });
  reset.addEventListener("click", () => {
    state = b.init(spec);
    draw();
  }, { signal });
  host.append(h("p", {}, pick(prompt, lang)), picture, status, moves, reset);
  draw();
}
