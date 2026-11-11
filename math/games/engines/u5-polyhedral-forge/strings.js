// Every string the Polyhedral Forge shows, English and Spanish (tú), identical keys.

export const STRINGS = {
  en: {
    title: "Origami Fortress: The Polyhedral Forge",
    missionPara:
      "A parallelogram shield plate guards the gate: base {b} units, slanted side {s} units, height {h} units. Slide the morph lever to rearrange it, set the charge dial to its area, and press Charge.",
    missionTri:
      "A triangle shield plate: base {b} units, slanted side {s} units, height {h} units. Use the morph lever to swing in a second copy, set the charge dial to the triangle's area, and press Charge.",
    missionTrap:
      "A trapezoid shield plate: bases {b} and {b2} units, slanted side {s} units, height {h} units. Use the morph lever to swing in a second copy, set the charge dial to the trapezoid's area, and press Charge.",
    missionPrism:
      "Bastion core: a rectangular prism {l} by {w} by {h} units. Unfold it into its net, set the surface-area dial to the total area of every face, and press Energize shield.",
    missionPyr:
      "Bastion spire: a square pyramid with base edges of {s} units and triangle faces with a slant height of {l} units. Unfold it, set the surface-area dial to the total area of every face, and press Energize shield.",
    missionPack:
      "Hollow chamber: {l} by {w} by {h} inches. Set how many 1/2-inch cubes fit along each edge, then set the volume dial and press Seal chamber.",
    morph: "Morph lever",
    chargeDial: "Charge dial (area)",
    fold: "Fold lever",
    saDial: "Surface-area dial",
    cubesL: "Cubes along the length",
    cubesW: "Cubes along the width",
    cubesH: "Cubes along the height",
    volDial: "Volume dial",
    charge: "Charge",
    energize: "Energize shield",
    seal: "Seal chamber",
    trace: "Trace next face",
    stack: "Stack one layer",
    fmtSq: "{v} square units",
    fmtCu: "{v} cubic inches",
    fmtPct: "{v}%",
    fmtOpen: "{v}% unfolded",
    fmtCubes: "{v} cubes",
    high: "The plate overloads: your area is too high.",
    low: "The plate stays dim: your area is too low.",
    slant:
      "Too high: you measured along the slanted side. The height meets the base at a right angle.",
    forgotHalf:
      "Too high: two copies of this plate make a parallelogram, so the plate is only half of it.",
    saHigh: "The shield crackles: your surface area is too high.",
    saLow: "The shield flickers: your surface area is too low.",
    halfFaces: "Too low: a prism has matching pairs of faces. Count both faces in every pair.",
    volumeNot:
      "That number measures the space inside (volume). The shield needs the area of the outside faces.",
    triHalf: "Too high: each triangular face is half of a rectangle.",
    missingBase: "Too low: the square base is a face too.",
    tooMany: "Too many cubes along the {axis}: they push through the wall.",
    tooFew: "Too few cubes along the {axis}: a gap is left at the wall.",
    inchCubes:
      "Too few cubes along the {axis}: each cube is 1/2 inch, so it takes 2 cubes to cover 1 inch.",
    cubesAsVolume:
      "Too high: you counted cubes, but each 1/2-inch cube is only 1/8 of a cubic inch.",
    volHigh: "The seal hisses: your volume is too high.",
    volLow: "The seal will not close: your volume is too low.",
    solvedShield: "Shield charged! The plate's area is {v} square units.",
    solvedSA: "Bastion energized! The surface area is {v} square units.",
    solvedPack: "Chamber sealed! {n} cubes of 1/8 cubic inch make {v} cubic inches.",
    axisL: "length",
    axisW: "width",
    axisH: "height",
    descPara:
      "Parallelogram shield plate with base {b}, slanted side {s} and height {h} units, morph lever at {m}%, charge dial at {v} square units.",
    descTri:
      "Triangle shield plate with base {b}, slanted side {s} and height {h} units, morph lever at {m}%, charge dial at {v} square units.",
    descTrap:
      "Trapezoid shield plate with bases {b} and {b2}, slanted side {s} and height {h} units, morph lever at {m}%, charge dial at {v} square units.",
    descPrism:
      "Rectangular prism {l} by {w} by {h} units, {f}% unfolded, surface-area dial at {v} square units{extra}.",
    descPyr:
      "Square pyramid with base edge {s} and slant height {l} units, {f}% unfolded, surface-area dial at {v} square units{extra}.",
    descPack:
      "Chamber {l} by {w} by {h} inches holding {nl} by {nw} by {nh} half-inch cubes, volume dial at {v} cubic inches{extra}.",
    extraTally: ", and the traced faces add up to {t} square units",
    extraLayers: ", with {n} layers stacked by hand",
    tally: "Tally: {v}",
    layers: "Layers {n}: {c} cubes each",
    plateShield: "SHIELD PLATE",
    plateUnfold: "UNFOLD",
    platePack: "PACK",
    foldPlate: "Unfolded {v}%",
    morphPlate: "Morph {v}%",
    inches: "{v} in",
    pyrDims: "base {s} · slant {l}",
    missionReg:
      "A regular {shape} shield plate: every side is {s} feet and the apothem (from the center straight to the middle of a side) is {a} feet, rounded to the nearest tenth. Use the fan lever to decompose it into triangles from the center, set the one-triangle dial and the total-area dial, and press Charge.",
    missionRegTotal:
      "A regular {shape} shield plate: every side is {s} feet and the apothem (from the center straight to the middle of a side) is {a} feet, rounded to the nearest tenth. Decompose it into triangles from the center, set the total-area dial to the plate's area, and press Charge.",
    shape5: "pentagon",
    shape6: "hexagon",
    shape8: "octagon",
    fan: "Fan lever (decompose)",
    triDial: "One-triangle dial (area)",
    totalDial: "Total-area dial",
    countTri: "Count a triangle",
    fmtSqFt: "{v} square feet",
    dirHigh: "Too high",
    dirLow: "Too low",
    regTriHigh: "One triangle overloads: your triangle area is too high.",
    regTriLow: "One triangle stays dim: your triangle area is too low.",
    regTriHalf:
      "Too high: side × apothem is a whole rectangle. Each triangle is half of that rectangle.",
    regSide:
      "{dir}: you used the side as the triangle's height. The height is the apothem, from the center straight to the middle of a side.",
    regOne:
      "Too low: that is the area of just one triangle. The plate is made of all the triangles around the center.",
    regHalf: "Too high: each triangle is ½ × side × apothem, not side × apothem.",
    regCount:
      "{dir}: count the triangles again. A regular polygon splits into one triangle for each side.",
    regHigh: "The plate overloads: your total area is too high.",
    regLow: "The plate stays dim: your total area is too low.",
    solvedReg: "Shield charged! {n} triangles of {t} square feet make {v} square feet.",
    descReg:
      "Regular {shape} shield plate with sides of {s} feet and an apothem of {a} feet, fan lever at {f}%, one-triangle dial at {t} square feet, total-area dial at {v} square feet{extra}.",
    descRegTotal:
      "Regular {shape} shield plate with sides of {s} feet and an apothem of {a} feet, fan lever at {f}%, total-area dial at {v} square feet{extra}.",
    extraCount: ", with {c} triangles counted",
    countTally: "Triangles counted: {c}",
    plateRegular: "REGULAR SHIELD",
    triPlate: "One triangle: {v}",
    fanPlate: "Fan {v}%",
    sideLbl: "side {s} ft",
    apoLbl: "apothem {a} ft",
    baseLbl: "base {s}",
    hgtLbl: "height {a}",
  },
  es: {
    title: "Fortaleza de origami: la forja poliédrica",
    missionPara:
      "Una placa escudo con forma de paralelogramo protege la puerta: base de {b} unidades, lado inclinado de {s} unidades y altura de {h} unidades. Desliza la palanca de transformación para reacomodarla, ajusta el dial de carga a su área y pulsa el botón Carga el escudo.",
    missionTri:
      "Una placa escudo triangular: base de {b} unidades, lado inclinado de {s} unidades y altura de {h} unidades. Usa la palanca de transformación para girar una segunda copia, ajusta el dial de carga al área del triángulo y pulsa el botón Carga el escudo.",
    missionTrap:
      "Una placa escudo con forma de trapecio: bases de {b} y {b2} unidades, lado inclinado de {s} unidades y altura de {h} unidades. Usa la palanca de transformación para girar una segunda copia, ajusta el dial de carga al área del trapecio y pulsa el botón Carga el escudo.",
    missionPrism:
      "Núcleo del bastión: un prisma rectangular de {l} por {w} por {h} unidades. Despliégalo hasta ver su red, ajusta el dial de área total a la suma de las áreas de todas las caras y pulsa el botón Activa el escudo.",
    missionPyr:
      "Torre del bastión: una pirámide de base cuadrada con aristas de {s} unidades en la base y caras triangulares con una altura inclinada de {l} unidades. Despliégala, ajusta el dial de área total a la suma de las áreas de todas las caras y pulsa el botón Activa el escudo.",
    missionPack:
      "Cámara hueca: {l} por {w} por {h} pulgadas. Elige cuántos cubos de 1/2 pulgada caben a lo largo de cada arista, luego ajusta el dial de volumen y pulsa el botón Sella la cámara.",
    morph: "Palanca de transformación",
    chargeDial: "Dial de carga (área)",
    fold: "Palanca de despliegue",
    saDial: "Dial de área total",
    cubesL: "Cubos a lo largo",
    cubesW: "Cubos a lo ancho",
    cubesH: "Cubos a lo alto",
    volDial: "Dial de volumen",
    charge: "Carga el escudo",
    energize: "Activa el escudo",
    seal: "Sella la cámara",
    trace: "Marca la siguiente cara",
    stack: "Apila una capa",
    fmtSq: "{v} unidades cuadradas",
    fmtCu: "{v} pulgadas cúbicas",
    fmtPct: "{v}%",
    fmtOpen: "{v}% desplegado",
    fmtCubes: "{v} cubos",
    high: "La placa se sobrecarga: tu área es demasiado grande.",
    low: "La placa sigue apagada: tu área es demasiado pequeña.",
    slant:
      "Demasiado grande: mediste a lo largo del lado inclinado. La altura forma un ángulo recto con la base.",
    forgotHalf:
      "Demasiado grande: dos copias de esta placa forman un paralelogramo, así que la placa es solo la mitad.",
    saHigh: "El escudo chisporrotea: tu área total es demasiado grande.",
    saLow: "El escudo parpadea: tu área total es demasiado pequeña.",
    halfFaces:
      "Demasiado pequeña: un prisma tiene pares de caras iguales. Cuenta las dos caras de cada par.",
    volumeNot:
      "Ese número mide el espacio de adentro (el volumen). El escudo necesita el área de las caras de afuera.",
    triHalf: "Demasiado grande: cada cara triangular es la mitad de un rectángulo.",
    missingBase: "Demasiado pequeña: la base cuadrada también es una cara.",
    tooMany: "Demasiados cubos a lo {axis}: atraviesan la pared.",
    tooFew: "Faltan cubos a lo {axis}: queda un hueco junto a la pared.",
    inchCubes:
      "Faltan cubos a lo {axis}: cada cubo mide 1/2 pulgada, así que se necesitan 2 cubos para cubrir 1 pulgada.",
    cubesAsVolume:
      "Demasiado grande: contaste cubos, pero cada cubo de 1/2 pulgada es solo 1/8 de pulgada cúbica.",
    volHigh: "El sello silba: tu volumen es demasiado grande.",
    volLow: "El sello no cierra: tu volumen es demasiado pequeño.",
    solvedShield: "¡Escudo cargado! El área de la placa es {v} unidades cuadradas.",
    solvedSA: "¡Bastión activado! El área total es {v} unidades cuadradas.",
    solvedPack: "¡Cámara sellada! {n} cubos de 1/8 de pulgada cúbica forman {v} pulgadas cúbicas.",
    axisL: "largo",
    axisW: "ancho",
    axisH: "alto",
    descPara:
      "Placa escudo con forma de paralelogramo, con base {b}, lado inclinado {s} y altura {h} unidades, palanca de transformación al {m}% y dial de carga en {v} unidades cuadradas.",
    descTri:
      "Placa escudo triangular, con base {b}, lado inclinado {s} y altura {h} unidades, palanca de transformación al {m}% y dial de carga en {v} unidades cuadradas.",
    descTrap:
      "Placa escudo con forma de trapecio, con bases {b} y {b2}, lado inclinado {s} y altura {h} unidades, palanca de transformación al {m}% y dial de carga en {v} unidades cuadradas.",
    descPrism:
      "Prisma rectangular de {l} por {w} por {h} unidades, desplegado al {f}%, con el dial de área total en {v} unidades cuadradas{extra}.",
    descPyr:
      "Pirámide de base cuadrada con arista de la base {s} y altura inclinada {l} unidades, desplegada al {f}%, con el dial de área total en {v} unidades cuadradas{extra}.",
    descPack:
      "Cámara de {l} por {w} por {h} pulgadas con {nl} por {nw} por {nh} cubos de media pulgada y el dial de volumen en {v} pulgadas cúbicas{extra}.",
    extraTally: "; las caras marcadas suman {t} unidades cuadradas",
    extraLayers: "; llevas {n} capas apiladas a mano",
    tally: "Suma: {v}",
    layers: "Capas {n}: {c} cubos cada una",
    plateShield: "PLACA ESCUDO",
    plateUnfold: "DESPLEGAR",
    platePack: "EMPACAR",
    foldPlate: "Desplegado {v}%",
    morphPlate: "Transformación {v}%",
    inches: "{v} pulg.",
    pyrDims: "base {s} · inclinada {l}",
    missionReg:
      "Una placa escudo con forma de {shape} regular: cada lado mide {s} pies y la apotema (del centro en línea recta hasta la mitad de un lado) mide {a} pies, redondeada a la décima más cercana. Usa la palanca de abanico para descomponerla en triángulos desde el centro, ajusta el dial de un triángulo y el dial de área total, y pulsa el botón Carga el escudo.",
    missionRegTotal:
      "Una placa escudo con forma de {shape} regular: cada lado mide {s} pies y la apotema (del centro en línea recta hasta la mitad de un lado) mide {a} pies, redondeada a la décima más cercana. Descomponla en triángulos desde el centro, ajusta el dial de área total al área de la placa y pulsa el botón Carga el escudo.",
    shape5: "pentágono",
    shape6: "hexágono",
    shape8: "octágono",
    fan: "Palanca de abanico (descomponer)",
    triDial: "Dial de un triángulo (área)",
    totalDial: "Dial de área total",
    countTri: "Cuenta un triángulo",
    fmtSqFt: "{v} pies cuadrados",
    dirHigh: "Demasiado grande",
    dirLow: "Demasiado pequeña",
    regTriHigh: "El triángulo se sobrecarga: el área de tu triángulo es demasiado grande.",
    regTriLow: "El triángulo sigue apagado: el área de tu triángulo es demasiado pequeña.",
    regTriHalf:
      "Demasiado grande: lado × apotema es un rectángulo entero. Cada triángulo es la mitad de ese rectángulo.",
    regSide:
      "{dir}: usaste el lado como la altura del triángulo. La altura es la apotema, que va del centro en línea recta hasta la mitad de un lado.",
    regOne:
      "Demasiado pequeña: esa es el área de un solo triángulo. La placa está formada por todos los triángulos alrededor del centro.",
    regHalf: "Demasiado grande: cada triángulo es ½ × lado × apotema, no lado × apotema.",
    regCount:
      "{dir}: vuelve a contar los triángulos. Un polígono regular se divide en un triángulo por cada lado.",
    regHigh: "La placa se sobrecarga: tu área total es demasiado grande.",
    regLow: "La placa sigue apagada: tu área total es demasiado pequeña.",
    solvedReg: "¡Escudo cargado! {n} triángulos de {t} pies cuadrados forman {v} pies cuadrados.",
    descReg:
      "Placa escudo con forma de {shape} regular, con lados de {s} pies y una apotema de {a} pies, palanca de abanico al {f}%, dial de un triángulo en {t} pies cuadrados y dial de área total en {v} pies cuadrados{extra}.",
    descRegTotal:
      "Placa escudo con forma de {shape} regular, con lados de {s} pies y una apotema de {a} pies, palanca de abanico al {f}% y dial de área total en {v} pies cuadrados{extra}.",
    extraCount: "; llevas {c} triángulos contados",
    countTally: "Triángulos contados: {c}",
    plateRegular: "ESCUDO REGULAR",
    triPlate: "Un triángulo: {v}",
    fanPlate: "Abanico {v}%",
    sideLbl: "lado {s} pies",
    apoLbl: "apotema {a} pies",
    baseLbl: "base {s}",
    hgtLbl: "altura {a}",
  },
};
