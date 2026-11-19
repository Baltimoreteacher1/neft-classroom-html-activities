// The approval block of "Share with families": approve, then the link, copy, share, print and a family-eye view.
// A link is shown only for a story that equals the one the teacher approved.
import { el } from "../../access-practice-lab/src/class/dom.js";
import { encodeStory, storyUrl } from "../../access-practice-lab/src/family/story/link.js";

/** @param {{story:object, saved:{approved:string}, count:number, origin:string}} state */
export function resultNodes(c, { story, saved, count, origin }) {
  const same = Boolean(saved.approved) && saved.approved === encodeStory(story);
  const url = storyUrl(story, { origin });
  const printAll = el(
    "div",
    { class: "fsh-batch" },
    count
      ? el("button", { type: "button", class: "btn", "data-fsh": "print-all" }, c.printAll(count))
      : el("p", { class: "fine" }, c.printNone),
  );
  const contract = el("p", { class: "fine" }, c.contract);
  if (!same)
    return [
      saved.approved ? el("p", { class: "ti-note", role: "status" }, c.changed) : "",
      el(
        "div",
        { class: "fsh-actions" },
        el("button", { type: "button", class: "btn btn-primary", "data-fsh": "approve" }, c.approve),
        el("button", { type: "button", class: "btn", "data-fsh": "approve-next" }, c.approveNext),
      ),
      contract,
      printAll,
    ];
  return [
    el("p", { class: "ti-note", role: "status" }, c.approved),
    el(
      "div",
      { class: "fsh-field" },
      el("label", { for: "fshLink" }, c.linkLabel),
      el("input", { id: "fshLink", type: "text", readonly: true, value: url, dir: "ltr", onfocus: (e) => e.target.select() }),
    ),
    el(
      "div",
      { class: "fsh-actions" },
      el("button", { type: "button", class: "btn btn-primary", "data-fsh": "copy" }, c.copyLink),
      typeof navigator !== "undefined" && navigator.share ? el("button", { type: "button", class: "btn", "data-fsh": "share" }, c.share) : "",
      el("button", { type: "button", class: "btn", "data-fsh": "print" }, c.print),
      el("a", { class: "btn", href: url, target: "_blank", rel: "noopener" }, c.open),
    ),
    el("p", { class: "fine" }, c.qrNote),
    contract,
    printAll,
  ];
}
