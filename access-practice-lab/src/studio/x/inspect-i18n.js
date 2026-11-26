// English and Spanish wording for the Creation Quality Inspector. validateActivity's messages are English only; the
// Spanish for each of its fixed sentences lives here, keyed by the English sentence (without "Question N: ").
// Spanish here has NOT had a native-speaker review.

const BODY = {
  "This is not an activity.": "Esto no es una actividad.",
  "A game needs at least three questions to be playable.":
    "Un juego necesita al menos tres preguntas para poder jugarse.",
  "Add at least one question.": "Agregue al menos una pregunta.",
  "write the question students will see.": "escriba la pregunta que verán los estudiantes.",
  "Add at least two answer choices.": "Agregue al menos dos opciones de respuesta.",
  "An answer choice is empty.": "Una opción de respuesta está vacía.",
  "Pick which choice is correct.": "Elija cuál opción es la correcta.",
  "Two answer choices say the same thing, so more than one could be right.":
    "Dos opciones dicen lo mismo, así que más de una podría ser correcta.",
  "Add at least three choices for select-all.":
    "Agregue al menos tres opciones para «seleccionar todas».",
  "Mark every correct choice.": "Marque todas las opciones correctas.",
  "Every choice is marked correct.": "Todas las opciones están marcadas como correctas.",
  "Add at least two pairs.": "Agregue al menos dos parejas.",
  "A pair is missing one side.": "A una pareja le falta un lado.",
  "Two pairs repeat the same word, so a match could be right either way.":
    "Dos parejas repiten la misma palabra, así que una unión podría ser correcta de dos maneras.",
  "Add at least two groups.": "Agregue al menos dos grupos.",
  "Add at least two items to sort.": "Agregue al menos dos elementos para clasificar.",
  "Every item needs its correct group.": "Cada elemento necesita su grupo correcto.",
  "Add at least two items to put in order.": "Agregue al menos dos elementos para ordenar.",
  "An item is empty.": "Un elemento está vacío.",
  "Mark the missing word with [[double brackets]].":
    "Marque la palabra que falta con [[corchetes dobles]].",
  "The expression for this answer could not be calculated.":
    "No se pudo calcular la expresión de esta respuesta.",
  "Type the correct number (for example 3/4, 0.75, or 12).":
    "Escriba el número correcto (por ejemplo 3/4, 0.75 o 12).",
  "Mark each correct word or phrase with [[double brackets]].":
    "Marque cada palabra o frase correcta con [[corchetes dobles]].",
  "Add the picture students will click on.":
    "Agregue la imagen en la que harán clic los estudiantes.",
  "Add at least two clickable areas.": "Agregue al menos dos áreas en las que se pueda hacer clic.",
  "Pick the correct area.": "Elija el área correcta.",
  "A clickable area is outside the picture.": "Un área seleccionable queda fuera de la imagen.",
  "The number line's end must be greater than its start.":
    "El final de la recta numérica debe ser mayor que su inicio.",
  "Type the correct number.": "Escriba el número correcto.",
  "The answer is off the number line.": "La respuesta queda fuera de la recta numérica.",
  "Add at least two words to build a sentence.":
    "Agregue al menos dos palabras para armar una oración.",
  "Show at least two steps.": "Muestre al menos dos pasos.",
  "Mark which step has the mistake.": "Marque cuál paso tiene el error.",
  "Add the fix choices and mark the correct one.":
    "Agregue las opciones de corrección y marque la correcta.",
  "Leave at least one cell for students to fill in.":
    "Deje al menos una celda para que los estudiantes la llenen.",
  "Every row needs one cell per column.": "Cada fila necesita una celda por columna.",
  "Add the points students should plot.": "Agregue los puntos que los estudiantes deben ubicar.",
  "A point is off the grid.": "Un punto queda fuera de la cuadrícula.",
  "A picture could not be used. Use a PNG, JPG, WebP or GIF.":
    "No se pudo usar una imagen. Use un archivo PNG, JPG, WebP o GIF.",
  "A vocabulary word is missing its meaning.":
    "A una palabra de vocabulario le falta su significado.",
  "Give the activity a title students will recognize.":
    "Póngale a la actividad un título que los estudiantes reconozcan.",
  "Choose a grade and subject so students and teachers can find this.":
    "Elija un grado y una materia para que estudiantes y maestros la encuentren.",
  "add a sample response so you and students know what good looks like.":
    "agregue una respuesta de ejemplo para que usted y los estudiantes sepan cómo luce una buena.",
  "add a hint so students who are stuck can try again.":
    "agregue una pista para que los estudiantes atascados puedan intentarlo de nuevo.",
  "add a short explanation shown after students answer.":
    "agregue una explicación breve que se muestre después de responder.",
  "describe the picture for students who cannot see it.":
    "describa la imagen para los estudiantes que no pueden verla.",
  "is long. Consider splitting it into steps.": "es larga. Considere dividirla en pasos.",
  '"all/none of the above" makes answers ambiguous.':
    "«todas/ninguna de las anteriores» vuelve ambiguas las respuestas.",
  "A picture is missing its description for screen readers.":
    "A una imagen le falta su descripción para lectores de pantalla.",
  "Spanish support is on: have a Spanish speaker check the translations before you share.":
    "El apoyo en español está activado: pida a un hablante de español que revise las traducciones antes de compartir.",
  "Some vocabulary words have no Spanish. Add them or turn Spanish support off for those words.":
    "Algunas palabras de vocabulario no tienen español. Agréguelo o desactive el apoyo en español para esas palabras.",
  "Standards you added are labeled as your choice, not official alignment.":
    "Los estándares que agregó se marcan como elección suya, no como alineación oficial.",
};

