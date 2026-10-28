// Family Corner — bilingual (English / Spanish), printable. Copy lives in
// content/family.json so it can be edited without touching code.
import { crumbsHTML } from "../components.js";
import { bandRows, loadFamily, loadShared } from "../content.js";
import { ART, BASE, DOMAIN_META, bandLabel, copyText, html, icon, testingWindowPhase } from "../util.js";

// content/family.json tags each section with an emoji (written as escapes here: it is data, not UI chrome). Map each to a lab icon.
const SECTION_ICON = { "\u2753": "info", "\u{1F9E9}": "grid", "\u{1F4AC}": "conversation", "\u{1F392}": "check", "\u{1F4EC}": "mail" };
const PART_DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
const sectionIcon = (s) => icon(SECTION_ICON[s.icon] || "star");

const START = [
  {
    href: (b) => `${BASE}/?grades=${b}`,
    icon: "home",
    title: { en: "See the four skills", es: "Ver las cuatro partes" },
    text: {
      en: "Short activities in listening, reading, speaking and writing. Your child can start any time.",
      es: "Actividades cortas de escuchar, leer, hablar y escribir. Su hijo puede empezar en cualquier momento.",
    },
  },
  {
    href: (b) => `${BASE}/road?grades=${b}`,
    icon: "road",
    title: { en: "Practice together", es: "Practiquen juntos" },
    text: {
      en: "A 12-week plan with one short playlist each week and a question to talk about at home.",
      es: "Un plan de 12 semanas con una lista corta cada semana y una pregunta para conversar en casa.",
    },
  },
  {
    href: (b) => `${BASE}/passport?grades=${b}`,
    icon: "passport",
    title: { en: "See saved work", es: "Ver el trabajo guardado" },
    text: {
      en: "The Passport shows the practice finished on this device. It is not a score.",
      es: "El Pasaporte muestra la práctica terminada en este dispositivo. No es una calificación.",
    },
  },
];

function sectionHTML(s, T) {
  const title = T(s.title);
  const items = s.items || [];
  const head = html`<header class="fam-sec-head"><span class="fam-tile">${sectionIcon(s)}</span><h2>${title}</h2></header>`;
  if (s.icon === "\u{1F9E9}" && items.length === PART_DOMAINS.length)
    return html`<section class="fam-sec fam-sec-wide"><header class="fam-sec-head"><span class="fam-tile">${sectionIcon(s)}</span><h2>${title}</h2></header>
      ${s.body ? html`<p>${T(s.body)}</p>` : ""}
      <ul class="fam-parts">${items.map((i, n) => html`<li class="d-${PART_DOMAINS[n].toLowerCase()}"><span class="prog-tile">${icon(DOMAIN_META[PART_DOMAINS[n]].icon)}</span><h3>${T(i.title).replace(/\s*[—–-]\s*$/, "")}</h3><p>${T(i.text)}</p></li>`)}</ul></section>`;
  if (!items.length)
    return html`<section class="fam-sec fam-sec-wide fam-callout">${head}${s.body ? html`<p>${T(s.body)}</p>` : ""}</section>`;
  const body = s.style === "checklist"
    ? html`<ul class="fam-checklist">${items.map((i) => html`<li><span class="fam-check">${icon("check")}</span><span>${i.title ? html`<strong>${T(i.title)}</strong> ` : ""}${T(i.text)}</span></li>`)}</ul>`
    : html`<ol class="fam-steps">${items.map((i) => html`<li><span>${i.title ? html`<strong>${T(i.title)}</strong> ` : ""}${T(i.text)}</span></li>`)}</ol>`;
  return html`<section class="fam-sec">${head}${s.body ? html`<p>${T(s.body)}</p>` : ""}${body}</section>`;
}

