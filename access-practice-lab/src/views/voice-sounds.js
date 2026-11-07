// Sound Bridge view (/voice/sounds/<set>): the minimal-pair listening game. Hear a word, choose the word you heard,
// lay a plank. Untimed; replay as often as you like; a miss sends the pair back in line with a side-by-side listen.
import { SOUND_SETS } from "../content/voice-lab.js";
import { choose, currentRound, isWon, newGame, roundWords } from "../lang/sound-bridge.js";
import { canSpeak, speak } from "../speech.js";
import { announce, html, icon } from "../util.js";
import { loadVoice, saveVoice, voiceCrumbs, voiceHref } from "./voice-common.js";

const games = new Map(); // set id → game (this tab)
export const findSoundSet = (id) => SOUND_SETS.find((s) => s.id === id) || null;
const gameFor = (set) => {
  if (!games.has(set.id)) games.set(set.id, newGame(set));
  return games.get(set.id);
};

function bridgeHTML(game, I) {
  return html`<div
      class="sb-bridge"
      role="img"
      aria-label="${I.S(`Bridge: ${game.placed} of ${game.goal} planks laid`, `Puente: ${game.placed} de ${game.goal} tablas colocadas`)}"
    >
      <span class="sb-bank" aria-hidden="true"></span>
      ${Array.from({ length: game.goal }, (_, i) => html`<span class="sb-plank ${i < game.placed ? "is-laid" : ""}" aria-hidden="true"></span>`)}
      <span class="sb-bank is-far" aria-hidden="true"></span>
    </div>
    <p class="sb-count" aria-live="polite">
      ${I.T(`Planks laid: ${game.placed} of ${game.goal}`, `Tablas colocadas: ${game.placed} de ${game.goal}`)}
    </p>`;
}

function lastHTML(set, game, I) {
  const last = game.last;
  if (!last) return "";
  const words = roundWords(set, { pair: last.pair });
  if (last.correct)
    return html`<p class="feedback is-right" role="status">
      ${icon("check")}
      ${I.T(`Yes, you heard “${words[last.target].word}”. A plank is laid.`, `Sí, escuchaste “${words[last.target].word}”. Se colocó una tabla.`)}
    </p>`;
  return html`<div class="feedback is-wrong sb-contrast" role="status">
    <p>
      ${I.T(`Close! That word was “${words[last.target].word}”, not “${words[last.choice].word}”. This pair comes back later. Listen to both:`, `¡Casi! Esa palabra era “${words[last.target].word}”, no “${words[last.choice].word}”. Este par vuelve más tarde. Escucha las dos:`)}
    </p>
    <div class="row-actions">
      ${words.map((w) => html`<button type="button" class="btn small" data-sb-hear="${w.word}">${icon("volume")} <span lang="en">${w.word}</span></button>`)}
    </div>
    <p class="fine">${I.T(...set.tip)}</p>
  </div>`;
}

