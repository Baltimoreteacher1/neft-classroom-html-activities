// Tiny DOM builders for the Predictive Intelligence workspace. Every string becomes a text node, so
// student names, notes and imported values are always data, never markup (no innerHTML anywhere).

const SVG_NS = "http://www.w3.org/2000/svg";

function apply(el, props = {}) {
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.setAttribute("class", v);
    else if (k === "text") el.textContent = String(v);
    else if (k === "on") for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
    else if (k === "value" && "value" in el) el.value = String(v);
    else if (k === "checked" || k === "selected" || k === "disabled" || k === "hidden")
      el[k] = Boolean(v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  return el;
}

function append(el, kids) {
  for (const kid of kids.flat(Infinity)) {
    if (kid === null || kid === undefined || kid === false || kid === "") continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

/** h("p", { class: "x" }, "text", child) */
export const h = (tag, props, ...kids) => append(apply(document.createElement(tag), props), kids);
/** s("rect", { x: 1 }) — SVG element. */
export const s = (tag, props, ...kids) =>
  append(apply(document.createElementNS(SVG_NS, tag), props), kids);

export function clear(el) {
  while (el.firstChild) el.firstChild.remove();
  return el;
}

/** Plain-language tooltip: a disclosure with a 44px target, readable by keyboard and screen readers. */
export function tip(label, text) {
  return h(
    "details",
    { class: "pi-tip" },
    h(
      "summary",
      { "aria-label": `What does "${label}" mean?` },
      h("span", { "aria-hidden": "true" }, "?"),
    ),
    h("p", { class: "pi-tip-body" }, text),
  );
}

/** A table from headers and rows of cells (strings or nodes). */
export function table(caption, headers, rows, { className = "pi-table" } = {}) {
  return h(
    "div",
    { class: "pi-table-wrap", role: "region", "aria-label": caption, tabindex: "0" },
    h(
      "table",
      { class: className },
      h("caption", {}, caption),
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          headers.map((x) => h("th", { scope: "col" }, x)),
        ),
      ),
      h(
        "tbody",
        {},
        rows.map((r) =>
          h(
            "tr",
            {},
            r.map((c, i) => (i === 0 ? h("th", { scope: "row" }, c) : h("td", {}, c))),
          ),
        ),
      ),
    ),
  );
}

export const fmt1 = (x) => (x == null || !Number.isFinite(x) ? "—" : x.toFixed(1));
export const pct = (x) => (x == null || !Number.isFinite(x) ? "—" : `${Math.round(x * 100)}%`);

/** Advanced-only block: hidden while the workspace is in Quick view. */
export const adv = (...kids) => h("div", { class: "pi-adv" }, ...kids);
