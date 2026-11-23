// Honest notes on every place the paper version is NOT the same experience as the interactive one.
// Returned with the worksheet so the editor can show them to the teacher before they print.

const PER_FORMAT = {
  match: {
    en: "Students write the letter of each match instead of dragging or drawing a line. The right-hand choices are in a fixed scrambled order.",
    es: "Los estudiantes escriben la letra de cada pareja en lugar de arrastrar o trazar una línea. Las opciones de la derecha están en un orden mezclado fijo.",
  },
  sort: {
    en: "Students write each item in a column instead of dragging it into a group. Items appear in a fixed scrambled word bank.",
    es: "Los estudiantes escriben cada elemento en una columna en lugar de arrastrarlo a un grupo. Los elementos aparecen en un banco de palabras mezclado y fijo.",
  },
  order: {
    en: "Students write letters in order instead of dragging cards. The items appear in a fixed scrambled list.",
    es: "Los estudiantes escriben letras en orden en lugar de arrastrar tarjetas. Los elementos aparecen en una lista mezclada y fija.",
  },
  blank: {
    en: "Students write on a line instead of typing. Spelling and equivalent forms are not checked until you read the work.",
    es: "Los estudiantes escriben en una línea en lugar de teclear. La ortografía y las formas equivalentes no se revisan hasta que usted lea el trabajo.",
  },
  number: {
    en: "Students write the answer instead of typing it. Equivalent forms (such as 0.75 and 3/4) are not recognized automatically.",
    es: "Los estudiantes escriben la respuesta en lugar de teclearla. Las formas equivalentes (como 0.75 y 3/4) no se reconocen automáticamente.",
  },
  identify: {
    en: "Students circle words instead of clicking them.",
    es: "Los estudiantes encierran palabras en un círculo en lugar de hacer clic.",
  },
  hotspot: {
    en: "The picture is labeled with letters and students write the letter instead of clicking the region.",
    es: "La imagen tiene letras y los estudiantes escriben la letra en lugar de hacer clic en la región.",
  },
  numberline: {
    en: "Students draw a dot on a printed number line instead of dragging a marker, so any position is accepted until you check it.",
    es: "Los estudiantes dibujan un punto en una recta numérica impresa en lugar de arrastrar un marcador; cualquier posición se acepta hasta que usted la revise.",
  },
  plot: {
    en: "Students mark points on a printed grid instead of clicking on it.",
    es: "Los estudiantes marcan puntos en una cuadrícula impresa en lugar de hacer clic.",
  },
  build: {
    en: "Word tiles become cut-out cards in a fixed scrambled order, or students write the sentence on the lines.",
    es: "Las fichas de palabras se vuelven tarjetas para recortar en un orden mezclado fijo, o los estudiantes escriben la oración en las líneas.",
  },
  error: {
    en: "Students circle the mistaken step and choose the fix on paper.",
    es: "Los estudiantes encierran el paso con error y eligen la corrección en el papel.",
  },
  fillTable: {
    en: "Students write in the empty boxes instead of typing in cells.",
    es: "Los estudiantes escriben en los cuadros vacíos en lugar de teclear en celdas.",
  },
};

const BLOCK = {
  audio: {
    en: "Audio does not play on paper. The text to read aloud is on the teacher copy.",
    es: "El audio no se reproduce en papel. El texto para leer en voz alta está en la copia del maestro.",
  },
  note: {
    en: "Teacher notes are printed only on the teacher copy.",
    es: "Las notas del maestro se imprimen solo en la copia del maestro.",
  },
  vocab: {
    en: "Words are listed in a table. There are no pop-ups or read-aloud buttons.",
    es: "Las palabras aparecen en una tabla. No hay ventanas emergentes ni botones de lectura en voz alta.",
  },
};

const NO_FEEDBACK = {
  en: "On paper there is no instant feedback, hints, retry or read-aloud. Hints and explanations are on the teacher copy.",
  es: "En papel no hay retroalimentación inmediata, pistas, reintentos ni lectura en voz alta. Las pistas y explicaciones están en la copia del maestro.",
};

const NO_IMAGE = {
  en: "This picture could not be printed (no image). The regions are shown as labeled boxes.",
  es: "Esta imagen no se pudo imprimir (no hay imagen). Las regiones se muestran como cuadros con letras.",
};

/** @returns {Array<{blockId: string, note: {en: string, es: string}}>} */
export function collectTransformations(activity) {
  const out = [{ blockId: "(activity)", note: NO_FEEDBACK }];
  for (const b of activity.blocks) {
    if (b.type === "question" && PER_FORMAT[b.format]) {
      out.push({ blockId: b.id, note: PER_FORMAT[b.format] });
      if (b.format === "hotspot" && !b.image?.src) out.push({ blockId: b.id, note: NO_IMAGE });
    } else if (BLOCK[b.type]) out.push({ blockId: b.id, note: BLOCK[b.type] });
  }
  return out;
}
