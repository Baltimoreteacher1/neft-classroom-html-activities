// Sight Word Treasures (/early/sight-words): high-frequency words for Kindergarten, Grade 1, and Grades 2–3.
// Two modes:
//   1. Word Cards: tap a word to hear it, hear it in a real sentence, and mark a star when you know it.
//   2. Treasure Hunt: Pepita says a word; find it among 4 big cards to collect a star.
import { BAND_INFO } from "../bands.js";
import { SIGHT_WORDS } from "../content/early.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { BASE, announce, html, icon, storage } from "../util.js";

const KEY = "accessPracticeLab:v1:early-sight";

const load = () => {
  try {
    return JSON.parse(storage.get(KEY) || "{}") || {};
  } catch {
    return {};
  }
};
const save = (s) => storage.set(KEY, JSON.stringify(s));

let st = {
  mode: "cards", // "cards" | "hunt"
  huntIdx: 0,
  huntState: "idle", // "idle" | "right" | "again"
};

function huntOptions(words, idx) {
  const target = words[idx % words.length];
  const others = words.filter((w) => w[0] !== target[0]);
  const picks = [target];
  for (let i = 0; i < 3 && others.length; i++) {
    picks.push(others[(idx * 5 + i * 3) % others.length]);
  }
  // Deterministic shuffle
  let seed = [...target[0]].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 19);
  for (let i = picks.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  return { target, picks };
}

export function render(ctx, I) {
  const info = BAND_INFO[ctx.band] || {};
  const words = SIGHT_WORDS[ctx.band] || SIGHT_WORDS.K;
  const saved = load();
  const known = new Set(saved[ctx.band] || []);

  const head = html`<header class="early-head">
    <p class="eyebrow">
      ${I.T("High-frequency words", "Palabras de uso frecuente")} ·
      ${I.T(info.label || "", info.labelEs || "")}
    </p>
    <h1 id="sightTitle" tabindex="-1">${I.T("Sight Word Treasures", "Tesoros de palabras")}</h1>
    <p>
      ${st.mode === "cards"
        ? I.T(
            "Tap a word to hear it, hear it in a sentence, and tap the star when you can read it fast.",
            "Toca una palabra para escucharla, oírla en una oración y toca la estrella cuando puedas leerla rápido.",
          )
        : I.T(
            "Listen to Pepita say a word, then tap the matching treasure card!",
            "Escucha la palabra que dice Pepita y toca la tarjeta del tesoro que coincide.",
          )}
    </p>
    <p class="early-switch">
      <a class="btn small" href="${BASE}/early?grades=${info.picker || ctx.band}"
        >${I.T("My practice home", "Mi página de práctica")}</a
      >
      <button
        type="button"
        class="btn small ${st.mode === "cards" ? "btn-primary" : ""}"
        data-sw-mode="cards"
        aria-pressed="${st.mode === "cards"}"
      >
        ${I.T("Explore words", "Explorar palabras")}
      </button>
      <button
        type="button"
        class="btn small ${st.mode === "hunt" ? "btn-primary" : ""}"
        data-sw-mode="hunt"
        aria-pressed="${st.mode === "hunt"}"
      >
        ${I.T("Treasure Hunt game", "Juego Búsqueda del tesoro")}
      </button>
    </p>
  </header>`;

  if (st.mode === "hunt") {
    const { target, picks } = huntOptions(words, st.huntIdx);
    return {
      title: I.S("Sight Word Treasures", "Tesoros de palabras"),
      html: html`<article class="early-sight" aria-labelledby="sightTitle">
        ${head}
        <section class="early-ph-board">
          <p class="eyebrow">
            ${I.T(`Word ${(st.huntIdx % words.length) + 1} of ${words.length}`, `Palabra ${(st.huntIdx % words.length) + 1} de ${words.length}`)}
          </p>
          <p class="early-actions">
            <button type="button" class="btn btn-primary early-big" data-sw-hear-target>
              ${icon("volume")} ${I.T("Hear the sight word", "Escuchar la palabra")}
            </button>
          </p>
          <div
            class="early-sight-hunt-grid"
            role="group"
            aria-label="${I.S("Sight word choices", "Opciones de palabras")}"
          >
            ${picks.map(
              ([w]) => html`<button
                type="button"
                class="btn early-big early-sight-pick"
                data-sw-pick="${w}"
              >
                <span lang="en">${w}</span>
              </button>`,
            )}
          </div>
          ${st.huntState === "right"
            ? html`<div class="early-feedback is-right" role="status">
                  <p>
                    <strong>${I.T(`You found "${target[0]}"!`, `¡Encontraste "${target[0]}"!`)}</strong>
                    ${I.T(target[1], target[2])}
                  </p>
                </div>
                <p class="early-actions">
                  <button type="button" class="btn btn-primary early-big" data-sw-next>
                    ${I.T("Next treasure", "Siguiente tesoro")} ${icon("arrow-right")}
                  </button>
                </p>`
            : st.huntState === "again"
              ? html`<div class="early-feedback is-again" role="status">
                  <p>${I.T("Listen closely and try another card!", "Escucha con atención y prueba otra tarjeta.")}</p>
                </div>`
              : ""}
        </section>
      </article>`,
    };
  }

  return {
    title: I.S("Sight Word Treasures", "Tesoros de palabras"),
    html: html`<article class="early-sight" aria-labelledby="sightTitle">
      ${head}
      <ul class="early-sight-grid">
        ${words.map(([w, en, es]) => {
          const isKnown = known.has(w);
          return html`<li class="early-sight-card ${isKnown ? "is-said" : ""}">
            <button type="button" class="early-sight-word" data-sw-say="${w}" lang="en">
              ${w}
            </button>
            <p class="early-sight-sent" lang="en">${en}</p>
            ${I.spanish || I.bilingual ? html`<p class="fine" lang="es">${es}</p>` : ""}
            <div class="early-sight-actions">
              <button
                type="button"
                class="btn small"
                data-sw-sent="${en}"
                aria-label="${I.S(`Hear ${w} in a sentence`, `Escuchar ${w} en una oración`)}"
              >
                ${icon("volume")} ${I.T("Sentence", "Oración")}
              </button>
              <button
                type="button"
                class="early-star"
                data-sw-star="${w}"
                aria-pressed="${isKnown}"
                aria-label="${I.S(`I know ${w}`, `Ya sé ${w}`)}"
              >
                ${icon("star")}
              </button>
            </div>
          </li>`;
        })}
      </ul>
      <p class="fine early-honest">
        ${I.T(
          `${known.size} of ${words.length} stars collected on this device.`,
          `${known.size} de ${words.length} estrellas reunidas en este dispositivo.`,
        )}
      </p>
    </article>`,
  };
}

