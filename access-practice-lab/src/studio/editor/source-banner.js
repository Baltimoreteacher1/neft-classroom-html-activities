// "Customized from <title>": one calm line above the editor with the two things a teacher may want next, viewing the
// original and restoring it. Also the one-time note about what could not be carried over from the platform original.
// Nothing here edits the platform original; Restore re-reads it and replaces the draft's content (undoable).

import { isPlatform, isVersion } from "./customize-logic.js";
import { button, h, openDialog, say } from "./ui.js";

/** Same-site JSON, the only network access the adapters get. */
export const fetchJson = (url) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

/** Notes waiting to be shown once for a draft that was just made (id -> [{ en, es }]). In memory only. */
export const handoff = new Map();

export const TIER_LABEL = {
  emerging: { en: "Emerging", es: "Emergente" },
  developing: { en: "Developing", es: "En desarrollo" },
  expanding: { en: "Expanding", es: "En expansión" },
  extension: { en: "Extension", es: "Ampliación" },
};
export const TIER_HELP = {
  emerging: ["Most language support", "Más apoyo de lenguaje"],
  developing: ["Some language support", "Algo de apoyo de lenguaje"],
  expanding: ["Light language support", "Poco apoyo de lenguaje"],
  extension: ["More challenge", "Más desafío"],
};

/** Re-read the platform original and replace the draft's content after the teacher confirms. */
export async function restoreOriginal({ store, S, deps = { fetchJson } }) {
  const lin = store.get().lineage;
  if (!isPlatform(lin)) return false;
  let fresh;
  try {
    const { customizeFrom } = await import("../adapters/registry.js");
    fresh = await customizeFrom(lin.family, lin.ref, deps);
  } catch {
    fresh = null;
  }
  if (!fresh?.activity) {
    say(
      S(
        "The original could not be loaded right now. Your draft is unchanged.",
        "No se pudo cargar el original en este momento. Su borrador no cambió.",
      ),
    );
    return false;
  }
  const changed = Boolean(lin.sourceHash) && lin.sourceHash !== fresh.activity.lineage?.sourceHash;
  return new Promise((resolve) => {
    let decided = false;
    const done = (v) => {
      decided = true;
      resolve(v);
    };
    openDialog(
      S("Restore the original?", "¿Restaurar el original?"),
      (body, close) => {
        body.append(
          h(
            "p",
            S(
              "Your changes to this draft will be replaced by the original activity. You can undo this right after.",
              "Sus cambios en este borrador se reemplazarán por la actividad original. Puede deshacerlo enseguida.",
            ),
          ),
          changed
            ? h(
                "p.st-hint",
                S(
                  "The original has been updated since you copied it. You will get the newest version.",
                  "El original se actualizó desde que usted lo copió. Obtendrá la versión más nueva.",
                ),
              )
            : null,
          h(
            "div.st-add-row",
            button(
              S("Restore original", "Restaurar el original"),
              () => {
                store.replace(fresh.activity, "structure");
                say(S("Original restored. You can undo.", "Original restaurado. Puede deshacer."));
                done(true);
                close();
              },
              "primary",
            ),
            button(S("Keep my draft", "Conservar mi borrador"), () => (done(false), close())),
          ),
        );
      },
      { onClose: () => !decided && resolve(false) },
    );
  });
}

/** The source line. Returns null for an activity made from scratch. */
export function sourceBanner({ store, S }) {
  const el = h("div.st-source", { role: "group" });
  const draw = () => {
    el.replaceChildren();
    const lin = store.get().lineage;
    const show = isPlatform(lin) || isVersion(lin);
    el.hidden = !show;
    if (!show) return;
    const title = lin.title || lin.ref;
    const tier = isVersion(lin) ? TIER_LABEL[lin.tier] : null;
    el.append(
      h(
        "p.st-source-line",
        tier
          ? S(`${tier.en} version of `, `Versión ${tier.es} de `)
          : S("Customized from ", "Personalizada a partir de "),
        h("strong", title),
      ),
    );
    const actions = h("div.st-source-actions");
    if (isPlatform(lin) && lin.url)
      actions.append(
        h(
          "a.st-source-link",
          { href: lin.url, target: "_blank", rel: "noopener noreferrer" },
          S("View original", "Ver el original"),
          h("span.st-sr", S(" (opens in a new tab)", " (se abre en una pestaña nueva)")),
        ),
      );
    if (isPlatform(lin) && !lin.variantOf)
      actions.append(
        button(
          S("Restore original", "Restaurar el original"),
          () => restoreOriginal({ store, S }),
          "link",
          { "data-act": "restore-original" },
        ),
      );
    el.append(actions);
  };
  draw();
  store.subscribe((_a, reason) => reason !== "type" && reason !== "rev" && draw());
  return el;
}

/** What could not be carried over, in plain language, shown once and dismissible. null when there is nothing to say. */
export function notesBanner({ notes, S }) {
  const list = (notes || []).filter((n) => n && (n.en || n.es));
  if (!list.length) return null;
  const el = h(
    "section.st-notes",
    { "aria-labelledby": "st-notes-title" },
    h("h2#st-notes-title", S("What we could not bring over", "Lo que no pudimos traer")),
    h(
      "ul",
      list.map((n) => h("li", S(n.en || n.es, n.es || n.en))),
    ),
    button(
      S("Got it", "Entendido"),
      () => {
        el.remove();
        say(S("Dismissed.", "Cerrado."));
      },
      "small",
    ),
  );
  return el;
}
