// Systematic Phonics Progression: Level 1 (CVC & Short Vowels) -> Level 2 (Digraphs & Blends) -> Level 3 (Silent-e & Vowel Teams)
// Interactive Word-Builder & Press-the-Sound-Buttons with inline SVG picture cues, TTS, and zero timers.

import { i18nFor } from "../i18n.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { announce, BASE, html, icon, raw, safeJson, storage } from "../util.js";

const KEY = "accessPracticeLab:v1:phonics-progression";

export const PHONICS_LEVELS = [
  {
    id: "cvc",
    level: 1,
    title: ["Level 1: CVC & Short Vowels", "Nivel 1: CVC y vocales cortas"], // ES-REVIEW
    desc: ["Tap each sound button, then blend the sounds to build each word.", "Toca cada botón de sonido y luego une los sonidos para formar cada palabra."], // ES-REVIEW
    words: [
      { word: "cat", graphemes: ["c", "a", "t"], es: "gato", svg: `<circle cx="32" cy="34" r="16" fill="#f2c15b" stroke="#17324d" stroke-width="2.5"/><polygon points="18,22 22,10 30,20" fill="#f2c15b" stroke="#17324d" stroke-width="2.5"/><polygon points="46,22 42,10 34,20" fill="#f2c15b" stroke="#17324d" stroke-width="2.5"/><circle cx="26" cy="32" r="2.5" fill="#17324d"/><circle cx="38" cy="32" r="2.5" fill="#17324d"/><path d="M28 40q4 3 8 0" fill="none" stroke="#17324d" stroke-width="2"/>` },
      { word: "sun", graphemes: ["s", "u", "n"], es: "sol", svg: `<circle cx="32" cy="32" r="13" fill="#f2c15b" stroke="#17324d" stroke-width="2.5"/><path d="M32 10v6M32 48v6M10 32h6M48 32h6M16 16l4 4M44 44l4 4M48 16l-4 4M20 44l-4 4" stroke="#17324d" stroke-width="2.5" stroke-linecap="round"/>` },
      { word: "bed", graphemes: ["b", "e", "d"], es: "cama", svg: `<rect x="10" y="30" width="44" height="16" rx="4" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5"/><rect x="14" y="22" width="14" height="8" rx="3" fill="#1fa6a2" stroke="#17324d" stroke-width="2"/><path d="M12 46v6M52 46v6" stroke="#17324d" stroke-width="3" stroke-linecap="round"/>` },
      { word: "pig", graphemes: ["p", "i", "g"], es: "cerdo", svg: `<circle cx="32" cy="34" r="16" fill="#f2765a" opacity="0.35" stroke="#17324d" stroke-width="2.5"/><ellipse cx="32" cy="37" rx="8" ry="6" fill="#f2765a" stroke="#17324d" stroke-width="2"/><circle cx="29" cy="37" r="1.5" fill="#17324d"/><circle cx="35" cy="37" r="1.5" fill="#17324d"/>` },
      { word: "map", graphemes: ["m", "a", "p"], es: "mapa", svg: `<polygon points="10,16 24,12 40,18 54,14 54,48 40,52 24,46 10,50" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5"/><circle cx="36" cy="30" r="4" fill="#f2765a" stroke="#17324d" stroke-width="2"/>` },
      { word: "dog", graphemes: ["d", "o", "g"], es: "perro", svg: `<ellipse cx="32" cy="36" rx="16" ry="12" fill="#9a4a26" opacity="0.35" stroke="#17324d" stroke-width="2.5"/><circle cx="26" cy="32" r="2.5" fill="#17324d"/><circle cx="38" cy="32" r="2.5" fill="#17324d"/>` },
      { word: "cup", graphemes: ["c", "u", "p"], es: "taza", svg: `<rect x="18" y="22" width="24" height="28" rx="4" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5"/><path d="M42 28h6a5 5 0 0 1 0 10h-6" fill="none" stroke="#17324d" stroke-width="2.5"/>` },
      { word: "box", graphemes: ["b", "o", "x"], es: "caja", svg: `<rect x="14" y="20" width="36" height="30" rx="3" fill="#f2c15b" stroke="#17324d" stroke-width="2.5"/><path d="M14 28h36" stroke="#17324d" stroke-width="2"/>` },
    ],
  },
  {
    id: "digraphs",
    level: 2,
    title: ["Level 2: Digraphs & Blends", "Nivel 2: Dígrafos y grupos consonánticos"], // ES-REVIEW
    desc: ["Two letters can work together to make one sound (sh, ch, th) or blend smoothly (fr, st, cl).", "Dos letras pueden unirse para hacer un sonido (sh, ch, th) o mezclarse suavemente."], // ES-REVIEW
    words: [
      { word: "ship", graphemes: ["sh", "i", "p"], es: "barco", svg: `<polygon points="12,38 52,38 44,50 20,50" fill="#9a4a26" stroke="#17324d" stroke-width="2.5"/><polygon points="32,12 32,36 48,36" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5"/>` },
      { word: "frog", graphemes: ["f", "r", "o", "g"], es: "rana", svg: `<ellipse cx="32" cy="38" rx="16" ry="12" fill="#1fa6a2" stroke="#17324d" stroke-width="2.5"/><circle cx="24" cy="24" r="5" fill="#fff" stroke="#17324d" stroke-width="2"/><circle cx="40" cy="24" r="5" fill="#fff" stroke="#17324d" stroke-width="2"/><circle cx="24" cy="24" r="2" fill="#17324d"/><circle cx="40" cy="24" r="2" fill="#17324d"/>` },
      { word: "clap", graphemes: ["c", "l", "a", "p"], es: "aplaudir", svg: `<rect x="18" y="20" width="12" height="26" rx="6" fill="#f2c15b" stroke="#17324d" stroke-width="2.5" transform="rotate(-15 24 33)"/><rect x="34" y="20" width="12" height="26" rx="6" fill="#f2c15b" stroke="#17324d" stroke-width="2.5" transform="rotate(15 40 33)"/>` },
      { word: "flag", graphemes: ["f", "l", "a", "g"], es: "bandera", svg: `<line x1="16" y1="12" x2="16" y2="54" stroke="#17324d" stroke-width="3" stroke-linecap="round"/><rect x="18" y="14" width="32" height="20" rx="2" fill="#1fa6a2" stroke="#17324d" stroke-width="2.5"/>` },
      { word: "drum", graphemes: ["d", "r", "u", "m"], es: "tambor", svg: `<ellipse cx="32" cy="24" rx="18" ry="7" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5"/><path d="M14 24v18c0 4 8 7 18 7s18-3 18-7V24" fill="#f2765a" opacity="0.35" stroke="#17324d" stroke-width="2.5"/>` },
      { word: "chin", graphemes: ["ch", "i", "n"], es: "barbilla", svg: `<circle cx="32" cy="30" r="16" fill="#f2c15b" opacity="0.4" stroke="#17324d" stroke-width="2.5"/><path d="M26 42q6 5 12 0" fill="none" stroke="#17324d" stroke-width="2.5"/>` },
      { word: "stop", graphemes: ["s", "t", "o", "p"], es: "alto", svg: `<polygon points="22,12 42,12 52,22 52,42 42,52 22,52 12,42 12,22" fill="#f2765a" stroke="#17324d" stroke-width="2.5"/><text x="32" y="36" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">STOP</text>` },
      { word: "swim", graphemes: ["s", "w", "i", "m"], es: "nadar", svg: `<path d="M10 38q11-7 22 0t22 0" fill="none" stroke="#075568" stroke-width="3"/><circle cx="32" cy="24" r="6" fill="#f2c15b" stroke="#17324d" stroke-width="2"/>` },
    ],
  },
  {
    id: "silent-e",
    level: 3,
    title: ["Level 3: Silent-e & Vowel Teams", "Nivel 3: E muda y pares de vocales"], // ES-REVIEW
    desc: ["Silent-e and vowel teams (ai, oa, ee, ay) help vowels say their long sound.", "La e muda y los pares de vocales ayudan a que la vocal suene larga."], // ES-REVIEW
    words: [
      { word: "cake", graphemes: ["c", "a", "k", "e"], es: "pastel", svg: `<rect x="14" y="28" width="36" height="22" rx="4" fill="#f2c15b" stroke="#17324d" stroke-width="2.5"/><line x1="32" y1="16" x2="32" y2="28" stroke="#17324d" stroke-width="2.5"/><circle cx="32" cy="13" r="3.5" fill="#f2765a"/>` },
      { word: "boat", graphemes: ["b", "oa", "t"], es: "bote", svg: `<polygon points="10,38 54,38 46,50 18,50" fill="#17324d"/><polygon points="30,14 30,36 46,36" fill="#f2c15b" stroke="#17324d" stroke-width="2"/>` },
      { word: "rain", graphemes: ["r", "ai", "n"], es: "lluvia", svg: `<path d="M18 32a10 10 0 0 1 18-6 9 9 0 0 1 12 8H18z" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5"/><path d="M22 40l-2 8M32 40l-2 8M42 40l-2 8" stroke="#075568" stroke-width="2.5" stroke-linecap="round"/>` },
      { word: "tree", graphemes: ["t", "r", "ee"], es: "árbol", svg: `<rect x="28" y="38" width="8" height="16" fill="#9a4a26" stroke="#17324d" stroke-width="2"/><circle cx="32" cy="24" r="14" fill="#1fa6a2" stroke="#17324d" stroke-width="2.5"/>` },
      { word: "moon", graphemes: ["m", "oo", "n"], es: "luna", svg: `<path d="M38 14a18 18 0 1 0 12 30 14 14 0 0 1-12-30z" fill="#f2c15b" stroke="#17324d" stroke-width="2.5"/>` },
      { word: "bike", graphemes: ["b", "i", "k", "e"], es: "bicicleta", svg: `<circle cx="20" cy="40" r="10" fill="none" stroke="#17324d" stroke-width="2.5"/><circle cx="44" cy="40" r="10" fill="none" stroke="#17324d" stroke-width="2.5"/><path d="M20 40l12-14h10l2 14M32 26l-4 14" fill="none" stroke="#1fa6a2" stroke-width="2.5"/>` },
      { word: "home", graphemes: ["h", "o", "m", "e"], es: "hogar", svg: `<polygon points="14,32 32,14 50,32 50,52 14,52" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5"/><rect x="27" y="38" width="10" height="14" fill="#9a4a26"/>` },
      { word: "seed", graphemes: ["s", "ee", "d"], es: "semilla", svg: `<ellipse cx="32" cy="36" rx="10" ry="14" fill="#f2c15b" stroke="#17324d" stroke-width="2.5"/><path d="M32 22c0-8 8-10 8-10" fill="none" stroke="#1fa6a2" stroke-width="2.5"/>` },
    ],
  },
];