export function onClick(e, ctx, I) {
  const t = e.target;
  const rate = ctx.prefs.rate || 0.85;
  const words = SIGHT_WORDS[ctx.band] || SIGHT_WORDS.K;

  const modeBtn = t.closest("[data-sw-mode]");
  if (modeBtn) {
    st.mode = modeBtn.dataset.swMode;
    st.huntState = "idle";
    ctx.rerender();
    if (st.mode === "hunt") {
      const { target } = huntOptions(words, st.huntIdx);
      speak(target[0], { rate, persona: "guide" });
    }
    return true;
  }
  const sayBtn = t.closest("[data-sw-say]");
  if (sayBtn) {
    speak(sayBtn.dataset.swSay, { rate, persona: "guide" });
    return true;
  }
  const sentBtn = t.closest("[data-sw-sent]");
  if (sentBtn) {
    speak(sentBtn.dataset.swSent, { rate, persona: "guide" });
    return true;
  }
  const starBtn = t.closest("[data-sw-star]");
  if (starBtn) {
    const s = load();
    const known = new Set(s[ctx.band] || []);
    const w = starBtn.dataset.swStar;
    if (known.has(w)) known.delete(w);
    else known.add(w);
    save({ ...s, [ctx.band]: [...known] });
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-sw-hear-target]")) {
    const { target } = huntOptions(words, st.huntIdx);
    speak(target[0], { rate, persona: "guide" });
    return true;
  }
  const pickBtn = t.closest("[data-sw-pick]");
  if (pickBtn) {
    const { target } = huntOptions(words, st.huntIdx);
    if (pickBtn.dataset.swPick === target[0]) {
      st.huntState = "right";
      const s = load();
      const known = new Set(s[ctx.band] || []);
      known.add(target[0]);
      save({ ...s, [ctx.band]: [...known] });
      speak([target[0], target[1]], { rate, persona: "guide" });
      announce(I.S(`Found ${target[0]}!`, `¡Encontraste ${target[0]}!`));
    } else {
      st.huntState = "again";
      speak(target[0], { rate, persona: "guide" });
      announce(I.S("Try again.", "Inténtalo otra vez."));
    }
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-sw-next]")) {
    st.huntIdx = (st.huntIdx + 1) % words.length;
    st.huntState = "idle";
    ctx.rerender();
    const { target } = huntOptions(words, st.huntIdx);
    speak(target[0], { rate, persona: "guide" });
    return true;
  }
  return false;
}

export const unmount = () => stopSpeech();
