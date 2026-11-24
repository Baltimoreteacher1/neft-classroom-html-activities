// tpr_cards — newcomer total physical response. Hear the command, do the action, press "I did it".
import { h } from "./_kit.js";
import { iconNode, listenControls, startKind, stepThrough } from "./_audio.js";

export default function mount(root, ctx) {
  const kit = startKind(root, ctx, "tpr_cards");
  return stepThrough(root, ctx, kit, {
    items: ctx.payload.items,
    noun: "action",
    confirmLabel: "I did it",
    praise: () => "Nice! You listened and you did it.",
    detail: (n) => `You listened and did ${n} ${n === 1 ? "action" : "actions"}`,
    render(it) {
      const caption = h("p", { class: "sl-caption sl-caption--command", text: it.command });
      return h(
        "div",
        { class: "sl-card sl-card--newcomer" },
        h("div", { class: "sl-picture", "aria-hidden": "true" }, iconNode(it.icon, "sl-icon sl-icon--huge")),
        h("h3", { class: "sl-term", tabindex: "-1", "data-focus": "", text: "Listen and do it." }),
        listenControls(it.command, caption, { label: "command" }).el,
        caption,
      );
    },
  });
}
