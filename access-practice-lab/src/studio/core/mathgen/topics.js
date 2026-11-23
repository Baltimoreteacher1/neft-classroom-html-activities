// The topics the generators cover: stable id, English and Spanish label, and the grades each one is written for.

export const MATH_TOPICS = Object.freeze(
  [
    {
      id: "equivalent-ratios",
      en: "Equivalent ratios",
      es: "Razones equivalentes",
      grades: [6, 7],
    },
    { id: "unit-rate", en: "Unit rate", es: "Tasa unitaria", grades: [6, 7] },
    { id: "percent", en: "Percent", es: "Porcentaje", grades: [6, 7] },
    {
      id: "fraction-add-sub",
      en: "Add and subtract fractions",
      es: "Sumar y restar fracciones",
      grades: [4, 5, 6],
    },
    {
      id: "fraction-multiply",
      en: "Multiply fractions",
      es: "Multiplicar fracciones",
      grades: [4, 5, 6],
    },
    { id: "fraction-divide", en: "Divide fractions", es: "Dividir fracciones", grades: [5, 6] },
    {
      id: "decimal-ops",
      en: "Decimal operations",
      es: "Operaciones con decimales",
      grades: [4, 5, 6],
    },
    {
      id: "integer-ops",
      en: "Integers and the number line",
      es: "Enteros y la recta numérica",
      grades: [6, 7],
    },
    {
      id: "order-of-operations",
      en: "Order of operations",
      es: "Orden de las operaciones",
      grades: [5, 6, 7],
    },
    {
      id: "evaluate-expressions",
      en: "Evaluate expressions",
      es: "Evaluar expresiones",
      grades: [6, 7],
    },
    {
      id: "one-step-equations",
      en: "One-step equations",
      es: "Ecuaciones de un paso",
      grades: [6, 7],
    },
    {
      id: "two-step-equations",
      en: "Two-step equations",
      es: "Ecuaciones de dos pasos",
      grades: [6, 7],
    },
    {
      id: "area-perimeter",
      en: "Area and perimeter",
      es: "Área y perímetro",
      grades: [3, 4, 5, 6],
    },
    { id: "volume", en: "Volume of prisms", es: "Volumen de prismas", grades: [5, 6] },
    {
      id: "mean-median-mode-range",
      en: "Mean, median, mode and range",
      es: "Media, mediana, moda y rango",
      grades: [6, 7],
    },
    {
      id: "coordinate-plane",
      en: "The coordinate plane",
      es: "El plano de coordenadas",
      grades: [5, 6, 7],
    },
    { id: "inequalities", en: "Inequalities", es: "Desigualdades", grades: [6, 7] },
  ].map((t) => Object.freeze({ ...t, grades: Object.freeze(t.grades) })),
);
