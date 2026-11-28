// K-2 starters (/activity-studio/k2): ready-made activities for kindergarten to grade 2, in one place a teacher of
// young children finds first. Filter by grade and topic, read what children do, press "Use this activity": the
// starter is copied into a draft through the customize route (adapters/k2-starters.js), so the teacher can change
// anything, preview it as a student and share it. The starter data is loaded when this screen opens.

import { button, clear, h } from "./ui.js";

const GRADE_LABEL = {
  K: ["Kindergarten", "Kínder"],
  1: ["Grade 1", "1.º grado"],
  2: ["Grade 2", "2.º grado"],
};

/** The Studio home's entry point for K-2 teachers. */
export function k2Callout({ S, onGo }) {
  return h(
    "section.st-callout.st-k2-callout",
    { "aria-labelledby": "st-k2-callout-title" },
    h(
      "h2",
      { id: "st-k2-callout-title" },
      h("span", { "aria-hidden": "true" }, "🧸 "),
      S("K-2 starters", "Inicio rápido K-2"),
    ),
    h(
      "p",
      S(
        "Ready-made activities for kindergarten to grade 2: phonics, early math and oral language, with pictures and read-aloud on every question.",
        "Actividades listas para kínder a 2.º grado: fonética, matemáticas iniciales y lenguaje oral, con dibujos y lectura en voz alta en cada pregunta.",
      ),
    ),
    button(S("Browse K-2 starters", "Ver actividades K-2"), onGo, "primary", {
      "data-act": "k2-callout",
    }),
  );
}

/**
 * @param {{ S, onUse: (ref: string) => void, q?: {grade?: string, topic?: string}, content?: object }} opts
 * `content` is for tests; by default it is imported from src/content/k2-studio.
 */
export function k2Screen({ S, onUse, q = {}, content }) {
  const root = h("section.st-k2", { "aria-labelledby": "st-k2-title" });
  const state = { data: null, grade: "", topic: "", error: false };
  const status = h("p.st-status", { role: "status", "aria-live": "polite" });
  const list = h("ul.st-k2-grid");

  const loc = (v) => S(v.en, v.es);
  const pressed = (on) => String(Boolean(on));

  function filterGroup(label, options, key) {
    const group = h("div.st-k2-filter", { role: "group", "aria-label": label });
    for (const [value, text] of options)
      group.append(
        h(
          "button.st-chip-btn",
          {
            type: "button",
            "aria-pressed": pressed(state[key] === value),
            "data-filter": `${key}:${value || "all"}`,
            onclick: () => {
              state[key] = value;
              for (const b of group.querySelectorAll("button"))
                b.setAttribute(
                  "aria-pressed",
                  pressed(b.dataset.filter === `${key}:${value || "all"}`),
                );
              drawList();
            },
          },
          text,
        ),
      );
    return group;
  }

  function card(s) {
    const d = state.data;
    const topic = d.TOPICS[s.topic];
    const questions = s.activity.blocks.filter((b) => b.type === "question").length;
    const titleId = `st-k2-${s.id}`;
    return h(
      "li.st-k2-card",
      { "data-starter": s.id, "aria-labelledby": titleId },
      h("span.st-k2-art", { "aria-hidden": "true" }, s.art),
      h("h3", { id: titleId }, s.activity.title),
      h(
        "p.st-k2-meta",
        [
          S(...GRADE_LABEL[s.grade]),
          loc(topic),
          S(`about ${s.minutes} min`, `unos ${s.minutes} min`),
          S(`${questions} questions`, `${questions} preguntas`),
        ].join(" · "),
      ),
      h("p", s.activity.description),
      h(
        "ul.st-k2-does",
        { "aria-label": S("What children do", "Lo que hacen los niños") },
        s.does.map((k) =>
          h("li", h("span", { "aria-hidden": "true" }, `${d.DOES[k].art} `), loc(d.DOES[k])),
        ),
      ),
      button(S("Use this activity", "Usar esta actividad"), () => onUse(s.id), "primary", {
        "aria-label": S(
          `Use this activity: ${s.activity.title}`,
          `Usar esta actividad: ${s.activity.title}`,
        ),
        "data-ref": s.id,
      }),
    );
  }

  function drawList() {
    const found = state.data.K2_STARTERS.filter(
      (s) => (!state.grade || s.grade === state.grade) && (!state.topic || s.topic === state.topic),
    );
    clear(list).append(...found.map(card));
    status.textContent = S(`${found.length} activities`, `${found.length} actividades`);
  }

  function draw() {
    clear(root);
    const head = h(
      "h1",
      { id: "st-k2-title", tabindex: "-1" },
      S("K-2 starter activities", "Actividades iniciales K-2"),
    );
    if (!state.data)
      return root.append(
        head,
        state.error
          ? h(
              "p.st-needs",
              S(
                "The starters could not be loaded. Try again in a moment.",
                "No se pudieron cargar las actividades. Intente de nuevo en un momento.",
              ),
            )
          : h("p", { role: "status" }, S("Loading…", "Cargando…")),
      );
    const d = state.data;
    root.append(
      head,
      h(
        "p.st-k2-lede",
        S(
          "Made for young learners: a picture on every choice, a Hear button on every question, big buttons and no timers. Pick one, change anything, then preview and share it. The original stays as it is.",
          "Hechas para los más pequeños: un dibujo en cada opción, un botón Escuchar en cada pregunta, botones grandes y sin relojes. Elija una, cambie lo que quiera, luego revísela y compártala. El original no cambia.",
        ),
      ),
      h(
        "div.st-k2-filters",
        filterGroup(
          S("Grade", "Grado"),
          [
            ["", S("All grades", "Todos los grados")],
            ...d.K2_GRADES.map((g) => [g, S(...GRADE_LABEL[g])]),
          ],
          "grade",
        ),
        filterGroup(
          S("Topic", "Tema"),
          [
            ["", S("All topics", "Todos los temas")],
            ...Object.entries(d.TOPICS).map(([id, t]) => [id, `${t.art} ${loc(t)}`]),
          ],
          "topic",
        ),
      ),
      status,
      list,
    );
    drawList();
  }

  async function load() {
    try {
      state.data = content || (await import("../../content/k2-studio/index.js"));
      if (state.data.K2_GRADES.includes(q.grade)) state.grade = q.grade;
      if (Object.hasOwn(state.data.TOPICS, q.topic || "")) state.topic = q.topic;
    } catch {
      state.error = true;
    }
    draw();
  }
  draw();
  load();
  return root;
}
