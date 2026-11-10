// Assembly Matrix strings, English and Spanish (tú register). Identical keys.

export const STRINGS = {
  en: {
    title: "The Assembly Matrix: Synthesizer & Deconstructor",
    missionUnpack:
      "Unpack the composite crate {expr}. The separator sends each part inside the brackets down its own track, and every part must be multiplied by the outer factor. Set both output crates, then run the separator.",
    missionPack:
      "Two loose crates, {t1} and {t2}, ride in on the tracks. Pack them into one crate: set an outer factor and the two inner terms so the packed crate is equivalent to {t1} + {t2}.",
    missionPackGcf:
      "Two loose crates, {t1} and {t2}, ride in on the tracks. Pack them with the GREATEST common factor: set the outer factor and the two inner terms so the packed crate is equivalent to {t1} + {t2}.",
    missionFuse:
      "Simplify {expr}. Select two pods and fuse them: like terms merge, unlike terms bounce apart. Leave the fewest pods possible, then confirm the expression.",
    missionPower:
      "The press is loaded with {pow}. Set the output dial to the value the press will stamp, then stamp it.",
    t1: "Track 1 crate",
    t2: "Track 2 crate",
    outer: "Outer factor",
    in1: "Inner term 1",
    in2: "Inner term 2",
    out: "Output dial",
    podName: "Pod {term}",
    fuse: "Fuse selected pods",
    runUnpack: "Run separator",
    runPack: "Run packer",
    runFuse: "Confirm simplified expression",
    runPower: "Stamp",
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
    title: "La Matriz de Ensamblaje: Sintetizador y Desarmador",
    missionUnpack:
      "Desarma la caja compuesta {expr}. El separador manda cada parte de adentro del paréntesis por su propia vía, y cada parte se tiene que multiplicar por el factor de afuera. Ajusta las dos cajas de salida y luego enciende el separador.",
    missionPack:
      "Dos cajas sueltas, {t1} y {t2}, llegan por las vías. Empácalas en una sola caja: ajusta un factor de afuera y los dos términos de adentro para que la caja empacada sea equivalente a {t1} + {t2}.",
    missionPackGcf:
      "Dos cajas sueltas, {t1} y {t2}, llegan por las vías. Empácalas con el MÁXIMO común divisor: ajusta el factor de afuera y los dos términos de adentro para que la caja empacada sea equivalente a {t1} + {t2}.",
    missionFuse:
      "Simplifica {expr}. Elige dos cápsulas y fusiónalas: los términos semejantes se unen y los que no son semejantes rebotan. Deja la menor cantidad de cápsulas posible y luego confirma la expresión.",
    missionPower:
      "La prensa tiene cargado {pow}. Pon el dial de salida en el valor que va a estampar la prensa y luego estámpalo.",
    t1: "Caja de la vía 1",
    t2: "Caja de la vía 2",
    outer: "Factor de afuera",
    in1: "Término de adentro 1",
    in2: "Término de adentro 2",
    out: "Dial de salida",
    podName: "Cápsula {term}",
    fuse: "Fusionar las cápsulas elegidas",
    runUnpack: "Encender el separador",
    runPack: "Encender el empacador",
    runFuse: "Confirmar la expresión simplificada",
    runPower: "Estampar",
    groupTile: "Agrupar una ficha",
    sortPod: "Ordenar una cápsula",
    stackFactor: "Apilar un factor",
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
      "La vía 2 se atascó: solo dividiste el primer término entre el factor de afuera. Sácalo de los dos términos.",
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
