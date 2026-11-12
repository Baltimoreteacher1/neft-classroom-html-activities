// Lab chrome: brand mark, top navigation, "More" menu and footer. One place so the static shell in
// index.html and the live (bilingual) chrome never describe different navigation.
import { isEarlyBand } from "./bands.js";
import { brandName } from "./brand.js";
import { langSwitchHTML } from "./i18n.js";
import { CHROME } from "./acc/copy.js";
import { DESTINATIONS, SECTIONS, SKILLS, inBand, locate } from "./sitemap.js";
import { BASE, html, icon, raw } from "./util.js";

export const LOGO = raw(
  `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="2" y="2" width="17" height="17" rx="5.5" fill="#075568"/><rect x="21" y="2" width="17" height="17" rx="5.5" fill="#2e4a94"/><rect x="2" y="21" width="17" height="17" rx="5.5" fill="#8a3a5c"/><rect x="21" y="21" width="17" height="17" rx="5.5" fill="#9a4a26"/><path d="M6.5 14.5v-2a4 4 0 0 1 8 0v2" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><path d="M26 7.5h8M26 11h8M26 14.5h5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><rect x="8.3" y="25" width="4.4" height="7" rx="2.2" fill="#fff"/><path d="M26.5 33.5l7-7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`,
);

// Which top-row link is current comes from the site map: the section of the destination this route belongs to.
const SECTION_TO_TOP = { practice: "practice", play: "explore", progress: "growth", prep: "access-prep", teach: "teachers", family: "family", help: "help" };
const HOME_VIEWS = new Set(["home", "early", "journey", "session-done"]);

export function currentTop(route = {}) {
  const view = route.view || "home";
  if (HOME_VIEWS.has(view) && !(view === "journey" && /^(map|guide)/.test(route.id || ""))) return "continue";
  if (view === "explore") return SECTION_TO_TOP[route.id] || "";
  const here = locate(route);
  return here ? SECTION_TO_TOP[here.section] || "" : "";
}

/** Four primary learner destinations (Home and three site-map sections); teachers and families get labelled doors. */
export function primaryLinks(band, T) {
  const q = `?grades=${band}`;
  // K–3 bands: the early home is "Continue", and growth is the Passport (the growth map reads grades 3–8 work).
  if (isEarlyBand(band))
    return [
      { id: "access-prep", icon: "tests", label: T("Access Prep", "Preparación ACCESS"), href: `${BASE}/access-prep${q}`, featured: true },
      { id: "continue", icon: "road", label: T("My practice", "Mi práctica"), href: `${BASE}/early${q}` },
      { id: "practice", icon: "reading", label: T("Practice", "Practicar"), href: `${BASE}/library${q}` },
      { id: "growth", icon: "passport", label: T("My Passport", "Mi Pasaporte"), href: `${BASE}/passport${q}` },
    ];
  return [
    { id: "continue", icon: "road", label: T("Home", "Inicio"), href: `${BASE}/${q}` },
    { id: "practice", icon: "reading", label: T("Practice", "Practicar"), href: `${BASE}/explore/practice${q}` },
    { id: "explore", icon: "sparkle", label: T("Games & Worlds", "Juegos y mundos"), href: `${BASE}/explore/play${q}` },
    { id: "growth", icon: "growth", label: T("My Progress", "Mi progreso"), href: `${BASE}/explore/progress${q}` },
  ];
}

function menuGroups(band, T) {
  const q = `?grades=${band}`;
  const link = (name, label, path) => ({
    icon: name,
    label,
    href: path.startsWith("/") && !path.startsWith(BASE) ? path : path.includes("grades=") ? `${BASE}/${path}` : `${BASE}/${path}${path.includes("?") ? `&grades=${band}` : q}`,
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
          link("families", T("Families: Practice Together", "Familias: Practicar juntos"), "practice-together"),
          link("families", T("Family Corner", "Rincón de la familia"), "family"),
          link("passport", T("My Passport", "Mi Pasaporte"), "passport"),
          link("classroom", T("My class", "Mi clase"), "class"),
          link("classroom", T("Live class quiz", "Cuestionario de clase en vivo"), "class/quiz"),
          link("teacher", T("Teacher Hub", "Centro docente"), "/access-teacher/"),
          link("launch", T("Launch Studio", "Estudio de lanzamiento"), "launch-studio"),
        ],
      },
    ];
  // Every other band: one group per site-map section, `top` destinations only, then "See all" to that section's hub.
  // Practice is split by skill so no group is a wall of links.
  const dest = (d) => link(d.icon, T(...d.title), d.href);
  const groups = [];
  for (const sec of SECTIONS) {
    const items = DESTINATIONS.filter((d) => d.section === sec.id && d.top && inBand(d, band));
    if (sec.id === "practice") {
      for (const sk of SKILLS) {
        const list = items.filter((d) => d.skill === sk.id);
        if (list.length) groups.push({ title: `${T(...sec.title)} · ${T(...sk.title)}`, items: list.map(dest), all: link("grid", T("See all", "Ver todo"), `explore/practice?skill=${sk.id}`) });
      }
    } else if (items.length) groups.push({ title: T(...sec.title), items: items.map(dest), all: link("grid", T("See all", "Ver todo"), `explore/${sec.id}`) });
  }
  return groups;
}

