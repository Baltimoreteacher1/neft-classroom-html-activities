// Kinetic Slicer strings, English and Spanish (tú register). Identical keys.

export const STRINGS = {
  en: {
    title: "Kinetic Slicer & Quantum Partition Engine",
    missionPredict:
      "The ribbon is {r} units long and the cutter aperture is {a} unit wide ({r} ÷ {a}). Program the cutter before it runs: how many aperture-long blocks fit in the ribbon? Count a leftover piece as a fraction of one block.",
    missionAperture:
      "Work order: cut this {r}-unit ribbon into exactly {q} equal blocks with no scrap. Set the aperture, then engage the cutter.",
    mission_cable:
      "A crew has {r} m of cable to cut into tethers that are each {a} m long. How many tethers will the cutter make? Count a leftover piece as a fraction of one tether.",
    mission_ribbon:
      "A costume shop has {r} m of ribbon to cut into bows that each use {a} m. How many bows will the cutter make? Count a leftover piece as a fraction of one bow.",
    mission_rope:
      "A climbing gym has {r} m of rope to cut into safety lines that are each {a} m long. How many lines will the cutter make? Count a leftover piece as a fraction of one line.",
    mission_pipe:
      "A plumber has {r} m of pipe to cut into sections that are each {a} m long. How many sections will the cutter make? Count a leftover piece as a fraction of one section.",
    whole: "Whole blocks",
    num: "Leftover part: numerator",
    den: "Leftover part: denominator",
    apNum: "Aperture numerator",
    apDen: "Aperture denominator",
    engage: "Engage cutter",
    pave: "Place a 1/{d} block",
    wholeVal: "{n} whole blocks",
    partVal: "{n}/{d} of a block",
    apVal: "aperture {n}/{d} unit",
    improper:
      "Your leftover part is one whole block or more. Move whole blocks onto the whole-block dial.",
    high: "The program ran the laser past the end of the ribbon: your prediction is too high.",
    low: "The cutter stopped with ribbon still uncut: your prediction is too low.",
    remainderWhole:
      "The whole blocks are right, but the leftover was measured in ruler units. Measure the scrap against one aperture: what fraction of a block is it?",
    inverted:
      "That program multiplies the two lengths. Dividing asks how many apertures fit along the ribbon. Which length goes into which?",
    invertedAp:
      "That aperture is upside down: the ribbon is shared into {q} equal blocks, so each block is the ribbon length divided by {q}.",
    wide: "Too few blocks came out: the aperture is too wide.",
    narrow: "Too many pieces came out: the aperture is too narrow.",
    solvedPredict: "Exact cut! {r} ÷ {a} = {q}.",
    solvedAperture: "Exact cut! {q} blocks of {a} make {r}.",
    paveFull: "The ribbon is fully paved.",
    plateRibbon: "RIBBON {r}",
    plateAp: "APERTURE {a}",
    plateProgram: "PROGRAM {p} BLOCKS",
    plateOrder: "ORDER: {q} BLOCKS",
    plateCut: "CUT: {n} BLOCKS",
    vernierIdle: "VERNIER: ONE FULL BLOCK",
    vernierPart: "SCRAP = {f} OF A BLOCK",
    vernierNone: "NO SCRAP",
    paved: "PAVED {n} × 1/{d}",
    unitWord: "units",
    metre: "m",
    descPredict:
      "Ribbon {r} {u} long, cutter aperture {a} {u}. Your program: {w} whole blocks and {n}/{d} of a block. The cutter {state}.",
    descAperture:
      "Ribbon {r} {u} long, work order {q} equal blocks. Your aperture: {c}/{d} {u}. The cutter {state}.",
    stateIdle: "is waiting at the start of the ribbon",
    stateOver: "ran past the end of the ribbon",
    stateShort: "stopped with ribbon left uncut",
    stateExact: "finished exactly at the end of the ribbon",
    stateMade: "made {n} full blocks and {scrap}",
    scrapYes: "a piece of scrap",
    scrapNo: "no scrap",
  },
  es: {
    title: "Cortadora cinética y motor de partición cuántica",
    missionPredict:
      "La cinta mide {r} unidades y la apertura de la cortadora mide {a} de unidad ({r} ÷ {a}). Programa la cortadora antes de que arranque: ¿cuántos bloques del largo de la apertura caben en la cinta? Cuenta el pedazo que sobra como una fracción de un bloque.",
    missionAperture:
      "Orden de trabajo: corta esta cinta de {r} unidades en exactamente {q} bloques iguales, sin que sobre nada. Ajusta la apertura y luego activa la cortadora.",
    mission_cable:
      "Un equipo tiene {r} m de cable para cortar en amarres de {a} m cada uno. ¿Cuántos amarres hará la cortadora? Cuenta el pedazo que sobra como una fracción de un amarre.",
    mission_ribbon:
      "Una tienda de disfraces tiene {r} m de listón para hacer moños que usan {a} m cada uno. ¿Cuántos moños hará la cortadora? Cuenta el pedazo que sobra como una fracción de un moño.",
    mission_rope:
      "Un gimnasio de escalada tiene {r} m de cuerda para cortar en cuerdas de seguridad de {a} m cada una. ¿Cuántas cuerdas hará la cortadora? Cuenta el pedazo que sobra como una fracción de una cuerda.",
    mission_pipe:
      "Un plomero tiene {r} m de tubo para cortar en secciones de {a} m cada una. ¿Cuántas secciones hará la cortadora? Cuenta el pedazo que sobra como una fracción de una sección.",
    whole: "Bloques enteros",
    num: "Parte que sobra: numerador",
    den: "Parte que sobra: denominador",
    apNum: "Numerador de la apertura",
    apDen: "Denominador de la apertura",
    engage: "Activar la cortadora",
    pave: "Colocar un bloque de 1/{d}",
    wholeVal: "{n} bloques enteros",
    partVal: "{n}/{d} de bloque",
    apVal: "apertura de {n}/{d} de unidad",
    improper:
      "La parte que sobra es un bloque entero o más. Pasa los bloques enteros al dial de bloques enteros.",
    high: "El programa llevó el láser más allá del final de la cinta: tu predicción es demasiado alta.",
    low: "La cortadora se detuvo y quedó cinta sin cortar: tu predicción es demasiado baja.",
    remainderWhole:
      "Los bloques enteros están bien, pero mediste el sobrante en unidades de la regla. Compara el sobrante con una apertura: ¿qué fracción de un bloque es?",
    inverted:
      "Ese programa multiplica los dos largos. Dividir pregunta cuántas aperturas caben a lo largo de la cinta. ¿Qué largo cabe en cuál?",
    invertedAp:
      "Esa apertura está al revés: la cinta se reparte en {q} bloques iguales, así que cada bloque es el largo de la cinta dividido entre {q}.",
    wide: "Salieron muy pocos bloques: la apertura es demasiado ancha.",
    narrow: "Salieron demasiados pedazos: la apertura es demasiado angosta.",
    solvedPredict: "¡Corte exacto! {r} ÷ {a} = {q}.",
    solvedAperture: "¡Corte exacto! {q} bloques de {a} forman {r}.",
    paveFull: "La cinta ya está cubierta por completo.",
    plateRibbon: "CINTA {r}",
    plateAp: "APERTURA {a}",
    plateProgram: "PROGRAMA {p} BLOQUES",
    plateOrder: "ORDEN: {q} BLOQUES",
    plateCut: "CORTE: {n} BLOQUES",
    vernierIdle: "VERNIER: UN BLOQUE COMPLETO",
    vernierPart: "SOBRANTE = {f} DE BLOQUE",
    vernierNone: "SIN SOBRANTE",
    paved: "CUBIERTO {n} × 1/{d}",
    unitWord: "unidades",
    metre: "m",
    descPredict:
      "Cinta de {r} {u} de largo, apertura de la cortadora de {a} {u}. Tu programa: {w} bloques enteros y {n}/{d} de bloque. La cortadora {state}.",
    descAperture:
      "Cinta de {r} {u} de largo, orden de trabajo de {q} bloques iguales. Tu apertura: {c}/{d} {u}. La cortadora {state}.",
    stateIdle: "espera al inicio de la cinta",
    stateOver: "se pasó del final de la cinta",
    stateShort: "se detuvo y quedó cinta sin cortar",
    stateExact: "terminó justo al final de la cinta",
    stateMade: "hizo {n} bloques completos y {scrap}",
    scrapYes: "un pedazo sobrante",
    scrapNo: "nada de sobrante",
  },
};
