// Lab chrome: brand mark, top navigation, "More" menu and footer. One place so the static shell in
// index.html and the live (bilingual) chrome never describe different navigation.
import { isEarlyBand } from "./bands.js";
import { brandName } from "./brand.js";
import { langSwitchHTML } from "./i18n.js";
import { CHROME } from "./acc/copy.js";
import { BASE, html, icon, raw } from "./util.js";

export const LOGO = raw(
  `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="2" y="2" width="17" height="17" rx="5.5" fill="#075568"/><rect x="21" y="2" width="17" height="17" rx="5.5" fill="#2e4a94"/><rect x="2" y="21" width="17" height="17" rx="5.5" fill="#8a3a5c"/><rect x="21" y="21" width="17" height="17" rx="5.5" fill="#9a4a26"/><path d="M6.5 14.5v-2a4 4 0 0 1 8 0v2" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><path d="M26 7.5h8M26 11h8M26 14.5h5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><rect x="8.3" y="25" width="4.4" height="7" rx="2.2" fill="#fff"/><path d="M26.5 33.5l7-7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`,
);

const PRACTICE_VIEWS = new Set([
  "session-done",
  "room",
  "activity",
  "play",
  "library",
  "road",
  "missions",
  "mission",
  "speak",
  "voice",
  "write",
  "detective",
  "classroom",
  "vocabulary",
  "flashcards",
  "conversation",
  "construction",
  "evidence",
  "reading",
  "reading-room",
  "reading-log",
  "stories",
  "ladder",
  "grammar",
  "publisher-demo",
  "diagnostic",
  "launch",
  "launch-studio",
  "teacher-launch",
  "tests",
  "test",
  "assess",
  "scaffold",
  "move",
]);
const ACTIVE = {
  early: "continue",
  home: "continue",
  journey: "continue",
  mission: "continue",
  missions: "continue",
  "session-done": "continue",
  learn: "practice",
  library: "practice",
  room: "practice",
  activity: "practice",
  play: "practice",
  tests: "practice",
  test: "practice",
  assess: "practice",
  class: "practice",
  "class-quiz": "practice",
  diagnostic: "practice",
  road: "practice",
  speak: "practice",
  voice: "practice",
  write: "practice",
  detective: "practice",
  scaffold: "practice",
  games: "explore",
  reality: "explore",
  worlds: "explore",
  exhibition: "explore",
  puzzles: "explore",
  stories: "explore",
  conversation: "explore",
  construction: "explore",
  vocabulary: "explore",
  flashcards: "explore",
  reading: "explore",
  "reading-room": "explore",
  "publisher-demo": "explore",
  growth: "growth",
  path: "growth",
  passport: "growth",
  move: "growth",
  "science-of-reading": "sor",
  sor: "sor",
  "language-studios": "studios",
  family: "family",
  tools: "help",
};

/** Four primary learner destinations; family, teacher and specialist rooms live in the More menu. */
export function primaryLinks(band, T) {
  const q = `?grades=${band}`;
  // K–3 bands: the early home is "Continue", and growth is the Passport (the growth map reads grades 3–8 work).
  if (isEarlyBand(band))
    return [
      { id: "continue", icon: "road", label: T("My practice", "Mi práctica"), href: `${BASE}/early${q}` },
      { id: "practice", icon: "reading", label: T("Practice", "Practicar"), href: `${BASE}/library${q}` },
      { id: "growth", icon: "passport", label: T("My Passport", "Mi Pasaporte"), href: `${BASE}/passport${q}` },
    ];
  return [
    {
      id: "continue",
      icon: "road",
      label: T("Continue", "Continuar"),
      href: `${BASE}/${q}`,
    },
    {
      id: "practice",
      icon: "reading",
      label: T("Practice", "Practicar"),
      href: `${BASE}/library${q}`,
    },
    {
      id: "explore",
      icon: "sparkle",
      label: T("Create & Explore", "Crear y explorar"),
      href: `${BASE}/games${q}`,
    },
    {
      id: "growth",
      icon: "growth",
      label: T("My Growth", "Mi crecimiento"),
      href: `${BASE}/growth${q}`,
    },
  ];
}

