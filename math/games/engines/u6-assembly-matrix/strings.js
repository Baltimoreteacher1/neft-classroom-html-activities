// Assembly Matrix strings, English and Spanish (tú register). Identical keys.

export const STRINGS = {
  en: {
    title: "The Assembly Matrix: Synthesizer & Deconstructor",
    missionUnpack:
      "Expand {expr}. 1. Multiply the number outside the parentheses by each term inside. 2. Move the two sliders to those products. 3. Press Check answer.",
    missionPack:
      "Factor {t1} + {t2}. 1. Pick a number greater than 1 that divides both terms. 2. Set the outside number to that factor. 3. Divide each term by it and set the two inside sliders. 4. Press Check answer.",
    missionPackGcf:
      "Factor {t1} + {t2}. 1. Find the greatest number that divides both terms. 2. Set the outside number to that factor. 3. Divide each term by it and set the inside sliders. 4. Press Check answer.",
    missionFuse:
      "Simplify {expr}. 1. Select two terms with the same variable (or two numbers). 2. Press Combine selected terms. Repeat until no like terms remain. 3. Press Check answer.",
    missionPower:
      "Find {pow}. Multiply the base by itself as many times as the exponent tells you. Move the answer slider to the result, then press Check answer.",
    t1: "First product",
    t2: "Second product",
    outer: "Outside number",
    in1: "First inside term",
    in2: "Second inside term",
    out: "Answer",
    podName: "Pod {term}",
    fuse: "Combine selected terms",
    runUnpack: "Check answer",
    runPack: "Check answer",
    runFuse: "Check answer",
    runPower: "Check answer",
    groupTile: "Group a tile",
    sortPod: "Sort a pod",
    stackFactor: "Stack a factor",
    groupFirst: "Hands-on mode: group every tile before the machine runs.",
    tilesDone: "Every tile is grouped.",
    pickTwo: "Select exactly two pods, then fuse.",
    unlike: "Those pods bounced apart: {a} and {b} are not like terms, so they cannot combine.",
    fused: "Fused: {a} and {b} became {c}.",
    sorted: "Every pod is in its lane.",
    t1High: "Track 1 jammed: that crate is too big.",
    t1Low: "Track 1 jammed: that crate is too small.",
    t2High: "Track 2 jammed: that crate is too big.",
    t2Low: "Track 2 jammed: that crate is too small.",
    firstOnly:
      "Track 2 jammed: only the first term was multiplied. The outer factor multiplies every term inside the brackets.",
    solvedUnpack: "Both brackets locked! {expr} = {result}.",
    needFactor: "The packer needs an outer factor greater than 1.",
    oneTerm:
      "Track 2 jammed: only the first term was divided by the outer factor. Factor it out of both terms.",
    p1High:
      "Track 1 jammed: the outer factor times inner term 1 is more than the crate on track 1.",
    p1Low: "Track 1 jammed: the outer factor times inner term 1 is less than the crate on track 1.",
    p2High:
      "Track 2 jammed: the outer factor times inner term 2 is more than the crate on track 2.",
    p2Low: "Track 2 jammed: the outer factor times inner term 2 is less than the crate on track 2.",
    bigger: "The crate holds, but a bigger common factor fits. Use the greatest common factor.",
    solvedPack: "Packed! {t1} + {t2} = {packed}.",
    likeRemain: "Like terms are still floating apart. Fuse them before you confirm.",
    solvedFuse: "Simplified! {start} = {result}.",
    timesExp:
      "The press bounced: that is the base times the exponent. An exponent counts how many times the base is a factor.",
    addExp:
      "The press bounced: that adds the base and the exponent. Multiply the base by itself instead.",
    high: "The press bounced: your output is too high.",
    low: "The press bounced: your output is too low.",
    solvedPower: "Stamped! {pow} = {expand} = {v}.",
    plateIn: "INPUT {expr}",
    plateField: "FIELD: {expr}",
    platePow: "PRESS {pow} = {expand}",
    plateOut: "OUTPUT {v}",
    tilesCount: "TILES GROUPED {n} OF {t}",
    dealt: "DEALT {n} OF {t} INTO {g} GROUPS",
    unitTile: "1",
    descUnpack:
      "Composite crate {expr}. Your track 1 crate is {k1} and your track 2 crate is {k2}. {state}",
    descPack:
      "Track 1 carries {t1} and track 2 carries {t2}. Your packed crate: {g}({i1} + {i2}). {state}",
    descFuse: "Pods in the field: {expr}. Selected: {sel}.",
    descPower: "The press holds {pow}, which means {expand}. Your output dial reads {v}. {state}",
    stateReady: "The machine is ready.",
    stateLocked: "The machine locked.",
    stateJammed: "The machine jammed.",
    none: "none",
    and: "and",
  },
  es: {
    title: "La Matriz de Ensamblaje: Sintetizador y Desensamblador",
    missionUnpack:
      "Desarrolla {expr}. 1. Multiplica el número de afuera por cada término dentro del paréntesis. 2. Ajusta los dos controles a esos productos. 3. Pulsa Comprobar respuesta.",
    missionPack:
      "Factoriza {t1} + {t2}. 1. Elige un número mayor que 1 que divida ambos términos. 2. Ponlo afuera. 3. Divide cada término entre ese número y ajusta los controles de adentro. 4. Pulsa Comprobar respuesta.",
    missionPackGcf:
      "Factoriza {t1} + {t2}. 1. Encuentra el máximo común divisor de ambos términos y ponlo afuera. 2. Divide cada término entre ese número y ajusta los controles de adentro. 3. Pulsa Comprobar respuesta.",
    missionFuse:
      "Simplifica {expr}. 1. Elige dos términos con la misma variable (o dos números). 2. Pulsa Combinar términos elegidos. Repite hasta que no queden términos semejantes. 3. Pulsa Comprobar respuesta.",
    missionPower:
      "Calcula {pow}. Multiplica la base por sí misma tantas veces como indica el exponente. Ajusta el control a tu resultado y pulsa Comprobar respuesta.",
    t1: "Primer producto",
    t2: "Segundo producto",
    outer: "Número de afuera",
    in1: "Primer término de adentro",
    in2: "Segundo término de adentro",
    out: "Respuesta",
    podName: "Cápsula {term}",
    fuse: "Combinar términos elegidos",
    runUnpack: "Comprobar respuesta",
    runPack: "Comprobar respuesta",
    runFuse: "Comprobar respuesta",
    runPower: "Comprobar respuesta",
    groupTile: "Agrupa una ficha",
    sortPod: "Ordena una cápsula",
    stackFactor: "Apila un factor",
    groupFirst: "Modo manos a la obra: agrupa todas las fichas antes de encender la máquina.",
    tilesDone: "Todas las fichas están agrupadas.",
    pickTwo: "Elige exactamente dos cápsulas y luego fusiónalas.",
    unlike:
      "Esas cápsulas rebotaron: {a} y {b} no son términos semejantes, así que no se pueden combinar.",
    fused: "Fusionadas: {a} y {b} se convirtieron en {c}.",
    sorted: "Cada cápsula está en su carril.",
    t1High: "La vía 1 se atascó: esa caja es demasiado grande.",
    t1Low: "La vía 1 se atascó: esa caja es demasiado pequeña.",
    t2High: "La vía 2 se atascó: esa caja es demasiado grande.",
    t2Low: "La vía 2 se atascó: esa caja es demasiado pequeña.",
    firstOnly:
      "La vía 2 se atascó: solo multiplicaste el primer término. El factor de afuera multiplica cada término dentro del paréntesis.",
    solvedUnpack: "¡Los dos paréntesis encajaron! {expr} = {result}.",
    needFactor: "El empacador necesita un factor de afuera mayor que 1.",
    oneTerm:
      "La vía 2 se atascó: solo dividiste el primer término entre el factor de afuera. Sácalo como factor común de los dos términos.",
    p1High:
      "La vía 1 se atascó: el factor de afuera por el término 1 da más que la caja de la vía 1.",
    p1Low:
      "La vía 1 se atascó: el factor de afuera por el término 1 da menos que la caja de la vía 1.",
    p2High:
      "La vía 2 se atascó: el factor de afuera por el término 2 da más que la caja de la vía 2.",
    p2Low:
      "La vía 2 se atascó: el factor de afuera por el término 2 da menos que la caja de la vía 2.",
    bigger: "La caja aguanta, pero cabe un factor común más grande. Usa el máximo común divisor.",
    solvedPack: "¡Empacado! {t1} + {t2} = {packed}.",
    likeRemain: "Todavía hay términos semejantes separados. Fusiónalos antes de confirmar.",
    solvedFuse: "¡Simplificado! {start} = {result}.",
    timesExp:
      "La prensa rebotó: eso es la base por el exponente. El exponente cuenta cuántas veces la base es factor.",
    addExp: "La prensa rebotó: eso suma la base y el exponente. Multiplica la base por sí misma.",
    high: "La prensa rebotó: tu valor de salida es demasiado alto.",
    low: "La prensa rebotó: tu valor de salida es demasiado bajo.",
    solvedPower: "¡Estampado! {pow} = {expand} = {v}.",
    plateIn: "ENTRADA {expr}",
    plateField: "CAMPO: {expr}",
    platePow: "PRENSA {pow} = {expand}",
    plateOut: "SALIDA {v}",
    tilesCount: "FICHAS AGRUPADAS {n} DE {t}",
    dealt: "REPARTIDAS {n} DE {t} EN {g} GRUPOS",
    unitTile: "1",
    descUnpack:
      "Caja compuesta {expr}. Tu caja de la vía 1 es {k1} y tu caja de la vía 2 es {k2}. {state}",
    descPack:
      "La vía 1 lleva {t1} y la vía 2 lleva {t2}. Tu caja empacada: {g}({i1} + {i2}). {state}",
    descFuse: "Cápsulas en el campo: {expr}. Elegidas: {sel}.",
    descPower:
      "La prensa tiene {pow}, que significa {expand}. Tu dial de salida marca {v}. {state}",
    stateReady: "La máquina está lista.",
    stateLocked: "La máquina encajó.",
    stateJammed: "La máquina se atascó.",
    none: "ninguna",
    and: "y",
  },
};
