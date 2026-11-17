// Site Guide directory: the short list a teacher reads first. Three plain groups (teachers, students, families), each
// entry a name, one plain sentence and one link. Names, sentences and links come from the site map (src/sitemap.js,
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
    entries: [
      dest("start", P("Teachers: Start Here", "Docentes: empiecen aquí")),
      dest("teacher-tour"),
      dest("library"),
      dest("launch"),
      dest("classroom"),
      dest("teacher-hub"),
      dest("wida-data-studio"),
    ],
  },
  {
    id: "student",
    icon: "reading",
    title: P("For students", "Para estudiantes"),
    entries: [
      {
        id: "practice",
        route: "/explore/practice",
        title: P("Practice by skill", "Practicar por destreza"),
        text: P(
          "Listening, reading, speaking and writing practice. Pick a skill, then start.",
          "Práctica de escuchar, leer, hablar y escribir. Elijan una destreza y empiecen.",
        ),
      },
      dest("access-prep", P("Access Prep", "Preparación ACCESS")),
      dest("book-studio", P("Create a Book", "Crear un libro")),
      {
        id: "play",
        route: "/explore/play",
        title: P("Games & Worlds", "Juegos y mundos"),
        text: P(
          "Games, story worlds and real-life scenes. Every one practices real language.",
          "Juegos, mundos de cuentos y escenas de la vida real. Todos practican lenguaje real.",
        ),
      },
      dest("passport"),
      dest("early"),
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
        tourHost: true,
        title: P("Family Tour", "Recorrido familiar"),
        text: P(
          "A short walk-through of how to help your child practice English at home.",
          "Un recorrido corto de cómo ayudar a su hijo o hija a practicar inglés en casa.",
        ),
      },
      { ...dest("practice-together"), tourHost: false },
      dest("family-corner"),
    ],
  },
];

/** "Can't find it?": the full list, search and help, one line under the directory. */
export const ELSEWHERE = [dest("explore"), dest("search"), dest("tools")];

/** Every lab route or site path the directory links to. */
export const directoryRoutes = () =>
  [...DIRECTORY.flatMap((g) => g.entries), ...ELSEWHERE].map((e) => e.route);

/**
 * The groups for this reader: their own group once they choose, every group until then. `tourHost` entries show only
 * where the Family Tour is served (true) or only where it is not (false), so families never see two links to one page.
 */
export const directoryGroups = (audience = "") =>
  DIRECTORY.filter((g) => !audience || g.id === audience).map((g) => ({
    ...g,
    entries: g.entries.filter((e) => e.tourHost === undefined || e.tourHost === familyTourHost()),
  }));
