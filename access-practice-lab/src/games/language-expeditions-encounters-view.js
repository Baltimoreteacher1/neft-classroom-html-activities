// Language Expeditions encounters views: the obstacle prompt and the character talk inside the walk panel, the word
// card shown when a word collectible is picked up, the word bag at each gate and at the summary, and the "where you
// are standing" crop for the speaking stop that uses the world. Pure functions of state (language-expeditions-
// encounters.js owns the rules). Every control is a native button; the drawings are decorative.
import { audioBtn, feedbackHTML, glossHTML, hintHTML, html, icon, raw, settled } from "./engine.js";
import { charX, portrait, wordPic } from "./language-expeditions-encounters-art.js";

const say = (I, o) => (o ? I.T(o.en, o.es) : "");
export const encOf = (env) =>
  (env.content.lands ? env.content : env.content.bands?.[env.band])?.encounters || null;
/** Old saves have no encounter state; everything here is optional, so it is filled in lazily. */
export function encState(s) {
  if (!s.enc || typeof s.enc !== "object") s.enc = {};
  const e = s.enc;
  if (!Array.isArray(e.cleared)) e.cleared = [];
  if (!Array.isArray(e.words)) e.words = [];
  if (!Array.isArray(e.talked)) e.talked = [];
  if (!Number.isInteger(e.meet)) e.meet = -1;
  e.ob ||= null;
  e.talk ||= null;
  e.card ||= null;
  return e;
}
export const TALK_NEAR = 240;
export const nearChar = (s) => Math.abs(s.x - charX(s.land)) < TALK_NEAR;
const pickCls = (rs, i, answer) =>
  `${rs.picks.includes(i) && i !== answer ? " is-miss" : ""}${settled(rs) && i === answer ? " is-right" : ""}`;

/** Spoken words follow the support mode, like the Listening stops: A shows them, B one tap away, C audio only. */
function heardHTML(text, open, attr, env) {
  const I = env.I;
  const sup = env.support || "A";
  if (sup === "A" || open)
    return html`<div class="lexp-transcript">
      <p lang="en">“${text.en}”</p>
      ${sup === "C" ? "" : glossHTML(text.es, env)}
    </div>`;
  if (sup === "B")
    return html`<button type="button" class="btn small" ${raw(attr)}>
      ${icon("reading")}${I.T("Show the words", "Mostrar las palabras")}
    </button>`;
  return html`<p class="fine">
    ${I.T("Audio only. The words appear after you answer.", "Solo audio. Las palabras aparecen después de responder.")}
  </p>`;
}

function optionsHTML(opts, rs, answer, attr, env) {
  const lock = settled(rs) ? "disabled" : "";
  return html`<div class="lexp-opts" role="group">
    ${opts.map(
      (o, i) =>
        html`<div class="lexp-opt">
          <button
            type="button"
            class="lexp-opt-t${pickCls(rs, i, answer)}"
            ${raw(`${attr}="${i}"`)}
            ${lock}
          >
            <span class="lexp-opt-w"
              ><span lang="en">${o.en}</span
              >${env.sup.gloss === "show" ? html`<span class="gs-gloss" lang="es">${o.es}</span>` : ""}</span
            >
          </button>
        </div>`,
    )}
  </div>`;
}

function keysHTML(O, ob, env) {
  const I = env.I;
  if (!O.keys?.length) return "";
  const list = html`<ul class="lexp-keys" aria-label="${I.S("Key words", "Palabras clave")}">
    ${O.keys.map((k) => html`<li><strong lang="en">${k.en}</strong><span lang="es">${k.es}</span></li>`)}
  </ul>`;
  if (env.sup.gloss === "show" || ob.keys) return list;
  if (env.sup.gloss === "tap")
    return html`<details class="lexp-keys-tap">
      <summary>${icon("words")}${I.T("Key words in Spanish", "Palabras clave en español")}</summary>
      ${list}
    </details>`;
  return html`<button type="button" class="btn small" data-lexp-ob-keys>
    ${icon("help")}${I.T("Show key words", "Mostrar palabras clave")}
  </button>`;
}

