// The language-support layer: access changes only. Nothing here touches a question's prompt, options, answer key or
// objective. Every setting changed is one the player or the worksheet really reads:
//   supports.readAloud / chunk / spanish / frames / hints   -> player (hear buttons, passage parts, glosses, hint ladder)
//   supports.frames / spanish / visuals                    -> worksheet print
//   question.frame                                         -> hint ladder + printed worksheet
//   blank question `bank`                                  -> word bank under a fill-in-the-blank (player/formats-text.js)
//   vocab block before the passage                         -> words shown first
//   directions text as numbered paragraphs                 -> one short step per paragraph
// `opts` entries left undefined are not touched.

import { addFrames } from "./differentiate-frames.js";
import {
  blocksOf,
  hasImages,
  hasSpanishData,
  pair,
  passageParts,
  plural,
  splitSteps,
  stepsText,
} from "./differentiate-util.js";
import { questionsOf } from "./schema.js";

const FLAGS = {
  readAloud: {
    on: pair(
      "Turned on read-aloud so students can hear the directions, passages, words and questions.",
      "Se activó la lectura en voz alta para que los estudiantes escuchen las instrucciones, los textos, las palabras y las preguntas.",
    ),
    off: pair("Turned off read-aloud.", "Se desactivó la lectura en voz alta."),
  },
  chunk: {
    on: pair(
      "Turned on short reading parts: a long passage shows a few sentences at a time.",
      "Se activaron las partes de lectura cortas: un texto largo muestra unas pocas oraciones a la vez.",
    ),
    off: pair(
      "Turned off short reading parts: the passage shows all at once.",
      "Se desactivaron las partes de lectura cortas: el texto se muestra completo.",
    ),
  },
  spanish: {
    on: pair(
      "Turned on Spanish support: word lists show the Spanish words already in the activity.",
      "Se activó el apoyo en español: las listas de palabras muestran las palabras en español que ya están en la actividad.",
    ),
    off: pair("Turned off Spanish support.", "Se desactivó el apoyo en español."),
  },
  visuals: {
    on: pair(
      "Turned on pictures with new words (the pictures already in the word list).",
      "Se activaron las imágenes con las palabras nuevas (las imágenes que ya están en la lista de palabras).",
    ),
    off: pair(
      "Turned off pictures with new words.",
      "Se desactivaron las imágenes con las palabras nuevas.",
    ),
  },
  hints: {
    on: pair(
      "Turned on hints, available when a student asks.",
      "Se activaron las pistas, disponibles cuando el estudiante las pide.",
    ),
    off: pair("Turned off hints.", "Se desactivaron las pistas."),
  },
  frames: {
    on: pair(
      "Turned on sentence frames, shown on the hint ladder and on the printed worksheet.",
      "Se activaron los marcos de oraciones, que aparecen en la escalera de pistas y en la hoja de trabajo impresa.",
    ),
    off: pair(
      "Turned off sentence frames (the frame text stays in the questions).",
      "Se desactivaron los marcos de oraciones (el texto de los marcos permanece en las preguntas).",
    ),
  },
};

const chunkable = (a) => blocksOf(a, "passage").some((b) => passageParts(b.text) >= 2);

function setFlag(a, key, value, changes) {
  if (a.supports[key] === value) return;
  a.supports[key] = value;
  changes.push(FLAGS[key][value ? "on" : "off"]);
}

function moveVocabFirst(a, changes) {
  const p = a.blocks.findIndex((b) => b.type === "passage");
  if (p < 0) return;
  const v = a.blocks.findIndex((b, i) => i > p && b.type === "vocab" && b.items.length);
  if (v < 0) return;
  const [block] = a.blocks.splice(v, 1);
  a.blocks.splice(p, 0, block);
  changes.push(
    pair(
      "Moved the word list before the passage so students meet the words first (same words, same meanings).",
      "Se movió la lista de palabras antes del texto para que los estudiantes conozcan las palabras primero (mismas palabras, mismos significados).",
    ),
  );
}

function addBanks(a, changes) {
  const blanks = questionsOf(a).filter((q) => q.format === "blank" && !q.bank);
  for (const q of blanks) q.bank = true;
  if (blanks.length)
    changes.push(
      plural(
        blanks.length,
        [
          "Added a word bank to {n} fill-in-the-blank question (its own answers, shuffled; the answers did not change).",
          "Added a word bank to {n} fill-in-the-blank questions (their own answers, shuffled; the answers did not change).",
        ],
        [
          "Se agregó un banco de palabras a {n} pregunta de completar (sus propias respuestas, mezcladas; las respuestas no cambiaron).",
          "Se agregó un banco de palabras a {n} preguntas de completar (sus propias respuestas, mezcladas; las respuestas no cambiaron).",
        ],
      ),
    );
}

