// The component browser: a short list of components that fit THIS activity first, a "See all" disclosure for the rest
// (including what the engine cannot do, with the reason), a real preview of each (the student player in a sandboxed
// frame, built only when the item is opened) and one action: "Add to my activity". Adding goes through store.apply, so
// Undo removes it. Everything is a native button, checkbox or <details>, so the keyboard does it all.
//
//   createComponentBrowser(store, { S, onInserted, after }) -> { el, render, destroy }
//   S(en, es)  the editor's language picker; onInserted({ component, added }) after an add; after() -> block id to insert after

import { CATEGORY_LABEL, COMPONENTS, applyToDraft, fits, recommend } from "../x/components.js";
import { questionsOf } from "../core/schema.js";
import { button, clear, h, openDialog, say } from "./ui.js";
import { studentHtml } from "./preview.js";

const STYLE = `
.cb{display:grid;gap:.75rem}
.cb-list{list-style:none;margin:0;padding:0;display:grid;gap:.75rem}
.cb-item{border:1.5px solid var(--line);border-radius:var(--radius);background:var(--surface);padding:.75rem 1rem;display:grid;gap:.5rem}
.cb-item h4,.cb-item h3{margin:0;font-size:1rem}
.cb-why{margin:0;color:var(--ink-2);font-size:.9rem}
.cb-actions{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}
.cb-detail{border-top:1px solid var(--line);padding-top:.5rem}
.cb-detail>summary{cursor:pointer;min-height:var(--target);display:flex;align-items:center;font-weight:600}
.cb-detail dl{margin:.5rem 0;display:grid;gap:.25rem}
.cb-detail dt{font-weight:700}
.cb-detail dd{margin:0 0 .35rem}
.cb-frame{width:100%;height:320px;border:1.5px solid var(--line);border-radius:var(--radius);background:#fff}
.cb-status{margin:0;font-weight:600}
.cb-group h4{margin:1rem 0 .5rem}
.cb-off{color:var(--ink-2)}
.cb-cfg{display:grid;gap:.5rem;margin:.25rem 0}
@media (max-width:480px){.cb-frame{height:260px}.cb-actions .btn{flex:1 1 100%}}
`;

/** One <style> for the component browser and the mission builder (both use these classes). */
export function ensureBrowserStyles() {
  if (document.getElementById("cb-style")) return;
  const el = document.createElement("style");
  el.id = "cb-style";
  el.textContent = STYLE;
  document.head.append(el);
}

const langOf = (S) => (S("en", "es") === "es" ? "es" : "en");

