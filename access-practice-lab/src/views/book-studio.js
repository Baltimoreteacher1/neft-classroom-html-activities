// Book Studio (/book-studio): make multimedia books. Routes:
//   /book-studio                    the bookshelf: create, continue, templates, my books, books opened from files/links
//   /book-studio/new[?template=|kind=]  create a book (blank kind or template → title → editor)
//   /book-studio/templates          the template gallery
//   /book-studio/edit/<id>          the editor            (src/book/editor.js)
//   /book-studio/read/<id>          the reader            (src/book/reader.js)
//   /book-studio/review/<id>        the reader with teacher notes (for a book file a student handed in)
//   /book-studio/play/<id>          play a branching story (choices, clues, endings)        (src/book/play.js)
//   /book-studio/teacher            the teacher workspace: assignments, supports, evidence   (src/book/instructor.js)
//   /book-studio/shared#b=…         a read-only book from a share link (the hash never reaches a server)
// Books live on this device (src/book/db.js). Docs: access-practice-lab/BOOK-STUDIO.md.
import { crumbsHTML } from "../components.js";
import { i18nFor } from "../i18n.js";
import * as db from "../book/db.js";
import { download, exportProject, fileBase, importProject, readShared } from "../book/export.js";
import { bkIcon } from "../book/icons.js";
import {
  KINDS,
  STATUSES,
  bookFromTemplate,
  cloneWithNewIds,
  mediaIds,
  newBook,
  pick,
} from "../book/model.js";
import { esc, pageHTML, preloadMedia } from "../book/render.js";
import { craftHTML, journeyHTML, standardsHTML, templateCard } from "../book/program-ui.js";
import { KEY_USES, clusterForBand, programFor } from "../book/programs.js";
import { templateForBand } from "../book/template-bands.js";
import { CREATION_MODES, adventureSkeleton } from "../book/story.js";
import { makePage } from "../book/model.js";
import { TEMPLATE_GROUPS, templateById, templatesFor } from "../book/templates.js";
import { BASE, announce, html } from "../util.js";

const STYLE_ID = "book-studio-css";
// The Book Studio icon drawn on each blank-kind cover on the create page.
const KIND_ICON = {
  blank: "text",
  picture: "image",
  comic: "panel",
  report: "search",
  narrative: "book",
  informational: "lightbulb",
  bilingual: "globe",
  audio: "speaker",
};
let current = null; // destroy function of the mounted editor/reader
let fieldObserver = null;

// Resolves once the studio's stylesheet has loaded (or failed), so the first paint is already styled. Painting the
// markup first and styling it a moment later moved the whole page on a real network (CLS 0.19 live).
let stylesReady = null;
function ensureStyles() {
  if (stylesReady) return stylesReady;
  const existing = document.getElementById(STYLE_ID);
  if (existing) return (stylesReady = Promise.resolve());
  const link = document.createElement("link");
  link.id = STYLE_ID;
  link.rel = "stylesheet";
  link.href = `${BASE}/book-studio.css`;
  stylesReady = new Promise((resolve) => {
    link.addEventListener("load", resolve, { once: true });
    link.addEventListener("error", resolve, { once: true });
    setTimeout(resolve, 3000);
  });
  document.head.append(link);
  return stylesReady;
}

