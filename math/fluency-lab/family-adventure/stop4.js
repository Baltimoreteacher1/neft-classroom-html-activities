/* Stop 4 — Explore the Math Fluency Lab: each real tool, a picture with hotspots, and a link to the page it describes. */
import { icon } from "./art.js";
import { h, p } from "./core.js";
import { HOTSPOTS, preview } from "./previews.js";
import { destinations, labSkillFor } from "./routes.js";
import { btn, stopHeader, stopNav } from "./ui.js";

/* key matches destinations(): the link each card opens. */
const FEATURES = [
  {
    id: "daily",
    dest: "daily",
    ico: "star",
    title: p("Today's 10", "Today's 10 (los 10 de hoy)"),
    what: p(
      "A mix chosen for today: a skill you are building, a few to remember, and one new idea.",
      "Una mezcla elegida para hoy: una habilidad que están desarrollando, algunas para recordar y una idea nueva.",
    ),
    open: p("Open Today's 10", "Abrir Today's 10"),
  },
  {
    id: "games",
    dest: "games",
    ico: "grid",
    title: p("Game Room", "Sala de juegos"),
    what: p(
      "Untimed games that practice the same ideas in a playful way.",
      "Juegos sin tiempo que practican las mismas ideas de forma divertida.",
    ),
    open: p("Open the Game Room", "Abrir la sala de juegos"),
  },
  {
    id: "visual",
    dest: "visual",
    ico: "eye",
    title: p("Visual lessons", "Lecciones visuales"),
    what: p(
      "Open any skill and start with a picture. Short steps connect the model to the numbers.",
      "Abran cualquier habilidad y empiecen con un dibujo. Pasos cortos conectan el modelo con los números.",
    ),
    open: p("Open a skill with a visual lesson", "Abrir una habilidad con lección visual"),
  },
  {
    id: "scratchpad",
    dest: "scratchpad",
    ico: "pencil",
    title: p("Scratchpad", "Borrador"),
    what: p(
      "Inside every skill: a page to write steps, sketch and keep track of work.",
      "Dentro de cada habilidad: una hoja para escribir pasos, dibujar y llevar la cuenta.",
    ),
    open: p("Open a skill with the scratchpad", "Abrir una habilidad con el borrador"),
  },
  {
    id: "mistakes",
    dest: "mistakes",
    ico: "wrench",
    title: p("Fix my mistakes", "Corregir mis errores"),
    what: p(
      "A mistake becomes a fresh problem on the same idea, so it can be fixed for real.",
      "Un error se convierte en un problema nuevo de la misma idea, para corregirlo de verdad.",
    ),
    open: p("Open Fix my mistakes", "Abrir Corregir mis errores"),
  },
  {
    id: "progress",
    dest: "progress",
    ico: "chart",
    title: p("My progress", "Mi progreso"),
    what: p(
      "Stars, streaks and the skills your child remembers, saved on this device.",
      "Estrellas, rachas y las habilidades que su hijo o hija ya recuerda, guardadas en este dispositivo.",
    ),
    open: p("Open My progress", "Abrir Mi progreso"),
  },
  {
    id: "family",
    dest: "familyHome",
    ico: "home",
    title: p("Family activities", "Actividades en familia"),
    what: p(
      "Short games to play together and real-world activities to try at home.",
      "Juegos cortos para jugar juntos y actividades de la vida real para hacer en casa.",
    ),
    open: p("Open Family Math", "Abrir Matemáticas en familia"),
  },
  {
    id: "write",
    dest: "write",
    ico: "pencil",
    title: p("Write about math", "Escribir sobre matemáticas"),
    what: p(
      "A writing room for explaining a problem in words. Nothing is graded.",
      "Un espacio para explicar un problema con palabras. Nada se califica.",
    ),
    open: p("Open the writing room", "Abrir el espacio de escritura"),
  },
];
const T = {
  lead2: p(
    "Tap “Show me” to see where things live. Tap a numbered dot to learn what it is.",
    "Toquen «Mostrar» para ver dónde está cada cosa. Toquen un punto numerado para saber qué es.",
  ),
  show: p("Show me", "Mostrar"),
  hide: p("Hide the picture", "Ocultar el dibujo"),
  tipHint: p("Tap a numbered dot", "Toquen un punto numerado"),
  picture: p("Picture of", "Dibujo de"),
  guided: p(
    "Want a guided walk inside the Lab itself?",
    "¿Quieren un recorrido guiado dentro del Laboratorio?",
  ),
  guidedGo: p("Show me how, inside the Lab", "Muéstrennos cómo, dentro del Laboratorio"),
  report: p("Your child's progress report", "Informe de progreso de su hijo o hija"),
};

