// Project Studio · the packet tray. Parts added from any page are combined into ONE worksheet model
// (build.js#packetActivity), so the PDF, the Word file and the Activity Studio copy all come from the same content.

import { h } from "../studio/editor/ui.js";
import { FORMATS, packetActivity } from "./build.js";
import { saveBlob, slug, wordFile } from "./files.js";
import { clearItems, moveItem, readSession, removeItem, setPacketTitle } from "./session.js";

const formatLabel = (S, id) => {
  const f = FORMATS.find((x) => x.id === id);
  return f ? S(f.label.en, f.label.es) : "";
};

export function openPacket(env) {
  const { S, lang, io } = env;
  const dlg = h("dialog.cr-dialog.cr-packet", { "aria-labelledby": "cr-pk-title" });
  const status = h("p.cr-status", { role: "status", "aria-live": "polite" });
  const body = h("div.cr-body");
  const say = (m) => {
    status.textContent = m;
  };
  dlg.append(
    h("div.cr-head", h("h2", { id: "cr-pk-title" }, S("Resource packet", "Paquete de recursos")), h("button.cr-x", { type: "button", "aria-label": S("Close", "Cerrar"), onclick: () => dlg.close() }, "✕")),
    body,
    status,
  );
  dlg.addEventListener("close", () => {
    dlg.remove();
    env.onPacketChange?.();
  });
  document.body.append(dlg);
  dlg.showModal();

  const combined = () => {
    const s = readSession(io);
    return packetActivity(
      s.items.map((i) => ({ title: i.title, activity: i.activity })),
      { title: s.title || S("Resource packet", "Paquete de recursos") },
    );
  };

  function draw(focusId = "") {
    const s = readSession(io);
    if (!s.items.length) {
      body.replaceChildren(
        h("p.cr-lede", S("The packet is empty. On any resource page, open Create and choose Add to packet. Parts stay here while you browse, even after a refresh.", "El paquete está vacío. En cualquier página de recursos, abra Crear y elija Agregar al paquete. Las partes se quedan aquí mientras navega, incluso si recarga.")),
      );
      return;
    }
    const titleInput = h("input.cr-input", { id: "cr-pk-name", value: s.title, placeholder: S("Resource packet", "Paquete de recursos"), onchange: (e) => setPacketTitle(io, e.target.value) });
    const row = (it, i) =>
      h(
        "li.cr-pk-item",
        { "data-id": it.id },
        h("span.cr-n", String(i + 1)),
        h("span.cr-pk-t", h("strong", it.title), h("span.cr-fine", ` ${formatLabel(S, it.format)}`)),
        h("button.cr-btn.cr-small", { type: "button", disabled: i === 0, "aria-label": S(`Move ${it.title} up`, `Subir ${it.title}`), "data-act": "up", onclick: () => (moveItem(io, it.id, -1), draw(`${it.id}:up`)) }, "↑"),
        h("button.cr-btn.cr-small", { type: "button", disabled: i === s.items.length - 1, "aria-label": S(`Move ${it.title} down`, `Bajar ${it.title}`), "data-act": "down", onclick: () => (moveItem(io, it.id, 1), draw(`${it.id}:down`)) }, "↓"),
        h("button.cr-btn.cr-small", { type: "button", "aria-label": S(`Download ${it.title} as HTML`, `Descargar ${it.title} como HTML`), onclick: () => html(it.activity) }, "HTML"),
        h("button.cr-btn.cr-small", { type: "button", "aria-label": S(`Remove ${it.title}`, `Quitar ${it.title}`), onclick: () => (removeItem(io, it.id), say(S("Removed.", "Quitado.")), draw()) }, S("Remove", "Quitar")),
      );
    const c = combined();
    body.replaceChildren(
      h("label.cr-label", { for: "cr-pk-name" }, S("Packet title", "Título del paquete")),
      titleInput,
      h("ol.cr-pk-list", s.items.map(row)),
      h(
        "p.cr-fine",
        S(`One document, ${c.included} part${c.included === 1 ? "" : "s"}. `, `Un documento, ${c.included} parte(s). `),
        c.duplicateBlocks ? S(`${c.duplicateBlocks} repeated block${c.duplicateBlocks === 1 ? "" : "s"} (the same word list or directions) appear once. `, `${c.duplicateBlocks} bloque(s) repetidos aparecen una vez. `) : "",
        c.skippedBlocks ? S(`${c.skippedBlocks} block${c.skippedBlocks === 1 ? "" : "s"} did not fit (80 per document): remove a part or print parts separately.`, `${c.skippedBlocks} bloque(s) no cupieron (80 por documento): quite una parte o imprima por separado.`) : "",
      ),
      h(
        "div.cr-actions",
        h("button.cr-btn.cr-primary", { type: "button", onclick: () => print("student") }, S("Print or save packet as PDF", "Imprimir o guardar el paquete como PDF")),
        h("button.cr-btn", { type: "button", onclick: () => word("student") }, S("Download packet (Word)", "Descargar paquete (Word)")),
        h("button.cr-btn", { type: "button", onclick: () => word("key") }, S("Answer key (Word)", "Clave de respuestas (Word)")),
        h("button.cr-btn", { type: "button", onclick: () => print("key") }, S("Print answer key", "Imprimir clave")),
        h("button.cr-btn", { type: "button", onclick: () => env.openStudio(combined().activity) }, S("Open packet in Activity Studio", "Abrir el paquete en el Estudio de actividades")),
        h("button.cr-btn.cr-quiet", { type: "button", onclick: () => (clearItems(io), say(S("Packet cleared.", "Paquete vaciado.")), draw()) }, S("Clear packet", "Vaciar paquete")),
      ),
    );
    if (focusId) {
      const [id, act] = focusId.split(":");
      const btn = body.querySelector(`[data-id="${id}"] [data-act="${act}"]`);
      (btn && !btn.disabled ? btn : body.querySelector(`[data-id="${id}"] button:not([disabled])`))?.focus();
    }
  }

  async function print(part) {
    const { printHtml } = await import("../studio/editor/preview.js");
    const { html: doc } = await printHtml(combined().activity, { lang, part });
    (await import("../studio/print/open-print.js")).openPrint(doc, { lang, onFallback: say });
  }
  async function word(part) {
    say(S("Building the Word file…", "Creando el archivo de Word…"));
    const ok = await wordFile(combined().activity, part, lang);
    say(ok ? S("Downloaded.", "Descargado.") : S("The Word file could not be made. Try again.", "No se pudo crear el archivo de Word. Intente de nuevo."));
  }
  async function html(activity) {
    const { studentHtml } = await import("../studio/editor/preview.js");
    saveBlob(new Blob([await studentHtml(activity, { lang })], { type: "text/html" }), `${slug(activity.title)}.html`);
    say(S("Downloaded.", "Descargado."));
  }
  draw();
}
