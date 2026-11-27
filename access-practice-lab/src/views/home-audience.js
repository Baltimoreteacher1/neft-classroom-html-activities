// The top of the lab home: four audience doors (Student, Family, Classroom Teacher, ESOL Teacher), a compact "I know
// what I need" search door beside the one district door, and at most one row of "pick up where you left off" shortcuts drawn from state that already exists on this
// device. No names, no identity: every shortcut is a place, not a person.
// A role door never opens a tour: the Teacher Hub and the family start page each offer the tour among other choices.
import { readAudience } from "../audience.js";
import { BASE, html, icon, raw, safeJson, storage } from "../util.js";

const BOOK_LAST_KEY = "accessPracticeLab:v1:book-last";
// Saved resources: the Resource Finder and Teacher Hub list (any of its stored shapes) and saved teacher pathways.
const SAVED_KEY = "accessPracticeLab:v1:saved";
const SAVED_PATHWAYS_KEY = "accessTeacher:v1:savedPathways";

function hasSavedResources(read) {
  const saved = safeJson(read(SAVED_KEY), null);
  const items = Array.isArray(saved) ? saved : saved?.items;
  if (Array.isArray(items) ? items.length : items && typeof items === "object" && Object.keys(items).length) return true;
  const pathways = safeJson(read(SAVED_PATHWAYS_KEY), []);
  return Array.isArray(pathways) && pathways.some((p) => p && typeof p.id === "string");
}
const ART = `${BASE}/pictures`;

/**
 * The four doors, one per audience: Student, Family, Classroom Teacher, ESOL Teacher. Both teacher doors open the one
 * Teacher Hub; `?role=` tells it which tasks and resources to put first (src/audience.js TEACHER_ROLES), and a click
 * remembers that role on this device. The district door (BCPSS) sits under the doors as a plain link, beside search:
 * it serves one district's teachers, not a fifth audience (award audit C6).
 * `art` is existing lab illustration (pictures/), decorative: the card text carries the meaning.
 */
export const AUDIENCE_DOORS = Object.freeze([
  {
    id: "student",
    title: ["I’m a Student", "Soy estudiante"],
    text: [
      "Play, practice, create, and keep learning.",
      "Juega, practica, crea y sigue aprendiendo.",
    ],
    href: (grades) => `${BASE}/students${grades ? `?grades=${grades}` : ""}`,
    art: { src: `${ART}/ds/band-35-discovery.svg`, w: 360, h: 270 },
  },
  {
    id: "family",
    title: ["I’m a Family Member", "Soy de la familia"],
    text: [
      "Help your child practice English at home.",
      "Ayude a su hijo o hija a practicar inglés en casa.",
    ],
    href: () => `${BASE}/family-start`,
    art: { src: `${ART}/35-speaking-family-dinner.svg`, w: 640, h: 400 },
  },
  {
    id: "teacher",
    role: "classroom",
    title: ["I’m a Classroom Teacher", "Soy docente de aula"],
    text: [
      "Language supports for the lessons you already teach.",
      "Apoyos de lenguaje para las lecciones que ya enseña.",
    ],
    href: () => "/access-teacher/classroom/",
    art: { src: `${ART}/68-classroom-lesson.svg`, w: 640, h: 400 },
  },
  {
    id: "esol",
    role: "esol",
    title: ["I’m an ESOL Teacher", "Soy docente de ESOL"],
    text: [
      "ACCESS practice, WIDA data, your class and language evidence.",
      "Práctica ACCESS, datos WIDA, su clase y evidencia de lenguaje.",
    ],
    href: () => "/access-teacher/?role=esol",
    art: { src: `${ART}/ds/progress-growth.svg`, w: 360, h: 270 },
  },
]);

/** One district's door: under the four audience doors, beside search. */
export const DISTRICT_DOOR = Object.freeze({
  id: "bcpss",
  title: ["Baltimore City teacher?", "¿Docente de Baltimore City?"],
  text: ["BCPSS curriculum language bridges", "Puentes de lenguaje del currículo de BCPSS"],
  href: "/bcpss-teachers",
});

/**
 * Up to four shortcuts, each only when its state really exists on this device:
 * practice to continue (`practiceHref`), the hub this device last entered, the last Book Studio book, saved
 * teacher pathways. Pure apart from the injectable `read`.
 */
