// Review a suggested edit before anything changes. Every changed block is listed with what it said and what it would
// say, as a plain-text difference (struck-through and underlined, never color alone). Nothing is applied until the
// teacher presses "Apply selected"; Cancel leaves the activity exactly as it was.

import { applyChosen, diffWords, proposalChanges } from "./customize-logic.js";
import { button, domId, h, openDialog, say } from "./ui.js";

const KIND = {
  changed: ["Changed", "Cambiado"],
  added: ["New", "Nuevo"],
  removed: ["Removed", "Quitado"],
  title: ["Title", "Título"],
  description: ["Description", "Descripción"],
};

function diffLine(before, after, S) {
  const kids = diffWords(before, after).map((seg) =>
    seg.op === "del"
      ? h("del", h("span.st-sr", S("[removed: ", "[quitado: ")), seg.text, h("span.st-sr", "]"))
      : seg.op === "add"
        ? h("ins", h("span.st-sr", S("[added: ", "[añadido: ")), seg.text, h("span.st-sr", "]"))
        : seg.text,
  );
  return h("p.st-diff", kids);
}

function entryCard(entry, S, chosen, update) {
  const id = domId("pc");
  const box = h("input", {
    type: "checkbox",
    id,
    checked: true,
    onchange: (e) => (e.target.checked ? chosen.add(entry.id) : chosen.delete(entry.id), update()),
  });
  return h(
    "li.st-change",
    h(
      "div.st-change-head",
      box,
      h(
        "label",
        { for: id },
        h("span.st-pill", S(...KIND[entry.kind])),
        " ",
        h("strong", entry.kind === "title" || entry.kind === "description" ? "" : entry.title),
      ),
    ),
    entry.keyChanged
      ? h(
          "p.st-warn",
          S(
            "This changes an answer key. Check it before you apply.",
            "Esto cambia una clave de respuestas. Revísela antes de aplicar.",
          ),
        )
      : null,
    entry.fields.slice(0, 8).map((f) => diffLine(f.before, f.after, S)),
    entry.fields.length > 8
      ? h(
          "p.st-hint",
          S(
            `${entry.fields.length - 8} more small changes`,
            `${entry.fields.length - 8} cambios pequeños más`,
          ),
        )
      : null,
  );
}

/**
 * @param {{ S, base: object, proposed: object, onApply: (activity: object, count: number) => void }} opts
 * Returns { close } or null when the suggestion changes nothing.
 */
export function openProposal({ S, base, proposed, onApply }) {
  const entries = proposalChanges(base, proposed);
  if (!entries.length) {
    say(S("The suggestion changes nothing.", "La sugerencia no cambia nada."));
    return null;
  }
  const chosen = new Set(entries.map((e) => e.id));
  return openDialog(
    S("Review suggested changes", "Revisar los cambios sugeridos"),
    (body, close) => {
      const count = h("p.st-status", { role: "status", "aria-live": "polite" });
      const apply = button(
        S("Apply selected", "Aplicar lo seleccionado"),
        () => {
          if (!chosen.size) return;
          onApply(applyChosen(base, proposed, chosen), chosen.size);
          close();
        },
        "primary",
      );
      const update = () => {
        apply.disabled = chosen.size === 0;
        count.textContent = S(
          `${chosen.size} of ${entries.length} selected`,
          `${chosen.size} de ${entries.length} seleccionados`,
        );
      };
      body.append(
        h(
          "p",
          S(
            "Nothing has changed yet. Untick anything you do not want, then apply. You can undo afterwards.",
            "Todavía no ha cambiado nada. Desmarque lo que no quiera y luego aplique. Puede deshacer después.",
          ),
        ),
        h(
          "ul.st-changes",
          entries.map((e) => entryCard(e, S, chosen, update)),
        ),
        count,
        h("div.st-add-row", apply, button(S("Cancel", "Cancelar"), close)),
      );
      update();
    },
  );
}