function menuGroups(band, T) {
  const q = `?grades=${band}`;
  const link = (name, label, path) => ({
    icon: name,
    label,
    href: path.startsWith("/") && !path.startsWith(BASE) ? path : `${BASE}/${path}${q}`,
  });
  if (isEarlyBand(band))
    return [
      {
        title: T("My practice", "Mi práctica"),
        items: [
          link("home", T("Early learners home", "Página de primeros grados"), "early"),
          link("listening", T("Listening", "Escuchar"), "Listening"),
          link("reading", T("Reading", "Leer"), "Reading"),
          link("speaking", T("Speaking", "Hablar"), "Speaking"),
          link("writing", T("Writing", "Escribir"), "Writing"),
          link("library", T("Find an activity", "Buscar una actividad"), "library"),
        ],
      },
      {
        title: T("Families and teachers", "Familias y docentes"),
        items: [
          link("families", T("Families", "Familias"), "family"),
          link("passport", T("My Passport", "Mi Pasaporte"), "passport"),
          link("classroom", T("My class", "Mi clase"), "class"),
          link("classroom", T("Live class quiz", "Cuestionario de clase en vivo"), "class/quiz"),
          link("teacher", T("Teacher Hub", "Centro docente"), "/access-teacher/"),
          link("launch", T("Launch Studio", "Estudio de lanzamiento"), "launch-studio"),
        ],
      },
    ];
  return [
    {
      title: T("My Learning Journey", "Mi viaje de aprendizaje"),
      items: [
        link("road", T("Continue my journey", "Continuar mi viaje"), "journey"),
        link("growth", T("My Language Path", "Mi camino del lenguaje"), "path"),
        link("writing", T("Language builders", "Constructores de lenguaje"), "scaffold"),
        link("flag", T("My Journey Map", "Mi mapa del viaje"), "journey/map"),
      ],
    },
    {
      title: T("Practice by skill", "Practicar por destreza"),
      items: [
        link("bulb", T("Interactive Learn Hub", "Centro interactivo de aprendizaje"), "learn"),
        link("listening", T("Listening", "Escuchar"), "Listening"),
        link("reading", T("Reading", "Leer"), "Reading"),
        link("speaking", T("Speaking", "Hablar"), "Speaking"),
        link("writing", T("Writing", "Escribir"), "Writing"),
        link("library", T("Find an activity", "Buscar una actividad"), "library"),
      ],
    },
    {
      title: T("Studios and missions", "Estudios y misiones"),
      items: [
        link("reading", T("Science of Reading Studio", "Estudio de la ciencia de la lectura"), "science-of-reading"),
        link("sparkle", T("Interactive Language Studios", "Estudios interactivos de lenguaje"), "language-studios"),
        link("worlds", T("Language World: Science Exhibition", "Mundo del lenguaje: Feria de ciencias"), "exhibition"),
        link("worlds", T("Language Reality Engine", "Motor de Realidad Lingüística"), "reality"),
        link("speaking", T("Speaking Studio", "Estudio de expresión oral"), "speak"),
        link("listening", T("Voice Lab", "Laboratorio de voz"), "voice"),
        link("writing", T("Writing Studio", "Estudio de escritura"), "write"),
        link("reading", T("Reading Room", "Sala de lectura"), "reading-room"),
        link("mission", T("Academic missions", "Misiones académicas"), "missions"),
        link("worlds", T("Language Worlds", "Mundos lingüísticos"), "worlds"),
        link("worlds", T("Neighborhood Notes stories", "Historias del cuaderno del vecindario"), "stories"),
        link("reading", T("Reading Ladder", "Escalera de lectura"), "ladder"),
        link("sparkle", T("Language Game Studio", "Estudio de juegos de lenguaje"), "games"),
        link("grid", T("Puzzle Den", "Rincón de rompecabezas"), "puzzles"),
        link("words", T("Word Builder", "Constructor de palabras"), "vocabulary"),
        link("words", T("Word cards and partner talk", "Tarjetas de palabras y conversación en pareja"), "flashcards"),
        link("detective", T("Error Detective", "Detective de errores"), "detective"),
        link("detective", T("Grammar check-in and packs", "Chequeo y paquetes de gramática"), "grammar"),
      ],
    },
    {
      title: T("Plan and review", "Planificar y repasar"),
      items: [
        link("tests", T("Practice tests", "Pruebas de práctica"), "tests"),
        link("tests", T("Assessment simulator", "Simulador de evaluación"), "assess"),
        link("road", T("Road to ACCESS", "Camino a ACCESS"), "road"),
        link("growth", T("My growth", "Mi progreso"), "growth"),
        link("classroom", T("My class", "Mi clase"), "class"),
        link("classroom", T("Live class quiz", "Cuestionario de clase en vivo"), "class/quiz"),
        link("checkin", T("Skill check-in", "Chequeo de destrezas"), "diagnostic"),
        link(
          "conversation",
          T("Conversation Simulator", "Simulador de conversación"),
          "conversation",
        ),
        link("construction", T("Construction Lab", "Laboratorio de construcción"), "construction"),
        link("evidence", T("Evidence Studio", "Estudio de evidencia"), "evidence"),
      ],
    },
    {
      title: T("For teachers", "Para docentes"),
      items: [
        link("teacher", T("Teacher Hub", "Centro docente"), "/access-teacher/"),
        link("flag", T("Teacher Expedition", "Expedición docente"), "/access-expedition/"),
        link("classroom", T("Whole-Class Studio", "Estudio para toda la clase"), "classroom"),
        link("teacher", T("Class teacher view", "Vista de la clase para el maestro"), "class/teacher"),
        link("launch", T("Launch Studio", "Estudio de lanzamiento"), "launch-studio"),
        link("teacher", T("Journey teacher guide", "Guía docente del viaje"), "journey/guide"),
        { icon: "reading", label: T("K–3 practice and Story Time", "Práctica de kínder a 3.º y Hora del cuento"), href: `${BASE}/early?grades=K` },
      ],
    },
  ];
}

