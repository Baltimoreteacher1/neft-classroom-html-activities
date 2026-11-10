// Pulse Matrix strings, English and Spanish (tú register), identical keys.

export const STRINGS = {
  en: {
    title: "Gravitational Wave Collector: The Pulse Matrix",
    missionBalance:
      "Cosmic particles stacked up as a dot plot on the shelf. Slide the fulcrum until the shelf balances, then lock it. The balance point is the mean.",
    missionTension:
      "The fulcrum is locked at the mean, {m}. An elastic band ties each particle to the mean. Set the MAD dial to the mean absolute deviation: the average band length.",
    missionClamp: "Squeeze the {n} particles into a box plot. Set the Q1, median and Q3 clamps.",
    fulcrum: "Fulcrum position",
    madDial: "MAD dial",
    q1Clamp: "Q1 clamp",
    medClamp: "Median clamp",
    q3Clamp: "Q3 clamp",
    lockFulcrum: "Lock fulcrum",
    checkMad: "Check MAD",
    clampIt: "Clamp the box plot",
    levelPair: "Level a pair",
    restore: "Restore the data",
    stackBand: "Stack the next band",
    countEnds: "Count in from each end",
    levelDone:
      "Every particle is now within 1 of the others. The shelf balances where they gathered.",
    countStep: "{k} crossed off from each end.",
    countMiddle: "The middle is found: that is the median. Keep counting inside each half.",
    countQuartiles: "The middle of each half is found: those are Q1 and Q3.",
    countDone: "Counting is finished.",
    balanceLow:
      "The shelf tips down on the right: more pull sits right of your fulcrum. Your fulcrum is too far left.",
    balanceHigh:
      "The shelf tips down on the left: more pull sits left of your fulcrum. Your fulcrum is too far right.",
    medianTrap:
      "You locked at the median, but the shelf still tips: the long tail pulls harder than the middle. The balance point leans toward the tail.",
    madHigh: "Your MAD is too high: the average band is shorter than your dial.",
    madLow: "Your MAD is too low: the average band is longer than your dial.",
    madSum:
      "That is the total stretch of all the bands. The MAD is the average: share the total equally among the particles.",
    medHigh: "The median clamp is too far right.",
    medLow: "The median clamp is too far left.",
    q1High: "The Q1 clamp is too far right.",
    q1Low: "The Q1 clamp is too far left.",
    q3High: "The Q3 clamp is too far right.",
    q3Low: "The Q3 clamp is too far left.",
    includeMedian:
      "Check your quartile clamp: with an odd number of particles, leave the median out of each half.",
    solvedBalance: "Balanced! The mean is {m}.",
    solvedTension: "Tension matched! The MAD is {mad}.",
    solvedClamp: "Box plot locked: Q1 {q1}, median {med}, Q3 {q3}. The IQR is {iqr}.",
    pullLeft: "Left pull {t}",
    pullRight: "Right pull {t}",
    meanTag: "mean {m}",
    shareN: "Share the total among {n} particles",
    levelShelf: "level",
    tipRight: "tipping down on the right",
    tipLeft: "tipping down on the left",
    descBalance: "Shelf with {n} particles at {data}. Fulcrum at {f}; the shelf is {tilt}.",
    descTension: "{n} particles at {data}, each tied by a band to the mean, {m}. MAD dial at {d}.",
    descClamp: "{n} particles at {data}. Clamps: Q1 at {q1}, median at {med}, Q3 at {q3}.",
  },
  es: {
    title: "Colector de ondas gravitacionales: la Matriz de Pulsos",
    missionBalance:
      "Las partículas cósmicas se apilaron como un diagrama de puntos sobre la repisa. Desliza el fulcro hasta que la repisa quede en equilibrio y fíjalo. El punto de equilibrio es la media.",
    missionTension:
      "El fulcro está fijo en la media, {m}. Una banda elástica une cada partícula con la media. Ajusta el dial de la DMA a la desviación media absoluta: el largo promedio de las bandas.",
    missionClamp:
      "Aprieta las {n} partículas para formar un diagrama de caja. Ajusta las abrazaderas de Q1, la mediana y Q3.",
    fulcrum: "Posición del fulcro",
    madDial: "Dial de la DMA",
    q1Clamp: "Abrazadera de Q1",
    medClamp: "Abrazadera de la mediana",
    q3Clamp: "Abrazadera de Q3",
    lockFulcrum: "Fijar el fulcro",
    checkMad: "Revisar la DMA",
    clampIt: "Formar el diagrama de caja",
    levelPair: "Nivelar un par",
    restore: "Restaurar los datos",
    stackBand: "Apilar la siguiente banda",
    countEnds: "Contar desde cada extremo",
    levelDone:
      "Ahora cada partícula está a 1 o menos de las demás. La repisa se equilibra donde se juntaron.",
    countStep: "Tachaste {k} de cada extremo.",
    countMiddle: "Encontraste el centro: esa es la mediana. Sigue contando dentro de cada mitad.",
    countQuartiles: "Encontraste el centro de cada mitad: esos son Q1 y Q3.",
    countDone: "Ya terminaste de contar.",
    balanceLow:
      "La repisa se inclina hacia abajo a la derecha: hay más fuerza a la derecha de tu fulcro. Tu fulcro está demasiado a la izquierda.",
    balanceHigh:
      "La repisa se inclina hacia abajo a la izquierda: hay más fuerza a la izquierda de tu fulcro. Tu fulcro está demasiado a la derecha.",
    medianTrap:
      "Fijaste el fulcro en la mediana, pero la repisa todavía se inclina: la cola larga jala más fuerte que el centro. El punto de equilibrio se acerca a la cola.",
    madHigh: "Tu DMA es demasiado alta: la banda promedio es más corta que tu dial.",
    madLow: "Tu DMA es demasiado baja: la banda promedio es más larga que tu dial.",
    madSum:
      "Ese es el estiramiento total de todas las bandas. La DMA es el promedio: reparte el total en partes iguales entre las partículas.",
    medHigh: "La abrazadera de la mediana está demasiado a la derecha.",
    medLow: "La abrazadera de la mediana está demasiado a la izquierda.",
    q1High: "La abrazadera de Q1 está demasiado a la derecha.",
    q1Low: "La abrazadera de Q1 está demasiado a la izquierda.",
    q3High: "La abrazadera de Q3 está demasiado a la derecha.",
    q3Low: "La abrazadera de Q3 está demasiado a la izquierda.",
    includeMedian:
      "Revisa la abrazadera del cuartil: si hay un número impar de partículas, deja la mediana fuera de cada mitad.",
    solvedBalance: "¡Equilibrio! La media es {m}.",
    solvedTension: "¡La tensión coincide! La DMA es {mad}.",
    solvedClamp: "Diagrama de caja fijado: Q1 {q1}, mediana {med}, Q3 {q3}. El RIC es {iqr}.",
    pullLeft: "Fuerza izquierda {t}",
    pullRight: "Fuerza derecha {t}",
    meanTag: "media {m}",
    shareN: "Reparte el total entre {n} partículas",
    levelShelf: "nivelada",
    tipRight: "inclinada hacia abajo a la derecha",
    tipLeft: "inclinada hacia abajo a la izquierda",
    descBalance: "Repisa con {n} partículas en {data}. Fulcro en {f}; la repisa está {tilt}.",
    descTension:
      "{n} partículas en {data}, cada una unida por una banda a la media, {m}. Dial de la DMA en {d}.",
    descClamp: "{n} partículas en {data}. Abrazaderas: Q1 en {q1}, mediana en {med}, Q3 en {q3}.",
  },
};
