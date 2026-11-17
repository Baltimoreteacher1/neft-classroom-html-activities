// Editor dialogs: Version history, Share & export, and Finish (self-check, send to a joined class, add to portfolio).
// Each is a native <dialog> (focus is trapped and Escape closes it); nothing here uses alert/confirm/prompt.
import * as db from "./db.js";
import {
  buildEpub,
  coverImage,
  download,
  exportProject,
  fileBase,
  printBook,
  reviewText,
  shareLink,
} from "./export.js";
import { bkIcon } from "./icons.js";
import { STATUSES, finishChecklist } from "./model.js";
import { selfCheckHTML } from "./program-ui.js";
import { esc } from "./render.js";


function shell(E, title, body, { refresh = false } = {}) {
  // An async refresh never reopens a dialog the learner has already closed.
  if (refresh && !E.dialog.open) return;
  const tr = E.I.S;
  E.dialog.innerHTML = `<form method="dialog" class="bk-dialog-inner"><header class="bk-dialog-head"><h2 id="bkDialogTitle">${esc(title)}</h2><button class="bk-tbtn" value="close" aria-label="${esc(tr("Close", "Cerrar"))}">${bkIcon("close")}</button></header><div data-bk-dialog-body>${body}</div></form>`;
  if (!E.dialog.open) E.dialog.showModal();
  // Re-rendering the open dialog removes the focused control; keep focus inside the dialog.
  if (!E.dialog.contains(document.activeElement) || document.activeElement === E.dialog) E.dialog.querySelector("[data-bk-dialog-body] button, [data-bk-dialog-body] input")?.focus({ preventScroll: true });
}

async function historyDialog(E, { refresh = false } = {}) {
  const tr = E.I.S;
  const { core } = E;
  await core.saveNow();
  const versions = await db.listVersions(core.S.book.id).catch(() => []);
  const fmt = (iso) =>
    new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  if (refresh && !E.dialog.open) return;
  shell(
    E,
    tr("Version history", "Historial de versiones"),
    `<p>${esc(tr("A version is a saved copy of the whole book. Save one before a big change; Book Studio also saves one every ten minutes while you work.", "Una versión es una copia guardada de todo el libro. Guarda una antes de un cambio grande; Book Studio también guarda una cada diez minutos mientras trabajas."))}</p>
    <div class="bk-btnrow"><label class="bk-field bk-grow"><span>${esc(tr("Name this version (optional)", "Nombre de esta versión (opcional)"))}</span><input type="text" maxlength="80" data-bk-vname placeholder="${esc(tr("Before I changed the ending", "Antes de cambiar el final"))}" /></label><button type="button" class="btn btn-primary" data-bk-dlg="save-version">${esc(tr("Save a version now", "Guardar una versión ahora"))}</button></div>
    ${
      versions.length
        ? `<ol class="bk-versions">${versions.map((v) => `<li><span><strong>${esc(v.label || tr("Saved version", "Versión guardada"))}</strong><br /><span class="fine">${esc(fmt(v.at))} · ${v.pages} ${esc(tr("pages", "páginas"))}</span></span><button type="button" class="btn small" data-bk-dlg="restore" data-vid="${v.vid}">${esc(tr("Restore", "Restaurar"))}</button></li>`).join("")}</ol>`
        : `<p class="fine">${esc(tr("No saved versions yet.", "Todavía no hay versiones guardadas."))}</p>`
    }
    <p class="fine">${esc(tr("Restoring keeps your current book as a version first, so nothing is lost.", "Al restaurar, tu libro actual se guarda primero como versión, así que nada se pierde."))}</p>`,
  );
}

