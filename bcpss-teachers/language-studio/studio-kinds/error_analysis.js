// error_analysis — read a sentence with a mistake and pick the best fix. The error type is named after answering.
import { h } from "./_kit.js";
import { mountChoice } from "./quiz.js";

export default function mount(root, ctx) {
  return mountChoice(root, ctx, {
    kind: "error_analysis",
    items: ctx.payload.items,
    noun: "sentence",
    prompt: (it) =>
      h(
        "div",
        { class: "sg-wrong" },
        h("p", { class: "sg-label", text: "A student wrote:" }),
        h("blockquote", { class: "sg-wrong__text", text: it.wrong }),
        h("p", { class: "sg-q__ask", text: "Which choice fixes it best?" }),
      ),
    after: (it) =>
      it.type
        ? h(
            "p",
            { class: "sg-errtype" },
            h("span", { class: "sg-errtype__tag", text: "Mistake type" }),
            it.type,
          )
        : null,
  });
}
