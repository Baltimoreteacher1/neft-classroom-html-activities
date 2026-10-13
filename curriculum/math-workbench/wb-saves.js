/* Math Workbench — "My pages": named saves and earlier autosave versions.
 *
 * Backed by wb-storage.js (IndexedDB). The Workbench still starts on a clean
 * board each visit; this is how a student gets back to a past problem on
 * purpose, instead of through the six-second "Restore last session" toast.
 */
(function (root) {
  "use strict";
  const MWB = root.MWB;
  if (!MWB || !MWB.panel) return;
  const { h } = MWB;
  const t = MWB.t;

  const when = (ms) => {
    try {
      return new Date(ms).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch (_) {
      return "";
    }
  };
  const hasWork = () =>
    MWB.ctx.notebook.boards.some(
      (b) => (b.strokes && b.strokes.length) || (b.objects && b.objects.length),
    );

  /** Small ink-only picture so a saved page is easy to recognise. */
  function thumb() {
    try {
      const c = MWB.ctx.canvas;
      const out = document.createElement("canvas");
      out.width = 160;
      out.height = Math.max(40, Math.round((160 * c.height) / Math.max(1, c.width)));
      out.height = Math.min(out.height, 120);
      const x = out.getContext("2d");
      x.fillStyle = "#fff";
      x.fillRect(0, 0, out.width, out.height);
      x.drawImage(
        c,
        0,
        0,
        c.width,
        Math.min(c.height, (c.width * out.height) / out.width),
        0,
        0,
        out.width,
        out.height,
      );
      return out.toDataURL("image/jpeg", 0.55);
    } catch (_) {
      return "";
    }
  }

  MWB.panel.addSection(
    "saves",
    "My pages & earlier versions",
    "Mis páginas y versiones anteriores",
    () => {
      const c = MWB.ctx;
      const store = c.store;
      const root0 = h("div", { class: "wbx-stack" });
      if (!store || !store.available()) {
        root0.appendChild(
          h(
            "p",
            { class: "wbx-live" },
            t(
              "Saving named pages needs browser storage, which is turned off here. Use Backup in the top bar to keep a file instead.",
              "Guardar páginas con nombre necesita almacenamiento del navegador, que está desactivado. Usa Copia de seguridad en la barra superior para guardar un archivo.",
            ),
          ),
        );
        return root0;
      }
      const live = h("p", { class: "wbx-live", role: "status", "aria-live": "polite" });
      const savesBox = h("div", { class: "wbx-stack" });
      const versBox = h("div", { class: "wbx-stack" });
      const name = MWB.textField(
        "",
        t("Name for this set of pages", "Nombre para este conjunto de páginas"),
        () => {},
        170,
      );
      name.placeholder = t("e.g. Ratios homework", "p. ej. Tarea de razones");

      async function replaceWith(json, label) {
        if (
          hasWork() &&
          !root.confirm(
            t(
              `Open "${label}"? It replaces the pages you have open now. Your current pages are kept as an earlier version.`,
              `¿Abrir "${label}"? Reemplaza las páginas abiertas. Tus páginas actuales se guardan como versión anterior.`,
            ),
          )
        )
          return;
        await store.archiveSession(c.notebookSnapshot());
        c.loadSaved(json);
        live.textContent = t(`Opened "${label}".`, `Se abrió "${label}".`);
        refresh();
      }

      async function refresh() {
        const [saves, versions] = await Promise.all([store.listSaves(), store.listVersions()]);
        savesBox.textContent = "";
        if (!saves.length)
          savesBox.appendChild(
            h(
              "p",
              { class: "wbx-live" },
              t("No saved pages yet.", "Todavía no hay páginas guardadas."),
            ),
          );
        for (const s of saves) {
          const row = h("div", { class: "wbx-saverow" });
          if (s.thumb) row.appendChild(h("img", { src: s.thumb, alt: "", class: "wbx-thumb" }));
          row.appendChild(
            h(
              "div",
              { class: "wbx-savemeta" },
              h("b", null, s.name),
              h(
                "span",
                { class: "wbx-live" },
                `${when(s.at)} · ${s.pages} ${s.pages === 1 ? t("page", "página") : t("pages", "páginas")}`,
              ),
            ),
          );
          row.appendChild(
            MWB.btn(t("Open", "Abrir"), t(`Open ${s.name}`, `Abrir ${s.name}`), async () => {
              const rec = await store.getSave(s.id);
              if (rec) replaceWith(rec.data, s.name);
            }),
          );
          row.appendChild(
            MWB.btn(
              t("Rename", "Renombrar"),
              t(`Rename ${s.name}`, `Renombrar ${s.name}`),
              async () => {
                const next = root.prompt(t("New name", "Nuevo nombre"), s.name);
                if (next && next.trim()) {
                  await store.renameSave(s.id, next.trim());
                  refresh();
                }
              },
            ),
          );
          row.appendChild(
            MWB.btn(t("Delete", "Borrar"), t(`Delete ${s.name}`, `Borrar ${s.name}`), async () => {
              if (
                !root.confirm(
                  t(`Delete "${s.name}" for good?`, `¿Borrar "${s.name}" para siempre?`),
                )
              )
                return;
              await store.deleteSave(s.id);
              refresh();
            }),
          );
          savesBox.appendChild(row);
        }
        versBox.textContent = "";
        if (!versions.length)
          versBox.appendChild(
            h(
              "p",
              { class: "wbx-live" },
              t(
                "Earlier versions appear here as you work.",
                "Las versiones anteriores aparecen aquí mientras trabajas.",
              ),
            ),
          );
        for (const v of versions) {
          const label = `${v.label === "last session" ? t("Last session", "Sesión anterior") : t("Autosave", "Autoguardado")} · ${when(v.at)}`;
          const row = h(
            "div",
            { class: "wbx-saverow" },
            h(
              "div",
              { class: "wbx-savemeta" },
              h("b", null, label),
              h(
                "span",
                { class: "wbx-live" },
                `${v.pages} ${v.pages === 1 ? t("page", "página") : t("pages", "páginas")}`,
              ),
            ),
          );
          row.appendChild(
            MWB.btn(t("Open", "Abrir"), t(`Open ${label}`, `Abrir ${label}`), async () => {
              const rec = await store.getVersion(v.id);
              if (rec) replaceWith(rec.data, label);
            }),
          );
          versBox.appendChild(row);
        }
      }

      const saveBtn = MWB.btn(
        t("Save a copy", "Guardar copia"),
        t("Save all my pages under this name", "Guardar todas mis páginas con este nombre"),
        async () => {
          if (!hasWork()) {
            live.textContent = t(
              "There is nothing on the board to save yet.",
              "Todavía no hay nada en la pizarra para guardar.",
            );
            return;
          }
          try {
            await store.createSave(
              name.value.trim() || t("My pages", "Mis páginas"),
              c.notebookSnapshot(),
              thumb(),
            );
            name.value = "";
            live.textContent = t("Saved.", "Guardado.");
            refresh();
          } catch (_) {
            live.textContent = t(
              "Could not save here. Try Backup in the top bar.",
              "No se pudo guardar aquí. Prueba Copia de seguridad en la barra superior.",
            );
          }
        },
      );
      root0.append(
        h("div", { class: "wbx-row" }, name, saveBtn),
        live,
        h("p", { class: "wbx-title" }, t("Saved pages", "Páginas guardadas")),
        savesBox,
        h("p", { class: "wbx-title" }, t("Earlier versions", "Versiones anteriores")),
        versBox,
      );
      refresh();
      return root0;
    },
  );
})(window);
