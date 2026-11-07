// Keyboarding warm-up offer on grades 4-5 Writing pages. ACCESS Writing is typed from grade 4, so the page points
// to the Voice Lab warm-up set that matches the learner's support level. Accuracy only: no clock, no speed. The
// link never blocks the writing task, and progress is read from the same device record the warm-up writes.
import { keyWarmupFor } from "../content/voice-lab.js";
import { html, icon } from "../util.js";
import { loadVoice, voiceHref } from "./voice-common.js";

/** Markup for the warm-up offer, or "" when this band and level have no warm-up set. */
export function keyWarmupHTML(I, band, level, voice = loadVoice()) {
  const set = keyWarmupFor(band, level);
  if (!set) return "";
  const done = Math.min((voice.keys?.[set.id] || []).length, set.frames.length);
  return html`<aside class="panel key-warmup" data-key-warmup="${set.id}" aria-label="${I.S("Typing warm-up", "Calentamiento de teclado")}">
    <p>
      ${icon("writing")}
      <strong>${I.T("Warm up your typing first.", "Calienta tu escritura en teclado primero.")}</strong>
      ${I.T("Type five short sentences exactly, with capitals and end marks. Only accuracy counts, never speed.", "Escribe cinco oraciones cortas con exactitud, con mayúsculas y signos finales. Solo cuenta la exactitud, nunca la velocidad.")}
    </p>
    <p class="fine">
      <a href="${voiceHref(`keys/${set.id}`, band)}">${I.T(set.title, set.titleEs)}</a>
      · ${I.T(`${done} of ${set.frames.length} typed exactly on this device`, `${done} de ${set.frames.length} escritas con exactitud en este dispositivo`)}
    </p>
  </aside>`;
}
