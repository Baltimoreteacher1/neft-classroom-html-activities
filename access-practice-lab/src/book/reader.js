// Book Studio reader: a book that looks and turns like a book. Single page or two-page spread, previous/next, page
// overview, fullscreen, keyboard and swipe, resume where you stopped, the author's own narration, and read-aloud.
//
// Read-aloud word highlighting uses the speech engine's word-boundary events and the CSS Custom Highlight API. When a
// voice sends no boundary events (several do not) the reader says so and highlights the text box being read instead:
// it never animates a fake word-by-word highlight that is not tied to the voice.
import * as db from "./db.js";
import { bkIcon } from "./icons.js";
import { FORMATS, newId, pageSpeech, readingOrder } from "./model.js";
import { esc, pageAltText, pageHTML, preloadMedia } from "./render.js";

const PREFS_KEY = "accessPracticeLab:v1:book-reader";
const loadPrefs = () => {
  try {
    return {
      rate: 1,
      voice: "",
      highlight: true,
      spread: "auto",
      motion: "auto",
      lowData: false,
      source: "author",
      ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"),
    };
  } catch {
    return {
      rate: 1,
      voice: "",
      highlight: true,
      spread: "auto",
      motion: "auto",
      lowData: false,
      source: "author",
    };
  }
};
const savePrefs = (p) => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {}
};

/**
 * Mount the reader. opts: { shared: boolean (opened from a link), review: boolean (teacher notes mode),
 * onSaveCopy(book), onSaveNotes(book) }.
 */
