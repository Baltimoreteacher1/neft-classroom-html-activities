// Language Time Machine — the speaking comparison: the earlier and the later recording, each with a real player,
// "one after the other" and "together from the start" controls, and the words of each recording as captions.
//
// Rules kept here:
//  * Speaking is compared by its words and its task only. Nothing on this page compares or mentions accent, speed,
//    pace or pauses, and no recording gets a rating.
//  * Words from speech recognition are labelled as such until the learner confirms them ("These words are right"),
//    which only sets a flag in this feature's own key.
//  * A recording that is no longer kept (30 days) says so and still shows its words.
import { html, icon } from "../util.js";
import {
  changesHTML,
  fieldId,
  historyHTML,
  itemMetaHTML,
  markedTextHTML,
  pairActionsHTML,
  pairHeadHTML,
  reflectionFormHTML,
  teacherNoteHTML,
} from "./ui.js";

function wordsHTML(I, x, side, changes) {
  const heading = html`<h4 class="tm-wordsh">
    ${I.T("Words of this recording (captions)", "Palabras de esta grabación (subtítulos)")}
  </h4>`;
  if (!x.text) {
    const id = fieldId("words", side);
    return html`<div class="tm-words">
      ${heading}
      <p class="fine">
        ${I.T("No words are saved for this recording. Listen, then type what you said so it has captions.", "No hay palabras guardadas para esta grabación. Escucha y luego escribe lo que dijiste para que tenga subtítulos.")}
      </p>
      <label class="tm-label" for="${id}">${I.T("What I said", "Lo que dije")}</label>
      <textarea
        id="${id}"
        rows="3"
        maxlength="2000"
        data-tm-words="${x.id}"
        data-gramm="false"
      ></textarea>
      <button
        type="button"
        class="btn small no-print"
        data-tm-words-save="${x.id}"
        data-tm-field="${id}"
      >
        ${I.T("Save these words", "Guardar estas palabras")}
      </button>
    </div>`;
  }
  const fromSpeech = x.source === "transcript" && !x.verified;
  return html`<div class="tm-words">
    ${heading}${markedTextHTML(x.text, changes, side)}
    ${
      fromSpeech
        ? html`<p class="tm-caution">
              ${icon("info")}
              ${I.T("Speech-recognition text. It may contain errors: the computer may have heard a different word.", "Texto de reconocimiento de voz. Puede tener errores: la computadora pudo oír otra palabra.")}
            </p>
            <button type="button" class="btn small no-print" data-tm-verify="${x.id}">
              ${icon("check")} ${I.T("These words are right", "Estas palabras están bien")}
            </button>`
        : html`<p class="fine">
            ${x.source === "transcript" ? I.T("You confirmed these words.", "Confirmaste estas palabras.") : I.T("You typed these words.", "Tú escribiste estas palabras.")}
            ${x.source === "transcript" ? html`<button type="button" class="btn small no-print" data-tm-unverify="${x.id}">${I.T("Undo", "Deshacer")}</button>` : ""}
          </p>`
    }
  </div>`;
}

function speakSideHTML(I, x, side, changes, urls) {
  const url = x.audioId ? urls[x.audioId] : "";
  const label =
    side === "a"
      ? I.S("Earlier recording", "Grabación anterior")
      : I.S("Later recording", "Grabación posterior");
  return html`<figure class="tm-side tm-side-${side}">
    ${itemMetaHTML(I, x, side)}
    ${
      url
        ? html`<audio
            class="tm-player"
            controls
            preload="metadata"
            src="${url}"
            data-tm-audio="${side}"
            aria-label="${label}"
          ></audio>`
        : html`<p class="tm-gone" data-tm-gone="${side}">
            ${icon("info")}
            ${I.T("This recording is no longer kept on this device. Recordings are kept for 30 days. The words are still here.", "Esta grabación ya no está guardada en este dispositivo. Las grabaciones se guardan 30 días. Las palabras siguen aquí.")}
          </p>`
    }
    ${wordsHTML(I, x, side, changes)}${teacherNoteHTML(I, x)}
  </figure>`;
}

/** The speaking comparison for one pair. `extra.urls` maps a kept recording's id to an object URL. */
export function speakingPairHTML(I, band, model, pair, cmp, extra) {
  const both = Boolean(extra.urls[pair.earlier.audioId] && extra.urls[pair.later.audioId]);
  return html`<article class="panel tm-pair" aria-labelledby="tmPair">
    ${pairHeadHTML(I, pair)}${historyHTML(I, model.items, pair)}
    <div
      class="tm-playboth no-print"
      role="group"
      aria-label="${I.S("Play the two recordings", "Reproducir las dos grabaciones")}"
    >
      <button type="button" class="btn" data-tm-play="sequence" ${both ? "" : html`disabled`}>
        ${icon("play")} ${I.T("Play one after the other", "Reproducir una después de la otra")}
      </button>
      <button type="button" class="btn" data-tm-play="together" ${both ? "" : html`disabled`}>
        ${icon("play")} ${I.T("Play together from the start", "Reproducir juntas desde el inicio")}
      </button>
      <button type="button" class="btn" data-tm-play="stop" ${both ? "" : html`disabled`}>
        ${icon("stop")} ${I.T("Stop", "Parar")}
      </button>
      <p class="fine" role="status" data-tm-playing>
        ${both ? "" : I.T("These buttons need both recordings. Use the player that is still here.", "Estos botones necesitan las dos grabaciones. Usa el reproductor que todavía está aquí.")}
      </p>
    </div>
    <div class="tm-sides">
      ${speakSideHTML(I, pair.earlier, "a", cmp.changes, extra.urls)}${speakSideHTML(I, pair.later, "b", cmp.changes, extra.urls)}
    </div>
    <p class="fine">
      ${I.T("Listen for what your words do: the ideas, the order, the exact words. How a voice sounds is not compared here.", "Escucha lo que hacen tus palabras: las ideas, el orden, las palabras exactas. Aquí no se compara cómo suena una voz.")}
    </p>
    ${changesHTML(I, cmp)}${reflectionFormHTML(I, pair, extra.reflection, extra)}${pairActionsHTML(I, band, pair, extra)}
  </article>`;
}
