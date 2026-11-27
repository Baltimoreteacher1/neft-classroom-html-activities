// The `diagram` block: a figure redrawn from its stored spec (never from stored SVG), with the data table as the
// keyboard-reachable, non-visual alternative. The SVG is parsed as XML and imported, never assigned with
// innerHTML, and anything that is not plain drawing (script, foreignObject, event attributes) is refused.

import { renderDiagram } from "../x/diagram-render.js";
import { h, nid, rt } from "./util.js";

const SVG_MIME = "image/svg+xml";

/** An SVG element for generated markup, or null when it does not parse or holds anything but drawing. */
function svgElement(markup) {
  const doc = new DOMParser().parseFromString(markup, SVG_MIME);
  const root = doc.documentElement;
  if (!root || root.localName !== "svg" || doc.querySelector("parsererror")) return null;
  const unsafe = [root, ...root.querySelectorAll("*")].some(
    (el) =>
      /^(script|foreignobject|iframe|object|embed|a)$/i.test(el.localName) ||
      [...el.attributes].some((a) => /^on/i.test(a.name) || /^(href|xlink:href)$/i.test(a.name)),
  );
  return unsafe ? null : document.importNode(root, true);
}

function dataTable(table, caption) {
  const t = h("table", { class: "sp-table" });
  if (caption) t.append(rt("caption", "", caption));
  t.append(
    h("thead", null, h("tr", null, ...table.headers.map((x) => h("th", { scope: "col" }, x)))),
    h("tbody", null, ...table.rows.map((r) => h("tr", null, ...r.map((c) => h("td", null, c))))),
  );
  return h("div", { class: "sp-table-wrap", tabindex: "0", role: "region", "aria-label": caption }, t);
}

/** Registered in blocks.js. English figure for "en" and "bi", Spanish for "es"; "bi" adds the Spanish caption. */
export function diagramBlock(b, ctx) {
  const lang = ctx.lang === "es" ? "es" : "en";
  const shown = renderDiagram(b, { lang, suffix: b.id });
  const art = shown.ok ? svgElement(shown.svg) : null;
  if (!art) return h("p", { class: "sp-note-small", role: "note" }, ctx.msg("diagramMissing"));
  art.removeAttribute("width");
  art.removeAttribute("height");
  const fig = h("figure", { class: "sp-diagram" }, h("div", { class: "sp-diagram-art" }, art));
  const caption = rt("figcaption", "", shown.caption);
  if (ctx.lang === "bi") {
    const es = renderDiagram(b, { lang: "es", suffix: b.id });
    if (es.ok && es.caption !== shown.caption)
      caption.append(" ", h("span", { class: "sp-es", lang: "es" }, es.caption));
  }
  fig.append(caption);
  const bodyId = nid("dgt");
  fig.append(
    h(
      "details",
      { class: "sp-diagram-data" },
      h("summary", { "aria-controls": bodyId }, ctx.msg("diagramData")),
      h("div", { id: bodyId }, dataTable(shown.table, shown.caption)),
    ),
  );
  return fig;
}
