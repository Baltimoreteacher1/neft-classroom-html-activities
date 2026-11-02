// Sample data for every model kind. Used by the gallery (design/family-system/art.html), the unit tests and
// the validator so the three always look at the same numbers. Lesson 4-5 is the reference case.

export const SAMPLES = [
  {
    id: "tape-45",
    kind: "tape",
    alt: { en: "Tape diagram: 6 of 10 equal blocks are $42, so each block is $7.", es: "Diagrama de cinta: 6 de 10 bloques iguales son $42, así que cada bloque es $7." },
    data: {
      parts: 10,
      highlight: 6,
      partLabel: { en: "60% = $42", es: "60% = $42" },
      wholeLabel: { en: "100% = ?", es: "100% = ?" },
      blockLabel: { en: "10% = $7", es: "10% = $7" },
      unknown: "whole",
    },
  },
  {
    id: "tape-part",
    kind: "tape",
    data: { parts: 5, highlight: 2, partLabel: "2 parts = ?", wholeLabel: "$50", blockLabel: "1 part = $10", unknown: "part" },
  },
  {
    id: "doubleline",
    kind: "doubleline",
    data: {
      top: { label: { en: "Cups of flour", es: "Tazas de harina" }, ticks: [0, 2, 4, 6, 8] },
      bottom: { label: { en: "Batches", es: "Tandas" }, ticks: [0, 1, 2, 3, 4] },
      unknown: [3],
    },
  },
  {
    id: "ratiotable",
    kind: "ratiotable",
    data: {
      headers: [{ en: "Boxes", es: "Cajas" }, { en: "Pencils", es: "Lápices" }],
      rows: [[1, 12], [2, 24], [3, 36], [5, 60]],
      unknownCells: [[3, 1]],
      arrows: [{ from: 0, to: 1, label: "× 2" }],
    },
  },
  { id: "area-rect", kind: "area", data: { shape: "rectangle", dims: { base: 8, height: 5 }, unit: "cm" } },
  { id: "area-para", kind: "area", data: { shape: "parallelogram", dims: { base: 9, height: 4, offset: 3 }, unit: "ft", cutAndSlide: true } },
  { id: "area-tri", kind: "area", data: { shape: "triangle", dims: { base: 10, height: 6 }, unit: "m", cutAndSlide: true } },
  { id: "area-trap", kind: "area", data: { shape: "trapezoid", dims: { base1: 5, base2: 9, height: 4 }, unit: "in" } },
  { id: "grid-100", kind: "grid", data: { rows: 10, cols: 10, filled: 60, groupSize: 10, label: { en: "60 out of 100", es: "60 de 100" } } },
  { id: "grid-bead", kind: "grid", data: { rows: 4, cols: 10, filled: 27, groupSize: 5, label: "27 of 40" } },
  {
    id: "numberline",
    kind: "numberline",
    data: {
      min: -6,
      max: 6,
      step: 1,
      points: [
        { value: -4, label: "A", kind: "given" },
        { value: 2, label: "B", kind: "unknown" },
        { value: 5, label: "C", kind: "answer" },
        { value: -1, label: "D", kind: "error" },
      ],
      unit: { en: "degrees", es: "grados" },
    },
  },
  {
    id: "coord",
    kind: "coord",
    data: { xmax: 8, ymax: 8, quadrants: false, points: [{ x: 2, y: 3, label: "A" }, { x: 6, y: 5, label: "B" }, { x: 7, y: 1, label: "C" }] },
  },
  {
    id: "coord-quad",
    kind: "coord",
    data: { xmax: 5, ymax: 5, quadrants: true, points: [{ x: -3, y: 2, label: "P" }, { x: 4, y: -2, label: "Q" }] },
  },
  {
    id: "barplot",
    kind: "barplot",
    data: {
      categories: [
        { label: { en: "Soccer", es: "Fútbol" }, value: 12 },
        { label: { en: "Basketball", es: "Baloncesto" }, value: 18 },
        { label: { en: "Swimming", es: "Natación" }, value: 7 },
        { label: { en: "Track and field", es: "Atletismo" }, value: 10 },
      ],
      unit: { en: "students", es: "estudiantes" },
    },
  },
  { id: "fraction", kind: "fraction", data: { parts: 8, shaded: 3, label: "3/8" } },
  { id: "balance", kind: "balance", data: { left: ["x", 3], right: [11], unknown: "x" } },
];
