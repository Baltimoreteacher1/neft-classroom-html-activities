// Book Studio 2.0 · play mode: a branching story with reader choices, clues, an inventory, state, alternate endings and
// saved progress. The same pages and text the book already has; nothing here is a second format. Real buttons and real
// text, so a keyboard or screen-reader player gets every choice. Motion respects the reader's reduced-motion setting.
import * as db from "./db.js";
import { bkIcon } from "./icons.js";
import { createSupportHost } from "./lang/ui-support.js";
import { publicCopy, resolveSupports } from "./lang/supports.js";
import { emptyWork } from "./lang/work.js";
import { pageHTML, preloadMedia, esc, artSrc } from "./render.js";
import {
  choicesFor,
  collect,
  initState,
  isAdventure,
  nextLinear,
  takeChoice,
  validateStory,
} from "./story.js";
import { plainText } from "./model.js";

const KEY = (id) => `accessPracticeLab:v1:book-play:${id}`;
const loadSaved = (id) => {
  try {
    return JSON.parse(localStorage.getItem(KEY(id)) || "null");
  } catch {
    return null;
  }
};
const saveState = (id, state, history) => {
  try {
    localStorage.setItem(KEY(id), JSON.stringify({ state, history }));
  } catch {}
};

/**
 * Mount play mode. opts: { shared, preview } — `preview` is the author's play-test (no saved progress, shows warnings).
 * A shared or published book carries only the supports the teacher allowed to travel (publicCopy).
 */
