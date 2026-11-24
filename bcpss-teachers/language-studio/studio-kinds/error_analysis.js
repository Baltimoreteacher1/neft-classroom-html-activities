// error_analysis — read a sentence with a mistake and pick the best fix. The error type is named after answering.
import { h } from "./_kit.js";
import { mountChoice } from "./quiz.js";

export default function mount(root, ctx) {
  return mountChoice(root, ctx, {
    kind: "error_analysis",
    items: ctx.payload.items,
    noun: "sentence",
    hintSteps: (it) => [
      `Read what the student wrote out loud: “${it.wrong}” Does any part sound wrong?`,
      `There are ${it.options.length} choices. The best fix changes only the mistake and keeps the student's idea.`,
      "Say each choice out loud in place of the student's sentence. Cross out any that is still wrong or says something new.",
    ],
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
