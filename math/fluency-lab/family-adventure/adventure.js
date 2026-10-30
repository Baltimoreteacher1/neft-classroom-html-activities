/* Family Math Adventure — a short, bilingual guide to the Math Fluency Lab for a caregiver and child on a phone, tablet or computer.
 * Two ways in: a guided trail (grade, one real activity, how to help, nightly practice) or a plain list of places to explore.
 * State stays on this device. Language is "en", "es" or "bi" (English with Spanish under it) and is shared with the other family pages. */

const KEY = "ewl-fluency-family-adventure-v1";
const LANG_KEY = "ewl-family-lang-mode-v1";
const FLUENCY_LANG_KEY = "ewl-fluency-lang-v1";
const MODES = ["en", "es", "bi"];
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8];
const p = (en, es) => ({ en, es });

const COPY = {
  brand: p("← Math Fluency Lab", "← Laboratorio de fluidez matemática"),
  title: p("Family Math Adventure", "Aventura matemática en familia"),
  tagline: p("For caregivers and children", "Para familias y niños"),
  lead: p(
    "The Math Fluency Lab helps children get quick and confident with math. A visit takes 5 to 10 minutes. No account needed.",
    "El Laboratorio de fluidez matemática ayuda a los niños a ser rápidos y seguros con las matemáticas. Una visita toma de 5 a 10 minutos. No necesitan cuenta.",
  ),
  how: p("How would you like to start?", "¿Cómo quieren empezar?"),
  guide: p("Guide me, step by step", "Guíenme paso a paso"),
  guideHelp: p("Four short stops, about 10 minutes", "Cuatro paradas cortas, unos 10 minutos"),
  explore: p("Let me look around", "Quiero explorar"),
  exploreHelp: p("Pick any place to visit", "Elijan cualquier lugar"),
  saved: p(
    "No account. Your place is saved on this device only.",
    "Sin cuenta. Su avance se guarda solo en este dispositivo.",
  ),
  gradeTitle: p("What grade is your child in?", "¿En qué grado está su hijo o hija?"),
  gradeLead: p(
    "We use it to pick math that fits. You can change it later.",
    "Lo usamos para elegir matemáticas a su medida. Pueden cambiarlo después.",
  ),
  gradeWord: p("Grade", "Grado"),
  stopOf: (n, t) => p(`Stop ${n} of ${t}`, `Parada ${n} de ${t}`),
  next: p("Next", "Siguiente"),
  back: p("Back", "Atrás"),
  skip: p("Skip this stop", "Saltar esta parada"),
  did: p("We did it!", "¡Lo hicimos!"),
  toastDone: p("Star earned!", "¡Estrella ganada!"),
  talk: p("Talk about it together", "Conversen juntos"),
  exploreTitle: p("Places to visit", "Lugares para visitar"),
  homeBtn: p("Back to the start", "Volver al inicio"),
  endTitle: p("You finished the adventure!", "¡Terminaron la aventura!"),
  endLead: p(
    "Short and often works best. Come back any day for five minutes.",
    "Lo corto y frecuente funciona mejor. Vuelvan cualquier día por cinco minutos.",
  ),
  again: p("Do the adventure again", "Hacer la aventura otra vez"),
  start: p("Start over", "Empezar de nuevo"),
  startQ: p("Start over from the beginning?", "¿Empezar de nuevo desde el principio?"),
  startQd: p(
    "This clears your grade and your stars on this page. Practice you did in the Lab stays saved.",
    "Esto borra su grado y sus estrellas en esta página. La práctica que hicieron en el Laboratorio se conserva.",
  ),
  yesStart: p("Yes, start over", "Sí, empezar de nuevo"),
  keep: p("Keep my place", "Conservar mi avance"),
  fresh: p("Fresh start.", "Comienzo nuevo."),
  foot: p(
    "A family guide to the EduWonderLab Math Fluency Lab. No names or emails are collected here.",
    "Una guía familiar del Laboratorio de fluidez matemática de EduWonderLab. Aquí no se recopilan nombres ni correos.",
  ),
};

/* Every place a family can go. `href` may use {grade} and {lang}. */
const PLACES = {
  tonight: {
    icon: "🏠",
    title: p("Family Math Tonight", "Matemáticas en familia esta noche"),
    help: p(
      "A little math together each night. Pick a grade and 5, 10 or 15 minutes.",
      "Un poco de matemáticas juntos cada noche. Elijan un grado y 5, 10 o 15 minutos.",
    ),
    href: "../family/",
  },
  session: {
    icon: "⭐",
    title: p("A 5-minute guided session", "Una sesión guiada de 5 minutos"),
    help: p(
      "One idea, one example, a few problems. The Lab picks the skill.",
      "Una idea, un ejemplo y unos problemas. El Laboratorio elige la destreza.",
    ),
    href: "../family/session.html?grade={grade}&profile=0&lang={lang}&minutes=5&new=1",
  },
  progress: {
    icon: "📈",
    title: p("See how practice is going", "Vean cómo va la práctica"),
    help: p("What you practiced and what to try next.", "Lo que practicaron y qué probar después."),
    href: "../family/progress.html",
  },
  lab: {
    icon: "🧭",
    title: p("Explore the whole Lab", "Exploren todo el Laboratorio"),
    help: p(
      "Games, skills for every grade, and a trail of math ideas.",
      "Juegos, destrezas para cada grado y un camino de ideas matemáticas.",
    ),
    href: "../",
  },
};