export function soundsHTML(ctx, I, id) {
  const set = findSoundSet(id);
  if (!set) return null;
  const game = gameFor(set);
  const round = currentRound(game);
  const title = I.T(`Sound Bridge: ${set.title}`, `Puente de sonidos: ${set.titleEs}`);
  const wins = loadVoice().sounds?.[set.id] || 0;
  return {
    title: I.S(`Sound Bridge: ${set.title}`, `Puente de sonidos: ${set.titleEs}`),
    html: html`${voiceCrumbs(I, ctx.band, title)}
      <article class="activity voice-page sound-bridge d-listening">
        <header class="act-head">
          <p class="act-context">
            ${icon("listening")}
            ${I.T("Listening game · minimal pairs", "Juego de escucha · pares mínimos")}
          </p>
          <h1 tabindex="-1">${title}</h1>
          <p class="lead">
            ${I.T("Lay every plank to cross the river. Hear a word, then step on the word you heard. Take your time: there is no clock, and a miss never removes a plank.", "Coloca todas las tablas para cruzar el río. Escucha una palabra y pisa la palabra que oíste. Tómate tu tiempo: no hay reloj y un error nunca quita una tabla.")}
          </p>
          ${wins ? html`<p class="fine">${icon("check")} ${I.T(`Bridges finished with this set: ${wins}`, `Puentes terminados con este grupo: ${wins}`)}</p>` : ""}
        </header>
        ${bridgeHTML(game, I)} ${lastHTML(set, game, I)}
        ${
          isWon(game)
            ? html`<section class="panel voice-done" role="status">
                <p>
                  <strong>${I.T("You crossed the river!", "¡Cruzaste el río!")}</strong>
                  ${game.again ? I.T(`You practiced ${game.again} ${game.again === 1 ? "pair" : "pairs"} a second time on the way.`, `En el camino practicaste ${game.again} ${game.again === 1 ? "par" : "pares"} otra vez.`) : I.T("Every word on the first listen.", "Todas las palabras a la primera.")}
                </p>
                <div class="row-actions">
                  <button type="button" class="btn btn-primary" data-sb-new>
                    ${icon("retry")} ${I.T("Build a new bridge", "Construir un puente nuevo")}
                  </button>
                  <a class="btn" href="${voiceHref("", ctx.band)}#voice-sounds"
                    >${I.T("Choose other sounds", "Elegir otros sonidos")}</a
                  >
                </div>
              </section>`
            : html`<section class="panel sb-round" aria-labelledby="sb-q">
                <h2 id="sb-q">
                  ${I.T(`Plank ${game.placed + 1}: which word do you hear?`, `Tabla ${game.placed + 1}: ¿qué palabra escuchas?`)}
                </h2>
                ${
                  canSpeak()
                    ? html`<button type="button" class="btn btn-primary btn-big" data-sb-play>
                        ${icon("volume")} ${I.T("Hear the word", "Escuchar la palabra")}
                      </button>`
                    : html`<p class="note-todo">
                        ${I.T("Read-aloud is not available in this browser. Ask a partner to say one of the two words.", "La lectura en voz alta no está disponible en este navegador. Pide a un compañero que diga una de las dos palabras.")}
                      </p>`
                }
                <div
                  class="sb-stones"
                  role="group"
                  aria-label="${I.S("Choose the word you heard", "Elige la palabra que escuchaste")}"
                >
                  ${roundWords(set, round).map(
                    (w, i) =>
                      html`<button type="button" class="sb-stone" data-sb-choose="${i}">
                        <strong lang="en">${w.word}</strong
                        ><span class="fine" lang="en">${w.meaning}</span>
                      </button>`,
                  )}
                </div>
              </section>`
        }
        <details class="studio-disc">
          <summary>
            ${icon("bulb")} ${I.T("How to make these sounds", "Cómo hacer estos sonidos")}
          </summary>
          <div class="disc-body"><p>${I.T(...set.tip)}</p></div>
        </details>
      </article>`,
  };
}

const sayWord = (word, ctx) => speak([word, word], { rate: Math.min(ctx.prefs?.rate || 0.9, 0.9) });

export function soundsClick(e, ctx, I, id) {
  const set = findSoundSet(id);
  if (!set) return false;
  const game = gameFor(set);
  const t = e.target;
  if (t.closest("[data-sb-play]")) {
    const round = currentRound(game);
    if (round) sayWord(roundWords(set, round)[round.target].word, ctx);
    return true;
  }
  const hear = t.closest("[data-sb-hear]");
  if (hear) {
    sayWord(hear.dataset.sbHear, ctx);
    return true;
  }
  const pick = t.closest("[data-sb-choose]");
  if (pick) {
    const result = choose(game, Number(pick.dataset.sbChoose));
    if (result && isWon(game)) {
      const state = loadVoice();
      state.sounds ||= {};
      state.sounds[set.id] = (Number(state.sounds[set.id]) || 0) + 1;
      saveVoice(state);
      announce(I.S("You crossed the river!", "¡Cruzaste el río!"));
    } else if (result)
      announce(
        result.correct
          ? I.S("A plank is laid.", "Se colocó una tabla.")
          : I.S("Close. Listen to both words.", "Casi. Escucha las dos palabras."),
      );
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-sb-new]")) {
    games.set(set.id, newGame(set));
    ctx.rerender();
    return true;
  }
  return false;
}
