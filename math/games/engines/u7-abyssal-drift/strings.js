// Abyssal Drift strings, English and Spanish (tú). Identical keys in both tables.

export const STRINGS = {
  en: {
    title: "Abyssal Drift: Sub-Surface Vector Navigator",
    missionNav:
      "Telemetry: a hydrothermal vent is at ({x}, {y}). Set the x-thruster and the y-ballast, then dive to it. The surface is y = 0, and negative y is depth.",
    missionDrone:
      "A survey drone hovers {k} m above the surface, at +{k}. Hold the sub at the same distance from the surface, but underwater.",
    missionBuoy:
      "A buoy's anchor rests at {g} m, under the water. Lift the sub into the air at the same distance from the surface.",
    missionDeepest: "Depth readings: {r}. Park the sub at the deepest reading.",
    missionHighest: "Depth readings: {r}. Park the sub at the highest reading.",
    missionClosest: "Depth readings: {r}. Park the sub at the reading closest to the surface.",
    missionFarthest:
      "Depth readings: {r}. Park the sub at the reading farthest from the surface, where the hull strains most.",
    missionMiddle:
      "Depth readings: {r}. Put them in order from deepest to highest, then park the sub at the middle one.",
    missionTether:
      "Beacon A is at ({ax}, {ay}) and beacon B is at ({bx}, {by}). Set the tether dial to the exact distance between them, then fire the tether.",
    missionMirror:
      "Sonar contact P is at ({px}, {py}). Its echo comes from the mirror image of P across the {axis}. Set the sub to the mirror point and fire the sonar mirror.",
    axisX: "x-axis (the surface)",
    axisY: "y-axis",
    thrustX: "x-thruster (east +, west −)",
    ballastY: "y-ballast (up +, down −)",
    tether: "Tether length",
    fmtEast: "{v}, {a} east",
    fmtWest: "{v}, {a} west",
    fmtZeroX: "0, on the y-axis",
    fmtUp: "{v}, {a} m above the surface",
    fmtDown: "{v}, {a} m below the surface",
    fmtSurface: "0, at the surface",
    fmtLen: "{v} m",
    dive: "Dive",
    hold: "Hold depth",
    fire: "Fire tether",
    mirror: "Fire sonar mirror",
    moveX: "Move along x",
    moveY: "Move along y",
    layLink: "Lay one link",
    movedX: "The sub moved along x. It is at ({x}, {y}).",
    movedY: "The sub moved along y. It is at ({x}, {y}).",
    linkLaid: "One more link laid. Count the links.",
    linksDone: "The links reach beacon B. How many did you lay?",
    tooEast: "too far east",
    tooWest: "too far west",
    tooHighAir: "too high",
    tooLowAir: "too low",
    tooShallow: "too shallow",
    tooDeep: "too deep",
    missOne: "The sonar ping missed the vent: the sub is {a}.",
    missTwo: "The sonar ping missed: the sub is {a} and {b}.",
    swapped:
      "Check the order: the first number in an ordered pair is x (east or west), the second is y (up or down).",
    solvedNav: "Vent found! The sub reached ({x}, {y}).",
    hullAbove: "Too high: the sub is above the surface. Underwater positions are negative.",
    hullBelow: "Too low: the sub is under the water. Positions in the air are positive.",
    hullHigh: "Too high: bring the sub down.",
    hullLow: "Too low: bring the sub up.",
    absOrder:
      "Careful: you sorted by distance from the surface. To order positions, compare the signed values: lower on the line is less.",
    valueDistance:
      "Careful: distance from the surface is the absolute value, so ignore the sign when you compare distances.",
    solvedHull: "Hull steady at {d} m. Its distance from the surface is {a} m.",
    short: "The tether fell short of beacon B. It needs more length.",
    long: "The tether sags: it is longer than the distance between the beacons.",
    subtracted:
      "The beacons are on opposite sides of the axis. The distances from the axis add up across it.",
    added:
      "Both beacons are on the same side of the axis, so the shorter distance is part of the longer one.",
    solvedTether: "Taut! The beacons are {d} m apart.",
    unchanged:
      "The sub is sitting on the contact itself. A mirror image is on the other side of the axis.",
    bothFlipped: "You changed both signs. A mirror across one axis changes only one coordinate.",
    wrongAxis: "That is a mirror across the other axis. Reflect across the {axis}.",
    solvedMirror: "Echo locked! ({x}, {y}) mirrors ({px}, {py}) across the {axis}.",
    modeNav: "NAVIGATE",
    modeHull: "HULL STRAIN",
    modeTether: "TETHER",
    modeMirror: "SONAR MIRROR",
    plateX: "x-thruster: {v}",
    plateY: "y-ballast: {v}",
    plateDepth: "Depth: {v} m",
    plateStrain: "Hull strain: {v}",
    absLabel: "|{v}| = {a}",
    plateLen: "Tether: {v} m",
    descNav:
      "Navigate. Vent telemetry ({tx}, {ty}). The sub is at ({x}, {y}). Thrusters set to x {sx} and y {sy}.",
    descHullDrone:
      "Hull strain. The drone hovers at {g} m. The sub's depth is set to {d} m, so the hull strain is {s}.",
    descHullBuoy:
      "Hull strain. The buoy anchor rests at {g} m. The sub's depth is set to {d} m, so the hull strain is {s}.",
    descHullOrder:
      "Hull strain. Readings {r}. The sub's depth is set to {d} m, so the hull strain is {s}.",
    descTether:
      "Tether. Beacon A at ({ax}, {ay}), beacon B at ({bx}, {by}). The tether dial is set to {l} m.",
    descMirror:
      "Sonar mirror. Contact P at ({px}, {py}), mirror along the {axis}. The mirror point is set to ({x}, {y}); the sub is at ({sx}, {sy}).",
  },
  es: {
    title: "Deriva Abisal: navegador de vectores bajo el mar",
    missionNav:
      "Telemetría: hay una fuente hidrotermal en ({x}, {y}). Ajusta el propulsor x y el lastre y, y luego sumérgete hasta ella. La superficie es y = 0 y una y negativa es profundidad.",
    missionDrone:
      "Un dron de exploración flota a {k} m sobre la superficie, en +{k}. Mantén el submarino a la misma distancia de la superficie, pero bajo el agua.",
    missionBuoy:
      "El ancla de una boya descansa en {g} m, bajo el agua. Eleva el submarino al aire a la misma distancia de la superficie.",
    missionDeepest:
      "Lecturas de profundidad: {r}. Estaciona el submarino en la lectura más profunda.",
    missionHighest: "Lecturas de profundidad: {r}. Estaciona el submarino en la lectura más alta.",
    missionClosest:
      "Lecturas de profundidad: {r}. Estaciona el submarino en la lectura más cercana a la superficie.",
    missionFarthest:
      "Lecturas de profundidad: {r}. Estaciona el submarino en la lectura más lejana de la superficie, donde el casco sufre más.",
    missionMiddle:
      "Lecturas de profundidad: {r}. Ordénalas de la más profunda a la más alta y luego estaciona el submarino en la del medio.",
    missionTether:
      "La baliza A está en ({ax}, {ay}) y la baliza B está en ({bx}, {by}). Ajusta el dial del cable a la distancia exacta entre ellas y luego lanza el cable.",
    missionMirror:
      "El contacto de sonar P está en ({px}, {py}). Su eco viene de la imagen reflejada de P sobre el {axis}. Lleva el submarino al punto reflejado y activa el espejo de sonar.",
    axisX: "eje x (la superficie)",
    axisY: "eje y",
    thrustX: "Propulsor x (este +, oeste −)",
    ballastY: "Lastre y (arriba +, abajo −)",
    tether: "Largo del cable",
    fmtEast: "{v}, {a} al este",
    fmtWest: "{v}, {a} al oeste",
    fmtZeroX: "0, sobre el eje y",
    fmtUp: "{v}, {a} m sobre la superficie",
    fmtDown: "{v}, {a} m bajo la superficie",
    fmtSurface: "0, en la superficie",
    fmtLen: "{v} m",
    dive: "Sumergirse",
    hold: "Fijar profundidad",
    fire: "Lanzar el cable",
    mirror: "Activar el espejo de sonar",
    moveX: "Moverse en x",
    moveY: "Moverse en y",
    layLink: "Tender un eslabón",
    movedX: "El submarino se movió en x. Está en ({x}, {y}).",
    movedY: "El submarino se movió en y. Está en ({x}, {y}).",
    linkLaid: "Tendiste un eslabón más. Cuenta los eslabones.",
    linksDone: "Los eslabones llegan a la baliza B. ¿Cuántos tendiste?",
    tooEast: "demasiado al este",
    tooWest: "demasiado al oeste",
    tooHighAir: "demasiado alto",
    tooLowAir: "demasiado bajo",
    tooShallow: "demasiado cerca de la superficie",
    tooDeep: "demasiado profundo",
    missOne: "El pulso de sonar no encontró la fuente: el submarino está {a}.",
    missTwo: "El pulso de sonar falló: el submarino está {a} y {b}.",
    swapped:
      "Revisa el orden: el primer número de un par ordenado es x (este u oeste) y el segundo es y (arriba o abajo).",
    solvedNav: "¡Fuente encontrada! El submarino llegó a ({x}, {y}).",
    hullAbove:
      "Demasiado alto: el submarino está sobre la superficie. Las posiciones bajo el agua son negativas.",
    hullBelow:
      "Demasiado bajo: el submarino está bajo el agua. Las posiciones en el aire son positivas.",
    hullHigh: "Demasiado alto: baja el submarino.",
    hullLow: "Demasiado bajo: sube el submarino.",
    absOrder:
      "Cuidado: ordenaste por la distancia a la superficie. Para ordenar posiciones, compara los valores con su signo: más abajo en la recta es menor.",
    valueDistance:
      "Cuidado: la distancia a la superficie es el valor absoluto, así que no tomes en cuenta el signo al comparar distancias.",
    solvedHull: "Casco estable en {d} m. Su distancia a la superficie es {a} m.",
    short: "El cable no llegó a la baliza B. Le falta largo.",
    long: "El cable cuelga: es más largo que la distancia entre las balizas.",
    subtracted:
      "Las balizas están en lados opuestos del eje. Las distancias al eje se suman de un lado al otro.",
    added:
      "Las dos balizas están del mismo lado del eje, así que la distancia más corta es parte de la más larga.",
    solvedTether: "¡Tenso! Las balizas están a {d} m una de la otra.",
    unchanged:
      "El submarino está justo sobre el contacto. La imagen reflejada está al otro lado del eje.",
    bothFlipped:
      "Cambiaste los dos signos. Un reflejo sobre un solo eje cambia solo una coordenada.",
    wrongAxis: "Ese es el reflejo sobre el otro eje. Refleja sobre el {axis}.",
    solvedMirror: "¡Eco fijado! ({x}, {y}) es el reflejo de ({px}, {py}) sobre el {axis}.",
    modeNav: "NAVEGAR",
    modeHull: "PRESIÓN DEL CASCO",
    modeTether: "CABLE",
    modeMirror: "ESPEJO DE SONAR",
    plateX: "Propulsor x: {v}",
    plateY: "Lastre y: {v}",
    plateDepth: "Profundidad: {v} m",
    plateStrain: "Presión del casco: {v}",
    absLabel: "|{v}| = {a}",
    plateLen: "Cable: {v} m",
    descNav:
      "Navegar. Telemetría de la fuente ({tx}, {ty}). El submarino está en ({x}, {y}). Propulsores en x {sx} y en y {sy}.",
    descHullDrone:
      "Presión del casco. El dron flota en {g} m. La profundidad del submarino está en {d} m, así que la presión del casco es {s}.",
    descHullBuoy:
      "Presión del casco. El ancla de la boya está en {g} m. La profundidad del submarino está en {d} m, así que la presión del casco es {s}.",
    descHullOrder:
      "Presión del casco. Lecturas {r}. La profundidad del submarino está en {d} m, así que la presión del casco es {s}.",
    descTether:
      "Cable. Baliza A en ({ax}, {ay}), baliza B en ({bx}, {by}). El dial del cable está en {l} m.",
    descMirror:
      "Espejo de sonar. Contacto P en ({px}, {py}), espejo sobre el {axis}. El punto reflejado está en ({x}, {y}); el submarino está en ({sx}, {sy}).",
  },
};