export async function render(ctx) {
  const [fam, shared, rows] = await Promise.all([loadFamily(), loadShared().catch(() => ({})), bandRows(ctx.band).catch(() => [])]);
  if (!fam)
    return {
      title: "Families",
      html: html`<section class="panel">
        <h1 tabindex="-1">Families</h1>
        <p>Coming soon.</p>
      </section>`,
    };
  const lang = ctx.prefs.lang === "es" ? "es" : "en";
  const es = lang === "es";
  const T = (o) => (o && typeof o === "object" ? o[lang] || o.en : o);
  const q = new URLSearchParams(location.search);
  const skill = ["Listening", "Reading", "Speaking", "Writing"].includes(q.get("skill")) ? q.get("skill") : "All";
  const minutes = [0, 10, 15, 20].includes(Number(q.get("minutes"))) ? Number(q.get("minutes")) : 0;
  const level = ["A", "B", "C"].includes(q.get("level")) ? q.get("level") : "All";
  const matches = rows.filter((r) => (skill === "All" || r.domain === skill) && (!minutes || Number(r.minutes) <= minutes) && (level === "All" || r.level === level));
  const filtered = matches.slice(0, 12);
  const familyHref = (patch) => {
    const next = new URLSearchParams({ grades: patch.grade || ctx.band });
    const values = { skill, minutes, level, ...patch };
    if (values.skill !== "All") next.set("skill", values.skill);
    if (values.minutes) next.set("minutes", String(values.minutes));
    if (values.level !== "All") next.set("level", values.level);
    return `${BASE}/family?${next.toString()}`;
  };
  const sharedHref = `${location.origin}${familyHref({})}`;
  const win = shared.testWindow;
  const date = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(es ? "es-US" : "en-US", { month: "long", day: "numeric", year: "numeric" });
  return {
    title: es ? "Familias" : "Families",
    html: html`${crumbsHTML([
        [es ? "Laboratorio" : "Lab", `${BASE}/`],
        [es ? "Familias" : "Families", null],
      ])}
      <section class="prog-hero fam-hero d-writing is-tint">
        <div class="prog-hero-copy">
          <p class="eyebrow">${icon("families")} ${T(fam.eyebrow)}</p>
          <h1 tabindex="-1">${T(fam.title)}</h1>
          <p class="lead">${T(fam.lead)}</p>
          <div class="band-switch" role="group" aria-label="Language / Idioma">
            <button type="button" class="band-btn" data-lang="en" aria-pressed="${lang === "en"}">English</button>
            <button type="button" class="band-btn" data-lang="es" aria-pressed="${lang === "es"}">Español</button>
          </div>
          ${testingWindowPhase(win) ? html`<aside class="fam-window"><span class="fam-window-ico">${icon("calendar")}</span><div><span class="window-kicker">${T(fam.windowLabel)}</span><strong>${date(win.start)} – ${date(win.end)}</strong><span>${T(fam.windowNote)}</span><a href="https://wida.wisc.edu/about/consortium/md" target="_blank" rel="noopener">${es ? "Calendario oficial de Maryland (otra pestaña)" : "Official Maryland schedule (new tab)"} ${icon("external")}</a></div></aside>` : ""}
        </div>
        <div class="prog-hero-art"><img src="${ART}/family-home.svg" alt="" width="420" height="300" /></div>
      </section>
      <section class="fam-portal" aria-labelledby="famPortalTitle">
        <div class="fam-band-pick"><div><p class="eyebrow">${es ? "Empiece aquí" : "Start here"}</p><h2 id="famPortalTitle">${es ? "Elija el grado de su estudiante" : "Choose your student’s grade range"}</h2><p>${es ? "Las actividades están organizadas en dos grupos separados." : "Activities are organized into two clear grade bands."}</p></div>
          <nav class="fam-grade-cards" aria-label="Grade range">
            <a class="fam-grade-card" href="${familyHref({ grade: "3-5" })}" data-family-grade="3-5"><strong>3–5</strong><span>${es ? "Grados 3–5" : "Grades 3–5"}</span><small>${es ? "Actividades breves y guiadas" : "Short, guided activities"} →</small></a>
            <a class="fam-grade-card" href="${familyHref({ grade: "6-8" })}" data-family-grade="6-8"><strong>6–8</strong><span>${es ? "Grados 6–8" : "Grades 6–8"}</span><small>${es ? "Práctica y retos" : "Practice and challenge"} →</small></a>
          </nav>
        </div>
        <div class="fam-portal-note"><strong>${es ? "Sin cuenta, sin barreras" : "Start without an account"}</strong><span>${es ? "No hace falta un correo del estudiante. El trabajo se guarda en este dispositivo." : "No student email is needed. Practice opens now and saves on this device."}</span><a href="${BASE}/passport?grades=${ctx.band}">${es ? "Ver Pasaporte" : "Open Passport"} →</a></div>
        <div class="fam-finder-head"><div><p class="eyebrow">${bandLabel(ctx.band)}</p><h2>${es ? "Encuentre una actividad" : "Find an activity"}</h2></div><span>${matches.length} ${es ? "opciones" : "matches"}</span></div>
        <div class="fam-filter-groups">
          <div><strong>${es ? "Habilidad" : "Skill"}</strong>${["All", "Listening", "Reading", "Speaking", "Writing"].map((value) => html`<a href="${familyHref({ skill: value })}" aria-current="${skill === value ? "true" : "false"}">${value === "All" ? (es ? "Todas" : "Any") : (es ? ({Listening:"Escuchar",Reading:"Leer",Speaking:"Hablar",Writing:"Escribir"}[value]) : value)}</a>`)}</div>
          <div><strong>${es ? "Tiempo" : "Time"}</strong>${[0, 10, 15, 20].map((value) => html`<a href="${familyHref({ minutes: value })}" aria-current="${minutes === value ? "true" : "false"}">${value ? `${es ? "Hasta" : "Up to"} ${value} ${es ? "min" : "min"}` : (es ? "Cualquiera" : "Any")}</a>`)}</div>
          <div><strong>${es ? "Apoyo" : "Support"}</strong>${["All", "A", "B", "C"].map((value) => html`<a href="${familyHref({ level: value })}" aria-current="${level === value ? "true" : "false"}">${value === "All" ? (es ? "Cualquiera" : "Any") : ({A:es?"Más apoyo":"More support",B:es?"Algo de apoyo":"Some support",C:es?"Más independencia":"More independence"}[value])}</a>`)}</div>
        </div>
        <ul class="fam-activity-cards">${filtered.map((row) => html`<li><span class="fam-activity-mark">${icon(DOMAIN_META[row.domain]?.icon || "star")}</span><div><small>${es ? ({Listening:"Escuchar",Reading:"Leer",Speaking:"Hablar",Writing:"Escribir"}[row.domain]) : row.domain} · ${row.minutes} ${es ? "min" : "min"} · ${row.level}</small><strong>${row.title}</strong></div><a href="${BASE}/${row.domain}/${row.level}/${row.id}?grades=${ctx.band}">${es ? "Empezar" : "Start"} →</a></li>`)}</ul>
        <div class="fam-share-assignment"><div><strong>${es ? "¿Es maestro? Comparta esta ruta" : "Teacher? Share this practice path"}</strong><p>${es ? "Este enlace abre el grupo de grados y los filtros seleccionados. No contiene nombres ni respuestas." : "This link opens the selected grade band and filters. It contains no names or student responses."}</p><code>${sharedHref}</code></div><button type="button" class="btn btn-primary" data-family-copy="${sharedHref}">${icon("copy")} ${es ? "Copiar enlace" : "Copy link"}</button><span class="fam-copy-status" role="status" aria-live="polite"></span></div>
      </section>
      <details class="fam-secondary-info"><summary>${es ? "Consejos y recursos para la familia" : "Family tips and resources"}</summary>
      <section class="fam-start" aria-labelledby="famStart">
        <h2 id="famStart">${es ? "Empiece aquí" : "Start here"}</h2>
        <ul class="fam-start-grid">
          ${START.map((c) => html`<li><a class="fam-start-card" href="${c.href(ctx.band)}"><span class="fam-tile">${icon(c.icon)}</span><span><strong>${T(c.title)}</strong><span>${T(c.text)}</span></span><span class="fam-go">${icon("arrow-right")}</span></a></li>`)}
        </ul>
      </section>
      <div class="fam-grid">${fam.sections.map((s) => sectionHTML(s, T))}
      <section class="fam-sec fam-sec-wide fam-saved">
        <header class="fam-sec-head"><span class="fam-tile">${icon("save")}</span><h2>${es ? "Dónde se guarda el trabajo" : "Where the work is saved"}</h2></header>
        <p>${es ? "Los borradores, las listas de cotejo y el progreso se guardan en este navegador cuando hay almacenamiento disponible. No se necesita un nombre completo. Las grabaciones de voz desaparecen al cerrar o recargar la página y no se incluyen en los códigos de progreso." : "Drafts, checklists, and progress are saved in this browser when storage is available. A full name is not needed. Voice recordings disappear when the page closes or reloads and are not included in progress codes."}</p>
        <p>${es ? "Antes de cambiar de dispositivo o compartirlo con otro estudiante, usa Pasaporte para copiar un código ACCESS1 del trabajo actual. Ese código es diferente del código corto de Guardar / Continuar del sitio, que depende del servicio de almacenamiento configurado. Conserva los códigos en privado: pueden incluir respuestas escritas." : "Before changing devices or sharing with another learner, use Passport to copy an ACCESS1 code of the current work. That differs from the site’s short Save / Resume code, which depends on the configured storage service. Keep codes private: they may include written responses."}</p>
        <a class="btn" href="${BASE}/passport?grades=${ctx.band}">${icon("passport")} ${es ? "Abrir Pasaporte" : "Open Passport"}</a>
      </section></div>
      </details>
      <div class="row-actions no-print">
        <button type="button" class="btn btn-primary" data-print>
          ${icon("print")} ${es ? "Imprimir esta página" : "Print this page"}
        </button>
      </div>`,
  };
}

export function onClick(e, ctx) {
  const b = e.target.closest("[data-lang]");
  if (b) {
    ctx.setPrefs({ lang: b.dataset.lang });
    document.documentElement.lang = b.dataset.lang;
    ctx.rerender();
    return;
  }
  const copy = e.target.closest("[data-family-copy]");
  if (!copy) return;
  const status = copy.parentElement.querySelector(".fam-copy-status");
  copyText(copy.dataset.familyCopy).then((ok) => {
    if (status) status.textContent = ok ? (document.documentElement.lang === "es" ? "Enlace copiado." : "Practice link copied.") : (document.documentElement.lang === "es" ? "No se pudo copiar. Copie el enlace que aparece arriba." : "Copy was unavailable. Copy the link shown above.");
  });
}
export function mount(_root, ctx) {
  document.documentElement.lang = ctx.prefs.lang === "es" ? "es" : "en";
}