export function navHTML(ctx, I) {
  const { T, S } = I;
  const band = ctx.band;
  const view = ctx.route?.view || "home";
  const current = ACTIVE[view] || (PRACTICE_VIEWS.has(view) ? "practice" : "");
  const primary = primaryLinks(band, T);
  // The two family buttons keep their labels on the top row at every width (families are mostly on phones);
  // Teacher Expedition shrinks to an icon, then moves to the More menu on narrow screens.
  const topLink = (l) =>
    html`<a
      class="top-link${l.pill ? " top-expedition" : ""}${l.family ? " top-family" : ""}"
      ${l.low ? raw('data-tier="low"') : ""}
      href="${l.href}"
      ${l.id === current ? raw('aria-current="page"') : ""}
      >${icon(l.icon)}<span>${l.label}</span></a
    >`;
  const focused = view === "test" || view === "assess";
  const sorLink = html`<a class="top-link top-sor-link" href="${BASE}/science-of-reading?grades=${band}" ${view === "science-of-reading" || view === "sor" ? raw('aria-current="page"') : ""}><span>${icon("reading")} ${T("Science of Reading", "Ciencia de la lectura")}</span></a>`;
  return html`${primary.filter((l) => !l.pill).map(topLink)}${sorLink}${primary.filter((l) => l.pill).map(topLink)}
    ${focused ? html`<span class="mode-flag">${icon("tests")}<span>${T("Focused practice mode", "Modo de práctica enfocada")}</span></span>` : ""}
    ${langSwitchHTML(I.mode)}
    <details class="lab-utilities">
      <summary>${icon("menu")}<span>${T("More", "Más")}</span></summary>
      <div class="lab-utilities-body">
        <div class="menu-group menu-compact">
          <h2>${T("Go to", "Ir a")}</h2>
          ${primary.map((l) => html`<a href="${l.href}">${icon(l.icon)}${l.label}</a>`)}
        </div>
        ${menuGroups(band, T).map(
          (g) =>
            html`<div class="menu-group">
              <h2>${g.title}</h2>
              ${g.items.map((i) => html`<a href="${i.href}">${icon(i.icon)}${i.label}</a>`)}
            </div>`,
        )}
        <div class="menu-group">
          <h2>${T("This device", "Este dispositivo")}</h2>
          <button type="button" class="menu-item" data-lab-save>
            ${icon("save")}${T("Save and resume", "Guardar y continuar")}
          </button>
          <span class="text-size" role="group" aria-label="${S("Text size", "Tamaño del texto")}"
            ><button
              type="button"
              class="ts-btn"
              data-text-size="-0.1"
              aria-label="${S("Smaller text", "Texto más pequeño")}"
            >
              A−</button
            ><button
              type="button"
              class="ts-btn"
              data-text-size="0.1"
              aria-label="${S("Bigger text", "Texto más grande")}"
            >
              A+
            </button></span
          >
        </div>
        <p class="fine menu-note" data-save-unavailable hidden>
          ${T("Site saving is unavailable. Use Passport to export your lab work.", "El guardado del sitio no está disponible. Usa Pasaporte para exportar tu trabajo.")}
        </p>
      </div>
    </details>`;
}

