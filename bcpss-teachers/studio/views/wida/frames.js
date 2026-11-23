// Sentence frames panel: one Key Language Use at one support level, all four domains, plus targets and connectors.
// Frames, targets and connectors come from core/wida-frames.js; nothing is authored here.
import { copyText } from "../../core/actions.js";
import { h } from "../../core/dom.js";
import { KLU_PURPOSE, connectorsFor, framesFor, targetsFor } from "../../core/wida-frames.js";
import { DOMAINS, KLUS, TIERS } from "../../data/taxonomy.js";

const tierInfo = (id) => TIERS.find((t) => t.id === id) || TIERS[1];

function copyButton(label, text, shell) {
  const b = h(
    "button",
    { class: "st-btn st-btn-quiet st-wida-copy", type: "button", "aria-label": label },
    "Copy",
  );
  b.addEventListener("click", async () => {
    shell.announce(
      (await copyText(text)) ? "Copied." : "Could not copy. Select the text and copy it by hand.",
    );
  });
  return b;
}

/** framesPanel({ klu, tier, shell, onChange? }) -> section. Without onChange the Key Language Use is fixed (no picker). */
export function framesPanel({ klu, tier, shell, onChange }) {
  const t = tierInfo(tier);
  const sec = h("section", { class: "st-wida-frames", "aria-labelledby": "st-wida-frames-h" });
  const pick = h("div", { class: "st-field st-wida-klu" });
  const sel = h(
    "select",
    { id: "st-wida-klu", name: "klu" },
    KLUS.map((k) => h("option", { value: k, selected: k === klu }, k)),
  );
  sel.addEventListener("change", () => onChange?.(sel.value));
  pick.append(h("label", { for: "st-wida-klu" }, "Key Language Use"), sel);
  if (!onChange) pick.hidden = true;

  const cols = DOMAINS.map((d) => {
    const lines = framesFor(klu, d, t.id);
    return h(
      "article",
      { class: "st-card st-wida-frame-card", "data-domain": d },
      h("h3", {}, d),
      h(
        "ul",
        { class: "st-wida-frame-list" },
        lines.map((l) => h("li", {}, l)),
      ),
      copyButton(`Copy ${d} frames`, lines.join("\n"), shell),
    );
  });
  const targets = targetsFor(klu, t.id);
  const connectors = connectorsFor(t.id);
  sec.append(
    h("h2", { id: "st-wida-frames-h" }, "Sentence frames"),
    h(
      "p",
      { class: "st-hint" },
      `Showing ${t.short} supports (${t.levels}). The task stays the same at every level; frames change how students reach it. To ${KLU_PURPOSE[klu]}.`,
    ),
    pick,
    h("div", { class: "st-wida-frame-grid" }, cols),
    h(
      "div",
      { class: "st-wida-frame-extra" },
      h(
        "div",
        {},
        h("h3", {}, "Language targets"),
        h(
          "ul",
          {},
          targets.map((x) => h("li", {}, x)),
        ),
      ),
      h(
        "div",
        {},
        h("h3", {}, "Connecting words"),
        h(
          "p",
          { class: "st-wida-connectors" },
          connectors.map((c) => h("span", { class: "st-chip st-chip-plain" }, c)),
        ),
      ),
    ),
  );
  return sec;
}
