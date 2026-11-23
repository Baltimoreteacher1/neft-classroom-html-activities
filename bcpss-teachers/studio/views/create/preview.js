// Live preview of the resource, drawn by the same renderer that prints it. Text is editable in place; blocks and pages
// can be moved, removed and extended. Edits change the working document, so print, Word and text copy all carry them.
import { announce, h } from "../../core/dom.js";
import { icon } from "../../core/ui.js";
import { AUDIENCES, REVIEW_SHORT } from "../../print/export.js";
import { renderDoc } from "../../print/html.js";
import {
  addLine,
  locate,
  moveBlock,
  movePage,
  removeBlock,
  removePage,
  setText,
} from "../../print/ir.js";

const MM_PX = 96 / 25.4;
const ZOOMS = [
  { v: "fit", label: "Fit to width" },
  { v: "1", label: "100%" },
  { v: "0.75", label: "75%" },
  { v: "0.5", label: "50%" },
];
const BLOCK_NAME = {
  title: "title",
  h: "heading",
  p: "paragraph",
  list: "list",
  check: "checklist",
  lines: "writing lines",
  box: "writing box",
  frames: "sentence frames",
  bank: "word bank",
  visual: "picture",
  table: "table",
  cards: "cards",
  fold: "foldable",
  sep: "divider",
  namebar: "name line",
  trace: "tracing lines",
  spacer: "space",
  row: "columns",
};