async function shareDialog(E, { refresh = false } = {}) {
  const tr = E.I.S;
  const { core } = E;
  const S = core.S;
  // Writing together with the class (collab.js): only offered to a learner who joined a class.
  const { collabSectionHTML } = await import("./collab.js");
  if (refresh && !E.dialog.open) return;
  shell(
    E,
    tr("Share & export", "Compartir y exportar"),
    `${collabSectionHTML(E)}
    <div class="bk-share-grid">
      <section><h3>${bkIcon("export")} ${esc(tr("Print or save as PDF", "Imprimir o guardar como PDF"))}</h3><p class="fine">${esc(tr("Every page prints on its own sheet at the book's size. Choose “Save as PDF” in the print window to make a PDF.", "Cada página se imprime en su propia hoja al tamaño del libro. Elige “Guardar como PDF” en la ventana de impresión para hacer un PDF."))}</p><button type="button" class="btn" data-bk-dlg="print">${esc(tr("Print / PDF", "Imprimir / PDF"))}</button></section>
      <section><h3>${bkIcon("book")} ${esc(tr("E-book (EPUB)", "Libro electrónico (EPUB)"))}</h3><p class="fine">${esc(tr("Opens in Apple Books, Thorium, Google Play Books and most e-readers, with your recordings and picture descriptions.", "Se abre en Apple Books, Thorium, Google Play Libros y la mayoría de los lectores, con tus grabaciones y descripciones de imágenes."))}</p><button type="button" class="btn" data-bk-dlg="epub">${esc(tr("Download EPUB", "Descargar EPUB"))}</button></section>
      <section><h3>${bkIcon("image")} ${esc(tr("Cover picture", "Imagen de la portada"))}</h3><p class="fine">${esc(tr("A picture of your cover to use as a thumbnail or poster.", "Una imagen de tu portada para usar como miniatura o cartel."))}</p><button type="button" class="btn" data-bk-dlg="cover">${esc(tr("Download cover", "Descargar portada"))}</button></section>
      <section><h3>${bkIcon("upload")} ${esc(tr("Book project file", "Archivo del proyecto"))}</h3><p class="fine">${esc(tr("Everything in the book, including pictures and recordings. Open it in Book Studio on another device, or keep it as a backup.", "Todo el libro, con imágenes y grabaciones. Ábrelo en Book Studio en otro dispositivo o guárdalo como copia de seguridad."))}</p><button type="button" class="btn" data-bk-dlg="project">${esc(tr("Download .langbook", "Descargar .langbook"))}</button></section>
      <section class="bk-share-link"><h3>${bkIcon("share")} ${esc(tr("Read-only link", "Enlace de solo lectura"))}</h3><p class="fine">${esc(tr("The link itself carries your words, illustrations and drawings; nothing is uploaded. Uploaded pictures, recordings and videos stay on this device. Share it only with people you and your teacher choose.", "El enlace lleva tus palabras, ilustraciones y dibujos; no se sube nada. Las imágenes, grabaciones y videos que subiste se quedan en este dispositivo. Compártelo solo con quienes tú y tu docente elijan."))}</p><button type="button" class="btn" data-bk-dlg="link">${esc(tr("Make a link", "Crear un enlace"))}</button><div data-bk-link-out></div></section>
    </div>
    <p class="bk-status" role="status" data-bk-dlg-status></p>
    <p class="fine">${esc(tr(`“${S.book.title}” is saved on this device only.`, `“${S.book.title}” solo está guardado en este dispositivo.`))}</p>`,
  );
}

/** The learner's class link (only present after joining a class in /class). */
async function classLink() {
  try {
    const { loadLink } = await import("../class/link.js");
    return loadLink();
  } catch {
    return null;
  }
}

