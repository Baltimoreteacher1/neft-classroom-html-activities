// Action bar for a vocabulary collection: the shell's standard bar, with "Copy student link" pointed at the student wall.
import { h } from "../../core/dom.js";
import { copyText, renderActionBar } from "../../core/actions.js";
import { studentUrl } from "./source.js";

export function collectionActions(collection, shell, sub = "wall") {
  const item = { kind: "vocab", id: collection.id, title: collection.title, grade: collection.grade, subject: collection.subject };
  const bar = renderActionBar(item, shell, {});
  // The shared button resolves activities only; a vocabulary student link is the student wall itself.
  const old = [...bar.querySelectorAll("button")].find((b) => /student link/i.test(b.textContent));
  if (old) {
    const fresh = old.cloneNode(true);
    fresh.addEventListener("click", async () => {
      const ok = await copyText(studentUrl(collection.id, sub));
      shell.announce(ok ? "Student link copied. It opens the student view without teacher notes." : "Could not copy. Select the address of the student view and copy it by hand.");
    });
    old.replaceWith(fresh);
  }
  return h("div", { class: "st-v-actions" }, bar);
}