export async function mountReader(root, ctx, book, I, opts = {}) {
  await preloadMedia(book).catch(() => {});
  const tr = I.S;
  const lang = ctx.prefs?.lang === "es" ? "es" : "en";
  const R = {
    book,
    prefs: loadPrefs(),
    spread: 0,
    speaking: false,
    audio: null,
    boundarySeen: false,
    destroyed: false,
  };
  const rtl = book.dir === "rtl";
  const n = book.pages.length;
  const reduced = () =>
    R.prefs.motion === "reduce" ||
    (R.prefs.motion === "auto" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  // Spreads: the cover alone, then pairs (2-3, 4-5, …).
  const spreads = () => {
    if (!useSpread()) return book.pages.map((_, i) => [i]);
    const out = [[0]];
    for (let i = 1; i < n; i += 2) out.push(i + 1 < n ? [i, i + 1] : [i]);
    return out;
  };
  const useSpread = () =>
    R.prefs.spread === "single"
      ? false
      : R.prefs.spread === "spread"
        ? true
        : window.innerWidth >= 1000 && FORMATS[book.format].ratio <= 1;
  const spreadOf = (pageIndex) => spreads().findIndex((s) => s.includes(pageIndex));
  const start = opts.shared || opts.review ? 0 : Math.min(n - 1, db.getReadPage(book.id));
  R.spread = Math.max(0, spreadOf(start));

  root.innerHTML = `<div class="bk-reader${rtl ? " is-rtl" : ""}" data-bk-reader>
    <header class="bk-reader-bar">
      ${opts.shared ? `<a class="btn ghost small" href="/access-practice-lab/book-studio">${bkIcon("book")}<span>${esc(tr("Book Studio", "Book Studio"))}</span></a>` : `<a class="btn ghost small" href="/access-practice-lab/book-studio/edit/${book.id}">${bkIcon("draw")}<span>${esc(tr("Back to editing", "Volver a editar"))}</span></a>`}
      <h1 class="bk-reader-title" tabindex="-1">${esc(book.title)}</h1>
      <div class="bk-reader-tools">
        <button type="button" class="btn small btn-primary" data-r="read">${bkIcon("play")}<span>${esc(tr("Read to me", "Léeme"))}</span></button>
        <button type="button" class="bk-tbtn" data-r="overview" aria-label="${esc(tr("All pages", "Todas las páginas"))}" title="${esc(tr("All pages", "Todas las páginas"))}">${bkIcon("panel")}</button>
        <button type="button" class="bk-tbtn" data-r="layout" aria-label="${esc(tr("One page or two", "Una página o dos"))}" title="${esc(tr("One page or two", "Una página o dos"))}">${bkIcon(useSpread() ? "single" : "spread")}</button>
        <button type="button" class="bk-tbtn" data-r="fullscreen" aria-label="${esc(tr("Full screen", "Pantalla completa"))}" title="${esc(tr("Full screen", "Pantalla completa"))}">${bkIcon("fullscreen")}</button>
        <button type="button" class="bk-tbtn" data-r="settings" aria-label="${esc(tr("Reading settings", "Ajustes de lectura"))}" aria-expanded="false" title="${esc(tr("Reading settings", "Ajustes de lectura"))}">${bkIcon("settings")}</button>
      </div>
    </header>
    ${opts.shared ? `<p class="bk-reader-note">${esc(tr("You are reading a shared book. It is read-only.", "Estás leyendo un libro compartido. Es de solo lectura."))} ${book.remix ? `<button type="button" class="btn small" data-r="save-copy">${esc(tr("Save my own copy to remix", "Guardar mi copia para remezclar"))}</button>` : ""}</p>` : ""}
    <div class="bk-reader-settings" data-r-settings hidden></div>
    <div class="bk-reader-stage" data-r-stage>
      <button type="button" class="bk-turn bk-turn-prev" data-r="prev" aria-label="${esc(tr("Previous page", "Página anterior"))}">${rtl ? "›" : "‹"}</button>
      <div class="bk-book" data-r-book aria-live="polite"></div>
      <button type="button" class="bk-turn bk-turn-next" data-r="next" aria-label="${esc(tr("Next page", "Página siguiente"))}">${rtl ? "‹" : "›"}</button>
    </div>
    <footer class="bk-reader-foot"><span data-r-pos></span><span class="bk-reader-status" role="status" data-r-status></span></footer>
    ${opts.review ? `<section class="bk-review-panel" data-r-review aria-label="${esc(tr("Teacher notes", "Notas del docente"))}"></section>` : ""}
    <dialog class="bk-dialog" data-r-dialog aria-labelledby="bkROverview"></dialog>
  </div>`;
  const $ = (s) => root.querySelector(s);
  const stage = $("[data-r-book]");
  const status = (msg) => {
    $("[data-r-status]").textContent = msg;
  };

  function sizeBook() {
    const pages = spreads()[R.spread].length;
    const ratio = FORMATS[book.format].ratio * (useSpread() ? 2 : 1);
    const r = $("[data-r-stage]").getBoundingClientRect();
    const availW = Math.max(240, r.width - 120);
    const availH = Math.max(240, window.innerHeight - r.top - 70);
    const w = Math.min(availW, availH * ratio, 1500);
    stage.style.width = `${Math.floor(w)}px`;
    stage.style.setProperty("--pages", pages);
  }

  function render(direction = 0) {
    const s = spreads();
    R.spread = Math.max(0, Math.min(s.length - 1, R.spread));
    const idx = s[R.spread];
    const pagesHTML = idx
      .map((i) => {
        const p = book.pages[i];
        const label =
          i === 0 ? tr("Cover", "Portada") : `${tr("Page", "Página")} ${i + 1} ${tr("of", "de")} ${n}`;
        const alt = pageAltText(p);
        return `<div class="bk-leaf${idx.length === 2 ? (i === idx[0] ? " is-left" : " is-right") : ""}" data-leaf="${i}">${pageHTML(book, p, { mode: R.prefs.lowData ? "thumb" : "read", lang, label })}${p.narration ? `<button type="button" class="bk-narr" data-r="narration" data-page="${i}">${bkIcon("play")} ${esc(tr("Author's narration", "Narración del autor"))}</button>` : ""}${alt ? `<p class="sr-only">${esc(alt)}</p>` : ""}</div>`;
      })
      .join("");
    stage.className = `bk-book${idx.length === 2 ? " is-spread" : ""}${idx[0] === 0 ? " is-cover" : ""}`;
    stage.innerHTML = pagesHTML;
    if (direction && !reduced()) {
      stage.classList.add(direction > 0 !== rtl ? "turn-fwd" : "turn-back");
      stage.addEventListener(
        "animationend",
        () => stage.classList.remove("turn-fwd", "turn-back"),
        { once: true },
      );
    }
    sizeBook();
    $("[data-r-pos]").textContent =
      idx.length === 2
        ? `${tr("Pages", "Páginas")} ${idx[0] + 1}–${idx[1] + 1} ${tr("of", "de")} ${n}`
        : idx[0] === 0
          ? `${tr("Cover", "Portada")} · ${n} ${tr("pages", "páginas")}`
          : `${tr("Page", "Página")} ${idx[0] + 1} ${tr("of", "de")} ${n}`;
    $('[data-r="prev"]').disabled = R.spread === 0;
    $('[data-r="next"]').disabled = R.spread === s.length - 1;
    if (!opts.shared && !opts.review) db.setReadPage(book.id, idx[0]);
    if (opts.review) renderReview();
  }

  function go(delta) {
    const s = spreads();
    const next = Math.max(0, Math.min(s.length - 1, R.spread + delta));
    if (next === R.spread) return;
    stopSpeech();
    R.spread = next;
    render(delta);
  }
  R.go = go;

  // ── read aloud ──
  function stopSpeech() {
    R.speaking = false;
    try {
      speechSynthesis.cancel();
    } catch {}
    R.audio?.pause();
    R.audio = null;
    CSS.highlights?.delete("bk-word");
    stage.querySelectorAll(".is-reading").forEach((e) => e.classList.remove("is-reading"));
    const b = $('[data-r="read"]');
    if (b) b.innerHTML = `${bkIcon("play")}<span>${esc(tr("Read to me", "Léeme"))}</span>`;
  }
  const voicesFor = (code) => {
    const all = speechSynthesis.getVoices();
    const base = (code || lang).slice(0, 2);
    return all.filter((v) => v.lang.toLowerCase().startsWith(base));
  };
  /** Text nodes of an element with their offsets in the spoken string. */
  function textMap(node) {
    const map = [];
    let text = "";
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let prevBlock = null;
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const block = t.parentElement.closest("p, li, h2, h3, div");
      if (prevBlock && block !== prevBlock) text += " ";
      prevBlock = block;
      map.push({ node: t, start: text.length });
      text += t.nodeValue;
    }
    return { text, map };
  }
  function highlightAt(map, charIndex, length) {
    if (!window.Highlight || !CSS.highlights) return false;
    const pick = (pos) => {
      let m = map[0];
      for (const x of map) if (x.start <= pos) m = x;
      return { node: m.node, offset: Math.max(0, Math.min(m.node.length, pos - m.start)) };
    };
    const a = pick(charIndex);
    const b = pick(charIndex + length);
    const range = new Range();
    try {
      range.setStart(a.node, a.offset);
      range.setEnd(b.node, b.offset);
      CSS.highlights.set("bk-word", new Highlight(range));
      return true;
    } catch {
      return false;
    }
  }
  function speakItem(item, node) {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) return resolve("none");
      const { text, map } = node ? textMap(node) : { text: item.text, map: [] };
      const u = new SpeechSynthesisUtterance(text);
      const code = item.lang || (book.lang === "es" ? "es" : lang === "es" ? "es-US" : "en-US");
      u.lang = code;
      u.rate = R.prefs.rate;
      const voices = voicesFor(code);
      const chosen =
        voices.find((v) => v.voiceURI === R.prefs.voice) ||
        voices.find((v) => v.localService) ||
        voices[0];
      if (chosen) u.voice = chosen;
      node?.closest(".bk-el")?.classList.add("is-reading");
      let gotBoundary = false;
      u.onboundary = (e) => {
        if (e.name !== "word" || !R.prefs.highlight || !map.length) return;
        gotBoundary = true;
        R.boundarySeen = true;
        const len = e.charLength || (/^\S+/.exec(text.slice(e.charIndex)) || [""])[0].length;
        highlightAt(map, e.charIndex, len);
      };
      u.onend = u.onerror = () => {
        node?.closest(".bk-el")?.classList.remove("is-reading");
        CSS.highlights?.delete("bk-word");
        if (R.prefs.highlight && !gotBoundary && !R.boundarySeen && map.length)
          status(
            tr(
              "This voice does not report words as it reads, so the reader highlights the whole text box instead.",
              "Esta voz no indica las palabras mientras lee, así que el lector resalta todo el cuadro de texto.",
            ),
          );
        resolve("done");
      };
      speechSynthesis.speak(u);
    });
  }
  function playUrl(url) {
    return new Promise((resolve) => {
      if (!url) return resolve("none");
      R.audio?.pause();
      const a = new Audio(url);
      a.playbackRate = Math.max(0.5, Math.min(2, R.prefs.rate));
      R.audio = a;
      a.onended = a.onerror = () => resolve("done");
      a.play().catch(() => resolve("blocked"));
    });
  }
  async function readSpread() {
    if (R.speaking) return stopSpeech();
    R.speaking = true;
    $('[data-r="read"]').innerHTML = `${bkIcon("stop")}<span>${esc(tr("Stop", "Detener"))}</span>`;
    const token = {};
    R.token = token;
    while (R.speaking && R.token === token) {
      for (const i of spreads()[R.spread]) {
        const p = book.pages[i];
        if (!R.speaking) break;
        if (p.narration && R.prefs.source === "author") {
          stage.querySelector(`[data-leaf="${i}"]`)?.classList.add("is-reading");
          await playUrl(db.cachedUrl(p.narration));
          stage.querySelector(`[data-leaf="${i}"]`)?.classList.remove("is-reading");
          continue;
        }
        for (const item of pageSpeech(p, book.dir)) {
          if (!R.speaking) break;
          const node = stage.querySelector(`[data-leaf="${i}"] [data-el="${item.id}"] .bk-txt`);
          await speakItem(item, node);
        }
      }
      if (!R.speaking || R.spread >= spreads().length - 1) break;
      R.spread++;
      render(1);
      await new Promise((r) => setTimeout(r, reduced() ? 150 : 650));
    }
    stopSpeech();
  }

  // ── panels ──
  function settingsHTML() {
    const voices = "speechSynthesis" in window ? voicesFor(book.lang === "es" ? "es" : lang) : [];
    const p = R.prefs;
    return `<div class="bk-reader-settings-inner">
      <label class="bk-field"><span>${esc(tr("Reading speed", "Velocidad de lectura"))} <output data-r-rate-out>${p.rate.toFixed(1)}×</output></span><input type="range" min="0.5" max="1.6" step="0.1" value="${p.rate}" data-rp="rate" /></label>
      ${voices.length ? `<label class="bk-field"><span>${esc(tr("Voice", "Voz"))}</span><select data-rp="voice"><option value="">${esc(tr("Automatic", "Automática"))}</option>${voices.map((v) => `<option value="${esc(v.voiceURI)}" ${p.voice === v.voiceURI ? "selected" : ""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("")}</select></label>` : `<p class="fine">${esc(tr("This device has no voice for this language. Recordings in the book still play.", "Este dispositivo no tiene voz para este idioma. Las grabaciones del libro sí se reproducen."))}</p>`}
      <label class="bk-check"><input type="checkbox" data-rp="highlight" ${p.highlight ? "checked" : ""} /> ${esc(tr("Highlight words while reading", "Resaltar palabras al leer"))}</label>
      <label class="bk-field"><span>${esc(tr("When a page has the author's recording", "Cuando la página tiene la grabación del autor"))}</span><select data-rp="source"><option value="author" ${p.source === "author" ? "selected" : ""}>${esc(tr("Play the author's recording", "Reproducir la grabación del autor"))}</option><option value="voice" ${p.source === "voice" ? "selected" : ""}>${esc(tr("Use the computer voice", "Usar la voz de la computadora"))}</option></select></label>
      <label class="bk-field"><span>${esc(tr("Pages", "Páginas"))}</span><select data-rp="spread"><option value="auto" ${p.spread === "auto" ? "selected" : ""}>${esc(tr("Fit the screen", "Ajustar a la pantalla"))}</option><option value="single" ${p.spread === "single" ? "selected" : ""}>${esc(tr("One page at a time", "Una página a la vez"))}</option><option value="spread" ${p.spread === "spread" ? "selected" : ""}>${esc(tr("Two pages (spread)", "Dos páginas"))}</option></select></label>
      <label class="bk-field"><span>${esc(tr("Page-turn motion", "Movimiento al pasar página"))}</span><select data-rp="motion"><option value="auto" ${p.motion === "auto" ? "selected" : ""}>${esc(tr("Follow my device setting", "Seguir el ajuste del dispositivo"))}</option><option value="reduce" ${p.motion === "reduce" ? "selected" : ""}>${esc(tr("Reduce motion", "Reducir movimiento"))}</option><option value="full" ${p.motion === "full" ? "selected" : ""}>${esc(tr("Turn pages", "Pasar páginas"))}</option></select></label>
      <label class="bk-check"><input type="checkbox" data-rp="lowData" ${p.lowData ? "checked" : ""} /> ${esc(tr("Save data: do not load videos until I press play", "Ahorrar datos: no cargar videos hasta que presione reproducir"))}</label>
    </div>`;
  }

  function overview() {
    const d = $("[data-r-dialog]");
    d.innerHTML = `<form method="dialog" class="bk-dialog-inner"><header class="bk-dialog-head"><h2 id="bkROverview">${esc(tr("All pages", "Todas las páginas"))}</h2><button class="bk-tbtn" value="close" aria-label="${esc(tr("Close", "Cerrar"))}">${bkIcon("close")}</button></header><ol class="bk-overview">${book.pages.map((p, i) => `<li><button type="button" data-r-goto="${i}" aria-label="${esc(i === 0 ? tr("Cover", "Portada") : `${tr("Page", "Página")} ${i + 1}`)}"><span class="bk-thumb-page" aria-hidden="true">${pageHTML(book, p, { mode: "thumb" })}</span><span>${i === 0 ? esc(tr("Cover", "Portada")) : i + 1}</span></button></li>`).join("")}</ol></form>`;
    d.showModal();
  }

  function renderReview() {
    const box = $("[data-r-review]");
    if (!box) return;
    const idx = spreads()[R.spread];
    box.innerHTML = `<h2>${bkIcon("feedback")} ${esc(tr("Teacher notes", "Notas del docente"))}</h2>
      ${idx
        .map((i) => {
          const p = book.pages[i];
          const notes = book.feedback.filter((f) => f.pageId === p.id);
          return `<div class="bk-review-page"><h3>${i === 0 ? esc(tr("Cover", "Portada")) : `${esc(tr("Page", "Página"))} ${i + 1}`}</h3>${notes.length ? `<ul class="bk-notes">${notes.map((f) => `<li><p>${esc(f.text)}</p><button type="button" class="btn small ghost" data-r-delnote="${f.id}">${esc(tr("Remove", "Quitar"))}</button></li>`).join("")}</ul>` : ""}<label class="bk-field"><span>${esc(tr("Note for this page (specific and kind: what works, one next step)", "Nota para esta página (específica y amable: qué funciona, un siguiente paso)"))}</span><textarea rows="2" maxlength="600" data-r-note="${p.id}"></textarea></label><button type="button" class="btn small" data-r-addnote="${p.id}">${esc(tr("Add note", "Agregar nota"))}</button></div>`;
        })
        .join("")}
      <div class="bk-btnrow"><button type="button" class="btn btn-primary" data-r="return-book">${esc(tr("Return to student (download the book with my notes)", "Devolver al estudiante (descargar el libro con mis notas)"))}</button></div>
      <p class="fine">${esc(tr("Notes stay on this device until you return the book file. The student opens it from My books → Open a book file and sees each note on its page.", "Las notas se quedan en este dispositivo hasta que devuelva el archivo. El estudiante lo abre desde Mis libros → Abrir un archivo de libro y ve cada nota en su página."))}</p>`;
  }

  // ── events ──
  root.addEventListener("click", async (e) => {
    const t = e.target;
    const goto = t.closest("[data-r-goto]");
    if (goto) {
      $("[data-r-dialog]").close();
      R.spread = spreadOf(Number(goto.dataset.rGoto));
      render(0);
      $("[data-r-book]").focus?.();
      return;
    }
    const play = t.closest("[data-play-media]");
    if (play) {
      stopSpeech();
      await playUrl(db.cachedUrl(play.dataset.playMedia));
      return;
    }
    const add = t.closest("[data-r-addnote]");
    if (add) {
      const ta = root.querySelector(`[data-r-note="${add.dataset.rAddnote}"]`);
      const text = ta.value.trim();
      if (!text) return ta.focus();
      book.feedback.push({
        id: newId("f"),
        pageId: add.dataset.rAddnote,
        text,
        by: tr("Teacher", "Docente"),
        at: new Date().toISOString(),
        done: false,
      });
      await opts.onSaveNotes?.(book);
      renderReview();
      status(tr("Note added.", "Nota agregada."));
      return;
    }
    const del = t.closest("[data-r-delnote]");
    if (del) {
      book.feedback = book.feedback.filter((f) => f.id !== del.dataset.rDelnote);
      await opts.onSaveNotes?.(book);
      renderReview();
      return;
    }
    const act = t.closest("[data-r]")?.dataset.r;
    if (!act) return;
    if (act === "prev") go(-1);
    else if (act === "next") go(1);
    else if (act === "read") readSpread();
    else if (act === "overview") overview();
    else if (act === "narration") {
      stopSpeech();
      await playUrl(
        db.cachedUrl(book.pages[Number(t.closest("[data-page]").dataset.page)].narration),
      );
    } else if (act === "layout") {
      R.prefs.spread = useSpread() ? "single" : "spread";
      savePrefs(R.prefs);
      const first = spreads()[R.spread]?.[0] ?? 0;
      R.spread = spreadOf(first);
      t.closest("[data-r]").innerHTML = bkIcon(useSpread() ? "single" : "spread");
      render(0);
    } else if (act === "fullscreen") {
      const el = root.querySelector("[data-bk-reader]");
      if (document.fullscreenElement) document.exitFullscreen?.();
      else
        el.requestFullscreen?.().catch(() =>
          status(
            tr(
              "Full screen is not available here.",
              "La pantalla completa no está disponible aquí.",
            ),
          ),
        );
    } else if (act === "settings") {
      const panel = $("[data-r-settings]");
      panel.hidden = !panel.hidden;
      t.closest("[data-r]").setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) panel.innerHTML = settingsHTML();
    } else if (act === "save-copy") opts.onSaveCopy?.(book);
    else if (act === "return-book") opts.onReturn?.(book);
  });
  root.addEventListener("input", (e) => {
    const k = e.target.dataset?.rp;
    if (!k) return;
    const v =
      e.target.type === "checkbox"
        ? e.target.checked
        : k === "rate"
          ? Number(e.target.value)
          : e.target.value;
    R.prefs[k] = v;
    savePrefs(R.prefs);
    if (k === "rate") $("[data-r-rate-out]").textContent = `${v.toFixed(1)}×`;
    if (k === "spread" || k === "lowData") {
      const first = spreads()[R.spread]?.[0] ?? 0;
      R.spread = spreadOf(first);
      render(0);
    }
  });
  const onKey = (e) => {
    const dlg = root.querySelector("[data-r-dialog]");
    if (e.key === "Escape" && dlg?.open) {
      e.preventDefault();
      dlg.close();
      return;
    }
    if (e.target.closest("input, textarea, select, dialog")) return;
    const fwd = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    if (
      e.key === fwd ||
      e.key === "PageDown" ||
      (e.key === " " && !e.target.closest("button, a"))
    ) {
      e.preventDefault();
      go(1);
    } else if (e.key === back || e.key === "PageUp") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "Home") {
      R.spread = 0;
      render(-1);
    } else if (e.key === "End") {
      R.spread = spreads().length - 1;
      render(1);
    }
  };
  root.addEventListener("keydown", onKey);
  // Swipe to turn.
  let sx = null;
  const st = $("[data-r-stage]");
  st.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") sx = { x: e.clientX, y: e.clientY };
  });
  st.addEventListener("pointerup", (e) => {
    if (!sx) return;
    const dx = e.clientX - sx.x;
    const dy = e.clientY - sx.y;
    sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 !== rtl ? 1 : -1);
  });
  const onResize = () => sizeBook();
  window.addEventListener("resize", onResize);
  if ("speechSynthesis" in window)
    speechSynthesis.onvoiceschanged = () =>
      !$("[data-r-settings]").hidden && ($("[data-r-settings]").innerHTML = settingsHTML());

  // Bring the book into view under the sticky site header.
  const header = document.querySelector(".lab-top");
  const headerH = header && getComputedStyle(header).position !== "static" ? header.getBoundingClientRect().height : 0;
  window.scrollTo({ top: Math.max(0, root.getBoundingClientRect().top + window.scrollY - headerH - 6) });
  render(0);
  requestAnimationFrame(() => sizeBook());
  $(".bk-reader-title")?.focus({ preventScroll: true });
  return () => {
    R.destroyed = true;
    stopSpeech();
    window.removeEventListener("resize", onResize);
  };
}

/** Reading order check for tests: the speech order of a page (exported for node tests through model.pageSpeech). */
export const _readingOrder = readingOrder;