export function obstacleHTML(O, ob, cleared, env) {
  const I = env.I;
  const rs = ob.rs;
  const judged = O.kind === "listen" || O.kind === "read" || O.kind === "write";
  let body = "";
  if (O.kind === "listen")
    body = html`<div class="lexp-listen">
        <button type="button" class="btn btn-primary" data-lexp-ob-play>
          ${icon("listening")}${ob.plays || env.sup.audio === "auto" ? I.T("Play it again", "Escuchar otra vez") : I.T("Listen", "Escuchar")}
        </button>
        ${heardHTML(O.say, ob.tx || settled(rs), "data-lexp-ob-tx", env)}
      </div>
      <p class="lexp-question">${say(I, O.question)}</p>
      ${optionsHTML(O.options, rs, O.answer, "data-lexp-ob-pick", env)}`;
  else if (O.kind === "read")
    body = html`<blockquote class="lexp-passage is-sign" lang="en">${O.sign}</blockquote>
      ${keysHTML(O, ob, env)}
      <p class="lexp-question">${say(I, O.question)}</p>
      ${optionsHTML(O.options, rs, O.answer, "data-lexp-ob-pick", env)}`;
  else if (O.kind === "say")
    body = html`<p class="gs-frame">
        <span class="gs-frame-l">${I.T("Say this", "Di esto")}</span>
        <span lang="en">${O.frame.en}</span>
      </p>
      ${glossHTML(O.frame.es, env)}${audioBtn(O.frame.en, I, I.S("Hear the sentence", "Escuchar la oración"))}
      ${
        cleared
          ? ""
          : html`<p class="fine">
                ${I.T("Nobody scores this. Say it out loud, then press the button.", "Nadie lo califica. Dilo en voz alta y luego pulsa el botón.")}
              </p>
              <div class="gs-actions">
                <button type="button" class="btn btn-primary" data-lexp-ob-said>
                  ${icon("check")}${I.T("I said it", "Lo dije")}
                </button>
              </div>`
      }`;
  else
    body = html`<p class="lexp-prompt">${say(I, O.prompt)}</p>
      <label class="gs-label" for="lexp-ob-text">${I.T("My answer", "Mi respuesta")}</label>
      <input
        id="lexp-ob-text"
        class="lexp-ob-input"
        type="text"
        data-lexp-ob-text
        maxlength="60"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        lang="en"
        value="${ob.text || ""}"
        ${settled(rs) ? "disabled" : ""}
      />
      ${
        settled(rs)
          ? ""
          : html`<div class="gs-actions">
              <button type="button" class="btn btn-primary" data-lexp-ob-check>
                ${icon("check")}${I.T("Check", "Comprobar")}
              </button>
            </div>`
      }`;
  const answer = O.kind === "write" ? O.accept[0] : O.options ? say(I, O.options[O.answer]) : "";
  return html`<section class="lexp-ob-panel" aria-labelledby="lexp-ob-head">
    <h3 class="lexp-ob-head" id="lexp-ob-head" tabindex="-1">
      ${icon(cleared ? "check" : "lock")}${cleared ? I.T(`Cleared: ${O.name.en}`, `Despejado: ${O.name.es}`) : I.T(`The trail is blocked: ${O.name.en}`, `El sendero está bloqueado: ${O.name.es}`)}
    </h3>
    ${cleared ? "" : html`<p class="lexp-guide">${say(I, O.intro)}</p>`} ${body}
    ${judged ? hintHTML(rs, [say(I, O.hint)], env, { disabled: settled(rs) }) : ""}
    ${judged ? feedbackHTML(rs, { I, right: say(I, O.done), retry: I.T("Try again. You can open a hint.", "Inténtalo otra vez. Puedes abrir una pista."), answer, explain: say(I, O.explain) }) : ""}
    ${
      cleared
        ? html`${judged ? "" : html`<p class="lexp-ob-done" role="status">${say(I, O.done)}</p>`}
            <div class="gs-actions">
              <button type="button" class="btn" data-lexp-ob-close>
                ${icon("arrow-right")}${I.T("Back to the trail", "Volver al sendero")}
              </button>
            </div>`
        : ""
    }
  </section>`;
}

export function talkHTML(C, talk, env, b) {
  const I = env.I;
  const turn = C.turns[talk.t];
  const last = talk.t + 1 === C.turns.length;
  const done = turn.kind === "say" ? talk.said : settled(talk.rs);
  return html`<section class="lexp-talk" aria-labelledby="lexp-talk-head">
    <div class="lexp-talk-top">
      ${raw(portrait(b, C.land))}
      <div>
        <p class="lexp-tag">
          ${I.T(`Talk · turn ${talk.t + 1} of ${C.turns.length}`, `Conversación · turno ${talk.t + 1} de ${C.turns.length}`)}
        </p>
        <h3 class="lexp-talk-head" id="lexp-talk-head" tabindex="-1">
          ${I.T(`${C.name.en[0].toUpperCase()}${C.name.en.slice(1)} says:`, `${C.name.es[0].toUpperCase()}${C.name.es.slice(1)} dice:`)}
        </h3>
      </div>
    </div>
    <button type="button" class="btn small" data-lexp-talk-play>
      ${icon("volume")}${I.T("Hear it", "Escuchar")}
    </button>
    ${heardHTML(turn.line, talk.tx || done, "data-lexp-talk-tx", env)}
    ${
      turn.kind === "say"
        ? html`<p class="lexp-question">
              ${I.T("Your turn: say this out loud.", "Tu turno: dilo en voz alta.")}
            </p>
            <p class="gs-frame"><span lang="en">${turn.frame.en}</span></p>
            ${glossHTML(turn.frame.es, env)}${audioBtn(turn.frame.en, I, I.S("Hear the sentence", "Escuchar la oración"))}
            ${
              talk.said
                ? html`<p class="lexp-ob-done" role="status">
                    ${I.T("Thanks for talking! This is practice, not a score.", "¡Gracias por conversar! Esto es práctica, no una calificación.")}
                  </p>`
                : html`<div class="gs-actions">
                    <button type="button" class="btn btn-primary" data-lexp-talk-said>
                      ${icon("check")}${I.T("I said it", "Lo dije")}
                    </button>
                  </div>`
            }`
        : html`<p class="lexp-question">${I.T("Choose your reply.", "Elige tu respuesta.")}</p>
            ${optionsHTML(turn.options, talk.rs, turn.answer, "data-lexp-talk-pick", env)}
            ${hintHTML(talk.rs, [say(I, turn.hint)], env, { disabled: done })}
            ${feedbackHTML(talk.rs, { I, right: I.T("That reply fits.", "Esa respuesta encaja."), retry: I.T("Listen again: what did they ask?", "Escucha otra vez: ¿qué te preguntaron?"), answer: say(I, turn.options[turn.answer]), explain: say(I, turn.explain) })}`
    }
    <div class="gs-actions">
      ${done ? html`<button type="button" class="btn btn-primary" data-lexp-talk-next>${icon(last ? "wave" : "arrow-right")}${last ? I.T("Say goodbye", "Despedirte") : I.T("Next turn", "Siguiente turno")}</button>` : ""}
      ${last && done ? "" : html`<button type="button" class="btn" data-lexp-talk-end>${icon("close")}${I.T("Stop talking", "Dejar de conversar")}</button>`}
    </div>
  </section>`;
}

