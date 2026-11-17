// Book Studio editor: top bar, Add toolbar, page list, the page canvas and the inspector. The canvas is the shared
// page renderer in "edit" mode plus a selection frame. Pointer users drag, resize and rotate; keyboard users Tab to
// any element, move it with the arrow keys and set exact position, size and rotation in the inspector.
import * as db from "./db.js";
import { createEditorState } from "./editor-core.js";
import { startDrawing, strokesNear } from "./editor-media.js";
import {
  inspectorHTML,
  onInspectorClick,
  onInspectorInput,
  onInspectorChange,
} from "./editor-panels.js";
import { addBarHTML, onAddBar } from "./editor-add.js";
import { dockHTML, makeEditorSupportHost, onDirectorSubmit, onDockClick, onDockInput, stageBarHTML } from "./ui-story.js";
import { isTeacher, setTeacher } from "./lang/ui-instructor.js";
import { pushProgress, refreshSupports } from "./lang/class-sync.js";
import { mountCoach } from "./editor-coach.js";
import { bkIcon } from "./icons.js";
import { FORMATS, makeElement, plainText } from "./model.js";
import { esc, pageHTML, preloadMedia } from "./render.js";
import { sanitizeHtml, textToParagraphs } from "./sanitize.js";
import { pathwayBannerHTML } from "../pathways/banner.js";
import { toHtml } from "../util.js";

const BASE = "/access-practice-lab";
const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const KEEP_RATIO = new Set(["image", "art", "video"]);