/* The guided trail. kind: info (read, then Next) · place (open a page, then "We did it") */
const TRAIL = [
  {
    kind: "info",
    icon: "💡",
    title: p("What is the Math Fluency Lab?", "¿Qué es el Laboratorio de fluidez matemática?"),
    steps: [
      p(
        "Short math practice for grades 1 to 8: facts, skills and games.",
        "Práctica corta de matemáticas de 1.º a 8.º grado: operaciones, destrezas y juegos.",
      ),
      p(
        "Each visit is 5 to 10 minutes. There is no timer to beat.",
        "Cada visita dura de 5 a 10 minutos. No hay cronómetro que vencer.",
      ),
      p(
        "Mistakes help the Lab learn what to show next.",
        "Los errores ayudan al Laboratorio a saber qué mostrar después.",
      ),
    ],
  },
  {
    kind: "place",
    place: "session",
    icon: "⭐",
    title: p("Try one together", "Prueben una juntos"),
    steps: [
      p("Sit side by side. Tap the big button.", "Siéntense lado a lado. Toquen el botón grande."),
      p(
        "Read the idea together, then let your child try the problems.",
        "Lean la idea juntos y dejen que su hijo o hija intente los problemas.",
      ),
      p(
        "When you finish, come back here: tap Back in your browser.",
        "Cuando terminen, regresen aquí: toquen Atrás en su navegador.",
      ),
    ],
    ask: p(
      "Which one was the easiest? Which one made you think?",
      "¿Cuál fue la más fácil? ¿Cuál los hizo pensar?",
    ),
  },
  {
    kind: "info",
    icon: "🤝",
    title: p("How to help", "Cómo ayudar"),
    steps: [
      p(
        "Ask, do not tell. Try: “How did you figure that out?”",
        "Pregunten, no den la respuesta. Por ejemplo: «¿Cómo lo averiguaste?»",
      ),
      p("Wait a few seconds. Thinking takes time.", "Esperen unos segundos. Pensar toma tiempo."),
      p(
        "Praise the effort: “You kept trying.” Any language works for talking about math.",
        "Elogien el esfuerzo: «Seguiste intentando». Pueden hablar de matemáticas en cualquier idioma.",
      ),
    ],
  },
  {
    kind: "place",
    place: "tonight",
    icon: "🌙",
    title: p("Make it a nightly habit", "Háganlo un hábito de cada noche"),
    steps: [
      p(
        "Family Math Tonight is a few minutes of math together each night.",
        "Matemáticas en familia esta noche son unos minutos de matemáticas juntos cada noche.",
      ),
      p(
        "Pick a grade and 5, 10 or 15 minutes. Then choose “Learner plays” or “Play together.”",
        "Elijan un grado y 5, 10 o 15 minutos. Luego elijan «Juega el estudiante» o «Jugar juntos».",
      ),
      p(
        "The Lab saves your progress on this device, so tomorrow starts where tonight ended.",
        "El Laboratorio guarda el progreso en este dispositivo, así que mañana empiezan donde terminaron hoy.",
      ),
    ],
    ask: p(
      "What time each night could work for a few minutes?",
      "¿A qué hora de la noche podrían sacar unos minutos?",
    ),
  },
];
const TOTAL = TRAIL.length;
const EXPLORE = ["tonight", "session", "progress", "lab"];

const fresh = () => ({ lang: "", grade: 0, path: "", stop: 0, done: [], view: "welcome" });
let state = fresh();
let toastTimer;
const $ = (id) => document.getElementById(id);

function node(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}
const mode = () => (MODES.includes(state.lang) ? state.lang : "en");
/** English, Spanish, or both (Spanish under the English), as the current language asks. */
function bi(tag, pair, className) {
  const n = node(tag, className);
  if (mode() === "es") {
    n.lang = "es";
    n.textContent = pair.es;
    return n;
  }
  n.append(pair.en);
  if (mode() === "bi") {
    const es = node("span", "es", pair.es);
    es.lang = "es";
    n.append(es);
  }
  return n;
}
const plain = (pair) =>
  mode() === "es" ? pair.es : mode() === "bi" ? `${pair.en} / ${pair.es}` : pair.en;