export function navHTML(ctx, I) {
  const { T, S } = I;
  const band = ctx.band;
  const view = ctx.route?.view || "home";
  const current = currentTop(ctx.route);
  const primary = primaryLinks(band, T);
  // The two family buttons keep their labels on the top row at every width (families are mostly on phones);
  // Teacher Expedition shrinks to an icon, then moves to the More menu on narrow screens.
  const topLink = (l) =>
    html`<a
      class="top-link${l.featured ? " top-access-prep is-featured" : ""}${l.pill ? " top-expedition" : ""}${l.family ? " top-family" : ""}"
      ${l.low ? raw('data-tier="low"') : l.dataTier ? raw(`data-tier="${l.dataTier}"`) : ""}
      href="${l.href}"
      ${l.id === current ? raw('aria-current="page"') : ""}
      >${icon(l.icon)}<span>${l.label}</span></a
    >`;
  const focused = view === "test" || view === "assess";
  const accessPrepLink = html`<a class="top-link top-access-prep is-featured" data-tier="prep" href="${BASE}/access-prep?grades=${band}" ${current === "access-prep" ? raw('aria-current="page"') : ""}><span>${icon("tests")} ${T("Access Prep", "Preparación ACCESS")}</span></a>`;
  // Teachers and Families are labelled audience doors on the top row at every width (families are mostly on phones).
  const teachersLink = isEarlyBand(band) ? "" : html`<a class="top-link top-expedition top-teachers" href="${BASE}/start?grades=${band}" ${current === "teachers" ? raw('aria-current="page"') : ""}>${icon("teacher")}<span>${T("Teachers", "Docentes")}</span></a>`;
  // The learner row stays four destinations (tools/access-journey-pages.test.mjs); Families is its own labelled link.
  const familiesLink = html`<a class="top-link top-expedition top-family" href="${BASE}/practice-together?grades=${band}" ${current === "family" ? raw('aria-current="page"') : ""}>${icon("families")}<span>${T("Families", "Familias")}</span></a>`;
  return html`${accessPrepLink}${primary.filter((l) => !l.pill && !l.featured).map(topLink)}${teachersLink}${familiesLink}
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
              ${g.all ? html`<a class="menu-all" href="${g.all.href}">${g.all.label} →</a>` : ""}
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
      <nav class="footer-links" aria-label="${S("Sections", "Secciones")}">
        <h2>${T("Explore", "Explorar")}</h2>
        ${SECTIONS.filter((sec) => sec.id !== "help").map((sec) => html`<a href="${BASE}/explore/${sec.id}${q}">${T(...sec.title)}</a>`)}
        <a href="${BASE}/explore${q}">${T("Everything on the site", "Todo el sitio")}</a>
      </nav>
      <nav class="footer-links" aria-label="${S("Support", "Apoyo")}">
        <h2>${T("Support", "Apoyo")}</h2>
        <a href="${BASE}/passport${q}">${T("My Passport", "Pasaporte")}</a>
        <a href="${BASE}/move${q}">${T("Move my progress", "Mover mi progreso")}</a>
        <button type="button" class="footer-link-button" data-start-fresh>
          ${T("Start everything fresh", "Empezar todo de nuevo")}
        </button>
        <a href="${BASE}/site-guide${q}">${T("Site Guide", "Guía del sitio")}</a>
        <a href="/access-teacher/">${T("Teacher Hub", "Centro docente")}</a>
        <a href="${BASE}/tools${q}">${T("Help and device check", "Ayuda y revisión del dispositivo")}</a>
      </nav>
    </div>
    <p class="footer-legal">
      <strong>${T(CHROME.en.disclaimerLead, CHROME.es.disclaimerLead)}</strong>
      ${T(CHROME.en.disclaimer, CHROME.es.disclaimer)}
    </p>
    <p class="footer-build" id="labBuild"></p>`;
}
