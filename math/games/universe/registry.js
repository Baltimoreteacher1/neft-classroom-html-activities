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
  {
    id: "ratio-rush",
    href: "/math/games/universe/games/ratio-rush/",
    title: { en: "Ratio Rush", es: "Carrera de Razones" },
    genre: { en: "Rail adventure", es: "Aventura en tren" },
    tagline: {
      en: "Drive the Meridian Line. Keep pace with partner trains, win the junctions and charge the line, one ratio at a time.",
      es: "Conduce la Línea Meridiana. Lleva el paso de otros trenes, gana los cambios de vía y carga la línea, una razón a la vez.",
    },
    unit: 3,
    lessons: ["3-3", "3-5", "3-8"],
    standards: ["6.AT.3a", "6.AT.3", "6.AT.2"],
    features: ["reality-shift", "time-machine"],
  },
  {
    id: "balance-breakout",
    href: "/math/games/universe/games/balance-breakout/",
    title: { en: "Balance Breakout", es: "Fuga del Equilibrio" },
    genre: { en: "Physics puzzle platformer", es: "Plataformas y rompecabezas de física" },
    tagline: {
      en: "Every door in the Equilibrium Vault is locked by a balance. The balance is the equation: keep it level and get x alone.",
      es: "Cada puerta de la Bóveda del Equilibrio está cerrada con una balanza. La balanza es la ecuación: mantenla nivelada y deja x sola.",
    },
    unit: 8,
    lessons: ["8-1", "8-2", "8-3"],
    standards: ["6.AT.8"],
    features: ["time-machine"],
  },
  {
    id: "coordinate-couriers",
    href: "/math/games/universe/games/coordinate-couriers/",
    title: { en: "Coordinate Couriers", es: "Mensajeros de Coordenadas" },
    genre: { en: "Top-down delivery adventure", es: "Aventura de reparto vista desde arriba" },
    tagline: {
      en: "Meridia is built on the coordinate plane. Read the streets from the axes, cross the river by cable car, reflect into walled districts.",
      es: "Meridia está construida sobre el plano de coordenadas. Lee las calles desde los ejes, cruza el río en teleférico y refléjate en los distritos amurallados.",
    },
    unit: 7,
    lessons: ["7-5", "7-6", "7-8", "7-9"],
    standards: ["6.NOS.6", "6.NOS.7", "6.NOS.9"],
    features: ["time-machine"],
  },
  {
    id: "expression-factory",
    href: "/math/games/universe/games/expression-factory/",
    title: { en: "Expression Factory", es: "Fábrica de Expresiones" },
    genre: { en: "Automation puzzle", es: "Rompecabezas de automatización" },
    tagline: {
      en: "The production line is the expression. Build it, run crates of x through it, and prove two lines agree for every x.",
      es: "La línea de producción es la expresión. Ármala, pasa cajas de x por ella y demuestra que dos líneas coinciden para cada x.",
    },
    unit: 6,
    lessons: ["6-5", "6-6", "6-8", "6-14", "6-15"],
    standards: ["6.AT.6a", "6.AT.7"],
    features: ["time-machine"],
  },
  {
    id: "inequality-invasion",
    href: "/math/games/universe/games/inequality-invasion/",
    title: { en: "Inequality Invasion", es: "Invasión de Desigualdades" },
    genre: { en: "Gentle strategy", es: "Estrategia tranquila" },
    tagline: {
      en: "Glimmers drift through Lantern Valley, each carrying a number. Set the gates' inequalities so every garden lights with exactly the glimmers it wants.",
      es: "Los destellos cruzan el Valle de los Faroles, cada uno con un número. Pon las desigualdades de las puertas para que cada jardín se encienda con los destellos que quiere.",
    },
    unit: 8,
    lessons: ["8-4", "8-5", "8-6", "8-7"],
    standards: ["6.AT.8", "6.AT.9"],
    features: ["time-machine"],
  },
  {
    id: "fraction-food-truck",
    href: "/math/games/universe/games/fraction-food-truck/",
    title: { en: "Fraction Food Truck", es: "Food Truck de Fracciones" },
    genre: { en: "Kitchen game", es: "Juego de cocina" },
    tagline: {
      en: "Every order is a batch to portion. Set the serving station and watch the ladle prove your division, one serving at a time.",
      es: "Cada pedido es una tanda para repartir. Ajusta la estación de servir y mira cómo el cucharón comprueba tu división, porción por porción.",
    },
    unit: 6,
    lessons: ["6-1", "6-2", "6-9", "6-10", "6-11"],
    standards: ["6.NOS.1"],
    features: ["time-machine"],
  },
  {
    id: "data-chase",
    href: "/math/games/universe/games/data-chase/",
    title: { en: "The Data Chase", es: "La Caza de Datos" },
    genre: { en: "Investigative adventure", es: "Aventura de investigación" },
    tagline: {
      en: "Report for the Meridian Ledger: chase down the data, then publish only what the numbers really say.",
      es: "Reporta para el Meridian Ledger: persigue los datos y publica solo lo que los números de verdad dicen.",
    },
    unit: 2,
    lessons: ["2-1", "2-2", "2-3", "2-4", "2-5", "2-8", "2-10"],
    standards: ["6.DS.1", "6.DS.3", "6.DS.4", "6.DS.5", "6.DS.6d"],
    features: ["time-machine"],
  },
  {
    id: "netfold-engineer",
    href: "/math/games/universe/games/netfold-engineer/",
    title: { en: "NetFold Engineer", es: "Ingeniería de Plantillas" },
    genre: { en: "3D construction", es: "Construcción en 3D" },
    tagline: {
      en: "The Kinetic Workshop builds in 3D. Fold nets on their real hinges, wrap with exactly the surface area, and pack crates cube by cube.",
      es: "El Taller Cinético construye en 3D. Dobla plantillas por sus bisagras reales, envuelve con el área total justa y empaca cubo por cubo.",
    },
    unit: 5,
    lessons: ["5-5", "5-6", "5-7", "5-8", "5-10"],
    standards: ["6.GR.2", "6.GR.4"],
    features: ["time-machine"],
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