export function createComponentBrowser(store, { S, onInserted, after } = {}) {
  ensureBrowserStyles();
  const lang = langOf(S);
  const el = h("section.cb", {
    "aria-label": S("Components you can add", "Componentes que puede agregar"),
  });
  const status = h("p.cb-status", { role: "status", "aria-live": "polite", tabindex: "-1" });
  const frames = new Map();
  let focusId = "";
  let off = null;
  let paintTimer = 0;

  const text = (t) => S(t.en, t.es);

  function configControls(c, cfg, scope) {
    if (!c.configurable.length) return null;
    return h(
      "div.cb-cfg",
      c.configurable.map((opt) => {
        const id = `cb-${scope}-${c.id}-${opt.key}`;
        if (opt.type === "boolean") {
          // what the checkbox shows is exactly what is used: a content-only add of a component is the default
          // once the activity already has questions; a blank activity gets its companion question
          cfg[opt.key] = c.defaults[opt.key] ?? questionsOf(store.get()).length === 0;
          const box = h("input", { type: "checkbox", id, onchange: (e) => (cfg[opt.key] = e.target.checked) });
          box.checked = cfg[opt.key];
          return h("div.st-toggle", box, h("label", { for: id }, text(opt.label)));
        }
        cfg[opt.key] = c.defaults[opt.key] ?? opt.options[0].value;
        return h(
          "div.st-field",
          h("label", { for: id }, text(opt.label)),
          h(
            "select.st-input",
            { id, onchange: (e) => (cfg[opt.key] = e.target.value) },
            opt.options.map((o) => h("option", { value: o.value, selected: cfg[opt.key] === o.value }, text(o.label))),
          ),
        );
      }),
    );
  }

  async function mountPreview(c, host) {
    host.replaceChildren(h("p.st-hint", S("Loading preview…", "Cargando vista previa…")));
    try {
      if (!frames.has(c.id))
        frames.set(c.id, await studentHtml(c.preview, { lang, preview: true }));
      host.replaceChildren(
        h("iframe.cb-frame", {
          title: S(`Preview: ${c.label.en}`, `Vista previa: ${c.label.es}`),
          sandbox: "allow-scripts allow-modals",
          referrerpolicy: "no-referrer",
          srcdoc: frames.get(c.id),
        }),
      );
    } catch (error) {
      console.error("[studio] component preview failed", error);
      host.replaceChildren(
        h(
          "p.st-hint",
          S(
            "The preview could not load. You can still add it.",
            "No se pudo cargar la vista previa. Aun así puede agregarlo.",
          ),
        ),
      );
    }
  }

  function detail(c) {
    const host = h("div");
    const d = h(
      "details.cb-detail",
      h("summary", S("Preview and details", "Vista previa y detalles")),
      host,
      h(
        "dl",
        h("dt", S("Accessibility", "Accesibilidad")),
        h("dd", text(c.accessibility)),
        h("dt", S("On paper", "En papel")),
        h("dd", text(c.printable.note)),
        h("dt", S("Works in", "Funciona en")),
        h("dd", c.compatibility.kinds.join(", ")),
      ),
    );
    d.addEventListener("toggle", () => d.open && !host.firstChild && mountPreview(c, host));
    return d;
  }

  function add(c, cfg) {
    let added = [];
    const changed = store.apply(
      (draft) => {
        added = applyToDraft(draft, c.id, { lang, ...cfg }, { after: after?.() || "" }).added;
      },
      { reason: "structure" },
    );
    if (!changed) return say(S("Nothing needed adding.", "No hacía falta agregar nada."));
    focusId = c.id;
    const msg = S(
      `Added "${c.label.en}". Use Undo to take it back.`,
      `Se agregó "${c.label.es}". Use Deshacer para quitarlo.`,
    );
    status.textContent = msg;
    say(msg);
    onInserted?.({ component: c, added });
    paint();
  }

  function item(c, reason, level = "h4", scope = "r") {
    const cfg = {};
    const fit = fits(c, store.get());
    const why = reason ? h("p.cb-why", text(reason)) : null;
    const addBtn = c.change
      ? S("Use this game style", "Usar este estilo de juego")
      : S("Add to my activity", "Agregar a mi actividad");
    const row = h(
      "div.cb-actions",
      button(addBtn, () => add(c, cfg), "primary", {
        "data-add": c.id,
        disabled: !fit.ok,
        "aria-label": `${addBtn}: ${c.label[lang]}`,
      }),
    );
    return h(
      "li.cb-item",
      h(level, c.label[lang]),
      h("p.cb-why", c.purpose[lang]),
      why,
      fit.ok ? null : h("p.st-hint", { "data-why-not": c.id }, text(fit.reason)),
      configControls(c, cfg, scope),
      row,
      detail(c),
    );
  }

  function unavailableItem(c) {
    return h(
      "li.cb-item.cb-off",
      h("h4", c.label[lang]),
      h("p.cb-why", c.purpose[lang]),
      h(
        "p.st-hint",
        { "data-unavailable": c.id },
        `${S("Not available: ", "No disponible: ")}${c.reason[lang]}`,
      ),
    );
  }

  function allList() {
    const by = new Map();
    for (const c of COMPONENTS) {
      if (!by.has(c.category)) by.set(c.category, []);
      by.get(c.category).push(c);
    }
    const on = h("div");
    const off = [];
    for (const [cat, list] of by) {
      const ready = list.filter((c) => c.available);
      for (const c of list.filter((x) => !x.available)) off.push(c);
      if (!ready.length) continue;
      on.append(
        h(
          "section.cb-group",
          h("h4", text(CATEGORY_LABEL[cat] || { en: cat, es: cat })),
          h(
            "ul.cb-list",
            ready.map((c) => item(c, null, "h5", "a")),
          ),
        ),
      );
    }
    if (off.length)
      on.append(
        h(
          "section.cb-group",
          h("h4", S("Not available, and why", "No disponible, y por qué")),
          h("ul.cb-list", off.map(unavailableItem)),
        ),
      );
    return on;
  }

  function paint() {
    const activity = store.get();
    const picks = recommend(activity, { lang });
    const open = el.querySelector("details.cb-all")?.open ?? false;
    const active = document.activeElement;
    const keep = el.contains(active) ? active.dataset?.add || "" : "";
    const inStatus = el.contains(active) && active === status;
    clear(el);
    el.append(
      h("h3", S("Add something", "Agregar algo")),
      h(
        "p.st-hint",
        S(
          "A few components that fit what you have so far.",
          "Algunos componentes que encajan con lo que ya tiene.",
        ),
      ),
      status,
      h(
        "ul.cb-list",
        { "aria-label": S("Recommended components", "Componentes recomendados") },
        picks.map((r) => item(r.component, r.reason)),
      ),
    );
    const all = h(
      "details.st-more.cb-all",
      h(
        "summary",
        S(
          `See all ${COMPONENTS.filter((c) => c.available).length} components`,
          `Ver los ${COMPONENTS.filter((c) => c.available).length} componentes`,
        ),
      ),
      h("div.st-more-body", allList()),
    );
    all.open = open;
    el.append(
      all,
      h(
        "div.cb-actions",
        button(S("Build a mission…", "Crear una misión…"), openMissions, "ghost", {
          "data-act": "missions",
        }),
      ),
    );
    // a repaint (after an add, an Undo, or any edit) never throws keyboard focus away
    const want = focusId || keep || (inStatus ? "status" : "");
    focusId = "";
    if (want) {
      // the same component can also sit in the closed "See all" list: only a visible button can take focus
      const target =
        [...el.querySelectorAll(`[data-add="${want}"]:not([disabled])`)].find(
          (b) => !b.closest("details:not([open])"),
        ) || status;
      target.focus({ preventScroll: true });
    }
  }

  async function openMissions() {
    const { createMissionBuilder } = await import("./mission-builder.js");
    openDialog(S("Build a mission", "Crear una misión"), (body, close) => {
      const builder = createMissionBuilder({
        S,
        store,
        onBuilt: (a) => {
          close();
          onInserted?.({ mission: a, added: [] });
        },
      });
      body.append(builder.el);
      builder.render();
    });
  }

  off = store.subscribe(() => {
    if (!el.isConnected) return;
    clearTimeout(paintTimer);
    paintTimer = setTimeout(paint, 60);
  });

  return {
    el,
    render: paint,
    destroy() {
      off?.();
      clearTimeout(paintTimer);
    },
  };
}