/** Build the editor inside `root` for an already-loaded book. Returns a destroy function. */
export async function mountEditor(root, ctx, book, I) {
  await preloadMedia(book);
  const tr = I.S;
  const E = {
    I,
    ctx,
    root,
    zoom: "fit",
    drawing: null, // { tool: { color, size, erase }, stop }
    pendingDelete: null,
    panel: "props",
    typingTimer: 0,
    stage: "create",
    muted: true,
    voices: false,
    player: null,
    coach: null,
  };
  const core = createEditorState(book, {
    onChange: ({ render }) => render && renderAll(),
    onStatus: () => renderStatus(),
    onConflict: (stored) => showConflict(stored),
    onCommit: () => E.collab?.nudge(),
  });
  E.core = core;
  const { S } = core;
  db.setLast(S.book.id);
  db.announceEditing(S.book.id);

  root.innerHTML = `<div class="bk-editor" data-bk-editor dir="ltr">
    <header class="bk-topbar">
      <a class="btn ghost small bk-back" href="${BASE}/book-studio">${bkIcon("book")}<span>${esc(tr("My books", "Mis libros"))}</span></a>
      <label class="bk-title-field"><span class="sr-only">${esc(tr("Book title", "Título del libro"))}</span><input data-bk-title maxlength="80" value="${esc(S.book.title)}" /></label>
      <span class="bk-save" role="status" aria-live="polite" data-bk-save></span>
      <div class="bk-top-actions">
        <button type="button" class="bk-tbtn" data-bk-act="undo" aria-label="${esc(tr("Undo", "Deshacer"))}" title="${esc(tr("Undo (Ctrl+Z)", "Deshacer (Ctrl+Z)"))}">${bkIcon("undo")}</button>
        <button type="button" class="bk-tbtn" data-bk-act="redo" aria-label="${esc(tr("Redo", "Rehacer"))}" title="${esc(tr("Redo (Ctrl+Shift+Z)", "Rehacer (Ctrl+Mayús+Z)"))}">${bkIcon("redo")}</button>
        <button type="button" class="bk-tbtn" data-bk-act="teacher" aria-pressed="${isTeacher()}" aria-label="${esc(tr("Teacher tools", "Herramientas del docente"))}" title="${esc(tr("Teacher tools (language supports)", "Herramientas del docente (apoyos de lenguaje)"))}">${bkIcon("support")}</button>
        <button type="button" class="bk-tbtn" data-bk-act="history" aria-label="${esc(tr("Version history", "Historial de versiones"))}" title="${esc(tr("Version history", "Historial de versiones"))}">${bkIcon("history")}</button>
        <a class="btn small" data-bk-read href="${BASE}/book-studio/read/${S.book.id}">${bkIcon("eye")}<span>${esc(tr("Read", "Leer"))}</span></a>
        <button type="button" class="btn small" data-bk-act="share">${bkIcon("share")}<span>${esc(tr("Share & export", "Compartir y exportar"))}</span></button>
        <button type="button" class="btn btn-primary small" data-bk-act="finish">${bkIcon("check")}<span>${esc(tr("Finish", "Terminar"))}</span></button>
      </div>
    </header>
    ${toHtml(pathwayBannerHTML(ctx))}
    <div class="bk-collab-bar" data-bk-collab role="group" aria-label="${esc(tr("Writing together", "Escribir juntos"))}" hidden></div>
    <div class="bk-banner" data-bk-banner hidden></div>
    <div data-bk-stagebar>${stageBarHTML(E)}</div>
    <div data-bk-addwrap>${addBarHTML(E)}</div>
    <div class="bk-workspace">
      <nav class="bk-pages" aria-label="${esc(tr("Pages", "Páginas"))}" data-bk-pages></nav>
      <section class="bk-stage" data-bk-stage aria-label="${esc(tr("Page editor", "Editor de páginas"))}">
        <div class="bk-stage-scroll" data-bk-scroll><div class="bk-canvas" data-bk-canvas></div></div>
        <section class="bk-dock" data-bk-dock aria-label="${esc(tr("Tools for this step", "Herramientas de este paso"))}"></section>
        <div class="bk-zoom" role="group" aria-label="${esc(tr("Zoom", "Zoom"))}">
          <button type="button" class="bk-tbtn" data-bk-zoom="out" aria-label="${esc(tr("Zoom out", "Alejar"))}">${bkIcon("zoomOut")}</button>
          <button type="button" class="bk-tbtn bk-zoom-label" data-bk-zoom="fit" aria-label="${esc(tr("Fit page", "Ajustar página"))}"></button>
          <button type="button" class="bk-tbtn" data-bk-zoom="in" aria-label="${esc(tr("Zoom in", "Acercar"))}">${bkIcon("zoomIn")}</button>
        </div>
      </section>
      <aside class="bk-inspector" data-bk-inspector aria-label="${esc(tr("Properties", "Propiedades"))}"></aside>
    </div>
    <p class="sr-only" aria-live="polite" data-bk-live></p>
    <dialog class="bk-dialog" data-bk-dialog aria-labelledby="bkDialogTitle"></dialog>
    <input type="file" hidden data-bk-file />
  </div>`;

  const $ = (sel) => root.querySelector(sel);
  const canvas = $("[data-bk-canvas]");
  const scroller = $("[data-bk-scroll]");
  E.$ = $;
  E.say = (msg) => {
    const live = $("[data-bk-live]");
    live.textContent = "";
    setTimeout(() => {
      live.textContent = msg;
    }, 30);
  };
  E.renderAll = () => renderAll();
  E.renderCanvas = () => renderCanvas();
  E.renderInspector = () => renderInspector();
  const unmountCoach = mountCoach(E);
  E.dialog = $("[data-bk-dialog]");
  E.dialog.__bkEditor = E;
  E.pickFile = (accept) =>
    new Promise((resolve) => {
      const input = $("[data-bk-file]");
      input.value = "";
      input.accept = accept;
      input.onchange = () => resolve(input.files?.[0] || null);
      input.click();
    });

  // ── rendering ──
  function pageWidth() {
    const fmt = FORMATS[S.book.format];
    if (E.zoom !== "fit") return Math.round(E.zoom * 800);
    const r = scroller.getBoundingClientRect();
    const availW = Math.max(240, r.width - 32);
    // Stacked (phone/tablet) layout: the stage's height follows its content, so fit to the width and the viewport.
    const stacked = window.innerWidth <= 860;
    const availH = stacked ? window.innerHeight * 0.72 : Math.max(240, (r.height || window.innerHeight - 220) - 32);
    return Math.floor(Math.min(availW, availH * fmt.ratio, 1100));
  }

  function selectionHTML(el) {
    if (!el || el.locked)
      return el
        ? `<div class="bk-sel is-locked" style="left:${el.x}%;top:${el.y}%;width:${el.w}%;height:${el.h}%;transform:rotate(${el.rot}deg)" aria-hidden="true"></div>`
        : "";
    const h = HANDLES.map((d) => `<span class="bk-h bk-h-${d}" data-handle="${d}"></span>`).join(
      "",
    );
    return `<div class="bk-sel" style="left:${el.x}%;top:${el.y}%;width:${el.w}%;height:${el.h}%;transform:rotate(${el.rot}deg)" aria-hidden="true">${h}<span class="bk-h bk-h-rot" data-handle="rot"></span></div>`;
  }

  function elementLabel(el, i, n) {
    const kind = {
      text: tr("Text box", "Cuadro de texto"),
      bubble: tr("Speech bubble", "Globo de diálogo"),
      image: tr("Picture", "Imagen"),
      art: tr("Illustration", "Ilustración"),
      shape: tr("Shape", "Forma"),
      panel: tr("Comic panel", "Viñeta"),
      audio: tr("Recording", "Grabación"),
      video: tr("Video", "Video"),
      drawing: tr("Drawing", "Dibujo"),
    }[el.type];
    const words =
      el.type === "text" || el.type === "bubble"
        ? plainText(el.html).slice(0, 60) || tr("empty", "vacío")
        : el.alt || el.label || el.title || "";
    return `${kind} ${i + 1} ${tr("of", "de")} ${n}${words ? `: ${words}` : ""}`;
  }

  function renderCanvas() {
    const page = core.page();
    const w = pageWidth();
    canvas.style.width = `${w}px`;
    const label = `${tr("Page", "Página")} ${S.pageIndex + 1}`;
    canvas.innerHTML =
      pageHTML(S.book, page, {
        mode: "edit",
        lang: ctx.prefs?.lang === "es" ? "es" : "en",
        label,
      }) + selectionHTML(core.selectedEl());
    // Every element is reachable by Tab, named for screen readers.
    const els = page.elements;
    canvas.querySelectorAll(".bk-el").forEach((node) => {
      const i = els.findIndex((e) => e.id === node.dataset.el);
      node.tabIndex = 0;
      node.setAttribute("role", "button");
      node.setAttribute("aria-label", elementLabel(els[i], i, els.length));
      if (node.dataset.el === S.selected) node.setAttribute("aria-pressed", "true");
    });
    if (S.editingText) beginTextEdit(S.editingText, { keepCaret: true });
    if (E.drawing) mountDrawSurface();
    E.collab?.decorate();
    $(".bk-zoom-label").textContent =
      E.zoom === "fit" ? tr("Fit", "Ajustar") : `${Math.round(E.zoom * 100)}%`;
  }

  function renderPages() {
    const nav = $("[data-bk-pages]");
    const n = S.book.pages.length;
    const fb = (pid) => S.book.feedback.filter((f) => f.pageId === pid && !f.done).length;
    nav.innerHTML = `<h2 class="bk-panel-title">${esc(tr("Pages", "Páginas"))} <span class="bk-count">${n}</span></h2>
      <ol class="bk-page-list" data-bk-pagelist>${S.book.pages
        .map(
          (
            p,
            i,
          ) => `<li class="bk-page-item${i === S.pageIndex ? " is-current" : ""}" draggable="true" data-page-index="${i}">
            <button type="button" class="bk-thumb" data-bk-page="${i}" aria-current="${i === S.pageIndex ? "page" : "false"}" aria-label="${esc(`${i === 0 ? tr("Cover", "Portada") : `${tr("Page", "Página")} ${i + 1}`}${fb(p.id) ? `, ${fb(p.id)} ${tr("teacher notes", "notas del docente")}` : ""}`)}">
              <span class="bk-thumb-page" aria-hidden="true">${pageHTML(S.book, p, { mode: "thumb" })}</span>
              <span class="bk-thumb-n">${i === 0 ? esc(tr("Cover", "Portada")) : i + 1}${fb(p.id) ? `<span class="bk-fb-dot" aria-hidden="true">${fb(p.id)}</span>` : ""}</span>
            </button>
            ${
              i === S.pageIndex
                ? `<span class="bk-page-tools">
              <button type="button" class="bk-tbtn" data-bk-page-move="-1" ${i === 0 ? "disabled" : ""} aria-label="${esc(tr("Move page earlier", "Mover página antes"))}">↑</button>
              <button type="button" class="bk-tbtn" data-bk-page-move="1" ${i === n - 1 ? "disabled" : ""} aria-label="${esc(tr("Move page later", "Mover página después"))}">↓</button>
              <button type="button" class="bk-tbtn" data-bk-act="dup-page" aria-label="${esc(tr("Duplicate page", "Duplicar página"))}">${bkIcon("copy")}</button>
              <button type="button" class="bk-tbtn" data-bk-act="del-page" ${n <= 1 ? "disabled" : ""} aria-label="${esc(tr("Delete page", "Eliminar página"))}">${bkIcon("trash")}</button>
            </span>`
                : ""
            }
            ${E.pendingDelete === i ? `<span class="bk-confirm" role="group" aria-label="${esc(tr("Confirm delete", "Confirmar eliminación"))}"><span>${esc(tr("Delete this page?", "¿Eliminar esta página?"))}</span><button type="button" class="btn small danger" data-bk-act="del-page-yes">${esc(tr("Delete", "Eliminar"))}</button><button type="button" class="btn small ghost" data-bk-act="del-page-no">${esc(tr("Keep", "Conservar"))}</button></span>` : ""}
          </li>`,
        )
        .join("")}</ol>
      <details class="bk-menu bk-add-page">
        <summary class="btn small">${bkIcon("plus")}<span>${esc(tr("Add page", "Agregar página"))}</span></summary>
        <div class="bk-menu-body">
          <button type="button" data-bk-newpage="blank">${esc(tr("Blank page", "Página en blanco"))}</button>
          <button type="button" data-bk-newpage="text">${esc(tr("Picture + words", "Imagen + palabras"))}</button>
          <button type="button" data-bk-newpage="heading">${esc(tr("Heading + paragraph", "Encabezado + párrafo"))}</button>
          <button type="button" data-bk-newpage="two">${esc(tr("Two columns", "Dos columnas"))}</button>
          <button type="button" data-bk-newpage="comic-three">${esc(tr("Comic: 3 panels", "Cómic: 3 viñetas"))}</button>
          <button type="button" data-bk-newpage="comic-four">${esc(tr("Comic: 4 panels", "Cómic: 4 viñetas"))}</button>
          <button type="button" data-bk-newpage="comic-six">${esc(tr("Comic: 6 panels", "Cómic: 6 viñetas"))}</button>
          <button type="button" data-bk-act="dup-page">${esc(tr("Copy of this page", "Copia de esta página"))}</button>
        </div>
      </details>`;
  }

  function renderInspector() {
    E.collab?.renderBar?.();
    $("[data-bk-inspector]").innerHTML = inspectorHTML(E);
  }

  function renderStatus() {
    const st = S.status;
    const el = $("[data-bk-save]");
    if (!el) return;
    const time = st.at
      ? new Date(st.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : "";
    el.dataset.state = st.state;
    el.innerHTML =
      st.state === "saving"
        ? esc(tr("Saving…", "Guardando…"))
        : st.state === "pending"
          ? esc(tr("Saving soon…", "Se guardará en un momento…"))
          : st.state === "error"
            ? `${esc(tr("Not saved.", "No se guardó."))} <button type="button" class="linklike" data-bk-act="retry-save">${esc(tr("Try again", "Intentar de nuevo"))}</button>`
            : st.state === "conflict"
              ? esc(tr("Changed in another tab", "Cambió en otra pestaña"))
              : `${bkIcon("check")} ${esc(tr("Saved on this device", "Guardado en este dispositivo"))}${time ? ` · ${time}` : ""}`;
    $('[data-bk-act="undo"]').disabled = !core.canUndo();
    $('[data-bk-act="redo"]').disabled = !core.canRedo();
  }

  function renderDock() {
    const dock = $("[data-bk-dock]");
    if (!dock) return;
    // Never replace a field the person is typing in.
    const a = document.activeElement;
    if (a && dock.contains(a) && a.matches("input:not([type=checkbox]):not([type=radio]), textarea") && !E.forceDock) return;
    E.spHost = E.spHost || makeEditorSupportHost(E);
    const keep = dock.contains(a) ? { sel: a.getAttribute("data-sp") || a.getAttribute("data-dock") || a.getAttribute("data-stage"), tag: a.tagName } : null;
    const before = dock.offsetHeight;
    dock.innerHTML = dockHTML(E);
    // The dock and the canvas share the stage: refit the page when the dock grows or shrinks.
    if (E.zoom === "fit" && dock.offsetHeight !== before) requestAnimationFrame(() => renderCanvas());
    if (keep?.sel) dock.querySelector(`[data-sp="${keep.sel}"], [data-dock="${keep.sel}"]`)?.focus({ preventScroll: true });
  }
  E.renderDock = renderDock;
  function renderStage() {
    $("[data-bk-stagebar]").innerHTML = stageBarHTML(E);
    const add = $("[data-bk-addwrap]");
    add.hidden = E.stage !== "create";
    E.forceDock = true;
    renderDock();
    E.forceDock = false;
    $('[data-stage="' + E.stage + '"]')?.focus({ preventScroll: true });
    E.say(tr("Now: " + E.stage, "Ahora: " + E.stage));
  }
  E.renderStage = renderStage;

  function renderAll() {
    renderPages();
    renderCanvas();
    renderInspector();
    renderDock();
    renderStatus();
    const t = $("[data-bk-title]");
    if (t && document.activeElement !== t) t.value = S.book.title;
  }
  E.banner = (htmlStr) => {
    const b = $("[data-bk-banner]");
    b.hidden = !htmlStr;
    b.innerHTML = htmlStr || "";
  };

  function showConflict(stored) {
    E.banner(`<p>${bkIcon("history")} <strong>${esc(tr("This book was changed in another tab or window.", "Este libro cambió en otra pestaña o ventana."))}</strong> ${esc(tr("Choose which version to keep. The other one is saved in Version history.", "Elige qué versión conservar. La otra se guarda en el historial de versiones."))}</p>
      <div class="row-actions"><button type="button" class="btn small" data-bk-conflict="theirs">${esc(tr("Use the other version", "Usar la otra versión"))}</button><button type="button" class="btn small btn-primary" data-bk-conflict="mine">${esc(tr("Keep my version", "Conservar mi versión"))}</button></div>`);
    E.conflictStored = stored;
  }

  // ── text editing ──
  function beginTextEdit(id, { keepCaret = false } = {}) {
    const node = canvas.querySelector(`[data-text-of="${id}"]`);
    if (!node) return;
    S.editingText = id;
    node.contentEditable = "true";
    node.setAttribute("role", "textbox");
    node.setAttribute("aria-multiline", "true");
    node.setAttribute("aria-label", tr("Text", "Texto"));
    node.closest(".bk-el")?.classList.add("is-editing");
    node.classList.toggle("is-empty", !node.textContent.trim());
    if (!keepCaret || document.activeElement !== node) {
      node.focus({ preventScroll: true });
      const range = document.createRange();
      range.selectNodeContents(node);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
  function endTextEdit() {
    if (!S.editingText) return;
    flushTyping();
    const id = S.editingText;
    S.editingText = null;
    core.commit({ render: false });
    renderCanvas();
    renderInspector();
    renderPages();
    canvas.querySelector(`[data-el="${id}"]`)?.focus({ preventScroll: true });
    E.collab?.idle();
  }
  E.beginTextEdit = beginTextEdit;
  E.endTextEdit = endTextEdit;
  function flushTyping() {
    clearTimeout(E.typingTimer);
    const id = S.editingText;
    if (!id) return;
    const node = canvas.querySelector(`[data-text-of="${id}"]`);
    const el = core.page().elements.find((e) => e.id === id);
    if (node && el) el.html = sanitizeHtml(node.innerHTML);
  }
  E.flushTyping = flushTyping;

  // ── selection ──
  function select(id, { focus = true } = {}) {
    if (S.editingText && S.editingText !== id) endTextEdit();
    S.selected = id;
    renderCanvas();
    renderInspector();
    if (E.stage === "imagine" || E.stage === "life") renderDock();
    if (focus && id) canvas.querySelector(`[data-el="${id}"]`)?.focus({ preventScroll: true });
  }
  E.select = select;

  // ── drawing mode ──
  function mountDrawSurface() {
    const pageEl = canvas.querySelector(".bk-page");
    if (!pageEl || canvas.querySelector(".bk-draw-surface")) return;
    const surface = document.createElement("div");
    surface.className = "bk-draw-surface";
    surface.innerHTML =
      '<svg class="bk-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none"></svg>';
    surface.setAttribute("aria-hidden", "true");
    pageEl.append(surface);
    E.drawing.stop?.();
    E.drawing.stop = startDrawing(surface, {
      getTool: () => E.drawing.tool,
      onStroke: (stroke) => {
        let layer = core
          .page()
          .elements.find(
            (e) => e.type === "drawing" && e.x === 0 && e.y === 0 && e.w === 100 && e.h === 100,
          );
        if (!layer) {
          layer = makeElement("drawing", { x: 0, y: 0, w: 100, h: 100 });
          core.page().elements.push(layer);
        }
        layer.strokes.push(stroke);
        core.commit();
      },
      onErase: (pt, size) => {
        let changed = false;
        for (const layer of core.page().elements.filter((e) => e.type === "drawing")) {
          const hit = strokesNear(layer.strokes, pt, 12 + size * 4);
          if (hit.length) {
            layer.strokes = layer.strokes.filter((s) => !hit.includes(s));
            changed = true;
          }
        }
        if (changed) core.commit();
      },
    });
  }
  E.setDrawing = (on) => {
    if (on) {
      if (S.editingText) endTextEdit();
      S.selected = null;
      E.drawing = {
        tool: E.drawing?.tool || { color: "#1b1f3b", size: 2, erase: false },
        stop: null,
      };
    } else {
      E.drawing?.stop?.();
      E.drawing = null;
    }
    root.querySelector(".bk-editor").classList.toggle("is-drawing", !!on);
    renderAll();
  };

  // ── pointer: move / resize / rotate ──
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (E.drawing) return;
    const handle = e.target.closest("[data-handle]");
    const node = e.target.closest(".bk-el");
    if (S.editingText && e.target.closest(`[data-text-of="${S.editingText}"]`)) return; // typing: native selection
    if (!handle && !node) {
      if (S.editingText) endTextEdit();
      if (S.selected) select(null, { focus: false });
      return;
    }
    const id = handle ? S.selected : node.dataset.el;
    const el = core.page().elements.find((x) => x.id === id);
    if (!el) return;
    if (!handle && S.selected !== id) select(id, { focus: false });
    if (el.locked) return;
    const media = e.target.closest("video, iframe");
    if (media && !handle) return;
    e.preventDefault();
    const rect = canvas.querySelector(".bk-page").getBoundingClientRect();
    drag = {
      id,
      mode: handle ? handle.dataset.handle : "move",
      sx: e.clientX,
      sy: e.clientY,
      start: { x: el.x, y: el.y, w: el.w, h: el.h, rot: el.rot },
      rect,
      moved: false,
      pointerId: e.pointerId,
    };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = ((e.clientX - drag.sx) / drag.rect.width) * 100;
    const dy = ((e.clientY - drag.sy) / drag.rect.height) * 100;
    if (!drag.moved && Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) < 3) return;
    drag.moved = true;
    const s = drag.start;
    const el = core.page().elements.find((x) => x.id === drag.id);
    let next = { ...s };
    if (drag.mode === "move") {
      next.x = s.x + dx;
      next.y = s.y + dy;
      // Snap the element's centre to the page centre lines.
      const guides = [];
      if (Math.abs(next.x + s.w / 2 - 50) < 1.2) {
        next.x = 50 - s.w / 2;
        guides.push("v");
      }
      if (Math.abs(next.y + s.h / 2 - 50) < 1.2) {
        next.y = 50 - s.h / 2;
        guides.push("h");
      }
      showGuides(guides);
    } else if (drag.mode === "rot") {
      const cx = drag.rect.left + ((s.x + s.w / 2) / 100) * drag.rect.width;
      const cy = drag.rect.top + ((s.y + s.h / 2) / 100) * drag.rect.height;
      let a = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90;
      if (e.shiftKey || Math.abs(a % 90) < 4 || Math.abs(a % 90) > 86)
        a = Math.round(a / (e.shiftKey ? 15 : 90)) * (e.shiftKey ? 15 : 90);
      next.rot = Math.round(((a + 540) % 360) - 180);
    } else {
      const m = drag.mode;
      if (m.includes("e")) next.w = Math.max(2, s.w + dx);
      if (m.includes("s")) next.h = Math.max(2, s.h + dy);
      if (m.includes("w")) {
        next.w = Math.max(2, s.w - dx);
        next.x = s.x + s.w - next.w;
      }
      if (m.includes("n")) {
        next.h = Math.max(2, s.h - dy);
        next.y = s.y + s.h - next.h;
      }
      if (KEEP_RATIO.has(el.type) !== e.shiftKey && m.length === 2) {
        const ratio = s.w / s.h;
        if (Math.abs(dx) > Math.abs(dy)) next.h = next.w / ratio;
        else next.w = next.h * ratio;
        if (m.includes("n")) next.y = s.y + s.h - next.h;
        if (m.includes("w")) next.x = s.x + s.w - next.w;
      }
    }
    next = {
      x: round(next.x),
      y: round(next.y),
      w: round(next.w),
      h: round(next.h),
      rot: next.rot,
    };
    Object.assign(el, next);
    const style = `left:${el.x}%;top:${el.y}%;width:${el.w}%;height:${el.h}%${el.rot ? `;transform:rotate(${el.rot}deg)` : ""}`;
    canvas.querySelector(`.bk-el[data-el="${el.id}"]`)?.setAttribute("style", style);
    canvas
      .querySelector(".bk-sel")
      ?.setAttribute("style", `${style}${el.rot ? "" : ";transform:rotate(0deg)"}`);
  });
  const endDrag = (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    showGuides([]);
    try {
      canvas.releasePointerCapture(d.pointerId);
    } catch {}
    if (d.moved) {
      core.commit({ render: false });
      renderCanvas();
      renderInspector();
      renderPages();
      canvas.querySelector(`[data-el="${d.id}"]`)?.focus({ preventScroll: true });
    } else if (e.type === "pointerup") {
      const el = core.page().elements.find((x) => x.id === d.id);
      if (
        (el?.type === "text" || el?.type === "bubble") &&
        d.mode === "move" &&
        E.lastClickId === d.id &&
        Date.now() - E.lastClickAt < 2000
      )
        beginTextEdit(d.id);
      E.lastClickId = d.id;
      E.lastClickAt = Date.now();
    }
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("dblclick", (e) => {
    const node = e.target.closest(".bk-el");
    const el = node && core.page().elements.find((x) => x.id === node.dataset.el);
    if (el && (el.type === "text" || el.type === "bubble") && !el.locked) beginTextEdit(el.id);
  });
  function showGuides(list) {
    canvas.querySelectorAll(".bk-guide").forEach((g) => g.remove());
    const pageEl = canvas.querySelector(".bk-page");
    for (const g of list) {
      const n = document.createElement("span");
      n.className = `bk-guide bk-guide-${g}`;
      pageEl?.append(n);
    }
  }

  canvas.addEventListener("focusin", (e) => {
    const node = e.target.closest(".bk-el");
    if (node && e.target === node && S.selected !== node.dataset.el && !drag) {
      S.selected = node.dataset.el;
      canvas
        .querySelectorAll('.bk-el[aria-pressed="true"]')
        .forEach((n) => n.removeAttribute("aria-pressed"));
      node.setAttribute("aria-pressed", "true");
      canvas.querySelector(".bk-sel")?.remove();
      node.insertAdjacentHTML("afterend", selectionHTML(core.selectedEl()));
      renderInspector();
    }
  });

  // ── typing ──
  canvas.addEventListener("input", (e) => {
    const node = e.target.closest("[data-text-of]");
    if (!node) return;
    node.classList.toggle("is-empty", !node.textContent.trim());
    clearTimeout(E.typingTimer);
    E.typingTimer = setTimeout(() => {
      flushTyping();
      core.commit({ render: false });
      renderStatus();
    }, 900);
    db.writeRecovery(S.book);
  });
  canvas.addEventListener("paste", (e) => {
    const node = e.target.closest("[data-text-of]");
    if (!node) return;
    const dt = e.clipboardData;
    const htmlData = dt?.getData("text/html");
    const text = dt?.getData("text/plain");
    e.preventDefault();
    const clean = htmlData ? sanitizeHtml(htmlData) : textToParagraphs(text || "");
    document.execCommand("insertHTML", false, clean);
  });
  // Pictures dropped or pasted onto the page become picture elements.
  canvas.addEventListener("dragover", (e) => {
    if ([...(e.dataTransfer?.items || [])].some((i) => i.kind === "file")) e.preventDefault();
  });
  canvas.addEventListener("drop", (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    e.preventDefault();
    onAddBar(E, { action: "image-file", file });
  });

  // ── clicks ──
  root.addEventListener("click", async (e) => {
    const t = e.target;
    if (await onDockClick(E, e)) return;
    if (await onAddBar(E, { target: t })) return;
    if (onInspectorClick(E, e)) return;
    const pageBtn = t.closest("[data-bk-page]");
    if (pageBtn) {
      if (S.editingText) endTextEdit();
      core.goPage(Number(pageBtn.dataset.bkPage));
      E.pendingDelete = null;
      renderAll();
      root.querySelector(`[data-bk-page="${S.pageIndex}"]`)?.focus({ preventScroll: true });
      return;
    }
    const mv = t.closest("[data-bk-page-move]");
    if (mv) {
      const to = S.pageIndex + Number(mv.dataset.bkPageMove);
      if (core.movePage(S.pageIndex, to)) {
        E.say(tr(`Page moved to position ${to + 1}.`, `Página movida a la posición ${to + 1}.`));
        root.querySelector(`[data-bk-page="${S.pageIndex}"]`)?.focus({ preventScroll: true });
      }
      return;
    }
    const zoom = t.closest("[data-bk-zoom]");
    if (zoom) return setZoom(zoom.dataset.bkZoom);
    const conflict = t.closest("[data-bk-conflict]");
    if (conflict) {
      const stored = E.conflictStored;
      E.banner("");
      if (conflict.dataset.bkConflict === "theirs") {
        await db.saveVersion(S.book, "My version before switching").catch(() => {});
        core.adopt(stored);
      } else await core.overwrite(stored);
      return;
    }
    const act = t.closest("[data-bk-act]")?.dataset.bkAct;
    if (!act) return;
    if (act === "undo") core.undo() && E.say(tr("Undone.", "Deshecho."));
    else if (act === "redo") core.redo() && E.say(tr("Redone.", "Rehecho."));
    else if (act === "retry-save") core.saveNow();
    else if (act === "teacher") {
      setTeacher(!isTeacher());
      t.closest("[data-bk-act]").setAttribute("aria-pressed", String(isTeacher()));
      E.say(isTeacher() ? tr("Teacher tools on.", "Herramientas del docente activadas.") : tr("Teacher tools off.", "Herramientas del docente desactivadas."));
      renderDock();
    }
    else if (act === "dup-page") {
      core.duplicatePage();
      E.say(tr("Page duplicated.", "Página duplicada."));
    } else if (act === "del-page") {
      E.pendingDelete = S.pageIndex;
      renderPages();
      root.querySelector('[data-bk-act="del-page-yes"]')?.focus({ preventScroll: true });
    } else if (act === "del-page-yes") {
      E.pendingDelete = null;
      core.deletePage();
      E.say(tr("Page deleted. Undo brings it back.", "Página eliminada. Deshacer la recupera."));
      root.querySelector(`[data-bk-page="${S.pageIndex}"]`)?.focus({ preventScroll: true });
    } else if (act === "del-page-no") {
      E.pendingDelete = null;
      renderPages();
    } else if (act === "history" || act === "share" || act === "finish") {
      flushTyping();
      const { openDialog } = await import("./editor-dialogs.js");
      openDialog(E, act);
    }
  });
  root.addEventListener("input", (e) => {
    if (e.target.matches("[data-bk-title]")) {
      S.book.title = e.target.value.slice(0, 80) || S.book.title;
      clearTimeout(E.titleTimer);
      E.titleTimer = setTimeout(() => core.commit({ render: false }), 600);
      return;
    }
    if (e.target.closest("[data-bk-dock]") && onDockInput(E, e)) return;
    onInspectorInput(E, e);
  });
  root.addEventListener("submit", (e) => onDirectorSubmit(E, e));
  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-bk-title]")) {
      S.book.title = e.target.value.trim().slice(0, 80) || "My book";
      e.target.value = S.book.title;
      core.commit();
      return;
    }
    if (e.target.closest("[data-bk-dock]") && onDockInput(E, e)) return;
    onInspectorChange(E, e);
  });
  // Page reordering by drag and drop (the ↑ ↓ buttons are the keyboard equivalent).
  root.addEventListener("dragstart", (e) => {
    const li = e.target.closest?.("[data-page-index]");
    if (!li) return;
    E.dragPage = Number(li.dataset.pageIndex);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(E.dragPage));
  });
  root.addEventListener("dragover", (e) => {
    if (E.dragPage == null || !e.target.closest?.("[data-page-index]")) return;
    e.preventDefault();
  });
  root.addEventListener("drop", (e) => {
    const li = e.target.closest?.("[data-page-index]");
    if (E.dragPage == null || !li) return;
    e.preventDefault();
    const to = Number(li.dataset.pageIndex);
    core.movePage(E.dragPage, to);
    E.dragPage = null;
  });
  root.addEventListener("dragend", () => {
    E.dragPage = null;
  });

  // ── keyboard ──
  root.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    const inText = !!e.target.closest("[data-text-of]");
    const inField = !inText && e.target.matches("input, textarea, select");
    if (mod && e.key.toLowerCase() === "s") {
      e.preventDefault();
      flushTyping();
      core.commit({ render: false });
      core.saveNow();
      return;
    }
    if (inText) {
      if (e.key === "Escape") {
        e.preventDefault();
        endTextEdit();
      }
      return;
    }
    if (inField || E.dialog.open) return;
    if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      e.shiftKey ? core.redo() : core.undo();
      return;
    }
    if (mod && e.key.toLowerCase() === "y") {
      e.preventDefault();
      core.redo();
      return;
    }
    if (mod && (e.key === "=" || e.key === "+")) return (e.preventDefault(), setZoom("in"));
    if (mod && e.key === "-") return (e.preventDefault(), setZoom("out"));
    if (mod && e.key === "0") return (e.preventDefault(), setZoom("fit"));
    if (e.key === "PageDown" || e.key === "PageUp") {
      e.preventDefault();
      core.goPage(S.pageIndex + (e.key === "PageDown" ? 1 : -1));
      renderAll();
      E.say(`${tr("Page", "Página")} ${S.pageIndex + 1}`);
      return;
    }
    const el = core.selectedEl();
    if (!el) return;
    if (!e.target.closest(".bk-el, .bk-canvas")) return;
    if (mod && e.key.toLowerCase() === "c") return core.copy() && E.say(tr("Copied.", "Copiado."));
    if (mod && e.key.toLowerCase() === "x")
      return core.copy() && core.remove() && E.say(tr("Cut.", "Cortado."));
    if (mod && e.key.toLowerCase() === "v")
      return (e.preventDefault(), core.paste() && select(S.selected));
    if (mod && e.key.toLowerCase() === "d")
      return (e.preventDefault(), core.duplicate() && select(S.selected));
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      if (el.locked) return E.say(tr("This element is locked.", "Este elemento está bloqueado."));
      core.remove();
      E.say(tr("Deleted. Undo brings it back.", "Eliminado. Deshacer lo recupera."));
      canvas.querySelector(".bk-el")?.focus({ preventScroll: true });
      return;
    }
    if (e.key === "Enter" && (el.type === "text" || el.type === "bubble") && !el.locked) {
      e.preventDefault();
      beginTextEdit(el.id);
      return;
    }
    if (e.key === "Escape") return select(null, { focus: false });
    if (e.key === "]") return core.layer(el.id, mod ? "front" : "forward");
    if (e.key === "[") return core.layer(el.id, mod ? "back" : "backward");
    const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (arrows[e.key] && !el.locked) {
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      const [ax, ay] = arrows[e.key];
      if (e.altKey)
        core.update(
          el.id,
          { w: Math.max(2, el.w + ax * step), h: Math.max(2, el.h + ay * step) },
          { render: true },
        );
      else core.update(el.id, { x: round(el.x + ax * step), y: round(el.y + ay * step) });
      canvas.querySelector(`[data-el="${el.id}"]`)?.focus({ preventScroll: true });
      E.say(
        e.altKey
          ? `${tr("Size", "Tamaño")} ${Math.round(core.selectedEl().w)} × ${Math.round(core.selectedEl().h)}`
          : `${Math.round(core.selectedEl().x)}, ${Math.round(core.selectedEl().y)}`,
      );
    }
  });

  function setZoom(how) {
    const cur = E.zoom === "fit" ? pageWidth() / 800 : E.zoom;
    E.zoom =
      how === "fit"
        ? "fit"
        : Math.max(
            0.4,
            Math.min(2.5, Math.round((cur + (how === "in" ? 0.15 : -0.15)) * 100) / 100),
          );
    renderCanvas();
  }

  // Fit the editor under the site header and bring it into view.
  const fitToHeader = () => {
    const top = document.querySelector(".lab-top");
    const sticky = top && getComputedStyle(top).position !== "static";
    root.style.setProperty("--bk-top", `${sticky ? Math.round(top.getBoundingClientRect().height) : 0}px`);
  };
  fitToHeader();
  const headerObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fitToHeader) : null;
  if (document.querySelector(".lab-top")) headerObserver?.observe(document.querySelector(".lab-top"));
  const editorTop = root.querySelector(".bk-editor").getBoundingClientRect().top + window.scrollY;
  const headerH = parseFloat(root.style.getPropertyValue("--bk-top")) || 0;
  if (window.innerWidth > 860) window.scrollTo({ top: Math.max(0, editorTop - headerH - 6) });
  const onResize = () => {
    fitToHeader();
    if (E.zoom === "fit") renderCanvas();
  };
  window.addEventListener("resize", onResize);
  const beforeUnload = (e) => {
    flushTyping();
    if (S.dirty) {
      db.writeRecovery(S.book);
      core.saveNow();
      e.preventDefault();
      e.returnValue = "";
    }
  };
  window.addEventListener("beforeunload", beforeUnload);
  const offTabs = db.onOtherTab((msg) => {
    if (msg.id !== S.book.id) return;
    if (msg.type === "editing")
      E.banner(
        `<p>${bkIcon("history")} ${esc(tr("This book is also open in another tab. Edit it in one place so your changes do not collide.", "Este libro también está abierto en otra pestaña. Edítalo en un solo lugar para que los cambios no choquen."))}</p>`,
      );
    if (msg.type === "saved" && msg.rev > S.baseRev && !S.dirty)
      db.getBook(S.book.id).then((b) => b && core.adopt(b));
    if (msg.type === "saved" && msg.rev > S.baseRev && S.dirty)
      db.getBook(S.book.id).then((b) => b && showConflict(b));
  });

  // Remember the last words selected inside a text box, so "Add Language Support" can anchor to a phrase even
  // after focus moves to a button.
  const onSel = () => {
    const sel = window.getSelection?.();
    const node = sel?.anchorNode?.parentElement?.closest?.("[data-text-of]");
    const text = (sel?.toString() || "").trim();
    if (node && text) E.lastSel = { elementId: node.dataset.textOf, text, at: Date.now() };
  };
  document.addEventListener("selectionchange", onSel);

  // Class assignment: fetch this learner's own supports and send support-use records and work back (best effort).
  let pushTimer = 0;
  let lastPushSeq = -1;
  if (S.book.assignment?.classCode) {
    refreshSupports(S.book)
      .then((changed) => {
        if (changed) {
          core.commit({ render: false, history: false });
          renderDock();
        }
      })
      .catch(() => {});
    pushTimer = setInterval(() => {
      if (S.seq !== lastPushSeq) {
        lastPushSeq = S.seq;
        pushProgress(S.book);
      }
    }, 30000);
  }

  renderAll();
  // The teacher workspace can open the Language Support Studio straight away.
  try {
    const flag = sessionStorage.getItem("bkOpenStudio");
    if (flag && flag.split(":")[0] === S.book.id) {
      sessionStorage.removeItem("bkOpenStudio");
      setTeacher(true);
      renderDock();
      import("./lang/ui-instructor.js").then((m) => m.openStudio(E, flag.split(":")[1] || "manage"));
    }
  } catch {}
  // The canvas width depends on layout; render again once the stage has its real size.
  requestAnimationFrame(() => renderCanvas());
  // A book shared with the class syncs while it is open (collab.js); every other book is untouched.
  if (S.book.collab)
    import("./collab.js").then((m) => {
      if (!E.destroyed) E.collab = m.attachCollab(E);
    });

  return async function destroy() {
    E.destroyed = true;
    E.collab?.stop();
    flushTyping();
    if (S.editingText) core.commit({ render: false });
    E.drawing?.stop?.();
    window.removeEventListener("resize", onResize);
    window.removeEventListener("beforeunload", beforeUnload);
    headerObserver?.disconnect();
    offTabs();
    document.removeEventListener("selectionchange", onSel);
    clearInterval(pushTimer);
    E.player?.destroy();
    if (S.book.assignment?.classCode) pushProgress(S.book);
    unmountCoach();
    await core.saveNow();
    core.destroy();
  };
}

const round = (n) => Math.round(n * 10) / 10;

// Escape closes any open Book Studio dialog, wherever focus is (re-rendered dialog content can drop focus to <body>,
// where the browser's own cancel does not fire).
let escInstalled = false;
if (!escInstalled && typeof document !== "undefined") {
  escInstalled = true;
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Escape") return;
      const open = document.querySelector("dialog.bk-dialog[open]");
      if (!open) return;
      e.preventDefault();
      e.stopPropagation();
      open.close();
    },
    true,
  );
}