export function continueShortcuts({
  band = "",
  practiceHref = "",
  audience = readAudience(),
  read = (key) => storage.get(key),
} = {}) {
  const q = band ? `?grades=${band}` : "";
  const items = [];
  if (practiceHref)
    items.push({
      id: "practice",
      icon: "road",
      label: ["Continue my practice", "Continuar mi práctica"],
      href: practiceHref,
    });
  if (audience === "teacher")
    items.push({
      id: "teacher-hub",
      icon: "teacher",
      label: ["Return to Teacher Hub", "Volver al Centro docente"],
      href: "/access-teacher/",
    });
  if (read(BOOK_LAST_KEY))
    items.push({
      id: "book",
      icon: "writing",
      label: ["Continue my book", "Continuar mi libro"],
      href: `${BASE}/book-studio${q}`,
    });
  if (hasSavedResources(read))
    items.push({ id: "saved", icon: "bookmark", label: ["Open my saved resources", "Abrir mis recursos guardados"], href: "/access-practice-lab/search" });
  return items.slice(0, 4);
}

function shortcutsRowHTML(I, items) {
  if (!items.length) return "";
  return html`<nav
    class="lpa-continue"
    aria-label="${I.S("Pick up where you left off", "Sigue donde lo dejaste")}"
  >
    <span class="lpa-continue-label" aria-hidden="true"
      >${I.T("Welcome back", "Hola de nuevo")}</span
    >
    ${items.map(
      (it) =>
        html`<a class="lpa-chip" data-home-continue="${it.id}" href="${it.href}"
          >${icon(it.icon)}<span>${I.T(it.label[0], it.label[1])}</span></a
        >`,
    )}
  </nav>`;
}

/** The audience section: the page's one h1, the continue row, three doors and the search door. */
export function audienceHTML(I, { grades = "", shortcuts = [] } = {}) {
  const q = grades ? `?grades=${grades}` : "";
  return html`<section class="lpa" aria-labelledby="homeTitle">
    <div class="lpa-head">
      <h1 id="homeTitle" tabindex="-1">
        ${I.T("Practice English for school, one step at a time", "Practica inglés para la escuela, paso a paso")}
      </h1>
      <p class="lpa-lead">
        ${I.T("Who is here today? Choose your door.", "¿Quién está aquí hoy? Elige tu puerta.")}
      </p>
    </div>
    ${shortcutsRowHTML(I, shortcuts)}
    <ul class="lpa-doors" role="list">
      ${AUDIENCE_DOORS.map(
        (d) =>
          html`<li>
            <a class="lpa-door is-${d.id}" data-audience-door="${d.id}" ${d.role ? raw(`data-door-role="${d.role}"`) : ""} href="${d.href(grades)}">
              <span class="lpa-door-art"
                ><img
                  src="${d.art.src}"
                  width="${d.art.w}"
                  height="${d.art.h}"
                  alt=""
                  decoding="async"
              /></span>
              <span class="lpa-door-text">
                <strong>${I.T(d.title[0], d.title[1])}</strong>
                <span>${I.T(d.text[0], d.text[1])}</span>
              </span>
              <span class="lpa-door-go" aria-hidden="true">${icon("arrow-right")}</span>
            </a>
          </li>`,
      )}
    </ul>
    <div class="lpa-ways">
      <a class="lpa-search" data-audience-door="search" href="${BASE}/search${q}"
        >${icon("search")}<span
          ><strong>${I.T("I know what I need", "Sé lo que necesito")}</strong>
          <span>${I.T("Search all resources", "Buscar en todos los recursos")}</span></span
        >${icon("arrow-right", "lpa-search-go")}</a
      >
      <a class="lpa-search lpa-district" data-audience-door="${DISTRICT_DOOR.id}" href="${DISTRICT_DOOR.href}"
        >${icon("classroom")}<span
          ><strong>${I.T(...DISTRICT_DOOR.title)}</strong>
          <span>${I.T(...DISTRICT_DOOR.text)}</span></span
        >${icon("arrow-right", "lpa-search-go")}</a
      >
    </div>
  </section>`;
}
