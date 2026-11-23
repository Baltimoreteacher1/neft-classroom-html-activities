// Export buttons: print, Word, copy as text. Each runs the export audit first and reports the result in a live region.
import { copyText } from "../../core/actions.js";
import { announce, h } from "../../core/dom.js";
import { icon } from "../../core/ui.js";
import { auditDoc, downloadWord, printDoc, textCopy } from "../../print/export.js";

const COPIES = [
  { v: "student", label: "student copy", short: "Student" },
  { v: "teacher", label: "teacher copy with answer key and notes", short: "Teacher" },
];

/**
 * ctx: { getDoc() -> working document | null, getVisuals() -> { renderVisual }, onDone(kind, doc) }.
 * Returns { el, setReady(bool) }.
 */
export function exportBar({ getDoc, getVisuals, onDone }) {
  const el = h("section", { class: "st-cr-export", "aria-labelledby": "st-cr-ex-h" });
  const status = h("p", { class: "st-hint", role: "status" });
  const buttons = [];

  const run = (label, fn) => async () => {
    const doc = getDoc();
    if (!doc) return;
    status.textContent = `Preparing the ${label}...`;
    try {
      const msg = await fn(doc);
      status.textContent = msg;
      announce(msg);
    } catch (err) {
      const msg = `Could not make the ${label}. ${err?.message || "Try again."}`;
      status.textContent = msg;
      announce(msg);
    }
  };
  const btn = (text, ic, handler, primary = false) => {
    const b = h(
      "button",
      { class: `st-btn${primary ? " st-btn-primary" : ""}`, type: "button", disabled: true },
      icon(ic, 18),
      text,
    );
    b.addEventListener("click", handler);
    buttons.push(b);
    return b;
  };

  const rows = COPIES.map((c) =>
    h(
      "div",
      { class: "st-cr-export-row", role: "group", "aria-label": `Export the ${c.label}` },
      h(
        "span",
        { class: "st-cr-export-label" },
        c.short,
        h("small", {}, c.v === "teacher" ? " answer key and notes" : " no answers"),
      ),
      btn(
        "Print",
        "print",
        run(`${c.label} for printing`, async (doc) => {
          const { renderVisual } = await getVisuals();
          await printDoc(doc, { audience: c.v, renderVisual });
          onDone("print", doc);
          return `The ${c.label} was sent to the print dialog.`;
        }),
        c.v === "student",
      ),
      btn(
        "Word (.docx)",
        "arrow",
        run(`${c.label} Word file`, async (doc) => {
          const name = await downloadWord(doc, { audience: c.v });
          onDone("word", doc);
          return `Downloaded ${name}. Open it in Word, Pages or Google Docs.`;
        }),
      ),
    ),
  );
  const copy = btn(
    "Copy student text",
    "link",
    run("text copy", async (doc) => {
      const ok = await copyText(textCopy(doc, "student"));
      return ok
        ? "Student text copied. Paste it into a document, email or learning system."
        : "Could not copy. Use the Word download instead.";
    }),
  );

  el.append(
    h("h2", { id: "st-cr-ex-h" }, "Print or download"),
    h(
      "p",
      { class: "st-hint" },
      "Every copy says that teacher review is recommended before classroom use.",
    ),
    ...rows,
    h("div", { class: "st-cr-export-row" }, copy),
    status,
  );

  return {
    el,
    setReady(doc, audience = "student") {
      const ok = Boolean(doc);
      for (const b of buttons) b.disabled = !ok;
      const check = doc ? auditDoc(doc, audience) : { ok: true, problems: [] };
      status.textContent = ok
        ? check.ok
          ? ""
          : check.problems.join(" ")
        : "Choose a resource, grade and content to enable printing.";
    },
  };
}
