// Teacher-facing reasons for the source material workspace: every one is an {en, es} pair.

import { pair } from "../core/differentiate-util.js";
import { MAX_CHARS } from "./ingest-limits.js";

export const NO_TEXT = pair("There is no text to read.", "No hay texto para leer.");
export const R = {
  unmarked: pair(
    'No correct answer is marked. Mark it with * before the choice, add "Answer: B", or use an answer key. It was not guessed.',
    'No hay respuesta correcta marcada. Márcala con * antes de la opción, agrega "Answer: B" o usa una clave de respuestas. No se adivinó.',
  ),
  twoMarks: pair(
    "More than one choice is marked correct, so the answer was not chosen for you.",
    "Hay más de una opción marcada como correcta, así que no se eligió la respuesta por ti.",
  ),
  conflict: pair(
    "The marked choice and the Answer line disagree, so the answer was not chosen for you.",
    "La opción marcada y la línea de respuesta no coinciden, así que no se eligió la respuesta por ti.",
  ),
  badAnswer: pair(
    "The Answer line does not name one of the choices (use the letter, such as B).",
    "La línea de respuesta no nombra ninguna de las opciones (usa la letra, por ejemplo B).",
  ),
  multi: pair(
    "The Answer line names more than one choice. Pick the one correct choice, or make it a select-all question yourself.",
    "La línea de respuesta nombra más de una opción. Elige la única correcta o crea tú una pregunta de selección múltiple.",
  ),
  keyMiss: pair(
    "The answer key gives a letter that is not one of this question's choices.",
    "La clave de respuestas da una letra que no es una de las opciones de esta pregunta.",
  ),
  missingOption: pair(
    "The choice letters skip or repeat a letter, so a choice may be missing. The question was left out. Check the original.",
    "Las letras de las opciones se saltan o repiten una letra, así que puede faltar una opción. La pregunta se dejó fuera. Revisa el original.",
  ),
  oneOption: pair(
    "Only one choice was found for this question, so it was left out.",
    "Solo se encontró una opción para esta pregunta, así que se dejó fuera.",
  ),
  noStem: pair(
    "Choices were found without a question above them, so they were left out.",
    "Se encontraron opciones sin una pregunta arriba, así que se dejaron fuera.",
  ),
  unreadable: pair(
    "This question could not be read. It was left out.",
    "No se pudo leer esta pregunta. Se dejó fuera.",
  ),
  keyUnread: pair(
    "An answer key heading was found but no answers could be read from it.",
    "Se encontró un título de clave de respuestas, pero no se pudo leer ninguna respuesta.",
  ),
  uneven: pair(
    "These rows have a different number of columns than the rest. They were not used as words.",
    "Estas filas tienen un número de columnas distinto al resto. No se usaron como palabras.",
  ),
  uneTable: pair(
    "Some rows have a different number of columns than the rest. Check that the table is complete.",
    "Algunas filas tienen un número de columnas distinto al resto. Revisa que la tabla esté completa.",
  ),
  emptyCell: pair(
    "A word or its meaning is empty, so this row was left out. Nothing was made up.",
    "Falta una palabra o su significado, así que esta fila se dejó fuera. No se inventó nada.",
  ),
  header: pair(
    "The first row was used as the column titles. Check that it is a title row.",
    "La primera fila se usó como títulos de columna. Revisa que sea una fila de títulos.",
  ),
  comma: pair(
    "These words are separated only by a comma, so they may not be a word list. Check each one.",
    "Estas palabras están separadas solo por una coma, así que quizá no sean una lista de vocabulario. Revisa cada una.",
  ),
  dupPair: pair(
    "Two pairs repeat the same word or meaning, so a match could be right either way. Change one.",
    "Dos parejas repiten la misma palabra o significado, así que un emparejamiento podría ser correcto de dos maneras. Cambia una.",
  ),
  badPair: pair(
    "This line is not a pair (word - meaning) and was left out.",
    "Esta línea no es una pareja (palabra - significado) y se dejó fuera.",
  ),
  steps: pair(
    "A numbered list was read as steps in order. Check that the order matters.",
    "Una lista numerada se leyó como pasos en orden. Revisa que el orden sea importante.",
  ),
  groups: pair(
    'Lines like "Label: item, item" were read as groups to sort. Check them.',
    'Las líneas como "Etiqueta: elemento, elemento" se leyeron como grupos para clasificar. Revísalas.',
  ),
  bare: pair(
    "This looks like a bare number expression. Confirm it is a problem.",
    "Esto parece una expresión numérica suelta. Confirma que sea un problema.",
  ),
  blankNoAnswer: pair(
    'A blank was found without an "Answer:" line, so no fill-in question was made. Add the answer.',
    'Se encontró un espacio en blanco sin línea "Answer:", así que no se creó la pregunta. Agrega la respuesta.',
  ),
  blankMany: pair(
    "This line has more than one blank, so no fill-in question was made. Split it into one blank per question.",
    "Esta línea tiene más de un espacio en blanco, así que no se creó la pregunta. Sepárala en un espacio por pregunta.",
  ),
  stray: pair(
    "This text could not be sorted into questions, words, steps or a reading passage, so it was not used.",
    "Este texto no se pudo clasificar como preguntas, palabras, pasos o texto de lectura, así que no se usó.",
  ),
  truncated: pair(
    `Only the first ${MAX_CHARS} characters were read.`,
    `Solo se leyeron los primeros ${MAX_CHARS} caracteres.`,
  ),
};

