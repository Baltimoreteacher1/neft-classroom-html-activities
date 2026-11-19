// Rhyme & Rhythm Pond (/early/rhyme): phonological awareness games for K–2.
// Two modes:
//   1. Rhyme Hop: hear a word, tap the picture that rhymes to hop the frog across the pond.
//   2. Clap the Beats: hear a word, tap 1, 2, or 3 beats to count its syllables.
// Zero timers, zero points lost; wrong choices stay available and replay the target sound.
import { BAND_INFO } from "../bands.js";
import { PONDS, RHYME_SETS, SYLLABLE_WORDS } from "../content/early.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { BASE, announce, html, icon, raw, storage } from "../util.js";

const KEY = "accessPracticeLab:v1:early-rhyme";

const load = () => {
  try {
    return JSON.parse(storage.get(KEY) || "{}") || {};
  } catch {
    return {};
  }
};
const save = (s) => storage.set(KEY, JSON.stringify(s));

let st = {
  mode: "rhyme", // "rhyme" | "syllables"
  setId: RHYME_SETS[0].id,
  idx: 0,
  sylIdx: 0,
  state: "idle", // "idle" | "right" | "again"
  won: false,
};

function shuffledOptions(item) {
  const all = [
    { word: item.match[0], pic: item.match[1], right: true },
    ...item.others.map(([word, pic]) => ({ word, pic, right: false })),
  ];
  let seed = [...item.target[0]].reduce((h, c) => (h * 33 + c.charCodeAt(0)) >>> 0, 7);
  for (let i = all.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

function pondProgressHTML(total, doneCount, I) {
  return html`<ol
    class="early-garden early-pond"
    aria-label="${I.S(`Pond: ${doneCount} of ${total} lily pads`, `Estanque: ${doneCount} de ${total} nenúfares`)}"
  >
    ${Array.from({ length: total }, (_, i) => {
      const done = i < doneCount;
      return html`<li class="${done ? "is-grown" : ""}">
        <span aria-hidden="true">${done ? PONDS.frog : PONDS.pad}</span>
        <span class="visually-hidden"
          >${done ? I.S("Frog hopped", "La rana saltó") : I.S("Waiting", "Esperando")}</span
        >
      </li>`;
    })}
  </ol>`;
}

export function render(ctx, I) {
  const info = BAND_INFO[ctx.band] || {};
  const saved = load();
  const round = RHYME_SETS.find((r) => r.id === st.setId) || RHYME_SETS[0];
  const doneWords = new Set(saved.rhymes?.[round.id] || []);
  const sylDone = new Set(saved.syllables || []);

  const head = html`<header class="early-head">
    <p class="eyebrow">
      ${I.T("Phonological awareness", "Conciencia fonológica")} ·
      ${I.T(info.label || "", info.labelEs || "")}
    </p>
    <h1 id="rhymeTitle" tabindex="-1">${I.T("Rhyme & Rhythm Pond", "Estanque de rimas y ritmo")}</h1>
    <p>
      ${st.mode === "rhyme"
        ? I.T(
            "Listen to the word, then tap the picture that rhymes with it. Help the frog hop across the pond!",
            "Escucha la palabra y toca el dibujo que rima con ella. ¡Ayuda a la rana a cruzar el estanque!",
          )
        : I.T(
            "Listen to the word and clap the beats. How many syllables do you hear?",
            "Escucha la palabra y aplaude los golpes. ¿Cuántas sílabas escuchas?",
          )}
    </p>
    <p class="early-switch">
      <a class="btn small" href="${BASE}/early?grades=${info.picker || ctx.band}"
        >${I.T("My practice home", "Mi página de práctica")}</a
      >
      <button
        type="button"
        class="btn small ${st.mode === "rhyme" ? "btn-primary" : ""}"
        data-ry-mode="rhyme"
        aria-pressed="${st.mode === "rhyme"}"
      >
        ${I.T("Rhyme Hop", "Salto de rimas")}
      </button>
      <button
        type="button"
        class="btn small ${st.mode === "syllables" ? "btn-primary" : ""}"
        data-ry-mode="syllables"
        aria-pressed="${st.mode === "syllables"}"
      >
        ${I.T("Clap the Beats", "Aplaude las sílabas")}
      </button>
    </p>
  </header>`;

  if (st.mode === "syllables") {
    const item = SYLLABLE_WORDS[st.sylIdx % SYLLABLE_WORDS.length];
    const [word, count, pic, parts] = item;
    return {
      title: I.S("Rhyme & Rhythm Pond", "Estanque de rimas y ritmo"),
      html: html`<article class="early-rhyme" aria-labelledby="rhymeTitle">
        ${head}
        <section class="early-ph-board">
          <p class="early-ph-pic" aria-hidden="true">${pic}</p>
          <p class="early-rhyme-target" lang="en">${word}</p>
          <p class="early-actions">
            <button type="button" class="btn btn-primary early-big" data-ry-hear-syl>
              ${icon("volume")} ${I.T("Hear the word", "Escuchar la palabra")}
            </button>
          </p>
          <div
            class="early-beats"
            role="group"
            aria-label="${I.S("How many beats?", "¿Cuántos golpes?")}"
          >
            ${[1, 2, 3].map(
              (n) => html`<button
                type="button"
                class="btn early-big early-beat-btn"
                data-ry-beat="${n}"
              >
                <span class="early-beat-num">${n}</span>
                <span>${n === 1 ? I.T("1 beat", "1 golpe") : I.T(`${n} beats`, `${n} golpes`)}</span>
              </button>`,
            )}
          </div>
          ${st.state === "right"
            ? html`<div class="early-feedback is-right" role="status">
                  <p>
                    <strong>${I.T(`Yes! ${parts}`, `¡Sí! ${parts}`)}</strong>
                    ${I.T(`(${count} ${count === 1 ? "beat" : "beats"})`, `(${count} ${count === 1 ? "golpe" : "golpes"})`)}
                  </p>
                </div>
                <p class="early-actions">
                  <button type="button" class="btn btn-primary early-big" data-ry-next-syl>
                    ${I.T("Next word", "Siguiente palabra")} ${icon("arrow-right")}
                  </button>
                </p>`
            : st.state === "again"
              ? html`<div class="early-feedback is-again" role="status">
                  <p>
                    ${I.T(
                      "Clap along slowly as you say the word, then try again!",
                      "Aplaude despacio mientras dices la palabra y vuelve a intentarlo.",
                    )}
                  </p>
                </div>`
              : ""}
        </section>
        <p class="fine early-honest">
          ${I.T(
            `${sylDone.size} of ${SYLLABLE_WORDS.length} words clapped on this device.`,
            `${sylDone.size} de ${SYLLABLE_WORDS.length} palabras aplaudidas en este dispositivo.`,
          )}
        </p>
      </article>`,
    };
  }

  const items = round.items;
  const current = items[st.idx % items.length];
  const opts = shuffledOptions(current);

  return {
    title: I.S("Rhyme & Rhythm Pond", "Estanque de rimas y ritmo"),
    html: html`<article class="early-rhyme" aria-labelledby="rhymeTitle">
      ${head}
      <div class="early-decks" role="group" aria-label="${I.S("Ponds", "Estanques")}">
        ${RHYME_SETS.map(
          (r) => html`<button
            type="button"
            class="btn small"
            data-ry-set="${r.id}"
            aria-pressed="${r.id === round.id}"
          >
            ${I.T(r.title[0], r.title[1])}
          </button>`,
        )}
      </div>
      ${pondProgressHTML(items.length, doneWords.size, I)}
      ${st.won
        ? html`<section class="early-feedback is-right" role="status">
              <p>
                <strong>${I.T("The frog crossed the whole pond!", "¡La rana cruzó todo el estanque!")}</strong>
                ${I.T("You matched every rhyme in this pond.", "Emparejaste todas las rimas de este estanque.")}
              </p>
            </section>
            <p class="early-actions">
              <button type="button" class="btn btn-primary early-big" data-ry-again>
                ${I.T("Play this pond again", "Jugar este estanque otra vez")}
              </button>
            </p>`
        : html`<section class="early-ph-board">
            <p class="eyebrow">${I.T("Find the word that rhymes with", "Busca la palabra que rima con")}</p>
            <p class="early-ph-pic" aria-hidden="true">${current.target[1]}</p>
            <p class="early-rhyme-target" lang="en">${current.target[0]}</p>
            <p class="early-actions">
              <button type="button" class="btn btn-primary early-big" data-ry-hear-target>
                ${icon("volume")} ${I.T(`Hear "${current.target[0]}"`, `Escuchar "${current.target[0]}"`)}
              </button>
            </p>
            <div
              class="early-rhyme-grid"
              role="group"
              aria-label="${I.S("Rhyme choices", "Opciones de rima")}"
            >
              ${opts.map(
                (o) => html`<div class="early-choice">
                  <button
                    type="button"
                    class="early-pick"
                    data-ry-pick="${o.right ? "1" : "0"}"
                    data-ry-word="${o.word}"
                  >
                    <span class="early-emoji" aria-hidden="true">${o.pic}</span>
                    <span class="early-card-en" lang="en">${o.word}</span>
                  </button>
                  <button
                    type="button"
                    class="early-hear"
                    data-ry-say="${o.word}"
                    aria-label="${I.S(`Hear ${o.word}`, `Escuchar ${o.word}`)}"
                  >
                    ${icon("volume")}
                  </button>
                </div>`,
              )}
            </div>
            ${st.state === "right"
              ? html`<div class="early-feedback is-right" role="status">
                    <p>
                      <strong>${I.T(
                        `Yes! ${current.target[0]} and ${current.match[0]} rhyme!`,
                        `¡Sí! ¡${current.target[0]} y ${current.match[0]} riman!`,
                      )}</strong>
                    </p>
                  </div>
                  <p class="early-actions">
                    <button type="button" class="btn btn-primary early-big" data-ry-next>
                      ${I.T("Hop to next word", "Saltar a la siguiente palabra")} ${icon("arrow-right")}
                    </button>
                  </p>`
              : st.state === "again"
                ? html`<div class="early-feedback is-again" role="status">
                    <p>
                      ${I.T(
                        "Listen to the ending sound and try another picture!",
                        "Escucha el sonido final y prueba con otro dibujo.",
                      )}
                    </p>
                  </div>`
                : ""}
          </section>`}
    </article>`,
  };
}

export function onClick(e, ctx, I) {
  const t = e.target;
  const rate = ctx.prefs.rate || 0.85;
  const round = RHYME_SETS.find((r) => r.id === st.setId) || RHYME_SETS[0];

  const modeBtn = t.closest("[data-ry-mode]");
  if (modeBtn) {
    st.mode = modeBtn.dataset.ryMode;
    st.state = "idle";
    ctx.rerender();
    return true;
  }
  const setBtn = t.closest("[data-ry-set]");
  if (setBtn) {
    st.setId = setBtn.dataset.rySet;
    st.idx = 0;
    st.state = "idle";
    st.won = false;
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-ry-hear-target]")) {
    const cur = round.items[st.idx % round.items.length];
    speak(cur.target[0], { rate, persona: "guide" });
    return true;
  }
  const sayBtn = t.closest("[data-ry-say]");
  if (sayBtn) {
    speak(sayBtn.dataset.rySay, { rate });
    return true;
  }
  const pickBtn = t.closest("[data-ry-pick]");
  if (pickBtn) {
    const cur = round.items[st.idx % round.items.length];
    const ok = pickBtn.dataset.ryPick === "1";
    if (ok) {
      st.state = "right";
      const s = load();
      const prev = new Set(s.rhymes?.[round.id] || []);
      prev.add(cur.target[0]);
      save({ ...s, rhymes: { ...(s.rhymes || {}), [round.id]: [...prev] } });
      speak([cur.target[0], cur.match[0]], { rate, persona: "guide" });
      announce(I.S(`${cur.target[0]} and ${cur.match[0]} rhyme!`, `¡${cur.target[0]} y ${cur.match[0]} riman!`));
    } else {
      st.state = "again";
      speak([pickBtn.dataset.ryWord, cur.target[0]], { rate });
      announce(I.S("Try another picture.", "Prueba otro dibujo."));
    }
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-ry-next]")) {
    if (st.idx + 1 >= round.items.length) {
      st.won = true;
    } else {
      st.idx += 1;
      st.state = "idle";
    }
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-ry-again]")) {
    const s = load();
    save({ ...s, rhymes: { ...(s.rhymes || {}), [round.id]: [] } });
    st.idx = 0;
    st.state = "idle";
    st.won = false;
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-ry-hear-syl]")) {
    const [word] = SYLLABLE_WORDS[st.sylIdx % SYLLABLE_WORDS.length];
    speak(word, { rate: 0.78, persona: "guide" });
    return true;
  }
  const beatBtn = t.closest("[data-ry-beat]");
  if (beatBtn) {
    const [word, count] = SYLLABLE_WORDS[st.sylIdx % SYLLABLE_WORDS.length];
    if (Number(beatBtn.dataset.ryBeat) === count) {
      st.state = "right";
      const s = load();
      const prev = new Set(s.syllables || []);
      prev.add(word);
      save({ ...s, syllables: [...prev] });
      speak(word, { rate: 0.75 });
      announce(I.S("Great clapping!", "¡Muy bien aplaudido!"));
    } else {
      st.state = "again";
      speak(word, { rate: 0.72 });
      announce(I.S("Try again.", "Inténtalo otra vez."));
    }
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-ry-next-syl]")) {
    st.sylIdx = (st.sylIdx + 1) % SYLLABLE_WORDS.length;
    st.state = "idle";
    ctx.rerender();
    return true;
  }
  return false;
}

export const unmount = () => stopSpeech();
