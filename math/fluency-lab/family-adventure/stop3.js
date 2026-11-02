/* Stop 3 — Learn Together: a practice session between a parent and a child. The family picks what to say at three
 * moments, sees how the child might answer, and ends with the ideal conversation, questions to ask and what to do when stuck. */
import { icon } from "./art.js";
import { BAND_NAME, SCENES, STUCK, bandOf } from "./coach-scenes.js";
import { h, p } from "./core.js";
import { mountModel } from "./models.js";
import { btn, stopHeader, stopNav } from "./ui.js";

const KIND = {
  best: [p("Great move", "Muy buena opción"), "good"],
  ok: [p("Okay, and there is a stronger move", "Está bien, y hay una opción más fuerte"), "mid"],
  avoid: [p("Try a different move", "Prueben otra opción"), "warn"],
};
const T = {
  setup: p("Sam is practicing", "Sam está practicando"),
  setupHelp: p(
    "You are the helper. At each moment, choose what you would say. There is no score, only things to notice.",
    "Ustedes son quienes ayudan. En cada momento, elijan qué dirían. No hay puntaje, solo cosas que observar.",
  ),
  say: p("What do you say?", "¿Qué dicen?"),
  moment: (n) => p(`Moment ${n} of 3`, `Momento ${n} de 3`),
  you: p("You", "Ustedes"),
  strongest: p("Show me the strongest move", "Muéstrennos la opción más fuerte"),
  next: p("Next moment", "Siguiente momento"),
  seeIt: p("See how it ends", "Vean cómo termina"),
  why: p("Why", "Por qué"),
  visual: p("The picture that helps", "El dibujo que ayuda"),
  visualHelp: p(
    "When the child is stuck, a picture or model lets them find the slip themselves.",
    "Cuando el niño o niña se atasca, un dibujo o modelo le deja encontrar el error por sí mismo.",
  ),
  ask: p("Questions you can ask any time", "Preguntas que pueden hacer en cualquier momento"),
  askHelp: p(
    "Ask a question instead of giving the answer. Then wait a few seconds.",
    "Hagan una pregunta en lugar de dar la respuesta. Luego esperen unos segundos.",
  ),
  stuck: p(
    "When your child is stuck or frustrated",
    "Cuando su hijo o hija se atasca o se frustra",
  ),
  again: p("Try it again with different choices", "Intentarlo otra vez con otras opciones"),
  hintLadder: p(
    "Help in small steps: a question first, then a picture, then one small step. Never the answer.",
    "Ayuden en pasos pequeños: primero una pregunta, luego un dibujo, luego un paso pequeño. Nunca la respuesta.",
  ),
};

const bubble = (K, who, pair, cls = "") =>
  h(
    "div",
    { class: `bub bub-${who} ${cls}`.trim() },
    h(
      "span",
      { class: "bub-who", "aria-hidden": "true" },
      who === "child" ? "S" : who === "parent" ? "★" : "",
    ),
    K.bi("p", pair),
  );

