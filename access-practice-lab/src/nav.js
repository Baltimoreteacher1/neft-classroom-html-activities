// Lab chrome: brand mark, top navigation, "More" menu and footer. One place so the static shell in
// index.html and the live (bilingual) chrome never describe different navigation.
import { langSwitchHTML } from "./i18n.js";
import { BASE, html, icon, raw } from "./util.js";

export const LOGO = raw(
  `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="2" y="2" width="17" height="17" rx="5.5" fill="#17324d"/><rect x="21" y="2" width="17" height="17" rx="5.5" fill="#1fa6a2"/><rect x="2" y="21" width="17" height="17" rx="5.5" fill="#c94f3b"/><rect x="21" y="21" width="17" height="17" rx="5.5" fill="#f2c15b"/><path d="M6.5 14.5v-2a4 4 0 0 1 8 0v2" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><path d="M26 7.5h8M26 11h8M26 14.5h5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><rect x="8.3" y="25" width="4.4" height="7" rx="2.2" fill="#fff"/><path d="M26.5 33.5l7-7" stroke="#17324d" stroke-width="2.6" stroke-linecap="round"/></svg>`,
);

const PRACTICE_VIEWS = new Set([
  "home",
  "session-done",
  "stories",
  "room",
  "activity",
  "play",
  "library",
  "road",
  "missions",
  "mission",
  "speak",
  "write",
  "detective",
  "growth",
  "worlds",
  "classroom",
  "vocabulary",
  "flashcards",
  "conversation",
  "construction",
  "evidence",
  "reading",
  "reading-room",
  "diagnostic",
  "launch",
  "launch-studio",
  "teacher-launch",
]);
const ACTIVE = {
  tests: "tests",
  test: "tests",
  passport: "passport",
  family: "family",
  tools: "help",
  road: "journey",
  growth: "review",
};

/** The six places a learner, family or teacher goes first. */
export function primaryLinks(band, T) {
  const q = `?grades=${band}`;
  return [
    { id: "practice", icon: "home", label: T("Practice", "Practicar"), href: `${BASE}/${q}`, low: true },
    { id: "journey", icon: "road", label: T("Journey", "Recorrido"), href: `${BASE}/road${q}`, low: true },
    { id: "review", icon: "growth", label: T("Keep it strong", "Repasar"), href: `${BASE}/growth${q}`, low: true },
    {
      id: "passport",
      icon: "passport",
      label: T("My Passport", "Pasaporte"),
      href: `${BASE}/passport${q}`,
    },
    {
      id: "family",
      icon: "families",
      label: T("Families", "Familias"),
      href: `${BASE}/family${q}`,
    },
    {
      id: "family-adventure",
      icon: "sparkle",
      label: T("Family Adventure", "Aventura familiar"),
      href: "/access-family-expedition/",
      pill: true,
    },
    {
      id: "teacher",
      icon: "teacher",
      label: T("Teacher Hub", "Centro docente"),
      href: "/access-teacher/",
    },
    {
      id: "teacher-expedition",
      icon: "flag",
      label: T("Teacher Expedition", "Expedición docente"),
      href: "/access-expedition/",
      pill: true,
    },
    { id: "help", icon: "help", label: T("Help", "Ayuda"), href: `${BASE}/tools${q}`, low: true },
  ];
}

function menuGroups(band, T) {
  const q = `?grades=${band}`;
  const link = (name, label, path) => ({
    icon: name,
    label,
    href: path.startsWith("/") && !path.startsWith(BASE) ? path : `${BASE}/${path}${q}`,
  });
  return [
    {
      title: T("Practice by skill", "Practicar por destreza"),
      items: [
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
        link("speaking", T("Speaking Studio", "Estudio de expresión oral"), "speak"),
        link("writing", T("Writing Studio", "Estudio de escritura"), "write"),
        link("reading", T("Reading Room", "Sala de lectura"), "reading-room"),
        link("mission", T("Academic missions", "Misiones académicas"), "missions"),
        link("worlds", T("Language Worlds", "Mundos lingüísticos"), "worlds"),
        link("worlds", T("Neighborhood Notes stories", "Historias del cuaderno del vecindario"), "stories"),
        link("words", T("Word Builder", "Constructor de palabras"), "vocabulary"),
        link("words", T("Word cards and partner talk", "Tarjetas de palabras y conversación en pareja"), "flashcards"),
        link("detective", T("Error Detective", "Detective de errores"), "detective"),
      ],
    },
    {
      title: T("Plan and review", "Planificar y repasar"),
      items: [
        link("tests", T("Practice tests", "Pruebas de práctica"), "tests"),
        link("road", T("Road to ACCESS", "Camino a ACCESS"), "road"),
        link("growth", T("My growth", "Mi progreso"), "growth"),
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
        link("launch", T("Launch Studio", "Estudio de lanzamiento"), "launch-studio"),
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
  // The two expedition buttons stay on the top row at every width; the other links give way to the menu first.
  const topLink = (l) =>
    html`<a
      class="top-link${l.pill ? " top-expedition" : ""}"
      ${l.low ? raw('data-tier="low"') : ""}
      href="${l.href}"
      ${l.id === current ? raw('aria-current="page"') : ""}
      >${icon(l.icon)}<span>${l.label}</span></a
    >`;
  return html`${primary.filter((l) => !l.pill).map(topLink)}${primary.filter((l) => l.pill).map(topLink)}
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
        <strong>${T("ACCESS Practice Lab", "Laboratorio de práctica ACCESS")}</strong>
        <p>
          ${T("Classroom practice in listening, reading, speaking and writing for multilingual learners in grades 3–8, by EduWonderLab.", "Práctica de clase en comprensión auditiva, lectura, expresión oral y escritura para estudiantes multilingües de 3.º a 8.º grado, por EduWonderLab.")}
        </p>
      </div>
      <nav class="footer-links" aria-label="${S("Practice", "Práctica")}">
        <h2>${T("Practice", "Práctica")}</h2>
        <a href="${BASE}/Listening${q}">${T("Listening", "Escuchar")}</a>
        <a href="${BASE}/Reading${q}">${T("Reading", "Leer")}</a>
        <a href="${BASE}/Speaking${q}">${T("Speaking", "Hablar")}</a>
        <a href="${BASE}/Writing${q}">${T("Writing", "Escribir")}</a>
        <a href="${BASE}/tests${q}">${T("Practice tests", "Pruebas de práctica")}</a>
      </nav>
      <nav class="footer-links" aria-label="${S("More", "Más")}">
        <h2>${T("Support", "Apoyo")}</h2>
        <a href="${BASE}/passport${q}">${T("My Passport", "Pasaporte")}</a>
        <a href="${BASE}/family${q}">${T("Families", "Familias")}</a>
        <a href="/access-teacher/">${T("Teacher Hub", "Centro docente")}</a>
        <a href="${BASE}/tools${q}"
          >${T("Help and device check", "Ayuda y revisión del dispositivo")}</a
        >
      </nav>
    </div>
    <p class="footer-legal">
      ${T("Original classroom practice inspired by WIDA ACCESS. It is not an official WIDA test, score or placement.", "Práctica original de clase inspirada en WIDA ACCESS. No es una prueba, puntaje ni ubicación oficial de WIDA.")}
    </p>
    <p class="footer-build" id="labBuild"></p>`;
}