const fill = (href) =>
  href
    .replace("{grade}", String(state.grade || 3))
    .replace("{lang}", mode() === "es" ? "es" : "en");

function readLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (MODES.includes(saved)) return saved;
    if (JSON.parse(localStorage.getItem(FLUENCY_LANG_KEY) || '"en"') === "es") return "es";
  } catch {}
  return /^es\b/i.test(navigator.language || "") ? "es" : "en";
}
function shareLang() {
  try {
    localStorage.setItem(LANG_KEY, mode());
    // The Fluency Lab only knows English and Spanish; "both" keeps its English chrome.
    localStorage.setItem(FLUENCY_LANG_KEY, JSON.stringify(mode() === "es" ? "es" : "en"));
  } catch {}
}
function restore() {
  state.lang = readLang();
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {}
  if (!raw || !["guide", "explore"].includes(raw.path)) return;
  state.path = raw.path;
  state.grade = GRADES.includes(raw.grade) ? raw.grade : 0;
  state.done = Array.isArray(raw.done)
    ? [...new Set(raw.done.filter((i) => Number.isInteger(i) && i >= 0 && i < TOTAL))]
    : [];
  state.stop = Number.isInteger(raw.stop) && raw.stop >= 0 && raw.stop < TOTAL ? raw.stop : 0;
  state.view = ["grade", "trail", "end", "explore"].includes(raw.view) ? raw.view : "welcome";
}
function save() {
  try {
    const { lang, ...rest } = state;
    localStorage.setItem(KEY, JSON.stringify(rest));
  } catch {}
}

const dots = () => {
  const ol = node("ol", "dots");
  ol.setAttribute("aria-label", plain(COPY.stopOf(state.stop + 1, TOTAL)));
  TRAIL.forEach((_, i) =>
    ol.append(
      node(
        "li",
        state.done.includes(i) ? "done" : i === state.stop && state.view === "trail" ? "now" : "",
      ),
    ),
  );
  return ol;
};
function button(pair, attrs = {}, className = "") {
  const b = node("button", className);
  b.type = "button";
  Object.assign(b.dataset, attrs);
  b.append(bi("span", pair));
  return b;
}
function linkButton(pair, href, className = "") {
  const a = node("a", `btn ${className}`.trim());
  a.href = href;
  a.append(bi("span", pair));
  return a;
}

function welcome() {
  const c = node("section", "card stack");
  const tag = node("span", "eyebrow");
  tag.append(plain(COPY.tagline));
  const choices = node("div", "choices");
  const guide = button(COPY.guide, { path: "guide" }, "primary");
  guide.append(bi("span", COPY.guideHelp));
  const look = button(COPY.explore, { path: "explore" });
  look.append(bi("span", COPY.exploreHelp));
  choices.append(guide, look);
  c.append(
    tag,
    bi("h1", COPY.title),
    bi("p", COPY.lead, "lead"),
    bi("h2", COPY.how),
    choices,
    bi("p", COPY.saved, "note"),
  );
  return c;
}
function gradePick() {
  const c = node("section", "card stack");
  const grid = node("div", "grades");
  for (const g of GRADES) {
    const b = node("button", null, String(g));
    b.type = "button";
    b.dataset.grade = String(g);
    b.setAttribute("aria-label", `${plain(COPY.gradeWord)} ${g}`);
    grid.append(b);
  }
  c.append(bi("h1", COPY.gradeTitle), bi("p", COPY.gradeLead, "lead"), grid);
  return c;
}
function trail() {
  const s = TRAIL[state.stop];
  const c = node("section", "card stack");
  const tag = node("span", "eyebrow");
  tag.append(plain(COPY.stopOf(state.stop + 1, TOTAL)));
  const ol = node("ol", "steps");
  for (const step of s.steps) {
    const li = node("li");
    li.append(bi("span", step));
    ol.append(li);
  }
  c.append(
    dots(),
    tag,
    bi("h1", { en: `${s.icon} ${s.title.en}`, es: `${s.icon} ${s.title.es}` }),
    ol,
  );
  if (s.kind === "place") {
    c.append(linkButton(PLACES[s.place].title, fill(PLACES[s.place].href), "primary"));
    if (s.ask) {
      const ask = node("div", "ask");
      ask.append(bi("strong", COPY.talk), bi("p", s.ask));
      c.append(ask);
    }
    c.append(button(COPY.did, { done: "1" }));
  } else {
    c.append(button(COPY.next, { next: "1" }, "primary"));
  }
  const nav = node("div", "row two");
  nav.append(
    state.stop > 0 ? button(COPY.back, { nav: "-1" }, "quiet") : node("span"),
    button(COPY.skip, { nav: "1" }, "quiet"),
  );
  c.append(nav);
  return c;
}
function exploreList() {
  const c = node("section", "card stack");
  c.append(bi("h1", COPY.exploreTitle));
  const list = node("div", "choices");
  for (const id of EXPLORE) {
    const place = PLACES[id];
    const a = node("a", "btn");
    a.href = fill(place.href);
    a.append(
      bi("span", { en: `${place.icon} ${place.title.en}`, es: `${place.icon} ${place.title.es}` }),
      bi("span", place.help, "note"),
    );
    list.append(a);
  }
  c.append(list, button(COPY.homeBtn, { home: "1" }, "quiet"));
  return c;
}
function end() {
  const c = node("section", "card stack");
  const stars = node("div", "stars");
  stars.setAttribute("role", "img");
  stars.setAttribute("aria-label", `${state.done.length} / ${TOTAL}`);
  stars.textContent = TRAIL.map((_, i) => (state.done.includes(i) ? "★" : "☆")).join("");
  c.append(stars, bi("h1", COPY.endTitle), bi("p", COPY.endLead, "lead"));
  const list = node("div", "choices");
  for (const id of ["tonight", "lab", "progress"]) {
    const place = PLACES[id];
    const a = node("a", "btn");
    a.href = fill(place.href);
    a.append(
      bi("span", { en: `${place.icon} ${place.title.en}`, es: `${place.icon} ${place.title.es}` }),
      bi("span", place.help, "note"),
    );
    list.append(a);
  }
  c.append(list, button(COPY.again, { again: "1" }));
  return c;
}