export function renderExplore(ctx) {
  const { K, S } = ctx;
  const grade = S.grade || 3;
  const root = h("div", { class: "stop stop-explore" });
  root.append(stopHeader(ctx, 3));
  root.append(K.bi("p", T.lead2, "block-help lead2"));

  const links = [];
  const deck = h("div", { class: "features" });
  const dest = (labSkill) =>
    destinations({ grade, profile: ctx.profile(), mode: ctx.mode(), labSkill });
  const initial = dest("");

  for (const f of FEATURES) {
    const art = h("div", { class: "feat-art", hidden: true });
    const caption = h(
      "p",
      { class: "feat-tip", role: "status", "aria-live": "polite" },
      K.plain(T.tipHint),
    );
    const stage = h("div", { class: "feat-stage" }, preview(f.id));
    HOTSPOTS[f.id].forEach(([x, y, tip], n) => {
      const dot = h(
        "button",
        {
          type: "button",
          class: "hot",
          style: `left:${x}%;top:${y}%`,
          "aria-label": `${n + 1}: ${K.plain(tip)}`,
        },
        String(n + 1),
      );
      dot.addEventListener("click", () => {
        caption.textContent = K.plain(tip);
        stage.querySelectorAll(".hot").forEach((d) => d.classList.toggle("on", d === dot));
      });
      stage.append(dot);
    });
    art.append(stage, caption);
    const toggle = h(
      "button",
      { type: "button", class: "btn btn-quiet feat-show", "aria-expanded": "false" },
      icon("eye", "btn-ico"),
      K.plain(T.show),
    );
    toggle.addEventListener("click", () => {
      const open = art.hidden;
      art.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.lastChild.textContent = K.plain(open ? T.hide : T.show);
    });
    const open = btn(K, f.open, { href: initial[f.dest], cls: "btn-primary", ico: "link" });
    if (f.dest === "visual" || f.dest === "scratchpad") links.push([open, f.dest]);
    deck.append(
      h(
        "article",
        { class: "feature", id: `feat-${f.id}` },
        h(
          "header",
          { class: "feat-head" },
          icon(f.ico, "feat-ico"),
          K.bi("h2", f.title, "feat-title"),
        ),
        K.bi("p", f.what, "feat-what"),
        h("div", { class: "row" }, open, toggle),
        art,
      ),
    );
  }
  root.append(deck);

  const d = dest("");
  root.append(
    h(
      "section",
      { class: "block card" },
      K.bi("h2", T.guided, "block-title"),
      h(
        "div",
        { class: "row" },
        btn(K, T.guidedGo, { href: d.tourFamily, ico: "link" }),
        btn(K, T.report, { href: d.familyProgress, cls: "btn-quiet", ico: "chart" }),
      ),
    ),
  );
  root.append(stopNav(ctx, 3));

  // The skill-based links need a real skill id for this grade.
  labSkillFor(grade)
    .then((skill) => {
      if (!skill) return;
      const real = dest(skill);
      for (const [a, key] of links) a.href = real[key];
    })
    .catch(() => {});
  return root;
}
