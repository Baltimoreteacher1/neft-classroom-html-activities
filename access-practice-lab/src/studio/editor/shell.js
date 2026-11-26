// The editor: top bar (title, context, save status, undo/redo, Share), the live preview in the middle, and the
// three tabs on the side (Content, Look & Feel, Student Supports) with More options tucked underneath.

import { getLocal, saveLocal, studioApi } from "../drafts.js";
import { createCheckPanel } from "./check-panel.js";
import { createContentPanel } from "./content-panel.js";
import { createPreview } from "./preview.js";
import { isPlatform, isVersion } from "./customize-logic.js";
import { createQuickPanel } from "./quick.js";
import { createSaver } from "./save.js";
import { openShare } from "./share.js";
import { handoff, notesBanner, sourceBanner } from "./source-banner.js";
import { lookPanel, moreOptions, supportsPanel } from "./side-panels.js";
import { createStore } from "./store.js";
import { button, clear, h, iconButton, openDialog, say } from "./ui.js";

const TABS = [
  ["quick", "Quick Customize", "Personalizar rápido"],
  ["content", "Edit content", "Editar contenido"],
  ["look", "Look & Feel", "Aspecto"],
  ["supports", "Student Supports", "Apoyos para estudiantes"],
  ["check", "Check my work", "Revisar mi trabajo"],
];

const STATUS = {
  saved: ["Saved on this device", "Guardado en este dispositivo"],
  class: ["Saved to your class", "Guardado en su clase"],
  saving: ["Saving…", "Guardando…"],
  unsaved: ["Not saved yet", "Aún sin guardar"],
  error: [
    "Could not save on this device. Download your work.",
    "No se pudo guardar en este dispositivo. Descargue su trabajo.",
  ],
  conflict: ["Changed on another device", "Cambiado en otro dispositivo"],
};