async function finishDialog(E, { refresh = false } = {}) {
  const tr = E.I.S;
  const { core } = E;
  const S = core.S;
  const lang = E.ctx.prefs?.lang === "es" ? "es" : "en";
  const checks = finishChecklist(S.book);
  const linked = !!(await classLink());
  const st = STATUSES[S.book.status];
  if (refresh && !E.dialog.open) return;
  shell(
    E,
    tr("Finish my book", "Terminar mi libro"),
    `<p>${esc(tr("Check your book before you share it. These are reminders, not a score.", "Revisa tu libro antes de compartirlo. Son recordatorios, no una calificación."))}</p>
    <ul class="bk-checklist">${checks.map((c) => `<li class="${c.ok ? "is-ok" : "is-todo"}">${c.ok ? bkIcon("check") : "•"} ${esc(c[lang])}</li>`).join("")}</ul>
    ${selfCheckHTML(S.book, E.ctx.band, E.I)}
    <p class="fine">${esc(tr("Status:", "Estado:"))} <strong>${esc(st[lang])}</strong></p>
    ${S.book.review ? `<section class="bk-review"><h3>${bkIcon("feedback")} ${esc(tr("Feedback from your teacher", "Comentarios de tu docente"))}</h3>${S.book.review.chips.length ? `<ul class="bk-words">${S.book.review.chips.map((c) => `<li class="chip">${esc(c)}</li>`).join("")}</ul>` : ""}${S.book.review.comment ? `<p>${esc(S.book.review.comment)}</p>` : ""}<p class="fine">${esc(tr("Revise your book, then send it again.", "Revisa tu libro y vuelve a enviarlo."))}</p></section>` : ""}
    <div class="bk-finish-actions">
      <button type="button" class="btn" data-bk-dlg="mark-finished">${bkIcon("check")} ${esc(tr("Mark as finished", "Marcar como terminado"))}</button>
      ${linked ? `<button type="button" class="btn btn-primary" data-bk-dlg="submit">${bkIcon("feedback")} ${esc(S.book.submission ? tr("Send the new version to my teacher", "Enviar la nueva versión a mi docente") : tr("Send to my teacher", "Enviar a mi docente"))}</button>` : `<p class="fine">${esc(tr("To send books to a teacher, join your class first in My class. Or download the book project file and give it to your teacher.", "Para enviar libros a un docente, primero únete a tu clase en Mi clase. O descarga el archivo del proyecto y dáselo a tu docente."))} <a href="/access-practice-lab/class">${esc(tr("My class", "Mi clase"))}</a></p>`}
      ${S.book.submission ? `<button type="button" class="btn ghost" data-bk-dlg="check-feedback">${esc(tr("Check for teacher feedback", "Buscar comentarios del docente"))}</button>` : ""}
      <button type="button" class="btn" data-bk-dlg="portfolio" aria-pressed="${S.book.status === "published"}">${bkIcon("book")} ${esc(S.book.status === "published" ? tr("In my portfolio", "En mi portafolio") : tr("Add to my portfolio", "Agregar a mi portafolio"))}</button>
    </div>
    <p class="bk-status" role="status" data-bk-dlg-status></p>`,
  );
}

export function openDialog(E, which) {
  if (which === "history") return historyDialog(E);
  if (which === "share") return shareDialog(E);
  if (which === "finish") return finishDialog(E);
}

/** Pull this learner's teacher reviews and attach the one for this book's latest submission. */
export async function refreshReview(book) {
  const link = await classLink();
  if (!link || !book.submission?.workId) return null;
  const [{ api }, { loadRubric }, { studentFeedback }] = await Promise.all([import("../class/link.js"), import("../class/review-queue.js"), import("../acc/review/review.js")]);
  const res = await api.reviewMine(link);
  if (!res?.ok) return null;
  const mine = (res.reviews || []).find((r) => r.itemId === book.submission.workId);
  if (!mine) return null;
  // Ratings become the rubric's own descriptors (never a number), exactly as /class shows them.
  const rubric = await loadRubric(mine.rubric).catch(() => null);
  const fb = rubric ? studentFeedback({ shared: true, ratings: mine.chips || {}, note: mine.comment, reviewedAt: mine.reviewedAt }, rubric) : null;
  const chips = fb ? [...fb.strengths.map((x) => `${x.label}: ${x.text}`), ...(fb.nextStep ? [`Next step · ${fb.nextStep.label}: ${fb.nextStep.text}`] : [])] : [];
  return { chips, comment: mine.comment || "", at: new Date(mine.reviewedAt || Date.now()).toISOString() };
}

