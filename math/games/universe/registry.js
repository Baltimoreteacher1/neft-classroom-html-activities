// Math Universe — the one list of games. Plain data, no DOM.
//
// Read by: the universe arcade page (math/games/universe/index.html), the
// Learning Lab generator (each lab's Games stage launches the game for its
// lessons), the unit hub link generator (scripts/generate-universe-links.mjs),
// the SCORM catalog check and the browser gate. Add a game here and nowhere else.
//
// `lessons` are curriculum lesson ids (data/curriculum-launch-manifest.json).
// A game opens on the level for the lesson it was launched from (?lesson=6-4).

export const GAMES = [
  {
    id: "power-plant",
    href: "/math/games/universe/games/power-plant/",
    title: { en: "Power Plant", es: "Planta de Energía" },
    genre: { en: "Action platformer", es: "Plataformas de acción" },
    tagline: {
      en: "Every lift, bridge and door in Helix Station runs on an expression. Set the exponents, place the grouping, and teach Ori.",
      es: "Cada elevador, puente y puerta de la Estación Hélice funciona con una expresión. Ajusta los exponentes, coloca la agrupación y enséñale a Ori.",
    },
    unit: 6,
    lessons: ["6-3", "6-4"],
    standards: ["6.AT.5", "6.AT.6c"],
    features: ["time-machine", "apprentice"],
  },
];

/** The game for a lesson id, or null. */
export function gameForLesson(lessonId) {
  return GAMES.find((g) => g.lessons.includes(lessonId)) || null;
}

/** Launch URL that opens on the lesson's own level. */
export function launchHref(game, lessonId) {
  return lessonId ? `${game.href}?lesson=${lessonId}` : game.href;
}
