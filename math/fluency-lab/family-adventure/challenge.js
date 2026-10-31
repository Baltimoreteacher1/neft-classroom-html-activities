/* The Stop 2 challenge: build it (concrete), answer it with the picture in view (representational), explain why
 * (abstract). Wrong answers get feedback that names the misconception, hints come one at a time, and a child can
 * revise and retry or ask for a fresh version. Nothing here shows the answer before a real attempt. */
import { h, p } from "./core.js";
import { ITEMS } from "./math-items.js";
import { mountModel } from "./models.js";

const C = {
  build: p("Build it", "Constrúyelo"),
  buildSub: p("Use the model with your hands.", "Usa el modelo con tus manos."),
  answer: p("Answer it", "Respóndelo"),
  explain: p("Explain it", "Explícalo"),
  nice: p(
    "You built it. Keep the picture in view.",
    "Lo construiste. Mantén el dibujo a la vista.",
  ),
  buildHelp: p("Show me how", "Muéstrame cómo"),
  buildSkip: p("Skip building", "Saltar la construcción"),
  buildNudge: p(
    "Try the buttons on the model until the picture matches the task.",
    "Prueba los botones del modelo hasta que el dibujo coincida con la tarea.",
  ),
  next: p("Next", "Siguiente"),
  check: p("Check my answer", "Comprobar mi respuesta"),
  pick: p("Pick an answer first.", "Primero elige una respuesta."),
  pickReason: p("Pick a reason first.", "Primero elige una razón."),
  hint: p("Give me a hint", "Dame una pista"),
  hintGated: p("Hint 3 opens after one try", "La pista 3 se abre después de un intento"),
  hintN: (n) => p(`Hint ${n} of 3`, `Pista ${n} de 3`),
  noMoreHints: p("That was the last hint.", "Esa fue la última pista."),
  tryAgain: p(
    "Not yet. Look again and try once more.",
    "Todavía no. Mira otra vez e inténtalo de nuevo.",
  ),
  right: p("That is right.", "Correcto."),
  reasonQ: p("Which sentence explains why?", "¿Qué oración explica por qué?"),
  reasonRight: p("Yes. That reason matches the model.", "Sí. Esa razón coincide con el modelo."),
  rightButReason: p(
    "Your answer is right. Now check that your reason fits it.",
    "Tu respuesta es correcta. Ahora revisa que tu razón encaje.",
  ),
  workedTitle: p("Here is one way to see it", "Una manera de verlo"),
  revised: p(
    "You looked again and fixed your thinking. That is what mathematicians do.",
    "Volviste a mirar y corregiste tu razonamiento. Eso hacen los matemáticos.",
  ),
  doneTitle: p("You did all three steps", "Completaste los tres pasos"),
  doneLead: p(
    "You built it, answered it and explained why.",
    "Lo construiste, lo respondiste y explicaste por qué.",
  ),
  asMath: p("Written as math:", "Escrito con matemáticas:"),
  fresh: p("Try a fresh one", "Probar uno nuevo"),
  watch: p("Parents: an idea to watch for", "Familias: una idea para observar"),
  words: p("Math words", "Palabras de matemáticas"),
  q: p("The question", "La pregunta"),
};

const label = (K, value) => (typeof value === "string" ? value : K.bi("span", value));
const valueKey = (value) => (typeof value === "string" ? value : value.en);