// Dialog actions (delegated from the dialog element).
document.addEventListener("click", async (e) => {
  const btn = e.target.closest?.("[data-bk-dlg]");
  if (!btn) return;
  const dialog = btn.closest("dialog");
  const E = dialog?.__bkEditor;
  if (!E) return;
  const tr = E.I.S;
  const { core } = E;
  const S = core.S;
  const status = (msg) => {
    const s = dialog.querySelector("[data-bk-dlg-status]");
    if (s) s.textContent = msg;
    E.say(msg);
  };
  const act = btn.dataset.bkDlg;
  btn.disabled = true;
  try {
    await core.saveNow();
    if (act.startsWith("collab-")) {
      const { onCollabAction } = await import("./collab.js");
      const msg = await onCollabAction(E, act, btn);
      await shareDialog(E, { refresh: true });
      status(msg);
    } else if (act === "save-version") {
      await db.saveVersion(S.book, dialog.querySelector("[data-bk-vname]")?.value || "");
      await historyDialog(E, { refresh: true });
      E.say(tr("Version saved.", "Versión guardada."));
    } else if (act === "restore") {
      const v = await db.getVersion(Number(btn.dataset.vid));
      if (v) {
        await db.saveVersion(S.book, tr("Before restoring", "Antes de restaurar"));
        S.book.pages = v.pages;
        S.book.title = v.title;
        S.book.format = v.format;
        S.pageIndex = 0;
        S.selected = null;
        core.commit();
        dialog.close();
        E.say(
          tr(
            "Version restored. Undo or Version history can bring back the other one.",
            "Versión restaurada. Deshacer o el historial pueden traer la otra.",
          ),
        );
      }
    } else if (act === "print") {
      dialog.close();
      await printBook(S.book, { lang: E.ctx.prefs?.lang === "es" ? "es" : "en" });
    } else if (act === "epub") {
      status(tr("Making your e-book…", "Haciendo tu libro electrónico…"));
      const { blob, notes } = await buildEpub(S.book);
      download(blob, `${fileBase(S.book)}.epub`);
      status(`${tr("E-book downloaded.", "Libro electrónico descargado.")} ${notes.join(" ")}`);
    } else if (act === "cover") {
      const { blob, ext } = await coverImage(S.book);
      download(blob, `${fileBase(S.book)}-cover.${ext}`);
      status(
        ext === "png"
          ? tr("Cover downloaded.", "Portada descargada.")
          : tr(
              "This browser saved the cover as an SVG picture (it opens in any web browser).",
              "Este navegador guardó la portada como imagen SVG (se abre en cualquier navegador).",
            ),
      );
    } else if (act === "project") {
      download(await exportProject(S.book), `${fileBase(S.book)}.langbook`);
      status(
        tr(
          "Book project downloaded. Open it from My books → Open a book file.",
          "Proyecto descargado. Ábrelo desde Mis libros → Abrir un archivo de libro.",
        ),
      );
    } else if (act === "link") {
      // A class assignment, or a book set to class / family / public, needs the teacher's approval before a link exists.
      const gated = S.book.assignment?.role === "student" || ["class", "family", "public"].includes(S.book.publish?.audience);
      if (gated && !S.book.publish?.approvedAt) {
        dialog.querySelector("[data-bk-link-out]").innerHTML = `<p class="bk-warn" role="alert">${esc(tr("A teacher needs to approve this book before it can be shared. Ask your teacher to open it and choose Publish → Approve for sharing.", "Un docente debe aprobar este libro antes de compartirlo. Pide a tu docente que lo abra y elija Publicar → Aprobar para compartir."))}</p>`;
        return;
      }
      const { url, dropped, bytes } = await shareLink(S.book);
      const out = dialog.querySelector("[data-bk-link-out]");
      const tooLong = bytes > 60000;
      out.innerHTML = `<label class="bk-field"><span>${esc(tr("Link", "Enlace"))}</span><input type="text" readonly value="${esc(url)}" data-bk-link /></label><div class="bk-btnrow"><button type="button" class="btn small" data-bk-dlg="copy-link">${esc(tr("Copy link", "Copiar enlace"))}</button></div>${dropped ? `<p class="fine">${esc(tr(`${dropped} uploaded picture(s), recording(s) or video(s) are not in the link.`, `${dropped} imagen(es), grabación(es) o video(s) subidos no están en el enlace.`))}</p>` : ""}${tooLong ? `<p class="fine">${esc(tr("This link is very long because of the drawings. Some apps may cut it; the book project file always works.", "Este enlace es muy largo por los dibujos. Algunas aplicaciones pueden cortarlo; el archivo del proyecto siempre funciona."))}</p>` : ""}`;
      out.querySelector("input").select();
    } else if (act === "copy-link") {
      const input = dialog.querySelector("[data-bk-link]");
      await navigator.clipboard?.writeText(input.value).then(
        () => status(tr("Link copied.", "Enlace copiado.")),
        () => {
          input.select();
          status(
            tr(
              "Press Ctrl+C (or ⌘C) to copy the selected link.",
              "Presiona Ctrl+C (o ⌘C) para copiar el enlace seleccionado.",
            ),
          );
        },
      );
    } else if (act === "selfcheck") {
      const id = btn.dataset.id;
      const on = S.book.selfCheck.includes(id);
      core.setBook({ selfCheck: on ? S.book.selfCheck.filter((x) => x !== id) : [...S.book.selfCheck, id] });
      btn.setAttribute("aria-pressed", String(!on));
      const done = dialog.querySelectorAll('[data-bk-dlg="selfcheck"][aria-pressed="true"]').length;
      const count = dialog.querySelector("[data-bk-selfcount]");
      if (count) count.textContent = `${done}/${dialog.querySelectorAll('[data-bk-dlg="selfcheck"]').length}`;
    } else if (act === "mark-finished") {
      if (S.book.status === "draft" || S.book.status === "returned")
        core.setBook({ status: "completed" });
      await core.saveNow();
      await db.saveVersion(S.book, tr("Finished version", "Versión terminada"));
      await finishDialog(E, { refresh: true });
      status(
        tr(
          "Marked as finished. You can still keep editing.",
          "Marcado como terminado. Puedes seguir editando.",
        ),
      );
    } else if (act === "submit") {
      const link = await classLink();
      const { api } = await import("../class/link.js");
      const res = await api.reviewShare(link, {
        label: `Book: ${S.book.title}`.slice(0, 80),
        text: reviewText(S.book),
      });
      if (res?.ok && res.workId) {
        core.setBook({
          status: "submitted",
          submission: { workId: res.workId, at: new Date().toISOString() },
          review: null,
        });
        await core.saveNow();
        await db.saveVersion(S.book, tr("Sent to teacher", "Enviado al docente"));
        await finishDialog(E, { refresh: true });
        status(
          tr(
            "Sent to your teacher. Your teacher sees the words of your book; pictures and recordings stay on this device.",
            "Enviado a tu docente. Tu docente ve las palabras de tu libro; las imágenes y grabaciones se quedan en este dispositivo.",
          ),
        );
      } else
        status(
          tr(
            "Could not send your book. It is still saved on this device. Try again later.",
            "No se pudo enviar tu libro. Sigue guardado en este dispositivo. Inténtalo más tarde.",
          ),
        );
    } else if (act === "check-feedback") {
      const review = await refreshReview(S.book).catch(() => null);
      if (review) {
        core.setBook({ review, status: "returned" });
        await finishDialog(E, { refresh: true });
        status(tr("Your teacher's feedback is here.", "Aquí están los comentarios de tu docente."));
      } else
        status(
          tr(
            "No feedback yet. Check again later.",
            "Todavía no hay comentarios. Vuelve a revisar más tarde.",
          ),
        );
    } else if (act === "portfolio") {
      core.setBook({ status: S.book.status === "published" ? "completed" : "published" });
      await finishDialog(E, { refresh: true });
      status(
        S.book.status === "published"
          ? tr(
              "Added to your portfolio on this device.",
              "Agregado a tu portafolio en este dispositivo.",
            )
          : tr("Removed from your portfolio.", "Quitado de tu portafolio."),
      );
    }
  } catch (error) {
    console.error("[book-studio]", error);
    status(
      tr(
        "Something went wrong. Your book is still saved on this device.",
        "Algo salió mal. Tu libro sigue guardado en este dispositivo.",
      ),
    );
  } finally {
    btn.disabled = false;
  }
});