export function createPreview({ onEdit = () => {} } = {}) {
  const s = {
    doc: null,
    audience: "student",
    sel: "",
    zoom: "fit",
    edited: false,
    renderVisual: null,
    over: "",
  };
  const el = h("section", { class: "st-cr-preview", "aria-labelledby": "st-cr-pv-h" });
  const status = h("p", { class: "st-hint", role: "status" });
  const stage = h("div", {
    class: "st-cr-stage",
    tabindex: "0",
    role: "region",
    "aria-label": "Resource preview. Scroll to see every page.",
  });
  const overWarn = h("p", { class: "st-notice", role: "status", hidden: true });
  const selInfo = h(
    "span",
    { class: "st-cr-selinfo", "aria-live": "polite" },
    "Click any part of a page to select it.",
  );

  const btn = (label, ic, fn, extra = {}) => {
    const b = h(
      "button",
      { class: "st-btn st-btn-quiet", type: "button", ...extra },
      ic ? icon(ic, 18) : null,
      label,
    );
    b.addEventListener("click", fn);
    return b;
  };
  const audienceBtns = AUDIENCES.map((a) => {
    const b = h(
      "button",
      {
        class: "st-pick",
        type: "button",
        "aria-pressed": String(a.v === s.audience),
        dataset: { audience: a.v },
      },
      a.label,
    );
    b.addEventListener("click", () => {
      s.audience = a.v;
      s.sel = "";
      for (const x of audienceBtns)
        x.setAttribute("aria-pressed", String(x.dataset.audience === s.audience));
      paint();
      announce(`Showing the ${a.label.toLowerCase()}.`);
    });
    return b;
  });
  const zoomSel = h(
    "select",
    { id: "st-cr-zoom" },
    ZOOMS.map((z) => h("option", { value: z.v }, z.label)),
  );
  zoomSel.addEventListener("change", () => {
    s.zoom = zoomSel.value;
    applyZoom();
  });

  const tools = {
    prev: btn("Previous part", "up", () => step(-1)),
    next: btn("Next part", "down", () => step(1)),
    up: btn("Move up", "up", () => edit(() => moveBlock(s.doc, s.sel, -1), "Moved up.")),
    down: btn("Move down", "down", () => edit(() => moveBlock(s.doc, s.sel, 1), "Moved down.")),
    line: btn("Add a line", "plus", () => edit(() => addLine(s.doc, s.sel), "Added a line.")),
    remove: btn("Remove part", "trash", () =>
      edit(() => removeBlock(s.doc, s.sel), "Removed.", true),
    ),
    pageUp: btn("Page earlier", "up", () => pageEdit(-1)),
    pageDown: btn("Page later", "down", () => pageEdit(1)),
    pageRemove: btn("Remove page", "trash", () => pageEdit(0)),
  };
  const bar = h(
    "div",
    { class: "st-cr-bar" },
    h(
      "div",
      { class: "st-cr-bar-row", role: "group", "aria-label": "Which copy to show" },
      audienceBtns,
      h("label", { class: "st-cr-zoom", for: "st-cr-zoom" }, "Zoom ", zoomSel),
    ),
    h(
      "div",
      { class: "st-cr-bar-row", role: "toolbar", "aria-label": "Edit the selected part" },
      tools.prev,
      tools.next,
      tools.up,
      tools.down,
      tools.line,
      tools.remove,
      tools.pageUp,
      tools.pageDown,
      tools.pageRemove,
      selInfo,
    ),
  );
  el.append(
    h("h2", { id: "st-cr-pv-h" }, "Preview", h("span", { class: "st-cr-review" }, REVIEW_SHORT)),
    h(
      "p",
      { class: "st-hint" },
      "Click text to edit it. Changes here go into every print and download. Do not type student names.",
    ),
    bar,
    overWarn,
    status,
    stage,
  );

  const kinds = () => (s.audience === "teacher" ? null : ["cover", "student"]);
  const blockEls = () => [...stage.querySelectorAll(".st-x-b")];

  function applyZoom() {
    const docEl = stage.querySelector(".st-x-doc");
    if (!docEl) return;
    const wMm = Number.parseFloat(docEl.style.getPropertyValue("--x-pw")) || 216;
    const fit = Math.min(1, (stage.clientWidth - 24) / (wMm * MM_PX));
    docEl.style.zoom = String(s.zoom === "fit" ? Math.max(0.3, fit) : Number(s.zoom));
  }

  function checkOverflow() {
    const over = [];
    for (const pg of stage.querySelectorAll(".st-x-page")) {
      const body = pg.querySelector(".st-x-body");
      const bad = body.scrollHeight > body.clientHeight + 1;
      pg.classList.toggle("is-over", bad);
      if (bad) over.push(pg.dataset.page);
    }
    const msg = over.length
      ? `Page ${over.join(", ")} ${over.length === 1 ? "has" : "have"} more content than fits. Shorten the text or remove a part before printing.`
      : "";
    overWarn.hidden = !msg;
    overWarn.textContent = msg;
    if (msg !== s.over) {
      s.over = msg;
      if (msg) announce(msg);
    }
  }

  function markSelection() {
    for (const b of stage.querySelectorAll(".is-sel")) b.classList.remove("is-sel");
    const node = s.sel ? stage.querySelector(`.st-x-b[data-bid="${s.sel}"]`) : null;
    if (s.sel && !node) s.sel = "";
    node?.classList.add("is-sel");
    const hit = s.sel && s.doc ? locate(s.doc, s.sel) : null;
    const page = node?.closest(".st-x-page")?.dataset.page;
    selInfo.textContent = hit
      ? `Selected: ${BLOCK_NAME[hit.block.type] || hit.block.type}, page ${page}`
      : "Click any part of a page to select it.";
    for (const k of ["up", "down", "line", "remove", "pageUp", "pageDown", "pageRemove"])
      tools[k].disabled = !hit;
    tools.prev.disabled = tools.next.disabled = !blockEls().length;
  }

  function paint() {
    if (!s.doc) return;
    const keep = stage.scrollTop;
    const { html, pages } = renderDoc(s.doc, {
      audience: s.audience,
      edit: true,
      renderVisual: s.renderVisual,
    });
    stage.innerHTML = html;
    status.textContent = `${pages} page${pages === 1 ? "" : "s"} in the ${s.audience === "teacher" ? "teacher" : "student"} copy.${s.renderVisual ? "" : " Pictures are not available right now, so empty frames mark where they go."}`;
    applyZoom();
    markSelection();
    checkOverflow();
    stage.scrollTop = keep;
  }

  function select(id, { scroll = false } = {}) {
    s.sel = id;
    markSelection();
    if (scroll)
      stage.querySelector(`.st-x-b[data-bid="${id}"]`)?.scrollIntoView({ block: "center" });
  }

  function step(dir) {
    const list = blockEls();
    if (!list.length) return;
    const at = list.findIndex((b) => b.dataset.bid === s.sel);
    const next =
      list[at < 0 ? (dir > 0 ? 0 : list.length - 1) : (at + dir + list.length) % list.length];
    select(next.dataset.bid, { scroll: true });
    announce(selInfo.textContent);
  }

  function edit(fn, message, clears = false) {
    if (!s.sel || !fn()) return announce("That change is not possible here.");
    s.edited = true;
    if (clears) s.sel = "";
    paint();
    onEdit();
    announce(message);
  }

  function pageEdit(dir) {
    const pid = stage.querySelector(`.st-x-b[data-bid="${s.sel}"]`)?.closest(".st-x-page")
      ?.dataset.pid;
    if (!pid) return;
    const ok = dir === 0 ? removePage(s.doc, pid) : movePage(s.doc, pid, dir);
    if (!ok)
      return announce(
        dir === 0 ? "The last page cannot be removed." : "That page cannot move further.",
      );
    s.edited = true;
    if (dir === 0) s.sel = "";
    paint();
    onEdit();
    announce(dir === 0 ? "Page removed." : "Page moved.");
  }

  stage.addEventListener("click", (e) => {
    const b = e.target.closest(".st-x-b");
    if (b) select(b.dataset.bid);
  });
  stage.addEventListener("focusin", (e) => {
    const b = e.target.closest?.(".st-x-b");
    if (b) select(b.dataset.bid);
  });
  stage.addEventListener("focusout", (e) => {
    const t = e.target;
    if (!t.matches?.("[data-path]")) return;
    const text = t.textContent;
    if (text.replace(/\s+/g, " ").trim() === (t.dataset.was ?? text).replace(/\s+/g, " ").trim())
      return;
    if (setText(s.doc, t.dataset.path, text)) {
      s.edited = true;
      t.dataset.was = text;
      checkOverflow();
      onEdit();
    }
  });
  stage.addEventListener("focusin", (e) => {
    if (e.target.matches?.("[data-path]")) e.target.dataset.was = e.target.textContent;
  });
  stage.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches?.("[data-path]")) {
      e.preventDefault();
      e.target.blur();
    }
  });
  stage.addEventListener("paste", (e) => {
    if (!e.target.matches?.("[data-path]")) return;
    e.preventDefault();
    const text = (e.clipboardData?.getData("text/plain") || "").replace(/\s+/g, " ");
    stage.ownerDocument.execCommand("insertText", false, text);
  });
  const ro =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(() => s.zoom === "fit" && applyZoom())
      : null;
  ro?.observe(stage);

  return {
    el,
    /** Show a working document. `renderVisual` is core/visuals.js renderVisual, or null. */
    show(doc, { renderVisual = null } = {}) {
      s.doc = doc;
      s.renderVisual = renderVisual;
      s.edited = false;
      s.sel = "";
      el.hidden = false;
      paint();
    },
    hide() {
      s.doc = null;
      s.edited = false;
      stage.replaceChildren();
      el.hidden = true;
    },
    hasEdits: () => s.edited,
    doc: () => s.doc,
    audience: () => s.audience,
    destroy: () => ro?.disconnect(),
  };
}