export async function render(ctx) {
  await ensureStyles();
  const I = i18nFor(ctx);
  const r = ctx.route;
  const sub = r.id || "";
  const title =
    sub === "edit"
      ? I.S("Book editor", "Editor de libros")
      : sub === "read" || sub === "shared"
        ? I.S("Read a book", "Leer un libro")
        : sub === "review"
          ? I.S("Review a book", "Revisar un libro")
          : sub === "play"
            ? I.S("Play a story", "Jugar un cuento")
            : sub === "teacher"
              ? I.S("Teacher workspace", "Espacio del docente")
              : sub === "new"
            ? I.S("Create a book", "Crear un libro")
            : sub === "templates"
              ? I.S("Book templates", "Plantillas de libros")
              : I.S("Book Studio", "Book Studio");
  const full = sub === "edit" || sub === "read" || sub === "shared" || sub === "review" || sub === "play";
  return {
    title,
    html: html`${full ? "" : crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`], [I.S("Book Studio", "Book Studio"), sub ? `${BASE}/book-studio` : null], ...(sub ? [[title, null]] : [])])}
      <div class="bk-root${full ? " is-full" : ""}" data-bk-root aria-busy="true">
        <p class="bk-loading" role="status">
          ${I.T("Opening Book Studio…", "Abriendo Book Studio…")}
        </p>
      </div>`,
  };
}

export async function mount(root, ctx) {
  await ensureStyles();
  await teardown();
  const box = root.querySelector("[data-bk-root]");
  if (!box) return;
  // The site-wide Save/Resume engine snapshots every form field on the page. Book Studio saves its own work, so its
  // fields are marked to be skipped (otherwise a restore could overwrite a book with an old snapshot).
  fieldObserver = new MutationObserver(() => markFields(box));
  fieldObserver.observe(box, { childList: true, subtree: true });
  const I = i18nFor(ctx);
  const r = ctx.route;
  const sub = r.id || "";
  const bookId = r.sub || "";
  try {
    if (!db.available()) throw new Error("no-indexeddb");
    if (sub === "edit") return await openEditor(box, ctx, I, bookId);
    if (sub === "read" || sub === "review")
      return await openReader(box, ctx, I, bookId, { review: sub === "review" });
    if (sub === "shared") return await openShared(box, ctx, I);
    if (sub === "play") return await openPlay(box, ctx, I, bookId);
    if (sub === "teacher") return await openTeacher(box, ctx, I);
    if (sub === "new") return await renderCreate(box, ctx, I);
    if (sub === "templates") return renderTemplates(box, ctx, I);
    return await renderHome(box, ctx, I);
  } catch (error) {
    console.error("[book-studio]", error);
    box.removeAttribute("aria-busy");
    box.innerHTML = `<section class="panel empty-state"><h1>${esc(I.S("Book Studio could not open", "Book Studio no se pudo abrir"))}</h1><p>${esc(error?.message === "no-indexeddb" ? I.S("This browser is blocking site storage (private browsing can do this), so books cannot be saved here. Open Book Studio in a regular window.", "Este navegador bloquea el almacenamiento del sitio (la navegación privada puede hacerlo), así que los libros no se pueden guardar aquí. Abre Book Studio en una ventana normal.") : I.S("Something went wrong while opening this page. Your books are still saved on this device.", "Algo salió mal al abrir esta página. Tus libros siguen guardados en este dispositivo."))}</p><p><a class="btn btn-primary" href="${BASE}/book-studio">${esc(I.S("Back to my books", "Volver a mis libros"))}</a></p></section>`;
  }
}

export async function unmount() {
  await teardown();
}

async function teardown() {
  fieldObserver?.disconnect();
  fieldObserver = null;
  const d = current;
  current = null;
  if (d) await d();
}

function markFields(box) {
  for (const n of box.querySelectorAll(
    'input, textarea, select, [contenteditable="true"], [contenteditable=""]',
  ))
    if (!n.hasAttribute("data-nsr-ignore")) n.setAttribute("data-nsr-ignore", "");
}

const go = (ctx, path) => ctx.navigate(`${BASE}/book-studio${path}`);
const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

// ── editor / reader ──────────────────────────────────────────────────────────

async function openEditor(box, ctx, I, id) {
  let book = await db.getBook(id);
  if (!book) return notFound(box, I);
  const recovery = db.readRecovery(id);
  box.removeAttribute("aria-busy");
  if (
    recovery &&
    recovery.book.rev >= book.rev &&
    JSON.stringify(recovery.book.pages) !== JSON.stringify(book.pages)
  ) {
    const choice = await new Promise((resolve) => {
      box.innerHTML = `<section class="panel bk-recover" aria-labelledby="bkRecH"><h1 id="bkRecH" tabindex="-1">${esc(I.S("Unsaved changes found", "Se encontraron cambios sin guardar"))}</h1><p>${esc(I.S(`“${book.title}” has changes from ${new Date(recovery.at).toLocaleString()} that did not finish saving.`, `“${book.title}” tiene cambios del ${new Date(recovery.at).toLocaleString()} que no terminaron de guardarse.`))}</p><div class="row-actions"><button type="button" class="btn btn-primary" data-rec="keep">${esc(I.S("Restore my unsaved changes", "Recuperar mis cambios sin guardar"))}</button><button type="button" class="btn" data-rec="drop">${esc(I.S("Open the last saved book", "Abrir el último libro guardado"))}</button></div><p class="fine">${esc(I.S("Either way, the other copy is kept in Version history.", "En cualquier caso, la otra copia se guarda en el historial de versiones."))}</p></section>`;
      box.querySelector("h1").focus();
      box.addEventListener("click", (e) => {
        const b = e.target.closest("[data-rec]");
        if (b) resolve(b.dataset.rec);
      });
    });
    if (choice === "keep") {
      await db.saveVersion(
        book,
        I.S("Saved copy before recovery", "Copia guardada antes de recuperar"),
      );
      book = await db.saveBook({ ...recovery.book, rev: book.rev }, { baseRev: book.rev });
    } else {
      await db.saveVersion(
        { ...recovery.book, rev: book.rev },
        I.S("Unsaved changes (not restored)", "Cambios sin guardar (no recuperados)"),
      );
      db.clearRecovery(id);
    }
  }
  // Pull teacher feedback for a submitted book (best effort; works offline without it).
  if (book.submission?.workId && book.status === "submitted") {
    import("../book/editor-dialogs.js")
      .then(({ refreshReview }) => refreshReview(book))
      .then(async (review) => {
        if (!review) return;
        const fresh = await db.getBook(id);
        if (fresh && !fresh.review) await db.saveBook({ ...fresh, review, status: "returned" });
        announce(
          I.S(
            "Your teacher sent feedback on this book. Open Finish to read it.",
            "Tu docente envió comentarios sobre este libro. Abre Terminar para leerlos.",
          ),
        );
      })
      .catch(() => {});
  }
  const { mountEditor } = await import("../book/editor.js");
  current = await mountEditor(box, ctx, book, I);
  await db.requestPersist();
}

async function openReader(box, ctx, I, id, { review = false } = {}) {
  const book = await db.getBook(id);
  if (!book) return notFound(box, I);
  box.removeAttribute("aria-busy");
  const { mountReader } = await import("../book/reader.js");
  current = await mountReader(box, ctx, book, I, {
    review,
    onSaveNotes: (b) => db.saveBook(b),
    onReturn: async (b) => {
      download(
        await exportProject({ ...b, status: "returned" }),
        `${fileBase(b)}-with-notes.langbook`,
      );
      announce(
        I.S(
          "Book downloaded with your notes. Give the file back to the student.",
          "Libro descargado con sus notas. Devuelva el archivo al estudiante.",
        ),
      );
    },
  });
}

async function openPlay(box, ctx, I, id) {
  const q = new URLSearchParams(location.search);
  const book = id === "shared" || q.get("shared") === "1" ? await readShared(location.hash).catch(() => null) : await db.getBook(id);
  if (!book) return notFound(box, I);
  box.removeAttribute("aria-busy");
  const { mountPlay } = await import("../book/play.js");
  current = await mountPlay(box, ctx, book, I, { preview: q.get("test") === "1", shared: id === "shared" || q.get("shared") === "1" });
}

async function openTeacher(box, ctx, I) {
  box.removeAttribute("aria-busy");
  const { mountTeacher } = await import("../book/instructor.js");
  current = await mountTeacher(box, ctx, I, { go: (path) => go(ctx, path) });
}

async function openShared(box, ctx, I) {
  const book = await readShared(location.hash).catch(() => null);
  box.removeAttribute("aria-busy");
  if (!book) {
    box.innerHTML = `<section class="panel empty-state"><h1>${esc(I.S("This book link is not complete", "Este enlace de libro está incompleto"))}</h1><p>${esc(I.S("Ask the author to copy the whole link again.", "Pide al autor que vuelva a copiar el enlace completo."))}</p><p><a class="btn btn-primary" href="${BASE}/book-studio">${esc(I.S("Go to Book Studio", "Ir a Book Studio"))}</a></p></section>`;
    return;
  }
  const { mountReader } = await import("../book/reader.js");
  current = await mountReader(box, ctx, book, I, {
    shared: true,
    onSaveCopy: async (b) => {
      const copy = await db.saveBook(
        cloneWithNewIds(b, {
          source: { kind: "remix", id: b.id, label: b.title },
          title: `${b.title} (remix)`.slice(0, 80),
          remix: false,
        }),
      );
      go(ctx, `/edit/${copy.id}`);
    },
  });
}

function notFound(box, I) {
  box.removeAttribute("aria-busy");
  box.innerHTML = `<section class="panel empty-state"><h1>${esc(I.S("We could not find that book on this device", "No encontramos ese libro en este dispositivo"))}</h1><p>${esc(I.S("Books are saved in the browser where they were made. If you made it somewhere else, open its book file here.", "Los libros se guardan en el navegador donde se hicieron. Si lo hiciste en otro lugar, abre aquí su archivo."))}</p><p><a class="btn btn-primary" href="${BASE}/book-studio">${esc(I.S("Go to my books", "Ir a mis libros"))}</a></p></section>`;
}

// ── bookshelf ────────────────────────────────────────────────────────────────

function coverCard(book, I, { pending } = {}) {
  const lang = I.mode === "es" ? "es" : "en";
  const st = STATUSES[book.status] || STATUSES.draft;
  const from = book.collab
    ? `${I.S("Shared with my class", "Compartido con mi clase")} · ${book.collab.bookCode}`
    : book.source?.kind === "import"
      ? I.S("Opened from a file", "Abierto desde un archivo")
      : book.source?.kind === "remix"
        ? I.S("Remix", "Remezcla")
        : book.source?.label
          ? `${I.S("From", "Desde")} ${book.source.label}`
          : "";
  return `<li class="bk-card" data-book="${book.id}">
    <a class="bk-card-cover" href="${BASE}/book-studio/edit/${book.id}" aria-label="${esc(`${I.S("Edit", "Editar")} ${book.title}`)}"><span class="bk-thumb-page" aria-hidden="true">${pageHTML(book, book.pages[0], { mode: "thumb" })}</span></a>
    <div class="bk-card-body">
      <h3><a href="${BASE}/book-studio/edit/${book.id}">${esc(book.title)}</a></h3>
      <p class="bk-card-meta"><span class="bk-status-chip is-${book.status}">${esc(st[lang])}</span> <span>${book.pages.length} ${esc(I.S("pages", "páginas"))}</span> <span>${esc(fmtDate(book.updatedAt))}</span></p>
      ${book.author ? `<p class="fine">${esc(I.S("by", "por"))} ${esc(book.author)}</p>` : ""}
      ${from ? `<p class="fine">${esc(from)}</p>` : ""}
      ${book.feedback.some((f) => !f.done) || book.status === "returned" ? `<p class="bk-card-flag">${bkIcon("feedback")} ${esc(I.S("Teacher feedback to read", "Comentarios del docente para leer"))}</p>` : ""}
      <div class="bk-card-actions">
        <a class="btn small btn-primary" href="${BASE}/book-studio/edit/${book.id}">${esc(I.S("Edit", "Editar"))}</a>
        <a class="btn small" href="${BASE}/book-studio/read/${book.id}">${esc(I.S("Read", "Leer"))}</a>
        <details class="bk-menu"><summary class="btn small ghost" aria-label="${esc(`${I.S("More for", "Más para")} ${book.title}`)}">${bkIcon("more")}</summary><div class="bk-menu-body">
          <button type="button" data-shelf="duplicate" data-id="${book.id}">${esc(I.S("Make a copy", "Hacer una copia"))}</button>
          <button type="button" data-shelf="download" data-id="${book.id}">${esc(I.S("Download book file", "Descargar archivo del libro"))}</button>
          <a href="${BASE}/book-studio/review/${book.id}">${esc(I.S("Teacher review mode", "Modo de revisión docente"))}</a>
          <button type="button" data-shelf="delete" data-id="${book.id}">${esc(I.S("Delete…", "Eliminar…"))}</button>
        </div></details>
      </div>
      ${pending ? `<div class="bk-confirm" role="group" aria-label="${esc(I.S("Confirm delete", "Confirmar eliminación"))}"><span>${esc(I.S("Delete this book and its pictures and recordings? This cannot be undone.", "¿Eliminar este libro con sus imágenes y grabaciones? No se puede deshacer."))}</span><button type="button" class="btn small danger" data-shelf="delete-yes" data-id="${book.id}">${esc(I.S("Delete", "Eliminar"))}</button><button type="button" class="btn small ghost" data-shelf="delete-no">${esc(I.S("Keep", "Conservar"))}</button></div>` : ""}
    </div>
  </li>`;
}

async function renderHome(box, ctx, I) {
  const lang = I.mode === "es" ? "es" : "en";
  let books = await db.listBooks();
  await Promise.all(
    books.slice(0, 40).map((b) => preloadMedia({ ...b, pages: [b.pages[0]] }).catch(() => {})),
  );
  const state = { q: "", status: "all", pending: null };
  const last = books.find((b) => b.id === db.getLast()) || books[0];
  const persisted = navigator.storage?.persisted
    ? await navigator.storage.persisted().catch(() => false)
    : false;
  const program = programFor(ctx.band);
  const featured = program.featured.map(templateById).filter(Boolean);
  const draw = () => {
    const q = state.q.toLowerCase();
    const list = books.filter(
      (b) =>
        (state.status === "all" ||
          b.status === state.status ||
          (state.status === "shared" && ["import", "remix"].includes(b.source?.kind))) &&
        (!q || `${b.title} ${b.author}`.toLowerCase().includes(q)),
    );
    box.querySelector("[data-shelf-list]").innerHTML = list.length
      ? list.map((b) => coverCard(b, I, { pending: state.pending === b.id })).join("")
      : `<li class="bk-empty-row">${esc(books.length ? I.S("No books match.", "Ningún libro coincide.") : I.S("No books yet. Create your first one!", "Todavía no hay libros. ¡Crea el primero!"))}</li>`;
    box.querySelector("[data-shelf-count]").textContent = `${list.length}`;
  };
  box.removeAttribute("aria-busy");
  box.innerHTML = `<section class="bk-home">
    <header class="bk-hero is-band-${esc(program.band)}">
      <div class="bk-hero-text">
        <p class="bk-hero-band"><span>${esc(pick(program.grades, lang))}</span>${esc(pick(program.name, lang))}</p>
        <h1 tabindex="-1">${esc(I.S("Book Studio", "Book Studio"))}</h1>
        <p class="eyebrow">${esc(pick(program.eyebrow, lang))}</p>
        <p class="lead">${esc(pick(program.lead, lang))}</p>
        <div class="row-actions">
          <a class="btn btn-primary btn-big" href="${BASE}/book-studio/new">${bkIcon("plus")} ${esc(I.S("Create a new book", "Crear un libro nuevo"))}</a>
          ${last ? `<a class="btn btn-big" href="${BASE}/book-studio/edit/${last.id}">${bkIcon("draw")} ${esc(I.S("Continue", "Continuar"))}: ${esc(last.title)}</a>` : ""}
        </div>
      </div>
      <div class="bk-hero-art" aria-hidden="true" inert>${featured
        .slice(0, 3)
        .map((t, i) => {
          const b = bookFromTemplate(t, { title: pick(t.title, lang), lang });
          return `<span class="bk-hero-book b${i}">${pageHTML(b, b.pages[0], { mode: "thumb" })}</span>`;
        })
        .join("")}</div>
    </header>

    <section class="bk-modes" aria-labelledby="bkModesH">
      <h2 id="bkModesH" class="sr-only">${esc(I.S("Start something new", "Empieza algo nuevo"))}</h2>
      <ul class="bk-mode-grid">${CREATION_MODES.map((m) => `<li><a class="bk-mode-card is-${m.id}" href="${BASE}/book-studio/new?mode=${m.id}">${bkIcon(m.icon)}<strong>${esc(m[lang])}</strong><span>${esc(m.blurb[lang === "es" ? 1 : 0])}</span></a></li>`).join("")}</ul>
      <ul class="bk-quick"><li><a class="linklike" href="${BASE}/book-studio/templates">${esc(I.S("Explore examples and templates", "Explorar ejemplos y plantillas"))}</a></li><li><a class="linklike" href="${BASE}/book-studio/teacher">${esc(I.S("Teacher workspace", "Espacio del docente"))}</a></li></ul>
      <div data-assign-slot></div>
    </section>

    ${journeyHTML(program, I)}

    <section class="bk-shelf" aria-labelledby="bkShelfH">
      <div class="bk-shelf-head">
        <h2 id="bkShelfH">${esc(I.S("My books", "Mis libros"))} <span class="bk-count" data-shelf-count></span></h2>
        <div class="bk-shelf-tools">
          <label class="bk-search"><span class="sr-only">${esc(I.S("Search my books", "Buscar en mis libros"))}</span><input type="search" data-shelf-q placeholder="${esc(I.S("Search my books", "Buscar en mis libros"))}" /></label>
          <div class="bk-filter" role="group" aria-label="${esc(I.S("Show", "Mostrar"))}">
            ${[
              ["all", I.S("All", "Todos")],
              ["draft", STATUSES.draft[lang]],
              ["completed", STATUSES.completed[lang]],
              ["submitted", STATUSES.submitted[lang]],
              ["returned", STATUSES.returned[lang]],
              ["published", STATUSES.published[lang]],
              ["shared", I.S("Shared with me", "Compartidos conmigo")],
            ]
              .map(
                ([v, l]) =>
                  `<button type="button" class="chip" data-shelf-status="${v}" aria-pressed="${v === "all"}">${esc(l)}</button>`,
              )
              .join("")}
          </div>
          <button type="button" class="btn small" data-shelf="import">${bkIcon("upload")} ${esc(I.S("Open a book file", "Abrir un archivo de libro"))}</button>
          <input type="file" hidden accept=".langbook,.zip,.json,application/zip,application/json" data-shelf-file />
        </div>
      </div>
      <ul class="bk-cards" data-shelf-list></ul>
      <p class="fine bk-storage-note">${esc(I.S("Your books are saved in this browser on this device, not in an online account. To keep a backup or move a book to another device, download its book file.", "Tus libros se guardan en este navegador en este dispositivo, no en una cuenta en línea. Para tener una copia o pasar un libro a otro dispositivo, descarga su archivo."))} ${persisted ? esc(I.S("This browser has agreed to keep them.", "Este navegador aceptó conservarlos.")) : ""}</p>
    </section>

    <section class="bk-shelf bk-collab-shelf" aria-labelledby="bkCollabH" data-bk-collab-shelf hidden></section>

    <section class="bk-templates-strip" aria-labelledby="bkTplH">
      <div class="bk-shelf-head"><div class="bk-section-head"><p class="eyebrow">${esc(I.S(`Chosen for ${program.grades.en}`, `Elegidas para ${program.grades.es}`))}</p><h2 id="bkTplH">${esc(I.S("Start from a template", "Empieza con una plantilla"))}</h2></div><a class="btn small" href="${BASE}/book-studio/templates?grades=${ctx.band}">${esc(I.S(`See all ${templatesFor(ctx.band).length} templates`, `Ver las ${templatesFor(ctx.band).length} plantillas`))} →</a></div>
      <ul class="bk-tpl-grid is-featured">${featured.map((t) => templateCard(t, I, { band: ctx.band })).join("")}</ul>
    </section>

    ${craftHTML(program, I)}

    <section class="bk-from" aria-labelledby="bkFromH">
      <h2 id="bkFromH">${esc(I.S("Turn your practice into a book", "Convierte tu práctica en un libro"))}</h2>
      <ul class="bk-from-grid">
        <li><a href="${BASE}/write?grades=${ctx.band}">${bkIcon("text")}<strong>${esc(I.S("Writing Studio", "Estudio de escritura"))}</strong><span>${esc(I.S("Finish a piece, then press “Add to my book”.", "Termina un texto y presiona “Agregar a mi libro”."))}</span></a></li>
        <li><a href="${BASE}/scenarios?grades=${ctx.band}">${bkIcon("bubble")}<strong>${esc(I.S("Conversations", "Conversaciones"))}</strong><span>${esc(I.S("Finish a scene and turn the dialogue into a comic.", "Termina una escena y convierte el diálogo en un cómic."))}</span></a></li>
        <li><a href="${BASE}/book-studio/new?template=vocabulary-picture-book">${bkIcon("sticker")}<strong>${esc(I.S("My words", "Mis palabras"))}</strong><span>${esc(I.S("Make a picture dictionary of words you are learning.", "Haz un diccionario ilustrado con palabras que estás aprendiendo."))}</span></a></li>
        <li><a href="${BASE}/worlds?grades=${ctx.band}">${bkIcon("book")}<strong>${esc(I.S("Language Worlds", "Mundos del lenguaje"))}</strong><span>${esc(I.S("Complete a mission and write the mission report.", "Completa una misión y escribe el informe."))}</span></a></li>
      </ul>
    </section>
    ${standardsHTML(program, I)}
  </section>`;
  draw();
  box.querySelector("h1").focus({ preventScroll: true });
  // Assignments from a joined class (best effort; the page works the same without a class).
  import("../book/lang/class-sync.js")
    .then(async ({ listAssignments }) => {
      const list = await listAssignments();
      const slot = box.querySelector("[data-assign-slot]");
      if (!slot || !list.length) return;
      slot.innerHTML = `<h3>${esc(I.S("Assignments from your teacher", "Tareas de tu docente"))}</h3><ul class="bk-assign">${list.map((a) => `<li><div><strong>${esc(a.title)}</strong>${a.task ? `<span class="fine">${esc(a.task)}</span>` : ""}</div><button type="button" class="btn small btn-primary" data-start-assignment="${esc(a.id)}">${esc(I.S("Start or continue", "Empezar o continuar"))}</button></li>`).join("")}</ul>`;
    })
    .catch(() => {});
  // Books written together with classmates (src/book/collab.js); a learner without a class sees how to join one.
  import("../book/collab.js")
    .then((m) => m.mountShelfCollab(box.querySelector("[data-bk-collab-shelf]"), ctx, I, books))
    .catch((error) => console.error("[book-studio] collab shelf", error));
  box.addEventListener("input", (e) => {
    if (e.target.matches("[data-shelf-q]")) {
      state.q = e.target.value;
      draw();
    }
  });
  box.addEventListener("click", async (e) => {
    const sa = e.target.closest("[data-start-assignment]");
    if (sa) {
      sa.disabled = true;
      try {
        const { startAssignment } = await import("../book/lang/class-sync.js");
        go(ctx, `/edit/${await startAssignment(sa.dataset.startAssignment)}`);
      } catch (error) {
        sa.disabled = false;
        announce(error?.userMessage || I.S("Could not open this assignment. Your books are safe.", "No se pudo abrir esta tarea. Tus libros están a salvo."));
      }
      return;
    }
    const st = e.target.closest("[data-shelf-status]");
    if (st) {
      state.status = st.dataset.shelfStatus;
      box
        .querySelectorAll("[data-shelf-status]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === st)));
      draw();
      return;
    }
    const b = e.target.closest("[data-shelf]");
    if (!b) return;
    const act = b.dataset.shelf;
    const id = b.dataset.id;
    b.closest("details")?.removeAttribute("open");
    if (act === "import") return box.querySelector("[data-shelf-file]").click();
    if (act === "delete") {
      state.pending = id;
      draw();
      box.querySelector('[data-shelf="delete-yes"]')?.focus();
    } else if (act === "delete-no") {
      state.pending = null;
      draw();
    } else if (act === "delete-yes") {
      await db.deleteBook(id);
      books = books.filter((x) => x.id !== id);
      state.pending = null;
      draw();
      announce(I.S("Book deleted.", "Libro eliminado."));
    } else if (act === "duplicate") {
      const src = books.find((x) => x.id === id);
      const copy = cloneWithNewIds(src, {
        title: `${src.title} (copy)`.slice(0, 80),
        source: { kind: "copy", id: src.id, label: src.title },
      });
      const map = await db.copyMedia(mediaIds(src), copy.id);
      for (const p of copy.pages) {
        p.narration = map[p.narration] || "";
        for (const el of p.elements)
          for (const k of ["media", "poster", "captions"]) if (el[k]) el[k] = map[el[k]] || "";
      }
      const saved = await db.saveBook(copy);
      books.unshift(saved);
      draw();
      announce(I.S("Copy made.", "Copia hecha."));
    } else if (act === "download") {
      const src = books.find((x) => x.id === id);
      download(await exportProject(src), `${fileBase(src)}.langbook`);
    }
  });
  box.querySelector("[data-shelf-file]").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const book = await importProject(file);
      book.source = { kind: "import", id: "", label: file.name };
      const saved = await db.saveBook(book);
      announce(I.S(`Opened “${saved.title}”.`, `Se abrió “${saved.title}”.`));
      go(ctx, `/edit/${saved.id}`);
    } catch (error) {
      console.error("[book-studio] import", error);
      announce(
        I.S("That file is not a Book Studio book.", "Ese archivo no es un libro de Book Studio."),
        { tone: "error" },
      );
    }
  });
}

function renderTemplates(box, ctx, I) {
  const lang = I.mode === "es" ? "es" : "en";
  const program = programFor(ctx.band);
  box.removeAttribute("aria-busy");
  const list = templatesFor(ctx.band);
  const uses = Object.keys(KEY_USES).filter((u) => list.some((t) => pick(t.purpose, "en") === u));
  box.innerHTML = `<section class="bk-gallery">
    <header class="bk-gallery-head"><p class="bk-hero-band is-light"><span>${esc(pick(program.grades, lang))}</span>${esc(pick(program.name, lang))}</p>
    <h1 tabindex="-1">${esc(I.S("Book templates", "Plantillas de libros"))}</h1>
    <p class="lead">${esc(I.S(`${list.length} templates for ${program.grades.en}. Every one has a purpose, page-by-page directions, language goals, a word bank, optional sentence starters and a model. You write the ideas.`, `${list.length} plantillas para ${program.grades.es}. Cada una tiene un propósito, instrucciones página por página, metas de lenguaje, un banco de palabras, inicios de oración opcionales y un modelo. Tú escribes las ideas.`))}</p>
    <div class="bk-filter bk-use-filter" role="group" aria-label="${esc(I.S("Show templates that", "Mostrar plantillas para"))}">
      <button type="button" class="chip" data-use="" aria-pressed="true">${esc(I.S("All", "Todas"))} <span class="bk-count">${list.length}</span></button>
      ${uses.map((u) => `<button type="button" class="chip bk-use-chip is-${KEY_USES[u].tone}" data-use="${u}" aria-pressed="false">${esc(KEY_USES[u][lang])} <span class="bk-count">${list.filter((t) => pick(t.purpose, "en") === u).length}</span></button>`).join("")}
    </div></header>
    ${TEMPLATE_GROUPS.map((g) => {
      const items = list.filter((t) =>
        g.id === "family" ? t.family : !t.family && t.tag === g.id,
      );
      return items.length
        ? `<section class="bk-tpl-group" aria-labelledby="bkG-${g.id}"><h2 id="bkG-${g.id}">${esc(I.S(g.en, g.es))} <span class="bk-count">${items.length}</span></h2><ul class="bk-tpl-grid">${items.map((t) => templateCard(t, I, { band: ctx.band }).replace('<li class="bk-tpl">', `<li class="bk-tpl" data-use="${esc(pick(t.purpose, "en"))}">`)).join("")}</ul></section>`
        : "";
    }).join("")}
    <p class="bk-gallery-foot"><a class="btn" href="${BASE}/book-studio/new?grades=${ctx.band}">${esc(I.S("Or start with a blank book", "O empieza con un libro en blanco"))}</a></p>
    ${standardsHTML(program, I)}</section>`;
  box.querySelector("h1").focus({ preventScroll: true });
  box.querySelector(".bk-use-filter").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-use]");
    if (!chip) return;
    const use = chip.dataset.use;
    box.querySelectorAll(".bk-use-filter [data-use]").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    for (const li of box.querySelectorAll("li.bk-tpl")) li.hidden = !!use && li.dataset.use !== use;
    for (const sec of box.querySelectorAll(".bk-tpl-group")) sec.hidden = !sec.querySelector("li.bk-tpl:not([hidden])");
    const n = box.querySelectorAll("li.bk-tpl:not([hidden])").length;
    announce(I.S(`${n} templates shown.`, `Se muestran ${n} plantillas.`));
  });
}

// ── create ───────────────────────────────────────────────────────────────────

async function renderCreate(box, ctx, I) {
  const lang = I.mode === "es" ? "es" : "en";
  const q = new URLSearchParams(location.search);
  const tpl = templateForBand(templateById(q.get("template")), ctx.band);
  const mode = CREATION_MODES.find((m) => m.id === q.get("mode")) || null;
  const kind = KINDS.find((k) => k.id === q.get("kind"))?.id || mode?.kind || "blank";
  box.removeAttribute("aria-busy");
  const kindCards = KINDS.map(
    (k) =>
      `<label class="bk-kind"><input type="radio" name="bk-kind" value="${k.id}" ${!tpl && k.id === kind ? "checked" : ""} /><span class="bk-kind-shape is-${k.format} is-${k.id}" aria-hidden="true">${bkIcon(KIND_ICON[k.id] || "book")}</span><span>${esc(k[lang])}</span></label>`,
  ).join("");
  box.innerHTML = `<section class="bk-create"><h1 tabindex="-1">${esc(I.S("Create a book", "Crear un libro"))}</h1>
    <form class="bk-create-form" data-create>
      ${
        tpl
          ? `<div class="bk-create-tpl"><span class="bk-thumb-page" aria-hidden="true">${(() => {
              const b = bookFromTemplate(tpl, { title: pick(tpl.title, lang), lang });
              return pageHTML(b, b.pages[0], { mode: "thumb" });
            })()}</span><div><p class="eyebrow">${esc(I.S("Template", "Plantilla"))}</p><h2>${esc(pick(tpl.title, lang))}</h2><p>${esc(pick(tpl.summary, lang))}</p><p class="fine"><strong>${esc(I.S("You will make:", "Vas a hacer:"))}</strong> ${esc(pick(tpl.finished, lang))}</p>${tpl.targets?.length ? `<details><summary>${esc(I.S("Language goals", "Metas de lenguaje"))}</summary><ul>${tpl.targets.map((t) => `<li>${esc(pick(t, lang))}</li>`).join("")}</ul></details>` : ""}${tpl.teacherNotes ? `<details><summary>${esc(I.S("Teacher notes", "Notas para docentes"))}</summary><p>${esc(pick(tpl.teacherNotes, lang))}</p></details>` : ""}<p><a href="${BASE}/book-studio/new">${esc(I.S("Use a blank book instead", "Usar un libro en blanco"))}</a></p></div></div><input type="hidden" name="template" value="${tpl.id}" />`
          : `<fieldset class="bk-modes-pick"><legend>${esc(I.S("What do you want to make?", "¿Qué quieres hacer?"))}</legend><div class="bk-mode-radios">${CREATION_MODES.map((m) => `<label class="bk-kind"><input type="radio" name="bk-mode" value="${m.id}" ${(mode?.id || "story") === m.id ? "checked" : ""} /><span aria-hidden="true">${bkIcon(m.icon)}</span><span>${esc(m[lang])}</span></label>`).join("")}</div><p class="fine">${esc(I.S("The same story can be read as a book, played as an adventure, watched as a movie or printed as a comic.", "El mismo cuento se puede leer como libro, jugar como aventura, ver como película o imprimir como cómic."))}</p></fieldset><fieldset class="bk-kinds"><legend>${esc(I.S("1. What kind of book?", "1. ¿Qué tipo de libro?"))}</legend>${kindCards}</fieldset><p><a class="bk-create-tpl-link" href="${BASE}/book-studio/templates?grades=${ctx.band}">${esc(I.S(`Or choose one of ${templatesFor(ctx.band).length} templates with directions →`, `O elige una de ${templatesFor(ctx.band).length} plantillas con instrucciones →`))}</a></p>`
      }
      <label class="bk-field bk-create-title"><span>${esc(tpl ? I.S("Title of your book", "Título de tu libro") : I.S("2. Title of your book", "2. Título de tu libro"))}</span><input name="title" required maxlength="80" value="${esc(tpl ? pick(tpl.title, lang) : "")}" placeholder="${esc(I.S("My amazing book", "Mi libro increíble"))}" /></label>
      <label class="bk-field"><span>${esc(I.S("Your name for the cover (optional; first name is enough)", "Tu nombre para la portada (opcional; basta con el nombre)"))}</span><input name="author" maxlength="60" autocomplete="off" /></label>
      ${!tpl ? `<label class="bk-field"><span>${esc(I.S("What is the book for? (optional)", "¿Para qué es el libro? (opcional)"))}</span><select name="purpose"><option value="">${esc(I.S("Just for fun", "Solo por diversión"))}</option><option value="Narrate">${esc(I.S("Tell a story (narrate)", "Contar una historia (narrar)"))}</option><option value="Inform">${esc(I.S("Teach about a topic (inform)", "Enseñar sobre un tema (informar)"))}</option><option value="Explain">${esc(I.S("Explain how or why (explain)", "Explicar cómo o por qué (explicar)"))}</option><option value="Argue">${esc(I.S("Convince the reader (argue)", "Convencer al lector (argumentar)"))}</option></select></label>` : ""}
      <div class="row-actions"><button type="submit" class="btn btn-primary btn-big">${bkIcon("book")} ${esc(I.S("Create and open the editor", "Crear y abrir el editor"))}</button></div>
    </form></section>`;
  box.querySelector("h1").focus({ preventScroll: true });
  box.querySelector("[data-create]").addEventListener("change", (e) => {
    if (!e.target.matches('[name="bk-mode"]')) return;
    const k = CREATION_MODES.find((m) => m.id === e.target.value)?.kind;
    const radio = box.querySelector(`[name="bk-kind"][value="${k}"]`);
    if (radio) radio.checked = true;
  });
  box.querySelector("[data-create]").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const title =
      String(f.get("title") || "")
        .trim()
        .slice(0, 80) || I.S("My book", "Mi libro");
    const author = String(f.get("author") || "")
      .trim()
      .slice(0, 60);
    const t = templateById(f.get("template"));
    const book = t
      ? bookFromTemplate(t, { title, author, lang, band: ctx.band })
      : newBook({
          kind: String(f.get("kind") || f.get("bk-kind") || "blank"),
          title,
          author,
          lang,
          purpose: String(f.get("purpose") || ""),
        });
    const chosen = CREATION_MODES.find((m) => m.id === f.get("bk-mode"))?.id || mode?.id || "story";
    book.mode = chosen;
    // The book remembers the band it was written for: its supports, stage guide and self-check follow it.
    book.gradeCluster = clusterForBand(ctx.band);
    if (!t && chosen === "adventure") adventureSkeleton(book, makePage);
    const saved = await db.saveBook(book);
    await db.saveVersion(saved, I.S("New book", "Libro nuevo")).catch(() => {});
    go(ctx, `/edit/${saved.id}`);
  });
}