export function wordCardHTML(w, I) {
  return html`<div class="lexp-wcard">
    ${raw(wordPic(w.art))}
    <div class="lexp-wcard-t">
      <p class="lexp-tag">
        ${icon("words")}${I.T("You found a word card", "Encontraste una tarjeta de palabra")}
      </p>
      <p class="lexp-wcard-w">
        <strong lang="en">${w.en}</strong> · <span lang="es">${w.es}</span>
      </p>
      <p class="lexp-wcard-d">${I.T(w.def.en, w.def.es)}</p>
      <div class="lexp-wcard-act">
        ${audioBtn(w.en, I, I.S("Hear the word", "Escuchar la palabra"))}
        <button type="button" class="btn small" data-lexp-card-close>
          ${icon("check")}${I.T("Keep exploring", "Seguir explorando")}
        </button>
      </div>
    </div>
  </div>`;
}

/** What the walk panel adds: the talk or the obstacle prompt, the Talk button and the word-card slot. */
export function walkExtraHTML(s, env, b) {
  const E = encOf(env);
  if (!E) return "";
  const I = env.I;
  const e = encState(s);
  const k = s.land;
  const C = E.characters?.find((c) => c.land === k);
  const O = E.obstacles?.find((o) => o.land === k);
  const talking = e.talk && e.talk.k === k && C;
  let main = "";
  if (talking) main = talkHTML(C, e.talk, env, b);
  else if (e.meet === k && O && e.ob?.k === k)
    main = obstacleHTML(O, e.ob, e.cleared.includes(k), env);
  const card = e.card ? E.words?.find((w) => w.id === e.card) : null;
  return html`${main}
    ${
      C && !talking
        ? html`<button
            type="button"
            class="btn lexp-talk-btn"
            data-lexp-talk="${k}"
            ${nearChar(s) ? "" : "hidden"}
          >
            ${icon("conversation")}${I.T(`Talk to ${C.name.en}`, `Habla con ${C.name.es}`)}
          </button>`
        : ""
    }
    <div class="lexp-wordslot" data-lexp-wordslot aria-live="polite">${card ? wordCardHTML(card, I) : ""}</div>`;
}

/** "Words you found": shown at every gate and at the journey summary. Words are counted, never scored. */
export function wordBagHTML(s, env) {
  const E = encOf(env);
  if (!E?.words?.length) return "";
  const I = env.I;
  const found = E.words.filter((w) => encState(s).words.includes(w.id));
  return html`<section class="lexp-bag" aria-labelledby="lexp-bag-h">
    <h3 id="lexp-bag-h">${icon("words")}${I.T("Words you found", "Palabras que encontraste")}</h3>
    ${
      found.length
        ? html`<ul class="lexp-bag-list">
            ${found.map(
              (w) =>
                html`<li>
                  ${raw(wordPic(w.art))}<span
                    ><strong lang="en">${w.en}</strong> <span lang="es">${w.es}</span></span
                  >
                  ${audioBtn(w.en, I, I.S("Hear the word", "Escuchar la palabra"))}
                </li>`,
            )}
          </ul>`
        : ""
    }
    <p class="fine">
      ${I.T(`${found.length} of ${E.words.length} word cards. Look for the cards marked Aa on the trail.`, `${found.length} de ${E.words.length} tarjetas de palabras. Busca las tarjetas con Aa en el sendero.`)}
    </p>
  </section>`;
}

/** The speaking stop that uses the world: a crop of the live scene (filled in on mount) with a written caption. */
export function cropHTML(a, env) {
  const sc = encOf(env)?.scenes?.[a.id];
  if (!sc) return "";
  const I = env.I;
  return html`<figure class="lexp-crop-fig">
    <div class="lexp-crop" data-lexp-crop aria-hidden="true"></div>
    <figcaption>${icon("pin")}${I.T(sc.caption.en, sc.caption.es)}</figcaption>
  </figure>`;
}