export function mountChallenge(host, ctx) {
  const { K, state, grade, save, memory, onSolved } = ctx;
  const item = ITEMS[grade];
  const rec = (state.challenge[grade] ||= { variant: 0, solved: false, revised: false });
  const v = item.variants[rec.variant];
  let stage = rec.solved ? "done" : "build";
  let wrong = 0;
  let hints = 0;
  let revealed = false;
  let chosen = null;
  const slot = `model:${grade}:${rec.variant}`;
  const modelHost = h("div", { class: "ch-model" });
  const panel = h("div", { class: "ch-panel" });
  host.append(
    h(
      "div",
      { class: "ch-grid" },
      h(
        "div",
        { class: "ch-stage", role: "group", "aria-label": K.plain(item.skill) },
        K.bi("p", item.skill, "ch-skill"),
        modelHost,
      ),
      panel,
    ),
  );

  const model = mountModel(item.model, modelHost, K, {
    ...v.props,
    initial: memory[slot] || v.props.initial,
    onChange: (s) => {
      memory[slot] = s;
      if (stage === "build" && v.build.ok(s)) advanceFromBuild();
    },
    showMissing: false,
    masked: !rec.solved,
  });

  const stepHead = (n, title) =>
    h(
      "header",
      { class: "ch-head" },
      h("span", { class: "ch-n", "aria-hidden": "true" }, String(n)),
      K.bi("h3", title, "ch-title"),
    );
  const live = h("div", { class: "ch-live", role: "status", "aria-live": "polite" });
  const say = (pair, tone = "info") => {
    live.className = `ch-live ch-${tone}`;
    live.replaceChildren(K.bi("p", pair));
  };
  const focusHead = () => queueMicrotask(() => panel.querySelector("h3")?.focus());
  const button = (pair, onClick, cls = "btn") => {
    const b = h("button", { type: "button", class: cls });
    b.append(K.bi("span", pair));
    b.addEventListener("click", onClick);
    return b;
  };

  function advanceFromBuild() {
    stage = "answer";
    render(true);
    say(C.nice, "good");
  }

  function renderBuild() {
    panel.append(stepHead(1, C.build));
    panel.querySelector("h3").tabIndex = -1;
    panel.append(K.bi("p", v.build.prompt, "ch-task"), K.bi("p", C.buildSub, "ch-sub"));
    const help = button(C.buildHelp, () => say(C.buildNudge), "btn btn-quiet");
    const skip = button(C.buildSkip, advanceFromBuild, "btn btn-quiet");
    panel.append(h("div", { class: "ch-actions" }, help, skip), live);
  }

  function renderChoices(list, name, onPick, isReason) {
    const fs = h(
      "fieldset",
      { class: "ch-choices" },
      h("legend", { class: "sr-only" }, K.plain(isReason ? C.reasonQ : v.q)),
    );
    // Rotate the options so the right one is never first, and varies by grade and version.
    const n = list.length;
    const rot = 1 + ((grade + rec.variant + (isReason ? 1 : 0)) % (n - 1));
    const order = Array.from({ length: n }, (_, k) => (k + rot) % n);
    order.forEach((i) => {
      const [value] = list[i];
      const id = `${name}-${i}`;
      const input = h("input", { type: "radio", name, id, value: String(i) });
      input.addEventListener("change", () => onPick(i));
      const body = isReason
        ? K.bi("span", value, "ch-choice-text")
        : h("span", { class: "ch-choice-text" }, label(K, value));
      fs.append(h("label", { class: "ch-choice", for: id, data: { i: String(i) } }, input, body));
    });
    return fs;
  }

  function renderAnswer() {
    panel.append(stepHead(2, C.answer));
    panel.querySelector("h3").tabIndex = -1;
    panel.append(K.bi("p", v.q, "ch-q"));
    panel.append(renderChoices(v.choices, "ans", (i) => (chosen = i), false));
    const gated = hints === 2 && wrong === 0;
    const hintBtn = button(
      gated ? C.hintGated : hints ? C.hintN(Math.min(hints + 1, 3)) : C.hint,
      giveHint,
      "btn btn-quiet",
    );
    hintBtn.disabled = hints >= 3 || gated;
    panel.append(
      h("div", { class: "ch-actions" }, button(C.check, checkAnswer, "btn btn-primary"), hintBtn),
      live,
    );
    if (hints) {
      const box = h("ol", { class: "ch-hints" });
      for (let k = 0; k < hints; k += 1) box.append(h("li", {}, K.bi("span", v.hints[k])));
      panel.append(box);
    }
    if (revealed) panel.append(workedBox());
  }

  function giveHint() {
    if (hints >= 3) return say(C.noMoreHints);
    if (hints === 2 && wrong === 0) return;
    hints += 1;
    render(false);
    say(C.hintN(hints), "info");
  }

  function workedBox() {
    return h(
      "div",
      { class: "ch-worked" },
      K.bi("strong", C.workedTitle),
      K.bi("p", v.worked),
      h("p", { class: "m-equation", "aria-hidden": "true" }, v.equation),
    );
  }

  function checkAnswer() {
    if (chosen === null) return say(C.pick, "warn");
    const note = v.choices[chosen][1];
    if (note === null) {
      stage = "explain";
      chosen = null;
      render(true);
      say(C.rightButReason, "good");
      return;
    }
    wrong += 1;
    if (wrong >= 2 && hints < wrong) hints = Math.min(3, wrong);
    if (wrong >= 3 && !revealed) {
      revealed = true;
      rec.revised = true;
      save();
    }
    render(false, note);
  }

  function renderExplain() {
    panel.append(stepHead(3, C.explain));
    panel.querySelector("h3").tabIndex = -1;
    panel.append(K.bi("p", C.reasonQ, "ch-q"));
    panel.append(renderChoices(v.reasons, "why", (i) => (chosen = i), true));
    panel.append(
      h("div", { class: "ch-actions" }, button(C.check, checkReason, "btn btn-primary")),
      live,
    );
    if (revealed) panel.append(workedBox());
  }

  function checkReason() {
    if (chosen === null) return say(C.pickReason, "warn");
    const [, note] = v.reasons[chosen];
    if (note === null) {
      stage = "done";
      rec.solved = true;
      save();
      render(true);
      onSolved?.();
      return;
    }
    rec.revised = true;
    render(false, note);
  }

  function renderDone() {
    model.reveal?.();
    panel.append(stepHead("✓", C.doneTitle));
    panel.querySelector("h3").tabIndex = -1;
    panel.append(
      K.bi("p", C.doneLead, "ch-q"),
      h(
        "div",
        { class: "ch-eq" },
        K.bi("span", C.asMath, "ch-eq-label"),
        h("strong", { class: "ch-eq-val" }, v.equation),
      ),
    );
    if (rec.revised) panel.append(K.bi("p", C.revised, "ch-note ch-good"));
    panel.append(h("div", { class: "ch-watch" }, K.bi("strong", C.watch), K.bi("p", item.watch)));
    const words = h("dl", { class: "ch-words" });
    for (const [term, meaning] of item.vocab)
      words.append(h("dt", {}, K.bi("span", term)), h("dd", {}, K.bi("span", meaning)));
    panel.append(h("div", { class: "ch-vocab" }, K.bi("strong", C.words), words));
    panel.append(h("div", { class: "ch-actions" }, button(C.fresh, fresh, "btn btn-quiet")));
  }

  function fresh() {
    rec.variant = rec.variant ? 0 : 1;
    rec.solved = false;
    save();
    host.replaceChildren();
    mountChallenge(host, ctx);
  }

  /** `note` is a misconception note to show, as feedback, after the panel is redrawn. */
  function render(focus, note) {
    chosen = null;
    panel.replaceChildren();
    live.className = "ch-live";
    live.replaceChildren();
    if (stage === "build") renderBuild();
    else if (stage === "answer") renderAnswer();
    else if (stage === "explain") renderExplain();
    else renderDone();
    if (note) {
      live.className = "ch-live ch-warn";
      live.replaceChildren(K.bi("p", C.tryAgain), K.bi("p", note, "ch-note"));
    }
    if (focus) focusHead();
  }
  render(false);
  return { destroy: () => host.replaceChildren() };
}
