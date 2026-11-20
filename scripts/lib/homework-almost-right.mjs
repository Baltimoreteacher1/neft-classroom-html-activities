/**
 * "Almost right": one plausible wrong answer for the family to explain and fix, as a tap-to-reveal
 * card a grown-up can read aloud. Pages whose lesson authored a spot-the-glitch (`v3.glitch`, the
 * -part2/-part3 pages) already carry one in homework-v3-learn.mjs, so this renders only for the
 * rest. It invents no mathematics: the wrong answer, the named mistake, the right answer and its
 * reason are all one of the lesson's own `basicPractice` items, already checked by
 * `validate:family-homework-content` (one right answer, feedback on every wrong choice).
 */
import { act } from "./homework-actions.mjs";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
const bi = (en, es) =>
  `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es)}</span>`;

/** Middle items first: the first two are warm-ups, the last is the stretch. */
const ORDER = [2, 3, 1, 4, 0, 5];
const wordless = (text) => !/[A-Za-z]{2,}/.test(String(text));

/** Choice text in both languages; a choice with no words reads the same in both. */
function choiceBoth(item, i) {
  const en = String(item.choices[i]);
  const es = item.choicesEs?.[i] ? String(item.choicesEs[i]) : wordless(en) ? en : "";
  return es ? { en, es } : null;
}

/** The first item with a wrong choice that has a named mistake in both languages, or null. */
export function almostRightPick(notes) {
  const items = notes?.basicPractice || [];
  for (const index of ORDER) {
    const item = items[index];
    if (!item?.stemEs || !item.explanationEs) continue;
    for (let i = 0; i < item.choices.length; i += 1) {
      if (i === item.correctIndex) continue;
      const wrong = choiceBoth(item, i);
      const right = choiceBoth(item, item.correctIndex);
      const why = item.choiceFeedback?.[i];
      const whyEs = item.choiceFeedbackEs?.[i];
      if (wrong && right && why && whyEs) return { item, wrong, right, why, whyEs };
    }
  }
  return null;
}

export function renderAlmostRight(config) {
  const notes = config?.familyNotes || {};
  if (notes.v3?.glitch) return "";
  const pick = almostRightPick(notes);
  if (!pick) return "";
  const { item, wrong, right, why, whyEs } = pick;
  return `
    <section class="mission-block hw-almost" id="hw_almost" aria-labelledby="hw_almost_title" data-no-vocab>
      <h3 class="hw-subcard-tag" id="hw_almost_title">${bi("Almost right: find the mistake", "Casi correcto: encuentra el error")}</h3>
      <p class="hw-almost-prompt" id="hw_almost_prompt">${bi(
        `A classmate answered “${wrong.en}” to this question: ${item.stem}`,
        `Alguien respondió “${wrong.es}” a esta pregunta: ${item.stemEs}`,
      )}</p>
      <p class="hw-talk-solo">${bi("What went wrong? Say it out loud, then tap to check your thinking.", "¿Qué salió mal? Díganlo en voz alta y luego toquen para comprobar.")}</p>
      <button type="button" class="btn btn-sm btn-outline-secondary hw-reveal-audio" ${act("hwSpeakById", "hw_almost_prompt")}><span aria-hidden="true">🔊</span> ${bi("Listen", "Escuchar")}</button>
      <details class="hw-reveal" id="hw_almost_reveal">
        <summary>${bi("Tap to check your thinking", "Toquen para comprobar")}</summary>
        <div class="hw-reveal-body" id="hw_almost_answer">
          <p><strong>${bi("What went wrong:", "Qué salió mal:")}</strong> ${bi(why, whyEs)}</p>
          <p><strong>${bi("A better answer:", "Una mejor respuesta:")}</strong> ${bi(`${right.en}. ${item.explanation}`, `${right.es}. ${item.explanationEs}`)}</p>
          <button type="button" class="btn btn-sm btn-outline-secondary hw-reveal-audio" ${act("hwSpeakById", "hw_almost_answer")}><span aria-hidden="true">🔊</span> ${bi("Listen", "Escuchar")}</button>
        </div>
      </details>
    </section>`;
}