export function footerHTML(ctx, I) {
  const { T, S } = I;
  const band = ctx.band;
  const q = `?grades=${band}`;
  return html`<div class="footer-grid">
      <div class="footer-brand">
        <strong>${brandName(T("ACCESS Practice Lab", "Laboratorio de práctica ACCESS"))}</strong>
        <p>
          ${T("Classroom practice in listening, reading, speaking and writing for multilingual learners from kindergarten to grade 8, by EduWonderLab.", "Práctica de clase en comprensión auditiva, lectura, expresión oral y escritura para estudiantes multilingües de kínder a 8.º grado, por EduWonderLab.")}
        </p>
      </div>
      <nav class="footer-links" aria-label="${S("Practice", "Práctica")}">
        <h2>${T("Practice", "Práctica")}</h2>
        <a href="${BASE}/Listening${q}">${T("Listening", "Escuchar")}</a>
        <a href="${BASE}/Reading${q}">${T("Reading", "Leer")}</a>
        <a href="${BASE}/Speaking${q}">${T("Speaking", "Hablar")}</a>
        <a href="${BASE}/Writing${q}">${T("Writing", "Escribir")}</a>
        <a href="${BASE}/tests${q}">${T("Practice tests", "Pruebas de práctica")}</a>
        <a href="${BASE}/assess${q}">${T("Assessment simulator", "Simulador de evaluación")}</a>
      </nav>
      <nav class="footer-links" aria-label="${S("More", "Más")}">
        <h2>${T("Support", "Apoyo")}</h2>
        <a href="${BASE}/passport${q}">${T("My Passport", "Pasaporte")}</a>
        <a href="${BASE}/move${q}">${T("Move my progress", "Mover mi progreso")}</a>
        <a href="${BASE}/family${q}">${T("Families", "Familias")}</a>
        <a href="/access-teacher/">${T("Teacher Hub", "Centro docente")}</a>
        <a href="${BASE}/tools${q}"
          >${T("Help and device check", "Ayuda y revisión del dispositivo")}</a
        >
      </nav>
    </div>
    <p class="footer-legal">
      <strong>${T(CHROME.en.disclaimerLead, CHROME.es.disclaimerLead)}</strong>
      ${T(CHROME.en.disclaimer, CHROME.es.disclaimer)}
    </p>
    <p class="footer-build" id="labBuild"></p>`;
}