export async function mountPlay(root, ctx, rawBook, I, opts = {}) {
  const book = opts.shared || opts.published ? publicCopy(rawBook) : rawBook;
  await preloadMedia(book).catch(() => {});
  const tr = I.S;
  const lang = I.spanish ? "es" : "en";
  const adventure = isAdventure(book);
  const warnings = opts.preview ? validateStory(book) : [];
  const saved = !opts.preview ? loadSaved(book.id) : null;
  const P = {
    state: initState(book),
    history: [],
    player: null,
    muted: true,
    voices: false,
    destroyed: false,
    popover: null,
  };
  if (saved?.state && book.pages.some((p) => p.id === saved.state.page)) {
    P.state = saved.state;
    P.history = saved.history || [];
  }
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const work = { ...emptyWork() };
  let sup = null;
  const supportHost = () =>
    createSupportHost({
      I,
      sandbox: true,
      getBook: () => book,
      audience: () => ({
        profile: 0,
        plan: { profile: 0, intensity: "heavy", domains: {} },
        mode: "reader",
      }),
      getWork: () => work,
      setWork: (fn) => Object.assign(work, fn(work)),
      insertText: () => {},
      applyText: () => {},
      refresh: () => draw(),
      say: (m) => say(m),
    });
  sup = supportHost();

  root.innerHTML = `<div class="bk-play" data-bk-play>
    <header class="bk-reader-bar">
      <a class="btn ghost small" href="/access-practice-lab/book-studio${opts.shared ? "" : `/edit/${book.id}`}">${bkIcon(opts.shared ? "book" : "draw")}<span>${esc(opts.shared ? tr("Book Studio", "Book Studio") : tr("Back to editing", "Volver a editar"))}</span></a>
      <h1 class="bk-reader-title" tabindex="-1">${esc(book.title)}</h1>
      <div class="bk-reader-tools">
        <button type="button" class="btn small ghost" data-p="back" aria-label="${esc(tr("Go back one step", "Retroceder un paso"))}">${bkIcon("undo")}<span>${esc(tr("Back", "Atrás"))}</span></button>
        <button type="button" class="btn small ghost" data-p="restart">${bkIcon("rotate")}<span>${esc(tr("Start over", "Empezar de nuevo"))}</span></button>
        <button type="button" class="bk-tbtn" data-p="sound" aria-pressed="false" aria-label="${esc(tr("Sound effects", "Efectos de sonido"))}" title="${esc(tr("Sound effects (off)", "Efectos de sonido (apagado)"))}">${bkIcon("speaker")}</button>
        <button type="button" class="bk-tbtn" data-p="voices" aria-pressed="false" aria-label="${esc(tr("Character voices", "Voces de los personajes"))}" title="${esc(tr("Character voices (off)", "Voces de personajes (apagado)"))}">${bkIcon("mic")}</button>
      </div>
    </header>
    ${opts.preview ? `<div class="bk-play-warn" data-p-warn></div>` : ""}
    <div class="bk-play-inv" data-p-inv role="status" aria-label="${esc(tr("Things you have found", "Cosas que encontraste"))}"></div>
    <div class="bk-play-stage" data-p-stage></div>
    <div class="bk-play-choices" data-p-choices></div>
    <div class="bk-play-tray" data-p-tray></div>
    <p class="sr-only" role="status" aria-live="polite" data-p-live></p>
  </div>`;
  const $ = (s) => root.querySelector(s);
  const say = (m) => {
    const l = $("[data-p-live]");
    if (l) {
      l.textContent = "";
      setTimeout(() => (l.textContent = m), 30);
    }
  };
  const pageOf = () => book.pages.find((p) => p.id === P.state.page) || book.pages[0];

  function inventory() {
    const items = book.story.items.filter((i) => P.state.items.includes(i.id));
    $("[data-p-inv]").innerHTML = items.length
      ? `<strong>${esc(tr("You found:", "Encontraste:"))}</strong> ${items.map((i) => `<span class="bk-play-item">${i.art ? `<img alt="" src="${artSrc(i.art)}">` : ""}${esc(i.name)}</span>`).join("")}`
      : adventure
        ? `<span class="fine">${esc(tr("Nothing found yet. Click things in the picture to look closer.", "Aún no has encontrado nada. Haz clic en cosas de la imagen para mirar de cerca."))}</span>`
        : "";
  }

  function draw({ announce = false } = {}) {
    if (P.destroyed) return;
    P.player?.destroy();
    P.player = null;
    sup.closePop();
    const page = pageOf();
    const vocab = sup.vocabFor(page.id);
    const w = Math.min(900, Math.max(280, root.clientWidth - 32 || 700));
    $("[data-p-stage]").innerHTML =
      `<div class="bk-play-page" style="width:${w}px">${pageHTML(book, page, { mode: "read", lang, vocab })}</div><div class="bk-play-controls"><button type="button" class="btn small ghost" data-p="replay" ${page.scene?.actions?.length ? "" : "hidden"}>${bkIcon("play")} ${esc(tr("Watch this scene again", "Ver esta escena otra vez"))}</button></div>`;
    inventory();
    drawChoices(page);
    $("[data-p-tray]").innerHTML = sup.trayHTML(page.id);
    if (announce) {
      const text = page.elements
        .map((e) => plainText(e.html || ""))
        .filter(Boolean)
        .join(" ");
      say(text.slice(0, 160));
      $(".bk-play-page")?.setAttribute("tabindex", "-1");
    }
    if (page.scene?.actions?.length) startScene(page);
    if (opts.preview) {
      const here = warnings.filter((x) => x.pageId === page.id || !x.pageId);
      $("[data-p-warn]").innerHTML = here.length
        ? `<strong>${esc(tr("Story check", "Revisión del cuento"))}</strong><ul>${here.map((x) => `<li class="${x.level === "error" ? "bk-warn" : ""}">${esc(x.text)}</li>`).join("")}</ul>`
        : `<span class="fine">${bkIcon("check")} ${esc(tr("No problems found on this page.", "No se encontraron problemas en esta página."))}</span>`;
    }
  }

  async function startScene(page) {
    const { createScenePlayer } = await import("./scene-player.js");
    const pageEl = $(".bk-play-page .bk-page");
    if (!pageEl || P.destroyed) return;
    P.player = createScenePlayer(pageEl, page, {
      reduced,
      muted: () => P.muted,
      voices: () => P.voices,
      characters: book.characters,
    });
    P.player.play();
  }

  function drawChoices(page) {
    const box = $("[data-p-choices]");
    const list = choicesFor(page, P.state);
    if (list.length) {
      box.innerHTML = `<h2 class="bk-play-q">${esc(page.prompt ? page.prompt[lang] || page.prompt.en : book.story.instructions || tr("What will you do?", "¿Qué harás?"))}</h2><ul class="bk-play-list">${list
        .map(
          ({ choice, open }) =>
            `<li><button type="button" class="btn ${open ? "btn-primary" : "ghost"} bk-play-choice" data-p-choice="${choice.id}" ${open ? "" : 'aria-disabled="true"'}>${esc(choice.label)}</button>${open ? "" : `<span class="fine">${esc(choice.lockedText || tr("You need to find something first.", "Primero necesitas encontrar algo."))}</span>`}</li>`,
        )
        .join("")}</ul>`;
      return;
    }
    if (page.ending || !nextLinear(book, page.id)) {
      const label =
        {
          good: tr("A happy ending", "Un final feliz"),
          neutral: tr("An ending", "Un final"),
          open: tr("An open ending", "Un final abierto"),
        }[page.ending] || tr("The end", "Fin");
      box.innerHTML = `<div class="bk-play-end"><h2>${esc(tr("The End", "Fin"))}</h2><p>${esc(label)}</p>${adventure ? `<p class="fine">${esc(tr("You made", "Tomaste"))} ${P.state.trail.length} ${esc(tr("choices.", "decisiones."))}</p>` : ""}<div class="bk-btnrow"><button type="button" class="btn btn-primary" data-p="restart">${esc(tr("Play again", "Jugar otra vez"))}</button></div></div>`;
      return;
    }
    box.innerHTML = `<div class="bk-btnrow"><button type="button" class="btn btn-primary" data-p="next">${esc(tr("Turn the page", "Pasar la página"))} ${bkIcon("play")}</button></div>`;
  }

  function go(next, push = true) {
    if (push) P.history.push(P.state);
    P.state = next;
    if (!opts.preview) saveState(book.id, P.state, P.history.slice(-30));
    draw({ announce: true });
    $("[data-p-stage]")?.scrollIntoView?.({ block: "nearest" });
  }

  function popover(el, hs, gained) {
    $(".bk-play-pop")?.remove();
    const pop = document.createElement("div");
    pop.className = "bk-play-pop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", hs.label || tr("Clue", "Pista"));
    pop.innerHTML = `<strong>${esc(hs.label || tr("Look closer", "Mira de cerca"))}</strong>${hs.reveal ? `<p>${esc(hs.reveal)}</p>` : ""}${gained ? `<p class="bk-play-got">${bkIcon("check")} ${esc(tr("You found something!", "¡Encontraste algo!"))}</p>` : ""}<div class="bk-btnrow">${hs.reveal ? `<button type="button" class="btn small" data-pp="hear">${bkIcon("speaker")} ${esc(tr("Hear it", "Escucharlo"))}</button>` : ""}<button type="button" class="btn small ghost" data-pp="close">${esc(tr("Close", "Cerrar"))}</button></div>`;
    $("[data-p-stage]").append(pop);
    pop.querySelector("button")?.focus();
    pop.addEventListener("click", (e) => {
      const a = e.target.closest("[data-pp]")?.dataset.pp;
      if (a === "close") {
        pop.remove();
        el.focus?.();
      } else if (a === "hear" && "speechSynthesis" in window) {
        speechSynthesis.cancel();
        speechSynthesis.speak(new SpeechSynthesisUtterance(hs.reveal));
      }
    });
    pop.addEventListener("keydown", (e) => e.key === "Escape" && (pop.remove(), el.focus?.()));
  }

  function hotspot(el) {
    const page = pageOf();
    const e = page.elements.find((x) => x.id === el.dataset.hotspot);
    const hs = e?.hotspot;
    if (!hs) return;
    if (!hs.requires.every((r) => P.state.items.includes(r.item)))
      return (
        say(tr("You need something else first.", "Primero necesitas otra cosa.")),
        popover(
          el,
          {
            label: hs.label,
            reveal: tr("You need something else first.", "Primero necesitas otra cosa."),
          },
          false,
        )
      );
    const before = P.state.items.length;
    const next = collect(book, P.state, e.id);
    const gained = next.items.length > before;
    if (gained) {
      P.history.push(P.state);
      P.state = next;
      if (!opts.preview) saveState(book.id, P.state, P.history.slice(-30));
      inventory();
      drawChoices(page);
      say(tr("You found something.", "Encontraste algo."));
    }
    popover(el, hs, gained);
  }

  root.addEventListener("click", async (e) => {
    if (await sup.onClick(e, pageOf().id)) return;
    const hot = e.target.closest("[data-hotspot]");
    if (hot) return hotspot(hot);
    const ch = e.target.closest("[data-p-choice]");
    if (ch) {
      if (ch.getAttribute("aria-disabled") === "true")
        return say(
          tr(
            "That choice is locked. Look for a clue.",
            "Esa decisión está bloqueada. Busca una pista.",
          ),
        );
      return go(takeChoice(book, P.state, ch.dataset.pChoice));
    }
    const act = e.target.closest("[data-p]")?.dataset.p;
    if (act === "next")
      go({
        ...P.state,
        page: nextLinear(book, P.state.page),
        visited: [...new Set([...P.state.visited, P.state.page])],
      });
    else if (act === "back") {
      const prev = P.history.pop();
      if (prev) {
        P.state = prev;
        if (!opts.preview) saveState(book.id, P.state, P.history);
        draw({ announce: true });
      } else say(tr("You are at the start.", "Estás al principio."));
    } else if (act === "restart") {
      P.history = [];
      P.state = initState(book);
      if (!opts.preview) saveState(book.id, P.state, []);
      draw({ announce: true });
    } else if (act === "replay") {
      P.player?.reset();
      P.player?.play();
    } else if (act === "sound") {
      P.muted = !P.muted;
      e.target.closest("button").setAttribute("aria-pressed", String(!P.muted));
      say(P.muted ? tr("Sound off", "Sonido apagado") : tr("Sound on", "Sonido encendido"));
    } else if (act === "voices") {
      P.voices = !P.voices;
      e.target.closest("button").setAttribute("aria-pressed", String(P.voices));
      say(P.voices ? tr("Voices on", "Voces encendidas") : tr("Voices off", "Voces apagadas"));
    }
  });
  root.addEventListener("keydown", (e) => {
    const hot = e.target.closest?.("[data-hotspot]");
    if (hot && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      hotspot(hot);
    }
  });
  root.addEventListener("input", (e) => sup.onInput(e));
  root.addEventListener("change", (e) => sup.onChange(e));
  const onResize = () => draw();
  let rt = 0;
  const rs = () => {
    clearTimeout(rt);
    rt = setTimeout(onResize, 200);
  };
  window.addEventListener("resize", rs);

  void db;
  void resolveSupports;
  draw({ announce: false });
  return () => {
    P.destroyed = true;
    P.player?.destroy();
    sup.closePop();
    clearTimeout(rt);
    window.removeEventListener("resize", rs);
  };
}
