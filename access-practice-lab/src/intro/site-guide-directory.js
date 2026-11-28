// Site Guide directory: the short list a teacher reads first. Three plain groups (teachers, students, families); the
// teacher and student groups are split into a few labeled steps (`subs`, each entry's `sub`) so the list reads in the
// order people use it: start, find, make, track. Each entry is a name, one plain sentence and one link. Names, sentences and links come from the site map (src/sitemap.js,
// the registry the navigation reads), so the guide never describes a page differently from the menu. Only the three
// section hubs and the Family Tour, which are not site-map destinations, carry their own { en, es } wording here.
// Pure data, no DOM: tools/access-intro-site-guide.test.mjs checks that every entry opens a real route or file.
import { familyTourHost } from "../family-tour-host.js";
import { DEST_BY_ID } from "../sitemap.js";

const P = (en, es) => ({ en, es });
const pair = ([en, es]) => P(en, es);

/** A site-map destination: its href becomes a lab route ("/start/tour") or stays a site path ("/access-teacher/"). */
function dest(id, title) {
  const d = DEST_BY_ID[id];
  if (!d) throw new Error(`site-guide-directory: unknown site-map destination "${id}"`);
  return {
    id,
    route: d.href.startsWith("/") ? d.href : `/${d.href}`,
    title: title || pair(d.title),
    text: pair(d.text),
  };
}

export const DIRECTORY = [
  {
    id: "teacher",
    icon: "teacher",
    title: P("For teachers", "Para docentes"),
    subs: [
      { id: "start", title: P("Start here", "Empiecen aquí") },
      { id: "find", title: P("Find activities for your class", "Encuentren actividades para su clase") },
      { id: "make", title: P("Make and share", "Crear y compartir") },
      { id: "track", title: P("Track progress", "Seguir el progreso") },
    ],
    entries: [
      { ...dest("start", P("Teachers: Start Here", "Docentes: empiecen aquí")), sub: "start" },
      { ...dest("teacher-tour"), sub: "start" },
      {
        id: "classroom-units",
        route: "/access-teacher/classroom/",
        sub: "find",
        title: P("Activities for my unit", "Actividades para mi unidad"),
        text: P(
          "Pick your grade, subject and unit, then open ready-made language activities for it.",
          "Elijan su grado, materia y unidad, y abran actividades de lenguaje ya preparadas.",
        ),
      },
      { ...dest("library"), sub: "find" },
      {
        id: "bcpss",
        route: "/bcpss-teachers/",
        site: true,
        sub: "find",
        title: P("Baltimore City curriculum bridges", "Puentes con el currículo de Baltimore City"),
        text: P(
          "Language supports, packets and the Writing Lab for each BCPSS unit.",
          "Apoyos de lenguaje, paquetes y el laboratorio de escritura para cada unidad de BCPSS.",
        ),
      },
      {
        id: "teacher-tools",
        route: "/tools/",
        site: true,
        // The Teacher Tools front pages are served on thelanguagepage.com only (functions/_lib/lp-front.js).
        lpHost: true,
        sub: "make",
        title: P("Teacher Tools", "Herramientas docentes"),
        text: P(
          "Game Maker, sentence frames, warm-ups, scaffolds and score help, ready in minutes.",
          "Creador de juegos, marcos de oraciones, calentamientos, andamiajes y ayuda con puntajes en minutos.",
        ),
      },
      { ...dest("activity-studio"), sub: "make" },
      { ...dest("launch"), sub: "make" },
      { ...dest("classroom"), sub: "make" },
      { ...dest("teacher-hub"), sub: "track" },
      { ...dest("wida-data-studio"), sub: "track" },
    ],
  },
  {
    id: "student",
    icon: "reading",
    title: P("For students", "Para estudiantes"),
    subs: [
      { id: "practice", title: P("Practice", "Practicar") },
      { id: "create", title: P("Play and create", "Jugar y crear") },
      { id: "mine", title: P("My progress", "Mi progreso") },
    ],
    entries: [
      {
        id: "practice",
        route: "/explore/practice",
        sub: "practice",
        title: P("Practice by skill", "Practicar por destreza"),
        text: P(
          "Listening, reading, speaking and writing practice. Pick a skill, then start.",
          "Práctica de escuchar, leer, hablar y escribir. Elijan una destreza y empiecen.",
        ),
      },
      { ...dest("access-prep", P("Access Prep", "Preparación ACCESS")), sub: "practice" },
      { ...dest("book-studio", P("Create a Book", "Crear un libro")), sub: "create" },
      {
        id: "play",
        route: "/explore/play",
        sub: "create",
        title: P("Games & Worlds", "Juegos y mundos"),
        text: P(
          "Games, story worlds and real-life scenes. Every one practices real language.",
          "Juegos, mundos de cuentos y escenas de la vida real. Todos practican lenguaje real.",
        ),
      },
      { ...dest("early"), sub: "practice" },
      { ...dest("passport"), sub: "mine" },
    ],
  },
  {
    id: "family",
    icon: "families",
    title: P("For families", "Para familias"),
    entries: [
      {
        id: "family-tour",
        route: "/family-tour/",
        // The tour is served on thelanguagepage.com only (family-tour-host.js), where Practice Together opens it too.
        lpHost: true,
        title: P("Family Tour", "Recorrido familiar"),
        text: P(
          "A short walk-through of how to help your child practice English at home.",
          "Un recorrido corto de cómo ayudar a su hijo o hija a practicar inglés en casa.",
        ),
      },
      { ...dest("practice-together"), lpHost: false },
      dest("family-corner"),
    ],
  },
];

/** "Can't find it?": the full list, search and help, one line under the directory. */
export const ELSEWHERE = [dest("explore"), dest("search"), dest("tools")];

/** Every lab route or site path the directory links to. */
export const directoryRoutes = () =>
  [...DIRECTORY.flatMap((g) => g.entries), ...ELSEWHERE].map((e) => e.route);

/** Directory entries that are site paths outside the lab (served from their own folder, not a lab view). */
export const siteRoutes = () => DIRECTORY.flatMap((g) => g.entries).filter((e) => e.site).map((e) => e.route);

/**
 * The groups for this reader: their own group once they choose, every group until then. `lpHost` entries show only on
 * thelanguagepage.com (true: the Family Tour and the Teacher Tools front pages are served there) or only elsewhere
 * (false), so nobody gets a link to a page their host does not serve, and families never see two links to one page.
 */
export const directoryGroups = (audience = "") =>
  DIRECTORY.filter((g) => !audience || g.id === audience).map((g) => ({
    ...g,
    entries: g.entries.filter((e) => e.lpHost === undefined || e.lpHost === familyTourHost()),
  }));