let activeLevel = 0;
let wordIndex = 0;
let built = [];
let message = null;

function loadDone() {
  return safeJson(storage.get(KEY), {}) || {};
}

function markDone(word) {
  const s = loadDone();
  s[word] = true;
  storage.set(KEY, JSON.stringify(s));
}

function tilePoolFor(item) {
  const extras = ["a", "e", "i", "o", "u", "m", "s", "t", "sh", "ee", "oa"].filter((g) => !item.graphemes.includes(g)).slice(0, 3);
  const all = [...item.graphemes.map((g, i) => ({ id: `g-${i}`, g })), ...extras.map((g, i) => ({ id: `x-${i}`, g }))];
  let seed = [...item.word].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  for (let i = all.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

export function renderProgression(ctx) {
  const I = i18nFor(ctx);
  const lvl = PHONICS_LEVELS[activeLevel] || PHONICS_LEVELS[0];
  const item = lvl.words[wordIndex] || lvl.words[0];
  const pool = tilePoolFor(item);
  const doneMap = loadDone();
  const solved = built.length === item.graphemes.length && built.every((b, idx) => b.g === item.graphemes[idx]);

  return {
    title: I.S("Systematic Phonics Word-Builder", "Constructor de palabras fonético"),
    html: html`<article class="early-phonics" aria-labelledby="ppTitle">
      <p><a href="${BASE}/early?grades=${ctx.band}">← ${I.T("Early & Phonics Home", "Inicio de fonética")}</a></p>
      <p class="eyebrow">${I.T("Systematic Phonics Progression · Zero Timers", "Progresión fonética sistemática · Sin cronómetro")}</p> <!-- ES-REVIEW -->
      <h1 id="ppTitle" tabindex="-1">${I.T("Phonics Word-Builder", "Constructor de palabras")}</h1>
      <div class="is-mode-tabs" role="tablist" aria-label="${I.S("Phonics levels", "Niveles de fonética")}" style="margin:1rem 0;">
        ${PHONICS_LEVELS.map((l, idx) => html`<button type="button" role="tab" class="btn small ${idx === activeLevel ? "btn-primary" : ""}" aria-selected="${idx === activeLevel}" data-pp-level="${idx}">${I.T(...l.title)}</button>`)}
      </div>
      <p class="fine">${I.T(...lvl.desc)}</p>
      ${(() => {
        const lvlDone = lvl.words.filter((w) => doneMap[w.word]).length;
        const pct = Math.round((lvlDone / lvl.words.length) * 100);
        return html`<p class="fine" style="margin:.4rem 0 .25rem;"><strong>${lvlDone}/${lvl.words.length}</strong> ${I.T("words built in this level", "palabras construidas en este nivel")} (${pct}%)</p><div class="bar" aria-hidden="true"><i style="width:${pct}%"></i></div>`;
      })()}

      <section class="panel" style="margin-top:1rem;">
        <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
          <div style="padding:.5rem;background:#f7f4ec;border-radius:12px;border:1.5px solid #17324d;">
            <svg viewBox="0 0 64 64" width="72" height="72" aria-hidden="true">${raw(item.svg)}</svg>
          </div>
          <div>
            <p class="eyebrow">${I.T(`Word ${wordIndex + 1} of ${lvl.words.length}`, `Palabra ${wordIndex + 1} de ${lvl.words.length}`)} ${doneMap[item.word] ? "✓" : ""}</p>
            <p style="margin:.25rem 0;font-weight:600;">${I.mode !== "en" ? `${item.es} · ` : ""}${I.T("Tap “Hear word” or press each sound button below.", "Toca “Escuchar palabra” o presiona cada botón de sonido.")}</p> <!-- ES-REVIEW -->
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.5rem;">
              <button type="button" class="btn btn-primary small" data-pp-hear-word="${item.word}">${icon("volume")} ${I.T("Hear word", "Escuchar palabra")}</button>
              <button type="button" class="btn small" data-pp-blend>${I.T("Sound-by-Sound", "Sonido por sonido")}</button>
            </div>
          </div>
        </div>

        <h2 style="font-size:1.05rem;margin:1.25rem 0 .5rem;">${I.T("Press the Sound Buttons", "Presiona los botones de sonido")}</h2> <!-- ES-REVIEW -->
        <div style="display:flex;gap:.65rem;flex-wrap:wrap;margin-bottom:1rem;">
          ${item.graphemes.map((g, idx) => {
            const placed = built[idx]?.g || "";
            return html`<div style="display:flex;flex-direction:column;align-items:center;gap:.35rem;">
              <div style="min-width:56px;height:56px;border:2px solid #17324d;border-radius:10px;display:grid;place-items:center;font-size:1.35rem;font-weight:700;background:${placed ? "#eaf4f4" : "#fff"};">${placed || "?"}</div>
              <button type="button" class="btn small" data-pp-sound="${g}" aria-label="${I.S(`Hear sound ${g}`, `Escuchar sonido ${g}`)}">● ${I.T("Sound", "Sonido")}</button>
            </div>`;
          })}
        </div>

        <h2 style="font-size:1.05rem;margin:1rem 0 .5rem;">${I.T("Tap Grapheme Tiles to Build", "Toca las fichas para construir")}</h2> <!-- ES-REVIEW -->
        <div class="is-word-bank" role="group" aria-label="${I.S("Grapheme tiles", "Fichas de grafemas")}">
          ${pool.map((t) => {
            const used = built.some((b) => b.id === t.id);
            return html`<button type="button" class="is-bank-chip" data-pp-tile="${t.id}" data-pp-g="${t.g}" ${used ? raw("disabled") : ""}>${t.g}</button>`;
          })}
        </div>

        ${message ? html`<div class="feedback ${solved ? "is-right" : "is-hint"}" role="status"><p>${I.T(...message)}</p></div>` : ""}

        <div class="is-actions">
          <button type="button" class="btn small" data-pp-reset>${icon("retry")} ${I.T("Clear tiles", "Limpiar fichas")}</button>
          <button type="button" class="btn btn-primary small" data-pp-next>${I.T("Next word", "Siguiente palabra")} ${icon("arrow-right")}</button>
        </div>
      </section>
    </article>`,
  };
}

export async function onProgressionClick(e, ctx) {
  const t = e.target;
  const lvlBtn = t.closest("[data-pp-level]");
  if (lvlBtn) {
    activeLevel = Number(lvlBtn.dataset.ppLevel) || 0;
    wordIndex = 0;
    built = [];
    message = null;
    ctx.rerender();
    return true;
  }
  const lvl = PHONICS_LEVELS[activeLevel] || PHONICS_LEVELS[0];
  const item = lvl.words[wordIndex] || lvl.words[0];

  const hearBtn = t.closest("[data-pp-hear-word]");
  if (hearBtn) {
    stopSpeech();
    await speak(hearBtn.dataset.ppHearWord, { rate: 0.9 });
    return true;
  }
  const sndBtn = t.closest("[data-pp-sound]");
  if (sndBtn) {
    stopSpeech();
    await speak(sndBtn.dataset.ppSound, { rate: 0.85 });
    return true;
  }
  if (t.closest("[data-pp-blend]")) {
    stopSpeech();
    for (const g of item.graphemes) {
      await speak(g, { rate: 0.85 });
    }
    await speak(item.word, { rate: 0.92 });
    return true;
  }
  const tileBtn = t.closest("[data-pp-tile]");
  if (tileBtn) {
    const idx = built.length;
    if (idx < item.graphemes.length) {
      const g = tileBtn.dataset.ppG;
      if (g === item.graphemes[idx]) {
        built.push({ id: tileBtn.dataset.ppTile, g });
        speak(g, { rate: 0.9 });
        if (built.length === item.graphemes.length) {
          markDone(item.word);
          message = [`Great! You built "${item.word}"!`, `¡Genial! ¡Construiste "${item.word}"!`]; // ES-REVIEW
          speak(item.word, { rate: 0.92 });
        } else {
          message = null;
        }
      } else {
        message = ["Listen to the next sound and try another tile.", "Escucha el siguiente sonido y prueba otra ficha."]; // ES-REVIEW
        speak(item.graphemes[idx], { rate: 0.85 });
      }
      ctx.rerender();
    }
    return true;
  }
  if (t.closest("[data-pp-reset]")) {
    built = [];
    message = null;
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-pp-next]")) {
    wordIndex = (wordIndex + 1) % lvl.words.length;
    built = [];
    message = null;
    ctx.rerender();
    return true;
  }
  return false;
}
