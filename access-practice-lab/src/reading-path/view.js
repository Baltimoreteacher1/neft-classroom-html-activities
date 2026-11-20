// The additive /reading-path surface. Existing Science of Reading lessons keep their routes and records.
import {
  renderLetters,
  mountLetters,
  onLetterClick,
  onLetterChange,
  unmountLetters,
} from "./letters.js";
import { renderLibrary, onLibraryClick, onLibraryChange } from "./library.js";
import { i18nFor } from "../i18n.js";
import { BASE, html, storage, safeJson, announce } from "../util.js";
import { speak, stop } from "../speech.js";
import { printSheet } from "../print-sheet.js";
import {
  choose,
  cleanProgress,
  READING_PATH_KEY,
  nextUnit,
  unitDone,
  olderSkin,
  seededOrder,
} from "./model.js";
import {
  roundFor,
  newGame,
  move,
  CARD_CHOICES,
  ROUND_CHOICES,
  STAGE_CHOICES,
} from "./games/engine.js";
import { REELS, clampReel, isRealWord, machineWord } from "./games/machine.js";
let scope,
  book,
  session = null,
  currentPage = 0,
  readerMode = "both";
const get = async (name) => {
  const r = await fetch(`${BASE}/content/reading-path/${name}.json`);
  if (!r.ok) throw new Error("Reading content unavailable");
  return r.json();
};
const load = async () => (scope ||= await get("phonics-scope"));
const saved = () => cleanProgress(safeJson(storage.get(READING_PATH_KEY), {}), scope.units);
const href = (ctx, path = "") => `${BASE}/reading-path${path}?grades=${ctx.band}`;
const title = (I, p) => I.T(p.en, p.es);
function bookmark(unit, item) {
  const next = { ...saved(), [`${unit.id}/${item.id}`]: true };
  return storage.set(READING_PATH_KEY, JSON.stringify(next));
}
function adultHTML(ctx, I) {
  return html`<details><summary>${I.T("Adults", "Personas adultas")}</summary><h2>${I.T("Read together", "Lean juntos")}</h2><p>${I.T("Hear the sound. Point to each letter. Blend the sounds. Read the page again. Let the learner try each word.", "Escuchen el sonido. Señalen cada letra. Unan los sonidos. Lean la página otra vez. Dejen que el estudiante pruebe cada palabra.")}</p><table><caption>${I.T("15-unit scope", "Secuencia de 15 unidades")}</caption><thead><tr><th>${I.T("Unit", "Unidad")}</th><th>${I.T("Pattern", "Patrón")}</th><th>${I.T("Print", "Imprimir")}</th></tr></thead><tbody>${scope.units.map((u) => html`<tr><th scope="row">${u.n}</th><td>${title(I, u.teaches)}</td><td><button class="btn" data-rp-print="${u.id}">${I.T("Word cards and strips", "Tarjetas y tiras")}</button></td></tr>`)}</tbody></table></details>`;
}
export async function render(ctx) {
  if (ctx.route.id === "letters") return renderLetters(ctx);
  if (ctx.route.id === "library") return renderLibrary(ctx);
  await load();
  const I = i18nFor(ctx),
    progress = saved();
  const unit = scope.units.find((u) => u.id === ctx.route.id);
  const item = unit?.items.find((i) => i.id === ctx.route.sub);
  const head = html`<p class="eyebrow">${olderSkin(ctx.band) ? I.T("Reading practice", "Práctica de lectura") : I.T("Read with Pepita", "Lee con Pepita")}</p><h1>${I.T("Reading Path", "Camino de lectura")}</h1><p>${I.T("Practice, not the official test. Work stays on this device.", "Práctica, no la prueba oficial. El trabajo queda en este dispositivo.")}</p>`;
  let body;
  if (!unit) {
    const next = nextUnit(scope.units, progress);
    body = html`${head}<p>${I.T("Hear it. Build it. Read it. Start anywhere. There are no locks or timers.", "Escucha. Construye. Lee. Empieza donde quieras. No hay bloqueos ni cronómetro.")}</p><a class="btn btn-primary" href="${href(ctx, `/${next.id}`)}">${I.T("Begin", "Empezar")}</a><p><a href="${href(ctx, "/library")}">${I.T("Read-aloud library", "Biblioteca de lectura")}</a> · <a href="${href(ctx, "/letters")}">${I.T("Letters and sounds", "Letras y sonidos")}</a></p><h2>${I.T("All units", "Todas las unidades")}</h2><ol>${scope.units.map((u) => html`<li><a href="${href(ctx, `/${u.id}`)}">${title(I, u.teaches)}</a> · ${unitDone(u, progress) ? I.T("Done on this device", "Hecha en este dispositivo") : u.id === next.id ? I.T("Next suggestion", "Siguiente sugerencia") : I.T("Open", "Abierta")}</li>`)}</ol>${adultHTML(ctx, I)}`;
  } else if (!item) {
    body = html`<a href="${href(ctx)}">${I.T("All units", "Todas las unidades")}</a>${head}<h2>${unit.n}. ${title(I, unit.teaches)}</h2><ul>${unit.items.map((i) => html`<li><a class="btn" href="${href(ctx, `/${unit.id}/${i.id}`)}">${title(I, i.title)}</a> ${progress[`${unit.id}/${i.id}`] ? I.T("Done", "Hecho") : ""}</li>`)}</ul>`;
  } else {
    const back = html`<a href="${href(ctx, `/${unit.id}`)}">${I.T("Back to this unit", "Volver a esta unidad")}</a><h1>${title(I, item.title)}</h1>`;
    if (item.kind === "reader") {
      book = await get(unit.id);
      currentPage = Math.min(currentPage, book.pages.length);
      const page = book.pages[currentPage];
      body = html`${back}${
        page
          ? html`<p>${I.T(`Page ${currentPage + 1} of ${book.pages.length}`, `Página ${currentPage + 1} de ${book.pages.length}`)}</p><label for="rpMode">${I.T("Read mode", "Modo de lectura")}</label><select id="rpMode" data-rp-mode>${[
              ["hear", "Read to me", "Léeme"],
              ["read", "I read", "Yo leo"],
              ["both", "Both", "Ambos"],
            ].map(
              ([id, en, es]) =>
                html`<option value="${id}" ${id === readerMode ? "selected" : ""}>${I.S(en, es)}</option>`,
            )}</select><p class="rp-text" lang="en" id="rpSentence">${page.en.split(/(\s+)/).map((w, i) => (w.trim() ? html`<button type="button" class="btn" data-rp-word="${w}" data-word-index="${i}">${w}</button>` : w))}</p><details><summary>${I.T("Spanish meaning", "Significado en español")}</summary><p lang="es">${page.es}</p></details>${readerMode !== "read" ? html`<button class="btn" data-rp-read>${I.T("Read this page", "Leer esta página")}</button>` : ""}<button class="btn" data-rp-stop>${I.T("Stop audio", "Parar audio")}</button>`
          : html`<p>${I.T("You reached the end.", "Llegaste al final.")}</p><button class="btn btn-primary" data-rp-done>${I.T("I read it", "Lo leí")}</button><p>${I.T("This saves a bookmark only.", "Solo guarda un marcador.")}</p>`
      }<div class="row-actions"><button class="btn" data-rp-page="-1" ${currentPage === 0 ? "disabled" : ""}>${I.T("Previous page", "Página anterior")}</button><button class="btn" data-rp-page="1" ${!page ? "disabled" : ""}>${I.T("Next page", "Página siguiente")}</button></div>`;
    } else if (item.kind === "mini-lesson") {
      body = html`${back}<p lang="en">${unit.exampleWords.join(" · ")}</p><button class="btn" data-rp-pattern>${I.T("Hear the words", "Escuchar las palabras")}</button><p>${I.T("Point to the letters that show this sound. Say the sound. Blend the whole word.", "Señala las letras de este sonido. Di el sonido. Une los sonidos de la palabra.")}</p><button class="btn" data-rp-done>${I.T("I tried it", "Lo intenté")}</button>`;
    } else {
      const key = `${unit.id}/${item.id}`;
      if (session?.key !== key)
        session = {
          key,
          seed: 1,
          cards: 6,
          stage: "A",
          rounds: 5,
          count: 0,
          state: newGame(),
          selected: "",
          reels: [0, 0, 0],
        };
      session.round = roundFor(unit, item.template, {
        seed: session.seed,
        cards: session.cards,
        band: ctx.band,
        stage: session.stage,
      });
      body = html`${back}${gameHTML(ctx, I, session)}<p role="status" aria-live="polite" id="rpStatus"></p>`;
    }
  }
  return {
    title: I.S("Reading Path", "Camino de lectura"),
    html: html`<article class="in-page rp-page" lang="en">${body}<p class="fine">${I.T("Spanish is machine-assisted, not human-reviewed.", "El español cuenta con ayuda automática; no lo ha revisado una persona.")}</p></article>`,
  };
}
function gameHTML(ctx, I, s) {
  const r = s.round,
    st = s.state;
  const button = (value, text, attr = "value") =>
    html`<button type="button" class="btn" data-rp-move="${value}" data-${attr}="${value}">${text}</button>`;
  let controls;
  if (r.template === "build")
    controls = html`<p lang="en">${st.placed.map((id) => r.tiles.find((t) => t.id === id)?.s).join(" · ") || "□ ".repeat(r.sounds.length)}</p><div class="row-actions">${r.tiles.map((t) => html`<button class="btn" data-rp-move="${t.id}" data-tile="${t.id}" ${st.placed.includes(t.id) ? "disabled" : ""}>${t.s}</button>`)}</div>`;
  if (r.template === "switch")
    controls = html`<p lang="en">${st.complete ? r.switchPair[1] : r.switchPair[0]}</p><div class="row-actions">${["a", "i", "e"].map((t) => button(t, t))}</div>`;
  if (r.template === "sight")
    controls = html`<button class="btn" data-rp-target>${I.T("Hear the word", "Escuchar la palabra")}</button><div class="row-actions" lang="en">${seededOrder(r.sight, s.seed).map((w) => button(w, w))}</div>`;
  if (r.template === "sentence")
    controls = html`<p lang="en">${st.sentence.join(" ")}</p><div class="row-actions" lang="en">${seededOrder(
      r.sentence.split(" ").map((word, i) => ({ word, i })),
      s.seed,
    ).map(
      ({ word, i }) =>
        html`<button class="btn" data-rp-move="${word}" data-value="${word}" ${st.sentence.length > i ? "disabled" : ""}>${word}</button>`,
    )}</div>`;
  if (r.template === "match")
    controls = html`<label for="rpCards">${I.T("Cards", "Tarjetas")}</label><select id="rpCards" data-rp-cards>${[6, 8, 12].map((n) => html`<option value="${n}" ${n === s.cards ? "selected" : ""}>${n}</option>`)}</select><p>${I.T("Choose two cards with the same word.", "Elige dos tarjetas con la misma palabra.")}</p><div class="row-actions" lang="en">${r.pairs.map((p) => html`<button class="btn" data-rp-pair="${p.id}" aria-pressed="${s.selected === p.id}" ${st.matched.includes(p.id) ? "disabled" : ""}>${s.selected === p.id || st.matched.includes(p.id) ? p.word : I.T("Turn card", "Voltear")}</button>`)}</div>`;
  if (r.template === "sort")
    controls = html`<div class="row-actions" lang="en">${r.words.filter((w) => r.sortPatterns.some((p) => w.includes(p))).map((w) => html`<button class="btn" data-rp-select="${w}" aria-pressed="${s.selected === w}" ${st.sorted.includes(w) ? "disabled" : ""}>${w}</button>`)}</div><div class="row-actions">${r.sortPatterns.map((p) => html`<button class="btn" data-rp-bin="${p}">${p}</button>`)}</div>`;
  if (r.template === "hunt")
    controls = html`<p>${I.T("Find pictures whose names share the vowel sound.", "Busca imágenes cuyos nombres compartan el sonido de vocal.")}</p><div class="rp-picture-grid" lang="en">${r.pictures.map(([word, picture]) => html`<button class="btn" data-rp-move="${word}" data-word="${word}" ${st.found.includes(word) ? "disabled" : ""}><span class="rp-picto" aria-hidden="true">${picture}</span><span>${word}</span></button>`)}</div>`;
  if (r.template === "machine") {
    const w = machineWord(s.reels);
    controls = html`<div class="row-actions">${REELS.map((p, i) => html`<span><button class="btn" data-rp-reel="${i}" data-delta="-1" aria-label="${I.S("Previous sound", "Sonido anterior")}">←</button><b lang="en">${p[clampReel(i, s.reels[i])]}</b><button class="btn" data-rp-reel="${i}" data-delta="1" aria-label="${I.S("Next sound", "Siguiente sonido")}">→</button></span>`)}</div><p lang="en">${w}</p><p>${isRealWord(w) ? I.T("Word", "Palabra") : I.T("Not a word", "No es una palabra")}</p>${button("done", I.T("I tried the reels", "Probé la máquina"))}`;
  }
  return html`<p>${I.T("Take your time. A wrong move replays the word.", "Tómate tu tiempo. Si te equivocas, escucharás la palabra otra vez.")}</p><button class="btn" data-rp-target>${I.T("Hear the target", "Escuchar la palabra")}</button>${controls}${st.complete ? html`<p>${I.T("Round done.", "Ronda terminada.")}</p><button class="btn btn-primary" data-rp-continue>${s.count + 1 >= s.rounds ? I.T("Finish game", "Terminar juego") : I.T("Next round", "Siguiente ronda")}</button>` : ""}<details><summary>${I.T("Round choices", "Opciones de ronda")}</summary><label for="rpStage">${I.T("Classroom support choice, not a WIDA level", "Opción de apoyo en clase, no un nivel WIDA")}</label><select id="rpStage" data-rp-stage>${["A", "B", "C"].map((n) => html`<option ${n === s.stage ? "selected" : ""}>${n}</option>`)}</select><label for="rpRounds">${I.T("Rounds", "Rondas")}</label><select id="rpRounds" data-rp-rounds>${[5, 10, 15].map((n) => html`<option ${n === s.rounds ? "selected" : ""}>${n}</option>`)}</select><button class="btn" data-rp-new>${I.T("New round", "Nueva ronda")}</button></details>`;
}
export async function onClick(e, ctx) {
  if (ctx.route.id === "letters") return onLetterClick(e, ctx);
  if (ctx.route.id === "library") return onLibraryClick(e, ctx);
  const b = e.target.closest("button");
  if (!b) return false;
  const I = i18nFor(ctx);
  const unit = scope.units.find((u) => u.id === ctx.route.id),
    item = unit?.items.find((i) => i.id === ctx.route.sub);
  if (b.hasAttribute("data-rp-print")) {
    const u = scope.units.find((u) => u.id === b.dataset.rpPrint);
    printSheet(
      html`<article><h1>${title(I, u.teaches)}</h1><h2>${I.T("Word list", "Lista de palabras")}</h2><p lang="en">${u.exampleWords.join(" · ")}</p><h2>${I.T("Word cards", "Tarjetas de palabras")}</h2><div class="rp-flash" lang="en">${u.exampleWords.map((w) => html`<div>${w}</div>`)}</div><h2>${I.T("Sentence strips", "Tiras de oraciones")}</h2><p lang="en">${u.sentence.en}</p></article>`,
    );
    return true;
  }
  if (b.hasAttribute("data-rp-stop")) {
    stop();
    return true;
  }
  if (b.dataset.rpWord) {
    if (readerMode !== "hear") speak(b.dataset.rpWord);
    return true;
  }
  if (b.hasAttribute("data-rp-pattern")) {
    speak(unit.exampleWords);
    return true;
  }
  if (b.hasAttribute("data-rp-done")) {
    const ok = bookmark(unit, item);
    announce(
      ok
        ? I.S("Saved on this device.", "Guardado en este dispositivo.")
        : I.S(
            "Could not save. Your storage may be full.",
            "No se pudo guardar. El almacenamiento puede estar lleno.",
          ),
    );
    return true;
  }
  if (b.dataset.rpPage) {
    stop();
    currentPage = Math.max(0, Math.min(book.pages.length, currentPage + Number(b.dataset.rpPage)));
    await ctx.rerender();
    document.querySelector("#rpSentence")?.querySelector("button")?.focus();
    return true;
  }
  if (b.hasAttribute("data-rp-read")) {
    const el = document.querySelector("#rpSentence");
    el.classList.add("is-reading");
    let start = 0;
    const words = book.pages[currentPage].en.split(/(\s+)/);
    const offsets = words.map((w) => {
      const at = start;
      start += w.length;
      return at;
    });
    await speak(book.pages[currentPage].en, {
      onBoundary: ({ charIndex }) => {
        for (const child of el.querySelectorAll("[data-word-index]"))
          child.classList.toggle(
            "is-current",
            offsets[Number(child.dataset.wordIndex)] === charIndex,
          );
      },
    });
    el.classList.remove("is-reading");
    for (const child of el.querySelectorAll(".is-current")) child.classList.remove("is-current");
    return true;
  }
  if (!session) return false;
  if (b.hasAttribute("data-rp-target")) {
    speak(session.round.template === "sight" ? session.round.sight[0] : session.round.target);
    return true;
  }
  if (b.dataset.rpReel) {
    const i = Number(b.dataset.rpReel);
    if (!REELS[i]) return false;
    session.reels[i] = clampReel(i, session.reels[i] + Number(b.dataset.delta));
    await ctx.rerender();
    speak(machineWord(session.reels));
    return true;
  }
  if (b.hasAttribute("data-rp-new")) {
    session.seed++;
    session.state = newGame();
    session.selected = "";
    await ctx.rerender();
    return true;
  }
  if (b.hasAttribute("data-rp-continue")) {
    session.count++;
    if (session.count >= session.rounds) {
      const ok = bookmark(unit, item);
      announce(
        ok ? I.S("Game saved.", "Juego guardado.") : I.S("Could not save.", "No se pudo guardar."),
      );
      if (ok) {
        await ctx.navigate(href(ctx, `/${unit.id}`));
        return true;
      }
    }
    session.seed++;
    session.state = newGame();
    await ctx.rerender();
    document.querySelector("[data-rp-move]:not([disabled])")?.focus();
    return true;
  }
  if (b.dataset.rpSelect) {
    session.selected = b.dataset.rpSelect;
    await ctx.rerender();
    return true;
  }
  let action;
  if (b.dataset.rpPair) {
    if (!session.selected) {
      session.selected = b.dataset.rpPair;
      await ctx.rerender();
      return true;
    }
    action = { a: session.selected, b: b.dataset.rpPair };
    session.selected = "";
  } else if (b.dataset.rpBin) {
    action = { word: session.selected, bin: b.dataset.rpBin };
  } else if (b.hasAttribute("data-rp-move")) action = { ...b.dataset };
  if (!action) return false;
  const result = move(session.round, session.state, action);
  const wrong = result.state === session.state;
  session.state = result.state;
  if (result.replay) speak(result.replay);
  await ctx.rerender();
  if (!wrong) {
    (
      document.querySelector("[data-rp-continue]") ||
      document.querySelector("[data-rp-move]:not([disabled])")
    )?.focus();
  }
  const status = document.getElementById("rpStatus");
  if (status)
    status.textContent = wrong
      ? I.S("Listen and try again.", "Escucha e inténtalo otra vez.")
      : I.S("Keep going.", "Sigue.");
  return true;
}
export function onChange(e, ctx) {
  if (ctx.route.id === "letters") return onLetterChange(e);
  if (ctx.route.id === "library") return onLibraryChange(e, ctx);
  if (e.target.hasAttribute("data-rp-mode")) readerMode = e.target.value;
  else if (session && e.target.hasAttribute("data-rp-cards")) {
    session.cards = choose(e.target.value, CARD_CHOICES);
    session.state = newGame();
  } else if (session && e.target.hasAttribute("data-rp-stage")) {
    session.stage = choose(e.target.value, STAGE_CHOICES);
    session.state = newGame();
  } else if (session && e.target.hasAttribute("data-rp-rounds"))
    session.rounds = choose(e.target.value, ROUND_CHOICES);
  else return;
  ctx.rerender();
}
export function onKey(e, ctx) {
  if (ctx.route.sub !== "reader" || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return false;
  if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
    currentPage = Math.max(
      0,
      Math.min(book.pages.length, currentPage + (e.key === "ArrowRight" ? 1 : -1)),
    );
    stop();
    ctx.rerender();
    return true;
  }
  return false;
}
export function mount(root, ctx) {
  if (ctx.route.id === "letters") mountLetters(root);
}
export function unmount() {
  unmountLetters();
  stop();
  session = null;
  currentPage = 0;
}
