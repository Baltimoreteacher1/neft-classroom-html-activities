// Oral reading practice (/voice/read/<id>): read a short passage aloud; speech recognition highlights the words you
// read. The learner sees only "Words you read: N of M". No rate, no clock, no speed target. A teacher view
// (?tab=teacher) shows the aligned accuracy kept on this device.
import { READ_ALOUD } from "../content/voice-lab.js";
import { dictationControlsHTML, dictating, toggleDictation } from "../dictation-ui.js";
import { alignReading, highlightedPassage, passageWords, readingAccuracy, spokenWords } from "../lang/oral-reading.js";
import { canDictate } from "../stt.js";
import { canSpeak, speak } from "../speech.js";
import { announce, html, icon, raw } from "../util.js";
import { loadVoice, saveVoice, voiceCrumbs } from "./voice-common.js";

export const findReading = (id) => READ_ALOUD.find((r) => r.id === id) || null;
const live = new Map(); // id → alignment of the current session (this tab)

function saveResult(id, a, total) {
  const state = loadVoice();
  state.read ||= {};
  state.read[id] = { words: a.matched, total, matched: a.matched, skipped: a.skipped, at: new Date().toISOString().slice(0, 10) };
  saveVoice(state);
}

export function readHTML(ctx, I, id) {
  const r = findReading(id);
  if (!r) return null;
  const words = passageWords(r.text);
  const a = live.get(id) || alignReading(words, []);
  const saved = loadVoice().read?.[id];
  const teacher = ctx.route?.tab === "teacher";
  const title = I.T(r.title, r.titleEs);
  const acc = saved ? readingAccuracy({ matched: saved.matched, skipped: saved.skipped }) : null;
  return {
    title: I.S(`Read aloud: ${r.title}`, `Lectura en voz alta: ${r.titleEs}`),
    html: html`${voiceCrumbs(I, ctx.band, title)}
      <article class="activity voice-page d-reading">
        <header class="act-head">
          <p class="act-context">${icon("reading")} ${I.T("Oral reading", "Lectura en voz alta")}</p>
          <h1 tabindex="-1">${title}</h1>
          <p class="lead">${I.T("Read the passage out loud. The words light up as you read them. Read at your own pace: nothing is timed.", "Lee el texto en voz alta. Las palabras se iluminan mientras las lees. Lee a tu ritmo: nada tiene tiempo límite.")}</p>
        </header>
        ${
          teacher
            ? html`<section class="panel teacher-review"><h2>${I.T("Teacher view", "Vista del docente")}</h2>
                ${saved ? html`<p>${I.T(`Last reading on this device (${saved.at}): ${saved.matched} of ${saved.total} words recognized; ${saved.skipped} skipped${acc === null ? "" : `; ${acc}% of the words reached were read`}.`, `Última lectura en este dispositivo (${saved.at}): ${saved.matched} de ${saved.total} palabras reconocidas; ${saved.skipped} omitidas${acc === null ? "" : `; se leyó el ${acc}% de las palabras alcanzadas`}.`)}</p>
                  <p class="fine">${I.T("Recognition can mishear accents and names. This is a practice signal, not a fluency score, and the lab records no reading rate.", "El reconocimiento puede oír mal los acentos y los nombres. Es una señal de práctica, no una puntuación de fluidez, y el laboratorio no registra una velocidad de lectura.")}</p>` : html`<p class="fine">${I.T("No reading has been saved on this device yet.", "Todavía no se ha guardado ninguna lectura en este dispositivo.")}</p>`}
              </section>`
            : ""
        }
        <section class="panel">
          <div class="rd-passage" lang="en" data-rd-passage>${raw(highlightedPassage(r.text, a.state))}</div>
          <p class="rd-count" role="status" aria-live="polite" data-rd-count>${I.T(`Words you read: ${a.matched} of ${words.length}`, `Palabras que leíste: ${a.matched} de ${words.length}`)}</p>
          <div class="row-actions">
            ${canSpeak() ? html`<button type="button" class="btn" data-say="${r.text}">${icon("volume")} ${I.T("Hear it read first", "Escúchalo leído primero")}</button>` : ""}
            <button type="button" class="btn" data-rd-reset>${icon("retry")} ${I.T("Start over", "Empezar de nuevo")}</button>
          </div>
          ${dictationControlsHTML(`read:${id}`, I, { label: I.T("Read it aloud: the words light up", "Léelo en voz alta: las palabras se iluminan") })}
          ${canDictate() ? "" : html`<p class="fine">${I.T("Read it aloud to a partner or your teacher instead.", "Léelo en voz alta a un compañero o a tu docente.")}</p>`}
        </section>
      </article>`,
  };
}

function paint(root, r, a) {
  const words = passageWords(r.text);
  root.querySelectorAll("[data-rd]").forEach((el) => {
    el.className = `rd-word is-${a.state[Number(el.dataset.rd)] || "todo"}`;
  });
  const count = root.querySelector("[data-rd-count]");
  if (count) count.textContent = `${a.matched} / ${words.length}`;
  return words.length;
}

export function readClick(e, ctx, I, id) {
  const r = findReading(id);
  if (!r) return false;
  const words = passageWords(r.text);
  const t = e.target;
  if (t.closest("[data-rd-reset]")) {
    live.delete(id);
    ctx.rerender();
    return true;
  }
  const d = t.closest("[data-dictate]");
  if (d && d.dataset.dictate === `read:${id}`) {
    const onText = (text) => {
      const a = alignReading(words, spokenWords(text));
      live.set(id, a);
      const root = document.querySelector("[data-rd-passage]")?.closest("article");
      if (root) {
        paint(root, r, a);
        const count = root.querySelector("[data-rd-count]");
        if (count) count.textContent = I.S(`Words you read: ${a.matched} of ${words.length}`, `Palabras que leíste: ${a.matched} de ${words.length}`);
      }
    };
    toggleDictation(d.dataset.dictate, {
      I,
      onText,
      onDone: (text) => {
        const a = alignReading(words, spokenWords(text));
        live.set(id, a);
        if (a.matched) {
          saveResult(id, a, words.length);
          announce(I.S(`You read ${a.matched} of ${words.length} words.`, `Leíste ${a.matched} de ${words.length} palabras.`));
        }
        ctx.rerender();
      },
    }).then(() => ctx.rerender());
    return true;
  }
  void dictating;
  return false;
}

export function readUnmount() {
  live.clear();
}