/** Mount the editor for one activity into `root`. Returns { destroy }. */
export function mountEditor(root, { activity, S, lang, goTo, onFlush, ai, nav }) {
  const entry = getLocal(activity.id);
  let link = entry?.link?.code ? { ...entry.link } : null;
  const store = createStore(activity);
  let tab = isPlatform(activity.lineage) || isVersion(activity.lineage) ? "quick" : "content";
  const notes = handoff.get(activity.id);
  handoff.delete(activity.id);

  const statusEl = h("span.st-save", { role: "status", "aria-live": "polite" });
  const showStatus = ({ phase, detail }) => {
    const [en, es] = STATUS[phase] || STATUS.unsaved;
    statusEl.textContent =
      S(en, es) +
      (phase === "error" && detail === "unauthorized"
        ? ` ${S("Your class passcode is not accepted.", "Su código de acceso no es aceptado.")}`
        : "");
    statusEl.dataset.phase = phase;
    if (phase === "conflict") showConflict(detail);
  };
  const saver = createSaver({
    store,
    getLink: () => link,
    setLink: (l) => (
      (link = l),
      l && saveLocal(store.get(), { code: l.code, state: l.state, publishedRev: l.publishedRev })
    ),
    onStatus: showStatus,
  });

  const preview = createPreview(store, {
    S,
    lang,
    onSelect: (id) => (switchTab("content"), content.select(id)),
  });
  const content = createContentPanel(store, { S, onOpen: (id) => preview.goto(id) });
  const check = createCheckPanel(store, {
    S,
    onGo: (id) => (switchTab("content"), content.select(id)),
  });
  const sidebar = h("div.st-sidebar");
  const tabBar = h("div.st-tabs.side", { role: "tablist" });
  const panel = h("div.st-side-panel", { role: "tabpanel" });
  const more = h("div.st-more-wrap");

  const quick = createQuickPanel(store, {
    S,
    ai,
    nav: (path) => nav?.(path),
    goTo,
    saver,
    goContent: () => switchTab("content"),
    openAdvanced: () => {
      const d = more.querySelector("details");
      if (!d) return;
      d.open = true;
      d.querySelector("summary")?.focus();
    },
  });
  const customize = button(
    S("Customize", "Personalizar"),
    () => (switchTab("quick"), quick.focus()),
    "ghost",
    { "data-act": "customize" },
  );

  const undo = iconButton(
    "↶",
    S("Undo", "Deshacer"),
    () => store.undo() && say(S("Undone.", "Deshecho.")),
  );
  const redo = iconButton(
    "↷",
    S("Redo", "Rehacer"),
    () => store.redo() && say(S("Redone.", "Rehecho.")),
  );
  const share = button(
    S("Share With Students", "Compartir con los estudiantes"),
    () =>
      openShare({
        store,
        saver,
        S,
        lang,
        link,
        setLink: (l) => (
          (link = l),
          saveLocal(
            store.get(),
            l ? { code: l.code, state: l.state, publishedRev: l.publishedRev } : null,
          )
        ),
        goToBlock: (id) => (switchTab("content"), content.select(id)),
      }),
    "primary",
  );
  const fullPreview = button(
    S("Preview as student", "Ver como estudiante"),
    () => openFull(),
    "ghost",
  );

  function openFull() {
    openDialog(S("Student preview", "Vista del estudiante"), async (body) => {
      const { studentHtml } = await import("./preview.js");
      body.append(
        h("iframe.st-frame.full", {
          title: S("Student view", "Vista del estudiante"),
          sandbox: "allow-scripts allow-modals",
          srcdoc: await studentHtml(store.get(), { lang }),
        }),
      );
    });
  }
  function showConflict(detail) {
    let cur = {};
    try {
      cur = JSON.parse(detail || "{}");
    } catch {}
    openDialog(
      S("This activity changed on another device", "Esta actividad cambió en otro dispositivo"),
      (body, close) => {
        body.append(
          h(
            "p",
            S(
              "Someone (maybe you on another device) saved a newer version to your class.",
              "Alguien (quizás usted en otro dispositivo) guardó una versión más nueva en su clase.",
            ),
          ),
          h(
            "div.st-add-row",
            button(
              S("Keep what I have", "Conservar lo que tengo"),
              () => (
                link
                  ? studioApi({ code: link.code, passcode: link.passcode })
                      .get(store.get().id)
                      .then((r) => r.ok && store.adoptRev(r.rev))
                      .then(() => saver.saveToClass())
                  : null,
                close()
              ),
              "primary",
            ),
            button(S("Load the newer version", "Cargar la versión más nueva"), async () => {
              const r = await studioApi({ code: link.code, passcode: link.passcode }).get(
                store.get().id,
              );
              if (r.ok) {
                store.replace(r.activity, "structure");
                store.adoptRev(r.rev);
              }
              close();
            }),
          ),
          cur.title ? h("p.st-hint", `${cur.title} · v${cur.rev}`) : null,
        );
      },
    );
  }

  function drawSide() {
    clear(tabBar);
    for (const [id, en, es] of TABS)
      tabBar.append(
        h(
          "button.st-tab",
          {
            type: "button",
            role: "tab",
            id: `st-tab-${id}`,
            "aria-selected": String(tab === id),
            "aria-controls": "st-side-panel",
            onclick: () => switchTab(id),
          },
          S(en, es),
        ),
      );
    panel.id = "st-side-panel";
    panel.setAttribute("aria-labelledby", `st-tab-${tab}`);
    clear(panel);
    if (tab === "quick") (quick.render(), panel.append(quick.el));
    else if (tab === "content") (content.render(), panel.append(content.el));
    else if (tab === "check") (panel.append(check.el), check.render());
    else panel.append(tab === "look" ? lookPanel(store, { S }) : supportsPanel(store, { S }));
    clear(more).append(moreOptions(store, { S, notify: say }));
  }
  function switchTab(id) {
    tab = id;
    drawSide();
  }

  const contextBar = () => {
    const c = store.get().context;
    const bits = [
      c.grade && S(`Grade ${c.grade}`, `Grado ${c.grade}`),
      c.subject,
      c.unitNumber ? S(`Unit ${c.unitNumber}`, `Unidad ${c.unitNumber}`) : "",
      c.day,
    ].filter(Boolean);
    return h(
      "p.st-ctx",
      bits.length
        ? bits.join(" · ")
        : S(
            "Add a grade and subject in More options",
            "Agregue un grado y una materia en Más opciones",
          ),
    );
  };

  const top = h("header.st-top");
  function drawTop() {
    clear(top);
    top.append(
      h("a.st-back-link", { href: goTo.mine }, S("← My activities", "← Mis actividades")),
      h("div.st-titlebox", h("strong.st-title", store.get().title), contextBar()),
      statusEl,
      h("div.st-top-actions", undo, redo, customize, fullPreview, share),
    );
    undo.disabled = !store.canUndo();
    redo.disabled = !store.canRedo();
  }

  const stage = h(
    "section.st-stage",
    { "aria-label": S("Live preview", "Vista previa en vivo") },
    preview.el,
  );
  const banners = h("div.st-banners", sourceBanner({ store, S }), notesBanner({ notes, S }));
  const editor = h("div.st-editor", top, banners, h("div.st-main", stage, sidebar));
  sidebar.append(tabBar, panel, more);
  clear(root).append(editor);
  drawTop();
  drawSide();
  preview.refresh();
  showStatus({ phase: entry ? "saved" : "unsaved" });

  store.subscribe((_a, reason) => {
    drawTop();
    preview.later();
    if (reason !== "type") {
      if (tab === "content") content.render();
      else if (tab === "quick") reason !== "rev" && quick.render();
      else if (reason !== "rev") drawSide();
      clear(more).append(moreOptions(store, { S, notify: say }));
    }
  });

  const onKey = (e) => {
    if (
      (e.metaKey || e.ctrlKey) &&
      !e.shiftKey &&
      e.key.toLowerCase() === "z" &&
      !e.target.matches?.("input,textarea")
    )
      (e.preventDefault(), store.undo());
    if (
      (e.metaKey || e.ctrlKey) &&
      (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z")) &&
      !e.target.matches?.("input,textarea")
    )
      (e.preventDefault(), store.redo());
  };
  const onHide = () => saver.flush();
  document.addEventListener("keydown", onKey);
  window.addEventListener("pagehide", onHide);
  window.addEventListener("beforeunload", onHide);
  saver.flush();

  return {
    store,
    saver,
    destroy() {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      saver.flush();
      saver.destroy();
      preview.destroy();
      onFlush?.();
    },
  };
}
