// Live preview: the real student page, rendered from the current activity in a sandboxed frame (scripts allowed,
// no access to this site's storage or cookies). Computer, tablet and phone widths, plus the printable page.
// The frame talks back only with postMessage: a click on a question selects its card for editing.

import { BASE } from "../../util.js";
import { button, clear, debounce, h } from "./ui.js";

const WIDTHS = { computer: "100%", tablet: "768px", phone: "375px", print: "816px" };
let bundle = null;

/** The player bundle and stylesheet, fetched once and reused for every refresh. */
export async function loadBundle(fetchImpl = fetch) {
  bundle ||= Promise.all([
    fetchImpl(`${BASE}/player/studio-player.js`).then((r) => r.text()),
    fetchImpl(`${BASE}/player/studio-player.css`).then((r) => r.text()),
  ]).then(([js, css]) => ({ js, css }));
  return bundle;
}

export async function studentHtml(activity, { lang = "en", preview = false, scorm = false } = {}) {
  const [{ exportActivityHtml }, parts] = await Promise.all([
    import("../export/html.js"),
    loadBundle(),
  ]);
  return exportActivityHtml(activity, { ...parts, lang, preview, scorm });
}

export async function printHtml(activity, { lang = "en", part = "student" } = {}) {
  const { renderWorksheetParts } = await import("../print/worksheet.js");
  return renderWorksheetParts(activity, { part, lang });
}

export function createPreview(store, { S, lang, onSelect, mode: initial = "computer" }) {
  let mode = initial;
  let selected = "";
  let transformations = [];
  const frame = h("iframe.st-frame", {
    title: S("Student view of your activity", "Vista del estudiante de su actividad"),
    sandbox: "allow-scripts allow-modals",
    referrerpolicy: "no-referrer",
  });
  const note = h("div.st-preview-note", { role: "status" });
  const tabs = h("div.st-modes", {
    role: "tablist",
    "aria-label": S("Preview size", "Tamaño de la vista previa"),
  });
  const stage = h("div.st-stage-frame", frame);
  const el = h("div.st-preview", tabs, note, stage);

  const label = {
    computer: S("Computer", "Computadora"),
    tablet: "Tablet",
    phone: S("Phone", "Teléfono"),
    print: S("Printed page", "Página impresa"),
  };
  const drawTabs = () => {
    clear(tabs);
    for (const m of Object.keys(WIDTHS)) {
      if (m === "print" && store.get().kind !== "worksheet") continue;
      tabs.append(
        h(
          "button.st-mode",
          {
            type: "button",
            role: "tab",
            "aria-selected": String(m === mode),
            onclick: () => setMode(m),
          },
          label[m],
        ),
      );
    }
  };

  async function refresh() {
    const a = store.get();
    if (mode === "print" && a.kind !== "worksheet") mode = "computer";
    drawTabs();
    stage.style.setProperty("--w", WIDTHS[mode]);
    stage.dataset.mode = mode;
    note.textContent = "";
    try {
      if (mode === "print") {
        const res = await printHtml(a, { lang });
        frame.srcdoc = res.html;
        transformations = res.transformations || [];
      } else {
        frame.srcdoc = await studentHtml(a, { lang, preview: true });
        transformations = [];
      }
    } catch (err) {
      console.error("[studio] preview failed", err);
      note.textContent = S(
        "The preview could not load. Your work is safe. Try Reload.",
        "No se pudo cargar la vista previa. Su trabajo está a salvo. Pruebe Recargar.",
      );
      note.append(" ", button(S("Reload", "Recargar"), refresh, "small"));
    }
  }
  const later = debounce(refresh, 450);

  function setMode(m) {
    mode = m;
    refresh();
  }
  const onMessage = (e) => {
    if (e.source !== frame.contentWindow || !e.data || typeof e.data !== "object") return;
    if (e.data.studio === "select" && typeof e.data.id === "string") {
      selected = e.data.id;
      onSelect?.(selected);
    } else if (e.data.studio === "ready" && selected)
      frame.contentWindow.postMessage({ studio: "goto", id: selected }, "*");
  };
  window.addEventListener("message", onMessage);

  return {
    el,
    refresh,
    later,
    setMode,
    mode: () => mode,
    transformations: () => transformations,
    goto(id) {
      selected = id;
      frame.contentWindow?.postMessage({ studio: "goto", id }, "*");
    },
    destroy() {
      later.cancel();
      window.removeEventListener("message", onMessage);
    },
  };
}
