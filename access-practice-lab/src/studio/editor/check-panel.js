// "Check my work": the creation quality inspector inside the editor. One list of what to fix, check or know before
// sharing, each with a plain "how", a jump to the block, and a one-click fix only where the repair is safe and
// deterministic. Nothing here rewrites instructional wording; findings without a repair stay with the teacher.

import { button, clear, h, say } from "./ui.js";

const GROUPS = [
  ["fix", "Fix before sharing", "Corregir antes de compartir"],
  ["check", "Worth a second look", "Conviene revisar"],
  ["note", "Good to know", "Bueno saber"],
];

/** The tab body. `onGo(blockId)` selects a block in the Content tab. Returns { el, render }. */
export function createCheckPanel(store, { S, onGo }) {
  const el = h("div.st-panel-body.st-check");
  let inspector = null;
  let token = 0;

  async function render() {
    const mine = ++token;
    inspector ||= await import("../x/inspect.js");
    if (mine !== token) return;
    const activity = store.get();
    const { findings } = inspector.inspectResource(activity);
    clear(el);
    const fixes = findings.filter((f) => f.severity === "fix").length;
    el.append(
      h(
        "p.st-check-summary",
        { role: "status", "aria-live": "polite" },
        fixes
          ? S(
              `${fixes} ${fixes === 1 ? "thing needs" : "things need"} fixing before you share this.`,
              `${fixes} ${fixes === 1 ? "cosa necesita" : "cosas necesitan"} corrección antes de compartir.`,
            )
          : findings.length
            ? S(
                "Nothing blocks sharing. A few things are worth a look.",
                "Nada impide compartir. Conviene revisar algunas cosas.",
              )
            : S("Everything we can check looks good.", "Todo lo que podemos revisar se ve bien."),
      ),
    );
    for (const [severity, en, es] of GROUPS) {
      const rows = findings.filter((f) => f.severity === severity);
      if (!rows.length) continue;
      el.append(
        h(
          "section.st-check-group",
          { "data-severity": severity },
          h("h3", S(en, es)),
          h(
            "ul",
            rows.map((f) => row(f, activity)),
          ),
        ),
      );
    }
  }

  function row(f, activity) {
    const blockId = f.where?.blockId;
    const exists = blockId && activity.blocks.some((b) => b.id === blockId);
    return h(
      "li.st-check-item",
      h("strong", S(f.message.en, f.message.es)),
      h("span.st-hint", S(f.how.en, f.how.es)),
      h(
        "div.st-add-row",
        exists ? button(S("Go to it", "Ir allí"), () => onGo?.(blockId), "ghost") : null,
        f.repair ? button(S("Fix it for me", "Corregir por mí"), () => repair(f), "primary") : null,
      ),
    );
  }

  function repair(f) {
    const done = inspector.applyRepair(store.get(), f.repair, f.where);
    if (!done.applied) return say(S("Nothing needed changing.", "No había nada que cambiar."));
    store.replace(done.activity, "structure");
    say(S("Fixed. You can undo this.", "Corregido. Puede deshacerlo."));
  }

  return { el, render };
}
