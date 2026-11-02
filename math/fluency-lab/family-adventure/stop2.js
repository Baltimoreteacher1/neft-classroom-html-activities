/* Stop 2 — Discover how math works: the seven hands-on models in free play, and one grade-matched challenge. */
import { mountChallenge } from "./challenge.js";
import { h, p } from "./core.js";
import { FREE_PLAY, defaultTab, mountModel } from "./models.js";
import { stopHeader, stopNav } from "./ui.js";

const CPA = [
  [p("Touch it", "Tócalo"), p("Move real objects.", "Mueve objetos reales.")],
  [p("Picture it", "Dibújalo"), p("See the idea in a model.", "Mira la idea en un modelo.")],
  [p("Write it", "Escríbelo"), p("Say it with numbers.", "Dilo con números.")],
];
const T_CPA = p("How the Lab teaches an idea", "Cómo enseña una idea el Laboratorio");
const T_PLAY = p("Try the models", "Prueben los modelos");
const T_PLAY_HELP = p(
  "These are the same kinds of tools your child meets in the Lab. Push, tap and see what changes.",
  "Son los mismos tipos de herramientas que su hijo o hija encuentra en el Laboratorio. Toquen, muevan y vean qué cambia.",
);
const T_CHALLENGE = p("A challenge picked for grade", "Un reto elegido para el grado");
const T_NEED = p(
  "Choose a grade on the first stop to see its challenge.",
  "Elijan un grado en la primera parada para ver su reto.",
);

export function renderDiscover(ctx) {
  const { K, S } = ctx;
  const root = h("div", { class: "stop stop-discover" });
  root.append(stopHeader(ctx, 1));

  const cpa = h("ol", { class: "cpa" });
  CPA.forEach(([a, b], i) =>
    cpa.append(
      h(
        "li",
        {},
        h("span", { class: "cpa-n", "aria-hidden": "true" }, String(i + 1)),
        K.bi("strong", a),
        K.bi("span", b),
      ),
    ),
  );
  root.append(h("section", { class: "block" }, K.bi("h2", T_CPA, "block-title"), cpa));

  // The grade challenge.
  const grade = S.grade || 3;
  const ch = h("section", { class: "block challenge", "aria-labelledby": "ch-title" });
  const t = K.bi(
    "h2",
    { en: `${T_CHALLENGE.en} ${grade}`, es: `${T_CHALLENGE.es} ${grade}` },
    "block-title",
  );
  t.id = "ch-title";
  ch.append(t);
  if (!S.grade) ch.append(K.bi("p", T_NEED, "note"));
  const host = h("div", { class: "ch-host" });
  ch.append(host);
  root.append(ch);
  mountChallenge(host, {
    K,
    state: S,
    grade,
    save: ctx.save,
    memory: ctx.memory,
    onSolved: () => ctx.markDone(1),
  });

  // Free play.
  const tabs = h("div", { class: "tabs", role: "tablist", "aria-label": K.plain(T_PLAY) });
  const stage = h("div", { class: "play-stage", role: "tabpanel" });
  const play = h(
    "section",
    { class: "block" },
    K.bi("h2", T_PLAY, "block-title"),
    K.bi("p", T_PLAY_HELP, "block-help"),
    tabs,
    stage,
  );
  const order = FREE_PLAY.slice().sort(
    (a, b) =>
      (a.grades[0] <= grade && grade <= a.grades[1] ? -1 : 1) -
      (b.grades[0] <= grade && grade <= b.grades[1] ? -1 : 1),
  );
  let current = ctx.memory.tab || defaultTab(grade);
  const open = (id, focus) => {
    current = id;
    ctx.memory.tab = id;
    const def = FREE_PLAY.find((f) => f.id === id);
    stage.replaceChildren();
    mountModel(def.id, stage, K, structuredClone(def.props));
    tabs.querySelectorAll("button").forEach((b) => {
      const on = b.dataset.id === id;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
      if (on) {
        stage.setAttribute("aria-labelledby", b.id);
        if (focus) b.focus();
      }
    });
  };
  for (const def of order) {
    const b = h(
      "button",
      { type: "button", role: "tab", id: `tab-${def.id}`, class: "tab", data: { id: def.id } },
      K.plain(def.label),
    );
    b.addEventListener("click", () => open(def.id));
    tabs.append(b);
  }
  tabs.addEventListener("keydown", (e) => {
    const list = [...tabs.querySelectorAll("button")];
    const i = list.findIndex((b) => b.dataset.id === current);
    const move = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (move) {
      e.preventDefault();
      open(list[(i + move + list.length) % list.length].dataset.id, true);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      open(list[e.key === "Home" ? 0 : list.length - 1].dataset.id, true);
    }
  });
  root.append(play);
  open(current);
  root.append(stopNav(ctx, 1));
  return root;
}