/** Cut each directions block into short numbered steps. Returns how many blocks changed. */
export function shortenDirections(a, changes) {
  let n = 0;
  for (const b of blocksOf(a, "text").filter((x) => x.role === "directions")) {
    const steps = splitSteps(b.text);
    if (!steps.length) continue;
    const next = stepsText(steps);
    if (next === b.text) continue;
    b.text = next;
    n += 1;
  }
  if (n)
    changes.push(
      pair(
        "Split the directions into short numbered steps. Only the sentence breaks changed; no words were replaced.",
        "Se dividieron las instrucciones en pasos numerados y cortos. Solo cambiaron los cortes de oración; no se reemplazó ninguna palabra.",
      ),
    );
  return n;
}

function addFrameLayer(a, level, changes) {
  setFlag(a, "frames", true, changes);
  const done = addFrames(a, level);
  if (!done.length) return;
  changes.push(
    plural(
      done.length,
      [
        "Added a sentence frame to {n} question that had none.",
        "Added sentence frames to {n} questions that had none.",
      ],
      [
        "Se agregó un marco de oración a {n} pregunta que no tenía.",
        "Se agregaron marcos de oraciones a {n} preguntas que no tenían.",
      ],
    ),
  );
}

/**
 * Apply support settings to a working copy `a` (mutated).
 * @param {object} o { wida, readAloud, chunk, visuals, spanish, hints, frames: "full"|"partial"|"off", bank, vocabPreview, directions }
 * @returns {{ changes: object[], warnings: object[] }}
 */
export function applySupports(a, o) {
  const changes = [];
  const warnings = [];
  if (o.wida !== undefined && a.supports.wida !== o.wida) {
    a.supports.wida = o.wida;
    changes.push(
      pair(
        `Set the language level to WIDA ${o.wida}. This sets starting supports only; the learning is not made easier.`,
        `Se fijó el nivel de lenguaje en WIDA ${o.wida}. Esto solo ajusta los apoyos iniciales; el aprendizaje no se hace más fácil.`,
      ),
    );
  }
  if (o.readAloud !== undefined) setFlag(a, "readAloud", o.readAloud, changes);
  if (o.chunk !== undefined && (!o.chunk || chunkable(a))) setFlag(a, "chunk", o.chunk, changes);
  if (o.hints !== undefined) setFlag(a, "hints", o.hints, changes);
  if (o.spanish === true) {
    if (hasSpanishData(a)) setFlag(a, "spanish", true, changes);
    else if (!a.supports.spanish)
      warnings.push(
        pair(
          "Spanish support was not turned on: no word in this activity has a Spanish translation yet.",
          "No se activó el apoyo en español: ninguna palabra de esta actividad tiene traducción al español todavía.",
        ),
      );
  } else if (o.spanish === false) setFlag(a, "spanish", false, changes);
  if (o.visuals === true) {
    if (hasImages(a)) setFlag(a, "visuals", true, changes);
    else if (!a.supports.visuals)
      warnings.push(
        pair(
          "Pictures with new words were not turned on: the word list has no pictures yet.",
          "No se activaron las imágenes con las palabras nuevas: la lista de palabras todavía no tiene imágenes.",
        ),
      );
  } else if (o.visuals === false) setFlag(a, "visuals", false, changes);
  if (o.bank) addBanks(a, changes);
  if (o.vocabPreview) moveVocabFirst(a, changes);
  if (o.directions) shortenDirections(a, changes);
  if (o.frames === "off") setFlag(a, "frames", false, changes);
  else if (o.frames) addFrameLayer(a, o.frames, changes);
  if (o.hints) {
    const bare = questionsOf(a).filter((q) => q.format !== "short" && !q.hint.trim()).length;
    if (bare)
      warnings.push(
        plural(
          bare,
          [
            "{n} question has no hint. Hints were not written for it; add one so students who are stuck can try again.",
            "{n} questions have no hint. Hints were not written for them; add them so students who are stuck can try again.",
          ],
          [
            "{n} pregunta no tiene pista. No se escribió una; agrégale una para que quien se atasque pueda intentarlo de nuevo.",
            "{n} preguntas no tienen pista. No se escribieron; agrégales una para que quien se atasque pueda intentarlo de nuevo.",
          ],
        ),
      );
  }
  return { changes, warnings };
}
