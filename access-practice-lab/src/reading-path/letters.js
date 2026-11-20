// A local tracing surface. Songs and fingerspelling media remain absent until supplied.
import { i18nFor } from "../i18n.js";
import { BASE, html } from "../util.js";
import { speak } from "../speech.js";
let data, cleanup;
const load = async () =>
  (data ||= await fetch(`${BASE}/content/reading-path/library/letters.json`).then((r) => {
    if (!r.ok) throw new Error("Letter content unavailable");
    return r.json();
  }));
export async function renderLetters(ctx) {
  await load();
  const I = i18nFor(ctx);
  const letter = data.letters.find((x) => x.id === ctx.route.sub);
  const href = (id) => `${BASE}/reading-path/letters${id ? `/${id}` : ""}?grades=${ctx.band}`;
  return {
    title: I.S("Letters and sounds", "Letras y sonidos"),
    html: html`<article class="in-page rp-page"><a href="${BASE}/reading-path?grades=${ctx.band}">${I.T("Reading Path", "Camino de lectura")}</a><h1>${I.T("Letters and sounds", "Letras y sonidos")}</h1><nav aria-label="${I.S("Choose a letter", "Elige una letra")}" class="row-actions">${data.letters.map((l) => html`<a class="btn" href="${href(l.id)}" ${l.id === letter?.id ? 'aria-current="page"' : ""}>${l.id.toUpperCase()} ${l.id}</a>`)}</nav>${letter ? html`<h2 lang="en">${letter.id.toUpperCase()} ${letter.id}</h2><p>${I.T("Trace the large capital letter. Use Show me to see each stroke. You can use the buttons instead of drawing.", "Traza la letra mayúscula grande. Usa Muéstrame para ver cada trazo. Puedes usar los botones en vez de dibujar.")}</p><div class="rp-trace"><svg viewBox="0 0 100 100" aria-hidden="true">${letter.strokes.map((d, i) => html`<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3" data-rp-stroke="${i}"></path>`)}</svg><canvas width="400" height="400" aria-label="${I.S("Draw your letter here. Or use Show me.", "Traza la letra aquí. O usa Muéstrame.")}" data-rp-canvas></canvas></div><div class="row-actions"><button class="btn" data-rp-show>${I.T("Show me", "Muéstrame")}</button><button class="btn" data-rp-clear>${I.T("Clear drawing", "Borrar dibujo")}</button><button class="btn" data-rp-letter-hear>${I.T("Hear the sound in words", "Escuchar el sonido en palabras")}</button></div><p>${I.T(letter.mouth.en, letter.mouth.es)}</p><ul>${letter.words.map((w) => html`<li><span aria-hidden="true">${w.symbol}</span> <span lang="en">${w.en}</span> · <span lang="es">${w.es}</span><button class="btn" data-rp-letter-word="${w.en}">${I.T("Hear it", "Escuchar")}</button></li>`)}</ul>` : ""}<details><summary>${I.T("ABC songs and fingerspelling", "Canciones del abecedario y alfabeto manual")}</summary><h2>${I.T("ABC song", "Canción del abecedario")}</h2>${data.song?.audio && data.song?.captions ? html`<audio controls data-rp-song><source src="${data.song.audio}"><track kind="captions" src="${data.song.captions}" srclang="en" label="English" default></audio><label for="rpSongRate">${I.T("Playback speed", "Velocidad")}</label><select id="rpSongRate" data-rp-song-rate><option value="0.75">0.75×</option><option value="1" selected>1×</option></select>` : html`<p>${I.T("Song audio and captions: not added yet.", "Audio y subtítulos de la canción: todavía no se han añadido.")}</p>`}<h2>${I.T("Fingerspelling alphabet", "Alfabeto manual")}</h2><ul class="rp-fingers">${data.fingerspelling.map((f) => html`<li><strong>${f.letter.toUpperCase()}</strong>${f.src ? html`<img src="${f.src}" alt="${I.S(`Handshape for ${f.letter}`, `Configuración de la mano para ${f.letter}`)}" width="120" height="120">` : html`<span>${I.T("Image not added yet", "Imagen aún no añadida")}</span>`}</li>`)}</ul></details></article>`,
  };
}
export function mountLetters(root) {
  cleanup?.();
  const c = root.querySelector("[data-rp-canvas]");
  if (!c) return;
  const context = c.getContext("2d");
  context.strokeStyle = getComputedStyle(c).color;
  context.lineWidth = 6;
  context.lineCap = "round";
  let drawing = false;
  const point = (e) => {
    const r = c.getBoundingClientRect();
    return [
      ((e.clientX - r.left) * c.width) / r.width,
      ((e.clientY - r.top) * c.height) / r.height,
    ];
  };
  const down = (e) => {
    drawing = true;
    c.setPointerCapture(e.pointerId);
    context.beginPath();
    context.moveTo(...point(e));
  };
  const move = (e) => {
    if (!drawing) return;
    context.lineTo(...point(e));
    context.stroke();
  };
  const up = () => {
    drawing = false;
  };
  c.addEventListener("pointerdown", down);
  c.addEventListener("pointermove", move);
  c.addEventListener("pointerup", up);
  c.addEventListener("pointercancel", up);
  cleanup = () => {
    c.removeEventListener("pointerdown", down);
    c.removeEventListener("pointermove", move);
    c.removeEventListener("pointerup", up);
    c.removeEventListener("pointercancel", up);
  };
}
export function onLetterClick(e, ctx) {
  const b = e.target.closest("button");
  if (!b) return false;
  const letter = data?.letters.find((l) => l.id === ctx.route.sub);
  if (b.dataset.rpLetterWord) {
    speak(b.dataset.rpLetterWord);
    return true;
  }
  if (b.hasAttribute("data-rp-letter-hear")) {
    speak(letter.words.map((w) => w.en));
    return true;
  }
  if (b.hasAttribute("data-rp-show")) {
    const paths = document.querySelectorAll("[data-rp-stroke]");
    for (const p of paths) {
      p.classList.remove("is-showing");
      void p.getBoundingClientRect();
      p.classList.add("is-showing");
      p.style.animationDelay = `${Number(p.dataset.rpStroke) * 0.6}s`;
    }
    return true;
  }
  if (b.hasAttribute("data-rp-clear")) {
    const c = document.querySelector("[data-rp-canvas]");
    c?.getContext("2d").clearRect(0, 0, c.width, c.height);
    return true;
  }
  return false;
}
export function onLetterChange(e) {
  if (e.target.hasAttribute("data-rp-song-rate")) {
    const audio = document.querySelector("[data-rp-song]");
    if (audio) audio.playbackRate = Number(e.target.value);
  }
}
export function unmountLetters() {
  cleanup?.();
  cleanup = null;
}
