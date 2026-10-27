// The 19 Fraction Kitchen skills: every grade K-8 is covered by at least two. @fm2 FM-009 FM-017 FM-019
const S = (id, strand, title, grades, standard) => ({ id, strand, title, grades, standard });
const GEO = { en: "Geometry", es: "Geometría" };
const FRAC = { en: "Fractions", es: "Fracciones" };
const MEAS = { en: "Measurement", es: "Medición" };
const DEC = { en: "Decimals", es: "Decimales" };
const RATIO = { en: "Ratios and percents", es: "Razones y porcentajes" };
const NUM = { en: "The number system", es: "El sistema numérico" };
const EXPO = { en: "Expressions and equations", es: "Expresiones y ecuaciones" };

export const SKILLS = [
  S("fair-shares", GEO, { en: "Fair shares", es: "Partes justas" }, [0, 2], "1.G.A.3"),
  S("fix-the-cuts", GEO, { en: "Equal or not? Fix the cuts", es: "¿Iguales o no? Arregla los cortes" }, [0, 2], "2.G.A.3"),
  S("serve-parts", FRAC, { en: "Serve a fraction", es: "Sirve una fracción" }, [1, 3], "3.NF.A.1"),
  S("pizza-equiv", FRAC, { en: "Same amount, different cuts", es: "La misma cantidad, otros cortes" }, [3, 4], "4.NF.A.1"),
  S("compare-pieces", FRAC, { en: "Bigger or smaller share", es: "Una parte mayor o menor" }, [3, 4], "3.NF.A.3.d"),
  S("line-marker", FRAC, { en: "Fractions on a number line", es: "Fracciones en la recta numérica" }, [3, 4], "3.NF.A.2"),
  S("pour-cup", MEAS, { en: "Pour with measuring cups", es: "Mide con tazas medidoras" }, [3, 5], "4.MD.A.2"),
  S("tenths-cup", DEC, { en: "Tenths and hundredths scoops", es: "Cucharones de décimos y centésimos" }, [4, 5], "4.NF.C.6"),
  S("mixed-scoops", FRAC, { en: "Fill the pitcher: mixed numbers", es: "Llena la jarra: números mixtos" }, [4, 5], "4.NF.B.3"),
  S("batch-recipe", FRAC, { en: "Recipe batches", es: "Tandas de una receta" }, [4, 5], "4.NF.B.4"),
  S("unlike-bars", FRAC, { en: "Add and subtract with scoops", es: "Suma y resta con cucharones" }, [4, 5], "5.NF.A.1"),
  S("part-of-part", FRAC, { en: "A fraction of a fraction", es: "Una fracción de una fracción" }, [5, 5], "5.NF.B.4"),
  S("divide-unit", FRAC, { en: "Share it or scoop it: unit fractions", es: "Reparte o sirve: fracciones unitarias" }, [5, 5], "5.NF.B.7"),
  S("divide-fractions", NUM, { en: "How many servings? Dividing fractions", es: "¿Cuántas porciones? Dividir fracciones" }, [6, 6], "6.NS.A.1"),
  S("percent-amount", RATIO, { en: "Percent of a cup", es: "Porcentaje de una taza" }, [6, 7], "6.RP.A.3.c"),
  S("pour-spill", NUM, { en: "Pour and spill: signed amounts", es: "Echar y derramar: cantidades con signo" }, [7, 7], "7.NS.A.1"),
  S("repeating-decimals", NUM, { en: "Terminating or repeating?", es: "¿Termina o se repite?" }, [7, 8], "7.NS.A.2.d"),
  S("rational-approx", NUM, { en: "Is it exactly π? Close fractions", es: "¿Es exactamente π? Fracciones cercanas" }, [8, 8], "8.NS.A.2"),
  S("sci-measures", EXPO, { en: "Scientific measures in recipes", es: "Medidas científicas en recetas" }, [8, 8], "8.EE.A.4"),
];
