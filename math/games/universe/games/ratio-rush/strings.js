// Ratio Rush — every word the student reads, English and Spanish (tú register).

export const STRINGS = {
  en: {
    dispatch: "Dispatch",
    mi: "mi",
    min: "min",
    cells: "cells",
    cellsLeft: "Charge cells left",
    upper: "Upper",
    lower: "Lower",
    limit: "limit",
    station: "Station",
    rival: "Rival courier",
    charger: "Charger",
    stopHere: "Stop here",
    you: "You",
    realityA: "First reality",
    realityB: "Shifted reality",
    // objectives
    objDrive: "Drive to the next signal (→ to go, ← to brake).",
    objCouple:
      "Couple with {name}. Set a gear that keeps pace: {name} runs {pd} mi every {pt} min.",
    objJunction:
      "Beat the rival courier to the station. Pick the faster branch.",
    objDepot: "Load exactly enough charge to reach the charger {span} mi away.",
    objExit: "The line is open. Drive into the tunnel.",
    objCart:
      "A maintenance cart is on the line. Switch tracks at a ⇅ crossover (↑ / ↓).",
    // use prompts
    useCouple: "Gear console",
    useJunction: "Junction lever",
    useDepot: "Charge depot",
    whatSignal: "the next signal",
    whatExit: "the tunnel",
    // gear console
    gearTitle: "Gear console",
    gearNote:
      "Your train will cover d miles every t minutes. {name} covers {pd} miles every {pt} minutes. The crane only couples trains that arrive together, {span} miles ahead.",
    gearD: "Miles (d): the gears you have",
    gearT: "Minutes (t)",
    gearTable: "Show a ratio table",
    tableNote: "Your gear, minute by minute:",
    go: "Release the brake",
    less: "One fewer",
    more: "One more",
    // junction console
    juncTitle: "Junction lever",
    juncNote:
      "Both branches end at the same station. The rival courier takes the branch you do not.",
    pickUpper: "Upper branch",
    pickLower: "Lower branch",
    juncPredict: "Which branch reaches the station first?",
    goJunction: "Set the lever and go",
    // depot console
    depotTitle: "Charge depot",
    depotNote:
      "Each {t} cells of charge carry the train {d} miles. The charger is {span} miles away. Charge you load is spent; extra charge is released at the charger.",
    depotCells: "Cells to load",
    loadGo: "Load and go",
    noCells: "Not enough cells left for that.",
    // outcomes
    coupled:
      "Side by side the whole way: {you} minutes each. The crane couples you to {name}.",
    coupleEarly:
      "You reached the crane at {you} min; {name} at {them} min. Too early to couple. Back to the signal.",
    coupleLate:
      "{name} reached the crane at {them} min; you at {you} min. Too late to couple. Back to the signal.",
    junctionWin:
      "You reached the station first ({you} min against {them}). The gate opens.",
    junctionLose:
      "The rival got there first ({them} min against your {you}). Back to the junction.",
    chargeExact:
      "Exactly enough: the train glides into the charger with {cells} cells used.",
    chargeExtra:
      "You made it, but {wasted} cells of extra charge were released at the charger.",
    chargeShort:
      "The charge ran out after {reach} of {span} miles. A tow crew brings you back; those cells are spent.",
    // story and tutorial
    hello:
      "The Meridian Line is closed until every coupling, junction and charger is working. → drives, ← brakes.",
    signalStop: "Red signal. Stop beside it and press E to open the console.",
    pace: "Watch the tick marks under the rails: one for each minute. Same spacing means same rate.",
    junctionHi:
      "Two branches, one station. Length and speed limit both matter.",
    depotHi:
      "Charge is shared across the whole line. Load what each leg needs, no more.",
    cartAhead: "Cart ahead! Slide to the side track at a ⇅ crossover.",
    bumped: "Gentle bump. Nothing is lost.",
    noSwitch: "No crossover here. Look for ⇅.",
    buffer: "End of the track.",
    // reality shift
    shiftGear: "Second reality: same run, different gear",
    shiftBranch: "Second reality: the other branch",
    shiftCells: "Second reality: a different charge",
    shiftOpen: "Open it",
    shiftNeedStop:
      "Stop at a signal first. A Reality Shift changes one condition of the next run.",
    shiftHint:
      "Then release the brake: both realities run at once. Switch between them to watch each one.",
    counterOk: "In the other reality it worked.",
    counterBad: "In the other reality it did not work.",
    // reasoning
    explainGear:
      "Your gear and {name}'s gear look different but kept pace. Why?",
    frameGear1: "Both trains go",
    frameGear2: "The ratios are equivalent because",
    explainJunction: "The longer branch is not always slower. What decided it?",
    frameJ1: "I compared",
    frameJ2: "The faster branch was the one where",
    explainDepot: "How did you work out the number of cells?",
    frameD1: "One cell carries the train",
    frameD2: "I needed",
    // measures (investigation table)
    m_yourRate: "Your rate (mi : min)",
    m_partnerRate: "Partner rate (mi : min)",
    m_after2: "Your miles after 2 min",
    m_partnerAfter2: "Partner miles after 2 min",
    m_arrive: "You arrive (min)",
    m_partnerArrive: "Partner arrives (min)",
    m_rivalArrive: "Rival arrives (min)",
    m_distance: "Distance (mi)",
    m_branch: "Branch",
    m_yourLength: "Your branch length (mi)",
    m_cells: "Cells loaded",
    m_reach: "Charge reaches (mi)",
    m_efficiency: "Efficiency (mi : cells)",
  },
  es: {
    dispatch: "Despacho",
    mi: "mi",
    min: "min",
    cells: "celdas",
    cellsLeft: "Celdas de carga que quedan",
    upper: "Superior",
    lower: "Inferior",
    limit: "límite",
    station: "Estación",
    rival: "Mensajero rival",
    charger: "Cargador",
    stopHere: "Detente aquí",
    you: "Tú",
    realityA: "Primera realidad",
    realityB: "Realidad cambiada",
    objDrive: "Conduce hasta la próxima señal (→ para avanzar, ← para frenar).",
    objCouple:
      "Engánchate con {name}. Elige un engranaje que lleve el mismo paso: {name} avanza {pd} mi cada {pt} min.",
    objJunction:
      "Llega a la estación antes que el mensajero rival. Elige el ramal más rápido.",
    objDepot:
      "Carga exactamente lo necesario para llegar al cargador, a {span} mi.",
    objExit: "La línea está abierta. Entra en el túnel.",
    objCart:
      "Hay un carrito de mantenimiento en la vía. Cambia de vía en un cruce ⇅ (↑ / ↓).",
    useCouple: "Consola de engranajes",
    useJunction: "Palanca de cambio",
    useDepot: "Depósito de carga",
    whatSignal: "la próxima señal",
    whatExit: "el túnel",
    gearTitle: "Consola de engranajes",
    gearNote:
      "Tu tren recorrerá d millas cada t minutos. {name} recorre {pd} millas cada {pt} minutos. La grúa solo engancha trenes que llegan juntos, {span} millas adelante.",
    gearD: "Millas (d): los engranajes que tienes",
    gearT: "Minutos (t)",
    gearTable: "Mostrar una tabla de razones",
    tableNote: "Tu engranaje, minuto a minuto:",
    go: "Soltar el freno",
    less: "Uno menos",
    more: "Uno más",
    juncTitle: "Palanca de cambio",
    juncNote:
      "Los dos ramales terminan en la misma estación. El mensajero rival toma el ramal que tú no tomes.",
    pickUpper: "Ramal superior",
    pickLower: "Ramal inferior",
    juncPredict: "¿Qué ramal llega primero a la estación?",
    goJunction: "Mover la palanca y salir",
    depotTitle: "Depósito de carga",
    depotNote:
      "Cada {t} celdas de carga llevan el tren {d} millas. El cargador está a {span} millas. La carga que pones se gasta; la carga de más se libera en el cargador.",
    depotCells: "Celdas que cargas",
    loadGo: "Cargar y salir",
    noCells: "No quedan suficientes celdas para eso.",
    coupled:
      "Lado a lado todo el camino: {you} minutos cada uno. La grúa te engancha con {name}.",
    coupleEarly:
      "Llegaste a la grúa en {you} min; {name}, en {them} min. Demasiado pronto para engancharse. De vuelta a la señal.",
    coupleLate:
      "{name} llegó a la grúa en {them} min; tú, en {you} min. Demasiado tarde para engancharse. De vuelta a la señal.",
    junctionWin:
      "Llegaste primero a la estación ({you} min contra {them}). La puerta se abre.",
    junctionLose:
      "El rival llegó primero ({them} min contra tus {you}). De vuelta al cambio de vía.",
    chargeExact:
      "Justo lo necesario: el tren llega al cargador usando {cells} celdas.",
    chargeExtra:
      "Llegaste, pero se liberaron {wasted} celdas de carga de más en el cargador.",
    chargeShort:
      "La carga se acabó después de {reach} de {span} millas. Una grúa te trae de vuelta; esas celdas se gastaron.",
    hello:
      "La Línea Meridiana está cerrada hasta que funcionen todos los enganches, cambios de vía y cargadores. → avanza, ← frena.",
    signalStop:
      "Señal roja. Detente junto a ella y presiona E para abrir la consola.",
    pace: "Mira las marcas bajo los rieles: una por cada minuto. La misma separación significa la misma tasa.",
    junctionHi:
      "Dos ramales, una estación. Importan la longitud y el límite de velocidad.",
    depotHi:
      "La carga se comparte en toda la línea. Carga lo que necesita cada tramo, ni más ni menos.",
    cartAhead: "¡Carrito adelante! Pasa a la vía lateral en un cruce ⇅.",
    bumped: "Un empujón suave. No se pierde nada.",
    noSwitch: "Aquí no hay cruce. Busca ⇅.",
    buffer: "Fin de la vía.",
    shiftGear: "Segunda realidad: el mismo recorrido, otro engranaje",
    shiftBranch: "Segunda realidad: el otro ramal",
    shiftCells: "Segunda realidad: otra carga",
    shiftOpen: "Abrirla",
    shiftNeedStop:
      "Primero detente en una señal. Un Cambio de Realidad cambia una condición del próximo recorrido.",
    shiftHint:
      "Después suelta el freno: las dos realidades corren a la vez. Cambia entre ellas para ver cada una.",
    counterOk: "En la otra realidad funcionó.",
    counterBad: "En la otra realidad no funcionó.",
    explainGear:
      "Tu engranaje y el de {name} se ven distintos, pero llevaron el mismo paso. ¿Por qué?",
    frameGear1: "Los dos trenes recorren",
    frameGear2: "Las razones son equivalentes porque",
    explainJunction:
      "El ramal más largo no siempre es más lento. ¿Qué lo decidió?",
    frameJ1: "Comparé",
    frameJ2: "El ramal más rápido fue el que",
    explainDepot: "¿Cómo calculaste el número de celdas?",
    frameD1: "Una celda lleva el tren",
    frameD2: "Necesitaba",
    m_yourRate: "Tu tasa (mi : min)",
    m_partnerRate: "Tasa del compañero (mi : min)",
    m_after2: "Tus millas a los 2 min",
    m_partnerAfter2: "Millas del compañero a los 2 min",
    m_arrive: "Llegas (min)",
    m_partnerArrive: "El compañero llega (min)",
    m_rivalArrive: "El rival llega (min)",
    m_distance: "Distancia (mi)",
    m_branch: "Ramal",
    m_yourLength: "Longitud de tu ramal (mi)",
    m_cells: "Celdas cargadas",
    m_reach: "La carga alcanza (mi)",
    m_efficiency: "Rendimiento (mi : celdas)",
  },
};