export function renderTogether(ctx) {
  const { K, S } = ctx;
  const band = bandOf(S.grade || 3);
  const scene = SCENES[band];
  const root = h("div", { class: "stop stop-together" });
  root.append(stopHeader(ctx, 2));

  root.append(
    h(
      "section",
      { class: "block card setup" },
      K.bi("p", BAND_NAME[band], "chip"),
      K.bi("h2", T.setup, "block-title"),
      h("p", { class: "big-problem", "aria-hidden": "false" }, K.plain(scene.problem)),
      K.bi("p", T.setupHelp, "block-help"),
      K.bi("p", T.hintLadder, "note"),
    ),
  );

  const convo = h("div", {
    class: "convo",
    role: "log",
    "aria-live": "polite",
    "aria-relevant": "additions",
  });
  const actions = h("div", { class: "moment" });
  const after = h("div", { class: "after" });
  root.append(h("section", { class: "block" }, convo, actions), after);

  const draw = (focus) => {
    const step = S.coach.step;
    convo.replaceChildren();
    for (let i = 0; i <= Math.min(step, 2); i += 1) {
      const st = scene.steps[i];
      convo.append(bubble(K, "child", st.child));
      const pick = S.coach.picks[i];
      if (pick !== undefined && (i < step || S.coach.picks[i] !== undefined)) {
        const o = st.options[pick];
        convo.append(bubble(K, "parent", o.say), bubble(K, "child", o.reply));
      }
    }
    actions.replaceChildren();
    after.replaceChildren();
    if (step < 3) drawMoment(step, focus);
    else drawAfter();
  };

  const drawMoment = (i, focus) => {
    const st = scene.steps[i];
    const pick = S.coach.picks[i];
    const picked = pick === undefined ? null : st.options[pick];
    actions.append(h("p", { class: "stop-kicker" }, K.plain(T.moment(i + 1))));
    const q = K.bi("h2", T.say, "block-title");
    q.id = `say-${i}`;
    q.tabIndex = -1;
    actions.append(q);
    const list = h("div", { class: "options", role: "group", "aria-labelledby": q.id });
    st.options.forEach((o, k) => {
      const b = h("button", {
        type: "button",
        class: `option${pick === k ? " is-picked" : ""}`,
        "aria-pressed": String(pick === k),
      });
      b.append(K.bi("span", o.say));
      b.addEventListener("click", () => {
        S.coach.picks[i] = k;
        ctx.save();
        draw(true);
      });
      list.append(b);
    });
    actions.append(list);
    if (picked) {
      const [label, tone] = KIND[picked.kind];
      const fb = h("div", {
        class: `feedback fb-${tone}`,
        role: "status",
        tabindex: "-1",
        id: "fb",
      });
      fb.append(K.bi("strong", label, "fb-label"), K.bi("p", picked.why));
      actions.append(fb);
      const row = h("div", { class: "row" });
      if (picked.kind === "best")
        row.append(
          btn(K, i < 2 ? T.next : T.seeIt, {
            cls: "btn-primary",
            ico: "arrow",
            onClick: () => {
              S.coach.step = i + 1;
              ctx.save();
              draw(true);
            },
          }),
        );
      else
        row.append(
          btn(K, T.strongest, {
            cls: "btn-quiet",
            ico: "bulb",
            onClick: () => {
              S.coach.picks[i] = st.options.findIndex((o) => o.kind === "best");
              ctx.save();
              draw(true);
            },
          }),
        );
      actions.append(row);
      if (focus) queueMicrotask(() => fb.focus());
    } else if (focus) queueMicrotask(() => q.focus());
  };

  const drawAfter = () => {
    ctx.markDone(2);
    convo.append(bubble(K, "child", scene.finale, "bub-win"), bubble(K, "parent", scene.afterQ));
    const vis = h("div", { class: "visual-help" });
    const vhost = h("div", { class: "ch-model" });
    mountModel(scene.model.name, vhost, K, structuredClone(scene.model.props));
    vis.append(K.bi("h2", T.visual, "block-title"), K.bi("p", T.visualHelp, "block-help"), vhost);
    const ask = h("ul", { class: "ask-list" });
    for (const q of scene.questions)
      ask.append(h("li", {}, icon("bulb", "ask-ico"), K.bi("span", q)));
    const stuck = h("ol", { class: "stuck" });
    STUCK.forEach(([a, b]) => stuck.append(h("li", {}, K.bi("strong", a), K.bi("span", b))));
    after.append(
      h("section", { class: "block card" }, vis),
      h(
        "section",
        { class: "block card" },
        K.bi("h2", T.ask, "block-title"),
        K.bi("p", T.askHelp, "block-help"),
        ask,
      ),
      h("section", { class: "block card stuck-card" }, K.bi("h2", T.stuck, "block-title"), stuck),
      h(
        "div",
        { class: "row" },
        btn(K, T.again, {
          cls: "btn-quiet",
          onClick: () => {
            S.coach = { step: 0, picks: [] };
            ctx.save();
            draw(true);
          },
        }),
      ),
    );
  };

  draw(false);
  root.append(stopNav(ctx, 2));
  return root;
}
