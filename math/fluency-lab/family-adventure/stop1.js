/* Stop 1 — Welcome to Math Adventure: the guide, a grade, what the Lab is, and the route ahead. */
import { guide, icon, routeMap, scene } from "./art.js";
import { COPY, STOPS } from "./copy.js";
import { GRADES, h, p } from "./core.js";
import { btn } from "./ui.js";

const WHAT = [
  [
    "clock",
    p("Short and calm", "Corto y tranquilo"),
    p(
      "A visit is 5 to 10 minutes. There is no timer to beat.",
      "Una visita dura de 5 a 10 minutos. No hay cronómetro que vencer.",
    ),
  ],
  [
    "eye",
    p("See it, then do it", "Verlo y luego hacerlo"),
    p(
      "Pictures and models come first, so the idea makes sense before the rules.",
      "Primero van los dibujos y modelos, para que la idea tenga sentido antes que las reglas.",
    ),
  ],
  [
    "heart",
    p("Mistakes help", "Los errores ayudan"),
    p(
      "A mistake shows the Lab what to practice next. Nobody loses points for trying.",
      "Un error le muestra al Laboratorio qué practicar después. Nadie pierde puntos por intentar.",
    ),
  ],
];

const GRADE_Q = p("What grade is your child in?", "¿En qué grado está su hijo o hija?");
const GRADE_HELP = p(
  "We use it to pick math that fits. You can change it any time.",
  "Lo usamos para elegir matemáticas a su medida. Pueden cambiarlo cuando quieran.",
);
const WHAT_Q = p("What is the Math Fluency Lab?", "¿Qué es el Laboratorio de fluidez matemática?");
const WHAT_LEAD = p(
  "A free practice space for grades 1 to 8: skills, games, visual lessons and a place to fix mistakes. The pages work in English and Spanish (math questions stay in English, with a Spanish peek), and progress is saved on your device.",
  "Un espacio gratuito de práctica de 1.er a 8.º grado: habilidades, juegos, lecciones visuales y un lugar para corregir errores. Las páginas funcionan en inglés y español (las preguntas de matemáticas quedan en inglés, con una ayuda en español) y el progreso se guarda en su dispositivo.",
);
const ROUTE_Q = p("Your route", "Su ruta");
const FREE_HELP = p(
  "Prefer to look around first? Open the map.",
  "¿Prefieren mirar primero? Abran el mapa.",
);
const SAVED = p("You have an expedition in progress.", "Tienen una expedición en curso.");

export function renderWelcome(ctx) {
  const { K, S } = ctx;
  const root = h("div", { class: "stop stop-welcome" });

  const hero = h("header", { class: "hero" });
  hero.append(scene("welcome"));
  const heroText = h("div", { class: "hero-text" });
  const kicker = K.bi("p", { en: `${COPY.stopOf(1, STOPS.length).en} · ${STOPS[0].title.en}`, es: `${COPY.stopOf(1, STOPS.length).es} · ${STOPS[0].title.es}` }, "stop-kicker");
  const title = K.bi("h1", COPY.title, "hero-title");
  title.id = "stop-title";
  title.tabIndex = -1;
  title.dataset.narrate = "";
  const lead = K.bi("p", COPY.lead, "hero-lead");
  lead.dataset.narrate = "";
  heroText.append(kicker, title, lead);
  hero.append(
    heroText,
    h(
      "div",
      { class: "hero-guide" },
      guide("wave", K.plain(p("Tally, your guide", "Tally, su guía"))),
    ),
  );
  root.append(hero);

  // Resume / restart when there is saved progress.
  if (ctx.hasProgress()) {
    root.append(
      h(
        "div",
        { class: "resume card", role: "region", "aria-label": K.plain(SAVED) },
        K.bi("p", SAVED, "resume-text"),
        h(
          "div",
          { class: "row" },
          btn(K, COPY.resume, { cls: "btn-primary", ico: "arrow", onClick: () => ctx.resume() }),
          btn(K, COPY.restart, { cls: "btn-quiet", onClick: () => ctx.askRestart() }),
        ),
      ),
    );
  }

  // Grade.
  const grades = h("div", {
    class: "grades",
    role: "radiogroup",
    "aria-labelledby": "grade-q",
    "aria-describedby": "grade-help",
  });
  for (const g of GRADES) {
    const on = S.grade === g;
    const b = h(
      "button",
      {
        type: "button",
        class: "grade",
        role: "radio",
        "aria-checked": String(on),
        "aria-label": `${K.plain(COPY.gradeWord)} ${g}`,
        tabindex: on || (!S.grade && g === 1) ? "0" : "-1",
        data: { grade: String(g) },
      },
      h(
        "span",
        { class: "grade-word", "aria-hidden": "true" },
        K.one() === "es" ? "Grado" : "Grade",
      ),
      h("strong", { "aria-hidden": "true" }, String(g)),
    );
    b.addEventListener("click", () => ctx.setGrade(g));
    grades.append(b);
  }
  grades.addEventListener("keydown", (e) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const cur = GRADES.indexOf(S.grade || 1);
    const next = GRADES[(cur + keys[e.key] + GRADES.length) % GRADES.length];
    ctx.setGrade(next, true);
  });
  const gq = K.bi("h2", GRADE_Q, "block-title");
  gq.id = "grade-q";
  const gh = K.bi("p", GRADE_HELP, "block-help");
  gh.id = "grade-help";
  const warn = h(
    "p",
    { class: "grade-warn", id: "grade-warn", role: "alert", hidden: true },
    K.plain(COPY.gradeFirst),
  );
  root.append(h("section", { class: "block card" }, gq, gh, grades, warn));

  // What the Lab is.
  const what = h("div", { class: "what" });
  for (const [ico, t, d] of WHAT)
    what.append(
      h("article", { class: "what-card" }, icon(ico, "what-ico"), K.bi("h3", t), K.bi("p", d)),
    );
  const wq = K.bi("h2", WHAT_Q, "block-title");
  wq.dataset.narrate = "";
  const wl = K.bi("p", WHAT_LEAD, "block-help");
  wl.dataset.narrate = "";
  root.append(h("section", { class: "block" }, wq, wl, what));

  // The route ahead.
  const route = h("ol", { class: "route-list" });
  STOPS.forEach((s, i) =>
    route.append(
      h(
        "li",
        {},
        h("span", { class: "route-n", "aria-hidden": "true" }, String(i + 1)),
        K.bi("span", s.name),
      ),
    ),
  );
  root.append(
    h(
      "section",
      { class: "block route-block" },
      K.bi("h2", ROUTE_Q, "block-title"),
      routeMap(),
      route,
    ),
  );

  // Start / skip.
  const cta = h("div", { class: "cta" });
  const start = btn(K, COPY.start, {
    cls: "btn-primary btn-big",
    ico: "arrow",
    onClick: () => ctx.start(),
  });
  start.id = "start-btn";
  cta.append(
    start,
    btn(K, COPY.skip, { cls: "btn-quiet", onClick: () => ctx.toMap() }),
    K.bi("p", FREE_HELP, "block-help"),
    K.bi("p", COPY.noAccount, "note"),
  );
  root.append(cta);
  return root;
}
