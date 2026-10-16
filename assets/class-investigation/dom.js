// Our Class Investigation — a tiny element builder.
//
// Everything on the page is built with createElement + textContent, never by
// concatenating HTML, so a value that somehow reached the page (it cannot carry
// markup: fields are numbers and fixed ids, but the habit is the defense) is text.
// The only innerHTML in this feature is the chart SVG, which charts.js builds
// from escaped labels and numbers.

/**
 * @param {string} tag
 * @param {Record<string, unknown>} [attrs]  class, text, on<Event>, or any attribute
 * @param {...(Node|string|null|false|undefined)} kids
 */
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs ?? {})) {
    if (val === null || val === undefined || val === false) continue;
    if (key === "class") el.className = String(val);
    else if (key === "text") el.textContent = String(val);
    else if (key.startsWith("on") && typeof val === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (key === "value" || key === "checked" || key === "disabled" || key === "hidden") {
      el[key] = val;
    } else el.setAttribute(key, val === true ? "" : String(val));
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(typeof kid === "string" ? document.createTextNode(kid) : kid);
  }
  return el;
}

/** Replace all children of `host`. */
export function mount(host, ...kids) {
  host.replaceChildren(...kids.flat().filter(Boolean));
  return host;
}

/** Announce to screen readers through a polite live region. */
export function announce(region, text) {
  region.textContent = "";
  // A second tick makes screen readers re-read an identical message.
  setTimeout(() => {
    region.textContent = text;
  }, 30);
}
