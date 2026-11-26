/** EN/ES interface text for the coordinate map designer (coord-map-view.js). Each entry is [en, es], or [[park en, es], [sub en, es]]. */
export const L = {
  title: [
    ["Theme park map designer", "Diseñador del mapa del parque"],
    ["Mission control route planner", "Planificador de ruta del control de misión"],
  ],
  intro: [
    [
      "Drag A, B or an attraction to a grid point, or focus it and use the arrow keys. Join attractions with paths: each path is one horizontal leg and one vertical leg. Each grid square is 1 unit.",
      "Arrastra A, B o una atracción a un punto de la cuadrícula, o selecciónala y usa las flechas. Une atracciones con caminos: cada camino tiene un tramo horizontal y uno vertical. Cada cuadrado mide 1 unidad.",
    ],
    [
      "The sub leaves dock A, visits your waypoints in order and ends at target B. Depth is the y-coordinate: 0 is the surface, negative numbers are below it. Drag a waypoint or use the arrow keys. Keep the route out of the hazard zone.",
      "El submarino sale del muelle A, visita tus puntos de ruta en orden y termina en el objetivo B. La profundidad es la coordenada y: 0 es la superficie y los números negativos están debajo. Arrastra un punto o usa las flechas. Mantén la ruta fuera de la zona de peligro.",
    ],
  ],
  add: ["Add to the map", "Agrega al mapa"],
  undo: ["Undo map", "Deshacer mapa"],
  redo: ["Redo map", "Rehacer mapa"],
  checks: ["Constraint check", "Revisión de condiciones"],
  distinct: [
    ["No two attractions share a point", "Ningún par de atracciones comparte un punto"],
    ["No two route points share a point", "Ningún par de puntos de la ruta comparte un punto"],
  ],
  inside: [
    [
      "Every attraction is inside the park fence (−10 to 10)",
      "Cada atracción está dentro de la cerca (−10 a 10)",
    ],
    [
      "Every point is inside the chart and at or below the surface",
      "Cada punto está dentro de la carta y en la superficie o debajo",
    ],
  ],
  routes: [
    "There is one entrance gate and a path route from it to every attraction",
    "Hay una sola entrada y una ruta de caminos desde ella hasta cada atracción",
  ],
  safe: ["Every leg stays out of the hazard zone", "Ningún tramo entra en la zona de peligro"],
  log: [
    ["Path log", "Registro de caminos"],
    ["Route log", "Registro de la ruta"],
  ],
  noPaths: [
    [
      "No paths yet. Choose two places below and add a path.",
      "Todavía no hay caminos. Elige dos lugares abajo y agrega un camino.",
    ],
    [
      "Add a waypoint to plan a route around the hazard.",
      "Agrega un punto de ruta para rodear la zona de peligro.",
    ],
  ],
  hiddenNote: ["? = check it in Test first", "? = primero compruébalo en Probar"],
  total: ["Total route", "Ruta total"],
  from: ["Path from", "Camino desde"],
  to: ["to", "hasta"],
  addPath: ["Add path", "Agregar camino"],
  connect: ["Connect by tapping two places", "Conectar tocando dos lugares"],
  connecting: [
    "Now tap or press Enter on the second place.",
    "Ahora toca o presiona Enter en el segundo lugar.",
  ],
  none: [
    "Select a point on the map to move, mirror or remove it.",
    "Selecciona un punto del mapa para moverlo, reflejarlo o quitarlo.",
  ],
  selected: ["Selected", "Seleccionado"],
  mirrorY: ["Mirror across the y-axis", "Reflejar sobre el eje y"],
  mirrorX: ["Mirror across the x-axis", "Reflejar sobre el eje x"],
  remove: ["Remove", "Quitar"],
  flip: ["Flip the corner", "Cambiar la esquina"],
  earlier: ["Visit earlier", "Visitar antes"],
  later: ["Visit later", "Visitar después"],
  twist: ["Twist: move A across the y-axis", "Giro: mueve A al otro lado del eje y"],
  twistLocked: [
    "The twist unlocks after your reflection across the y-axis matches in Test.",
    "El giro se desbloquea cuando tu reflexión sobre el eje y coincida en Probar.",
  ],
  missionPt: [
    "A and B are your design points. Moving them changes the design, so your math checks run again.",
    "A y B son los puntos de tu diseño. Al moverlos cambia el diseño y debes comprobar de nuevo.",
  ],
  full: [
    "The map already has 12 points. Remove one first.",
    "El mapa ya tiene 12 puntos. Quita uno primero.",
  ],
  noRoom: ["There is no free grid point left.", "No queda ningún punto libre."],
  taken: ["That mirror point is already used.", "Ese punto reflejado ya está ocupado."],
  onAxis: [
    "That attraction sits on the axis, so its mirror image is itself.",
    "Esa atracción está sobre el eje, así que su reflejo es ella misma.",
  ],
  exists: ["Those two places already have a path.", "Esos dos lugares ya tienen un camino."],
  same: ["Choose two different places.", "Elige dos lugares diferentes."],
  pathsFull: ["The map already has 20 paths.", "El mapa ya tiene 20 caminos."],
};