function chrome() {
  const brand = $("brand");
  brand.textContent = plain(COPY.brand);
  const lang = $("lang");
  lang.replaceChildren();
  for (const [m, label] of [
    ["en", "English"],
    ["es", "Español"],
    ["bi", "EN + ES"],
  ]) {
    const b = node("button", null, label);
    b.type = "button";
    b.dataset.lang = m;
    b.setAttribute("aria-pressed", String(mode() === m));
    if (m === "es") b.lang = "es";
    lang.append(b);
  }
  $("resetBtn").hidden = state.view === "welcome";
  $("resetBtn").textContent = plain(COPY.start);
  const bar = $("resetBar");
  const msg = node("p");
  msg.id = "resetMsg";
  msg.append(bi("strong", COPY.startQ), node("br"), bi("span", COPY.startQd));
  const row = node("div", "row two");
  row.append(
    button(COPY.yesStart, { reset: "1" }, "primary"),
    button(COPY.keep, { resetCancel: "1" }),
  );
  bar.replaceChildren(msg, row);
  $("foot").replaceChildren(bi("p", COPY.foot));
  document.documentElement.lang = mode() === "es" ? "es" : "en";
  document.title = `${plain(COPY.title)} | EduWonderLab`;
}
function render(focus = true) {
  const views = { welcome, grade: gradePick, trail, explore: exploreList, end };
  $("content").replaceChildren((views[state.view] || welcome)());
  chrome();
  save();
  if (focus) {
    $("content").focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}
function toast(pair) {
  clearTimeout(toastTimer);
  $("toast").textContent = plain(pair);
  $("toast").hidden = false;
  toastTimer = setTimeout(() => {
    $("toast").hidden = true;
  }, 2600);
}
function go(index) {
  if (index < 0) return;
  if (index >= TOTAL) state.view = "end";
  else {
    state.stop = index;
    state.view = "trail";
  }
  render();
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const d = b.dataset;
  if (d.lang) {
    state.lang = d.lang;
    shareLang();
    render(false);
    $("lang").querySelector(`[data-lang="${state.lang}"]`)?.focus();
  } else if (d.path === "guide") {
    state.path = "guide";
    state.view = "grade";
    render();
  } else if (d.path === "explore") {
    state.path = "explore";
    state.view = "explore";
    render();
  } else if (d.grade) {
    state.grade = Number(d.grade);
    state.stop = 0;
    state.done = [];
    go(0);
  } else if (d.next) go(state.stop + 1);
  else if (d.nav) go(state.stop + Number(d.nav));
  else if (d.done) {
    if (!state.done.includes(state.stop)) {
      state.done.push(state.stop);
      toast(COPY.toastDone);
    }
    go(state.stop + 1);
  } else if (d.again) {
    state.stop = 0;
    state.done = [];
    go(0);
  } else if (d.home) {
    state.view = "welcome";
    render();
  } else if (b.id === "resetBtn") {
    $("resetBar").hidden = false;
    $("resetBar").scrollIntoView({ block: "nearest" });
    $("resetBar").querySelector("[data-reset]").focus({ preventScroll: true });
  } else if (d.resetCancel) {
    $("resetBar").hidden = true;
    $("resetBtn").focus();
  } else if (d.reset) {
    const lang = state.lang;
    state = fresh();
    state.lang = lang;
    $("resetBar").hidden = true;
    render();
    toast(COPY.fresh);
  }
});

restore();
render(false);
