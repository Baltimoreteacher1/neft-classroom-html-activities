// The skill list: at least two skills for every grade K-8, each with a standard, strand and bilingual title.
// @fm2 FM-011 FM-019 FM-020
const S = (id, grades, standard, strand, title) => ({ id, grades, standard, strand, title });
const ARRAYS = { en: "Arrays and equal groups", es: "Matrices y grupos iguales" };
const AREA = { en: "Area and perimeter", es: "Área y perímetro" };
const MULT = { en: "Multiplication and area models", es: "Multiplicación y modelos de área" };
const FACTORS = { en: "Factors and multiples", es: "Factores y múltiplos" };
const ALGEBRA = { en: "Expressions and algebra tiles", es: "Expresiones y fichas de álgebra" };

export const SKILLS = [
  S("k-rows", [0, 0], "K.CC.B.5", ARRAYS, { en: "Counters in equal rows", es: "Fichas en filas iguales" }),
  S("k-count", [0, 1], "K.CC.B.5", ARRAYS, { en: "Place the counters", es: "Coloca las fichas" }),
  S("g1-equal-rows", [1, 1], "1.OA.C.6", ARRAYS, { en: "Equal rows to 20", es: "Filas iguales hasta 20" }),
  S("g1-repeat-add", [1, 2], "2.OA.C.4", ARRAYS, { en: "Repeated addition arrays", es: "Matrices y suma repetida" }),
  S("g2-array-eq", [2, 2], "2.OA.C.4", ARRAYS, { en: "Arrays up to 5 by 5", es: "Matrices hasta 5 por 5" }),
  S("g2-even-odd", [2, 2], "2.OA.C.3", ARRAYS, { en: "Even and odd pairs", es: "Parejas: par e impar" }),
  S("g3-mult-array", [3, 3], "3.OA.A.1", MULT, { en: "Multiplication arrays", es: "Matrices de multiplicación" }),
  S("g3-commute", [3, 3], "3.OA.B.5", MULT, { en: "Turn arrays: commutative property", es: "Girar matrices: propiedad conmutativa" }),
  S("g3-area-tile", [3, 3], "3.MD.C.6", AREA, { en: "Area by tiling", es: "Área con baldosas" }),
  S("g3-perimeter", [3, 3], "3.MD.D.8", AREA, { en: "Build with a perimeter", es: "Construye con un perímetro" }),
  S("g4-area-perim", [4, 4], "4.MD.A.3", AREA, { en: "Area and perimeter clues", es: "Pistas de área y perímetro" }),
  S("g4-factor-pairs", [4, 4], "4.OA.B.4", FACTORS, { en: "Find every factor pair", es: "Encuentra todos los pares de factores" }),
  S("g4-area-model", [4, 4], "4.NBT.B.5", MULT, { en: "Area model: 2-digit by 1-digit", es: "Modelo de área: 2 dígitos por 1" }),
  S("g5-area-model", [5, 5], "5.NBT.B.7", MULT, { en: "Area model: decimals and 2-digit", es: "Modelo de área: decimales y 2 dígitos" }),
  S("g5-volume", [5, 5], "5.MD.C.5", AREA, { en: "Volume by layers", es: "Volumen por capas" }),
  S("g6-composite", [6, 6], "6.G.A.1", AREA, { en: "Area of composite figures", es: "Área de figuras compuestas" }),
  S("g6-distribute", [6, 6], "6.EE.A.3", MULT, { en: "Distributive property as area", es: "Propiedad distributiva como área" }),
  S("g6-gcf", [6, 6], "6.NS.B.4", FACTORS, { en: "GCF as the biggest square tile", es: "MCD como la baldosa cuadrada más grande" }),
  S("g6-lcm", [6, 6], "6.NS.B.4", FACTORS, { en: "LCM as the smallest square", es: "mcm como el cuadrado más pequeño" }),
  S("g7-expand", [7, 7], "7.EE.A.1", ALGEBRA, { en: "Expand a(b + c) with area", es: "Desarrollar a(b + c) con área" }),
  S("g7-scale", [7, 7], "7.G.A.1", AREA, { en: "Scale factor and area", es: "Factor de escala y área" }),
  S("g8-expand", [8, 8], "HSA.APR.A.1", ALGEBRA, { en: "Multiply binomials with area", es: "Multiplicar binomios con área" }),
  S("g8-factor", [8, 8], "HSA.SSE.B.3", ALGEBRA, { en: "Factor with algebra tiles", es: "Factorizar con fichas de álgebra" }),
];