const LABEL = /^Question (\d+): ([\s\S]*)$/;

/** Spanish for one validateActivity message ("Question 3: ..." included). */
export function validateEs(en) {
  const m = LABEL.exec(en);
  const [label, body] = m ? [`Pregunta ${m[1]}: `, m[2]] : ["", en];
  if (BODY[body]) return label + BODY[body];
  let r = /^The answer key says (.+) but (.+) equals (.+)\.$/.exec(body);
  if (r) return `${label}La clave dice ${r[1]} pero ${r[2]} es igual a ${r[3]}.`;
  r = /^repeats Question (\d+)\.$/.exec(body);
  if (r) return `${label}repite la Pregunta ${r[1]}.`;
  return en; // unknown sentence: keep the English rather than guess
}

/** One short "how to fix it" per validate code; everything else gets the generic line for its severity. */
const HOW = {
  "no-answer": [
    "Mark the correct answer in the editor.",
    "Marque la respuesta correcta en el editor.",
  ],
  "wrong-math": [
    "Fix the answer or the expression so they agree, then check the key again.",
    "Corrija la respuesta o la expresión para que coincidan y revise la clave de nuevo.",
  ],
  "no-prompt": [
    "Type the question students will read.",
    "Escriba la pregunta que leerán los estudiantes.",
  ],
  "bad-image": [
    "Add the picture again as a PNG, JPG, WebP or GIF file.",
    "Vuelva a agregar la imagen como archivo PNG, JPG, WebP o GIF.",
  ],
  "no-alt": [
    "Describe what the picture shows in one sentence.",
    "Describa en una oración lo que muestra la imagen.",
  ],
  "dup-option": [
    "Reword one choice so only one answer can be right.",
    "Cambie la redacción de una opción para que solo una respuesta pueda ser correcta.",
  ],
};
const GENERIC = {
  fix: [
    "Open this item in the editor and correct it. Students cannot be given it until it is fixed.",
    "Abra este elemento en el editor y corríjalo. No se puede compartir con los estudiantes hasta corregirlo.",
  ],
  check: [
    "Review this item and decide whether to change it.",
    "Revise este elemento y decida si quiere cambiarlo.",
  ],
  note: ["Optional: consider improving this.", "Opcional: considere mejorar esto."],
};

export const howFor = (code, severity) => {
  const [en, es] = HOW[code] || GENERIC[severity];
  return { en, es };
};
