// Print one clean sheet: the markup goes into a body-level host and the print stylesheet (boards.css) hides every
// other body child while it prints, the same pattern as the Lesson Builder and Launch Studio sheets.
import { toHtml } from "./util.js";

export function printSheet(markup) {
  let host = document.getElementById("sheetPrint");
  if (!host) {
    host = Object.assign(document.createElement("div"), { id: "sheetPrint" });
    document.body.append(host);
  }
  host.innerHTML = toHtml(markup);
  document.body.dataset.printing = "sheet";
  const done = () => {
    delete document.body.dataset.printing;
    host.replaceChildren();
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}
